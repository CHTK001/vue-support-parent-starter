<template>
  <div class="software-mall-container">
    <el-container>
      <!-- 左侧分类菜单 -->
      <el-aside width="220px" class="category-sidebar">
        <h3 class="sidebar-title">软件分类</h3>
        <el-menu :default-active="searchParams.category || 'all'" class="category-menu" @select="handleCategorySelect">
          <el-menu-item index="all">
            <IconifyIconOnline icon="ep:menu" class="mr-2" />
            全部软件
          </el-menu-item>
          <el-menu-item index="database">
            <IconifyIconOnline :icon="getCategoryIcon('database')" class="mr-2" />
            数据库
          </el-menu-item>
          <el-menu-item index="web_server">
            <IconifyIconOnline :icon="getCategoryIcon('web_server')" class="mr-2" />
            Web服务器
          </el-menu-item>
          <el-menu-item index="development">
            <IconifyIconOnline :icon="getCategoryIcon('development')" class="mr-2" />
            开发工具
          </el-menu-item>
          <el-menu-item index="monitoring">
            <IconifyIconOnline :icon="getCategoryIcon('monitoring')" class="mr-2" />
            监控工具
          </el-menu-item>
          <el-menu-item index="container">
            <IconifyIconOnline :icon="getCategoryIcon('container')" class="mr-2" />
            容器
          </el-menu-item>
          <el-menu-item index="other">
            <IconifyIconOnline :icon="getCategoryIcon('other')" class="mr-2" />
            其他
          </el-menu-item>
          <el-divider />
          <el-menu-item index="installed">
            <IconifyIconOnline icon="ep:check" class="mr-2" />
            已安装
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 右侧内容区 -->
      <el-container class="content-container">
        <!-- 顶部搜索和操作区 -->
        <el-header class="content-header">
          <div class="flex justify-between items-center w-full">
            <div class="search-filter flex items-center gap-4">
              <el-input v-model="searchParams.keyword" class="!w-[280px] search-input" placeholder="搜索软件名称" clearable @input="handleSearch">
                <template #prefix>
                  <IconifyIconOnline icon="ep:search" class="search-icon" />
                </template>
              </el-input>
              <el-select v-model="searchParams.sort" class="!w-[120px]" placeholder="排序方式" @change="handleSearch">
                <el-option label="默认排序" value="default" />
                <el-option label="最新" value="newest" />
                <el-option label="最热" value="popular" />
          </el-select>
        </div>
            <el-button type="primary" class="add-button" @click="handleAdd">
              <IconifyIconOnline icon="ep:plus" />新增软件
        </el-button>
          </div>
      </el-header>

        <!-- 主内容区 -->
        <el-main class="content-main nopadding">
          <div class="current-category">
            <h2 class="category-title">{{ getCurrentCategoryName() }}</h2>
            <p class="category-desc">{{ getCurrentCategoryDesc() }}</p>
          </div>

          <ScTable ref="tableRef" :url="fetchSoftServicePage" layout="card" cardLayout="default" v-model:page="page" v-model:params="searchParams" class="soft-table">
            <template #default="{ row }">
              <div class="app-wrapper">
                <div class="media-content">
                  <div class="app-logo">
                    <el-image :src="row.softServiceLogo" fit="contain" :alt="row.softServiceName">
                    <template #error>
                        <div class="app-logo-fallback">
                          <IconifyIconOnline icon="ep:picture" />
                      </div>
                    </template>
                  </el-image>
                </div>
                  
                  <div class="app-content">
                    <h3 class="app-title">{{ row.softServiceName }}</h3>
                    <div class="app-tags">
                      <el-tag size="small" type="success">v{{ row.softServiceVersion }}</el-tag>
                      <el-tag size="small" type="primary" class="ml-2">{{ getCategoryName(row.softServiceCategory) }}</el-tag>
                    </div>
                    
                    <div class="app-desc">{{ row.softServiceRemark || '无' }}</div>
                    
                    <div class="app-footer">
                      <div class="app-stats">
                        <span class="app-stat-item">
                          <IconifyIconOnline icon="ep:download" class="mr-1" />
                          <span>{{ row.installCount }}</span>
                        </span>
                        <span class="app-stat-item" @click="handleFavorite(row)">
                          <IconifyIconOnline icon="ep:star" class="mr-1" />
                          <span>{{ row.favoriteCount }}</span>
                        </span>
                      </div>
                      <div class="app-actions">
                        <el-button size="small" type="primary" class="install-btn" @click="handleInstall(row)">
                          <IconifyIconOnline icon="ep:download" class="mr-1" />安装
                        </el-button>
                        <el-dropdown trigger="click" @command="(command) => handleCommand(command, row)">
                          <el-button size="small" class="more-btn">
                            <IconifyIconOnline icon="ep:more-filled" />
                          </el-button>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item command="detail">
                                <IconifyIconOnline icon="ri:info-card-line" class="mr-1" />详情
                              </el-dropdown-item>
                              <el-dropdown-item command="edit">
                                <IconifyIconOnline icon="ep:edit" class="mr-1" />编辑
                              </el-dropdown-item>
                              <el-dropdown-item command="delete" divided>
                                <IconifyIconOnline icon="ep:delete" class="mr-1" />删除
                              </el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                  </div>
                  </div>
                </div>
              </div>
            </template>
        </ScTable>
      </el-main>
      </el-container>
    </el-container>

    <!-- 安装设备选择抽屉 -->
    <DeviceSelectDrawer 
      ref="deviceSelectDrawerRef"
      v-model="deviceDrawerVisible" 
      :software="currentSoftware" 
      @install="handleDeviceSelect"
      @cancel="deviceDrawerVisible = false"
    />

    <!-- 安装进度抽屉 -->
    <install-progress-drawer v-if="installDrawerVisible" v-model="installDrawerVisible" :software="currentSoftware" :devices="installDevices" @finish="handleInstallFinish" />

    <!-- 软件详情对话框 -->
    <SoftDetailDialog
      v-model="detailDialogVisible"
      :software="currentSoftware"
      @install="handleInstall"
      @close="detailDialogVisible = false"
    />

    <!-- 软件表单对话框 -->
    <SoftForm v-model="formVisible" :is-edit="isEdit" :software="currentSoftware" @submit="handleSubmit" @cancel="formVisible = false" />
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import { fetchSoftServiceFavorite, fetchSoftServicePage, fetchSoftServiceDelete, fetchSoftServiceSave, fetchSoftServiceUpdate, type SoftService, type PartialSoftService } from "@/api/soft";
import { fetchSoftServiceInstall } from "@/api/soft/install";
import InstallProgressDrawer from "./components/InstallProgressDrawer.vue";
import SoftForm from "./components/SoftForm.vue";
import DeviceSelectDrawer from "./components/DeviceSelectDrawer.vue";
import SoftDetailDialog from "./components/SoftDetailDialog.vue";

