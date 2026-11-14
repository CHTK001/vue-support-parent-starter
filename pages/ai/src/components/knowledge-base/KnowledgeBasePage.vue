<template>
  <!-- kb：知识库设计系统作用域（styles/kb-refactor.css）。
       设计方向「档案台 Ledger + 流水线 Pipeline」：三栏常驻 + 命令条 + 处理过程可见。
       data-kb-ask 由「设置 → 显示 → 右侧问答栏宽度」驱动（narrow / full）。 -->
  <div
    class="kb h-full w-full flex flex-col min-h-0" data-page="kb-detail"
    :data-kb-ask="askWidth"
  >
    <PageHeader :title="t('knowledge.page.title')" />

    <!-- RAG 未配置：整页只提示，不显示搜索框 / 新建按钮 / 卡片数据。
         版式「分屏 Hero」：左边说清为什么要配 + 三枚状态灯，右边一张配置清单。
         清单不回显成表单，只回显 /v2/rag/status 的真实读数，配好后本页自动让位。 -->
    <div v-if="!ragReady" class="kb-gate">
      <div class="kb-gate__split">
        <div class="kb-gate__lead">
          <span class="kb-gate__eyebrow">RAG · READY CHECK</span>
          <h2 class="kb-gate__title">{{ t('knowledge.ragGate.title') }}</h2>
          <p class="kb-gate__desc">
            {{ ragStatus?.embeddingIssue || ragStatus?.message || t('knowledge.ragGate.desc') }}
          </p>
          <div class="kb-gate__acts">
            <ReButton type="primary" :round="false" @click="goToConfig(ragStatus?.configPath)">
              {{ t('knowledge.ragGate.goConfig') }}
            </ReButton>
            <ReButton type="default" :round="false" :loading="ragChecking" @click="fetchRagStatus()">
              {{ t('knowledge.ragGate.recheck') }}
            </ReButton>
          </div>
          <ul class="kb-gate__checks">
            <li
              v-for="check in ragGateChecks"
              :key="check.key"
              class="kb-gate__check"
              :class="check.ok ? 'is-ok' : 'is-bad'"
            >
              <span class="kb-gate__dot"></span>{{ check.label }}
              <span class="kb-gate__val">
                {{ check.ok ? t('knowledge.ragGate.ready') : t('knowledge.ragGate.pending') }}
              </span>
            </li>
          </ul>
        </div>

        <aside class="kb-gate__sheet">
          <span v-if="ragGateMissing > 0" class="kb-gate__flag">
            {{ t('knowledge.ragGate.missing', { n: ragGateMissing }) }}
          </span>
          <h3 class="kb-gate__sheet-t">{{ t('knowledge.ragGate.sheet') }}</h3>
          <dl class="kb-gate__dl">
            <div
              v-for="row in ragGateRows"
              :key="row.key"
              class="kb-gate__row"
              :class="{ 'is-bad': row.bad }"
            >
              <dt>{{ row.label }}<em>{{ row.key }}</em></dt>
              <dd :title="row.value">{{ row.value }}</dd>
            </div>
            <div class="kb-gate__row">
              <dt>{{ t('knowledge.ragGate.checkedAt') }}</dt>
              <dd :title="ragCheckedAt">{{ ragCheckedAt || '—' }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>

    <!-- 视图模式：从模板创建（独立页，占满内容区） -->
    <div v-else-if="showTplGallery" class="flex-1 flex flex-col overflow-hidden px-4">
      <KBTemplateGallery @cancel="showTplGallery = false" @create="handleTemplateCreate" />
    </div>

    <!-- 知识库总览（按设计稿 HTML 还原；左侧导航与顶栏由系统 layout 提供，不重复实现） -->
    <KnowledgeOverview
      ref="overviewRef"
      v-else-if="viewMode === 'list'"
      :kb-count="overview.totals?.kb_count ?? 0"
      :file-count="overview.totals?.file_count ?? 0"
      :entity-count="overview.totals?.entity_count ?? 0"
      :relation-count="overview.totals?.relation_count ?? 0"
      :loading="overviewLoading"
      :activities="activities"
      :templates="overviewTemplates"
      :bases="overviewBases"
      @create="handleOverviewCreate"
      @help="handleOpenCreate"
      @all-templates="showTplGallery = true"
      @search="handleOverviewSearch"
      @open="handleOverviewOpen"
      @update="handleOverviewUpdate"
      @remove="handleOverviewDelete"
    />

    <!-- 视图模式：知识库详情（非 list 即详情） -->
    <!-- ================= 知识库详情：档案台三栏骨架 =================
         左「库目录 + 文档」/ 中「当前视图」/ 右「问答」常驻，不换页。
         data-kb-ask 仍由「设置 → 显示 → 右侧问答栏宽度」驱动。 -->
    <div v-else class="flex-1 flex flex-col overflow-hidden min-h-0">
      <!-- 顶栏：当前库身份（印章 + 宋体库名）+ 命令条 + 读数带 + 动作组
           身份在最左：这是「这是哪个库」的第一落点，搜索在其后。 -->
      <div class="kb-bar">
        <!-- 身份区：顶栏之前只有裸图标按钮，读者看不出「现在在哪个库」。
             这段只在详情分支（列表由 v-else-if 单独渲染），所以不按 viewMode 分支，
             直接展示当前库；回列表仍在左栏与列表页入口里。 -->
        <div class="kb-bar__id">
          <span class="kb-bar__seal">{{ String(currentKB?.name || '知').slice(0, 1) }}</span>
          <span class="kb-bar__id-text">
            <b>{{ currentKB?.name || '知识库' }}</b>
            <i>档案台</i>
          </span>
        </div>

        <button type="button" class="kb-cmd" @click="openCommand">
          <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" style="flex-shrink:0">
            <circle cx="6.8" cy="6.8" r="4.6" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path d="M10.4 10.4 14 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
          <span class="kb-cmd__text">搜索文档、实体、问答记录</span>
          <kbd class="kb-cmd__kbd">Ctrl K</kbd>
        </button>

        <div class="kb-bar__right">
          <span class="kb-chip kb-chip--ok"><b>{{ filesForFilter.length }}</b> 文档</span>
          <button
            v-if="staleFileCount > 0"
            type="button"
            class="kb-chip kb-chip--warn kb-chip--act"
            :disabled="reindexing || !canEditCurrent"
            :title="t('knowledge.page.reindexAll')"
            @click="handleReindexAllStale"
          >
            <b>{{ staleFileCount }}</b> {{ reindexing ? '重建中…' : '待重建' }}
          </button>
          <!-- 处理中此前只在概览工序带里出现，顶栏只剩「失败」会让人以为别的都完事了 -->
          <span v-if="pendingFileCount > 0" class="kb-chip kb-chip--warn">
            <b>{{ pendingFileCount }}</b> 处理中
          </span>
          <span v-if="failedFileCount > 0" class="kb-chip kb-chip--err">
            <b>{{ failedFileCount }}</b> 失败
          </span>
          <ReSquareButton layout="square" class="kb-btn" :icon="Refresh" tip="刷新" :loading="detailRefreshing"
            @click="refreshDetail" />
          <!-- 逐条编辑 / 删除在列表页的条目右键区，这里只针对「当前库」 -->
          <ReSquareButton layout="square" class="kb-btn" type="primary" :icon="Setting" tip="设置"
            :disabled="!canEditCurrent" @click="handleMenuAction('settings')" />
          <ReSquareButton layout="square" class="kb-btn" type="danger" :icon="Delete" tip="删除知识库"
            :disabled="!canEditCurrent" @click="handleDeleteFromDetail" />
        </div>
      </div>

      <!-- 三栏 -->
      <div class="kb-cols" data-ask="on">
        <!-- ============ 左栏：卷宗脊（库目录 + 视图 + 卷内文档） ============ -->
        <aside class="kb-nav">
          <!-- 视图入口放在库目录之前：库一多（实测 15 个）时，视图段会被挤到
               首屏以下，每次换视图都要滚动。阅读 5 个 + 维护 2 个两段常驻顶部。 -->
          <div class="kb-nav__group kb-nav__group--views">
            <h2 class="kb-nav__title">视图</h2>
            <button
              v-for="v in navViewsRead"
              :key="v.key"
              type="button"
              class="kb-nav__kb kb-nav__kb--view"
              :class="{ 'is-on': activeTab === v.key }"
              @click="handleMenuSelect(v.key)"
            >
              <span class="kb-nav__tick" />
              <el-icon :size="13"><component :is="v.icon" /></el-icon>
              <span class="kb-nav__kb-name">{{ v.label }}</span>
              <span class="kb-nav__kb-n">{{ navCount(v.key) }}</span>
            </button>
          </div>

          <div class="kb-nav__group">
            <h2 class="kb-nav__title">知识库<em>{{ store.knowledgeBases.length }}</em></h2>
            <!-- 库目录单独滚动：库多时（实测 15 个）不把下面的「视图 / 维护 / 卷内文档」
                 推出视口。整栏滚动时这三段会一起消失，用户只能滚到很下面才找得回视图入口。 -->
            <div v-if="store.knowledgeBases.length > 8" class="kb-nav__search">
              <input
                v-model="kbFilter"
                type="search"
                class="kb-nav__filter"
                placeholder="筛选知识库"
                aria-label="筛选知识库"
                @keydown.esc="kbFilter = ''"
              />
              <button
                v-if="kbFilter"
                type="button"
                class="kb-nav__search-clear"
                aria-label="清空筛选"
                @click="kbFilter = ''"
              >×</button>
            </div>
            <div class="kb-nav__kbs">
              <button
                v-for="k in filteredKnowledgeBases"
                :key="k.id"
                type="button"
                class="kb-nav__kb"
                :class="{ 'is-on': k.id === currentKB?.id, 'is-off': !k.isActive, 'is-empty': hasCount(k.id, 'file_count') && !kbFileCount(k.id) }"
                @click="handleOverviewOpen(k)"
              >
                <!-- 签名：卷宗脊 —— 竖线长度编码文档量，空库不点亮品牌色；
                     计数未知时留 0%，不假装成「空库」 -->
                <span
                  class="kb-nav__spine"
                  :style="{ '--w': hasCount(k.id, 'file_count') ? spineHeight(kbFileCount(k.id)) : '0%' }"
                />
                <span class="kb-nav__kb-text">
                  <span class="kb-nav__kb-name">{{ k.name }}</span>
                  <span class="kb-nav__kb-meta">
                    {{ hasCount(k.id, 'file_count') ? kbFileCount(k.id) : '—' }} 篇 ·
                    {{ hasCount(k.id, 'entity_count') ? fmtCount(countOf(k.id, 'entity_count')) : '—' }} 实体
                  </span>
                </span>
                <span v-if="!k.isActive" class="kb-nav__kb-off">停用</span>
              </button>
              <p v-if="kbFilter && filteredKnowledgeBases.length === 0" class="kb-nav__foot">没有匹配的知识库</p>
            </div>
            <ReButton link type="primary" size="small" class="!mt-1 !justify-start" @click="backToList">
              ← 返回列表
            </ReButton>
          </div>

          <div class="kb-nav__group kb-nav__group--manage">
            <h2 class="kb-nav__title">维护</h2>
            <button
              v-for="v in navViewsManage"
              :key="v.key"
              type="button"
              class="kb-nav__kb kb-nav__kb--view"
              :class="{ 'is-on': activeTab === v.key }"
              @click="handleMenuSelect(v.key)"
            >
              <span class="kb-nav__tick" />
              <el-icon :size="13"><component :is="v.icon" /></el-icon>
              <span class="kb-nav__kb-name">{{ v.label }}</span>
              <span class="kb-nav__kb-n">{{ navCount(v.key) }}</span>
            </button>
          </div>

          <!-- 待重建索引：原文在盘上但向量库没有分片（上传未跑完 / 重启后状态丢失）。
               这一档不处理就是永远检索不到，所以与「失败」一样提到一级位置。 -->
          <div v-if="staleFileCount > 0" class="kb-nav__group kb-nav__group--fail kb-nav__group--stale">
            <h2 class="kb-nav__title">待重建索引<em>{{ staleFileCount }}</em></h2>
            <div v-for="f in staleFiles.slice(0, 4)" :key="f.id" class="kb-failrow kb-failrow--stale">
              <span class="kb-failrow__name">{{ f.displayName || f.fileName }}</span>
              <span class="kb-failrow__why">原文在盘上，向量库没有它的分片</span>
              <button
                v-if="canEditCurrent"
                type="button"
                class="kb-failrow__retry"
                :disabled="reindexing"
                @click="handleRetryFile(f)"
              >重建</button>
            </div>
            <button
              type="button"
              class="kb-nav__more"
              :disabled="reindexing || !canEditCurrent"
              @click="handleReindexAllStale"
            >{{ reindexing ? '正在重建…' : `一键重建全部 ${staleFileCount} 篇` }}</button>
          </div>

          <!-- 失败文档：失败只出现在卷内文档列表里等于没提示（那一格只有一个红点）。
               这里把失败项提到一级位置，原因与端点都给全，原地重试。 -->
          <div v-if="failedFiles.length > 0" class="kb-nav__group kb-nav__group--fail">
            <h2 class="kb-nav__title">待处理失败<em>{{ failedFiles.length }}</em></h2>
            <div v-for="f in failedFiles.slice(0, 4)" :key="f.id" class="kb-failrow">
              <span class="kb-failrow__name">{{ f.displayName || f.fileName }}</span>
              <span class="kb-failrow__why" :title="f.errorMessage || ''">{{ f.errorMessage || '解析失败，原因未返回' }}</span>
              <button
                v-if="canEditCurrent"
                type="button"
                class="kb-failrow__retry"
                @click="handleRetryFile(f)"
              >重试</button>
            </div>
            <button
              v-if="failedFiles.length > 4"
              type="button"
              class="kb-nav__more"
              @click="handleMenuSelect('files')"
            >另有 {{ failedFiles.length - 4 }} 篇失败 · 去文档视图</button>
          </div>

          <!-- 卷内文档：除文档视图外做上下文索引（文档视图里文件树才是全量，避免两处重复） -->
          <div v-if="activeTab !== 'files'" class="kb-nav__group kb-nav__group--grow">
            <h2 class="kb-nav__title">卷内文档<em>{{ filesForFilter.length }}</em></h2>
            <div class="kb-nav__docs">
              <button
                v-for="(f, i) in activeFiles.slice(0, 60)"
                :key="f.id"
                type="button"
                class="kb-nav__doc"
                :class="{ 'is-on': selectedDocId === f.id }"
                @click="handleNavDocClick(f)"
              >
                <span class="kb-nav__doc-no">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="kb-nav__doc-name">{{ f.displayName || f.fileName }}</span>
                <span class="kb-nav__dot" :data-tone="fileTone(f.processingStatus)" />
              </button>
              <p v-if="filesForFilter.length === 0 && !treeLoading" class="kb-nav__foot">这个卷宗还没有文档</p>
            </div>
          </div>

          <div class="kb-nav__group">
            <p class="kb-nav__foot">
              {{ navCount('entities') }} 实体 · {{ navCount('relations') }} 关系
            </p>
          </div>
        </aside>

        <!-- ============ 中栏：当前视图 ============ -->
        <main class="kb-main" @scroll="handleScroll">
          <!-- ---- 文档视图：状态分栏 + 文件树（问答并入右栏） ---- -->
          <template v-if="activeTab === 'files'">
            <div class="kb-docview__list">
              <!-- 抬头并入卡片：卷宗名、篇数与状态印章和表格同处一个台面，
                   不再悬在页面上另起一行 -->
              <header class="kb-head kb-head--inset">
                <div class="kb-head__left">
                  <p class="kb-path">
                    {{ currentKB?.name }}<span>/</span>文档
                  </p>
                  <h1 class="kb-title">文档</h1>
                </div>
                <div class="kb-head__right">
                  <span class="kb-stamp"><b>{{ filesForFilter.length }}</b> 篇</span>
                  <button
                    v-if="staleFileCount > 0"
                    type="button"
                    class="kb-stamp kb-stamp--warn kb-stamp--act"
                    :disabled="reindexing || !canEditCurrent"
                    :title="reindexing ? t('knowledge.page.reindexing') : t('knowledge.page.reindexAll')"
                    @click="handleReindexAllStale"
                  >
                    <b>{{ staleFileCount }}</b> {{ reindexing ? '重建中…' : '待重建' }}
                  </button>
                  <span v-if="pendingFileCount > 0" class="kb-stamp kb-stamp--warn">
                    <b>{{ pendingFileCount }}</b> 处理中
                  </span>
                  <span v-if="failedFileCount > 0" class="kb-stamp kb-stamp--err">
                    <b>{{ failedFileCount }}</b> 失败
                  </span>
                </div>
              </header>

              <div class="kb-docview__head">
                <div class="kb-filters">
                  <button
                    v-for="f in fileStatusFilters"
                    :key="f.key"
                    :data-k="f.key"
                    type="button"
                    class="kb-filter"
                    :class="{ 'is-on': fileStatusFilter === f.key }"
                    @click="fileStatusFilter = f.key"
                  >
                    <span>{{ f.label }}</span>
                    <i class="kb-filter__n">{{ f.count }}</i>
                  </button>
                </div>
                <div class="kb-toolbar__grow" />
                <KBFileUploader v-if="canEditCurrent" ref="fileUploaderRef" :kb-id="store.activeKnowledgeBaseId!"
                  :current-folder-path="getCurrentFolderPath()" :get-current-files="getCurrentFiles"
                  @uploaded="handleUploadComplete" @show-upload-task="showUploadTaskModal = true"
                  @folder-created="handleFolderCreated" />
              </div>

              <!-- 待重建横幅：后端把「磁盘上有原文、向量库里没有分片」报成 uploaded，
                   不点一下就永远检索不到，所以给一条能原地重建的提示 -->
              <div v-if="staleFileCount > 0 && fileStatusFilter !== 'stale'" class="kb-docview__banner">
                <span :title="t('knowledge.page.reindexHint')">
                  <b>{{ staleFileCount }}</b> 篇文档在磁盘上但还没有索引（上传未跑完，或服务重启后索引状态丢失），检索不到它们。
                </span>
                <ReButton type="primary" link :loading="reindexing" :disabled="!canEditCurrent"
                  @click="handleReindexAllStale">重建全部索引</ReButton>
              </div>

              <div v-if="failedFileCount > 0 && fileStatusFilter !== 'failed'" class="kb-docview__banner">
                <span><b>{{ failedFileCount }}</b> 篇解析失败，原因在左栏「待处理失败」里，可原地重试。</span>
                <ReButton type="primary" link @click="fileStatusFilter = 'failed'">只看失败</ReButton>
              </div>

              <!-- 空态卡片放在文件树容器内（见下），避免绝对定位盖住工具栏 -->

              <div v-if="!canEditCurrent" class="kb-readonly" style="margin: 0 12px 8px">
                {{ t('knowledge.page.readonlyHint') }}
              </div>

              <div class="kb-docview__tree">
                <!-- 空文档：此前文件树中央只有一行「暂无文件」，而上传入口是工具栏末尾
                     一排 20px 的方形图标，看不出这里是起步点。空态把「上传」变成主按钮。 -->
                <div v-if="filesForFilter.length === 0 && fileStatusFilter === 'all' && !treeLoading" class="kb-docview__blank">
                  <div class="kb-docview__blank-card">
                    <p class="kb-docview__blank-eyebrow">空卷宗 · 从第一篇原文开始</p>
                    <h3 class="kb-docview__blank-t">这个卷宗还没有文档</h3>
                    <!-- 三步是真实的先后顺序（上传 → 索引 → 使用），编号只在这里出现 -->
                    <ol class="kb-boot">
                      <li class="kb-boot__item">
                        <span class="kb-boot__i">01</span>
                        <div class="kb-boot__body">
                          <b><el-icon class="kb-boot__ico"><UploadFilled /></el-icon>放入原文</b>
                          <span>支持 PDF / Word / Markdown / 纯文本 / 网页，也可以整夹上传。</span>
                          <div class="kb-boot__act">
                            <ReButton v-if="canEditCurrent" type="primary" :icon="Plus"
                              @click="fileUploaderRef?.triggerFileInput?.()">上传文件</ReButton>
                            <ReButton v-if="canEditCurrent" @click="fileUploaderRef?.triggerFolderInput?.()">上传整个文件夹</ReButton>
                            <ReButton v-else disabled>只读：无上传权限</ReButton>
                          </div>
                        </div>
                      </li>
                      <li class="kb-boot__item">
                        <span class="kb-boot__i">02</span>
                        <div class="kb-boot__body">
                          <b><el-icon class="kb-boot__ico"><Connection /></el-icon>自动切分与向量化</b>
                          <span>上传后先切块再索引，状态从「处理中」变成「已索引」才算可用。</span>
                        </div>
                      </li>
                      <li class="kb-boot__item">
                        <span class="kb-boot__i">03</span>
                        <div class="kb-boot__body">
                          <b><el-icon class="kb-boot__ico"><ChatDotRound /></el-icon>在检索与问答里使用</b>
                          <span>命中后可在「检索」里看分块，在右栏问答里作为引用被带出。</span>
                        </div>
                      </li>
                    </ol>
                    <p class="kb-boot__foot">
                      想跳过从零开始，可以从「<ReButton type="primary" link @click="showTplGallery = true">模板集</ReButton>」一键建库，
                      模板会带回文档、实体与关系。
                    </p>
                  </div>
                </div>

                <KBFileTree ref="fileTreeRef" :kb-id="store.activeKnowledgeBaseId!" :readonly="!canEditCurrent"
                  :status-filter="fileStatusFilter"
                  :suppress-empty="filesForFilter.length === 0 && fileStatusFilter === 'all'"
                  @reset-filter="fileStatusFilter = 'all'"
                  @view="handleViewFile" @retry="handleRetryFile" @delete="handleDeleteFile"
                  @chunks="handleViewChunks"
                  @folder-change="handleFolderChange" @files-loaded="handleFilesLoaded" />
              </div>
            </div>
          </template>

          <!-- ---- 概览视图：档案正文（报头 → 流水线 → 读数 → 分布 / 枢纽） ---- -->
          <template v-else-if="activeTab === 'overview'">
            <header class="kb-head">
              <div class="kb-head__left">
                <p class="kb-path">
                  {{ currentKB?.name }}<span>/</span>概览
                </p>
                <h1 class="kb-title">概览</h1>
              </div>
              <div class="kb-head__right">
                <span class="kb-stamp"><b>{{ kbFileCount(currentKB?.id || '') }}</b> 篇</span>
                <span v-if="pendingFileCount > 0" class="kb-stamp kb-stamp--warn">
                  <b>{{ pendingFileCount }}</b> 处理中
                </span>
                <span v-if="failedFileCount > 0" class="kb-stamp kb-stamp--err">
                  <b>{{ failedFileCount }}</b> 失败
                </span>
              </div>
            </header>

            <p class="kb-lede">
              {{ currentKB?.description || '这个卷宗还没有填写描述。' }}
              <!-- 空库的概览此前只有一行行「—」与「暂无」，看不出下一步做什么。
                   这里在导语后面直接给动作，把首屏变成起点而不是报告。 -->
              <template v-if="filesForFilter.length === 0">
                <span class="kb-lede__sep">·</span>
                <ReButton type="primary" link @click="handleMenuSelect('files')">上传第一批文档</ReButton>
                <span class="kb-lede__sep">/</span>
                <ReButton type="primary" link @click="showTplGallery = true">用模板建库</ReButton>
              </template>
              <template v-else-if="failedFileCount > 0">
                <span class="kb-lede__sep">·</span>
                <span class="kb-lede__warn">{{ failedFileCount }} 篇解析失败，</span>
                <ReButton type="primary" link @click="handleMenuSelect('files')">去处理</ReButton>
              </template>
            </p>

            <!-- 签名：四道工序横排，处理中的工序底部走扫描线 -->
            <ol class="kb-stages">
              <li v-for="(s, i) in pipelineStages" :key="s.key" class="kb-stage" :class="{ 'is-on': s.running }">
                <span class="kb-stage__n">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="kb-stage__label">{{ s.label }}</span>
                <span class="kb-stage__v" :data-tone="s.tone">{{ s.value }}<i v-if="s.unit">{{ s.unit }}</i></span>
                <!-- 第二行说明：工序带此前只有数字，读者不知道这个数意味着什么 -->
                <span class="kb-stage__hint">{{ s.hint }}</span>
                <span class="kb-stage__wire" />
              </li>
            </ol>

            <!-- 读数：四格 -->
            <dl class="kb-statrow">
              <div class="kb-statrow__cell">
                <dt class="kb-statrow__k">文档</dt>
                <dd class="kb-statrow__v">{{ fmtCount(kbFileCount(currentKB?.id || '')) }}<i>篇</i></dd>
              </div>
              <div class="kb-statrow__cell">
                <dt class="kb-statrow__k">切块</dt>
                <dd class="kb-statrow__v">{{ chunkStat.value }}<i v-if="chunkStat.known">块</i></dd>
              </div>
              <div class="kb-statrow__cell">
                <dt class="kb-statrow__k">Tokens</dt>
                <dd class="kb-statrow__v">{{ tokenStat.value }}<i v-if="tokenStat.known">个</i></dd>
              </div>
              <div class="kb-statrow__cell">
                <dt class="kb-statrow__k">实体 / 关系</dt>
                <dd class="kb-statrow__v">
                  {{ navCount('entities') }}<i>/ {{ navCount('relations') }}</i>
                </dd>
              </div>
            </dl>

            <h2 class="kb-h2">切块配方</h2>
            <p class="kb-text">
              上限 {{ currentKB?.chunkMaxSize ?? '—' }} 字 · 下限 {{ currentKB?.chunkMinSize ?? '—' }} 字 ·
              相邻块重叠 {{ currentKB?.chunkOverlapSize ?? '—' }} 字
              <template v-if="currentKB?.sourceUrl">
                · 采集来源 {{ currentKB.sourceUrl }}（≤{{ currentKB.sourceMaxPages }} 页）
              </template>
            </p>

            <div class="kb-overview-grid">
              <!-- 实体类型分布：横向条形 + 名称 + 计数 -->
              <section>
                <h2 class="kb-h2">实体类型分布 <em>{{ navCount('entities') }}</em></h2>
                <ul v-if="entityTypeStats.length > 0" class="kb-types">
                  <li v-for="s in entityTypeStats" :key="s.type">
                    <span
                      class="kb-types__bar"
                      :style="{ '--w': typeBarWidth(s.count), '--c': s.color }"
                    />
                    <span class="kb-types__name">{{ s.label }}</span>
                    <span class="kb-types__n">{{ s.count }}</span>
                  </li>
                </ul>
                <!-- 空态用紧凑行而不是 ReEmpty：概览下半部是两个并排窄栏，
                     插图占满一栏会把这半屏撑成一整张「空页面」，读数反而被挤走 -->
                <p v-else class="kb-empty">
                  {{ filesForFilter.length === 0 ? '还没有文档，先上传一批；实体由文档抽取而来。' : '还没有抽取到实体。' }}
                  <ReButton v-if="filesForFilter.length === 0" type="primary" link @click="handleMenuSelect('files')">去文档</ReButton>
                  <template v-else-if="ragReady">
                    <ReButton type="primary" link :loading="graphGenerating" @click="handleGenerateGraph">生成图谱</ReButton>
                  </template>
                </p>
              </section>

              <!-- 关联最多的实体：编号表，按关系数排序 -->
              <section>
                <h2 class="kb-h2">关联最多的实体 <em>Top {{ Math.min(topEntities.length, 8) }}</em></h2>
                <ul v-if="topEntities.length > 0" class="kb-top">
                  <li
                    v-for="(e, i) in topEntities.slice(0, 8)"
                    :key="e.id"
                    class="kb-top__row"
                    role="button"
                    tabindex="0"
                    @click="openEntityInGraph(e.name)"
                    @keydown.enter.prevent="openEntityInGraph(e.name)"
                  >
                    <span class="kb-top__rank">{{ String(i + 1).padStart(2, '0') }}</span>
                    <span class="kb-top__name">{{ e.name }}</span>
                    <span class="kb-top__type">{{ entityTypeLabel(e.type) }}</span>
                    <span class="kb-top__deg">{{ e.degree }}<i>关系</i></span>
                  </li>
                </ul>
                <p v-else class="kb-empty">
                  {{ filesForFilter.length === 0 ? '还没有文档与实体。' : '还没有可排名的实体。' }}
                  <ReButton v-if="filesForFilter.length === 0" type="primary" link @click="handleMenuSelect('files')">去文档</ReButton>
                  <ReButton v-else-if="ragReady" type="primary" link :loading="graphGenerating" @click="handleGenerateGraph">生成图谱</ReButton>
                </p>
              </section>
            </div>
          </template>

          <!-- ---- 搜索视图：报头 + 检索面板 ---- -->
          <template v-else-if="activeTab === 'search'">
            <header class="kb-head">
              <div class="kb-head__left">
                <p class="kb-path">
                  {{ currentKB?.name }}<span>/</span>检索
                </p>
                <h1 class="kb-title">检索</h1>
              </div>
              <div class="kb-head__right">
                <span class="kb-stamp"><b>{{ fmtCount(kbFileCount(currentKB?.id || '')) }}</b> 篇可检索</span>
              </div>
            </header>

            <div class="kb-view">
              <KBSearchPanel :knowledge-bases="store.knowledgeBases" :default-kb-id="store.activeKnowledgeBaseId"
                :doc-count="filesForFilter.length"
                @result-click="handleSearchResultClick" @go-files="handleMenuSelect('files')" />
            </div>
          </template>

          <!-- ---- 问答记录：中栏是台账，对话本身在右栏常驻，两者不重复 ---- -->
          <template v-else-if="activeTab === 'ask'">
            <header class="kb-head">
              <div class="kb-head__left">
                <p class="kb-path">
                  {{ currentKB?.name }}<span>/</span>问答记录
                </p>
                <h1 class="kb-title">问答记录</h1>
              </div>
              <div class="kb-head__right">
                <span class="kb-stamp"><b>{{ askTurns.length }}</b> 轮</span>
                <span v-if="askCiteTotal > 0" class="kb-stamp"><b>{{ askCiteTotal }}</b> 处引用</span>
              </div>
            </header>

            <p class="kb-lede">
              右栏对话里的每一轮都会在这里留档，可按引用文档回溯；正文与引用角标在右栏，这里只记「问了什么、引了多少、耗时多少」。
            </p>

            <h2 class="kb-h2">可问范围</h2>
            <dl class="kb-statrow">
              <div class="kb-statrow__cell">
                <dt class="kb-statrow__k">可检索文档</dt>
                <dd class="kb-statrow__v">{{ fmtCount(filesForFilter.length) }}<i>篇</i></dd>
              </div>
              <div class="kb-statrow__cell">
                <dt class="kb-statrow__k">已索引切块</dt>
                <dd class="kb-statrow__v">{{ chunkStat.value }}<i v-if="chunkStat.known">块</i></dd>
              </div>
              <div class="kb-statrow__cell">
                <dt class="kb-statrow__k">Tokens</dt>
                <dd class="kb-statrow__v">{{ tokenStat.value }}<i v-if="tokenStat.known">个</i></dd>
              </div>
              <div class="kb-statrow__cell">
                <dt class="kb-statrow__k">可关联实体</dt>
                <dd class="kb-statrow__v">{{ navCount('entities') }}<i>个</i></dd>
              </div>
            </dl>

            <h2 class="kb-h2">问答记录 <em>{{ askTurns.length }}</em></h2>
            <div v-if="askTurns.length > 0" class="kb-ledger">
              <div class="kb-ledger__head">
                <span>编号</span>
                <span>问题</span>
                <span class="kb-ar">引用</span>
                <span>关联实体</span>
                <span class="kb-ar">耗时</span>
              </div>
              <div
                v-for="(t, i) in askTurns"
                :key="t.id"
                class="kb-ledger__row"
                :class="{ 'is-err': t.error }"
              >
                <span class="kb-ledger__no">{{ String(i + 1).padStart(2, '0') }}</span>
                <span class="kb-ledger__q">{{ t.question }}</span>
                <span class="kb-ledger__n kb-ar">{{ t.citeCount }} 处</span>
                <span class="kb-ledger__dim">{{ t.entities.length ? t.entities.join(' · ') : '—' }}</span>
                <span class="kb-ledger__n kb-ar">{{ t.elapsed ? (t.elapsed / 1000).toFixed(1) + 's' : '—' }}</span>
              </div>
            </div>
            <div v-else class="kb-ledger__empty">
              <p>还没有问答记录。右栏问一句，这里就会自动留档。</p>
            </div>

            <h2 class="kb-h2">提问范例</h2>
            <ul class="kb-suggest">
              <li v-for="q in askSuggestions" :key="q" class="kb-suggest__item">
                <span class="kb-suggest__q">{{ q }}</span>
              </li>
            </ul>
          </template>

          <!-- ---- 知识图谱视图 ---- -->
          <template v-else-if="activeTab === 'graph'">
            <header class="kb-head">
              <div class="kb-head__left">
                <p class="kb-path">
                  {{ currentKB?.name }}<span>/</span>知识图谱
                </p>
                <h1 class="kb-title">知识图谱</h1>
              </div>
              <div class="kb-head__right">
                <span class="kb-stamp"><b>{{ fmtCount(graphView.entityCount) }}</b> 实体</span>
                <span class="kb-stamp"><b>{{ fmtCount(graphView.relationCount) }}</b> 关系</span>
              </div>
            </header>

            <div class="kb-view kb-graphview">
              <div class="kb-toolbar">
                <!-- 说明文字压缩到一行：整段说明此前占了中栏三分之一高度，
                     而它只在第一次检索前才有用 -->
                <span class="kb-docview__count">
                  <template v-if="isGraphFiltered">
                    实体 {{ graphNodes.length }} / {{ graphView.entityCount }} ·
                    关系 {{ graphEdges.length }} / {{ graphView.relationCount }}
                  </template>
                  <template v-else>
                    实体 {{ graphView.entityCount }} · 关系 {{ graphView.relationCount }}
                  </template>
                </span>
                <el-tooltip placement="bottom-start" effect="light" :show-after="150">
                  <template #content>
                    <div class="leading-relaxed max-w-[320px]">
                      节点大小按关系条数缩放（{{ NODE_MIN_SIZE }}–{{ NODE_MAX_SIZE }}px，每条关系 +{{ NODE_SIZE_STEP }}px），点击节点可看关系明细。
                    </div>
                    <div class="leading-relaxed max-w-[320px] mt-1">
                      画布可直接用鼠标滚轮 / 触控板缩放；手工补录的内容独立于知识点，删除知识点不会连带删掉。
                    </div>
                  </template>
                  <el-icon class="kb-graph__help"><QuestionFilled /></el-icon>
                </el-tooltip>
                <span v-if="graphError" style="color: var(--kb-err); font-size: 12px">{{ graphError }}</span>
                <span v-else-if="!graphLoading && graphView.nodes.length === 0" style="font-size: 12px; color: var(--kb-ink-3)">
                  <template v-if="graphView.placeholder">
                    暂无图谱数据（尚未抽取过关系）。点「生成图谱」让 AI 从现有知识点里抽一遍。
                  </template>
                  <template v-else>
                    当前范围确实没有关系。可点「重新生成」按最新原文再抽一次。
                  </template>
                </span>
                <span v-else-if="graphTooDense" style="font-size: 12px; color: var(--kb-ink-3)">
                  节点较多，按<ReButton type="primary" link @click="focusGraphTypeFilter">「实体类型」</ReButton>筛选后结构更清晰。
                </span>

                <div class="kb-toolbar__grow" />

                <ReInput v-model="graphKeyword" placeholder="按实体名过滤" clearable style="width: 180px">
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </ReInput>
                <ReButton size="small"
                  :type="graphTypeFilter.length === 1 && graphTypeFilter[0] === 'person' ? 'primary' : 'default'"
                  @click="togglePersonOnly">只看人物</ReButton>
                <ReButton v-if="!graphLazyAll && graphView.nodes.length > GRAPH_LAZY_CORE" size="small"
                  type="primary" plain @click="showAllGraph">
                  显示全部（{{ graphNodes.length }}/{{ graphView.nodes.length }}）
                </ReButton>
                <ReSelect v-model="graphTypeFilter" ref="graphTypeFilterRef" multiple collapse-tags
                  collapse-tags-tooltip :max-collapse-tags="2" clearable placeholder="实体类型" style="width: 168px">
                  <ReOption v-for="s in entityTypeStats" :key="s.type" :label="`${s.label} (${s.count})`" :value="s.type">
                    <span class="flex items-center gap-2">
                      <i class="kb-dot" :style="{ background: s.color }" />
                      <span>{{ s.label }}</span>
                      <span class="kb-dot__n">{{ s.count }}</span>
                    </span>
                  </ReOption>
                </ReSelect>
                <div class="kb-actions">
                  <ReSquareButton layout="square" class="kb-btn" :icon="Refresh" tip="刷新" :loading="graphLoading" @click="loadGraph" />
                  <ReSquareButton layout="square" v-if="ragReady" class="kb-btn" type="primary" :icon="Refresh"
                    :tip="graphView.placeholder ? '生成图谱' : '重新生成'"
                    :loading="graphGenerating" @click="handleGenerateGraph" />
                  <ReSquareButton layout="square" v-if="graphView.nodes.length > 0" class="kb-btn" :icon="Grid" tip="管理实体" @click="goManage('entity')" />
                  <ReSquareButton layout="square" v-if="graphView.nodes.length > 0" class="kb-btn" :icon="Connection" tip="管理关系" @click="goManage('relation')" />
                </div>
              </div>

              <!-- 生成图谱的真实结果：抽取链路失败时如实列出失败的知识点与原因，
                   并给出可行动的入口，而不是弹一句「已生成 0 个实体」 -->
              <ReAlert
                v-if="graphFailures.length > 0"
                class="mb-2"
                type="error"
                :closable="true"
                show-icon
                @close="graphFailures = []"
              >
                <template #title>
                  关系抽取失败 {{ graphFailures.length }} 个知识点
                </template>
                <ul class="kb-genfail">
                  <li v-for="(f, i) in graphFailures.slice(0, 3)" :key="i">
                    <b v-if="f.docPath">{{ f.docPath }}</b>
                    <span>{{ f.errorMessage }}</span>
                  </li>
                  <li v-if="graphFailures.length > 3">…另有 {{ graphFailures.length - 3 }} 个</li>
                </ul>
                <ReButton type="primary" link size="small" @click="goDefaultModels">
                  去设置默认模型
                </ReButton>
              </ReAlert>

              <div class="kb-graphview__canvas">
                <div v-loading="graphLoading" class="kb-graph__canvas kb-graph__stage" style="height: 100%">
                  <ReRelationGraph v-if="graphEverMounted || (graphNodes.length > 0 && activeTab === 'graph')"
                    v-show="activeTab === 'graph'" ref="graphCompRef" :nodes="graphNodes" :edges="graphEdges"
                    toolbar toolbar-position="top-left" :layout="GRAPH_LAYOUT" :layout-options="GRAPH_LAYOUT_OPTIONS"
                    :group-type="GRAPH_GROUP_TYPE" height="100%"
                    :node-size="36" empty-text="该知识库还没有可展示的实体关系"
                    @ready="handleGraphReady" @node-click="handleGraphNodeClick" />

                  <div v-if="!graphLoading && graphView.nodes.length === 0" class="kb-graph__blank">
                    <div class="kb-graph__blank-card">
                      <h3 class="kb-graph__blank-t">
                        {{ graphView.placeholder ? '这张图还是空的' : '当前范围没有关系' }}
                      </h3>
                      <p class="kb-graph__blank-d">
                        <template v-if="graphView.placeholder">
                          图谱要由 AI 从已索引的 {{ filesForFilter.length }} 篇文档里抽取，
                          抽完才能关系查询、下钻实体。抽取是异步任务，可以离开这一页。
                        </template>
                        <template v-else>
                          过滤条件下没有可画的关系，清空过滤或按最新原文重新抽一次。
                        </template>
                      </p>
                      <div class="kb-graph__blank-acts">
                        <ReButton v-if="ragReady" type="primary" :loading="graphGenerating" @click="handleGenerateGraph">
                          {{ graphView.placeholder ? '生成图谱' : '重新生成' }}
                        </ReButton>
                        <ReButton @click="handleMenuSelect('files')">去文档</ReButton>
                        <ReButton v-if="!graphView.placeholder && isGraphFiltered" @click="clearGraphFilters">
                          清空过滤条件
                        </ReButton>
                      </div>
                      <p v-if="!ragReady" class="kb-graph__blank-d kb-graph__blank-d--warn">
                        当前库还没开启知识库检索能力（RAG），抽取不可用。
                      </p>
                    </div>
                  </div>

                  <div v-if="graphLegendStats.length > 0" class="kb-graph__legend">
                    <span v-for="l in graphLegendStats" :key="l.type" class="kb-graph__legend-item">
                      <i class="kb-graph__legend-dot" :style="{ background: l.color }" />
                      {{ l.label }}<b class="kb-graph__legend-n">{{ l.count }}</b>
                    </span>
                  </div>
                </div>

                <aside v-if="selectedGraphNode" class="kb-gedetail re-surface">
                  <div class="kb-gedetail__head">
                    <h3 class="kb-gedetail__name truncate">{{ selectedGraphNode.name }}</h3>
                    <ReSquareButton layout="square" class="kb-btn kb-gedetail__close" size="small" :icon="Close" tip="关闭" @click="selectedGraphNode = null" />
                  </div>
                  <div class="kb-gedetail__sub">
                    实体 ID:{{ selectedGraphNode.id }}
                    <template v-if="selectedGraphNode.type"> · {{ entityTypeLabel(selectedGraphNode.type) }}</template>
                  </div>
                  <div class="kb-gedetail__metrics">
                    <div class="kb-gedetail__metric">
                      <span class="kb-gedetail__metric-value">{{ selectedGraphNode.degree }}</span>
                      <span class="kb-gedetail__metric-label">关系</span>
                    </div>
                  </div>
                  <h4 class="kb-gedetail__section">关系（{{ selectedNodeRelations.length }}）</h4>
                  <ul class="kb-gedetail__relations">
                    <li v-for="r in selectedNodeRelations" :key="r.key" class="kb-gedetail__relation">
                      <span class="kb-gedetail__relation-type">{{ r.type || '相关' }}</span>
                      <span class="kb-gedetail__relation-peer truncate">{{ r.peer }}</span>
                    </li>
                    <li v-if="selectedNodeRelations.length === 0" class="kb-gedetail__relation kb-gedetail__relation--empty">
                      该实体暂无关系
                    </li>
                  </ul>
                  <div class="kb-gedetail__actions">
                    <ReSquareButton layout="square" class="kb-btn" size="small" type="primary" :icon="Edit" tip="编辑实体" @click="goManage('entity')" />
                    <ReSquareButton layout="square" class="kb-btn" size="small" :icon="Document" tip="查看来源文档" @click="viewSourceDocs" />
                  </div>
                </aside>
              </div>
            </div>
          </template>

          <!-- ---- 实体管理 ---- -->
          <template v-else-if="activeTab === 'entities'">
            <header class="kb-head">
              <div class="kb-head__left">
                <p class="kb-path">
                  {{ currentKB?.name }}<span>/</span>实体管理
                </p>
                <h1 class="kb-title">实体管理</h1>
              </div>
              <div class="kb-head__right">
                <span class="kb-stamp"><b>{{ fmtCount(filteredGraphEntities.length) }}</b> 个</span>
              </div>
            </header>

            <div class="kb-view">
              <div class="kb-toolbar">
                <ReInput v-model="graphEntityKeyword" placeholder="按名称过滤" clearable style="width: 200px">
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </ReInput>
                <div class="kb-toolbar__grow" />
                <div class="kb-actions">
                  <ReSquareButton layout="square" class="kb-btn" :icon="Refresh" tip="刷新" :loading="graphLoading" @click="loadGraph" />
                  <ReSquareButton layout="square" class="kb-btn" type="primary" :icon="Plus" tip="新增实体" @click="openEntityForm()" />
                  <ReSquareButton layout="square" class="kb-btn" type="danger" :icon="Delete"
                    :tip="selectedEntityUids.length ? `批量删除(${selectedEntityUids.length})` : '批量删除'"
                    :disabled="selectedEntityUids.length === 0" @click="handleBatchDeleteEntities" />
                </div>
              </div>
              <div class="kb-tablecard">
                <ReTable
                  ref="entityTableRef"
                  :data="pagedGraphEntities"
                  :columns="entityColumns"
                  :loading="graphLoading"
                  :pagination="false"
                  :toolbar="false"
                  :layout-table="{ minHeight: 0 }"
                  :settings="{ border: false }"
                  :show-selection="true"
                  stripe
                  class="flat-table"
                  @selection-change="onEntitySelection"
                >
                  <template #col-name="{ row }">
                    <div class="flex items-center gap-2">
                      <img v-if="row.image" :src="row.image" alt="" class="w-6 h-6 rounded object-cover border border-[var(--rm-border)] shrink-0"
                        @error="($event.target as HTMLImageElement).style.display = 'none'" />
                      <span>{{ row.text }}</span>
                    </div>
                  </template>
                  <template #col-type="{ row }">
                    <ReTag size="small" :type="entityTagType(row.type)">{{ entityTypeLabel(row.type) }}</ReTag>
                  </template>
                  <template #col-actions="{ row }">
                    <ReSquareButton layout="square" class="kb-btn" size="small" type="primary" :icon="Edit" tip="编辑" @click="openEntityForm(row)" />
                    <ReSquareButton layout="square" class="kb-btn" size="small" type="danger" :icon="Delete" tip="删除" @click="handleDeleteEntity(row)" />
                  </template>
                  <!-- 空态：ReEmpty 的插图在表格里会撑满整块，看不出下一步。
                       换成紧凑卡片，直接给「新增实体 / 生成图谱 / 去文档」。 -->
                  <template #empty>
                    <div class="kb-tempty">
                      <h3 class="kb-tempty__t">
                        {{ graphEntityKeyword ? '没有匹配的实体' : '这个卷宗还没有实体' }}
                      </h3>
                      <p class="kb-tempty__d">
                        <template v-if="graphEntityKeyword">
                          按名称过滤后没有命中，换个关键词或清空过滤。
                        </template>
                        <template v-else>
                          实体由 AI 从已索引的文档里抽取，也可以手工补录。抽完才能在知识图谱里连线、在右栏问答里被引用。
                        </template>
                      </p>
                      <div class="kb-tempty__acts">
                        <ReButton v-if="graphEntityKeyword" @click="graphEntityKeyword = ''">清空过滤</ReButton>
                        <template v-else>
                          <ReButton type="primary" @click="openEntityForm()">新增实体</ReButton>
                          <ReButton v-if="ragReady" :loading="graphGenerating" @click="handleGenerateGraph">生成图谱</ReButton>
                          <ReButton @click="handleMenuSelect('files')">去文档</ReButton>
                        </template>
                      </div>
                    </div>
                  </template>
                </ReTable>
                <div class="pagination-wrapper">
                  <RePagination
                    v-model:current-page="entityPage"
                    v-model:page-size="entityPageSize"
                    :page-sizes="[10, 20, 50]"
                    :total="filteredGraphEntities.length"
                    layout="total, sizes, prev, pager, next"
                  />
                </div>
              </div>
            </div>
          </template>

          <!-- ---- 关系管理 ---- -->
          <template v-else-if="activeTab === 'relations'">
            <header class="kb-head">
              <div class="kb-head__left">
                <p class="kb-path">
                  {{ currentKB?.name }}<span>/</span>关系管理
                </p>
                <h1 class="kb-title">关系管理</h1>
              </div>
              <div class="kb-head__right">
                <span class="kb-stamp"><b>{{ fmtCount(filteredGraphRelations.length) }}</b> 条</span>
              </div>
            </header>

            <div class="kb-view">
              <div class="kb-toolbar">
                <ReInput v-model="graphRelationKeyword" placeholder="按实体名/关系类型过滤" clearable style="width: 220px">
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </ReInput>
                <div class="kb-toolbar__grow" />
                <div class="kb-actions">
                  <ReSquareButton layout="square" class="kb-btn" :icon="Refresh" tip="刷新" :loading="graphLoading" @click="loadGraph" />
                  <ReSquareButton layout="square" class="kb-btn" type="primary" :icon="Plus" tip="新增关系" @click="openRelationForm()" />
                  <ReSquareButton layout="square" class="kb-btn" type="danger" :icon="Delete"
                    :tip="selectedRelationUids.length ? `批量删除(${selectedRelationUids.length})` : '批量删除'"
                    :disabled="selectedRelationUids.length === 0" @click="handleBatchDeleteRelations" />
                </div>
              </div>
              <div class="kb-tablecard">
                <ReTable
                  ref="relationTableRef"
                  :data="pagedGraphRelations"
                  :columns="relationColumns"
                  :loading="graphLoading"
                  :pagination="false"
                  :toolbar="false"
                  :layout-table="{ minHeight: 0 }"
                  :settings="{ border: false }"
                  :show-selection="true"
                  stripe
                  class="flat-table"
                  @selection-change="onRelationSelection"
                >
                  <template #col-from="{ row }">
                    <div class="flex items-center gap-2">
                      <img v-if="nodeImageById(row.from)" :src="nodeImageById(row.from)" alt=""
                        class="w-6 h-6 rounded object-cover border border-[var(--rm-border)] shrink-0"
                        @error="($event.target as HTMLImageElement).style.display = 'none'" />
                      <span class="truncate">{{ nodeNameById(row.from) }}</span>
                    </div>
                  </template>
                  <template #col-to="{ row }">
                    <div class="flex items-center gap-2">
                      <img v-if="nodeImageById(row.to)" :src="nodeImageById(row.to)" alt=""
                        class="w-6 h-6 rounded object-cover border border-[var(--rm-border)] shrink-0"
                        @error="($event.target as HTMLImageElement).style.display = 'none'" />
                      <span class="truncate">{{ nodeNameById(row.to) }}</span>
                    </div>
                  </template>
                  <template #col-text="{ row }">
                    <ReTag size="small" :type="relationTagType(row.text)">{{ row.text }}</ReTag>
                  </template>
                  <template #col-actions="{ row }">
                    <ReSquareButton layout="square" class="kb-btn" size="small" type="danger" :icon="Delete" tip="删除" @click="handleDeleteRelation(row)" />
                  </template>
                  <template #empty>
                    <div class="kb-tempty">
                      <h3 class="kb-tempty__t">
                        {{ graphRelationKeyword ? '没有匹配的关系' : '这个卷宗还没有关系' }}
                      </h3>
                      <p class="kb-tempty__d">
                        <template v-if="graphRelationKeyword">
                          按实体名或关系类型过滤后没有命中，换个关键词或清空过滤。
                        </template>
                        <template v-else>
                          关系连接两个已有实体。可以由 AI 从文档里抽取，也可以手工连一条。
                        </template>
                      </p>
                      <div class="kb-tempty__acts">
                        <ReButton v-if="graphRelationKeyword" @click="graphRelationKeyword = ''">清空过滤</ReButton>
                        <template v-else>
                          <ReButton type="primary" :disabled="graphNodes.length === 0" @click="openRelationForm()">新增关系</ReButton>
                          <ReButton v-if="graphNodes.length === 0" @click="openEntityForm()">先建实体</ReButton>
                          <ReButton v-if="ragReady" :loading="graphGenerating" @click="handleGenerateGraph">生成图谱</ReButton>
                        </template>
                      </div>
                    </div>
                  </template>
                </ReTable>
                <div class="pagination-wrapper">
                  <RePagination
                    v-model:current-page="relationPage"
                    v-model:page-size="relationPageSize"
                    :page-sizes="[10, 20, 50]"
                    :total="filteredGraphRelations.length"
                    layout="total, sizes, prev, pager, next"
                  />
                </div>
              </div>
            </div>
          </template>
        </main>

        <!-- ============ 右栏：问答常驻（文档视图也不收起，问答是档案台的第三根柱子） ============ -->
        <aside class="kb-ask">
          <KBAskPanel
            :kb-id="currentKB?.id || ''"
            :kb-name="currentKB?.name"
            :graph-nodes="graphNodes"
            :graph-edges="graphEdges"
            @view-graph="handleMenuSelect('graph')"
            @turn-done="onAskTurnDone"
            @turns-cleared="onAskTurnsCleared"
          />
        </aside>
      </div>
    </div>
  </div>

  <!-- 新增/编辑实体表单（表单弹窗挂在模板根部，不依赖任何视图的显示状态） -->
  <ReDialog v-model="showEntityForm" :title="entityForm.id ? '编辑实体' : '新增实体'" :width="460" :close-on-click-modal="false">
    <div class="kb flex flex-col gap-4">
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">名称<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i></label>
        <ReInput v-model="entityForm.name" maxlength="128" />
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">类型</label>
        <ReSelect v-model="entityForm.type" :data="ENTITY_TYPE_OPTIONS" class="!w-full" />
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">说明</label>
        <ReInput v-model="entityForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">图片地址</label>
        <div class="flex items-center gap-2">
          <ReInput v-model="entityForm.logo" maxlength="512" placeholder="https://… 或 /kb-images/….png；清空即移除图片" />
          <img v-if="entityForm.logo.trim()" :src="entityForm.logo.trim()" alt=""
            class="w-10 h-10 rounded-md object-cover border border-[var(--rm-border)] shrink-0" @error="($event.target as HTMLImageElement).style.visibility = 'hidden'" />
        </div>
        <p class="text-[11px] text-[var(--rm-text-secondary)] mt-1">有图片时，图谱节点会直接用图片渲染</p>
      </div>
    </div>
    <template #footer>
      <ReButton type="default" @click="showEntityForm = false">取消</ReButton>
      <ReButton type="primary" :loading="entityFormSaving" @click="handleSaveEntity">保存</ReButton>
    </template>
  </ReDialog>

  <!-- 新增关系表单（同上，挂根部） -->
  <ReDialog v-model="showRelationForm" title="新增关系" :width="460" :close-on-click-modal="false">
    <div class="kb flex flex-col gap-4">
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">源实体<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i></label>
        <ReSelect v-model="relationForm.source" :data="relationNodeOptions" filterable allow-create
          default-first-option placeholder="输入或选择已有实体名" class="!w-full" />
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">关系类型<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i></label>
        <ReInput v-model="relationForm.type" placeholder="如 镇守 / 结义 / 放走" maxlength="32" />
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">目标实体<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i></label>
        <ReSelect v-model="relationForm.target" :data="relationNodeOptions" filterable allow-create
          default-first-option placeholder="输入或选择已有实体名" class="!w-full" />
      </div>
      <p class="text-xs text-[var(--rm-text-disabled)] leading-relaxed">
        源/目标填了库里没有的名字时，会自动建一个「其它」类型的占位实体；源与目标相同会被拒绝。
      </p>
    </div>
    <template #footer>
      <ReButton type="default" @click="showRelationForm = false">取消</ReButton>
      <ReButton type="primary" :loading="relationFormSaving" @click="handleSaveRelation">保存</ReButton>
    </template>
  </ReDialog>

  <!-- 创建/编辑知识库对话框：与「新建知识库」同一套 koi ReDialog 与视觉语言 -->
  <ReDialog v-model="showKbDialog" :title="dialogMode === 'create' ? t('knowledge.page.createTitle') : t('knowledge.page.editTitle')" :width="560" :close-on-click-modal="false">
    <!-- 复用本文件已有的 .kb-form / .kb-sec / .kb-field / .kb-visibility 设计系统。
         之前这里是一套平铺的 Tailwind + 内联 SVG，与样式表里那套成体系的表单样式脱节：
         字号三档混用（13px / 12px / 11px）、数字框宽度时宽时窄、可见范围用 <br> 硬换行。 -->
    <div class="kb kb-form">
      <div class="kb-field">
        <span class="kb-label">
          {{ t('knowledge.page.kbName') }}<i class="kb-req">*</i>
        </span>
        <ReInput v-model="dialogForm.name" :placeholder="t('knowledge.page.kbNamePlaceholder')" maxlength="255" show-word-limit />
      </div>

      <div class="kb-field">
        <span class="kb-label">{{ t('common.description') }}</span>
        <ReInput v-model="dialogForm.description" type="textarea" :rows="3" :placeholder="t('knowledge.page.descriptionPlaceholder')"
          maxlength="2000" show-word-limit resize="none" />
      </div>

      <!-- 网址采集：填了网址即从该站点抓取正文入库（与手动上传文件等价，可被语义检索） -->
      <div class="kb-sec">
        <div class="kb-sec__title">网址采集</div>
        <div class="kb-field">
          <span class="kb-label">网址</span>
          <ReInput v-model="dialogForm.sourceUrl" placeholder="https://example.com/  留空表示不启用" clearable />
          <p v-if="dialogForm.sourceUrl" class="kb-hint">
            创建时会立即抓取该网址：只允许 http/https 的公网地址，内网与云元数据地址会被拒绝。
          </p>
        </div>
        <div class="kb-field">
          <span class="kb-label">同域采集页数</span>
          <ReNumberInput v-model="dialogForm.sourceMaxPages" class="kb-num kb-num--short" :min="1" :max="50" :step="1"
            controls-position="right" />
          <p class="kb-hint">1 表示只抓入口页，大于 1 会沿同域链接继续展开。</p>
        </div>
      </div>

      <!-- 嵌入模型：已改为「设置中心 → 默认模型」的全局配置，后端 sys_ai_knowledge_base 无该列，
           故此处不再放「向量模型」选择器（放了也不生效、还会标成必填误导用户）。 -->

      <!-- 分块配置 -->
      <div class="kb-sec">
        <div class="kb-sec__title">{{ t('knowledge.page.chunkSection') }}</div>
        <div class="kb-grid">
          <div class="kb-field">
            <span class="kb-label">{{ t('knowledge.page.chunkMaxSize') }}</span>
            <ReNumberInput v-model="dialogForm.chunkMaxSize" class="kb-num" :min="100" :max="5000" :step="100"
              controls-position="right" />
          </div>
          <div class="kb-field">
            <span class="kb-label">{{ t('knowledge.page.chunkOverlapSize') }}</span>
            <ReNumberInput v-model="dialogForm.chunkOverlapSize" class="kb-num" :min="0" :max="500" :step="10"
              controls-position="right" />
          </div>
          <div class="kb-field">
            <span class="kb-label">{{ t('knowledge.page.chunkMinSize') }}</span>
            <ReNumberInput v-model="dialogForm.chunkMinSize" class="kb-num" :min="10" :max="500" :step="10"
              controls-position="right" />
          </div>
        </div>
      </div>

      <!-- 可见范围：与新建弹框一致，二选一（后端只有 is_public 一列，无「团队」语义） -->
      <div class="kb-sec">
        <div class="kb-sec__title">{{ t('knowledge.page.visibility') }}</div>
        <div class="flex flex-col gap-2">
          <div class="kb-visibility" :class="{ 'is-public': !dialogForm.isPublic }" role="button" tabindex="0"
            @click="dialogForm.isPublic = false" @keydown.enter.prevent="dialogForm.isPublic = false"
            @keydown.space.prevent="dialogForm.isPublic = false">
            <el-icon class="kb-visibility__icon"><Lock /></el-icon>
            <span class="kb-visibility__text">
              <span class="kb-visibility__title">私有</span>
              <span class="kb-visibility__hint">仅自己可见</span>
            </span>
            <el-icon v-if="!dialogForm.isPublic" class="kb-visibility__check"><Select /></el-icon>
          </div>
          <div class="kb-visibility" :class="{ 'is-public': dialogForm.isPublic }" role="button" tabindex="0"
            @click="dialogForm.isPublic = true" @keydown.enter.prevent="dialogForm.isPublic = true"
            @keydown.space.prevent="dialogForm.isPublic = true">
            <el-icon class="kb-visibility__icon"><Promotion /></el-icon>
            <span class="kb-visibility__text">
              <span class="kb-visibility__title">公开</span>
              <span class="kb-visibility__hint">所有人可见</span>
            </span>
            <el-icon v-if="dialogForm.isPublic" class="kb-visibility__check"><Select /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <ReButton type="default" @click="handleKbCancel">{{ t('common.cancel') }}</ReButton>
      <ReButton type="primary" :loading="store.loading" @click="handleKbSave">
        {{ dialogMode === 'create' ? t('common.create') : t('common.save') }}
      </ReButton>
    </template>
  </ReDialog>

  <!-- 文件分块查看弹窗 -->
  <FileChunksViewer v-model="showFileChunksModal" :selected-file="selectedFile" />

  <!-- 知识点原文预览：Markdown 渲染，非 Markdown 走纯文本 -->
  <KBFilePreview v-model="previewVisible" :kb-id="currentKB?.id || ''" :path="previewPath" />

  <!-- 节点来源文档：按实体名检索，点条目看原文 -->
  <ReDialog v-model="showSourceDocs" :title="`来源文档 · ${selectedGraphNode?.name || ''}`" :width="560">
    <div v-if="sourceDocsLoading" class="py-8 text-center text-sm text-[var(--rm-text-secondary)]">
      正在检索包含「{{ selectedGraphNode?.name }}」的文档…
    </div>
    <ReEmpty v-else-if="sourceDocs.length === 0" text="未找到包含该实体的文档" />
    <div v-else class="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
      <button
        v-for="doc in sourceDocs"
        :key="doc.id"
        type="button"
        class="re-surface re-surface--dense w-full text-left px-3 py-2.5 cursor-pointer"
        @click="openFilePreview(undefined, doc.fileId)"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm font-medium truncate">{{ doc.fileName }}</span>
          <span class="ml-auto text-[11px] text-[var(--rm-text-disabled)] shrink-0">相关度 {{ doc.finalScore }}</span>
        </div>
        <div v-if="doc.heading" class="text-xs text-[var(--rm-text-secondary)] mt-0.5 truncate">{{ doc.heading }}</div>
        <div v-if="doc.content" class="text-xs text-[var(--rm-text-secondary)] mt-1">{{ doc.content }}</div>
      </button>
    </div>
  </ReDialog>

  <!-- 上传任务弹窗 -->
  <UploadTaskModal v-model="showUploadTaskModal" :upload-tasks="uploadTasksList" @retry="handleRetryFile"
    @delete="handleDeleteFile" />

  <!-- 命令面板（签名元素）：Ctrl/⌘ + K 唤起，跨 文档 / 实体 即时检索。
       用 position:fixed 覆盖全屏，不依赖 Teleport（部分外壳会劫持 body 子节点）。 -->
  <div v-if="cmdOpen" class="kbc-mask" @click.self="closeCommand">
      <div class="kbc-panel" role="dialog" aria-label="知识库检索">
        <input
          ref="cmdInputRef"
          v-model="cmdQuery"
          class="kbc-input"
          type="text"
          placeholder="搜索文档、实体…"
          @keydown="onCmdKeydown"
          @input="cmdActive = 0"
        />
        <div class="kbc-list">
          <section v-for="g in cmdResults" :key="g.key">
            <h3 class="kbc-group__title">{{ g.label }}</h3>
            <button
              v-for="(item, i) in g.items"
              :key="item.key"
              type="button"
              class="kbc-row"
              :class="{ 'is-active': cmdFlat[cmdActive]?.key === item.key }"
              @click="cmdActive = cmdFlat.findIndex((x) => x.key === item.key); runCommand()"
              @mouseenter="cmdActive = cmdFlat.findIndex((x) => x.key === item.key)"
            ><span class="kbc-row__title">{{ item.title }}</span>
              <span class="kbc-row__hint">{{ item.hint }}</span>
            </button>
          </section>
          <p v-if="cmdResults.length === 0" class="kbc-none">没有匹配结果</p>
        </div>
        <footer class="kbc-foot">
          <span>↑↓ 移动</span><span>↵ 打开</span><span>esc 关闭</span>
        </footer>
      </div>
  </div>

</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus, Search, FolderOpened, Document, Share, Connection,
  Grid, Clock, Files, Close, UploadFilled, Calendar, Refresh, Setting,
  Delete, Edit, ChatDotRound, QuestionFilled,
  // 创建/编辑弹窗「可见范围」二选一
  Lock, Promotion, Select,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useKnowledgeBaseStore } from '@/stores/knowledgeBase'
