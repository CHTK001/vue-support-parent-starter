/**
 * 把「AI 状态徽标」挂到 koi 布局的顶栏扩展槽（#koi-header-extra）。
 *
 * <p><b>为什么用独立小应用。</b>布局是共享包（packages/theme）的组件，本应用没有
 * 它的插槽 control；框架为该场景预留了 DOM 扩展槽
 * {@code <div id="koi-header-extra">}（见 koi ReToolbar.vue 顶部注释）。
 * 徽标只依赖 @repo/utils 的 http 与 @repo/core 的全局 router（都是模块单例），
 * 不需要宿主的 provide/inject，因此用一个独立 Vue 应用挂载即可 ——
 * 不改共享布局，也不影响其它接入应用。</p>
 *
 * <p><b>为什么挂载后要"搬家"。</b>登录页没有后台布局，槽位不存在；登录成功后
 * 布局才渲染出来。所以先挂到 body，再在路由切换后把宿主节点移进槽位
 * （幂等：已经在目标里就跳过）。退出登录时布局卸载，宿主节点随之移除，
 * 再次登录会重新插入。</p>
 */
import { createApp } from "vue";
import { getRouter } from "@repo/core";
import AiHeaderBadge from "@pages/eduai/components/ai/AiHeaderBadge.vue";

/** 槽位选择器（与 koi ReToolbar.vue 保持一致） */
const HEADER_SLOT_ID = "koi-header-extra";

/**
 * 挂载 AI 状态徽标。
 *
 * <p>需在 {@code createContextApp(...).mount()} 之后调用：此时全局 router 已就绪，
 * 且后续路由切换能触发搬迁。</p>
 */
export function mountAiHeaderBadge(): void {
  if (document.getElementById("eduai-ai-header-badge-host")) {
    return;
  }

  const host = document.createElement("div");
  host.id = "eduai-ai-header-badge-host";
  // 未进入顶栏槽位前先隐藏：登录页没有后台布局，否则徽标会浮在页面最底部
  host.style.display = "none";
  document.body.appendChild(host);

  const badge = createApp(AiHeaderBadge).mount(host) as unknown as { refresh?: () => Promise<void> };

  const attach = (): void => {
    const slot = document.getElementById(HEADER_SLOT_ID);
    const alreadyInSlot = slot && host.parentElement === slot;
    if (slot && !alreadyInSlot) {
      slot.appendChild(host);
    }
    // 进槽位后交给槽位的 flex 排布（宿主本身不产生盒子）
    host.style.display = slot && host.parentElement === slot ? "contents" : "none";
    // 登录页没有布局、也没有令牌；首次进入后台布局时补一次探测，
    // 否则徽标会一直停在「AI 能力探测失败」直到下一次轮询。
    if (slot && !alreadyInSlot) {
      void badge.refresh?.();
    }
  };

  attach();
  getRouter().afterEach(() => {
    // 等布局把这一帧渲染完再找槽位
    requestAnimationFrame(attach);
  });
}
