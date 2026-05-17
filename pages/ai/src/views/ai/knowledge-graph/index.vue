<template>
  <section class="merged-workbench system-container modern-bg">
    <!-- Ambient glow -->
    <div class="merged-workbench__glow merged-workbench__glow--primary" />
    <div class="merged-workbench__glow merged-workbench__glow--purple" />

    <!-- Header (face-library style) -->
    <header class="merged-workbench__header">
      <button class="merged-workbench__back" @click="router.push('/ai')">
        <IconifyIconOnline icon="ri:arrow-left-s-line" />
      </button>
      <div class="merged-workbench__header-body">
        <h2 class="merged-workbench__header-title">RAG 知识库</h2>
        <p class="merged-workbench__header-desc">文档索引 / 知识图谱 / 智能问答</p>
      </div>
      <nav class="merged-workbench__nav">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="merged-workbench__nav-item"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <IconifyIconOnline :icon="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </header>

    <!-- ═══ Tab: 文档管理 (RAG) ═══ -->
    <div v-if="activeTab === 'documents'" class="merged-workbench__panel">
      <div class="rag-documents">
        <!-- Upload area -->
        <div class="rag-upload-area" @drop.prevent="handleDrop" @dragover.prevent>
          <el-upload ref="uploadRef" drag multiple :auto-upload="false" :show-file-list="false"
            :on-change="handleFileSelect"
            accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.xml,.html,.htm,.java,.ts,.js,.py,.yaml,.yml,.properties">
            <div class="rag-upload__content">
              <IconifyIconOnline icon="ri:upload-cloud-2-line" class="rag-upload__icon" />
              <p class="rag-upload__text">拖拽文件到此处，或<em>点击选择</em></p>
              <p class="rag-upload__hint">支持 TXT / MD / PDF / DOC / 代码等格式</p>
            </div>
          </el-upload>
          <div v-if="uploadQueue.length" class="rag-upload-queue">
            <div v-for="(item, idx) in uploadQueue" :key="idx" class="rag-upload-item">
              <IconifyIconOnline :icon="item.status === 'done' ? 'ri:checkbox-circle-fill' : item.status === 'error' ? 'ri:error-warning-fill' : 'ri:loader-4-line'"
                :class="'rag-upload-item__icon rag-upload-item__icon--' + item.status" />
              <span class="rag-upload-item__name">{{ item.name }}</span>
              <span class="rag-upload-item__size">{{ formatSize(item.size) }}</span>
              <span v-if="item.status === 'done'" class="rag-upload-item__status rag-upload-item__status--ok">完成</span>
              <span v-else-if="item.status === 'error'" class="rag-upload-item__status rag-upload-item__status--err">{{ item.error || '失败' }}</span>
              <span v-else class="rag-upload-item__status">索引中...</span>
            </div>
          </div>
        </div>
        <!-- Toolbar -->
        <div class="rag-documents__toolbar">
          <span class="rag-documents__count">共 {{ totalDocs }} 个文档</span>
          <div class="rag-documents__actions">
            <el-button size="small" @click="loadDocuments" :loading="docLoading">
              <IconifyIconOnline icon="ri:refresh-line" /> 刷新
            </el-button>
            <el-button size="small" type="warning" plain @click="handleReset" :loading="resetting">
              <IconifyIconOnline icon="ri:restart-line" /> 重新索引全部
            </el-button>
          </div>
        </div>
        <!-- Table -->
        <el-table v-loading="docLoading" :data="docList" style="width:100%" empty-text="暂无文档，请上传">
          <el-table-column label="文件名" min-width="200">
            <template #default="{ row }">
              <div class="rag-doc-name">
                <IconifyIconOnline :icon="getFileIcon(row.fileType)" class="rag-doc-name__icon" />
                <span>{{ row.fileName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.fileType.toUpperCase() }}</el-tag></template>
          </el-table-column>
          <el-table-column label="大小" width="100" align="right">
            <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
          </el-table-column>
          <el-table-column label="分块" width="70" align="center">
            <template #default="{ row }">{{ row.chunkCount || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'READY'" size="small" type="success">已就绪</el-tag>
              <el-tag v-else-if="row.status === 'PROCESSING'" size="small" type="warning">处理中</el-tag>
              <el-tag v-else size="small" type="danger">{{ row.errorMessage || '失败' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上传时间" width="170" align="center">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <el-button text type="danger" size="small" @click="handleDelete(row)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="totalDocs" class="rag-documents__pagination">
          <el-pagination v-model:current-page="docPage" :page-size="20" :total="totalDocs"
            layout="prev, pager, next" small @current-change="loadDocuments" />
        </div>
      </div>
    </div>

    <!-- ═══ Tab: 图谱视图 (KG) ═══ -->
    <div v-if="activeTab === 'graph'" class="merged-workbench__panel merged-workbench__panel--full">
      <div class="kg-graph-toolbar">
        <div class="kg-graph-filters">
          <el-input v-model="graphFilter.type" placeholder="按类型筛选" clearable style="width:160px" @change="loadGraphData" />
          <el-input-number v-model="graphFilter.limit" :min="20" :max="500" :step="20" size="small" />
          <el-button type="primary" size="small" round @click="loadGraphData">
            <IconifyIconOnline icon="ri:refresh-line" style="margin-right:4px" />刷新
          </el-button>
          <span class="kg-toolbar-divider" />
          <el-button-group class="kg-zoom-group">
            <el-button size="small" @click="scGraphRef.value?.zoomTo?.({mode:'relative',value:1.3})" title="放大">
              <IconifyIconOnline icon="ri:zoom-in-line" />
            </el-button>
            <el-button size="small" @click="scGraphRef.value?.zoomTo?.({mode:'relative',value:0.7})" title="缩小">
              <IconifyIconOnline icon="ri:zoom-out-line" />
            </el-button>
            <el-button size="small" @click="scGraphRef.value?.fitView?.()" title="适应画布">
              <IconifyIconOnline icon="ri:aspect-ratio-fill" />
            </el-button>
          </el-button-group>
          <el-button size="small" @click="showPathDialog = true" title="查找路径">
            <IconifyIconOnline icon="ri:git-branch-line" style="margin-right:4px" />路径
          </el-button>
        </div>
        <div v-if="graphData.nodes" class="kg-graph-stats">
          <span class="kg-stat-pill kg-stat-pill--nodes">{{ graphData.nodes.length }} 节点</span>
          <span class="kg-stat-pill kg-stat-pill--edges">{{ graphData.edges.length }} 边</span>
        </div>
      </div>
      <div class="kg-graph-container">
        <component v-if="scGraphAvailable" :is="ScGraphComponent" ref="scGraphRef"
          :nodes="graphData.nodes || []" :edges="graphData.edges || []"
          show-toolbar height="100%" @node-click="handleGraphNodeClick"
          @canvas-click="handleGraphCanvasClick" @node-select="handleNodeSelect" />
        <div v-else class="sg-placeholder">
          <IconifyIconOnline icon="ri:node-tree" />
          <p>图谱组件未启用</p>
          <span>请在应用中启用 ScGraph 组件以查看图谱</span>
        </div>
        <div v-if="selectedNode && selectedNodeInfo" ref="detailPanelRef" class="kg-detail-panel">
          <div ref="dragHandleRef" class="kg-detail-panel__handle">
            <IconifyIconOnline icon="ri:draggable" />
            <span>节点详情</span>
          </div>
          <div class="kg-detail-panel__content">
            <div class="kg-detail-panel__row">
              <span class="kg-detail-panel__label">名称</span>
              <span class="kg-detail-panel__value">{{ selectedNodeInfo.name }}</span>
            </div>
            <div class="kg-detail-panel__row">
              <span class="kg-detail-panel__label">类型</span>
              <span class="kg-type-tag" :class="'kg-type-tag--' + (typeTagColor(selectedNodeInfo.type) || 'default')">{{ selectedNodeInfo.type }}</span>
            </div>
            <div v-if="selectedNodeInfo.logo" class="kg-detail-panel__row">
              <span class="kg-detail-panel__label">Logo</span>
              <img :src="selectedNodeInfo.logo" class="kg-detail-panel__logo-img" alt="logo" />
            </div>
            <div v-if="selectedNodeInfo.weight" class="kg-detail-panel__row">
              <span class="kg-detail-panel__label">权重</span>
              <span class="kg-weight-badge" :style="{ background: getWeightColor(selectedNodeInfo.weight) }">{{ selectedNodeInfo.weight?.toFixed(1) }}</span>
            </div>
            <div class="kg-detail-panel__divider" />
            <div class="kg-detail-panel__section-title">
              <IconifyIconOnline icon="ri:share-node-line" /> 关联邻居
              <span class="kg-detail-panel__count">{{ neighbors.length }}</span>
            </div>
            <div v-for="n in neighbors" :key="n.id" class="kg-detail-panel__neighbor" @click="handleNodeSelect(n.id)">
              <span class="kg-detail-panel__dot" :style="{ background: '#409eff' }" />
              <span class="kg-detail-panel__neighbor-name">{{ n.name }}</span>
              <small class="kg-detail-panel__neighbor-type">{{ n.type }}</small>
            </div>
            <div v-if="!neighbors.length" class="kg-detail-panel__empty">无关联节点</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ 路径查找对话框 ═══ -->
    <Teleport to="body">
      <div v-if="showPathDialog" class="kg-dialog-overlay" @click.self="showPathDialog = false">
        <div class="kg-dialog kg-dialog--sm">
          <div class="kg-dialog__header"><h3>路径查找</h3></div>
          <div class="kg-dialog__body">
            <el-form label-width="80px">
              <el-form-item label="起点实体">
                <el-select v-model="pathFrom" filterable remote :remote-method="searchPathEntities"
                  placeholder="搜索起点实体" style="width:100%" :loading="pathSearchLoading">
                  <el-option v-for="e in pathEntityOptions" :key="e.uid" :label="e.name" :value="e.uid" />
                </el-select>
              </el-form-item>
              <el-form-item label="终点实体">
                <el-select v-model="pathTo" filterable remote :remote-method="searchPathEntities"
                  placeholder="搜索终点实体" style="width:100%" :loading="pathSearchLoading">
                  <el-option v-for="e in pathEntityOptions" :key="e.uid" :label="e.name" :value="e.uid" />
                </el-select>
              </el-form-item>
              <el-form-item label="最大深度">
                <el-input-number v-model="pathMaxDepth" :min="1" :max="10" :step="1" />
              </el-form-item>
            </el-form>
            <div v-if="pathResult !== null" class="kg-path-result">
              <div v-if="pathResult.length" class="kg-path-result__paths">
                <div v-for="(path, pi) in pathResult" :key="pi" class="kg-path-item">
                  <div class="kg-path-item__title">路径 {{ pi + 1 }}</div>
                  <div class="kg-path-item__nodes">
                    <span v-for="(step, si) in path" :key="si" class="kg-path-step">
                      <span class="kg-path-step__name">{{ step.name }}</span>
                      <span v-if="si < path.length - 1" class="kg-path-step__arrow">
                        <IconifyIconOnline icon="ri:arrow-right-s-line" />
                      </span>
                    </span>
                  </div>
                </div>
              </div>
              <div v-else class="kg-path-empty">
                <IconifyIconOnline icon="ri:error-warning-line" />
                <span>未找到路径</span>
              </div>
            </div>
          </div>
          <div class="kg-dialog__footer">
            <el-button @click="showPathDialog = false">关闭</el-button>
            <el-button type="primary" :loading="pathSearching" @click="handleFindPaths">查找路径</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ Tab: 实体管理 (KG) ═══ -->
    <div v-if="activeTab === 'entities'" class="merged-workbench__panel">
      <div class="kg-card">
        <div class="kg-card__header">
          <div class="kg-card__header-left">
            <IconifyIconOnline icon="ri:database-2-line" />
            <span>实体列表</span>
            <el-tag v-if="entityTotal" size="small" round>{{ entityTotal }}</el-tag>
          </div>
          <div class="kg-card__header-right">
            <el-input v-model="entityQuery.keyword" placeholder="搜索实体名称" clearable style="width:200px" @change="loadEntities" />
            <el-select v-model="entityQuery.type" placeholder="实体类型" clearable style="width:140px" @change="loadEntities">
              <el-option v-for="t in entityTypes" :key="t" :label="t" :value="t" />
            </el-select>
            <el-button :disabled="!selectedEntityIds.length" type="danger" size="small" round @click="handleBatchDeleteEntities">
              <IconifyIconOnline icon="ri:delete-bin-line" style="margin-right:4px" />批量删除{{ selectedEntityIds.length ? ` (${selectedEntityIds.length})` : '' }}
            </el-button>
            <el-button size="small" round @click="handleDeduplicateEntities">
              <IconifyIconOnline icon="ri:merge-cells-horizontal" style="margin-right:4px" />合并重复
            </el-button>
            <el-button type="primary" round @click="openEntityDialog()">
              <IconifyIconOnline icon="ri:add-line" style="margin-right:4px" />新建实体
            </el-button>
          </div>
        </div>
        <el-table :data="entityRecords" v-loading="entityLoading" stripe style="width:100%" class="kg-table"
          @selection-change="(rows: any[]) => selectedEntityIds = rows.map((r: any) => r.sysAiKnowledgeGraphEntityId)">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="sysAiKnowledgeGraphEntityName" label="名称" min-width="140" />
          <el-table-column label="类型" width="130">
            <template #default="{ row }">
              <span class="kg-type-tag" :class="'kg-type-tag--' + (typeTagColor(row.sysAiKnowledgeGraphEntityType) || 'default')">{{ row.sysAiKnowledgeGraphEntityType }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sysAiKnowledgeGraphEntitySource" label="来源" width="110" />
          <el-table-column label="创建时间" width="160"><template #default="{ row }">{{ row.createTime }}</template></el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button size="small" class="kg-action-btn" @click="editEntity(row)"><IconifyIconOnline icon="ri:edit-line" />编辑</el-button>
              <el-button size="small" type="danger" class="kg-action-btn kg-action-btn--danger" @click="handleDeleteEntity(row.sysAiKnowledgeGraphEntityId)"><IconifyIconOnline icon="ri:delete-bin-line" />删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="kg-card__footer">
          <el-pagination v-model:page-size="entityQuery.size" v-model:current-page="entityQuery.page"
            :total="entityTotal" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next" small @change="loadEntities" />
        </div>
      </div>
    </div>

    <!-- ═══ Tab: 关系管理 (KG) ═══ -->
    <div v-if="activeTab === 'relations'" class="merged-workbench__panel">
      <div class="kg-card">
        <div class="kg-card__header">
          <div class="kg-card__header-left">
            <IconifyIconOnline icon="ri:share-line" />
            <span>关系列表</span>
            <el-tag v-if="relationTotal" size="small" round>{{ relationTotal }}</el-tag>
          </div>
          <div class="kg-card__header-right">
            <el-input v-model="relationQuery.keyword" placeholder="搜索关系类型" clearable style="width:200px" @change="loadRelations" />
            <el-select v-model="relationQuery.type" placeholder="关系类型" clearable style="width:140px" @change="loadRelations">
              <el-option v-for="t in relationTypes" :key="t" :label="t" :value="t" />
            </el-select>
            <el-button :disabled="!selectedRelationIds.length" type="danger" size="small" round @click="handleBatchDeleteRelations">
              <IconifyIconOnline icon="ri:link-unlink" style="margin-right:4px" />批量删除{{ selectedRelationIds.length ? ` (${selectedRelationIds.length})` : '' }}
            </el-button>
            <el-button type="primary" round @click="openNewRelationDialog">
              <IconifyIconOnline icon="ri:add-line" style="margin-right:4px" />新建关系
            </el-button>
          </div>
        </div>
        <el-table :data="relationRecords" v-loading="relationLoading" stripe style="width:100%" class="kg-table"
          @selection-change="(rows: any[]) => selectedRelationIds = rows.map((r: any) => r.sysAiKnowledgeGraphRelationId)">
          <el-table-column type="selection" width="40" />
          <el-table-column label="源实体" min-width="140" show-overflow-tooltip>
            <template #default="{ row }"><span class="kg-entity-link">{{ row.sysAiKnowledgeGraphRelationSourceEntityName || row.sysAiKnowledgeGraphRelationSourceEntityUid }}</span></template>
          </el-table-column>
          <el-table-column label="目标实体" min-width="140" show-overflow-tooltip>
            <template #default="{ row }"><span class="kg-entity-link">{{ row.sysAiKnowledgeGraphRelationTargetEntityName || row.sysAiKnowledgeGraphRelationTargetEntityUid }}</span></template>
          </el-table-column>
          <el-table-column label="关系类型" width="130">
            <template #default="{ row }"><span class="kg-type-tag kg-type-tag--relation">{{ row.sysAiKnowledgeGraphRelationType }}</span></template>
          </el-table-column>
          <el-table-column label="权重" width="90">
            <template #default="{ row }">
              <span class="kg-weight-badge" :style="{ background: getWeightColor(row.sysAiKnowledgeGraphRelationWeight) }">{{ row.sysAiKnowledgeGraphRelationWeight?.toFixed(1) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160"><template #default="{ row }">{{ row.createTime }}</template></el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button size="small" class="kg-action-btn" @click="editRelation(row)"><IconifyIconOnline icon="ri:edit-line" />编辑</el-button>
              <el-button size="small" type="danger" class="kg-action-btn kg-action-btn--danger" @click="handleDeleteRelation(row.sysAiKnowledgeGraphRelationId)"><IconifyIconOnline icon="ri:link-unlink" />删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="kg-card__footer">
          <el-pagination v-model:page-size="relationQuery.size" v-model:current-page="relationQuery.page"
            :total="relationTotal" :page-sizes="[10,20,50]" layout="total,sizes,prev,pager,next" small @change="loadRelations" />
        </div>
      </div>
    </div>

    <!-- ═══ Tab: LLM 抽取 (KG) ═══ -->
    <div v-if="activeTab === 'extract'" class="merged-workbench__panel">
      <div class="kg-extract">
        <div class="kg-extract__input-card">
          <div class="kg-extract__card-header">
            <IconifyIconOnline icon="ri:input-field" />
            <span>输入文本</span>
          </div>
          <div class="kg-extract__card-body">
            <div class="kg-extract__file-zone" :class="{ 'is-dragover': fileDragging }"
              @dragover.prevent="fileDragging = true" @dragleave.prevent="fileDragging = false"
              @drop.prevent="handleFileDrop" @click="fileInputRef?.click()">
              <input ref="fileInputRef" type="file"
                accept=".txt,.md,.csv,.json,.xml,.yaml,.yml,.properties,.log,.html,.htm,.java,.py,.js,.ts,.jsx,.tsx,.css,.sql,.sh,.bat,.ini,.cfg,.conf,.toml,.gradle,.png,.jpg,.jpeg,.bmp,.webp,.gif,.tiff,.tif,.pdf"
                style="display:none" @change="handleFileSelect" />
              <div class="kg-extract__upload-icon-wrap">
                <IconifyIconOnline icon="ri:upload-cloud-2-line" class="kg-extract__upload-icon" />
              </div>
              <p v-if="!uploadedFile" class="kg-extract__file-hint">点击或拖拽文件到此处<br /><small>支持文本 / 图片 / PDF</small></p>
              <p v-else class="kg-extract__file-info">
                <IconifyIconOnline icon="ri:file-text-line" />
                {{ uploadedFile.name }} ({{ (uploadedFile.size / 1024).toFixed(1) }} KB)
                <el-button size="small" text type="danger" @click.stop="clearFile">移除</el-button>
              </p>
              <div v-if="fileExtracting" class="kg-extract__file-progress">
                <el-progress :percentage="fileExtractProgress" :stroke-width="3" striped />
                <span>正在提取文件内容...</span>
              </div>
            </div>
            <el-input v-model="extractText" type="textarea" :rows="8" class="kg-extract__textarea"
              placeholder="请粘贴或输入需要抽取实体的文本内容..." />
            <div class="kg-extract__actions">
              <el-button type="primary" :loading="extractingEntities" @click="handleExtractEntities" round class="kg-extract__primary-btn">
                <IconifyIconOnline icon="ri:sparkling-2-line" style="margin-right:6px" />抽取实体
              </el-button>
              <el-button :loading="extractingRelations" :disabled="!extractedEntities.length" @click="handleExtractRelations" round class="kg-extract__secondary-btn">
                <IconifyIconOnline icon="ri:node-tree" style="margin-right:6px" />抽取关系
              </el-button>
            </div>
          </div>
        </div>
        <div class="kg-extract__result-card">
          <div class="kg-extract__card-header">
            <IconifyIconOnline icon="ri:search-eye-line" />
            <span>抽取结果</span>
            <el-tag v-if="extractedEntities.length || extractedRelations.length" size="small" class="kg-extract__result-badge" round>
              {{ extractedEntities.length + extractedRelations.length }}
            </el-tag>
          </div>
          <div class="kg-extract__card-body">
            <el-tabs v-model="extractResultTab" class="kg-extract__tabs">
              <el-tab-pane label="实体" name="entities">
                <el-table :data="extractedEntities" max-height="340" stripe style="width:100%" class="kg-table">
                  <el-table-column prop="sysAiKnowledgeGraphEntityName" label="名称" />
                  <el-table-column prop="sysAiKnowledgeGraphEntityType" label="类型" width="100" />
                </el-table>
                <el-empty v-if="!extractedEntities.length" description="暂无抽取结果" :image-size="60" />
              </el-tab-pane>
              <el-tab-pane label="关系" name="relations">
                <el-table :data="extractedRelations" max-height="340" stripe style="width:100%" class="kg-table">
                  <el-table-column prop="sysAiKnowledgeGraphRelationType" label="关系类型" />
                  <el-table-column prop="sysAiKnowledgeGraphRelationWeight" label="权重" width="80" />
                </el-table>
                <el-empty v-if="!extractedRelations.length" description="暂无抽取结果" :image-size="60" />
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ Tab: 问答 (RAG) ═══ -->
    <div v-if="activeTab === 'query'" class="merged-workbench__panel merged-workbench__panel--chat">
      <div class="rag-chat" ref="chatRef">
        <div v-if="!messages.length" class="rag-chat__empty">
          <IconifyIconOnline icon="ri:chat-1-line" class="rag-chat__empty-icon" />
          <p>上传文档后，在这里提问</p>
        </div>
        <div v-for="(msg, idx) in messages" :key="idx" class="rag-chat__msg" :class="'rag-chat__msg--' + msg.role">
          <div class="rag-chat__bubble">
            <div v-if="msg.role === 'user'" class="rag-chat__user-text">{{ msg.content }}</div>
            <div v-else class="rag-chat__ai">
              <div v-if="msg.loading" class="rag-chat__typing">
                <span class="rag-chat__dot" /><span class="rag-chat__dot" /><span class="rag-chat__dot" />
              </div>
              <div v-else class="rag-chat__answer" v-html="renderMarkdown(msg.content)" />
              <div v-if="msg.sources && msg.sources.length" class="rag-chat__sources">
                <button class="rag-chat__sources-toggle" type="button" @click="msg.sourcesVisible = !msg.sourcesVisible">
                  <IconifyIconOnline icon="ri:file-list-2-line" />
                  引用来源 ({{ msg.sources.length }})
                  <IconifyIconOnline :icon="msg.sourcesVisible ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" />
                </button>
                <div v-if="msg.sourcesVisible" class="rag-chat__sources-list">
                  <div v-for="(src, si) in msg.sources" :key="si" class="rag-chat__source-item">
                    <div class="rag-chat__source-header">
                      <span class="rag-chat__source-doc">{{ src.documentId }}</span>
                      <el-tag size="small" :type="src.score > 0.8 ? 'success' : 'warning'">{{ (src.score * 100).toFixed(0) }}%</el-tag>
                    </div>
                    <p class="rag-chat__source-content">{{ src.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="rag-chat__input-area">
        <div class="rag-chat__input-wrapper">
          <input v-model="ragQueryText" class="rag-chat__input" placeholder="输入你的问题..."
            @keydown.enter.prevent="sendQuery" />
          <button class="rag-chat__send" type="button" :disabled="!ragQueryText.trim() || queryLoading" @click="sendQuery">
            <IconifyIconOnline icon="ri:send-plane-2-fill" />
          </button>
        </div>
      </div>
    </div>

    <!-- ═══ Tab: 设置 (RAG + KG) ═══ -->
    <div v-if="activeTab === 'settings'" class="merged-workbench__panel">
      <div class="merged-settings">
        <!-- RAG 设置 -->
        <div class="merged-settings-section">
          <div class="merged-settings-section__head">
            <IconifyIconOnline icon="ri:settings-4-line" />
            <strong>RAG 配置</strong>
          </div>
          <div class="merged-settings-form">
            <div class="merged-settings-field">
              <label>Embedding 引擎</label>
              <el-select v-model="ragSettings.embeddingEngine" style="width:100%">
                <el-option label="Memory（内存哈希，脱机可用）" value="memory" />
                <el-option label="OpenAI" value="openai" />
                <el-option label="SiliconFlow" value="siliconflow" />
              </el-select>
            </div>
            <div class="merged-settings-field">
              <label>向量存储</label>
              <el-select v-model="ragSettings.vectorStorage" style="width:100%">
                <el-option label="JVector（本地 HNSW）" value="jvector" />
                <el-option label="内存存储" value="memory" />
                <el-option label="Milvus" value="milvus" />
                <el-option label="MySQL" value="mysql" />
              </el-select>
            </div>
            <div class="merged-settings-field">
              <label>分块大小</label>
              <el-input-number v-model="ragSettings.chunkSize" :min="200" :max="4000" :step="100" style="width:100%" />
            </div>
            <div class="merged-settings-field">
              <label>分块重叠</label>
              <el-input-number v-model="ragSettings.chunkOverlap" :min="0" :max="500" :step="50" style="width:100%" />
            </div>
            <div class="merged-settings-field">
              <label>Top-K</label>
              <el-input-number v-model="ragSettings.defaultTopK" :min="1" :max="20" style="width:100%" />
            </div>
            <div class="merged-settings-field">
              <label>相似度阈值</label>
              <el-slider v-model="ragSettings.defaultSimilarityThreshold" :min="0" :max="1" :step="0.05" style="width:100%" />
            </div>
          </div>
        </div>
        <!-- KG 全局设置 -->
        <div class="merged-settings-section">
          <div class="merged-settings-section__head">
            <IconifyIconOnline icon="ri:node-tree" />
            <strong>知识图谱全局设置</strong>
          </div>
          <div class="kg-settings-group">
            <div v-for="(val, key) in kgSettingValues" :key="key" class="kg-settings-item">
              <label class="kg-settings-label">{{ kgSettingLabels[key] || key }}</label>
              <div class="kg-settings-control">
                <template v-if="key === 'enabled' || key === 'relation_extraction_enabled'">
                  <el-switch v-model="kgBoolSettings[key]" @change="updateKgSetting(key, kgBoolSettings[key])" />
                </template>
                <template v-else-if="key === 'max_entities_per_doc' || key === 'embedding_dimension'">
                  <el-input-number v-model="kgNumSettings[key]" :min="1" :max="10000" @change="updateKgNumSetting(key, kgNumSettings[key])" />
                </template>
                <template v-else-if="key === 'vector_storage_engine'">
                  <el-select v-model="kgSettingValues[key]" style="width:100%" @change="updateKgSetting(key, kgSettingValues[key])">
                    <el-option label="JVector - 本地内存向量引擎" value="jvector" />
                    <el-option label="Milvus - 高性能分布式向量数据库" value="milvus" />
                    <el-option label="Pinecone - 云端向量数据库服务" value="pinecone" />
                    <el-option label="Qdrant - 向量相似度搜索引擎" value="qdrant" />
                    <el-option label="Weaviate - 开源向量数据库" value="weaviate" />
                    <el-option label="Elasticsearch - 全文与向量混合搜索" value="elasticsearch" />
                  </el-select>
                </template>
                <template v-else>
                  <el-input v-model="kgSettingValues[key]" :placeholder="kgSettingLabels[key]" @blur="updateKgSetting(key, kgSettingValues[key])" />
                </template>
              </div>
            </div>
          </div>
          <p class="kg-settings-tip">修改后将自动保存并生效</p>
        </div>
        <div class="merged-settings-section" style="border-color:var(--el-color-danger-light-5)">
          <div class="merged-settings-section__head" style="color:var(--el-color-danger)">
            <IconifyIconOnline icon="ri:delete-bin-6-line" />
            <strong>危险操作</strong>
          </div>
          <div style="display:flex;gap:12px;padding:8px 0">
            <el-button type="danger" plain @click="handleClearGraph" :loading="clearingGraph">
              <IconifyIconOnline icon="ri:delete-bin-line" style="margin-right:4px" />清空当前图库
            </el-button>
          </div>
          <p class="kg-settings-tip">清空图库将删除当前知识库下所有实体和关系，不可恢复</p>
        </div>
        <p class="merged-settings-tip">RAG 设置保存后需要重启应用生效</p>
      </div>
    </div>

    <!-- ═══ 实体编辑对话框 ═══ -->
    <Teleport to="body">
      <div v-if="showEntityDialog" class="kg-dialog-overlay" @click.self="showEntityDialog = false">
        <div class="kg-dialog">
          <div class="kg-dialog__header"><h3>{{ editingEntity ? '编辑实体' : '新建实体' }}</h3></div>
          <div class="kg-dialog__body">
            <el-form label-width="80px">
              <el-form-item label="名称"><el-input v-model="entityForm.name" placeholder="实体名称" /></el-form-item>
              <el-form-item label="类型"><el-input v-model="entityForm.type" placeholder="实体类型，如 Person" /></el-form-item>
              <el-form-item label="权重">
                <el-input-number v-model="entityForm.weight" :min="0.1" :max="10" :step="0.1" style="width:100%" />
              </el-form-item>
              <el-form-item label="属性"><el-input v-model="entityForm.properties" type="textarea" :rows="3" placeholder='JSON格式，如 {"key":"value"}' /></el-form-item>
              <el-form-item label="Logo URL">
                <el-input v-model="entityForm.logo" placeholder="实体Logo图片URL（可选）" />
                <img v-if="entityForm.logo" :src="entityForm.logo" style="margin-left:8px;width:32px;height:32px;border-radius:50%;object-fit:cover" @error="entityForm.logo = ''" />
              </el-form-item>
            </el-form>
          </div>
          <div class="kg-dialog__footer">
            <el-button @click="showEntityDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSaveEntity">保存</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ 关系编辑对话框 ═══ -->
    <Teleport to="body">
      <div v-if="showRelationDialog" class="kg-dialog-overlay" @click.self="showRelationDialog = false">
        <div class="kg-dialog">
          <div class="kg-dialog__header"><h3>{{ editingRelation ? '编辑关系' : '新建关系' }}</h3></div>
          <div class="kg-dialog__body">
            <el-form label-width="100px">
              <el-form-item label="源实体">
                <el-select v-model="relationForm.sourceEntityUid" filterable remote :remote-method="searchEntityOptions" placeholder="搜索并选择源实体" style="width:100%" @focus="loadEntityOptions">
                  <el-option v-for="e in entityOptions" :key="e.sysAiKnowledgeGraphEntityUid" :label="e.sysAiKnowledgeGraphEntityName + ' (' + e.sysAiKnowledgeGraphEntityType + ')'" :value="e.sysAiKnowledgeGraphEntityUid" />
                </el-select>
              </el-form-item>
              <el-form-item label="目标实体">
                <el-select v-model="relationForm.targetEntityUid" filterable remote :remote-method="searchEntityOptions" placeholder="搜索并选择目标实体" style="width:100%" @focus="loadEntityOptions">
                  <el-option v-for="e in entityOptions" :key="e.sysAiKnowledgeGraphEntityUid" :label="e.sysAiKnowledgeGraphEntityName + ' (' + e.sysAiKnowledgeGraphEntityType + ')'" :value="e.sysAiKnowledgeGraphEntityUid" />
                </el-select>
              </el-form-item>
              <el-form-item label="关系类型"><el-input v-model="relationForm.type" placeholder="如 works_for" /></el-form-item>
              <el-form-item label="权重"><el-input-number v-model="relationForm.weight" :min="0" :max="1" :step="0.1" /></el-form-item>
              <el-form-item label="属性"><el-input v-model="relationForm.properties" type="textarea" :rows="2" placeholder='JSON格式，如 {"key":"value"}' /></el-form-item>
            </el-form>
          </div>
          <div class="kg-dialog__footer">
            <el-button @click="showRelationDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSaveRelation">保存</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ═══ 知识库管理对话框 ═══ -->
    <Teleport to="body">
      <div v-if="showLibraryDialog" class="kg-dialog-overlay" @click.self="showLibraryDialog = false">
        <div class="kg-dialog" style="width:560px">
          <div class="kg-dialog__header"><h3>{{ editingLibrary ? '编辑知识库' : '新建知识库' }}</h3></div>
          <div class="kg-dialog__body">
            <el-form label-width="140px">
              <el-form-item label="名称"><el-input v-model="libraryForm.sysAiKnowledgeLibraryName" placeholder="知识库名称（即分组名称）" /></el-form-item>
              <el-form-item label="描述"><el-input v-model="libraryForm.sysAiKnowledgeLibraryDescription" placeholder="知识库描述（可选）" /></el-form-item>
            </el-form>
          </div>
          <div class="kg-dialog__footer">
            <el-button v-if="editingLibrary && editingLibrary.sysAiKnowledgeLibraryId > 1" type="danger" @click="handleDeleteLibrary(editingLibrary.sysAiKnowledgeLibraryId)">删除</el-button>
            <el-button @click="showLibraryDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSaveLibrary">保存</el-button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onMounted, reactive, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElInput, ElInputNumber, ElMessage, ElMessageBox, ElPagination, ElProgress, ElSlider, ElSwitch, ElTable, ElTableColumn, ElTag, ElUpload } from "element-plus";
import type { UploadInstance } from "element-plus";
import { useDraggable } from "@vueuse/core";

// ScGraph 懒加载：组件可用时使用
const scGraphAvailable = ref(false);
const ScGraphComponent = shallowRef<any>(null);
import {
  // RAG
  uploadDocument, listDocuments, deleteDocument, ragQuery, resetRag,
  type RagDocument, type RagQueryResult,
  // KG
  listEntities, deleteEntity, createEntity, updateEntity,
  listRelations, deleteRelation, createRelation, updateRelation,
  getGraphData, getEntityTypes, getRelationTypes,
  getNeighbors, extractEntities as apiExtractEntities,
  extractRelations as apiExtractRelations, queryGraph,
  batchDeleteEntities, batchDeleteRelations,
  extractTextFromFile, findPaths, deduplicateEntities, clearGraph,
  type KgEntityItem, type KgRelationItem, type KgGraphData,
} from "../../../api/ai/knowledge-graph";
import {
  listAllLibraries, createLibrary, updateLibrary, deleteLibrary,
  type KnowledgeLibraryItem,
} from "../../../api/ai/knowledge-library";
import { listAiGlobalSettings, replaceAiGlobalSettings } from "../../../api/ai/global-setting";

const router = useRouter();

// ── Tab definitions ──
const tabs = [
  { key: "documents", label: "文档管理", icon: "ri:file-list-2-line" },
  { key: "graph",     label: "图谱视图", icon: "ri:node-tree" },
  { key: "entities",  label: "实体管理", icon: "ri:database-2-line" },
  { key: "relations", label: "关系管理", icon: "ri:share-line" },
  { key: "extract",   label: "LLM 抽取", icon: "ri:sparkling-line" },
  { key: "query",     label: "问答",     icon: "ri:question-answer-line" },
  { key: "settings",  label: "设置",     icon: "ri:settings-4-line" },
];
const activeTab = ref("documents");

// ── Type helpers (KG) ──
function typeTagColor(type: string): string {
  const map: Record<string, string> = {
    Person: 'person', Organization: 'org', Product: 'product',
    Technology: 'tech', Framework: 'default', Tool: 'tool', Language: 'lang', Server: 'server',
  };
  return map[type] || 'default';
}
function getWeightColor(weight: number | undefined | null): string {
  if (weight == null) return '#909399';
  if (weight >= 0.8) return 'var(--el-color-success)';
  if (weight >= 0.5) return 'var(--el-color-primary)';
  if (weight >= 0.3) return 'var(--el-color-warning)';
  return 'var(--el-color-info)';
}

// ══════════════════════════════════════════════════════════════
// Knowledge Library
// ══════════════════════════════════════════════════════════════

const currentLibraryId = ref<number>(1);
const libraryList = ref<KnowledgeLibraryItem[]>([]);
const showLibraryDialog = ref(false);
const editingLibrary = ref<KnowledgeLibraryItem | null>(null);
const libraryForm = reactive({ sysAiKnowledgeLibraryName: "", sysAiKnowledgeLibraryDescription: "" });

async function loadLibraries() {
  try {
    const res = await listAllLibraries();
    libraryList.value = res.data ?? [];
    if (libraryList.value.length && !libraryList.value.some(l => l.sysAiKnowledgeLibraryId === currentLibraryId.value)) {
      currentLibraryId.value = libraryList.value[0].sysAiKnowledgeLibraryId;
    }
  } catch { /* ignore */ }
}

function switchLibrary(libId: number) {
  currentLibraryId.value = libId;
  Promise.allSettled([loadGraphData(), loadEntities(), loadRelations(), loadEntityTypes(), loadRelationTypes()]);
}

function openCreateLibrary() {
  editingLibrary.value = null;
  libraryForm.sysAiKnowledgeLibraryName = "";
  libraryForm.sysAiKnowledgeLibraryDescription = "";
  showLibraryDialog.value = true;
}

function openEditLibrary(lib: KnowledgeLibraryItem) {
  editingLibrary.value = lib;
  libraryForm.sysAiKnowledgeLibraryName = lib.sysAiKnowledgeLibraryName;
  libraryForm.sysAiKnowledgeLibraryDescription = lib.sysAiKnowledgeLibraryDescription || "";
  showLibraryDialog.value = true;
}

async function handleSaveLibrary() {
  const data: any = { ...libraryForm };
  if (editingLibrary.value) {
    data.sysAiKnowledgeLibraryId = editingLibrary.value.sysAiKnowledgeLibraryId;
    await updateLibrary(data);
    ElMessage.success("知识库已更新");
  } else {
    await createLibrary(data);
    ElMessage.success("知识库已创建");
  }
  showLibraryDialog.value = false;
  await loadLibraries();
}

async function handleDeleteLibrary(id: number) {
  if (id <= 1) { ElMessage.warning("默认知识库不可删除"); return; }
  try {
    await ElMessageBox.confirm("该知识库下的数据将迁移到默认知识库，确定删除？", "提示");
    await deleteLibrary(id);
    ElMessage.success("已删除");
    await loadLibraries();
    if (currentLibraryId.value === id) {
      currentLibraryId.value = 1;
      await Promise.allSettled([loadGraphData(), loadEntities(), loadRelations(), loadEntityTypes(), loadRelationTypes()]);
    }
  } catch { /* cancelled */ }
}

// ══════════════════════════════════════════════════════════════
// Graph
// ══════════════════════════════════════════════════════════════

const scGraphRef = ref<any>(null);
const graphData = reactive<{ nodes: KgGraphData['nodes'] | null; edges: KgGraphData['edges'] | null }>({ nodes: null, edges: null });
const graphFilter = reactive({ type: "", limit: 200 });
const selectedNode = ref<string | null>(null);
const neighbors = ref<any[]>([]);
const selectedNodeInfo = ref<{ name: string; type: string; weight?: number; logo?: string } | null>(null);
const detailPanelRef = ref<HTMLElement | null>(null);
const dragHandleRef = ref<HTMLElement | null>(null);

// ── Path finding ──
const showPathDialog = ref(false);
const pathFrom = ref("");
const pathTo = ref("");
const pathMaxDepth = ref(3);
const pathResult = ref<any[] | null>(null);
const pathSearchLoading = ref(false);
const pathSearching = ref(false);
const pathEntityOptions = ref<{uid: string; name: string}[]>([]);

// ── Clear graph ──
const clearingGraph = ref(false);

async function loadGraphData() {
  try {
    const res = await getGraphData({ type: graphFilter.type || undefined, limit: graphFilter.limit, libraryId: currentLibraryId.value });
    if (res.data) {
      graphData.nodes = res.data.nodes ?? [];
      graphData.edges = res.data.edges ?? [];
      selectedNode.value = null;
      neighbors.value = [];
    }
  } catch { ElMessage.error("加载图谱数据失败"); }
}

async function loadNeighbors(entityId: string) {
  try {
    const res = await getNeighbors(entityId);
    neighbors.value = res.data ?? [];
    const node = graphData.nodes?.find(n => n.id === entityId);
    selectedNodeInfo.value = node ? { name: node.label, type: node.group, weight: (node as any).weight, logo: (node as any).img } : null;
  } catch { /* ignore */ }
}

function handleGraphNodeClick(nodeId: string) { selectedNode.value = nodeId; loadNeighbors(nodeId); }

function handleNodeSelect(nodeId: string | null) {
  if (nodeId) { selectedNode.value = nodeId; loadNeighbors(nodeId); }
  else { selectedNode.value = null; neighbors.value = []; selectedNodeInfo.value = null; }
}

function handleGraphCanvasClick() { selectedNode.value = null; neighbors.value = []; selectedNodeInfo.value = null; }

async function handleFindPaths() {
  if (!pathFrom.value || !pathTo.value) { ElMessage.warning("请选择起点和终点实体"); return; }
  pathSearching.value = true;
  pathResult.value = null;
  try {
    const res = await findPaths({ fromUid: pathFrom.value, toUid: pathTo.value, maxDepth: pathMaxDepth.value });
    pathResult.value = res.data ?? [];
    if (!pathResult.value.length) ElMessage.info("未找到路径");
    else ElMessage.success(`找到 ${pathResult.value.length} 条路径`);
  } catch { ElMessage.error("路径查找失败"); }
  finally { pathSearching.value = false; }
}

async function searchPathEntities(query: string) {
  if (!query.trim()) { pathEntityOptions.value = []; return; }
  pathSearchLoading.value = true;
  try {
    const res = await listEntities({ keyword: query, page: 1, size: 20, libraryId: currentLibraryId.value });
    pathEntityOptions.value = (res.data?.records ?? []).map((e: KgEntityItem) => ({ uid: e.sysAiKnowledgeGraphEntityUid, name: e.sysAiKnowledgeGraphEntityName }));
  } catch { pathEntityOptions.value = []; }
  finally { pathSearchLoading.value = false; }
}

// ══════════════════════════════════════════════════════════════
// Entities
// ══════════════════════════════════════════════════════════════

const entityRecords = ref<KgEntityItem[]>([]);
const entityTotal = ref(0);
const entityLoading = ref(false);
const entityQuery = reactive({ keyword: "", type: "", page: 1, size: 20 });
const entityTypes = ref<string[]>([]);
const showEntityDialog = ref(false);
const editingEntity = ref<KgEntityItem | null>(null);
const entityForm = reactive({ name: "", type: "default", weight: 1.0, properties: "", logo: "" });
const selectedEntityIds = ref<number[]>([]);

async function loadEntities() {
  entityLoading.value = true;
  try {
    const res = await listEntities({ ...entityQuery, keyword: entityQuery.keyword || undefined, type: entityQuery.type || undefined, libraryId: currentLibraryId.value });
    if (res.data) { entityRecords.value = res.data.records ?? []; entityTotal.value = res.data.total ?? 0; }
  } catch { ElMessage.error("加载实体列表失败"); }
  finally { entityLoading.value = false; }
}

async function loadEntityTypes() {
  try { const res = await getEntityTypes({ libraryId: currentLibraryId.value }); entityTypes.value = res.data ?? []; } catch { /* ignore */ }
}

function openEntityDialog(entity?: KgEntityItem) {
  editingEntity.value = entity || null;
  entityForm.name = entity?.sysAiKnowledgeGraphEntityName || "";
  entityForm.type = entity?.sysAiKnowledgeGraphEntityType || "default";
  entityForm.weight = entity?.sysAiKnowledgeGraphEntityWeight ?? 1.0;
  entityForm.properties = entity?.sysAiKnowledgeGraphEntityProperties || "";
  entityForm.logo = entity?.sysAiKnowledgeGraphEntityLogo || "";
  showEntityDialog.value = true;
}

function editEntity(row: KgEntityItem) { openEntityDialog(row); }

async function handleSaveEntity() {
  const data: any = { sysAiKnowledgeGraphEntityName: entityForm.name, sysAiKnowledgeGraphEntityType: entityForm.type, sysAiKnowledgeGraphEntityWeight: entityForm.weight, sysAiKnowledgeGraphLibraryId: currentLibraryId.value };
  if (entityForm.properties) data.sysAiKnowledgeGraphEntityProperties = entityForm.properties;
  if (entityForm.logo) data.sysAiKnowledgeGraphEntityLogo = entityForm.logo;
  if (editingEntity.value) data.sysAiKnowledgeGraphEntityId = editingEntity.value.sysAiKnowledgeGraphEntityId;
  try {
    const fn = editingEntity.value ? updateEntity : createEntity;
    await fn(data);
    ElMessage.success(editingEntity.value ? "更新成功" : "创建成功");
    showEntityDialog.value = false;
    editingEntity.value = null;
    entityForm.name = ""; entityForm.type = "default"; entityForm.properties = ""; entityForm.logo = "";
    await loadEntities();
  } catch { ElMessage.error("操作失败"); }
}

async function handleDeleteEntity(id: number) {
  try {
    await ElMessageBox.confirm("确定删除该实体？关联的关系也将被删除。", "提示");
    await deleteEntity(id);
    ElMessage.success("删除成功");
    await loadEntities();
  } catch { /* cancelled */ }
}

async function handleBatchDeleteEntities() {
  if (!selectedEntityIds.value.length) { ElMessage.warning("请选择要删除的实体"); return; }
  try {
    await ElMessageBox.confirm(`确定批量删除 ${selectedEntityIds.value.length} 个实体？`, "提示");
    await batchDeleteEntities(selectedEntityIds.value);
    ElMessage.success(`已删除 ${selectedEntityIds.value.length} 个实体`);
    selectedEntityIds.value = [];
    await Promise.all([loadEntities(), loadGraphData()]);
  } catch { /* cancelled */ }
}

async function handleDeduplicateEntities() {
  try {
    await ElMessageBox.confirm("确定合并重复实体？系统将自动检测并合并名称相似的实体。", "合并确认", { type: "warning" });
    const res = await deduplicateEntities({ libraryId: currentLibraryId.value });
    const deleted = (res.data as any)?.deletedCount ?? 0;
    ElMessage.success(`合并完成，共清理 ${deleted} 个重复实体`);
    await Promise.all([loadEntities(), loadGraphData()]);
  } catch { /* cancelled */ }
}

// ══════════════════════════════════════════════════════════════
// Relations
// ══════════════════════════════════════════════════════════════

const relationRecords = ref<KgRelationItem[]>([]);
const relationTotal = ref(0);
const relationLoading = ref(false);
const relationQuery = reactive({ keyword: "", type: "", page: 1, size: 20 });
const relationTypes = ref<string[]>([]);
const showRelationDialog = ref(false);
const editingRelation = ref<KgRelationItem | null>(null);
const relationForm = reactive({ sourceEntityUid: "", targetEntityUid: "", type: "related_to", weight: 1.0, properties: "" });
const selectedRelationIds = ref<number[]>([]);
const entityOptions = ref<KgEntityItem[]>([]);
const allEntityOptions = ref<KgEntityItem[]>([]);

async function loadEntityOptions() {
  if (allEntityOptions.value.length) { entityOptions.value = allEntityOptions.value; return; }
  try {
    const res = await listEntities({ page: 1, size: 1000, libraryId: currentLibraryId.value });
    if (res.data) { allEntityOptions.value = res.data.records ?? []; entityOptions.value = allEntityOptions.value; }
  } catch { /* ignore */ }
}

function searchEntityOptions(query: string) {
  if (!query) { entityOptions.value = allEntityOptions.value; return; }
  const q = query.toLowerCase();
  entityOptions.value = allEntityOptions.value.filter(e =>
    e.sysAiKnowledgeGraphEntityName.toLowerCase().includes(q) ||
    (e.sysAiKnowledgeGraphEntityType || '').toLowerCase().includes(q));
}

async function loadRelations() {
  relationLoading.value = true;
  try {
    const res = await listRelations({ ...relationQuery, keyword: relationQuery.keyword || undefined, type: relationQuery.type || undefined, libraryId: currentLibraryId.value });
    if (res.data) { relationRecords.value = res.data.records ?? []; relationTotal.value = res.data.total ?? 0; }
  } catch { ElMessage.error("加载关系列表失败"); }
  finally { relationLoading.value = false; }
}

async function loadRelationTypes() {
  try { const res = await getRelationTypes({ libraryId: currentLibraryId.value }); relationTypes.value = res.data ?? []; } catch { /* ignore */ }
}

function openNewRelationDialog() {
  editingRelation.value = null;
  relationForm.sourceEntityUid = ""; relationForm.targetEntityUid = "";
  relationForm.type = "related_to"; relationForm.weight = 1.0; relationForm.properties = "";
  showRelationDialog.value = true;
  loadEntityOptions();
}

function editRelation(row: KgRelationItem) {
  editingRelation.value = row;
  relationForm.sourceEntityUid = row.sysAiKnowledgeGraphRelationSourceEntityUid;
  relationForm.targetEntityUid = row.sysAiKnowledgeGraphRelationTargetEntityUid;
  relationForm.type = row.sysAiKnowledgeGraphRelationType;
  relationForm.weight = row.sysAiKnowledgeGraphRelationWeight;
  relationForm.properties = row.sysAiKnowledgeGraphRelationProperties || "";
  showRelationDialog.value = true;
  loadEntityOptions();
}

async function handleSaveRelation() {
  const data: any = {
    sysAiKnowledgeGraphRelationSourceEntityUid: relationForm.sourceEntityUid,
    sysAiKnowledgeGraphRelationTargetEntityUid: relationForm.targetEntityUid,
    sysAiKnowledgeGraphRelationType: relationForm.type,
    sysAiKnowledgeGraphRelationWeight: relationForm.weight,
  };
  if (relationForm.properties) data.sysAiKnowledgeGraphRelationProperties = relationForm.properties;
  if (editingRelation.value) data.sysAiKnowledgeGraphRelationId = editingRelation.value.sysAiKnowledgeGraphRelationId;
  try {
    const fn = editingRelation.value ? updateRelation : createRelation;
    await fn(data);
    ElMessage.success(editingRelation.value ? "更新成功" : "创建成功");
    showRelationDialog.value = false;
    editingRelation.value = null;
    relationForm.sourceEntityUid = ""; relationForm.targetEntityUid = "";
    relationForm.type = "related_to"; relationForm.weight = 1.0; relationForm.properties = "";
    await loadRelations();
  } catch { ElMessage.error("操作失败"); }
}

async function handleDeleteRelation(id: number) {
  try {
    await ElMessageBox.confirm("确定删除该关系？", "提示");
    await deleteRelation(id);
    ElMessage.success("删除成功");
    await loadRelations();
  } catch { /* cancelled */ }
}

async function handleBatchDeleteRelations() {
  if (!selectedRelationIds.value.length) { ElMessage.warning("请选择要删除的关系"); return; }
  try {
    await ElMessageBox.confirm(`确定批量删除 ${selectedRelationIds.value.length} 个关系？`, "提示");
    await batchDeleteRelations(selectedRelationIds.value);
    ElMessage.success(`已删除 ${selectedRelationIds.value.length} 个关系`);
    selectedRelationIds.value = [];
    await Promise.all([loadRelations(), loadGraphData()]);
  } catch { /* cancelled */ }
}

// ══════════════════════════════════════════════════════════════
// LLM Extraction
// ══════════════════════════════════════════════════════════════

const extractText = ref("");
const extractingEntities = ref(false);
const extractingRelations = ref(false);
const extractedEntities = ref<any[]>([]);
const extractedRelations = ref<any[]>([]);
const extractResultTab = ref("entities");
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadedFile = ref<File | null>(null);
const fileDragging = ref(false);
const fileExtracting = ref(false);
const fileExtractProgress = ref(0);

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files?.length) handleFile(input.files[0]);
}

function handleFileDrop(event: DragEvent) {
  fileDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files?.length) handleFile(files[0]);
}

async function handleFile(file: File) {
  uploadedFile.value = file;
  fileExtracting.value = true;
  fileExtractProgress.value = 30;
  try {
    fileExtractProgress.value = 60;
    const res = await extractTextFromFile(file);
    fileExtractProgress.value = 90;
    if ((res as any).code === "00000" || res.success) {
      extractText.value = (res as any).data?.text ?? "";
      ElMessage.success(`从文件提取到 ${extractText.value.length} 字符文本`);
    } else {
      ElMessage.warning((res as any).msg || "提取失败");
    }
  } catch (e: any) { ElMessage.error(e?.msg || "文件处理失败"); }
  finally { fileExtracting.value = false; fileExtractProgress.value = 100; }
}

function clearFile() { uploadedFile.value = null; if (fileInputRef.value) fileInputRef.value.value = ""; }

async function handleExtractEntities() {
  if (!extractText.value.trim()) { ElMessage.warning("请输入文本"); return; }
  extractingEntities.value = true;
  try {
    const res = await apiExtractEntities({ text: extractText.value, libraryId: currentLibraryId.value });
    extractedEntities.value = res.data ?? [];
    extractResultTab.value = "entities";
    ElMessage.success(`抽取到 ${extractedEntities.value.length} 个实体`);
  } catch { ElMessage.error("实体抽取失败"); }
  finally { extractingEntities.value = false; }
}

async function handleExtractRelations() {
  if (!extractText.value.trim()) { ElMessage.warning("请输入文本"); return; }
  extractingRelations.value = true;
  try {
    const entityIds = extractedEntities.value.map(e => e.sysAiKnowledgeGraphEntityId);
    const res = await apiExtractRelations({ text: extractText.value, libraryId: currentLibraryId.value, entityIds });
    extractedRelations.value = res.data ?? [];
    extractResultTab.value = "relations";
    ElMessage.success(`抽取到 ${extractedRelations.value.length} 个关系`);
  } catch { ElMessage.error("关系抽取失败"); }
  finally { extractingRelations.value = false; }
}

// ══════════════════════════════════════════════════════════════
// RAG Document Management
// ══════════════════════════════════════════════════════════════

const uploadRef = ref<UploadInstance>();
const docList = ref<RagDocument[]>([]);
const docLoading = ref(false);
const docPage = ref(1);
const totalDocs = ref(0);
const resetting = ref(false);
const uploadQueue = ref<{ name: string; size: number; status: string; error?: string }[]>([]);

function handleFileSelectRag(uploadFile: any) {
  const file = uploadFile.raw as File;
  if (!file) return;
  const item = { name: file.name, size: file.size, status: "uploading" };
  uploadQueue.value.push(item);
  doUpload(file, uploadQueue.value.length - 1);
}

async function handleDrop(e: DragEvent) {
  const files = Array.from(e.dataTransfer?.files || []);
  for (const file of files) {
    const item = { name: file.name, size: file.size, status: "uploading" };
    uploadQueue.value.push(item);
    await doUpload(file, uploadQueue.value.length - 1);
  }
}

async function doUpload(file: File, idx: number) {
  try {
    const res = await uploadDocument(file);
    if (res.success) { uploadQueue.value[idx].status = "done"; loadDocuments(); }
    else { uploadQueue.value[idx].status = "error"; uploadQueue.value[idx].error = res.msg || "上传失败"; }
  } catch (e: any) { uploadQueue.value[idx].status = "error"; uploadQueue.value[idx].error = e?.message || "上传异常"; }
}

async function loadDocuments() {
  docLoading.value = true;
  try {
    const res = await listDocuments(docPage.value, 20);
    if (res.success && res.data) { docList.value = res.data.items || []; totalDocs.value = res.data.total || 0; }
  } finally { docLoading.value = false; }
}

async function handleDelete(row: RagDocument) {
  try {
    await ElMessageBox.confirm(`确定删除 "${row.fileName}"？`, "删除确认", { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" });
    const res = await deleteDocument(row.id);
    if (res.success) { ElMessage.success("删除成功"); loadDocuments(); } else { ElMessage.error(res.msg || "删除失败"); }
  } catch { /* cancelled */ }
}

async function handleReset() {
  try {
    await ElMessageBox.confirm("将清空向量存储并重新索引所有文档，确定继续？", "重新索引", { type: "warning", confirmButtonText: "确定", cancelButtonText: "取消" });
    resetting.value = true;
    const res = await resetRag();
    if (res.success) ElMessage.success(`重新索引完成，共 ${res.data || 0} 个文档`);
  } catch { /* cancelled */ }
  finally { resetting.value = false; }
}

// ══════════════════════════════════════════════════════════════
// RAG Q&A
// ══════════════════════════════════════════════════════════════

const chatRef = ref<HTMLElement | null>(null);
const ragQueryText = ref("");
const queryLoading = ref(false);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { documentId: string; content: string; score: number }[];
  sourcesVisible?: boolean;
  loading?: boolean;
}

const messages = ref<ChatMessage[]>([]);

async function sendQuery() {
  const text = ragQueryText.value.trim();
  if (!text || queryLoading.value) return;
  ragQueryText.value = "";
  messages.value.push({ role: "user", content: text });
  const aiMsg: ChatMessage = { role: "assistant", content: "", loading: true };
  messages.value.push(aiMsg);
  queryLoading.value = true;
  try {
    const res = await ragQuery(text);
    if (res.success && res.data) {
      aiMsg.loading = false;
      aiMsg.content = res.data.answer || "暂无回答";
      aiMsg.sources = (res.data as any).sources || [];
      aiMsg.sourcesVisible = aiMsg.sources.length <= 3;
    } else { aiMsg.loading = false; aiMsg.content = "查询失败: " + (res.msg || "未知错误"); }
  } catch (e: any) { aiMsg.loading = false; aiMsg.content = "查询异常: " + (e?.message || ""); }
  finally { queryLoading.value = false; scrollToBottom(); }
}

function scrollToBottom() { setTimeout(() => { chatRef.value && (chatRef.value.scrollTop = chatRef.value.scrollHeight); }, 50); }

// ══════════════════════════════════════════════════════════════
// Settings (RAG)
// ══════════════════════════════════════════════════════════════

const ragSettings = reactive({
  embeddingEngine: "memory", vectorStorage: "jvector",
  llmProvider: "", llmModel: "", llmApiKey: "", llmBaseUrl: "",
  chunkSize: 1000, chunkOverlap: 200, defaultTopK: 5, defaultSimilarityThreshold: 0.7,
});

// ══════════════════════════════════════════════════════════════
// Settings (KG)
// ══════════════════════════════════════════════════════════════

const kgSettingValues = reactive<Record<string, string>>({});
const kgBoolSettings = reactive<Record<string, boolean>>({});
const kgNumSettings = reactive<Record<string, number>>({});

const kgSettingLabels: Record<string, string> = {
  enabled: "启用知识图谱",
  extraction_prompt_template: "抽取提示词模板",
  relation_extraction_enabled: "启用关系抽取",
  max_entities_per_doc: "单文档最大实体数",
  embedding_dimension: "向量维度",
  vector_storage_engine: "向量引擎",
};
const kgBoolKeys = new Set(["enabled", "relation_extraction_enabled"]);
const kgNumKeys = new Set(["max_entities_per_doc", "embedding_dimension"]);

async function loadKgSettings() {
  try {
    const res = await listAiGlobalSettings("knowledge_graph");
    if (res.data) {
      for (const item of res.data) {
        const field = item.sysAiGlobalSettingField;
        if (field === "llm_provider" || field === "llm_model") continue;
        const value = item.sysAiGlobalSettingValue ?? "";
        kgSettingValues[field] = value;
        if (kgBoolKeys.has(field)) kgBoolSettings[field] = value === "true";
        if (kgNumKeys.has(field)) kgNumSettings[field] = parseInt(value) || 0;
      }
    }
  } catch { /* ignore */ }
}

async function updateKgSetting(field: string, _value: any) {
  const settings = Object.entries(kgSettingValues).map(([k, v]) => ({
    sysAiGlobalSettingGroup: "knowledge_graph",
    sysAiGlobalSettingField: k,
    sysAiGlobalSettingValue: kgBoolKeys.has(k) ? String(kgBoolSettings[k]) : kgNumKeys.has(k) ? String(kgNumSettings[k]) : v,
    sysAiGlobalSettingStatus: 1,
  }));
  try { await replaceAiGlobalSettings(settings, "knowledge_graph"); ElMessage.success("设置已更新"); }
  catch { ElMessage.error("保存设置失败"); }
}

async function updateKgNumSetting(field: string, value: number) {
  kgSettingValues[field] = String(value);
  await updateKgSetting(field, value);
}

async function handleClearGraph() {
  try {
    await ElMessageBox.confirm("确定清空当前图库？此操作将删除当前知识库下所有实体和关系，不可恢复！", "清空图库", { type: "error", confirmButtonText: "确认清空", cancelButtonText: "取消" });
    clearingGraph.value = true;
    await clearGraph({ libraryId: currentLibraryId.value });
    ElMessage.success("图库已清空");
    await Promise.all([loadGraphData(), loadEntities(), loadRelations()]);
  } catch { /* cancelled */ }
  finally { clearingGraph.value = false; }
}

// ══════════════════════════════════════════════════════════════
// Utilities
// ══════════════════════════════════════════════════════════════

function getFileIcon(type: string): string {
  const map: Record<string, string> = {
    pdf: "ri:file-pdf-2-line", doc: "ri:file-word-2-line", docx: "ri:file-word-2-line",
    md: "ri:markdown-line", txt: "ri:file-text-line", csv: "ri:file-excel-2-line",
    json: "ri:file-code-line", xml: "ri:file-code-line", html: "ri:html5-line", htm: "ri:html5-line",
    java: "ri:code-line", ts: "ri:code-line", js: "ri:code-line", py: "ri:code-line",
    yaml: "ri:file-code-line", yml: "ri:file-code-line",
  };
  return map[type.toLowerCase()] || "ri:file-2-line";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", { hour12: false });
}

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rag-code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rag-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
  return html;
}

// ══════════════════════════════════════════════════════════════
// Init
// ══════════════════════════════════════════════════════════════

onMounted(async () => {
  // 尝试动态加载 ScGraph 图谱组件
  try {
    const mod = await import("@repo/components/ScGraph");
    const comp = mod.ScGraph || mod.default;
    if (comp) {
      ScGraphComponent.value = markRaw(comp);
      scGraphAvailable.value = true;
    }
  } catch { /* ScGraph 不可用 */ }

  await loadLibraries();
  await Promise.allSettled([
    loadDocuments(),
    loadGraphData(),
    loadEntities(),
    loadRelations(),
    loadKgSettings(),
    loadEntityTypes(),
    loadRelationTypes(),
  ]);
  nextTick(() => {
    if (detailPanelRef.value && dragHandleRef.value) {
      useDraggable(detailPanelRef, { handle: dragHandleRef, initialValue: { x: 20, y: 80 } });
    }
  });
});
</script>

<style scoped lang="scss">
// ── Layout ──
.merged-workbench {
  min-height: 100%; height: 100%;
  display: flex; flex-direction: column; padding: 0;
}

// ── Ambient Glow ──
.merged-workbench__glow {
  position: fixed; border-radius: 50%; filter: blur(80px);
  pointer-events: none; z-index: 0;
  &--primary { top: -60px; left: 5%; width: 400px; height: 400px; background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.10), transparent 70%); }
  &--purple { bottom: -80px; right: 10%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.06), transparent 70%); filter: blur(100px); }
}

