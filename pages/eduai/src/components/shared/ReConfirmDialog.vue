<script setup lang="ts">
/**
 * ReConfirmDialog —— 统一确认弹窗（ReDialog 实现）
 *
 * 替代 Element Plus 原生 ElMessageBox.confirm：
 * 原生消息框 teleport 到 body 且层级独立，与老师端全屏覆盖层
 * 并存时互相遮挡、破坏布局；本组件走 ReDialog，
 * 主题与层级与老师端一致（需求 5：老师端弹窗统一 ReDialog）。
 *
 * 用法（命令式）：
 *   const confirmDialog = ref<InstanceType<typeof ReConfirmDialog>>();
 *   if (await confirmDialog.value?.open('确定删除吗？', { title: '删除确认', danger: true })) { ... }
 *
 * open 返回 Promise<boolean>：点确定 resolve(true)；取消/关闭 resolve(false)。
 */
import { ref, watch } from 'vue';
import ReDialog from '@repo/ui/re-dialog';

const visible = ref(false);
const title = ref('确认');
const message = ref('');
const danger = ref(false);
let resolver: ((v: boolean) => void) | null = null;

/**
 * 打开确认弹窗
 *
 * @param msg   提示文案
 * @param opts  标题 / 危险态（危险=删除类操作，主按钮变红）
 * @returns 点确定 true；取消或关闭 false
 */
function open(
  msg: string,
  opts?: { title?: string; danger?: boolean },
): Promise<boolean> {
  message.value = msg;
  title.value = opts?.title ?? '确认';
  danger.value = opts?.danger ?? false;
  visible.value = true;
  return new Promise<boolean>((resolve) => {
    resolver = resolve;
  });
}

/** 关闭并回传结果（幂等：第二次调用无 pending Promise 直接返回） */
function done(v: boolean): void {
  visible.value = false;
  resolver?.(v);
  resolver = null;
}

/** 任何原因导致弹窗关闭（右上角 × / ESC）都按取消处理 */
watch(visible, (v) => {
  if (!v) done(false);
});

defineExpose({ open });
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="title"
    width="420px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <p class="rc-body">{{ message }}</p>
    <template #footer>
      <el-button @click="done(false)">取消</el-button>
      <el-button :type="danger ? 'danger' : 'primary'" @click="done(true)">
        确定
      </el-button>
    </template>
  </ReDialog>
</template>

<style scoped>
.rc-body {
  margin: 0;
  padding: 8px 2px;
  line-height: 1.6;
  word-break: break-word;
}
</style>
