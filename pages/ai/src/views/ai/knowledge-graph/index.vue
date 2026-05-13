<template>
  <section class="kg-workbench system-container modern-bg">
    <!-- Ambient glow effects -->
    <div class="kg-glow kg-glow--primary" />
    <div class="kg-glow kg-glow--purple" />

    <!-- Header -->
    <div class="kg-workbench__header">
      <button class="kg-workbench__back" type="button" @click="router.push('/ai')">
        <IconifyIconOnline icon="ri:arrow-left-s-line" />
      </button>
      <div class="kg-workbench__header-info">
        <h2>知识图谱</h2>
        <p>构建实体关系网络，智能抽取与分析</p>
      </div>
      <div class="kg-workbench__library-selector">
        <el-select v-model="currentLibraryId" size="small" style="width:160px" @change="switchLibrary">
          <el-option
            v-for="lib in libraryList" :key="lib.sysAiKnowledgeLibraryId"
            :label="lib.sysAiKnowledgeLibraryName"
            :value="lib.sysAiKnowledgeLibraryId"
          />
        </el-select>
        <el-button size="small" circle @click="openCreateLibrary">
          <IconifyIconOnline icon="ri:add-line" />
        </el-button>
        <el-button size="small" circle @click="openEditLibrary(libraryList.find(l => l.sysAiKnowledgeLibraryId === currentLibraryId) || libraryList[0])">
          <IconifyIconOnline icon="ri:settings-4-line" />
        </el-button>
      </div>
      <nav class="kg-workbench__nav">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="kg-workbench__nav-btn"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="activeTab = tab.key"
        >
          <IconifyIconOnline :icon="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </div>

    <!-- Tab: 图谱视图 -->
    <div v-if="activeTab === 'graph'" class="kg-workbench__panel kg-panel--graph">
      <div class="kg-workbench__graph-toolbar">
        <div class="kg-workbench__graph-filters">
          <el-input v-model="graphFilter.type" placeholder="按类型筛选" clearable style="width:160px" @change="loadGraphData" />
          <el-input-number v-model="graphFilter.limit" :min="20" :max="500" :step="20" size="small" />
          <el-button type="primary" size="small" round @click="loadGraphData">
            <IconifyIconOnline icon="ri:refresh-line" style="margin-right:4px" />刷新
          </el-button>
        </div>
        <div class="kg-workbench__graph-stats" v-if="graphData.nodes">
          <span class="stat-pill stat-pill--nodes">{{ graphData.nodes.length }} 节点</span>
          <span class="stat-pill stat-pill--edges">{{ graphData.edges.length }} 边</span>
        </div>
      </div>
      <div class="kg-workbench__graph-container">
        <ScGraph
        ref="scGraphRef"
        :nodes="graphData.nodes || []"
        :edges="graphData.edges || []"
        show-toolbar
        height="100%"
        @node-click="handleGraphNodeClick"
        @canvas-click="handleGraphCanvasClick"
        @node-select="handleNodeSelect"
      />
        <!-- Draggable detail panel -->
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
              <IconifyIconOnline icon="ri:share-node-line" />
              关联邻居
              <span class="kg-detail-panel__count">{{ neighbors.length }}</span>
            </div>
            <div v-for="n in neighbors" :key="n.id" class="kg-detail-panel__neighbor" @click="handleNodeSelect(n.id)">
              <span class="kg-detail-panel__dot" :style="{ background: '#409eff' }" />
              <span class="kg-detail-panel__neighbor-name">{{ n.name }}</span>
              <small class="kg-detail-panel__neighbor-type">{{ n.type }}</small>
            </div>
            <div v-if="neighbors.length === 0" class="kg-detail-panel__empty">无关联节点</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: 实体管理 -->
    <div v-if="activeTab === 'entities'" class="kg-workbench__panel">
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
            <el-button :disabled="selectedEntityIds.length === 0" type="danger" size="small" round @click="handleBatchDeleteEntities">
              <IconifyIconOnline icon="ri:delete-bin-line" style="margin-right:4px" />批量删除{{ selectedEntityIds.length ? ` (${selectedEntityIds.length})` : '' }}
            </el-button>
            <el-button type="primary" round @click="showEntityDialog = true">
              <IconifyIconOnline icon="ri:add-line" style="margin-right:4px" />新建实体
            </el-button>
          </div>
        </div>
        <el-table :data="entityRecords" v-loading="entityLoading" stripe style="width:100%" class="kg-table" @selection-change="(rows: any[]) => selectedEntityIds = rows.map((r: any) => r.sysAiKnowledgeGraphEntityId)">
          <el-table-column type="selection" width="40" />
          <el-table-column prop="sysAiKnowledgeGraphEntityName" label="名称" min-width="140" />
          <el-table-column label="类型" width="130">
            <template #default="{ row }">
              <span class="kg-type-tag" :class="'kg-type-tag--' + (typeTagColor(row.sysAiKnowledgeGraphEntityType) || 'default')">
                {{ row.sysAiKnowledgeGraphEntityType }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="sysAiKnowledgeGraphEntitySource" label="来源" width="110" />
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">{{ row.createTime }}</template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button size="small" class="kg-action-btn" @click="editEntity(row)">
                <IconifyIconOnline icon="ri:edit-line" />编辑
              </el-button>
              <el-button size="small" type="danger" class="kg-action-btn kg-action-btn--danger" @click="handleDeleteEntity(row.sysAiKnowledgeGraphEntityId)">
                <IconifyIconOnline icon="ri:delete-bin-line" />删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="kg-card__footer">
          <el-pagination
            v-model:page-size="entityQuery.size"
            v-model:current-page="entityQuery.page"
            :total="entityTotal"
            :page-sizes="[10,20,50]"
            layout="total,sizes,prev,pager,next"
            small
            @change="loadEntities"
          />
        </div>
      </div>
    </div>

    <!-- Tab: 关系管理 -->
    <div v-if="activeTab === 'relations'" class="kg-workbench__panel">
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
            <el-button :disabled="selectedRelationIds.length === 0" type="danger" size="small" round @click="handleBatchDeleteRelations">
              <IconifyIconOnline icon="ri:link-unlink" style="margin-right:4px" />批量删除{{ selectedRelationIds.length ? ` (${selectedRelationIds.length})` : '' }}
            </el-button>
            <el-button type="primary" round @click="openNewRelationDialog">
              <IconifyIconOnline icon="ri:add-line" style="margin-right:4px" />新建关系
            </el-button>
          </div>
        </div>
        <el-table :data="relationRecords" v-loading="relationLoading" stripe style="width:100%" class="kg-table" @selection-change="(rows: any[]) => selectedRelationIds = rows.map((r: any) => r.sysAiKnowledgeGraphRelationId)">
          <el-table-column type="selection" width="40" />
          <el-table-column label="源实体" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="kg-entity-link">{{ row.sysAiKnowledgeGraphRelationSourceEntityName || row.sysAiKnowledgeGraphRelationSourceEntityUid }}</span>
            </template>
          </el-table-column>
          <el-table-column label="目标实体" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="kg-entity-link">{{ row.sysAiKnowledgeGraphRelationTargetEntityName || row.sysAiKnowledgeGraphRelationTargetEntityUid }}</span>
            </template>
          </el-table-column>
          <el-table-column label="关系类型" width="130">
            <template #default="{ row }">
              <span class="kg-type-tag kg-type-tag--relation">
                {{ row.sysAiKnowledgeGraphRelationType }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="权重" width="90">
            <template #default="{ row }">
              <span class="kg-weight-badge" :style="{ background: getWeightColor(row.sysAiKnowledgeGraphRelationWeight) }">
                {{ row.sysAiKnowledgeGraphRelationWeight?.toFixed(1) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">{{ row.createTime }}</template>
          </el-table-column>
          <el-table-column label="操作" width="170" fixed="right">
            <template #default="{ row }">
              <el-button size="small" class="kg-action-btn" @click="editRelation(row)">
                <IconifyIconOnline icon="ri:edit-line" />编辑
              </el-button>
              <el-button size="small" type="danger" class="kg-action-btn kg-action-btn--danger" @click="handleDeleteRelation(row.sysAiKnowledgeGraphRelationId)">
                <IconifyIconOnline icon="ri:link-unlink" />删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="kg-card__footer">
          <el-pagination
            v-model:page-size="relationQuery.size"
            v-model:current-page="relationQuery.page"
            :total="relationTotal"
            :page-sizes="[10,20,50]"
            layout="total,sizes,prev,pager,next"
            small
            @change="loadRelations"
          />
        </div>
      </div>
    </div>

    <!-- Tab: LLM 抽取 -->
    <div v-if="activeTab === 'extract'" class="kg-workbench__panel">
      <div class="kg-extract">
        <div class="kg-extract__input-card">
          <div class="kg-extract__card-header">
            <IconifyIconOnline icon="ri:input-field" />
            <span>输入文本</span>
          </div>
          <div class="kg-extract__card-body">
            <!-- 文件上传区域 -->
            <div class="kg-extract__file-zone" :class="{ 'is-dragover': fileDragging }"
              @dragover.prevent="fileDragging = true"
              @dragleave.prevent="fileDragging = false"
              @drop.prevent="handleFileDrop"
              @click="fileInputRef?.click()">
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
            <el-input
              v-model="extractText" type="textarea" :rows="8" class="kg-extract__textarea"
              placeholder="请粘贴或输入需要抽取实体的文本内容..."
            />
            <div class="kg-extract__actions">
              <el-button type="primary" :loading="extractingEntities" @click="handleExtractEntities" round class="kg-extract__primary-btn">
                <IconifyIconOnline icon="ri:sparkling-2-line" style="margin-right:6px" />抽取实体
              </el-button>
              <el-button :loading="extractingRelations" :disabled="extractedEntities.length === 0" @click="handleExtractRelations" round class="kg-extract__secondary-btn">
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

    <!-- Tab: 查询 -->
    <div v-if="activeTab === 'query'" class="kg-workbench__panel">
      <div class="kg-query">
        <div class="kg-query__input-card">
          <div class="kg-query__card-header">
            <IconifyIconOnline icon="ri:chat-question-line" />
            <span>向知识图谱提问</span>
          </div>
          <div class="kg-query__card-body">
            <div class="kg-query__input-row">
              <el-input
                v-model="queryText" type="textarea" :rows="3"
                placeholder="输入关于知识图谱的自然语言问题，例如：阿里巴巴的创始人是谁？"
              />
            </div>
            <div class="kg-query__actions">
              <el-button type="primary" :loading="queryLoading" @click="handleQuery" round size="large" class="kg-query__ask-btn">
                <IconifyIconOnline icon="ri:send-plane-2-line" style="margin-right:6px" />询问
              </el-button>
            </div>
          </div>
        </div>
        <div v-if="queryAnswer" class="kg-query__answer-card">
          <div class="kg-query__card-header">
            <IconifyIconOnline icon="ri:article-line" />
            <span>回答</span>
          </div>
          <div class="kg-query__card-body">
            <div class="kg-query__answer-content">{{ queryAnswer }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab: 设置 -->
    <div v-if="activeTab === 'settings'" class="kg-workbench__panel">
      <div class="kg-workbench__settings">
        <div class="kg-settings-header">
          <IconifyIconOnline icon="ri:settings-4-line" />
          <span>知识图谱全局设置</span>
        </div>
        <div class="kg-settings-group">
          <div v-for="(val, key) in settingValues" :key="key" class="kg-settings-item">
            <label class="kg-settings-label">{{ settingLabels[key] || key }}</label>
            <div class="kg-settings-control">
              <template v-if="key === 'enabled' || key === 'relation_extraction_enabled'">
                <el-switch v-model="boolSettings[key]" @change="updateSetting(key, boolSettings[key])" />
              </template>
              <template v-else-if="key === 'max_entities_per_doc' || key === 'embedding_dimension'">
                <el-input-number v-model="numSettings[key]" :min="1" :max="10000" @change="updateNumSetting(key, numSettings[key])" />
              </template>
              <template v-else-if="key === 'vector_storage_engine'">
                <select v-model="settingValues[key]" class="kg-settings-select" @change="updateSetting(key, settingValues[key])">
                  <option value="jvector">JVector - 本地内存向量引擎</option>
                  <option value="milvus">Milvus - 高性能分布式向量数据库</option>
                  <option value="pinecone">Pinecone - 云端向量数据库服务</option>
                  <option value="qdrant">Qdrant - 向量相似度搜索引擎</option>
                  <option value="weaviate">Weaviate - 开源向量数据库</option>
                  <option value="elasticsearch">Elasticsearch - 全文与向量混合搜索</option>
                </select>
              </template>
              <template v-else>
                <el-input v-model="settingValues[key]" :placeholder="settingLabels[key]" @blur="updateSetting(key, settingValues[key])" />
              </template>
            </div>
          </div>
        </div>
        <p class="kg-settings-tip">修改设置后将自动保存并生效</p>
      </div>
    </div>

    <!-- 实体编辑对话框 -->
    <Teleport to="body">
      <div v-if="showEntityDialog" class="kg-dialog-overlay" @click.self="showEntityDialog = false">
        <div class="kg-dialog">
          <div class="kg-dialog__header">
            <h3>{{ editingEntity ? '编辑实体' : '新建实体' }}</h3>
          </div>
          <div class="kg-dialog__body">
            <el-form label-width="80px">
              <el-form-item label="名称">
                <el-input v-model="entityForm.name" placeholder="实体名称" />
              </el-form-item>
              <el-form-item label="类型">
                <el-input v-model="entityForm.type" placeholder="实体类型，如 Person" />
              </el-form-item>
              <el-form-item label="属性">
                <el-input v-model="entityForm.properties" type="textarea" :rows="3" placeholder='JSON格式，如 {"key":"value"}' />
              </el-form-item>
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

    <!-- 关系编辑对话框 -->
    <Teleport to="body">
      <div v-if="showRelationDialog" class="kg-dialog-overlay" @click.self="showRelationDialog = false">
        <div class="kg-dialog">
          <div class="kg-dialog__header">
            <h3>{{ editingRelation ? '编辑关系' : '新建关系' }}</h3>
          </div>
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
              <el-form-item label="关系类型">
                <el-input v-model="relationForm.type" placeholder="如 works_for" />
              </el-form-item>
              <el-form-item label="权重">
                <el-input-number v-model="relationForm.weight" :min="0" :max="1" :step="0.1" />
              </el-form-item>
              <el-form-item label="属性">
                <el-input v-model="relationForm.properties" type="textarea" :rows="2" placeholder='JSON格式，如 {"key":"value"}' />
              </el-form-item>
            </el-form>
          </div>
          <div class="kg-dialog__footer">
            <el-button @click="showRelationDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSaveRelation">保存</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 知识库管理对话框 -->
    <Teleport to="body">
      <div v-if="showLibraryDialog" class="kg-dialog-overlay" @click.self="showLibraryDialog = false">
        <div class="kg-dialog" style="width:560px">
          <div class="kg-dialog__header">
            <h3>{{ editingLibrary ? '编辑知识库' : '新建知识库' }}</h3>
          </div>
          <div class="kg-dialog__body">
            <el-form label-width="140px">
              <el-form-item label="名称">
                <el-input v-model="libraryForm.sysAiKnowledgeLibraryName" placeholder="知识库名称（即分组名称）" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="libraryForm.sysAiKnowledgeLibraryDescription" placeholder="知识库描述（可选）" />
              </el-form-item>
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
import { ref, reactive, onMounted, nextTick } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useDraggable } from "@vueuse/core";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { ScGraph } from "@repo/components/ScGraph";
import {
  listEntities, deleteEntity, createEntity, updateEntity,
  listRelations, deleteRelation, createRelation, updateRelation,
  getGraphData, getEntityTypes, getRelationTypes,
  getNeighbors, extractEntities as apiExtractEntities,
  extractRelations as apiExtractRelations, queryGraph,
  batchDeleteEntities, batchDeleteRelations,
  type KgEntityItem, type KgRelationItem, type KgGraphData,
} from "../../../api/ai/knowledge-graph";
import {
  listAllLibraries, createLibrary, updateLibrary, deleteLibrary,
  type KnowledgeLibraryItem,
} from "../../../api/ai/knowledge-library";
import { listAiGlobalSettings, replaceAiGlobalSettings } from "../../../api/ai/global-setting";

const router = useRouter();

function typeTagColor(type: string): string {
  const map: Record<string, string> = {
    Person: 'person', Organization: 'org', Product: 'product',
    Technology: 'tech', Framework: 'default', Tool: 'tool', Language: 'lang',
    Server: 'server',
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

// ── Knowledge Library ──────────────────────────────────────────

const currentLibraryId = ref<number>(1);
const libraryList = ref<KnowledgeLibraryItem[]>([]);
const showLibraryDialog = ref(false);
const editingLibrary = ref<KnowledgeLibraryItem | null>(null);
const libraryForm = reactive({
  sysAiKnowledgeLibraryName: "",
  sysAiKnowledgeLibraryDescription: "",
});

async function loadLibraries() {
  try {
    const res = await listAllLibraries();
    libraryList.value = res.data ?? [];
    if (libraryList.value.length > 0 && !libraryList.value.some(l => l.sysAiKnowledgeLibraryId === currentLibraryId.value)) {
      currentLibraryId.value = libraryList.value[0].sysAiKnowledgeLibraryId;
    }
  } catch { /* ignore */ }
}

function switchLibrary(libId: number) {
  currentLibraryId.value = libId;
  // 重新加载所有数据
  Promise.allSettled([
    loadGraphData(),
    loadEntities(),
    loadRelations(),
    loadEntityTypes(),
    loadRelationTypes(),
  ]);
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

const tabs = [
  { key: "graph", label: "图谱视图", icon: "ri:node-tree" },
  { key: "entities", label: "实体管理", icon: "ri:database-2-line" },
  { key: "relations", label: "关系管理", icon: "ri:share-line" },
  { key: "extract", label: "LLM 抽取", icon: "ri:sparkling-line" },
  { key: "query", label: "查询", icon: "ri:question-answer-line" },
  { key: "settings", label: "设置", icon: "ri:settings-4-line" },
];

const activeTab = ref("graph");

// ── Graph ──────────────────────────────────────────────────────

const scGraphRef = ref<InstanceType<typeof ScGraph> | null>(null);
const graphData = reactive<{ nodes: KgGraphData['nodes'] | null; edges: KgGraphData['edges'] | null }>({ nodes: null, edges: null });
const graphFilter = reactive({ type: "", limit: 200 });
const selectedNode = ref<string | null>(null);
const neighbors = ref<any[]>([]);
const selectedNodeInfo = ref<{ name: string; type: string; weight?: number; logo?: string; properties?: string; source?: string } | null>(null);

// Draggable detail panel
const detailPanelRef = ref<HTMLElement | null>(null);
const dragHandleRef = ref<HTMLElement | null>(null);
let draggableCleanup: ReturnType<typeof useDraggable> | null = null;

// Batch selection
const selectedEntityIds = ref<number[]>([]);
const selectedRelationIds = ref<number[]>([]);

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

function handleGraphNodeClick(nodeId: string) {
  selectedNode.value = nodeId;
  loadNeighbors(nodeId);
}

function handleNodeSelect(nodeId: string | null) {
  if (nodeId) {
    selectedNode.value = nodeId;
    loadNeighbors(nodeId);
  } else {
    selectedNode.value = null;
    neighbors.value = [];
    selectedNodeInfo.value = null;
  }
}

function handleGraphCanvasClick() {
  selectedNode.value = null;
  neighbors.value = [];
  selectedNodeInfo.value = null;
}

// ── Entities ───────────────────────────────────────────────────

const entityRecords = ref<KgEntityItem[]>([]);
const entityTotal = ref(0);
const entityLoading = ref(false);
const entityQuery = reactive({ keyword: "", type: "", page: 1, size: 20 });
const entityTypes = ref<string[]>([]);
const showEntityDialog = ref(false);
const editingEntity = ref<KgEntityItem | null>(null);
const entityForm = reactive({ name: "", type: "default", properties: "", logo: "" });

async function loadEntities() {
  entityLoading.value = true;
  try {
    const res = await listEntities({ ...entityQuery, keyword: entityQuery.keyword || undefined, type: entityQuery.type || undefined, libraryId: currentLibraryId.value });
    if (res.data) {
      entityRecords.value = res.data.records ?? [];
      entityTotal.value = res.data.total ?? 0;
    }
  } catch { ElMessage.error("加载实体列表失败"); }
  finally { entityLoading.value = false; }
}

async function loadEntityTypes() {
  try {
    const res = await getEntityTypes({ libraryId: currentLibraryId.value });
    entityTypes.value = res.data ?? [];
  } catch { /* ignore */ }
}

async function loadRelationTypes() {
  try {
    const res = await getRelationTypes({ libraryId: currentLibraryId.value });
    relationTypes.value = res.data ?? [];
  } catch { /* ignore */ }
}

function editEntity(row: KgEntityItem) {
  editingEntity.value = row;
  entityForm.name = row.sysAiKnowledgeGraphEntityName;
  entityForm.type = row.sysAiKnowledgeGraphEntityType;
  entityForm.properties = row.sysAiKnowledgeGraphEntityProperties || "";
  entityForm.logo = row.sysAiKnowledgeGraphEntityLogo || "";
  showEntityDialog.value = true;
}

async function handleSaveEntity() {
  const data: any = { sysAiKnowledgeGraphEntityName: entityForm.name, sysAiKnowledgeGraphEntityType: entityForm.type, sysAiKnowledgeGraphLibraryId: currentLibraryId.value };
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
  if (selectedEntityIds.value.length === 0) { ElMessage.warning("请选择要删除的实体"); return; }
  try {
    await ElMessageBox.confirm(`确定批量删除 ${selectedEntityIds.value.length} 个实体？关联的关系也将被删除。`, "提示");
    await batchDeleteEntities(selectedEntityIds.value);
    ElMessage.success(`已删除 ${selectedEntityIds.value.length} 个实体`);
    selectedEntityIds.value = [];
    await Promise.all([loadEntities(), loadGraphData()]);
  } catch { /* cancelled */ }
}

// ── Relations ──────────────────────────────────────────────────

const relationRecords = ref<KgRelationItem[]>([]);
const relationTotal = ref(0);
const relationLoading = ref(false);
const relationQuery = reactive({ keyword: "", type: "", page: 1, size: 20 });
const relationTypes = ref<string[]>([]);
const showRelationDialog = ref(false);
const editingRelation = ref<KgRelationItem | null>(null);
const relationForm = reactive({ sourceEntityUid: "", targetEntityUid: "", type: "related_to", weight: 1.0, properties: "" });

// 实体选择器选项（全量缓存 + 搜索过滤）
const entityOptions = ref<KgEntityItem[]>([]);
const allEntityOptions = ref<KgEntityItem[]>([]);

async function loadEntityOptions() {
  if (allEntityOptions.value.length > 0) {
    entityOptions.value = allEntityOptions.value;
    return;
  }
  try {
    const res = await listEntities({ page: 1, size: 1000, libraryId: currentLibraryId.value });
    if (res.data) {
      allEntityOptions.value = res.data.records ?? [];
      entityOptions.value = allEntityOptions.value;
    }
  } catch { /* ignore */ }
}

function searchEntityOptions(query: string) {
  if (!query) {
    entityOptions.value = allEntityOptions.value;
    return;
  }
  const q = query.toLowerCase();
  entityOptions.value = allEntityOptions.value.filter(e =>
    e.sysAiKnowledgeGraphEntityName.toLowerCase().includes(q) ||
    (e.sysAiKnowledgeGraphEntityType || '').toLowerCase().includes(q)
  );
}

async function loadRelations() {
  relationLoading.value = true;
  try {
    const res = await listRelations({ ...relationQuery, keyword: relationQuery.keyword || undefined, type: relationQuery.type || undefined, libraryId: currentLibraryId.value });
    if (res.data) {
      relationRecords.value = res.data.records ?? [];
      relationTotal.value = res.data.total ?? 0;
    }
  } catch { ElMessage.error("加载关系列表失败"); }
  finally { relationLoading.value = false; }
}

function openNewRelationDialog() {
  editingRelation.value = null;
  relationForm.sourceEntityUid = "";
  relationForm.targetEntityUid = "";
  relationForm.type = "related_to";
  relationForm.weight = 1.0;
  relationForm.properties = "";
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
  if (selectedRelationIds.value.length === 0) { ElMessage.warning("请选择要删除的关系"); return; }
  try {
    await ElMessageBox.confirm(`确定批量删除 ${selectedRelationIds.value.length} 个关系？`, "提示");
    await batchDeleteRelations(selectedRelationIds.value);
    ElMessage.success(`已删除 ${selectedRelationIds.value.length} 个关系`);
    selectedRelationIds.value = [];
    await Promise.all([loadRelations(), loadGraphData()]);
  } catch { /* cancelled */ }
}

// ── LLM Extraction ─────────────────────────────────────────────

const extractText = ref("");
const extractingEntities = ref(false);
const extractingRelations = ref(false);
const extractedEntities = ref<any[]>([]);
const extractedRelations = ref<any[]>([]);
const extractResultTab = ref("entities");

// ── File Upload ─────────────────────────────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const uploadedFile = ref<File | null>(null);
const fileDragging = ref(false);
const fileExtracting = ref(false);
const fileExtractProgress = ref(0);

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    handleFile(input.files[0]);
  }
}

function handleFileDrop(event: DragEvent) {
  fileDragging.value = false;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    handleFile(files[0]);
  }
}

async function handleFile(file: File) {
  uploadedFile.value = file;
  fileExtracting.value = true;
  fileExtractProgress.value = 30;

  try {
    const { extractTextFromFile } = await import("../../../api/ai/knowledge-graph");
    fileExtractProgress.value = 60;
    const res = await extractTextFromFile(file);
    fileExtractProgress.value = 90;
    if (res.code === "00000") {
      extractText.value = res.data?.text ?? "";
      ElMessage.success(`从文件提取到 ${extractText.value.length} 字符文本`);
    } else {
      ElMessage.warning(res.msg || "提取失败");
    }
  } catch (e: any) {
    ElMessage.error(e?.msg || "文件处理失败");
  } finally {
    fileExtracting.value = false;
    fileExtractProgress.value = 100;
  }
}

function clearFile() {
  uploadedFile.value = null;
  if (fileInputRef.value) fileInputRef.value.value = "";
}

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
    const res = await apiExtractRelations({
      text: extractText.value,
      libraryId: currentLibraryId.value,
      entityIds,
    });
    extractedRelations.value = res.data ?? [];
    extractResultTab.value = "relations";
    ElMessage.success(`抽取到 ${extractedRelations.value.length} 个关系`);
  } catch { ElMessage.error("关系抽取失败"); }
  finally { extractingRelations.value = false; }
}

// ── Query ──────────────────────────────────────────────────────

const queryText = ref("");
const queryLoading = ref(false);
const queryAnswer = ref("");

async function handleQuery() {
  if (!queryText.value.trim()) { ElMessage.warning("请输入问题"); return; }
  queryLoading.value = true;
  queryAnswer.value = "";
  try {
    const res = await queryGraph({ question: queryText.value, libraryId: currentLibraryId.value });
    queryAnswer.value = res.data?.answer ?? "暂无回答";
  } catch { ElMessage.error("查询失败"); }
  finally { queryLoading.value = false; }
}

// ── Settings ───────────────────────────────────────────────────

const settingValues = reactive<Record<string, string>>({});
const boolSettings = reactive<Record<string, boolean>>({});
const numSettings = reactive<Record<string, number>>({});

const settingLabels: Record<string, string> = {
  enabled: "启用知识图谱",
  extraction_prompt_template: "抽取提示词模板",
  relation_extraction_enabled: "启用关系抽取",
  max_entities_per_doc: "单文档最大实体数",
  embedding_dimension: "向量维度",
  vector_storage_engine: "向量引擎",
};

const boolKeys = new Set(["enabled", "relation_extraction_enabled"]);
const numKeys = new Set(["max_entities_per_doc", "embedding_dimension"]);

async function loadSettings() {
  try {
    const res = await listAiGlobalSettings("knowledge_graph");
    if (res.data) {
      for (const item of res.data) {
        const field = item.sysAiGlobalSettingField;
        if (field === "llm_provider" || field === "llm_model") continue;
        const value = item.sysAiGlobalSettingValue ?? "";
        settingValues[field] = value;
        if (boolKeys.has(field)) boolSettings[field] = value === "true";
        if (numKeys.has(field)) numSettings[field] = parseInt(value) || 0;
      }
    }
  } catch { /* ignore */ }
}

async function updateSetting(field: string, value: any) {
  const settings = Object.entries(settingValues).map(([k, v]) => ({
    sysAiGlobalSettingGroup: "knowledge_graph",
    sysAiGlobalSettingField: k,
    sysAiGlobalSettingValue: boolKeys.has(k) ? String(boolSettings[k]) : numKeys.has(k) ? String(numSettings[k]) : v,
    sysAiGlobalSettingStatus: 1,
  }));
  try {
    await replaceAiGlobalSettings(settings, "knowledge_graph");
    ElMessage.success("设置已更新");
  } catch { ElMessage.error("保存设置失败"); }
}

async function updateNumSetting(field: string, value: number) {
  settingValues[field] = String(value);
  await updateSetting(field, value);
}

// ── Init ───────────────────────────────────────────────────────

onMounted(async () => {
  await loadLibraries();
  await Promise.allSettled([
    loadGraphData(),
    loadEntities(),
    loadRelations(),
    loadSettings(),
    loadEntityTypes(),
    loadRelationTypes(),
  ]);
  // Setup draggable detail panel
  nextTick(() => {
    if (detailPanelRef.value && dragHandleRef.value) {
      useDraggable(detailPanelRef, { handle: dragHandleRef, initialValue: { x: 20, y: 80 } });
    }
  });
});
</script>

<style scoped lang="scss">
// ── Ambient Glow ───────────────────────────────────────
.kg-glow {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;

  &--primary {
    top: -60px; left: 5%; width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.10), transparent 70%);
  }
  &--purple {
    bottom: -80px; right: 10%; width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.06), transparent 70%);
    filter: blur(100px);
  }
}

