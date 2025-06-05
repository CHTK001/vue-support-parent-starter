<template>
  <div class="nacos-config h-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="nacos-config-header mb-4 flex items-center justify-between">
      <div class="nacos-config-header__left flex items-center">
        <el-select v-model="currentNamespace" placeholder="选择命名空间" class="nacos-namespace-select mr-4" @change="handleNamespaceChange">
          <el-option
            v-for="item in namespaces"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <div class="flex items-center">
              <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
              <span>{{ item.name }}</span>
            </div>
          </el-option>
        </el-select>
        
        <div class="nacos-search-box flex items-center">
          <el-input
            v-model="searchParams.dataId"
            placeholder="请输入配置ID"
            clearable
            class="mr-2"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:search-line" />
            </template>
          </el-input>
          
          <el-input
            v-model="searchParams.group"
            placeholder="请输入分组"
            clearable
            class="mr-2"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:price-tag-3-line" />
            </template>
          </el-input>
          
          <el-button type="primary" @click="handleSearch">
            <IconifyIconOnline icon="ri:search-line" class="mr-1" />
            搜索
          </el-button>
        </div>
      </div>
      
      <div class="nacos-config-header__right flex items-center gap-2">
        <el-button type="primary" @click="handleAddConfig">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          新增配置
        </el-button>
        
        <el-button type="info" @click="handleManageNamespace">
          <IconifyIconOnline icon="ri:folder-settings-line" class="mr-1" />
          命名空间管理
        </el-button>
        
        <el-button @click="handleRefresh">
          <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
          刷新
        </el-button>
      </div>
    </div>
    
    <!-- 配置列表 -->
    <div class="nacos-config-body flex-1 overflow-hidden">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="configList"
        border
        stripe
        highlight-current-row
        class="nacos-table h-full"
        @row-click="handleRowClick"
      >
        <el-table-column type="index" width="60" align="center" />
        <el-table-column prop="dataId" label="配置ID" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="flex items-center">
              <el-tag :type="getConfigTypeTag(row.type)" class="mr-2">{{ row.type }}</el-tag>
              <span>{{ row.dataId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="group" label="分组" min-width="120" show-overflow-tooltip />
        <el-table-column prop="tenant" label="命名空间" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getNamespaceName(row.tenant) }}
          </template>
        </el-table-column>
        <el-table-column prop="appName" label="应用" min-width="120" show-overflow-tooltip />
        <el-table-column prop="gmtModified" label="更新时间" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <div class="flex justify-center gap-2">
              <el-tooltip content="编辑" placement="top">
                <el-button type="primary" link @click.stop="handleEditConfig(row)">
                  <IconifyIconOnline icon="ep:edit" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="克隆" placement="top">
                <el-button type="success" link @click.stop="handleCloneConfig(row)">
                  <IconifyIconOnline icon="ep:copy-document" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除" placement="top">
                <el-button type="danger" link @click.stop="handleDeleteConfig(row)">
                  <IconifyIconOnline icon="ep:delete" />
                </el-button>
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="nacos-pagination flex justify-end mt-4">
        <el-pagination
          v-model:current-page="searchParams.pageNum"
          v-model:page-size="searchParams.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
    
    <!-- 配置详情抽屉 -->
    <el-drawer
      v-model="configDetailVisible"
      title="配置详情"
      size="50%"
      destroy-on-close
    >
      <template v-if="currentConfig">
        <div class="nacos-config-detail p-4">
          <div class="nacos-config-header mb-4 pb-2 border-b">
            <div class="flex items-center justify-between mb-2">
              <div class="text-lg font-medium">{{ currentConfig.dataId }}</div>
              <el-tag :type="getConfigTypeTag(currentConfig.type)">{{ currentConfig.type }}</el-tag>
            </div>
            <div class="text-sm text-gray-500">
              分组: {{ currentConfig.group }} | 
              命名空间: {{ getNamespaceName(currentConfig.namespace) }} | 
              更新时间: {{ currentConfig.updateTime || new Date().toLocaleString() }}
            </div>
          </div>
          
          <div class="nacos-config-content">
            <monaco-editor
              v-model="currentConfig.content"
              :language="getEditorLanguage(currentConfig.type)"
              theme="vs"
              :options="{ readOnly: true, minimap: { enabled: false } }"
              class="config-editor"
            />
          </div>
        </div>
      </template>
    </el-drawer>
    
    <!-- 配置编辑器对话框 -->
    <el-dialog
      v-model="configEditorVisible"
      :title="editorMode === 'add' ? '新增配置' : '编辑配置'"
      width="700px"
      destroy-on-close
      @close="handleEditorClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="数据ID" prop="dataId">
          <el-input v-model="form.dataId" placeholder="请输入配置ID" :disabled="editorMode === 'edit'" />
        </el-form-item>
        
        <el-form-item label="分组" prop="group">
          <el-input v-model="form.group" placeholder="请输入分组名称" :disabled="editorMode === 'edit'" />
        </el-form-item>
        
        <el-form-item label="命名空间" prop="namespace">
          <el-select v-model="form.namespace" placeholder="请选择命名空间" class="w-full" :disabled="editorMode === 'edit'">
            <el-option
              v-for="item in namespaces"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="配置格式" prop="type">
          <el-select v-model="form.type" placeholder="请选择配置格式" class="w-full">
            <el-option label="Properties" value="properties" />
            <el-option label="JSON" value="json" />
            <el-option label="XML" value="xml" />
            <el-option label="YAML" value="yaml" />
            <el-option label="TEXT" value="text" />
            <el-option label="HTML" value="html" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="配置内容" prop="content">
          <div class="editor-container">
            <el-alert v-if="form.type === 'json'" type="info" show-icon :closable="false">
              JSON格式将自动格式化，提交时会进行验证
            </el-alert>
            <monaco-editor
              v-model="form.content"
              :language="getEditorLanguage(form.type)"
              theme="vs"
              :options="editorOptions"
              class="editor"
            />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="configEditorVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitConfig">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 命名空间管理对话框 -->
    <el-dialog
      v-model="namespaceManagerVisible"
      title="命名空间管理"
      width="700px"
      destroy-on-close
    >
      <div class="namespace-header mb-4 flex justify-between">
        <div class="namespace-title text-lg font-medium">
          <IconifyIconOnline icon="ri:folder-line" class="mr-2" />
          命名空间列表
        </div>
        <el-button type="primary" @click="handleAddNamespace">
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          新增命名空间
        </el-button>
      </div>
      
      <el-table :data="namespaceList" border style="width: 100%" v-loading="namespaceLoading">
        <el-table-column prop="id" label="命名空间ID" min-width="120" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="desc" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="configCount" label="配置数量" width="100" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.id !== 'public'"
              type="danger"
              link
              @click="handleDeleteNamespace(row)"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
    
    <!-- 新增命名空间对话框 -->
    <el-dialog
      v-model="namespaceFormVisible"
      title="新增命名空间"
      width="500px"
      append-to-body
      destroy-on-close
    >
      <el-form ref="namespaceFormRef" :model="namespaceForm" :rules="namespaceRules" label-width="100px">
        <el-form-item label="命名空间ID" prop="namespaceId">
          <el-input v-model="namespaceForm.namespaceId" placeholder="请输入命名空间ID" />
        </el-form-item>
        
        <el-form-item label="名称" prop="namespaceName">
          <el-input v-model="namespaceForm.namespaceName" placeholder="请输入命名空间名称" />
        </el-form-item>
        
        <el-form-item label="描述" prop="namespaceDesc">
          <el-input
            v-model="namespaceForm.namespaceDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入命名空间描述"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="namespaceFormVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitNamespace">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, defineProps, onMounted } from 'vue';
