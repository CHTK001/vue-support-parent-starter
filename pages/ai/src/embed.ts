/**
 * pages/ai 宿主嵌入装配 —— 系统平台把「AI 提供商管理」作为内部页面嵌入时的桥接层。
 *
 * 内嵌后 ModelsPage 等组件仍按 pages/ai 自己的方式工作：
 *  - 数据层走 @/framework/context 的 api/adminApi（@repo/utils 的 Http 管线）；
 *  - 文案走 useI18n()（注入的实例 = 宿主的 i18n，见 ModelsPage.vue）。
 *
 * 独立运行时这两样由 main.js 的 bootstrapFramework() 与 locales/index.ts 自装配；
 * 内嵌时必须改从宿主接管，否则（2026-10-14 实测）：
 *  - 请求抛「[ai-guada] 请求模块未装配」→ /api/providers 根本发不出去，列表空态；
 *  - 界面文案显示原始 i18n key（宿主语言包里没有 settings.models.*）。
 *
 * 语言包合并放在模块加载期（import 副作用，与 menu.ts 的 registerMenuViewModules
 * 同理）：宿主 i18n 单例在装配期即存在，早于 mount 与任何路由渲染。放到宿主
 * main.ts 的 mount().then() 里与懒加载路由首屏渲染有竞态（实测文案显示原始 key）。
 *
 * 用法（宿主 main.ts）：
 *   import "@pages/ai/embed";                       // 副作用：合并语言包
 *   import { adoptHostFramework } from "@pages/ai/embed";
 *   .then((app) => adoptHostFramework(app.context))  // 可选：显式采用完整上下文
 *
 * 深导入本模块而非包根 index.ts：包根会 re-export main.js（ai-guada 启动壳入口），
 * 同步加载 App.vue 壳与全局样式，污染宿主应用（与 menu.ts 同理由）。
 */
import type { AppContext } from '@repo/core'
import hostI18n from '@repo/languages'
import zhCN from './locales/zh-CN'
import enUS from './locales/en-US'
import { adoptContext } from './framework/context'

/**
 * 把 pages/ai 的语言包合并进宿主 i18n（模块加载即刻执行）。
 *
 * <p>locale 键映射 zh-CN→zh、en-US→en（宿主用短键，见 @repo/languages）。
 * 两套包的顶层键无重叠（宿主：menu/button/home/…；pages/ai：common/chat/
 * settings/…），mergeLocaleMessage 深合并，不会覆盖宿主既有文案。</p>
 */
hostI18n.global.mergeLocaleMessage('zh', zhCN)
hostI18n.global.mergeLocaleMessage('en', enUS)

/**
 * 采用宿主已装配的框架上下文（请求管线：Bearer / 第一方请求头 / 401 / 统一提示）。
 *
 * <p>请求出口本身已能经宿主管线回退拿到实例（见 framework/context.ts 的
 * resolveHttpInstance），本函数是显式接管：pages/ai 后续若直接读 context
 * （而非只走 http），拿到的也是宿主的完整上下文。宿主 createApp 装配期间即
 * setDefaultHttpInstance，与 context.http 是同一个 axios 实例，两条路径等价。</p>
 */
export function adoptHostFramework(ctx: AppContext): void {
  adoptContext(ctx)
}
