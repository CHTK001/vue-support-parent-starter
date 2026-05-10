<template>
  <ScDialog
    :model-value="modelValue"
    :title="isEditing ? '编辑商户' : '新增商户'"
    width="900px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="pm-dialog-shell">
      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>基础信息</h3>
            <p>填写商户主体信息和联系方式，商户能力与订单规则请在「商户设置」中配置。</p>
          </div>
        </div>
        <el-form label-width="112px">
          <div class="pm-form-grid">
            <el-form-item label="商户名称" required>
              <el-input v-model="form.merchantName" placeholder="例如：演示商城" />
            </el-form-item>
            <el-form-item label="联系人">
              <el-input v-model="form.contactName" placeholder="例如：张三" />
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="form.contactPhone" placeholder="例如：13800000000" />
            </el-form-item>
            <el-form-item label="联系邮箱">
              <el-input v-model="form.contactEmail" placeholder="例如：merchant@example.com" />
            </el-form-item>
            <el-form-item label="营业执照">
              <el-input v-model="form.businessLicense" placeholder="可选" />
            </el-form-item>
            <el-form-item label="法人">
              <el-input v-model="form.legalPerson" placeholder="可选" />
            </el-form-item>
            <el-form-item label="备注" class="pm-form-span-2">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="记录商户接入说明、负责人和运维备注" />
            </el-form-item>
          </div>
        </el-form>
      </section>
    </div>

    <template #footer>
      <div class="pm-dialog-footer">
        <ScButton @click="emit('update:modelValue', false)">取消</ScButton>
        <ScButton type="primary" :loading="saving" @click="handleSave">保存</ScButton>
      </div>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { ElMessage } from "element-plus";
import type { Merchant } from "../../types/payment";
import { createMerchantForm } from "./merchant";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    merchant?: Merchant | null;
    saving?: boolean;
  }>(),
  { merchant: null, saving: false }
);

const emit = defineEmits<{
  (e: "update:modelValue", val: boolean): void;
  (e: "saved", formData: Record<string, unknown>): void;
}>();

const isEditing = computed(() => !!props.merchant?.id);

const form = reactive(createMerchantForm());

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const src = props.merchant;
    if (src && src.id) {
      Object.assign(form, createMerchantForm(), src);
    } else {
      Object.assign(form, createMerchantForm());
    }
  }
);

function handleSave() {
  if (!form.merchantName.trim()) {
    ElMessage.error("商户名称不能为空");
    return;
  }
  emit("saved", { ...form });
}
</script>

<style scoped>
</style>
