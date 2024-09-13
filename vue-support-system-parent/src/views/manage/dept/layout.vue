<script>
import { defineComponent } from "vue";

import SaveDialog from "./save.vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Plus from "@iconify-icons/line-md/plus";
import Minus from "@iconify-icons/line-md/minus";

import { debounce } from "@pureadmin/utils";
import { fetchListDept, fetchDeleteDept } from "@/api/dept";
import { message } from "@/utils/message";
import { transformI18n as useI18nMethod } from "@/plugins/i18n";
import { useRenderIcon as useRenderIconMethod } from "@/components/ReIcon/src/hooks";

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
        sysDeptId: null
      },
      tableData: []
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
        <el-header>
          <el-input v-model="dicFilterText" :placeholder="useI18n('input.keywordSearch')" clearable />
        </el-header>
        <el-main class="nopadding">
          <div class="h-full">
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
              @node-click="onClick"
            >
              <template #default="{ data }">
                <span class="custom-tree-node">
                  <span class="label">{{ data.sysDeptName }}</span>
                  <span class="code">{{ data?.sysDeptCode }}</span>
                  <span v-if="data?.sysDeptId" class="do">
                    <el-button-group>
                      <el-button :icon="icon.EditPen" size="small" @click.stop="dialogOpen(data, 'edit')" />
                      <el-button :icon="icon.Delete" size="small" @click.stop="onDelete(data)" />
                    </el-button-group>
                  </span>
                </span>
              </template>
            </el-tree>
          </div>
        </el-main>
        <el-footer style="height: 51px">
          <el-button type="primary" size="small" icon="el-icon-plus" style="width: 100%" @click="dialogOpen({}, 'save')">
            {{ useI18n("buttons.addDept") }}
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
