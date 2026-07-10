# Plugin Diagnostics 编码规范（PLG）

## 状态

- Draft-Frozen
- 日期：2026-07-10
- 阶段：Plugin Host Phase 2-4
- 关联：
  - `specs/diagnostics/README.md`
  - `specs/decisions/29.plugin-extension-points.md`
  - `specs/implementation/plugin-host-foundation.md`
  - `specs/implementation/plugin-host-core-phase2.md`
  - `specs/plugins/plugin-manifest-v1.schema.json`

## 1. 目的

统一 Plugin Manifest、contribution descriptor、Capability policy、Host registry、runtime lifecycle 与 cleanup 的稳定错误码。`PLG-xxxx` 诊断由 `@prodivix/plugin-contracts` 定义，由 `@prodivix/plugin-contracts` 与 `@prodivix/plugin-host` 产生，可直接进入 Issues、安装审核、日志和文档排障链路。

## 2. 编码分段

1. `PLG-10xx`：输入 bytes、严格 JSON、JSON value guard、Schema 和资源上限。
2. `PLG-20xx`：SemVer、宿主兼容性、能力声明、激活引用和资源可移植性。
3. `PLG-30xx`：Capability policy、permission snapshot、contribution contract 与 registry transaction。
4. `PLG-40xx`：Host 状态、runtime artifact、lifecycle、cleanup、audit、subscriber isolation 与后续 Browser transport。

## 3. 码位

### `PLG-1001` Manifest 源不是严格 UTF-8 JSON

- Severity: `error`
- Stage: `parse`
- Retryable: false
- Trigger: Manifest 含无效 UTF-8、BOM、注释、尾逗号、语法错误或无法安全解析的 JSON 文本
- User action: 使用无 BOM 的 UTF-8 编码，并移除注释、尾逗号和非标准 JSON 语法
- Developer notes: 签名、hash、解析和校验必须消费解析器返回的同一份 `sourceBytes`

### `PLG-1002` Manifest 包含重复对象键

- Severity: `error`
- Stage: `parse`
- Retryable: false
- Trigger: 同一 JSON object 中出现两个或更多同名 property
- User action: 每个 object property 只保留一个明确值
- Developer notes: 不允许依赖 JSON parser 的 last-value-wins 行为；诊断必须包含重复字段的 JSON Pointer

### `PLG-1003` 程序化输入不是 JSON value

- Severity: `error`
- Stage: `schema`
- Retryable: false
- Trigger: 程序化 Manifest 含 `undefined`、函数、symbol、BigInt、非有限 number、cycle、非普通对象、getter 或稀疏数组
- User action: 仅传入 JSON primitive、普通 data object 和稠密 array
- Developer notes: 不要通过 `JSON.stringify` 静默删除非法值；先运行递归 JSON value guard

### `PLG-1004` Manifest 不符合 v1 Schema

- Severity: `error`
- Stage: `schema`
- Retryable: false
- Trigger: Manifest 字段、类型、枚举、格式、必填项或封闭对象规则不符合 Plugin Manifest v1 Schema
- User action: 按诊断中的 Manifest path 修正对应字段
- Developer notes: 断言稳定的 code、JSON Pointer 和 Schema keyword，不断言 Ajv 完整自然语言消息

### `PLG-1005` Manifest 超出资源上限

- Severity: `error`
- Stage: `parse`
- Retryable: false
- Trigger: Manifest byte size、JSON depth 或 JSON node count 超过宿主配置上限
- User action: 缩小 Manifest，并把大型 contribution descriptor 移到独立资源文件
- Developer notes: 必须在进入扩展点 resolver 和插件运行时前执行资源限制

### `PLG-1010` Contribution 资源读取失败

- Severity: `error`
- Stage: `parse`
- Retryable: true
- Trigger: package reader 无法在受限 package root 内读取 contribution resource
- User action: 检查资源路径、包内容和安装源可用性后重试
- Developer notes: reader 必须继续限制 path containment；诊断不得暴露绝对路径或底层存储 handle

### `PLG-1011` Contribution 资源不是严格 JSON

- Severity: `error`
- Stage: `parse`
- Retryable: false
- Trigger: contribution resource 含 BOM、无效 UTF-8、注释、尾逗号、重复键或其他非严格 JSON 内容
- User action: 将 descriptor 改为无 BOM 的严格 UTF-8 JSON，并移除重复对象键
- Developer notes: resource descriptor 与 Manifest 复用 `parseStrictJsonDocument`，但使用独立 contribution 诊断码和 document path

