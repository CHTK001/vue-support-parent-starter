<script setup lang="ts">
/**
 * 第 3 步：附加选项。
 *
 * <p>CSV 与 Excel 的选项不同：CSV 关心分隔符与引号，Excel 关心日期怎么读。
 * 两套控件按类型出现，共同的只有行区间与小数点。</p>
 */
import ReButton from "@repo/ui/re-button";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import { ReOption } from "@repo/ui/re-kit";
import WizardStepHead from "../wizard/WizardStepHead.vue";
import { DATE_ORDERS, DATE_SEPARATORS, DELIMITERS, type ImportWizardCtx } from "./useImportWizard";

defineProps<{
  /** 向导控制器 */
  ctx: ImportWizardCtx;
}>();
</script>

<template>
  <section class="wz-pane">
    <WizardStepHead
      title="附加选项"
      :desc="
        ctx.type === 'excel'
          ? 'Excel 的分隔符由工作簿自己决定，这里只管行区间与日期怎么读。'
          : '文本按什么切分、行从第几行开始读到第几行；改完点「重新解析」核对预览。'
      "
    >
      <template #meta>步骤 3 / 7</template>
    </WizardStepHead>

    <template v-if="ctx.type !== 'excel'">
      <div class="wz-group-title">文本格式</div>
      <div class="wz-grid">
        <el-form-item label="记录分隔符" label-width="100px">
          <ReSelect v-model="ctx.recordDelimiter" style="width: 100%">
            <ReOption label="CRLF（Windows）" value="CRLF" />
            <ReOption label="LF（Unix / macOS）" value="LF" />
            <ReOption label="CR（旧 Mac）" value="CR" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="字段分隔符" label-width="100px">
          <ReSelect v-model="ctx.delimiterModel" filterable allow-create style="width: 100%">
            <ReOption v-for="d in DELIMITERS" :key="d.value" :label="d.label" :value="d.value" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="文本识别符号" label-width="100px">
          <ReSelect v-model="ctx.textQualifier" style="width: 100%">
            <ReOption label="双引号 &quot;" value="&quot;" />
            <ReOption label="单引号 '" value="'" />
            <ReOption label="（不使用）" value="" />
          </ReSelect>
        </el-form-item>
      </div>
      <p class="wz-hint">字段分隔符可直接输入任意单个字符（如 # ~ :）；清空则由后端按内容自动探测。</p>
    </template>

    <div class="wz-group-title">{{ ctx.type === "excel" ? "行与数字" : "行区间" }}</div>
    <div class="wz-grid">
      <el-form-item label="字段名称行" label-width="100px">
        <ReInputNumber v-model="ctx.fieldNamesLine" :min="0" :max="1000" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="第一个数据行" label-width="100px">
        <ReInputNumber v-model="ctx.firstDataLine" :min="1" :max="1000000" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="最后一个数据行" label-width="100px">
        <ReInputNumber v-model="ctx.lastDataLine" :min="0" :max="10000000" controls-position="right" style="width: 100%" />
      </el-form-item>
      <el-form-item label="小数点符号" label-width="100px">
        <ReSelect v-model="ctx.decimalSymbol" style="width: 100%">
          <ReOption label="点 ." value="." />
          <ReOption label="逗号 ," value="," />
        </ReSelect>
      </el-form-item>
    </div>
    <p class="wz-hint">
      字段名称行填 0 表示文件没有表头（按 col1、col2 命名）；最后一个数据行填 0 表示读到文件末尾。
    </p>

    <template v-if="ctx.type === 'excel'">
      <div class="wz-group-title">日期</div>
      <div class="wz-grid">
        <el-form-item label="日期顺序" label-width="100px">
          <ReSelect v-model="ctx.dateOrder" style="width: 100%">
            <ReOption v-for="o in DATE_ORDERS" :key="o.value" :label="o.label" :value="o.value" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="日期时间顺序" label-width="100px">
          <ReSelect v-model="ctx.dateTimeOrder" style="width: 100%">
            <ReOption v-for="o in DATE_ORDERS" :key="o.value" :label="o.label" :value="o.value" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="日期分隔符" label-width="100px">
          <ReSelect v-model="ctx.dateSeparator" style="width: 100%">
            <ReOption v-for="d in DATE_SEPARATORS" :key="d.value" :label="d.label" :value="d.value" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="年份分隔符" label-width="100px">
          <ReSelect v-model="ctx.yearSeparator" style="width: 100%">
            <ReOption v-for="d in DATE_SEPARATORS" :key="d.value" :label="d.label" :value="d.value" />
          </ReSelect>
        </el-form-item>
        <el-form-item label="时间分隔符" label-width="100px">
          <ReSelect v-model="ctx.timeSeparator" style="width: 100%">
            <ReOption label="冒号 (:)" value=":" />
            <ReOption label="点 (.)" value="." />
            <ReOption label="空格" value=" " />
          </ReSelect>
        </el-form-item>
      </div>
      <p class="wz-hint">
        日期规则只作用于目标是 DATE / TIME / DATETIME 的列；对不上的文本原样写入，由数据库报错，
        而不是猜一个可能错的月份。
      </p>
    </template>

    <div class="wz-refresh">
      <ReButton size="small" icon="Refresh" :loading="ctx.parsing" @click="ctx.reparse()">重新解析并刷新预览</ReButton>
      <template v-if="ctx.preview">
        <el-tag size="small" effect="plain" type="success">
          已解析 {{ ctx.preview.rowCount }} 行 · {{ ctx.preview.columns.length }} 列
        </el-tag>
      </template>
    </div>
    <p v-if="ctx.parsing" class="wz-hint">正在解析文件…</p>
    <template v-else-if="ctx.preview">
      <p v-for="(w, i) in ctx.preview.warnings" :key="i" class="wz-note is-warn">{{ w }}</p>
      <div class="wz-table-wrap">
        <ReTable
          :data="ctx.previewRows"
          :columns="ctx.previewColumns"
          :pagination="false"
          stripe
          border
          size="mini"
          height="190px"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.wz-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wz-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  padding-top: 2px;
}
/*
  两列而不是三列：弹窗正文有效宽度约 940px，260px 的最小宽会挤成三列，
  每列只剩 300px 左右 —— 扣掉标签宽度后，「第一个数据行」这类标签折行、
  右边的数字框也被压到放不下步进按钮。340px 的下限让它稳定成两列。
  标签统一 100px：「最后一个数据行」七个字加 12px 右内距，88px 会被裁掉一个字。
*/
.wz-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 0 16px;
}
.wz-grid :deep(.el-form-item) {
  margin-bottom: 12px;
}
.wz-grid :deep(.el-form-item__label) {
  white-space: nowrap;
}
.wz-grid :deep(.el-form-item__content) {
  min-width: 0;
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
.wz-refresh {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding-top: 2px;
}
.wz-table-wrap {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  overflow: hidden;
}
</style>
