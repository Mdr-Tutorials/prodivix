# G2 Closure Evidence

> StatusDate: 2026-07-19
> ProductGateStatus: In Progress

本文件只保存 G2 可重复验证证据和未覆盖边界。G2 当前状态仍以
[`current-status.md`](./current-status.md) 为唯一来源；局部 Gate 通过不等于 G2 Product Gate 已通过。

## Remote Test correlation 与 D8 security slice

本地重复命令：

```bash
pnpm run verify:g2:data-security-matrix
```

2026-07-19 本地结果：通过。

| 子 Gate           | 证据                                                                                                                                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Golden D8 matrix  | 1 file / 4 tests passed；覆盖所有 execution Secret surfaces、strict Network metadata、React/Vue Test mock-only 与 Export fixture exclusion。                                                                             |
| Data mock         | 1 file / 7 tests passed；missing/error fixture fail closed、session-scoped CRUD 与无 live fallback。                                                                                                                     |
| Runtime Core      | 2 files / 9 tests passed；Secret canary/redaction 与 Network strict decoder。                                                                                                                                            |
| Compiler          | 2 files / 23 tests passed；standalone runtime mock/live hard cut、client finite protocol execution、server/edge gateway/stream capability 与 client-only/environment denial。                                            |
| Remote Provider   | 11 files / 72 tests passed；exact provider、reconnect/recovery、execution-bound Test report 与 live runtime trace denial。                                                                                               |
| Remote Worker     | typecheck、rootless snapshot contract passed；2 files / 27 tests passed；rootless result decoder、upload-before-trace、Secret output Gate。                                                                              |
| Web composition   | typecheck passed；4 files / 11 tests passed；Browser Test mock-only、Remote Preview/Test independent provider composition、Test plan/report projection。                                                                 |
| Backend authority | `internal/modules/remoteexecution` 与 `internal/platform/database` Go tests passed；durable provider/profile/runtime-zone authority、Remote Test environment denial、live Data Preview-only Gate 与 migration contract。 |

关键身份链：

1. Browser/Remote Workspace Test 消费同一 exact snapshot 和强制 mock-only Data runtime。
2. Remote Test create 不接受 environment reference；Backend authority 持久化 exact
   `prodivix.remote.test/test/test`，live Data gateway 只接受
   `prodivix.remote.preview/preview/client`。
3. Worker 将私有 Vitest payload 转换为 `test-report:<executionId>`，先上传 artifact，再发布同 ID、状态和
   SourceTrace 的 `test.report`。
4. Remote Provider 对重复、乱序、snapshot/report/source drift 及 Test live runtime Network fail closed；
   Test 页面与 Execution Center 消费同一 Session event stream。

GitHub workflow `G2 Data and Second Target Closure / Remote Test correlation and D8 security matrix`
已配置。由于本轮按要求不提交、不推送，首次远端 Actions 证据仍待后续 push 后确认；不得把“workflow 已配置”
描述为远端 Gate 已通过。

## D8 bounded protocol、journey 与 target matrix

本地重复命令：

```bash
pnpm run verify:g2:data-closure
pnpm run verify:g2:data-protocols
pnpm run verify:g2:vue-target
```

2026-07-19 本地结果：完整 `data-closure` 通过（168.0 秒）；下列子 Gate 均通过。

| 子 Gate             | 证据                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data kernel         | 13 files / 55 tests passed；包含 cache partition、stale revalidation、retry/idempotency、stream lifecycle 与 optimistic owner/version property coverage。                       |
| Protocol adapters   | HTTP 2 files / 17 tests、GraphQL 2 / 8、AsyncAPI 2 / 8 passed；OpenAPI mapping、finite query/mutation/request-reply/publish、bounded stream 与稳定 unsupported 边界。           |
| Generated runtime   | Compiler 2 files / 23 tests passed；public client finite HTTP/GraphQL/AsyncAPI、server/edge gateway 与 pull stream、sanitized Network correlation、mock/live/Secret hard cut。  |
| Product composition | Web typecheck 与 2 files / 16 tests、Backend Workspace Go tests passed。                                                                                                        |
| Target matrix       | Golden 2 files / 20 tests passed；React/Vue × HTTP/GraphQL/AsyncAPI × mock/live × Preview/Test/Build × Browser/Remote compatibility、Remote codec 与 stream capability。        |
| Independent target  | Vue/Vite temporary project install、typecheck、test、build、Chrome smoke passed；执行 list/get/create/update/delete、loading、empty、retryable error attempt 2 与 offset page。 |

