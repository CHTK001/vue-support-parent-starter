<template>
  <section class="nginx-workspace">
    <ScLayout
      v-model="railTabValue"
      class="nginx-layout"
      left-enabled
      :left-width="240"
      :left-min-width="160"
      :left-max-width="340"
      rail-enabled
      :rail-tabs="railTabs"
      :rail-width="48"
    >
      <!-- ── 左侧：站点树 + 配置文件 ── -->
      <template #left>
        <div class="left-panel">
          <!-- 站点树（解析自 nginx.conf） -->
          <div class="left-section">
            <div class="left-section__header">
              <span class="left-section__title">
                <ElIcon><Grid /></ElIcon>
                HTTP 站点
              </span>
              <div class="left-section__actions">
                <ElTooltip content="添加站点">
                  <ElButton :icon="Plus" circle type="primary" @click="openAddServerDialog" />
                </ElTooltip>
                <ElTooltip content="刷新">
                  <ElButton :icon="RefreshRight" circle :loading="serversLoading" @click="loadServers" />
                </ElTooltip>
              </div>
            </div>
            <ElScrollbar class="left-section__scroll">
              <div v-if="serversLoading" class="left-empty">
                <ElIcon class="is-loading"><Loading /></ElIcon>
              </div>
              <div v-else-if="!servers.length" class="left-empty">
                <span>暂无站点，点击 + 添加</span>
              </div>
              <div v-else class="server-tree">
                <div
                  v-for="(server, si) in servers"
                  :key="si"
                  class="server-node"
                >
                  <!-- server 行 -->
                  <div
                    class="server-row"
                    :class="{ 'is-active': activeServerIndex === si && activeLocationIndex === -1 }"
                    @click="selectServer(si)"
                    @mouseenter="hoveredServer = si"
                    @mouseleave="hoveredServer = -1"
                  >
                    <ElIcon class="server-row__arrow" :class="{ 'is-expanded': expandedServers.has(si) }" @click.stop="toggleServer(si)">
                      <ArrowRight />
                    </ElIcon>
                    <ElIcon class="server-row__icon"><Connection /></ElIcon>
                    <div class="server-row__info">
                      <span class="server-row__name">{{ server.serverName || '未命名' }}</span>
                      <span class="server-row__port">:{{ server.listen || '80' }}</span>
                    </div>
                    <div v-if="hoveredServer === si" class="server-row__actions" @click.stop>
                      <ElTooltip content="添加 location">
                        <ElButton :icon="Plus" circle plain @click="openAddLocationDialog(si)" />
                      </ElTooltip>
                      <ElTooltip content="编辑站点">
                        <ElButton :icon="EditPen" circle plain @click="openServerEdit(si)" />
                      </ElTooltip>
                      <ElTooltip content="删除站点">
                        <ElButton :icon="Delete" circle plain type="danger" @click="confirmDeleteServer(si)" />
                      </ElTooltip>
                    </div>
                  </div>

                  <!-- location 列表 -->
                  <div v-if="expandedServers.has(si)" class="location-list">
                    <div
                      v-for="(loc, li) in (server.locations || [])"
                      :key="li"
                      class="location-row"
                      :class="{ 'is-active': activeServerIndex === si && activeLocationIndex === li }"
                      @click="selectLocation(si, li)"
                      @mouseenter="hoveredLocation = `${si}-${li}`"
                      @mouseleave="hoveredLocation = ''"
                    >
                      <ElIcon class="location-row__icon"><Link /></ElIcon>
                      <span class="location-row__path">{{ loc.path || '/' }}</span>
                      <div v-if="hoveredLocation === `${si}-${li}`" class="location-row__actions" @click.stop>
                        <ElTooltip content="删除">
                          <ElButton :icon="Delete" circle plain type="danger" @click="confirmDeleteLocation(si, li)" />
                        </ElTooltip>
                      </div>
                    </div>
                    <div class="location-add" @click="openAddLocationDialog(si)">
                      <ElIcon><Plus /></ElIcon>
                      <span>添加映射</span>
                    </div>
                  </div>
                </div>
              </div>
            </ElScrollbar>
          </div>

          <!-- 配置文件树 -->
          <div class="left-section left-section--config">
            <div class="left-section__header">
              <span class="left-section__title">
                <ElIcon><Setting /></ElIcon>
                配置文件
              </span>
            </div>
            <div class="config-tree">
              <div
                v-for="cfg in configFiles"
                :key="cfg.path"
                class="config-tree__item"
                :class="{ 'is-active': activeConfigPath === cfg.path }"
                @click="openConfig(cfg.path)"
              >
                <ElIcon class="config-tree__icon"><Document /></ElIcon>
                <span class="config-tree__name">{{ cfg.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── 右侧主内容 ── -->
      <template #default>
        <div class="main-content">

          <!-- 工作区 tab：配置编辑器 -->
          <template v-if="railTabValue === 'editor'">
            <div class="editor-panel">
              <div class="editor-toolbar">
                <div class="editor-toolbar__left">
                  <span class="editor-path">
                    <ElIcon><Document /></ElIcon>
                    {{ activeConfigPath || "/etc/nginx/nginx.conf" }}
                  </span>
                </div>
                <div class="editor-toolbar__right">
                  <ElTooltip content="表单模式">
                    <ElButton :type="formMode ? 'primary' : ''" @click="toggleFormMode">
                      <ElIcon><List /></ElIcon>
                      表单
                    </ElButton>
                  </ElTooltip>
                  <ElTooltip content="语法检查 (nginx -t)">
                    <ElButton :loading="checking" @click="checkConfig">
                      <ElIcon><CircleCheck /></ElIcon>
                      检查
                    </ElButton>
                  </ElTooltip>
                  <ElButton type="primary" :loading="saving" @click="saveAndReload">
                    <ElIcon><Check /></ElIcon>
                    保存并 Reload
                  </ElButton>
                </div>
              </div>

              <div v-if="checkResult" class="check-result" :class="checkResult.ok ? 'check-result--ok' : 'check-result--err'">
                <ElIcon>
                  <component :is="checkResult.ok ? CircleCheck : Warning" />
                </ElIcon>
                <pre class="check-result__text">{{ checkResult.message }}</pre>
              </div>

              <div class="editor-wrap">
                <div v-if="configLoading" class="editor-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                  <span>加载中…</span>
                </div>
                <template v-else>
                  <!-- Server 卡片列表（默认视图，未进入编辑时显示） -->
                  <div v-if="!editingServer && activeLocationIndex < 0 && !formMode" class="server-cards-panel">
                    <ElScrollbar class="server-cards-scroll">
                      <div v-if="!servers.length" class="server-cards-empty">
                        <ElEmpty description="暂无站点，点击左侧 + 添加" :image-size="48" />
                      </div>
                      <div v-else class="server-cards-list">
                        <div
                          v-for="(server, si) in servers"
                          :key="si"
                          :ref="(el) => { if (el) serverCardRefs[si] = el as HTMLElement }"
                          class="server-card"
                          :class="{ 'is-active': activeServerIndex === si }"
                        >
                          <div class="server-card__header">
                            <div class="server-card__title-row">
                              <ElIcon class="server-card__globe"><Connection /></ElIcon>
                              <span class="server-card__name">{{ server.serverName || '未命名站点' }}</span>
                              <span class="server-card__port">:{{ server.listen || '80' }}</span>
                              <span class="server-card__loc-count">{{ (server.locations || []).length }} locations</span>
                            </div>
                            <div class="server-card__badges">
                              <ElTag v-if="server.sslCertificate" type="success" size="small" class="server-card__ssl-tag">
                                <ElIcon><Lock /></ElIcon> SSL
                              </ElTag>
                            </div>
                          </div>
                          <div v-if="server.root" class="server-card__root">
                            root: {{ server.root }}
                          </div>
                          <div class="server-card__footer">
                            <ElButton type="primary" @click="openServerEdit(si)">
                              <ElIcon><EditPen /></ElIcon>编辑
                            </ElButton>
                            <ElButton @click="openAddLocationDialog(si)">
                              <ElIcon><Plus /></ElIcon>添加映射
                            </ElButton>
                            <ElButton type="danger" plain @click="confirmDeleteServer(si)">
                              <ElIcon><Delete /></ElIcon>删除
                            </ElButton>
                          </div>
                        </div>
                      </div>
                    </ElScrollbar>
                  </div>
                  <!-- Server 编辑表单（点击卡片编辑按钮后显示） -->
                  <div v-else-if="editingServer && activeServerIndex >= 0 && activeLocationIndex < 0" class="form-panel">
                    <div class="form-panel__header">
                      <span class="form-panel__title">
                        <ElIcon><Connection /></ElIcon>
                        编辑站点 #{{ activeServerIndex + 1 }}
                      </span>
                      <div style="display:flex;gap:8px">
                        <ElButton @click="editingServer = false; activeServerIndex = -1">← 返回站点列表</ElButton>
                        <ElButton type="primary" :loading="saving" @click="saveServerForm">
                          <ElIcon><Check /></ElIcon>保存并 Reload
                        </ElButton>
                      </div>
                    </div>
                    <ElScrollbar class="form-panel__scroll">
                      <div class="form-body">
                        <div class="form-row">
                          <label class="form-label">监听端口</label>
                          <input v-model="serverForm.listen" class="form-input" placeholder="80 或 443 ssl" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">域名 (server_name)</label>
                          <input v-model="serverForm.serverName" class="form-input" placeholder="example.com www.example.com" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">根目录 (root)</label>
                          <input v-model="serverForm.root" class="form-input" placeholder="/var/www/html" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">默认文件 (index)</label>
                          <input v-model="serverForm.index" class="form-input" placeholder="index.html index.php" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">SSL 证书</label>
                          <input v-model="serverForm.sslCertificate" class="form-input" placeholder="/etc/ssl/cert.pem" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">SSL 私钥</label>
                          <input v-model="serverForm.sslCertificateKey" class="form-input" placeholder="/etc/ssl/key.pem" />
                        </div>
                      </div>
                      <div class="form-section-title">Location 映射</div>
                      <div class="location-form-list">
                        <div
                          v-for="(loc, li) in serverForm.locations"
                          :key="li"
                          class="location-form-item"
                          :class="{ 'is-active': activeLocationIndex === li }"
                          @click="selectLocation(activeServerIndex, li)"
                        >
                          <div class="location-form-item__head">
                            <span class="location-form-item__path">{{ loc.path || '/' }}</span>
                            <ElTag
                              :type="loc.mode === 'proxy' ? '' : loc.mode === 'static' ? 'success' : loc.mode === 'redirect' ? 'warning' : 'info'"
                              size="small"
                              class="location-mode-tag"
                            >
                              {{ loc.mode === 'proxy' ? '反向代理' : loc.mode === 'static' ? '静态文件' : loc.mode === 'redirect' ? '重定向' : loc.mode === 'custom' ? '自定义' : '反向代理' }}
                            </ElTag>
                            <ElButton :icon="Delete" circle plain type="danger" @click.stop="serverForm.locations?.splice(li, 1)" />
                          </div>
                          <div class="location-form-item__body">
                            <div class="form-row-inline">
                              <label>路径</label>
                              <input v-model="loc.path" class="form-input" placeholder="/" />
                            </div>
                            <div class="form-row-inline">
                              <label>代理地址</label>
                              <input v-model="loc.proxyPass" class="form-input" placeholder="http://127.0.0.1:8080" />
                            </div>
                            <div class="form-row-inline">
                              <label>根目录</label>
                              <input v-model="loc.root" class="form-input" placeholder="/var/www/html" />
                            </div>
                            <div class="form-row-inline">
                              <label>try_files</label>
                              <input v-model="loc.tryFiles" class="form-input" placeholder="$uri $uri/ =404" />
                            </div>
                          </div>
                        </div>
                        <div class="location-add-btn" @click="addLocation">
                          <ElIcon><Plus /></ElIcon>
                          添加 location 映射
                        </div>
                      </div>
                    </ElScrollbar>
                  </div>
                  <!-- 表单模式 -->
                  <div v-else-if="formMode" class="form-panel">
                    <div class="form-panel__header">
                      <span class="form-panel__title">
                        <ElIcon><List /></ElIcon>
                        表单模式
                      </span>
                      <ElButton type="primary" :loading="saving" @click="applyAndSave">
                        <ElIcon><Check /></ElIcon>
                        应用并保存
                      </ElButton>
                    </div>
                    <ElScrollbar class="form-panel__scroll">
                      <div class="form-body">
                        <div class="form-row">
                          <label class="form-label">工作进程数</label>
                          <input v-model="nginxForm.worker_processes" class="form-input" placeholder="auto 或数字" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">连接数上限</label>
                          <input v-model="nginxForm.worker_connections" class="form-input" type="number" placeholder="1024" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">错误日志路径</label>
                          <input v-model="nginxForm.error_log_path" class="form-input" placeholder="/var/log/nginx/error.log" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">日志级别</label>
                          <ElSelect v-model="nginxForm.error_log_level" size="small" class="form-select">
                            <ElOption v-for="lv in ['debug','info','notice','warn','error','crit']" :key="lv" :label="lv" :value="lv" />
                          </ElSelect>
                        </div>
                        <div class="form-row">
                          <label class="form-label">访问日志</label>
                          <input v-model="nginxForm.access_log" class="form-input" placeholder="/var/log/nginx/access.log" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">Gzip 压缩</label>
                          <ElSwitch v-model="nginxForm.gzip" active-text="on" inactive-text="off" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">Keepalive 超时 (s)</label>
                          <input v-model="nginxForm.keepalive_timeout" class="form-input" type="number" placeholder="65" />
                        </div>
                        <div class="form-row">
                          <label class="form-label">客户端最大请求体</label>
                          <input v-model="nginxForm.client_max_body_size" class="form-input" placeholder="1m" />
                        </div>
                      </div>
                      <div class="form-hint">
                        表单只覆盖已识别的指令，其他配置保持不变
                      </div>
                    </ElScrollbar>
                  </div>
                  <!-- 原始编辑器 -->
                  <textarea
                    v-else
                    v-model="configContent"
                    class="nginx-editor"
                    spellcheck="false"
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    placeholder="选择左侧配置文件进行编辑…"
                  />
                </template>
              </div>
            </div>
          </template>

          <!-- 状态 tab -->
          <template v-else-if="railTabValue === 'status'">
            <div class="status-panel">
              <div class="status-header">
                <span class="status-title">Nginx 运行状态</span>
                <div class="status-header__actions">
                  <ElButton :loading="statusLoading" :icon="RefreshRight" @click="loadStatus">刷新</ElButton>
                  <ElButton type="primary" :loading="reloading" @click="doReload">
                    <ElIcon><RefreshRight /></ElIcon>重载
                  </ElButton>
                  <ElButton type="warning" :loading="restarting" @click="doRestart">
                    <ElIcon><VideoPlay /></ElIcon>重启
                  </ElButton>
                  <ElButton type="danger" :loading="stopping" @click="doStop">
                    <ElIcon><VideoPause /></ElIcon>停止
                  </ElButton>
                </div>
              </div>

              <ElScrollbar class="status-scroll">
                <div v-if="statusLoading" class="status-loading">
                  <ElIcon class="is-loading"><Loading /></ElIcon>
                </div>
                <div v-else-if="nginxStatus" class="status-cards">
                  <!-- 版本 + PID -->
                  <div class="status-card">
                    <div class="status-card__title">基本信息</div>
                    <div class="status-chips">
                      <span class="status-chip" :class="statusIsActive ? 'status-chip--active' : 'status-chip--inactive'">
                        <span class="status-chip__dot" />
                        {{ statusIsActive ? "运行中" : "已停止" }}
                      </span>
                      <span class="status-chip status-chip--version">
                        <ElIcon><CircleCheck /></ElIcon>
                        {{ nginxStatus.version || "—" }}
                      </span>
                      <span class="status-chip status-chip--pid">
                        PID {{ nginxStatus.pid || "—" }}
                      </span>
                      <span class="status-chip" :class="configTestOk ? 'status-chip--ok' : 'status-chip--fail'">
                        配置 {{ configTestOk ? "✓ pass" : "✗ fail" }}
                      </span>
                    </div>
                    <div class="status-card__body">
                      <div class="status-row">
                        <span class="status-row__label">版本</span>
                        <span class="status-row__val status-row__val--mono">{{ nginxStatus.version || "—" }}</span>
                      </div>
                      <div class="status-row">
                        <span class="status-row__label">主进程 PID</span>
                        <span class="status-row__val status-row__val--mono">{{ nginxStatus.pid || "—" }}</span>
                      </div>
                      <div class="status-row">
                        <span class="status-row__label">服务状态</span>
                        <span class="status-row__val" :class="statusIsActive ? 'status-row__val--active' : 'status-row__val--inactive'">
                          {{ statusIsActive ? "active (running)" : "inactive / 未知" }}
                        </span>
                      </div>
                      <div class="status-row">
                        <span class="status-row__label">配置检查</span>
                        <span class="status-row__val" :class="configTestOk ? 'status-row__val--active' : 'status-row__val--inactive'">
                          {{ configTestOk ? "通过 (syntax ok)" : "失败" }}
                        </span>
                      </div>
                      <div class="status-row">
                        <span class="status-row__label">连接 ID</span>
                        <span class="status-row__val status-row__val--mono">{{ props.connectionId }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- 配置检查 -->
                  <div class="status-card">
                    <div class="status-card__title">配置检查 (nginx -t)</div>
                    <pre class="status-pre">{{ nginxStatus.configTest }}</pre>
                  </div>

                  <!-- systemctl status -->
                  <div class="status-card">
                    <div class="status-card__title">服务状态</div>
                    <pre class="status-pre">{{ nginxStatus.systemctlStatus }}</pre>
                  </div>
                </div>
                <div v-else class="status-empty">
                  <ElEmpty description="点击刷新获取状态" :image-size="48" />
                </div>
              </ElScrollbar>
            </div>
          </template>

          <!-- 日志 tab -->
          <template v-else-if="railTabValue === 'log'">
            <div class="log-panel">
              <div class="log-toolbar">
                <div class="log-type-tabs">
                  <button
                    class="log-tab"
                    :class="{ 'is-active': logType === 'access' }"
                    @click="switchLog('access')"
                  >访问日志</button>
                  <button
                    class="log-tab"
                    :class="{ 'is-active': logType === 'error' }"
                    @click="switchLog('error')"
                  >错误日志</button>
                </div>
                <div class="log-toolbar__right">
                  <span class="log-lines-label">行数</span>
                  <ElInputNumber
                    v-model="logLines"
                    :min="10"
                    :max="1000"
                    :step="50"
                    :controls="false"
                    size="small"
                    style="width: 72px"
                  />
                  <ElButton
                    :icon="logPolling ? VideoPause : VideoPlay"
                    :type="logPolling ? 'warning' : 'primary'"
                    @click="togglePolling"
                  >
                    {{ logPolling ? "暂停" : "实时" }}
                  </ElButton>
                  <ElButton :icon="RefreshRight" :loading="logLoading" @click="loadLog" />
                </div>
              </div>

              <div class="log-content-wrap">
                <ElScrollbar ref="logScrollbar" class="log-scroll">
                  <div v-if="logLoading && !logContent" class="log-loading">
                    <ElIcon class="is-loading"><Loading /></ElIcon>
                  </div>
                  <pre v-else class="log-pre">{{ logContent || "暂无日志内容" }}</pre>
                </ElScrollbar>
              </div>
            </div>
          </template>

        </div>
      </template>
    </ScLayout>
  </section>

  <!-- 添加站点对话框 -->
  <ElDialog v-model="addServerDialogVisible" title="添加站点" width="520px" :close-on-click-modal="false">
    <div class="dialog-form">
      <div class="form-row"><label class="form-label">监听端口</label><input v-model="newServer.listen" class="form-input" placeholder="80" /></div>
      <div class="form-row"><label class="form-label">域名</label><input v-model="newServer.serverName" class="form-input" placeholder="example.com" /></div>
      <div class="form-row"><label class="form-label">根目录</label><input v-model="newServer.root" class="form-input" placeholder="/var/www/html" /></div>
      <div class="form-row"><label class="form-label">默认文件</label><input v-model="newServer.index" class="form-input" placeholder="index.html" /></div>
    </div>
    <template #footer>
      <ElButton @click="addServerDialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="submitAddServer">添加</ElButton>
    </template>
  </ElDialog>
  <ElDialog v-model="addLocationDialogVisible" title="添加 Location 映射" width="600px" :close-on-click-modal="false">
    <div class="dialog-form loc-dialog-form">
      <!-- 路径 -->
      <div class="form-row">
        <label class="form-label">路径</label>
        <input v-model="newLocation.path" class="form-input" placeholder="/" />
      </div>
      <!-- 模式选择 -->
      <div class="form-row loc-mode-row">
        <label class="form-label">模式</label>
        <ElRadioGroup v-model="newLocation.mode" class="loc-mode-group">
          <ElRadio value="proxy">反向代理</ElRadio>
          <ElRadio value="static">静态文件</ElRadio>
          <ElRadio value="redirect">重定向</ElRadio>
          <ElRadio value="custom">自定义</ElRadio>
        </ElRadioGroup>
      </div>

      <!-- 反向代理模式 -->
      <template v-if="newLocation.mode === 'proxy'">
        <div class="form-row">
          <label class="form-label">代理地址</label>
          <input v-model="newLocation.proxyPass" class="form-input" placeholder="http://127.0.0.1:8080" />
        </div>
        <div class="form-row">
          <label class="form-label">代理超时 (s)</label>
          <input v-model="newLocation.proxyReadTimeout" class="form-input" type="number" placeholder="60" />
        </div>
        <div class="form-row">
          <label class="form-label">连接超时 (s)</label>
          <input v-model="newLocation.proxyConnectTimeout" class="form-input" type="number" placeholder="60" />
        </div>
        <div class="form-row">
          <label class="form-label">缓冲</label>
          <ElSwitch v-model="newLocation.proxyBuffering" active-text="on" inactive-text="off" />
        </div>
        <div class="loc-header-section">
          <div class="loc-header-section__title">
            请求头 (proxy_set_header)
            <div class="loc-preset-btns">
              <ElButton plain @click="addProxyHeader('Host $host')">Host</ElButton>
              <ElButton plain @click="addProxyHeader('X-Real-IP $remote_addr')">X-Real-IP</ElButton>
              <ElButton plain @click="addProxyHeader('X-Forwarded-For $proxy_add_x_forwarded_for')">X-Forwarded-For</ElButton>
              <ElButton plain @click="addProxyHeader('X-Forwarded-Proto $scheme')">X-Forwarded-Proto</ElButton>
            </div>
          </div>
          <div v-for="(h, i) in newLocation.proxySetHeaderList" :key="i" class="loc-header-row">
            <input v-model="newLocation.proxySetHeaderList[i]" class="form-input" placeholder="Header value" />
            <ElButton :icon="Delete" circle plain type="danger" @click="removeProxyHeader(i)" />
          </div>
          <div class="loc-add-header" @click="newLocation.proxySetHeaderList.push('')">
            <ElIcon><Plus /></ElIcon> 添加请求头
          </div>
        </div>
      </template>

      <!-- 静态文件模式 -->
      <template v-else-if="newLocation.mode === 'static'">
        <div class="form-row">
          <label class="form-label">根目录 (root)</label>
          <input v-model="newLocation.root" class="form-input" placeholder="/var/www/html" />
        </div>
        <div class="form-row">
          <label class="form-label">别名 (alias)</label>
          <input v-model="newLocation.alias" class="form-input" placeholder="/var/www/static/" />
        </div>
        <div class="form-row">
          <label class="form-label">try_files</label>
          <input v-model="newLocation.tryFiles" class="form-input" placeholder="$uri $uri/ =404" />
        </div>
        <div class="form-row">
          <label class="form-label">过期时间</label>
          <input v-model="newLocation.expires" class="form-input" placeholder="7d / 1h / off" />
        </div>
        <div class="form-row">
          <label class="form-label">默认文件 (index)</label>
          <input v-model="newLocation.index" class="form-input" placeholder="index.html" />
        </div>
        <div class="form-row">
          <label class="form-label">目录浏览</label>
          <ElSwitch v-model="newLocation.autoindex" active-text="on" inactive-text="off" />
        </div>
      </template>

      <!-- 重定向模式 -->
      <template v-else-if="newLocation.mode === 'redirect'">
        <div class="form-row">
          <label class="form-label">状态码</label>
          <ElSelect v-model="newLocation.returnCode" class="form-select">
            <ElOption label="301 永久重定向" value="301" />
            <ElOption label="302 临时重定向" value="302" />
            <ElOption label="307 临时重定向(保留方法)" value="307" />
            <ElOption label="308 永久重定向(保留方法)" value="308" />
          </ElSelect>
        </div>
        <div class="form-row">
          <label class="form-label">目标 URL</label>
          <input v-model="newLocation.returnUrl" class="form-input" placeholder="https://example.com$request_uri" />
        </div>
      </template>

      <!-- 自定义模式 -->
      <template v-else-if="newLocation.mode === 'custom'">
        <div class="form-row form-row--textarea">
          <label class="form-label">自定义指令</label>
          <textarea v-model="newLocation.rawDirectives" class="form-input form-textarea" placeholder="直接写 nginx 指令，如：&#10;add_header X-Frame-Options SAMEORIGIN;&#10;limit_req zone=one burst=5;" />
        </div>
      </template>

      <!-- 通用：响应头 -->
      <div class="loc-header-section">
        <div class="loc-header-section__title">响应头 (add_header)</div>
        <div v-for="(h, i) in newLocation.addHeaderList" :key="i" class="loc-header-row">
          <input v-model="newLocation.addHeaderList[i]" class="form-input" placeholder="X-Frame-Options SAMEORIGIN" />
          <ElButton :icon="Delete" circle plain type="danger" @click="removeAddHeader(i)" />
        </div>
        <div class="loc-add-header" @click="newLocation.addHeaderList.push('')">
          <ElIcon><Plus /></ElIcon> 添加响应头
        </div>
      </div>
    </div>
    <template #footer>
      <ElButton @click="addLocationDialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="submitAddLocation">添加</ElButton>
    </template>
  </ElDialog>
</template>
<script setup lang="ts">
import {
  Check,
  CircleCheck,
  Connection,
  Delete,
  Document,
  EditPen,
  Grid,
  Link,
  List,
  Loading,
  Lock,
  Plus,
  RefreshRight,
  Setting,
  VideoPause,
  VideoPlay,
  Warning,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElIcon,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElScrollbar,
  ElSelect,
  ElSwitch,
  ElTag,
  ElTooltip,
} from "element-plus";
import { computed, markRaw, nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import ScLayout from "@repo/components/ScLayout";
import {
  fetchNginxServers,
  fetchNginxStatus,
  listNginxSites,
  readNginxConfig,
  reloadNginx,
  restartNginx,
  saveNginxServers,
  stopNginx,
  tailNginxLog,
  writeNginxConfig,
  type NginxServer,
  type NginxLocation,
  type NginxStatusResult,
} from "../api/nginx";

const props = defineProps<{ connectionId: string }>();
const emit = defineEmits<{ (e: "close"): void }>();

// ─── Rail tabs ────────────────────────────────────────────────────────────────
const railTabs = [
  { name: "editor", title: "编辑器", icon: markRaw(Document) },
  { name: "status", title: "面板", icon: markRaw(CircleCheck) },
  { name: "log", title: "日志", icon: markRaw(Grid) },
];
const railTabValue = ref("editor");

// ─── 配置文件列表 ─────────────────────────────────────────────────────────────
const configFiles = [
  { label: "nginx.conf", path: "/etc/nginx/nginx.conf" },
  { label: "mime.types", path: "/etc/nginx/mime.types" },
  { label: "fastcgi_params", path: "/etc/nginx/fastcgi_params" },
];

// ─── Server 树 ────────────────────────────────────────────────────────────────
const servers = ref<NginxServer[]>([]);
const serversLoading = ref(false);
const expandedServers = ref(new Set<number>());
const hoveredServer = ref(-1);
const hoveredLocation = ref("");
const activeServerIndex = ref(-1);
const activeLocationIndex = ref(-1);
const editingServer = ref(false);
const serverCardRefs = ref<HTMLElement[]>([]);

// server 编辑表单
const serverForm = reactive<NginxServer>({
  listen: "80",
  serverName: "",
  root: "",
  index: "index.html",
  sslCertificate: "",
  sslCertificateKey: "",
  locations: [],
});

const loadServers = async () => {
  serversLoading.value = true;
  try {
    const res = await fetchNginxServers(props.connectionId, "/etc/nginx/nginx.conf");
    servers.value = (res?.data ?? []) as NginxServer[];
  } catch (e: any) {
    ElMessage.error("解析站点失败: " + (e?.message ?? ""));
  } finally {
    serversLoading.value = false;
  }
};

const toggleServer = (si: number) => {
  if (expandedServers.value.has(si)) expandedServers.value.delete(si);
  else expandedServers.value.add(si);
};

const selectServer = (si: number) => {
  activeServerIndex.value = si;
  activeLocationIndex.value = -1;
  railTabValue.value = "editor";
  editingServer.value = false;
  const s = servers.value[si];
  Object.assign(serverForm, {
    listen: s.listen ?? "80",
    serverName: s.serverName ?? "",
    root: s.root ?? "",
    index: s.index ?? "index.html",
    sslCertificate: s.sslCertificate ?? "",
    sslCertificateKey: s.sslCertificateKey ?? "",
    locations: JSON.parse(JSON.stringify(s.locations ?? [])),
  });
  expandedServers.value.add(si);
  // 滚动到对应卡片
  nextTick(() => {
    const el = serverCardRefs.value[si];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
};

const openServerEdit = (si: number) => {
  selectServer(si);
  editingServer.value = true;
};

const selectLocation = (si: number, li: number) => {
  activeServerIndex.value = si;
  activeLocationIndex.value = li;
  openServerEdit(si);
};

const saveServerForm = async () => {
  saving.value = true;
  try {
    const updated = [...servers.value];
    updated[activeServerIndex.value] = { ...serverForm, locations: [...(serverForm.locations ?? [])] };
    await saveNginxServers(props.connectionId, updated, "/etc/nginx/nginx.conf");
    servers.value = updated;
    const res = await reloadNginx(props.connectionId);
    const result = res?.data as any;
    if (result?.success) ElMessage.success("保存并 Reload 成功");
    else ElMessage.warning("已保存，Reload 输出: " + (result?.output ?? ""));
    editingServer.value = false;
    activeServerIndex.value = -1;
    await loadConfig("/etc/nginx/nginx.conf");
  } catch (e: any) {
    ElMessage.error("保存失败: " + (e?.message ?? ""));
  } finally {
    saving.value = false;
  }
};

const addLocation = () => {
  if (!serverForm.locations) serverForm.locations = [];
  serverForm.locations.push({ path: "/new", proxyPass: "", root: "", tryFiles: "" });
};

// ─── 添加站点对话框 ────────────────────────────────────────────────────────────
const addServerDialogVisible = ref(false);
const newServer = reactive<NginxServer>({
  listen: "80",
  serverName: "",
  root: "/var/www/html",
  index: "index.html",
  locations: [{ path: "/", tryFiles: "$uri $uri/ =404" }],
});

const openAddServerDialog = () => {
  Object.assign(newServer, {
    listen: "80", serverName: "", root: "/var/www/html",
    index: "index.html", locations: [{ path: "/", tryFiles: "$uri $uri/ =404" }],
  });
  addServerDialogVisible.value = true;
};

const submitAddServer = async () => {
  if (!newServer.serverName?.trim() && !newServer.listen?.trim()) {
    ElMessage.warning("请填写域名或端口");
    return;
  }
  saving.value = true;
  try {
    const updated = [...servers.value, { ...newServer, locations: [...(newServer.locations ?? [])] }];
    await saveNginxServers(props.connectionId, updated, "/etc/nginx/nginx.conf");
    servers.value = updated;
    addServerDialogVisible.value = false;
    ElMessage.success("站点已添加");
    await reloadNginx(props.connectionId);
    await loadConfig("/etc/nginx/nginx.conf");
  } catch (e: any) {
    ElMessage.error("添加失败: " + (e?.message ?? ""));
  } finally {
    saving.value = false;
  }
};

const confirmDeleteServer = async (si: number) => {
  try {
    await ElMessageBox.confirm(`确认删除站点 "${servers.value[si].serverName || si + 1}"？`, "删除确认", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
    const updated = servers.value.filter((_, i) => i !== si);
    await saveNginxServers(props.connectionId, updated, "/etc/nginx/nginx.conf");
    servers.value = updated;
    if (activeServerIndex.value === si) activeServerIndex.value = -1;
    ElMessage.success("站点已删除");
    await reloadNginx(props.connectionId);
  } catch { /* 取消 */ }
};

const confirmDeleteLocation = async (si: number, li: number) => {
  try {
    await ElMessageBox.confirm("确认删除该 location 映射？", "删除确认", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
    const updated = [...servers.value];
    updated[si] = { ...updated[si], locations: (updated[si].locations ?? []).filter((_, i) => i !== li) };
    await saveNginxServers(props.connectionId, updated, "/etc/nginx/nginx.conf");
    servers.value = updated;
    if (activeServerIndex.value === si) selectServer(si);
    ElMessage.success("映射已删除");
  } catch { /* 取消 */ }
};

// ─── 添加 location 对话框 ──────────────────────────────────────────────────────
const addLocationDialogVisible = ref(false);
const addLocationTargetServer = ref(-1);
const newLocation = reactive<NginxLocation & { mode: string; proxySetHeaderList: string[]; addHeaderList: string[] }>({
  path: "/",
  mode: "proxy",
  proxyPass: "",
  proxyReadTimeout: "60",
  proxyConnectTimeout: "60",
  proxySetHeader: [],
  proxyBuffering: true,
  root: "",
  alias: "",
  tryFiles: "",
  expires: "",
  autoindex: false,
  index: "index.html",
  returnCode: "301",
  returnUrl: "",
  addHeader: [],
  rawDirectives: "",
  proxySetHeaderList: [],
  addHeaderList: [],
});

const openAddLocationDialog = (si: number) => {
  addLocationTargetServer.value = si;
  Object.assign(newLocation, {
    path: "/",
    mode: "proxy",
    proxyPass: "",
    proxyReadTimeout: "60",
    proxyConnectTimeout: "60",
    proxySetHeader: [],
    proxyBuffering: true,
    root: "",
    alias: "",
    tryFiles: "",
    expires: "",
    autoindex: false,
    index: "index.html",
    returnCode: "301",
    returnUrl: "",
    addHeader: [],
    rawDirectives: "",
    proxySetHeaderList: [],
    addHeaderList: [],
  });
  addLocationDialogVisible.value = true;
};

const addProxyHeader = (header: string) => {
  if (!newLocation.proxySetHeaderList.includes(header)) newLocation.proxySetHeaderList.push(header);
};

const removeProxyHeader = (i: number) => newLocation.proxySetHeaderList.splice(i, 1);
const removeAddHeader = (i: number) => newLocation.addHeaderList.splice(i, 1);

const submitAddLocation = async () => {
  const si = addLocationTargetServer.value;
  const loc: NginxLocation = {
    path: newLocation.path,
    mode: newLocation.mode as NginxLocation['mode'],
  };
  if (newLocation.mode === 'proxy') {
    loc.proxyPass = newLocation.proxyPass;
    loc.proxyReadTimeout = newLocation.proxyReadTimeout;
    loc.proxyConnectTimeout = newLocation.proxyConnectTimeout;
    loc.proxySetHeader = [...newLocation.proxySetHeaderList];
    loc.proxyBuffering = newLocation.proxyBuffering;
  } else if (newLocation.mode === 'static') {
    loc.root = newLocation.root;
    loc.alias = newLocation.alias;
    loc.tryFiles = newLocation.tryFiles;
    loc.expires = newLocation.expires;
    loc.autoindex = newLocation.autoindex;
    loc.index = newLocation.index;
  } else if (newLocation.mode === 'redirect') {
    loc.returnCode = newLocation.returnCode;
    loc.returnUrl = newLocation.returnUrl;
  } else {
    loc.rawDirectives = newLocation.rawDirectives;
  }
  loc.addHeader = [...newLocation.addHeaderList];
  const updated = [...servers.value];
  updated[si] = { ...updated[si], locations: [...(updated[si].locations ?? []), loc] };
  saving.value = true;
  try {
    await saveNginxServers(props.connectionId, updated, "/etc/nginx/nginx.conf");
    servers.value = updated;
    addLocationDialogVisible.value = false;
    ElMessage.success("映射已添加");
    await reloadNginx(props.connectionId);
  } catch (e: any) {
    ElMessage.error("添加失败: " + (e?.message ?? ""));
  } finally {
    saving.value = false;
  }
};

// ─── 旧站点列表（保留兼容） ────────────────────────────────────────────────────
const sites = ref<string[]>([]);
const sitesLoading = ref(false);
const activeSite = ref("");

const loadSites = async () => {
  sitesLoading.value = true;
  try {
    const res = await listNginxSites(props.connectionId);
    sites.value = res?.data ?? [];
  } catch { /* 静默 */ } finally {
    sitesLoading.value = false;
  }
};

const openSiteConfig = (site: string) => {
  activeSite.value = site;
  activeConfigPath.value = `/etc/nginx/sites-enabled/${site}`;
  railTabValue.value = "editor";
  loadConfig(activeConfigPath.value);
};

// ─── 配置编辑器 ───────────────────────────────────────────────────────────────
const activeConfigPath = ref("/etc/nginx/nginx.conf");
const configContent = ref("");
const configLoading = ref(false);
const saving = ref(false);
const checking = ref(false);
const checkResult = ref<{ ok: boolean; message: string } | null>(null);

const openConfig = (path: string) => {
  activeConfigPath.value = path;
  activeSite.value = "";
  railTabValue.value = "editor";
  loadConfig(path);
};

const loadConfig = async (path: string) => {
  configLoading.value = true;
  checkResult.value = null;
  try {
    const res = await readNginxConfig(props.connectionId, path);
    configContent.value = res?.data ?? "";
  } catch (e: any) {
    ElMessage.error("读取配置失败: " + (e?.message ?? ""));
  } finally {
    configLoading.value = false;
  }
};

const checkConfig = async () => {
  checking.value = true;
  checkResult.value = null;
  try {
    const res = await fetchNginxStatus(props.connectionId);
    const configTest = (res?.data as any)?.configTest ?? "";
    const ok = configTest.includes("syntax is ok") || configTest.includes("test is successful");
    checkResult.value = { ok, message: configTest };
  } catch (e: any) {
    checkResult.value = { ok: false, message: e?.message ?? "检查失败" };
  } finally {
    checking.value = false;
  }
};

const saveAndReload = async () => {
  if (!activeConfigPath.value) return;
  saving.value = true;
  try {
    await writeNginxConfig(props.connectionId, activeConfigPath.value, configContent.value);
    const res = await reloadNginx(props.connectionId);
    const result = res?.data as any;
    if (result?.success) {
      ElMessage.success("保存并 Reload 成功");
    } else {
      ElMessage.warning("已保存，但 Reload 可能有问题: " + (result?.output ?? ""));
    }
  } catch (e: any) {
    ElMessage.error("保存失败: " + (e?.message ?? ""));
  } finally {
    saving.value = false;
  }
};

// ─── 状态面板 ─────────────────────────────────────────────────────────────────
const nginxStatus = ref<NginxStatusResult | null>(null);
const statusLoading = ref(false);
const reloading = ref(false);
const restarting = ref(false);
const stopping = ref(false);

const loadStatus = async () => {
  statusLoading.value = true;
  try {
    const res = await fetchNginxStatus(props.connectionId);
    nginxStatus.value = (res?.data as any) ?? null;
  } catch (e: any) {
    ElMessage.error("获取状态失败: " + (e?.message ?? ""));
  } finally {
    statusLoading.value = false;
  }
};

const doReload = async () => {
  reloading.value = true;
  try {
    const res = await reloadNginx(props.connectionId);
    const result = res?.data as any;
    if (result?.success) {
      ElMessage.success("Reload 成功");
    } else {
      ElMessage.warning("Reload 输出: " + (result?.output ?? ""));
    }
    await loadStatus();
  } catch (e: any) {
    ElMessage.error("Reload 失败: " + (e?.message ?? ""));
  } finally {
    reloading.value = false;
  }
};

const doRestart = async () => {
  restarting.value = true;
  try {
    const res = await restartNginx(props.connectionId);
    const result = res?.data as any;
    ElMessage[result?.success ? "success" : "warning"]("Restart: " + (result?.output ?? ""));
    await loadStatus();
  } catch (e: any) {
    ElMessage.error("Restart 失败: " + (e?.message ?? ""));
  } finally {
    restarting.value = false;
  }
};

const doStop = async () => {
  stopping.value = true;
  try {
    const res = await stopNginx(props.connectionId);
    const result = res?.data as any;
    ElMessage[result?.success ? "success" : "warning"]("Stop: " + (result?.output ?? ""));
    await loadStatus();
  } catch (e: any) {
    ElMessage.error("Stop 失败: " + (e?.message ?? ""));
  } finally {
    stopping.value = false;
  }
};

// ─── 日志面板 ─────────────────────────────────────────────────────────────────
const logType = ref<"access" | "error">("access");
const logContent = ref("");
const logLoading = ref(false);
const logLines = ref(100);
const logPolling = ref(false);
const logScrollbar = ref<InstanceType<typeof ElScrollbar> | null>(null);
let pollingTimer: ReturnType<typeof setInterval> | null = null;

const logPathMap = {
  access: "/var/log/nginx/access.log",
  error: "/var/log/nginx/error.log",
};

const loadLog = async () => {
  logLoading.value = true;
  try {
    const res = await tailNginxLog(props.connectionId, logPathMap[logType.value], logLines.value);
    logContent.value = res?.data ?? "";
  } catch (e: any) {
    ElMessage.error("读取日志失败: " + (e?.message ?? ""));
  } finally {
    logLoading.value = false;
    await nextTick();
    logScrollbar.value?.setScrollTop(99999);
  }
};

const switchLog = (type: "access" | "error") => {
  logType.value = type;
  loadLog();
};

const togglePolling = () => {
  if (logPolling.value) {
    stopPolling();
  } else {
    startPolling();
  }
};

const startPolling = () => {
  logPolling.value = true;
  loadLog();
  pollingTimer = setInterval(loadLog, 3000);
};

const stopPolling = () => {
  logPolling.value = false;
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
};

// ─── 表单模式 ─────────────────────────────────────────────────────────────────
const formMode = ref(false);

const nginxForm = reactive({
  worker_processes: "auto",
  worker_connections: "1024",
  error_log_path: "/var/log/nginx/error.log",
  error_log_level: "warn",
  access_log: "/var/log/nginx/access.log",
  gzip: false,
  keepalive_timeout: "65",
  client_max_body_size: "1m",
  server_names_hash_bucket_size: "64",
});

const parseConfigToForm = () => {
  const c = configContent.value;
  const get = (key: string) => {
    const m = c.match(new RegExp(`^\\s*${key}\\s+([^;\\n]+);`, "m"));
    return m ? m[1].trim() : null;
  };
  const wp = get("worker_processes");
  if (wp) nginxForm.worker_processes = wp;
  const wc = get("worker_connections");
  if (wc) nginxForm.worker_connections = wc;
  const el = c.match(/^\s*error_log\s+(\S+)\s*(\S+)?;/m);
  if (el) {
    nginxForm.error_log_path = el[1];
    nginxForm.error_log_level = el[2] ?? "warn";
  }
  const al = get("access_log");
  if (al) nginxForm.access_log = al.split(/\s+/)[0];
  const gz = get("gzip");
  if (gz) nginxForm.gzip = gz === "on";
  const kt = get("keepalive_timeout");
  if (kt) nginxForm.keepalive_timeout = kt;
  const cmbs = get("client_max_body_size");
  if (cmbs) nginxForm.client_max_body_size = cmbs;
  const snhbs = get("server_names_hash_bucket_size");
  if (snhbs) nginxForm.server_names_hash_bucket_size = snhbs;
};

const applyFormToConfig = () => {
  let c = configContent.value;
  const replace = (key: string, val: string) => {
    const re = new RegExp(`(^\\s*${key}\\s+)[^;\\n]+(;)`, "m");
    if (re.test(c)) {
      c = c.replace(re, `$1${val}$2`);
    } else {
      // 追加到 http{} 块末尾
      c = c.replace(/(http\s*\{[\s\S]*?)(^\s*\})/m, `$1    ${key} ${val};\n$2`);
    }
  };
  replace("worker_processes", nginxForm.worker_processes);
  replace("worker_connections", nginxForm.worker_connections);
  const elRe = /^(\s*error_log\s+)\S+(\s*\S*)(;)/m;
  if (elRe.test(c)) {
    c = c.replace(elRe, `$1${nginxForm.error_log_path} ${nginxForm.error_log_level}$3`);
  } else {
    c = c.replace(/(http\s*\{[\s\S]*?)(^\s*\})/m, `$1    error_log ${nginxForm.error_log_path} ${nginxForm.error_log_level};\n$2`);
  }
  replace("access_log", nginxForm.access_log);
  replace("gzip", nginxForm.gzip ? "on" : "off");
  replace("keepalive_timeout", nginxForm.keepalive_timeout);
  replace("client_max_body_size", nginxForm.client_max_body_size);
  replace("server_names_hash_bucket_size", nginxForm.server_names_hash_bucket_size);
  configContent.value = c;
  ElMessage.success("表单已应用到配置");
};

const toggleFormMode = () => {
  if (!formMode.value) {
    parseConfigToForm();
  }
  formMode.value = !formMode.value;
};

const applyAndSave = async () => {
  applyFormToConfig();
  await saveAndReload();
};

// ─── 状态面板辅助 ─────────────────────────────────────────────────────────────
const statusIsActive = computed(() => {
  const s = nginxStatus.value?.systemctlStatus ?? "";
  return s.includes("active (running)");
});

const configTestOk = computed(() => {
  const s = nginxStatus.value?.configTest ?? "";
  return s.includes("syntax is ok") || s.includes("test is successful");
});

// ─── 初始化 ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([loadSites(), loadServers(), loadConfig("/etc/nginx/nginx.conf")]);
});

onUnmounted(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.nginx-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.nginx-layout {
  height: 100%;
  min-height: 0;
}

/* ── 左侧面板 ── */
.left-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: linear-gradient(180deg, #f8fafc, #f1f5f9);
}

.left-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);

  &--config {
    flex: 0 0 auto;
    border-bottom: none;
  }
}

.left-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 6px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.left-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  .el-icon {
    font-size: 13px;
    color: #6366f1;
  }
}

.left-section__scroll {
  flex: 1;
  min-height: 0;
}

.left-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 12px;
  color: #94a3b8;
  font-size: 12px;
}

/* ── 站点列表 ── */
.site-list {
  padding: 4px 0;
}

.site-item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 10px;
  margin: 1px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12.5px;
  color: #334155;
  transition: background 0.14s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.08);
  }

  &.is-active {
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.14), rgba(99, 102, 241, 0.06));
    color: #4f46e5;
    font-weight: 600;
  }
}

