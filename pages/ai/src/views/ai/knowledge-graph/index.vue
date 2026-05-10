<template>
  <section class="kg-workbench system-container modern-bg">
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
    <div v-if="activeTab === 'graph'" class="kg-workbench__panel">
      <div class="kg-workbench__graph-toolbar">
        <div class="kg-workbench__graph-filters">
          <el-input v-model="graphFilter.type" placeholder="按类型筛选" clearable style="width:160px" @change="loadGraphData" />
          <el-input-number v-model="graphFilter.limit" :min="20" :max="500" :step="20" size="small" />
          <el-button type="primary" size="small" @click="loadGraphData">刷新</el-button>
        </div>
        <div class="kg-workbench__graph-stats" v-if="graphData.nodes">
          <span>{{ graphData.nodes.length }} 节点</span>
          <span class="divider">|</span>
          <span>{{ graphData.edges.length }} 边</span>
        </div>
      </div>
      <div class="kg-workbench__graph-canvas" ref="graphCanvasRef">
        <svg v-if="graphData.nodes && graphData.nodes.length > 0" class="kg-workbench__graph-svg" :width="svgSize.w" :height="svgSize.h">
          <!-- 边 -->
          <line
            v-for="(edge, i) in graphData.edges" :key="'e'+i"
            :x1="nodePos[edge.from]?.x ?? 0" :y1="nodePos[edge.from]?.y ?? 0"
            :x2="nodePos[edge.to]?.x ?? 0" :y2="nodePos[edge.to]?.y ?? 0"
            class="kg-workbench__graph-edge"
            :class="{ highlight: selectedNode && (edge.from === selectedNode || edge.to === selectedNode) }"
            stroke="#888" stroke-width="1.5"
          />
          <!-- 节点 -->
          <g
            v-for="node in graphData.nodes" :key="node.id"
            :transform="`translate(${nodePos[node.id]?.x ?? 0},${nodePos[node.id]?.y ?? 0})`"
            class="kg-workbench__graph-node"
            :class="{ selected: selectedNode === node.id }"
            @click="selectedNode = node.id; loadNeighbors(node.id)"
          >
            <circle r="18" :fill="colorByType[node.group] || '#409eff'" stroke="#fff" stroke-width="2" />
            <text text-anchor="middle" dy="4" fill="#fff" font-size="11">{{ node.label[0] }}</text>
            <text text-anchor="middle" dy="28" fill="var(--el-text-color-secondary)" font-size="11" class="kg-workbench__graph-label">{{ node.label.length > 8 ? node.label.slice(0,8)+'…' : node.label }}</text>
          </g>
        </svg>
        <div v-else class="kg-workbench__graph-empty">
          <IconifyIconOnline icon="ri:node-tree" style="font-size:48px;opacity:0.3" />
          <p>暂无图谱数据</p>
        </div>
      </div>
      <!-- 选中节点信息 -->
      <div v-if="selectedNode" class="kg-workbench__graph-sidebar">
        <h4>选中节点</h4>
        <p class="node-name">{{ selectedNodeInfo?.name || selectedNode }}</p>
        <p class="node-type">{{ selectedNodeInfo?.type || '' }}</p>
        <h4 style="margin-top:12px">关联邻居 ({{ neighbors.length }})</h4>
        <div v-for="n in neighbors" :key="n.id" class="kg-workbench__neighbor-item" @click="selectedNode = n.id; loadNeighbors(n.id)">
          <span class="neighbor-dot" :style="{ background: colorByType[n.type] || '#409eff' }" />
          <span>{{ n.name }}</span>
        </div>
      </div>
    </div>

    <!-- Tab: 实体管理 -->
    <div v-if="activeTab === 'entities'" class="kg-workbench__panel">
      <div class="kg-workbench__toolbar">
        <el-input v-model="entityQuery.keyword" placeholder="搜索实体名称" clearable style="width:200px" @change="loadEntities" />
        <el-select v-model="entityQuery.type" placeholder="实体类型" clearable style="width:140px" @change="loadEntities">
          <el-option v-for="t in entityTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button type="primary" @click="showEntityDialog = true">新建实体</el-button>
      </div>
      <el-table :data="entityRecords" v-loading="entityLoading" stripe style="width:100%">
        <el-table-column prop="sysAiKnowledgeGraphEntityName" label="名称" min-width="140" />
        <el-table-column prop="sysAiKnowledgeGraphEntityType" label="类型" width="110" />
        <el-table-column prop="sysAiKnowledgeGraphEntitySource" label="来源" width="110" />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.createTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editEntity(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeleteEntity(row.sysAiKnowledgeGraphEntityId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="kg-workbench__pagination">
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

    <!-- Tab: 关系管理 -->
    <div v-if="activeTab === 'relations'" class="kg-workbench__panel">
      <div class="kg-workbench__toolbar">
        <el-input v-model="relationQuery.keyword" placeholder="搜索关系类型" clearable style="width:200px" @change="loadRelations" />
        <el-select v-model="relationQuery.type" placeholder="关系类型" clearable style="width:140px" @change="loadRelations">
          <el-option v-for="t in relationTypes" :key="t" :label="t" :value="t" />
        </el-select>
        <el-button type="primary" @click="showRelationDialog = true">新建关系</el-button>
      </div>
      <el-table :data="relationRecords" v-loading="relationLoading" stripe style="width:100%">
        <el-table-column prop="sysAiKnowledgeGraphRelationSourceEntityUid" label="源实体UID" min-width="140" show-overflow-tooltip />
        <el-table-column prop="sysAiKnowledgeGraphRelationTargetEntityUid" label="目标实体UID" min-width="140" show-overflow-tooltip />
        <el-table-column prop="sysAiKnowledgeGraphRelationType" label="关系类型" width="120" />
        <el-table-column prop="sysAiKnowledgeGraphRelationWeight" label="权重" width="80" />
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ row.createTime }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editRelation(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDeleteRelation(row.sysAiKnowledgeGraphRelationId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="kg-workbench__pagination">
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

    <!-- Tab: LLM 抽取 -->
    <div v-if="activeTab === 'extract'" class="kg-workbench__panel">
      <div class="kg-workbench__extract-layout">
        <div class="kg-workbench__extract-input">
          <h3>输入文本</h3>
          <!-- 文件上传区域 -->
          <div class="kg-workbench__file-zone" :class="{ 'is-dragover': fileDragging }"
            @dragover.prevent="fileDragging = true"
            @dragleave.prevent="fileDragging = false"
            @drop.prevent="handleFileDrop"
            @click="fileInputRef?.click()">
            <input ref="fileInputRef" type="file"
              accept=".txt,.md,.csv,.json,.xml,.yaml,.yml,.properties,.log,.html,.htm,.java,.py,.js,.ts,.jsx,.tsx,.css,.sql,.sh,.bat,.ini,.cfg,.conf,.toml,.gradle,.png,.jpg,.jpeg,.bmp,.webp,.gif,.tiff,.tif,.pdf"
              style="display:none" @change="handleFileSelect" />
            <IconifyIconOnline icon="ri:upload-cloud-2-line" style="font-size:28px;color:var(--el-text-color-placeholder)" />
            <p v-if="!uploadedFile" class="kg-workbench__file-hint">点击或拖拽文件到此处（支持文本/图片/PDF）</p>
            <p v-else class="kg-workbench__file-info">
              <IconifyIconOnline icon="ri:file-text-line" />
              {{ uploadedFile.name }} ({{ (uploadedFile.size / 1024).toFixed(1) }} KB)
              <el-button size="small" text type="danger" @click.stop="clearFile">移除</el-button>
            </p>
            <div v-if="fileExtracting" class="kg-workbench__file-progress">
              <el-progress :percentage="fileExtractProgress" :stroke-width="3" striped />
              <span>正在提取文件内容...</span>
            </div>
          </div>
          <el-input
            v-model="extractText" type="textarea" :rows="7" placeholder="请粘贴或输入需要抽取实体的文本内容..."
          />
          <div class="kg-workbench__extract-actions">
            <el-button type="primary" :loading="extractingEntities" @click="handleExtractEntities">
              抽取实体
            </el-button>
            <el-button :loading="extractingRelations" :disabled="extractedEntities.length === 0" @click="handleExtractRelations">
              抽取关系
            </el-button>
          </div>
        </div>
        <div class="kg-workbench__extract-results">
          <h3>抽取结果</h3>
          <el-tabs v-model="extractResultTab">
            <el-tab-pane label="实体" name="entities">
              <el-table :data="extractedEntities" max-height="300" stripe style="width:100%">
                <el-table-column prop="sysAiKnowledgeGraphEntityName" label="名称" />
                <el-table-column prop="sysAiKnowledgeGraphEntityType" label="类型" width="100" />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="关系" name="relations">
              <el-table :data="extractedRelations" max-height="300" stripe style="width:100%">
                <el-table-column prop="sysAiKnowledgeGraphRelationType" label="关系类型" />
                <el-table-column prop="sysAiKnowledgeGraphRelationWeight" label="权重" width="80" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <!-- Tab: 查询 -->
    <div v-if="activeTab === 'query'" class="kg-workbench__panel">
      <div class="kg-workbench__query-container">
        <div class="kg-workbench__query-input">
          <el-input
            v-model="queryText" type="textarea" :rows="4" placeholder="输入关于知识图谱的自然语言问题..."
          />
          <div class="kg-workbench__query-actions">
            <el-button type="primary" :loading="queryLoading" @click="handleQuery">询问</el-button>
          </div>
        </div>
        <div v-if="queryAnswer" class="kg-workbench__query-answer">
          <h3>回答</h3>
          <div class="kg-workbench__answer-content">{{ queryAnswer }}</div>
        </div>
      </div>
    </div>

    <!-- Tab: 设置 -->
    <div v-if="activeTab === 'settings'" class="kg-workbench__panel">
      <div class="kg-workbench__settings">
        <h3>知识图谱全局设置</h3>
        <div class="kg-workbench__settings-form">
          <div v-for="(val, key) in settingValues" :key="key" class="kg-workbench__settings-item">
            <label>{{ settingLabels[key] || key }}</label>
            <template v-if="key === 'enabled' || key === 'relation_extraction_enabled'">
              <el-switch v-model="boolSettings[key]" @change="updateSetting(key, boolSettings[key])" />
            </template>
            <template v-else-if="key === 'max_entities_per_doc' || key === 'embedding_dimension'">
              <el-input-number v-model="numSettings[key]" :min="1" :max="10000" @change="updateNumSetting(key, numSettings[key])" />
            </template>
            <template v-else>
              <el-input v-model="settingValues[key]" :placeholder="settingLabels[key]" @blur="updateSetting(key, settingValues[key])" />
            </template>
          </div>
        </div>
        <p class="kg-workbench__settings-tip">修改设置后将自动保存并生效</p>
      </div>
    </div>

    <!-- 实体编辑对话框 -->
    <Teleport to="body">
      <div v-if="showEntityDialog" class="kg-workbench__overlay" @click.self="showEntityDialog = false">
        <div class="kg-workbench__dialog">
          <h3>{{ editingEntity ? '编辑实体' : '新建实体' }}</h3>
          <div class="kg-workbench__dialog-body">
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
            </el-form>
          </div>
          <div class="kg-workbench__dialog-footer">
            <el-button @click="showEntityDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSaveEntity">保存</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 关系编辑对话框 -->
    <Teleport to="body">
      <div v-if="showRelationDialog" class="kg-workbench__overlay" @click.self="showRelationDialog = false">
        <div class="kg-workbench__dialog">
          <h3>{{ editingRelation ? '编辑关系' : '新建关系' }}</h3>
          <div class="kg-workbench__dialog-body">
            <el-form label-width="100px">
              <el-form-item label="源实体UID">
                <el-input v-model="relationForm.sourceEntityUid" placeholder="源实体UID" />
              </el-form-item>
              <el-form-item label="目标实体UID">
                <el-input v-model="relationForm.targetEntityUid" placeholder="目标实体UID" />
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
          <div class="kg-workbench__dialog-footer">
            <el-button @click="showRelationDialog = false">取消</el-button>
            <el-button type="primary" @click="handleSaveRelation">保存</el-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 知识库管理对话框 -->
    <Teleport to="body">
      <div v-if="showLibraryDialog" class="kg-workbench__overlay" @click.self="showLibraryDialog = false">
        <div class="kg-workbench__dialog" style="width:560px">
          <h3>{{ editingLibrary ? '编辑知识库' : '新建知识库' }}</h3>
          <div class="kg-workbench__dialog-body">
            <el-form label-width="140px">
              <el-form-item label="名称">
                <el-input v-model="libraryForm.sysAiKnowledgeLibraryName" placeholder="知识库名称" />
              </el-form-item>
              <el-form-item label="描述">
                <el-input v-model="libraryForm.sysAiKnowledgeLibraryDescription" placeholder="知识库描述（可选）" />
              </el-form-item>
              <el-form-item label="LLM 提供商">
                <el-input v-model="libraryForm.sysAiKnowledgeLibraryLlmProvider" placeholder="留空使用全局默认" />
              </el-form-item>
              <el-form-item label="LLM 模型">
                <el-input v-model="libraryForm.sysAiKnowledgeLibraryLlmModel" placeholder="留空使用全局默认" />
              </el-form-item>
              <el-form-item label="温度参数">
                <el-input-number v-model="libraryForm.sysAiKnowledgeLibraryTemperature" :min="0" :max="2" :step="0.1" :precision="1" placeholder="留空使用全局默认" />
              </el-form-item>
              <el-form-item label="最大 Token">
                <el-input-number v-model="libraryForm.sysAiKnowledgeLibraryMaxTokens" :min="1" :max="128000" :step="512" placeholder="留空使用全局默认" />
              </el-form-item>
              <el-form-item label="提示词模板">
                <el-input v-model="libraryForm.sysAiKnowledgeLibraryPromptTemplate" type="textarea" :rows="3" placeholder="实体抽取提示词模板（留空使用全局默认）" />
              </el-form-item>
            </el-form>
          </div>
          <div class="kg-workbench__dialog-footer">
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
import { ref, reactive, onMounted, nextTick, computed } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import {
  listEntities, deleteEntity, createEntity, updateEntity,
  listRelations, deleteRelation, createRelation, updateRelation,
  getGraphData, getStatistics, getEntityTypes, getRelationTypes,
  getNeighbors, extractEntities as apiExtractEntities,
  extractRelations as apiExtractRelations, queryGraph, clearGraph,
  type KgEntityItem, type KgRelationItem, type KgGraphData, type KgStatistics,
} from "../../../api/ai/knowledge-graph";
import {
  listAllLibraries, createLibrary, updateLibrary, deleteLibrary,
  type KnowledgeLibraryItem,
} from "../../../api/ai/knowledge-library";
import { listAiGlobalSettings, replaceAiGlobalSettings, type SysAiGlobalSetting } from "../../../api/ai/global-setting";

const router = useRouter();

// ── Knowledge Library ──────────────────────────────────────────

const currentLibraryId = ref<number>(1);
const libraryList = ref<KnowledgeLibraryItem[]>([]);
const showLibraryDialog = ref(false);
const editingLibrary = ref<KnowledgeLibraryItem | null>(null);
const libraryForm = reactive({
  sysAiKnowledgeLibraryName: "",
  sysAiKnowledgeLibraryDescription: "",
  sysAiKnowledgeLibraryLlmProvider: "",
  sysAiKnowledgeLibraryLlmModel: "",
  sysAiKnowledgeLibraryTemperature: null as number | null,
  sysAiKnowledgeLibraryMaxTokens: null as number | null,
  sysAiKnowledgeLibraryPromptTemplate: "",
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
  libraryForm.sysAiKnowledgeLibraryLlmProvider = "";
  libraryForm.sysAiKnowledgeLibraryLlmModel = "";
  libraryForm.sysAiKnowledgeLibraryTemperature = null;
  libraryForm.sysAiKnowledgeLibraryMaxTokens = null;
  libraryForm.sysAiKnowledgeLibraryPromptTemplate = "";
  showLibraryDialog.value = true;
}

function openEditLibrary(lib: KnowledgeLibraryItem) {
  editingLibrary.value = lib;
  libraryForm.sysAiKnowledgeLibraryName = lib.sysAiKnowledgeLibraryName;
  libraryForm.sysAiKnowledgeLibraryDescription = lib.sysAiKnowledgeLibraryDescription || "";
  libraryForm.sysAiKnowledgeLibraryLlmProvider = lib.sysAiKnowledgeLibraryLlmProvider || "";
  libraryForm.sysAiKnowledgeLibraryLlmModel = lib.sysAiKnowledgeLibraryLlmModel || "";
  libraryForm.sysAiKnowledgeLibraryTemperature = lib.sysAiKnowledgeLibraryTemperature;
  libraryForm.sysAiKnowledgeLibraryMaxTokens = lib.sysAiKnowledgeLibraryMaxTokens;
  libraryForm.sysAiKnowledgeLibraryPromptTemplate = lib.sysAiKnowledgeLibraryPromptTemplate || "";
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
  // 如果编辑的是当前知识库且 LLM 配置变了，刷新数据
  if (editingLibrary.value?.sysAiKnowledgeLibraryId === currentLibraryId.value) {
    await loadEntityTypes();
    await loadRelationTypes();
  }
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
  { key: "relations", label: "关系管理", icon: "ri:share-node-line" },
  { key: "extract", label: "LLM 抽取", icon: "ri:sparkling-line" },
  { key: "query", label: "查询", icon: "ri:question-answer-line" },
  { key: "settings", label: "设置", icon: "ri:settings-4-line" },
];

const activeTab = ref("graph");

// ── Graph ──────────────────────────────────────────────────────

const graphCanvasRef = ref<HTMLElement | null>(null);
const graphData = reactive<{ nodes: KgGraphData['nodes'] | null; edges: KgGraphData['edges'] | null }>({ nodes: null, edges: null });
const graphFilter = reactive({ type: "", limit: 200 });
const selectedNode = ref<string | null>(null);
const neighbors = ref<any[]>([]);
const selectedNodeInfo = ref<{ name: string; type: string } | null>(null);
const svgSize = reactive({ w: 800, h: 600 });
const colorByType = reactive<Record<string, string>>({});
const nodePos = reactive<Record<string, { x: number; y: number }>>({});

const typeColors = ["#409eff","#67c23a","#e6a23c","#f56c6c","#909399","#b37feb","#36cfc9","#ff85c0","#ffc069","#95de64"];

function layoutGraph(nodes: KgGraphData['nodes'], edges: KgGraphData['edges']) {
  const w = graphCanvasRef.value?.clientWidth ?? 800;
  const h = Math.max(400, w * 0.55);
  svgSize.w = w;
  svgSize.h = h;

  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(w, h) * 0.35;

  // Assign colors to types
  const types = [...new Set(nodes.map(n => n.group))];
  types.forEach((t, i) => { colorByType[t] = typeColors[i % typeColors.length]; });

  // Simple circular layout
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    nodePos[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });
}

async function loadGraphData() {
  try {
    const res = await getGraphData({ type: graphFilter.type || undefined, limit: graphFilter.limit, libraryId: currentLibraryId.value });
    if (res.data) {
      graphData.nodes = res.data.nodes ?? [];
      graphData.edges = res.data.edges ?? [];
      layoutGraph(graphData.nodes, graphData.edges);
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
    selectedNodeInfo.value = node ? { name: node.label, type: node.group } : null;
  } catch { /* ignore */ }
}

// ── Entities ───────────────────────────────────────────────────

const entityRecords = ref<KgEntityItem[]>([]);
const entityTotal = ref(0);
const entityLoading = ref(false);
const entityQuery = reactive({ keyword: "", type: "", page: 1, size: 20 });
const entityTypes = ref<string[]>([]);
const showEntityDialog = ref(false);
const editingEntity = ref<KgEntityItem | null>(null);
const entityForm = reactive({ name: "", type: "default", properties: "" });

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
  showEntityDialog.value = true;
}

async function handleSaveEntity() {
  const data: any = { sysAiKnowledgeGraphEntityName: entityForm.name, sysAiKnowledgeGraphEntityType: entityForm.type, sysAiKnowledgeGraphLibraryId: currentLibraryId.value };
  if (entityForm.properties) data.sysAiKnowledgeGraphEntityProperties = entityForm.properties;
  if (editingEntity.value) data.sysAiKnowledgeGraphEntityId = editingEntity.value.sysAiKnowledgeGraphEntityId;

  try {
    const fn = editingEntity.value ? updateEntity : createEntity;
    await fn(data);
    ElMessage.success(editingEntity.value ? "更新成功" : "创建成功");
    showEntityDialog.value = false;
    editingEntity.value = null;
    entityForm.name = ""; entityForm.type = "default"; entityForm.properties = "";
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

// ── Relations ──────────────────────────────────────────────────

const relationRecords = ref<KgRelationItem[]>([]);
const relationTotal = ref(0);
const relationLoading = ref(false);
const relationQuery = reactive({ keyword: "", type: "", page: 1, size: 20 });
const relationTypes = ref<string[]>([]);
const showRelationDialog = ref(false);
const editingRelation = ref<KgRelationItem | null>(null);
const relationForm = reactive({ sourceEntityUid: "", targetEntityUid: "", type: "related_to", weight: 1.0, properties: "" });

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

function editRelation(row: KgRelationItem) {
  editingRelation.value = row;
  relationForm.sourceEntityUid = row.sysAiKnowledgeGraphRelationSourceEntityUid;
  relationForm.targetEntityUid = row.sysAiKnowledgeGraphRelationTargetEntityUid;
  relationForm.type = row.sysAiKnowledgeGraphRelationType;
  relationForm.weight = row.sysAiKnowledgeGraphRelationWeight;
  relationForm.properties = row.sysAiKnowledgeGraphRelationProperties || "";
  showRelationDialog.value = true;
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
    const res = await apiExtractRelations({ text: extractText.value, libraryId: currentLibraryId.value });
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
  llm_provider: "LLM 提供商",
  llm_model: "LLM 模型",
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
});
</script>

<style scoped lang="scss">
.kg-workbench {
  width: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;

  &__header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    background: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color-light);
  }

  &__back {
    width: 36px; height: 36px; border-radius: 8px;
    border: 1px solid var(--el-border-color);
    background: var(--el-fill-color-blank);
    cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
    &:hover { background: var(--el-fill-color-light); }
  }

  &__header-info h2 { margin: 0; font-size: 18px; }
  &__header-info p { margin: 2px 0 0; font-size: 12px; color: var(--el-text-color-secondary); }

  &__nav {
    margin-left: auto;
    display: flex; gap: 4px;
  }

  &__library-selector {
    display: flex; align-items: center; gap: 4px; margin-left: 12px;
  }

  &__nav-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 14px; border-radius: 6px;
    border: none; background: transparent;
    cursor: pointer; font-size: 13px; color: var(--el-text-color-secondary);
    white-space: nowrap;
    &:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
    &.active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
  }

  &__panel {
    flex: 1; padding: 20px 24px; overflow: auto;
    display: flex; flex-direction: column;
  }

  // ── Toolbar ──
  &__toolbar {
    display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;
  }

  &__pagination {
    display: flex; justify-content: flex-end; margin-top: 16px;
  }

  // ── Graph ──
  &__graph-toolbar {
    display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
  }
  &__graph-filters { display: flex; align-items: center; gap: 8px; }
  &__graph-stats { margin-left: auto; font-size: 13px; color: var(--el-text-color-secondary); .divider { margin: 0 8px; } }
  &__graph-canvas {
    flex: 1; border: 1px solid var(--el-border-color-light); border-radius: 8px;
    background: var(--el-fill-color-blank); overflow: hidden; position: relative; min-height: 400px;
  }
  &__graph-svg { display: block; }
  &__graph-node { cursor: pointer; transition: transform 0.15s; &:hover { transform: scale(1.1); } &.selected circle { stroke: var(--el-color-warning); stroke-width: 3; } }
  &__graph-label { pointer-events: none; }
  &__graph-edge { transition: stroke 0.2s; &.highlight { stroke: var(--el-color-warning); stroke-width: 2.5; } }
  &__graph-empty {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px; color: var(--el-text-color-secondary);
  }
  &__graph-sidebar {
    position: absolute; top: 56px; right: 12px; width: 220px; max-height: 360px; overflow-y: auto;
    background: var(--el-bg-color); border: 1px solid var(--el-border-color); border-radius: 8px;
    padding: 12px; font-size: 13px;
    h4 { margin: 0 0 6px; font-size: 13px; color: var(--el-text-color-secondary); }
    .node-name { font-weight: 600; margin: 0; }
    .node-type { font-size: 12px; color: var(--el-text-color-secondary); margin: 2px 0 0; }
  }
  &__neighbor-item {
    display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 4px; cursor: pointer;
    .neighbor-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    &:hover { background: var(--el-fill-color-light); }
  }

  // ── Extract ──
  &__extract-layout {
    display: flex; gap: 20px; flex: 1;
    > * { flex: 1; }
  }
  &__extract-input h3, &__extract-results h3 { margin: 0 0 8px; font-size: 15px; }
  &__extract-actions { display: flex; gap: 8px; margin-top: 8px; }

  // ── File Upload ──
  &__file-zone {
    border: 2px dashed var(--el-border-color); border-radius: 8px;
    padding: 12px 16px; margin-bottom: 10px; cursor: pointer;
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    transition: all 0.2s; background: var(--el-fill-color-blank);
    &.is-dragover {
      border-color: var(--el-color-primary); background: var(--el-color-primary-light-9);
    }
    &:hover { border-color: var(--el-color-primary); }
    p { margin: 0; font-size: 13px; color: var(--el-text-color-secondary); }
  }
  &__file-hint { flex: 1; }
  &__file-info { flex: 1; display: flex; align-items: center; gap: 6px; color: var(--el-text-color-primary) !important; }
  &__file-progress {
    width: 100%; display: flex; align-items: center; gap: 8px;
    span { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; }
    .el-progress { flex: 1; }
  }

  // ── Query ──
  &__query-container { max-width: 700px; }
  &__query-input { margin-bottom: 16px; }
  &__query-actions { margin-top: 8px; }
  &__answer-content {
    background: var(--el-fill-color-light); border-radius: 8px; padding: 16px;
    line-height: 1.7; white-space: pre-wrap;
  }

  // ── Settings ──
  &__settings { max-width: 600px; h3 { margin: 0 0 16px; } }
  &__settings-form { display: flex; flex-direction: column; gap: 14px; }
  &__settings-item {
    display: flex; align-items: center; gap: 12px;
    label { width: 160px; font-size: 13px; flex-shrink: 0; }
    .el-input, .el-input-number { flex: 1; }
  }
  &__settings-tip { margin-top: 16px; font-size: 12px; color: var(--el-text-color-secondary); }

  // ── Dialogs ──
  &__overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 2000;
    display: flex; align-items: center; justify-content: center;
  }
  &__dialog {
    background: var(--el-bg-color); border-radius: 12px; padding: 24px;
    width: 480px; max-width: 90vw; max-height: 80vh; overflow-y: auto;
    h3 { margin: 0 0 16px; }
  }
  &__dialog-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
}
</style>
