package remoteexecution

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"mime"
	"strings"
	"time"

	backendenvironment "github.com/Prodivix/prodivix/apps/backend/internal/modules/environment"
)

const (
	maximumDataGatewayStreamEvents      = 256
	maximumDataGatewayStreamFrameBytes  = 256 * 1024
	maximumDataGatewayStreamBytes       = 4 * 1024 * 1024
	maximumDataGatewayStreamDuration    = 5 * time.Minute
	maximumDataGatewayStreamIdle        = 30 * time.Second
	maximumConcurrentDataGatewayStreams = 32
)

type DataGatewayStreamEvent struct {
	Cursor int64 `json:"cursor"`
	Value  any   `json:"value"`
}

type DataGatewayStreamSession struct {
	Network dataGatewayNetworkTrace

	body       io.ReadCloser
	scanner    *bufio.Scanner
	mediaType  string
	adapter    string
	mapFrame   func(string) (any, error)
	openedAt   time.Time
	cursor     int64
	totalBytes int64
	closed     bool
	release    func()
}

type dataGatewayRawStreamFrame struct {
	data     string
	complete bool
	err      error
}

func (gateway *DataGateway) claimStream(identity string) (func(), error) {
	gateway.streamMu.Lock()
	defer gateway.streamMu.Unlock()
	if _, exists := gateway.activeStreams[identity]; exists {
		return nil, ErrDataGatewayStreamConflict
	}
	if len(gateway.activeStreams) >= maximumConcurrentDataGatewayStreams {
		return nil, ErrDataGatewayStreamCapacity
	}
	gateway.activeStreams[identity] = struct{}{}
	return func() {
		gateway.streamMu.Lock()
		delete(gateway.activeStreams, identity)
		gateway.streamMu.Unlock()
	}, nil
}

func streamMediaType(value string) (string, bool) {
	mediaType, _, err := mime.ParseMediaType(value)
	if err != nil || (mediaType != "text/event-stream" && mediaType != "application/x-ndjson" && mediaType != "application/ndjson") {
		return "", false
	}
	return mediaType, true
}

func streamScanner(body io.Reader) *bufio.Scanner {
	scanner := bufio.NewScanner(body)
	scanner.Buffer(make([]byte, 4096), maximumDataGatewayStreamFrameBytes+1)
	return scanner
}

func readNDJSONFrame(scanner *bufio.Scanner) dataGatewayRawStreamFrame {
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		return dataGatewayRawStreamFrame{data: line}
	}
	if err := scanner.Err(); err != nil {
		return dataGatewayRawStreamFrame{err: ErrDataGatewayUpstream}
	}
	return dataGatewayRawStreamFrame{complete: true}
}

func readSSEFrame(scanner *bufio.Scanner) dataGatewayRawStreamFrame {
	eventType := "message"
	dataLines := make([]string, 0, 2)
	bytesRead := 0
	for scanner.Scan() {
		line := strings.TrimSuffix(scanner.Text(), "\r")
		if line == "" {
			if eventType == "complete" {
				return dataGatewayRawStreamFrame{complete: true}
			}
			if len(dataLines) > 0 {
				return dataGatewayRawStreamFrame{data: strings.Join(dataLines, "\n")}
			}
			eventType = "message"
			continue
		}
		if strings.HasPrefix(line, ":") {
			continue
		}
		name, value, found := strings.Cut(line, ":")
		if found {
			value = strings.TrimPrefix(value, " ")
		}
		switch name {
		case "event":
			eventType = value
		case "data":
			bytesRead += len(value)
			if bytesRead > maximumDataGatewayStreamFrameBytes {
				return dataGatewayRawStreamFrame{err: ErrDataGatewayUpstream}
			}
			dataLines = append(dataLines, value)
		}
	}
	if err := scanner.Err(); err != nil {
		return dataGatewayRawStreamFrame{err: ErrDataGatewayUpstream}
	}
	if eventType == "complete" {
		return dataGatewayRawStreamFrame{complete: true}
	}
	if len(dataLines) > 0 {
		return dataGatewayRawStreamFrame{data: strings.Join(dataLines, "\n")}
	}
	return dataGatewayRawStreamFrame{complete: true}
}

func (session *DataGatewayStreamSession) Close() error {
	if session == nil || session.closed {
		return nil
	}
	session.closed = true
	if session.release != nil {
		session.release()
		session.release = nil
	}
	return session.body.Close()
}

