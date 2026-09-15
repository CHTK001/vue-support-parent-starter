<template>
  <div class="p-4">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-xl font-bold text-gray-800">趣味模块配置</h3>
      <el-button type="primary" @click="showAddDialog">添加模块</el-button>
    </div>

    <!-- 配置列表 -->
    <el-table :data="configs" stripe border style="width: 100%">
      <el-table-column prop="moduleCode" label="模块编码" width="120" />
      <el-table-column prop="moduleName" label="模块名称" width="150" />
      <el-table-column prop="moduleDesc" label="描述" min-width="200" show-overflow-tooltip />
      <el-table-column prop="moduleIcon" label="图标" width="80" align="center">
        <template #default="{ row }">
          <el-icon :size="20">
            <component :is="row.moduleIcon" />
          </el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="modulePath" label="路径" width="150" />
      <el-table-column prop="enabled" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.enabled"
            :active-value="1"
            :inactive-value="0"
            @change="toggleEnabled(row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button text size="small" @click="editConfig(row)">编辑</el-button>
          <el-button text size="small" type="danger" @click="deleteConfig(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑模块' : '添加模块'" width="500px">
      <el-form :model="formData" label-width="80px">
        <el-form-item label="模块编码">
          <el-input v-model="formData.moduleCode" :disabled="isEdit" placeholder="如: INSECT" />
        </el-form-item>
        <el-form-item label="模块名称">
          <el-input v-model="formData.moduleName" placeholder="如: 昆虫识图" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.moduleDesc" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="formData.moduleIcon" placeholder="如: Bug" />
        </el-form-item>
        <el-form-item label="路径">
          <el-input v-model="formData.modulePath" placeholder="如: /edu/fun/insect" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="formData.sortOrder" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="配置JSON">
          <el-input v-model="formData.configJson" type="textarea" :rows="3" placeholder='{"url":"..."}' />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { eduaiApi } from "../api/eduaiApi";
import type { FunConfig } from "../api/types";

const configs = ref<FunConfig[]>([]);
const loading = ref(false);

const dialogVisible = ref(false);
const isEdit = ref(false);
const formData = ref<Partial<FunConfig>>({});

onMounted(() => {
  loadConfigs();
});

const loadConfigs = async () => {
  loading.value = true;
  try {
    configs.value = await eduaiApi.listAllFunConfigs();
  } catch (e) {
    ElMessage.error("加载配置失败");
  } finally {
    loading.value = false;
  }
};

const showAddDialog = () => {
  isEdit.value = false;
  formData.value = {
    moduleCode: "",
    moduleName: "",
    moduleDesc: "",
    moduleIcon: "",
    modulePath: "",
    enabled: 1,
    sortOrder: 0,
    configJson: "{}",
  };
  dialogVisible.value = true;
};

const editConfig = (config: FunConfig) => {
  isEdit.value = true;
  formData.value = { ...config };
  dialogVisible.value = true;
};

const saveConfig = async () => {
  try {
    await eduaiApi.saveFunConfig(formData.value);
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    loadConfigs();
  } catch (e) {
    ElMessage.error("保存失败");
  }
};

const toggleEnabled = async (config: FunConfig) => {
  try {
    await eduaiApi.toggleFunConfig(config.moduleCode, config.enabled);
    ElMessage.success("更新成功");
  } catch (e) {
    ElMessage.error("更新失败");
    config.enabled = config.enabled === 1 ? 0 : 1;
  }
};

const deleteConfig = async (config: FunConfig) => {
  try {
    await ElMessageBox.confirm(`确定要删除模块「${config.moduleName}」吗？`, "提示", {
      type: "warning",
    });
    await eduaiApi.deleteFunConfig(config.configId);
    ElMessage.success("删除成功");
    loadConfigs();
  } catch (e) {
    if (e !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};
</script>
