<template>
  <section class="nginx-workspace">
    <ScLayout
      v-model="railTabValue"
      class="nginx-layout"
      left-enabled
      :left-width="260"
      :left-min-width="180"
      :left-max-width="360"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <!-- ── 左侧：站点树 ── -->
      <template #left>
        <NginxSiteTree
          :connection-id="props.connectionId"
          :servers="servers"
          :servers-loading="serversLoading"
          :active-server-index="activeServerIndex"
          :active-config-path="activeConfigPath"
          @select-server="onSelectServer"
          @open-edit="onOpenEdit"
          @open-add-location="onOpenAddLocation"
          @delete-server="onDeleteServer"
          @select-config="onSelectConfig"
          @open-add-server="addServerDialogVisible = true"
          @refresh="loadAll"
        />
      </template>

      <!-- ── 右侧主内容 ── -->
      <template #default>
        <div class="main-content">
          <!-- 大屏（默认页） -->
          <template v-if="railTabValue === 'dashboard'">
            <NginxDashboard
              :connection-id="props.connectionId"
              :host="props.host"
              :port="props.port"
              :username="props.username"
              :password="props.password"
              :private-key="props.privateKey"
            />
          </template>

          <!-- 编辑器 tab -->
          <template v-else-if="railTabValue === 'editor'">
            <NginxEditor
              :connection-id="props.connectionId"
              :active-config-path="activeConfigPath"
              :servers="servers"
              :active-server-index="activeServerIndex"
              :editing-server="editingServer"
              :server-form="serverForm"
              :server-card-refs="serverCardRefs"
              @back="onBackToCards"
              @save-server="onSaveServer"
              @open-edit="onOpenEdit"
              @add-location="onOpenAddLocation"
              @delete-location="onDeleteLocation"
              @delete-server="onDeleteServer"
              @config-saved="loadAll"
            />
          </template>

          <!-- 项目管理 tab -->
          <template v-else-if="railTabValue === 'project'">
            <NginxProjectPanel
              :connection-id="props.connectionId"
              :host="props.host || ''"
              :port="props.port || 22"
              :username="props.username || 'root'"
              :password="props.password"
              :private-key="props.privateKey"
            />
          </template>

          <!-- 日志 tab -->
          <template v-else-if="railTabValue === 'log'">
            <NginxLogPanel :connection-id="props.connectionId" />
          </template>
        </div>
      </template>
    </ScLayout>

    <!-- 添加 location 对话框 -->
    <NginxLocationDialog
      v-model="locationDialogVisible"
      :target-server-index="locationTargetServer"
      :saving="saving"
      @submit="onSubmitLocation"
    />

    <!-- 添加站点对话框 -->
    <NginxAddServerDialog
      v-model="addServerDialogVisible"
      :saving="saving"
      @submit="onSubmitAddServer"
    />
  </section>
</template>

