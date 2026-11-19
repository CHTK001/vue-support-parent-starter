<template>
  <!--
    人脸底库管理（系统设置 → 底库 → 人脸底库）

    版面与「图像底库」保持一致：页头 + 统计卡 + 拖放区 + 列表区（工具栏 / 网格 / 列表 / 翻页）
    + 批量操作条 + 底栏。样式与图像底库**同源**（components/setting/library-panel.css），
    改动样式只改那一份，两个面板一起生效，不会漂移。

    与图像底库的差异只有「业务动作」：
      · 图像底库的拖放区直接把图上传入库；人脸登记需要档案字段（姓名/身份证等，身份证为必填），
        所以拖放区改为**打开登记弹窗**，视觉与交互形态保持与图像底库一致。
      · 状态筛选按「有图片 / 无图片」分（有图 = 服务端登记图或本机缩略图；图像底库按 hasOriginal）。

    数据来源：服务端 GET /v2/face/list 是**权威**（跨浏览器/账号以它为准），
    登记图由服务端落存（GET /v2/face/{id}/image），本机缩略图只作优先展示；按 id 合并，服务端优先。
  -->
  <div class="lib-page">
    <!-- ── 页头 ───────────────────────────────────────────── -->
    <header class="lib-head">
      <div class="lib-head-text">
        <h2 class="lib-head-title">人脸底库</h2>
        <p class="lib-head-sub">当前账号的人脸底库，登记后可用于 1:N 人脸识别与检索</p>
      </div>
      <div class="lib-head-actions">
        <!--
          隐私显示开关（默认关闭 = 全部不预览）。
          人脸属敏感个人信息，且底库常在投屏/录屏演示场景下打开；
          以前缩略图无条件渲染，只做了身份证脱敏，图是完全敞开的。
        -->
        <el-switch v-model="showFaces" inline-prompt active-text="显示" inactive-text="隐藏"
          class="lib-privacy-switch">
          <template #active><el-icon><View /></el-icon></template>
          <template #inactive><el-icon><Hide /></el-icon></template>
        </el-switch>
        <span class="lib-privacy-hint">{{ showFaces ? '人脸图已显示' : '人脸图已隐藏' }}</span>
        <el-button :disabled="loading" @click="load(page)">
          <el-icon><Refresh /></el-icon>刷新
        </el-button>
        <el-button type="primary" :disabled="loading || !canEnroll" @click="openEnroll">
          <el-icon><Upload /></el-icon>人脸登记入库
        </el-button>
        <el-button :disabled="loading || !canEnroll" title="一次拖入多张人脸照片，文件名作为姓名批量登记"
          @click="openBatchImport">
          <el-icon><Files /></el-icon>批量导入
        </el-button>
        <!-- 登记前查重：先用待登记照片做一次 1:N 检索，≥ 阈值的命中按「疑似重复」警示 -->
        <el-button :disabled="loading || !canEnroll" title="登记前先查重：与当前分组已登记人脸比对，避免同一人重复入库"
          @click="openDupCheck">
          <el-icon><Search /></el-icon>登记查重
        </el-button>
        <!-- 1:1 比对：两张照片走后端 compare，给出相似度与是否同一人 -->
        <el-button :disabled="loading || !canEnroll" title="两张人脸照片做 1:1 比对，验证是否同一人" @click="openCompare">
          <el-icon><Switch /></el-icon>1:1 比对
        </el-button>
      </div>
    </header>

    <!--
      统计（行内迷你口径：来自服务端 stats，不受检索/筛选影响）。
      前三格可点：按对应口径切换状态筛选（与工具栏下拉同一状态源，再点一次取消）。
      「身份证已填」后端列表接口没有对应筛选参数，保持纯展示，不做假筛选。
    -->
    <div class="fl07-metrics">
      <button type="button" class="fl07-metric" :class="{ 'is-on': statusFilter === 'all' }"
        :aria-pressed="statusFilter === 'all' ? 'true' : 'false'" title="已登记总数 · 点击查看全部"
        @click="filterByMetric('all')">
        已登记 <b>{{ stats.total }}</b>
      </button>
      <button type="button" class="fl07-metric" :class="{ 'is-on': statusFilter === 'thumb' }"
        :aria-pressed="statusFilter === 'thumb' ? 'true' : 'false'" title="点击只看有图片的条目"
        @click="filterByMetric('thumb')">
        有图片 <b>{{ stats.withImage }}</b>
      </button>
      <button type="button" class="fl07-metric" :class="{ 'is-on': statusFilter === 'noThumb' }"
        :aria-pressed="statusFilter === 'noThumb' ? 'true' : 'false'" title="点击只看无图片的条目"
        @click="filterByMetric('noThumb')">
        无图片 <b>{{ stats.total - stats.withImage }}</b>
      </button>
      <span class="fl07-metric is-static" title="身份证已填的条目数（仅统计）">
        身份证已填 <b>{{ stats.withIdCard }}</b>
      </span>
    </div>

    <!-- 服务端有条目、但两边都没图：说清原因，别让人以为底库丢了 -->
    <el-alert
      v-if="stats.total - stats.withImage > 0"
      class="fl-alert"
      type="info"
      :closable="false"
      show-icon
      :title="`有 ${stats.total - stats.withImage} 条没有人脸图`"
      description="图片优先取服务端登记图（登记时落存的裁剪脸，换浏览器也在）；改造前登记的老数据两边都没有。底库条目本身以服务端为准，1:N 识别不受影响。"
    />

    <!-- ── 登记入口已收敛到页头「人脸登记入库」按钮，此处不再放大卡 ── -->

    <FaceEnrollDialog v-model="enrollVisible" :record="editItem" :group="group" @enrolled="() => load(page)" />

    <!-- 特征点弹窗：仅在关键点模型已配置时按钮可见（openLandmark 里还有一道守卫） -->
    <FaceLandmarkDialog
      v-model="lmVisible"
      :face-id="lmItem?.id ?? ''"
      :face-name="lmItem?.name"
      :fallback-thumb="lmItem?.localThumb"
      :group="group"
    />

    <!-- ── 以图搜人（1:N 检索）：命中按相似度排序，点行直接点亮右侧档案抽屉 ── -->
    <ReDialog v-model="searchVisible" title="以图搜人（1:N 检索）" width="560px" append-to-body
      :close-on-click-modal="false" class="fl-search-dialog">
      <!-- tabindex=-1：点击后让拖拽区拿到焦点，Ctrl+V 的 paste 事件才会派发到 @paste 上 -->
      <div class="fl-search-drop" :class="{ 'is-dragover': searchDragover }" tabindex="-1" @click="pickSearchFile"
        @dragover.prevent="searchDragover = true" @dragleave.prevent="searchDragover = false"
        @drop.prevent="onSearchDrop" @paste="onSearchPaste">
        <img v-if="searchPreviewUrl" :src="searchPreviewUrl" class="fl-search-preview" alt="待检索人脸" />
        <template v-else>
          <el-icon :size="26"><Search /></el-icon>
          <span>点击选择、拖入，或直接 Ctrl+V 粘贴剪贴板图片<br />检索范围：{{ searchScope === 'all' ? '全部分组' : `当前分组「${group}」` }}</span>
        </template>
        <span v-if="searchFile" class="fl-search-clear" title="清除照片" @click.stop="clearSearchFile">
          <el-icon><Close /></el-icon>
        </span>
      </div>
      <input ref="searchInputRef" type="file" accept="image/*" class="fl-file-input" @change="onSearchPicked" />
      <div class="fl-search-bar">
        <el-button type="primary" :loading="searching" :disabled="!searchFile || searching" @click="runSearch">
          <el-icon><Search /></el-icon>开始检索
        </el-button>
        <span class="fl-search-hint">与登记同一条特征管线；命中即可查看档案</span>
      </div>

      <!-- 检索范围 + 相似度阈值 + 命中导出：范围变化会自动按新范围重查 -->
      <div class="fl-search-opts">
        <span class="fl-opt-label">检索范围</span>
        <el-radio-group v-model="searchScope" size="small" :disabled="searching">
          <el-radio-button value="current">当前分组</el-radio-button>
          <el-radio-button value="all">全部分组</el-radio-button>
        </el-radio-group>
        <span class="fl-opt-label">相似度阈值</span>
        <el-slider v-model="searchMinScorePct" :min="0" :max="100" :step="1" class="fl-threshold-slider"
          title="低于该相似度的命中将被隐藏（不影响后端检索）" />
        <span class="fl-opt-value">≥ {{ searchMinScorePct }}%</span>
        <el-button size="small" :disabled="!searchHitsView.length" @click="exportSearchHits">
          <el-icon><Download /></el-icon>导出命中
        </el-button>
      </div>

      <template v-if="searchResult">
        <el-alert v-if="!searchResult.hits.length" class="fl-search-empty" type="info" :closable="false" show-icon
          title="没有命中任何人脸"
          description="换一张更清晰的正面照再试，或确认该人已登记在当前分组。" />
        <template v-else>
          <el-alert v-if="!searchHitsView.length" class="fl-search-empty" type="warning" :closable="false" show-icon
            :title="`有 ${searchHits.length} 条命中，但都低于当前阈值 ${searchMinScorePct}%`"
            description="调低相似度阈值即可看到这些较弱命中。" />
          <div v-else class="fl-search-head">
            <span>命中 {{ searchHitsView.length }} / {{ searchHits.length }} 条（按相似度降序）</span>
            <span v-if="searchResult.bestScore != null" class="fl-search-best">
              最佳 {{ formatScore(searchResult.bestScore) }}
            </span>
          </div>
          <div v-if="searchHitsView.length" class="fl-search-list">
            <button v-for="(h, i) in searchHitsView" :key="h.id" type="button" class="fl-search-hit"
              :title="`打开「${h.name || h.id}」的档案`" @click="activateHit(h)">
              <span class="fl-hit-rank">{{ i + 1 }}</span>
              <img v-if="showFaces && !isThumbBroken(h.id)" class="fl-hit-thumb" :src="h.thumb" :alt="h.name"
                loading="lazy" @error="markThumbBroken(h.id)" />
              <span v-else class="fl-hit-thumb fl-thumb-fallback">
                <el-icon><Hide v-if="!showFaces" /><Warning v-else /></el-icon>
              </span>
              <span class="fl-hit-name">{{ h.name || '未命名' }}</span>
              <span class="fl-hit-id">{{ maskIdCard(h.idCard) || '—' }}</span>
              <span class="fl-hit-score">{{ formatScore(h.score) }}</span>
            </button>
          </div>
        </template>
      </template>
    </ReDialog>

    <!-- ── 登记查重：待登记照片先做一次 1:N 检索，达到阈值的命中按「疑似重复」警示 ── -->
    <ReDialog v-model="dupVisible" title="登记查重（疑似重复人脸）" width="560px" append-to-body
      :close-on-click-modal="false" class="fl-dup-dialog">
      <div class="fl-search-drop" :class="{ 'is-dragover': dupDragover }" tabindex="-1" @click="pickDupFile"
        @dragover.prevent="dupDragover = true" @dragleave.prevent="dupDragover = false" @drop.prevent="onDupDrop"
        @paste="onDupPaste">
        <img v-if="dupPreviewUrl" :src="dupPreviewUrl" class="fl-search-preview" alt="待查重人脸" />
        <template v-else>
          <el-icon :size="26"><Search /></el-icon>
          <span>点击选择、拖入，或 Ctrl+V 粘贴待登记的人脸照片<br />将与{{ dupScope === 'all' ? '全部分组' : `当前分组「${group}」` }}已登记人脸比对</span>
        </template>
        <span v-if="dupFile" class="fl-search-clear" title="清除照片" @click.stop="clearDupFile">
          <el-icon><Close /></el-icon>
        </span>
      </div>
      <input ref="dupInputRef" type="file" accept="image/*" class="fl-file-input" @change="onDupPicked" />
      <div class="fl-search-opts">
        <span class="fl-opt-label">比对范围</span>
        <el-radio-group v-model="dupScope" size="small" :disabled="dupChecking">
          <el-radio-button value="current">当前分组</el-radio-button>
          <el-radio-button value="all">全部分组</el-radio-button>
        </el-radio-group>
        <span class="fl-search-hint">相似度 ≥ {{ dupThresholdPct }}% 视为疑似重复</span>
      </div>
      <div class="fl-search-bar">
        <el-button type="primary" :loading="dupChecking" :disabled="!dupFile || dupChecking" @click="runDupCheck">
          <el-icon><Search /></el-icon>开始查重
        </el-button>
        <span class="fl-search-hint">登记前先查重，避免同一人重复入库</span>
      </div>
      <template v-if="dupResult">
        <el-alert v-if="!dupHits.length" class="fl-search-empty" type="success" :closable="false" show-icon
          title="未发现疑似重复" description="比对范围内没有相似度达到阈值的人脸，可以登记。" />
        <template v-else>
          <el-alert class="fl-search-empty" type="warning" :closable="false" show-icon
            :title="`发现 ${dupHits.length} 条疑似重复（相似度 ≥ ${dupThresholdPct}%）`"
            description="请先确认是否为同一人；点击命中可打开档案核对。" />
          <div class="fl-search-list">
            <button v-for="(h, i) in dupHits" :key="h.id" type="button" class="fl-search-hit"
              :title="`打开「${h.name || h.id}」的档案`" @click="activateHit(h)">
              <span class="fl-hit-rank">{{ i + 1 }}</span>
              <img v-if="showFaces && !isThumbBroken(h.id)" class="fl-hit-thumb" :src="h.thumb" :alt="h.name"
                loading="lazy" @error="markThumbBroken(h.id)" />
              <span v-else class="fl-hit-thumb fl-thumb-fallback">
                <el-icon><Hide v-if="!showFaces" /><Warning v-else /></el-icon>
              </span>
              <span class="fl-hit-name">{{ h.name || '未命名' }}</span>
              <span class="fl-hit-id">{{ maskIdCard(h.idCard) || '—' }}</span>
              <span class="fl-hit-score">{{ formatScore(h.score) }}</span>
            </button>
          </div>
        </template>
      </template>
    </ReDialog>

    <!-- ── 1:1 比对：两张照片各检测一张人脸，走后端 compare 给出相似度与结论 ── -->
    <ReDialog v-model="cmpVisible" title="1:1 人脸比对" width="620px" append-to-body
      :close-on-click-modal="false" class="fl-cmp-dialog">
      <div class="fl-cmp-row">
        <div v-for="(slot, si) in cmpSlots" :key="si" class="fl-cmp-slot">
          <p class="fl-cmp-label">{{ si === 0 ? '照片 A' : '照片 B' }}</p>
          <div class="fl-search-drop" :class="{ 'is-dragover': slot.dragover }" tabindex="-1" @click="pickCmpFile(si)"
            @dragover.prevent="slot.dragover = true" @dragleave.prevent="slot.dragover = false"
            @drop.prevent="onCmpDrop($event, si)" @paste="onCmpPaste($event, si)">
            <img v-if="slot.previewUrl" :src="slot.previewUrl" class="fl-search-preview" :alt="`待比对照片 ${si + 1}`" />
            <template v-else>
              <el-icon :size="22"><Plus /></el-icon>
              <span>点击选择、拖入<br />或 Ctrl+V 粘贴</span>
            </template>
            <span v-if="slot.file" class="fl-search-clear" title="清除照片" @click.stop="clearCmpFile(si)">
              <el-icon><Close /></el-icon>
            </span>
          </div>
          <input :ref="(el) => setCmpInput(el, si)" type="file" accept="image/*" class="fl-file-input"
            @change="onCmpPicked($event, si)" />
        </div>
      </div>
      <div class="fl-search-bar">
        <el-button type="primary" :loading="cmpChecking"
          :disabled="!cmpSlots[0]?.file || !cmpSlots[1]?.file || cmpChecking" @click="runCompare">
          <el-icon><Switch /></el-icon>开始比对
        </el-button>
        <span class="fl-search-hint">两张照片各检测一张人脸后做 1:1 特征比对</span>
      </div>
      <el-alert v-if="cmpError" class="fl-search-empty" type="error" :closable="false" show-icon :title="cmpError" />
      <div v-if="cmpResult" class="fl-cmp-result" :class="cmpResult.matched ? 'is-match' : 'is-mismatch'">
        <span class="fl-cmp-score">{{ formatScore(cmpResult.similarity) }}</span>
        <span class="fl-cmp-verdict">
          {{ cmpResult.matched ? '判定为同一人' : '判定为不同人' }}
          <small>（后端 matched={{ cmpResult.matched }}）</small>
        </span>
      </div>
    </ReDialog>

    <!-- ── 批量导入：多图按文件名映射姓名，逐张走登记管线，带进度与失败明细 ── -->
    <ReDialog v-model="batchVisible" title="批量导入人脸" width="600px" append-to-body
      :close-on-click-modal="false" class="fl-batch-dialog">
      <div class="fl-batch-drop" :class="{ 'is-dragover': batchDragover }" @click="pickBatchFiles"
        @dragover.prevent="batchDragover = true" @dragleave.prevent="batchDragover = false"
        @drop.prevent="onBatchDrop">
        <el-icon :size="26"><Files /></el-icon>
        <span>点击选择或拖入多张人脸照片<br />文件名将作为登记姓名（「张三.jpg」→ 张三），身份证等字段留空后续补录</span>
      </div>
      <input ref="batchInputRef" type="file" multiple accept="image/*" class="fl-file-input" @change="onBatchPicked" />
      <ul v-if="batchFiles.length" class="fl-batch-list">
        <li v-for="(f, i) in batchFiles" :key="f.key" class="fl-batch-item">
          <span class="fl-batch-name" :title="f.file.name">{{ f.name }}</span>
          <span class="fl-batch-size">{{ formatBytes(f.file.size) }}</span>
          <span class="fl-batch-state" :class="`is-${f.status}`">
            {{ f.status === 'ok' ? '成功' : f.status === 'fail' ? '失败' : f.status === 'running' ? '登记中' : '待处理' }}
          </span>
          <span v-if="f.error" class="fl-batch-error" :title="f.error">{{ f.error }}</span>
          <button v-if="f.status === 'pending'" type="button" class="fl-batch-remove" title="从列表移除"
            :disabled="batchRunning" @click="removeBatchFile(i)">
            <el-icon><Close /></el-icon>
          </button>
        </li>
      </ul>
      <el-progress v-if="batchRunning || batchDoneCount > 0" class="fl-batch-progress" :percentage="batchPercent"
        :stroke-width="8" />
      <div class="fl-batch-bar">
        <el-button type="primary" :loading="batchRunning" :disabled="!batchFiles.length || batchRunning"
          @click="runBatchImport">
          开始导入（{{ batchFiles.length }} 张）
        </el-button>
        <el-button v-if="!batchRunning" :disabled="!batchFiles.length" @click="batchFiles = []">清空列表</el-button>
        <span class="fl-search-hint">逐张走「检测 → 特征 → 入库」管线，量大时请耐心等待；单张失败不影响其余</span>
      </div>
    </ReDialog>

    <!-- ── 批量移动分组：目标组用同一 id 与登记图重新入库，成功后才删本组记录 ── -->
    <ReDialog v-model="moveVisible" title="移动到其他分组" width="440px" append-to-body
      :close-on-click-modal="false" class="fl-move-dialog">
      <p class="fl-move-tip">
        把勾选的 <b>{{ selected.size }}</b> 条从「{{ group }}」移动到目标分组：
        在目标分组重新登记（复用登记图与档案元数据），确认入库成功后才删除本组记录；
        目标组登记失败的条目会保持原状。
      </p>
      <el-select v-model="moveTarget" filterable allow-create default-first-option placeholder="选择或输入目标分组"
        class="fl-move-select">
        <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" :disabled="g === group" />
      </el-select>
      <el-progress v-if="moving" class="fl-batch-progress" :percentage="movePercent" :stroke-width="8" />
      <template #footer>
        <el-button @click="moveVisible = false">取消</el-button>
        <el-button type="primary" :loading="moving" :disabled="moving || !moveTarget.trim()" @click="moveSelected">
          开始移动
        </el-button>
      </template>
    </ReDialog>

    <!-- ── 分组页签（07 方向：分组 = 顶部横向 Tabs，带人数角标）── -->
    <div class="fl07-tabs" role="tablist" aria-label="人脸底库分组">
      <button
        v-for="g in groupOptions"
        :key="g"
        type="button"
        role="tab"
        class="fl07-tab"
        :class="{ 'is-active': g === group }"
        :aria-selected="g === group ? 'true' : 'false'"
        @click="group = g"
        :title="`分组是第一层隔离：不同分组各有一套人脸库`"
      >
        {{ g }}
        <span class="fl07-tab-count">{{ g === group ? total : '' }}</span>
      </button>
      <el-select
        v-model="group"
        class="fl07-add-tab"
        filterable
        allow-create
        default-first-option
        placeholder="＋ 分组"
        title="输入新分组名立即创建（登记落进去即存在）"
      >
        <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
      </el-select>
    </div>

        <!-- ── 列表区 ─────────────────────────────────────────── -->
    <section class="lib-panel">
      <div class="lib-toolbar">
        <div class="lib-panel-title">
          人脸列表
          <span class="lib-panel-count">共 {{ total }} 条</span>
        </div>

        <el-input v-model="keyword" placeholder="按姓名/身份证检索（服务端）" clearable class="lib-search"
          @input="commitKeyword()" @keyup.enter="commitKeyword(true)" @clear="commitKeyword(true)">
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select v-model="statusFilter" class="lib-filter" @change="load(1)">
          <el-option label="全部状态" value="all" />
          <el-option label="有图片" value="thumb" />
          <el-option label="无图片" value="noThumb" />
        </el-select>

        <div class="lib-view-toggle">
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'grid' }"
            title="网格视图" @click="viewMode = 'grid'">
            <el-icon><Grid /></el-icon>
          </button>
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'list' }"
            title="列表视图" @click="viewMode = 'list'">
            <el-icon><Menu /></el-icon>
          </button>
          <button type="button" class="lib-view-btn" :class="{ 'is-active': viewMode === 'table' }"
            title="表格视图（服务端分页/排序，适合大量条目）" @click="viewMode = 'table'">
            <el-icon><Tickets /></el-icon>
          </button>
        </div>

        <!-- 以图搜人：上传一张脸走后端 1:N 检索，命中按相似度排序，可一键打开档案 -->
        <el-button class="lib-search-face" :disabled="loading" @click="openSearch">
          <el-icon><Search /></el-icon>以图搜人
        </el-button>

        <!-- 导出台账：按当前分组 + 检索词 + 状态筛选拉全量，前端生成 CSV 下载 -->
        <el-button class="lib-export" :loading="exporting" :disabled="exporting" @click="exportLedger">
          <el-icon><Download /></el-icon>导出台账
        </el-button>
      </div>

      <!-- 网格视图：viewerjs 挂在本容器上，点任意图即可缩放/左右切换 -->
      <div v-if="viewMode === 'grid'" ref="gridRef" v-loading="loading" class="lib-grid">
        <figure v-for="item in visibleItems" :key="item.id" class="lib-cell"
          :class="{ 'is-selected': selected.has(item.id), 'is-active': isActive(item) }"
          @click="activate(item)">
          <div class="lib-thumb">
            <!-- 悬浮放大：hover 出 160px 大图；点击仍走 viewerjs 全屏（data-face-id 供其定位） -->
            <el-popover v-if="thumbVisible(item) && !isThumbBroken(item.id)" trigger="hover" placement="right"
              :width="172" :show-arrow="true">
              <template #reference>
                <img :src="item.thumb" :alt="item.name" loading="lazy" :data-face-id="item.id"
                  @error="markThumbBroken(item.id)" />
              </template>
              <img class="fl-zoom-img" :src="thumbFor(item.id)" alt="" loading="lazy" />
            </el-popover>
            <div v-else class="fl-thumb-fallback">
              <el-icon :size="26"><Hide v-if="!showFaces" /><UserFilled v-else /></el-icon>
            </div>

            <span class="lib-check" @click.stop="toggleSelect(item)">
              <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
            </span>

            <span class="lib-badges">
              <span v-if="item.restored" class="lib-badge is-repaired" title="该条登记图经过修复（超分/去噪）后重新入库，向量来自修复后的图像">
                <el-icon><MagicStick /></el-icon>已修复
              </span>
              <span v-if="item.hasImage" class="lib-badge is-ok">有图片</span>
              <span v-else class="lib-badge is-warn">无图片</span>
            </span>

            <div class="lib-actions">
              <button v-if="landmarkReady" type="button" class="lib-act" title="查看特征点"
                @click.stop="openLandmark(item)">
                <el-icon><Aim /></el-icon>
              </button>
              <button v-if="restoreReady" type="button" class="lib-act" title="修复人脸并重新入库"
                :disabled="busy" @click.stop="repairOne(item)">
                <el-icon><MagicStick /></el-icon>
              </button>
              <button type="button" class="lib-act" title="编辑信息" @click.stop="openEdit(item)">
                <el-icon><EditPen /></el-icon>
              </button>
              <button type="button" class="lib-act" title="查看大图" @click.stop="preview(item)">
                <el-icon><ZoomIn /></el-icon>
              </button>
              <button type="button" class="lib-act is-danger" title="删除" :disabled="busy"
                @click.stop="removeOne(item)">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </div>

          <figcaption class="lib-meta">
            <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
            <span class="lib-dim">{{ formatMeta(item) }}</span>
          </figcaption>
        </figure>

        <!-- 首屏骨架：占位图本是透明 1×1，加载期一片空白；shimmer 骨架给出「正在来」的预期 -->
        <template v-if="loading && visibleItems.length === 0">
          <div v-for="i in 8" :key="'sk' + i" class="lib-cell is-skeleton" aria-hidden="true">
            <div class="lib-thumb fl-skeleton"></div>
            <figcaption class="lib-meta">
              <span class="fl-skeleton sk-line"></span>
              <span class="fl-skeleton sk-line sk-short"></span>
            </figcaption>
          </div>
        </template>

        <el-empty v-if="!loading && visibleItems.length === 0" description="没有符合条件的人脸"
          class="lib-empty" />
      </div>

      <!-- 列表视图 -->
      <div v-else-if="viewMode === 'list'" ref="listRef" v-loading="loading" class="lib-list">
        <div v-for="item in visibleItems" :key="item.id" class="lib-row"
          :class="{ 'is-selected': selected.has(item.id), 'is-active': isActive(item) }"
          @click="activate(item)">
          <span class="lib-check is-inline" @click.stop="toggleSelect(item)">
            <el-icon v-if="selected.has(item.id)"><Select /></el-icon>
          </span>
          <el-popover v-if="thumbVisible(item) && !isThumbBroken(item.id)" trigger="hover" placement="right"
            :width="172" :show-arrow="true">
            <template #reference>
              <img class="lib-row-thumb" :src="item.thumb" :alt="item.name" loading="lazy"
                :data-face-id="item.id" @click="preview(item)" @error="markThumbBroken(item.id)" />
            </template>
            <!-- 悬浮放大：hover 出大图；点击仍走 viewerjs 全屏 -->
            <img class="fl-zoom-img" :src="thumbFor(item.id)" alt="" loading="lazy" />
          </el-popover>
          <div v-else class="lib-row-thumb fl-thumb-fallback" @click="showFaces && preview(item)">
            <el-icon><Hide v-if="!showFaces" /><UserFilled v-else /></el-icon>
          </div>
          <div class="lib-row-body">
            <span class="lib-name" :title="item.name">{{ item.name || '未命名' }}</span>
            <span class="lib-dim">{{ formatMeta(item) }}</span>
          </div>
          <span class="lib-badges is-inline">
            <span v-if="item.restored" class="lib-badge is-repaired" title="该条登记图经过修复（超分/去噪）后重新入库，向量来自修复后的图像">
              <el-icon><MagicStick /></el-icon>已修复
            </span>
            <span v-if="item.hasImage" class="lib-badge is-ok">有图片</span>
            <span v-else class="lib-badge is-warn">无图片</span>
          </span>
          <button v-if="landmarkReady" type="button" class="lib-act is-onlight" title="查看特征点"
            @click.stop="openLandmark(item)">
            <el-icon><Aim /></el-icon>
          </button>
          <button v-if="restoreReady" type="button" class="lib-act is-onlight" title="修复人脸并重新入库"
            :disabled="busy" @click.stop="repairOne(item)">
            <el-icon><MagicStick /></el-icon>
          </button>
          <button type="button" class="lib-act is-onlight" title="编辑信息" @click.stop="openEdit(item)">
            <el-icon><EditPen /></el-icon>
          </button>
          <button type="button" class="lib-act is-danger is-onlight" title="删除" :disabled="busy"
            @click.stop="removeOne(item)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>

        <!-- 首屏骨架（列表视图） -->
        <template v-if="loading && visibleItems.length === 0">
          <div v-for="i in 6" :key="'sk' + i" class="lib-row is-skeleton" aria-hidden="true">
            <div class="lib-row-thumb fl-skeleton"></div>
            <div class="lib-row-body">
              <span class="fl-skeleton sk-line"></span>
              <span class="fl-skeleton sk-line sk-short"></span>
            </div>
          </div>
        </template>

        <el-empty v-if="!loading && visibleItems.length === 0" description="没有符合条件的人脸" />
      </div>

      <!--
        表格视图（ReTable）：真正的表格形态，为「上万条底库」准备 ——
        分页/检索/排序全部走服务端（loader → GET /v2/face/list），
        列可排序（sortable=custom → 服务端排序）、可显隐/拖列（ReTable 列配置持久化），
        带总数/跳页/每页条数的完整分页器。勾选列接批量删除条。
      -->
      <div v-else class="lib-table">
        <ReTable
          ref="tableRef"
          table-id="face-lib-table"
          toolbar
          :loader="tableLoader"
          :columns="tableColumns"
          :params="tableParams"
          :loading="loading"
          :show-selection="true"
          :pagination="true"
          row-key="id"
          :row-class-name="tableRowClassName"
          empty-text="没有符合条件的人脸"
          @sort-change="onTableSort"
          @row-click="onTableRowClick"
          @selection-change="onTableSelection"
        >
          <template #thumb="{ row }">
            <!-- 用 hasImage 判，别用 id 判：没有图的条目 id 也在，thumbFor 会给出一个必然 404 的地址，
                 表格视图是默认视图，破图会直接被看到 -->
            <el-popover v-if="showFaces && row.hasImage && !isThumbBroken(String(row.id))" trigger="hover"
              placement="right" :width="172" :show-arrow="true">
              <template #reference>
                <img class="lt-thumb" :src="thumbFor(String(row.id))" alt="" loading="lazy"
                  @click.stop="previewById(String(row.id))" @error="markThumbBroken(String(row.id))" />
              </template>
              <!-- 悬浮放大：src 与缩略图同源（渲染期现取），blob 就绪后自动换真图；点击仍走 viewerjs 全屏 -->
              <img class="fl-zoom-img" :src="thumbFor(String(row.id))" alt="" loading="lazy" />
            </el-popover>
            <span v-else class="lt-thumb lt-thumb-empty">
              <el-icon><Hide v-if="!showFaces" /><UserFilled v-else /></el-icon>
            </span>
          </template>
          <template #idCard="{ row }">
            <span class="lt-mono">{{ maskIdCard(String(row.idCard ?? '')) || '—' }}</span>
          </template>
          <template #hasImage="{ row }">
            <span v-if="row.hasImage" class="lib-badge is-ok">有图片</span>
            <span v-else class="lib-badge is-warn">无图片</span>
          </template>
          <template #geo="{ row }">
            <span class="lt-mono">{{ formatGeo(asRow(row)) || '—' }}</span>
          </template>
          <template #restored="{ row }">
            <span v-if="row.restored" class="lib-badge is-repaired" title="该条登记图经过修复后重新入库">
              <el-icon><MagicStick /></el-icon>已修复
            </span>
            <span v-else class="lt-mono">—</span>
          </template>
          <template #actions="{ row }">
            <div class="lt-actions">
              <button v-if="landmarkReady" type="button" class="lib-act is-onlight" title="查看特征点"
                @click.stop="openLandmark(asRow(row))">
                <el-icon><Aim /></el-icon>
              </button>
              <button type="button" class="lib-act is-onlight" title="编辑信息"
                @click.stop="openEdit(asRow(row))">
                <el-icon><EditPen /></el-icon>
              </button>
              <button type="button" class="lib-act is-danger is-onlight" title="删除" :disabled="busy"
                @click.stop="removeOne(asRow(row))">
                <el-icon><Delete /></el-icon>
              </button>
            </div>
          </template>
        </ReTable>

        <!--
          表格视图的 viewerjs 宿主：viewerjs 要真实的 img 元素才能放大/左右切换，
          而表格行由 ReTable 内部渲染，没有可挂载的图片容器。这里在表格旁挂一个
          不可见宿主（0×0 裁剪；不用 display:none，避免图片不渲染），
          只渲染「有图且隐私开关打开」的行，点缩略图时按 id 定位到这里的图片。
        -->
        <div ref="tableViewerRef" class="lt-viewer-host" aria-hidden="true">
          <img v-for="r in tableViewerImages" :key="r.id" :src="thumbFor(r.id)" :alt="r.name"
            :data-face-id="r.id" />
        </div>
      </div>

      <!-- 翻页（表格视图用 ReTable 自带分页器） -->
      <div v-if="viewMode !== 'table' && total > pageSize" class="lib-pager">
        <el-button :disabled="page <= 1 || loading" @click="load(page - 1)">上一页</el-button>
        <span class="lib-pager-text">{{ page }} / {{ pageCount }}</span>
        <el-button :disabled="page >= pageCount || loading" @click="load(page + 1)">下一页</el-button>
      </div>

      <!--
        右侧常驻档案抽屉（02 方向）：列表负责「找」，抽屉负责「看这个人」。
        不用 el-drawer —— 那会盖住列表，来回点选要开关两次；
        常驻一栏点一行换一栏，管一百多条时才是连续的动作。
      -->
      <aside class="fl-drawer" :class="{ 'is-empty': !activeRow }" aria-live="polite">
        <template v-if="activeRow">
          <header class="fl-drawer-head">
            <div class="fl-drawer-id">
              <span class="fl-drawer-name" :title="activeRow.name">{{ activeRow.name || '未命名' }}</span>
              <span class="fl-drawer-sub">{{ activeRow.group }} · {{ ageBucket(activeRow.age) }}</span>
            </div>
            <button type="button" class="fl-drawer-close" title="收起档案" @click="closeActive">
              <el-icon><Close /></el-icon>
            </button>
          </header>

          <div class="fl-drawer-tags">
            <span v-if="activeRow.hasImage" class="lib-badge is-ok">有图片</span>
            <span v-else class="lib-badge is-warn">无图片</span>
            <span v-if="activeRow.restored" class="lib-badge is-repaired">
              <el-icon><MagicStick /></el-icon>已修复
            </span>
          </div>

          <div class="fl-drawer-body">
            <div class="fl-drawer-figure" :class="{ 'is-original': drawerImgMode === 'original' }"
              @click="previewActive">
              <!-- 用 hasImage 判：表格行即使没有图，thumb 也是一个待解析地址（恒真），
                   拿它当条件会给无图条目渲染一张破图 -->
              <img v-if="showFaces && activeRow.hasImage && !isThumbBroken(activeRow.id)"
                :src="drawerFigureSrc" :alt="activeRow.name" loading="lazy" @error="markThumbBroken(activeRow.id)" />
              <span v-else class="fl-thumb-fallback">
                <el-icon :size="26">
                  <Hide v-if="!showFaces" /><Warning v-else-if="isThumbBroken(activeRow.id)" /><UserFilled v-else />
                </el-icon>
              </span>
              <!-- 特征点叠加画布：与登记图同尺寸铺在图上，「叠加特征点」点亮后绘制 -->
              <canvas v-if="lmOverlayOn" ref="lmCanvasRef" class="fl-lm-canvas"></canvas>
            </div>
            <div v-if="showFaces && activeRow.hasImage" class="fl-drawer-mode" role="group"
              aria-label="登记图查看模式">
              <button type="button" class="fl-mode-btn" :class="{ 'is-active': drawerImgMode === 'face' }"
                title="登记时落存的裁剪脸" @click="setDrawerMode('face')">登记脸</button>
              <button type="button" class="fl-mode-btn" :class="{ 'is-active': drawerImgMode === 'original' }"
                title="登记时的原始照片（早期数据可能未存）" @click="setDrawerMode('original')">原图</button>
              <button v-if="landmarkReady" type="button" class="fl-mode-btn fl-lm-toggle"
                :class="{ 'is-active': lmOverlayOn }" :disabled="lmOverlayLoading"
                title="在登记图上叠加后端返回的人脸关键点" @click="toggleLmOverlay">
                {{ lmOverlayLoading ? '定位中…' : '叠加特征点' }}
              </button>
            </div>

            <dl class="fl-metrics">
              <div class="fl-metric">
                <dt>年龄段</dt>
                <dd>{{ ageBucket(activeRow.age) }}</dd>
              </div>
              <div class="fl-metric">
                <dt>颜值</dt>
                <dd>{{ activeRow.photogenic }}</dd>
              </div>
              <div class="fl-metric">
                <dt>坐标</dt>
                <dd>{{ activeRow.lat != null || activeRow.lng != null ? '已标注' : '未标注' }}</dd>
              </div>
            </dl>

            <h4 class="fl-drawer-title">身份信息</h4>
            <dl class="fl-fields">
              <div class="fl-field">
                <dt>身份证</dt>
                <dd class="fl-mono">{{ maskIdCard(activeRow.idCard) || '未填写' }}</dd>
              </div>
              <div class="fl-field">
                <dt>性别</dt>
                <dd>{{ activeRow.gender || '未知' }}</dd>
              </div>
              <div class="fl-field">
                <dt>发型</dt>
                <dd>{{ activeRow.hair || '—' }}</dd>
              </div>
              <div class="fl-field">
                <dt>登记坐标</dt>
                <dd class="fl-mono">
                  {{ formatGeo(activeRow) || '—' }}
                  <el-button v-if="activeRow.lat != null || activeRow.lng != null" link type="primary"
                    class="fl-geo-link" title="在地图中查看该坐标" @click="openMapLink(activeRow)">
                    <el-icon><Location /></el-icon>地图
                  </el-button>
                </dd>
              </div>
              <div class="fl-field is-block">
                <dt>备注</dt>
                <dd>{{ activeRow.note || '—' }}</dd>
              </div>
            </dl>
          </div>

          <footer class="fl-drawer-actions">
            <el-button size="small" @click="openEdit(activeRow)">
              <el-icon><EditPen /></el-icon>编辑档案
            </el-button>
            <el-button v-if="landmarkReady" size="small" @click="openLandmark(activeRow)">
              <el-icon><Aim /></el-icon>特征点
            </el-button>
            <el-button v-if="restoreReady" size="small" :disabled="busy" @click="repairOne(activeRow)">
              <el-icon><MagicStick /></el-icon>修复
            </el-button>
            <el-button size="small" type="danger" plain :disabled="busy" @click="removeOne(activeRow)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </footer>
        </template>

        <div v-else class="fl-drawer-empty">
          <el-icon :size="22"><Tickets /></el-icon>
          <p>点选左侧任意一条，这里显示完整档案</p>
          <span>底库按分组隔离，切分组后档案会跟着换</span>
        </div>
      </aside>
    </section>

    <!-- ── 批量操作条 ─────────────────────────────────────── -->
    <footer class="lib-batch" :class="{ 'is-visible': selected.size > 0 }">
      <span class="lib-batch-count">已选 {{ selected.size }} 条</span>
      <div class="lib-batch-actions">
        <el-button :disabled="busy" @click="clearSelection">取消选择</el-button>
        <el-button :disabled="busy" title="把勾选的条目移到另一个分组（复用登记图与档案）" @click="openMoveSelected">
          <el-icon><Position /></el-icon>移动分组
        </el-button>
        <el-button v-if="restoreReady" :loading="repairingBatch" :disabled="busy || repairingBatch"
          title="对勾选的条目逐张执行画质修复并重新入库" @click="repairSelected">
          <el-icon><MagicStick /></el-icon>批量修复
        </el-button>
        <el-button :disabled="busy" title="只把勾选的条目导出为 CSV" @click="exportSelected">
          <el-icon><Download /></el-icon>导出选中
        </el-button>
        <el-button type="danger" :disabled="busy" @click="removeSelected">
          <el-icon><Delete /></el-icon>删除
        </el-button>
      </div>
    </footer>

    <!-- 底栏：把当前生效的识别参数亮出来，排查「搜不到」时先看这两个值 -->
    <div class="lib-foot">
      <span class="lib-foot-value">人脸检测模型：{{ detectorModel || '未配置' }} · 特征模型：{{ featureModel || '未配置' }}</span>
      <span v-if="faceUnregisteredMsg" class="lib-foot-warn">
        <span>{{ faceUnregisteredMsg }}</span>
        <el-button size="small" type="warning" plain :loading="fixingModels" @click="fixUnregisteredModels">
          一键修复模型名
        </el-button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 人脸底库管理面板。
 *
 * <p>版面与「图像库」的老面板同源（共用 `library-panel.css`），
 * 差别只在业务动作：图像库已升级为整页的台账/画布工作台
 * （{@code components/library/ImageLibraryPage.vue}），人脸登记则仍留在本面板 ——
 * 拖放区打开登记弹窗而不是直接上传。</p>
 *
 * <p>数据：服务端 `GET /v2/face/list` 权威（每条 `{id, metadata, hasImage}`），
 * 登记图由服务端落存（`GET /v2/face/{id}/image`），本机缩略图优先展示、服务端图兜底，
 * 按 id 合并、字段服务端优先。</p>
 *
 * <p>「特征点」按钮**只在关键点模型已配置时渲染**（口径同后端
 * `FaceClientManager.isModelConfigured("landmark_model")`）—— 没配置就不给入口。</p>
 */