import { useAuthStore } from '@/stores/auth'
import { useFileUploadStore } from '@/stores/fileUpload'
import { knowledgeBaseApi } from '@/services/modules/knowledge-base.api'
// 显示偏好：右侧问答栏宽度（设置 → 显示 → 常规用户通用配置）
import { initKbDisplay, useKbDisplay } from '@/composables/useKbDisplay'
import type { KnowledgeBase, KBFile } from '@/stores/knowledgeBase'
import type { UploadTask } from '@/stores/fileUpload'
import { FileChunksViewer, KBFileUploader, KBFileTree, KBSearchPanel, KBTemplateGallery, UploadTaskModal } from './index'
import KnowledgeOverview from './KnowledgeOverview.vue'
// 本地资源：从设计稿的远程地址下载后入库，避免运行期外链（离线即裂、CDN 失效不可控）
import heroIllustration from '@/assets/kb/kb-empty-hero.png'
import coverSanguo from '@/assets/kb/tpl-sanguo.png'
import coverPoem from '@/assets/kb/tpl-poem.png'
import coverIdiom from '@/assets/kb/tpl-idiom.png'
import coverQuestion from '@/assets/kb/tpl-question.png'
import KBAskPanel from './KBAskPanel.vue'
import KBFilePreview from './KBFilePreview.vue'
// 关系图谱使用 G6 内核的 ReRelationGraph（@repo/ui 已提供）。
// 默认导出本身就是按主题懒加载的异步组件，再套一层 defineAsyncComponent 只会退化成联合类型。
import ReRelationGraph from '@repo/ui/re-relation-graph'
import { useStorage, useDebounceFn } from '@vueuse/core'
import { usePopup } from '@/composables/usePopup'
import { ArrowLeft24Filled, Globe24Regular, LockClosed24Regular } from '@vicons/fluent'
import PageHeader from '@/components/PageHeader.vue'
import { apiService } from '@/services/ApiService'
import { api } from '@/framework/context'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import ReDialog from '@repo/ui/re-dialog'
import ReInput from '@repo/ui/re-input'
import ReSelect from '@repo/ui/re-select'
import RePagination from '@repo/ui/re-pagination'
import { ReAlert, ReOption } from '@repo/ui/re-kit'
import ReButton from '@/components/ui/ReButton.vue'
// 仓库标准的正方形图标按钮（layout="square" 且内建 el-tooltip）：
// 工具栏 / 表格操作列的「纯图标 + 悬浮提示」统一用它，避免各处再包一层 el-tooltip。
import ReSquareButton from '@repo/ui/re-button'
import ReTag from '@/components/ui/ReTag.vue'
import ReEmpty from '@/components/ui/ReEmpty.vue'
// ReTable 换算：仓库标准表格组件（引擎选 element 保持原 el-table DOM）与列类型
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
// 模板数据集类型：携带完整文档 / 实体 / 关系，创建后整体复制进新库
import type { KbTemplateDataset } from '@/data/kb/templates/types'
import { SANGUO_DATASET } from '@/data/kb/templates/sanguo'
import ReNumberInput from '@/components/ui/ReNumberInput.vue'

