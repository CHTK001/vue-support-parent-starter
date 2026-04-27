<template>
  <section class="redis-workspace">
    <ScLayout
      v-model="railTabValue"
      class="redis-layout"
      left-enabled
      :left-width="260"
      :left-min-width="200"
      :left-max-width="380"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <!-- 左侧 key 树 -->
      <template #left>
        <div class="key-panel">
          <!-- DB 切换 -->
          <div class="db-switcher">
            <span class="db-label">DB</span>
            <div class="db-buttons">
              <button
                v-for="db in 16"
                :key="db - 1"
                type="button"
                class="db-btn"
                :class="{ 'is-active': currentDb === db - 1 }"
                @click="switchDb(db - 1)"
              >{{ db - 1 }}</button>
            </div>
          </div>

          <!-- 搜索栏 -->
          <div class="search-bar">
            <ElInput
              v-model="pattern"
              placeholder="pattern，如 user:*"
              clearable
              @keyup.enter="loadKeys"
            >
              <template #prefix>
                <ElIcon><Search /></ElIcon>
              </template>
            </ElInput>
            <ElTooltip :content="viewMode === 'tree' ? '切换列表' : '切换树形'">
              <ElButton :icon="viewMode === 'tree' ? Menu : Grid" circle @click="viewMode = viewMode === 'tree' ? 'list' : 'tree'" />
            </ElTooltip>
            <ElTooltip content="刷新">
              <ElButton :icon="RefreshRight" circle :loading="keysLoading" @click="loadKeys" />
            </ElTooltip>
          </div>

          <!-- key 树/列表 -->
          <ElScrollbar class="key-scroll">
            <!-- 树形模式 -->
            <ElTree
              v-if="viewMode === 'tree' && treeData.length"
              ref="treeRef"
              :data="treeData"
              :props="treeProps"
              node-key="id"
              :expand-on-click-node="false"
              :highlight-current="true"
              @node-click="handleNodeClick"
            >
              <template #default="{ node, data }">
                <div
                  class="key-node"
                  :class="{ 'is-leaf': data.isLeaf }"
                  @mouseenter="hoveredNodeId = data.id"
                  @mouseleave="hoveredNodeId = ''"
                >
                  <ElIcon class="key-node__icon">
                    <component :is="data.isLeaf ? resolveTypeIcon(data.type) : FolderOpened" />
                  </ElIcon>
                  <span v-if="data.isLeaf && data.type" class="key-type-badge" :class="`type-badge--${data.type}`">{{ data.type[0].toUpperCase() }}</span>
                  <span class="key-node__label">{{ node.label }}</span>
                  <div v-if="data.isLeaf && hoveredNodeId === data.id" class="key-node__toolbar" @click.stop>
                    <ElTooltip content="删除此 key">
                      <ElButton :icon="Delete" circle type="danger" plain @click="confirmDeleteKey(data)" />
                    </ElTooltip>
                  </div>
                  <!-- 非叶子节点：删除该前缀下所有 key -->
                  <div v-if="!data.isLeaf && hoveredNodeId === data.id" class="key-node__toolbar" @click.stop>
                    <ElTooltip :content="`删除 ${data.id}:* 下所有 key`">
                      <ElButton :icon="Delete" circle type="danger" plain @click="confirmDeletePrefix(data)" />
                    </ElTooltip>
                  </div>
                </div>
              </template>
            </ElTree>
            <!-- 列表模式 -->
            <div v-else-if="viewMode === 'list' && flatKeys.length" class="key-list">
              <div
                v-for="item in flatKeys"
                :key="item.key"
                class="key-list-item"
                :class="{ 'is-active': selectedKey === item.key }"
                @click="handleNodeClick({ id: item.key, label: item.key, key: item.key, type: item.type, ttl: item.ttl, isLeaf: true })"
                @mouseenter="hoveredNodeId = item.key"
                @mouseleave="hoveredNodeId = ''"
              >
                <ElIcon class="key-list-item__icon">
                  <component :is="resolveTypeIcon(item.type)" />
                </ElIcon>
                <span v-if="item.type" class="key-type-badge" :class="`type-badge--${item.type}`">{{ item.type[0].toUpperCase() }}</span>
                <span class="key-list-item__name">{{ item.key }}</span>
                <span v-if="item.ttl > 0" class="key-list-item__ttl">{{ item.ttl }}s</span>
                <div v-if="hoveredNodeId === item.key" class="key-list-item__toolbar" @click.stop>
                  <ElTooltip content="删除">
                    <ElButton :icon="Delete" circle type="danger" plain @click="confirmDeleteKey({ id: item.key, label: item.key, key: item.key, type: item.type, ttl: item.ttl, isLeaf: true })" />
                  </ElTooltip>
                </div>
              </div>
            </div>
            <div v-else-if="keysLoading" class="key-empty">
              <ElIcon class="is-loading"><Loading /></ElIcon>
              <span>加载中…</span>
            </div>
            <ElEmpty v-else description="暂无 key，点击刷新" class="key-empty-state" />
          </ElScrollbar>

          <!-- 底部添加按钮 -->
          <div class="key-footer">
            <ElTooltip content="添加数据">
              <ElButton :icon="Plus" type="primary" circle @click="openAddDialog" />
            </ElTooltip>
            <span class="key-count">{{ totalKeys }} keys</span>
          </div>
        </div>
      </template>

      <!-- 右侧主内容 -->
      <template #default>
        <div class="main-content">
          <!-- 工作区 tab -->
          <template v-if="railTabValue === 'workspace'">
            <div v-if="!selectedKey" class="empty-workspace">
              <div class="empty-workspace__inner">
                <ElIcon class="empty-workspace__icon"><Connection /></ElIcon>
                <p>从左侧选择一个 key 查看值</p>
              </div>
            </div>
            <div v-else class="value-panel">
              <header class="value-header">
                <div class="value-header__meta">
                  <ElTag :type="typeTagColor(selectedKeyData?.type)" effect="plain" size="small">
                    {{ selectedKeyData?.type?.toUpperCase() }}
                  </ElTag>
                  <span class="value-header__key">{{ selectedKey }}</span>
                  <span v-if="selectedKeyData?.ttl && selectedKeyData.ttl > 0" class="value-header__ttl">
                    TTL: {{ selectedKeyData.ttl }}s
                  </span>
                </div>
                <!-- String 格式切换 -->
                <div v-if="selectedKeyData?.type === 'string'" class="format-switcher">
                  <button
                    v-for="fmt in stringFormats"
                    :key="fmt.value"
                    type="button"
                    class="fmt-btn"
                    :class="{ 'is-active': stringFormat === fmt.value }"
                    @click="stringFormat = fmt.value"
                  >{{ fmt.label }}</button>
                </div>
                <div class="value-header__actions">
                  <ElTooltip content="刷新值">
                    <ElButton :icon="RefreshRight" circle @click="loadValue(selectedKey)" />
                  </ElTooltip>
                </div>
              </header>

              <ElScrollbar class="value-scroll">
                <!-- String -->
                <div v-if="selectedKeyData?.type === 'string'" class="value-body">
                  <div v-if="stringFormat === 'text'" class="value-text">
                    <ElInput
                      v-model="editStringValue"
                      type="textarea"
                      :autosize="{ minRows: 6, maxRows: 24 }"
                      resize="none"
                    />
                    <div class="value-actions">
                      <ElTooltip content="保存">
                        <ElButton type="primary" :icon="FolderChecked" circle @click="saveStringValue" />
                      </ElTooltip>
                    </div>
                  </div>
                  <div v-else-if="stringFormat === 'json'" class="value-json">
                    <pre class="json-pre"><code v-html="highlightedJson" /></pre>
                  </div>
                  <div v-else-if="stringFormat === 'hex'" class="value-hex">
                    <pre class="hex-pre">{{ hexValue }}</pre>
                  </div>
                  <div v-else-if="stringFormat === 'base64'" class="value-base64">
                    <pre class="base64-pre">{{ base64Decoded }}</pre>
                  </div>
                </div>

                <!-- Hash -->
                <div v-else-if="selectedKeyData?.type === 'hash'" class="value-body">
                  <div class="collection-toolbar">
                    <ElTooltip content="添加字段">
                      <ElButton :icon="Plus" type="primary" plain circle @click="openAddFieldDialog('hash')" />
                    </ElTooltip>
                  </div>
                  <table class="kv-table">
                    <thead>
                      <tr><th>Field</th><th>Value</th><th></th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(val, field) in selectedKeyData.hashValue" :key="field">
                        <td class="kv-field">{{ field }}</td>
                        <td class="kv-value">{{ val }}</td>
                        <td class="kv-actions">
                          <ElButton :icon="Delete" circle type="danger" plain @click="deleteHashField(String(field))" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- List -->
                <div v-else-if="selectedKeyData?.type === 'list'" class="value-body">
                  <div class="collection-toolbar">
                    <ElTooltip content="追加元素">
                      <ElButton :icon="Plus" type="primary" plain circle @click="openAddFieldDialog('list')" />
                    </ElTooltip>
                  </div>
                  <div class="list-items">
                    <div
                      v-for="(item, idx) in selectedKeyData.listValue"
                      :key="idx"
                      class="list-item"
                    >
                      <span class="list-item__idx">{{ idx }}</span>
                      <span class="list-item__val">{{ item }}</span>
                      <ElButton :icon="Delete" circle type="danger" plain @click="deleteListItem(idx)" />
                    </div>
                  </div>
                </div>

                <!-- Set -->
                <div v-else-if="selectedKeyData?.type === 'set'" class="value-body">
                  <div class="collection-toolbar">
                    <ElTooltip content="添加成员">
                      <ElButton :icon="Plus" type="primary" plain circle @click="openAddFieldDialog('set')" />
                    </ElTooltip>
                  </div>
                  <div class="set-items">
                    <div
                      v-for="(member, idx) in selectedKeyData.setValue"
                      :key="idx"
                      class="set-item"
                    >
                      <span class="set-item__val">{{ member }}</span>
                      <ElButton :icon="Delete" circle type="danger" plain @click="deleteSetMember(member)" />
                    </div>
                  </div>
                </div>

                <!-- ZSet -->
                <div v-else-if="selectedKeyData?.type === 'zset'" class="value-body">
                  <div class="collection-toolbar">
                    <ElTooltip content="添加成员">
                      <ElButton :icon="Plus" type="primary" plain circle @click="openAddFieldDialog('zset')" />
                    </ElTooltip>
                  </div>
                  <table class="kv-table">
                    <thead>
                      <tr><th>Member</th><th>Score</th><th></th></tr>
                    </thead>
                    <tbody>
                      <tr v-for="(score, member) in selectedKeyData.zsetValue" :key="member">
                        <td class="kv-field">{{ member }}</td>
                        <td class="kv-value">{{ score }}</td>
                        <td class="kv-actions">
                          <ElButton :icon="Delete" circle type="danger" plain @click="deleteZsetMember(String(member))" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div v-else-if="valueLoading" class="value-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
              </ElScrollbar>
            </div>
          </template>

          <!-- 数据源信息 tab -->
          <template v-else-if="railTabValue === 'info'">
            <div class="info-panel">
              <div class="info-header">
                <span class="info-title">Redis 服务器信息</span>
                <ElButton :icon="RefreshRight" circle @click="loadInfo" />
              </div>
              <ElScrollbar class="info-scroll">
                <div v-if="redisInfo" class="info-content">
                  <div class="info-cards">
                    <div class="info-card">
                      <span class="info-card__label">版本</span>
                      <span class="info-card__value">{{ redisInfo.version }}</span>
                    </div>
                    <div class="info-card">
                      <span class="info-card__label">模式</span>
                      <span class="info-card__value">{{ redisInfo.mode }}</span>
                    </div>
                    <div class="info-card">
                      <span class="info-card__label">已用内存</span>
                      <span class="info-card__value">{{ formatBytes(redisInfo.usedMemory) }}</span>
                    </div>
                    <div class="info-card">
                      <span class="info-card__label">连接客户端</span>
                      <span class="info-card__value">{{ redisInfo.connectedClients }}</span>
                    </div>
                    <div class="info-card">
                      <span class="info-card__label">执行命令数</span>
                      <span class="info-card__value">{{ redisInfo.totalCommandsProcessed }}</span>
                    </div>
                    <div class="info-card">
                      <span class="info-card__label">运行时长</span>
                      <span class="info-card__value">{{ formatUptime(redisInfo.uptimeInSeconds) }}</span>
                    </div>
                  </div>
                  <div class="info-section">
                    <div class="info-section__title">数据库 Key 数量</div>
                    <div class="db-stats">
                      <div
                        v-for="(count, db) in redisInfo.dbKeyCounts"
                        :key="db"
                        class="db-stat-item"
                      >
                        <span class="db-stat-item__db">{{ db }}</span>
                        <span class="db-stat-item__count">{{ count }} keys</span>
                      </div>
                    </div>
                  </div>
                  <div class="info-section">
                    <div class="info-section__title">容量分布</div>
                    <div class="redis-pie-grid">
                      <div class="redis-pie-card">
                        <div class="redis-pie-card__title">按 Key 数量占比</div>
                        <ScEcharts v-if="hasDbStats" :option="keyPieOption" height="280px" />
                        <ElEmpty v-else description="暂无 DB key 统计数据" :image-size="40" />
                      </div>
                      <div class="redis-pie-card">
                        <div class="redis-pie-card__title">内存占比（已用/总量）</div>
                        <ScEcharts v-if="hasMemoryStats" :option="memoryPieOption" height="280px" />
                        <ElEmpty v-else description="暂无可用内存数据" :image-size="40" />
                      </div>
                    </div>
                  </div>
                  <div class="info-section">
                    <div class="info-section__title">原始信息</div>
                    <table class="raw-info-table">
                      <tbody>
                        <tr v-for="(val, key) in redisInfo.rawInfo" :key="key">
                          <td class="raw-key">{{ key }}</td>
                          <td class="raw-val">{{ val }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div v-else-if="infoLoading" class="value-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
                <ElEmpty v-else description="点击刷新加载服务器信息" />
              </ElScrollbar>
            </div>
          </template>

          <!-- CLI tab -->
          <template v-else-if="railTabValue === 'cli'">
            <div class="cli-panel">
              <div class="cli-header">
                <span class="cli-title">Redis CLI</span>
                <ElButton :icon="Delete" circle plain @click="cliHistory = []" />
              </div>
              <ElScrollbar ref="cliScrollRef" class="cli-output">
                <div class="cli-lines">
                  <div
                    v-for="(line, idx) in cliHistory"
                    :key="idx"
                    class="cli-line"
                    :class="{ 'is-cmd': line.type === 'cmd', 'is-result': line.type === 'result', 'is-error': line.type === 'error' }"
                  >
                    <span v-if="line.type === 'cmd'" class="cli-prompt">redis&gt;</span>
                    <span class="cli-text">{{ line.text }}</span>
                  </div>
                  <div v-if="!cliHistory.length" class="cli-hint">输入 Redis 命令，按 Enter 执行</div>
                </div>
              </ElScrollbar>
              <div class="cli-input-row">
                <span class="cli-prompt-inline">redis&gt;</span>
                <ElInput
                  v-model="cliInput"
                  placeholder="SET key value / GET key / ..."
                  class="cli-input"
                  @keyup.enter="executeCli"
                  @keyup.up="navigateHistory(-1)"
                  @keyup.down="navigateHistory(1)"
                />
                <ElTooltip content="执行">
                  <ElButton type="primary" :icon="CaretRight" circle @click="executeCli" />
                </ElTooltip>
              </div>
            </div>
          </template>
        </div>
      </template>
    </ScLayout>

    <!-- 添加数据对话框 -->
    <ElDialog
      v-model="addDialogVisible"
      title="添加数据"
      width="480px"
      :close-on-click-modal="false"
      class="add-dialog"
    >
      <ElForm ref="addFormRef" :model="addForm" :rules="addFormRules" label-width="80px" size="default">
        <ElFormItem label="类型">
          <ElSelect v-model="addForm.type" style="width: 100%">
            <ElOption v-for="t in keyTypes" :key="t.value" :label="t.label" :value="t.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="Key" prop="key">
          <ElInput v-model="addForm.key" placeholder="输入 key 名称" />
        </ElFormItem>
        <ElFormItem label="TTL (s)">
          <ElInputNumber v-model="addForm.ttl" :min="-1" placeholder="-1 表示永不过期" style="width: 100%" />
        </ElFormItem>
        <ElFormItem v-if="addForm.type === 'string'" label="Value" prop="value">
          <ElInput v-model="addForm.value" type="textarea" :rows="4" placeholder="字符串值" />
        </ElFormItem>
        <ElFormItem v-else-if="addForm.type === 'hash'" label="Field" prop="field">
          <ElInput v-model="addForm.field" placeholder="Hash field" />
        </ElFormItem>
        <ElFormItem v-if="addForm.type === 'hash'" label="Value" prop="value">
          <ElInput v-model="addForm.value" placeholder="Hash field value" />
        </ElFormItem>
        <ElFormItem v-if="addForm.type === 'list'" label="Value" prop="value">
          <ElInput v-model="addForm.value" placeholder="List 元素值" />
        </ElFormItem>
        <ElFormItem v-if="addForm.type === 'set'" label="Member" prop="value">
          <ElInput v-model="addForm.value" placeholder="Set 成员值" />
        </ElFormItem>
        <template v-if="addForm.type === 'zset'">
          <ElFormItem label="Member" prop="value">
            <ElInput v-model="addForm.value" placeholder="ZSet 成员" />
          </ElFormItem>
          <ElFormItem label="Score">
            <ElInputNumber v-model="addForm.score" style="width: 100%" />
          </ElFormItem>
        </template>
      </ElForm>
      <template #footer>
        <ElButton @click="addDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="addLoading" @click="submitAdd">确认添加</ElButton>
      </template>
    </ElDialog>

    <!-- 添加字段对话框（Hash/List/Set/ZSet 单条） -->
    <ElDialog
      v-model="addFieldDialogVisible"
      :title="`添加 ${addFieldType} 数据`"
      width="400px"
      :close-on-click-modal="false"
    >
      <ElForm :model="addFieldForm" label-width="80px">
        <ElFormItem v-if="addFieldType === 'hash'" label="Field">
          <ElInput v-model="addFieldForm.field" />
        </ElFormItem>
        <ElFormItem :label="addFieldType === 'zset' ? 'Member' : 'Value'">
          <ElInput v-model="addFieldForm.value" />
        </ElFormItem>
        <ElFormItem v-if="addFieldType === 'zset'" label="Score">
          <ElInputNumber v-model="addFieldForm.score" style="width: 100%" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="addFieldDialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="addFieldLoading" @click="submitAddField">确认</ElButton>
      </template>
    </ElDialog>
  </section>
</template>

<script setup lang="ts">
import {
  CaretRight,
  Connection,
  Cpu,
  DataAnalysis,
  Delete,
  FolderChecked,
  FolderOpened,
  Grid,
  Key,
  List,
  Loading,
  Menu,
  Plus,
  RefreshRight,
  Search,
  SetUp,
  Sort,
  Tickets,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElScrollbar,
  ElSelect,
  ElTag,
  ElTooltip,
  ElTree,
} from "element-plus";
import { computed, markRaw, nextTick, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import ScLayout from "@repo/components/ScLayout";
import ScEcharts from "@repo/components/ScEcharts";
import {
  delRedisKey,
  executeRedisCommand,
  fetchRedisInfo,
  getRedisValue,
  scanRedisKeys,
  selectRedisDb,
  setRedisValue,
  type PanelRedisInfoView,
  type PanelRedisValueView,
} from "../../api/redis";

const props = defineProps<{ connectionId: string }>();
const emit = defineEmits<{ (e: "close"): void }>();

// ─── Rail tabs ───────────────────────────────────────────────────────────────
const railTabs = [
  { name: "workspace", title: "工作区", icon: markRaw(Tickets) },
  { name: "info", title: "数据源信息", icon: markRaw(DataAnalysis) },
  { name: "cli", title: "CLI", icon: markRaw(Cpu) },
];
const railTabValue = ref<string>("workspace");

// ─── DB 切换 ─────────────────────────────────────────────────────────────────
const currentDb = ref(0);
const switchDb = async (db: number) => {
  if (db === currentDb.value) return;
  try {
    await selectRedisDb(props.connectionId, db);
    currentDb.value = db;
    selectedKey.value = "";
    selectedKeyData.value = null;
    await loadKeys();
  } catch {
    ElMessage.error(`切换 DB${db} 失败`);
  }
};

// ─── Key 树 ──────────────────────────────────────────────────────────────────
interface TreeNode {
  id: string;
  label: string;
  key?: string;
  type?: string;
  ttl?: number;
  isLeaf: boolean;
  children?: TreeNode[];
}

const pattern = ref("*");
const keysLoading = ref(false);
const treeData = ref<TreeNode[]>([]);
const viewMode = ref<"tree" | "list">("tree"); // 树形/列表切换
const totalKeys = ref(0);
const hoveredNodeId = ref("");
const treeRef = ref();
const flatKeys = ref<{ key: string; type: string; ttl: number }[]>([]);

const treeProps = { label: "label", children: "children", isLeaf: "isLeaf" };

const buildTree = (keys: { key: string; type: string; ttl: number }[]): TreeNode[] => {
  const root: Record<string, any> = {};
  for (const item of keys) {
    const parts = item.key.split(":");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node[part]) {
        node[part] = { _children: {}, _leaf: null };
      }
      if (i === parts.length - 1) {
        node[part]._leaf = item;
      } else {
        node = node[part]._children;
      }
    }
  }

  const convert = (obj: Record<string, any>, prefix: string): TreeNode[] => {
    return Object.entries(obj).map(([part, val]) => {
      const fullPath = prefix ? `${prefix}:${part}` : part;
      const children = convert(val._children, fullPath);
      if (val._leaf && children.length === 0) {
        return {
          id: fullPath,
          label: part,
          key: val._leaf.key,
          type: val._leaf.type,
          ttl: val._leaf.ttl,
          isLeaf: true,
        };
      }
      if (val._leaf) {
        children.unshift({
          id: `${fullPath}::leaf`,
          label: `(${part})`,
          key: val._leaf.key,
          type: val._leaf.type,
          ttl: val._leaf.ttl,
          isLeaf: true,
        });
      }
      return {
        id: fullPath,
        label: part,
        isLeaf: false,
        children,
      };
    });
  };

  return convert(root, "");
};

