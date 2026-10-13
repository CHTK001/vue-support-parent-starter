<template>
  <!-- kb-refactor：知识库编辑部设计层作用域（styles/kb-refactor.css）。
       data-kb-ask 由「设置 → 显示 → 右侧问答栏宽度」驱动（narrow / full）。 -->
  <div
    class="kb-refactor h-full w-full flex flex-col min-h-0"
    :data-kb-ask="askWidth"
  >
    <PageHeader :title="t('knowledge.page.title')" />
    
    <!-- RAG 未配置：整页只提示，不显示搜索框 / 新建按钮 / 卡片数据 -->
    <div v-if="!ragReady" class="flex-1 flex flex-col min-h-0">
      <div class="flex-1 flex items-center justify-center px-4 py-10">
        <div class="rag-gate">
          <el-icon class="rag-gate__icon" :size="46">
            <MenuBookOutlined />
          </el-icon>
          <h2 class="rag-gate__title">{{ t('knowledge.ragGate.title') }}</h2>
          <p class="rag-gate__desc">
            {{ ragStatus?.embeddingIssue || ragStatus?.message || t('knowledge.ragGate.desc') }}
          </p>
          <ReButton type="primary" round @click="goToConfig(ragStatus?.configPath)">
            {{ t('knowledge.ragGate.goConfig') }}
          </ReButton>
        </div>
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
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- 详情页头：左 返回（图标钮）+ 标题/副标题，右 图标动作组。
           全站图标按钮统一「无底色 + 悬浮提示」形态（.kb-btn），不再出现文字按钮 -->
      <div class="shrink-0 kb-detail__header">
        <ReSquareButton layout="square" class="kb-btn" :icon="ArrowLeft24Filled" tip="返回知识库列表" @click="backToList" />
        <div class="min-w-0 kb-detail__titlebox">
          <h1 class="kb-detail__title">{{ currentKB?.name }}</h1>
          <p class="kb-detail__subtitle">
            文档 {{ fmtCount(countOf(currentKB?.id || '', 'file_count')) }} 篇 ·
            实体 {{ fmtCount(countOf(currentKB?.id || '', 'entity_count')) }} ·
            关系 {{ fmtCount(countOf(currentKB?.id || '', 'relation_count')) }}
          </p>
        </div>
        <div class="flex-1" />
        <div class="kb-detail__actions">
          <ReSquareButton layout="square" class="kb-btn" :icon="Refresh" tip="刷新"
            :loading="detailRefreshing" @click="refreshDetail" />
          <ReSquareButton layout="square" class="kb-btn" type="primary" :icon="Setting" tip="设置"
            :disabled="!canEditCurrent" @click="handleMenuAction('settings')" />
          <ReSquareButton layout="square" class="kb-btn" type="danger" :icon="Delete" tip="删除知识库"
            :disabled="!canEditCurrent" @click="handleDeleteFromDetail" />
        </div>
      </div>
      <div class="flex-1 overflow-auto min-h-0 flex flex-col" @scroll="handleScroll">
        <div class="w-full kb-detail__body">
          <!-- 文件列表 Tab：左「文档」+ 右「智能问答」双栏 -->
          <KBMenu
            :kb-name="currentKB?.name"
            :active="activeTab"
            @select="handleMenuSelect"
            @action="handleMenuAction"
            @back="backToList"
          />

          <div v-show="activeTab === 'overview'" class="kb-pane kb-pane--scroll">
            <!-- 统计卡 -->
            <div class="kb-stats kb-overview__stats">
              <div class="kb-stat re-surface re-surface--dense">
                <el-icon :size="26" class="kb-stat__icon"><Document /></el-icon>
                <div class="kb-stat__body">
                  <div class="kb-stat__value">{{ fmtCount(countOf(currentKB?.id || '', 'file_count')) }}</div>
                  <div class="kb-stat__label">文档总量</div>
                </div>
              </div>
              <div class="kb-stat re-surface re-surface--dense">
                <el-icon :size="26" class="kb-stat__icon"><Share /></el-icon>
                <div class="kb-stat__body">
                  <div class="kb-stat__value">{{ fmtCount(countOf(currentKB?.id || '', 'entity_count')) }}</div>
                  <div class="kb-stat__label">实体节点</div>
                </div>
              </div>
              <div class="kb-stat re-surface re-surface--dense">
                <el-icon :size="26" class="kb-stat__icon"><Connection /></el-icon>
                <div class="kb-stat__body">
                  <div class="kb-stat__value">{{ fmtCount(countOf(currentKB?.id || '', 'relation_count')) }}</div>
                  <div class="kb-stat__label">关系连线</div>
                </div>
              </div>
            </div>

            <div class="kb-ov-grid">
              <!-- 实体类型分布 -->
              <section class="re-surface re-surface--dense kb-ov-card">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="kb-ov__title">实体类型分布</h3>
                  <ReTag size="small">{{ fmtCount(graphView.entityCount) }} 个实体</ReTag>
                </div>
                <div v-if="entityTypeStats.length > 0" class="flex flex-col gap-2.5">
                  <div v-for="s in entityTypeStats" :key="s.type" class="kb-ov__bar">
                    <span class="kb-ov__label">{{ s.label }}</span>
                    <span class="kb-ov__track">
                      <i class="kb-ov__fill" :style="{ width: barWidth(s.count, entityTypeStats[0].count), background: s.color }" />
                    </span>
                    <span class="kb-ov__count">{{ s.count }}</span>
                  </div>
                </div>
                <ReEmpty v-else text="暂无实体，上传文档或生成图谱后可见" />
              </section>

              <!-- 关系类型分布 -->
              <section class="re-surface re-surface--dense kb-ov-card">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="kb-ov__title">关系类型分布</h3>
                  <ReTag size="small">{{ fmtCount(graphView.relationCount) }} 条关系</ReTag>
                </div>
                <div v-if="relationTypeStats.length > 0" class="flex flex-col gap-2.5">
                  <div v-for="s in relationTypeStats" :key="s.type" class="kb-ov__bar">
                    <span class="kb-ov__label">{{ s.type }}</span>
                    <span class="kb-ov__track">
                      <i class="kb-ov__fill" :style="{ width: barWidth(s.count, relationTypeStats[0].count) }" />
                    </span>
                    <span class="kb-ov__count">{{ s.count }}</span>
                  </div>
                </div>
                <ReEmpty v-else text="暂无关系，点「知识图谱 → 生成图谱」抽取" />
              </section>

              <!-- 关联最多的实体 -->
              <section class="re-surface re-surface--dense kb-ov-card">
                <h3 class="kb-ov__title">关联最多的实体</h3>
                <ul v-if="topEntities.length > 0" class="kb-ov__list">
                  <li v-for="(e, i) in topEntities" :key="e.id" class="kb-ov__row" @click="openEntityInGraph(e.name)">
                    <span class="kb-ov__rank" :class="{ 'is-top': i < 3 }">{{ i + 1 }}</span>
                    <span class="kb-ov__name truncate">{{ e.name }}</span>
                    <el-tag size="small" :type="entityTagType(e.type)">{{ entityTypeLabel(e.type) }}</el-tag>
                    <span class="kb-ov__degree">{{ e.degree }} 关系</span>
                  </li>
                </ul>
                <ReEmpty v-else text="暂无实体" />
              </section>

              <!-- 快捷操作：图标 + 名称 + 说明的可点击行。
                   之前只有一排纯图标方块，鼠标不悬停时完全看不出功能，
                   且卡片内容过少、与相邻卡等高时内部大片留白。 -->
              <section class="re-surface re-surface--dense kb-ov-card">
                <h3 class="kb-ov__title">快捷操作</h3>
                <ul class="kb-ov__acts">
                  <li v-for="a in quickActions" :key="a.tab" class="kb-ov__act" @click="handleMenuSelect(a.tab)">
                    <span class="kb-ov__act-icon" :class="{ 'is-primary': a.tab === 'files' }">
                      <el-icon :size="16"><component :is="a.icon" /></el-icon>
                    </span>
                    <span class="kb-ov__act-text">
                      <b>{{ a.label }}</b>
                      <i>{{ a.desc }}</i>
                    </span>
                  </li>
                </ul>
                <p class="kb-ov__hint">
                  统计来自当前知识库的索引与图谱抽取结果；上传文档或重新生成图谱后会同步更新。
                </p>
              </section>
            </div>
          </div>

          <div v-show="activeTab === 'files'" class="kb-split">
            <!-- 左栏：文档 -->
            <section class="kb-split__docs">
              <div class="kb-split__head">
                <div class="kb-split__title">
                  <h2>文档</h2>
                  <el-tag effect="plain" round size="small">{{ filesForFilter.length }} 篇</el-tag>
                  <span v-if="currentKB?.name" class="kb-split__sub" :title="currentKB?.name">{{ currentKB?.name }}</span>
                </div>
                <!-- 上传入口（仅 owner；他人公开库只读）：纯图标方形按钮组 + 悬浮提示 -->
                <KBFileUploader v-if="canEditCurrent" :kb-id="store.activeKnowledgeBaseId!"
                  :current-folder-path="getCurrentFolderPath()" :get-current-files="getCurrentFiles"
                  @uploaded="handleUploadComplete" @show-upload-task="showUploadTaskModal = true"
                  @folder-created="handleFolderCreated" />
              </div>

              <div v-if="!canEditCurrent" class="kb-split__readonly">
                {{ t('knowledge.page.readonlyHint') }}
              </div>

              <!-- 状态分栏：全部 / 已索引 / 解析中 / 失败 -->
              <div class="kb-split__filters">
                <button
                  v-for="f in fileStatusFilters"
                  :key="f.key"
                  type="button"
                  class="kb-split__filter"
                  :class="{ 'is-active': fileStatusFilter === f.key }"
                  @click="fileStatusFilter = f.key"
                >
                  <span>{{ f.label }}</span>
                  <i class="kb-split__filter-count">{{ f.count }}</i>
                </button>
              </div>

              <!-- 文件列表内容区 -->
              <div class="kb-split__tree">
                <KBFileTree ref="fileTreeRef" :kb-id="store.activeKnowledgeBaseId!" :readonly="!canEditCurrent"
                  :status-filter="fileStatusFilter"
                  @view="handleViewFile" @retry="handleRetryFile" @delete="handleDeleteFile"
                  @folder-change="handleFolderChange" @files-loaded="handleFilesLoaded" />
              </div>
            </section>

            <!-- 右栏：智能问答 -->
            <section class="kb-split__ask">
              <KBAskPanel
                :kb-id="currentKB?.id || ''"
                :kb-name="currentKB?.name"
                :graph-nodes="graphNodes"
                :graph-edges="graphEdges"
                @view-graph="handleMenuSelect('graph')"
              />
            </section>
          </div>

          <!-- 搜索 Tab -->
          <div v-show="activeTab === 'search'" class="kb-pane">
            <KBSearchPanel :knowledge-bases="store.knowledgeBases" :default-kb-id="store.activeKnowledgeBaseId" />
          </div>

          <!-- 智能问答 Tab -->
          <div v-show="activeTab === 'ask'" class="kb-pane">
            <section class="kb-ask-standalone">
              <KBAskPanel
                :kb-id="currentKB?.id || ''"
                :kb-name="currentKB?.name"
                :graph-nodes="graphNodes"
                :graph-edges="graphEdges"
                @view-graph="handleMenuSelect('graph')"
              />
            </section>
          </div>

          <!-- 实体管理：工具条（搜索 + 图标动作组）+ 卡片表格 + 客户端分页 -->
          <div v-show="activeTab === 'entities'" class="kb-pane">
            <div class="kb-view__toolbar">
              <el-input v-model="graphEntityKeyword" :prefix-icon="Search" placeholder="按名称过滤" clearable
                class="kb-view__search" />
              <div class="flex-1" />
              <div class="kb-actions">
                <ReSquareButton layout="square" class="kb-btn" :icon="Refresh" tip="刷新" :loading="graphLoading" @click="loadGraph" />
                <ReSquareButton layout="square" class="kb-btn" type="primary" :icon="Plus" tip="新增实体" @click="openEntityForm()" />
                <ReSquareButton layout="square" class="kb-btn" type="danger" :icon="Delete"
                  :tip="selectedEntityUids.length ? `批量删除(${selectedEntityUids.length})` : '批量删除'"
                  :disabled="selectedEntityUids.length === 0" @click="handleBatchDeleteEntities" />
              </div>
            </div>
            <div class="panel-card">
              <!-- 实体表：裸 el-table → ReTable。type="selection" 删列改 show-selection；
                   engine="element" 沿用原 el-table DOM（:deep 样式与 e2e 选择器不失效）；
                   原表无 border → settings.border=false；分页仍由下方 el-pagination 自管；
                   clearSelection() 改调 ReTable 暴露的 clearAllSelection()。 -->
              <ReTable
                ref="entityTableRef"
                :data="pagedGraphEntities"
                :columns="entityColumns"
                :loading="graphLoading"
                engine="element"
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
                  <el-tag size="small" :type="entityTagType(row.type)">{{ entityTypeLabel(row.type) }}</el-tag>
                </template>
                <template #col-actions="{ row }">
                  <ReSquareButton layout="square" class="kb-btn" size="small" type="primary" :icon="Edit" tip="编辑" @click="openEntityForm(row)" />
                  <ReSquareButton layout="square" class="kb-btn" size="small" type="danger" :icon="Delete" tip="删除" @click="handleDeleteEntity(row)" />
                </template>
              </ReTable>
              <div class="pagination-wrapper">
                <el-pagination
                  v-model:current-page="entityPage"
                  v-model:page-size="entityPageSize"
                  :page-sizes="[10, 20, 50]"
                  :total="filteredGraphEntities.length"
                  layout="total, sizes, prev, pager, next"
                />
              </div>
            </div>
          </div>

          <!-- 关系管理：工具条（搜索 + 图标动作组）+ 卡片表格 + 客户端分页 -->
          <div v-show="activeTab === 'relations'" class="kb-pane">
            <div class="kb-view__toolbar">
              <el-input v-model="graphRelationKeyword" :prefix-icon="Search" placeholder="按实体名/关系类型过滤" clearable
                class="kb-view__search" />
              <div class="flex-1" />
              <div class="kb-actions">
                <ReSquareButton layout="square" class="kb-btn" :icon="Refresh" tip="刷新" :loading="graphLoading" @click="loadGraph" />
                <ReSquareButton layout="square" class="kb-btn" type="primary" :icon="Plus" tip="新增关系" @click="openRelationForm()" />
                <ReSquareButton layout="square" class="kb-btn" type="danger" :icon="Delete"
                  :tip="selectedRelationUids.length ? `批量删除(${selectedRelationUids.length})` : '批量删除'"
                  :disabled="selectedRelationUids.length === 0" @click="handleBatchDeleteRelations" />
              </div>
            </div>
            <div class="panel-card">
              <!-- 关系表：同实体表换算（无 border、type="selection" 删列改 show-selection、v-loading→:loading）。 -->
              <ReTable
                ref="relationTableRef"
                :data="pagedGraphRelations"
                :columns="relationColumns"
                :loading="graphLoading"
                engine="element"
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
                  <el-tag size="small" :type="relationTagType(row.text)">{{ row.text }}</el-tag>
                </template>
                <template #col-actions="{ row }">
                  <ReSquareButton layout="square" class="kb-btn" size="small" type="danger" :icon="Delete" tip="删除" @click="handleDeleteRelation(row)" />
                </template>
              </ReTable>
              <div class="pagination-wrapper">
                <el-pagination
                  v-model:current-page="relationPage"
                  v-model:page-size="relationPageSize"
                  :page-sizes="[10, 20, 50]"
                  :total="filteredGraphRelations.length"
                  layout="total, sizes, prev, pager, next"
                />
              </div>
            </div>
          </div>

          <div v-show="activeTab === 'graph'" class="kb-pane kb-pane--graph">
            <div class="kb-graph__bar">
              <span class="text-sm kb-graph__count">
                <template v-if="isGraphFiltered">
                  实体 {{ graphNodes.length }} / {{ graphView.entityCount }} ·
                  关系 {{ graphEdges.length }} / {{ graphView.relationCount }}
                </template>
                <template v-else>
                  实体 {{ graphView.entityCount }} · 关系 {{ graphView.relationCount }}
                </template>
              </span>
              <!-- 图例说明与手工补录提示收敛进悬浮气泡，不再占用两行版面 -->
              <el-tooltip placement="bottom-start" effect="light" :show-after="150">
                <template #content>
                  <div class="leading-relaxed max-w-[320px]">
                    节点大小按关系条数缩放（{{ NODE_MIN_SIZE }}–{{ NODE_MAX_SIZE }}px，每条关系 +{{ NODE_SIZE_STEP }}px），点击节点可看关系明细。
                  </div>
                  <div class="leading-relaxed max-w-[320px] mt-1">
                    画布直接用鼠标滚轮 / 触控板缩放；手工补录的内容独立于知识点，删除知识点不会连带删掉。
                  </div>
                </template>
                <el-icon class="kb-graph__help"><QuestionFilled /></el-icon>
              </el-tooltip>

              <span v-if="graphError" class="text-sm text-[var(--rm-danger)]">{{ graphError }}</span>
              <span v-else-if="!graphLoading && graphView.nodes.length === 0" class="text-sm kb-graph__hint">
                <template v-if="graphView.placeholder">
                  暂无图谱数据（尚未抽取过关系）。点「生成图谱」让 AI 从现有知识点里抽一遍。
                </template>
                <template v-else>
                  当前范围确实没有关系。可点「重新生成」按最新原文再抽一次。
                </template>
              </span>
              <!-- 节点过多时的引导：实测 248 节点无论把 kr/kg/碰撞半径调到哪，
                   重叠对数都只在噪声范围内波动（甚至关掉防重叠反而更少）——
                   力参数救不了，唯一有效的是减少节点数，所以在这里给出明确动作。
                   筛选一旦生效提示即消失，不长期占版面。 -->
              <span v-else-if="graphTooDense" class="text-sm kb-graph__hint">
                节点较多，按<ReButton type="primary" link class="kb-graph__hint-act"
                  @click="focusGraphTypeFilter">「实体类型」</ReButton>筛选后结构更清晰。
              </span>

              <div class="flex-1" />

              <el-input v-model="graphKeyword" :prefix-icon="Search" placeholder="按实体名过滤" clearable
                class="kb-view__search" />
              <!-- 实体类型过滤：概览页统计了类型分布却无处可用，这里接上多选 -->
              <el-select v-model="graphTypeFilter" ref="graphTypeFilterRef" multiple collapse-tags collapse-tags-tooltip
                :max-collapse-tags="2" clearable placeholder="实体类型" class="kb-view__types">
                <el-option v-for="s in entityTypeStats" :key="s.type" :label="`${s.label} (${s.count})`"
                  :value="s.type">
                  <span class="flex items-center gap-2">
                    <i class="kb-dot" :style="{ background: s.color }" />
                    <span>{{ s.label }}</span>
                    <span class="kb-dot__n">{{ s.count }}</span>
                  </span>
                </el-option>
              </el-select>
              <div class="kb-actions">
                <ReSquareButton layout="square" class="kb-btn" :icon="Refresh" tip="刷新" :loading="graphLoading" @click="loadGraph" />
                <!-- 占位图时主推「生成」，有数据时也允许重新抽取（原文改了关系可用） -->
                <ReSquareButton layout="square" v-if="ragReady" class="kb-btn" type="primary" :icon="Refresh"
                  :tip="graphView.placeholder ? '生成图谱' : '重新生成'"
                  :loading="graphGenerating" @click="handleGenerateGraph" />
                <ReSquareButton layout="square" v-if="graphView.nodes.length > 0" class="kb-btn" :icon="Grid" tip="管理实体" @click="goManage('entity')" />
                <ReSquareButton layout="square" v-if="graphView.nodes.length > 0" class="kb-btn" :icon="Connection" tip="管理关系" @click="goManage('relation')" />
              </div>
            </div>

            <div class="kb-graph__body">
              <div v-loading="graphLoading" class="kb-graph__canvas kb-graph__stage">
                <!-- toolbar=true：组件自带地图式工具栏（布局/分组/高亮/悬停聚焦/小地图），
                     toolbar-items 只保留图谱需要的按钮；页面右上角仍负责刷新/生成/管理实体等动作 -->
                <ReRelationGraph v-if="graphNodes.length > 0 && activeTab === 'graph'" ref="graphCompRef" :nodes="graphNodes" :edges="graphEdges"
                  toolbar toolbar-position="top-left" :toolbar-items="graphToolbarItems" show-groups highlight="adjacent"
                  details lazy-details :load-node-detail="loadGraphEntityDetail" :load-neighbors="loadGraphNeighbors"
                  :menu-items="graphMenuItems" :load-settings="loadGraphLayoutSettings" :save-settings="saveGraphLayoutSettings"
                  edge-label-mode="onHover" layout="force-atlas2" height="100%" @ready="handleGraphReady" @node-click="handleGraphNodeClick" />

                <!-- 过滤后无命中：图谱组件 v-if 已卸载，若不给提示画布就是一片空白，
                     用户会以为是加载失败而不是「筛掉了」 -->
                <div v-if="!graphLoading && graphView.nodes.length > 0 && graphNodes.length === 0"
                  class="kb-graph__filtered">
                  <el-icon :size="26"><Search /></el-icon>
                  <span>当前过滤条件下没有匹配的实体</span>
                  <ReButton type="primary" link @click="clearGraphFilters">清空过滤条件</ReButton>
                </div>

                <!-- 图例：按当前图谱里实际出现的实体类型生成，不写死 -->
                <div v-if="graphLegend.length > 0" class="kb-graph__legend">
                  <span v-for="l in graphLegend" :key="l" class="kb-graph__legend-item">
                    <i class="kb-graph__legend-dot" :style="{ background: entityColor(l) }" />{{ entityTypeLabel(l) }}
                  </span>
                </div>
              </div>

              <!-- 右：实体详情（点击节点出现） -->
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
        </div>
      </div>

    </div>
  </div>

  <!-- 新增/编辑实体表单（表单弹窗挂在模板根部，不依赖任何视图的显示状态） -->
  <ReDialog v-model="showEntityForm" :title="entityForm.id ? '编辑实体' : '新增实体'" :width="460" :close-on-click-modal="false">
    <div class="kb-refactor flex flex-col gap-4">
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">名称<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i></label>
        <el-input v-model="entityForm.name" maxlength="128" />
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">类型</label>
        <el-select v-model="entityForm.type" class="!w-full">
          <el-option v-for="t in ENTITY_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">说明</label>
        <el-input v-model="entityForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">图片地址</label>
        <div class="flex items-center gap-2">
          <el-input v-model="entityForm.logo" maxlength="512" placeholder="https://… 或 /kb-images/….png；清空即移除图片" />
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
    <div class="kb-refactor flex flex-col gap-4">
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">源实体<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i></label>
        <el-select v-model="relationForm.source" filterable allow-create default-first-option
          placeholder="输入或选择已有实体名" class="!w-full">
          <el-option v-for="n in graphView.nodes" :key="n.id" :label="n.text" :value="n.text" />
        </el-select>
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">关系类型<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i></label>
        <el-input v-model="relationForm.type" placeholder="如 镇守 / 结义 / 放走" maxlength="32" />
      </div>
      <div>
        <label class="block text-xs font-medium text-[var(--rm-text-secondary)] mb-1.5">目标实体<i class="not-italic text-[var(--rm-danger)] ml-0.5">*</i></label>
        <el-select v-model="relationForm.target" filterable allow-create default-first-option
          placeholder="输入或选择已有实体名" class="!w-full">
          <el-option v-for="n in graphView.nodes" :key="n.id" :label="n.text" :value="n.text" />
        </el-select>
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
    <div class="kb-refactor kb-form">
      <div class="kb-field">
        <span class="kb-label">
          {{ t('knowledge.page.kbName') }}<i class="kb-req">*</i>
        </span>
        <el-input v-model="dialogForm.name" :placeholder="t('knowledge.page.kbNamePlaceholder')" maxlength="255" show-word-limit />
      </div>

      <div class="kb-field">
        <span class="kb-label">{{ t('common.description') }}</span>
        <el-input v-model="dialogForm.description" type="textarea" :rows="3" :placeholder="t('knowledge.page.descriptionPlaceholder')"
          maxlength="2000" show-word-limit resize="none" />
      </div>

      <!-- 网址采集：填了网址即从该站点抓取正文入库（与手动上传文件等价，可被语义检索） -->
      <div class="kb-sec">
        <div class="kb-sec__title">网址采集</div>
        <div class="kb-field">
          <span class="kb-label">网址</span>
          <el-input v-model="dialogForm.sourceUrl" placeholder="https://example.com/  留空表示不启用" clearable />
          <p v-if="dialogForm.sourceUrl" class="kb-hint">
            创建时会立即抓取该网址：只允许 http/https 的公网地址，内网与云元数据地址会被拒绝。
          </p>
        </div>
        <div class="kb-field">
          <span class="kb-label">同域采集页数</span>
          <el-input-number v-model="dialogForm.sourceMaxPages" class="kb-num kb-num--short" :min="1" :max="50" :step="1"
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
            <el-input-number v-model="dialogForm.chunkMaxSize" class="kb-num" :min="100" :max="5000" :step="100"
              controls-position="right" />
          </div>
          <div class="kb-field">
            <span class="kb-label">{{ t('knowledge.page.chunkOverlapSize') }}</span>
            <el-input-number v-model="dialogForm.chunkOverlapSize" class="kb-num" :min="0" :max="500" :step="10"
              controls-position="right" />
          </div>
          <div class="kb-field">
            <span class="kb-label">{{ t('knowledge.page.chunkMinSize') }}</span>
            <el-input-number v-model="dialogForm.chunkMinSize" class="kb-num" :min="10" :max="500" :step="10"
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
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, nextTick, defineAsyncComponent } from 'vue'
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
import { FileChunksViewer, KBFileUploader, KBFileTree, KBMenu, KBSearchPanel, KBTemplateGallery, UploadTaskModal } from './index'
import KnowledgeOverview from './KnowledgeOverview.vue'
// 本地资源：从设计稿的远程地址下载后入库，避免运行期外链（离线即裂、CDN 失效不可控）
import heroIllustration from '@/assets/kb/kb-empty-hero.png'
import coverSanguo from '@/assets/kb/tpl-sanguo.png'
import coverPoem from '@/assets/kb/tpl-poem.png'
import coverIdiom from '@/assets/kb/tpl-idiom.png'
import coverQuestion from '@/assets/kb/tpl-question.png'
import KBAskPanel from './KBAskPanel.vue'
import KBFilePreview from './KBFilePreview.vue'
// 关系图谱使用 G6 内核的 ReRelationGraph（@repo/ui 已提供），异步加载避免拖慢知识库首屏
const ReRelationGraph = defineAsyncComponent(() =>
  import('@repo/ui/re-relation-graph').then((m) => m.default),
)
import { useStorage, useDebounceFn } from '@vueuse/core'
import { usePopup } from '@/composables/usePopup'
import { ArrowLeft24Filled, Globe24Regular, LockClosed24Regular } from '@vicons/fluent'
import { MenuBookOutlined } from '@vicons/material'
import PageHeader from '@/components/PageHeader.vue'
import { apiService } from '@/services/ApiService'
import { api } from '@/framework/context'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import ReDialog from '@repo/ui/re-dialog'
import ReButton from '@/components/re/ReButton.vue'
// 仓库标准的正方形图标按钮（layout="square" 且内建 el-tooltip）：
// 工具栏 / 表格操作列的「纯图标 + 悬浮提示」统一用它，避免各处再包一层 el-tooltip。
import ReSquareButton from '@repo/ui/re-button'
import ReTag from '@/components/re/ReTag.vue'
import ReEmpty from '@/components/re/ReEmpty.vue'
// ReTable 换算：仓库标准表格组件（引擎选 element 保持原 el-table DOM）与列类型
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
// 模板数据集类型：携带完整文档 / 实体 / 关系，创建后整体复制进新库
import type { KbTemplateDataset } from '@/data/kb/templates/types'
import { SANGUO_DATASET } from '@/data/kb/templates/sanguo'

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
const activeTab = ref<'overview' | 'files' | 'search' | 'graph' | 'ask' | 'entities' | 'relations'>('files')  // 当前激活的 Tab
const viewMode = ref<'list' | 'detail'>('list')  // 视图模式：列表或详情
const searchKeyword = ref('')  // 知识库搜索关键词
const detailRefreshing = ref(false)  // 详情页头「刷新」进行中