.site-item__icon {
  font-size: 13px;
  color: #6366f1;
  flex-shrink: 0;
}

.site-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ── 配置文件树 ── */
.config-tree {
  padding: 4px 0 8px;
}

.config-tree__item {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 28px;
  padding: 0 10px;
  margin: 1px 6px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  color: #475569;
  transition: background 0.14s ease;

  &:hover {
    background: rgba(99, 102, 241, 0.07);
  }

  &.is-active {
    background: rgba(99, 102, 241, 0.12);
    color: #4f46e5;
    font-weight: 600;
  }
}

.config-tree__icon {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.config-tree__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-family: "JetBrains Mono", "Fira Code", monospace;
}

/* ── 右侧主内容 ── */
.main-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

/* ── 编辑器面板 ── */
.editor-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #0f172a;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.96);
  border-bottom: 1px solid rgba(99, 102, 241, 0.18);
  flex-shrink: 0;
}

.editor-toolbar__left,
.editor-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  color: #94a3b8;

  .el-icon {
    color: #6366f1;
  }
}

.check-result {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(99, 102, 241, 0.12);

  .el-icon {
    font-size: 15px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  &--ok {
    background: rgba(16, 185, 129, 0.1);
    .el-icon { color: #10b981; }
  }

  &--err {
    background: rgba(239, 68, 68, 0.1);
    .el-icon { color: #ef4444; }
  }
}

.check-result__text {
  margin: 0;
  font-size: 12px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  color: #cbd5e1;
  white-space: pre-wrap;
  word-break: break-all;
}

.editor-wrap {
  flex: 1;
  min-height: 0;
  position: relative;
}

.editor-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: #64748b;
  font-size: 13px;
}

.nginx-editor {
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
  background: #0f172a;
  color: #e2e8f0;
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 13px;
  line-height: 1.7;
  border: none;
  outline: none;
  resize: none;
  tab-size: 4;

  &::placeholder {
    color: #334155;
  }

  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(99, 102, 241, 0.3);
    border-radius: 3px;
  }
}

/* ── 状态面板 ── */
.status-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f8fafc;
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.status-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.status-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-scroll {
  flex: 1;
  min-height: 0;
}

.status-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #94a3b8;
}

