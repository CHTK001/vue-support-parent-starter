<template>
  <ReDialog
    v-model="visible"
    :title="title"
    :subtitle="subtitle"
    :icon="Upload"
    width="980px"
    :close-on-click-modal="false"
    :close-on-press-escape="!running"
  >
    <!-- 步骤条：7 步，圆形序号 + 连接线 + 标题/已完成摘要 -->
    <div class="iw-steps">
      <div
        v-for="(item, index) in STEPS"
        :key="item.title"
        class="iw-step"
        :class="{ 'is-on': index === step, 'is-done': index < step }"
      >
        <span class="iw-step-dot">
          <ReIcon v-if="index < step" name="Select" :size="13" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span v-if="index < STEPS.length - 1" class="iw-step-line" />
        <span class="iw-step-labels">
          <span class="iw-step-title">{{ item.title }}</span>
          <span v-if="index < step" class="iw-step-desc is-summary">{{ summaryOf(index) }}</span>
          <span v-else class="iw-step-desc">{{ item.description }}</span>
        </span>
      </div>
    </div>

    <div class="iw-body">
      <!-- ========== 第 1 步：导入类型 ========== -->
      <section v-if="step === 0" class="iw-pane">
        <p class="iw-lead">这个向导允许你指定如何导入数据。你要选择哪种数据导入格式？</p>
        <div class="iw-types">
          <button
            v-for="t in IMPORT_TYPES"
            :key="t.value"
            type="button"
            class="iw-type"
            :class="{ 'is-on': type === t.value }"
            :data-testid="`iw-type-${t.value}`"
            @click="type = t.value"
          >
            <span class="iw-type-radio" aria-hidden="true" />
            <span class="iw-type-body">
              <span class="iw-type-name">{{ t.label }}</span>
              <span class="iw-type-hint">{{ t.hint }}</span>
            </span>
          </button>
        </div>
        <p v-if="!excelAvailable" class="iw-note is-warn">
          当前后端实例未装配 Excel 解析能力（classpath 缺少 Apache POI），只能导入 CSV。
        </p>
      </section>

      <!-- ========== 第 2 步：选择文件 ========== -->
      <section v-else-if="step === 1" class="iw-pane">
        <p class="iw-lead">你必须选择一个文件作为数据源。</p>
        <div class="iw-row">
          <span class="iw-label">导入从</span>
          <div class="iw-file-box">
            <div v-if="fileName" class="iw-file-row">
              <ReIcon name="Document" :size="14" />
              <span class="iw-file-name" :title="fileName">{{ fileName }}</span>
              <span class="iw-file-size">{{ formatSize(fileSize) }}</span>
              <ReIcon name="Close" :size="13" class="iw-file-del" @click="clearFile" />
            </div>
            <div v-else class="iw-file-empty">还没有选择文件</div>
            <div class="iw-file-actions">
              <ReButton size="small" icon="FolderOpened" @click="fileInput?.click()">添加文件</ReButton>
              <ReButton
                size="small"
                icon="Link"
                :disabled="true"
                tip="按网址导入需要服务端能访问该地址，暂未开放"
              >添加网址</ReButton>
            </div>
            <input
              ref="fileInput"
              type="file"
              class="iw-file-input"
              :accept="acceptAttr"
              @change="onFilePicked"
            />
          </div>
        </div>

        <div class="iw-row">
          <span class="iw-label">编码</span>
          <ReSelect v-model="encoding" style="width: 240px">
            <ReOption label="自动探测（推荐）" value="AUTO" />
            <ReOption label="65001 (UTF-8)" value="UTF-8" />
            <ReOption label="936 (GBK)" value="GBK" />
            <ReOption label="54936 (GB18030)" value="GB18030" />
            <ReOption label="28591 (ISO-8859-1)" value="ISO-8859-1" />
            <ReOption label="1200 (UTF-16LE)" value="UTF-16LE" />
          </ReSelect>
          <span class="iw-hint">中文乱码时改成 GBK 再试</span>
        </div>

        <!-- Excel 才有：工作表多选 -->
        <template v-if="type === 'excel' && sheets.length">
          <div class="iw-row iw-row--top">
            <span class="iw-label">表</span>
            <div class="iw-sheet-box">
              <div class="iw-sheet-actions">
                <ReButton size="small" @click="selectAllSheets(true)">全选</ReButton>
                <ReButton size="small" @click="selectAllSheets(false)">取消全选</ReButton>
              </div>
              <label v-for="s in sheets" :key="s" class="iw-sheet">
                <input
                  type="checkbox"
                  :checked="selectedSheets.includes(s)"
                  @change="toggleSheet(s, ($event.target as HTMLInputElement).checked)"
                />
                <span>{{ s }}</span>
              </label>
            </div>
          </div>
          <p class="iw-hint">
            勾选的工作表会逐张导入（第 4 步为每张表各生成一行目标表）；
            这里选中的第一张决定第 3 步的列预览与字段映射。
          </p>
        </template>

        <p v-if="parsing" class="iw-hint">正在解析文件…</p>
        <template v-else-if="preview">
          <div class="iw-stat">
            已解析 <strong>{{ preview.rowCount }}</strong> 行、
            <strong>{{ preview.columns.length }}</strong> 列
            <span v-if="activeSheet" class="iw-tag">{{ activeSheet }}</span>
            <span v-if="preview.delimiter" class="iw-tag">分隔符 {{ preview.delimiter }}</span>
            <span class="iw-tag">{{ preview.encoding }}</span>          </div>
          <div v-for="(w, i) in preview.warnings" :key="i" class="iw-note is-warn">{{ w }}</div>
          <div class="iw-table-wrap">
            <ReTable
              :data="previewRows"
              :columns="previewColumns"
              :pagination="false"
              stripe
              border
              size="mini"
              height="200px"
            />
          </div>
        </template>
      </section>

      <!-- ========== 第 3 步：附加选项 ========== -->
      <section v-else-if="step === 2" class="iw-pane">
        <p class="iw-lead">
          {{ type === "excel"
            ? "你可以为源定义一些附加的选项。"
            : "你的字段要用什么分隔符来分隔？请选择合适的分隔符。" }}
        </p>

        <!-- CSV 专有：记录分隔符 / 字段分隔符 / 文本识别符号 -->
        <template v-if="type !== 'excel'">
          <div class="iw-field-grid">
            <label class="iw-field">
              <span class="iw-field-label">记录分隔符</span>
              <ReSelect v-model="recordDelimiter" style="width: 100%">
                <ReOption label="CRLF（Windows）" value="CRLF" />
                <ReOption label="LF（Unix / macOS）" value="LF" />
                <ReOption label="CR（旧 Mac）" value="CR" />
              </ReSelect>
            </label>
            <label class="iw-field">
              <span class="iw-field-label">字段分隔符</span>
              <ReSelect v-model="delimiterModel" filterable allow-create style="width: 100%">
                <ReOption v-for="d in DELIMITERS" :key="d.value" :label="d.label" :value="d.value" />
              </ReSelect>
              <span class="iw-field-hint">可直接输入任意单个字符；默认分隔符也可清空交给后端探测</span>
            </label>
            <label class="iw-field">
              <span class="iw-field-label">文本识别符号</span>
              <ReSelect v-model="textQualifier" style="width: 100%">
                <ReOption label="双引号 &quot;" value="&quot;" />
                <ReOption label="单引号 '" value="'" />
                <ReOption label="（不使用）" value="" />
              </ReSelect>
            </label>
          </div>
        </template>

        <!-- 行区间（CSV 与 Excel 共用） -->
        <div class="iw-section-title">
          {{ type === "excel" ? "行与数字" : "附加选项" }}
        </div>
        <div class="iw-field-grid">
          <label class="iw-field">
            <span class="iw-field-label">字段名称行</span>
            <ReInputNumber v-model="fieldNamesLine" :min="0" :max="1000" controls-position="right" style="width: 100%" />
            <span class="iw-field-hint">0 = 文件没有表头，按 col1、col2 命名</span>
          </label>
          <label class="iw-field">
            <span class="iw-field-label">第一个数据行</span>
            <ReInputNumber v-model="firstDataLine" :min="1" :max="1000000" controls-position="right" style="width: 100%" />
          </label>
          <label class="iw-field">
            <span class="iw-field-label">最后一个数据行</span>
            <ReInputNumber v-model="lastDataLine" :min="0" :max="10000000" controls-position="right" style="width: 100%" />
            <span class="iw-field-hint">0 = 读到文件末尾</span>
          </label>
          <label class="iw-field">
            <span class="iw-field-label">小数点符号</span>
            <ReSelect v-model="decimalSymbol" style="width: 100%">
              <ReOption label="点 ." value="." />
              <ReOption label="逗号 ," value="," />
            </ReSelect>
            <span class="iw-field-hint">源文本用逗号做小数点时，先换成点再入库</span>
          </label>
        </div>

        <!-- Excel 专有：日期顺序 / 分隔符（只作用于日期、时间列） -->
        <template v-if="type === 'excel'">
          <div class="iw-section-title">日期</div>
          <div class="iw-field-grid">
            <label class="iw-field">
              <span class="iw-field-label">日期顺序</span>
              <ReSelect v-model="dateOrder" style="width: 100%">
                <ReOption v-for="o in DATE_ORDERS" :key="o.value" :label="o.label" :value="o.value" />
              </ReSelect>
            </label>
            <label class="iw-field">
              <span class="iw-field-label">日期时间顺序</span>
              <ReSelect v-model="dateTimeOrder" style="width: 100%">
                <ReOption v-for="o in DATE_ORDERS" :key="o.value" :label="o.label" :value="o.value" />
              </ReSelect>
            </label>
            <label class="iw-field">
              <span class="iw-field-label">日期分隔符</span>
              <ReSelect v-model="dateSeparator" style="width: 100%">
                <ReOption v-for="d in DATE_SEPARATORS" :key="d.value" :label="d.label" :value="d.value" />
              </ReSelect>
            </label>
            <label class="iw-field">
              <span class="iw-field-label">年份分隔符</span>
              <ReSelect v-model="yearSeparator" style="width: 100%">
                <ReOption v-for="d in DATE_SEPARATORS" :key="d.value" :label="d.label" :value="d.value" />
              </ReSelect>
            </label>
            <label class="iw-field">
              <span class="iw-field-label">时间分隔符</span>
              <ReSelect v-model="timeSeparator" style="width: 100%">
                <ReOption label="冒号 (:)" value=":" />
                <ReOption label="点 (.)" value="." />
                <ReOption label="空格" value=" " />
              </ReSelect>
            </label>
          </div>
          <p class="iw-hint">
            日期规则只作用于目标是 DATE / TIME / DATETIME 的列；对不上的文本原样写入，
            由数据库报错，而不是猜一个可能错的月份。
          </p>
        </template>

        <div class="iw-actions">
          <ReButton size="small" icon="Refresh" :loading="parsing" @click="reparse">重新解析并刷新预览</ReButton>
        </div>

        <p v-if="parsing" class="iw-hint">正在解析文件…</p>
        <template v-else-if="preview">
          <div class="iw-stat">
            已解析 <strong>{{ preview.rowCount }}</strong> 行、
            <strong>{{ preview.columns.length }}</strong> 列
          </div>
          <div v-for="(w, i) in preview.warnings" :key="i" class="iw-note is-warn">{{ w }}</div>
          <div class="iw-table-wrap">
            <ReTable
              :data="previewRows"
              :columns="previewColumns"
              :pagination="false"
              stripe
              border
              size="mini"
              height="200px"
            />
          </div>
        </template>
      </section>

      <!-- ========== 第 4 步：选择目标表 ========== -->
      <section v-else-if="step === 3" class="iw-pane">
        <p class="iw-lead">
          {{
            targetRows.length > 1
              ? `选中的 ${targetRows.length} 张源表要分别导入到哪张目标表？可以选现有表，也可以输入新表名。`
              : "选择目标表。你可选择现有的表，或输入新的表名称。"
          }}
        </p>
        <ReTable
          :data="targetRows"
          :columns="TARGET_COLUMNS"
          :pagination="false"
          border
          size="mini"
          height="260px"
        >
          <template #col-target="{ row }">
            <ReSelect
              v-model="row.targetTable"
              filterable
              allow-create
              default-first-option
              placeholder="选择或输入新表名"
              style="width: 100%"
              @change="onTargetTableChange(row)"
            >
              <ReOption v-for="t in tableNames" :key="t" :label="t" :value="t" />
            </ReSelect>
          </template>
          <template #col-create="{ row }">
            <input
              type="checkbox"
              :checked="row.createTable"
              :disabled="tableNames.includes(row.targetTable)"
              @change="onCreateTableToggle(row, ($event.target as HTMLInputElement).checked)"
            />
          </template>
        </ReTable>
        <div class="iw-row">
          <span class="iw-label">目标库</span>
          <ReSelect v-model="database" style="width: 240px" @change="onDatabaseChange">
            <ReOption v-for="d in databases" :key="d" :label="d" :value="d" />
          </ReSelect>
          <span class="iw-hint">换库会重新加载表清单与列结构</span>
        </div>
        <p v-if="duplicatedTargets" class="iw-note is-error">
          多行指向同一张表「{{ duplicatedTargets }}」：多张源表追加进同一张表请在第 6 步选「追加」，
          并在这里给每行填不同的表名，否则会互相覆盖。
        </p>
        <p v-if="!tableNames.length" class="iw-note is-warn">
          当前库没有已存在的表；直接输入一个表名并勾「新建表」即可。
        </p>
        <p v-if="targetRows.length > 1" class="iw-hint">
          字段映射（第 5 步）对这几张表共用一份：按第 3 步预览的那张源表的列名配置。
        </p>
      </section>

      <!-- ========== 第 5 步：字段映射 ========== -->
      <section v-else-if="step === 4" class="iw-pane">
        <p class="iw-lead">你可以定义字段映射。设置映射来指定源字段和目的字段之间的对应关系。</p>
        <div class="iw-row">
          <span class="iw-label">源</span>
          <ReSelect v-if="sheets.length > 1" v-model="activeSheet" style="width: 260px" @change="onSheetChange">
            <ReOption v-for="s in sheets" :key="s" :label="s" :value="s" />
          </ReSelect>
          <span v-else class="iw-static">{{ activeSheet || fileName || "（单一数据源）" }}</span>
          <span class="iw-label">目标表</span>
          <span class="iw-static">
            {{ currentTarget || "（未选择）" }}
            <span v-if="targetRows.length > 1" class="iw-hint">等 {{ targetRows.length }} 张</span>
          </span>
        </div>
        <ReTable
          :data="mappingRows"
          :columns="MAPPING_COLUMNS"
          :pagination="false"
          border
          size="mini"
          height="300px"
        >
          <template #col-source="{ row }">
            <span class="iw-mono">{{ row.source }}</span>
          </template>
          <template #col-target="{ row }">
            <ReSelect
              v-model="row.target"
              filterable
              allow-create
              clearable
              placeholder="（不导入）"
              style="width: 100%"
            >
              <ReOption label="（不导入）" value="" />
              <ReOption v-for="c in targetColumns" :key="c.name" :label="columnLabel(c)" :value="c.name" />
            </ReSelect>
          </template>
          <template #col-key="{ row }">
            <input
              type="checkbox"
              :checked="row.key"
              @change="onKeyToggle(row, ($event.target as HTMLInputElement).checked)"
            />
          </template>
        </ReTable>
        <div v-if="mappingConflict" class="iw-note is-error">映射冲突：{{ mappingConflict }}</div>
        <p class="iw-hint">
          「目标字段」可直接输入新名字：勾了「新建表」时按输入的名字建列；
          目标是现有表时，输入的名称必须是表里已有的列，否则执行阶段会报「列不存在」。
        </p>
        <div class="iw-row">
          <span class="iw-label">匹配方式</span>
          <span class="iw-hint">
            勾选「主键」的列用于「更新 / 追加或更新 / 不更新追加 / 删除」模式定位已有行；
            一个都不勾时按目标表主键。
          </span>
        </div>
      </section>

      <!-- ========== 第 6 步：导入模式 ========== -->
      <section v-else-if="step === 5" class="iw-pane">
        <p class="iw-lead">请选择一个所需的导入模式。</p>
        <div class="iw-modes">
          <label v-for="m in DB_IMPORT_MODES" :key="m.value" class="iw-mode">
            <input v-model="mode" type="radio" :value="m.value" />
            <span class="iw-mode-body">
              <span class="iw-mode-name">{{ m.label }}</span>
              <span class="iw-mode-hint">{{ m.hint }}</span>
            </span>
          </label>
        </div>
        <p v-if="modeNeedsKey && !hasKeyColumns && !targetHasPrimaryKey" class="iw-note is-warn">
          「{{ modeLabel }}」需要用于匹配的键列：目标表没有主键时，请回第 5 步勾选主键。
        </p>
        <div class="iw-row">
          <span class="iw-label">每批行数</span>
          <ReInputNumber v-model="batchSize" :min="1" :max="100000" controls-position="right" style="width: 160px" />
          <ReButton size="small" icon="Setting" @click="advancedVisible = true">高级</ReButton>
          <span class="iw-hint">
            {{ advanced.extendedInsert ? "扩展插入已开启（批量提交）" : "逐行提交（错误定位更细）" }}
            <template v-if="advanced.nullForEmpty">· 空串写 NULL</template>
            <template v-if="advanced.ignoreForeignKey">· 忽略外键</template>
            <template v-if="!advanced.continueOnError">· 遇错即停</template>
          </span>
        </div>
      </section>

      <!-- ========== 第 7 步：执行 ========== -->
      <section v-else class="iw-pane">
        <p class="iw-lead">
          我们已收集向导导入数据时所需的所有信息。点击 [开始] 按钮进行导入。
        </p>
        <div class="iw-run-stats">
          <div class="iw-stat-cell">
            <span class="iw-stat-label">表</span>
            <span class="iw-stat-value">{{ currentTarget || "—" }}</span>
          </div>
          <div class="iw-stat-cell">
            <span class="iw-stat-label">已处理</span>
            <span class="iw-stat-value">{{ run.done }} / {{ run.total || preview?.rowCount || 0 }}</span>
          </div>
          <div class="iw-stat-cell">
            <span class="iw-stat-label">错误</span>
            <span class="iw-stat-value" :class="{ 'is-bad': runErrors > 0 }">{{ runErrors }}</span>
          </div>
          <div class="iw-stat-cell">
            <span class="iw-stat-label">已添加</span>
            <span class="iw-stat-value">{{ run.inserted }}</span>
          </div>
          <div class="iw-stat-cell">
            <span class="iw-stat-label">已更新</span>
            <span class="iw-stat-value">{{ run.updated }}</span>
          </div>
          <div class="iw-stat-cell">
            <span class="iw-stat-label">已删除</span>
            <span class="iw-stat-value">{{ run.deleted }}</span>
          </div>
          <div class="iw-stat-cell">
            <span class="iw-stat-label">时间</span>
            <span class="iw-stat-value">{{ elapsedText }}</span>
          </div>
        </div>

        <div class="iw-progress">
          <div class="iw-progress-bar" :style="{ width: `${progressPercent}%` }" />
        </div>

        <div class="iw-log-head">
          <span class="iw-label">日志</span>
          <span class="iw-spacer" />
          <ReButton size="small" icon="Download" :disabled="!logLines.length" @click="saveLog">保存日志</ReButton>
          <ReButton size="small" icon="Document" :disabled="!logLines.length" @click="copyLog">复制</ReButton>
        </div>
        <div ref="logBox" class="iw-log">
          <div v-for="(line, i) in logLines" :key="i" class="iw-log-line" :class="line.tone">
            <span class="iw-log-time">{{ line.at }}</span>
            <span class="iw-log-text">{{ line.text }}</span>
          </div>
          <div v-if="!logLines.length" class="iw-log-empty">
            还没有开始。点右下角「开始」按钮执行导入。
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="iw-footer">
        <ReButton :disabled="running" @click="close">关闭</ReButton>
        <span class="iw-spacer" />
        <ReButton :disabled="step === 0 || running" @click="prev">上一步</ReButton>
        <ReButton
          v-if="step < STEPS.length - 1"
          type="primary"
          :disabled="!canGoNext"
          @click="next"
        >下一步</ReButton>
        <ReButton
          v-else
          type="primary"
          :loading="running"
          :disabled="running || run.finished"
          @click="startImport"
        >{{ run.finished ? "已完成" : "开始" }}</ReButton>
      </div>
    </template>
  </ReDialog>

  <!-- 高级选项 -->
  <ReDialog v-model="advancedVisible" title="高级选项" width="480px">
    <div class="iw-adv">
      <label class="iw-adv-item">
        <input v-model="advanced.extendedInsert" type="checkbox" />
        <span>
          <span class="iw-adv-name">使用扩展插入语句</span>
          <span class="iw-adv-hint">关闭后逐行提交，速度慢但错误定位更细</span>
        </span>
      </label>
      <label class="iw-adv-item iw-adv-item--stack">
        <span class="iw-adv-name">最大语句大小</span>
        <span class="iw-adv-inline">
          <ReInputNumber
            v-model="advanced.maxStatementKb"
            :min="0"
            :max="1048576"
            controls-position="right"
            style="width: 140px"
          />
          <span class="iw-adv-unit">KB</span>
        </span>
        <span class="iw-adv-hint">0 = 不限制</span>
      </label>
      <label class="iw-adv-item">
        <input v-model="advanced.nullForEmpty" type="checkbox" />
        <span>
          <span class="iw-adv-name">使用 NULL 取代空白字符串</span>
          <span class="iw-adv-hint">对 NOT NULL 列会失败并计入错误</span>
        </span>
      </label>
      <label class="iw-adv-item">
        <input v-model="advanced.ignoreForeignKey" type="checkbox" />
        <span>
          <span class="iw-adv-name">忽略外键约束</span>
          <span class="iw-adv-hint">仅 MySQL / MariaDB 生效</span>
        </span>
      </label>
      <label class="iw-adv-item">
        <input v-model="advanced.continueOnError" type="checkbox" />
        <span>
          <span class="iw-adv-name">遇到错误时继续</span>
          <span class="iw-adv-hint">一行失败不影响其余行</span>
        </span>
      </label>
    </div>
    <template #footer>
      <ReButton type="primary" @click="advancedVisible = false">确定</ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 导入向导（对齐 Navicat 的 7 步流程）。
 *
 * <p>步骤：类型 → 文件 → 附加选项 → 目标表 → 字段映射 → 导入模式 → 执行。</p>
 *
 * <p><b>为什么上传只做一次</b>：第 2 步上传后后端返回 {@code token}，第 3 步改分隔符
 * 重解析、第 5 步换目标表、第 7 步执行，全都带着这个 token 走后端暂存文件。
 * 否则每改一个选项就要把几十 MB 的 Excel 重新跨网传一遍，界面会卡到无法操作。</p>
 *
 * <p><b>为什么第 7 步走 SSE</b>：导入几十万行时普通请求既看不到进度也无法中途了解
 * 失败原因。后端逐条失败推 {@code log}、每 200 行推 {@code progress}，前端只做追加渲染。</p>
 */
