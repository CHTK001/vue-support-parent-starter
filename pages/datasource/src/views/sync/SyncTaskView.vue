<template>
  <div class="dsm tel-page sync-tasks">
    <!-- 页面头：标题 + 生产环境徽标 / 右侧刷新计时 + 刷新按钮 + 新建 -->
    <div class="dsm-toolbar">
      <div class="dsm-toolbar-left">
        <div class="st-page-title">数据同步
          <span class="st-env-badge">● 生产环境</span>
        </div>
        <div class="st-page-sub">管理从数据源到数仓 / 应用的同步任务，监控执行状态与告警</div>
      </div>
      <div class="dsm-toolbar-right st-head-actions">
        <span class="st-refreshed">{{ refreshedText || "— 分钟前更新" }}</span>
        <ReButton :loading="loading" @click="refresh">
          <template #icon><ReIcon name="Refresh" /></template>刷新
        </ReButton>
        <ReButton type="primary" @click="openCreate">
          <template #icon><ReIcon name="Plus" /></template>新建任务
        </ReButton>
        <ReButton @click="bulkImportVisible = true">
          <template #icon><ReIcon name="Upload" /></template>批量导入
        </ReButton>
      </div>
    </div>

    <!-- ================= 四张 KPI 卡（全部由现有列表字段算出，不新增后端接口） =================
         ReStatCard 只有 #icon 插槽、没有 #extra，所以 sparkline 不用插槽传入，
         而是与卡片叠放（父级 relative + svg absolute），避免「插槽不存在被静默丢弃」。-->
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

    <!-- ================= 失败告警横幅：有失败任务才出现；UI 图里的红色条 =================
         「×」只隐藏本轮展示（bannerDismissed），不碰数据；刷新/数据变化后恢复显示。
         全部重试 = 对 failedTasks 逐个 run，最后统一 refresh。-->
    <section v-if="failedTasks.length && !bannerDismissed" class="st-alert" role="alert">
      <span class="st-alert-bell" aria-hidden="true">
        <ReIcon name="Bell" :size="18" />
      </span>
      <div class="st-alert-body">
        <div class="st-alert-title">
          {{ failedTasks.length }} 个任务最近执行失败
          <el-tag type="danger" effect="dark" size="small" round>需处理</el-tag>
        </div>
        <div class="st-alert-chips">
          <button
            v-for="t in failedTasks" :key="t.id" type="button"
            class="st-alert-chip" :title="`查看 ${t.syncTaskName} 的执行日志`"
            @click="openLog(t)"
          >
            <span class="st-alert-dot" aria-hidden="true" />
            <span class="st-alert-chip-name">{{ t.syncTaskName }}</span>
            <span class="st-alert-chip-msg">{{ t.syncTaskLastMessage || "执行失败" }}</span>
            <ReIcon name="Right" :size="12" />
          </button>
        </div>
      </div>
      <div class="st-alert-actions">
        <ReButton :loading="retryingAll" size="small" @click="retryAllFailed">全部重试</ReButton>
        <button
          type="button" class="st-alert-close" aria-label="关闭失败提醒"
          @click="bannerDismissed = true"
        >
          <ReIcon name="Close" :size="14" />
        </button>
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
          :options="[{ label: '写入模式：全部', value: 'all' }, ...writeModeOptions]"
        />
        <ReSelect
          v-model="rangeFilter" class="st-filter-sel"
          :options="RANGE_OPTIONS"
        />
        <el-input
          v-model="nameFilter" class="st-search" placeholder="搜索任务名称…"
          aria-label="搜索任务名称" clearable
        >
          <template #prefix><ReIcon name="Search" :size="14" /></template>
        </el-input>
      </div>
    </div>

    <div class="st-body">
      <!-- 表格统一 ReTable：默认 vxe 引擎（本页 UI 图契约与可点元素普查也按 vxe DOM 口径）。
           分页用 ReTable 自带分页（本地数组模式：组件按 page/pageSize 切片、total 取数组长度），
           toolbar=false 保持本页按钮清单不变。 -->
      <ReTable
        :data="filteredTasks" :columns="taskColumns" :loading="loading"
        :page-size="8" :page-sizes="[8, 20, 50]" :toolbar="false"
        table-id="monitor-sync-tasks" stripe
        empty-text="没有符合条件的同步任务"
      >
        <template #col-task="{ row }">
            <div class="st-task-head">
              <span class="st-dot" :class="statusOf(row)" aria-hidden="true" />
              <button
                type="button" class="st-name st-name-btn"
                :title="`编辑 ${row.syncTaskName}`" @click="openEdit(row)"
              >
                {{ row.syncTaskName }}
              </button>
            </div>
            <!-- 源 SQL / 路径直接展示在任务名下：长 SQL 由 CSS 单行省略，悬停 title 看全文 -->
            <div
              class="st-sub mono st-sub-clip"
              :title="`${sourceTypeLabel(row)} · ${sourceBrief(row)}`"
            >{{ sourceTypeLabel(row) }} · {{ sourceBrief(row) }}</div>
        </template>
        <template #col-flow="{ row }">
            <div class="st-flow">
              <span class="st-flow-chip" :title="sourceFull(row)">
                <ReIcon name="Coin" :size="12" />{{ sourceTableName(row) }}
              </span>
              <ReIcon name="Right" :size="12" class="st-flow-arrow" />
              <span class="st-flow-chip" :title="dsName(row.syncTaskTargetDatasourceId) + '.' + row.syncTaskTargetTable">
                <ReIcon name="Grid" :size="12" />{{ row.syncTaskTargetTable || "-" }}
              </span>
              <span
                v-if="targetCount(row) > 1"
                class="st-flow-more"
                :title="`共 ${targetCount(row)} 个输出目标，分别写入不同表`"
              >+{{ targetCount(row) - 1 }}</span>
            </div>
        </template>
        <template #col-writeMode="{ row }">
            <div class="st-mode-cell">
              <el-tag :type="writeModeTagType(row.syncTaskWriteMode)" effect="plain" size="small">
                {{ modeLabel(row.syncTaskWriteMode) }}
              </el-tag>
              <!-- 增量任务标注模式与水位：水位是服务端执行后回写的真实值，悬停可见 -->
              <el-tag
                v-if="effectiveSyncMode(row) === 'INCREMENTAL'"
                type="warning" effect="plain" size="small"
                :title="`增量字段 ${row.syncTaskIncField || '-'} · 每批 ${row.syncTaskIncBatchSize ?? '不限'} 条 · 水位 ${row.syncTaskLastSeq || '（首跑）'}`"
              >增量</el-tag>
            </div>
        </template>
        <template #col-cron="{ row }">
            <template v-if="row.syncTaskCron">
              <div class="mono st-cron" :title="row.syncTaskCron">{{ cronShort(row.syncTaskCron) }}</div>
              <div class="st-sub">{{ cronDesc(row.syncTaskCron) }}</div>
            </template>
            <span v-else class="st-sub">仅手动</span>
        </template>
        <template #col-enabled="{ row }">
            <!-- EP 2.14 的 el-switch 只认 ariaLabel prop（switch.vue:136 直接 __props.ariaLabel），
                 写原生 aria-label 会被丢弃 → 开关读不出名字，普查判「没有可访问名」。 -->
            <el-switch
              :model-value="row.syncTaskEnabled === 1"
              :aria-label="`启用 ${row.syncTaskName}`"
              @change="(value: string | number | boolean) => toggle(row, !!value)"
            />
        </template>
        <template #col-lastRun="{ row }">
            <template v-if="row.syncTaskLastStatus">
              <div class="st-last">
                <el-tag
                  :type="row.syncTaskLastStatus === 'SUCCESS' ? 'success' : 'danger'"
                  size="small" effect="light" round
                >
                  {{ row.syncTaskLastStatus === 'SUCCESS' ? '成功' : '失败' }}
                </el-tag>
                <span class="st-sub mono">{{ row.syncTaskLastRunTime }}</span>
              </div>
              <div class="st-sub">
                读 {{ row.syncTaskLastReadCount ?? 0 }} / 写 {{ row.syncTaskLastWriteCount ?? 0 }} 行
                · {{ formatCost(row.syncTaskLastCostMs) }}
              </div>
              <div v-if="row.syncTaskLastMessage" class="st-msg st-msg-fail" :title="row.syncTaskLastMessage">
                <ReIcon name="Warning" :size="12" />{{ row.syncTaskLastMessage }}
              </div>
            </template>
            <span v-else-if="row.syncTaskEnabled !== 1" class="st-sub">已停用调度</span>
            <span v-else class="st-sub">尚未执行</span>
        </template>
        <!-- 操作列：统一 ReButton square 纯图标按钮（执行 / 日志 / 编辑 / 删除），
             tip 即悬浮提示；「日志」打开同步日志弹窗（服务端最近一次 + 本机记录）。 -->
        <template #col-actions="{ row }">
            <div class="st-acts">
              <ReButton
                layout="square" icon="VideoPlay" tip="立即执行"
                :loading="runningId === row.id" :disabled="runningId === row.id"
                @click="run(row)"
              />
              <ReButton layout="square" icon="Document" tip="日志" @click="openLog(row)" />
              <ReButton layout="square" icon="EditPen" tip="编辑" @click="openEdit(row)" />
              <ReButton layout="square" icon="Delete" type="danger" tip="删除" @click="remove(row)" />
            </div>
        </template>
      </ReTable>
    </div>

    <ReDialog
      v-model="dialogVisible"
      class="st-sync-dlg"
      :title="editingId ? '编辑同步任务' : '新建同步任务'"
      subtitle="配置输入、输出与调度参数"
      :icon="UploadIcon"
      width="920px"
      :close-on-click-modal="false"
    >
      <!-- 步骤条（UI 图）：圆形序号 + 连接线 + 标题/说明，全走 koi 变量、亮暗自适应 -->
      <div class="st-steps">
        <div
          v-for="(item, index) in WIZ_STEPS"
          :key="item.title"
          class="st-step"
          :class="{ 'is-on': index === step, 'is-done': index < step }"
        >
          <span class="st-step-dot">
            <ReIcon v-if="index < step" name="Select" :size="13" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span v-if="index < WIZ_STEPS.length - 1" class="st-step-line" />
          <span class="st-step-labels">
            <span class="st-step-title">{{ item.title }}</span>
            <span class="st-step-desc">{{ item.description }}</span>
          </span>
        </div>
      </div>

      <div class="st-form">
        <!-- ① 设置输入：五种源——数据源(jdbc) / 文件 / 文件夹 / HTTP-JSON / HTTP-HTML -->
        <template v-if="step === 0">
          <div class="st-form-item">
            <label>输入源类型</label>
            <el-radio-group v-model="form.sourceType" class="st-src-cards" @change="onSourceTypeChange">
              <el-radio
                v-for="item in SOURCE_TYPES"
                :key="item.value"
                :value="item.value"
                class="st-src-card"
                :class="{ 'is-checked': form.sourceType === item.value }"
              >
                <span class="st-src-ic"><ReIcon :name="item.icon" :size="16" /></span>
                <span class="st-src-name">{{ item.label }}</span>
              </el-radio>
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
              <el-select v-model="pickedSourceTable" placeholder="选择源库数据表" filterable clearable class="st-full" @change="applySourceTable" @clear="onSourceTableClear">
                <el-option v-for="t in sourceTables" :key="t" :label="displayTargetTable(t)" :value="t" />
              </el-select>
              <div class="st-form-hint">选中后自动生成只读 SELECT；需要微调请切到「自定义 SQL」。</div>
            </div>

            <div v-if="sourceMode === 'sql'" class="st-form-item">
              <label>源读取 SQL（必须以 SELECT 开头）</label>
              <el-input
                v-model="form.sourceSql" type="textarea" :rows="4" class="mono"
                placeholder="SELECT id, name FROM t_order"
              />
              <div class="st-form-hint">
                只读源库：写语句会被后端挡下；点「下一步」会按当前库方言只取 1 条真实校验（表/列不存在会当场报错）。
              </div>
            </div>
          </template>

          <!-- 文件 -->
          <template v-else-if="form.sourceType === 'FILE'">
            <div class="st-form-item">
              <label>服务器本地文件</label>
              <div class="st-inline st-path-field">
                <el-input v-model="form.sourcePath" placeholder="服务器本地绝对路径，如 /data/order.csv" class="mono st-path-input">
                  <template #prefix><ReIcon name="Document" :size="14" /></template>
                </el-input>
                <ReButton icon="FolderOpened" @click="openPathPicker('FILE')">浏览…</ReButton>
              </div>
              <div class="st-form-hint st-hint-dot">路径是<b>后端服务所在机器</b>的路径，不是浏览器所在机器。</div>
            </div>
            <div class="st-section-label">解析设置</div>
            <div class="st-grid st-grid-parse">
              <div class="st-form-item">
                <label>文件格式</label>
                <el-select v-model="form.sourceFormat" class="st-full">
                  <el-option label="CSV / 文本" value="CSV" />
                  <el-option label="Excel（.xls/.xlsx）" value="EXCEL" />
                </el-select>
              </div>
              <div v-if="form.sourceFormat === 'CSV'" class="st-form-item">
                <label>定界符</label>
                <el-radio-group v-model="form.sourceDelimiter" class="st-seg-delim">
                  <el-radio-button value=",">逗号 ,</el-radio-button>
                  <el-radio-button value=";">分号 ;</el-radio-button>
                  <el-radio-button value="\t">Tab</el-radio-button>
                  <el-radio-button value="|">竖线 |</el-radio-button>
                </el-radio-group>
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
              <div class="st-inline st-path-field">
                <el-input v-model="form.sourcePath" placeholder="服务器本地绝对路径，如 /data/incoming" class="mono st-path-input">
                  <template #prefix><ReIcon name="FolderOpened" :size="14" /></template>
                </el-input>
                <ReButton icon="Folder" @click="openPathPicker('DIR')">浏览…</ReButton>
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
                <el-switch v-model="form.sourceRecursive" aria-label="包含子目录" />
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
                  <el-switch v-model="form.sourceHeaderRow" aria-label="首行是表头" />
                </div>
              </div>
              <div class="st-form-hint">用 CSS 选择器抓网页表格：行选择器对整篇文档匹配，单元格选择器对每一行匹配。首行默认为表头，其单元格文本即源列名。</div>
            </template>
          </template>
        </template>

        <!-- ② 设置输出：方案 D（汇总折叠）——每个目标一行摘要，展开后编辑该目标自己的
             数据源 / 表 / 写入模式 / 同步模式 / 增量字段 / 字段映射。一次采集写多张表时，
             各目标配置互不影响（独立写入事务、独立增量水位）。 -->
        <template v-else-if="step === 1">
          <div class="st-targets">
            <div
              v-for="(target, index) in form.targets"
              :key="index"
              class="st-target"
              :class="{ 'is-active': isTargetOpen(index) }"
            >
              <div
                class="st-target-head"
                role="button" tabindex="0"
                :aria-expanded="isTargetOpen(index)"
                :aria-controls="`st-target-body-${index}`"
                @click="toggleTarget(index)"
                @keydown.enter.prevent="toggleTarget(index)"
                @keydown.space.prevent="toggleTarget(index)"
              >
                <ReIcon
                  class="st-target-chevron" :class="{ 'is-open': isTargetOpen(index) }"
                  :name="isTargetOpen(index) ? 'arrow-down' : 'arrow-right'" :size="13"
                />
                <span class="st-target-idx">{{ index + 1 }}</span>
                <span class="st-target-name">
                  <b :title="target.targetTable || '未选择表'">
                    {{ target.targetTable ? displayTargetTable(target.targetTable) : "未选择目标表" }}
                  </b>
                  <i class="st-sub">{{ targetDatasourceLabel(target) }}</i>
                </span>
                <span class="st-target-tags">
                  <el-tag size="small" effect="plain">{{ modeLabel(target.writeMode) }}</el-tag>
                  <el-tag
                    v-if="target.syncMode === 'INCREMENTAL'"
                    size="small" type="warning" effect="plain"
                    :title="`增量字段 ${target.incFields.join(' → ') || '-'} · 每批 ${target.incBatchSize ?? '不限'} 条 · 水位 ${target.lastSeq || '（首跑）'}`"
                  >增量</el-tag>
                  <el-tag v-else size="small" type="info" effect="plain">全量</el-tag>
                  <el-tag v-if="target.mapping.length" size="small" type="success" effect="plain" :title="`已配置 ${target.mapping.length} 条字段映射`">
                    映射 {{ target.mapping.length }}
                  </el-tag>
                </span>
                <span class="st-target-acts">
                  <span class="st-target-open">{{ isTargetOpen(index) ? "收起" : "展开" }}</span>
                  <ReButton
                    v-if="form.targets.length > 1"
                    layout="square" type="danger" icon="Delete" tip="删除该目标"
                    @click.stop="removeTarget(index)"
                  />
                </span>
              </div>

              <div v-show="isTargetOpen(index)" :id="`st-target-body-${index}`" class="st-target-body">
                <div class="st-grid">
                  <div class="st-form-item">
                    <label>目标数据源（jdbc）<span class="st-req">*</span></label>
                    <el-select v-model="activeTarget.targetDatasourceId" placeholder="从数据源中心选择目标数据源" class="st-full" @change="onTargetChange">
                      <el-option v-for="ds in jdbcSources" :key="ds.id" :label="ds.name" :value="ds.id" />
                    </el-select>
                  </div>
                  <div class="st-form-item">
                    <label>目标数据表<span class="st-req">*</span>
                      <el-tooltip
                        content="表清单取自目标数据源，选中值带库前缀（如 ngxacc.device_channel），保证预览/保存与后台查列落在同一库；不在清单中的表名可直接输入。"
                        placement="top"
                      >
                        <ReIcon name="QuestionFilled" :size="13" class="st-label-tip" />
                      </el-tooltip>
                    </label>
                    <el-select v-model="activeTarget.targetTable" placeholder="选择或输入目标表名" filterable allow-create default-first-option class="st-full">
                      <el-option v-for="t in targetTables" :key="t" :label="displayTargetTable(t)" :value="t" />
                    </el-select>
                  </div>
                </div>

                <div class="st-grid">
                  <div class="st-form-item">
                    <label>写入模式
                      <el-tooltip
                        content="「先清空再插入」与增量水位互斥（每批都会清空目标表），增量模式下不提供该写入模式。"
                        placement="top"
                      >
                        <ReIcon name="QuestionFilled" :size="13" class="st-label-tip" />
                      </el-tooltip>
                    </label>
                    <el-select v-model="activeTarget.writeMode" class="st-full">
                      <el-option
                        v-for="m in writeModesFor(activeTarget)"
                        :key="m.code"
                        :label="m.label + '（' + m.code + '）'"
                        :value="m.code"
                      />
                    </el-select>
                  </div>
                  <div class="st-form-item">
                    <label>同步模式
                      <el-tooltip
                        content="全量：每次执行读取全部源数据写入目标；增量：按增量字段水位只取新增/变更数据（由后端维护水位）。"
                        placement="top"
                      >
                        <ReIcon name="QuestionFilled" :size="13" class="st-label-tip" />
                      </el-tooltip>
                    </label>
                    <el-select v-model="activeTarget.syncMode" class="st-full" @change="onSyncModeChange">
                      <el-option label="全量（每次读取全部源数据）" value="FULL" />
                      <!-- 不支持增量的输入源直接不提供该选项：给一个永远选不了的灰项只会让人反复点 -->
                      <el-option
                        v-if="incrementalSourceSupported"
                        label="增量（按增量字段水位取新数据）"
                        value="INCREMENTAL"
                      />
                    </el-select>
                  </div>
                </div>

                <!-- 增量专属配置：全量模式直接不渲染，避免出现一整片灰控件 -->
                <div v-if="activeTarget.syncMode === 'INCREMENTAL'" class="st-grid">
                  <div class="st-form-item">
                    <label>增量字段<span class="st-req">*</span>
                      <el-tooltip
                        content="按此字段的水位取新增数据；多选时构成复合水位（按选择顺序比较，前一个相等才比后一个）。JDBC 自动包裹进源 SQL（水位条件+升序+每批上限）；HTTP 以查询参数携带上次水位。"
                        placement="top"
                      >
                        <ReIcon name="QuestionFilled" :size="13" class="st-label-tip" />
                      </el-tooltip>
                    </label>
                    <el-select
                      v-model="activeTarget.incFields"
                      multiple
                      filterable
                      allow-create
                      default-first-option
                      collapse-tags
                      collapse-tags-tooltip
                      class="st-full"
                      placeholder="从源结果集列中选择（可多选，按选择顺序生效）"
                    >
                      <el-option
                        v-for="col in sourceColumnOptions"
                        :key="col.name"
                        :label="col.name"
                        :value="col.name"
                      />
                    </el-select>
                    <div class="st-form-hint">
                      <template v-if="activeTarget.incFields.length > 1">
                        复合水位（按此顺序比较）：<b>{{ incFieldOrderText }}</b>；前一个字段相等时才比较后一个，同一时间戳内不会漏行。
                      </template>
                      <template v-if="activeTarget.lastSeq"><b>当前水位：{{ activeTarget.lastSeq }}</b>（改动字段会清空水位）</template>
                      <template v-else>尚无水位，首跑按升序分批引导。</template>
                    </div>
                  </div>
                  <div class="st-form-item">
                    <label>每批数量（留空不限）
                      <el-tooltip
                        content="增量每轮最多同步的源行数（决定一轮取多少、水位推进多少）。留空=不限，一次同步全部积压。与「批量提交条数」不同：本项是增量取数粒度，批量提交条数是写入事务粒度。"
                        placement="top"
                      >
                        <ReIcon name="QuestionFilled" :size="13" class="st-label-tip" />
                      </el-tooltip>
                    </label>
                    <el-input-number
                      v-model="activeTarget.incBatchSize" :min="1" :max="100000000" :step="1000"
                      controls-position="right" class="st-full"
                      placeholder="留空表示不限"
                    />
                  </div>
                </div>
                <!-- 全量模式：与「先清空再插入」组合时会清空目标表，用红字提醒避免误删 -->
                <div v-else>
                  <ReAlert
                    v-if="activeTarget.writeMode === 'OVERWRITE'"
                    class="st-alert"
                    type="error"
                    :closable="false"
                    show-icon
                    title="全量 + 先清空再插入：每次执行都会清空目标表后重灌"
                    description="目标表现有数据将被全部删除后写入本次源数据，请确认目标表不需要保留存量数据。"
                  />
                  <div v-else class="st-form-hint">
                    <template v-if="incrementalSourceSupported">
                      当前目标按全量执行；切换为增量后才有增量字段与每批上限可配。
                    </template>
                    <template v-else>当前输入源不支持增量（仅 JDBC / HTTP 源可用）。</template>
                  </div>
                </div>

                <div class="st-grid">
                  <div class="st-form-item">
                    <label>批量提交条数
                      <el-tooltip
                        content="写入目标库时每个事务提交的行数（JDBC 批量提交粒度）：调大提升吞吐，调小降低单事务压力。与「每批数量」不同：本项是写入事务粒度，每批数量是增量取数粒度。"
                        placement="top"
                      >
                        <ReIcon name="QuestionFilled" :size="13" class="st-label-tip" />
                      </el-tooltip>
                    </label>
                    <el-input-number v-model="activeTarget.batchSize" :min="1" :max="100000" :step="100" controls-position="right" class="st-full" />
                  </div>
                </div>

                <!-- 该目标的解析预览：目标表结构各不相同，必须按目标分别预览 -->
                <div class="st-preview">
                  <div class="st-preview-head">
                    <span class="st-preview-title">解析预览（目标 {{ index + 1 }}）</span>
                    <span class="st-preview-meta">
                      {{ previewSourceColumns.length
                        ? `源 ${previewSourceColumns.length} 列 · 目标 ${activeTarget.previewTargetColumns.length} 列 · 已配对 ${activeTarget.mapping.length} 项`
                        : "尚未预览" }}
                    </span>
                    <ReButton @click="doPreview">
                      <template #icon><ReIcon name="Refresh" /></template>预览 / 自动配对
                    </ReButton>
                  </div>
                  <div v-if="previewSourceColumns.length" class="st-preview-chips">
                    <span v-for="col in previewSourceColumns" :key="col.name" class="st-chip">
                      <b class="st-chip-name">{{ col.name }}</b>
                      <i class="st-chip-type">{{ col.type || "（解析）" }}</i>
                    </span>
                  </div>
                  <div v-else class="st-form-hint">点「预览 / 自动配对」真实读取一次源列与目标列，并按同名自动配对。</div>
                  <div v-for="(warning, i) in activeTarget.previewWarnings" :key="i" class="st-warn">{{ warning }}</div>
                </div>

                <div class="st-map">
                  <div class="st-map-head">
                    <span>字段映射（源 → 目标）</span>
                    <div class="st-inline">
                      <ReButton @click="addMappingRow">
                        <template #icon><ReIcon name="Plus" /></template>加一行
                      </ReButton>
                    </div>
                  </div>
                  <ReTable
                    :data="activeTarget.mapping"
                    :columns="mappingColumns"
                    :pagination="false"
                    :toolbar="false"
                    :layout-table="{ minHeight: 0 }"
                    :settings="{ border: false }"
                  >
                    <template #col-source="{ row }">
                      <el-select v-model="row.source" placeholder="源列" filterable class="st-map-col">
                        <el-option v-for="c in sourceColumnOptions" :key="c.name" :label="c.name" :value="c.name" />
                      </el-select>
                    </template>
                    <template #col-target="{ row }">
                      <el-select v-model="row.target" placeholder="目标列" filterable class="st-map-col">
                        <el-option v-for="c in targetColumnOptions" :key="c.name" :label="c.name" :value="c.name" />
                      </el-select>
                    </template>
                    <template #col-actions="{ row }">
                      <ReButton type="danger" circle title="删除" @click="removeMappingRow(row)">
                        <template #icon><ReIcon name="Delete" /></template>
                      </ReButton>
                    </template>
                    <template #empty>
                      <div class="st-form-hint">
                        留空则按「同名（忽略大小写）」自动配对；建议先点「预览 / 自动配对」确认配对结果。
                      </div>
                    </template>
                  </ReTable>
                </div>
              </div>
            </div>

            <div class="st-target-add">
              <ReButton @click="addTarget">
                <template #icon><ReIcon name="Plus" /></template>添加输出目标
              </ReButton>
              <el-tooltip
                content="一次采集的结果可同时写入多张表。每个目标有独立的写入模式、同步模式、增量字段与字段映射；某个目标写失败不会影响其它目标推进。"
                placement="top"
              >
                <ReIcon name="QuestionFilled" :size="13" class="st-label-tip" />
              </el-tooltip>
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

          <!-- 批量提交条数属于「每个目标各自的写入参数」，已在第②步的目标里配置；
               这里只放任务级调度与 Hook 通知。 -->
          <!-- 启用定时的开关只在填了 cron 时才出现：没填 cron 时它永远开不了，
               摆一个点不动的灰开关没有意义，直接不渲染。 -->
          <div v-if="form.cron.trim()" class="st-form-item st-switch-item">
            <label>启用定时</label>
            <el-switch v-model="form.enabled" aria-label="启用定时" />
            <span class="st-form-hint">开启后按上面的 cron 自动执行；关闭则只保留手动执行。</span>
          </div>
          <div v-else class="st-form-hint">未填定时表达式，保存后只能手动执行。</div>

          <!-- Hook HTTP 回调：旁路通知，发送失败只记日志不影响同步结果 -->
          <div class="st-form-item">
            <label>Hook 通知地址（HTTP 回调，留空不通知）</label>
            <el-input
              v-model="form.hookUrl" class="mono"
              placeholder="https://example.com/hooks/sync-done"
            />
            <div class="st-form-hint">每轮执行结束向该地址 JSON POST 执行结果（成功/失败都发）；增量选「每条」时每写入一条再推一条。</div>
          </div>
          <!-- 通知时机只在「有增量目标」时才有意义：全量固定 DONE，
               所以全量时直接不渲染这个下拉，而不是摆一个选不动的灰控件。 -->
          <div v-if="form.hookUrl.trim() && anyIncrementalTarget" class="st-form-item">
            <label>通知时机</label>
            <el-select v-model="form.hookNotify" class="st-full">
              <el-option label="完成通知（每轮一条，成功/失败各带 status）" value="DONE" />
              <el-option label="每条数据 + 完成通知" value="ROW" />
            </el-select>
            <div class="st-form-hint">
              有增量目标时可逐条推送（异步发送，慢接收端不拖累同步吞吐；队列满丢通知不丢数据）。
              通知失败只记日志，不影响同步。
            </div>
          </div>
          <div v-else-if="form.hookUrl.trim()" class="st-form-hint">
            全部目标都是全量模式，通知时机固定为「完成通知」。
          </div>
        </template>
      </div>

      <template #footer>
        <div class="st-dlg-foot">
          <div class="st-dlg-status" :class="stepIssueNow ? 'is-bad' : 'is-ok'">
            <ReIcon :name="stepIssueNow ? 'Warning' : 'Select'" :size="13" />
            <span>{{ stepIssueNow ? `待完善：${stepIssueNow}` : "本步填写已通过校验" }}</span>
          </div>
          <div class="st-dlg-actions">
            <ReButton v-if="step > 0" @click="prevStep">
              <template #icon><ReIcon name="CaretLeft" :size="12" /></template>上一步
            </ReButton>
            <ReButton @click="dialogVisible = false">取消</ReButton>
            <ReButton v-if="step < 2" type="primary" :loading="sourceVerifying" @click="nextStep">
              <template #icon><ReIcon name="CaretRight" :size="12" /></template>下一步 · {{ WIZ_STEPS[step + 1].title }}
            </ReButton>
            <ReButton v-else type="primary" :loading="saving" @click="submit">
              <template #icon><ReIcon name="Select" :size="12" /></template>保存
            </ReButton>
          </div>
        </div>
      </template>
    </ReDialog>

    <!-- ================= 调试日志弹窗：主体 = 服务端执行调试日志（连源、SQL、列解析、映射、
         逐文件读写、错误堆栈的逐步过程行；进行中的执行在打开期间轮询实时追加）。
         摘要条只给「最近一次结果」一眼上下文。服务端接口不可用时降级展示本机执行记录
         （本页触发的真实结果），如实报错、不编造后端没有的数据。 -->
    <ReDialog
      v-model="logVisible"
      class="st-sync-dlg st-log-dlg"
      title="同步日志"
      :subtitle="logTask ? logTask.syncTaskName : ''"
      :icon="DocumentIcon"
      width="760px"
      :close-on-click-modal="false"
    >
      <div v-if="logTask" class="st-log">
        <!-- 摘要条：任务行最近一次执行（上下文，过程详情以下方调试日志为准） -->
        <div class="st-log-summary">
          <el-tag
            v-if="logTask.syncTaskLastStatus"
            :type="logTask.syncTaskLastStatus === 'SUCCESS' ? 'success' : 'danger'"
            size="small" effect="dark" round
          >{{ logTask.syncTaskLastStatus === "SUCCESS" ? "成功" : "失败" }}</el-tag>
          <span v-if="runningId === logTask.id" class="st-log-running">
            <ReIcon name="Loading" :size="13" />执行中…
          </span>
          <span v-if="logTask.syncTaskLastRunTime" class="st-log-summary-meta">
            最近一次 {{ logTask.syncTaskLastRunTime }} · 读 {{ logTask.syncTaskLastReadCount ?? "—" }} / 写 {{ logTask.syncTaskLastWriteCount ?? "—" }} 行 · {{ logTask.syncTaskLastCostMs ?? "—" }} ms
          </span>
          <span v-else class="st-log-summary-meta">该任务还没有执行过</span>
          <span
            v-if="logTask.syncTaskLastMessage"
            class="st-log-summary-msg"
            :title="logTask.syncTaskLastMessage"
          >{{ logTask.syncTaskLastMessage }}</span>
        </div>

        <div class="st-log-block">
          <div class="st-log-block-head">
            <span class="st-log-block-title">调试日志</span>
            <ReIcon v-if="logLoading" name="Loading" :size="13" />
            <span class="st-log-hint-inline">服务端内存保留最近 10 次执行，后端重启即清空；弹窗打开期间自动刷新</span>
          </div>

          <!-- 服务端不可用（接口未部署 / 网关错误）：如实报错，降级展示本机执行记录 -->
          <template v-if="logFetchError">
            <p class="st-log-hint st-log-fetch-error">服务端调试日志暂不可用：{{ logFetchError }}。以下为本机执行记录（仅本页触发的真实执行）。</p>
            <div v-if="logEntries.length" class="st-log-list">
              <div
                v-for="(entry, index) in logEntries" :key="`${entry.at}-${index}`"
                class="st-log-row" :class="entry.status === 'SUCCESS' ? 'is-ok' : 'is-bad'"
              >
                <span class="st-log-time">{{ entry.at }}</span>
                <span class="st-log-badge">{{ entry.status === "SUCCESS" ? "成功" : "失败" }}</span>
                <span class="st-log-counts">读 {{ entry.read }} / 写 {{ entry.write }} 行 · {{ entry.costMs }} ms</span>
                <span class="st-log-msg-text" :title="entry.message">{{ entry.message || "（无附加消息）" }}</span>
              </div>
            </div>
            <div v-else class="st-log-empty">本机也没有触发过执行</div>
          </template>

          <!-- 服务端调试日志：每次执行一个 ReTabs 页签（面板常驻显示过程行，不必展开） -->
          <div v-else-if="logRuns.length" class="st-log-runs">
            <ReTabs
              v-model="activeLogRunName"
              :tabs="logRunTabs"
              :closable="false"
              :show-close-all="false"
              :context-menu="[]"
              class="st-log-runs-tabs"
            >
              <template #default="{ tab }">
                <div class="st-log-run-body">
                  <div
                    v-for="(line, li) in runOf(tab).lines"
                    :key="li"
                    class="st-log-line"
                    :class="`is-${line.level.toLowerCase()}`"
                  >
                    <span class="st-log-line-time">{{ line.time }}</span>
                    <span class="st-log-line-level">{{ line.level }}</span>
                    <span class="st-log-line-msg">{{ line.message }}</span>
                  </div>
                </div>
              </template>
            </ReTabs>
          </div>
          <div v-else class="st-log-empty">服务端暂无调试日志——从本页「立即执行」或等定时触发一次，这里会显示逐步过程日志。</div>
        </div>
      </div>
      <template #footer>
        <div class="st-dlg-actions">
          <ReButton v-if="logFetchError && logEntries.length" @click="clearLogEntries">清空本机记录</ReButton>
          <ReButton v-else-if="logRuns.length || logEntries.length" type="primary" @click="fetchLogRuns">刷新日志</ReButton>
        </div>
      </template>
    </ReDialog>

    <!-- 设计表向导（@pages/datasource 数据库管理器同款）：预览发现「表不存在」时弹出，
         initial-name / initial-columns 带入缺失表名与源列；后端 POST /ms/monitor/db/table
         按目标库方言建表，created 后回填表名并自动继续预览。 -->
    <CreateTableDialog
      v-model="tableDesignerVisible"
      :datasource-id="designerDatasourceId ?? undefined"
      :database="designerDatabase || undefined"
      :initial-name="designerTable"
      :initial-columns="designerColumns"
      @created="onTableCreated"
    />

    <!-- 本机文件/目录选择器：数据同步的文件与文件夹源都指向后端所在机器，
         由配置的 loader 调用远端接口列举；FILE 模式同时列出数据文件。
         主入口为 filesystem-starter 的目录浏览能力（宿主后端按需包装），
         initial-path 用文件系统根：先前写死 Windows 的 C 盘路径，而部署机是 Linux，
         结果打开就是目录不存在，一个条目都列不出来（实测根能列出 21 个目录）。 -->
    <ReFilePicker
      v-model="filePickerVisible"
      :title="filePickerMode === 'FILE' ? '选择文件' : '选择文件夹'"
      :directory-mode="filePickerMode === 'DIR'"
      initial-path="/"
      :loader="localFileLoader"
      @select="onPathPicked" />
    <BulkImportDialog v-model="bulkImportVisible" />
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
import { message } from "@repo/core";
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch, type Component } from "vue";
import { ElMessageBox } from "element-plus";
import { CircleCheck, Document as DocumentIcon, Files, Loading, Upload as UploadIcon, Warning } from "@element-plus/icons-vue";
import { fetchDataSources, fetchDatasourceTables, type DataSourceInfo } from "@pages/datasource";
import { fetchTableColumns, fetchMonitorTablesQualified, getDatasourceDatabase } from "../../api/manageConsoles";import CreateTableDialog from "../../components/console/CreateTableDialog.vue";
import BulkImportDialog from "../../components/sync/BulkImportDialog.vue";
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
  fetchSyncTaskLogs,
  fetchSyncWriteModes,
  previewSyncMapping,
  runSyncTask,
  updateSyncTask,
  validateSyncSource,
  type SyncColumn,
  type SyncFieldMapping,
  type SyncTask,
  type SyncTaskPayload,
  type SyncTaskRunLog,
  type SyncTaskRunResult,
  type SyncWriteMode,
} from "../../api/syncTaskApi";
import ReDialog from "@repo/ui/re-dialog";
import ReTabs from "@repo/ui/re-tabs";
import type { ReTabsItem } from "@repo/ui/re-tabs";
import type { ReTableColumn } from "@repo/ui/re-table";

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
const targetTables = ref<string[]>([]);/** 目标数据源当前命中的库（选表后由清单流程写入，保存/预览用「库.表」对齐后端） */
const targetDatabase = ref("");
/** 源数据源当前命中的库（源表下拉限定值已含库名；建表回填裸表名时用它补库） */
const sourceDatabase = ref("");
/** 源库选表用的临时值 */
const pickedSourceTable = ref<string | null>(null);
/** 弹窗可见 */
const dialogVisible = ref(false);
/** 批量导入弹窗可见 */
const bulkImportVisible = ref(false);
/** 保存中 */
const saving = ref(false);
/** 源可读性校验中（第①步「下一步」在等后端真读一次源） */
const sourceVerifying = ref(false);
/** 正在编辑的任务 ID，空表示新建 */
const editingId = ref<number | null>(null);
/** 预览得到的源列（源只有一份，多个目标共用；目标列各目标自己存） */
const previewSourceColumns = ref<SyncColumn[]>([]);
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