func (session *DataGatewayStreamSession) Next(ctx context.Context) (*DataGatewayStreamEvent, bool, error) {
	if session == nil || session.closed {
		return nil, true, nil
	}
	if time.Since(session.openedAt) >= maximumDataGatewayStreamDuration || session.cursor >= maximumDataGatewayStreamEvents {
		_ = session.Close()
		return nil, true, ErrDataGatewayStreamCapacity
	}
	result := make(chan dataGatewayRawStreamFrame, 1)
	go func() {
		if session.mediaType == "text/event-stream" {
			result <- readSSEFrame(session.scanner)
		} else {
			result <- readNDJSONFrame(session.scanner)
		}
	}()
	var raw dataGatewayRawStreamFrame
	select {
	case <-ctx.Done():
		_ = session.Close()
		return nil, true, ctx.Err()
	case <-time.After(maximumDataGatewayStreamIdle):
		_ = session.Close()
		return nil, true, ErrDataGatewayUpstream
	case raw = <-result:
	}
	if raw.err != nil {
		_ = session.Close()
		return nil, true, raw.err
	}
	if raw.complete {
		_ = session.Close()
		return nil, true, nil
	}
	session.totalBytes += int64(len([]byte(raw.data)))
	if session.totalBytes > maximumDataGatewayStreamBytes {
		_ = session.Close()
		return nil, true, ErrDataGatewayStreamCapacity
	}
	value, err := session.mapFrame(raw.data)
	if err != nil {
		_ = session.Close()
		return nil, true, err
	}
	session.cursor++
	return &DataGatewayStreamEvent{Cursor: session.cursor, Value: value}, false, nil
}

func graphQLStreamMapper(operation dataGatewayOperation, snapshot *backendenvironment.Snapshot, bindings map[string]dataConfigurationValue) (func(string) (any, error), error) {
	resultPath, err := optionalDataGatewayString(operation.ConfigurationByKey, "resultPath", "operation.resultPath", snapshot, bindings, "")
	if err != nil || (resultPath != "" && !isDataGatewayJSONPointer(resultPath)) {
		return nil, ErrDataGatewayDenied
	}
	partialPolicy, err := optionalDataGatewayString(operation.ConfigurationByKey, "partialErrorPolicy", "operation.partialErrorPolicy", snapshot, bindings, "reject")
	if err != nil || (partialPolicy != "reject" && partialPolicy != "allow-partial") {
		return nil, ErrDataGatewayDenied
	}
	return func(frame string) (any, error) {
		decoded, decodeErr := decodeDataGatewayJSON([]byte(frame))
		if decodeErr != nil {
			return nil, ErrDataGatewayGraphQLUpstream
		}
		envelope, ok := decoded.(map[string]any)
		if !ok {
			return nil, ErrDataGatewayGraphQLUpstream
		}
		if payload, exists := envelope["payload"].(map[string]any); exists {
			envelope = payload
		}
		if errorsValue, exists := envelope["errors"]; exists {
			errorsList, valid := errorsValue.([]any)
			if !valid || len(errorsList) > maximumGraphQLErrors || (len(errorsList) > 0 && partialPolicy == "reject") {
				return nil, ErrDataGatewayGraphQLUpstream
			}
			for _, item := range errorsList {
				record, valid := item.(map[string]any)
				message, hasMessage := record["message"].(string)
				if !valid || !hasMessage || message == "" {
					return nil, ErrDataGatewayGraphQLUpstream
				}
			}
		}
		value, exists := envelope["data"]
		if !exists {
			return nil, ErrDataGatewayGraphQLUpstream
		}
		if resultPath != "" {
			var found bool
			value, found, decodeErr = dataGatewayPointer(value, resultPath)
			if decodeErr != nil || !found {
				return nil, ErrDataGatewayGraphQLUpstream
			}
		}
		return value, nil
	}, nil
}

func asyncAPIStreamMapper(operation dataGatewayOperation, snapshot *backendenvironment.Snapshot, bindings map[string]dataConfigurationValue) (func(string) (any, error), error) {
	responsePath, err := optionalDataGatewayString(operation.ConfigurationByKey, "responseBodyPath", "operation.responseBodyPath", snapshot, bindings, "")
	if err != nil || (responsePath != "" && !isDataGatewayJSONPointer(responsePath)) {
		return nil, ErrDataGatewayDenied
	}
	return func(frame string) (any, error) {
		value, decodeErr := decodeDataGatewayJSON([]byte(frame))
		if decodeErr != nil {
			return nil, ErrDataGatewayAsyncAPIUpstream
		}
		if responsePath != "" {
			var found bool
			value, found, decodeErr = dataGatewayPointer(value, responsePath)
			if decodeErr != nil || !found {
				return nil, ErrDataGatewayAsyncAPIUpstream
			}
		}
		return value, nil
	}, nil
}

