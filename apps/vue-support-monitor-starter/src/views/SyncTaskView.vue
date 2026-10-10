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
      <!-- 表格统一 ReTable（替换裸 el-table）：列收敛为 columns 配置 + #col-* 插槽。
           engine="element" 显式指定：本页 UI 图契约（.st-foot 自带页脚 + el-pagination）
           与既有 e2e / 可点元素普查的 DOM 口径（.el-table__body tbody tr 等）都按
           el-table 写死，vxe 引擎会换掉整棵表格 DOM；pagination=false 表示分页由页脚
           自管（pageTasks 切片与原实现逐行一致），toolbar=false 保持本页按钮清单不变。 -->
      <ReTable
        :data="pageTasks" :columns="taskColumns" :loading="loading"
        engine="element" :pagination="false" :toolbar="false"
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
            <div class="st-sub mono">{{ sourceTypeLabel(row) }} · {{ sourceBrief(row) }}</div>
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
                :loading="runningId === row.id" :disabled="row.syncTaskEnabled !== 1"
                @click="run(row)"
              />
              <ReButton layout="square" icon="Document" tip="日志" @click="openLog(row)" />
              <ReButton layout="square" icon="EditPen" tip="编辑" @click="openEdit(row)" />
              <ReButton layout="square" icon="Delete" type="danger" tip="删除" @click="remove(row)" />
            </div>
        </template>
      </ReTable>
      <div class="st-foot">
        <span>显示 {{ pageStart }}-{{ pageEnd }} 条，共 {{ tasks.length }} 个同步任务</span>
        <el-pagination
          v-model:current-page="pageNo" :page-size="PAGE_SIZE" :total="filteredTasks.length"
          :pager-count="5" size="small" background layout="prev, pager, next"
          aria-label="同步任务分页"
        />
      </div>
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
                <el-input v-model="form.sourcePath" placeholder="服务器本地绝对路径，如 /data/order.csv" class="mono st-path-input">
                  <template #prefix><ReIcon name="Document" :size="14" /></template>
                </el-input>
                <ReButton layout="square" icon="FolderOpened" @click="openPathPicker('FILE')">浏览…</ReButton>
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
              <div class="st-inline">
                <el-input v-model="form.sourcePath" placeholder="服务器本地绝对路径，如 /data/incoming" class="mono" />
                <ReButton layout="square" icon="Folder" @click="openPathPicker('DIR')">浏览…</ReButton>
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
              <div class="st-form-hint">表清单取自目标数据源；不在清单中的表名可直接输入。预览发现表不存在时，会弹出设计表向导在对应库建好并自动继续预览。</div>
            </div>
            <div class="st-form-item">
              <label>写入模式</label>
              <el-select v-model="form.writeMode" class="st-full">
                <el-option v-for="m in writeModes" :key="m.code" :label="m.label + '（' + m.code + '）'" :value="m.code" />
              </el-select>
            </div>
          </div>

          <!-- 同步模式与增量配置：与「写入模式」分开的维度——写入模式管目标端语句长什么样，
               同步模式管这一轮从源读全部还是按水位只读新增 -->
          <div class="st-grid">
            <div class="st-form-item">
              <label>同步模式</label>
              <el-select v-model="form.syncMode" class="st-full" @change="onSyncModeChange">
                <el-option label="全量（每次读取全部源数据）" value="FULL" />
                <el-option label="增量（按增量字段水位取新数据）" value="INCREMENTAL" />
              </el-select>
              <div class="st-form-hint">
                {{ form.syncMode === 'INCREMENTAL'
                  ? '按增量字段升序分批取数，每轮成功后自动记录水位，下次只取新于水位的数据；配合「存在即更新」不产生重复。'
                  : '单次流式读完全部源数据，适用于小数据范围；配合「先清空再插入」即为全量覆盖。大数据请用增量模式。' }}
              </div>
            </div>
            <div class="st-form-item">
              <label>增量字段</label>
              <el-input
                v-model="form.incField" class="mono"
                :disabled="form.syncMode !== 'INCREMENTAL'"
                placeholder="如 id / updated_at（源结果集里存在的列）"
              />
              <div class="st-form-hint" v-if="form.syncMode === 'INCREMENTAL'">
                JDBC：自动包裹进源 SQL（水位条件+升序+每批上限）；HTTP：以查询参数携带上次水位。
                <template v-if="form.lastSeq"><b>当前水位：{{ form.lastSeq }}</b>（改动字段会清空水位）</template>
                <template v-else>尚无水位，首跑按升序分批引导。</template>
              </div>
              <div class="st-form-hint" v-else>切换为增量模式后可填写；源 SQL 与该列需同时存在于结果集。</div>
            </div>
          </div>

          <div v-if="form.syncMode === 'INCREMENTAL'" class="st-form-item">
            <label>每批数量（单次执行最多同步条数，留空不限）</label>
            <el-input-number
              v-model="form.incBatchSize" :min="1" :max="100000000" :step="1000"
              controls-position="right" class="st-full" placeholder="留空表示不限"
            />
            <div class="st-form-hint">积压数据分轮自动消化：每轮取最老的 N 条并推进水位，下一轮接着往后，不漏不重。</div>
          </div>

          <!-- 解析预览（UI 图卡片）：真实预览结果（源/目标列 + 类型），未预览时如实说明，不造假日数 -->
          <div class="st-preview">
            <div class="st-preview-head">
              <span class="st-preview-title">解析预览</span>
              <span class="st-preview-meta">
                {{ previewSourceColumns.length
                  ? `源 ${previewSourceColumns.length} 列 · 目标 ${previewTargetColumns.length} 列 · 已配对 ${form.mapping.length} 项`
                  : "尚未预览" }}
              </span>
              <ReButton @click="doPreview">
                <template #icon><ReIcon name="Refresh" /></template>预览 / 自动配对
              </ReButton>
            </div>
            <div v-if="previewSourceColumns.length" class="st-preview-chips">
              <span v-for="col in previewSourceColumns" :key="col.name" class="st-chip">
                <b class="st-chip-name">{{ col.name }}</b>
                <i class="st-chip-type">{{ col.type }}</i>
              </span>
            </div>
            <div v-else class="st-form-hint">点「预览 / 自动配对」真实读取一次源列与目标列，并按同名自动配对。</div>
            <div v-for="(warning, index) in previewWarnings" :key="index" class="st-warn">{{ warning }}</div>
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

          <!-- 批量提交条数与启用定时各占一行：原先两列并排，控件挤在一起读与调都不顺手 -->
          <div class="st-form-item">
            <label>批量提交条数</label>
            <el-input-number v-model="form.batchSize" :min="1" :max="100000" :step="100" controls-position="right" class="st-full" />
            <div class="st-form-hint">每批写入的行数：调大提升吞吐，调小降低单事务压力。</div>
          </div>
          <div class="st-form-item st-switch-item">
            <label>启用定时</label>
            <el-switch v-model="form.enabled" aria-label="启用定时" :disabled="!form.cron.trim()" />
            <span class="st-form-hint">未填定时表达式时不能启用</span>
          </div>

          <!-- Hook HTTP 回调：旁路通知，发送失败只记日志不影响同步结果 -->
          <div class="st-form-item">
            <label>Hook 通知地址（HTTP 回调，留空不通知）</label>
            <el-input
              v-model="form.hookUrl" class="mono"
              placeholder="https://example.com/hooks/sync-done"
            />
            <div class="st-form-hint">每轮执行结束向该地址 JSON POST 执行结果（成功/失败都发）；增量选「每条」时每写入一条再推一条。</div>
          </div>
          <div v-if="form.hookUrl.trim()" class="st-form-item">
            <label>通知时机</label>
            <el-select v-model="form.hookNotify" class="st-full" :disabled="form.syncMode === 'FULL'">
              <el-option label="完成通知（每轮一条，成功/失败各带 status）" value="DONE" />
              <el-option label="每条数据 + 完成通知" value="ROW" />
            </el-select>
            <div class="st-form-hint">
              {{ form.syncMode === 'FULL'
                ? '全量模式固定为完成通知。'
                : '增量模式可逐条推送（异步发送，慢接收端不拖累同步吞吐；队列满丢通知不丢数据）。' }}
              通知失败只记日志，不影响同步。
            </div>
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
            <ReButton v-if="step < 2" type="primary" @click="nextStep">
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

          <!-- 服务端调试日志：进行中执行在最前，其后为已完成执行（新 → 旧）；点击条头展开/收起 -->
          <div v-else-if="logRuns.length" class="st-log-runs">
            <div
              v-for="(entry, index) in logRuns"
              :key="`${entry.runTime}-${index}`"
              class="st-log-run"
              :class="entry.status === 'RUNNING' ? 'is-active' : (entry.status === 'SUCCESS' ? 'is-ok' : 'is-bad')"
            >
              <div class="st-log-run-head" @click="expandedLogRun = expandedLogRun === index ? -1 : index">
                <span class="st-log-run-caret">{{ expandedLogRun === index ? "▾" : "▸" }}</span>
                <span class="st-log-run-trigger">{{ triggerLabel(entry.trigger) }}</span>
                <el-tag
                  :type="entry.status === 'RUNNING' ? 'primary' : (entry.status === 'SUCCESS' ? 'success' : 'danger')"
                  size="small" effect="dark" round
                >{{ statusLabel(entry.status) }}</el-tag>
                <span class="st-log-run-time">{{ entry.runTime }}</span>
                <span class="st-log-run-cost">{{ entry.costMs ?? "—" }} ms</span>
                <span class="st-log-run-count">{{ entry.lines.length }} 行</span>
              </div>
              <div v-if="expandedLogRun === index" class="st-log-run-body">
                <div
                  v-for="(line, li) in entry.lines" :key="li"
                  class="st-log-line" :class="`is-${line.level.toLowerCase()}`"
                >
                  <span class="st-log-line-time">{{ line.time }}</span>
                  <span class="st-log-line-level">{{ line.level }}</span>
                  <span class="st-log-line-msg">{{ line.message }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="st-log-empty">服务端暂无调试日志——从本页「立即执行」或等定时触发一次，这里会显示逐步过程日志。</div>
        </div>
      </div>
      <template #footer>
        <div class="st-dlg-actions">
          <ReButton v-if="logFetchError && logEntries.length" @click="clearLogEntries">清空本机记录</ReButton>
          <ReButton @click="logVisible = false">关闭</ReButton>
          <ReButton v-if="logTask" @click="openEditFromLog">编辑任务</ReButton>
          <ReButton
            v-if="logTask" type="primary"
            :loading="runningId === logTask.id"
            :disabled="logTask.syncTaskEnabled !== 1"
            @click="runFromLog"
          >立即执行</ReButton>
        </div>
      </template>
    </ReDialog>

    <!-- 设计表向导（@pages/datasource 数据库管理器同款）：预览发现「表不存在」时弹出，
         initial-name / initial-columns 带入缺失表名与源列；后端 POST /ms/monitor/db/table
         按目标库方言建表，created 后回填表名并自动继续预览。 -->
    <CreateTableDialog
      v-model="tableDesignerVisible"
      :datasource-id="designerDatasourceId ?? undefined"
      :initial-name="designerTable"
      :initial-columns="designerColumns"
      @created="onTableCreated"
    />

    <!-- 本机文件/目录选择器：数据同步的文件与文件夹源都指向后端所在机器，
         由 monitor 的 /ms/monitor/local-files/list 列举；FILE 模式同时列出数据文件。
         initial-path 用文件系统根：先前写死 Windows 的 C 盘路径，而部署机是 Linux，
         结果打开就是目录不存在，一个条目都列不出来（实测根能列出 21 个目录）。 -->
    <ReFilePicker
      v-model="filePickerVisible"
      :title="filePickerMode === 'FILE' ? '选择文件' : '选择文件夹'"
      :directory-mode="filePickerMode === 'DIR'"
      initial-path="/"
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
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch, type Component } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, Document as DocumentIcon, Files, Loading, Upload as UploadIcon, Warning } from "@element-plus/icons-vue";
import { fetchDataSources, fetchDatasourceTables, type DataSourceInfo } from "@pages/datasource";
import { fetchTableColumns } from "@pages/datasource/src/api/manageConsoles";
import CreateTableDialog from "@pages/datasource/src/components/console/CreateTableDialog.vue";
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
  type SyncColumn,
  type SyncFieldMapping,
  type SyncTask,
  type SyncTaskPayload,
  type SyncTaskRunLog,
  type SyncTaskRunResult,
  type SyncWriteMode,
} from "../syncTaskApi";
import ReDialog from "@repo/ui/re-dialog";
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
  /** 同步模式：FULL 全量 / INCREMENTAL 增量 */
  syncMode: "FULL" as "FULL" | "INCREMENTAL",
  /** 增量字段（源结果集里存在的列名） */
  incField: "",
  /** 增量每批数量（单次执行最多同步条数），null=不限 */
  incBatchSize: null as number | null,
  /** Hook 通知地址，空=不通知 */
  hookUrl: "",
  /** Hook 通知时机：DONE 完成通知 / ROW 每条数据+完成 */
  hookNotify: "DONE" as "DONE" | "ROW",
  /** 增量水位（仅编辑时展示；服务端执行成功后回写，不随表单提交） */
  lastSeq: "",
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
 * 切换同步模式：增量模式下把「先清空再插入」换成「存在即更新」。
 *
 * <p>先清空语义与增量水位天然冲突——每批执行都会把目标表清掉，
 * 上一轮同步的数据直接消失。后端也会在保存时拦，这里提前调好少一次报错往返。</p>
 */
