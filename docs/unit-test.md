# vue-support-parent-starter 单元测试与回归验证说明

## 目标

覆盖本轮重点链路，保证前端可编译、WASM 加解密可用、sign 开关正确、水印正常、关键业务页可加载。

## 构建验证

在项目根目录执行：

```bash
pnpm build
```

通过标准：

- 所有 workspace 包完成构建
- `apps/vue-support-spring-pages-starter` 不再因 `NODE_OPTIONS` 被子脚本覆盖而 OOM

## WASM 加解密验证

验证点：

- `wasmEnable: true` 时请求链路必须成功初始化 WASM
- 前端开启请求加密后，请求可正常发送，页面不出现系统异常
- 前端加解密走 WASM，不回退到普通 JS 实现

建议检查：

- 登录后打开系统管理相关页面，触发真实接口请求
- 浏览器 `console` 无 WASM 初始化失败、解密失败、系统异常类报错
- 浏览器 `errors` 为空

## 请求加密与响应加密验证

验证点：

- 前端请求加密开关打开时，请求仍可成功
- 后端可根据配置决定返回加密或不加密数据
- 前端根据响应头判断是否为加密数据，并完成正确解密
- 响应加密开关实时切换后，请求结果与页面展示保持正常

建议检查：

- 打开加密开关后访问登录、模块管理、租户管理页面
- 关闭加密开关后再次访问相同页面
- 页面数据可正常展示，无解密异常、无白屏、无系统异常提示

## sign 验证

验证点：

- 前端存在 sign 计算开关
- 开关打开时，前端计算 sign 并随请求发送
- 开关关闭时，不再发送 sign
- 后端根据请求是否携带 sign 做合法性校验

建议检查：

- 分别在 sign 开启和关闭场景访问真实接口
- 请求均返回符合预期结果
- 非法 sign 请求会被后端拒绝

## 水印验证

验证点：

- 前后端水印功能启用时页面出现水印
- 关闭后水印消失
- 水印切换不影响页面主功能和接口请求

建议检查：

- 登录后检查主体框架与业务页
- 切换配置后刷新页面，确认水印展示状态正确

## 页面回归

建议优先使用 `agent-browser` 做浏览器回归。

必测页面：

- `/#/login`
- `/#/service/module`
- `/#/service/service`
- `/#/service/tenant`

通过标准：

- 页面主体结构可见
- 表单、筛选区、表格或卡片区域加载正常
- `console` 无新的 `warning`
- `errors` 为空

## 已修复的典型问题

- `ScHeader` 包入口错误，导致全局注册失效
- `ScHeader` 默认分支错误递归渲染自身，应使用 `ElHeader`
- 服务管理筛选项使用 `null` 作为 `ElOption` 的 `value`，触发 prop 类型告警
- 错误页 `style` prop 命名冲突
- `ScPagination` 包装组件递归渲染自身
- i18n 缺失 `message.confimDelete`
- 路由缺页与 `/home`、`/` no-match 警告已做运行时降噪

## 回归命令建议

```bash
pnpm build
agent-browser --session qa-check open http://127.0.0.1:8848/#/login
```

浏览器验证时建议补充：

- `agent-browser --session qa-check console --json`
- `agent-browser --session qa-check errors --json`

## 结论标准

只有同时满足以下条件才算通过：

- 前端构建成功
- 登录成功
- 主体框架正常
- 关键业务页正常加载
- WASM 加解密成功
- sign 开关行为正确
- 响应加密正常
- 水印正常
- 浏览器无新增报错与关键告警
