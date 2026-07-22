package workspace

import (
	"encoding/json"
	"testing"
)

func TestNormalizeJSONDocumentPreservesLargeIntegers(t *testing.T) {
	normalized, err := normalizeJSONDocument(
		json.RawMessage(` { "value": 9007199254740993 } `),
		nil,
	)
	if err != nil {
		t.Fatalf("normalize JSON document: %v", err)
	}
	if string(normalized) != `{"value":9007199254740993}` {
		t.Fatalf("large integer changed during normalization: %s", normalized)
	}
}

func TestJSONBytesEqualDistinguishesAdjacentLargeIntegers(t *testing.T) {
	left := json.RawMessage(`{"value":9007199254740992}`)
	right := json.RawMessage(`{"value":9007199254740993}`)
	if jsonBytesEqual(left, right) {
		t.Fatal("adjacent large integers must not compare equal")
	}
	if !jsonBytesEqual(
		json.RawMessage(`{"value":1}`),
		json.RawMessage(`{"value":1.0}`),
	) {
		t.Fatal("equivalent JSON numbers should compare equal")
	}
}
