<template>
  <div class="page-container">
    <!-- 上区：页头 + 右侧悬浮正方形统计卡 -->
    <div class="top-zone">
      <div class="page-header">
        <div class="page-header__left">
          <h1 class="page-header__title">采集管理</h1>
          <p class="page-header__sub">配置采集来源、调度 Cron 与执行日志</p>
        </div>
      </div>

      <div class="stats-row">
        <div v-for="st in statCards" :key="st.title" class="stat-card">
          <div class="stat-card__body">
            <div class="stat-card__title">{{ st.title }}</div>
            <div class="stat-card__value">{{ st.value }}</div>
            <div class="stat-card__hint">{{ st.hint }}</div>
          </div>
          <div class="stat-card__icon" :style="{ background: st.bg }">
            <el-icon :size="22"><component :is="st.icon" /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <!-- 筛选（被统计卡下半压住） -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-grid">
        <div class="filter-field">
          <label class="filter-field__label">任务名称</label>
          <el-input
            v-model="searchModel.taskName"
            clearable
            placeholder="名称关键字"
            :prefix-icon="Search"
            @keyup.enter="commitSearch"
            @change="commitSearch"
            @clear="commitSearch"
          />
        </div>
        <div class="filter-field">
          <label class="filter-field__label">来源类型</label>
          <el-select v-model="searchModel.sourceType" clearable placeholder="全部来源" style="width: 100%" @change="commitSearch">
            <el-option v-for="opt in sourceOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">学科</label>
          <el-select
            v-model="searchModel.subject"
            clearable
            filterable
            allow-create
            default-first-option
            placeholder="全部学科"
            style="width: 100%"
            @change="commitSearch"
          >
            <el-option v-for="s in subjectOptions" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </div>
        <div class="filter-field">
          <label class="filter-field__label">状态</label>
          <el-select v-model="searchModel.status" clearable placeholder="全部状态" style="width: 100%" @change="commitSearch">
            <el-option label="已启用" :value="1" />
            <el-option label="已禁用" :value="0" />
          </el-select>
        </div>
        <div class="filter-actions">
          <el-button type="primary" :icon="Search" @click="commitSearch">搜索</el-button>
          <el-button :icon="RefreshLeft" @click="resetSearch">重置</el-button>
        </div>
      </div>
    </el-card>

     <!-- 表格 -->
    <ReTable
      class="flex-1"
      ref="tableRef"
      :loader="loadTasks"
      :params="queryParams"
      row-key="collectTaskId"
      v-model:page="pageNo"
      v-model:page-size="pageSize"
      border
      stripe
      @load-error="pageLoadError"
    >
      <template #toolbar>
        <el-button type="primary" icon="Plus" @click="openCreate" text>新建任务</el-button>
      </template>
      <ReTableColumn prop="collectTaskId" label="ID" width="70" align="center" />
      <ReTableColumn prop="collectTaskName" label="任务名称" min-width="170" show-overflow-tooltip />
      <ReTableColumn label="来源类型" width="110" align="center">
        <template #default="{ row }">
          <el-tag  :type="sourceTagType(row.collectTaskSourceType)">
            {{ sourceLabel(row.collectTaskSourceType) }}
          </el-tag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="学科/学段" width="110" align="center">
        <template #default="{ row }">
          <span>{{ row.collectTaskSubject || '-' }}</span>
          <span v-if="row.collectTaskGradeLevel" class="text-xs text-gray-400"> · {{ gradeLevelLabel(row.collectTaskGradeLevel) }}</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="调度 Cron" width="150">
        <template #default="{ row }">
          <span class="text-xs cron-text">{{ row.cron || '未登记' }}</span>
          <el-tooltip v-if="row.cron && !row.handlerRegistered" content="本节点没有该任务的执行器，派发会被跳过；重启应用可自动补齐" placement="top">
            <el-tag  type="warning" class="ml-1">无执行器</el-tag>
          </el-tooltip>
        </template>
      </ReTableColumn>
      <ReTableColumn label="下次执行" width="170" align="center">
        <template #default="{ row }">
          <template v-if="row.collectTaskStatus === 1 && row.nextFireTime">
            <div class="text-xs">{{ formatMs(row.nextFireTime) }}</div>
            <div class="text-xs text-primary">{{ countdown(row.nextFireTime) }}</div>
          </template>
          <span v-else class="text-gray-400 text-xs">{{ row.collectTaskStatus === 1 ? '未排期' : '已停用' }}</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="状态" width="80" align="center">
        <template #default="{ row }">
          <ReSwitch
            :model-value="row.collectTaskStatus === 1"
            :loading="row.collectTaskId === statusPendingId"
            
            inline-prompt
            active-text="启"
            inactive-text="停"
            @change="(val: boolean) => handleStatusChange(row, val)"
          />
        </template>
      </ReTableColumn>
      <ReTableColumn prop="collectTaskTotalCount" label="累计采集" width="90" align="center" />
      <ReTableColumn label="最近执行" width="170" align="center">
        <template #default="{ row }">
          <template v-if="row.collectTaskLastRunTime">
            <el-tag  :type="row.collectTaskLastRunStatus === 1 ? 'success' : 'danger'">
              {{ row.collectTaskLastRunCount ?? 0 }} 条
            </el-tag>
            <div class="text-xs text-gray-400 mt-1">{{ formatDateTime(row.collectTaskLastRunTime) }}</div>
          </template>
          <span v-else class="text-gray-400 text-xs">未执行</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="220" fixed="right" align="center">
        <template #default="{ row }">
          <ReButton
            icon="VideoPlay"
            :show-text="false"
            type="success"
            :disabled="row.collectTaskStatus !== 1"
            :loading="triggerPending === row.collectTaskId"
            @click="handleTrigger(row)"
          >
            立即采集
          </ReButton>
          <ReButton icon="Notebook" :show-text="false" @click="openLogs(row)">日志</ReButton>
          <ReButton icon="Edit" :show-text="false" type="primary" @click="openEdit(row)">编辑</ReButton>
          <ReButton icon="Delete" :show-text="false" type="danger" @click="remove(row)">删除</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <!-- 新建/编辑对话框：一个采集任务 = 一个数据来源 + 前置/入库处理器 + 一个调度任务 -->
    <ReDialog v-model="dialogVisible" :title="form.collectTaskId ? '编辑采集任务' : '新建采集任务'" width="880" top="6vh" destroy-on-close>
      <el-form :model="form" label-width="100" label-position="right">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.collectTaskName" placeholder="如：高中物理选择题-百度题库" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="来源类型" required>
          <el-radio-group v-model="form.collectTaskSourceType">
            <el-radio v-for="opt in sourceOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="来源配置" required>
          <div class="w-full">
            <!-- TEXT 配置 -->
            <template v-if="form.collectTaskSourceType === 'TEXT'">
              <el-input
                v-model="textConfig"
                type="textarea"
                :rows="8"
                placeholder="粘贴题目文本内容，系统将通过 AI 自动识别提取题目&#10;&#10;示例：&#10;1. 下列哪个是哺乳动物？&#10;A. 蛇  B. 狗  C. 鳄鱼  D. 蜥蜴&#10;答案：B"
              />
            </template>
            <!-- URL 配置 -->
            <template v-else-if="form.collectTaskSourceType === 'URL'">
              <el-input v-model="urlConfig" placeholder="https://example.com/questions.json" />
              <div class="text-xs text-gray-400 mt-1">支持 JSON 格式题目数组的链接，或普通网页（AI 自动提取）</div>
            </template>
            <!-- API 配置 -->
            <template v-else-if="form.collectTaskSourceType === 'API'">
              <el-input v-model="apiConfig" placeholder="https://api.example.com/v1/questions?subject=数学" />
              <div class="text-xs text-gray-400 mt-1">返回 JSON 格式题目数组的第三方 API 地址</div>
            </template>
            <!-- FILE 配置 -->
            <template v-else-if="form.collectTaskSourceType === 'FILE'">
              <el-input v-model="fileConfig" placeholder="/data/questions.json" />
              <div class="text-xs text-gray-400 mt-1">服务器本地 JSON 文件的绝对路径，格式为题目数组</div>
            </template>
            <!-- 存量 GROOVY 任务：来源类型已从采集界面下线，仅保留只读查看，避免编辑时丢脚本 -->
            <template v-else-if="form.collectTaskSourceType === 'GROOVY'">
              <el-alert type="warning" :closable="false" show-icon>
                <template #title>
                  该任务使用的 Groovy 脚本来源已从采集界面下线（服务端 SPI 与随包脚本仍保留）。
                  新增采集请改用「粘贴文本 / 网页URL / 第三方API / 本地文件」。
                </template>
                <template #default>
                  <div class="mt-2">
                    <div class="text-xs text-gray-500 mb-1">脚本文件：{{ groovyScriptPath || '（内联脚本）' }}</div>
                    <el-input :model-value="groovyScript" type="textarea" :rows="10" readonly resize="vertical" class="script-editor" />
                  </div>
                </template>
              </el-alert>
            </template>
            <!-- 第三方 SPI 扩展来源 / 自落库来源：直接编辑 JSON 配置 -->
            <template v-else>
              <div v-if="isSelfPersisted(form.collectTaskSourceType)" class="mb-2">
                <el-alert type="info" :closable="false" show-icon>
                  <template #title>
                    该来源由服务端自带采集器直接写入汉字库（edu_hanzi），不需要前置/入库处理器。
                    重复执行按 hanzi_char 去重，offset 留空即从已入库数量自动续采。
                  </template>
                </el-alert>
                <el-button
                  v-if="form.collectTaskSourceType === 'HANZI'"
                  size="small"
                  class="mt-2"
                  @click="applyHanziPreset"
                >
                  填入汉字采集默认配置
                </el-button>
              </div>
              <el-input v-model="rawConfig" type="textarea" :rows="6" placeholder='{"key":"value"}' />
              <div class="text-xs text-gray-400 mt-1">
                该来源类型由服务端采集器直接落库，请按键值 JSON 填写其配置
              </div>
            </template>
          </div>
        </el-form-item>

        <!-- 自落库来源不需要前置/入库处理器：整段隐藏，避免误导出「必填」的假象 -->
        <template v-if="isSelfPersisted(form.collectTaskSourceType)">
          <el-form-item label=" ">
            <span class="text-xs text-gray-400">
              字段口径与随包初始化数据一致（tools/gen-hanzi-seed.py）：拼音、笔画数、部首、中文释义来自公开单字字典；
              间架结构只按可靠映射推导，笔顺无公开数据源，均留空由老师补。
            </span>
          </el-form-item>
        </template>
        <template v-else>

        <!-- 前置处理器（必填）：把来源数据转成「一行一个」，支持 JSONPath / Groovy -->
        <el-form-item label="前置处理器" required>
          <!-- 整行可点：补 role/tabindex 让键盘能聚焦，:focus-visible 的焦点环才有意义 -->
          <div class="proc-field" role="button" tabindex="0" @click="openPre" @keydown.enter="openPre">
            <span :class="{ 'is-empty': !preSummary }">
              {{ preSummary || "点击配置：JSONPath / Groovy，把数据转成一行一个" }}
            </span>
            <el-button  @click.stop="openPre">配置</el-button>
          </div>
        </el-form-item>

        <!-- 入库处理器（必填）：前置输出的 key → 数据库列（目标表来自后台接口） -->
        <el-form-item label="入库处理器" required>
          <!-- 整行可点：补 role/tabindex 让键盘能聚焦，:focus-visible 的焦点环才有意义 -->
          <div
            class="proc-field"
            role="button"
            tabindex="0"
            @click="impDialogVisible = true"
            @keydown.enter="impDialogVisible = true"
          >
            <span :class="{ 'is-empty': !impSummary }">
              {{ impSummary || "点击配置：目标表 / 唯一键 / 冲突策略 / 字段映射" }}
            </span>
            <el-button  @click.stop="impDialogVisible = true">配置</el-button>
          </div>
        </el-form-item>
        </template>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="学科">
              <el-select v-model="form.collectTaskSubject" placeholder="选择学科" clearable style="width: 100%">
                <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学段">
            <el-select v-model="form.collectTaskGradeLevel" placeholder="选择学段" clearable style="width: 100%" @change="onCollectLevelChange">
              <el-option label="小学" value="PRIMARY" />
              <el-option label="初中" value="JUNIOR" />
              <el-option label="高中" value="SENIOR" />
              <el-option label="大学" value="UNIVERSITY" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度">
              <el-input-number v-model="form.collectTaskDifficulty" :min="1" :max="5" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="年级">
          <el-select
            v-model="form.collectTaskGrade"
            placeholder="选择年级"
            clearable
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option v-for="g in collectGradeOptions" :key="g" :label="g" :value="g" />
          </el-select>
        </el-form-item>
        <el-form-item label="定时 Cron">
          <ReCron v-model="form.cron" :default-cron="meta?.defaultCron" />
        </el-form-item>
        <el-form-item label="启用调度">
          <ReSwitch v-model="form.collectTaskStatus" :active-value="1" :inactive-value="0" inline-prompt
            active-text="启" inactive-text="停" />
          <span class="text-xs text-gray-400 ml-2">停用后不再自动派发，也不能点「立即采集」，需先启用再手动跑</span>
        </el-form-item>
        <el-form-item label="入库自动审核">
          <ReSwitch v-model="autoAudit" inline-prompt active-text="开" inactive-text="关" />
          <span class="text-xs text-gray-400 ml-2">开：本次任务入库的题目直接视为审核通过，不再进待审；关：入库后待管理员审核</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.collectTaskRemark" type="textarea" :rows="4" placeholder="任务备注" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="saving">保存</el-button>
      </template>
    </ReDialog>

    <!-- 前置处理器配置弹窗（必填）：JSONPath → 输出名，一行一个 -->
    <ReDialog v-model="preDialogVisible" title="前置处理器（字段映射：JSONPath → 输出名）" width="800" append-to-body>
      <div class="proc-tip">
        key 填 <b>JSONPath</b>，value 填<b>输出给入库的字段名</b>；路径里的 <code>[*]</code> 会自动展开成「一行一个」
      </div>
      <el-alert type="info" :closable="false" class="mb-2">
        <template #title>粘贴文本 / Groovy 脚本场景的字段名是固定的</template>
        <template #default>
          <div class="text-xs leading-relaxed">
            来源选「粘贴文本」时，系统会用「JSON 直解 → AI 提取 → 正则兜底」把文本抽成题目对象，
            字段名固定为：
            <code>stem</code>（题干）、<code>answer</code>（答案）、
            <code>questionType</code>（题型）、<code>optionsJson</code>（选项 JSON 数组）、
            <code>analysis</code>（解析）、<code>subject</code>、<code>gradeLevel</code>、<code>grade</code>、<code>difficulty</code>、<code>source</code>。
            因此 JSONPath 要写成 <code>$[*].stem</code> 这种形式；<b>漏掉 <code>optionsJson</code> 会导致选择题选项丢失</b>。
            点「题库预设」即可一次填好全部字段。
          </div>
        </template>
      </el-alert>
      <div class="db-map">
        <div v-for="(row, idx) in preMapping" :key="idx" class="db-map__row">
          <el-input v-model="row.path" placeholder="JSONPath，如 $[*].word 或 $.data.list[*].word" style="width: 400px" />
          <span class="db-map__arrow">→</span>
          <el-input v-model="row.name" placeholder="输出名，如 word" style="width: 220px" />
          <el-button link type="danger" @click="preMapping.splice(idx, 1)">删除</el-button>
        </div>
        <div class="db-map__ops">
          <el-button link type="primary" @click="preMapping.push({ path: '', name: '' })">+ 添加映射</el-button>
          <el-button link @click="applyPrePreset">成语词库预设</el-button>
          <el-button link @click="applyQuestionPrePreset">题库预设</el-button>
        </div>
      </div>
      <el-form label-width="90" class="mt-2">
        <el-form-item label="数据地址">
          <el-input v-model="preUrl" placeholder="试跑取数地址（默认取来源配置里的 url / apiUrl）" />
        </el-form-item>
        <el-form-item label="试跑">
          <el-button :loading="prePreviewLoading" @click="runPrePreview">试跑前 3 行</el-button>
          <span class="text-xs text-gray-400 ml-2">用真实数据试跑，输出的字段名就是入库处理器能映射的 key</span>
        </el-form-item>
        <div v-if="prePreviewRows.length" class="db-preview">
          <div v-for="(item, i) in prePreviewRows" :key="i" class="db-preview__row">
            <span v-for="(v, k) in item" :key="k" class="db-preview__cell">
              <b>{{ k }}</b>: {{ String(v).slice(0, 36) }}
            </span>
          </div>
          <div class="db-preview__keys">输出 key：{{ preKeys.join("、") }}</div>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="preDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPre">确定</el-button>
      </template>
    </ReDialog>

    <!-- 入库处理器配置弹窗（必填）：key → 数据库列 -->
    <ReDialog v-model="impDialogVisible" title="入库处理器（key → 数据库列）" width="880" append-to-body>
      <el-form label-width="90">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="目标表" required>
              <el-select v-model="impTable" style="width: 100%" @change="onImpTableChange">
                <el-option v-for="t in dbTables" :key="t.name" :label="`${t.label}（${t.name}）`" :value="t.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="唯一键">
              <el-input v-model="impUniqueKey" placeholder="多列逗号分隔；留空=纯插入" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="冲突策略">
          <el-radio-group v-model="impConflict">
            <el-radio value="skip">已存在则跳过</el-radio>
            <el-radio value="overwrite">已存在则覆盖更新</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="字段映射" required>
          <div class="db-map">
            <div v-for="(row, idx) in impMapping" :key="idx" class="db-map__row">
              <el-select v-model="row.column" filterable allow-create placeholder="数据库列" style="width: 250px">
                <el-option v-for="c in impColumns" :key="c.name" :label="c.name" :value="c.name" />
              </el-select>
              <span class="db-map__arrow">←</span>
              <el-select v-model="row.key" filterable allow-create placeholder="前置输出的 key" style="width: 250px">
                <el-option v-for="k in preKeys" :key="k" :label="k" :value="k" />
              </el-select>
              <el-button link type="danger" @click="impMapping.splice(idx, 1)">删除</el-button>
            </div>
            <div class="db-map__ops">
              <el-button link type="primary" @click="impMapping.push({ column: '', key: '' })">+ 添加映射</el-button>
              <el-button link @click="autoFillMapping">按表预设自动填充</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="常量列">
          <el-input v-model="impConstants" type="textarea" :rows="2" placeholder='固定写入的值（JSON）：{"idiom_difficulty":3,"idiom_tags":""}' />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="单次条数">
              <el-input-number v-model="impLimit" :min="1" :max="2000" :step="50" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="起始偏移">
              <el-input-number v-model="preOffset" :min="0" :max="50000" :step="100" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="学段/年级">
          <el-input v-model="impGradeLevel" placeholder="学段（如 小学；目标表为 edu_idiom 时建立学段映射）" style="width: 260px" />
          <el-input v-model="impGrade" placeholder="年级（如 一年级）" style="width: 200px; margin-left: 10px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="impDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImp">确定</el-button>
      </template>
    </ReDialog>

    <!-- 采集日志对话框 -->
    <ReDialog v-model="logDialogVisible" :title="`执行日志 - ${logTaskName}`" width="960" destroy-on-close>
      <ReTable
        :loader="loadLogs"
        :params="logParams"
        row-key="collectLogId"
        v-model:page="logPageNo"
        :page-size="10"
        :toolbar="false"
        border
        stripe
        @load-error="pageLoadError"
      >
        <ReTableColumn prop="collectLogId" label="日志ID" width="80" align="center" />
        <ReTableColumn label="执行状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag  :type="logStatusType(row.collectLogStatus)">
              {{ logStatusLabel(row.collectLogStatus) }}
            </el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn label="触发" width="80" align="center">
          <template #default="{ row }">
            <el-tag  effect="plain" :type="row.collectLogTriggerType === 'AUTO' ? 'success' : 'info'">
              {{ row.collectLogTriggerType === 'AUTO' ? '调度' : '手动' }}
            </el-tag>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="collectLogSourceType" label="来源" width="90" align="center" />
        <ReTableColumn prop="collectLogQuestionCount" label="采集数" width="80" align="center" />
        <ReTableColumn prop="collectLogErrorMsg" label="错误信息" min-width="180" show-overflow-tooltip />
        <ReTableColumn label="开始时间" width="170" align="center">
          <template #default="{ row }">
            <span class="text-xs">{{ formatDateTime(row.collectLogStartTime) }}</span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="耗时" width="90" align="center">
          <template #default="{ row }">
            <span class="text-xs">{{ elapsed(row) }}</span>
          </template>
        </ReTableColumn>
      </ReTable>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, computed, watch, onMounted, onUnmounted } from "vue";
