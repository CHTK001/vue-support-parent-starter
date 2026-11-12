/**
 * 应用入口 —— 全量装配逻辑由 @repo/app 的 createContextApp 内部统一处理
 *
 * 说明：应用 route.mode=remote：
 *   - 菜单完全由后端 /v2/user/menu 提供（main.ts 不注册任何本地菜单）
 *   - 路由：登录后后端菜单动态注册；页面由 registerMenuViewModules 注册，
 *     实现异步页面模块映射，点击菜单时动态加载、无预加载
 *
 * 注意：页面模块（业务页面）由后端菜单注册，
 * 这里是固定的应用级入口，不随菜单变更。
 */
import { createContextApp } from "@repo/app";
import { registerAnnouncementApi, type AnnouncementItem } from "@repo/theme";
import { registerStaticMenu } from "@repo/pinia";
import { systemMenus, systemRoutes, systemWidgets } from "@pages/system";
import { tenantMenus, tenantRoutes } from "@pages/tenant";
import { getActiveAnnouncements, markAnnouncementRead } from "@pages/system/api/announcementApi";
// home widget 贡献器：各 pages 模块贡献的 widget 挂到 app 上
import { defineWidgetContribution } from "@repo/theme/koi/views/home/registry";
// 监控大屏的领域卡片贡献（Actuator / APM）：元数据与组件加载器留在各自 pages 包，
// 这里只负责在 mount 前登记，大屏本体不反向依赖它们。
import { actuatorContribution } from "@pages/actuator";
import { apmContribution } from "@pages/apm/src/monitor";
import "@pages/filesystem";
import "@pages/job";
import "@pages/task";
// AI 提供商管理（= pages/ai 的模型管理页）以内部普通页面菜单嵌入宿主。
// 深导入 /menu 而非包根：包根 index.ts 会 re-export main.js（ai-guada 启动壳入口），
// 那会同步加载 App.vue 壳与 element-plus/tailwind/refactor 等全局样式，污染本应用。
import "@pages/ai/menu";
// 内嵌装配：/embed 在 import 时就把 pages/ai 语言包合并进本应用 i18n
// （settings.models.* 等键，否则页面文案显示原始 key）；mount 后再显式采用
// 本应用框架上下文。深导入 /embed 而非包根，理由同 /menu。
import "@pages/ai/embed";
import { adoptHostFramework } from "@pages/ai/embed";

// 主题层不反向依赖 pages/*：由应用把公告接口实现注入 @repo/theme 的注册表，
// AnnouncementBar 通过 getAnnouncementApi 取用；不注入则静默不请求。
registerAnnouncementApi({
  getActiveAnnouncements: async () => {
    const res = await getActiveAnnouncements();
    return { data: (res?.data ?? []) as AnnouncementItem[] };
  },
  markAnnouncementRead,
});

// 后端菜单不可用时仍保证左侧导航可见；远程菜单成功后会由 auth store 自动隐藏这些兜底根节点。
registerStaticMenu([...systemMenus, ...tenantMenus]);

/**
 * 启动失败兜底 —— 后端不可用时至少要让用户看见原因。
 *
 * <p>{@code mount()} 是 async，链路里任何一步失败都会让它 reject
 * （{@code loadCrypto} 拉不到 wasm 密钥、{@code loadConfig} 拉不到远端配置等）。
 * 而 {@code .mount("#app")} 是<strong>浮动 promise</strong>：reject 之后没人接，
 * {@code #app} 就一直空着 —— 表现是<strong>永久白屏，且没有任何提示</strong>。
 * 2026-09-29 实测：后端断续不可达期间，页面标题能出来（说明 index.html 加载了）
 * 但 {@code #app} 零子节点、没有报错弹窗、连一条 console 都没有。</p>
 *
 * <p>两重保险：{@code .catch()} 接 reject；再挂一个定时器兜底「挂起」
 * （既不 resolve 也不 reject）—— 那种情况下 catch 永远不会触发。</p>
 */
const BOOT_TIMEOUT_MS = 25_000;

