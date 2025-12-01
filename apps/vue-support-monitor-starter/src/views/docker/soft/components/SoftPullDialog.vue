<template>
  <el-dialog v-model="visibleProxy" title="下载镜像" width="560px" @open="onOpen">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="软件名称">
        <el-input :value="soft?.systemSoftName" disabled />
      </el-form-item>
      
      <el-form-item label="镜像地址">
        <el-input :value="soft?.systemSoftDockerImage" disabled />
      </el-form-item>

      <el-form-item label="镜像标签" prop="imageTag">
        <el-input v-model="form.imageTag" placeholder="latest" />
      </el-form-item>

      <el-form-item label="目标服务器" prop="serverId">
        <el-select v-model="form.serverId" placeholder="选择服务器" class="w-full" filterable>
          <el-option
            v-for="server in serverList"
            :key="server.systemServerId"
            :label="`${server.systemServerName} (${server.systemServerHost})`"
            :value="server.systemServerId"
          >
            <div class="server-option">
              <span class="server-name">{{ server.systemServerName }}</span>
              <span class="server-host">{{ server.systemServerHost }}</span>
              <el-tag :type="server.systemServerStatus === 1 ? 'success' : 'danger'" size="small">
                {{ server.systemServerStatus === 1 ? '在线' : '离线' }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visibleProxy = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handlePull">
        <IconifyIconOnline icon="ri:download-cloud-line" class="mr-1" />
        开始下载
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { imageApi, type SystemSoft } from '@/api/docker-management';
import { useDockerOperationStore } from '@/stores/dockerOperation';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { computed, onMounted, reactive, ref } from 'vue';
import { http, type ReturnResult } from '@repo/utils';

/**
 * 软件镜像下载对话框
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

interface Props {
  visible: boolean;
  soft: SystemSoft | null;
}

interface Emits {
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const operationStore = useDockerOperationStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const serverList = ref<any[]>([]);

const visibleProxy = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
});

const form = reactive({
  imageTag: 'latest',
  serverId: null as number | null,
});

const rules: FormRules = {
  imageTag: [{ required: true, message: '请输入镜像标签', trigger: 'blur' }],
  serverId: [{ required: true, message: '请选择目标服务器', trigger: 'change' }],
};

// 加载服务器列表
const loadServerList = async () => {
  try {
    const res = await http.request<ReturnResult<any[]>>('get', '/api/monitor/gen-server/list');
    if (res.code === '00000') {
      serverList.value = res.data || [];
    }
  } catch (e) {
    console.error('加载服务器列表失败:', e);
  }
};

// 对话框打开时
const onOpen = () => {
  form.imageTag = 'latest';
  form.serverId = null;
  loadServerList();
};

// 开始下载
const handlePull = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
  } catch {
    return;
  }

  if (!props.soft?.systemSoftId || !form.serverId) {
    ElMessage.warning('请选择软件和服务器');
    return;
  }

  loading.value = true;

  // 添加到操作监控
  const server = serverList.value.find(s => s.systemServerId === form.serverId);
  const operationId = operationStore.addOperation({
    type: 'pull',
    title: `下载 ${props.soft.systemSoftName}`,
    description: `${props.soft.systemSoftDockerImage}:${form.imageTag} -> ${server?.systemServerName || '未知服务器'}`,
    status: 'running',
    progress: 0,
    serverId: form.serverId,
    serverName: server?.systemServerName,
    imageName: `${props.soft.systemSoftDockerImage}:${form.imageTag}`,
  });

  try {
    const res = await imageApi.pullImage({
      softId: props.soft.systemSoftId,
      serverId: form.serverId,
      imageTag: form.imageTag,
    });

    if (res.code === '00000') {
      operationStore.completeOperation(operationId);
      ElMessage.success('镜像下载任务已提交');
      emit('success');
      visibleProxy.value = false;
    } else {
      operationStore.failOperation(operationId, res.msg || '下载失败');
      ElMessage.error(res.msg || '下载失败');
    }
  } catch (e: any) {
    operationStore.failOperation(operationId, e.message || '下载失败');
    ElMessage.error(e.message || '下载失败');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadServerList();
});
</script>

<style scoped lang="scss">
.server-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .server-name {
    font-weight: 500;
  }

  .server-host {
    color: #94a3b8;
    font-size: 12px;
  }
}

.w-full {
  width: 100%;
}
</style>