.status-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.status-cards {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
}

.status-card {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
}

.status-card__title {
  padding: 10px 14px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(248, 250, 252, 0.8);
}

.status-card__body {
  padding: 10px 14px;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);

  &:last-child {
    border-bottom: none;
  }
}

.status-row__label {
  flex-shrink: 0;
  width: 120px;
  font-size: 12px;
  color: #64748b;
}

.status-row__val {
  flex: 1;
  font-size: 13px;
  color: #1e293b;

  &--mono {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 12px;
  }
}

.status-pre {
  margin: 0;
  padding: 12px 14px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f8fafc;
  max-height: 240px;
  overflow-y: auto;
}

/* ── 日志面板 ── */
.log-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #0f172a;
}

.log-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(15, 23, 42, 0.96);
  border-bottom: 1px solid rgba(99, 102, 241, 0.18);
  flex-shrink: 0;
}

.log-type-tabs {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 3px;
}

.log-tab {
  padding: 4px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.14s ease;

  &.is-active {
    background: rgba(99, 102, 241, 0.2);
    color: #a5b4fc;
    font-weight: 600;
  }

  &:hover:not(.is-active) {
    background: rgba(255, 255, 255, 0.06);
    color: #94a3b8;
  }
}

.log-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-lines-label {
  font-size: 12px;
  color: #64748b;
}

