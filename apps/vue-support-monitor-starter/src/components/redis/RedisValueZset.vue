<script setup lang="ts">
/**
 * Redis ZSET 值编辑器（类型化详情组件）
 *
 * <p>排行榜编辑器：按分数降序展示，行前名次徽标（前三名高亮），成员/分数内联编辑；
 * 底部常驻「新成员 + 分数」追加条。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { redisZsetAdd, redisZsetRem, type RedisManageKeyDetail } from "../../redisManageApi";
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

interface ZsetRow {
  member: string;
  score: number;
  originalMember: string;
  originalScore: number;
}

const rows = ref<ZsetRow[]>([]);
const newMember = ref("");
const newScore = ref(0);
const busy = ref(false);

watch(
  () => props.detail,
  d => {
    rows.value = [];
    const raw = d?.value;
    if (d?.type === "ZSET" && Array.isArray(raw)) {
      rows.value = (raw as { member: string; score: number }[])
        .map(m => ({
          member: m.member,
          score: Number(m.score),
          originalMember: m.member,
          originalScore: Number(m.score),
        }))
        .sort((a, b) => b.score - a.score);
    }
  },
  { immediate: true },
);

/** 是否改动 */
const isDirty = (row: ZsetRow): boolean =>
  row.member !== row.originalMember || row.score !== row.originalScore;

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

/** 添加成员 */
function addRow(): void {
  const member = newMember.value.trim();
  if (!member) return;
  const score = Number(newScore.value);
  newMember.value = "";
  newScore.value = 0;
  void run(() => redisZsetAdd(props.datasourceId, props.db, props.redisKey, member, score), "添加成员");
}

/** 保存成员（改名时先删旧成员） */
function saveRow(row: ZsetRow): void {
  if (!isDirty(row)) return;
  void run(async () => {
    if (row.member !== row.originalMember) {
      await redisZsetRem(props.datasourceId, props.db, props.redisKey, row.originalMember);
    }
    await redisZsetAdd(props.datasourceId, props.db, props.redisKey, row.member, row.score);
  }, "保存成员");
}

/** 删除成员 */
function delRow(row: ZsetRow): void {
  void run(() => redisZsetRem(props.datasourceId, props.db, props.redisKey, row.originalMember), "删除成员");
}
</script>

<template>
  <div class="rv">
    <div class="rv-bar">
      <span class="rv-count">{{ rows.length }} 个成员（按分数降序）</span>
    </div>

    <div class="rv-rows">
      <div v-for="(row, i) in rows" :key="row.originalMember" class="rv-row" :class="{ dirty: isDirty(row) }">
        <span class="rv-rank" :class="`rank-${i < 3 ? i + 1 : 'n'}`">{{ i + 1 }}</span>
        <ReInput v-model="row.member" size="small" class="rv-mono" />
        <ReInputNumber v-model="row.score" size="small" controls-position="right" style="width: 140px" />
        <div class="rv-ops">
          <ReButton
            icon="Check"
            layout="square"
            size="small"
            title="保存"
            :disabled="busy || !isDirty(row)"
            @click="saveRow(row)"
          />
          <ReButton icon="Delete" layout="square" size="small" type="danger" title="删除" :disabled="busy" @click="delRow(row)" />
        </div>
      </div>
      <ReEmpty v-if="rows.length === 0" description="暂无成员" :image-size="40" />
    </div>

    <div class="rv-add">
      <ReInput v-model="newMember" size="small" placeholder="新成员" @keyup.enter="addRow" />
      <ReInputNumber v-model="newScore" size="small" controls-position="right" style="width: 140px" />
      <ReButton icon="Plus" type="primary" size="small" :show-text="true" :disabled="busy" @click="addRow">添加</ReButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 基础样式见共享 redis-value.css，这里只放 ZSET 专属布局 */
.rv-row { grid-template-columns: 40px 1fr 140px 84px; }
.rv-ops { justify-content: center; }
.rv-add { display: grid; grid-template-columns: 1fr 140px auto; }
</style>
