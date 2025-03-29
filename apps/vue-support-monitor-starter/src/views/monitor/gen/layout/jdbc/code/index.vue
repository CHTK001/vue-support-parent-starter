<template>
  <div class="code-container">
    <!-- 主对话框 -->
    <el-dialog v-model="visible" draggable title="代码编辑器" width="80%" top="10px" direction="rtl" show-close class="code-dialog" :before-close="onClose">
      <el-container class="code-layout h-full">
        <!-- 工具栏 -->
        <el-header class="code-header">
          <div class="code-header__left">
            <el-button type="primary" class="code-header__btn" @click="importColumn">
              <IconifyIconOnline icon="ri:import-line" class="mr-1" />
              <span>导入</span>
            </el-button>
            <el-button plain type="primary" class="code-header__btn" @click="openGen(null, false)">
              <IconifyIconOnline icon="ep:download" class="mr-1" />
              <span>生成</span>
            </el-button>
            <el-button class="code-header__btn" @click="openTemplate">
              <IconifyIconOnline icon="devicon:veevalidate" class="mr-1" />
              <span>模板</span>
            </el-button>
            <el-button type="danger" class="code-header__btn" @click="batchDelete">
              <IconifyIconOnline icon="ep:delete" class="mr-1" />
              <span>删除</span>
            </el-button>
          </div>
          <div class="code-header__right">
            <div class="code-header__search">
              <el-input v-model="form.keyword" placeholder="请输入表名搜索" clearable class="code-header__input">
                <template #prefix>
                  <IconifyIconOnline icon="ep:search" />
                </template>
              </el-input>
              <el-button type="primary" class="code-header__search-btn" @click="refresh">
                <IconifyIconOnline icon="ep:search" />
              </el-button>
            </div>
          </div>
        </el-header>

        <!-- 主内容区域 -->
        <el-main class="code-main !min-h-[600px]">
          <div class="code-table-wrapper h-full !min-h-[600px]">
            <ScTable ref="table1" :params="form" :border="true" :url="fetchGenTablePage" row-key="id" height="600px" stripe class="code-table" @selection-change="selectionChange">
              <el-table-column type="selection" width="50" />
              <el-table-column label="#" type="index" width="50" />
              <el-table-column label="表名" prop="tabName" width="200" />
              <el-table-column label="实体" prop="tabClassName" />
              <el-table-column label="业务名" prop="tabBusinessName" />
              <el-table-column label="模块名" prop="tabModuleName" />
              <el-table-column label="描述" prop="tabDesc" />
              <el-table-column label="备注" prop="tabRemark" />
              <el-table-column label="操作" fixed="right" width="370">
                <template #default="scope">
                  <div class="code-table__actions">
                    <el-button text type="primary" size="small" class="code-table__action-btn" @click="openView(scope.row, false)">
                      <IconifyIconOnline icon="ep:view" class="mr-1" />
                      <span>预览</span>
                    </el-button>
                    <el-button text type="primary" size="small" class="code-table__action-btn" @click="openEdit(scope.row, false)">
                      <IconifyIconOnline icon="ep:edit" class="mr-1" />
                      <span>编辑</span>
                    </el-button>
                    <el-popconfirm v-if="scope.row.genType !== 'SYSTEM'" :title="$t('message.confimDelete')" @confirm="table_del(scope.row, scope.$index)">
                      <template #reference>
                        <el-button text type="primary" size="small" class="code-table__action-btn">
                          <IconifyIconOnline icon="ep:delete" class="mr-1" />
                          <span>删除</span>
                        </el-button>
                      </template>
                    </el-popconfirm>
                    <el-button text type="primary" size="small" :loading="syncLoading[scope.row.tabId]" class="code-table__action-btn" @click="openSync(scope.row, false)">
                      <IconifyIconOnline icon="ep:refresh" class="mr-1" />
                      <span>同步</span>
                    </el-button>
                    <el-button text type="primary" size="small" class="code-table__action-btn" @click="openGen(scope.row, false)">
                      <IconifyIconOnline icon="ep:office-building" class="mr-1" />
                      <span>生成代码</span>
                    </el-button>
                    <el-button text type="primary" size="small" class="code-table__action-btn" @click="openDownFile(scope.row)">
                      <IconifyIconOnline icon="ep:download" class="mr-1" />
                      <span>下载</span>
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </el-main>
      </el-container>
    </el-dialog>

    <!-- 导入表对话框 -->
    <el-dialog v-model="dialogTableImport" title="导入数据表" :close-on-click-modal="false" width="70%" destroy-on-close draggable class="code-import-dialog" @closed="onClose1">
      <scTable
        ref="table"
        :pageSize="10"
        :border="true"
        :url="fetchGenTableSyncTable"
        :params="form"
        row-key="id"
        height="500px"
        stripe
        class="code-import-table"
        @selection-change="selectionImportChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="#" type="index" width="50" />
        <el-table-column label="数据库" prop="database" />
        <el-table-column label="表名" prop="tableName" />
        <el-table-column label="描述" prop="remark" />
      </scTable>
      <template #footer>
        <div class="code-import-footer">
          <el-button @click="dialogTableImport = false">取 消</el-button>
          <el-button type="primary" :loading="importing" @click="submitImport()">导入</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 子组件 -->
    <ImportCode ref="importCodeRef" :v-model="importCodeStatus" />
    <viewCode ref="viewCodeRef" :v-model="viewCodeStatus" />
    <TemplateDialog v-if="templateDialogStatus" ref="templateDialogRef" />
    <EditDialog v-if="editDialogStatus" ref="editDialogRef" />
  </div>
