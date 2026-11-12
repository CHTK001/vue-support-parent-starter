# `pages/server/public` —— 远控终端的整页文档

这里放的是**必须按 URL 直接取**的静态文件，不是模块：它们被打进 iframe 或由页面里的
`<script src>` 引用，不能被 `import`。

```
public/
  ssh-direct.html           ← /ssh-direct.html      （SSH 直连终端，ScSshDirectViewer 的 iframe）
  telnet-direct.html        ← /telnet-direct.html   （Telnet 直连终端）
  term/
    xterm.js                ← /term/xterm.js
    xterm.css               ← /term/xterm.css
    addon-fit.js            ← /term/addon-fit.js
    terminal-search.js      ← /term/terminal-search.js   （终端内搜索，两个页面共用）
    terminal-search.css     ← /term/terminal-search.css
```

## 为什么放在页面包里而不是 app 的 public

`createVite` 把 Vite 的 `publicDir` 固定成仓库根 `public`（Vite 只认一个 publicDir），
app 自己的 `public` 只是兜底通道。把终端页放进 app 的 public，第二个需要远控的 app
就得再复制一份——两份内容迟早分叉。

所以：**源码归 `@pages/server`，由 `servePagePublic` 挂到 URL 上**。dev 阶段中间件直接
读这里的文件（零拷贝），build 时才拷进启用挂载的 app 的 `dist`。

## 消费方怎么接

在 app 的 `vite.config.ts` 里加一行（见 `apps/vue-support-monitor-starter/vite.config.ts`）：

```ts
import { servePagePublic } from "../../turbo/vite/servePagePublic";

export default createVite({
  plugins: [servePagePublic({ "/": "pages/server/public" })],
});
```

## 规则

- **优先级**：共享根 `public` > app 自身 `public` > 本目录。前两者有同名文件时这里让路。
- **URL 不变**：挂到 URL 根，所以页面内部的 `/term/xxx.js` 与组件的 `/ssh-direct.html`
  都不需要跟着改。
- **不要在这份文件里写死后端地址**：页面里的 WS 走 `location.host`，前后端同源才能连上。
- `xterm.js` / `xterm.css` / `addon-fit.js` 是 vendored 构建产物，升级时整份替换，
  不要手改。
