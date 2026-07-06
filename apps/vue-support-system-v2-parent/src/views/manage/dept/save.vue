<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { fetchSaveDept, fetchUpdateDept } from "@/api/manage/dept";
import { fetchPageUser } from "@repo/core";
import { message } from "@repo/utils";
import { transformI18n } from "@repo/config";
import { ScCascader } from "@repo/components/ScCascader";
import { IconSelect } from "@repo/components/IconSelect";

// Emits
const emit = defineEmits<{
  (e: "success"): void;
}>();

// Refs
const dialogFormRef = ref();

// 状态
const visible = ref(false);
const loading = ref(false);
const title = ref("");
const mode = ref<"save" | "edit" | "show">("save");
const treeData = ref<any[]>([]);
const pendingParentDeptId = ref<string | number | "">("");
const pendingParentDeptName = ref("");
const userLoading = ref(false);
const userOptions = ref<Array<{ label: string; value: number | string }>>([]);
const parentCascaderKey = computed(
  () =>
    `${mode.value}-${form.sysDeptId || "new"}-${form.sysDeptPid || "root"}-${treeData.value.length}`,
);
const statusOptions = [
  { label: "启用", value: 0 },
  { label: "禁用", value: 1 },
];

type DeptForm = {
  sysDeptId: string | number;
  sysDeptName: string;
  sysDeptPid: string | number;
  sysDeptTreeId: string;
  sysDeptIcon: string;
  sysDeptCode: string;
  sysDeptPrincipal: string;
  principalUserIds: Array<number | string>;
  principalUserNames: string[];
  sysDeptContact: string;
  sysDeptSort: number;
  sysDeptStatus: number;
  sysDeptRemark: string;
};

// 表单数据
const form = reactive<DeptForm>({
  sysDeptId: "",
  sysDeptName: "",
  sysDeptPid: "",
  sysDeptTreeId: "",
  sysDeptIcon: "",
  sysDeptCode: "",
  sysDeptPrincipal: "",
  principalUserIds: [],
  principalUserNames: [],
  sysDeptContact: "",
  sysDeptSort: 0,
  sysDeptStatus: 0,
  sysDeptRemark: "",
});

const createDefaultForm = (): DeptForm => ({
  sysDeptId: "",
  sysDeptName: "",
  sysDeptPid: "",
  sysDeptTreeId: "",
  sysDeptIcon: "",
  sysDeptCode: "",
  sysDeptPrincipal: "",
  principalUserIds: [],
  principalUserNames: [],
  sysDeptContact: "",
  sysDeptSort: 0,
  sysDeptStatus: 0,
  sysDeptRemark: "",
});

const findDeptLabel = (
  nodes: any[] = [],
  targetId?: string | number,
): string => {
  for (const node of nodes) {
    if (String(node?.sysDeptId) === String(targetId)) {
      return node?.sysDeptName || "";
    }
    if (Array.isArray(node?.children) && node.children.length > 0) {
      const childLabel = findDeptLabel(node.children, targetId);
      if (childLabel) {
        return childLabel;
      }
    }
  }
  return "";
};

const normalizeDeptId = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? (value as string | number) : numericValue;
};

const dialogSubtitle = computed(() =>
  mode.value === "save"
    ? "先补齐组织归属，再配置负责人、状态和说明。"
    : "保持组织信息、负责人和排序清晰一致，避免树形结构错位。",
);

const parentDeptLabel = computed(() => {
  const currentParentId = form.sysDeptPid || pendingParentDeptId.value;
  if (!currentParentId) {
    return "顶级部门";
  }
  return (
    findDeptLabel(treeData.value, currentParentId) ||
    pendingParentDeptName.value ||
    "未匹配到上级部门"
  );
});

const principalCount = computed(() => form.principalUserIds?.length || 0);
const principalSummary = computed(() =>
  principalCount.value > 0 ? `${principalCount.value} 位负责人` : "未设置负责人",
);
const statusLabel = computed(() =>
  form.sysDeptStatus === 1 ? "已禁用" : "启用中",
);

