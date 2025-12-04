<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'add' ? '新增服务�? : '编辑服务�?"
    width="80%"
    :close-on-click-modal="false"
    destroy-on-close
    class="server-edit-dialog"
    align-center
    top="5vh"
    :show-close="true"
    :lock-scroll="true"
    :modal="true"
    :append-to-body="true"
  >
    <!-- 自定义头�?-->
    <template #header="{ titleId, titleClass }">
      <div class="dialog-header">
        <div class="header-left">
          <IconifyIconOnline
            :icon="mode === 'add' ? 'ri:add-circle-line' : 'ri:edit-line'"
            class="header-icon"
          />
          <span :id="titleId" :class="titleClass" class="dialog-title">
            {{ mode === "add" ? "新增服务�? : "编辑服务�? }}
          </span>
        </div>
      </div>
    </template>

    <div class="dialog-content no-scrollbar">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="160px"
        label-position="left"
        class="server-form"
      >
        <!-- 使用优雅的两列布局 -->
        <el-row :gutter="24" class="form-row">
          <!-- 左列：基本信�?-->
          <el-col :span="12" class="form-column">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline
                  icon="ri:information-line"
                  class="section-icon"
                />
                <span class="section-title">基本信息</span>
              </div>
              <div class="section-content">
                <el-form-item label="服务器名�? prop="monitorSysGenServerName">
                  <el-input
                    v-model="formData.monitorSysGenServerName"
                    placeholder="请输入服务器名称"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:server-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item
                  label="服务器组"
                  prop="monitorSysGenServerGroupId"
                >
                  <el-select
                    v-model="formData.monitorSysGenServerGroupId"
                    placeholder="请选择服务器组"
                    style="width: 100%"
                    clearable
                    filterable
                    @change="handleGroupChange"
                  >
                    <!-- 新建组选项 -->
                    <el-option
                      value="__CREATE_NEW_GROUP__"
                      label="+ 新建服务器组"
                      class="create-group-option"
                    >
                      <div
                        class="create-group-option-content"
                        @click.stop="handleCreateGroup"
                      >
                        <IconifyIconOnline
                          icon="ri:add-line"
                          style="color: var(--el-color-primary)"
                        />
                        <span class="create-text">新建服务器组</span>
                      </div>
                    </el-option>

                    <!-- 分隔线（仅在有分组时显示�?-->
                    <el-option
                      v-if="serverGroups.length > 0"
                      disabled
                      value=""
                      label=""
                      class="divider-option"
                    >
                      <div class="option-divider"></div>
                    </el-option>

                    <!-- 无分组提�?-->
                    <el-option
                      v-if="serverGroups.length === 0"
                      disabled
                      value=""
                      label=""
                      class="empty-tip-option"
                    >
                      <div class="empty-tip">
                        <IconifyIconOnline
                          icon="ri:information-line"
                          class="mr-1"
                        />
                        暂无分组，请先新�?
                      </div>
                    </el-option>

                    <!-- 现有组选项 -->
                    <el-option
                      v-for="group in serverGroups"
                      :key="group.monitorSysGenServerGroupId"
                      :label="group.monitorSysGenServerGroupName"
                      :value="group.monitorSysGenServerGroupId"
                    >
                      <div class="group-option">
                        <IconifyIconOnline
                          :icon="
                            group.monitorSysGenServerGroupIcon ||
                            'ri:folder-line'
                          "
                          :style="{
                            color:
                              group.monitorSysGenServerGroupColor || '#409eff',
                          }"
                        />
                        <span class="group-name">{{
                          group.monitorSysGenServerGroupName
                        }}</span>
                        <el-tag
                          v-if="group.monitorSysGenServerGroupIsDefault === 1"
                          type="primary"
                          size="small"
                          effect="plain"
                          class="default-tag"
                        >
                          默认
                        </el-tag>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <!-- 操作系统信息展示 - 简化版 -->
                <div
                  v-if="osInfo && osInfo.isLocal"
                  class="os-info-section compact"
                >
                  <div class="os-info-header">
                    <IconifyIconOnline
                      icon="ri:computer-line"
                      class="os-icon"
                    />
                    <span class="os-title">系统信息</span>
                    <el-tag type="success" size="small" effect="light"
                      >自动检�?/el-tag
                    >
                  </div>
                  <div class="os-info-content">
                    <div class="os-summary">
                      <span class="os-text"
                        >{{ osInfo.osType || "未知" }}
                        {{ osInfo.osVersion || "" }}</span
                      >
                      <el-tag
                        size="small"
                        type="info"
                        effect="plain"
                        class="arch-tag"
                      >
                        {{ osInfo.osArch || "x86_64" }}
                      </el-tag>
                    </div>
                  </div>
                </div>

                <el-form-item
                  label="协议类型"
                  prop="monitorSysGenServerProtocol"
                >
                  <el-select
                    v-model="formData.monitorSysGenServerProtocol"
                    placeholder="选择协议类型"
                    style="width: 100%"
                    @change="handleProtocolChange"
                  >
                    <el-option label="SSH" value="SSH">
                      <div class="protocol-option">
                        <IconifyIconOnline icon="ri:terminal-line" />
                        <span>SSH</span>
                      </div>
                    </el-option>
                    <el-option label="RDP" value="RDP">
                      <div class="protocol-option">
                        <IconifyIconOnline icon="ri:computer-line" />
                        <span>RDP</span>
                      </div>
                    </el-option>
                    <el-option label="VNC" value="VNC">
                      <div class="protocol-option">
                        <IconifyIconOnline icon="ri:remote-control-line" />
                        <span>VNC</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="服务器地址" prop="monitorSysGenServerHost">
                  <el-input
                    v-model="formData.monitorSysGenServerHost"
                    placeholder="请输入IP地址或域�?
                    clearable
                    @blur="detectServerInfo"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:global-line" />
                    </template>
                    <template #suffix>
                      <el-tooltip
                        content="自动检测操作系统信�?
                        placement="top"
                      >
                        <el-button
                          type="text"
                          size="small"
                          @click="detectServerInfo"
                          :loading="detectLoading"
                        >
                          <IconifyIconOnline icon="ri:refresh-line" />
                        </el-button>
                      </el-tooltip>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="端口" prop="monitorSysGenServerPort">
                  <el-input-number
                    v-model="formData.monitorSysGenServerPort"
                    :min="1"
                    :max="65535"
                    placeholder="端口�?
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="服务器标�? prop="monitorSysGenServerTags">
                  <el-input
                    v-model="formData.monitorSysGenServerTags"
                    placeholder="请输入标签，多个标签用逗号分隔"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:price-tag-3-line" />
                    </template>
                  </el-input>
                  <div class="form-tip">
                    用于服务器分组和筛选，例如：生产环�?数据库服务器
                  </div>
                </el-form-item>

                <el-form-item label="服务器描�? prop="monitorSysGenServerDesc">
                  <el-input
                    v-model="formData.monitorSysGenServerDesc"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入服务器描述信息"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>

                <!-- 服务器类型和操作系统信息 -->
                <el-form-item label="服务器类�?>
                  <div class="server-type-container">
                    <el-tag
                      :type="
                        formData.monitorSysGenServerIsLocal === 1
                          ? 'success'
                          : 'info'
                      "
                      size="small"
                      effect="light"
                    >
                      <IconifyIconOnline
                        :icon="
                          formData.monitorSysGenServerIsLocal === 1
                            ? 'ri:home-line'
                            : 'ri:cloud-line'
                        "
                        class="mr-1"
                      />
                      {{
                        formData.monitorSysGenServerIsLocal === 1
                          ? "本地服务�?
                          : "远程服务�?
                      }}
                    </el-tag>
                    <el-text size="small" type="info" class="ml-2">
                      (自动检测，基于IP地址判断)
                    </el-text>
                  </div>
                </el-form-item>

                <!-- 操作系统信息 - 简化版 -->
                <el-form-item label="操作系统" prop="monitorSysGenServerOsType">
                  <el-select
                    v-model="formData.monitorSysGenServerOsType"
                    placeholder="选择操作系统类型"
                    style="width: 100%"
                    @change="handleOsTypeChange"
                    :disabled="
                      formData.monitorSysGenServerIsLocal === 1 &&
                      !!osInfo?.osType
                    "
                    filterable
                  >
                    <el-option-group label="Windows 系列">
                      <el-option label="Windows Server" value="Windows Server">
                        <div class="os-option">
                          <IconifyIconOnline
                            icon="ri:windows-line"
                            class="os-option-icon"
                          />
                          <span>Windows Server</span>
                        </div>
                      </el-option>
                      <el-option label="Windows" value="Windows">
                        <div class="os-option">
                          <IconifyIconOnline
                            icon="ri:windows-line"
                            class="os-option-icon"
                          />
                          <span>Windows</span>
                        </div>
                      </el-option>
                    </el-option-group>
                    <el-option-group label="Linux 发行�?>
                      <el-option label="Ubuntu" value="Ubuntu">
                        <div class="os-option">
                          <IconifyIconOnline
                            icon="ri:ubuntu-line"
                            class="os-option-icon"
                          />
                          <span>Ubuntu</span>
                        </div>
                      </el-option>
                      <el-option label="CentOS" value="CentOS">
                        <div class="os-option">
                          <IconifyIconOnline
                            icon="ri:centos-line"
                            class="os-option-icon"
                          />
                          <span>CentOS</span>
                        </div>
                      </el-option>
                      <el-option label="Debian" value="Debian">
                        <div class="os-option">
                          <IconifyIconOnline
                            icon="ri:debian-line"
                            class="os-option-icon"
                          />
                          <span>Debian</span>
                        </div>
                      </el-option>
                      <el-option label="Red Hat" value="Red Hat">
                        <div class="os-option">
                          <IconifyIconOnline
                            icon="ri:redhat-line"
                            class="os-option-icon"
                          />
                          <span>Red Hat</span>
                        </div>
                      </el-option>
                    </el-option-group>
                    <el-option-group label="其他">
                      <el-option label="macOS" value="macOS">
                        <div class="os-option">
                          <IconifyIconOnline
                            icon="ri:apple-line"
                            class="os-option-icon"
                          />
                          <span>macOS</span>
                        </div>
                      </el-option>
                      <el-option label="自定�? value="Custom">
                        <div class="os-option">
                          <IconifyIconOnline
                            icon="ri:settings-line"
                            class="os-option-icon"
                          />
                          <span>自定�?/span>
                        </div>
                      </el-option>
                    </el-option-group>
                  </el-select>

                  <!-- 自定义操作系统输�?-->
                  <el-input
                    v-if="formData.monitorSysGenServerOsType === 'Custom'"
                    v-model="formData.monitorSysGenServerOsCustom"
                    placeholder="请输入自定义操作系统名称"
                    clearable
                    class="mt-2"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:edit-line" />
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>
          </el-col>

          <!-- 右列：认证与连接信息 -->
          <el-col :span="12" class="form-column">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline
                  icon="ri:shield-user-line"
                  class="section-icon"
                />
                <span class="section-title">认证与连�?/span>
              </div>
              <div class="section-content">
                <el-form-item label="用户�? prop="monitorSysGenServerUsername">
                  <el-input
                    v-model="formData.monitorSysGenServerUsername"
                    placeholder="请输入用户名"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:user-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item
                  label="认证方式"
                  prop="monitorSysGenServerAuthType"
                >
                  <el-select
                    v-model="formData.monitorSysGenServerAuthType"
                    placeholder="选择认证方式"
                    style="width: 100%"
                  >
                    <el-option label="密码认证" value="password">
                      <div class="auth-option">
                        <IconifyIconOnline icon="ri:lock-password-line" />
                        <span>密码认证</span>
                      </div>
                    </el-option>
                    <el-option label="密钥认证" value="key">
                      <div class="auth-option">
                        <IconifyIconOnline icon="ri:key-line" />
                        <span>密钥认证</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item
                  v-if="formData.monitorSysGenServerAuthType === 'password'"
                  label="密码"
                  prop="monitorSysGenServerPassword"
                >
                  <el-input
                    v-model="formData.monitorSysGenServerPassword"
                    type="password"
                    placeholder="请输入密�?
                    show-password
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:lock-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item
                  v-if="formData.monitorSysGenServerAuthType === 'key'"
                  label="私钥"
                  prop="monitorSysGenServerPrivateKey"
                >
                  <el-input
                    v-model="formData.monitorSysGenServerPrivateKey"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入SSH私钥内容"
                  />
                </el-form-item>

                <el-form-item label="服务器状�?>
                  <div class="switch-wrapper">
                    <el-switch
                      v-model="formData.monitorSysGenServerStatus"
                      :active-value="1"
                      :inactive-value="0"
                      active-text="启用"
                      inactive-text="禁用"
                    />
                    <el-tooltip
                      content="启用后服务器将参与监控和管理"
                      placement="top"
                    >
                      <IconifyIconOnline
                        icon="ri:question-line"
                        class="help-icon"
                      />
                    </el-tooltip>
                  </div>
                </el-form-item>

                <!-- 协议特定配置 -->
                <template v-if="formData.monitorSysGenServerProtocol === 'SSH'">
                  <el-form-item label="字符编码">
                    <el-select
                      v-model="formData.monitorSysGenServerCharset"
                      placeholder="选择字符编码"
                      style="width: 100%"
                    >
                      <el-option label="UTF-8" value="UTF-8" />
                      <el-option label="GBK" value="GBK" />
                      <el-option label="GB2312" value="GB2312" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="连接超时">
                    <el-input-number
                      v-model="formData.monitorSysGenServerTimeout"
                      :min="1000"
                      :max="60000"
                      :step="1000"
                      placeholder="毫秒"
                      style="width: 100%"
                    />
                  </el-form-item>
                </template>

                <template v-if="formData.monitorSysGenServerProtocol === 'RDP'">
                  <el-form-item label="屏幕分辨�?>
                    <el-row :gutter="8">
                      <el-col :span="12">
                        <el-input-number
                          v-model="formData.monitorSysGenServerWidth"
                          :min="800"
                          :max="1920"
                          placeholder="宽度"
                          style="width: 100%"
                          class="min-w-[150px]"
                        />
                      </el-col>
                      <el-col :span="12">
                        <el-input-number
                          v-model="formData.monitorSysGenServerHeight"
                          :min="600"
                          :max="1080"
                          placeholder="高度"
                          style="width: 100%"
                          class="min-w-[150px]"
                        />
                      </el-col>
                    </el-row>
                  </el-form-item>

                  <el-form-item label="颜色深度">
                    <el-select
                      v-model="formData.monitorSysGenServerColorDepth"
                      placeholder="选择颜色深度"
                      style="width: 100%"
                    >
                      <el-option label="16�? value="16" />
                      <el-option label="24�? value="24" />
                      <el-option label="32�? value="32" />
                    </el-select>
                  </el-form-item>
                </template>

                <template v-if="formData.monitorSysGenServerProtocol === 'VNC'">
                  <el-form-item label="VNC密码">
                    <el-input
                      v-model="formData.monitorSysGenServerVncPassword"
                      type="password"
                      placeholder="请输入VNC密码"
                      show-password
                      clearable
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:lock-line" />
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="只读模式">
                    <div class="switch-wrapper">
                      <el-switch
                        v-model="formData.monitorSysGenServerReadOnly"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="�?
                        inactive-text="�?
                      />
                    </div>
                  </el-form-item>
                </template>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 服务器设置对话框已移除，配置功能在专门的服务器配置页面中 -->

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-tips">
          <IconifyIconOnline icon="ri:information-line" class="tip-icon" />
          <span>请填写完整的服务器信�?/span>
        </div>
        <div class="footer-right">
          <el-button class="cancel-btn" @click="visible = false">
            <IconifyIconOnline icon="ri:close-line" class="mr-1" />
            取消
          </el-button>
          <el-button
            class="submit-btn"
            type="primary"
            :loading="loading"
            @click="handleSubmit"
          >
            <IconifyIconOnline
              :icon="mode === 'add' ? 'ri:add-line' : 'ri:save-line'"
              class="mr-1"
            />
            {{ mode === "add" ? "新增服务�? : "保存修改" }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>

  <!-- 组编辑弹�?-->
  <ServerGroupEditDialog
    ref="groupEditDialogRef"
    @success="handleGroupCreateSuccess"
  />
</template>

<script setup lang="ts">
import { type ServerProxy, getServerProxyPageList } from "@/api/server/proxy";
import {
  type ServerDisplayData,
  saveServer,
  testLocalIpDetection,
  updateServer,
} from "@/api/server";
import {
  type ServerGroup,
  getDefaultGroup,
  getEnabledServerGroups,
} from "@/api/server/group";
// 服务器设置相关导入已移除，配置功能在专门的服务器配置页面�?
import { message } from "@repo/utils";
import { computed, nextTick, reactive, ref } from "vue";
// ServerSettingDialog已移除，配置功能在专门的服务器配置页面中

// 导入组编辑弹�?
import ServerGroupEditDialog from "../../server-group/components/ServerGroupEditDialog.vue";

// 定义事件
const emit = defineEmits<{
  success: [];
  openConfig: [serverId: number];
}>();

// 响应式状�?
const visible = ref(false);
const loading = ref(false);
const testLoading = ref(false);
const detectLoading = ref(false);
const mode = ref<"add" | "edit">("add");
const formRef = ref();
// serverSettingDialogRef已移除，配置功能在专门的服务器配置页面中

// 服务器组相关
const serverGroups = ref<ServerGroup[]>([]);
const defaultGroup = ref<ServerGroup | null>(null);
const groupEditDialogRef = ref();

// 操作系统信息
const osInfo = ref<{
  isLocal: boolean;
  osType?: string;
  osVersion?: string;
  osArch?: string;
  ipAddresses?: string[];
} | null>(null);

// 表单数据
const formData = reactive({
  monitorSysGenServerId: null as number | null,
  monitorSysGenServerName: "",
  monitorSysGenServerGroupId: null as number | null,
  monitorSysGenServerHost: "",
  monitorSysGenServerPort: 22,
  monitorSysGenServerProtocol: "SSH",
  monitorSysGenServerUsername: "",
  monitorSysGenServerPassword: "",
  monitorSysGenServerPrivateKey: "",
  monitorSysGenServerAuthType: "password",
  monitorSysGenServerStatus: 1,
  monitorSysGenServerTags: "",
  monitorSysGenServerDesc: "",
  monitorSysGenServerCharset: "UTF-8",
  monitorSysGenServerTimeout: 30000,
  monitorSysGenServerWidth: 1024,
  monitorSysGenServerHeight: 768,
  monitorSysGenServerColorDepth: "24",
  monitorSysGenServerVncPassword: "",
  monitorSysGenServerReadOnly: 0,
  // 是否本地服务器（自动检测，不允许修改）
  monitorSysGenServerIsLocal: 0,
  // 操作系统信息（自动检测）
  monitorSysGenServerOsType: "",
  monitorSysGenServerOsVersion: "",
  monitorSysGenServerOsArch: "",
  monitorSysGenServerOsCustom: "", // 自定义操作系统名�?
});

// 代理相关数据
const proxyList = ref<ServerProxy[]>([]);
const proxyListLoading = ref(false);
const selectedProxy = ref<ServerProxy | null>(null);

// 服务器设置数据已移至专门的服务器配置页面

// 分组的代理列�?
const groupedProxyList = computed(() => {
  const groups = [
    { type: "HTTP", label: "HTTP 代理", proxies: [] as ServerProxy[] },
    { type: "SOCKS4", label: "SOCKS4 代理", proxies: [] as ServerProxy[] },
    { type: "SOCKS5", label: "SOCKS5 代理", proxies: [] as ServerProxy[] },
    {
      type: "GUACAMOLE",
      label: "Guacamole 代理",
      proxies: [] as ServerProxy[],
    },
  ];

  proxyList.value.forEach((proxy) => {
    const group = groups.find(
      (g) => g.type === proxy.monitorSysGenServerProxyType
    );
    if (group) {
      group.proxies.push(proxy);
    }
  });

  return groups.filter((group) => group.proxies.length > 0);
});

// 表单验证规则
const rules = {
  monitorSysGenServerName: [
    { required: true, message: "服务器名称不能为�?, trigger: "blur" },
    {
      min: 2,
      max: 255,
      message: "服务器名称最大长度要小于 255",
      trigger: "blur",
    },
  ],
  monitorSysGenServerHost: [
    { required: true, message: "服务器地址不能为空", trigger: "blur" },
    {
      pattern:
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
      message: "请输入有效的IP地址或域�?,
      trigger: "blur",
    },
    { max: 255, message: "服务器主机地址最大长度要小于 255", trigger: "blur" },
  ],
  monitorSysGenServerPort: [
    { required: true, message: "端口号不能为�?, trigger: "blur" },
    {
      type: "number" as const,
      min: 1,
      max: 65535,
      message: "端口号范�?1-65535",
      trigger: "blur",
    },
  ],
  monitorSysGenServerProtocol: [
    { required: true, message: "连接协议不能为空", trigger: "change" },
    { max: 50, message: "连接协议最大长度要小于 50", trigger: "blur" },
  ],
  monitorSysGenServerUsername: [
    { required: true, message: "用户名不能为�?, trigger: "blur" },
    { max: 255, message: "用户名最大长度要小于 255", trigger: "blur" },
  ],
  monitorSysGenServerAuthType: [
    { required: true, message: "请选择认证方式", trigger: "change" },
  ],
  monitorSysGenServerPassword: [
    {
      validator: (_rule: any, value: string, callback: Function) => {
        // 密码设置为非必填，只在有值时进行基本验证
        if (value && value.length < 1) {
          callback(new Error("密码长度不能为空"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  monitorSysGenServerPrivateKey: [
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (formData.monitorSysGenServerAuthType === "key" && !value) {
          callback(new Error("请输入私�?));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  monitorSysGenServerOsType: [
    { required: true, message: "请选择操作系统类型", trigger: "change" },
  ],
  monitorSysGenServerOsCustom: [
    {
      validator: (_rule: any, value: string, callback: Function) => {
        if (formData.monitorSysGenServerOsType === "Custom" && !value) {
          callback(new Error("请输入自定义操作系统名称"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

/**
 * 打开对话�?
 */
const open = async (editMode: "add" | "edit" = "add") => {
  mode.value = editMode;
  visible.value = true;

  // 加载服务器组列表
  await loadServerGroups();

  // 根据协议设置默认端口
  if (editMode === "add") {
    setDefaultPort();
    // 新增模式下默认设置为在线状�?
    formData.monitorSysGenServerStatus = 1;
    // 服务器设置已移至专门的配置页�?

    // 加载并设置默认分�?
    await loadDefaultGroup();
    if (defaultGroup.value) {
      formData.monitorSysGenServerGroupId =
        defaultGroup.value.monitorSysGenServerGroupId || null;
    }
  }
};

/**
 * 设置数据
 */
const setData = async (data: ServerDisplayData | any) => {
  if (data && Object.keys(data).length > 0) {
    // 如果是ServerDisplayData类型，需要映射到表单字段
    if ("name" in data && "host" in data) {
      // 这是ServerDisplayData类型，需要映�?
      Object.assign(formData, {
        monitorSysGenServerId: data.id,
        monitorSysGenServerName: data.name,
        monitorSysGenServerHost: data.host,
        monitorSysGenServerPort: data.port,
        monitorSysGenServerProtocol: data.protocol,
        monitorSysGenServerUsername: data.username,
        monitorSysGenServerDesc: data.description,
        monitorSysGenServerTags: data.tags,
        monitorSysGenServerStatus: data.status,
        // 确保操作系统信息正确映射
        monitorSysGenServerOsType: data.osType || "",
        monitorSysGenServerOsVersion: data.osVersion || "",
        monitorSysGenServerOsArch: data.osArch || "x86_64",
        monitorSysGenServerOsCustom:
          data.osType === "Custom" ? data.osCustom : "",
        ...data,
      });
    } else {
      // 直接赋值（兼容原有的后台数据格式）
      const mappedData = {
        ...data,
        // 确保操作系统信息存在默认�?
        monitorSysGenServerOsType: data.monitorSysGenServerOsType || "",
        monitorSysGenServerOsVersion: data.monitorSysGenServerOsVersion || "",
        monitorSysGenServerOsArch: data.monitorSysGenServerOsArch || "x86_64",
        monitorSysGenServerOsCustom:
          data.monitorSysGenServerOsType === "Custom"
            ? data.monitorSysGenServerOsCustom
            : "",
      };
      Object.assign(formData, mappedData);
    }

    // 如果设置了操作系统类型，触发handleOsTypeChange以确保相关字段正确设�?
    if (formData.monitorSysGenServerOsType) {
      handleOsTypeChange();
    }
  } else {
    resetForm();
  }
};

/**
 * 加载服务器组列表
 */
const loadServerGroups = async () => {
  try {
    const result = await getEnabledServerGroups();
    console.log("服务器组API响应:", JSON.stringify(result, null, 2));

    // 兼容多种数据结构
    let groups: ServerGroup[] = [];
    if (result?.data) {
      if (Array.isArray(result.data)) {
        groups = result.data;
      } else if (Array.isArray((result.data as any)?.records)) {
        groups = (result.data as any).records;
      } else if (Array.isArray((result.data as any)?.data)) {
        groups = (result.data as any).data;
      }
    }

    serverGroups.value = groups;
    console.log("解析后的服务器组列表:", groups.length, "个分�?);
  } catch (error) {
    console.error("加载服务器组失败:", error);
    serverGroups.value = [];
  }
};

/**
 * 加载默认分组
 */
const loadDefaultGroup = async () => {
  try {
    const result = await getDefaultGroup();
    if (result.success && result.data) {
      defaultGroup.value = result.data;
    }
  } catch (error) {
    console.error("加载默认分组失败:", error);
  }
};

/**
 * 处理服务器组变更
 */
const handleGroupChange = (groupId: number | string | null) => {
  // 如果选择的是新建组选项
  if (groupId === "__CREATE_NEW_GROUP__") {
    // 重置选择
    formData.monitorSysGenServerGroupId = null;
    // 打开新建组弹�?
    handleCreateGroup();
    return;
  }

  console.log("服务器组变更:", groupId);
};

/**
 * 处理新建�?
 */
const handleCreateGroup = () => {
  // 打开组编辑弹�?
  groupEditDialogRef.value?.open("add");
};

/**
 * 处理组创建成�?
 */
const handleGroupCreateSuccess = () => {
  // 重新加载服务器组列表
  loadServerGroups();
};

/**
 * 重置表单
 */
const resetForm = () => {
  // 清除osInfo
  osInfo.value = null;

  Object.assign(formData, {
    monitorSysGenServerId: null,
    monitorSysGenServerName: "",
    monitorSysGenServerGroupId: null,
    monitorSysGenServerHost: "",
    monitorSysGenServerPort: 22,
    monitorSysGenServerProtocol: "SSH",
    monitorSysGenServerUsername: "",
    monitorSysGenServerPassword: "",
    monitorSysGenServerPrivateKey: "",
    monitorSysGenServerAuthType: "password",
    monitorSysGenServerStatus: 1,
    monitorSysGenServerTags: "",
    monitorSysGenServerDesc: "",
    monitorSysGenServerCharset: "UTF-8",
    monitorSysGenServerTimeout: 30000,
    monitorSysGenServerWidth: 1024,
    monitorSysGenServerHeight: 768,
    monitorSysGenServerColorDepth: "24",
    monitorSysGenServerVncPassword: "",
    monitorSysGenServerReadOnly: 0,
    // 操作系统信息 - 确保所有字段都被重�?
    monitorSysGenServerOsType: "",
    monitorSysGenServerOsVersion: "",
    monitorSysGenServerOsArch: "x86_64", // 设置默认架构
    monitorSysGenServerOsCustom: "",
    // 是否本地服务�?
    monitorSysGenServerIsLocal: 0,
  });

  // 服务器设置已移至专门的配置页�?

  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// resetServerSetting函数已移除，服务器设置功能在专门的配置页面中

// 服务器设置相关函数已移至专门的服务器配置页面

// handleServerSettingSuccess函数已移除，配置功能在专门的服务器配置页面中

/**
 * 根据协议设置默认端口
 */
const setDefaultPort = () => {
  const portMap = {
    SSH: 22,
    RDP: 3389,
    VNC: 5900,
  };

  if (formData.monitorSysGenServerProtocol in portMap) {
    formData.monitorSysGenServerPort =
      portMap[formData.monitorSysGenServerProtocol as keyof typeof portMap];
  }
};

/**
 * 监听协议变化
 */
const handleProtocolChange = () => {
  setDefaultPort();
};

// handleReportMethodChange函数已移除，上报方式配置在专门的服务器配置页面中

/**
 * 处理操作系统类型变化
 */
const handleOsTypeChange = () => {
  // 根据操作系统类型设置默认架构和版本信�?
  const osType = formData.monitorSysGenServerOsType;
  const osTypeLower = osType.toLowerCase();

  // 设置默认架构
  if (
    !formData.monitorSysGenServerOsArch ||
    formData.monitorSysGenServerOsArch === ""
  ) {
    formData.monitorSysGenServerOsArch = osTypeLower.includes("macos")
      ? "aarch64"
      : "x86_64";
  }

  // 根据操作系统类型设置默认版本信息
  const osVersionMap = {
    "Windows Server": "2022",
    Windows: "11",
    Ubuntu: "22.04 LTS",
    CentOS: "8.5",
    Debian: "11",
    "Red Hat": "9.0",
    macOS: "13.0",
  };

  if (
    !formData.monitorSysGenServerOsVersion ||
    formData.monitorSysGenServerOsVersion === ""
  ) {
    // 查找匹配的操作系统版�?
    const matchedOs = Object.keys(osVersionMap).find((os) =>
      osTypeLower.includes(os.toLowerCase())
    );
    if (matchedOs) {
      formData.monitorSysGenServerOsVersion = osVersionMap[matchedOs];
    } else {
      formData.monitorSysGenServerOsVersion = "";
    }
  }

  // 处理自定义操作系统类�?
  if (osType === "Custom") {
    // 保持自定义名称不�?
    if (!formData.monitorSysGenServerOsCustom) {
      formData.monitorSysGenServerOsCustom = "";
    }
  } else {
    // 非自定义类型时清空自定义名称
    formData.monitorSysGenServerOsCustom = "";
  }

  // 如果从检测结果获取到了操作系统信息，优先使用检测结�?
  if (osInfo.value) {
    formData.monitorSysGenServerOsArch =
      osInfo.value.osArch || formData.monitorSysGenServerOsArch;
    if (osInfo.value.osVersion) {
      formData.monitorSysGenServerOsVersion = osInfo.value.osVersion;
    }
  }
};

/**
 * 检测服务器操作系统信息
 */
const detectServerInfo = async () => {
  if (!formData.monitorSysGenServerHost) {
    osInfo.value = null;
    return;
  }

  try {
    detectLoading.value = true;
    const res = await testLocalIpDetection(formData.monitorSysGenServerHost);
    if (res.code === "00000") {
      const result = res.data;
      const detectionResult = result.detectionResult;

      osInfo.value = {
        isLocal: detectionResult?.isLocal === 1,
        osType: detectionResult?.osType,
        osVersion: detectionResult?.osVersion,
        osArch: detectionResult?.osArch,
        ipAddresses: detectionResult?.ipAddresses
          ? JSON.parse(detectionResult.ipAddresses)
          : [],
      };

      // 如果是本机服务器，设置默认配�?
      if (osInfo.value.isLocal) {
        // 设置本地服务器默认在�?
        if (formData.monitorSysGenServerStatus !== 1) {
          formData.monitorSysGenServerStatus = 1;
          message.success("本地服务器已设置为在线状�?);
        }
      }
    } else {
      message.warning("服务器信息检测失�? " + res.msg);
      osInfo.value = null;
    }
  } catch (error) {
    console.error("检测服务器信息失败:", error);
    message.error("检测服务器信息失败，请检查网络连�?);
    osInfo.value = null;
  } finally {
    detectLoading.value = false;
  }
};

/**
 * 获取操作系统图标
 */
const getOsIcon = (osType: string) => {
  if (!osType) return "ri:computer-line";

  const osLower = osType.toLowerCase();

  // Windows 系列
  if (osLower.includes("windows")) {
    return "ri:windows-line";
  }

  // Ubuntu
  else if (osLower.includes("ubuntu")) {
    return "ri:ubuntu-line";
  }

  // CentOS
  else if (osLower.includes("centos")) {
    return "ri:centos-line";
  }

  // Red Hat
  else if (osLower.includes("rhel") || osLower.includes("red hat")) {
    return "ri:redhat-line";
  }

  // Debian
  else if (osLower.includes("debian")) {
    return "ri:debian-line";
  }

  // SUSE
  else if (
    osLower.includes("suse") ||
    osLower.includes("sles") ||
    osLower.includes("opensuse")
  ) {
    return "ri:suse-line";
  }

  // Alpine
  else if (osLower.includes("alpine")) {
    return "ri:mountain-line";
  }

  // Arch Linux
  else if (osLower.includes("arch")) {
    return "ri:archlinux-line";
  }

  // macOS
  else if (osLower.includes("mac") || osLower.includes("darwin")) {
    return "ri:apple-line";
  }

  // FreeBSD
  else if (osLower.includes("freebsd")) {
    return "ri:freebsd-line";
  }

  // 通用 Linux
  else if (osLower.includes("linux")) {
    return "ri:ubuntu-line";
  }

  // Unix
  else if (osLower.includes("unix")) {
    return "ri:terminal-line";
  }

  // 自定�?
  else if (osLower.includes("custom")) {
    return "ri:settings-line";
  }

  // 默认
  else {
    return "ri:computer-line";
  }
};

/**
 * 获取代理类型图标
 */
const getProxyTypeIcon = (proxyType: string) => {
  switch (proxyType) {
    case "HTTP":
      return "ri:global-line";
    case "SOCKS4":
      return "ri:shield-line";
    case "SOCKS5":
      return "ri:shield-check-line";
    case "GUACAMOLE":
      return "ri:remote-control-line";
    case "VNC":
      return "ri:computer-line";
    case "RDP":
      return "ri:windows-line";
    default:
      return "ri:server-line";
  }
};

/**
 * 获取代理状态文�?
 */
const getProxyStatusText = (status: number) => {
  switch (status) {
    case 0:
      return "离线";
    case 1:
      return "在线";
    case 2:
      return "连接�?;
    case 3:
      return "连接失败";
    default:
      return "未知";
  }
};

/**
 * 加载代理列表
 */
const loadProxyList = async () => {
  try {
    proxyListLoading.value = true;
    // 加载所有可用的代理列表供用户选择
    const result = await getServerProxyPageList({
      page: 1,
      pageSize: 1000, // 获取足够多的代理
      params: {
        status: 1, // 只获取启用的代理
      },
    });
    if (result.code === "00000") {
      proxyList.value = result.data?.data || [];
    } else {
      message.error(result.msg || "获取代理列表失败");
    }
  } catch (error) {
    console.error("加载代理列表失败:", error);
    message.error("加载代理列表失败");
  } finally {
    proxyListLoading.value = false;
  }
};

/**
 * 处理代理选择变化
 */
const handleProxyChange = (proxyId: number | null) => {
  if (proxyId) {
    selectedProxy.value =
      proxyList.value.find(
        (proxy) => proxy.monitorSysGenServerProxyId === proxyId
      ) || null;
  } else {
    selectedProxy.value = null;
  }
};

/**
 * 打开代理管理
 */
const openProxyManagement = () => {
  // 在新窗口中打开代理管理页面
  const routeUrl = "/server/proxy-management";
  window.open(routeUrl, "_blank");
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  try {
    // 表单验证
    const isValid = await formRef.value?.validate().catch((error: any) => {
      console.log("表单验证失败:", error);
      // 显示第一个验证错�?
      if (error && typeof error === "object") {
        const firstErrorField = Object.keys(error)[0];
        const firstError = error[firstErrorField];
        if (firstError && firstError.length > 0) {
          message.error(firstError[0].message);
        }
      }
      return false;
    });

    if (!isValid) {
      return;
    }

    loading.value = true;

    // 准备提交数据，确保数字类型正确和操作系统信息正确
    const submitData = {
      ...formData,
      // 确保数字类型字段正确
      monitorSysGenServerPort: Number(formData.monitorSysGenServerPort),
      monitorSysGenServerIsLocal: Number(formData.monitorSysGenServerIsLocal),
      monitorSysGenServerStatus: Number(
        formData.monitorSysGenServerStatus || 1
      ),
      // 处理操作系统信息
      monitorSysGenServerOsType:
        formData.monitorSysGenServerOsType === "Custom"
          ? formData.monitorSysGenServerOsCustom
          : formData.monitorSysGenServerOsType,
      monitorSysGenServerOsVersion: formData.monitorSysGenServerOsVersion || "",
      monitorSysGenServerOsArch: formData.monitorSysGenServerOsArch || "x86_64",
    };

    // 调试信息：打印提交的数据
    console.log("提交的服务器数据:", submitData);
    console.log("本地服务器标�?", submitData.monitorSysGenServerIsLocal);
    console.log("操作系统信息:", {
      osType: submitData.monitorSysGenServerOsType,
      osVersion: submitData.monitorSysGenServerOsVersion,
      osArch: submitData.monitorSysGenServerOsArch,
      osCustom: submitData.monitorSysGenServerOsCustom,
    });

    const res =
      mode.value === "add"
        ? await saveServer(submitData)
        : await updateServer(submitData);

    if (res.code === "00000") {
      message.success(mode.value === "add" ? "新增成功" : "保存成功");
      visible.value = false;
      emit("success");
    } else {
      // 显示具体的验证错误信�?
      const errorMessage = res.msg || "操作失败";
      message.error(errorMessage);
    }
  } catch (error) {
    console.error("保存服务器配置出�?", error);
    if (error !== false) {
      // 表单验证失败时不显示错误消息
      // 检查是否是网络错误或其他API错误
      if (
        error &&
        error.response &&
        error.response.data &&
        error.response.data.msg
      ) {
        message.error(error.response.data.msg);
      } else {
        message.error("操作异常，请稍后重试");
      }
    }
  } finally {
    loading.value = false;
  }
};

// 暴露方法
defineExpose({
  open,
  setData,
});
</script>

<style lang="scss" scoped>
// 隐藏滚动条的通用样式
.no-scrollbar {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */

  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
}

// 对话框整体样�?- 优化无滚动条版本
.server-edit-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    box-shadow:
      0 24px 48px rgba(0, 0, 0, 0.15),
      0 8px 24px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    max-height: 98vh;
    height: 98vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border: 1px solid rgba(255, 255, 255, 0.3);
    backdrop-filter: blur(20px);
    margin: 0 !important;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
    flex-shrink: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.98) 0%,
      rgba(248, 250, 252, 0.98) 100%
    );
    backdrop-filter: blur(12px);
    height: 60px;
    display: flex;
    align-items: center;
  }

  :deep(.el-dialog__body) {
    padding: 0;
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }

  :deep(.el-dialog__footer) {
    padding: 20px 24px;
    border-top: 1px solid rgba(226, 232, 240, 0.8);
    background: linear-gradient(
      135deg,
      rgba(248, 250, 252, 0.95) 0%,
      rgba(255, 255, 255, 0.95) 100%
    );
    backdrop-filter: blur(10px);
    flex-shrink: 0;
  }
}

// 自定义头部样�?
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  position: relative;
  overflow: hidden;

  // 装饰性光�?
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 60%
    );
    animation: shimmer 3s ease-in-out infinite;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
    z-index: 1;

    .header-icon {
      font-size: 28px;
      color: #fff;
      padding: 10px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .dialog-title {
      font-size: 20px;
      font-weight: 700;
      color: #fff;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      letter-spacing: 0.5px;
    }
  }

  .close-btn {
    padding: 8px;
    border-radius: 8px;
    transition: all 0.3s ease;
    color: rgba(255, 255, 255, 0.8);

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
      color: #fff;
      transform: rotate(90deg);
    }
  }
}

@keyframes shimmer {
  0%,
  100% {
    transform: translateX(-30%) translateY(-30%) rotate(0deg);
  }
  50% {
    transform: translateX(30%) translateY(30%) rotate(180deg);
  }
}

// 对话框内容区�?
.dialog-content {
  padding: 16px 20px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: transparent;
}

// 表单样式 - 优化无滚动条版本
.server-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  .form-row {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    min-height: 0;

    .form-column {
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 12px;

    .el-form-item__label {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      line-height: 1.4;
    }

    .el-form-item__content {
      line-height: 1.4;
    }
  }
}

// 表单行布局
.form-row {
  flex: 1;
  margin: 0 !important;
  display: flex;
  min-height: 0;
  gap: 12px;
}

// 表单列布局
.form-column {
  flex: 1;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

// 表单项样�?- 紧凑版本
.server-form {
  :deep(.el-form-item) {
    margin-bottom: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:last-child {
      margin-bottom: 0;
    }

    // 错误状态样�?
    &.is-error {
      .el-form-item__label {
        color: var(--el-color-danger);
        font-weight: 600;
      }

      .el-input__wrapper {
        border-color: var(--el-color-danger);
        box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
        background-color: rgba(254, 226, 226, 0.5);
        animation: shake 0.5s ease-in-out;
      }

      .el-select .el-input__wrapper {
        border-color: var(--el-color-danger);
        box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.2);
        background-color: rgba(254, 226, 226, 0.5);
      }
    }

    // 聚焦状态样�?
    &.is-focus {
      .el-form-item__label {
        color: var(--el-color-primary);
        transform: translateY(-1px);
        font-weight: 600;
      }
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 1.4;
    padding-bottom: 6px;
    transition: all 0.3s ease;
    position: relative;

    &::after {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--el-color-primary);
      transition: width 0.3s ease;
    }
  }

  // 错误消息样式
  :deep(.el-form-item__error) {
    font-size: 12px;
    color: var(--el-color-danger);
    padding-top: 4px;
    line-height: 1.4;
    font-weight: 500;
    animation: shake 0.3s ease-in-out;
  }

  // 输入框样�?- 紧凑版本
  :deep(.el-input__wrapper) {
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.04);
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.9) 0%,
      rgba(248, 250, 252, 0.9) 100%
    );
    backdrop-filter: blur(8px);
    padding: 0 10px;
    min-height: 32px;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(248, 250, 252, 0.95) 100%
      );
    }

    &.is-focus {
      border-color: var(--el-color-primary);
      box-shadow:
        0 0 0 3px rgba(64, 158, 255, 0.2),
        0 4px 16px rgba(0, 0, 0, 0.1);
      background: rgba(255, 255, 255, 0.98);
    }
  }

  // 输入框内部文本样�?
  :deep(.el-input__inner) {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    background: transparent;
    border: none;
    padding: 0;
  }

  // 选择器样�?
  :deep(.el-select) {
    .el-input__wrapper {
      &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }
    }

    .el-input__suffix {
      transition: transform 0.3s ease;
    }

    &.is-focus .el-input__suffix {
      transform: rotate(180deg);
    }
  }

  // 文本域样�?
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border: 2px solid var(--el-border-color-light);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    background: var(--el-bg-color-overlay);

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    &:focus {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 3px var(--el-color-primary-light-8);
    }
  }

  // 数字输入框样�?
  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      border-radius: 10px;
    }

    .el-input-number__decrease,
    .el-input-number__increase {
      border-radius: 6px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }
  }
}

// 动画效果
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

// 表单分组样式
.form-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(248, 250, 252, 0.9) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  padding: 12px;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.04),
    0 2px 8px rgba(0, 0, 0, 0.02);
  min-height: 0;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;

  &:hover {
    box-shadow:
      0 8px 24px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.04);
    transform: translateY(-1px);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(226, 232, 240, 0.5);
    flex-shrink: 0;

    .section-icon {
      font-size: 16px;
      color: var(--el-color-primary);
      padding: 6px;
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-color-primary-light-8) 100%
      );
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      letter-spacing: 0.5px;
    }
  }

  .section-content {
    flex: 1;
    overflow: visible;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
  }
}

// 协议选项样式
.protocol-option,
.auth-option,
.docker-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .iconify {
    font-size: 16px;
    color: var(--el-color-primary);
  }
}

// 服务器组选择样式
.group-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .iconify {
    font-size: 16px;
    flex-shrink: 0;
  }

  .group-name {
    flex: 1;
    font-size: 14px;
  }

  .default-tag {
    margin-left: auto;
    font-size: 12px;
  }
}

// 新建组选项样式
:deep(.create-group-option) {
  .el-select-dropdown__item {
    padding: 8px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:hover {
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-color-primary-light-8) 100%
      );
      color: var(--el-color-primary);
    }
  }
}

