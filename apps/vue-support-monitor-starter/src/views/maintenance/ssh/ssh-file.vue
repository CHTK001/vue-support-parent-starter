<template>
  <div class="ssh-file-layout">
    <!-- 目录树 -->
    <a-layout-sider theme="light" class="sider" width="25%">
      <div class="dir-container">
        <a-space>
          <a-button type="primary" size="small" @click="loadData()">
            <template #icon><ReloadOutlined /></template>
            {{ $t("i18n_694fc5efa9") }}
          </a-button>
          <a-dropdown>
            <template #overlay>
              <a-menu>
                <a-menu-item v-for="item in sortMethodList" :key="item.key" @click="() => changeSort(item.key, sortMethod.asc)">
                  {{ item.name }}
                </a-menu-item>
              </a-menu>
            </template>
            <a-button type="primary" size="small">
              {{ sortMethodList.find(item => item.key === sortMethod.key)?.name }}
              {{ $t("i18n_c360e994db") }}
              <template #icon>
                <component :is="sortMethod.asc ? 'SortAscendingOutlined' : 'SortDescendingOutlined'" />
              </template>
            </a-button>
          </a-dropdown>
        </a-space>
      </div>

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
                  onSelect(expandedKeys, { node });
                }
              }
            "
          />
        </div>
      </a-spin>
    </a-layout-sider>

    <!-- 文件内容区域 -->
    <a-layout-content class="file-content">
      <!-- <div ref="filter" class="filter"></div> -->
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
        <template #title>
          <a-space>
            <a-dropdown :disabled="!tempNode.nextPath">
              <a-button size="small" type="primary" @click="e => e.preventDefault()">{{ $t("i18n_01198a1673") }}</a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleUpload">
                    <a-space>
                      <FileAddOutlined />
                      {{ $t("i18n_a6fc9e3ae6") }}
                    </a-space>
                  </a-menu-item>
                  <a-menu-item @click="handleUploadZip">
                    <a-space>
                      <FileZipOutlined />
                      {{ $t("i18n_66b71b06c6") }}
                    </a-space>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-button size="small" :disabled="!tempNode.nextPath" type="primary" @click="uploadShardingFileVisible = true">{{ $t("i18n_dda8b4c10f") }}</a-button>
            <a-dropdown :disabled="!tempNode.nextPath">
              <a-button size="small" type="primary" @click="e => e.preventDefault()">{{ $t("i18n_26bb841878") }}</a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="handleAddFolder">
                    <a-space>
                      <FolderAddOutlined />
                      <a-space>{{ $t("i18n_547ee197e5") }}</a-space>
                    </a-space>
                  </a-menu-item>
                  <a-menu-item @click="handleAddFile">
                    <a-space>
                      <FileAddOutlined />
                      <a-space>{{ $t("i18n_497ddf508a") }}</a-space>
                    </a-space>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
            <a-button size="small" :disabled="!tempNode.nextPath" type="primary" @click="loadFileList()">{{ $t("i18n_694fc5efa9") }}</a-button>
            <a-button size="small" :disabled="!tempNode.nextPath" type="primary" danger @click="handleDeletePath()">{{ $t("i18n_2f4aaddde3") }}</a-button>
            <div>
              {{ $t("i18n_4cbc136874") }}
              <a-switch
                v-model:checked="listShowDir"
                :disabled="!tempNode.nextPath"
                :checked-children="$t('i18n_4d775d4cd7')"
                :un-checked-children="$t('i18n_dce5379cb9')"
                @change="changeListShowDir"
              />
            </div>
            <span v-if="nowPath">{{ $t("i18n_4e33dde280") }}{{ nowPath }}</span>
            <!-- <span v-if="this.nowPath">{{ this.tempNode.parentDir }}</span> -->
          </a-space>
        </template>

        <template #bodyCell="{ column, text, record }">
          <template v-if="column.dataIndex === 'name'">
            <a-tooltip placement="topLeft">
              <template #title>
                <div>{{ $t("i18n_551e46c0ea") }}{{ text }}</div>
                <div>{{ $t("i18n_964d939a96") }}{{ record.longname }}</div>
              </template>
              <a-dropdown :trigger="['contextmenu']">
                <div>{{ text }}</div>
                <template #overlay>
                  <a-menu>
                    <a-menu-item key="2">
                      <a-button type="link" @click="handleRenameFile(record)">
                        <HighlightOutlined />
                        {{ $t("i18n_c8ce4b36cb") }}
                      </a-button>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>

              <!-- <span>{{ text }}</span> -->
            </a-tooltip>
          </template>
          <template v-else-if="column.dataIndex === 'dir'">
            <a-tooltip placement="topLeft" :title="`${record.link ? $t('i18n_bfe68d5844') : text ? $t('i18n_767fa455bb') : $t('i18n_2a0c4740f1')}`">
              <span>{{ record.link ? $t("i18n_bfe68d5844") : text ? $t("i18n_767fa455bb") : $t("i18n_2a0c4740f1") }}</span>
            </a-tooltip>
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
            <a-space>
              <a-tooltip :title="$t('i18n_af0df2e295')">
                <a-button size="small" type="primary" :disabled="!record.textFileEdit" @click="handleEdit(record)">{{ $t("i18n_95b351c862") }}</a-button>
              </a-tooltip>
              <a-tooltip :title="$t('i18n_5cc7e8e30a')">
                <a-button size="small" type="primary" @click="handleFilePermission(record)">{{ $t("i18n_ba6e91fa9e") }}</a-button>
              </a-tooltip>
              <a-button size="small" type="primary" :disabled="record.dir" @click="handleDownload(record)">{{ $t("i18n_f26ef91424") }}</a-button>
              <a-button size="small" type="primary" danger @click="handleDelete(record)">{{ $t("i18n_2f4aaddde3") }}</a-button>
            </a-space>
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
        class="upload-file-modal"
        @cancel="closeUploadFile"
      >
        <div class="upload-container">
          <a-upload :file-list="uploadFileList" :before-upload="beforeUpload" :accept="uploadFileZip ? ZIP_ACCEPT : ''" :multiple="!uploadFileZip" @remove="handleRemove">
            <a-button>
              <template #icon><UploadOutlined /></template>
              {{ $t("i18n_fd7e0c997d") }}
              {{ uploadFileZip ? $t("i18n_c806d0fa38") : "" }}
            </a-button>
          </a-upload>

          <div class="upload-action">
            <a-button type="primary" :disabled="uploadFileList.length === 0" :loading="confirmLoading" @click="startUpload">
              <template #icon><CloudUploadOutlined /></template>
              {{ $t("i18n_020f1ecd62") }}
            </a-button>
          </div>
        </div>
      </CustomModal>
      <!-- 分片上传 -->
      <CustomModal
        v-if="uploadShardingFileVisible"
        v-model:open="uploadShardingFileVisible"
        destroyOnClose
        width="500px"
        :title="$t('i18n_d65551b090')"
        :footer="null"
        :closable="!confirmLoading"
        :keyboard="false"
        :maskClosable="false"
        class="sharding-upload-modal"
      >
        <div class="upload-container">
          <a-alert :message="$t('i18n_776bf504a4')" type="warning" show-icon>
            <template #description>
              <ul>
                <li>{{ $t("i18n_383952103d") }}</li>
                <li>{{ $t("i18n_d85279c536") }}</li>
              </ul>
            </template>
          </a-alert>

          <a-upload
            :file-list="uploadFileList"
            :before-upload="
              file => {
                uploadFileList = [file];
                return false;
              }
            "
            :disabled="!!percentage"
            @remove="
              file => {
                const index = uploadFileList.indexOf(file);
                uploadFileList.splice(index, 1);
                return true;
              }
            "
          >
            <a-button v-if="!percentage" type="primary">
              <template #icon><UploadOutlined /></template>
              {{ $t("i18n_fd7e0c997d") }}
            </a-button>
            <template v-else>
              <LoadingOutlined v-if="uploadFileList?.length > 1" />
            </template>
          </a-upload>

          <div v-if="percentage" class="upload-progress">
            <a-progress
              :percent="percentage"
              :format="
                percent => {
                  return `${percent}%${percentageInfo.total ? `(${renderSize(percentageInfo.total)})` : ''}${
                    percentageInfo.duration ? ` ${$t('i18n_833249fb92')}: ${formatDuration(percentageInfo.duration)}` : ''
                  }`;
                }
              "
            />
          </div>

          <div class="action-bar">
            <a-button type="primary" :disabled="fileUploadDisabled" @click="startUploadSharding">
              <template #icon><CloudUploadOutlined /></template>
              {{ $t("i18n_020f1ecd62") }}
            </a-button>
          </div>
        </div>
      </CustomModal>
      <!--  新增文件 目录    -->
      <CustomModal
        v-if="addFileFolderVisible"
        v-model:open="addFileFolderVisible"
        width="300px"
        :title="temp.addFileOrFolderType === 1 ? $t('i18n_2d9e932510') : $t('i18n_e48a715738')"
        :footer="null"
        :mask-closable="true"
      >
        <a-space direction="vertical" style="width: 100%">
          <span v-if="nowPath">{{ $t("i18n_4e33dde280") }}{{ nowPath }}</span>
          <!-- <a-tag v-if="">目录创建成功后需要手动刷新右边树才能显示出来哟</a-tag> -->
          <a-tooltip :title="temp.addFileOrFolderType === 1 ? $t('i18n_fe1b192913') : ''">
            <a-input v-model:value="temp.fileFolderName" :placeholder="$t('i18n_55939c108f')" />
          </a-tooltip>
          <a-row type="flex" justify="center">
            <a-button type="primary" :disabled="!temp.fileFolderName || temp.fileFolderName.length === 0" @click="startAddFileFolder">{{ $t("i18n_e83a256e4f") }}</a-button>
          </a-row>
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
        <code-editor v-model:content="temp.fileContent" height="60vh" show-tool :file-suffix="temp.name">
          <template #tool_before>
            <a-tag>
              {{ ((temp.allowPathParent || "/ ") + "/" + (temp.nextPath || "/") + "/" + (temp.name || "/")).replace(new RegExp("//+", "gm"), "/") }}
              <!-- {{ temp.name }} -->
            </a-tag>
          </template>
        </code-editor>
      </CustomModal>
      <!-- 文件重命名对话框 -->
      <CustomModal
        v-if="renameFileFolderVisible"
        v-model:open="renameFileFolderVisible"
        destroyOnClose
        width="400px"
        :title="$t('i18n_c8ce4b36cb')"
        :footer="null"
        :maskClosable="true"
        class="rename-modal"
      >
        <div class="rename-container">
          <div class="current-path">
            <FileOutlined v-if="!temp.dir" />
            <FolderOutlined v-else />
            <span class="path-text">{{ nowPath }}</span>
          </div>

          <a-input v-model:value="temp.fileFolderName" :placeholder="$t('i18n_f139c5cf32')" class="rename-input" />

          <div class="action-bar">
            <a-button
              v-if="temp.fileFolderName"
              type="primary"
              :loading="confirmLoading"
              :disabled="temp.fileFolderName.length === 0 || temp.fileFolderName === temp.oldFileFolderName"
              @click="renameFileFolder"
            >
              <template #icon><CheckOutlined /></template>
              {{ $t("i18n_e83a256e4f") }}
            </a-button>
          </div>
        </div>
      </CustomModal>

      <!-- 修改文件权限 -->
      <CustomModal
        v-if="editFilePermissionVisible"
        v-model:open="editFilePermissionVisible"
        destroy-on-close
        width="400px"
        :title="$t('i18n_5cc7e8e30a')"
        :footer="null"
        :mask-closable="true"
        class="file-permission-modal"
      >
        <div class="permission-grid">
          <div class="header">
            <span class="title">{{ $t("i18n_ba6e91fa9e") }}</span>
          </div>
          <div class="header">
            <span class="title">{{ $t("i18n_8306971039") }}</span>
          </div>
          <div class="header">
            <span class="title">{{ $t("i18n_e72a0ba45a") }}</span>
          </div>
          <div class="header">
            <span class="title">{{ $t("i18n_0d98c74797") }}</span>
          </div>

          <div class="permission-row">
            <span>{{ $t("i18n_75769d1ac8") }}</span>
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

          <div class="permission-row">
            <span>{{ $t("i18n_4d7dc6c5f8") }}</span>
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

          <div class="permission-row">
            <span>{{ $t("i18n_1a6aa24e76") }}</span>
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

        <div class="action-bar">
          <a-button type="primary" @click="updateFilePermissions">
            <template #icon><CheckOutlined /></template>
            {{ $t("i18n_49e56c7b90") }}
          </a-button>
        </div>
      </CustomModal>
    </a-layout-content>
  </div>
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
} from "@/api/ssh-file";

