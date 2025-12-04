<template>
  <el-dialog v-model="visibleProxy" title="安装容器" width="800px" :show-close="true" @close="handleClose" class="install-wizard-dialog">
    <!-- 步骤�?-->
    <el-steps :active="currentStep" finish-status="success" align-center class="wizard-steps">
      <el-step title="基本信息" description="容器名称和运行配�? />
      <el-step title="端口映射" description="配置端口转发" />
      <el-step title="环境变量" description="设置环境参数" />
      <el-step title="数据�? description="挂载存储目录" />
    </el-steps>

    <div class="wizard-content">
      <!-- 步骤1：基本信�?-->
      <div v-show="currentStep === 0" class="step-content">
        <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
          <el-form-item label="镜像">
            <div class="image-display">
              <IconifyIconOnline icon="ri:image-line" class="mr-2" />
              <span class="image-name">{{ image?.systemSoftImageName }}:{{ image?.systemSoftImageTag }}</span>
              <el-tag size="small" type="info" class="ml-2">{{ image?.systemSoftImageServerName }}</el-tag>
            </div>
          </el-form-item>

          <el-form-item label="容器名称" prop="containerName">
            <el-input v-model="form.containerName" placeholder="请输入容器名称（如：my-nginx�? clearable />
          </el-form-item>

          <el-form-item label="主机�?>
            <el-input v-model="form.hostname" placeholder="容器主机名（可选）" clearable />
          </el-form-item>

          <el-form-item label="后台运行">
            <el-switch v-model="form.detached" />
            <span class="form-tip">启用后容器将在后台运�?/span>
          </el-form-item>

          <el-form-item label="创建后启�?>
            <el-switch v-model="form.autoStart" />
          </el-form-item>

          <el-form-item label="重启策略">
            <el-select v-model="form.restartPolicy" placeholder="选择重启策略" style="width: 100%;">
              <el-option label="不重�? value="no" />
              <el-option label="总是重启" value="always" />
              <el-option label="失败时重�? value="on-failure" />
              <el-option label="除非手动停止" value="unless-stopped" />
            </el-select>
          </el-form-item>

          <el-form-item label="网络模式">
            <el-select v-model="form.networkMode" placeholder="选择网络模式" style="width: 100%;">
              <el-option label="桥接（bridge�? value="bridge" />
              <el-option label="主机（host�? value="host" />
              <el-option label="无网络（none�? value="none" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：端口映�?-->
      <div v-show="currentStep === 1" class="step-content">
        <div class="step-header">
          <h4>端口映射配置</h4>
          <p class="step-desc">将容器内部端口映射到主机端口，使外部可以访问容器服务</p>
        </div>
        <div class="port-mappings">
          <div v-for="(port, index) in form.portMappings" :key="index" class="mapping-row">
            <el-input v-model="port.hostPort" placeholder="主机端口" class="port-input">
              <template #prepend>主机</template>
            </el-input>
            <span class="mapping-arrow">
              <IconifyIconOnline icon="ri:arrow-right-line" />
            </span>
            <el-input v-model="port.containerPort" placeholder="容器端口" class="port-input">
              <template #prepend>容器</template>
            </el-input>
            <el-select v-model="port.protocol" class="protocol-select">
              <el-option label="TCP" value="tcp" />
              <el-option label="UDP" value="udp" />
            </el-select>
            <el-button type="danger" circle @click="removePortMapping(index)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
          <el-button type="primary" plain @click="addPortMapping" class="add-btn">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加端口映射
          </el-button>
        </div>
      </div>

      <!-- 步骤3：环境变�?-->
      <div v-show="currentStep === 2" class="step-content">
        <div class="step-header">
          <h4>环境变量配置</h4>
          <p class="step-desc">设置容器运行时的环境变量，如数据库密码、配置参数等</p>
        </div>
        <div class="env-vars">
          <div v-for="(env, index) in form.envVars" :key="index" class="mapping-row">
            <el-input v-model="env.name" placeholder="变量�? class="env-input">
              <template #prepend>KEY</template>
            </el-input>
            <span class="mapping-arrow">=</span>
            <el-input v-model="env.value" placeholder="变量�? class="env-input">
              <template #prepend>VALUE</template>
            </el-input>
            <el-button type="danger" circle @click="removeEnvVar(index)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
          <el-button type="primary" plain @click="addEnvVar" class="add-btn">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加环境变量
          </el-button>
        </div>
      </div>

      <!-- 步骤4：数据卷 -->
      <div v-show="currentStep === 3" class="step-content">
        <div class="step-header">
          <h4>数据卷挂�?/h4>
          <p class="step-desc">将主机目录挂载到容器内，实现数据持久�?/p>
        </div>
        <div class="volume-mounts">
          <div v-for="(volume, index) in form.volumeMounts" :key="index" class="mapping-row">
            <el-input v-model="volume.hostPath" placeholder="主机路径" class="volume-input">
              <template #prepend>主机</template>
            </el-input>
            <span class="mapping-arrow">
              <IconifyIconOnline icon="ri:arrow-right-line" />
            </span>
            <el-input v-model="volume.containerPath" placeholder="容器路径" class="volume-input">
              <template #prepend>容器</template>
            </el-input>
            <el-checkbox v-model="volume.readOnly">只读</el-checkbox>
            <el-button type="danger" circle @click="removeVolumeMount(index)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
          <el-button type="primary" plain @click="addVolumeMount" class="add-btn">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加数据�?
          </el-button>
        </div>
      </div>
    </div>

    <!-- 进度显示 -->
    <div v-if="installing" class="progress-section">
      <el-progress :percentage="installProgress" :status="installStatus" :stroke-width="8" />
      <p class="progress-text">{{ installMessage }}</p>
    </div>

    <template #footer>
      <div class="wizard-footer">
        <el-button @click="visibleProxy = false" :disabled="installing">取消</el-button>
        <el-button v-if="currentStep > 0" @click="prevStep" :disabled="installing">
          <IconifyIconOnline icon="ri:arrow-left-line" class="mr-1" />
          上一�?
        </el-button>
        <el-button v-if="currentStep < 3" type="primary" @click="nextStep">
          下一�?
          <IconifyIconOnline icon="ri:arrow-right-line" class="ml-1" />
        </el-button>
        <el-button v-else type="primary" :loading="installing" @click="submit">
          <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" v-if="!installing" />
          {{ installing ? '创建�?..' : '创建容器' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { ElMessage, ElNotification } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { containerApi, type SystemSoftImage } from '@/api/docker';
import { useDockerOperationStore } from '@/stores/dockerOperation';

/**
 * 容器安装向导组件
 * 步骤式引导用户配置容器参�?
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

interface Props {
  visible: boolean;
  image?: SystemSoftImage | null;
}

interface Emits {
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const operationStore = useDockerOperationStore();

const visibleProxy = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
});

const formRef = ref<FormInstance>();
const currentStep = ref(0);
const installing = ref(false);
const installProgress = ref(0);
const installStatus = ref<'' | 'success' | 'exception'>('');
const installMessage = ref('');

const form = ref({
  containerName: '',
  hostname: '',
  detached: true,
  autoStart: true,
  restartPolicy: 'unless-stopped',
  networkMode: 'bridge',
  portMappings: [] as Array<{ hostPort: string; containerPort: string; protocol: string }>,
  envVars: [] as Array<{ name: string; value: string }>,
  volumeMounts: [] as Array<{ hostPath: string; containerPath: string; readOnly: boolean }>,
});

const rules: FormRules = {
  containerName: [
    { required: true, message: '请输入容器名�?, trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, message: '容器名称只能包含字母、数字、下划线、点和横�?, trigger: 'blur' }
  ]
};

// 监听对话框打开，重置表�?
watch(() => props.visible, (val) => {
  if (val) {
    resetForm();
  }
});

// 重置表单
const resetForm = () => {
  currentStep.value = 0;
  installing.value = false;
  installProgress.value = 0;
  installStatus.value = '';
  installMessage.value = '';
  form.value = {
    containerName: props.image?.systemSoftImageName?.replace(/[^a-zA-Z0-9]/g, '-') || '',
    hostname: '',
    detached: true,
    autoStart: true,
    restartPolicy: 'unless-stopped',
    networkMode: 'bridge',
    portMappings: [],
    envVars: [],
    volumeMounts: [],
  };
};

// 上一�?
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};

// 下一�?
const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证第一步表�?
    if (!formRef.value) return;
    try {
      await formRef.value.validate();
    } catch {
      return;
    }
  }
  if (currentStep.value < 3) {
    currentStep.value++;
  }
};

// 端口映射操作
const addPortMapping = () => {
  form.value.portMappings.push({ hostPort: '', containerPort: '', protocol: 'tcp' });
};

const removePortMapping = (index: number) => {
  form.value.portMappings.splice(index, 1);
};

// 环境变量操作
const addEnvVar = () => {
  form.value.envVars.push({ name: '', value: '' });
};

const removeEnvVar = (index: number) => {
  form.value.envVars.splice(index, 1);
};

// 数据卷操�?
const addVolumeMount = () => {
  form.value.volumeMounts.push({ hostPath: '', containerPath: '', readOnly: false });
};

const removeVolumeMount = (index: number) => {
  form.value.volumeMounts.splice(index, 1);
};

// 关闭对话�?
const handleClose = () => {
  if (!installing.value) {
    visibleProxy.value = false;
  }
};

// 提交创建容器
const submit = async () => {
  if (!props.image) {
    ElMessage.warning('请选择镜像');
    return;
  }

  installing.value = true;
  installProgress.value = 10;
  installMessage.value = '正在准备创建容器...';

  // 添加到操作监�?
  const operationId = operationStore.addOperation({
    type: 'create',
    title: `创建容器 ${form.value.containerName}`,
    description: `基于镜像 ${props.image.systemSoftImageName}:${props.image.systemSoftImageTag}`,
    status: 'running',
    progress: 0,
    imageName: `${props.image.systemSoftImageName}:${props.image.systemSoftImageTag}`,
    containerName: form.value.containerName,
  });

  try {
    installProgress.value = 30;
    installMessage.value = '正在创建容器...';

    // 构建请求参数
    const config = {
      containerName: form.value.containerName,
      hostname: form.value.hostname || undefined,
      detached: form.value.detached,
      autoStart: form.value.autoStart,
      restartPolicy: form.value.restartPolicy,
      networkMode: form.value.networkMode,
      ports: form.value.portMappings
        .filter(p => p.hostPort && p.containerPort)
        .map(p => `${p.hostPort}:${p.containerPort}/${p.protocol}`),
      env: form.value.envVars
        .filter(e => e.name)
        .map(e => `${e.name}=${e.value}`),
      volumes: form.value.volumeMounts
        .filter(v => v.hostPath && v.containerPath)
        .map(v => `${v.hostPath}:${v.containerPath}${v.readOnly ? ':ro' : ''}`),
    };

    installProgress.value = 50;
    
    const res = await containerApi.createContainer({
      imageId: props.image.systemSoftImageId!,
      ...config,
    });

    if (res.code === '00000') {
      installProgress.value = 100;
      installStatus.value = 'success';
      installMessage.value = '容器创建成功�?;
      
      operationStore.completeOperation(operationId);
      
      ElNotification.success({
        title: '容器创建成功',
        message: `容器 ${form.value.containerName} 已创建`,
        duration: 4000,
        position: 'bottom-right'
      });

      setTimeout(() => {
        emit('success');
        visibleProxy.value = false;
      }, 1000);
    } else {
      throw new Error(res.msg || '创建失败');
    }
  } catch (e: any) {
    installProgress.value = 100;
    installStatus.value = 'exception';
    installMessage.value = e.message || '创建失败';
    
    operationStore.failOperation(operationId, e.message || '创建失败');
    
    ElMessage.error(e.message || '创建容器失败');
    installing.value = false;
  }
};
</script>

<style scoped lang="scss">
.install-wizard-dialog {
  :deep(.el-dialog__body) {
    padding: 20px 24px;
  }
}

.wizard-steps {
  margin-bottom: 24px;
}

.wizard-content {
  min-height: 320px;
}

.step-content {
  padding: 16px 0;
}

.step-header {
  margin-bottom: 20px;
  
  h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
  }
  
  .step-desc {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
}

.image-display {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  
  .image-name {
    font-weight: 500;
    color: #1e293b;
  }
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  
  .port-input, .env-input, .volume-input {
    flex: 1;
  }
  
  .protocol-select {
    width: 100px;
  }
  
  .mapping-arrow {
    color: #94a3b8;
    font-size: 18px;
  }
}

.add-btn {
  margin-top: 8px;
}

.progress-section {
  margin-top: 20px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  
  .progress-text {
    margin: 12px 0 0 0;
    font-size: 13px;
    color: #64748b;
    text-align: center;
  }
}

.wizard-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
