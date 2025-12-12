<template>
  <div class="simple-script-management">
    <!-- 头部工具栏 -->
    <div class="header-toolbar">
      <div class="toolbar-left">
        <h2 class="page-title">
          <IconifyIconOnline icon="ri:code-s-slash-line" />
          <span>脚本管理</span>
        </h2>
        <div class="toolbar-stats">
          <span class="stat-item">
            <IconifyIconOnline icon="ri:file-list-line" />
            总计: {{ pagination.total }}
          </span>
          <span class="stat-item">
            <IconifyIconOnline icon="ri:check-line" />
            启用: {{ enabledCount }}
          </span>
        </div>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" size="large" @click="handleCreate">
          <IconifyIconOnline icon="ri:add-line" />
          <span>新建脚本</span>
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索脚本名称或描述..."
        clearable
        size="large"
        class="search-input"
        @input="handleSearch"
      >
        <template #prefix>
          <IconifyIconOnline icon="ri:search-line" />
        </template>
      </el-input>

      <el-select
        v-model="filterType"
        placeholder="脚本类型"
        clearable
        size="large"
        class="filter-select"
        @change="handleFilter"
      >
        <el-option label="全部类型" value="" />
        <el-option label="Shell" value="SHELL" />
        <el-option label="Python" value="PYTHON" />
        <el-option label="PowerShell" value="POWERSHELL" />
        <el-option label="Batch" value="BATCH" />
        <el-option label="JavaScript" value="JAVASCRIPT" />
        <el-option label="SQL" value="SQL" />
      </el-select>

      <el-select
        v-model="filterStatus"
        placeholder="状态"
        clearable
        size="large"
        class="filter-select"
        @change="handleFilter"
      >
        <el-option label="全部状态" value="" />
        <el-option label="启用" value="ENABLED" />
        <el-option label="禁用" value="DISABLED" />
      </el-select>

      <el-button size="large" @click="handleRefresh">
        <IconifyIconOnline icon="ri:refresh-line" />
      </el-button>
    </div>

    <!-- 脚本列表 -->
    <div class="script-list" v-loading="loading">
      <div
        v-for="script in scripts"
        :key="script.monitorSysGenScriptId"
        class="script-card"
        @click="handleEdit(script)"
      >
        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="script-icon">
            <IconifyIconOnline
              :icon="getScriptTypeIcon(script.monitorSysGenScriptType)"
            />
          </div>
          <div class="script-info">
            <h3 class="script-name">{{ script.monitorSysGenScriptName }}</h3>
            <p class="script-description">
              {{ script.monitorSysGenScriptDescription || "暂无描述" }}
            </p>
          </div>
          <div class="card-actions" @click.stop>
            <el-switch
              v-model="script.monitorSysGenScriptStatus"
              active-value="ENABLED"
              inactive-value="DISABLED"
              @change="handleStatusChange(script)"
            />
            <el-dropdown @command="(cmd) => handleAction(cmd, script)">
              <el-button type="text" class="more-btn">
                <IconifyIconOnline icon="ri:more-2-fill" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">
                    <IconifyIconOnline icon="ri:edit-line" />
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item command="copy">
                    <IconifyIconOnline icon="ri:file-copy-line" />
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="meta-info">
            <span class="meta-item">
              <IconifyIconOnline icon="ri:code-box-line" />
              {{ script.monitorSysGenScriptType }}
            </span>
            <span class="meta-item">
              <IconifyIconOnline icon="ri:time-line" />
              {{ formatTime(script.updateTime) }}
            </span>
          </div>
          <el-tag
            :type="
              script.monitorSysGenScriptStatus === 'ENABLED'
                ? 'success'
                : 'info'
            "
            size="small"
          >
            {{
              script.monitorSysGenScriptStatus === "ENABLED" ? "启用" : "禁用"
            }}
          </el-tag>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="scripts.length === 0 && !loading" class="empty-state">
        <IconifyIconOnline icon="ri:file-text-line" class="empty-icon" />
        <p class="empty-text">暂无脚本</p>
        <el-button type="primary" @click="handleCreate">
          创建第一个脚本
        </el-button>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-bar" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[12, 24, 48, 96]"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="loadScripts"
        @size-change="loadScripts"
      />
    </div>

    <!-- 脚本编辑对话框 -->
    <ScriptEditDialog
      v-model:visible="editDialogVisible"
      :script-data="currentScript"
      @save="handleSaveSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import ScriptEditDialog from "./components/ScriptEditDialog.vue";
import * as ScriptAPI from "@/api/server/script-management";
import type { Script } from "./types";
import { ScriptStatus } from "./types";
import { getScriptTypeIcon } from "./utils";

