<template>
  <div class="ftp-acl" :class="`ftp-acl--${railCorner}`">
    <ScTabs
      v-model="activeTab"
      class="ftp-acl__tabs rail-tabs"
      layout="rail"
      rail-size="normal"
      :tab-position="railTabPosition"
      :rail-round="props.railRound"
      :rail-close-button-mode="props.railClosable ? 'hover' : 'always'"
      @tab-remove="handleRailTabRemove"
    >
      <ScTabPane
        v-if="!closedTabs.includes('basic')"
        name="basic"
        :closable="false"
        lazy
      >
        <template #label>
          <ScTabsRailTabLabel
            :item="railItemBasic"
            :rail-closable="props.railClosable"
            @close="handleRailTabRemove('basic')"
          />
        </template>
        <div class="pane">
          <div class="pane-title">
            <IconifyIconOnline icon="ri:toggle-line" />
            <span>开关与策略</span>
          </div>
          <div class="switch-grid">
            <ScSwitch
              v-model="model.enabled"
              layout="compact-card"
              label="启用过滤"
              active-icon="ri:shield-check-line"
              size="small"
            />
            <ScSwitch
              v-model="model.blockOnViolation"
              layout="compact-card"
              label="命中阻断"
              active-icon="ri:forbid-2-line"
              size="small"
            />
            <ScSwitch
              v-model="model.allowAnonymous"
              layout="compact-card"
              label="允许匿名"
              active-icon="ri:user-shared-line"
              size="small"
            />
          </div>

          <div class="hint">
            <div class="hint-item">- 关闭“启用过滤”后将不做任何拦截</div>
            <div class="hint-item">- 关闭“命中阻断”后仅告警放行</div>
            <div class="hint-item">- “允许匿名”控制 anonymous 是否允许登录</div>
          </div>
        </div>
      </ScTabPane>

      <ScTabPane
        v-if="!closedTabs.includes('users')"
        name="users"
        :closable="false"
        lazy
      >
        <template #label>
          <ScTabsRailTabLabel
            :item="railItemUsers"
            :rail-closable="props.railClosable"
            @close="handleRailTabRemove('users')"
          />
        </template>
        <div class="pane">
          <div class="pane-title">
            <IconifyIconOnline icon="ri:user-3-line" />
            <span>账号</span>
          </div>
          <div class="accounts">
            <div v-for="(acc, idx) in model.accounts" :key="idx" class="account-row">
              <ScButton class="account-delete-btn" text type="danger" @click="removeAccount(idx)">
                <IconifyIconOnline icon="ri:close-line" />
              </ScButton>
              <div class="account-grid">
                <div class="account-cell">
                  <div class="label">用户名</div>
                  <ScInput
                    v-model="acc.username"
                    class="acl-input account-card-field"
                    control-layout="card"
                    layout="card"
                    :show-prefix="false"
                    placeholder="例如：admin"
                  />
                </div>
                <div class="account-cell">
                  <div class="label">权限</div>
                  <ScSelect
                    v-model="acc.permission"
                    class="acl-input account-card-field"
                    control-layout="card"
                    layout="list"
                    :options="permissionOptions"
                    :list-show-search="false"
                    list-height="120px"
                  />
                </div>
                <div class="account-cell account-cell-switch">
                  <div class="label">启用</div>
                  <ScSwitch
                    v-model="acc.enabled"
                    layout="compact-card"
                    label="启用"
                    active-icon="ri:check-line"
                    size="small"
                  />
                </div>
              </div>
            </div>

            <div class="account-add">
              <ScButton plain @click="addAccount">
                <IconifyIconOnline icon="ri:add-line" />
                添加账号
              </ScButton>
            </div>
          </div>
        </div>
      </ScTabPane>
    </ScTabs>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { SystemServerSettingItem } from "@/api/system-server-setting-item";
import { ScTabs, ScTabPane, ScTabsRailTabLabel, type ScTabsRailItem } from "@repo/components/ScTabs";
import { ScButton } from "@repo/components/ScButton";
import { ScInput } from "@repo/components/ScInput";
import { ScSelect } from "@repo/components/ScSelect";
import { ScSwitch } from "@repo/components/ScSwitch/index.vue";

