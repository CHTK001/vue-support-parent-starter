<script>
import { defineComponent } from "vue";

import SaveDialog from "./save.vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Plus from "@iconify-icons/line-md/plus";
import Minus from "@iconify-icons/line-md/minus";

import { debounce } from "@pureadmin/utils";
import { fetchListDept, fetchDeleteDept } from "@/api/manage/dept";
import { message } from "@repo/utils";
import { transformI18n as useI18nMethod } from "@repo/config";
import { useRenderIcon as useRenderIconMethod } from "@repo/components/ReIcon/src/hooks";
import { IconifyIconOnline } from "@repo/components/ReIcon";

export default defineComponent({
  name: "DeptLayout",
  components: { SaveDialog, IconifyIconOnline },
  props: {
    nodeClick: {
      type: Function,
      default: () => {}
    }
  },
  data() {
    return {
      icon: {
        Delete: Delete,
        EditPen: EditPen,
        Refresh: Refresh,
        Plus: Plus,
        Minus: Minus
      },
      dicFilterText: "",
      visible: {
        save: false
      },
      loading: {
        query: false
      },
      saveDialogParams: {
        mode: "save"
      },
      params: {
        sysDeptId: null
      },
      tableData: [],
      // 统计数据
      stats: {
        total: 0,
        topLevel: 0,
        subLevel: 0
      }
    };
  },
  watch: {
    dicFilterText(val) {
      this.$refs.treeRef.filter(val);
    }
  },
  mounted() {
    this.icon.Delete = this.useRenderIcon(Delete);
    this.icon.EditPen = this.useRenderIcon(EditPen);
    this.icon.Plus = this.useRenderIcon(Plus);
    this.icon.Minus = this.useRenderIcon(Minus);
    this.onSearch();
  },
  methods: {
    useRenderIcon(v) {
      return useRenderIconMethod(v);
    },
    useI18n(v) {
      return useI18nMethod(v);
    },
    async doChange(data, form) {
      if (!data) {
        return;
      }
      const item = data.filter(item => item.sysMenuId === form.sysMenuId);
      if (null != item && item.length > 0) {
        Object.assign(item[0], form);
        return true;
      }
      for (var i = 0; i < data.length; i++) {
        if (this.doChange(data[i]?.children, form)) {
          break;
        }
      }
      return true;
    },
    async onSuccess(mode, form) {
      if (mode == "edit") {
        const item = this.tableData.filter(item => item.sysMenuId === form.sysMenuId);
        if (null != item && item.length > 0) {
          Object.assign(item[0], form);
          return;
        }
        for (var i = 0; i < this.tableData.length; i++) {
          if (this.doChange(this.tableData[i]?.children, form)) {
            break;
          }
        }

        return;
      }
      this.onSearch();
    },
    async onClick(node) {
      this.params.sysDeptId = node?.sysDeptId;
      this.nodeClick(this.params);
    },
    // 计算部门统计
    calcStats(data) {
      let total = 0;
      let topLevel = 0;
      let subLevel = 0;
      
      const countDepts = (items, isTop = true) => {
        items.forEach(item => {
          if (item.sysDeptId) {
            total++;
            if (isTop) topLevel++;
            else subLevel++;
          }
          if (item.children?.length) {
            countDepts(item.children, false);
          }
        });
      };
      
      countDepts(data);
      this.stats.total = total;
      this.stats.topLevel = topLevel;
      this.stats.subLevel = subLevel;
    },
    async onSearch() {
      this.loading.query = true;
      fetchListDept(this.params)
        .then(res => {
          const { data, code } = res;
          const arr = [];
          arr.push({
            sysDeptId: null,
            sysDeptName: "全部",
            sysDeptCode: "ALL"
          });
          arr.push(...data);
          this.tableData = arr;
          this.calcStats(data);
          return;
        })
        .catch(error => {
          message(this.useI18n("message.queryFailed"), { type: "error" });
        })
        .finally(() => {
          this.loading.query = false;
        });
    },
    async onDelete(row) {
      try {
        const { code } = await fetchDeleteDept(row.sysMenuId);
        this.onSearch();
        message(this.t("message.deleteSuccess"), { type: "success" });
        return;
      } catch (error) {}
    },
    async dialogClose() {
      this.saveDialogParams.mode = "save";
      this.visible.save = false;
      this.$nextTick(() => {
        this.onSearch();
      });
    },
    filterNode(value, data) {
      if (!value) {
        return true;
      }
      var targetText = data.sysDeptName + data.sysDeptCode;
      return targetText.indexOf(value) !== -1;
    },
    async dialogOpen(item, mode = "save" | "edit") {
      this.saveDialogParams.mode = mode;
      this.visible.save = true;
      this.$nextTick(() => {
        this.$refs.saveDialog.setData(item).setTableData(this.tableData).open(mode);
      });
    },
    async getOpenDetail(row, column, event) {
      if (row.children && column?.label != "操作") {
        if (event.currentTarget.querySelector(".el-table__expand-icon")) {
          event.currentTarget.querySelector(".el-table__expand-icon").click();
        }
      }
    }
  }
});
</script>
<template>
  <div class="dept-container">
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSuccess" @close="dialogClose" />
    <div class="dept-wrapper">
      <el-container>
        <!-- 统计面板 -->
        <div class="dept-stats">
          <div class="stat-item">
            <div class="stat-icon total">
              <IconifyIconOnline icon="ri:building-line" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">全部部门</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon top">
              <IconifyIconOnline icon="ri:building-2-line" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.topLevel }}</span>
              <span class="stat-label">一级部门</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon sub">
              <IconifyIconOnline icon="ri:building-4-line" :size="24" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.subLevel }}</span>
              <span class="stat-label">子部门</span>
            </div>
          </div>
        </div>
        <el-header class="dept-header">
          <el-input v-model="dicFilterText" :placeholder="useI18n('input.keywordSearch')" clearable class="search-input">
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
        </el-header>
        <el-main class="dept-main">
          <div class="tree-container">
            <el-skeleton v-if="loading.query" animated :count="6" />
            <el-tree
              v-else
              ref="treeRef"
              :filter-node-method="filterNode"
              :data="tableData"
              :highlight-current="true"
              :props="{
                label: 'sysDeptName',
                id: 'sysDeptId',
                pid: 'sysDeptPid'
              }"
              class="dept-tree"
              @node-click="onClick"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div class="node-content">
                    <div class="node-icon" :class="data.sysDeptId ? (node.childNodes?.length > 0 ? 'has-children' : 'leaf') : 'all'">
                      <IconifyIconOnline :icon="data.sysDeptIcon || (data.sysDeptId ? (node.childNodes?.length > 0 ? 'ri:folder-3-line' : 'ri:building-line') : 'ri:stack-line')" />
                    </div>
                    <div class="node-info">
                      <span class="node-label">{{ data.sysDeptName }}</span>
                      <span v-if="data?.sysDeptCode && data.sysDeptCode !== 'ALL'" class="node-code">{{ data.sysDeptCode }}</span>
                    </div>
                  </div>
                  <div v-if="data?.sysDeptId" class="node-actions">
                    <el-tooltip content="编辑" placement="top">
                      <el-button type="primary" link size="small" @click.stop="dialogOpen(data, 'edit')">
                        <IconifyIconOnline icon="ri:edit-line" />
                      </el-button>
                    </el-tooltip>
                    <el-popconfirm title="确定要删除该部门吗？" @confirm="onDelete(data)">
                      <template #reference>
                        <el-tooltip content="删除" placement="top">
                          <el-button type="danger" link size="small" @click.stop>
                            <IconifyIconOnline icon="ri:delete-bin-line" />
                          </el-button>
                        </el-tooltip>
                      </template>
                    </el-popconfirm>
                  </div>
                </div>
              </template>
            </el-tree>
          </div>
        </el-main>
        <el-footer class="dept-footer">
          <el-button type="primary" class="add-btn" @click="dialogOpen({}, 'save')">
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            {{ useI18n("buttons.addDept") }}
          </el-button>
        </el-footer>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dept-container {
  height: 100%;
  background-color: var(--el-bg-color);
}

