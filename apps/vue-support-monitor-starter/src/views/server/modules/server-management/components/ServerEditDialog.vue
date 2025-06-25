<template>
  <el-dialog v-model="visible" :title="mode === 'add' ? '新增服务器' : '编辑服务器'" width="90%" :close-on-click-modal="false"
    destroy-on-close class="server-edit-dialog" align-center top="5vh">
    <!-- 自定义头部 -->
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog-header">
        <div class="header-left">
          <IconifyIconOnline :icon="mode === 'add' ? 'ri:add-circle-line' : 'ri:edit-line'" class="header-icon" />
          <span :id="titleId" :class="titleClass" class="dialog-title">
            {{ mode === 'add' ? '新增服务器' : '编辑服务器' }}
          </span>
        </div>
      </div>
    </template>

    <div class="dialog-content">
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="100px" label-position="left"
        class="server-form">
        <!-- 使用三列布局来节省空间 -->
        <el-row :gutter="24" class="form-row">
          <!-- 左列：基本信息 -->
          <el-col :span="8" class="form-column">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline icon="ri:information-line" class="section-icon" />
                <span class="section-title">基本信息</span>
              </div>
              <div class="section-content">
                <el-form-item label="服务器名称" prop="monitorSysGenServerName">
                  <el-input v-model="formData.monitorSysGenServerName" placeholder="请输入服务器名称" clearable>
                    <template #prefix>
                      <IconifyIconOnline icon="ri:server-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <!-- 操作系统信息展示 -->
                <div v-if="osInfo && osInfo.isLocal" class="os-info-section">
                  <div class="os-info-header">
                    <IconifyIconOnline icon="ri:computer-line" class="os-icon" />
                    <span class="os-title">操作系统信息</span>
                    <el-tag type="success" size="small" effect="light">自动检测</el-tag>
                  </div>
                  <div class="os-info-content">
                    <div class="os-item">
                      <span class="os-label">系统类型:</span>
                      <span class="os-value">{{ osInfo.osType || '未知' }}</span>
                    </div>
                    <div class="os-item">
                      <span class="os-label">系统版本:</span>
                      <span class="os-value">{{ osInfo.osVersion || '未知' }}</span>
                    </div>
                    <div class="os-item">
                      <span class="os-label">系统架构:</span>
                      <span class="os-value">{{ osInfo.osArch || '未知' }}</span>
                    </div>
                    <div class="os-item">
                      <span class="os-label">本机IP:</span>
                      <div class="ip-list">
                        <el-tag v-for="ip in osInfo.ipAddresses" :key="ip" size="small" type="info" effect="plain"
                          class="ip-tag">
                          {{ ip }}
                        </el-tag>
                      </div>
                    </div>
                  </div>
                </div>

                <el-form-item label="协议类型" prop="monitorSysGenServerProtocol">
                  <el-select v-model="formData.monitorSysGenServerProtocol" placeholder="选择协议类型" style="width: 100%"
                    @change="handleProtocolChange">
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
                  <el-input v-model="formData.monitorSysGenServerHost" placeholder="请输入IP地址或域名" clearable
                    @blur="detectServerInfo">
                    <template #prefix>
                      <IconifyIconOnline icon="ri:global-line" />
                    </template>
                    <template #suffix>
                      <el-tooltip content="自动检测操作系统信息" placement="top">
                        <el-button type="text" size="small" @click="detectServerInfo" :loading="detectLoading">
                          <IconifyIconOnline icon="ri:refresh-line" />
                        </el-button>
                      </el-tooltip>
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="端口" prop="monitorSysGenServerPort">
                  <el-input-number v-model="formData.monitorSysGenServerPort" :min="1" :max="65535" placeholder="端口号"
                    style="width: 100%" />
                </el-form-item>

                <el-form-item label="标签" prop="monitorSysGenServerTags">
                  <el-input v-model="formData.monitorSysGenServerTags" placeholder="多个标签用逗号分隔" clearable>
                    <template #prefix>
                      <IconifyIconOnline icon="ri:price-tag-3-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <!-- 服务器类型和操作系统信息 -->
                <el-form-item label="服务器类型">
                  <div class="server-type-container">
                    <el-tag :type="formData.monitorSysGenServerIsLocal === 1 ? 'success' : 'info'" size="small"
                      effect="light">
                      <IconifyIconOnline
                        :icon="formData.monitorSysGenServerIsLocal === 1 ? 'ri:home-line' : 'ri:cloud-line'"
                        class="mr-1" />
                      {{ formData.monitorSysGenServerIsLocal === 1 ? '本地服务器' : '远程服务器' }}
                    </el-tag>
                    <el-text size="small" type="info" class="ml-2">
                      (自动检测，基于IP地址判断)
                    </el-text>
                  </div>
                </el-form-item>

                <!-- 操作系统信息 -->
                <el-form-item label="操作系统" prop="monitorSysGenServerOsType">
                  <div class="os-selection-container">
                    <!-- 操作系统类型选择 -->
                    <div class="os-type-selection">
                      <el-select v-model="formData.monitorSysGenServerOsType" placeholder="选择操作系统类型" style="width: 100%"
                        @change="handleOsTypeChange"
                        :disabled="formData.monitorSysGenServerIsLocal === 1 && osInfo?.osType" filterable>
                        <el-option-group label="Windows 系列">
                          <el-option label="Windows Server 2022" value="Windows Server 2022">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:windows-line" class="os-option-icon" />
                              <span>Windows Server 2022</span>
                            </div>
                          </el-option>
                          <el-option label="Windows Server 2019" value="Windows Server 2019">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:windows-line" class="os-option-icon" />
                              <span>Windows Server 2019</span>
                            </div>
                          </el-option>
                          <el-option label="Windows Server 2016" value="Windows Server 2016">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:windows-line" class="os-option-icon" />
                              <span>Windows Server 2016</span>
                            </div>
                          </el-option>
                          <el-option label="Windows 11" value="Windows 11">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:windows-line" class="os-option-icon" />
                              <span>Windows 11</span>
                            </div>
                          </el-option>
                          <el-option label="Windows 10" value="Windows 10">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:windows-line" class="os-option-icon" />
                              <span>Windows 10</span>
                            </div>
                          </el-option>
                        </el-option-group>

                        <el-option-group label="Linux 发行版">
                          <el-option label="Ubuntu 22.04 LTS" value="Ubuntu 22.04 LTS">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:ubuntu-line" class="os-option-icon" />
                              <span>Ubuntu 22.04 LTS</span>
                            </div>
                          </el-option>
                          <el-option label="Ubuntu 20.04 LTS" value="Ubuntu 20.04 LTS">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:ubuntu-line" class="os-option-icon" />
                              <span>Ubuntu 20.04 LTS</span>
                            </div>
                          </el-option>
                          <el-option label="CentOS 8" value="CentOS 8">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:centos-line" class="os-option-icon" />
                              <span>CentOS 8</span>
                            </div>
                          </el-option>
                          <el-option label="CentOS 7" value="CentOS 7">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:centos-line" class="os-option-icon" />
                              <span>CentOS 7</span>
                            </div>
                          </el-option>
                          <el-option label="Red Hat Enterprise Linux 9" value="RHEL 9">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:redhat-line" class="os-option-icon" />
                              <span>Red Hat Enterprise Linux 9</span>
                            </div>
                          </el-option>
                          <el-option label="Red Hat Enterprise Linux 8" value="RHEL 8">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:redhat-line" class="os-option-icon" />
                              <span>Red Hat Enterprise Linux 8</span>
                            </div>
                          </el-option>
                          <el-option label="Debian 12" value="Debian 12">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:debian-line" class="os-option-icon" />
                              <span>Debian 12</span>
                            </div>
                          </el-option>
                          <el-option label="Debian 11" value="Debian 11">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:debian-line" class="os-option-icon" />
                              <span>Debian 11</span>
                            </div>
                          </el-option>
                          <el-option label="SUSE Linux Enterprise Server 15" value="SLES 15">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:suse-line" class="os-option-icon" />
                              <span>SUSE Linux Enterprise Server 15</span>
                            </div>
                          </el-option>
                          <el-option label="openSUSE Leap 15" value="openSUSE Leap 15">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:opensuse-line" class="os-option-icon" />
                              <span>openSUSE Leap 15</span>
                            </div>
                          </el-option>
                          <el-option label="Alpine Linux" value="Alpine Linux">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:mountain-line" class="os-option-icon" />
                              <span>Alpine Linux</span>
                            </div>
                          </el-option>
                          <el-option label="Arch Linux" value="Arch Linux">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:archlinux-line" class="os-option-icon" />
                              <span>Arch Linux</span>
                            </div>
                          </el-option>
                        </el-option-group>

                        <el-option-group label="Unix 系列">
                          <el-option label="macOS Sonoma" value="macOS Sonoma">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:apple-line" class="os-option-icon" />
                              <span>macOS Sonoma</span>
                            </div>
                          </el-option>
                          <el-option label="macOS Ventura" value="macOS Ventura">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:apple-line" class="os-option-icon" />
                              <span>macOS Ventura</span>
                            </div>
                          </el-option>
                          <el-option label="FreeBSD 14" value="FreeBSD 14">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:freebsd-line" class="os-option-icon" />
                              <span>FreeBSD 14</span>
                            </div>
                          </el-option>
                          <el-option label="FreeBSD 13" value="FreeBSD 13">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:freebsd-line" class="os-option-icon" />
                              <span>FreeBSD 13</span>
                            </div>
                          </el-option>
                        </el-option-group>

                        <el-option-group label="其他">
                          <el-option label="自定义" value="Custom">
                            <div class="os-option">
                              <IconifyIconOnline icon="ri:settings-line" class="os-option-icon" />
                              <span>自定义</span>
                            </div>
                          </el-option>
                        </el-option-group>
                      </el-select>
                    </div>

                    <!-- 自定义操作系统输入 -->
                    <div v-if="formData.monitorSysGenServerOsType === 'Custom'" class="custom-os-input">
                      <el-input v-model="formData.monitorSysGenServerOsCustom" placeholder="请输入自定义操作系统名称" clearable>
                        <template #prefix>
                          <IconifyIconOnline icon="ri:edit-line" />
                        </template>
                      </el-input>
                    </div>

                    <!-- 当前检测到的操作系统信息显示 -->
                    <div v-if="formData.monitorSysGenServerIsLocal === 1 && osInfo" class="detected-os-info">
                      <div class="detected-os-header">
                        <IconifyIconOnline icon="ri:eye-line" class="detected-icon" />
                        <span class="detected-title">自动检测信息</span>
                        <el-tag type="success" size="small" effect="light">已检测</el-tag>
                      </div>
                      <div class="detected-os-content">
                        <div class="detected-item">
                          <span class="detected-label">检测到的系统:</span>
                          <el-tag type="primary" size="small" effect="light">
                            <IconifyIconOnline :icon="getOsIcon(osInfo.osType)" class="mr-1" />
                            {{ osInfo.osType || '未知' }}
                          </el-tag>
                        </div>
                        <div class="detected-item" v-if="osInfo.osVersion">
                          <span class="detected-label">检测到的版本:</span>
                          <el-tag type="info" size="small" effect="light">
                            {{ osInfo.osVersion }}
                          </el-tag>
                        </div>
                        <div class="detected-item" v-if="osInfo.osArch">
                          <span class="detected-label">检测到的架构:</span>
                          <el-tag type="warning" size="small" effect="light">
                            {{ osInfo.osArch }}
                          </el-tag>
                        </div>
                      </div>
                      <el-text size="small" type="info" class="detected-tip">
                        本地服务器信息已自动检测，如需修改请手动选择
                      </el-text>
                    </div>

                    <!-- 操作提示 -->
                    <div class="os-tips">
                      <el-alert v-if="formData.monitorSysGenServerIsLocal === 0" title="远程服务器操作系统信息" type="info"
                        effect="light" :closable="false" show-icon>
                        <template #default>
                          请手动选择远程服务器的操作系统类型，这将影响监控指标的收集方式
                        </template>
                      </el-alert>

                      <el-alert v-else title="本地服务器操作系统信息" type="success" effect="light" :closable="false" show-icon>
                        <template #default>
                          本地服务器操作系统信息已自动检测，您也可以手动调整
                        </template>
                      </el-alert>
                    </div>
                  </div>
                </el-form-item>
                <!-- 操作系统详细信息 -->
                <el-form-item label="系统架构">
                  <el-select v-model="formData.monitorSysGenServerOsArch" placeholder="选择架构" style="width: 100%"
                    :disabled="formData.monitorSysGenServerIsLocal === 1 && osInfo?.osArch">
                    <el-option label="x86_64 (64位)" value="x86_64">
                      <div class="arch-option">
                        <IconifyIconOnline icon="ri:cpu-line" />
                        <span>x86_64 (64位)</span>
                      </div>
                    </el-option>
                    <el-option label="aarch64 (ARM64)" value="aarch64">
                      <div class="arch-option">
                        <IconifyIconOnline icon="ri:cpu-line" />
                        <span>aarch64 (ARM64)</span>
                      </div>
                    </el-option>
                    <el-option label="i386 (32位)" value="i386">
                      <div class="arch-option">
                        <IconifyIconOnline icon="ri:cpu-line" />
                        <span>i386 (32位)</span>
                      </div>
                    </el-option>
                    <el-option label="armv7l (ARM32)" value="armv7l">
                      <div class="arch-option">
                        <IconifyIconOnline icon="ri:cpu-line" />
                        <span>armv7l (ARM32)</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <!-- 额外IP地址配置 -->
                <el-form-item label="额外IP地址">
                  <div class="extra-ips-container">
                    <div v-for="(ip, index) in formData.monitorSysGenServerIpAddresses" :key="index"
                      class="extra-ip-item">
                      <el-input v-model="formData.monitorSysGenServerIpAddresses[index]" placeholder="请输入IP地址" clearable>
                        <template #prefix>
                          <IconifyIconOnline icon="ri:global-line" />
                        </template>
                      </el-input>
                      <el-button type="danger" size="small" text @click="removeExtraIp(index)"
                        :disabled="formData.monitorSysGenServerIpAddresses.length <= 1">
                        <IconifyIconOnline icon="ri:delete-bin-line" />
                      </el-button>
                    </div>
                    <el-button type="primary" size="small" text @click="addExtraIp" class="add-ip-btn">
                      <IconifyIconOnline icon="ri:add-line" class="mr-1" />
                      添加IP
                    </el-button>
                  </div>
                </el-form-item>
              </div>
            </div>
          </el-col>

          <!-- 中列：认证信息 -->
          <el-col :span="8" class="form-column">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline icon="ri:shield-user-line" class="section-icon" />
                <span class="section-title">认证信息</span>
              </div>
              <div class="section-content">
                <el-form-item label="用户名" prop="monitorSysGenServerUsername">
                  <el-input v-model="formData.monitorSysGenServerUsername" placeholder="请输入用户名" clearable>
                    <template #prefix>
                      <IconifyIconOnline icon="ri:user-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="认证方式" prop="monitorSysGenServerAuthType">
                  <el-select v-model="formData.monitorSysGenServerAuthType" placeholder="选择认证方式" style="width: 100%">
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

                <el-form-item v-if="formData.monitorSysGenServerAuthType === 'password'" label="密码"
                  prop="monitorSysGenServerPassword">
                  <el-input v-model="formData.monitorSysGenServerPassword" type="password" placeholder="请输入密码"
                    show-password clearable>
                    <template #prefix>
                      <IconifyIconOnline icon="ri:lock-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item v-if="formData.monitorSysGenServerAuthType === 'key'" label="私钥"
                  prop="monitorSysGenServerPrivateKey">
                  <el-input v-model="formData.monitorSysGenServerPrivateKey" type="textarea" :rows="3"
                    placeholder="请输入SSH私钥内容" />
                </el-form-item>

                <!-- 协议特定配置 -->
                <template v-if="formData.monitorSysGenServerProtocol === 'SSH'">
                  <el-form-item label="字符编码">
                    <el-select v-model="formData.monitorSysGenServerCharset" placeholder="选择字符编码" style="width: 100%">
                      <el-option label="UTF-8" value="UTF-8" />
                      <el-option label="GBK" value="GBK" />
                      <el-option label="GB2312" value="GB2312" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="连接超时">
                    <el-input-number v-model="formData.monitorSysGenServerTimeout" :min="1000" :max="60000" :step="1000"
                      placeholder="毫秒" style="width: 100%" />
                  </el-form-item>
                </template>

                <template v-if="formData.monitorSysGenServerProtocol === 'VNC'">
                  <el-form-item label="VNC密码">
                    <el-input v-model="formData.monitorSysGenServerVncPassword" type="password" placeholder="请输入VNC密码"
                      show-password clearable>
                      <template #prefix>
                        <IconifyIconOnline icon="ri:lock-line" />
                      </template>
                    </el-input>
                  </el-form-item>
                </template>
              </div>
            </div>
          </el-col>

          <!-- 右列：配置选项 -->
          <el-col :span="8" class="form-column">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline icon="ri:settings-3-line" class="section-icon" />
                <span class="section-title">配置选项</span>
              </div>
              <div class="section-content">
                <el-form-item label="状态">
                  <div class="switch-wrapper">
                    <el-switch v-model="formData.monitorSysGenServerStatus" :active-value="1" :inactive-value="0"
                      active-text="启用" inactive-text="禁用" />
                  </div>
                </el-form-item>

                <el-form-item label="启用监控">
                  <div class="switch-wrapper">
                    <el-switch v-model="formData.monitorSysGenServerMonitorEnabled" :active-value="1"
                      :inactive-value="0" active-text="开启" inactive-text="关闭" />
                  </div>
                </el-form-item>

                <el-form-item label="指标支持">
                  <div class="switch-wrapper">
                    <el-switch v-model="formData.monitorSysGenServerMetricsSupport" :active-value="true"
                      :inactive-value="false" active-text="支持" inactive-text="不支持" />
                  </div>
                </el-form-item>

                <el-form-item label="数据上报">
                  <div class="switch-wrapper">
                    <el-switch v-model="formData.monitorSysGenServerReportEnabled" :active-value="1" :inactive-value="0"
                      active-text="启用" inactive-text="禁用" />
                    <el-tooltip content="是否需要上报服务器数据" placement="top">
                      <IconifyIconOnline icon="ri:question-line" class="ml-2 text-gray-400" />
                    </el-tooltip>
                  </div>
                </el-form-item>

                <el-form-item label="上报方式" v-if="formData.monitorSysGenServerReportEnabled">
                  <el-select v-model="formData.monitorSysGenServerDataReportMethod" placeholder="选择数据上报方式"
                    style="width: 100%" @change="handleReportMethodChange">
                    <el-option label="不支持上报" value="NONE" />
                    <!-- 本机服务器显示本地上报，远程服务器显示接口上报 -->
                    <el-option v-if="formData.monitorSysGenServerIsLocal === 1" label="本地上报" value="LOCAL">
                      <div class="option-content">
                        <span>本地上报</span>
                        <el-tag type="success" size="small" effect="light" class="ml-2">推荐</el-tag>
                      </div>
                    </el-option>
                    <el-option v-if="formData.monitorSysGenServerIsLocal !== 1 " label="接口上报" value="API" />
                    <el-option label="Prometheus" value="PROMETHEUS" />
                  </el-select>
                </el-form-item>

                <!-- Prometheus配置 -->
                <template v-if="formData.monitorSysGenServerDataReportMethod === 'PROMETHEUS'">
                  <el-form-item label="Prometheus地址" prop="monitorSysGenServerPrometheusHost">
                    <el-input v-model="formData.monitorSysGenServerPrometheusHost" placeholder="请输入Prometheus服务器地址"
                      clearable>
                      <template #prefix>
                        <IconifyIconOnline icon="ri:server-line" />
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="Prometheus端口" prop="monitorSysGenServerPrometheusPort">
                    <el-input-number v-model="formData.monitorSysGenServerPrometheusPort" :min="1" :max="65535"
                      placeholder="端口号" style="width: 100%" />
                  </el-form-item>
                </template>

                <el-form-item label="代理配置">
                  <div class="proxy-selection-container">
                    <el-select v-model="formData.monitorSysGenServerProxyId" placeholder="选择代理配置" style="width: 100%"
                      clearable filterable @change="handleProxyChange" :loading="proxyListLoading">
                      <el-option label="无代理" :value="null">
                        <div class="proxy-option">
                          <IconifyIconOnline icon="ri:close-line" class="proxy-option-icon" />
                          <span>无代理</span>
                        </div>
                      </el-option>
                      <el-option-group v-for="group in groupedProxyList" :key="group.type" :label="group.label">
                        <el-option v-for="proxy in group.proxies" :key="proxy.proxyId" :label="proxy.proxyName"
                          :value="proxy.proxyId">
                          <div class="proxy-option">
                            <IconifyIconOnline :icon="getProxyTypeIcon(proxy.proxyType)" class="proxy-option-icon" />
                            <span class="proxy-name">{{ proxy.proxyName }}</span>
                            <span class="proxy-address">{{ proxy.proxyHost }}:{{ proxy.proxyPort }}</span>
                            <el-tag :type="proxy.proxyStatus === 1 ? 'success' : 'danger'" size="small" effect="light"
                              v-if="proxy.proxyStatus !== undefined">
                              {{ proxy.proxyStatus === 1 ? '正常' : '异常' }}
                            </el-tag>
                          </div>
                        </el-option>
                      </el-option-group>
                    </el-select>

                    <!-- 代理管理按钮 -->
                    <div class="proxy-actions">
                      <el-tooltip content="刷新代理列表" placement="top">
                        <el-button size="small" text @click="loadProxyList" :loading="proxyListLoading">
                          <IconifyIconOnline icon="ri:refresh-line" />
                        </el-button>
                      </el-tooltip>
                      <el-tooltip content="代理管理" placement="top">
                        <el-button size="small" text @click="openProxyManagement">
                          <IconifyIconOnline icon="ri:settings-line" />
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </el-form-item>

                <!-- 选中代理的详细信息显示 -->
                <div v-if="selectedProxy" class="selected-proxy-info">
                  <el-alert :title="`已选择代理: ${selectedProxy.proxyName}`" type="info" effect="light" :closable="false"
                    show-icon>
                    <template #default>
                      <div class="proxy-info-details">
                        <div class="proxy-info-item">
                          <span class="label">类型:</span>
                          <el-tag size="small" effect="light">{{ selectedProxy.proxyType }}</el-tag>
                        </div>
                        <div class="proxy-info-item">
                          <span class="label">地址:</span>
                          <span>{{ selectedProxy.proxyHost }}:{{ selectedProxy.proxyPort }}</span>
                        </div>
                        <div class="proxy-info-item" v-if="selectedProxy.proxyDesc">
                          <span class="label">描述:</span>
                          <span>{{ selectedProxy.proxyDesc }}</span>
                        </div>
                        <div class="proxy-info-item" v-if="selectedProxy.proxyStatus !== undefined">
                          <span class="label">状态:</span>
                          <el-tag :type="selectedProxy.proxyStatus === 1 ? 'success' : 'danger'" size="small"
                            effect="light">
                            {{ selectedProxy.proxyStatus === 1 ? '连接正常' : '连接异常' }}
                          </el-tag>
                        </div>
                      </div>
                    </template>
                  </el-alert>
                </div>

                <!-- RDP特有配置 -->
                <template v-if="formData.monitorSysGenServerProtocol === 'RDP'">
                  <el-form-item label="屏幕宽度">
                    <el-input-number v-model="formData.monitorSysGenServerWidth" :min="800" :max="1920" placeholder="像素"
                      style="width: 100%" />
                  </el-form-item>

                  <el-form-item label="屏幕高度">
                    <el-input-number v-model="formData.monitorSysGenServerHeight" :min="600" :max="1080"
                      placeholder="像素" style="width: 100%" />
                  </el-form-item>

                  <el-form-item label="颜色深度">
                    <el-select v-model="formData.monitorSysGenServerColorDepth" placeholder="选择颜色深度"
                      style="width: 100%">
                      <el-option label="16位" value="16" />
                      <el-option label="24位" value="24" />
                      <el-option label="32位" value="32" />
                    </el-select>
                  </el-form-item>
                </template>

                <!-- VNC特有配置 -->
                <template v-if="formData.monitorSysGenServerProtocol === 'VNC'">
                  <el-form-item label="只读模式">
                    <div class="switch-wrapper">
                      <el-switch v-model="formData.monitorSysGenServerReadOnly" :active-value="1" :inactive-value="0"
                        active-text="是" inactive-text="否" />
                    </div>
                  </el-form-item>
                </template>

                <!-- Docker配置 -->
                <el-form-item label="Docker支持">
                  <div class="switch-wrapper">
                    <el-switch v-model="formData.monitorSysGenServerDockerEnabled" :active-value="1" :inactive-value="0"
                      active-text="支持" inactive-text="不支持" />
                    <el-tooltip content="是否支持Docker容器管理" placement="top">
                      <IconifyIconOnline icon="ri:question-line" class="ml-2 text-gray-400" />
                    </el-tooltip>
                  </div>
                </el-form-item>

                <!-- Docker连接方式 -->
                <el-form-item label="Docker连接方式" v-if="formData.monitorSysGenServerDockerEnabled">
                  <el-select v-model="formData.monitorSysGenServerDockerConnectionType" placeholder="选择Docker连接方式"
                    style="width: 100%">
                    <el-option label="Shell命令" value="SHELL">
                      <div class="docker-option">
                        <IconifyIconOnline icon="ri:terminal-line" />
                        <span>Shell命令</span>
                      </div>
                    </el-option>
                    <el-option label="TCP连接" value="TCP">
                      <div class="docker-option">
                        <IconifyIconOnline icon="ri:wifi-line" />
                        <span>TCP连接</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <!-- Docker TCP配置 -->
                <template
                  v-if="formData.monitorSysGenServerDockerEnabled && formData.monitorSysGenServerDockerConnectionType === 'TCP'">
                  <el-form-item label="Docker主机" prop="monitorSysGenServerDockerHost">
                    <el-input v-model="formData.monitorSysGenServerDockerHost" placeholder="请输入Docker主机地址" clearable>
                      <template #prefix>
                        <IconifyIconOnline icon="ri:server-line" />
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="Docker端口" prop="monitorSysGenServerDockerPort">
                    <el-input-number v-model="formData.monitorSysGenServerDockerPort" :min="1" :max="65535"
                      placeholder="端口号" style="width: 100%" />
                  </el-form-item>
                </template>

                <el-form-item label="描述">
                  <el-input v-model="formData.monitorSysGenServerDescription" type="textarea" :rows="4"
                    placeholder="请输入服务器描述信息" />
                </el-form-item>
              </div>
            </div>
          </el-col>
        </el-row>


      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <el-button v-if="mode === 'edit'" type="success" :loading="testLoading" @click="handleTest" plain>
            <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />
            测试连接
          </el-button>
        </div>
        <div class="footer-right">
          <el-button @click="visible = false">
            <IconifyIconOnline icon="ri:close-line" class="mr-1" />
            取消
          </el-button>
          <el-button type="primary" :loading="loading" @click="handleSubmit">
            <IconifyIconOnline :icon="mode === 'add' ? 'ri:add-line' : 'ri:save-line'" class="mr-1" />
            {{ mode === 'add' ? '新增' : '保存' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { type MonitorProxy, getProxyPageList } from "@/api/monitor/gen/proxy";
import {
  type ServerDisplayData,
  saveServer,
  testLocalIpDetection,
  testServerConnection,
  updateServer
} from "@/api/server";
import { message } from "@repo/utils";
import { computed, nextTick, reactive, ref } from "vue";

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const testLoading = ref(false);
const detectLoading = ref(false);
const mode = ref<"add" | "edit">("add");
const formRef = ref();

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
  monitorSysGenServerHost: "",
  monitorSysGenServerPort: 22,
  monitorSysGenServerProtocol: "SSH",
  monitorSysGenServerUsername: "",
  monitorSysGenServerPassword: "",
  monitorSysGenServerPrivateKey: "",
  monitorSysGenServerAuthType: "password",
  monitorSysGenServerStatus: 1,
  monitorSysGenServerMonitorEnabled: 1,
  monitorSysGenServerMetricsSupport: true,
  monitorSysGenServerTags: "",
  monitorSysGenServerDescription: "",
  monitorSysGenServerCharset: "UTF-8",
  monitorSysGenServerTimeout: 30000,
  monitorSysGenServerWidth: 1024,
  monitorSysGenServerHeight: 768,
  monitorSysGenServerColorDepth: "24",
  monitorSysGenServerVncPassword: "",
  monitorSysGenServerReadOnly: 0,
  // 新增字段
  monitorSysGenServerReportEnabled: 1,
  monitorSysGenServerProxyId: null as number | null,
  monitorSysGenServerDataReportMethod: "NONE",
  monitorSysGenServerPrometheusHost: "",
  monitorSysGenServerPrometheusPort: 4822,
  monitorSysGenServerProxyHost: "",
  monitorSysGenServerProxyPort: 4822,
  // 额外IP地址
  monitorSysGenServerIpAddresses: [""] as string[],
  // 是否本地服务器（自动检测，不允许修改）
  monitorSysGenServerIsLocal: 0,
  // Docker相关配置
  monitorSysGenServerDockerEnabled: 0,
  monitorSysGenServerDockerConnectionType: "SHELL",
  monitorSysGenServerDockerHost: "",
  monitorSysGenServerDockerPort: 2376,
  // 操作系统信息（自动检测）
  monitorSysGenServerOsType: "",
  monitorSysGenServerOsVersion: "",
  monitorSysGenServerOsArch: "",
  monitorSysGenServerOsCustom: "", // 自定义操作系统名称
});