/** 输入源类型卡片（与 SOURCE_TYPE_HINT 对齐；icon 走 ReIcon/EP 图标名） */
const SOURCE_TYPES: Array<{ value: SourceType; label: string; icon: string }> = [
  { value: "JDBC", label: "数据源", icon: "Coin" },
  { value: "FILE", label: "文件", icon: "Document" },
  { value: "DIR", label: "文件夹", icon: "Folder" },
  { value: "HTTP_JSON", label: "HTTP-JSON", icon: "Link" },
  { value: "HTTP_HTML", label: "HTTP-HTML", icon: "Position" },
];

/** 向导三步（标题与说明供步骤条与「下一步 · {{下一步标题}}」按钮取文案） */
const WIZ_STEPS = [
  { title: "设置输入", description: "源数据源与取数方式" },
  { title: "设置输出", description: "目标数据源与写入表" },
  { title: "设置配置", description: "调度与运行参数" },
];

/** 一个输出目标的表单草稿（多目标时 form.targets 里有多份） */
type TargetForm = {
  targetDatasourceId: number | null;
  targetTable: string;
  writeMode: string;
  /** 同步模式：FULL 全量 / INCREMENTAL 增量 */
  syncMode: "FULL" | "INCREMENTAL";
  /** 增量字段（源结果集里存在的列名；多选时按选择顺序构成复合水位） */
  incFields: string[];
  /** 增量每批数量（单次执行最多同步条数），null=不限 */
  incBatchSize: number | null;
  /** 批量提交条数 */
  batchSize: number;
  /** 该目标的字段映射 */
  mapping: SyncFieldMapping[];
  /** 该目标自己的预览结果（目标表结构各不同，不能共用） */
  previewTargetColumns: SyncColumn[];
  previewWarnings: string[];
  /** 增量水位（仅编辑时展示；服务端执行成功后回写，不随表单提交） */
  lastSeq: string;
};

