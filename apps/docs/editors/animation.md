# Animation 编辑器

Animation 编辑器管理独立 `pir-animation` 文档，包括轨道、关键帧、目标引用、easing、CSS/SVG filter 和可选代码函数。

## 作者模型

时间轴是 Animation 文档的投影。拖动关键帧、修改时长或调整曲线会形成可逆 Command；播放器的当前时间、选区和缩放只是视图状态。

目标节点通过类型化引用连接 PIR 或组件实例。重命名、移动和删除目标时，Workspace Semantic Index 能报告动画引用影响。

## 预览与求值

`@prodivix/animation` 提供无 DOM contract、codec、authoring factory、确定性 evaluator、Runtime Port 和 same-context ExecutionProvider。连续播放统一执行 delay、iterations、direction、fillMode、keyframe/timeline easing、取消与 timeout。

浏览器 adapter 使用 one-shot RAF 与 generation-fenced effect lease，把中立 frame 投影成 Renderer 使用的 CSS/SVG snapshot。新 Job 会让旧 lease 的迟到帧失效。预览是派生运行态，不会把每一帧结果写回 Workspace 或 Job history。

## 代码与 Shader

自定义 easing、timeline script 与 shader 通过 Code Slot 绑定共享代码环境。GLSL/WGSL 的语言语义和 GPU compile capability 是两个独立层次：能跳转到符号不代表目标设备已经通过编译验证。

## 当前边界

Animation Play/Stop/Restart 已绑定当前 Canonical Workspace revision，并通过正式 ExecutionJob、稳定 Session 和共享 Execution Center 运行。静态 scrub 仍是轻量本地求值；连续播放不再使用编辑器私有 RAF 状态机。

尚未执行的 custom easing、timeline script 和 shader CodeSlot 会 fail closed。跨 timeline/route composition、reduced-motion policy、GPU effect、远程执行和完整性能/视觉回归 Gate 尚未交付。

继续阅读：[Code 与 Shader](/editors/code-and-shaders)与[Preview 与 Export](/concepts/preview-and-export)。