// 代理相关数据
const proxyList = ref<MonitorProxy[]>([]);
const proxyListLoading = ref(false);
const selectedProxy = ref<MonitorProxy | null>(null);

// 分组的代理列表
const groupedProxyList = computed(() => {
  const groups = [
    { type: 'HTTP', label: 'HTTP 代理', proxies: [] as MonitorProxy[] },
    { type: 'SOCKS4', label: 'SOCKS4 代理', proxies: [] as MonitorProxy[] },
    { type: 'SOCKS5', label: 'SOCKS5 代理', proxies: [] as MonitorProxy[] }
  ];

  proxyList.value.forEach(proxy => {
    const group = groups.find(g => g.type === proxy.proxyType);
    if (group) {
      group.proxies.push(proxy);
    }
  });

  return groups.filter(group => group.proxies.length > 0);
});

// 表单验证规则
const rules = {
  monitorSysGenServerName: [
    { required: true, message: "服务器名称不能为空", trigger: "blur" },
    { min: 2, max: 255, message: "服务器名称最大长度要小于 255", trigger: "blur" },
  ],
  monitorSysGenServerHost: [
    { required: true, message: "服务器地址不能为空", trigger: "blur" },
    {
      pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
      message: "请输入有效的IP地址或域名",
      trigger: "blur",
    },
    { max: 255, message: "服务器主机地址最大长度要小于 255", trigger: "blur" },
  ],
  monitorSysGenServerPort: [
    { required: true, message: "端口号不能为空", trigger: "blur" },
    { type: "number", min: 1, max: 65535, message: "端口号范围 1-65535", trigger: "blur" },
  ],
  monitorSysGenServerProtocol: [
    { required: true, message: "连接协议不能为空", trigger: "change" },
    { max: 50, message: "连接协议最大长度要小于 50", trigger: "blur" },
  ],
  monitorSysGenServerUsername: [
    { required: true, message: "用户名不能为空", trigger: "blur" },
    { max: 255, message: "用户名最大长度要小于 255", trigger: "blur" },
  ],
  monitorSysGenServerAuthType: [
    { required: true, message: "请选择认证方式", trigger: "change" },
  ],
  monitorSysGenServerPassword: [
    {
      validator: (rule: any, value: string, callback: Function) => {
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
      validator: (rule: any, value: string, callback: Function) => {
        if (formData.monitorSysGenServerAuthType === "key" && !value) {
          callback(new Error("请输入私钥"));
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
      validator: (rule: any, value: string, callback: Function) => {
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
 * 打开对话框
 */
const open = (editMode: "add" | "edit" = "add") => {
  mode.value = editMode;
  visible.value = true;

  // 根据协议设置默认端口
  if (editMode === "add") {
    setDefaultPort();
  }

  // 加载代理列表
  loadProxyList();
};

/**
 * 设置数据
 */
const setData = (data: ServerDisplayData | any) => {
  if (data && Object.keys(data).length > 0) {
    // 如果是ServerDisplayData类型，需要映射到表单字段
    if ('name' in data && 'host' in data) {
      // 这是ServerDisplayData类型，需要映射
      Object.assign(formData, {
        monitorSysGenServerId: data.id,
        monitorSysGenServerName: data.name,
        monitorSysGenServerHost: data.host,
        monitorSysGenServerPort: data.port,
        monitorSysGenServerProtocol: data.protocol,
        monitorSysGenServerUsername: data.username,
        monitorSysGenServerDescription: data.description,
        monitorSysGenServerMetricsSupport: data.metricsSupport,
        monitorSysGenServerTags: data.tags,
        monitorSysGenServerStatus: data.status,
        monitorSysGenServerMonitorEnabled: data.metricsSupport ? 1 : 0,
        // 新增字段映射
        monitorSysGenServerReportEnabled: data.monitorSysGenServerReportEnabled || 1,
        monitorSysGenServerProxyId: data.monitorSysGenServerProxyId || null,
        monitorSysGenServerDataReportMethod: data.monitorSysGenServerDataReportMethod || "NONE",
        monitorSysGenServerPrometheusHost: data.monitorSysGenServerPrometheusHost || "",
        monitorSysGenServerPrometheusPort: data.monitorSysGenServerPrometheusPort || 9090,
        monitorSysGenServerProxyHost: data.monitorSysGenServerProxyHost || "",
        monitorSysGenServerProxyPort: data.monitorSysGenServerProxyPort || 8080,
        // 额外IP地址
        monitorSysGenServerIpAddresses: data.monitorSysGenServerIpAddresses ?
          (typeof data.monitorSysGenServerIpAddresses === 'string' ?
            JSON.parse(data.monitorSysGenServerIpAddresses) : data.monitorSysGenServerIpAddresses) : [""],
        // 是否本地服务器
        monitorSysGenServerIsLocal: data.monitorSysGenServerIsLocal || 0,
        // Docker相关配置
        monitorSysGenServerDockerEnabled: data.monitorSysGenServerDockerEnabled || 0,
        monitorSysGenServerDockerConnectionType: data.monitorSysGenServerDockerConnectionType || "SHELL",
        monitorSysGenServerDockerHost: data.monitorSysGenServerDockerHost || "",
        monitorSysGenServerDockerPort: data.monitorSysGenServerDockerPort || 2376,
      });
    } else {
      // 直接赋值（兼容原有的后台数据格式）
      Object.assign(formData, data);
    }
  } else {
    resetForm();
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    monitorSysGenServerId: null,
    monitorSysGenServerName: "",
    monitorSysGenServerHost: "",
    monitorSysGenServerPort: 22,
    monitorSysGenServerProtocol: "SSH",
    monitorSysGenServerUsername: "",
    monitorSysGenServerPassword: "",
    monitorSysGenServerPrivateKey: "",
    monitorSysGenServerAuthType: "password",
    monitorSysGenServerStatus: 1,
    monitorSysGenServerMonitorEnabled: 1,
    monitorSysGenServerMetricsSupport: true,
    monitorSysGenServerTags: "",
    monitorSysGenServerDescription: "",
    monitorSysGenServerCharset: "UTF-8",
    monitorSysGenServerTimeout: 30000,
    monitorSysGenServerWidth: 1024,
    monitorSysGenServerHeight: 768,
    monitorSysGenServerColorDepth: "24",
    monitorSysGenServerVncPassword: "",
    monitorSysGenServerReadOnly: 0,
    // 新增字段
    monitorSysGenServerReportEnabled: 1,
    monitorSysGenServerProxyId: null,
    monitorSysGenServerDataReportMethod: "NONE",
    monitorSysGenServerPrometheusHost: "",
    monitorSysGenServerPrometheusPort: 9090,
    monitorSysGenServerProxyHost: "",
    monitorSysGenServerProxyPort: 8080,
    // 额外IP地址
    monitorSysGenServerIpAddresses: [""],
    // Docker相关配置
    monitorSysGenServerDockerEnabled: 0,
    monitorSysGenServerDockerConnectionType: "SHELL",
    monitorSysGenServerDockerHost: "",
    monitorSysGenServerDockerPort: 2376,
  });

  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

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
    formData.monitorSysGenServerPort = portMap[formData.monitorSysGenServerProtocol as keyof typeof portMap];
  }
};

/**
 * 监听协议变化
 */
const handleProtocolChange = () => {
  setDefaultPort();
};

/**
 * 处理上报方式变化
 */
const handleReportMethodChange = () => {
  // 当选择Prometheus时，设置默认端口
  if (formData.monitorSysGenServerDataReportMethod === 'PROMETHEUS') {
    if (!formData.monitorSysGenServerPrometheusPort) {
      formData.monitorSysGenServerPrometheusPort = 9090;
    }
  }
  // 当选择其他方式时，清空Prometheus配置
  else if (formData.monitorSysGenServerDataReportMethod !== 'PROMETHEUS') {
    formData.monitorSysGenServerPrometheusHost = "";
    formData.monitorSysGenServerPrometheusPort = 9090;
  }
};

/**
 * 处理操作系统类型变化
 */
const handleOsTypeChange = () => {
  // 根据操作系统类型设置默认架构
  const osType = formData.monitorSysGenServerOsType;

  if (!formData.monitorSysGenServerOsArch) {
    if (osType.toLowerCase().includes('windows')) {
      formData.monitorSysGenServerOsArch = 'x86_64';
    } else if (osType.toLowerCase().includes('ubuntu') ||
      osType.toLowerCase().includes('debian') ||
      osType.toLowerCase().includes('centos') ||
      osType.toLowerCase().includes('rhel')) {
      formData.monitorSysGenServerOsArch = 'x86_64';
    } else if (osType.toLowerCase().includes('macos')) {
      formData.monitorSysGenServerOsArch = 'aarch64'; // 新的Mac通常是ARM架构
    } else {
      formData.monitorSysGenServerOsArch = 'x86_64'; // 默认x86_64
    }
  }

  // 根据操作系统类型设置默认版本信息
  if (!formData.monitorSysGenServerOsVersion) {
    if (osType === 'Ubuntu 22.04 LTS') {
      formData.monitorSysGenServerOsVersion = '22.04.3 LTS';
    } else if (osType === 'Ubuntu 20.04 LTS') {
      formData.monitorSysGenServerOsVersion = '20.04.6 LTS';
    } else if (osType === 'CentOS 8') {
      formData.monitorSysGenServerOsVersion = '8.5.2111';
    } else if (osType === 'CentOS 7') {
      formData.monitorSysGenServerOsVersion = '7.9.2009';
    } else if (osType === 'Windows Server 2022') {
      formData.monitorSysGenServerOsVersion = '21H2';
    } else if (osType === 'Windows Server 2019') {
      formData.monitorSysGenServerOsVersion = '1809';
    }
  }

  // 清空自定义操作系统名称（如果不是自定义类型）
  if (osType !== 'Custom') {
    formData.monitorSysGenServerOsCustom = '';
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
        ipAddresses: detectionResult?.ipAddresses ? JSON.parse(detectionResult.ipAddresses) : []
      };

      // 如果是本机服务器且当前上报方式是API，自动切换为LOCAL
      if (osInfo.value.isLocal && formData.monitorSysGenServerDataReportMethod === 'API') {
        formData.monitorSysGenServerDataReportMethod = 'LOCAL';
        message.success("检测到本机服务器，已自动切换为本地上报方式");
      }
      // 如果是远程服务器且当前上报方式是LOCAL，自动切换为API
      else if (!osInfo.value.isLocal && formData.monitorSysGenServerDataReportMethod === 'LOCAL') {
        formData.monitorSysGenServerDataReportMethod = 'API';
        message.info("检测到远程服务器，已自动切换为接口上报方式");
      }
    } else {
      message.warning("服务器信息检测失败: " + res.msg);
      osInfo.value = null;
    }
  } catch (error) {
    console.error("检测服务器信息失败:", error);
    message.error("检测服务器信息失败，请检查网络连接");
    osInfo.value = null;
  } finally {
    detectLoading.value = false;
  }
};

/**
 * 添加额外IP地址
 */
const addExtraIp = () => {
  formData.monitorSysGenServerIpAddresses.push("");
};

/**
 * 移除额外IP地址
 */
const removeExtraIp = (index: number) => {
  if (formData.monitorSysGenServerIpAddresses.length > 1) {
    formData.monitorSysGenServerIpAddresses.splice(index, 1);
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
  else if (osLower.includes("suse") || osLower.includes("sles") || osLower.includes("opensuse")) {
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

  // 自定义
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
    case 'HTTP':
      return 'ri:global-line';
    case 'SOCKS4':
      return 'ri:shield-line';
    case 'SOCKS5':
      return 'ri:shield-check-line';
    default:
      return 'ri:server-line';
  }
};

/**
 * 加载代理列表
 */
const loadProxyList = async () => {
  try {
    proxyListLoading.value = true;
    const result = await getProxyPageList({
      page: 1,
      pageSize: 1000, // 获取所有代理
      proxyStatus: 1 // 只获取启用的代理
    });
    if (result.code === "00000") {
      proxyList.value = result.data?.records || [];
    } else {
      message.error(result.msg || '获取代理列表失败');
    }
  } catch (error) {
    console.error('加载代理列表失败:', error);
    message.error('加载代理列表失败');
  } finally {
    proxyListLoading.value = false;
  }
};

/**
 * 处理代理选择变化
 */
const handleProxyChange = (proxyId: number | null) => {
  if (proxyId) {
    selectedProxy.value = proxyList.value.find(proxy => proxy.proxyId === proxyId) || null;
  } else {
    selectedProxy.value = null;
  }
};

/**
 * 打开代理管理
 */
const openProxyManagement = () => {
  // 在新窗口中打开代理管理页面
  const routeUrl = '/server/proxy-management';
  window.open(routeUrl, '_blank');
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  try {
    // 表单验证
    const isValid = await formRef.value?.validate().catch((error) => {
      console.log("表单验证失败:", error);
      // 显示第一个验证错误
      if (error && typeof error === 'object') {
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

    // 准备提交数据，将IP地址数组转换为JSON字符串，确保数字类型正确
    const submitData = {
      ...formData,
      monitorSysGenServerIpAddresses: JSON.stringify(formData.monitorSysGenServerIpAddresses.filter(ip => ip.trim() !== "")),
      // 确保数字类型字段正确
      monitorSysGenServerPort: Number(formData.monitorSysGenServerPort),
      monitorSysGenServerDockerEnabled: Number(formData.monitorSysGenServerDockerEnabled),
      monitorSysGenServerDockerPort: formData.monitorSysGenServerDockerPort ? Number(formData.monitorSysGenServerDockerPort) : null,
      monitorSysGenServerIsLocal: Number(formData.monitorSysGenServerIsLocal),
      monitorSysGenServerReportEnabled: Number(formData.monitorSysGenServerReportEnabled || 1),
      monitorSysGenServerMonitorEnabled: Number(formData.monitorSysGenServerMonitorEnabled || 1),
      monitorSysGenServerStatus: Number(formData.monitorSysGenServerStatus || 1),
    };

    // 调试信息：打印提交的数据
    console.log("提交的服务器数据:", submitData);
    console.log("多IP地址:", submitData.monitorSysGenServerIpAddresses);
    console.log("本地服务器标识:", submitData.monitorSysGenServerIsLocal);
    console.log("Docker配置:", {
      enabled: submitData.monitorSysGenServerDockerEnabled,
      enabledType: typeof submitData.monitorSysGenServerDockerEnabled,
      connectionType: submitData.monitorSysGenServerDockerConnectionType,
      host: submitData.monitorSysGenServerDockerHost,
      port: submitData.monitorSysGenServerDockerPort,
      portType: typeof submitData.monitorSysGenServerDockerPort
    });

    const res = mode.value === "add" ? await saveServer(submitData) : await updateServer(submitData);

    if (res.code === "00000") {
      message.success(mode.value === "add" ? "新增成功" : "保存成功");
      visible.value = false;
      emit("success");
    } else {
      // 显示具体的验证错误信息
      const errorMessage = res.msg || "操作失败";
      message.error(errorMessage);
    }
  } catch (error) {
    console.error("保存服务器配置出错:", error);
    if (error !== false) { // 表单验证失败时不显示错误消息
      // 检查是否是网络错误或其他API错误
      if (error && error.response && error.response.data && error.response.data.msg) {
        message.error(error.response.data.msg);
      } else {
        message.error("操作异常，请稍后重试");
      }
    }
  } finally {
    loading.value = false;
  }
};

/**
 * 测试连接
 */
const handleTest = async () => {
  try {
    await formRef.value?.validate();

    if (!formData.monitorSysGenServerId) {
      message.warning("请先保存服务器配置后再测试连接");
      return;
    }

    testLoading.value = true;
    const res = await testServerConnection(String(formData.monitorSysGenServerId));

    if (res.code === "00000") {
      message.success(res.data ? "连接测试成功" : "连接测试失败");
    } else {
      message.error(res.msg || "测试失败");
    }
  } catch (error) {
    console.error("测试连接出错:", error);
    if (error !== false) {
      message.error("测试异常，请稍后重试");
    }
  } finally {
    testLoading.value = false;
  }
};

// 暴露方法
defineExpose({
  open,
  setData,
});
</script>

<style lang="scss" scoped>
// 对话框整体样式
.server-edit-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    max-height: 90vh;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
    height: calc(90vh - 140px); // 减去头部和底部的高度
    overflow: hidden; // 不显示滚动条
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-fill-color-extra-light) 0%, var(--el-bg-color) 100%);
  }
}

// 自定义头部样式
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }

    .dialog-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
    }
  }

  .close-btn {
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }
}

