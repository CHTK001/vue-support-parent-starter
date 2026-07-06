<script setup lang="ts">
import { computed, nextTick, ref, toRaw, watch } from "vue";
import { fetchSaveMenu, fetchUpdateMenu } from "@/api/manage/menu";
import { fetchListRole } from "@/api/manage/role";
import ReAnimateSelector from "@repo/components/ReAnimateSelector/index.vue";
import { ScCascader } from "@repo/components/ScCascader";
import { IconSelect } from "@repo/components/IconSelect";
import { transformI18n } from "@repo/config";
import { message } from "@repo/utils";

type MenuForm = Record<string, any>;

const props = withDefaults(
  defineProps<{
    visible?: boolean;
    mode?: "save" | "edit" | "show";
    tableData?: any[];
    menuData?: any;
    currentEngine?: number;
  }>(),
  {
    visible: false,
    mode: "save",
    tableData: () => [],
    menuData: () => ({}),
    currentEngine: 0,
  },
);

const emit = defineEmits<{
  (e: "success", mode: string, form: any): void;
  (e: "update:visible", value: boolean): void;
}>();

const dialogFormRef = ref();
const loading = ref(false);
const roleOptions = ref<any[]>([]);
const dynamicTags = ref<string[]>([]);

const dialogVisible = computed({
  get: () => !!props.visible,
  set: (value) => emit("update:visible", value),
});

const createDefaultForm = (): MenuForm => ({
  sysMenuId: undefined,
  sysMenuPid: undefined,
  sysMenuType: 0,
  sysMenuTitle: "",
  sysMenuI18n: "",
  sysMenuName: "",
  sysMenuPath: "",
  sysMenuComponent: "",
  sysMenuPerm: "",
  sysMenuSort: 1,
  sysMenuRedirect: "",
  sysMenuIcon: "",
  sysMenuExtraIcon: "",
  sysMenuEnterTransition: "",
  sysMenuLeaveTransition: "",
  sysMenuActivePath: "",
  sysMenuFrameSrc: "",
  sysMenuFrameLoading: 0,
  sysMenuShowParent: 1,
  sysMenuHome: 0,
  sysMenuKeepAlive: 0,
  sysMenuHiddenTag: 0,
  sysMenuFixedTag: 0,
  sysMenuHidden: 0,
  sysMenuRole: "",
  sysMenuEngine: Number(props.currentEngine ?? 0),
});

const form = ref<MenuForm>(createDefaultForm());

const menuTypeOptions = [
  { label: "菜单", value: 0 },
  { label: "iframe", value: 1 },
  { label: "外链", value: 2 },
  { label: "按钮", value: 3 },
];

const cascaderProps = {
  value: "sysMenuId",
  label: "sysMenuTitle",
  children: "children",
  emitPath: false,
  checkStrictly: true,
};

const dialogMode = computed(() => props.mode || "save");
const isButtonType = computed(() => Number(form.value.sysMenuType) === 3);
const isIframeType = computed(() => Number(form.value.sysMenuType) === 1);
const isExternalType = computed(() => Number(form.value.sysMenuType) === 2);
const isRouteType = computed(() => Number(form.value.sysMenuType) === 0);
const showRouteFields = computed(() => !isButtonType.value);
const showComponentField = computed(() => isRouteType.value);
const showFrameSourceField = computed(
  () => isIframeType.value || isExternalType.value,
);
const dialogTitle = computed(() =>
  dialogMode.value === "save" ? "新增菜单" : "编辑菜单",
);
const frameSourceLabel = computed(() =>
  isIframeType.value ? "iframe 地址" : "外链地址",
);

const flattenMenuTree = (items: any[] = [], list: any[] = []) => {
  items.forEach((item) => {
    if (!item) {
      return;
    }
    list.push(item);
    if (Array.isArray(item.children) && item.children.length > 0) {
      flattenMenuTree(item.children, list);
    }
  });
  return list;
};

