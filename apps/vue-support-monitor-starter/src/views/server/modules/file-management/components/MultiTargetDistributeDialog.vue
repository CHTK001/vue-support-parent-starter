<template>
  <el-dialog v-model="visible" title="同步到服务器/节点" width="680px" :close-on-click-modal="false" @close="handleClose">
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <el-form-item label="同步对象" prop="type">
        <el-radio-group v-model="form.type" size="small">
          <el-radio-button label="SERVER">服务器</el-radio-button>
          <el-radio-button label="NODE">节点</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <el-form-item v-if="form.type === 'SERVER'" label="服务器" prop="serverIds">
        <el-select v-model="form.serverIds" multiple filterable clearable placeholder="请选择服务器" style="width: 100%">
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
        <template #title>源文件：{{ sourceFilePath }}（源服务器ID：{{ sourceServerId }}）</template>
      </el-alert>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">开始同步</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { message } from "@repo/utils";
import { distributeFile } from "@/api/file-distribute";
import { getServerList } from "@/api/server/index";
import { getNodeListAll } from "@/api/server/node";

interface Props {
  modelValue: boolean;
  sourceServerId: number;
  sourceFilePath: string;
  currentPath?: string; // 可用于预填目标目录
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
  dirPath: props.currentPath || "/opt/data",
  overwrite: false
});

const rules = {
  serverIds: [{ required: () => form.value.type === "SERVER", message: "请选择服务器" }],
  nodeIds: [{ required: () => form.value.type === "NODE", message: "请选择节点" }],
  dirPath: [{ required: true, message: "请输入目标目录" }]
};

onMounted(async () => {
  try {
    await Promise.all([loadServerOptions(), loadNodeOptions()]);
  } catch {}
});

async function loadServerOptions() {
  try {
    const res: any = await getServerList({});
    const list = res?.data?.data || res?.data || res?.list || [];
    serverOptions.value = (list || []).map((s: any) => ({
      label: `${s.monitorSysGenServerName || s.name || s.id}`,
      value: s.monitorSysGenServerId ?? s.id
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
  submitting.value = true;
  try {
    const req = {
      sourceServerId: props.sourceServerId,
      sourceFilePath: props.sourceFilePath,
      targetType: form.value.type,
      targetIds: form.value.type === "SERVER" ? form.value.serverIds : form.value.nodeIds,
      targetDir: form.value.dirPath,
      overwrite: form.value.overwrite
    } as any;

    const resp: any = await distributeFile(req);
    if (resp.code === "00000" && resp.data?.success) {
      message(resp.data?.message || "同步任务完成", { type: "success" });
      emit("success");
      visible.value = false;
    } else {
      message(resp.msg || resp.data?.message || "同步失败", { type: "error" });
    }
  } catch (e: any) {
    message(e?.message || "同步失败", { type: "error" });
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
watch(visible, v => emit("update:modelValue", v));
</script>

<style scoped></style>
