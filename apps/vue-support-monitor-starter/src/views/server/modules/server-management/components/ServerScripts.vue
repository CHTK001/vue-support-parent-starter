<template>
  <div class="server-scripts">
    <!-- 工具�?-->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-button type="primary" @click="$emit('create')">
          <IconifyIconOnline icon="ep:plus" class="mr-1" />
          新建脚本
        </el-button>

        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </el-button>

        <el-button @click="handleImport">
          <IconifyIconOnline icon="ri:upload-line" class="mr-1" />
          导入脚本
        </el-button>
      </div>

      <div class="toolbar-right">
        <el-select
          v-model="filterType"
          placeholder="脚本类型"
          clearable
          style="width: 120px"
          @change="handleFilter"
        >
          <el-option label="Shell" value="SHELL" />
          <el-option label="Python" value="PYTHON" />
          <el-option label="PowerShell" value="POWERSHELL" />
          <el-option label="Batch" value="BATCH" />
          <el-option label="JavaScript" value="JAVASCRIPT" />
        </el-select>

        <el-select
          v-model="filterCategory"
          placeholder="分类"
          clearable
          style="width: 120px; margin-left: 12px"
          @change="handleFilter"
        >
          <el-option label="系统管理" value="system" />
          <el-option label="监控检�? value="monitor" />
          <el-option label="部署脚本" value="deploy" />
          <el-option label="备份脚本" value="backup" />
          <el-option label="其他" value="other" />
        </el-select>

        <el-input
          v-model="searchKeyword"
          placeholder="搜索脚本名称..."
          clearable
          style="width: 200px; margin-left: 12px"
          @input="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
      </div>
    </div>

    <!-- 脚本表格 -->
    <el-table
      v-loading="loading"
      :data="scriptList"
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />

      <el-table-column label="脚本信息" min-width="200">
        <template #default="{ row }">
          <div class="script-info">
            <div class="script-name">
              <IconifyIconOnline
                :icon="getScriptIcon(row.monitorSysGenServerScriptType)"
                class="script-icon"
              />
              {{ row.monitorSysGenServerScriptName }}
            </div>
            <div class="script-desc">
              {{ row.monitorSysGenServerScriptDescription || "无描�? }}
            </div>
            <div v-if="row.monitorSysGenServerScriptTags" class="script-tags">
              <el-tag
                v-for="tag in getTagList(row.monitorSysGenServerScriptTags)"
                :key="tag"
                size="small"
                type="info"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="脚本类型" width="100" align="center">
        <template #default="{ row }">
          <el-tag
            :type="getScriptTypeColor(row.monitorSysGenServerScriptType)"
            size="small"
          >
            {{ row.monitorSysGenServerScriptType }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="分类" width="100" align="center">
        <template #default="{ row }">
          <span>{{ row.monitorSysGenServerScriptCategory || "-" }}</span>
        </template>
      </el-table-column>

      <el-table-column label="版本" width="80" align="center">
        <template #default="{ row }">
          <span>{{ row.monitorSysGenServerScriptVersion || "v1.0" }}</span>
        </template>
      </el-table-column>

      <el-table-column label="状�? width="80" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.monitorSysGenServerScriptStatus"
            :active-value="1"
            :inactive-value="0"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>

      <el-table-column label="执行统计" width="120" align="center">
        <template #default="{ row }">
          <div class="execution-stats">
            <div>
              总计: {{ row.monitorSysGenServerScriptExecutionCount || 0 }}
            </div>
            <div>
              成功: {{ row.monitorSysGenServerScriptSuccessCount || 0 }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="最后执�? width="160" align="center">
        <template #default="{ row }">
          <span v-if="row.monitorSysGenServerScriptLastExecutionTime">
            {{ formatDateTime(row.monitorSysGenServerScriptLastExecutionTime) }}
          </span>
          <span v-else class="text-muted">从未执行</span>
        </template>
      </el-table-column>

      <el-table-column label="创建�? width="100" align="center">
        <template #default="{ row }">
          {{ row.monitorSysGenServerScriptCreateUser }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="280" align="center" fixed="right">
        <template #default="{ row }">
          <el-button-group>
            <el-button
              size="small"
              type="primary"
              @click="$emit('execute', row)"
            >
              <IconifyIconOnline icon="ri:play-line" />
              执行
            </el-button>

            <el-button size="small" @click="$emit('edit', row)">
              <IconifyIconOnline icon="ri:edit-line" />
              编辑
            </el-button>

            <el-dropdown @command="(cmd) => handleAction(cmd, row)">
              <el-button size="small">
                <IconifyIconOnline icon="ri:more-line" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="view">查看代码</el-dropdown-item>
                  <el-dropdown-item command="duplicate"
                    >复制脚本</el-dropdown-item
                  >
                  <el-dropdown-item command="history"
                    >执行历史</el-dropdown-item
                  >
                  <el-dropdown-item command="export">导出脚本</el-dropdown-item>
                  <el-dropdown-item command="validate"
                    >语法检�?/el-dropdown-item
                  >
                  <el-dropdown-item command="delete" divided
                    >删除</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 脚本代码查看对话�?-->
    <el-dialog
      v-model="codeDialogVisible"
      title="脚本代码"
      width="80%"
      destroy-on-close
    >
      <div v-if="selectedScript" class="script-code">
        <div class="code-header">
          <el-descriptions :column="3" size="small">
            <el-descriptions-item label="脚本名称">
              {{ selectedScript.monitorSysGenScriptName }}
            </el-descriptions-item>
            <el-descriptions-item label="脚本类型">
              {{ selectedScript.monitorSysGenScriptType }}
            </el-descriptions-item>
            <el-descriptions-item label="版本">
              {{ selectedScript.monitorSysGenScriptVersion }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="code-content">
          <pre><code>{{ selectedScript.monitorSysGenScriptContent }}</code></pre>
        </div>
      </div>
    </el-dialog>

    <!-- 文件上传对话�?-->
    <el-dialog
      v-model="importDialogVisible"
      title="导入脚本"
      width="500px"
      destroy-on-close
    >
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :limit="1"
        accept=".sh,.py,.ps1,.bat,.js"
        drag
      >
        <IconifyIconOnline icon="ep:upload-filled" class="upload-icon" />
        <div class="upload-text">将脚本文件拖到此处，�?em>点击上传</em></div>
        <template #tip>
          <div class="upload-tip">
            支持 .sh, .py, .ps1, .bat, .js 格式的脚本文�?
          </div>
        </template>
      </el-upload>

      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUploadScript"
          >确定导入</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import {
  getServerScriptPageList,
  updateServerScript,
  deleteServerScript,
  duplicateServerScript,
  validateScript,
  exportScript,
  importScript,
  type ServerScript,
  SCRIPT_TYPE,
} from "@/api/server/script";

// 定义事件
const emit = defineEmits<{
  create: [];
  edit: [script: ServerScript];
  execute: [script: ServerScript];
  delete: [script: ServerScript];
}>();

// 响应式状�?
const loading = ref(false);
const scriptList = ref<ServerScript[]>([]);
const selectedScripts = ref<ServerScript[]>([]);

// 搜索和筛�?
const searchKeyword = ref("");
const filterType = ref("");
const filterCategory = ref("");

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
});

// 对话�?
const codeDialogVisible = ref(false);
const importDialogVisible = ref(false);
const selectedScript = ref<ServerScript | null>(null);
const uploadRef = ref();

/**
 * 加载脚本列表
 */
const loadScriptList = async () => {
  try {
    loading.value = true;
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      monitorSysGenScriptName: searchKeyword.value || undefined,
      monitorSysGenScriptType: filterType.value || undefined,
      monitorSysGenScriptCategory: filterCategory.value || undefined,
    };

    const res = await getServerScriptPageList(params);
    if (res.code === "00000") {
      scriptList.value = res.data.records || [];
      pagination.total = res.data.total || 0;
    }
  } catch (error) {
    console.error("加载脚本列表失败:", error);
    message.error("加载脚本列表失败");
  } finally {
    loading.value = false;
  }
};

/**
 * 获取脚本图标
 */
const getScriptIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    SHELL: "ri:terminal-line",
    PYTHON: "ri:file-code-line",
    POWERSHELL: "ri:windows-line",
    BATCH: "ri:file-text-line",
    JAVASCRIPT: "ri:javascript-line",
  };
  return iconMap[type] || "ri:file-code-line";
};

/**
 * 获取脚本类型颜色
 */
const getScriptTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    SHELL: "primary",
    PYTHON: "success",
    POWERSHELL: "warning",
    BATCH: "info",
    JAVASCRIPT: "danger",
  };
  return colorMap[type] || "info";
};

