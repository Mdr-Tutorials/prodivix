# G2 Auth / Server Runtime milestones

> 本文件是 Auth/Server 子系统阶段状态的唯一来源。实现 contract 见 [`../implementation/g2-auth-server-runtime.md`](../implementation/g2-auth-server-runtime.md)，架构边界见 [`../decisions/46.auth-and-server-runtime.md`](../decisions/46.auth-and-server-runtime.md)。

## 当前判断

| Milestone                                                            | 状态                          | 已关闭的边界                                                                                                                                                                                                                                                                             | 尚未包含                                                                             |
| -------------------------------------------------------------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| A0-A5 Contract、Backend、Remote bridge、Compiler、deterministic Test | Implemented                   | transport-neutral Auth/Server contract、session-bound Backend gateway、value-only bridge、React/Vite guard/loader、typed action、replay/cancel/revalidation。                                                                                                                            | 后续 target 与产品 closure。                                                         |
| A6/A6.5 isolated production 与 Remote live mutation                  | Implemented                   | bounded TS/JS import graph、rootless one-shot code-export、authenticated/`workspace.owner` authority、可信 result/SourceTrace；唯一 audited execution-state mutation 的 origin/intent/PostgreSQL replay Gate。                                                                           | 任意项目 mutation。                                                                  |
| A7 Golden、authoring 与 invocation devtools                          | Implemented                   | static/Test/Remote/isolated target matrix、Route candidate/binding/issues、Resources Auth config、原子 guard preset、metadata-only `server.function` observation、CodeArtifact navigation，以及 Vue deterministic authenticated Catalog guard/loader/action 产品 Gate。                  | 真实 Remote authenticated Catalog、Remote Test invocation 与后续 producer debugger。 |
| A8 Remote live audited Secret HMAC                                   | Implemented                   | reference-only Secret field、execution/principal/session/environment/function/invocation grant、callback-bound use/revoke、capability propagation 与 output canary。                                                                                                                     | 任意 adapter Secret。                                                                |
| A9 isolated Worker sealed Secret                                     | Implemented                   | worker-attempt-bound X25519/HKDF/AES-GCM envelope、one-shot broker、0600 material、effect 前删除、rootless residual hard cut。                                                                                                                                                           | 跨 replica recovery closure。                                                        |
| A10 worker-attempt recovery                                          | Implemented                   | 更高 attempt reclaim、current-attempt CAS、recipient/function/invocation drift denial、old-attempt completion denial。                                                                                                                                                                   | artifact/quota 跨 replica closure。                                                  |
| A11 Backend Environment Secret KMS envelope/key rotation             | Implemented                   | per-record data-key envelope、versioned static key ring、active-key write、retirement fence、bounded rewrap/legacy migration 与 PostgreSQL Gate。                                                                                                                                        | A14 AWS adapter first vertical 已接续；第二 provider 继续建设。                      |
| A12 Secret-free `workspace.read` isolated permission                 | Implemented                   | shared Compiler/Worker policy、sorted owner-derived authority、exact read grant、Resources/Blueprint authoring、Living Golden 与 networkless rootless probe。                                                                                                                            | read + Secret 由 A15、viewer role resolution 由 A16 承接。                           |
| A13 `workspace.write` project-source mutation                        | Configured / Evidence pending | exact mutation profile、单次 import-graph whole-file staging replacement、Worker result/diff pre-upload correlation、owner-derived write authority、Resources/Blueprint 原子 preset、Golden 执行与显式 revision-fenced adoption、rootless contract/real probe 均已实现，本地 Gate 通过。 | 新增真实 GitHub rootless run 尚未取得；取得前不标记 Implemented。                    |
| A14 AWS managed-cloud KMS adapter                                    | Configured / Evidence pending | 官方 AWS SDK `Encrypt/Decrypt`、exact immutable key ARN map、default credential chain、SHA-256 AAD encryption context、bounded timeout、provider/key/output correlation、static decrypt-only migration、PostgreSQL cross-provider rewrap Gate 与 OIDC workflow 均已实现。                | 真实 AWS OIDC/KMS workflow run 尚未取得；其他 managed KMS provider 未开放。          |
| A15 isolated `workspace.read` + Secret composition                   | Configured / Evidence pending | shared Compiler/Worker policy、exact read authority-before-broker、Backend Secret allowlist、reference-only Blueprint loader preset、Living Golden、rootless contract/real probe 与本地 aggregate 均已实现。                                                                             | 新增真实 GitHub rootless run 尚未取得；其他 permission 仍未开放。                    |
| A16 collaborator viewer exact execution authority                    | Configured / Evidence pending | canonical owner-fenced viewer role、owner/read resolver、durable principal/session/permission grant、viewer Environment hard cut、Data/Server/Secret effect recheck、真实本地 PostgreSQL Gate 与单项 read rootless probe 均已实现。                                                      | 更新后的真实 GitHub rootless run 尚未取得；分享 UI、editor/write role 未开放。       |

## Gate 入口

- Aggregate Auth/Server：`pnpm run verify:g2:auth-server-runtime`
- Isolated authority/rootless contract：`pnpm run verify:g2:isolated-server-auth-authority`
- Isolated source mutation：`pnpm run verify:g2:isolated-server-source-mutation`
- Managed KMS local contract：`pnpm run verify:g2:environment-secret-managed-kms`
- Managed KMS live cloud：`.github/workflows/g2-managed-kms.yml`
- Isolated `workspace.read` + Secret：`pnpm run verify:g2:isolated-server-read-secret`
- Collaborator viewer read：`pnpm run verify:g2:isolated-server-collaborator-read`
- Collaborator viewer PostgreSQL：`go test ./internal/modules/remoteexecution -run '^TestWorkspaceExecutionViewerRolePostgreSQLGate$' -count=1 -v`
- Remote live mutation：`pnpm run verify:g2:auth-server-live-mutation`
- Golden target matrix：`pnpm run verify:g2:auth-server-golden`
- Vue authenticated Catalog：`pnpm run verify:g2:vue-product`
- Rootless real isolation：`.github/workflows/g2-rootless-sandbox.yml`

## 状态变更规则

- 只在纵切同时具备 canonical contract、正负向测试、目标矩阵、产品入口（适用时）与相应本地/远端 Gate 后标记 Implemented。
- workflow 存在但尚未运行成功时写 `Configured / Evidence pending`，不得写 `Passed`。
- 详细实现过程和停止条件留在 implementation/ADR；本文件只保存 milestone 判断。
