<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { fetchSaveDictItem, fetchUpdateDictItem } from "@repo/core";
import { message } from "@repo/utils";
import { pinyin } from "pinyin-pro";
import { IconSelect } from "@repo/components/IconSelect";

type DictItemForm = {
  sysDictItemId?: number | null;
  sysDictId?: number | null;
  sysDictItemCode: string;
  sysDictItemName: string;
  sysDictItemI18n: string;
  sysDictItemSort: number;
  sysDictItemIcon: string;
  sysDictItemRemark: string;
  sysDictItemStatus: number;
};

interface Props {
  visible?: boolean;
  mode?: "save" | "edit";
  itemData?: Partial<DictItemForm>;
  sysDictId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  mode: "save",
  itemData: () => ({}),
  sysDictId: null,
});

const emit = defineEmits(["update:visible", "success"]);

const dialogForm = ref();
const dialogVisible = ref(false);
const loading = ref(false);

const createDefaultForm = (): DictItemForm => ({
  sysDictItemId: null,
  sysDictId: null,
  sysDictItemCode: "",
  sysDictItemName: "",
  sysDictItemI18n: "",
  sysDictItemSort: 1,
  sysDictItemIcon: "",
  sysDictItemRemark: "",
  sysDictItemStatus: 1,
});

const form = ref<DictItemForm>(createDefaultForm());

