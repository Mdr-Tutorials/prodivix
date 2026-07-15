# PIR Wire Contract v1.5（Frozen Snapshot）

PIR wire v1.5 是不可变持久化 snapshot，增加 PIR/Collection 对 Data operation 的类型化绑定与 lifecycle 映射。生产代码继续只消费无版本号的 `PIR-current` 领域模型；`1.5` 仅存在于 schema、codec、migration 与 persistence boundary。

## Data operation binding

`logic.dataById` 保存文档级、durable 的数据操作引用。绑定只拥有引用，不拥有 Data Source 文档、运行结果或 secret：

```ts
type PIRDataOperationBinding = {
  operation: {
    documentId: string;
    operationId: string;
  };
};

type PIRLogicDefinition = {
  dataById?: Record<string, PIRDataOperationBinding>;
};
```

`dataId` 是 PIR 文档内局部数据身份。Workspace Semantic Index 将它发布为可引用的 durable `data` symbol，并将 `operation` 发布为指向 Data operation symbol 的类型化 reference；PIR 不复制 Data operation 内容。

## Collection lifecycle mapping

Collection 可声明：

```ts
type PIRCollectionDataLifecycleMapping = {
  kind: 'data-operation';
  dataId: string;
  idle: 'loading' | 'empty';
};
```

一旦声明 `lifecycle`，Collection `source` 必须是 `{ kind: 'binding', value: { kind: 'data', dataId } }`，且两个 `dataId` 必须相同并存在于 `logic.dataById`。codec 与 validator 对不一致输入 fail closed。

运行时通过同一个 `DataOperationReference` 的 `DataLifecycleSnapshot` 解析视图状态：`idle` 使用显式 `idle` 映射，`loading → loading`、`success → item`、`empty → empty`、`error → error`。`success` 不根据返回值推断 empty，因此成功返回 `[]` 仍是 `item`。operation identity 不匹配时解析被阻断。

Lifecycle snapshot、value 与 error 是可丢弃运行态，不写入 PIR wire；PIR 只保存 binding 与 mapping。

## Migration

v1.5 新字段均为可选，v1.4 → v1.5 migration 只不可变地提升 wire envelope 的 `version`，不改写既有作者态内容。未来 wire 版本继续通过集中 migration 进入同一套 PIR-current model。