/** 新建一个空目标 */
const emptyTarget = (): TargetForm => ({
  targetDatasourceId: null,
  targetTable: "",
  writeMode: "INSERT",
  syncMode: "FULL",
  incFields: [],
  incBatchSize: null,
  batchSize: 500,
  mapping: [],
  previewTargetColumns: [],
  previewWarnings: [],
  lastSeq: "",
});

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
  /** 输出目标列表（方案 D：汇总折叠，同时只展开一个） */
  targets: [emptyTarget()] as TargetForm[],
  /** Hook 通知地址，空=不通知 */
  hookUrl: "",
  /** Hook 通知时机：DONE 完成通知 / ROW 每条数据+完成 */
  hookNotify: "DONE" as "DONE" | "ROW",
  cron: "",
  enabled: false,
});

/** 当前展开编辑的目标下标（方案 D：汇总行 + 折叠编辑） */
const activeTargetIndex = ref(0);
/**
 * 当前目标是否展开。
 *
 * <p>同时只展开一个：编辑区绑的是单个 activeTarget（表清单、预览、字段映射都是
 * 按目标单独加载的单例状态），允许多个同时展开会让每个编辑区都显示并改写同一个
 * 目标——界面直接说谎。因此这里做「手风琴 + 可全部收起」：点开新的自动收起旧的，
 * 再点自己则收起，全部收起时只剩摘要行，目标再多也不会把弹窗撑成一条长表单。</p>
 */
const targetExpanded = ref(true);
/** 某个目标是否展开 */
const isTargetOpen = (index: number): boolean => index === activeTargetIndex.value && targetExpanded.value;
/** 当前编辑的目标；targets 恒有 1 项，故不会为 undefined */
const activeTarget = computed<TargetForm>(() => form.targets[activeTargetIndex.value] ?? form.targets[0]);

/**
 * 目标行的数据源描述（汇总行第二行）
 *
 * <p>选中表已带库前缀时，库里那一段就是落库位置，比数据源名更有信息量，
 * 因此拼成「数据源名 · 库」；未选数据源时如实说未选。</p>
 *
 * @param target 目标草稿
 */
const targetDatasourceLabel = (target: TargetForm): string => {
  if (target.targetDatasourceId == null) return "未选择数据源";
  const name = dsName(target.targetDatasourceId);
  const table = target.targetTable.trim();
  const dot = table.indexOf(".");
  return dot > 0 ? `${name} · ${table.slice(0, dot)}` : name;
};

/** 添加一个输出目标：默认沿用当前目标的数据源与批量参数，表与映射留空 */
const addTarget = () => {
  const base = activeTarget.value;
  form.targets.push({
    ...emptyTarget(),
    targetDatasourceId: base.targetDatasourceId,
    batchSize: base.batchSize,
  });
  const index = form.targets.length - 1;
  activeTargetIndex.value = index;
  // 新加的目标自动展开，方便立刻填表
  targetExpanded.value = true;
  void loadTables(form.targets[index].targetDatasourceId, true);
};

/**
 * 切换某个目标的展开 / 收起
 *
 * <p>点开新目标会自动收起旧目标（编辑区只能对应一个目标）；再点当前已展开的
 * 目标则收起它，允许全部收起，只留摘要行。</p>
 *
 * @param index 目标下标
 */
const toggleTarget = (index: number) => {
  if (index === activeTargetIndex.value) {
    targetExpanded.value = !targetExpanded.value;
    return;
  }
  activeTargetIndex.value = index;
  targetExpanded.value = true;
  targetTables.value = [];
  void loadTables(form.targets[index].targetDatasourceId, true);
};

/**
 * 删除一个输出目标（至少保留一个，否则保存时没有落点）
 *
 * @param index 目标下标
 */
const removeTarget = (index: number) => {
  if (form.targets.length <= 1) {
    message.warning("至少保留一个输出目标");
    return;
  }
  form.targets.splice(index, 1);
  // 删除后下标可能越界：收敛到最后一个，避免 activeTarget 落到空对象上
  activeTargetIndex.value = Math.min(activeTargetIndex.value, form.targets.length - 1);
  // 删掉的正好是展开项时，把编辑区落到收敛后的目标上，避免出现「无目标展开」的空面板
  targetExpanded.value = true;
  void loadTables(activeTarget.value.targetDatasourceId, true);
};

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
 * ReFilePicker 的 loader：列后端所在机器的目录（filesystem-starter 的目录浏览接口）。
 * loader 必须由宿主配置为远端接口形状（FilePickerItem[]），不得回退到组件内置 mock。
 *
 * <p>「文件系统根」两边表达不同：组件用虚拟根 `/`。filesystem-starter 已按同一语义
 * 处理（Windows 返回盘符列表，类 Unix 直接列 `/`），所以这里不再做根目录重试。</p>
 *
 * <p>选择文件夹时也要求返回文件：最后一层目录里有什么文件，是用户确认「进对目录」的
 * 唯一依据；文件在目录模式下只展示、不可选。</p>
 *
 * @param path 当前目录（组件虚拟根为 `/`）
 */