</template>

<script setup>
import { fetchGenTableDelete, fetchGenTableGenCode, fetchGenTableImportColumn, fetchGenTablePage, fetchGenTableSyncConstruct, fetchGenTableSyncTable } from "@/api/monitor/gen/table";
import ScTable from "@repo/components/ScTable/index.vue";
import { downLoadZip } from "@repo/utils";
import { defineAsyncComponent, ref, reactive, nextTick } from "vue";

// 异步加载子组件
const ImportCode = defineAsyncComponent({
  loader: () => import("./importCode.vue"),
  delay: 200
});
const viewCode = defineAsyncComponent({
  loader: () => import("./view.vue"),
  delay: 200
});
const EditDialog = defineAsyncComponent({
  loader: () => import("./edit.vue"),
  delay: 200
});
const TemplateDialog = defineAsyncComponent({
  loader: () => import("../template/index.vue"),
  delay: 200
});

// 组件引用
const table1 = ref(null);
const importCodeRef = ref(null);
const viewCodeRef = ref(null);
const editDialogRef = ref(null);
const templateDialogRef = ref(null);

// 状态变量
const visible = ref(false);
const dialogTableImport = ref(false);
const editDialogStatus = ref(false);
const templateDialogStatus = ref(false);
const viewCodeStatus = ref(false);
const importCodeStatus = ref(false);
const importing = ref(false);
const syncLoading = reactive({});

// 数据对象
const form = reactive({
  genId: undefined
});
const selectionImport = ref([]);
const selection = ref([]);
const downloadForm = reactive({});

/**
 * 关闭主对话框
 */
const onClose = () => {
  visible.value = false;
  editDialogStatus.value = false;
  dialogTableImport.value = false;
  templateDialogStatus.value = false;
  form.genId = undefined;
  Object.keys(syncLoading).forEach(key => {
    syncLoading[key] = false;
  });
};

/**
 * 关闭导入对话框
 */
const onClose1 = () => {
  dialogTableImport.value = false;
};

/**
 * 打开主对话框
 * @returns {Object} 当前实例，支持链式调用
 */
const open = () => {
  visible.value = true;
  return { setData };
};

/**
 * 设置数据
 * @param {Object} item - 数据项
 * @returns {Object} 当前实例，支持链式调用
 */
const setData = item => {
  Object.assign(form, item);
  refresh();
  return { open };
};

/**
 * 打开编辑对话框
 * @param {Object} row - 行数据
 */
const openEdit = row => {
  editDialogStatus.value = true;
  nextTick(() => {
    setTimeout(() => {
      editDialogRef.value.open(row);
    }, 300);
  });
};

/**
 * 打开模板对话框
 */
const openTemplate = () => {
  templateDialogStatus.value = true;
  nextTick(() => {
    setTimeout(() => {
      templateDialogRef.value.setData(form).open("edit");
    }, 320);
  });
};

/**
 * 同步表结构
 * @param {Object} row - 行数据
 */
