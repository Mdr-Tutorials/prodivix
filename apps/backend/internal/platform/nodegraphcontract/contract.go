package nodegraphcontract

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"

	"github.com/santhosh-tekuri/jsonschema/v6"
)

const currentSchemaResource = "https://prodivix.dev/schemas/nodegraph/current.json"

//go:embed current_schema.generated.json
var currentSchemaJSON []byte

var currentSchema = mustCompileCurrentSchema()

func mustCompileCurrentSchema() *jsonschema.Schema {
	document, err := jsonschema.UnmarshalJSON(bytes.NewReader(currentSchemaJSON))
	if err != nil {
		panic(fmt.Errorf("decode generated NodeGraph current schema: %w", err))
	}
	compiler := jsonschema.NewCompiler()
	compiler.DefaultDraft(jsonschema.Draft2020)
	if err := compiler.AddResource(currentSchemaResource, document); err != nil {
		panic(fmt.Errorf("register generated NodeGraph current schema: %w", err))
	}
	schema, err := compiler.Compile(currentSchemaResource)
	if err != nil {
		panic(fmt.Errorf("compile generated NodeGraph current schema: %w", err))
	}
	return schema
}

// ValidateDocument applies the NodeGraph owner package's generated current
// wire schema before Workspace-specific semantic validation runs.
func ValidateDocument(payload json.RawMessage) error {
	document, err := jsonschema.UnmarshalJSON(bytes.NewReader(payload))
	if err != nil {
		return err
	}
	return currentSchema.Validate(document)
}
