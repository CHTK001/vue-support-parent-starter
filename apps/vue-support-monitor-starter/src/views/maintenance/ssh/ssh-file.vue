<template>
  <!-- 布局 -->
  <a-layout class="ssh-file-layout">
    <!-- 目录树 -->
    <a-layout-sider theme="light" class="sider" width="25%">
      <a-row class="dir-container">
        <a-space>
          <a-button size="small" type="primary" @click="loadData()">
            <template #icon><ReloadOutlined /></template>
            {{ $t('i18n_694fc5efa9') }}
          </a-button>
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item
                  v-for="item in sortMethodList"
                  :key="item.key"
                  @click="
                    () => {
                      changeSort(item.key, sortMethod.asc)
                    }
                  "
                  >{{ item.name }}</a-menu-item
                >
              </a-menu>
            </template>

            <a-button
              size="small"
              type="primary"
              @click="
                () => {
                  changeSort(sortMethod.key, !sortMethod.asc)
                }
              "
            >
              {{
                sortMethodList.find((item) => {
                  return item.key === sortMethod.key
                }) &&
                sortMethodList.find((item) => {
                  return item.key === sortMethod.key
                }).name
              }}{{ $t('i18n_c360e994db') }}
              <SortAscendingOutlined v-if="sortMethod.asc" />
              <SortDescendingOutlined v-else />
            </a-button>
          </a-dropdown>
        </a-space>
      </a-row>
      <a-empty v-if="treeList.length === 0" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
      <a-spin v-else :tip="$t('i18n_f013ea9dcb')" :spinning="loading">
        <div class="tree-container">
          <a-directory-tree
            v-model:selectedKeys="selectedKeys"
            v-model:expandedKeys="expandedKeys"
            :tree-data="treeList"
            :field-names="replaceFields"
            @select="onSelect"
            @expand="
              (expandedKeys, { expanded, node }) => {
                if (expanded) {
                  onSelect(expandedKeys, { node })
                }
              }
            "
          >
          </a-directory-tree>
        </div>
      </a-spin>
    </a-layout-sider>
    <!-- 表格 -->
    <a-layout-content class="file-content">
      <!-- 面包屑导航 -->
      <div v-if="nowPath" class="path-breadcrumb">
        <div class="path-item">
          <FolderOutlined style="margin-right: 6px;" />
          <span class="path-link" @click="navigateToRoot">Root</span>
        </div>
        <template v-if="pathSegments.length > 0">
          <div 
            v-for="(segment, index) in pathSegments" 
            :key="index" 
            class="path-item"
            :class="{ 'current': index === pathSegments.length - 1 }"
          >
            <span 
              class="path-link" 
              v-if="index < pathSegments.length - 1"
              @click="navigateToPath(index)"
            >{{ segment }}</span>
            <span v-else>{{ segment }}</span>
          </div>
        </template>
      </div>

      <!-- 操作按钮组 -->
      <div class="file-actions-toolbar">
        <a-space wrap>
          <a-dropdown :disabled="!tempNode.nextPath">
            <a-button size="small" type="primary" @click="(e) => e.preventDefault()">
              <template #icon><UploadOutlined /></template>
              {{ $t('i18n_01198a1673') }}
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="handleUpload">
                  <a-space><FileAddOutlined />{{ $t('i18n_a6fc9e3ae6') }}</a-space>
                </a-menu-item>
                <a-menu-item @click="handleUploadZip">
                  <a-space><FileZipOutlined />{{ $t('i18n_66b71b06c6') }}</a-space>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button
            size="small"
            :disabled="!tempNode.nextPath"
            type="primary"
            @click="uploadShardingFileVisible = true"
          >
            <template #icon><CloudUploadOutlined /></template>
            {{ $t('i18n_dda8b4c10f') }}
          </a-button>
          <a-dropdown :disabled="!tempNode.nextPath">
            <a-button size="small" type="primary" @click="(e) => e.preventDefault()">
              <template #icon><PlusOutlined /></template>
              {{ $t('i18n_26bb841878') }}
            </a-button>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="handleAddFolder">
                  <a-space>
                    <FolderAddOutlined />
                    <span>{{ $t('i18n_547ee197e5') }}</span>
                  </a-space>
                </a-menu-item>
                <a-menu-item @click="handleAddFile">
                  <a-space>
                    <FileAddOutlined />
                    <span>{{ $t('i18n_497ddf508a') }}</span>
                  </a-space>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button size="small" :disabled="!tempNode.nextPath" type="primary" @click="loadFileList()">
            <template #icon><ReloadOutlined /></template>
            {{ $t('i18n_694fc5efa9') }}
          </a-button>
          <a-button size="small" :disabled="!tempNode.nextPath" type="primary" danger @click="handleDeletePath()">
            <template #icon><DeleteOutlined /></template>
            {{ $t('i18n_2f4aaddde3') }}
          </a-button>
          <a-tooltip :title="listShowDir ? $t('i18n_4d775d4cd7') : $t('i18n_dce5379cb9')">
            <a-button size="small" :disabled="!tempNode.nextPath" @click="changeListShowDir">
              <template #icon>
                <EyeOutlined v-if="listShowDir" />
                <EyeInvisibleOutlined v-else />
              </template>
              {{ $t('i18n_4cbc136874') }}
            </a-button>
          </a-tooltip>
        </a-space>
      </div>

      <!-- 文件表格 -->
      <a-table
        size="middle"
        :data-source="sortFileList"
        :loading="loading"
        :columns="columns"
        :pagination="false"
        bordered
        :scroll="{
          x: 'max-content'
        }"
      >
        <template #bodyCell="{ column, text, record }">
          <template v-if="column.dataIndex === 'name'">
            <a-tooltip placement="topLeft">
              <template #title>
                <div>{{ $t('i18n_551e46c0ea') }}{{ text }}</div>
                <div>{{ $t('i18n_964d939a96') }}{{ record.longname }}</div>
              </template>
              <a-dropdown :trigger="['contextmenu']">
                <div class="file-name-cell">
                  <span class="file-icon" :class="getFileIconClass(record)">
                    <FolderOutlined v-if="record.dir" />
                    <FileTextOutlined v-else-if="record.textFileEdit" />
                    <FileImageOutlined v-else-if="isImageFile(record.name)" />
                    <FileZipOutlined v-else-if="isArchiveFile(record.name)" />
                    <FileOutlined v-else />
                  </span>
                  <span>{{ text }}</span>
                </div>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="2">
                      <a-button type="link" @click="handleRenameFile(record)">
                        <HighlightOutlined /> {{ $t('i18n_c8ce4b36cb') }}
                      </a-button>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'dir'">
            <a-tag :color="getFileTypeColor(record)">
              {{record.link ? $t('i18n_bfe68d5844') : text ? $t('i18n_767fa455bb') : $t('i18n_2a0c4740f1')}}
            </a-tag>
          </template>
          <template v-else-if="column.dataIndex === 'size'">
            <a-tooltip placement="topLeft" :title="renderSize(text)">
              <span>{{ renderSize(text) }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.tooltip">
            <a-tooltip placement="topLeft" :title="text">
              <span>{{ text }}</span>
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'operation'">
            <div class="file-actions">
              <a-tooltip :title="$t('i18n_af0df2e295')">
                <a-button 
                  class="action-btn" 
                  size="small" 
                  type="primary" 
                  :disabled="!record.textFileEdit" 
                  @click="handleEdit(record)"
                >
                  <template #icon><EditOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="$t('i18n_5cc7e8e30a')">
                <a-button 
                  class="action-btn" 
                  size="small" 
                  type="primary" 
                  @click="handleFilePermission(record)"
                >
                  <template #icon><LockOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="$t('i18n_f26ef91424')">
                <a-button 
                  class="action-btn" 
                  size="small" 
                  type="primary" 
                  :disabled="record.dir" 
                  @click="handleDownload(record)"
                >
                  <template #icon><DownloadOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip :title="$t('i18n_2f4aaddde3')">
                <a-button 
                  class="action-btn" 
                  size="small" 
                  type="primary" 
                  danger 
                  @click="handleDelete(record)"
                >
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </a-tooltip>
            </div>
          </template>
        </template>
      </a-table>

      <!-- 上传文件 -->
      <CustomModal
        v-if="uploadFileVisible"
        v-model:open="uploadFileVisible"
        destroy-on-close
        width="400px"
        :title="$t('i18n_a6fc9e3ae6')"
        :confirm-loading="confirmLoading"
        :footer="null"
        :mask-closable="true"
        @cancel="closeUploadFile"
      >
        <a-space direction="vertical" style="width: 100%">
          <a-upload
            :file-list="uploadFileList"
            :before-upload="beforeUpload"
            :accept="`${uploadFileZip ? ZIP_ACCEPT : ''}`"
            :multiple="!uploadFileZip"
            @remove="handleRemove"
            list-type="picture"
            class="upload-list-inline"
          >
            <a-button>
              <template #icon><UploadOutlined /></template>
              {{ $t('i18n_fd7e0c997d') }}
              {{ uploadFileZip ? $t('i18n_c806d0fa38') : '' }}
            </a-button>
          </a-upload>
          <a-divider />
          <a-button
            block
            type="primary"
            :disabled="uploadFileList.length === 0"
            :loading="confirmLoading"
            @click="startUpload"
          >
            {{ $t('i18n_020f1ecd62') }}
          </a-button>
        </a-space>
      </CustomModal>

      <!-- 分片上传 -->
      <CustomModal
        v-if="uploadShardingFileVisible"
        v-model:open="uploadShardingFileVisible"
        destroy-on-close
        :confirm-loading="confirmLoading"
        :closable="!confirmLoading"
        :keyboard="false"
        width="500px"
        :title="$t('i18n_d65551b090')"
        :footer="null"
        :mask-closable="false"
      >
        <a-space direction="vertical" size="large" style="width: 100%">
          <a-alert :message="$t('i18n_776bf504a4')" type="warning" show-icon>
            <template #description>
              <ul class="upload-tips">
                <li>
                  {{ $t('i18n_383952103d') }}
                </li>
                <li>{{ $t('i18n_d85279c536') }}</li>
              </ul>
            </template>
          </a-alert>
          
          <div class="upload-container">
            <a-upload
              :file-list="uploadFileList"
              :before-upload="
                (file) => {
                  uploadFileList = [file]
                  return false
                }
              "
              multiple
              :disabled="!!percentage"
              @remove="
                (file) => {
                  const index = uploadFileList.indexOf(file)
                  uploadFileList.splice(index, 1)
                  return true
                }
              "
              list-type="picture"
              class="upload-list-inline"
            >
              <div class="upload-drag-area">
                <p class="upload-drag-icon">
                  <template v-if="percentage">
                    <LoadingOutlined v-if="uploadFileList?.length" />
                    <CloudUploadOutlined v-else />
                  </template>
                  <CloudUploadOutlined v-else />
                </p>
                <p class="upload-text">{{ $t('i18n_fd7e0c997d') }}</p>
                <p class="upload-hint">支持单个或批量上传</p>
              </div>
            </a-upload>
          </div>

          <a-row v-if="percentage" class="progress-container">
            <a-col :span="24">
              <a-progress :percent="percentage" :status="percentage >= 100 ? 'success' : 'active'">
                <template #format="percent">
                  {{ percent }}%<template v-if="percentageInfo.total">
                    ({{ renderSize(percentageInfo.total) }})
                  </template>
                  <template v-if="percentageInfo.duration">
                    <br />{{ $t('i18n_833249fb92') }}: {{ formatDuration(percentageInfo.duration) }}
                  </template>
                </template>
              </a-progress>
            </a-col>
          </a-row>

          <a-button 
            type="primary" 
            block
            :disabled="fileUploadDisabled" 
            :loading="confirmLoading"
            @click="startUploadSharding"
          >
            <template #icon><UploadOutlined /></template>
            {{ $t('i18n_020f1ecd62') }}
          </a-button>
        </a-space>
      </CustomModal>

      <!--  新增文件 目录    -->
      <CustomModal
        v-if="addFileFolderVisible"
        v-model:open="addFileFolderVisible"
        width="400px"
        :title="temp.addFileOrFolderType === 1 ? $t('i18n_2d9e932510') : $t('i18n_e48a715738')"
        :footer="null"
        :mask-closable="true"
      >
        <a-space direction="vertical" style="width: 100%">
          <div class="current-path" v-if="nowPath">
            <FolderOpenOutlined class="path-icon" />
            <span class="path-text">{{ nowPath }}</span>
          </div>
          
          <a-input 
            v-model:value="temp.fileFolderName" 
            :placeholder="$t('i18n_55939c108f')"
            :prefix="temp.addFileOrFolderType === 1 ? h(FolderOutlined) : h(FileOutlined)"
            :maxLength="255"
            showCount
            allowClear
          />
          
          <a-alert v-if="temp.addFileOrFolderType === 1" :message="$t('i18n_fe1b192913')" type="info" show-icon />
          
          <a-button
            block
            type="primary"
            :disabled="!temp.fileFolderName || temp.fileFolderName.length === 0"
            @click="startAddFileFolder"
          >
            {{ $t('i18n_e83a256e4f') }}
          </a-button>
        </a-space>
      </CustomModal>

      <!-- 编辑文件 -->
      <CustomModal
        v-if="editFileVisible"
        v-model:open="editFileVisible"
        destroy-on-close
        :confirm-loading="confirmLoading"
        width="80vw"
        :title="$t('i18n_47ff744ef6')"
        :cancel-text="$t('i18n_b15d91274e')"
        :mask-closable="true"
        @ok="updateFileData"
      >
        <div class="editor-header">
          <div class="file-path">
            <FileTextOutlined class="file-icon" />
            <span class="file-path-text">
              {{((temp.allowPathParent || '/ ') + '/' + (temp.nextPath || '/') + '/' + (temp.name || '/')).replace(
                new RegExp('//+', 'gm'),
                '/'
              )}}
            </span>
          </div>
          
          <div class="editor-actions">
            <a-space>
              <a-tooltip title="自动格式化">
                <a-button size="small" @click="formatCode">
                  <template #icon><AlignLeftOutlined /></template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="查找替换">
                <a-button size="small">
                  <template #icon><SearchOutlined /></template>
                </a-button>
              </a-tooltip>
            </a-space>
          </div>
        </div>
        
        <code-editor 
          v-model:content="temp.fileContent" 
          height="60vh" 
          show-tool 
          :file-suffix="temp.name"
        >
          <template #tool_before>
            <a-tag color="blue">
              {{
                ((temp.allowPathParent || '/ ') + '/' + (temp.nextPath || '/') + '/' + (temp.name || '/')).replace(
                  new RegExp('//+', 'gm'),
                  '/'
                )
              }}
            </a-tag>
          </template>
        </code-editor>
      </CustomModal>

      <!-- 从命名文件/文件夹 -->
      <CustomModal
        v-if="renameFileFolderVisible"
        v-model:open="renameFileFolderVisible"
        destroy-on-close
        width="400px"
        :title="`${$t('i18n_c8ce4b36cb')}`"
        :footer="null"
        :mask-closable="true"
      >
        <a-space direction="vertical" style="width: 100%">
          <div class="rename-file-info">
            <div class="file-icon-container">
              <FolderOutlined v-if="temp.dir" class="big-icon folder" />
              <FileOutlined v-else class="big-icon file" />
            </div>
            <div class="file-details">
              <div class="original-name">{{ temp.oldFileFolderName }}</div>
              <div class="file-path">{{ nowPath }}</div>
            </div>
          </div>
          
          <a-divider />
          
          <a-input 
            v-model:value="temp.fileFolderName" 
            :placeholder="$t('i18n_f139c5cf32')"
            allowClear
            :maxLength="255"
            showCount
          />

          <a-button
            block
            type="primary"
            :loading="confirmLoading"
            :disabled="temp.fileFolderName.length === 0 || temp.fileFolderName === temp.oldFileFolderName"
            @click="renameFileFolder"
          >
            {{ $t('i18n_e83a256e4f') }}
          </a-button>
        </a-space>
      </CustomModal>

      <!-- 修改文件权限 -->
      <CustomModal
        v-if="editFilePermissionVisible"
        v-model:open="editFilePermissionVisible"
        destroy-on-close
        width="480px"
        :title="`${$t('i18n_5cc7e8e30a')}`"
        :footer="null"
        :mask-closable="true"
      >
        <div class="permission-header">
          <FileOutlined v-if="!temp.dir" class="permission-file-icon" />
          <FolderOutlined v-else class="permission-file-icon" />
          <span class="permission-file-name">{{ temp.name }}</span>
        </div>
        
        <div class="permission-grid">
          <div class="permission-row permission-header-row">
            <div class="permission-cell header"></div>
            <div class="permission-cell header">{{ $t('i18n_8306971039') }}</div>
            <div class="permission-cell header">{{ $t('i18n_e72a0ba45a') }}</div>
            <div class="permission-cell header">{{ $t('i18n_0d98c74797') }}</div>
          </div>
          
          <div class="permission-row">
            <div class="permission-cell">
              <span class="permission-type">{{ $t('i18n_75769d1ac8') }}</span>
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.owner.read" />
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.group.read" />
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.others.read" />
            </div>
          </div>
          
          <div class="permission-row">
            <div class="permission-cell">
              <span class="permission-type">{{ $t('i18n_4d7dc6c5f8') }}</span>
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.owner.write" />
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.group.write" />
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.others.write" />
            </div>
          </div>
          
          <div class="permission-row">
            <div class="permission-cell">
              <span class="permission-type">{{ $t('i18n_1a6aa24e76') }}</span>
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.owner.execute" />
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.group.execute" />
            </div>
            <div class="permission-cell">
              <a-checkbox v-model:checked="permissions.others.execute" />
            </div>
          </div>
        </div>
        
        <div class="permission-summary">
          <div class="permission-value">
            <span class="permission-value-label">{{ $t('i18n_ba6e91fa9e') }}:</span>
            <a-tag color="blue">{{ calcFilePermissionValue(permissions) }}</a-tag>
          </div>
          <div class="permission-command">
            <code>chmod {{ calcFilePermissionValue(permissions) }} {{ temp.name }}</code>
          </div>
        </div>
        
        <div class="permission-actions">
          <a-button type="primary" @click="updateFilePermissions">
            <template #icon><CheckOutlined /></template>
            {{ $t('i18n_49e56c7b90') }}
          </a-button>
        </div>
      </CustomModal>
    </a-layout-content>
  </a-layout>
</template>
<script>
import {
  deleteFile,
  downloadFile,
  getFileList,
  getRootFileList,
  newFileFolder,
  readFile,
  renameFileFolder,
  updateFileData,
  uploadFile,
  parsePermissions,
  calcFilePermissionValue,
  changeFilePermission,
  uploadShardingFile
} from '@/api/ssh-file'

import codeEditor from '@/components/codeEditor/index.vue'
import { ZIP_ACCEPT, renderSize, parseTime, concurrentExecution, formatDuration } from '@/utils/const'
import { Empty } from 'ant-design-vue'
import { uploadPieces } from '@/utils/upload-pieces'
import { 
  ReloadOutlined, 
  FolderOutlined, 
  FileOutlined, 
  FileTextOutlined, 
  FileImageOutlined, 
  FileZipOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CloudUploadOutlined,
  FolderOpenOutlined,
  CheckOutlined,
  LoadingOutlined,
  SearchOutlined,
  AlignLeftOutlined
} from '@ant-design/icons-vue'
import { h } from 'vue'

export default {
  components: {
    codeEditor,
    ReloadOutlined,
    FolderOutlined,
    FileOutlined,
    FileTextOutlined,
    FileImageOutlined,
    FileZipOutlined,
    UploadOutlined,
    DownloadOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    LockOutlined,
    EyeOutlined,
    EyeInvisibleOutlined,
    CloudUploadOutlined,
    FolderOpenOutlined,
    CheckOutlined,
    LoadingOutlined,
    SearchOutlined,
    AlignLeftOutlined
  },
  inject: ['globalLoading'],
  props: {
    sshId: {
      type: String,
      default: ''
    },
    machineSshId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      Empty,
      loading: false,
      treeList: [],
      fileList: [],
      uploadFileList: [],
      tempNode: {},
      temp: {},
      uploadFileVisible: false,
      uploadFileZip: false,
      ZIP_ACCEPT: ZIP_ACCEPT,
      renameFileFolderVisible: false,
      listShowDir: false,
      tableHeight: '80vh',
      replaceFields: {
        children: 'children',
        title: 'name',
        key: 'key'
      },
      columns: [
        {
          title: this.$t('i18n_d2e2560089'),
          dataIndex: 'name',
          width: 250,
          ellipsis: true,
          sorter: (a, b) => (a.name || '').localeCompare(b.name || '')
        },
        {
          title: this.$t('i18n_28b988ce6a'),
          dataIndex: 'dir',
          width: '100px',
          ellipsis: true
        },
        {
          title: this.$t('i18n_396b7d3f91'),
          dataIndex: 'size',
          width: 120,
          ellipsis: true,
          sorter: (a, b) => Number(a.size) - new Number(b.size)
        },
        {
          title: this.$t('i18n_ba6e91fa9e'),
          dataIndex: 'permissions',
          width: 120,
          ellipsis: true,
          tooltip: true
        },
        {
          title: this.$t('i18n_1303e638b5'),
          dataIndex: 'modifyTime',
          width: '170px',
          ellipsis: true,
          customRender: ({ text }) => parseTime(text),
          sorter: (a, b) => Number(a.modifyTime) - new Number(b.modifyTime)
        },
        {
          title: this.$t('i18n_2b6bc0f293'),
          dataIndex: 'operation',
          align: 'center',
          fixed: 'right',
          width: '180px'
        }
      ],

      editFileVisible: false,
      addFileFolderVisible: false,
      editFilePermissionVisible: false,
      permissions: {
        owner: { read: false, write: false, execute: false },
        group: { read: false, write: false, execute: false },
        others: { read: false, write: false, execute: false }
      },
      sortMethodList: [
        {
          name: this.$t('i18n_29139c2a1a'),
          key: 'name'
        },
        {
          name: this.$t('i18n_1303e638b5'),
          key: 'modifyTime'
        }
      ],

      sortMethod: {
        key: 'name',
        asc: true
      },
      confirmLoading: false,
      selectedKeys: [],
      expandedKeys: [],
      uploadShardingFileVisible: false,
      percentage: 0,
      percentageInfo: {}
    }
  },
  computed: {
    fileUploadDisabled() {
      return this.uploadFileList.length === 0 || this.confirmLoading
    },
    nowPath() {
      if (!this.tempNode.allowPathParent) {
        return ''
      }
      return ((this.tempNode.allowPathParent || '') + '/' + (this.tempNode.nextPath || '')).replace(
        new RegExp('//+', 'gm'),
        '/'
      )
    },
    pathSegments() {
      if (!this.nowPath) return [];
      return this.nowPath.split('/').filter(segment => segment);
    },
    baseUrl() {
      if (this.sshId) {
        return '/node/ssh/'
      }
      return '/system/assets/ssh-file/'
    },
    reqDataId() {
      return this.sshId || this.machineSshId
    },
    sortFileList() {
      return this.fileList.slice(0).sort((a, b) => {
        // 首先按照文件夹/文件类型排序
        if (a.dir && !b.dir) return -1;
        if (!a.dir && b.dir) return 1;
        
        // 然后按照选定的排序方法排序
        const aV = a[this.sortMethod.key] || '';
        const bV = b[this.sortMethod.key] || '';
        
        if (this.sortMethod.key === 'name') {
          return this.sortMethod.asc ? aV.localeCompare(bV) : bV.localeCompare(aV);
        } else {
          // 数值类型排序
          return this.sortMethod.asc ? Number(aV) - Number(bV) : Number(bV) - Number(aV);
        }
      })
    }
  },
  mounted() {
    this.listShowDir = Boolean(localStorage.getItem('ssh-list-show-dir'))
    try {
      this.sortMethod = JSON.parse(localStorage.getItem('ssh-list-sort') || JSON.stringify(this.sortMethod))
    } catch (e) {
      console.error(e)
    }
    this.loadData()
    
    // 添加键盘快捷键
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeUnmount() {
    // 移除键盘快捷键
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    calcFilePermissionValue,
    formatDuration,
    changeSort(key, asc) {
      this.sortMethod = { key: key, asc: asc }
      localStorage.setItem('ssh-list-sort', JSON.stringify(this.sortMethod))
      this.loadData()
    },
    renderSize,
    
    // 处理键盘快捷键
    handleKeyDown(e) {
      // Ctrl+R: 刷新文件列表
      if (e.ctrlKey && e.key === 'r' && this.tempNode.nextPath) {
        e.preventDefault();
        this.loadFileList();
      }
      
      // Ctrl+U: 打开上传对话框
      if (e.ctrlKey && e.key === 'u' && this.tempNode.nextPath) {
        e.preventDefault();
        this.handleUpload();
      }
      
      // Ctrl+N: 新建文件夹
      if (e.ctrlKey && e.key === 'n' && this.tempNode.nextPath) {
        e.preventDefault();
        this.handleAddFolder();
      }
      
      // Ctrl+F: 新建文件
      if (e.ctrlKey && e.key === 'f' && this.tempNode.nextPath) {
        e.preventDefault();
        this.handleAddFile();
      }
    },
    
    // 格式化代码
    formatCode() {
      // 这里可以实现代码格式化功能
      // 如果没有具体实现，可以显示一个通知
      $notification.info({
        message: '代码格式化',
        description: '代码格式化功能需要根据具体文件类型实现'
      });
    },
    
    // 获取文件图标类型
    getFileIconClass(record) {
      if (record.dir) return 'folder';
      if (record.textFileEdit) return 'code';
      if (this.isImageFile(record.name)) return 'image';
      if (this.isArchiveFile(record.name)) return 'archive';
      return 'file';
    },
    
    // 判断是否为图片文件
    isImageFile(filename) {
      if (!filename) return false;
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    },
    
    // 判断是否为压缩文件
    isArchiveFile(filename) {
      if (!filename) return false;
      const archiveExtensions = ['.zip', '.rar', '.tar', '.gz', '.7z', '.bz2', '.xz'];
      return archiveExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    },
    
    // 获取文件类型标签颜色
    getFileTypeColor(record) {
      if (record.link) return 'purple';
      if (record.dir) return 'blue';
      if (this.isImageFile(record.name)) return 'green';
      if (this.isArchiveFile(record.name)) return 'orange';
      if (record.textFileEdit) return 'geekblue';
      return 'default';
    },
    
    // 导航到根目录
    navigateToRoot() {
      this.selectedKeys = [];
      this.tempNode = {};
      this.loadData();
    },
    
    // 导航到指定路径段
    navigateToPath(index) {
      // 实现导航到特定路径段的逻辑
      const targetPath = this.pathSegments.slice(0, index + 1).join('/');
      console.log("Navigate to path segment:", targetPath);
      
      // 这里需要根据您的应用程序结构实现具体导航逻辑
      // 以下是示例实现，可能需要根据实际情况调整
      if (this.treeList.length > 0 && this.treeList[0]) {
        // 找到匹配的树节点
        let node = this.treeList[0];
        this.selectedKeys = [node.key];
        this.tempNode = node;
        this.loadTreeNode();
      }
    },

    // 加载数据
    loadData() {
      this.loading = true
      this.treeList = []
      this.fileList = []
      this.selectedKeys = []
      this.expandedKeys = []
      this.tempNode = {}
      getRootFileList(this.baseUrl, this.reqDataId).then((res) => {
        if (res.code === 200) {
          this.treeList = res.data
            .map((element, index) => {
              return {
                key: element.id,
                name: element.allowPathParent,
                allowPathParent: element.allowPathParent,
                nextPath: '/',
                isLeaf: false,
                // 配置的授权目录可能不存在
                disabled: !!element.error,
                modifyTime: element.modifyTime,
                activeKey: [index]
              }
            })
            .sort((a, b) => {
              const aV = a[this.sortMethod.key] || ''
              const bV = b[this.sortMethod.key] || ''
              return this.sortMethod.asc ? bV.localeCompare(aV) : aV.localeCompare(bV)
            })
            
          // 添加动画效果
          setTimeout(() => {
            this.loading = false
          }, 300)
        } else {
          this.loading = false
        }
      }).catch(() => {
        this.loading = false
      })
    },
    /**
     * 根据key获取树节点
     * @param keys
     * @returns {*}
     */
    getTreeNode(keys) {
      let node = this.treeList.find((node) => node.activeKey[0] == keys.slice(0, 1)[0])
      const nodeKeys = keys.slice(1)
      for (let [index, key] of nodeKeys.entries()) {
        if (key >= 0 && key < node.children.length) {
          node = node.children.find((node) => node.activeKey.slice(index + 1, index + 2) == key)
        } else {
          throw new Error('Invalid key: ' + key)
        }
      }
      return node
    },
    /**
     * 更新树节点的方法抽离封装
     * @param keys
     * @param value
     */
    updateTreeChildren(keys, value) {
      const node = this.getTreeNode(keys)
      node.children = value
    },
    /**
     * 文件列表转树结构
     * @param data
     */
    fileList2TreeData(data) {
      const node = this.tempNode
      const children = data
        .filter((element) => element.dir)
        .map((element) => ({
          key: element.id,
          name: element.name,
          allowPathParent: node.allowPathParent,
          nextPath: (element.nextPath + '/' + element.name).replace(new RegExp('//+', 'gm'), '/'),
          isLeaf: !element.dir,
          // 可能有错误
          disabled: !!element.error,
          modifyTime: element.modifyTime
        }))
        .sort((a, b) => {
          const aV = a[this.sortMethod.key] || ''
          const bV = b[this.sortMethod.key] || ''
          return this.sortMethod.asc ? bV.localeCompare(aV) : aV.localeCompare(bV)
        })
        .map((element, index) => ({ ...element, activeKey: node.activeKey.concat(index) }))
      this.updateTreeChildren(node.activeKey, children)
    },
    /**
     * 加载文件列表
     */
    loadTreeNode() {
      const { allowPathParent, nextPath } = this.tempNode
      // 请求参数
      const params = {
        id: this.reqDataId,
        allowPathParent: allowPathParent,
        nextPath: nextPath
      }
      this.fileList = []
      this.loading = true
      // 加载文件
      getFileList(this.baseUrl, params).then((res) => {
        if (res.code === 200) {
          // let children = []
          // 区分目录和文件
          res.data.forEach((element) => {
            if (element.dir) {
              if (this.listShowDir) {
                this.fileList.push({
                  // path: node.dataRef.path,
                  ...element
                })
              }
            } else {
              // 设置文件表格
              this.fileList.push({
                // path: node.dataRef.path,
                ...element
              })
            }
          })
          //  更新tree 方法抽离封装
          this.fileList2TreeData(res.data)
        }
        this.loading = false
      })
    },
    // 选中目录
    onSelect(selectedKeys, { node }) {
      if (node.dataRef.disabled) {
        return
      }
      // console.log(node.dataRef, this.tempNode.key);
      if (node.dataRef.key === this.tempNode.key) {
        return
      }
      this.tempNode = node.dataRef
      this.loadTreeNode()
    },
    changeListShowDir() {
      this.loadFileList()
      localStorage.setItem('ssh-list-show-dir', this.listShowDir)
    },
    // 加载文件列表
    loadFileList() {
      if (Object.keys(this.tempNode).length === 0) {
        $notification.warn({
          message: this.$t('i18n_bcaf69a038')
        })
        return false
      }
      // 请求参数
      const params = {
        id: this.reqDataId,
        allowPathParent: this.tempNode.allowPathParent,
        nextPath: this.tempNode.nextPath
      }
      // this.fileList = [];
      this.loading = true
      // 加载文件
      getFileList(this.baseUrl, params).then((res) => {
        if (res.code === 200) {
          // 区分目录和文件
          this.fileList = res.data
            .filter((element) => {
              if (this.listShowDir) {
                return true
              }
              return !element.dir
            })
            .map((element) => {
              // 设置文件表格
              return {
                // path: this.tempNode.path,
                ...element
              }
            })
          // 更新tree
          this.fileList2TreeData(res.data)
        }
        this.loading = false
      })
    },
    // 上传文件
    handleUpload() {
      if (Object.keys(this.tempNode).length === 0) {
        $notification.error({
          message: this.$t('i18n_bcaf69a038')
        })
        return
      }
      this.uploadFileVisible = true
      this.uploadFileZip = false
    },
    handleUploadZip() {
      this.handleUpload()
      this.uploadFileZip = true
    },
    handleAddFolder() {
      this.addFileFolderVisible = true
      // 目录1 文件2 标识
      // addFileOrFolderType: 1,
      //       fileFolderName: "",
      this.temp = {
        fileFolderName: '',
        addFileOrFolderType: 1,
        allowPathParent: this.tempNode.allowPathParent,
        nextPath: this.tempNode.nextPath
      }
    },
    handleAddFile() {
      this.addFileFolderVisible = true
      // 目录1 文件2 标识
      // addFileOrFolderType: 1,
      //       fileFolderName: "",
      this.temp = {
        fileFolderName: '',
        addFileOrFolderType: 2,
        allowPathParent: this.tempNode.allowPathParent,
        nextPath: this.tempNode.nextPath
      }
    },
    // closeAddFileFolder() {
    //   this.addFileFolderVisible = false;
    //   this.fileFolderName = "";
    // },
    // 确认新增文件  目录
    startAddFileFolder() {
      const params = {
        id: this.reqDataId,
        allowPathParent: this.temp.allowPathParent,
        nextPath: this.temp.nextPath,
        name: this.temp.fileFolderName,
        unFolder: this.temp.addFileOrFolderType !== 1
      }
      newFileFolder(this.baseUrl, params).then((res) => {
        if (res.code === 200) {
          $notification.success({
            message: res.msg
          })
          this.addFileFolderVisible = false
          this.loadFileList()
          // this.closeAddFileFolder();
        }
      })
    },
    handleRemove(file) {
      const index = this.uploadFileList.indexOf(file)
      const newFileList = this.uploadFileList.slice()
      newFileList.splice(index, 1)
      this.uploadFileList = newFileList
      return true
    },
    beforeUpload(file) {
      this.uploadFileList = [...this.uploadFileList, file]
      return false
    },
    closeUploadFile() {
      this.uploadFileList = []
    },
    // 开始上传文件
    startUpload() {
      this.uploadFileList.forEach((file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('id', this.reqDataId)
        formData.append('allowPathParent', this.tempNode.allowPathParent)
        formData.append('unzip', this.uploadFileZip)
        formData.append('nextPath', this.tempNode.nextPath)
        this.confirmLoading = true
        // 上传文件
        uploadFile(this.baseUrl, formData)
          .then((res) => {
            if (res.code === 200) {
              $notification.success({
                message: res.msg
              })
              this.loadFileList()
              this.closeUploadFile()
              this.uploadFileVisible = false
            }
          })
          .finally(() => {
            this.confirmLoading = false
          })
      })
    },
    startUploadSharding() {
      // 设置上传状态
      this.confirmLoading = true
      // 遍历上传文件
      concurrentExecution(
        this.uploadFileList.map((item, index) => {
          // console.log(item);
          return index
        }),
        // 并发数只能是 1
        1,
        (curItem) => {
          const file = this.uploadFileList[curItem]
          this.uploadFileList = this.uploadFileList.map((fileItem, fileIndex) => {
            if (fileIndex === curItem) {
              fileItem.status = 'uploading'
            }
            return fileItem
          })
          this.percentage = 0
          this.percentageInfo = {}
          return new Promise((resolve, reject) => {
            uploadPieces({
              /** ssh 文件上传 目前切片并发控制为1 */
              concurrentNum: 1,
              file,
              resolveFileProcess: (msg) => {
                this.globalLoading({
                  spinning: true,
                  tip: msg
                })
              },
              resolveFileEnd: () => {
                this.globalLoading(false)
              },
              process: (process, end, total, duration) => {
                this.percentage = Math.max(this.percentage, process)
                this.percentageInfo = { end, total, duration }
              },
              success: () => {
                // 合并
                $notification.success({
                  message: this.$t('i18n_a7699ba731')
                })
                this.uploadFileList = this.uploadFileList.map((fileItem, fileIndex) => {
                  if (fileIndex === curItem) {
                    fileItem.status = 'done'
                  }
                  return fileItem
                })

                resolve()
              },
              uploadChunkError: () => {
                this.confirmLoading = false
                this.percentage = 0
                this.percentageInfo = {}
                this.uploadFileList = []
              },
              error: (msg) => {
                this.uploadFileList = this.uploadFileList.map((fileItem, fileIndex) => {
                  if (fileIndex === curItem) {
                    fileItem.status = 'error'
                  }
                  return fileItem
                })
                $notification.error({
                  message: msg
                })
                this.confirmLoading = false
                this.percentage = 0
                this.percentageInfo = {}
                reject()
              },
              uploadCallback: (formData) => {
                return new Promise((resolve, reject) => {
                  formData.append('id', this.reqDataId)
                  formData.append('allowPathParent', this.tempNode.allowPathParent)
                  formData.append('unzip', this.uploadFileZip)
                  formData.append('nextPath', this.tempNode.nextPath)

                  // 上传文件
                  uploadShardingFile(this.baseUrl, formData)
                    .then((res) => {
                      if (res.code === 200) {
                        resolve()
                      } else {
                        reject()
                      }
                    })
                    .catch(() => {
                      reject()
                    })
                })
              }
            })
          })
        }
      )
        .then(() => {
          //this.uploading = this.successSize !== this.uploadFileList.length
          // // 判断是否全部上传完成
          // if (!this.uploading) {
          //   this.uploadFileList = []
          //   setTimeout(() => {
          //     this.loadFileList()
          //     this.uploadFileVisible = false
          //   }, 2000)
          // }
          this.percentage = 0
          this.percentageInfo = {}
          this.uploadFileList = []
          this.loadFileList()
          this.uploadShardingFileVisible = false
        })
        .finally(() => {
          this.confirmLoading = false
          //
        })
    },
    // 编辑
    handleEdit(record) {
      this.temp = Object.assign({}, record)
      const params = {
        id: this.reqDataId,
        allowPathParent: record.allowPathParent,
        nextPath: record.nextPath,
        name: record.name
      }
      readFile(this.baseUrl, params).then((res) => {
        if (res.code === 200) {
          this.temp = { ...this.temp, fileContent: res.data }
          this.editFileVisible = true
        }
      })
      //
    },
    updateFileData() {
      const params = {
        id: this.reqDataId,
        allowPathParent: this.temp.allowPathParent,
        nextPath: this.temp.nextPath,
        name: this.temp.name,
        content: this.temp.fileContent
      }
      this.confirmLoading = true
      updateFileData(this.baseUrl, params)
        .then((res) => {
          if (res.code === 200) {
            $notification.success({
              message: res.msg
            })
            this.editFileVisible = false
          }
        })
        .finally(() => {
          this.confirmLoading = false
        })
    },
    // 修改文件权限
    handleFilePermission(record) {
      this.temp = Object.assign({}, record)
      this.permissions = parsePermissions(this.temp.permissions)
      //const permissionsValue = calcFilePermissionValue(this.permissions);
      //this.permissionTips = `cd ${this.temp.nextPath} && chmod ${permissionsValue} ${this.temp.name}`;
      this.editFilePermissionVisible = true
    },
    // 更新文件权限提示
    renderFilePermissionsTips() {
      //const permissionsValue = calcFilePermissionValue(this.permissions);
      //this.permissionTips = `cd ${this.temp.nextPath} && chmod ${permissionsValue} ${this.temp.name}`;
    }, // 确认修改文件权限
    updateFilePermissions() {
      // 请求参数
      const params = {
        id: this.reqDataId,
        allowPathParent: this.temp.allowPathParent,
        nextPath: this.temp.nextPath,
        fileName: this.temp.name,
        permissionValue: calcFilePermissionValue(this.permissions)
      }
      changeFilePermission(this.baseUrl, params).then((res) => {
        if (res.code === 200) {
          $notification.success({
            message: res.msg
          })
          this.editFilePermissionVisible = false
          this.loadFileList()
        }
      })
    },

    // 下载
    handleDownload(record) {
      // 请求参数
      const params = {
        id: this.reqDataId,
        allowPathParent: record.allowPathParent,
        nextPath: record.nextPath,
        name: record.name
      }
      // 请求接口拿到 blob
      window.open(downloadFile(this.baseUrl, params), '_blank')
    },
    // 删除文件夹
    handleDeletePath() {
      $confirm({
        title: this.$t('i18n_c4535759ee'),
        zIndex: 1009,
        content: this.$t('i18n_8756efb8f4'),
        okText: this.$t('i18n_e83a256e4f'),
        cancelText: this.$t('i18n_625fb26b4b'),
        onOk: async () => {
          return deleteFile(this.baseUrl, {
            id: this.reqDataId,
            allowPathParent: this.tempNode.allowPathParent,
            nextPath: this.tempNode.nextPath
          }).then((res) => {
            if (res.code === 200) {
              $notification.success({
                message: res.msg
              })
              // 刷新树
              const activeKey = this.tempNode.activeKey
              // 获取上一级节点
              const parentNode = this.getTreeNode(activeKey.slice(0, activeKey.length - 1))
              // 设置当前选中
              this.selectedKeys = [parentNode.key]
              // 设置缓存节点
              this.tempNode = parentNode
              // 加载上一级文件列表
              this.loadTreeNode()

              this.fileList = []
              //this.loadFileList();
            }
          })
        }
      })
    },
    // 删除
    handleDelete(record) {
      $confirm({
        title: this.$t('i18n_c4535759ee'),
        zIndex: 1009,
        content: this.$t('i18n_3a6bc88ce0'),
        okText: this.$t('i18n_e83a256e4f'),
        cancelText: this.$t('i18n_625fb26b4b'),
        onOk: () => {
          return deleteFile(this.baseUrl, {
            id: this.reqDataId,
            allowPathParent: record.allowPathParent,
            nextPath: record.nextPath,
            name: record.name
          }).then((res) => {
            if (res.code === 200) {
              $notification.success({
                message: res.msg
              })
              this.loadFileList()
            }
          })
        }
      })
    },
    handleRenameFile(record) {
      this.renameFileFolderVisible = true
      this.temp = {
        fileFolderName: record.name,
        oldFileFolderName: record.name,
        allowPathParent: record.allowPathParent,
        nextPath: record.nextPath
      }
    },
    // 确认修改文件 目录名称
    renameFileFolder() {
      const params = {
        id: this.reqDataId,
        name: this.temp.oldFileFolderName,
        newname: this.temp.fileFolderName,
        allowPathParent: this.temp.allowPathParent,
        nextPath: this.temp.nextPath
      }
      this.confirmLoading = true
      renameFileFolder(this.baseUrl, params)
        .then((res) => {
          if (res.code === 200) {
            $notification.success({
              message: res.msg
            })
            this.renameFileFolderVisible = false
            this.loadFileList()
          }
        })
        .finally(() => {
          this.confirmLoading = false
        })
    },
    formatCode() {
      // 实现自动格式化代码的逻辑
      // 这需要基于您的应用程序结构进行具体实现
      console.log("Formatting code...");
    }
  }
}
</script>
<style lang="less" scoped>
// 现代化样式
:deep(.ant-progress-text) {
  width: auto;
}

.ssh-file-layout {
  padding: 0;
  min-height: calc(100vh - 75px);
  background-color: #f8f9fa;
  display: flex;
  gap: 16px;
  transition: all 0.3s ease;
}

.dir-container {
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .ant-space {
    flex-wrap: wrap;
  }
  
  .ant-btn {
    transition: all 0.25s ease;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

.sider {
  border-radius: 12px;
  background-color: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  margin: 12px 0 12px 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
}

.file-content {
  margin: 12px 12px 12px 0;
  padding: 16px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
}

.title {
  font-weight: 600;
  font-size: larger;
  color: #1677ff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tree-container {
  overflow-x: auto;
  padding: 8px;
  
  :deep(.ant-tree-title) {
    word-break: keep-all;
    white-space: nowrap;
    transition: all 0.2s ease;
  }
  
  :deep(.ant-tree-node-content-wrapper) {
    display: flex;
    align-items: center;
    padding: 8px 10px;
    border-radius: 6px;
    transition: all 0.25s ease;
    
    &:hover {
      background-color: rgba(22, 119, 255, 0.1);
      transform: translateX(2px);
    }
  }
  
  :deep(.ant-tree.ant-tree-directory .ant-tree-treenode .ant-tree-node-content-wrapper.ant-tree-node-selected) {
    background-color: #1677ff;
    border-radius: 6px;
    box-shadow: 0 3px 8px rgba(22, 119, 255, 0.4);
  }
  
  :deep(.ant-tree-switcher) {
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  :deep(.ant-tree-switcher_open) {
    transform: rotate(90deg);
  }
}

// 文件操作工具栏
.file-actions-toolbar {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f8faff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #f0f7ff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .ant-space {
    flex-wrap: wrap;
    gap: 8px !important;
  }
  
  .ant-btn {
    transition: all 0.25s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

// 表格样式优化
:deep(.ant-table) {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .ant-table-thead > tr > th {
    background-color: #f0f5ff;
    font-weight: 600;
    padding: 14px 16px;
  }
  
  .ant-table-tbody > tr {
    transition: all 0.25s ease;
    
    &:hover {
      background-color: #f0f7ff;
      transform: translateY(-1px);
    }
    
    td {
      transition: all 0.2s ease;
      padding: 12px 16px;
    }
  }
}

// 文件名单元格样式
.file-name-cell {
  display: flex;
  align-items: center;
  padding: 4px 0;
  transition: all 0.2s ease;
  
  .file-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 4px;
    margin-right: 10px;
    
    &.folder {
      background-color: rgba(250, 173, 20, 0.1);
      color: #faad14;
    }
    
    &.file {
      background-color: rgba(24, 144, 255, 0.1);
      color: #1890ff;
    }
    
    &.image {
      background-color: rgba(82, 196, 26, 0.1);
      color: #52c41a;
    }
    
    &.code {
      background-color: rgba(114, 46, 209, 0.1);
      color: #722ed1;
    }
    
    &.archive {
      background-color: rgba(250, 140, 22, 0.1);
      color: #fa8c16;
    }
  }
  
  span {
    transition: all 0.2s ease;
  }
  
  &:hover {
    transform: translateX(2px);
    
    span:not(.file-icon) {
      color: #1677ff;
    }
  }
}

// 按钮样式优化
:deep(.ant-btn) {
  border-radius: 6px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
}

// 模态框样式优化
:deep(.ant-modal) {
  .ant-modal-content {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  }
  
  .ant-modal-header {
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    padding: 18px 24px;
    background-color: #f8faff;
  }
  
  .ant-modal-body {
    padding: 24px;
  }
  
  .ant-modal-footer {
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    padding: 14px 24px;
    background-color: #f8faff;
  }
}

// 上传组件样式优化
:deep(.ant-upload-list-item) {
  transition: all 0.3s ease;
  border-radius: 6px;
  padding: 6px 8px;
  
  &:hover {
    background-color: #f0f7ff;
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }
}

.upload-list-inline {
  :deep(.ant-upload-select) {
    margin-bottom: 12px;
  }
}

// 进度条样式优化
:deep(.ant-progress) {
  .ant-progress-bg {
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 2px 6px rgba(24, 144, 255, 0.2);
  }
  
  .ant-progress-text {
    font-weight: 500;
  }
}

// 文件操作动画
.file-operation-enter-active,
.file-operation-leave-active {
  transition: opacity 0.4s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.file-operation-enter-from,
.file-operation-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

// 工具提示优化
:deep(.ant-tooltip) {
  .ant-tooltip-inner {
    border-radius: 6px;
    padding: 10px 14px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
}

// 下拉菜单优化
:deep(.ant-dropdown-menu) {
  border-radius: 8px;
  padding: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  
  .ant-dropdown-menu-item {
    border-radius: 6px;
    padding: 8px 12px;
    transition: all 0.25s ease;
    
    &:hover {
      background-color: #f0f7ff;
      transform: translateX(2px);
    }
  }
}

// 标签样式优化
:deep(.ant-tag) {
  border-radius: 4px;
  padding: 2px 8px;
  font-weight: 500;
  border: none;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition: all 0.25s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
  }
}

// 权限编辑表格优化
.permission-grid {
  margin-top: 16px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  
  .permission-row {
    display: flex;
    padding: 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    transition: background-color 0.25s ease;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:hover {
      background-color: #f0f7ff;
    }
    
    .permission-cell {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.header {
        font-weight: 600;
        color: #1677ff;
      }
    }
  }
  
  .permission-row.permission-header-row {
    background-color: #f0f5ff;
  }
}

// 面包屑导航
.path-breadcrumb {
  margin-bottom: 16px;
  padding: 10px 14px;
  background-color: #f0f7ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
  
  .path-item {
    display: inline-flex;
    align-items: center;
    
    &:not(:last-child)::after {
      content: '/';
      margin: 0 8px;
      color: rgba(0, 0, 0, 0.45);
    }
    
    .path-link {
      color: #1677ff;
      cursor: pointer;
      transition: all 0.25s ease;
      padding: 2px 6px;
      border-radius: 4px;
      
      &:hover {
        color: #4096ff;
        text-decoration: underline;
        background-color: rgba(24, 144, 255, 0.1);
      }
    }
    
    &.current {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.85);
      background-color: rgba(0, 0, 0, 0.03);
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

// 空状态优化
:deep(.ant-empty) {
  padding: 32px 0;
  
  .ant-empty-image {
    height: 80px;
    opacity: 0.8;
    transition: all 0.3s ease;
    
    &:hover {
      opacity: 1;
      transform: scale(1.05);
    }
  }
  
  .ant-empty-description {
    color: rgba(0, 0, 0, 0.45);
    font-size: 15px;
    margin-top: 16px;
  }
}

// 加载状态优化
:deep(.ant-spin) {
  .ant-spin-dot {
    transition: all 0.3s ease;
  }
  
  .ant-spin-text {
    margin-top: 8px;
    font-size: 14px;
    color: #1677ff;
  }
}

// 文件操作按钮组
.file-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
  
  .action-btn {
    border-radius: 6px;
    transition: all 0.25s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
}

// 文件路径显示
.current-path {
  background-color: #f0f7ff;
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  overflow-x: auto;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  
  .path-icon {
    margin-right: 10px;
    color: #1677ff;
  }
  
  .path-text {
    color: rgba(0, 0, 0, 0.65);
    font-family: monospace;
  }
}

// 权限编辑模态框样式
.permission-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  padding: 12px;
  background-color: #f0f7ff;
  border-radius: 6px;
  
  .permission-file-icon {
    margin-right: 12px;
    font-size: 20px;
    color: #1677ff;
    background-color: rgba(24, 144, 255, 0.1);
    padding: 8px;
    border-radius: 50%;
  }
  
  .permission-file-name {
    font-weight: 600;
    color: #1677ff;
    font-size: 16px;
  }
}

// 权限编辑摘要样式
.permission-summary {
  margin-top: 20px;
  padding: 14px;
  background-color: #f0f7ff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  
  .permission-value {
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    
    .permission-value-label {
      font-weight: 600;
      color: #1677ff;
      margin-right: 8px;
    }
  }
  
  .permission-command {
    font-family: monospace;
    color: rgba(0, 0, 0, 0.65);
    background-color: rgba(0, 0, 0, 0.02);
    padding: 8px 12px;
    border-radius: 4px;
    overflow-x: auto;
  }
}

// 权限编辑操作样式
.permission-actions {
  margin-top: 20px;
  text-align: right;
  
  .ant-btn {
    padding: 6px 16px;
    height: auto;
  }
}

// 上传组件样式
.upload-container {
  margin-bottom: 20px;
}

.upload-drag-area {
  text-align: center;
  padding: 36px;
  border: 2px dashed rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  transition: all 0.25s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
    border-color: #1677ff;
  }
}

.upload-drag-icon {
  font-size: 36px;
  color: #1677ff;
  margin-bottom: 4px;
}

.upload-text {
  margin-top: 12px;
  color: rgba(0, 0, 0, 0.65);
  font-size: 16px;
  font-weight: 500;
}

.upload-hint {
  color: rgba(0, 0, 0, 0.45);
  margin-top: 8px;
}

// 上传提示样式
.upload-tips {
  margin: 0;
  padding-left: 20px;
  
  li {
    margin-bottom: 6px;
    line-height: 1.6;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 进度条容器样式
.progress-container {
  margin: 20px 0;
  padding: 16px;
  background-color: #f8faff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

// 文件重命名样式
.rename-file-info {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f0f7ff;
  border-radius: 8px;
  
  .file-icon-container {
    margin-right: 16px;
    
    .big-icon {
      font-size: 28px;
      padding: 10px;
      border-radius: 8px;
      
      &.folder {
        color: #faad14;
        background-color: rgba(250, 173, 20, 0.1);
      }
      
      &.file {
        color: #1677ff;
        background-color: rgba(24, 144, 255, 0.1);
      }
    }
  }
  
  .file-details {
    flex: 1;
    
    .original-name {
      font-weight: 600;
      margin-bottom: 4px;
      font-size: 16px;
    }
    
    .file-path {
      color: rgba(0, 0, 0, 0.45);
      font-size: 13px;
      font-family: monospace;
    }
  }
}

// 编辑器头部样式
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f0f7ff;
  border-radius: 8px;
  
  .file-path {
    display: flex;
    align-items: center;
    
    .file-icon {
      margin-right: 10px;
      color: #1677ff;
    }
    
    .file-path-text {
      font-family: monospace;
      color: rgba(0, 0, 0, 0.65);
      overflow-x: auto;
      white-space: nowrap;
      max-width: 60vw;
    }
  }
  
  .editor-actions {
    .ant-space {
      gap: 8px !important;
    }
  }
}

// 添加响应式样式
@media (max-width: 768px) {
  .ssh-file-layout {
    flex-direction: column;
  }
  
  .sider {
    width: calc(100% - 24px) !important;
    margin: 12px;
  }
  
  .file-content {
    margin: 0 12px 12px;
  }
  
  .file-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  
  .permission-grid {
    .permission-row {
      flex-direction: column;
      
      .permission-cell {
        margin-bottom: 8px;
      }
    }
  }
}

// 添加暗色主题支持
@media (prefers-color-scheme: dark) {
  // 暗色主题样式可以在这里添加
}
</style>
