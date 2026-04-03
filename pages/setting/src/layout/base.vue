<script>
import {
  FRONTEND_DEBUG_CONFIG_KEYS,
  FRONTEND_FONT_CONFIG_KEYS,
  FRONTEND_THEME_CONFIG_KEYS,
  transformI18n,
} from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon";
import { fetchListDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { defineAsyncComponent, defineComponent } from "vue";

import { fetchSetting, fetchUpdateBatchSetting } from "../api";

const ScInput = defineAsyncComponent(
  () => import("@repo/components/ScInput/index.vue"),
);
const draggable = defineAsyncComponent(() => import("vuedraggable"));

const FRONTEND_STATIC_CONFIG_KEYS = new Set([
  ...FRONTEND_THEME_CONFIG_KEYS,
  ...FRONTEND_DEBUG_CONFIG_KEYS,
  ...FRONTEND_FONT_CONFIG_KEYS,
]);

const BOOLEAN_TYPE = "Boolean";

export default defineComponent({
  name: "RemoteSettingDrawer",
  components: { draggable, ScInput },
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      form: {},
      loading: false,
      layoutLoading: false,
      groupList: [],
      select: {},
    };
  },
  watch: {
    data: {
      immediate: true,
      deep: true,
      handler(data) {
        this.loadData(data);
      },
    },
  },
  computed: {
    editableCount() {
      return this.groupList.filter((item) => !this.isReadOnlySetting(item))
        .length;
    },
    isConfigGroup() {
      return this.form.group === "config";
    },
  },
  methods: {
    resetState() {
      this.loading = false;
      this.layoutLoading = false;
      this.form = {};
      this.groupList = [];
    },
    filterGroupSettings(list = [], group = "") {
      return list.filter((item) => {
        if (item.sysSettingGroup !== group) {
          return false;
        }

        if (group !== "config") {
          return true;
        }

        return !FRONTEND_STATIC_CONFIG_KEYS.has(item.sysSettingName);
      });
    },
    close() {
      this.$emit("close");
    },
    async loadData(data) {
      this.resetState();

      if (!data || !data.group) {
        return;
      }

      this.layoutLoading = true;
      this.form = { ...data };

      try {
        const res = await fetchSetting(data.group);
        if (!res?.data) {
          message("获取配置失败，数据格式异常", { type: "error" });
          return;
        }

        const filteredData = this.filterGroupSettings(res.data, data.group);
        this.groupList = filteredData;
        await this.primeDictOptions(filteredData);

        if (filteredData.length === 0) {
          message("该分组暂无配置项", { type: "warning" });
        }
      } catch (error) {
        console.error("获取配置失败:", error);
        message("获取配置失败，请检查网络连接", { type: "error" });
      } finally {
        this.layoutLoading = false;
      }
    },
    async primeDictOptions(list = []) {
      const dictItems = list.filter(
        (item) =>
          item.sysSettingValueType === "Dict" &&
          item.sysSettingConfig &&
          !this.select[item.sysSettingName],
      );

      await Promise.all(
        dictItems.map((item) => this.queryDict(item).catch(() => undefined)),
      );
    },
    async queryDict(item) {
      if (!item?.sysSettingConfig) {
        return [];
      }

      const { data } = await fetchListDictItem({
        sysDictId: item.sysSettingConfig,
      });
      this.select[item.sysSettingName] = data;
      return data;
    },
    async submit() {
      if (!this.groupList.length) {
        message("当前分组暂无可更新配置", { type: "warning" });
        return;
      }

      this.loading = true;
      const res = await fetchUpdateBatchSetting(this.groupList);
      if (res.code == "00000") {
        this.$emit("success", this.groupList);
        message(transformI18n("message.updateSuccess"), { type: "success" });
      } else {
        message(res.msg, { type: "error" });
      }
      this.loading = false;
    },
    async handleChange() {
      for (let index = 0; index < this.groupList.length; index++) {
        this.groupList[index].sysSettingSort = index;
      }
    },
    isBooleanSetting(item) {
      return item?.sysSettingValueType === BOOLEAN_TYPE;
    },
    getBooleanValue(item) {
      return String(item?.sysSettingValue) === "true";
    },
    handleBooleanSwitch(item, value) {
      item.sysSettingValue = value ? "true" : "false";
    },
    isReadOnlySetting(item) {
      return (
        item?.sysSettingAppInner === 1 ||
        item?.sysSettingAppInner === "1" ||
        item?.sysSettingAppInner === true ||
        item?.sysSettingAppInner === "true"
      );
    },
    resolveItemTitle(item) {
      return item?.sysSettingRemark || item?.sysSettingName || "未命名配置";
    },
    resolveItemDescription(item) {
      if (
        item?.sysSettingRemark &&
        item?.sysSettingRemark !== item?.sysSettingName
      ) {
        return item.sysSettingName;
      }

      return `配置键：${item?.sysSettingName || "-"}`;
    },
    resolveTypeLabel(item) {
      return item?.sysSettingValueType || "String";
    },
  },
});
</script>