.create-group-option-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--el-color-primary);

  .iconify {
    font-size: 16px;
  }

  .create-text {
    font-size: 14px;
  }
}

// 分隔线样�?
:deep(.divider-option) {
  .el-select-dropdown__item {
    padding: 0;
    height: 1px;
    min-height: 1px;
    cursor: default;

    &:hover {
      background: transparent;
    }
  }
}

.option-divider {
  width: 100%;
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 4px 0;
}

// 空分组提示样�?
.empty-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
}

// Switch 组件美化样式
.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;

  :deep(.el-switch) {
    --el-switch-on-color: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    --el-switch-off-color: #dcdfe6;
    --el-switch-border-color: transparent;

    .el-switch__core {
      border-radius: 20px;
      height: 24px;
      min-width: 48px;
      border: 2px solid transparent;
      background: var(--el-switch-off-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
      }

      .el-switch__action {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--el-bg-color-overlay);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0;
          transition: all 0.3s ease;
        }
      }
    }

    &.is-checked {
      .el-switch__core {
        background: var(--el-switch-on-color);
        border-color: transparent;

        .el-switch__action {
          background: var(--el-bg-color-overlay);

          &::before {
            opacity: 0.2;
            background: #67c23a;
          }
        }
      }
    }

    .el-switch__label {
      font-size: 13px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      transition: color 0.3s ease;

      &.is-active {
        color: var(--el-color-success);
        font-weight: 600;
      }
    }

    // 禁用状�?
    &.is-disabled {
      .el-switch__core {
        opacity: 0.6;
        cursor: not-allowed;

        &:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transform: none;
        }
      }
    }
  }
}

