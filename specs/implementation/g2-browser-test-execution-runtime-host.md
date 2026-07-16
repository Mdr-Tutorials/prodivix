# G2 Browser Test Execution 与 Runtime Host 实施计划

## 状态

- DecisionStatus：Accepted
- ImplementationStatus：Browser Test + Neutral Snapshot Implemented / Remote Parity Planned
- ProductGateStatus：G2 In Progress
- Global Phase：G2 Executable Full-stack Workspace
- 日期：2026-07-16
- Owner：`@prodivix/runtime-core`、`@prodivix/runtime-browser`、`apps/web` composition root
- 关联：
  - `specs/implementation/g2-executable-full-stack-workspace.md`
  - `specs/implementation/g2-execution-provider-remote-runner.md`
  - `specs/decisions/44.browser-test-execution-and-runtime-host.md`
  - `specs/decisions/40.execution-provider-and-job.md`

## 目标

让 Workspace Test 作为导出工程测试宿主运行 exact Canonical Workspace revision，并通过共享
Execution contract 返回工具无关的 `ExecutionTestReport`。Preview 与 Test 可以复用匹配的依赖
install cache，但必须拥有独立 provider、Job、Session、取消与结果；Browser 与 Remote Test
通过同一 conformance，而不是让 Web 理解 Vitest、Playwright 或容器供应商私有 JSON。

G2 的 Test 验证工程运行、Data runtime 和导出 parity。它不是 G3 的 BehaviorScenario、
VerificationPlan 或 VerificationEvidence，也不把运行报告持久化为 Workspace 作者态。

## 当前基础与缺口

### 已实现

- transport-neutral `ExecutionTestReport` 与 `test.report` trace contract 位于
  `@prodivix/runtime-core`。
- Browser Test Provider 具有独立 descriptor、invocation/capability、Job 与 Session。
- `@prodivix/runtime-browser` 在 adapter 边界把 Vitest 私有结果转换为 shared report。
- `BrowserProjectRuntimeHost` 管理 filesystem snapshot、dependency install、process 与 dispose。
- Preview/Test owner-scoped process 相互独立，可复用匹配 dependency install。
- Web 测试表面消费 shared report，不解析 Vitest JSON。
- Compiler 直接产出 provider-neutral Executable Project Snapshot，Browser Test 只消费。

### 未实现

- Remote Test Provider、artifact transport、断线/replay/timeout conformance 尚未实现。
- 测试选择、发现、watch/re-run、stale revision 和大型报告预算仍需收敛。
- Data mock/live policy、Secret permission 和 CRUD runtime journey 尚未接入。
- standalone second target 的同一 test suite parity 尚未建立。

## Test request 与 report

Test request 必须显式声明：

- exact Workspace/snapshot revision 与 target；
- `profile=test`、`runtimeZone=test`、`invocation=test`；
- test selection/filter、timeout、required capabilities；
- environment snapshot reference 和 mock/live policy；
- stable diagnostic target 与非秘密 metadata。

当前 `ExecutionTestReport` 已稳定表达：

- report id、tool identity、started/completed/duration 与 passed/failed report outcome；
- file/case stable id、display name、`passed / failed / skipped / todo` status 与 duration；
- bounded failure message，以及 file/case 级 optional SourceTrace；
- deterministic summary。

request/job/provider/snapshot identity 由包含 report 的 Job、Session、`test.report` trace 和 report
artifact correlation 负责，不复制进 report domain object。`cancelled / timed-out` 是 Job terminal
outcome；如果执行未形成完整工具报告，不能伪造 passed/failed report。G2 仍需补充：

- report、failure、SourceTrace 和 tool metadata 的显式字节/数量预算与 truncation marker；
- stdout/stderr/attachment 的 bounded summary 或 digest/size/media type artifact reference；
- request/job/provider/snapshot/report/artifact correlation conformance；
- partial report 是否允许发布的单一规则，以及 cancel/timeout 时 report 与 terminal result 的一致性。

工具 adapter 负责把 Vitest 等私有结构转换为这些字段。共享层不承诺 snapshot serializer、hook
内部状态、runner task object 或供应商 artifact URL。

## Runtime Host 不变量

1. Host 由 composition root 长期拥有，单个 React component 不自行创建全局 runtime。
2. 每次 Preview/Test 执行有 owner scope 与 generation；stop/dispose 不能终止其他 owner process。
3. dependency cache key 至少绑定 runtime implementation、target、manifest、lock/install fingerprint
   与 policy；不能只按 Workspace id 复用。
4. filesystem generation 始终从 immutable snapshot materialize；cache 不携带旧项目文件。
5. Test 和 Preview 可共享 install cache，不共享 active server、Job、Session、cancel 或 result。
6. report/session event 是可丢弃运行态，不写 Workspace、local replica 或 outbox。
7. runtime FS 变化不自动回写；采纳必须通过 diff proposal 与 Workspace Transaction。

## Test isolation 与环境策略

- Test 默认使用 deterministic mock environment；启用 live 必须显式选择并满足 provider/zone
  permission。
- mutation fixture 需要 per-run namespace、cleanup 或事务回滚策略，禁止无隔离访问生产环境。
- clock、random、id 和 scheduler 通过 runtime test ports 注入，以便 retry/pagination/optimistic
  行为可重复。
