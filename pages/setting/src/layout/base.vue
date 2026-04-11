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
      searchKeyword: "",
      select: {},
    };
  },
  computed: {
    editableCount() {
      return this.groupList.filter((item) => !this.isReadOnlySetting(item))
        .length;
    },
    filteredGroupList() {
      const keyword = this.normalizeSearchText(this.searchKeyword);
      if (!keyword) {
        return this.groupList;
      }

      return this.groupList.filter((item) =>
        this.buildSearchText(item).includes(keyword),
      );
    },
    hasSearchKeyword() {
      return Boolean(this.normalizeSearchText(this.searchKeyword));
    },
    displayGroupList: {
      get() {
        return this.filteredGroupList;
      },
      set(value) {
        if (!this.hasSearchKeyword) {
          this.groupList = value;
        }
      },
    },
    isConfigGroup() {
      return this.form.group === "config";
    },
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
  methods: {
    resetState() {
      this.loading = false;
      this.layoutLoading = false;
      this.form = {};
      this.groupList = [];
      this.searchKeyword = "";
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
      const payload = this.groupList.map((item) => {
        if (!this.isBooleanSetting(item)) {
          return { ...item };
        }

        return {
          ...item,
          sysSettingValue: this.getBooleanValue(item),
        };
      });
      const res = await fetchUpdateBatchSetting(payload);
      if (res.code == "00000") {
        this.$emit("success", payload);
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
    normalizeSearchText(value) {
      return String(value ?? "")
        .trim()
        .toLowerCase();
    },
    resolveCurrentValuePreview(item) {
      if (item == null || item.sysSettingValue == null) {
        return "";
      }
      if (typeof item.sysSettingValue === "string") {
        return item.sysSettingValue;
      }
      try {
        return JSON.stringify(item.sysSettingValue);
      } catch (error) {
        return String(item.sysSettingValue);
      }
    },
    buildSearchText(item) {
      return this.normalizeSearchText(
        [
          this.resolveItemTitle(item),
          item?.sysSettingName,
          item?.sysSettingRemark,
          this.resolveCurrentValuePreview(item),
        ]
          .filter(Boolean)
          .join(" "),
      );
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
    resolveButtonIcon(icon) {
      return useRenderIcon(icon);
    },
  },
});
</script>

<template>
  <div class="remote-setting-root">
    <div class="remote-setting-shell">
      <section class="remote-setting-hero">
        <div class="remote-setting-hero__main">
          <span class="remote-setting-hero__eyebrow">远程组配置抽屉</span>
          <div class="remote-setting-hero__heading">
            <h2 class="remote-setting-hero__title">
              {{ form.name || "远程配置" }}
            </h2>
            <div class="remote-setting-hero__chips">
              <span class="hero-chip">总数 {{ groupList.length }}</span>
              <span class="hero-chip">可编辑 {{ editableCount }}</span>
              <span v-if="hasSearchKeyword" class="hero-chip hero-chip--accent">
                命中 {{ filteredGroupList.length }}
              </span>
            </div>
          </div>
          <p class="remote-setting-hero__desc">
            {{
              form.description ||
              "当前分组配置来自真实后端接口，可直接编辑并提交更新。"
            }}
          </p>
        </div>
        <div class="remote-setting-hero__search">
          <ScInput
            v-model="searchKeyword"
            clearable
            placeholder="按标题 / 配置键 / 说明 / 当前值过滤"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </ScInput>
          <p class="remote-setting-hero__search-tip">
            输入关键字后仅过滤当前抽屉显示，不改后端接口和保存内容。
          </p>
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
        <div v-if="filteredGroupList.length === 0" class="empty-container">
          <ScEmpty description="没有匹配的配置项">
            <ScButton type="primary" @click="searchKeyword = ''">
              清空过滤
            </ScButton>
          </ScEmpty>
        </div>

        <draggable
          v-else
          v-model="displayGroupList"
          item-key="sysSettingId"
          handle=".drag-indicator"
          class="setting-item-list"
          :class="{ 'is-filtered': hasSearchKeyword }"
          :disabled="hasSearchKeyword"
          @end="handleChange"
        >
          <template #item="{ element }">
            <div
              class="setting-item-card"
              :class="{
                'is-readonly': isReadOnlySetting(element),
                'setting-item-card--boolean': isBooleanSetting(element),
              }"
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
                  class="setting-visual-switch"
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
            :icon="resolveButtonIcon('ri:save-2-fill')"
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
    padding: 14px 18px;
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
  gap: 14px;
  height: 100%;
  padding: 16px;
  overflow-y: auto;
}

