<template>
  <el-dialog v-model="visibleProxy" class="soft-install-dialog" :show-close="true" @open="onOpen">
    <template #header>
      <div class="dlg-header">
        <div class="title">
          <IconifyIconOnline icon="ri:download-cloud-2-line" class="mr-2" /> 安装软件
        </div>
        <div class="subtitle">{{ soft?.systemSoftName }} · {{ soft?.systemSoftDockerImage || '-' }}</div>
      </div>
    </template>

    <div class="content">
      <el-steps :active="step" finish-status="success" align-center>
        <el-step title="选择服务器" description="选择一个或多个目标服务器" />
        <el-step title="安装配置" description="镜像标签、端口、环境变量等" />
        <el-step title="确认安装" description="核对信息并开始安装" />
      </el-steps>

      <!-- 步骤一：选择服务器（卡片多选） -->
      <div v-show="step === 0" class="step-pane">
        <div class="pane-title">目标服务器</div>
        <div class="server-cards">
          <div v-for="server in servers" :key="server.id" class="server-card"
            :class="{ selected: selectedServerIds.includes(server.id) }" @click="toggleServerSelect(server.id)">
            <div class="card-header">
              <div class="server-name">{{ server.name }}</div>
              <div class="server-status">{{ server.status || 'unknown' }}</div>
            </div>
            <div class="card-body">
              <div class="server-host">{{ server.host || server.ip || '-' }}:{{ server.port || '-' }}</div>
            </div>
          </div>
        </div>
        <div class="server-hint">已选择：{{ selectedServerCount }} 台</div>
      </div>

      <!-- 步骤二：安装配置 -->
      <div v-show="step === 1" class="step-pane">
        <div class="pane-title">基础配置</div>
        <div class="form-row">
          <el-form :model="form" label-width="120px" class="w-full">
            <el-form-item label="镜像标签">
              <el-select v-model="form.imageTag" placeholder="latest" filterable allow-create default-first-option
                style="width: 280px">
                <el-option v-for="t in tags" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item label="启动命令">
              <el-input v-model="form.command" placeholder="可选，如 /bin/sh -c ..." />
            </el-form-item>
          </el-form>
        </div>

        <div class="pane-title">端口映射</div>
        <div class="kv-list">
          <div v-for="(p, idx) in form.ports" :key="idx" class="kv-item">
            <el-input v-model="p.host" placeholder="主机端口" style="width: 160px" />
            <span class="mx-1">:</span>
            <el-input v-model="p.container" placeholder="容器端口" style="width: 160px" />
            <el-button link type="danger" @click="form.ports.splice(idx, 1)">移除</el-button>
          </div>
          <el-button type="primary" text @click="form.ports.push({ host: '', container: '' })">+ 添加端口</el-button>
        </div>

        <div class="pane-title">环境变量</div>
        <div class="kv-list">
          <div v-for="(e, idx) in form.env" :key="idx" class="kv-item">
            <el-input v-model="e.key" placeholder="键" style="width: 200px" />
            <span class="mx-1">=</span>
            <el-input v-model="e.value" placeholder="值" style="width: 260px" />
            <el-button link type="danger" @click="form.env.splice(idx, 1)">移除</el-button>
          </div>
          <el-button type="primary" text @click="form.env.push({ key: '', value: '' })">+ 添加变量</el-button>
        </div>

        <div class="pane-title">数据卷</div>
        <div class="kv-list">
          <div v-for="(v, idx) in form.volumes" :key="idx" class="kv-item">
            <el-input v-model="v.host" placeholder="主机路径" style="width: 260px" />
            <span class="mx-1">:</span>
            <el-input v-model="v.container" placeholder="容器路径" style="width: 260px" />
            <el-button link type="danger" @click="form.volumes.splice(idx, 1)">移除</el-button>
          </div>
          <el-button type="primary" text @click="form.volumes.push({ host: '', container: '' })">+ 添加数据卷</el-button>
        </div>
      </div>

      <!-- 步骤三：确认安装 -->
      <div v-show="step === 2" class="step-pane">
        <div class="summary">
          <div class="summary-item"><span>软件：</span><b>{{ soft?.systemSoftName }}</b></div>
          <div class="summary-item"><span>镜像：</span><b>{{ soft?.systemSoftDockerImage }}</b></div>
          <div class="summary-item"><span>标签：</span><b>{{ form.imageTag }}</b></div>
          <div class="summary-item"><span>服务器：</span><b>{{ selectedServerCount }} 台</b></div>
        </div>
        <el-alert type="info" :closable="false" title="当前后端仅使用标签与服务器列表发起安装，其余配置占位保留，用于后续扩展" />
      </div>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">关闭</el-button>
        <el-button v-if="step > 0" @click="prev">上一步</el-button>
        <el-button type="primary" v-if="step < 2" @click="next">下一步</el-button>
        <el-button type="primary" v-else :loading="installing" @click="submit">开始安装</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { getServerList, softwareApi } from '@/api/docker-management';
