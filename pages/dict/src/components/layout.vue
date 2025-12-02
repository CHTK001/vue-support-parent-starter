<script>
import { defineComponent } from "vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Minus from "@iconify-icons/line-md/minus";
import Plus from "@iconify-icons/line-md/plus";
import SaveDialog from "./save.vue";

import { useRenderIcon as useRenderIconMethod } from "@repo/components/ReIcon/src/hooks";
import { transformI18n as useI18nMethod } from "@repo/config";
import { fetchDeleteDict, fetchPageDict } from "@repo/core";
import { message } from "@repo/utils";

export default defineComponent({
  name: "DeptLayout",
  components: { SaveDialog },
  props: {
    nodeClick: {
      type: Function,
      default: () => {},
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
        const item = this.tableData.filter(
          (item) => item.sysDictId === form.sysDictId
        );
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
      if (target.scrollHeight - target.scrollTop <= target.clientHeight) {
        // 当前页数加一
        this.params.page += 1;
        // 如果当前页数小于总页数，继续加载数据
        if (this.params.page * this.params.pageSize < this.total) {
          this.onSearchItem(this.params);
        }
      }
    },
    async onSearchItem(params) {
      return fetchPageDict(params)
        .then((res) => {
          const { data, code } = res;
          data?.data.forEach((element) => {
            element.level = this.params.page;
            element.sysDictPid = 0;
          });
          this.tableData = data?.data;
          if (this.params?.page == 1) {
            this.total = data.total;
          }
          this.firstLoad = true;
          return;
        })
        .catch((error) => {
          message(this.useI18n("message.queryFailed"), { type: "error" });
        });
    },
    async onSearch() {
      this.loading.query = true;
      this.onSearchItem(this.params).finally(() => {
        this.loading.query = false;
      });
    },
    async onDelete(row) {
      try {
        const { code } = await fetchDeleteDict(row.sysDictId);
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
      var targetText = data.sysDictName + data.sysDictCode;
      return targetText.indexOf(value) !== -1;
    },
    async dialogOpen(item, mode = "save" | "edit") {
      this.saveDialogParams.mode = mode;
      this.visible.save = true;
      this.$nextTick(() => {
        this.$refs.saveDialog
          .setData(item)
          .setTableData(this.tableData)
          .open(mode);
      });
    },
    async getOpenDetail(row, column, event) {
      if (row.children && column?.label != "操作") {
        if (event.currentTarget.querySelector(".el-table__expand-icon")) {
          event.currentTarget.querySelector(".el-table__expand-icon").click();
        }
      }
    },
  },
});
</script>
<template>
  <div class="h-full">
    <SaveDialog
      v-if="visible.save"
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSuccess"
      @close="dialogClose"
    />
    <div class="main h-full">
      <el-container>
        <el-header class="header-height">
          <el-input
            v-model="dicFilterText"
            :placeholder="useI18n('input.keywordSearch')"
            clearable
          />
        </el-header>
        <el-main class="nopadding">
          <div class="h-full">
            <el-skeleton v-if="loading.query" animated :count="6" />
            <el-tree
              v-else
              ref="treeRef"
              :load="loadNode"
              :filter-node-method="filterNode"
              :data="tableData"
              :highlight-current="true"
              :props="{
                label: 'sysDictName',
                id: 'sysDictId',
                pid: 'sysDictPid',
              }"
              @scroll="handleScroll"
              @node-click="onClick"
            >
              <template #default="{ data }">
                <span class="custom-tree-node">
                  <span class="label">
                    <el-tag class="label" size="small">{{
                      data.sysDictId
                    }}</el-tag>
                    {{ data.sysDictName }}
                  </span>
                  <span class="code">{{ data?.sysDictCode }}</span>
                  <span v-if="data?.sysDictId" class="do">
                    <el-button-group>
                      <el-button
                        :icon="icon.EditPen"
                        size="small"
                        @click.stop="dialogOpen(data, 'edit')"
                      />
                      <el-popconfirm
                        :title="$t('message.confimDelete')"
                        @confirm="onDelete(row, $index)"
                      >
                        <template #reference>
                          <el-button
                            v-if="data?.sysDictInSystem == 1"
                            :icon="icon.Delete"
                            size="small"
                            @click.stop="onDelete(data)"
                          />
                        </template>
                      </el-popconfirm>
                    </el-button-group>
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-main>
        <el-footer class="footer-height">
          <el-button
            type="primary"
            size="small"
            icon="el-icon-plus"
            class="full-width"
            @click="dialogOpen({}, 'save')"
          >
            {{ useI18n("buttons.addDict") }}
          </el-button>
        </el-footer>
      </el-container>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.header-height {
  height: auto;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-bottom: 1px solid var(--el-border-color-lighter);

  :deep(.el-input__wrapper) {
    border-radius: 10px;
    background: var(--el-bg-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    transition: all 0.3s ease;

    &:hover,
    &:focus-within {
      box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.12);
      border-color: var(--el-color-primary-light-5);
    }
  }
}

.footer-height {
  height: auto;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-top: 1px solid var(--el-border-color-lighter);
}

.full-width {
  width: 100%;
  border-radius: 10px;
  height: 40px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}

.menu:deep(.el-tree-node__label) {
  display: flex;
  flex: 1;
  height: 100%;
}

// 树形组件美化
:deep(.el-tree) {
  background: transparent;
  padding: 12px;

  .el-tree-node {
    margin-bottom: 4px;

    &:focus > .el-tree-node__content {
      background: var(--el-color-primary-light-9);
    }
  }

  .el-tree-node__content {
    height: 44px;
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0 12px;

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-fill-color-light) 100%
      );
      transform: translateX(4px);
    }
  }

  .el-tree-node.is-current > .el-tree-node__content {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-8) 0%,
      var(--el-color-primary-light-9) 100%
    );
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.15);

    .label {
      color: var(--el-color-primary);
      font-weight: 600;
    }
  }
}

.custom-tree-node {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 12px;
  height: 100%;

  .label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    transition: all 0.3s ease;

    .el-tag {
      border-radius: 6px;
      font-size: 11px;
      padding: 2px 8px;
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-8) 0%,
        var(--el-color-primary-light-9) 100%
      );
      color: var(--el-color-primary);
      border: none;
      font-weight: 600;
    }
  }
}

.custom-tree-node .code {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  padding: 2px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.custom-tree-node .do {
  display: none;

  :deep(.el-button-group) {
    .el-button {
      border-radius: 8px;
      transition: all 0.3s ease;

      &:first-child {
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      &:last-child {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      &:hover {
        transform: scale(1.05);
      }
    }
  }
}

.custom-tree-node:hover .code {
  display: none;
}

.custom-tree-node:hover .do {
  display: inline-flex;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// 骨架屏美化
:deep(.el-skeleton) {
  padding: 16px;

  .el-skeleton__item {
    border-radius: 8px;
  }
}
</style>
