<template>
  <el-dialog
    v-model="dialogVisible"
    title="拉取镜像"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="镜像名称" prop="imageName">
        <el-input
          v-model="form.imageName"
          placeholder="例如: nginx, mysql, redis"
          clearable
        />
      </el-form-item>

      <el-form-item label="镜像标签" prop="imageTag">
        <el-input
          v-model="form.imageTag"
          placeholder="例如: latest, 8.0, alpine"
          clearable
        />
      </el-form-item>

      <el-form-item label="完整镜像" prop="fullImageName">
        <el-input
          v-model="form.fullImageName"
          placeholder="完整镜像名称，如: docker.io/library/nginx:latest"
          clearable
        />
        <div class="form-tip">
          如果填写了完整镜像名称，将优先使用此项，忽略上面的镜像名称和标签
        </div>
      </el-form-item>

      <el-form-item label="目标服务�? prop="serverId">
        <el-select
          v-model="form.serverId"
          placeholder="选择服务�?
          style="width: 100%"
        >
          <el-option
            v-for="server in serverOptions"
            :key="server.monitorSysGenServerId"
            :label="server.monitorSysGenServerName"
            :value="server.monitorSysGenServerId"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="镜像仓库" prop="registryId">
        <el-select
          v-model="form.registryId"
          placeholder="选择镜像仓库（可选）"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="registry in registryOptions"
            :key="registry.systemSoftRegistryId"
            :label="registry.systemSoftRegistryName"
            :value="registry.systemSoftRegistryId"
          />
        </el-select>
        <div class="form-tip">如果不选择，将使用默认的Docker Hub</div>
      </el-form-item>
    </el-form>

    <!-- 进度显示 -->
    <div v-if="pulling" class="progress-section">
      <ScSocketMessageDialog
        mode="embed"
        layout="log"
        title="拉取进度"
        :event-id="progressTopic"
        :event-name="`image:pull:${progressTopic}`"
        :height="200"
      />
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose" :disabled="pulling">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="pulling">
          {{ pulling ? "拉取�?.." : "开始拉�? }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { imageApi, getServerList, registryApi } from "@/api/docker";
import { useImagePullNotification } from "@/composables/useImagePullNotification";
import ScSocketMessageDialog from "@repo/components/ScSocketMessageDialog/index.vue";

interface Props {
  visible: boolean;
}

interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formRef = ref<FormInstance>();
const pulling = ref(false);
const progressTopic = ref("");
const serverOptions = ref<any[]>([]);
const registryOptions = ref<any[]>([]);

// 使用拉取通知功能
const { showPullStart } = useImagePullNotification();

const form = reactive({
  imageName: "",
  imageTag: "latest",
  fullImageName: "",
  serverId: "",
  registryId: "",
});

const rules: FormRules = {
  serverId: [{ required: true, message: "请选择服务�?, trigger: "change" }],
};

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    loadData();
  }
});

const loadData = async () => {
  try {
    // 加载服务器列�?
    const serverResponse = await getServerList();
    if (serverResponse.code === "00000") {
      serverOptions.value = serverResponse.data || [];
    }

    // 加载镜像仓库列表
    const registryResponse = await registryApi.getAllRegistries();
    if (registryResponse.code === "00000") {
      registryOptions.value = registryResponse.data || [];
    }
  } catch (error) {
    console.error("加载数据失败:", error);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    pulling.value = true;

    // 生成进度主题ID
    progressTopic.value = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 构建请求参数
    const params: any = {
      serverId: form.serverId,
      registryId: form.registryId || undefined,
    };

    // 如果填写了完整镜像名称，优先使用
    if (form.fullImageName.trim()) {
      params.fullImageName = form.fullImageName.trim();
    } else {
      // 否则使用镜像名称和标签组�?
      if (!form.imageName.trim()) {
        ElMessage.error("请填写镜像名称或完整镜像名称");
        return;
      }
      params.imageName = form.imageName.trim();
      params.imageTag = form.imageTag.trim() || "latest";
    }

    const response = await imageApi.pullImage(params);
    if (response.code === "00000") {
      // 显示拉取开始通知
      const imageName = params.fullImageName || params.imageName;
      const imageTag = params.fullImageName ? undefined : params.imageTag;
      showPullStart(imageName, imageTag, form.serverId);

      // ProgressMonitor会自动监听并显示进度
      // operationId: response.data?.operationId
      if (response.data?.operationId) {
        // 等待一小段时间让Socket事件传播
        setTimeout(() => emit("success"), 1000);
      }

      ElMessage.success("镜像拉取任务已启动，请在右下角查看实时进�?);
      emit("success");
      handleClose();
    } else {
      ElMessage.error(response.message || "镜像拉取失败");
    }
  } catch (error) {
    ElMessage.error("镜像拉取失败");
  } finally {
    pulling.value = false;
  }
};

const handleClose = () => {
  if (!pulling.value) {
    dialogVisible.value = false;
    resetForm();
  }
};

const resetForm = () => {
  form.imageName = "";
  form.imageTag = "latest";
  form.fullImageName = "";
  form.serverId = "";
  form.registryId = "";
  formRef.value?.resetFields();
};
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
