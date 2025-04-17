<template>
  <div class="sc-table-example">
    <div class="example-container">
      <div class="config-panel">
        <h3>配置面板</h3>
        <el-form :model="config" label-width="120px" size="small">
          <el-form-item label="边框">
            <el-switch v-model="config.border" />
          </el-form-item>
          <el-form-item label="斑马纹">
            <el-switch v-model="config.stripe" />
          </el-form-item>
          <el-form-item label="显示分页">
            <el-switch v-model="config.showPagination" />
          </el-form-item>
          <el-form-item label="每页条数">
            <el-select v-model="config.pageSize" :disabled="!config.showPagination">
              <el-option v-for="size in [5, 10, 20, 50, 1000, 10000, 100000]" :key="size" :label="size" :value="size" />
            </el-select>
          </el-form-item>
          <el-form-item label="分页类型">
            <el-select v-model="config.paginationType" :disabled="!config.showPagination">
              <el-option label="当前分页" value="default" />
              <el-option label="滚动分页" value="scroll" />
            </el-select>
          </el-form-item>
          <el-form-item label="高度(px)">
            <el-input-number v-model="config.height" :min="0" :step="50" />
          </el-form-item>
          <el-form-item label="表格宽度">
            <el-select v-model="config.width">
              <el-option label="自适应" value="auto" />
              <el-option label="100%" value="100%" />
              <el-option label="1200px" value="1200px" />
              <el-option label="800px" value="800px" />
            </el-select>
          </el-form-item>
          <el-form-item label="布局方式">
            <ScSelect 
              v-model="config.layout"
              :options="[
                { label: '表格', value: 'table', icon: 'ep:grid' },
                { label: '列表', value: 'list', icon: 'ep:list' },
                { label: '卡片', value: 'card', icon: 'ep:menu' },
                { label: '虚拟表格', value: 'virtual', icon: 'ep:top' },
                { label: 'Canvas', value: 'canvas', icon: 'ep:finished' }
              ]"
              layout="platform"
              :columns="5"
            />
          </el-form-item>
          <el-form-item label="启用右键菜单">
            <el-switch v-model="config.contextMenu" />
          </el-form-item>
          <el-form-item label="数据数量">
            <div class="data-count-control">
              <el-input-number v-model="config.dataCount" :min="1" :max="10000" @change="generateData" />
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="preview-panel" :style="{ width: config.width !== 'auto' ? config.width : '100%' }">
        <h3>{{ getLayoutTitle }}</h3>
        <p class="example-desc">通过左侧配置面板调整表格属性，实时查看效果</p>

        <div class="table-preview-container">
          <ScTable v-if="config.layout === 'table'" ref="tableRef" :data="tableData" :params="{}" row-key="id"
            :border="config.border" :stripe="config.stripe" :height="config.height > 0 ? config.height - 2 : null"
            :hidePagination="!config.showPagination" :pageSize="config.pageSize" :paginationType="config.paginationType"
            :contextmenu="config.contextMenu ? handleContextMenu : null" overflow-x="auto">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column prop="id" label="ID" sortable></el-table-column>
            <el-table-column prop="name" label="名称"></el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'">
                  {{ row.status === "active" ? "启用" : "禁用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述"></el-table-column>
            <el-table-column prop="createTime" label="创建时间" sortable></el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </ScTable>

          <ScTable v-else-if="config.layout === 'card'" :layout="config.layout" ref="otherLayoutRef" :data="tableData"
            :params="{}" row-key="id" :border="config.border" :stripe="config.stripe"
            :height="config.height > 0 ? config.height : 400" :hidePagination="!config.showPagination"
            :pageSize="config.pageSize" :paginationType="config.paginationType" :col-size="4" :row-size="2"
            :contextmenu="config.contextMenu ? handleContextMenu : null" @row-click="handleEdit" overflow-x="auto">
            <template #default="{ row }">
              <div class="custom-card">
                <div class="card-header">
                  <span class="card-title">{{ row.name }}</span>
                  <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                    {{ row.status === "active" ? "启用" : "禁用" }}
                  </el-tag>
                </div>
                <div class="card-content">
                  <div class="card-field">
                    <div class="field-label">ID:</div>
                    <div class="field-value">{{ row.id }}</div>
                  </div>
                  <div class="card-field">
                    <div class="field-label">描述:</div>
                    <div class="field-value">{{ row.description }}</div>
                  </div>
                  <div class="card-field">
                    <div class="field-label">创建时间:</div>
                    <div class="field-value">{{ row.createTime }}</div>
                  </div>
                </div>
                <div class="card-actions">
                  <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                  <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                </div>
              </div>
            </template>
          </ScTable>

          <!-- Canvas布局 -->
          <ScTable v-else-if="config.layout === 'canvas'" :layout="config.layout" ref="canvasLayoutRef"
            :data="tableData" :params="{}" row-key="id" :border="config.border" :stripe="config.stripe"
            :height="config.height > 0 ? config.height - 2 : null" :hidePagination="!config.showPagination"
            :pageSize="config.pageSize" :paginationType="config.paginationType" :columns="canvasColumns"
            :contextmenu="config.contextMenu ? handleContextMenu : null" @row-click="handleCanvasRowClick">
            <template #table-header>
              <div class="canvas-header">
                <h4>Canvas表格 - 高性能渲染</h4>
                <el-tag type="success">适合大数据量渲染</el-tag>
              </div>
            </template>
          </ScTable>

          <!-- 虚拟表格布局 -->
          <ScTable v-else-if="config.layout === 'virtual'" :layout="config.layout" ref="virtualLayoutRef"
            :data="tableData" :params="{}" row-key="id" :border="config.border" :stripe="config.stripe"
            :height="config.height > 0 ? config.height - 2 : null" :hidePagination="!config.showPagination"
            :pageSize="config.pageSize" :paginationType="config.paginationType" :columns="canvasColumns"
            :contextmenu="config.contextMenu ? handleContextMenu : null" @row-click="handleEdit">
          </ScTable>

          <!-- 列表布局 -->
          <ScTable v-else :layout="config.layout" ref="otherLayoutRef" :data="tableData" :params="{}" row-key="id"
            :border="config.border" :stripe="config.stripe" :height="config.height > 0 ? config.height - 2 : 400"
            :hidePagination="!config.showPagination" :pageSize="config.pageSize" :paginationType="config.paginationType"
            :contextmenu="config.contextMenu ? handleContextMenu : null" @row-click="handleEdit" overflow-x="auto">
            <template #default="{ row }">
              <div class="list-item">
                <div class="list-item-main">
                  <h4>{{ row.name }}</h4>
                  <p>{{ row.description }}</p>
                </div>
                <div class="list-item-meta">
                  <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                    {{ row.status === "active" ? "启用" : "禁用" }}
                  </el-tag>
                  <span class="list-time">{{ row.createTime }}</span>
                </div>
                <div class="list-item-actions">
                  <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                  <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
                </div>
              </div>
            </template>
          </ScTable>
        </div>
      </div>
    </div>

    <el-divider></el-divider>
    <div class="code-panel">
      <h4>代码示例：</h4>
      <el-alert title="此代码示例会根据您在配置面板中的选择实时更新" type="info" :closable="false" show-icon style="margin-bottom: 15px" />
      <pre><code class="language-html">{{ generatedCode }}</code></pre>

      <div v-if="config.contextMenu" class="context-menu-help">
        <h4>右键菜单使用说明</h4>
        <p>ScTable组件支持在表格行上使用右键菜单，只需要提供一个<code>contextmenu</code>函数即可。该函数接收三个参数：当前行数据、当前列、事件对象，并返回一个菜单项配置数组。</p>
        <p>菜单项配置说明：</p>
        <ul>
          <li><strong>name</strong>: 菜单项显示的名称</li>
          <li><strong>icon</strong>: 菜单项图标，使用ElementPlus图标或者Iconify图标</li>
          <li><strong>handle</strong>: 点击菜单项时的处理函数，接收当前行数据</li>
          <li><strong>type</strong>: 特殊类型，设置为"LINE"时显示为分割线</li>
          <li><strong>show</strong>: (可选) 显示条件，返回布尔值决定是否显示该菜单项</li>
          <li><strong>children</strong>: (可选) 子菜单项，配置同父级，支持多级嵌套</li>
        </ul>
        <p>在表格行上点击右键即可呼出右键菜单，支持嵌套的二级菜单。</p>
        
        <h4>二级菜单配置示例</h4>
        <pre><code class="language-js">{
  name: "更多操作",
  icon: "ep:more-filled",
  children: [
    {
      name: "导出",
      icon: "ep:download",
      handle: () => { /* 处理函数 */ }
    },
    {
      name: "分享",
      icon: "ep:share",
      handle: () => { /* 处理函数 */ }
    }
  ]
}</code></pre>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from "vue";
import { ElMessage } from "element-plus";
import ScSelect from "@repo/components/ScSelect/index.vue";

// 配置项
const config = reactive({
  border: true,
  stripe: true,
  showPagination: true,
  pageSize: 10,
  paginationType: "default",
  height: 500,
  width: "800px",
  layout: "table",
  dataCount: 108,
  contextMenu: false,
});

// Canvas表格列配置
const canvasColumns = [
  { label: 'ID', prop: 'id', width: 80, sortable: true },
  { label: '名称', prop: 'name', width: 150 },
  { label: '状态', prop: 'status', width: 400, 
    formatter: (row) => row.status === 'active' ? '启用' : '禁用' },
  { label: '描述', prop: 'description', width: 400 },
  { label: '创建时间', prop: 'createTime', width: 180, sortable: true }
];

// 获取布局标题
const getLayoutTitle = computed(() => {
  const layoutMap = {
    'table': '表格模式预览',
    'card': '卡片模式预览',
    'list': '列表模式预览',
    'virtual': '虚拟表格预览',
    'canvas': 'Canvas表格预览'
  };
  return layoutMap[config.layout] || '预览';
});

// 监听配置变化，确保变更能实时生效
watch(
  () => [config.border, config.stripe],
  () => {
    // 强制组件刷新
    if (tableRef.value) {
      // 尝试调用组件的重新布局方法
      nextTick(() => {
        if (tableRef.value.doLayout) {
          tableRef.value.doLayout();
        }
      });
    }
  },
  { deep: true }
);

// 引用
const tableRef = ref(null);
const otherLayoutRef = ref(null);
const canvasLayoutRef = ref(null);
const virtualLayoutRef = ref(null);

// 模拟表格数据
const tableData = ref([
  {
    id: 1,
    name: "测试项目1",
    status: "active",
    description: "这是一个测试项目的描述信息，展示了项目的基本情况",
    createTime: "2023-08-15 10:30:45",
  },
  {
    id: 2,
    name: "测试项目2",
    status: "inactive",
    description: "这是另一个测试项目，目前处于非活跃状态",
    createTime: "2023-08-16 14:22:18",
  },
  {
    id: 3,
    name: "测试项目3",
    status: "active",
    description: "这是第三个测试项目，包含了更多的测试内容",
    createTime: "2023-08-17 09:11:32",
  },
  {
    id: 4,
    name: "测试项目4",
    status: "active",
    description: "这是一个长期项目，需要持续维护",
    createTime: "2023-08-18 16:45:09",
  },
  {
    id: 5,
    name: "测试项目5",
    status: "inactive",
    description: "这个项目已经暂停，等待进一步评估",
    createTime: "2023-08-19 11:38:27",
  },
  {
    id: 6,
    name: "测试项目6",
    status: "active",
    description: "新增的测试项目，用于测试分页功能",
    createTime: "2023-08-20 13:25:11",
  },
  {
    id: 7,
    name: "测试项目7",
    status: "inactive",
    description: "另一个测试项目示例",
    createTime: "2023-08-21 09:44:55",
  },
  {
    id: 8,
    name: "测试项目8",
    status: "active",
    description: "用于测试表格性能的数据行",
    createTime: "2023-08-22 15:33:21",
  },
]);

// 生成更多模拟数据
const generateData = () => {
  const count = config.dataCount;
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      name: `测试项目${i + 1}`,
      status: i % 3 === 0 ? "active" : "inactive",
      description: `这是测试项目${i + 1}的描述信息，用于演示表格功能`,
      createTime: getRandomDate(),
    });
  }
  tableData.value = data;
};