const localFileLoader = async (path: string): Promise<FilePickerItem[]> => {
  const rows = await fetchLocalFiles(path || "", true);
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
    // 文件/目录源没有可靠水位列，后端只允许 JDBC / HTTP 走增量；切过来时先把**所有目标**调回全量，
    // 否则表单会停在「保存必被拒」的状态
    let downgraded = false;
    for (const target of form.targets) {
      if (target.syncMode === "INCREMENTAL") {
        target.syncMode = "FULL";
        downgraded = true;
      }
    }
    if (downgraded) {
      message.info("文件 / 文件夹输入源不支持增量模式，已切换为全量");
    }
  }
  // 换了源类型，上一次预览到的源列与各目标列都不再可信
  previewSourceColumns.value = [];
  for (const target of form.targets) {
    target.previewTargetColumns = [];
    target.previewWarnings = [];
  }
};

/**
 * 当前输入源是否支持增量：后端只允许 JDBC / HTTP 源走增量（文件/目录没有可靠水位列）。
 */
const incrementalSourceSupported = computed(
  () => form.sourceType === "JDBC" || form.sourceType === "HTTP_JSON" || form.sourceType === "HTTP_HTML",
);

/**
 * 复合水位的可读说明：把选择顺序显式写出来。
 *
 * <p>顺序本身就是配置的一部分（字典序比较），不展示用户会以为是「一组字段」而随意调换。</p>
 */
const incFieldOrderText = computed(() =>
  activeTarget.value.incFields.map((field, index) => `${index + 1}. ${field}`).join(" → "),
);

/**
 * 是否有任一目标使用增量模式
 *
 * <p>Hook 的「每条数据 + 完成通知」只在增量下有意义（全量没有水位，逐条推送会与
 * 完成通知的语义打架），多目标下只要有一个增量目标就放开该选项。</p>
 */
const anyIncrementalTarget = computed(() => form.targets.some(target => target.syncMode === "INCREMENTAL"));

/**
 * 切换同步模式：增量模式下把「先清空再插入」换成「存在即更新」。
 *
 * <p>先清空语义与增量水位天然冲突——每批执行都会把目标表清掉，
 * 上一轮同步的数据直接消失。后端也会在保存时拦，这里提前调好少一次报错往返。</p>
 */
const onSyncModeChange = (mode: string | number | boolean | undefined) => {
  const target = activeTarget.value;
  if (mode !== "INCREMENTAL") {
    // 切到全量只让增量配置**失效**，不抹掉：后端保存全量时也刻意保留已存的增量配置
    // （见 applyModeAndHook），前端先清空反而会让用户切回来时白选一遍。
    return;
  }
  if (!incrementalSourceSupported.value) {
    target.syncMode = "FULL";
    message.warning("增量模式仅支持 JDBC / HTTP 输入源，已切回全量");
    return;
  }
  if (target.writeMode === "OVERWRITE") {
    target.writeMode = "UPSERT";
    message.info("增量模式已将写入模式调整为「存在即更新」——先清空再插入会清掉未同步的数据");
  }
  if (!sourceColumnOptions.value.length) {
    message.info("先回第①步点「下一步」完成源校验，增量字段下拉才会列出源结果集列（也可直接手输列名）");
  }
};

/**
 * 任务生效的同步模式（存量行该列为空时按全量）
 * @param row 任务
 */
const effectiveSyncMode = (row: SyncTask): string => row.syncTaskSyncMode || "FULL";

/**
 * 任务的输出目标个数
 *
 * <p>多目标任务的旧单目标字段只镜像第一个目标，列表里光看表名会漏掉其余表，
 * 因此按服务端存的 targets JSON 数个数（坏 JSON 时退回 1）。</p>
 *
 * @param row 任务
 */
const targetCount = (row: SyncTask): number => {
  const json = row.syncTaskTargets;
  if (!json) return 1;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) && parsed.length ? parsed.length : 1;
  } catch {
    return 1;
  }
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

/** 仅 jdbc 类型数据源；id 是数据源主键、缺了就没法作为选项值，故一并滤掉 */
const jdbcSources = computed(() =>
  datasources.value.filter(
    (ds): ds is DataSourceInfo & { id: number } =>
      (ds.type || "").toLowerCase() === "jdbc" && typeof ds.id === "number",
  ),
);

/** 源列下拉项（优先用预览结果，未预览时给一个占位以支持手填） */
const sourceColumnOptions = computed<SyncColumn[]>(() => previewSourceColumns.value);

/** 目标列下拉项（当前展开目标的预览结果） */
const targetColumnOptions = computed<SyncColumn[]>(() => activeTarget.value.previewTargetColumns);

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
/** 写入模式筛选：'all'=全部（空串会被 el-select 当未选择，显示「请选择」而非选项文案） */
const writeModeFilter = ref("all");
/** 任务名称搜索（UI 图右上搜索框；e2e 对照的「不匹配即归零」口径同样经过它） */
const nameFilter = ref("");
/**
 * 表格统一 ReTable 的列定义（原七个 el-table-column 收敛于此）。
 *
 * <p>七列全部自定义渲染：prop 只作列的稳定标识（列设置 / 持久化按键），
 * 单元格内容一律走 {@code #col-<prop>} 插槽；宽度 / 对齐 / 固定列与 UI 图逐列一致。</p>
 */
const taskColumns: ReTableColumn[] = [
  { prop: "task", label: "任务", minWidth: 180 },
  { prop: "flow", label: "数据流向", minWidth: 180 },
  { prop: "writeMode", label: "写入模式", width: 100, align: "center" },
  { prop: "cron", label: "定时", width: 110 },
  { prop: "enabled", label: "启用", width: 66, align: "center" },
  { prop: "lastRun", label: "最近执行", minWidth: 176 },
  { prop: "actions", label: "操作", width: 150, fixed: "right", align: "center" },
];
/**
 * 字段映射列（编辑弹窗第 ② 步）：三列全是自定义控件（两个下拉 + 删除按钮），
 * 故每列都配 slot；「操作」列没有对应数据字段，造稳定合成 prop `actions`。
 *
 * <p>原来是无表头的 flex 行，方向靠中间一个 `→` 箭头表达；改成真表头后
 * 「源字段 / 目标字段」列名本身就说清了方向，箭头不再需要。</p>
 */
const mappingColumns: ReTableColumn[] = [
  { prop: "source", label: "源字段", slot: "source" },
  { prop: "target", label: "目标字段", slot: "target" },
  { prop: "actions", label: "操作", width: 84, align: "center", slot: "actions" },
];
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
/**
 * 某个目标可选的写入模式。
 *
 * <p>「先清空再插入」（OVERWRITE）与增量水位互斥：增量每批都会清空目标表，
 * 配在一起只会把数据清光。这种组合不是「暂时不可用」，而是根本不成立，
 * 因此增量模式下直接不列出该项，而不是列出来再置灰。</p>
 *
 * @param target 目标草稿
 */
const writeModesFor = (target: TargetForm): SyncWriteMode[] =>
  target.syncMode === "INCREMENTAL"
    ? writeModes.value.filter(m => m.code !== "OVERWRITE")
    : writeModes.value;