.log-content-wrap {
  flex: 1;
  min-height: 0;
}

.log-scroll {
  height: 100%;
}

.log-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  color: #475569;
}

.log-pre {
  margin: 0;
  padding: 14px 16px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.65;
  color: #94a3b8;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ── 状态 stat-chips ── */
.status-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 14px 8px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;

  &--active {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.25);
  }

  &--inactive {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }

  &--version {
    background: rgba(99, 102, 241, 0.1);
    color: #4f46e5;
    border: 1px solid rgba(99, 102, 241, 0.2);
    font-family: "JetBrains Mono", monospace;
  }

  &--pid {
    background: rgba(148, 163, 184, 0.12);
    color: #475569;
    border: 1px solid rgba(148, 163, 184, 0.2);
    font-family: "JetBrains Mono", monospace;
  }

  &--ok {
    background: rgba(16, 185, 129, 0.1);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  &--fail {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
}

.status-chip__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.status-row__val--active {
  color: #059669;
  font-weight: 600;
}

.status-row__val--inactive {
  color: #dc2626;
  font-weight: 600;
}

/* ── 表单模式面板 ── */
.form-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.form-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  flex-shrink: 0;
}

.form-panel__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;

  .el-icon {
    color: #6366f1;
    font-size: 15px;
  }
}