// ---- 关系图谱（Tab=graph）状态 ----
const graphLoading = ref(false)        // 图谱加载中
const graphError = ref('')             // 图谱加载错误
const graphKeyword = ref('')           // 实体名过滤关键词
const graphTypeFilter = ref<string[]>([]) // 实体类型过滤（空 = 不过滤）
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
const entityColumns: ReTableColumn[] = [
  { prop: 'name', label: '名称', minWidth: 160, slot: 'name' },
  { prop: 'type', label: '类型', width: 120, slot: 'type' },
  { prop: 'degree', label: '关系数', width: 90, align: 'right' },
  { prop: 'actions', label: '操作', width: 140, align: 'right', slot: 'actions' },
]

// 关系表列：源 / 关系 / 目标（模板插槽渲染头像+实体名、关系标签、删除按钮）
const relationColumns: ReTableColumn[] = [
  { prop: 'from', label: '源', minWidth: 150, slot: 'from' },
  { prop: 'text', label: '关系', width: 140, slot: 'text' },
  { prop: 'to', label: '目标', minWidth: 150, slot: 'to' },
  { prop: 'actions', label: '操作', width: 100, align: 'right', slot: 'actions' },
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
 * 总览页搜索：写入既有关键词，交给原有过滤逻辑。
 *
 * @param kw 关键词
 */
function handleOverviewSearch(kw: string) {
  searchKeyword.value = kw
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
  activeTab.value = key as 'overview' | 'files' | 'search' | 'graph' | 'ask' | 'entities' | 'relations'
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
    // 分组容器：同一实体类型包一个浅色背景，页面工具栏可一键开关
    group: entityType,
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

/** 按关键词过滤后的节点：命中实体及其直接邻居都保留，避免过滤后只剩孤点 */
const graphNodes = computed(() => graphBaseNodes.value.map(decorateGraphNode))

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
 * 拉取当前知识库的关系图谱。
 * 抽取是上传后的异步任务，因此这里同时刷新页签徽标计数。
 */
async function loadGraph() {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId) {
    graphView.nodes = []
    graphView.edges = []
    graphView.entityCount = 0
    graphView.relationCount = 0
    graphCount.value = 0
    return
  }
  graphLoading.value = true
  graphError.value = ''
  try {
    const view = await apiService.fetchKnowledgeGraph(kbId)
    graphView.nodes = view.nodes
    graphView.edges = view.edges
    graphView.entityCount = view.entityCount
    graphView.relationCount = view.relationCount
    // 后端未返回该字段时按「有数据即非占位」兜底
    graphView.placeholder = view.placeholder === undefined
      ? view.entityCount === 0 && view.relationCount === 0
      : Boolean(view.placeholder)
    graphCount.value = view.entityCount + view.relationCount
  } catch (e: any) {
    graphError.value = e?.message || '关系图谱加载失败'
    graphView.nodes = []
    graphView.edges = []
    graphView.placeholder = true
    graphCount.value = 0
  } finally {
    graphLoading.value = false
  }
}

// ---- 按需生成图谱（网页采集来的知识点、或当初没开关系提取时补抽） ----
const graphGenerating = ref(false)

/**
 * 触发一次关系抽取并刷新图谱。
 *
 * <p>不传 doc_path 时后端会遍历该知识库下所有文本文件，网页采集来的快照也在其中。</p>
 */
async function handleGenerateGraph() {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId || graphGenerating.value) {
    return
  }
  graphGenerating.value = true
  try {
    const r = await apiService.generateKnowledgeBaseGraph(kbId)
    toast.success(
      `已生成：${r?.entityCount ?? 0} 个实体 / ${r?.relationCount ?? 0} 条关系（${r?.files ?? 0} 个知识点，${r?.elapsedMs ?? 0} ms）`,
    )
    await loadGraph()
    await refreshGraphCount()
  } catch (e: any) {
    toast.error(e?.message || '生成图谱失败')
  } finally {
    graphGenerating.value = false
  }
}