// 开关包装器
.switch-wrapper {
  display: flex;
  align-items: center;
  height: 40px;
}

// 底部按钮区域 - 美化版本
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 24px !important;
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.8) 0%,
    rgba(241, 245, 249, 0.95) 100%
  );
  border-top: 1px solid rgba(226, 232, 240, 0.6);

  .footer-tips {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    .tip-icon {
      color: var(--el-color-info);
    }
  }

  .footer-right {
    display: flex;
    gap: 12px;
  }

  .cancel-btn {
    border-radius: 10px;
    font-weight: 500;
    padding: 10px 24px;
    border: 1px solid #e2e8f0;
    background: #fff;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      border-color: #cbd5e1;
      background: #f8fafc;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
  }

  .submit-btn {
    border-radius: 10px;
    font-weight: 600;
    padding: 10px 28px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: linear-gradient(135deg, #7c8ff0 0%, #8b5fb8 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }

    &:active {
      transform: translateY(0);
    }
  }

  .el-button {
    border-radius: 10px;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 10px 20px;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.el-button--primary {
      background: linear-gradient(
        135deg,
        var(--el-color-primary) 0%,
        var(--el-color-primary-dark-2) 100%
      );
      border: none;

      &:hover {
        background: linear-gradient(
          135deg,
          var(--el-color-primary-light-3) 0%,
          var(--el-color-primary) 100%
        );
      }
    }

    &.el-button--success {
      &.is-plain {
        &:hover {
          background-color: var(--el-color-success);
          border-color: var(--el-color-success);
          color: var(--el-text-color-primary);
        }
      }
    }
  }
}