// ── Header (face-library style) ──
.merged-workbench__header {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0; position: relative; z-index: 1;
}
.merged-workbench__back {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-secondary); font-size: 18px;
  cursor: pointer; flex-shrink: 0;
  transition: all 0.2s;
  &:hover { background: var(--el-fill-color-light); transform: translateX(-2px); }
}
.merged-workbench__header-body { min-width: 0; }
.merged-workbench__header-title { margin: 0; font-size: 18px; font-weight: 700; color: var(--el-text-color-primary); }
.merged-workbench__header-desc { margin: 2px 0 0; font-size: 12px; color: var(--el-text-color-secondary); }
.merged-workbench__nav { margin-left: auto; display: flex; gap: 4px; }
.merged-workbench__nav-item {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 14px; border-radius: 6px; font-size: 13px;
  border: none; cursor: pointer; background: transparent;
  color: var(--el-text-color-secondary); white-space: nowrap;
  transition: all 0.15s;
  &:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
  &.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
}

// ── Panel ──
.merged-workbench__panel {
  flex: 1; padding: 20px 24px; overflow: auto;
  position: relative; z-index: 1;
  &--full { display: flex; flex-direction: column; padding-bottom: 0; }
  &--chat { display: flex; flex-direction: column; padding-bottom: 0; overflow: hidden; }
}

