<script setup lang="ts">
/**
 * ErTableCard —— ER 图「表卡」节点内容（html 节点）。
 *
 * <p>有关系的表展开为信息卡片：表头（名称 + 注释）+ 关联列预览（PK 金键、可空、列类型）
 * + 底部关系数徽标。孤立表不渲染本卡（由 erNodes 收敛为圆点）。</p>
 *
 * <p>列数据来自 {@code node.data.cols}（ER 图加载时按需预取缓存，双击卡片可补拉全列）。
 * 只读展示，不承担任何编辑职责——编辑仍走「设计表」页签。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";

const props = defineProps<{
  node: {
    id?: string;
    data?: Record<string, unknown>;
  };
}>();

const emit = defineEmits<{
  (e: "open-cols", name: string): void;
}>();

const data = computed(() => props.node.data ?? {});

/** 表名 */
const tableName = computed(() => String(data.value.tableName ?? props.node.id ?? ""));

/** 注释 */
const comment = computed(() => String(data.value.comment ?? ""));

/** 关系数 */
const degree = computed(() => Number(data.value.degree ?? 0));

/** 是否被外键引用但不在清单（跨库占位节点） */
const missing = computed(() => data.value.missing === true);

/** 列预览（ER 图加载时预取的列清单） */
const cols = computed<Array<Record<string, unknown>>>(() => (data.value.cols as Array<Record<string, unknown>>) ?? []);

/** 关系列线索（该表在外键里出现的列名，优先于全列预览展示） */
const relCols = computed<string[]>(() => (data.value.relCols as string[] | undefined) ?? []);

/** 预览列：有全列缓存取全列前 4 行；否则退化为关系列线索 */
const previewCols = computed(() => {
  if (cols.value.length > 0) return cols.value.slice(0, 4);
  return relCols.value.slice(0, 4).map(name => ({ name, type: "→ FK", isPrimaryKey: false, nullable: false }));
});

const pkCount = computed(() => cols.value.filter(c => c.isPrimaryKey === true).length);

function onCardClick(): void {
  emit("open-cols", tableName.value);
}
</script>

<template>
  <div
    class="er-card"
    :class="{ 'er-card--missing': missing }"
    role="button"
    :title="comment || tableName"
    @click="onCardClick"
  >
    <div class="er-card__head">
      <span class="er-card__name" title="双击查看完整列">{{ tableName }}</span>
      <span class="er-card__pk" v-if="pkCount > 0" title="主键列数">⚑ {{ pkCount }}</span>
    </div>
    <div v-if="comment" class="er-card__comment">{{ comment }}</div>
    <div class="er-card__cols">
      <div
        v-for="c in previewCols"
        :key="String(c.name)"
        class="er-card__col"
        :class="{ 'er-card__col--pk': c.isPrimaryKey === true, 'er-card__col--fk': c.type === '→ FK' }"
      >
        <span class="er-card__col-name">{{ c.name }}</span>
        <span class="er-card__col-type">{{ c.type }}</span>
        <span v-if="c.nullable" class="er-card__col-null">NULL</span>
      </div>
      <div v-if="cols.length > 4" class="er-card__more">… 共 {{ cols.length }} 列</div>
      <div v-else-if="relCols.length > 4" class="er-card__more">… 共 {{ relCols.length }} 关联列</div>
      <div v-if="cols.length === 0 && relCols.length === 0" class="er-card__more">双击查看列</div>
    </div>
    <div class="er-card__foot">
      <span class="er-card__deg" :class="{ 'er-card__deg--zero': degree === 0 }">
        {{ degree }} 关系
      </span>
      <span class="er-card__hint">双击列</span>
    </div>
  </div>
</template>

<style scoped>
/* ER 表卡：信息密度高于旧版小矩形，但保持主题令牌、无装饰性图形。
   尺寸与 erNodes 的 html 节点 size 对齐（宽 210，高度随关系数/列数略增）。 */
.er-card {
  width: 206px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-base, 6px);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;
  font-family: var(--el-font-family, system-ui);
}
.er-card--missing {
  border-color: var(--el-color-warning);
  border-style: dashed;
  background: var(--el-color-warning-light-9);
}
.er-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.er-card__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family-mono, monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.er-card__pk {
  flex-shrink: 0;
  font-size: 10.5px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 8px;
  color: var(--el-color-warning);
  background: var(--el-color-warning-light-9);
  font-weight: 600;
}
.er-card__comment {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  max-height: 32px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.er-card__cols {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 76px;
  overflow: hidden;
}
.er-card__col {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  line-height: 16px;
  min-width: 0;
}
.er-card__col--pk .er-card__col-name {
  color: var(--el-color-warning);
  font-weight: 600;
}
.er-card__col--fk .er-card__col-name {
  color: var(--el-color-primary);
}
.er-card__col-name {
  color: var(--el-text-color-primary);
  font-family: var(--el-font-family-mono, monospace);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.er-card__col-type {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 10px;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.er-card__col-null {
  flex-shrink: 0;
  font-size: 9.5px;
  color: var(--el-text-color-placeholder);
}
.er-card__more {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  padding-top: 1px;
}
.er-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 4px;
}
.er-card__deg {
  font-size: 10.5px;
  line-height: 16px;
  padding: 0 6px;
  border-radius: 8px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-weight: 600;
}
.er-card__deg--zero {
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.er-card__hint {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
</style>
