<script>
import { defineComponent } from "vue";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Minus from "@iconify-icons/line-md/minus";
import Plus from "@iconify-icons/line-md/plus";
import SaveDialog from "./save.vue";

import {  useRenderIcon as useRenderIconMethod  } from "@repo/components/ReIcon";
import { transformI18n as useI18nMethod } from "@repo/config/src/i18n";
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
      selectedDictId: null,
      total: 0,
      firstLoad: false,
    };
  },
  computed: {
    filteredDicts() {
      const keyword = String(this.dicFilterText || "").trim().toLowerCase();
      if (!keyword) {
        return this.tableData;
      }
      return this.tableData.filter((item) => {
        const targetText = `${item?.sysDictName || ""}${item?.sysDictCode || ""}`.toLowerCase();
        return targetText.includes(keyword);
      });
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
      this.selectedDictId = node?.sysDictId ?? null;
      this.params.sysDictId = node?.sysDictId ?? null;
      this.nodeClick(node);
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
          const { data } = res;
          const rows = Array.isArray(data?.data) ? data.data : [];
          rows.forEach((element) => {
            element.level = this.params.page;
            element.sysDictPid = 0;
          });
          this.tableData =
            this.params?.page === 1
              ? rows
              : [...this.tableData, ...rows.filter((item) => !this.tableData.some((it) => it.sysDictId === item.sysDictId))];
          if (this.params?.page == 1) {
            this.total = data?.total ?? rows.length;
          }
          const nextSelected =
            this.tableData.find((item) => item.sysDictId === this.selectedDictId) ||
            this.tableData[0];
          if (nextSelected) {
            this.onClick(nextSelected);
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
        if (code !== "00000") {
          return;
        }
        if (this.selectedDictId === row.sysDictId) {
          this.selectedDictId = null;
          this.params.sysDictId = null;
        }
        this.onSearch();
        message(this.useI18n("message.deleteSuccess"), { type: "success" });
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
  },
});
</script>
<template>
  <div class="h-full system-container modern-bg">
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
          <ScInput 
            v-model="dicFilterText"
            :placeholder="useI18n('input.keywordSearch')"
            clearable
          />
        </el-header>
        <el-main class="nopadding">
          <div class="h-full">
            <el-skeleton v-if="loading.query" animated :count="6" />
            <div
              v-else
              class="dict-list thin-scroller"
              @scroll.passive="handleScroll"
            >
              <button
                v-for="item in filteredDicts"
                :key="item.sysDictId"
                type="button"
                class="dict-list-item"
                :class="{ active: selectedDictId === item.sysDictId }"
                @click="onClick(item)"
              >
                <div class="dict-list-main">
                  <div class="dict-list-title">
                    <ScTag size="small">{{ item.sysDictId }}</ScTag>
                    <span>{{ item.sysDictName }}</span>
                  </div>
                  <div class="dict-list-code">{{ item.sysDictCode }}</div>
                </div>
                <div class="dict-list-actions">
                  <ScButton
                    :icon="icon.EditPen"
                    size="small"
                    title="编辑字典分类"
                    aria-label="编辑字典分类"
                    @click.stop="dialogOpen(item, 'edit')"
                  />
                  <ScPopconfirm
                    v-if="item.sysDictInSystem != 1"
                    :title="$t('message.confimDelete')"
                    @confirm="onDelete(item)"
                  >
                    <template #reference>
                      <ScButton
                        :icon="icon.Delete"
                        size="small"
                        title="删除字典分类"
                        aria-label="删除字典分类"
                      />
                    </template>
                  </ScPopconfirm>
                </div>
              </button>
              <ScEmpty v-if="!filteredDicts.length" description="暂无字典分类" />
            </div>
          </div>
        </el-main>
        <el-footer class="footer-height">
          <ScButton 
            type="primary"
            size="small"
            icon="el-icon-plus"
            class="full-width"
            @click="dialogOpen({}, 'save')"
          >
            新增字典
          </ScButton>
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

.dict-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  padding: 12px;
  overflow-y: auto;
}

.dict-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  text-align: left;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(var(--el-color-primary-rgb), 0.28);
    box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
    transform: translateY(-1px);
  }

  &.active {
    background: linear-gradient(
      135deg,
      var(--el-color-primary-light-9) 0%,
      var(--el-bg-color) 100%
    );
    border-color: rgba(var(--el-color-primary-rgb), 0.36);
    box-shadow: 0 10px 22px rgba(var(--el-color-primary-rgb), 0.12);
  }
}

.dict-list-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.dict-list-title {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  font-weight: 600;
  color: var(--el-text-color-primary);

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dict-list-code {
  overflow: hidden;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dict-list-actions {
  display: flex;
  gap: 6px;
  align-items: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.dict-list-item:hover .dict-list-actions,
.dict-list-item.active .dict-list-actions {
  opacity: 1;
}

// 骨架屏美化
:deep(.el-skeleton) {
  padding: 16px;

  .el-skeleton__item {
    border-radius: 8px;
  }
}
</style>
