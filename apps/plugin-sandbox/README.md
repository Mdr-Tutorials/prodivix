# Prodivix Plugin Sandbox Origin

This app builds the dedicated static origin used by browser plugin runtime and UI isolation.

Production requirements:

- Serve the generated files from an origin that has no Prodivix login cookies or user data.
- Preserve the generated Content Security Policy and Permissions Policy exactly.
- Embed runtime and UI documents without `allow-same-origin`.
- Keep `worker-src blob:` and the generated hash-bound broker script policy; do not add `unsafe-eval` or network sources.
- Do not route unknown paths to the editor SPA.

`security-headers.json`, `_headers`, and `nginx.conf` are generated into `dist/` with the exact script hashes for each build.

Configure the editor build with the deployed runtime document URL:

```dotenv
VITE_PLUGIN_SANDBOX_URL=https://plugins.example.com/runtime-broker.html
```

The editor intentionally fails runtime activation when this value is absent. Do not point it at the editor origin or add a same-origin fallback.
