# Route System Unification Implementation Plan

## 状态

- Draft
- 日期：2026-06-29
- 关联：
  - `specs/router/route-manifest.md`
  - `specs/decisions/08.route-manifest-outlet.md`
  - `specs/decisions/09.component-route-composition.md`
  - `specs/decisions/13.route-runtime-contract.md`
  - `specs/diagnostics/route-diagnostic-codes.md`

## 1. 问题判断

当前路由系统已经跨过“纯预览 path state”的阶段，但距离真正可用还有明显差距。核心问题不是字段不够，而是 **workspace route 与组件 route 的语义没有统一**。

当前实现事实：

1. `apps/web/src/editor/store/editorStore.types.ts` 定义了 `WorkspaceRouteManifest` 和 `WorkspaceRouteNode`。
2. `apps/web/src/editor/store/editorStore.routeIntent.ts` 能创建 page、child route、layout，并维护 workspace documents。
3. `apps/web/src/editor/features/design/blueprint/editor/controller/useBlueprintEditorController.ts` 将 route manifest 同步到后端。
4. `apps/web/src/editor/features/design/blueprint/editor/components/Canvas/useActiveRoutePreview.ts` 根据 active route materialize page doc。
5. `apps/web/src/pir/renderer/PIRNode.tsx` 在 `PdxOutlet` 处注入 active route page。
6. `packages/ui/src/nav/PdxRoute.tsx` 仍然拥有自己的 children path matcher。

这说明项目级 route graph 已经存在，但 `PdxRoute`、导航 action、Outlet 注入、诊断和导出还没有共享同一个 route core。

## 2. 目标架构

目标是形成一条统一链路：

```txt
RouteManifest
  -> Route Resolver
  -> ResolvedRouteGraph / matchChain
  -> RouteRuntimeContext
  -> PdxOutlet / PdxRoute / navigate action / export planner
```

设计约束：

1. `RouteManifest` 是项目级路由唯一保存态。
2. `PdxRoute` 只能消费 route context 或 route module projection。
3. `PdxOutlet` 内容由 `matchChain` 决定，而不是临时 active route 拼接。
4. Route runtime refs 使用 Code Authoring Environment。
5. 后端、前端 store、renderer、export planner 共享同一套校验语义。

## 3. Phase 0：文档与契约收敛

目标：先固定方向，避免继续扩张第二套路由语义。

任务：

1. 更新 ADR 08 / 09 / 13，明确 RouteGraph 权威性。
2. 更新 `specs/router/route-manifest.md`，记录当前实现缺口。
3. 新增本实施计划。
4. 将后续路由相关需求统一挂到本计划，而不是散落到 Inspector、renderer、export 文档中。

验收：

- [ ] 文档明确 `PdxRoute` 不是项目级路由源。
- [ ] 文档明确 `PdxOutlet` 绑定归 RouteGraph 管。

## 4. Phase 1：提取共享 Route Core

目标：把路径规则从 UI 组件和控制器里抽出来。

任务：

1. 新建 route core 模块，提供：
   - `normalizeRoutePath`
   - `parseRouteSegment`
   - `rankRouteCandidate`
   - `matchRouteManifest`
   - `buildMatchChain`
   - `resolveNavigateTarget`
   - `validateRouteManifest`
2. 将 `apps/web/src/editor/store/routeManifest.ts` 中的 path flatten 逻辑迁到 route core。
3. 将 `packages/ui/src/nav/PdxRoute.tsx` 的 matcher 替换为 route core 消费层。
4. 产出稳定 `RTE-xxxx` diagnostics。

验收：

- [ ] 地址栏、`PdxRoute`、navigate action 使用同一个 path normalization。
- [ ] 动态段和 wildcard 的 ranking 只有一份实现。
- [ ] 重复 path、非法 segment、broken doc ref 可被统一诊断。

## 5. Phase 2：RouteGraph 编辑能力补齐

