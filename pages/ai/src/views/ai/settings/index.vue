<template>
  <section class="settings-page">
    <header class="settings-header">
      <div>
        <p class="eyebrow">AI Settings</p>
        <h1>AI 模型配置</h1>
        <p>管理聊天、生图、视频和图像处理模型的厂家、地址与计费配置。</p>
      </div>
      <div class="header-actions">
        <ScButton @click="router.push('/ai/home')">返回首页</ScButton>
        <ScButton type="primary" @click="openCreate">新增模型</ScButton>
      </div>
    </header>

    <div class="table-card">
      <table class="module-table">
        <thead>
          <tr>
            <th>模型</th>
            <th>类型</th>
            <th>厂家</th>
            <th>版本</th>
            <th>输入费用</th>
            <th>输出费用</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in modules" :key="item.sysAiModuleId">
            <td>
              <div class="module-name">
                <strong>{{ item.sysAiModuleName }}</strong>
                <span>{{ item.sysAiModuleCode }}</span>
              </div>
            </td>
            <td>{{ item.sysAiModuleType }}</td>
            <td>{{ item.sysAiModuleVendor || item.sysAiModuleManufacturers || '-' }}</td>
            <td>{{ item.sysAiModuleVersion || '-' }}</td>
            <td>{{ formatPrice(item.sysAiModuleInputPrice) }}</td>
            <td>{{ formatPrice(item.sysAiModuleOutputPrice) }}</td>
            <td>{{ item.sysAiModuleStatus === 1 ? '启用' : '禁用' }}</td>
            <td class="actions">
              <button type="button" @click="openEdit(item)">编辑</button>
              <button type="button" class="danger" @click="remove(item)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px">
      <div class="form-grid">
        <label class="field">
          <span>模型名称</span>
          <input v-model="form.sysAiModuleName" type="text" />
        </label>
        <label class="field">
          <span>模型编码</span>
          <input v-model="form.sysAiModuleCode" type="text" />
        </label>
        <label class="field">
          <span>模型类型</span>
          <select v-model="form.sysAiModuleType">
            <option v-for="item in moduleTypes" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label class="field">
          <span>厂家</span>
          <select v-model="form.sysAiModuleVendor">
            <option v-for="item in vendors" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label class="field full">
          <span>模型地址</span>
          <input v-model="form.sysAiModuleUrl" type="text" />
        </label>
        <label class="field">
          <span>版本</span>
          <input v-model="form.sysAiModuleVersion" type="text" />
        </label>
        <label class="field">
          <span>排序</span>
          <input v-model.number="form.sysAiModuleSort" type="number" />
        </label>
        <label class="field">
          <span>输入费用</span>
          <input v-model.number="form.sysAiModuleInputPrice" type="number" step="0.0001" />
        </label>
        <label class="field">
          <span>输出费用</span>
          <input v-model.number="form.sysAiModuleOutputPrice" type="number" step="0.0001" />
        </label>
        <label class="field">
          <span>支持图片</span>
          <select v-model.number="form.sysAiModuleVlm">
            <option :value="1">是</option>
            <option :value="0">否</option>
          </select>
        </label>
        <label class="field">
          <span>本地模型</span>
          <select v-model.number="form.sysAiModuleLocal">
            <option :value="1">本地</option>
            <option :value="0">远程</option>
          </select>
        </label>
        <label class="field">
          <span>状态</span>
          <select v-model.number="form.sysAiModuleStatus">
            <option :value="1">启用</option>
            <option :value="0">禁用</option>
          </select>
        </label>
        <label class="field full">
          <span>备注</span>
          <textarea v-model="form.sysAiModuleRemark" rows="4" />
        </label>
      </div>

      <template #footer>
        <ScButton @click="dialogVisible = false">取消</ScButton>
        <ScButton type="primary" @click="submit">保存</ScButton>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ElDialog } from "element-plus";
