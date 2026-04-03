<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  defineExpose,
  nextTick,
  reactive,
  ref,
} from "vue";
import { fetchDeleteSetting, fetchSettingPage } from "../api";
import { message, ScMessageBox } from "@repo/utils";

const ItemSave = defineAsyncComponent(() => import("./save.vue"));
const ScTable = defineAsyncComponent(
  () => import("@repo/components/ScTable/index.vue"),
);

type SortMode = "default" | "name" | "type" | "sort";

const config = reactive({
  visible: false,
  title: "配置项管理",
});

const emit = defineEmits(["close"]);
const tableRef = ref();
const itemSaveRef = ref();

const queryForm = reactive({
  sysSettingGroup: "",
  sysSettingName: "",
  sysSettingValueType: "",
  systemOnly: "all",
  sortMode: "default" as SortMode,
});

const tableParams = computed(() => {
  const params: Record<string, unknown> = {};

  if (queryForm.sysSettingGroup.trim()) {
    params.sysSettingGroup = queryForm.sysSettingGroup.trim();
  }

  if (queryForm.sysSettingName.trim()) {
    params.sysSettingName = queryForm.sysSettingName.trim();
  }

  if (queryForm.sysSettingValueType) {
    params.sysSettingValueType = queryForm.sysSettingValueType;
  }

  if (queryForm.systemOnly === "yes") {
    params.sysSettingInSystem = 1;
  }

  if (queryForm.systemOnly === "no") {
    params.sysSettingInSystem = 0;
  }

  return params;
});

const sortRows = (rows = []) => {
  const list = [...rows];

  if (queryForm.sortMode === "name") {
    return list.sort((left, right) =>
      String(left?.sysSettingName || "").localeCompare(
        String(right?.sysSettingName || ""),
        "zh-CN",
      ),
    );
  }

  if (queryForm.sortMode === "type") {
    return list.sort((left, right) =>
      String(left?.sysSettingValueType || "").localeCompare(
        String(right?.sysSettingValueType || ""),
        "zh-CN",
      ),
    );
  }

  if (queryForm.sortMode === "sort") {
    return list.sort(
      (left, right) =>
        Number(left?.sysSettingSort || 0) - Number(right?.sysSettingSort || 0),
    );
  }

  return list;
};

const refreshTable = () => {
  tableRef.value?.refresh?.();
};

const open = () => {
  config.visible = true;
};

const handleClose = () => {
  config.visible = false;
  emit("close");
};

const handleSearch = () => {
  refreshTable();
};

const handleReset = () => {
  queryForm.sysSettingGroup = "";
  queryForm.sysSettingName = "";
  queryForm.sysSettingValueType = "";
  queryForm.systemOnly = "all";
  queryForm.sortMode = "default";
  refreshTable();
};

const handleUpdate = async (row = {}, mode = "add") => {
  await nextTick();
  itemSaveRef.value?.setData(row);
  itemSaveRef.value?.open(mode);
};

