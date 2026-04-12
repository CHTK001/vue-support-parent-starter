<script setup lang="ts">
import { computed, nextTick, ref, toRaw, watch } from "vue";
import { fetchListRole } from "@/api/manage/role";
import { fetchSaveMiniMenu, fetchUpdateMiniMenu } from "@/api/manage/mini-menu";
import { IconSelect } from "@repo/components/IconSelect";
import { message } from "@repo/utils";

type MiniMenuForm = Record<string, any>;

const props = withDefaults(
  defineProps<{
    visible?: boolean;
    mode?: "save" | "edit";
    menuData?: Record<string, any>;
  }>(),
  {
    visible: false,
    mode: "save",
    menuData: () => ({}),
  },
);

const emit = defineEmits<{
  (e: "success", mode: string, form: any): void;
  (e: "update:visible", value: boolean): void;
}>();

const dialogFormRef = ref();
const loading = ref(false);
const roleOptions = ref<any[]>([]);

const dialogVisible = computed({
  get: () => !!props.visible,
  set: (value) => emit("update:visible", value),
});

const createDefaultForm = (): MiniMenuForm => ({
  sysMiniMenuId: undefined,
  sysMiniMenuTitle: "",
  sysMiniMenuSubtitle: "",
  sysMiniMenuCategory: "",
  sysMiniMenuPath: "",
  sysMiniMenuJumpMode: 0,
  sysMiniMenuIcon: "",
  sysMiniMenuCover: "",
  sysMiniMenuBadge: "",
  sysMiniMenuBadgeType: "primary",
  sysMiniMenuPerm: "",
  sysMiniMenuRole: "",
  sysMiniMenuSort: 1,
  sysMiniMenuKeepAlive: 1,
  sysMiniMenuHidden: 0,
  sysMiniMenuDescription: "",
});

const form = ref<MiniMenuForm>(createDefaultForm());

const jumpModeOptions = [
  { label: "普通页面", value: 0 },
  { label: "tabBar", value: 1 },
  { label: "WebView", value: 2 },
];

const badgeTypeOptions = [
  { label: "主色", value: "primary" },
  { label: "成功", value: "success" },
  { label: "警告", value: "warning" },
  { label: "危险", value: "danger" },
  { label: "信息", value: "info" },
];

const rules = {
  sysMiniMenuTitle: [
    { required: true, message: "请输入卡片标题", trigger: "blur" },
  ],
  sysMiniMenuPath: [
    { required: true, message: "请输入页面路径", trigger: "blur" },
  ],
};

const dialogTitle = computed(() =>
  props.mode === "edit" ? "编辑小程序卡片" : "新增小程序卡片",
);

const selectedRoles = computed({
  get: () =>
    String(form.value.sysMiniMenuRole || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  set: (value: string[]) => {
    form.value.sysMiniMenuRole = value.join(",");
  },
});

const coverStyle = computed(() => ({
  background: form.value.sysMiniMenuCover
    ? `linear-gradient(135deg, rgb(15 23 42 / 12%), rgb(59 130 246 / 16%)), url(${form.value.sysMiniMenuCover}) center / cover`
    : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 52%, #f8fafc 100%)",
}));

const badgeClass = computed(
  () => `mini-preview__badge--${form.value.sysMiniMenuBadgeType || "primary"}`,
);

const normalizeFlag = (value: unknown, defaultValue = 0) =>
  value === true || value === 1 || value === "1"
    ? 1
    : value === false || value === 0 || value === "0"
      ? 0
      : defaultValue;

const cloneValue = (value: any) => {
  const raw =
    typeof value === "object" && value !== null ? toRaw(value) : value;
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(raw);
    } catch {
      // ignore
    }
  }
  return JSON.parse(JSON.stringify(raw));
};