.dept-wrapper {
  height: 100%;
  border-radius: var(--el-border-radius-base);
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: var(--el-box-shadow);
  }
}

// 统计面板
.dept-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .stat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      color: #fff;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.top {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }

      &.sub {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        margin-top: 2px;
      }
    }
  }
}

// 页头
.dept-header {
  padding: 12px 16px !important;
  height: auto !important;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .search-input {
    :deep(.el-input__wrapper) {
      border-radius: 8px;
    }
  }
}

// 主体
.dept-main {
  padding: 0 !important;
  background-color: var(--el-bg-color);
  overflow: hidden;
}

.tree-container {
  height: 100%;
  padding: 12px;
  overflow: auto;
}

// 树组件样式
.dept-tree {
  :deep(.el-tree-node__content) {
    height: 44px;
    border-radius: 8px;
    margin-bottom: 4px;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-7);
  }
}

// 自定义树节点
.custom-tree-node {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;

  .node-content {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .node-icon {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font-size: 16px;

    &.all {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    &.has-children {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: #fff;
    }

    &.leaf {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: #fff;
    }
  }

  .node-info {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .node-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .node-code {
      font-size: 11px;
      color: var(--el-text-color-secondary);
    }
  }

  .node-actions {
    display: none;
    align-items: center;
    gap: 4px;
  }

  &:hover .node-actions {
    display: flex;
  }
}

// 底部
.dept-footer {
  padding: 12px 16px !important;
  height: auto !important;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);

  .add-btn {
    width: 100%;
    border-radius: 8px;
    height: 40px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .dept-wrapper {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  }

  .dept-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .dept-header,
  .dept-main,
  .dept-footer {
    background-color: var(--el-bg-color-overlay);
  }

  .dept-tree {
    :deep(.el-tree-node__content) {
      &:hover {
        background-color: var(--el-fill-color);
      }
    }

    :deep(.el-tree-node.is-current > .el-tree-node__content) {
      background-color: rgba(var(--el-color-primary-rgb), 0.1);
      border-color: rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}
</style>
