<template>
    
  <sc-dialog v-model="visibleProxy" title="安装容器" width="720px" :show-close="true" @close="handleClose">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
      <el-form-item label="镜像">
        <div class="image-display">
          <IconifyIconOnline icon="ri:image-line" class="mr-2" />
          <span class="image-name">{{ image?.systemSoftImageName }}:{{ image?.systemSoftImageTag }}</span>
          <el-tag size="small" type="info" class="ml-2">{{ image?.systemSoftImageServerName }}</el-tag>
        </div>
      </el-form-item>

      <el-form-item label="容器名称" prop="containerName">
        <el-input v-model="form.containerName" placeholder="请输入容器名称（如：my-nginx）" clearable />
      </el-form-item>

      <el-form-item label="主机名">
        <el-input v-model="form.hostname" placeholder="容器主机名（可选）" clearable />
      </el-form-item>

      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:settings-3-line" class="mr-1" />
        端口映射
      </el-divider>

      <el-form-item>
        <div class="port-mappings">
          <div v-for="(port, index) in form.portMappings" :key="index" class="port-mapping-row">
            <el-input v-model="port.hostPort" placeholder="主机端口" style="width: 140px;">
              <template #prepend>Host</template>
            </el-input>
            <span class="port-arrow">→</span>
            <el-input v-model="port.containerPort" placeholder="容器端口" style="width: 140px;">
              <template #prepend>Container</template>
            </el-input>
            <el-select v-model="port.protocol" placeholder="协议" style="width: 100px;">
              <el-option label="TCP" value="tcp" />
              <el-option label="UDP" value="udp" />
            </el-select>
            <el-button type="danger" text @click="removePortMapping(index)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
          <el-button size="small" type="primary" text @click="addPortMapping">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加端口映射
          </el-button>
        </div>
      </el-form-item>

      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:server-line" class="mr-1" />
        环境变量
      </el-divider>

      <el-form-item>
        <div class="env-vars">
          <div v-for="(env, index) in form.envVars" :key="index" class="env-var-row">
            <el-input v-model="env.name" placeholder="变量名（如：MYSQL_ROOT_PASSWORD）" style="flex: 1;">
              <template #prepend>Key</template>
            </el-input>
            <span class="env-equal">=</span>
            <el-input v-model="env.value" placeholder="变量值" style="flex: 1;">
              <template #prepend>Value</template>
            </el-input>
            <el-button type="danger" text @click="removeEnvVar(index)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
          <el-button size="small" type="primary" text @click="addEnvVar">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加环境变量
          </el-button>
        </div>
      </el-form-item>

      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:folder-line" class="mr-1" />
        数据卷挂载
      </el-divider>

      <el-form-item>
        <div class="volume-mounts">
          <div v-for="(volume, index) in form.volumeMounts" :key="index" class="volume-mount-row">
            <el-input v-model="volume.hostPath" placeholder="主机路径（如：/data/mysql）" style="flex: 1;">
              <template #prepend>Host</template>
            </el-input>
            <span class="volume-arrow">→</span>
            <el-input v-model="volume.containerPath" placeholder="容器路径（如：/var/lib/mysql）" style="flex: 1;">
              <template #prepend>Container</template>
            </el-input>
            <el-checkbox v-model="volume.readOnly" class="ml-2">只读</el-checkbox>
            <el-button type="danger" text @click="removeVolumeMount(index)">
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </div>
          <el-button size="small" type="primary" text @click="addVolumeMount">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            添加数据卷
          </el-button>
        </div>
      </el-form-item>

      <el-divider content-position="left">
        <IconifyIconOnline icon="ri:settings-4-line" class="mr-1" />
        高级选项
      </el-divider>

      <el-form-item label="重启策略">
        <el-select v-model="form.restartPolicy" placeholder="选择重启策略" style="width: 100%;">
          <el-option label="不重启" value="no" />
          <el-option label="总是重启" value="always" />
          <el-option label="失败时重启" value="on-failure" />
          <el-option label="除非手动停止" value="unless-stopped" />
        </el-select>
      </el-form-item>

      <el-form-item label="网络模式">
        <el-select v-model="form.networkMode" placeholder="选择网络模式" style="width: 100%;">
          <el-option label="桥接（bridge）" value="bridge" />
          <el-option label="主机（host）" value="host" />
          <el-option label="无网络（none）" value="none" />
        </el-select>
      </el-form-item>

      <el-form-item label="启动命令">
        <el-input v-model="form.command" placeholder="容器启动命令（可选）" clearable />
      </el-form-item>

      <el-form-item label="工作目录">
        <el-input v-model="form.workDir" placeholder="容器工作目录（可选）" clearable />
      </el-form-item>

      <el-form-item label="创建后启动">
        <el-switch v-model="form.autoStart" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">取消</el-button>
        <el-button type="primary" :loading="installing" @click="submit">
          <IconifyIconOnline icon="ri:play-circle-line" class="mr-1" v-if="!installing" />
          {{ installing ? '创建中...' : '创建容器' }}
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { message } from "@repo/utils";
import { ElNotification } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { containerApi, type SystemSoftImage } from '@/api/docker';

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

const visibleProxy = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v)
});

const formRef = ref<FormInstance>();
const installing = ref(false);