import { ElMessageBox } from "element-plus";
import { CircleCheck, DataLine, Document, RefreshLeft, Search } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { CollectMeta, CollectTask, CollectTaskForm, CollectDbTable } from "../api/types";
import { createPageLoader, numParam, pageLoadError, strParam } from "../api/pageLoader";
import { formatDuration } from "@repo/ui/re-time";
import ReDialog from "@repo/ui/re-dialog";

/** 默认公开成语词库（约 3 万条，含 拼音/释义/出处/例句），页面默认填入，不留空 */
const IDIOM_CORPUS_DEFAULT = "https://cdn.jsdelivr.net/gh/pwxcoo/chinese-xinhua@master/data/idiom.json";

const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"];

/** 采集任务年级候选：按所选学段联动 */
const COLLECT_GRADES: Record<string, string[]> = {
  PRIMARY: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  JUNIOR: ["初一", "初二", "初三"],
  SENIOR: ["高一", "高二", "高三"],
  UNIVERSITY: ["大一", "大二", "大三", "大四"],
  OTHER: [],
};
const collectGradeOptions = computed(() => COLLECT_GRADES[form.collectTaskGradeLevel || ""] ?? []);

/** 切换学段时清掉不匹配的年级 */
function onCollectLevelChange() {
  if (form.collectTaskGrade && !collectGradeOptions.value.includes(form.collectTaskGrade)) {
    form.collectTaskGrade = "";
  }
}