有界支持范围：

1. Workspace Test 对两个 target 和三个协议都只消费 provider-projected mock fixture；Export 不携带 fixture。
2. Browser/static-client Preview 支持 HTTP、finite GraphQL 与 finite AsyncAPI live；Remote Preview 可运行同一
   client bundle，Remote Build 只构建且不解析协议私有结果。
3. server/edge live 对 HTTP/GraphQL/AsyncAPI finite invocation 复用同一受审计 execution gateway；public
   GraphQL subscription 与 AsyncAPI SSE/NDJSON stream 使用 ADR 49 的独立 pull bridge。client/static、HTTP
   subscription、Secret stream 与未声明 transport 继续在 compile/runtime Gate fail closed。
4. Target/runtime source equality、独立生成工程执行与 property Gate 共同构成 parity 证据；单纯 snapshot
   字段相等不被当作完整 journey 证据。

GitHub workflow `G2 Data and Second Target Closure / Protocol target matrix and Vue Vite independent CRUD Gate`
已更新 path filter 与命令。由于本轮未提交、未推送，远端 Actions 证据仍待后续确认。

## Vue PIR/Route/Auth/Server/Asset 与 authenticated Catalog CRUD

本地重复命令：

```bash
pnpm run verify:g2:vue-product
```

2026-07-19 本地结果：完整聚合 Gate 通过（最近一次 48.6 秒）。

| 子 Gate                  | 证据                                                                                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compiler current surface | Vue compiler conformance 1 file / 5 tests passed；PIR product path、Data-only compatibility、protocol parity、server/Secret 与 unsupported fail-close。     |
| Catalog contract matrix  | 1 file / 4 tests passed；覆盖 canonical PIR/Route/Auth/Server/Data/PNG、deterministic Test provision、Remote Preview/Test/Build 与 strict codec。           |
| Independent Catalog app  | 1 file / 1 test passed；fresh install、`vue-tsc`、Vitest、production build、真实 Chrome authenticated loader、PNG decode 与 list/create/update/delete。     |
| Web product composition  | Web typecheck passed；4 files / 12 tests passed；覆盖 Export ZIP surface、Workspace Test selector、Blueprint Run target planning 与 mock-only/Test policy。 |
| Client security boundary | server source canary 不进入 snapshot files；protected static Vue export 以 `WKS-EXPORT-SERVER-GATEWAY-REQUIRED` fail closed。                               |
| Full regression          | Compiler 17 files / 116 tests、Golden 11 files / 53 tests、Web 88 files / 317 tests、Web production build 与 core package boundary passed。                 |

当前声明边界：

1. Vue current-contract product target 直接消费 canonical PIR/Route/Auth/Server/Data/Asset，并在 Export Code、Workspace Test、
   Blueprint Run Mode 提供显式 target selector；没有产生 Vue 私有 Workspace 或 runtime 持久化镜像。
2. Browser authenticated journey 使用 deterministic Test adapter；Browser 不伪造 live Server Function。
3. Remote 本 Gate 验证 exact snapshot、capability requirement、provider compatibility 与 strict codec round-trip；真实 Remote
   authenticated live Catalog execution 仍待后续证据。
4. Route layout/outlet、完整跨 target Asset delivery/sanitize UI matrix 与公共 Target SDK 不在本次完成声明内。

GitHub workflow `G2 Data and Second Target Closure / Vue Vite product surface and authenticated Catalog CRUD Gate`
已配置。由于本轮按要求不提交、不推送，首次远端 Actions 证据仍待后续 push 后确认。

## Server/Edge GraphQL/AsyncAPI stream 与 SourceTrace debugger