const loadKeys = async () => {
  keysLoading.value = true;
  try {
    const res = await scanRedisKeys(props.connectionId, pattern.value || "*", 500);
    const keys = res?.data ?? [];
    totalKeys.value = keys.length;
    flatKeys.value = keys;
    treeData.value = buildTree(keys);
  } catch {
    ElMessage.error("加载 key 失败");
  } finally {
    keysLoading.value = false;
  }
};

// ─── 节点点击 ─────────────────────────────────────────────────────────────────
const selectedKey = ref("");
const selectedKeyData = ref<PanelRedisValueView | null>(null);
const valueLoading = ref(false);

const handleNodeClick = (data: TreeNode) => {
  if (!data.isLeaf) return;
  selectedKey.value = data.key!;
  railTabValue.value = "workspace";
  loadValue(data.key!);
};

const loadValue = async (key: string) => {
  valueLoading.value = true;
  try {
    const res = await getRedisValue(props.connectionId, key);
    selectedKeyData.value = res?.data ?? null;
    if (selectedKeyData.value?.type === "string") {
      const raw = selectedKeyData.value.stringValue ?? "";
      editStringValue.value = raw;
      try {
        JSON.parse(raw);
        stringFormat.value = "json";
      } catch {
        stringFormat.value = "text";
      }
    }
  } catch {
    ElMessage.error("加载值失败");
  } finally {
    valueLoading.value = false;
  }
};

