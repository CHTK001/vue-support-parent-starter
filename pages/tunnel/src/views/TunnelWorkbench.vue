<script setup lang="ts">
/**
 * 内网穿透隧道工作台（@pages/tunnel）
 *
 * <p>支持 ngrok 与 Cloudflare Tunnel 两种 Provider，配置、启用、启停、删除全功能，
 * 状态通过 SSE 实时推送。</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElPopconfirm,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
} from "element-plus";
import { MagicStick, Refresh } from "@element-plus/icons-vue";
import { http, type SseClient } from "@repo/utils";
import type { TunnelProvider, TunnelRecord, TunnelView } from "../api/tunnelApi";
import {
  ngrokList,
  ngrokCreate,
  ngrokUpdate,
  ngrokDelete,
  ngrokStart,
  ngrokStop,
  ngrokStreamUrl,
  cloudflaredList,
  cloudflaredCreate,
  cloudflaredUpdate,
  cloudflaredDelete,
  cloudflaredStart,
  cloudflaredStop,
} from "../api/tunnelApi";

/* ==================== Provider 切换 ==================== */

/** 工作区 Provider：ngrok / cloudflared */
const props = defineProps<{ provider: TunnelProvider }>();

/** 抽屉标题（新建/编辑） */
const drawerTitle = computed(() =>
  selected.value ? `编辑 ${props.provider} 隧道` : `新建 ${props.provider} 隧道`,
);

/** Provider 切换的 API 出口 */
const api = computed(() => ({
  list: props.provider === "ngrok" ? ngrokList : cloudflaredList,
  create: props.provider === "ngrok" ? ngrokCreate : cloudflaredCreate,
  update: props.provider === "ngrok" ? ngrokUpdate : cloudflaredUpdate,
  delete: props.provider === "ngrok" ? ngrokDelete : cloudflaredDelete,
  start: props.provider === "ngrok" ? ngrokStart : cloudflaredStart,
  stop: props.provider === "ngrok" ? ngrokStop : cloudflaredStop,
  streamUrl: props.provider === "ngrok" ? ngrokStreamUrl() : cloudflaredStreamUrl(),
}));

/* ==================== 表格 ==================== */

/** 隧道列表 */
const list = ref<TunnelView[]>([]);

/** 选中行 */
const selected = ref<TunnelView | null>(null);

/** 工作区抽屉：新建/编辑 */
const drawerVisible = ref(false);
const formRef = ref<InstanceType<typeof ElForm>>();

/** 表单初始模型 */
const emptyForm: TunnelRecord = {
  id: "",
  provider: props.provider,
  name: "",
  localPort: 8080,
  mode: "http",
  domain: "",
  remoteAddress: "",
  basicAuth: "",
  authtoken: "",
  token: "",
  metadata: "",
  autoStart: false,
  enabled: true,
  remark: "",
  createdAt: 0,
  updatedAt: 0,
};

const formModel = ref<TunnelRecord>(JSON.parse(JSON.stringify(emptyForm)));
const formLoading = ref(false);

/** 表单校验规则 */
const rules = {
  name: [{ required: true, message: "请输入映射名称", trigger: "blur" }],
  localPort: [
    { required: true, message: "请输入本地端口", trigger: "blur" },
    { type: "number", min: 1, max: 65535, message: "端口必须在 1 - 65535 之间", trigger: "blur" },
  ],
  mode: [{ required: true, message: "请选择隧道模式", trigger: "change" }],
};

/* ==================== SSE 实时流 ==================== */

/** SSE 连接（携带审计 Header） */
let sseClient: SseClient | null = null;

