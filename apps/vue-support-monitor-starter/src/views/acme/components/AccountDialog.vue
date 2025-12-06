<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑账户' : '添加账户'"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="邮箱" prop="acmeAccountEmail">
        <el-input
          v-model="form.acmeAccountEmail"
          placeholder="请输入邮箱地址"
          :disabled="isEdit"
        />
      </el-form-item>
      <el-form-item label="ACME服务器" prop="acmeAccountServer">
        <el-select
          v-model="form.acmeAccountServer"
          placeholder="请选择ACME服务器"
          style="width: 100%"
        >
          <el-option
            v-for="item in ACME_SERVERS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="form.acmeAccountRemark"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息（可选）"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { saveAccount, ACME_SERVERS, type AcmeAccount } from "@/api/acme";

defineOptions({
  name: "AccountDialog",
});

const props = defineProps<{
  visible: boolean;
  account?: AcmeAccount;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const isEdit = computed(() => !!props.account?.acmeAccountId);

const formRef = ref<FormInstance>();
const submitting = ref(false);

const form = reactive<AcmeAccount>({
  acmeAccountEmail: "",
  acmeAccountServer: "",
  acmeAccountRemark: "",
});

const rules: FormRules = {
  acmeAccountEmail: [
    { required: true, message: "请输入邮箱地址", trigger: "blur" },
    { type: "email", message: "请输入有效的邮箱地址", trigger: "blur" },
  ],
  acmeAccountServer: [
    { required: true, message: "请选择ACME服务器", trigger: "change" },
  ],
};

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await saveAccount({
      ...form,
      acmeAccountId: props.account?.acmeAccountId,
    });
    ElMessage.success(isEdit.value ? "保存成功" : "添加成功");
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    ElMessage.error("保存失败");
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      if (props.account) {
        Object.assign(form, props.account);
      } else {
        form.acmeAccountEmail = "";
        form.acmeAccountServer = ACME_SERVERS[0].value;
        form.acmeAccountRemark = "";
      }
      formRef.value?.clearValidate();
    }
  }
);
</script>
