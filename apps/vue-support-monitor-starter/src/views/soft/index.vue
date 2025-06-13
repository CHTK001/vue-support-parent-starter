<template>
  <div class="software-mall-container">
    <el-container>
      <!-- 左侧分类菜单 -->
      <CategorySidebar 
        :active-category="searchParams.category || 'all'" 
        @select="handleCategorySelect" 
      />

      <!-- 右侧内容区 -->
      <el-container class="content-container flex">
        <!-- 顶部搜索和操作区 -->
        <SearchHeader 
          v-model:keyword="searchParams.keyword" 
          v-model:sort="searchParams.sort" 
          @search="handleSearch" 
          @add="handleAdd" 
        />

        <!-- 主内容区 -->
        <el-main class="content-main nopadding flex flex-col">
          <CategoryHeader 
            :category="searchParams.category || 'all'" 
          />

          <ScTable 
            ref="tableRef" 
            :url="fetchSoftServicePage" 
            layout="card" 
            cardLayout="default" 
            v-model:page="page" 
            v-model:params="searchParams" 
            class="soft-table"
          >
            <template #default="{ row }">
              <SoftwareCard 
                :software="row" 
                @install="handleInstall" 
                @favorite="handleFavorite" 
                @command="handleCommand" 
                @device-command="handleDeviceCommand" 
                @manage-devices="openDeviceManagement" 
              />
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
    <install-progress-drawer 
      v-if="installDrawerVisible" 
      v-model="installDrawerVisible" 
      :software="currentSoftware" 
      @finish="handleInstallFinish" 
    />

    <!-- 软件表单对话框 -->
    <SoftForm 
      v-model="formVisible" 
      :is-edit="isEdit" 
      :software="currentSoftware" 
      @submit="handleSubmit" 
      @cancel="formVisible = false" 
    />

    <!-- 设备管理抽屉 -->
    <el-drawer 
      v-model="deviceManageDrawerVisible" 
      :title="`${currentSoftware?.softServiceName || '软件'} - 设备管理`" 
      size="80%" 
      direction="rtl"
    >
      <div class="p-4">
        <DeviceCardList 
          :device-list="deviceList" 
          :soft-service-id="currentSoftware?.softServiceId || 0" 
          :loading="deviceListLoading" 
          @refresh="loadDeviceList" 
          @add="handleDeviceAdded" 
          @edit="handleDeviceEdited" 
          @delete="handleDeviceDeleted" 
        />
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessageBox } from "element-plus";
import { message } from "@repo/utils";
import { 
  fetchSoftServiceFavorite, 
  fetchSoftServicePage, 
  fetchSoftServiceDelete, 
  fetchSoftServiceSave, 
  fetchSoftServiceUpdate, 
  fetchSoftServiceGet,
  type SoftService, 
  type PartialSoftService 
} from "@/api/soft";
import { fetchSoftServiceInstall, fetchSoftServiceInstallByServiceId } from "@/api/soft/install";

// 导入组件
import InstallProgressDrawer from "./components/InstallProgressDrawer.vue";
import SoftForm from "./components/SoftForm.vue";
import DeviceSelectDrawer from "./components/DeviceSelectDrawer.vue";
import DeviceCardList from "./components/DeviceCardList.vue";
import CategorySidebar from "./components/CategorySidebar.vue";
import SearchHeader from "./components/SearchHeader.vue";
import CategoryHeader from "./components/CategoryHeader.vue";
import SoftwareCard from "./components/SoftwareCard.vue";

// 表格引用
const tableRef = ref<InstanceType<typeof ScTable>>();
const deviceSelectDrawerRef = ref<InstanceType<typeof DeviceSelectDrawer>>();

// 分页和搜索参数
const page = reactive({
  pageNum: 1,
  pageSize: 12,
  total: 0,
});

const searchParams = reactive({
  keyword: "",
  category: "",
  sort: "default",
});

// 状态变量
const deviceDrawerVisible = ref(false);
const installDrawerVisible = ref(false);
const formVisible = ref(false);
const isEdit = ref(false);
const currentSoftware = ref<PartialSoftService>({});
const deviceManageDrawerVisible = ref(false);
const deviceList = ref<any[]>([]);
const deviceListLoading = ref(false);

// 处理分类选择
const handleCategorySelect = (index: string) => {
  searchParams.category = index === "all" ? "" : index;
  handleSearch();
};

// 处理搜索
const handleSearch = () => {
  page.pageNum = 1;
  tableRef.value?.refresh();
};

// 处理软件安装
const handleInstall = (software: SoftService) => {
  currentSoftware.value = software;
  deviceDrawerVisible.value = true;
};

