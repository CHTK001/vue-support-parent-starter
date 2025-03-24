<script setup lang="ts">
import { useI18n } from "vue-i18n";
import MenuFold from "@iconify-icons/ri/menu-fold-fill";
import MenuUnfold from "@iconify-icons/ri/menu-unfold-fill";

interface Props {
  isActive: boolean;
}

withDefaults(defineProps<Props>(), {
  isActive: false,
});

const { t } = useI18n();

const emit = defineEmits<{
  (e: "toggleClick"): void;
}>();

const toggleClick = () => {
  emit("toggleClick");
};
</script>

<template>
  <div class="collapse-btn" :class="{ 'is-active': isActive }" :title="isActive ? t('buttons.pureClickCollapse') : t('buttons.pureClickExpand')" @click="toggleClick"><IconifyIconOffline :icon="isActive ? MenuFold : MenuUnfold" class="collapse-icon" />233</div>
</template>

<style lang="scss" scoped>
.collapse-btn {
  padding: 0 16px;
  height: 48px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: var(--el-color-primary);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    &::before {
      opacity: 0.1;
    }

    .collapse-icon {
      transform: scale(1.1);
      color: var(--el-color-primary);
    }
  }

  &:active {
    .collapse-icon {
      transform: scale(0.95);
    }
  }

  .collapse-icon {
    font-size: 20px;
    transition: all 0.3s;
    position: relative;
    z-index: 1;
  }

  &.is-active {
    .collapse-icon {
      transform: rotate(180deg);
    }
  }
}

.dark {
  .collapse-btn {
    &:hover {
      &::before {
        opacity: 0.2;
      }
    }
  }
}
</style>