// ═══════════════════════════════════════════════════════════════════
// KG Graph
// ═══════════════════════════════════════════════════════════════════
.kg-graph-toolbar {
  display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  padding: 10px 16px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid var(--el-border-color-light);
  border-radius: 10px; flex-shrink: 0;
  :root.dark & { background: rgba(30,30,35,0.8); }
}
.kg-graph-filters { display: flex; align-items: center; gap: 8px; }
.kg-graph-stats { margin-left: auto; display: flex; gap: 6px; }
.kg-stat-pill {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;
  &--nodes { background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); color: var(--el-color-primary); }
  &--edges { background: color-mix(in srgb, var(--el-color-success) 12%, transparent); color: var(--el-color-success); }
}
.kg-graph-container {
  flex: 1; border-radius: 12px; overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color); position: relative;
}
.sg-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; gap: 8px; color: var(--el-text-color-secondary); font-size: 14px;
  .sg-placeholder-icon { font-size: 48px; opacity: 0.4; }
  p { margin: 0; font-weight: 500; }
  span { font-size: 12px; color: var(--el-text-color-placeholder); }
}
// KG Detail Panel (draggable)
.kg-detail-panel {
  position: fixed; z-index: 100; width: 240px; max-height: 400px; overflow-y: auto;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.12); font-size: 13px;
  :root.dark & { background: rgba(30,30,35,0.92); border-color: rgba(255,255,255,0.08); }
  &__handle { display: flex; align-items: center; gap: 6px; padding: 10px 14px; cursor: grab; font-weight: 600; font-size: 13px; color: var(--el-text-color-primary); border-bottom: 1px solid var(--el-border-color-light); user-select: none; &:active { cursor: grabbing; } }
  &__content { padding: 10px 14px; }
  &__row { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
  &__label { color: var(--el-text-color-secondary); font-size: 12px; flex-shrink: 0; min-width: 36px; }
  &__value { font-weight: 500; color: var(--el-text-color-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__logo-img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; }
  &__divider { height: 1px; background: var(--el-border-color-light); margin: 8px 0; }
  &__section-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); margin-bottom: 6px; }
  &__count { margin-left: auto; background: var(--el-color-primary-light-9); color: var(--el-color-primary); padding: 0 8px; border-radius: 10px; font-size: 11px; line-height: 18px; }
  &__neighbor { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; &:hover { background: var(--el-fill-color-light); } }
  &__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  &__neighbor-name { flex: 1; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__neighbor-type { font-size: 11px; color: var(--el-text-color-placeholder); flex-shrink: 0; }
  &__empty { font-size: 12px; color: var(--el-text-color-placeholder); text-align: center; padding: 12px 0; }
}