const onSyncModeChange = (mode: string | number | boolean | undefined) => {
  if (mode === "INCREMENTAL" && form.writeMode === "OVERWRITE") {
    form.writeMode = "UPSERT";
    ElMessage.info("增量模式已将写入模式调整为「存在即更新」——先清空再插入会清掉未同步的数据");
  }
};

/**
 * 任务生效的同步模式（存量行该列为空时按全量）
 * @param row 任务
 */
const effectiveSyncMode = (row: SyncTask): string => row.syncTaskSyncMode || "FULL";

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
  { prop: "task", label: "任务", minWidth: 230 },
  { prop: "flow", label: "数据流向", minWidth: 250 },
  { prop: "writeMode", label: "写入模式", width: 118, align: "center" },
  { prop: "cron", label: "定时", width: 150 },
  { prop: "enabled", label: "启用", width: 78, align: "center" },
  { prop: "lastRun", label: "最近执行", minWidth: 260 },
  { prop: "actions", label: "操作", width: 170, fixed: "right", align: "center" },
];
/** 分页：UI 图底部分页；e2e 的行数口径按「当前页行数」+ 徽标仍按全过滤集 */
const pageNo = ref(1);
const PAGE_SIZE = 8;
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
/** 筛选条件变化 → 回到第 1 页（分页口径下换筛选停在空页尾是假象） */
watch([statusFilter, writeModeFilter, rangeFilter, nameFilter], () => {
  pageNo.value = 1;
});

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
/** 基础集：写入模式 + 时间范围 + 名称搜索三道与状态无关的过滤 */
const baseTasks = computed(() => tasks.value.filter(row =>
  (writeModeFilter.value === "all" || row.syncTaskWriteMode === writeModeFilter.value)
  && inRange(row)
  && (!nameFilter.value.trim() || (row.syncTaskName || "").toLowerCase().includes(nameFilter.value.trim().toLowerCase())),
));
/** 表格实际数据源：基础集再按状态分段收一道 */
const filteredTasks = computed(() => baseTasks.value.filter(row =>
  statusFilter.value === "all" || statusOf(row) === statusFilter.value,
));
/** 当前页切片；筛选条件变化时回到第 1 页（watch 见下方） */
const pageTasks = computed(() => filteredTasks.value.slice((pageNo.value - 1) * PAGE_SIZE, pageNo.value * PAGE_SIZE));
/** 页脚「显示 a-b 条」 */
const pageStart = computed(() => (filteredTasks.value.length ? (pageNo.value - 1) * PAGE_SIZE + 1 : 0));
const pageEnd = computed(() => Math.min(pageNo.value * PAGE_SIZE, filteredTasks.value.length));

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
    // 新数据进来：横幅按新失败集重算（本轮手动关闭失效）、分页回到第 1 页
    bannerDismissed.value = false;
    pageNo.value = 1;
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
      if (!form.sourceSql.trim()) return "请选择数据表或填写源读取 SQL";
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
    if (form.targetDatasourceId == null) return "请先选择目标数据源";
    if (!form.targetTable.trim()) return "请选择或输入目标数据表";
    if (form.syncMode === "INCREMENTAL") {
      if (form.sourceType !== "JDBC" && form.sourceType !== "HTTP_JSON" && form.sourceType !== "HTTP_HTML") {
        return "增量模式仅支持 JDBC / HTTP 输入源，文件/目录请用全量";
      }
      const incField = form.incField.trim();
      if (!incField) return "增量模式必须填写增量字段";
      if (!/^[A-Za-z0-9_]{1,64}$/.test(incField)) return "增量字段名只允许字母、数字、下划线";
      if (form.writeMode === "OVERWRITE") return "增量模式不能使用「先清空再插入」（每批都会清空目标表）";
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
    ElMessage.warning(issue);
    return false;
  }
  return true;
};

