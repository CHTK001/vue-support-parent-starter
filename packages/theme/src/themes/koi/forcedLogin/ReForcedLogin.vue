<script setup lang="ts">
/**
 * 强制登录弹窗宿主（@repo/theme/koi）
 *
 * 登录认证形态（login.accessMode = "dialog"）下，@repo/core 的 http 拦截器拦截 401/403
 * 后调用 window.__reForcedLogin.show({ onLogin })，由本宿主渲染一个 ReDialog（koi），
 * 内部挂着 ReLoginForm（forced 模式）——登录成功后 ReLoginForm 回报 success，
 * 把控制权交还给核心。
 *
 *   <ReDialog
 *     v-model="open" title 420px draggable
 *     遮罩/ESC/关闭按钮/最小化/全屏 一律不触发 → 只有登录成功才关
 *   >
 *     <ReLoginForm forced :show-header="false" @success="onSuccess" />
 *   </ReDialog>
 */
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import ReDialog from "@repo/ui/re-dialog";
import ReLoginForm from "../views/login/components/ReLoginForm.vue";
import { unlockForcedLogin } from "../forcedLogin";

interface Props {
  /** 登录成功（ReLoginForm 已完成登录，弹窗已关闭）：核心收回控制权并刷新 */
  onLogin?: () => void;
  /** 弹窗关闭（未登录） */
  onClose?: () => void;
}

const props = defineProps<Props>();

const { t } = useI18n();

/** 弹窗是否打开（v-model 与 ReDialog 联动：默认打开，任何关闭触发器都关不掉） */
const open = ref(true);

/** 登录成功引发的关闭：此时 props.onLogin 已经释放锁并重置了宿主，@closed 到达时不必转发 onClose */
let closedByLogin = false;

/** ReLoginForm 登录成功 → 标注关闭来源，把控制权交还核心 */
function onSuccess(): void {
  closedByLogin = true;
  // 标记关闭来源后先把状态交还给 ReDialog（经过过渡动画）-> @closed 随后到达
  open.value = false;
  props.onLogin?.();
}

/** ReDialog 关闭（全部隐藏）事件 */
function onClosed(): void {
  if (closedByLogin) {
    closedByLogin = false;
    return;
  }
  // 未登录就关闭的兜底：强制登录弹窗已拿到锁，这里只负责松开
  unlockForcedLogin();
  props.onClose?.();
}
</script>

<template>
  <ReDialog
    v-model="open"
    :title="t('menu.login.account')"
    :width="420"
    :draggable="true"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :destroy-on-close="false"
    :show-close="false"
    :show-window-shell="false"
    @closed="onClosed"
  >
    <ReLoginForm :forced="true" :show-header="false" @success="onSuccess" />
  </ReDialog>
</template>