### `PLG-1012` Contribution 资源完整性不匹配

- Severity: `error`
- Stage: `schema`
- Retryable: false
- Trigger: resource bytes 的 SHA-256 digest 与 Manifest 声明的 integrity 不一致，或宿主无法完成完整性校验
- User action: 恢复可信资源内容，或使用重新签发且匹配实际 bytes 的完整性元数据
- Developer notes: integrity 在 JSON 解析和 resolver 之前校验，不允许对失败资源做降级加载

### `PLG-1013` Contribution contract 不受支持

- Severity: `error`
- Stage: `schema`
- Retryable: false
- Trigger: Host 未注册 Manifest 声明的 exact contribution point 与 contract version
- User action: 使用当前宿主支持的 point/version，或安装提供该 contract 的宿主版本
- Developer notes: lookup 必须 exact match，不做 latest、minor fallback 或隐式 converter

### `PLG-1014` Contribution descriptor 不符合 contract

- Severity: `error`
- Stage: `schema`
- Retryable: false
- Trigger: inline 或 resource descriptor 未通过 point-specific contract validator
- User action: 按 contribution contract 修正 descriptor 字段和值
- Developer notes: validator 只校验 descriptor shape；Host resolver 与业务 identity 冲突使用独立 registry 诊断

### `PLG-1015` Contribution 资源超出上限

- Severity: `error`
- Stage: `parse`
- Retryable: false
- Trigger: 单资源 bytes、单插件资源数、总 bytes、descriptor depth 或 node count 超过 Host 限制
- User action: 拆分或缩小 descriptor，并移除不必要的资源数据
- Developer notes: package reader 限额和 Host 收到 bytes 后的二次限额都必须保留

### `PLG-2001` 插件版本不是有效 SemVer

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: `version` 通过基础字符串格式后仍无法被严格 SemVer parser 接受
- User action: 使用完整且规范的 SemVer 版本，例如 `1.2.3`
- Developer notes: 不使用正则表达式替代 SemVer parser

### `PLG-2002` Prodivix engine range 无效

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: `engines.prodivix` 不是有效 SemVer range
- User action: 使用有效范围，例如 `>=0.1.0 <1.0.0`
- Developer notes: range 校验和宿主兼容判断必须使用同一 SemVer 实现

### `PLG-2003` 当前宿主版本不兼容

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: 当前 Prodivix host version 不满足 `engines.prodivix`
- User action: 安装兼容的插件版本，或升级 Prodivix
- Developer notes: 只有宿主传入 `hostVersion` 时执行兼容性判断

### `PLG-2004` Publisher 与插件 scope 不一致

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: scoped plugin id 的 npm scope 与 `publisher` 不相同
- User action: 让 `publisher` 与插件 id 中的 scope 保持一致
- Developer notes: 该校验只证明声明一致性，不替代包签名与市场发布者验证

### `PLG-2010` Capability 重复声明

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: `capabilities` 中重复出现相同的 `(id, scope)`
- User action: 合并重复请求，只保留一个 reason 和 optional 决策
- Developer notes: 无 scope capability 使用空 scope 参与唯一性判断

### `PLG-2011` Contribution id 重复

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: 插件内多个 contribution 使用同一个 local id
- User action: 为每个 contribution 分配唯一 local id
- Developer notes: 稳定 identity 是 `<pluginId>/<contributionId>`，禁止静默覆盖

### `PLG-2012` Contribution 缺少注册能力

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: contribution 没有对应的 `extension.register` capability，或 capability scope 与 contribution point 不一致
- User action: 为该 contribution point 请求对应注册能力并说明 reason
- Developer notes: Manifest 只声明请求；最终 grant 仍由宿主策略决定

### `PLG-2013` Activation 引用无效

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: `contribution.use` 未引用同 point 的已声明 contribution，或宿主提供的 command catalog 中不存在 command id
- User action: 修正 contribution point、contribution id 或 command id
- Developer notes: command id 只有在 validator 收到 `knownCommandIds` 时校验，禁止从 contribution local id 猜测全局 command identity

### `PLG-2014` Activation 缺少 runtime entrypoint

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: Manifest 声明一个或多个 activation event，但没有 `entrypoints.runtime`
- User action: 声明 runtime module，或删除不需要的 activation event
- Developer notes: 纯声明型插件可以没有 runtime，但不能声明运行时激活条件

