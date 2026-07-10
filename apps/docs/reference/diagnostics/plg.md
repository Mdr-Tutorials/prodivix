---
lastUpdated: false
---

# Plugin 错误码

Plugin 命名空间覆盖Plugin Manifest、contribution contract、权限、注册事务和 runtime lifecycle。

| Code                                          | 名称                                    | 严重程度  |
| --------------------------------------------- | --------------------------------------- | --------- |
| [`PLG-1001`](/reference/diagnostics/plg-1001) | Manifest 源不是严格 UTF-8 JSON          | `error`   |
| [`PLG-1002`](/reference/diagnostics/plg-1002) | Manifest 包含重复对象键                 | `error`   |
| [`PLG-1003`](/reference/diagnostics/plg-1003) | 程序化输入不是 JSON value               | `error`   |
| [`PLG-1004`](/reference/diagnostics/plg-1004) | Manifest 不符合 v1 Schema               | `error`   |
| [`PLG-1005`](/reference/diagnostics/plg-1005) | Manifest 超出资源上限                   | `error`   |
| [`PLG-1010`](/reference/diagnostics/plg-1010) | Contribution 资源读取失败               | `error`   |
| [`PLG-1011`](/reference/diagnostics/plg-1011) | Contribution 资源不是严格 JSON          | `error`   |
| [`PLG-1012`](/reference/diagnostics/plg-1012) | Contribution 资源完整性不匹配           | `error`   |
| [`PLG-1013`](/reference/diagnostics/plg-1013) | Contribution contract 不受支持          | `error`   |
| [`PLG-1014`](/reference/diagnostics/plg-1014) | Contribution descriptor 不符合 contract | `error`   |
| [`PLG-1015`](/reference/diagnostics/plg-1015) | Contribution 资源超出上限               | `error`   |
| [`PLG-2001`](/reference/diagnostics/plg-2001) | 插件版本不是有效 SemVer                 | `error`   |
| [`PLG-2002`](/reference/diagnostics/plg-2002) | Prodivix engine range 无效              | `error`   |
| [`PLG-2003`](/reference/diagnostics/plg-2003) | 当前宿主版本不兼容                      | `error`   |
| [`PLG-2004`](/reference/diagnostics/plg-2004) | Publisher 与插件 scope 不一致           | `error`   |
| [`PLG-2010`](/reference/diagnostics/plg-2010) | Capability 重复声明                     | `error`   |
| [`PLG-2011`](/reference/diagnostics/plg-2011) | Contribution id 重复                    | `error`   |
| [`PLG-2012`](/reference/diagnostics/plg-2012) | Contribution 缺少注册能力               | `error`   |
| [`PLG-2013`](/reference/diagnostics/plg-2013) | Activation 引用无效                     | `error`   |
| [`PLG-2014`](/reference/diagnostics/plg-2014) | Activation 缺少 runtime entrypoint      | `error`   |
| [`PLG-2015`](/reference/diagnostics/plg-2015) | 资源路径不可移植或发生冲突              | `error`   |
| [`PLG-2016`](/reference/diagnostics/plg-2016) | UI entrypoint id 重复                   | `error`   |
| [`PLG-3001`](/reference/diagnostics/plg-3001) | Required capability 被拒绝              | `error`   |
| [`PLG-3002`](/reference/diagnostics/plg-3002) | Capability policy 解析失败              | `error`   |
| [`PLG-3010`](/reference/diagnostics/plg-3010) | Contribution identity 冲突              | `error`   |
| [`PLG-3011`](/reference/diagnostics/plg-3011) | Registry transaction revision 冲突      | `error`   |
| [`PLG-3012`](/reference/diagnostics/plg-3012) | Contribution resolver 失败              | `error`   |
| [`PLG-3013`](/reference/diagnostics/plg-3013) | Plugin owner generation 已过期          | `error`   |
| [`PLG-3014`](/reference/diagnostics/plg-3014) | Contribution contract 配置冲突          | `error`   |
| [`PLG-4001`](/reference/diagnostics/plg-4001) | Plugin Host 状态转换非法                | `error`   |
| [`PLG-4002`](/reference/diagnostics/plg-4002) | Runtime activation 失败                 | `error`   |
| [`PLG-4003`](/reference/diagnostics/plg-4003) | Runtime 操作超时                        | `error`   |
| [`PLG-4004`](/reference/diagnostics/plg-4004) | Owner cleanup 不完整                    | `error`   |
| [`PLG-4005`](/reference/diagnostics/plg-4005) | Runtime transport 意外终止              | `error`   |
| [`PLG-4006`](/reference/diagnostics/plg-4006) | Host operation 已被替代                 | `info`    |
| [`PLG-4007`](/reference/diagnostics/plg-4007) | Audit sink 不可用                       | `warning` |
| [`PLG-4008`](/reference/diagnostics/plg-4008) | Host subscriber 回调失败                | `warning` |
| [`PLG-4010`](/reference/diagnostics/plg-4010) | Runtime artifact 读取失败               | `error`   |
| [`PLG-4011`](/reference/diagnostics/plg-4011) | Runtime artifact 完整性不匹配           | `error`   |
| [`PLG-4012`](/reference/diagnostics/plg-4012) | Runtime artifact 超出上限               | `error`   |

[返回错误码索引](/reference/diagnostic-codes)
