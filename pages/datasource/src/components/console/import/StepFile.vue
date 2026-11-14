<script setup lang="ts">
/**
 * 第 2 步：选择文件。
 *
 * <p>选完立刻上传解析，预览就摆在右边：编码错了、分隔符猜错了、工作表选错了，
 * 在这一步就能看见，不必等到执行完才发现入库的是乱码。</p>
 */
import { ref } from "vue";
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import { ReOption } from "@repo/ui/re-kit";
import WizardStepHead from "../wizard/WizardStepHead.vue";
import type { ImportWizardCtx } from "./useImportWizard";

const props = defineProps<{
  /** 向导控制器 */
  ctx: ImportWizardCtx;
}>();

/** 文件选择框：只在这一步用，留在组件里 */
const fileInput = ref<HTMLInputElement | null>(null);

/**
 * 勾选 / 取消某张工作表。
 *
 * @param sheet 工作表名
 * @param event change 事件
 */
function onSheetToggle(sheet: string, event: Event): void {
  props.ctx.toggleSheet(sheet, (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <section class="wz-pane">
    <WizardStepHead title="选择文件" desc="选完立刻解析并出预览；换编码或换工作表会自动重解析，不用重选文件。">
      <template #meta>步骤 2 / 7</template>
    </WizardStepHead>

    <div class="wz-file-grid">
      <div class="wz-file-form">
        <el-form-item label="导入从" label-width="68px">
          <div class="wz-file-box">
            <div v-if="ctx.fileName" class="wz-file-row">
              <ReIcon name="Document" :size="14" />
              <span class="wz-file-name" :title="ctx.fileName">{{ ctx.fileName }}</span>
              <span class="wz-file-size">{{ ctx.formatSize(ctx.fileSize) }}</span>
              <ReIcon name="Close" :size="13" class="wz-file-del" @click="ctx.clearFile()" />
            </div>
            <div v-else class="wz-file-empty">还没有选择文件</div>
            <div class="wz-file-actions">
              <ReButton size="small" icon="FolderOpened" @click="fileInput?.click()">添加文件</ReButton>
              <ReButton size="small" icon="Link" disabled tip="按网址导入需要服务端能访问该地址，暂未开放">
                添加网址
              </ReButton>
            </div>
            <input
              ref="fileInput"
              type="file"
              class="wz-file-input"
              :accept="ctx.acceptAttr"
              @change="ctx.onFilePicked"
            />
          </div>
        </el-form-item>

        <el-form-item label="编码" label-width="68px">
          <ReSelect v-model="ctx.encoding" style="width: 100%">
            <ReOption label="自动探测（推荐）" value="AUTO" />
            <ReOption label="65001 (UTF-8)" value="UTF-8" />
            <ReOption label="936 (GBK)" value="GBK" />
            <ReOption label="54936 (GB18030)" value="GB18030" />
            <ReOption label="28591 (ISO-8859-1)" value="ISO-8859-1" />
            <ReOption label="1200 (UTF-16LE)" value="UTF-16LE" />
          </ReSelect>
        </el-form-item>

        <template v-if="ctx.type === 'excel' && ctx.sheets.length">
          <el-form-item label="工作表" label-width="68px">
            <div class="wz-sheet-box">
              <div class="wz-sheet-actions">
                <ReButton size="small" @click="ctx.selectAllSheets(true)">全选</ReButton>
                <ReButton size="small" @click="ctx.selectAllSheets(false)">取消全选</ReButton>
              </div>
              <label v-for="s in ctx.sheets" :key="s" class="wz-sheet">
                <input
                  type="checkbox"
                  :checked="ctx.selectedSheets.includes(s)"
                  @change="onSheetToggle(s, $event)"
                />
                <span>{{ s }}</span>
              </label>
            </div>
          </el-form-item>
          <p class="wz-hint">
            勾选的工作表会逐张导入（第 4 步为每张表各生成一行目标表）；这里选中的第一张决定
            第 3 步的列预览与字段映射。
          </p>
        </template>
      </div>

      <div class="wz-file-preview">
        <div class="wz-preview-head">
          <span class="wz-preview-title">数据预览</span>
          <template v-if="ctx.preview">
            <el-tag size="small" effect="plain" type="success">
              已解析 {{ ctx.preview.rowCount }} 行 · {{ ctx.preview.columns.length }} 列
            </el-tag>
            <el-tag v-if="ctx.activeSheet" size="small" effect="plain">{{ ctx.activeSheet }}</el-tag>
            <el-tag v-if="ctx.preview.delimiter" size="small" effect="plain">
              分隔符 {{ ctx.preview.delimiter }}
            </el-tag>
            <el-tag size="small" effect="plain" type="info">{{ ctx.preview.encoding }}</el-tag>
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
              height="220px"
            />
          </div>
        </template>
        <div v-else class="wz-preview-empty">
          <ReIcon name="Document" :size="22" />
          <span>选好文件后这里会出现前 50 行预览</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.wz-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.wz-file-grid {
  display: grid;
  grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.wz-file-form {
  min-width: 0;
}
.wz-file-preview {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wz-preview-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  min-height: 22px;
}
.wz-preview-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.wz-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 180px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-md);
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
}

/* 文件行 */
.wz-file-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 8px 10px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-md);
  background: var(--el-fill-color-lighter);
}
.wz-file-row {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--el-text-color-primary);
}
.wz-file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wz-file-size {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}
.wz-file-del {
  cursor: pointer;
  color: var(--el-text-color-placeholder);
}
.wz-file-del:hover {
  color: var(--el-color-danger);
}
.wz-file-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.wz-file-actions {
  display: flex;
  gap: 6px;
}
.wz-file-input {
  display: none;
}

/* 工作表 */
.wz-sheet-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  max-height: 168px;
  overflow-y: auto;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md);
  background: var(--el-bg-color);
}
.wz-sheet-actions {
  display: flex;
  gap: 6px;
  padding-bottom: 4px;
}
.wz-sheet {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
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
.wz-table-wrap {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  overflow: hidden;
}
@media (max-width: 860px) {
  .wz-file-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