import { computed, nextTick, ref, watch } from "vue";
import { Upload } from "@element-plus/icons-vue";
import { message } from "@repo/core";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInputNumber from "@repo/ui/re-input-number";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import { ReOption } from "@repo/ui/re-kit";
import {
  DB_IMPORT_ADVANCED_DEFAULTS,
  DB_IMPORT_MODES,
  uploadDbImportFile,
  parseDbImport,
  planDbImportTable,
  runDbImport,
  type DbImportAdvanced,
  type DbImportMode,
  type DbImportPreview,
  type DbImportSourceOptions,
} from "../../api/dbManageApi";
import { fetchDbDatabases, fetchDbTables, fetchTableColumns, type DbColumnInfo } from "../../api/manageConsoles";

defineOptions({ name: "DbImportWizard" });

/** 导入类型（需求只保留 CSV 与 Excel 两类） */
const IMPORT_TYPES = [
  {
    value: "csv" as const,
    label: "CSV 文件（*.csv）",
    hint: "逗号 / 分号 / 制表符分隔的文本，支持自定义记录分隔符与引号",
  },
  {
    value: "excel" as const,
    label: "Excel 文件（*.xls; *.xlsx）",
    hint: "可直接选工作表；单元格按显示值读取",
  },
];

/** 字段分隔符候选（value 是真正参与解析的字符，别写成 "\\t"） */
const DELIMITERS = [
  { value: ",", label: "逗号 (,)" },
  { value: ";", label: "分号 (;)" },
  { value: "\t", label: "制表符 (Tab)" },
  { value: "|", label: "竖线 (|)" },
  { value: " ", label: "空格" },
];