// 验证规则
const rules = {
  sysDeptName: [
    { required: true, message: "请输入机构名称", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  sysDeptCode: [
    { required: true, message: "请输入机构编码", trigger: "blur" },
    { min: 2, max: 20, message: "长度在 2 到 20 个字符", trigger: "blur" },
  ],
  sysDeptStatus: [
    { required: true, message: "请选择是否禁用", trigger: "blur" },
  ],
};

// 级联选择器配置
const defaultProps = {
  value: "sysDeptId",
  label: "sysDeptName",
  children: "children",
  emitPath: false,
  checkStrictly: true,
};

// i18n
const transformI18nValue = (value: string) => transformI18n(value);

const mergeUserOptions = (
  items: Array<{ label: string; value: number | string }>,
) => {
  const optionMap = new Map(
    userOptions.value.map((item) => [String(item.value), item]),
  );
  items.forEach((item) => {
    if (!item?.value) {
      return;
    }
    optionMap.set(String(item.value), item);
  });
  userOptions.value = Array.from(optionMap.values());
};

const syncSelectedUserOptions = (data: any) => {
  const ids = Array.isArray(data?.principalUserIds)
    ? data.principalUserIds
    : [];
  const names = Array.isArray(data?.principalUserNames)
    ? data.principalUserNames
    : [];
  mergeUserOptions(
    ids.map((id, index) => ({
      value: id,
      label: names[index] || String(id),
    })),
  );
};

const loadUserOptions = async (query = "") => {
  userLoading.value = true;
  try {
    const res: any = await fetchPageUser({
      page: 1,
      pageSize: 20,
      ...(query?.trim() ? { username: query.trim() } : {}),
    });
    const records = res?.data?.records || res?.data || [];
    mergeUserOptions(
      records.map((item) => ({
        value: item.sysUserId,
        label: item.sysUserNickname || item.sysUserUsername,
      })),
    );
  } catch (error) {
    message("加载负责人用户失败", { type: "error" });
  } finally {
    userLoading.value = false;
  }
};

// 关闭对话框
const close = () => {
  visible.value = false;
  loading.value = false;
  pendingParentDeptId.value = "";
  pendingParentDeptName.value = "";
  Object.assign(form, createDefaultForm());
};

// 设置数据
const setData = (data: any) => {
  Object.assign(form, createDefaultForm());
  pendingParentDeptId.value = normalizeDeptId(
    data?.parentDeptId ?? data?.sysDeptPid,
  ) as string | number | "";
  pendingParentDeptName.value =
    data?.parentDeptName || findDeptLabel(treeData.value, pendingParentDeptId.value);
  const principalUserIds = Array.isArray(data?.principalUserIds)
    ? [...data.principalUserIds]
    : [];
  const principalUserNames = Array.isArray(data?.principalUserNames)
    ? [...data.principalUserNames]
    : [];
  Object.assign(form, {
    ...data,
    sysDeptPid: normalizeDeptId(data?.sysDeptPid),
    principalUserIds,
    principalUserNames,
  });
  syncSelectedUserOptions(data);
  return { setTableData, open };
};

// 设置树数据
const setTableData = (data: any[]) => {
  treeData.value = (data || []).filter((item) => item?.sysDeptId !== null);
  return { setData, open };
};

// 打开对话框
const open = (m: "save" | "edit" = "save") => {
  visible.value = true;
  mode.value = m;
  title.value = m === "save" ? "新增" : "编辑";
  if (m === "save") {
    if (!form.sysDeptPid && pendingParentDeptId.value) {
      form.sysDeptPid = pendingParentDeptId.value;
    }
    form.sysDeptSort = 0;
  }
  loadUserOptions();
};

// 提交表单
const submit = async () => {
  let valid = false;
  try {
    valid = await dialogFormRef.value?.validate();
  } catch (error) {
    valid = false;
  }

  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    let res: any = {};
    if (mode.value === "save") {
      res = await fetchSaveDept(form);
    } else {
      res = await fetchUpdateDept(form);
    }

    if (res.code === "00000") {
      emit("success");
      visible.value = false;
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    message("保存失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 暴露给父组件
defineExpose({
  open,
  setData,
  setTableData,
});
</script>
<template>
  <div>
    <sc-dialog
      v-model="visible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      width="960px"
      class="dept-editor-dialog"
      @close="close"
    >
      <template #header>
        <div class="dialog-header">
          <IconifyIconOnline
            :icon="mode === 'save' ? 'ri:add-circle-line' : 'ri:edit-line'"
            class="header-icon"
          />
          <div>
            <div class="dialog-header__title">{{ title }}部门</div>
            <p class="dialog-header__subtitle">{{ dialogSubtitle }}</p>
          </div>
        </div>
      </template>
      <ScForm
        ref="dialogFormRef"
        :model="form"
        :rules="rules"
        :disabled="mode == 'show'"
        label-position="top"
        class="dept-form"
      >
        <div class="dept-editor">
          <div class="dept-shell">
            <div class="dept-main">
              <section class="dept-section">
                <div class="section-head">
                  <div>
                    <div class="section-head__eyebrow">组织归属</div>
                    <h4>基础信息</h4>
                    <p class="section-head__desc">
                      先确认上级部门，再填写名称、编码和展示图标。
                    </p>
                  </div>
                </div>
                <ScRow :gutter="18">
                  <ScCol :xl="24" :span="24">
                    <ScFormItem label="上级部门" prop="sysDeptPid">
                      <ScCascader
                        :key="parentCascaderKey"
                        v-model="form.sysDeptPid"
                        class="w-full"
                        :options="treeData"
                        :props="defaultProps"
                        clearable
                        filterable
                        placeholder="请选择上级部门"
                      >
                        <template #default="{ node, data }">
                          <div class="cascader-item">
                            <IconifyIconOnline
                              :icon="data.sysDeptIcon || 'ri:building-line'"
                              class="cascader-icon"
                            />
                            <span v-if="data.sysDeptI18n">{{
                              transformI18nValue(data.sysDeptI18n)
                            }}</span>
                            <span v-else>{{ data.sysDeptName }}</span>
                            <span v-if="!node.isLeaf" class="cascader-count"
                              >({{ data.children.length }})</span
                            >
                          </div>
                        </template>
                      </ScCascader>
                    </ScFormItem>
                  </ScCol>
                  <ScCol :xl="12" :md="12" :span="24">
                    <ScFormItem label="部门名称" prop="sysDeptName">
                      <ScInput
                        v-model="form.sysDeptName"
                        placeholder="请输入部门名称"
                        :maxlength="20"
                        show-word-limit
                      >
                        <template #prefix>
                          <IconifyIconOnline icon="ri:building-line" />
                        </template>
                      </ScInput>
                    </ScFormItem>
                  </ScCol>
                  <ScCol :xl="12" :md="12" :span="24">
                    <ScFormItem label="部门编码" prop="sysDeptCode">
                      <ScInput
                        v-model="form.sysDeptCode"
                        placeholder="请输入部门编码"
                        :maxlength="20"
                        show-word-limit
                      >
                        <template #prefix>
                          <IconifyIconOnline icon="ri:barcode-line" />
                        </template>
                      </ScInput>
                    </ScFormItem>
                  </ScCol>
                  <ScCol :xl="24" :span="24">
                    <ScFormItem label="部门图标" prop="sysDeptIcon">
                      <IconSelect v-model="form.sysDeptIcon" />
                    </ScFormItem>
                  </ScCol>
                </ScRow>
              </section>

              <section class="dept-section">
                <div class="section-head">
                  <div>
                    <div class="section-head__eyebrow">负责与联络</div>
                    <h4>负责人、状态和备注</h4>
                    <p class="section-head__desc">
                      这里维护负责人、排序、启用状态和联络备注。
                    </p>
                  </div>
                </div>
                <ScRow :gutter="18">
                  <ScCol :xl="24" :span="24">
                    <ScFormItem label="负责人" prop="principalUserIds">
                      <ScSelect
                        v-model="form.principalUserIds"
                        placeholder="请选择负责人"
                        class="w-full"
                        clearable
                        filterable
                        remote
                        multiple
                        collapse-tags
                        collapse-tags-tooltip
                        :loading="userLoading"
                        :remote-method="loadUserOptions"
                      >
                        <template #prefix>
                          <IconifyIconOnline icon="ri:user-line" />
                        </template>
                        <ScOption
                          v-for="item in userOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </ScSelect>
                    </ScFormItem>
                  </ScCol>
                  <ScCol :xl="12" :md="12" :span="24">
                    <ScFormItem label="排序" prop="sysDeptSort">
                      <ScInputNumber
                        v-model="form.sysDeptSort"
                        placeholder="排序"
                        :min="0"
                        :max="9999"
                        class="w-full"
                      />
                    </ScFormItem>
                  </ScCol>
                  <ScCol :xl="12" :md="12" :span="24">
                    <ScFormItem label="状态" prop="sysDeptStatus">
                      <el-segmented
                        v-model="form.sysDeptStatus"
                        :options="statusOptions"
                        class="status-segmented"
                      />
                    </ScFormItem>
                  </ScCol>
                  <ScCol :xl="24" :span="24">
                    <ScFormItem label="联系方式" prop="sysDeptContact">
                      <ScInput
                        v-model="form.sysDeptContact"
                        placeholder="请输入联系方式"
                        :maxlength="20"
                        show-word-limit
                      >
                        <template #prefix>
                          <IconifyIconOnline icon="ri:phone-line" />
                        </template>
                      </ScInput>
                    </ScFormItem>
                  </ScCol>
                  <ScCol :xl="24" :span="24">
                    <ScFormItem label="备注" prop="sysDeptRemark">
                      <ScInput
                        v-model="form.sysDeptRemark"
                        placeholder="请输入备注信息"
                        :maxlength="240"
                        show-word-limit
                        type="textarea"
                        :rows="7"
                      />
                    </ScFormItem>
                  </ScCol>
                </ScRow>
              </section>
            </div>

            <aside class="dept-side">
              <section class="dept-summary">
                <div class="dept-summary__head">
                  <div>
                    <span class="dept-summary__eyebrow">当前概览</span>
                    <h4>{{ form.sysDeptName || `${title}部门` }}</h4>
                    <p>{{ dialogSubtitle }}</p>
                  </div>
                  <div class="dept-summary__tags">
                    <ScTag size="small" effect="plain">{{ title }}</ScTag>
                    <ScTag
                      size="small"
                      :type="form.sysDeptStatus === 1 ? 'danger' : 'success'"
                    >
                      {{ statusLabel }}
                    </ScTag>
                  </div>
                </div>

                <div class="summary-list">
                  <div class="summary-item">
                    <span>上级部门</span>
                    <strong>{{ parentDeptLabel }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>负责人</span>
                    <strong>{{ principalSummary }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>部门编码</span>
                    <strong>{{ form.sysDeptCode || "未填写" }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>联系方式</span>
                    <strong>{{ form.sysDeptContact || "未填写" }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>当前排序</span>
                    <strong>{{ form.sysDeptSort || 0 }}</strong>
                  </div>
                  <div class="summary-item">
                    <span>树路径</span>
                    <strong>{{ form.sysDeptTreeId || "保存后生成" }}</strong>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </ScForm>

      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="visible = false">
            <IconifyIconOnline icon="ep:close" class="mr-1" />
            取消
          </ScButton>
          <ScButton
            v-if="mode != 'show'"
            type="primary"
            :loading="loading"
            @click="submit()"
          >
            <IconifyIconOnline icon="ep:check" class="mr-1" />
            保存
          </ScButton>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<style lang="scss" scoped>
.dept-editor-dialog {
  :deep(.el-dialog) {
    max-width: calc(100vw - 32px);
  }

  :deep(.el-dialog__header) {
    padding: 22px 24px;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    max-height: min(78vh, 880px);
    padding: 24px;
    overflow: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

.dialog-header {
  display: flex;
  gap: 12px;
  align-items: center;

  .header-icon {
    font-size: 22px;
    color: var(--el-color-primary);
  }
}

.dialog-header__title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.dialog-header__subtitle {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.dept-editor {
  min-height: 0;
}

.dept-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.8fr);
  gap: 20px;
  align-items: start;
}

.dept-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.dept-side {
  min-width: 0;
}

.section-head__eyebrow,
.dept-summary__eyebrow {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--el-color-primary);
  text-transform: uppercase;
}

.dept-section {
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  background: var(--el-bg-color-page);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  h4 {
    margin: 8px 0 0;
    font-size: 18px;
    color: var(--el-text-color-primary);
  }
}

.section-head__desc {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.dept-summary {
  position: sticky;
  top: 0;
  padding: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color) 94%),
      var(--el-bg-color)
    );
}

.dept-summary__head {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  h4 {
    margin: 8px 0 0;
    font-size: 22px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 8px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.7;
  }
}

.dept-summary__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.summary-list {
  display: grid;
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);

  span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  strong {
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 1.6;
    word-break: break-all;
  }
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dept-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    min-height: 44px;
    border-radius: 14px;
    border: 1px solid rgba(203, 213, 225, 0.96);
    background: #fff;
    box-shadow: 0 0 0 1px transparent;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background-color 0.2s ease;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-select__wrapper.is-focused),
  :deep(.el-textarea__inner:focus) {
    border-color: rgba(59, 130, 246, 0.92);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.14);
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      border-radius: 14px;
    }
  }

  :deep(.el-textarea__inner) {
    min-height: 144px;
  }
}

.cascader-item {
  display: flex;
  gap: 6px;
  align-items: center;

  .cascader-icon {
    color: var(--el-color-primary);
  }

  .cascader-count {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.status-segmented {
  :deep(.el-segmented__item) {
    min-width: 80px;
  }
}

@media (width <= 1100px) {
  .dept-shell {
    grid-template-columns: 1fr;
  }
}

@media (width <= 768px) {
  .dept-editor-dialog {
    :deep(.el-dialog__header) {
      padding: 18px;
    }

    :deep(.el-dialog__body) {
      padding: 18px;
    }

    :deep(.el-dialog__footer) {
      padding: 14px 18px;
    }
  }

  .dept-section,
  .dept-summary {
    padding: 16px;
    border-radius: 16px;
  }
}
</style>
