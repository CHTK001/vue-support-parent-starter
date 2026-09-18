<template>
  <ReDialog v-model="visible" :title="`主机画像 - ${hostName || ''}`" width="92%" top="3vh" :height="850" class="sys-mgr-dialog profile-dialog" footer-hidden>
    <div class="body-toolbar">
      <ReInput v-if="showTabFilter" v-model="tabFilter" placeholder="过滤..." size="small" clearable style="width:200px" />
      <div class="toolbar-auto" v-if="activeTab === 'process' || activeTab === 'service' || activeTab === 'network-connection' || activeTab === 'netproc' || activeTab === 'env'">
        <ReSwitch v-model="autoRefresh" size="small" @change="onAutoRefresh" />
        <span class="auto-label">自动刷新</span>
        <select v-model.number="autoInterval" style="width:70px;font-size:12px;">
          <option :value="2000">2s</option>
          <option :value="3000">3s</option>
          <option :value="5000">5s</option>
          <option :value="10000">10s</option>
        </select>
      </div>
    </div>
    <div class="host-profile">
      <!-- 左侧：主机基本信息 -->
      <aside class="profile-sidebar">
        <div class="profile-os">
          <div class="os-badge" :class="osTypeClass">
            <span class="os-letter">{{ osLetter }}</span>
          </div>
          <div class="os-name">{{ hostOsType || '未知系统' }}</div>
          <span class="profile-status" :class="online ? 'st-online' : 'st-offline'">
            <i class="st-dot" />{{ online ? '在线' : '离线' }}
          </span>
        </div>
        <ReButton icon="RefreshRight" size="small" :loading="refreshingInfo" @click="refreshHostInfo" style="width:100%">刷新主机信息</ReButton>
        <div class="profile-info">
          <div class="info-row"><span class="info-label">主机名</span><span class="info-val">{{ hostName || '-' }}</span></div>
          <div class="info-row"><span class="info-label">地址</span><span class="info-val mono">{{ hostAddress || '-' }}</span></div>
          <div class="info-row"><span class="info-label">协议</span><span class="info-val">{{ hostProtocol || '-' }}</span></div>
          <div class="info-row"><span class="info-label">延迟</span><span class="info-val mono">{{ hostDelay != null ? hostDelay + ' ms' : '-' }}</span></div>
          <div class="info-row"><span class="info-label">分组</span><span class="info-val">{{ hostGroup || '-' }}</span></div>
          <div class="info-row"><span class="info-label">公网 IP</span><span class="info-val mono">{{ localInfo.publicIp || '—' }}</span></div>
          <div class="info-row"><span class="info-label">内网 IP</span><span class="info-val mono">{{ localInfo.privateIp || '—' }}</span></div>
          <div class="info-row"><span class="info-label">MAC</span><span class="info-val mono">{{ localInfo.macAddress || '—' }}</span></div>
          <div class="info-row"><span class="info-label">CPU</span><span class="info-val">{{ localInfo.cpuCores || '—' }} 核<span v-if="localInfo.cpuName" class="info-sub">{{ localInfo.cpuName }}</span></span></div>
          <div class="info-row"><span class="info-label">内存</span><span class="info-val">{{ localInfo.memoryMb ? (localInfo.memoryMb / 1024).toFixed(1) + ' GB' : '—' }}</span></div>
          <div class="info-row" v-if="localInfo.gpuModel"><span class="info-label">GPU</span><span class="info-val">{{ localInfo.gpuModel }}</span></div>
        </div>
      </aside>

      <!-- 右侧：Tab 管理面板 -->
      <div class="profile-main">
        <ReTab v-model="activeTab" :tabs="tabList" type="card" class="profile-tabs" @tab-change="onTabChange">
          <template #process>
            <ReTable :data="processTreeList" :columns="processColumns" :loading="loading" size="small" row-key="pid" :pagination="false" :default-expand-all="false" :tree-props="{ children: 'children', hasChildren: 'hasChildren' }" class="mgr-table process-tree-table" @row-contextmenu="onProcContextMenu">
              <template #col-name="{ row }">
                <span class="proc-name">{{ row.name }}</span>
              </template>
              <template #col-cpu="{ row }">
                <span class="mono">{{ Number(row.cpu ?? 0).toFixed(2) }}</span>
              </template>
              <template #col-memory="{ row }">
                <span class="mono">{{ formatMem(Number(row.memory ?? row.rss ?? 0)) }}</span>
              </template>
              <template #col-user="{ row }">
                <span class="proc-cmd" :title="row.command || row.path">{{ row.command || row.path || row.user || '—' }}</span>
              </template>
              <template #col-desc="{ row }">
                <span class="proc-desc">{{ row.command || row.path || '—' }}</span>
              </template>
            </ReTable>
          </template>

          <template #service>
            <ReTable :data="dataList" :columns="serviceColumns" :loading="loading" size="small" stripe :pagination="false" class="mgr-table">
              <template #col-status="{ row }">
                <span class="svc-status" :class="isRunning(row) ? 'svc-running' : 'svc-stopped'">
                  <i class="svc-dot" />{{ serviceStatusText(row.Status) }}
                </span>
              </template>
              <template #col-actions="{ row }">
                <div class="op-cell">
                  <ReButton icon="VideoPlay" layout="square" size="small" type="success" title="启动" :disabled="isRunning(row)" @click="doStart(row)" />
                  <ReButton icon="VideoPause" layout="square" size="small" type="warning" title="停止" :disabled="!isRunning(row)" @click="doStop(row)" />
                  <ReButton icon="Refresh" layout="square" size="small" title="重启" @click="doRestart(row)" />
                </div>
              </template>
            </ReTable>
          </template>

          <template #disk>
            <div class="disk-pc-view">
              <div v-for="(disk, di) in diskList" :key="di" class="disk-pc-group">
                <div class="disk-pc-item" @click="openFileExplorer(disk.mount || '/')">
                  <div class="disk-pc-icon">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.2">
                      <rect x="2" y="5" width="20" height="14" rx="1.5" fill="#e2e8f0" stroke="#94a3b8"/>
                      <rect x="4" y="7" width="16" height="8" rx="0.5" fill="#cbd5e1"/>
                      <circle cx="7" cy="11" r="1" fill="#64748b"/>
                      <line x1="10" y1="10" x2="18" y2="10" stroke="#64748b" stroke-width="0.8"/>
                      <line x1="10" y1="12" x2="16" y2="12" stroke="#64748b" stroke-width="0.8"/>
                    </svg>
                  </div>
                  <div class="disk-pc-body">
                    <div class="disk-pc-label">{{ disk.FriendlyName || disk.mount || '磁盘' }}</div>
                    <div class="disk-pc-bar">
                      <div class="disk-pc-bar-fill" :class="disk.usePercent > 90 ? 'part-danger' : disk.usePercent > 75 ? 'part-warn' : 'part-ok'" :style="{ width: Math.max(disk.usePercent, 2) + '%' }" />
                    </div>
                    <div class="disk-pc-size">{{ formatBytes(disk.SizeRemaining) }} 可用，共 {{ formatBytes(disk.Size) }}</div>
                  </div>
                </div>
              </div>
              <div v-if="loading" class="skeleton-list">
                <div v-for="i in 4" :key="i" class="skeleton-row">
                  <div class="sk-bar" style="width:36%;height:14px" />
                  <div class="sk-bar" style="width:60%;height:10px;margin-top:8px" />
                  <div class="sk-bar" style="width:48%;height:8px;margin-top:6px" />
                </div>
              </div>
              <div v-if="!loading && diskList.length === 0" class="net-empty">暂无磁盘</div>
            </div>
          </template>

          <template #network-interface>
            <div class="net-connections">
              <div v-for="(adapter, i) in dataList" :key="i" class="net-conn-item"
                   @contextmenu.prevent="showNetCtxMenu($event, adapter)">
                <div class="net-conn-icon" :class="(adapter.operstate || '').toLowerCase() === 'up' ? 'active' : 'disabled'">
                  <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
                    <rect x="6" y="10" width="36" height="24" rx="2" :fill="(adapter.operstate || '').toLowerCase() === 'up' ? '#e0e7ff' : '#f1f5f9'" stroke="#94a3b8" stroke-width="1"/>
                    <rect x="10" y="14" width="28" height="12" rx="1" :fill="(adapter.operstate || '').toLowerCase() === 'up' ? '#c7d2fe' : '#e2e8f0'"/>
                    <circle cx="16" cy="20" r="1.5" :fill="(adapter.operstate || '').toLowerCase() === 'up' ? '#6366f1' : '#94a3b8'"/>
                    <rect x="20" y="18" width="14" height="1.5" rx="0.5" :fill="(adapter.operstate || '').toLowerCase() === 'up' ? '#6366f1' : '#94a3b8'"/>
                    <rect x="20" y="21" width="10" height="1.5" rx="0.5" :fill="(adapter.operstate || '').toLowerCase() === 'up' ? '#6366f1' : '#94a3b8'"/>
                    <path d="M 20 34 L 20 40 L 28 40" :stroke="(adapter.operstate || '').toLowerCase() === 'up' ? '#94a3b8' : '#cbd5e1'" stroke-width="1.5" fill="none"/>
                    <circle v-if="(adapter.operstate || '').toLowerCase() !== 'up'" cx="20" cy="34" r="5" fill="#ef4444" stroke="#fff" stroke-width="1.5"/>
                    <path v-if="(adapter.operstate || '').toLowerCase() !== 'up'" d="M 17 31 L 23 37 M 23 31 L 17 37" stroke="#fff" stroke-width="1.5"/>
                  </svg>
                </div>
                <div class="net-conn-name">{{ adapter.ifname || adapter.Name || '未知适配器' }}</div>
                <div class="net-conn-status">{{ (adapter.operstate || '').toLowerCase() === 'up' ? '已连接' : (adapter.operstate || '').toLowerCase() === 'down' ? '网络电缆被拔出' : (adapter.operstate || '未知') }}</div>
                <div class="net-conn-desc">{{ getAdapterIPv4(adapter) }}</div>
              </div>
              <div v-if="loading" class="skeleton-list">
                <div v-for="i in 3" :key="i" class="skeleton-row">
                  <div class="sk-bar" style="width:40%;height:14px" />
                  <div class="sk-bar" style="width:55%;height:10px;margin-top:8px" />
                </div>
              </div>
              <div v-if="!loading && dataList.length === 0" class="net-empty">暂无网络适配器</div>
            </div>
            <!-- 右键菜单 -->
            <div v-if="netCtxMenu.visible" class="net-ctx-menu" :style="{ left: netCtxMenu.x + 'px', top: netCtxMenu.y + 'px' }"
                 @click.stop>
              <div class="net-ctx-item" @click="showNetDetails(netCtxMenu.adapter); netCtxMenu.visible = false">详情</div>
              <div class="net-ctx-item" @click="showNetEdit(netCtxMenu.adapter); netCtxMenu.visible = false">编辑</div>
            </div>
          </template>

          <template #network-connection>
            <ReTable :data="dataList" :columns="networkConnectionColumns" :loading="loading" size="small" stripe class="mgr-table" />
          </template>

          <template #netproc>
            <div class="netproc-view">
              <div class="netproc-toolbar">
                <el-radio-group v-model="netprocMode" size="small">
                  <el-radio-button value="grouped">端口分组</el-radio-button>
                  <el-radio-button value="flat">列表</el-radio-button>
                </el-radio-group>
                <el-input v-model="netprocFilter" size="small" placeholder="筛选地址/端口/进程" style="width:260px" />
              </div>
              <div v-if="netprocMode === 'grouped'">
                <div v-for="group in groupedNetprocs" :key="group.port" class="netproc-group">
                  <div class="netproc-group-header">
                    <span class="netproc-port">{{ group.port }}</span>
                    <span class="netproc-proto">{{ group.protocol }}</span>
                    <span class="netproc-prog">{{ group.process }}</span>
                    <el-button size="small" type="danger" @click="closeNetproc(group)">关闭</el-button>
                  </div>
                  <div class="netproc-group-body">
                    <div v-for="(conn, i) in group.conns" :key="i" class="netproc-conn">
                      <span>{{ conn.local }}</span> → <span>{{ conn.remote }}</span> <span class="netproc-state">{{ conn.state }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="groupedNetprocs.length === 0" class="net-empty">暂无网络连接</div>
              </div>
              <div v-else>
                <ReTable :data="netprocList" :columns="netprocColumns" :loading="loading" size="small" stripe v-model:page="currentPage" class="mgr-table" />
              </div>
            </div>
          </template>

          <template #env>
            <ReTable :data="dataList" :columns="envColumns" :loading="loading" size="small" stripe class="mgr-table" />
          </template>

          <template #config>
            <div class="config-panel">
              <div class="config-section">
                <h4>远控配置</h4>
                <div class="config-form">
                  <div class="form-row">
                    <label>连接方式</label>
                    <el-select v-model="configForm.protocol" style="width:200px">
                      <el-option value="host" label="主机直连 (guacd)" />
                      <el-option value="vnc" label="VNC" />
                    </el-select>
                  </div>
                  <template v-if="configForm.protocol === 'vnc'">
                    <div class="form-row">
                      <label>VNC 地址</label>
                      <ReInput v-model="configForm.host" placeholder="如 192.168.1.100" style="width:240px" />
                    </div>
                    <div class="form-row">
                      <label>VNC 端口</label>
                      <ReInput v-model="configForm.port" placeholder="如 5901" style="width:200px" />
                    </div>
                    <div class="form-row">
                      <label>VNC 账号</label>
                      <ReInput v-model="configForm.username" placeholder="VNC 用户名" style="width:200px" />
                    </div>
                    <div class="form-row">
                      <label>VNC 密码</label>
                      <ReInput v-model="configForm.password" type="password" placeholder="VNC 密码" style="width:200px" />
                    </div>
                  </template>
                  <div class="form-row">
                    <label>是否开启远控</label>
                    <ReSwitch v-model="configForm.remoteEnabled" />
                  </div>
                </div>
              </div>

              <div class="config-section">
                <h4>SIP 内网穿透</h4>
                <p class="config-desc">guacd 服务器无法直接访问局域网主机时，通过 SIP 隧道打通。导出三个 tar 包部署：sip 服务端 + visit 访问端（部署到 guacd 服务器）+ provider 提供端（部署到目标主机）。</p>
                <div class="config-form">
                  <div class="form-row">
                    <label>启用 SIP</label>
                    <ReSwitch v-model="configForm.sipEnabled" />
                  </div>
                  <div class="form-row">
                    <label>SIP 服务器</label>
                    <ReInput v-model="configForm.sipHost" placeholder="如 124.221.230.112" style="width:240px" />
                  </div>
                  <div class="form-row">
                    <label>控制端口</label>
                    <ReInput v-model="configForm.sipPort" placeholder="7822" style="width:200px" />
                  </div>
                  <div class="form-row">
                    <label>SIP 密钥</label>
                    <ReInput v-model="configForm.sipSecret" type="password" placeholder="共享密钥" style="width:240px" />
                  </div>
                  <div class="form-row">
                    <label>本机端口映射</label>
                    <ReInput v-model="configForm.sipLocalPort" placeholder="如 13389 (RDP) / 2222 (SSH)" style="width:220px" />
                  </div>
                  <div class="form-row">
                    <label>部署模式</label>
                    <el-select v-model="configForm.sipDeploy" style="width:240px">
                      <el-option value="builtin" label="平台内置 SIP 服务" />
                      <el-option value="external" label="外部独立部署 SIP" />
                    </el-select>
                  </div>
                </div>
              </div>

              <div class="config-actions">
                <ReButton type="primary" @click="saveConfig">保存配置</ReButton>
                <ReButton icon="Download" @click="exportSipTars">导出 SIP 部署包</ReButton>
              </div>
            </div>
          </template>
        </ReTab>
      </div>
    </div>

    <!-- 子进程弹窗 -->
    <ReDialog v-model="childrenVisible" :title="`子进程 - PID ${currentPid}`" width="800px" footer-hidden>
      <ReTable :data="childrenList" :columns="processColumns" size="small" stripe class="mgr-table" />
    </ReDialog>

    <!-- 线程弹窗 -->
    <ReDialog v-model="threadsVisible" :title="`线程列表 - PID ${currentPid}`" width="800px" footer-hidden>
      <ReTable :data="threadsList" :columns="threadColumns" size="small" stripe class="mgr-table" />
    </ReDialog>

    <!-- 网络连接详情 -->
    <ReDialog v-model="netDetailsVisible" title="网络连接详细信息" width="520px" footer-hidden>
      <div class="net-details">
        <div class="net-details-title">网络连接详细信息(D):</div>
        <table class="net-details-table">
          <tr v-for="row in netDetailsRows" :key="row.label">
            <td class="net-dt-label">{{ row.label }}</td>
            <td class="net-dt-val">{{ row.value }}</td>
          </tr>
        </table>
      </div>
    </ReDialog>

    <!-- IPv4 属性编辑 -->
    <ReDialog v-model="netEditVisible" title="Internet 协议版本 4 (TCP/IPv4) 属性" width="480px">
      <div class="net-edit-form">
        <div class="net-edit-hint">如果网络支持此功能，则可以获取自动指派的 IP 设置。否则，你需要从网络管理员处获得适当的 IP 设置。</div>
        <div class="net-edit-radio">
          <input type="radio" id="autoIp" v-model="netEditForm.ipMode" value="auto" />
          <label for="autoIp">自动获得 IP 地址(O)</label>
        </div>
        <div class="net-edit-radio" :class="{ checked: netEditForm.ipMode === 'static' }">
          <input type="radio" id="staticIp" v-model="netEditForm.ipMode" value="static" />
          <label for="staticIp">使用下面的 IP 地址(S):</label>
        </div>
        <div class="net-edit-fields" v-if="netEditForm.ipMode === 'static'">
          <div class="net-edit-row"><label>IP 地址(I):</label><input v-model="netEditForm.ip" placeholder="例: 192.168.1.100" /></div>
          <div class="net-edit-row"><label>子网掩码(U):</label><input v-model="netEditForm.mask" placeholder="例: 255.255.255.0" /></div>
          <div class="net-edit-row"><label>默认网关(D):</label><input v-model="netEditForm.gateway" placeholder="例: 192.168.1.1" /></div>
        </div>
        <div class="net-edit-radio" style="margin-top:12px">
          <input type="radio" id="autoDns" v-model="netEditForm.dnsMode" value="auto" />
          <label for="autoDns">自动获得 DNS 服务器地址(B)</label>
        </div>
        <div class="net-edit-radio" :class="{ checked: netEditForm.dnsMode === 'static' }">
          <input type="radio" id="staticDns" v-model="netEditForm.dnsMode" value="static" />
          <label for="staticDns">使用下面的 DNS 服务器地址(E):</label>
        </div>
        <div class="net-edit-fields" v-if="netEditForm.dnsMode === 'static'">
          <div class="net-edit-row"><label>首选 DNS 服务器(P):</label><input v-model="netEditForm.dns1" placeholder="例: 8.8.8.8" /></div>
          <div class="net-edit-row"><label>备用 DNS 服务器(A):</label><input v-model="netEditForm.dns2" placeholder="例: 8.8.4.4" /></div>
        </div>
      </div>
      <template #footer>
        <ReButton type="primary" @click="applyNetEdit" :loading="netEditLoading">确定</ReButton>
        <ReButton @click="netEditVisible = false" style="margin-left:8px">取消</ReButton>
      </template>
    </ReDialog>

    <!-- 文件管理器 -->
    <ReDialog v-model="fileExplorerVisible" :title="`文件管理器 - ${currentPath}`" width="92%" top="3vh" :height="800" class="file-explorer-dialog" footer-hidden>
      <div class="fe-shell">
        <!-- Sidebar -->
        <aside class="fe-sidebar">
          <div class="fe-side-section">
            <div class="fe-side-title">快速访问</div>
            <template v-if="isWindowsHost">
              <div v-for="disk in diskList" :key="'q'+disk.mount" class="fe-side-item"
                   :class="{ active: currentPath === disk.mount }" @click="navigateTo(disk.mount || 'C:\\')">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 1v3h12V4H2zm12 4H3v4h11V8z"/></svg>
                <span>{{ disk.mount || '磁盘' }}\</span>
              </div>
            </template>
            <template v-else>
              <div class="fe-side-item" :class="{ active: currentPath === '/' }" @click="navigateTo('/')">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm0 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zM7.5 4v5h3V4h-3z"/></svg>
                <span>根目录</span>
              </div>
              <div class="fe-side-item" @click="navigateTo('/home')">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8.5 1.5a.5.5 0 0 0-1 0V3H4.5A1.5 1.5 0 0 0 3 4.5v5.2a2.5 2.5 0 0 0 2.5 2.5h5a2.5 2.5 0 0 0 2.5-2.5V4.5A1.5 1.5 0 0 0 11.5 3H8.5V1.5z"/></svg>
                <span>/home</span>
              </div>
              <div class="fe-side-item" @click="navigateTo('/etc')">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM2 8a6 6 0 1 0 12 0A6 6 0 0 0 2 8z"/></svg>
                <span>/etc</span>
              </div>
              <div class="fe-side-item" @click="navigateTo('/var/log')">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 2h12v12H2V2zm1 1v10h10V3H3zm2 2h6v1H5V5zm0 2h6v1H5V7zm0 2h4v1H5V9z"/></svg>
                <span>/var/log</span>
              </div>
              <div class="fe-side-item" @click="navigateTo('/tmp')">
                <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M3 1h10l2 3v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4l2-3zm1.5 1L3.3 3h9.4L11.5 2h-7zM3 5v8h10V5H3z"/></svg>
                <span>/tmp</span>
              </div>
            </template>
          </div>
          <div class="fe-side-section">
            <div class="fe-side-title">磁盘</div>
            <div v-for="disk in diskList" :key="disk.FriendlyName" class="fe-side-item"
                 @click="navigateTo(disk.mount || '/')">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm0 1v3h12V4H2zm12 4H3v4h11V8z"/></svg>
              <span>{{ disk.FriendlyName || '磁盘' }}</span>
            </div>
          </div>
        </aside>

        <!-- Main -->
        <main class="fe-main">
          <!-- Toolbar -->
          <div class="fe-toolbar">
            <button class="fe-tbtn" @click="navigateTo(parentPath)" title="上级目录">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M11.5 3.5L6 8l5.5 4.5-1 1L4 8l6.5-5.5 1 1z"/></svg>
            </button>
            <button class="fe-tbtn" @click="navigateTo('/')" title="根目录">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 8l6-6 6 6H10v6H6V8H2z"/></svg>
            </button>
            <div class="fe-breadcrumb">
              <span v-for="(seg, i) in breadcrumbs" :key="i" class="fe-bc-seg" @click="navigateTo(seg.path)">
                {{ seg.name }}<span v-if="i < breadcrumbs.length - 1" class="fe-bc-sep">›</span>
              </span>
            </div>
            <button class="fe-tbtn" @click="loadFiles" title="刷新">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 3a5 5 0 1 0 5 5h-1a4 4 0 1 1-4-4V3l2.5 2.5L8 8V6H7V3h1z"/></svg>
            </button>
            <button class="fe-tbtn" :class="{ active: batchMode }" @click="toggleBatch" :title="batchMode ? '退出批量选择' : '批量选择'">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/></svg>
            </button>
            <button v-if="batchMode && checkedFiles.size > 0" class="fe-tbtn fe-tbtn-danger" @click="batchDelete" title="删除选中">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M5 2V1h6v1h4v2H1V2h4zm1 3h4v8l-4 3V5z"/></svg>
            </button>
            <div class="fe-view-toggle">
              <button class="fe-view-btn" :class="{ active: feView === 'list' }" @click="feView = 'list'" title="列表">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/></svg>
              </button>
              <button class="fe-view-btn" :class="{ active: feView === 'detail' }" @click="feView = 'detail'" title="详情">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M3 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H3zm1 3h8v1H4V5zm0 2h8v1H4V7zm0 2h5v1H4V9z"/></svg>
              </button>
              <button class="fe-view-btn" :class="{ active: feView === 'icon' }" @click="feView = 'icon'" title="图标">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 2h5v5H2V2zm7 0h5v5H9V2zM2 9h5v5H2V9zm7 0h5v5H9V9z"/></svg>
              </button>
            </div>
          </div>

          <!-- Column header (list/detail mode) -->
          <div v-if="feView !== 'icon'" class="fe-thead" :class="'fe-thead-' + feView">
            <span></span>
            <span class="fe-th-name fe-th-sortable" @click="toggleSort('name')">
              名称
              <svg v-if="fileSortBy === 'name'" viewBox="0 0 16 16" width="10" height="10" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-left:2px" :style="fileSortDir === 'asc' ? '' : 'transform:rotate(180deg)'"><path d="M8 3l5 5H3l5-5z"/></svg>
            </span>
            <span v-if="feView === 'detail'" class="fe-th-perms">权限</span>
            <span class="fe-th-size fe-th-sortable" @click="toggleSort('size')">
              大小
              <svg v-if="fileSortBy === 'size'" viewBox="0 0 16 16" width="10" height="10" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-left:2px" :style="fileSortDir === 'asc' ? '' : 'transform:rotate(180deg)'"><path d="M8 3l5 5H3l5-5z"/></svg>
            </span>
            <span class="fe-th-modified fe-th-sortable" @click="toggleSort('modified')">
              修改日期
              <svg v-if="fileSortBy === 'modified'" viewBox="0 0 16 16" width="10" height="10" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-left:2px" :style="fileSortDir === 'asc' ? '' : 'transform:rotate(180deg)'"><path d="M8 3l5 5H3l5-5z"/></svg>
            </span>
            <span class="fe-th-owner">所有者</span>
            <span v-if="feView === 'detail'" class="fe-th-group">组</span>
          </div>

          <!-- File list -->
          <div class="fe-tbody" @click="fileCtxMenu.visible = false" @contextmenu.prevent="showFileCtx($event, null)" @scroll="onFeScroll">
            <div v-if="fileLoading && fileList.length === 0" class="fe-loading-overlay">
              <div class="fe-spinner"></div>
              <span>正在加载...</span>
            </div>
            <div v-if="!fileLoading && fileList.length === 0 && !editingNew" class="fe-empty">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#94a3b8" stroke-width="1.5"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
              <span>空文件夹</span>
            </div>

            <!-- Icon grid view -->
            <div v-if="feView === 'icon'" class="fe-icon-grid">
              <div v-for="(f, i) in sortedFiles" :key="i" class="fe-icon-item"
                   :class="{ selected: selectedFile === f.name }"
                   @click="selectedFile = f.name"
                   @dblclick="f.isDir ? openDir(f.name) : null"
                   @contextmenu.stop.prevent="showFileCtx($event, f)">
                <span class="fe-icon-img">
                  <svg v-if="f.isDir" viewBox="0 0 16 16" width="32" height="32" fill="#f59e0b"><path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.5l2 2H13a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5v-8z"/></svg>
                  <svg v-else viewBox="0 0 16 16" width="32" height="32" fill="#94a3b8"><path d="M4 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1H4zm5 1.5L11.5 5H9V2.5z"/></svg>
                </span>
                <span class="fe-icon-name">{{ f.name }}</span>
              </div>
            </div>

            <!-- List / detail view -->
            <template v-else>
              <!-- Inline new folder row -->
              <div v-if="editingNew" class="fe-row fe-row-editing">
                <span class="fe-row-icon">
                  <svg viewBox="0 0 16 16" width="18" height="18" fill="#f59e0b"><path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.5l2 2H13a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5v-8z"/></svg>
                </span>
                <input ref="inlineInputRef" v-model="inlineName" class="fe-inline-input"
                       @keydown.enter="commitNew" @keydown.esc="cancelInline" @blur="cancelInline" />
              </div>
              <!-- Inline rename row -->
              <div v-for="(f, i) in sortedFiles" :key="i" class="fe-row"
                   :class="{ selected: selectedFile === f.name, dir: f.isDir, [feView]: true, 'has-check': batchMode && f.name !== '.' && f.name !== '..' }"
                   @click="selectedFile = f.name"
                   @dblclick="f.isDir ? openDir(f.name) : null"
                   @contextmenu.stop.prevent="showFileCtx($event, f)">
                <input v-if="batchMode && f.name !== '.' && f.name !== '..'" type="checkbox" class="fe-row-check"
                       :checked="checkedFiles.has(f.name)" @change="toggleCheck(f.name)" @click.stop />
                <span class="fe-row-icon">
                  <svg v-if="f.isDir" viewBox="0 0 16 16" width="18" height="18" fill="#f59e0b"><path d="M1.5 3.5A1.5 1.5 0 0 1 3 2h3.5l2 2H13a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 13 13H3a1.5 1.5 0 0 1-1.5-1.5v-8z"/></svg>
                  <svg v-else viewBox="0 0 16 16" width="18" height="18" fill="#94a3b8"><path d="M4 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5L9 1H4zm5 1.5L11.5 5H9V2.5z"/></svg>
                </span>
                <span v-if="renamingFile === f.name" class="fe-row-name">
                  <input v-model="inlineName" class="fe-inline-input"
                         @keydown.enter="commitRename" @keydown.esc="cancelInline" @blur="cancelInline" />
                </span>
                <span v-else class="fe-row-name">{{ f.name }}</span>
                <span v-if="feView === 'detail'" class="fe-row-perms">{{ f.perms || '' }}</span>
                <span class="fe-row-size">{{ f.isDir ? '—' : formatFileSize(f.size) }}</span>
                <span class="fe-row-modified">{{ f.modified }}</span>
                <span class="fe-row-owner">{{ f.owner }}</span>
                <span v-if="feView === 'detail'" class="fe-row-group">{{ f.group || '' }}</span>
              </div>
            </template>
            <div v-if="fileLoading && fileList.length > 0" class="fe-loading-more">加载中...</div>
          </div>

          <!-- Status bar -->
          <div class="fe-statusbar">
            <span>{{ fileList.length }} 个项目</span>
            <span v-if="selectedFile">已选择: {{ selectedFile }}</span>
          </div>

          <!-- Context menu -->
          <div v-if="fileCtxMenu.visible" class="fe-ctx" :style="{ left: fileCtxMenu.x + 'px', top: fileCtxMenu.y + 'px' }" @click.stop>
            <template v-if="fileCtxMenu.file">
              <div class="fe-ctx-item" @click="ctxOpen">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 3h12v10H2V3zm1 1v8h10V4H3z"/></svg>
                <span>打开</span>
              </div>
              <div class="fe-ctx-item" @click="ctxRename">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M10.5 2.5l3 3L5 14l-3 .5.5-3 8-9z"/></svg>
                <span>重命名</span>
              </div>
              <div class="fe-ctx-item" @click="ctxDelete">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M5 2V1h6v1h4v2H1V2h4zm1 3h4v8l-4 3V5z"/></svg>
                <span>删除</span>
              </div>
              <div class="fe-ctx-div" />
            </template>
            <div class="fe-ctx-item" @click="ctxNewFolder">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5"/></svg>
              <span>新建文件夹</span>
            </div>
            <div v-if="!isWindowsHost" class="fe-ctx-item" @click="ctxChmod">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 1a3 3 0 0 1 3 3v1h2a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2V4a3 3 0 0 1 3-3zm0 2a1 1 0 0 0-1 1v1h2V4a1 1 0 0 0-1-1zM5 7v7h6V7H5z"/></svg>
              <span>设置权限</span>
            </div>
            <div class="fe-ctx-div" />
            <div class="fe-ctx-item" @click="ctxUpload">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 11V4M5 7l3-3 3 3M3 13h10" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
              <span>上传文件</span>
            </div>
            <template v-if="fileCtxMenu.file">
              <div class="fe-ctx-item" @click="ctxDownload">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M8 4v7M5 8l3 3 3-3M3 2h10v2H3V2z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
                <span>下载</span>
              </div>
              <div v-if="!fileCtxMenu.file?.isDir && isArchive(fileCtxMenu.file?.name)" class="fe-ctx-item" @click="ctxExtract">
                <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M2 3h12v2H2V3zm0 4h12v2H2V7zm0 4h12v2H2v-2z"/></svg>
                <span>解压</span>
              </div>
            </template>
          </div>

          <!-- Upload/Download progress overlay -->
          <div v-if="feProgress.visible" class="fe-progress-overlay">
            <div class="fe-progress-box">
              <div class="fe-progress-text">{{ feProgress.text }}</div>
              <div class="fe-progress-bar"><div class="fe-progress-fill" :style="{ width: feProgress.percent + '%' }" /></div>
              <div class="fe-progress-pct">{{ feProgress.percent }}%</div>
            </div>
          </div>

          <!-- Chmod visual dialog -->
          <div v-if="chmodDialog.visible" class="chmod-overlay" @click.self="chmodDialog.visible = false">
            <div class="chmod-dialog">
              <div class="chmod-title">设置权限 - {{ chmodDialog.target }}</div>
              <div class="chmod-grid">
                <div class="chmod-col">
                  <div class="chmod-col-title">所有者</div>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.ownerRead" /> 读 (r)</label>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.ownerWrite" /> 写 (w)</label>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.ownerExec" /> 执行 (x)</label>
                </div>
                <div class="chmod-col">
                  <div class="chmod-col-title">组</div>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.groupRead" /> 读 (r)</label>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.groupWrite" /> 写 (w)</label>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.groupExec" /> 执行 (x)</label>
                </div>
                <div class="chmod-col">
                  <div class="chmod-col-title">其他</div>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.otherRead" /> 读 (r)</label>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.otherWrite" /> 写 (w)</label>
                  <label class="chmod-opt"><input type="checkbox" v-model="chmodValues.otherExec" /> 执行 (x)</label>
                </div>
              </div>
              <div class="chmod-octal">
                <span class="chmod-octal-label">八进制:</span>
                <span class="chmod-octal-val">{{ chmodOctal }}</span>
                <span class="chmod-symbolic">{{ chmodSymbolic }}</span>
              </div>
              <div class="chmod-btns">
                <button class="chmod-cancel" @click="chmodDialog.visible = false">取消</button>
                <button class="chmod-ok" @click="applyChmod">确定</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ReDialog>
  </ReDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onUnmounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchProcesses, killProcess, fetchProcessChildren, fetchProcessThreads,
  fetchServices, startService, stopService, restartService,
  fetchNetworkInterfaces, fetchNetworkConnections,
  fetchDisks, fetchPartitions,
  fetchFirewallRules, fetchDrivers,
  type ProcessInfo, type ThreadInfo, type ServiceInfo,
} from "../monitorApi";

