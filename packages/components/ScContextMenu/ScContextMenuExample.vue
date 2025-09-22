<template>
  <div class="sc-context-menu-example">
    <h2>ScContextMenu 右键菜单组件示例</h2>
    
    <!-- 基础用法 -->
    <div class="example-section">
      <h3>基础用法</h3>
      <p>在下面的区域右键点击，查看基础右键菜单</p>
      <div 
        class="demo-area basic-demo"
        @contextmenu="handleBasicContextMenu"
      >
        <div class="demo-content">
          <el-icon><Document /></el-icon>
          <p>右键点击此区域</p>
          <p>显示基础右键菜单</p>
        </div>
      </div>
    </div>

    <!-- 多级菜单 -->
    <div class="example-section">
      <h3>多级菜单</h3>
      <p>支持多级嵌套菜单，鼠标悬停展开子菜单</p>
      <div 
        class="demo-area nested-demo"
        @contextmenu="handleNestedContextMenu"
      >
        <div class="demo-content">
          <el-icon><Folder /></el-icon>
          <p>右键点击此区域</p>
          <p>显示多级右键菜单</p>
        </div>
      </div>
    </div>

    <!-- 条件显示菜单 -->
    <div class="example-section">
      <h3>条件显示菜单</h3>
      <p>根据数据状态动态显示不同的菜单项</p>
      <div class="demo-controls">
        <el-switch 
          v-model="isAdmin" 
          active-text="管理员模式" 
          inactive-text="普通用户"
        />
        <el-switch 
          v-model="isEditable" 
          active-text="可编辑" 
          inactive-text="只读"
        />
      </div>
      <div 
        class="demo-area conditional-demo"
        @contextmenu="handleConditionalContextMenu"
      >
        <div class="demo-content">
          <el-icon><User /></el-icon>
          <p>右键点击此区域</p>
          <p>根据权限显示不同菜单</p>
          <p>当前状态：{{ isAdmin ? '管理员' : '普通用户' }} | {{ isEditable ? '可编辑' : '只读' }}</p>
        </div>
      </div>
    </div>

    <!-- 表格右键菜单 -->
    <div class="example-section">
      <h3>表格右键菜单</h3>
      <p>在表格行上右键点击，显示针对该行数据的操作菜单</p>
      <el-table 
        :data="tableData" 
        style="width: 100%"
        @row-contextmenu="handleTableContextMenu"
      >
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '激活' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 操作结果显示 -->
    <div class="example-section">
      <h3>操作结果</h3>
      <el-card v-if="lastAction">
        <p><strong>最后操作：</strong>{{ lastAction.action }}</p>
        <p v-if="lastAction.data"><strong>操作数据：</strong>{{ JSON.stringify(lastAction.data) }}</p>
        <p><strong>操作时间：</strong>{{ lastAction.time }}</p>
      </el-card>
      <el-empty v-else description="暂无操作记录" />
    </div>

    <!-- 功能说明 -->
    <div class="example-section">
      <h3>功能说明</h3>
      <el-card>
        <h4>组件特性</h4>
        <ul>
          <li>支持右键菜单显示，自动定位</li>
          <li>支持多级嵌套菜单</li>
          <li>支持菜单项的条件显示</li>
          <li>支持自定义图标和文字</li>
          <li>支持分割线</li>
          <li>自动处理边界检测，防止菜单超出屏幕</li>
        </ul>
        
        <h4>使用场景</h4>
        <ul>
          <li>表格行操作菜单</li>
          <li>文件管理器右键菜单</li>
          <li>图形编辑器上下文菜单</li>
          <li>树形组件节点菜单</li>
          <li>卡片组件操作菜单</li>
        </ul>
      </el-card>
    </div>

    <!-- API 文档 -->
    <div class="example-section">
      <h3>API 文档</h3>
      <el-card>
        <h4>Props</h4>
        <el-table :data="propsData" border>
          <el-table-column prop="name" label="属性名" width="120" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="default" label="默认值" width="80" />
          <el-table-column prop="description" label="说明" />
        </el-table>
        
        <h4 style="margin-top: 20px;">Methods</h4>
        <el-table :data="methodsData" border>
          <el-table-column prop="name" label="方法名" width="120" />
          <el-table-column prop="params" label="参数" width="200" />
          <el-table-column prop="description" label="说明" />
        </el-table>
        
        <h4 style="margin-top: 20px;">菜单项配置</h4>
        <el-table :data="menuItemData" border>
          <el-table-column prop="name" label="属性名" width="120" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="description" label="说明" />
        </el-table>
      </el-card>
    </div>

    <!-- 右键菜单组件 -->
    <ScContextMenu ref="contextMenuRef" :menus="currentMenus" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Document, Folder, User, Edit, Delete, View, Setting, Download, Share, Copy } from '@element-plus/icons-vue'
