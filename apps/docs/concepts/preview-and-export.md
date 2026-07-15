# Preview 与 Export

Preview 和 Export 都消费 Canonical Workspace，但服务于不同目标：Preview 提供快速交互反馈，Export 生成可脱离 Prodivix 运行的工程项目。

## Preview

蓝图画布提供三种运行深度：Design 直接投影 PIR-current 并开放作者操作；Interactive 在同一投影上执行轻量进程内交互；Run 将当前 Canonical Workspace 编译为独立 React/Vite 工程，在隔离 Browser Project Runner 中安装依赖、启动 Vite，并把真实项目 server 原位显示在画布 iframe。

Run 绑定精确 Workspace revision。仅源码变化时 Runner 同步文件并复用 Vite/HMR；依赖清单变化时重新安装和启动。stdout、console error、runtime failure 与 preview URL 通过统一 ExecutionJob 事件进入编辑器。

Execution Center 将短生命周期 Job 组织为稳定的项目运行会话，提供有界事件保留、All/Errors 过滤、停止、重启、刷新 iframe 与独立打开 Preview。离开 Run 后进程会停止，但当前编辑器生命周期内仍可查看该会话的日志；这些事件不是 Workspace 作者态，也不会持久化为第二真相源。

Preview DOM 是运行投影，不是保存态，也不能用来反向覆盖 PIR。

## Test

Test 页面运行与 Preview 同源的 exact Workspace revision 和独立 React/Vite export snapshot。Preview 与 Test 拥有不同的 ExecutionProvider descriptor、Job、Session、取消和结果；它们只共享长期 `BrowserProjectRuntimeHost` 的 filesystem、依赖安装与 browser Node runtime。

当前 Browser Test provider 执行 snapshot 声明的 Vitest plan。工具私有 JSON 在 Browser adapter 边界转换为 transport-neutral `ExecutionTestReport`，再通过 `test.report` trace 与 report artifact 进入 Test 页面。文件和用例状态、耗时、失败信息、运行日志、停止与重跑都来自同一个 revision-bound Execution Session。

测试报告是 G2 的导出工程运行结果，不写入 Workspace，也不自动成为 G3 的 `BehaviorScenario` 或 `VerificationEvidence`。

## Export Program

各领域 compiler 把 Workspace 文档转换为统一 Export Program：modules、styles、assets、dependencies、runtime requirements 与 source trace。Production Export Planner 再按 target preset 决定文件拓扑、imports 和配置。

```mermaid
flowchart LR
  Docs["PIR / Graph / Animation / Code / Assets"] --> Compilers["Domain compilers"]
  Compilers --> Program["Export Program"]
  Program --> Planner["Production Export Planner"]
  Preset["Target preset"] --> Planner
  Planner --> Bundle["Independent project"]
```

## Parity

Renderer 与 Compiler 必须对同一 current model 保持语义 parity。受控 JSX/CSS round-trip 也共享 SourceTrace 与 owner 边界，不能单独发明另一种组件结构。

## 当前 Gate

React/Vite target 已通过独立 install、typecheck、test、build 和真实浏览器 Gate，包括 WebGL2 及可用环境下的 WebGPU 验证。

ExecutionProvider/ExecutionJob 核心契约、共享 Browser Runtime Host、Preview/Test provider 与 Workspace Test 页面已经建立。Data/API 作者态 contract 与 reference-only environment/Secret identity 已建立，但尚未进入 Preview/Export execution；Remote provider、Terminal/Network、第二框架 target、Data runtime、Secret resolution、部署工作流、性能与视觉回归 Gate 继续按各自证据发布。

操作教程见[导出 React/Vite 项目](/tutorials/export-react-vite)。
