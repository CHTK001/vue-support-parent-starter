<script setup lang="ts">
/**
 * 第 5 步：字段映射。
 *
 * <p>左源右目标，勾选「主键」决定更新类模式按哪几列定位已有行。目标字段可以直接
 * 输入新名字：勾了新建表就按这个名字建列，走现有表则必须是表里已有的列。</p>
 */
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import { ReOption } from "@repo/ui/re-kit";
import WizardStepHead from "../wizard/WizardStepHead.vue";
import { MAPPING_COLUMNS, type ImportWizardCtx } from "./useImportWizard";

defineProps<{
  /** 向导控制器 */
  ctx: ImportWizardCtx;
}>();
</script>

<template>
  <section class="wz-pane">
    <WizardStepHead
      title="字段映射"
      desc="源列 → 目标列。未映射的源列不会入库；目标列可改成新名字，新建表时按它建列。"
    >
      <template #meta>
        步骤 5 / 7<br />
        {{ ctx.mappedCount }} / {{ ctx.mappingRows.length }} 列
      </template>
    </WizardStepHead>

    <div class="wz-map-head">
      <span class="wz-map-label">源</span>
      <ReSelect v-if="ctx.sheets.length > 1" v-model="ctx.activeSheet" style="width: 220px" @change="ctx.onSheetChange()">
        <ReOption v-for="s in ctx.sheets" :key="s" :label="s" :value="s" />
      </ReSelect>
      <span v-else class="wz-map-static">{{ ctx.activeSheet || ctx.fileName || "（单一数据源）" }}</span>
      <span class="wz-map-label">目标表</span>
      <span class="wz-map-static">
        {{ ctx.currentTarget || "（未选择）" }}
        <span v-if="ctx.targetRows.length > 1" class="wz-hint">等 {{ ctx.targetRows.length }} 张</span>
      </span>
    </div>

    <ReTable
      :data="ctx.mappingRows"
      :columns="MAPPING_COLUMNS"
      :pagination="false"
      border
      size="mini"
      height="270px"
    >
      <template #col-source="{ row }">
        <span class="wz-mono">{{ row.source }}</span>
      </template>
      <template #col-target="{ row }">
        <ReSelect v-model="row.target" filterable allow-create clearable placeholder="（不导入）" style="width: 100%">
          <ReOption label="（不导入）" value="" />
          <ReOption v-for="c in ctx.targetColumns" :key="c.name" :label="ctx.columnLabel(c)" :value="c.name" />
        </ReSelect>
      </template>
      <template #col-key="{ row }">
        <input type="checkbox" :checked="row.key" @change="ctx.onKeyToggle(row, ($event.target as HTMLInputElement).checked)" />
      </template>
    </ReTable>

    <p v-if="ctx.mappingConflict" class="wz-note is-error">映射冲突：{{ ctx.mappingConflict }}</p>
    <p class="wz-hint">
      勾选「主键」的列用于「更新 / 追加或更新 / 不更新追加 / 删除」模式定位已有行；一个都不勾时按目标表主键。
      <template v-if="ctx.targetHasPrimaryKey">目标表自带主键，可以直接进入下一步。</template>
    </p>
  </section>
</template>

<style scoped>
.wz-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wz-map-head {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.wz-map-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.wz-map-static {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}
.wz-mono {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
}
.wz-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
  font-weight: 400;
}
.wz-note {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--el-radius-md);
  font-size: 12px;
  line-height: 1.6;
}
.wz-note.is-error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
</style>