/** 日期顺序候选 */
const DATE_ORDERS = [
  { value: "YMD", label: "年 / 月 / 日（YMD）" },
  { value: "DMY", label: "日 / 月 / 年（DMY）" },
  { value: "MDY", label: "月 / 日 / 年（MDY）" },
];

/** 日期分隔符候选 */
const DATE_SEPARATORS = [
  { value: "/", label: "斜杠 (/)" },
  { value: "-", label: "短横 (-)" },
  { value: ".", label: "点 (.)" },
  { value: " ", label: "空格" },
];

/** 7 步定义 */
const STEPS = [
  { title: "导入类型", description: "选择 CSV 或 Excel" },
  { title: "选择文件", description: "文件与编码" },
  { title: "附加选项", description: "分隔符与行区间" },
  { title: "目标表", description: "现有表或新建表" },
  { title: "字段映射", description: "源字段到目标字段" },
  { title: "导入模式", description: "追加 / 更新 / 复制" },
  { title: "执行", description: "开始导入并查看日志" },
];

/** 第 4 步表格的列 */
const TARGET_COLUMNS = [
  { prop: "source", label: "源", minWidth: 180, showOverflowTooltip: true },
  { prop: "targetTable", label: "目标表", minWidth: 240, slot: "col-target" },
  { prop: "createTable", label: "新建表", width: 100, slot: "col-create", align: "center" as const },
];