// ---- 列表状态 ----
const pageNo = ref(1);
const pageSize = ref(10);
const tableRef = ref();
const statusPendingId = ref<number | null>(null);

/** 学科候选：后端按精确匹配过滤，除常用学科外还要含库里真实出现的聚合值 */
const subjectOptions = [...subjects, "多学科", "综合"].map((s) => ({ label: s, value: s }));

function blankSearch(): Record<string, unknown> {
  return { taskName: "", sourceType: "", subject: "", status: null };
}

/** 搜索区草稿：输入即更新，但没点查询前不影响列表 */
const searchModel = ref<Record<string, unknown>>(blankSearch());
/** 已提交的条件快照：表格 params 与 loader 都只认它 */
const applied = ref<Record<string, unknown>>(blankSearch());
const queryParams = computed(() => ({ ...applied.value }));

/** 统计：任务总数 / 已启用 / 累计采集（拉一页大结果近似，采集任务量级小） */
const statTotals = ref({ total: 0, enabled: 0, collected: 0 });
const statCards = computed(() => [
  { title: "任务总数", value: statTotals.value.total, icon: Document, bg: "var(--el-color-primary)", hint: "已创建采集任务" },
  {
    title: "已启用",
    value: statTotals.value.enabled,
    icon: CircleCheck,
    bg: "var(--el-color-success)",
    hint: statTotals.value.total
      ? `${Math.round((statTotals.value.enabled / statTotals.value.total) * 100)}% 调度运行中`
      : "暂无启用任务",
  },
  { title: "累计采集", value: statTotals.value.collected, icon: DataLine, bg: "var(--el-color-warning)", hint: "历史累计题目数" },
]);