import { ScButton } from "@repo/components/ScButton";
import { message } from "@repo/utils";
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  deleteAiModule,
  listAiModules,
  saveAiModule,
  type AiModule,
  updateAiModule,
} from "../../../api/ai/module";

const router = useRouter();
const modules = ref<AiModule[]>([]);
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);

const moduleTypes = ["LLM", "IMAGE", "VIDEO", "FACE", "COLORIZATION", "RESOLUTION"];
const vendors = ["openai", "stability", "runway", "vision", "aliyun", "tencent", "local"];

const form = reactive<AiModule>({
  sysAiModuleName: "",
  sysAiModuleCode: "",
  sysAiModuleType: "LLM",
  sysAiModuleVendor: "openai",
  sysAiModuleManufacturers: "openai",
  sysAiModuleUrl: "",
  sysAiModuleVersion: "v1",
  sysAiModuleStatus: 1,
  sysAiModuleSort: 0,
  sysAiModuleVlm: 0,
  sysAiModuleLocal: 0,
  sysAiModuleInputPrice: 0,
  sysAiModuleOutputPrice: 0,
  sysAiModuleRemark: "",
});

const dialogTitle = computed(() => (editingId.value ? "编辑模型" : "新增模型"));

const resetForm = () => {
  editingId.value = null;
  Object.assign(form, {
    sysAiModuleId: undefined,
    sysAiModuleName: "",
    sysAiModuleCode: "",
    sysAiModuleType: "LLM",
    sysAiModuleVendor: "openai",
    sysAiModuleManufacturers: "openai",
    sysAiModuleUrl: "",
    sysAiModuleVersion: "v1",
    sysAiModuleStatus: 1,
    sysAiModuleSort: 0,
    sysAiModuleVlm: 0,
    sysAiModuleLocal: 0,
    sysAiModuleInputPrice: 0,
    sysAiModuleOutputPrice: 0,
    sysAiModuleRemark: "",
  });
};

const loadModules = async () => {
  const res = await listAiModules();
  modules.value = res.data || [];
};

const openCreate = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEdit = (item: AiModule) => {
  editingId.value = item.sysAiModuleId || null;
  Object.assign(form, { ...item });
  dialogVisible.value = true;
};

const submit = async () => {
  form.sysAiModuleManufacturers = form.sysAiModuleVendor;
  if (editingId.value) {
    await updateAiModule(form);
    message("模型已更新", { type: "success" });
  } else {
    await saveAiModule(form);
    message("模型已创建", { type: "success" });
  }
  dialogVisible.value = false;
  await loadModules();
};

const remove = async (item: AiModule) => {
  if (!item.sysAiModuleId) return;
  await deleteAiModule(item.sysAiModuleId);
  message("模型已删除", { type: "success" });
  await loadModules();
};

const formatPrice = (value?: number) => {
  const number = Number(value || 0);
  return number.toFixed(4);
};

onMounted(loadModules);
</script>

<style scoped lang="scss">
.settings-page {
  padding: 28px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  margin-bottom: 24px;

  h1 {
    margin: 6px 0 10px;
    font-size: 36px;
    color: #0f172a;
  }

  p {
    margin: 0;
    color: #475569;
  }
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #2563eb;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.table-card {
  overflow: auto;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
}

.module-table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 16px 18px;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
  }

  th {
    color: #475569;
    font-size: 13px;
  }
}

.module-name {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    color: #0f172a;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.actions {
  display: flex;
  gap: 10px;

  button {
    border: 0;
    background: none;
    cursor: pointer;
    color: #2563eb;
  }

  .danger {
    color: #dc2626;
  }
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;

  span {
    font-weight: 600;
    color: #0f172a;
  }
}

.field.full {
  grid-column: 1 / -1;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid #dbe3f0;
  border-radius: 14px;
  padding: 12px 14px;
  background: #f8fafc;
}

@media (max-width: 960px) {
  .settings-header {
    flex-direction: column;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
