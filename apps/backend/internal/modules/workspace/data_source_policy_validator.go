package workspace

import "encoding/json"

func validateDataOperationPolicies(kind string, policies map[string]json.RawMessage, path string) error {
	if kind == "query" {
		if _, exists := policies["optimistic"]; exists {
			return dataSourceValidationError("%s/optimistic is available only to mutations", path)
		}
	} else {
		if _, exists := policies["cache"]; exists {
			return dataSourceValidationError("%s/cache is available only to queries", path)
		}
		if _, exists := policies["pagination"]; exists {
			return dataSourceValidationError("%s/pagination is available only to queries", path)
		}
	}
	if cache, exists := policies["cache"]; exists {
		if err := validateDataCachePolicy(cache, path+"/cache"); err != nil {
			return err
		}
	}
	if retry, exists := policies["retry"]; exists {
		if err := validateDataRetryPolicy(retry, path+"/retry"); err != nil {
			return err
		}
	}
	if pagination, exists := policies["pagination"]; exists {
		if err := validateDataPaginationPolicy(pagination, path+"/pagination"); err != nil {
			return err
		}
	}
	if optimistic, exists := policies["optimistic"]; exists {
		if err := validateDataOptimisticPolicy(optimistic, path+"/optimistic"); err != nil {
			return err
		}
	}
	return nil
}

func validateDataCachePolicy(payload json.RawMessage, path string) error {
	fields, err := decodeDataObject(payload, path, []string{"strategy"}, []string{"ttlMs", "staleWhileRevalidateMs", "keyInputPaths"})
	if err != nil {
		return err
	}
	strategy, err := decodeDataCanonicalString(fields["strategy"], path+"/strategy")
	if err != nil {
		return err
	}
	if strategy != "no-store" && strategy != "cache-first" && strategy != "network-first" && strategy != "stale-while-revalidate" {
		return dataSourceValidationError("%s/strategy is unsupported", path)
	}
	for _, field := range []string{"ttlMs", "staleWhileRevalidateMs"} {
		if value, exists := fields[field]; exists {
			if _, err := decodeDataInteger(value, path+"/"+field, 0); err != nil {
				return err
			}
		}
	}
	if paths, exists := fields["keyInputPaths"]; exists {
		return validateUniqueDataStringArray(paths, path+"/keyInputPaths")
	}
	return nil
}

func validateUniqueDataStringArray(payload json.RawMessage, path string) error {
	if err := validateDataStringArray(payload, path); err != nil {
		return err
	}
	var values []string
	if err := json.Unmarshal(payload, &values); err != nil {
		return dataSourceValidationError("%s must be an array", path)
	}
	seen := make(map[string]struct{}, len(values))
	for _, value := range values {
		if _, duplicate := seen[value]; duplicate {
			return dataSourceValidationError("%s values must be unique", path)
		}
		seen[value] = struct{}{}
	}
	return nil
}

func validateDataRetryPolicy(payload json.RawMessage, path string) error {
	fields, err := decodeDataObject(payload, path, []string{"maxAttempts", "backoff", "initialDelayMs"}, []string{"maxDelayMs"})
	if err != nil {
		return err
	}
	if _, err := decodeDataInteger(fields["maxAttempts"], path+"/maxAttempts", 1); err != nil {
		return err
	}
	backoff, err := decodeDataCanonicalString(fields["backoff"], path+"/backoff")
	if err != nil {
		return err
	}
	if backoff != "fixed" && backoff != "exponential" {
		return dataSourceValidationError("%s/backoff must be fixed or exponential", path)
	}
	initialDelay, err := decodeDataInteger(fields["initialDelayMs"], path+"/initialDelayMs", 0)
	if err != nil {
		return err
	}
	if maximum, exists := fields["maxDelayMs"]; exists {
		maxDelay, err := decodeDataInteger(maximum, path+"/maxDelayMs", 0)
		if err != nil {
			return err
		}
		if maxDelay < initialDelay {
			return dataSourceValidationError("%s/maxDelayMs must not be less than initialDelayMs", path)
		}
	}
	return nil
}