本地重复命令：

```bash
pnpm run verify:g2:data-stream-debugger
```

2026-07-19 本地结果：通过（42.1 秒）；并已进入 168.0 秒的完整 `data-closure`。

| 子 Gate                    | 证据                                                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime Core strict wire   | 20 files / 80 tests passed；覆盖 stream open/pull/cancel/event/complete、cursor 与 bounded strict decoder。                                                   |
| Data stream kernel         | 13 files / 55 tests passed；覆盖单 pending pull、背压、event/byte/duration/idle budget、schema、Network correlation、abort、cleanup ordering与有限 snapshot。 |
| Protocol stream adapters   | GraphQL 2 files / 8 tests、AsyncAPI 2 / 8 passed；覆盖 GraphQL SSE 与 AsyncAPI NDJSON frame mapping、finite/stream 明确分流和 malformed frame hard cut。      |
| Generated runtime          | Compiler 2 files / 23 tests passed；覆盖真实 open → pull → event/complete postMessage journey，以及 client、HTTP subscription 与 Secret stream hard cut。     |
| Target capability matrix   | Golden 2 files / 20 tests passed；覆盖 React/Vue × GraphQL/AsyncAPI edge subscription 的 `data-stream`/network/environment capability 与 Remote provider。    |
| Product debugger journey   | Web typecheck 与 7 files / 32 tests passed；覆盖 streaming fetch、unsafe URL、stream/cursor budget、generation/cancel fence 与 Source stale fence。           |
| Backend protocol authority | Workspace 与 Remote Execution Go tests passed；覆盖 canonical subscription、finite GraphQL/AsyncAPI、SSE/NDJSON、authority、identity conflict 与 envelope。   |

当前有界支持范围：

1. server/edge HTTP、GraphQL 与 AsyncAPI finite invocation 共用同一 execution-bound authority、Workspace/environment
   revision、HTTPS/SSRF、response budget、mutation permission/replay 与 sanitized Network Gate。
2. stream 只接受 public GraphQL subscription 与 AsyncAPI HTTP SSE/NDJSON receive/stream；HTTP adapter 仍为 finite-only，
   client/static、mock-only stream 和 callback-only Secret stream fail closed。
3. generated iframe 必须显式 `open → pull(cursor) → event/complete → cancel`；一次 pull 最多读取一个事件，不能以
   provider 私有 emitter 绕过 consumer backpressure、schema、预算或取消。
4. Network Source link 只接受 correlation 唯一的 metadata-only `data-operation` SourceTrace；先校验 producing snapshot，
   再校验 canonical document/operation，最后通过共享 semantic navigation 打开作者态 Resources。

GitHub workflow `G2 Data and Second Target Closure / Verify server and edge streams with SourceTrace debugging`
已配置。由于本轮按要求不提交、不推送，首次远端 Actions 证据仍待后续 push 后确认。

## Console/Artifact/Test/Files unified SourceTrace debugger

本地重复命令：

```bash
pnpm run verify:g2:execution-source-debugger
```

2026-07-19 本地结果：通过（16.8 秒）。

| 子 Gate                  | 证据                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime Core contracts   | 3 files / 8 tests passed；覆盖 Structured Console correlation、Test Report SourceTrace 与 strict Runtime Files diff。                                                                      |
| Authoring boundary       | 9 files / 24 tests passed；`execution-center` 是显式 Code Authoring origin，未改变 Workspace owner、source span 或 authoring session 语义。                                                |
| Web exact-source journey | typecheck passed；7 files / 28 tests passed；覆盖 Console artifact、Test file/case、Files change、stale snapshot、root/helper ambiguity、跨 artifact span 与 Animation shell composition。 |
| Full Web regression      | 86 files / 307 tests passed；Core package boundary check 与 `git diff --check` passed。                                                                                                    |

关键闭环：

1. Console line 不再丢弃 Core correlation；artifact/log/diagnostic/trace/application observation 都保留 exact
   Job/provider/snapshot，且仅有唯一合法 trace 时显示 Source。