async function loadStats() {
  try {
    const res = await eduaiApi.pageCollectTasks({ pageNum: 1, pageSize: 10000 });
    const list = Array.isArray(res?.data) ? res.data : [];
    statTotals.value = {
      total: res?.total ?? list.length,
      enabled: list.filter((t) => (t.collectTaskStatus ?? 1) === 1).length,
      collected: list.reduce((sum, t) => sum + (t.collectTaskTotalCount ?? 0), 0),
    };
  } catch {
    statTotals.value = { total: 0, enabled: 0, collected: 0 };
  }
}

const loadTasks = createPageLoader((page, size) =>
  eduaiApi.pageCollectTasks({
    pageNum: page,
    pageSize: size,
    taskName: strParam(applied.value.taskName),
    sourceType: strParam(applied.value.sourceType),
    subject: strParam(applied.value.subject),
    status: numParam(applied.value.status),
  }),
);

/** 增删改、启停、手动采集后留在当前页重拉（并刷新统计卡） */
function reload() {
  void tableRef.value?.reload();
  void loadStats();
}

/** 查询：提交草稿并回到第一页 */
function commitSearch() {
  applied.value = { ...searchModel.value };
  void tableRef.value?.goto(1);
}

/** 重置：清空草稿与快照（内置搜索区已自行清空，这里同步回第一页重查） */
function resetSearch() {
  searchModel.value = blankSearch();
  commitSearch();
}

// ---- 调度元数据与倒计时 ----
const meta = ref<CollectMeta | null>(null);
/** 服务器时间与本地时间偏移（ms）：server - local */
let clockOffset = 0;
const nowTick = ref(Date.now());
let tickTimer: ReturnType<typeof setInterval> | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
const autoRefresh = ref(false);

const serverClock = computed(() => formatMs(nowTick.value + clockOffset));

async function loadMeta() {
  const res = await eduaiApi.collectMeta();
  meta.value = res;
  if (res?.serverTime) clockOffset = res.serverTime - Date.now();
}

function refreshAll() {
  reload();
  void loadMeta().catch(() => undefined);
}

watch(autoRefresh, (on) => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  if (on) {
    pollTimer = setInterval(refreshAll, 10000);
  }
});

function countdown(nextFireMs?: number | null): string {
  if (!nextFireMs) return "-";
  const remain = Math.round((nextFireMs - (nowTick.value + clockOffset)) / 1000);
  if (remain <= 0) return "即将执行";
  const d = Math.floor(remain / 86400);
  const h = Math.floor((remain % 86400) / 3600);
  const m = Math.floor((remain % 3600) / 60);
  const s = remain % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return d > 0 ? `${d}天 ${h}:${pad(m)}:${pad(s)} 后` : `${h}:${pad(m)}:${pad(s)} 后`;
}