// ═══════════════════════════════════════════════════════════════════
// KG Extract
// ═══════════════════════════════════════════════════════════════════
.kg-extract {
  display: flex; gap: 20px; flex: 1; align-items: stretch;
  > * { width: 50%; display: flex; flex-direction: column; }
}
.kg-extract__input-card, .kg-extract__result-card {
  background: var(--el-bg-color); border-radius: 12px; border: 1px solid var(--el-border-color-light);
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); transition: box-shadow 0.25s;
  &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
}
.kg-extract__card-header {
  display: flex; align-items: center; gap: 8px; padding: 14px 18px; font-size: 14px; font-weight: 600;
  background: var(--el-fill-color-blank); border-bottom: 1px solid var(--el-border-color-light);
  color: var(--el-text-color-primary);
  .kg-extract__result-badge { margin-left: auto; }
}
.kg-extract__card-body { padding: 16px 18px; flex: 1; display: flex; flex-direction: column; }
.kg-extract__file-zone {
  border: 1.5px dashed color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  border-radius: 10px; padding: 20px 16px; margin-bottom: 14px; cursor: pointer;
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  transition: all 0.25s;
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  &.is-dragover { border-color: var(--el-color-primary); background: color-mix(in srgb, var(--el-bg-color) 84%, var(--el-color-primary)); transform: scale(1.01); }
  &:hover { border-color: var(--el-color-primary); }
  p { margin: 0; font-size: 13px; color: var(--el-text-color-secondary); }
}
.kg-extract__upload-icon-wrap {
  width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 80%, #0f172a), color-mix(in srgb, var(--el-color-info) 78%, #0f172a));
  .kg-extract__upload-icon { font-size: 22px; color: #e8f3ff; }
}
.kg-extract__file-hint { flex: 1; small { color: var(--el-text-color-placeholder); } }
.kg-extract__file-info { flex: 1; display: flex; align-items: center; gap: 6px; color: var(--el-text-color-primary) !important; }
.kg-extract__file-progress { width: 100%; display: flex; align-items: center; gap: 8px; span { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; } :deep(.el-progress) { flex: 1; } }
.kg-extract__textarea { :deep(.el-textarea__inner) { border-radius: 8px; font-size: 13px; } }
.kg-extract__actions { display: flex; gap: 10px; margin-top: 14px; }
.kg-extract__primary-btn {
  padding-left: 22px; padding-right: 22px;
  background: linear-gradient(135deg, var(--el-color-primary), color-mix(in srgb, var(--el-color-primary) 70%, #000)); border: none;
  &:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(var(--el-color-primary-rgb), 0.35); }
}
.kg-extract__secondary-btn { padding-left: 20px; padding-right: 20px; }
.kg-extract__tabs { :deep(.el-tabs__header) { margin-bottom: 12px; } :deep(.el-tabs__item) { font-size: 13px; } }

// ═══════════════════════════════════════════════════════════════════
// KG Card (for tables)
// ═══════════════════════════════════════════════════════════════════
.kg-card {
  background: var(--el-bg-color); border-radius: 12px; border: 1px solid var(--el-border-color-light);
  overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); display: flex; flex-direction: column;
  &__header { display: flex; align-items: center; gap: 12px; padding: 12px 18px; background: var(--el-fill-color-blank); border-bottom: 1px solid var(--el-border-color-light); flex-wrap: wrap; }
  &__header-left { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
  &__header-right { margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  &__footer { display: flex; justify-content: flex-end; padding: 10px 18px; border-top: 1px solid var(--el-border-color-light); background: var(--el-fill-color-blank); }
}
:deep(.kg-table) {
  border-radius: 0;
  .el-table__header-wrapper .el-table__header th.el-table__cell { background: var(--el-fill-color-lighter); font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
  .el-table__body-wrapper .el-table__body td.el-table__cell { font-size: 13px; }
}
.kg-action-btn { border-radius: 6px; font-size: 12px; padding: 5px 10px; transition: all 0.2s; &:hover { transform: translateY(-1px); } &--danger { &:hover { box-shadow: 0 2px 8px rgba(var(--el-color-danger-rgb), 0.3); } } }
.kg-type-tag {
  display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; line-height: 20px;
  &--person { background: color-mix(in srgb, var(--el-color-success) 14%, transparent); color: var(--el-color-success); }
  &--org { background: color-mix(in srgb, var(--el-color-warning) 14%, transparent); color: var(--el-color-warning); }
  &--product { background: color-mix(in srgb, var(--el-color-primary) 14%, transparent); color: var(--el-color-primary); }
  &--tech { background: color-mix(in srgb, var(--el-color-info) 14%, transparent); color: var(--el-color-info); }
  &--tool { background: color-mix(in srgb, var(--el-color-danger) 14%, transparent); color: var(--el-color-danger); }
  &--lang { background: color-mix(in srgb, var(--el-color-success) 14%, transparent); color: var(--el-color-success); }
  &--server { background: color-mix(in srgb, var(--el-color-info) 14%, transparent); color: var(--el-color-info); }
  &--relation { background: color-mix(in srgb, var(--el-color-primary) 10%, transparent); color: var(--el-color-primary); }
  &--default { background: color-mix(in srgb, #909399 14%, transparent); color: #909399; }
}
.kg-entity-link { color: var(--el-color-primary); font-weight: 500; cursor: default; }
.kg-weight-badge {
  display: inline-block; padding: 1px 10px; border-radius: 10px;
  font-size: 12px; font-weight: 600; color: #fff; line-height: 20px; min-width: 36px; text-align: center;
}

// ═══════════════════════════════════════════════════════════════════
// RAG Documents
// ═══════════════════════════════════════════════════════════════════
.rag-upload-area { margin-bottom: 20px; }
.rag-upload__content { text-align: center; padding: 30px 0; }
.rag-upload__icon { font-size: 48px; color: var(--el-color-primary); margin-bottom: 12px; }
.rag-upload__text { font-size: 14px; color: var(--el-text-color-regular); margin: 0; em { color: var(--el-color-primary); font-style: normal; font-weight: 600; } }
.rag-upload__hint { font-size: 12px; color: var(--el-text-color-secondary); margin: 4px 0 0; }
.rag-upload-queue { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.rag-upload-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary)); font-size: 13px;
  &__icon { font-size: 16px; &--uploading { color: var(--el-color-primary); animation: spin 1s linear infinite; } &--done { color: var(--el-color-success); } &--error { color: var(--el-color-danger); } }
  &__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__size { color: var(--el-text-color-secondary); font-size: 12px; white-space: nowrap; }
  &__status { font-size: 12px; &--ok { color: var(--el-color-success); } &--err { color: var(--el-color-danger); } }
}
.rag-documents__toolbar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.rag-documents__count { font-size: 13px; color: var(--el-text-color-secondary); }
.rag-documents__actions { display: flex; gap: 8px; }
.rag-documents__pagination { display: flex; justify-content: center; margin-top: 16px; }
.rag-doc-name { display: flex; align-items: center; gap: 8px; &__icon { font-size: 18px; color: var(--el-color-primary); } }

// ═══════════════════════════════════════════════════════════════════
// RAG Chat
// ═══════════════════════════════════════════════════════════════════
.rag-chat {
  flex: 1; overflow-y: auto; padding: 16px 0;
  display: flex; flex-direction: column; gap: 16px;
  &__empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--el-text-color-secondary); gap: 8px; }
  &__empty-icon { font-size: 48px; opacity: 0.4; }
  &__msg { display: flex; &--user { justify-content: flex-end; } &--assistant { justify-content: flex-start; } }
  &__bubble { max-width: 75%; padding: 12px 16px; border-radius: 12px; font-size: 14px; line-height: 1.6; }
  &__msg--user &__bubble { background: var(--el-color-primary); color: #fff; border-bottom-right-radius: 4px; }
  &__msg--assistant &__bubble { background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary)); border: 1px solid var(--el-border-color-light); border-bottom-left-radius: 4px; }
  &__typing { display: flex; gap: 4px; padding: 4px 0; }
  &__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--el-text-color-secondary); animation: typingBounce 1.4s infinite; &:nth-child(2) { animation-delay: 0.2s; } &:nth-child(3) { animation-delay: 0.4s; } }
  &__sources { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--el-border-color-light); }
  &__sources-toggle { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--el-color-primary); cursor: pointer; background: none; border: none; padding: 4px 0; }
  &__sources-list { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
  &__source-item { padding: 8px 10px; border-radius: 6px; background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary)); font-size: 12px; }
  &__source-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
  &__source-doc { color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__source-content { margin: 0; color: var(--el-text-color-regular); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  &__input-area { flex-shrink: 0; padding: 12px 0; }
  &__input-wrapper { display: flex; align-items: center; gap: 8px; border: 1px solid var(--el-border-color); border-radius: 12px; padding: 4px 4px 4px 16px; background: var(--el-bg-color); transition: border-color 0.2s; &:focus-within { border-color: var(--el-color-primary); } }
  &__input { flex: 1; border: none; outline: none; font-size: 14px; background: transparent; color: var(--el-text-color-primary); }
  &__send { width: 36px; height: 36px; border-radius: 8px; border: none; background: var(--el-color-primary); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: opacity 0.2s; &:disabled { opacity: 0.4; cursor: not-allowed; } }
}
:deep(.rag-code-block) { background: #1e1e2e; color: #cdd6f4; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; line-height: 1.5; margin: 8px 0; }
:root.dark :deep(.rag-code-block) { background: #0f0f1a; }
:deep(.rag-inline-code) { background: color-mix(in srgb, var(--el-bg-color) 80%, var(--el-color-primary)); padding: 2px 6px; border-radius: 4px; font-size: 13px; }

// ═══════════════════════════════════════════════════════════════════
// Merged Settings
// ═══════════════════════════════════════════════════════════════════
.merged-settings { max-width: 720px; }
.merged-settings-section {
  margin-bottom: 24px; padding: 16px 20px;
  border: 1px solid var(--el-border-color-light); border-radius: 12px;
  background: var(--el-bg-color);
  &__head { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; strong { font-size: 14px; } }
}
.merged-settings-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.merged-settings-field { label { display: block; font-size: 13px; margin-bottom: 4px; color: var(--el-text-color-secondary); } }
.merged-settings-tip { font-size: 12px; color: var(--el-text-color-secondary); text-align: center; margin-top: 16px; }

.kg-settings-group { display: flex; flex-direction: column; gap: 12px; }
.kg-settings-item {
  display: flex; align-items: center; gap: 16px;
  padding: 14px 18px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary));
  transition: border-color 0.2s;
  &:hover { border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color)); }
}
.kg-settings-label { width: 160px; font-size: 13px; font-weight: 500; flex-shrink: 0; color: var(--el-text-color-primary); }
.kg-settings-control { flex: 1; display: flex; align-items: center; }
.kg-settings-tip { margin-top: 12px; font-size: 12px; color: var(--el-text-color-secondary); }