const handleDelete = async (row) => {
  try {
    await ScMessageBox.confirm(
      `确定删除配置项「${row.sysSettingName}」吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    const res = await fetchDeleteSetting(row.sysSettingId);
    if (res.code === "00000") {
      message("删除成功", { type: "success" });
      refreshTable();
      return;
    }

    message(res.msg || "删除失败", { type: "error" });
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除配置项失败:", error);
      message("删除失败", { type: "error" });
    }
  }
};

defineExpose({
  open,
});
</script>

<template>
  <div>
    <sc-drawer
      v-model="config.visible"
      size="82%"
      :title="config.title"
      draggable
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :destroy-on-close="true"
      class="setting-admin-drawer"
      @close="handleClose"
    >
      <div class="setting-admin-shell">
        <section class="setting-admin-hero">
          <div>
            <span class="setting-admin-hero__eyebrow">设置域 / 配置项管理</span>
            <h2 class="setting-admin-hero__title">远程配置项总表</h2>
            <p class="setting-admin-hero__desc">
              支持新增、编辑、删除、筛选、排序和刷新回流，所有操作都走真实后端接口。
            </p>
          </div>
          <div class="setting-admin-hero__actions">
            <ScButton @click="refreshTable">
              <IconifyIconOnline icon="ri:refresh-line" />
              刷新
            </ScButton>
            <ScButton type="primary" @click="handleUpdate({}, 'add')">
              <IconifyIconOnline icon="ri:add-line" />
              新增配置项
            </ScButton>
          </div>
        </section>

        <section class="setting-admin-toolbar">
          <div class="toolbar-grid">
            <ScInput
              v-model="queryForm.sysSettingGroup"
              placeholder="按分组过滤"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:folder-line" />
              </template>
            </ScInput>

            <ScInput
              v-model="queryForm.sysSettingName"
              placeholder="按名称过滤"
              clearable
              @keyup.enter="handleSearch"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </ScInput>

            <ScSelect
              v-model="queryForm.sysSettingValueType"
              clearable
              placeholder="数据类型"
            >
              <ScOption label="字符串" value="String" />
              <ScOption label="数字" value="Number" />
              <ScOption label="布尔" value="Boolean" />
              <ScOption label="数组" value="Array" />
              <ScOption label="文本" value="TextArea" />
              <ScOption label="字典" value="Dict" />
              <ScOption label="颜色" value="Color" />
              <ScOption label="邮件" value="Mail" />
              <ScOption label="密码" value="Password" />
              <ScOption label="密钥" value="AppSecret" />
              <ScOption label="对象" value="Object" />
            </ScSelect>

            <ScSelect v-model="queryForm.systemOnly" placeholder="系统配置">
              <ScOption label="全部" value="all" />
              <ScOption label="仅系统配置" value="yes" />
              <ScOption label="仅业务配置" value="no" />
            </ScSelect>

            <ScSelect v-model="queryForm.sortMode" placeholder="排序方式">
              <ScOption label="默认顺序" value="default" />
              <ScOption label="按名称" value="name" />
              <ScOption label="按类型" value="type" />
              <ScOption label="按优先级" value="sort" />
            </ScSelect>
          </div>

          <div class="toolbar-actions">
            <ScButton type="primary" @click="handleSearch">
              <IconifyIconOnline icon="ri:search-line" />
              搜索
            </ScButton>
            <ScButton @click="handleReset">
              <IconifyIconOnline icon="ri:eraser-line" />
              重置
            </ScButton>
          </div>
        </section>

        <section class="setting-admin-table">
          <ScTable
            ref="tableRef"
            table-name="setting-admin-table"
            border
            :url="fetchSettingPage"
            :params="tableParams"
            :sorted="sortRows"
          >
            <ScTableColumn
              prop="sysSettingGroup"
              label="数据分组"
              min-width="130"
            >
              <template #default="scope">
                <ScTag>{{ scope.row.sysSettingGroup }}</ScTag>
              </template>
            </ScTableColumn>
            <ScTableColumn
              prop="sysSettingName"
              label="字段名"
              min-width="180"
            />
            <ScTableColumn
              prop="sysSettingValue"
              label="当前值"
              min-width="220"
            />
            <ScTableColumn
              prop="sysSettingRemark"
              label="描述"
              min-width="220"
            />
            <ScTableColumn
              prop="sysSettingValueType"
              label="数据类型"
              width="120"
            />
            <ScTableColumn prop="sysSettingSort" label="优先级" width="100" />
            <ScTableColumn
              prop="sysSettingInSystem"
              label="系统配置"
              width="110"
            >
              <template #default="scope">
                <ScTag
                  :type="scope.row.sysSettingInSystem ? 'success' : 'info'"
                >
                  {{ scope.row.sysSettingInSystem ? "是" : "否" }}
                </ScTag>
              </template>
            </ScTableColumn>
            <ScTableColumn label="操作" width="150" fixed="right">
              <template #default="{ row }">
                <div class="row-actions">
                  <ScButton
                    text
                    type="primary"
                    @click="handleUpdate(row, 'edit')"
                  >
                    编辑
                  </ScButton>
                  <ScButton text type="danger" @click="handleDelete(row)">
                    删除
                  </ScButton>
                </div>
              </template>
            </ScTableColumn>
          </ScTable>
        </section>
      </div>
    </sc-drawer>

    <ItemSave ref="itemSaveRef" @success="refreshTable" @close="refreshTable" />
  </div>
</template>

<style scoped lang="scss">
:deep(.el-drawer) {
  .el-drawer__header {
    margin: 0;
    padding: 18px 22px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(
      135deg,
      rgba(var(--el-color-primary-rgb), 0.1) 0%,
      var(--el-bg-color-overlay) 100%
    );
  }

  .el-drawer__body {
    padding: 0;
  }
}

.setting-admin-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
  height: 100%;
  padding: 20px;
  background:
    radial-gradient(
      circle at top left,
      rgba(var(--el-color-primary-rgb), 0.08),
      transparent 24%
    ),
    linear-gradient(
      180deg,
      var(--el-bg-color) 0%,
      color-mix(in srgb, var(--el-fill-color-lighter) 84%, transparent) 100%
    );
}

.setting-admin-hero,
.setting-admin-toolbar,
.setting-admin-table {
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  border-radius: 24px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.92) 100%
  );
  box-shadow:
    0 22px 40px -36px rgba(15, 23, 42, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.setting-admin-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
}

.setting-admin-hero__eyebrow {
  display: inline-flex;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--el-color-primary) 74%, #46546b 26%);
}

.setting-admin-hero__title {
  margin: 0 0 8px;
  font-size: 28px;
  line-height: 1.15;
  color: var(--el-text-color-primary);
}

.setting-admin-hero__desc {
  margin: 0;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}

.setting-admin-hero__actions,
.toolbar-actions,
.row-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-admin-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.toolbar-grid {
  display: grid;
  flex: 1;
  gap: 12px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.setting-admin-table {
  padding: 18px;
  overflow: hidden;

  :deep(.sc-table-wrapper) {
    min-height: 0;
  }
}

.row-actions {
  justify-content: flex-start;
}

@media (max-width: 1100px) {
  .setting-admin-hero,
  .setting-admin-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .setting-admin-shell {
    padding: 14px;
  }

  .toolbar-grid {
    grid-template-columns: 1fr;
  }

  .setting-admin-hero__actions,
  .toolbar-actions {
    width: 100%;
    flex-wrap: wrap;

    :deep(.el-button) {
      flex: 1;
      min-width: 0;
    }
  }
}
</style>
