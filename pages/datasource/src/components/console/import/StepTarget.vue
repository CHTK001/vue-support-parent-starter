<script setup lang="ts">
/**
 * 第 4 步：选择目标表。
 *
 * <p>一行 = 一张源表 → 一张目标表。Excel 选了多张工作表就会有多行，
 * 这时「新建表」与目标表名都按行独立，只有字段映射是共用的一份。</p>
 */
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import { ReOption } from "@repo/ui/re-kit";
import WizardStepHead from "../wizard/WizardStepHead.vue";
import { TARGET_COLUMNS, type ImportWizardCtx } from "./useImportWizard";

defineProps<{
  /** 向导控制器 */
  ctx: ImportWizardCtx;
}>();
</script>

<template>
  <section class="wz-pane">
    <WizardStepHead title="目标表">
      <template #desc>
        {{
          ctx.targetRows.length > 1
            ? `选中的 ${ctx.targetRows.length} 张源表要分别导入到哪张目标表？可以选现有表，也可以输入新表名。`
            : "选择目标表。你可选择现有的表，或输入新的表名称。"
        }}
      </template>
      <template #meta>
        步骤 4 / 7<br />
        {{ ctx.targetRows.length }} 张源表
      </template>
    </WizardStepHead>

    <el-form-item label="目标库" label-width="68px">
      <ReSelect v-model="ctx.database" style="width: 240px" @change="ctx.onDatabaseChange()">
        <ReOption v-for="d in ctx.databases" :key="d" :label="d" :value="d" />
      </ReSelect>
      <span class="wz-hint wz-hint--inline">换库会重新加载表清单与列结构</span>
    </el-form-item>

    <ReTable
      :data="ctx.targetRows"
      :columns="TARGET_COLUMNS"
      :pagination="false"
      border
      size="mini"
      height="240px"
    >
      <template #col-target="{ row }">
        <ReSelect
          v-model="row.targetTable"
          filterable
          allow-create
          default-first-option
          placeholder="选择或输入新表名"
          style="width: 100%"
          @change="ctx.onTargetTableChange(row)"
        >
          <ReOption v-for="t in ctx.tableNames" :key="t" :label="t" :value="t" />
        </ReSelect>
      </template>
      <template #col-create="{ row }">
        <input
          type="checkbox"
          :checked="row.createTable"
          :disabled="ctx.tableNames.includes(row.targetTable)"
          @change="ctx.onCreateTableToggle(row, ($event.target as HTMLInputElement).checked)"
        />
      </template>
    </ReTable>

    <p v-if="ctx.duplicatedTargets" class="wz-note is-error">
      多行指向同一张表「{{ ctx.duplicatedTargets }}」：多张源表追加进同一张表请在第 6 步选「追加」，
      并在这里给每行填不同的表名，否则会互相覆盖。
    </p>
    <p v-if="!ctx.tableNames.length" class="wz-note is-warn">
      当前库没有已存在的表；直接输入一个表名并勾「新建表」即可。
    </p>
    <p v-if="ctx.targetRows.length > 1" class="wz-hint">
      字段映射（第 5 步）对这几张表共用一份：按第 3 步预览的那张源表的列名配置。
    </p>
  </section>
</template>

<style scoped>
.wz-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wz-pane :deep(.el-form-item) {
  margin-bottom: 2px;
}
.wz-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
}
.wz-hint--inline {
  margin-left: 10px;
}
.wz-note {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--el-radius-md);
  font-size: 12px;
  line-height: 1.6;
}
.wz-note.is-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
}
.wz-note.is-error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
</style>