const rules = {
  sysDictItemName: [
    { required: true, message: "请输入字典项名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "字典项名称长度需为 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  sysDictItemCode: [
    { required: true, message: "请输入字典项编码", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "字典项编码长度需为 2 到 50 个字符",
      trigger: "blur",
    },
  ],
};

const isEditMode = computed(() => props.mode === "edit");
const title = computed(() => (isEditMode.value ? "编辑字典项" : "新增字典项"));

const buildPinyinCode = (value: unknown) => {
  if (typeof value !== "string") {
    return "";
  }
  const normalized = value.trim();
  if (!normalized) {
    return "";
  }
  const result = pinyin(normalized, { toneType: "none", type: "array" });
  if (!Array.isArray(result)) {
    return "";
  }
  return result
    .map((item) => String(item).trim().toUpperCase())
    .filter(Boolean)
    .join("_");
};

const syncForm = () => {
  const source = props.itemData || {};
  form.value = {
    ...createDefaultForm(),
    ...source,
    sysDictItemId: source.sysDictItemId ?? null,
    sysDictId: source.sysDictId ?? props.sysDictId ?? null,
    sysDictItemCode: source.sysDictItemCode || "",
    sysDictItemName: source.sysDictItemName || "",
    sysDictItemI18n: source.sysDictItemI18n || "",
    sysDictItemSort: Number(source.sysDictItemSort ?? 1) || 1,
    sysDictItemIcon: source.sysDictItemIcon || "",
    sysDictItemRemark: source.sysDictItemRemark || "",
    sysDictItemStatus: Number(source.sysDictItemStatus ?? 1) || 1,
  };
};

const close = () => {
  emit("update:visible", false);
};

const submit = async () => {
  const validate = dialogForm.value?.validate;
  const valid = validate
    ? await validate()
        .then(() => true)
        .catch(() => false)
    : false;
  if (!valid) {
    return;
  }
  if (!form.value.sysDictId) {
    message.error("请先选择字典分类");
    return;
  }

  const request = isEditMode.value ? fetchUpdateDictItem : fetchSaveDictItem;
  const successText = isEditMode.value ? "保存成功" : "新增成功";
  const failureText = isEditMode.value ? "保存失败" : "新增失败";

  loading.value = true;
  try {
    const payload = { ...form.value };
    const res = (await request(payload)) as any;
    if (res && typeof res === "object" && "code" in res && res.code === "00000") {
      const nextItem =
        res.data && typeof res.data === "object"
          ? { ...payload, ...res.data }
          : payload;
      message.success(successText);
      emit("success", props.mode, nextItem);
      close();
      return;
    }
    message.error(
      res && typeof res === "object" && "msg" in res ? (res.msg as string) || failureText : failureText,
    );
  } catch {
    message.error(failureText);
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.visible,
  (value) => {
    dialogVisible.value = value;
    if (value) {
      syncForm();
    }
  },
  { immediate: true },
);

watch(
  () => dialogVisible.value,
  (value) => {
    if (value !== props.visible) {
      emit("update:visible", value);
    }
  },
);

watch(
  () => props.itemData,
  () => {
    if (dialogVisible.value) {
      syncForm();
    }
  },
  { deep: true },
);

watch(
  () => form.value.sysDictItemName,
  (value) => {
    if (!dialogVisible.value) {
      return;
    }
    if (String(form.value.sysDictItemCode || "").trim()) {
      return;
    }
    const nextCode = buildPinyinCode(value);
    if (nextCode) {
      form.value.sysDictItemCode = nextCode;
    }
  },
);
</script>

<template>
  <div class="dict-item-save">
    <sc-dialog
      v-model="dialogVisible"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      draggable
      :title="title"
      width="760px"
      top="10px"
      class="dict-item-dialog"
      @close="close"
    >
      <div class="dialog-content">
        <ScForm
          ref="dialogForm"
          :model="form"
          :rules="rules"
          label-position="top"
        >
          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:information-line" />
              基本信息
            </div>
            <ScRow :gutter="16">
              <ScCol :span="12">
                <ScFormItem label="字典项名称" prop="sysDictItemName">
                  <ScInput
                    v-model="form.sysDictItemName"
                    placeholder="输入名称"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:bookmark-line" />
                    </template>
                  </ScInput>
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem label="字典项编码" prop="sysDictItemCode">
                  <ScInput
                    v-model="form.sysDictItemCode"
                    placeholder="输入编码"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:code-line" />
                    </template>
                  </ScInput>
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>

          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:palette-line" />
              外观设置
            </div>
            <ScRow :gutter="16">
              <ScCol :span="16">
                <ScFormItem label="字典项图标" prop="sysDictItemIcon">
                  <IconSelect v-model="form.sysDictItemIcon" class="w-full" />
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="优先级" prop="sysDictItemSort">
                  <ScInputNumber
                    v-model="form.sysDictItemSort"
                    :min="1"
                    :max="999"
                    class="w-full"
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>

          <div class="form-section">
            <div class="section-title">
              <IconifyIconOnline icon="ri:settings-3-line" />
              高级设置
            </div>
            <ScRow :gutter="16">
              <ScCol :span="16">
                <ScFormItem label="国际化标识 (i18n)" prop="sysDictItemI18n">
                  <ScInput
                    v-model="form.sysDictItemI18n"
                    placeholder="输入 i18n 标识"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:translate-2" />
                    </template>
                  </ScInput>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="启用状态">
                  <ScSwitch
                    v-model="form.sysDictItemStatus"
                    :active-value="1"
                    :inactive-value="0"
                    inline-prompt
                    active-text="启用"
                    inactive-text="停用"
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>
            <ScFormItem label="备注描述" prop="sysDictItemRemark">
              <ScInput
                v-model="form.sysDictItemRemark"
                type="textarea"
                :rows="3"
                placeholder="输入备注描述..."
                maxlength="200"
                show-word-limit
              />
            </ScFormItem>
          </div>
        </ScForm>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <ScButton @click="close">取消</ScButton>
          <ScButton type="primary" :loading="loading" @click="submit">
            <IconifyIconOnline
              :icon="isEditMode ? 'ri:save-line' : 'ri:add-line'"
              class="mr-1"
            />
            {{ isEditMode ? "保存" : "创建" }}
          </ScButton>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<style lang="scss">
.dict-item-dialog {
  max-height: calc(100vh - 20px);
  overflow: hidden;

  .el-dialog__body {
    max-height: calc(100vh - 188px);
    overflow-y: auto;
  }
}

.dialog-content {
  padding: 20px 24px;
}

.form-section {
  background: var(--el-fill-color-lighter);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;

  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

:deep(.el-form-item) {
  margin-bottom: 16px;

  .el-form-item__label {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 8px;
}

:deep(.el-input-number) {
  .el-input__wrapper {
    border-radius: 8px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  :deep(.el-col) {
    max-width: 100%;
    flex: 0 0 100%;
  }
}
</style>
