<template>
  <el-tag
    :type="type"
    :size="size"
    :effect="effect"
    :round="round"
    :closable="closable"
    :disable-transitions="true"
    @close="$emit('close', $event)"
    class="re-tag"
    :class="`re-tag--${type}`"
  >
    <slot />
  </el-tag>
</template>

<script setup lang="ts">
defineProps({
  type: { type: String, default: 'info' },
  size: { type: String, default: 'default' },
  effect: { type: String, default: 'light' },
  round: { type: Boolean, default: true },
  closable: { type: Boolean, default: false },
})

defineEmits(['close'])
</script>

<style scoped>
.re-tag {
  border-radius: 6px;
  font-weight: 500;
  letter-spacing: 0.01em;
  border: none;
  padding: 0 10px;
  height: 24px;
  line-height: 22px;
}

.re-tag--primary {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  color: #667eea;
}

.re-tag--success {
  background: linear-gradient(135deg, rgba(17, 153, 142, 0.15) 0%, rgba(56, 239, 125, 0.15) 100%);
  color: #11998e;
}

.re-tag--warning {
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.15) 0%, rgba(245, 87, 108, 0.15) 100%);
  color: #f5576c;
}

.re-tag--danger {
  background: linear-gradient(135deg, rgba(235, 51, 73, 0.15) 0%, rgba(244, 92, 67, 0.15) 100%);
  color: #eb3349;
}

.re-tag--info {
  background: #f1f5f9;
  color: #64748b;
}
</style>
