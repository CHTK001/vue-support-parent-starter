<template>
  <div class="dsm tel-page">
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <ReIcon name="Refresh" :size="18" class="dsm-title-icon" />
        <span class="dsm-title">数据同步</span>
      </div>
      <div class="dsm-toolbar-right">
        <ReButton :loading="loading" @click="refresh">
          <template #icon><ReIcon name="Refresh" /></template>刷新
        </ReButton>
        <ReButton type="primary" @click="openCreate">
          <template #icon><ReIcon name="Plus" /></template>新建任务
        </ReButton>
      </div>
    </div>

    <!-- ================= 四张 KPI 卡（全部由现有列表字段算出，不新增后端接口） =================
         ReStatCard 只有 #icon 插槽、没有 #extra，所以 sparkline 不用插槽传入，
         而是与卡片叠放（父级 relative + svg absolute），避免「插槽不存在被静默丢弃」。 -->
    <section class="st-kpi-row">
      <div v-for="k in kpiCards" :key="k.key" class="st-kpi-cell">
        <ReStatCard
          size="compact" :title="k.title" :value="k.value" :desc="k.desc"
          :icon="k.icon" :icon-color="k.color"
        />
        <svg
          v-if="k.spark.length > 1" class="st-spark"
          viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true"
        >
          <polyline
            class="st-spark-line" :style="{ stroke: k.color }"
            :points="sparkPoints(k.spark)"
          />
        </svg>
      </div>
    </section>

    <!-- ================= 状态分段筛选 + 写入模式 / 时间范围下拉 ================= -->
    <div class="st-filter-bar">
      <div class="st-segments">
        <button
          v-for="seg in STATUS_SEGMENTS" :key="seg.key"
          class="st-seg" :class="{ on: statusFilter === seg.key }"
          @click="statusFilter = seg.key"
        >
          <span class="st-seg-label">{{ seg.label }}</span>
          <span class="st-seg-count">{{ segCount(seg.key) }}</span>
        </button>
      </div>
      <div class="st-filter-right">
        <ReSelect
          v-model="writeModeFilter" class="st-filter-sel"
          :options="[{ label: '写入模式：全部', value: '' }, ...writeModeOptions]"
        />
        <ReSelect
          v-model="rangeFilter" class="st-filter-sel"
          :options="RANGE_OPTIONS"
        />
        <span class="st-refreshed">{{ refreshedText }}</span>
      </div>
    </div>

    <div class="st-body">
      <el-table
        v-loading="loading" :data="filteredTasks" border stripe
        empty-text="没有符合条件的同步任务"
      >
        <el-table-column label="任务" min-width="210">
          <template #default="{ row }">
            <div class="st-name">{{ row.syncTaskName }}</div>
            <div class="st-sub">{{ sourceTypeLabel(row) }} · {{ sourceBrief(row) }}</div>
          </template>
        </el-table-column>
        <el-table-column label="数据流向" min-width="250">
          <template #default="{ row }">
            <div class="st-flow">
              <span class="st-flow-chip" :title="sourceFull(row)">
                <ReIcon name="Coin" :size="12" />{{ sourceTableName(row) }}
              </span>
              <ReIcon name="Right" :size="12" class="st-flow-arrow" />
              <span class="st-flow-chip" :title="dsName(row.syncTaskTargetDatasourceId) + '.' + row.syncTaskTargetTable">
                <ReIcon name="Grid" :size="12" />{{ row.syncTaskTargetTable || "-" }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="写入模式" width="118" align="center">
          <template #default="{ row }">
            <el-tag :type="writeModeTagType(row.syncTaskWriteMode)" effect="plain" size="small">
              {{ modeLabel(row.syncTaskWriteMode) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="定时" width="150">
          <template #default="{ row }">
            <span v-if="row.syncTaskCron" class="mono st-cron">{{ row.syncTaskCron }}</span>
            <span v-else class="st-sub">仅手动</span>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="78" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.syncTaskEnabled === 1" @change="(value: string | number | boolean) => toggle(row, !!value)" />
          </template>
        </el-table-column>
        <el-table-column label="最近执行" min-width="260">
          <template #default="{ row }">
            <template v-if="row.syncTaskLastStatus">
              <div class="st-last">
                <el-tag
                  :type="row.syncTaskLastStatus === 'SUCCESS' ? 'success' : 'danger'"
                  size="small" effect="plain"
                >
                  {{ row.syncTaskLastStatus === 'SUCCESS' ? '成功' : '失败' }}
                </el-tag>
                <span class="st-sub">{{ row.syncTaskLastRunTime }}</span>
              </div>
              <div class="st-sub">
                读 {{ row.syncTaskLastReadCount ?? 0 }} / 写 {{ row.syncTaskLastWriteCount ?? 0 }} 行
                · {{ formatCost(row.syncTaskLastCostMs) }}
              </div>
              <div v-if="row.syncTaskLastMessage" class="st-msg" :title="row.syncTaskLastMessage">
                {{ row.syncTaskLastMessage }}
              </div>
            </template>
            <span v-else-if="row.syncTaskEnabled !== 1" class="st-sub">已停用调度</span>
            <span v-else class="st-sub">尚未执行</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="172" fixed="right" align="center">
          <template #default="{ row }">
            <ReButton
              :loading="runningId === row.id" :disabled="row.syncTaskEnabled !== 1" title="立即执行"
              @click="run(row)" circle
            >
              <template #icon><ReIcon name="VideoPlay" /></template>
            </ReButton>
            <ReButton title="编辑" circle @click="openEdit(row)">
              <template #icon><ReIcon name="EditPen" /></template>
            </ReButton>
            <ReButton title="删除" circle type="danger" @click="remove(row)">
              <template #icon><ReIcon name="Delete" /></template>
            </ReButton>
          </template>
        </el-table-column>
      </el-table>
      <div class="st-foot">显示 {{ filteredTasks.length }} 条，共 {{ tasks.length }} 个同步任务</div>
    </div>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑同步任务' : '新建同步任务'" width="920px" :close-on-click-modal="false">
      <el-steps :active="step" align-center finish-status="success" class="st-steps">
        <el-step title="设置输入" description="源数据源与取数方式" />
        <el-step title="设置输出" description="目标数据源与写入表" />
        <el-step title="设置配置" description="调度与运行参数" />
      </el-steps>

      <div class="st-form">
        <!-- ① 设置输入：五种源——数据源(jdbc) / 文件 / 文件夹 / HTTP-JSON / HTTP-HTML -->
        <template v-if="step === 0">
          <div class="st-form-item">
            <label>输入源类型</label>
            <el-radio-group v-model="form.sourceType" @change="onSourceTypeChange">
              <el-radio-button value="JDBC">数据源</el-radio-button>
              <el-radio-button value="FILE">文件</el-radio-button>
              <el-radio-button value="DIR">文件夹</el-radio-button>
              <el-radio-button value="HTTP_JSON">HTTP-JSON</el-radio-button>
              <el-radio-button value="HTTP_HTML">HTTP-HTML</el-radio-button>
            </el-radio-group>
            <div class="st-form-hint">{{ SOURCE_TYPE_HINT[form.sourceType] }}</div>
          </div>

          <!-- 数据源 -->
          <template v-if="form.sourceType === 'JDBC'">
            <div class="st-form-item">
              <label>源数据源（jdbc）</label>
              <el-select v-model="form.sourceDatasourceId" placeholder="从数据源中心选择源数据源" class="st-full" @change="onSourceChange">
                <el-option v-for="ds in jdbcSources" :key="ds.id" :label="ds.name" :value="ds.id" />
              </el-select>
              <div v-if="!jdbcSources.length" class="st-form-hint">数据源中心还没有 jdbc 数据源，请先到「数据源中心」新增。</div>
            </div>

            <div class="st-form-item">
              <label>取数方式</label>
              <el-radio-group v-model="sourceMode" @change="onSourceModeChange">
                <el-radio-button value="table">选择数据表</el-radio-button>
                <el-radio-button value="sql">自定义 SQL</el-radio-button>
              </el-radio-group>
            </div>

            <div v-if="sourceMode === 'table'" class="st-form-item">
              <label>数据表</label>
              <el-select v-model="pickedSourceTable" placeholder="选择源库数据表" filterable clearable class="st-full" @change="applySourceTable">
                <el-option v-for="t in sourceTables" :key="t" :label="t" :value="t" />
              </el-select>
              <div class="st-form-hint">选中后自动生成 SELECT（见下方 SQL，只读）；需要微调请切到「自定义 SQL」。</div>
            </div>

            <div class="st-form-item">
              <label>源读取 SQL（必须以 SELECT 开头）</label>
              <el-input v-model="form.sourceSql" type="textarea" :rows="4" class="mono" :readonly="sourceMode === 'table'" placeholder="SELECT id, name FROM t_order" />
              <div class="st-form-hint">只读源库：写语句会被后端挡下。</div>
            </div>
          </template>

          <!-- 文件 -->
          <template v-else-if="form.sourceType === 'FILE'">
            <div class="st-form-item">
              <label>服务器本地文件</label>
              <div class="st-inline">
                <el-input v-model="form.sourcePath" placeholder="服务器本地绝对路径，如 /data/order.csv" class="mono" />
                <ReButton layout="square" @click="openPathPicker('FILE')">浏览…</ReButton>
              </div>
              <div class="st-form-hint">路径是<b>后端服务所在机器</b>的路径，不是浏览器所在机器。</div>
            </div>
            <div class="st-grid">
              <div class="st-form-item">
                <label>文件格式</label>
                <el-select v-model="form.sourceFormat" class="st-full">
                  <el-option label="CSV / 文本" value="CSV" />
                  <el-option label="Excel（.xls/.xlsx）" value="EXCEL" />
                </el-select>
              </div>
              <div v-if="form.sourceFormat === 'CSV'" class="st-form-item">
                <label>定界符</label>
                <el-select v-model="form.sourceDelimiter" class="st-full">
                  <el-option label="逗号 ," value="," />
                  <el-option label="制表符 Tab" value="\t" />
                  <el-option label="分号 ;" value=";" />
                  <el-option label="竖线 |" value="|" />
                </el-select>
              </div>
              <div v-else class="st-form-item">
                <label>工作表序号（0 起）</label>
                <el-input-number v-model="form.sourceSheetIndex" :min="0" :max="200" controls-position="right" class="st-full" />
              </div>
            </div>
            <div class="st-form-hint">首行默认作为表头（即源列名）。</div>
          </template>

          <!-- 文件夹 -->
          <template v-else-if="form.sourceType === 'DIR'">
            <div class="st-form-item">
              <label>服务器本地文件夹</label>
              <div class="st-inline">
                <el-input v-model="form.sourcePath" placeholder="服务器本地绝对路径，如 /data/incoming" class="mono" />
                <ReButton layout="square" @click="openPathPicker('DIR')">浏览…</ReButton>
              </div>
              <div class="st-form-hint">启用后自动监听该目录，新文件落盘即实时录入。</div>
            </div>
            <div class="st-grid">
              <div class="st-form-item">
                <label>文件匹配规则</label>
                <el-input v-model="form.sourcePattern" placeholder="*.csv,*.xls,*.xlsx" class="mono" />
                <div class="st-form-hint">逗号分隔的 glob；格式按扩展名逐文件判定。</div>
              </div>
              <div class="st-form-item">
                <label>包含子目录</label>
                <el-switch v-model="form.sourceRecursive" />
              </div>
            </div>
            <div class="st-form-item">
              <label>处理完单个文件</label>
              <el-radio-group v-model="form.sourceAfterProcess">
                <el-radio-button value="KEEP">保留原文件</el-radio-button>
                <el-radio-button value="ARCHIVE">归档到 done/</el-radio-button>
                <el-radio-button value="DELETE">删除源文件</el-radio-button>
              </el-radio-group>
              <div class="st-form-hint">归档目录 done/ 会被自动排除，避免归档后被再次同步。</div>
            </div>
          </template>

          <!-- HTTP-JSON / HTTP-HTML -->
          <template v-else>
            <div class="st-form-item">
              <label>请求地址</label>
              <el-input v-model="form.sourcePath" :placeholder="form.sourceType === 'HTTP_JSON' ? 'https://api.example.com/v1/orders' : 'https://example.com/report'" class="mono" />
              <div class="st-form-hint">只支持 http/https；保存时会真实请求一次校验并取列。</div>
            </div>

            <div class="st-grid">
              <div class="st-form-item">
                <label>请求方法</label>
                <el-select v-model="form.sourceMethod" class="st-full">
                  <el-option label="GET" value="GET" />
                  <el-option label="POST" value="POST" />
                  <el-option label="PUT" value="PUT" />
                </el-select>
              </div>
              <div class="st-form-item">
                <label>响应编码</label>
                <el-select v-model="form.sourceEncoding" class="st-full" filterable allow-create default-first-option>
                  <el-option label="UTF-8" value="UTF-8" />
                  <el-option label="GBK" value="GBK" />
                  <el-option label="GB2312" value="GB2312" />
                  <el-option label="ISO-8859-1" value="ISO-8859-1" />
                </el-select>
              </div>
              <div class="st-form-item">
                <label>超时（秒）</label>
                <el-input-number v-model="form.sourceTimeout" :min="1" :max="600" controls-position="right" class="st-full" />
              </div>
            </div>

            <div class="st-form-item">
              <label>请求头</label>
              <el-input v-model="form.sourceHeaders" type="textarea" :rows="2" class="mono" placeholder="每行一条，格式 Key: Value&#10;Authorization: Bearer xxx" />
              <div class="st-form-hint">常用于 <code>Authorization</code>、<code>Accept</code> 等。</div>
            </div>

            <div class="st-form-item">
              <label>Cookie</label>
              <el-input
                v-model="form.sourceCookie"
                type="textarea"
                :rows="2"
                class="mono"
                placeholder="SID=abc123; uid=7"
              />
              <div class="st-form-hint">
                整串粘贴浏览器 DevTools 里复制的 Cookie 值即可。
                若上面「请求头」里也写了 <code>Cookie</code>，以这里为准（不会发两个 Cookie 头）。
              </div>
            </div>

            <div v-if="form.sourceMethod !== 'GET'" class="st-form-item">
              <label>请求体</label>
              <el-input v-model="form.sourceBody" type="textarea" :rows="3" class="mono" placeholder='{"pageNo":1,"pageSize":500}' />
            </div>

            <!-- JSON 源 -->
            <div v-if="form.sourceType === 'HTTP_JSON'" class="st-form-item">
              <label>数据位置（JSON 路径）</label>
              <el-input v-model="form.sourceJsonPath" class="mono" placeholder="data.list（留空=响应根数组）" />
              <div class="st-form-hint">点号路径，支持下标：<code>data.list[0].items</code>。留空时若根是对象，会自动取第一个数组字段。数组里每个对象的顶层字段即源列。</div>
            </div>

            <!-- HTML 源 -->
            <template v-else>
              <div class="st-grid">
                <div class="st-form-item">
                  <label>行选择器</label>
                  <el-input v-model="form.sourceRowSelector" class="mono" placeholder="table tr" />
                </div>
                <div class="st-form-item">
                  <label>单元格选择器</label>
                  <el-input v-model="form.sourceCellSelector" class="mono" placeholder="td,th" />
                </div>
                <div class="st-form-item">
                  <label>首行是表头</label>
                  <el-switch v-model="form.sourceHeaderRow" />
                </div>
              </div>
              <div class="st-form-hint">用 CSS 选择器抓网页表格：行选择器对整篇文档匹配，单元格选择器对每一行匹配。首行默认为表头，其单元格文本即源列名。</div>
            </template>
          </template>
        </template>

        <!-- ② 设置输出：数据源中心选 jdbc 数据源，选目标表 + 字段映射 -->
        <template v-else-if="step === 1">
          <div class="st-form-item">
            <label>目标数据源（jdbc）</label>
            <el-select v-model="form.targetDatasourceId" placeholder="从数据源中心选择目标数据源" class="st-full" @change="onTargetChange">
              <el-option v-for="ds in jdbcSources" :key="ds.id" :label="ds.name" :value="ds.id" />
            </el-select>
          </div>

          <div class="st-grid">
            <div class="st-form-item">
              <label>目标数据表</label>
              <el-select v-model="form.targetTable" placeholder="选择或输入目标表名" filterable allow-create default-first-option class="st-full">
                <el-option v-for="t in targetTables" :key="t" :label="t" :value="t" />
              </el-select>
              <div class="st-form-hint">表清单取自目标数据源；不在清单中的表名可直接输入。</div>
            </div>
            <div class="st-form-item">
              <label>写入模式</label>
              <el-select v-model="form.writeMode" class="st-full">
                <el-option v-for="m in writeModes" :key="m.code" :label="m.label + '（' + m.code + '）'" :value="m.code" />
              </el-select>
            </div>
          </div>

          <div class="st-map">
            <div class="st-map-head">
              <span>字段映射（源 → 目标）</span>
              <div class="st-inline">
                <ReButton @click="doPreview">
                  <template #icon><ReIcon name="View" /></template>预览 / 自动配对
                </ReButton>
                <ReButton @click="addMappingRow">
                  <template #icon><ReIcon name="Plus" /></template>加一行
                </ReButton>
              </div>
            </div>
            <div v-for="(warning, index) in previewWarnings" :key="index" class="st-warn">{{ warning }}</div>
            <div v-for="(item, index) in form.mapping" :key="index" class="st-map-row">
              <el-select v-model="item.source" placeholder="源列" filterable class="st-map-col">
                <el-option v-for="c in sourceColumnOptions" :key="c.name" :label="c.name" :value="c.name" />
              </el-select>
              <span class="st-arrow">→</span>
              <el-select v-model="item.target" placeholder="目标列" filterable class="st-map-col">
                <el-option v-for="c in targetColumnOptions" :key="c.name" :label="c.name" :value="c.name" />
              </el-select>
              <ReButton type="danger" circle title="删除" @click="form.mapping.splice(index, 1)">
                <template #icon><ReIcon name="Delete" /></template>
              </ReButton>
            </div>
            <div v-if="!form.mapping.length" class="st-form-hint">
              留空则按「同名（忽略大小写）」自动配对；建议先点「预览 / 自动配对」确认配对结果。
            </div>
          </div>
        </template>

        <!-- ③ 设置配置：任务名 / 批量 / 定时（ReCron） -->
        <template v-else>
          <div class="st-form-item">
            <label>任务名称</label>
            <el-input v-model="form.name" placeholder="例如：订单表 → 报表库" />
          </div>

          <div class="st-form-item">
            <label>定时表达式（Spring 6 段 cron，留空只手动执行）</label>
            <ReCron
              v-model="form.cron"
              :preview-count="5"
              placeholder="6 段表达式，例如 0 0/30 * * * ?"
              @change="onCronChange"
            />
            <div v-if="cronError" class="st-warn">{{ cronError }}</div>
          </div>

          <div class="st-grid">
            <div class="st-form-item">
              <label>批量提交条数</label>
              <el-input-number v-model="form.batchSize" :min="1" :max="100000" :step="100" controls-position="right" class="st-full" />
            </div>
            <div class="st-form-item st-switch-item">
              <label>启用定时</label>
              <el-switch v-model="form.enabled" :disabled="!form.cron.trim()" />
              <span class="st-form-hint">未填定时表达式时不能启用</span>
            </div>
          </div>
        </template>
      </div>

      <template #footer>
        <ReButton v-if="step > 0" @click="prevStep">上一步</ReButton>
        <ReButton @click="dialogVisible = false">取消</ReButton>
        <ReButton v-if="step < 2" type="primary" @click="nextStep">下一步</ReButton>
        <ReButton v-else type="primary" :loading="saving" @click="submit">保存</ReButton>
      </template>
    </el-dialog>

    <!-- 本机文件/目录选择器：数据同步的文件与文件夹源都指向后端所在机器，
         由 monitor 的 /ms/monitor/local-files/list 列举；FILE 模式同时列出数据文件 -->
    <ReFilePicker
      v-model="filePickerVisible"
      :title="filePickerMode === 'FILE' ? '选择文件' : '选择文件夹'"
      :directory-mode="filePickerMode === 'DIR'"
      :initial-path="filePickerMode === 'FILE' ? 'C:\\' : 'C:\\'"
      :loader="localFileLoader"
      @select="onPathPicked" />
  </div>
</template>

<script setup lang="ts">
/**
 * 数据同步页
 *
 * <p>任务是「源 jdbc 数据源按 SQL 读 → 字段映射 → 目标 jdbc 数据源的某张表」，执行由后端
 * 复用 datasync 引擎完成（源读取 / 字段映射转换 / Sink 契约）。</p>
 *
 * <p>执行结果**不弹通用错误提示**：后端把「读了几行、写了几行、失败原因」放在返回体里，
 * 这里按 status 分色展示，失败时把原因原文贴出来，避免只剩一句「同步失败」。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { computed, onMounted, onUnmounted, reactive, ref, type Component } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, Files, Loading, Warning } from "@element-plus/icons-vue";
import { fetchDataSources, fetchDatasourceTables, type DataSourceInfo } from "@pages/datasource";
import ReCron from "@repo/ui/re-cron";
import ReFilePicker from "@repo/ui/re-file-picker";
import type { FilePickerItem } from "@repo/ui/components/ReFilePicker/types";
import {
  createSyncTask,
  deleteSyncTask,
  enableSyncTask,
  disableSyncTask,
  fetchLocalFiles,
  fetchSyncTasks,
  fetchSyncWriteModes,
  previewSyncMapping,
  runSyncTask,
  updateSyncTask,
  type SyncColumn,
  type SyncFieldMapping,
  type SyncTask,
  type SyncTaskPayload,
  type SyncTaskRunResult,
  type SyncWriteMode,
} from "../syncTaskApi";

defineOptions({ name: "SyncTaskView" });

/** 任务列表 */
const tasks = ref<SyncTask[]>([]);
/** 列表加载中 */
const loading = ref(false);
/** 正在执行的任务 ID */
const runningId = ref<number | null>(null);
/** 数据源台账（仅取 jdbc） */
const datasources = ref<DataSourceInfo[]>([]);
/** 写入模式字典 */
const writeModes = ref<SyncWriteMode[]>([]);
/** 源库可选表 */
const sourceTables = ref<string[]>([]);
/** 目标库可选表 */
const targetTables = ref<string[]>([]);
/** 源库选表用的临时值 */
const pickedSourceTable = ref<string | null>(null);
/** 弹窗可见 */
const dialogVisible = ref(false);
/** 保存中 */
const saving = ref(false);
/** 正在编辑的任务 ID，空表示新建 */
const editingId = ref<number | null>(null);
/** 预览得到的源列 */
const previewSourceColumns = ref<SyncColumn[]>([]);
/** 预览得到的目标列 */
const previewTargetColumns = ref<SyncColumn[]>([]);
/** 预览提示 */
const previewWarnings = ref<string[]>([]);
/** 当前向导步骤：0 设置输入 / 1 设置输出 / 2 设置配置 */
const step = ref(0);
/** 输入取数方式：table 选数据表（自动生成 SELECT）/ sql 自定义 SQL */
const sourceMode = ref<"table" | "sql">("table");
/** cron 非法提示（留空视为「只手动执行」，不算错） */
const cronError = ref("");

/** 输入源类型 */
type SourceType = "JDBC" | "FILE" | "DIR" | "HTTP_JSON" | "HTTP_HTML";

/** 各输入源类型的一句话说明，避免用户面对 5 个选项猜不出差别 */
const SOURCE_TYPE_HINT: Record<SourceType, string> = {
  JDBC: "从数据源中心选 jdbc 数据源，按表或 SQL 取数。",
  FILE: "读服务器本地的单个 CSV / Excel 文件。",
  DIR: "监听服务器本地的文件夹，新文件落盘即实时录入。",
  HTTP_JSON: "调用接口取 JSON，数组里的每个对象即一行。",
  HTTP_HTML: "抓网页并按 CSS 选择器解析表格行（需要时走 cron 定时抓）。",
};

/** 表单 */
const form = reactive({
  name: "",
  /** 输入源类型 */
  sourceType: "JDBC" as SourceType,
  sourceDatasourceId: null as number | null,
  sourceSql: "",
  /** 源定位：文件族为本地绝对路径，HTTP 族为请求地址 */
  sourcePath: "",
  /** 单文件格式；目录模式按扩展名逐文件判定，这里只是选择器默认值 */
  sourceFormat: "CSV" as "CSV" | "EXCEL",
  /** CSV 定界符 */
  sourceDelimiter: ",",
  /** Excel 工作表序号（0 起） */
  sourceSheetIndex: 0,
  /** 目录匹配规则 */
  sourcePattern: "*.csv,*.xls,*.xlsx",
  /** 目录是否递归 */
  sourceRecursive: false,
  /** 目录处理完单个文件的动作 */
  sourceAfterProcess: "KEEP" as "KEEP" | "ARCHIVE" | "DELETE",
  /** HTTP 请求方法 */
  sourceMethod: "GET",
  /** HTTP 响应编码 */
  sourceEncoding: "UTF-8",
  /** HTTP 请求头（每行一条 Key: Value） */
  sourceHeaders: "",
  /** HTTP 请求体 */
  sourceBody: "",
  /** JSON 数据位置（点号路径） */
  sourceJsonPath: "",
  /** HTML 行选择器 */
  sourceRowSelector: "table tr",
  /** HTML 单元格选择器 */
  sourceCellSelector: "td,th",
  /** HTML 首行是否表头 */
  sourceHeaderRow: true,
  /** HTTP Cookie（整串，如 "SID=abc; uid=7"） */
  sourceCookie: "",
  /** HTTP 超时（秒） */
  sourceTimeout: 30,
  targetDatasourceId: null as number | null,
  targetTable: "",
  writeMode: "INSERT",
  batchSize: 500,
  cron: "",
  enabled: false,
  mapping: [] as SyncFieldMapping[],
});

/** 本机文件选择器可见性 */
const filePickerVisible = ref(false);
/** 选择器模式：FILE 选文件 / DIR 选目录 */
const filePickerMode = ref<"FILE" | "DIR">("DIR");

/** 打开本机文件/目录选择器 */
const openPathPicker = (mode: "FILE" | "DIR") => {
  filePickerMode.value = mode;
  filePickerVisible.value = true;
};

/**
 * ReFilePicker 的 loader：列后端所在机器的目录
 * @param path 当前目录（留空列文件系统根）
 */
const localFileLoader = async (path: string): Promise<FilePickerItem[]> => {
  const rows = await fetchLocalFiles(path || "", filePickerMode.value === "FILE");
  return (rows ?? []).map(item => ({
    key: item.key,
    name: item.name,
    isDir: item.isDir,
    size: item.size ?? undefined,
    updatedAt: item.updatedAt ?? undefined,
  }));
};

/** 选中文件/目录 */
const onPathPicked = (items: FilePickerItem[]) => {
  if (items && items.length) {
    form.sourcePath = items[0].key;
    if (!items[0].isDir) {
      form.sourceFormat = detectFormat(items[0].key);
    }
  }
  filePickerVisible.value = false;
};

/**
 * 按扩展名推断文件格式
 * @param path 文件路径
 */
const detectFormat = (path: string): "CSV" | "EXCEL" =>
  /\.(xls|xlsx|xlsm)$/i.test(path || "") ? "EXCEL" : "CSV";

/**
 * 解析「Key: Value」多行文本成对象
 * @param text 多行文本
 */
const parseHeaderLines = (text: string): Record<string, string> => {
  const headers: Record<string, string> = {};
  (text || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .forEach(line => {
      const idx = line.indexOf(":");
      if (idx > 0) {
        const key = line.slice(0, idx).trim();
        if (key) {
          headers[key] = line.slice(idx + 1).trim();
        }
      }
    });
  return headers;
};

/**
 * 对象转「Key: Value」多行文本
 * @param headers 头对象
 */
const formatHeaderLines = (headers?: Record<string, string> | null): string => {
  if (!headers) {
    return "";
  }
  return Object.entries(headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
};

/**
 * 组装 sourceOptions JSON
 *
 * <p>按源类型给不同的字段集合：文件族与 HTTP 族的字段名不重叠，后端按 sourceType 决定读哪一套。</p>
 */
const buildSourceOptions = (): string | null => {
  if (form.sourceType === "JDBC") {
    return null;
  }
  if (form.sourceType === "HTTP_JSON" || form.sourceType === "HTTP_HTML") {
    const headerMap = parseHeaderLines(form.sourceHeaders);
    return JSON.stringify({
      method: form.sourceMethod,
      headers: Object.keys(headerMap).length ? headerMap : undefined,
      body: form.sourceMethod === "GET" ? undefined : form.sourceBody || undefined,
      encoding: form.sourceEncoding,
      jsonPath: form.sourceType === "HTTP_JSON" ? form.sourceJsonPath || undefined : undefined,
      rowSelector: form.sourceType === "HTTP_HTML" ? form.sourceRowSelector || undefined : undefined,
      cellSelector: form.sourceType === "HTTP_HTML" ? form.sourceCellSelector || undefined : undefined,
      headerRow: form.sourceType === "HTTP_HTML" ? form.sourceHeaderRow : undefined,
      timeoutSeconds: form.sourceTimeout,
      // 空串就不带这个键，后端归一化时按「不带 Cookie」处理
      cookie: form.sourceCookie?.trim() ? form.sourceCookie.trim() : undefined,
    });
  }
  return JSON.stringify({
    // 目录模式不传 format：后端按扩展名逐文件判定，混合目录也能跑
    format: form.sourceType === "FILE" ? form.sourceFormat : undefined,
    delimiter: form.sourceType === "FILE" ? form.sourceDelimiter || undefined : undefined,
    sheetIndex: form.sourceType === "FILE" && form.sourceFormat === "EXCEL" ? form.sourceSheetIndex : undefined,
    pattern: form.sourceType === "DIR" ? form.sourcePattern || undefined : undefined,
    recursive: form.sourceType === "DIR" ? form.sourceRecursive : undefined,
    afterProcess: form.sourceType === "DIR" ? form.sourceAfterProcess : undefined,
  });
};

/**
 * 切换输入源类型
 *
 * <p>刻意不清空其它类型的字段：用户在「文件」和「文件夹」之间来回切时路径通常是想保留的，
 * 只有换到需要不同定位方式的类型（JDBC / HTTP）才把 sourcePath 与 sourceSql 分开管。</p>
 */
const onSourceTypeChange = (type: string | number | boolean | undefined) => {
  if (type === "JDBC" || type === "HTTP_JSON" || type === "HTTP_HTML") {
    form.sourceSql = "";
    pickedSourceTable.value = null;
    sourceTables.value = [];
  } else if (type === "FILE" || type === "DIR") {
    form.sourceDatasourceId = null;
  }
  // 换了源类型，上一次预览到的源列不再可信
  previewSourceColumns.value = [];
  previewWarnings.value = [];
};

/**
 * 把存储的 sourceOptions 回填到表单
 *
 * <p>只覆盖存里有的字段，没存的保留默认：后端会归一化默认值，前端不重复推导一套规则。</p>
 *
 * @param options 已解析的选项对象
 */
const applySourceOptions = (options: Record<string, unknown>) => {
  const str = (key: string): string | null => {
    const value = options[key];
    return typeof value === "string" && value ? value : null;
  };
  const num = (key: string): number | null => {
    const value = options[key];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };
  const format = str("format");
  if (format === "CSV" || format === "EXCEL") {
    form.sourceFormat = format;
  }
  form.sourceDelimiter = str("delimiter") ?? form.sourceDelimiter;
  form.sourceSheetIndex = num("sheetIndex") ?? form.sourceSheetIndex;
  form.sourcePattern = str("pattern") ?? form.sourcePattern;
  if (typeof options.recursive === "boolean") {
    form.sourceRecursive = options.recursive;
  }
  const afterProcess = str("afterProcess");
  if (afterProcess === "KEEP" || afterProcess === "ARCHIVE" || afterProcess === "DELETE") {
    form.sourceAfterProcess = afterProcess;
  }
  form.sourceMethod = str("method") ?? form.sourceMethod;
  form.sourceEncoding = str("encoding") ?? form.sourceEncoding;
  const headers = options.headers;
  if (headers && typeof headers === "object" && !Array.isArray(headers)) {
    form.sourceHeaders = formatHeaderLines(headers as Record<string, string>);
  }
  form.sourceBody = str("body") ?? "";
  form.sourceJsonPath = str("jsonPath") ?? "";
  form.sourceRowSelector = str("rowSelector") ?? form.sourceRowSelector;
  form.sourceCellSelector = str("cellSelector") ?? form.sourceCellSelector;
  if (typeof options.headerRow === "boolean") {
    form.sourceHeaderRow = options.headerRow;
  }
  form.sourceCookie = str("cookie") ?? "";
  form.sourceTimeout = num("timeoutSeconds") ?? form.sourceTimeout;
};

/**
 * 解析任务上的 sourceOptions
 * @param json 存储值
 */
const parseSourceOptions = (json?: string | null): Record<string, unknown> => {
  if (!json) {
    return {};
  }
  try {
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return {};
  }
};

/** 仅 jdbc 类型数据源 */
const jdbcSources = computed(() => datasources.value.filter(ds => (ds.type || "").toLowerCase() === "jdbc"));

/** 源列下拉项（优先用预览结果，未预览时给一个占位以支持手填） */
const sourceColumnOptions = computed<SyncColumn[]>(() => previewSourceColumns.value);

/** 目标列下拉项 */
const targetColumnOptions = computed<SyncColumn[]>(() => previewTargetColumns.value);

/**
 * 数据源名称
 * @param id 数据源 ID
 */
const dsName = (id?: number | null): string => {
  const hit = datasources.value.find(ds => ds.id === id);
  return hit ? hit.name : id == null ? "-" : `#${id}`;
};

/**
 * 任务源的一句话描述（按源类型给不同内容）
 *
 * <p>列表里原本只有一列「源 SQL」，换成文件/目录/HTTP 后那列会大面积空白，
 * 这里统一收成「类型前缀 + 定位信息」，一眼能看出这个任务从哪儿取数。</p>
 *
 * @param row 任务
 */
const sourceLabel = (row: SyncTask): string => {
  const type = (row.syncTaskSourceType || "JDBC") as SourceType;
  switch (type) {
    case "JDBC":
      return `${dsName(row.syncTaskSourceDatasourceId)} · ${row.syncTaskSourceSql || "-"}`;
    case "FILE":
      return `文件 · ${row.syncTaskSourcePath || "-"}`;
    case "DIR":
      return `文件夹 · ${row.syncTaskSourcePath || "-"}`;
    case "HTTP_JSON":
      return `HTTP-JSON · ${row.syncTaskSourcePath || "-"}`;
    case "HTTP_HTML":
      return `HTTP-HTML · ${row.syncTaskSourcePath || "-"}`;
    default:
      return "-";
  }
};

/**
 * 写入模式中文
 * @param code 模式编码
 */
const modeLabel = (code?: string | null): string => {
  const hit = writeModes.value.find(m => m.code === code);
  return hit ? hit.label : code || "-";
};

// ==================== KPI / 分段筛选（数据全部来自现有列表字段，不新增后端接口） ====================

/** 状态分段：key 对应下面的 statusOf 分类 */
type StatusKey = "all" | "running" | "success" | "failed" | "disabled";
const STATUS_SEGMENTS: Array<{ key: StatusKey; label: string }> = [
  { key: "all", label: "全部" },
  { key: "running", label: "运行中" },
  { key: "success", label: "成功" },
  { key: "failed", label: "失败" },
  { key: "disabled", label: "已停用" },
];
/** 当前状态分段 */
const statusFilter = ref<StatusKey>("all");
/** 写入模式筛选，空=全部 */
const writeModeFilter = ref("");
/** 时间范围筛选，默认「全部时间」：默认就按 24 小时裁会让「全部 10」只显示 7 行，计数与表格对不上 */
const rangeFilter = ref("all");
const RANGE_OPTIONS = [
  { label: "全部时间", value: "all" },
  { label: "近 1 小时", value: "1h" },
  { label: "近 24 小时", value: "24h" },
  { label: "近 7 天", value: "7d" },
];
/** 列表最近刷新时刻文本（对应图上的「N 分钟前更新」） */
const refreshedAt = ref<number>(0);
/** 每 20s 走一次的时钟：让「N 秒前更新」真的会走，而不是停在那儿不动 */
const clock = ref(Date.now());
let clockTimer: ReturnType<typeof setInterval> | null = null;
const refreshedText = computed(() => {
  if (!refreshedAt.value) return "";
  const sec = Math.max(0, Math.round((clock.value - refreshedAt.value) / 1000));
  if (sec < 10) return "刚刚更新";
  if (sec < 60) return `${sec} 秒前更新`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} 分钟前更新`;
  return `${Math.round(min / 60)} 小时前更新`;
});
/** 写入模式下拉项（来自字典，附「全部」项已在模板里单独给） */
const writeModeOptions = computed(() => writeModes.value.map(m => ({ label: m.label, value: m.code })));

/** 运行中的任务：本地点击「立即执行」期间标记，后端无 RUNNING 状态字段 */
const runningIds = ref<Set<number>>(new Set());
/** 任务状态归类 */
function statusOf(row: SyncTask): Exclude<StatusKey, "all"> {
  if (row.syncTaskEnabled !== 1) return "disabled";
  if (runningIds.value.has(row.id)) return "running";
  if (row.syncTaskLastStatus === "SUCCESS") return "success";
  if (row.syncTaskLastStatus) return "failed";
  // 启用但从未执行：算「成功」会让成功率虚高，算「失败」会误报，统一归入成功之外的独立态
  return "success";
}
/**
 * 各分段计数。
 *
 * <p>计数基数是 {@link baseTasks}（已受写入模式 + 时间范围约束），而不是全量 {@link tasks}：
 * 否则会出现「全部 10」却只列出 7 行 —— 徽标说的和表格给的不是一个数。KPI 卡另走全量口径，
 * 因为它描述的是整体盘子，不该随筛选跳动。</p>
 *
 * @param key 分段
 * @returns 该分段当前可见的任务数
 */
function segCount(key: StatusKey): number {
  if (key === "all") return baseTasks.value.length;
  return baseTasks.value.filter(t => statusOf(t) === key).length;
}
/** 解析后端的时间字符串（yyyy-MM-dd HH:mm:ss 或 ISO），无法解析返回 null */
function parseRunTime(v?: string | null): number | null {
  if (!v) return null;
  const t = Date.parse(v.includes("T") ? v : v.replace(" ", "T"));
  return Number.isNaN(t) ? null : t;
}
/** 时间范围对应的毫秒数；null 表示不限时间 */
function rangeMs(): number | null {
  if (rangeFilter.value === "all") return null;
  const h = rangeFilter.value === "1h" ? 1 : rangeFilter.value === "7d" ? 24 * 7 : 24;
  return h * 3600_000;
}
/** 是否落在所选时间范围内（无执行时间的不参与时间过滤，只受状态/模式影响） */
function inRange(row: SyncTask): boolean {
  const t = parseRunTime(row.syncTaskLastRunTime);
  const ms = rangeMs();
  if (t == null || ms == null) return true;
  return Date.now() - t <= ms;
}
/** 基础集：写入模式 + 时间范围两道与状态无关的过滤 */
const baseTasks = computed(() => tasks.value.filter(row =>
  (!writeModeFilter.value || row.syncTaskWriteMode === writeModeFilter.value) && inRange(row),
));
/** 表格实际数据源：基础集再按状态分段收一道 */
const filteredTasks = computed(() => baseTasks.value.filter(row =>
  statusFilter.value === "all" || statusOf(row) === statusFilter.value,
));

/** 今日成功率：今日有执行记录的任务里成功占比；无今日执行则为 null（显示「—」，不伪造 100%） */
const todayRate = computed<number | null>(() => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  let ok = 0, all = 0;
  for (const t of tasks.value) {
    const ts = parseRunTime(t.syncTaskLastRunTime);
    if (ts == null || ts < t0) continue;
    all++;
    if (t.syncTaskLastStatus === "SUCCESS") ok++;
  }
  return all ? (ok / all) * 100 : null;
});
/** 全量口径计数：KPI 卡描述整体盘子，不随筛选跳动（分段徽标才跟随筛选） */
function globalCount(key: StatusKey): number {
  if (key === "all") return tasks.value.length;
  return tasks.value.filter(t => statusOf(t) === key).length;
}
/** 失败任务数（全量口径） */
const failedCount = computed(() => globalCount("failed"));
/** 已停用任务数 */
function disabledCountOf(): number {
  return tasks.value.filter(t => t.syncTaskEnabled !== 1).length;
}

/** 有执行时间的任务，按执行时间升序（sparkline 的公共输入） */
function orderedRuns(): Array<{ at: number; ok: boolean }> {
  const rows: Array<{ at: number | null; ok: boolean }> = tasks.value.map(t => ({
    at: parseRunTime(t.syncTaskLastRunTime),
    ok: t.syncTaskLastStatus === "SUCCESS",
  }));
  return rows
    .filter((x): x is { at: number; ok: boolean } => x.at != null)
    .sort((a, b) => a.at - b.at);
}

/**
 * KPI 卡的 sparkline 序列。
 *
 * <p><b>口径说明（避免把「无数据」画成「平的 0 值」）</b>：后端只给每个任务的<b>最近一次</b>执行，
 * 没有历史执行表。所以曲线一律取「按最近执行时间升序、累计到当前」这条真实可得的数据，
 * 而不是编一条随机曲线；<b>序列不足 2 点时前端不渲染 svg</b>。结果是：</p>
 * <ul>
 *   <li>今日成功率、失败 / 告警 —— 有多任务执行时间，能画出真实累计曲线；</li>
 *   <li>同步任务数、运行中 —— 后端没有对应的时间序列接口（要历史执行表），
 *       单点画不出趋势，<b>刻意留空</b>而不是补一条假线。要补需后端出统计接口。</li>
 * </ul>
 *
 * @param key 指标键
 * @returns 数值序列（按时间升序）
 */
function sparkSeries(key: "tasks" | "running" | "rate" | "failed"): number[] {
  const rows = orderedRuns();
  if (key === "rate") {
    // 累计成功率（%）
    if (!rows.length) return [];
    const out: number[] = [];
    let ok = 0;
    rows.forEach((r, i) => {
      if (r.ok) ok++;
      out.push(Math.round((ok / (i + 1)) * 1000) / 10);
    });
    return out;
  }
  if (key === "failed") {
    // 累计失败任务数
    if (!rows.length) return [];
    const out: number[] = [];
    let n = 0;
    rows.forEach(r => {
      if (!r.ok) n++;
      out.push(n);
    });
    return out;
  }
  // tasks / running：后端无历史序列，单点无趋势可言
  return [];
}
/** 生成 sparkline 的 polyline points（宽 120 高 32，自带 y 轴上下留白） */
function sparkPoints(data: number[]): string {
  if (data.length < 2) return "";
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * 120;
    const y = 30 - ((v - min) / range) * 26;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}
interface KpiCard {
  key: string; title: string; value: string; desc: string;
  icon: Component; color: string; spark: number[];
}
/** 四张 KPI 卡 */
const kpiCards = computed<KpiCard[]>(() => {
  const enabled = tasks.value.filter(t => t.syncTaskEnabled === 1).length;
  const disabled = disabledCountOf();
  const rate = todayRate.value;
  return [
    {
      key: "tasks", title: "同步任务数", value: String(tasks.value.length),
      desc: `启用 ${enabled} · 停用 ${disabled}`,
      icon: Files, color: "var(--el-color-primary)",
      spark: sparkSeries("tasks"),
    },
    {
      key: "running", title: "运行中", value: String(globalCount("running")),
      desc: `成功 ${globalCount("success")} · 失败 ${failedCount.value}`,
      icon: Loading, color: "var(--el-color-success)",
      spark: sparkSeries("running"),
    },
    {
      key: "rate", title: "今日成功率",
      value: rate == null ? "—" : rate.toFixed(1),
      desc: rate == null ? "今日暂无执行记录" : "按今日已执行任务统计",
      icon: CircleCheck, color: "var(--el-color-warning)",
      spark: sparkSeries("rate"),
    },
    {
      key: "failed", title: "失败 / 告警", value: String(failedCount.value),
      desc: failedCount.value ? "需人工介入" : "暂无失败任务",
      icon: Warning, color: "var(--el-color-danger)",
      spark: sparkSeries("failed"),
    },
  ];
});

/** 写入模式标签色：追加=success / 覆盖=warning / Upsert=primary / 其它=info */
function writeModeTagType(code?: string | null): "success" | "warning" | "primary" | "info" {
  const c = (code || "").toUpperCase();
  if (c === "INSERT") return "success";
  if (c === "OVERWRITE" || c === "REPLACE") return "warning";
  if (c === "UPSERT") return "primary";
  return "info";
}
/** 耗时文本：ms → 人类可读（图中口径：秒级 + 两位小数） */
function formatCost(ms?: number | null): string {
  if (ms == null) return "—";
  const v = Number(ms);
  if (!Number.isFinite(v)) return "—";
  if (v < 1000) return `${Math.round(v)}ms`;
  if (v < 60_000) return `${(v / 1000).toFixed(2)}s`;
  return `${Math.floor(v / 60_000)}m${Math.round((v % 60_000) / 1000)}s`;
}
/** 源类型中文标签（用于卡片化后的「任务」列副标题） */
function sourceTypeLabel(row: SyncTask): string {
  const t = (row.syncTaskSourceType || "JDBC").toUpperCase();
  switch (t) {
    case "JDBC": return "数据源";
    case "FILE": return "文件";
    case "DIR": return "文件夹";
    case "HTTP_JSON": return "HTTP-JSON";
    case "HTTP_HTML": return "HTTP-HTML";
    default: return t;
  }
}
/** 源侧摘要（表格「任务」列副标题用的短文案） */
function sourceBrief(row: SyncTask): string {
  const t = (row.syncTaskSourceType || "JDBC").toUpperCase();
  if (t === "JDBC") return row.syncTaskSourceSql ? truncate(row.syncTaskSourceSql, 48) : "自定义 SQL";
  if (t === "DIR") return row.syncTaskSourcePath ? truncate(row.syncTaskSourcePath, 40) : "目录";
  if (t === "FILE" || t.startsWith("HTTP")) return row.syncTaskSourcePath ? truncate(row.syncTaskSourcePath, 40) : "—";
  return "—";
}
/** 源侧完整描述（数据流向 chip 的 title） */
function sourceFull(row: SyncTask): string {
  return sourceLabel(row);
}
/** 源侧名称（数据流向 chip 的正文） */
function sourceTableName(row: SyncTask): string {
  const t = (row.syncTaskSourceType || "JDBC").toUpperCase();
  if (t === "JDBC") {
    // 从 SELECT ... FROM x 里取表名，取不到就退回数据源名
    const m = /from\s+[`"]?([\w.]+)[`"]?/i.exec(row.syncTaskSourceSql || "");
    return m ? m[1] : dsName(row.syncTaskSourceDatasourceId);
  }
  const p = row.syncTaskSourcePath || "";
  const seg = p.split(/[\\/]/).filter(Boolean);
  return seg.length ? seg[seg.length - 1] : sourceTypeLabel(row);
}
/** 超长文本截断 */
function truncate(v: string, n: number): string {
  return v.length > n ? v.slice(0, n - 1) + "…" : v;
}

/** 拉数据源台账 */
const loadDatasources = async () => {
  try {
    datasources.value = await fetchDataSources();
  } catch (e) {
    ElMessage.error("加载数据源失败：" + (e as Error)?.message);
  }
};

/** 拉任务列表 */
const refresh = async () => {
  loading.value = true;
  try {
    tasks.value = await fetchSyncTasks();
    // 「N 分钟前更新」的时间戳；顺手清掉已结束的执行中标记
    refreshedAt.value = Date.now();
    runningIds.value = new Set();
  } catch (e) {
    ElMessage.error("加载同步任务失败：" + (e as Error)?.message);
  } finally {
    loading.value = false;
  }
};

/**
 * 加载某数据源的表清单
 *
 * <p>走数据源中心（{@code @pages/datasource}）而非直接调监控后端的 /db 接口：
 * 中心侧会按数据源登记的库名挑选实际库，避免「登记库不是目标库」时列出空清单。</p>
 *
 * @param id 数据源 ID
 * @param target 是否为目标侧
 */
const loadTables = async (id: number | null, target: boolean) => {
  if (id == null) {
    return;
  }
  try {
    const list = await fetchDatasourceTables(id);
    if (target) {
      targetTables.value = list;
    } else {
      sourceTables.value = list;
    }
  } catch {
    // 表清单只是辅助，取不到不影响手填 SQL / 表名
    if (target) {
      targetTables.value = [];
    } else {
      sourceTables.value = [];
    }
  }
};

/** 源数据源变更 */
const onSourceChange = async () => {
  pickedSourceTable.value = null;
  previewSourceColumns.value = [];
  await loadTables(form.sourceDatasourceId, false);
};

/** 目标数据源变更 */
const onTargetChange = async () => {
  previewTargetColumns.value = [];
  await loadTables(form.targetDatasourceId, true);
};

/** 由所选表生成源 SQL */
const applySourceTable = () => {
  if (pickedSourceTable.value) {
    form.sourceSql = `SELECT * FROM \`${pickedSourceTable.value}\``;
  }
};

/** 切换取数方式：回到「选择数据表」时按所选表重建 SQL */
const onSourceModeChange = () => {
  if (sourceMode.value === "table") {
    applySourceTable();
  }
};

/**
 * ReCron 变更：只在明确判定非法（第二参 false）且表达式非空时提示
 * @param expression 当前表达式
 * @param valid      组件给出的合法性
 */
const onCronChange = (expression: string, valid: boolean) => {
  cronError.value = expression.trim() && !valid ? "cron 表达式不合法，请检查后再保存" : "";
};

/**
 * 校验某一步能否进入下一步
 * @param index 步骤下标
 */
const validateStep = (index: number): boolean => {
  if (index === 0) {
    if (form.sourceType === "JDBC") {
      if (form.sourceDatasourceId == null) {
        ElMessage.warning("请先选择源数据源");
        return false;
      }
      if (!form.sourceSql.trim()) {
        ElMessage.warning("请选择数据表或填写源读取 SQL");
        return false;
      }
      if (!/^\s*select/i.test(form.sourceSql)) {
        ElMessage.warning("源读取 SQL 必须以 SELECT 开头");
        return false;
      }
      return true;
    }
    const path = form.sourcePath.trim();
    if (!path) {
      ElMessage.warning(form.sourceType === "FILE"
        ? "请选择要同步的文件"
        : form.sourceType === "DIR"
          ? "请选择要监听的文件夹"
          : "请填写请求地址");
      return false;
    }
    if (form.sourceType === "HTTP_JSON" || form.sourceType === "HTTP_HTML") {
      if (!/^https?:\/\//i.test(path)) {
        ElMessage.warning("请求地址必须以 http:// 或 https:// 开头");
        return false;
      }
    }
    return true;
  }
  if (index === 1) {
    if (form.targetDatasourceId == null) {
      ElMessage.warning("请先选择目标数据源");
      return false;
    }
    if (!form.targetTable.trim()) {
      ElMessage.warning("请选择或输入目标数据表");
      return false;
    }
    return true;
  }
  return true;
};

/** 下一步 */
const nextStep = () => {
  if (!validateStep(step.value)) {
    return;
  }
  step.value = Math.min(2, step.value + 1);
};

/** 上一步 */
const prevStep = () => {
  step.value = Math.max(0, step.value - 1);
};

/** 打开新建弹窗 */
const openCreate = () => {
  editingId.value = null;
  form.name = "";
  form.sourceType = "JDBC";
  // DataSourceInfo.id 在类型上是可选值，赋给 number|null 的表单字段前先归一成 null
  const defaultSource = jdbcSources.value[0];
  const defaultTarget = jdbcSources.value[1] ?? jdbcSources.value[0];
  form.sourceDatasourceId = defaultSource ? (defaultSource.id ?? null) : null;
  form.sourceSql = "";
  form.sourcePath = "";
  form.sourceFormat = "CSV";
  form.sourceDelimiter = ",";
  form.sourceSheetIndex = 0;
  form.sourcePattern = "*.csv,*.xls,*.xlsx";
  form.sourceRecursive = false;
  form.sourceAfterProcess = "KEEP";
  form.sourceMethod = "GET";
  form.sourceEncoding = "UTF-8";
  form.sourceHeaders = "";
  form.sourceCookie = "";
  form.sourceBody = "";
  form.sourceJsonPath = "";
  form.sourceRowSelector = "table tr";
  form.sourceCellSelector = "td,th";
  form.sourceHeaderRow = true;
  form.sourceTimeout = 30;
  form.targetDatasourceId = defaultTarget ? (defaultTarget.id ?? null) : null;
  form.targetTable = "";
  form.writeMode = "INSERT";
  form.batchSize = 500;
  form.cron = "";
  form.enabled = false;
  form.mapping = [];
  previewSourceColumns.value = [];
  previewTargetColumns.value = [];
  previewWarnings.value = [];
  pickedSourceTable.value = null;
  sourceTables.value = [];
  targetTables.value = [];
  step.value = 0;
  sourceMode.value = "table";
  cronError.value = "";
  dialogVisible.value = true;
  void loadTables(form.sourceDatasourceId, false);
  void loadTables(form.targetDatasourceId, true);
};

/**
 * 打开编辑弹窗
 * @param row 任务
 */
const openEdit = (row: SyncTask) => {
  editingId.value = row.id;
  form.name = row.syncTaskName;
  const type = (row.syncTaskSourceType || "JDBC") as SourceType;
  form.sourceType = SOURCE_TYPE_HINT[type] ? type : "JDBC";
  form.sourceDatasourceId = row.syncTaskSourceDatasourceId ?? null;
  form.sourceSql = row.syncTaskSourceSql || "";
  form.sourcePath = row.syncTaskSourcePath || "";
  // 先填回各族的默认值，再按存储的选项覆盖：后端归一化过，这里避免缺字段时表单显示空白
  form.sourceFormat = "CSV";
  form.sourceDelimiter = ",";
  form.sourceSheetIndex = 0;
  form.sourcePattern = "*.csv,*.xls,*.xlsx";
  form.sourceRecursive = false;
  form.sourceAfterProcess = "KEEP";
  form.sourceMethod = "GET";
  form.sourceEncoding = "UTF-8";
  form.sourceHeaders = "";
  form.sourceCookie = "";
  form.sourceBody = "";
  form.sourceJsonPath = "";
  form.sourceRowSelector = "table tr";
  form.sourceCellSelector = "td,th";
  form.sourceHeaderRow = true;
  form.sourceTimeout = 30;
  applySourceOptions(parseSourceOptions(row.syncTaskSourceOptions));
  form.targetDatasourceId = row.syncTaskTargetDatasourceId;
  form.targetTable = row.syncTaskTargetTable;
  form.writeMode = row.syncTaskWriteMode || "INSERT";
  form.batchSize = row.syncTaskBatchSize || 500;
  form.cron = row.syncTaskCron || "";
  form.enabled = row.syncTaskEnabled === 1;
  form.mapping = parseMapping(row.syncTaskColumnMapping);
  previewSourceColumns.value = [];
  previewTargetColumns.value = [];
  previewWarnings.value = [];
  pickedSourceTable.value = null;
  sourceTables.value = [];
  targetTables.value = [];
  cronError.value = "";
  step.value = 0;
  // 存量 SQL 若正是「选表生成」的形状，则回到选表模式并回填表名；否则进 SQL 模式（可编辑），
  // 否则 readonly 的 SQL 框会让存量自定义 SQL 无法修改。
  const tableHit = /^\s*select\s+\*\s+from\s+`([^`]+)`\s*;?\s*$/i.exec(row.syncTaskSourceSql || "");
  sourceMode.value = tableHit ? "table" : "sql";
  pickedSourceTable.value = tableHit ? tableHit[1] : null;
  dialogVisible.value = true;
  void loadTables(form.sourceDatasourceId, false);
  void loadTables(form.targetDatasourceId, true);
};

/**
 * 解析字段映射 JSON
 * @param json 存储值
 */
const parseMapping = (json?: string | null): SyncFieldMapping[] => {
  if (!json) {
    return [];
  }
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/** 加一行空白映射 */
const addMappingRow = () => {
  form.mapping.push({ source: "", target: "" });
};

/** 预览并自动配对 */
const doPreview = async () => {
  if (form.targetDatasourceId == null) {
    ElMessage.warning("请先选择目标数据源");
    return;
  }
  if (form.sourceType === "JDBC") {
    if (form.sourceDatasourceId == null) {
      ElMessage.warning("请先选择源数据源");
      return;
    }
    if (!form.sourceSql.trim()) {
      ElMessage.warning("请先填写源读取 SQL");
      return;
    }
  } else if (!form.sourcePath.trim()) {
    ElMessage.warning("请先选择文件或文件夹");
    return;
  }
  if (!form.targetTable.trim()) {
    ElMessage.warning("请先填写目标表名");
    return;
  }
  try {
    const preview = await previewSyncMapping({
      sourceType: form.sourceType,
      sourceDatasourceId: form.sourceDatasourceId,
      sourceSql: form.sourceSql,
      sourcePath: form.sourcePath,
      sourceOptions: buildSourceOptions(),
      targetDatasourceId: form.targetDatasourceId,
      targetTable: form.targetTable,
      mapping: form.mapping.filter(item => item.source && item.target),
    });
    previewSourceColumns.value = preview.sourceColumns;
    previewTargetColumns.value = preview.targetColumns;
    previewWarnings.value = preview.warnings;
    form.mapping = preview.mapping.map(item => ({ ...item }));
    ElMessage.success(`源 ${preview.sourceColumns.length} 列 / 目标 ${preview.targetColumns.length} 列，已配对 ${preview.mapping.length} 项`);
  } catch (e) {
    previewWarnings.value = [];
    ElMessage.error("预览失败：" + (e as Error)?.message);
  }
};

/** 保存任务 */
const submit = async () => {
  // 兜底再校验前置步骤，并把向导跳回出问题的那一步
  if (!validateStep(0)) {
    step.value = 0;
    return;
  }
  if (!validateStep(1)) {
    step.value = 1;
    return;
  }
  if (cronError.value) {
    ElMessage.warning(cronError.value);
    return;
  }
  if (!form.name.trim()) {
    ElMessage.warning("任务名称不能为空");
    return;
  }
  if (form.enabled && !form.cron.trim()) {
    ElMessage.warning("启用定时前请先填写定时表达式");
    return;
  }
  const mapping = form.mapping.filter(item => item.source && item.target);
  // validateStep 已在运行时保证非空，这里再收窄一次类型（number|null → number）
  const targetId = form.targetDatasourceId;
  if (targetId == null) {
    return;
  }
  saving.value = true;
  try {
    const payload: SyncTaskPayload = {
      name: form.name.trim(),
      sourceType: form.sourceType,
      // 非 JDBC 源不传源数据源与源 SQL（后端会按类型忽略，但传 null 更明确）
      sourceDatasourceId: form.sourceType === "JDBC" ? form.sourceDatasourceId : null,
      sourceSql: form.sourceType === "JDBC" ? form.sourceSql.trim() : null,
      sourcePath: form.sourceType === "JDBC" ? null : form.sourcePath.trim(),
      sourceOptions: buildSourceOptions(),
      targetDatasourceId: targetId,
      targetTable: form.targetTable.trim(),
      columnMapping: mapping.length ? JSON.stringify(mapping) : null,
      writeMode: form.writeMode,
      batchSize: form.batchSize,
      cron: form.cron.trim() ? form.cron.trim() : null,
      enabled: form.enabled ? 1 : 0,
    };
    if (editingId.value) {
      await updateSyncTask(editingId.value, payload);
    } else {
      await createSyncTask(payload);
    }
    ElMessage.success("已保存");
    dialogVisible.value = false;
    await refresh();
  } catch (e) {
    ElMessage.error("保存失败：" + (e as Error)?.message);
  } finally {
    saving.value = false;
  }
};

/**
 * 立即执行
 * @param row 任务
 */
const run = async (row: SyncTask) => {
  runningId.value = row.id;
  // 本地标记为「运行中」：后端任务表没有 RUNNING 状态列，执行期间的进度只能由前端标
  runningIds.value = new Set([...runningIds.value, row.id]);
  try {
    const result: SyncTaskRunResult = await runSyncTask(row.id);
    if (result.status === "SUCCESS") {
      ElMessage.success(`执行成功：读 ${result.readCount} 行，写 ${result.writeCount} 行，${result.costMs}ms`);
    } else {
      ElMessage.error(`执行失败：${result.message}`);
    }
  } catch (e) {
    ElMessage.error("执行失败：" + (e as Error)?.message);
  } finally {
    runningId.value = null;
    await refresh();
  }
};

/**
 * 启停定时
 * @param row 任务
 * @param enabled 目标状态
 */
const toggle = async (row: SyncTask, enabled: boolean) => {
  try {
    if (enabled) {
      if (!row.syncTaskCron) {
        ElMessage.warning("该任务没有定时表达式，请先编辑任务填写 cron");
        return;
      }
      await enableSyncTask(row.id);
      ElMessage.success("已启用定时");
    } else {
      await disableSyncTask(row.id);
      ElMessage.success("已停用定时");
    }
    await refresh();
  } catch (e) {
    ElMessage.error("切换失败：" + (e as Error)?.message);
    await refresh();
  }
};

/**
 * 删除任务
 * @param row 任务
 */
const remove = async (row: SyncTask) => {
  try {
    await ElMessageBox.confirm(`确认删除同步任务「${row.syncTaskName}」？`, "删除确认", { type: "warning" });
  } catch {
    return;
  }
  try {
    await deleteSyncTask(row.id);
    ElMessage.success("已删除");
    await refresh();
  } catch (e) {
    ElMessage.error("删除失败：" + (e as Error)?.message);
  }
};

onMounted(async () => {
  // 「N 分钟前更新」要自己走秒，否则会一直停在首次刷新那一刻
  clockTimer = setInterval(() => {
    clock.value = Date.now();
  }, 20_000);
  await loadDatasources();
  try {
    writeModes.value = await fetchSyncWriteModes();
  } catch {
    writeModes.value = [
      { code: "INSERT", label: "追加插入" },
      { code: "REPLACE", label: "存在即替换" },
      { code: "UPSERT", label: "存在即更新" },
      { code: "OVERWRITE", label: "先清空再插入" },
    ];
  }
  await refresh();
});
/** 离开页面时停掉时钟定时器，避免组件卸载后仍每 20s 醒一次 */
onUnmounted(() => {
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
});
</script>

<style scoped>
.st-body { padding: 0 16px 16px; }

/* ==================== KPI 卡 ==================== */
/* 卡面规格交给 ReStatCard，这里只负责四卡等宽排布与卡内 sparkline 的落位 */
.st-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  padding: 0 16px 12px;
}
.st-spark {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 120px;
  height: 32px;
  opacity: 0.85;
  pointer-events: none;
}
.st-kpi-cell { position: relative; min-width: 0; }
.st-spark-line {
  fill: none;
  stroke-width: 1.6;
  stroke-linejoin: round;
  stroke-linecap: round;
}
/* 四卡在窄屏折成两行；再窄折成一行，避免卡片被压到读不出数字 */
@media (max-width: 1100px) {
  .st-kpi-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 620px) {
  .st-kpi-row { grid-template-columns: 1fr; }
}

/* ==================== 状态分段筛选 ==================== */
.st-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0 16px 12px;
}
.st-segments {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
}
.st-seg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: background 0.15s ease, color 0.15s ease;
}
.st-seg:hover { color: var(--text-primary); }
.st-seg.on {
  background: var(--el-color-primary);
  color: #fff;
}
.st-seg-count {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}
.st-filter-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.st-filter-sel { width: 168px; }
.st-refreshed {
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ==================== 数据流向 chip ==================== */
.st-flow {
  display: flex;
  align-items: center;
  gap: 6px;
}
.st-flow-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 130px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: var(--bg-container);
  font-size: 12px;
  color: var(--text-primary);
  font-family: "JetBrains Mono", "Consolas", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.st-flow-arrow { color: var(--text-tertiary); flex-shrink: 0; }

.st-foot {
  padding: 10px 2px 0;
  font-size: 12px;
  color: var(--text-tertiary);
}
/* 三步向导头部：与表单区留出呼吸感 */
.st-steps { margin-bottom: 20px; }
.st-steps :deep(.el-step__title) { font-size: 13px; }
.st-steps :deep(.el-step__description) { font-size: 12px; }
.st-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.st-sub { font-size: 12px; color: var(--text-tertiary); }
.st-sql { font-size: 12px; color: var(--text-secondary); }
.st-cron { font-size: 12px; color: var(--brand-600); }
.st-last { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.st-msg { margin-top: 2px; font-size: 12px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-form { display: flex; flex-direction: column; gap: 14px; max-height: 62vh; overflow-y: auto; padding-right: 6px; }
.st-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.st-form-item { display: flex; flex-direction: column; gap: 6px; }
.st-form-item label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.st-form-hint { font-size: 12px; line-height: 1.5; color: var(--text-tertiary); }
.st-full { width: 100%; }
.st-inline { display: flex; align-items: center; gap: 8px; }
.st-pick { width: 260px; }
.st-switch-item { flex-direction: row; align-items: center; gap: 10px; }
.st-map { border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; background: var(--bg-container); }
.st-map-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.st-map-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.st-map-col { flex: 1; }
.st-arrow { color: var(--text-tertiary); }
.st-warn { font-size: 12px; color: #f59e0b; background: rgba(245, 158, 11, 0.12); border-radius: 6px; padding: 4px 8px; margin-bottom: 6px; }
.mono { font-family: "JetBrains Mono", "Consolas", monospace; }
</style>