# G2 NodeGraph Execution Session 实施计划

## 状态

- DecisionStatus：Accepted
- ImplementationStatus：G2 Same-context Slice Implemented / Closure Evidence Pending
- ProductGateStatus：G2 In Progress
- Global Phase：G2 Executable Full-stack Workspace
- 日期：2026-07-16
- Owner：`@prodivix/nodegraph`、`@prodivix/runtime-core`、`apps/web` composition root
- 关联：
  - `specs/implementation/g2-executable-full-stack-workspace.md`
  - `specs/decisions/42.nodegraph-execution-session.md`
  - `specs/decisions/40.execution-provider-and-job.md`
  - `specs/decisions/25.authoring-symbol-environment.md`

## G2 目标

让 NodeGraph 的确定性 executor 通过共享 `ExecutionProvider / ExecutionJob / ExecutionSession`
进入产品，而不产生第二套运行协议、历史系统或作者态。一次执行绑定 exact NodeGraph document
revision，输出 bounded trace、稳定 diagnostics 和显式 temporary state patch；编辑器可以查看和定位，
但不会把运行结果自动保存回 Canonical Workspace。

该纵切已经实现。G2 剩余工作是补齐与全局 Runner/Data/Golden 的组合证据，而不是把 NodeGraph
提前改造成远程工作流平台。

## 已实现边界

- 无 DOM 的 NodeGraph current contract、strict codec、validator 与 deterministic executor。
- executor registry、built-in executors、输入/输出校验、step budget 与 deterministic trace。
- same-context `ExecutionProviderDescriptor`，声明 nodegraph invocation/capability。
- NodeGraph request builder、job lifecycle、cancel/timeout 与 instance-owned session coordinator。
- editor/runtime composition、run action、running/result/error product state。
- diagnostic target、node identity、trace step 与 runtime error 的稳定映射。
- 执行产生的 state patch 保持 temporary；没有绕过 Command/Transaction 写回 Workspace。

## G2 不变量

1. Canonical NodeGraph document 是唯一作者态；compiled plan、executor registry 和 execution result
   都可重建或可丢弃。
2. request 必须携带 exact Workspace/document revision 与 stable diagnostic target。
3. executor 只能通过显式 registry 解析；未知 kind、未知 executor 或 capability 不匹配 fail closed。
4. trace 顺序、step budget、timeout 与 cancellation 对相同输入可重复。
5. runtime value 和 patch 必须 transport-safe、bounded，不包含 DOM、closure、Secret 或 provider object。
6. patch 不等于 Command。用户决定采纳运行结果时，领域 planner 生成可逆 Workspace Transaction。
7. editor 只消费 Session snapshot/event，不直接订阅 executor 内部可变状态。

## Remote 与 Data 的边界

G2 不为每个 NodeGraph node 建立 Remote RPC。完整项目使用 Remote Project Runner 时，NodeGraph
runtime 随 Executable Project Snapshot 在项目 sandbox 内执行，保持节点间低延迟和确定性。

只有当未来节点获得 `network`、`secret`、`server/edge` 或 Data operation capability 时，才需要：

- 在 graph 编译/执行前做 capability 与 runtime-zone planning；
- 通过 `DataOperationReference` 或 `SecretRef` 调用共享 runtime service；
- 禁止 executor 保存 literal credential 或任意 network adapter；
- 将外部副作用纳入幂等、retry 和 trace correlation。

这些属于 G3 typed flow / privileged node extension。未有对应 ADR 前，不扩展 NodeGraph 保存态。

## 产品行为

### 开始执行

- editor 从当前 confirmed Workspace snapshot 构造 request。
- 若存在未保存草稿，产品必须明确要求保存或声明 ephemeral draft execution；不能混合 revision。
- registry 根据 invocation、capability 与 policy 选择 same-context provider。
- active session 显示 request/document revision、开始时间与 cancellation ownership。

### 运行与追踪

- 节点进入、输入解析、executor 输出、edge propagation 与终止形成有预算的 trace step。
- trace 对 value 做深度、长度、字节和类型限制；不可序列化值形成 diagnostic。
- 当前节点、成功节点、失败节点与 diagnostic target 通过 stable node id 对齐，不依赖 DOM 顺序。

### 结束与采纳

- succeeded/failed/cancelled/timed-out 均为 terminal state。
- result 与 temporary patch 留在 session；切换 revision 后标记 stale，而不是显示为当前结果。
- “应用结果”如未来开放，必须先呈现 impact/diff，再通过 NodeGraph Command/Transaction 写入。

## 实施与证据阶段

### N0：Domain kernel

- [x] current contract、codec 与 validation。
- [x] deterministic executor、registry、trace 与 state patch。
- [x] step budget、runtime error 与 cancellation hook。

### N1：Execution integration

- [x] same-context provider descriptor 与 request builder。
- [x] job/session lifecycle、result/event 与 diagnostic mapping。
- [x] instance-owned coordinator，避免跨 editor active job 冲突。

### N2：Product surface

- [x] editor run/cancel、running、result、error 与 trace surface。
- [x] diagnostic target navigation。
- [x] runtime output 不进入 History/Outbox。

### N3：G2 closure evidence

- [ ] public contract conformance：同一输入、registry 与 budget 得到同一 trace/result。
- [ ] property tests：未知 executor、非法 edge/value、cycle/step budget、cancel 与 timeout。
- [ ] session isolation：两个 editor/provider instance 不共享 active job、cancel 或 result。
- [ ] revision UX：作者态 revision 变化后，旧 Session/result 显式标记 stale。
- [ ] Project Runner integration：导出工程内 NodeGraph 使用同一 runtime semantics。
- [ ] Golden CRUD 只在确有 graph trigger 时覆盖 Data correlation；不为凑 Gate 制造虚假图。

完成条件：以上证据进入 G2 closure manifest；无需等待 G3 远程/特权节点能力。

## G3 延后项

- typed execution flow 与跨 graph composition；
- subgraph、graph function、并发、suspend/resume 与 durable workflow；
- Data operation、Secret、network、server/edge 等 privileged nodes；
- visual behavior scenario 与 VerificationEvidence；
- 远程分布式 node 调度。

这些能力不得以可选字段或 Web 私有逻辑偷偷进入 G2 current contract。

## Gate

| Gate          | 断言                                                            |
| ------------- | --------------------------------------------------------------- |
| Determinism   | 相同 revision/input/registry/budget 的 result 与 trace 顺序一致 |
| Isolation     | provider/session instance 不共享 active state                   |
| Bounds        | step、value、trace、timeout 全部有限                            |
| Diagnostics   | runtime failure 定位 stable graph/node target                   |
| Persistence   | result/patch 不直接写 Workspace/History/Outbox                  |
| Export parity | editor 与导出工程使用相同 domain runtime semantics              |

## 风险与停止条件

- 若 executor 需要读取 editor React state 或 DOM，停止并补显式输入/capability。
- 若 temporary patch 被直接当作 Workspace patch，停止并增加领域 planner/Transaction。
- 若为了 Remote Runner 将每个 node 变为网络调用，维持项目内执行并延后分布式设计。
- 若 Data/Secret node 通过裸字符串或 literal credential 接入，拒绝合并并先完成类型化引用与
  zone authorization。

## 验收标准

- [x] NodeGraph 通过共享 execution contract 完成 same-context 纵切。
- [x] request/result/trace/diagnostic 与作者态 revision、node identity 对齐。
- [x] runtime patch 不直接持久化。
- [ ] N3 conformance、isolation、revision UX 与 export parity 证据进入 G2 closure。
- [ ] G3 能力保持显式延后，没有污染 G2 current contract。