function renderBootError(reason: string, detail: string): void {
  const el = document.querySelector<HTMLElement>("#app");
  if (!el) return;
  // 已经有内容说明应用挂上了，别覆盖
  if (el.childElementCount > 0) return;
  el.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;' +
    'background:var(--el-bg-color,#fff);color:var(--el-text-color-primary,#303133);' +
    "font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif\">" +
    '<div style="max-width:560px;text-align:center">' +
    '<div style="font-size:44px;line-height:1;margin-bottom:16px">⚠️</div>' +
    `<h1 style="margin:0 0 12px;font-size:20px;font-weight:600">${reason}</h1>` +
    '<p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:var(--el-text-color-secondary,#606266)">' +
    "后端服务未响应，控制台无法启动。请确认服务已启动、网关与代理配置正确，然后重试。</p>" +
    '<pre style="margin:0 0 20px;padding:12px;border-radius:6px;text-align:left;' +
    "background:var(--el-fill-color-light,#f5f7fa);color:var(--el-text-color-regular,#606266);" +
    'font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-all;max-height:180px;overflow:auto">' +
    `${detail}</pre>` +
    '<button id="boot-retry" style="padding:9px 22px;border:0;border-radius:6px;cursor:pointer;' +
    'font-size:14px;background:var(--el-color-primary,#409eff);color:#fff">重新加载</button>' +
    "</div></div>";
  document.getElementById("boot-retry")?.addEventListener("click", () => location.reload());
}

let booted = false;
const bootTimer = setTimeout(() => {
  if (booted) return;
  renderBootError(
    "控制台启动超时",
    `超过 ${BOOT_TIMEOUT_MS / 1000} 秒仍未完成挂载。` +
      "后端接口无响应时，启动链路会停在第一步且不报错。",
  );
}, BOOT_TIMEOUT_MS);

createContextApp({
  routerMode: "hash",
  defaults: {
    /**
     * 调度治理出口用 job-starter 自带的 `/v2/job/**`。
     *
     * <p>`@repo/config` 的默认值是 `/v2/scheduler`——那是给采集控制台准备的
     * `@Ignore` 控制台出口（它没接平台统一认证）。本应用有平台认证，后端挂的是
     * `/v2/job/**`；沿用默认值会让调度页整页 404：列表失败被当成空台账还能渲染，
     * 保存则打 `/v2/scheduler/save` 拿 404 且无任何提示。</p>
     *
     * <p>要打开后端出口还需 `plugin.job.manage.enable=true`（默认关闭）。</p>
     */
    url: { jobApi: "/v2/job" },
  },
})
  .routes([...systemRoutes, ...tenantRoutes] as never)
  // 监控大屏卡片：各 pages 包自己注册（见 @pages/actuator、@pages/apm/monitor）
  .widgets([actuatorContribution, apmContribution, defineWidgetContribution(systemWidgets)])
  // 原先是 main.ts 手工 `.use(ReButtonInstall, ReInputInstall, ...)` 逐个导入安装。
  // 这些组件清单属于「这个 app 用到哪套 CRUD 组件」，已经由 @repo/ui 的 preset 维护：
  //   - core preset 覆盖表格 / 表单 / 弹窗 / 标签 / 输入 / 搜索 / 图标选择等 CRUD 基础件；
  //   - ReIpText 不在 core 里，系统管理用它展示 IP 文本，单独追加一项。
  // 收敛后 main.ts 不用再 import @repo/ui 的十几个 install 模块，也避免各 app 抄清单漂移。
  .ui({ preset: "core", components: ["ReIpText"] })
  .mount("#app")
  .then((app) => {
    booted = true;
    clearTimeout(bootTimer);
    // 「AI 提供商管理」页（pages/ai 内嵌）显式采用本应用框架上下文：请求管线
    // 本就可经宿主管线回退拿到（见 pages/ai/framework/context.ts 的
    // resolveHttpInstance），此处保证 pages/ai 后续直接读 context 的能力也一致；
    // 语言包已在 import "@pages/ai/embed" 时合并进本应用 i18n。
    adoptHostFramework(app.context);
  })
  .catch((error: unknown) => {
    clearTimeout(bootTimer);
    const detail =
      error instanceof Error ? `${error.name}: ${error.message}\n${error.stack ?? ""}` : String(error);
    // 原始错误同时进控制台，方便开发定位
    console.error("[boot] 控制台挂载失败", error);
    renderBootError("控制台启动失败", detail);
  });
