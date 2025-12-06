<template>
  <el-dialog
    v-model="dialogVisible"
    title="申请证书"
    width="600px"
    :close-on-click-modal="false"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-form-item label="ACME账户" prop="acmeAccountId">
        <el-select
          v-model="form.acmeAccountId"
          placeholder="请选择ACME账户"
          style="width: 100%"
        >
          <el-option
            v-for="item in accountList"
            :key="item.acmeAccountId"
            :label="item.acmeAccountEmail"
            :value="item.acmeAccountId"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="主域名" prop="primaryDomain">
        <el-input
          v-model="form.primaryDomain"
          placeholder="如: example.com 或 *.example.com"
        />
      </el-form-item>
      <el-form-item label="备用域名">
        <el-select
          v-model="form.sanDomains"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="输入后回车添加备用域名（可选）"
          style="width: 100%"
        >
        </el-select>
        <div class="form-tip">
          支持添加多个备用域名（SAN），输入后按回车添加
        </div>
      </el-form-item>
      <el-form-item label="验证类型" prop="challengeType">
        <el-radio-group v-model="form.challengeType">
          <el-radio
            v-for="item in CHALLENGE_TYPES"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-alert
        v-if="form.challengeType === 'HTTP-01'"
        title="HTTP-01 验证说明"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>需要在域名的Web服务器上放置验证文件：</p>
          <p><code>http://域名/.well-known/acme-challenge/TOKEN</code></p>
        </template>
      </el-alert>
      <el-alert
        v-if="form.challengeType === 'DNS-01'"
        title="DNS-01 验证说明"
        type="info"
        :closable="false"
        show-icon
      >
        <template #default>
          <p>需要在DNS添加TXT记录：</p>
          <p><code>_acme-challenge.域名 TXT 验证值</code></p>
        </template>
      </el-alert>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        申请证书
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  getAccountList,
  applyCert,
  CHALLENGE_TYPES,
  type AcmeAccount,
  type ApplyCertRequest,
} from "@/api/acme";

defineOptions({
  name: "ApplyCertDialog",
});

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit("update:visible", val),
});

const formRef = ref<FormInstance>();
const submitting = ref(false);
const accountList = ref<AcmeAccount[]>([]);

const form = reactive<ApplyCertRequest>({
  acmeAccountId: 0,
  primaryDomain: "",
  sanDomains: [],
  challengeType: "HTTP-01",
});

const rules: FormRules = {
  acmeAccountId: [
    { required: true, message: "请选择ACME账户", trigger: "change" },
  ],
  primaryDomain: [
    { required: true, message: "请输入主域名", trigger: "blur" },
    {
      pattern:
        /^(\*\.)?[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/,
      message: "请输入有效的域名格式",
      trigger: "blur",
    },
  ],
  challengeType: [
    { required: true, message: "请选择验证类型", trigger: "change" },
  ],
};

/**
 * 加载账户列表
 */
async function loadAccounts() {
  try {
    const res = (await getAccountList()) as unknown as { data: AcmeAccount[] };
    accountList.value = res.data || [];
  } catch (error) {
    console.error("加载账户列表失败", error);
  }
}

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) return;

  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    await applyCert(form);
    ElMessage.success("证书申请已提交，请完成域名验证");
    dialogVisible.value = false;
    emit("success");
  } catch (error) {
    ElMessage.error("申请失败");
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      form.acmeAccountId = 0;
      form.primaryDomain = "";
      form.sanDomains = [];
      form.challengeType = "HTTP-01";
      formRef.value?.clearValidate();
      loadAccounts();
    }
  }
);

onMounted(() => {
  loadAccounts();
});
</script>

<style scoped lang="scss">
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}
</style>
