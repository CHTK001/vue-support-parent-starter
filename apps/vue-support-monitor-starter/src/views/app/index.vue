<template>
  <div class="page flex flex-col">
    <!-- 顶部工具栏：搜索 / 类型过滤 / 排序 / 新建 -->
    <div class="toolbar modern-toolbar p-[16px]">
      <div class="left">
        <el-input v-model="query.keyword" class="w-280" placeholder="搜索项目名称..." clearable>
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
        <el-select v-model="query.platform" class="w-200" clearable placeholder="选择平台">
          <el-option label="全部" value="" />
          <el-option label="Spring" value="spring" />
          <el-option label="Node" value="node" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-button type="primary" class="ml-8" @click="reload">
          <IconifyIconOnline icon="ep:search" class="mr-1" />
          搜索
        </el-button>
      </div>
      <div class="right">
        <el-button type="primary" @click="handleOpenEit({})">
          <IconifyIconOnline icon="ri:add-line" />
          新建配置
        </el-button>
      </div>
    </div>

    <ScTable class="card-grid" :url="fetchAppPageList" :col-size="4" ref="tableRef" layout="card">
      <template #empty>
        <el-empty description="暂无项目配置">
          <el-button type="primary" @click="handleOpenEit({})">新建配置</el-button>
        </el-empty>
      </template>

      <template #default="{ row: item }">
        <el-card :class="['data-card modern-card']" shadow="hover">
          <div class="card-header">
            <div class="left">
              <img v-if="item.systemDataSettingIcon" :src="item.systemDataSettingIcon" class="icon icon-img" />
              <div v-else class="icon icon-badge" :data-name="item.monitorApplicationName">
                {{ (item.monitorApplicationName || "D").slice(0, 1).toUpperCase() }}
              </div>
              <div class="title" :title="item.monitorName">
                {{ item.monitorName }}
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="meta-row">
              <IconifyIconOnline class="mr-4 text-muted" icon="ri:terminal-line" />
              <span class="label">平台</span>
              <span class="value">{{ item.monitorApplicationName || "-" }}</span>
            </div>
            <div class="meta-row">
              <IconifyIconOnline class="mr-4 text-muted" icon="ri:link-m" />
              <span class="label">名称</span>
              <el-tooltip :content="item.monitorName" placement="top" :show-after="150">
                <span class="value ellipsis">{{ item.monitorName }}</span>
              </el-tooltip>
            </div>
          </div>
          <div class="card-actions" @click.stop>
            <el-button-group>
              <el-tooltip content="编辑" placement="top" :show-after="500">
                <el-button size="small" @click.stop.prevent="handleOpenEit(item)">
                  <IconifyIconOnline icon="ri:edit-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top" :show-after="500">
                <el-button size="small" type="danger" @click.stop.prevent="handleDelete(item)">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
            </el-button-group>
          </div>
        </el-card>
      </template>
    </ScTable>
    <EditDialog :data="currentData" :visible="editDialogStatus" @success="handleSuccessOpenEit"></EditDialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import EditDialog from "./modules/EditDialog.vue";
import { fetchAppDelete, fetchAppPageList } from "@/api/monitor/app";
import { ElMessageBox } from "element-plus";

const tableRef = ref<any>();
const editDialogStatus = ref(false);
const currentData = ref<any>();

// 查询参数
const query = ref<{ keyword: string; platform: string | undefined }>({ keyword: "", platform: undefined });
const reload = () => {
  tableRef.value?.reload(query.value);
};
/**
 * 成功打开编辑
 */
const handleSuccessOpenEit = () => {
  editDialogStatus.value = false;
  tableRef.value.reload();
};
/**
 * 打开编辑
 */
const handleOpenEit = (item: any) => {
  editDialogStatus.value = true;
  currentData.value = item;
};

const handleDelete = (item: any) => {
  ElMessageBox.confirm("确定删除该配置吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    fetchAppDelete({ monitorId: item.monitorId }).then(res => {
      if (res.code === "00000") {
        tableRef.value.reload();
      }
    });
  });
};
</script>