<template>
  <div class="remote-setting-root">
    <div class="remote-setting-shell">
      <section class="remote-setting-hero">
        <div>
          <span class="remote-setting-hero__eyebrow">远程组配置抽屉</span>
          <h2 class="remote-setting-hero__title">
            {{ form.name || "远程配置" }}
          </h2>
          <p class="remote-setting-hero__desc">
            {{
              form.description ||
              "当前分组配置来自真实后端接口，可直接编辑并提交更新。"
            }}
          </p>
        </div>
        <div class="remote-setting-hero__stats">
          <div class="hero-stat">
            <span class="hero-stat__label">配置项数量</span>
            <strong class="hero-stat__value">{{ groupList.length }}</strong>
          </div>
          <div class="hero-stat">
            <span class="hero-stat__label">可编辑项</span>
            <strong class="hero-stat__value">{{ editableCount }}</strong>
          </div>
        </div>
      </section>

      <div v-if="isConfigGroup" class="remote-setting-note">
        当前 `config`
        组已前端过滤前端静态配置键，避免与固定组“前端静态配置”重复。
      </div>

      <div v-if="layoutLoading" class="loading-container">
        <el-skeleton :rows="8" animated />
      </div>

      <div v-else-if="groupList.length === 0" class="empty-container">
        <ScEmpty description="该分组暂无配置项">
          <ScButton type="primary" @click="close">返回</ScButton>
        </ScEmpty>
      </div>

      <template v-else>
        <draggable
          v-model="groupList"
          item-key="sysSettingId"
          handle=".drag-indicator"
          class="setting-item-list"
          @end="handleChange"
        >
          <template #item="{ element }">
            <div
              class="setting-item-card"
              :class="{ 'is-readonly': isReadOnlySetting(element) }"
            >
              <div class="setting-item-card__accent" />

              <div class="setting-item-card__header">
                <div class="setting-item-card__title-wrap">
                  <div class="setting-item-card__icon">
                    <IconifyIconOnline
                      :icon="
                        isBooleanSetting(element)
                          ? 'ri:toggle-line'
                          : 'ri:settings-4-line'
                      "
                    />
                  </div>
                  <div>
                    <div class="setting-item-card__title">
                      {{ resolveItemTitle(element) }}
                    </div>
                    <div class="setting-item-card__key">
                      {{ element.sysSettingName }}
                    </div>
                  </div>
                </div>

                <div class="setting-item-card__badges">
                  <ScTag size="small">{{ resolveTypeLabel(element) }}</ScTag>
                  <ScTag
                    v-if="isReadOnlySetting(element)"
                    type="info"
                    size="small"
                  >
                    内置只读
                  </ScTag>
                </div>
              </div>

              <p class="setting-item-card__desc">
                {{ resolveItemDescription(element) }}
              </p>

              <div class="setting-item-card__editor">
                <ScSwitch
                  v-if="isBooleanSetting(element)"
                  :model-value="getBooleanValue(element)"
                  layout="visual-card"
                  wide
                  :disabled="isReadOnlySetting(element)"
                  :label="resolveItemTitle(element)"
                  :description="resolveItemDescription(element)"
                  :ribbon-text="getBooleanValue(element) ? '开启' : '关闭'"
                  @update:model-value="handleBooleanSwitch(element, $event)"
                />

                <div v-else class="setting-field-panel">
                  <sc-input
                    v-if="element.sysSettingValueType == 'Number'"
                    v-model="element.sysSettingValue"
                    type="number"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                  <sc-input
                    v-else-if="element.sysSettingValueType == 'Array'"
                    v-model="element.sysSettingValue"
                    type="array"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                  <sc-input
                    v-else-if="element.sysSettingValueType == 'List'"
                    v-model="element.sysSettingValue"
                    type="list"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                  <sc-input
                    v-else-if="element.sysSettingValueType == 'Dict'"
                    v-model="element.sysSettingValue"
                    type="dict"
                    :options="select[element.sysSettingName]"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                  <sc-input
                    v-else-if="element.sysSettingValueType == 'Color'"
                    v-model="element.sysSettingValue"
                    type="color"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                  <sc-input
                    v-else-if="element.sysSettingValueType == 'Mail'"
                    v-model="element.sysSettingValue"
                    type="email"
                    placeholder="请输入邮箱"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                  <sc-input
                    v-else-if="
                      element.sysSettingValueType == 'Password' ||
                      element.sysSettingValueType == 'AppSecret'
                    "
                    v-model="element.sysSettingValue"
                    type="password"
                    :placeholder="`请输入${resolveItemTitle(element)}`"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                  <sc-input
                    v-else-if="element.sysSettingValueType == 'TextArea'"
                    v-model="element.sysSettingValue"
                    type="textarea"
                    :placeholder="`请输入${resolveItemTitle(element)}`"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                  <sc-input
                    v-else
                    v-model="element.sysSettingValue"
                    type="text"
                    :placeholder="`请输入${resolveItemTitle(element)}`"
                    :disabled="isReadOnlySetting(element)"
                    :readonly="isReadOnlySetting(element)"
                  />
                </div>
              </div>

              <div class="setting-item-card__footer">
                <div class="drag-indicator">
                  <IconifyIconOnline icon="ri:draggable" />
                  <span>拖拽排序</span>
                </div>
                <span class="setting-item-card__sort">
                  顺序 {{ element.sysSettingSort ?? "-" }}
                </span>
              </div>
            </div>
          </template>
        </draggable>

        <div class="remote-setting-actions">
          <div class="remote-setting-actions__summary">
            <span class="remote-setting-actions__eyebrow">更新区</span>
            <strong class="remote-setting-actions__title">远程配置保存</strong>
            <p class="remote-setting-actions__desc">
              当前抽屉编辑的是后端分组参数，点击更新后会调用真实批量更新接口。
            </p>
          </div>
          <ScButton
            :icon="useRenderIcon('ri:save-2-fill')"
            type="primary"
            :loading="loading"
            @click="submit"
          >
            {{ $t("buttons.update") }}
          </ScButton>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.remote-setting-root {
  display: flex;
  flex-direction: column;
}

