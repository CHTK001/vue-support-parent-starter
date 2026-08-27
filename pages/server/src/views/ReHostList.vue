<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  queryHosts,
  getGroups,
  saveHost,
  delHost,
  switchHost,
  testConnectHost,
  getIdentities,
} from '../api';
import ReHostFormDialog from '../components/ReHostFormDialog.vue';
import ReConnectDialog from '../components/ReConnectDialog.vue';
import ReGuacViewer from '../components/ReGuacViewer.vue';
import ReSftpPanel from '../components/ReSftpPanel.vue';

/** 主机行 */
interface HostRow {
  id: number;
  serverHostName: string;
  serverHostCode?: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostOsType: string;
  msServerGroupId?: number | null;
  serverHostTags?: string;
  serverHostStatus: number;
  serverHostOnline: number;
  serverHostAgentKey?: string;
}

/** 分组行 */
interface GroupRow {
  id: number;
  msServerGroupName: string;
}

/** 主机列表 */
const hosts = ref<HostRow[]>([]);

/** 分组列表 */
const groups = ref<GroupRow[]>([]);

/** 身份列表（连接对话框用） */
const identities = ref<Array<Record<string, any>>>([]);

/** 过滤条件 */
const keyword = ref('');
const filterGroupId = ref<number | null>(null);

/** 加载态 */
const loading = ref(false);

/** 表单对话框 */
const formVisible = ref(false);
const editingHost = ref<HostRow | null>(null);

/** 连接对话框 */
const connectVisible = ref(false);
const connectingHost = ref<HostRow | null>(null);

/** 远控参数（非空即打开 viewer） */
const guacConnection = ref<{
  hostId: number;
  hostName: string;
  protocol: string;
  identityId: number | null;
  targetPort: number | null;
} | null>(null);

/** SFTP 面板抽屉 */
const sftpVisible = ref(false);
const sftpHostId = ref<number | null>(null);

onMounted(refresh);

/**
 * 刷新主机与分组数据
 */