<style scoped>
.page {
  min-height: 100%;
}

/* 顶部工具栏 */
.modern-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}
.modern-toolbar .left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.w-280 {
  width: 280px;
}
.w-200 {
  width: 200px;
}
.w-160 {
  width: 160px;
}
.ml-8 {
  margin-left: 8px;
}

/* 栅格与卡片 */
.card-grid {
  --gap: 16px;
}
.modern-card {
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
  border-radius: 14px;
  overflow: hidden;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(255, 255, 255, 1) 40%);
  position: relative;
}
/* 左侧绿色条 */
.modern-card::after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #10b981; /* emerald-500 */
}
.modern-card.is-jdbc::before {
  background: radial-gradient(220px 110px at 10% 0%, rgba(14, 165, 233, 0.1), transparent 60%);
}
.modern-card.is-redis::before {
  background: radial-gradient(220px 110px at 10% 0%, rgba(244, 63, 94, 0.1), transparent 60%);
}
.modern-card.is-zk::before {
  background: radial-gradient(220px 110px at 10% 0%, rgba(99, 102, 241, 0.1), transparent 60%);
}
.modern-card.is-default::before {
  background: radial-gradient(220px 110px at 10% 0%, rgba(100, 116, 139, 0.08), transparent 60%);
}
.modern-card::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(240px 120px at 10% 0%, rgba(14, 165, 233, 0.08), transparent 60%);
  pointer-events: none;
}
.modern-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.12);
  border-color: var(--el-color-primary-light-5);
}
/* 常驻基础阴影 */
.modern-card {
  box-shadow: 0 4px 14px rgba(17, 24, 39, 0.06);
}

/* 右下角45度背景区 */
.bg-corner {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 46%;
  height: 46%;
  background-size: cover;
  background-position: center;
  opacity: 0.12;
  clip-path: polygon(54% 0, 100% 0, 100% 100%, 0 100%);
  pointer-events: none;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 14px 0;
}
.card-header .left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.icon {
  width: 36px;
  height: 36px;
}
.icon-img {
  border-radius: 10px;
  object-fit: cover;
}
.icon-badge {
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #0ea5e9;
  background: radial-gradient(120px 80px at 10% 10%, rgba(14, 165, 233, 0.18), rgba(14, 165, 233, 0.06));
}
.title {
  font-weight: 600;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-body {
  padding: 12px 14px 0;
}
.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  line-height: 22px;
}
.meta-row .label {
  width: 60px;
  color: var(--el-text-color-regular);
}
.meta-row .value {
  flex: 1;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ellipsis {
  display: inline-block;
  max-width: 100%;
}

.card-actions {
  margin-top: 12px;
  padding: 8px 14px 14px;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.modern-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.card-actions :deep(.el-button-group) {
  width: 100%;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.card-actions :deep(.el-button-group .el-button) {
  border: none;
}
.card-actions :deep(.el-button-group .el-button:not(:last-child)) {
  border-right: 1px solid var(--el-border-color-lighter);
}

/* 按钮风格系统 */
.btn-solid-primary {
  --btn-bg: var(--el-color-primary);
  --btn-bg-hover: var(--el-color-primary-light-3);
  --btn-text: #fff;
  background: var(--btn-bg);
  color: var(--btn-text);
  border: none;
}
.btn-solid-primary:hover {
  background: var(--btn-bg-hover);
  color: #fff;
}

.btn-soft {
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
}
.btn-soft:hover {
  background: var(--el-fill-color);
}

.btn-soft-danger {
  background: rgba(244, 63, 94, 0.06);
  color: var(--el-color-danger);
  border: 1px solid rgba(244, 63, 94, 0.18);
}
.btn-soft-danger:hover {
  background: rgba(244, 63, 94, 0.1);
}

/* 空状态 */
.empty-wrap {
  padding: 60px 0;
}

/* 小色彩辅助 */
.text-muted {
  color: var(--el-text-color-secondary);
}
.mr-4 {
  margin-right: 4px;
}
</style>