// 生成随机日期
const getRandomDate = () => {
  const start = new Date(2023, 0, 1);
  const end = new Date();
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Canvas表格行点击处理
const handleCanvasRowClick = (row) => {
  ElMessage.success(`点击了Canvas表格行：${row.name}`);
};

// 编辑按钮点击处理
const handleEdit = (row) => {
  ElMessage({
    message: `编辑: ${row.name}`,
    type: "info",
  });
};

// 删除按钮点击处理
const handleDelete = (row) => {
  ElMessage({
    message: `删除: ${row.name}`,
    type: "warning",
  });
};

// 定义右键菜单处理函数
const handleContextMenu = (row, column, event) => {
  // 返回菜单项配置
  return [
    {
      name: "查看详情",
      icon: "ep:view",
      handle: () => {
        ElMessage.info("查看行详情：" + row.name);
      }
    },
    {
      name: "编辑",
      icon: "ep:edit",
      handle: () => {
        handleEdit(row);
      }
    },
    {
      name: "更多操作",
      icon: "ep:more-filled",
      children: [
        {
          name: "导出",
          icon: "ep:download",
          handle: () => {
            ElMessage.success("导出数据：" + row.name);
          }
        },
        {
          name: "分享",
          icon: "ep:share",
          handle: () => {
            ElMessage.success("分享数据：" + row.name);
          }
        },
        {
          name: "打印",
          icon: "ep:printer",
          handle: () => {
            ElMessage.success("打印数据：" + row.name);
          }
        }
      ]
    },
    {
      type: "LINE"
    },
    {
      name: "复制ID",
      icon: "ep:copy-document",
      handle: () => {
        navigator.clipboard.writeText(row.id).then(() => {
          ElMessage.success("已复制ID到剪贴板");
        });
      }
    },
    {
      name: "删除",
      icon: "ep:delete",
      handle: () => {
        handleDelete(row);
      }
    }
  ];
};

// 根据配置生成代码
const generatedCode = computed(() => {
  let code = "";
  
  if (config.layout === 'table') {
    // 表格布局代码
    code = `<ScTable 
  :data="tableData" 
  row-key="id"
  :border="${config.border}"
  :stripe="${config.stripe}" 
  :height="${config.height}" 
  :pageSize="${config.pageSize}"
  :paginationType="${config.paginationType}"`;
    
    if (config.contextMenu) {
      code += `
  :contextmenu="handleContextMenu"`;
    }
    
    code += `>
  <el-table-column type="selection" width="55"></el-table-column>
  <el-table-column prop="id" label="ID" sortable></el-table-column>
  <el-table-column prop="name" label="名称"></el-table-column>
  <el-table-column prop="status" label="状态">
    <template #default="{ row }">
      <el-tag :type="row.status === 'active' ? 'success' : 'info'">
        {{ row.status === "active" ? "启用" : "禁用" }}
      </el-tag>
    </template>
  </el-table-column>
  <el-table-column prop="description" label="描述"></el-table-column>
  <el-table-column prop="createTime" label="创建时间" sortable></el-table-column>
  <el-table-column label="操作" width="150">
    <template #default="{ row }">
      <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
      <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
    </template>
  </el-table-column>
</ScTable>`;
    
    // 如果启用了右键菜单，添加菜单实现代码
    if (config.contextMenu) {
      code += `

<!-- 右键菜单实现代码 -->
<script setup>
// 定义右键菜单处理函数
const handleContextMenu = (row, column, event) => {
  // 返回菜单项配置
  return [
    {
      name: "查看详情",
      icon: "ep:view",
      handle: () => {
        ElMessage.info("查看行详情：" + row.name);
      }
    },
    {
      name: "编辑",
      icon: "ep:edit",
      handle: () => {
        handleEdit(row);
      }
    },
    {
      name: "更多操作",
      icon: "ep:more-filled",
      children: [
        {
          name: "导出",
          icon: "ep:download",
          handle: () => {
            ElMessage.success("导出数据：" + row.name);
          }
        },
        {
          name: "分享",
          icon: "ep:share",
          handle: () => {
            ElMessage.success("分享数据：" + row.name);
          }
        },
        {
          name: "打印",
          icon: "ep:printer",
          handle: () => {
            ElMessage.success("打印数据：" + row.name);
          }
        }
      ]
    },
    {
      type: "LINE"
    },
    {
      name: "复制ID",
      icon: "ep:copy-document",
      handle: () => {
        navigator.clipboard.writeText(row.id).then(() => {
          ElMessage.success("已复制ID到剪贴板");
        });
      }
    },
    {
      name: "删除",
      icon: "ep:delete",
      handle: () => {
        handleDelete(row);
      }
    }
  ];
};
<\/script>`;
    }
  } else if (config.layout === 'card') {
    // 卡片布局代码
    code = `<ScTable 
  layout="card"
  :data="tableData" 
  row-key="id"
  :border="${config.border}"
  :stripe="${config.stripe}" 
  :height="400"
  :pageSize="${config.pageSize}"
  :paginationType="${config.paginationType}"
  :col-size="4" 
  :row-size="2">
  <template #default="{ row }">
    <div class="custom-card">
      <div class="card-header">
        <span class="card-title">{{ row.name }}</span>
        <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
          {{ row.status === "active" ? "启用" : "禁用" }}
        </el-tag>
      </div>
      <div class="card-content">
        <div class="card-field">
          <div class="field-label">ID:</div>
          <div class="field-value">{{ row.id }}</div>
        </div>
        <div class="card-field">
          <div class="field-label">描述:</div>
          <div class="field-value">{{ row.description }}</div>
        </div>
        <div class="card-field">
          <div class="field-label">创建时间:</div>
          <div class="field-value">{{ row.createTime }}</div>
        </div>
      </div>
      <div class="card-actions">
        <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </div>
    </div>
  </template>
</ScTable>`;
  } else if (config.layout === 'canvas') {
    // Canvas表格布局代码
    code = `<ScTable 
  layout="canvas"
  :data="tableData" 
  row-key="id"
  :border="${config.border}"
  :stripe="${config.stripe}" 
  :height="400"
  :pageSize="${config.pageSize}"
  :paginationType="${config.paginationType}"
  :columns="columns"
  @row-click="handleRowClick">
  <template #table-header>
    <div class="canvas-header">
      <h4>Canvas表格 - 高性能渲染</h4>
      <el-tag type="success">适合大数据量渲染</el-tag>
    </div>
  </template>
</ScTable>`;
  } else if (config.layout === 'virtual') {
    // 虚拟表格布局代码
    code = `<ScTable 
  layout="virtual"
  :data="tableData" 
  row-key="id"
  :border="${config.border}"
  :stripe="${config.stripe}" 
  :height="400"
  :pageSize="${config.pageSize}"
  :paginationType="${config.paginationType}"
  :columns="columns"
  @row-click="handleRowClick">
</ScTable>`;
  } else {
    // 列表布局代码
    code = `<ScTable 
  layout="list"
  :data="tableData" 
  row-key="id"
  :border="${config.border}"
  :stripe="${config.stripe}" 
  :height="400"
  :pageSize="${config.pageSize}"
  :paginationType="${config.paginationType}">
  <template #default="{ row }">
    <div class="list-item">
      <div class="list-item-main">
        <h4>{{ row.name }}</h4>
        <p>{{ row.description }}</p>
      </div>
      <div class="list-item-meta">
        <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
          {{ row.status === "active" ? "启用" : "禁用" }}
        </el-tag>
        <span class="list-time">{{ row.createTime }}</span>
      </div>
      <div class="list-item-actions">
        <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
      </div>
    </div>
  </template>
</ScTable>`;
  }
  
  return code;
});

// 在组件初始化时生成数据
onMounted(() => {
  generateData();
});
</script>

<style lang="scss" scoped>
.example-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.config-panel {
  width: 450px;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 15px;
  background-color: var(--el-bg-color);
}

.preview-panel {
  flex-grow: 1;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 15px;
}

.code-panel {
  margin-top: 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 15px;
  background-color: var(--el-bg-color);
}

.example-desc {
  color: #666;
  margin-bottom: 15px;
}

pre {
  background-color: var(--el-bg-color);
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
  white-space: pre;
}

.custom-card {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  padding: 15px;
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .card-title {
      font-size: 16px;
      font-weight: bold;
    }
  }

  .card-content {
    flex: 1;

    .card-field {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;

      .field-label {
        width: 80px;
        color: #909399;
      }

      .field-value {
        flex: 1;
      }
    }
  }

  .card-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    gap: 8px;
  }
}

.table-preview-container {
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s;

  &:hover {
    background-color: #f5f7fa;
  }

  .list-item-main {
    flex: 1;
    margin-right: 20px;

    h4 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: bold;
    }

    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }

  .list-item-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-right: 20px;

    .list-time {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
    }
  }

  .list-item-actions {
    display: flex;
    gap: 8px;
  }
}

.data-count-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.context-menu-help {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f8f9fa;

  h4 {
    margin-bottom: 10px;
    font-size: 16px;
    font-weight: bold;
  }

  p {
    margin-bottom: 10px;
  }

  ul {
    margin-bottom: 10px;
  }
}
</style>
