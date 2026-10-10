<script setup lang="ts">
/**
 * 提供商新增/编辑弹窗组件
 *
 * 通过 v-model:visible 控制显隐，v-model:model 绑定当前行数据。
 * 厂家编码改为从后端 SPI 渠道列表下拉选择，避免手填错误；
 * 选择渠道后自动推导提供商类型。
 * 保存成功后通过 save 事件通知父组件刷新列表。
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref, watch } from "vue";

import type { FormInstance, FormRules } from "element-plus";
import { listChannels, saveProvider, updateProvider } from "../api/messageApi";
import type { MessageProvider } from "../api/types";
import ReDialog from "@repo/ui/re-dialog";

const visible = defineModel<boolean>("visible", { required: true });

const model = defineModel<MessageProvider>("model", { required: true });

const emit = defineEmits<{
  (e: "save"): void;
}>();

const saving = ref(false);
const formRef = ref<FormInstance>();

// 已注册渠道列表（SPI 标识 → 提供商类型映射）
const channels = ref<{ value: string; type: string; label: string }[]>([]);

// 渠道标识 → 默认提供商类型
const CHANNEL_TYPE_MAP: Record<string, string> = {
  email: "EMAIL",
  smtp: "EMAIL",
  "alibaba-sms": "SMS",
  "tencent-sms": "SMS",
  "baidu-sms": "SMS",
  sms: "SMS",
  dingding: "DINGDING",
  feishu: "FEISHU",
  wechat: "WECHAT",
  desktop: "DESKTOP",
};

// 渠道标识 → 中文名称
const CHANNEL_LABEL_MAP: Record<string, string> = {
  email: "邮件",
  smtp: "邮件(SMTP)",
  "alibaba-sms": "阿里云短信",
  "tencent-sms": "腾讯云短信",
  "baidu-sms": "百度云短信",
  sms: "短信",
  dingding: "钉钉",
  feishu: "飞书",
  wechat: "微信",
  desktop: "桌面通知",
};

const rules = reactive<FormRules>({
  sysMessageProviderCode: [
    { required: true, message: "请输入提供商编码", trigger: "blur" },
  ],
  sysMessageProviderName: [
    { required: true, message: "请输入提供商名称", trigger: "blur" },
  ],
  sysMessageProviderVender: [
    { required: true, message: "请选择消息渠道", trigger: "change" },
  ],
  sysMessageProviderType: [
    { required: true, message: "请选择提供商类型", trigger: "change" },
  ],
});

const isEdit = ref(false);

// 打开弹窗时根据 model 判断新增/编辑
watch(
  () => visible.value,
  (open) => {
    if (open) {
      isEdit.value = !!model.value?.sysMessageProviderId;
    }
  },
);

/** 选择渠道后自动推导提供商类型 */
function handleChannelChange() {
  const channel = model.value?.sysMessageProviderVender;
  const type = channel ? CHANNEL_TYPE_MAP[channel.toLowerCase()] : undefined;
  if (type) {
    model.value!.sysMessageProviderType = type;
  }
}

/** 加载渠道列表 */
async function loadChannels() {
  const res = await listChannels();
  const list = res?.data ?? [];
  channels.value = list.map((c) => {
    const channel = c.channel ?? "";
    const key = channel.toLowerCase();
    return {
      value: channel,
      type: c.type ?? CHANNEL_TYPE_MAP[key] ?? "OTHER",
      label: c.label
        ? `${c.label}（${channel}）`
        : `${CHANNEL_LABEL_MAP[key] ?? channel}（${channel}）`,
    };
  });
}

// 打开弹窗时若渠道列表为空则加载
watch(
  () => visible.value,
  (open) => {
    if (open && channels.value.length === 0) {
      loadChannels();
    }
  },
);

/** 保存 */
async function handleSave() {
  if (!formRef.value) return;
  await formRef.value.validate();
  saving.value = true;
  try {
    if (model.value?.sysMessageProviderId) {
      await updateProvider({ ...model.value });
    } else {
      await saveProvider({ ...model.value });
    }
    message.success(isEdit.value ? "更新成功" : "新增成功");
    visible.value = false;
    emit("save");
  } finally {
    saving.value = false;
  }
}