const form = ref({
  containerName: '',
  hostname: '',
  portMappings: [] as Array<{ hostPort: string; containerPort: string; protocol: string }>,
  envVars: [] as Array<{ name: string; value: string }>,
  volumeMounts: [] as Array<{ hostPath: string; containerPath: string; readOnly: boolean }>,
  restartPolicy: 'unless-stopped',
  networkMode: 'bridge',
  command: '',
  workDir: '',
  autoStart: true
});

const rules: FormRules = {
  containerName: [
    { required: true, message: '请输入容器名称', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, message: '容器名称只能包含字母、数字、下划线、点和连字符', trigger: 'blur' }
  ]
};

// 添加端口映射
function addPortMapping() {
  form.value.portMappings.push({ hostPort: '', containerPort: '', protocol: 'tcp' });
}

// 删除端口映射
function removePortMapping(index: number) {
  form.value.portMappings.splice(index, 1);
}

// 添加环境变量
function addEnvVar() {
  form.value.envVars.push({ name: '', value: '' });
}

// 删除环境变量
function removeEnvVar(index: number) {
  form.value.envVars.splice(index, 1);
}

// 添加数据卷
function addVolumeMount() {
  form.value.volumeMounts.push({ hostPath: '', containerPath: '', readOnly: false });
}

// 删除数据卷
function removeVolumeMount(index: number) {
  form.value.volumeMounts.splice(index, 1);
}

// 重置表单
function resetForm() {
  form.value = {
    containerName: '',
    hostname: '',
    portMappings: [],
    envVars: [],
    volumeMounts: [],
    restartPolicy: 'unless-stopped',
    networkMode: 'bridge',
    command: '',
    workDir: '',
    autoStart: true
  };
  formRef.value?.clearValidate();
}

// 关闭对话框
function handleClose() {
  resetForm();
}

// 提交
async function submit() {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();

    if (!props.image) {
      return message('未选择镜像', { type: "error" });
    }

    installing.value = true;

    // 构建端口映射
    const portBindings: Record<string, Array<{ HostPort: string }>> = {};
    form.value.portMappings.forEach(port => {
      if (port.containerPort && port.hostPort) {
        const key = `${port.containerPort}/${port.protocol}`;
        portBindings[key] = [{ HostPort: port.hostPort }];
      }
    });

    // 构建环境变量
    const env: string[] = [];
    form.value.envVars.forEach(envVar => {
      if (envVar.name && envVar.value) {
        env.push(`${envVar.name}=${envVar.value}`);
      }
    });

    // 构建数据卷
    const binds: string[] = [];
    form.value.volumeMounts.forEach(volume => {
      if (volume.hostPath && volume.containerPath) {
        const bind = volume.readOnly 
          ? `${volume.hostPath}:${volume.containerPath}:ro`
          : `${volume.hostPath}:${volume.containerPath}`;
        binds.push(bind);
      }
    });

    const payload = {
      systemSoftImageId: props.image.systemSoftImageId,
      systemSoftImageServerId: props.image.systemSoftImageServerId,
      systemSoftContainerName: form.value.containerName,
      systemSoftContainerHostname: form.value.hostname || form.value.containerName,
      systemSoftContainerPortBindings: JSON.stringify(portBindings),
      systemSoftContainerEnv: JSON.stringify(env),
      systemSoftContainerBinds: JSON.stringify(binds),
      systemSoftContainerRestartPolicy: form.value.restartPolicy,
      systemSoftContainerNetworkMode: form.value.networkMode,
      systemSoftContainerCommand: form.value.command,
      systemSoftContainerWorkDir: form.value.workDir,
      systemSoftContainerAutoStart: form.value.autoStart
    };

    const result = await containerApi.createContainer(payload as any);

    if (result.code === '00000') {
      ElNotification.success({
        title: '容器创建成功',
        message: `容器 ${form.value.containerName} 已成功创建`,
        position: 'bottom-right'
      });
      emit('success');
      visibleProxy.value = false;
    } else {
      message(result.msg || '创建失败', { type: "error" });
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('创建容器失败', error);
      ElNotification.error({
        title: '创建失败',
        message: error?.message || '创建容器失败，请稍后重试',
        position: 'bottom-right'
      });
    }
  } finally {
    installing.value = false;
  }
}

// 监听对话框打开
watch(() => visibleProxy.value, (val) => {
  if (val && props.image) {
    // 根据镜像名称预设一些默认值
    const imageName = props.image.systemSoftImageName || '';
    if (imageName.includes('mysql')) {
      form.value.portMappings = [{ hostPort: '3306', containerPort: '3306', protocol: 'tcp' }];
      form.value.envVars = [{ name: 'MYSQL_ROOT_PASSWORD', value: '' }];
    } else if (imageName.includes('nginx')) {
      form.value.portMappings = [{ hostPort: '80', containerPort: '80', protocol: 'tcp' }];
    } else if (imageName.includes('redis')) {
      form.value.portMappings = [{ hostPort: '6379', containerPort: '6379', protocol: 'tcp' }];
    }
  }
});
</script>

<style scoped>
.image-display {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.image-name {
  font-weight: 600;
  font-size: 14px;
}

.port-mappings,
.env-vars,
.volume-mounts {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-mapping-row,
.env-var-row,
.volume-mount-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.port-arrow,
.volume-arrow {
  color: var(--app-text-secondary);
  font-weight: bold;
}

.env-equal {
  color: var(--app-text-secondary);
  font-weight: bold;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