import codeEditor from "@/components/codeEditor/index.vue";
import { ZIP_ACCEPT, renderSize, parseTime, concurrentExecution, formatDuration } from "@/utils/const";
import { Empty } from "ant-design-vue";
import { uploadPieces } from "@/utils/upload-pieces";
import { h } from "vue";

export default {
  components: {
    codeEditor
  },
  inject: ["globalLoading"],
  props: {
    sshId: {
      type: String,
      default: ""
    },
    machineSshId: {
      type: String,
      default: ""
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
      tableHeight: "80vh",
      replaceFields: {
        children: "children",
        title: "name",
        key: "key"
      },
      columns: [
        {
          title: this.$t("i18n_d2e2560089"),
          dataIndex: "name",
          width: 250,
          ellipsis: true,
          sorter: (a, b) => (a.name || "").localeCompare(b.name || "")
        },
        {
          title: this.$t("i18n_28b988ce6a"),
          dataIndex: "dir",
          width: "100px",
          ellipsis: true
        },
        {
          title: this.$t("i18n_396b7d3f91"),
          dataIndex: "size",
          width: 120,
          ellipsis: true,
          sorter: (a, b) => Number(a.size) - new Number(b.size)
        },
        {
          title: this.$t("i18n_ba6e91fa9e"),
          dataIndex: "permissions",
          width: 120,
          ellipsis: true,
          tooltip: true
        },
        {
          title: this.$t("i18n_1303e638b5"),
          dataIndex: "modifyTime",
          width: "170px",
          ellipsis: true,
          customRender: ({ text }) => parseTime(text),
          sorter: (a, b) => Number(a.modifyTime) - new Number(b.modifyTime)
        },
        {
          title: this.$t("i18n_2b6bc0f293"),
          dataIndex: "operation",
          align: "center",
          fixed: "right",
          width: "180px"
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
          name: this.$t("i18n_29139c2a1a"),
          key: "name"
        },
        {
          name: this.$t("i18n_1303e638b5"),
          key: "modifyTime"
        }
      ],

      sortMethod: {
        key: "name",
        asc: true
      },
      confirmLoading: false,
      selectedKeys: [],
      expandedKeys: [],
      uploadShardingFileVisible: false,
      percentage: 0,
      percentageInfo: {}
    };
  },
  computed: {
    fileUploadDisabled() {
      return this.uploadFileList.length === 0 || this.confirmLoading;
    },
    nowPath() {
      if (!this.tempNode.allowPathParent) {
        return "";
      }
      return ((this.tempNode.allowPathParent || "") + "/" + (this.tempNode.nextPath || "")).replace(new RegExp("//+", "gm"), "/");
    },
    pathSegments() {
      if (!this.nowPath) return [];
      return this.nowPath.split("/").filter(segment => segment);
    },
    baseUrl() {
      if (this.sshId) {
        return "/node/ssh/";
      }
      return "/system/assets/ssh-file/";
    },
    reqDataId() {
      return this.sshId || this.machineSshId;
    },
    sortFileList() {
      return this.fileList.slice(0).sort((a, b) => {
        // 首先按照文件夹/文件类型排序
        if (a.dir && !b.dir) return -1;
        if (!a.dir && b.dir) return 1;

        // 然后按照选定的排序方法排序
        const aV = a[this.sortMethod.key] || "";
        const bV = b[this.sortMethod.key] || "";

        if (this.sortMethod.key === "name") {
          return this.sortMethod.asc ? aV.localeCompare(bV) : bV.localeCompare(aV);
        } else {
          // 数值类型排序
          return this.sortMethod.asc ? Number(aV) - Number(bV) : Number(bV) - Number(aV);
        }
      });
    }
  },
  mounted() {
    this.listShowDir = Boolean(localStorage.getItem("ssh-list-show-dir"));
    try {
      this.sortMethod = JSON.parse(localStorage.getItem("ssh-list-sort") || JSON.stringify(this.sortMethod));
    } catch (e) {
      console.error(e);
    }
    this.loadData();

    // 添加键盘快捷键
    window.addEventListener("keydown", this.handleKeyDown);
  },
  beforeUnmount() {
    // 移除键盘快捷键
    window.removeEventListener("keydown", this.handleKeyDown);
  },
  methods: {
    calcFilePermissionValue,
    formatDuration,
    changeSort(key, asc) {
      this.sortMethod = { key: key, asc: asc };
      localStorage.setItem("ssh-list-sort", JSON.stringify(this.sortMethod));
      this.loadData();
    },
    renderSize,

    // 处理键盘快捷键
    handleKeyDown(e) {
      // Ctrl+R: 刷新文件列表
      if (e.ctrlKey && e.key === "r" && this.tempNode.nextPath) {
        e.preventDefault();
        this.loadFileList();
      }

      // Ctrl+U: 打开上传对话框
      if (e.ctrlKey && e.key === "u" && this.tempNode.nextPath) {
        e.preventDefault();
        this.handleUpload();
      }

      // Ctrl+N: 新建文件夹
      if (e.ctrlKey && e.key === "n" && this.tempNode.nextPath) {
        e.preventDefault();
        this.handleAddFolder();
      }

      // Ctrl+F: 新建文件
      if (e.ctrlKey && e.key === "f" && this.tempNode.nextPath) {
        e.preventDefault();
        this.handleAddFile();
      }
    },

    // 格式化代码
    formatCode() {
      // 这里可以实现代码格式化功能
      // 如果没有具体实现，可以显示一个通知
      $notification.info({
        message: "代码格式化",
        description: "代码格式化功能需要根据具体文件类型实现"
      });
    },

    // 获取文件图标类型
    getFileIconClass(record) {
      if (record.dir) return "folder";
      if (record.textFileEdit) return "code";
      if (this.isImageFile(record.name)) return "image";
      if (this.isArchiveFile(record.name)) return "archive";
      return "file";
    },

    // 判断是否为图片文件
    isImageFile(filename) {
      if (!filename) return false;
      const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".svg"];
      return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    },

    // 判断是否为压缩文件
    isArchiveFile(filename) {
      if (!filename) return false;
      const archiveExtensions = [".zip", ".rar", ".tar", ".gz", ".7z", ".bz2", ".xz"];
      return archiveExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    },

    // 获取文件类型标签颜色
    getFileTypeColor(record) {
      if (record.link) return "purple";
      if (record.dir) return "blue";
      if (this.isImageFile(record.name)) return "green";
      if (this.isArchiveFile(record.name)) return "orange";
      if (record.textFileEdit) return "geekblue";
      return "default";
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
      const targetPath = this.pathSegments.slice(0, index + 1).join("/");
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
      this.loading = true;
      this.treeList = [];
      this.fileList = [];
      this.selectedKeys = [];
      this.expandedKeys = [];
      this.tempNode = {};
      getRootFileList(this.baseUrl, this.reqDataId)
        .then(res => {
          if (res.code === 200) {
            this.treeList = res.data
              .map((element, index) => {
                return {
                  key: element.id,
                  name: element.allowPathParent,
                  allowPathParent: element.allowPathParent,
                  nextPath: "/",
                  isLeaf: false,
                  // 配置的授权目录可能不存在
                  disabled: !!element.error,
                  modifyTime: element.modifyTime,
                  activeKey: [index]
                };
              })
              .sort((a, b) => {
                const aV = a[this.sortMethod.key] || "";
                const bV = b[this.sortMethod.key] || "";
                return this.sortMethod.asc ? bV.localeCompare(aV) : aV.localeCompare(bV);
              });

            // 添加动画效果
            setTimeout(() => {
              this.loading = false;
            }, 300);
          } else {
            this.loading = false;
          }
        })
        .catch(() => {
          this.loading = false;
        });
    },
    /**
     * 根据key获取树节点
     * @param keys
     * @returns {*}
     */
    getTreeNode(keys) {
      let node = this.treeList.find(node => node.activeKey[0] == keys.slice(0, 1)[0]);
      const nodeKeys = keys.slice(1);
      for (let [index, key] of nodeKeys.entries()) {
        if (key >= 0 && key < node.children.length) {
          node = node.children.find(node => node.activeKey.slice(index + 1, index + 2) == key);
        } else {
          throw new Error("Invalid key: " + key);
        }
      }
      return node;
    },
    /**
     * 更新树节点的方法抽离封装
     * @param keys
     * @param value
     */
    updateTreeChildren(keys, value) {
      const node = this.getTreeNode(keys);
      node.children = value;
    },
    /**
     * 文件列表转树结构
     * @param data
     */
    fileList2TreeData(data) {
      const node = this.tempNode;
      const children = data
        .filter(element => element.dir)
        .map(element => ({
          key: element.id,
          name: element.name,
          allowPathParent: node.allowPathParent,
          nextPath: (element.nextPath + "/" + element.name).replace(new RegExp("//+", "gm"), "/"),
          isLeaf: !element.dir,
          // 可能有错误
          disabled: !!element.error,
          modifyTime: element.modifyTime
        }))
        .sort((a, b) => {
          const aV = a[this.sortMethod.key] || "";
          const bV = b[this.sortMethod.key] || "";
          return this.sortMethod.asc ? bV.localeCompare(aV) : aV.localeCompare(bV);
        })
        .map((element, index) => ({ ...element, activeKey: node.activeKey.concat(index) }));
      this.updateTreeChildren(node.activeKey, children);
    },
    /**
     * 加载文件列表
     */
    loadTreeNode() {
      const { allowPathParent, nextPath } = this.tempNode;
      // 请求参数
      const params = {
        id: this.reqDataId,
        allowPathParent: allowPathParent,
        nextPath: nextPath
      };
      this.fileList = [];
      this.loading = true;
      // 加载文件
      getFileList(this.baseUrl, params).then(res => {
        if (res.code === 200) {
          // let children = []
          // 区分目录和文件
          res.data.forEach(element => {
            if (element.dir) {
              if (this.listShowDir) {
                this.fileList.push({
                  // path: node.dataRef.path,
                  ...element
                });
              }
            } else {
              // 设置文件表格
              this.fileList.push({
                // path: node.dataRef.path,
                ...element
              });
            }
          });
          //  更新tree 方法抽离封装
          this.fileList2TreeData(res.data);
        }
        this.loading = false;
      });
    },
    // 选中目录
    onSelect(selectedKeys, { node }) {
      if (node.dataRef.disabled) {
        return;
      }
      // console.log(node.dataRef, this.tempNode.key);
      if (node.dataRef.key === this.tempNode.key) {
        return;
      }
      this.tempNode = node.dataRef;
      this.loadTreeNode();
    },
    changeListShowDir() {
      this.loadFileList();
      localStorage.setItem("ssh-list-show-dir", this.listShowDir);
    },
    // 加载文件列表
    loadFileList() {
      if (Object.keys(this.tempNode).length === 0) {
        $notification.warn({
          message: this.$t("i18n_bcaf69a038")
        });
        return false;
      }
      // 请求参数
      const params = {
        id: this.reqDataId,
        allowPathParent: this.tempNode.allowPathParent,
        nextPath: this.tempNode.nextPath
      };
      // this.fileList = [];
      this.loading = true;
      // 加载文件
      getFileList(this.baseUrl, params).then(res => {
        if (res.code === 200) {
          // 区分目录和文件
          this.fileList = res.data
            .filter(element => {
              if (this.listShowDir) {
                return true;
              }
              return !element.dir;
            })
            .map(element => {
              // 设置文件表格
              return {
                // path: this.tempNode.path,
                ...element
              };
            });
          // 更新tree
          this.fileList2TreeData(res.data);
        }
        this.loading = false;
      });
    },
    // 上传文件
    handleUpload() {
      if (Object.keys(this.tempNode).length === 0) {
        $notification.error({
          message: this.$t("i18n_bcaf69a038")
        });
        return;
      }
      this.uploadFileVisible = true;
      this.uploadFileZip = false;
    },
    handleUploadZip() {
      this.handleUpload();
      this.uploadFileZip = true;
    },
    handleAddFolder() {
      this.addFileFolderVisible = true;
      // 目录1 文件2 标识
      // addFileOrFolderType: 1,
      //       fileFolderName: "",
      this.temp = {
        fileFolderName: "",
        addFileOrFolderType: 1,
        allowPathParent: this.tempNode.allowPathParent,
        nextPath: this.tempNode.nextPath
      };
    },
    handleAddFile() {
      this.addFileFolderVisible = true;
      // 目录1 文件2 标识
      // addFileOrFolderType: 1,
      //       fileFolderName: "",
      this.temp = {
        fileFolderName: "",
        addFileOrFolderType: 2,
        allowPathParent: this.tempNode.allowPathParent,
        nextPath: this.tempNode.nextPath
      };
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
      };
      newFileFolder(this.baseUrl, params).then(res => {
        if (res.code === 200) {
          $notification.success({
            message: res.msg
          });
          this.addFileFolderVisible = false;
          this.loadFileList();
          // this.closeAddFileFolder();
        }
      });
    },
    handleRemove(file) {
      const index = this.uploadFileList.indexOf(file);
      const newFileList = this.uploadFileList.slice();
      newFileList.splice(index, 1);
      this.uploadFileList = newFileList;
      return true;
    },
    beforeUpload(file) {
      this.uploadFileList = [...this.uploadFileList, file];
      return false;
    },
    closeUploadFile() {
      this.uploadFileList = [];
    },
    // 开始上传文件
    startUpload() {
      this.uploadFileList.forEach(file => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("id", this.reqDataId);
        formData.append("allowPathParent", this.tempNode.allowPathParent);
        formData.append("unzip", this.uploadFileZip);
        formData.append("nextPath", this.tempNode.nextPath);
        this.confirmLoading = true;
        // 上传文件
        uploadFile(this.baseUrl, formData)
          .then(res => {
            if (res.code === 200) {
              $notification.success({
                message: res.msg
              });
              this.loadFileList();
              this.closeUploadFile();
              this.uploadFileVisible = false;
            }
          })
          .finally(() => {
            this.confirmLoading = false;
          });
      });
    },
    startUploadSharding() {
      // 设置上传状态
      this.confirmLoading = true;
      // 遍历上传文件
      concurrentExecution(
        this.uploadFileList.map((item, index) => {
          // console.log(item);
          return index;
        }),
        // 并发数只能是 1
        1,
        curItem => {
          const file = this.uploadFileList[curItem];
          this.uploadFileList = this.uploadFileList.map((fileItem, fileIndex) => {
            if (fileIndex === curItem) {
              fileItem.status = "uploading";
            }
            return fileItem;
          });
          this.percentage = 0;
          this.percentageInfo = {};
          return new Promise((resolve, reject) => {
            uploadPieces({
              /** ssh 文件上传 目前切片并发控制为1 */
              concurrentNum: 1,
              file,
              resolveFileProcess: msg => {
                this.globalLoading({
                  spinning: true,
                  tip: msg
                });
              },
              resolveFileEnd: () => {
                this.globalLoading(false);
              },
              process: (process, end, total, duration) => {
                this.percentage = Math.max(this.percentage, process);
                this.percentageInfo = { end, total, duration };
              },
              success: () => {
                // 合并
                $notification.success({
                  message: this.$t("i18n_a7699ba731")
                });
                this.uploadFileList = this.uploadFileList.map((fileItem, fileIndex) => {
                  if (fileIndex === curItem) {
                    fileItem.status = "done";
                  }
                  return fileItem;
                });

                resolve();
              },
              uploadChunkError: () => {
                this.confirmLoading = false;
                this.percentage = 0;
                this.percentageInfo = {};
                this.uploadFileList = [];
              },
              error: msg => {
                this.uploadFileList = this.uploadFileList.map((fileItem, fileIndex) => {
                  if (fileIndex === curItem) {
                    fileItem.status = "error";
                  }
                  return fileItem;
                });
                $notification.error({
                  message: msg
                });
                this.confirmLoading = false;
                this.percentage = 0;
                this.percentageInfo = {};
                reject();
              },
              uploadCallback: formData => {
                return new Promise((resolve, reject) => {
                  formData.append("id", this.reqDataId);
                  formData.append("allowPathParent", this.tempNode.allowPathParent);
                  formData.append("unzip", this.uploadFileZip);
                  formData.append("nextPath", this.tempNode.nextPath);

                  // 上传文件
                  uploadShardingFile(this.baseUrl, formData)
                    .then(res => {
                      if (res.code === 200) {
                        resolve();
                      } else {
                        reject();
                      }
                    })
                    .catch(() => {
                      reject();
                    });
                });
              }
            });
          });
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
          this.percentage = 0;
          this.percentageInfo = {};
          this.uploadFileList = [];
          this.loadFileList();
          this.uploadShardingFileVisible = false;
        })
        .finally(() => {
          this.confirmLoading = false;
          //
        });
    },
    // 编辑
    handleEdit(record) {
      this.temp = Object.assign({}, record);
      const params = {
        id: this.reqDataId,
        allowPathParent: record.allowPathParent,
        nextPath: record.nextPath,
        name: record.name
      };
      readFile(this.baseUrl, params).then(res => {
        if (res.code === 200) {
          this.temp = { ...this.temp, fileContent: res.data };
          this.editFileVisible = true;
        }
      });
      //
    },
    updateFileData() {
      const params = {
        id: this.reqDataId,
        allowPathParent: this.temp.allowPathParent,
        nextPath: this.temp.nextPath,
        name: this.temp.name,
        content: this.temp.fileContent
      };
      this.confirmLoading = true;
      updateFileData(this.baseUrl, params)
        .then(res => {
          if (res.code === 200) {
            $notification.success({
              message: res.msg
            });
            this.editFileVisible = false;
          }
        })
        .finally(() => {
          this.confirmLoading = false;
        });
    },
    // 修改文件权限
    handleFilePermission(record) {
      this.temp = Object.assign({}, record);
      this.permissions = parsePermissions(this.temp.permissions);
      //const permissionsValue = calcFilePermissionValue(this.permissions);
      //this.permissionTips = `cd ${this.temp.nextPath} && chmod ${permissionsValue} ${this.temp.name}`;
      this.editFilePermissionVisible = true;
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
      };
      changeFilePermission(this.baseUrl, params).then(res => {
        if (res.code === 200) {
          $notification.success({
            message: res.msg
          });
          this.editFilePermissionVisible = false;
          this.loadFileList();
        }
      });
    },

    // 下载
    handleDownload(record) {
      // 请求参数
      const params = {
        id: this.reqDataId,
        allowPathParent: record.allowPathParent,
        nextPath: record.nextPath,
        name: record.name
      };
      // 请求接口拿到 blob
      window.open(downloadFile(this.baseUrl, params), "_blank");
    },
    // 删除文件夹
    handleDeletePath() {
      $confirm({
        title: this.$t("i18n_c4535759ee"),
        zIndex: 1009,
        content: this.$t("i18n_8756efb8f4"),
        okText: this.$t("i18n_e83a256e4f"),
        cancelText: this.$t("i18n_625fb26b4b"),
        onOk: async () => {
          return deleteFile(this.baseUrl, {
            id: this.reqDataId,
            allowPathParent: this.tempNode.allowPathParent,
            nextPath: this.tempNode.nextPath
          }).then(res => {
            if (res.code === 200) {
              $notification.success({
                message: res.msg
              });
              // 刷新树
              const activeKey = this.tempNode.activeKey;
              // 获取上一级节点
              const parentNode = this.getTreeNode(activeKey.slice(0, activeKey.length - 1));
              // 设置当前选中
              this.selectedKeys = [parentNode.key];
              // 设置缓存节点
              this.tempNode = parentNode;
              // 加载上一级文件列表
              this.loadTreeNode();

              this.fileList = [];
              //this.loadFileList();
            }
          });
        }
      });
    },
    // 删除
    handleDelete(record) {
      $confirm({
        title: this.$t("i18n_c4535759ee"),
        zIndex: 1009,
        content: this.$t("i18n_3a6bc88ce0"),
        okText: this.$t("i18n_e83a256e4f"),
        cancelText: this.$t("i18n_625fb26b4b"),
        onOk: () => {
          return deleteFile(this.baseUrl, {
            id: this.reqDataId,
            allowPathParent: record.allowPathParent,
            nextPath: record.nextPath,
            name: record.name
          }).then(res => {
            if (res.code === 200) {
              $notification.success({
                message: res.msg
              });
              this.loadFileList();
            }
          });
        }
      });
    },
    handleRenameFile(record) {
      this.renameFileFolderVisible = true;
      this.temp = {
        fileFolderName: record.name,
        oldFileFolderName: record.name,
        allowPathParent: record.allowPathParent,
        nextPath: record.nextPath
      };
    },
    // 确认修改文件 目录名称
    renameFileFolder() {
      const params = {
        id: this.reqDataId,
        name: this.temp.oldFileFolderName,
        newname: this.temp.fileFolderName,
        allowPathParent: this.temp.allowPathParent,
        nextPath: this.temp.nextPath
      };
      this.confirmLoading = true;
      renameFileFolder(this.baseUrl, params)
        .then(res => {
          if (res.code === 200) {
            $notification.success({
              message: res.msg
            });
            this.renameFileFolderVisible = false;
            this.loadFileList();
          }
        })
        .finally(() => {
          this.confirmLoading = false;
        });
    }
  }
};
</script>
<style lang="less" scoped>
:deep(.ant-progress-text) {
  width: auto;
}