/** 是否为编辑模式且已填渠道（显示类型选择提示） */
const channelOptions = computed(() => {
  // 编辑模式下保留已有值
  const value = model.value?.sysMessageProviderVender;
  if (value && !channels.value.some((c) => c.value === value)) {
    return [
      { value, type: "OTHER", label: `${value}（${value}）` },
      ...channels.value,
    ];
  }
  return channels.value;
});

onMounted(loadChannels);
</script>

<template>
  <ReDialog
    v-model="visible"
    :title="isEdit ? '编辑提供商' : '新增提供商'"
    width="640px"
    destroy-on-close
  >
    <el-form ref="formRef" :model="model" :rules="rules" label-width="110px">
      <el-form-item label="提供商编码" prop="sysMessageProviderCode">
        <el-input v-model="model.sysMessageProviderCode" placeholder="如 aliyun-sms / smtp" />
      </el-form-item>
      <el-form-item label="提供商名称" prop="sysMessageProviderName">
        <el-input v-model="model.sysMessageProviderName" placeholder="提供商显示名称" />
      </el-form-item>
      <el-form-item label="消息渠道" prop="sysMessageProviderVender">
        <el-select
          v-model="model.sysMessageProviderVender"
          placeholder="请选择消息渠道"
          filterable
          class="!w-full"
          @change="handleChannelChange"
        >
          <el-option
            v-for="c in channelOptions"
            :key="c.value"
            :label="c.label"
            :value="c.value"
          />
        </el-select>
        <div class="mt-1 text-xs text-[--el-text-color-secondary]">
          渠道标识为后端已注册的推送渠道（SPI），一个厂家多模式可分别登记多条
        </div>
      </el-form-item>
      <el-form-item label="提供商类型" prop="sysMessageProviderType">
        <el-input v-model="model.sysMessageProviderType" placeholder="选择渠道后自动推导" />
      </el-form-item>
      <el-form-item label="应用ID">
        <el-input v-model="model.sysMessageProviderAppId" placeholder="用于 API 认证" />
      </el-form-item>
      <el-form-item label="应用密钥">
        <el-input
          v-model="model.sysMessageProviderAppSecret"
          type="password"
          show-password
          placeholder="用于 API 认证"
        />
      </el-form-item>
      <el-form-item label="签名">
        <el-input v-model="model.sysMessageProviderSign" placeholder="短信/接口签名" />
      </el-form-item>
      <el-form-item label="端点地址">
        <el-input v-model="model.sysMessageProviderEndpoint" placeholder="API 服务端点 URL" />
      </el-form-item>
      <el-form-item label="SMTP 主机">
        <el-input v-model="model.sysMessageProviderSmtpHost" placeholder="邮件服务器主机" />
      </el-form-item>
      <el-form-item label="SMTP 端口">
        <el-input-number v-model="model.sysMessageProviderSmtpPort" :min="1" :max="65535" />
      </el-form-item>
      <el-form-item label="SMTP 授权码">
        <el-input
          v-model="model.sysMessageProviderSmtpPassword"
          type="password"
          show-password
          placeholder="邮箱三方客户端授权码，非登录密码"
        />
      </el-form-item>
      <el-form-item label="SMTP 发件人">
        <el-input v-model="model.sysMessageProviderSmtpFrom" placeholder="发件人邮箱地址" />
      </el-form-item>
      <el-form-item label="Webhook 地址">
        <el-input v-model="model.sysMessageProviderWebhookUrl" placeholder="钉钉/飞书机器人地址" />
      </el-form-item>
      <el-form-item label="防抖间隔">
        <el-input-number
          v-model="model.sysMessageProviderInterval"
          :min="0"
          :max="10080"
          :precision="0"
          :default-value="1"
        />
        <div class="ml-2 text-xs text-[--el-text-color-secondary]">
          分钟，默认 1 分钟，0 表示不限制；间隔内同一接收人相同模板/内容不重复发送
        </div>
      </el-form-item>
      <el-form-item label="排序号">
        <el-input-number v-model="model.sysMessageProviderSort" :min="0" />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="model.sysMessageProviderRemark"
          type="textarea"
          :rows="2"
          placeholder="提供商用途说明"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </ReDialog>
</template>