/** 运行中的任务：本地点击「立即执行」期间标记，后端无 RUNNING 状态字段 */
const runningIds = ref<Set<number>>(new Set());
/** 任务状态归类 */
function statusOf(row: SyncTask): Exclude<StatusKey, "all"> {
  // 执行中优先于启用态：停用只代表没有定时调度，手动「立即执行」照常可跑，
  // 因此停用任务执行期间也必须计入「运行中」，否则 KPI 与分段计数会漏掉它。
  if (runningIds.value.has(row.id)) return "running";
  if (row.syncTaskEnabled !== 1) return "disabled";
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
/** 基础集：写入模式 + 时间范围 + 名称搜索三道与状态无关的过滤 */
const baseTasks = computed(() => tasks.value.filter(row =>
  (writeModeFilter.value === "all" || row.syncTaskWriteMode === writeModeFilter.value)
  && inRange(row)
  && (!nameFilter.value.trim() || (row.syncTaskName || "").toLowerCase().includes(nameFilter.value.trim().toLowerCase())),
));
/** 表格实际数据源：基础集再按状态分段收一道（ReTable 自带分页会按 page/pageSize 切片） */
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
/**
 * Spring 6 段 cron → 中文一句话（定时列第二行，UI 图里的「每 5 分钟」）。
 *
 * <p>只解析演示数据里出现的形状（秒 分 时 日 月 周），不追求完整 cron 语义：
 * 其它形状原样回显 cron，不伪造中文。</p>
 *
 * @param expr cron 表达式
 */
function cronDesc(expr?: string | null): string {
  const raw = (expr || "").trim().split(/\s+/);
  // Quartz/Spring 常见第 7 段是年份（如 "2099"）：中文描述只看前 6 段的调度语义
  const parts = raw.length === 7 ? raw.slice(0, 6) : raw;
  if (parts.length !== 6) return "";
  const [sec, min, hour, dom, mon, dow] = parts;
  if (sec === "0" && dom === "*" && mon === "*" && dow === "?") {
    if (min !== "*" && hour === "*") {
      const stepMin = /^0\/(\d+)$/.exec(min);
      if (stepMin) return `每 ${stepMin[1]} 分钟`;
    }
    if (/^\d+$/.test(min) && hour === "*") return `每 1 小时`;
    if (/^\d+$/.test(min) && /^\d+$/.test(hour)) return `每天 ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
    if (/^\d+$/.test(min) && /^0\/(\d+)$/.test(hour)) return `每 ${/^0\/(\d+)$/.exec(hour)![1]} 小时`;
  }
  if (sec === "0" && /^\d+$/.test(min) && /^\d+$/.test(hour) && /^\d+$/.test(dom) && mon === "*" && dow === "?") {
    return `每月 ${dom} 日 ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  }
  if (sec === "0" && /^\d+$/.test(min) && /^\d+$/.test(hour) && dom === "?" && mon === "*" && /^\d+$/.test(dow)) {
    return `每周${"日一二三四五六"[Number(dow) % 7]} ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  }
  return "";
}

/**
 * cron 显示用短式：7 段（带年份）只显示前 6 段调度语义，全文落在 title。
 * @param expr cron 表达式
 */
function cronShort(expr?: string | null): string {
  const raw = (expr || "").trim().split(/\s+/);
  return (raw.length === 7 ? raw.slice(0, 6) : raw).join(" ");
}

/** 失败任务（全量口径：横幅与全部重试的输入，不随筛选跳动） */
const failedTasks = computed(() => tasks.value.filter(t => statusOf(t) === "failed"));
/** 横幅本轮是否被手动关闭 */
const bannerDismissed = ref(false);
/** 全部重试进行中 */
const retryingAll = ref(false);
/**
 * 全部重试：对失败任务逐个立即执行，最后统一刷新。
 * @returns 是否全部成功
 */
const retryAllFailed = async (): Promise<void> => {
  if (!failedTasks.value.length || retryingAll.value) {
    return;
  }
  retryingAll.value = true;
  try {
    for (const t of failedTasks.value) {
      await run(t);
    }
  } finally {
    retryingAll.value = false;
  }
};
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
/** 四张 KPI 卡（标题/字段口径保持 e2e 契约：4 卡 + .re-stat-card__title 文案不变） */
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
/** 源侧摘要（表格「任务」列副标题用的文案）：返回**完整**原文（SQL / 路径），
 *  超长交给 CSS 省略（.st-sub-clip）+ title 悬停看全文 —— JS 硬截会让悬停也拿不到
 *  后半段，长 SQL 一旦需要核对（尤其删除前）就必须能看到全量。 */
function sourceBrief(row: SyncTask): string {
  const t = (row.syncTaskSourceType || "JDBC").toUpperCase();
  if (t === "JDBC") return row.syncTaskSourceSql || "自定义 SQL";
  if (t === "DIR") return row.syncTaskSourcePath || "目录";
  if (t === "FILE" || t.startsWith("HTTP")) return row.syncTaskSourcePath || "—";
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

/** 拉数据源台账 */
const loadDatasources = async () => {
  try {
    datasources.value = await fetchDataSources();
  } catch (e) {
    message.error("加载数据源失败：" + (e as Error)?.message);
  }
};

/** 拉任务列表 */
const refresh = async () => {
  loading.value = true;
  try {
    tasks.value = await fetchSyncTasks();
    // 「N 分钟前更新」的时间戳。
    // 这里**不能**清空 runningIds：refresh 可能在别的任务仍在执行时被调用
    // （手动刷新、重试其它任务、日志轮询），清空会把在跑的任务误判成已结束。
    // 执行中的标记只由 run() 的 finally 在本次请求真正返回后移除。
    refreshedAt.value = Date.now();
    // 新数据进来：横幅按新失败集重算（本轮手动关闭失效）
    bannerDismissed.value = false;
  } catch (e) {
    message.error("加载同步任务失败：" + (e as Error)?.message);
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
    // 源/目标侧都直接拿「库.表」限定名，选中值即真实库+表名，避免会话缓存库名与
    // 表实际所在库不一致——源端漏拼库会让 `SELECT * FROM device_channel` 落在源数据源
    // 的默认库（jdbc_acc）上，报 Table '<默认库>.device_channel' doesn't exist。
    const list = await fetchMonitorTablesQualified(id);
    if (target) {
      targetTables.value = list;
      // 手填裸表名时仍用缓存库兜底；选中下拉项的值已带库前缀，这里只作降级。
      targetDatabase.value = getDatasourceDatabase(Number(id)) ?? "";
    } else {
      sourceTables.value = list;
      sourceDatabase.value = getDatasourceDatabase(Number(id)) ?? "";
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

/** 目标数据源变更：换库后目标表与目标列都失效 */
const onTargetChange = async () => {
  const target = activeTarget.value;
  target.previewTargetColumns = [];
  target.previewWarnings = [];
  await loadTables(target.targetDatasourceId, true);
};

/** 限定表名 → SQL 段：`库.表` 拆成 `` `库`.`表` ``，裸表名保持 `` `表` `` */
const sourceTableRef = (table: string): string => {
  const dot = table.indexOf(".");
  return dot > 0
    ? `\`${table.slice(0, dot)}\`.\`${table.slice(dot + 1)}\``
    : `\`${table}\``;
};

/** 由所选表生成源 SQL */
const applySourceTable = () => {
  if (pickedSourceTable.value) {
    form.sourceSql = `SELECT * FROM ${sourceTableRef(pickedSourceTable.value)}`;
  }
};

/**
 * 清除所选表：随选表自动生成的 SQL 一并清掉。
 * 不清的话，只读框里会留着旧表的 SELECT，与「未选表」的状态自相矛盾
 * （run8 实测：数据表已清空、SQL 仍是 `SELECT * FROM flyway_schema_history`）。
 */
const onSourceTableClear = () => {
  form.sourceSql = "";
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
 * 某一步的校验结论（纯函数、无副作用：只读表单，不弹消息、不改状态）。
 * 「下一步」拦截与页脚实时状态条共用这同一条真实结论，保证两处口径一致。
 * @param index 步骤下标
 * @returns 通过返回 null，否则返回第一条待完善说明
 */
const stepIssue = (index: number): string | null => {
  if (index === 0) {
    if (form.sourceType === "JDBC") {
      if (form.sourceDatasourceId == null) return "请先选择源数据源";
      // 取数方式与 SQL 的校验语义联动：选表时只要求「表已选」（SQL 由表生成），
      // 自定义 SQL 时才要求「以 SELECT 开头」——两种模式下把同一条规则套上去，
      // 会让选表模式因为生成语句的空白差异误报，也会让 SQL 模式漏掉真正的语法要求。
      if (sourceMode.value === "table") {
        if (!pickedSourceTable.value) return "请选择数据表（或在「自定义 SQL」里直接写语句）";
        return null;
      }
      if (!form.sourceSql.trim()) return "请填写源读取 SQL";
      if (!/^\s*select/i.test(form.sourceSql)) return "源读取 SQL 必须以 SELECT 开头";
      return null;
    }
    const path = form.sourcePath.trim();
    if (!path) {
      if (form.sourceType === "FILE") return "请选择要同步的文件";
      if (form.sourceType === "DIR") return "请选择要监听的文件夹";
      return "请填写请求地址";
    }
    if (form.sourceType === "HTTP_JSON" || form.sourceType === "HTTP_HTML") {
      if (!/^https?:\/\//i.test(path)) return "请求地址必须以 http:// 或 https:// 开头";
    }
    return null;
  }
  if (index === 1) {
    if (!form.targets.length) return "请至少配置一个输出目标";
    // 同一张表配两次没有意义：两个目标会互相覆盖，水位也会各自记一份，先拦下来
    const seen = new Set<string>();
    for (let i = 0; i < form.targets.length; i++) {
      const target = form.targets[i];
      const prefix = form.targets.length > 1 ? `目标 ${i + 1}：` : "";
      if (target.targetDatasourceId == null) return `${prefix}请先选择目标数据源`;
      if (!target.targetTable.trim()) return `${prefix}请选择或输入目标数据表`;
      const key = `${target.targetDatasourceId}#${target.targetTable.trim().toLowerCase()}`;
      if (seen.has(key)) return `${prefix}与前面的目标写入了同一张表（${target.targetTable.trim()}）`;
      seen.add(key);
      if (target.syncMode === "INCREMENTAL") {
        if (!incrementalSourceSupported.value) {
          return `${prefix}增量模式仅支持 JDBC / HTTP 输入源，文件/目录请用全量`;
        }
        const incFields = target.incFields.map(field => field.trim()).filter(Boolean);
        if (!incFields.length) return `${prefix}增量模式必须选择增量字段`;
        for (const incField of incFields) {
          if (!/^[A-Za-z0-9_]{1,64}$/.test(incField)) {
            return `${prefix}增量字段名只允许字母、数字、下划线：${incField}`;
          }
        }
        const missing = incFields.filter(
          field => !sourceColumnOptions.value.some(col => col.name.toLowerCase() === field.toLowerCase()),
        );
        if (sourceColumnOptions.value.length && missing.length) {
          return `${prefix}增量字段「${missing.join("、")}」不在源结果集列中`;
        }
        if (target.writeMode === "OVERWRITE") {
          return `${prefix}增量模式不能使用「先清空再插入」（每批都会清空目标表）`;
        }
      }
    }
    return null;
  }
  if (index === 2) {
    const hookUrl = form.hookUrl.trim();
    if (hookUrl && !/^https?:\/\//i.test(hookUrl)) return "Hook 通知地址必须以 http:// 或 https:// 开头";
    if (hookUrl.length > 512) return "Hook 通知地址过长（最多 512 字符）";
    return null;
  }
  return null;
};

/**
 * 校验某一步能否进入下一步（stepIssue 的包装：拦截时如实弹出第一条问题）
 * @param index 步骤下标
 */
const validateStep = (index: number): boolean => {
  const issue = stepIssue(index);
  if (issue) {
    message.warning(issue);
    return false;
  }
  return true;
};

/** 当前步骤的实时校验结论（页脚状态条用；随表单输入即时更新） */
const stepIssueNow = computed(() => stepIssue(step.value));

/** 下一步 */
const nextStep = async () => {
  if (!validateStep(step.value)) {
    return;
  }
  // 第①步还要真读一次源：语法合法 ≠ 表存在。早先这里只查「以 SELECT 开头」，
  // 源表不存在也能一路进第②步，配完目标表与映射才在预览时被打回，白走一整套。
  if (step.value === 0 && !(await verifySourceReadable())) {
    return;
  }
  step.value = Math.min(2, step.value + 1);
};

/** 上一步 */
const prevStep = () => {
  step.value = Math.max(0, step.value - 1);
};

/**
 * 真读一次源，确认 SQL / 文件可用（向导第①步「下一步」的放行条件）。
 *
 * <p>校验与预览共用后端 `resolvePreviewSourceColumns`，所以这里放行就代表预览的
 * 源侧一定能过；失败文案原样展示（如「源表不存在或无法读取: ...」），不再二次包装。</p>
 *
 * @returns 可读返回 true，否则弹提示并返回 false
 */
const verifySourceReadable = async (): Promise<boolean> => {
  if (form.sourceType === "JDBC") {
    if (form.sourceDatasourceId == null) {
      message.warning("请先选择源数据源");
      return false;
    }
    if (sourceMode.value === "table" && pickedSourceTable.value) {
      form.sourceSql = `SELECT * FROM ${sourceTableRef(pickedSourceTable.value)}`;
    }
  }
  sourceVerifying.value = true;
  try {
    const columns = await validateSyncSource({
      sourceType: form.sourceType,
      sourceDatasourceId: form.sourceDatasourceId,
      sourceSql: form.sourceSql,
      sourcePath: form.sourcePath,
      sourceOptions: buildSourceOptions(),
    });
    if (!columns.length) {
      message.warning("源没有返回任何列，请确认语句或文件内容");
      return false;
    }
    // 顺手把源列带进预览：第②步打开时映射候选立刻可用，不必再点一次预览
    previewSourceColumns.value = columns;
    return true;
  } catch (e) {
    const errText = (e as Error)?.message || "未知错误";
    message.error("源不可用：" + errText);
    // 源侧缺表只是数据源 / 库名 / 表名配错：光提示即可，不弹设计表。
    // 源表不归本系统创建，弹建表框会误导用户去建一张本不该建的源表。
    return false;
  } finally {
    sourceVerifying.value = false;
  }
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
  form.targets = [
    {
      ...emptyTarget(),
      targetDatasourceId: defaultTarget ? (defaultTarget.id ?? null) : null,
    },
  ];
  activeTargetIndex.value = 0;
  targetExpanded.value = true;
  form.hookUrl = "";
  form.hookNotify = "DONE";
  form.cron = "";
  form.enabled = false;
  previewSourceColumns.value = [];
  pickedSourceTable.value = null;
  sourceTables.value = [];
  targetTables.value = [];
  step.value = 0;
  sourceMode.value = "table";
  cronError.value = "";
  dialogVisible.value = true;
  void loadTables(form.sourceDatasourceId, false);
  void loadTables(form.targets[0].targetDatasourceId, true);
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
  // 多目标优先：服务端归一化后的 targets JSON 是权威值；存量任务该列为空时退回单目标三件套
  const restoredTargets = parseTargetJson(row.syncTaskTargets, row.syncTaskTargetSeqs);
  if (restoredTargets.length) {
    form.targets = restoredTargets;
  } else {
    form.targets = [
      {
        ...emptyTarget(),
        targetDatasourceId: row.syncTaskTargetDatasourceId ?? null,
        targetTable: row.syncTaskTargetTable || "",
        writeMode: row.syncTaskWriteMode || "INSERT",
        syncMode: row.syncTaskSyncMode === "INCREMENTAL" ? "INCREMENTAL" : "FULL",
        incFields: (row.syncTaskIncField || "")
          .split(",")
          .map(field => field.trim())
          .filter(Boolean),
        incBatchSize: row.syncTaskIncBatchSize ?? null,
        batchSize: row.syncTaskBatchSize || 500,
        mapping: parseMapping(row.syncTaskColumnMapping),
        lastSeq: row.syncTaskLastSeq || "",
      },
    ];
  }
  activeTargetIndex.value = 0;
  targetExpanded.value = true;
  form.hookUrl = row.syncTaskHookUrl || "";
  form.hookNotify = row.syncTaskHookNotify === "ROW" ? "ROW" : "DONE";
  form.cron = row.syncTaskCron || "";
  form.enabled = row.syncTaskEnabled === 1;
  previewSourceColumns.value = [];
  pickedSourceTable.value = null;
  sourceTables.value = [];
  targetTables.value = [];
  cronError.value = "";
  step.value = 0;
  // 存量 SQL 若正是「选表生成」的形状，则回到选表模式并回填表名；否则进 SQL 模式（可编辑），
  // 否则 readonly 的 SQL 框会让存量自定义 SQL 无法修改。
  // 注意：选表生成的 SQL 是「库.表」限定形态（`库`.`表`），早先这里只认单反引号
  // （`表`），存量任务一编辑就匹配不上 → 掉进 SQL 模式且选中表为空，之后预览
  // 失败时既定位不到源侧缺表，也回填不了表名。两种形态都要认。
  const tableHit =
    /^\s*select\s+\*\s+from\s+`([^`]+)`\s*\.\s*`([^`]+)`\s*;?\s*$/i.exec(row.syncTaskSourceSql || "") ||
    /^\s*select\s+\*\s+from\s+`([^`]+)`\s*;?\s*$/i.exec(row.syncTaskSourceSql || "");
  const restoredTable = tableHit ? (tableHit[2] ? `${tableHit[1]}.${tableHit[2]}` : tableHit[1]) : null;
  sourceMode.value = tableHit ? "table" : "sql";
  pickedSourceTable.value = restoredTable;
  dialogVisible.value = true;
  void loadTables(form.sourceDatasourceId, false);
  void loadTables(form.targets[activeTargetIndex.value].targetDatasourceId, true);
};

/**
 * 解析多目标 JSON（服务端 ms_sync_task_targets）
 *
 * <p>坏 JSON / 空数组一律回落到空列表，让调用方退回单目标三件套——
 * 宁可少显示一个目标，也不要因为历史脏数据打不开编辑弹窗。</p>
 *
 * @param json 存储值
 */
const parseTargetJson = (json?: string | null, seqsJson?: string | null): TargetForm[] => {
  if (!json) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  // 水位不写在 targets JSON 里（服务端单独存 ms_sync_task_target_seqs，键是「数据源ID#表名」），
  // 编辑时并进来只为了把「当前水位」显示出来；它照旧不随保存提交。
  let seqs: Record<string, unknown> = {};
  if (seqsJson) {
    try {
      const parsedSeqs = JSON.parse(seqsJson);
      if (parsedSeqs && typeof parsedSeqs === "object" && !Array.isArray(parsedSeqs)) {
        seqs = parsedSeqs as Record<string, unknown>;
      }
    } catch {
      seqs = {};
    }
  }
  const list: TargetForm[] = [];
  for (const raw of parsed) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const item = raw as Record<string, unknown>;
    const datasourceId = item.targetDatasourceId;
    const table = typeof item.targetTable === "string" ? item.targetTable : "";
    const seqKey = typeof datasourceId === "number" ? `${datasourceId}#${table}` : "";
    const seqValue = seqKey ? seqs[seqKey] : undefined;
    list.push({
      ...emptyTarget(),
      targetDatasourceId: typeof datasourceId === "number" ? datasourceId : null,
      targetTable: table,
      writeMode: typeof item.writeMode === "string" && item.writeMode ? item.writeMode : "INSERT",
      syncMode: item.syncMode === "INCREMENTAL" ? "INCREMENTAL" : "FULL",
      incFields: Array.isArray(item.incFields)
        ? item.incFields.filter((field): field is string => typeof field === "string")
        : [],
      incBatchSize: typeof item.incBatchSize === "number" ? item.incBatchSize : null,
      batchSize: typeof item.batchSize === "number" ? item.batchSize : 500,
      mapping: typeof item.columnMapping === "string" ? parseMapping(item.columnMapping) : [],
      lastSeq: typeof seqValue === "string" ? seqValue : "",
    });
  }
  return list;
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
  activeTarget.value.mapping.push({ source: "", target: "" });
};

/**
 * 删一行映射（ReTable 插槽只回传 row，没有 el-table 列插槽的 $index，
 * 故按下标查找后 splice —— 与原 `mapping.splice(index, 1)` 等价）。
 */
const removeMappingRow = (cellRow: Record<string, unknown>) => {
  const item = cellRow as unknown as SyncFieldMapping;
  const mapping = activeTarget.value.mapping;
  const i = mapping.indexOf(item);
  if (i >= 0) mapping.splice(i, 1);
};

/** 预览并自动配对（针对当前展开的目标） */
const doPreview = async () => {
  const target = activeTarget.value;
  if (target.targetDatasourceId == null) {
    message.warning("请先选择目标数据源");
    return;
  }
  if (form.sourceType === "JDBC") {
    if (form.sourceDatasourceId == null) {
      message.warning("请先选择源数据源");
      return;
    }
    if (!form.sourceSql.trim()) {
      message.warning("请先填写源读取 SQL");
      return;
    }
  } else if (!form.sourcePath.trim()) {
    message.warning("请先选择文件或文件夹");
    return;
  }
  if (!target.targetTable.trim()) {
    message.warning("请先填写目标表名");
    return;
  }
  // 选表模式下 SQL 由选中表派生，预览前按当前值重建一次：
  // 否则「先选表、后换数据源/库或表被重建」时会拿旧 SQL 去 prepare，
  // 报出的就是 `Table '旧库.旧表' doesn't exist` 这类与界面完全对不上的错。
  if (form.sourceType === "JDBC" && sourceMode.value === "table" && pickedSourceTable.value) {
    form.sourceSql = `SELECT * FROM ${sourceTableRef(pickedSourceTable.value)}`;
  }
  // 选表模式下改过数据源/表被删时，SQL 与表清单可能指向已不存在的对象：
  // 先确认表还在清单里，不在就先刷新清单并提示重选，而不是发一个必然失败的请求。
  if (form.sourceType === "JDBC" && sourceMode.value === "table" && pickedSourceTable.value) {
    if (sourceTables.value.length && !sourceTables.value.some(t => sameTable(t, pickedSourceTable.value!))) {
      message.warning(`源表 ${pickedSourceTable.value} 已不在当前数据源的表清单里，请重新选择源表`);
      await loadTables(form.sourceDatasourceId, false);
      pickedSourceTable.value = null;
      form.sourceSql = "";
      return;
    }
  }
  try {
    const preview = await previewSyncMapping({
      sourceType: form.sourceType,
      sourceDatasourceId: form.sourceDatasourceId,
      sourceSql: form.sourceSql,
      sourcePath: form.sourcePath,
      sourceOptions: buildSourceOptions(),
      targetDatasourceId: target.targetDatasourceId,
      targetTable: qualifiedTargetTable(target),
      mapping: target.mapping.filter(item => item.source && item.target),
    });
    previewSourceColumns.value = preview.sourceColumns;
    target.previewTargetColumns = preview.targetColumns;
    target.previewWarnings = preview.warnings;
    target.mapping = preview.mapping.map(item => ({ ...item }));
    message.success(`源 ${preview.sourceColumns.length} 列 / 目标 ${preview.targetColumns.length} 列，已配对 ${preview.mapping.length} 项`);
  } catch (e) {
    target.previewWarnings = [];
    // 局部名不能叫 message：它会遮蔽顶部 import 的 message 提示器，
    // 下一行 message.error(...) 直接抛 TypeError，把整个 catch 打断 ——
    // 用户既看不到失败提示，下面的「表不存在 → 弹设计表」也永远不会执行
    // （表现为：目标表填错了却毫无反应，设计表向导在这条路径上打不开）。
    const errText = (e as Error)?.message || "未知错误";
    message.error("预览失败：" + errText);
    // 「表不存在」不是配置填错，光提示用户也续不上 —— 直接弹设计表，
    // 在缺表的那一侧库建好后回填表名并自动续跑预览。
    // 但源侧缺表必须排除：源表不归本系统创建，缺了是数据源 / 库名 / 表名配错，
    // 弹建表框会误导用户去建一张本不该建的源表（后端源侧文案含「无法读取」，
    // 会命中 isTableMissingError，必须显式排除）。
    if (isTableMissingError(errText) && !isSourceTableMissingError(errText)) {
      void openTableDesigner(errText);
    }
  }
};

/** 设计表网格的一行（与 CreateTableDialog 的列定义同形；来自源表元数据时只填真实读到的项） */
type DesignerColumn = {
  name: string;
  type?: string;
  size?: number | null;
  scale?: number | null;
  nullable?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  defaultValue?: string;
  comment?: string;
  enumText?: string;
};

/** 表设计器（预览发现「表不存在」时弹出）：可见性 */
const tableDesignerVisible = ref(false);
/** 缺失的表在哪一侧：决定设计器连哪个数据源、建完刷新哪张表清单 */
const designerSide = ref<"source" | "target">("target");
/** 预填的表名（缺失表名；用户可在设计器里改） */
const designerTable = ref("");
/** 预填的列：目标侧缺表时带入真实源列，源侧缺表（无从读列）留空由用户设计 */
const designerColumns = ref<DesignerColumn[]>([]);
/** 设计器要连的数据源 ID */
const designerDatasourceId = ref<number | null>(null);
/** 设计器要建表所在的库（与 JDBC 数据库管理器「新建表」同口径：弹窗展示目标库并按库建表） */
const designerDatabase = ref("");

/** 预览报错是不是「表不存在」（MySQL / PostgreSQL / Oracle 三种方言 + 后端约定文案） */
const isTableMissingError = (message: string): boolean =>
  /doesn'?t exist|does not exist|ORA-00942|表不存在|无法读取/i.test(message);

/**
 * 后端约定：源侧读取失败。
 *
 * <p>{@code SyncTaskServiceImpl.loadSourceColumns} 把驱动原生异常统一成
 * 「源表不存在或无法读取: ...」，前端据此把缺表定位到源侧。
 * 否则原生串会被当成目标侧缺表，去建一张本来就不该建的表。</p>
 */
const isSourceTableMissingError = (message: string): boolean =>
  /源表不存在或无法读取/.test(message);

/** 目标侧缺表的后端约定文案 */
const isTargetTableMissingError = (message: string): boolean =>
  /目标表不存在或没有可读列/.test(message);

/**
 * 从方言报错里抠出缺失的表名。
 *
 * <p><b>保留库前缀</b>：早先这里 {@code raw.split(".").pop()} 只剩裸表名，
 * 而源表选中值、目标表提交值都是「库.表」限定名，比对必然不相等，
 * 于是「源侧缺表」被误判成「目标侧缺表」。现在返回原样的限定名，
 * 由 {@link detectMissingSide} 用「裸名 + 限定名」两种形态比对。</p>
 */
const parseMissingTable = (message: string): string | null => {
  const hit =
    /Table '([^']+)'/.exec(message) ||
    /relation "([^"]+)"/.exec(message) ||
    /表\s*[`'"]?([\w.]+)[`'"]?\s*不存在/.exec(message) ||
    // 后端约定文案：源表不存在或无法读取: Table 'db.tbl' ... / 目标表不存在或没有可读列: db.tbl
    /目标表不存在或没有可读列:\s*([\w.]+)/.exec(message) ||
    /无法读取:\s*Table '([^']+)'/.exec(message);
  const raw = (hit?.[1] ?? "").replace(/[`"]/g, "").trim();
  return raw || null;
};

/** 限定名与裸名的归一化比较：任一方为「库.表」都按裸表名对齐 */
const sameTable = (left: string, right: string): boolean => {
  const norm = (s: string) =>
    s.replace(/[`"\s]/g, "").toLowerCase().split(".").pop() ?? "";
  return Boolean(norm(left)) && norm(left) === norm(right);
};

/**
 * 缺失表在源侧还是目标侧。
 *
 * <p>判定顺序（前者优先，都是确定信息，不再猜）：
 * 1) 后端明确说是源侧/目标侧 → 直接采纳；
 * 2) 与目标表（含库前缀）同名 → 目标侧；
 * 3) 与选中的源表（含库前缀）同名，或出现在源 SQL 的 FROM/JOIN 里 → 源侧；
 * 4) 兜底目标侧（建目标表是主流场景）。</p>
 */
const detectMissingSide = (table: string | null): "source" | "target" => {
  if (form.sourceType !== "JDBC") {
    return "target";
  }
  if (!table) {
    return "target";
  }
  if (sameTable(activeTarget.value.targetTable, table)) {
    return "target";
  }
  if (sourceMode.value === "table" && pickedSourceTable.value && sameTable(pickedSourceTable.value, table)) {
    return "source";
  }
  if (sourceMode.value === "sql") {
    const refs = [...form.sourceSql.matchAll(/(?:from|join)\s+`?([\w.]+)`?/gi)].map(m => m[1] ?? "");
    if (refs.some(ref => sameTable(ref, table))) {
      return "source";
    }
  }
  return "target";
};

/** 目标侧预填：拿真实源列当设计起点（源列取不到就空着手设计，不编造列） */
const fetchSourcePrefill = async (): Promise<DesignerColumn[]> => {
  if (form.sourceType !== "JDBC" || form.sourceDatasourceId == null) {
    return [];
  }
  try {
    if (sourceMode.value === "table" && pickedSourceTable.value) {
      const table = pickedSourceTable.value;
      const dot = table.indexOf(".");
      const tableName = dot >= 0 ? table.slice(dot + 1) : table;
      const database = dot >= 0 ? table.slice(0, dot) : sourceDatabase.value || undefined;
      const columns = await fetchTableColumns(tableName, form.sourceDatasourceId, database);
      return columns.map(c => ({
        name: c.name,
        type: (c.baseType || c.type || "VARCHAR").toUpperCase(),
        size: c.size > 0 ? c.size : null,
        scale: c.scale && c.scale > 0 ? c.scale : null,
        nullable: c.nullable,
        primaryKey: c.isPrimaryKey ?? false,
        autoIncrement: c.autoIncrement ?? false,
        defaultValue: c.default ?? "",
        comment: c.remark ?? "",
        enumText: (c.enumValues ?? []).join(", "),
      }));
    }
  } catch {
    // 源列取不到（权限 / 方言差异）不拦建表：进设计器后手动设计
  }
  return [];
};

/** 预览失败且是「表不存在」→ 打开设计表向导 */
const openTableDesigner = async (message: string): Promise<void> => {
  const missing = parseMissingTable(message);
  // 后端已给出明确侧别时直接采纳，只在它没说清时才用名字比对兜底：
  // 原生方言串（旧版后端 / 非 MySQL）没有侧别信息，必须靠比对。
  const side: "source" | "target" = isSourceTableMissingError(message)
    ? "source"
    : isTargetTableMissingError(message)
      ? "target"
      : detectMissingSide(missing);
  designerSide.value = side;
  designerTable.value = missing ?? (side === "target" ? activeTarget.value.targetTable.trim() : pickedSourceTable.value ?? "");
  designerDatasourceId.value = (side === "target" ? activeTarget.value.targetDatasourceId : form.sourceDatasourceId) ?? null;
  // 与 JDBC 数据库管理器「新建表」同口径：把目标/源命中库带给设计器，
  // 弹窗展示目标库、建表也按该库，而不是落到数据源默认库（否则又是错库）。
  // 目标侧裸表名优先沿用源表所在库（resolveTargetDatabase），避免掉回登记主库 jdbc_acc。
  designerDatabase.value = side === "target" ? resolveTargetDatabase() : sourceDatabase.value;
  designerColumns.value = side === "target" ? await fetchSourcePrefill() : [];
  tableDesignerVisible.value = true;
};

/** 建表成功（后端已按方言 CREATE TABLE）→ 回填表名、刷新表清单并自动续跑预览 */
const onTableCreated = async (_database: string, table: string): Promise<void> => {
  // 设计器按目标库建表（database 已随弹窗传入），created 回传库名；把表名限定成
  // 「库.表」再回填，保证预览/保存与后台查列落在同一库（与选表下拉限定值口径一致）。
  const qualified = _database && !table.includes(".") ? `${_database}.${table}` : table;
  if (designerSide.value === "target") {
    activeTarget.value.targetTable = qualified;
    void loadTables(activeTarget.value.targetDatasourceId, true);
  } else {
    sourceMode.value = "table";
    pickedSourceTable.value = qualified;
    form.sourceSql = `SELECT * FROM ${sourceTableRef(qualified)}`;
    void loadTables(form.sourceDatasourceId, false);
  }
  await doPreview();
};

/**
 * 手填裸表名时应落到的目标库：
 * <p>1) 目标表已带库前缀（下拉选中值 / 用户手写 {@code 库.表}）→ 以它为准；
 * 2) 源是 JDBC 且选了带库前缀的源表 → 目标默认沿用源表所在库（同一库内同步是主流，
 *    也是「选 device_channel 却落到默认库 jdbc_acc」这类错库问题的根治：手填表名
 *    不再掉回数据源登记主库）；3) 其余退回目标数据源登记主库缓存兜底。</p>
 */
const resolveTargetDatabase = (target: TargetForm = activeTarget.value): string => {
  const raw = target.targetTable.trim();
  const dot = raw.indexOf(".");
  if (dot > 0) return raw.slice(0, dot);
  if (form.sourceType === "JDBC" && sourceMode.value === "table" && pickedSourceTable.value) {
    const sd = pickedSourceTable.value.indexOf(".");
    if (sd > 0) return pickedSourceTable.value.slice(0, sd);
  }
  return targetDatabase.value;
};

/**
 * 目标表提交值：把页面选中的表名补上库前缀。
 *
 * <p>表清单来自数据源中心（候选库逐个试出），命中的库存在 {@link targetDatabase}。
 * 后端 {@code SyncJdbcSupport.tableColumns/quoteTable} 原生支持 {@code 库.表}，
 * 因此提交为 {@code ngxacc.device_channel} 后预览/保存/执行全程一致。
 * 已带点的存量表名或用户手写的完整表名保持原样，避免重复拼库；
 * 手填裸表名时按 {@link resolveTargetDatabase} 落库（源表库优先）。</p>
 */
const qualifiedTargetTable = (target: TargetForm = activeTarget.value): string => {
  const raw = target.targetTable.trim();
  if (!raw) return raw;
  if (raw.includes(".")) return raw;
  const db = resolveTargetDatabase(target);
  return db ? `${db}.${raw}` : raw;
};

/** 下拉只展示裸表名，选中值保留「库.表」限定名 */
const displayTargetTable = (table: string): string => {
  const dot = table.lastIndexOf(".");
  return dot >= 0 ? table.slice(dot + 1) : table;
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
  if (!validateStep(2)) {
    step.value = 2;
    return;
  }
  if (cronError.value) {
    message.warning(cronError.value);
    return;
  }
  if (!form.name.trim()) {
    message.warning("任务名称不能为空");
    return;
  }
  if (form.enabled && !form.cron.trim()) {
    message.warning("启用定时前请先填写定时表达式");
    return;
  }
  // 多目标：每个目标独立转换。首个目标镜像回旧单目标字段，保证老任务/老脚本仍读得到值。
  const targets = form.targets.map(target => {
    const mapping = target.mapping.filter(item => item.source && item.target);
    return {
      targetDatasourceId: target.targetDatasourceId,
      targetTable: qualifiedTargetTable(target),
      writeMode: target.writeMode,
      syncMode: target.syncMode,
      // 全量模式也回传增量字段表单值：后端全量分支不覆盖存量配置，来回切换不丢水位
      incFields: target.syncMode === "INCREMENTAL"
        ? target.incFields.map(field => field.trim()).filter(Boolean)
        : [],
      incBatchSize: target.syncMode === "INCREMENTAL" ? (target.incBatchSize ?? null) : null,
      columnMapping: mapping.length ? JSON.stringify(mapping) : null,
      batchSize: target.batchSize,
    };
  });
  // validateStep 已在运行时保证非空，这里再收窄一次类型（number|null → number）
  const first = targets[0];
  if (!first || first.targetDatasourceId == null) {
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
      // 单目标时只发旧三件套（存储形态与历史任务一致），多目标才发 targets
      targetDatasourceId: first.targetDatasourceId,
      targetTable: first.targetTable,
      columnMapping: first.columnMapping,
      writeMode: first.writeMode,
      syncMode: first.syncMode,
      incField: first.incFields.length ? first.incFields.join(",") : null,
      incBatchSize: first.incBatchSize,
      batchSize: first.batchSize,
      targets: targets.length > 1 ? targets : null,
      hookUrl: form.hookUrl.trim() || null,
      hookNotify: form.hookNotify,
      cron: form.cron.trim() ? form.cron.trim() : null,
      enabled: form.enabled ? 1 : 0,
    };
    if (editingId.value) {
      await updateSyncTask(editingId.value, payload);
    } else {
      await createSyncTask(payload);
    }
    message.success("已保存");
    dialogVisible.value = false;
    await refresh();
  } catch (e) {
    message.error("保存失败：" + (e as Error)?.message);
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
    // 每次执行都记进本机日志（后端任务行只保留「最近一次」，历史靠这里累积）
    appendLogEntry(row.id, {
      at: result.runTime || new Date().toLocaleString(),
      status: result.status,
      read: result.readCount,
      write: result.writeCount,
      costMs: result.costMs,
      message: result.message || "",
    });
    if (result.status === "SUCCESS") {
      message.success(`执行成功：读 ${result.readCount} 行，写 ${result.writeCount} 行，${result.costMs}ms`);
    } else {
      message.error(`执行失败：${result.message}`);
    }
  } catch (e) {
    // 同上：局部名不能叫 message（会遮蔽 import 进来的提示器，message.error 变 TypeError）
    const errText = (e as Error)?.message || String(e);
    // 网络 / 网关错误没有 runTime，用触发时刻记录；status 用 ERROR 与业务 FAILED 区分开
    appendLogEntry(row.id, {
      at: new Date().toLocaleString(),
      status: "ERROR",
      read: 0,
      write: 0,
      costMs: 0,
      message: errText,
    });
    message.error("执行失败：" + errText);
  } finally {
    runningId.value = null;
    // 只移除本次任务的标记：原来靠 refresh() 整体清空，但 refresh 可能在其它任务
    // 仍在执行时被调用（手动刷新 / 重试），那样会把在跑的任务误判成已结束。
    const rest = new Set(runningIds.value);
    rest.delete(row.id);
    runningIds.value = rest;
    await refresh();
  }
};

