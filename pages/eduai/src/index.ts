/**
 * @pages/eduai —— 教育 AI 共享包
 *
 * 提供题库 / 组卷 / 阅卷 / 知识库 / 错题 / 考试 / 趣味学习 7 大能力模块，
 * 以及工作台首页、维度管理集成。业务应用通过 @pages/eduai 引入。
 *
 * 用法（apps/vue-support-eduai-starter/src/main.ts）：
 *   createContextApp({ install }).routes(eduaiRoutes).mount("#app")
 *   —— 路由树即菜单树（两级分组导航，分组父节点 meta.isGroup），
 *      侧边栏菜单由 @repo/app 的 buildMenuFromRoutes 自动推导，无需 registerStaticMenu。
 */
export { default as HomeView } from "./views/HomeView.vue";
export { default as StudentManageView } from "./views/StudentManageView.vue";
export { default as PoemBankView } from "./views/PoemBankView.vue";
export { default as QuestionView } from "./views/QuestionView.vue";
export { default as PaperView } from "./views/PaperView.vue";
export { default as MarkingView } from "./views/MarkingView.vue";
export { default as KnowledgeView } from "./views/KnowledgeView.vue";
export { default as DataConfigView } from "./views/DataConfigView.vue";
export { default as WrongbookView } from "./views/WrongbookView.vue";
export { default as ExamView } from "./views/ExamView.vue";
export { default as FunView } from "./views/FunView.vue";
export { default as FunConfigView } from "./views/FunConfigView.vue";
export { default as InsectView } from "./views/InsectView.vue";
export { default as IdiomGameView } from "./views/IdiomGameView.vue";
export { default as IdiomBankView } from "./views/IdiomBankView.vue";
export { default as KnowledgeFilePreview } from "./components/KnowledgeFilePreview.vue";
export { eduaiRoutes } from "./router";
export * from "./api/types";
export * from "./api/eduaiApi";