func validateDataPaginationPolicy(payload json.RawMessage, path string) error {
	base, err := decodeDataObject(payload, path, []string{"kind"}, []string{"offsetInput", "cursorInput", "limitInput", "defaultLimit", "maxLimit", "totalPath", "nextCursorPath", "previousCursorPath"})
	if err != nil {
		return err
	}
	kind, err := decodeDataCanonicalString(base["kind"], path+"/kind")
	if err != nil {
		return err
	}
	var required []string
	var optional []string
	switch kind {
	case "offset":
		required = []string{"kind", "offsetInput", "limitInput", "defaultLimit"}
		optional = []string{"maxLimit", "totalPath"}
	case "cursor":
		required = []string{"kind", "cursorInput", "limitInput", "defaultLimit", "nextCursorPath"}
		optional = []string{"maxLimit", "previousCursorPath"}
	default:
		return dataSourceValidationError("%s/kind must be offset or cursor", path)
	}
	fields, err := decodeDataObject(payload, path, required, optional)
	if err != nil {
		return err
	}
	for _, field := range required[1:] {
		if field == "defaultLimit" {
			continue
		}
		if _, err := decodeDataCanonicalString(fields[field], path+"/"+field); err != nil {
			return err
		}
	}
	for _, field := range optional {
		if field == "maxLimit" {
			continue
		}
		if _, exists := fields[field]; exists {
			if _, err := decodeDataCanonicalString(fields[field], path+"/"+field); err != nil {
				return err
			}
		}
	}
	defaultLimit, err := decodeDataInteger(fields["defaultLimit"], path+"/defaultLimit", 1)
	if err != nil {
		return err
	}
	if maximum, exists := fields["maxLimit"]; exists {
		maxLimit, err := decodeDataInteger(maximum, path+"/maxLimit", 1)
		if err != nil {
			return err
		}
		if maxLimit < defaultLimit {
			return dataSourceValidationError("%s/maxLimit must not be less than defaultLimit", path)
		}
	}
	return nil
}

func validateDataOptimisticPolicy(payload json.RawMessage, path string) error {
	fields, err := decodeDataObject(
		payload,
		path,
		[]string{"kind", "action", "target", "rollback"},
		[]string{"entityIdPath", "valueInputPath", "placement"},
	)
	if err != nil {
		return err
	}
	var kind string
	if err := json.Unmarshal(fields["kind"], &kind); err != nil || kind != "crud" {
		return dataSourceValidationError("%s/kind must equal crud", path)
	}
	action, err := decodeDataCanonicalString(fields["action"], path+"/action")
	if err != nil {
		return err
	}
	if action != "create" && action != "update" && action != "delete" {
		return dataSourceValidationError("%s/action must be create, update, or delete", path)
	}
	target, err := decodeDataObject(fields["target"], path+"/target", []string{"documentId", "operationId"}, nil)
	if err != nil {
		return err
	}
	if _, err := decodeDataCanonicalString(target["documentId"], path+"/target/documentId"); err != nil {
		return err
	}
	if _, err := decodeDataCanonicalString(target["operationId"], path+"/target/operationId"); err != nil {
		return err
	}
	var rollback string
	if err := json.Unmarshal(fields["rollback"], &rollback); err != nil || rollback != "on-error" {
		return dataSourceValidationError("%s/rollback must equal on-error", path)
	}
	for _, field := range []string{"entityIdPath", "valueInputPath"} {
		if _, exists := fields[field]; exists {
			if _, err := decodeDataCanonicalString(fields[field], path+"/"+field); err != nil {
				return err
			}
		}
	}
	if placement, exists := fields["placement"]; exists {
		value, err := decodeDataCanonicalString(placement, path+"/placement")
		if err != nil {
			return err
		}
		if value != "start" && value != "end" {
			return dataSourceValidationError("%s/placement must be start or end", path)
		}
	}
	return nil
}
