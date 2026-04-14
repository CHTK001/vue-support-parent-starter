<template>
  <ScDrawer
    v-model="visible"
    size="min(90vw, 1440px)"
    destroy-on-close
    append-to-body
    class="server-project-drawer"
    :title="hostName ? `${hostName} · 项目管理` : '项目管理'"
  >
    <section class="server-project-drawer__shell">
      <header class="server-project-drawer__hero">
        <div>
          <p class="server-project-drawer__eyebrow">Project Workspace</p>
          <h3>独立承载项目管理工作台，减少主页面继续堆业务操作</h3>
          <p class="server-project-drawer__hint">
            当前保留 iframe 壳层，后续再逐步替换成真正的内嵌组件化视图。
          </p>
        </div>
      </header>
      <iframe
        v-if="url"
        class="server-project-drawer__frame"
        :src="url"
      />
      <el-empty v-else description="请选择服务器后再打开项目管理" />
    </section>
  </ScDrawer>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: boolean;
  hostName: string;
  url: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});
</script>

<style scoped lang="scss">
.server-project-drawer__shell {
  display: grid;
  gap: 14px;
}

.server-project-drawer__hero {
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 36%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
}

.server-project-drawer__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0284c7;
}

.server-project-drawer__hero h3 {
  margin: 0;
  color: #0f172a;
}

.server-project-drawer__hint {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.server-project-drawer__frame {
  width: 100%;
  height: calc(100vh - 190px);
  border: 0;
  border-radius: 18px;
  background: var(--el-bg-color-page);
}
</style>
