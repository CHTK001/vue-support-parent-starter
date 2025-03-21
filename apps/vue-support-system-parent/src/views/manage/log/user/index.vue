<script setup>
// 引入 ReIcon 组件的钩子函数，用于渲染图标
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
// 引入 Vue 的响应式和生命周期相关函数
import { computed, markRaw, nextTick, reactive, ref, watch } from "vue";
// 引入获取用户日志分页数据的 API 函数
import { fetchPageUserLog } from "@repo/core";
// 引入国际化转换函数
import { transformI18n } from "@repo/config";
// 引入根据 IP 获取物理地址和计算时间差的工具函数
import { getPhysicalAddressByIp, getTimeAgo } from "@repo/utils";
// 引入刷新图标
import Refresh from "@iconify-icons/line-md/backup-restore";
// 引入防抖函数
import { debounce } from "@pureadmin/utils";
// 引入 Vue i18n 的 useI18n 函数，用于国际化
import { useI18n } from "vue-i18n";
// 引入详情页组件
import Detail from "./detail.vue";

// 将 Detail 组件标记为原始组件，避免响应式处理
const DetailLayout = markRaw(Detail);
// 获取国际化实例
const { t } = useI18n();
// 定义详情页组件的引用
const detailRef = ref(null);
// 定义搜索表单的数据对象
const form = reactive({
  sysLogUsername: "", // 账号名称
  sysLogFrom: "", // 模块名称
  sysLogStatus: null, // 日志状态
  sysLogIp: null, // 请求 IP
  startDate: null, // 开始时间
  endDate: null, // 结束时间
});

// 计算图标样式类
const iconClass = computed(() => {
  return ["w-[22px]", "h-[22px]", "flex", "justify-center", "items-center", "outline-none", "rounded-[4px]", "cursor-pointer", "transition-colors", "hover:bg-[#0000000f]", "dark:hover:bg-[#ffffff1f]", "dark:hover:text-[#ffffffd9]"];
});

// 定义模态框显示状态的对象
const visible = reactive({
  save: false, // 保存模态框显示状态
  role: false, // 角色模态框显示状态
  detail: false, // 详情模态框显示状态
});

/**
 * 转换模块值为对应的标签
 * @param {string} value - 模块值
 * @returns {string} - 转换后的标签
 */
const transform = (value) => {
  value = String(value || "").toUpperCase();
  const _value = moduleOptions.filter((item) => {
    if (item.value === value) {
      return item.label;
    }
  });
  return _value.length > 0 ? _value[0].label : transformI18n("module.other");
};

// 定义加载状态的对象
const loading = reactive({
  query: false, // 查询加载状态
  menu: false, // 菜单加载状态
});

// 定义日期选择器绑定的时间范围
const sysLogTime = ref([]);
// 监听日期选择器的时间范围变化，更新表单中的开始和结束时间
watch(
  sysLogTime,
  (newValue) => {
    form.startDate = newValue?.[0];
    form.endDate = newValue?.[1];
  },
  { deep: true, immediate: true }
);

// 定义表单的引用
const formRef = ref();
// 定义表格的引用
const table = ref(null);
// 定义 IP 地址对应的物理地址映射表
const ipTable = reactive({});

/**
 * 根据 IP 地址注册物理地址
 * @param {string} ip - IP 地址
 */
const registerPhysicalAddressByIp = async (ip) => {
  getPhysicalAddressByIp(ip).then((res) => {
    ipTable[ip] = res;
  });
};

/**
 * 重置表单并重新搜索
 * @param {Object} formRef - 表单引用
 */
const resetForm = async (formRef) => {
  formRef.resetFields();
  onSearch();
};

/**
 * 搜索用户日志，使用防抖处理
 */
const onSearch = debounce(
  async () => {
    table.value.reload(form);
  },
  1000,
  true
);

/**
 * 打开详情页
 * @param {Object} row - 当前行数据
 */
const openDetail = async (row) => {
  visible.detail = true;
  await nextTick();
  detailRef.value.setData(row).open("view");
};

/**
 * 打开百度搜索该 IP 地址的页面
 * @param {string} ip - IP 地址
 */
const handleOpenIpAddress = async (ip) => {
  window.open(`https://www.baidu.com/s?wd=${ip}&from=t-io`, "_blank");
};

// 定义内容区域的引用
const contentRef = ref();
// 定义模块选项列表
const moduleOptions = reactive([
  { label: transformI18n("module.login"), value: "LOGIN" },
  { label: transformI18n("module.logout"), value: "LOGOUT" },
]);
</script>

