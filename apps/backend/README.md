# @prodivix/backend

Prodivix 的 Go 后端服务，基于 Gin 与 PostgreSQL，提供鉴权、项目元数据、社区发布投影、第三方集成和 Canonical Workspace VFS 的远端持久化边界。

当前产品阶段为 **G1 Passed / G2 Foundation**。后端已经完成 G0 所需的 Atomic WorkspaceOperation Commit、Settings Commit、revision partition、强幂等 replay 与 Workspace 语义校验，并在 G2 承载用户授权的 Remote Runner gateway 与 production Environment/Secret store；它不提供第二套 Intent 或直接 document PATCH 写入协议。

## 目录结构

```text
apps/backend/
├── cmd/server/                 # 服务入口
├── internal/
│   ├── app/                    # 依赖装配与路由聚合
│   ├── config/                 # 环境配置
│   ├── modules/
│   │   ├── auth/              # 用户、会话与认证 API
│   │   ├── environment/       # Environment revision、加密 Secret 与 resolution grant
│   │   ├── integrations/      # GitHub App 等第三方集成
│   │   ├── project/           # 项目元数据、社区查询与发布投影
│   │   ├── remoteexecution/   # 用户授权的 Remote Runner gateway 与 execution grant
│   │   └── workspace/         # Workspace snapshot、Atomic Commit 与语义校验
│   └── platform/
│       ├── database/          # PostgreSQL 连接与启动时迁移
│       └── http/              # CORS、中间件与错误响应
├── server.go
├── Dockerfile
├── docker-compose.yml
├── go.mod
└── go.sum
```

## Workspace 写入边界

浏览器端的完整链路是：

```text
Command / Transaction
  -> durable operation outbox
  -> POST /api/workspaces/:workspaceId/operations/commit
  -> one PostgreSQL transaction
  -> confirmed revisions + mutation response
```

Settings 使用独立的 durable outbox 与 `POST /api/workspaces/:workspaceId/settings/commit`，但遵循相同的 exact-request persistence 和强幂等要求。

后端 Workspace 模块负责：

- 校验 Atomic Commit wire contract、operation identity、write set 与 capability。
- 在一个数据库事务内应用 VFS tree、Route Manifest、document content / metadata 和 operation log 变更。
- 按 `workspaceRev`、`routeRev`、document `contentRev/metaRev` 执行乐观并发检查，并以明确冲突响应拒绝过期请求。
- 对同一个 operation id 执行强幂等 replay；同 id 不同 request hash 会被拒绝。
- 校验 Workspace VFS、Route Manifest 与 PIR graph 语义。TypeScript 侧的 canonical validator owner 是 `@prodivix/workspace`、`@prodivix/router` 与 `@prodivix/pir`；Go 实现保持 wire 与语义上的 conformance-equivalent 边界。

旧 document `PATCH`、`POST /intents`、Project PIR 作者态读写和 post-commit Project mirror 已被 Hard Cut。`internal/modules/workspace/patch*.go` 仅是 Atomic Commit 内部的受校验 patch 应用器，不是公开直写入口。

## 读取、创建与发布

- `GET /api/workspaces/:workspaceId` 返回后端 wire snapshot，Web 通过 `@prodivix/workspace` codec 解码为 canonical `WorkspaceSnapshot`。
- `GET /api/workspaces/:workspaceId/capabilities` 声明当前服务支持的 commit contract。
- fresh project 与 `import-local-project` 在同一数据库事务中创建 Project metadata、Workspace、Route、Settings 与 Documents；失败时整体回滚。
- 社区 PIR 只在显式 publish 时由 canonical Workspace 生成 `published_pir_json` 投影。该投影不参与编辑器加载、保存或 Workspace 恢复。

## 常用命令

```bash
go mod download
pnpm dev:backend
pnpm dev:backend:hot
cd apps/backend && go build ./...
cd apps/backend && go test ./...
cd apps/backend && go fmt ./...
```

## Remote Runner gateway

