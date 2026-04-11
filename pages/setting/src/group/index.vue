<script setup lang="ts">
import {
  message,
  ScMessageBox,
} from "@repo/utils";
import type { FormInstance, FormRules } from "element-plus";
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import draggable from "vuedraggable";

import {
  fetchBatchUpdateForGroup,
  fetchDeleteForGroup,
  fetchListForGroup,
  fetchSaveOrUpdateForGroup,
  type SysSettingGroup,
} from "../api/group";

// 响应式数据
const loading = ref<boolean>(false);
const dialogVisible = ref<boolean>(false);
const isEdit = ref<boolean>(false);
const groupList = ref<SysSettingGroup[]>([]);
const formRef = ref<FormInstance>();
const sorting = ref<boolean>(false);

const queryForm = reactive({
  keyword: "",
  enable: "all",
});

const activeQuery = reactive({
  keyword: "",
  enable: "all",
});

// 拖拽防抖定时器
let dragDebounceTimer: ReturnType<typeof setTimeout> | null = null;
// 防抖延迟时间（毫秒）
const DRAG_DEBOUNCE_DELAY = 500;

// 表单数据
const formData = reactive<SysSettingGroup>({
  sysSettingGroupName: "",
  sysSettingGroupCode: "",
  sysSettingGroupIcon: "",
  sysSettingGroupEnable: true,
  sysSettingGroupRemark: "",
  sysSettingGroupUseProjectInterface: true,
});

// 表单验证规则
const formRules: FormRules = {
  sysSettingGroupName: [
    { required: true, message: "请输入组名称", trigger: "blur" },
  ],
  sysSettingGroupCode: [
    { required: true, message: "请输入组编码", trigger: "blur" },
  ],
};

const hasActiveFilter = computed(
  () => Boolean(activeQuery.keyword.trim()) || activeQuery.enable !== "all",
);

const filteredGroupList = computed(() => {
  const keyword = activeQuery.keyword.trim().toLowerCase();

  return groupList.value.filter((item) => {
    const keywordMatched = !keyword
      ? true
      : [
          item.sysSettingGroupName,
          item.sysSettingGroupCode,
          item.sysSettingGroupRemark,
        ]
          .join(" ")
          .toLowerCase()
          .includes(keyword);

    const enableMatched =
      activeQuery.enable === "all"
        ? true
        : activeQuery.enable === "enabled"
          ? Boolean(item.sysSettingGroupEnable)
          : !item.sysSettingGroupEnable;

    return keywordMatched && enableMatched;
  });
});

/**
 * 显示加载状态
 */
const showLoading = (): void => {
  loading.value = true;
};

/**
 * 隐藏加载状态
 */
const hideLoading = (): void => {
  loading.value = false;
};

/**
 * 获取配置组列表
 */
const getGroupList = async (): Promise<void> => {
  try {
    showLoading();
    const { data } = await fetchListForGroup({});
    groupList.value = data || [];
    await nextTick();
  } catch (error) {
    message("获取组列表失败", { type: "error" });
  } finally {
    hideLoading();
  }
};

/**
 * 拖拽结束处理（防抖）
 * 延迟触发，多次拖拽只提交最后一次
 */
const handleDragEnd = (): void => {
  // 清除之前的定时器
  if (dragDebounceTimer) {
    clearTimeout(dragDebounceTimer);
  }

  // 设置新的延迟定时器
  dragDebounceTimer = setTimeout(async () => {
    try {
      const updatedList = groupList.value.map((item, index) => ({
        ...item,
        sysSettingGroupSort: index + 1,
      }));
      await handleBatchUpdate(updatedList);
    } catch (error) {
      message("拖拽排序失败", { type: "error" });
      await getGroupList();
    }
  }, DRAG_DEBOUNCE_DELAY);
};

/**
 * 批量更新排序
 * @param updatedList 更新后的列表
 */
const handleBatchUpdate = async (
  updatedList: SysSettingGroup[],
): Promise<void> => {
  try {
    sorting.value = true;
    showLoading();
    await fetchBatchUpdateForGroup(updatedList);
    message("排序更新成功", { type: "success" });
  } catch (error) {
    message("排序更新失败", { type: "error" });
    await getGroupList();
  } finally {
    sorting.value = false;
    hideLoading();
  }
};

const handleSearch = (): void => {
  activeQuery.keyword = queryForm.keyword;
  activeQuery.enable = queryForm.enable;
};

