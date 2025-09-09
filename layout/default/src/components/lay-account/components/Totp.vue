<script setup lang="ts">
import { nextTick, reactive, ref } from "vue";
import { fetchBindTotp, fetchUnbindTotp, fetchGetTotpUri } from "@repo/core";
import { deviceDetection } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import Password from "./password.vue";
import Profile from "./Profile.vue";
import { message } from "@repo/utils";
import QrcodeVue from "qrcode.vue";

const { t } = useI18n();

defineOptions({
  name: "AccountManagement",
});

const props = defineProps({
  userInfo: {
    type: Object,
  },
});
const visible = reactive({
  phone: false,
  email: false,
});

const widthValue = 150;
const title = ref("");

async function handleGetToptUri() {
  const { data } = await fetchGetTotpUri();
  title.value = data as any;
}
async function handleUpdateTopt() {
  fetchBindTotp().then((res) => {
    if (res.code == "00000") {
      message(t("message.updateSuccess"), { type: "success" });
      handleGetToptUri();
      return;
    }
    message(res.msg, { type: "error" });
  });
}
async function handleCloseTopt() {
  fetchUnbindTotp().then((res) => {
    if (res.code == "00000") {
      message(t("message.updateSuccess"), { type: "success" });
      title.value = null;
      return;
    }
    message(res.msg, { type: "error" });
  });
}
</script>

<template>
  <div :class="['min-w-[180px]', deviceDetection() ? 'max-w-[100%]' : 'max-w-[70%]']">
    <el-dialog v-if="visible.phone" v-model="visible.phone" draggable :title="title">
      <password :show-title="false" />
    </el-dialog>
    <el-dialog v-if="visible.email" v-model="visible.email" draggable :title="title">
      <profile :show-title="false" />
    </el-dialog>
    <div>
      <div class="flex items-center">
        <div class="flex-1">
          <p>{{ $t("buttons.totp") }}</p>
        </div>
        <el-button type="primary" text @click="handleUpdateTopt">
          {{ $t("buttons.update") }}
        </el-button>
        <el-button type="primary" text @click="handleCloseTopt">
          {{ $t("buttons.close") }}
        </el-button>
      </div>
      <el-divider />
      <div class="flex-1" v-if="title">
        <qrcode-vue :value="title" :size="widthValue" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.el-divider--horizontal {
  border-top: 0.1px var(--el-border-color) var(--el-border-style);
}
</style>
