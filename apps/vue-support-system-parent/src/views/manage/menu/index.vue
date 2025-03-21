<script setup lang="ts">
// 引入 Vue 相关的 API
import { nextTick, reactive, ref, toRaw } from "vue";

// 引入图标
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Edit from "@iconify-icons/line-md/plus";
// 引入保存对话框组件
import SaveDialog from "./save.vue";

// 引入菜单相关的 API
import { fetchDeleteMenu, fetchListMenu } from "@/api/manage/menu";
// 引入防抖工具函数
import { debounce } from "@pureadmin/utils";
// 引入渲染图标的钩子函数
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
// 引入配置和国际化相关的工具函数
import { getConfig, transformI18n } from "@repo/config";
// 引入消息提示工具函数
import { message } from "@repo/utils";
// 引入国际化 API
import { useI18n } from "vue-i18n";

// 获取国际化实例
const { t } = useI18n();
// 定义表单数据
const form = reactive({});

// 定义对话框可见状态
const visible = reactive({
  save: false,
});

// 定义加载状态
const loading = reactive({
  query: false,
});
// 定义表单引用
const formRef = ref();
// 定义表格引用
const table = ref(null);
// 定义保存对话框引用
const saveDialog = ref(null);

/**
 * 重置表单并重新搜索
 * @param {Object} formRef - 表单引用
 */
const resetForm = async (formRef) => {
  formRef.resetFields();
  onSearch();
};

// 定义表格数据
const tableData = ref([]);

/**
 * 递归修改表格数据中的项
 * @param {Array} data - 表格数据
 * @param {Object} form - 要修改的表单数据
 * @returns {boolean} - 是否修改成功
 */
const doChange = async (data, form) => {
  if (!data) {
    return;
  }
  const item = data.filter((item) => item.sysMenuId === form.sysMenuId);
  if (null != item && item.length > 0) {
    Object.assign(item[0], form);
    return true;
  }
  for (var i = 0; i < data.length; i++) {
    if (doChange(data[i]?.children, form)) {
      break;
    }
  }
  return true;
};

/**
 * 处理保存成功后的逻辑
 * @param {string} mode - 操作模式，'edit' 或 'save'
 * @param {Object} form - 表单数据
 */
const onSuccess = async (mode, form) => {
  if (mode == "edit") {
    const item = tableData.value.filter((item) => item.sysMenuId === form.sysMenuId);
    if (null != item && item.length > 0) {
      Object.assign(item[0], form);
      return;
    }
    for (var i = 0; i < tableData.value.length; i++) {
      if (doChange(tableData[i]?.children, form)) {
        break;
      }
    }
    return;
  }
  onSearch();
};

/**
 * 搜索菜单数据，使用防抖处理
 */
const onSearch = debounce(
  async () => {
    loading.query = true;
    fetchListMenu(form)
      .then((res) => {
        const { data, code } = res;
        tableData.value = data;
        return;
      })
      .finally(() => {
        loading.query = false;
      });
  },
  1000,
  true
);

// 页面加载时执行搜索
onSearch();

/**
 * 处理表格行点击事件，展开子项
 * @param {Object} row - 当前行数据
 * @param {Object} column - 当前列数据
 * @param {Event} event - 点击事件
 */
const getOpenDetail = async (row, column, event) => {
  if (row.children && column?.label != "操作") {
    if (event.currentTarget.querySelector(".el-table__expand-icon")) {
      event.currentTarget.querySelector(".el-table__expand-icon").click();
    }
  }
};

// 定义保存对话框的参数
const saveDialogParams = reactive({
  mode: "save",
});

/**
 * 删除菜单
 * @param {Object} row - 当前行数据
 */
const onDelete = async (row) => {
  try {
    const { code } = await fetchDeleteMenu(row.sysMenuId);
    onSearch();
    message(t("message.deleteSuccess"), { type: "success" });
    return;
  } catch (error) {}
};

/**
 * 打开保存对话框
 * @param {Object} item - 要编辑或保存的数据
 * @param {string} mode - 操作模式，'edit' 或 'save'
 */
const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value.setTableData(tableData.value).setData(item).open(mode);
};

/**
 * 关闭保存对话框
 */
const dialogClose = async () => {
  visible.save = false;
};
</script>