import { message } from "@repo/core";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus';
import {
  Aim, Close, Delete, Download, EditPen, Files, Grid, Hide, Location, MagicStick, Menu, Plus,
  Position, Refresh, Search, Select, Switch, Tickets, Upload, UserFilled, View, Warning, ZoomIn,
} from '@element-plus/icons-vue'
import Viewer from 'viewerjs'
import 'viewerjs/dist/viewer.css'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn, ReTableLoadParams, RePageResult } from '@repo/ui/re-table'
import ReDialog from '@repo/ui/re-dialog'
import type { FaceCompareResult, FaceIdentifyResult } from '@/services/modules/face.api'
import { apiService } from '@/services/ApiService'
import { useFaceRegistry, ageBucket, maskIdCard, normalizeGroupName, type FaceRecord } from '@/composables/useFaceRegistry'
import { useLibraryGroups } from '@/composables/useLibraryGroups'
import { createAuthImageLoader, pendingPlaceholder } from '@/utils/authImage'
import { configuredValue } from '@/utils/modelConfigStatus'
import { toErrorMessage } from '@/utils/errors'
import { useModelConfigStore } from '@/stores/modelConfig'
import FaceEnrollDialog from '../management/FaceEnrollDialog.vue'
import FaceLandmarkDialog from '../management/FaceLandmarkDialog.vue'