/**
 * 获取标签列表
 */
const getTagList = (tags: string) => {
  return tags ? tags.split(",").filter((tag) => tag.trim()) : [];
};

/**
 * 格式化日期时�?
 */
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString();
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  pagination.page = 1;
  loadScriptList();
};

/**
 * 处理筛�?
 */
const handleFilter = () => {
  pagination.page = 1;
  loadScriptList();
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadScriptList();
};

/**
 * 处理导入
 */
const handleImport = () => {
  importDialogVisible.value = true;
};

/**
 * 处理选择变化
 */
const handleSelectionChange = (selection: ServerScript[]) => {
  selectedScripts.value = selection;
};

/**
 * 处理状态变�?
 */
const handleStatusChange = async (script: ServerScript) => {
  try {
    await updateServerScript({
      monitorSysGenServerScriptId: script.monitorSysGenServerScriptId,
      monitorSysGenServerScriptStatus: script.monitorSysGenServerScriptStatus,
    } as any);
    message.success("状态更新成�?);
  } catch (error) {
    console.error("状态更新失�?", error);
    message.error("状态更新失�?);
    // 回滚状�?
    script.monitorSysGenServerScriptStatus =
      script.monitorSysGenServerScriptStatus === 1 ? 0 : 1;
  }
};

/**
 * 处理操作
 */
const handleAction = async (command: string, script: ServerScript) => {
  switch (command) {
    case "view":
      selectedScript.value = script;
      codeDialogVisible.value = true;
      break;
    case "duplicate":
      await handleDuplicateScript(script);
      break;
    case "history":
      // 查看执行历史逻辑
      break;
    case "export":
      await handleExportScript(script);
      break;
    case "validate":
      await handleValidateScript(script);
      break;
    case "delete":
      await handleDeleteScript(script);
      break;
  }
};

/**
 * 处理复制脚本
 */
const handleDuplicateScript = async (script: ServerScript) => {
  try {
    const res = await duplicateServerScript(script.monitorSysGenServerScriptId);
    if (res.code === "00000") {
      message.success("脚本复制成功");
      loadScriptList();
    } else {
      message.error(`复制失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("复制脚本失败:", error);
    message.error("复制脚本失败");
  }
};

/**
 * 处理导出脚本
 */
const handleExportScript = async (script: ServerScript) => {
  try {
    const res = await exportScript(script.monitorSysGenServerScriptId);
    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${script.monitorSysGenServerScriptName}.${script.monitorSysGenServerScriptType.toLowerCase()}`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.success("脚本导出成功");
  } catch (error) {
    console.error("导出脚本失败:", error);
    message.error("导出脚本失败");
  }
};

/**
 * 处理验证脚本
 */
const handleValidateScript = async (script: ServerScript) => {
  try {
    const res = await validateScript(
      script.monitorSysGenServerScriptContent,
      script.monitorSysGenServerScriptType
    );
    if (res.code === "00000") {
      message.success("脚本语法检查通过");
    } else {
      message.error(`语法检查失�? ${res.msg}`);
    }
  } catch (error) {
    console.error("验证脚本失败:", error);
    message.error("验证脚本失败");
  }
};

/**
 * 处理删除脚本
 */
const handleDeleteScript = async (script: ServerScript) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除脚�?"${script.monitorSysGenServerScriptName}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const res = await deleteServerScript(script.monitorSysGenServerScriptId);
    if (res.code === "00000") {
      message.success("删除成功");
      loadScriptList();
      emit("delete", script);
    } else {
      message.error(`删除失败: ${res.msg}`);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除脚本失败:", error);
      message.error("删除脚本失败");
    }
  }
};

/**
 * 处理上传脚本
 */
const handleUploadScript = async () => {
  const files = uploadRef.value?.uploadFiles;
  if (!files || files.length === 0) {
    message.warning("请选择要上传的脚本文件");
    return;
  }

  try {
    const file = files[0].raw;
    const res = await importScript(file);
    if (res.code === "00000") {
      message.success("脚本导入成功");
      importDialogVisible.value = false;
      loadScriptList();
    } else {
      message.error(`导入失败: ${res.msg}`);
    }
  } catch (error) {
    console.error("导入脚本失败:", error);
    message.error("导入脚本失败");
  }
};

/**
 * 处理页面大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  loadScriptList();
};

/**
 * 处理当前页变�?
 */
const handleCurrentChange = (page: number) => {
  pagination.page = page;
  loadScriptList();
};

/**
 * 刷新列表
 */
const refresh = () => {
  loadScriptList();
};

// 暴露方法
defineExpose({
  refresh,
});

// 生命周期
onMounted(() => {
  loadScriptList();
});
</script>

<style scoped lang="scss">
.server-scripts {
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
    }
  }

  .script-info {
    .script-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      margin-bottom: 4px;

      .script-icon {
        margin-right: 6px;
        color: #409eff;
      }
    }

    .script-desc {
      font-size: 12px;
       color: var(--el-text-color);
      margin-bottom: 4px;
    }

    .script-tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }
  }

  .execution-stats {
    font-size: 12px;
    line-height: 1.4;
  }

  .text-muted {
    color: #c0c4cc;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .script-code {
    .code-header {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e4e7ed;
    }

    .code-content {
      background: var(--el-bg-color-overlay);
      border-radius: 4px;
      padding: 16px;
      max-height: 400px;
      overflow-y: auto;

      pre {
        margin: 0;
        font-family: "Courier New", monospace;
        font-size: 13px;
        line-height: 1.5;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
  }

  .upload-icon {
    font-size: 67px;
    color: #c0c4cc;
    margin: 40px 0 16px;
  }

  .upload-text {
    color: #606266;
    font-size: 14px;
    text-align: center;

    em {
      color: #409eff;
      font-style: normal;
    }
  }

  .upload-tip {
     color: var(--el-text-color);
    font-size: 12px;
    text-align: center;
    margin-top: 8px;
  }
}
</style>