const props = defineProps<{
  modelValue: boolean;
  type: string;
  hostId?: number;
  hostName?: string;
  hostAddress?: string;
  hostOsType?: string;
  hostProtocol?: string;
  hostDelay?: number | null;
  hostOnline?: boolean;
  hostGroup?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: v => emit("update:modelValue", v),
});

const loading = ref(false);
const refreshingInfo = ref(false);
const keyword = ref("");
const tabFilter = ref("");
const showTabFilter = computed(() => ["process", "service", "network-connection", "env", "netproc"].includes(activeTab.value));
const dataList = ref<any[]>([]);
const localInfo = reactive({ cpuCores: '', memoryMb: 0, publicIp: '', privateIp: '', macAddress: '', osVersion: '' });
const currentPage = ref(1);
let skipPageWatch = false;
watch(currentPage, (newPage, oldPage) => {
  if (skipPageWatch || newPage === oldPage) { skipPageWatch = false; return; }
  loadData();
});
let filterTimer: any = null;
watch(tabFilter, () => {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => { currentPage.value = 1; loadData(); }, 300);
});
const totalCount = ref(0);
const sortBy = ref("cpu");
const sortOrder = ref("desc");
const autoRefresh = ref(false);
const autoInterval = ref(3000);
let autoTimer: any = null;

