<template>
  <div class="gen-container p-2">
    <el-container>
      <el-header>
        <!-- 顶部操作栏 -->
        <div class="gen-header w-full flex items-center justify-between mb-4">
          <div class="gen-header__title text-xl font-medium text-text_color_primary">
            <IconifyIconOnline icon="ri:database-2-line" class="mr-2" />
            数据源管理
          </div>
          <div class="gen-header__actions flex items-center gap-3">
            <el-input v-model="searchParams.searchValue" class="!w-[300px]" placeholder="搜索数据源名称" clearable>
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </el-input>
            <el-button type="info" plain @click="openMonitorConfig">
              <IconifyIconOnline icon="ri:settings-3-line" class="mr-1" />
              监控配置
            </el-button>
            <el-button type="primary" class="gen-btn__add" @click="onSave({}, 'add')">
              <IconifyIconOnline icon="ri:add-line" class="mr-1" />
              新增数据源
            </el-button>
          </div>
        </div>
      </el-header>
      <el-main>
        <!-- 内容区域 -->
        <!-- 列表模式 -->
        <ScTable ref="tableRef" :url="fetchGenDatabasePage" :params="searchParams" class="gen-table" border stripe highlight-current-row :page-size="20">
          <el-table-column label="序号" width="60px" type="index" align="center" />
          <el-table-column label="数据源信息" align="left" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="flex items-center">
                <el-avatar :size="36" :class="getIconBgClass(row)" class="mr-3 flex-shrink-0">
                  <IconifyIconOnline :icon="getIconName(row)" :color="getIconColor(row)" />
                </el-avatar>
                <div class="flex flex-col">
                  <span class="font-medium text-text_color_primary">{{ row.genName }}</span>
                  <span class="text-xs text-text_color_secondary mt-1">
                    {{ getConnectionInfo(row) }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center">
            <template #default="{ row }">
              <el-tag :type="row.genStatus == 0 ? 'danger' : 'success'" :effect="row.genStatus == 0 ? 'light' : 'dark'" class="gen-tag">
                {{ row.genStatus == 0 ? "停用" : "启用" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="支持功能">
            <template #default="{ row }">
              <div class="flex flex-wrap gap-2">
                <el-tag :type="row?.supportBackup != 0 ? 'success' : 'info'" :effect="row?.supportBackup != 0 ? 'light' : 'plain'" class="gen-tag">
                  <IconifyIconOnline icon="ri:save-line" class="mr-1" />
                  增量备份
                </el-tag>
                <el-tag :type="row?.supportAllBackup != 0 ? 'success' : 'info'" :effect="row?.supportAllBackup != 0 ? 'light' : 'plain'" class="gen-tag">
                  <IconifyIconOnline icon="ri:save-line" class="mr-1" />
                  全量备份
                </el-tag>
                <el-tag :type="row?.supportDocument != 0 ? 'success' : 'info'" :effect="row?.supportDocument != 0 ? 'light' : 'plain'" class="gen-tag">
                  <IconifyIconOnline icon="ri:file-text-line" class="mr-1" />
                  文档
                </el-tag>
                <el-tag :type="row?.supportDriver != 0 ? 'success' : 'info'" :effect="row?.supportDriver != 0 ? 'light' : 'plain'" class="gen-tag">
                  <IconifyIconOnline icon="ri:code-box-line" class="mr-1" />
                  驱动
                </el-tag>
                <el-tag v-if="row.isFileDriver" :effect="row?.isFileDriver != 0 ? 'light' : 'plain'" type="info" class="gen-tag">
                  <IconifyIconOnline icon="ri:file-line" class="mr-1" />
                  文件
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" align="center">
            <template #default="{ row }">
              <div class="flex justify-center gap-2">
                <el-tooltip content="管理" placement="top">
                  <el-button type="primary" link @click="handleClickManage(row)">
                    <IconifyIconOnline icon="ep:management" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="全屏管理" placement="top">
                  <el-button type="success" link @click="handleClickFullscreen(row)">
                    <IconifyIconOnline icon="ep:full-screen" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="编辑" placement="top">
                  <el-button type="primary" link @click="handleClickEdit(row)">
                    <IconifyIconOnline icon="ep:edit" />
                  </el-button>
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button type="danger" link @click="handleClickDelete(row)">
                    <IconifyIconOnline icon="ep:delete" />
                  </el-button>
                </el-tooltip>

                <!-- 从卡片模式合并的功能按钮 -->
                <el-tooltip v-if="row.isFileDriver" content="上传数据文件" placement="top">
                  <el-button type="primary" link @click="handleUploadDataFile(row)">
                    <IconifyIconOnline icon="ri:upload-2-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="row.isFileDriver && row.genDatabaseFile" content="清除数据文件" placement="top">
                  <el-button type="warning" link @click="handleClearDataFile(row)">
                    <IconifyIconOnline icon="ri:close-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="row.genJdbcCustomType == 'JDBC'" content="查看代码" placement="top">
                  <el-button type="primary" link @click="handleOpenCode(row)">
                    <IconifyIconOnline icon="humbleicons:code" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="row.supportDocument" content="查看文档" placement="top">
                  <el-button type="primary" link @click="handleOpenDocument(row)">
                    <IconifyIconOnline icon="humbleicons:documents" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="row?.genBackupStatus == 0 && row.supportBackup" content="开启增量备份" placement="top">
                  <el-button type="success" link @click="handleOpenBackup(row)">
                    <IconifyIconOnline icon="ri:lock-unlock-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-else-if="row.supportBackup" content="停止增量备份" placement="top">
                  <el-button type="danger" link @click="handleCloseBackup(row)">
                    <IconifyIconOnline icon="ri:lock-2-line" />
                  </el-button>
                </el-tooltip>
                <el-tooltip v-if="row.supportAllBackup" content="备份设置" placement="top">
                  <el-button type="success" link @click="handleOpenBackupSetting(row)">
                    <IconifyIconOnline icon="ri:settings-2-line" />
                  </el-button>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </ScTable>
      </el-main>
    </el-container>
    <!-- 懒加载组件 -->
    <save v-if="visible.saveVisible" ref="saveRef" @success="handlerSuccess" />
    <Document v-if="visible.documentVisible" ref="documentRef" />
    <Code v-if="visible.codeVisible" ref="codeRef" />
    <File ref="fileRef" @success="handlerSuccess" />
    <Backup ref="backupRef" />
  </div>
</template>

<script setup>
import Document from "./model/document.vue";
import Code from "./layout/jdbc/code/index.vue";
import ScLazy from "@repo/components/ScLazy/index.vue";
import Backup from "./backup.vue";

import { fetchGenDatabaseDelete, fetchGenDatabasePage, fetchGenDatabasUninstall } from "@/api/monitor/gen/database";
import { fetchGenBackupStart, fetchGenBackupStop } from "@/api/monitor/gen/backup";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import Save from "./save.vue";
import { message } from "@repo/utils";
import { router } from "@repo/core";
import { Base64 } from "js-base64";
import { ElMessageBox } from "element-plus";

// 异步加载文件上传组件
const File = defineAsyncComponent(() => import("./plugin/file.vue"));

// 组件引用
const backupRef = ref();
const documentRef = ref();
const codeRef = ref();
const fileRef = ref(null);
const saveRef = ref(null);
const tableRef = ref(null);

// 搜索参数
const searchParams = reactive({
  searchValue: ""
});

// 组件可见性控制
const visible = reactive({
  saveVisible: false,
  documentVisible: false,
  codeVisible: false
});

/**
 * 获取数据源图标名称
 * @param {Object} row - 数据源行数据
 * @returns {String} 图标名称
 */
const getIconName = row => {
  if (row.genJdbcType == "POSTGRES") return "devicon:postgresql";
  if (row.genJdbcType == "H2") return "devicon:hugo";
  if (row.genJdbcType == "UCANACCESS") return "simple-icons:apachecassandra";
  if (row.genJdbcType == "VNC") return "simple-icons:victronenergy";
  if (row.genJdbcType == "CALCITE") return "ri:database-2-line";
  if (row.genJdbcType == "PROMETHEUS") return "devicon:prometheus";
  if (row.genType == "INFLUXDB") return "devicon:influxdb";
  if (row.genType == "ZOOKEEPER") return "devicon:electron";
  if (row.genType == "SHELL") return "devicon:powershell";
  if (row.genType == "VNC") return "devicon:electron";
  if (row.genType == "REDIS") return "devicon:redis";
  if (row.genType == "MQTT") return "simple-icons:mqtt";
  if (row.genType == "MONGODB") return "devicon:mongodb";

  if (!row.genJdbcType) return "devicon:aarch64";

  // 尝试使用小写的数据库类型作为图标名
  const dbType = row.genJdbcType?.toLowerCase() || row.genType?.toLowerCase();
  return `devicon:${dbType}`;
};

/**
 * 获取图标颜色
 * @param {Object} row - 数据源行数据
 * @returns {String} 颜色代码
 */
const getIconColor = row => {
  if (row.genType == "SHELL") return "#00a870";
  return "";
};

/**
 * 获取图标背景样式类
 * @param {Object} row - 数据源行数据
 * @returns {String} 样式类名
 */
const getIconBgClass = row => {
  if (row.genType == "SHELL") return "bg-[#e0f5ed]";
  if (row.genType == "REDIS") return "bg-[#f5e0e0]";
  if (row.genType == "MONGODB") return "bg-[#e0f0f5]";
  return "bg-[#e0ebff]";
};

/**
 * 获取连接信息
 * @param {Object} row - 数据源行数据
 * @returns {String} 格式化的连接信息
 */
const getConnectionInfo = row => {
  if (row.genDatabase) {
    return `数据库: ${row.genDatabase}`;
  } else if (row?.genHost && row?.genPort) {
    if (row.genDriverRemoteUrl && row.genDriverRemoteUrl?.indexOf("null") === -1) {
      return row.genDriverRemoteUrl;
    }
    return `${row.genHost}:${row.genPort}`;
  }
  return "未配置连接信息";
};

// 兼容旧代码的图标获取方法
const getIcon = useRenderIcon;

/**
 * 删除数据源
 * @param {Object} row - 要删除的数据源
 */
const handleClickDelete = async row => {
  try {
    ElMessageBox.confirm(`确定要删除数据源 "${row.genName}" 吗？`, "删除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const res = await fetchGenDatabaseDelete({ id: row.genId });
    tableRef.value.reload(searchParams);
    message(res.msg, { type: "success" });
  } catch (error) {
    // 用户取消删除操作
    console.log("取消删除");
  }
};

/**
 * 操作成功后的回调
 */
const handlerSuccess = async () => {
  tableRef.value.reload(searchParams);
};

/**
 * 上传数据文件
 * @param {Object} row - 数据源行数据
 */
const handleUploadDataFile = async row => {
  fileRef.value.setData(row).open();
};

/**
 * 清除数据文件
 * @param {Object} row - 数据源行数据
 */
const handleClearDataFile = async row => {
  try {
    await ElMessageBox.confirm("确定要清除数据文件吗？", "清除确认", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const res = await fetchGenDatabasUninstall({
      genId: row.genId,
      type: "data"
    });

    if (res.code == "00000") {
      message("清除成功", { type: "success" });
      handlerSuccess();
      return;
    }
    message(res.msg, { type: "error" });
  } catch (error) {
    // 用户取消操作
    console.log("取消清除");
  }
};

/**
 * 打开文档
 * @param {Object} row - 数据源行数据
 */
const handleOpenDocument = async row => {
  visible.documentVisible = true;
  nextTick(() => {
    documentRef.value.setData(row).open();
  });
};

/**
 * 打开代码
 * @param {Object} row - 数据源行数据
 */
const handleOpenCode = async row => {
  visible.codeVisible = true;
  nextTick(() => {
    codeRef.value.setData(row).open();
  });
};

/**
 * 开启备份
 * @param {Object} row - 数据源行数据
 */
const handleOpenBackup = async row => {
  const res = await fetchGenBackupStart(row);
  tableRef.value.reload(searchParams);
  message(res.msg, { type: "success" });
};

/**
 * 关闭备份
 * @param {Object} row - 数据源行数据
 */
const handleCloseBackup = async row => {
  const res = await fetchGenBackupStop(row);
  tableRef.value.reload(searchParams);
  message(res.msg, { type: "success" });
};

/**
 * 打开备份设置
 * @param {Object} row - 数据源行数据
 */
const handleOpenBackupSetting = async row => {
  backupRef.value.setData(row).open();
};

/**
 * 管理数据源
 * @param {Object} row - 数据源行数据
 */
const handleClickManage = row => {
  router.push({
    path: "/database/manage",
    query: {
      data: Base64.encode(JSON.stringify(row))
    }
  });
};

/**
 * 编辑数据源
 * @param {Object} row - 数据源行数据
 */
const handleClickEdit = async row => {
  onSave(row, "edit");
};

/**
 * 打开保存/编辑对话框
 * @param {Object} row - 数据源行数据
 * @param {String} mode - 模式：add/edit
 */
const onSave = async (row, mode) => {
  visible.saveVisible = true;
  nextTick(() => {
    saveRef.value.setData(row).open(mode);
  });
};

/**
 * 处理点击全屏管理按钮
 * @param {Object} row - 数据源行数据
 */
const handleClickFullscreen = row => {
  router.push({
    path: "/database/fullscreen",
    query: {
      data: Base64.encode(JSON.stringify(row))
    }
  });
};

/**
 * 打开监控配置页面
 */
const openMonitorConfig = () => {
  router.push({
    path: "/monitor/config"
  });
};
</script>

<style scoped lang="scss">
.gen-container {
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color);
}

.gen-header {
  &__title {
    display: flex;
    align-items: center;
  }
}

.gen-content {
  flex: 1;
  overflow: hidden;
}

.gen-table {
  height: 100%;

  :deep(.el-table__row) {
    transition: transform 0.2s;

    &:hover {
      background-color: var(--el-color-primary-light-9) !important;
    }
  }
}

.gen-tag {
  display: inline-flex;
  align-items: center;
}
</style>