.form-panel__scroll {
  flex: 1;
  min-height: 0;
}

.form-body {
  padding: 8px 0;
}

.form-row {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  gap: 12px;

  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  flex-shrink: 0;
  width: 160px;
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.form-input {
  flex: 1;
  height: 30px;
  padding: 0 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  font-size: 13px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  color: #1e293b;
  background: #f8fafc;
  outline: none;
  transition: border-color 0.14s ease, box-shadow 0.14s ease;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    background: #fff;
  }
}

.form-select {
  flex: 1;
}

.form-hint {
  padding: 12px 20px 16px;
  font-size: 11.5px;
  color: #94a3b8;
  border-top: 1px dashed rgba(148, 163, 184, 0.2);
  margin-top: 4px;
}

/* ── Server 树 ── */
.server-tree {
  padding: 4px 0;
}

.server-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 8px;
  margin: 1px 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.14s ease;
  position: relative;

  &:hover { background: rgba(99, 102, 241, 0.08); }
  &.is-active {
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.14), rgba(99, 102, 241, 0.06));
    color: #4f46e5;
    font-weight: 600;
  }
}

.server-row__arrow {
  font-size: 11px;
  color: #94a3b8;
  transition: transform 0.18s;
  flex-shrink: 0;
  cursor: pointer;
  &.is-expanded { transform: rotate(90deg); }
}