:deep(.el-drawer) {
  .el-drawer__header {
    margin: 0;
    padding: 20px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      var(--el-bg-color-overlay) 100%
    );
  }

  .el-drawer__body {
    padding: 0;
    background:
      radial-gradient(
        circle at top left,
        rgba(var(--el-color-primary-rgb), 0.08),
        transparent 24%
      ),
      linear-gradient(
        180deg,
        var(--el-bg-color) 0%,
        color-mix(in srgb, var(--el-fill-color-lighter) 82%, transparent) 100%
      );
  }
}

.remote-setting-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
  padding: 22px;
  overflow-y: auto;
}

.remote-setting-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 68%, transparent);
  border-radius: 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.9) 56%,
    rgba(var(--el-color-primary-rgb), 0.08) 100%
  );
  box-shadow:
    0 22px 42px -34px rgba(15, 23, 42, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.remote-setting-hero__eyebrow,
.remote-setting-actions__eyebrow {
  display: inline-flex;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--el-color-primary) 74%, #46546b 26%);
}

.remote-setting-hero__title {
  margin: 0 0 8px;
  font-size: 28px;
  line-height: 1.15;
  color: var(--el-text-color-primary);
}

.remote-setting-hero__desc,
.remote-setting-actions__desc,
.setting-item-card__desc,
.setting-item-card__key {
  margin: 0;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.remote-setting-hero__stats {
  display: grid;
  min-width: 200px;
  gap: 12px;
}

.hero-stat {
  padding: 14px 16px;
  border: 1px solid rgba(var(--el-color-primary-rgb), 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 14px 26px -28px rgba(15, 23, 42, 0.4);
}

.hero-stat__label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.hero-stat__value {
  font-size: 20px;
  color: var(--el-text-color-primary);
}

.remote-setting-note {
  padding: 12px 16px;
  border: 1px solid rgba(var(--el-color-warning-rgb), 0.18);
  border-radius: 16px;
  background: rgba(var(--el-color-warning-rgb), 0.08);
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.loading-container,
.empty-container {
  padding: 24px;
  border-radius: 22px;
  border: 1px solid var(--el-border-color-lighter);
  background: rgba(255, 255, 255, 0.84);
}

.empty-container {
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-item-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item-card {
  position: relative;
  overflow: hidden;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.92) 100%
  );
  box-shadow:
    0 20px 38px -34px rgba(15, 23, 42, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.setting-item-card.is-readonly {
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.95) 0%,
    rgba(241, 245, 249, 0.94) 100%
  );
}

.setting-item-card__accent {
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(
    90deg,
    rgba(var(--el-color-primary-rgb), 0.36) 0%,
    rgba(15, 118, 110, 0.3) 50%,
    rgba(var(--el-color-primary-rgb), 0.12) 100%
  );
}

.setting-item-card__header,
.setting-item-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.setting-item-card__title-wrap,
.drag-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-item-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: rgba(var(--el-color-primary-rgb), 0.1);
  color: var(--el-color-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.setting-item-card__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.setting-item-card__key {
  font-size: 12px;
}

.setting-item-card__badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.setting-item-card__desc {
  margin-top: 12px;
  font-size: 13px;
}

.setting-item-card__editor {
  margin-top: 16px;
}

.setting-field-panel {
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.94),
    0 12px 24px -28px rgba(15, 23, 42, 0.32);
}

.setting-item-card__footer {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid
    color-mix(in srgb, var(--el-border-color) 78%, transparent);
}

.drag-indicator {
  cursor: move;
  color: var(--el-text-color-secondary);
}

.setting-item-card__sort {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.remote-setting-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 22px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.88) 72%,
    rgba(var(--el-color-primary-rgb), 0.05) 100%
  );
  box-shadow:
    0 20px 36px -34px rgba(15, 23, 42, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.remote-setting-actions__summary {
  max-width: 480px;
}

.remote-setting-actions__title {
  display: block;
  margin-bottom: 6px;
  color: var(--el-text-color-primary);
  font-size: 18px;
}

@media (max-width: 960px) {
  .remote-setting-shell {
    padding: 14px;
  }

  .remote-setting-hero,
  .remote-setting-actions,
  .setting-item-card__header,
  .setting-item-card__footer {
    flex-direction: column;
    align-items: flex-start;
  }

  .remote-setting-hero__stats,
  .remote-setting-actions__summary {
    width: 100%;
    min-width: 0;
    max-width: none;
  }

  .setting-item-card__badges {
    justify-content: flex-start;
  }

  .remote-setting-actions {
    :deep(.el-button) {
      width: 100%;
    }
  }
}
</style>
