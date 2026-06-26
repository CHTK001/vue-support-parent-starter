<template>
  <section class="skill-page system-container modern-bg">
    <div class="chat-like-header">
      <ScButton circle type="default" class="chat-like-header__back" @click="handleBackPage">
        <IconifyIconOnline icon="ri:arrow-left-line" />
      </ScButton>
      <div class="chat-like-header__title-wrap">
        <span class="chat-like-header__title">技能管理</span>
        <span class="chat-like-header__subtitle">管理 AI Skills，可在 Agent 编排中选择</span>
      </div>
      <div class="chat-like-header__actions">
        <el-button type="primary" size="small" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" />
          新建技能
        </el-button>
      </div>
    </div>

    <el-table :data="list" style="width: 100%" v-loading="loading">
      <el-table-column prop="sysAiSkillName" label="名称" min-width="140" />
      <el-table-column prop="sysAiSkillCode" label="编码" min-width="120" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.sysAiSkillStatus === 1 ? 'success' : 'danger'" size="small">
            {{ row.sysAiSkillStatus === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sysAiSkillContent" label="内容/Prompt" min-width="200" show-overflow-tooltip />
      <el-table-column prop="sysAiSkillSort" label="排序" width="60" align="center" />
      <el-table-column prop="sysAiSkillRemark" label="备注" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
          <el-button size="small" @click="handleCopy(row)">复制</el-button>
          <el-popconfirm title="确认删除？" @confirm="handleDelete(row)">
            <template #reference>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑技能' : '新建技能'" width="600px" destroy-on-close>
      <el-form :model="form" label-width="100px" v-loading="saving">
        <el-form-item label="名称" required>
          <el-input v-model="form.sysAiSkillName" placeholder="技能名称" />
        </el-form-item>
        <el-form-item label="编码" required>
          <el-input v-model="form.sysAiSkillCode" placeholder="唯一编码" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="Prompt 内容">
          <el-input v-model="form.sysAiSkillContent" type="textarea" :rows="6"
            placeholder="技能 Prompt 定义内容" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.sysAiSkillIcon" placeholder="图标类名或 URL" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sysAiSkillSort" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form._status" active-value="1" inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.sysAiSkillRemark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  listAiSkills,
  saveAiSkill,
  updateAiSkill,
  deleteAiSkill,
  copyAiSkill,
  type AiSkill,
} from "@/api/ai/skill";

const router = useRouter();
const list = ref<AiSkill[]>([]);
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);

const defaultForm = () => ({
  sysAiSkillName: "",
  sysAiSkillCode: "",
  sysAiSkillContent: "",
  sysAiSkillIcon: "",
  sysAiSkillStatus: 1 as const,
  sysAiSkillSort: 0,
  sysAiSkillRemark: "",
  _status: "1",
});

const form = ref<any>(defaultForm());

async function fetchList() {
  loading.value = true;
  try {
    const res = await listAiSkills();
    list.value = res.result || [];
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  isEdit.value = false;
  form.value = defaultForm();
  dialogVisible.value = true;
}

function openEditDialog(row: AiSkill) {
  isEdit.value = true;
  form.value = {
    ...row,
    _status: String(row.sysAiSkillStatus ?? 1),
  };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    const data = {
      ...form.value,
      sysAiSkillStatus: Number(form.value._status),
    };
    delete data._status;
    if (isEdit.value) {
      await updateAiSkill(data);
    } else {
      await saveAiSkill(data);
    }
    dialogVisible.value = false;
    await fetchList();
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: AiSkill) {
  if (row.sysAiSkillId) {
    await deleteAiSkill(row.sysAiSkillId);
    await fetchList();
  }
}

async function handleCopy(row: AiSkill) {
  if (row.sysAiSkillId) {
    await copyAiSkill(row.sysAiSkillId, row.sysAiSkillName + "-copy");
    await fetchList();
  }
}

function handleBackPage() {
  router.back();
}

onMounted(fetchList);
</script>

<style scoped lang="scss">
.skill-page {
  padding: 20px;
}
</style>