// ==================== 执行日志：服务端调试日志为主，本机记录为降级 ====================
// 主体是服务端逐步调试日志（GET /tasks/{id}/logs，后端内存环形缓冲：连源、SQL、列解析、
// 字段映射、逐文件读写、错误堆栈），弹窗打开期间轮询实时追加；顶部摘要条读任务行
// last_* 字段只给一眼上下文。服务端接口不可用时降级展示「本机执行记录」——本页每次
// 触发执行写进 localStorage 的真实结果，只记真实发生过的执行，不编造后端没有的数据。
/** localStorage key 前缀（按任务隔离） */
const LOG_LS_PREFIX = "monitor:sync-task-log:";
/** 单任务本机记录上限：只留最近 100 条，避免无限膨胀 */
const LOG_MAX_ENTRIES = 100;
/** 一条本机执行记录 */
type LogEntry = {
  at: string;
  status: string;
  read: number;
  write: number;
  costMs: number;
  message: string;
};
/** 日志弹窗可见性 */
const logVisible = ref(false);
/** 日志弹窗当前任务 */
const logTask = ref<SyncTask | null>(null);
/** 本机执行记录（新 → 旧；服务端接口不可用时的降级数据） */
const logEntries = ref<LogEntry[]>([]);
/** 服务端执行调试日志（进行中执行在最前，其后已完成执行新 → 旧） */
const logRuns = ref<SyncTaskRunLog[]>([]);
/** 服务端日志拉取错误；非空表示进入降级展示 */
const logFetchError = ref("");
/** 服务端日志拉取中 */
const logLoading = ref(false);
/** 当前激活的 ReTabs 页签名（默认最新一次执行；面板常驻显示该次过程日志，切换即显示） */
const activeLogRunName = ref("");