// ─── String 格式 ──────────────────────────────────────────────────────────────
const stringFormats = [
  { label: "文本", value: "text" },
  { label: "JSON", value: "json" },
  { label: "二进制", value: "hex" },
  { label: "Base64", value: "base64" },
];
const stringFormat = ref("text");
const editStringValue = ref("");

const highlightedJson = computed(() => {
  const raw = selectedKeyData.value?.stringValue ?? "";
  try {
    const parsed = JSON.parse(raw);
    return syntaxHighlight(JSON.stringify(parsed, null, 2));
  } catch {
    return raw;
  }
});

const hexValue = computed(() => {
  const raw = selectedKeyData.value?.stringValue ?? "";
  return Array.from(new TextEncoder().encode(raw))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
});

const base64Decoded = computed(() => {
  const raw = selectedKeyData.value?.stringValue ?? "";
  try {
    return atob(raw);
  } catch {
    return "(无法解码 Base64)";
  }
});

const syntaxHighlight = (json: string) =>
  json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = "json-number";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-string";
        } else if (/true|false/.test(match)) {
          cls = "json-bool";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );

const saveStringValue = async () => {
  try {
    await setRedisValue(props.connectionId, {
      key: selectedKey.value,
      value: editStringValue.value,
      ttl: selectedKeyData.value?.ttl ?? -1,
    });
    ElMessage.success("保存成功");
    await loadValue(selectedKey.value);
  } catch {
    ElMessage.error("保存失败");
  }
};

