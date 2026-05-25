<template>
  <div class="p-4">
    <!-- 工具栏 -->
    <el-card shadow="never" class="mb-4">
      <div class="flex items-center justify-between">
        <span class="text-lg font-bold">订阅管理</span>
        <el-button type="primary" @click="showCreate = true">
          <el-icon><Plus /></el-icon>创建订阅
        </el-button>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="subscriptionId" label="订阅 ID" width="300" show-overflow-tooltip />
        <el-table-column prop="clientId" label="客户端 ID" width="200" />
        <el-table-column prop="pipelineId" label="Pipeline ID" width="200" />
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="过滤条件" min-width="200">
          <template #default="{ row }">
            <el-tag v-if="row.filter" size="small">{{ JSON.stringify(row.filter) }}</el-tag>
            <span v-else class="text-gray-400">无</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确定取消订阅?" @confirm="handleCancel(row.subscriptionId)">
              <template #reference>
                <el-button type="danger" size="small">取消</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建对话框 -->
    <el-dialog v-model="showCreate" title="创建订阅" width="500px" destroy-on-close>
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="Pipeline ID" required>
          <el-input v-model="createForm.pipelineId" placeholder="订阅的 Pipeline ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" :loading="createLoading" @click="handleCreate">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { fetchSubscriptionList, fetchCreateSubscription, fetchCancelSubscription } from "../../api/subscription";
import type { Subscription } from "../../types";

defineOptions({ name: "DatalakeSubscriptionPage" });

const loading = ref(false);
const list = ref<Subscription[]>([]);
const showCreate = ref(false);
const createLoading = ref(false);
const createForm = reactive({ pipelineId: "" });

const loadData = async () => {
  loading.value = true;
  try {
    const { data } = await fetchSubscriptionList();
    list.value = data?.data || [];
  } catch {} finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (!createForm.pipelineId) {
    ElMessage.warning("请输入 Pipeline ID");
    return;
  }
  createLoading.value = true;
  try {
    await fetchCreateSubscription({ pipelineId: createForm.pipelineId });
    ElMessage.success("创建成功");
    showCreate.value = false;
    createForm.pipelineId = "";
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "创建失败");
  } finally {
    createLoading.value = false;
  }
};

const handleCancel = async (id: string) => {
  try {
    await fetchCancelSubscription(id);
    ElMessage.success("取消成功");
    loadData();
  } catch (e: any) {
    ElMessage.error(e?.msg || "取消失败");
  }
};

onMounted(loadData);
</script>
