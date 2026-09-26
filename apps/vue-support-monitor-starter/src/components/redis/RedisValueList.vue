<script setup lang="ts">
/**
 * Redis LIST 值编辑器（类型化详情组件）
 *
 * <p>序列编辑器：行前圆形下标徽标、行级内联编辑/删除；底部固定「追加到尾部」输入条。
 * 元素较多时顶部提供筛选（仅展示，不改变下标）。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { redisListPush, redisListRem, redisListSet, type RedisManageKeyDetail } from "../../redisManageApi";
import "./redis-value.css";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId: number;
  /** 逻辑库 */
  db: number;
  /** 键名 */
  redisKey: string;
  /** 键详情 */
  detail: RedisManageKeyDetail;
}>();

const emit = defineEmits<{ (e: "refresh"): void }>();

interface ListRow {
  index: number;
  value: string;
  original: string;
}

const rows = ref<ListRow[]>([]);
const filter = ref("");
const newItem = ref("");
const busy = ref(false);

watch(
  () => props.detail,
  d => {
    rows.value = [];
    const raw = d?.value;
    if (d?.type === "LIST" && Array.isArray(raw)) {
      rows.value = raw.map((v, i) => ({ index: i, value: String(v), original: String(v) }));
    }
  },
  { immediate: true },
);

/** 是否改动 */
const isDirty = (row: ListRow): boolean => row.value !== row.original;

/** 筛选后的行（保留下标） */
const visibleRows = computed<ListRow[]>(() => {
  const kw = filter.value.trim().toLowerCase();
  if (!kw) return rows.value;
  return rows.value.filter(r => r.value.toLowerCase().includes(kw));
});

/** 统一执行元素操作并刷新详情 */
async function run(action: () => Promise<unknown>, label: string): Promise<void> {
  if (busy.value) return;
  busy.value = true;
  try {
    await action();
    ElMessage.success(`${label}成功`);
    emit("refresh");
  } catch (e) {
    ElMessage.error(`${label}失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    busy.value = false;
  }
}

/** 尾部追加元素 */
function addItem(): void {
  const value = newItem.value.trim();
  if (!value) return;
  newItem.value = "";
  void run(() => redisListPush(props.datasourceId, props.db, props.redisKey, value), "添加元素");
}

/** 按下标保存元素 */
function saveItem(row: ListRow): void {
  if (!isDirty(row)) return;
  void run(() => redisListSet(props.datasourceId, props.db, props.redisKey, row.index, row.value), "保存元素");
}

/** 按下标删除元素 */
function delItem(row: ListRow): void {
  void run(() => redisListRem(props.datasourceId, props.db, props.redisKey, row.index), "删除元素");
}
</script>

<template>
  <div class="rv">
    <div class="rv-bar">
      <span class="rv-count">{{ rows.length }} 个元素</span>
      <span class="rv-spacer" />
      <ReInput
        v-if="rows.length > 8"
        v-model="filter"
        size="small"
        placeholder="筛选元素"
        prefix-icon="Search"
        clearable
        style="width: 200px"
      />
    </div>

    <div class="rv-rows">
      <div v-for="row in visibleRows" :key="row.index" class="rv-row" :class="{ dirty: isDirty(row) }">
        <span class="rv-idx" :title="`下标 ${row.index}`">{{ row.index }}</span>
        <ReInput v-model="row.value" size="small" class="rv-mono" @keyup.enter="saveItem(row)" />
        <div class="rv-ops">
          <ReButton
            icon="Check"
            layout="square"
            size="small"
            title="保存"
            :disabled="busy || !isDirty(row)"
            @click="saveItem(row)"
          />
          <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" :disabled="busy" @click="delItem(row)" />
        </div>
      </div>
      <ReEmpty v-if="rows.length === 0" description="暂无元素" :image-size="40" />
    </div>

    <div class="rv-add">
      <span class="rv-add-label">追加到尾部</span>
      <ReInput v-model="newItem" size="small" placeholder="新元素" @keyup.enter="addItem" />
      <ReButton icon="Plus" type="primary" size="small" :show-text="true" :disabled="busy" @click="addItem">追加</ReButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 基础样式见共享 redis-value.css，这里只放 LIST 专属列宽 */
.rv-row { grid-template-columns: 44px 1fr 84px; }
.rv-ops { justify-content: center; }
</style>