<template>
  <div class="main">
    <!-- 详情页组件，根据 visible.detail 控制显示 -->
    <DetailLayout v-if="visible.detail" ref="detailRef" :moduleOptions="moduleOptions" />
    <el-container>
      <!-- 头部搜索区域 -->
      <el-header class="!h-[120px]">
        <div class="left-panel">
          <!-- 搜索表单 -->
          <el-form ref="formRef" label-width="40px" :inline="true" :model="form" class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto">
            <!-- 账号输入框 -->
            <el-form-item label="账号" prop="sysLogUsername">
              <el-input v-model="form.sysLogUsername" placeholder="请输入账号名称" clearable class="!w-[180px]" />
            </el-form-item>
            <!-- 模块选择框 -->
            <el-form-item label="模块" prop="sysLogFrom">
              <el-select v-model="form.sysLogFrom" placeholder="请选择模块" clearable class="!w-[180px]">
                <el-option v-for="item in moduleOptions" :key="item.value" :value="item.value" :label="item.label">
                  {{ item.label }}
                </el-option>
              </el-select>
            </el-form-item>
            <!-- 状态选择框 -->
            <el-form-item label="状态" prop="sysLogStatus">
              <el-select v-model="form.sysLogStatus" class="!w-[180px]" clearable>
                <el-option :value="1" label="成功">成功</el-option>
                <el-option :value="0" label="失败">失败</el-option>
              </el-select>
            </el-form-item>
            <!-- IP 输入框 -->
            <el-form-item label=" IP" prop="sysLogIp">
              <el-input v-model="form.sysLogIp" placeholder="请输入IP" clearable class="!w-[180px]" />
            </el-form-item>
            <!-- 日期时间范围选择器 -->
            <el-form-item label="时间" prop="sysLogTime">
              <el-date-picker v-model="sysLogTime" type="datetimerange" :start-placeholder="transformI18n('module.startDate')" :end-placeholder="transformI18n('module.endDate')" format="YYYY-MM-DD HH:mm:ss" date-format="YYYY-MM-DD ddd" time-format="A hh:mm:ss" />
            </el-form-item>
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <div class="flex-1">
              <div>
                <div class="flex flex-wrap flex-row">
                  <div class="flex-1" />
                  <div class="flex flex-row flex-1 justify-center">
                    <!-- 搜索按钮 -->
                    <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query" @click="onSearch" />
                    <!-- 重置按钮 -->
                    <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-header>
      <!-- 主体表格区域 -->
      <el-main class="nopadding">
        <div ref="contentRef" class="h-full flex">
          <div :class="visible.role ? 'h-full !w-[60vw]' : 'h-full w-full'" style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)">
            <!-- 表格组件 -->
            <ScTable ref="table" :url="fetchPageUserLog" :rowClick="openDetail">
              <!-- 账号名称列 -->
              <el-table-column label="账号名称" prop="sysLogUsername" align="center" show-overflow-tooltip min-width="120px" />
              <!-- 模块列，使用 transform 函数转换显示值 -->
              <el-table-column label="模块" prop="sysLogFrom" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                  <span>{{ transform(row.sysLogFrom) }}</span>
                </template>
              </el-table-column>
              <!-- 请求 IP 列，显示物理地址和 IP 地址 -->
              <el-table-column label="请求IP" prop="sysLogIp" align="left" show-overflow-tooltip min-width="160px">
                <template #default="{ row }">
                  <div v-if="!row.sysLogAddress">
                    <span v-if="row.sysLogIp && registerPhysicalAddressByIp(row.sysLogIp)">{{ ipTable[row.sysLogIp] || "-" }}</span>
                    <span v-else>-</span>
                    <br />
                    <span class="text-blue-400 cursor-pointer" @click.stop="handleOpenIpAddress(row.sysLogIp)">{{ row.sysLogIp || "-" }}</span>
                  </div>
                  <div v-else>
                    <span v-if="row.sysLogIp">{{ row.sysLogAddress || "-" }}</span>
                    <span v-else>-</span>
                    <br />
                    <span class="text-blue-400 cursor-pointer" @click.stop="handleOpenIpAddress(row.sysLogIp)">{{ row.sysLogIp || "-" }}</span>
                  </div>
                  <span class="text-gray-400">{{ row.sysLogIsp }}</span>
                </template>
              </el-table-column>
              <!-- 地址列 -->
              <el-table-column label="地址" prop="sysLogUrl" align="center" show-overflow-tooltip width="180px" />
              <!-- 浏览器指纹列 -->
              <el-table-column label="浏览器指纹" prop="sysLogFingerprint" align="center" show-overflow-tooltip />
              <!-- 登录方式列，使用国际化转换显示值 -->
              <el-table-column label="登录方式" prop="sysLogLoginType" align="center" width="140px">
                <template #default="{ row }">
                  {{ transformI18n(row.sysLogLoginType) }}
                </template>
              </el-table-column>
              <!-- userAgent 列 -->
              <el-table-column label="userAgent" prop="sysLogUa" align="center" show-overflow-tooltip min-width="120px" />
              <!-- 请求时间列，显示时间差和具体时间 -->
              <el-table-column label="请求时间" prop="createTime" align="left" show-overflow-tooltip min-width="120px">
                <template #default="{ row }">
                  <div>
                    <span>{{ getTimeAgo(row.createTime) }}</span>
                    <br />
                    <span class="text-gray-400">{{ row.createTime }}</span>
                  </div>
                </template>
              </el-table-column>
              <!-- 状态列，根据状态显示不同标签 -->
              <el-table-column label="状态" prop="sysLogStatus" align="center" width="100px" show-overflow-tooltip>
                <template #default="{ row }">
                  <el-tag v-if="row.sysLogStatus === 1" type="success">成功</el-tag>
                  <el-tag v-else-if="row.sysLogStatus === 0" type="danger">失败</el-tag>
                </template>
              </el-table-column>
              <!-- 耗时列，根据耗时显示不同标签 -->
              <el-table-column label="耗时" prop="sysLogCost" align="center">
                <template #default="{ row }">
                  <el-tag v-if="row.sysLogCost <= 1000" type="success">{{ row.sysLogCost || 0 }} ms</el-tag>
                  <el-tag v-else-if="row.sysLogCost > 1000 && row.sysLogCost < 4000" type="warning">{{ row.sysLogCost || 0 }} ms</el-tag>
                  <el-tag v-else type="danger">{{ row.sysLogCost || 0 }} ms</el-tag>
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </div>
      </el-main>
    </el-container>
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
</style>