目标：让用户能真正编辑路由树，而不是只新增根路径。

任务：

1. 扩展 route intent：
   - `rename-route-segment`
   - `move-route`
   - `create-index-route`
   - `bind-route-outlet`
   - `unbind-route-outlet`
   - `attach-route-layout`
   - `detach-route-layout`
2. route tree UI 支持多级 route 创建、移动、删除和重命名。
3. route inspector 展示 path、segment、index、page、layout、outlet 和 diagnostics。
4. 删除 page/layout 文档前检查 RouteGraph 引用。

验收：

- [ ] 用户可以建立 `/settings/profile` 这类多级路由。
- [ ] 用户可以为任一路由拆分 layout 并绑定 Outlet。
- [ ] 路由编辑不要求用户理解 VFS 文件树。

## 6. Phase 3：PdxRoute 与组件 Route Module 收敛

目标：消除组件路由和 workspace 路由之间的割裂。

任务：

1. 定义 `RouteModule` 和 `RouteModuleMount` 数据结构。
2. `component` 项目支持相对 route module 预览。
3. `project` 项目支持把 route module 挂到宿主 RouteGraph。
4. `PdxRoute` Inspector 从编辑任意 local path 改为选择 route scope / module scope / debug path。
5. 移除项目级语义中对 `data-route-path` 的依赖。

验收：

- [ ] `PdxRoute` 不再形成项目级第二路由源。
- [ ] 组件 route module 可被挂载到不同宿主路径。
- [ ] 合成 route 可追踪 source module 和 host route node。

## 7. Phase 4：RouteRuntimeContext 与导航统一

目标：让预览、交互和运行时配置使用同一个上下文。

任务：

1. renderer context 增加 `RouteRuntimeContext`。
2. `PdxOutlet` 从 `matchChain` 注入下一层内容。
3. 内置 `navigate` action 通过 `resolveNavigateTarget` 解析 route id、relative path、absolute path 和 external URL。
4. route runtime refs 接入 Code Authoring Environment：
   - `loaderRef`
   - `actionRef`
   - `guardRef`
5. Issues 面板展示 route runtime diagnostics。

验收：

- [ ] 内部导航、地址栏切换和画布预览结果一致。
- [ ] route params 能进入 renderer context。
- [ ] loader / guard / action 诊断能定位到 code artifact 和 route node。

## 8. Phase 5：后端校验与导出

目标：让保存和生产输出都相信同一个 RouteGraph。

任务：

1. 后端 `SaveRouteManifest` 前执行 manifest schema 和语义校验。
2. `workspace_routes` 保存 normalized manifest。
3. Export Program Builder 读取 `ResolvedRouteGraph`。
4. Production Export Planner 为不同 target 输出对应 route topology。
5. 导出 source trace 保留 route node、doc id、module id 和 generated file 映射。

验收：

- [ ] 后端拒绝非法 route manifest。
- [ ] 导出不从画布组件树反推项目路由。
- [ ] route runtime refs 能输出到目标框架 adapter。

## 9. 不做兼容层

项目仍处于 alpha 阶段。路由系统应做长期正确的 hard cut，而不是保留旧的局部 path matcher 作为兼容行为。

允许保留短期开发桥接，但必须满足：

1. 有明确删除点。
2. 不进入导出路径。
3. 不作为 AI patch 和诊断的权威来源。
4. 不新增用户可见的第二套概念。

## 10. 最小可用定义

路由系统达到“真正可用”的最低标准：

1. 用户能在 Route Tree 中创建、移动、重命名、删除多级路由。
2. 每个 route 能清晰绑定 page、layout 和 default outlet。
3. 地址栏、画布、导航 action、Inspector 和导出结果一致。
4. `PdxRoute` 与组件 route module 使用 workspace route core。
5. 保存、预览、导出都能给出同一套 `RTE-xxxx` 诊断。
