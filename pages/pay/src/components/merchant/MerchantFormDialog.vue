<template>
  <ScDialog
    :model-value="modelValue"
    :title="isEditing ? '编辑商户' : '新增商户'"
    width="900px"
    destroy-on-close
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="pm-dialog-shell">
      <PmStatusStrip>
        <PmStatusCard label="商户主体" :hint="'建议使用业务侧可识别的主体名称。'">
          <template #value>{{ form.merchantName || '待填写' }}</template>
        </PmStatusCard>
        <PmStatusCard label="统一结果回调" :hint="'支付、转账、退款默认共用。'">
          <template #value>{{ form.defaultNotifyUrl || '未配置' }}</template>
        </PmStatusCard>
        <PmStatusCard label="浏览器回跳" :hint="'H5 / 收银台支付成功后的前端回跳地址。'">
          <template #value>{{ form.defaultReturnUrl || '未配置' }}</template>
        </PmStatusCard>
      </PmStatusStrip>

      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>基础信息</h3>
            <p>先完成主体信息和商户级默认回调，再根据渠道逐项覆盖。</p>
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
            <el-form-item label="统一结果回调" class="pm-form-span-2">
              <el-input v-model="form.defaultNotifyUrl" placeholder="支付、转账、退款默认共用；渠道级 notifyUrl 可覆盖" />
              <div class="pm-helper">支付、转账、退款默认共用；若某个支付方式单独配置了结果回调，则以支付方式自身配置为准。</div>
            </el-form-item>
            <el-form-item label="支付完成回跳" class="pm-form-span-2">
              <el-input v-model="form.defaultReturnUrl" placeholder="浏览器/H5/收银台支付完成后前端回跳地址" />
              <div class="pm-helper">仅用于浏览器可见的支付场景，接口调用类支付一般不需要填写。</div>
            </el-form-item>
            <el-form-item label="备注" class="pm-form-span-2">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="记录商户接入说明、负责人和运维备注" />
            </el-form-item>
          </div>
        </el-form>
      </section>

      <section class="pm-section">
        <div class="pm-section__head">
          <div>
            <h3>商户能力</h3>
            <p>采用卡片模式直接切换，避免在长表单里来回找开关。</p>
          </div>
        </div>
        <div class="capability-card-grid">
          <button
            v-for="item in buildMerchantCapabilityCards(form)"
            :key="item.key"
            type="button"
            class="capability-card-hit"
            @click="toggleMerchantCapability(form, item.key)"
          >
            <ScCard
              layout="compact"
              hoverable
              :active="item.active"
              :title="item.title"
              :subtitle="item.subtitle"
              :icon="item.icon"
              :theme="item.theme"
              class="capability-card"
            >
              <div class="capability-card__meta">
                <span>{{ item.description }}</span>
                <el-tag :type="item.tagType" effect="plain">{{ item.active ? '已开启' : '已关闭' }}</el-tag>
              </div>
            </ScCard>
          </button>
        </div>
        <el-form label-width="112px">
          <el-form-item label="自动关单分钟">
            <el-input-number v-model="form.paymentAutoCloseMinutes" :min="1" :max="1440" :disabled="!form.paymentAutoCloseEnabled" />
          </el-form-item>
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
import { buildMerchantCapabilityCards, createMerchantForm, toggleMerchantCapability } from "./merchant";
import type { MerchantCapabilityKey, MerchantCapabilityState } from "./merchant";
import PmStatusStrip from "../layout/PmStatusStrip.vue";
import PmStatusCard from "../layout/PmStatusCard.vue";

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
.capability-card-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.capability-card-hit {
  position: relative;
  cursor: pointer;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
}

.capability-card {
  min-height: 148px;
}

.capability-card :deep(.sc-card-compact__body) {
  padding-top: 0;
}

.capability-card__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #667085;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .capability-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