// 初始化组合式函数
const { confirm, toast } = usePopup()
const { t } = useI18n()
const store = useKnowledgeBaseStore()
const authStore = useAuthStore()
// 右侧问答栏宽度（narrow / full）：绑到根节点 data-kb-ask，由 CSS 变量驱动双栏比例
const { askWidth } = useKbDisplay()
const uploadStore = useFileUploadStore()
const route = useRoute()
const router = useRouter()

// ========== 状态 ==========
const showKbDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const showUploadModal = ref(false)
const showFileChunksModal = ref(false)  // 文件分块查看弹窗
const showUploadTaskModal = ref(false)  // 上传任务弹窗
const selectedFile = ref<KBFile | null>(null)  // 选中的文件
const KB_VIEW_KEYS = ['overview', 'files', 'search', 'graph', 'ask', 'entities', 'relations'] as const
type KBViewKey = typeof KB_VIEW_KEYS[number]
const kbViewKeyFromQuery = (value: unknown): KBViewKey | null =>
  typeof value === 'string' && (KB_VIEW_KEYS as readonly string[]).includes(value)
    ? value as KBViewKey
    : null
const activeTab = ref<KBViewKey>('files')  // 当前激活的 Tab
const viewMode = ref<'list' | 'detail'>('list')  // 视图模式：列表或详情
const detailRefreshing = ref(false)  // 详情页头「刷新」进行中

/* ============================================================================
   档案台骨架（Ledger）—— 三栏常驻所需的展示态。
   全部为纯展示数据，不新增任何接口调用。
   ============================================================================ */

/**
 * 左栏「视图」入口：7 个平级 Tab 按「翻阅」与「维护」分成两段。
 *
 * <p>问答不再是一个视图目的，而是常驻右栏的第三根柱子；中栏那一页的职责是
 * 「问答记录台账」，所以标签从「智能问答」改成「问答记录」，避免左右两处同名。</p>
 */
const navViews: ReadonlyArray<{ key: KBViewKey; label: string; icon: unknown; group: 'read' | 'manage' }> = [
  { key: 'overview', label: '概览', icon: Grid, group: 'read' },
  { key: 'files', label: '文档', icon: Files, group: 'read' },
  { key: 'graph', label: '知识图谱', icon: Connection, group: 'read' },
  { key: 'search', label: '检索', icon: Search, group: 'read' },
  { key: 'ask', label: '问答记录', icon: ChatDotRound, group: 'read' },
  { key: 'entities', label: '实体管理', icon: Share, group: 'manage' },
  { key: 'relations', label: '关系管理', icon: Connection, group: 'manage' },
]

/** 阅读类视图（左栏第一段） */
const navViewsRead = navViews.filter((v) => v.group === 'read')
/** 维护类视图（左栏第二段） */
const navViewsManage = navViews.filter((v) => v.group === 'manage')

/**
 * 某个知识库的单个计数是否「已知」。
 *
 * <p>{@code per_base} 里有这条记录就是已知 —— 即便计数真的是 0（空库）。
 * 整个 kbId 缺席（接口失败或还没回来）才算未知，此时不能把「不知道」画成 0。</p>
 *
 * @param kbId 知识库ID
 * @param key 计数键
 * @returns 是否已知
 */
function hasCount(kbId: string, key: 'file_count' | 'entity_count' | 'relation_count'): boolean {
  return overview.value.per_base?.[kbId]?.[key] !== undefined
}

/** 图谱接口是否已返回过数据（拉过图之后 graphView 才是可信来源） */
function graphLoaded(): boolean {
  return graphView.entityCount > 0 || graphView.relationCount > 0 || graphView.nodes.length > 0
}

/**
 * 左栏视图行右侧的计数。
 *
 * <p><b>为什么不能只读 graphView</b>：图谱只在进入「知识图谱」视图时才真正拉取
 * （{@link loadGraph}），而左栏从进入页面起就一直在渲染。此前直接取
 * {@code graphView.entityCount}，导致刚进库时「知识图谱 / 实体管理 / 关系管理」
 * 三行一律显示 0，而同一屏的概览读数写着 248 实体 / 387 关系 —— 两处自相矛盾。</p>
 *
 * <p>这里取两者的较大值：概览接口的 per_base 计数（进页面就有）与图谱接口
 * 返回的真实计数（进过图谱页后才有，通常更准）各管一段，谁大用谁。</p>
 *
 * <p>两者都没有时返回 {@code —} 而不是 0：计数未到不是「确实是 0」，
 * 画成 0 会让人以为这个库真的一篇没抽到。</p>
 *
 * @param key 视图键
 * @returns 该视图涉及的对象数量；不适用时返回空串
 */
function navCount(key: KBViewKey): string {
  const kbId = store.activeKnowledgeBaseId || ''
  if (key === 'files') return String(filesForFilter.value.length)
  if (key === 'graph' || key === 'entities') {
    if (!hasCount(kbId, 'entity_count') && !graphLoaded()) return '—'
    return fmtCount(Math.max(graphView.entityCount, countOf(kbId, 'entity_count')))
  }
  if (key === 'relations') {
    if (!hasCount(kbId, 'relation_count') && !graphLoaded()) return '—'
    return fmtCount(Math.max(graphView.relationCount, countOf(kbId, 'relation_count')))
  }
  if (key === 'ask') return String(askTurns.value.length)
  return ''
}

/** 左栏当前高亮的文档（本地展示态，与文件树的选中互不干扰） */
const selectedDocId = ref<string | null>(null)

/**
 * 问答记录台账：由右栏 {@code KBAskPanel} 每轮结束上报，只留摘要不留正文。
 *
 * <p>中栏是「留档」，右栏才是对话本身 —— 两处各管一件事，不重复排同一段回答。</p>
 */
const askTurns = ref<Array<{
  id: number
  question: string
  citeCount: number
  entities: string[]
  elapsed?: number
  error: boolean
}>>([])

/** 右栏上报一轮问答：记账 */
function onAskTurnDone(payload: typeof askTurns.value[number]) {
  askTurns.value.push(payload)
}

/** 右栏清空对话：台账同步清空 */
function onAskTurnsCleared() {
  askTurns.value = []
}

/**
 * 某个知识库的文档篇数。
 *
 * <p>当前库优先用已拉到的扁平清单（更新更及时），其余库退回 overview 的 per_base 计数，
 * 避免为了左栏一行字去逐库列目录。</p>
 *
 * @param kbId 知识库 ID
 * @returns 文档篇数
 */
function kbFileCount(kbId: string): number {
  const cached = countOf(kbId, 'file_count')
  if (kbId === store.activeKnowledgeBaseId) {
    return Math.max(filesForFilter.value.length, cached)
  }
  return cached
}

/**
 * 卷宗脊脊线高度：按该库文档量在「当前可见最大量」里的占比取值。
 *
 * <p>用相对比例而不是绝对值，切库后同一根脊线的长度含义不变；
 * 空库返回 0%（脊线只剩底灰，不点亮品牌色）。</p>
 *
 * <p><b>两处必须守住</b>：</p>
 * <ol>
 *   <li>分母要按 {@link kbFileCount} 取，和分子同源。此前分子是 kbFileCount、
 *       分母是 countOf，概览接口那次请求一失败，分母全是 0 只剩兜底值 1，
 *       17 篇的库就算出 <b>1700%</b> —— 脊线整根溢出卡片。</li>
 *   <li>结果封顶 100%：脊线槽位只有 30px 高，超过就是溢色。</li>
 * </ol>
 *
 * @param n 文档篇数
 * @returns CSS 百分比高度
 */
function spineHeight(n: number): string {
  if (n <= 0) return '0%'
  const counts = (store.knowledgeBases || []).map((k) => kbFileCount(k.id))
  const max = Math.max(...counts, 1)
  const pct = Math.min(100, Math.max(16, Math.round((n / max) * 100)))
  return `${pct}%`
}

/**
 * 左栏卷内文档点击：既标记选中，也把正文调起来看。
 *
 * <p>左栏文档是「上下文索引」，点它应该像点目录一样直接出正文，
 * 而不是只在左栏换个底色、让用户不知道下一步做什么。</p>
 *
 * @param file 目标文档
 */
function handleNavDocClick(file: KBFile) {
  selectedDocId.value = file.id
  openFilePreview(file)
}

/**
 * 文件处理状态 → koi 语义色调。
 *
 * @param status 后端 processingStatus
 * @returns success / warning / error / info
 */
function fileTone(status: string): 'success' | 'warning' | 'error' | 'info' {
  if (status === 'completed') return 'success'
  if (status === 'failed') return 'error'
  if (status === 'processing' || status === 'pending' || status === 'queued'
    || status === 'uploading' || status === 'uploaded') return 'warning'
  return 'info'
}

/**
 * 文件处理状态 → 中文短标签。
 *
 * @param status 后端 processingStatus
 * @returns 展示文案
 */
function fileStatusLabel(status: string): string {
  const map: Record<string, string> = {
    queued: '排队中',
    uploading: '上传中',
    uploaded: '已上传',
    pending: '待处理',
    processing: '解析中',
    completed: '已索引',
    failed: '解析失败',
  }
  return map[status] || status
}