/** 第 5 步表格的列 */
const MAPPING_COLUMNS = [
  { prop: "source", label: "源字段", minWidth: 200, slot: "col-source" },
  { prop: "target", label: "目标字段", minWidth: 240, slot: "col-target" },
  { prop: "key", label: "主键", width: 90, slot: "col-key", align: "center" as const },
];

/** 上传区接受的扩展名 */
const csvAccept = ".csv,.tsv,.tab,.txt";
const excelAccept = ".xls,.xlsx,.xlsm";

const visible = defineModel<boolean>({ default: false });

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
  /** 初始库（从某张表右键进来时带上） */
  database?: string;
  /** 初始目标表 */
  tableName?: string;
}>();

const emit = defineEmits<{
  /** 导入成功后通知父级刷新表数据 */
  (e: "done", payload: { table: string; database: string }): void;
}>();

/** 当前步骤下标 */
const step = ref(0);
/** 导入类型 */
const type = ref<"csv" | "excel">("csv");
/** 文件与上传状态 */
const fileInput = ref<HTMLInputElement | null>(null);
const fileName = ref("");
const fileSize = ref(0);
/** 当前编码选择；AUTO 表示交给后端按内容探测 */
const encoding = ref("AUTO");
const parsing = ref(false);
/** 后端解析结果（含 token） */
const preview = ref<DbImportPreview | null>(null);
/** Excel 工作表多选 */
const sheets = ref<string[]>([]);
const selectedSheets = ref<string[]>([]);
const activeSheet = ref("");
/** 后端是否装配了 Excel 能力（首屏探测失败时保守认为可用，交给后端报错） */
const excelAvailable = ref(true);
/** 源选项（第 3 步） */
const recordDelimiter = ref("CRLF");
const delimiter = ref(",");

/**
 * 字段分隔符的读写代理（支持自定义输入）。
 *
 * <p>下拉候选只有逗号/分号/制表符等常用值，但真实文件里还会出现 {@code #}、{@code ~}、
 * {@code :} 这类单字符分隔符，所以下拉开了 {@code allow-create} 让用户直接输入。</p>
 *
 * <p><b>必须卡死单字符</b>：后端 {@code DbImportDTO.delimiterChar()} 用
 * {@code delimiter.charAt(0)} 取首字符解析，多字符（如 {@code ||}）会被静默截成
 * {@code |} —— 界面上写着 {@code ||}、实际按 {@code |} 切分，属于最难排查的一类错。
 * 因此在写入前拦截并提示，而不是让它悄悄生效。</p>
 *
 * <p>清空是合法状态（{@code ""}）：表示不指定，由后端按内容自动探测。</p>
 */
const delimiterModel = computed<string>({
  get: () => delimiter.value,
  set: (value: string) => {
    const text = value ?? "";
    if (text.length > 1) {
      message.warning("字段分隔符只能是单个字符");
      // 不写入：让下拉回弹到上一次的合法值，避免半截输入留下来
      delimiter.value = delimiter.value;
      return;
    }
    delimiter.value = text;
  },
});
const textQualifier = ref('"');
const decimalSymbol = ref(".");
const fieldNamesLine = ref(1);
const firstDataLine = ref(2);
const lastDataLine = ref(0);
/** 日期解读规则（Excel 分支） */
const dateOrder = ref("YMD");
const dateTimeOrder = ref("YMD");
const dateSeparator = ref("/");
const yearSeparator = ref("/");
const timeSeparator = ref(":");
/** 目标库 / 表 */
const database = ref("");
const databases = ref<string[]>([]);
const tableNames = ref<string[]>([]);
/** 第 4 步的一行：一张源表（CSV 文件 / Excel 工作表）→ 一张目标表 */
const targetRows = ref<
  { source: string; sheet: string; targetTable: string; createTable: boolean }[]
>([]);
/** 目标表列结构 */
const targetColumns = ref<DbColumnInfo[]>([]);
/** 第 5 步映射行 */
const mappingRows = ref<{ source: string; target: string; key: boolean }[]>([]);
/** 第 6 步 */
const mode = ref<DbImportMode>("append");
const batchSize = ref(500);
const advanced = ref<DbImportAdvanced>({ ...DB_IMPORT_ADVANCED_DEFAULTS });
const advancedVisible = ref(false);
/** 第 7 步运行状态 */
const running = ref(false);
const logBox = ref<HTMLDivElement | null>(null);
const logLines = ref<{ at: string; text: string; tone: string }[]>([]);
const run = ref({
  done: 0,
  total: 0,
  /** 之前已完成表（多工作表串行时）的累计行数 */
  baseDone: 0,
  /** 之前已完成表的累计总数 */
  baseTotal: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  deleted: 0,
  errors: 0,
  elapsedMs: 0,
  finished: false,
  failed: false,
});
/** 中断句柄（关闭弹窗时用） */
let abortRun: (() => void) | null = null;
/** 当前这张表的 Promise 收尾函数（关闭弹窗时用它解除串行循环） */
let currentResolve: (() => void) | null = null;

const title = computed(() => "导入向导");
const subtitle = computed(() => `第 ${step.value + 1} / ${STEPS.length} 步 · ${STEPS[step.value].title}`);
const acceptAttr = computed(() => (type.value === "excel" ? excelAccept : csvAccept));

/** 当前目标表 */
const currentTarget = computed(() => targetRows.value[0]?.targetTable ?? props.tableName ?? "");

/**
 * 预览表的行。
 *
 * <p>统一改写成 {@code __c0..__cN} 的索引键再交给表格：CSV 表头里出现 {@code .}
 * （如 {@code user.name}）时，vxe 会把 {@code prop} 当成嵌套路径去取值，整表空白。</p>
 */
const previewRows = computed(() =>
  (preview.value?.rows ?? []).slice(0, 50).map(row => {
    const flat: Record<string, string> = {};
    (preview.value?.columns ?? []).forEach((column, index) => {
      const value = row[column];
      flat[`__c${index}`] =
        value === null || value === undefined
          ? ""
          : typeof value === "object"
            ? JSON.stringify(value)
            : String(value);
    });
    return flat;
  }),
);

/** 预览表的列：按解析出的列名动态生成（prop 用索引，label 用真实列名） */
const previewColumns = computed(() =>
  (preview.value?.columns ?? []).map((column, index) => ({
    prop: `__c${index}`,
    label: String(column),
    minWidth: 120,
    showOverflowTooltip: true,
  })),
);

/** 映射冲突（两个源列指向同一目标列） */
const mappingConflict = computed(() => {
  const used = new Map<string, string>();
  for (const row of mappingRows.value) {
    if (!row.target) continue;
    const prev = used.get(row.target);
    if (prev) return `${prev} 与 ${row.source} 都映射到 ${row.target}`;
    used.set(row.target, row.source);
  }
  return "";
});

/** 是否有勾选的主键列 */
const hasKeyColumns = computed(() => mappingRows.value.some(r => r.key && r.target));

/** 目标表自身是否已有主键（有的话后端会按主键匹配，用户不必再勾） */
const targetHasPrimaryKey = computed(() => targetColumns.value.some(c => c.isPrimaryKey));

/** 当前模式是否需要键列 */
const modeNeedsKey = computed(() =>
  ["update", "upsert", "insert-ignore", "delete"].includes(mode.value),
);

/** 当前模式中文名 */
const modeLabel = computed(() => DB_IMPORT_MODES.find(m => m.value === mode.value)?.label ?? mode.value);

/** 运行错误数 */
const runErrors = computed(() => run.value.errors);

/** 进度百分比 */
const progressPercent = computed(() => {
  const total = run.value.total || preview.value?.rowCount || 0;
  if (!total) return 0;
  return Math.min(100, Math.round((run.value.done / total) * 100));
});

