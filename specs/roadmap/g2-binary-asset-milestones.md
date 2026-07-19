# G2 Binary Asset milestones

> 本文件是 Binary Asset 子系统阶段状态的唯一来源。实现 contract 见 [`../implementation/g2-binary-asset-pipeline.md`](../implementation/g2-binary-asset-pipeline.md)，架构边界见 [`../decisions/47.binary-asset-pipeline.md`](../decisions/47.binary-asset-pipeline.md)。

## 当前判断

| Milestone                                                     | 状态                         | 已关闭的边界                                                                                                                                                                                                       | 尚未包含                                                           |
| ------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| B0-B3 owner、contract、blob store、Executable materialization | Implemented                  | `@prodivix/assets` owner、reference-only Workspace contract、SHA-256 exact-byte store、authorized materialization、Compiler/Snapshot/Remote projection 与 Golden first vertical。                                  | 更广格式与 delivery。                                              |
| B4 Browser Resources 与 local/cloud bytes                     | Implemented                  | Workspace-scoped IndexedDB、bytes-first upload/preview/download、Run/Test/Export、duplicate/delete lifecycle、bounded multipart local-to-cloud atomic import。                                                     | public delivery。                                                  |
| B5 transform、scanner 与 delivery                             | Implemented (first vertical) | deterministic PNG/baseline JPEG sanitizer、versioned structural + required ClamAV chain、quarantine、replica failover、freshness/cohort/policy generation、bounded derived cache、capability Asset Delivery Host。 | 第二 malware vendor、完整 raster re-encode、更多格式、public-CDN。 |
| B6 retention、Git/LFS、runtime filesystem                     | Implemented (first vertical) | PostgreSQL orphan clock/reference reconcile/row-lock sweep、deterministic Git binary/LFS projection、managed attributes、exact upload-receipt-fenced Asset import/replace。                                        | runtime Asset delete。                                             |
| B7 Golden 与 Browser product journey                          | Implemented (first vertical) | Living Golden blob-backed PNG、Browser JPEG upload/durable reload/sanitize/capability-origin decode、GitHub Smoke 与 rootless real-daemon first evidence。                                                         | 跨 target 完整产品旅程和第二 target。                              |

## Gate 入口

- Aggregate Binary Asset：`pnpm run verify:g2:binary-assets`
- Browser journey：`pnpm run verify:g2:binary-assets:browser`
- Real ClamAV/rootless：`pnpm run verify:g2:clamav-malware`
- Remote workflow：`.github/workflows/g2-binary-asset-malware.yml`

## 状态变更规则

- scanner/transform 支持必须同时有 deterministic contract、negative corpus、readiness/freshness 与真实 daemon 证据。
- Browser harness、mock scanner 或 workflow 配置不能替代真实 malware Gate。
- 详细实现过程保留在 implementation/ADR；本文件只保存 milestone 判断。