// 响应式设�?
@media (max-width: 1600px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 96% !important;
      height: 98vh !important;
    }
  }
}

@media (max-width: 1400px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 98% !important;
      height: 98vh !important;
    }
  }

  .dialog-content {
    padding: 12px 16px;
  }

  .form-section {
    padding: 8px;

    .section-header {
      margin-bottom: 8px;

      .section-title {
        font-size: 12px;
      }
    }
  }

  .server-form {
    :deep(.el-form-item) {
      margin-bottom: 8px;
    }
  }
}

@media (max-width: 1200px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 98% !important;
      max-height: 90vh;
      top: 2vh !important;
    }
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .form-column {
    flex: none;
    margin-bottom: 0;
    min-height: auto;
  }

  .dialog-content {
    padding: 12px 16px;
  }

  .form-section {
    min-height: auto;
    flex: none;

    .section-content {
      overflow: visible;
      flex: none;

      &::after {
        display: none;
      }
    }
  }
}

@media (max-width: 768px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 100% !important;
      height: 100vh !important;
      margin: 0;
      top: 0 !important;
      border-radius: 0;
    }
  }

  .dialog-content {
    padding: 8px 10px;
  }

  .form-section {
    padding: 6px;
    border-radius: 8px;
    margin-bottom: 6px;

    .section-header {
      margin-bottom: 6px;
      padding-bottom: 3px;

      .section-icon {
        font-size: 12px;
        padding: 3px;
      }

      .section-title {
        font-size: 11px;
        font-weight: 600;
      }
    }

    .section-content {
      gap: 6px;
    }
  }

  .server-form {
    :deep(.el-form-item) {
      margin-bottom: 10px;
    }

    :deep(.el-form-item__label) {
      font-size: 11px;
      font-weight: 600;
    }

    :deep(.el-input__wrapper) {
      min-height: 32px;
      border-radius: 8px;
    }

    :deep(.el-input__inner) {
      font-size: 12px;
    }
  }
}

