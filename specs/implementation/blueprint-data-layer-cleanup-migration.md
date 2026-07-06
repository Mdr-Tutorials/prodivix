# Blueprint 数据层清理执行计划

## Context

本文件是 ADR `specs/decisions/33.blueprint-data-layer-cleanup.md` 的执行配套。

性质：**纯结构清理，不改运行时逻辑、常量值或组件 props。** 两件事——删除腐烂的 `editor/model/data.ts` barrel（5/8 死转发），拆分 `data/viewport.ts`（删死代码 `DEFAULT_ROUTES`、preview-scale 迁 sidebar）。

规模：涉及约 10 个文件的 import 与常量搬家，远小于 ADR 32 的目录迁移。

---

## 执行约束

1. **所有目录/文件移动用 `git mv`**，删除用 `git rm`，保留历史。
2. **不改运行时逻辑**。本计划里的代码改动仅限：import 路径、常量/函数的文件归属、barrel 删除、死代码删除。
3. **每道关卡**：
   - `pnpm --filter @prodivix/web exec tsc -b --pretty false`
   - workspace vitest（于 `apps/web` 下：`pnpm exec vitest --config vitest.config.ts --run --maxWorkers=1`）
   - `pnpm lint`
4. 本清理无目录改名，**不涉及 Windows 大小写折叠风险**（ADR 32 的主要坑在此不适用）。

---

## 迁移前基线（已核实）

### barrel `editor/model/data.ts` 的 8 个转发源

| 源 | 经 barrel 消费？ | barrel 消费者取用的 symbol |
| --- | --- | --- |
| `data/viewport` | ✅ | `VIEWPORT_ZOOM_RANGE`（canvas / controller）、`VIEWPORT_DEVICE_PRESETS` / `VIEWPORT_QUICK_PRESETS` / `VIEWPORT_ZOOM_RANGE`（viewportBar）、`DEFAULT_PREVIEW_SCALE`（SidebarPreviewFrame）、`COMPACT_PREVIEW_SCALE`（SidebarComponentList） |
| `data/sampleData` | ✅ | 18 个 `*_ITEMS` / `*_DATA` symbol（palette） |
| `data/helpers` | ✅ | `getDefaultSizeId` / `getDefaultStatusIndex` / `getPreviewScale` / `isWideComponent`（SidebarComponentList） |
| `data/options` | ❌ 死 | — |
| `data/placeholders` | ❌ 死 | — |
| `data/ComponentGroups` | ❌ 死 | — |
| `blueprint/registry` | ❌ 死 | — |
| `blueprint/layoutPatterns` | ❌ 死 | — |

### `data/viewport.ts` 现有导出

| 导出 | 关注点 | 消费方 |
| --- | --- | --- |
| `DEFAULT_ROUTES` | 路由 | **0（死代码）** |
| `VIEWPORT_QUICK_PRESETS` / `VIEWPORT_DEVICE_PRESETS` / `VIEWPORT_ZOOM_RANGE` | 视口 UI 配置 | canvas / controller / viewportBar |
| `DEFAULT_PREVIEW_SCALE` / `COMPACT_PREVIEW_SCALE` | sidebar 预览比例 | SidebarComponentList / SidebarPreviewFrame / `helpers.getPreviewScale` |

### `data/helpers.ts` 中与 preview-scale 相关的项

- `import { DEFAULT_PREVIEW_SCALE } from './viewport';`（第 9 行，反向依赖）
- `const WIDE_PREVIEW_SCALE_BOOST = 1.18;`（第 11 行，仅 `getPreviewScale` 使用）
- `export const getPreviewScale = (baseScale, isWide) => { ... }`（第 71–78 行）

> 注意：`WIDE_GROUP_IDS` / `WIDE_COMPONENT_IDS`（第 12–31 行）由 `isWideComponent` 使用，**留在 helpers.ts**，与 `WIDE_PREVIEW_SCALE_BOOST` 是不同常量。

---

## 目标状态

