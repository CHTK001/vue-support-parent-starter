<script setup lang="ts">
/**
 * å†…ç½‘ç©¿é€éš§é“å·¥ä½œå°ï¼ˆ@pages/tunnelï¼‰
 *
 * <p>æ”¯æŒ ngrok ä¸Ž Cloudflare Tunnel ä¸¤ç§ Providerï¼Œé…ç½®ã€å¯ç”¨ã€å¯åœã€åˆ é™¤å…¨åŠŸèƒ½ã€‚</p>
 *
 * @author CH
 * @since 4.0.0.52
 */
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { ElButton, ElForm, ElFormItem, ElInput, ElMessage, ElPopconfirm, ElSelect, ElSwitch, ElTable, ElTableColumn, ElTag } from "element-plus";
import { MagicStick, Monitor, Refresh } from "@element-plus/icons-vue";
import { http, type SseClient } from "@repo/utils";
import { ngrokStreamUrl } from "../api/tunnelApi";
import type { TunnelProvider, TunnelRecord, TunnelView } from "../api/tunnelApi";

/* ==================== è¡¨å•ä¸Žåˆ—è¡¨ ==================== */

/** å½“å‰ Provider */
const props = defineProps<{
  provider: TunnelProvider;
}>();

// æ ¹æ® prop åˆ‡æ¢ API
const api = computed(() => {
  const isNgrok = props.provider === "ngrok";
  return {
    list: isNgrok ? tunnelApi.ngrokList : tunnelApi.cloudflaredList,
    create: isNgrok ? tunnelApi.ngrokCreate : tunnelApi.cloudflaredCreate,
    update: isNgrok ? tunnelApi.ngrokUpdate : tunnelApi.cloudflaredUpdate,
    delete: isNgrok ? tunnelApi.ngrokDelete : tunnelApi.cloudflaredDelete,
    start: isNgrok ? tunnelApi.ngrokStart : tunnelApi.cloudflaredStart,
    stop: isNgrok ? tunnelApi.ngrokStop : tunnelApi.cloudflaredStop,
    streamUrl: isNgrok ? ngrokStreamUrl() : "/ms/tunnel/cloudflared/stream",
  };
});

// ç®€æ´ API åŒ…è£…
function listTunnels() {
  return api.value.list();
}

function startTunnel(id: string) {
  return api.value.start(id);
}

function stopTunnel(id: string) {
  return api.value.stop(id);
}

function deleteTunnel(id: string) {
  return api.value.delete(id);
}

function updateTunnel(id: string, record: Partial<TunnelRecord>) {
  return api.value.update(id, record);
}

function createTunnel(record: Omit<TunnelRecord, "id" | "createdAt" | "updatedAt" | "provider">) {
  return api.value.create(record);
}

/** éš§é“åˆ—è¡¨ */
const list = ref<TunnelView[]>([]);

/** é€‰ä¸­è¡Œ */
const selected = ref<TunnelView | null>(null);

/** å·¥ä½œåŒºæŠ½å±‰ï¼šæ–°å»º/ç¼–è¾‘ */
const drawerVisible = ref(false);
const formRef = ref<InstanceType<typeof ElForm>>();

/** è¡¨å•åˆå§‹æ¨¡åž‹ */
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

/** è¡¨å•æ ¡éªŒè§„åˆ™ */
const rules = {
  name: [{ required: true, message: "è¯·è¾“å…¥æ˜ å°„åç§°", trigger: "blur" }],
  localPort: [
    { required: true, message: "è¯·è¾“å…¥æœ¬åœ°ç«¯å£", trigger: "blur" },
    { type: "number", min: 1, max: 65535, message: "ç«¯å£å¿…é¡»åœ¨ 1 - 65535 ä¹‹é—´", trigger: "blur" },
  ],
  mode: [{ required: true, message: "è¯·é€‰æ‹©éš§é“æ¨¡å¼", trigger: "change" }],
};

/* ==================== SSE å®žæ—¶æµ ==================== */

let sseClient: SseClient | null = null;

