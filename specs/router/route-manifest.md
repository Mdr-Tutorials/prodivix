# Route Manifest 规范

## 文档状态

- In Progress
- 创建日期：2026-02-08
- 更新日期：2026-06-29
- 关联 ADR：
  - `specs/decisions/08.route-manifest-outlet.md`
  - `specs/decisions/09.component-route-composition.md`
  - `specs/decisions/13.route-runtime-contract.md`

## 1. 目标

定义 Prodivix workspace 中项目级路由结构、布局链、Outlet 规则、组件 route module 挂载方式和 route runtime contract。

用户在 Blueprint 中操作“路由、页面、布局、Outlet 和模块挂载”。VFS 文件树是系统维护的内部组织方式，不是路由语义来源。

## 2. 当前实现边界

当前代码已经具备：

1. `WorkspaceRouteManifest` 保存 `root -> children` 路由树。
2. route node 可引用 `pageDocId`、`layoutDocId`、`outletNodeId`。
3. Blueprint 地址栏基于 `activeRouteNodeId` 切换当前 route。
4. 预览时 active route 的 page doc 会注入到 `PdxOutlet`。
5. 后端通过 `core.route / manifest.update` 保存 route manifest，并维护 `routeRev`。

当前缺口：

1. `PdxRoute` 仍有独立 children 匹配逻辑，和 workspace route graph 连接不够紧。
2. 预览注入主要依赖 active route，不是真正基于 URL 解析出的 `matchChain`。
3. 路由诊断、导航 action、导出和组件 route module 尚未共享同一个 resolver。
4. route runtime refs 尚未接入 Code Authoring Environment。

## 3. 数据结构

```ts
type DocId = string;
type CodeReference = {
  artifactId: string;
  exportName?: string;
  symbolId?: string;
};

type RouteManifest = {
  version: '1';
  root: RouteNode;
};

type RouteNode = {
  id: string;
  segment?: string;
  index?: boolean;
  layoutDocId?: DocId;
  pageDocId?: DocId;
  outletNodeId?: string;
  runtime?: RouteRuntime;
  children?: RouteNode[];
};

type RouteRuntime = {
  loaderRef?: CodeReference;
  actionRef?: CodeReference;
  guardRef?: CodeReference;
  errorBoundaryDocId?: DocId;
  suspenseDocId?: DocId;
  seo?: {
    title?: string;
    description?: string;
    canonical?: string;
    noIndex?: boolean;
    openGraph?: Record<string, string>;
  };
  experiment?: {
    key: string;
    variantMap?: Record<string, DocId>;
  };
};
```

## 4. 路径语义

1. `root` 不声明 `segment`。
2. `index=true` 节点不声明 `segment`。
3. 普通 `segment` 不以 `/` 开头，只表示当前层级片段。
4. 支持静态片段、动态片段 `:id` 和通配片段 `*`。
5. 同一 parent 下的 route 不能产生重复 path。
6. path normalization、ranking 和 matching 必须由共享 Route Resolver 实现。

## 5. 匹配结果

```ts
type ResolvedRouteMatch = {
  routeNodeId: string;
  path: string;
  params: Record<string, string>;
  layoutDocId?: DocId;
  pageDocId?: DocId;
  outletNodeId?: string;
  source?: {
    kind: 'workspace' | 'route-module';
    moduleId?: string;
  };
};

type RouteRuntimeContext = {
  currentPath: string;
  matchedPath: string;
  params: Record<string, string>;
  searchParams: Record<string, string | string[]>;
  hash?: string;
  matchChain: ResolvedRouteMatch[];
  activeRouteNodeId?: string;
  routeModuleScope?: string;
};
```

编辑器预览、`PdxRoute`、`PdxOutlet`、navigate action、诊断和导出都消费 `RouteRuntimeContext`。

## 6. Outlet 渲染链

对目标 URL 匹配后得到 `matchChain`：

1. 按 `matchChain` 从根到叶装配 layout 文档。
2. 每层 layout 的下一层内容注入到该层的 default outlet。
3. 叶子 `pageDocId` 作为内容终点。
4. 若 `outletNodeId` 存在，必须命中对应 layout 文档内的 `PdxOutlet`。
5. 若 layout 有多个 Outlet 且没有显式绑定，产生诊断。
6. 若缺失 Outlet，编辑器可继续编辑，但发布和导出应按阻断级别处理。

示意：

```txt
RootLayout(Outlet)
  -> ProductLayout(Outlet)
      -> ProductDetailPage
```

## 7. PdxRoute / PdxOutlet 组件契约

`PdxOutlet`：

1. 表示 layout 文档中的 route content insertion point。
2. 绑定信息保存在 RouteGraph，而不是只保存在组件 props。
3. 渲染内容来自 `RouteRuntimeContext.matchChain`。

`PdxRoute`：

1. 可作为当前 route scope 的局部显示组件。
2. 可作为 component route module 的预览投影。
3. 不产生项目级绝对路由。
4. 不作为导出器发现项目路由的来源。

## 8. 组件 Route Module

```ts
type RouteModule = {
  moduleId: string;
  version: '1';
  root: RouteNode;
};

type RouteModuleMount = {
  mountId: string;
  moduleRef: string;
  mountPath?: string;
  parentRouteNodeId?: string;
};
```

合成规则：

1. 将宿主 path 与模块相对 segment 拼接。
2. 检测 path 冲突并在编辑期报错。
3. 生成 source trace：`moduleId / routeNodeId -> resolved path`。
4. 参数冲突默认报错，除非宿主提供显式别名策略。

## 9. 与 VFS 的关系

1. `RouteManifest` 不强制等于目录结构。
2. `pageDocId` / `layoutDocId` 引用 `docsById` 中的文档。
3. 文件树调整后仅需修复 doc 引用，不改 route path 语义。
4. 删除文档前必须检查 route references。

## 10. 诊断规则

1. `RTE-1001`：重复路径。
2. `RTE-1002`：路径片段非法。
3. `RTE-2001`：路由目标文档不存在。
4. `RTE-3001`：布局 route 缺少 Outlet。
5. `RTE-3002`：Outlet 无法匹配子路由内容。
6. `RTE-4001`：导航目标无法解析。
7. `RTE-9001`：未知 route runtime 异常。

## 11. 实现原则

1. Store、renderer、Inspector、backend validator、export planner 使用同一套 route core。
2. RouteGraph 修改必须走 route intent / workspace command。
3. AI patch 只能生成受 validator 约束的 route patch。
4. Code-owned runtime 能力必须引用 Code Authoring Environment 中的 artifact，不保存裸代码字符串。