// ─── Hash 操作 ────────────────────────────────────────────────────────────────
const deleteHashField = async (field: string) => {
  try {
    await executeRedisCommand(props.connectionId, `HDEL ${selectedKey.value} ${field}`);
    ElMessage.success("删除成功");
    await loadValue(selectedKey.value);
  } catch {
    ElMessage.error("删除失败");
  }
};

// ─── List 操作 ────────────────────────────────────────────────────────────────
const deleteListItem = async (idx: number) => {
  const val = selectedKeyData.value?.listValue?.[idx];
  if (val === undefined) return;
  try {
    await executeRedisCommand(props.connectionId, `LREM ${selectedKey.value} 1 ${val}`);
    ElMessage.success("删除成功");
    await loadValue(selectedKey.value);
  } catch {
    ElMessage.error("删除失败");
  }
};

// ─── Set 操作 ─────────────────────────────────────────────────────────────────
const deleteSetMember = async (member: string) => {
  try {
    await executeRedisCommand(props.connectionId, `SREM ${selectedKey.value} ${member}`);
    ElMessage.success("删除成功");
    await loadValue(selectedKey.value);
  } catch {
    ElMessage.error("删除失败");
  }
};

// ─── ZSet 操作 ────────────────────────────────────────────────────────────────
const deleteZsetMember = async (member: string) => {
  try {
    await executeRedisCommand(props.connectionId, `ZREM ${selectedKey.value} ${member}`);
    ElMessage.success("删除成功");
    await loadValue(selectedKey.value);
  } catch {
    ElMessage.error("删除失败");
  }
};

