<script setup lang="ts">
import { ref, defineProps, reactive, nextTick } from "vue";
import { message } from "@/utils/message";
import { deviceDetection } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import { des } from "@/utils/objects";
import Password from "./password.vue";
import Profile from "./Profile.vue";

const { t } = useI18n();

defineOptions({
  name: "AccountManagement"
});

const props = defineProps({
  userInfo: {
    type: Object
  }
});
const visible = reactive({
  phone: false,
  email: false
});

const title = ref("");
const list = ref([
  {
    title: t("title.phone"),
    illustrate: props.userInfo.sysUserPhone
      ? t("message.bindPhone") + "：" + des(props.userInfo.sysUserPhone)
      : t("message.unbindPhone"),
    button: t("button.update"),
    type: "phone"
  },
  {
    title: t("title.email2"),
    illustrate: props.userInfo.sysUserEmail
      ? t("message.bindEmail") + "：" + des(props.userInfo.sysUserEmail)
      : t("message.unbindEmail"),
    button: t("button.update"),
    type: "email"
  }
]);

async function onClick(item) {
  visible[item.type] = true;
  title.value = item.title;
  await nextTick();
}
</script>

<template>
  <div
    :class="[
      'min-w-[180px]',
      deviceDetection() ? 'max-w-[100%]' : 'max-w-[70%]'
    ]"
  >
    <el-dialog
      v-if="visible.phone"
      v-model="visible.phone"
      draggable
      :title="title"
    >
      <password :show-title="false" />
    </el-dialog>
    <el-dialog
      v-if="visible.email"
      v-model="visible.email"
      draggable
      :title="title"
    >
      <profile :show-title="false" />
    </el-dialog>
    <h3 class="my-8">{{ $t("button.AccountManagement") }}</h3>
    <div v-for="(item, index) in list" :key="index">
      <div class="flex items-center">
        <div class="flex-1">
          <p>{{ item.title }}</p>
          <el-text class="mx-1" type="info">{{ item.illustrate }}</el-text>
        </div>
        <el-button type="primary" text @click="onClick(item)">
          {{ item.button }}
        </el-button>
      </div>
      <el-divider />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.el-divider--horizontal {
  border-top: 0.1px var(--el-border-color) var(--el-border-style);
}
</style>
