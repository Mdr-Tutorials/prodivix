package workspace

import (
	"fmt"
	"strconv"
	"strings"
)

func getJSONValue(document any, path jsonPointer) (any, error) {
	current := document
	for _, segment := range path {
		switch typed := current.(type) {
		case map[string]any:
			next, ok := typed[segment]
			if !ok {
				return nil, fmt.Errorf("%w: %s", ErrWorkspacePatchPathMissing, segment)
			}
			current = next
		case []any:
			index, err := parseArrayIndex(segment, len(typed), false)
			if err != nil {
				return nil, err
			}
			current = typed[index]
		default:
			return nil, fmt.Errorf("%w: %s", ErrWorkspacePatchPathMissing, segment)
		}
	}
	return current, nil
}

func addJSONValue(document any, path jsonPointer, value any) (any, error) {
	if len(path) == 0 {
		return deepCloneJSONValue(value), nil
	}
	parentPath := path[:len(path)-1]
	key := path[len(path)-1]
	parent, err := getJSONValue(document, parentPath)
	if err != nil {
		return nil, err
	}
	switch typed := parent.(type) {
	case map[string]any:
		nextParent := deepCloneJSONValue(typed).(map[string]any)
		nextParent[key] = deepCloneJSONValue(value)
		return replaceExistingJSONValue(document, parentPath, nextParent)
	case []any:
		index, err := parseArrayIndex(key, len(typed), true)
		if err != nil {
			return nil, err
		}
		nextParent := make([]any, 0, len(typed)+1)
		nextParent = append(nextParent, typed[:index]...)
		nextParent = append(nextParent, deepCloneJSONValue(value))
		nextParent = append(nextParent, typed[index:]...)
		return replaceExistingJSONValue(document, parentPath, nextParent)
	default:
		return nil, fmt.Errorf("%w: parent is not container", ErrWorkspacePatchInvalid)
	}
}

func removeJSONValue(document any, path jsonPointer) (any, error) {
	if len(path) == 0 {
		return nil, fmt.Errorf("%w: remove root is forbidden", ErrWorkspacePatchInvalid)
	}
	parentPath := path[:len(path)-1]
	key := path[len(path)-1]
	parent, err := getJSONValue(document, parentPath)
	if err != nil {
		return nil, err
	}
	switch typed := parent.(type) {
	case map[string]any:
		if _, ok := typed[key]; !ok {
			return nil, fmt.Errorf("%w: %s", ErrWorkspacePatchPathMissing, key)
		}
		nextParent := deepCloneJSONValue(typed).(map[string]any)
		delete(nextParent, key)
		return replaceExistingJSONValue(document, parentPath, nextParent)
	case []any:
		index, err := parseArrayIndex(key, len(typed), false)
		if err != nil {
			return nil, err
		}
		nextParent := make([]any, 0, len(typed)-1)
		nextParent = append(nextParent, typed[:index]...)
		nextParent = append(nextParent, typed[index+1:]...)
		return replaceExistingJSONValue(document, parentPath, nextParent)
	default:
		return nil, fmt.Errorf("%w: parent is not container", ErrWorkspacePatchInvalid)
	}
}

func replaceExistingJSONValue(document any, path jsonPointer, value any) (any, error) {
	if len(path) == 0 {
		return deepCloneJSONValue(value), nil
	}
	parentPath := path[:len(path)-1]
	key := path[len(path)-1]
	parent, err := getJSONValue(document, parentPath)
	if err != nil {
		return nil, err
	}
	switch typed := parent.(type) {
	case map[string]any:
		if _, ok := typed[key]; !ok {
			return nil, fmt.Errorf("%w: %s", ErrWorkspacePatchPathMissing, key)
		}
		nextParent := deepCloneJSONValue(typed).(map[string]any)
		nextParent[key] = deepCloneJSONValue(value)
		return replaceExistingJSONValue(document, parentPath, nextParent)
	case []any:
		index, err := parseArrayIndex(key, len(typed), false)
		if err != nil {
			return nil, err
		}
		nextParent := deepCloneJSONValue(typed).([]any)
		nextParent[index] = deepCloneJSONValue(value)
		return replaceExistingJSONValue(document, parentPath, nextParent)
	default:
		return nil, fmt.Errorf("%w: parent is not container", ErrWorkspacePatchInvalid)
	}
}

func parseArrayIndex(segment string, length int, allowAppend bool) (int, error) {
	if segment == "-" {
		if allowAppend {
			return length, nil
		}
		return 0, fmt.Errorf("%w: '-' only valid for add", ErrWorkspacePatchInvalid)
	}
	if segment == "" || (len(segment) > 1 && strings.HasPrefix(segment, "0")) {
		return 0, fmt.Errorf("%w: invalid array index %q", ErrWorkspacePatchInvalid, segment)
	}
	index, err := strconv.Atoi(segment)
	if err != nil || index < 0 {
		return 0, fmt.Errorf("%w: invalid array index %q", ErrWorkspacePatchInvalid, segment)
	}
	if allowAppend {
		if index > length {
			return 0, fmt.Errorf("%w: array index %d out of range", ErrWorkspacePatchPathMissing, index)
		}
		return index, nil
	}
	if index >= length {
		return 0, fmt.Errorf("%w: array index %d out of range", ErrWorkspacePatchPathMissing, index)
	}
	return index, nil
}