/**
 * 千分位（概览统计用，避免长数字撑破格子）。
 *
 * @param n 数字
 * @returns 带逗号的字符串
 */
function fmtNum(n: number): string {
  return (n || 0).toLocaleString('en-US')
}

/* ---------- 命令面板（签名元素）：跨 文档 / 实体 一次检索 ---------- */

/** 面板是否展开 */
const cmdOpen = ref(false)
/** 检索词 */
const cmdQuery = ref('')
/** 当前高亮行（键盘 ↑↓） */
const cmdActive = ref(0)
/** 输入框引用（展开后聚焦） */
const cmdInputRef = ref<HTMLInputElement | null>(null)

/**
 * 命令面板结果项：文档与实体共用同一形状，`kind` 区分点击后的去向。
 *
 * <p>两种结果此前各写一份 inline 对象字面量，联合起来后 `cmdFlat` 被推断成
 * 「数组 | 只读数组」的交集，模板里 `item.key` / `item.file` 全部报「属性不存在」。
 * 显式声明一个共用类型，让模板拿到稳定字段。</p>
 */
interface CmdItem {
  /** 结果种类：文档跳预览、实体跳图谱 */
  kind: 'doc' | 'entity'
  /** 唯一键（前缀区分两类，避免 id 撞车） */
  key: string
  /** 主标题 */
  title: string
  /** 右侧灰色提示 */
  hint: string
  /** 文档结果携带的文件节点；实体结果为 null */
  file: KBFile | null
  /** 实体名；文档结果为空串 */
  name: string
}

/**
 * 命令面板结果：文档来自已加载文件、实体来自图谱缓存。
 * 两者都是内存数据，因此本面板零额外请求、即时响应。
 */
const cmdResults = computed<Array<{ key: string; label: string; items: CmdItem[] }>>(() => {
  const q = cmdQuery.value.trim().toLowerCase()
  const hit = (s: string) => !q || s.toLowerCase().includes(q)
  const docs: CmdItem[] = filesForFilter.value
    .filter((f) => hit(f.displayName || f.fileName))
    .slice(0, 5)
    .map((f) => ({
      kind: 'doc' as const,
      key: `d-${f.id}`,
      title: f.displayName || f.fileName,
      hint: `${f.totalChunks || 0} 块 · ${fileStatusLabel(f.processingStatus)}`,
      file: f,
      name: '',
    }))
  // graphView 是 reactive 对象（不是 ref），这里不能写 .value
  const ents: CmdItem[] = (graphView.nodes || [])
    .filter((n) => hit(n.text || ''))
    .slice(0, 4)
    .map((n) => ({
      kind: 'entity' as const,
      key: `e-${n.id}`,
      title: n.text,
      hint: `${entityTypeLabel(n.type)} · ${n.degree ?? 0} 关系`,
      name: n.text,
      file: null,
    }))
  return [
    { key: 'doc', label: '文档', items: docs },
    { key: 'entity', label: '实体', items: ents },
  ].filter((g) => g.items.length > 0)
})

/** 扁平化结果，供 ↑↓ 定位 */
const cmdFlat = computed<CmdItem[]>(() => cmdResults.value.flatMap((g) => g.items))

/** 打开命令面板 */
function openCommand(): void {
  cmdOpen.value = true
  cmdQuery.value = ''
  cmdActive.value = 0
  nextTick(() => cmdInputRef.value?.focus())
}

/** 关闭命令面板 */
function closeCommand(): void {
  cmdOpen.value = false
}

/**
 * 执行当前高亮结果：文档 → 切到文档视图并预览；实体 → 切到图谱并聚焦该实体。
 */
function runCommand(): void {
  const item = cmdFlat.value[cmdActive.value]
  if (!item) return
  if (item.kind === 'doc' && item.file) {
    handleMenuSelect('files')
    selectedDocId.value = item.file.id
    openFilePreview(item.file)
  } else if (item.name) {
    handleMenuSelect('graph')
    openEntityInGraph(item.name)
  }
  cmdOpen.value = false
}

/**
 * 面板内键盘：↑↓ 移动、Enter 执行、Esc 关闭。
 *
 * @param e 键盘事件
 */
function onCmdKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    closeCommand()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    cmdActive.value = Math.min(cmdFlat.value.length - 1, cmdActive.value + 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    cmdActive.value = Math.max(0, cmdActive.value - 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    runCommand()
  }
}

/**
 * 全局快捷键：Ctrl/⌘ + K 唤起命令面板。
 * 在输入框/文本域内不拦截，避免抢走正在编辑的文本。
 *
 * @param e 键盘事件
 */
function onGlobalKeydown(e: KeyboardEvent): void {
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return
  const t = e.target as HTMLElement | null
  const tag = t?.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || t?.isContentEditable) return
  e.preventDefault()
  if (cmdOpen.value) {
    closeCommand()
  } else {
    openCommand()
  }
}

// ---- 关系图谱（Tab=graph）状态 ----
const graphLoading = ref(false)        // 图谱加载中
const graphError = ref('')             // 图谱加载错误
const graphKeyword = ref('')           // 实体名过滤关键词
const graphTypeFilter = ref<string[]>([]) // 实体类型过滤（空 = 不过滤）

// ---- 图谱懒加载：首屏只渲染核心节点，点击/扩线时从全量池动态补充 ----
// 全量图谱 370+ 节点/800+ 边一次交给 force-atlas2 布局会让首屏卡十几秒；
// 这里把 graphView 当作「数据池」，graphNodes 只输出「已加载集合」，
// 初始加载按 degree 取最核心的节点，点哪个节点就把它的直接邻居补充进来。
const GRAPH_LAZY_CORE = 60              // 首屏渲染的核心节点数
const lazyLoadedIds = ref<Set<string>>(new Set()) // 已动态加载的节点 id 集合
const graphLazyAll = ref(false)          // 是否已「显示全部」（true 时不再裁剪）

/** 节点 degree（后端字段 degree；无则回退 0） */
const degreeOf = (n: any): number => Math.max(0, Number(n?.degree) || 0)

/** 从池子按 degree 取前 N 个核心节点 id（不改变 lazyLoadedIds，仅计算候选） */
const topCoreIds = (limit = GRAPH_LAZY_CORE): Set<string> => {
  const base = graphBaseNodes.value as Array<any>
  const sorted = [...base].sort((a, b) => degreeOf(b) - degreeOf(a))
  const ids = new Set<string>()
  for (let i = 0; i < Math.min(limit, sorted.length); i++) {
    ids.add(String(sorted[i]?.id ?? ''))
  }
  return ids
}

/** 懒加载目标集合：已展开时 = 已加载集合（含过滤交集）；未展开时 = 核心种子 */
const graphLazyTarget = computed(() => {
  if (graphLazyAll.value) {
    return new Set<string>()
  }
  return lazyLoadedIds.value.size > 0 ? lazyLoadedIds.value : topCoreIds()
})

/** 播种首屏核心节点：把当前（含过滤后）按 degree 取的核心节点写入已加载集合 */
function seedLazyGraph() {
  if (graphLazyAll.value) {
    return
  }
  lazyLoadedIds.value = topCoreIds()
}

/** 把指定节点及其直接邻居加入已加载集合（点击节点时调用，实现动态添加） */
function expandLazyNeighbors(id: string) {
  const ids = new Set(lazyLoadedIds.value)
  // 首屏种子未写入时先播种，避免「点击后只剩被点节点」的断崖
  if (ids.size === 0) {
    for (const c of topCoreIds()) ids.add(c)
  }
  ids.add(id)
  const raw = graphView.nodes as Array<any>
  const idSet = new Set(raw.map((n) => String(n?.id ?? '')))
  for (const e of graphView.edges as Array<any>) {
    const f = String(e?.from ?? '')
    const t = String(e?.to ?? '')
    if (f === id && idSet.has(t)) ids.add(t)
    if (t === id && idSet.has(f)) ids.add(f)
  }
  lazyLoadedIds.value = ids
}

/** 显示全部：不再裁剪，回到全量图谱。
 *  <p>「只看人物」（graphTypeFilter）与关键词搜索（graphKeyword）同样会裁剪画布，
 *  若只清懒加载裁剪，「显示全部」后面仍被过滤锁死（如原仍只有人物）。
 *  因此这里一并还原类型过滤与关键词，确保画布回到完整 370 节点。</p>
 */
function showAllGraph() {
  graphLazyAll.value = true
  graphTypeFilter.value = []
  graphKeyword.value = ''
  lazyLoadedIds.value = new Set((graphView.nodes as Array<any>).map((n) => String(n?.id ?? '')))
}

/** 清空懒加载状态（重载/切换图谱时调用） */
function resetGraphLazy() {
  lazyLoadedIds.value = new Set()
  graphLazyAll.value = false
}

// 筛选（只看人物 / 实体类型 / 关键词）变化时重新播种核心节点：
// 让新过滤范围内的核心节点立即可见，而不是保留旧范围已加载节点（过滤语义优先）
watch([graphTypeFilter, graphKeyword], () => {
  if (graphView.nodes.length === 0 || graphLazyAll.value) return
  seedLazyGraph()
})
const graphCount = ref(0)              // 图谱元素总数（上传后判断要不要整图刷新）
const graphView = reactive({           // 后端返回的原始图谱
  nodes: [] as any[],
  edges: [] as any[],
  entityCount: 0,
  relationCount: 0,
  // true = 该范围还没抽取过关系（占位图），false = 抽过但确实没有关系
  placeholder: true,
})


// ---- 节点来源文档（「查看来源文档」弹窗） ----
// 图谱节点本身不带来源文档路径（后端 /v2/rag/graph 只返回 id/text/type/degree），
// 这里按实体名检索，取回包含该实体的文档作为来源文档。
const showSourceDocs = ref(false)     // 来源文档弹窗显隐
const sourceDocsLoading = ref(false)  // 检索中
const sourceDocs = ref<any[]>([])     // 来源文档列表

// ---- 节点尺寸：关系越多节点越大，且必须封顶封底 ----
// 后端只给「关系条数 degree」，像素尺寸是展示层决策，放在前端便于随时调参
/** 节点最小边长（像素）：0 关系的孤立实体也不会缩成一个点 */
const NODE_MIN_SIZE = 36
/** 节点最大边长（像素）：防止超级节点把图撑爆、挤掉其它实体 */
const NODE_MAX_SIZE = 96
/** 每 1 条关系增加的边长（像素） */
const NODE_SIZE_STEP = 8

/**
 * 按关系条数算节点边长，并做上下限截断。
 * @param degree 关系条数（后端给的实体度数）
 * @returns 节点边长（像素），必定落在 [NODE_MIN_SIZE, NODE_MAX_SIZE]
 */
function nodeSizeOf(degree: unknown): number {
  const d = Math.max(0, Number(degree) || 0)
  const raw = NODE_MIN_SIZE + d * NODE_SIZE_STEP
  return Math.min(NODE_MAX_SIZE, Math.max(NODE_MIN_SIZE, raw))
}

/**
 * 实体类型 → 节点填充色。
 *
 * <p>G6 v5 的节点 {@code type} 是**图元原型**（circle/rect/…），不是业务类型，
 * 所以「人物/地点/事件/组织」的区分只能靠填充色与图例，不能再塞进 {@code type}。</p>
 */
const ENTITY_COLORS: Record<string, string> = {
  person: '#3b82f6',
  location: '#10b981',
  event: '#f59e0b',
  organization: '#ef4444',
  other: '#8b93a7',
}

/**
 * 实体类型 → 节点色（未知类型回退到 other）。
 * @param t 实体类型
 * @returns 十六进制色值
 */
function entityColor(t: string): string {
  return ENTITY_COLORS[t] ?? ENTITY_COLORS.other
}

// ---- 实体 / 关系手工维护 ----
const graphEntityKeyword = ref('')
const graphRelationKeyword = ref('')
const selectedEntityUids = ref<string[]>([])
const selectedRelationUids = ref<string[]>([])
const showEntityForm = ref(false)
const showRelationForm = ref(false)
const entityFormSaving = ref(false)
const relationFormSaving = ref(false)

/** 实体类型可选项（与后端 normalizeType 的取值域一致） */
const ENTITY_TYPE_OPTIONS = [
  { value: 'person', label: '人物' },
  { value: 'location', label: '地点' },
  { value: 'event', label: '事件' },
  { value: 'organization', label: '组织' },
  { value: 'other', label: '其它' },
]

const entityForm = reactive({ id: '', name: '', type: 'other', description: '', logo: '' })
const relationForm = reactive({ source: '', type: '', target: '' })

/**
 * 关系表单「源 / 目标实体」下拉候选。
 *
 * <p>走 ReSelect 的 {@code data} 而不是 el-option 子节点：ReSelect 内部给 el-select 绑了
 * filter-method（远程检索用），Element Plus 一旦拿到 filter-method 就不再内置过滤，
 * 子节点选项的搜索框会「打字没反应」。data 形态由 ReSelect 自己按关键词过滤，搜索才有效。</p>
 */
const relationNodeOptions = computed(() =>
  graphView.nodes.map((n) => ({ label: n.text, value: n.text })),
)

/**
 * 实体类型 → 中文标签。
 * @param t 后端返回的类型
 * @returns 中文标签
 */
function entityTypeLabel(t: string): string {
  return ENTITY_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? '其它'
}

/**
 * 实体类型 → el-tag 的色系。
 * @param t 后端返回的类型
 * @returns el-tag 的 type
 */
function entityTagType(t: string): 'success' | 'info' | 'warning' | 'danger' | 'primary' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'primary'> = {
    person: 'primary',
    location: 'success',
    event: 'warning',
    organization: 'danger',
    other: 'info',
  };
  return map[t] ?? 'info';
}

/** 管理面板里的实体列表（不按关键词过滤） */
const graphEntities = computed(() => graphView.nodes);
/** 按名称过滤后的实体 */
const filteredGraphEntities = computed(() => {
  const kw = graphEntityKeyword.value.trim().toLowerCase();
  if (!kw) return graphEntities.value;
  return graphEntities.value.filter((n) => String(n.text ?? '').toLowerCase().includes(kw));
});
/** 管理面板里的关系列表 */
const graphRelations = computed(() => graphView.edges);
/** 按实体名或关系类型过滤后的关系 */
const filteredGraphRelations = computed(() => {
  const kw = graphRelationKeyword.value.trim().toLowerCase();
  if (!kw) return graphRelations.value;
  return graphRelations.value.filter((e) => {
    const src = String(nodeNameById(e.from) ?? '').toLowerCase();
    const dst = String(nodeNameById(e.to) ?? '').toLowerCase();
    const txt = String(e.text ?? '').toLowerCase();
    return src.includes(kw) || dst.includes(kw) || txt.includes(kw);
  });
});

// ---- 管理页式分页：实体 / 关系都在本地数据上切页，不打后端 ----
const entityPage = ref(1)
const entityPageSize = ref(20)
const relationPage = ref(1)
const relationPageSize = ref(20)

/** 当前页实体（对过滤结果切页，「搜索 + 表格 + 分页」的表格数据源） */
const pagedGraphEntities = computed(() => {
  const start = (entityPage.value - 1) * entityPageSize.value
  return filteredGraphEntities.value.slice(start, start + entityPageSize.value)
})

/** 当前页关系（同上） */
const pagedGraphRelations = computed(() => {
  const start = (relationPage.value - 1) * relationPageSize.value
  return filteredGraphRelations.value.slice(start, start + relationPageSize.value)
})

/** 两个表格的引用：翻页 / 换词 / 换库时清掉表格内部勾选，避免与批量删除计数不一致 */
const entityTableRef = ref<any>(null)
const relationTableRef = ref<any>(null)

// 实体表列：名称 / 类型（模板插槽渲染图片、标签、操作按钮）；静态中文标签，无需 t()
// 宽度合计必须 ≤ 中栏可用宽度（1512 下 538 - 勾选列 50 = 488）：名称列是唯一的弹性列，
// 固定列一旦超配，`.kb-tablecard` 的 overflow:hidden 会把「操作」列直接切掉。
const entityColumns: ReTableColumn[] = [
  { prop: 'name', label: '名称', minWidth: 120, slot: 'name' },
  { prop: 'type', label: '类型', width: 100, slot: 'type' },
  { prop: 'degree', label: '关系数', width: 76, align: 'right' },
  { prop: 'actions', label: '操作', width: 104, align: 'right', slot: 'actions' },
]

// 关系表列：源 / 关系 / 目标（模板插槽渲染头像+实体名、关系标签、删除按钮）
// 同上：源/目标两列弹性，其余固定列压到够用为止，避免右侧删除按钮被切。
const relationColumns: ReTableColumn[] = [
  { prop: 'from', label: '源', minWidth: 110, slot: 'from' },
  { prop: 'text', label: '关系', width: 96, slot: 'text' },
  { prop: 'to', label: '目标', minWidth: 110, slot: 'to' },
  { prop: 'actions', label: '操作', width: 84, align: 'right', slot: 'actions' },
]

// 换过滤词回第一页；数据变少（删除 / 换库）后把越界页码钳回最后一页
watch(graphEntityKeyword, () => { entityPage.value = 1 })
watch(graphRelationKeyword, () => { relationPage.value = 1 })
watch(() => filteredGraphEntities.value.length, (len) => {
  const maxPage = Math.max(1, Math.ceil(len / entityPageSize.value))
  if (entityPage.value > maxPage) entityPage.value = maxPage
})
watch(() => filteredGraphRelations.value.length, (len) => {
  const maxPage = Math.max(1, Math.ceil(len / relationPageSize.value))
  if (relationPage.value > maxPage) relationPage.value = maxPage
})

// 翻页 / 换词 / 改页大小时清空勾选：批量删除只应作用于当前看得见的行
watch([entityPage, entityPageSize, graphEntityKeyword], () => {
  entityTableRef.value?.clearAllSelection?.()
  selectedEntityUids.value = []
})
watch([relationPage, relationPageSize, graphRelationKeyword], () => {
  relationTableRef.value?.clearAllSelection?.()
  selectedRelationUids.value = []
})

// 图谱数据整体更换（重新拉取 / 换库）后清空勾选，避免残留指向旧行的 id
watch(() => graphView.nodes, () => {
  entityTableRef.value?.clearAllSelection?.()
  selectedEntityUids.value = []
})
watch(() => graphView.edges, () => {
  relationTableRef.value?.clearAllSelection?.()
  selectedRelationUids.value = []
})

/**
 * 节点 id → 显示名（关系列表要把 uid 还原成实体名）。
 * @param id 节点 id
 * @returns 实体名，未知 id 返回原值
 */
function nodeNameById(id: string): string {
  const hit = graphView.nodes.find((n) => n.id === id);
  return hit ? String(hit.text ?? '') : String(id ?? '');
}

/**
 * 节点 id → 头像地址（关系表两端要与实体表的「头像 + 名称」一致）。
 *
 * @param id 节点 id
 * @returns 头像 URL，没有图片时返回空串
 */
function nodeImageById(id: string): string {
  const hit = graphView.nodes.find((n) => n.id === id);
  return hit ? String((hit as Record<string, unknown>).image ?? '') : '';
}

/**
 * 关系类型 → 标签配色。
 *
 * <p>按类型名做稳定散列，同一类型每次渲染颜色一致，避免每次刷新标签都在变。
 * 实体类型用的是固定语义映射（人物/事件/地点/组织），关系没有这层语义，
 * 因此退化为散列配色。</p>
 *
 * @param t 关系类型
 * @returns el-tag 的 type
 */
function relationTagType(t: string): 'success' | 'info' | 'warning' | 'danger' | 'primary' {
  const palette = ['primary', 'success', 'warning', 'info', 'danger'] as const;
  const s = String(t ?? '');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return palette[h % palette.length];
}

/**
 * 打开管理面板。
 * @param tab 初始页签
 */
/**
 * 教育场景模板清单（总览页用）。
 *
 * <p>封面是**已下载入库的本地资源**。模板本身仍是静态清单 —— 后端没有知识库模板接口，
 * 卡上的「84 实体 · 196 关系」取自设计稿的静态定义，是模板宣称的预置规模，
 * 不是某个真实库的运行数据；后端出模板接口后换成接口数据即可。</p>
 */
const overviewTemplates = computed(() => [
  { key: 'sanguo', name: '三国演义知识图谱', cover: coverSanguo, entity: SANGUO_DATASET.entities.length, relation: SANGUO_DATASET.relations.length },
  { key: 'poem', name: '古诗词库', cover: coverPoem, entity: 0, relation: 0 },
  { key: 'idiom', name: '成语库', cover: coverIdiom, entity: 0, relation: 0 },
  { key: 'question', name: '题库知识库', cover: coverQuestion, entity: 0, relation: 0 },
])

/**
 * 总览页的知识库列表（含封面 / 计数 / 就绪态）。
 *
 * <p>这是**进入已有知识库的唯一入口**：缺了它，有库时页面上看不到也点不进去，
 * 详情页整体不可达。</p>
 */
const overviewBases = computed(() =>
  filteredKnowledgeBases.value.map((kb) => ({
    id: kb.id,
    name: kb.name,
    description: kb.description,
    cover: (kb as { cover?: string }).cover,
    fileCount: countOf(kb.id, 'file_count'),
    entityCount: countOf(kb.id, 'entity_count'),
    relationCount: countOf(kb.id, 'relation_count'),
    ready: isKbReady(kb),
    isPublic: !!kb.isPublic,
  })),
)

/**
 * 从总览列表进入知识库详情。
 *
 * @param kb 被点击的列表条目
 */
function handleOverviewOpen(kb: { id: string }) {
  const target = filteredKnowledgeBases.value.find((x) => x.id === kb.id)
  if (target) {
    handleSelectKB(target)
  }
}

/**
 * 总览页编辑提交：切到既有的知识库编辑流程（复用其校验与保存）。
 *
 * @param p 总览弹窗交回的字段
 */
function handleOverviewUpdate(p: { id: string; name: string; description: string; isPublic: boolean }) {
  const target = filteredKnowledgeBases.value.find((x) => x.id === p.id)
  if (target) {
    handleEdit(target)
  }
}

/**
 * 总览页删除：复用既有的删除确认流程。
 *
 * @param kb 目标列表条目
 */
function handleOverviewDelete(kb: { id: string }) {
  const target = filteredKnowledgeBases.value.find((x) => x.id === kb.id)
  if (target) {
    handleDelete(target)
  }
}

/**
 * 总览页提交新建：复用既有建库流程，把总览弹窗收集到的字段填进既有表单。
 *
 * @param p 总览弹窗交回的字段（只含后端真实支持的项）
 */
function handleOverviewCreate(p: { name: string; description: string; isPublic: boolean }) {
  // 一次弹框一次落库：把总览页 ReDialog 交回的字段直接写进 dialogForm 并调用同一条保存路径，
  // 不再 handleOpenCreate() 打开旧的 .kb-dialog（那样会变成「两次弹框、要点两次创建」）。
  dialogForm.id = ''
  dialogForm.name = p.name
  dialogForm.description = p.description
  dialogForm.isPublic = p.isPublic
  dialogForm.chunkMaxSize = 1000
  dialogForm.chunkOverlapSize = 100
  dialogForm.chunkMinSize = 50
  dialogForm.sourceUrl = ''
  dialogForm.sourceMode = 'snapshot'
  dialogForm.sourceMaxPages = 1
  dialogMode.value = 'create'
  void handleKbSave()
}

/**
 * 总览页搜索：写入左栏筛选关键词，交给同一套过滤逻辑。
 *
 * <p>此前写的是一个独立的 searchKeyword，但它只被一份重复声明的
 * filteredKnowledgeBases 读取 —— 那份重复声明直接把整个 SFC 编译打断
 * （Identifier 'filteredKnowledgeBases' has already been declared），
 * 知识库页 500 白屏。搜索统一走 kbFilter。</p>
 *
 * @param kw 关键词
 */
function handleOverviewSearch(kw: string) {
  kbFilter.value = kw
}

/** 是否展示「从模板创建」页（覆盖列表视图） */
const showTplGallery = ref(false)

/** 总览页实例：用于把「使用此模板创建」切到它的 koi ReDialog */
const overviewRef = ref<any>(null)

/**
 * 主页面（列表视图）的两种数据形态，二者都由同一套模板渲染，不是两个页面：
 *
 * <ul>
 *   <li><b>0 个知识库</b>：走 kb-empty 分支 —— 「开始创建你的第一个知识库」标题行 +
 *       创建引导插图 + 「空白创建 / 从模板创建」双入口 + 「教育场景模板」区。
 *       这是产品定的主页面样式，不是临时占位。</li>
 *   <li><b>≥1 个知识库</b>：走卡片网格 —— 首个库为大卡（含封面位与计数徽标），
 *       其余为小卡，右栏为「最近活动」。</li>
 * </ul>
 *
 * <p>要不要看到哪一种，只取决于库里有没有数据，与代码版本无关。</p>
 */

/**
 * 用模板创建知识库。
 *
 * <p>模板携带完整数据集（文档 + 实体 + 关系）：这里先记住数据集并切到建库弹框，
 * 建库成功后由 {@link materializeTemplate} 整体复制进新库。</p>
 *
 * @param name    模板名 / 知识库名
 * @param dataset 模板数据集（文档 + 实体 + 关系）
 */
