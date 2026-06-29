# External Library Diagnostics 编码规范（ELIB）

## 状态

- Draft-Frozen
- 日期：2026-02-17
- 阶段：Phase 0 / Gate A
- 关联：
  - `specs/diagnostics/README.md`
  - `specs/decisions/17.external-library-runtime-and-adapter.md`
  - `specs/implementation/external-library-task-backlog.md`

## 1. 目的

统一 external library 链路的错误码与阶段映射，保障错误可观察、可定位、可重试。

本文件是 Prodivix Diagnostics 体系下的 `ELIB-xxxx` 域码表。统一诊断结构、严重程度和跨域规则见 `specs/diagnostics/README.md`。

## 2. 统一结构

```ts
type ExternalLibraryDiagnostic = {
  code: string; // ELIB-xxxx
  level: 'info' | 'warning' | 'error';
  stage: 'load' | 'scan' | 'register' | 'render' | 'codegen';
  message: string;
  hint?: string;
  retryable?: boolean;
};
```

## 3. 编码分段（Frozen）

1. `ELIB-10xx`：`load` 阶段（远程入口、模块加载、依赖桥接）。
2. `ELIB-20xx`：`scan` 阶段（导出扫描、组件识别、路径过滤）。
3. `ELIB-30xx`：`register` 阶段（组件注册、分组注册、重复覆盖）。
4. `ELIB-40xx`：`render` 阶段（画布渲染、上下文兜底、portal 安全）。
5. `ELIB-50xx`：`codegen` 阶段（策略匹配、import 解析、代码发射）。

## 4. 命名与分配规则

1. 同一错误码只能表达一个稳定语义，禁止复用。
2. 同一场景跨端共享同一码值，避免前后端定义冲突。
3. 新增错误码必须更新本文件并附最小复现。
4. 被废弃码位必须保留注释，不可直接复用。

## 5. 已占用码位（当前实现）

1. `ELIB-1001`：加载失败（模块导入失败）。
2. `ELIB-1004`：未注册的外部库 ID。
3. `ELIB-1099`：加载阶段未知异常。
4. `ELIB-2001`：扫描阶段未发现可渲染导出。
5. `ELIB-3001`：注册阶段没有可渲染组件。

## 6. 分阶段新增建议

1. `ELIB-1010`：Import Map 注入冲突。
2. `ELIB-2010`：导出路径存在但组件不可渲染。
3. `ELIB-3010`：重复注册冲突（被策略拒绝覆盖）。
4. `ELIB-4010`：Portal 安全模式降级渲染。
5. `ELIB-5010`：Codegen Policy 缺失映射。

## 7. 可观测性要求

1. UI 面板与日志必须展示同一诊断对象。
2. `error` 级别默认可见，`warning` 在详情可见，`info` 可折叠。
3. 诊断对象应附带触发阶段与可选重试建议。
