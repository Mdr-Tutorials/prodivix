# @prodivix/plugin-protocol

Transport-neutral strict JSON protocol used between the Prodivix Host and isolated plugin runtimes.

- JSON Schema files under `specs/plugins/runtime/` are the wire-contract source of truth.
- Every payload is selected by exact `channel + method + contractVersion + kind` identity.
- The codec rejects malformed JSON, duplicate keys, unknown fields, invalid UTF-8, and bounded-resource violations.
- The session state machine owns sequence validation, correlation, cancellation, timeout, and late-response suppression.
- Schema validators are compiled at generation time into standalone source. Runtime output is checked to contain no CommonJS `require`, `eval`, or `new Function`, so the protocol works under the sandbox CSP without `unsafe-eval`.

This package has no DOM, Worker, React, Workspace, or Plugin Host service dependency.
