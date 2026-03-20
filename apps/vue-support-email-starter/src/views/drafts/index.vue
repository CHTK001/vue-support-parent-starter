<template>
  <el-container class="email-container">
    <el-aside width="200px">
      <el-menu :default-active="activeMenu" @select="handleMenuSelect">
        <el-menu-item index="inbox">
          <el-icon><Box /></el-icon>
          <span>收件箱</span>
        </el-menu-item>
        <el-menu-item index="compose">
          <el-icon><Edit /></el-icon>
          <span>写邮件</span>
        </el-menu-item>
        <el-menu-item index="sent">
          <el-icon><Promotion /></el-icon>
          <span>已发送</span>
        </el-menu-item>
        <el-menu-item index="drafts">
          <el-icon><Document /></el-icon>
          <span>草稿箱</span>
        </el-menu-item>
        <el-menu-item index="accounts">
          <el-icon><User /></el-icon>
          <span>账户管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-main>
      <div class="toolbar">
        <h2>草稿箱</h2>
        <el-button type="primary" @click="refreshDrafts">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
      <el-table
        v-loading="loading"
        :data="drafts"
        style="width: 100%"
        @row-click="editDraft"
      >
        <el-table-column prop="toAddresses" label="收件人" width="200">
          <template #default="scope">
            {{ scope.row.toAddresses?.join(", ") || "未填写" }}
          </template>
        </el-table-column>
        <el-table-column prop="subject" label="主题">
          <template #default="scope">
            {{ scope.row.subject || "(无主题)" }}
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="保存时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click.stop="editDraft(scope.row)">
              编辑
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click.stop="deleteDraft(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && drafts.length === 0" description="暂无草稿" />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Box,
  Edit,
  Promotion,
  Document,
  User,
  Refresh,
} from "@element-plus/icons-vue";
import { useEmailStore } from "../../stores/email";

const router = useRouter();
const emailStore = useEmailStore();
const activeMenu = ref("drafts");
const loading = ref(false);

interface Draft {
  id?: string;
  accountId?: string;
  toAddresses?: string[];
  ccAddresses?: string[];
  subject?: string;
  contentText?: string;
  contentHtml?: string;
  updatedAt?: Date;
}

const drafts = ref<Draft[]>([]);

const handleMenuSelect = (index: string) => {
  router.push(`/${index}`);
};

const refreshDrafts = async () => {
  loading.value = true;
  try {
    // 从 localStorage 加载草稿
    const savedDrafts = localStorage.getItem("email_drafts");
    if (savedDrafts) {
      drafts.value = JSON.parse(savedDrafts);
    } else {
      drafts.value = [];
    }
    ElMessage.success("刷新成功");
  } catch (error) {
    ElMessage.error("加载草稿失败");
  } finally {
    loading.value = false;
  }
};

const editDraft = (row: Draft) => {
  // 将草稿数据传递到写邮件页面
  router.push({
    name: "compose",
    query: {
      draftId: row.id,
    },
  });
};

const deleteDraft = async (row: Draft) => {
  try {
    await ElMessageBox.confirm("确定要删除这个草稿吗？", "提示", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });

    // 从 localStorage 删除草稿
    const index = drafts.value.findIndex((d) => d.id === row.id);
    if (index > -1) {
      drafts.value.splice(index, 1);
      localStorage.setItem("email_drafts", JSON.stringify(drafts.value));
      ElMessage.success("删除成功");
    }
  } catch (error) {
    // 用户取消
  }
};

const formatDate = (date: Date | undefined) => {
  if (!date) return "";
  return new Date(date).toLocaleString("zh-CN");
};

onMounted(() => {
  refreshDrafts();
});
</script>

<style scoped>
.email-container {
  height: 100vh;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