// 表格引用
const tableRef = ref<InstanceType<typeof ScTable>>();
const deviceSelectDrawerRef = ref<InstanceType<typeof DeviceSelectDrawer>>();

interface TableData {
  list: SoftService[];
}

// 分页和搜索参数
const page = reactive({
  pageNum: 1,
  pageSize: 12,
  total: 0,
});

const searchParams = reactive({
  keyword: "",
  softServiceCategory: "",
  sort: "default",
});

// 表格数据
const tableData = reactive<TableData>({
  list: [],
});

// 设备相关
const deviceDrawerVisible = ref(false);
const installDevices = ref<string[]>([]);

// 表单控制
const formVisible = ref(false);
const isEdit = ref(false);
const currentSoftware = ref<PartialSoftService>({});

// 安装进度
const installDrawerVisible = ref(false);

// 软件详情
const detailDialogVisible = ref(false);

// 软件分类
const categories = [
  { label: "全部", value: "all" },
  { label: "数据库", value: "database" },
  { label: "Web服务器", value: "web_server" },
  { label: "开发工具", value: "development" },
  { label: "监控工具", value: "monitoring" },
  { label: "容器", value: "container" },
  { label: "其他", value: "other" },
];

// 获取分类图标
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "database":
      return "ep:data-line";
    case "web_server":
      return "ep:connection";
    case "development":
      return "ri:tools-line";
    case "monitoring":
      return "ep:monitor";
    case "container":
      return "ep:box";
    case "other":
      return "ep:more-filled";
    default:
      return "ep:menu";
  }
};