import ScContextMenu from './index.vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const contextMenuRef = ref()
const currentMenus = ref([])
const lastAction = ref(null)
const isAdmin = ref(false)
const isEditable = ref(true)
const currentRowData = ref(null)

// 表格数据
const tableData = ref([
  { id: 1, name: '张三', age: 25, email: 'zhangsan@example.com', status: 'active' },
  { id: 2, name: '李四', age: 30, email: 'lisi@example.com', status: 'inactive' },
  { id: 3, name: '王五', age: 28, email: 'wangwu@example.com', status: 'active' },
  { id: 4, name: '赵六', age: 35, email: 'zhaoliu@example.com', status: 'inactive' }
])

// 记录操作
const recordAction = (action, data = null) => {
  lastAction.value = {
    action,
    data,
    time: new Date().toLocaleString()
  }
  ElMessage.success(`执行操作：${action}`)
}

// 基础菜单配置
const basicMenus = [
  {
    name: '查看',
    icon: 'ep:view',
    handle: () => recordAction('查看')
  },
  {
    name: '编辑',
    icon: 'ep:edit',
    handle: () => recordAction('编辑')
  },
  {
    type: 'LINE' // 分割线
  },
  {
    name: '删除',
    icon: 'ep:delete',
    handle: () => recordAction('删除')
  }
]

// 多级菜单配置
const nestedMenus = [
  {
    name: '文件操作',
    icon: 'ep:folder',
    children: [
      {
        name: '新建文件',
        icon: 'ep:document-add',
        handle: () => recordAction('新建文件')
      },
      {
        name: '新建文件夹',
        icon: 'ep:folder-add',
        handle: () => recordAction('新建文件夹')
      }
    ]
  },
  {
    name: '编辑操作',
    icon: 'ep:edit',
    children: [
      {
        name: '复制',
        icon: 'ep:copy-document',
        handle: () => recordAction('复制')
      },
      {
        name: '粘贴',
        icon: 'ep:document-copy',
        handle: () => recordAction('粘贴')
      },
      {
        name: '剪切',
        icon: 'ep:scissors',
        handle: () => recordAction('剪切')
      }
    ]
  },
  {
    type: 'LINE'
  },
  {
    name: '分享',
    icon: 'ep:share',
    children: [
      {
        name: '生成链接',
        icon: 'ep:link',
        handle: () => recordAction('生成分享链接')
      },
      {
        name: '发送邮件',
        icon: 'ep:message',
        handle: () => recordAction('发送邮件分享')
      }
    ]
  }
]

// 条件菜单配置
const getConditionalMenus = () => [
  {
    name: '查看',
    icon: 'ep:view',
    handle: () => recordAction('查看'),
    show: () => true // 始终显示
  },
  {
    name: '编辑',
    icon: 'ep:edit',
    handle: () => recordAction('编辑'),
    show: () => isEditable.value // 只有可编辑时显示
  },
  {
    name: '管理员操作',
    icon: 'ep:setting',
    show: () => isAdmin.value, // 只有管理员显示
    children: [
      {
        name: '用户管理',
        icon: 'ep:user',
        handle: () => recordAction('用户管理')
      },
      {
        name: '系统设置',
        icon: 'ep:setting',
        handle: () => recordAction('系统设置')
      }
    ]
  },
  {
    type: 'LINE',
    show: () => isAdmin.value || isEditable.value
  },
  {
    name: '删除',
    icon: 'ep:delete',
    handle: () => recordAction('删除'),
    show: () => isAdmin.value // 只有管理员可以删除
  }
]

