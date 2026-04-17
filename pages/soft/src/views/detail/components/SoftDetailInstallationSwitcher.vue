<template>
  <section class="installation-switcher">
    <header class="switcher-header">
      <div>
        <h3>服务实例</h3>
        <p>
          同一软件的不同服务器、不同端口和不同服务实例都会独立展示，切换后下方信息同步联动
        </p>
      </div>
      <div class="switcher-header__actions">
        <span>{{ relatedInstallations.length }} 个实例</span>
        <ScSelect
          v-model="instanceViewModeValue"
          :options="instanceViewModeOptions"
          layout="pill"
          class="instance-mode-select"
        >
          <template #pill="{ item, selected }">
            <button
              type="button"
              class="instance-mode-pill"
              :class="{ 'is-selected': selected }"
            >
              <IconifyIconOnline
                :icon="String(item.icon || 'ri:layout-grid-line')"
              />
              <span>{{ item.label }}</span>
            </button>
          </template>
        </ScSelect>
      </div>
    </header>

    <div
      v-if="relatedInstallations.length && instanceViewModeValue === 'cards'"
      class="installation-card-grid"
    >
      <button
        v-for="item in relatedInstallations"
        :key="item.uniqueKey"
        type="button"
        class="installation-card"
        :class="{
          'is-active': item.softInstallationId === selectedInstallationIdValue,
        }"
        @click="selectedInstallationIdValue = item.softInstallationId || undefined"
      >
        <div class="installation-card__header">
          <div>
            <strong>{{ item.installationName || item.targetDisplay }}</strong>
            <p>{{ item.targetDisplay }}</p>
          </div>
          <SoftStatusTag :status="item.runtimeStatus || item.installStatus" />
        </div>
        <div class="installation-card__meta">
          <span>
            <IconifyIconOnline icon="ri:earth-line" />
            {{ item.connectionText || item.targetDisplay }}
          </span>
          <span>
            <IconifyIconOnline icon="ri:settings-3-line" />
            {{ item.serviceName || "未配置服务名" }}
          </span>
          <span>
            <IconifyIconOnline icon="ri:folder-2-line" />
            {{ item.installPath || "-" }}
          </span>
        </div>
      </button>
    </div>

    <ScSelect
      v-else-if="relatedInstallations.length"
      v-model="selectedInstallationIdValue"
      placeholder="选择服务实例"
      :options="installationOptions"
      layout="dropdown"
      class="installation-switcher__select"
      dropdown-title="选择服务实例"
      dropdown-placeholder="搜索实例名称、服务器、服务名或路径"
      dropdown-icon="ri:server-line"
      :dropdown-col="1"
      display-mode="normal"
    >
      <template #content="{ option }">
        <div class="installation-option">
          <div class="installation-option__title">
            <strong>{{ option.label }}</strong>
            <SoftStatusTag
              :status="
                String(option.runtimeStatus || option.installStatus || 'UNKNOWN')
              "
            />
          </div>
          <div class="installation-option__meta">
            <span>{{ option.connectionText || option.targetName || "-" }}</span>
            <span>{{ option.platformText || "-" }}</span>
            <span>{{ option.installPath || "-" }}</span>
          </div>
        </div>
      </template>
    </ScSelect>

    <el-empty v-else description="当前软件还没有安装实例" />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import SoftStatusTag from "../../../components/SoftStatusTag.vue";

type InstanceViewMode = "cards" | "list";

type ResolvedInstallation = {
  softInstallationId?: number;
  installationName?: string;
  targetDisplay: string;
  runtimeStatus?: string;
  installStatus?: string;
  connectionText?: string;
  serviceName?: string;
  installPath?: string;
  uniqueKey: string;
};

type InstallationOption = {
  value: number;
  label: string;
  targetName?: string;
  installPath?: string;
  installStatus?: string;
  runtimeStatus?: string;
  platformText?: string;
  connectionText?: string;
};

type InstanceViewModeOption = {
  icon?: string;
  label: string;
  value: InstanceViewMode;
};

const props = defineProps<{
  installationOptions: InstallationOption[];
  instanceViewMode: InstanceViewMode;
  instanceViewModeOptions: InstanceViewModeOption[];
  relatedInstallations: ResolvedInstallation[];
  selectedInstallationId?: number;
}>();

const emit = defineEmits<{
  (event: "update:instanceViewMode", value: InstanceViewMode): void;
  (event: "update:selectedInstallationId", value?: number): void;
}>();

const instanceViewModeValue = computed({
  get: () => props.instanceViewMode,
  set: (value) => emit("update:instanceViewMode", value),
});

const selectedInstallationIdValue = computed({
  get: () => props.selectedInstallationId,
  set: (value) => emit("update:selectedInstallationId", value),
});
</script>

<style scoped lang="scss">
.installation-switcher {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.97),
    rgba(241, 245, 249, 0.9)
  );
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.06);
}

.switcher-header,
.switcher-header__actions,
.installation-option__title,
.installation-option__meta,
.installation-card__header,
.installation-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.switcher-header h3 {
  margin: 0;
  color: #0f172a;
}

.switcher-header p,
.switcher-header span,
.installation-option__meta,
.installation-option__meta span,
.installation-card__header p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.switcher-header span {
  font-size: 12px;
}

.switcher-header__actions {
  justify-content: flex-end;
}

.installation-switcher__select {
  width: 100%;
}

.instance-mode-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #475569;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.instance-mode-pill.is-selected {
  border-color: rgba(14, 165, 233, 0.34);
  background: rgba(224, 242, 254, 0.92);
  color: #0f172a;
  box-shadow: 0 10px 18px rgba(14, 165, 233, 0.12);
}

.installation-card-grid {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.installation-card {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.installation-card:hover,
.installation-card.is-active {
  border-color: rgba(14, 165, 233, 0.28);
  box-shadow: 0 18px 30px rgba(14, 165, 233, 0.12);
  transform: translateY(-2px);
}

.installation-card__header,
.installation-card__meta {
  align-items: flex-start;
}

.installation-card__header strong,
.installation-option__title strong {
  color: #0f172a;
}

.installation-card__header p {
  margin-top: 4px;
}

.installation-card__meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #334155;
  font-size: 12px;
}

.installation-option {
  display: grid;
  gap: 8px;
}
</style>
