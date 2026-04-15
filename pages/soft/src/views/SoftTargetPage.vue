<template>
  <SoftWorkspace
    title="目标管理"
    subtitle="管理本机与远程执行目标，供安装、运维与脚本执行复用。"
    :metrics="metrics"
  >
    <template #actions>
      <el-button @click="loadTargets">刷新</el-button>
      <el-button type="primary" @click="openCreate">新增目标</el-button>
    </template>

    <el-table v-loading="loading" :data="targets" border class="target-table">
      <el-table-column prop="targetName" label="名称" min-width="150" />
      <el-table-column prop="targetCode" label="编码" min-width="120" />
      <el-table-column prop="targetType" label="类型" width="120" />
      <el-table-column prop="host" label="主机" min-width="160" />
      <el-table-column prop="port" label="端口" width="90" />
      <el-table-column prop="baseDirectory" label="基础目录" min-width="180" />
      <el-table-column label="启用" width="120">
        <template #default="{ row }">
          <SoftStatusTag :status="row.enabled ? 'ENABLED' : 'DISABLED'" />
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
      <el-table-column fixed="right" label="操作" width="180">
        <template #default="{ row }">
          <el-space wrap>
            <el-button link @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="removeTarget(row.softTargetId)">
              删除
            </el-button>
          </el-space>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" width="760px" :title="dialogTitle" class="target-dialog">
      <el-form label-width="92px" class="target-form">
        <el-form-item label="目标名称">
          <el-input v-model="form.targetName" />
        </el-form-item>
        <el-form-item label="目标编码">
          <el-input v-model="form.targetCode" />
        </el-form-item>
        <el-form-item label="目标类型">
          <el-select v-model="form.targetType" style="width: 100%">
            <el-option label="本机" value="LOCAL" />
            <el-option label="SSH" value="SSH" />
            <el-option label="WinRM" value="WINRM" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作系统">
          <el-input v-model="form.osType" placeholder="linux / windows" />
        </el-form-item>
        <el-form-item label="架构">
          <el-input v-model="form.architecture" placeholder="amd64 / arm64" />
        </el-form-item>
        <el-form-item label="主机">
          <el-input v-model="form.host" :disabled="form.targetType === 'LOCAL'" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input-number v-model="form.port" :min="1" :max="65535" style="width: 100%" />
        </el-form-item>
        <el-form-item label="账号">
          <el-input v-model="form.username" :disabled="form.targetType === 'LOCAL'" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            :disabled="form.targetType === 'LOCAL'"
          />
        </el-form-item>
        <el-form-item label="私钥">
          <el-input
            v-model="form.privateKey"
            type="textarea"
            :rows="4"
            :disabled="form.targetType !== 'SSH'"
          />
        </el-form-item>
        <el-form-item label="基础目录">
          <el-input v-model="form.baseDirectory" placeholder="例如 /opt/soft 或 C:/soft" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </SoftWorkspace>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import {
  createSoftTarget,
  deleteSoftTarget,
  listSoftTargets,
  updateSoftTarget,
  type SoftTarget,
} from "../api";
import SoftStatusTag from "../components/SoftStatusTag.vue";
import SoftWorkspace from "../components/SoftWorkspace.vue";

const loading = ref(false);
const saving = ref(false);
const visible = ref(false);
const editingId = ref<number | null>(null);
const targets = ref<SoftTarget[]>([]);

const emptyForm = (): SoftTarget => ({
  targetName: "",
  targetCode: "",
  targetType: "LOCAL",
  osType: "",
  architecture: "",
  host: "",
  port: 22,
  username: "",
  password: "",
  privateKey: "",
  baseDirectory: "",
  enabled: true,
  description: "",
  metadataJson: "",
});

const form = reactive<SoftTarget>(emptyForm());

const dialogTitle = computed(() =>
  editingId.value ? "编辑目标" : "新增目标",
);

const metrics = computed(() => [
  {
    label: "目标总数",
    value: targets.value.length,
    hint: "全部安装目标",
  },
  {
    label: "本机目标",
    value: targets.value.filter((item) => item.targetType === "LOCAL").length,
    hint: "直接在当前节点执行",
  },
  {
    label: "远程目标",
    value: targets.value.filter((item) => item.targetType !== "LOCAL").length,
    hint: "通过 SSH / WinRM 执行",
  },
]);

const patchForm = (value: SoftTarget) => {
  Object.assign(form, emptyForm(), value);
};

const loadTargets = async () => {
  loading.value = true;
  try {
    const result = await listSoftTargets();
    targets.value = result.data || [];
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  editingId.value = null;
  patchForm(emptyForm());
  visible.value = true;
};

const openEdit = (row: SoftTarget) => {
  editingId.value = row.softTargetId || null;
  patchForm(row);
  visible.value = true;
};

const submit = async () => {
  if (!form.targetName || !form.targetCode) {
    message("目标名称和编码不能为空", { type: "warning" });
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) {
      await updateSoftTarget(editingId.value, form);
    } else {
      await createSoftTarget(form);
    }
    message("目标已保存", { type: "success" });
    visible.value = false;
    await loadTargets();
  } finally {
    saving.value = false;
  }
};

const removeTarget = async (id?: number) => {
  if (!id) {
    return;
  }
  await ElMessageBox.confirm("删除目标后，关联安装实例将无法再执行运维动作。确认继续？", "删除目标", {
    type: "warning",
  });
  await deleteSoftTarget(id);
  message("目标已删除", { type: "success" });
  await loadTargets();
};

onMounted(loadTargets);
</script>

<style scoped lang="scss">
.target-table {
  :deep(.el-table__header-wrapper th) {
    background: rgba(241, 245, 249, 0.9);
  }

  :deep(.el-table__row td) {
    background: rgba(255, 255, 255, 0.86);
  }
}

.target-form {
  display: grid;
  gap: 12px;
}
</style>
