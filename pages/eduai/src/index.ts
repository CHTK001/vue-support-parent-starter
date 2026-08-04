/**
 * @repo/eduai —— 教育 AI 共享包
 *
 * 提供题库 / 组卷 / 阅卷 / 知识库 / 错题 / 考试 6 大能力模块，
 * 以及工作台首页、维度管理集成。业务应用通过 @repo/eduai 引入。
 *
 * 用法（apps/vue-support-eduai-starter/src/main.ts）：
 *   import { createContextApp } from "@repo/app";
 *   import { registerStaticMenu } from "@repo/pinia";
 *   import { eduaiRoutes, eduaiMenus } from "@repo/eduai";
 *   const { context } = await createContextApp({});
 *   registerStaticMenu(eduaiMenus);
 *   eduaiRoutes.forEach(r => context.router.addRoute("layout", r));
 */
export { default as HomeView } from "./views/HomeView.vue";
export { default as QuestionView } from "./views/QuestionView.vue";
export { default as PaperView } from "./views/PaperView.vue";
export { default as MarkingView } from "./views/MarkingView.vue";
export { default as KnowledgeView } from "./views/KnowledgeView.vue";
export { default as WrongbookView } from "./views/WrongbookView.vue";
export { default as ExamView } from "./views/ExamView.vue";
export { eduaiRoutes, eduaiMenus } from "./router";
export * from "./api/types";
export * from "./api/eduaiApi";