.server-row__icon {
  font-size: 14px;
  color: #6366f1;
  flex-shrink: 0;
}

.server-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 4px;
  overflow: hidden;
}

.server-row__name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-row__port {
  font-size: 11px;
  color: #94a3b8;
  font-family: "JetBrains Mono", monospace;
  flex-shrink: 0;
}

.server-row__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.location-list {
  padding-left: 28px;
  border-left: 2px solid rgba(99, 102, 241, 0.15);
  margin-left: 18px;
}

.location-row {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  margin: 1px 4px;
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.12s;

  &:hover { background: rgba(16, 185, 129, 0.07); }
  &.is-active { background: rgba(16, 185, 129, 0.12); color: #059669; }
}

.location-row__icon {
  font-size: 12px;
  color: #10b981;
  flex-shrink: 0;
}

.location-row__path {
  flex: 1;
  font-size: 12px;
  font-family: "JetBrains Mono", monospace;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.location-row__actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.location-add {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 26px;
  padding: 0 8px;
  margin: 2px 4px;
  border-radius: 7px;
  cursor: pointer;
  font-size: 11.5px;
  color: #94a3b8;
  border: 1px dashed rgba(148, 163, 184, 0.3);
  transition: all 0.12s;

  &:hover {
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.04);
  }
}

.left-section__actions {
  display: flex;
  gap: 4px;
}

/* ── Server 编辑表单 ── */
.form-section-title {
  padding: 10px 20px 6px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  margin-top: 8px;
}

.location-form-list {
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-form-item {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
  cursor: pointer;
  transition: border-color 0.14s;

  &:hover { border-color: rgba(99, 102, 241, 0.3); }
  &.is-active { border-color: #6366f1; background: rgba(99, 102, 241, 0.04); }
}

.location-form-item__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(248, 250, 252, 0.9);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.location-form-item__path {
  font-size: 12px;
  font-weight: 600;
  font-family: "JetBrains Mono", monospace;
  color: #4f46e5;
}

.location-form-item__body {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row-inline {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    flex-shrink: 0;
    width: 80px;
    font-size: 12px;
    color: #64748b;
  }

  .form-input {
    flex: 1;
    height: 26px;
    font-size: 12px;
  }
}

.location-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border: 1.5px dashed rgba(148, 163, 184, 0.3);
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  color: #94a3b8;
  transition: all 0.14s;

  &:hover {
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.04);
  }
}

/* ── 对话框表单 ── */
.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px 0;
}

