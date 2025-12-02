<template>
  <div class="sc-mail-input">
    <!-- 邮件配置表单 -->
    <el-form :model="mailConfig" label-position="top" class="mail-form">
      <el-form-item label="SMTP服务器">
        <el-input
          v-model="mailConfig.host"
          placeholder="例如: smtp.example.com"
          :disabled="disabled"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:connection" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="端口">
        <el-input-number
          v-model="mailConfig.port"
          :min="1"
          :max="65535"
          placeholder="例如: 465 或 587"
          :disabled="disabled"
          class="port-input"
        />
      </el-form-item>

      <el-form-item label="用户名">
        <el-input
          v-model="mailConfig.username"
          placeholder="邮箱账号"
          :disabled="disabled"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:user" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="密码">
        <el-input
          v-model="mailConfig.password"
          type="password"
          placeholder="邮箱密码或授权码"
          :disabled="disabled"
          show-password
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:lock" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="发件人">
        <el-input
          v-model="mailConfig.from"
          placeholder="发件人邮箱"
          :disabled="disabled"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:message" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="安全连接">
        <ScSwitch
          v-model="mailConfig.secure"
          :disabled="disabled"
          active-text="启用SSL/TLS"
          inactive-text="不启用"
          layout="modern"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";

/**
 * 组件属性定义
 */
interface Props {
  modelValue: string; // 绑定值
  disabled?: boolean; // 是否禁用
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "{}",
  disabled: false,
});

/**
 * 组件事件定义
 */
const emit = defineEmits(["update:modelValue"]);

/**
 * 邮件配置对象
 */
const mailConfig = ref({
  host: "",
  port: 465,
  secure: true,
  username: "",
  password: "",
  from: "",
});

/**
 * 初始化邮件配置
 */
const initMailConfig = () => {
  try {
    const config = JSON.parse(props.modelValue);
    mailConfig.value = {
      host: config.host || "",
      port: config.port || 465,
      secure: config.secure !== undefined ? config.secure : true,
      username: config.username || "",
      password: config.password || "",
      from: config.from || "",
    };
  } catch (e) {
    // 如果解析失败，使用默认值
    mailConfig.value = {
      host: "",
      port: 465,
      secure: true,
      username: "",
      password: "",
      from: "",
    };
  }
};

/**
 * 监听配置变化，更新JSON字符串
 */
watch(
  mailConfig,
  (val) => {
    const jsonString = JSON.stringify(val);
    emit("update:modelValue", jsonString);
  },
  { deep: true }
);

/**
 * 监听modelValue变化，更新邮件配置
 */
watch(
  () => props.modelValue,
  () => {
    initMailConfig();
  }
);

// 初始化
initMailConfig();
</script>

<style lang="scss">
.sc-mail-input {
  .mail-form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;

    .el-form-item {
      margin-bottom: 0;

      &:nth-child(1),
      &:nth-child(5),
      &:nth-child(6) {
        grid-column: span 2;
      }
    }

    .port-input {
      width: 100%;
    }
  }
}
</style>