/** 合并后的展示行 */
interface Row {
  id: string
  name: string
  /** 所属分组（表格「分组」列与元信息行展示用） */
  group: string
  age: number | null
  gender: string
  hair: string
  idCard: string
  photogenic: number
  note: string
  /** 展示用图地址（服务端登记图优先，回落本机缩略图；都可能为空串） */
  thumb: string
  /** 本机（localStorage 登记簿）缩略图，仅用于服务端没图时的兜底绘制 */
  localThumb: string
  /** 是否有图可看（服务端 `hasImage` 或本机缩略图）—— 统计与筛选按它算，别按展示地址算 */
  hasImage: boolean
  /** 登记图是否经过修复（超分/去噪）后重新入库 */
  restored: boolean
  /** 登记时的档案字段原样保留：修复后重新入库必须整体回写，否则姓名/身份证会被清空 */
  meta: Record<string, unknown>
  /**
   * 登记地点纬度（非必填）。
   *
   * <p>服务端放在条目**顶层**（{@code sys_ai_face_library_lat} 列），不在 metadata 里——
   * 列是唯一真相，meta 里可能残留历史副本。故这里显式建模，不走 {@code pick()}。</p>
   */
  lat: number | null
  /** 登记地点经度（非必填），语义同 {@link lat} */
  lng: number | null
}

const loading = ref(false)
const busy = ref(false)
/** 一键修复「onnx: 前缀模型名 → 裸模型名」的进行中状态 */
const fixingModels = ref(false)
const enrollVisible = ref(false)
/** 正在编辑的行；null = 新增登记模式 */
const editItem = ref<FaceRecord | null>(null)
const keyword = ref('')
/** 已提交的检索词（回车/清空/防抖后生效）：网格与表格共用同一口径 */
const kwApplied = ref('')
const statusFilter = ref<'all' | 'thumb' | 'noThumb'>('all')
/**
 * 当前视图。默认 **table**（02 方向）：底库的常态是「一百多条要管」，
 * 满屏可扫的表格 + 右侧常驻档案抽屉比网格更适合；网格/列表仍保留给看图场景。
 */
const viewMode = ref<'grid' | 'list' | 'table'>('table')
const page = ref(1)
const pageSize = 24
/** 服务端排序（表格列头点出来的）；空 = 登记顺序 */
const sortField = ref('')
const sortOrder = ref('')
const selected = ref<Set<string>>(new Set())
const serverItems = ref<Array<Record<string, unknown>>>([])
/**
 * 当前分组。
 *
 * <p>分组是第一层隔离：列表、删除、取图、登记都只作用于它。默认 default 与后端
 * 「不带分组」的语义一致（历史数据也归属 default）—— 也就是说「没选分组」不代表
 * 「看全库」，页面必须把当前分组显式标出来。</p>
 */
const { group, groupOptions, loadGroups, rememberGroups } = useLibraryGroups('face')
/** 命中总数（受 keyword/status 影响）与全库统计（不受影响）——都以服务端为准 */
const total = ref(0)
const stats = ref({ total: 0, withImage: 0, withIdCard: 0 })
const detectorModel = ref('')
const featureModel = ref('')
/** 模型配置门禁：底栏与入口统一用设置中心同源的合并视图，不再读会返回种子默认值的配置口 */
const modelConfig = useModelConfigStore()
/**
 * 关键点模型（`landmark_model`）对**当前用户**的生效值；空 = 未配置。
 *
 * <p><b>为什么取合并视图而不是 {@code /face/config}：</b>系统设置保存 face 分组走的是
 * **用户覆盖层**（face 属于 userScoped 组，管理员也写自己），而 {@code /face/config} 只回
 * 全局层 —— 两边可能不一致。后端 {@code isModelConfigured} 读的是
 * {@code GlobalSettingReader.getStr}（覆盖优先、空也算显式清空），与
 * {@code GET /v2/settings/face/merged} 同一口径。读失败按未配置处理（fail-closed）：
 * 宁可不给入口，也不显示一个点了必然报「能力未启用」的按钮。</p>
 */
const landmarkModel = ref('')
/** 修复模型（`restore_model`）对当前用户的生效值；空 = 未配置，隐藏「修复」入口 */
const restoreModel = ref('')
const registry = useFaceRegistry()
const gridRef = ref<HTMLElement | null>(null)
/** 列表视图容器：viewerjs 宿主（与网格同一条预览通路） */
const listRef = ref<HTMLElement | null>(null)
/** 表格视图的 viewerjs 旁路宿主：表格行由 ReTable 内部渲染，这里单独挂图片 */
const tableViewerRef = ref<HTMLElement | null>(null)
/** 表格视图当前页行（loader 回填）：viewer 宿主按它渲染图片 */
const tableRows = ref<Row[]>([])
/** 表格视图实例：删除/登记后让它重新拉当页、清空它的勾选 */
const tableRef = ref<{ reload: () => void; clearAllSelection: () => void } | null>(null)
/** 三个视图各挂一个 viewerjs 实例：网格/列表挂在视图容器上，表格挂在旁路宿主上 */
let gridViewer: InstanceType<typeof Viewer> | null = null
let listViewer: InstanceType<typeof Viewer> | null = null
let tableViewer: InstanceType<typeof Viewer> | null = null

/**
 * 服务端登记图加载器。
 *
 * <p>底库缩略图与「特征点」弹窗都要拿到那张登记时的裁剪脸。令牌走请求头、不进 URL，
 * 与以图搜图 / 图像底库同一条口径（见 {@code utils/authImage}）。</p>
 */
const authImages = createAuthImageLoader()

/**
 * 是否显示人脸图。默认 **false**：底库属敏感个人信息，缩略图整屏铺开，
 * 而这个页面常在投屏/录屏演示时打开。以前是无条件渲染（只脱敏了身份证），
 * 等于默认敞开。开关本身记在 localStorage，用户主动开一次后保持。
 */
const SHOW_FACES_KEY = 'face_library_show_faces'
const showFaces = ref<boolean>(readShowFacesPref())

function readShowFacesPref(): boolean {
  try {
    return localStorage.getItem(SHOW_FACES_KEY) === '1'
  } catch {
    // 隐私模式/存储被禁用时保持默认隐藏
    return false
  }
}
watch(showFaces, (v) => {
  try {
    localStorage.setItem(SHOW_FACES_KEY, v ? '1' : '0')
  } catch { /* 存不了也只是下次不记住，不影响本次会话 */ }
  // 关闭时把已解析的 blob 全部 revoke，避免人脸图继续留在内存与浏览器缓存里
  if (!v) authImages.revokeAll()
  // 开关变化会整体增删图片节点：viewerjs 的图片清单要跟着重建
  void mountViewer()
})

/**
 * 表格视图 viewer 宿主要渲染的图片：只放「有图且隐私开关打开」的行。
 * 单独放宿主而不是表格行里，是因为表格行由 ReTable 内部渲染，viewerjs 挂不上去。
 */
const tableViewerImages = computed<Row[]>(() =>
  showFaces.value ? tableRows.value.filter((r) => r.hasImage) : [],
)