// 对话框内容区域
.dialog-content {
  padding: 20px 24px;
  height: 100%;
  overflow: hidden;
}

// 表单行布局
.form-row {
  height: 100%;
  margin: 0 !important;
}

// 表单列布局
.form-column {
  height: 100%;
  padding: 0 12px !important;

  &:first-child {
    padding-left: 0 !important;
  }

  &:last-child {
    padding-right: 0 !important;
  }
}

// 表单样式
.server-form {
  height: 100%;

  :deep(.el-form-item) {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    // 错误状态样式
    &.is-error {
      .el-form-item__label {
        color: var(--el-color-danger);
      }

      .el-input__wrapper {
        border-color: var(--el-color-danger);
        box-shadow: 0 0 0 1px var(--el-color-danger-light-7);
      }

      .el-select .el-input__wrapper {
        border-color: var(--el-color-danger);
        box-shadow: 0 0 0 1px var(--el-color-danger-light-7);
      }
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 1.4;
    padding-bottom: 4px;
  }

  // 错误消息样式
  :deep(.el-form-item__error) {
    font-size: 12px;
    color: var(--el-color-danger);
    padding-top: 4px;
    line-height: 1.4;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
    }
  }

  :deep(.el-select .el-input__wrapper) {
    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-7);
    }
  }

  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      border-radius: 8px;
    }
  }
}