/* ── 站点卡片列表 ── */
.server-cards-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f1f5f9;
}

.server-cards-scroll {
  height: 100%;
}

.server-cards-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.server-cards-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.server-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1.5px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;

  &:hover {
    border-color: rgba(99, 102, 241, 0.35);
    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
    transform: translateY(-1px);
  }

  &.is-active {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12), 0 4px 20px rgba(99, 102, 241, 0.12);
  }
}

.server-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(248, 250, 252, 0.7);
}

.server-card__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.server-card__globe {
  font-size: 16px;
  color: #6366f1;
  flex-shrink: 0;
}

.server-card__name {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-card__port {
  font-size: 13px;
  font-family: "JetBrains Mono", monospace;
  color: #6366f1;
  font-weight: 600;
  flex-shrink: 0;
  background: rgba(99, 102, 241, 0.08);
  padding: 2px 7px;
  border-radius: 6px;
}

.server-card__loc-count {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
  background: rgba(148, 163, 184, 0.12);
  padding: 2px 8px;
  border-radius: 6px;
}

.server-card__badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.server-card__ssl-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.server-card__root {
  padding: 8px 16px;
  font-size: 12px;
  font-family: "JetBrains Mono", monospace;
  color: #64748b;
  background: rgba(248, 250, 252, 0.5);
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.server-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
}

/* ── location 模式标签 ── */
.location-mode-tag {
  margin-left: 6px;
}

/* ── location 对话框增强 ── */
.loc-dialog-form {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 4px;
}

.loc-mode-row {
  height: auto;
  padding: 10px 20px;
  align-items: flex-start;
}

.loc-mode-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.loc-header-section {
  padding: 10px 20px;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loc-header-section__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.loc-preset-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.loc-header-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loc-add-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  border-radius: 7px;
  cursor: pointer;
  font-size: 12px;
  color: #94a3b8;
  transition: all 0.12s;

  &:hover {
    color: #6366f1;
    border-color: rgba(99, 102, 241, 0.4);
    background: rgba(99, 102, 241, 0.04);
  }
}

.form-row--textarea {
  height: auto;
  align-items: flex-start;
  padding: 12px 20px;
}

.form-textarea {
  height: 120px;
  resize: vertical;
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.6;
  padding: 8px 10px;
}
</style>
