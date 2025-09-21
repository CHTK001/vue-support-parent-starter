<template>
  <div class="version-manager">
    <div class="version-header">
      <div class="header-left">
        <h3>版本管理</h3>
        <el-tag size="small" type="info">{{ versions.length }} 个版本</el-tag>
      </div>
      
      <div class="header-actions">
        <el-button type="primary" size="small" @click="showAddDialog = true">
          <el-icon><Plus /></el-icon>
          添加版本
        </el-button>
        <el-button size="small" @click="refreshVersions">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>
    
    <div class="version-list">
      <div 
        v-for="version in versions" 
        :key="version.id"
        class="version-item"
        :class="{ 'active': version.id === currentVersionId }"
      >
        <div class="version-info">
          <div class="version-header-item">
            <h4 class="version-name">{{ version.versionName }}</h4>
            <div class="version-badges">
              <el-tag 
                v-if="version.isLatest" 
                type="success" 
                size="small"
              >
                最新版本
              </el-tag>
              <el-tag 
                v-if="version.isStable" 
                type="primary" 
                size="small"
              >
                稳定版
              </el-tag>
              <el-tag 
                v-if="version.isBeta" 
                type="warning" 
                size="small"
              >
                测试版
              </el-tag>
            </div>
          </div>
          
          <div class="version-details">
            <div class="detail-row">
              <span class="label">版本号:</span>
              <span class="value">{{ version.versionCode }}</span>
            </div>
            <div class="detail-row">
              <span class="label">发布时间:</span>
              <span class="value">{{ formatTime(version.releaseTime) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">文件大小:</span>
              <span class="value">{{ formatFileSize(version.fileSize) }}</span>
            </div>
            <div class="detail-row" v-if="version.description">
              <span class="label">描述:</span>
              <span class="value">{{ version.description }}</span>
            </div>
          </div>
          
          <div class="version-changelog" v-if="version.changelog">
            <h5>更新日志:</h5>
            <div class="changelog-content" v-html="formatChangelog(version.changelog)"></div>
          </div>
        </div>
        
        <div class="version-actions">
          <el-button-group size="small">
            <el-button 
              type="primary"
              :loading="installing === version.id"
              @click="installVersion(version)"
            >
              <el-icon><Download /></el-icon>
              安装
            </el-button>
            
            <el-button @click="viewVersionDetails(version)">
              <el-icon><View /></el-icon>
              详情
            </el-button>
            
            <el-button @click="downloadVersion(version)">
              <el-icon><FolderOpened /></el-icon>
              下载
            </el-button>
          </el-button-group>
          
          <el-dropdown @command="(cmd) => handleVersionCommand(cmd, version)">
            <el-button size="small">
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-dropdown-item>
                <el-dropdown-item command="copy">
                  <el-icon><CopyDocument /></el-icon>
                  复制链接
                </el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <el-icon><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
      
      <div v-if="versions.length === 0" class="no-versions">
        <el-empty description="暂无版本信息" />
      </div>
    </div>
    
    <!-- 添加版本对话框 -->
    <el-dialog
      v-model="showAddDialog"
      title="添加版本"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFormRef"
        :model="addForm"
        :rules="addFormRules"
        label-width="100px"
      >
        <el-form-item label="版本名称" prop="versionName">
          <el-input v-model="addForm.versionName" placeholder="请输入版本名称" />
        </el-form-item>
        
        <el-form-item label="版本号" prop="versionCode">
          <el-input v-model="addForm.versionCode" placeholder="如: 1.0.0" />
        </el-form-item>
        
        <el-form-item label="版本类型">
          <el-checkbox-group v-model="addForm.versionTypes">
            <el-checkbox label="isLatest">最新版本</el-checkbox>
            <el-checkbox label="isStable">稳定版</el-checkbox>
            <el-checkbox label="isBeta">测试版</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="安装包">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept=".zip,.tar.gz,.deb,.rpm"
            @change="handleFileChange"
          >
            <el-button>
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持 zip, tar.gz, deb, rpm 格式，文件大小不超过 500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="版本描述">
          <el-input
            v-model="addForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入版本描述"
          />
        </el-form-item>
        
        <el-form-item label="更新日志">
          <el-input
            v-model="addForm.changelog"
            type="textarea"
            :rows="5"
            placeholder="请输入更新日志，支持 Markdown 格式"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="adding" @click="handleAddVersion">
          确定添加
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 版本详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="版本详情"
      width="800px"
    >
      <div v-if="currentVersion" class="version-detail">
        <div class="detail-section">
          <h4>基本信息</h4>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="版本名称">
              {{ currentVersion.versionName }}
            </el-descriptions-item>
            <el-descriptions-item label="版本号">
              {{ currentVersion.versionCode }}
            </el-descriptions-item>
            <el-descriptions-item label="发布时间">
              {{ formatTime(currentVersion.releaseTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(currentVersion.fileSize) }}
            </el-descriptions-item>
            <el-descriptions-item label="下载次数">
              {{ currentVersion.downloadCount || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="安装次数">
              {{ currentVersion.installCount || 0 }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
        
        <div class="detail-section" v-if="currentVersion.description">
          <h4>版本描述</h4>
          <div class="description-content">{{ currentVersion.description }}</div>
        </div>
        
        <div class="detail-section" v-if="currentVersion.changelog">
          <h4>更新日志</h4>
          <div class="changelog-content" v-html="formatChangelog(currentVersion.changelog)"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { message, ElMessageBox } from '@repo/utils';
import {
  Plus,
  Refresh,
  Download,
  View,
  FolderOpened,
  More,
  Edit,
  CopyDocument,
  Delete,
  Upload
} from '@element-plus/icons-vue';
import type { SystemSoftVersion } from '@/api/soft';
import { installSoft } from '@/api/soft';

interface Props {
  versions: SystemSoftVersion[];
  currentVersionId?: number;
  softId: number;
}

interface Emits {
  (e: 'refresh'): void;
  (e: 'install-version', version: SystemSoftVersion): void;
  (e: 'add-version', versionData: any): void;
  (e: 'edit-version', version: SystemSoftVersion): void;
  (e: 'delete-version', version: SystemSoftVersion): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const installing = ref<number | null>(null);
const adding = ref(false);
const showAddDialog = ref(false);
const showDetailDialog = ref(false);
const currentVersion = ref<SystemSoftVersion | null>(null);
const addFormRef = ref();
const uploadRef = ref();

const addForm = reactive({
  versionName: '',
  versionCode: '',
  versionTypes: [] as string[],
  description: '',
  changelog: '',
  file: null as File | null
});

const addFormRules = {
  versionName: [
    { required: true, message: '请输入版本名称', trigger: 'blur' }
  ],
  versionCode: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^\d+\.\d+\.\d+/, message: '版本号格式不正确', trigger: 'blur' }
  ]
};

// 方法
const refreshVersions = () => {
  emit('refresh');
};

const installVersion = async (version: SystemSoftVersion) => {
  try {
    await ElMessageBox.confirm(
      `确定要安装版本 "${version.versionName}" 吗？`,
      '安装确认',
      {
        confirmButtonText: '确定安装',
        cancelButtonText: '取消',
        type: 'info'
      }
    );
    
    installing.value = version.id!;
    emit('install-version', version);
  } catch (error) {
    // 用户取消
  } finally {
    installing.value = null;
  }
};

const viewVersionDetails = (version: SystemSoftVersion) => {
  currentVersion.value = version;
  showDetailDialog.value = true;
};

const downloadVersion = (version: SystemSoftVersion) => {
  if (version.downloadUrl) {
    window.open(version.downloadUrl, '_blank');
  } else {
    message.warning('下载链接不可用');
  }
};

const handleVersionCommand = async (command: string, version: SystemSoftVersion) => {
  switch (command) {
    case 'edit':
      emit('edit-version', version);
      break;
    case 'copy':
      if (version.downloadUrl) {
        await navigator.clipboard.writeText(version.downloadUrl);
        message.success('下载链接已复制到剪贴板');
      } else {
        message.warning('下载链接不可用');
      }
      break;
    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除版本 "${version.versionName}" 吗？此操作不可恢复。`,
          '删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
        );
        emit('delete-version', version);
      } catch (error) {
        // 用户取消
      }
      break;
  }
};

const handleFileChange = (file: any) => {
  addForm.file = file.raw;
};

const handleAddVersion = async () => {
  if (!addFormRef.value) return;
  
  try {
    await addFormRef.value.validate();
    
    if (!addForm.file) {
      message.warning('请选择安装包文件');
      return;
    }
    
    adding.value = true;
    
    const versionData = {
      ...addForm,
      softId: props.softId,
      isLatest: addForm.versionTypes.includes('isLatest'),
      isStable: addForm.versionTypes.includes('isStable'),
      isBeta: addForm.versionTypes.includes('isBeta')
    };
    
    emit('add-version', versionData);
    
    // 重置表单
    addFormRef.value.resetFields();
    addForm.file = null;
    addForm.versionTypes = [];
    uploadRef.value?.clearFiles();
    showAddDialog.value = false;
    
    message.success('版本添加成功');
  } catch (error) {
    console.error('添加版本失败:', error);
  } finally {
    adding.value = false;
  }
};

const formatTime = (time: string | Date) => {
  if (!time) return '-';
  return new Date(time).toLocaleString('zh-CN');
};

const formatFileSize = (size: number) => {
  if (!size) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let index = 0;
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024;
    index++;
  }
  return `${size.toFixed(2)} ${units[index]}`;
};

const formatChangelog = (changelog: string) => {
  if (!changelog) return '';
  
  // 简单的 Markdown 转换
  return changelog
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^\* (.*$)/gim, '<li>$1</li>')
    .replace(/^- (.*$)/gim, '<li>$1</li>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
};
</script>

<style scoped>
.version-manager {
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  overflow: hidden;
}

.version-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: var(--el-bg-color-overlay);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.version-list {
  max-height: 600px;
  overflow-y: auto;
}

.version-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color);
  transition: all 0.3s ease;
}

.version-item:hover {
  background: var(--el-bg-color-overlay);
}

.version-item.active {
  background: #e6f7ff;
  border-left: 4px solid #409eff;
}

.version-info {
  flex: 1;
  margin-right: 16px;
}

.version-header-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.version-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.version-badges {
  display: flex;
  gap: 8px;
}

.version-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  align-items: center;
}

.detail-row .label {
  font-size: 12px;
  color: #606266;
  margin-right: 8px;
  min-width: 60px;
}

.detail-row .value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.version-changelog {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.version-changelog h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.changelog-content {
  font-size: 12px;
  color: #606266;
  line-height: 1.5;
  max-height: 100px;
  overflow-y: auto;
}

.version-actions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.no-versions {
  padding: 40px;
  text-align: center;
}

.version-detail {
  max-height: 500px;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.description-content {
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

:deep(.changelog-content) {
  padding: 12px;
  background: var(--el-bg-color-overlay);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}

:deep(.changelog-content h1),
:deep(.changelog-content h2),
:deep(.changelog-content h3) {
  margin: 8px 0;
  color: var(--el-text-color-primary);
}

:deep(.changelog-content li) {
  margin: 4px 0;
  list-style: disc;
  margin-left: 20px;
}

:deep(.changelog-content code) {
  background: #e4e7ed;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

@media (max-width: 768px) {
  .version-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .version-actions {
    align-self: stretch;
    justify-content: center;
  }
  
  .version-details {
    grid-template-columns: 1fr;
  }
  
  .header-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>