@media (max-width: 480px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 100% !important;
      margin: 0;
      top: 0 !important;
      max-height: 100vh;
      border-radius: 0;
    }

    :deep(.el-dialog__footer) {
      padding: 12px 16px;
    }
  }

  .dialog-content {
    padding: 8px 10px;
  }

  .form-section {
    padding: 6px;
    margin-bottom: 6px;

    .section-header {
      margin-bottom: 6px;

      .section-title {
        font-size: 11px;
      }

      .section-icon {
        font-size: 12px;
        padding: 3px;
      }
    }
  }

  .server-form {
    :deep(.el-form-item) {
      margin-bottom: 8px;
    }

    :deep(.el-form-item__label) {
      font-size: 10px;
      font-weight: 600;
    }

    :deep(.el-input__wrapper) {
      min-height: 28px;
      padding: 0 8px;
    }

    :deep(.el-input__inner) {
      font-size: 11px;
    }
  }
  .dialog-content {
    padding: 12px;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    padding: 12px !important;

    .footer-left,
    .footer-right {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .footer-right {
      flex-direction: row-reverse;
    }

    .el-button {
      padding: 8px 16px;
      font-size: 13px;
    }
  }
}

// 服务器类型和操作系统信息样式
.server-type-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.os-info-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.os-info-item {
  display: flex;
  align-items: center;
}

