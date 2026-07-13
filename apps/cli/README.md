# @prodivix/cli

Prodivix 的 Commander CLI 基础工程。当前实现只注册了 `build` 与 `export` 命令入口：`build` 仍是占位行为，`export` 尚未实现；CLI 还没有项目初始化、登录、Workspace 同步、生产构建或部署闭环。

当前产品阶段为 **G0 Passed / G1 Foundation**。G0 的 Truth & Change Kernel 由 Core package、Web adapter 与后端协议闭环验证，不代表 CLI 已成为独立的 Workspace client。全局路线图也暂缓 CLI 的独立产品扩张，直至核心作者与导出 Gate 稳定。

## 目录结构

```text
apps/cli/
├── bin/prodivix.js       # 期望加载 dist/cli.js；当前构建配置不产出该文件
├── src/
│   ├── cli.ts            # Commander 注册入口
│   ├── commands/
│   │   ├── build.ts      # 当前为占位命令
│   │   ├── export.ts     # 尚未实现
│   │   └── deploy.ts     # 尚未注册或实现
│   └── utils/logger.ts
├── test/                 # 测试目录，目前没有有效覆盖
├── package.json
└── tsconfig.json
```

## Workspace 协议边界

CLI 当前不会读取或写入远端 Workspace。未来任何会修改作者态的 CLI 命令都必须复用正式链路：

```text
@prodivix/workspace Command / Transaction
  -> durable outbox
  -> Atomic WorkspaceOperation Commit
  -> confirmed Canonical Workspace VFS snapshot
```

不得重新引入旧 document `PATCH`、`POST /intents`、Project PIR mirror，或在 CLI 中维护独立的 Workspace / PIR 真相源。Settings 仍应使用独立的 durable outbox 与强幂等 Settings Commit。

## 常用命令

```bash
pnpm --filter @prodivix/cli dev -- --help
pnpm build:cli            # 当前只执行 noEmit TypeScript 校验
pnpm --filter @prodivix/cli lint
```

当前 `tsconfig.json` 设置了 `noEmit: true`，因此根命令 `pnpm cli` 在干净检出中没有可加载的 `dist/cli.js`。在构建产物和命令真正接入 `@prodivix/workspace`、`@prodivix/workspace-sync`、`@prodivix/prodivix-compiler` 之前，不应把 CLI 描述为可用的同步、构建、导出或部署工具。