function formatMs(ms?: number | null): string {
  if (!ms) return "-";
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatDateTime(value?: string): string {
  return value ? value.replace("T", " ") : "-";
}

// ---- 表单 ----
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<CollectTaskForm>(getDefaultForm());
const textConfig = ref("");
const urlConfig = ref("");
const apiConfig = ref("");
const fileConfig = ref("");
const groovyScript = ref("");
const groovyScriptPath = ref("");
const groovyTimeout = ref(60);
const rawConfig = ref("");
/**
 * 入库自动审核开关：开=true 时任务入库的题目直接视为审核通过（后端 auditOnSave 通道）。
 * 存量任务无该键时读回 false（默认关），见 openEdit 解析段。
 */
const autoAudit = ref(false);
/** 前置处理器（必填）：字段映射 key=JSONPath、value=输出给入库的名称 */
const preDialogVisible = ref(false);
const preUrl = ref(IDIOM_CORPUS_DEFAULT);
const prePreviewLoading = ref(false);
const prePreviewRows = ref<Record<string, unknown>[]>([]);
const preConfigured = ref(false);
/** 映射表：path=JSONPath，name=输出名（数组 [*] 自动展开成一行一个） */
const preMapping = ref<{ path: string; name: string }[]>([]);

/** 成语词库预设映射 */
const IDIOM_PRE_MAPPING = [
  { path: "$[*].word", name: "word" },
  { path: "$[*].pinyin", name: "pinyin" },
  { path: "$[*].explanation", name: "explanation" },
  { path: "$[*].derivation", name: "derivation" },
  { path: "$[*].example", name: "example" },
];

/**
 * 题库预设映射（粘贴文本 / Groovy 脚本 / 题目接口产出的固定字段名）。
 *
 * <p>字段名与后端 {@code CollectedQuestion} 一致；<b>optionsJson 必须带上</b>，
 * 否则选择题的选项会在入库前被丢掉（只剩答案字母）。</p>
 */
const QUESTION_PRE_MAPPING = [
  { path: "$[*].questionType", name: "questionType" },
  { path: "$[*].stem", name: "stem" },
  { path: "$[*].optionsJson", name: "optionsJson" },
  { path: "$[*].answer", name: "answer" },
  { path: "$[*].analysis", name: "analysis" },
  { path: "$[*].subject", name: "subject" },
  { path: "$[*].gradeLevel", name: "gradeLevel" },
  { path: "$[*].grade", name: "grade" },
  { path: "$[*].difficulty", name: "difficulty" },
];

function applyPrePreset() {
  preMapping.value = IDIOM_PRE_MAPPING.map((m) => ({ ...m }));
}

function applyQuestionPrePreset() {
  preMapping.value = QUESTION_PRE_MAPPING.map((m) => ({ ...m }));
}

/** 前置映射 → JSON 文本（key=JSONPath，value=输出名） */
function preMappingJson(): string {
  const map: Record<string, string> = {};
  preMapping.value.forEach((row) => {
    const path = row.path.trim();
    const name = row.name.trim();
    if (path && name) map[path] = name;
  });
  return JSON.stringify(map);
}

const preKeys = computed(() => {
  const keys = new Set<string>();
  prePreviewRows.value.forEach((row) => Object.keys(row).forEach((k) => keys.add(k)));
  return [...keys];
});

const preSummary = computed(() => {
  if (!preConfigured.value) return "";
  const n = preMapping.value.filter((m) => m.path && m.name).length;
  return `字段映射 ${n} 条（JSONPath → 输出名）`;
});

/** 入库处理器（必填）：前置输出的 key → 数据库列 */
const impDialogVisible = ref(false);
const impConfigured = ref(false);
const impTable = ref("edu_idiom");
const impUniqueKey = ref("idiom_content");
const impConflict = ref<"skip" | "overwrite">("skip");
const impMapping = ref<{ column: string; key: string }[]>([]);
const impConstants = ref('{"idiom_difficulty":3,"idiom_tags":""}');
const impGradeLevel = ref("小学");
const impGrade = ref("一年级");
/** 单次入库条数（0/空=默认 200） */
const impLimit = ref(200);
/** 起始偏移（JSONPath 展开后的行下标，0=从头扫，已存在的自动跳过并继续向后找） */
const preOffset = ref(0);

/** 成语库默认映射（首次打开入库处理器时的骨架） */
const IDIOM_MAPPING = [
  { column: "idiom_content", key: "word" },
  { column: "idiom_pinyin", key: "pinyin" },
  { column: "idiom_meaning", key: "explanation" },
  { column: "idiom_source", key: "derivation" },
  { column: "idiom_example", key: "example" },
];

const dbTables = ref<CollectDbTable[]>([]);
const impColumns = computed(() => dbTables.value.find((t) => t.name === impTable.value)?.columns ?? []);

const impSummary = computed(() => {
  if (!impConfigured.value) return "";
  const n = impMapping.value.filter((m) => m.column && m.key).length;
  return `${impTable.value} · 唯一键 ${impUniqueKey.value || "无"} · ${
    impConflict.value === "overwrite" ? "覆盖更新" : "跳过已存在"
  } · ${n} 个字段映射`;
});

/** 当前来源配置里的取数地址（前置试跑用） */
function currentSourceUrl(): string {
  const t = form.collectTaskSourceType;
  if (t === "URL") return urlConfig.value.trim();
  if (t === "API") return apiConfig.value.trim();
  if (t === "FILE") return fileConfig.value.trim();
  return "";
}

/** 打开前置处理器弹窗：默认带上当前来源的取数地址 */
function openPre() {
  const cur = currentSourceUrl();
  if (cur && preUrl.value === IDIOM_CORPUS_DEFAULT) {
    preUrl.value = cur;
  }
  preDialogVisible.value = true;
}

async function runPrePreview() {
  const url = preUrl.value.trim() || currentSourceUrl();
  if (!url) {
    message.warning("请填写数据地址");
    return;
  }
  prePreviewLoading.value = true;
  try {
    prePreviewRows.value = await eduaiApi.collectPreviewRows({
      url,
      mode: "jsonpath",
      mapping: preMappingJson(),
      limit: 3,
    });
    if (!prePreviewRows.value.length) {
      message.warning("没有解析出任何行，请检查 JSONPath / 脚本");
    }
  } catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || "试跑失败");
  } finally {
    prePreviewLoading.value = false;
  }
}

function confirmPre() {
  if (!preMapping.value.some((m) => m.path.trim() && m.name.trim())) {
    message.warning("请至少配置一条字段映射（JSONPath → 输出名）");
    return;
  }
  preConfigured.value = true;
  if (!impMapping.value.length) autoFillMapping();
  preDialogVisible.value = false;
}

async function loadDbTables() {
  try {
    dbTables.value = (await eduaiApi.collectDbTables()) ?? [];
  } catch {
    dbTables.value = [];
  }
}

function onImpTableChange() {
  const meta = dbTables.value.find((t) => t.name === impTable.value);
  impUniqueKey.value = meta?.uniqueKey ?? "";
  autoFillMapping();
}

/** 按目标表预设自动填充映射（成语库用内置映射；其它表按同名列/试跑 key 匹配） */
function autoFillMapping() {
  if (impTable.value === "edu_idiom") {
    impMapping.value = IDIOM_MAPPING.map((m) => ({ ...m }));
    impConstants.value = '{"idiom_difficulty":3,"idiom_tags":""}';
    return;
  }
  if (impTable.value === "edu_question") {
    // 注意：question_options 必须映射 optionsJson，否则选择题只剩答案字母、没有选项
    impMapping.value = [
      { column: "question_stem", key: "stem" },
      { column: "question_answer", key: "answer" },
      { column: "question_type", key: "questionType" },
      { column: "question_options", key: "optionsJson" },
      { column: "question_analysis", key: "analysis" },
      { column: "question_difficulty", key: "difficulty" },
    ];
    impConstants.value =
      '{"question_subject":"综合","question_grade_level":"OTHER","question_grade":"其他","question_audit_status":0,"question_status":1}';
    return;
  }
  if (impTable.value === "edu_knowledge_point") {
    impMapping.value = [
      { column: "knowledge_point_name", key: "name" },
      { column: "knowledge_point_subject", key: "subject" },
      { column: "knowledge_point_grade_level", key: "gradeLevel" },
      { column: "knowledge_point_grade", key: "grade" },
      { column: "knowledge_point_description", key: "description" },
    ];
    impConstants.value = '{"knowledge_point_status":1}';
    return;
  }
  const keys = preKeys.value.length ? preKeys.value : impColumns.value.map((c) => c.name);
  impMapping.value = impColumns.value
    .filter((c) => !c.name.endsWith("_id") && c.name !== "create_time" && c.name !== "update_time")
    .slice(0, 6)
    .map((c) => ({ column: c.name, key: keys.includes(c.name) ? c.name : "" }));
}

