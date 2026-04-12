<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="context-menu"
      :style="{ left: `${x}px`, top: `${y}px` }"
    >
      <template v-for="item in normalizedItems" :key="item.key">
        <div v-if="item.divider" class="menu-divider" />
        <div
          v-else
          class="menu-entry"
          :class="{ 'menu-entry--has-children': item.children?.length }"
        >
          <button
            type="button"
            class="menu-item"
            :class="{ danger: item.danger, disabled: item.disabled }"
            :disabled="item.disabled"
            @click="handleSelect(item)"
          >
            <span>{{ item.label }}</span>
            <span v-if="item.children?.length" class="menu-item__arrow">›</span>
          </button>

          <div v-if="item.children?.length" class="context-submenu">
            <template v-for="child in item.children" :key="child.key">
              <div v-if="child.divider" class="menu-divider" />
              <button
                v-else
                type="button"
                class="menu-item"
                :class="{ danger: child.danger, disabled: child.disabled }"
                :disabled="child.disabled"
                @click="handleSelect(child)"
              >
                <span>{{ child.label }}</span>
              </button>
            </template>
          </div>
        </div>
      </template>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";

export type PanelContextMenuItem = {
  children?: PanelContextMenuItem[];
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
  key: string;
  label: string;
};

const props = defineProps<{
  items: PanelContextMenuItem[];
  visible: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", key: string): void;
}>();

const normalizedItems = computed(() => props.items || []);

const handleSelect = (item: PanelContextMenuItem) => {
  if (item.disabled || item.children?.length) {
    return;
  }
  emit("select", item.key);
  emit("close");
};

const handleGlobalClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest(".context-menu")) {
    return;
  }
  emit("close");
};

onMounted(() => {
  document.addEventListener("mousedown", handleGlobalClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleGlobalClick);
});
</script>

<style scoped lang="scss">
.context-menu {
  position: fixed;
  z-index: 40;
  display: grid;
  gap: 1px;
  min-width: 144px;
  padding: 4px;
  border: 1px solid rgba(112, 136, 151, 0.18);
  border-radius: 10px;
  background: rgba(250, 252, 255, 0.98);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
}

.menu-entry {
  position: relative;
}

.menu-entry--has-children:hover > .context-submenu {
  display: grid;
}

.menu-divider {
  height: 1px;
  margin: 4px 2px;
  background: rgba(112, 136, 151, 0.16);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 7px 9px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #173246;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.menu-item:hover {
  background: rgba(37, 99, 235, 0.08);
}

.menu-item.danger {
  color: #b53838;
}

.menu-item.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.menu-item.disabled:hover {
  background: transparent;
}

.menu-item__arrow {
  color: #7a8f9e;
  font-size: 12px;
  line-height: 1;
}

.context-submenu {
  position: absolute;
  top: -4px;
  left: calc(100% - 4px);
  z-index: 41;
  display: none;
  gap: 1px;
  min-width: 136px;
  padding: 4px;
  border: 1px solid rgba(112, 136, 151, 0.18);
  border-radius: 10px;
  background: rgba(250, 252, 255, 0.98);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.14);
}
</style>