/** 缩略图是否应展示：隐私开关关闭，或该条本来就无图 */
function thumbVisible(item: { thumb?: string; localThumb?: string }): boolean {
  return showFaces.value && !!(item.thumb || item.localThumb)
}
/** 特征点弹窗：正在查看的条目 */
const lmVisible = ref(false)
const lmItem = ref<Row | null>(null)

/** 关键点模型是否已配置：决定「特征点」按钮是否显示 */
const landmarkReady = computed(() => String(landmarkModel.value ?? '').trim() !== '')

/** 修复入口是否可用：与关键点按钮同一判据（读用户覆盖优先的合并视图） */
const restoreReady = computed(() => String(restoreModel.value ?? '').trim() !== '')

/** 已配置但模型已从注册清单消失（登记/识别必然后端报“模型未注册”） */
const faceUnregistered = computed(() => modelConfig.unregisteredConfigured)

/** 登记是否可点：既要求字段真配置，也要求模型当前仍在 /api/providers 注册可用 */
const canEnroll = computed(() =>
  modelConfig.faceReady && modelConfig.unregisteredConfigured.length === 0,
)

/** 未注册模型对应的字段中文名（提示用） */
const FACE_FIELD_LABELS: Record<string, string> = {
  detector_model: '人脸检测模型',
  feature_model: '人脸特征模型',
  landmark_model: '人脸关键点模型',
  restore_model: '人脸修复模型',
}

/** 已配置但未注册时的统一提示 */
const faceUnregisteredMsg = computed(() =>
  faceUnregistered.value.length
    ? `人脸识别模型当前不可用：${faceUnregistered.value
        .map((f) => FACE_FIELD_LABELS[f] ?? f)
        .join('、')} 已配置的模型未在后端注册。请到「系统设置 → 默认模型 → 人脸识别」重新选择当前可用的模型`
    : '',
)

/**
 * 服务端条目 → 展示行（网格/列表/表格三视图共用同一映射）。
 *
 * @param s 服务端条目（{@code {id, metadata, hasImage}}）
 * @return 展示行
 */
function toRow(s: Record<string, unknown>): Row {
  const id = String(s.id ?? '')
  const meta = (s.metadata && typeof s.metadata === 'object' ? s.metadata : {}) as Record<string, unknown>
  const local = registry.byId(id, group.value)
  const pick = (k: string): unknown => (meta[k] != null && meta[k] !== '' ? meta[k] : (local as any)?.[k])
  const ageRaw = pick('age')
  const photoRaw = pick('photogenic')
  return {
    id,
    name: String(pick('name') ?? pick('label') ?? ''),
    // 分组以服务端条目为准（列表本身就是按分组查的），本机登记簿只作兜底
    group: normalizeGroupName((s.group as string | undefined) ?? local?.group ?? group.value),
    age: typeof ageRaw === 'number' ? ageRaw : ageRaw == null || ageRaw === '' ? null : Number(ageRaw),
    gender: String(pick('gender') ?? ''),
    hair: String(pick('hair') ?? ''),
    idCard: String(pick('idCard') ?? ''),
    photogenic: typeof photoRaw === 'number' ? photoRaw : photoRaw == null || photoRaw === '' ? 3 : Number(photoRaw),
    note: String(pick('note') ?? ''),
    // 缩略图优先本地（登记它的浏览器立刻就有），否则取**服务端落存的登记图** ——
    // 换浏览器/换账号也能看到图，这正是「在图上画特征点」的前提。
    thumb: local?.thumb || authImages.resolve(faceImagePath(id)),
    localThumb: local?.thumb ?? '',
    hasImage: !!s.hasImage || !!local?.thumb,
    // 修复标记存在元数据里（由「修复并重新入库」写入）。元数据会被本机登记簿覆盖，
    // 所以两侧都认：服务端没写但本机写了也算已修复，避免换浏览器后标签消失。
    restored: meta.restored === true || meta.restored === 'true' || (local as any)?.restored === true,
    // 经纬度取条目顶层（服务端以列为准）；本机登记簿作为兜底，保证刚登记还没刷新时也能显示
    lat: numberOrNull(s.lat ?? (local as any)?.lat),
    lng: numberOrNull(s.lng ?? (local as any)?.lng),
    meta,
  }
}

/**
 * 服务端登记图地址（按分组定位）。
 *
 * <p>必须带分组：同一个 id 可能同时存在于多个分组，不带分组会取到 default 里的
 * 同名条目图，缩略图与列表行对不上。分组名也参与 authImages 的缓存键，
 * 因此切组后不会串用上一组解析出来的 blob。</p>
 *
 * @param id 人脸标识
 * @param suffix 端点后缀（image / original）
 * @returns 相对地址（authImages 会自行拼 baseURL）
 */
function faceImagePath(id: string, suffix = 'image'): string {
  return `/face/${encodeURIComponent(id)}/${suffix}?group=${encodeURIComponent(normalizeGroupName(group.value))}`
}

/**
 * 把任意入参转成数字或 null。
 *
 * <p>后端用 BigDecimal 序列化成数字，但本机登记簿可能存的是字符串，
 * 这里统一掉，避免 `'31.23'` 让坐标判断/格式化出错。</p>
 *
 * @param v 入参
 * @returns 数字；非法或空值返回 null
 */
function numberOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * 当前页行（网格/列表用）。
 *
 * <p>检索与分页已下沉到服务端（{@code GET /v2/face/list?page&size&keyword&status}），
 * 这里只做「服务端条目 → 展示行」的字段映射，不再本地过滤 —— 1 万条时浏览器
 * 只会拿到当页 24 条。</p>
 */
const visibleItems = computed<Row[]>(() => serverItems.value.map(toRow))

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

/* ── 右侧档案抽屉（02 方向） ───────────────────────────────────── */

/**
 * 抽屉当前展示的行；null = 没有选中项（抽屉显示引导语）。
 *
 * <p>存的是**点选那一刻的行对象**，不是 id 再回查：表格视图的分页/排序由 ReTable
 * 自己发请求，{@code serverItems} 停在网格/列表那一套页码上，按 id 回查会在
 * 用户翻到第 2 页后突然查不到人、抽屉变空。行对象只作快照展示，改档案走弹窗，
 * 不会出现「抽屉里改了一半」的状态。</p>
 */
const activeRow = ref<Row | null>(null)

/**
 * 表格行「正在看」高亮（row-class-name 经 ReTable 的 $attrs 透传给表格引擎）。
 *
 * <p>每次 activeRow 变化都返回**新函数**：表格引擎按 prop 引用判断要不要重渲染，
 * 复用同一个函数引用会漏掉行高亮更新。类名 is-viewing 对齐 vxe「行选中」的
 * 官方视觉口径（弱于批量勾选态，见 scoped 样式）。</p>
 */
const tableRowClassName = computed(() => {
  const activeId = activeRow.value?.id ?? ''
  return ({ row }: { row: unknown }): string =>
    String((row as Row | null)?.id ?? '') === activeId ? 'is-viewing' : ''
})

/**
 * 该行是不是抽屉里正在看的那一条（网格/列表上给出「正在看」态）。
 *
 * @param item 展示行
 * @return 是否正在看
 */
function isActive(item: Row): boolean {
  return activeRow.value?.id === item.id
}

/**
 * 点选一行 → 右侧抽屉换成这个人的档案。
 *
 * @param item 展示行
 */
function activate(item: Row) {
  activeRow.value = item
}

/** 收起抽屉（不动列表勾选：那是批量删除用的另一套状态） */
function closeActive() {
  activeRow.value = null
}

/* ── 抽屉登记图 / 原图切换 ────────────────────────────────────── */

type DrawerImgMode = 'face' | 'original'
const drawerImgMode = ref<DrawerImgMode>('face')
/** 原图模式的临时 blob 地址（点「原图」时才拉取，换人/收起时释放） */
const drawerOriginalUrl = ref('')
/** 已确认该条没有原图（404/老数据）：不再重复请求，再点只提示 */
const drawerOriginalMissing = ref(false)

/**
 * 抽屉大图地址：原图模式用临时 blob；未就绪或无原图时回落登记脸。
 *
 * <p>登记脸走 {@link thumbFor}（渲染期现取，blob 就绪自动换真图）。</p>
 */
const drawerFigureSrc = computed(() => {
  if (!activeRow.value) return ''
  if (drawerImgMode.value === 'original' && drawerOriginalUrl.value) return drawerOriginalUrl.value
  return thumbFor(activeRow.value.id)
})

/** 换人/收起抽屉时重置图片模式并释放原图 blob（临时地址不释放会越积越多） */
function resetDrawerImage() {
  drawerImgMode.value = 'face'
  if (drawerOriginalUrl.value) {
    URL.revokeObjectURL(drawerOriginalUrl.value)
    drawerOriginalUrl.value = ''
  }
  drawerOriginalMissing.value = false
  // 特征点叠加是「这一张图」的临时态：换人/收起必须一并熄灭，否则画布会串到下一个人身上
  lmOverlayOn.value = false
  lmOverlayLoading.value = false
}

/**
 * 切换抽屉看图模式。「原图」懒加载：第一次切过去才请求 originalImageBlob，
 * 老数据没有原图（后端 404 → null）时提示并退回登记脸。
 *
 * @param m 目标模式
 */
async function setDrawerMode(m: DrawerImgMode) {
  if (drawerImgMode.value === m) return
  if (m === 'original') {
    const row = activeRow.value
    if (!row) return
    if (!drawerOriginalUrl.value && !drawerOriginalMissing.value) {
      const blob = await apiService.originalImageBlob(row.id, group.value).catch(() => null)
      // 等待期间可能已切到别人：这份结果作废
      if (activeRow.value?.id !== row.id) return
      if (blob) drawerOriginalUrl.value = URL.createObjectURL(blob)
      else drawerOriginalMissing.value = true
    }
    if (drawerOriginalMissing.value) {
      message.info('该条目没有保存原始照片（早期登记数据），仍显示登记脸')
      return
    }
  }
  drawerImgMode.value = m
}

// 切人或收起抽屉（activeRow 变 null）都要复位，避免上一个人的原图串到下一个人身上
watch(() => activeRow.value?.id ?? '', () => resetDrawerImage())

/* ── 抽屉特征点叠加：取登记图 → landmarkFace → 画布按原图像素换算绘制 ── */

const lmOverlayOn = ref(false)
const lmOverlayLoading = ref(false)
const lmCanvasRef = ref<HTMLCanvasElement | null>(null)

/**
 * 开/关抽屉登记图上的特征点叠加。
 *
 * <p>打开时现取登记图（原图优先，老数据退登记脸）走 {@code landmarkFace}；
 * 后端返回的 points 是<b>原图像素</b>坐标，画布按 contain 完整呈现原图，
 * 同一组 scale/offset 既画图也画点，保证点落在正确的五官位置上。</p>
 */
async function toggleLmOverlay() {
  const row = activeRow.value
  if (!row || lmOverlayLoading.value) return
  if (lmOverlayOn.value) {
    lmOverlayOn.value = false
    return
  }
  lmOverlayLoading.value = true
  try {
    const blob = (await apiService.originalImageBlob(row.id, group.value).catch(() => null))
      ?? (await apiService.faceImageBlob(row.id, group.value).catch(() => null))
    if (!blob) {
      message.warning('该条目没有可用的登记图，无法叠加特征点')
      return
    }
    // 等待期间可能已切到别人：这份结果作废
    if (activeRow.value?.id !== row.id) return
    const lm = await apiService.landmarkFace(blob, 'face.png')
    if (activeRow.value?.id !== row.id) return
    const pts = Array.isArray(lm?.points) ? lm.points : []
    if (!lm?.matched || pts.length < 2) {
      message.warning('后端未返回特征点（landmark 模型未配置或未检出人脸）')
      return
    }
    lmOverlayOn.value = true
    await nextTick()
    drawLmOverlay(blob, pts, row.id)
  } catch (e: any) {
    lmOverlayOn.value = false
    message.error('特征点获取失败：' + (e?.message ?? e))
  } finally {
    lmOverlayLoading.value = false
  }
}

/**
 * 把登记图画进画布并叠加特征点。
 *
 * @param blob 登记图（原图或登记脸）
 * @param pts 扁平原图像素坐标 [x1,y1,x2,y2,...]
 * @param rowId 发起请求的行 id（异步回来自校验）
 */