// 获取当前分类名称
const getCurrentCategoryName = () => {
  if (searchParams.category === "installed") {
    return "已安装软件";
  }
  if (!searchParams.category) {
    return "全部软件";
  }
  const found = categories.find((item) => item.value === searchParams.category);
  return found ? found.label : "全部软件";
};

// 获取当前分类描述
const getCurrentCategoryDesc = () => {
  if (searchParams.category === "installed") {
    return "已在系统中安装的所有软件";
  }

  switch (searchParams.category) {
    case "database":
      return "各类数据库软件，包括关系型和非关系型数据库";
    case "web_server":
      return "Web服务器和反向代理服务器";
    case "development":
      return "开发工具和环境";
    case "monitoring":
      return "系统和应用监控工具";
    case "container":
      return "容器和容器管理平台";
    case "other":
      return "其他类型软件";
    default:
      return "全部可用软件";
  }
};

// 处理分类选择
const handleCategorySelect = (index: string) => {
  searchParams.softServiceCategory = index === "all" ? "" : index;
  page.pageNum = 1;
  refreshTable();
};

// 方法定义
const handleAdd = () => {
  isEdit.value = false;
  currentSoftware.value = {};
  formVisible.value = true;
};

const handleEdit = (soft: SoftService) => {
  isEdit.value = true;
  currentSoftware.value = { ...soft };
  formVisible.value = true;
};