function confirmImp() {
  if (!impTable.value) {
    message.warning("请选择目标表");
    return;
  }
  if (!impMapping.value.some((m) => m.column && m.key)) {
    message.warning("请至少配置一个字段映射");
    return;
  }
  impConfigured.value = true;
  impDialogVisible.value = false;
}
function getDefaultForm(): CollectTaskForm {
  return {
    collectTaskId: undefined,
    collectTaskName: "",
    collectTaskSourceType: "TEXT",
    collectTaskSourceConfig: "",
    collectTaskSubject: "",
    collectTaskGradeLevel: "",
    collectTaskGrade: "",
    collectTaskDifficulty: 3,
    cron: "",
    collectTaskStatus: 1,
    collectTaskRemark: "",
  };
}

function resetSourceConfig() {
  textConfig.value = "";
  urlConfig.value = "";
  apiConfig.value = "";
  fileConfig.value = "";
  groovyScript.value = "";
  groovyScriptPath.value = "";
  groovyTimeout.value = 60;
  rawConfig.value = "";
  autoAudit.value = false;
  preUrl.value = currentSourceUrl() || IDIOM_CORPUS_DEFAULT;
  prePreviewRows.value = [];
  preMapping.value = IDIOM_PRE_MAPPING.map((m) => ({ ...m }));
  preConfigured.value = false;
  impTable.value = "edu_idiom";
  impUniqueKey.value = "idiom_content";
  impConflict.value = "skip";
  impMapping.value = IDIOM_MAPPING.map((m) => ({ ...m }));
  impConstants.value = '{"idiom_difficulty":3,"idiom_tags":""}';
  impGradeLevel.value = "小学";
  impGrade.value = "";
  impLimit.value = 200;
  preOffset.value = 0;
  impConfigured.value = false;
}

function openCreate() {
  Object.assign(form, getDefaultForm());
  resetSourceConfig();
  dialogVisible.value = true;
}

function openEdit(row: CollectTask) {
  Object.assign(form, {
    collectTaskId: row.collectTaskId,
    collectTaskName: row.collectTaskName,
    collectTaskSourceType: row.collectTaskSourceType,
    collectTaskSourceConfig: row.collectTaskSourceConfig,
    collectTaskSubject: row.collectTaskSubject,
    collectTaskGradeLevel: row.collectTaskGradeLevel,
    collectTaskGrade: row.collectTaskGrade,
    collectTaskDifficulty: row.collectTaskDifficulty,
    collectTaskStatus: row.collectTaskStatus,
    collectTaskRemark: row.collectTaskRemark,
    cron: row.cron || "",
  });
  resetSourceConfig();
  // 解析 sourceConfig 到对应字段
  try {
    const config = JSON.parse(row.collectTaskSourceConfig || "{}");
    autoAudit.value = config.autoAudit === true;
    textConfig.value = config.text || "";
    urlConfig.value = config.url || "";
    apiConfig.value = config.apiUrl || "";
    fileConfig.value = config.path || "";
    groovyScript.value = config.script || "";
    groovyScriptPath.value = config.scriptPath || "";
    if (config.timeoutSeconds) groovyTimeout.value = Number(config.timeoutSeconds);
    if (config.preProcessor) {
      try {
        const pre = typeof config.preProcessor === "string" ? JSON.parse(String(config.preProcessor)) : config.preProcessor;
        if (pre.mapping) {
          const map = typeof pre.mapping === "string" ? JSON.parse(String(pre.mapping)) : pre.mapping;
          preMapping.value = Object.keys(map).map((path) => ({ path, name: String((map as Record<string, unknown>)[path]) }));
        }
        preConfigured.value = !!preMapping.value.length;
      } catch {
        /* 配置异常时保留默认 */
      }
    }
    if (config.importProcessor) {
      try {
        const imp = typeof config.importProcessor === "string" ? JSON.parse(String(config.importProcessor)) : config.importProcessor;
        if (imp.table) impTable.value = String(imp.table);
        impUniqueKey.value = imp.uniqueKey != null ? String(imp.uniqueKey) : "";
        impConflict.value = String(imp.onConflict || "skip") === "overwrite" ? "overwrite" : "skip";
        if (imp.mapping) {
          const map = typeof imp.mapping === "string" ? JSON.parse(String(imp.mapping)) : imp.mapping;
          impMapping.value = Object.keys(map).map((k) => ({ column: k, key: String((map as Record<string, unknown>)[k]) }));
        }
        if (imp.constants) {
          impConstants.value =
            typeof imp.constants === "string" ? String(imp.constants) : JSON.stringify(imp.constants);
        }
        impGradeLevel.value = imp.gradeLevel != null ? String(imp.gradeLevel) : "";
        impGrade.value = imp.grade != null ? String(imp.grade) : "";
        impLimit.value = imp.limit != null ? Number(imp.limit) || 200 : 200;
        preOffset.value = config.offset != null ? Number(config.offset) || 0 : 0;
        impConfigured.value = true;
        void loadDbTables();
      } catch {
        /* 配置异常时保留默认 */
      }
    }
    if (row.collectTaskSourceType === "GROOVY") {
      // 存量 Groovy 任务仅只读展示脚本（来源类型已从采集界面下线）
    } else if (!["TEXT", "URL", "API", "FILE", "GROOVY"].includes(row.collectTaskSourceType)) {
      rawConfig.value = JSON.stringify(config, null, 2);
    }
  } catch {
    rawConfig.value = row.collectTaskSourceConfig || "";
  }
  dialogVisible.value = true;
}

/**
 * 组装来源配置：来源自身配置 + 前置处理器（data → 一行一个）+ 入库处理器（key → 数据库列）。
 * 所有来源统一走「前置处理器 → 入库处理器」入库。
 */