function connectSSE() {
  if (sseClient) {
    sseClient.close();
    sseClient = null;
  }
  sseClient = http().get(api.value.streamUrl).sse({
    onMessage: (event) => {
      if (Array.isArray(event.data)) {
        list.value = event.data as TunnelView[];
        // 保持选中的行不闪烁
        if (selected.value) {
          const updated = list.value.find((r) => r.id === selected.value.id);
          if (updated) {
            selected.value = updated;
          } else {
            selected.value = null;
          }
        }
      }
    },
    onError: (err) => {
      console.warn("[tunnel] SSE 错误", err);
    },
    onOpen: () => {
      console.log("[tunnel] SSE 连接已建立");
    },
    reconnect: true,
  });
}

onMounted(() => {
  connectSSE();
});

onBeforeUnmount(() => {
  sseClient?.close();
  sseClient = null;
});

/* ==================== 操作 ==================== */

function openCreate() {
  selected.value = null;
  formModel.value = JSON.parse(JSON.stringify(emptyForm));
  drawerVisible.value = true;
}

function openEdit(row: TunnelView) {
  selected.value = row;
  formModel.value = { ...row };
  drawerVisible.value = true;
}

function createTunnelRecord(model: TunnelRecord) {
  return api.value.create(model);
}

function updateTunnelRecord(id: string, model: TunnelRecord) {
  return api.value.update(id, model);
}

function deleteTunnelRecord(id: string) {
  return api.value.delete(id);
}

function startTunnelRecord(id: string) {
  return api.value.start(id);
}

function stopTunnelRecord(id: string) {
  return api.value.stop(id);
}

function onFormSubmit() {
  formRef.value!.validate((valid) => {
    if (!valid) return;
    formLoading.value = true;
    if (selected.value) {
      updateTunnelRecord(selected.value.id, formModel.value)
        .then(() => {
          ElMessage.success("更新成功");
          drawerVisible.value = false;
        })
        .finally(() => {
          formLoading.value = false;
        });
    } else {
      createTunnelRecord(formModel.value)
        .then(() => {
          ElMessage.success("创建成功");
          drawerVisible.value = false;
        })
        .finally(() => {
          formLoading.value = false;
        });
    }
  });
}

function onFormCancel() {
  drawerVisible.value = false;
  formRef.value?.resetFields();
}

function onRowClick(row: TunnelView) {
  selected.value = row;
}

/* ==================== 工具 ==================== */

/** 行选中状态标签 */
function stateTagOf(status: boolean) {
  return { type: status ? "success" : "info", text: status ? "运行中" : "已停止" };
}

</script>