// ─── 删除 key ─────────────────────────────────────────────────────────────────
const confirmDeleteKey = async (data: TreeNode) => {
  try {
    await ElMessageBox.confirm(`确认删除 key: ${data.key}？`, "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    await delRedisKey(props.connectionId, data.key!);
    ElMessage.success("删除成功");
    if (selectedKey.value === data.key) {
      selectedKey.value = "";
      selectedKeyData.value = null;
    }
    await loadKeys();
  } catch {
    // 取消
  }
};

// 收集节点下所有叶子 key
const collectLeafKeys = (node: TreeNode): string[] => {
  if (node.isLeaf && node.key) return [node.key];
  return (node.children || []).flatMap(collectLeafKeys);
};

// 删除前缀节点下所有 key
const confirmDeletePrefix = async (data: TreeNode) => {
  const leafKeys = collectLeafKeys(data);
  if (!leafKeys.length) return;
  try {
    await ElMessageBox.confirm(
      `确认删除 "${data.id}:*" 下共 ${leafKeys.length} 个 key？此操作不可恢复。`,
      "批量删除确认",
      { type: "warning", confirmButtonText: "全部删除", cancelButtonText: "取消" }
    );
    // 批量删除
    await Promise.all(leafKeys.map(k => delRedisKey(props.connectionId, k)));
    ElMessage.success(`已删除 ${leafKeys.length} 个 key`);
    if (leafKeys.includes(selectedKey.value)) {
      selectedKey.value = "";
      selectedKeyData.value = null;
    }
    await loadKeys();
  } catch {
    // 取消
  }
};

// ─── 添加数据对话框 ────────────────────────────────────────────────────────────
const keyTypes = [
  { label: "String", value: "string" },
  { label: "Hash", value: "hash" },
  { label: "List", value: "list" },
  { label: "Set", value: "set" },
  { label: "ZSet", value: "zset" },
];

const addDialogVisible = ref(false);
const addLoading = ref(false);
const addFormRef = ref<FormInstance>();
const addForm = ref({
  type: "string",
  key: "",
  value: "",
  field: "",
  score: 0,
  ttl: -1,
});
const addFormRules = computed<FormRules>(() => ({
  key: [{ required: true, message: "请输入 key", trigger: "blur" }],
  field: addForm.value.type === "hash"
    ? [{ required: true, message: "请输入 field", trigger: "blur" }]
    : [],
  value: ["string", "hash", "list", "set", "zset"].includes(addForm.value.type)
    ? [{ required: true, message: "请输入 value", trigger: "blur" }]
    : [],
}));

const openAddDialog = () => {
  addForm.value = { type: "string", key: "", value: "", field: "", score: 0, ttl: -1 };
  addDialogVisible.value = true;
  nextTick(() => addFormRef.value?.clearValidate());
};

const submitAdd = async () => {
  const valid = await addFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  addLoading.value = true;
  try {
    const { type, key, value, field, score, ttl } = addForm.value;
    let cmd = "";
    if (type === "string") {
      cmd = `SET ${key} ${value}`;
    } else if (type === "hash") {
      cmd = `HSET ${key} ${field} ${value}`;
    } else if (type === "list") {
      cmd = `RPUSH ${key} ${value}`;
    } else if (type === "set") {
      cmd = `SADD ${key} ${value}`;
    } else if (type === "zset") {
      cmd = `ZADD ${key} ${score} ${value}`;
    }
    await executeRedisCommand(props.connectionId, cmd);
    if (ttl > 0) {
      await executeRedisCommand(props.connectionId, `EXPIRE ${key} ${ttl}`);
    }
    ElMessage.success("添加成功");
    addDialogVisible.value = false;
    await loadKeys();
  } catch {
    ElMessage.error("添加失败");
  } finally {
    addLoading.value = false;
  }
};

// ─── 添加字段对话框 ────────────────────────────────────────────────────────────
const addFieldDialogVisible = ref(false);
const addFieldLoading = ref(false);
const addFieldType = ref<"hash" | "list" | "set" | "zset">("hash");
const addFieldForm = ref({ field: "", value: "", score: 0 });

const openAddFieldDialog = (type: "hash" | "list" | "set" | "zset") => {
  addFieldType.value = type;
  addFieldForm.value = { field: "", value: "", score: 0 };
  addFieldDialogVisible.value = true;
};

const submitAddField = async () => {
  addFieldLoading.value = true;
  try {
    const { field, value, score } = addFieldForm.value;
    const key = selectedKey.value;
    let cmd = "";
    if (addFieldType.value === "hash") cmd = `HSET ${key} ${field} ${value}`;
    else if (addFieldType.value === "list") cmd = `RPUSH ${key} ${value}`;
    else if (addFieldType.value === "set") cmd = `SADD ${key} ${value}`;
    else if (addFieldType.value === "zset") cmd = `ZADD ${key} ${score} ${value}`;
    await executeRedisCommand(props.connectionId, cmd);
    ElMessage.success("添加成功");
    addFieldDialogVisible.value = false;
    await loadValue(key);
  } catch {
    ElMessage.error("添加失败");
  } finally {
    addFieldLoading.value = false;
  }
};

// ─── 服务器信息 ───────────────────────────────────────────────────────────────
const redisInfo = ref<PanelRedisInfoView | null>(null);
const infoLoading = ref(false);

const loadInfo = async () => {
  infoLoading.value = true;
  try {
    const res = await fetchRedisInfo(props.connectionId);
    redisInfo.value = res?.data ?? null;
  } catch {
    ElMessage.error("加载服务器信息失败");
  } finally {
    infoLoading.value = false;
  }
};

watch(railTabValue, (val) => {
  if (val === "info" && !redisInfo.value) loadInfo();
});

// ─── CLI ──────────────────────────────────────────────────────────────────────
interface CliLine {
  type: "cmd" | "result" | "error";
  text: string;
}

const cliInput = ref("");
const cliHistory = ref<CliLine[]>([]);
const cliCmdHistory = ref<string[]>([]);
const cliHistoryIdx = ref(-1);
const cliScrollRef = ref();

const executeCli = async () => {
  const cmd = cliInput.value.trim();
  if (!cmd) return;
  cliHistory.value.push({ type: "cmd", text: cmd });
  cliCmdHistory.value.unshift(cmd);
  cliHistoryIdx.value = -1;
  cliInput.value = "";
  try {
    const res = await executeRedisCommand(props.connectionId, cmd);
    const result = res?.data;
    cliHistory.value.push({
      type: "result",
      text: typeof result === "object" ? JSON.stringify(result, null, 2) : String(result ?? "(nil)"),
    });
  } catch (e: any) {
    cliHistory.value.push({ type: "error", text: e?.message ?? "执行失败" });
  }
  await nextTick();
  cliScrollRef.value?.setScrollTop(99999);
};

const navigateHistory = (dir: -1 | 1) => {
  const len = cliCmdHistory.value.length;
  if (!len) return;
  cliHistoryIdx.value = Math.max(-1, Math.min(len - 1, cliHistoryIdx.value + dir));
  cliInput.value = cliHistoryIdx.value >= 0 ? cliCmdHistory.value[cliHistoryIdx.value] : "";
};

// ─── 工具函数 ─────────────────────────────────────────────────────────────────
const resolveTypeIcon = (type?: string) => {
  const map: Record<string, any> = {
    string: markRaw(Tickets),
    hash: markRaw(SetUp),
    list: markRaw(List),
    set: markRaw(Sort),
    zset: markRaw(Sort),
  };
  return map[type ?? ""] ?? markRaw(Key);
};

const typeTagColor = (type?: string): "" | "success" | "warning" | "info" | "danger" => {
  const map: Record<string, "" | "success" | "warning" | "info" | "danger"> = {
    string: "",
    hash: "success",
    list: "warning",
    set: "info",
    zset: "danger",
  };
  return map[type ?? ""] ?? "info";
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

const dbStatsEntries = computed(() => Object.entries(redisInfo.value?.dbKeyCounts || {})
  .map(([db, count]) => ({ db, count: Number(count || 0) }))
  .filter(item => item.count > 0));

const hasDbStats = computed(() => dbStatsEntries.value.length > 0);

const memoryStats = computed(() => {
  const used = Number(redisInfo.value?.usedMemory || 0);
  const maxMemory = Number(redisInfo.value?.rawInfo?.maxmemory || 0);
  const totalSystemMemory = Number(redisInfo.value?.rawInfo?.total_system_memory || 0);
  const total = maxMemory > 0 ? maxMemory : (totalSystemMemory > 0 ? totalSystemMemory : 0);
  const free = Math.max(total - used, 0);
  return { used, total, free };
});

const hasMemoryStats = computed(() => memoryStats.value.used > 0 || memoryStats.value.total > 0);

const keyPieOption = computed(() => ({
  tooltip: {
    trigger: "item",
    formatter: "{b}<br/>Key数: {c} ({d}%)",
  },
  legend: {
    bottom: 0,
    type: "scroll",
  },
  series: [
    {
      name: "Key数量",
      type: "pie",
      radius: ["42%", "68%"],
      center: ["50%", "46%"],
      avoidLabelOverlap: true,
      label: {
        formatter: "{b}\n{d}%",
      },
      data: dbStatsEntries.value.map(item => ({
        name: item.db,
        value: item.count,
      })),
    },
  ],
}));

const memoryPieOption = computed(() => {
  const { used, total, free } = memoryStats.value;
  const displayTotal = total > 0 ? total : used;
  const displayFree = total > 0 ? free : 0;
  return {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const bytes = Number(params?.data?.bytes || 0);
        return `${params?.name}<br/>内存: ${formatBytes(bytes)} (${params?.percent}%)`;
      },
    },
    legend: {
      bottom: 0,
      type: "scroll",
    },
    series: [
      {
        name: "内存",
        type: "pie",
        radius: ["42%", "68%"],
        center: ["50%", "46%"],
        avoidLabelOverlap: true,
        label: {
          formatter: "{b}\n{d}%",
        },
        data: [
          {
            name: "已使用",
            value: Math.max(used, 0),
            bytes: Math.max(used, 0),
          },
          {
            name: "可用",
            value: Math.max(displayFree, 0),
            bytes: Math.max(displayFree, 0),
          },
        ],
      },
    ],
  };
});

