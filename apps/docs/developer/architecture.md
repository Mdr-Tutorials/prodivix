# 架构导航

Prodivix 采用 Canonical Workspace VFS、domain owner、revision-bound projection 与可逆 durable 写入链。

仓库内的 canonical 架构文档是：

- `docs/architecture/overview.md`：产品全景、两张 Mermaid 架构图与 Workspace VFS 读写链路。
- `docs/architecture/package-ownership.md`：package/app owner、禁止边界与稳定依赖方向。
- `specs/decisions/`：冻结的架构决定。
- `specs/implementation/`：各子系统 implementation contract 与验证方法。
- `specs/roadmap/current-status.md`：当前全局状态；architecture 文档不维护进度。

## 核心不变量

Canonical Workspace VFS 是作者态唯一真相。Editor、AI、plugin 与 runtime 写入必须转换为可逆 Command 或原子 Transaction，再经 Durable Outbox 与 Atomic Commit。Renderer、Semantic Index、Code Authoring、Execution Snapshot、Git 和 Export 都是可重建 projection，不得成为第二作者态。

跨领域能力先确定 owner：应用只负责 UI、adapter 与 composition，不复制 transport-neutral contract。代码作者能力通过 Code Authoring Environment，符号/引用/impact 通过 Workspace Semantic Index。