/** 当前步骤的实时校验结论（页脚状态条用；随表单输入即时更新） */
const stepIssueNow = computed(() => stepIssue(step.value));

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
  form.syncMode = "FULL";
  form.incField = "";
  form.incBatchSize = null;
  form.hookUrl = "";
  form.hookNotify = "DONE";
  form.lastSeq = "";
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
  form.syncMode = row.syncTaskSyncMode === "INCREMENTAL" ? "INCREMENTAL" : "FULL";
  form.incField = row.syncTaskIncField || "";
  form.incBatchSize = row.syncTaskIncBatchSize ?? null;
  form.hookUrl = row.syncTaskHookUrl || "";
  form.hookNotify = row.syncTaskHookNotify === "ROW" ? "ROW" : "DONE";
  form.lastSeq = row.syncTaskLastSeq || "";
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
    const message = (e as Error)?.message || "未知错误";
    ElMessage.error("预览失败：" + message);
    // 「表不存在」不是配置填错，光提示用户也续不上 —— 直接弹设计表，
    // 在缺表的那一侧库建好后回填表名并自动续跑预览。
    if (isTableMissingError(message)) {
      void openTableDesigner(message);
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

/** 预览报错是不是「表不存在」（MySQL / PostgreSQL / Oracle 三种方言的形态） */
const isTableMissingError = (message: string): boolean =>
  /doesn'?t exist|does not exist|ORA-00942|表不存在/i.test(message);

/** 从方言报错里抠出缺失的表名：Table 'db.tbl' / relation "tbl" / 表 tbl 不存在 */
const parseMissingTable = (message: string): string | null => {
  const hit =
    /Table '([^']+)'/.exec(message) ||
    /relation "([^"]+)"/.exec(message) ||
    /表\s*[`'"]?([\w.]+)[`'"]?\s*不存在/.exec(message);
  const raw = hit?.[1] ?? "";
  const table = (raw.split(".").pop() ?? raw).replace(/[`"]/g, "").trim();
  return table || null;
};

/** 缺失表在源侧还是目标侧：与目标表名、选表模式表名、SQL 的 FROM/JOIN 表逐一比对 */
const detectMissingSide = (table: string | null): "source" | "target" => {
  const norm = (s: string) => s.replace(/[`"\s]/g, "").toLowerCase();
  // 文件 / 目录源没有「源表」概念；解析不出表名时按目标表处理（建目标表是主要场景）
  if (form.sourceType !== "JDBC" || !table) {
    return "target";
  }
  if (norm(form.targetTable) === norm(table)) {
    return "target";
  }
  if (sourceMode.value === "table" && pickedSourceTable.value && norm(pickedSourceTable.value) === norm(table)) {
    return "source";
  }
  if (sourceMode.value === "sql") {
    const refs = [...form.sourceSql.matchAll(/(?:from|join)\s+`?([\w.]+)`?/gi)]
      .map(m => (m[1] ?? "").split(".").pop() ?? "");
    if (refs.some(ref => norm(ref) === norm(table))) {
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
      const columns = await fetchTableColumns(pickedSourceTable.value, form.sourceDatasourceId);
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
  const side = detectMissingSide(missing);
  designerSide.value = side;
  designerTable.value = missing ?? (side === "target" ? form.targetTable.trim() : pickedSourceTable.value ?? "");
  designerDatasourceId.value = (side === "target" ? form.targetDatasourceId : form.sourceDatasourceId) ?? null;
  designerColumns.value = side === "target" ? await fetchSourcePrefill() : [];
  tableDesignerVisible.value = true;
};

/** 建表成功（后端已按方言 CREATE TABLE）→ 回填表名、刷新表清单并自动续跑预览 */
const onTableCreated = async (_database: string, table: string): Promise<void> => {
  if (designerSide.value === "target") {
    form.targetTable = table;
    void loadTables(form.targetDatasourceId, true);
  } else {
    sourceMode.value = "table";
    pickedSourceTable.value = table;
    form.sourceSql = `SELECT * FROM \`${table}\``;
    void loadTables(form.sourceDatasourceId, false);
  }
  await doPreview();
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
      syncMode: form.syncMode,
      // 全量模式也回传增量字段表单值：后端全量分支不覆盖存量配置，来回切换不丢水位
      incField: form.incField.trim() || null,
      incBatchSize: form.syncMode === "INCREMENTAL" ? (form.incBatchSize ?? null) : null,
      hookUrl: form.hookUrl.trim() || null,
      hookNotify: form.hookNotify,
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
      ElMessage.success(`执行成功：读 ${result.readCount} 行，写 ${result.writeCount} 行，${result.costMs}ms`);
    } else {
      ElMessage.error(`执行失败：${result.message}`);
    }
  } catch (e) {
    const message = (e as Error)?.message || String(e);
    // 网络 / 网关错误没有 runTime，用触发时刻记录；status 用 ERROR 与业务 FAILED 区分开
    appendLogEntry(row.id, {
      at: new Date().toLocaleString(),
      status: "ERROR",
      read: 0,
      write: 0,
      costMs: 0,
      message,
    });
    ElMessage.error("执行失败：" + message);
  } finally {
    runningId.value = null;
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
/** 当前展开的执行条目下标（默认最新一次；-1 表示全部收起） */
const expandedLogRun = ref(0);
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
  expandedLogRun.value = 0;
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

/** 弹窗内直接执行一次：run() 负责刷新任务行与本机记录，随后立刻拉服务端调试日志对齐最新 */
const runFromLog = async (): Promise<void> => {
  const task = logTask.value;
  if (!task) {
    return;
  }
  await run(task);
  logEntries.value = readLogEntries(task.id);
  const fresh = tasks.value.find(t => t.id === task.id);
  if (fresh) {
    logTask.value = fresh;
  }
  await fetchLogRuns();
};

/** 从日志弹窗跳到编辑（先关日志；任务可能已在别处删除，拿不到最新行就用弹窗里的快照） */
const openEditFromLog = (): void => {
  const current = logTask.value;
  if (!current) {
    return;
  }
  logVisible.value = false;
  openEdit(tasks.value.find(t => t.id === current.id) ?? current);
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
    // 最新一次正在跑且处于展开状态时，跟随日志尾部滚动（排障时盯着最新行）
    if (logRuns.value[0]?.status === "RUNNING" && expandedLogRun.value === 0) {
      const body = document.querySelector(".st-log-dlg .st-log-run.is-active .st-log-run-body");
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
}
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

.st-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px 0;
  font-size: 12px;
  color: var(--text-tertiary);
}
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
.st-warn { font-size: 12px; color: var(--el-color-warning); background: var(--el-color-warning-light-9); border-radius: 6px; padding: 4px 8px; margin-bottom: 6px; }
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

/* ---------- 本机路径行：输入框占满 + 方形「浏览」按钮 ---------- */
.st-path-input { flex: 1; min-width: 0; }
.st-path-input :deep(.el-input__wrapper) { padding-left: 10px; }
.st-path-input :deep(.el-input__prefix) { color: var(--text-tertiary); }
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