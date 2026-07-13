# PIR 语法规范

本文档描述 `pir-page`、`pir-layout` 与 `pir-component` Workspace documents 当前使用的 PIR 语法。在**单个 PIR 文档内部**，UI 不再使用树形保存格式，`ui.graph` 是规范写态；这不表示 PIR 或 `ui.graph` 是整个项目的唯一真相源。

项目级唯一作者态真相是 **Canonical Workspace VFS**。它在同一个 `WorkspaceSnapshot` 中持有 Route Manifest、PIR、独立 NodeGraph / Animation documents、Code Documents、Assets 与 Project Config。

## Workspace 文档边界

| Workspace document type                     | 内容与 owner                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `pir-page` / `pir-layout` / `pir-component` | 内容遵循本文 PIR schema；graph、normalization、materialization 与 validator 由 `@prodivix/pir` 持有 |
| `pir-graph`                                 | 独立 NodeGraph document，由 `@prodivix/nodegraph` 持有领域 contract；不是页面 PIR `ui.graph` 的别名 |
| `pir-animation`                             | 独立 Animation document，由 `@prodivix/animation` 持有领域 contract；不是页面 PIR UI 树的一部分     |
| `code` / `asset` / `project-config`         | 与 PIR 并列存在于 Workspace VFS，不嵌入 `ui.graph`                                                  |

PIR 顶层仍可以包含该文档自己的 `logic` 与 `animation` 字段，但不能据此把 Workspace 中的独立 `pir-graph` 或 `pir-animation` document 合并成页面 PIR 镜像。当前导出器遇到尚未支持组合的独立领域文档时会产生 blocking diagnostic，而不是静默丢弃。

## 版本

- 规范版本：以 `specs/pir/PIR-current.version.json` 为准
- 权威 schema：`specs/pir/PIR-current.json`
- 历史契约说明：`specs/pir/PIR-contract-v*.md`

## 顶层结构

```json
{
  "version": "1.3",
  "metadata": {
    "name": "HomePage",
    "description": "应用首页"
  },
  "ui": {
    "graph": {
      "version": 1,
      "rootId": "root",
      "nodesById": {},
      "childIdsById": {},
      "regionsById": {}
    }
  },
  "logic": {
    "props": {},
    "state": {},
    "graphs": []
  },
  "animation": {
    "version": 1,
    "timelines": [],
    "svgFilters": []
  }
}
```

## 必需字段

| 字段                    | 类型   | 说明                   |
| ----------------------- | ------ | ---------------------- |
| `version`               | string | 固定为当前 schema 版本 |
| `ui`                    | object | UI 容器                |
| `ui.graph`              | object | 规范化 UI 图           |
| `ui.graph.version`      | number | 固定为 `1`             |
| `ui.graph.rootId`       | string | 根节点 ID              |
| `ui.graph.nodesById`    | object | 节点字典               |
| `ui.graph.childIdsById` | object | 默认 children 顺序     |

## 可选字段

| 字段                   | 类型   | 说明       |
| ---------------------- | ------ | ---------- |
| `metadata`             | object | 元信息     |
| `logic`                | object | 逻辑层定义 |
| `animation`            | object | 动画层定义 |
| `ui.graph.regionsById` | object | 具名区域   |

## 节点结构

`nodesById` 中的每个节点至少包含：

```json
{
  "id": "root",
  "type": "div"
}
```

支持的常见字段：

- `text`
- `style`
- `props`
- `data`
- `list`
- `events`

### 数据引用

PIR 使用显式引用对象，不再把引用值混写成旧式树结构。

```json
{ "$param": "title" }
{ "$state": "user.name" }
{ "$data": "items.0.label" }
{ "$item": "item.name" }
{ "$index": true }
```

## 结构语义

- `nodesById` 只表示节点身份和节点字段，不表示顺序。
- `childIdsById` 表示默认 children 区域的顺序。
- `regionsById` 表示 slot、layout region、fallback 等具名区域。
- 任何需要树的读取场景，都应通过 `@prodivix/pir` 的 materialization 生成临时视图，而不是把树重新保存回文档。
- PIR document 必须作为 Canonical Workspace VFS 中的 document 参与 Command / Transaction、History、durable outbox 与 Atomic Commit；编辑器不能另存一份 PIR 真相。

## 验证规则

PIR validator 至少需要检查：

1. `rootId` 必须存在于 `nodesById`。
2. `nodesById` 的 key 必须与节点内部 `id` 一致。
3. `childIdsById` 和 `regionsById` 引用的节点都必须存在。
4. 结构中不能有环。
5. 同一节点不能出现多个结构父级。
6. `ui.root` 不允许出现在保存态。

## 兼容说明

当前 PIR 只定义当前保存格式，不再保留旧树形保存形态的兼容语义。项目仍处于 alpha，旧 Web resolver、validator 和 renderer 路径已经 Hard Cut；对应 owner 分别位于 `@prodivix/pir` 与 `@prodivix/pir-react-renderer`。

## 下一步

- [错误码与诊断](/reference/diagnostic-codes) - 查看 PIR 相关错误码
