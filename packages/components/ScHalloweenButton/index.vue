<template>
  <button
    class="sc-halloween-button"
    :class="[`sc-halloween-button--${type}`, { 'is-disabled': disabled }]"
    :disabled="disabled"
    @click="handleClick"
  >
    <span class="halloween-button-glow"></span>
    <span class="halloween-button-content">
      <slot></slot>
    </span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  type?: "primary" | "success" | "warning";
  disabled?: boolean;
}>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const handleClick = (event: MouseEvent) => {
  if (!props.disabled) {
    emit("click", event);
  }
};
</script>

<style scoped>
.sc-halloween-button {
  position: relative;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  color: #fff;
}

.sc-halloween-button--primary {
  background: linear-gradient(135deg, #ff6b35 0%, #ff8555 100%);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.sc-halloween-button--primary:hover:not(.is-disabled) {
  background: linear-gradient(135deg, #ff8555 0%, #ff9f75 100%);
  box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
  transform: translateY(-2px);
}

.sc-halloween-button--success {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.sc-halloween-button--success:hover:not(.is-disabled) {
  background: linear-gradient(135deg, #a569c6 0%, #9e54bd 100%);
  box-shadow: 0 6px 16px rgba(155, 89, 182, 0.4);
  transform: translateY(-2px);
}

.sc-halloween-button--warning {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);
}

.sc-halloween-button--warning:hover:not(.is-disabled) {
  background: linear-gradient(135deg, #f5ab35 0%, #f08d35 100%);
  box-shadow: 0 6px 16px rgba(243, 156, 18, 0.4);
  transform: translateY(-2px);
}

.sc-halloween-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 发光效果 */
.halloween-button-glow {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s ease;
}

.sc-halloween-button:hover:not(.is-disabled) .halloween-button-glow {
  left: 100%;
}

.halloween-button-content {
  position: relative;
  z-index: 1;
}
</style>