import { message } from '@repo/utils';
import { ElMessageBox } from 'element-plus';
import MonacoEditor from '@repo/components/MonacoEditor/index.vue';
import nacosService from '@/services/nacosService';

// 组件属性
const props = defineProps({
  dataSource: {
    type: Object,
    required: true
  }
});

// 组件引用
const tableRef = ref(null);
const formRef = ref(null);
const namespaceFormRef = ref(null);

// 数据状态
const loading = ref(false);
const namespaceLoading = ref(false);
const configList = ref([]);
const namespaces = ref([]);
const namespaceList = ref([]);
const currentNamespace = ref('');
const total = ref(0);
const configDetailVisible = ref(false);
const configEditorVisible = ref(false);
const namespaceManagerVisible = ref(false);
const namespaceFormVisible = ref(false);
const currentConfig = ref(null);
const editorMode = ref('add');

// 编辑器选项
const editorOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  fontSize: 14,
  lineHeight: 20
};

// 搜索参数
const searchParams = reactive({
  dataId: '',
  group: '',
  namespace: '',
  pageNum: 1,
  pageSize: 20
});

// 表单数据
const form = reactive({
  dataId: '',
  group: 'DEFAULT_GROUP',
  namespace: '',
  type: 'properties',
  content: ''
});

// 表单验证规则
const rules = {
  dataId: [{ required: true, message: '请输入配置ID', trigger: 'blur' }],
  group: [{ required: true, message: '请输入分组名称', trigger: 'blur' }],
  namespace: [{ required: true, message: '请选择命名空间', trigger: 'change' }],
  type: [{ required: true, message: '请选择配置格式', trigger: 'change' }],
  content: [{ required: true, message: '请输入配置内容', trigger: 'blur' }]
};