// OpenStream creates one public, execution-bound subscription. Secret-authenticated streams remain denied because material cannot outlive the authorization callback.
func (gateway *DataGateway) OpenStream(ctx context.Context, principal backendenvironment.PrincipalSession, executionID string, documentID string, operationID string, invocation DataGatewayInvocation) (*DataGatewayStreamSession, error) {
	if !gateway.Available() || gateway.streams == nil {
		return nil, ErrDataGatewayUnavailable
	}
	executionID, executionOK := normalizedDataGatewayID(executionID)
	documentID, documentOK := normalizedDataGatewayID(documentID)
	operationID, operationOK := normalizedDataGatewayID(operationID)
	invocationID, invocationOK := normalizedDataGatewayID(invocation.InvocationID)
	if !executionOK || !documentOK || !operationOK || !invocationOK || invocation.Sequence < 0 || invocation.Attempt != 1 {
		return nil, ErrDataGatewayInvalidRequest
	}
	authority, err := gateway.store.GetExecutionAuthority(ctx, principal.PrincipalID, principal.SessionID, executionID)
	if err != nil || authority.ProviderID != "prodivix.remote.preview" || authority.Profile != "preview" || authority.RuntimeZone != "client" || authority.Environment == nil || authority.Environment.Mode != "live" || authority.SessionID != principal.SessionID || !hasWorkspaceExecutionPermission(authority.Permissions, workspaceReadPermissionID) {
		return nil, ErrDataGatewayDenied
	}
	contents, err := gateway.store.GetDataSourceDocument(ctx, *authority, documentID)
	if err != nil {
		return nil, ErrDataGatewayDenied
	}
	document, operation, err := parseDataGatewayDocument(contents, documentID, operationID)
	if err != nil || operation.Kind != "subscription" || len(operation.ConfigurationByKey) == 0 || operation.Policies.Retry != nil || operation.Policies.Idempotency != nil {
		return nil, ErrDataGatewayDenied
	}
	if document.Source.AdapterID != "core.graphql" && document.Source.AdapterID != "core.asyncapi" {
		return nil, ErrDataGatewayDenied
	}
	if _, sourceAuth := document.Source.ConfigurationByKey["authorization"]; sourceAuth {
		return nil, ErrDataGatewayDenied
	}
	if _, operationAuth := operation.ConfigurationByKey["authorization"]; operationAuth {
		return nil, ErrDataGatewayDenied
	}
	snapshot, err := gateway.environments.GetSnapshot(ctx, principal, authority.WorkspaceID, authority.Environment.EnvironmentID, authority.Environment.Revision)
	if err != nil || snapshot.Mode != "live" || snapshot.WorkspaceID != authority.WorkspaceID || snapshot.EnvironmentID != authority.Environment.EnvironmentID || snapshot.Revision != authority.Environment.Revision {
		return nil, ErrDataGatewayDenied
	}
	input, err := decodeInvocationInput(invocation.Input)
	if err != nil {
		return nil, err
	}
	identity := strings.Join([]string{executionID, documentID, operationID, invocationID}, "\x00")
	release, err := gateway.claimStream(identity)
	if err != nil {
		return nil, err
	}
	releaseOnError := true
	defer func() {
		if releaseOnError {
			release()
		}
	}()
	var request DataGatewayTransportRequest
	var mapper func(string) (any, error)
	if document.Source.AdapterID == "core.graphql" {
		endpointText, resolveErr := resolvePublicString(document.Source.ConfigurationByKey["endpoint"], "source.endpoint", snapshot, document.Source.BindingsByID)
		if resolveErr != nil {
			return nil, resolveErr
		}
		endpoint, endpointErr := dataGatewayProtocolEndpoint(endpointText)
		if endpointErr != nil {
			return nil, endpointErr
		}
		operationDocument, resolveErr := resolvePublicString(operation.ConfigurationByKey["document"], "operation.document", snapshot, document.Source.BindingsByID)
		operationName, nameErr := optionalDataGatewayString(operation.ConfigurationByKey, "operationName", "operation.operationName", snapshot, document.Source.BindingsByID, "")
		if resolveErr != nil || nameErr != nil || validateGraphQLOperationDocument(operationDocument, operationName, "subscription") != nil {
			return nil, ErrDataGatewayDenied
		}
		variables := input
		if pointer, exists := operation.ConfigurationByKey["variablesInputPath"]; exists {
			path, pathErr := resolvePublicString(pointer, "operation.variablesInputPath", snapshot, document.Source.BindingsByID)
			var found bool
			variables, found, err = dataGatewayPointer(input, path)
			if pathErr != nil || err != nil || !found {
				return nil, ErrDataGatewayInvalidRequest
			}
		}
		if _, ok := variables.(map[string]any); !ok {
			return nil, ErrDataGatewayInvalidRequest
		}
		envelope := map[string]any{"query": operationDocument, "variables": variables}
		if operationName != "" {
			envelope["operationName"] = operationName
		}
		body, marshalErr := json.Marshal(envelope)
		if marshalErr != nil || int64(len(body)) > maximumDataGatewayRequestBytes {
			return nil, ErrDataGatewayInvalidRequest
		}
		request = DataGatewayTransportRequest{URL: endpoint.String(), Method: "POST", Headers: map[string]string{"accept": "text/event-stream", "content-type": "application/json"}, Body: body}
		mapper, err = graphQLStreamMapper(*operation, snapshot, document.Source.BindingsByID)
	} else {
		baseURL, resolveErr := resolvePublicString(document.Source.ConfigurationByKey["endpoint"], "source.endpoint", snapshot, document.Source.BindingsByID)
		path, pathErr := resolvePublicString(operation.ConfigurationByKey["path"], "operation.path", snapshot, document.Source.BindingsByID)
		endpoint, endpointErr := dataGatewayEndpoint(baseURL, path)
		action, actionErr := resolvePublicString(operation.ConfigurationByKey["action"], "operation.action", snapshot, document.Source.BindingsByID)
		if resolveErr != nil || pathErr != nil || endpointErr != nil || actionErr != nil || (action != "receive" && action != "stream") {
			return nil, ErrDataGatewayDenied
		}
		request = DataGatewayTransportRequest{URL: endpoint.String(), Method: "GET", Headers: map[string]string{"accept": "text/event-stream, application/x-ndjson"}}
		if action == "stream" {
			body, marshalErr := json.Marshal(input)
			if marshalErr != nil || int64(len(body)) > maximumDataGatewayRequestBytes {
				return nil, ErrDataGatewayInvalidRequest
			}
			request.Method = "POST"
			request.Headers["content-type"] = "application/json"
			request.Body = body
		}
		mapper, err = asyncAPIStreamMapper(*operation, snapshot, document.Source.BindingsByID)
	}
	if err != nil {
		return nil, err
	}
	startedAt := gateway.now().UnixMilli()
	upstream, err := gateway.streams.OpenStream(ctx, request)
	if err != nil {
		if upstream != nil && upstream.Body != nil {
			_ = upstream.Body.Close()
		}
		return nil, ErrDataGatewayUpstream
	}
	if upstream == nil || upstream.Body == nil {
		return nil, ErrDataGatewayUpstream
	}
	if upstream.Status < 200 || upstream.Status >= 300 {
		upstream.Body.Close()
		return nil, ErrDataGatewayUpstream
	}
	mediaType, ok := streamMediaType(upstream.ContentType)
	if !ok {
		upstream.Body.Close()
		return nil, ErrDataGatewayDenied
	}
	completedAt := gateway.now().UnixMilli()
	if completedAt < startedAt {
		completedAt = startedAt
	}
	session := &DataGatewayStreamSession{
		body: upstream.Body, scanner: streamScanner(upstream.Body), mediaType: mediaType, adapter: document.Source.AdapterID, mapFrame: mapper,
		openedAt: gateway.now(), release: release,
		Network: dataGatewayNetworkTrace{
			Format: "prodivix.execution-network-trace.v1", RequestID: invocationID + ":stream", Phase: "runtime", RuntimeZone: document.Source.RuntimeZone, Mode: "live", Adapter: document.Source.AdapterID,
			Method: request.Method, SanitizedURL: func() string { parsed, _ := urlFromRequest(request.URL); return parsed }(), Protocol: "https", StartedAt: startedAt, CompletedAt: completedAt, DurationMS: completedAt - startedAt,
			Outcome: "allowed", Status: upstream.Status, RequestBytes: int64(len(request.Body)), Correlation: dataGatewayCorrelation{Kind: "data-operation", DocumentID: documentID, OperationID: operationID, InvocationID: invocationID, Sequence: invocation.Sequence, Attempt: invocation.Attempt},
			Redacted: true, SourceTrace: dataGatewayProtocolSourceTrace(documentID, operationID),
		},
	}
	releaseOnError = false
	return session, nil
}

func urlFromRequest(raw string) (string, error) {
	parsed, err := dataGatewayProtocolEndpoint(raw)
	if err != nil {
		return "", err
	}
	return parsed.Scheme + "://" + parsed.Host + "/", nil
}

func dataGatewayStreamErrorStatus(err error) (int, string, string) {
	switch {
	case errors.Is(err, ErrDataGatewayStreamConflict):
		return 409, "DATA_STREAM_CONFLICT", "Remote Data stream identity is already active."
	case errors.Is(err, ErrDataGatewayStreamCapacity):
		return 429, "DATA_STREAM_CAPACITY", "Remote Data stream budget is exhausted."
	default:
		return dataGatewayErrorStatus(err)
	}
}

func writeDataGatewayStreamRecord(writer io.Writer, value any) error {
	encoded, err := json.Marshal(value)
	if err != nil || len(encoded) > maximumDataGatewayStreamFrameBytes {
		return ErrDataGatewayUpstream
	}
	_, err = io.Copy(writer, bytes.NewReader(append(encoded, '\n')))
	return err
}
