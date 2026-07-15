---
lastUpdated: false
---

# Animation 错误码

Animation 命名空间覆盖Timeline、binding、track、keyframe、filter 和预览运行时。

| Code                                          | 名称                         | 严重程度  |
| --------------------------------------------- | ---------------------------- | --------- |
| [`ANI-1001`](/reference/diagnostics/ani-1001) | 时间线时长非法               | `error`   |
| [`ANI-1002`](/reference/diagnostics/ani-1002) | 时间线 ID 重复               | `error`   |
| [`ANI-2001`](/reference/diagnostics/ani-2001) | Binding 目标节点不存在       | `error`   |
| [`ANI-3001`](/reference/diagnostics/ani-3001) | Track 属性不支持             | `warning` |
| [`ANI-3002`](/reference/diagnostics/ani-3002) | SVG Filter primitive 不存在  | `error`   |
| [`ANI-4001`](/reference/diagnostics/ani-4001) | Keyframe 时间不递增          | `warning` |
| [`ANI-5001`](/reference/diagnostics/ani-5001) | 动画预览采样失败             | `error`   |
| [`ANI-5002`](/reference/diagnostics/ani-5002) | 执行目标时间线不存在         | `error`   |
| [`ANI-5101`](/reference/diagnostics/ani-5101) | CodeSlot 执行能力不可用      | `error`   |
| [`ANI-5102`](/reference/diagnostics/ani-5102) | Easing 不受当前 Runtime 支持 | `error`   |
| [`ANI-5201`](/reference/diagnostics/ani-5201) | Effect capability 不受支持   | `error`   |
| [`ANI-5202`](/reference/diagnostics/ani-5202) | Effect target 不可用         | `error`   |
| [`ANI-9001`](/reference/diagnostics/ani-9001) | Animation 未知异常           | `error`   |

[返回错误码索引](/reference/diagnostic-codes)
