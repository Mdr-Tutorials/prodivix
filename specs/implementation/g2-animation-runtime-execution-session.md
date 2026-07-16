# G2 Animation Runtime 与 Execution Session 实施计划

## 状态

- DecisionStatus：Accepted
- ImplementationStatus：G2 Browser Slice Implemented / Closure Evidence Pending
- ProductGateStatus：G2 In Progress
- Global Phase：G2 Executable Full-stack Workspace
- 日期：2026-07-16
- Owner：`@prodivix/animation`、`@prodivix/runtime-browser`、`@prodivix/runtime-core`
- 关联：
  - `specs/implementation/g2-executable-full-stack-workspace.md`
  - `specs/decisions/43.animation-runtime-and-execution-session.md`
  - `specs/decisions/40.execution-provider-and-job.md`
  - `specs/decisions/41.project-runner-and-canvas-modes.md`

## G2 目标

在保持 Animation current document 为唯一作者态的前提下，把确定性 timeline evaluator、Browser
RAF/effect projection 和共享 Execution Session 串成可运行纵切。编辑器预览与导出工程应共享
timeline sampling、loop/direction/fill/easing 与 target resolution 语义；DOM effect 只存在于
Browser runtime adapter，不进入 `@prodivix/animation`。

该纵切已经实现。G2 剩余工作是固定 conformance/export parity 证据，以及确保 Project Runner
切换 Browser/Remote 时仍在项目客户端执行动画，而不是通过网络传输每一帧。

## 已实现边界

- Animation current contract、strict codec、authoring factory 与 semantic validation。
- deterministic timeline evaluator、sampling、loop/direction/fill 与 keyframe interpolation。
- DOM-free Runtime Port 和 same-context ExecutionProvider。
- Browser RAF clock、target resolver、style/effect projection 与 cleanup。
- request/job/session lifecycle、cancel/timeout/result/event 和 revision-aware product surface。
- runtime diagnostics 定位到 animation document、track、target 或 keyframe identity。

## G2 不变量

1. Animation document 是唯一作者态；runtime instance、clock、resolved target、frame 与 applied
   effect 都是可丢弃状态。
2. domain evaluator 接收显式 time/input/options，不能读取 `performance`、RAF、DOM 或 editor state。
3. Browser adapter 独占 RAF、DOM target resolution 与 effect apply/revert。
4. execution request 绑定 exact document/Workspace revision；revision 变化后旧 session 标记 stale。
5. cancel、finish、target removal、provider dispose 与 error 都必须清理 effect 和 RAF handle。
6. frame/event 有预算；不把每帧 style 作为无限 ExecutionEvent 或持久化 history。
7. 运行结果和当前位置不写回 Canonical Workspace；作者态 scrub/edit 仍走 Command/Transaction。

## Project Runner 与 Remote 边界

Remote Project Runner 执行完整导出工程时，动画 JavaScript 在 preview 客户端的 Browser runtime
中运行。Remote worker 负责 build/dev server 和 artifact，不承担逐帧 evaluator/DOM projection RPC。

因此 G2 不需要 Remote Animation Provider。需要 server-side render、离线视频、GPU compute 或跨端
timeline orchestration 时，应另立 capability/ADR；不能把它们塞进现有 Browser effect adapter。

## 产品行为

### Preview session

- editor 选择 animation、目标 scope 和 exact revision，构造 immutable request。
- provider 建立独立 runtime instance；play/stop/cancel 只作用于该 instance。
- 作者态 cursor scrub 使用 deterministic evaluator 做本地采样；scrub 会先停止 active playback，
  当前 G2 slice 不把它描述为可暂停后恢复的 runtime seek。
- target resolution 失败、target 被删除或 property 不支持时产生稳定 diagnostic，不静默跳过。

### Timeline 与 effect

- evaluator 只输出 transport-safe sampled values/effects。
- Browser adapter 在 RAF tick 合并同一 target/property 的 projection，避免跨 session 相互覆盖。
- apply 前记录 instance-owned baseline；cleanup 只撤销本 instance 的 effect，不覆盖更新 revision 或
  其他 owner 后续写入。
- authoring cursor scrub 使用 deterministic sample；实时播放的 wall-clock jitter 不改变采样语义。

