# PIR Wire Contract v1.6（Frozen Snapshot）

PIR wire v1.6 是不可变持久化 snapshot，在 v1.5 Data operation identity/lifecycle 基础上增加 query activation、typed input mapping 与 Blueprint mutation event。生产代码仍只消费无版本号的 `PIR-current`；`1.6` 只存在于 schema、codec、migration 与 persistence boundary。

## Query durable authoring

`logic.dataById` 继续拥有文档局部 `dataId`，并可保存：

```ts
type PIRDataOperationBinding = {
  operation: DataOperationReference;
  input?: DataOperationInputBinding;
  activations?: Array<
    | { kind: 'document' }
    | { kind: 'route'; routeId: string }
    | { kind: 'input-change'; dependencyId: string }
  >;
};
```

`input-change` 必须引用同一 input tree 中的 `runtime-value.valueId`。query 不允许读取 `trigger-payload`；document、route 与 dependency change 只描述显式 activation，refresh/pagination 仍由运行控件触发。

## Mutation event

Element event 可以保存：

```ts
type PIRDataOperationTriggerBinding = {
  kind: 'dispatch-data-operation';
  operation: DataOperationReference;
  input: DataOperationInputBinding;
};
```

dispatch identity、sequence、attempt、environment 与 lifecycle 是 session-local 运行态，不进入 PIR。Workspace authoring transaction 在写入前解析 exact DataSourceDocument，并要求 query binding 指向 query、event trigger 指向 mutation。

## Typed input 与 CodeSlot

`DataOperationInputBinding` 支持 `literal`、`trigger-payload`、`runtime-value`、`object`、`array` 与 `code`。`code` 只保存 `slotId + CodeReference + nested input`；对应 transform 必须由 Code Authoring Environment 的 `data-input-transform` CodeSlot 发布，PIR 不保存裸函数。

## Migration

v1.6 字段均为 additive optional contract。v1.5 → v1.6 migration 只不可变地提升 wire envelope 的 `version`，不改写既有作者态内容。

仓库 current contract 已激活到 v1.6，但这不等同于 Canonical Backend 中的历史文档已经迁移。production rollout 仍必须通过 `39.pir-current-evolution.md` 的 persistence gate：在允许 current 路径 patch 前完成 backend coordinated migration，或以 content revision/CAS 保护的 Atomic first-write replacement 同事务升级整份文档。当前后端对旧 wire 的路径 patch 保持 fail-closed。
