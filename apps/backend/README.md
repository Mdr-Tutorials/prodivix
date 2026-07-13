# @prodivix/backend

Prodivix 的 Go 后端服务，基于 Gin 与 PostgreSQL，提供鉴权、项目元数据、社区发布投影、第三方集成和 Canonical Workspace VFS 的远端持久化边界。

当前产品阶段为 **G0 Passed / G1 Foundation**。后端已经完成 G0 所需的 Atomic WorkspaceOperation Commit、Settings Commit、revision partition、强幂等 replay 与 Workspace 语义校验；它不提供第二套 Intent 或直接 document PATCH 写入协议。

## 目录结构

```text
apps/backend/
├── cmd/server/                 # 服务入口
├── internal/
│   ├── app/                    # 依赖装配与路由聚合
│   ├── config/                 # 环境配置
│   ├── modules/
│   │   ├── auth/              # 用户、会话与认证 API
│   │   ├── integrations/      # GitHub App 等第三方集成
│   │   ├── project/           # 项目元数据、社区查询与发布投影
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

## 数据库

- 主数据库为 PostgreSQL，驱动使用 `pgx`。
- 当前迁移语句位于 `internal/platform/database/database.go`，服务启动时执行。
- 本地开发可在 `apps/backend` 中运行 `docker compose up -d`。
- 默认连接串为 `postgres://postgres:postgres@localhost:5432/prodivix?sslmode=disable`。
- Windows 原生开发脚本读取仓库根目录 `.env.local`；可从 `.env.example` 复制后设置 `BACKEND_DB_URL`。

完整协议与决策见：

- `specs/api/workspace-sync.openapi.yaml`
- `specs/decisions/35.canonical-workspace-hard-cut.md`
- `specs/decisions/36.atomic-workspace-operation-commit.md`
- `specs/roadmap/g0-closure-evidence.md`