// 表单分组样式
.form-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;

    .section-icon {
      font-size: 18px;
      color: var(--el-color-primary);
      padding: 4px;
      background: var(--el-color-primary-light-9);
      border-radius: 6px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .section-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: var(--el-fill-color-extra-light);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-dark);
      border-radius: 2px;

      &:hover {
        background: var(--el-color-primary-light-5);
      }
    }
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

// 额外IP地址容器样式
.extra-ips-container {
  .extra-ip-item {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .el-input {
      flex: 1;
    }

    .el-button {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      padding: 0;
      border-radius: 6px;

      &:hover {
        background-color: var(--el-color-danger-light-9);
        color: var(--el-color-danger);
      }
    }
  }

  .add-ip-btn {
    width: 100%;
    margin-top: 8px;
    border: 1px dashed var(--el-color-primary-light-5);
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    border-radius: 8px;
    padding: 8px 16px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary);
      background: var(--el-color-primary-light-8);
    }
  }
}

// 开关包装器
.switch-wrapper {
  display: flex;
  align-items: center;
  height: 40px;
}

// 底部按钮区域
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 24px !important;

  .footer-left {
    flex: 1;
  }

  .footer-right {
    display: flex;
    gap: 12px;
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
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
      border: none;

      &:hover {
        background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
      }
    }

    &.el-button--success {
      &.is-plain {
        &:hover {
          background-color: var(--el-color-success);
          border-color: var(--el-color-success);
          color: white;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
    }
  }
}