function startSSE() {
  if (sseClient) {
    sseClient.close();
    sseClient = null;
  }
  sseClient = http().get(api.value.streamUrl).sse({
    onMessage: (event) => {
      if (Array.isArray(event.data)) {
        list.value = event.data as TunnelView[];
        // ä¿æŒé€‰ä¸­è¡Œå­˜åœ¨
        if (selected.value) {
          const updated = list.value.find(r => r.id === selected.value.id);
          if (updated) selected.value = updated;
          else selected.value = null;
        }
      }
    },
    onError: (err) => {
      console.warn("[tunnel] SSE é”™è¯¯", err);
    },
    onOpen: () => {
      console.log("[tunnel] SSE è¿žæŽ¥å·²å»ºç«‹");
    },
    reconnect: true,
  });
}

onMounted(() => {
  startSSE();
});

onBeforeUnmount(() => {
  sseClient?.close();
  sseClient = null;
});

/* ==================== æ“ä½œ ==================== */

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

function onFormSubmit() {
  formRef.value!.validate(valid => {
    if (!valid) return;
    formLoading.value = true;
    if (selected.value) {
      updateTunnel(selected.value.id, formModel.value)
        .then(() => {
          ElMessage.success("æ›´æ–°æˆåŠŸ");
          drawerVisible.value = false;
        })
        .finally(() => { formLoading.value = false; });
    } else {
      createTunnel(formModel.value)
        .then(() => {
          ElMessage.success("åˆ›å»ºæˆåŠŸ");
          drawerVisible.value = false;
        })
        .finally(() => { formLoading.value = false; });
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

/* ==================== å·¥å…· ==================== */

function stateTagOf(status: boolean) {
  return { type: status ? "success" : "info", text: status ? "è¿è¡Œä¸­" : "å·²åœæ­¢" };
}

</script>

<template>
  <div class="tunnel-workbench">
    <!-- é¡¶éƒ¨æ  -->
    <div class="tunnel-header">
      <div class="tunnel-header-left">
        <h2 class="tunnel-header-title">éš§é“åˆ—è¡¨</h2>
        <el-tag :type="list.some(t => t.running) ? 'success' : 'info'" size="default">
          æ€»è®¡ {{ list.length }} Â· åœ¨çº¿ {{ list.filter(t => t.running).length }}
        </el-tag>
      </div>
      <div class="tunnel-header-right">
        <el-button :icon="Refresh" plain size="small" @click="startSSE" title="é‡æ–°è¿žæŽ¥ SSE">åˆ·æ–°</el-button>
        <el-button :icon="MagicStick" plain size="small" @click="openCreate">æ–°å»ºéš§é“</el-button>
      </div>
    </div>

    <!-- è¡¨æ ¼ -->
    <el-table :data="list" style="width: 100%" :default-sort="{ prop: 'createdAt', order: 'descending' }" @row-click="onRowClick">
      <el-table-column prop="id" label="ID" width="180" />
      <el-table-column prop="name" label="åç§°" width="140" />
      <el-table-column prop="localPort" label="æœ¬åœ°ç«¯å£" width="120" sortable />
      <el-table-column prop="mode" label="æ¨¡å¼" width="100" />
      <el-table-column prop="domain" label="åŸŸå" min-width="200" show-overflow-tooltip />
      <el-table-column prop="publicUrls" label="å…¬ç½‘åœ°å€" min-width="240" show-overflow-tooltip>
        <template #default="{ row }">
          <div v-if="row.publicUrls.length">
            <el-tag v-for="url in row.publicUrls.slice(0, 2)" :key="url" size="small" class="mr-4" type="success">
              {{ url }}
            </el-tag>
            <el-tag v-if="row.publicUrls.length > 2" size="small">+{{ row.publicUrls.length - 2 }}</el-tag>
          </div>
          <span v-else class="text-gray-400">æœªåˆ†é…</span>
        </template>
      </el-table-column>
      <el-table-column prop="running" label="çŠ¶æ€" width="100" sortable>
        <template #default="{ row }">
          <el-tag :type="row.running ? 'success' : 'info'" size="small">
            {{ row.running ? "è¿è¡Œä¸­" : "å·²åœæ­¢" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="error" label="é”™è¯¯ä¿¡æ¯" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.error" class="text-red-500">{{ row.error }}</span>
        </template>
      </el-table-column>
      <el-table-column label="æ“ä½œ" width="200" fixed="right">
        <template #default="{ row }">
          <el-popconfirm
            :title="row.running ? 'ç¡®å®šè¦åœæ­¢è¯¥éš§é“å—ï¼Ÿ' : 'ç¡®å®šè¦å¯åŠ¨è¯¥éš§é“å—ï¼Ÿ'"
            @confirm="row.running ? stopTunnel(row.id) : startTunnel(row.id)"
          >
            <template #reference>
              <el-button size="small" :type="row.running ? 'danger' : 'success'" plain>
                {{ row.running ? "åœæ­¢" : "å¯åŠ¨" }}
              </el-button>
            </template>
          </el-popconfirm>
          <el-button size="small" plain @click="openEdit(row)">ç¼–è¾‘</el-button>
          <el-popconfirm title="ç¡®å®šè¦åˆ é™¤è¯¥éš§é“å—ï¼Ÿ" @confirm="deleteTunnel(row.id)">
            <template #reference>
              <el-button size="small" type="danger" plain>åˆ é™¤</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <!-- æ–°å»º/ç¼–è¾‘æŠ½å±‰ -->
    <el-drawer v-model="drawerVisible" title="æ–°å»ºé€šé“" size="520">
      <el-form ref="formRef" :model="formModel" :rules="rules" label-width="100" class="tunnel-form">
        <el-form-item label="åç§°">
          <ElInput v-model="formModel.name" placeholder="å¿…å¡«" />
        </FormRow>

        <el-form-item label="æœ¬åœ°ç«¯å£">
          <ElInput v-model="formModel.localPort" type="number" placeholder="å¦‚ 8080" />
        </FormRow>

        <el-form-item label="æ¨¡å¼">
          <ElSelect v-model="formModel.mode" placeholder="é€‰æ‹©æ¨¡å¼">
            <template v-if="props.provider === 'ngrok'">
              <el-option label="HTTP è½¬å‘" value="http" />
              <el-option label="TCP è½¬å‘" value="tcp" />
              <el-option label="TLS éš§é“" value="tls" />
            </template>
            <template v-else>
              <el-option label="Quick Tunnel (å…è´¦å·)" value="quick" />
              <el-option label="Named Tunnel (éœ€ Token)" value="named" />
            </template>
          </ElSelect>
        </FormRow>

        <template v-if="formModel.mode === 'http' || formModel.mode === 'tls'">
          <el-form-item label="åŸŸå">
            <ElInput v-model="formModel.domain" placeholder="å¯é€‰" />
          </FormRow>
          <el-form-item label="Basic è®¤è¯">
            <ElInput v-model="formModel.basicAuth" placeholder="user:password" />
          </FormRow>
        </template>

        <template v-if="formModel.mode === 'tcp'">
          <el-form-item label="è¿œç¨‹åœ°å€">
            <ElInput v-model="formModel.remoteAddress" placeholder="å¦‚ 1.tcp.ngrok.io:20000" />
          </FormRow>
        </template>

        <template v-if="props.provider === 'cloudflared'">
          <el-form-item label="Token">
            <ElInput v-model="formModel.token" placeholder="Zero Trust éš§é“ Tokenï¼ˆå¯é€‰ï¼‰" />
          </FormRow>
        </template>

        <el-form-item label="è‡ªåŠ¨å¯åŠ¨">
          <ElSwitch v-model="formModel.autoStart" />
        </FormRow>

        <el-form-item label="å¯ç”¨">
          <ElSwitch v-model="formModel.enabled" />
        </FormRow>

        <el-form-item label="å¤‡æ³¨">
          <ElInput v-model="formModel.remark" type="textarea" />
        </FormRow>

        <div class="form-actions">
          <ElButton @click="onFormCancel">å–æ¶ˆ</ElButton>
          <ElButton type="primary" :loading="formLoading" @click="onFormSubmit">ä¿å­˜</ElButton>
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
