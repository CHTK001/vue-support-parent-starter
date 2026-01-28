<template>
  <sc-dialog v-model="visible" title="上传文件到服务器/节点" width="680px" :close-on-click-modal="false" @close="handleClose">
    <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
      <el-form-item label="上传对象" prop="type">
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

      <el-form-item label="选择文件" prop="files">
        <el-upload drag :auto-upload="false" :on-change="handleUploadChange" :on-remove="handleRemove" multiple :file-list="fileList">
          <IconifyIconOnline icon="ri:upload-cloud-2-line" style="font-size: 28px; color: #64748b" />
          <div class="el-upload__text">
            将文件拖到此处，或
            <em>点击上传</em>
          </div>
        </el-upload>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleConfirm">开始上传</el-button>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "@repo/utils";
import { getServerList } from "@/api/server/index";
import { getNodeListAll } from "@/api/server/node";
import { uploadServerFileWithProgress } from "@/api/server/upload";
import { uploadFileToNode } from "@/api/server/node-remote";
import type { UploadQueueStatus } from "@/api/monitor/filesystem";

interface Props {
  modelValue: boolean;
  currentPath?: string; // 预填目标目录
  queueStatus: Map<number, UploadQueueStatus>; // 复用文件管理队列样式
  enqueue?: (
    tasks: Array<{
      id: number;
      name: string;
      run: (signal: AbortSignal, onProgress: (p: number) => void) => Promise<void>;
      meta?: any;
    }>
  ) => void;
  presetFiles?: File[];
}

// 监听预设文件，用于“同步”场景
watch(
  () => props.presetFiles,
  files => {
    if (files && files.length) {
      form.value.files = files;
      fileList.value = files.map(f => ({ name: f.name, raw: f }));
    }
  },
  { immediate: true }
);

const props = defineProps<Props>();
const emit = defineEmits<{ "update:modelValue": [boolean]; success: [] }>();

const visible = ref(false);
const submitting = ref(false);
const serverOptions = ref<Array<{ label: string; value: number | string }>>([]);
const nodeOptions = ref<Array<{ label: string; value: number | string }>>([]);
const fileList = ref<any[]>([]);

const formRef = ref();
const form = ref({
  type: "SERVER" as "SERVER" | "NODE",
  serverIds: [] as Array<number | string>,
  nodeIds: [] as Array<number | string>,
  dirPath: props.currentPath || "/opt/data",
  overwrite: false,
  files: [] as File[]
});

const rules = {
  serverIds: [{ required: () => form.value.type === "SERVER", message: "请选择服务器" }],
  nodeIds: [{ required: () => form.value.type === "NODE", message: "请选择节点" }],
  dirPath: [{ required: true, message: "请输入目标目录" }],
  files: [{ required: true, message: "请选择文件" }]
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

function handleUploadChange(file: any, files: any[]) {
  form.value.files = files.map(f => f.raw).filter(Boolean);
  fileList.value = files;
}

function handleRemove(file: any, files: any[]) {
  form.value.files = files.map(f => f.raw).filter(Boolean);
  fileList.value = files;
}

function addTaskToQueue(task: UploadQueueStatus) {
  // 以本地生成ID（负数）避免与SSE ID冲突
  const id = task.fileId ?? -Date.now() - Math.floor(Math.random() * 1000);
  const copy: UploadQueueStatus = { ...task, fileId: id } as any;
  props.queueStatus.set(id, copy);
}

function updateTask(id: number, updates: Partial<UploadQueueStatus>) {
  const old = props.queueStatus.get(id);
  if (old) {
    props.queueStatus.set(id, { ...old, ...updates });
  }
}

async function handleConfirm() {
  await formRef.value?.validate();
  if (!form.value.files?.length) {
    message("请选择要上传的文件", { type: "warning" });
    return;
  }
  submitting.value = true;
  try {
    const tasks: Array<{
      id: number;
      name: string;
      run: (signal: AbortSignal, onProgress: (p: number) => void) => Promise<void>;
    }> = [];

    if (form.value.type === "SERVER") {
      if (!form.value.serverIds?.length) throw new Error("请选择服务器");
      for (const sid of form.value.serverIds) {
        for (const file of form.value.files) {
          const id = -Date.now() - Math.floor(Math.random() * 100000);
          const name = `${file.name} @ S:${sid}`;
          tasks.push({
            id,
            name,
            meta: {
              file,
              target: { type: "SERVER", id: sid },
              dirPath: form.value.dirPath
            },
            run: (signal, onProgress) =>
              uploadServerFileWithProgress(
                {
                  serverId: sid,
                  targetPath: form.value.dirPath,
                  file,
                  overwrite: form.value.overwrite
                },
                e => {
                  const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
                  onProgress(percent);
                },
                signal
              ).then(() => void 0)
          });
        }
      }
    } else {
      if (!form.value.nodeIds?.length) throw new Error("请选择节点");
      for (const nid of form.value.nodeIds) {
        for (const file of form.value.files) {
          const id = -Date.now() - Math.floor(Math.random() * 100000);
          const name = `${file.name} @ N:${nid}`;
          tasks.push({
            id,
            name,
            meta: {
              file,
              target: { type: "NODE", id: nid },
              dirPath: form.value.dirPath
            },
            run: (signal, onProgress) =>
              uploadFileToNode(
                {
                  nodeId: String(nid),
                  remoteFilePath: form.value.dirPath,
                  file,
                  overwrite: form.value.overwrite
                },
                e => {
                  const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
                  onProgress(percent);
                },
                signal
              ).then(() => void 0)
          });
        }
      }
    }

    props.enqueue?.(tasks);
    message("上传任务已加入队列", { type: "success" });
    emit("success");
    visible.value = false;
  } catch (e: any) {
    message(e?.message || "上传失败", { type: "error" });
  } finally {
    submitting.value = false;
  }
}

function handleClose() {
  visible.value = false;
}

// 双向绑定
watch(
  () => props.modelValue,
  v => (visible.value = v)
);
watch(visible, v => emit("update:modelValue", v));
</script>

<style scoped lang="scss">

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