### `PLG-2015` 资源路径不可移植或发生冲突

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: 路径包含 Windows 保留设备名、尾随点空格，或多个路径在大小写不敏感文件系统上冲突
- User action: 使用唯一、规范且以 `./` 开头的包内相对路径
- Developer notes: 校验 icon、runtime、UI entrypoint 和 resource contribution 的统一路径集合

### `PLG-2016` UI entrypoint id 重复

- Severity: `error`
- Stage: `semantic`
- Retryable: false
- Trigger: `entrypoints.ui` 中多个入口使用同一个 local id
- User action: 为每个隔离 UI surface 分配唯一 id
- Developer notes: UI entrypoint id 在单个插件内唯一，不依赖路径是否不同

### `PLG-3001` Required capability 被拒绝

- Severity: `error`
- Stage: `permission`
- Retryable: false
- Trigger: effective PermissionSnapshot 中至少一个 required capability 为 deny
- User action: 授予所需能力，或保持插件为 blocked/disabled
- Developer notes: 这是正常策略结果，availability 进入 `blocked`，不得误记为 Host `failed`

### `PLG-3002` Capability policy 解析失败

- Severity: `error`
- Stage: `permission`
- Retryable: true
- Trigger: policy adapter 抛错、返回错误 owner/revision、漏判请求、改变 optional 语义或尝试授权未请求 capability
- User action: 恢复权限策略来源并重新解析授权
- Developer notes: Host 必须验证完整 `(id, scope)`、owner 与单调 permission revision，禁止 overgrant

### `PLG-3010` Contribution identity 冲突

- Severity: `error`
- Stage: `registry`
- Retryable: false
- Trigger: 同一 stable `<pluginId>/<contributionId>` 被重复 stage 或与已提交 record 冲突
- User action: 为 contribution 使用唯一 local id，并重新执行完整注册事务
- Developer notes: point 不同也不能复用同一 stable identity；禁止 last-write-wins

### `PLG-3011` Registry transaction revision 冲突

- Severity: `error`
- Stage: `registry`
- Retryable: true
- Trigger: commit 时 registry revision 或 permission revision 已不同于 transaction 捕获值
- User action: 读取最新 Host snapshot，并重新 prepare 和提交完整 transaction
- Developer notes: 不做隐式 merge；失败 transaction 必须 rollback 所有 staged disposable

### `PLG-3012` Contribution resolver 失败

- Severity: `error`
- Stage: `registry`
- Retryable: false
- Trigger: Host-side resolver 抛错、产生非法 lifetime/order，或依赖未请求或未授权 capability
- User action: 修复 Host contribution adapter 或 descriptor 后重新验证插件
- Developer notes: resolver 是受信任 Host adapter，不允许插件绕过 contract validator 直接提交 resolved value

### `PLG-3013` Plugin owner generation 已过期

- Severity: `error`
- Stage: `registry`
- Retryable: true
- Trigger: transaction、registration 或 cleanup 使用的 installation/generation 已不是当前 owner
- User action: 丢弃旧异步结果，并基于当前 generation 重新开始操作
- Developer notes: 旧 generation 只能清理自己的 lease，不能按 plugin id 宽泛删除新资源

### `PLG-3014` Contribution contract 配置冲突

- Severity: `error`
- Stage: `registry`
- Retryable: false
- Trigger: composition root 重复注册相同 contribution point 与 contract version
- User action: 保留唯一 contract owner 后重新创建 Plugin Host
- Developer notes: contract registry 在 Host 创建阶段冻结，插件不能动态替换 validator 或 resolver

### `PLG-4001` Plugin Host 状态转换非法

- Severity: `error`
- Stage: `runtime`
- Retryable: false
- Trigger: 对未发现、非 ready、无 runtime、已 rollback 或其他不允许状态执行 lifecycle/transaction 操作
- User action: 读取当前 Host snapshot，并使用该状态允许的命令
- Developer notes: availability 与 runtime 是独立状态轴，校验不得重新合并成单轴 active 状态

### `PLG-4002` Runtime activation 失败

- Severity: `error`
- Stage: `runtime`
- Retryable: true
- Trigger: runtime adapter 返回失败、抛错，或 Host 无法建立 termination listener
- User action: 检查 runtime diagnostics，修复后使用显式 retry
- Developer notes: activation transaction 必须 rollback，partial session 与 activation lease 不得残留

### `PLG-4003` Runtime 操作超时

