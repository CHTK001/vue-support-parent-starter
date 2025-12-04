<template>
  <el-dialog v-model="visibleInner" title="文件上传" width="600px" :close-on-click-modal="false" @close="handleClose">
    <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item label="类型" prop="type">
        <ScSelect v-model="form.type" :options="typeOptions" placeholder="请选择类型" />
      </el-form-item>

      <el-form-item v-if="form.type === 'REMOTE'" label="服务器" prop="serverIds">
        <el-select v-model="form.serverIds" multiple filterable clearable placeholder="请选择服务器" style="width: 100%">
          <el-option v-for="opt in serverOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>

      <el-form-item v-else label="节点" prop="nodeIds">
        <el-select v-model="form.nodeIds" multiple filterable clearable placeholder="请选择节点" style="width: 100%">
          <el-option v-for="opt in nodeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>

      <el-form-item label="上传目录" prop="dirPath">
        <el-input v-model="form.dirPath" placeholder="请输入上传目录，例如 /opt/monitor/scripts" clearable />
      </el-form-item>

      <el-form-item label="是否覆盖">
        <el-switch v-model="form.overwrite" active-text="是" inactive-text="否" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">确认上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ScSelect from "@repo/components/ScSelect/index.vue";
import { getServerList } from "@/api/server/index";
import { getNodeListAll } from "@/api/server/node";
import { fetchUploadScriptToNode, fetchUploadScriptToServer } from "@/api/script-upload";

interface Props {
  visible: boolean;
  scriptId?: number | string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
}>();

const visibleInner = ref(false);
watch(
  () => props.visible,
  v => (visibleInner.value = v)
);

const formRef = ref<any>();
const form = ref({
  type: "REMOTE" as "REMOTE" | "NODE",
  serverIds: [] as Array<string>,
  nodeIds: [] as Array<string>,
  dirPath: "/opt/monitor/scripts",
  overwrite: true
});

const typeOptions = [
  { label: "远程", value: "REMOTE" },
  { label: "节点", value: "NODE" }
];

const serverOptions = ref<Array<{ label: string; value: number | string }>>([]);
const nodeOptions = ref<Array<{ label: string; value: number | string }>>([]);
const fileList = ref<any[]>([]);
const progress = ref(0);
const submitting = ref(false);

const rules = {
  type: [{ required: true, message: "请选择类型" }],
  serverIds: [{ required: () => form.value.type === "REMOTE", message: "请选择服务器" }],
  nodeIds: [{ required: () => form.value.type === "NODE", message: "请选择节点" }],
  dirPath: [{ required: true, message: "请输入上传目录" }]
};

async function loadServerOptions() {
  try {
    const res: any = await getServerList({ page: 1, pageSize: 500 });
    const records = res?.data?.data || res?.data?.data || res?.records || [];
    serverOptions.value = (records || []).map((s: any) => ({
      label: `${s.monitorSysGenServerName || s.monitorSysGenServerHost || s.monitorSysGenServerId}`,
      value: String(s.monitorSysGenServerId ?? s.id ?? s.serverId)
    }));
  } catch (e) {
    // 忽略，交互层提示
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
    // 忽略
    nodeOptions.value = [];
  }
}

onMounted(async () => {
  await Promise.all([loadServerOptions(), loadNodeOptions()]);
});

watch(visibleInner, async v => {
  if (v) {
    // 每次打开时刷新一次，避免缓存导致的下拉无数据
    await Promise.all([loadServerOptions(), loadNodeOptions()]);
  }
});

const handleConfirm = async () => {
  await formRef.value?.validate();
  submitting.value = true;
  try {
    if (!props.scriptId) throw new Error("缺少脚本ID");

    if (form.value.type === "REMOTE") {
      if (!form.value.serverIds?.length) throw new Error("请选择服务器");
      await Promise.all(
        form.value.serverIds.map(sid =>
          fetchUploadScriptToServer({
            serverId: sid,
            scriptId: props.scriptId!,
            overwrite: form.value.overwrite,
            targetPath: form.value.dirPath
          })
        )
      );
    } else {
      if (!form.value.nodeIds?.length) throw new Error("请选择节点");
      await Promise.all(
        form.value.nodeIds.map(nid =>
          fetchUploadScriptToNode({
            nodeId: nid,
            remoteFilePath: form.value.dirPath,
            scriptId: props.scriptId!,
            overwrite: form.value.overwrite
          })
        )
      );
    }

    ElMessage.success("已提交上传任务");
    emit("update:visible", false);
  } catch (e: any) {
    ElMessage.error(e?.message || "提交失败");
  } finally {
    submitting.value = false;
  }
};

const handleClose = () => {
  if (!submitting.value) {
    fileList.value = [];
    emit("update:visible", false);
  }
};
</script>

<style scoped></style>