.os-info-tip {
  display: block;
  margin-top: 4px;
  font-style: italic;
}

// 操作系统选择容器样式
.os-selection-container {
  .os-type-selection {
    margin-bottom: 16px;
  }

  .custom-os-input {
    margin-top: 12px;
    margin-bottom: 16px;
  }

  .os-details-container {
    margin-bottom: 16px;
    padding: 12px;
    background: var(--el-fill-color-extra-light);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);

    :deep(.el-form-item) {
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.el-form-item__label) {
      font-size: 12px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }
  }

  .detected-os-info {
    margin-bottom: 16px;
    padding: 12px;
    background: linear-gradient(
      135deg,
      var(--el-color-success-light-9) 0%,
      var(--el-fill-color-extra-light) 100%
    );
    border: 1px solid var(--el-color-success-light-7);
    border-radius: 8px;

    .detected-os-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      .detected-icon {
        font-size: 16px;
        color: var(--el-color-success);
        margin-right: 8px;
      }

      .detected-title {
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-right: 8px;
      }
    }

    .detected-os-content {
      .detected-item {
        display: flex;
        align-items: center;
        margin-bottom: 6px;

        &:last-child {
          margin-bottom: 0;
        }

        .detected-label {
          font-size: 12px;
          color: var(--el-text-color-regular);
          margin-right: 8px;
          min-width: 80px;
        }
      }
    }

    .detected-tip {
      display: block;
      margin-top: 8px;
      font-style: italic;
      font-size: 12px;
    }
  }

  .os-tips {
    :deep(.el-alert) {
      border-radius: 8px;

      .el-alert__title {
        font-size: 13px;
        font-weight: 600;
      }

      .el-alert__content {
        font-size: 12px;
        line-height: 1.4;
      }
    }
  }
}

