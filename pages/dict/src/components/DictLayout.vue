<script>
import { defineComponent } from "vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Minus from "@iconify-icons/line-md/minus";
import Plus from "@iconify-icons/line-md/plus";
import SaveDialog from "./Save.vue";

import { useRenderIcon as useRenderIconMethod } from "@repo/components/ReIcon/src/hooks";
import { transformI18n as useI18nMethod } from "@repo/config";
import { fetchDeleteDict, fetchPageDict } from "@repo/core";
import { message } from "@repo/utils";

export default defineComponent({
  name: "DictLayout",
  components: { SaveDialog },
  props: {
    nodeClick: {
      type: Function,
      default: () => { },
    },
  },
  data() {
    return {
      icon: {
        Delete: Delete,
        EditPen: EditPen,
        Refresh: Refresh,
        Plus: Plus,
        Minus: Minus,
      },
      dicFilterText: "",
      visible: {
        save: false,
      },
      loading: {
        query: false,
      },
      saveDialogParams: {
        mode: "save",
      },
      params: {
        sysDictId: null,
        page: 1,
        pageSize: 10,
      },
      tableData: [],
      total: 0,
      firstLoad: false,
    };
  },
  watch: {
    dicFilterText(val) {
      this.$refs.treeRef.filter(val);
    },
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
    async onSuccess(mode, form) {
      if (mode == "edit") {
        const item = this.tableData.filter((item) => item.sysDictId === form.sysDictId);
        if (null != item && item.length > 0) {
          Object.assign(item[0], form);
          return;
        }
      }
      this.onSearch();
    },
    async onClick(node) {
      this.params.sysDictId = node?.sysDictId;
      this.nodeClick(this.params);
    },
    async loadNode(node, resolve) {
      // 如果是第一次加载，node.level === 0
      // 如果是滚动加载，node.level > 0
      if (node.level === 0) {
        // 加载第一级数据
        await this.onSearch();
        node.level = 1;
        resolve(this.tableData);
        return false;
      }
    },
    async handleScroll(event) {
      const target = event.target;
      // 检查是否滚动到底部
      if (target.scrollTop + target.clientHeight >= target.scrollHeight - 5) {
        // 加载更多数据
        if (this.tableData.length < this.total) {
          this.params.page++;
          await this.onSearch(true);
        }
      }
    },
    async onSearch(append = false) {
      this.loading.query = true;
      try {
        const { data } = await fetchPageDict(this.params);
        if (data) {
          if (append) {
            this.tableData = [...this.tableData, ...data.records];
          } else {
            this.tableData = data.records;
            this.params.page = 1;
          }
          this.total = data.total;
        }
      } catch (error) {
        console.error('查询字典失败:', error);
      } finally {
        this.loading.query = false;
      }
    },
    filterNode(value, data) {
      if (!value) return true;
      return data.sysDictName.indexOf(value) !== -1;
    },
    async onDelete(node) {
      try {
        const res = await fetchDeleteDict(node.sysDictId);
        if (res.code === "00000") {
          message(this.useI18n("message.deleteSuccess"), { type: "success" });
          this.onSearch();
        }
      } catch (error) {
        console.error('删除字典失败:', error);
      }
    },
    dialogOpen(item, mode) {
      this.visible.save = true;
      this.saveDialogParams.mode = mode;
      this.$nextTick(() => {
        this.$refs.saveDialog.setData(item).open(mode);
      });
    },
    dialogClose() {
      this.visible.save = false;
    },
  },
});
</script>

<template>
  <div class="dict-layout">
    <SaveDialog
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSuccess"
      @close="dialogClose"
    />
    
    <div class="dict-tree-header">
      <el-input
        v-model="dicFilterText"
        placeholder="搜索字典"
        clearable
        class="filter-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-button
        type="primary"
        :icon="icon.Plus"
        size="small"
        @click="dialogOpen({}, 'save')"
      >
        新增字典
      </el-button>
    </div>

    <div class="dict-tree-container" @scroll="handleScroll">
      <el-tree
        ref="treeRef"
        :data="tableData"
        :props="{ label: 'sysDictName', children: 'children' }"
        :filter-node-method="filterNode"
        node-key="sysDictId"
        :expand-on-click-node="false"
        :load="loadNode"
        lazy
        class="dict-tree"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <span class="node-label">{{ data.sysDictName }}</span>
            <div class="node-actions">
              <el-button
                type="text"
                size="small"
                :icon="icon.EditPen"
                @click.stop="dialogOpen(data, 'edit')"
              />
              <el-popconfirm
                title="确定删除这个字典吗？"
                @confirm="onDelete(data)"
              >
                <template #reference>
                  <el-button
                    type="text"
                    size="small"
                    :icon="icon.Delete"
                    @click.stop
                  />
                </template>
              </el-popconfirm>
            </div>
          </div>
        </template>
      </el-tree>
      
      <div v-if="loading.query" class="loading-more">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dict-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color);
}

.dict-tree-header {
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
  
  .filter-input {
    margin-bottom: 12px;
  }
}

.dict-tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.dict-tree {
  :deep(.el-tree-node__content) {
    height: 40px;
    
    &:hover {
      .node-actions {
        opacity: 1;
      }
    }
  }
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-right: 8px;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
  
  .el-button {
    margin-left: 4px;
  }
}

.loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: var(--el-text-color-secondary);
  
  .el-icon {
    margin-right: 8px;
  }
}
</style>