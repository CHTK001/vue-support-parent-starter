<template>
  <section class="notification-panel">
    <div class="row">
      <span>通知渠道</span>
      <div class="chips">
        <label v-for="item in channels" :key="item.value">
          <input
            type="checkbox"
            :checked="state.channels.includes(item.value)"
            @change="toggleArrayValue('channels', item.value)"
          />
          {{ item.label }}
        </label>
      </div>
    </div>
    <div class="row">
      <span>接收人</span>
      <textarea
        rows="2"
        :value="state.receivers"
        @input="update('receivers', ($event.target as HTMLTextAreaElement).value)"
        placeholder="多名接收人用逗号分隔"
      />
    </div>
    <div class="row">
      <span>通知时机</span>
      <div class="chips">
        <label v-for="item in triggers" :key="item.value">
          <input
            type="checkbox"
            :checked="state.triggers.includes(item.value)"
            @change="toggleArrayValue('triggers', item.value)"
          />
          {{ item.label }}
        </label>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ modelValue?: Record<string, any> }>();
const emit = defineEmits<{ (event: "update:modelValue", value: Record<string, any>): void }>();

const channels = [
  { label: "站内消息", value: "site" },
  { label: "邮件", value: "email" },
  { label: "短信", value: "sms" },
  { label: "Webhook", value: "webhook" },
];

const triggers = [
  { label: "执行成功", value: "onSuccess" },
  { label: "执行失败", value: "onFailure" },
  { label: "人工介入", value: "onWaitingInput" },
];

const state = computed(() => ({
  channels: Array.isArray(props.modelValue?.channels) ? props.modelValue?.channels : ["site"],
  triggers: Array.isArray(props.modelValue?.triggers) ? props.modelValue?.triggers : ["onFailure"],
  receivers: props.modelValue?.receivers || "",
}));

const update = (key: string, value: any) => {
  emit("update:modelValue", {
    ...(props.modelValue || {}),
    [key]: value,
  });
};

const toggleArrayValue = (key: "channels" | "triggers", value: string) => {
  const source = Array.isArray((props.modelValue || {})[key])
    ? [...(props.modelValue as any)[key]]
    : [];
  const index = source.findIndex((item: string) => item === value);
  if (index >= 0) {
    source.splice(index, 1);
  } else {
    source.push(value);
  }
  update(key, source);
};
</script>

<style scoped lang="scss">
.notification-panel {
  display: grid;
  gap: 10px;
}

.row {
  display: grid;
  gap: 6px;
}

span {
  font-size: 12px;
  color: #516071;
}

textarea {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 10px;
  padding: 8px 10px;
  font: inherit;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chips label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}
</style>