2. Workspace Test presentation 从 normalized `test.report` event 保留 producing provider/job/snapshot；旧报告继续可读，
   但不能打开当前 Workspace 源码。file/case 多义 trace 不按数组首项猜测。
3. Runtime Files controller 将 verified diff change 与 proposal entry 按 `changeId` 重新关联；Source 导航使用 artifact
   reference 的 exact identity，采纳 eligibility、显式选择与单一原子 Transaction 语义不变。
4. Blueprint、NodeGraph、Animation 与 Test composition 复用同一 Workspace opener；CodeArtifact 进入共享 Code
   Authoring overlay，Data/NodeGraph/Animation 等 canonical target 进入共享 semantic navigation。stale、missing、
   ambiguous 与 source-span identity drift 全部 fail closed。

GitHub workflow `G2 Execution Contract Matrix / Run unified execution SourceTrace debugger Gate` 已配置。
由于本轮按要求不提交、不推送，首次远端 Actions 证据仍待后续 push 后确认。

## Remote Terminal encrypted cross-replica recovery

本地重复命令：

```bash
pnpm run verify:g2:terminal-replica-recovery
pnpm run verify:g2:remote-recovery
pnpm --filter @prodivix/remote-runner-control-plane test
PRODIVIX_REMOTE_POSTGRES_TEST_URL=postgres://postgres:postgres@127.0.0.1:5432/prodivix_test?sslmode=disable \
  pnpm --filter @prodivix/runtime-remote-postgres test:postgres
```

2026-07-19 本地结果：通过。

| 子 Gate                   | 证据                                                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime Core checkpoint   | 2 files / 19 tests passed；覆盖 Terminal checkpoint exact restore、output/input cursor、续期 lease、transient close hard cut、Secret stream pending suffix 与 drift hard cut。                                          |
| Remote two-replica broker | 13 files / 81 tests passed；双副本用例覆盖跨副本 stdin/mailbox/output、CAS duplicate/conflict、token rotation、split-canary、lease renewal、worker-loss、retryable cipher outage no-CAS 与 regional recovery contract。 |
| Control Plane crypto/HTTP | typecheck/build、完整 10 files / 32 passed + 2 live skipped；覆盖 PRT1/PRT2、AWS KMS/MRK、client/worker strict HTTP endpoints、Secret broker 与 regional config/HTTP drill。                                            |
| PostgreSQL real isolation | 1 file / 9 tests passed；新增 opaque Terminal row 覆盖 concurrent revision CAS、byte-exact read、expiry lookup 与 revision-fenced delete。                                                                              |
| Worker / Web regression   | Worker 1 file / 15 tests、Execution Center 1 file / 12 tests passed；完整 `verify:g2:remote-recovery` 32 秒通过。                                                                                                       |

关键闭环：

1. Core state 与 stdout/stderr redactor 都形成 versioned bounded checkpoint；fingerprint salt、raw unacked stdin 与可能是
   Secret 前缀的 pending suffix 只进入加密 plaintext。
2. PostgreSQL adapter 只接收 opaque `sealedState` 与 execution/session/revision/expiry；AES-GCM AAD 绑定 exact row identity、
   revision 与 expiry，ciphertext、sweep metadata 或 AAD drift fail closed。
3. client/worker 操作在任意副本重建状态机并重新校验 current lease，随后 `revision + 1` CAS；竞争重试保留同 input
   duplicate、不同 input conflict 与 worker output existing/identity-conflict 语义。
4. sweep 不按旧 checkpoint lease 直接删除：同 generation 已续期则更新 row；execution/worker generation drift 才关闭、
   revoke、清 mailbox 并以 exact revision 删除。Terminal state 仍是短期 recovery authority，不进入 Job event 或 Workspace。

GitHub workflow `G2 Data and Second Target Closure / Verify encrypted cross-replica Terminal and Remote recovery contracts`
以及真实 PostgreSQL workflow 已接入相应 Gate。由于本轮按要求不提交、不推送，远端 Actions 证据仍待后续确认。

## Remote Terminal managed KMS and multi-Region recovery