// 当前 Tab
const activeTab = ref("disk");

// Tab 列表（懒加载：只渲染当前 tab 内容）
const tabList = [
  { name: "disk", label: "磁盘", icon: "FolderOpened" },
  { name: "process", label: "进程", icon: "Cpu" },
  { name: "service", label: "服务", icon: "Setting" },
  { name: "network-interface", label: "网络", icon: "Connection" },
  { name: "netproc", label: "网络进程", icon: "Network" },
  { name: "env", label: "环境变量", icon: "Document" },
  { name: "config", label: "配置", icon: "Setting" },
];

// 磁盘+分区合并数据
const diskList = ref<any[]>([]);

// 网络进程
const netprocMode = ref('grouped');
const netprocFilter = ref('');
const netprocList = ref<any[]>([]);
const netprocColumns = [
  { prop: 'protocol', label: '协议', width: 70 },
  { prop: 'local', label: '本地地址', width: 160 },
  { prop: 'remote', label: '远程地址', width: 160 },
  { prop: 'state', label: '状态', width: 90 },
  { prop: 'process', label: '进程', width: 140 },
  { prop: 'pid', label: 'PID', width: 80 },
  { label: '操作', width: 80, action: true },
];
const groupedNetprocs = computed(() => {
  const filtered = netprocList.value.filter((n: any) => {
    if (!netprocFilter.value) return true;
    const s = (n.local + n.remote + n.process + String(n.pid) + n.port).toLowerCase();
    return s.includes(netprocFilter.value.toLowerCase());
  });
  const map = new Map<string, any>();
  for (const n of filtered) {
    const key = n.port + '-' + n.protocol;
    if (!map.has(key)) {
      map.set(key, { port: n.port, protocol: n.protocol, process: n.process, pid: n.pid, conns: [] as any[] });
    }
    map.get(key).conns.push({ local: n.local, remote: n.remote, state: n.state });
  }
  return Array.from(map.values());
});
async function closeNetproc(group: any) {
  try {
    await fetch(`/ms/system/netproc/close?hostId=${props.hostId}&pid=${group.pid}&port=${group.port}`, { method: 'POST' });
    setTimeout(loadData, 1000);
  } catch (e) {}
}

