# 测试与产品 Gate

测试服务于稳定语义和产品证据，不用于锁死 DOM 层级、class 名或内部实现。

## 测试层次

| 类型        | 命名                               | 适合验证                         |
| ----------- | ---------------------------------- | -------------------------------- |
| 示例/单元   | `<subject>.test.ts(x)`             | 小型公开行为与明确例子           |
| 属性测试    | `<subject>.property.test.ts(x)`    | 不变量、往返、幂等、任意输入组合 |
| Conformance | `<subject>.conformance.test.ts(x)` | 跨实现稳定契约和产品 Gate        |
| Integration | `<subject>.integration.test.ts(x)` | 多 owner 边界组合                |
| E2E         | `<journey>.spec.ts`                | 真实用户旅程                     |

对 codec round-trip、Command apply/revert、operation idempotency、graph normalization 和 source projection，优先使用属性测试。已有属性测试覆盖同一语义后，不再保留大量重复示例测试。

不要写依赖 `querySelector`、`closest`、`parentElement`、具体标签层级、内部 class 或快照的耦合测试。UI 测试应观察用户可感知结果和公开状态。

## 常用命令

```bash
pnpm test
pnpm test:web
pnpm test:golden
pnpm test:e2e:smoke
pnpm lint
pnpm build
```

针对单个 package 时使用 pnpm filter，避免无意义地反复运行整个仓库。

## G0 与 G1 Gate

```bash
pnpm verify:g0
pnpm verify:g1:standalone
pnpm verify:g1:browser
```

- G0 Gate 验证非浏览器 Truth & Change Kernel。
- G1 standalone Gate 在独立目录安装、类型检查、测试并构建导出项目。
- G1 browser Gate 在真实浏览器验证 route/form 行为，并通过真实 WebGL2 与可用环境下的 WebGPU 编译最小 shader。

WebGPU 不可用必须记录为环境能力结果，不得伪造成功。视觉回归、accessibility、performance 与后续正式 `VerificationEvidence` 是独立 Gate。

## Workspace Test 运行

编辑器中的 Test 页面运行当前 Canonical Workspace revision 导出的独立 React/Vite 工程。存在 blocking export diagnostic 时运行会被阻断；准备成功后，Browser Test ExecutionProvider 在 `test` runtime zone 启动 snapshot 声明的 Vitest plan。

Preview 与 Test 是两个独立 Provider：它们拥有不同 descriptor、ExecutionJob、Session、取消和结果，只共享 `BrowserProjectRuntimeHost` 的 filesystem、依赖安装与 browser Node runtime。这样既能复用昂贵的安装资源，也不会把预览 server 和测试进程混成同一个生命周期。

Vitest JSON 在 Browser adapter 边界转换为 `@prodivix/runtime-core` 的 `ExecutionTestReport`。Test 页面展示 file/case status、duration 与 failure message，并通过共享 Execution Center 提供日志、停止和重跑；未来 Remote provider 与其他测试工具继续输出同一 transport-neutral report contract。

`TST-5001` 表示已经取得报告后的用例/测试失败；`TST-5002` 表示宿主准备、命令执行或报告转换失败。两者都属于 G2 Workspace Test execution diagnostic，不是 VerificationEvidence code。

这个 G2 纵切是 Workspace 导出工程测试宿主，不等同于 G3 的 `BehaviorScenario`、`VerificationPlan` 或 `VerificationEvidence`。运行报告与 Session event 是可丢弃运行态，不写入 Canonical Workspace 或 Outbox。

## Closure evidence

通过一个 Gate 需要可重复证据，而不是“测试大概都绿了”。当前证据保存在：

- `specs/roadmap/g0-closure-evidence.md`
- `specs/roadmap/g1-closure-evidence.md`

阶段定义保存在 `specs/roadmap/global-phases.md`，产品文档只摘要，不另建第二份状态表。
