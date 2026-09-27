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
import { install as ReButtonInstall } from "@repo/ui/re-button";
import { install as ReInputInstall } from "@repo/ui/re-input";
import { install as ReInputNumberInstall } from "@repo/ui/re-input-number";
import { install as ReSelectInstall } from "@repo/ui/re-select";
import { install as ReDatePickerInstall } from "@repo/ui/re-date-picker";
import { install as ReSwitchInstall } from "@repo/ui/re-switch";
import { install as ReDialogInstall } from "@repo/ui/re-dialog";
import { install as ReTagInstall } from "@repo/ui/re-tag";
import { install as ReBadgeInstall } from "@repo/ui/re-badge";
import { install as RePaginationInstall } from "@repo/ui/re-pagination";
import { install as ReFormInstall } from "@repo/ui/re-form";
import { install as ReEmptyInstall } from "@repo/ui/re-empty";
import { install as ReSkeletonInstall } from "@repo/ui/re-skeleton";
import { install as ReTableInstall } from "@repo/ui/re-table";
import { install as ReSearchInstall } from "@repo/ui/re-search";
import { install as ReIconSelectInstall } from "@repo/ui/re-icon-select";
import { install as ReIpTextInstall } from "@repo/ui/re-ip-text";
import { systemMenus, systemRoutes } from "@pages/system";
import { getActiveAnnouncements, markAnnouncementRead } from "@pages/system/api/announcementApi";
import "@pages/filesystem";
import "@pages/job";
import "@pages/task";

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
registerStaticMenu(systemMenus);

createContextApp({
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
  .routes(systemRoutes as never)
  .use([
    ReButtonInstall,
    ReInputInstall,
    ReInputNumberInstall,
    ReSelectInstall,
    ReDatePickerInstall,
    ReSwitchInstall,
    ReDialogInstall,
    ReTagInstall,
    ReBadgeInstall,
    RePaginationInstall,
    ReFormInstall,
    ReEmptyInstall,
    ReSkeletonInstall,
    ReTableInstall,
    ReSearchInstall,
    ReIconSelectInstall,
    ReIpTextInstall,
  ])
  .mount("#app");
