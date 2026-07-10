# @prodivix/plugin-browser

Browser transport for the Prodivix Plugin Host.

The adapter starts a runtime only through a dedicated, no-cookie sandbox origin. A nonce-bound opaque iframe verifies the generated Worker bootstrap and runtime artifact digests, then transfers the same artifact bytes into one Dedicated Worker and one private protocol port. The Host bootstrap is a self-contained classic Worker because Chromium rejects blob module Workers in opaque sandbox frames; verified plugin artifacts remain self-contained ESM modules imported inside that Worker.

The package also provides the browser Host Gateway boundary:

- frozen exact method contracts and method-specific request/response validation;
- Manifest request, live permission, owner/generation, cancellation, rate, concurrency, timeout, and byte guards;
- injectable telemetry, Workspace, document, and network service ports;
- bounded, redacted IndexedDB audit with required-before-effect preflight;
- an HTTPS network adapter with per-hop allowlist and response limits.

`secrets.read` intentionally has no Gateway handler.

The package contains no Web editor store or contribution surface wiring. Workspace-scoped composition belongs to `apps/web`.
