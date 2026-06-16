package workspace

import (
	"encoding/json"
	"reflect"
	"strconv"
)

func jsonDeepEqual(left any, right any) bool {
	return reflect.DeepEqual(normalizeJSONNumbers(left), normalizeJSONNumbers(right))
}

func normalizeJSONNumbers(value any) any {
	switch typed := value.(type) {
	case map[string]any:
		next := make(map[string]any, len(typed))
		for key, item := range typed {
			next[key] = normalizeJSONNumbers(item)
		}
		return next
	case []any:
		next := make([]any, len(typed))
		for index, item := range typed {
			next[index] = normalizeJSONNumbers(item)
		}
		return next
	case json.Number:
		if integer, err := typed.Int64(); err == nil {
			return integer
		}
		if float, err := typed.Float64(); err == nil {
			return float
		}
		return typed.String()
	default:
		return typed
	}
}

func isPointerPrefix(prefix jsonPointer, path jsonPointer) bool {
	if len(prefix) > len(path) {
		return false
	}
	for index := range prefix {
		if prefix[index] != path[index] {
			return false
		}
	}
	return true
}

func adjustMoveDestinationAfterRemove(from jsonPointer, path jsonPointer) jsonPointer {
	if len(from) == 0 || len(path) == 0 || len(from) != len(path) {
		return path
	}
	for index := 0; index < len(from)-1; index++ {
		if from[index] != path[index] {
			return path
		}
	}
	fromIndex, fromErr := strconv.Atoi(from[len(from)-1])
	pathIndex, pathErr := strconv.Atoi(path[len(path)-1])
	if fromErr != nil || pathErr != nil || fromIndex >= pathIndex {
		return path
	}
	next := append(jsonPointer{}, path...)
	next[len(next)-1] = strconv.Itoa(pathIndex - 1)
	return next
}
