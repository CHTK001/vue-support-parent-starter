<template>
  <el-dialog v-model="visible" title="同步到服务器/节点" width="680px" :close-on-click-modal="false" @close="handleClose">
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <el-form-item label="同步对象" prop="type">
        <el-radio-group v-model="form.type" size="small">
          <el-radio-button label="SERVER">服务�?/el-radio-button>
          <el-radio-button label="NODE">节点</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.type === 'SERVER'" label="服务�? prop="serverIds">
        <el-select v-model="form.serverIds" multiple filterable clearable placeholder="请选择服务�? style="width: 100%">
          <el-option v-for="opt in serverOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>

      <el-form-item v-else label="节点" prop="nodeIds">
        <el-select v-model="form.nodeIds" multiple filterable clearable placeholder="请选择节点" style="width: 100%">
          <el-option v-for="opt in nodeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="目标目录" prop="dirPath">
        <el-input v-model="form.dirPath" placeholder="例如 /opt/data" />
      </el-form-item>

      <el-form-item label="是否覆盖">
        <el-switch v-model="form.overwrite" />
      </el-form-item>

      <el-alert type="info" :closable="false" show-icon>
        <template #title>源文件：{{ file?.fileSystemName || "-" }}（文件ID：{{ file?.fileSystemId || "-" }}�?/template>
      </el-alert>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">开始同�?/el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { ElMessage } from "element-plus";
import { getServerList } from "@/api/server/index";
import { getNodeListAll } from "@/api/server/node";
import { distributeFileSystemFile } from "@/api/monitor/filesystem";

interface Props {
  modelValue: boolean;
  file?: any | null; // FileSystem
}

const props = defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [boolean]; success: [] }>();

const visible = ref(false);
const submitting = ref(false);
const serverOptions = ref<Array<{ label: string; value: number | string }>>([]);
const nodeOptions = ref<Array<{ label: string; value: number | string }>>([]);

const formRef = ref();
const form = ref({
  type: "SERVER" as "SERVER" | "NODE",
  serverIds: [] as Array<number | string>,
  nodeIds: [] as Array<number | string>,
  dirPath: "/opt/data",
  overwrite: false
});

const rules = {
  serverIds: [{ required: () => form.value.type === "SERVER", message: "请选择服务�? }],
  nodeIds: [{ required: () => form.value.type === "NODE", message: "请选择节点" }],
  dirPath: [{ required: true, message: "请输入目标目�? }]
};

onMounted(async () => {
  try {
    await Promise.all([loadServerOptions(), loadNodeOptions()]);
  } catch {}
});

async function loadServerOptions() {
  try {
    const res: any = await getServerList({ page: 1, pageSize: 500 });
    const records = res?.data?.data || res?.data?.data || res?.records || [];
    serverOptions.value = (records || []).map((s: any) => ({
      label: `${s.monitorSysGenServerName || s.monitorSysGenServerHost || s.monitorSysGenServerId}`,
      value: String(s.monitorSysGenServerId ?? s.id ?? s.serverId)
    }));
  } catch (e) {
    serverOptions.value = [];
  }
}

async function loadNodeOptions() {
  try {
    const res: any = await getNodeListAll({});
    const list = res?.data?.data || res?.data || res?.list || [];
    nodeOptions.value = (list || []).map((n: any) => ({
      label: `${n.name || n.nodeId || n.id}`,
      value: String(n.id ?? n.nodeId ?? n.code ?? n.name)
    }));
  } catch (e) {
    nodeOptions.value = [];
  }
}

async function handleConfirm() {
  await formRef.value?.validate();
  if (!props.file?.fileSystemId) {
    ElMessage.warning("未选择文件");
    return;
  }
  submitting.value = true;
  try {
    const req = {
      fileId: props.file.fileSystemId,
      targetType: form.value.type,
      targetIds: form.value.type === "SERVER" ? form.value.serverIds : form.value.nodeIds,
      targetDir: form.value.dirPath,
      overwrite: form.value.overwrite
    } as any;

    const resp: any = await distributeFileSystemFile(req);
    if (resp.code === "00000" && resp.data?.success) {
      ElMessage.success(resp.data?.message || "同步任务完成");
      emit("success");
      visible.value = false;
    } else {
      ElMessage.error(resp.msg || resp.data?.message || "同步失败");
    }
  } catch (e: any) {
    ElMessage.error(e?.message || "同步失败");
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  visible.value = false;
}

watch(
  () => props.modelValue,
  v => (visible.value = v)
);
watch(visible, async v => {
  emit("update:modelValue", v);
  if (v) {
    // 每次打开时刷新一次，和脚本上传保持一�?
    await Promise.all([loadServerOptions(), loadNodeOptions()]);
  }
});
</script>

<style scoped></style>