```text
blueprint/
├── data/
│   ├── helpers.ts        # 移除 getPreviewScale / WIDE_PREVIEW_SCALE_BOOST / 对 viewport 的 import
│   ├── viewport.ts       # 只剩 VIEWPORT_*；DEFAULT_ROUTES 删除；RouteItem 类型 import 移除
│   └── (其余不变)
├── editor/
│   ├── model/
│   │   ├── data.ts       # ❌ 删除
│   │   └── index.ts      # 移除 export * from './data'
│   └── sidebar/
│       └── previewScale.ts   # 新增：DEFAULT_PREVIEW_SCALE / COMPACT_PREVIEW_SCALE / WIDE_PREVIEW_SCALE_BOOST / getPreviewScale
└── ...
```

---

## 新建文件内容

`editor/sidebar/previewScale.ts`（自包含，无外部 import）：

```ts
export const DEFAULT_PREVIEW_SCALE = 0.72;
export const COMPACT_PREVIEW_SCALE = 0.6;
const WIDE_PREVIEW_SCALE_BOOST = 1.18;

export const getPreviewScale = (
  baseScale: number | undefined,
  isWide: boolean
) => {
  const resolved = baseScale ?? DEFAULT_PREVIEW_SCALE;
  if (!isWide) return resolved;
  return Math.min(resolved * WIDE_PREVIEW_SCALE_BOOST, 0.95);
};
```

---

## 实施计划

### Phase 0: 基线确认

- 确认 ADR 33 已 review
- 复核 `DEFAULT_ROUTES` 仍为 0 消费者：
  ```bash
  git grep -n "DEFAULT_ROUTES" -- '*.ts' '*.tsx' | grep -v 'data/viewport.ts'
  ```
  （应为空）
- 复核无文件通过裸路径 `@/.../editor/model'` import（确认 `model/index.ts` 的 `./data` 转发确实可删）

### Phase 1: 迁移 preview-scale 关注点到 sidebar

目标：把 preview-scale 常量与 `getPreviewScale` 合并到 `editor/sidebar/previewScale.ts`，清理 `helpers.ts` 与 `viewport.ts` 中的对应内容，并让两个 sidebar 消费者直连新位置（同时脱离 barrel）。

主要任务：

1. 新建 `editor/sidebar/previewScale.ts`，内容如上节。
2. 从 `data/viewport.ts` 移除：
   - `DEFAULT_ROUTES`（含其数据）
   - `DEFAULT_PREVIEW_SCALE` / `COMPACT_PREVIEW_SCALE`
   - 类型 import 中的 `RouteItem`（删 `DEFAULT_ROUTES` 后不再使用；执行时由 tsc 复核）
3. 从 `data/helpers.ts` 移除：
   - `import { DEFAULT_PREVIEW_SCALE } from './viewport';`
   - `const WIDE_PREVIEW_SCALE_BOOST = 1.18;`
   - `getPreviewScale` 函数
   - （保留 `WIDE_GROUP_IDS` / `WIDE_COMPONENT_IDS` / `buildVariants` / `getDefaultSizeId` / `getDefaultStatusIndex` / `isWideComponent`）
4. 更新 sidebar 消费者（同时脱离 barrel）：
   - `sidebar/SidebarPreviewFrame.tsx`：
     ```diff
     - import { DEFAULT_PREVIEW_SCALE } from '@/editor/features/blueprint/editor/model/data';
     + import { DEFAULT_PREVIEW_SCALE } from './previewScale';
     ```
   - `sidebar/SidebarComponentList.tsx`：把原 barrel 的单一 import 块拆为两条直连：
     ```ts
     import { COMPACT_PREVIEW_SCALE, getPreviewScale } from './previewScale';
     import {
       getDefaultSizeId,
       getDefaultStatusIndex,
       isWideComponent,
     } from '@/editor/features/blueprint/data/helpers';
     ```

完成标准：

- `getPreviewScale` 与两个 preview-scale 常量只在 `previewScale.ts` 定义
- `data/helpers.ts` 不再 import `data/viewport`
- 两个 sidebar 文件不再引用 barrel
- tsc / vitest / lint 通过

### Phase 2: 杀 barrel

目标：删除 `editor/model/data.ts`，剩余 4 个 barrel 消费者直连源，清理 `model/index.ts`。

主要任务：

