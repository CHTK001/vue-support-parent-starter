<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { fetchSaveDict, fetchUpdateDict } from "@repo/core";
import { message } from "@repo/utils";

type DictForm = {
  sysDictId?: number | null;
  sysDictPid?: number;
  sysDictName: string;
  sysDictCode: string;
  sysDictI18n: string;
  sysDictSort: number;
  sysDictStatus: number;
  sysDictRemark: string;
};

interface Props {
  visible?: boolean;
  mode?: "save" | "edit";
  dictData?: Partial<DictForm>;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  mode: "save",
  dictData: () => ({}),
});

const emit = defineEmits(["update:visible", "success"]);

const formRef = ref();
const dialogVisible = ref(false);
const submitting = ref(false);

const createDefaultForm = (): DictForm => ({
  sysDictId: null,
  sysDictPid: 0,
  sysDictName: "",
  sysDictCode: "",
  sysDictI18n: "",
  sysDictSort: 1,
  sysDictStatus: 1,
  sysDictRemark: "",
});

const form = ref<DictForm>(createDefaultForm());

const isEditMode = computed(() => props.mode === "edit");
const dialogTitle = computed(() =>
  isEditMode.value ? "编辑字典分类" : "新增字典分类",
);

const rules = {
  sysDictName: [
    { required: true, message: "请输入字典分类名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "字典分类名称长度需为 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  sysDictCode: [
    { required: true, message: "请输入字典分类编码", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "字典分类编码长度需为 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  sysDictSort: [{ required: true, message: "请输入排序值", trigger: "change" }],
};

const syncForm = () => {
  const source = props.dictData || {};
  form.value = {
    ...createDefaultForm(),
    ...source,
    sysDictId: source.sysDictId ?? null,
    sysDictPid: Number(source.sysDictPid ?? 0) || 0,
    sysDictName: source.sysDictName || "",
    sysDictCode: source.sysDictCode || "",
    sysDictI18n: source.sysDictI18n || "",
    sysDictSort: Number(source.sysDictSort ?? 1) || 1,
    sysDictStatus: Number(source.sysDictStatus ?? 1) || 1,
    sysDictRemark: source.sysDictRemark || "",
  };
};

const handleClose = () => {
  emit("update:visible", false);
};

const handleSubmit = async () => {
  const validate = formRef.value?.validate;
  const valid = validate
    ? await validate()
        .then(() => true)
        .catch(() => false)
    : false;
  if (!valid) {
    return;
  }

  const request = isEditMode.value ? fetchUpdateDict : fetchSaveDict;
  const successText = isEditMode.value ? "保存成功" : "新增成功";
  const failureText = isEditMode.value ? "保存失败" : "新增失败";

  submitting.value = true;
  try {
    const payload = {
      ...form.value,
      sysDictPid: form.value.sysDictPid ?? 0,
    };
    const res = (await request(payload)) as any;
    if (res && typeof res === "object" && "code" in res && res.code === "00000") {
      const nextDict =
        res.data && typeof res.data === "object"
          ? { ...payload, ...res.data }
          : payload;
      message.success(successText);
      emit("success", props.mode, nextDict);
      handleClose();
      return;
    }
    message.error(
      res && typeof res === "object" && "msg" in res ? (res.msg as string) || failureText : failureText,
    );
  } catch {
    message.error(failureText);
  } finally {
    submitting.value = false;
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
  () => props.dictData,
  () => {
    if (dialogVisible.value) {
      syncForm();
    }
  },
  { deep: true },
);
</script>

<template>
  <sc-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="560px"
    top="5vh"
    draggable
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="dict-save-dialog"
    @close="handleClose"
  >
    <ScForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="dict-save-form"
    >
      <div class="form-grid">
        <ScFormItem label="字典分类名称" prop="sysDictName">
          <ScInput
            v-model="form.sysDictName"
            clearable
            placeholder="请输入字典分类名称"
          />
        </ScFormItem>
        <ScFormItem label="字典分类编码" prop="sysDictCode">
          <ScInput
            v-model="form.sysDictCode"
            clearable
            placeholder="请输入字典分类编码"
          />
        </ScFormItem>
        <ScFormItem label="国际化标识">
          <ScInput
            v-model="form.sysDictI18n"
            clearable
            placeholder="请输入 i18n 标识"
          />
        </ScFormItem>
        <ScFormItem label="排序" prop="sysDictSort">
          <ScInputNumber
            v-model="form.sysDictSort"
            :min="1"
            :max="9999"
            class="w-full"
          />
        </ScFormItem>
      </div>

      <ScFormItem label="启用状态">
        <ScSwitch
          v-model="form.sysDictStatus"
          :active-value="1"
          :inactive-value="0"
          inline-prompt
          active-text="启用"
          inactive-text="停用"
        />
      </ScFormItem>

      <ScFormItem label="备注">
        <ScInput
          v-model="form.sysDictRemark"
          type="textarea"
          :rows="4"
          maxlength="200"
          show-word-limit
          placeholder="请输入备注信息"
        />
      </ScFormItem>
    </ScForm>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="handleClose">取消</ScButton>
        <ScButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ isEditMode ? "保存" : "新增" }}
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>

<style lang="scss">
.dict-save-form {
  padding-top: 8px;
}

.dict-save-dialog {
  max-height: 90vh;
  overflow: hidden;

  .el-dialog__body {
    max-height: calc(90vh - 176px);
    overflow-y: auto;
    padding-right: 20px;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