// 表格菜单配置
const getTableMenus = (rowData) => [
  {
    name: '查看详情',
    icon: 'ep:view',
    handle: () => recordAction('查看详情', rowData)
  },
  {
    name: '编辑用户',
    icon: 'ep:edit',
    handle: () => recordAction('编辑用户', rowData)
  },
  {
    name: rowData.status === 'active' ? '禁用用户' : '启用用户',
    icon: rowData.status === 'active' ? 'ep:close' : 'ep:check',
    handle: () => {
      const action = rowData.status === 'active' ? '禁用用户' : '启用用户'
      recordAction(action, rowData)
      // 更新状态
      const index = tableData.value.findIndex(item => item.id === rowData.id)
      if (index !== -1) {
        tableData.value[index].status = rowData.status === 'active' ? 'inactive' : 'active'
      }
    }
  },
  {
    type: 'LINE'
  },
  {
    name: '删除用户',
    icon: 'ep:delete',
    handle: () => recordAction('删除用户', rowData)
  }
]

// 事件处理函数
const handleBasicContextMenu = (event) => {
  currentMenus.value = basicMenus
  contextMenuRef.value.open(event, {}, {})
}

const handleNestedContextMenu = (event) => {
  currentMenus.value = nestedMenus
  contextMenuRef.value.open(event, {}, {})
}

const handleConditionalContextMenu = (event) => {
  currentMenus.value = getConditionalMenus()
  contextMenuRef.value.open(event, {}, {})
}

const handleTableContextMenu = (row, column, event) => {
  event.preventDefault()
  currentRowData.value = row
  currentMenus.value = getTableMenus(row)
  contextMenuRef.value.open(event, row, {})
}

// API 文档数据
const propsData = ref([
  {
    name: 'menus',
    type: 'Array',
    default: '[]',
    description: '菜单配置数组'
  },
  {
    name: 'x',
    type: 'Number',
    default: '0',
    description: '菜单显示的X坐标'
  },
  {
    name: 'y',
    type: 'Number',
    default: '0',
    description: '菜单显示的Y坐标'
  }
])

const methodsData = ref([
  {
    name: 'open',
    params: 'event, data, node',
    description: '打开右键菜单，event为鼠标事件，data为传递的数据，node为节点信息'
  },
  {
    name: 'close',
    params: '-',
    description: '关闭右键菜单'
  }
])

const menuItemData = ref([
  {
    name: 'name',
    type: 'String',
    description: '菜单项显示名称'
  },
  {
    name: 'icon',
    type: 'String',
    description: '菜单项图标，支持Element Plus图标'
  },
  {
    name: 'handle',
    type: 'Function',
    description: '菜单项点击处理函数，参数为(data, node)'
  },
  {
    name: 'show',
    type: 'Function',
    description: '菜单项显示条件函数，返回boolean'
  },
  {
    name: 'children',
    type: 'Array',
    description: '子菜单配置数组'
  },
  {
    name: 'type',
    type: 'String',
    description: '菜单项类型，设置为"LINE"时显示分割线'
  }
])
</script>

<style scoped>
.sc-context-menu-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
}

.example-section h3 {
  color: #409eff;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 600;
}

.example-section p {
  color: #606266;
  margin-bottom: 15px;
  line-height: 1.6;
}

.demo-area {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  padding: 40px;
  margin: 20px 0;
  cursor: pointer;
  transition: all 0.3s;
  user-select: none;
}

.demo-area:hover {
  border-color: #409eff;
  background-color: #f0f9ff;
}

.demo-content {
  text-align: center;
  color: #606266;
}

.demo-content .el-icon {
  font-size: 48px;
  color: #409eff;
  margin-bottom: 15px;
}

.demo-content p {
  margin: 8px 0;
  font-size: 14px;
}

.basic-demo:hover {
  border-color: #67c23a;
  background-color: #f0f9ff;
}

.basic-demo .demo-content .el-icon {
  color: #67c23a;
}

.nested-demo:hover {
  border-color: #e6a23c;
  background-color: #fdf6ec;
}

.nested-demo .demo-content .el-icon {
  color: #e6a23c;
}

.conditional-demo:hover {
  border-color: #f56c6c;
  background-color: #fef0f0;
}

.conditional-demo .demo-content .el-icon {
  color: #f56c6c;
}

.demo-controls {
  margin-bottom: 15px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.el-card {
  margin-top: 15px;
}

.el-card h4 {
  color: var(--el-text-color-primary);
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.el-card ul {
  margin: 0;
  padding-left: 20px;
}

.el-card li {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-context-menu-example {
    padding: 15px;
  }
  
  .demo-area {
    padding: 30px 20px;
  }
  
  .demo-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .example-section h3 {
    font-size: 16px;
  }
}
</style>