// 操作系统选项样式
.os-option,
.arch-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .os-option-icon {
    font-size: 16px;
    color: var(--el-color-primary);
  }

  span {
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}

// 动画效果 - 增强版本
.server-edit-dialog {
  :deep(.el-dialog) {
    animation: dialogSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }

  // 添加背景动画
  &::before {
    content: "";
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      rgba(64, 158, 255, 0.1) 0%,
      rgba(103, 194, 58, 0.1) 25%,
      rgba(245, 108, 108, 0.1) 50%,
      rgba(230, 162, 60, 0.1) 75%,
      rgba(64, 158, 255, 0.1) 100%
    );
    background-size: 400% 400%;
    animation: gradientShift 8s ease infinite;
    pointer-events: none;
    z-index: -1;
  }
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
    filter: blur(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

// 表单项动�?- 增强版本
.form-section {
  animation: sectionFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);

  // 添加微交互效�?
  &:hover {
    .section-header .section-icon {
      transform: scale(1.1) rotate(5deg);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
}

// 输入框聚焦动�?
.server-form {
  :deep(.el-input__wrapper) {
    &.is-focus {
      animation: inputFocus 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
}

@keyframes sectionFadeIn {
  from {
    opacity: 0;
    transform: translateY(15px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes inputFocus {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
  }
}

// 操作系统信息样式 - 简化版�?
.os-info-section {
  margin-top: 12px;
  padding: 12px;
  background: linear-gradient(
    135deg,
    var(--el-color-success-light-9) 0%,
    var(--el-fill-color-extra-light) 100%
  );
  border: 1px solid var(--el-color-success-light-7);
  border-radius: 8px;

  &.compact {
    padding: 10px;
    margin-top: 8px;
  }

  .os-info-header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;

    .os-icon {
      font-size: 14px;
      color: var(--el-color-success);
      margin-right: 6px;
    }

    .os-title {
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-right: 6px;
      font-size: 12px;
    }
  }

  .os-info-content {
    .os-summary {
      display: flex;
      align-items: center;
      gap: 8px;

      .os-text {
        font-size: 13px;
        color: var(--el-text-color-primary);
        font-weight: 500;
      }

      .arch-tag {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 6px;
      }
    }
  }
}

// 上报方式选项样式
.option-content {
  display: flex;
  align-items: center;
  width: 100%;
}

// 代理选择容器样式
.proxy-selection-container {
  .proxy-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }
}

// 代理选项样式
.proxy-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .proxy-option-icon {
    font-size: 16px;
    color: var(--el-color-primary);
    flex-shrink: 0;
  }

  .proxy-name {
    font-weight: 500;
    color: var(--el-text-color-primary);
    flex-shrink: 0;
  }

  .proxy-address {
    font-size: 12px;
    color: var(--el-text-color-regular);
    margin-left: auto;
    flex-shrink: 0;
  }
}

// 选中代理信息样式
.selected-proxy-info {
  margin-top: 12px;

  .proxy-info-details {
    .proxy-info-item {
      display: flex;
      align-items: center;
      margin-bottom: 6px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        font-size: 12px;
        color: var(--el-text-color-regular);
        margin-right: 8px;
        min-width: 40px;
      }

      .latency {
        font-size: 11px;
        color: var(--el-text-color-placeholder);
        margin-left: 4px;
      }
    }
  }
}

// 新增样式
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-primary);
  margin-top: 4px;
  line-height: 1.4;
}

.help-icon {
  margin-left: 8px;
  color: var(--el-text-color-primary);
  cursor: help;

  &:hover {
    color: #409eff;
  }
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
