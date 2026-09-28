<script setup lang="ts">
/**
 * Redis STREAM 值查看器（类型化详情组件）
 *
 * <p>按消息展示字段；新增消息由父级弹窗（JSON 消息体）完成后触发 refresh。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { ref, watch } from "vue";
import type { RedisField, RedisManageKeyDetail, RedisStreamMsg } from "../../redisManageApi";
import "./redis-value.css";

const props = defineProps<{
  /** 数据源 ID（保留，供后续元素级操作扩展） */
  datasourceId: number;
  /** 逻辑库 */
  db: number;
  /** 键名 */
  redisKey: string;
  /** 键详情 */
  detail: RedisManageKeyDetail;
}>();

defineEmits<{ (e: "refresh"): void; (e: "add"): void }>();

const messages = ref<RedisStreamMsg[]>([]);

watch(
  () => props.detail,
  d => {
    messages.value = [];
    const raw = d?.value;
    if (d?.type === "STREAM" && Array.isArray(raw)) {
      messages.value = raw as RedisStreamMsg[];
    }
  },
  { immediate: true },
);

/**
 * 字段值展示（对象/数组序列化）
 * @param f 字段
 */
function fieldText(f: RedisField): string {
  return f.value;
}
</script>

<template>
  <div class="rv">
    <div class="rv-bar">
      <span class="rv-count">流消息（共 {{ messages.length }} 条）</span>
      <span class="rv-spacer" />
      <ReButton icon="Plus" :show-text="true" type="primary" @click="$emit('add')">添加消息</ReButton>
    </div>
    <div class="rv-msgs">
      <div v-for="msg in messages" :key="msg.id" class="rv-msg">
        <div class="rv-msgid">{{ msg.id }}</div>
        <div v-for="f in msg.fields" :key="f.field" class="rv-field">
          <span class="rv-fname">{{ f.field }}</span>
          <span class="rv-fvalue">{{ fieldText(f) }}</span>
        </div>
      </div>
      <ReEmpty v-if="messages.length === 0" description="暂无消息" :image-size="40" />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 基础样式见共享 redis-value.css，这里只放 STREAM 消息卡片样式 */
.rv-msgs { display: flex; flex-direction: column; gap: 8px; }
.rv-msg {
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-extra-light, var(--el-fill-color-light));
}
.rv-msgid {
  margin-bottom: 4px;
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12px;
  color: var(--el-color-primary);
}
.rv-field { display: flex; gap: 8px; font-size: 12px; }
.rv-fname { min-width: 90px; color: var(--el-text-color-placeholder); }
.rv-fvalue {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  color: var(--el-text-color-primary);
  word-break: break-all;
}
</style>