<template>
  <div class="p-0">
    <!-- 保存对话框组件 -->
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSuccess" @close="dialogClose" />
    <div class="main">
      <el-container>
        <!-- 表格头部 -->
        <el-header>
          <div class="left-panel" />
          <div class="right-panel">
            <div class="right-panel-search">
              <!-- 刷新按钮 -->
              <el-button type="primary" :icon="useRenderIcon('ri:refresh-line')" :loading="loading.query" @click="onSearch" />
              <!-- 添加菜单按钮 -->
              <el-button
                v-if="getConfig().AccountType != 'tenant'"
                :icon="useRenderIcon('ep:plus')"
                @click="
                  dialogOpen(
                    {
                      sysMenuType: 0,
                    },
                    'save'
                  )
                "
              />
            </div>
          </div>
        </el-header>
        <!-- 表格主体 -->
        <el-main class="overflow-hidden nopadding">
          <div class="h-full overflow-hidden">
            <!-- 加载骨架屏 -->
            <el-skeleton v-if="loading.query" animated :count="6" />
            <!-- 表格 -->
            <el-table v-else :data="tableData" style="width: 100%; margin-bottom: 20px" row-key="sysMenuId" border @row-click="getOpenDetail">
              <!-- 菜单名称列 -->
              <el-table-column prop="sysMenuTitle" label="菜单名称" show-overflow-tooltip>
                <template #default="{ row }">
                  <span class="inline-block mr-1">
                    <component :is="useRenderIcon(toRaw(row.sysMenuIcon))" style="padding-top: 1px" />
                  </span>
                  <span v-if="row.sysMenuType !== 3">
                    {{ transformI18n(row.sysMenuI18n || row.sysMenuTitle) }}
                  </span>
                  <span v-else>
                    {{ transformI18n(row.sysMenuI18n || row.sysMenuTitle) }}
                    <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">
                      {{ row.sysMenuPerm }}
                    </span>
                  </span>
                </template>
              </el-table-column>
              <!-- 菜单类型列 -->
              <el-table-column prop="sysMenuType" label="菜单类型" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag v-if="row.sysMenuType == 0" size="small" type="primary" effect="plain" class="inline-block mr-2 p-8">菜单</el-tag>
                  <el-tag v-else-if="row.sysMenuType == 1" size="small" type="warning" effect="plain" class="inline-block mr-2 p-8">iframe</el-tag>
                  <el-tag v-else-if="row.sysMenuType == 2" size="small" type="danger" effect="plain" class="inline-block mr-2 p-8">外链</el-tag>
                  <el-tag v-else-if="row.sysMenuType == 3" size="small" type="info" effect="plain" class="inline-block mr-2 p-8">按钮</el-tag>
                </template>
              </el-table-column>
              <!-- 路由名称列 -->
              <el-table-column prop="sysMenuPath" label="路由名称" show-overflow-tooltip>
                <template #default="{ row }">
                  <span>
                    {{ row.sysMenuName || "-" }}
                    <el-icon v-if="row.sysMenuName" size="10px" color="blue" class="cursor-pointer">
                      <component v-copy:click="row.sysMenuName" :is="useRenderIcon('ep:copy-document')" />
                    </el-icon>
                  </span>
                </template>
              </el-table-column>
              <!-- 路由路径列 -->
              <el-table-column prop="sysMenuPath" label="路由路径" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.sysMenuPath || "-" }}
                </template>
              </el-table-column>
              <!-- 组件路径列 -->
              <el-table-column prop="sysMenuComponent" label="组件路径" show-overflow-tooltip min-width="100px">
                <template #default="{ row }">
                  {{ row.sysMenuComponent || "-" }}
                </template>
              </el-table-column>
              <!-- 排序列 -->
              <el-table-column prop="sysMenuSort" label="排序" width="100px" />
              <!-- 隐藏列 -->
              <el-table-column prop="sysMenuHidden" label="隐藏" width="100px" v-if="getConfig().AccountType != 'tenant'">
                <template #default="{ row }">
                  <el-tag type="danger" v-if="row.sysMenuHidden"> 是 </el-tag>
                  <el-tag type="primary" v-else> 否 </el-tag>
                </template>
              </el-table-column>
              <!-- 操作列 -->
              <el-table-column label="操作" width="160px" v-if="getConfig().AccountType != 'tenant'">
                <template #default="{ row }">
                  <!-- 编辑按钮 -->
                  <el-button class="btn-text" :icon="useRenderIcon(EditPen)" @click="dialogOpen(row, 'edit')"></el-button>
                  <!-- 添加子菜单按钮 -->
                  <el-button
                    class="btn-text"
                    :icon="useRenderIcon(Edit)"
                    @click="
                      dialogOpen(
                        {
                          sysMenuPid: row.sysMenuId,
                          sysMenuType: 0,
                        },
                        'save'
                      )
                    "
                  >
                  </el-button>
                  <!-- 删除确认框 -->
                  <el-popconfirm :title="$t('message.confimDelete')" @confirm="onDelete(row)">
                    <template #reference>
                      <el-button class="btn-text" type="danger" :icon="useRenderIcon(Delete)"></el-button>
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