function drawLmOverlay(blob: Blob, pts: number[], rowId: string) {
  const canvas = lmCanvasRef.value
  if (!canvas) return
  const url = URL.createObjectURL(blob)
  const img = new Image()
  const done = () => URL.revokeObjectURL(url)
  img.onload = () => {
    if (activeRow.value?.id !== rowId) { done(); return }
    const w = canvas.clientWidth || 104
    const h = canvas.clientHeight || 128
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { done(); return }
    const nw = img.naturalWidth || 1
    const nh = img.naturalHeight || 1
    // 坐标自校验（同 FaceSearchPage 口径）：点必须落在原图范围内，否则拒绝绘制
    const inImage = pts.every((v, i) => (i % 2 === 0 ? v >= -2 && v <= nw + 2 : v >= -2 && v <= nh + 2))
    if (!inImage) {
      message.warning('特征点坐标校验未通过（未落在原图范围内），已拒绝绘制')
      done()
      return
    }
    ctx.clearRect(0, 0, w, h)
    // contain 完整呈现原图：整图入框不裁脸，坐标换算与绘制共用同一组 scale/offset
    const scale = Math.min(w / nw, h / nh)
    const dw = nw * scale
    const dh = nh * scale
    const ox = (w - dw) / 2
    const oy = (h - dh) / 2
    ctx.drawImage(img, ox, oy, dw, dh)
    ctx.fillStyle = 'rgba(64, 158, 255, 0.95)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 1
    for (let i = 0; i + 1 < pts.length; i += 2) {
      ctx.beginPath()
      ctx.arc(pts[i] * scale + ox, pts[i + 1] * scale + oy, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    done()
  }
  img.onerror = () => {
    done()
    lmOverlayOn.value = false
    message.warning('登记图加载失败，无法叠加特征点')
  }
  img.src = url
}

/**
 * 表格行点击 → 打开该行的档案抽屉。
 *
 * <p>ReTable 从 cell-click 合成 row-click，行内操作按钮的点击也会冒上来：
 * 这里只切抽屉，不拦按钮自己的动作，两边互不影响。</p>
 *
 * @param row 表格行
 */
function onTableRowClick(row: Record<string, unknown>) {
  activate(asRow(row))
}

/**
 * 表格行的登记图地址。
 *
 * <p>不能直接用 {@code Row.thumb}：那是加载时求值一次的字符串，blob 未就绪时
 * 会**永远停在占位图**（表格行存的是 ReTable 内部状态，不随 blobUrls 重算）。
 * 这里在渲染期调用 {@code resolve}，blobUrls 是响应式映射，加载完成自动重渲染。</p>
 *
 * @param id 人脸标识
 * @return 可直接给 img.src 的地址（本地优先、服务端图兜底）
 */
function thumbFor(id: string): string {
  return registry.byId(id, group.value)?.thumb || authImages.resolve(faceImagePath(id))
}

/**
 * 表格行 → 展示行（loader 已按 {@link toRow} 产出，这里只是槽位的类型收窄）。
 *
 * @param row 表格行
 * @return 展示行
 */
function asRow(row: unknown): Row {
  return row as Row
}

/**
 * 表格缩略图点击：在旁路宿主里按 id 定位图片，用 viewerjs 放大。
 *
 * <p>点击时**重建实例**再 view：宿主 img 的 src 是渲染期现取的（{@link thumbFor}），
 * 旧实例初始化时可能快照到 blob 未就绪的占位地址；重建后 viewerjs 拿到的必然是
 * 当前 DOM 里的最新地址。宿主里找不到该 id（异常/无图）时退回新开页。</p>
 *
 * @param id 人脸标识
 */
function previewById(id: string) {
  if (!showFaces.value) {
    message.info('人脸图当前处于隐藏状态，请先打开页头的显示开关')
    return
  }
  const url = thumbFor(id)
  if (!url || url === pendingPlaceholder) {
    message.info('图片加载中或该条没有人脸图（老数据重新登记一次即可）')
    return
  }
  const host = tableViewerRef.value
  if (tableViewer && host) {
    const imgs = host.querySelectorAll<HTMLImageElement>('img[data-face-id]')
    const idx = Array.from(imgs).findIndex((el) => el.dataset.faceId === id)
    if (idx >= 0) {
      tableViewer.destroy()
      tableViewer = new Viewer(host, { navbar: false, toolbar: true, title: false })
      tableViewer.view(idx)
      return
    }
  }
  window.open(url, '_blank')
}

/**
 * 抽屉里点登记图放大。
 *
 * <p>表格视图的行是 ReTable 的快照，{@code thumb} 停在加载那一刻的地址；
 * 这里按 id 现取一次（blob 加载完成就能拿到真地址），网格/列表仍走 viewerjs。
 * 「原图」模式不在任何 viewerjs 宿主里，直接新开页看整张。</p>
 */
function previewActive() {
  const item = activeRow.value
  if (!item) return
  if (drawerImgMode.value === 'original') {
    if (drawerOriginalUrl.value) window.open(drawerOriginalUrl.value, '_blank')
    return
  }
  if (viewMode.value === 'table') {
    previewById(item.id)
    return
  }
  preview(item)
}

/**
 * 输入防抖提交检索词（300ms）：先本地改输入框，停顿后一次性打服务端。
 *
 * <p>回车/清空立即生效（见模板）——「敲完回车就查」是检索框的通用预期。</p>
 */
let kwTimer: ReturnType<typeof setTimeout> | null = null
function commitKeyword(immediate = false) {
  if (kwTimer) {
    clearTimeout(kwTimer)
    kwTimer = null
  }
  const apply = () => {
    kwTimer = null
    if (kwApplied.value === keyword.value.trim()) {
      return
    }
    kwApplied.value = keyword.value.trim()
    // 表格视图：kwApplied 变化即 tableParams 变化，ReTable 自己回第 1 页重查，
    // 这里再发一次就是双请求；网格/列表才需要手动 load
    if (viewMode.value !== 'table') void load(1)
  }
  if (immediate) {
    apply()
  } else {
    kwTimer = setTimeout(apply, 300)
  }
}

/**
 * 点统计卡切换状态筛选：与工具栏下拉改的是同一个 {@link statusFilter}，
 * 再点一次已选中的卡片回「全部」。身份证已填没有后端筛选参数，不提供点击。
 *
 * @param v 统计卡对应的状态口径
 */
function filterByMetric(v: 'all' | 'thumb' | 'noThumb') {
  statusFilter.value = statusFilter.value === v ? 'all' : v
}

// 状态筛选立即生效；服务端按 status 过滤后回第 1 页（表格视图同理由 ReTable 自行重查）
watch(statusFilter, () => {
  if (viewMode.value !== 'table') void load(1)
})

// 切换分组 = 换了一整套向量库：表格视图由 tableParams 变化自动重查，网格/列表手动重载。
// 顺带清掉勾选：跨分组的选中状态既无意义，批量删除还会删到别的组里去。
watch(group, () => {
  selected.value = new Set()
  // 换分组 = 换一整套库：右侧档案跟着清掉，免得留着别的组的人
  activeRow.value = null
  tableRef.value?.clearAllSelection()
  rememberGroups([group.value])
  if (viewMode.value !== 'table') void load(1)
})

// 切回网格/列表时用最新检索条件补一次加载（表格期间可能改过条件）
watch(viewMode, (m) => {
  if (m !== 'table') void load(page.value)
  // 三个视图的容器互斥（v-if）：切过去后给新容器重挂 viewerjs
  void mountViewer()
})

// 表格视图的参数（交给 ReTable：变化自动回第 1 页并重载 loader）
const tableParams = computed(() => ({
  keyword: kwApplied.value,
  status: statusFilter.value === 'all' ? '' : statusFilter.value,
  sortField: sortField.value,
  sortOrder: sortOrder.value,
  // 分组也进参数：切组时 ReTable 自动回第 1 页重查，不必手动 reload
  group: group.value,
}))

/** 元信息一行：分组 · 年龄段 · 性别 · 发型 · 身份证(脱敏) · 经纬度 */
function formatMeta(item: Row): string {
  // 分组排最前：它是「这条数据属于哪套库」这一层信息，列表已按分组过滤，
  // 标出来用户才明白「为什么这里看不到另一组的人」
  const parts = [`分组 ${item.group}`, ageBucket(item.age), item.gender || '未知']
  if (item.hair) parts.push(item.hair)
  const id = maskIdCard(item.idCard)
  if (id) parts.push(id)
  // 经纬度是选填项，只有真的填了才显示，避免空库每条都拖一个「-」
  const geo = formatGeo(item)
  if (geo) parts.push(geo)
  return parts.join(' · ')
}

/**
 * 格式化经纬度。
 *
 * <p>保留 7 位小数与数据库 DECIMAL(10,7) 精度对齐，不做四舍五入截断——
 * 短于 7 位会在地图上错位到相邻街区。</p>
 *
 * @param item 展示行
 * @returns 形如 `121.4737000, 31.2304000`；两者都为空返回空串
 */
function formatGeo(item: Row): string {
  if (item.lat == null && item.lng == null) return ''
  const fmt = (v: number | null): string => (v == null ? '-' : v.toFixed(7))
  return `${fmt(item.lng)}, ${fmt(item.lat)}`
}

/**
 * 按页/检索词加载（服务端分页：网格与列表只拿当页 24 条）。
 *
 * @param target 目标页码
 */
async function load(target = 1) {
  loading.value = true
  try {
    const data = await apiService.listFaces({
      page: target,
      size: pageSize,
      keyword: kwApplied.value || undefined,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
      group: group.value,
    })
    serverItems.value = data.items as Array<Record<string, unknown>>
    total.value = data.total
    // 条目带回的分组名一并并进下拉：后端 groups 接口没列到的历史分组也不该缺席
    rememberGroups(data.items.map((x) => (x as Record<string, unknown>).group as string | undefined))
    if (data.stats) {
      stats.value = data.stats
    } else if (target === 1 && data.items.length === data.total) {
      // 旧后端（无 stats）：全量回包时按当包推算，避免统计卡变哑
      const items = data.items as Array<Record<string, unknown>>
      stats.value = {
        total: data.total,
        withImage: items.filter((x) => !!x.hasImage).length,
        withIdCard: items.filter((x) => {
          const m = (x.metadata ?? {}) as Record<string, unknown>
          return typeof m.idCard === 'string' && m.idCard.trim() !== ''
        }).length,
      }
    }
    page.value = target
    // 越界兜底：删空最后一页后回落到上一页
    if (data.items.length === 0 && target > 1 && target > pageCount.value) {
      await load(pageCount.value)
      return
    }
    // 底栏与特征点/修复入口统一取设置中心同源的合并视图；
    // 种子默认值（SYSTEM_DEFAULT）不算已配置，读失败按未配置处理（fail-closed）。
    await modelConfig.load()
    detectorModel.value = modelConfig.faceDetectorModel
    featureModel.value = modelConfig.faceFeatureModel
    landmarkModel.value = configuredValue(modelConfig.faceMerged, 'landmark_model')
    restoreModel.value = configuredValue(modelConfig.faceMerged, 'restore_model')
    await mountViewer()
    // 表格模式下的删除/登记等动作：本函数顺带把表格也重查一遍（stats 以本次为准）
    if (viewMode.value === 'table' && target === page.value) {
      tableRef.value?.reload()
    }
  } catch (e: any) {
    message.error('加载人脸底库失败：' + toErrorMessage(e))
  } finally {
    loading.value = false
  }
}

/* ── 表格视图（ReTable · 后端分页/筛选/排序） ──────────────────── */

/**
 * 表格列（02 方向）：只留「扫一眼就要认人」的 5 列。
 *
 * <p>右侧常驻 340px 档案抽屉占掉一栏宽度，再摆 10 列会被横向挤成滚动条；
 * 年龄/性别/发型/备注/坐标都已在抽屉里，分组由页签与抽屉标明 —— 列上重复只是噪音。
 * 排序、列显隐、列宽拖拽仍由 ReTable 持久化（table-id 未变，老配置继续生效）。</p>
 */
const tableColumns: ReTableColumn[] = [
  { prop: 'thumb', label: '登记图', width: 72, slot: 'thumb', align: 'center' },
  { prop: 'name', label: '姓名', minWidth: 104, sortable: 'custom', showOverflowTooltip: true },
  { prop: 'idCard', label: '身份证', width: 140, sortable: 'custom', slot: 'idCard' },
  { prop: 'hasImage', label: '状态', width: 80, sortable: 'custom', slot: 'hasImage', align: 'center' },
  // —— 可选列：默认隐藏，从工具栏「列设置」里按需打开（显隐随 table-id 持久化）——
  { prop: 'age', label: '年龄', width: 72, align: 'center', hidden: true },
  { prop: 'gender', label: '性别', width: 72, align: 'center', hidden: true },
  { prop: 'group', label: '分组', minWidth: 96, hidden: true, showOverflowTooltip: true },
  { prop: 'geo', label: '坐标', width: 150, slot: 'geo', hidden: true },
  { prop: 'note', label: '备注', minWidth: 120, hidden: true, showOverflowTooltip: true },
  { prop: 'restored', label: '修复', width: 76, slot: 'restored', align: 'center', hidden: true },
  { prop: 'actions', label: '操作', width: 104, slot: 'actions', fixed: 'right', align: 'center' },
]

/**
 * 表格 loader：ReTable 注入 page/pageSize，params 来自 {@link tableParams}
 * （检索词/状态/排序任一变化都会让它自动回第 1 页重查）。
 *
 * @param p ReTable 传入的分页与查询参数
 * @return 分页结果（total 为服务端命中数）
 *
 * 返回类型保持裸 RePageResult：ReTableLoader 形参类型是非泛型的，
 * 声明成 RePageResult<Row> 反而赋不过去（TS2322）。
 * 与全仓其余 26 个 loader 的写法一致，行类型在返回处显式收敛。
 */
async function tableLoader(p: ReTableLoadParams): Promise<RePageResult> {
  const params = (p.params ?? {}) as Record<string, unknown>
  const kw = String(params.keyword ?? '').trim()
  const st = String(params.status ?? '')
  const data = await apiService.listFaces({
    page: p.page,
    size: p.pageSize,
    keyword: kw || undefined,
    status: st || undefined,
    sortField: String(params.sortField ?? '') || undefined,
    sortOrder: String(params.sortOrder ?? '') || undefined,
    group: group.value,
  })
  const rows = data.items.map((s) => toRow(s as Record<string, unknown>))
  // 回填当前页行：表格 viewer 宿主按它渲染可放大的图片；行变了就重建 viewer
  tableRows.value = rows
  void mountViewer()
  return {
    total: data.total,
    // Row 是带具体字段的展示行，对 RePageResult 的 Record<string, unknown> 形参做一次显式收敛；
    // 运行时值没有任何转换，ReTable 也只按列的 prop 取字段，不受这个断言影响。
    items: rows as unknown as Record<string, unknown>[],
  }
}

/**
 * 列头排序 → 写回 {@link tableParams}（触发 ReTable 回第 1 页重查）。
 *
 * @param payload 列头排序载荷（prop + ascending/descending/null）
 */
function onTableSort(payload: { prop?: string; order?: string | null }) {
  const order = payload?.order
  sortField.value = order ? String(payload.prop ?? '') : ''
  sortOrder.value = order === 'descending' ? 'desc' : order ? 'asc' : ''
}

/**
 * 表格勾选 → 同步到批量删除条（与网格/列表共用同一个 {@link selected}）。
 *
 * @param rows 当前勾选的行
 */
function onTableSelection(rows: Array<Record<string, unknown>>) {
  selected.value = new Set(rows.map((r) => String(r.id ?? '')))
}

/**
 * 把 viewerjs 挂到当前视图的图片容器上；图片节点重渲染后必须重建
 * （viewerjs 在初始化时快照图片清单，之后 DOM 增删图它感知不到）。
 *
 * <p>三个视图各挂一个实例：网格/列表挂在视图容器上（点容器内任意图即可放大/切换），
 * 表格挂在旁路宿主上（表格行由 ReTable 内部渲染，没有可挂载的图片容器）。</p>
 */
async function mountViewer() {
  await nextTick()
  gridViewer?.destroy()
  gridViewer = null
  listViewer?.destroy()
  listViewer = null
  tableViewer?.destroy()
  tableViewer = null
  const options = { navbar: false, toolbar: true, title: false }
  if (gridRef.value) gridViewer = new Viewer(gridRef.value, options)
  if (listRef.value) listViewer = new Viewer(listRef.value, options)
  if (tableViewerRef.value) tableViewer = new Viewer(tableViewerRef.value, options)
}

function openEnroll() {
  if (!modelConfig.faceReady) {
    message.warning('人脸识别未启用：请先到「系统设置 → 默认模型 → 人脸识别」配置检测模型与特征模型')
    return
  }
  if (faceUnregistered.value.length) {
    message.error(faceUnregisteredMsg.value)
    return
  }
  editItem.value = null
  enrollVisible.value = true
}

/**
 * 修复存量 `onnx:modelName` 配置：人脸设置应存裸模型名（后端 FaceClientManager
 * 按 ModelRegistry 裸 key 查会话），把带前缀的值去掉前缀重写用户覆盖，再刷新门禁。
 */
async function fixUnregisteredModels() {
  const entries = faceUnregistered.value
  if (!entries.length) return
  const payload: Record<string, string> = {}
  for (const field of entries) {
    const raw = String(configuredValue(modelConfig.faceMerged, field) ?? '')
    payload[field] = raw.includes(':') ? raw.slice(raw.indexOf(':') + 1) : raw
  }
  if (!Object.keys(payload).length) return
  try {
    fixingModels.value = true
    await apiService.updateUserGroupOverrides('face', payload)
    await modelConfig.refresh()
    await load(page.value)
    message.success('已修复人脸检测 / 特征模型名称，可以重新登记了')
  } catch (e: any) {
    message.error('修复模型名称失败：' + (e?.message ?? e))
  } finally {
    fixingModels.value = false
  }
}

/**
 * 打开「编辑信息」：把当前行转成 FaceEnrollDialog 需要的 record 形状。
 *
 * <p>编辑只改档案字段，不重跑检测 —— 所以不需要照片在本地。</p>
 *
 * @param item 列表行
 */
function openEdit(item: Row) {
  editItem.value = {
    id: item.id,
    name: item.name,
    age: item.age,
    gender: item.gender,
    hair: item.hair,
    idCard: item.idCard,
    photogenic: item.photogenic,
    note: item.note,
    // 经纬度必须回填：编辑弹窗保存时会整体回写档案元数据，
    // 少了这两项就等于把用户填过的坐标静默清空。
    lat: item.lat,
    lng: item.lng,
    thumb: item.thumb,
    enrolledAt: 0,
    // 分组随行带走：编辑弹窗保存时会用同一分组回写，避免改完掉进 default
    group: item.group,
  }
  enrollVisible.value = true
}

/**
 * 打开「特征点」弹窗。
 *
 * <p>按钮在模型未配置时不渲染；这里再挡一道（配置可能在会话中途被改空），
 * 不让一个必然回「能力未启用」的请求打到后端。</p>
 *
 * @param item 列表行
 */
function openLandmark(item: Row) {
  if (!landmarkReady.value) {
    message.info('人脸关键点模型未配置：请先在「系统配置 → 人脸识别」中配置 landmark_model')
    return
  }
  lmItem.value = item
  lmVisible.value = true
}

function toggleSelect(item: Row) {
  const s = selected.value
  if (s.has(item.id)) s.delete(item.id)
  else s.add(item.id)
  // Set 是浅响应：换一个实例触发更新
  selected.value = new Set(s)
}

function clearSelection() {
  selected.value = new Set()
  // 表格视图有自己的勾选状态（ReTable 内部），不同步清会留下「看着没选、批量还删」的幽灵态
  tableRef.value?.clearAllSelection()
}

/**
 * 点缩略图放大：按当前视图选 viewerjs 实例与宿主，在宿主 DOM 里按
 * {@code data-face-id} 定位图片序号后 view(idx)。
 *
 * <p>序号必须按**宿主 DOM 里的可见图片**算，不能按 visibleItems 行号算：
 * 无图行不渲染 img，两种序号会错位，点 A 放大出 B。宿主未就绪或找不到图片时
 * 退回新开页，保证任何视图都有可用的放大路径。</p>
 *
 * @param item 展示行
 */
function preview(item: Row) {
  // 隐私开关关闭时不允许任何预览路径（含 viewerjs），否则「隐藏」形同虚设
  if (!showFaces.value) {
    message.info('人脸图当前处于隐藏状态，请先打开页头的显示开关')
    return
  }
  if (!item.thumb) {
    message.info('该条没有人脸图（老数据可能两边都没有，重新登记一次即可）')
    return
  }
  const inst = viewMode.value === 'grid' ? gridViewer : viewMode.value === 'list' ? listViewer : tableViewer
  const host = viewMode.value === 'grid' ? gridRef.value : viewMode.value === 'list' ? listRef.value : tableViewerRef.value
  if (inst && host) {
    const imgs = host.querySelectorAll<HTMLImageElement>('img[data-face-id]')
    const idx = Array.from(imgs).findIndex((el) => el.dataset.faceId === item.id)
    if (idx >= 0) {
      if ((imgs[idx].getAttribute('src') ?? '') === pendingPlaceholder) {
        message.info('图片加载中，请稍候再点')
        return
      }
      inst.view(idx)
      return
    }
  }
  // 宿主未就绪 / 该行不在当前宿主里：直接新开页放大（与表格兜底同一行为）
  window.open(item.thumb, '_blank')
}

/**
 * 删除一条：先删服务端，成功后再清本地缩略图。
 *
 * <p>顺序不能反 —— 先清本地再删服务端，一旦服务端失败，
 * 会留下「列表里有、永远没头像」的条目。</p>
 */
async function removeOne(item: Row) {
  const label = item.name || item.id
  try {
    await ElMessageBox.confirm(
      `确定把「${label}」从人脸底库删除？删除后不再参与 1:N 识别，且无法恢复。`,
      '删除人脸',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  } catch { return }
  busy.value = true
  try {
    const ok = await apiService.deleteFace(item.id, group.value)
    if (!ok) {
      // 后端返回 false 表示「这次删除没生效」。不要直接报错——先回读一次：
      // 有些旧实例在「DB 有行、内存快照没有」时会返回 false，但行其实已经删掉了；
      // 以列表为准再判一次，避免把「已删除」显示成「删除失败」。
      await load(page.value)
      const stillThere = visibleItems.value.some((r) => r.id === item.id)
      if (stillThere) {
        message.error('删除失败：底库未确认删除')
        return
      }
      registry.remove(item.id, group.value)
      if (activeRow.value?.id === item.id) activeRow.value = null
      message.success(`已删除：${label}`)
      return
    }
    // 只删本组的本地档案：同一个 id 在别的分组里也是合法记录
    registry.remove(item.id, group.value)
    selected.value.delete(item.id)
    selected.value = new Set(selected.value)
    // 删掉的正是抽屉里那个人：收起档案，别留一张已不存在的记录
    if (activeRow.value?.id === item.id) activeRow.value = null
    message.success(`已删除：${label}`)
    await load(page.value)
  } catch (e: any) {
    message.error('删除失败：' + (e?.message ?? e))
  } finally {
    busy.value = false
  }
}

async function removeSelected() {
  const ids = [...selected.value]
  if (!ids.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条人脸？删除后无法恢复。`, '批量删除', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    })
  } catch { return }
  busy.value = true
  let okCount = 0
  try {
    for (const id of ids) {
      try {
        if (await apiService.deleteFace(id, group.value)) { registry.remove(id, group.value); okCount++ }
      } catch { /* 单条失败继续，最后统一报数 */ }
    }
    message[okCount === ids.length ? 'success' : 'warning'](`已删除 ${okCount}/${ids.length} 条`)
    clearSelection()
    // 抽屉里那个人若在删除范围内，一并收起（否则会停在一条已不存在的档案上）
    if (activeRow.value && ids.includes(activeRow.value.id)) activeRow.value = null
    await load(page.value)
  } finally {
    busy.value = false
  }
}

/**
 * 修复人脸并重新入库（5.2）。
 *
 * <p>流程：取原图（没有就退裁剪脸）→ {@code POST /face/restore} 超分/去噪 →
 * 用修复后的图**重新走一遍登记管线**，并把 {@code restored:true} 写进档案。
 * 最后这步是必须的：特征向量必须来自修复后的图像，否则图变了、向量还是旧的，
 * 「修复」只是个装饰。</p>
 *
 * <p>档案字段必须**整体回写**：登记接口的 metadata 是覆盖语义，只传
 * {@code restored} 会把姓名/身份证/年龄全清空，等于抹掉这条档案。</p>
 *
 * @param item 目标行
 */
/**
 * 修复单条的公共核心：取原图（老数据退登记脸）→ 修复模型 → 带全量档案回写同组。
 *
 * @param item 目标行
 * @return 修复后入库成功的 blob
 * @throws Error 无图 / 修复失败 / 入库失败（message 由调用方统一弹）
 */
async function repairCore(item: Row): Promise<Blob> {
  // 优先原图：修复模型在原图上的效果与用户当初拍到的那张照片一致；
  // 只有老数据没有原图时才退裁剪脸
  const src = (await apiService.originalImageBlob(item.id, group.value))
    || (await apiService.faceImageBlob(item.id, group.value))
  if (!src) throw new Error('该条没有可修复的图片，请重新登记一次')
  const repaired = await apiService.restoreFace(src, 'face.png')
  if (!repaired) {
    throw new Error('修复失败：请确认「系统设置 → 默认模型 → 人脸识别 → 修复模型」已配置')
  }
  const meta = { ...item.meta, restored: true, restoredAt: Date.now() }
  // 重新入库必须回到**同一条记录所在的组**，否则会凭空多出一条 default 里的副本
  await apiService.enrollFace(item.id, repaired, meta, 'face-restored.png', group.value)
  return repaired
}

async function repairOne(item: Row) {
  const label = item.name || item.id
  busy.value = true
  try {
    await repairCore(item)
    message.success(`「${label}」已修复并重新入库`)
    await load(page.value)
  } catch (e: any) {
    message.error(e?.message ?? String(e))
  } finally {
    busy.value = false
  }
}

/** 批量修复进行中（条上的 loading 态；busy 同时置真，复用既有按钮禁用口径） */
const repairingBatch = ref(false)

/**
 * 批量修复勾选条目：逐张走单条修复核心，单条失败不影响其余；
 * 结束后回第一页刷新（修复会改写登记图与向量）。
 */
async function repairSelected() {
  const ids = [...selected.value]
  if (!ids.length || repairingBatch.value) return
  // 勾选可能来自网格/列表/表格任一视图：两边当前页行合起来查
  const pool = new Map<string, Row>()
  for (const r of [...visibleItems.value, ...tableRows.value]) pool.set(r.id, r)
  const rows = ids.map((id) => pool.get(id)).filter((r): r is Row => !!r)
  if (!rows.length) {
    message.warning('请先勾选要修复的条目')
    return
  }
  repairingBatch.value = true
  busy.value = true
  let ok = 0
  const failed: string[] = []
  try {
    for (const r of rows) {
      try {
        await repairCore(r)
        ok++
      } catch (e: any) {
        failed.push(`${r.name || r.id}：${e?.message ?? e}`)
      }
    }
    if (ok && failed.length) {
      message.success(`批量修复完成：成功 ${ok} 条，失败 ${failed.length} 条`)
      message.warning(failed.slice(0, 3).join('；'))
    } else if (ok) {
      message.success(`批量修复完成：成功 ${ok} 条`)
    } else {
      message.error(`批量修复全部失败：${failed[0] ?? '未知原因'}`)
    }
    await load(page.value)
  } finally {
    repairingBatch.value = false
    busy.value = false
  }
}

/* ── 以图搜人（1:N 检索） ─────────────────────────────────────── */

const searchVisible = ref(false)
const searchDragover = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchFile = ref<File | null>(null)
const searchPreviewUrl = ref('')
const searching = ref(false)
const searchResult = ref<FaceIdentifyResult | null>(null)
/** 检索范围：当前分组 / 全部分组（已有结果时切范围会自动按新范围重查） */
const searchScope = ref<'current' | 'all'>('current')
/** 前端相似度阈值（%）：只过滤展示，不影响后端检索 */
const searchMinScorePct = ref(0)

/**
 * 检索命中视图：按相似度降序，补齐展示字段（姓名/脱敏身份证/缩略图地址）。
 *
 * <p>hits 的 metadata 是登记时原样存进去的档案字段，命中条目即使不在当前页
 * 也能完整展示；本机登记簿只作姓名兜底。</p>
 */
const searchHits = computed(() => {
  const hits = searchResult.value?.hits ?? []
  return [...hits]
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
    .map((h) => {
      const meta = (h.metadata ?? {}) as Record<string, unknown>
      const id = String(h.id ?? '')
      const local = registry.byId(id, group.value)
      return {
        id,
        score: Number(h.score) || 0,
        name: String(meta.name ?? meta.label ?? local?.name ?? '') || '未命名',
        idCard: String(meta.idCard ?? local?.idCard ?? ''),
        thumb: thumbFor(id),
      }
    })
})

/** 阈值过滤后的命中视图（分数降序不变；阈值只在前端过滤展示） */
const searchHitsView = computed(() => {
  const min = Number(searchMinScorePct.value) || 0
  if (min <= 0) return searchHits.value
  return searchHits.value.filter((h) => scoreToPct(h.score) >= min - 1e-9)
})

/** 切检索范围：已有待检索照片且出过结果时，按新范围自动重查一次 */
watch(searchScope, () => {
  if (searchFile.value && searchResult.value && !searching.value) void runSearch()
})

/**
 * 相似度归一为百分比：余弦 0~1 → ×100；>1 视为后端已给百分数。
 *
 * <p>展示（{@link formatScore}）与前端阈值过滤（searchHitsView / dupHits）
 * 共用这一口径，保证「看到的 %」和「按阈值筛的 %」永远一致，
 * 不会出现后端换算口径变化时滑块悄悄失效。</p>
 */
function scoreToPct(v: unknown): number {
  const n = Number(v)
  if (!Number.isFinite(n)) return 0
  return n <= 1 ? n * 100 : n
}

/** 相似度展示口径：走 {@link scoreToPct} 归一后保留 1 位小数 */
function formatScore(v: unknown): string {
  const n = Number(v)
  if (!Number.isFinite(n)) return '—'
  return `${scoreToPct(v).toFixed(1)}%`
}

/**
 * 导出当前命中（阈值过滤后）为 CSV：序号 / 姓名 / 脱敏身份证 / 相似度。
 *
 * <p>与台账导出同一套 BOM + CRLF 口径，Excel 直接打开不乱码；身份证不出明文。</p>
 */
function exportSearchHits() {
  const hits = searchHitsView.value
  if (!hits.length) return
  const header = ['序号', '姓名', '身份证(脱敏)', '相似度']
  const lines = [header.map(csvCell).join(',')]
  hits.forEach((h, i) => {
    lines.push([
      csvCell(i + 1),
      csvCell(h.name),
      csvCell(maskIdCard(h.idCard)),
      csvCell(formatScore(h.score)),
    ].join(','))
  })
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeGroup = group.value.replace(/[\\/:*?"<>|]/g, '_')
  a.href = url
  a.download = `以图搜人_${safeGroup}_${hits.length}条.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  message.success(`已导出 ${hits.length} 条命中`)
}

function openSearch() {
  // 与登记同一套门禁：检索走的是同一条「检测 → 特征」管线
  if (!modelConfig.faceReady) {
    message.warning('人脸识别未启用：请先到「系统设置 → 默认模型 → 人脸识别」配置检测模型与特征模型')
    return
  }
  if (faceUnregistered.value.length) {
    message.error(faceUnregisteredMsg.value)
    return
  }
  searchVisible.value = true
}

function pickSearchFile() {
  searchInputRef.value?.click()
}

function onSearchDrop(e: DragEvent) {
  searchDragover.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setSearchFile(f)
}

/** 剪贴板里第一张图片（没有则返回 null） */
function fileFromClipboard(e: ClipboardEvent): File | null {
  const items = e.clipboardData?.items
  if (!items) return null
  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      const f = it.getAsFile()
      if (f) return f
    }
  }
  return null
}

/** 搜人弹窗支持 Ctrl+V 直接粘贴剪贴板图片 */
function onSearchPaste(e: ClipboardEvent) {
  const f = fileFromClipboard(e)
  if (f) {
    e.preventDefault()
    setSearchFile(f)
  }
}

function onSearchPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) setSearchFile(f)
  input.value = ''
}

