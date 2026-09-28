<script setup lang="ts">
/**
 * Redis HASH 值编辑器（类型化详情组件）
 *
 * <p>字段表编辑器：表头 + 行级内联编辑，改动行高亮并显示保存按钮；
 * 字段较多时提供筛选；底部常驻「新字段/新值」追加行。保存=先删旧字段再写新字段。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { redisHashDel, redisHashSet, type RedisManageKeyDetail } from "../../redisManageApi";
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

interface HashRow {
  field: string;
  value: string;
  originalField: string;
  originalValue: string;
}

const rows = ref<HashRow[]>([]);
const filter = ref("");
const newField = ref("");
const newValue = ref("");
const busy = ref(false);

watch(
  () => props.detail,
  d => {
    rows.value = [];
    const raw = d?.value;
    if (d?.type === "HASH" && raw && typeof raw === "object" && !Array.isArray(raw)) {
      rows.value = Object.entries(raw as Record<string, unknown>).map(([field, value]) => ({
        field,
        value: String(value),
        originalField: field,
        originalValue: String(value),
      }));
    }
  },
  { immediate: true },
);

/** 是否改动（字段名或值） */
const isDirty = (row: HashRow): boolean =>
  row.field !== row.originalField || row.value !== row.originalValue;

/** 筛选后的行（字段名/值包含关键字） */
const visibleRows = computed<HashRow[]>(() => {
  const kw = filter.value.trim().toLowerCase();
  if (!kw) return rows.value;
  return rows.value.filter(r => r.field.toLowerCase().includes(kw) || r.value.toLowerCase().includes(kw));
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

/** 新增字段 */
function addRow(): void {
  const field = newField.value.trim();
  if (!field) return;
  const value = newValue.value;
  newField.value = "";
  newValue.value = "";
  void run(() => redisHashSet(props.datasourceId, props.db, props.redisKey, field, value), "保存字段");
}

/** 保存字段（重命名时先删旧字段） */
function saveRow(row: HashRow): void {
  if (!isDirty(row)) return;
  void run(async () => {
    if (row.field !== row.originalField) {
      await redisHashDel(props.datasourceId, props.db, props.redisKey, row.originalField);
    }
    await redisHashSet(props.datasourceId, props.db, props.redisKey, row.field, row.value);
  }, "保存字段");
}

/** 删除字段 */
function delRow(row: HashRow): void {
  void run(() => redisHashDel(props.datasourceId, props.db, props.redisKey, row.originalField), "删除字段");
}
</script>

<template>
  <div class="rv">
    <div class="rv-bar">
      <span class="rv-count">{{ rows.length }} 个字段</span>
      <span class="rv-spacer" />
      <ReInput
        v-if="rows.length > 8"
        v-model="filter"

        placeholder="筛选字段"
        prefix-icon="Search"
        clearable
        style="width: 200px"
      />
    </div>

    <div class="rv-table">
      <div class="rv-thead">
        <span>字段</span>
        <span>值</span>
        <span class="rv-th-ops">操作</span>
      </div>
      <div v-for="row in visibleRows" :key="row.originalField" class="rv-tr" :class="{ dirty: isDirty(row) }">
        <ReInput v-model="row.field" class="rv-mono" />
        <ReInput v-model="row.value" class="rv-mono" @keyup.enter="saveRow(row)" />
        <div class="rv-ops">
          <ReButton
            icon="Check"
            layout="square"

            title="保存"
            :disabled="busy || !isDirty(row)"
            @click="saveRow(row)"
          />
          <ReButton icon="Delete" layout="square" type="danger" title="删除" :disabled="busy" @click="delRow(row)" />
        </div>
      </div>
      <div class="rv-tr rv-tr--add">
        <ReInput v-model="newField" placeholder="新字段" />
        <ReInput v-model="newValue" placeholder="新值" @keyup.enter="addRow" />
        <div class="rv-ops">
          <ReButton icon="Plus" layout="square" type="primary" title="添加" :disabled="busy" @click="addRow" />
        </div>
      </div>
    </div>

    <ReEmpty v-if="rows.length === 0" description="暂无字段" :image-size="40" />
  </div>
</template>

<style scoped lang="scss">
/* 基础样式见共享 redis-value.css，这里只放 HASH 表格专属列宽 */
.rv-thead,
.rv-tr { grid-template-columns: 1fr 1.4fr 84px; }
.rv-th-ops { text-align: center; }
.rv-ops { justify-content: center; }
</style>