配置 `REMOTE_RUNNER_CONTROL_PLANE_URL` 与仅服务端可见的
`REMOTE_RUNNER_CONTROL_PLANE_TOKEN` 后，Backend 暴露认证后的
`POST /api/remote-executions` 和 artifact content proxy。create 前必须通过 Workspace owner
校验；成功后 execution grant 持久化到 PostgreSQL，后续 status/events/cancel/artifact 请求均按
当前用户校验。Control Plane token 不进入 Web、Workspace、ExecutionRequest、日志或 artifact。

带 `ExecutionEnvironmentSnapshotRef` 的 create 会在转发 Control Plane 前，以当前 authenticated
principal/session 对 exact Workspace、environment revision 与 mode 做 fail-closed preflight。create
成功后，Backend 将该 session 与 reference 绑定到 durable execution authority；环境绑定 execution 的
status、cancel、events、artifact 与 Preview materialization 不能由同一用户的其他 session 重放。
幂等 create 若返回已有 execution 但 authority 不一致，会返回 `409 EXE-4009`，且不会误取消原 execution。
该绑定不包含 Secret material；Remote server HTTP gateway 尚未完成前，Worker 仍不能解析 Secret。

`REMOTE_RUNNER_GATEWAY_TIMEOUT` 默认 `30s`。生产 Control Plane URL 必须使用 HTTPS；仅
localhost/loopback 开发环境允许 HTTP。

配置 `REMOTE_PREVIEW_HOST_URL`、`REMOTE_PREVIEW_PUBLIC_BASE_URL`、仅服务端可见的
`REMOTE_PREVIEW_HOST_TOKEN`、`REMOTE_PREVIEW_HOST_TIMEOUT` 与
`REMOTE_PREVIEW_SESSION_TTL` 后，Backend 还会暴露
`POST /api/remote-executions/:executionId/artifacts/:artifactId/preview-sessions`。该入口先重检
execution owner，再从 Control Plane 解析权威 descriptor 与 artifact，交叉验证 ready/healthy、scope、
expiry、snapshot、media type、size、ETag 与实际 SHA-256，最后交给独立 Preview Host。Host 返回的
capability origin 必须属于配置的公网域名后缀。Web 只收到短期 origin，不会收到两类服务凭据。

## Environment / Secret store

设置 `BACKEND_ENVIRONMENT_SECRET_KEY` 为 base64 编码的 32 字节随机 key 后，Backend 启用
production Environment/Secret store。未配置或 key 无效时，Environment API 保持 fail closed 并返回
`503 ENV-5001`；不会使用默认 key 或明文降级。

`PUT /api/workspaces/:workspaceId/environments/:environmentId` 创建 immutable revision。public binding
以 JSON 保存，`secretsById` 仅在请求边界进入内存，并使用 AES-256-GCM 与绑定
workspace/environment/revision/binding 的 authenticated context 加密后写入 PostgreSQL。响应和
`GET` 仅包含 `secretBindingIds`，不返回 Secret material，并强制 `private, no-store`。

运行时授权以 principal、认证 session、Workspace、environment revision、provider、runtime zone、
purpose、binding 和 adapter field 形成最长五分钟的 durable grant。Secret 只能通过 store 的
callback boundary 使用；grant/session/field 不完全匹配、过期或 revoke 均拒绝。durable audit 只保存
identity metadata，不保存明文。当前 Remote server gateway 尚未组合该 store，因此 client-only target
仍不得解析 Secret。

## 数据库

- 主数据库为 PostgreSQL，驱动使用 `pgx`。
- 当前迁移语句位于 `internal/platform/database/database.go`，服务启动时执行。
- 本地开发可在 `apps/backend` 中运行 `docker compose up -d`。
- 默认连接串为 `postgres://postgres:postgres@localhost:5432/prodivix?sslmode=disable`。
- Windows 原生开发脚本读取仓库根目录 `.env.local`；可从 `.env.example` 复制后设置 `BACKEND_DB_URL`。
- Environment/Secret 表由同一启动迁移创建；生产部署必须从 Secret manager 注入
  `BACKEND_ENVIRONMENT_SECRET_KEY`，不得提交到仓库或写入 Workspace。

完整协议与决策见：

- `specs/api/workspace-sync.openapi.yaml`
- `specs/decisions/35.canonical-workspace-hard-cut.md`
- `specs/decisions/36.atomic-workspace-operation-commit.md`
- `specs/roadmap/g0-closure-evidence.md`