function setSearchFile(f: File) {
  if (!f.type.startsWith('image/')) {
    message.warning('请选择图片文件')
    return
  }
  clearSearchFile()
  searchFile.value = f
  searchPreviewUrl.value = URL.createObjectURL(f)
}

function clearSearchFile() {
  if (searchPreviewUrl.value) URL.revokeObjectURL(searchPreviewUrl.value)
  searchPreviewUrl.value = ''
  searchFile.value = null
  searchResult.value = null
}

async function runSearch() {
  const f = searchFile.value
  if (!f || searching.value) return
  searching.value = true
  searchResult.value = null
  try {
    const groups = searchScope.value === 'all' ? undefined : [normalizeGroupName(group.value)]
    const res = await apiService.identifyFace(f, f.name || 'search.png', groups)
    searchResult.value = res
    if (res.hits.length) {
      message.success(`命中 ${res.hits.length} 条，最高相似度 ${formatScore(res.bestScore ?? res.hits[0]?.score)}`)
    } else {
      message.info('没有命中任何人脸')
    }
  } catch (e: any) {
    message.error('检索失败：' + (e?.message ?? e))
  } finally {
    searching.value = false
  }
}

/**
 * 点命中项 → 打开档案抽屉。
 *
 * <p>命中 id 不一定在当前页（网格/表格都只加载当页）：查得到就用已加载行，
 * 查不到就用命中 metadata 现造一行展示快照 —— 抽屉只作展示，不依赖回查。</p>
 */
function activateHit(h: { id: string }) {
  // 命中可能来自搜人弹窗或查重弹窗：两边都找一遍 metadata
  const meta = (searchResult.value?.hits.find((x) => String(x.id) === h.id)
    ?? dupResult.value?.hits.find((x) => String(x.id) === h.id))?.metadata ?? {}
  const row = visibleItems.value.find((r) => r.id === h.id)
    ?? toRow({ id: h.id, metadata: meta, hasImage: true, group: group.value })
  searchVisible.value = false
  dupVisible.value = false
  activate(row)
}

/* ── 登记查重：待登记照片先做一次 1:N 检索，≥ 阈值判疑似重复 ── */

const dupVisible = ref(false)
const dupDragover = ref(false)
const dupInputRef = ref<HTMLInputElement | null>(null)
const dupFile = ref<File | null>(null)
const dupPreviewUrl = ref('')
const dupChecking = ref(false)
const dupScope = ref<'current' | 'all'>('current')
const dupResult = ref<FaceIdentifyResult | null>(null)
/** 疑似重复判定阈值（与后端注册/比对常用阈值同源的经验值） */
/** 疑似重复判定阈值（%）：与后端注册/比对常用阈值同源的经验值 */
const dupThresholdPct = 85

/** 查重命中视图：按分数降序，只留 ≥ 阈值的条目，补齐展示字段 */
const dupHits = computed(() => {
  const hits = dupResult.value?.hits ?? []
  return [...hits]
    .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
    .filter((h) => scoreToPct(h.score) >= dupThresholdPct)
    .map((h) => {
      const meta = (h.metadata ?? {}) as Record<string, unknown>
      const id = String(h.id ?? '')
      const local = registry.byId(id, group.value)
      return {
        id,
        score: Number(h.score) || 0,
        name: String(meta.name ?? meta.label ?? local?.name ?? '') || '未命名',
        idCard: String(meta.idCard ?? local?.idCard ?? ''),
        thumb: thumbFor(id),
      }
    })
})

/** 查重与登记同一条管线，门禁口径同 openSearch */
function openDupCheck() {
  if (!modelConfig.faceReady) {
    message.warning('人脸识别未启用：请先到「系统设置 → 默认模型 → 人脸识别」配置检测模型与特征模型')
    return
  }
  if (faceUnregistered.value.length) {
    message.error(faceUnregisteredMsg.value)
    return
  }
  dupVisible.value = true
}

function pickDupFile() {
  dupInputRef.value?.click()
}

function onDupDrop(e: DragEvent) {
  dupDragover.value = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setDupFile(f)
}

function onDupPaste(e: ClipboardEvent) {
  const f = fileFromClipboard(e)
  if (f) {
    e.preventDefault()
    setDupFile(f)
  }
}

function onDupPicked(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) setDupFile(f)
  input.value = ''
}

function setDupFile(f: File) {
  if (!f.type.startsWith('image/')) {
    message.warning('请选择图片文件')
    return
  }
  clearDupFile()
  dupFile.value = f
  dupPreviewUrl.value = URL.createObjectURL(f)
}

function clearDupFile() {
  if (dupPreviewUrl.value) URL.revokeObjectURL(dupPreviewUrl.value)
  dupPreviewUrl.value = ''
  dupFile.value = null
  dupResult.value = null
}

async function runDupCheck() {
  const f = dupFile.value
  if (!f || dupChecking.value) return
  dupChecking.value = true
  dupResult.value = null
  try {
    const groups = dupScope.value === 'all' ? undefined : [normalizeGroupName(group.value)]
    const res = await apiService.identifyFace(f, f.name || 'dup-check.png', groups)
    dupResult.value = res
    if (dupHits.value.length) {
      message.warning(`发现 ${dupHits.value.length} 条疑似重复（相似度 ≥ ${dupThresholdPct}%），请先核对档案`)
    } else {
      message.success('未发现疑似重复，可以登记')
    }
  } catch (e: any) {
    message.error('查重失败：' + (e?.message ?? e))
  } finally {
    dupChecking.value = false
  }
}