/** 点击节点时把该实体的关联情况提示出来（后续可扩展为展开子图） */
/** 图谱右栏当前选中的实体；null 表示面板收起 */
const selectedGraphNode = ref<{ id: string; name: string; type?: string; degree: number } | null>(null)

/**
 * 图例数据：按当前图谱里实际出现的实体类型生成，不写死类型名。
 *
 * <p>参考图左下角图例（蜀 / 刘备 / 诸葛亮…）是按势力或来源分组的；
 * 我们数据里能稳定拿到的是实体类型，先按类型出图例，不编造后端没有的分组字段。</p>
 */
const graphLegend = computed(() => {
  const set = new Set<string>()
  // 走过滤后的节点集：图例要说明「画布上现在有什么」，
  // 早前直接读 graphView.nodes，实体类型过滤后图例仍显示全部类型，对不上。
  for (const n of graphBaseNodes.value as Array<any>) {
    const t = String(n?.type ?? '').trim()
    if (t) {
      set.add(t)
    }
  }
  return [...set].sort()
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

function handleGraphNodeClick(node: any) {
  const clickId = String(node?.id ?? '')
  // G6 回传的是原始 RelationNode（nodeById 优先回 props 里的节点）：
  // 名字在 node.label / node.text 上，node.data.__label 是 G6 模型节点才有的字段，
  // 原始节点并不带 —— 原先只读 __label 会一路落到 clickId（哈希），
  // 导致详情头部、来源文档检索都用的是实体 ID 而非实体名。
  const name = String(node?.label ?? node?.text ?? node?.data?.__label ?? node?.data?.name ?? clickId)
  const degree = Number(node?.data?.degree)
    || graphEdges.value.filter((e) => e.source === clickId || e.target === clickId).length
  const type = node?.data?.entityType ? String(node.data.entityType) : undefined
  if (clickId) {
    selectedGraphNode.value = { id: clickId, name, type, degree }
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

/** 知识图谱布局名：G6 的 force 在这套数据上会退化成 (0,0)，实测 force-atlas2 正常 */
const GRAPH_LAYOUT = 'force-atlas2'

/** 组件工具栏只放图谱视图相关按钮；页面右上角仍负责刷新/生成/管理实体等动作 */
const graphToolbarItems = [
  'layout',
  'layoutSettings',
  'group',
  'highlight',
  'hoverFocus',
  'minimap',
] as const

/**
 * 右键自定义菜单：在组件内置「详情/扩线/最短路径」之外补一个「查看来源文档」。
 *
 * <p>演示 menuItems 的 name/icon/callback 契约；show 只在节点右键时出现。</p>
 */
const graphMenuItems = [
  {
    key: 'view-source-docs',
    label: '查看来源文档',
    icon: 'Search',
    show: (ctx: { kind: string; node: any }) => ctx.kind === 'node' && !!ctx.node,
    handler: async (ctx: { kind: string; node: any }) => {
      const node = ctx.node
      if (!node) return
      const clickId = String(node?.id ?? '')
      const name = String(node?.label ?? node?.text ?? clickId)
      const degree = Number(node?.data?.degree)
        || graphEdges.value.filter((e) => e.source === clickId || e.target === clickId).length
      const type = node?.data?.entityType ? String(node.data.entityType) : undefined
      selectedGraphNode.value = { id: clickId, name, type, degree }
      await viewSourceDocs()
    },
  },
]

/**
 * 右键扩线：后端查询某实体的直接邻居，返回 RelationNode/RelationEdge 契约数据。
 *
 * <p>返回后由组件内部合并进 G6 模型（不整图重装，保留布局与选中状态）。</p>
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
      text: String(e.text ?? e.label ?? ''),
      source: String(e.from),
      target: String(e.to),
      label: String(e.text ?? e.label ?? ''),
      style: { endArrow: true },
      data: e.data ?? {},
    })),
  }
}

/**
 * 节点详情懒加载：后端拉取实体属性，返回给组件详情面板。
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
 * 读取后台已存布局设置（按知识库持久化）。
 */
async function loadGraphLayoutSettings() {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId) return null
  const r = await apiService.fetchGraphLayoutSettings(kbId)
  if (!r?.settings) return null
  try {
    return JSON.parse(r.settings)
  } catch {
    return null
  }
}

/**
 * 保存布局设置到后台（按知识库持久化）。
 */
async function saveGraphLayoutSettings(settings: any) {
  const kbId = store.activeKnowledgeBaseId
  if (!kbId) return
  await apiService.saveGraphLayoutSettings(kbId, JSON.stringify(settings))
}

/**
 * 图谱渲染就绪回调。
 *
 * <p>G6 首次装载若发生在容器尺寸确定之前，会把所有节点留在 (0,0)，
 * 表现为整图缩放到一个点（放大 6 倍只看到一个大圆）。此时容器尺寸已确定，
 * 这里主动重跑一次同名布局让节点真正散开，随后由组件 autoFit 重新适配视口。</p>
 */
function handleGraphReady() {
  nextTick(() => {
    window.setTimeout(async () => {
      if (!graphCompRef.value?.setLayout) {
        return
      }
      try {
        await graphCompRef.value.setLayout(GRAPH_LAYOUT)
      } catch {
        // 布局失败不阻断：至少保留组件自身的首帧适配
      }
      // 力导是异步迭代：布局中途触发 fitView，可能正好落在「节点还没散开」的一瞬，
      // 把视口缩放到极近（整图只剩一两个大圆）。等迭代收敛后再适配一次视口。
      window.setTimeout(() => {
        const api = graphCompRef.value as { fitView?: () => Promise<void> } | null
        void api?.fitView?.()
      }, 700)
    }, 120)
  })
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

// 获取 RAG 状态
const fetchRagStatus = async () => {
  try {
    ragStatus.value = await api.get('/rag/status')
  } catch (error) {
    console.error('获取 RAG 状态失败:', error)
    // 拉取失败视为未就绪，页面走提示分支
    ragStatus.value = { available: false, message: t('knowledge.ragGate.fetchFailed') }
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

/**
 * 过滤后的知识库列表（支持搜索）
 */
const filteredKnowledgeBases = computed(() => {
  if (!searchKeyword.value || !searchKeyword.value.trim()) {
    return store.knowledgeBases
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return store.knowledgeBases.filter(kb =>
    kb.name?.toLowerCase().includes(keyword) ||
    kb.description?.toLowerCase().includes(keyword)
  )
})

// ========== Methods ==========

/**
 * 选择知识库并加载文件列表
 */
async function handleSelectKB(kb: KnowledgeBase) {
  store.setActiveKnowledgeBase(kb.id)
  viewMode.value = 'detail'

  // 更新路由（使用 params）
  router.replace({ name: 'KnowledgeBase', params: { id: kb.id } })

  try {
    // 选择新知识库时重置分页
    await refreshFileList()
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
async function handleRetryFile(file: KBFile) {
  try {
    const confirmed = await confirm(
      t('knowledge.page.retryFileTitle'),
      t('knowledge.page.retryFileConfirm', { name: file.displayName }),
      { type: 'warning' }
    )

    if (!confirmed) return

    if (!store.activeKnowledgeBaseId) return

    // 调用后端 API 重新处理文件
    await apiService.retryKBFile(store.activeKnowledgeBaseId, file.id)

    toast.success(t('knowledge.page.retryStarted'))

    // 关键修复：通过 KBFileTree 更新文件状态
    if (fileTreeRef.value && fileTreeRef.value.updateFileStatus) {
      fileTreeRef.value.updateFileStatus(file.id, {
        processingStatus: 'pending',
        progressPercentage: 0,
        currentStep: t('knowledge.page.waitRetry'),
        errorMessage: null
      })
      console.log(`[DEBUG] 文件状态已更新为 pending: ${file.displayName}`)
    }

    // 关键修复：重新处理后需要手动启动轮询
    // 因为 updateFileStatus 不会自动触发 startFileProcessingPolling
    if (fileTreeRef.value && fileTreeRef.value.startFileProcessingPolling) {
      console.log('[DEBUG] 重新处理后，手动启动轮询')
      await fileTreeRef.value.startFileProcessingPolling()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('重新处理失败:', error)
      toast.error(error.response?.data?.detail || error.message || t('knowledge.page.retryFailed'))
    }
  }
}

/**
 * 查看文件详情
 */
function handleViewFile(file: KBFile) {
  // 点文件 = 看原文。分块详情另有入口（FileChunksViewer），不再占用「查看」这个动作
  openFilePreview(file)
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
  try {
    overview.value = (await apiService.fetchKBOverview()) || {}
  } catch (e) {
    // 统计失败不该让列表空掉，退化成 0 展示
    overview.value = {}
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
 *   <li>{@code parsing}：queued/uploading/uploaded/pending/processing，正在处理</li>
 *   <li>{@code failed}：failed</li>
 *   <li>{@code all}：不分组</li>
 * </ul>
 */
const FILE_STATUS_GROUPS: Record<string, string[]> = {
  indexed: ['completed'],
  parsing: ['queued', 'uploading', 'uploaded', 'pending', 'processing'],
  failed: ['failed'],
}

/** 文件状态分栏键：全部 / 已索引 / 解析中 / 失败 */
type FileStatusFilter = 'all' | 'indexed' | 'parsing' | 'failed'

/** 当前选中的分栏 */
const fileStatusFilter = ref<FileStatusFilter>('all')

/** 当前目录下的文件（来自 KBFileTree 的 files-loaded） */
const loadedFiles = ref<KBFile[]>([])

/** 只统计真实文件，目录不进分栏计数 */
const filesForFilter = computed(() => loadedFiles.value.filter((f) => !f.isDirectory))

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
    { key: 'parsing', label: '解析中', count: countOf('parsing') },
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

// ========== Lifecycle ==========
// 切到「关系图谱」页签时才拉图（懒加载，避免拖慢知识库首屏）；
// 实体 / 关系视图从菜单直开时也要有数据 —— 此前只有 graph 页签会拉，直开会是空表
watch(activeTab, (tab) => {
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
  graphKeyword.value = ''
  graphEntityKeyword.value = ''
  graphRelationKeyword.value = ''
  entityPage.value = 1
  relationPage.value = 1
  selectedEntityUids.value = []
  selectedRelationUids.value = []
  if (activeTab.value === 'graph' || activeTab.value === 'entities' || activeTab.value === 'relations') {
    void loadGraph()
  } else {
    void refreshGraphCount()
  }
})

onMounted(async () => {
  // 显示偏好与首屏数据无关，并行拉取即可（内部幂等 + 去重）
  void initKbDisplay()
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
      // refreshFileList 已在 handleSelectKB 中调用,无需重复
    } else {
      // 如果 ID 无效,显示列表视图
      viewMode.value = 'list'
    }
  } else {
    // 默认显示列表视图
    viewMode.value = 'list'
  }

  // 关键优化:检查是否有上传任务，按需启动轮询
  checkAndStartUploadTaskPolling()
})

// 关键修复:组件销毁时清理定时器,防止内存泄漏
onUnmounted(() => {
  console.log('[DEBUG] KnowledgeBasePage 组件销毁,清理定时器')
  // 注意：文件轮询已由 KBFileTree 内部管理，无需在此清理
  stopUploadTaskPolling() // 停止上传任务轮询
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

// 监听路由变化，处理 URL 中的 id 参数
watch(() => route.params.id, async (newKbId: string | string[] | undefined) => {
  // 如果是数组，取第一个值；如果是字符串直接使用；否则为 undefined
  const kbId = Array.isArray(newKbId) ? newKbId[0] : newKbId

  if (kbId && store.knowledgeBases.length > 0) {
    const kb = store.knowledgeBases.find(k => k.id === kbId)
    if (kb && store.activeKnowledgeBaseId !== kb.id) {
      await handleSelectKB(kb)
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
