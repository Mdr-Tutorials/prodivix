package workspace

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/Prodivix/prodivix/apps/backend/internal/platform/nodegraphcontract"
)

var ErrNodeGraphValidationFailed = errors.New("NodeGraph validation failed")

var defaultNodeGraphDocument = json.RawMessage(`{"version":1,"nodes":[],"edges":[]}`)

type nodeGraphWireDocument struct {
	Nodes []nodeGraphWireNode `json:"nodes"`
	Edges []nodeGraphWireEdge `json:"edges"`
}

type nodeGraphWireNode struct {
	ID       string                        `json:"id"`
	Data     map[string]json.RawMessage    `json:"data"`
	Ports    []nodeGraphWirePort           `json:"ports"`
	Executor *nodeGraphWireExecutorBinding `json:"executor"`
}

type nodeGraphWirePort struct {
	ID        string `json:"id"`
	Direction string `json:"direction"`
	Kind      string `json:"kind"`
	TypeRef   string `json:"typeRef"`
}

type nodeGraphWireExecutorBinding struct {
	Reference nodeGraphWireCodeReference `json:"reference"`
}

type nodeGraphWireCodeReference struct {
	ArtifactID string                   `json:"artifactId"`
	SourceSpan *nodeGraphWireSourceSpan `json:"sourceSpan"`
}

type nodeGraphWireSourceSpan struct {
	ArtifactID string `json:"artifactId"`
}

type nodeGraphWireEdge struct {
	ID           string  `json:"id"`
	Source       string  `json:"source"`
	Target       string  `json:"target"`
	SourceHandle *string `json:"sourceHandle"`
	TargetHandle *string `json:"targetHandle"`
}

type nodeGraphNodePorts struct {
	declared bool
	byID     map[string]nodeGraphWirePort
}

func validateNodeGraphDocument(payload json.RawMessage) error {
	if err := nodegraphcontract.ValidateDocument(payload); err != nil {
		return nodeGraphValidationError("%v", err)
	}

	var document nodeGraphWireDocument
	if err := json.Unmarshal(payload, &document); err != nil {
		return nodeGraphValidationError("/ must be a NodeGraph document")
	}

	nodesByID := make(map[string]nodeGraphNodePorts, len(document.Nodes))
	for index, node := range document.Nodes {
		path := fmt.Sprintf("/nodes/%d", index)
		if _, duplicate := nodesByID[node.ID]; duplicate {
			return nodeGraphValidationError("%s duplicates node id %q", path+"/id", node.ID)
		}

		ports := nodeGraphNodePorts{
			declared: node.Ports != nil,
			byID:     make(map[string]nodeGraphWirePort, len(node.Ports)),
		}
		for portIndex, port := range node.Ports {
			if _, duplicate := ports.byID[port.ID]; duplicate {
				return nodeGraphValidationError(
					"%s duplicates port id %q",
					fmt.Sprintf("%s/ports/%d/id", path, portIndex),
					port.ID,
				)
			}
			ports.byID[port.ID] = port
		}
		nodesByID[node.ID] = ports

		if node.Executor != nil && node.Executor.Reference.SourceSpan != nil &&
			node.Executor.Reference.SourceSpan.ArtifactID != node.Executor.Reference.ArtifactID {
			return nodeGraphValidationError(
				"%s must use the referenced artifact",
				path+"/executor/reference/sourceSpan/artifactId",
			)
		}
		if nodeGraphDataKind(node.Data) == "code" {
			if _, embedded := node.Data["code"]; embedded {
				return nodeGraphValidationError("%s must bind source through executor", path+"/data/code")
			}
			if _, embedded := node.Data["codeLanguage"]; embedded {
				return nodeGraphValidationError("%s must bind source through executor", path+"/data/codeLanguage")
			}
		}
	}

	edgeIDs := make(map[string]struct{}, len(document.Edges))
	for index, edge := range document.Edges {
		path := fmt.Sprintf("/edges/%d", index)
		if _, duplicate := edgeIDs[edge.ID]; duplicate {
			return nodeGraphValidationError("%s duplicates edge id %q", path+"/id", edge.ID)
		}
		edgeIDs[edge.ID] = struct{}{}

		sourcePorts, sourceExists := nodesByID[edge.Source]
		if !sourceExists {
			return nodeGraphValidationError("%s references unknown node %q", path+"/source", edge.Source)
		}
		targetPorts, targetExists := nodesByID[edge.Target]
		if !targetExists {
			return nodeGraphValidationError("%s references unknown node %q", path+"/target", edge.Target)
		}

		sourcePort, hasSourcePort, err := resolveNodeGraphEdgePort(
			sourcePorts,
			edge.SourceHandle,
			"output",
			path+"/sourceHandle",
		)
		if err != nil {
			return err
		}
		targetPort, hasTargetPort, err := resolveNodeGraphEdgePort(
			targetPorts,
			edge.TargetHandle,
			"input",
			path+"/targetHandle",
		)
		if err != nil {
			return err
		}
		if hasSourcePort && hasTargetPort &&
			(sourcePort.Kind != targetPort.Kind ||
				(sourcePort.TypeRef != "" && targetPort.TypeRef != "" && sourcePort.TypeRef != targetPort.TypeRef)) {
			return nodeGraphValidationError("%s connects incompatible ports", path)
		}
	}
	return nil
}

func nodeGraphDataKind(data map[string]json.RawMessage) string {
	var kind string
	if rawKind, exists := data["kind"]; exists {
		_ = json.Unmarshal(rawKind, &kind)
	}
	return kind
}

func resolveNodeGraphEdgePort(
	ports nodeGraphNodePorts,
	handle *string,
	direction string,
	path string,
) (nodeGraphWirePort, bool, error) {
	if !ports.declared || handle == nil {
		return nodeGraphWirePort{}, false, nil
	}
	port, exists := ports.byID[*handle]
	if !exists || port.Direction != direction {
		return nodeGraphWirePort{}, false, nodeGraphValidationError(
			"%s references unknown %s port %q",
			path,
			direction,
			*handle,
		)
	}
	return port, true, nil
}

func decodeNodeGraphCanonicalString(payload json.RawMessage, path string) (string, error) {
	var value string
	if err := json.Unmarshal(payload, &value); err != nil || value == "" || value != strings.TrimSpace(value) {
		return "", nodeGraphValidationError("%s must be a canonical non-empty string", path)
	}
	return value, nil
}

func isJSONObject(payload json.RawMessage) bool {
	trimmed := bytes.TrimSpace(payload)
	return len(trimmed) > 1 && trimmed[0] == '{'
}

func isJSONArray(payload json.RawMessage) bool {
	trimmed := bytes.TrimSpace(payload)
	return len(trimmed) > 1 && trimmed[0] == '['
}

func nodeGraphValidationError(format string, args ...any) error {
	return fmt.Errorf("%w: %s", ErrNodeGraphValidationFailed, fmt.Sprintf(format, args...))
}