// 关弹窗即清照片与结果（临时 blob 地址一并释放）
watch(dupVisible, (v) => {
  if (!v) clearDupFile()
})

/* ── 1:1 比对：两张照片各检一张脸，走后端 compare 出相似度与结论 ── */

interface CmpSlot {
  file: File | null
  previewUrl: string
  dragover: boolean
}

const cmpVisible = ref(false)
const cmpChecking = ref(false)
const cmpResult = ref<FaceCompareResult | null>(null)
const cmpError = ref('')
const cmpSlots = ref<CmpSlot[]>([
  { file: null, previewUrl: '', dragover: false },
  { file: null, previewUrl: '', dragover: false },
])
/** 两个上传位的 file input 引用（v-for 里用函数 ref 按位收） */
const cmpInputRefs: Array<HTMLInputElement | null> = [null, null]

function setCmpInput(el: unknown, si: number) {
  cmpInputRefs[si] = (el as HTMLInputElement | null) ?? null
}

/** 比对与登记同一条管线，门禁口径同 openSearch */
function openCompare() {
  if (!modelConfig.faceReady) {
    message.warning('人脸识别未启用：请先到「系统设置 → 默认模型 → 人脸识别」配置检测模型与特征模型')
    return
  }
  if (faceUnregistered.value.length) {
    message.error(faceUnregisteredMsg.value)
    return
  }
  cmpVisible.value = true
}

function pickCmpFile(si: number) {
  cmpInputRefs[si]?.click()
}

function setCmpFile(f: File, si: number) {
  if (!f.type.startsWith('image/')) {
    message.warning('请选择图片文件')
    return
  }
  clearCmpFile(si)
  const slot = cmpSlots.value[si]
  if (!slot) return
  slot.file = f
  slot.previewUrl = URL.createObjectURL(f)
}

function clearCmpFile(si: number) {
  const slot = cmpSlots.value[si]
  if (!slot) return
  if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl)
  slot.previewUrl = ''
  slot.file = null
  cmpResult.value = null
  cmpError.value = ''
}

function onCmpDrop(e: DragEvent, si: number) {
  const slot = cmpSlots.value[si]
  if (slot) slot.dragover = false
  const f = e.dataTransfer?.files?.[0]
  if (f) setCmpFile(f, si)
}

function onCmpPaste(e: ClipboardEvent, si: number) {
  const f = fileFromClipboard(e)
  if (f) {
    e.preventDefault()
    setCmpFile(f, si)
  }
}

function onCmpPicked(e: Event, si: number) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (f) setCmpFile(f, si)
  input.value = ''
}

async function runCompare() {
  const a = cmpSlots.value[0]?.file
  const b = cmpSlots.value[1]?.file
  if (!a || !b || cmpChecking.value) return
  cmpChecking.value = true
  cmpResult.value = null
  cmpError.value = ''
  try {
    const res = await apiService.compareFaces(a, b, a.name || 'a.png', b.name || 'b.png')
    cmpResult.value = res
    message.info(`1:1 比对：相似度 ${formatScore(res.similarity)}，${res.matched ? '判定为同一人' : '判定为不同人'}`)
  } catch (e: any) {
    cmpError.value = '比对失败：' + (e?.message ?? e)
  } finally {
    cmpChecking.value = false
  }
}

// 关弹窗即清两张照片与结论（临时 blob 地址一并释放）
watch(cmpVisible, (v) => {
  if (!v) {
    for (const s of cmpSlots.value) {
      if (s.previewUrl) URL.revokeObjectURL(s.previewUrl)
      s.previewUrl = ''
      s.file = null
      s.dragover = false
    }
    cmpResult.value = null
    cmpError.value = ''
  }
})

/* ── 登记坐标 → 地图外链 ── */

/**
 * 打开登记坐标的地图页（百度地图 latlng 直链）。
 *
 * <p>登记坐标以 WGS-84/GCJ-02 口径存库，百度 BD-09 有百米级偏移；这里只做
 * 「跳过去看个大概位置」的参考链接，不做坐标转换。</p>
 */
function openMapLink(row: Row) {
  const hasLat = row.lat != null && Number.isFinite(Number(row.lat))
  const hasLng = row.lng != null && Number.isFinite(Number(row.lng))
  if (!hasLat && !hasLng) return
  const lat = hasLat ? Number(row.lat) : 0
  const lng = hasLng ? Number(row.lng) : 0
  window.open(`https://map.baidu.com/?latlng=${lat},${lng}&title=登记坐标`, '_blank', 'noopener')
}

/* ── 缩略图加载失败占位：记下加载失败的 id，改画占位态 ── */

const brokenThumbs = ref<Set<string>>(new Set())

function markThumbBroken(id: string) {
  if (brokenThumbs.value.has(id)) return
  const next = new Set(brokenThumbs.value)
  next.add(id)
  brokenThumbs.value = next
}

function isThumbBroken(id: string): boolean {
  return brokenThumbs.value.has(id)
}

/* ── 批量导入（文件名 → 姓名，逐张走登记管线） ────────────────── */

interface BatchItem {
  key: string
  file: File
  /** 文件名（去扩展名）映射出的姓名 */
  name: string
  status: 'pending' | 'running' | 'ok' | 'fail'
  error?: string
}

const batchVisible = ref(false)
const batchDragover = ref(false)
const batchInputRef = ref<HTMLInputElement | null>(null)
const batchFiles = ref<BatchItem[]>([])
const batchRunning = ref(false)

const batchDoneCount = computed(() =>
  batchFiles.value.filter((f) => f.status === 'ok' || f.status === 'fail').length,
)
const batchPercent = computed(() =>
  batchFiles.value.length ? Math.round((batchDoneCount.value / batchFiles.value.length) * 100) : 0,
)

function openBatchImport() {
  if (!modelConfig.faceReady) {
    message.warning('人脸识别未启用：请先到「系统设置 → 默认模型 → 人脸识别」配置检测模型与特征模型')
    return
  }
  if (faceUnregistered.value.length) {
    message.error(faceUnregisteredMsg.value)
    return
  }
  // 上一次清单已结算完（或从未开始）才清空；导入进行中重开弹窗能看到进度
  if (!batchRunning.value) batchFiles.value = []
  batchVisible.value = true
}

function pickBatchFiles() {
  batchInputRef.value?.click()
}

function onBatchDrop(e: DragEvent) {
  batchDragover.value = false
  if (e.dataTransfer?.files?.length) addBatchFiles(e.dataTransfer.files)
}

function onBatchPicked(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) addBatchFiles(input.files)
  input.value = ''
}

function addBatchFiles(list: FileList | File[]) {
  const all = Array.from(list)
  const files = all.filter((f) => f.type.startsWith('image/'))
  if (files.length < all.length) message.warning(`${all.length - files.length} 个非图片文件已忽略`)
  for (const f of files) {
    batchFiles.value.push({
      // 同名同尺寸同修改时间的重复拖入也各自成条：key 只用于 v-for 复用
      key: `${f.name}-${f.size}-${f.lastModified}-${batchFiles.value.length}`,
      file: f,
      name: f.name.replace(/\.[^.]+$/, '').trim() || '未命名',
      status: 'pending',
    })
  }
}

function removeBatchFile(index: number) {
  batchFiles.value.splice(index, 1)
}

/**
 * 逐张登记：id 生成与单个登记弹窗同一口径；档案只填姓名（文件名映射），
 * 其余字段留空待后续补录。单张失败不中断，最后统一报数并刷新列表。
 */
async function runBatchImport() {
  if (batchRunning.value || !batchFiles.value.length) return
  batchRunning.value = true
  let ok = 0
  let fail = 0
  try {
    for (const item of batchFiles.value) {
      if (item.status === 'ok') { ok++; continue }
      item.status = 'running'
      try {
        const id = `face-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const metadata = {
          label: item.name,
          name: item.name,
          age: null,
          gender: '未知',
          hair: '',
          idCard: '',
          photogenic: 3,
          note: '批量导入',
          residence: null,
          phone: null,
          lat: null,
          lng: null,
        }
        await apiService.enrollFace(id, item.file, metadata, item.file.name || 'batch.png', group.value)
        item.status = 'ok'
        item.error = undefined
        ok++
      } catch (e: any) {
        item.status = 'fail'
        item.error = String(e?.message ?? e)
        fail++
      }
    }
    if (fail === 0) message.success(`批量导入完成：成功 ${ok} 张`)
    else message.warning(`批量导入完成：成功 ${ok} 张、失败 ${fail} 张，失败原因见列表`)
    await load(page.value)
  } finally {
    batchRunning.value = false
  }
}

/** 字节数展示（批量导入清单用） */
function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/* ── 批量移动分组（同 id 在目标组重新入库，成功后才删本组） ───── */

const moveVisible = ref(false)
const moveTarget = ref('')
const moving = ref(false)
const moveDone = ref(0)
const moveTotal = ref(0)
const movePercent = computed(() => (moveTotal.value ? Math.round((moveDone.value / moveTotal.value) * 100) : 0))

function openMoveSelected() {
  if (!selected.value.size) {
    message.info('请先勾选要移动的条目')
    return
  }
  moveTarget.value = ''
  moveVisible.value = true
}

/**
 * 逐条移动：取本组登记图 → 带原档案元数据在目标组重新登记（同一 id）→
 * 确认入库成功后才删本组记录。顺序不能反：先删后登的话，目标组登记失败
 * 就把原图弄丢了。单条失败不中断（该条保持原状），最后统一报数。
 */
async function moveSelected() {
  const target = moveTarget.value.trim()
  if (!target) {
    message.warning('请先选择或输入目标分组')
    return
  }
  if (normalizeGroupName(target) === normalizeGroupName(group.value)) {
    message.warning('目标分组与当前分组相同，无需移动')
    return
  }
  const ids = [...selected.value]
  if (!ids.length) return
  moving.value = true
  moveDone.value = 0
  moveTotal.value = ids.length
  const failures: string[] = []
  let ok = 0
  try {
    // 勾选可能跨页/被当前筛选挡住：按分组全量拉回建 id→行 映射（取档案元数据用）
    const byId = new Map<string, Row>()
    for (let p = 1; ; p++) {
      const data = await apiService.listFaces({ page: p, size: EXPORT_PAGE_SIZE, group: group.value })
      for (const s of data.items) {
        const r = toRow(s as Record<string, unknown>)
        byId.set(r.id, r)
      }
      if (data.items.length === 0 || byId.size >= data.total) break
    }
    for (const id of ids) {
      try {
        const row = byId.get(id)
        if (!row) throw new Error('该条已不在当前分组')
        const blob = await apiService.faceImageBlob(id, group.value)
        if (!blob) throw new Error('登记图不存在，无法迁移')
        // 档案元数据整体回写（restored 标记一并带走），语义同修复后的重新入库
        await apiService.enrollFace(id, blob, { ...row.meta }, 'face-move.png', target)
        const removed = await apiService.deleteFace(id, group.value)
        if (!removed) throw new Error('目标分组已入库，但本组记录删除未确认（请手动核对）')
        registry.remove(id, group.value)
        ok++
      } catch (e: any) {
        failures.push(`${byId.get(id)?.name || id}：${e?.message ?? e}`)
      } finally {
        moveDone.value++
      }
    }
    if (ok && !failures.length) message.success(`已把 ${ok} 条移动到「${target}」`)
    else if (ok) message.warning(`已移动 ${ok}/${ids.length} 条；失败 ${failures.length} 条：${failures.join('；')}`)
    else message.error(`移动失败：${failures.join('；')}`)
    clearSelection()
    // 抽屉里那位若被移走：快照还是旧分组的，收起避免误导
    if (activeRow.value && ids.includes(activeRow.value.id)) activeRow.value = null
    await load(page.value)
  } finally {
    moving.value = false
  }
}

/* ── 导出台账（CSV） ──────────────────────────────────────────── */

/** 导出进行中（按钮 loading / 禁用） */
const exporting = ref(false)
/** 单次导出上限：底库是敏感数据，导太多既慢也容易失控，超了明确提示分批 */
const EXPORT_LIMIT = 10000
/** 导出分页大小：取后端 listFaces 的单页上限，页数最少 */
const EXPORT_PAGE_SIZE = 500

/**
 * CSV 单元格转义：含逗号/引号/换行时整体包引号，内部引号翻倍。
 *
 * @param v 单元格原值
 * @return 可直接拼进 CSV 行的文本
 */
function csvCell(v: unknown): string {
  const s = String(v ?? '')
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * 按当前分组 + 检索词 + 状态筛选分页拉全量（不新增后端接口：listFaces 单页上限
 * {@link EXPORT_PAGE_SIZE}，循环翻页拼齐）。
 *
 * <p>超过 {@link EXPORT_LIMIT} 截断并明确提示，不静默少给。</p>
 */
async function fetchAllRows(): Promise<{ rows: Row[]; totalSeen: number }> {
  const rows: Row[] = []
  let totalSeen = 0
  for (let p = 1; ; p++) {
    const data = await apiService.listFaces({
      page: p,
      size: EXPORT_PAGE_SIZE,
      keyword: kwApplied.value || undefined,
      status: statusFilter.value !== 'all' ? statusFilter.value : undefined,
      group: group.value,
    })
    totalSeen = data.total
    rows.push(...data.items.map((s) => toRow(s as Record<string, unknown>)))
    if (data.items.length === 0 || rows.length >= data.total || rows.length >= EXPORT_LIMIT) break
  }
  if (totalSeen > EXPORT_LIMIT) {
    rows.length = EXPORT_LIMIT
    message.warning(`底库共 ${totalSeen} 条，超过单次导出上限 ${EXPORT_LIMIT} 条，本次仅导出前 ${EXPORT_LIMIT} 条`)
  }
  return { rows, totalSeen }
}

/**
 * 生成并下载 CSV：身份证走全站同一脱敏口径（{@link maskIdCard}），导出文件不落
 * 明文证件号；带 BOM（\uFEFF）与 CRLF，Excel 直接打开不乱码。
 *
 * @param rows 要导出的行
 * @param tag 文件名附加标记（空串 = 不带），如「勾选12条」
 */
function downloadCsv(rows: Row[], tag: string) {
  const header = ['姓名', '身份证(脱敏)', '性别', '年龄', '分组', '状态', '是否修复', '备注']
  const lines = [header.map(csvCell).join(',')]
  for (const r of rows) {
    lines.push([
      csvCell(r.name || '未命名'),
      csvCell(maskIdCard(r.idCard)),
      csvCell(r.gender || '未知'),
      csvCell(r.age ?? ''),
      csvCell(r.group),
      csvCell(r.hasImage ? '有图片' : '无图片'),
      csvCell(r.restored ? '已修复' : '未修复'),
      csvCell(r.note),
    ].join(','))
  }
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const ts = new Date()
  const pad = (n: number): string => String(n).padStart(2, '0')
  const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
  // 分组名直接进文件名：清掉文件系统非法字符，避免下载名被浏览器改写
  const safeGroup = group.value.replace(/[\\/:*?"<>|]/g, '_')
  a.href = url
  a.download = `人脸底库_${safeGroup}${tag ? `_${tag}` : ''}_${stamp}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** 导出台账 CSV：按当前筛选条件拉全量。 */
async function exportLedger() {
  if (exporting.value) return
  exporting.value = true
  try {
    const { rows } = await fetchAllRows()
    if (!rows.length) {
      message.info('当前条件下没有可导出的条目')
      return
    }
    downloadCsv(rows, '')
    message.success(`已导出 ${rows.length} 条台账`)
  } catch (e: any) {
    message.error('导出失败：' + (e?.message ?? e))
  } finally {
    exporting.value = false
  }
}

/**
 * 只导出勾选的条目：勾选可能跨页，按当前分组全量拉回后按 id 过滤。
 *
 * <p>勾选里若有已被他人删除的条目，按实际拉到的导出，并把差额讲清楚。</p>
 */
async function exportSelected() {
  if (exporting.value) return
  const ids = selected.value
  if (!ids.size) {
    message.info('请先勾选要导出的条目')
    return
  }
  exporting.value = true
  try {
    const { rows } = await fetchAllRows()
    const picked = rows.filter((r) => ids.has(r.id))
    if (!picked.length) {
      message.info('勾选的条目在当前分组里已不存在')
      return
    }
    if (picked.length < ids.size) {
      message.warning(`有 ${ids.size - picked.length} 条勾选记录已不在当前分组，未导出`)
    }
    downloadCsv(picked, `勾选${picked.length}条`)
    message.success(`已导出 ${picked.length} 条`)
  } catch (e: any) {
    message.error('导出失败：' + (e?.message ?? e))
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  // 先拉分组选项再拉列表：否则下拉里只有 default，用户看不到自己已有的分组
  await loadGroups()
  void load(1)
})
onBeforeUnmount(() => {
  gridViewer?.destroy()
  gridViewer = null
  listViewer?.destroy()
  listViewer = null
  tableViewer?.destroy()
  tableViewer = null
  authImages.dispose()
})
</script>

<style scoped src="./library-panel.css"></style>

<style scoped>
/* 仅有的一处人脸专有样式：无缩略图时的占位（图像底库恒有图，不需要） */
.fl-thumb-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--rm-text-secondary, var(--el-text-color-placeholder));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.lib-foot-warn {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
  padding: 6px 10px;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: color-mix(in srgb, var(--rm-warning, var(--el-color-warning)) 12%, transparent);
  color: var(--rm-text-regular, var(--el-text-color-regular));
  font-size: 12px;
  line-height: 1.6;
}

.fl-alert {
  margin: 0;
}

/* ── 表格视图（ReTable 内的槽位内容，作用域样式经插槽作用到这些节点）── */
.lib-table {
  width: 100%;
}

.lt-thumb {
  display: block;
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: var(--rm-radius-sm, var(--el-border-radius-base, 4px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  cursor: zoom-in;
}

.lt-thumb-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rm-text-secondary, var(--el-text-color-placeholder));
  cursor: default;
}

.lt-mono {
  font-family: var(--el-font-family, monospace);
  font-size: var(--rm-font-sm, var(--el-font-size-small));
}

.lt-actions {
  display: inline-flex;
  gap: 4px;
}

/* 表格视图 viewer 宿主：不可见但必须真实渲染（0×0 裁剪；display:none 会让图片不加载） */
.lt-viewer-host {
  position: fixed;
  width: 0;
  height: 0;
  overflow: hidden;
  pointer-events: none;
}

/* ==================== 07 分组页签专属样式 ==================== */
.fl07-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
  font-size: 12px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl07-metrics b {
  margin-left: 2px;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--rm-text, var(--el-text-color-primary));
}

/* 统计卡改成可点的筛选入口：按钮外观退回文本，交互态与分组页签同一套令牌 */
.fl07-metric {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 2px 6px;
  margin: 0;
  border: 1px solid transparent;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: inherit;
  cursor: pointer;
  transition: background var(--lib-transition, 0.2s ease), color var(--lib-transition, 0.2s ease),
    border-color var(--lib-transition, 0.2s ease);
}

.fl07-metric:hover {
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-text, var(--el-text-color-primary));
}

.fl07-metric:focus-visible {
  outline: 2px solid var(--rm-primary, var(--el-color-primary));
  outline-offset: 1px;
}

/* 选中态：与 fl07-tab.is-active 同源，表明「当前筛选就是这一格的口径」 */
.fl07-metric.is-on {
  background: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 12%, transparent);
  border-color: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 35%, transparent);
  color: var(--rm-primary-ink, var(--el-color-primary));
}