/** 与 logRunTabs / runOf 同口径的页签名（避免两处拼串漂移） */
function entryName(entry: SyncTaskRunLog, index: number): string {
  return `${entry.runTime}-${index}`;
}

/** 服务端执行调试日志 → ReTabs 页签（进行中在最前，其后已完成执行新 → 旧） */
const logRunTabs = computed<ReTabsItem[]>(() =>
  logRuns.value.map((entry, index) => ({
    name: entryName(entry, index),
    label: `${triggerLabel(entry.trigger)} · ${statusLabel(entry.status)}`,
    hint: `${entry.runTime} · ${entry.costMs ?? "—"} ms · ${entry.lines.length} 行`,
    status: entry.status === "RUNNING" ? ("unknown" as const) : (entry.status === "SUCCESS" ? ("online" as const) : ("alarm" as const)),
    closable: false,
  })),
);

/** 从页签回查对应执行记录（ReTabs 回传的是 ReTabsItem，需按 name 回查拿真实 lines） */
const runOf = (tab: ReTabsItem): SyncTaskRunLog =>
  logRuns.value.find((entry, index) => entryName(entry, index) === tab.name) ?? logRuns.value[0];
/** 弹窗打开期间的轮询句柄 */
let logPollTimer: ReturnType<typeof setInterval> | null = null;

/** 读某任务的本机记录（存储损坏时静默降级为空） */
const readLogEntries = (taskId: number): LogEntry[] => {
  try {
    const raw = localStorage.getItem(LOG_LS_PREFIX + taskId);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as LogEntry[]) : [];
  } catch {
    return [];
  }
};

/** 追加一条记录并回写存储；日志弹窗开着且正是这个任务时同步刷新列表 */
const appendLogEntry = (taskId: number, entry: LogEntry): void => {
  const list = [entry, ...readLogEntries(taskId)].slice(0, LOG_MAX_ENTRIES);
  try {
    localStorage.setItem(LOG_LS_PREFIX + taskId, JSON.stringify(list));
  } catch {
    // 隐私模式 / 存储满：记录是增强能力，写不进去不影响执行本身
  }
  if (logVisible.value && logTask.value?.id === taskId) {
    logEntries.value = list;
  }
};

/** 打开日志弹窗（操作列「日志」与失败横幅的任务名都走这里，绝不触碰新建）；
 *  服务端调试日志由 logVisible 的 watcher 拉取并启动轮询 */
const openLog = (row: SyncTask): void => {
  logTask.value = row;
  logEntries.value = readLogEntries(row.id);
  logRuns.value = [];
  logFetchError.value = "";
  activeLogRunName.value = "";
  logVisible.value = true;
};

/** 清空当前任务的本机记录 */
const clearLogEntries = (): void => {
  const task = logTask.value;
  if (!task) {
    return;
  }
  try {
    localStorage.removeItem(LOG_LS_PREFIX + task.id);
  } catch {
    // 存储不可用时列表本来就为空，清不掉也不影响
  }
  logEntries.value = [];
};

/** 拉取当前任务的服务端调试日志；失败时进入降级展示（错误原文如实显示给用户） */
const fetchLogRuns = async (): Promise<void> => {
  const task = logTask.value;
  if (!task || logLoading.value) {
    return;
  }
  logLoading.value = true;
  try {
    logRuns.value = await fetchSyncTaskLogs(task.id);
    logFetchError.value = "";
    await nextTick();
    // 打开弹窗时默认激活最新一次执行（排在 logRuns[0]）
    if (!activeLogRunName.value && logRuns.value.length) {
      activeLogRunName.value = entryName(logRuns.value[0], 0);
    }
    // 最新一次正在跑且正激活它时，跟随日志尾部滚动（排障时盯着最新行）
    if (logRuns.value[0]?.status === "RUNNING" && activeLogRunName.value === entryName(logRuns.value[0], 0)) {
      const body = document.querySelector(".st-log-dlg .re-tabs__panel .st-log-run-body");
      if (body) {
        body.scrollTop = body.scrollHeight;
      }
    }
  } catch (e) {
    logFetchError.value = (e as Error)?.message || String(e);
  } finally {
    logLoading.value = false;
  }
};

/** 触发方式展示名 */
const triggerLabel = (trigger: string): string =>
  trigger === "SCHEDULED" ? "定时" : trigger === "REALTIME" ? "实时" : "手动";

/** 执行状态展示名 */
const statusLabel = (status: string): string =>
  status === "RUNNING" ? "执行中" : status === "SUCCESS" ? "成功" : "失败";

/** 弹窗可见性联动：打开即拉一次并启动轮询（进行中的执行实时追加），关闭即停 */
watch(logVisible, async visible => {
  if (visible) {
    await fetchLogRuns();
    if (logPollTimer == null) {
      logPollTimer = setInterval(() => {
        if (!document.hidden) {
          void fetchLogRuns();
        }
      }, 1500);
    }
  } else if (logPollTimer != null) {
    clearInterval(logPollTimer);
    logPollTimer = null;
  }
});

/** 组件卸载兜底清理轮询 */
onUnmounted(() => {
  if (logPollTimer != null) {
    clearInterval(logPollTimer);
    logPollTimer = null;
  }
});

/**
 * 启停定时
 * @param row 任务
 * @param enabled 目标状态
 */
const toggle = async (row: SyncTask, enabled: boolean) => {
  try {
    if (enabled) {
      if (!row.syncTaskCron) {
        message.warning("该任务没有定时表达式，请先编辑任务填写 cron");
        return;
      }
      await enableSyncTask(row.id);
      message.success("已启用定时");
    } else {
      await disableSyncTask(row.id);
      message.success("已停用定时");
    }
    await refresh();
  } catch (e) {
    message.error("切换失败：" + (e as Error)?.message);
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
    message.success("已删除");
    await refresh();
  } catch (e) {
    message.error("删除失败：" + (e as Error)?.message);
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
/* ==================== 页面底 ==================== */
/* koi 变量口径：--bg-page 页面底 / --bg-container 卡面 / --border-subtle 柔和边框 /
   --text-primary/secondary/tertiary 三档文本 / --el-color-* 语义色（主题色联动） */
.sync-tasks {
  background: var(--bg-page);
  min-height: 100%;
  padding-bottom: 16px;
}
.sync-tasks .dsm-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 4px;
}
.sync-tasks .dsm-toolbar-left,
.sync-tasks .dsm-toolbar-right { flex: none; }
.st-page-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}
.st-env-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: 999px;
  padding: 2px 10px;
}
.st-page-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--text-tertiary);
}
.st-head-actions { gap: 12px; }
.st-body {
  margin: 0 24px;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: var(--bg-container);
  padding: 0 0 12px;
  overflow: hidden;
}

/* 表格统一 ReTable：卡面沿用 .st-body（外层已有边框 / 圆角 / 背景 / 内边距），
   关掉 ReTable 根自带的卡面样式，避免嵌套后出现双层边框与双重内边距。 */
.st-body :deep(.re-table) {
  border: 0;
  border-radius: 0;
  background: transparent;
  padding: 0;
}

/* ==================== KPI 卡 ==================== */
/* 卡面规格交给 ReStatCard，这里只负责四卡等宽排布与卡内 sparkline 的落位 */
.st-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 14px 24px 16px;
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

/* ==================== 失败告警横幅（UI 图红色条） ==================== */
.st-alert {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin: 0 24px 16px;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid var(--el-color-danger-light-7);
  background: var(--el-color-danger-light-9);
}
.st-alert-bell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  color: var(--el-color-white);
  background: var(--el-color-danger);
}
.st-alert-body { flex: 1; min-width: 0; }
.st-alert-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-color-danger);
}
.st-alert-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.st-alert-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 5px 6px 5px 10px;
  border-radius: 8px;
  border: 1px solid var(--el-color-danger-light-7);
  background: var(--el-color-white);
  cursor: pointer;
  font-size: 12px;
  color: var(--text-primary);
}
.st-alert-chip:hover { border-color: var(--el-color-danger); }
.st-alert-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-danger);
  flex-shrink: 0;
}
.st-alert-chip-name { font-weight: 600; white-space: nowrap; }
.st-alert-chip-msg {
  color: var(--el-color-danger);
  font-family: "JetBrains Mono", "Consolas", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.st-alert-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.st-alert-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
}
.st-alert-close:hover { color: var(--text-primary); background: var(--el-color-danger-light-8); }

/* ==================== 状态分段筛选 ==================== */
.st-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0 24px 12px;
}
.st-segments {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 10px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  /* 窄屏放不下时横向滚动，而不是把每个按钮压成竖排单字 */
  flex-wrap: nowrap;
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
}
.st-segments::-webkit-scrollbar { display: none; }
.st-seg {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: background 0.15s ease, color 0.15s ease;
  /* 关键：不允许按钮内部文字换行（否则窄屏会一字一行） */
  white-space: nowrap;
  flex: none;
}
.st-seg:hover { color: var(--text-primary); }
.st-seg.on {
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-weight: 600;
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
  flex: none;
}
/* 窄屏：筛选条改为两行堆叠，各控件按可用宽度伸缩，不再被压成竖排单字 */
@media (max-width: 900px) {
  .st-filter-bar { flex-direction: column; align-items: stretch; }
  .st-filter-right { flex-wrap: wrap; }
  .st-filter-right :deep(.st-filter-sel) { width: 148px; }
  .st-filter-right :deep(.st-search) { width: auto; flex: 1 1 180px; min-width: 0; }
}
@media (max-width: 620px) {
  .st-filter-right :deep(.st-filter-sel) { width: calc(50% - 5px); }
  .st-filter-right :deep(.st-search) { flex-basis: 100%; }
}
/* 必须用 :deep 抬高特异性并落在**后代**上：ReSelect 根同时挂自己的 data-v，
   父级 data-v 回落属性不保证在它身上（实测 .st-filter-sel[data-v-父] 匹配不上、
   被 .re-select{width:auto} 压到 46px 只剩箭头）。:deep 编译成
   `.st-filter-right[data-v-x] .st-filter-sel`，只认父容器的 scope，稳定命中。 */
.st-filter-right :deep(.st-filter-sel) { width: 168px; flex: none; }
/* el-input 根（span.el-input）会被 flex 压缩：显式 flex:none 保住 240px（实测曾被压到 84px） */
.st-filter-right :deep(.st-search) { width: 240px; flex: none; }
.st-refreshed {
  font-size: 12px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}

/* ==================== 表格行 ==================== */
.st-task-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.st-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--text-tertiary);
}
.st-dot.running { background: var(--el-color-primary); }
.st-dot.success { background: var(--el-color-success); }
.st-dot.failed { background: var(--el-color-danger); }
.st-dot.disabled { background: var(--el-border-color); }
.st-name-btn {
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: left;
  font-size: 14px;
}
.st-name-btn:hover { color: var(--el-color-primary); }

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
  max-width: 140px;
  padding: 3px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--bg-fill);
  font-size: 12px;
  color: var(--text-primary);
  font-family: "JetBrains Mono", "Consolas", monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.st-flow-arrow { color: var(--text-tertiary); flex-shrink: 0; }

/* 操作列：统一 ReButton square 纯图标按钮（flex nowrap：按钮默认 inline，多个排不下会折行）。
   square 自带 4px 左右外边距，在 st-acts 内清零，由 gap 统一控制 6px 间距。 */
.st-acts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
}
.st-acts :deep(.rs-btn) { margin: 0; }