function handleTemplateCreate(name: string, dataset?: KbTemplateDataset) {
  showTplGallery.value = false
  // 模板携带的完整数据集：建库成功后整体复制（文档 + 实体 + 关系，见 materializeTemplate）
  pendingTemplateDataset.value = dataset ?? { docs: [], entities: [], relations: [] }
  // 注意：handleOpenCreate() 无参，且模板里多处写作 @click="handleOpenCreate"
  // （Vue 会把事件对象当第一个实参），所以这里不能给它加形参，
  // 只能在它把表单重置完之后再写名字，否则 dialogForm.name 会被 MouseEvent 覆盖。
  // 统一走总览页的 koi ReDialog（不再弹父页面旧的 .kb-dialog）；
  // 总览页与模板页是 v-else-if 互斥的，必须等它挂载后再调用。
  nextTick(() => {
    const ov = overviewRef.value as { openCreate?: (n?: string) => void } | null
    if (ov && typeof ov.openCreate === 'function') {
      ov.openCreate(name)
    } else {
      handleOpenCreate()
      dialogForm.name = name
    }
  })
}

/** 模板携带的完整数据集（建库成功后整体复制；空数据集表示非模板创建） */
const pendingTemplateDataset = ref<KbTemplateDataset>({ docs: [], entities: [], relations: [] })

/**
 * 把模板携带的完整数据集整体复制进新建的知识库。
 *
 * <p>顺序：先写文档（按 path 的目录层级逐篇 {@code PUT /bases/{id}/file} 并建索引），
 * 再建实体（{@code POST /v2/rag/graph/entity}，带真实类型 person/organization/event/location），
 * 最后建关系（{@code POST /v2/rag/graph/relation}）。这样图谱里既有实体又有关系，
 * 且实体类型正确，不会退化成清一色 other 占位节点。</p>
 *
 * @param kbId   新建知识库标识
 * @param kbName 新建知识库名称（图谱写入端点的 knowledge_base_name 参数）
 */
async function materializeTemplate(kbId: string, kbName: string) {
  const dataset = pendingTemplateDataset.value
  pendingTemplateDataset.value = { docs: [], entities: [], relations: [] }
  if (!dataset || (!dataset.docs.length && !dataset.entities.length && !dataset.relations.length)) {
    return
  }

  let docsOk = 0
  let entitiesOk = 0
  let relationsOk = 0

  // 1) 文档：保留目录层级（如 人物/关羽.md），后端写入时自动建父目录
  for (const doc of dataset.docs) {
    try {
      const segments = String(doc.path).split('/')
      const fileName = segments.pop() || doc.path
      const targetDir = segments.join('/') || null
      const file = new File([doc.content], fileName, { type: 'text/markdown' })
      await knowledgeBaseApi.uploadKBFile(kbId, file, targetDir)
      docsOk++
    } catch (e) {
      console.warn('[KB] 模板文档写入失败:', doc.path, e)
    }
  }

  // 2) 实体：先建好带类型的节点，避免关系端点退化成 other 占位
  for (const entity of dataset.entities) {
    try {
      await knowledgeBaseApi.createGraphEntity(kbId, kbName, entity.name, entity.type, entity.description, entity.image ?? '')
      entitiesOk++
    } catch (e) {
      console.warn('[KB] 模板实体写入失败:', entity.name, e)
    }
  }

  // 3) 关系：端点不存在时后端自动补占位实体
  for (const relation of dataset.relations) {
    try {
      await knowledgeBaseApi.createGraphRelation(kbId, kbName, relation.source, relation.target, relation.type)
      relationsOk++
    } catch (e) {
      console.warn('[KB] 模板关系写入失败:', relation.source, '->', relation.target, e)
    }
  }

  if (docsOk || entitiesOk || relationsOk) {
    toast.success(`模板数据已复制：${docsOk} 篇文档 · ${entitiesOk} 个实体 · ${relationsOk} 条关系`)
  }
  if (fileTreeRef.value && fileTreeRef.value.forceReload) {
    await fileTreeRef.value.forceReload()
  }
}

/**
 * 二级菜单的视图项切换。
 *
 * @param key 目标视图 key（overview / files / search / graph / ask / entities / relations）
 */
function handleMenuSelect(key: string) {
  const next = kbViewKeyFromQuery(key)
  if (next) {
    if (next === 'graph' && graphView.nodes.length > 0) {
      graphEverMounted.value = true
    }
    activeTab.value = next
  }
}

/**
 * 二级菜单的动作项：设置沿用知识库编辑弹框（实体/关系管理已改为内联视图项，不再走这里）。
 *
 * @param key 动作 key（settings）
 */
function handleMenuAction(key: string) {
  if (key === 'settings' && currentKB.value) {
    handleEdit(currentKB.value)
  }
}

/**
 * 详情页头「刷新」：按当前视图重拉数据；页头副标题统计始终跟着刷。
 */
async function refreshDetail() {
  detailRefreshing.value = true
  try {
    const tab = activeTab.value
    if (tab === 'graph' || tab === 'entities' || tab === 'relations') {
      await loadGraph()
    } else if (tab === 'files') {
      await refreshFileList()
    }
    await loadOverview()
  } finally {
    detailRefreshing.value = false
  }
}

/**
 * 切到实体 / 关系管理视图（内联 Tab，不再弹框，与其它视图风格统一）。
 *
 * @param tab entity 或 relation
 */
function goManage(tab: 'entity' | 'relation') {
  selectedEntityUids.value = []
  selectedRelationUids.value = []
  activeTab.value = tab === 'entity' ? 'entities' : 'relations'
}

/** 实体表多选变化 */
function onEntitySelection(rows: any[]) {
  selectedEntityUids.value = rows.map((r) => String(r.id));
}
/** 关系表多选变化 */
function onRelationSelection(rows: any[]) {
  selectedRelationUids.value = rows.map((r) => String(r.id));
}

/**
 * 打开实体表单；传 row 表示编辑，不传表示新增。
 * @param row 实体行，可空
 */
function openEntityForm(row?: any) {
  entityForm.id = row?.id ? String(row.id) : '';
  entityForm.name = row?.text ? String(row.text) : '';
  entityForm.type = row?.type ? String(row.type) : 'other';
  entityForm.description = String(row?.data?.description ?? '');
  entityForm.logo = String(row?.image ?? '');
  showEntityForm.value = true;
}

/** 打开关系表单（仅新增，关系不支持改语义） */
function openRelationForm() {
  relationForm.source = '';
  relationForm.type = '';
  relationForm.target = '';
  showRelationForm.value = true;
}

/**
 * 保存实体（新增或编辑）。
 */
async function handleSaveEntity() {
  const kbId = store.activeKnowledgeBaseId;
  const name = entityForm.name.trim();
  if (!kbId) return toast.error('请先选择知识库');
  if (!name) return toast.error('实体名称不能为空');
  entityFormSaving.value = true;
  try {
    if (entityForm.id) {
      await apiService.updateGraphEntity(kbId, entityForm.id, {
        name,
        type: entityForm.type,
        description: entityForm.description,
        logo: entityForm.logo.trim(),
      });
    } else {
      await apiService.createGraphEntity(kbId, (store.getActiveKnowledgeBase()?.name ?? ''), name, entityForm.type, entityForm.description, entityForm.logo.trim());
    }
    toast.success(entityForm.id ? '已保存' : '已新增实体');
    showEntityForm.value = false;
    await loadGraph();
    await refreshGraphCount();
  } catch (e: any) {
    toast.error(e?.message || '保存实体失败');
  } finally {
    entityFormSaving.value = false;
  }
}

/**
 * 保存关系。
 */
async function handleSaveRelation() {
  const kbId = store.activeKnowledgeBaseId;
  const s = relationForm.source.trim();
  const t = relationForm.target.trim();
  const type = relationForm.type.trim();
  if (!kbId) return toast.error('请先选择知识库');
  if (!s || !t) return toast.error('源与目标实体都要填');
  if (!type) return toast.error('关系类型不能为空');
  if (s === t) return toast.error('源与目标不能是同一个实体');
  relationFormSaving.value = true;
  try {
    await apiService.createGraphRelation(kbId, (store.getActiveKnowledgeBase()?.name ?? ''), s, t, type);
    toast.success('已新增关系');
    showRelationForm.value = false;
    await loadGraph();
    await refreshGraphCount();
  } catch (e: any) {
    toast.error(e?.message || '新增关系失败');
  } finally {
    relationFormSaving.value = false;
  }
}

/**
 * 删除单个实体。
 * @param row 实体行
 */
async function handleDeleteEntity(row: any) {
  const kbId = store.activeKnowledgeBaseId;
  if (!kbId) return;
  const confirmed = await confirm(`删除实体「${row.text}」？指向它的关系也会一并删除。`, '', {
    type: 'warning', confirmText: '删除', cancelText: '取消',
  });
  if (!confirmed) return;
  try {
    await apiService.deleteGraphEntity(kbId, String(row.id));
    toast.success('已删除');
    await loadGraph();
    await refreshGraphCount();
  } catch (e: any) {
    toast.error(e?.message || '删除实体失败');
  }
}

/**
 * 批量删除实体。
 */
async function handleBatchDeleteEntities() {
  const kbId = store.activeKnowledgeBaseId;
  if (!kbId || selectedEntityUids.value.length === 0) return;
  const n = selectedEntityUids.value.length;
  const confirmed = await confirm(`批量删除 ${n} 个实体？指向它们的关系也会一并删除。`, '', {
    type: 'warning', confirmText: '删除', cancelText: '取消',
  });
  if (!confirmed) return;
  try {
    const r = await apiService.batchDeleteGraphEntities(kbId, selectedEntityUids.value);
    toast.success(`已删除 ${r?.deleted ?? n} 个实体`);
    selectedEntityUids.value = [];
    await loadGraph();
    await refreshGraphCount();
  } catch (e: any) {
    toast.error(e?.message || '批量删除失败');
  }
}

/**
 * 删除单条关系。
 * @param row 关系行
 */
async function handleDeleteRelation(row: any) {
  const kbId = store.activeKnowledgeBaseId;
  if (!kbId) return;
  const confirmed = await confirm(`删除关系「${nodeNameById(row.from)} --[${row.text}]--> ${nodeNameById(row.to)}」？`, '', {
    type: 'warning', confirmText: '删除', cancelText: '取消',
  });
  if (!confirmed) return;
  try {
    await apiService.deleteGraphRelation(kbId, String(row.id));
    toast.success('已删除');
    await loadGraph();
    await refreshGraphCount();
  } catch (e: any) {
    toast.error(e?.message || '删除关系失败');
  }
}

/**
 * 批量删除关系。
 */
async function handleBatchDeleteRelations() {
  const kbId = store.activeKnowledgeBaseId;
  if (!kbId || selectedRelationUids.value.length === 0) return;
  const n = selectedRelationUids.value.length;
  const confirmed = await confirm(`批量删除 ${n} 条关系？`, '', {
    type: 'warning', confirmText: '删除', cancelText: '取消',
  });
  if (!confirmed) return;
  try {
    const r = await apiService.batchDeleteGraphRelations(kbId, selectedRelationUids.value);
    toast.success(`已删除 ${r?.deleted ?? n} 条关系`);
    selectedRelationUids.value = [];
    await loadGraph();
    await refreshGraphCount();
  } catch (e: any) {
    toast.error(e?.message || '批量删除失败');
  }
}

/**
 * 势力归属：从「人物 ↔ organization 势力」的任意边推导 人物 → 势力名，用于按势力分组。
 *
 * <p>三国模板里人物的势力归属分散在多种关系里：{@code 从属}（廖化→蜀汉）、
 * {@code 效力/成员/统领/统治/创立/建立}（曹操→曹魏、刘备→蜀汉、孙权→东吴）等。
 * 只要一条边的另一端是 organization 实体，就把该人物归入对应势力；这样绝大部分
 * 人物都能进组合容器，同势力的武将文臣被包进同一区块（参考图「蜀 / 刘备 / 诸葛亮…」）。
 * 完全没有势力关联的节点保留按实体类型分组，不因无归属而丢失。</p>
 */
const factionGroup = computed(() => {
  const map = new Map<string, string>()
  const nameOf = new Map<string, string>()
  const typeOf = new Map<string, string>()
  for (const n of (graphView.nodes as Array<any>) ?? []) {
    const id = String(n?.id ?? '')
    nameOf.set(id, String(n?.text ?? n?.label ?? ''))
    typeOf.set(id, String(n?.type ?? ''))
  }
  for (const e of (graphView.edges as Array<any>) ?? []) {
    const from = String(e?.from ?? '')
    const to = String(e?.to ?? '')
    if (!from || !to) continue
    // 人物 ↔ 势力：任一端是 organization 就把它另一端归入该势力名
    const fromType = typeOf.get(from)
    const toType = typeOf.get(to)
    const personId = fromType === 'person' && toType === 'organization' ? from
      : toType === 'person' && fromType === 'organization' ? to
      : ''
    const orgId = personId ? (from === personId ? to : from) : ''
    if (!personId || !orgId) continue
    const org = nameOf.get(orgId) || orgId
    // 多势力归属时优先记录（人物跨势力如「刘备→东汉朝廷 / 蜀汉」取更名的后一次）
    map.set(personId, org)
  }
  return map
})

/**
 * 后端节点 → {@code ReRelationGraph} 的 RelationNode 契约。
 *
 * <p><b>关键修复</b>：G6 v5 的 {@code type} 是**图元原型**（circle/rect/…），
 * 后端给的 {@code person/location/event} 不是注册过的原型，直接透传会让 G6 抛
 * 「The element person of node is not registered.」并**整张图的节点都不渲染**。
 * 因此这里把原型固定为 circle，实体类型改放 {@code data.entityType} 并由
 * {@code style.fill} 上色，名称走 {@code label}；<b>实体带图片（image）时改用
 * G6 的 image 原型直接渲染图片</b>，此时 fill 不生效，stroke 作为图片描边。</p>
 *
 * @param n 后端节点（id / text / type / degree / image）
 * @returns 符合 {@code RelationNode} 的节点
 */
function decorateGraphNode(n: any) {
  const entityType = String(n?.type ?? 'other')
  const size = nodeSizeOf(n?.degree)
  const name = String(n?.text ?? n?.label ?? n?.id ?? '')
  // 有图的实体直接用图片节点原型（G6 image），无图才回退 circle 上色
  const image = String(n?.image ?? '').trim()
  return {
    id: String(n?.id ?? ''),
    // 同时保留 text 与 label：text 供 KBAskPanel 的迷你子图（走后端契约），
    // label 供 G6（ReRelationGraph 的 RelationNode 契约）渲染节点名。
    text: name,
    label: name,
    type: image ? ('image' as const) : ('circle' as const),
    image: image || undefined,
    size,
    // 分组容器：人物优先按势力分组（从「人物↔organization」任意边推导），
    // 找不到势力归属的人物不设 group —— 否则 60+ 个「无势力」人物会全部
    // 回退到 entityType='person'、被塞进同一个 person 大 combo，视觉上糊成一团。
    // 其它实体类型（event/location/…）仍按类型分组。
    group: entityType === 'person'
      ? (factionGroup.value.get(String(n?.id ?? '')) || undefined)
      : entityType,
    style: {
      fill: image ? undefined : entityColor(entityType),
      stroke: 'rgba(255,255,255,0.85)',
      lineWidth: 1.5,
    },
    data: {
      ...(n?.data ?? {}),
      degree: Math.max(0, Number(n?.degree) || 0),
      entityType,
    },
  }
}

/**
 * 经过「实体类型 + 实体名关键词」两道过滤后的**原始**后端节点。
 *
 * <p>先按实体类型收窄候选集，再做关键词命中 + 邻居展开。顺序很关键：
 * 若先展开邻居再过滤类型，被顺带带出来的邻居会被类型过滤丢掉，关键词命中点反而消失；
 * 先收窄则两个条件始终同时生效。</p>
 *
 * <p>图例也基于这份**未装饰**的节点计算 —— {@link decorateGraphNode} 会把
 * {@code type} 覆写成 G6 的节点原型（{@code 'image' | 'circle'}），
 * 实体类型只留在 {@code data.entityType}，从装饰后的节点取不到类型。</p>
 */
const graphBaseNodes = computed(() => {
  const types = new Set(graphTypeFilter.value)
  const base = types.size
    ? (graphView.nodes as Array<any>).filter((n) => types.has(String(n?.type ?? 'other')))
    : graphView.nodes

  const kw = graphKeyword.value.trim().toLowerCase()
  if (!kw) {
    return base
  }
  const hit = new Set(
    base
      .filter((n) => String(n.text ?? '').toLowerCase().includes(kw))
      .map((n) => n.id),
  )
  if (hit.size === 0) {
    return []
  }
  const keep = new Set(hit)
  for (const e of graphView.edges) {
    if (hit.has(e.from)) {
      keep.add(e.to)
    }
    if (hit.has(e.to)) {
      keep.add(e.from)
    }
  }
  return base.filter((n) => keep.has(n.id))
})

/** 按关键词过滤后的节点：命中实体及其直接邻居都保留，避免过滤后只剩孤点。
 *  懒加载模式下再按 {@link graphLazyTarget} 裁剪，只输出已加载的核心/展开节点。 */
const graphNodes = computed(() => {
  const target = graphLazyTarget.value
  if (target.size === 0) {
    return graphBaseNodes.value.map(decorateGraphNode)
  }
  return graphBaseNodes.value
    .filter((n) => target.has(String(n?.id ?? '')))
    .map(decorateGraphNode)
})

/**
 * 只保留两端都可见的连线，并转成 {@code RelationEdge} 契约。
 *
 * <p>后端边 VO 用 {@code from/to/text}，而 G6 需要 {@code source/target/label}；
 * 不转换的话 G6 找不到端点，边不会画出来。</p>
 */
const graphEdges = computed(() => {
  const ids = new Set(graphNodes.value.map((n) => n.id))
  return (graphView.edges as Array<any>)
    .filter((e) => ids.has(e.from) && ids.has(e.to))
    .map((e) => ({
      id: String(e.id ?? `${e.from}->${e.to}`),
      // from/to 供 KBAskPanel（后端契约），source/target 供 G6；text/label 同理。
      from: String(e.from),
      to: String(e.to),
      text: String(e.text ?? e.label ?? ''),
      source: String(e.from),
      target: String(e.to),
      label: String(e.text ?? e.label ?? ''),
      style: { endArrow: true },
      data: e.data ?? {},
    }))
})

/**
 * 图谱当前是否处于「已收窄」状态（类型过滤或名称关键词生效）。
 *
 * <p>用于计数展示：收窄时画布上摆的是过滤后的子集，若仍按全库总数报
 * 「实体 248」，而筛选器上写着「事件 (52)」，两处数字自相矛盾，
 * 用户会以为筛选没生效。</p>
 */
const isGraphFiltered = computed(
  () => graphTypeFilter.value.length > 0 || String(graphKeyword.value ?? '').trim() !== '',
)

/**
 * 节点数超过此值即视为「挤」，提示用户改用类型筛选。
 *
 * <p>阈值取自实测：三国库 248 节点时重叠约 150 对、65% 节点被卷入；
 * 而按类型收到「事件」52 节点后重叠为 <b>0</b>。中间量级的库同理。</p>
 */
const GRAPH_DENSE_NODE_THRESHOLD = 120

/** 当前图谱是否拥挤到需要引导筛选（已在筛选中则不再提示） */
const graphTooDense = computed(
  () =>
    !graphLoading.value &&
    graphView.nodes.length > GRAPH_DENSE_NODE_THRESHOLD &&
    !isGraphFiltered.value,
)

/** 实体类型筛选器实例（引导按钮需要聚焦并展开它） */
const graphTypeFilterRef = ref<any>(null)

/**
 * 聚焦实体类型筛选。
 *
 * <p><b>只聚焦，不展开下拉</b>：el-select 展开由组件内部状态控制，实例未公开
 * {@code toggleMenu}，实测 {@code $el.click()} / {@code dispatchEvent(mousedown|pointerdown)}
 * / 合成 keydown 等八种方式全部无效（而 {@code focus()} 能稳定点亮焦点环）。
 * 与其塞一段注定不生效的「伪展开」，不如老实把焦点送到控件上——
 * 用户看到焦点环就知道该点哪儿了。</p>
 */
function focusGraphTypeFilter() {
  try {
    graphTypeFilterRef.value?.focus?.()
  } catch { /* 视图未挂载时忽略 */ }
}

/**
 * 图谱请求序号：切库 / 重复点击「刷新」会让多个请求并发回来，
 * 慢的那个若后到会把新库的图覆盖成旧库的（界面表现为串库）。
 * 每次发起自增，回包时比对，不是最新一次就整包丢弃。
 */
let graphReqSeq = 0

/**
 * 拉取当前知识库的关系图谱。
 * 抽取是上传后的异步任务，因此这里同时刷新页签徽标计数。
 */
async function loadGraph() {
  const kbId = store.activeKnowledgeBaseId
  const seq = ++graphReqSeq
  if (!kbId) {
    graphView.nodes = []
    graphView.edges = []
    graphView.entityCount = 0
    graphView.relationCount = 0
    graphView.placeholder = true
    graphCount.value = 0
    resetGraphLazy()
    return
  }
  graphLoading.value = true
  graphError.value = ''
  try {
    const view = await apiService.fetchKnowledgeGraph(kbId)
    // 过期响应守卫：切库或又发了一次请求后，这个回包属于被取代的那次。
    // 不拦的话，旧库的节点会画到新库的页面上——看起来就像「串库」。
    if (seq !== graphReqSeq || store.activeKnowledgeBaseId !== kbId) {
      return
    }
    graphView.nodes = view.nodes
    graphView.edges = view.edges
    graphView.entityCount = view.entityCount
    graphView.relationCount = view.relationCount
    // 懒加载：新数据到达后播种首屏核心节点（只渲染核心，点击/扩线再动态补充）
    seedLazyGraph()
    // 后端未返回该字段时按「有数据即非占位」兜底
    graphView.placeholder = view.placeholder === undefined
      ? view.entityCount === 0 && view.relationCount === 0
      : Boolean(view.placeholder)
    graphCount.value = view.entityCount + view.relationCount
  } catch (e: any) {
    // 过期请求的失败同样与当前库无关，不能污染新库的错误提示
    if (seq !== graphReqSeq || store.activeKnowledgeBaseId !== kbId) {
      return
    }
    graphError.value = e?.message || '关系图谱加载失败'
    // 拉取失败（后端间歇性 5xx 等）时保留现有数据：
    // graphNodes 是 graphView 的派生计算，图谱组件挂载条件是 graphNodes.length > 0，
    // 清空后组件会直接卸载——用户视角是「图谱突然整块消失」，连缩放/选中态一起丢。
    // 只有本来就没有数据（首次加载就失败）时才落成占位空态。
    if (graphView.nodes.length === 0) {
      graphView.edges = []
      graphView.placeholder = true
      graphCount.value = 0
    }
  } finally {
    // 过期请求不许关掉当前请求的 loading（否则后发的还在飞，界面已显示加载完）
    if (seq === graphReqSeq) {
      graphLoading.value = false
    }
  }
}

// ---- 按需生成图谱（网页采集来的知识点、或当初没开关系提取时补抽） ----
const graphGenerating = ref(false)

/**
 * 触发一次关系抽取并刷新图谱。
 *
 * <p>不传 doc_path 时后端会遍历该知识库下所有文本文件，网页采集来的快照也在其中。</p>
 *
 * <p>结果按后端给出的 status 如实呈现：{@code failed}（全部失败）与 {@code partial}
 * （部分失败）都不报成功 —— 此前无可用模型时后端返回 200 + 0 计数，页面弹
 * 「已生成 0 个实体」，是假成功。失败原因收进 {@link graphFailures}，在页面顶部常驻，
 * 并给出「去设置默认模型」的入口。</p>
 */
async function handleGenerateGraph() {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId || graphGenerating.value) {
    return
  }
  graphGenerating.value = true
  graphFailures.value = []
  try {
    const r = await apiService.generateKnowledgeBaseGraph(kbId)
    const e = r?.entityCount ?? 0
    const rel = r?.relationCount ?? 0
    const files = r?.files ?? 0
    const fails = (r?.failedFiles ?? []).filter((f) => f?.errorMessage)
    if (r?.status === 'failed' || (files > 0 && fails.length >= files)) {
      graphFailures.value = fails.length
        ? fails
        : [{ docPath: '', errorMessage: '关系抽取没有跑成，请检查对话模型配置' }]
      toast.error(
        fails[0]?.errorMessage ||
          '生成图谱失败：关系抽取没有跑成，请先在「设置 → 默认模型」配置对话模型',
      )
      return
    }
    if (r?.status === 'empty') {
      toast.warning('这个知识库还没有可抽取的知识点，先上传并重建索引后再试')
      return
    }
    if (fails.length > 0) {
      // 部分成功：成功的照常刷新，失败的原样列出来，不合并成一句「已完成」
      graphFailures.value = fails
      toast.warning(
        `已生成 ${e} 个实体 / ${rel} 条关系，但有 ${fails.length}/${files} 个知识点抽取失败`,
      )
    } else {
      toast.success(
        `已生成：${e} 个实体 / ${rel} 条关系（${files} 个知识点，${r?.elapsedMs ?? 0} ms）`,
      )
    }
    await loadGraph()
    await refreshGraphCount()
  } catch (err: any) {
    toast.error(err?.message || '生成图谱失败')
  } finally {
    graphGenerating.value = false
  }
}

/** 上次「生成图谱」里抽取失败的知识点及原因；空数组表示没有失败 */
const graphFailures = ref<Array<{ docPath: string; errorMessage: string }>>([])

