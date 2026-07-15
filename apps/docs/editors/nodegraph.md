# NodeGraph 编辑器

NodeGraph 用于表达可执行的数据流、控制流和行为组合。它拥有独立的 `pir-graph` 文档，不嵌进 PIR UI 节点，也不由 React Flow 的界面 state 充当保存态。

## 文档与画布

节点、边、端口语义、图元数据与代码引用由 `@prodivix/nodegraph` 的 current contract 解码和校验。Web 编辑器只负责图形交互与浏览器 adapter。

创建、连接、移动或删除节点时，作者操作会转换成 NodeGraph/Workspace Command。画布位置属于可持久化作者信息，但 React Flow 实例对象不进入 Workspace。

## 节点执行

NodeGraph kernel 提供 transport-neutral executor、确定性 trace、扩展 registry 与 same-context ExecutionProvider。编辑器 Run 和 Blueprint 的 `run-nodegraph` trigger 都从精确 Canonical Workspace revision 创建 `ExecutionRequest`，再由同一 Job/Session 协议发布状态、日志、诊断、SourceTrace、取消、timeout 与结果。

NodeGraph 编辑器提供 Run/Stop，并复用共享 Execution Center 的 All/Errors、事件保留和重启控制。默认 `start/process/switch/log/end` registry 可确定性执行；未注册节点 fail closed 为 `NGR-1001`，不会被 Web UI 临时解释。需要网络、Secret 或服务端能力的节点必须选择具备相应 capability 与 runtime zone 的后续 provider。

旧的 browser action 直调协议已经删除，`@prodivix/runtime-browser` 不再拥有 NodeGraph 执行语义。Remote Isolated provider、完整数据流/异步/错误/断点语义与 CodeSlot executor 继续在 G2/G3 收敛。

## 自定义 Executor

需要代码的节点通过 executor/transform Code Slot 绑定 Workspace code artifact。Slot 声明输入、输出、能力和诊断目标；NodeGraph 文档只保存类型化 `CodeReference`。

## Revision conflict

当本地和远端基于同一 base 修改图时，冲突视图按语义实体展示节点、边和字段差异，而不是比较 React Flow DOM。颜色约定为：绿色新增、红色删除、黄色本地冲突、紫色远端冲突。

更多说明见[Issues、History 与冲突](/editors/issues-history-conflicts)和[Change 与 Sync](/concepts/change-and-sync)。
