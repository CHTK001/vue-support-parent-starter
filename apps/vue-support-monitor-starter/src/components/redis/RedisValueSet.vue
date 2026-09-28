<script setup lang="ts">
/**
 * Redis SET 值编辑器（类型化详情组件）
 *
 * <p>标签云编辑器：成员以可删除胶囊展示；点击胶囊进入「改名」模式（输入框回填，保存=先删旧成员再写新成员）；
 * 顶部常驻添加输入框；成员较多时提供筛选。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { redisSetAdd, redisSetRem, type RedisManageKeyDetail } from "../../redisManageApi";
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

const members = ref<string[]>([]);
const filter = ref("");
const input = ref("");
/** 正在改名的原成员（null = 新增模式） */
const editing = ref<string | null>(null);
const busy = ref(false);

watch(
  () => props.detail,
  d => {
    members.value = [];
    editing.value = null;
    input.value = "";
    const raw = d?.value;
    if (d?.type === "SET" && Array.isArray(raw)) {
      members.value = raw.map(v => String(v));
    }
  },
  { immediate: true },
);

/** 筛选后的成员 */
const visibleMembers = computed<string[]>(() => {
  const kw = filter.value.trim().toLowerCase();
  if (!kw) return members.value;
  return members.value.filter(m => m.toLowerCase().includes(kw));
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

/** 提交：新增成员或保存改名 */
function submit(): void {
  const value = input.value.trim();
  if (!value) return;
  if (editing.value != null) {
    const source = editing.value;
    input.value = "";
    editing.value = null;
    if (value === source) return;
    void run(async () => {
      await redisSetAdd(props.datasourceId, props.db, props.redisKey, value);
      await redisSetRem(props.datasourceId, props.db, props.redisKey, source);
    }, "保存成员");
    return;
  }
  input.value = "";
  void run(() => redisSetAdd(props.datasourceId, props.db, props.redisKey, value), "添加成员");
}

/** 进入改名模式 */
function beginEdit(member: string): void {
  editing.value = member;
  input.value = member;
}

/** 取消改名 */
function cancelEdit(): void {
  editing.value = null;
  input.value = "";
}

/** 删除成员 */
function removeMember(member: string): void {
  if (editing.value === member) cancelEdit();
  void run(() => redisSetRem(props.datasourceId, props.db, props.redisKey, member), "删除成员");
}
</script>

<template>
  <div class="rv">
    <div class="rv-bar">
      <span class="rv-count">{{ members.length }} 个成员</span>
      <span class="rv-spacer" />
      <ReInput
        v-if="members.length > 12"
        v-model="filter"

        placeholder="筛选成员"
        prefix-icon="Search"
        clearable
        style="width: 200px"
      />
    </div>

    <div class="rv-chips">
      <span v-for="m in visibleMembers" :key="m" class="rv-chip" :class="{ editing: editing === m }">
        <span class="rv-chip-text" :title="m" @click="beginEdit(m)">{{ m }}</span>
        <ReIcon name="Close" :size="12" class="rv-chip-del" title="删除成员" @click.stop="removeMember(m)" />
      </span>
      <ReEmpty v-if="members.length === 0" description="暂无成员" :image-size="40" />
    </div>

    <div class="rv-add">
      <ReInput
        v-model="input"

        :placeholder="editing != null ? '修改成员名' : '新成员'"
        @keyup.enter="submit"
      />
      <ReButton
        :icon="editing != null ? 'Check' : 'Plus'"
        type="primary"

        :show-text="true"
        :disabled="busy"
        @click="submit"
      >{{ editing != null ? "保存" : "添加" }}</ReButton>
      <ReButton v-if="editing != null" :show-text="true" @click="cancelEdit">取消</ReButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* 基础样式见共享 redis-value.css（胶囊 / 添加条已统一） */
</style>
