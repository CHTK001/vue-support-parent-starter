<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { message } from "@repo/core";
import {
  saveAccount,
  ACME_SERVER_GROUPS,
  isEabRequired,
  type AcmeAccount,
} from "../../../api/acmeApi";

const props = defineProps<{
  modelValue: boolean;
  account?: AcmeAccount | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  success: [];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const submitting = ref(false);
const form = reactive<AcmeAccount>({
  acmeAccountId: undefined,
  acmeAccountEmail: "",
  acmeAccountServer: "https://acme-v02.api.letsencrypt.org/directory",
  acmeAccountProviderType: "acme",
  acmeAccountEabKid: "",
  acmeAccountEabHmacKey: "",
  acmeAccountRemark: "",
});

const isEdit = computed(() => form.acmeAccountId != null);
const showEab = computed(() => isEabRequired(form.acmeAccountServer || ""));

watch(dialogVisible, (v) => {
  if (!v) return;
  const src = props.account;
  Object.assign(form, {
    acmeAccountId: src?.acmeAccountId,
    acmeAccountEmail: src?.acmeAccountEmail ?? "",
    acmeAccountServer: src?.acmeAccountServer || "https://acme-v02.api.letsencrypt.org/directory",
    acmeAccountProviderType: src?.acmeAccountProviderType || "acme",
    acmeAccountEabKid: src?.acmeAccountEabKid ?? "",
    acmeAccountEabHmacKey: src?.acmeAccountEabHmacKey ?? "",
    acmeAccountRemark: src?.acmeAccountRemark ?? "",
  });
});

function validate(): string {
  if (!form.acmeAccountEmail.trim()) return "请填写邮箱";
  if (!form.acmeAccountServer.trim()) return "请选择 ACME 服务商";
  if (showEab.value && (!form.acmeAccountEabKid?.trim() || !form.acmeAccountEabHmacKey?.trim())) {
    return "该服务商需要 EAB Key ID 与 HMAC Key";
  }
  return "";
}

async function submit(): Promise<void> {
  const err = validate();
  if (err) {
    message.warning(err);
    return;
  }
  submitting.value = true;
  try {
    await saveAccount({
      ...form,
      acmeAccountEmail: form.acmeAccountEmail.trim(),
      acmeAccountServer: form.acmeAccountServer.trim(),
      acmeAccountRemark: form.acmeAccountRemark?.trim() || undefined,
    });
    message.success(isEdit.value ? "ACME 账户已更新" : "ACME 账户已创建");
    dialogVisible.value = false;
    emit("success");
  } catch (e) {
    message.error(String((e as Error)?.message ?? e));
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑 ACME 账户' : '添加 ACME 账户'" width="560px" append-to-body :close-on-click-modal="false">
    <el-form label-width="120px">
      <el-form-item label="邮箱" required>
        <el-input v-model="form.acmeAccountEmail" placeholder="example@domain.com" :disabled="isEdit" />
      </el-form-item>

      <el-form-item label="ACME 服务商" required>
        <el-select v-model="form.acmeAccountServer" filterable allow-create default-first-option placeholder="选择或输入 ACME 目录" style="width:100%">
          <el-option-group v-for="g in ACME_SERVER_GROUPS" :key="g.label" :label="g.label">
            <el-option v-for="s in g.options" :key="s.value" :value="s.value" :label="s.label">
              <span>{{ s.label }}</span>
              <el-tag v-if="s.eab" size="small" type="warning" effect="plain" style="margin-left:8px">EAB</el-tag>
            </el-option>
          </el-option-group>
        </el-select>
      </el-form-item>

      <template v-if="showEab">
        <el-alert type="warning" :closable="false" class="mb12">
          <template #title>该服务商需要 EAB 凭证，请从服务商控制台获取后填写。</template>
        </el-alert>
        <el-form-item label="EAB Key ID">
          <el-input v-model="form.acmeAccountEabKid" placeholder="EAB Key ID (KID)" />
        </el-form-item>
        <el-form-item label="EAB HMAC Key">
          <el-input v-model="form.acmeAccountEabHmacKey" type="password" show-password placeholder="EAB HMAC Key (Base64)" />
        </el-form-item>
      </template>

      <el-form-item label="备注">
        <el-input v-model="form.acmeAccountRemark" type="textarea" :rows="2" placeholder="可选" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.mb12 {
  margin-bottom: 12px;
}
</style>