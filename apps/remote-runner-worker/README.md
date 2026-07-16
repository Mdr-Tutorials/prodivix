# Prodivix Remote Runner Worker

Independent G2 worker agent. It claims one execution at a time, fetches the exact
lease-fenced snapshot, renews the lease, materializes files into an execution-local
temporary directory, runs allowlisted argv commands without a shell, and publishes
monotonic state transitions.

Sanitized stdout/stderr and output-budget warnings are published as structured
execution log events before the terminal transition. Event ingestion is lease
fenced; a lost lease prevents both further output and terminal publication.

The production default is the rootless Podman adapter. Every execution receives a
short-lived, digest-pinned OCI sandbox with a read-only root filesystem, isolated
tmpfs workspace, no host mounts, no network, no capabilities, no-new-privileges,
and bounded CPU, memory, disk, process, file-descriptor, wall-clock, and output
budgets. Cancellation stops the named container and `--rm` removes it. The
filesystem/process supervisor remains available only as an explicit non-production
reference adapter. The Control Plane never executes user code.

Required environment:

- `REMOTE_WORKER_ID`
- `REMOTE_WORKER_TOKEN`
- `REMOTE_WORKER_PROVIDER_ID`
- `REMOTE_WORKER_CONTROL_PLANE_URL`
- `REMOTE_WORKER_SANDBOX_IMAGE` (immutable `sha256:` or `name@sha256:` reference)

Optional lease, heartbeat, polling, timeout, output-budget, Podman command, and
sandbox resource limits use the `REMOTE_WORKER_*` prefix. Worker credentials are
not inherited by the sandbox and are included in output redaction values.

## Rootless sandbox Gate

`pnpm run verify:g2:rootless-sandbox` is intentionally a Linux/Podman integration
Gate rather than a default local test. The dedicated
`.github/workflows/g2-rootless-sandbox.yml` workflow installs Podman on an Ubuntu
runner and executes it as the non-root runner account. It builds the sandbox from a
digest-pinned base, runs active isolation and cgroup probes, verifies cancellation
cleanup, and uploads the JSON evidence. Windows contributors do not need WSL,
Docker Desktop, or Podman for ordinary development.