const sanitizeForm = (source: any) => {
  const nextForm = {
    ...createDefaultForm(),
    ...cloneValue(source || {}),
  };
  nextForm.sysMiniMenuJumpMode = Number(nextForm.sysMiniMenuJumpMode ?? 0);
  nextForm.sysMiniMenuSort = Number(nextForm.sysMiniMenuSort ?? 1) || 1;
  nextForm.sysMiniMenuKeepAlive = normalizeFlag(
    nextForm.sysMiniMenuKeepAlive,
    1,
  );
  nextForm.sysMiniMenuHidden = normalizeFlag(nextForm.sysMiniMenuHidden, 0);
  if (!nextForm.sysMiniMenuBadgeType) {
    nextForm.sysMiniMenuBadgeType = "primary";
  }
  return nextForm;
};

const syncDialogState = async () => {
  form.value = sanitizeForm(props.menuData || {});
  await nextTick();
  dialogFormRef.value?.clearValidate?.();
};

const resetDialogState = () => {
  loading.value = false;
  form.value = createDefaultForm();
  nextTick(() => {
    dialogFormRef.value?.clearValidate?.();
  });
};

const close = () => {
  dialogVisible.value = false;
};

const loadRoles = async () => {
  try {
    const res = await fetchListRole({});
    const merged = [
      { sysRoleId: 1, sysRoleCode: "SUPER_ADMIN", sysRoleName: "超级管理员" },
      ...(Array.isArray(res?.data) ? res.data : []),
    ];
    const roleMap = new Map();
    merged.forEach((item) => {
      if (item?.sysRoleCode && !roleMap.has(item.sysRoleCode)) {
        roleMap.set(item.sysRoleCode, item);
      }
    });
    roleOptions.value = Array.from(roleMap.values());
  } catch {
    message.error("加载角色列表失败");
  }
};

const submit = async () => {
  const valid = await dialogFormRef.value
    ?.validate?.()
    .then(() => true)
    .catch(() => false);
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const payload = sanitizeForm(form.value);
    const request =
      props.mode === "edit" ? fetchUpdateMiniMenu : fetchSaveMiniMenu;
    const res = await request(payload);
    if (res?.code === "00000") {
      const nextMenu =
        res?.data && typeof res.data === "object"
          ? { ...payload, ...res.data }
          : payload;
      message.success(props.mode === "edit" ? "保存成功" : "新增成功");
      emit("success", props.mode, nextMenu);
      close();
      return;
    }
    message.error(res?.msg || "保存失败");
  } catch {
    message.error("保存失败");
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  async (visible) => {
    if (visible) {
      await syncDialogState();
      return;
    }
    resetDialogState();
  },
  { immediate: true },
);

watch(
  () => props.menuData,
  async () => {
    if (props.visible) {
      await syncDialogState();
    }
  },
  { deep: true },
);

loadRoles();
</script>