<template>
  <div class="tunnel-workbench">
    <!-- 顶部栏 -->
    <div class="tunnel-header">
      <div class="tunnel-header-left">
        <h2 class="tunnel-header-title">隧道列表</h2>
        <el-tag :type="list.some((t) => t.running) ? 'success' : 'info'" size="default">
          总计 {{ list.length }} · 在线 {{ list.filter((t) => t.running).length }}
        </el-tag>
      </div>
      <div class="tunnel-header-right">
        <el-button :icon="Refresh" plain size="small" @click="connectSSE" title="重新连接 SSE">刷新</el-button>
        <el-button :icon="MagicStick" plain size="small" @click="openCreate">新建隧道</el-button>
      </div>
    </div>

    <!-- 表格 -->
    <el-table
      :data="list"
      style="width: 100%"
      :default-sort="{ prop: 'createdAt', order: 'descending' }"
      @row-click="onRowClick"
    >
      <el-table-column prop="id" label="ID" width="180" />
      <el-table-column prop="name" label="名称" width="140" />
      <el-table-column prop="localPort" label="本地端口" width="120" sortable />
      <el-table-column prop="mode" label="模式" width="100" />
      <el-table-column prop="domain" label="域名" min-width="200" show-overflow-tooltip />
      <el-table-column prop="publicUrls" label="公网地址" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.publicUrls.length">
            <el-tag
              v-for="url in row.publicUrls.slice(0, 2)"
              :key="url"
              size="small"
              class="mr-4"
              type="success"
            >
              {{ url }}
            </el-tag>
            <el-tag v-if="row.publicUrls.length > 2" size="small">+{{ row.publicUrls.length - 2 }}</el-tag>
          </div>
          <span v-else class="text-gray-400">未分配</span>
        </template>
      </el-table-column>
      <el-table-column prop="running" label="状态" width="100" sortable>
        <template #default="{ row }">
          <el-tag :type="row.running ? 'success' : 'info'" size="small">
            {{ row.running ? "运行中" : "已停止" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="error" label="错误信息" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.error" class="text-red-500">{{ row.error }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-popconfirm
            :title="row.running ? '确定要停止该隧道吗？' : '确定要启动该隧道吗？'"
            @confirm="row.running ? stopTunnelRecord(row.id) : startTunnelRecord(row.id)"
          >
            <template #reference>
              <el-button size="small" :type="row.running ? 'danger' : 'success'" plain>
                {{ row.running ? "停止" : "启动" }}
              </el-button>
            </template>
          </el-popconfirm>
          <el-button size="small" plain @click="openEdit(row)">编辑</el-button>
          <el-popconfirm title="确定要删除该隧道吗？" @confirm="deleteTunnelRecord(row.id)">
            <template #reference>
              <el-button size="small" type="danger" plain>删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建/编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="520">
      <el-form ref="formRef" :model="formModel" :rules="rules" label-width="100" class="tunnel-form">
        <el-form-item label="名称">
          <ElInput v-model="formModel.name" placeholder="必填" />
        </el-form-item>

        <el-form-item label="本地端口">
          <ElInput v-model.number="formModel.localPort" type="number" placeholder="如 8080" />
        </el-form-item>

        <el-form-item label="模式">
          <ElSelect v-model="formModel.mode" placeholder="选择模式">
            <template v-if="props.provider === 'ngrok'">
              <el-option label="HTTP 转发" value="http" />
              <el-option label="TCP 转发" value="tcp" />
              <el-option label="TLS 隧道" value="tls" />
            </template>
            <template v-else>
              <el-option label="Quick Tunnel (免账号)" value="quick" />
              <el-option label="Named Tunnel (需 Token)" value="named" />
            </template>
          </ElSelect>
        </el-form-item>

        <template v-if="formModel.mode === 'http' || formModel.mode === 'tls'">
          <el-form-item label="域名">
            <ElInput v-model="formModel.domain" placeholder="可选" />
          </el-form-item>
          <el-form-item label="Basic 认证">
            <ElInput v-model="formModel.basicAuth" placeholder="user:password" />
          </el-form-item>
        </template>

        <template v-if="formModel.mode === 'tcp'">
          <el-form-item label="远程地址">
            <ElInput v-model="formModel.remoteAddress" placeholder="如 1.tcp.ngrok.io:20000" />
          </el-form-item>
        </template>

        <template v-if="props.provider === 'cloudflared'">
          <el-form-item label="Token">
            <ElInput v-model="formModel.token" placeholder="Zero Trust 隧道 Token（可选）" />
          </el-form-item>
        </template>

        <el-form-item label="自动启动">
          <ElSwitch v-model="formModel.autoStart" />
        </el-form-item>

        <el-form-item label="启用">
          <ElSwitch v-model="formModel.enabled" />
        </el-form-item>

        <el-form-item label="备注">
          <ElInput v-model="formModel.remark" type="textarea" />
        </el-form-item>

        <div class="form-actions">
          <ElButton @click="onFormCancel">取消</ElButton>
          <ElButton type="primary" :loading="formLoading" @click="onFormSubmit">保存</ElButton>
        </div>
      </el-form>
    </el-drawer>
  </div>
</template>

<style scoped>
.tunnel-workbench {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

.tunnel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
}

.tunnel-header-left {
  display: flex;
  align-items: center;
  gap: 16px;

  .tunnel-header-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
  }
}

.tunnel-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-gray-400 {
  color: var(--el-text-color-secondary);
}

.mr-4 {
  margin-right: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

:deep(.tunnel-form) {
  .el-form-item {
    margin-bottom: 20px;
  }
}
</style>
