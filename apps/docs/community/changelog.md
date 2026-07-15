# Changelog

本页只记录产品 Gate 级里程碑。逐提交变化请查看 Git 历史；阶段定义以 `specs/roadmap/global-phases.md` 为准。

## Unreleased

- 建立 transport-neutral ExecutionProvider/ExecutionJob、Execution Session coordinator 与 Browser Project Runner；蓝图 Design/Interactive/Run 三模式、独立工程 snapshot、依赖安装、Vite/HMR、共享 Execution Center/Console 与原位 iframe 已贯通。
- NodeGraph editor Run/Stop 与 Blueprint `run-nodegraph` trigger 已硬切到 domain-owned same-context ExecutionProvider；默认 starter、实时 trace/log、诊断、SourceTrace、取消、timeout 与共享 Console 已贯通，旧 browser action 直调协议已删除。
- Animation Play/Stop/Restart 已硬切到 domain-owned Runtime Port 与 same-context ExecutionProvider；完整单 timeline lifecycle、timeline easing、target capability、generation-fenced Browser effect lease、SourceTrace 与共享 Console 已贯通，旧编辑器私有 RAF lifecycle 已删除。
- Browser Preview/Test 已使用独立 provider descriptor、Job 与 Session，共享 Browser Runtime Host 的 filesystem/dependency lifecycle；Workspace Test 页面已接入 canonical `ExecutionTestReport` 与共享 Execution Center。
- 继续建设 Remote Isolated Runner、Terminal/Network 产品面和多 runtime zone。
- 建立 DataSourceDocument/DataOperationReference current contract、strict wire codec、`data-source` typed Workspace/Semantic foundation，以及 reference-only environment/Secret identity；PIR binding、runtime adapter 与 Secret resolution 继续建设。
- 继续建设完整 runtime zones、binary asset 与 auth/server-function contract。
- 继续补齐产品文档、易用性和已发现的跨表面一致性问题。

## Semantic Hybrid Authoring

- 全仓生产 API 收敛到 PIR-current，数字版本隔离在 wire/migration 边界。
- Workspace Semantic Index 覆盖 Route、PIR、Component、Collection、NodeGraph、Animation、Code、Token 与 Asset。
- Component Definition/Public Contract/Instance、原子 extraction 和一等 Collection 完成产品纵切。
- TS/JS/CSS/SCSS/GLSL/WGSL language capability、Shader compile、CodeSlot、artifact lifecycle 与 refactor planning 完成纵切。
- PIR ↔ React/JSX + standalone CSS controlled round-trip 完成。
- Web 作者写入、Quick Fix 和 History 统一进入 Durable Outbox 与 Atomic Commit。
- React/Vite 导出通过独立 install/typecheck/test/build 与真实浏览器 Gate。

## Truth & Change Kernel

- Canonical Workspace VFS 成为唯一作者态真相。
- Command/Transaction、History、WorkspaceOperation、Durable Outbox 与 Atomic Commit 建立统一写入链。
- Revision conflict、semantic resolution、local replica、Issues 与 Golden Conformance 闭环通过。

可重复证据见 `specs/roadmap/g0-closure-evidence.md` 与 `specs/roadmap/g1-closure-evidence.md`。
