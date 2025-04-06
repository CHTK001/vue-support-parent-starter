<template>
  <div class="scripts-container">
    <div class="scripts-header">
      <div class="left-controls">
        <el-button type="primary" class="add-button" @click="openCreateDialog">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加脚本
        </el-button>
        <el-radio-group v-model="viewMode" size="small" class="view-mode-toggle">
          <el-radio-button label="table">
            <IconifyIconOnline icon="ri:table-line" />
          </el-radio-button>
          <el-radio-button label="card">
            <IconifyIconOnline icon="ri:layout-grid-line" />
          </el-radio-button>
        </el-radio-group>
      </div>
      <el-input v-model="searchKeyword" placeholder="搜索脚本名称/描述" prefix-icon="Search" clearable style="width: 220px" class="search-box" />
    </div>

    <div class="main-content">
      <div class="scripts-content" :class="{ 'with-logs': showLogs }">
        <!-- 表格视图 -->
        <el-table
          v-if="viewMode === 'table'"
          v-loading="loading"
          :data="filteredScripts"
          border
          stripe
          style="width: 100%"
          class="script-table"
          :header-cell-style="{
            background: 'var(--el-fill-color-light)',
            color: 'var(--el-text-color-primary)',
            fontWeight: '600',
            fontSize: '14px'
          }"
          :cell-style="{
            fontSize: '14px'
          }"
          @row-click="openScriptContent"
        >
          <el-table-column prop="maintenanceScriptName" label="脚本名称" min-width="150">
            <template #default="{ row }">
              <div class="script-name">
                <IconifyIconOnline icon="ri:file-code-line" class="script-icon" />
                <span>{{ row.maintenanceScriptName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="maintenanceScriptDesc" label="描述" min-width="200">
            <template #default="{ row }">
              {{ row.maintenanceScriptDesc || "暂无描述" }}
            </template>
          </el-table-column>
          <el-table-column prop="maintenanceScriptPath" label="路径" min-width="200">
            <template #default="{ row }">
              <div class="script-path">
                <IconifyIconOnline icon="ri:folder-line" class="folder-icon" />
                <span>{{ row.maintenanceScriptPath || "/" }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="maintenanceScriptStatus" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.maintenanceScriptStatus ? 'success' : 'danger'" size="small" class="status-tag" :effect="row.maintenanceScriptStatus ? 'light' : 'plain'">
                {{ row.maintenanceScriptStatus ? "启用" : "禁用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons z-[20]">
                <el-button type="primary" size="small" class="view-btn" @click.stop="openScriptContent(row)">
                  <IconifyIconOnline icon="ri:eye-line" />
                </el-button>
                <el-button type="success" size="small" class="sync-btn" @click.stop="syncScript(row)">
                  <IconifyIconOnline icon="ri:refresh-line" />
                </el-button>
                <el-button type="primary" size="small" class="run-btn" @click.stop="runScript(row)">
                  <IconifyIconOnline icon="ri:play-line" />
                </el-button>
                <el-dropdown @command="command => handleCommand(command, row)" @click.stop>
                  <el-button size="small" class="more-btn">
                    <IconifyIconOnline icon="ri:more-line" />
                    更多
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">
                        <IconifyIconOnline icon="ri:edit-line" />
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="run">
                        <IconifyIconOnline icon="ri:play-line" />
                        运行
                      </el-dropdown-item>
                      <el-dropdown-item command="status">
                        <IconifyIconOnline :icon="row.maintenanceScriptStatus ? 'ri:forbid-line' : 'ri:check-line'" />
                        {{ row.maintenanceScriptStatus ? "禁用" : "启用" }}
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <IconifyIconOnline icon="ri:delete-bin-line" class="text-danger" />
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <!-- 卡片视图 -->
        <div v-else class="script-cards">
          <el-card v-for="script in filteredScripts" :key="script.maintenanceScriptId" class="script-card" shadow="hover" @click="openScriptContent(script)">
            <div class="card-header">
              <IconifyIconOnline icon="ri:file-code-line" class="script-icon" />
              <div class="script-name">{{ script.maintenanceScriptName }}</div>
              <el-tag :type="script.maintenanceScriptStatus ? 'success' : 'danger'" size="small" class="status-tag">
                {{ script.maintenanceScriptStatus ? "启用" : "禁用" }}
              </el-tag>
            </div>
            <div class="card-content">
              <div class="script-desc">{{ script.maintenanceScriptDesc || "暂无描述" }}</div>
              <div class="script-path">
                <IconifyIconOnline icon="ri:folder-line" class="folder-icon" />
                <span>{{ script.maintenanceScriptPath || "/" }}</span>
              </div>
            </div>
            <div class="card-actions">
              <el-button type="primary" size="small" circle title="查看脚本" @click.stop="openScriptContent(script)">
                <IconifyIconOnline icon="ri:eye-line" />
              </el-button>
              <el-button type="success" size="small" circle title="同步脚本" @click.stop="syncScript(script)">
                <IconifyIconOnline icon="ri:refresh-line" />
              </el-button>
              <el-button type="primary" size="small" circle title="运行脚本" @click.stop="runScript(script)">
                <IconifyIconOnline icon="ri:play-line" />
              </el-button>
              <el-dropdown trigger="click" @command="command => handleCommand(command, script)">
                <el-button size="small" circle>
                  <IconifyIconOnline icon="ri:more-line" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <IconifyIconOnline icon="ri:edit-line" />
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="status">
                      <IconifyIconOnline :icon="script.maintenanceScriptStatus ? 'ri:forbid-line' : 'ri:check-line'" />
                      {{ script.maintenanceScriptStatus ? "禁用" : "启用" }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <IconifyIconOnline icon="ri:delete-bin-line" class="text-danger" />
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </el-card>
        </div>

        <!-- 空状态展示 -->
        <el-empty v-if="filteredScripts.length === 0" description="暂无脚本" :image-size="180" class="empty-data" />
      </div>

      <!-- 实时日志区域 -->
      <div v-if="showLogs" class="logs-panel">
        <div class="panel-header">
          <div class="title">
            <IconifyIconOnline icon="ri:terminal-box-line" class="mr-1" />
            实时日志
          </div>
          <div class="actions">
            <el-button type="primary" link size="small" @click="toggleLogs">
              <IconifyIconOnline icon="ri:close-line" class="mr-1" />
              关闭
            </el-button>
          </div>
        </div>
        <real-time-log-monitor :channel="logChannel" class="log-monitor" />
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="tools-bar">
      <el-button type="primary" plain size="small" @click="refreshScripts">
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </el-button>
    </div>

    <!-- 使用对话框组件 -->
    <script-form-dialog ref="scriptFormDialogRef" @submit="handleScriptSubmit" />
    <script-view-dialog ref="scriptViewDialogRef" />
  </div>
</template>

<script setup>
import { ref, inject, computed, onMounted, onBeforeUnmount, watch, defineAsyncComponent } from "vue";
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { fetchMaintenanceScripts, createMaintenanceScript, updateMaintenanceScript, deleteMaintenanceScript, syncMaintenanceScript, executeMaintenanceScript } from "@/api/monitor/maintenance";

// 异步加载组件
const ScriptExecutionLogDialog = defineAsyncComponent(() => import("./dialogs/ScriptExecutionLogDialog.vue"));
const ScriptFormDialog = defineAsyncComponent(() => import("./dialogs/ScriptFormDialog.vue"));
const ScriptViewDialog = defineAsyncComponent(() => import("./dialogs/ScriptViewDialog.vue"));
const RealTimeLogMonitor = defineAsyncComponent(() => import("./RealTimeLogMonitor.vue"));

// 定义props
const props = defineProps({
  groupId: {
    type: [Number, String],
    required: true
  }
});

// 脚本列表数据
const scriptList = ref([]);
const loading = ref(false);
const searchKeyword = ref("");
const viewMode = ref("table"); // 视图模式: table或card
const showLogs = ref(false); // 是否显示日志面板
const logChannel = computed(() => `script:group:${props.groupId}`);
const socket = ref(null);

// 对话框引用
const scriptFormDialogRef = ref(null);
const scriptViewDialogRef = ref(null);
const scriptExecutionLogDialogRef = ref(null);

// 任务相关
const currentTaskId = ref(null);
const currentScript = ref({});

// 根据关键字过滤脚本列表
const filteredScripts = computed(() => {
  if (!searchKeyword.value) return scriptList.value;

  const keyword = searchKeyword.value.toLowerCase();
  return scriptList.value.filter(
    script =>
      (script.maintenanceScriptName && script.maintenanceScriptName.toLowerCase().includes(keyword)) || (script.maintenanceScriptDesc && script.maintenanceScriptDesc.toLowerCase().includes(keyword))
  );
});

// 获取维护脚本列表
const fetchScripts = () => {
  loading.value = true;
  fetchMaintenanceScripts(props.groupId)
    .then(res => {
      scriptList.value = res.data || [];
      loading.value = false;
    })
    .catch(error => {
      console.error("获取维护脚本列表失败:", error);
      message("获取维护脚本列表失败", { type: "error" });
      loading.value = false;
    });
};

// 打开创建对话框
const openCreateDialog = () => {
  scriptFormDialogRef.value?.openAdd(props.groupId);
};

// 打开编辑对话框
const openEditDialog = script => {
  scriptFormDialogRef.value?.openEdit(script);
};

// 处理脚本表单提交
const handleScriptSubmit = (formData, isCreate) => {
  if (isCreate) {
    createMaintenanceScript(formData)
      .then(() => {
        message("添加脚本成功", { type: "success" });
        fetchScripts();
        scriptFormDialogRef.value.close();
        scriptFormDialogRef.value.submitting = false;
      })
      .catch(error => {
        console.error("添加脚本失败:", error);
        message("添加脚本失败", { type: "error" });
        scriptFormDialogRef.value.submitting = false;
      });
  } else {
    updateMaintenanceScript(formData)
      .then(() => {
        message("更新脚本成功", { type: "success" });
        fetchScripts();
        scriptFormDialogRef.value.close();
        scriptFormDialogRef.value.submitting = false;
      })
      .catch(error => {
        console.error("更新脚本失败:", error);
        message("更新脚本失败", { type: "error" });
        scriptFormDialogRef.value.submitting = false;
      });
  }
};

// 删除脚本
const deleteScript = script => {
  deleteMaintenanceScript(script.maintenanceScriptId)
    .then(() => {
      message("删除脚本成功", { type: "success" });
      fetchScripts();
    })
    .catch(error => {
      console.error("删除脚本失败:", error);
      message("删除脚本失败", { type: "error" });
    });
};

// 更新脚本状态
const updateScriptStatus = script => {
  const newStatus = script.maintenanceScriptStatus === 1 ? 0 : 1;
  const data = { ...script, maintenanceScriptStatus: newStatus };

  updateMaintenanceScript(data)
    .then(() => {
      message(`${newStatus === 1 ? "启用" : "禁用"}脚本成功`, { type: "success" });
      fetchScripts();
    })
    .catch(error => {
      console.error("更新脚本状态失败:", error);
      message("更新脚本状态失败", { type: "error" });
    });
};

// 打开脚本内容查看对话框
const openScriptContent = script => {
  currentScript.value = script;
  scriptViewDialogRef.value?.open(script);
};

// 同步脚本到远程主机
const syncScript = script => {
  currentScript.value = script;

  // 确认同步
  ElMessageBox.confirm(`确认将脚本 "${script.maintenanceScriptName}" 同步到维护组下所有启用的主机吗？`, "同步确认", {
    confirmButtonText: "确认同步",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      message(`正在同步脚本...`, { type: "info" });

      syncMaintenanceScript(script.maintenanceScriptId)
        .then(res => {
          console.log("同步脚本响应：", res);
          message("同步请求已发送，请查看系统消息获取进度", { type: "success" });
          // 可以打开任务监控对话框查看进度
          if (res.data) {
            currentTaskId.value = res.data;
            scriptExecutionLogDialogRef.value?.open(res.data);
          }
          // 显示日志面板
          showLogs.value = true;
        })
        .catch(error => {
          console.error("同步脚本失败:", error);
          message("同步脚本失败", { type: "error" });
        });
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 下拉菜单命令处理
const handleCommand = (command, script) => {
  switch (command) {
    case "edit":
      openEditDialog(script);
      break;
    case "run":
      runScript(script);
      break;
    case "status":
      updateScriptStatus(script);
      break;
    case "delete":
      ElMessageBox.confirm(`确认删除脚本 "${script.maintenanceScriptName}" 吗？删除后将同时从远程主机删除。`, "删除确认", {
        confirmButtonText: "确认删除",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          deleteScript(script);
        })
        .catch(() => {
          // 用户取消删除
        });
      break;
    default:
      break;
  }
};

// 运行脚本
const runScript = script => {
  currentScript.value = script;

  ElMessageBox.confirm(`确认运行脚本 "${script.maintenanceScriptName}" 吗？脚本将在维护组下所有启用的主机上执行。`, "运行确认", {
    confirmButtonText: "确认运行",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      message(`正在准备运行脚本...`, { type: "info" });

      // 准备请求参数
      const params = {
        maintenanceGroupId: script.maintenanceGroupId
      };

      // 调用API执行脚本
      executeMaintenanceScript(script.maintenanceScriptId, params)
        .then(res => {
          console.log("运行脚本响应：", res);
          message("脚本运行请求已发送，请查看系统消息获取进度", { type: "success" });

          // 打开任务监控对话框查看进度
          if (res.data && res.data.taskId) {
            currentTaskId.value = res.data.taskId;
            scriptExecutionLogDialogRef.value?.open(res.data.taskId);
          }

          // 显示日志面板
          showLogs.value = true;
        })
        .catch(error => {
          console.error("运行脚本失败:", error);
          message("运行脚本失败", { type: "error" });
        });
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 切换日志面板显示
const toggleLogs = () => {
  showLogs.value = !showLogs.value;
};

// 初始化Socket连接
const initSocket = () => {
  socket.value = inject("socket");

  if (!socket.value) {
    console.error("Socket实例不存在");
    return;
  }
};

// 在组件挂载时获取脚本列表
onMounted(() => {
  fetchScripts();
  initSocket();
});

// 在组件卸载前清理
onBeforeUnmount(() => {
  // 清理资源
});

// 监听groupId变化重新获取数据
watch(
  () => props.groupId,
  newVal => {
    if (newVal) {
      fetchScripts();
    }
  }
);

// 暴露方法给父组件
defineExpose({
  refreshScripts: fetchScripts
});
</script>

<style lang="scss" scoped>
.scripts-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;

  .scripts-header {
    padding: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--el-border-color-light);
    background: linear-gradient(to right, rgba(var(--el-color-primary-rgb), 0.05), transparent);

    .left-controls {
      display: flex;
      align-items: center;
      gap: 16px;

      .add-button {
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }

      .view-mode-toggle {
        margin-left: 8px;
      }
    }

    .search-box {
      transition: all 0.3s;
      border-radius: 6px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

      &:focus-within {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-2px);
      }
    }
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .scripts-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
    transition: width 0.3s;

    &.with-logs {
      width: 60%;
    }
  }

  .logs-panel {
    width: 40%;
    border-left: 1px solid var(--el-border-color-light);
    display: flex;
    flex-direction: column;
    background-color: var(--el-fill-color-light);

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-light);
      background-color: var(--el-fill-color);

      .title {
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .log-monitor {
      flex: 1;
    }
  }

  .script-table {
    margin-bottom: 16px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }
  }

  .script-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    :deep(.el-card__body) {
      padding: 0;
    }
    .script-card {
      cursor: pointer;
      transition: all 0.3s;
      border-radius: 8px;
      overflow: hidden;
      height: 100%;
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
      }

      .card-header {
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color-light);
        background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-light));
        display: flex;
        align-items: center;
        gap: 10px;

        .script-icon {
          font-size: 24px;
          color: var(--el-color-primary);
        }

        .script-name {
          flex: 1;
          font-weight: 600;
          font-size: 16px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .card-content {
        padding: 16px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;

        .script-desc {
          color: var(--el-text-color-regular);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .script-path {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--el-text-color-secondary);
          font-size: 13px;
          margin-top: auto;

          .folder-icon {
            font-size: 16px;
          }
        }
      }

      .card-actions {
        padding: 12px 16px;
        border-top: 1px solid var(--el-border-color-light);
        background-color: var(--el-fill-color-light);
        display: flex;
        justify-content: space-around;
        gap: 8px;
      }
    }
  }

  .script-name,
  .script-path {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .script-icon,
  .folder-icon {
    font-size: 18px;
    color: var(--el-text-color-secondary);
  }

  .action-buttons {
    display: flex;
    gap: 8px;
  }

  .status-tag {
    min-width: 48px;
    text-align: center;
  }

  .empty-data {
    margin-top: 32px;
  }

  .tools-bar {
    padding: 12px 16px;
    border-top: 1px solid var(--el-border-color-light);
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    background-color: var(--el-fill-color-light);
  }
}

.mr-1 {
  margin-right: 4px;
}

@media (max-width: 768px) {
  .scripts-header {
    flex-direction: column;
    gap: 12px;

    .left-controls,
    .search-box {
      width: 100%;
    }
  }

  .main-content {
    flex-direction: column;

    .scripts-content {
      &.with-logs {
        width: 100%;
        height: 50%;
      }
    }

    .logs-panel {
      width: 100%;
      height: 50%;
      border-left: none;
      border-top: 1px solid var(--el-border-color-light);
    }
  }

  .script-cards {
    grid-template-columns: 1fr;
  }
}
</style>