@media (max-width: 1200px) {
  .form-row {
    flex-direction: column;
    height: auto;
  }

  .form-column {
    height: auto;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .server-edit-dialog {
    :deep(.el-dialog__body) {
      height: auto;
      max-height: 70vh;
      overflow-y: auto;
    }
  }

  .dialog-content {
    height: auto;
    overflow: visible;
  }

  .form-section {
    height: auto;

    .section-content {
      overflow: visible;
    }
  }
}

@media (max-width: 768px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 2vh auto;
      top: 2vh !important;
    }

    :deep(.el-dialog__body) {
      height: auto;
      max-height: 75vh;
      overflow-y: auto;
    }
  }

  .dialog-content {
    padding: 16px;
    height: auto;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px !important;

    .footer-left,
    .footer-right {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .footer-right {
      flex-direction: row-reverse;
    }
  }

  .form-section {
    .section-header {
      .section-title {
        font-size: 13px;
      }
    }
  }

  .server-form {
    :deep(.el-form-item__label) {
      font-size: 12px;
    }
  }
}

@media (max-width: 480px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 98% !important;
      margin: 1vh auto;
      top: 1vh !important;
    }
  }

  .dialog-content {
    padding: 12px;
  }

  .dialog-footer {
    padding: 12px !important;

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
    background: linear-gradient(135deg, var(--el-color-success-light-9) 0%, var(--el-fill-color-extra-light) 100%);
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

// 动画效果
.server-edit-dialog {
  :deep(.el-dialog) {
    animation: dialogSlideIn 0.3s ease-out;
  }
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 表单项动画
.form-section {
  animation: sectionFadeIn 0.4s ease-out;
}

@keyframes sectionFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 操作系统信息样式
.os-info-section {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, var(--el-color-success-light-9) 0%, var(--el-fill-color-extra-light) 100%);
  border: 1px solid var(--el-color-success-light-7);
  border-radius: 8px;

  .os-info-header {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .os-icon {
      font-size: 16px;
      color: var(--el-color-success);
      margin-right: 8px;
    }

    .os-title {
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-right: 8px;
    }
  }

  .os-info-content {
    .os-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      &:last-child {
        margin-bottom: 0;
      }

      .os-label {
        font-size: 12px;
        color: var(--el-text-color-regular);
        width: 70px;
        flex-shrink: 0;
      }

      .os-value {
        font-size: 12px;
        color: var(--el-text-color-primary);
        font-weight: 500;
      }

      .ip-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .ip-tag {
          font-size: 11px;
          padding: 2px 6px;
        }
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
</style>