type AccountRow = {
  username: string;
  permission: "readOnly" | "readWrite";
  enabled: boolean;
};

type AclModel = {
  enabled: boolean;
  blockOnViolation: boolean;
  allowAnonymous: boolean;
  homeDirectory: string;
  accounts: AccountRow[];
};

const props = withDefaults(defineProps<{
  items: SystemServerSettingItem[];
  railRound?: boolean;
  railClosable?: boolean;
}>(), {
  railRound: false,
  railClosable: false,
});

const activeTab = ref<"basic" | "users">("basic");
type TabName = "basic" | "users";
type RailCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";
const railCorner = ref<RailCorner>("top-right");
const railTabPosition = computed<"left" | "right">(() =>
  railCorner.value.includes("left") ? "left" : "right",
);
const closedTabs = ref<TabName[]>([]);

const railItemBasic = computed<ScTabsRailItem>(() => ({
  name: "basic",
  iconify: "ri:toggle-line",
  title: "基础信息",
  label: "基础信息",
  closable: props.railClosable,
}));

const railItemUsers = computed<ScTabsRailItem>(() => ({
  name: "users",
  iconify: "ri:user-3-line",
  title: "用户信息",
  label: "用户信息",
  closable: props.railClosable,
}));
const permissionOptions = [
  { label: "只读", value: "readOnly" },
  { label: "读写", value: "readWrite" },
];
const visibleTabNames = computed(() =>
  (["basic", "users"] as const).filter((n) => !closedTabs.value.includes(n)),
);

const handleRailTabRemove = (name: string | number) => {
  const tabName = String(name) as TabName;
  if (closedTabs.value.includes(tabName)) return;
  if (!visibleTabNames.value.includes(tabName)) return;
  // Keep at least one tab visible so the panel stays operable.
  if (visibleTabNames.value.length <= 1) return;
  closedTabs.value.push(tabName);
  if (activeTab.value === tabName) {
    activeTab.value = visibleTabNames.value[0] ?? "basic";
  }
};

const model = reactive<AclModel>({
  enabled: true,
  blockOnViolation: true,
  allowAnonymous: true,
  homeDirectory: "",
  accounts: [],
});

function parseAccounts(raw: string): AccountRow[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as Array<Record<string, any>>;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((it) => ({
        username: String(it?.username ?? "").trim(),
        permission: it?.permission === "readWrite" ? "readWrite" : "readOnly",
        enabled: it?.enabled !== false,
      }))
      .filter((it) => !!it.username);
  } catch {
    return [];
  }
}

const loadFromItems = (items: SystemServerSettingItem[]) => {
  const map = new Map<string, string>();
  for (const it of items || []) {
    if (!it?.systemServerSettingItemName) continue;
    map.set(it.systemServerSettingItemName, it.systemServerSettingItemValue ?? "");
  }

  model.enabled = (map.get("enabled") ?? "true") !== "false";
  model.blockOnViolation = (map.get("blockOnViolation") ?? "true") !== "false";
  model.allowAnonymous = (map.get("allowAnonymous") ?? "true") !== "false";
  model.homeDirectory = map.get("homeDirectory") ?? "";

  model.accounts = parseAccounts(map.get("accounts") ?? "");
};

watch(
  () => props.items,
  (v) => loadFromItems(v || []),
  { immediate: true, deep: true },
);

const addAccount = () => {
  model.accounts.push({
    username: "",
    permission: "readOnly",
    enabled: true,
  });
};

const removeAccount = (idx: number) => {
  model.accounts.splice(idx, 1);
};

const accountsToJson = (): string => {
  const normalized = model.accounts
    .map((it) => ({
      username: (it.username ?? "").trim(),
      permission: it.permission === "readWrite" ? "readWrite" : "readOnly",
      enabled: it.enabled !== false,
    }))
    .filter((it) => !!it.username);
  return JSON.stringify(normalized);
};

