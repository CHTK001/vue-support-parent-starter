<template>
  <div class="sc-table-example">
    <el-tabs type="border-card">
      <el-tab-pane label="表格模式">
        <h3>表格模式 (默认)</h3>
        <p class="example-desc">默认表格模式，支持排序、筛选、多选等功能</p>

        <ScTable ref="tableRef" :data="tableData" :params="{}" row-key="id">
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
          <el-table-column prop="createTime" label="创建时间" sortable></el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </ScTable>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScTable ref="tableRef" :data="tableData" :params="{}" row-key="id"&gt;
  &lt;el-table-column type="selection" width="55"&gt;&lt;/el-table-column&gt;
  &lt;el-table-column prop="id" label="ID" sortable&gt;&lt;/el-table-column&gt;
  &lt;el-table-column prop="name" label="名称"&gt;&lt;/el-table-column&gt;
  &lt;el-table-column prop="status" label="状态"&gt;
    &lt;template #default="{ row }"&gt;
      &lt;el-tag :type="row.status === 'active' ? 'success' : 'info'"&gt;
        {{ row.status === 'active' ? '启用' : '禁用' }}
      &lt;/el-tag&gt;
    &lt;/template&gt;
  &lt;/el-table-column&gt;
  &lt;el-table-column prop="createTime" label="创建时间" sortable&gt;&lt;/el-table-column&gt;
  &lt;el-table-column label="操作" width="150"&gt;
    &lt;template #default="{ row }"&gt;
      &lt;el-button type="primary" size="small" @click="handleEdit(row)"&gt;编辑&lt;/el-button&gt;
      &lt;el-button type="danger" size="small" @click="handleDelete(row)"&gt;删除&lt;/el-button&gt;
    &lt;/template&gt;
  &lt;/el-table-column&gt;
&lt;/ScTable&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="卡片模式">
        <h3>卡片模式</h3>
        <p class="example-desc">使用卡片布局展示表格数据，适合展示图文混合内容</p>

        <ScTable layout="card" ref="cardTableRef" :data="tableData" :params="{}" row-key="id">
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

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScTable layout="card" ref="cardTableRef" :data="tableData" :params="{}" row-key="id"&gt;
  &lt;template #default="{ row }"&gt;
    &lt;div class="custom-card"&gt;
      &lt;div class="card-header"&gt;
        &lt;span class="card-title"&gt;{{ row.name }}&lt;/span&gt;
        &lt;el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small"&gt;
          {{ row.status === 'active' ? '启用' : '禁用' }}
        &lt;/el-tag&gt;
      &lt;/div&gt;
      &lt;div class="card-content"&gt;
        &lt;!-- 卡片内容 --&gt;
      &lt;/div&gt;
      &lt;div class="card-actions"&gt;
        &lt;el-button type="primary" size="small" @click="handleEdit(row)"&gt;编辑&lt;/el-button&gt;
        &lt;el-button type="danger" size="small" @click="handleDelete(row)"&gt;删除&lt;/el-button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  &lt;/template&gt;
&lt;/ScTable&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="列表模式">
        <h3>列表模式</h3>
        <p class="example-desc">使用列表布局展示表格数据，适合简单数据的展示</p>

        <ScTable layout="list" ref="listTableRef" :data="tableData" :params="{}" row-key="id">
          <template #default="{ row }">
            <div class="list-item-inner">
              <div class="list-item-main">
                <h4>{{ row.name }}</h4>
                <p>{{ row.description }}</p>
              </div>
              <div class="list-item-meta">
                <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
                  {{ row.status === "active" ? "启用" : "禁用" }}
                </el-tag>
                <span class="time">{{ row.createTime }}</span>
              </div>
              <div class="list-item-actions">
                <el-button type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
                <el-button type="danger" size="small" @click="handleDelete(row)">删除</el-button>
              </div>
            </div>
          </template>
        </ScTable>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScTable 组件 API</h3>
        <el-descriptions title="属性" :column="1" border>
          <el-descriptions-item label="data">表格数据，类型: Array</el-descriptions-item>
          <el-descriptions-item label="params">请求参数，类型: Object</el-descriptions-item>
          <el-descriptions-item label="url">数据请求地址，类型: String</el-descriptions-item>
          <el-descriptions-item label="layout">布局模式: table(默认)/card/list</el-descriptions-item>
          <el-descriptions-item label="row-key">行数据的唯一键名，类型: String</el-descriptions-item>
          <el-descriptions-item label="col-size">卡片模式下每行显示的列数，类型: Number，默认: 3</el-descriptions-item>
          <el-descriptions-item label="border">是否显示边框，类型: Boolean</el-descriptions-item>
          <el-descriptions-item label="stripe">是否显示斑马纹，类型: Boolean</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">方法</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="clearSelection()">清空选择</el-descriptions-item>
          <el-descriptions-item label="toggleRowSelection(row, selected)">切换行的选中状态</el-descriptions-item>
          <el-descriptions-item label="toggleAllSelection()">切换所有行的选中状态</el-descriptions-item>
          <el-descriptions-item label="setCurrentRow(row)">设置当前行</el-descriptions-item>
          <el-descriptions-item label="doLayout()">重新布局</el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-4">事件</h4>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="row-click">行点击事件</el-descriptions-item>
          <el-descriptions-item label="selection-change">选择变化事件</el-descriptions-item>
          <el-descriptions-item label="sort-change">排序变化事件</el-descriptions-item>
          <el-descriptions-item label="filter-change">过滤变化事件</el-descriptions-item>
        </el-descriptions>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";

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
]);

// 表格引用
const tableRef = ref(null);
const cardTableRef = ref(null);
const listTableRef = ref(null);

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
.sc-table-example {
  padding: 16px;

  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .custom-card {
    border: 1px solid #ebeef5;
    border-radius: 4px;
    padding: 16px;
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
      margin-bottom: 16px;

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
      margin-top: 16px;
      gap: 8px;
    }
  }

  .list-item-inner {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 4px;
    border: 1px solid #ebeef5;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }

    .list-item-main {
      flex: 1;

      h4 {
        margin: 0 0 8px 0;
        font-size: 16px;
      }

      p {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }

    .list-item-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      margin-right: 16px;

      .time {
        font-size: 12px;
        color: #909399;
        margin-top: 8px;
      }
    }

    .list-item-actions {
      display: flex;
      gap: 8px;
    }
  }

  .mt-4 {
    margin-top: 16px;
  }

  pre {
    background-color: #f5f7fa;
    border-radius: 4px;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #333;
    }
  }
}
</style>
