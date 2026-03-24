<template>
  <div class="transform-rules-container">
    <el-card class="panel" shadow="never">
      <template #header>
        <div class="header-actions">
          <div>
            <p class="panel__eyebrow">Transform Center</p>
            <h3>转换规则管理</h3>
          </div>
          <div class="header-toolbar">
            <el-button @click="handleBack">返回任务列表</el-button>
            <el-button type="primary" @click="openCreateDialog">新增规则</el-button>
          </div>
        </div>
      </template>

      <el-table :data="rules" :loading="loading" border class="table">
        <el-table-column prop="ruleId" label="ID" width="80" />
        <el-table-column prop="ruleName" label="规则名称" min-width="180" />
        <el-table-column prop="ruleType" label="类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ getRuleTypeText(row.ruleType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ruleDesc" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column prop="updateTime" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="success" @click="openTestDialog(row)">测试</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingRule?.ruleId ? '编辑规则' : '新增规则'" width="760px">
      <el-form label-position="top">
        <el-form-item label="规则名称">
          <el-input v-model="form.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型">
          <el-select v-model="form.ruleType" placeholder="请选择规则类型">
            <el-option label="字段映射" value="MAPPING" />
            <el-option label="数据过滤" value="FILTER" />
            <el-option label="数据脱敏" value="MASKING" />
            <el-option label="脚本转换" value="SCRIPT" />
          </el-select>
        </el-form-item>
        <el-form-item label="规则描述">
          <el-input v-model="form.ruleDesc" type="textarea" :rows="2" placeholder="请输入规则描述" />
        </el-form-item>
        <el-form-item label="规则配置 JSON">
          <el-input v-model="form.ruleConfig" type="textarea" :rows="12" placeholder="请输入规则配置 JSON" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testDialogVisible" title="测试转换规则" width="900px">
      <el-form label-position="top">
        <el-form-item label="测试输入 JSON">
          <el-input v-model="testInput" type="textarea" :rows="10" placeholder='例如: {"name":"张三","phone":"13800138000"}' />
        </el-form-item>
        <el-form-item label="测试输出">
          <el-input :model-value="testOutput" type="textarea" :rows="10" readonly />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="testing" @click="handleTest">执行测试</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  createTransformRule,
  deleteTransformRule,
  listTransformRules,
  testTransformRule,
  updateTransformRule,
  type TransformRule,
  type TransformRuleType,
} from "../../api/sync";

const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const dialogVisible = ref(false);
const testDialogVisible = ref(false);
const rules = ref<TransformRule[]>([]);
const editingRule = ref<TransformRule | null>(null);
const testingRule = ref<TransformRule | null>(null);
const testInput = ref('{\n  "name": "张三",\n  "phone": "13800138000"\n}');
const testOutput = ref("");

const form = reactive<TransformRule>({
  ruleName: "",
  ruleType: "MAPPING",
  ruleConfig: "{\n  \"mappings\": {}\n}",
  ruleDesc: "",
});

const defaultRuleConfig: Record<TransformRuleType, string> = {
  MAPPING: '{\n  "mappings": {\n    "sourceField": "targetField"\n  }\n}',
  FILTER: '{\n  "expression": "amount > 0"\n}',
  MASKING: '{\n  "fields": {\n    "phone": "PHONE"\n  }\n}',
  SCRIPT: '{\n  "script": "return input;"\n}',
};

const resetForm = () => {
  editingRule.value = null;
  form.ruleName = "";
  form.ruleType = "MAPPING";
  form.ruleConfig = defaultRuleConfig.MAPPING;
  form.ruleDesc = "";
};

const loadRules = async () => {
  loading.value = true;
  try {
    const res = await listTransformRules();
    rules.value = res.data || [];
  } catch (error: any) {
    ElMessage.error(error?.message || "加载规则失败");
  } finally {
    loading.value = false;
  }
};

const openCreateDialog = () => {
  resetForm();
  dialogVisible.value = true;
};

const openEditDialog = (rule: TransformRule) => {
  editingRule.value = rule;
  form.ruleName = rule.ruleName;
  form.ruleType = rule.ruleType;
  form.ruleConfig = rule.ruleConfig;
  form.ruleDesc = rule.ruleDesc || "";
  dialogVisible.value = true;
};

const openTestDialog = (rule: TransformRule) => {
  testingRule.value = rule;
  testOutput.value = "";
  testDialogVisible.value = true;
};

const handleSave = async () => {
  if (!form.ruleName.trim()) {
    ElMessage.warning("规则名称不能为空");
    return;
  }

  saving.value = true;
  try {
    JSON.parse(form.ruleConfig);

    if (editingRule.value?.ruleId) {
      await updateTransformRule(editingRule.value.ruleId, { ...form });
      ElMessage.success("规则更新成功");
    } else {
      await createTransformRule({ ...form });
      ElMessage.success("规则创建成功");
    }

    dialogVisible.value = false;
    await loadRules();
  } catch (error: any) {
    ElMessage.error(error?.message || "保存失败，请确认规则配置 JSON 格式正确");
  } finally {
    saving.value = false;
  }
};

const handleDelete = async (rule: TransformRule) => {
  if (!rule.ruleId) return;
  try {
    await ElMessageBox.confirm(`确认删除规则“${rule.ruleName}”吗？`, "删除规则", {
      type: "warning",
    });
    await deleteTransformRule(rule.ruleId);
    ElMessage.success("规则删除成功");
    await loadRules();
  } catch (error: any) {
    if (error !== "cancel" && error !== "close") {
      ElMessage.error(error?.message || "删除失败");
    }
  }
};

const handleTest = async () => {
  if (!testingRule.value?.ruleId) return;

  testing.value = true;
  try {
    const parsedInput = JSON.parse(testInput.value);
    const res = await testTransformRule(testingRule.value.ruleId, parsedInput);
    testOutput.value = JSON.stringify(res.data || {}, null, 2);
    ElMessage.success("测试成功");
  } catch (error: any) {
    testOutput.value = error?.message || "测试失败";
    ElMessage.error(error?.message || "测试失败");
  } finally {
    testing.value = false;
  }
};

const getRuleTypeText = (ruleType: string) => {
  const map: Record<string, string> = {
    MAPPING: "字段映射",
    FILTER: "数据过滤",
    MASKING: "数据脱敏",
    SCRIPT: "脚本转换",
  };
  return map[ruleType] || ruleType;
};

const handleBack = () => {
  router.push("/sync/tasks");
};

onMounted(() => {
  loadRules();
});
</script>

<style scoped lang="scss">
.transform-rules-container {
  padding: 24px;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-toolbar {
  display: flex;
  gap: 12px;
}

.panel__eyebrow {
  margin: 0 0 6px;
  font-size: 12px;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
  letter-spacing: 0.12em;
}

h3 {
  margin: 0;
  font-size: 20px;
}
</style>