本地重复命令：

```bash
pnpm run verify:g2:terminal-managed-kms
pnpm run verify:g2:remote-recovery
pnpm --filter @prodivix/remote-runner-control-plane test
pnpm --filter @prodivix/remote-runner-control-plane build
```

2026-07-19 本地结果：通过。

| 子 Gate                        | 证据                                                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed cipher/config          | 5 files / 13 tests passed；覆盖 PRT2 exact AAD/tamper、独立 replica、per-revision data key、old/new rotation/retirement、strict config 与 live PRT1 broker CAS migration。 |
| AWS KMS adapter                | exact immutable ARN/region/algorithm/response、hashed CloudTrail context、pre-KMS metadata rejection、bounded timeout 与 retryable dependency classification 通过。        |
| Multi-Region broker recovery   | related MRK primary/replica 通过同一 opaque row 双向继续 stdin、worker mailbox、output cursor、token rotation 与 revision CAS；unrelated MRK fail closed。                 |
| Runtime outage preservation    | Runtime Remote 13 files / 81 tests passed；cipher open/seal outage 保持 exact revision，恢复后同 sequence 只产生一个 input command。                                       |
| Full Control Plane / aggregate | 10 files / 32 passed + 2 live skipped；build 通过。完整 Remote recovery 32 秒通过：Core 19、Remote 81、managed KMS 13、HTTP 9、Worker 15、Web 12。                         |

关键闭环：

1. PostgreSQL 仍只保存 opaque bytes；PRT2 本地用随机 data key 加密 checkpoint，AWS KMS 只看到该 32-byte key 与
   AAD digest，不接触 stdin、output、token、execution/session raw identity 或 checkpoint。
2. managed rolling rotation 通过 logical id -> exact ARN map 读取 old/new key，新 revision只用 active key；可选 static
   ring 只读 PRT1，首次成功 mutation 由同一 CAS 原子升级 PRT2。
3. KMS timeout/throttling/5xx 使用 retryable cipher-unavailable boundary；失败前后不 CAS、不清 mailbox、不旋转 token，
   sweeper 也不删除无法取得 key 的 authority row。
4. MRK metadata 固定 partition/account/`mrk-*` stable identity，但每个 Region 的请求/响应仍要求 exact local ARN；
   cryptographic portability 与 ADR 52 的 PostgreSQL/Worker/traffic DR contract 保持两个独立 Gate。

GitHub `G2 Managed KMS` workflow 已配置本地 contract、OIDC old/active live rotation 和可选 related MRK replica live Gate。
本轮按要求未提交、未推送，因此两个 live test 在本地无 AWS 环境时明确 skipped，首次远端证据仍待取得。

## Regional PostgreSQL / Worker / traffic disaster-recovery drill

本地重复命令：

```bash
PRODIVIX_REMOTE_POSTGRES_TEST_URL='postgres://postgres:postgres@127.0.0.1:5432/prodivix_test?sslmode=disable' pnpm run verify:g2:regional-dr
```

2026-07-19 本地 PostgreSQL 结果：通过。

| 子 Gate                      | 证据                                                                                                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Recovery contract            | 1 file / 6 tests passed；覆盖 target missing/behind/ahead、same-cursor drift、configured-region identity、queued/live/expired/exhausted/terminal mode 与 exclusive-section Terminal revocation。 |
| 双 schema PostgreSQL         | 1 file / 2 tests passed；repeatable-read exact digest、cursor lag、state drift、shared request drain、epoch CAS、standby hard cut 与 immutable cutover evidence。                                |
| 双 HTTP Control Plane/config | 2 files / 5 tests passed；all-or-none config、standby liveness/readiness、同 lease 目标区续租、旧区写拒绝，以及 attempt 1 -> 2、旧 lease rejection、旧 Terminal sweep 与新 generation。          |
| GitHub Gate                  | `G2 PostgreSQL Gates` 的 PostgreSQL 16 service 已执行 `verify:g2:regional-dr`；远端证据待阶段性提交推送后确认。                                                                                  |

关键闭环：