// ═══════════════════════════════════════════════════════════════════
// Dialogs
// ═══════════════════════════════════════════════════════════════════
.kg-dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35); backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 2000; display: flex; align-items: center; justify-content: center;
  animation: dialogOverlayIn 0.2s ease;
}
.kg-dialog {
  background: var(--el-bg-color); border-radius: 16px;
  width: 480px; max-width: 90vw; max-height: 80vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  animation: dialogSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  &__header { padding: 20px 24px 0; h3 { margin: 0; font-size: 16px; font-weight: 600; } }
  &__body { padding: 20px 24px; }
  &__footer { display: flex; justify-content: flex-end; gap: 8px; padding: 0 24px 20px; }
}

@keyframes dialogOverlayIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes dialogSlideIn { from { transform: translateY(24px) scale(0.97); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes typingBounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

// ── Toolbar extras ──
.kg-toolbar-divider { width: 1px; height: 24px; background: var(--el-border-color); margin: 0 4px; flex-shrink: 0; }
.kg-zoom-group { :deep(.el-button) { padding: 5px 10px; font-size: 15px; } }

// ── Dialog sm ──
.kg-dialog--sm { width: 420px; }

// ── Path result ──
.kg-path-result { margin-top: 16px; border-top: 1px solid var(--el-border-color-light); padding-top: 14px; }
.kg-path-result__paths { display: flex; flex-direction: column; gap: 10px; }
.kg-path-item {
  padding: 10px 14px; border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  border: 1px solid var(--el-border-color-light);
  &__title { font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); margin-bottom: 6px; }
  &__nodes { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; }
}
.kg-path-step {
  display: inline-flex; align-items: center; gap: 2px;
  &__name { font-size: 13px; padding: 2px 8px; border-radius: 4px; background: color-mix(in srgb, var(--el-color-primary) 10%, transparent); color: var(--el-color-primary); font-weight: 500; }
  &__arrow { color: var(--el-text-color-placeholder); font-size: 16px; display: inline-flex; }
}
.kg-path-empty { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 24px 0; color: var(--el-text-color-secondary); font-size: 14px; }
</style>