async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const [hostList, groupList] = await Promise.all([
      queryHosts({ keyword: keyword.value || undefined, groupId: filterGroupId.value ?? undefined }),
      getGroups().catch(() => [] as GroupRow[]),
    ]);
    hosts.value = hostList ?? [];
    groups.value = groupList ?? [];
  } catch (e) {
    ElMessage.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/**
 * 打开新增表单
 */
function openCreate(): void {
  editingHost.value = null;
  formVisible.value = true;
}

/**
 * 打开编辑表单
 *
 * @param row 主机
 */
function openEdit(row: HostRow): void {
  editingHost.value = row;
  formVisible.value = true;
}

/**
 * 表单提交回调
 *
 * @param data 表单数据
 */
async function onSubmitForm(data: Record<string, any>): Promise<void> {
  try {
    await saveHost(data.id ?? null, data);
    ElMessage.success('已保存');
    formVisible.value = false;
    refresh();
  } catch (e) {
    ElMessage.error((e as Error).message);
  }
}

/**
 * 删除主机
 *
 * @param row 主机
 */
async function onDelete(row: HostRow): Promise<void> {
  await ElMessageBox.confirm(`确认删除主机 ${row.serverHostName}?`, '删除', { type: 'warning' });
  await delHost(row.id);
  ElMessage.success('已删除');
  refresh();
}

/**
 * 启停切换
 *
 * @param row 主机
 */
async function onSwitch(row: HostRow): Promise<void> {
  await switchHost(row.id, row.serverHostStatus === 1 ? false : true);
  refresh();
}

/**
 * 连通性测试
 *
 * @param row 主机
 */
async function onTestConnect(row: HostRow): Promise<void> {
  const message = ElMessage({
    type: 'info',
    message: `正在测试 ${row.serverHostAddress} …`,
    duration: 0,
  });
  try {
    const banner = await testConnectHost(row.id);
    message.close();
    ElMessage.success(`测试成功：${banner}`);
    refresh();
  } catch (e) {
    message.close();
    ElMessage.error((e as Error).message);
  }
}

/**
 * 打开连接配置
 *
 * @param row 主机
 */
async function onOpenConnect(row: HostRow): Promise<void> {
  if (identities.value.length === 0) {
    identities.value = await getIdentities().catch(() => []);
  }
  connectingHost.value = row;
  connectVisible.value = true;
}

/**
 * 发起远控连接
 *
 * @param params 连接参数
 */
function onConnect(params: {
  hostId: number;
  protocol: string;
  identityId: number | null;
  targetPort: number | null;
}): void {
  guacConnection.value = {
    hostId: params.hostId,
    hostName: connectingHost.value?.serverHostName ?? '',
    protocol: params.protocol,
    identityId: params.identityId,
    targetPort: params.targetPort,
  };
}

/**
 * 打开 SFTP 面板
 *
 * @param row 主机
 */
function onOpenSftp(row: HostRow): void {
  sftpHostId.value = row.id;
  sftpVisible.value = true;
}

/**
 * 分组名称反查
 *
 * @param groupId 分组 ID
 */
function groupName(groupId?: number | null): string {
  return groups.value.find(g => g.id === groupId)?.msServerGroupName ?? '-';
}

/**
 * 标签 JSON 解析
 *
 * @param raw JSON 数组字符串
 */
function parseTags(raw?: string): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
</script>

<template>
  <div class="host-list">
    <!-- 工具条 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索名称/编码/地址"
        clearable
        style="width: 240px"
        @keyup.enter="refresh"
      />
      <el-select
        v-model="filterGroupId"
        placeholder="全部分组"
        clearable
        style="width: 160px"
        @change="queryHosts({ groupId: filterGroupId }).then(r => (hosts = r ?? [])).catch(() => {})"
      >
        <el-option v-for="group in groups" :key="group.id" :value="group.id" :label="group.msServerGroupName" />
      </el-select>
      <el-button type="primary" @click="openCreate">新增主机</el-button>
      <el-button @click="refresh">刷新</el-button>
    </div>

    <!-- 主机表格 -->
    <el-table v-loading="loading" :data="hosts" border stripe size="default">
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.serverHostOnline === 1 ? 'success' : row.serverHostOnline === 0 ? 'danger' : 'info'" size="small">
            {{ row.serverHostOnline === 1 ? '在线' : row.serverHostOnline === 0 ? '离线' : '未知' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="serverHostName" label="名称" min-width="140" show-overflow-tooltip />
      <el-table-column prop="serverHostAddress" label="地址" min-width="140" show-overflow-tooltip />
      <el-table-column prop="serverHostPort" label="端口" width="70" />
      <el-table-column prop="serverHostOsType" label="系统" width="90" />
      <el-table-column label="分组" width="110">
        <template #default="{ row }">{{ groupName(row.msServerGroupId) }}</template>
      </el-table-column>
      <el-table-column label="标签" min-width="120">
        <template #default="{ row }">
          <el-tag
            v-for="tag in parseTags(row.serverHostTags)"
            :key="tag"
            size="small"
            style="margin-right: 4px"
          >{{ tag }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用" width="80">
        <template #default="{ row }">
          <el-switch :model-value="row.serverHostStatus === 1" @change="onSwitch(row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="330" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="onOpenConnect(row)">连接</el-button>
          <el-button link type="primary" size="small" @click="onOpenSftp(row)">文件</el-button>
          <el-button link size="small" @click="onTestConnect(row)">测连</el-button>
          <el-button link size="small" @click="openEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 表单 / 连接 / 远控 / SFTP -->
    <ReHostFormDialog v-model="formVisible" :host="editingHost" @submit="onSubmitForm" />
    <ReConnectDialog v-model="connectVisible" :host="connectingHost" :identities="identities" @connect="onConnect" />
    <ReGuacViewer :connection="guacConnection" @close="guacConnection = null" />

    <el-drawer v-model="sftpVisible" :title="`SFTP 文件管理`" direction="rtl" size="60%" destroy-on-close>
      <ReSftpPanel :host-id="sftpHostId" />
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.host-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}
</style>