// 初始化
loadKeys();
</script>

<style scoped lang="scss">
.redis-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.redis-layout {
  height: 100%;
  min-height: 0;
}

/* ── 左侧 key 面板 ── */
.key-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  gap: 6px;
  height: 100%;
  min-height: 0;
  padding: 10px 8px;
  background: linear-gradient(180deg, #f9fbfd, #f2f6f9);
  border-right: 1px solid rgba(135, 151, 163, 0.14);
}

/* DB 切换 */
.db-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.db-label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7f8e;
  flex-shrink: 0;
}

.db-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

.db-btn {
  width: 24px;
  height: 20px;
  border: 1px solid rgba(112, 136, 151, 0.22);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.7);
  color: #4f6472;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  line-height: 1;

  &:hover {
    background: rgba(37, 99, 235, 0.08);
    border-color: rgba(37, 99, 235, 0.3);
    color: #2563eb;
  }

  &.is-active {
    background: #2563eb;
    border-color: #2563eb;
    color: #fff;
    font-weight: 600;
  }
}

/* 搜索栏 */
.search-bar {
  display: flex;
  gap: 5px;
  align-items: center;
}

.search-bar :deep(.el-input) {
  flex: 1;
}

.search-bar :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px rgba(118, 137, 150, 0.16) inset;
}