function buildSourceConfig(): string {
  let base: Record<string, unknown> = {};
  switch (form.collectTaskSourceType) {
    case "TEXT":
      base = { text: textConfig.value };
      break;
    case "URL":
      base = { url: urlConfig.value };
      break;
    case "API":
      base = { apiUrl: apiConfig.value, method: "GET" };
      break;
    case "FILE":
      base = { path: fileConfig.value };
      break;
    case "GROOVY": {
      const config: { timeoutSeconds: number; script?: string; scriptPath?: string } = {
        timeoutSeconds: groovyTimeout.value || 60,
      };
      if (groovyScriptPath.value.trim()) config.scriptPath = groovyScriptPath.value.trim();
      else config.script = groovyScript.value;
      base = config;
      break;
    }
    default: {
      try {
        base = JSON.parse(rawConfig.value.trim() || "{}");
      } catch {
        base = {};
      }
    }
  }

  // 自落库来源：配置就是 Provider 自己的键值，绝不能再挂 importProcessor，
  // 否则服务端会改走通用管线（见 SELF_PERSISTED_TYPES 注释）。
  if (isSelfPersisted(form.collectTaskSourceType)) {
    (base as Record<string, unknown>).autoAudit = autoAudit.value === true;
    return JSON.stringify(base);
  }

  // 前置处理器（必填）：字段映射 key=JSONPath、value=输出给入库的名称
  base.preProcessor = {
    mapping: preMappingJson(),
  };

  // 入库处理器（必填）
  const mapping: Record<string, string> = {};
  impMapping.value.forEach((row) => {
    const column = row.column.trim();
    const key = row.key.trim();
    if (column && key) mapping[column] = key;
  });
  const importProcessor: Record<string, unknown> = {
    table: impTable.value,
    uniqueKey: impUniqueKey.value.trim(),
    onConflict: impConflict.value,
    mapping,
    limit: Math.max(1, Number(impLimit.value) || 200),
  };
  const constants = impConstants.value.trim();
  if (constants) {
    try {
      JSON.parse(constants);
      importProcessor.constants = constants;
    } catch {
      message.warning("常量列不是合法 JSON，已忽略");
    }
  }
  if (impGradeLevel.value.trim()) importProcessor.gradeLevel = impGradeLevel.value.trim();
  if (impGrade.value.trim()) importProcessor.grade = impGrade.value.trim();
  base.importProcessor = importProcessor;
  // 起始偏移（顶层）：前置处理器展开后的行下标
  base.offset = Math.max(0, Number(preOffset.value) || 0);
  // 入库自动审核：仅为显式配置项；默认关（false 也落库，保证前后端口径一致）。
  (base as Record<string, unknown>).autoAudit = autoAudit.value === true;

  return JSON.stringify(base);
}

async function submitForm() {
  if (!form.collectTaskName) return message.warning("请输入任务名称");
  if (!form.collectTaskSourceType) return message.warning("请选择来源类型");
  // 自落库来源由 Provider 自己落库，不需要前置/入库处理器
  if (!isSelfPersisted(form.collectTaskSourceType)) {
    if (!preConfigured.value) {
      preDialogVisible.value = true;
      return message.warning("请先配置前置处理器（JSONPath / Groovy）");
    }
    if (!impConfigured.value) {
      impDialogVisible.value = true;
      return message.warning("请先配置入库处理器（目标表 / 字段映射）");
    }
  }

  // 校验来源配置必填
  if (form.collectTaskSourceType === "TEXT" && !textConfig.value.trim()) {
    return message.warning("请输入粘贴的题目文本");
  }
  if (form.collectTaskSourceType === "URL" && !urlConfig.value.trim()) {
    return message.warning("请输入网页 URL");
  }
  if (form.collectTaskSourceType === "API" && !apiConfig.value.trim()) {
    return message.warning("请输入 API 地址");
  }
  if (form.collectTaskSourceType === "FILE" && !fileConfig.value.trim()) {
    return message.warning("请输入本地文件路径");
  }
  if (form.collectTaskSourceType === "GROOVY"
    && !groovyScript.value.trim() && !groovyScriptPath.value.trim()) {
    return message.warning("请编写 Groovy 脚本或填写服务器脚本文件路径");
  }
  if (!["TEXT", "URL", "API", "FILE", "GROOVY"].includes(form.collectTaskSourceType || "")
    && rawConfig.value.trim()) {
    try {
      JSON.parse(rawConfig.value);
    } catch {
      return message.warning("来源配置不是合法 JSON");
    }
  }

  saving.value = true;
  try {
    await eduaiApi.saveCollectTask({
      ...form,
      collectTaskSourceConfig: buildSourceConfig(),
    });
    message.success("保存成功，调度已同步生效");
    dialogVisible.value = false;
    reload();
  } catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || "保存失败");
  } finally {
    saving.value = false;
  }
}

