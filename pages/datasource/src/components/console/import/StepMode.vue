<script setup lang="ts">
/**
 * 第 6 步：导入模式。
 *
 * <p>六种模式用分段控件，一次只看得到一个当前值；每个模式「会发生什么」写在
 * 下面那一行说明里，而不是让六张卡片互相抢注意力。批大小与高级选项同屏，
 * 因为它们属于同一次执行的参数。</p>
 */
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReInputNumber from "@repo/ui/re-input-number";
import { ReRadioButton, ReRadioGroup } from "@repo/ui/re-kit";
import { DB_IMPORT_MODES, type ImportWizardCtx } from "./useImportWizard";
import WizardStepHead from "../wizard/WizardStepHead.vue";

defineProps<{
  /** 向导控制器 */
  ctx: ImportWizardCtx;
}>();
</script>

<template>
  <section class="wz-pane">
    <WizardStepHead title="导入模式" desc="决定这批数据对目标表做什么：只加、只改、两者都做，还是先清空再写。">
      <template #meta>
        步骤 6 / 7<br />
        {{ ctx.modeLabel }}
      </template>
    </WizardStepHead>

    <ReRadioGroup v-model="ctx.mode" class="wz-modes">
      <ReRadioButton v-for="m in DB_IMPORT_MODES" :key="m.value" :value="m.value">{{ m.label }}</ReRadioButton>
    </ReRadioGroup>

    <div class="wz-mode-hint">
      <span class="wz-mode-hint-name">{{ ctx.modeLabel }}</span>
      <span class="wz-mode-hint-text">
        {{ DB_IMPORT_MODES.find(m => m.value === ctx.mode)?.hint }}
      </span>
    </div>

    <p v-if="ctx.modeNeedsKey && !ctx.hasKeyColumns && !ctx.targetHasPrimaryKey" class="wz-note is-warn">
      「{{ ctx.modeLabel }}」需要用于匹配的键列：目标表没有主键时，请回第 5 步勾选主键。
    </p>

    <div class="wz-batch">
      <el-form-item label="每批行数" label-width="76px">
        <ReInputNumber v-model="ctx.batchSize" :min="1" :max="100000" controls-position="right" style="width: 150px" />
      </el-form-item>
      <ReButton size="small" icon="Setting" @click="ctx.advancedVisible = true">高级</ReButton>
      <span class="wz-hint">
        {{ ctx.advanced.extendedInsert ? "扩展插入已开启（批量提交）" : "逐行提交（错误定位更细）" }}
        <template v-if="ctx.advanced.nullForEmpty">· 空串写 NULL</template>
        <template v-if="ctx.advanced.ignoreForeignKey">· 忽略外键</template>
        <template v-if="!ctx.advanced.continueOnError">· 遇错即停</template>
      </span>
    </div>
  </section>

  <ReDialog v-model="ctx.advancedVisible" title="高级选项" width="480px">
    <div class="wz-adv">
      <label class="wz-adv-item">
        <input v-model="ctx.advanced.extendedInsert" type="checkbox" />
        <span>
          <span class="wz-adv-name">使用扩展插入语句</span>
          <span class="wz-adv-hint">关闭后逐行提交，速度慢但错误定位更细</span>
        </span>
      </label>
      <label class="wz-adv-item wz-adv-item--stack">
        <span class="wz-adv-name">最大语句大小</span>
        <span class="wz-adv-inline">
          <ReInputNumber
            v-model="ctx.advanced.maxStatementKb"
            :min="0"
            :max="1048576"
            controls-position="right"
            style="width: 140px"
          />
          <span class="wz-adv-unit">KB</span>
        </span>
        <span class="wz-adv-hint">0 = 不限制</span>
      </label>
      <label class="wz-adv-item">
        <input v-model="ctx.advanced.nullForEmpty" type="checkbox" />
        <span>
          <span class="wz-adv-name">使用 NULL 取代空白字符串</span>
          <span class="wz-adv-hint">对 NOT NULL 列会失败并计入错误</span>
        </span>
      </label>
      <label class="wz-adv-item">
        <input v-model="ctx.advanced.ignoreForeignKey" type="checkbox" />
        <span>
          <span class="wz-adv-name">忽略外键约束</span>
          <span class="wz-adv-hint">仅 MySQL / MariaDB 生效</span>
        </span>
      </label>
      <label class="wz-adv-item">
        <input v-model="ctx.advanced.continueOnError" type="checkbox" />
        <span>
          <span class="wz-adv-name">遇到错误时继续</span>
          <span class="wz-adv-hint">一行失败不影响其余行</span>
        </span>
      </label>
    </div>
    <template #footer>
      <ReButton type="primary" @click="ctx.advancedVisible = false">确定</ReButton>
    </template>
  </ReDialog>
</template>

<style scoped>
.wz-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.wz-modes {
  align-self: flex-start;
  max-width: 100%;
  flex-wrap: wrap;
}
.wz-mode-hint {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 9px 11px;
  border: 1px solid var(--el-color-primary-light-8);
  border-radius: var(--el-radius-md);
  background: var(--el-color-primary-light-9);
}
.wz-mode-hint-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
}
.wz-mode-hint-text {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}
.wz-batch {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.wz-batch :deep(.el-form-item) {
  margin-bottom: 0;
}
.wz-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-placeholder);
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

/* ---------- 高级选项 ---------- */
.wz-adv {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 20px 14px;
}
.wz-adv-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  cursor: pointer;
}
.wz-adv-item--stack {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}
.wz-adv-name {
  font-weight: 600;
}
.wz-adv-hint {
  display: block;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-placeholder);
}
.wz-adv-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}
.wz-adv-unit {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