/* 三步向导头部：与表单区留出呼吸感 */
/* ---------- 向导步骤条（UI 图）：圆序号 + 连接线 + 标题/说明，全走 koi 变量 ---------- */
.st-steps { display: flex; align-items: flex-start; margin-bottom: 18px; }
.st-step {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
/* 列间连接线：从本列圆右侧伸到下一列圆左侧（绝对定位，末列不渲染） */
.st-step-line {
  position: absolute;
  top: 15px;
  left: calc(50% + 21px);
  right: calc(-50% + 21px);
  height: 2px;
  border-radius: 1px;
  background: var(--border-subtle);
}
.st-step.is-done .st-step-line { background: var(--el-color-primary); }
.st-step-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 2px solid var(--border-default);
  border-radius: 50%;
  background: var(--bg-container);
  color: var(--text-tertiary);
  font-size: 13px;
  font-weight: 600;
}
.st-step.is-on .st-step-dot,
.st-step.is-done .st-step-dot {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.st-step-labels { display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
.st-step-title { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
.st-step.is-on .st-step-title { color: var(--el-color-primary); }
.st-step-desc { font-size: 12px; color: var(--text-tertiary); }
.st-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.st-sub { font-size: 12px; color: var(--text-tertiary); }
/* 源 SQL / 路径副标题：单行省略（长 SQL 不撑高行），全文靠 title 悬停 */
.st-sub-clip { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.st-sql { font-size: 12px; color: var(--text-secondary); }
.st-cron { font-size: 12px; color: var(--el-color-primary); }
.st-mode-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.st-last { display: flex; align-items: center; gap: 6px; margin-bottom: 2px; }
.st-msg { margin-top: 2px; font-size: 12px; color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-msg-fail { color: var(--el-color-danger); display: flex; align-items: center; gap: 4px; }
.st-form { display: flex; flex-direction: column; gap: 14px; max-height: 62vh; overflow-y: auto; padding-right: 6px; }
.st-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.st-form-item { display: flex; flex-direction: column; gap: 6px; }
.st-form-item label { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.st-label-row { display: inline-flex; align-items: center; gap: 4px; }
.st-label-tip { color: var(--text-tertiary); cursor: help; vertical-align: -1px; }
.st-req { color: var(--el-color-danger); margin-left: 2px; }
.st-form-hint { font-size: 12px; line-height: 1.5; color: var(--text-tertiary); }
.st-alert { margin-top: 2px; }
.st-full { width: 100%; }
.st-inline { display: flex; align-items: center; gap: 8px; }
.st-pick { width: 260px; }
.st-switch-item { flex-direction: row; align-items: center; gap: 10px; }
.st-map { border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; background: var(--bg-container); }
.st-map-head { display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
/* 映射区换成 ReTable 后：行容器 .st-map-row 与 → 箭头没有引用了（方向改由列名承担）；
   下拉也不再是 flex 子项，flex:1 失效，改成满宽，否则在单元格里会缩成一小截。 */
.st-map-col { width: 100%; }
.st-warn { font-size: 12px; color: var(--el-color-warning); background: var(--el-color-warning-light-9); border-radius: 6px; padding: 4px 8px; margin-bottom: 6px; }

/* 多目标「方案 D：汇总折叠」——一行一个目标的摘要，点开后在行内编辑该目标的完整配置。
   摘要行常显（数据源 / 表 / 写入模式 / 同步模式 / 映射条数）；同时只展开一个，
   但可以全部收起（再点自己即收起），目标再多也只占摘要行的高度。 */
.st-targets { display: flex; flex-direction: column; gap: 10px; }
.st-target {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
}
.st-target.is-active { border-color: var(--el-color-primary); }
.st-target-head {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; cursor: pointer; user-select: none;
}
.st-target.is-active .st-target-head { background: var(--el-color-primary-light-9); }
/* 开合箭头：展开朝下、收起朝右，随展开状态过渡 */
.st-target-chevron {
  flex: none;
  color: var(--text-tertiary);
  transition: transform 0.15s ease, color 0.15s ease;
}
.st-target.is-active .st-target-chevron { color: var(--el-color-primary); }
.st-target-head:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}
.st-target-idx {
  flex: none; width: 20px; height: 20px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
  color: var(--el-color-primary); background: var(--el-color-primary-light-8);
}
.st-target-name {
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px;
}
.st-target-name b { font-size: 13px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-target-tags { flex: none; display: inline-flex; align-items: center; gap: 6px; }
.st-target-acts { flex: none; display: inline-flex; align-items: center; gap: 6px; }
.st-target-open { font-size: 12px; color: var(--el-color-primary); }
.st-target-body { display: flex; flex-direction: column; gap: 14px; padding: 4px 12px 12px; border-top: 1px dashed var(--border-subtle); padding-top: 12px; }
.st-target-add { display: flex; align-items: center; gap: 10px; }
.st-flow-more {
  flex: none; font-size: 11px; font-weight: 600;
  color: var(--el-color-primary); background: var(--el-color-primary-light-9);
  border-radius: 8px; padding: 0 5px;
}
.mono { font-family: "JetBrains Mono", "Consolas", monospace; }

/* ---------- 输入源类型卡片（UI 图）：图标磁贴 + 名称，选中=主色描边浅底 ---------- */
.st-src-cards { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; width: 100%; }
.st-src-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  height: auto;
  margin: 0 !important;
  padding: 13px 8px 11px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-container);
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}
.st-src-card:hover { border-color: var(--el-color-primary); }
.st-src-card :deep(.el-radio__input),
.st-src-card :deep(.el-radio__inner) { display: none; }
.st-src-card :deep(.el-radio__label) {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding-left: 0;
  color: inherit;
  font-size: 13px;
}
.st-src-ic {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--bg-fill);
  color: var(--text-secondary);
}
.st-src-name { color: var(--text-primary); font-weight: 500; }
.st-src-card.is-checked { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.st-src-card.is-checked .st-src-ic { background: var(--bg-container); color: var(--el-color-primary); }
.st-src-card.is-checked .st-src-name { color: var(--el-color-primary); }

/* ---------- 解析设置区（小节标题 + 定界符分段控件） ---------- */
.st-section-label { margin-top: -2px; font-size: 12px; font-weight: 600; color: var(--text-tertiary); letter-spacing: 1px; }
.st-grid-parse { grid-template-columns: 210px minmax(0, 1fr); align-items: end; }
.st-seg-delim { display: flex; width: 100%; }
.st-seg-delim :deep(.el-radio-button) { flex: 1; min-width: 0; }
.st-seg-delim :deep(.el-radio-button__inner) {
  display: block;
  width: 100%;
  border: 1px solid var(--border-default);
  border-left-width: 1px;
  border-radius: 0 !important;
  background: var(--bg-container);
  color: var(--text-primary);
  box-shadow: none;
  text-align: center;
}
.st-seg-delim :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: var(--radius-md, 8px) 0 0 var(--radius-md, 8px) !important;
}
.st-seg-delim :deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 var(--radius-md, 8px) var(--radius-md, 8px) 0 !important;
}
.st-seg-delim :deep(.el-radio-button + .el-radio-button .el-radio-button__inner),
.st-seg-delim :deep(.el-radio-button:not(:first-child) .el-radio-button__inner) { margin-left: -1px; }
.st-seg-delim :deep(.el-radio-button.is-active .el-radio-button__inner),
.st-seg-delim :deep(.el-radio-button__original:checked + .el-radio-button__inner) {
  background: var(--el-color-primary-light-9) !important;
  border-color: var(--el-color-primary) !important;
  color: var(--el-color-primary) !important;
  font-weight: 600;
  position: relative;
  z-index: 1;
}

/* ---------- 解析预览卡（UI 图）：真实源列 chips + 类型 ---------- */
.st-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-container);
}
.st-preview-head { display: flex; align-items: center; gap: 10px; }
.st-preview-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.st-preview-meta { flex: 1; min-width: 0; font-size: 12px; color: var(--text-tertiary); font-variant-numeric: tabular-nums; }
.st-preview-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.st-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  padding: 3px 10px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-fill);
  font-size: 12px;
  color: var(--text-primary);
}
.st-chip-name { font-family: "JetBrains Mono", "Consolas", monospace; font-weight: 500; }
.st-chip-type { font-family: "JetBrains Mono", "Consolas", monospace; font-style: normal; color: var(--text-tertiary); }
.st-preview .st-warn { margin-bottom: 0; }

/* ---------- 页脚：左真实校验状态 + 右操作按钮 ---------- */
.st-dlg-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; }
.st-dlg-status { display: inline-flex; align-items: center; gap: 6px; min-width: 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.st-dlg-status.is-ok { color: var(--el-color-success); }
.st-dlg-status.is-bad { color: var(--el-color-warning); }
.st-dlg-actions { display: flex; align-items: center; gap: 8px; flex: none; }

/* ---------- 本机路径行：输入框 +「浏览…」拼成一个控件（资源管理器地址栏观感） ----------
   两段共用中缝：输入框只留左圆角、按钮只留右圆角并左移 1px 压掉重叠的那条边框，
   所以看起来是「一个输入框 + 一个带底色的浏览段」，而不是悬空的一根方图标。 */
.st-path-input { flex: 1; min-width: 0; }
.st-path-input :deep(.el-input__wrapper) { padding-left: 10px; }
.st-path-input :deep(.el-input__prefix) { color: var(--text-tertiary); }
.st-path-field { gap: 0; }
.st-path-field .st-path-input :deep(.el-input__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}
.st-path-field :deep(.el-button) {
  flex: none;
  margin: 0 0 0 -1px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
.st-hint-dot::before { content: "●"; margin-right: 6px; font-size: 8px; color: var(--text-tertiary); vertical-align: 1px; }

/* ---------- 调试日志弹窗：摘要条 + 服务端逐步日志（降级时为本机记录，全走 EP 变量，亮暗自适应） ---------- */
.st-log { display: flex; flex-direction: column; gap: 14px; }
.st-log-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
  padding: 8px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  font-size: 12.5px;
}
.st-log-summary-meta { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
.st-log-summary-msg {
  min-width: 0;
  max-width: 280px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.st-log-block {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 12px 14px;
  background: var(--el-fill-color-blank);
}
.st-log-block-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.st-log-block-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.st-log-running { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--el-color-primary); }
.st-log-hint { margin: -2px 0 8px; font-size: 11.5px; line-height: 1.6; color: var(--el-text-color-placeholder); }
.st-log-hint-inline { margin-left: auto; font-size: 11.5px; color: var(--el-text-color-placeholder); }
.st-log-fetch-error { color: var(--el-color-warning); }
.st-log-empty { font-size: 12.5px; color: var(--el-text-color-placeholder); padding: 4px 0; }

/* 服务端调试日志：执行条目（头可点开合）+ 等宽着色过程行 */
.st-log-runs { display: flex; flex-direction: column; gap: 8px; max-height: 430px; overflow: auto; padding-right: 2px; }
.st-log-run {
  border: 1px solid var(--el-border-color-lighter);
  border-left-width: 3px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-blank);
  overflow: hidden;
}
.st-log-run.is-active { border-left-color: var(--el-color-primary); }
.st-log-run.is-ok { border-left-color: var(--el-color-success); }
.st-log-run.is-bad { border-left-color: var(--el-color-danger); }
.st-log-run-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  background: var(--el-fill-color-light);
}
.st-log-run-head:hover { background: var(--el-fill-color); }
.st-log-run-caret { flex: none; width: 12px; color: var(--el-text-color-placeholder); font-size: 11px; }
.st-log-run-trigger { font-weight: 600; color: var(--el-text-color-primary); }
.st-log-run-time { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
.st-log-run-cost { margin-left: auto; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
.st-log-run-count { color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; }
.st-log-run-body {
  max-height: 300px;
  overflow: auto;
  padding: 8px 10px;
  background: var(--el-fill-color-blank);
  font-family: var(--el-font-family-mono, "JetBrains Mono", "Consolas", monospace);
  font-size: 12px;
  line-height: 1.55;
}
.st-log-line { display: flex; gap: 10px; align-items: flex-start; white-space: pre-wrap; word-break: break-all; }
.st-log-line-time { flex: none; color: var(--el-text-color-placeholder); font-variant-numeric: tabular-nums; }
.st-log-line-level { flex: none; width: 46px; font-weight: 600; }
.st-log-line-msg { flex: 1; min-width: 0; color: var(--el-text-color-regular); }
.st-log-line.is-info .st-log-line-level { color: var(--el-color-primary); }
.st-log-line.is-warn .st-log-line-level { color: var(--el-color-warning); }
.st-log-line.is-error .st-log-line-level { color: var(--el-color-danger); }
.st-log-line.is-error .st-log-line-msg { color: var(--el-color-danger); }

/* 降级：本机执行记录（服务端接口不可用时展示） */
.st-log-list { display: flex; flex-direction: column; gap: 8px; max-height: 260px; overflow: auto; }
.st-log-row {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 4px 12px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-left-width: 3px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-extra-light, var(--el-fill-color-light));
  font-size: 12px;
}
.st-log-row.is-ok { border-left-color: var(--el-color-success); }
.st-log-row.is-bad { border-left-color: var(--el-color-danger); }
.st-log-time { color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
.st-log-badge { font-weight: 600; }
.st-log-row.is-ok .st-log-badge { color: var(--el-color-success); }
.st-log-row.is-bad .st-log-badge { color: var(--el-color-danger); }
.st-log-counts { color: var(--el-text-color-secondary); text-align: right; }
.st-log-msg-text {
  grid-column: 1 / -1;
  color: var(--el-text-color-regular);
  line-height: 1.6;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

<style>
/* ==================== 同步任务向导弹窗 chrome（对齐 UI 图） ====================
   koi ReDialog 的壳结构（.koi-dialog-shell 及其 header/body/footer）在全平台弹窗共用，
   这里只按本页注入的 .st-sync-dlg 类收口，一行都不动共享组件默认样式。
   两个实测事实（2026-10-09 dist 形态）：
   - 业务侧传入的 class 经 ReDialog($attrs 透传) 落在 .el-dialog 本体（与 .koi-dialog-shell 同元素），
     故根写复合类 .st-sync-dlg.el-dialog，后代直接从它起算；
   - koi ReDialog 是异步组件，其 scoped 样式晚于本页样式注入——凡与其 scoped 规则同名的属性，
     特异性必须稳压其「类+类+[data-v]」三段式，这里统一用 .st-sync-dlg.el-dialog 前缀（四段式）。
   所有颜色/圆角走 koi（--bg/--text/--border/--radius）与 --el-* 变量，暗黑自动切换。 */
.st-sync-dlg.el-dialog {
  border-radius: var(--radius-xl, 16px);
  background: var(--bg-container);
}
/* koi 壳把标题栏压成 3px 20px 紧凑条（带 !important），本弹窗按 UI 图放大成大标题头 */
.st-sync-dlg.el-dialog .el-dialog__header {
  padding: 16px 24px 6px !important;
  margin-bottom: 6px !important;
}
.st-sync-dlg.el-dialog .koi-dialog-custom-header {
  align-items: flex-start;
}
.st-sync-dlg.el-dialog .koi-dialog-custom-header .koi-dialog-header-icon-wrap {
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--radius-lg, 12px);
  background: var(--el-color-primary);
}
.st-sync-dlg.el-dialog .koi-dialog-custom-header .koi-dialog-header-icon {
  font-size: 22px;
  color: var(--el-color-white);
}
.st-sync-dlg.el-dialog .koi-dialog-custom-header .koi-dialog-header-titles {
  gap: 3px;
}
.st-sync-dlg.el-dialog .koi-dialog-custom-header .koi-dialog-header-titles .el-dialog__title {
  flex: none;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}
.st-sync-dlg.el-dialog .koi-dialog-custom-header .koi-dialog-subtitle {
  font-size: 12.5px;
  color: var(--text-tertiary);
}
/* koi 壳默认 body 8px / footer 4px 20px 6px（均 !important）——本弹窗放宽为 24px 版心 */
.st-sync-dlg.el-dialog .el-dialog__body {
  padding: 2px 24px 8px !important;
}
.st-sync-dlg.el-dialog .el-dialog__footer {
  box-sizing: border-box;
  padding: 12px 24px !important;
  border-top: 1px solid var(--border-subtle);
}
</style>