/** 耗时文本 */
const elapsedText = computed(() => {
  const ms = run.value.elapsedMs || 0;
  if (ms < 1000) return `${ms} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60000)}m${Math.round((ms % 60000) / 1000)}s`;
});

/** 每一步已完成时的摘要 */
function summaryOf(index: number): string {
  switch (index) {
    case 0:
      return type.value === "excel" ? "Excel" : "CSV";
    case 1:
      return fileName.value || "未选择";
    case 2:
      return type.value === "excel"
        ? `表头行 ${fieldNamesLine.value}`
        : `${delimiterLabel(delimiter.value)} · 表头行 ${fieldNamesLine.value}`;
    case 3:
      return currentTarget.value || "未选择";
    case 4: {
      const mapped = mappingRows.value.filter(r => r.target).length;
      return `${mapped} / ${mappingRows.value.length} 列`;
    }
    case 5:
      return modeLabel.value;
    default:
      return "";
  }
}

/**
 * 分隔符的中文名。
 *
 * @param value 分隔符
 * @returns 展示名
 */
function delimiterLabel(value: string): string {
  return DELIMITERS.find(d => d.value === value)?.label ?? value;
}

/**
 * 列标签：带类型与主键标记。
 *
 * @param column 列定义
 * @returns 展示文本
 */
function columnLabel(column: DbColumnInfo): string {
  // 主键标记用文字而不是 🔑：沙箱与部分 Windows 客户端没有 emoji 字体，
  // emoji 会渲染成一个方框，看起来像乱码
  const pk = column.isPrimaryKey ? " 主键" : "";
  return `${column.name}${pk}（${column.type}）`;
}

/**
 * 文件大小展示。
 *
 * @param bytes 字节数
 * @returns 形如 1.2 MB
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/** 关闭弹窗：运行中先中断连接 */
function close(): void {
  if (running.value) {
    // 先解除串行循环里的 await，再断开 SSE：只断连接的话那个 Promise 永远不落定，
    // 循环会一直挂在后台，下一次打开向导时 running 仍是 true，按钮永远转圈
    currentResolve?.();
    abortRun?.();
    running.value = false;
  }
  visible.value = false;
}

/** 上一步 */
function prev(): void {
  if (step.value > 0) {
    step.value -= 1;
    // 回到前面的步骤说明用户要改参数重跑：把上一轮的执行结果清掉，
    // 否则「开始」按钮会一直停在「已完成」的禁用态，用户以为导入坏了
    if (run.value.finished && !running.value) {
      run.value.finished = false;
      run.value.failed = false;
    }
  }
}

/** 下一步：进入某步时按需加载该步数据 */
async function next(): Promise<void> {
  if (!canGoNext.value) {
    return;
  }
  // 离开「附加选项」前一定按当前选项重解析一次：用户可能改了分隔符却没点
  // 「重新解析」，直接拿旧预览进映射会让写库用错列（预览与写入不一致最难排查）。
  // 文件已在服务端暂存，重解析只走一次 token，不重传。
  if (step.value === 2 && preview.value?.token) {
    await reparse();
  }
  step.value += 1;
  await onEnterStep(step.value);
}

/**
 * 进入某一步时的准备工作。
 *
 * <p>把「进这一步才需要的数据」放在这里，而不是一次性开弹窗全拉：
 * 用户可能只导一张表就关掉，提前拉全部库的表结构是白费。</p>
 *
 * @param index 步骤下标
 */
async function onEnterStep(index: number): Promise<void> {
  if (index === 3) {
    await loadTargets();
  } else if (index === 4) {
    // 多行时按第一行的表结构配映射，且不覆盖用户在第 4 步已改的表名
    await loadTargetColumns();
    prefillMapping();
  }
}

/** 当前步是否可以继续 */
const canGoNext = computed(() => {
  if (step.value === 0) {
    return type.value === "csv" || excelAvailable.value;
  }
  if (step.value === 1) {
    return !!preview.value && preview.value.columns.length > 0;
  }
  if (step.value === 2) {
    return !!preview.value && preview.value.columns.length > 0;
  }
  if (step.value === 3) {
    return targetRows.value.length > 0
      && targetRows.value.every(r => !!r.targetTable.trim())
      && !!database.value
      && !duplicatedTargets.value;
  }
  if (step.value === 4) {
    return !mappingConflict.value && mappingRows.value.some(r => r.target);
  }
  if (step.value === 5) {
    // 目标表自带主键时后端会按主键匹配，不必强制用户再勾一次
    return !modeNeedsKey.value || hasKeyColumns.value || targetHasPrimaryKey.value;
  }
  return true;
});

/**
 * 组装源选项。
 *
 * @returns 后端解析所需选项
 */
function sourceOptions(): DbImportSourceOptions {
  return {
    token: preview.value?.token,
    fileName: fileName.value,
    format: type.value === "excel" ? "excel" : "csv",
    // AUTO 是前端概念，后端不认识：不传就等于让它自己探测
    encoding: encoding.value && encoding.value !== "AUTO" ? encoding.value : undefined,
    sheetName: type.value === "excel" ? activeSheet.value || undefined : undefined,
    delimiter: type.value === "excel" ? undefined : delimiter.value,
    recordDelimiter: type.value === "excel" ? undefined : recordDelimiter.value,
    textQualifier: type.value === "excel" ? undefined : textQualifier.value,
    fieldNamesLine: fieldNamesLine.value,
    firstDataLine: firstDataLine.value,
    lastDataLine: lastDataLine.value,
    decimalSymbol: decimalSymbol.value,
    // 日期选项只对 Excel 有意义（CSV 的日期就是文本，按原样写）
    dateOrder: type.value === "excel" ? dateOrder.value : undefined,
    dateTimeOrder: type.value === "excel" ? dateTimeOrder.value : undefined,
    dateSeparator: type.value === "excel" ? dateSeparator.value : undefined,
    yearSeparator: type.value === "excel" ? yearSeparator.value : undefined,
    timeSeparator: type.value === "excel" ? timeSeparator.value : undefined,
  };
}

/**
 * 选中文件后立刻上传解析。
 *
 * @param event input change 事件
 */