/* key 树 */
.key-scroll {
  min-height: 0;
  height: 100%;
}

.key-node {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 2px 4px;
  border-radius: 6px;
  min-width: 0;

  &.is-leaf {
    background: rgba(16, 185, 129, 0.04);
  }
}

.key-node__icon {
  flex-shrink: 0;
  font-size: 13px;
  color: #4f6472;
}

.key-node__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: #102431;
  font-weight: 500;
}

.key-node__type {
  flex-shrink: 0;
  font-size: 10px;
}

.key-node__toolbar {
  flex-shrink: 0;
  display: flex;
  gap: 2px;
}

.key-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 0;
  color: #8fa3b0;
  font-size: 13px;
}

.key-empty-state {
  padding-top: 24px;
}

/* 类型徽章（树形和列表通用） */
.key-type-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0;
}

.type-badge--string { background: #3b82f6; }
.type-badge--hash   { background: #f59e0b; }
.type-badge--list   { background: #10b981; }
.type-badge--set    { background: #8b5cf6; }
.type-badge--zset   { background: #ef4444; }
.type-badge--none   { background: #9ca3af; }

/* 列表模式 */
.key-list {
  display: flex;
  flex-direction: column;
}

.key-list-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(135, 151, 163, 0.06);
  transition: background 0.1s;

  &:hover { background: rgba(37, 99, 235, 0.05); }
  &.is-active { background: rgba(37, 99, 235, 0.1); }
}

.key-list-item__icon {
  flex-shrink: 0;
  font-size: 13px;
  color: #4f6472;
}

.key-list-item__name {
  flex: 1;
  font-size: 12px;
  color: #102431;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
}

.key-list-item__ttl {
  font-size: 10px;
  color: #f59e0b;
  flex-shrink: 0;
}

.key-list-item__toolbar {
  flex-shrink: 0;
  display: flex;
  gap: 2px;
}

/* 底部 */
.key-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 2px 0;
  border-top: 1px solid rgba(135, 151, 163, 0.12);
}

.add-btn {
  border-radius: 8px;
}

.key-count {
  font-size: 11px;
  color: #8fa3b0;
}

/* ── 主内容区 ── */
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* 空状态 */
.empty-workspace {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8fa3b0;
}

.empty-workspace__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-workspace__icon {
  font-size: 48px;
  opacity: 0.3;
}

/* 值面板 */
.value-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.value-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(135, 151, 163, 0.12);
  background: rgba(249, 251, 253, 0.9);
  flex-wrap: wrap;
}

.value-header__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.value-header__key {
  font-size: 13px;
  font-weight: 600;
  color: #102431;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.value-header__ttl {
  font-size: 11px;
  color: #8fa3b0;
  flex-shrink: 0;
}

.value-header__actions {
  flex-shrink: 0;
}

/* 格式切换 */
.format-switcher {
  display: flex;
  gap: 2px;
  background: rgba(112, 136, 151, 0.1);
  border-radius: 8px;
  padding: 2px;
}

.fmt-btn {
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #6b7f8e;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    color: #2563eb;
  }

  &.is-active {
    background: #fff;
    color: #2563eb;
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.1);
  }
}

.value-scroll {
  min-height: 0;
  height: 100%;
}

.value-body {
  padding: 14px;
  min-height: 100%;
}

.value-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #8fa3b0;
  font-size: 24px;
}