import { ElMessage } from 'element-plus';
import { computed, reactive, ref } from 'vue';

interface Props { visible: boolean; soft?: any }
interface Emits { (e: 'update:visible', v: boolean): void;(e: 'success'): void }

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const visibleProxy = computed({ get: () => props.visible, set: v => emit('update:visible', v) });

// const serverTableRef = ref();
const servers = ref<any[]>([]);
const selectedServerIds = ref<number[]>([]);
const step = ref(0);
const tags = ref<string[]>(['latest', 'stable', 'alpine']);
const installing = ref(false);

const form = reactive<any>({
  imageTag: 'latest',
  command: '',
  ports: [],
  env: [],
  volumes: []
});

const selectedServerCount = computed(() => selectedServerIds.value.length);

async function loadServers() {
  try {
    const res: any = await getServerList({ page: 1, pageSize: 500 });
    if (res?.code === '00000') {
      servers.value = res.data || [];
    } else if (Array.isArray(res)) {
      // 兼容部分接口直接返回数组
      servers.value = res || [];
    }
  } catch (err) {
    console.error('加载服务器失败', err);
  }
}

function toggleServerSelect(id: number) {
  const idx = selectedServerIds.value.indexOf(id);
  if (idx === -1) selectedServerIds.value.push(id);
  else selectedServerIds.value.splice(idx, 1);
}

function onOpen() {
  step.value = 0;
}

// 监听对话框打开/关闭：打开时加载服务器并重置步骤，关闭时清理选择
import { watch } from 'vue';
watch(() => visibleProxy.value, (val) => {
  if (val) {
    onOpen();
    loadServers();
  } else {
    // 清理选择
    selectedServerIds.value = [];
  }
});
function next() {
  if (step.value === 0 && selectedServerCount.value === 0) {
    return ElMessage.warning('请选择目标服务器');
  }
  step.value = Math.min(2, step.value + 1);
}
function prev() { step.value = Math.max(0, step.value - 1); }

async function submit() {
  const ids = selectedServerIds.value || [];
  if (!ids.length) return ElMessage.warning('请选择服务器');
  try {
    installing.value = true;
    const payload = {
      softId: props.soft?.systemSoftId,
      serverIds: ids,
      imageTag: form.imageTag,
      command: form.command,
      ports: (form.ports || []).filter((p: any) => p.host && p.container).map((p: any) => ({ host: String(p.host), container: String(p.container) })),
      env: (form.env || []).filter((e: any) => e.key).map((e: any) => ({ key: String(e.key), value: String(e.value || '') })),
      volumes: (form.volumes || []).filter((v: any) => v.host && v.container).map((v: any) => ({ host: String(v.host), container: String(v.container) }))
    };
    const { code, message } = await softwareApi.installSoftware(payload as any);
    if (code === '00000') { emit('success'); visibleProxy.value = false; } else { ElMessage.error(message || '安装失败'); }
  } finally {
    installing.value = false;
  }
}
</script>

<style scoped>
.soft-install-dialog :deep(.el-dialog__body) {
  padding: 0 20px 16px;
}

.dlg-header {
  display: flex;
  flex-direction: column;
  padding: 6px 4px;
}

.dlg-header .title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.dlg-header .subtitle {
  color: var(--app-text-secondary);
  font-size: 12px;
}

.content {
  padding: 6px 2px;
}

.step-pane {
  margin-top: 16px;
}

.pane-title {
  font-weight: 600;
  margin: 14px 0 10px;
}

.kv-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kv-item {
  display: flex;
  align-items: center;
}

.dlg-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

/* 服务器卡片样式 */
.server-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.server-card {
  border: 1px solid var(--el-border-color, #e6e6e6);
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: box-shadow .15s ease, transform .08s ease;
  background: #fff;
}

.server-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
}

.server-card.selected {
  border-color: var(--el-color-primary, #409eff);
  box-shadow: 0 8px 20px rgba(64, 158, 255, 0.12);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.server-name {
  font-weight: 600;
}

.server-status {
  font-size: 12px;
  color: var(--app-text-secondary);
}

.card-body {
  margin-top: 8px;
  color: var(--app-text-secondary);
}

.server-hint {
  margin-top: 10px;
  color: var(--app-text-secondary);
  font-size: 13px
}
</style>