// 响应式数据
const loading = ref(false);
const searchKeyword = ref("");
const filterType = ref("");
const filterStatus = ref("");
const scripts = ref<Script[]>([]);
const currentScript = ref<Script | null>(null);
const editDialogVisible = ref(false);

// 分页数据
const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0,
});

// 计算属性
const enabledCount = computed(() => {
  return scripts.value.filter((s) => s.monitorSysGenScriptStatus === "ENABLED")
    .length;
});

// 初始化
onMounted(() => {
  loadScripts();
});

// 加载脚本列表
const loadScripts = async () => {
  try {
    loading.value = true;
    // 转换状态值：前端用 ENABLED/DISABLED，后端用 1/0
    let statusValue: number | undefined;
    if (filterStatus.value === "ENABLED") {
      statusValue = 1;
    } else if (filterStatus.value === "DISABLED") {
      statusValue = 0;
    }

    const response: any = await ScriptAPI.getScriptPage({
      page: pagination.page,
      pageSize: pagination.pageSize,
      scriptName: searchKeyword.value || undefined,
      scriptType: filterType.value?.toLowerCase() || undefined,
      scriptStatus: statusValue,
    });

    if (response.success) {
      // 转换后端返回的状态值为前端格式
      scripts.value = (response.data.records || []).map((item: any) => ({
        ...item,
        monitorSysGenScriptStatus:
          item.monitorSysGenScriptStatus?.code === 1 ||
          item.monitorSysGenScriptStatus === "ENABLED" ||
          item.monitorSysGenScriptStatus === 1
            ? "ENABLED"
            : "DISABLED",
      }));
      pagination.total = response.data.total;
    } else {
      message(response.msg || "加载脚本列表失败", { type: "error" });
    }
  } catch (error) {
    console.error("加载脚本列表失败:", error);
    message("加载脚本列表失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};

// 搜索
let searchTimer: NodeJS.Timeout;
const handleSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    pagination.page = 1;
    loadScripts();
  }, 300);
};

// 筛选
const handleFilter = () => {
  pagination.page = 1;
  loadScripts();
};

// 刷新
const handleRefresh = () => {
  loadScripts();
  message("刷新成功", { type: "success" });
};

// 创建脚本
const handleCreate = () => {
  currentScript.value = null;
  editDialogVisible.value = true;
};

// 编辑脚本
const handleEdit = (script: Script) => {
  currentScript.value = script;
  editDialogVisible.value = true;
};

// 状态切换
const handleStatusChange = async (script: Script) => {
  try {
    // 转换状态值：前端用 ENABLED/DISABLED，后端用 1/0
    const statusValue = script.monitorSysGenScriptStatus === ScriptStatus.ENABLED ? 1 : 0;
    const response: any = await ScriptAPI.updateScriptStatus(
      script.monitorSysGenScriptId!,
      statusValue
    );
    if (response.success) {
      message("状态更新成功", { type: "success" });
    } else {
      message("状态更新失败", { type: "error" });
      // 回滚状态
      script.monitorSysGenScriptStatus =
        script.monitorSysGenScriptStatus === ScriptStatus.ENABLED
          ? ScriptStatus.DISABLED
          : ScriptStatus.ENABLED;
    }
  } catch (error) {
    message("状态更新失败", { type: "error" });
    script.monitorSysGenScriptStatus =
      script.monitorSysGenScriptStatus === ScriptStatus.ENABLED
        ? ScriptStatus.DISABLED
        : ScriptStatus.ENABLED;
  }
};

// 操作菜单
const handleAction = async (command: string, script: Script) => {
  switch (command) {
    case "edit":
      handleEdit(script);
      break;
    case "copy":
      await handleCopy(script);
      break;
    case "delete":
      await handleDelete(script);
      break;
  }
};

// 复制脚本
const handleCopy = async (script: Script) => {
  try {
    const response: any = await ScriptAPI.copyScript(
      script.monitorSysGenScriptId!,
      `${script.monitorSysGenScriptName}_副本`
    );
    if (response.success) {
      message("脚本复制成功", { type: "success" });
      loadScripts();
    } else {
      message("脚本复制失败", { type: "error" });
    }
  } catch (error) {
    message("脚本复制失败", { type: "error" });
  }
};

