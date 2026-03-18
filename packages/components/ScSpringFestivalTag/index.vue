<template>
  <span class="sc-spring-festival-tag" :class="[`is-${type}`, { 'is-closable': closable }]">
    <span class="tag-content">
      <slot />
    </span>
    <span v-if="closable" class="tag-close" @click="handleClose">
      <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
        />
      </svg>
    </span>
  </span>
</template>

<script setup lang="ts">
interface Props {
  type?: "primary" | "success" | "warning" | "danger" | "info";
  closable?: boolean;
}

interface Emits {
  (e: "close"): void;
}

withDefaults(defineProps<Props>(), {
  type: "primary",
  closable: false
});

const emit = defineEmits<Emits>();

const handleClose = () => {
  emit("close");
};
</script>

<style scoped lang="scss">
.sc-spring-festival-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs, 4px);
  padding: var(--spacing-xs, 4px) var(--spacing-sm, 8px);
  border-radius: var(--radius-full, 9999px);
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  transition: all var(--transition-fast, 0.2s);

  .tag-content {
    flex: 1;
  }

  .tag-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    cursor: pointer;
    border-radius: 50%;
    transition: all var(--transition-fast, 0.2s);

    svg {
      width: 10px;
      height: 10px;
      fill: currentColor;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  }

  &.is-primary {
    background: linear-gradient(135deg, #dc143c 0%, #ff4500 100%);
    color: #fff;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }

  &.is-success {
    background: linear-gradient(135deg, #ff4500 0%, #ffd700 100%);
    color: #8b0000;
    border: 1px solid rgba(220, 20, 60, 0.3);
  }

  &.is-warning {
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    color: #8b4513;
    border: 1px solid rgba(220, 20, 60, 0.2);
  }

  &.is-danger {
    background: linear-gradient(135deg, #8b0000 0%, #dc143c 100%);
    color: #ffd700;
    border: 1px solid rgba(255, 215, 0, 0.4);
  }

  &.is-info {
    background: linear-gradient(135deg, #dc143c 0%, #8b0000 100%);
    color: #ffd700;
    border: 1px solid rgba(255, 215, 0, 0.3);
  }

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(220, 20, 60, 0.3);
  }
}

html.dark .sc-spring-festival-tag {
  &.is-primary {
    border-color: rgba(255, 215, 0, 0.4);
  }

  &.is-success {
    border-color: rgba(220, 20, 60, 0.4);
  }

  &.is-warning {
    border-color: rgba(220, 20, 60, 0.3);
  }

  &.is-danger {
    border-color: rgba(255, 215, 0, 0.5);
  }

  &.is-info {
    border-color: rgba(255, 215, 0, 0.4);
  }
}
</style>