- Severity: `error`
- Stage: `runtime`
- Retryable: true
- Trigger: activation 或 deactivation 超过 Host 配置的时间上限
- User action: 重试操作，或禁用持续无响应的插件
- Developer notes: timeout 后 abort 当前 operation；迟到成功的 session 只能自行 deactivate，不能 commit

### `PLG-4004` Owner cleanup 不完整

- Severity: `error`
- Stage: `cleanup`
- Retryable: true
- Trigger: runtime deactivation、subscription dispose、transaction rollback 或 contribution owner cleanup 失败
- User action: 重试 cleanup，并在移除或重新启用插件前确认 lease 已清零
- Developer notes: 一个 dispose 失败不能中断剩余资源清理，也不能把已移除 record 放回 registry

### `PLG-4005` Runtime transport 意外终止

- Severity: `error`
- Stage: `runtime`
- Retryable: true
- Trigger: 当前 runtime session 的 Worker、iframe 或其他 transport 非预期结束
- User action: 检查 termination reason，再显式重试 runtime
- Developer notes: 只处理当前 session token；清理 activation lifetime，保留 installation lifetime

### `PLG-4006` Host operation 已被替代

- Severity: `info`
- Stage: `runtime`
- Retryable: true
- Trigger: disable、撤权、新 generation 或更新 operation supersede 仍在执行的旧异步操作
- User action: 使用最新 Plugin Host snapshot 决定是否重新发起操作
- Developer notes: stale completion 只能 cleanup 自己持有的资源，不能更新状态或 registry

### `PLG-4007` Audit sink 不可用

- Severity: `warning`
- Stage: `audit`
- Retryable: true
- Trigger: audit event 创建失败，或 best-effort audit sink 抛错/拒绝 lifecycle event batch
- User action: 恢复 audit sink；在恢复前不要依赖完整的插件生命周期审计记录
- Developer notes: Phase 2 lifecycle audit 为 best-effort，sink 故障不回滚已提交 state；敏感 Gateway 可在后续阶段 fail closed

### `PLG-4008` Host subscriber 回调失败

- Severity: `warning`
- Stage: `registry`
- Retryable: false
- Trigger: Plugin Host 或 contribution registry subscriber 在处理已提交 snapshot/batch 时抛错
- User action: 修复或移除失败的宿主 subscriber
- Developer notes: callback 在 mutation 临界区外执行；失败不得回滚已提交 revision 或阻断其他 listener

### `PLG-4010` Runtime artifact 读取失败

- Severity: `error`
- Stage: `runtime`
- Retryable: true
- Trigger: Host 无法从当前 installation package source 读取 Manifest 指定的 runtime entrypoint
- User action: 恢复已验证插件包中的 runtime artifact 后重试 activation
- Developer notes: Host 必须在创建 sandbox 前读取 artifact；不得让 Browser adapter 通过 composition-root side channel 自行定位 package bytes

### `PLG-4011` Runtime artifact 完整性不匹配

- Severity: `error`
- Stage: `runtime`
- Retryable: false
- Trigger: Host 无法计算 runtime artifact SHA-256，digest 格式非法，或实际 digest 与 Manifest 声明的 integrity 不一致
- User action: 恢复与 Manifest/package attestation 匹配的 runtime artifact
- Developer notes: audit、integrity comparison 与 adapter activation 必须消费同一份 bytes；失败时不得调用 runtime adapter

### `PLG-4012` Runtime artifact 超出上限

- Severity: `error`
- Stage: `runtime`
- Retryable: false
- Trigger: runtime entrypoint bytes 超过 Host runtime artifact limit，即使 package reader 忽略了传入限额
- User action: 将 runtime 构建为低于 Host 上限的 self-contained ESM entry
- Developer notes: package reader 限额与 Host 收到 bytes 后的二次检查都必须保留

## 4. 实现约束

1. `@prodivix/plugin-contracts` validator 与 `@prodivix/plugin-host` operation 必须返回 diagnostics 判别联合，不抛出面向宿主的裸校验异常。
2. `meta.manifestPath` 使用 RFC 6901 JSON Pointer；解析错误同时提供 UTF-16 offset 和一基 line / column。
3. `meta` 可以包含 plugin id、contribution id、capability、command id 和冲突资源路径，但不得包含完整源码、Secret 或 Token。
4. 测试断言 code、path 和公开结果，不绑定完整英文 message。
5. 新增或修改 PLG code 时，同步本规范、`PLUGIN_DIAGNOSTIC_DEFINITIONS` 和 `apps/docs/reference/diagnostics/` 生成结果。