function parseNetprocRaw(item: any): any {
  const raw = item.raw || '';
  // Skip header line
  if (raw.includes('Netid') || raw.includes('Proto') || raw.trim() === '') return null;
  // Format: "tcp   LISTEN 0      4096      127.0.0.54:53         0.0.0.0:*"
  // or with process: "users:((\"java\",pid=1894694,fd=341))"
  const m = raw.trim().match(/^(\S+)\s+(\S+)\s+\d+\s+\d+\s+(\S+)\s+(\S+)(?:\s+users:\(\("([^"]+)",pid=(\d+)\)\))?/);
  if (!m) return null;
  const protocol = m[1].toLowerCase();
  const state = m[2];
  const local = m[3];
  const remote = m[4];
  const process = m[5] || '';
  const pid = m[6] ? Number(m[6]) : 0;
  // Extract port from local address
  const localParts = local.split(':');
  const port = localParts.length > 1 ? localParts[localParts.length - 1] : local;
  return { protocol, state, local, remote, process, pid, port };
}

// 子进程/线程
const childrenVisible = ref(false);
const threadsVisible = ref(false);
const netDetailsVisible = ref(false);
const netDetailsRows = ref<any[]>([]);
const netEditVisible = ref(false);
const netEditForm = reactive({ ifname: '', ipMode: 'static', dnsMode: 'static', ip: '', mask: '', gateway: '', dns1: '', dns2: '' });
const netEditLoading = ref(false);
const netCtxMenu = reactive({ visible: false, x: 0, y: 0, adapter: null as any });

// File Explorer
const fileExplorerVisible = ref(false);
const currentPath = ref('/');
const pathInput = ref('/');
const fileList = ref<any[]>([]);
const fileLoading = ref(false);
const selectedFile = ref('');
const feView = ref<'list' | 'detail' | 'icon'>('detail');
const fileSortBy = ref<'name' | 'size' | 'modified'>('name');
const fileSortDir = ref<'asc' | 'desc'>('asc');
function toggleSort(key: 'name' | 'size' | 'modified') {
  if (fileSortBy.value === key) { fileSortDir.value = fileSortDir.value === 'asc' ? 'desc' : 'asc'; }
  else { fileSortBy.value = key; fileSortDir.value = key === 'name' ? 'asc' : 'desc'; }
}
const sortedFiles = computed(() => {
  const list = [...fileList.value];
  const dirs = list.filter(f => f.isDir);
  const files = list.filter(f => !f.isDir);
  const sortArr = (arr: any[]) => {
    arr.sort((a, b) => {
      let cmp = 0;
      if (fileSortBy.value === 'name') cmp = a.name.localeCompare(b.name);
      else if (fileSortBy.value === 'size') cmp = (a.size || 0) - (b.size || 0);
      else if (fileSortBy.value === 'modified') cmp = new Date(a.modified || 0).getTime() - new Date(b.modified || 0).getTime();
      return fileSortDir.value === 'asc' ? cmp : -cmp;
    });
    return arr;
  };
  return [...sortArr(dirs), ...sortArr(files)];
});
const fileCtxMenu = reactive({ visible: false, x: 0, y: 0, file: null as any });
const feProgress = reactive({ visible: false, text: '', percent: 0 });
const batchMode = ref(false);
const checkedFiles = ref<Set<string>>(new Set());
const feFilter = ref('');

const isWindowsHost = computed(() => (props.hostOsType || '').toUpperCase() === 'WINDOWS');

function normalizePath(p: string): string {
  if (!p) return '/';
  if (isWindowsHost.value) {
    // C: -> C:\, C:/Windows -> C:\Windows
    if (/^[a-zA-Z]:$/.test(p)) return p.toUpperCase() + '\\';
    return p.replace(/\//g, '\\');
  }
  return p;
}

function pathJoin(base: string, name: string): string {
  if (isWindowsHost.value) {
    if (!base || /^[a-zA-Z]:\\?$/.test(base)) return (base || 'C:\\') + name;
    return base.replace(/\\+$/, '') + '\\' + name;
  }
  if (!base || base === '/') return '/' + name;
  return base.replace(/\/+$/, '') + '/' + name;
}

// Inline editing
const editingNew = ref(false);
const renamingFile = ref('');
const inlineName = ref('');
const inlineInputRef = ref<HTMLInputElement | null>(null);

// Chmod dialog
const chmodDialog = reactive({ visible: false, target: '' });
const chmodValues = reactive({
  ownerRead: true, ownerWrite: true, ownerExec: false,
  groupRead: true, groupWrite: false, groupExec: false,
  otherRead: true, otherWrite: false, otherExec: false,
});

const chmodOctal = computed(() => {
  const o = (chmodValues.ownerRead ? 4 : 0) + (chmodValues.ownerWrite ? 2 : 0) + (chmodValues.ownerExec ? 1 : 0);
  const g = (chmodValues.groupRead ? 4 : 0) + (chmodValues.groupWrite ? 2 : 0) + (chmodValues.groupExec ? 1 : 0);
  const t = (chmodValues.otherRead ? 4 : 0) + (chmodValues.otherWrite ? 2 : 0) + (chmodValues.otherExec ? 1 : 0);
  return '' + o + g + t;
});
const chmodSymbolic = computed(() => {
  const r = (b: boolean) => b ? 'r' : '-';
  const w = (b: boolean) => b ? 'w' : '-';
  const x = (b: boolean) => b ? 'x' : '-';
  return r(chmodValues.ownerRead) + w(chmodValues.ownerWrite) + x(chmodValues.ownerExec) +
         r(chmodValues.groupRead) + w(chmodValues.groupWrite) + x(chmodValues.groupExec) +
         r(chmodValues.otherRead) + w(chmodValues.otherWrite) + x(chmodValues.otherExec);
});

function formatFileSize(size: any): string {
  const n = Number(size);
  if (isNaN(n) || n === 0) return '0 B';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + ' MB';
  return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
}

function openFileExplorer(path: string) {
  currentPath.value = normalizePath(path);
  pathInput.value = currentPath.value;
  fileExplorerVisible.value = true;
  loadFiles();
}

function navigateTo(path: string) {
  if (!path) path = '/';
  if (isWindowsHost.value) {
    path = normalizePath(path);
  } else if (path !== '/' && !path.startsWith('/')) {
    path = '/' + path;
  }
  currentPath.value = path;
  pathInput.value = path;
  selectedFile.value = '';
  loadFiles();
}

function openDir(name: string) {
  if (name === '.') return;
  if (name === '..') {
    navigateTo(parentPath.value);
    return;
  }
  navigateTo(pathJoin(currentPath.value, name));
}

const parentPath = computed(() => {
  if (isWindowsHost.value) {
    const p = currentPath.value;
    if (/^[a-zA-Z]:\\?$/.test(p)) return p;
    const idx = p.lastIndexOf('\\');
    if (idx < 3) return p.substring(0, 2).toUpperCase() + '\\';
    return p.substring(0, idx);
  }
  if (currentPath.value === '/') return '/';
  return currentPath.value.replace(/\/[^/]+$/, '') || '/';
});

const breadcrumbs = computed(() => {
  if (isWindowsHost.value) {
    const p = currentPath.value;
    const result: { name: string; path: string }[] = [];
    // Drive root
    const driveMatch = p.match(/^([a-zA-Z]:\\?)/);
    if (driveMatch) {
      const drive = driveMatch[1].toUpperCase();
      result.push({ name: drive, path: drive });
      const rest = p.substring(drive.length);
      if (rest) {
        const parts = rest.split('\\').filter(Boolean);
        let acc = drive;
        for (const part of parts) {
          acc += part + '\\';
          result.push({ name: part, path: acc });
        }
      }
    }
    return result;
  }
  const parts = currentPath.value.split('/').filter(Boolean);
  const result: { name: string; path: string }[] = [{ name: '/', path: '/' }];
  let acc = '';
  for (const p of parts) {
    acc += '/' + p;
    result.push({ name: p, path: acc });
  }
  return result;
});

async function loadFiles() {
  fileLoading.value = true;
  try {
    const r = await fetch(`/ms/system/files/list?hostId=${props.hostId}&path=${encodeURIComponent(currentPath.value)}`);
    const j = await r.json();
    fileList.value = (j.data || []).filter((f: any) => f.name !== '.' && f.name !== '..');
  } catch (e) {
    fileList.value = [];
  } finally {
    fileLoading.value = false;
  }
}

function onFeScroll(e: Event) {
  // Simple scroll-based load-more hook (API returns all files, this is a placeholder for future)
}

function showFileCtx(e: MouseEvent, file: any) {
  if (file && (file.name === '.' || file.name === '..')) return;
  // 防止右键菜单超出视口
  const menuW = 160, menuH = 300;
  let x = e.clientX, y = e.clientY;
  if (x + menuW > window.innerWidth) x = window.innerWidth - menuW - 8;
  if (y + menuH > window.innerHeight) y = window.innerHeight - menuH - 8;
  fileCtxMenu.x = x;
  fileCtxMenu.y = y;
  fileCtxMenu.file = file;
  fileCtxMenu.visible = true;
}

async function feExec(cmd: string) {
  try {
    const r = await fetch(`/ms/system/files/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostId: props.hostId, cmd, cwd: currentPath.value })
    });
    const j = await r.json();
    return j;
  } catch (e) { return { code: -1, msg: String(e) }; }
}

function ctxOpen() {
  fileCtxMenu.visible = false;
  const f = fileCtxMenu.file;
  if (!f) return;
  if (f.isDir) openDir(f.name);
}

function startRename(fname: string) {
  fileCtxMenu.visible = false;
  renamingFile.value = fname;
  inlineName.value = fname;
  setTimeout(() => {
    inlineInputRef.value?.focus();
    inlineInputRef.value?.select();
  }, 50);
}

async function commitRename() {
  const oldName = renamingFile.value;
  const newName = inlineName.value.trim();
  renamingFile.value = '';
  if (!oldName || !newName || newName === oldName) return;
  await feExec(`mv "${oldName}" "${newName}"`);
  loadFiles();
}

async function commitNew() {
  const name = inlineName.value.trim();
  editingNew.value = false;
  if (!name) return;
  await feExec(`mkdir "${name}"`);
  loadFiles();
}

function cancelInline() {
  editingNew.value = false;
  renamingFile.value = '';
}

function ctxRename() {
  fileCtxMenu.visible = false;
  const f = fileCtxMenu.file;
  if (!f) return;
  startRename(f.name);
}

async function ctxDelete() {
  fileCtxMenu.visible = false;
  const f = fileCtxMenu.file;
  if (!f) return;
  if (!confirm(`确定删除 ${f.name}？`)) return;
  await feExec(`rm -rf "${f.name}"`);
  loadFiles();
}

function toggleBatch() {
  batchMode.value = !batchMode.value;
  if (!batchMode.value) checkedFiles.value.clear();
}

function toggleCheck(name: string) {
  if (checkedFiles.value.has(name)) checkedFiles.value.delete(name);
  else checkedFiles.value.add(name);
}

async function batchDelete() {
  const names = Array.from(checkedFiles.value);
  if (!names.length) return;
  if (!confirm(`确定删除选中的 ${names.length} 个项目？`)) return;
  const safe = names.map(n => `'${n.replace(/'/g, `'\\''`)}'`).join(' ');
  await feExec(`rm -rf ${safe}`);
  checkedFiles.value.clear();
  loadFiles();
}

function ctxNewFolder() {
  fileCtxMenu.visible = false;
  editingNew.value = true;
  inlineName.value = '';
  setTimeout(() => {
    inlineInputRef.value?.focus();
  }, 50);
}

function ctxChmod() {
  fileCtxMenu.visible = false;
  const f = fileCtxMenu.file;
  const target = f ? f.name : '.';
  chmodDialog.target = target;
  // Parse existing perms like "drwxr-xr-x"
  const p = f?.perms || 'drwxr-xr-x';
  const isDir = p.startsWith('d');
  const rest = p.slice(1);
  chmodValues.ownerRead = rest[0] === 'r';
  chmodValues.ownerWrite = rest[1] === 'w';
  chmodValues.ownerExec = rest[2] === 'x' || rest[2] === 's' || rest[2] === 'S';
  chmodValues.groupRead = rest[3] === 'r';
  chmodValues.groupWrite = rest[4] === 'w';
  chmodValues.groupExec = rest[5] === 'x' || rest[5] === 's' || rest[5] === 'S';
  chmodValues.otherRead = rest[6] === 'r';
  chmodValues.otherWrite = rest[7] === 'w';
  chmodValues.otherExec = rest[8] === 'x' || rest[8] === 't' || rest[8] === 'T';
  chmodDialog.visible = true;
}

async function applyChmod() {
  await feExec(`chmod ${chmodOctal.value} "${chmodDialog.target}"`);
  chmodDialog.visible = false;
  loadFiles();
}

// F2 key handler for file explorer
function onKeydown(e: KeyboardEvent) {
  if (!fileExplorerVisible.value) return;
  if (e.key === 'F2' && selectedFile.value && renamingFile.value === '' && !editingNew.value) {
    e.preventDefault();
    startRename(selectedFile.value);
  }
}

function ctxUpload() {
  fileCtxMenu.visible = false;
  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = true;
  input.onchange = async () => {
    const files = Array.from(input.files || []);
    for (let fi = 0; fi < files.length; fi++) {
      const file = files[fi];
      const fd = new FormData();
      fd.append('file', file);
      fd.append('hostId', String(props.hostId));
      fd.append('path', pathJoin(currentPath.value, file.name));
      feProgress.value = { visible: true, text: `上传 ${file.name} (${fi+1}/${files.length})`, percent: 0 };
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          feProgress.value.percent = Math.round(e.loaded / e.total * 100);
        }
      };
      await new Promise<void>((resolve) => {
        xhr.onload = () => { feProgress.value.percent = 100; resolve(); };
        xhr.onerror = () => resolve();
        xhr.open('POST', '/ms/system/files/upload');
        xhr.send(fd);
      });
      await new Promise(r => setTimeout(r, 200));
    }
    feProgress.value.visible = false;
    loadFiles();
  };
  input.click();
}

function ctxDownload() {
  fileCtxMenu.visible = false;
  const f = fileCtxMenu.file;
  if (!f) return;
  const isDir = f.isDir;
  feProgress.value = { visible: true, text: `正在下载 ${f.name}...`, percent: 0 };
  const url = `/ms/system/files/download?hostId=${props.hostId}&path=${encodeURIComponent(pathJoin(currentPath.value, f.name))}`;
  const xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  xhr.responseType = 'blob';
  xhr.onprogress = (e) => {
    if (e.lengthComputable) {
      feProgress.value.percent = Math.round(e.loaded / e.total * 100);
    }
  };
  xhr.onload = () => {
    feProgress.value.percent = 100;
    const blob = new Blob([xhr.response]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = isDir ? f.name + '.tar.gz' : f.name;
    a.click();
    URL.revokeObjectURL(a.href);
    setTimeout(() => { feProgress.value.visible = false; }, 800);
  };
  xhr.onerror = () => { feProgress.value.visible = false; ElMessage.error('下载失败'); };
  xhr.send();
}

function isArchive(name?: string): boolean {
  if (!name) return false;
  return /\.(zip|tar|gz|tgz|tar\.gz|bz2|xz|tar\.bz2|tar\.xz|7z|rar)$/i.test(name);
}

async function ctxExtract() {
  fileCtxMenu.visible = false;
  const f = fileCtxMenu.file;
  if (!f) return;
  const name = f.name;
  let cmd: string;
  if (/\.zip$/i.test(name)) cmd = `unzip -o "${name}"`;
  else if (/\.tar\.gz|\.tgz$/i.test(name)) cmd = `tar xzf "${name}"`;
  else if (/\.tar\.bz2|\.tbz2$/i.test(name)) cmd = `tar xjf "${name}"`;
  else if (/\.tar\.xz|\.txz$/i.test(name)) cmd = `tar xJf "${name}"`;
  else if (/\.tar$/i.test(name)) cmd = `tar xf "${name}"`;
  else if (/\.gz$/i.test(name)) cmd = `gunzip -k "${name}"`;
  else if (/\.7z$/i.test(name)) cmd = `7z x "${name}"`;
  else if (/\.rar$/i.test(name)) cmd = `unrar x "${name}"`;
  else return;
  feProgress.value = { visible: true, text: `正在解压 ${name}...`, percent: 50 };
  await feExec(cmd);
  feProgress.value = { visible: true, text: `解压完成 ${name}`, percent: 100 };
  setTimeout(() => { feProgress.value.visible = false; }, 1500);
  loadFiles();
}

function showNetCtxMenu(e: MouseEvent, adapter: any) {
  netCtxMenu.x = e.clientX;
  netCtxMenu.y = e.clientY;
  netCtxMenu.adapter = adapter;
  netCtxMenu.visible = true;
}

function showNetDetails(adapter: any) {
  if (!adapter) return;
  const addrs = adapter.addr_info || adapter.addresses || [];
  const ipv4 = addrs.filter((a: any) => a.family === 'inet').map((a: any) => a.local).join(', ') || '-';
  const ipv6 = addrs.filter((a: any) => a.family === 'inet6').map((a: any) => a.local).join(', ') || '-';
  netDetailsRows.value = [
    { label: '描述', value: adapter.ifname || adapter.Name || '-' },
    { label: '物理地址', value: adapter.macAddress || adapter.address || '-' },
    { label: '已启用 DHCP', value: '否' },
    { label: 'IPv4 地址', value: ipv4 },
    { label: 'IPv6 地址', value: ipv6 },
    { label: 'MTU', value: String(adapter.mtu || '-') },
    { label: '接口索引', value: String(adapter.ifindex || adapter.ifIndex || '-') },
    { label: '操作状态', value: adapter.operstate || adapter.Status || '-' },
    { label: '链路类型', value: adapter.link_type || '-' },
    { label: 'TX 队列长度', value: String(adapter.txqlen || '-') },
  ];
  netDetailsVisible.value = true;
}

function getAdapterIPv4(adapter: any): string {
  const addrs = adapter.addr_info || adapter.addresses || [];
  const v4 = addrs.find((a: any) => a.family === 'inet');
  return v4 ? v4.local : '-';
}

function showNetEdit(adapter: any) {
  if (!adapter) return;
  const addrs = adapter.addr_info || adapter.addresses || [];
  const v4 = addrs.find((a: any) => a.family === 'inet');
  netEditForm.ifname = adapter.ifname || '';
  netEditForm.ipMode = 'static';
  netEditForm.dnsMode = 'static';
  netEditForm.ip = v4 ? v4.local : '';
  netEditForm.mask = v4 && v4.prefixlen ? prefixToMask(v4.prefixlen) : '';
  netEditForm.gateway = '';
  netEditForm.dns1 = '';
  netEditForm.dns2 = '';
  netEditVisible.value = true;
}

function prefixToMask(prefix: number): string {
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return [(mask >>> 24) & 255, (mask >>> 16) & 255, (mask >>> 8) & 255, mask & 255].join('.');
}

async function applyNetEdit() {
  netEditLoading.value = true;
  try {
    const hid = props.hostId;
    const res = await fetch('/ms/system/network/config' + (hid ? `?hostId=${hid}` : ""), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ifname: netEditForm.ifname,
        ipMode: netEditForm.ipMode,
        ip: netEditForm.ip,
        mask: netEditForm.mask,
        gateway: netEditForm.gateway,
        dnsMode: netEditForm.dnsMode,
        dns1: netEditForm.dns1,
        dns2: netEditForm.dns2,
      }),
    });
    const json = await res.json();
    if (json.code === 0 || json.success) {
      ElMessage.success('网络配置已应用');
      netEditVisible.value = false;
      loadData();
    } else {
      ElMessage.error('应用失败: ' + (json.message || '未知错误'));
    }
  } catch (e) {
    ElMessage.error('应用失败: ' + (e as Error).message);
  } finally {
    netEditLoading.value = false;
  }
}
const childrenList = ref<ProcessInfo[]>([]);
const threadsList = ref<ThreadInfo[]>([]);
const currentPid = ref(0);