// 删除脚本
const handleDelete = async (script: Script) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除脚本 "${script.monitorSysGenScriptName}" 吗？`,
      "删除确认",
      {
        type: "warning",
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      }
    );

    const response: any = await ScriptAPI.deleteScript(
      script.monitorSysGenScriptId!
    );
    if (response.success) {
      message("脚本删除成功", { type: "success" });
      loadScripts();
    } else {
      message("脚本删除失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("脚本删除失败", { type: "error" });
    }
  }
};

// 保存成功回调
const handleSaveSuccess = () => {
  editDialogVisible.value = false;
  loadScripts();
  message("脚本保存成功", { type: "success" });
};

// 格式化时间
const formatTime = (time: string | undefined) => {
  if (!time) return "未知";
  return new Date(time).toLocaleString("zh-CN");
};
</script>

<style scoped lang="scss">
@import "./styles/variables.scss";
@import "./styles/mixins.scss";

.simple-script-management {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: $bg-secondary;
  padding: $spacing-2xl;
  gap: $spacing-2xl;
}

// 头部工具栏
.header-toolbar {
  @include flex-between;
  background: $bg-primary;
  padding: $spacing-2xl;
  border-radius: $radius-xl;
  box-shadow: $shadow-card;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: $spacing-2xl;

    .page-title {
      @include flex-align-center;
      gap: $spacing-md;
      margin: 0;
      font-size: $font-size-2xl;
      font-weight: $font-weight-bold;
      color: $text-primary;

      .iconify {
        font-size: 28px;
        color: $primary-color;
      }
    }

    .toolbar-stats {
      display: flex;
      gap: $spacing-xl;

      .stat-item {
        @include flex-align-center;
        gap: $spacing-sm;
        font-size: $font-size-base;
        color: $text-secondary;

        .iconify {
          color: $primary-color;
        }
      }
    }
  }

  .toolbar-right {
    .el-button {
      @include button-primary;
    }
  }
}

// 筛选栏
.filter-bar {
  display: flex;
  gap: $spacing-md;
  background: $bg-primary;
  padding: $spacing-xl;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;

  .search-input {
    flex: 1;
    max-width: 400px;
  }

  .filter-select {
    width: 150px;
  }
}

// 脚本列表
.script-list {
  flex: 1;
  min-height: 400px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: $spacing-xl;
  align-content: start;
  @include scrollbar;

  .script-card {
    @include card;
    cursor: pointer;
    padding: $spacing-xl;

    .card-header {
      display: flex;
      gap: $spacing-md;
      margin-bottom: $spacing-lg;

      .script-icon {
        @include flex-center;
        width: 48px;
        height: 48px;
        border-radius: $radius-lg;
        background: $primary-gradient;
        color: white;
        font-size: 24px;
        flex-shrink: 0;
      }

      .script-info {
        flex: 1;
        min-width: 0;

        .script-name {
          @include text-ellipsis;
          margin: 0 0 $spacing-xs 0;
          font-size: $font-size-lg;
          font-weight: $font-weight-semibold;
          color: $text-primary;
        }

        .script-description {
          @include text-ellipsis-multiline(2);
          margin: 0;
          font-size: $font-size-sm;
          color: $text-secondary;
          line-height: $line-height-relaxed;
        }
      }

      .card-actions {
        display: flex;
        align-items: flex-start;
        gap: $spacing-sm;
        flex-shrink: 0;

        .more-btn {
          padding: $spacing-sm;
          color: $text-secondary;

          &:hover {
            color: $primary-color;
          }
        }
      }
    }

    .card-footer {
      @include flex-between;
      padding-top: $spacing-md;
      border-top: 1px solid $border-light;

      .meta-info {
        display: flex;
        gap: $spacing-lg;

        .meta-item {
          @include flex-align-center;
          gap: $spacing-xs;
          font-size: $font-size-xs;
          color: $text-tertiary;

          .iconify {
            font-size: 14px;
          }
        }
      }
    }
  }

  .empty-state {
    grid-column: 1 / -1;
    @include flex-center;
    flex-direction: column;
    min-height: 400px;
    padding: $spacing-4xl;
    background: $bg-primary;
    border-radius: $radius-xl;
    box-shadow: $shadow-sm;

    .empty-icon {
      font-size: 80px;
      color: $text-tertiary;
      margin-bottom: $spacing-xl;
      opacity: 0.5;
    }

    .empty-text {
      font-size: $font-size-lg;
      color: $text-secondary;
      margin: 0 0 $spacing-xl 0;
    }
  }
}

// 分页栏
.pagination-bar {
  @include flex-center;
  background: $bg-primary;
  padding: $spacing-xl;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
}

// 响应式
@include md-down {
  .simple-script-management {
    padding: $spacing-lg;
  }

  .header-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: $spacing-lg;

    .toolbar-left {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .filter-bar {
    flex-wrap: wrap;

    .search-input {
      flex: 1 1 100%;
      max-width: none;
    }

    .filter-select {
      flex: 1;
    }
  }

  .script-list {
    grid-template-columns: 1fr;
  }
}
</style>