### 诊断与定位

- document/track/keyframe/target 使用 stable identity，而非数组位置或 DOM selector 作为唯一目标。
- runtime error、unsupported property、invalid value 和 target resolution 能进入 Issues。
- frame-level telemetry 只保留 bounded summary；详细性能分析属于专用 profiler，不进入通用 Job log。

## 实施与证据阶段

### A0：Current model 与 evaluator

- [x] current contract、codec 与 authoring factory。
- [x] deterministic sample、loop/direction/fill/easing 语义。
- [x] semantic validation 与 stable diagnostic target。

### A1：Runtime Port

- [x] DOM-free runtime contract 与 instance lifecycle。
- [x] explicit clock/target/effect ports。
- [x] cleanup、cancel、finish 与 error semantics。

### A2：Browser adapter

- [x] RAF clock、DOM target resolver 与 effect projection。
- [x] owner-scoped apply/revert 与 dispose。
- [x] target disappearance 和 invalid effect diagnostics。

### A3：Execution integration

- [x] same-context provider descriptor、request builder 与 job/session。
- [x] revision-bound result/event/diagnostic。
- [x] parallel instance isolation 与 cancellation ownership。

### A4：Product surface

- [x] Animation editor play/stop、authoring cursor scrub preview 和 state projection。
- [x] 执行前保存 exact revision 与 error feedback。
- [x] Browser preview integration。

### A5：G2 closure evidence

- [ ] property tests：sampling、boundary time、loop/direction/fill、authoring scrub 与 deterministic clock。
- [ ] lifecycle tests：cancel/finish/error/target removal/dispose 均无 RAF/effect 泄漏。
- [ ] instance isolation：同 target 的多个 owner 不相互撤销新值。
- [ ] revision UX：作者态 revision 变化后，旧 Session/result 显式标记 stale。
- [ ] export parity：editor Browser runtime 与 standalone React/Vite 使用同一 fixtures。
- [ ] Project Runner：Browser/Remote preview artifact 内的动画语义一致。

完成条件：证据进入 G2 closure manifest；不等待 G3 Blueprint orchestration。

## G3 延后项

- Blueprint `play-animation` Command 与跨编辑器 typed binding；
- multi-timeline composition、nested timeline、route lifecycle 与 choreography；
- runtime pause/resume/seek，以及 Preview/Export 共用的 reduced-motion policy；
- animation CodeSlot/easing script、shader track 和 richer SVG/filter authoring；
- visual regression、reduced-motion verification 和 BehaviorScenario/Evidence；
- 离线渲染、视频导出或远程逐帧计算。

## Gate

| Gate             | 断言                                                           |
| ---------------- | -------------------------------------------------------------- |
| Determinism      | explicit clock 下相同 document/time/options 得到相同 sample    |
| Runtime boundary | domain package 无 DOM/RAF/provider SDK                         |
| Lifecycle        | cancel/finish/error/dispose 无 RAF、listener 或 effect 泄漏    |
| Ownership        | cleanup 不覆盖其他 session 或新 revision 的 effect             |
| Diagnostics      | failure 定位 stable animation/track/target/keyframe            |
| Export parity    | editor、Browser Project Runner、Remote preview client 语义一致 |

## 风险与停止条件

- 若 evaluator 直接读取 DOM、RAF 或 wall clock，停止功能扩展并恢复 Runtime Port 边界。
- 若 effect cleanup 依赖当前 DOM value 猜 owner，先建立 instance ownership，不以条件分支补丁掩盖。
- 若 Remote 设计要求逐帧网络事件，维持 client-side runtime 并拒绝该路径。
- 若 Blueprint 调用通过裸 animation id 或 Web 私有 state 接入，延后到 G3 typed binding ADR。
- 若 visual evidence 被当作 G2 普通 test report，保持两者分离并延后至 G3。

## 验收标准

- [x] Animation 通过共享 execution contract 完成 Browser same-context 纵切。
- [x] evaluator 与 DOM/RAF adapter owner 分离。
- [x] runtime state/effect 不成为作者态。
- [ ] A5 conformance、lifecycle、isolation 与 export parity 证据进入 G2 closure。
- [ ] G3 orchestration/evidence 能力保持显式延后。