<template>
  <sc-dialog
    v-model="dialogVisible"
    width="1040px"
    top="24px"
    append-to-body
    draggable
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :title="dialogTitle"
    class="mini-menu-save-dialog"
  >
    <div class="mini-menu-form-shell">
      <aside class="mini-preview">
        <div class="mini-preview__cover" :style="coverStyle">
          <div class="mini-preview__badge" :class="badgeClass">
            {{ form.sysMiniMenuBadge || "NEW" }}
          </div>
        </div>
        <div class="mini-preview__body">
          <div class="mini-preview__icon">
            <IconifyIconOnline
              :icon="form.sysMiniMenuIcon || 'ri:apps-2-line'"
            />
          </div>
          <div class="mini-preview__copy">
            <h4>{{ form.sysMiniMenuTitle || "卡片标题" }}</h4>
            <p>{{ form.sysMiniMenuSubtitle || "副标题 / 使用说明" }}</p>
          </div>
          <div class="mini-preview__meta">
            <span>{{ form.sysMiniMenuCategory || "未分组" }}</span>
            <span>#{{ form.sysMiniMenuSort || 1 }}</span>
          </div>
          <div class="mini-preview__path">
            {{ form.sysMiniMenuPath || "/pages/home/index" }}
          </div>
          <div class="mini-preview__tags">
            <ScTag size="small" effect="plain">
              {{
                jumpModeOptions.find(
                  (item) => item.value === Number(form.sysMiniMenuJumpMode),
                )?.label || "普通页面"
              }}
            </ScTag>
            <ScTag
              size="small"
              :type="form.sysMiniMenuKeepAlive ? 'success' : 'info'"
              effect="light"
            >
              {{ form.sysMiniMenuKeepAlive ? "开启缓存" : "不缓存" }}
            </ScTag>
            <ScTag
              size="small"
              :type="form.sysMiniMenuHidden ? 'warning' : 'primary'"
              effect="light"
            >
              {{ form.sysMiniMenuHidden ? "已隐藏" : "显示中" }}
            </ScTag>
          </div>
        </div>
      </aside>

      <div class="mini-form-pane thin-scroller">
        <ScForm
          ref="dialogFormRef"
          :model="form"
          :rules="rules"
          label-position="top"
          class="mini-form"
        >
          <div class="mini-form__section">
            <div class="mini-form__title">基础内容</div>
            <ScRow :gutter="18">
              <ScCol :span="12">
                <ScFormItem label="卡片标题" prop="sysMiniMenuTitle">
                  <ScInput
                    v-model="form.sysMiniMenuTitle"
                    clearable
                    :maxlength="40"
                    show-word-limit
                    placeholder="如：服务工单"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="卡片副标题">
                  <ScInput
                    v-model="form.sysMiniMenuSubtitle"
                    clearable
                    :maxlength="60"
                    show-word-limit
                    placeholder="如：提交与跟踪处理进度"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="页面路径" prop="sysMiniMenuPath">
                  <ScInput
                    v-model="form.sysMiniMenuPath"
                    clearable
                    :maxlength="120"
                    show-word-limit
                    placeholder="/pages/workorder/index"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="卡片分组">
                  <ScInput
                    v-model="form.sysMiniMenuCategory"
                    clearable
                    :maxlength="30"
                    show-word-limit
                    placeholder="工作台 / 服务 / 系统"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="跳转模式">
                  <ScSelect v-model="form.sysMiniMenuJumpMode" class="w-full">
                    <ScOption
                      v-for="item in jumpModeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="排序">
                  <ScInputNumber
                    v-model="form.sysMiniMenuSort"
                    class="w-full"
                    :min="1"
                    :max="9999"
                    controls-position="right"
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>

          <div class="mini-form__section">
            <div class="mini-form__title">视觉样式</div>
            <ScRow :gutter="18">
              <ScCol :span="12">
                <ScFormItem label="图标">
                  <IconSelect v-model="form.sysMiniMenuIcon" />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="封面地址">
                  <ScInput
                    v-model="form.sysMiniMenuCover"
                    clearable
                    :maxlength="240"
                    show-word-limit
                    placeholder="可填图片 URL 或 CDN 地址"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="角标文案">
                  <ScInput
                    v-model="form.sysMiniMenuBadge"
                    clearable
                    :maxlength="12"
                    show-word-limit
                    placeholder="HOT / NEW"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="角标样式">
                  <ScSelect v-model="form.sysMiniMenuBadgeType" class="w-full">
                    <ScOption
                      v-for="item in badgeTypeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>

          <div class="mini-form__section">
            <div class="mini-form__title">权限与行为</div>
            <ScRow :gutter="18">
              <ScCol :span="12">
                <ScFormItem label="权限标识">
                  <ScInput
                    v-model="form.sysMiniMenuPerm"
                    clearable
                    :maxlength="120"
                    show-word-limit
                    placeholder="mini:workorder:view"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="允许角色">
                  <ScSelect
                    v-model="selectedRoles"
                    class="w-full"
                    multiple
                    clearable
                    filterable
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="为空则所有角色可见"
                  >
                    <ScOption
                      v-for="item in roleOptions"
                      :key="item.sysRoleCode"
                      :label="item.sysRoleName"
                      :value="item.sysRoleCode"
                    />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="开启缓存">
                  <el-switch
                    v-model="form.sysMiniMenuKeepAlive"
                    :active-value="1"
                    :inactive-value="0"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="显示状态">
                  <el-switch
                    v-model="form.sysMiniMenuHidden"
                    :active-value="1"
                    :inactive-value="0"
                    active-text="隐藏"
                    inactive-text="显示"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="24">
                <ScFormItem label="卡片说明">
                  <ScInput
                    v-model="form.sysMiniMenuDescription"
                    type="textarea"
                    :rows="4"
                    :maxlength="200"
                    show-word-limit
                    placeholder="补充说明卡片用途、使用对象或运营备注"
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>
        </ScForm>
      </div>
    </div>

    <template #footer>
      <div class="mini-form__footer">
        <ScButton @click="close">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="submit">
          保存
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<style scoped lang="scss">
:deep(.mini-menu-save-dialog .el-dialog) {
  width: min(1040px, calc(100vw - 32px)) !important;
  max-width: calc(100vw - 32px);
}