const handleDelete = async (soft: SoftService) => {
  try {
    await ElMessageBox.confirm(`确定要删除软件 "${soft.softServiceName}" 吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await fetchSoftServiceDelete({ softServiceId: soft.softServiceId });
    message.success("删除成功");
    refreshTable();
  } catch (error) {
    console.error("删除失败:", error);
    message.error(error instanceof Error ? error.message : "删除失败");
  }
};

// 处理更多操作命令
const handleCommand = (command: string, soft: SoftService) => {
  switch (command) {
    case "detail":
      showDetail(soft);
      break;
    case "edit":
      handleEdit(soft);
      break;
    case "delete":
      handleDelete(soft);
      break;
  }
};

const handleSearch = () => {
  page.pageNum = 1;
  refreshTable();
};

const refreshTable = () => {
  // ScTable 组件会自动刷新
  tableRef.value?.refresh();
};

const handleSubmit = async (formData: PartialSoftService) => {
  try {
    // 确保使用正确的字段名
    const dataToSubmit = {
      ...formData,
      softServiceId: isEdit.value ? currentSoftware.value.softServiceId : undefined,
    };
    
    if (isEdit.value) {
      await fetchSoftServiceUpdate(dataToSubmit);
      message.success("更新成功");
    } else {
      await fetchSoftServiceSave(dataToSubmit);
      message.success("创建成功");
    }
    formVisible.value = false;
    refreshTable();
  } catch (error) {
    console.error("操作失败:", error);
    message.error(error instanceof Error ? error.message : "操作失败");
  }
};

const handleInstall = (soft: SoftService) => {
  currentSoftware.value = soft as PartialSoftService;
  deviceDrawerVisible.value = true;
};

const showDetail = (soft: SoftService) => {
  currentSoftware.value = soft as PartialSoftService;
  detailDialogVisible.value = true;
};

const proceedInstall = async () => {
  try {
    // 开始安装
    await fetchSoftServiceInstall({
      softServiceId: currentSoftware.value.softServiceId!,
      sshIds: installDevices.value,
    });
  } catch (error) {
    console.error("安装失败:", error);
    message.error(error instanceof Error ? error.message : "安装启动失败");
    installDrawerVisible.value = false;
    deviceSelectDrawerRef.value?.handleCancel();
  }
};

const handleInstallFinish = () => {
  installDrawerVisible.value = false;
  installDevices.value = [];
  refreshTable();
};

const handleFavorite = (row: any) => {
  fetchSoftServiceFavorite(row).then(res => {
    message.success("收藏成功")
  })
}

const getCategoryName = (category: string) => {
  if (!category) return "未分类";
  const found = categories.find((item) => item.value === category);
  return found ? found.label : "未知";
};

const handleDeviceSelect = (devices: string[]) => {
  deviceDrawerVisible.value = false;
  installDevices.value = devices;
  installDrawerVisible.value = true;
  
  // 开始安装
  proceedInstall();
};

// 监听路由参数
const route = useRoute();
const sshId = ref(route.query.sshId as string);

// 返回列表页
const goBack = () => {
  window.history.back();
};
</script>

<style lang="scss" scoped>
.software-mall-container {
  height: 100%;
  
  .el-container {
    height: 100%;
  }
}

// 左侧分类菜单
.category-sidebar {
  background-color: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-light);
  height: 100%;
  overflow-y: auto;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  .sidebar-title {
  padding: 20px;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-light);
}

  .category-menu {
    border-right: none;
    
    .el-menu-item {
      height: 50px;
      line-height: 50px;
      
      &.is-active {
        background-color: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
        font-weight: 500;
        
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 4px;
          background-color: var(--el-color-primary);
        }
      }
      
      &:hover:not(.is-active) {
        background-color: var(--el-fill-color-light);
      }
    }
  }
}

// 右侧内容区
.content-container {
  flex-direction: column;
  height: 100%;
  background-color: var(--el-bg-color-page, #f5f7fa);
}

.content-header {
  border-bottom: 1px solid var(--el-border-color-light);
  height: auto;
  background-color: var(--el-bg-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
  
  .search-input {
    :deep(.el-input__wrapper) {
      padding-left: 12px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      transition: all 0.3s;
      
      &:hover, &:focus, &.is-focus {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
    }
    
    .search-icon {
      color: var(--el-text-color-secondary);
      font-size: 18px;
      margin-right: 6px;
    }
  }
  
  .add-button {
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 500;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

.content-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .current-category {
    background-color: var(--el-bg-color);
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    
    .category-title {
      font-size: 22px;
      font-weight: 600;
      margin: 0 0 12px;
      color: var(--el-text-color-primary);
      display: flex;
      align-items: center;
      
      &::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 20px;
        background-color: var(--el-color-primary);
        margin-right: 12px;
        border-radius: 2px;
      }
}

    .category-desc {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0 0 0 16px;
      line-height: 1.6;
    }
  }
}

.soft-table {
  margin-top: 20px;

  :deep(.el-card) {
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }
  }
}

.app-wrapper {
  height: 200px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);
    
    &::before {
      height: 4px;
    }
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0;
    background-color: var(--el-color-primary);
    transition: height 0.3s ease;
    z-index: 1;
  }
  
  .media-content {
    display: flex;
    height: 100%;
  }
  
  .app-logo {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin: 20px;
    flex-shrink: 0;
    
    .el-image {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      overflow: hidden;
    }
  }
  
  .app-content {
    flex: 1;
    padding: 20px 20px 20px 0;
    display: flex;
    flex-direction: column;
  }
  
  .app-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .app-desc {
    margin: 12px 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    flex: 1;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
  
  .app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .app-stats {
      display: flex;
      gap: 16px;
      
      .app-stat-item {
        display: flex;
        align-items: center;
        color: var(--el-text-color-secondary);
        font-size: 13px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s;
        
        &:hover {
          background-color: var(--el-fill-color-light);
          color: var(--el-color-primary);
        }
      }
    }
    
    .app-actions {
      display: flex;
      gap: 8px;
      
      .el-button {
        border-radius: 6px;
      }
      
      .install-btn {
        padding: 8px 16px;
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
        }
      }

      .more-btn {
        padding: 8px;
        transition: all 0.3s;
        
        &:hover {
          background-color: var(--el-fill-color);
          color: var(--el-color-primary);
        }
      }
    }
  }
}

.app-logo-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border-radius: 8px;
  
  .iconify {
    font-size: 24px;
  }
}

.device-selection {
  padding: 0 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  
  .selected-software {
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
    padding: 16px;
    
    .software-logo {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
  }
}

  .device-list {
    margin-top: 20px;
  flex: 1;
    overflow-y: auto;
}

.device-card {
  transition: all 0.3s;
  cursor: pointer;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid transparent;
  
  &.selected {
    border-color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
    
    .device-name {
      color: var(--el-color-primary);
    }
  }
  
  &:hover {
    border-color: var(--el-color-primary-light-3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
  
  .device-name {
    font-weight: 500;
    font-size: 15px;
    transition: color 0.3s;
    }

  .device-ip {
    margin-top: 4px;
  }
  
  .device-status {
    .el-tag {
      padding: 0 8px;
    }
    }
  }

  .drawer-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
    display: flex;
    justify-content: flex-end;
  gap: 12px;
  
  .install-btn {
    padding: 10px 20px;
    font-weight: 500;
    border-radius: 6px;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

.software-detail {
  .detail-header {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;

    .software-logo {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .detail-title {
      margin-left: 20px;

      h2 {
        margin: 0 0 10px 0;
        font-weight: 600;
        font-size: 20px;
      }

      .detail-meta {
        display: flex;
        align-items: center;
        gap: 12px;

        .el-tag {
          padding: 0 10px;
        }
      }
    }
  }

  .detail-content {
    padding: 20px 0;
    
    h3 {
      margin: 24px 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      position: relative;
      padding-left: 12px;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 4px;
        height: 16px;
        width: 3px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
      }
    }

    p {
      margin: 8px 0;
      color: var(--el-text-color-secondary);
      line-height: 1.8;
      font-size: 14px;
    }
    
    .detail-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 12px;
      
      .detail-info-item {
        display: flex;
        align-items: center;
        padding: 12px;
        background-color: var(--el-fill-color-light);
        border-radius: 6px;
        
        .detail-info-label {
          margin-right: 8px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
        }
        
        .detail-info-value {
          color: var(--el-text-color-primary);
        }
      }
    }
    
    .requirements-card {
      background-color: var(--el-fill-color-light);
      border-radius: 6px;
      padding: 16px;
      margin-top: 12px;
      
      p {
        margin: 0;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 12px;
      
      .stat-card {
        background-color: var(--el-fill-color-light);
        border-radius: 6px;
        padding: 16px;
        text-align: center;
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--el-color-primary);
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
}

:deep(.el-drawer__body) {
  padding: 0;
}

:deep(.el-dialog__header) {
  padding: 20px;
  margin-right: 0;
  border-bottom: 1px solid var(--el-border-color-light);
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px;
  border-top: 1px solid var(--el-border-color-light);
}

:deep(.el-pagination) {
  margin-top: 24px;
  justify-content: center;
  
  .el-pagination__total,
  .el-pagination__jump {
    font-size: 14px;
  }
  
  .el-pager li {
    border-radius: 4px;
    transition: all 0.2s;
    
    &.is-active {
      font-weight: 600;
    }
  }
}

:deep(.el-select) {
  .el-input__wrapper {
    border-radius: 8px;
  }
}

:deep(.el-dropdown-menu) {
  border-radius: 8px;
  padding: 6px 0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  
  .el-dropdown-menu__item {
    padding: 8px 16px;
    font-size: 14px;
    line-height: 1.5;
    
    &:hover {
      background-color: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }
}
</style>