const isLiveType = computed(() => activeTab.value === "process" || activeTab.value === "service");

// 左侧信息
const osLetter = computed(() => {
  const os = (props.hostOsType || "").toUpperCase();
  if (os.includes("WINDOWS")) return "W";
  if (os.includes("LINUX")) return "L";
  if (os.includes("MAC")) return "M";
  return "?";
});
const osTypeClass = computed(() => {
  const os = (props.hostOsType || "").toUpperCase();
  if (os.includes("WINDOWS")) return "os-win";
  if (os.includes("LINUX")) return "os-linux";
  if (os.includes("MAC")) return "os-mac";
  return "os-unknown";
});
const online = computed(() => props.hostOnline !== false);

const countText = computed(() => {
  if (activeTab.value === "disk") return `共 ${diskList.length} 块磁盘`;
  return `共 ${dataList.length} 条`;
});

function onTabChange(name: string) {
  activeTab.value = name;
  skipPageWatch = true;
  currentPage.value = 1;
  if (name !== "info") loadData();
}

function onPageChange(page: number | { page: number }) {
  const p = typeof page === 'object' ? page.page : page;
  currentPage.value = p;
  loadData();
}

async function refreshHostInfo() {
  refreshingInfo.value = true;
  try {
    const hid = props.hostId;
    const res = await fetch("/ms/system/host-info" + (hid ? `?hostId=${hid}&refresh=true` : ""));
    const json = await res.json();
    const info = json.data;
    if (info) {
      if (info.hostname) document.title = `主机画像 - ${info.hostname}`;
      if (info.cpuCores != null) localInfo.cpuCores = info.cpuCores;
      if (info.cpuName) localInfo.cpuName = info.cpuName;
      if (info.memoryMb) localInfo.memoryMb = info.memoryMb;
      if (info.publicIp) localInfo.publicIp = info.publicIp;
      if (info.privateIp) localInfo.privateIp = info.privateIp;
      if (info.mac) localInfo.macAddress = info.mac;
      if (info.macAddress) localInfo.macAddress = info.macAddress;
      if (info.osVersion) localInfo.osVersion = info.osVersion;
      if (info.gpu) localInfo.gpuModel = info.gpu;
      if (info.gpuModel) localInfo.gpuModel = info.gpuModel;
      if (info.packageManager) localInfo.packageManager = info.packageManager;
      ElMessage.success("主机信息已刷新");
    }
  } catch (e) {
    ElMessage.error("刷新主机信息失败: " + (e as Error).message);
  } finally {
    refreshingInfo.value = false;
  }
  loadData();
}