// 命名空间表单
const namespaceForm = reactive({
  namespaceId: '',
  namespaceName: '',
  namespaceDesc: ''
});

// 命名空间表单验证规则
const namespaceRules = {
  namespaceId: [
    { required: true, message: '请输入命名空间ID', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]+$/, message: '命名空间ID只能包含字母、数字、下划线和连字符', trigger: 'blur' }
  ],
  namespaceName: [
    { required: true, message: '请输入命名空间名称', trigger: 'blur' }
  ]
};

/**
 * 获取命名空间名称
 */
const getNamespaceName = (namespaceId) => {
  if (!namespaceId) return '默认命名空间';
  const namespace = namespaces.value.find(item => item.id === namespaceId);
  return namespace ? namespace.name : namespaceId;
};

/**
 * 获取配置类型对应的标签类型
 */
const getConfigTypeTag = (type) => {
  const typeMap = {
    'properties': 'success',
    'json': 'primary',
    'xml': 'warning',
    'yaml': 'info',
    'text': '',
    'html': 'danger'
  };
  return typeMap[type] || '';
};

/**
 * 根据配置类型获取编辑器语言
 */
const getEditorLanguage = (type) => {
  const typeMap = {
    'properties': 'properties',
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'text': 'plaintext',
    'html': 'html'
  };
  return typeMap[type] || 'plaintext';
};

/**
 * 加载命名空间列表
 */
const loadNamespaces = async () => {
  try {
    namespaceList.value = await nacosService.getNamespaces(props.dataSource);
    namespaces.value = namespaceList.value;
    
    // 如果没有选择命名空间且列表不为空，默认选择第一个
    if (!currentNamespace.value && namespaces.value.length > 0) {
      currentNamespace.value = namespaces.value[0].id;
      searchParams.namespace = currentNamespace.value;
    }
    
    // 加载配置列表
    loadConfigList();
  } catch (error) {
    console.error('加载命名空间列表失败:', error);
  }
};

/**
 * 加载配置列表
 */