.ssh-file-layout {
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);

  .sider {
    border-right: 1px solid var(--el-border-color-lighter);
    padding: 16px;

    .dir-container {
      padding-bottom: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      margin-bottom: 16px;
    }

    .tree-container {
      height: calc(100vh - 180px);
      overflow-y: auto;
      padding-right: 8px;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--el-border-color);
        border-radius: 3px;
      }

      .ant-tree {
        background: transparent;

        .ant-tree-node-content-wrapper {
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s;

          &:hover {
            background: var(--el-color-primary-light-9);
          }

          &.ant-tree-node-selected {
            background: var(--el-color-primary-light-8);
          }
        }

        .ant-tree-switcher {
          width: 24px;
          line-height: 24px;
        }
      }
    }
  }

  .file-content {
    padding: 16px;
    background: var(--el-bg-color);

    .ant-table {
      border-radius: 8px;
      overflow: hidden;

      .ant-table-title {
        padding: 16px;
        background: var(--el-color-primary-light-9);
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .ant-table-thead > tr > th {
        background: var(--el-bg-color-page);
        &::before {
          display: none;
        }
      }

      .ant-table-row {
        transition: all 0.3s;

        &:hover {
          background: var(--el-color-primary-light-9) !important;
        }
      }
    }
  }

  .upload-file-modal {
    .upload-container {
      padding: 24px;

      .ant-upload-list {
        margin-top: 16px;
      }

      .upload-action {
        margin-top: 24px;
        text-align: center;
      }
    }
  }

  .file-permission-modal {
    .permission-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px;
      background: var(--el-bg-color-page);
      border-radius: 8px;

      .header {
        font-weight: 500;
        color: var(--el-text-color-regular);
        padding-bottom: 8px;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      .permission-row {
        display: flex;
        align-items: center;
        color: var(--el-text-color-primary);
      }

      .permission-cell {
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .action-bar {
      display: flex;
      justify-content: center;
      margin-top: 24px;
    }
  }

  .sharding-upload-modal {
    .ant-alert {
      margin-bottom: 24px;
      border-radius: 4px;
    }

    .upload-progress {
      margin: 24px 0;

      .ant-progress-outer {
        margin-right: 0;
        padding-right: 0;
      }

      .ant-progress-text {
        margin: 0 8px;
        color: var(--el-text-color-primary);
      }

      .ant-progress-bg {
        height: 8px !important;
        border-radius: 4px;
      }
    }
  }

  .rename-modal {
    .rename-container {
      padding: 24px;

      .current-path {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        padding: 8px 12px;
        background: var(--el-color-primary-light-9);
        border-radius: 4px;

        .anticon {
          color: var(--el-text-color-secondary);
        }

        .path-text {
          color: var(--el-text-color-regular);
          font-size: 14px;
        }
      }

      .rename-input {
        margin-bottom: 24px;
      }

      .action-bar {
        display: flex;
        justify-content: center;
      }
    }
  }
}

.metric-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }

  .ant-card-head {
    min-height: 48px;
    padding: 0 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .ant-card-body {
    padding: 16px;
  }
}

.custom-modal {
  .ant-modal-content {
    border-radius: 8px;
    overflow: hidden;
  }

  .ant-modal-header {
    background: var(--el-color-primary-light-9);
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 16px 24px;
  }

  .ant-modal-body {
    padding: 24px;
  }

  .ant-modal-footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 16px 24px;
  }
}

.max-progress {
  .ant-progress-outer {
    margin-right: 0;
    padding-right: 0;
  }

  .ant-progress-text {
    margin: 0 8px;
    color: var(--el-text-color-primary);
  }

  .ant-progress-bg {
    height: 8px !important;
    border-radius: 4px;
  }
}

.file-permission-modal {
  .permission-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background: var(--el-bg-color-page);
    border-radius: 8px;

    .header {
      font-weight: 500;
      color: var(--el-text-color-regular);
      padding-bottom: 8px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .permission-row {
      display: flex;
      align-items: center;
      color: var(--el-text-color-primary);
    }

    .permission-cell {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .action-bar {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}
</style>
