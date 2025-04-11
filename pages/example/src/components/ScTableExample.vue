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
              <el-option v-for="size in [5, 10, 20, 50]" :key="size" :label="size" :value="size" />
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
            <el-select v-model="config.layout">
              <el-option label="表格" value="table" />
              <el-option label="列表" value="list" />
              <el-option label="卡片" value="card" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <div class="preview-panel" :style="{ width: config.width !== 'auto' ? config.width : '100%' }">
        <h3>{{ config.layout === "table" ? "表格模式预览" : config.layout === "card" ? "卡片模式预览" : "列表模式预览" }}</h3>
        <p class="example-desc">通过左侧配置面板调整表格属性，实时查看效果</p>

        <div :style="{ height: config.height ? `${config.height}px` : 'auto' }" class="table-preview-container">
          <ScTable
            v-if="config.layout === 'table'"
            ref="tableRef"
            :data="tableData"
            :params="{}"
            row-key="id"
            :border="config.border"
            :stripe="config.stripe"
            :height="config.height > 0 ? config.height - 2 : null"
            :pagination="config.showPagination ? { pageSize: config.pageSize } : false"
            overflow-x="auto"
          >
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

          <ScTable
            v-else-if="config.layout === 'card'"
            :layout="config.layout"
            ref="otherLayoutRef"
            :data="tableData"
            :params="{}"
            row-key="id"
            :border="config.border"
            :stripe="config.stripe"
            :height="config.height > 0 ? config.height - 2 : null"
            :pagination="config.showPagination ? { pageSize: config.pageSize } : false"
            :col-size="4"
            :row-size="2"
            overflow-x="auto"
          >
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

          <ScTable
            v-else
            :layout="config.layout"
            ref="otherLayoutRef"
            :data="tableData"
            :params="{}"
            row-key="id"
            :border="config.border"
            :stripe="config.stripe"
            :height="config.height > 0 ? config.height - 2 : null"
            :pagination="config.showPagination ? { pageSize: config.pageSize } : false"
            overflow-x="auto"
          >
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";

// 配置项
const config = reactive({
  border: true,
  stripe: true,
  showPagination: true,
  pageSize: 10,
  height: 500,
  width: "800px",
  layout: "table",
});

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

// 根据配置生成代码
const generatedCode = computed(() => {
  let code = `<ScTable 
  :data="tableData" 
  :params="{}" 
  row-key="id"`;

  if (config.layout !== "table") {
    code += `\n  layout="${config.layout}"`;
  }

  if (config.border) {
    code += `\n  border`;
  }

  if (config.stripe) {
    code += `\n  stripe`;
  }

  if (config.height) {
    code += `\n  :height="${config.height}"`;
  }

  if (config.showPagination) {
    code += `\n  :pagination="{ pageSize: ${config.pageSize} }"`;
  } else {
    code += `\n  :pagination="false"`;
  }

  code += `\n  overflow-x="auto">`;

  if (config.layout === "table") {
    code += `\n  <el-table-column type="selection" width="55"></el-table-column>\n`;
    code += `  <el-table-column prop="id" label="ID" sortable></el-table-column>\n`;
    code += `  <el-table-column prop="name" label="名称"></el-table-column>\n`;
    code += `  <el-table-column prop="status" label="状态">\n`;
    code += `    <template #default="{ row }">\n`;
    code += `      <el-tag :type="row.status === 'active' ? 'success' : 'info'">\n`;
    code += `        {{ row.status === "active" ? "启用" : "禁用" }}\n`;
    code += `      </el-tag>\n`;
    code += `    </template>\n`;
    code += `  </el-table-column>\n`;
    code += `  <el-table-column prop="description" label="描述"></el-table-column>\n`;
    code += `  <el-table-column prop="createTime" label="创建时间" sortable></el-table-column>\n`;
    code += `  <el-table-column label="操作" width="150">\n`;
    code += `    <template #default="{ row }">\n`;
    code += `      <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>\n`;
    code += `      <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>\n`;
    code += `    </template>\n`;
    code += `  </el-table-column>`;
  } else if (config.layout === "card") {
    code += `\n  <template #default="{ row }">\n`;
    code += `    <div class="custom-card">\n`;
    code += `      <div class="card-header">\n`;
    code += `        <span class="card-title">{{ row.name }}</span>\n`;
    code += `        <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">\n`;
    code += `          {{ row.status === "active" ? "启用" : "禁用" }}\n`;
    code += `        </el-tag>\n`;
    code += `      </div>\n`;
    code += `      <div class="card-content">\n`;
    code += `        <!-- 卡片内容 -->\n`;
    code += `      </div>\n`;
    code += `      <div class="card-actions">\n`;
    code += `        <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>\n`;
    code += `        <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>\n`;
    code += `      </div>\n`;
    code += `    </div>\n`;
    code += `  </template>`;
  } else if (config.layout === "list") {
    code += `\n  <template #default="{ row }">\n`;
    code += `    <div class="list-item">\n`;
    code += `      <div class="list-item-main">\n`;
    code += `        <h4>{{ row.name }}</h4>\n`;
    code += `        <p>{{ row.description }}</p>\n`;
    code += `      </div>\n`;
    code += `      <div class="list-item-meta">\n`;
    code += `        <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">\n`;
    code += `          {{ row.status === "active" ? "启用" : "禁用" }}\n`;
    code += `        </el-tag>\n`;
    code += `        <span class="list-time">{{ row.createTime }}</span>\n`;
    code += `      </div>\n`;
    code += `      <div class="list-item-actions">\n`;
    code += `        <el-button type="primary" size="small">编辑</el-button>\n`;
    code += `        <el-button type="danger" size="small">删除</el-button>\n`;
    code += `      </div>\n`;
    code += `    </div>\n`;
    code += `  </template>`;
  }

  code += `\n</ScTable>`;

  return code;
});

// 表格引用
const tableRef = ref(null);

// 添加otherLayoutRef引用
const otherLayoutRef = ref(null);

// 处理编辑
const handleEdit = (row) => {
  ElMessage.success(`编辑行: ${row.id} - ${row.name}`);
};

// 处理删除
const handleDelete = (row) => {
  ElMessage.warning(`删除行: ${row.id} - ${row.name}`);
};
</script>

<style lang="scss" scoped>
.example-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.config-panel {
  width: 300px;
  flex-shrink: 0;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
}

.preview-panel {
  flex-grow: 1;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
}

.code-panel {
  margin-top: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 15px;
  background-color: #f8f9fa;
}

.example-desc {
  color: #666;
  margin-bottom: 15px;
}

pre {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
}

code {
  font-family: Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace;
  white-space: pre;
}

.custom-card {
  border: 1px solid #ebeef5;
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
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
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
</style>