<script setup lang="ts">
import { markRaw, nextTick, onMounted, reactive, ref } from "vue";
import {
  Connection,
  DataLine,
  Document,
  FolderOpened,
  Grid,
  Monitor,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import ScLayout from "@repo/components/ScLayout";
import NginxDashboard from "./NginxDashboard.vue";
import NginxSiteTree from "./NginxSiteTree.vue";
import NginxEditor from "./NginxEditor.vue";
import NginxLogPanel from "./NginxLogPanel.vue";
import NginxLocationDialog from "./NginxLocationDialog.vue";
import NginxAddServerDialog from "./NginxAddServerDialog.vue";
import NginxProjectPanel from "./NginxProjectPanel.vue";
import {
  fetchNginxServers,
  saveNginxServers,
  reloadNginx,
  type NginxServerBlock,
  type NginxLocationBlock,
} from "../../api/nginx";

type NginxRailTab = "dashboard" | "editor" | "project" | "log";

const props = defineProps<{
  connectionId: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
  initialTab?: NginxRailTab;
}>();
const emit = defineEmits<{ (e: "close"): void }>();

// ─── Rail tabs（大屏为默认） ───────────────────────────────────────────────────
const railTabs = [
  { name: "dashboard", title: "大屏", icon: markRaw(Monitor) },
  { name: "editor", title: "编辑器", icon: markRaw(Document) },
  { name: "project", title: "项目", icon: markRaw(FolderOpened) },
  { name: "log", title: "日志", icon: markRaw(Grid) },
];
const resolveInitialRailTab = (value?: string): NginxRailTab => {
  if (value === "editor" || value === "project" || value === "log") {
    return value;
  }
  return "dashboard";
};
const railTabValue = ref<NginxRailTab>(resolveInitialRailTab(props.initialTab));

// ─── 共享状态 ─────────────────────────────────────────────────────────────────
const servers = ref<NginxServerBlock[]>([]);
const serversLoading = ref(false);
const activeConfigPath = ref("/etc/nginx/nginx.conf");
const activeServerIndex = ref(-1);
const editingServer = ref(false);
const serverCardRefs = ref<HTMLElement[]>([]);
const saving = ref(false);

const serverForm = reactive<NginxServerBlock>({
  listen: "80",
  serverName: "",
  root: "",
  index: "index.html",
  sslCertificate: "",
  sslCertificateKey: "",
  locations: [],
});

const syncServerForm = (server: NginxServerBlock) => {
  Object.assign(serverForm, {
    listen: server.listen ?? "80",
    serverName: server.serverName ?? "",
    root: server.root ?? "",
    index: server.index ?? "index.html",
    sslCertificate: server.sslCertificate ?? "",
    sslCertificateKey: server.sslCertificateKey ?? "",
    locations: JSON.parse(JSON.stringify(server.locations ?? [])),
  });
};

// ─── 对话框状态 ───────────────────────────────────────────────────────────────
const locationDialogVisible = ref(false);
const locationTargetServer = ref(-1);
const addServerDialogVisible = ref(false);

// ─── 数据加载 ─────────────────────────────────────────────────────────────────
const loadAll = async () => {
  serversLoading.value = true;
  try {
    const res = await fetchNginxServers(
      props.connectionId,
      activeConfigPath.value,
    );
    const nextServers = (res?.data ?? []) as NginxServerBlock[];
    servers.value = nextServers;
    if (
      activeServerIndex.value >= 0 &&
      activeServerIndex.value < nextServers.length
    ) {
      if (editingServer.value) {
        syncServerForm(nextServers[activeServerIndex.value]);
      }
    } else if (activeServerIndex.value >= nextServers.length) {
      activeServerIndex.value = -1;
      editingServer.value = false;
    }
  } catch (e: any) {
    ElMessage.error("解析站点失败: " + (e?.message ?? ""));
  } finally {
    serversLoading.value = false;
  }
};

// ─── 事件处理 ─────────────────────────────────────────────────────────────────
const onSelectServer = (si: number) => {
  activeServerIndex.value = si;
  railTabValue.value = "editor";
  editingServer.value = false;
  syncServerForm(servers.value[si]);
  nextTick(() => {
    const el = serverCardRefs.value[si];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
};

const onOpenEdit = (si: number) => {
  onSelectServer(si);
  editingServer.value = true;
};

const onBackToCards = () => {
  editingServer.value = false;
  activeServerIndex.value = -1;
};

const onSaveServer = async () => {
  saving.value = true;
  try {
    const updated = [...servers.value];
    updated[activeServerIndex.value] = {
      ...serverForm,
      locations: [...(serverForm.locations ?? [])],
    };
    await saveNginxServers(props.connectionId, updated, activeConfigPath.value);
    servers.value = updated;
    await reloadNginx(props.connectionId);
    ElMessage.success("保存并 Reload 成功");
    editingServer.value = false;
    activeServerIndex.value = -1;
  } catch (e: any) {
    ElMessage.error("保存失败: " + (e?.message ?? ""));
  } finally {
    saving.value = false;
  }
};

const onOpenAddLocation = (si: number) => {
  locationTargetServer.value = si;
  locationDialogVisible.value = true;
};

const onSubmitLocation = async (loc: NginxLocationBlock) => {
  const si = locationTargetServer.value;
  const updated = [...servers.value];
  updated[si] = {
    ...updated[si],
    locations: [...(updated[si].locations ?? []), loc],
  };
  saving.value = true;
  try {
    await saveNginxServers(props.connectionId, updated, activeConfigPath.value);
    servers.value = updated;
    locationDialogVisible.value = false;
    ElMessage.success("映射已添加");
    await reloadNginx(props.connectionId);
  } catch (e: any) {
    ElMessage.error("添加失败: " + (e?.message ?? ""));
  } finally {
    saving.value = false;
  }
};

const onAddLocation = () => {
  if (!serverForm.locations) serverForm.locations = [];
  serverForm.locations.push({ path: "/new", mode: "proxy", proxyPass: "" });
};

const onDeleteLocation = (li: number) => {
  serverForm.locations?.splice(li, 1);
};

const onDeleteServer = async (si: number) => {
  try {
    await ElMessageBox.confirm(
      `确认删除站点 "${servers.value[si].serverName || si + 1}"？`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消" },
    );
    const updated = servers.value.filter((_, i) => i !== si);
    await saveNginxServers(props.connectionId, updated, activeConfigPath.value);
    servers.value = updated;
    if (activeServerIndex.value === si) activeServerIndex.value = -1;
    ElMessage.success("站点已删除");
    await reloadNginx(props.connectionId);
  } catch {
    /* 取消 */
  }
};

const onSelectConfig = (path: string) => {
  activeConfigPath.value = path;
  railTabValue.value = "editor";
  loadAll();
};

const onSubmitAddServer = async (server: NginxServerBlock) => {
  saving.value = true;
  try {
    const updated = [...servers.value, server];
    await saveNginxServers(props.connectionId, updated, activeConfigPath.value);
    servers.value = updated;
    addServerDialogVisible.value = false;
    ElMessage.success("站点已添加");
    await reloadNginx(props.connectionId);
  } catch (e: any) {
    ElMessage.error("添加失败: " + (e?.message ?? ""));
  } finally {
    saving.value = false;
  }
};

onMounted(loadAll);
</script>

<style scoped lang="scss">
.nginx-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.nginx-layout {
  height: 100%;
  min-height: 0;
}

.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