1. application 不复制生产 row；probe 只验证基础设施复制结果，损坏 grant/blob、event gap、artifact bytes drift、target ahead 或
   同 cursor digest drift 均 fail closed。
2. 每个 accepted HTTP request 与 background sweep 持有 shared advisory transaction；cutover 的 exclusive lock 先 drain，再在
   无 active writer 窗口内重验 source/target、撤销旧 Terminal，并以 expected epoch CAS 切换 active region。
3. live lease 保留 exact worker/token/attempt；expired lease 只走既有 bounded claim 产生 attempt+1。旧 PTY 不迁移，旧
   Terminal row 关闭并 revision-fenced 删除后，新 Worker 才能创建不同 session id。
4. `/healthz` 只表示进程活着；`/readyz` 与业务请求共同消费 current traffic authority。standby/authority outage 不降级写入，
   每次成功切换在同一 transaction 留下 source/target/epoch/checkpoint digest/time evidence。

本 Gate 关闭本地可重复 regional DR contract，不冒充真实跨 Region database promotion、DNS/Anycast 或 RPO/RTO 测量。

## Bounded Terminal emulator product Gate

本地重复命令：

```bash
pnpm run verify:g2:terminal-emulator
```

2026-07-19 本地结果：通过。

| 子 Gate          | 证据                                                                                                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime Core     | typecheck 通过；3 files / 26 tests passed。覆盖 Terminal Session/Secret 基线，以及跨 record ANSI、cursor/erase、SGR、alternate screen、scrollback/resize、fragmentation、gap 与 conceal-safe copy。                  |
| Execution Center | typecheck 通过；2 files / 17 tests passed。覆盖 normal/application key、Control/AltGr、bounded bracketed paste、ANSI render、rapid ordered input、exact retry、interrupt 与 invalid-output fail-close。              |
| Full regression  | Runtime Core 21 files / 91 tests、Web 87 files / 312 tests、完整 `verify:g2:remote-recovery` 均通过；Core/Web production build、Web ESLint、package boundary、property naming、Prettier 与 `git diff --check` 通过。 |
| GitHub workflow  | `G2 Execution Contract Matrix` 已加入 `verify:g2:terminal-emulator`；本轮按要求不提交、不推送，远端 Actions 证据待阶段性推送后确认。                                                                                 |

关键闭环：

1. emulator 只消费 strict output record，exact terminal/execution/job、cursor、UTF-8 byte length 或 chunk budget drift 时 cursor
   不前移且 UI 固定 fail closed；duplicate cursor 幂等忽略，gap 显式投影。
2. parser state 只跨同一 stream 的连续安全块；gap、redacted、truncated 与二次 credential redaction 在前后 hard cut。
   OSC clipboard/hyperlink、DCS/APC/PM 与 device response 不执行。
3. Web 只渲染 immutable line/run；SGR concealed cell 不进入 DOM text、screen-reader live region 或 rendered copy。copy 不含
   ANSI/OSC，并再次执行 credential 与 128 KiB budget。
4. stdin 只在 ref 内的 256 chunks/32 KiB queue 短暂存在；单次输入仍受 16 KiB Core budget。断线只以同 bytes/
   clientSequence 重试队首，close、identity drift 与 unmount 清空，不进入 React state、Job history 或 Workspace。

本 Gate 关闭 G2 的有界 Terminal emulator 产品纵切；完整 ECMA-48、graphics、host clipboard、search/selection 与 shell
completion 是 ADR 53 的显式 non-goal，不以 unknown fallback 冒充支持。

## 尚未形成 G2 closure 的边界

- stream reconnect/resume、跨 execution replay、Secret credential renewal、更多 transport 与 incremental
  collection semantics；
- 真实 Remote authenticated Catalog live journey、Vue layout/outlet 与完整跨 target Asset delivery/sanitize UI matrix；
- regional DR 首次真实云端 RPO/RTO evidence、AWS KMS/MRK 首次远端证据、其余
  diagnostic/Issues producer debugger closure，以及
  [`current-status.md`](./current-status.md) 中列出的其他 G2 剩余项。