.remote-setting-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 68%, transparent);
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.97) 0%,
    rgba(248, 250, 252, 0.94) 56%,
    rgba(var(--el-color-primary-rgb), 0.06) 100%
  );
  box-shadow:
    0 16px 32px -30px rgba(15, 23, 42, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.remote-setting-hero__main {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

.remote-setting-hero__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.remote-setting-hero__eyebrow,
.remote-setting-actions__eyebrow {
  display: inline-flex;
  margin-bottom: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--el-color-primary) 74%, #46546b 26%);
}

.remote-setting-hero__title {
  margin: 0;
  font-size: 19px;
  line-height: 1.2;
  color: var(--el-text-color-primary);
}

.remote-setting-hero__desc,
.remote-setting-actions__desc,
.setting-item-card__desc,
.setting-item-card__key {
  margin: 0;
  line-height: 1.55;
  color: var(--el-text-color-secondary);
}

.remote-setting-hero__desc {
  font-size: 13px;
}

.remote-setting-hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border: 1px solid rgba(191, 219, 254, 0.92);
  border-radius: 999px;
  background: rgba(239, 246, 255, 0.9);
  font-size: 12px;
  font-weight: 600;
  color: #1d4ed8;
}

.hero-chip--accent {
  border-color: rgba(110, 231, 183, 0.9);
  background: rgba(236, 253, 245, 0.95);
  color: #047857;
}

.remote-setting-hero__search {
  display: flex;
  width: min(360px, 100%);
  flex-direction: column;
  gap: 6px;
}

.remote-setting-hero__search-tip {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--el-text-color-secondary);
}

.remote-setting-note {
  padding: 10px 12px;
  border: 1px solid rgba(var(--el-color-warning-rgb), 0.18);
  border-radius: 14px;
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.setting-item-list.is-filtered {
  align-items: start;
}

.setting-item-card {
  position: relative;
  overflow: hidden;
  grid-column: 1 / -1;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.92) 100%
  );
  box-shadow:
    0 20px 38px -34px rgba(15, 23, 42, 0.34),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.setting-item-card--boolean {
  grid-column: auto;
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
  margin-top: 10px;
  font-size: 13px;
}

.setting-item-card__editor {
  margin-top: 12px;
}

.setting-field-panel {
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.setting-item-card__editor :deep(.el-input__wrapper),
.setting-item-card__editor :deep(.el-select__wrapper),
.setting-item-card__editor :deep(.el-textarea__inner) {
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.92);
  transition: box-shadow 0.2s ease;
}

.setting-item-card__editor :deep(.el-input__wrapper:hover),
.setting-item-card__editor :deep(.el-select__wrapper:hover),
.setting-item-card__editor :deep(.el-textarea__inner:hover) {
  box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.95);
}

.setting-item-card__editor :deep(.el-input__wrapper.is-focus),
.setting-item-card__editor :deep(.el-select__wrapper.is-focused),
.setting-item-card__editor :deep(.el-textarea__inner:focus) {
  box-shadow:
    inset 0 0 0 1px rgba(59, 130, 246, 0.96),
    0 0 0 3px rgba(191, 219, 254, 0.38);
}

.setting-item-card__footer {
  margin-top: 14px;
  padding-top: 12px;
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
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 18px;
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

  .remote-setting-hero__heading,
  .remote-setting-hero__search,
  .remote-setting-actions__summary {
    width: 100%;
    min-width: 0;
    max-width: none;
  }

  .setting-item-list {
    grid-template-columns: 1fr;
  }

  .setting-item-card--boolean {
    grid-column: 1 / -1;
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
