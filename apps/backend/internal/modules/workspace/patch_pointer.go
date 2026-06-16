package workspace

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
)

func parseJSONPointer(raw string) (jsonPointer, error) {
	if raw == "" {
		return jsonPointer{}, nil
	}
	if !strings.HasPrefix(raw, "/") {
		return nil, fmt.Errorf("%w: path must be a JSON pointer", ErrWorkspacePatchInvalid)
	}
	parts := strings.Split(raw[1:], "/")
	pointer := make(jsonPointer, 0, len(parts))
	for _, part := range parts {
		decoded := strings.Builder{}
		for index := 0; index < len(part); index++ {
			if part[index] != '~' {
				decoded.WriteByte(part[index])
				continue
			}
			if index+1 >= len(part) {
				return nil, fmt.Errorf("%w: invalid JSON pointer escape", ErrWorkspacePatchInvalid)
			}
			switch part[index+1] {
			case '0':
				decoded.WriteByte('~')
			case '1':
				decoded.WriteByte('/')
			default:
				return nil, fmt.Errorf("%w: invalid JSON pointer escape", ErrWorkspacePatchInvalid)
			}
			index++
		}
		pointer = append(pointer, decoded.String())
	}
	return pointer, nil
}

func decodeJSONValue(payload json.RawMessage, target *any) error {
	decoder := json.NewDecoder(bytes.NewReader(payload))
	decoder.UseNumber()
	return decoder.Decode(target)
}

func decodePatchValue(payload json.RawMessage) (any, error) {
	if len(payload) == 0 {
		return nil, nil
	}
	var value any
	if err := decodeJSONValue(payload, &value); err != nil {
		return nil, err
	}
	return value, nil
}

func deepCloneJSONValue(value any) any {
	switch typed := value.(type) {
	case map[string]any:
		next := make(map[string]any, len(typed))
		for key, item := range typed {
			next[key] = deepCloneJSONValue(item)
		}
		return next
	case []any:
		next := make([]any, len(typed))
		for index, item := range typed {
			next[index] = deepCloneJSONValue(item)
		}
		return next
	default:
		return typed
	}
}