1. 更新剩余 4 个 barrel 消费者：
   - `canvas/BlueprintEditorCanvas.tsx`：
     ```diff
     - import { VIEWPORT_ZOOM_RANGE } from '@/editor/features/blueprint/editor/model/data';
     + import { VIEWPORT_ZOOM_RANGE } from '@/editor/features/blueprint/data/viewport';
     ```
   - `controller/useBlueprintEditorController.ts`：同上
   - `viewportBar/BlueprintEditorViewportBar.tsx`：
     ```diff
     - import { VIEWPORT_DEVICE_PRESETS, VIEWPORT_QUICK_PRESETS, VIEWPORT_ZOOM_RANGE } from '@/editor/features/blueprint/editor/model/data';
     + import { VIEWPORT_DEVICE_PRESETS, VIEWPORT_QUICK_PRESETS, VIEWPORT_ZOOM_RANGE } from '@/editor/features/blueprint/data/viewport';
     ```
   - `model/palette.ts`：18 个 sampleData symbol 的 import 改指直连：
     ```diff
     - } from '@/editor/features/blueprint/editor/model/data';
     + } from '@/editor/features/blueprint/data/sampleData';
     ```
2. 删除 `editor/model/data.ts`：
   ```bash
   git rm apps/web/src/editor/features/blueprint/editor/model/data.ts
   ```
3. 从 `editor/model/index.ts` 移除 `export * from './data';` 一行。

完成标准：

- `editor/model/data.ts` 不存在
- 仓库内 `@/editor/features/blueprint/editor/model/data` 引用归零
- tsc / vitest / lint 通过

### Phase 3: 文档与验收

- ADR 33 验收项勾选
- `specs/decisions/README.md` 状态表：`33.blueprint-data-layer-cleanup.md` 由 `Not Started` 改为 `Implemented`
- 全量验证：tsc / vitest / lint + `git grep "editor/model/data"` 归零

---

## 建议提交切分

本清理规模小，可单提交。若需细分：

1. `refactor(blueprint): relocate preview-scale to sidebar`（Phase 1）
2. `refactor(blueprint): remove dead editor/model/data barrel`（Phase 2）

> 提交信息可在执行时由用户决定单提交或拆分（ADR 32 即采用单提交）。

---

## 验收标准（对齐 ADR 33）

- [x] `apps/web/src/editor/features/blueprint/editor/model/data.ts` 不再存在
- [x] `editor/model/index.ts` 不再 `export * from './data'`
- [x] 仓库内不再出现 `@/editor/features/blueprint/editor/model/data` import 前缀
- [x] `DEFAULT_ROUTES` 已从仓库删除（`git grep DEFAULT_ROUTES` 为空）
- [x] `data/viewport.ts` 只含 `VIEWPORT_*` 三个视口配置导出
- [x] `editor/sidebar/previewScale.ts` 存在，承载 preview-scale 常量与 `getPreviewScale`
- [x] `data/helpers.ts` 不再含 `getPreviewScale` / `WIDE_PREVIEW_SCALE_BOOST`，不再 import `data/viewport`
- [x] 6 个原 barrel 消费者全部直连源文件
- [x] `pnpm --filter @prodivix/web exec tsc -b --pretty false` 通过
- [x] workspace vitest 通过
- [x] `pnpm lint` 通过
- [x] ADR 33 验收项勾选、索引表实现状态更新

---

## 暂不处理（对齐 ADR 33 非目标）

1. 不拆分 `data/options.ts` 与 `data/sampleData.tsx`（flat grab-bag，路径诚实后危害降低）。
2. 不重命名 `data/` 目录。
3. 不调整 `data/groups/*` 内部结构。
4. 不改任何运行时逻辑、常量值或组件 props。

---

## 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| `RouteItem` 删除后仍被 `viewport.ts` 内部引用 | tsc 复核；若仍被引用则保留该类型 import |
| `getPreviewScale` 签名复制有偏差 | 直接从 `helpers.ts` 原样搬迁（见"新建文件内容"），不改逻辑 |
| barrel 消费者遗漏导致 tsc 失败 | Phase 2 后 `git grep "editor/model/data"` 归零校验 + tsc 关卡 |
| 某消费者除 barrel 外还隐式依赖 barrel 的传递导出 | 6 个消费者的取用已逐一核实（见基线表），无传递依赖 |

> 回滚：全部改动未提交前可 `git restore`；提交后因每阶段独立可编译，可 revert 最近一两个 commit。
