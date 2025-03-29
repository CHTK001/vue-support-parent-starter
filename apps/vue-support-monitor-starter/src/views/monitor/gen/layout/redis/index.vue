<template>
  <div class="redis-container h-full">
    <!-- 空状态展示 -->
    <el-empty v-if="!data.genId" class="h-full" description="请选择数据源" />

    <!-- 主内容区域 -->
    <div v-else class="redis-content h-full">
      <!-- 顶部信息栏 -->
      <div class="redis-header">
        <!-- 数据源信息 -->
        <div class="redis-header__info">
          <IconifyIconOnline icon="ri:database-2-line" class="redis-header__icon" />
          <span class="redis-header__name" :title="data.genName">{{ data.genName }}</span>
        </div>

        <!-- 执行时间信息 -->
        <template v-if="!settingTB.openLog">
          <el-divider direction="vertical" />
          <div class="redis-header__metric">
            <IconifyIconOnline icon="ri:time-line" class="redis-header__icon" />
            <span class="redis-header__value">{{ cost }} ms</span>
            <span class="redis-header__label">执行时间</span>
          </div>

          <el-divider direction="vertical" />
          <div class="redis-header__metric">
            <IconifyIconOnline icon="ri:time-zone-line" class="redis-header__icon" />
            <span class="redis-header__value">{{ ttl }} ms</span>
            <span class="redis-header__label">过期时间</span>
          </div>
        </template>
      </div>

      <!-- 数据内容区域 -->
      <div class="redis-body">
        <el-scrollbar class="redis-scrollbar">
          <div class="redis-content-wrapper">
            <!-- 加载状态 -->
            <el-skeleton :loading="visible.isExecuteTable" :animated="true" class="redis-skeleton">
              <!-- 根据数据类型显示不同布局 -->
              <StringLayout v-if="form.dataType == 'STRING'" :data="result" class="redis-layout" />
              <HashLayout v-else-if="form.dataType == 'HASH'" :data="result" class="redis-layout" />
              <ListLayout v-else-if="form.dataType == 'LIST'" :data="result" class="redis-layout" />
              <SetLayout v-else-if="form.dataType == 'SET'" :data="result" class="redis-layout" />
              <ZSetLayout v-else-if="form.dataType == 'ZSET'" :data="result" class="redis-layout" />

              <!-- 无数据或未知类型 -->
              <el-empty v-else description="未知数据类型或无数据" class="redis-empty" />
            </el-skeleton>
          </div>
        </el-scrollbar>
      </div>

      <!-- 文档组件 -->
      <document v-if="visible.documentVisible" ref="documentRef" />
    </div>
  </div>
</template>

<script setup>
import { fetchGenSessionExecute } from "@/api/monitor/gen/session";
import { message } from "@repo/utils";
import { AnsiUp } from "ansi_up";
import { defineAsyncComponent, defineExpose, defineProps, reactive, ref } from "vue";
import document from "../../model/document.vue";

// 异步加载各种数据类型的布局组件
const StringLayout = defineAsyncComponent(() => import("./layout/string.vue"));
const HashLayout = defineAsyncComponent(() => import("./layout/hash.vue"));
const ListLayout = defineAsyncComponent(() => import("./layout/list.vue"));
const SetLayout = defineAsyncComponent(() => import("./layout/set.vue"));
const ZSetLayout = defineAsyncComponent(() => import("./layout/zset.vue"));

/**
 * ANSI转HTML工具
 * 用于将控制台输出转换为HTML格式
 */
const ansiUp = new AnsiUp();

// 组件引用
const tableRef = ref();
const documentRef = ref();
const codeRef = ref();

// 组件属性
const props = defineProps({
  data: Object
});

/**
 * 结果数据对象
 * 存储Redis查询结果
 */
const result = reactive({});

// 性能指标
const ttl = ref(0); // 过期时间
const cost = ref(0); // 执行时间

/**
 * 过滤数据
 * 存储当前选中的表和节点信息
 */
const filterData = reactive({
  tableData: {},
  tableNode: {}
});

/**
 * 表单数据
 * 包含SQL语句和搜索类型
 */
const form = reactive({
  sql: "",
  searchType: "SHOW_PAGE",
  dataType: ""
});

/**
 * 可见性控制
 * 控制各组件的显示状态
 */
const visible = reactive({
  documentVisible: false,
  searchVisible: false,
  isExecuteTable: false
});

/**
 * 分屏设置
 * 控制编辑器和结果区域的分屏比例
 */
const settingTB = reactive({
  minPercent: 10,
  defaultPercent: 20,
  split: "horizontal",
  card: "message",
  remarkTitle: "INNER",
  openLog: false
});

/**
 * 编辑器选项
 * 配置代码编辑器的行为
 */
const options = reactive({
  lineNumbers: true,
  line: true,
  extraKeys: {
    Tab: "autocomplete"
  },
  hintOptions: {
    completeSingle: false, // 当匹配只有一项的时候是否自动补全
    tables: props.hits
  }
});

/**
 * 更新数据
 * 当选择不同的键时更新查询语句并执行
 * @param {Object} tableData - 表数据
 * @param {Object} node - 节点数据
 */
const upgrade = async (tableData, node) => {
  filterData.tableData = tableData;
  form.dataType = tableData.dataType?.toUpperCase();
  form.sql = "GET " + tableData.nodeName;
  form.database = tableData.nodePid * 1;
  filterData.tableNode = node;
  handleExecuteSql();
};

/**
 * 更新提示信息
 * 更新编辑器的自动完成提示
 * @param {Object} hits - 提示数据
 */
const upgradeHits = async hits => {
  codeRef.value?.upgradeHits(hits);
};

/**
 * 执行Redis查询
 * 发送查询命令到服务器并处理结果
 */
const handleExecuteSql = async () => {
  if (!form.sql) {
    message("请输入查询命令", { type: "warning" });
    return;
  }

  visible.searchVisible = true;
  visible.isExecuteTable = true;

  const request = {
    ...form,
    content: form.sql,
    genId: props.data.genId,
    searchType: form.searchType
  };

  try {
    const res = await fetchGenSessionExecute(request);
    Object.assign(result, res?.data?.data || {});
    ttl.value = res.data?.fields?.[0] || 0;
    cost.value = res.data?.cost || 0;
  } catch (error) {
    console.error("执行Redis命令失败:", error);
    message("执行失败", { type: "error" });
  } finally {
    visible.isExecuteTable = false;
  }
};

// 导出组件方法
defineExpose({ upgrade, upgradeHits });
</script>

<style lang="scss" scoped>
.redis-container {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
}

.redis-content {
  display: flex;
  flex-direction: column;
}

.redis-header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);

  &__info {
    display: flex;
    align-items: center;
    min-width: 100px;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }

  &__icon {
    font-size: 18px;
    margin-right: 6px;
    color: var(--el-color-primary);
  }

  &__name {
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__metric {
    display: flex;
    align-items: center;
    min-width: 120px;
    padding: 0 8px;
    font-size: 14px;
  }

  &__value {
    font-weight: 500;
    color: var(--el-text-color-primary);
    margin-right: 4px;
  }

  &__label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

.redis-body {
  height: calc(100% - 48px);
  overflow: hidden;
}

.redis-scrollbar {
  height: 100%;

  :deep(.el-scrollbar__view) {
    height: 100%;
  }
}

.redis-content-wrapper {
  height: 100%;
  padding: 16px;
}

.redis-skeleton {
  height: 100%;
}

.redis-layout {
  height: 100%;
}

.redis-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
