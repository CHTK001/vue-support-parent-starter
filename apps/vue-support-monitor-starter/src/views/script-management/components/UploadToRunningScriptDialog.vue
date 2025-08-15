<template>
  <el-dialog
    v-model="visibleInner"
    title="文件上传"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
      <el-form-item label="类型" prop="type">
        <ScSelect v-model="form.type" :options="typeOptions" placeholder="请选择类型" />
      </el-form-item>

      <el-form-item v-if="form.type === 'REMOTE'" label="服务器" prop="serverId">
        <ScSelect v-model="form.serverId" :options="serverOptions" placeholder="请选择服务器" />
      </el-form-item>

      <el-form-item v-else label="节点" prop="nodeId">
        <ScSelect v-model="form.nodeId" :options="nodeOptions" placeholder="请选择节点" />
      </el-form-item>

      <el-form-item label="上传目录" prop="targetPath">
        <el-input v-model="form.targetPath" placeholder="例如：/home/user/app 或 C:\\apps" />
      </el-form-item>

      <el-form-item label="文件" prop="file">
        <el-upload :limit="1" :auto-upload="false" :on-change="onFileChange" :file-list="fileList">
          <el-button type="primary">选择文件</el-button>
        </el-upload>
        <el-progress v-if="progress > 0" :percentage="progress" style="width: 100%; margin-top: 8px" />
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
import { uploadServerFileWithProgress } from "@/api/server/upload";
import { uploadFileToNode } from "@/api/node-remote";
import { getServerList } from "@/api/server/index";
import { getNodeListAll } from "@/api/node";

interface Props {
  visible: boolean;
  scriptId?: number | string;
}

const props = defineProps<Props>();
const emit = defineEmits<["update:visible"]>();

const visibleInner = ref(false);
watch(
  () => props.visible,
  v => (visibleInner.value = v)
);

const formRef = ref<any>();
const form = ref({
  type: "REMOTE" as "REMOTE" | "NODE",
  serverId: undefined as any,
  nodeId: undefined as any,
  targetPath: "",
  file: undefined as File | undefined,
});

const typeOptions = [
  { label: "远程", value: "REMOTE" },
  { label: "节点", value: "NODE" },
];

const serverOptions = ref<Array<{ label: string; value: number | string }>>([]);
const nodeOptions = ref<Array<{ label: string; value: number | string }>>([]);
const fileList = ref<any[]>([]);
const progress = ref(0);
const submitting = ref(false);

const rules = {
  type: [{ required: true, message: "请选择类型" }],
  serverId: [{ required: () => form.value.type === "REMOTE", message: "请选择服务器" }],
  nodeId: [{ required: () => form.value.type === "NODE", message: "请选择节点" }],
  targetPath: [
    { required: true, message: "请输入上传目录" },
    { validator: validatePath, trigger: "blur" },
  ],
  file: [{ required: true, message: "请选择文件" }],
};

function validatePath(_: any, v: string, cb: (e?: Error) => void) {
  if (!v || !v.trim()) return cb(new Error("上传目录不能为空"));
  const isAbs = v.startsWith("/") || /^[A-Za-z]:[\\/]/.test(v);
  if (!isAbs) return cb(new Error("请输入绝对路径"));
  if (v.includes("..")) return cb(new Error("路径不能包含 .."));
  cb();
}

const onFileChange = (file: any, list: any[]) => {
  form.value.file = file?.raw;
  fileList.value = list.slice(-1);
};

onMounted(async () => {
  try {
    const servers = await getServerList({ page: 1, pageSize: 500 });
    const records = (servers as any)?.data?.records || [];
    serverOptions.value = records.map((s: any) => ({
      label: `${s.monitorSysGenServerName || s.monitorSysGenServerHost || s.monitorSysGenServerId}`,
      value: s.monitorSysGenServerId,
    }));
  } catch (e) {
    // 忽略，交互层提示
  }

  try {
    const nodes = await getNodeListAll({});
    const list = (nodes as any)?.data || [];
    nodeOptions.value = list.map((n: any) => ({
      label: `${n.name || n.nodeId || n.id}`,
      value: n.id || n.nodeId,
    }));
  } catch (e) {
    // 忽略
  }
});

const handleConfirm = async () => {
  await formRef.value?.validate();
  if (!form.value.file) return;

  submitting.value = true;
  progress.value = 0;
  try {
    if (form.value.type === "REMOTE") {
      await uploadServerFileWithProgress(
        {
          serverId: form.value.serverId!,
          targetPath: form.value.targetPath,
          file: form.value.file!,
          scriptId: props.scriptId,
        },
        e => {
          if ((e as any)?.total) {
            progress.value = Math.round(((e as any).loaded * 100) / (e as any).total);
          }
        }
      );
    } else {
      await uploadFileToNode(
        {
          nodeId: String(form.value.nodeId!),
          remoteFilePath: form.value.targetPath,
          file: form.value.file!,
          scriptId: props.scriptId,
        },
        e => {
          if ((e as any)?.total) {
            progress.value = Math.round(((e as any).loaded * 100) / (e as any).total);
          }
        }
      );
    }
    ElMessage.success("上传成功");
    emit("update:visible", false);
  } catch (e: any) {
    ElMessage.error(e?.message || "上传失败");
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

<style scoped>
</style>