async function remove(row: CollectTask) {
  try {
    await ElMessageBox.confirm(
      `确认删除任务「${row.collectTaskName}」吗？对应的调度任务 ${row.jobKey || ''} 会一起摘除。`,
      "删除采集任务",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  await eduaiApi.deleteCollectTask(row.collectTaskId);
  message.success("删除成功");
  reload();
}

// ---- 状态切换 ----
async function handleStatusChange(row: CollectTask, enabled: boolean) {
  statusPendingId.value = row.collectTaskId;
  try {
    await eduaiApi.changeCollectTaskStatus(row.collectTaskId, enabled ? 1 : 0);
    message.success(enabled ? "已启用调度" : "已停止调度");
    reload();
  } finally {
    statusPendingId.value = null;
  }
}

// ---- 手动触发 ----
const triggerPending = ref<number | null>(null);
async function handleTrigger(row: CollectTask) {
  triggerPending.value = row.collectTaskId;
  try {
    const res = await eduaiApi.triggerCollectTask(row.collectTaskId);
    if (res.status === "success") {
      message.success(`采集完成：${res.message}`);
    } else {
      message.warning(res.message || "采集未完成");
    }
    reload();
  } catch (e: any) {
    message.error(e?.response?.data?.message || e?.message || "触发失败");
  } finally {
    triggerPending.value = null;
  }
}

// ---- 日志 ----
const logDialogVisible = ref(false);
const logPageNo = ref(1);
const logTaskName = ref("");
const currentLogTaskId = ref<number>(0);

/** 日志表按任务查；弹窗 destroy-on-close，每次打开都由表格自行加载 */
const logParams = computed<Record<string, unknown>>(() => ({ collectTaskId: currentLogTaskId.value }));

const loadLogs = createPageLoader((page, size, params) =>
  eduaiApi.pageCollectLogs({
    taskId: Number(params.collectTaskId) || undefined,
    pageNum: page,
    pageSize: size,
  }),
);

function openLogs(row: CollectTask) {
  currentLogTaskId.value = row.collectTaskId;
  logTaskName.value = row.collectTaskName;
  logPageNo.value = 1;
  logDialogVisible.value = true;
}

function elapsed(row: { collectLogStartTime?: string; collectLogEndTime?: string }): string {
  if (!row.collectLogStartTime || !row.collectLogEndTime) return "-";
  const ms = new Date(row.collectLogEndTime).getTime() - new Date(row.collectLogStartTime).getTime();
  if (Number.isNaN(ms) || ms < 0) return "-";
  // 走全站统一的 duration 格式化：这里原先自造了一套「<1s 用 ms、否则用 s」，
  // 与其它页面的耗时文本对不上（同一份数据两种写法）
  return formatDuration(ms);
}

// ---- 辅助 ----
const fallbackSourceTypes = ["TEXT", "URL", "API", "FILE"];

/**
 * 采集界面不开放的来源类型。
 *
 * <p>GROOVY 仅作为服务端 SPI 与随包脚本保留（历史任务可能仍在用），但不在采集界面暴露，
 * 避免使用者误以为「写脚本」是常规采集方式——常规路径是粘贴文本 / 网页 / 接口 / 文件。</p>
 */
const hiddenSourceTypes = new Set(["GROOVY"]);

/**
 * 自落库来源：服务端 Provider 自己写业务表（不走「前置处理器 → 入库处理器」管线）。
 *
 * 为什么必须单独识别：后端 doCollect 的判断顺序是「配置里有 importProcessor 就走
 * 通用管线，selfPersisted() 才走 Provider 自己的 persist()」。而本表单保存时
 * 默认会给所有类型都塞上 preProcessor/importProcessor —— 若不给自落库类型开口子，
 * 从页面创建的汉字采集任务会被通用管线接管，Provider 形同不存在。
 */
const SELF_PERSISTED_TYPES = new Set(["HANZI"]);

function isSelfPersisted(type?: string) {
  return SELF_PERSISTED_TYPES.has((type || "").toUpperCase());
}

/** 汉字采集默认配置：一键填入公开单字字典/字表/IDS 源 */
const HANZI_PRESET = {
  url: "https://raw.githubusercontent.com/pwxcoo/chinese-xinhua/master/data/word.json",
  charListUrl: "https://raw.githubusercontent.com/elephantnose/characters/master/3500%E5%B8%B8%E7%94%A8%E6%B1%89%E5%AD%97.txt",
  idsUrl: "https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt",
  limit: 500,
  gradeLevel: "小学",
  meaningMaxChars: 90,
};

function applyHanziPreset() {
  rawConfig.value = JSON.stringify(HANZI_PRESET, null, 2);
  message.success("已填入汉字采集默认配置（单次 500 字，可改）");
}

function visibleSourceTypes(list: string[]) {
  return list.filter((type) => !hiddenSourceTypes.has(type));
}

const sourceTypes = ref<string[]>(fallbackSourceTypes);

const sourceLabelMap: Record<string, string> = {
  TEXT: "粘贴文本",
  URL: "网页URL",
  API: "第三方API",
  FILE: "本地文件",
  GROOVY: "Groovy脚本",
  HANZI: "汉字库",
};

const gradeLevelLabels: Record<string, string> = {
  PRIMARY: "小学",
  JUNIOR: "初中",
  SENIOR: "高中",
  UNIVERSITY: "大学",
  OTHER: "其他",
};

const sourceOptions = computed(() =>
  sourceTypes.value.map((type) => ({ value: type, label: sourceLabelMap[type] || type }))
);

async function loadSourceTypes() {
  try {
    const types = await eduaiApi.collectSourceTypes();
    if (types?.length) {
      sourceTypes.value = [...new Set([...visibleSourceTypes(types), ...fallbackSourceTypes])];
    }
  } catch {
    sourceTypes.value = fallbackSourceTypes;
  }
}

function sourceLabel(type?: string) {
  return sourceLabelMap[type ?? ""] || type || "";
}

function gradeLevelLabel(value?: string) {
  return gradeLevelLabels[value ?? ""] || value || "";
}

function sourceTagType(type?: string) {
  return { TEXT: "info", URL: "primary", API: "warning", FILE: "success", GROOVY: "danger", HANZI: "primary" }[type ?? ""] || "info";
}

function logStatusType(status?: number) {
  return { 0: "warning", 1: "success", 2: "danger" }[status ?? 0] as any;
}

function logStatusLabel(status?: number) {
  return { 0: "执行中", 1: "成功", 2: "失败" }[status ?? 0] || "未知";
}

  onMounted(() => {
    loadSourceTypes();
    void loadMeta().catch(() => undefined);
  void loadDbTables();
  void loadStats();
  tickTimer = setInterval(() => {
    nowTick.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer);
  if (pollTimer) clearInterval(pollTimer);
});
</script>

<style scoped>
.page-container {
  height: 100%;
  overflow: auto;
  background: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
}

/* ---------- 上区：页头 + 右侧悬浮正方形统计卡 ---------- */
.top-zone {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: -74px;
  position: relative;
  z-index: 2;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 0;
  padding-top: 4px;
  min-width: 0;
  flex: 1;
}
.page-header__title {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.25;
}
.page-header__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

/* ---------- 统计卡 ---------- */
.stats-row {
  display: flex;
  flex-shrink: 0;
  gap: 14px;
  margin-bottom: 0;
}
.stat-card {
  width: 148px;
  height: 148px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  /* koi 卡片不加投影：已有一条边框承载边界，边界色再提浅一档（-light → -lighter） */
  border: 1px solid var(--el-border-color-lighter);
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  /* 浮起反馈是 koi 唯一允许的卡片投影 */
  box-shadow: 0 12px 28px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}
.stat-card__body {
  min-width: 0;
  width: 100%;
}
.stat-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stat-card__value {
  font-size: 30px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.1;
}
.stat-card__hint {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.stat-card__icon {
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-lg, 12px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-white);
  flex-shrink: 0;
  align-self: flex-end;
}

/* ---------- 筛选（被统计卡下半压住） ---------- */
.filter-card {
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  margin-bottom: 14px;
  border: 0;
  position: relative;
  z-index: 1;
}
.filter-card :deep(.el-card__body) {
  padding: 92px 20px 18px;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr)) auto;
  gap: 14px;
  align-items: end;
}
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.filter-field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
}
.filter-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}
.filter-actions .el-button {
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  min-width: 88px;
  font-weight: 600;
}

/* ---------- 调度状态条 ---------- */
.sched-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 16px;
  margin-bottom: 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.sched-bar__left,
.sched-bar__right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.sched-bar__label {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.sched-bar__clock {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* ---------- 表格卡 ---------- */
.table-card {
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  border: 0;
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
}

.script-editor :deep(textarea) {
  font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
  tab-size: 4;
}

.cron-text {
  font-family: "JetBrains Mono", Consolas, "Courier New", monospace;
}

/* 数据表入库：字段预览与映射 */
.proc-tip {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.proc-tip b {
  color: var(--el-text-color-primary);
}
.proc-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 0 10px;
  min-height: 34px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  font-size: 13px;
  color: var(--el-text-color-primary);
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.proc-field:hover {
  border-color: var(--el-color-primary-light-5);
}
.proc-field:focus-visible {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.proc-field .is-empty {
  color: var(--el-text-color-placeholder);
}
.db-preview {
  margin: 4px 0 10px;
  padding: 10px 12px;
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
  border: 1px dashed var(--el-border-color-lighter);
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.db-preview__row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.db-preview__cell b {
  color: var(--el-text-color-primary);
}
.db-map {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.db-map__row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.db-map__arrow {
  color: var(--el-text-color-secondary);
  font-weight: 700;
}

@media (max-width: 1200px) {
  .filter-grid {
    grid-template-columns: repeat(2, minmax(150px, 1fr));
  }
  .stat-card {
    width: 128px;
    height: 128px;
  }
  .stat-card__value {
    font-size: 24px;
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .stat-card,
  .proc-field {
    transition: none;
  }
  /* 位移也是动效：关掉后 :hover 只剩投影反馈 */
  .stat-card:hover {
    transform: none;
  }
}
</style>