// ── Layout ─────────────────────────────────────────────
.kg-workbench {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0;

  // ── Header ──
  &__header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  &__back {
    width: 36px; height: 36px; border-radius: 8px;
    border: 1px solid var(--el-border-color);
    background: var(--el-fill-color-blank);
    cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    &:hover { background: var(--el-fill-color-light); transform: translateX(-2px); }
  }

  &__header-info {
    min-width: 0;
    h2 { margin: 0; font-size: 18px; font-weight: 700; }
    p { margin: 2px 0 0; font-size: 12px; color: var(--el-text-color-secondary); }
  }

  &__library-selector {
    display: flex; align-items: center; gap: 4px; margin-left: 12px;
  }

  &__nav {
    margin-left: auto;
    display: flex; gap: 4px;
  }

  &__nav-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 14px; border-radius: 6px;
    border: none; background: transparent;
    cursor: pointer; font-size: 13px; color: var(--el-text-color-secondary);
    white-space: nowrap;
    transition: all 0.15s;
    &:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
    &.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
  }

  // ── Panel ──
  &__panel {
    flex: 1; padding: 20px 24px; overflow: auto;
    display: flex; flex-direction: column;
    position: relative; z-index: 1;
  }

  // ── Graph Tab ──
  &__graph-toolbar {
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
    padding: 10px 16px;
    background: rgba(255,255,255,0.7);
    backdrop-filter: blur(12px) saturate(180%);
    -webkit-backdrop-filter: blur(12px) saturate(180%);
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    flex-shrink: 0;

    html.dark & {
      background: rgba(30,30,35,0.8);
    }
  }
  &__graph-filters { display: flex; align-items: center; gap: 8px; }
  &__graph-stats { margin-left: auto; display: flex; gap: 6px; }

  &__graph-container {
    flex: 1; border-radius: 12px; overflow: hidden;
    border: 1px solid var(--el-border-color-light);
    background: var(--el-bg-color);
    position: relative;
  }

  // ── Stat Pills ──
  .stat-pill {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 3px 12px; border-radius: 20px;
    font-size: 12px; font-weight: 500;
    &--nodes {
      background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
      color: var(--el-color-primary);
    }
    &--edges {
      background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
      color: var(--el-color-success);
    }
  }

  // ── Draggable Detail Panel ──
  .kg-detail-panel {
    position: fixed;
    z-index: 100;
    width: 240px;
    max-height: 400px;
    overflow-y: auto;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 12px;
    box-shadow: var(--app-shadow-lg, 0 8px 32px rgba(0,0,0,0.12));
    font-size: 13px;

    html.dark & {
      background: rgba(30,30,35,0.92);
      border-color: rgba(255,255,255,0.08);
    }

    &__handle {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 14px;
      cursor: grab;
      font-weight: 600; font-size: 13px;
      color: var(--el-text-color-primary);
      border-bottom: 1px solid var(--el-border-color-light);
      user-select: none;
      &:active { cursor: grabbing; }
      .kg-detail-panel__logo {
        width: 32px; height: 32px; border-radius: 50%; object-fit: cover;
      }
    }

    &__content {
      padding: 10px 14px;
    }

    &__row {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 0;
    }

    &__label {
      color: var(--el-text-color-secondary);
      font-size: 12px;
      flex-shrink: 0;
      min-width: 36px;
    }

    &__value {
      font-weight: 500;
      color: var(--el-text-color-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__logo-img {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      object-fit: cover;
    }

    &__divider {
      height: 1px;
      background: var(--el-border-color-light);
      margin: 8px 0;
    }

    &__section-title {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 6px;
    }

    &__count {
      margin-left: auto;
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
      padding: 0 8px;
      border-radius: 10px;
      font-size: 11px;
      line-height: 18px;
    }

    &__neighbor {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s;
      &:hover { background: var(--el-fill-color-light); }
    }

    &__dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    &__neighbor-name {
      flex: 1;
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__neighbor-type {
      font-size: 11px;
      color: var(--el-text-color-placeholder);
      flex-shrink: 0;
    }

    &__empty {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
      text-align: center;
      padding: 12px 0;
    }
  }

  // ── Extract (卡片式) ──
  .kg-extract {
    display: flex; gap: 20px; flex: 1; align-items: stretch;
    > * { width: 50%; display: flex; flex-direction: column; }
  }
  .kg-extract__input-card, .kg-extract__result-card {
    background: var(--el-bg-color); border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    overflow: hidden; display: flex; flex-direction: column;
    box-shadow: var(--app-shadow, 0 2px 8px rgba(0,0,0,0.06));
    transition: box-shadow 0.25s;
    &:hover { box-shadow: var(--app-shadow-md, 0 4px 16px rgba(0,0,0,0.1)); }
  }
  .kg-extract__card-header {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 18px; font-size: 14px; font-weight: 600;
    background: var(--el-fill-color-blank);
    border-bottom: 1px solid var(--el-border-color-light);
    color: var(--el-text-color-primary);
    .kg-extract__result-badge { margin-left: auto; }
  }
  .kg-extract__card-body { padding: 16px 18px; flex: 1; display: flex; flex-direction: column; }
  .kg-extract__file-zone {
    border: 1.5px dashed color-mix(in srgb, var(--el-color-primary) 40%, transparent);
    border-radius: 10px;
    padding: 20px 16px; margin-bottom: 14px; cursor: pointer;
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    transition: all 0.25s;
    background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
    &.is-dragover {
      border-color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-bg-color) 84%, var(--el-color-primary));
      transform: scale(1.01);
    }
    &:hover { border-color: var(--el-color-primary); }
    p { margin: 0; font-size: 13px; color: var(--el-text-color-secondary); }
  }
  .kg-extract__upload-icon-wrap {
    width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg,
      color-mix(in srgb, var(--el-color-primary) 80%, #0f172a),
      color-mix(in srgb, var(--el-color-info) 78%, #0f172a));
    .kg-extract__upload-icon { font-size: 22px; color: #e8f3ff; }
  }
  .kg-extract__file-hint { flex: 1; small { color: var(--el-text-color-placeholder); } }
  .kg-extract__file-info { flex: 1; display: flex; align-items: center; gap: 6px; color: var(--el-text-color-primary) !important; }
  .kg-extract__file-progress {
    width: 100%; display: flex; align-items: center; gap: 8px;
    span { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; }
    .el-progress { flex: 1; }
  }
  .kg-extract__textarea {
    :deep(.el-textarea__inner) { border-radius: 8px; font-size: 13px; }
  }
  .kg-extract__actions {
    display: flex; gap: 10px; margin-top: 14px;
  }
  .kg-extract__primary-btn {
    padding-left: 22px; padding-right: 22px;
    background: linear-gradient(135deg, var(--el-color-primary), color-mix(in srgb, var(--el-color-primary) 70%, #000));
    border: none;
    &:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(var(--el-color-primary-rgb), 0.35); }
  }
  .kg-extract__secondary-btn {
    padding-left: 20px; padding-right: 20px;
  }
  .kg-extract__tabs {
    :deep(.el-tabs__header) { margin-bottom: 12px; }
    :deep(.el-tabs__item) { font-size: 13px; }
  }

  // ── Query (问答卡片) ──
  .kg-query {
    max-width: 720px; display: flex; flex-direction: column; gap: 20px;
  }
  .kg-query__input-card, .kg-query__answer-card {
    background: var(--el-bg-color); border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    overflow: hidden;
    box-shadow: var(--app-shadow, 0 2px 8px rgba(0,0,0,0.06));
    transition: box-shadow 0.25s;
    &:hover { box-shadow: var(--app-shadow-md, 0 4px 16px rgba(0,0,0,0.1)); }
  }
  .kg-query__card-header {
    display: flex; align-items: center; gap: 8px;
    padding: 14px 18px; font-size: 14px; font-weight: 600;
    background: var(--el-fill-color-blank);
    border-bottom: 1px solid var(--el-border-color-light);
    color: var(--el-text-color-primary);
  }
  .kg-query__card-body { padding: 16px 18px; }
  .kg-query__input-row { margin-bottom: 14px; }
  .kg-query__actions { display: flex; justify-content: flex-end; }
  .kg-query__ask-btn {
    padding-left: 28px; padding-right: 28px;
    background: linear-gradient(135deg, var(--el-color-primary), color-mix(in srgb, var(--el-color-primary) 70%, #000));
    border: none;
    transition: all 0.25s;
    &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.35); }
  }
  .kg-query__answer-content {
    background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color));
    border-radius: 10px;
    padding: 18px 20px; line-height: 1.8; white-space: pre-wrap;
    font-size: 14px;
    border-left: 4px solid;
    border-image: linear-gradient(180deg, var(--el-color-primary), var(--el-color-success)) 1;
    color: var(--el-text-color-primary);
  }

  // ── Card (表格包裹卡片) ──
  .kg-card {
    background: var(--el-bg-color); border-radius: 12px;
    border: 1px solid var(--el-border-color-light);
    overflow: hidden;
    box-shadow: var(--app-shadow, 0 2px 8px rgba(0,0,0,0.06));
    display: flex; flex-direction: column;

    &__header {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 18px;
      background: var(--el-fill-color-blank);
      border-bottom: 1px solid var(--el-border-color-light);
      flex-wrap: wrap;

      &-left {
        display: flex; align-items: center; gap: 8px;
        font-size: 14px; font-weight: 600;
      }
      &-right {
        margin-left: auto; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      }
    }

    &__footer {
      display: flex; justify-content: flex-end;
      padding: 10px 18px;
      border-top: 1px solid var(--el-border-color-light);
      background: var(--el-fill-color-blank);
    }
  }

  // ── Table (增强表格) ──
  :deep(.kg-table) {
    border-radius: 0;
    .el-table__header-wrapper .el-table__header th.el-table__cell {
      background: var(--el-fill-color-lighter);
      font-size: 13px; font-weight: 600; color: var(--el-text-color-primary);
    }
    .el-table__body-wrapper .el-table__body td.el-table__cell {
      font-size: 13px;
    }
  }

  // ── Action Buttons ──
  .kg-action-btn {
    border-radius: 6px; font-size: 12px; padding: 5px 10px;
    transition: all 0.2s;
    &:hover { transform: translateY(-1px); }
    &--danger { &:hover { box-shadow: 0 2px 8px rgba(var(--el-color-danger-rgb), 0.3); } }
  }

  // ── Type Tags ──
  .kg-type-tag {
    display: inline-block; padding: 2px 10px; border-radius: 12px;
    font-size: 12px; font-weight: 500; line-height: 20px;

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

  // ── Entity Link ──
  .kg-entity-link {
    color: var(--el-color-primary); font-weight: 500;
    cursor: default;
  }

  // ── Weight Badge ──
  .kg-weight-badge {
    display: inline-block; padding: 1px 10px; border-radius: 10px;
    font-size: 12px; font-weight: 600; color: #fff; line-height: 20px;
    min-width: 36px; text-align: center;
  }

  // ── Settings ──
  &__settings {
    max-width: 680px;

    .kg-settings-header {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; font-weight: 600; margin-bottom: 20px;
    }

    .kg-settings-group {
      display: flex; flex-direction: column; gap: 12px;
    }

    .kg-settings-item {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 18px;
      border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
      border-radius: 10px;
      background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary));
      transition: border-color 0.2s;
      &:hover { border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color)); }
    }

    .kg-settings-label {
      width: 160px; font-size: 13px; font-weight: 500; flex-shrink: 0;
      color: var(--el-text-color-primary);
    }

    .kg-settings-control {
      flex: 1; display: flex; align-items: center;
    }

    .kg-settings-select {
      width: 100%; padding: 8px 12px; border-radius: 8px;
      border: 1px solid var(--el-border-color);
      background: var(--el-fill-color-blank);
      color: var(--el-text-color-primary);
      font-size: 14px; outline: none; transition: border-color 0.2s;
      &:focus { border-color: var(--el-color-primary); }
    }

    .kg-settings-tip { margin-top: 16px; font-size: 12px; color: var(--el-text-color-secondary); }
  }
}

// ── Dialogs ──
.kg-dialog-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex; align-items: center; justify-content: center;
  animation: dialogOverlayIn 0.2s ease;
}

.kg-dialog {
  background: var(--el-bg-color);
  border-radius: 16px;
  width: 480px; max-width: 90vw; max-height: 80vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  animation: dialogSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &__header {
    padding: 20px 24px 0;
    h3 { margin: 0; font-size: 16px; font-weight: 600; }
  }
  &__body { padding: 20px 24px; }
  &__footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 0 24px 20px;
  }
}

@keyframes dialogOverlayIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes dialogSlideIn {
  from { transform: translateY(24px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}
</style>
