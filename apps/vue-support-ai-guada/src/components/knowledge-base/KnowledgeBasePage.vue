<template>
  <div class="h-full w-full flex flex-col min-h-0">
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
            {{ ragStatus?.message || t('knowledge.ragGate.desc') }}
          </p>
          <el-button type="primary" round @click="goToConfig(ragStatus?.configPath)">
            {{ t('knowledge.ragGate.goConfig') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 视图模式：从模板创建（独立页，占满内容区） -->
    <div v-else-if="showTplGallery" class="flex-1 flex flex-col overflow-hidden px-4">
      <KBTemplateGallery @cancel="showTplGallery = false" @create="handleTemplateCreate" />
    </div>

    <!-- 知识库总览（按设计稿 HTML 还原；左侧导航与顶栏由系统 layout 提供，不重复实现） -->
    <KnowledgeOverview
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

    <!-- 旧列表视图：已被上面的总览整体取代，分支保留但条件不再命中，待清理 -->
    <div v-else-if="viewMode === 'list-legacy'" class="flex-1 flex flex-col overflow-hidden">
      <!-- 标题区（固定不滚动）：左标题+副标题，中搜索，右新建 -->
      <div class="shrink-0 kb-top w-full">
        <div class="kb-top__title">
          <h1>{{ t('knowledge.page.title') }}</h1>
          <p class="kb-top__subtitle">
            共 {{ fmtCount(overview.totals?.kb_count) }} 个知识库 ·
            {{ fmtCount(overview.totals?.file_count) }} 篇文档
          </p>
        </div>
        <el-input
          v-model="searchKeyword"
          :placeholder="t('knowledge.page.searchPlaceholder')"
          clearable
          class="kb-top__search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" class="kb-top__create" @click="handleOpenCreate">
          <template #icon><Plus /></template>
          {{ t('knowledge.page.createKb') }}
        </el-button>
      </div>

      <!-- 内容区（独立滚动） -->
      <div class="flex-1 overflow-auto pb-4" style="scrollbar-gutter: stable both-edges;">
        <div class="py-3 px-4 w-full">
          <!-- 顶部统计卡：知识库 / 文档总量 / 实体节点 / 关系连线 -->
          <div class="kb-stats">
            <div v-for="s in overviewStats" :key="s.key" class="kb-stat re-surface re-surface--dense">
              <div class="kb-stat__icon">
                <el-icon :size="24"><component :is="s.icon" /></el-icon>
              </div>
              <div class="kb-stat__body">
                <b class="kb-stat__value">{{ s.value }}</b>
                <span class="kb-stat__label">{{ s.label }}</span>
              </div>
            </div>
          </div>

          <div class="kb-home">
            <!-- 左：知识库网格（首个库为大卡） -->
            <div class="kb-home__main">
              <div class="kb-home__head">
                <h2>{{ t('knowledge.page.title') }}</h2>
                <el-button class="kb-viewtoggle" type="primary" plain>
                  <template #icon><Grid /></template>
                  列表视图
                </el-button>
              </div>

              <div v-if="filteredKnowledgeBases.length > 0" class="kb-grid-cards">
                <!-- 首个库用宽卡（大卡）：顶部图案带 + 标题 + 描述 + 计数徽标 -->
                <article
                  v-for="(kb, idx) in filteredKnowledgeBases"
                  :key="kb.id"
                  class="kb-card re-surface kb-home__card"
                  :class="{ 'is-featured': idx === 0 }"
                  @click="handleSelectKB(kb)"
                >
                  <!-- 大卡：顶部装饰带；小卡：居中文档图标 + 就绪角标 -->
                  <div v-if="idx === 0" class="kb-card__banner">
                    <img v-if="kb.cover" class="kb-card__banner-img" :src="kb.cover" :alt="kb.name" />
                    <div v-else class="kb-card__banner-ph">
                      <span class="kb-card__banner-initials">{{ initialsOf(kb.name) }}</span>
                      <span class="kb-card__banner-hint">暂无封面</span>
                    </div>
                  </div>
                  <div v-else class="kb-card__icon-wrap">
                    <el-icon class="kb-card__icon" :size="46"><Document /></el-icon>
                    <i class="kb-card__check" />
                  </div>

                  <div class="kb-card__body">
                    <h3 class="kb-card__title truncate">{{ kb.name }}</h3>

                    <p class="kb-card__desc line-clamp-2">
                      {{ kb.description || t('knowledge.page.noDescription') }}
                    </p>

                    <!-- 小卡的次要信息行：更新时间 / 归属，用真实字段，不编造 -->
                    <div v-if="idx !== 0" class="kb-card__meta">
                      <span class="kb-card__meta-item">
                        <el-icon><Clock /></el-icon>{{ fmtTime(kb.updateTime || kb.createTime) }}
                      </span>
                      <span class="kb-card__meta-item">
                        <el-icon><Calendar /></el-icon>{{ fmtTime(kb.createTime) }}
                      </span>
                    </div>

                    <!-- 计数徽标：实体 / 关系 / 文档 / 就绪（来自 /bases/overview，不是前端猜的） -->
                    <div class="kb-card__metrics">
                      <span class="kb-metric">
                        <i class="kb-metric__dot" />{{ countOf(kb.id, 'entity_count') }} 实体
                      </span>
                      <span class="kb-metric">{{ countOf(kb.id, 'relation_count') }} 关系</span>
                      <span v-if="idx === 0" class="kb-metric">
                        {{ countOf(kb.id, 'file_count') }} 篇文档
                      </span>
                      <span class="kb-card__spacer" />
                      <span class="kb-metric kb-metric--ok">
                        <i class="kb-metric__dot" />{{ isKbReady(kb) ? '已就绪' : '待索引' }}
                      </span>
                    </div>

                    <!-- 操作：常态隐藏，hover / focus 显现，避免卡片视觉噪音 -->
                    <div class="kb-card__actions">
                      <template v-if="isOwnerKb(kb)">
                        <el-button link @click.stop="handleEdit(kb)">{{ t('common.edit') }}</el-button>
                        <el-button link type="danger" @click.stop="handleDelete(kb)">{{ t('common.delete') }}</el-button>
                      </template>
                      <el-button link type="primary" @click.stop="handleSelectKB(kb)">{{ t('knowledge.page.enter') }}</el-button>
                    </div>
                  </div>
                </article>
              </div>

              <!-- 空状态 -->
              <div v-else-if="!store.loading" class="re-surface kb-empty">
                <!-- 搜索无结果：保持轻量提示，不铺引导 -->
                <template v-if="searchKeyword">
                  <el-icon size="44" class="kb-empty__icon"><Search /></el-icon>
                  <p class="kb-empty__title">{{ t('knowledge.page.notFound') }}</p>
                  <p class="kb-empty__hint">{{ t('knowledge.page.notFoundHint') }}</p>
                </template>

                <!-- 一个知识库都没有：按设计图给完整创建引导 -->
                <template v-else>
                  <div class="kb-empty__top">
                    <h2 class="kb-empty__lead">开始创建你的第一个知识库</h2>
                    <a class="kb-empty__help" href="javascript:void(0)" @click="handleOpenCreate">查看帮助文档</a>
                  </div>

                  <div class="kb-empty__figure">
                    <img class="kb-empty__illus" :src="heroIllustration" alt="书本与知识节点" />
                  </div>

                  <h3 class="kb-empty__title">还没有知识库</h3>
                  <p class="kb-empty__hint">上传文档即可自动提取知识点，生成实体与关系网络</p>

                  <div class="kb-empty__cta">
                    <button type="button" class="kb-empty__cta-btn kb-empty__cta-btn--primary" @click="handleOpenCreate">
                      <el-icon :size="26"><UploadFilled /></el-icon>
                      <span class="kb-empty__cta-text">
                        <b>空白创建</b>
                        <i>从上传文档开始</i>
                      </span>
                    </button>
                    <button type="button" class="kb-empty__cta-btn kb-empty__cta-btn--ghost" @click="showTplGallery = true">
                      <el-icon :size="26"><Files /></el-icon>
                      <span class="kb-empty__cta-text">
                        <b>从模板创建</b>
                        <i>套用预置结构</i>
                      </span>
                    </button>
                  </div>

                  <div class="kb-empty__tpl-head">
                    <span>教育场景模板</span>
                    <a class="kb-empty__help" href="javascript:void(0)" @click="handleOpenCreate">全部模板</a>
                  </div>

                  <div class="kb-empty__tpl-grid">
                    <article v-for="tpl in kbTemplates" :key="tpl.key" class="kb-tpl">
                      <div class="kb-tpl__cover" :class="'kb-tpl__cover--' + tpl.key">
                        <img
                          v-if="templateCovers[tpl.key]"
                          class="kb-tpl__cover-img"
                          :src="templateCovers[tpl.key]"
                          :alt="tpl.name"
                        />
                        <span v-else class="kb-tpl__cover-text">{{ tpl.name }}</span>
                      </div>
                      <div class="kb-tpl__body">
                        <h4 class="kb-tpl__name truncate">{{ tpl.name }}</h4>
                        <div class="kb-tpl__meta">
                          <span class="kb-tpl__tag">{{ tpl.tag }}</span>
                          <el-button size="small" class="kb-tpl__use" @click="handleOpenCreate">使用模板</el-button>
                        </div>
                      </div>
                    </article>
                  </div>
                </template>
              </div>
            </div>

            <!-- 右：最近活动 -->
            <aside class="kb-home__side">
              <div class="kb-activity re-surface">
                <h2 class="kb-activity__head">最近活动</h2>
                <el-empty v-if="activities.length === 0" :image-size="56"
                  description="暂无活动，进入知识库上传文档或生成图谱后会出现在这里" />
                <ul v-else class="kb-activity__list">
                  <li v-for="a in activities" :key="a.key" class="kb-activity__item">
                    <i class="kb-activity__dot" />
                    <div class="kb-activity__text">
                      <div class="kb-activity__title truncate">{{ a.title }}</div>
                      <div class="kb-activity__meta">{{ a.desc }} · {{ a.time }}</div>
                    </div>
                  </li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>

    <!-- 视图模式：知识库详情 -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <!-- 顶部导航栏 -->
      <div class="sticky top-0 z-10 flex flex-col w-full">
        <div class="px-2 py-3 flex items-center gap-3 w-full">
          <el-button link @click="backToList"
            class="flex items-center gap-1 kb-back font-medium">
            <el-icon :size="22">
              <ArrowLeft24Filled />
            </el-icon>
            <span class="text-base">{{ t('knowledge.page.backToList') }}</span>
          </el-button>
          <el-divider direction="vertical" />
          <span class="font-semibold kb-detail__name text-base">{{ currentKB?.name }}</span>
        </div>
        <!-- Tab 切换区域 -->
        <div class="px-4 pt-1 pb-2">
          <el-tabs v-model="activeTab" class="kb-tabs">
            <el-tab-pane label="文件列表" name="files">
              <template #label>
                <div class="flex items-center gap-2">
                  <el-icon :size="17">
                    <BookOpen24Regular />
                  </el-icon>
                  <span class="text-[15px]">{{ t('knowledge.page.tabFiles') }}</span>
                </div>
              </template>
            </el-tab-pane>
            <el-tab-pane label="搜索" name="search">
              <template #label>
                <div class="flex items-center gap-2">
                  <el-icon :size="17">
                    <Search24Regular />
                  </el-icon>
                  <span class="text-[15px]">{{ t('knowledge.page.tabSearch') }}</span>
                </div>
              </template>
            </el-tab-pane>
            <el-tab-pane label="关系图谱" name="graph">
              <template #label>
                <div class="flex items-center gap-2">
                  <el-icon :size="17">
                    <Share24Regular />
                  </el-icon>
                  <span class="text-[15px]">关系图谱</span>
                  <el-badge v-if="graphCount > 0" :value="graphCount" :max="99" type="primary" class="kb-graph-badge" />
                </div>
              </template>
            </el-tab-pane>
          </el-tabs>

        </div>
      </div>
      <div class="flex-1 overflow-auto min-h-0" @scroll="handleScroll">
        <div class="w-full kb-detail__body">
          <!-- 文件列表 Tab：左「文档」+ 右「智能问答」双栏 -->
          <KBMenu
            :kb-name="currentKB?.name"
            :active="activeTab"
            @select="handleMenuSelect"
            @action="handleMenuAction"
            @back="backToList"
          />

          <div v-show="activeTab === 'overview'" class="flex-1 flex flex-col min-h-0">
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
            <div class="kb-overview__hint re-surface">
              这里的统计来自当前知识库的索引与图谱抽取结果；上传文档或重新生成图谱后会同步更新。
            </div>
          </div>

          <div v-show="activeTab === 'files'" class="flex-1 flex flex-col min-h-0">
            <div class="kb-split">
              <!-- 左栏：文档 -->
              <section class="kb-split__docs">
                <div class="kb-split__head">
                  <div class="kb-split__title">
                    <h2>文档</h2>
                    <span class="kb-split__sub">{{ currentKB?.name }}</span>
                    <el-tag effect="plain">{{ filesForFilter.length }} 篇</el-tag>
                  </div>
                  <!-- 上传入口（仅 owner；他人公开库只读） -->
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
                    {{ f.label }} {{ f.count }}
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
                />
              </section>
            </div>
          </div>

          <!-- 搜索 Tab -->
          <div v-show="activeTab === 'search'" class="flex flex-1 overflow-hidden min-h-0 w-full">
            <KBSearchPanel :knowledge-bases="store.knowledgeBases" :default-kb-id="store.activeKnowledgeBaseId" />
          </div>

          <!-- 关系图谱 Tab：节点/连线由后端 /v2/rag/graph 提供，结构对齐 ReGraphData -->
          <div v-show="activeTab === 'ask'" class="flex flex-1 flex-col min-h-0 w-full">
            <section class="kb-split__ask kb-ask-standalone">
              <KBAskPanel
                :kb-id="currentKB?.id || ''"
                :kb-name="currentKB?.name"
                :graph-nodes="graphNodes"
                :graph-edges="graphEdges"
              />
            </section>
          </div>

          <div v-show="activeTab === 'graph'" class="flex flex-col flex-1 min-h-0 w-full">
            <div class="flex items-center gap-3 px-4 py-2 shrink-0">
              <span class="text-sm kb-graph__count">
                实体 {{ graphView.entityCount }} · 关系 {{ graphView.relationCount }}
              </span>
              <el-input v-model="graphKeyword"  placeholder="按实体名过滤" clearable style="width: 200px" />
              <el-button  :loading="graphLoading" @click="loadGraph">刷新</el-button>
              <!-- 占位图时主推「生成」，有数据时也允许重新抽取（原文改了关系可用） -->
              <el-button v-if="ragReady"  type="primary" plain :loading="graphGenerating"
                @click="handleGenerateGraph">
                {{ graphView.placeholder ? '生成图谱' : '重新生成' }}
              </el-button>
              <span v-if="graphError" class="text-sm text-red-500">{{ graphError }}</span>
              <span v-else-if="!graphLoading && graphView.nodes.length === 0" class="text-sm kb-graph__hint">
                <template v-if="graphView.placeholder">
                  暂无图谱数据（尚未抽取过关系）。点「生成图谱」让 AI 从现有知识点里抽一遍。
                </template>
                <template v-else>
                  当前范围确实没有关系。可点「重新生成」按最新原文再抽一次。
                </template>
              </span>
            </div>
            <div v-if="graphView.nodes.length > 0" class="px-4 pb-1 shrink-0 text-xs kb-graph__hint">
              节点大小按关系条数缩放（{{ NODE_MIN_SIZE }}–{{ NODE_MAX_SIZE }}px，每条关系 +{{ NODE_SIZE_STEP }}px），点击节点可看关系数
            </div>
            <div v-if="graphView.nodes.length > 0" class="flex items-center gap-2 px-4 pb-2 shrink-0">
              <el-button size="small" @click="openGraphManager('entity')">管理实体</el-button>
              <el-button size="small" @click="openGraphManager('relation')">管理关系</el-button>
              <span class="text-xs kb-graph__hint">
                手工补录的内容独立于知识点，删除知识点不会连带删掉
              </span>
            </div>
            <div class="flex-1 min-h-0 flex gap-2 m-2">
              <div v-loading="graphLoading" class="flex-1 min-h-0 rounded-lg kb-graph__canvas kb-graph__stage">
                <ReGraphRelation v-if="graphNodes.length > 0" :nodes="graphNodes" :edges="graphEdges" height="100%"
                  @node-click="handleGraphNodeClick" />

                <!-- 图例：按当前图谱里实际出现的实体类型生成，不写死 -->
                <div v-if="graphLegend.length > 0" class="kb-graph__legend">
                  <span v-for="l in graphLegend" :key="l" class="kb-graph__legend-item">
                    <i class="kb-graph__legend-dot" />{{ l }}
                  </span>
                </div>
              </div>

              <!-- 右：实体详情（对应参考图右栏；点击节点出现） -->
              <aside v-if="selectedGraphNode" class="kb-gedetail re-surface">
                <div class="kb-gedetail__head">
                  <h3 class="kb-gedetail__name truncate">{{ selectedGraphNode.name }}</h3>
                  <el-button link class="kb-gedetail__close" @click="selectedGraphNode = null">
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
                <div class="kb-gedetail__sub">
                  实体 ID:{{ selectedGraphNode.id }}
                  <template v-if="selectedGraphNode.type"> · {{ selectedGraphNode.type }}</template>
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
                  <el-button size="small" type="primary" plain @click="openGraphManager('entity')">
                    编辑实体
                  </el-button>
                  <el-button size="small" @click="openGraphManager('relation')">
                    查看来源文档
                  </el-button>
                </div>
              </aside>
            </div>

            <!-- 实体/关系管理：列表 + 多选 + 增删改 -->
            <LDialog v-model="showGraphManager" :title="graphManagerTab === 'entity' ? '管理实体' : '管理关系'"
              width="760px" append-to-body class="kb-dialog">
              <div class="flex flex-col gap-3">
                <el-tabs v-model="graphManagerTab">
                  <el-tab-pane label="实体" name="entity" />
                  <el-tab-pane label="关系" name="relation" />
                </el-tabs>

                <!-- 实体列表 -->
                <template v-if="graphManagerTab === 'entity'">
                  <div class="flex items-center gap-2">
                    <el-input v-model="graphEntityKeyword" placeholder="按名称过滤" clearable class="kb-grow" />
                    <el-button type="primary" plain @click="openEntityForm()">新增实体</el-button>
                    <el-button type="danger" plain :disabled="selectedEntityUids.length === 0"
                      @click="handleBatchDeleteEntities">
                      批量删除{{ selectedEntityUids.length ? `(${selectedEntityUids.length})` : '' }}
                    </el-button>
                  </div>
                  <el-table :data="filteredGraphEntities" size="small" height="360" @selection-change="onEntitySelection">
                    <el-table-column type="selection" width="42" />
                    <el-table-column prop="text" label="名称" min-width="140" />
                    <el-table-column label="类型" width="110">
                      <template #default="{ row }">
                        <el-tag size="small" :type="entityTagType(row.type)">{{ entityTypeLabel(row.type) }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="degree" label="关系数" width="80" align="right" />
                    <el-table-column label="操作" width="130" align="right">
                      <template #default="{ row }">
                        <el-button link type="primary" size="small" @click="openEntityForm(row)">编辑</el-button>
                        <el-button link type="danger" size="small" @click="handleDeleteEntity(row)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </template>

                <!-- 关系列表 -->
                <template v-else>
                  <div class="flex items-center gap-2">
                    <el-input v-model="graphRelationKeyword" placeholder="按实体名/关系类型过滤" clearable class="kb-grow" />
                    <el-button type="primary" plain @click="openRelationForm()">新增关系</el-button>
                    <el-button type="danger" plain :disabled="selectedRelationUids.length === 0"
                      @click="handleBatchDeleteRelations">
                      批量删除{{ selectedRelationUids.length ? `(${selectedRelationUids.length})` : '' }}
                    </el-button>
                  </div>
                  <el-table :data="filteredGraphRelations" size="small" height="360"
                    @selection-change="onRelationSelection">
                    <el-table-column type="selection" width="42" />
                    <el-table-column label="源" min-width="120">
                      <template #default="{ row }">{{ nodeNameById(row.from) }}</template>
                    </el-table-column>
                    <el-table-column prop="text" label="关系" width="120" />
                    <el-table-column label="目标" min-width="120">
                      <template #default="{ row }">{{ nodeNameById(row.to) }}</template>
                    </el-table-column>
                    <el-table-column label="操作" width="80" align="right">
                      <template #default="{ row }">
                        <el-button link type="danger" size="small" @click="handleDeleteRelation(row)">删除</el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                </template>
              </div>
            </LDialog>

            <!-- 新增/编辑实体表单 -->
            <LDialog v-model="showEntityForm" :title="entityForm.id ? '编辑实体' : '新增实体'" width="460px"
              append-to-body class="kb-dialog">
              <div class="kb-form">
                <div class="kb-field">
                  <label class="kb-label">名称<i class="kb-req">*</i></label>
                  <el-input v-model="entityForm.name" maxlength="128" />
                </div>
                <div class="kb-field">
                  <label class="kb-label">类型</label>
                  <el-select v-model="entityForm.type" class="kb-grow">
                    <el-option v-for="t in ENTITY_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
                  </el-select>
                </div>
                <div class="kb-field">
                  <label class="kb-label">说明</label>
                  <el-input v-model="entityForm.description" type="textarea" :rows="3" maxlength="500" show-word-limit />
                </div>
              </div>
              <template #footer>
                <el-button @click="showEntityForm = false">取消</el-button>
                <el-button type="primary" :loading="entityFormSaving" @click="handleSaveEntity">保存</el-button>
              </template>
            </LDialog>

            <!-- 新增关系表单 -->
            <LDialog v-model="showRelationForm" title="新增关系" width="460px" append-to-body class="kb-dialog">
              <div class="kb-form">
                <div class="kb-field">
                  <label class="kb-label">源实体<i class="kb-req">*</i></label>
                  <el-select v-model="relationForm.source" filterable allow-create default-first-option
                    placeholder="输入或选择已有实体名" class="kb-grow">
                    <el-option v-for="n in graphView.nodes" :key="n.id" :label="n.text" :value="n.text" />
                  </el-select>
                </div>
                <div class="kb-field">
                  <label class="kb-label">关系类型<i class="kb-req">*</i></label>
                  <el-input v-model="relationForm.type" placeholder="如 镇守 / 结义 / 放走" maxlength="32" />
                </div>
                <div class="kb-field">
                  <label class="kb-label">目标实体<i class="kb-req">*</i></label>
                  <el-select v-model="relationForm.target" filterable allow-create default-first-option
                    placeholder="输入或选择已有实体名" class="kb-grow">
                    <el-option v-for="n in graphView.nodes" :key="n.id" :label="n.text" :value="n.text" />
                  </el-select>
                </div>
                <div class="kb-hint">
                  源/目标填了库里没有的名字时，会自动建一个「其它」类型的占位实体；源与目标相同会被拒绝。
                </div>
              </div>
              <template #footer>
                <el-button @click="showRelationForm = false">取消</el-button>
                <el-button type="primary" :loading="relationFormSaving" @click="handleSaveRelation">保存</el-button>
              </template>
            </LDialog>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- 创建/编辑知识库对话框 -->
  <LDialog v-model="showKbDialog" :title="dialogMode === 'create' ? t('knowledge.page.createTitle') : t('knowledge.page.editTitle')" width="620px" :close-on-click-modal="false" append-to-body class="kb-dialog">
    <div class="kb-form">
      <!-- 基本信息 -->
      <section class="kb-sec">
        <div class="kb-field">
          <label class="kb-label">{{ t('knowledge.page.kbName') }}<i class="kb-req">*</i></label>
          <el-input v-model="dialogForm.name" :placeholder="t('knowledge.page.kbNamePlaceholder')" maxlength="255" show-word-limit />
        </div>
        <div class="kb-field">
          <label class="kb-label">{{ t('common.description') }}</label>
          <el-input v-model="dialogForm.description" type="textarea" :rows="3" :placeholder="t('knowledge.page.descriptionPlaceholder')"
            maxlength="2000" show-word-limit resize="none" />
        </div>
      </section>

      <!-- 网址采集：填了网址即从该站点抓取正文入库（与手动上传文件等价，可被语义检索） -->
      <section class="kb-sec">
        <div class="kb-sec__title">网址采集</div>
        <div class="kb-field">
          <label class="kb-label">网址</label>
          <el-input v-model="dialogForm.sourceUrl" placeholder="https://example.com/  留空表示不启用" clearable />
        </div>
        <div class="kb-field">
          <label class="kb-label">同域采集页数</label>
          <el-input-number v-model="dialogForm.sourceMaxPages" :min="1" :max="50" :step="1" controls-position="right"
            class="kb-num" />
        </div>
        <div v-if="dialogForm.sourceUrl" class="kb-hint">
          创建时会立即抓取该网址：1 表示只抓入口页，大于 1 会沿同域链接继续展开；
          只允许 http/https 的公网地址，内网与云元数据地址会被拒绝。
        </div>
      </section>

      <!-- 检索模型 -->
      <section class="kb-sec">
        <div class="kb-field">
          <label class="kb-label">{{ t('knowledge.page.embeddingModel') }}<i class="kb-req">*</i></label>
          <el-select v-model="dialogForm.embeddingModelId" :placeholder="t('knowledge.page.embeddingModelPlaceholder')" class="kb-select" filterable>
            <template v-for="provider in embeddingProviders" :key="provider.id">
              <el-option-group :label="provider.name">
                <el-option v-for="model in provider.models" :key="model.id" :label="model.modelName" :value="model.id" />
              </el-option-group>
            </template>
          </el-select>
        </div>
      </section>

      <!-- 分块配置 -->
      <section class="kb-sec">
        <div class="kb-sec__title">{{ t('knowledge.page.chunkSection') }}</div>
        <div class="kb-grid">
          <div class="kb-field">
            <label class="kb-label">{{ t('knowledge.page.chunkMaxSize') }}</label>
            <el-input-number v-model="dialogForm.chunkMaxSize" :min="100" :max="5000" :step="100" controls-position="right" class="kb-num" />
          </div>
          <div class="kb-field">
            <label class="kb-label">{{ t('knowledge.page.chunkOverlapSize') }}</label>
            <el-input-number v-model="dialogForm.chunkOverlapSize" :min="0" :max="500" :step="10" controls-position="right" class="kb-num" />
          </div>
          <div class="kb-field">
            <label class="kb-label">{{ t('knowledge.page.chunkMinSize') }}</label>
            <el-input-number v-model="dialogForm.chunkMinSize" :min="10" :max="500" :step="10" controls-position="right" class="kb-num" />
          </div>
        </div>
      </section>

      <!-- 可见性 -->
      <section class="kb-visibility" :class="{ 'is-public': dialogForm.isPublic }" @click="dialogForm.isPublic = !dialogForm.isPublic">
        <span class="kb-visibility__icon">
          <Globe24Regular v-if="dialogForm.isPublic" />
          <LockClosed24Regular v-else />
        </span>
        <span class="kb-visibility__text">
          <span class="kb-visibility__title">{{ t('knowledge.page.visibility') }}</span>
          <span class="kb-visibility__hint">{{ t('knowledge.page.visibilityHint') }}</span>
        </span>
        <el-switch v-model="dialogForm.isPublic" @click.stop />
      </section>
    </div>

    <template #footer>
      <div class="kb-footer">
        <el-button @click="showKbDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleKbSave" :loading="store.loading">
          {{ dialogMode === 'create' ? t('common.create') : t('common.save') }}
        </el-button>
      </div>
    </template>
  </LDialog>

  <!-- 文件分块查看弹窗 -->
  <FileChunksViewer v-model="showFileChunksModal" :selected-file="selectedFile" />

  <!-- 知识点原文预览：Markdown 渲染，非 Markdown 走纯文本 -->
  <KBFilePreview v-model="previewVisible" :kb-id="currentKB?.id || ''" :path="previewPath" />

  <!-- 上传任务弹窗 -->
  <UploadTaskModal v-model="showUploadTaskModal" :upload-tasks="uploadTasksList" @retry="handleRetryFile"
    @delete="handleDeleteFile" />
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus, Search, FolderOpened, Document, Share, Connection,
  Grid, Clock, Files, Close, UploadFilled, Calendar,
} from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useKnowledgeBaseStore } from '@/stores/knowledgeBase'
import { useAuthStore } from '@/stores/auth'
import { useFileUploadStore } from '@/stores/fileUpload'
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
// 关系图谱使用 X6 内核的 ReGraphRelation（@repo/ui 已提供），异步加载避免拖慢知识库首屏
const ReGraphRelation = defineAsyncComponent(() =>
  import('@repo/ui/re-graph-relation').then((m) => m.default),
)
import { useStorage, useDebounceFn } from '@vueuse/core'
import { usePopup } from '@/composables/usePopup'
import { BookOpen24Regular, Search24Regular, Share24Regular, ArrowLeft24Filled, Globe24Regular, LockClosed24Regular } from '@vicons/fluent'
import { MenuBookOutlined } from '@vicons/material'
import PageHeader from '@/components/PageHeader.vue'
import { apiService } from '@/services/ApiService'
import { api } from '@/framework/context'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import LDialog from '@/components/ui/LDialog.vue'

// 初始化组合式函数
const { confirm, toast } = usePopup()
const { t } = useI18n()
const store = useKnowledgeBaseStore()
const authStore = useAuthStore()
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
const activeTab = ref<'overview' | 'files' | 'search' | 'graph' | 'ask'>('files')  // 当前激活的 Tab: 'files' / 'search' / 'graph'
const viewMode = ref<'list' | 'detail'>('list')  // 视图模式：列表或详情
const searchKeyword = ref('')  // 知识库搜索关键词
const embeddingModels = ref<any[]>([]) // 嵌入模型列表
const embeddingProviders = ref<any[]>([]) // 嵌入模型供应商列表

// ---- 关系图谱（Tab=graph）状态 ----
const graphLoading = ref(false)        // 图谱加载中
const graphError = ref('')             // 图谱加载错误
const graphKeyword = ref('')           // 实体名过滤关键词
const graphCount = ref(0)              // 图谱元素总数（页签徽标）
const graphView = reactive({           // 后端返回的原始图谱
  nodes: [] as any[],
  edges: [] as any[],
  entityCount: 0,
  relationCount: 0,
  // true = 该范围还没抽取过关系（占位图），false = 抽过但确实没有关系
  placeholder: true,
})

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
 * 实体类型 → 节点图标。
 *
 * <p>ReGraph 的调色板只内置了 start/llm/knowledge 这类流程节点，没有 person/location/event，
 * 组件会把未知类型回退成 default 形状。所以类型区分靠这里的图标 + 后端给的 color 承担，
 * 原始类型同时保留在 data.entityType 供点击提示使用。</p>
 */
const ENTITY_ICONS: Record<string, string> = {
  person: '人',
  location: '地',
  event: '事',
  organization: '组',
  other: '其',
}

// ---- 实体 / 关系手工维护 ----
const showGraphManager = ref(false)
const graphManagerTab = ref<'entity' | 'relation'>('entity')
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

const entityForm = reactive({ id: '', name: '', type: 'other', description: '' })
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
  { key: 'sanguo', name: '三国演义知识图谱', cover: coverSanguo, entity: 84, relation: 196 },
  { key: 'poem', name: '古诗词库', cover: coverPoem, entity: 84, relation: 196 },
  { key: 'idiom', name: '成语库', cover: coverIdiom, entity: 84, relation: 196 },
  { key: 'question', name: '题库知识库', cover: coverQuestion, entity: 84, relation: 196 },
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
  handleOpenCreate()
  dialogForm.name = p.name
  dialogForm.description = p.description
  dialogForm.isPublic = p.isPublic
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
 * <p>模板的「预置结构」当前不会落地 —— 后端没有知识库模板接口，
 * 所以这里只把模板名作为库名走既有建库流程，并在交付说明里注明，
 * 不假装预置成功。</p>
 *
 * @param name 模板名（同时作为知识库名）
 */
function handleTemplateCreate(name: string) {
  showTplGallery.value = false
  // 注意：handleOpenCreate() 无参，且模板里多处写作 @click="handleOpenCreate"
  // （Vue 会把事件对象当第一个实参），所以这里不能给它加形参，
  // 只能在它把表单重置完之后再写名字，否则 dialogForm.name 会被 MouseEvent 覆盖。
  handleOpenCreate()
  dialogForm.name = name
}

/**
 * 二级菜单的视图项切换。
 *
 * @param key 目标视图 key（overview / files / search / graph / ask）
 */
function handleMenuSelect(key: string) {
  activeTab.value = key as 'overview' | 'files' | 'search' | 'graph' | 'ask'
}

/**
 * 二级菜单的动作项：不切视图，直接调用既有能力。
 *
 * <p>实体管理 / 关系管理 复用图谱页已有的管理弹窗，避免再写一套；设置沿用知识库编辑弹窗。
 * 三者都是既成能力，这里只做入口归拢，不新增业务。</p>
 *
 * @param key 动作 key（entity / relation / settings）
 */
function handleMenuAction(key: string) {
  if (key === 'entity' || key === 'relation') {
    activeTab.value = 'graph'
    openGraphManager(key as 'entity' | 'relation')
    return
  }
  if (key === 'settings' && currentKB.value) {
    handleEdit(currentKB.value)
  }
}

function openGraphManager(tab: 'entity' | 'relation') {
  graphManagerTab.value = tab;
  selectedEntityUids.value = [];
  selectedRelationUids.value = [];
  showGraphManager.value = true;
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
      });
    } else {
      await apiService.createGraphEntity(kbId, (store.getActiveKnowledgeBase()?.name ?? ''), name, entityForm.type, entityForm.description);
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
 * 给后端节点补上尺寸、关系数与类型图标。
 * @param n 后端节点（只有 degree，没有像素尺寸）
 * @returns 符合 ReGraphNode 契约的节点
 */
function decorateGraphNode(n: any) {
  const size = nodeSizeOf(n?.degree)
  const entityType = String(n?.type ?? 'other')
  return {
    ...n,
    width: size,
    height: size,
    icon: ENTITY_ICONS[entityType] ?? '●',
    data: {
      ...(n?.data ?? {}),
      degree: Math.max(0, Number(n?.degree) || 0),
      entityType,
    },
  }
}

/** 按关键词过滤后的节点：命中实体及其直接邻居都保留，避免过滤后只剩孤点 */
const graphNodes = computed(() => {
  const kw = graphKeyword.value.trim().toLowerCase()
  if (!kw) {
    return graphView.nodes.map(decorateGraphNode)
  }
  const hit = new Set(
    graphView.nodes
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
  return graphView.nodes.filter((n) => keep.has(n.id)).map(decorateGraphNode)
})

/** 只保留两端都可见的连线，避免过滤后出现悬空边 */
const graphEdges = computed(() => {
  const ids = new Set(graphNodes.value.map((n) => n.id))
  return graphView.edges.filter((e) => ids.has(e.from) && ids.has(e.to))
})

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
  for (const n of graphView.nodes as Array<any>) {
    const t = String(n?.data?.entityType ?? '').trim()
    if (t) {
      set.add(t)
    }
  }
  return [...set].sort()
})

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
  if (clickId) {
    selectedGraphNode.value = {
      id: clickId,
      name: String(node?.text ?? clickId),
      type: node?.data?.entityType ? String(node.data.entityType) : undefined,
      degree: Number(node?.data?.degree)
        || graphEdges.value.filter((e) => e.from === clickId || e.to === clickId).length,
    }
  }
  const name = node?.text ?? ''
  // 优先用后端给的 degree；被关键词过滤时兜底按当前可见边统计
  const degree = Number(node?.data?.degree)
    || graphEdges.value.filter((e) => e.from === node?.id || e.to === node?.id).length
  const type = node?.data?.entityType
  if (name) {
    toast.info(`${name}${type ? `（${type}）` : ''}：${degree} 条关系`)
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
const ragReady = computed(() => ragStatus.value?.available === true)

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
  embeddingModelId: '',
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
 * 加载嵌入模型列表
 */
/** 判断模型是否为向量（embedding）模型：兼容顶层 modelType 与 capabilities[].task 两种口径 */
const isEmbeddingModel = (m: any) =>
  m?.modelType === 'embedding' ||
  (Array.isArray(m?.capabilities) && m.capabilities.some((c: any) => c.task === 'embedding'))

const loadEmbeddingModels = async () => {
  try {
    const response = await apiService.fetchModels()

    // 只保留 embedding 类型的模型；/api/providers 原始模型用 provider_id/model 字段，需归一化出 id/modelName
    embeddingModels.value = []
    embeddingProviders.value = (response.items || [])
      .map((provider: any) => {
        const pid = provider.provider_id || provider.id
        const models = (provider.models || [])
          .filter(isEmbeddingModel)
          .map((m: any) => {
            const mid = m.model || m.id || m.name
            return {
              id: `${pid}:${mid}`,
              modelName: m.modelName || m.alias || mid
            }
          })
        return { id: pid, name: provider.name, models }
      })
      .filter((provider: any) => provider.models.length > 0)
  } catch (error: any) {
    console.error('获取嵌入模型列表失败:', error)
  }
}

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
  dialogForm.embeddingModelId = ''
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

  if (dialogMode.value === 'create' && !dialogForm.embeddingModelId) {
    toast.warning(t('knowledge.page.selectModelWarning'))
    return
  }

  try {
    if (dialogMode.value === 'create') {
      // 创建
      const newKb = await store.createKnowledgeBase({
        name: dialogForm.name,
        description: dialogForm.description || undefined,
        embeddingModelId: dialogForm.embeddingModelId,
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
    } else {
      // 更新
      // 检测向量模型是否变更
      const currentKb = store.knowledgeBases.find(kb => kb.id === dialogForm.id)
      const modelChanged = currentKb && dialogForm.embeddingModelId && currentKb.embeddingModelId !== dialogForm.embeddingModelId

      if (modelChanged) {
        const confirmed = await confirm(
          t('knowledge.page.switchModelTitle'),
          t('knowledge.page.switchModelDesc'),
          { type: 'warning', confirmText: t('knowledge.page.switchModelConfirm'), cancelText: t('common.cancel') }
        )
        if (!confirmed) return
      }

      await store.updateKnowledgeBase(dialogForm.id, {
        name: dialogForm.name,
        description: dialogForm.description,
        embeddingModelId: dialogForm.embeddingModelId || undefined,
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
 * 编辑知识库
 */
function handleEdit(kb: KnowledgeBase) {
  Object.assign(dialogForm, {
    id: kb.id,
    name: kb.name,
    description: kb.description || '',
    embeddingModelId: kb.embeddingModelId || '',
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
 * 删除知识库
 */
async function handleDelete(kb: KnowledgeBase) {
  try {
    const deleteMessage =
      t('knowledge.page.deleteKbConfirm', { name: kb.name }) +
      `<div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--el-fill-color-light);border:1px solid var(--el-border-color-lighter);font-size:12px;line-height:1.6;color:var(--el-text-color-secondary);">${t('knowledge.page.deleteKbNote')}</div>`
    const confirmed = await confirm(
      t('knowledge.page.deleteKbTitle'),
      deleteMessage,
      { type: 'warning' }
    )

    if (!confirmed) return

    // 记录当前删除的知识库 ID 和索引
    const deletedKbId = kb.id
    const currentIndex = store.knowledgeBases.findIndex(k => k.id === deletedKbId)

    // 执行删除
    await store.deleteKnowledgeBase(kb.id)
    toast.success(t('common.deleteSuccess'))

    // 删除后处理：自动选中下一个知识库
    handleAfterDelete(deletedKbId, currentIndex)
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      toast.error(error.response?.data?.detail || t('common.deleteFailed'))
    }
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

  // 关系抽取是上传后的异步任务，稍等一会儿再刷新图谱徽标；
  // 抽取失败不影响这里（接口只返回已有数据，不会报错）。
  if (graphCount.value > 0 || activeTab.value === 'graph') {
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
 * 只刷新图谱计数（页签徽标），不拉整张图，用于上传完成后的轻量更新。
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
      t('knowledge.page.deleteKbTitle'),
      t('knowledge.page.deleteKbConfirm', { name: currentKB.value?.name || '' }),
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



// ========== Lifecycle ==========
// 切到「关系图谱」页签时才拉图（懒加载，避免拖慢知识库首屏）
watch(activeTab, (tab) => {
  if (tab === 'graph') {
    void loadGraph()
  }
})

// 切换知识库时图谱要跟着换；只更新徽标计数，图本身等切页签再拉
watch(() => store.activeKnowledgeBaseId, () => {
  graphKeyword.value = ''
  if (activeTab.value === 'graph') {
    void loadGraph()
  } else {
    void refreshGraphCount()
  }
})

onMounted(async () => {
  fetchRagStatus()
  await loadEmbeddingModels() // 加载嵌入模型列表
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

<style scoped>
/* ===== RAG 未配置拦截页 ===== */
.rag-gate {
  max-width: 460px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 36px 28px;
  /* 原值 18px → xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  /* 空状态是行内容器，去掉原 0 10px 30px -18px rgba(16,24,40,.22) 装饰投影 */
}
.rag-gate__icon {
  color: var(--el-color-warning);
}
.rag-gate__title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}
.rag-gate__desc {
  margin: 0 0 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-gray);
}

/* Tab 样式优化 */
.kb-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.kb-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.kb-tabs :deep(.el-tabs__item) {
  padding: 0 18px;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
}

/* ── 创建/编辑知识库弹窗 ── */
.kb-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.kb-sec {
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 14px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  padding: 14px 16px;
}
.kb-sec__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
}
.kb-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.kb-field:last-child { margin-bottom: 0; }
.kb-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
}
.kb-req {
  color: var(--el-color-danger);
  font-style: normal;
  margin-left: 2px;
}
.kb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.kb-grid .kb-field { margin-bottom: 0; }
.kb-select { width: 100%; }
.kb-num { width: 100%; }
.kb-num :deep(.el-input-number) { width: 100%; }
/* 字段下方的灰色说明文字（网址采集的页数含义、SSRF 提示等） */
.kb-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.kb-visibility {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  /* 原值 14px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color .2s, background .2s;
}
.kb-visibility:hover { border-color: var(--el-border-color-hover); }
.kb-visibility.is-public {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.kb-visibility__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  /* 原值 10px → lg 档（距 8/12 等距，本仓统一取 12px） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 20px;
  flex: 0 0 auto;
}
.kb-visibility.is-public .kb-visibility__icon {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.kb-visibility__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}
.kb-visibility__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.kb-visibility__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.kb-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 动效降级：系统开启「减少动态效果」时，公开/私有行的边框与底色直接到位。
   只关 .kb-visibility 自己的 transition，不写 `*` / `.kb-visibility *` 通配，
   避免把里面的 el-switch 开关轨道动画一起掐掉（那是开关状态的功能表达）。
   .is-public 的选中态是静态声明，停掉过渡后依然成立。 */
@media (prefers-reduced-motion: reduce) {
  .kb-visibility {
    transition: none;
  }
}

/* 键盘焦点可见性：知识库卡片与「可见性」行都是带 @click 的 div（不是可聚焦控件），
   浏览器不给默认焦点环。指针样式沿用模板里已有的 cursor-pointer / CSS 里的 cursor: pointer，
   不重复声明。环用主色 12% —— 两处底色都是令牌化表面色（re-surface / --el-bg-color），
   深浅主题下都只是一档主色描边，12% 足够可见。 */
.kb-card,
.kb-visibility {
  outline: none;
}

.kb-card:focus-visible,
.kb-visibility:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* ── 文件列表 Tab：左「文档」+ 右「智能问答」双栏 ──────────────────────────
   宽度比 1fr : 1fr，窄屏（< 1180px）退化为上下堆叠——问答面板是主操作，
   挤到第二行也不该被压到读不了的高度。 */
.kb-split {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 12px;
  padding: 4px 16px 16px;
}

.kb-split__docs {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-card-border-radius, 12px);
  overflow: hidden;
}

.kb-split__ask {
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

/* 面板自身已有边框，这里让容器不重复画一层 */
.kb-split__ask :deep(.kb-ask) {
  flex: 1;
  min-width: 0;
}

.kb-split__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.kb-split__title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.kb-split__title h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-split__sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kb-split__readonly {
  margin: 12px 18px 0;
  padding: 8px 12px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.kb-split__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 18px;
}

/* 分栏按钮：pill 形，未选中走填充面，选中走主色浅底 + 主色字 */
.kb-split__filter {
  padding: 7px 16px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition: background var(--el-transition-duration, 0.2s), color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}

.kb-split__filter:hover {
  background: var(--el-fill-color);
}

.kb-split__filter.is-active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
  font-weight: 500;
}

.kb-split__filter:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.kb-split__tree {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 10px 10px;
}

@media (max-width: 1180px) {
  .kb-split {
    flex-direction: column;
  }

  .kb-split__ask {
    min-height: 420px;
  }
}

/* ── 列表页：统计卡 + 卡片网格 + 最近活动 ───────────────────────────────
   颜色全部走 --el-*，暗色由 html.dark 下的 Element 变量自动切换，
   不再出现 text-gray-900 / dark:text-[#e8e9ed] 这类写死值。 */
.kb-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

/* 宽屏固定四列，对应参考图「知识库 / 文档总量 / 实体节点 / 关系连线」一排 */
@media (min-width: 1024px) {
  .kb-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.kb-stat {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 15px;
  min-height: 96px;
  padding: 20px 22px;
}

/* 右侧装饰：设计图里每张统计卡右端有一片淡色山形。
   这里用纯 CSS 拼三角，颜色取主色最浅阶，不引入位图素材。 */
.kb-stat::after {
  content: '';
  position: absolute;
  right: -6px;
  bottom: -18px;
  width: 96px;
  height: 58px;
  background:
    linear-gradient(to top right,
      transparent 49.5%, var(--el-color-primary-light-9) 50.5%),
    linear-gradient(to top left,
      transparent 49.5%, var(--el-fill-color-light) 50.5%);
  background-position: 0 0, 34px 0;
  background-size: 62px 58px, 62px 58px;
  background-repeat: no-repeat;
  pointer-events: none;
}

/* 内容压在装饰之上 */
.kb-stat__icon,
.kb-stat__value,
.kb-stat__label {
  position: relative;
  z-index: 1;
}

/* 图标按 HTML 原型是 46×46 浅底圆角方块（#e8f8fa → 主题浅阶），内 24px 线框图标 */
.kb-stat__icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 数字 26px/800 在上、标签 13.5px 在下，与 HTML 原型一致 */
.kb-stat__value {
  display: block;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-primary);
}

.kb-stat__label {
  display: block;
  font-size: 13.5px;
  color: var(--el-text-color-secondary);
}

/* 详情页「概览」里的统计块仍是「图标 + 上下堆叠的数字/标签」结构，
   与列表页的横排不同，所以单独保留这个容器样式（去掉它会导致数字与标签挤成一行） */
.kb-stat__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

/* 详情页：二级功能菜单 + 内容区并排（只做内容区，不含系统一级侧栏与顶栏） */
.kb-detail__body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

/* 旧的水平 Tab 已由二级菜单取代，样式上停用，避免两套导航同时出现 */
.kb-tabs {
  display: none;
}

.kb-overview__stats {
  margin-bottom: 12px;
}

.kb-overview__hint {
  padding: 16px 18px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* 独立的「智能问答」视图：整宽铺开，复用文档分栏里同一个面板 */
.kb-ask-standalone {
  flex: 1;
  min-width: 0;
  display: flex;
}

/* ── 页头：左标题+副标题，中搜索，右新建 ───────────────────────────────
   注意不是整页复刻参考图：左侧导航与顶部栏由系统 layout 提供，这里只做内容区。 */
.kb-top {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px 20px;
}

.kb-top__title {
  flex: 0 0 auto;
  min-width: 0;
}

.kb-top__title h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.kb-top__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.kb-top__search {
  flex: 1 1 280px;
  max-width: 560px;
  margin: 0 auto;
}

.kb-top__create {
  flex: 0 0 auto;
}

/* 详情页顶部：返回按钮 / 知识库名 / 图谱计数
   原先这三处写死了 text-gray-900 / dark:text-[#e8e9ed] / dark:text-[#9aa0a6]，
   暗色下靠手写色值硬撑；改为 koi/Element 变量，交给主题自动切换。 */
.kb-back {
  color: var(--el-text-color-primary);
}

.kb-back:hover {
  color: var(--el-color-primary);
}

.kb-detail__name {
  color: var(--el-text-color-primary);
}

.kb-graph__count {
  color: var(--el-text-color-secondary);
}

/* 图谱 Tab 的辅助说明文字与画布底：原先写死 text-gray-400 与 dark:bg-[#232428] */
.kb-graph__hint {
  color: var(--el-text-color-placeholder);
}

.kb-graph__canvas {
  background: var(--el-bg-color-overlay);
}

/* 画布容器：图例绝对定位在左下角 */
.kb-graph__stage {
  position: relative;
}

/* 图例：按实际出现的实体类型生成，颜色统一走主色，不引入图里的自定义色 */
.kb-graph__legend {
  position: absolute;
  left: 12px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 40%;
  overflow: auto;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  background: var(--el-bg-color-overlay);
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.kb-graph__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.kb-graph__legend-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

/* ── 右栏：实体详情（对应参考图右栏） ─────────────────────────────── */
.kb-gedetail {
  flex: 0 0 264px;
  width: 264px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 0 0 12px;
  overflow: auto;
}

.kb-gedetail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 14px 6px;
}

.kb-gedetail__name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-gedetail__close {
  flex: 0 0 auto;
}

.kb-gedetail__sub {
  padding: 0 14px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
}

.kb-gedetail__metrics {
  padding: 12px 14px 4px;
}

.kb-gedetail__metric {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-light);
}

.kb-gedetail__metric-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-gedetail__metric-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb-gedetail__section {
  margin: 0;
  padding: 12px 14px 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-gedetail__relations {
  margin: 0;
  padding: 0 14px;
  list-style: none;
}

.kb-gedetail__relation {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.kb-gedetail__relation:last-child {
  border-bottom: none;
}

.kb-gedetail__relation-type {
  flex: 0 0 auto;
  padding: 1px 7px;
  font-size: 12px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.kb-gedetail__relation-peer {
  min-width: 0;
  color: var(--el-text-color-regular);
}

.kb-gedetail__relation--empty {
  color: var(--el-text-color-placeholder);
}

.kb-gedetail__actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding: 12px 14px 0;
}

/* 「列表视图」：描边主色的小按钮，对应用途而非纯标签 */
.kb-viewtoggle {
  --el-button-text-color: var(--el-color-primary);
  --el-button-border-color: var(--el-color-primary-light-5);
  --el-button-hover-bg-color: var(--el-color-primary-light-9);
}

.kb-home {
  display: flex;
  /* 两栏等高：右栏「最近活动」不足时不再比左栏矮，避免参差 */
  align-items: stretch;
  gap: 12px;
}

.kb-home__main {
  flex: 1;
  min-width: 0;
}

.kb-home__side {
  flex: 0 0 300px;
  width: 300px;
}

.kb-home__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px 12px;
}

.kb-home__head h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-grid-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

/* 卡片本体不再留内边距，改由 __body 承担：
   这样大卡顶部的图案带才能左右贴边（图上大卡顶部是一条通栏装饰带）。 */
.kb-home__card {
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  transition: border-color var(--el-transition-duration, 0.2s);
}

.kb-home__card:hover {
  border-color: var(--el-color-primary-light-5);
}

/* 首个库横跨整行当「大卡」，让最有代表性的库有存在感 */
.kb-home__card.is-featured {
  grid-column: 1 / -1;
}

/* 大卡封面位。
   后端 sys_ai_knowledge_base 没有封面字段，所以「占位」是常态：
   有 cover 就渲图，没有就渲一个设计过的占位（主色渐变 + 斜纹底 + 名称首字），
   不允许出现空白块。颜色全部取 Element/koi 变量。 */
.kb-card__banner {
  position: relative;
  height: 96px;
  overflow: hidden;
  background: linear-gradient(135deg,
      var(--el-color-primary-light-8) 0%,
      var(--el-fill-color-light) 50%,
      var(--el-color-primary-light-9) 100%);
}

.kb-card__banner-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.kb-card__banner-ph {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 100%;
}

/* 占位斜纹底：避免整块纯色显空 */
.kb-card__banner-ph::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: repeating-linear-gradient(135deg,
      color-mix(in srgb, var(--el-color-primary) 8%, transparent) 0 1px,
      transparent 1px 10px);
  pointer-events: none;
}

.kb-card__banner-initials {
  position: relative;
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 2px;
  color: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
}

.kb-card__banner-hint {
  position: relative;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 小卡：居中的文档图标 + 右下角「就绪」角标 */
.kb-card__icon-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 22px 0 4px;
}

.kb-card__icon {
  color: var(--el-color-primary-light-3);
}

.kb-card__check {
  position: absolute;
  right: calc(50% - 30px);
  bottom: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 2px var(--el-bg-color);
}

.kb-card__check::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 3px;
  width: 4px;
  height: 7px;
  border: solid var(--el-color-white);
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
}

.kb-card__body {
  padding: 16px 18px;
}

/* 大卡的正文紧跟在图案带后面，顶部内距略收 */
.is-featured .kb-card__body {
  padding-top: 14px;
}

.kb-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-card__desc {
  margin: 4px 0 0;
  min-height: 2.5rem;
  font-size: 13px;
  line-height: 1.25rem;
  color: var(--el-text-color-secondary);
}

/* 小卡的次要信息行（更新时间 / 文档数），对应图上带图标的那一行 */
.kb-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.kb-card__metrics {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

/* 把「已就绪」推到最右，对应图上徽标与状态的左右分布 */
.kb-card__spacer {
  flex: 1 1 auto;
}

/* 操作按钮：常态隐藏，避免卡片视觉噪音；hover / 键盘聚焦时显现 */
.kb-card__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  height: 24px;
  margin-top: 8px;
  opacity: 0;
  transition: opacity var(--el-transition-duration, 0.2s);
}

.kb-home__card:hover .kb-card__actions,
.kb-home__card:focus-within .kb-card__actions {
  opacity: 1;
}

/* 无 hover 能力的设备（触屏）直接常显，否则按钮永远点不到 */
@media (hover: none) {
  .kb-card__actions {
    opacity: 1;
  }
}

.kb-metric {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.kb-metric__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}

.kb-metric--ok .kb-metric__dot {
  background: var(--el-color-success);
}

/* ── 空状态（按设计图：标题行 + 插画位 + 双入口 + 模板区） ─────────────── */
.kb-empty {
  padding: 22px 24px 24px;
}

.kb-empty__top {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.kb-empty__lead {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-empty__help {
  font-size: 13px;
  color: var(--el-color-primary);
  text-decoration: none;
  cursor: pointer;
}

.kb-empty__help:hover {
  text-decoration: underline;
}

/* 插画位：按设计图用「书本 + 上方节点网络」的示意图形。
   仓库没有插画素材，这里用内联 SVG 画，颜色全部取 Element 变量，不写死色值。 */
.kb-empty__figure {
  display: flex;
  justify-content: center;
  padding: 22px 0 4px;
}

.kb-empty__illus {
  /* 按 HTML 原型：插画宽 300px、窄屏最多占 70% */
  width: 300px;
  max-width: 70%;
  height: auto;
  display: block;
}

.kb-empty__illus-links {
  stroke: var(--el-border-color);
}

.kb-empty__illus-node--1 {
  fill: var(--el-color-primary-light-3);
}

.kb-empty__illus-node--2 {
  fill: var(--el-color-primary);
}

.kb-empty__illus-node--3 {
  fill: var(--el-color-success-light-3);
}

.kb-empty__illus-node--4 {
  fill: var(--el-color-success);
}

.kb-empty__illus-node--5 {
  fill: var(--el-color-warning-light-3);
}

.kb-empty__illus-node--6 {
  fill: var(--el-color-info-light-3);
}

.kb-empty__illus-book {
  fill: var(--el-color-primary-light-8);
  stroke: var(--el-color-primary-light-5);
  stroke-width: 1.6;
}

.kb-empty__illus-spine {
  stroke: var(--el-color-primary-light-5);
  stroke-width: 1.6;
}

.kb-empty__icon {
  display: block;
  margin: 8px auto 0;
  color: var(--el-text-color-placeholder);
}

.kb-empty__title {
  margin: 0;
  font-size: 15px;
  text-align: center;
  color: var(--el-text-color-regular);
}

.kb-empty__hint {
  margin: 6px 0 0;
  font-size: 13px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

/* 双入口：主 / 次两个大按钮横向等分 */
.kb-empty__cta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 22px 0 26px;
}

.kb-empty__cta-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 18px 20px;
  border-radius: var(--el-border-radius-base);
  cursor: pointer;
  transition: background-color var(--el-transition-duration, 0.2s),
    border-color var(--el-transition-duration, 0.2s);
}

.kb-empty__cta-btn--primary {
  border: 1px solid var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.kb-empty__cta-btn--primary:hover {
  background: var(--el-color-primary-light-3);
  border-color: var(--el-color-primary-light-3);
}

.kb-empty__cta-btn--ghost {
  border: 1px solid var(--el-color-primary-light-5);
  background: var(--el-bg-color);
  color: var(--el-color-primary);
}

.kb-empty__cta-btn--ghost:hover {
  background: var(--el-color-primary-light-9);
}

.kb-empty__cta-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.35;
}

.kb-empty__cta-text b {
  font-size: 15px;
  font-weight: 600;
}

.kb-empty__cta-text i {
  font-size: 12px;
  font-style: normal;
  opacity: 0.85;
}

/* 模板区 */
.kb-empty__tpl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-empty__tpl-grid {
  display: grid;
  /* 内容区约 680px，minmax 取 150px 才能在宽屏铺满 4 列——
     之前用 190px 只能放 3 列，第 4 张被挤到下一行，与设计图不符。 */
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}

.kb-tpl {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  transition: border-color var(--el-transition-duration, 0.2s);
}

.kb-tpl:hover {
  border-color: var(--el-color-primary-light-5);
}

/* 封面：设计稿是 400/225 的插画；有本地素材就铺图，没有就回退色块 */
.kb-tpl__cover {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 400 / 225;
  overflow: hidden;
}

.kb-tpl__cover-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.kb-tpl__cover--sanguo {
  background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
}

.kb-tpl__cover--poem {
  background: linear-gradient(135deg, var(--el-color-warning-light-8), var(--el-color-warning-light-9));
}

.kb-tpl__cover--idiom {
  background: linear-gradient(135deg, var(--el-color-success-light-8), var(--el-color-success-light-9));
}

.kb-tpl__cover--question {
  background: linear-gradient(135deg, var(--el-color-info-light-8), var(--el-color-info-light-9));
}

.kb-tpl__cover-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  opacity: 0.72;
}

.kb-tpl__body {
  padding: 10px 12px 12px;
}

.kb-tpl__name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-tpl__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
}

.kb-tpl__tag {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.kb-tpl__use {
  flex: 0 0 auto;
  --el-button-text-color: var(--el-color-primary);
  --el-button-border-color: var(--el-color-primary-light-5);
  --el-button-hover-bg-color: var(--el-color-primary-light-9);
}

/* 最近活动：卡片内自带标题，竖向时间线（圆点 + 连接线） */
.kb-activity {
  height: 100%;
  padding: 0 0 12px;
}

.kb-activity__head {
  margin: 0;
  padding: 16px 16px 10px;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.kb-activity__list {
  margin: 0;
  padding: 0 16px;
  list-style: none;
}

.kb-activity__item {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 10px 0 10px 2px;
}

.kb-activity__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 22px;
  bottom: -2px;
  width: 1px;
  background: var(--el-border-color-lighter);
}

.kb-activity__dot {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-bg-color);
}

.kb-activity__text {
  min-width: 0;
  flex: 1;
}

.kb-activity__title {
  font-size: 13.5px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.kb-activity__meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1080px) {
  .kb-home {
    flex-direction: column;
  }

  .kb-home__side {
    flex: none;
    width: 100%;
  }
}
</style>