/* 「身份证已填」没有后端筛选参数，保持纯展示：不给可点反馈 */
.fl07-metric.is-static {
  cursor: default;
}

.fl07-metric.is-static:hover {
  background: transparent;
}

.fl07-tabs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 6px;
  border: 1px solid var(--lib-border, var(--el-border-color-lighter));
  border-radius: var(--lib-radius, var(--el-radius-lg, 12px));
  background: var(--lib-surface, var(--el-bg-color-overlay));
}

.fl07-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--rm-text-regular, var(--el-text-color-regular));
  font-size: 13px;
  line-height: 1.4;
  cursor: pointer;
  transition: background var(--lib-transition, 0.2s ease), color var(--lib-transition, 0.2s ease);
}

.fl07-tab:hover {
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-text, var(--el-text-color-primary));
}

.fl07-tab.is-active {
  background: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 12%, transparent);
  color: var(--rm-primary-ink, var(--el-color-primary));
  font-weight: 600;
}

.fl07-tab-count {
  display: inline-grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 16%, transparent);
  color: var(--rm-primary-ink, var(--el-color-primary));
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.fl07-tab:not(.is-active) .fl07-tab-count {
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl07-add-tab {
  width: 88px;
  margin-left: 4px;
}

.fl07-add-tab :deep(.el-select__wrapper) {
  min-height: 30px;
  border-radius: 999px;
  background: transparent;
  box-shadow: none;
}

.fl07-add-tab .el-select__placeholder {
  color: var(--rm-primary, var(--el-color-primary));
}

/* ==================== 02 方向：列表 + 常驻档案抽屉 ====================
   面板改成两栏网格：左栏是网格/列表/表格共用的列表位，右栏常驻档案。
   用 grid 分区而不是再包一层容器，是为了不动三个视图的既有结构 ——
   图像底库、重识别库与人脸底库共用 library-panel.css，这里只改人脸这一份，
   别把另外两个面板一起翻掉。 */
.lib-page .lib-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  grid-template-rows: auto minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 16px;
}

.lib-page .lib-panel > .lib-toolbar {
  grid-column: 1 / -1;
  grid-row: 1;
}

.lib-page .lib-panel > .lib-grid,
.lib-page .lib-panel > .lib-list,
.lib-page .lib-panel > .lib-table {
  grid-column: 1;
  grid-row: 2;
  min-width: 0;
}

.lib-page .lib-panel > .lib-pager {
  grid-column: 1;
  grid-row: 3;
}

.lib-page .lib-panel > .fl-drawer {
  grid-column: 2;
  grid-row: 2 / 4;
}

/* 「正在看」态：比勾选态弱一档 —— 勾选是批量删除的范围，别让两者混成一种颜色 */
.lib-cell.is-active {
  border-color: var(--lib-border, var(--el-border-color-lighter));
  box-shadow: inset 0 -2px 0 var(--rm-primary, var(--el-color-primary));
}

.lib-row.is-active {
  border-color: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 35%, var(--rm-border, var(--el-border-color-lighter)));
}

/* 表格视图的「正在看」行：对齐 vxe 行选中官方口径（9% 主色底纹 + 行首 2px 色条），
   弱于批量勾选态，两种高亮不混色 */
.lib-table :deep(tr.is-viewing) > td {
  background-color: color-mix(in srgb, var(--rm-primary, var(--el-color-primary)) 9%, var(--el-bg-color));
}

.lib-table :deep(tr.is-viewing) > td:first-child {
  box-shadow: inset 2px 0 0 var(--rm-primary, var(--el-color-primary));
}

/* ── 档案抽屉 ─────────────────────────────────────────── */
.fl-drawer {
  position: sticky;
  top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: calc(100vh - 160px);
  padding-left: 16px;
  border-left: 1px solid var(--rm-border, var(--el-border-color-lighter));
  overflow-y: auto;
}

/* 没选人时也给一栏高度：空着的一格若塌成 0，右栏边界会突然跳走 */
.fl-drawer.is-empty {
  justify-content: center;
  min-height: 260px;
}

.fl-drawer-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.fl-drawer-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.fl-drawer-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--rm-text, var(--el-text-color-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fl-drawer-sub {
  font-size: 12px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-drawer-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: transparent;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 13px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background var(--rm-transition, var(--el-transition-duration-fast, 0.2s) ease), color var(--rm-transition, var(--el-transition-duration-fast, 0.2s) ease);
}

.fl-drawer-close:hover {
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-text, var(--el-text-color-primary));
}

.fl-drawer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  min-height: 20px;
}

.fl-drawer-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 登记图：3:4 证件照比例，点开走 viewerjs 放大（与列表同一条预览路径） */
.fl-drawer-figure {
  width: 104px;
  height: 128px;
  border: 1px solid var(--rm-border, var(--el-border-color-lighter));
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  overflow: hidden;
  cursor: zoom-in;
}

.fl-drawer-figure img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fl-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.fl-metric {
  padding: 6px 8px;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.fl-metric dt {
  font-size: 11px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-metric dd {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--rm-text, var(--el-text-color-primary));
  font-variant-numeric: tabular-nums;
}

.fl-drawer-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-fields {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.fl-field {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 12px;
}

.fl-field dt {
  flex: 0 0 56px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-field dd {
  flex: 1;
  min-width: 0;
  margin: 0;
  color: var(--rm-text-regular, var(--el-text-color-regular));
  word-break: break-all;
}

/* 备注是长文本：标题压在上面，不跟内容抢一行 */
.fl-field.is-block {
  flex-direction: column;
  gap: 2px;
}

.fl-field.is-block dt {
  flex: none;
}

.fl-mono {
  font-family: var(--el-font-family, monospace);
  font-variant-numeric: tabular-nums;
}

.fl-drawer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--rm-border, var(--el-border-color-lighter));
}

.fl-drawer-actions .el-button {
  flex: 1 1 auto;
  min-width: 92px;
  margin-left: 0;
}

.fl-drawer-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 36px 8px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  text-align: center;
}

.fl-drawer-empty p {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--rm-text-regular, var(--el-text-color-regular));
}

.fl-drawer-empty span {
  font-size: 12px;
}

/* 窄屏：档案掉到列表下方，横排两栏会把表格挤到只剩滚动条 */
@media (max-width: 1240px) {
  .lib-page .lib-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .lib-page .lib-panel > .fl-drawer {
    grid-column: 1;
    grid-row: auto;
    position: static;
    max-height: none;
    padding: 12px 0 0;
    border-left: none;
    border-top: 1px solid var(--rm-border, var(--el-border-color-lighter));
  }

  .fl-drawer-figure {
    width: 88px;
    height: 110px;
  }
}

/* ── 增强件：缩略图悬浮放大 / 骨架屏 / 抽屉原图切换 ─────────── */

/* 悬浮放大（popover 内容图）：网格/列表/表格三个视图共用同一尺寸 */
.fl-zoom-img {
  display: block;
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

/* 原图模式：完整放进图框不裁脸（原始照片常为横幅，cover 会把人裁掉） */
.fl-drawer-figure.is-original img {
  object-fit: contain;
}

/* 抽屉「登记脸 / 原图」切换 */
.fl-drawer-mode {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.fl-mode-btn {
  padding: 2px 10px;
  border: none;
  border-radius: var(--el-radius-xs, 4px);
  background: transparent;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.fl-mode-btn:hover {
  color: var(--rm-text-primary, var(--el-text-color-primary));
}

.fl-mode-btn.is-active {
  background: var(--rm-primary, var(--el-color-primary));
  color: #fff;
}

/* 加载骨架：占位图本是透明 1×1，shimmer 给出「正在来」的预期 */
.fl-skeleton {
  position: relative;
  overflow: hidden;
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.fl-skeleton::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    var(--rm-skeleton-highlight, rgba(255, 255, 255, 0.45)),
    transparent
  );
  animation: fl-shimmer 1.4s infinite;
}

@keyframes fl-shimmer {
  100% {
    transform: translateX(100%);
  }
}

.lib-cell.is-skeleton,
.lib-row.is-skeleton {
  pointer-events: none;
}

.lib-cell.is-skeleton .lib-thumb {
  min-height: 120px;
}

.sk-line {
  display: block;
  height: 12px;
  border-radius: 4px;
}

.sk-line.sk-short {
  width: 60%;
}

.lib-row.is-skeleton .lib-row-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
}

/* ── 以图搜人弹窗 ─────────────────────────────────────────────── */

.fl-search-drop {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 148px;
  border: 1px dashed var(--rm-border, var(--el-border-color));
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.fl-search-drop:hover,
.fl-search-drop.is-dragover {
  border-color: var(--rm-primary, var(--el-color-primary));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.fl-search-preview {
  max-width: 100%;
  max-height: 128px;
  object-fit: contain;
}

.fl-search-clear {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--rm-surface, var(--el-bg-color));
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

.fl-file-input {
  display: none;
}

.fl-search-bar,
.fl-batch-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.fl-search-hint {
  color: var(--rm-text-tertiary, var(--el-text-color-placeholder));
  font-size: 12px;
}

.fl-search-empty {
  margin-top: 10px;
}

.fl-search-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
}

.fl-search-best {
  color: var(--rm-primary, var(--el-color-primary));
  font-weight: 600;
}

.fl-search-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 264px;
  margin-top: 8px;
  overflow-y: auto;
}

.fl-search-hit {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--rm-border, var(--el-border-color-lighter));
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.fl-search-hit:hover {
  border-color: var(--rm-primary, var(--el-color-primary));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.fl-hit-rank {
  flex: none;
  width: 20px;
  color: var(--rm-text-tertiary, var(--el-text-color-placeholder));
  font-size: 12px;
  text-align: center;
}

.fl-hit-thumb {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-xs, 4px);
  object-fit: cover;
}

span.fl-hit-thumb {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-text-tertiary, var(--el-text-color-placeholder));
}

.fl-hit-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.fl-hit-id {
  flex: none;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 12px;
  font-family: var(--rm-font-mono, var(--el-font-family, monospace));
}

.fl-hit-score {
  flex: none;
  min-width: 56px;
  color: var(--rm-primary, var(--el-color-primary));
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}

/* ── 批量导入弹窗 ─────────────────────────────────────────────── */

.fl-batch-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 110px;
  border: 1px dashed var(--rm-border, var(--el-border-color));
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.fl-batch-drop:hover,
.fl-batch-drop.is-dragover {
  border-color: var(--rm-primary, var(--el-color-primary));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.fl-batch-list {
  max-height: 216px;
  margin: 10px 0 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.fl-batch-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  font-size: 12px;
}

.fl-batch-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fl-batch-size {
  flex: none;
  color: var(--rm-text-tertiary, var(--el-text-color-placeholder));
}

.fl-batch-state {
  flex: none;
  min-width: 44px;
  text-align: center;
}

.fl-batch-state.is-ok {
  color: var(--rm-success, var(--el-color-success));
}

.fl-batch-state.is-fail {
  color: var(--rm-danger, var(--el-color-danger));
}

.fl-batch-state.is-running {
  color: var(--rm-primary, var(--el-color-primary));
}

.fl-batch-state.is-pending {
  color: var(--rm-text-tertiary, var(--el-text-color-placeholder));
}

.fl-batch-error {
  flex: none;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--rm-danger, var(--el-color-danger));
}

.fl-batch-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--rm-text-tertiary, var(--el-text-color-placeholder));
  cursor: pointer;
}

.fl-batch-remove:hover {
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
  color: var(--rm-danger, var(--el-color-danger));
}

.fl-batch-progress {
  margin-top: 10px;
}

/* ── 移动分组弹窗 ─────────────────────────────────────────────── */

.fl-move-tip {
  margin: 0 0 10px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 12px;
  line-height: 1.7;
}

.fl-move-select {
  width: 100%;
}

/* ==================== P0 增强：查重 / 1:1 比对 / 搜人补强 / 特征点叠加 ==================== */

/* 搜人/查重/比对拖拽区：tabindex=-1 只为接住 paste 事件，不给键盘焦点框 */
.fl-search-drop:focus {
  outline: none;
}

/* 搜人/查重弹窗的「范围 + 阈值 + 导出」选项行 */
.fl-search-opts {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
  background: var(--rm-bg-subtle, var(--el-fill-color-light));
}

.fl-opt-label {
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 12px;
  white-space: nowrap;
}

.fl-threshold-slider {
  flex: 1 1 120px;
  min-width: 100px;
  margin: 0 4px;
}

.fl-opt-value {
  min-width: 52px;
  color: var(--rm-primary, var(--el-color-primary));
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}

/* 1:1 比对：两个上传位并排 */
.fl-cmp-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.fl-cmp-slot {
  min-width: 0;
}

.fl-cmp-label {
  margin: 0 0 6px;
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-size: 12px;
  font-weight: 600;
}

.fl-cmp-slot .fl-search-drop {
  min-height: 120px;
}

/* 比对结论条 */
.fl-cmp-result {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: var(--rm-radius-sm, var(--el-radius-sm, 6px));
}

.fl-cmp-result.is-match {
  background: color-mix(in srgb, var(--rm-success, var(--el-color-success)) 12%, transparent);
}

.fl-cmp-result.is-mismatch {
  background: color-mix(in srgb, var(--rm-warning, var(--el-color-warning)) 12%, transparent);
}

.fl-cmp-score {
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--rm-text-primary, var(--el-text-color-primary));
}

.fl-cmp-verdict {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: var(--rm-text-primary, var(--el-text-color-primary));
  font-weight: 600;
}

.fl-cmp-verdict small {
  color: var(--rm-text-secondary, var(--el-text-color-secondary));
  font-weight: 400;
}

/* 抽屉特征点叠加画布：铺在登记图上，不挡点击预览 */
.fl-drawer-figure {
  position: relative;
}

.fl-lm-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

/* 叠加中给图框一个描边，提示「当前看的是带特征点的这张」 */
.fl-drawer-figure:has(.fl-lm-canvas) {
  border-color: var(--rm-primary, var(--el-color-primary));
}

/* 抽屉坐标字段里的地图外链 */
.fl-geo-link {
  margin-left: 6px;
  font-size: 12px;
}

.fl-geo-link .el-icon {
  margin-right: 2px;
}
</style>