- Secret 只在授权 Test runtime zone resolve，不能进入 report、console、snapshot 或 attachment。
- test file、generated source 与 user code 运行在 provider sandbox 中，受 timeout、memory、process、
  filesystem、network 和 output budget 限制。

## 实施阶段

### T0：Shared report contract

- [x] transport-neutral report、file/case/outcome 与 trace contract。
- [x] strict adapter boundary；Web 不解析工具私有 payload。
- [ ] 补充 report budget、truncation、attachment ref 与 source trace conformance。
- [ ] 补充 request/job/provider/snapshot/report/artifact correlation conformance。
- [ ] 冻结 cancel/timeout、partial report 与 terminal result 的一致性规则。

### T1：Browser Test Provider

- [x] 独立 provider descriptor、request/job/session lifecycle。
- [x] Browser runner adapter 与 Vitest result conversion。
- [x] run/cancel/result/error 产品表面。

### T2：Shared Runtime Host

- [x] composition-root-owned host。
- [x] filesystem/install/process owner scope 与 dispose。
- [x] Preview/Test dependency install reuse，不共享 execution state。
- [ ] 补充 generation race、owner cancel 和 failed-install recovery property tests。

### T3：Neutral snapshot migration

- [x] Test compiler/plan 产出 Executable Project Snapshot current contract。
- [x] Browser Test consumer 去除 Browser-owned snapshot dependency。
- [ ] snapshot digest、test selection、target 与 source trace 纳入 request/result correlation。
- [x] 删除兼容层。

完成条件：Browser Preview/Test 与 Remote Test 可以消费同一 snapshot，不复制工程 planner。

### T4：Remote Test Provider

- [ ] Remote descriptor、start/cancel/event/report/artifact adapter。
- [ ] worker-side test tool adapter，只输出 shared report。
- [ ] cursor replay、disconnect、timeout、worker loss 与 retry semantics。
- [ ] artifact digest/TTL/authorization 和 bounded report upload。

完成条件：Web 对 Browser/Remote Test 使用同一 selector、state 与 report UI。

### T5：Data 与 environment test runtime

- [ ] deterministic mock adapter/fixtures 是默认 Test environment。
- [ ] Data operation trigger、loading/empty/error/retry/pagination/optimistic fixtures。
- [ ] live opt-in、zone permission、network policy、Secret canary 与 mutation isolation。
- [ ] Console/Network/Test report correlation 到同一 operation/source trace。

完成条件：mock 缺失 fail closed，不静默访问 live；test report 无 Secret。

### T6：Test authoring/product flow

- [ ] test discovery、stable selection、run all/run selected/re-run failed。
- [ ] 当前 revision、运行 revision 和 stale result 明确可见。
- [ ] report failure 可跳转 Workspace Code/PIR/Data/source trace。
- [ ] large suite virtualization 与 bounded in-memory retention，不依赖 DOM 结构测试。

完成条件：用户可以从一个失败用例直接定位作者态，并判断结果是否已 stale。

### T7：Parity 与 Golden

- [ ] Browser/Remote shared conformance suite。
- [ ] React/Vite 与单一第二 target 执行同一 runtime test suite。
- [ ] Golden CRUD journey 覆盖 mock 和显式受控 live environment。
- [ ] standalone install/typecheck/test/build/browser-smoke。

完成条件：同一 snapshot/fixture 的语义结果一致；runner/tool 差异不会泄漏到产品 contract。

## G3 明确延后

- BehaviorScenario、VerificationPlan、VerificationEvidence；
- 可视化行为录制、proof artifact 与发布阻断策略；
- 跨浏览器矩阵、视觉回归治理和测试智能生成闭环。

G2 report 可以成为未来 Evidence 的输入，但不能提前宣称自己就是 Evidence。

## Gate

| Gate               | 断言                                                              |
| ------------------ | ----------------------------------------------------------------- |
| Provider isolation | Preview/Test provider、Job、Session、cancel/result 不共享         |
| Host lifecycle     | install 可复用，project generation/process 不串 owner             |
| Report neutrality  | Web/shared package 不解析 Vitest/Remote 私有 JSON                 |
| Revision           | request/report 精确绑定 snapshot digest 与 Workspace revision     |
| Data safety        | Test 默认 mock；live/mutation/Secret 需显式授权并隔离             |
| Parity             | Browser/Remote 和两个 target 使用同一 conformance/runtime journey |
| Persistence        | report/event/attachment 不成为 Workspace truth                    |

## 风险与停止条件

- 如果 Preview/Test 为了复用而共享 active process 或 cancellation，先修 owner scope。
- 如果 Web 需要判断 Vitest task shape 或 Remote payload，先修 adapter/report contract。
- 如果 mock miss 会 fallback live，停止 Data test integration 并改为稳定错误。
- 如果测试报告无限保存 stdout、stack 或 attachment，先加预算和 artifact reference。
- 如果普通 G2 report 被持久化为 VerificationEvidence，保持运行态并延后 G3 模型。

## 验收标准

- [x] Browser Test 已使用独立 provider 和 shared report contract。
- [x] Preview/Test 只复用安全的 install cache。
- [ ] neutral snapshot、Remote Test 与 recovery conformance 完成。
- [ ] deterministic Data test runtime 与 Secret/mutation safety Gate 完成。
- [ ] Browser/Remote、React/Vite/第二 target parity 和 Golden CRUD 通过。