const normalizeComparablePath = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/[?#].*$/, "")
    .replace(/^@repo\/pages\//, "")
    .replace(/^@pages\/common\//, "")
    .replace(/^@pages\//, "")
    .replace(/^\/?src\/views\//, "")
    .replace(/^\/?views\//, "")
    .replace(/^\/+/, "")
    .replace(/\.vue$/i, "")
    .replace(/\/index$/i, "")
    .replace(/\/+$/, "");

const componentConflictMenu = computed(() => {
  if (!showComponentField.value) {
    return null;
  }

  const currentPath = normalizeComparablePath(form.value.sysMenuPath);
  const componentPath = normalizeComparablePath(form.value.sysMenuComponent);
  if (!currentPath || !componentPath) {
    return null;
  }

  const linkedMenu = flattenMenuTree(props.tableData || []).find((item) => {
    if (!item || Number(item?.sysMenuType) !== 0) {
      return false;
    }
    if (Number(item?.sysMenuId) === Number(form.value.sysMenuId || 0)) {
      return false;
    }
    return normalizeComparablePath(item?.sysMenuPath) === componentPath;
  });

  if (!linkedMenu) {
    return null;
  }

  return normalizeComparablePath(linkedMenu?.sysMenuPath) !== currentPath
    ? linkedMenu
    : null;
});

const componentConflictMessage = computed(() => {
  const linkedMenu = componentConflictMenu.value;
  if (!linkedMenu) {
    return "";
  }
  return `当前组件路径会命中已有菜单「${transformI18nValue(linkedMenu.sysMenuI18n || linkedMenu.sysMenuTitle)}」(${linkedMenu.sysMenuPath})，保存后会直接打开该页面。`;
});

const rules = computed(() => {
  const nextRules: Record<string, any[]> = {
    sysMenuTitle: [
      { required: true, message: "请输入菜单名称", trigger: "blur" },
    ],
  };

  if (showRouteFields.value) {
    nextRules.sysMenuName = [
      { required: true, message: "请输入路由名称", trigger: "blur" },
    ];
    nextRules.sysMenuPath = [
      { required: true, message: "请输入路由路径", trigger: "blur" },
    ];
  }

  if (showComponentField.value) {
    nextRules.sysMenuComponent = [
      { required: true, message: "请输入组件路径", trigger: "blur" },
      {
        validator: (_rule, _value, callback) => {
          if (componentConflictMessage.value) {
            callback(new Error(componentConflictMessage.value));
            return;
          }
          callback();
        },
        trigger: "blur",
      },
    ];
  }

  if (showFrameSourceField.value) {
    nextRules.sysMenuFrameSrc = [
      {
        required: true,
        message: `请输入${frameSourceLabel.value}`,
        trigger: "blur",
      },
    ];
  }

  if (isButtonType.value) {
    nextRules.sysMenuPerm = [
      { required: true, message: "请输入权限标识", trigger: "blur" },
    ];
  }

  return nextRules;
});

const normalizeFlag = (value: unknown, defaultValue = 0) =>
  value === true || value === 1 || value === "1"
    ? 1
    : value === false || value === 0 || value === "0"
      ? 0
      : defaultValue;

const cloneMenuData = (data: any) => {
  if (data == null) {
    return {};
  }

  const source = typeof data === "object" && data !== null ? toRaw(data) : data;

  if (typeof structuredClone === "function") {
    try {
      return structuredClone(source);
    } catch {
      // 运行时透传的 reactive/proxy 数据可能无法直接 structuredClone，退回到 JSON 克隆。
    }
  }

  return JSON.parse(JSON.stringify(source));
};

const sanitizeMenuForm = (source: any) => {
  const nextForm = {
    ...createDefaultForm(),
    ...cloneMenuData(source || {}),
  };

  nextForm.sysMenuType = Number(nextForm.sysMenuType ?? 0);
  nextForm.sysMenuEngine = Number(
    nextForm.sysMenuEngine ?? props.currentEngine ?? 0,
  );
  const nextIsButtonType = nextForm.sysMenuType === 3;
  const nextIsIframeType = nextForm.sysMenuType === 1;
  const nextIsExternalType = nextForm.sysMenuType === 2;
  const nextIsRouteType = nextForm.sysMenuType === 0;
  const nextShowRouteFields = !nextIsButtonType;
  const nextShowComponentField = nextIsRouteType;
  const nextShowFrameSourceField = nextIsIframeType || nextIsExternalType;
  nextForm.sysMenuPid = nextForm.sysMenuPid
    ? Number(nextForm.sysMenuPid)
    : undefined;
  nextForm.sysMenuSort = Number(nextForm.sysMenuSort ?? 1) || 1;
  nextForm.sysMenuFrameLoading = normalizeFlag(nextForm.sysMenuFrameLoading);
  nextForm.sysMenuShowParent = normalizeFlag(nextForm.sysMenuShowParent, 1);
  nextForm.sysMenuHome = normalizeFlag(nextForm.sysMenuHome);
  nextForm.sysMenuKeepAlive = normalizeFlag(nextForm.sysMenuKeepAlive);
  nextForm.sysMenuHiddenTag = normalizeFlag(nextForm.sysMenuHiddenTag);
  nextForm.sysMenuFixedTag = normalizeFlag(nextForm.sysMenuFixedTag);
  nextForm.sysMenuHidden = normalizeFlag(nextForm.sysMenuHidden);

  if (!nextShowRouteFields) {
    nextForm.sysMenuName = "";
    nextForm.sysMenuPath = "";
    nextForm.sysMenuRedirect = "";
    nextForm.sysMenuActivePath = "";
  }

  if (!nextShowComponentField) {
    nextForm.sysMenuComponent = "";
    nextForm.sysMenuHome = 0;
    nextForm.sysMenuKeepAlive = 0;
  }

  if (!nextShowFrameSourceField) {
    nextForm.sysMenuFrameSrc = "";
  }

  if (!nextIsIframeType) {
    nextForm.sysMenuFrameLoading = 0;
  }

  return nextForm;
};

const removeCurrentNode = (items: any[], currentId?: number) =>
  (items || []).reduce((list, item) => {
    if (!item || item.sysMenuId === currentId) {
      return list;
    }
    list.push({
      ...item,
      children: removeCurrentNode(item.children || [], currentId),
    });
    return list;
  }, [] as any[]);

const menuTreeOptions = computed(() =>
  removeCurrentNode(props.tableData || [], form.value.sysMenuId),
);
const parentCascaderKey = computed(
  () =>
    `${dialogMode.value}-${form.value.sysMenuId ?? "new"}-${form.value.sysMenuPid ?? "root"}-${menuTreeOptions.value.length}`,
);

const transformI18nValue = (value: string) => transformI18n(value);

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

const syncDialogState = async () => {
  const nextForm = sanitizeMenuForm(props.menuData || {});
  form.value = {
    ...nextForm,
    sysMenuPid: nextForm.sysMenuPid || undefined,
  };
  dynamicTags.value = form.value.sysMenuRole
    ? String(form.value.sysMenuRole)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  await nextTick();
  dialogFormRef.value?.clearValidate?.();
};

const resetDialogState = () => {
  loading.value = false;
  dynamicTags.value = [];
  form.value = createDefaultForm();
  nextTick(() => {
    dialogFormRef.value?.clearValidate?.();
  });
};

const close = () => {
  dialogVisible.value = false;
};

const submit = async () => {
  const validate = dialogFormRef.value?.validate;
  const valid = validate
    ? await validate()
        .then(() => true)
        .catch(() => false)
    : false;
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    const payload = sanitizeMenuForm({
      ...form.value,
      sysMenuPid: form.value.sysMenuPid ? Number(form.value.sysMenuPid) : 0,
      sysMenuRole: dynamicTags.value.join(","),
    });
    const request =
      dialogMode.value === "edit" ? fetchUpdateMenu : fetchSaveMenu;
    const res = await request(payload);
    if (res?.code === "00000") {
      const nextMenu =
        res?.data && typeof res.data === "object"
          ? { ...payload, ...res.data }
          : payload;
      message.success(dialogMode.value === "edit" ? "保存成功" : "新增成功");
      emit("success", dialogMode.value, nextMenu);
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
  () => form.value.sysMenuType,
  (nextType, prevType) => {
    if (prevType === undefined || nextType === prevType) {
      return;
    }
    form.value = sanitizeMenuForm(form.value);
  },
);

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
  () => [props.menuData, props.tableData, props.mode, props.currentEngine],
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
  <div class="menu-dialog-shell">
    <sc-dialog
      v-model="dialogVisible"
      top="10px"
      width="960px"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      draggable
      :title="dialogTitle"
      class="menu-save-dialog"
    >
      <div class="menu-form-scroll">
        <ScForm
          ref="dialogFormRef"
          :model="form"
          :rules="rules"
          :disabled="dialogMode === 'show'"
          label-position="top"
          class="menu-form"
        >
          <div class="form-section">
            <div class="section-title">基础信息</div>
            <ScRow :gutter="18">
              <ScCol :span="12">
                <ScFormItem label="菜单类型">
                  <el-segmented
                    v-model="form.sysMenuType"
                    :options="menuTypeOptions"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="上级菜单">
                  <ScCascader
                    :key="parentCascaderKey"
                    v-model="form.sysMenuPid"
                    :options="menuTreeOptions"
                    :props="cascaderProps"
                    class="w-full"
                    clearable
                    filterable
                    placeholder="根菜单可留空"
                  >
                    <template #default="{ node, data }">
                      <div class="menu-parent-option">
                        <span>{{
                          transformI18nValue(
                            data.sysMenuI18n || data.sysMenuTitle,
                          )
                        }}</span>
                        <span v-if="!node.isLeaf" class="menu-parent-count">
                          ({{ data.children?.length || 0 }})
                        </span>
                      </div>
                    </template>
                  </ScCascader>
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="菜单名称" prop="sysMenuTitle">
                  <ScInput
                    v-model="form.sysMenuTitle"
                    clearable
                    placeholder="请输入菜单名称"
                    :maxlength="40"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>
              <ScCol v-if="showRouteFields" :span="12">
                <ScFormItem label="菜单名称 i18n">
                  <ScInput
                    v-model="form.sysMenuI18n"
                    clearable
                    placeholder="请输入菜单名称 i18n"
                    :maxlength="60"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>

              <ScCol v-if="showRouteFields" :span="12">
                <ScFormItem label="路由名称" prop="sysMenuName">
                  <ScInput
                    v-model="form.sysMenuName"
                    clearable
                    placeholder="请输入路由名称"
                    :maxlength="40"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>
              <ScCol v-if="showRouteFields" :span="12">
                <ScFormItem label="路由路径" prop="sysMenuPath">
                  <ScInput
                    v-model="form.sysMenuPath"
                    clearable
                    placeholder="请输入路由路径"
                    :maxlength="200"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>

              <ScCol v-if="showComponentField" :span="12">
                <ScFormItem label="组件路径" prop="sysMenuComponent">
                  <ScInput
                    v-model="form.sysMenuComponent"
                    clearable
                    placeholder="请输入组件路径"
                    :maxlength="200"
                    show-word-limit
                  />
                  <div v-if="componentConflictMessage" class="field-warning">
                    <IconifyIconOnline icon="ri:error-warning-line" />
                    <span>{{ componentConflictMessage }}</span>
                  </div>
                </ScFormItem>
              </ScCol>
              <ScCol v-if="showFrameSourceField" :span="12">
                <ScFormItem :label="frameSourceLabel" prop="sysMenuFrameSrc">
                  <ScInput
                    v-model="form.sysMenuFrameSrc"
                    clearable
                    :placeholder="`请输入${frameSourceLabel}`"
                    :maxlength="240"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="12">
                <ScFormItem label="权限标识" prop="sysMenuPerm">
                  <ScInput
                    v-model="form.sysMenuPerm"
                    clearable
                    placeholder="按钮必填，菜单可选"
                    :maxlength="240"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="菜单排序">
                  <ScInputNumber
                    v-model="form.sysMenuSort"
                    class="w-full"
                    :min="1"
                    :max="9999"
                    controls-position="right"
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>

          <div class="form-section">
            <div class="section-title">展示与路由</div>
            <ScRow :gutter="18">
              <ScCol v-if="showRouteFields" :span="12">
                <ScFormItem label="菜单图标">
                  <IconSelect v-model="form.sysMenuIcon" class="w-full" />
                </ScFormItem>
              </ScCol>
              <ScCol v-if="showRouteFields" :span="12">
                <ScFormItem label="右侧图标">
                  <ScInput
                    v-model="form.sysMenuExtraIcon"
                    clearable
                    placeholder="菜单名称右侧的额外图标"
                    :maxlength="120"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>

              <ScCol v-if="showComponentField" :span="12">
                <ScFormItem label="路由重定向">
                  <ScInput
                    v-model="form.sysMenuRedirect"
                    clearable
                    placeholder="请输入默认跳转地址"
                    :maxlength="200"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>
              <ScCol v-if="showComponentField" :span="12">
                <ScFormItem label="菜单激活路径">
                  <ScInput
                    v-model="form.sysMenuActivePath"
                    clearable
                    placeholder="请输入需要高亮的菜单路径"
                    :maxlength="200"
                    show-word-limit
                  />
                </ScFormItem>
              </ScCol>

              <ScCol v-if="showRouteFields" :span="12">
                <ScFormItem label="进场动画">
                  <ReAnimateSelector
                    v-model="form.sysMenuEnterTransition"
                    placeholder="请选择页面进场动画"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol v-if="showRouteFields" :span="12">
                <ScFormItem label="离场动画">
                  <ReAnimateSelector
                    v-model="form.sysMenuLeaveTransition"
                    placeholder="请选择页面离场动画"
                  />
                </ScFormItem>
              </ScCol>

              <ScCol :span="24">
                <ScFormItem label="所属角色">
                  <ScSelect
                    v-model="dynamicTags"
                    multiple
                    clearable
                    collapse-tags
                    collapse-tags-tooltip
                    placeholder="不选择则对具备菜单权限的角色统一可见"
                  >
                    <ScOption
                      v-for="item in roleOptions"
                      :key="item.sysRoleCode"
                      :value="item.sysRoleCode"
                      :label="item.sysRoleName"
                    />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>

          <div class="form-section">
            <div class="section-title">显示策略</div>
            <div class="flag-grid">
              <div v-if="showRouteFields" class="flag-card">
                <div class="flag-copy">
                  <div class="flag-label">菜单显示</div>
                  <div class="flag-desc">控制左侧导航中是否显示当前菜单</div>
                </div>
                <ScSwitch
                  v-model="form.sysMenuHidden"
                  :active-value="0"
                  :inactive-value="1"
                  inline-prompt
                  active-text="显示"
                  inactive-text="隐藏"
                />
              </div>

              <div v-if="showRouteFields" class="flag-card">
                <div class="flag-copy">
                  <div class="flag-label">显示父级菜单</div>
                  <div class="flag-desc">详情页激活时是否同时展示父级菜单</div>
                </div>
                <ScSwitch
                  v-model="form.sysMenuShowParent"
                  :active-value="1"
                  :inactive-value="0"
                  inline-prompt
                  active-text="显示"
                  inactive-text="隐藏"
                />
              </div>

              <div v-if="showRouteFields" class="flag-card">
                <div class="flag-copy">
                  <div class="flag-label">标签页可见</div>
                  <div class="flag-desc">控制当前菜单是否显示在标签页中</div>
                </div>
                <ScSwitch
                  v-model="form.sysMenuHiddenTag"
                  :active-value="0"
                  :inactive-value="1"
                  inline-prompt
                  active-text="显示"
                  inactive-text="隐藏"
                />
              </div>

              <div v-if="showRouteFields" class="flag-card">
                <div class="flag-copy">
                  <div class="flag-label">固定标签页</div>
                  <div class="flag-desc">固定后标签页不可直接关闭</div>
                </div>
                <ScSwitch
                  v-model="form.sysMenuFixedTag"
                  :active-value="1"
                  :inactive-value="0"
                  inline-prompt
                  active-text="固定"
                  inactive-text="普通"
                />
              </div>

              <div v-if="showComponentField" class="flag-card">
                <div class="flag-copy">
                  <div class="flag-label">页面缓存</div>
                  <div class="flag-desc">开启后会缓存当前页面状态</div>
                </div>
                <ScSwitch
                  v-model="form.sysMenuKeepAlive"
                  :active-value="1"
                  :inactive-value="0"
                  inline-prompt
                  active-text="缓存"
                  inactive-text="不缓存"
                />
              </div>

              <div v-if="showComponentField" class="flag-card">
                <div class="flag-copy">
                  <div class="flag-label">设为首页</div>
                  <div class="flag-desc">仅路由菜单可设置为首页入口</div>
                </div>
                <ScSwitch
                  v-model="form.sysMenuHome"
                  :active-value="1"
                  :inactive-value="0"
                  inline-prompt
                  active-text="是"
                  inactive-text="否"
                />
              </div>

              <div v-if="isIframeType" class="flag-card">
                <div class="flag-copy">
                  <div class="flag-label">iframe 加载动画</div>
                  <div class="flag-desc">
                    控制 iframe 页面首次进入时是否显示加载态
                  </div>
                </div>
                <ScSwitch
                  v-model="form.sysMenuFrameLoading"
                  :active-value="1"
                  :inactive-value="0"
                  inline-prompt
                  active-text="开启"
                  inactive-text="关闭"
                />
              </div>
            </div>
          </div>
        </ScForm>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="close">取消</ScButton>
          <ScButton
            v-if="dialogMode !== 'show'"
            type="primary"
            :loading="loading"
            @click="submit"
          >
            保存
          </ScButton>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<style lang="scss">
:global(.menu-save-dialog) {
  display: flex !important;
  flex-direction: column;
  max-height: calc(100vh - 24px) !important;
  margin: 0 auto !important;
}

:global(.menu-save-dialog .el-dialog__body) {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto !important;
}

:global(.menu-save-dialog .el-dialog__footer) {
  flex-shrink: 0;
}

.menu-dialog-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 4px 0 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.hero-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hero-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.hero-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.menu-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.menu-form-scroll {
  max-height: calc(100vh - 320px);
  padding-right: 4px;
  overflow: auto;
}

.form-section {
  padding: 18px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 16px;
}

.section-title {
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.menu-parent-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.menu-parent-count {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.field-warning {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  margin-top: 8px;
  padding: 10px 12px;
  color: var(--el-color-warning);
  font-size: 12px;
  line-height: 1.6;
  background: rgb(var(--el-color-warning-rgb) / 10%);
  border: 1px solid rgb(var(--el-color-warning-rgb) / 24%);
  border-radius: 12px;

  .iconify {
    margin-top: 2px;
    font-size: 14px;
    flex-shrink: 0;
  }
}

.flag-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.flag-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 78px;
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
}

.flag-copy {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.flag-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.flag-desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

html.dark {
  .menu-save-dialog {
    .form-section {
      background: rgb(15 23 42 / 72%);
      border-color: rgb(148 163 184 / 16%);
      box-shadow: 0 16px 32px rgb(2 8 23 / 16%);
    }

    .flag-card {
      background: rgb(15 23 42 / 88%);
      border-color: rgb(148 163 184 / 16%);
    }

    .field-warning {
      background: rgb(120 53 15 / 24%);
      border-color: rgb(251 191 36 / 22%);
      color: #fbbf24;
    }

    .flag-desc,
    .menu-parent-count {
      color: #94a3b8;
    }
  }
}

@media (max-width: 960px) {
  .flag-grid {
    grid-template-columns: 1fr;
  }
}
</style>