// 列定义
const processColumns = [
  { prop: "name", label: "Name", minWidth: 220, slot: "name" },
  { prop: "pid", label: "PID", width: 80 },
  { prop: "cpu", label: "CPU", width: 90, slot: "cpu" },
  { prop: "memory", label: "Private bytes", width: 120, slot: "memory" },
  { prop: "user", label: "User name", width: 150, slot: "user" },
  { prop: "command", label: "Description", minWidth: 150, slot: "desc" },
];

// Build process tree from flat list
const processTreeList = computed(() => {
  const list = dataList.value;
  if (!list || list.length === 0) return [];
  const map = new Map<string, any>();
  const roots: any[] = [];
  list.forEach((p: any) => {
    map.set(String(p.pid), { ...p, children: null });
  });
  list.forEach((p: any) => {
    const node = map.get(String(p.pid));
    const pp = String(p.ppid || p.PPID || '');
    if (pp && map.has(pp) && map.get(pp) !== node) {
      const parent = map.get(pp);
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  // Sort roots by cpu desc
  roots.sort((a, b) => Number(b.cpu || 0) - Number(a.cpu || 0));
  return roots;
});

const threadColumns = [
  { prop: "Id", label: "TID", width: 80 },
  { prop: "PriorityLevel", label: "优先级", width: 80 },
  { prop: "ThreadState", label: "状态", width: 100, formatter: (r: any) => threadStateText(r.ThreadState) },
  { prop: "WaitReason", label: "等待原因", width: 100, formatter: (r: any) => waitReasonText(r.WaitReason) },
  { prop: "TotalProcessorTime", label: "CPU 时间", width: 120, formatter: (r: any) => formatCpuTime(r.TotalProcessorTime) },
];

const serviceColumns = [
  { prop: "Name", label: "服务名称", width: 180 },
  { prop: "DisplayName", label: "显示名称", minWidth: 220, showOverflowTooltip: true },
  { prop: "Status", label: "状态", width: 100, slot: "status" },
  { prop: "StartType", label: "启动类型", width: 90, formatter: (r: any) => startTypeText(r.StartType) },
  { prop: "actions", label: "操作", width: 150, fixed: "right", slot: "actions" },
];

const networkInterfaceColumns = [
  { prop: "Name", label: "名称", width: 180, formatter: (r: any) => r.Name || r.ifname || r.interface || "-" },
  { prop: "InterfaceDescription", label: "描述", minWidth: 220, showOverflowTooltip: true, formatter: (r: any) => r.InterfaceDescription || r.type || "-" },
  { prop: "Status", label: "状态", width: 90, formatter: (r: any) => r.Status || r.operstate || r.state || "-" },
  { prop: "MacAddress", label: "MAC 地址", width: 160, formatter: (r: any) => r.MacAddress || r.address || r.mac || "-" },
  { prop: "LinkSpeed", label: "链路速度", width: 100, formatter: (r: any) => r.LinkSpeed || r.mtu || "-" },
];

const networkConnectionColumns = [
  { prop: "LocalAddress", label: "本地地址", width: 160, formatter: (r: any) => `${r.LocalAddress || r.local || r.localAddress || ''}:${r.LocalPort || r.localPort || ''}` },
  { prop: "RemoteAddress", label: "远程地址", width: 160, formatter: (r: any) => `${r.RemoteAddress || r.peer || r.remoteAddress || ''}:${r.RemotePort || r.remotePort || ''}` },
  { prop: "State", label: "状态", width: 100, formatter: (r: any) => tcpStateText(r.State ?? r.state ?? r.tcpState) },
  { prop: "OwningProcess", label: "PID", width: 80, formatter: (r: any) => r.OwningProcess || r.pid || "-" },
];

const firewallColumns = [
  { prop: "DisplayName", label: "规则名称", minWidth: 200, showOverflowTooltip: true, formatter: (r: any) => r.DisplayName || r.chain || r.rule || r.target || "-" },
  { prop: "Direction", label: "方向", width: 80, formatter: (r: any) => { if (r.Direction != null) return r.Direction === 1 ? "入站" : "出站"; return r.chain || r.direction || "-"; } },
  { prop: "Action", label: "动作", width: 80, formatter: (r: any) => { if (r.Action != null) return r.Action === 1 ? "允许" : "阻止"; return r.target || r.action || "-"; } },
  { prop: "Enabled", label: "启用", width: 80, formatter: (r: any) => { if (r.Enabled != null) return r.Enabled === 1 ? "是" : "否"; return r.num || r.enabled || "-"; } },
];

const driverColumns = [
  { prop: "Name", label: "驱动名", width: 200, formatter: (r: any) => r.Name || r.module || r.name || "-" },
  { prop: "ClassName", label: "类别", width: 120, formatter: (r: any) => r.ClassName || r.size || "-" },
  { prop: "ProviderName", label: "提供商", width: 120, formatter: (r: any) => r.ProviderName || r.used || "-" },
  { prop: "OriginalFileName", label: "驱动文件", minWidth: 250, showOverflowTooltip: true, formatter: (r: any) => r.OriginalFileName || r.by || "-" },
  { prop: "BootCritical", label: "关键", width: 80, formatter: (r: any) => { if (r.BootCritical != null) return r.BootCritical ? "是" : "否"; return "-"; } },
];

const envColumns = [
  { prop: "name", label: "变量名", width: 280 },
  { prop: "value", label: "变量值", minWidth: 400 },
];

// 远控/SIP 配置表单
const configForm = reactive({
  protocol: "host",
  host: "",
  port: 22,
  username: "",
  password: "",
  remoteEnabled: true,
  sipEnabled: false,
  sipHost: "",
  sipPort: "7822",
  sipSecret: "",
  sipLocalPort: "",
  sipDeploy: "builtin",
});

async function saveConfig() {
  ElMessage.success("配置已保存");
}

function exportSipTars() {
  ElMessage.info("SIP 部署包导出功能开发中");
}

// ==================== 工具函数 ====================

function formatBytes(bytes: any): string {
  if (bytes == null || bytes === '') return "-";
  if (typeof bytes === 'string') return bytes;
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

function formatMem(b: number): string {
  if (!b) return "0";
  // OSHI 返回字节，Linux SSH 返回 MB，统一按字节处理
  const mb = b > 1048576 ? b / 1048576 : b;
  if (mb < 1024) return mb.toFixed(0) + " MB";
  return (mb / 1024).toFixed(2) + " GB";
}

function usePct(p: any): number {
  if (p.usePercent != null) {
    const n = parseFloat(String(p.usePercent).replace('%', ''));
    return isNaN(n) ? 0 : n;
  }
  if (!p.Size) return 0;
  return ((p.Size - (p.SizeRemaining || 0)) / p.Size) * 100;
}

function tcpStateText(s: any): string {
  const map: Record<number, string> = {
    1: "CLOSED", 2: "LISTEN", 3: "SYN_SENT", 4: "SYN_RCVD",
    5: "ESTAB", 6: "FIN_WAIT1", 7: "FIN_WAIT2", 8: "CLOSE_WAIT",
    9: "CLOSING", 10: "LAST_ACK", 11: "TIME_WAIT", 12: "DELETE_TCB", 100: "LISTEN",
  };
  if (typeof s === "number") return map[s] ?? String(s);
  return String(s ?? "-");
}

function serviceStatusText(s: any): string {
  if (s === 1 || s === "Running") return "运行中";
  if (s === 4 || s === "Stopped") return "已停止";
  return String(s ?? "-");
}

function startTypeText(t: any): string {
  const map: Record<number, string> = { 2: "自动", 3: "手动", 4: "禁用" };
  if (typeof t === "number") return map[t] ?? String(t);
  return String(t ?? "-");
}

function threadStateText(s: any): string {
  const map: Record<number, string> = {
    0: "初始化", 1: "就绪", 2: "运行中", 3: "挂起",
    4: "已终止", 5: "等待", 6: "切换中", 7: "未知",
  };
  if (typeof s === "number") return map[s] ?? String(s);
  return String(s ?? "-");
}

function waitReasonText(s: any): string {
  const map: Record<number, string> = {
    0: "Executive", 1: "FreePage", 2: "PageIn", 3: "Allocation",
    4: "Suspension", 5: "UserRequest", 6: "EventPairLow", 7: "EventPairHigh",
    8: "LpcReceive", 9: "LpcReply", 10: "VirtualMemory", 11: "PageOut",
    12: "Unknown", 13: "WrEvent", 14: "WrRequest", 15: "WrResource",
    16: "WrPushLock", 17: "WrMutex", 18: "WrSemaphore", 19: "WrQueue",
    20: "WrGetMessage", 21: "WrDelayExecution",
  };
  if (typeof s === "number") return map[s] ?? String(s);
  return String(s ?? "-");
}

function formatCpuTime(t: any): string {
  if (!t || typeof t !== "object") return "-";
  const totalSeconds = Number(t.TotalSeconds ?? 0);
  if (totalSeconds < 60) return totalSeconds.toFixed(1) + "s";
  if (totalSeconds < 3600) return (totalSeconds / 60).toFixed(1) + "m";
  return (totalSeconds / 3600).toFixed(1) + "h";
}

function isRunning(row: any): boolean {
  return row.Status === 1 || row.Status === "Running";
}

function onSortChange({ prop, order }: { prop: string; order: string }) {
  sortBy.value = prop;
  sortOrder.value = order === "ascending" ? "asc" : "desc";
  loadData();
}

function onAutoRefresh(v: boolean) {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  if (v) {
    autoTimer = setInterval(() => { if (visible.value) loadData(); }, autoInterval.value);
  }
}
watch(autoInterval, () => {
  if (autoRefresh.value) onAutoRefresh(true);
});

async function loadData() {
  console.log('[SystemManageDialog] loadData called, activeTab=', activeTab.value, 'hostId=', props.hostId);
  loading.value = true;
  try {
    const hid = props.hostId;
    switch (activeTab.value) {
      case "process": {
        const params = new URLSearchParams();
        if (tabFilter.value) params.set('keyword', tabFilter.value);
        if (sortBy.value) params.set('sortBy', sortBy.value);
        if (sortOrder.value) params.set('sortOrder', sortOrder.value);
        params.set('page', '1');
        params.set('pageSize', '10000');
        if (hid) params.set('hostId', String(hid));
        const res = await fetch('/ms/system/processes?' + params.toString());
        const json = await res.json();
        const d = json.data || {};
        dataList.value = d.list || [];
        totalCount.value = d.total || 0;
        break;
      }
      case "service": {
        const params = new URLSearchParams();
        if (tabFilter.value) params.set('keyword', tabFilter.value);
        params.set('page', '1');
        params.set('pageSize', '10000');
        if (hid) params.set('hostId', String(hid));
        const res = await fetch('/ms/system/services?' + params.toString());
        const json = await res.json();
        const d = json.data || {};
        dataList.value = d.list || [];
        totalCount.value = d.total || 0;
        break;
      }
      case "network-interface": {
        const res = await fetch('/ms/system/network/interfaces' + (hid ? `?hostId=${hid}` : ""));
        const json = await res.json();
        dataList.value = json.data || [];
        totalCount.value = 0;
        break;
      }
      case "network-connection": {
        const res = await fetch('/ms/system/network/connections' + (hid ? `?hostId=${hid}` : ""));
        const json = await res.json();
        dataList.value = json.data || [];
        totalCount.value = 0;
        break;
      }
      case "disk": {
        const diskUrl = "/ms/system/disks" + (hid ? `?hostId=${hid}` : "");
        const diskRes = await fetch(diskUrl);
        const diskJson = await diskRes.json();
        const raw = diskJson.data || [];
        // 过滤 tmpfs/loop/udev 等虚拟文件系统
        const real = raw.filter((d: any) => {
          const fs = String(d.filesystem || d.FriendlyName || d.name || '');
          return !fs.startsWith('tmpfs') && !fs.startsWith('loop') && !fs.startsWith('udev') && !fs.startsWith('devtmpfs');
        });
        diskList.value = real.map((d: any) => {
          // Windows/local OSHI 格式: totalGb/usedGb/usage/name/mount/fsType/label
          if (d.totalGb != null || d.usedGb != null) {
            return {
              FriendlyName: d.label || d.name || d.mount || '磁盘',
              MediaType: '-', BusType: '-',
              Size: (d.totalGb || 0) * 1024 * 1024 * 1024,
              SizeRemaining: (d.totalGb - d.usedGb || 0) * 1024 * 1024 * 1024,
              usePercent: d.usage || 0,
              HealthStatus: '-',
              FileSystem: d.fsType || '',
              mount: d.mount || '',
            };
          }
          // Windows WinRM 格式: mount=C:, name=C:\, size="194.97 G", avail="87.64 G"
          if (d.mount && /^[A-Za-z]:$/.test(String(d.mount))) {
            return {
              FriendlyName: d.name || (d.mount + '\\'),
              MediaType: '-', BusType: '-',
              Size: d.size, SizeRemaining: d.avail,
              usePercent: parseFloat(String(d['use%'] || '0').replace('%', '')) || 0,
              HealthStatus: '-', FileSystem: '', mount: d.mount + '\\',
            };
          }
          // Linux df 格式: filesystem/size(bytes)/used/avail(bytes)/use%/mount
          return {
            FriendlyName: d.mount || d.filesystem || '磁盘',
            MediaType: '-', BusType: '-',
            Size: d.size || 0,
            SizeRemaining: d.avail || 0,
            usePercent: parseFloat(String(d['use%'] || '0').replace('%', '')) || 0,
            HealthStatus: '-',
            FileSystem: d.filesystem || '',
            mount: d.mount || '',
          };
        });
        totalCount.value = 0;
        break;
      }
      case "netproc": {
        const res = await fetch("/ms/system/netproc" + (hid ? `?hostId=${hid}` : ""));
        const json = await res.json();
        const rawList = json.data || [];
        netprocList.value = rawList.map(parseNetprocRaw).filter(Boolean);
        dataList.value = netprocList.value;
        totalCount.value = 0;
        break;
      }
      case "env": {
        const res = await fetch("/ms/system/env" + (hid ? `?hostId=${hid}` : ""));
        const json = await res.json();
        dataList.value = json.data || [];
        break;
      }
    }
  } catch (e) {
    console.error("加载数据失败", e);
    ElMessage.error("加载失败: " + (e as Error).message);
    dataList.value = [];
  } finally {
    loading.value = false;
  }
}

async function doKill(row: ProcessInfo) {
  if (!confirm(`确认关闭进程 ${row.name} (PID ${row.pid})?`)) return;
  await killProcess(row.pid);
  loadData();
}

async function doRestart(row: ProcessInfo) {
  if (!confirm(`确认重启进程 ${row.name} (PID ${row.pid})?`)) return;
  try {
    await fetch(`/ms/system/process/restart?hostId=${props.hostId}&pid=${row.pid}`, { method: 'POST' });
    setTimeout(loadData, 2000);
  } catch (e) { alert('重启失败'); }
}

function onProcContextMenu(row: any, column: any, event: MouseEvent) {
  event.preventDefault();
  const menu = document.createElement('div');
  menu.style.cssText = 'position:fixed;z-index:99999;background:#fff;border:1px solid #e2e8f0;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.12);padding:4px 0;min-width:180px;font-size:13px;';
  const addItem = (label: string, color: string, fn: () => void) => {
    const item = document.createElement('div');
    item.textContent = label;
    item.style.cssText = `padding:6px 16px;cursor:pointer;color:${color};`;
    item.onmouseenter = () => item.style.background = '#f1f5f9';
    item.onmouseleave = () => item.style.background = '#fff';
    item.onclick = () => { document.body.removeChild(menu); fn(); };
    menu.appendChild(item);
  };
  addItem(`结束进程 (PID ${row.pid})`, '#dc2626', () => doKill(row));
  addItem(`重启进程`, '#2563eb', () => doRestart(row));
  menu.style.left = event.clientX + 'px';
  menu.style.top = event.clientY + 'px';
  document.body.appendChild(menu);
  const close = (e: MouseEvent) => { if (!menu.contains(e.target as Node)) { document.body.removeChild(menu); document.removeEventListener('click', close); } };
  setTimeout(() => document.addEventListener('click', close), 0);
}

async function openChildren(row: ProcessInfo) {
  currentPid.value = row.pid;
  childrenList.value = await fetchProcessChildren(row.pid);
  childrenVisible.value = true;
}

async function openThreads(row: ProcessInfo) {
  currentPid.value = row.pid;
  threadsList.value = await fetchProcessThreads(row.pid);
  threadsVisible.value = true;
}

async function doStart(row: any) {
  await startService(row.Name);
  loadData();
}

async function doStop(row: any) {
  if (!confirm(`确认停止服务 ${row.Name}?`)) return;
  await stopService(row.Name);
  loadData();
}


function resetState() {
  dataList.value = [];
  diskList.value = [];
  currentPage.value = 1;
  tabFilter.value = '';
  autoRefresh.value = false;
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  localInfo.cpuCores = ''; localInfo.cpuName = ''; localInfo.memoryMb = 0;
  localInfo.publicIp = ''; localInfo.privateIp = ''; localInfo.macAddress = '';
  localInfo.osVersion = ''; localInfo.gpuModel = ''; localInfo.packageManager = '';
  currentPath.value = '/';
  fileList.value = [];
  fileExplorerVisible.value = false;
  checkedFiles.value.clear();
  batchMode.value = false;
}

watch(visible, v => {
  if (v) {
    resetState();
    activeTab.value = "disk";
    nextTick(() => { loadData(); loadHostInfo(); });
  }
});

async function loadHostInfo() {
  try {
    const hid = props.hostId;
    if (!hid) return;
    const res = await fetch(`/ms/system/host-info?hostId=${hid}`);
    const json = await res.json();
    const info = json.data;
    if (info) {
      if (info.cpuCores != null) localInfo.cpuCores = info.cpuCores;
      if (info.cpuName) localInfo.cpuName = info.cpuName;
      if (info.memoryMb) localInfo.memoryMb = info.memoryMb;
      if (info.publicIp) localInfo.publicIp = info.publicIp;
      if (info.privateIp) localInfo.privateIp = info.privateIp;
      if (info.mac) localInfo.macAddress = info.mac;
      if (info.macAddress) localInfo.macAddress = info.macAddress;
      if (info.osVersion) localInfo.osVersion = info.osVersion;
      if (info.gpu) localInfo.gpuModel = info.gpu;
      if (info.gpuModel) localInfo.gpuModel = info.gpuModel;
      if (info.packageManager) localInfo.packageManager = info.packageManager;
    }
  } catch (e) { /* silent */ }
}

watch(() => props.hostId, () => {
  if (visible.value) loadData();
});

watch(() => props.type, () => {
  if (visible.value && props.type) {
    const map: Record<string, string> = {
      process: "process", service: "service", disk: "disk",
      "network-interface": "network-interface", firewall: "firewall", driver: "driver",
    };
    activeTab.value = map[props.type] || "disk";
    loadData();
  }
});

onUnmounted(() => {
  if (autoTimer) clearInterval(autoTimer);
  document.removeEventListener('keydown', onKeydown);
});
document.addEventListener('keydown', onKeydown);
</script>

<style>
/* 全局覆盖：紧凑画像对话框 */
.el-dialog.koi-dialog-shell:has(.host-profile) .el-dialog__header {
  padding: 8px 16px 0 !important;
  margin-right: 0 !important;
}
.el-dialog.koi-dialog-shell:has(.host-profile) .el-dialog__title {
  font-size: 14px !important;
}
</style>

<style scoped>
.body-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
  border-bottom: 1px solid #e2e8f0;
}
.host-profile {
  display: flex;
  gap: 16px;
  padding: 12px 16px 16px;
}

/* 配置面板 */
.config-panel {
  padding: 8px 0;
  max-width: 600px;
}
.config-section { margin-bottom: 20px; }
.config-section h4 {
  font-size: 14px; font-weight: 600; margin: 0 0 10px;
  padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;
}
.config-desc {
  font-size: 12px; color: #94a3b8; margin: 0 0 12px; line-height: 1.5;
}
.config-form { display: flex; flex-direction: column; gap: 12px; }
.form-row { display: flex; align-items: center; gap: 12px; }
.form-row label { width: 120px; font-size: 13px; color: #64748b; flex-shrink: 0; }
.config-actions { margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0; }

/* 左侧信息栏 */
.profile-sidebar {
  width: 230px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--bg-elevated, #f8fafc);
  border-radius: 12px;
  border: 1px solid var(--border-subtle, #e2e8f0);
}
.profile-os {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle, #e2e8f0);
}
.os-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}
.os-win { background: linear-gradient(135deg, #0078d4, #106ebe); }
.os-linux { background: linear-gradient(135deg, #e67e22, #d35400); }
.os-mac { background: linear-gradient(135deg, #6c757d, #495057); }
.os-unknown { background: linear-gradient(135deg, #94a3b8, #64748b); }
.os-name {
  font-size: 13px;
  font-weight: 600;
}
.profile-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
}
.st-online { background: #dcfce7; color: #166534; }
.st-offline { background: #fee2e2; color: #991b1b; }
.st-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.profile-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
}
.info-label { color: #94a3b8; flex-shrink: 0; }
.info-val { color: #0f172a; font-weight: 500; text-align: right; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.info-sub { display: block; font-size: 11px; color: #64748b; font-weight: 400; margin-top: 1px; }
.mono { font-family: "JetBrains Mono", monospace; }

/* 右侧主区 */
.profile-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.profile-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.profile-tabs { flex: 1; min-height: 0; }
.sys-mgr-count { margin-left: auto; font-size: 12px; color: #94a3b8; }
.toolbar-auto { display: flex; align-items: center; gap: 6px; }
.auto-label { font-size: 12px; color: #64748b; }
.auto-interval { font-size: 11px; color: #94a3b8; }

/* Skeleton loading */
.skeleton-list { padding: 12px; display: flex; flex-direction: column; gap: 16px; }
.skeleton-row { padding: 12px; border-radius: 8px; background: #f8fafc; }
.sk-bar { background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%); background-size: 200% 100%; animation: sk-shimmer 1.4s infinite linear; border-radius: 4px; }
@keyframes sk-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
.proc-name { font-weight: 500; }
.proc-args { color: #94a3b8; font-weight: 400; font-size: 11px; margin-left: 4px; }
.process-tree-table .el-table__row--level-1 > td { background: #fafbfd; }
.op-cell { display: flex; gap: 4px; flex-wrap: nowrap; }
.op-cell .re-btn { flex-shrink: 0; }
.mgr-table { width: 100%; }
.pager { display: flex; justify-content: flex-end; padding: 8px 0; }

/* 基本信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 8px 0;
}
.info-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
}
.ic-label { font-size: 12px; color: #94a3b8; }
.ic-value { font-size: 15px; font-weight: 600; color: #0f172a; }

/* System Informer 风格 CPU/内存 条形图 */
.bar-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bar-bar {
  flex: 1;
  height: 6px;
  background: var(--tel-border-2, #e2e8f0);
  border-radius: 3px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--brand-500, #6366f1);
  border-radius: 3px;
  transition: width 0.3s;
}
.bar-bar-mem {
  background: var(--tel-border-2, #e2e8f0);
}
.bar-fill-mem {
  background: var(--success-500, #10b981);
}
.bar-text {
  width: 48px;
  text-align: right;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--tel-text-1, #1e293b);
}

/* 服务状态 */
.svc-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
}
.svc-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.svc-running .svc-dot {
  background: #10b981;
  box-shadow: 0 0 4px rgba(16,185,129,0.4);
}
.svc-stopped .svc-dot {
  background: #94a3b8;
}

/* Windows "网络连接" 风格 */
.net-connections {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px;
}
.net-conn-item {
  width: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 12px 8px;
  border-radius: 6px;
  transition: background 0.15s;
  cursor: pointer;
}
.net-conn-item:hover { background: #eff6ff; }
.net-conn-icon { margin-bottom: 8px; }
.net-conn-name {
  font-size: 13px;
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 4px;
  word-break: break-all;
}
.net-conn-status {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 2px;
}
.net-conn-desc {
  font-size: 11px;
  color: #94a3b8;
  word-break: break-all;
}
.net-ctx-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 9999;
  min-width: 120px;
  padding: 4px 0;
}
.net-ctx-item {
  padding: 6px 20px;
  font-size: 13px;
  cursor: pointer;
}
.net-ctx-item:hover { background: #2563eb; color: #fff; }

.file-explorer { display: flex; height: 100%; min-height: 0; }
.fe-shell { display: flex; height: 100%; min-height: 0; background: #fff; border-radius: 8px; overflow: hidden; }
.fe-sidebar { width: 200px; background: #f8fafc; border-right: 1px solid #e2e8f0; padding: 12px 8px; overflow-y: auto; flex-shrink: 0; }
.fe-side-section { margin-bottom: 16px; }
.fe-side-title { font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 12px; margin-bottom: 4px; }
.fe-side-item { display: flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; color: #475569; transition: all 0.15s; }
.fe-side-item:hover { background: #e2e8f0; color: #0f172a; }
.fe-side-item.active { background: #dbeafe; color: #2563eb; font-weight: 500; }
.fe-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.fe-toolbar { padding: 8px 12px; display: flex; gap: 4px; align-items: center; border-bottom: 1px solid #e2e8f0; background: #fff; }
.fe-tbtn { width: 32px; height: 32px; border: none; background: transparent; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: all 0.15s; }
.fe-tbtn:hover { background: #f1f5f9; color: #0f172a; }
.fe-breadcrumb { flex: 1; display: flex; align-items: center; gap: 2px; padding: 0 12px; font-size: 13px; color: #64748b; }
.fe-bc-seg { cursor: pointer; padding: 2px 6px; border-radius: 4px; }
.fe-bc-seg:hover { background: #f1f5f9; color: #2563eb; }
.fe-bc-sep { margin: 0 2px; color: #cbd5e1; }
.fe-view-toggle { display: flex; gap: 2px; margin-left: 8px; }
.fe-view-btn { width: 28px; height: 28px; border: none; background: transparent; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
.fe-view-btn:hover { background: #f1f5f9; }
.fe-view-btn.active { background: #dbeafe; color: #2563eb; }
.fe-thead { display: grid; padding: 6px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; font-weight: 600; }
.fe-thead-list { grid-template-columns: 40px 1fr 90px 160px 100px; }
.fe-thead-detail { grid-template-columns: 40px 1fr 90px 90px 90px 160px 100px; }
.fe-th-perms { font-family: monospace; }
.fe-th-sortable { cursor: pointer; user-select: none; display: inline-flex; align-items: center; gap: 2px; }
.fe-th-sortable:hover { color: #334155; }
.fe-th-group { }
.fe-tbody { flex: 1; overflow-y: auto; position: relative; }
.fe-loading-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.88); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; z-index: 10; color: #64748b; font-size: 14px; }
.fe-loading-more { padding: 12px; text-align: center; color: #94a3b8; font-size: 12px; }
.fe-row { display: grid; padding: 7px 16px; font-size: 13px; cursor: pointer; align-items: center; border-bottom: 1px solid #f8fafc; transition: background 0.1s; }
.fe-row.list { grid-template-columns: 40px 1fr 90px 160px 100px; }
.fe-row.detail { grid-template-columns: 40px 1fr 90px 90px 90px 160px 100px; }
.fe-row.list.has-check { grid-template-columns: 28px 40px 1fr 90px 160px 100px; }
.fe-row.detail.has-check { grid-template-columns: 28px 40px 1fr 90px 90px 90px 160px 100px; }
.fe-row:hover { background: #f8fafc; }
.fe-row.selected { background: #dbeafe; }
.fe-row-icon { display: flex; align-items: center; }
.fe-row-name { color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fe-row-perms { font-family: monospace; font-size: 12px; color: #475569; }
.fe-row-size, .fe-row-modified, .fe-row-owner, .fe-row-group { font-size: 12px; color: #64748b; }
.fe-empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px 20px; color: #94a3b8; font-size: 14px; }
.fe-spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: fe-spin 0.8s linear infinite; }
@keyframes fe-spin { to { transform: rotate(360deg); } }
.fe-statusbar { padding: 6px 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; display: flex; gap: 16px; background: #f8fafc; }
.fe-ctx { position: fixed; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); z-index: 9999; min-width: 160px; padding: 6px 0; }
.fe-ctx-item { display: flex; align-items: center; gap: 8px; padding: 7px 16px; font-size: 13px; cursor: pointer; color: #0f172a; }
.fe-ctx-item:hover { background: #2563eb; color: #fff; }
.fe-ctx-item.danger:hover { background: #dc2626; }
.fe-ctx-div { height: 1px; background: #e2e8f0; margin: 4px 0; }
.fe-inline-input { width: 100%; padding: 4px 8px; border: 1px solid #2563eb; border-radius: 4px; font-size: 13px; outline: none; }
.fe-row-editing { background: #f0f9ff; }
.fe-icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 8px; padding: 16px; }
.fe-icon-item { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 8px; border-radius: 8px; cursor: pointer; border: 2px solid transparent; }
.fe-icon-item:hover { background: #f8fafc; }
.fe-icon-item.selected { background: #dbeafe; border-color: #2563eb; }
.fe-icon-img { display: flex; align-items: center; justify-content: center; height: 40px; }
.fe-icon-name { font-size: 12px; color: #0f172a; text-align: center; word-break: break-all; line-height: 1.3; max-height: 32px; overflow: hidden; }

/* Chmod dialog */
.fe-progress-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 10000; display: flex; align-items: center; justify-content: center; }
.fe-progress-box { background: #fff; border-radius: 10px; padding: 20px 28px; min-width: 280px; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
.fe-progress-text { font-size: 13px; color: #334155; margin-bottom: 10px; }
.fe-progress-bar { height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
.fe-progress-fill { height: 100%; background: #2563eb; transition: width 0.2s; }
.fe-progress-pct { font-size: 12px; color: #64748b; text-align: right; margin-top: 6px; }
.fe-row-check { width: 14px; height: 14px; margin: 0 6px 0 0; flex-shrink: 0; }
.fe-tbtn.active { background: #dbeafe; color: #2563eb; }
.fe-tbtn-danger { color: #dc2626; }
.fe-tbtn-danger:hover { background: #fee2e2; }

.chmod-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 10000; display: flex; align-items: center; justify-content: center; }
.chmod-dialog { background: #fff; border-radius: 12px; padding: 24px; width: 420px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
.chmod-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
.chmod-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.chmod-col-title { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
.chmod-opt { display: flex; align-items: center; gap: 6px; font-size: 13px; padding: 4px 0; cursor: pointer; color: #334155; }
.chmod-octal { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #f8fafc; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
.chmod-octal-val { font-family: monospace; font-weight: 700; font-size: 18px; color: #2563eb; }
.chmod-symbolic { font-family: monospace; color: #64748b; }
.chmod-btns { display: flex; gap: 8px; justify-content: flex-end; }
.chmod-cancel { padding: 6px 16px; border: 1px solid #e2e8f0; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
.chmod-ok { padding: 6px 16px; border: none; border-radius: 6px; background: #2563eb; color: #fff; cursor: pointer; font-size: 13px; }

.netproc-view { display: flex; flex-direction: column; height: 100%; }
.netproc-toolbar { padding: 8px; display: flex; gap: 8px; align-items: center; border-bottom: 1px solid #e2e8f0; }
.netproc-group { border: 1px solid #e2e8f0; border-radius: 6px; margin: 6px 0; overflow: hidden; }
.netproc-group-header { display: flex; align-items: center; gap: 12px; padding: 8px 12px; background: #f8fafc; }
.netproc-port { font-weight: 700; font-size: 15px; color: #2563eb; min-width: 60px; }
.netproc-proto { font-size: 12px; color: #64748b; background: #e2e8f0; padding: 2px 8px; border-radius: 3px; }
.netproc-prog { flex: 1; font-size: 13px; color: #0f172a; }
.netproc-group-body { padding: 6px 12px; }
.netproc-conn { font-size: 12px; padding: 3px 0; color: #475569; }
.netproc-state { color: #059669; margin-left: 8px; }
.net-details { padding: 0 8px; }
.net-details-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #1e293b; }
.net-details-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.net-details-table td { padding: 4px 8px; border-bottom: 1px solid #f1f5f9; }
.net-dt-label { color: #64748b; width: 180px; white-space: nowrap; }
.net-dt-val { color: #1e293b; }
.net-edit-form { font-size: 13px; color: #333; }
.net-edit-hint { color: #666; margin-bottom: 12px; line-height: 1.5; }
.net-edit-radio { margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.net-edit-radio.checked label { font-weight: 600; }
.net-edit-fields { margin: 8px 0 0 24px; }
.net-edit-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.net-edit-row label { width: 120px; text-align: right; color: #333; }
.net-edit-row input { flex: 1; padding: 5px 8px; border: 1px solid #ccc; border-radius: 2px; font-size: 13px; }

/* 磁盘管理卡片 (Windows 风格) */
/* Windows "此电脑" 风格磁盘视图 */
.disk-pc-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 8px;
}
.disk-pc-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border-radius: 8px;
  transition: background 0.15s;
}
.disk-pc-item:hover { background: #f8fafc; }
.disk-pc-icon {
  flex-shrink: 0;
  padding-top: 2px;
}
.disk-pc-body { flex: 1; min-width: 0; }
.disk-pc-label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}
.disk-pc-bar {
  height: 12px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 6px;
}
.disk-pc-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s;
}
.disk-pc-size {
  font-size: 12px;
  color: #64748b;
  font-variant-numeric: tabular-nums;
}
.part-ok { background: #10b981; }
.part-warn { background: #f59e0b; }
.part-danger { background: #ef4444; }
</style>
