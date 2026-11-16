# ReIcon 彩色品牌图标（colorful）

`ReIcon` 的第三种「原色」图标源：把 [Iconify](https://iconify.design) 的 **logos**（CC0-1.0）
与 **devicon**（MIT）图标集的 SVG **离线内置**，渲染时原样内联，保留品牌自身的配色。

- 生成脚本：`packages/ui/scripts/sync-colorful-icons.mjs`（`GROUPS` 里是全部图标清单）
- 一致性自检：`packages/ui/scripts/check-colorful-icons.mjs`
- 名字与分组：`names.ts`；分组 body：`bodies.<组>.ts`；按组懒加载：`load.ts`

## 为什么离线内置

1. **内网部署**：`ri:`/`mdi:` 那类 Iconify 图标运行时走 `api.iconify.design`，没有外网就白屏；
   彩色品牌图标同理，必须打进产物。
2. **必须是原色**：品牌图标带各自的 `fill`（MySQL 的 `#00758f`、Vue 的 `#41b883`……），
   走 `currentColor` 会被染成单色，等于失去意义。因此这里内联的是 **`<svg>` 的 body 原文**，
   不是 Icon 组件。
3. **体积**：229 个品牌图标合计 gzip 约 365KB，全量进主包不可接受。按「操作系统 / 研发工具 /
   后端 / 前端 / 数据库 / 云与 AI / 办公产品」拆成 7 个文件，`ReIcon` 只 `import()` 图标所在的那一组
   （gzip 20~85KB）；`names.ts`（约 12KB 源码）进主包，用于命名判定与选择器列表。

## 命名与用法

名字本身就是**完整图标名**（与 Iconify 口径一致），不带额外前缀：

```vue
<ReIcon name="logos:mysql" :size="18" />
<ReIcon name="logos:docker" :size="24" />
<ReIconSelect v-model="icon" />   <!-- 「彩色」页签里选中后回填 logos:xxx -->
```

- `size` 决定 svg 的宽高（正方形），与各集合自己的 `viewBox` 无关
- 只有**内置名单**里的名字走彩色分支；名单外的 `prefix:name` 仍走在线 Iconify 渲染器
- body 里的 `id` 在生成时已按图标名加前缀，同页多个图标不会抢同一个渐变 `#id`
- 生成物只允许来自脚本：`v-html` 内联的是构建期产物，不能渲染运行时用户输入

## 新增 / 升级图标

1. 改 `packages/ui/scripts/sync-colorful-icons.mjs` 的 `GROUPS`（名字必须是 Iconify 里真实存在的）
2. `pnpm --filter @repo/ui icons:colorful:sync`
3. `pnpm --filter @repo/ui icons:colorful:check` 必须通过（名字与 body 一一对应，CI 也应跑）
4. 提交改动过的 `names.ts` / `types.ts` / `bodies.<组>.ts`