const toItems = (): SystemServerSettingItem[] => {
  const pairs: Array<[keyof AclModel, string]> = [
    ["enabled", String(model.enabled)],
    ["blockOnViolation", String(model.blockOnViolation)],
    ["allowAnonymous", String(model.allowAnonymous)],
    ["homeDirectory", model.homeDirectory],
    ["accounts", accountsToJson()],
  ];

  return pairs
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => ({
      systemServerSettingItemName: String(k),
      systemServerSettingItemValue: v ?? "",
    })) as SystemServerSettingItem[];
};

defineExpose({ toItems });
</script>

<style lang="scss" scoped>
.ftp-acl {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 6px 8px;
  box-sizing: border-box;
}

.ftp-acl.ftp-acl--top-left,
.ftp-acl.ftp-acl--bottom-left {
  padding-left: 12px;
}

.ftp-acl.ftp-acl--top-right,
.ftp-acl.ftp-acl--bottom-right {
  padding-right: 12px;
}

.pane {
  padding: 12px;
}

.ftp-acl__tabs.rail-tabs {
  flex: 1;
  min-width: 0;
  min-height: 420px;
  max-height: 56vh;
}

.ftp-acl.ftp-acl--top-right .ftp-acl__tabs,
.ftp-acl.ftp-acl--bottom-right .ftp-acl__tabs {
  padding-right: 2px;
}

.ftp-acl.ftp-acl--top-left .ftp-acl__tabs,
.ftp-acl.ftp-acl--bottom-left .ftp-acl__tabs {
  padding-left: 2px;
}

.pane-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 650;
  color: #303133;
}

.subtitle {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;

  code {
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(64, 158, 255, 0.12);
    color: #409eff;
    border: 1px solid rgba(64, 158, 255, 0.18);
  }
}

.switch-grid {
  margin-top: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.hint {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px dashed #dcdfe6;
  background: #fafcff;
  color: #606266;
  font-size: 12px;
  line-height: 1.6;
}

.fields {
  margin-top: 10px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.two-col {
  grid-template-columns: 1fr 1fr;
}

.label {
  font-size: 12px;
  font-weight: 650;
  color: #303133;
}

.help {
  margin-top: 2px;
  font-size: 12px;
  color: #909399;
}

.acl-input {
  width: 100%;
  margin-top: 6px;
}

.account-card-field {
  margin-top: 6px;
}

.split {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

.split-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 650;
  color: #606266;
  margin-bottom: 8px;
}

.field {
  padding: 10px 12px;
  border: 1px solid #f0f2f5;
  border-radius: 12px;
  background: #fff;
}

.accounts {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 42vh;
  overflow-y: auto;
  padding-right: 6px;
}

.account-row {
  position: relative;
  padding: 14px;
  border: 1px solid #e9edf5;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.account-delete-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  border-radius: 999px;
}

.account-grid {
  display: grid;
  grid-template-columns: minmax(180px, 1.8fr) minmax(130px, 1fr) minmax(140px, 0.9fr);
  gap: 12px;
  align-items: end;
}

.account-cell {
  min-width: 0;
}

.account-cell .label {
  margin-bottom: 6px;
}

.account-add {
  display: flex;
  justify-content: flex-start;

  :deep(.el-button) {
    border-radius: 10px;
    padding-inline: 14px;
  }
}

@media (max-width: 920px) {
  .ftp-acl {
    padding: 6px 4px;
  }

  .ftp-acl__tabs.rail-tabs {
    max-height: none;
    min-height: 320px;
  }

  .switch-grid {
    grid-template-columns: 1fr;
  }

  .two-col {
    grid-template-columns: 1fr;
  }

  .split {
    grid-template-columns: 1fr;
  }

  .account-grid {
    grid-template-columns: 1fr;
  }

  .account-cell-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 1180px) {
  .account-grid {
    grid-template-columns: minmax(160px, 1fr) minmax(120px, 1fr);
  }

  .account-cell-switch {
    grid-column: span 1;
  }
}
</style>

