# @prodivix/docs

Prodivix 的 VitePress 文档站。当前产品阶段为 **G0 Passed / G1 Foundation**；面向产品用户的文案必须区分已经验证的能力、基础实现与长期路线图，不能把 Accepted ADR 或存在 UI 误写成已交付闭环。

## 当前目录

```text
apps/docs/
├── .vitepress/
│   └── config.mts                         # 导航、侧栏与站点配置
├── api/
│   ├── backend.md
│   ├── cli.md
│   └── components.md
├── community/
│   ├── changelog.md
│   ├── contributing.md
│   └── development.md
├── guide/
│   ├── ai-assistant.md
│   ├── getting-started.md
│   ├── introduction.md
│   └── project-structure.md
├── reference/
│   ├── diagnostics/                       # 从 specs catalog 生成的诊断页面
│   ├── authoring-symbol-environment.md
│   ├── code-diagnostics.md
│   ├── diagnostic-codes.md
│   ├── pir-spec.md
│   ├── plugin-package-and-blueprint-template.md
│   └── ux-diagnostics.md
├── public/
│   └── logo.svg
├── index.md
└── package.json
```

## 与 `specs/` 的关系

- `apps/docs` 提供可导航的产品指南、API 入口和公开参考，内容必须反映当前实现边界。
- `specs/` 承载权威 schema、协议、ADR、ImplementationStatus、Global Phase 和验证证据。
- 全局进度以 `specs/roadmap/global-phases.md` 为准，G0 证据以 `specs/roadmap/g0-closure-evidence.md` 为准。
- PIR schema 以 `specs/pir/PIR-current.json` 与 `PIR-current.version.json` 为准；Workspace 同步 wire contract 以 `specs/api/workspace-sync.openapi.yaml` 为准。
- 诊断页面由根脚本生成。不要直接维护 `reference/diagnostics/` 中的生成文件。

文档可以解释 ADR，但不复制一份会独立漂移的规范，也不把 `DecisionStatus: Accepted` 等同于 `ProductGateStatus: Passed`。

## 常用命令

```bash
pnpm dev:docs
pnpm build:docs
pnpm --filter @prodivix/docs preview
pnpm run docs:diagnostics
pnpm run docs:diagnostics:check
```
