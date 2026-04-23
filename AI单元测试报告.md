# AI单元测试报告

更新时间：2026-04-23（规划版，已由 `spring-support-ai-starter/AI_MINIMAL_REFACTOR_PLAN.md` 收敛转换）

## 项目地址

- 前端功能模块：`H:\\workspace\\2\\vue-support-parent-starter\\pages\\ai`
- 前端测试入口：`H:\\workspace\\2\\vue-support-parent-starter\\test\\ai`
- 后端功能模块：`H:\\workspace\\2\\spring-support-parent-starter\\spring-support-ai-starter`
- 后端测试壳：`H:\\workspace\\2\\spring-support-api-parent\\test\\spring-api-support-ai-test-starter`

## 执行规则

- 先记录（测试报告） -> 后执行（实现/测试） -> 再回填结果（测试报告）。
- 本轮重构主范围仅限 `spring-support-ai-starter` 与 `pages/ai`，不继续扩散到其它测试壳。
- 同一时刻仅允许一个 AI 测试前端实例、一个 AI 测试后端实例运行。
- 未预登记任务不计入本轮结论。

## 任务清单（统一格式）

> 收敛说明：本轮 AI 侧任务统一归并为“数据库最小化、后端接口最小化、前端页面最小化、兼容层、联调验证”五大类；所有细项以后续回填为准，不再散落在临时计划文件中。

| 任务ID | 任务 | 目标 | 状态 |
| --- | --- | --- | --- |
| DOC-01 | AI 报告收敛与统一管理 | 将 `AI_MINIMAL_REFACTOR_PLAN.md` 合并到前端根目录并转换为统一测试报告风格 | 已完成 |
| AI-DB-01 | 删除现有 AI 相关表 | 清理 `sys_ai_group`、`sys_ai_group_message`、`sys_ai_module`、`sys_ai_vincent_setting`、`sys_ai_vincent_style`、`sys_ai_vincent_task`、`sys_ai_vincent_template` | 未开始 |
| AI-DB-02 | 重建 AI 最小核心表 | 按最小实现重建 `sys_ai_module`、`sys_ai_session`、`sys_ai_message`、`sys_ai_task` | 未开始 |
| AI-DB-03 | 重构 AI 初始化 SQL | 将 SQL 收敛为“删表 -> 建表 -> 最小种子数据”三段式初始化脚本 | 未开始 |
| AI-BE-01 | AI starter 自动装配收敛 | 确保仅引入 `spring-support-ai-starter` 即可自动注册 controller/service/mapper/sql | 未开始 |
| AI-BE-02 | 模型接口最小化重构 | 建立 `/v2/ai/module/*` 主路径，并保留 `/v2/project/ai/module/*` 兼容层 | 未开始 |
| AI-BE-03 | 聊天接口最小化重构 | 建立 `/v2/ai/chat/*` 主路径，并兼容 `/v2/api/language/*` | 未开始 |
| AI-BE-04 | 会话接口最小化重构 | 建立 `/v2/ai/session/*` 主路径，并兼容旧 group/message 路径 | 未开始 |
| AI-BE-05 | 图像/视频/处理任务接口统一 | 统一 `/v2/ai/image|video|face|colorization|resolution` 任务接口与历史接口兼容层 | 未开始 |
| AI-BE-06 | AI 包结构去 project 化 | 逐步将 `com.chua.starter.project.*` 迁移为 AI 领域命名，旧包保留兼容层 | 未开始 |
| AI-FE-01 | AI 首页最小化重构 | 首页仅保留主体功能正方形卡片、插图和右上角设置按钮 | 未开始 |
| AI-FE-02 | AI 设置页独立化 | 新建独立模型配置页，展示模型、厂家、地址、输入费用、输出费用等字段 | 未开始 |
| AI-FE-03 | AI 功能页最小化重建 | 重建聊天、生图、视频、人脸检测、图像上色、分辨率增强六个最小功能页 | 未开始 |
| AI-FE-04 | AI API 层重构 | 新建 `module/chat/session/task` API 文件，弱化 `project-ai-module` 命名 | 未开始 |
| AI-FE-05 | AI 路由收敛 | 重建 `/ai/home`、`/ai/settings`、`/ai/chat`、`/ai/image`、`/ai/video`、`/ai/face`、`/ai/colorization`、`/ai/resolution` | 未开始 |
| AI-COMP-01 | 旧页面/旧接口兼容层 | 保留旧路由与旧接口重定向或兼容适配，避免一次性打断引用 | 未开始 |
| AI-VERIFY-01 | 模型配置页联调 | 验证模型配置页增删改查与字段回显 | 未开始 |
| AI-VERIFY-02 | 聊天页主链路联调 | 验证模型选择、会话管理、消息发送和流式回复 | 未开始 |
| AI-VERIFY-03 | 图像与视频主链路联调 | 验证图像生成、视频生成、任务查询与历史记录 | 未开始 |
| AI-VERIFY-04 | 图像处理功能联调 | 验证人脸检测、图像上色、分辨率增强的表单与结果链路 | 未开始 |
| AI-VERIFY-05 | 旧路由兼容回归 | 验证 `/ai/llm/web`、`/ai/vincent/web` 等旧入口仍可访问 | 未开始 |

## 当前结论

- 该文档已替代原 `spring-support-ai-starter/AI_MINIMAL_REFACTOR_PLAN.md` 的临时计划角色，后续 AI 重构与测试记录统一在此回填。
- 当前仅完成“计划收敛与文档统一”，尚未开始执行数据库重构、接口重构、页面重构与联调验证。
- 本轮后续实施范围已明确限制为两个核心目录：
  - `H:\\workspace\\2\\spring-support-parent-starter\\spring-support-ai-starter`
  - `H:\\workspace\\2\\vue-support-parent-starter\\pages\\ai`
- 当前不能给出“AI 功能已完成”或“AI 单元测试已通过”的结论；现阶段结论仅为“重构任务已建档，待执行”。

## 备注

- 原始规划文档来源：`H:\\workspace\\2\\spring-support-parent-starter\\spring-support-ai-starter\\AI_MINIMAL_REFACTOR_PLAN.md`
- 当前规划中的“输入费用 / 输出费用”字段，在后端实体与前端表单中都还未形成稳定闭环，后续实现时需一起补齐。
- 当前 AI 模块仍存在与 `SysProject`、`AuthService` 等历史语义耦合，后续实施时需要明确“完全去耦”与“兼容旧链路”之间的边界。