const loadConfigList = async () => {
  loading.value = true;
  
  try {
    const result = await nacosService.getConfigList(props.dataSource, {
      ...searchParams,
      namespace: currentNamespace.value
    });
    
    if (result) {
      configList.value = result.pageItems || [];
      total.value = result.totalCount || 0;
    }
  } catch (error) {
    console.error('加载配置列表失败:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理命名空间变更
 */
const handleNamespaceChange = (value) => {
  searchParams.namespace = value;
  searchParams.pageNum = 1;
  loadConfigList();
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  searchParams.pageNum = 1;
  loadConfigList();
};

/**
 * 处理刷新
 */
const handleRefresh = () => {
  loadConfigList();
};

/**
 * 处理页码变化
 */
const handleCurrentChange = (page) => {
  searchParams.pageNum = page;
  loadConfigList();
};

/**
 * 处理每页条数变化
 */
const handleSizeChange = (size) => {
  searchParams.pageSize = size;
  searchParams.pageNum = 1;
  loadConfigList();
};

/**
 * 处理行点击事件
 */
const handleRowClick = async (row) => {
  try {
    const config = await nacosService.getConfigDetail(props.dataSource, {
      dataId: row.dataId,
      group: row.group,
      namespace: row.tenant
    });
    
    if (config) {
      currentConfig.value = config;
      configDetailVisible.value = true;
    }
  } catch (error) {
    console.error('获取配置详情失败:', error);
  }
};

/**
 * 处理新增配置
 */
const handleAddConfig = () => {
  editorMode.value = 'add';
  form.dataId = '';
  form.group = 'DEFAULT_GROUP';
  form.namespace = currentNamespace.value;
  form.type = 'properties';
  form.content = '';
  configEditorVisible.value = true;
};

/**
 * 处理编辑配置
 */
const handleEditConfig = async (row) => {
  try {
    const config = await nacosService.getConfigDetail(props.dataSource, {
      dataId: row.dataId,
      group: row.group,
      namespace: row.tenant
    });
    
    if (config) {
      editorMode.value = 'edit';
      form.dataId = config.dataId;
      form.group = config.group;
      form.namespace = config.namespace;
      form.type = config.type;
      form.content = config.content;
      configEditorVisible.value = true;
    }
  } catch (error) {
    console.error('获取配置详情失败:', error);
  }
};

/**
 * 处理克隆配置
 */
const handleCloneConfig = async (row) => {
  try {
    const config = await nacosService.getConfigDetail(props.dataSource, {
      dataId: row.dataId,
      group: row.group,
      namespace: row.tenant
    });
    
    if (config) {
      editorMode.value = 'add';
      form.dataId = `${config.dataId}_copy`;
      form.group = config.group;
      form.namespace = config.namespace;
      form.type = config.type;
      form.content = config.content;
      configEditorVisible.value = true;
    }
  } catch (error) {
    console.error('获取配置详情失败:', error);
  }
};

/**
 * 处理删除配置
 */
const handleDeleteConfig = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除配置 "${row.dataId}" 吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const success = await nacosService.deleteConfig(props.dataSource, {
      dataId: row.dataId,
      group: row.group,
      namespace: row.tenant
    });
    
    if (success) {
      message('删除配置成功', { type: 'success' });
      loadConfigList();
    }
  } catch (error) {
    // 用户取消删除操作
    if (error === 'cancel') return;
    
    console.error('删除配置失败:', error);
  }
};

/**
 * 处理命名空间管理
 */
const handleManageNamespace = async () => {
  namespaceLoading.value = true;
  try {
    namespaceList.value = await nacosService.getNamespaces(props.dataSource);
    namespaceManagerVisible.value = true;
  } catch (error) {
    console.error('加载命名空间列表失败:', error);
  } finally {
    namespaceLoading.value = false;
  }
};

/**
 * 处理新增命名空间
 */
const handleAddNamespace = () => {
  namespaceForm.namespaceId = '';
  namespaceForm.namespaceName = '';
  namespaceForm.namespaceDesc = '';
  namespaceFormVisible.value = true;
};

/**
 * 处理提交命名空间
 */
const handleSubmitNamespace = async () => {
  if (!namespaceFormRef.value) return;
  
  await namespaceFormRef.value.validate(async (valid) => {
    if (!valid) return;
    
    try {
      const success = await nacosService.createNamespace(props.dataSource, namespaceForm);
      
      if (success) {
        message('新增命名空间成功', { type: 'success' });
        namespaceFormVisible.value = false;
        
        // 重新加载命名空间列表
        namespaceList.value = await nacosService.getNamespaces(props.dataSource);
        namespaces.value = namespaceList.value;
      }
    } catch (error) {
      console.error('新增命名空间失败:', error);
    }
  });
};

/**
 * 处理删除命名空间
 */
const handleDeleteNamespace = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除命名空间 "${row.name}" 吗？删除后将无法恢复！`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    const success = await nacosService.deleteNamespace(props.dataSource, row.id);
    
    if (success) {
      message('删除命名空间成功', { type: 'success' });
      
      // 重新加载命名空间列表
      namespaceList.value = await nacosService.getNamespaces(props.dataSource);
      namespaces.value = namespaceList.value;
      
      // 如果当前选中的命名空间被删除，则切换到默认命名空间
      if (currentNamespace.value === row.id) {
        currentNamespace.value = namespaces.value.length > 0 ? namespaces.value[0].id : '';
        searchParams.namespace = currentNamespace.value;
        loadConfigList();
      }
    }
  } catch (error) {
    // 用户取消删除操作
    if (error === 'cancel') return;
    
    console.error('删除命名空间失败:', error);
  }
};

/**
 * 处理提交配置
 */
const handleSubmitConfig = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    try {
      // 如果是JSON格式，验证JSON格式是否正确
      if (form.type === 'json') {
        try {
          JSON.parse(form.content);
        } catch (e) {
          message('JSON格式不正确，请检查', { type: 'error' });
          return;
        }
      }
      
      const success = await nacosService.saveConfig(props.dataSource, form);
      
      if (success) {
        message(editorMode.value === 'add' ? '新增配置成功' : '更新配置成功', { type: 'success' });
        configEditorVisible.value = false;
        loadConfigList();
      }
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  });
};

/**
 * 处理编辑器关闭
 */
const handleEditorClose = () => {
  formRef.value?.resetFields();
};

// 组件挂载时初始化
onMounted(() => {
  if (props.dataSource.genId) {
    loadNamespaces();
  }
});
</script>

<style scoped lang="scss">
.nacos-config {
  .nacos-namespace-select {
    width: 200px;
  }
  
  .nacos-table {
    --el-table-row-hover-bg-color: var(--el-color-primary-light-9);
  }
  
  .editor-container {
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    overflow: hidden;
    
    .editor {
      height: 300px;
      margin-top: 8px;
    }
  }
  
  .config-editor {
    height: 400px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;
  }
}
</style> 