/* String 格式 */
.value-text {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.value-actions {
  display: flex;
  justify-content: flex-end;
}

.json-pre,
.hex-pre,
.base64-pre {
  margin: 0;
  padding: 14px;
  border-radius: 10px;
  background: #f4f7fa;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #2d3748;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid rgba(135, 151, 163, 0.14);
}

:deep(.json-key) { color: #2563eb; font-weight: 600; }
:deep(.json-string) { color: #16a34a; }
:deep(.json-number) { color: #d97706; }
:deep(.json-bool) { color: #7c3aed; }
:deep(.json-null) { color: #9ca3af; }

/* 集合工具栏 */
.collection-toolbar {
  margin-bottom: 10px;
}

/* KV 表格 */
.kv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th {
    padding: 7px 10px;
    text-align: left;
    font-weight: 600;
    color: #6b7f8e;
    border-bottom: 1px solid rgba(135, 151, 163, 0.16);
    background: rgba(249, 251, 253, 0.8);
  }

  td {
    padding: 7px 10px;
    border-bottom: 1px solid rgba(135, 151, 163, 0.08);
    vertical-align: middle;
  }

  tr:hover td {
    background: rgba(37, 99, 235, 0.04);
  }
}

.kv-field {
  color: #2563eb;
  font-weight: 500;
  font-family: monospace;
  width: 30%;
}

.kv-value {
  color: #102431;
  word-break: break-all;
}

.kv-actions {
  width: 40px;
  text-align: right;
}

/* List / Set */
.list-items,
.set-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.list-item,
.set-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(249, 251, 253, 0.8);
  border: 1px solid rgba(135, 151, 163, 0.1);
  font-size: 12px;

  &:hover {
    background: rgba(37, 99, 235, 0.04);
  }
}

.list-item__idx {
  flex-shrink: 0;
  width: 28px;
  text-align: center;
  font-size: 10px;
  color: #8fa3b0;
  background: rgba(112, 136, 151, 0.1);
  border-radius: 4px;
  padding: 1px 4px;
}

.list-item__val,
.set-item__val {
  flex: 1;
  color: #102431;
  word-break: break-all;
}

/* ── 信息面板 ── */
.info-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  height: 100%;
  min-height: 0;
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(135, 151, 163, 0.12);
}

.info-title {
  font-size: 13px;
  font-weight: 600;
  color: #102431;
}

.info-scroll {
  min-height: 0;
  height: 100%;
}

.info-content {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(249, 251, 253, 0.9);
  border: 1px solid rgba(135, 151, 163, 0.14);
}

.info-card__label {
  font-size: 11px;
  color: #8fa3b0;
  font-weight: 500;
}

.info-card__value {
  font-size: 16px;
  font-weight: 700;
  color: #102431;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-section__title {
  font-size: 12px;
  font-weight: 600;
  color: #6b7f8e;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.db-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.redis-pie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 10px;
}

.redis-pie-card {
  border: 1px solid rgba(135, 151, 163, 0.14);
  border-radius: 12px;
  background: rgba(249, 251, 253, 0.85);
  padding: 10px;
}

.redis-pie-card__title {
  font-size: 12px;
  font-weight: 600;
  color: #4f6472;
  margin-bottom: 6px;
}

.db-stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(37, 99, 235, 0.06);
  border: 1px solid rgba(37, 99, 235, 0.12);
  font-size: 12px;
}

.db-stat-item__db {
  font-weight: 600;
  color: #2563eb;
}

.db-stat-item__count {
  color: #6b7f8e;
}

.raw-info-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-family: monospace;

  td {
    padding: 4px 8px;
    border-bottom: 1px solid rgba(135, 151, 163, 0.08);
    vertical-align: top;
  }

  tr:hover td {
    background: rgba(37, 99, 235, 0.03);
  }
}

.raw-key {
  color: #2563eb;
  font-weight: 500;
  width: 40%;
  white-space: nowrap;
}

.raw-val {
  color: #4f6472;
  word-break: break-all;
}

/* ── CLI 面板 ── */
.cli-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  height: 100%;
  min-height: 0;
  background: #0f1923;
}

.cli-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.cli-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cli-output {
  min-height: 0;
  height: 100%;
}

.cli-lines {
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.cli-hint {
  color: rgba(255, 255, 255, 0.25);
  font-size: 12px;
  font-family: monospace;
  padding: 8px 0;
}

.cli-line {
  display: flex;
  gap: 8px;
  font-size: 12px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  line-height: 1.6;
  word-break: break-all;

  &.is-cmd .cli-text {
    color: #e2e8f0;
  }

  &.is-result .cli-text {
    color: #4ade80;
  }

  &.is-error .cli-text {
    color: #f87171;
  }
}

.cli-prompt {
  color: #f59e0b;
  font-weight: 600;
  flex-shrink: 0;
}

.cli-text {
  white-space: pre-wrap;
}

.cli-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(0, 0, 0, 0.2);
}

.cli-prompt-inline {
  color: #f59e0b;
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
  flex-shrink: 0;
}

.cli-input {
  flex: 1;
}

.cli-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.06);
  box-shadow: none;
  border-radius: 8px;
}

.cli-input :deep(.el-input__inner) {
  color: #e2e8f0;
  font-family: monospace;
  font-size: 12px;
}

/* ── 树样式覆盖 ── */
:deep(.el-tree) {
  background: transparent;
}

:deep(.el-tree-node__content) {
  height: auto;
  padding: 1px 0;
  border-radius: 7px;
}

:deep(.el-tree-node:focus > .el-tree-node__content),
:deep(.el-tree-node__content:hover) {
  background: rgba(37, 99, 235, 0.06);
}

:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background: rgba(37, 99, 235, 0.1);
}

/* 对话框 */
.add-dialog :deep(.el-dialog__body) {
  padding-top: 12px;
}
</style>
