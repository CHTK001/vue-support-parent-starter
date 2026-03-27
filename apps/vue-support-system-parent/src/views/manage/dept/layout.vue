<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon";

import {
  defineAsyncComponent,
  nextTick,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { fetchListDept, fetchDeleteDept } from "@/api/manage/dept";
import { message } from "@repo/utils";
import { transformI18n } from "@repo/config";
import { useI18n } from "vue-i18n";

// Props
const props = defineProps<{
  nodeClick?: (params: any) => void;
}>();

// 异步加载对话框
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const { t } = useI18n();

// Refs
const treeRef = ref();
const saveDialogRef = ref();

// 状态
const dicFilterText = ref("");
const tableData = ref<any[]>([]);

const visible = reactive({
  save: false,
});

const loading = reactive({
  query: false,
});

const saveDialogParams = reactive({
  mode: "save" as "save" | "edit",
});

const params = reactive({
  sysDeptId: null as string | null,
});

// 统计数据
const stats = reactive({
  total: 0,
  topLevel: 0,
  subLevel: 0,
});

// 监听搜索关键字
watch(dicFilterText, (val) => {
  treeRef.value?.filter(val);
});

// i18n 方法
const useI18nText = (key: string) => {
  return transformI18n(key);
};

// 更新树节点数据
const doChange = (data: any[], form: any): boolean => {
  if (!data) return false;

  const item = data.find((item) => item.sysMenuId === form.sysMenuId);
  if (item) {
    Object.assign(item, form);
    return true;
  }

  for (const it of data) {
    if (it.children && doChange(it.children, form)) {
      return true;
    }
  }
  return false;
};

// 保存成功回调
const onSuccess = (mode: string, form: any) => {
  if (mode === "edit") {
    const item = tableData.value.find(
      (item) => item.sysMenuId === form.sysMenuId,
    );
    if (item) {
      Object.assign(item, form);
      return;
    }
    for (const it of tableData.value) {
      if (it.children && doChange(it.children, form)) {
        break;
      }
    }
    return;
  }
  onSearch();
};

// 节点点击
const onClick = (node: any) => {
  params.sysDeptId = node?.sysDeptId;
  props.nodeClick?.(params);
};

// 计算部门统计
const calcStats = (data: any[]) => {
  let total = 0;
  let topLevel = 0;
  let subLevel = 0;

  const countDepts = (items: any[], isTop = true) => {
    items.forEach((item) => {
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
  stats.total = total;
  stats.topLevel = topLevel;
  stats.subLevel = subLevel;
};

// 搜索查询
const onSearch = async () => {
  loading.query = true;
  try {
    const res = await fetchListDept(params);
    const { data } = res;
    const arr: any[] = [
      {
        sysDeptId: null,
        sysDeptName: "全部",
        sysDeptCode: "ALL",
      },
    ];
    arr.push(...(data || []));
    tableData.value = arr;
    calcStats(data || []);
  } catch (error) {
    message(useI18nText("message.queryFailed"), { type: "error" });
  } finally {
    loading.query = false;
  }
};

// 删除部门
const onDelete = async (row: any) => {
  try {
    await fetchDeleteDept(row.sysDeptId);
    onSearch();
    message(t("message.deleteSuccess"), { type: "success" });
  } catch (error) {
    console.error("删除失败", error);
  }
};

// 关闭对话框
const dialogClose = async () => {
  saveDialogParams.mode = "save";
  visible.save = false;
  await nextTick();
  onSearch();
};

// 树节点过滤
const filterNode = (value: string, data: any) => {
  if (!value) return true;
  const targetText = (data.sysDeptName || "") + (data.sysDeptCode || "");
  return targetText.indexOf(value) !== -1;
};

// 打开对话框
const dialogOpen = async (item: any, mode: "save" | "edit" = "save") => {
  saveDialogParams.mode = mode;
  visible.save = true;
  await nextTick();
  saveDialogRef.value?.setData(item)?.setTableData(tableData.value)?.open(mode);
};

// 初始化
onMounted(() => {
  onSearch();
});

// 暴露给父组件
defineExpose({
  onSearch,
});
</script>
<template>
  <div class="dept-container">
    <SaveDialog
      v-if="visible.save"
      ref="saveDialogRef"
      :mode="saveDialogParams.mode"
      @success="onSuccess"
      @close="dialogClose"
    />
    <div class="dept-wrapper">
      <ScContainer>
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
        <ScHeader class="dept-header">
          <ScInput
            v-model="dicFilterText"
            :placeholder="useI18nText('input.keywordSearch')"
            clearable
            class="search-input"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </ScInput>
        </ScHeader>
        <ScMain class="dept-main">
          <div class="tree-container">
            <ScSkeleton v-if="loading.query" animated :count="6" />
            <ScTree
              v-else
              ref="treeRef"
              :filter-node-method="filterNode"
              :data="tableData"
              :highlight-current="true"
              :props="{
                label: 'sysDeptName',
                id: 'sysDeptId',
                pid: 'sysDeptPid',
              }"
              class="dept-tree"
              @node-click="onClick"
            >
              <template #default="{ node, data }">
                <div class="custom-tree-node">
                  <div class="node-content">
                    <div
                      class="node-icon"
                      :class="
                        data.sysDeptId
                          ? node.childNodes?.length > 0
                            ? 'has-children'
                            : 'leaf'
                          : 'all'
                      "
                    >
                      <IconifyIconOnline
                        :icon="
                          data.sysDeptIcon ||
                          (data.sysDeptId
                            ? node.childNodes?.length > 0
                              ? 'ri:folder-3-line'
                              : 'ri:building-line'
                            : 'ri:stack-line')
                        "
                      />
                    </div>
                    <div class="node-info">
                      <span class="node-label">{{ data.sysDeptName }}</span>
                      <span
                        v-if="data?.sysDeptCode && data.sysDeptCode !== 'ALL'"
                        class="node-code"
                        >{{ data.sysDeptCode }}</span
                      >
                    </div>
                  </div>
                  <div v-if="data?.sysDeptId" class="node-actions">
                    <ScTooltip content="编辑" placement="top">
                      <ScButton
                        type="primary"
                        link
                        size="small"
                        @click.stop="dialogOpen(data, 'edit')"
                      >
                        <IconifyIconOnline icon="ri:edit-line" />
                      </ScButton>
                    </ScTooltip>
                    <ScPopconfirm
                      title="确定要删除该部门吗？"
                      @confirm="onDelete(data)"
                    >
                      <template #reference>
                        <ScTooltip content="删除" placement="top">
                          <ScButton type="danger" link size="small" @click.stop>
                            <IconifyIconOnline icon="ri:delete-bin-line" />
                          </ScButton>
                        </ScTooltip>
                      </template>
                    </ScPopconfirm>
                  </div>
                </div>
              </template>
            </ScTree>
          </div>
        </ScMain>
        <ScFooter class="dept-footer">
          <ScButton
            type="primary"
            class="add-btn"
            @click="dialogOpen({}, 'save')"
          >
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            {{ useI18nText("buttons.addDept") }}
          </ScButton>
        </ScFooter>
      </ScContainer>
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
  overflow: hidden;
  border-radius: var(--el-border-radius-base);
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
    gap: 10px;
    align-items: center;
    padding: 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgb(0 0 0 / 8%);
      transform: translateY(-2px);
    }

    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      color: #fff;
      border-radius: 8px;

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
        line-height: 1.2;
        color: var(--el-text-color-primary);
      }

      .stat-label {
        margin-top: 2px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
  }
}

// 页头
.dept-header {
  height: auto !important;
  padding: 12px 16px !important;
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
  overflow: hidden;
  background-color: var(--el-bg-color);
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
    margin-bottom: 4px;
    border-radius: 8px;
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
    gap: 10px;
    align-items: center;
  }

  .node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 16px;
    border-radius: 6px;

    &.all {
      color: #fff;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.has-children {
      color: #fff;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.leaf {
      color: #fff;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
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
    gap: 4px;
    align-items: center;
  }

  &:hover .node-actions {
    display: flex;
  }
}

// 底部
.dept-footer {
  height: auto !important;
  padding: 12px 16px !important;
  background-color: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);

  .add-btn {
    width: 100%;
    height: 40px;
    font-weight: 500;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
      transform: translateY(-2px);
    }
  }
}

// 暗色主题适配
:root[data-theme="dark"] {
  .dept-wrapper {
    box-shadow: 0 2px 12px rgb(0 0 0 / 20%);
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