/** 跳到默认模型设置页（路由是 /setting/:tab?，见 main.js） */
function goDefaultModels() {
  router.push('/setting/default-models')
}

/** 点击节点时把该实体的关联情况提示出来（后续可扩展为展开子图） */
/** 图谱右栏当前选中的实体；null 表示面板收起 */
const selectedGraphNode = ref<{ id: string; name: string; type?: string; degree: number } | null>(null)

/**
 * 图例数据：按当前画布上实际出现的实体类型统计，不写死类型名。
 *
 * <p>参考图左下角图例（蜀 / 刘备 / 诸葛亮…）是按势力或来源分组的；
 * 我们数据里能稳定拿到的是实体类型，先按类型出图例，不编造后端没有的分组字段。
 * 计数与图例同一来源（过滤后的节点集），保证「图例上的数字」和「画布上的点」一致。</p>
 *
 * @returns 每项 { type, count, label, color }，按数量降序
 */
const graphLegendStats = computed(() => {
  const map = new Map<string, number>()
  // 走过滤后的节点集：图例要说明「画布上现在有什么」，
  // 早前直接读 graphView.nodes，实体类型过滤后图例仍显示全部类型，对不上。
  for (const n of graphBaseNodes.value as Array<any>) {
    const t = String(n?.type ?? '').trim()
    if (t) {
      map.set(t, (map.get(t) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([type, count]) => ({ type, count, label: entityTypeLabel(type), color: entityColor(type) }))
    .sort((a, b) => b.count - a.count)
})

/**
 * 概览：实体类型分布（按数量降序）。
 * @returns 每项 { type, count, label, color }
 */
const entityTypeStats = computed(() => {
  const map = new Map<string, number>()
  for (const n of graphView.nodes as Array<any>) {
    const t = String(n?.type ?? 'other')
    map.set(t, (map.get(t) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([type, count]) => ({ type, count, label: entityTypeLabel(type), color: entityColor(type) }))
    .sort((a, b) => b.count - a.count)
})

/**
 * 概览：关系类型分布（按数量降序取前 8）。
 * @returns 每项 { type, count }
 */
const relationTypeStats = computed(() => {
  const map = new Map<string, number>()
  for (const e of graphView.edges as Array<any>) {
    const t = String(e?.text ?? '相关').trim() || '相关'
    map.set(t, (map.get(t) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

/** 概览「快捷操作」清单：图标 + 名称 + 说明，点击切到对应子页。 */
const quickActions = [
  { tab: 'files', label: '上传文档', desc: '导入 txt / pdf / md，自动切分并抽取实体', icon: UploadFilled },
  { tab: 'search', label: '检索内容', desc: '在已索引的文档与图谱中做关键词/语义检索', icon: Search },
  { tab: 'graph', label: '查看图谱', desc: '以力导向图浏览实体与关系，可悬停查看连线含义', icon: Share },
  { tab: 'ask', label: '智能问答', desc: '基于本知识库提问，回答自动附带引用来源', icon: ChatDotRound },
] as const

/** 概览：关联最多的实体（Top 10，按关系数降序） */
const topEntities = computed(() =>
  (graphView.nodes as Array<any>)
    .map((n) => ({
      id: String(n.id),
      name: String(n.text ?? n.id),
      type: String(n.type ?? 'other'),
      degree: Math.max(0, Number(n.degree) || 0),
    }))
    .sort((a, b) => b.degree - a.degree)
    .slice(0, 10),
)

/**
 * 概览：类型条宽度（相对最大计数，最小 6% 保证可见）。
 * @param count 当前计数
 * @param max 最大计数
 * @returns 百分比字符串
 */
function barWidth(count: number, max: number): string {
  if (!max || max <= 0) {
    return '0%'
  }
  return `${Math.max(6, Math.round((count / max) * 100))}%`
}

/**
 * 概览里点实体 → 带着该实体名跳到图谱页并高亮子图。
 * @param name 实体名
 */
function openEntityInGraph(name: string) {
  graphKeyword.value = name
  activeTab.value = 'graph'
}

/**
 * 选中实体的关系列表：每条边解析出「关系类型 + 对端实体名」。
 *
 * <p>类型取边的 {@code text} 字段 —— 后端边 VO 把关系类型放在 text 上（不是 type）。</p>
 */
const selectedNodeRelations = computed(() => {
  const node = selectedGraphNode.value
  if (!node) {
    return []
  }
  const nameOf = new Map<string, string>(
    (graphView.nodes as Array<any>).map((n) => [String(n.id), String(n.text ?? '')]),
  )
  return (graphView.edges as Array<any>)
    .filter((e) => e.from === node.id || e.to === node.id)
    .map((e, i) => {
      const peerId = e.from === node.id ? e.to : e.from
      return {
        key: `${e.from}->${e.to}-${i}`,
        type: String(e.text ?? ''),
        peer: nameOf.get(peerId) ?? peerId,
      }
    })
})

function handleGraphNodeClick(detail: { id: string; data?: unknown }) {
  const node = (detail?.data ?? {}) as {
    id?: string
    label?: string
    text?: string
    data?: { degree?: number; entityType?: string; name?: string }
  }
  const clickId = String(detail?.id ?? node?.id ?? '')
  // 事件回参的 data 是业务节点本身：名字在 node.label / node.text 上，
  // 实体类型与度数在业务自己塞的 node.data 里（decorateGraphNode 产出）。
  const name = String(node?.label ?? node?.text ?? node?.data?.name ?? clickId)
  const degree = Number(node?.data?.degree)
    || graphEdges.value.filter((e) => e.source === clickId || e.target === clickId).length
  const type = node?.data?.entityType ? String(node.data.entityType) : undefined
  if (clickId) {
    selectedGraphNode.value = { id: clickId, name, type, degree }
  }
  // 懒加载：点击节点把它的一跳邻居动态加入画布（本地池子秒开，不走网络）
  if (clickId && !graphLazyAll.value) {
    expandLazyNeighbors(clickId)
  }
  if (name) {
    toast.info(`${name}${type ? `（${entityTypeLabel(type)}）` : ''}：${degree} 条关系`)
  }
}

/**
 * 查看选中实体的来源文档。
 *
 * <p>图谱节点不带来源文档路径（{@code /v2/rag/graph} 只返回
 * id/text/type/degree），这里用实体名走 {@code POST /api/knowledge/search}
 * 取回包含该实体的文档作为来源文档，点条目调 {@link openFilePreview} 看原文。</p>
 *
 * <p>原先该按钮错接 {@code goManage('relation')}，文案写「查看来源文档」
 * 实际却跳到关系管理（关系已在节点详情里内联展示，跳转属重复且名实不符）。</p>
 */
async function viewSourceDocs() {
  const node = selectedGraphNode.value
  const kbId = currentKB.value?.id
  if (!node || !kbId) return
  showSourceDocs.value = true
  sourceDocsLoading.value = true
  sourceDocs.value = []
  try {
    const { results } = await knowledgeBaseApi.searchKnowledgeBase(kbId, node.name, 20)
    sourceDocs.value = results ?? []
  } catch {
    toast.error('查询来源文档失败')
  } finally {
    sourceDocsLoading.value = false
  }
}

/** 图谱组件实例（用于首帧后主动重跑一次布局） */
const graphCompRef = ref<any>(null)

/**
 * 图谱首次真实挂载后保持挂载，切页只用隐藏代替销毁。
 * ReRelationGraph 内部 minimap 的 debounce 销毁竞态会产生未捕获的
 * `Cannot read properties of undefined (reading 'getData')`，本页面不接管共享组件，
 * 因此用保留实例的方式隔离切页竞态。
 */
const graphEverMounted = ref(false)

/**
 * 知识图谱布局：分组布局（每组独立区域 + 气泡轮廓）。
 *
 * <p>组 = 实体类型 / 势力（业务在 {@code decorateGraphNode} 里写进 {@code node.group}）。
 * 组内节点按给定间距铺开、组与组之间留出空隙，再叠一层气泡集轮廓 ——
 * 形态就是「蜀 / 魏 / 吴按势力成团」，而不用依赖任何私有布局名。</p>
 */
const GRAPH_LAYOUT = 'group'

/** 分组布局参数：组内间距 / 组间空隙 / 单组最小半径 */
const GRAPH_LAYOUT_OPTIONS: Record<string, unknown> = {
  spacing: 110,
  gap: 200,
  minRadius: 80,
}

/** 分组轮廓：气泡集（比 Hull 凹包更贴合「按势力成团」的观感） */
const GRAPH_GROUP_TYPE = 'bubble'

/**
 * 右键扩线：后端查询某实体的直接邻居，返回 RelationNode/RelationEdge 契约数据。
 *
 * <p>业务点「查看来源文档」等自定义动作走页面自己的右键菜单，组件只负责画图。</p>
 */
async function loadGraphNeighbors(node: any, depth = 1) {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId) return null
  const r = await apiService.fetchGraphNeighbors(kbId, String(node?.id ?? ''))
  return {
    nodes: (r.nodes ?? []).map(decorateGraphNode),
    edges: (r.edges ?? []).map((e: any) => ({
      id: String(e.id ?? `${e.from}->${e.to}`),
      from: String(e.from),
      to: String(e.to),
      source: String(e.from),
      target: String(e.to),
      label: String(e.text ?? e.label ?? ''),
      data: e.data ?? {},
    })),
  }
}

/**
 * 节点详情懒加载：后端拉取实体属性。
 *
 * <p>新内核不再内置「详情面板」，这里保留查询能力供页面自己的详情卡使用。</p>
 */
async function loadGraphEntityDetail(node: any) {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId) return null
  const r = await apiService.fetchGraphEntityDetail(kbId, String(node?.id ?? ''))
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    degree: r.degree,
    relationCount: r.relationCount,
    description: r.description,
    properties: r.properties,
  }
}

/**
 * 图谱渲染就绪回调。
 *
 * <p>G6 首次装载若发生在容器尺寸确定之前，会把所有节点留在 (0,0)，
 * 表现为整图缩放到一个点（放大 6 倍只看到一个大圆）。此时容器尺寸已确定，
 * 重跑一次同名布局让节点真正散开，随后由组件 autoFit 重新适配视口。</p>
 *
 * <p>但「重跑一次全量布局」在 248 节点的大图上要阻塞主线程约 2s（force-atlas2
 * 同步迭代），而组件自身的装载流程已经跑过一次布局——正常情况下节点早已散开，
 * 这次重跑纯属重复劳动。这里先采样节点坐标做退化判定：只有节点确实全堆在
 * 原点附近才 force 重排，否则直接跳过。</p>
 */
function handleGraphReady() {
  graphEverMounted.value = true
  nextTick(() => {
    window.setTimeout(async () => {
      const comp = graphCompRef.value as {
        setLayout?: (name: string, options?: unknown, force?: boolean) => Promise<void>
        get graph(): unknown
        fitView?: () => Promise<void>
      } | null
      if (!comp) {
        return
      }
      // 首帧无条件适配视口：节点少的图（3~6 个实体）如果不 fitView，会以 1:1
      // 落在画布中央，几十像素的圆被放大成占满整屏的大泡泡。等布局这一帧提交完
      // 再量 bbox，否则量到的是尚未定位的旧范围。
      window.setTimeout(() => {
        const api = graphCompRef.value as { fitView?: () => Promise<void> } | null
        void api?.fitView?.()
      }, 260)
      // 布局退化（节点全挤在一点）才强制重排；正常布局不打断用户当前视角。
      if (!comp.setLayout || !graphLooksDegenerate(comp)) {
        return
      }
      try {
        await comp.setLayout(GRAPH_LAYOUT, GRAPH_LAYOUT_OPTIONS, true)
      } catch {
        // 布局失败不阻断：至少保留组件自身的首帧适配
      }
      // 分组布局是同步铺开的，重排后再适配一次视口即可
      window.setTimeout(() => {
        const api = graphCompRef.value as { fitView?: () => Promise<void> } | null
        void api?.fitView?.()
      }, 320)
    }, 120)
  })
}

/**
 * 判断图谱当前布局是否退化：采样若干节点坐标，若全部落在 40px 半径内
 * （即堆在图原点），判定为「首帧容器无尺寸导致的布局失败」，需要重排。
 *
 * @param comp 图谱组件实例
 * @return 是否退化
 */
function graphLooksDegenerate(comp: { graph?: unknown }): boolean {
  try {
    const inst = (comp.graph ?? null) as {
      getNodeData?: () => Array<{ id: string }>
      getElementPosition?: (id: string) => number[] | { x: number; y: number } | null
    } | null
    const nodes = inst?.getNodeData?.() ?? []
    if (nodes.length < 2) {
      return false
    }
    const pts: Array<[number, number]> = []
    const sample = Math.min(nodes.length, 12)
    for (let i = 0; i < sample; i++) {
      const p = inst?.getElementPosition?.(nodes[i].id)
      if (!p) {
        continue
      }
      const x = Array.isArray(p) ? p[0] : p.x
      const y = Array.isArray(p) ? p[1] : p.y
      if (typeof x === 'number' && typeof y === 'number') {
        pts.push([x, y])
      }
    }
    if (pts.length < 2) {
      return false
    }
    let maxDist = 0
    for (const [x, y] of pts) {
      maxDist = Math.max(maxDist, Math.hypot(x - pts[0][0], y - pts[0][1]))
    }
    return maxDist < 40
  } catch {
    return false
  }
}


// RAG 配置状态
const ragStatus = ref<any>(null)

/**
 * RAG 是否可用。
 *
 * <p>知识库依赖 RAG：未在「系统配置 → 默认模型」配好 RAG 所需参数时，
 * 不渲染搜索框、新建按钮与卡片数据，只提示用户去配置，避免点了必然失败。</p>
 *
 * <p>状态接口未返回时按「未就绪」处理：先提示、后放行，避免用未验证的半成品数据。</p>
 */
// 门禁：不仅要求 RAG 客户端可用，还要求 embedding 配置完整。
// 后端 /v2/rag/status 的 available 只校验 ChatClient + 向量存储，embedding 静默回落成
// 内存占位（维度全 0、检索不可用）时 available 仍为 true —— 那样会放用户进到一个
// 「能建库、能传文档、但检索永远没结果」的空壳里。embeddingReady 由后端 embeddingIssue() 判定。
const ragReady = computed(() =>
  ragStatus.value?.available === true && ragStatus.value?.embeddingReady !== false,
)

// ── 门禁页（分屏 Hero）读数 ────────────────────────────────────────────────
// 只读 /v2/rag/status 已返回的字段，不在前端另算一套「就绪」判断：
// needLlmConfig / embeddingReady / needVectorStorageConfig 就是后端的判定结果。
const ragChecking = ref(false)
const ragCheckedAt = ref('')

const ragGateChecks = computed(() => {
  const status: any = ragStatus.value || {}
  return [
    { key: 'llm', label: t('knowledge.ragGate.llm'), ok: status.needLlmConfig === false },
    { key: 'embedding', label: t('knowledge.ragGate.embedding'), ok: status.embeddingReady === true },
    { key: 'vector', label: t('knowledge.ragGate.vector'), ok: status.needVectorStorageConfig === false },
  ]
})

const ragGateMissing = computed(() => ragGateChecks.value.filter((check) => !check.ok).length)

/**
 * 配置清单的行：键名照抄后端 describe() 的字段，值原样回显。
 *
 * <p>空值要分两类：llm_model / embedding / vector_storage 空 = 缺配置（红字）；
 * splitter / top_k / similarity_threshold / upload_dir 空 = 走后端默认（灰字），
 * 不能一并标红，否则用户会去删一个本来就不用填的项。</p>
 */
const ragGateRows = computed(() => {
  const config: Record<string, string> = ragStatus.value?.config || {}
  const valueOf = (key: string) => String(config[key] ?? '').trim()
  const unset = t('knowledge.ragGate.unset')
  const fallback = t('knowledge.ragGate.defaulted')
  return [
    { key: 'llm_model', label: t('knowledge.ragGate.llm'), value: valueOf('llm_model') || unset, bad: !valueOf('llm_model') },
    { key: 'embedding_model', label: t('knowledge.ragGate.embedding'), value: valueOf('embedding_model') || unset, bad: !valueOf('embedding_model') },
    { key: 'embedding_engine', label: t('knowledge.ragGate.engine'), value: valueOf('embedding_engine') || unset, bad: !valueOf('embedding_engine') },
    { key: 'vector_storage', label: t('knowledge.ragGate.vector'), value: valueOf('vector_storage') || unset, bad: !valueOf('vector_storage') },
    { key: 'splitter', label: t('knowledge.ragGate.splitter'), value: valueOf('splitter') || fallback, bad: false },
    { key: 'top_k', label: t('knowledge.ragGate.topK'), value: valueOf('top_k') || fallback, bad: false },
    { key: 'similarity_threshold', label: t('knowledge.ragGate.threshold'), value: valueOf('similarity_threshold') || fallback, bad: false },
    { key: 'upload_dir', label: t('knowledge.ragGate.uploadDir'), value: valueOf('upload_dir') || fallback, bad: false },
  ]
})

// 获取 RAG 状态
const fetchRagStatus = async () => {
  ragChecking.value = true
  try {
    ragStatus.value = await api.get('/rag/status')
  } catch (error) {
    console.error('获取 RAG 状态失败:', error)
    // 拉取失败视为未就绪，页面走提示分支
    ragStatus.value = { available: false, message: t('knowledge.ragGate.fetchFailed') }
  } finally {
    // 成功失败都要记一次检测时间：门禁页那张清单上写的是「什么时候问过后端」
    ragChecking.value = false
    ragCheckedAt.value = new Date().toLocaleTimeString('zh-CN', { hour12: false })
  }
}

// 跳转到配置页面
const goToConfig = (path: string) => {
  if (path) {
    router.push(path)
  }
}

// 上传任务列表(独立于文件列表)
const uploadTasksList = ref<KBFile[]>([])

// 上传任务轮询定时器
let uploadTaskPollingTimer: number | null = null

// 自动关闭弹窗定时器
let autoCloseModalTimer: number | null = null

// 当前目录路径缓存(避免频繁调用API)
let cachedCurrentFolderPath: string | null = null

// 无限滚动相关状态
const fileListContainer = ref<any>(null) // 文件列表容器引用（ScrollContainer 组件）
const fileTreeRef = ref<any>(null) // 文件树组件引用
// 上传器引用：空态里的「上传文件 / 文件夹」主按钮要复用同一套选择与上传逻辑，
// 不另起一份实现（否则两条路径的分片、轮询、任务记录会分叉）
const fileUploaderRef = ref<any>(null)
const scrollThreshold = 50 // 滚动触发阈值(像素)

// ========== 对话框表单（创建/编辑共用） ==========
const dialogForm = reactive({
  id: '',
  name: '',
  description: '',
  chunkMaxSize: 1000,
  chunkOverlapSize: 100,
  chunkMinSize: 50,
  isPublic: false,
  // 网址采集：填了网址就按 web 型知识库创建并立即抓取
  sourceUrl: '',
  sourceMode: 'snapshot',
  sourceMaxPages: 1
})

// ========== 计算属性 ==========
/**
 * 当前选中的知识库对象
 */
const currentKB = computed(() => {
  if (!store.activeKnowledgeBaseId) return null
  return store.knowledgeBases.find(kb => kb.id === store.activeKnowledgeBaseId) || null
})

/**
 * 左栏库目录的筛选关键词。
 *
 * <p>库多时（本机实测 25 个）靠滚动找人，名字还长得很像；
 * 只在列表超过 8 个时出现筛选框，少的时候不占位置。</p>
 */
const kbFilter = ref('')

const filteredKnowledgeBases = computed(() => {
  const q = kbFilter.value.trim().toLowerCase()
  if (!q) return store.knowledgeBases
  return store.knowledgeBases.filter((kb) => String(kb.name || '').toLowerCase().includes(q))
})

/**
 * 判断知识库是否归当前登录用户所有（公开库对非 owner 只读）。
 * 无法取得当前用户 id 时默认按可写处理，避免误伤 owner；后端仍有归属兜底。
 */
function isOwnerKb(kb: KnowledgeBase | null | undefined): boolean {
  const uid = (authStore.user as any)?.userId ?? (authStore.user as any)?.id
  if (!uid || !kb) return true
  return String(kb.userId ?? '') === String(uid)
}

/** 当前详情库是否可写（非 owner 的公开库只读） */
const canEditCurrent = computed(() => isOwnerKb(currentKB.value))

// ========== Methods ==========

/**
 * 选择知识库并加载文件列表
 */
async function handleSelectKB(kb: KnowledgeBase) {
  store.setActiveKnowledgeBase(kb.id)
  viewMode.value = 'detail'

  // 更新路由（使用 params）
  // 保留现有 query：切换知识库时不能丢掉 URL 上的参数（如外部带入的筛选条件），
  // 否则一次换库就把用户此前的上下文清空了。
  router.replace({ name: 'KnowledgeBase', params: { id: kb.id }, query: route.query })

  try {
    // 选择新知识库时重置分页
    await refreshFileList()
    // 同时取一份全量清单：左侧计数与概览统计在任何视图都要有数
    void loadFileInventory()
    // toast.success(`已选择：${kb.name}`)
  } catch (error) {
    console.error('加载文件列表失败:', error)
    toast.error(t('knowledge.page.loadFileListFailed'))
  }
}

/**
 * 返回列表视图
 */
function backToList() {
  viewMode.value = 'list'
  store.setActiveKnowledgeBase(null)
  router.replace({ name: 'KnowledgeBase' })
  // 回到列表时统计可能已过期（期间上传过文档、生成过图谱），重新拉一次
  loadOverview()
}

/**
 * 处理下拉菜单命令
 */
function handleDropdownCommand(command: string, kb: KnowledgeBase) {
  if (command === 'edit') {
    handleEdit(kb)
  } else if (command === 'delete') {
    handleDelete(kb)
  }
}

/**
 * 打开创建对话框
 */
function handleOpenCreate() {
  dialogForm.id = ''
  dialogForm.name = ''
  dialogForm.description = ''
  dialogForm.chunkMaxSize = 1000
  dialogForm.chunkOverlapSize = 100
  dialogForm.chunkMinSize = 50
  dialogForm.isPublic = false
  // 网址采集：新建时默认不启用
  dialogForm.sourceUrl = ''
  dialogForm.sourceMode = 'snapshot'
  dialogForm.sourceMaxPages = 1
  dialogMode.value = 'create'
  showKbDialog.value = true
}

/**
 * 保存知识库（创建/更新共用）
 */
async function handleKbSave() {
  // 验证必填字段
  if (!dialogForm.name.trim()) {
    toast.warning(t('knowledge.page.inputNameWarning'))
    return
  }

  // 嵌入模型为「设置中心 → 默认模型」的全局配置，后端 sys_ai_knowledge_base 无该列，
  // 因此保存不涉及 embeddingModelId；此前的「向量模型」选择器已移除，避免误导。

  try {
    if (dialogMode.value === 'create') {
      // 创建
      const newKb = await store.createKnowledgeBase({
        name: dialogForm.name,
        description: dialogForm.description || undefined,
        chunkMaxSize: dialogForm.chunkMaxSize,
        chunkOverlapSize: dialogForm.chunkOverlapSize,
        chunkMinSize: dialogForm.chunkMinSize,
        isPublic: dialogForm.isPublic,
        sourceUrl: dialogForm.sourceUrl.trim(),
        sourceMode: dialogForm.sourceMode,
        sourceMaxPages: dialogForm.sourceMaxPages
      })

      toast.success(t('common.createSuccess'))
      showKbDialog.value = false

      // 刷新列表
      await store.fetchKnowledgeBases()

      // 创建成功后自动选中新建的知识库
      const createdKb = store.knowledgeBases.find(kb => kb.id === newKb.id)
      if (createdKb) {
        await handleSelectKB(createdKb)
      }

      // 来自模板创建：把模板的完整数据集（文档 + 实体 + 关系）真正复制进新库
      await materializeTemplate(newKb.id, dialogForm.name)
    } else {
      // 更新
      await store.updateKnowledgeBase(dialogForm.id, {
        name: dialogForm.name,
        description: dialogForm.description,
        chunkMaxSize: dialogForm.chunkMaxSize,
        chunkOverlapSize: dialogForm.chunkOverlapSize,
        chunkMinSize: dialogForm.chunkMinSize,
        isPublic: dialogForm.isPublic,
        // 网址变更（含清空）都要透传，否则后端收不到
        sourceUrl: dialogForm.sourceUrl.trim(),
        sourceMode: dialogForm.sourceMode,
        sourceMaxPages: dialogForm.sourceMaxPages
      })

      toast.success(t('common.saveSuccess'))
      showKbDialog.value = false

      // 刷新列表
      await store.fetchKnowledgeBases()
    }
  } catch (error: any) {
    console.error('操作失败:', error)
    toast.error(error.response?.data?.detail || t('common.operationFailed'))
  }
}

/**
 * 编辑弹窗「取消」：显式关闭，不触发表单回填。
 */
function handleKbCancel() {
  showKbDialog.value = false
}

/**
 * 编辑知识库
 */
function handleEdit(kb: KnowledgeBase) {
  // 公开库对非 owner 只读：入口保留，点击明确拒绝，不弹出看似可保存的表单
  if (!isOwnerKb(kb)) {
    toast.info('该知识库由他人创建，仅可浏览')
    return
  }
  Object.assign(dialogForm, {
    id: kb.id,
    name: kb.name,
    description: kb.description || '',
    chunkMaxSize: kb.chunkMaxSize,
    chunkOverlapSize: kb.chunkOverlapSize,
    chunkMinSize: kb.chunkMinSize,
    isPublic: kb.isPublic,
    // 网址采集配置回填：老数据没有这三个字段，退回默认值
    sourceUrl: kb.sourceUrl || '',
    sourceMode: kb.sourceMode || 'snapshot',
    sourceMaxPages: kb.sourceMaxPages || 1
  })
  dialogMode.value = 'edit'
  showKbDialog.value = true
}


/**
 * 弹确认框并真正删除知识库（只负责「确认 + 调接口」，不处理删除后的视图跳转）。
 *
 * <p>列表页与详情页的删除入口共用这里的确认流程，区别只在删除成功后去哪：
 * 列表页自动选中下一个库，详情页回到列表。</p>
 *
 * @param kb 目标知识库
 * @returns 是否真的删除了（取消或失败返回 false）
 */
async function confirmAndDeleteKb(kb: KnowledgeBase): Promise<boolean> {
  try {
    const deleteMessage =
      t('knowledge.page.deleteKbConfirm', { name: kb.name }) +
      `<div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--el-fill-color-light);border:1px solid var(--el-border-color-lighter);font-size:12px;line-height:1.6;color:var(--el-text-color-secondary);">${t('knowledge.page.deleteKbNote')}</div>`
    const confirmed = await confirm(
      t('knowledge.page.deleteKbTitle'),
      deleteMessage,
      { type: 'warning' }
    )

    if (!confirmed) return false

    await store.deleteKnowledgeBase(kb.id)
    toast.success(t('common.deleteSuccess'))
    return true
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      toast.error(error.response?.data?.detail || t('common.deleteFailed'))
    }
    return false
  }
}

/**
 * 列表页删除知识库：删除成功后自动选中下一个库。
 *
 * @param kb 目标知识库
 */
async function handleDelete(kb: KnowledgeBase) {
  // 索引必须在删除前取：删除后 store 列表已不含该库
  const currentIndex = store.knowledgeBases.findIndex(k => k.id === kb.id)
  if (await confirmAndDeleteKb(kb)) {
    handleAfterDelete(kb.id, currentIndex)
  }
}

/**
 * 详情页头部删除当前知识库：删除成功后回到列表页。
 */
async function handleDeleteFromDetail() {
  const kb = currentKB.value
  if (!kb) return
  if (await confirmAndDeleteKb(kb)) {
    backToList()
  }
}

/**
 * 删除知识库后的自动选中逻辑
 */
function handleAfterDelete(deletedKbId: string, currentIndex: number) {
  // 获取删除后的列表（从 store 中获取最新列表）
  const remainingKBs = store.knowledgeBases.filter(kb => kb.id !== deletedKbId)

  if (remainingKBs.length === 0) {
    // 如果列表为空，清空选中状态
    store.setActiveKnowledgeBase(null)
    router.replace({ name: 'KnowledgeBase' })
    return
  }

  // 计算应该选中的索引
  let nextIndex = currentIndex

  // 如果删除的是最后一个元素，则选中前一个
  if (currentIndex >= remainingKBs.length) {
    nextIndex = remainingKBs.length - 1
  }

  // 确保索引有效
  if (nextIndex < 0) {
    nextIndex = 0
  }

  // 选中下一个知识库
  const nextKb = remainingKBs[nextIndex]
  if (nextKb) {
    handleSelectKB(nextKb)
  }
}



/**
 * 处理上传完成事件
 */
async function handleUploadComplete(task: UploadTask) {
  console.log('文件上传完成:', task.fileName)
  console.log('[DEBUG] 任务 relativePath:', task.relativePath)

  // 关键优化:将上传任务转换为 KBFile 格式
  const uploadedFile = uploadStore.taskToFileRecord(task)
  console.log('[DEBUG] 转换后的 KBFile relativePath:', uploadedFile.relativePath)

  // 智能插入到当前目录（如果需要）
  if (fileTreeRef.value && fileTreeRef.value.insertUploadedFile) {
    await fileTreeRef.value.insertUploadedFile(uploadedFile)
    console.log('[DEBUG] 已尝试智能插入文件')
  }

  // 注意:不再调用 refreshFileList,避免全局刷新

  // 关系抽取是上传后的异步任务，稍等一会儿再刷新图谱；
  // 抽取失败不影响这里（接口只返回已有数据，不会报错）。
  // 图谱 / 实体 / 关系视图正在展示时直接拉整张图，其余时刻只做计数级的轻量刷新。
  if (graphCount.value > 0 || ['graph', 'entities', 'relations'].includes(activeTab.value)) {
    window.setTimeout(() => {
      void loadGraph()
    }, 3000)
  } else {
    window.setTimeout(() => {
      void refreshGraphCount()
    }, 3000)
  }
}

/**
 * 只刷新图谱计数，不拉整张图，用于上传完成后的轻量更新。
 */
async function refreshGraphCount() {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId) {
    graphCount.value = 0
    return
  }
  try {
    const c = await apiService.fetchKnowledgeGraphCount(kbId)
    graphCount.value = c.entityCount + c.relationCount
  } catch {
    // 计数是装饰性的，失败静默即可
  }
}

/**
 * 处理文件夹创建成功事件
 */
async function handleFolderCreated() {
  console.log('[DEBUG] 文件夹创建成功，刷新当前目录')

  // 刷新当前目录以显示新创建的文件夹
  if (fileTreeRef.value && fileTreeRef.value.forceReload) {
    await fileTreeRef.value.forceReload()
  }
}


/**
 * 处理滚动事件（带防抖）
 */
function handleScroll(event: Event) {
  if (!fileListContainer.value || !fileTreeRef.value) return

  const container = fileListContainer.value.getScrollElement?.() || fileListContainer.value.$el
  if (!container) return

  const { scrollTop, scrollHeight, clientHeight } = container

  // 计算距离底部的距离
  const distanceToBottom = scrollHeight - scrollTop - clientHeight

  // 如果距离底部小于阈值，且没有正在加载，则加载更多
  if (distanceToBottom <= scrollThreshold && fileTreeRef.value.loadMoreFiles) {
    console.log('[DEBUG] 触发无限滚动加载')
    fileTreeRef.value.loadMoreFiles()
  }
}

/**
 * 处理上传完成事件
 */
/**
 * 重建后刷新真实状态。
 *
 * <p>后端 {@code PUT /bases/{id}/file} 同步走完入库管线（切块 → 向量化）后才返回，
 * 所以这里不需要轮询不存在的「处理进度」接口——直接重拉文件清单即可。</p>
 */
async function refreshAfterReindex(): Promise<void> {
  await Promise.allSettled([
    loadFileInventory(),
    fileTreeRef.value?.forceReload ? fileTreeRef.value.forceReload() : Promise.resolve(),
  ])
  await loadOverview()
}

/**
 * 重建单个文件的索引（读原文 → 同内容回写）。
 *
 * <p>以前这里调的是 {@code retryKBFile} 的 {@code missingOutlet}，点下去必然抛
 * 「后端没有重新解析接口」；随后又把状态改回 pending 去轮询一个不存在的状态接口，
 * 于是界面永远停在「处理中」。现在这条路走的是真实入库链路。</p>
 *
 * @param file 目标文件
 * @param silent 批量调用时不弹确认框、不逐条 toast
 */
async function handleRetryFile(file: KBFile, silent = false) {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId) return
  try {
    if (!silent) {
      const confirmed = await confirm(
        t('knowledge.page.retryFileTitle'),
        t('knowledge.page.retryFileConfirm', { name: file.displayName || file.fileName }),
        { type: 'warning' },
      )
      if (!confirmed) return
    }

    await apiService.retryKBFile(kbId, file.id)
    // 先就地改状态，避免重拉前的瞬间还显示旧状态；重拉后以接口为准
    fileTreeRef.value?.updateFileStatus?.(file.id, {
      processingStatus: 'processing',
      progressPercentage: 0,
      currentStep: t('knowledge.page.waitRetry'),
      errorMessage: null,
    })

    if (!silent) {
      toast.success(t('knowledge.page.retryStarted'))
      await refreshAfterReindex()
      // PUT 返回 200 只代表后端接下了这次回写，是否真的进了索引要看重新拉回来的状态。
      // 后端入库没跑完（例如切块/向量化失败）时这篇仍会留在「待重建」，此时再报
      // 「已提交」就成了假成功——补一条警告，让读者知道还要等或要看后端日志。
      if (staleFiles.value.some((f) => f.id === file.id)) {
        toast.warning(t('knowledge.page.reindexStillPending', { name: file.displayName || file.fileName }))
      }
    }
  } catch (error: any) {
    if (error === 'cancel') return
    console.error('重建索引失败:', error)
    toast.error(error?.response?.data?.detail || error?.message || t('knowledge.page.retryFailed'))
    // 批量模式要知道这一篇失败，交给 handleReindexAllStale 计数；单篇则不再向上抛，
    // 避免事件处理器里出现未捕获的 Promise rejection
    if (silent) throw error
  }
}

/**
 * 一键重建全部「待重建索引」文档。
 *
 * <p>重启后后端把磁盘上所有文件都报成 {@code uploaded}（向量库分片还在、但进程内存的
 * 文档登记表已空），逐个点太繁琐，这里串行跑一遍同一路径。串行是为了不把单线程的
 * 嵌入服务打满，也便于逐篇报进度。</p>
 */
async function handleReindexAllStale() {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId || reindexing.value) return
  const targets = staleFiles.value.slice()
  if (!targets.length) {
    toast.info(t('knowledge.page.reindexNone'))
    return
  }
  try {
    const confirmed = await confirm(
      t('knowledge.page.retryFileTitle'),
      t('knowledge.page.reindexAllConfirm', { count: targets.length }),
      { type: 'warning' },
    )
    if (!confirmed) return
  } catch (error) {
    if (error === 'cancel') return
    throw error
  }

  reindexing.value = true
  const targetIds = new Set(targets.map((f) => f.id))
  let requestFail = 0
  try {
    for (const f of targets) {
      // 就地推进：轮到哪一篇就把哪一篇标成「处理中」，工序带与行状态跟着动，
      // 读者能看出这批是在逐个跑，而不是点完之后界面一动不动。
      fileTreeRef.value?.updateFileStatus?.(f.id, {
        processingStatus: 'processing',
        progressPercentage: 0,
        currentStep: t('knowledge.page.reindexing'),
        errorMessage: null,
      })
      try {
        await handleRetryFile(f, true)
      } catch {
        requestFail += 1
      }
      await refreshAfterReindex()
    }
  } finally {
    reindexing.value = false
    await refreshAfterReindex()
  }
  // 成败以后端回来的状态为准：PUT 返回 200 只代表后端接下了回写，还留在「待重建」
  // 的就说明后端没把它真正入库（切块/向量化中途失败等）。此时报「全部重建成功」
  // 就是假成功，工序带上的数字也会和分栏对不上。
  if (requestFail > 0) {
    console.warn(`[Knowledge] 重建索引请求失败 ${requestFail} 篇，见上方 toast 与后端日志`)
  }
  const still = staleFiles.value.filter((f) => targetIds.has(f.id)).length
  const ok = targets.length - still
  if (still > 0) toast.warning(t('knowledge.page.reindexPartial', { ok, rest: still }))
  else toast.success(t('knowledge.page.reindexDone', { ok, fail: 0 }))
}

/**
 * 搜索结果项点击 → 打开命中文件的原文预览。
 *
 * <p>{@code KBSearchPanel} 一直 {@code emit('resultClick')}，但页面从未监听这个事件，
 * 事件发出去就断了——点搜索结果卡片得不到任何反馈，等于「搜到了却看不了原文」的死链路。
 * 这里把它接上，复用 {@link openFilePreview} 这条既有通路（与点文件树里的文档完全一致，
 * 走 {@code GET /bases/{id}/file} 拿原文），不再另造一套预览。</p>
 *
 * @param result 被点击的检索结果；相对路径取 {@code metadata.relPath}
 */
function handleSearchResultClick(result: { fileName?: string; metadata?: Record<string, any> }) {
  const relPath = String(result?.metadata?.relPath ?? result?.metadata?.fileId ?? '').trim()
  if (!relPath) {
    toast.warning('该结果没有可预览的文档路径')
    return
  }
  openFilePreview(undefined, relPath)
}

/**
 * 查看文件详情
 */
function handleViewFile(file: KBFile) {
  // 点文件 = 看原文。分块详情另有入口（FileChunksViewer），不再占用「查看」这个动作
  openFilePreview(file)
}

/**
 * 文件树右键菜单「查看分块」：只打开 FileChunksViewer，不改变原文预览状态。
 */
function handleViewChunks(file: KBFile) {
  if (!file || file.isDirectory) return
  selectedFile.value = file
  showFileChunksModal.value = true
}

/**
 * 删除文件
 */
async function handleDeleteFile(file: KBFile) {
  try {
    const confirmed = await confirm(
      t('knowledge.page.deleteFileTitle'),
      file.isDirectory
        ? t('knowledge.page.deleteDirConfirm', { name: file.displayName || file.fileName })
        : t('knowledge.page.deleteFileConfirm', { name: file.displayName || file.fileName }),
      { type: 'warning' }
    )

    if (!confirmed) return

    if (!store.activeKnowledgeBaseId) return

    await store.deleteFile(store.activeKnowledgeBaseId, file.id)
    toast.success(t('common.deleteSuccess'))

    // 关键优化:通知 KBFileTree 从本地列表中移除文件,避免重建 DOM 树
    if (fileTreeRef.value && fileTreeRef.value.removeFileLocally) {
      console.log('[DEBUG] 删除文件后本地更新文件树')
      fileTreeRef.value.removeFileLocally(file.id)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      toast.error(error.response?.data?.detail || '删除失败')
    }
  }
}

/**
 * 处理目录切换事件
 */
async function handleFolderChange(relativePath: string | null) {
  console.log(`[DEBUG] 目录切换到: ${relativePath || '根目录'}`)

  // 关键修复:更新缓存的当前目录路径
  cachedCurrentFolderPath = relativePath
  console.log(`[DEBUG] 更新缓存路径: ${cachedCurrentFolderPath}`)

  // 注意:不再在这里启动轮询,等待 files-loaded 事件触发
}

/**
 * 处理文件加载完成事件
 * 注意：KBFileTree 现在内部管理轮询，父组件无需干预
 */
function handleFilesLoaded(files: KBFile[]) {
  // 左侧「文档」栏的篇数与状态分栏都从这里取；KBFileTree 内部自行轮询状态，
  // 它每次状态变化都会再 emit 一次 files-loaded，所以这里跟着刷新即可
  loadedFiles.value = files || []
  // 无论结果是空库还是真列表，加载都结束了，空态覆盖层可以按真实数据判
  treeLoading.value = false
}

/**
 * 列表页统计汇总（来自 {@code GET /api/knowledge/bases/overview}）。
 *
 * <p>不在前端累加：每张卡片的实体/关系/文档数都要走文件系统与图谱表，
 * 逐库请求就是 N+1。一次性拿回后这里只做展示格式化。</p>
 */
const overview = ref<{
  totals?: { kb_count?: number; file_count?: number; entity_count?: number; relation_count?: number };
  per_base?: Record<string, { file_count?: number; entity_count?: number; relation_count?: number }>;
}>({})

/**
 * 总览是否在拉取。
 *
 * <p>首载 / 返回列表时 {@code overview} 还是空对象，若直接用「库数 === 0」
 * 判空，用户会先看到一秒假的「开始创建你的第一个知识库」，然后列表才蹦出来。
 * 这个开关喂给 KnowledgeOverview：加载中统计格显示「–」、条目区显示骨架。</p>
 */
const overviewLoading = ref(true)

/**
 * 空状态里的「教育场景模板」清单。
 *
 * <p><b>这是静态清单，不是接口数据。</b>后端目前没有知识库模板接口
 * （{@code sys_ai_template} 只服务 Agent；知识库侧无模板 API），所以这里只做入口展示，
 * 「使用模板」当前等同于「新建知识库」，<b>不会真正预置文档与图谱结构</b>。
 * 设计图上每张模板卡的「84 实体 · 196 关系」是示意图里的填充值，我们没有对应数据，
 * 因此改标为「预置结构」，不编造数字。后端出模板接口后替换为接口数据即可。</p>
 */
/**
 * 模板封面：按 key 映射到**本地资源**（设计稿的远程图已下载入库，
 * 运行期不外链，避免离线裂图与 CDN 失效）。
 * 没有素材的模板（昆虫/汉字/作文/名言）不在此表中，渲染时回退到色块占位。
 */
const templateCovers: Record<string, string> = {
  sanguo: coverSanguo,
  poem: coverPoem,
  idiom: coverIdiom,
  question: coverQuestion,
}

const kbTemplates: ReadonlyArray<{ key: string; name: string; tag: string }> = [
  { key: 'sanguo', name: '三国演义知识图谱', tag: '人物 · 势力 · 事件' },
  { key: 'poem', name: '古诗词库', tag: '朝代 · 作者 · 名句' },
  { key: 'idiom', name: '成语库', tag: '释义 · 出处 · 近义' },
  { key: 'question', name: '题库知识库', tag: '考点 · 题型 · 难度' },
]

/**
 * 取名称的首字用于封面占位。
 *
 * <p>后端没有封面字段，卡片需要一个「占位封面」而不是空白；
 * 用知识库名的前两个字做视觉锚点，中英文都适用。</p>
 *
 * @param name 知识库名称
 * @returns 1~2 个字符
 */
function initialsOf(name?: string | null): string {
  const s = (name ?? '').trim()
  if (!s) {
    return 'KB'
  }
  // 中文取前两字，英文取首字母（大写）
  if (/^[\u4e00-\u9fa5]/.test(s)) {
    return s.slice(0, 2)
  }
  return s.slice(0, 1).toUpperCase()
}

/** 千分位格式化，1284 → 1,284 */
function fmtCount(n: number | undefined): string {
  return (n ?? 0).toLocaleString('en-US')
}

/**
 * 卡片次要信息行的「多久以前」文案。
 *
 * <p>用真实的 updateTime / createTime 换算，不编造数据；无有效时间或解析失败
 * 时回退为「—」，避免渲染出 Invalid Date。图上该行还有一个日历图标，同理走真实字段。</p>
 *
 * @param value 后端返回的时间字符串或时间戳
 * @returns 相对时间文案（刚刚 / N 分钟前 / N 小时前 / N 天前 / 日期）
 */
function fmtTime(value?: string | number | null): string {
  if (value === undefined || value === null || value === '') {
    return '—'
  }
  const ts = typeof value === 'number' ? value : Date.parse(String(value))
  if (!Number.isFinite(ts)) {
    return '—'
  }
  const diff = Date.now() - ts
  if (diff < 60000) {
    return '刚刚'
  }
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) {
    return `${minutes} 分钟前`
  }
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }
  const days = Math.floor(hours / 24)
  if (days < 30) {
    return `${days} 天前`
  }
  return new Date(ts).toLocaleDateString('zh-CN')
}

/** 顶部四个统计卡 */
const overviewStats = computed(() => [
  { key: 'kb', label: '知识库', value: fmtCount(overview.value.totals?.kb_count), icon: FolderOpened },
  { key: 'file', label: '文档总量', value: fmtCount(overview.value.totals?.file_count), icon: Document },
  { key: 'entity', label: '实体节点', value: fmtCount(overview.value.totals?.entity_count), icon: Share },
  { key: 'relation', label: '关系连线', value: fmtCount(overview.value.totals?.relation_count), icon: Connection },
])

/**
 * 取某个知识库的单个计数。
 *
 * @param kbId 知识库ID
 * @param key 计数键：file_count / entity_count / relation_count
 * @returns 计数，缺省 0
 */
function countOf(kbId: string, key: 'file_count' | 'entity_count' | 'relation_count'): number {
  return overview.value.per_base?.[kbId]?.[key] ?? 0
}

/**
 * 知识库是否「已就绪」：有文档且没有待处理的失败项。
 *
 * <p>这里只用 overview 的文件数做粗判（>0 即认为已就绪），
 * 真正的索引状态要看文件列表里的 processingStatus，不在列表页重复拉一遍。</p>
 *
 * @param kb 知识库
 * @returns 是否就绪
 */
function isKbReady(kb: KnowledgeBase): boolean {
  return countOf(kb.id, 'file_count') > 0
}

/**
 * 拉取列表页统计。
 */
async function loadOverview() {
  overviewLoading.value = true
  try {
    overview.value = (await apiService.fetchKBOverview()) || {}
  } catch (e) {
    // 统计失败不该让列表空掉，退化成 0 展示
    overview.value = {}
  } finally {
    overviewLoading.value = false
  }
}

/**
 * 把时间戳格式化成「N 分钟前 / N 小时前 / 昨天 / M月D日」。
 *
 * @param ts 毫秒时间戳
 * @returns 相对时间文案
 */
function relativeTime(ts: number | string | undefined): string {
  if (!ts) return ''
  const t = typeof ts === 'number' ? ts : Date.parse(String(ts))
  if (!Number.isFinite(t) || t <= 0) return ''
  const diff = Date.now() - t
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour} 小时前`
  const day = Math.floor(hour / 24)
  if (day === 1) return '昨天'
  if (day < 7) return `${day} 天前`
  const d = new Date(t)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/**
 * 最近活动列表。
 *
 * <p>来源是真实数据而不是编出来的：知识库的 {@code updatedAt}（库被改动过）
 * 加上本地上传任务记录（fileUpload store）。后端目前没有活动流接口，
 * 所以「谁在什么时候上传了几篇」这类细粒度事件拿不到，这里不臆造。</p>
 */
const activities = computed(() => {
  const items: Array<{ key: string; title: string; desc: string; time: string; ts: number }> = []
  for (const kb of store.knowledgeBases || []) {
    const ts = Date.parse(String(kb.updatedAt || kb.createdAt || ''))
    if (!Number.isFinite(ts)) continue
    items.push({
      key: `kb-${kb.id}`,
      title: kb.name,
      desc: countOf(kb.id, 'file_count') > 0 ? `已索引 ${countOf(kb.id, 'file_count')} 篇` : '已创建',
      time: relativeTime(ts) || '',
      ts,
    })
  }
  return items.sort((a, b) => b.ts - a.ts).slice(0, 8)
})

/**
 * 状态分栏：把 processingStatus 收敛成图 3 那样的四档。
 *
 * <p>后端有 7 个状态值（queued/uploading/uploaded/pending/processing/completed/failed），
 * 展示上没必要分这么细——用户只关心「能不能用了」：</p>
 * <ul>
 *   <li>{@code indexed}：completed，已可检索</li>
 *   <li>{@code stale}：uploaded，原文在盘上但向量库没有它的分片，需要重建索引</li>
 *   <li>{@code parsing}：queued/uploading/pending/processing，正在处理</li>
 *   <li>{@code failed}：failed</li>
 *   <li>{@code all}：不分组</li>
 * </ul>
 *
 * <p>此前 {@code uploaded} 被并进「解析中」，于是重启后后端把全部文件报成
 * uploaded，界面显示「3 处理中 / 已索引 0」，看上去像三篇卡住了，实际是
 * 索引状态随进程内存丢了、需要重建。两个语义分开，才不会误导。</p>
 */
const FILE_STATUS_GROUPS: Record<string, string[]> = {
  indexed: ['completed'],
  stale: ['uploaded'],
  parsing: ['queued', 'uploading', 'pending', 'processing'],
  failed: ['failed'],
}

/** 文件状态分栏键：全部 / 已索引 / 待重建 / 处理中 / 失败 */
type FileStatusFilter = 'all' | 'indexed' | 'stale' | 'parsing' | 'failed'

/** 当前选中的分栏 */
const fileStatusFilter = ref<FileStatusFilter>('all')

/** 批量重建索引进行中（按钮禁用与文案） */
const reindexing = ref(false)

/** 当前目录下的文件（来自 KBFileTree 的 files-loaded） */
const loadedFiles = ref<KBFile[]>([])

/**
 * 文件树是否在加载中（首载 / 切库 / 切回文档页签都会重新拉）。
 *
 * <p>空态覆盖层要靠它兜底：文件树在加载时 {@code loadedFiles} 还是空的，
 * 若直接用「文件数 === 0」判空，用户每次切库都会先看到一秒假的
 * 「这个卷宗还没有文档」，然后列表才蹦出来。</p>
 */
const treeLoading = ref(true)

/**
 * 扁平文件清单（本页自取，不依赖 KBFileTree 是否挂载）。
 *
 * <p>{@code loadedFiles} 只在「文档」视图由文件树回填，切到概览/图谱就没了；
 * 这份清单在任何视图下都存在，左栏计数与统计格优先用它。</p>
 */
const inventoryFiles = ref<KBFile[]>([])

/** 只统计真实文件，目录不进分栏计数 */
/**
 * 统计与左栏统一使用的文件集合（只统计真实文件，目录不进分栏计数）。
 *
 * <p>两份来源合并去重：文件树回填的 {@code loadedFiles}（含实时处理状态轮询）
 * 与本页自取的全量 {@code inventoryFiles}（任意视图都可用）。</p>
 */
const filesForFilter = computed(() => {
  const byId = new Map<string, KBFile>()
  for (const f of inventoryFiles.value) {
    if (!f.isDirectory) byId.set(f.id, f)
  }
  for (const f of loadedFiles.value) {
    if (!f.isDirectory) byId.set(f.id, f)
  }
  return [...byId.values()]
})

/**
 * 左栏「文档」快速列表：跟随当前状态分栏过滤。
 *
 * <p><b>必须声明在 FILE_STATUS_GROUPS / filesForFilter 之后</b>：computed 的求值虽然惰性，
 * 但模板首次渲染就会读它，此时若依赖还在 TDZ（let/const 未初始化），
 * 会抛 ReferenceError 并让整个三栏骨架渲染失败。</p>
 */
const activeFiles = computed(() => {
  const key = fileStatusFilter.value
  if (key === 'all') return filesForFilter.value
  const group = FILE_STATUS_GROUPS[key] || []
  return filesForFilter.value.filter((f) => group.includes(f.processingStatus))
})

/** 全库切块总数（KBFile.totalChunks 此前从未上屏） */
const totalChunks = computed(() => filesForFilter.value.reduce((a, f) => a + (f.totalChunks || 0), 0))

/** 全库 token 总数（KBFile.totalTokens 此前从未上屏） */
const totalTokens = computed(() => filesForFilter.value.reduce((a, f) => a + (f.totalTokens || 0), 0))

/**
 * 「切块」与「Tokens」读数：后端目录树不返回分片数，前端也就无法凭空给出。
 *
 * <p>此前概览把这两个格子直接写成 {@code totalChunks}（恒为 0），同时流水线又显示
 * 「向量化 空闲」——一个说「一块都没切」，一个说「早就切完了」，两句自相矛盾。
 * 这里改成三态：有数据就报数；确实拿到 0 就报 0；完全没拿到就报「—」，
 * 并在流水线上用「已索引 N 篇」表达进度，不再用 0 假装是真实读数。</p>
 *
 * @param sum 已累计值
 * @returns { known 是否有可信数据, value 展示值 }
 */
function readingOrDash(sum: number): { known: boolean; value: string } {
  const hasAny = filesForFilter.value.some((f) => (f.totalChunks || 0) > 0 || (f.totalTokens || 0) > 0)
  if (!hasAny) return { known: false, value: '—' }
  return { known: true, value: fmtNum(sum) }
}

/** 切块读数 */
const chunkStat = computed(() => readingOrDash(totalChunks.value))
/** Tokens 读数 */
const tokenStat = computed(() => readingOrDash(totalTokens.value))

/** 处理中（尚未完成索引）的文档数 */
const pendingFileCount = computed(() =>
  filesForFilter.value.filter((f) =>
    ['queued', 'uploading', 'pending', 'processing'].includes(f.processingStatus)).length)

/**
 * 待重建索引的文档数。
 *
 * <p>对应后端的 {@code uploaded}：磁盘上有原文，但向量库里查不到它的分片。
 * 上传从未真正走完、或者进程重启后内存索引表丢失，都会落到这一档。
 * 它与「处理中」必须分开——前者是「等一会儿会好」，后者是「永远不会自己好」。</p>
 */
const staleFileCount = computed(() => filesForFilter.value.filter((f) => f.processingStatus === 'uploaded').length)

/** 解析失败 / 索引失败的文档数 */
const failedFileCount = computed(() => filesForFilter.value.filter((f) => f.processingStatus === 'failed').length)

/** 已成功索引的文档数 */
const indexedFileCount = computed(() => filesForFilter.value.filter((f) => f.processingStatus === 'completed').length)

/**
 * 解析失败的文档（左栏「待处理失败」段的数据源）。
 *
 * <p>失败项此前只在卷内文档行右侧显示一个红点，原因只能到文档视图右键看分块才知道。
 * 这里把失败项提出来，供左栏在原地展示原因和重试入口。</p>
 */
const failedFiles = computed(() => filesForFilter.value.filter((f) => f.processingStatus === 'failed'))

/**
 * 待重建索引的文档（左栏「待重建索引」段的数据源）。
 *
 * <p>与 {@link staleFileCount} 同源，另出一份带元素引用的列表供左栏逐条渲染。</p>
 */
const staleFiles = computed(() => filesForFilter.value.filter((f) => f.processingStatus === 'uploaded'))

/** 台账里所有轮次的引用总数 */
const askCiteTotal = computed(() => askTurns.value.reduce((a, t) => a + (t.citeCount || 0), 0))

/**
 * 实体类型条形的长度：按最大类型计数归一，最小 2% 保证小类也看得见。
 *
 * @param count 该类型的实体数
 * @returns CSS 百分比宽度
 */
function typeBarWidth(count: number): string {
  const max = Math.max(...entityTypeStats.value.map((s) => s.count), 1)
  return `${Math.max(2, Math.round((count / max) * 100))}%`
}

/**
 * 流水线四道工序状态带：入库 → 切分 → 向量化 → 抽取。
 *
 * <p>把「系统现在在干什么」摊开：每道工序给出计数，处理中的工序标 warning 并走扫描线。
 * 计数全部来自已有数据（filesForFilter / chunkStat / graphView），不额外请求。</p>
 *
 * <p>拿不到的量报「—」，不用 0 冒充读数；向量化这一道改用「已索引 N 篇」表达进度，
 * 这样它不会和「切块 0」互相打脸（后者本来只是接口没给分片数）。</p>
 *
 * <p><b>位置敏感</b>：必须声明在 graphView / filesForFilter / totalChunks 之后——
 * 模板首次渲染会立刻读它，若依赖仍在 TDZ 会抛 ReferenceError 并整块渲染失败。
 * 另外 graphView 是 reactive 对象而非 ref，读取时不能写 .value。</p>
 */
const pipelineStages = computed(() => {
  const fs = filesForFilter.value
  const waiting = fs.filter((f) => ['queued', 'uploading', 'pending'].includes(f.processingStatus)).length
  const parsing = fs.filter((f) => f.processingStatus === 'processing').length
  const stale = staleFileCount.value
  const failed = failedFileCount.value
  // 处理中那一篇的实时步骤：有 currentStep 就报它，没有就说「正在向量化」，
  // 不编造 12/21 这种界面算不出来的进度。
  const running = fs.find((f) => f.processingStatus === 'processing')
  const runningHint = running
    ? `${running.displayName || running.fileName}${running.progressPercentage ? ` ${Math.round(running.progressPercentage)}%` : ''}`
    : ''
  return [
    {
      key: 'intake',
      label: '入库',
      value: `${fs.length}`,
      unit: '篇',
      running: waiting > 0,
      tone: '',
      hint: !fs.length ? '这个卷宗还没有文档' : waiting > 0 ? `${waiting} 篇待入库` : '全部已落库',
    },
    {
      key: 'chunk',
      label: '切分',
      value: chunkStat.value.value,
      unit: chunkStat.value.known ? '块' : '',
      running: parsing > 0,
      tone: chunkStat.value.known ? '' : 'mute',
      hint: chunkStat.value.known ? '已按上限切分' : '后端未返回分片数',
    },
    {
      key: 'embed',
      label: '向量化',
      value: parsing > 0 ? `${parsing}` : stale > 0 ? `${stale}` : `${indexedFileCount.value}`,
      unit: parsing > 0 ? '篇进行中' : stale > 0 ? '篇待重建' : '篇已索引',
      running: parsing > 0,
      // 待重建用 warning：它不是「正在进行」，是「需要你点一下」，视觉上要能被看见
      tone: parsing > 0 || stale > 0 ? 'warning' : '',
      hint: parsing > 0
        ? runningHint || '正在写入向量'
        : stale > 0
          ? '索引状态丢失，点顶栏「待重建」补齐'
          : indexedFileCount.value > 0 ? '索引就绪，可检索' : '还没有索引',
    },
    {
      key: 'extract',
      label: '实体抽取',
      value: failed > 0 ? `${failed}` : `${graphView.entityCount}`,
      unit: failed > 0 ? '失败' : '实体',
      running: false,
      tone: failed > 0 ? 'error' : '',
      hint: failed > 0
        ? '有文档解析失败，进「文档」看原因'
        : graphView.entityCount > 0
          ? `${fmtCount(graphView.relationCount)} 条关系`
          : '尚未抽取关系',
    },
  ]
})

/**
 * 问答视图的提问范例：按当前知识库是否已有实体/文档给出不同引导，
 * 纯静态提示词，不需要额外请求。
 */
const askSuggestions = computed(() => {
  const hasEntities = graphView.entityCount > 0
  const hasFiles = filesForFilter.value.length > 0
  if (!hasFiles) {
    return ['这个知识库有哪些文档？', '上传文档后能问什么？']
  }
  return hasEntities
    ? ['主要人物之间是什么关系？', '这几篇文档的核心考点是什么？', '哪些情节可以支撑这个结论？']
    : ['这几篇文档的核心考点是什么？', '帮我总结主要论点', '哪些段落可以支撑这个结论？']
})

/** 四个分栏各自的计数。显式标注返回类型，否则 key 会被推断成 string，模板里回写分栏就过不了类型检查 */
const fileStatusFilters = computed<ReadonlyArray<{ key: FileStatusFilter; label: string; count: number }>>(() => {
  const files = filesForFilter.value
  const countOf = (key: string) => {
    if (key === 'all') {
      return files.length
    }
    const group = FILE_STATUS_GROUPS[key] || []
    return files.filter((f) => group.includes(f.processingStatus)).length
  }
  return [
    { key: 'all', label: '全部', count: countOf('all') },
    { key: 'indexed', label: '已索引', count: countOf('indexed') },
    { key: 'stale', label: '待重建', count: countOf('stale') },
    { key: 'parsing', label: '处理中', count: countOf('parsing') },
    { key: 'failed', label: '失败', count: countOf('failed') },
  ]
})

/** 原文预览弹窗 */
const previewVisible = ref(false)
/** 预览的相对路径 */
const previewPath = ref('')

/**
 * 打开知识点原文预览。
 *
 * <p>这是「预览」的正路：走 {@code GET /bases/{id}/file} 拿原文并渲染。
 * 原来点文件只打开分块查看（看不到正文，用户反馈「文件无法预览」）。</p>
 *
 * @param file 目标文件；也可由引用卡片直接给相对路径
 * @param path 显式相对路径，优先于 file.relativePath
 */
function openFilePreview(file?: KBFile, path?: string) {
  // 目录是容器不是文档：此前只有「缺路径」一道判断，目录节点（如删除失败残留、
  // 或点了目录行本身）会被当成文件去 GET /file，后端回「文件不存在」，
  // 用户看到的是 404 而不是「这是目录，不能预览」。
  if (file?.isDirectory) {
    toast.warning('这是目录，不能预览；请展开后点里面的文件')
    return
  }
  const p = path || file?.relativePath || file?.fileName || ''
  if (!p) {
    toast.warning('该文件没有可预览的相对路径')
    return
  }
  previewPath.value = p
  previewVisible.value = true
}

/**
 * 获取当前文件夹路径（从 KBFileTree 组件）
 */
function getCurrentFolderPath(): string | null {
  if (fileTreeRef.value && fileTreeRef.value.getCurrentFolderPath) {
    return fileTreeRef.value.getCurrentFolderPath()
  }
  return null
}

/**
 * 获取当前目录下的文件列表（从 KBFileTree 组件）
 */
function getCurrentFiles(): KBFile[] {
  if (fileTreeRef.value && fileTreeRef.value.getCurrentFiles) {
    return fileTreeRef.value.getCurrentFiles()
  }
  return []
}



/**
 * 清空图谱页的两个过滤条件（实体名关键词 + 实体类型）。
 *
 * <p>图谱工具栏有这两道过滤，但画布在零命中时是空的，没有统一的「重置」入口；
 * 用户只能逐个去清，这里给一个一次清完的入口。</p>
 */
function clearGraphFilters() {
  graphKeyword.value = ''
  graphTypeFilter.value = []
}

/** 「只看人物」快捷过滤：点一次只筛 person，再点恢复。 */
function togglePersonOnly() {
  const only = graphTypeFilter.value.length === 1 && graphTypeFilter.value[0] === 'person'
  graphTypeFilter.value = only ? [] : ['person']
}

// ========== Lifecycle ==========
// 详情页支持 ?tab= 深链：外部/验收可直接打开指定视图，路由查询变化时同步切换
watch(() => route.query.tab, (tab) => {
  const next = kbViewKeyFromQuery(tab)
  if (next) activeTab.value = next
})

// 切到「关系图谱」页签时才拉图（懒加载，避免拖慢知识库首屏）；
// 实体 / 关系视图从菜单直开时也要有数据 —— 此前只有 graph 页签会拉，直开会是空表
watch(activeTab, (tab) => {
  if (tab === 'files') {
    // 文件树只在「文档」页签挂载，切回来会重新拉取；点亮加载态，
    // 空态覆盖层不会在数据到达前抢先出现
    treeLoading.value = true
  }
  if (tab === 'graph' && graphView.nodes.length > 0) {
    graphEverMounted.value = true
  }
  if (tab === 'graph' || tab === 'overview') {
    // 概览页也要展示实体/关系分布，所以和图谱页一样拉整张图
    void loadGraph()
    return
  }
  if ((tab === 'entities' || tab === 'relations') && !graphLoading.value && graphView.nodes.length === 0) {
    void loadGraph()
  }
})

// 切换知识库时图谱要跟着换；计数走轻量接口，图本身等切页签再拉
watch(() => store.activeKnowledgeBaseId, () => {
  // 切库后文件树会重新拉取，先点亮加载态，避免旧库数据残留成「假计数」
  treeLoading.value = true
  loadedFiles.value = []
  inventoryFiles.value = []
  graphKeyword.value = ''
  graphEntityKeyword.value = ''
  graphRelationKeyword.value = ''
  entityPage.value = 1
  relationPage.value = 1
  selectedEntityUids.value = []
  selectedRelationUids.value = []
  // 先清掉上一张图再决定要不要重拉：否则切库瞬间、或轻量计数路径下，
  // 新库的页面上还挂着旧库的节点（用户看到的就是「串库」）。
  graphView.nodes = []
  graphView.edges = []
  graphView.entityCount = 0
  graphView.relationCount = 0
  graphView.placeholder = true
  graphCount.value = 0
  resetGraphLazy()
  if (activeTab.value === 'graph' || activeTab.value === 'entities' || activeTab.value === 'relations') {
    void loadGraph()
  } else {
    void refreshGraphCount()
  }
})

onMounted(async () => {
  // 显示偏好与首屏数据无关，并行拉取即可（内部幂等 + 去重）
  void initKbDisplay()
  // 命令面板快捷键（Ctrl/⌘+K）：只在本页挂载期间生效
  window.addEventListener('keydown', onGlobalKeydown)
  fetchRagStatus()
  await store.fetchKnowledgeBases()
  await loadOverview() // 列表页统计卡与卡片计数（须在库列表之后，per_base 才有意义）

  // 从路由参数读取知识库 ID
  const kbIdFromRoute = route.params.id as string

  if (kbIdFromRoute && store.knowledgeBases.length > 0) {
    // 如果路由中有 ID,选择对应的知识库
    const kb = store.knowledgeBases.find(k => k.id === kbIdFromRoute)
    if (kb) {
      await handleSelectKB(kb)
      const tabFromQuery = kbViewKeyFromQuery(route.query.tab)
      if (tabFromQuery) activeTab.value = tabFromQuery
      // refreshFileList 已在 handleSelectKB 中调用,无需重复
    }
  }

  // 知识库的默认界面就是三栏档案台（UI 图口径），不再先落一层列表页：
  // URL 上没有库 ID 时，沿用本次会话选过的库，否则取第一个启用库。
  // 一个库都没有（首次使用）才留列表页 —— 新建入口在那里，进来也没东西可看。
  if (viewMode.value === 'list' && store.knowledgeBases.length > 0) {
    const preferred = store.knowledgeBases.find(k => k.id === store.activeKnowledgeBaseId)
      ?? store.knowledgeBases.find(k => k.isActive !== false)
      ?? store.knowledgeBases[0]
    if (preferred) await handleSelectKB(preferred)
  }

  // 关键优化:检查是否有上传任务，按需启动轮询
  checkAndStartUploadTaskPolling()
})

// 关键修复:组件销毁时清理定时器,防止内存泄漏
onUnmounted(() => {
  console.log('[DEBUG] KnowledgeBasePage 组件销毁,清理定时器')
  // 注意：文件轮询已由 KBFileTree 内部管理，无需在此清理
  stopUploadTaskPolling() // 停止上传任务轮询
  window.removeEventListener('keydown', onGlobalKeydown) // 撤销命令面板快捷键
})

/**
 * 检查并启动上传任务轮询（如果尚未启动）
 */
function checkAndStartUploadTaskPolling() {
  // 如果已经有轮询定时器，不重复启动
  if (uploadTaskPollingTimer !== null) {
    return
  }

  // 检查是否有活跃的上传任务
  if (!store.activeKnowledgeBaseId) return

  const tasks = uploadStore.getTasksByKB(store.activeKnowledgeBaseId)
  const hasActiveTasks = tasks.some(task =>
    task.status === 'queued' ||
    task.status === 'uploading'
  )

  if (hasActiveTasks) {
    startUploadTaskPolling()
  }
}

/**
 * 启动上传任务轮询
 */
function startUploadTaskPolling() {
  // 清除旧的定时器
  if (uploadTaskPollingTimer !== null) {
    clearInterval(uploadTaskPollingTimer)
  }

  // 每 500ms 刷新一次上传任务列表
  uploadTaskPollingTimer = window.setInterval(() => {
    refreshUploadTasksList()
  }, 500)

  console.log('[DEBUG] 启动上传任务轮询')
}

/**
 * 停止上传任务轮询
 */
function stopUploadTaskPolling() {
  if (uploadTaskPollingTimer !== null) {
    clearInterval(uploadTaskPollingTimer)
    uploadTaskPollingTimer = null
    console.log('[DEBUG] 停止上传任务轮询')
  }
}

/**
 * 刷新上传任务列表
 */
function refreshUploadTasksList() {
  if (!store.activeKnowledgeBaseId) return

  // 从 fileUpload store 获取当前知识库的上传任务
  const tasks = uploadStore.getTasksByKB(store.activeKnowledgeBaseId)

  console.log(`[DEBUG] refreshUploadTasksList: store中有 ${tasks.length} 个任务`)
  console.log(`[DEBUG] 任务状态分布:`, tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1
    return acc
  }, {} as Record<string, number>))

  // 关键修复:上传完成(uploaded)的任务应该从上传弹窗移除,显示到文件列表
  // 只保留正在上传或排队中的任务: queued, uploading, failed
  const displayTasks = tasks.filter(task =>
    task.status !== 'uploaded'
  )

  console.log(`[DEBUG] 过滤后显示 ${displayTasks.length} 个任务`)

  // 关键修复:只有当任务列表真正变化时才更新,避免不必要的响应式触发
  const oldLength = uploadTasksList.value.length
  const newLength = displayTasks.length
  const hasContentChange = oldLength !== newLength ||
    displayTasks.some((task, index) => task.id !== uploadTasksList.value[index]?.id)

  if (hasContentChange) {
    // 转换为 KBFile 格式用于显示
    uploadTasksList.value = displayTasks.map(task => uploadStore.taskToFileRecord(task))
    console.log(`[DEBUG] 刷新上传任务列表: ${uploadTasksList.value.length} 个任务`)
  }

  // 关键修复:先清除已完成的任务
  autoRemoveCompletedTasks(tasks)

  // 关键修复:清除任务后,重新从 store 获取最新列表来判断是否关闭弹窗
  const remainingTasks = uploadStore.getTasksByKB(store.activeKnowledgeBaseId)
  checkAndAutoCloseModal(remainingTasks)

  // 关键优化:检查是否还有活跃任务，如果没有则停止轮询
  const hasActiveUploadTasks = remainingTasks.some(task =>
    task.status === 'queued' || task.status === 'uploading'
  )

  if (!hasActiveUploadTasks && uploadTaskPollingTimer !== null) {
    console.log('[DEBUG] 所有上传任务完成，停止上传任务轮询')
    stopUploadTaskPolling()
  }
}

/**
 * 自动移除已完成的任务
 * @param allTasks 所有上传任务列表(UploadTask[])
 */
function autoRemoveCompletedTasks(allTasks: any[]) {
  const completedTaskIds = allTasks
    .filter(task => task.status === 'uploaded' || task.status === 'failed')
    .map(task => task.id)

  // 立即从 uploadStore 中清除上传完成或失败的任务
  completedTaskIds.forEach(taskId => {
    uploadStore.clearUploadTask(taskId)
    console.log(`[DEBUG] 立即移除任务: ${taskId}`)
  })
}

/**
 * 检查并自动关闭弹窗
 * @param allTasks 所有上传任务列表(UploadTask[])
 */
function checkAndAutoCloseModal(allTasks: any[]) {
  console.log(`[DEBUG] checkAndAutoCloseModal: 收到 ${allTasks.length} 个任务`)
  console.log(`[DEBUG] 任务状态:`, allTasks.map(t => ({ id: t.id.substring(0, 8), status: t.status })))

  // 检查是否有活跃任务（排除 uploaded 和 failed）
  const hasActiveTasks = allTasks.some(task =>
    task.status !== 'uploaded' &&
    task.status !== 'failed'
  )

  console.log(`[DEBUG] hasActiveTasks: ${hasActiveTasks}, showUploadTaskModal: ${showUploadTaskModal.value}, autoCloseModalTimer: ${autoCloseModalTimer}`)

  // 如果没有活跃任务且弹窗正在显示，则自动关闭
  if (!hasActiveTasks && showUploadTaskModal.value) {
    // 关键修复:只在定时器不存在时才设置,避免被轮询不断重置
    if (autoCloseModalTimer === null) {
      console.log('[DEBUG] 满足自动关闭条件，1秒后关闭弹窗')
      autoCloseModalTimer = window.setTimeout(() => {
        showUploadTaskModal.value = false
        autoCloseModalTimer = null
        console.log('[DEBUG] 所有任务完成，自动关闭弹窗')
      }, 1000)
    } else {
      console.log('[DEBUG] 已有自动关闭定时器，跳过重置')
    }
  } else {
    // 如果还有活跃任务，清除定时器
    if (autoCloseModalTimer !== null) {
      clearTimeout(autoCloseModalTimer)
      autoCloseModalTimer = null
      console.log('[DEBUG] 检测到新的活跃任务，清除自动关闭定时器')
    }
  }
}

/**
 * 刷新文件列表
 * 注意：KBFileTree 现在内部管理文件列表和轮询，此函数仅用于触发 KBFileTree 重新加载
 */
async function refreshFileList() {
  if (!store.activeKnowledgeBaseId) return

  try {
    // 通知 KBFileTree 重新加载当前目录
    if (fileTreeRef.value && fileTreeRef.value.forceReload) {
      console.log('[DEBUG] 触发 KBFileTree 重新加载')
      await fileTreeRef.value.forceReload()
      // 注意:forceReload 内部会触发 files-loaded 事件,自动启动轮询
    }
  } catch (error) {
    console.error('刷新文件列表失败:', error)
  }
}

/**
 * 独立拉取当前知识库的扁平文件清单（含子目录），供左栏与统计格使用。
 *
 * <p>为什么不复用 {@code loadedFiles}：那个只由 {@code KBFileTree} 的 {@code files-loaded}
 * 事件填充，而文件树只在「文档」视图挂载——切到概览 / 图谱时计数会归零。
 * 这里直接调一次扁平列表接口，其余视图也能拿到真实篇数与切块数。</p>
 */
async function loadFileInventory(): Promise<void> {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId) {
    inventoryFiles.value = []
    return
  }
  try {
    const res = await apiService.fetchKBFiles(kbId, 0, 1000)
    // 接口返回分页信封，items 为空时回落到旧字段名
    const rows = (res as { items?: KBFile[]; records?: KBFile[] })?.items
      ?? (res as { records?: KBFile[] })?.records
      ?? []
    inventoryFiles.value = Array.isArray(rows) ? rows : []
  } catch (error) {
    const msg = String((error as any)?.message || '')
    // 空库的磁盘目录可能还不存在，按 0 篇处理即可（页面已有空态卡片），不刷控制台错误
    if (/目录不存在|not exist|NoSuchFile/i.test(msg)) {
      console.log(`[DEBUG] 知识库目录尚未创建，按空清单处理: ${msg.slice(0, 80)}`)
    } else {
      console.error('获取文件清单失败:', error)
    }
    inventoryFiles.value = []
  }
}



// 监听路由变化，处理 URL 中的 id 参数
watch(() => route.params.id, async (newKbId: string | string[] | undefined) => {
  // 如果是数组，取第一个值；如果是字符串直接使用；否则为 undefined
  const kbId = Array.isArray(newKbId) ? newKbId[0] : newKbId

  if (kbId && store.knowledgeBases.length > 0) {
    const kb = store.knowledgeBases.find(k => k.id === kbId)
    if (kb && store.activeKnowledgeBaseId !== kb.id) {
      await handleSelectKB(kb)
      const tabFromQuery = kbViewKeyFromQuery(route.query.tab)
      if (tabFromQuery) activeTab.value = tabFromQuery
    }
  } else {
    // 如果没有 ID，返回列表视图
    viewMode.value = 'list'
    store.setActiveKnowledgeBase(null)
  }
})

// 关键优化:监听 uploadStore 的任务变化，动态启动/停止轮询
watch(
  () => uploadStore.getTasksByKB(store.activeKnowledgeBaseId || '').length,
  (newCount, oldCount) => {
    console.log(`[DEBUG] 上传任务数量变化: ${oldCount} -> ${newCount}`)

    // 如果有活跃任务且轮询未启动，则启动
    if (newCount > 0 && uploadTaskPollingTimer === null) {
      console.log('[DEBUG] 检测到新的上传任务，启动轮询')
      checkAndStartUploadTaskPolling()
    }
  }
)
</script>



