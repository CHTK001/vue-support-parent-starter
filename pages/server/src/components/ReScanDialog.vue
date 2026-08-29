<script setup lang="ts">
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { scanIpRange, saveHost } from '../api';

const visible = defineModel<boolean>({ required: true });
const emit = defineEmits<{ (e: 'imported'): void }>();

const cidr = ref('192.168.1.0/24');
const loading = ref(false);
const scanning = ref(false);
const scanProgress = ref('');
const discoveredHosts = ref<{ ip: string; port: number; osType: string; hostname: string }[]>([]);

async function doScan() {
  if (!cidr.value.trim()) {
    ElMessage.warning('请输入网段');
    return;
  }
  const cidrPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/;
  if (!cidrPattern.test(cidr.value.trim())) {
    ElMessage.warning('CIDR格式无效，如 192.168.1.0/24');
    return;
  }
  scanning.value = true;
  scanProgress.value = '正在扫描...';
  discoveredHosts.value = [];
  try {
    const result = await scanIpRange(cidr.value.trim());
    discoveredHosts.value = result ?? [];
    scanProgress.value = `扫描完成，发现 ${discoveredHosts.value.length} 台主机`;
  } catch (e) {
    ElMessage.error((e as Error).message);
    scanProgress.value = '扫描失败';
  } finally {
    scanning.value = false;
  }
}

async function importSelected(hosts: { ip: string; port: number; osType: string }[]) {
  if (!hosts.length) return;
  loading.value = true;
  let success = 0;
  for (const h of hosts) {
    try {
      await saveHost(null, {
        serverHostName: h.ip,
        serverHostAddress: h.ip,
        serverHostPort: h.port,
        serverHostOsType: h.osType,
        serverHostTags: JSON.stringify(['discovered']),
      });
      success++;
    } catch { /* skip duplicates */ }
  }
  loading.value = false;
  ElMessage.success(`成功导入 ${success} 台主机`);
  emit('imported');
}

const selectedForImport = ref<{ ip: string; port: number; osType: string; hostname: string }[]>([]);

function selectAll() {
  if (selectedForImport.value.length === discoveredHosts.value.length) {
    selectedForImport.value = [];
  } else {
    selectedForImport.value = [...discoveredHosts.value];
  }
}
</script>

<template>
  <el-dialog v-model="visible" title="扫描发现主机" width="640px" append-to-body destroy-on-close>
    <div class="scan-bar">
      <el-input v-model="cidr" placeholder="192.168.1.0/24" style="width: 200px" />
      <el-button type="primary" @click="doScan" :loading="scanning">扫描</el-button>
      <span v-if="scanProgress" class="scan-progress">{{ scanProgress }}</span>
    </div>

    <el-table v-if="discoveredHosts.length" :data="discoveredHosts" size="small" border style="margin-top: 12px"
      @selection-change="(rows: any[]) => selectedForImport = rows">
      <el-table-column type="selection" width="40" />
      <el-table-column prop="ip" label="IP 地址" width="140" />
      <el-table-column prop="port" label="端口" width="70" />
      <el-table-column label="系统类型" width="100">
        <template #default="{ row }">
          <el-tag :type="row.osType === 'LINUX' ? 'success' : 'warning'" size="small">{{ row.osType }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="hostname" label="主机名" min-width="160" show-overflow-tooltip />
    </el-table>

    <div v-if="discoveredHosts.length" class="scan-actions">
      <el-button size="small" @click="selectAll">{{ selectedForImport.length === discoveredHosts.length ? '取消全选' : '全选' }}</el-button>
      <el-button type="primary" size="small" @click="importSelected(selectedForImport)" :loading="loading" :disabled="!selectedForImport.length">
        导入选中 ({{ selectedForImport.length }})
      </el-button>
    </div>
  </el-dialog>
</template>

<style scoped>
.scan-bar {
  display: flex;
  gap: 8px;
  align-items: center;
}
.scan-progress {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.scan-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
</style>