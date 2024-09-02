<script>
import { defineComponent } from "vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Minus from "@iconify-icons/line-md/minus";
import Plus from "@iconify-icons/line-md/plus";
import SaveDialog from "./save.vue";

import { fetchPageTemplateGroup, fetchDeleteTemplateGroup } from "@/api/template";
import { useRenderIcon as useRenderIconMethod } from "@/components/ReIcon/src/hooks";
import { transformI18n as useI18nMethod } from "@/plugins/i18n";
import { message } from "@/utils/message";

export default defineComponent({
  name: "DeptLayout",
  components: { SaveDialog },
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
        sysTemplateGroupName: null,
        sysTemplateGroupDelete: 0,
        page: 1,
        pageSize: 10
      },
      tableData: [],
      total: 0,
      firstLoad: false
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
    async onSuccess(mode, form) {
      if (mode == "edit") {
        const item = this.tableData.filter(item => item.sysTemplateGroupId === form.sysTemplateGroupId);
        if (null != item && item.length > 0) {
          Object.assign(item[0], form);
          return;
        }
      }
      this.onSearch();
    },
    async onClick(node) {
      this.params.sysTemplateGroupId = node?.sysTemplateGroupId;
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
      return fetchPageTemplateGroup(params)
        .then(res => {
          const { data } = res;
          this.tableData.push(...data?.data);
          if (this.params?.page == 1) {
            this.total = data.total;
          }
          this.firstLoad = true;
          return;
        })
        .catch(error => {
          message(this.useI18n("message.queryFailed"), { type: "error" });
        });
    },
    async onSearch() {
      this.loading.query = true;
      this.tableData.length = 0;
      this.onSearchItem(this.params).finally(() => {
        this.loading.query = false;
      });
    },
    async onDelete(row) {
      try {
        const { code } = await fetchDeleteTemplateGroup(row.sysTemplateGroupId);
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
      var targetText = data.sysTemplateGroupName + data.sysTemplateGroupCode;
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
      if (row.children && column.label != "操作") {
        if (event.currentTarget.querySelector(".el-table__expand-icon")) {
          event.currentTarget.querySelector(".el-table__expand-icon").click();
        }
      }
    }
  }
});
</script>
<template>
  <div class="h-full">
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSuccess" @close="dialogClose" />
    <div class="main h-full">
      <el-container>
        <el-header style="height: 89px">
          <el-input v-model="dicFilterText" :placeholder="useI18n('input.keywordSearch')" clearable />
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
                label: 'sysTemplateGroupName',
                id: 'sysTemplateGroupId',
                pid: 'sysTemplateGroupPid'
              }"
              @scroll="handleScroll"
              @node-click="onClick"
            >
              <template #default="{ data }">
                <span class="custom-tree-node">
                  <span class="label">{{ data.sysTemplateGroupName }}</span>
                  <span class="code">{{ data?.sysTemplateGroupCode }}</span>
                  <span v-if="data?.sysTemplateGroupId" class="do">
                    <el-button-group>
                      <el-button :icon="icon.EditPen" size="small" @click.stop="dialogOpen(data, 'edit')" />
                      <el-popconfirm title="确定删除吗？" @confirm="onDelete(data)">
                        <template #reference>
                          <el-button :icon="icon.Delete" size="small" />
                        </template>
                      </el-popconfirm>
                    </el-button-group>
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-main>
        <el-footer style="height: 51px">
          <el-button type="primary" size="small" icon="el-icon-plus" style="width: 100%" @click="dialogOpen({}, 'save')">
            {{ useI18n($t("button.addTemplate")) }}
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
.custom-tree-node {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 24px;
  height: 100%;
}
.custom-tree-node .code {
  font-size: 12px;
  color: #999;
}
.custom-tree-node .do {
  display: none;
}
.custom-tree-node:hover .code {
  display: none;
}
.custom-tree-node:hover .do {
  display: inline-block;
}
</style>