// 处理设备选择
const handleDeviceSelect = async (deviceIds: string[]) => {
  try {
    if (!currentSoftware.value.softServiceId) {
      message.error("软件ID不存在");
      return;
    }

    const res = await fetchSoftServiceInstall({
      softServiceId: currentSoftware.value.softServiceId,
      sshIds: deviceIds,
    });

    if (res.code === "00000") {
      message.success("安装命令已发送");
      deviceDrawerVisible.value = false;
      
      // 打开安装进度抽屉
      currentSoftware.value.selectedDeviceId = deviceIds[0];
      installDrawerVisible.value = true;
    } else {
      message.error(res.msg || "安装失败");
    }
  } catch (error) {
    console.error("安装失败:", error);
    message.error("安装失败");
  }
};

// 处理安装完成
const handleInstallFinish = () => {
  tableRef.value?.refresh();
};

// 处理收藏
const handleFavorite = async (software: SoftService) => {
  try {
    const res = await fetchSoftServiceFavorite({
      softServiceId: software.softServiceId,
    });

    if (res.code === "00000") {
      message.success("操作成功");
      tableRef.value?.refresh();
    } else {
      message.error(res.msg || "操作失败");
    }
  } catch (error) {
    console.error("收藏失败:", error);
    message.error("操作失败");
  }
};

// 处理命令
const handleCommand = async (command: string, software: SoftService) => {
  switch (command) {
    case "detail":
      // 查看详情
      showDetail(software);
      break;
    case "edit":
      // 编辑软件
      isEdit.value = true;
      currentSoftware.value = software;
      formVisible.value = true;
      break;
    case "delete":
      // 删除软件
      handleDelete(software);
      break;
  }
};
const showDetail = (soft: SoftService) => {
  currentSoftware.value = soft as PartialSoftService;
  // 打开安装进度抽屉，但不传递设备ID，只查看历史安装记录
  installDrawerVisible.value = true;
};
// 处理删除
const handleDelete = async (software: SoftService) => {
  try {
    await ElMessageBox.confirm(`确定要删除 ${software.softServiceName} 吗？`, "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const res = await fetchSoftServiceDelete({
      softServiceId: software.softServiceId,
    });

    if (res.code === "00000") {
      message.success("删除成功");
      tableRef.value?.refresh();
    } else {
      message.error(res.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      message.error("删除失败");
    }
  }
};

// 处理设备命令
const handleDeviceCommand = (device: any, software: SoftService) => {
  currentSoftware.value = {
    ...software,
    selectedDeviceId: device.installId || device.sshId,
  };
  installDrawerVisible.value = true;
};

// 处理新增
const handleAdd = () => {
  isEdit.value = false;
  currentSoftware.value = {};
  formVisible.value = true;
};

// 处理表单提交
const handleSubmit = async (data: PartialSoftService) => {
  try {
    let res;
    if (isEdit.value) {
      res = await fetchSoftServiceUpdate(data);
    } else {
      res = await fetchSoftServiceSave(data);
    }

    if (res.code === "00000") {
      message.success(isEdit.value ? "更新成功" : "添加成功");
      formVisible.value = false;
      tableRef.value?.refresh();
    } else {
      message.error(res.msg || (isEdit.value ? "更新失败" : "添加失败"));
    }
  } catch (error) {
    console.error("提交失败:", error);
    message.error(isEdit.value ? "更新失败" : "添加失败");
  }
};

// 打开设备管理
const openDeviceManagement = (software: SoftService) => {
  currentSoftware.value = software;
  deviceManageDrawerVisible.value = true;
  loadDeviceList();
};

// 加载设备列表
const loadDeviceList = async () => {
  if (!currentSoftware.value.softServiceId) return;

  try {
    deviceListLoading.value = true;
    const res = await fetchSoftServiceInstallByServiceId({
      softServiceId: currentSoftware.value.softServiceId,
    });

    if (res.code === "00000") {
      deviceList.value = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];
    } else {
      deviceList.value = [];
      message.error(res.msg || "加载设备列表失败");
    }
  } catch (error) {
    console.error("加载设备列表失败:", error);
    deviceList.value = [];
    message.error("加载设备列表失败");
  } finally {
    deviceListLoading.value = false;
  }
};

// 处理设备添加
const handleDeviceAdded = () => {
  loadDeviceList();
  message.success("设备添加成功");
};

// 处理设备编辑
const handleDeviceEdited = () => {
  loadDeviceList();
  message.success("设备更新成功");
};

// 处理设备删除
const handleDeviceDeleted = () => {
  loadDeviceList();
  message.success("设备删除成功");
};

// 组件挂载时初始化
onMounted(() => {
  const route = useRoute();
  // 从路由参数中获取分类
  if (route.query.category) {
    searchParams.category = route.query.category as string;
  }
  
  // 从路由参数中获取关键词
  if (route.query.keyword) {
    searchParams.keyword = route.query.keyword as string;
  }
});
</script>

<style lang="scss" scoped>
.software-mall-container {
  height: 100%;
  background-color: var(--el-bg-color-page);
}

.content-container {
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}


:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  background-color: transparent !important;
}

:deep(.el-table__header-wrapper) {
  background-color: var(--el-bg-color);
}

:deep(.el-drawer__body) {
  padding: 0;
  overflow: hidden;
}
</style>