:deep(.mini-menu-save-dialog .el-dialog__body) {
  max-height: calc(100vh - 178px);
  padding: 18px 20px 14px;
  overflow: hidden;
}

:deep(.mini-menu-save-dialog .el-dialog__footer) {
  padding: 14px 20px 20px;
  background: linear-gradient(
    180deg,
    rgb(255 255 255 / 82%),
    rgb(255 255 255 / 96%)
  );
  border-top: 1px solid var(--el-border-color-lighter);
}

.mini-menu-form-shell {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
  min-height: 0;
  max-height: calc(100vh - 220px);
  padding-bottom: 2px;
}

.mini-preview {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 22px;
  box-shadow: 0 24px 48px rgb(15 23 42 / 8%);
}

.mini-preview__cover {
  position: relative;
  min-height: 180px;
}

.mini-preview__badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  border-radius: 999px;
}

.mini-preview__badge--primary {
  background: #3b82f6;
}
.mini-preview__badge--success {
  background: #22c55e;
}
.mini-preview__badge--warning {
  background: #f59e0b;
}
.mini-preview__badge--danger {
  background: #ef4444;
}
.mini-preview__badge--info {
  background: #64748b;
}

.mini-preview__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.mini-preview__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  color: var(--el-color-primary);
  font-size: 28px;
  background: rgb(59 130 246 / 10%);
  border-radius: 18px;
}

.mini-preview__copy h4 {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.mini-preview__copy p,
.mini-preview__path {
  margin: 0;
  color: var(--el-text-color-secondary);
}

.mini-preview__meta,
.mini-preview__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.mini-preview__meta span {
  padding: 6px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.mini-form-pane {
  min-height: 0;
  max-height: inherit;
  padding-right: 6px;
  padding-bottom: 8px;
  overflow: auto;
}

.mini-form__section {
  padding: 18px 20px 4px;
  margin-bottom: 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
}

.mini-form__title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.mini-form__footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

html.dark {
  .mini-menu-save-dialog {
    :deep(.el-dialog__footer) {
      background: linear-gradient(
        180deg,
        rgb(15 23 42 / 74%),
        rgb(15 23 42 / 92%)
      );
      border-top-color: rgb(148 163 184 / 14%);
    }

    .mini-preview {
      background: rgb(15 23 42 / 88%);
      border-color: rgb(148 163 184 / 16%);
      box-shadow: 0 24px 48px rgb(2 8 23 / 24%);
    }

    .mini-preview__icon {
      background: rgb(var(--el-color-primary-rgb) / 16%);
      color: #bfdbfe;
    }

    .mini-preview__copy p,
    .mini-preview__path,
    .mini-preview__meta span {
      color: #94a3b8;
    }

    .mini-preview__meta span {
      background: rgb(15 23 42 / 72%);
    }

    .mini-form__section {
      background: rgb(15 23 42 / 72%);
      border-color: rgb(148 163 184 / 16%);
      box-shadow: 0 16px 32px rgb(2 8 23 / 16%);
    }
  }
}

@media (width <= 960px) {
  :deep(.mini-menu-save-dialog .el-dialog__body) {
    max-height: calc(100vh - 152px);
    padding: 16px;
  }

  .mini-menu-form-shell {
    grid-template-columns: 1fr;
  }
}
</style>
