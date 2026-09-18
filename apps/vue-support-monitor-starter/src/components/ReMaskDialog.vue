<template>
  <Teleport to="body">
    <Transition name="mask-fade">
      <div v-if="modelValue" class="rmd-mask" @click.self="onMaskClick">
        <div class="rmd-dialog" :style="{ width: width }">
          <div class="rmd-header">
            <span class="rmd-title">{{ title }}</span>
            <div class="rmd-actions">
              <slot name="actions" />
              <span v-if="closable" class="rmd-close" @click="close">✕</span>
            </div>
          </div>
          <div class="rmd-body">
            <slot />
          </div>
          <div v-if="$slots.footer" class="rmd-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  title?: string;
  width?: string;
  closable?: boolean;
  closeOnClickMask?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void;
  (e: 'close'): void;
}>();

function close() {
  emit('update:modelValue', false);
  emit('close');
}

function onMaskClick() {
  if (closeOnClickMask) close();
}
</script>

<style scoped>
.rmd-mask {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.rmd-dialog {
  background: #fff; border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  max-height: 85vh; display: flex; flex-direction: column;
  overflow: hidden;
}
.rmd-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #f1f5f9;
}
.rmd-title { font-size: 15px; font-weight: 600; color: #1e293b; }
.rmd-actions { display: flex; align-items: center; gap: 8px; }
.rmd-close { cursor: pointer; color: #94a3b8; font-size: 16px; }
.rmd-close:hover { color: #475569; }
.rmd-body { padding: 18px 20px; overflow-y: auto; flex: 1; }
.rmd-footer {
  padding: 12px 20px; border-top: 1px solid #f1f5f9;
  display: flex; justify-content: flex-end; gap: 8px;
}
.mask-fade-enter-active, .mask-fade-leave-active { transition: opacity 0.2s; }
.mask-fade-enter-from, .mask-fade-leave-to { opacity: 0; }
</style>