const openSync = async row => {
  syncLoading[row.tabId] = true;
  const tableName = row.tabName;

  try {
    await ElMessageBox.confirm(`确认要强制同步"${tableName}"表结构吗？`, "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const res = await fetchGenTableSyncConstruct({ tabId: row.tabId });
    if (res.code === "00000") {
      ElMessage.success("同步成功");
    } else {
      ElMessage.error(res.msg || "同步失败");
    }
  } catch (error) {
    // 用户取消操作，不做处理
  } finally {
    syncLoading[row.tabId] = false;
  }
};

/**
 * 批量删除表
 */
const batchDelete = () => {
  if (!selection.value || selection.value.length === 0) {
    ElMessage.error("请选择表");
    return;
  }

  const tableIds = selection.value.map(item => item.tabId).join(",");
  table_del({ tabId: tableIds });
};

/**
 * 下载代码文件
 * @param {Object} row - 行数据
 */
const openDownFile = row => {
  openGen(row, true);
  downLoadZip(fetchGenTableGenCode, downloadForm, "code");
};

/**
 * 打开代码预览
 * @param {Object} row - 行数据
 */
const openView = row => {
  viewCodeStatus.value = true;
  nextTick(() => {
    setTimeout(() => {
      viewCodeRef.value.open(row);
    }, 300);
  });
};

/**
 * 生成代码
 * @param {Object} row - 行数据
 * @param {Boolean} noOpen - 是否不打开预览
 */
const openGen = (row, noOpen) => {
  Object.keys(downloadForm).forEach(key => delete downloadForm[key]);

  let tabIds = null;
  const tabNames = [];

  if (row) {
    // 单表生成
    tabIds = row.tabId;
    tabNames.push(row.tabName);
  } else {
    // 批量生成
    if (!selection.value || selection.value.length === 0) {
      ElMessage.error("请选择表");
      return;
    }

    const tableIds = [];
    selection.value.forEach(item => {
      tableIds.push(item.tabId);
      tabNames.push(item.tabName);
    });

    tabIds = tableIds.join(",");
  }

  downloadForm.tabIds = tabIds;
  downloadForm.tableNames = tabNames;

  if (!noOpen) {
    nextTick(() => {
      setTimeout(() => {
        importCodeRef.value.open(downloadForm);
      }, 300);
    });
  }
};

/**
 * 删除表
 * @param {Object} row - 行数据
 */
const table_del = async row => {
  try {
    const res = await fetchGenTableDelete({ tableId: row.tabId });
    if (res.code === "00000") {
      ElMessage.success("删除成功");
      table1.value.refresh();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

/**
 * 刷新表格
 */
const refresh = () => {
  setTimeout(() => {
    table1.value.reload(form);
  }, 130);
};

/**
 * 提交导入
 */
const submitImport = async () => {
  if (!selectionImport.value || selectionImport.value.length === 0) {
    ElMessage.error("请选择表");
    return;
  }

  importing.value = true;

  try {
    const tableNames = selectionImport.value.map(item => item.tableName);
    const params = { ...form, tableNames };

    const res = await fetchGenTableImportColumn(params);
    if (res.code === "00000") {
      dialogTableImport.value = false;
      ElMessage.success("导入成功");
      table1.value.refresh();
    } else {
      ElMessage.error(res.msg || "导入失败");
    }
  } catch (error) {
    ElMessage.error("操作失败");
  } finally {
    importing.value = false;
  }
};

/**
 * 导入表格选择变更
 * @param {Array} selection - 选中的行
 */
const selectionImportChange = selection => {
  selectionImport.value = selection;
};

/**
 * 主表格选择变更
 * @param {Array} sel - 选中的行
 */
const selectionChange = sel => {
  selection.value = sel;
};

/**
 * 打开导入对话框
 */
const importColumn = () => {
  importing.value = false;
  dialogTableImport.value = true;
};

// 导出组件方法
defineExpose({
  open,
  setData
});
</script>

<style lang="scss" scoped>
.code-container {
  width: 100%;
}

.code-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.code-layout {
  display: flex;
  flex-direction: column;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);

  &__left,
  &__right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__btn {
    display: flex;
    align-items: center;
  }

  &__search {
    display: flex;
    align-items: center;
    width: 300px;
  }

  &__input {
    flex: 1;
  }

  &__search-btn {
    margin-left: 10px;
  }
}

.code-main {
  padding: 10px;
  overflow: hidden;
}

.code-table-wrapper {
  width: 100%;
  height: 100%;
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
}

.code-table {
  :deep(.el-table__header) {
    background-color: var(--el-bg-color-overlay);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  &__action-btn {
    display: flex;
    align-items: center;
  }
}

.code-import-dialog {
  :deep(.el-dialog__body) {
    padding: 10px;
  }
}

.code-import-table {
  width: 100%;
}

.code-import-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