async function onFilePicked(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  fileName.value = file.name;
  fileSize.value = file.size;
  preview.value = null;
  sheets.value = [];
  selectedSheets.value = [];
  activeSheet.value = "";
  parsing.value = true;
  try {
    const result = await uploadDbImportFile(file, {
      format: type.value === "excel" ? "excel" : "csv",
      encoding: encoding.value && encoding.value !== "AUTO" ? encoding.value : undefined,
    });
    applyPreview(result);
  } catch (e) {
    message.error(`解析失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    parsing.value = false;
    // 清空 value，否则同名文件再选一次不触发 change
    input.value = "";
  }
}

/**
 * 应用一次解析结果。
 *
 * @param result 后端解析结果
 */
function applyPreview(result: DbImportPreview): void {
  preview.value = result;
  excelAvailable.value = result.excelAvailable !== false;
  // 先收窄成局部常量：`result.sheets?.length` 的判定不会保留到回调里，
  // 直接写 `result.sheets.includes` 会被 TS 判成 possibly undefined
  const sheetNames = result.sheets ?? [];
  if (sheetNames.length) {
    sheets.value = sheetNames;
    // 已勾选的保持不变（重解析不该把用户的选择清掉），只保证至少勾一张
    const kept = selectedSheets.value.filter(s => sheetNames.includes(s));
    selectedSheets.value = kept.length ? kept : [result.activeSheet ?? sheetNames[0]];
    activeSheet.value = result.activeSheet ?? selectedSheets.value[0] ?? "";
  }
}

/**
 * 带当前选项重新解析。
 */
async function reparse(): Promise<void> {
  if (!preview.value?.token) {
    message.warning("请先在第 2 步选择文件");
    return;
  }
  parsing.value = true;
  try {
    applyPreview(await parseDbImport(sourceOptions()));
  } catch (e) {
    message.error(`解析失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    parsing.value = false;
  }
}

/** 清掉已选文件 */
function clearFile(): void {
  fileName.value = "";
  fileSize.value = 0;
  preview.value = null;
  sheets.value = [];
  selectedSheets.value = [];
  activeSheet.value = "";
}

/** 工作表全选 / 取消全选 */
function selectAllSheets(checked: boolean): void {
  selectedSheets.value = checked ? [...sheets.value] : [];
  if (!checked) {
    // 全不选时保留一张做预览：0 张工作表进不了第 4 步（没东西可导）
    return;
  }
  if (!selectedSheets.value.includes(activeSheet.value)) {
    activeSheet.value = selectedSheets.value[0] ?? "";
  }
}

/** 勾选 / 取消某个工作表 */
function toggleSheet(sheet: string, checked: boolean): void {
  const set = new Set(selectedSheets.value);
  if (checked) set.add(sheet);
  else set.delete(sheet);
  selectedSheets.value = [...set];
  // 第一张决定预览与映射：取消掉它时必须顺移到还选着的第一张，
  // 否则第 3 步显示的是「已取消」的那张表，用户看到的行数与实际要导的不一致
  if (!selectedSheets.value.includes(activeSheet.value)) {
    const next = selectedSheets.value[0];
    if (next) {
      activeSheet.value = next;
      void reparse();
    }
  }
}

/**
 * 第 5 步切换源工作表：重新解析该工作表并刷新映射。
 */
async function onSheetChange(): Promise<void> {
  await reparse();
  await loadTargetColumns();
  prefillMapping();
}

/**
 * 加载目标库与表清单（第 4 步）。
 *
 * <p>库清单必须真的去问后端：只按「进来的那个库」兜底的话，用户想换库时
 * 下拉里一个别的选项都没有。</p>
 */
async function loadTargets(): Promise<void> {
  if (!databases.value.length) {
    try {
      databases.value = (await fetchDbDatabases(props.datasourceId)) ?? [];
    } catch (e) {
      databases.value = [];
      message.warning(`读取库清单失败：${String((e as Error)?.message ?? e)}`);
    }
  }
  if (!databases.value.length && props.database) {
    databases.value = [props.database];
  }
  database.value = database.value || props.database || databases.value[0] || "";
  await loadTables();

  // 一张源表一行：CSV 是一行，Excel 是「选中的每张工作表各一行」。
  // 这与 Navicat 一致——「全选工作表」不是为了好看，它决定第 4 步出现几行目标表。
  const sources =
    type.value === "excel" && selectedSheets.value.length
      ? selectedSheets.value
      : [activeSheet.value || ""];
  // 默认名只能来自「用户明确指定的表」或「文件名 / 工作表名」。
  // 绝不能拿库里第一张表兜底：那会把数据静默追加进一张毫不相干的表。
  const named = props.tableName?.trim() ?? "";
  const previous = new Map(targetRows.value.map(row => [row.source, row]));
  targetRows.value = sources.map((sheet, index) => {
    const source = sheet || fileName.value || "源文件";
    // 用户在第 4 步改过的表名要保住：来回翻步骤不该把输入清空
    const prev = previous.get(source);
    if (prev) {
      return { ...prev, source, sheet };
    }
    const suggested =
      index === 0 && named
        ? named
        : sanitizeTableName(sheet || stripExtension(fileName.value) || "import_table");
    return {
      source,
      sheet,
      targetTable: suggested,
      // 目标表在清单里找不到 = 用户要新建它，直接把勾打上，省一次点击
      createTable: !!suggested && !tableNames.value.includes(suggested),
    };
  });
}

/**
 * 去掉文件名的扩展名。
 *
 * @param name 文件名
 * @returns 不含扩展名的名字
 */
function stripExtension(name: string): string {
  return String(name ?? "").replace(/\.[^.]+$/, "");
}

/**
 * 工作表名转表名（前端只做「看起来像表名」的建议）。
 *
 * <p>真正的清洗在后端 {@code DbImportDdl.sanitize}，这里只避免把
 * 「订单 明细」这种名字原样塞进输入框——中文表名会被后端直接拒绝。</p>
 *
 * @param raw 工作表名
 * @returns 建议表名
 */
function sanitizeTableName(raw: string): string {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[^A-Za-z0-9_]/g, "_");
  // 清洗后只剩下划线或为空：与后端一致，退回序号名而不是一串 ____
  if (!/[A-Za-z0-9]/.test(cleaned)) {
    return "import_table";
  }
  return /^[0-9]/.test(cleaned) ? `t_${cleaned}` : cleaned;
}

/** 加载当前库的表清单 */
async function loadTables(): Promise<void> {
  if (!database.value) {
    tableNames.value = [];
    return;
  }
  try {
    const list = await fetchDbTables(props.datasourceId, database.value);
    tableNames.value = (list ?? []).map(t => t.name);
  } catch (e) {
    tableNames.value = [];
    message.warning(`读取表清单失败：${String((e as Error)?.message ?? e)}`);
  }
}

/** 换库：重载表清单与列结构 */
async function onDatabaseChange(): Promise<void> {
  await loadTables();
  targetColumns.value = [];
  // 换库后原表名基本都不存在了：逐行重算「新建表」标记，别让上一库的勾留在这里。
  // 刻意不自动填「新库的第一张表」——那等于替用户选了一张无关的表。
  for (const row of targetRows.value) {
    row.createTable = !!row.targetTable && !tableNames.value.includes(row.targetTable);
  }
}

/**
 * 目标表切换：重新拉列结构。
 *
 * <p>只有第一行的表结构进第 5 步的映射候选 —— 多工作表时映射是共用的一份，
 * 跟着后面那几行变会让用户刚配好的映射凭空消失。</p>
 *
 * @param row 被改动的那一行
 */
async function onTargetTableChange(
  row?: { source: string; sheet: string; targetTable: string; createTable: boolean },
): Promise<void> {
  if (row) {
    // 手输的表名不在清单里 → 自动视为新建，省掉「先勾新建表」这一步
    row.createTable = !!row.targetTable && !tableNames.value.includes(row.targetTable);
  }
  if (row && targetRows.value[0] !== row) {
    return;
  }
  await loadTargetColumns();
  prefillMapping();
}

