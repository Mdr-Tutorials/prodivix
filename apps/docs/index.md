---
layout: home

hero:
  name: 'Prodivix'
  text: '语义化 Web 作者环境'
  tagline: 以 Canonical Workspace VFS 为唯一作者态真相，连接视觉编辑、代码与可验证的修改链路
  image:
    src: /logo.svg
    alt: Prodivix
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看简介
      link: /guide/introduction
    - theme: alt
      text: GitHub
      link: https://github.com/Mdr-Tutorials/prodivix

features:
  - icon: 🗂️
    title: Canonical Workspace VFS
    details: Workspace、Route、PIR、Code Documents、Assets 与 Config 共享同一个作者态真相源，不在编辑器之间复制领域状态。
  - icon: 🔁
    title: 可恢复的修改链路
    details: 领域变更进入 Command / Transaction，经 durable outbox 提交为 Atomic WorkspaceOperation，并保留 History、冲突与恢复语义。
  - icon: 🧭
    title: G0 Passed / G1 Foundation
    details: Truth & Change Kernel 已通过可重复验证；代码与视觉混合作者环境、浏览器验证及更多导出目标仍在建设。
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);

  --vp-home-hero-image-background-image: linear-gradient(-45deg, #bd34fe 50%, #47caff 50%);
  --vp-home-hero-image-filter: blur(44px);
}

@media (min-width: 640px) {
  :root {
    --vp-home-hero-image-filter: blur(56px);
  }
}

@media (min-width: 960px) {
  :root {
    --vp-home-hero-image-filter: blur(68px);
  }
}
</style>

## 当前阶段

Prodivix 仍处于 alpha。当前 **G0 Truth & Change Kernel 已通过**：Canonical Workspace、Command / Transaction、History、durable outbox、Atomic Commit、revision conflict、Issues 与无浏览器 Golden Conformance 已形成闭环。项目正在建设 **G1 Semantic Hybrid Authoring**，真实 Language Service、visual/code round-trip、独立导出项目验证与更多产品闭环尚未完成。

React/Vite 是当前 Golden export 基线；Vue、Angular、Svelte 等 target 仍属于后续路线图。AI、NodeGraph、Animation、插件与部署相关基础不应被解读为对应产品 Gate 已完成。

<div style="text-align: center; margin-top: 2rem;">
  <p style="color: var(--vp-c-text-2);">
    从当前架构与能力边界开始了解 Prodivix。
  </p>
  <a href="./guide/getting-started" style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--vp-c-brand-1); color: white; border-radius: 8px; text-decoration: none; font-weight: 500;">
    开始使用
  </a>
</div>