const handleResetSearch = async (): Promise<void> => {
  queryForm.keyword = "";
  queryForm.enable = "all";
  activeQuery.keyword = "";
  activeQuery.enable = "all";
  await getGroupList();
};

/**
 * 打开新增对话框
 */
const handleAdd = (): void => {
  isEdit.value = false;
  resetForm();
  dialogVisible.value = true;
};

/**
 * 打开编辑对话框
 * @param row 配置组数据
 */
const handleEdit = (row: SysSettingGroup): void => {
  isEdit.value = true;
  Object.assign(formData, row);
  dialogVisible.value = true;
};

/**
 * 删除配置组
 * @param row 配置组数据
 */
const handleDelete = async (row: SysSettingGroup): Promise<void> => {
  try {
    await ScMessageBox.confirm(
      `确定要删除组 "${row.sysSettingGroupName}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    );

    showLoading();
    const res = await fetchDeleteForGroup({
      sysSettingGroupId: row.sysSettingGroupId!,
    });

    if (res.code === "00000") {
      message("删除成功", { type: "success" });
      await getGroupList();
    } else {
      message(res.msg || "删除失败", { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      message("删除失败", { type: "error" });
    }
  } finally {
    hideLoading();
  }
};

/**
 * 保存配置组
 */
const handleSave = async (): Promise<void> => {
  try {
    await formRef.value?.validate();

    showLoading();
    const res = await fetchSaveOrUpdateForGroup(formData);

    if (res.code === "00000") {
      message(isEdit.value ? "更新成功" : "创建成功", { type: "success" });
      handleClose();
      await nextTick();
      await getGroupList();
    } else {
      message(res.msg || "保存失败", { type: "error" });
    }
  } catch (error) {
    message("保存失败", { type: "error" });
  } finally {
    hideLoading();
  }
};

/**
 * 重置表单数据
 */
const resetForm = (): void => {
  Object.assign(formData, {
    sysSettingGroupId: undefined,
    sysSettingGroupName: "",
    sysSettingGroupCode: "",
    sysSettingGroupIcon: "",
    sysSettingGroupEnable: true,
    sysSettingGroupRemark: "",
    sysSettingGroupUseProjectInterface: true,
  });
  formRef.value?.clearValidate();
};

/**
 * 关闭对话框
 */
const handleClose = (): void => {
  dialogVisible.value = false;
  resetForm();
};

// 组件挂载时获取数据
onMounted(async (): Promise<void> => {
  await getGroupList();
});

// 组件卸载时清理定时器
onUnmounted((): void => {
  if (dragDebounceTimer) {
    clearTimeout(dragDebounceTimer);
    dragDebounceTimer = null;
  }
});
</script>

<template>
  <div class="group-management system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <IconifyIconOnline icon="ri:folder-settings-line" />
        </div>
        <div class="header-info">
          <h1 class="header-title">配置组管理</h1>
          <p class="header-desc">管理系统配置分组，支持拖拽排序</p>
        </div>
      </div>
      <div class="header-actions">
        <ScButton
          class="refresh-btn"
          :loading="loading && !sorting"
          @click="getGroupList"
        >
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </ScButton>
        <ScButton type="primary" class="add-btn" @click="handleAdd">
          <IconifyIconOnline icon="ri:add-line" />
          新增配置组
        </ScButton>
      </div>
    </div>

    <div class="filter-toolbar">
      <div class="filter-toolbar__fields">
        <ScInput
          v-model="queryForm.keyword"
          clearable
          placeholder="按组名称、编码、描述过滤"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
        </ScInput>

        <ScSelect v-model="queryForm.enable" placeholder="启用状态">
          <ScOption label="全部状态" value="all" />
          <ScOption label="仅启用" value="enabled" />
          <ScOption label="仅禁用" value="disabled" />
        </ScSelect>
      </div>

      <div class="filter-toolbar__actions">
        <ScButton type="primary" @click="handleSearch">
          <IconifyIconOnline icon="ri:search-line" />
          查询
        </ScButton>
        <ScButton @click="handleResetSearch">
          <IconifyIconOnline icon="ri:eraser-line" />
          重置
        </ScButton>
      </div>
    </div>

    <!-- 卡片容器 -->
    <div class="card-section">
      <transition name="sorting-banner">
        <div v-if="sorting" class="sorting-banner">
          <IconifyIconOnline
            icon="ri:loader-4-line"
            class="sorting-banner__icon"
          />
          <div>
            <strong>正在同步最新排序</strong>
            <p>拖拽完成后立即调用真实批量更新接口，请等待回流结果。</p>
          </div>
        </div>
      </transition>

      <div v-if="hasActiveFilter" class="filter-summary">
        <span
          >当前结果 {{ filteredGroupList.length }} /
          {{ groupList.length }}</span
        >
        <span>筛选开启时仅支持查看与编辑，清空筛选后可继续拖拽排序。</span>
      </div>

      <!-- 骨架屏 -->
      <div v-if="loading && !sorting" class="skeleton-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <ScSkeleton :rows="3" animated />
        </div>
      </div>

      <!-- 内容区域 -->
      <template v-else>
        <draggable
          v-if="filteredGroupList.length > 0 && !hasActiveFilter"
          v-model="groupList"
          item-key="sysSettingGroupId"
          handle=".drag-handle"
          :animation="200"
          ghost-class="sortable-ghost"
          chosen-class="sortable-chosen"
          drag-class="sortable-drag"
          class="card-grid"
          :class="{ 'is-sorting': sorting }"
          @end="handleDragEnd"
        >
          <template #item="{ element: item, index }">
            <div
              class="group-card"
              :class="{ disabled: !item.sysSettingGroupEnable }"
            >
              <!-- 顶部装饰条 -->
              <div class="card-accent" />

              <!-- 卡片头部 -->
              <div class="card-header">
                <div class="card-icon-wrap">
                  <IconifyIconOnline
                    :icon="item.sysSettingGroupIcon || 'ri:folder-line'"
                  />
                </div>
                <div class="card-meta">
                  <h3 class="card-title">{{ item.sysSettingGroupName }}</h3>
                  <span class="card-code">{{ item.sysSettingGroupCode }}</span>
                </div>
                <div class="card-status">
                  <ScTag
                    :type="item.sysSettingGroupEnable ? 'success' : 'info'"
                    size="small"
                    effect="light"
                  >
                    {{ item.sysSettingGroupEnable ? "启用" : "禁用" }}
                  </ScTag>
                </div>
              </div>

              <!-- 卡片内容 -->
              <div class="card-body">
                <p class="card-desc">
                  {{ item.sysSettingGroupRemark || "暂无描述信息" }}
                </p>
              </div>

              <!-- 卡片底部 -->
              <div class="card-footer">
                <div class="footer-meta">
                  <div class="drag-handle">
                    <IconifyIconOnline icon="ri:draggable" />
                    <span>拖拽排序</span>
                  </div>
                  <span class="card-order">
                    顺序 {{ item.sysSettingGroupSort ?? index + 1 }}
                  </span>
                </div>
                <div class="card-actions">
                  <ScButton
                    class="action-btn edit"
                    size="small"
                    @click="handleEdit(item)"
                  >
                    <IconifyIconOnline icon="ri:edit-line" />
                    编辑
                  </ScButton>
                  <ScButton
                    class="action-btn delete"
                    size="small"
                    @click="handleDelete(item)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-line" />
                    删除
                  </ScButton>
                </div>
              </div>
            </div>
          </template>
        </draggable>

        <div
          v-else-if="filteredGroupList.length > 0"
          class="card-grid card-grid--static"
        >
          <div
            v-for="(item, index) in filteredGroupList"
            :key="item.sysSettingGroupId || item.sysSettingGroupCode || index"
            class="group-card"
            :class="{ disabled: !item.sysSettingGroupEnable }"
          >
            <div class="card-accent" />

            <div class="card-header">
              <div class="card-icon-wrap">
                <IconifyIconOnline
                  :icon="item.sysSettingGroupIcon || 'ri:folder-line'"
                />
              </div>
              <div class="card-meta">
                <h3 class="card-title">{{ item.sysSettingGroupName }}</h3>
                <span class="card-code">{{ item.sysSettingGroupCode }}</span>
              </div>
              <div class="card-status">
                <ScTag
                  :type="item.sysSettingGroupEnable ? 'success' : 'info'"
                  size="small"
                  effect="light"
                >
                  {{ item.sysSettingGroupEnable ? "启用" : "禁用" }}
                </ScTag>
              </div>
            </div>

            <div class="card-body">
              <p class="card-desc">
                {{ item.sysSettingGroupRemark || "暂无描述信息" }}
              </p>
            </div>

            <div class="card-footer">
              <div class="footer-meta">
                <div class="drag-handle drag-handle--disabled">
                  <IconifyIconOnline icon="ri:filter-3-line" />
                  <span>筛选中，已暂停拖拽</span>
                </div>
                <span class="card-order">
                  顺序 {{ item.sysSettingGroupSort ?? index + 1 }}
                </span>
              </div>
              <div class="card-actions">
                <ScButton
                  class="action-btn edit"
                  size="small"
                  @click="handleEdit(item)"
                >
                  <IconifyIconOnline icon="ri:edit-line" />
                  编辑
                </ScButton>
                <ScButton
                  class="action-btn delete"
                  size="small"
                  @click="handleDelete(item)"
                >
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  删除
                </ScButton>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <div class="empty-icon">
            <IconifyIconOnline icon="ri:folder-add-line" />
          </div>
          <h3 class="empty-title">暂无配置组</h3>
          <p class="empty-desc">点击下方按钮创建第一个配置组</p>
          <ScButton type="primary" class="empty-btn" @click="handleAdd">
            <IconifyIconOnline icon="ri:add-line" />
            创建配置组
          </ScButton>
        </div>
      </template>
    </div>

    <!-- 新增/编辑对话框 -->
    <sc-dialog
      v-model="dialogVisible"
      width="560px"
      :show-close="false"
      class="group-dialog"
      @close="handleClose"
    >
      <!-- 自定义头部 -->
      <template #header>
        <div class="dialog-header">
          <div class="dialog-icon">
            <IconifyIconOnline
              :icon="isEdit ? 'ri:edit-line' : 'ri:add-line'"
            />
          </div>
          <div class="dialog-title-info">
            <h3>{{ isEdit ? "编辑配置组" : "新增配置组" }}</h3>
            <p>{{ isEdit ? "修改配置组信息" : "创建新的配置分组" }}</p>
          </div>
        </div>
      </template>

      <ScForm
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        class="group-form"
      >
        <div class="group-form-grid">
          <ScFormItem
            label="组名称"
            prop="sysSettingGroupName"
            class="group-form-item"
          >
            <ScInput
              v-model="formData.sysSettingGroupName"
              placeholder="请输入组名称"
              clearable
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:text" class="input-icon" />
              </template>
            </ScInput>
            <div class="form-tip">用于主页与抽屉中的展示标题</div>
          </ScFormItem>
          <ScFormItem
            label="组编码"
            prop="sysSettingGroupCode"
            class="group-form-item"
          >
            <ScInput
              v-model="formData.sysSettingGroupCode"
              placeholder="请输入组编码（唯一标识）"
              clearable
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:code-line" class="input-icon" />
              </template>
            </ScInput>
            <div class="form-tip">建议使用英文编码，便于接口与过滤条件复用</div>
          </ScFormItem>
          <ScFormItem label="图标" class="group-form-item">
            <ScInput
              v-model="formData.sysSettingGroupIcon"
              placeholder="如：ri:settings-line"
              clearable
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:palette-line" class="input-icon" />
              </template>
              <template #suffix>
                <IconifyIconOnline
                  v-if="formData.sysSettingGroupIcon"
                  :icon="formData.sysSettingGroupIcon"
                  class="icon-preview"
                />
              </template>
            </ScInput>
            <div class="form-tip">留空时使用默认文件夹图标</div>
          </ScFormItem>
          <ScFormItem label="启用状态" class="group-form-item">
            <div class="switch-panel">
              <div class="switch-panel__copy">
                <strong>{{
                  formData.sysSettingGroupEnable ? "当前已启用" : "当前已禁用"
                }}</strong>
                <span>关闭后该远程组不会在系统设置主页展示</span>
              </div>
              <ScSwitch
                v-model="formData.sysSettingGroupEnable"
                active-text="启用"
                inactive-text="禁用"
                inline-prompt
              />
            </div>
          </ScFormItem>
          <ScFormItem label="项目接口" class="group-form-item">
            <div class="switch-panel">
              <div class="switch-panel__copy">
                <strong>{{
                  formData.sysSettingGroupUseProjectInterface
                    ? "走项目接口"
                    : "走系统统一接口"
                }}</strong>
                <span>开启后使用项目组接口管理，关闭则走系统默认接口</span>
              </div>
              <ScSwitch
                v-model="formData.sysSettingGroupUseProjectInterface"
                active-text="是"
                inactive-text="否"
                inline-prompt
              />
            </div>
          </ScFormItem>
          <ScFormItem
            label="描述"
            class="group-form-item group-form-item--wide"
          >
            <ScInput
              v-model="formData.sysSettingGroupRemark"
              type="textarea"
              :rows="3"
              placeholder="请输入组描述"
            />
            <div class="form-tip">补充该分组的用途、启用范围和维护说明</div>
          </ScFormItem>
        </div>
      </ScForm>

      <template #footer>
        <div class="dialog-footer">
          <ScButton class="cancel-btn" @click="handleClose">
            <IconifyIconOnline icon="ri:close-line" />
            取消
          </ScButton>
          <ScButton type="primary" class="save-btn" @click="handleSave">
            <IconifyIconOnline icon="ri:save-line" />
            {{ isEdit ? "保存更改" : "创建" }}
          </ScButton>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<style scoped lang="scss">
.group-management {
  padding: 24px;
  min-height: 100%;
  background: linear-gradient(
    135deg,
    rgba(248, 250, 252, 0.8) 0%,
    rgba(241, 245, 249, 0.6) 100%
  );
}

// 页面头部
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  margin-bottom: 24px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px 16px 0 0;
  }

  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 26px;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
}

.header-info {
  .header-title {
    margin: 0 0 4px 0;
    font-size: 22px;
    font-weight: 700;
    color: #1e293b;
  }

  .header-desc {
    margin: 0;
    font-size: 14px;
    color: #64748b;
  }
}

.header-actions {
  display: flex;
  gap: 12px;
}

.filter-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  margin-bottom: 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.96) 0%,
    rgba(248, 250, 252, 0.92) 100%
  );
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 16px;
  box-shadow: 0 8px 24px -24px rgba(15, 23, 42, 0.3);
}

.filter-toolbar__fields {
  display: grid;
  flex: 1;
  grid-template-columns: minmax(260px, 1.6fr) minmax(180px, 0.7fr);
  gap: 12px;
}

.filter-toolbar__actions {
  display: flex;
  gap: 12px;
}

.refresh-btn {
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 500;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: white;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(102, 126, 234, 0.4);
    color: #667eea;
  }
}

.add-btn {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
  }
}

// 卡片区域
.card-section {
  min-height: 400px;
  position: relative;
}

.sorting-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  margin-bottom: 18px;
  border: 1px solid rgba(102, 126, 234, 0.18);
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.1) 0%,
    rgba(255, 255, 255, 0.96) 100%
  );
  box-shadow: 0 14px 32px -26px rgba(102, 126, 234, 0.34);

  strong {
    display: block;
    margin-bottom: 2px;
    color: #334155;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
}

.sorting-banner__icon {
  font-size: 22px;
  color: #667eea;
  animation: group-spin 0.9s linear infinite;
}

.filter-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #64748b;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.skeleton-card {
  padding: 24px;
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;

  &.is-sorting {
    .group-card::after {
      opacity: 1;
    }
  }
}

.card-grid--static {
  .group-card {
    min-height: 100%;
  }
}

// 配置组卡片
.group-card {
  position: relative;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.95) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  overflow: hidden;
  transition: all 0.3s ease;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      110deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.34) 42%,
      rgba(102, 126, 234, 0.1) 52%,
      rgba(255, 255, 255, 0) 62%
    );
    opacity: 0;
    pointer-events: none;
    transform: translateX(-120%);
    animation: group-card-refresh 1s ease-in-out infinite;
  }

  &:hover {
    border-color: rgba(102, 126, 234, 0.4);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    transform: translateY(-3px);

    .drag-handle {
      color: #667eea;
    }
  }

  &.disabled {
    opacity: 0.7;

    .card-accent {
      background: linear-gradient(90deg, #94a3b8 0%, #cbd5e1 100%);
    }
  }
}

.card-accent {
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
}

.card-icon-wrap {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.12) 0%,
    rgba(118, 75, 162, 0.08) 100%
  );
  color: #667eea;
  font-size: 22px;
}

.card-meta {
  flex: 1;
  min-width: 0;

  .card-title {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-code {
    font-size: 12px;
    color: #64748b;
    font-family: "Monaco", "Menlo", monospace;
  }
}

.card-status {
  :deep(.el-tag) {
    border-radius: 6px;
    font-weight: 500;
  }
}

.card-body {
  padding: 0 20px 16px;

  .card-desc {
    margin: 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.6;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: rgba(248, 250, 252, 0.6);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
}

.footer-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.drag-handle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #94a3b8;
  cursor: grab;
  transition: color 0.3s ease;
  user-select: none;

  &:active {
    cursor: grabbing;
  }
}

.drag-handle--disabled {
  cursor: default;
  color: #64748b;

  &:active {
    cursor: default;
  }
}

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  border-radius: 8px;
  font-weight: 500;
  padding: 6px 12px;
  border: none;
  transition: all 0.3s ease;

  &.edit {
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;

    &:hover {
      background: rgba(102, 126, 234, 0.2);
    }
  }

  &.delete {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;

    &:hover {
      background: rgba(239, 68, 68, 0.2);
    }
  }
}

.card-order {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.68);
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.empty-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.12) 0%,
    rgba(118, 75, 162, 0.08) 100%
  );
  color: #667eea;
  font-size: 36px;
  margin-bottom: 20px;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #334155;
}

.empty-desc {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #64748b;
}

.empty-btn {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

// 拖拽样式
.sortable-ghost {
  opacity: 0.4;
  background: rgba(102, 126, 234, 0.08) !important;
  border: 2px dashed #667eea !important;
}

.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.25) !important;
  z-index: 10;
}

.sortable-drag {
  transform: scale(1.02) rotate(2deg);
  box-shadow: 0 16px 40px rgba(102, 126, 234, 0.3) !important;
}

.sorting-banner-enter-active,
.sorting-banner-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.sorting-banner-enter-from,
.sorting-banner-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

// 对话框
.group-dialog {
  :deep(.el-dialog) {
    width: min(720px, calc(100vw - 24px)) !important;
    max-height: min(780px, calc(100vh - 32px));
    margin: 16px auto !important;
    border-radius: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 20px 22px 18px;
    overflow-y: auto;
  }

  :deep(.el-dialog__footer) {
    padding: 0;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  background: linear-gradient(
    135deg,
    rgba(102, 126, 234, 0.08) 0%,
    rgba(118, 75, 162, 0.05) 100%
  );
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.dialog-icon {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 20px;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.28);
}

.dialog-title-info {
  h3 {
    margin: 0 0 4px 0;
    font-size: 17px;
    font-weight: 700;
    color: #1e293b;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #64748b;
  }
}

.group-form {
  :deep(.el-form-item) {
    margin-bottom: 0;
  }

  :deep(.el-form-item__label) {
    padding: 0 0 8px;
    font-weight: 600;
    font-size: 13px;
    line-height: 1.25;
    color: #334155;
  }

  :deep(.el-form-item__content) {
    display: flex;
    min-width: 0;
    flex-direction: column;
    align-items: stretch;
    margin-left: 0 !important;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 14px;
    background: linear-gradient(180deg, #fbfdff 0%, #f6faff 100%);
    box-shadow: 0 0 0 1px rgba(191, 219, 254, 0.92) inset;
    transition: all 0.3s ease;
  }

  :deep(.el-input__wrapper:hover),
  :deep(.el-textarea__inner:hover) {
    box-shadow: 0 0 0 1px rgba(96, 165, 250, 0.95) inset;
  }

  :deep(.el-input__wrapper.is-focus),
  :deep(.el-textarea__inner:focus) {
    box-shadow:
      0 0 0 1px rgba(37, 99, 235, 0.92) inset,
      0 0 0 4px rgba(191, 219, 254, 0.4);
  }
}

.group-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 18px;
  align-items: start;
}

.group-form-item {
  min-width: 0;
}

.group-form-item--wide {
  grid-column: 1 / -1;
}

.input-icon {
  color: #94a3b8;
}

.icon-preview {
  font-size: 18px;
  color: #667eea;
}

.form-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.switch-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(191, 219, 254, 0.88);
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.92) 0%,
    rgba(239, 246, 255, 0.86) 100%
  );
}

.switch-panel__copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;

  strong {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
  }

  span {
    font-size: 12px;
    line-height: 1.6;
    color: #64748b;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px 18px;
  background: rgba(248, 250, 252, 0.8);
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}

.cancel-btn {
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 500;
  border: 1px solid rgba(226, 232, 240, 0.8);
  background: white;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(100, 116, 139, 0.4);
  }
}

.save-btn {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
  }
}

// 响应式
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .filter-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-toolbar__fields {
    grid-template-columns: 1fr;
  }

  .header-actions {
    width: 100%;

    .el-button {
      flex: 1;
    }
  }

  .filter-toolbar__actions {
    width: 100%;

    .el-button {
      flex: 1;
    }
  }

  .card-grid,
  .skeleton-grid {
    grid-template-columns: 1fr;
  }

  .group-form-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .switch-panel {
    flex-direction: column;
    align-items: flex-start;
  }
}

@keyframes group-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes group-card-refresh {
  0% {
    transform: translateX(-120%);
  }

  100% {
    transform: translateX(120%);
  }
}
</style>