/** 「新建表」勾选框：勾上时按源列建议表名与列 */
async function onCreateTableToggle(
  row: { source: string; sheet: string; targetTable: string; createTable: boolean },
  checked: boolean,
): Promise<void> {
  row.createTable = checked;
  if (!checked) {
    return;
  }
  try {
    const plan = await planDbImportTable(preview.value?.columns ?? [], fileName.value);
    if (!row.targetTable || tableNames.value.includes(row.targetTable)) {
      row.targetTable = plan.tableName;
    }
  } catch (e) {
    message.warning(`生成建表建议失败：${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 加载目标表列结构。
 *
 * <p>「新建表」时目标表还不存在，列结构必然是空的，此时列候选改用源列名 ——
 * 否则第 5 步的下拉里一个选项都没有，用户无法配置映射。</p>
 */
async function loadTargetColumns(): Promise<void> {
  const table = currentTarget.value;
  if (!table || !database.value) {
    targetColumns.value = [];
    return;
  }
  if (targetRows.value[0]?.createTable) {
    targetColumns.value = (preview.value?.columns ?? []).map(name => ({
      name,
      type: "待建",
      size: 0,
      nullable: true,
      isPrimaryKey: false,
    }));
    return;
  }
  try {
    targetColumns.value = (await fetchTableColumns(table, props.datasourceId, database.value)) || [];
  } catch (e) {
    targetColumns.value = [];
    message.warning(`读取目标表结构失败：${String((e as Error)?.message ?? e)}`);
  }
}

/**
 * 按同名规则预填映射（已配置的不覆盖）。
 *
 * <p>整体替换数组而不是逐项赋值：{@code ReSelect} 的当前值在数组元素被就地改写时
 * 不会重算，表现为「下拉里有目标列、显示却仍是（不导入）」。</p>
 */
function prefillMapping(): void {
  const sources = preview.value?.columns ?? [];
  const targets = targetColumns.value.map(c => c.name);
  const previous = new Map(mappingRows.value.map(r => [r.source, r]));
  mappingRows.value = sources.map(source => {
    const prev = previous.get(source);
    if (prev) return prev;
    const hit = targets.find(c => c.toLowerCase() === String(source).trim().toLowerCase());
    const column = targetColumns.value.find(c => c.name === hit);
    return { source: String(source), target: hit ?? "", key: column?.isPrimaryKey ?? false };
  });
}

/** 勾选 / 取消主键列 */
function onKeyToggle(row: { key: boolean }, checked: boolean): void {
  row.key = checked;
}

/**
 * 执行导入（第 7 步）。
 *
 * <p>第 4 步可能有 N 行（Excel 多工作表），而 {@code import/run} 一次只吃一张表，
 * 所以这里按行串行发起，把统计累加到同一个 {@code run} 上。串行而不是并发：
 * 后端一个数据源只复用一条物理连接（TTL 内 close 是空操作），并发写会互相踩。</p>
 */
async function startImport(): Promise<void> {
  if (running.value) return;
  const jobs = targetRows.value.filter(r => r.targetTable.trim());
  if (!jobs.length) {
    message.warning("请在第 4 步选择或输入目标表");
    return;
  }
  const missing = targetRows.value.filter(r => !r.targetTable.trim());
  if (missing.length) {
    message.warning(`还有 ${missing.length} 行没有填目标表名`);
    return;
  }
  // 多张源表进同一张表是合法用法（追加/更新），只有「复制」会先清表——
  // 那时第 2 张会把第 1 张刚写进去的数据整表清掉，必须拦住
  if (mode.value === "copy" && duplicatedTargets.value) {
    message.warning(
      `「复制」会先清空目标表，多行指向同一张表 ${duplicatedTargets.value} 会让后面的表覆盖前面的结果，请改成不同的表名`,
    );
    return;
  }
  const mapping: Record<string, string> = {};
  for (const row of mappingRows.value) {
    if (row.target) mapping[row.source] = row.target;
  }
  if (!Object.keys(mapping).length) {
    message.warning("请在第 5 步至少配置一个字段映射");
    return;
  }
  if (mappingConflict.value) {
    message.warning(`字段映射有冲突：${mappingConflict.value}`);
    return;
  }
  const keyColumns = mappingRows.value.filter(r => r.key && r.target).map(r => r.target);
  if (modeNeedsKey.value && !keyColumns.length && !targetHasPrimaryKey.value) {
    message.warning(`「${modeLabel.value}」需要在第 5 步勾选主键，或先在目标表上设置主键`);
    return;
  }

  running.value = true;
  run.value = {
    done: 0,
    total: preview.value?.rowCount ?? 0,
    baseDone: 0,
    baseTotal: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
    errors: 0,
    elapsedMs: 0,
    finished: false,
    failed: false,
  };
  logLines.value = [];
  let succeeded = 0;
  let aborted = false;
  for (let index = 0; index < jobs.length; index += 1) {
    const job = jobs[index];
    if (jobs.length > 1) {
      appendLog(`—— 第 ${index + 1}/${jobs.length} 张：${job.source} → ${job.targetTable} ——`, "info");
    }
    const outcome = await runOne(job, mapping, keyColumns);
    if (outcome === "ok") {
      succeeded += 1;
    }
    if (outcome === "aborted") {
      // 用户关窗 / 中断：后面的表不再发起
      appendLog("导入已中断", "warn");
      aborted = true;
      break;
    }
    if (run.value.failed) {
      // 某张表整体失败（解析失败、建表失败等）：继续下一张没有意义
      break;
    }
  }
  running.value = false;
  abortRun = null;
  currentResolve = null;
  // 中断不算「跑完」：按钮要能再点一次，否则用户以为流程已经结束
  run.value.finished = !aborted;
  if (aborted) {
    return;
  }
  if (succeeded === jobs.length && run.value.errors === 0) {
    message.success(`导入完成：新增 ${run.value.inserted} 行`);
    emit("done", { table: jobs[0].targetTable, database: database.value });
  } else if (succeeded > 0) {
    message.warning(`导入完成 ${succeeded}/${jobs.length} 张表，错误 ${run.value.errors} 行，见日志`);
  }
}

/** 多行指向同一张表时的表名（空串表示没有冲突） */
const duplicatedTargets = computed(() => {
  const seen = new Set<string>();
  for (const row of targetRows.value) {
    const name = row.targetTable.trim().toLowerCase();
    if (!name) continue;
    if (seen.has(name)) return row.targetTable.trim();
    seen.add(name);
  }
  return "";
});

/**
 * 导入一张表，返回结果。
 *
 * <p>用 Promise 把 SSE 回调包起来，串行循环才能「等这张跑完再跑下一张」。</p>
 *
 * @param job        第 4 步的一行
 * @param mapping    字段映射
 * @param keyColumns 键列
 * @returns ok=成功；failed=整体失败；aborted=被中断
 */
function runOne(
  job: { source: string; sheet: string; targetTable: string; createTable: boolean },
  mapping: Record<string, string>,
  keyColumns: string[],
): Promise<"ok" | "failed" | "aborted"> {
  return new Promise(resolve => {
    const table = job.targetTable.trim();
    const sheetName = type.value === "excel" ? job.sheet || undefined : undefined;
    let settled = false;
    const settle = (result: "ok" | "failed" | "aborted") => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    currentResolve = () => settle("aborted");
    appendLog(`开始导入 ${database.value}.${table}`, "info");
    const options = {
      ...sourceOptions(),
      sheetName,
      database: database.value,
      tableName: table,
      columnMapping: mapping,
      mode: mode.value,
      keyColumns,
      createTable: job.createTable,
      truncateFirst: mode.value === "copy",
      batchSize: batchSize.value,
      datasourceId: props.datasourceId,
      extendedInsert: advanced.value.extendedInsert,
      maxStatementKb: advanced.value.maxStatementKb,
      nullForEmpty: advanced.value.nullForEmpty,
      ignoreForeignKey: advanced.value.ignoreForeignKey,
      continueOnError: advanced.value.continueOnError,
    };
    const client = runDbImport(options, {
      onEvent: event => {
        switch (event.type) {
          case "phase":
            appendLog(event.message, "info");
            break;
          case "progress":
            // 进度是「当前这张表」的，跨表时累加已完成的量
            run.value.done = run.value.baseDone + (event.done ?? 0);
            run.value.total = run.value.baseTotal + (event.total || 0);
            break;
          case "log":
            // 逐行错误只在日志里留痕，计数统一用 done 事件里的 errors：
            // 两边都加会让「错误」列的数值翻倍
            appendLog(`第 ${event.no} 行失败：${event.error}`, "error");
            break;
          case "error":
            run.value.failed = true;
            appendLog(`导入失败：${event.message}`, "error");
            message.error(event.message || "导入失败");
            settle("failed");
            break;
          case "done":
            run.value.inserted += event.inserted ?? 0;
            run.value.updated += event.updated ?? 0;
            run.value.skipped += event.skipped ?? 0;
            run.value.deleted += event.deleted ?? 0;
            run.value.errors += event.errors ?? 0;
            run.value.elapsedMs += event.elapsedMs ?? 0;
            run.value.baseDone += event.total || 0;
            run.value.baseTotal += event.total || 0;
            run.value.done = run.value.baseDone;
            run.value.total = run.value.baseTotal;
            appendLog(
              `完成 ${table}：新增 ${event.inserted}，更新 ${event.updated}，删除 ${event.deleted}，`
                + `跳过 ${event.skipped}，错误 ${event.errors}，耗时 ${event.elapsedMs} ms`,
              (event.errors ?? 0) > 0 || event.failed ? "warn" : "ok",
            );
            for (const detail of event.errorDetails ?? []) {
              appendLog(detail, "error");
            }
            if (event.failed) {
              run.value.failed = true;
              settle("failed");
            } else {
              settle("ok");
            }
            break;
          default:
            break;
        }
      },
      onError: msg => {
        run.value.failed = true;
        appendLog(msg, "error");
        message.error(msg);
        settle("failed");
      },
    });
    // runDbImport 返回的是 SSE 客户端，不是关闭函数：
    // 包一层再存，中断时调 close() 即可，避免把客户端实例当函数调用
    abortRun = () => client.close();
  });
}

/**
 * 追加一行日志并滚到底。
 *
 * @param text 日志文本
 * @param tone 语气：ok / warn / error / info
 */
function appendLog(text: string, tone: string): void {
  const now = new Date();
  const at = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
  logLines.value = [...logLines.value, { at, text, tone }];
  void nextTick(() => {
    if (logBox.value) {
      logBox.value.scrollTop = logBox.value.scrollHeight;
    }
  });
}

/** 保存日志到本地文件 */
function saveLog(): void {
  const content = logLines.value.map(l => `[${l.at}] ${l.text}`).join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `import-${currentTarget.value || "log"}-${Date.now()}.log`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 复制日志到剪贴板 */
async function copyLog(): Promise<void> {
  const content = logLines.value.map(l => `[${l.at}] ${l.text}`).join("\n");
  try {
    await navigator.clipboard.writeText(content);
    message.success("日志已复制");
  } catch {
    message.warning("复制失败，请用「保存日志」");
  }
}

/**
 * 打开向导时重置全部状态。
 *
 * <p>不能只重置 {@code step}：上一次导入的文件名、映射、日志都会残留，
 * 用户会看到「新向导里已经有上次的 40 行日志」。</p>
 */
watch(visible, open => {
  if (!open) {
    return;
  }
  step.value = 0;
  type.value = "csv";
  fileName.value = "";
  fileSize.value = 0;
  encoding.value = "AUTO";
  preview.value = null;
  sheets.value = [];
  selectedSheets.value = [];
  activeSheet.value = "";
  recordDelimiter.value = "CRLF";
  delimiter.value = ",";
  textQualifier.value = '"';
  decimalSymbol.value = ".";
  fieldNamesLine.value = 1;
  firstDataLine.value = 2;
  lastDataLine.value = 0;
  dateOrder.value = "YMD";
  dateTimeOrder.value = "YMD";
  dateSeparator.value = "/";
  yearSeparator.value = "/";
  timeSeparator.value = ":";
  database.value = props.database ?? "";
  targetRows.value = [];
  targetColumns.value = [];
  mappingRows.value = [];
  mode.value = "append";
  batchSize.value = 500;
  advanced.value = { ...DB_IMPORT_ADVANCED_DEFAULTS };
  logLines.value = [];
  run.value = {
    done: 0,
    total: 0,
    baseDone: 0,
    baseTotal: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
    errors: 0,
    elapsedMs: 0,
    finished: false,
    failed: false,
  };
});

/** 切换类型时清空已解析结果（列结构完全不同） */
watch(type, () => {
  clearFile();
  fieldNamesLine.value = 1;
  firstDataLine.value = 2;
  lastDataLine.value = 0;
});

/**
 * 表头行改成 0（没有表头）时，第一个数据行必须回到 1。
 *
 * <p>两者独立可编辑，但默认值是「表头 1 / 数据 2」。用户把表头关掉却不动数据行，
 * 第 1 行就会被静默丢掉——这是最难被发现的一类导入错误。</p>
 */
watch(fieldNamesLine, value => {
  if (value <= 0) {
    firstDataLine.value = 1;
  } else if (firstDataLine.value <= value) {
    firstDataLine.value = value + 1;
  }
});

/**
 * 改编码后立刻按新编码重解析。
 *
 * <p>编码错了看到的预览就是一屏乱码，用户不会去点「重新解析」——
 * 他们只会认定「这个导入坏了」。选择框变化本身不频繁，一次请求可以接受。</p>
 */
watch(encoding, () => {
  if (preview.value?.token) {
    void reparse();
  }
});
</script>

<style scoped>
/* ---------- 步骤条：与同步向导同款（圆序号 + 连接线 + 标题/说明） ---------- */
.iw-steps {
  display: flex;
  align-items: flex-start;
  flex: none;
  padding: 4px 0 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.iw-step {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.iw-step-line {
  position: absolute;
  top: 14px;
  left: calc(50% + 19px);
  right: calc(-50% + 19px);
  height: 2px;
  border-radius: 1px;
  background: var(--el-border-color-lighter);
}
.iw-step.is-done .iw-step-line { background: var(--el-color-primary); }
.iw-step-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 2px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
}
.iw-step.is-on .iw-step-dot {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.iw-step.is-done .iw-step-dot {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.iw-step-labels {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
  min-width: 0;
}
.iw-step-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}
.iw-step.is-on .iw-step-title { color: var(--el-color-primary); }
.iw-step-desc {
  font-size: 11px;
  color: var(--text-placeholder);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.iw-step-desc.is-summary { color: var(--text-secondary); }

/* ---------- 主体 ---------- */
.iw-body {
  min-height: 380px;
  max-height: 58vh;
  overflow-y: auto;
  padding: 14px 2px;
}
.iw-pane { display: flex; flex-direction: column; gap: 12px; }
.iw-lead {
  margin: 0;
  font-size: 13px;
  color: var(--text-primary);
}
.iw-hint {
  font-size: 12px;
  color: var(--text-placeholder);
}
.iw-label {
  font-size: 12px;
  color: var(--text-secondary);
  flex: none;
  min-width: 56px;
}
.iw-static {
  font-size: 13px;
  color: var(--text-primary);
}
.iw-spacer { flex: 1; }
.iw-mono { font-family: var(--font-mono, monospace); font-size: 12px; }
.iw-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.iw-row--top { align-items: flex-start; }

/* ---------- 第 1 步：类型 ---------- */
.iw-types { display: flex; flex-direction: column; gap: 8px; }
.iw-type {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--bg-container);
  text-align: left;
  cursor: pointer;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s),
    background var(--el-transition-duration-fast, 0.2s);
}
.iw-type:hover { border-color: var(--el-color-primary-light-5); }
.iw-type.is-on {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.iw-type-radio {
  flex: none;
  width: 14px;
  height: 14px;
  margin-top: 2px;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
}
.iw-type.is-on .iw-type-radio {
  border: 4px solid var(--el-color-primary);
}
.iw-type-body { display: flex; flex-direction: column; gap: 2px; }
.iw-type-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.iw-type-hint { font-size: 12px; color: var(--text-placeholder); }

/* ---------- 第 2 步：文件 ---------- */
.iw-file-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--bg-container);
}
.iw-file-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
}
.iw-file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.iw-file-size { font-size: 12px; color: var(--text-placeholder); }
.iw-file-del { cursor: pointer; color: var(--text-placeholder); }
.iw-file-del:hover { color: var(--el-color-danger); }
.iw-file-empty { font-size: 13px; color: var(--text-placeholder); }
.iw-file-actions { display: flex; gap: 8px; }
.iw-file-input { display: none; }

.iw-sheet-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
  max-height: 180px;
  overflow-y: auto;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  background: var(--bg-container);
}
.iw-sheet-actions { display: flex; gap: 8px; padding-bottom: 6px; }
.iw-sheet {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}

.iw-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--text-secondary);
}
.iw-tag {
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--bg-container);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 11px;
  color: var(--text-secondary);
}
.iw-table-wrap {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
}

.iw-note {
  margin: 0;
  padding: 8px 10px;
  border-radius: var(--el-radius-md, 8px);
  font-size: 12px;
  line-height: 1.6;
}
.iw-note.is-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
}
.iw-note.is-error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* ---------- 第 3 步：附加选项 ---------- */
.iw-field-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.iw-field { display: flex; flex-direction: column; gap: 4px; }
.iw-field-label { font-size: 12px; color: var(--text-secondary); }
.iw-field-hint { font-size: 11px; color: var(--text-placeholder); }
.iw-section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.iw-actions { display: flex; gap: 8px; }

/* ---------- 第 6 步：模式 ---------- */
.iw-modes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px;
}
.iw-mode {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  background: var(--bg-container);
  cursor: pointer;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s),
    background var(--el-transition-duration-fast, 0.2s);
}
.iw-mode:has(input:checked) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.iw-mode-body { display: flex; flex-direction: column; gap: 2px; }
.iw-mode-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.iw-mode-hint { font-size: 11px; color: var(--text-placeholder); }

/* ---------- 第 7 步：执行 ---------- */
.iw-run-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 8px;
}
.iw-stat-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--bg-container);
}
.iw-stat-label { font-size: 11px; color: var(--text-placeholder); }
.iw-stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.iw-stat-value.is-bad { color: var(--el-color-danger); }

.iw-progress {
  height: 6px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-border-color-lighter);
  overflow: hidden;
}
.iw-progress-bar {
  height: 100%;
  background: var(--el-color-primary);
  transition: width 0.2s ease;
}

.iw-log-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.iw-log {
  height: 190px;
  overflow-y: auto;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--code-background, var(--bg-container));
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  line-height: 1.7;
}
.iw-log-line { display: flex; gap: 8px; }
.iw-log-time { flex: none; color: var(--text-placeholder); }
.iw-log-text { flex: 1; min-width: 0; word-break: break-all; color: var(--code-foreground, var(--text-primary)); }
.iw-log-line.is-error .iw-log-text { color: var(--el-color-danger); }
.iw-log-line.is-warn .iw-log-text { color: var(--el-color-warning-dark-2); }
.iw-log-line.is-ok .iw-log-text { color: var(--el-color-success); }
.iw-log-empty { color: var(--text-placeholder); }

/* ---------- 高级选项 ---------- */
.iw-adv { display: flex; flex-direction: column; gap: 12px; }
.iw-adv-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}
.iw-adv-item--stack { flex-direction: column; align-items: flex-start; gap: 6px; }
.iw-adv-name { font-weight: 600; }
.iw-adv-hint { display: block; font-size: 11px; color: var(--text-placeholder); }
.iw-adv-inline { display: flex; align-items: center; gap: 6px; }
.iw-adv-unit { font-size: 12px; color: var(--text-secondary); }

/* ---------- 底部 ---------- */
.iw-footer { display: flex; align-items: center; gap: 8px; width: 100%; }

@media (max-width: 720px) {
  .iw-step-title { font-size: 11px; }
  .iw-step-desc { display: none; }
  .iw-body { max-height: 62vh; }
}
</style>
