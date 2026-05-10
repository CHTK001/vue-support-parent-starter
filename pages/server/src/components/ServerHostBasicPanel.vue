<template>
  <ScCard class="server-basic-panel" shadow="never">
    <template v-if="host">
      <div class="server-basic-panel__hero min-h-[200px]">
        <div class="server-basic-panel__identity">
          <div
            class="server-basic-panel__badge"
            :class="`is-${normalizeOs(host.osType) || 'default'}`"
          >
            <IconifyIconOnline :icon="osIcon(host.osType)" />
          </div>
          <div>
            <div class="server-basic-panel__title-row">
              <h2>{{ host.serverName }}</h2>
              <ScTag
                size="small"
                effect="plain"
                round
                class="server-basic-panel__latency"
                :type="tagTypeFromTone(latencyToneClass(snapshot?.latencyMs))"
              >
                {{ formatLatency(snapshot?.latencyMs) }}
              </ScTag>
            </div>
            <div class="server-basic-panel__identity-meta">
              <ScTag size="small" effect="plain" round>
                {{ serverTypeLabel(host.serverType) }}
              </ScTag>
              <ScTag size="small" effect="plain" round>
                {{ hostAddress(host) }}
              </ScTag>
              <ScTag size="small" effect="plain" round>
                {{ host.serverCode || "保存后自动生成编码" }}
              </ScTag>
              <ScTag
                size="small"
                effect="plain"
                round
                :type="host.enabled !== false ? 'success' : 'info'"
              >
                {{ host.enabled !== false ? "已启用" : "未启用" }}
              </ScTag>
            </div>
          </div>
        </div>

        <div class="server-basic-panel__action-groups">
          <div class="server-basic-panel__action-row">
            <span class="server-basic-panel__action-label">基础能力</span>
            <div class="server-basic-panel__actions">
              <el-tooltip
                effect="light"
                placement="bottom-start"
                trigger="click"
                popper-class="server-basic-panel__login-tooltip-popper"
                @show="loadLoginRecords()"
              >
                <template #content>
                  <div class="server-basic-panel__login-dropdown">
                    <div class="server-basic-panel__login-dropdown-header">
                      <span>最近登录记录</span>
                      <ScButton
                        link
                        type="primary"
                        size="small"
                        @click.stop="loadLoginRecords(true)"
                      >
                        <IconifyIconOnline icon="ri:refresh-line" />
                      </ScButton>
                    </div>

                    <div
                      v-if="loginRecordsUnavailable"
                      class="server-basic-panel__login-empty"
                    >
                      登录记录接口暂不可用
                    </div>
                    <div
                      v-else-if="loginRecords.length === 0"
                      class="server-basic-panel__login-empty"
                    >
                      暂无登录记录
                    </div>

                    <article
                      v-for="record in loginRecords"
                      :key="
                        record.id || `${record.username}-${record.loginTime}`
                      "
                      class="server-basic-panel__login-item"
                    >
                      <div class="server-basic-panel__login-item-content">
                        <div class="server-basic-panel__login-item-row">
                          <span class="server-basic-panel__login-user">{{
                            record.username || "-"
                          }}</span>
                          <span
                            class="server-basic-panel__login-status"
                            :class="`is-${String(record.status || '').toLowerCase()}`"
                          >
                            {{ record.status === "SUCCESS" ? "成功" : "失败" }}
                          </span>
                        </div>
                        <div class="server-basic-panel__login-item-row">
                          <span class="server-basic-panel__login-ip">{{
                            record.loginIp || "-"
                          }}</span>
                          <span class="server-basic-panel__login-time">{{
                            formatLoginTime(record.loginTime)
                          }}</span>
                        </div>
                        <div
                          class="server-basic-panel__login-item-row server-basic-panel__login-server"
                        >
                          <IconifyIconOnline icon="ri:server-line" />
                          <span>{{
                            record.serverName || record.host || "-"
                          }}</span>
                        </div>
                      </div>
                    </article>
                  </div>
                </template>
                <ScButton circle>
                  <IconifyIconOnline icon="ri:history-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="进程管理" placement="top">
                <ScButton circle @click="emit('open-processes')">
                  <IconifyIconOnline icon="ri:stack-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="端口搜索" placement="top">
                <ScButton circle @click="emit('open-port-search')">
                  <IconifyIconOnline icon="ri:plug-2-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="文件管理" placement="top">
                <ScButton circle @click="emit('open-files')">
                  <IconifyIconOnline icon="ri:folder-5-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="采集与显示配置" placement="top">
                <ScButton circle @click="emit('open-metrics-task')">
                  <IconifyIconOnline icon="ri:settings-4-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="预警设置" placement="top">
                <ScButton circle @click="emit('open-alert-settings')">
                  <IconifyIconOnline icon="ri:alarm-warning-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="远程代理" placement="top">
                <ScButton circle @click="emit('open-remote-settings')">
                  <IconifyIconOnline icon="ri:route-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip
                v-if="canOpenRemote"
                content="远程控制"
                placement="top"
              >
                <ScButton circle type="info" plain @click="emit('open-remote')">
                  <IconifyIconOnline icon="ri:remote-control-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="服务器大屏" placement="top">
                <ScButton circle plain @click="emit('open-dashboard')">
                  <IconifyIconOnline icon="ri:dashboard-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="编辑服务器" placement="top">
                <ScButton circle @click="emit('edit')">
                  <IconifyIconOnline icon="ri:edit-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip
                :content="host.enabled ? '停用服务器' : '启用服务器'"
                placement="top"
              >
                <ScButton
                  circle
                  :type="host.enabled ? 'warning' : 'success'"
                  plain
                  @click="emit('toggle-enabled')"
                >
                  <IconifyIconOnline
                    :icon="
                      host.enabled
                        ? 'ri:pause-circle-line'
                        : 'ri:play-circle-line'
                    "
                  />
                </ScButton>
              </el-tooltip>
            </div>
          </div>
          <div class="server-basic-panel__action-row">
            <span class="server-basic-panel__action-label">运维工具</span>
            <div class="server-basic-panel__actions">
              <el-tooltip content="系统日志" placement="top">
                <ScButton circle @click="emit('open-system-log')">
                  <IconifyIconOnline icon="ri:file-list-3-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="防火墙管理" placement="top">
                <ScButton circle @click="emit('open-firewall')">
                  <IconifyIconOnline icon="ri:shield-check-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="用户与 SSH 密钥" placement="top">
                <ScButton circle @click="emit('open-user-management')">
                  <IconifyIconOnline icon="ri:group-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="包更新管理" placement="top">
                <ScButton circle @click="emit('open-package-manager')">
                  <IconifyIconOnline icon="ri:box-3-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="操作系统配置" placement="top">
                <ScButton circle @click="emit('open-os-config')">
                  <IconifyIconOnline icon="ri:equalizer-line" />
                </ScButton>
              </el-tooltip>
            </div>
          </div>
          <div
            class="server-basic-panel__action-row server-basic-panel__action-row--software"
          >
            <span class="server-basic-panel__action-label">软件能力</span>
            <div class="server-basic-panel__actions">
              <el-tooltip
                v-if="softEnabled"
                content="软件安装向导"
                placement="top"
              >
                <ScButton
                  circle
                  type="success"
                  plain
                  @click="emit('open-install')"
                >
                  <IconifyIconOnline icon="ri:download-cloud-2-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="Docker 管理" placement="top">
                <ScButton
                  circle
                  type="primary"
                  plain
                  @click="emit('open-docker')"
                >
                  <IconifyIconOnline icon="mdi:docker" />
                </ScButton>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>

      <article class="server-basic-panel__realtime">
        <header class="server-basic-panel__realtime-header">
          <div>
            <h3>实时指标</h3>
            <p>
              {{
                snapshot?.detailMessage ||
                (snapshot?.online ? "Socket 实时推送中" : "等待服务器心跳")
              }}
            </p>
          </div>
          <ScSwitch
            v-model="metricChartCombined"
            active-icon="ri:line-chart-line"
            inactive-icon="ri:dashboard-line"
          />
        </header>

        <div
          v-if="metricChartMode === 'split'"
          class="server-basic-panel__metric-grid"
        >
          <article
            v-for="item in metricCards"
            :key="item.key"
            class="server-basic-panel__metric-card"
            :class="item.toneClass"
            role="button"
            :tabindex="0"
            @click="openMetricDetail(item.key)"
            @keydown.enter.prevent="openMetricDetail(item.key)"
            @keydown.space.prevent="openMetricDetail(item.key)"
          >
            <div
              class="server-basic-panel__metric-click-overlay"
              @click.stop="openMetricDetail(item.key)"
            />
            <div
              class="server-basic-panel__metric-liquid-bg"
              :style="{
                '--metric-progress': item.progress,
                '--metric-progress-visual': Math.max(Number(item.progress || 0), 8),
                '--metric-liquid-color': resolveLiquidColor(item.progress),
              }"
              aria-hidden="true"
            >
              <div class="server-basic-panel__metric-liquid-bg__water">
                <span class="server-basic-panel__metric-liquid-bg__wave is-front" />
                <span class="server-basic-panel__metric-liquid-bg__wave is-back" />
              </div>
              <div class="server-basic-panel__metric-liquid-bg__gloss" />
            </div>
            <div class="server-basic-panel__metric-top">
              <small>{{ item.label }}</small>
              <span>{{ item.subLabel }}</span>
            </div>
            <div class="server-basic-panel__metric-main">
              <strong
                :class="{
                  'is-io-number': item.key === 'io' || item.key === 'diskIo',
                }"
              >
                {{ isSmoothPercentMetric(item.key) ? smoothPercentText(item.key) : item.value }}
              </strong>
              <span>{{ item.total }}</span>
            </div>
          </article>
        </div>
        <div v-else class="server-basic-panel__realtime-combined">
          <div
            class="server-basic-panel__realtime-summary server-basic-panel__realtime-summary--combined"
          >
            <button
              v-for="item in metricCombinedCards"
              :key="item.key"
              type="button"
              class="server-basic-panel__realtime-mini"
              :class="[item.toneClass, { 'is-io-mini': isCombinedIoMetric(item.key) }]"
              @click="openMetricDetail(item.key)"
            >
              <div
                class="server-basic-panel__metric-liquid-bg server-basic-panel__metric-liquid-bg--mini"
                :style="{
                  '--metric-progress': item.progress,
                  '--metric-progress-visual': Math.max(Number(item.progress || 0), 10),
                  '--metric-liquid-color': resolveLiquidColor(item.progress),
                }"
                aria-hidden="true"
              >
                <div class="server-basic-panel__metric-liquid-bg__water">
                  <span class="server-basic-panel__metric-liquid-bg__wave is-front" />
                  <span class="server-basic-panel__metric-liquid-bg__wave is-back" />
                </div>
                <div class="server-basic-panel__metric-liquid-bg__gloss" />
              </div>
              <div class="server-basic-panel__realtime-mini-head">
                <small>{{ item.label }}</small>
                <span v-if="!isCombinedIoMetric(item.key)">{{ combinedMiniSubLabel(item) }}</span>
              </div>
              <div class="server-basic-panel__realtime-mini-main">
                <strong
                  :class="{
                    'is-io-number': item.key === 'io' || item.key === 'diskIo',
                  }"
                >
                  {{ combinedMiniValue(item) }}
                </strong>
                <span v-if="!isCombinedIoMetric(item.key)">{{ combinedMiniTotal(item) }}</span>
              </div>
            </button>
          </div>
          <div class="server-basic-panel__realtime-chart">
            <div class="server-basic-panel__realtime-chart-head">
              <strong>实时趋势</strong>
              <span>最近 500 条</span>
            </div>
            <ScEcharts :option="realtimeCombinedOption" height="220px" />
          </div>
        </div>
      </article>

      <div class="server-basic-panel__content">
        <article
          class="server-basic-panel__card server-basic-panel__card--basic"
        >
          <header class="server-basic-panel__card-header">
            <div class="server-basic-panel__card-title">
              <h3>基础信息</h3>
              <ScTag
                size="small"
                effect="plain"
                round
                :type="snapshot?.online ? 'success' : 'info'"
              >
                {{ snapshot?.online ? "在线" : "离线" }}
              </ScTag>
            </div>
            <div class="server-basic-panel__tag-group">
              <el-tooltip content="查看基础信息详情" placement="top">
                <ScButton circle plain @click.stop="emit('open-basic-detail')">
                  <IconifyIconOnline icon="ri:information-line" />
                </ScButton>
              </el-tooltip>
              <el-tooltip content="重新获取公网 IP" placement="top">
                <ScButton circle plain @click.stop="emit('refresh-public-ip')">
                  <IconifyIconOnline icon="ri:global-line" />
                </ScButton>
              </el-tooltip>
            </div>
          </header>

          <div
            class="server-basic-panel__content-scroll"
            :class="{ 'is-collapsed': !basicInfoExpanded }"
          >
            <dl class="server-basic-panel__info-grid">
              <div>
                <dt>接入类型</dt>
                <dd>{{ serverTypeLabel(host.serverType) }}</dd>
              </div>
              <div>
                <dt>主机地址</dt>
                <dd>{{ hostAddress(host) }}</dd>
              </div>
              <div>
                <dt>操作系统</dt>
                <dd>{{ osLabel(host.osType) }}</dd>
              </div>
              <div>
                <dt>实际系统</dt>
                <dd>{{ runtimeActualOsName }}</dd>
              </div>
              <div>
                <dt>系统架构</dt>
                <dd>{{ archLabel(host.architecture) }}</dd>
              </div>
              <div>
                <dt>用户名</dt>
                <dd>{{ host.username || "本机账号" }}</dd>
              </div>
              <div>
                <dt>基础目录</dt>
                <dd>{{ host.baseDirectory || "-" }}</dd>
              </div>
              <div>
                <dt>主机名称</dt>
                <dd>{{ runtimeHostName }}</dd>
              </div>
              <div>
                <dt>全局 AI</dt>
                <dd>
                  <el-tooltip
                    :content="
                      aiEnabled
                        ? [
                            aiProvider || aiDefaultProvider || aiStatusText,
                            aiProviderCount
                              ? `${aiProviderCount} 个 Provider`
                              : '',
                          ]
                            .filter(Boolean)
                            .join(' · ') || '已启用'
                        : aiUnavailableReason ||
                          aiStatusText ||
                          '未检测到全局 AI'
                    "
                    placement="top"
                  >
                    <ScTag
                      size="small"
                      effect="plain"
                      round
                      :type="aiEnabled ? 'success' : 'info'"
                    >
                      {{ aiEnabled ? "已启用" : "未启用" }}
                    </ScTag>
                  </el-tooltip>
                </dd>
              </div>
              <div>
                <dt>软件能力</dt>
                <dd>
                  <ScTag
                    size="small"
                    effect="plain"
                    round
                    :type="softEnabled ? 'success' : 'info'"
                  >
                    {{ softEnabled ? "已启用" : "未启用" }}
                  </ScTag>
                </dd>
              </div>
              <div>
                <dt>Docker 能力</dt>
                <dd>
                  <ScTag
                    size="small"
                    effect="plain"
                    round
                    :type="dockerCapability.enabled ? 'success' : 'info'"
                  >
                    {{
                      dockerCapability.enabled
                        ? `已启用 · ${dockerCapability.connectionType}`
                        : "未启用"
                    }}
                  </ScTag>
                  <div
                    v-if="dockerCapability.enabled"
                    class="server-basic-panel__diagnostic-grid"
                  >
                    <span
                      v-if="dockerCapability.apiPort"
                      class="server-basic-panel__diagnostic-chip is-primary"
                    >
                      API 端口 · {{ dockerCapability.apiPort }}
                    </span>
                    <span
                      v-if="dockerCapability.username"
                      class="server-basic-panel__diagnostic-chip is-muted"
                    >
                      账号 · {{ dockerCapability.username }}
                    </span>
                    <span
                      v-if="dockerCapability.latency"
                      class="server-basic-panel__diagnostic-chip is-success"
                    >
                      延迟 · {{ dockerCapability.latency }} ms
                    </span>
                  </div>
                </dd>
              </div>
              <div>
                <dt>公网地址</dt>
                <dd>{{ runtimePublicIp }}</dd>
              </div>
              <div>
                <dt>GCC 版本</dt>
                <dd>{{ runtimeGccVersion }}</dd>
              </div>
              <div>
                <dt>内核 / 版本</dt>
                <dd>{{ runtimeKernelVersion }}</dd>
              </div>
              <div
                v-if="!aiEnabled && aiUnavailableReason"
                class="server-basic-panel__info-span-2"
              >
                <dt>AI 诊断</dt>
                <dd>
                  <p class="server-basic-panel__diagnostic-text">
                    {{ aiUnavailableReason }}
                  </p>
                  <div class="server-basic-panel__diagnostic-actions">
                    <el-tooltip content="打开系统设置并配置 AI Provider">
                      <ScButton
                        circle
                        size="small"
                        type="primary"
                        plain
                        @click.stop="openAiSettings"
                      >
                        <IconifyIconOnline icon="ri:settings-4-line" />
                      </ScButton>
                    </el-tooltip>
                  </div>
                  <div
                    v-if="aiDiagnosticItems.length"
                    class="server-basic-panel__diagnostic-grid"
                  >
                    <span
                      v-for="item in aiDiagnosticItems"
                      :key="`detail-${item.label}`"
                      class="server-basic-panel__diagnostic-chip"
                      :class="item.toneClass"
                    >
                      {{ item.label }} · {{ item.value }}
                    </span>
                  </div>
                </dd>
              </div>
              <div class="server-basic-panel__info-span-2">
                <dt>标签</dt>
                <dd>{{ host.tagsList?.join(" / ") || "-" }}</dd>
              </div>
              <div class="server-basic-panel__info-span-2">
                <dt>描述</dt>
                <dd>{{ host.description || "-" }}</dd>
              </div>
            </dl>

            <section class="server-basic-panel__ops-grid">
              <button
                type="button"
                class="server-basic-panel__ops-card"
                :disabled="!softEnabled"
                @click.stop="emit('open-soft')"
              >
                <small>软件实例</small>
                <strong>{{ softwareSummary.installations }}</strong>
                <span>打开软件驾驶舱查看安装与实例</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__ops-card"
                :disabled="!services.length"
                @click.stop="emit('detail-service', services[0])"
              >
                <small>服务主档</small>
                <strong>{{ services.length }}</strong>
                <span>{{
                  services.length ? "查看最近服务详情" : "等待新增或自动检测"
                }}</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__ops-card"
                @click.stop="emit('open-processes')"
              >
                <small>进程管理</small>
                <strong>{{ snapshot?.online ? "在线" : "离线" }}</strong>
                <span>打开任务管理器查看实时进程</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__ops-card"
                @click.stop="emit('open-port-search')"
              >
                <small>端口搜索</small>
                <strong>{{ host.port || "-" }}</strong>
                <span>输入端口号快速检索占用与管理入口</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__ops-card"
                @click.stop="emit('open-files')"
              >
                <small>文件管理</small>
                <strong>{{ host.baseDirectory || "./" }}</strong>
                <span>打开文件管理器查看树状与文本编辑</span>
              </button>
            </section>
          </div>
          <div class="server-basic-panel__collapse-actions">
            <ScButton
              size="small"
              plain
              @click="basicInfoExpanded = !basicInfoExpanded"
            >
              {{ basicInfoExpanded ? "收起" : "展开" }}基础信息
            </ScButton>
          </div>
        </article>

        <article
          class="server-basic-panel__card server-basic-panel__card--alert"
        >
          <header
            class="server-basic-panel__card-header server-basic-panel__card-header--stack"
          >
            <div>
              <h3>预警中心</h3>
              <p class="server-basic-panel__card-desc">
                CPU、内存、磁盘、网络、延迟命中阈值后会实时推送到这里。
              </p>
            </div>
            <div class="server-basic-panel__tag-group">
              <ServerAiActionButton
                tooltip="AI 稳定性分析"
                :disabled-tooltip="aiUnavailableReason || 'AI 能力未激活'"
                :loading="analyzingStability"
                scene="server-host-stability"
                system-prompt="你是服务器稳定性分析助手，需要基于监控与告警上下文给出中文诊断。"
                :prompt="buildStabilityPrompt"
                :method="aiEnabled ? () => emit('analyze-stability') : undefined"
              />
              <span
                class="server-basic-panel__lay-tag"
                :class="alertStatusClass"
              >
                {{ alertStatusText }}
              </span>
              <span
                class="server-basic-panel__lay-tag"
                :class="alertMessageEnabled ? 'is-primary' : 'is-muted'"
              >
                {{ alertMessageEnabled ? "已同步消息中心" : "未同步消息中心" }}
              </span>
              <span
                v-if="latestAlertTime"
                class="server-basic-panel__lay-tag is-muted"
              >
                最新 {{ latestAlertTime }}
              </span>
            </div>
          </header>

          <div
            ref="alertScrollRef"
            class="server-basic-panel__content-scroll server-basic-panel__alert-scroll"
          >
            <article
              v-if="latestAlert"
              class="server-basic-panel__alert-hero"
              :class="severityClass(latestAlert.severity)"
            >
              <div class="server-basic-panel__alert-hero-main">
                <small>最新触发</small>
                <strong>
                  {{ metricLabel(latestAlert.metricType) }} ·
                  {{ severityLabel(latestAlert.severity) }}
                </strong>
                <p>{{ latestAlert.alertMessage || "已触发实时预警" }}</p>
              </div>
              <div class="server-basic-panel__alert-hero-side">
                <span
                  class="server-basic-panel__lay-tag"
                  :class="severityClass(latestAlert.severity)"
                >
                  {{
                    formatAlertMetricValue(latestAlert, latestAlert.metricValue)
                  }}
                </span>
                <small>{{ latestAlert.createTime || "刚刚" }}</small>
              </div>
            </article>
            <article
              v-if="!aiEnabled && aiUnavailableReason"
              class="server-basic-panel__ai-card server-basic-panel__ai-card--inactive"
            >
              <div class="server-basic-panel__ai-card-top">
                <strong>全局 AI 稳定性分析未激活</strong>
                <div class="server-basic-panel__tag-group">
                  <span class="server-basic-panel__lay-tag is-warning">
                    需要先激活 AI
                  </span>
                </div>
              </div>
              <p>{{ aiUnavailableReason }}</p>
              <small>激活后可在这里生成当前时间的稳定性结论和处理建议。</small>
              <div class="server-basic-panel__diagnostic-actions">
                <el-tooltip content="打开系统设置并配置 AI Provider">
                  <ScButton
                    circle
                    size="small"
                    type="primary"
                    plain
                    @click.stop="openAiSettings"
                  >
                    <IconifyIconOnline icon="ri:settings-4-line" />
                  </ScButton>
                </el-tooltip>
              </div>
            </article>
            <article
              v-if="stabilityAiTask?.aiReason || stabilityAiTask?.aiSolution"
              class="server-basic-panel__ai-card"
            >
              <div class="server-basic-panel__ai-card-top">
                <strong>AI 稳定性结论</strong>
                <div class="server-basic-panel__tag-group">
                  <span class="server-basic-panel__lay-tag is-primary">
                    {{ stabilityAiTask?.aiProvider || "AI" }}
                  </span>
                  <span class="server-basic-panel__lay-tag is-muted">
                    {{ stabilityAiTask?.message || "分析完成" }}
                  </span>
                </div>
              </div>
              <p>{{ stabilityAiTask?.aiReason }}</p>
              <small>{{
                stabilityAiTask?.aiSolution || "暂无进一步建议"
              }}</small>
            </article>
            <div class="server-basic-panel__alert-summary">
              <button
                type="button"
                class="server-basic-panel__summary-card"
                @click="emit('open-alert-settings')"
              >
                <small>当前策略</small>
                <strong>{{
                  alertSettingsEnabled === false ? "关闭" : "启用中"
                }}</strong>
                <span>{{
                  alertMessageEnabled ? "联动站内消息" : "仅站内实时流"
                }}</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__summary-card"
                @click="emit('open-alert-settings')"
              >
                <small>消息中心</small>
                <strong>{{ alertMessageEnabled ? "已联动" : "未联动" }}</strong>
                <span>{{
                  alertMessageEnabled
                    ? "sys_message 实时通知"
                    : "保留页内与 Socket 事件"
                }}</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__summary-card"
                :disabled="!latestAlert"
              >
                <small>最新级别</small>
                <strong>{{
                  latestAlert ? severityLabel(latestAlert.severity) : "正常"
                }}</strong>
                <span>{{
                  latestAlert ? metricLabel(latestAlert.metricType) : "等待触发"
                }}</span>
              </button>
              <button
                type="button"
                class="server-basic-panel__summary-card"
                :disabled="!latestAlert"
              >
                <small>最近告警</small>
                <strong>{{ orderedAlerts.length }}</strong>
                <span>
                  危险 {{ latestDangerCount }} / 预警 {{ latestWarningCount }}
                  <template v-if="latestAlertTime">
                    · {{ latestAlertTime }}</template
                  >
                </span>
              </button>
            </div>

            <section
              v-if="orderedAlerts.length"
              class="server-basic-panel__alert-chart-wrap"
            >
              <header class="server-basic-panel__alert-list-header">
                <div>
                  <strong>最新预警实时图表</strong>
                  <span>按时间轴展示最近 100 条预警</span>
                </div>
                <span class="server-basic-panel__lay-tag is-muted">
                  共 {{ orderedAlerts.length }} 条（缓存上限 100）
                </span>
              </header>
              <ScEcharts
                class="server-basic-panel__alert-chart"
                :option="alertTrendOption"
                height="260px"
              />
            </section>
            <div v-else class="server-basic-panel__alert-empty">
              <strong>当前没有触发中的预警</strong>
              <span
                >服务器阈值正常时，这里会保持干净；命中阈值后会立即更新。</span
              >
            </div>
          </div>
        </article>

        <template v-for="gpu in gpuList" :key="gpu.name || 'gpu'">
          <article class="server-basic-panel__card server-basic-panel__card--gpu">
            <header class="server-basic-panel__card-header server-basic-panel__card-header--stack">
              <div>
                <h3><IconifyIconOnline icon="ri:tv-line" /> GPU {{ gpuList.length > 1 ? `- ${gpu.name || '未知'}` : '' }}</h3>
                <p class="server-basic-panel__card-desc">驱动版本 · 温度 · 显存 · 利用率</p>
              </div>
            </header>
            <div class="server-basic-panel__hardware-grid">
              <div class="server-basic-panel__hardware-item">
                <small>驱动版本</small>
                <strong>{{ gpu.driverVersion || '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>驱动日期</small>
                <strong>{{ gpu.driverDate || '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item" v-if="gpu.directXVersion">
                <small>DirectX</small>
                <strong>{{ gpu.directXVersion }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>温度</small>
                <strong>{{ gpu.temperature != null ? `${gpu.temperature}°C` : '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>显存</small>
                <strong>{{ formatByteSize(gpu.memoryUsedBytes) }} / {{ formatByteSize(gpu.memoryTotalBytes) }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>利用率</small>
                <strong>{{ gpu.utilizationPercent != null ? `${Math.round(gpu.utilizationPercent)}%` : '-' }}</strong>
              </div>
            </div>
            <div class="server-basic-panel__card-chart">
              <ScEcharts :option="diskMiniOption" height="90px" />
            </div>
          </article>
        </template>

        <article class="server-basic-panel__card server-basic-panel__card--memory">
          <header
            class="server-basic-panel__card-header server-basic-panel__card-header--stack"
          >
            <div>
              <h3>内存</h3>
              <p class="server-basic-panel__card-desc">
                Cache / 已用 / 剩余 / 总量总览。
              </p>
            </div>
            <template v-if="memoryDetail">
              <div class="server-basic-panel__tag-group">
                <span v-if="memoryDetail.speed" class="server-basic-panel__lay-tag is-primary">
                  {{ memoryDetail.speed }}
                </span>
                <span v-if="memoryDetail.slotCount" class="server-basic-panel__lay-tag is-muted">
                  {{ memoryDetail.slotCount }} 插槽
                </span>
                <span v-if="memoryDetail.formFactor" class="server-basic-panel__lay-tag is-muted">
                  {{ memoryDetail.formFactor }}
                </span>
              </div>
            </template>
          </header>
          <div class="server-basic-panel__memory-overview">
            <ScEcharts :option="memoryUsageOption" height="220px" />
            <div class="server-basic-panel__memory-grid">
              <div class="server-basic-panel__memory-item">
                <small>Cache</small>
                <strong>{{ memoryCacheText }}</strong>
              </div>
              <div class="server-basic-panel__memory-item">
                <small>已用</small>
                <strong>{{ formatByteSize(memoryUsedBytes) }}</strong>
              </div>
              <div class="server-basic-panel__memory-item">
                <small>剩余</small>
                <strong>{{ formatByteSize(memoryFreeBytes) }}</strong>
              </div>
              <div class="server-basic-panel__memory-item">
                <small>总量</small>
                <strong>{{ formatByteSize(memoryTotalBytes) }}</strong>
              </div>
            </div>
          </div>
          <div class="server-basic-panel__card-chart">
            <ScEcharts :option="diskMiniOption" height="90px" />
          </div>
        </article>

        <template v-if="disks.length > 0">
          <article
            v-for="disk in disks"
            :key="disk.name || 'disk'"
            class="server-basic-panel__card server-basic-panel__card--disk"
          >
            <header class="server-basic-panel__card-header server-basic-panel__card-header--stack">
              <div>
                <h3><IconifyIconOnline icon="ri:hard-drive-line" /> {{ disk.name || '磁盘' }}</h3>
                <p class="server-basic-panel__card-desc">
                  <template v-if="disk.type">类型: {{ disk.type }}</template>
                  <template v-if="disk.systemDisk"> · 系统磁盘</template>
                  <template v-if="disk.avgResponseTimeMs != null"> · 平均响应: {{ disk.avgResponseTimeMs }}ms</template>
                </p>
              </div>
              <div class="server-basic-panel__tag-group">
                <span v-if="disk.systemDisk" class="server-basic-panel__lay-tag is-primary">系统盘</span>
                <span v-if="disk.type" class="server-basic-panel__lay-tag is-muted">{{ disk.type }}</span>
                <span class="server-basic-panel__lay-tag is-muted">
                  {{ (disk.partitions || []).length }} 个分区
                </span>
              </div>
            </header>

            <div class="server-basic-panel__hardware-grid">
              <div class="server-basic-panel__hardware-item">
                <small>读取速度</small>
                <strong>{{ formatThroughput(disk.readSpeedBytesPerSecond) }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>写入速度</small>
                <strong>{{ formatThroughput(disk.writeSpeedBytesPerSecond) }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>平均响应</small>
                <strong>{{ disk.avgResponseTimeMs != null ? `${disk.avgResponseTimeMs} ms` : '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>总计</small>
                <strong>{{ formatByteSize(disk.totalBytes) }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>已用</small>
                <strong>{{ formatByteSize(disk.usedBytes) }}</strong>
              </div>
            </div>

            <div v-if="disk.partitions && disk.partitions.length" class="server-basic-panel__disk-partitions">
              <div class="server-basic-panel__partitions-list">
                <article
                  v-for="(partition, pIdx) in disk.partitions"
                  :key="partition.name || partition.mountPoint || pIdx"
                  class="server-basic-panel__partition-item"
                >
                  <div class="server-basic-panel__partition-header">
                    <div class="server-basic-panel__partition-info">
                      <span class="server-basic-panel__partition-name">
                        {{ partition.name || partition.mountPoint || '-' }}
                      </span>
                      <ScTag size="small" effect="plain" class="server-basic-panel__partition-type">
                        {{ partition.fileSystem || '-' }}
                      </ScTag>
                    </div>
                    <span class="server-basic-panel__partition-usage" :class="partitionUsageClass(partition.usagePercent)">
                      {{ formatMetricPercent(partition.usagePercent) }}
                    </span>
                  </div>
                  <div class="server-basic-panel__partition-progress">
                    <el-progress
                      :percentage="partitionPercent(partition)"
                      :show-text="false"
                      :color="partitionProgressColor(partition.usagePercent)"
                    />
                    <div class="server-basic-panel__partition-progress-meta">
                      <span>{{ formatByteSize(partition.usedBytes) }}</span>
                      <span>{{ formatByteSize(partition.totalBytes) }}</span>
                    </div>
                  </div>
                </article>
              </div>
            </div>
            <div class="server-basic-panel__card-chart">
              <ScEcharts :option="diskMiniOption" height="90px" />
            </div>
          </article>
        </template>

        <template v-else>
          <article class="server-basic-panel__card server-basic-panel__card--disk">
            <header class="server-basic-panel__card-header server-basic-panel__card-header--stack">
              <div>
                <h3><IconifyIconOnline icon="ri:hard-drive-line" /> 磁盘</h3>
                <p class="server-basic-panel__card-desc">分区占用状态。</p>
              </div>
              <div class="server-basic-panel__tag-group">
                <span class="server-basic-panel__lay-tag is-muted">{{ diskPartitions.length }} 个分区</span>
              </div>
            </header>
            <div class="server-basic-panel__disk-partitions">
              <div class="server-basic-panel__disk-overview">
                <ScEcharts :option="diskUsageTotalOption" height="240px" />
                <div class="server-basic-panel__disk-overview-text">
                  <span>总量：{{ formatByteSize(diskTotalBytes) }}</span>
                  <span>已用：{{ formatByteSize(diskUsedBytes) }}</span>
                  <span>可用：{{ formatByteSize(diskFreeBytes) }}</span>
                  <span>使用率：{{ formatMetricPercent(diskUsagePercent) }}</span>
                </div>
              </div>
              <div class="server-basic-panel__partitions-list-container thin-scroller">
                <div class="server-basic-panel__partitions-list">
                  <article
                    v-for="(partition, index) in visibleDiskPartitions"
                    :key="partition.name || partition.mountPoint || partition.label || String(index)"
                    class="server-basic-panel__partition-item"
                  >
                    <div class="server-basic-panel__partition-header">
                      <div class="server-basic-panel__partition-info">
                        <IconifyIconOnline icon="ri:hard-drive-line" class="server-basic-panel__partition-icon" />
                        <span class="server-basic-panel__partition-name">{{ partition.name || partition.mountPoint || "-" }}</span>
                        <ScTag size="small" effect="plain" class="server-basic-panel__partition-type">{{ partition.fileSystem || "-" }}</ScTag>
                      </div>
                      <span class="server-basic-panel__partition-usage" :class="partitionUsageClass(partition.usagePercent)">
                        {{ formatMetricPercent(partition.usagePercent) }}
                      </span>
                    </div>
                    <div class="server-basic-panel__partition-progress">
                      <el-progress :percentage="partitionPercent(partition)" :show-text="false" :color="partitionProgressColor(partition.usagePercent)" />
                      <div class="server-basic-panel__partition-progress-meta">
                        <span>{{ formatByteSize(partition.usedBytes) }}</span>
                        <span>{{ formatByteSize(partition.totalBytes) }}</span>
                      </div>
                    </div>
                    <div class="server-basic-panel__partition-details">
                      <span>已用: {{ formatByteSize(partition.usedBytes) }}</span>
                      <span>可用: {{ formatByteSize(partition.freeBytes) }}</span>
                      <span>总计: {{ formatByteSize(partition.totalBytes) }}</span>
                    </div>
                  </article>
                  <el-empty v-if="!diskPartitions.length" description="暂无磁盘分区数据" :image-size="56" />
                </div>
              </div>
              <div v-if="diskPartitions.length > diskCollapsedLimit" class="server-basic-panel__collapse-actions">
                <ScButton text type="primary" @click="diskExpanded = !diskExpanded">
                  {{ diskExpanded ? "收起" : "展开" }}磁盘分区
                </ScButton>
              </div>
            </div>
          </article>
        </template>

        <template v-if="cpuDetail">
          <article class="server-basic-panel__card server-basic-panel__card--cpu">
            <header class="server-basic-panel__card-header server-basic-panel__card-header--stack">
              <div>
                <h3><IconifyIconOnline icon="ri:cpu-line" /> CPU</h3>
                <p class="server-basic-panel__card-desc">
                  {{ cpuDetail.name || '处理器' }}
                  <template v-if="cpuDetail.baseSpeedMhz"> · 基准 {{ cpuDetail.baseSpeedMhz }} MHz</template>
                  <template v-if="cpuDetail.currentSpeedMhz"> · 实时 {{ cpuDetail.currentSpeedMhz }} MHz</template>
                </p>
              </div>
              <div class="server-basic-panel__tag-group">
                <span class="server-basic-panel__lay-tag is-primary">
                  {{ cpuDetail.utilizationPercent != null ? `${Math.round(cpuDetail.utilizationPercent)}%` : '-' }}
                </span>
                <ScSwitch
                  v-if="cpuDetail.perProcessorUtilization && cpuDetail.perProcessorUtilization.length > 0"
                  v-model="cpuChartPerCore"
                  active-text="逻辑处理器"
                  inactive-text="总利用率"
                  size="small"
                />
              </div>
            </header>

            <div class="server-basic-panel__hardware-grid">
              <div class="server-basic-panel__hardware-item">
                <small>物理内核</small>
                <strong>{{ cpuDetail.physicalCoreCount ?? '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>逻辑处理器</small>
                <strong>{{ cpuDetail.logicalProcessorCount ?? '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>插槽</small>
                <strong>{{ cpuDetail.socketCount ?? '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>基准速度</small>
                <strong>{{ cpuDetail.baseSpeedMhz ? `${cpuDetail.baseSpeedMhz} MHz` : '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>实时速度</small>
                <strong>{{ cpuDetail.currentSpeedMhz ? `${cpuDetail.currentSpeedMhz} MHz` : '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>虚拟化</small>
                <strong>{{ cpuDetail.virtualizationEnabled ? '已启用' : '未启用' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>L1 缓存</small>
                <strong>{{ cpuDetail.l1CacheBytes ? formatByteSize(cpuDetail.l1CacheBytes) : '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>L2 缓存</small>
                <strong>{{ cpuDetail.l2CacheBytes ? formatByteSize(cpuDetail.l2CacheBytes) : '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>L3 缓存</small>
                <strong>{{ cpuDetail.l3CacheBytes ? formatByteSize(cpuDetail.l3CacheBytes) : '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>句柄数</small>
                <strong>{{ cpuDetail.handleCount ?? '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>线程数</small>
                <strong>{{ cpuDetail.threadCount ?? '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>进程数</small>
                <strong>{{ cpuDetail.processCount ?? '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>运行时间</small>
                <strong>{{ formatUptime(cpuDetail.uptimeMs) }}</strong>
              </div>
            </div>

            <ScEcharts v-if="cpuChartPerCore && cpuDetail.perProcessorUtilization" :option="cpuPerCoreOption" height="160px" />
            <ScEcharts v-else :option="cpuUsageOption" height="160px" />
            <div class="server-basic-panel__card-chart">
              <ScEcharts :option="diskMiniOption" height="90px" />
            </div>
          </article>
        </template>

        <template v-if="ethernetInterfaces && ethernetInterfaces.length > 0">
          <article
            v-for="eth in ethernetInterfaces"
            :key="eth.name || 'eth'"
            class="server-basic-panel__card server-basic-panel__card--network"
          >
            <header class="server-basic-panel__card-header server-basic-panel__card-header--stack">
              <div>
                <h3><IconifyIconOnline icon="ri:network-line" /> {{ eth.displayName || eth.name || '以太网' }}</h3>
                <p class="server-basic-panel__card-desc">
                  <template v-if="eth.connectionType">连接类型: {{ eth.connectionType }}</template>
                  <template v-if="eth.macAddress"> · MAC: {{ eth.macAddress }}</template>
                </p>
              </div>
            </header>
            <div class="server-basic-panel__hardware-grid">
              <div class="server-basic-panel__hardware-item">
                <small>IPv4</small>
                <strong>{{ eth.ipv4 || '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>IPv6</small>
                <strong>{{ eth.ipv6 || '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>连接类型</small>
                <strong>{{ eth.connectionType || '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>适配器</small>
                <strong>{{ eth.displayName || eth.name || '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>发送速率</small>
                <strong>{{ formatThroughput(eth.sentBytesPerSecond) }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>接收速率</small>
                <strong>{{ formatThroughput(eth.receivedBytesPerSecond) }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>发送数据包</small>
                <strong>{{ eth.sentPackets != null ? eth.sentPackets.toLocaleString() : '-' }}</strong>
              </div>
              <div class="server-basic-panel__hardware-item">
                <small>接收数据包</small>
                <strong>{{ eth.receivedPackets != null ? eth.receivedPackets.toLocaleString() : '-' }}</strong>
              </div>
            </div>
            <div class="server-basic-panel__card-chart">
              <ScEcharts :option="diskMiniOption" height="90px" />
            </div>
          </article>
        </template>

        <article
          class="server-basic-panel__card server-basic-panel__card--service"
        >
          <ServerServicePanel
            :services="services"
            :ai-enabled="aiEnabled"
            :ai-unavailable-reason="aiUnavailableReason"
            :can-auto-detect="canAutoDetectServices"
            :detecting="detectingServices"
            :action-loading-key="serviceActionLoadingKey"
            @create="emit('create-service')"
            @action="emit('service-action', $event[0], $event[1])"
            @ai-fix="emit('service-ai-fix', $event)"
            @logs="emit('view-service-logs', $event)"
            @edit="emit('edit-service', $event)"
            @detail="emit('detail-service', $event)"
            @detect="emit('detect-services')"
          />
        </article>
      </div>
    </template>

    <el-empty v-else description="请选择左侧服务器查看基础信息" />
  </ScCard>
</template>

<script setup lang="ts">
import { ScButton } from "@repo/components/ScButton";
import { computed, nextTick, reactive, ref, watch } from "vue";
import { emitter } from "@repo/core";
import ScCard from "@repo/components/ScCard/index.vue";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import ServerAiActionButton from "./ServerAiActionButton.vue";
import ServerServicePanel from "./ServerServicePanel.vue";
import type {
  ServerAlertEvent,
  ServerDiskPartitionView,
  ServerAlertSettings,
  ServerAiTaskPayload,
  ServerGpuView,
  ServerCpuDetailView,
  ServerDiskView,
  ServerEthernetView,
  ServerMemoryDetailView,
  ServerHost,
  ServerLoginRecord,
  ServerMetricsDetail,
  ServerMetricsSnapshot,
  ServerRemoteConsoleConfig,
  ServerService,
} from "../api";
import { listServerLoginRecords } from "../api";
import type { HostSoftSummary } from "./server-types";
import {
  archLabel,
  formatByteSize,
  formatLatency,
  formatMetricPercent,
  formatThroughput,
  hostAddress,
  latencyToneClass,
  normalizeOs,
  osIcon,
  osLabel,
  resolveIoTotal,
  resolveDiskIoTotal,
  serverTypeLabel,
} from "../utils/serverHost";

type ServerServiceAction =
  | "register"
  | "unregister"
  | "start"
  | "stop"
  | "restart"
  | "status";
type MetricChartMode = "split" | "combined";

const tagTypeFromTone = (toneClass?: string) => {
  if (toneClass === "is-danger") return "danger";
  if (toneClass === "is-warning") return "warning";
  return "success";
};

// ── CPU 图表 ──────────────────────────────────────────
const cpuChartPerCore = ref(false);

const cpuHistoryData = computed(() =>
  [...(props.history || [])]
    .sort((a, b) => Number(a.collectTimestamp || 0) - Number(b.collectTimestamp || 0))
    .slice(-120),
);

const cpuUsageOption = computed(() => {
  const rows = cpuHistoryData.value;
  const labels = rows.map((r, i) => {
    const t = Number(r.collectTimestamp || 0);
    if (t > 0) {
      const d = new Date(t);
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
    }
    return String(i + 1);
  });
  return {
    grid: { left: 16, right: 16, top: 28, bottom: 24, containLabel: true },
    tooltip: { trigger: "axis", confine: true },
    xAxis: { type: "category", boundaryGap: false, data: labels, axisLabel: { color: "#64748b", fontSize: 11 } },
    yAxis: { type: "value", min: 0, max: 100, axisLabel: { color: "#64748b", formatter: "{value}%" }, splitLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } } },
    series: [{ name: "CPU 利用率", type: "line", smooth: true, symbol: "none", areaStyle: { opacity: 0.15 }, data: rows.map(r => clampProgress(r.cpuUsage)) }],
  };
});

const cpuPerCoreOption = computed(() => {
  const detail = props.runtimeDetail?.cpuDetail;
  const perData = detail?.perProcessorUtilization || [];
  if (!perData.length) return cpuUsageOption.value;
  return {
    grid: { left: 16, right: 16, top: 28, bottom: 24, containLabel: true },
    tooltip: { trigger: "axis", confine: true },
    xAxis: { type: "category", data: perData.map((_, i) => `#${i + 1}`), axisLabel: { color: "#64748b", fontSize: 10, interval: 0, rotate: 45 } },
    yAxis: { type: "value", min: 0, max: 100, axisLabel: { color: "#64748b", formatter: "{value}%" }, splitLine: { lineStyle: { color: "rgba(148,163,184,0.18)" } } },
    series: [{ name: "逻辑处理器", type: "bar", data: perData.map(v => clampProgress(v)), itemStyle: { borderRadius: [2, 2, 0, 0] } }],
  };
});

function formatUptime(ms) {
  if (ms == null || ms < 0) return "-";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}


const props = withDefaults(
  defineProps<{
    host?: ServerHost | null;
    snapshot?: ServerMetricsSnapshot | null;
    history?: ServerMetricsSnapshot[];
    runtimeDetail?: ServerMetricsDetail | null;
    remoteConfig?: ServerRemoteConsoleConfig | null;
    canOpenRemote?: boolean;
    softEnabled?: boolean;
    aiEnabled?: boolean;
    aiProvider?: string;
    aiDefaultProvider?: string;
    aiProviderCount?: number;
    aiProviderNames?: string[];
    aiConfigReady?: boolean;
    aiChatClientReady?: boolean;
    aiStatusText?: string;
    aiUnavailableReason?: string;
    aiUnavailableCode?: string;
    aiProviderResolvedFrom?: string;
    alertSettings?: ServerAlertSettings | null;
    alertSettingsEnabled?: boolean;
    alertMessageEnabled?: boolean;
    stabilityAiTask?: ServerAiTaskPayload | null;
    analyzingStability?: boolean;
    latestAlerts?: ServerAlertEvent[];
    canAutoDetectServices?: boolean;
    detectingServices?: boolean;
    softwareSummary?: HostSoftSummary;
    services?: ServerService[];
    serviceActionLoadingKey?: string;
  }>(),
  {
    host: null,
    snapshot: null,
    history: () => [],
    runtimeDetail: null,
    remoteConfig: null,
    canOpenRemote: false,
    softEnabled: false,
    aiEnabled: false,
    aiProvider: "",
    aiDefaultProvider: "",
    aiProviderCount: 0,
    aiProviderNames: () => [],
    aiConfigReady: false,
    aiChatClientReady: false,
    aiStatusText: "",
    aiUnavailableReason: "",
    aiUnavailableCode: "",
    aiProviderResolvedFrom: "",
    alertSettings: null,
    alertSettingsEnabled: true,
    alertMessageEnabled: false,
    stabilityAiTask: null,
    analyzingStability: false,
    latestAlerts: () => [],
    canAutoDetectServices: false,
    detectingServices: false,
    softwareSummary: () => ({
      targets: 0,
      installations: 0,
      services: 0,
    }),
    services: () => [],
    serviceActionLoadingKey: "",
  },
);

const buildStabilityPrompt = computed(() => {
  if (!props.host) {
    return "请基于当前服务器的实时状态、最新告警和运行上下文，输出稳定性风险结论与处理建议。";
  }
  return [
    `服务器名称：${props.host.serverName || "-"}`,
    `服务器地址：${hostAddress(props.host)}`,
    `操作系统：${osLabel(props.host.osType)}`,
    `在线状态：${props.snapshot?.online ? "在线" : "离线"}`,
    `延迟：${formatLatency(props.snapshot?.latencyMs)}`,
    `最新告警数量：${props.latestAlerts?.length || 0}`,
    "请结合当前时间判断服务器稳定性风险，并给出优先级明确的处理建议。",
  ].join("\n");
});

const emit = defineEmits<{
  edit: [];
  "toggle-enabled": [];
  "open-soft": [];
  "open-docker": [];
  "open-install": [];
  "open-dashboard": [];
  "open-projects": [];
  "open-remote": [];
  "open-processes": [];
  "open-port-search": [];
  "open-files": [];
  "open-metrics-task": [];
  "open-alert-settings": [];
  "open-remote-settings": [];
  "open-basic-detail": [];
  "refresh-public-ip": [];
  "open-system-log": [];
  "open-firewall": [];
  "open-user-management": [];
  "open-package-manager": [];
  "open-os-config": [];
  "open-metric-detail": [metric: "cpu" | "memory" | "disk" | "io" | "diskIo"];
  "open-alert-detail": [alert: ServerAlertEvent];
  "create-service": [];
  "service-action": [service: ServerService, action: ServerServiceAction];
  "service-ai-fix": [service: ServerService];
  "view-service-logs": [service: ServerService];
  "edit-service": [service: ServerService];
  "detail-service": [service: ServerService];
  "detect-services": [];
  "analyze-stability": [];
}>();

const openMetricDetail = (key: string) => {
  if (
    key === "cpu" ||
    key === "memory" ||
    key === "disk" ||
    key === "io" ||
    key === "diskIo"
  ) {
    emit("open-metric-detail", key);
  }
};

const metricChartMode = ref<MetricChartMode>("split");
const basicInfoExpanded = ref(false);
const diskExpanded = ref(false);
const diskCollapsedLimit = 5;
const gpuList = computed(() => props.runtimeDetail?.gpus || []);
const cpuDetail = computed(() => props.runtimeDetail?.cpuDetail);
const disks = computed(() => props.runtimeDetail?.disks || []);
const ethernetInterfaces = computed(() => props.runtimeDetail?.ethernetInterfaces || []);
const memoryDetail = computed(() => props.runtimeDetail?.memoryDetail);
const metricChartCombined = computed({
  get: () => metricChartMode.value === "combined",
  set: (value: boolean) => {
    metricChartMode.value = value ? "combined" : "split";
  },
});

const loginRecords = ref<ServerLoginRecord[]>([]);
const loginRecordsUnavailable = ref(false);

const runtimeHostName = computed(
  () =>
    String(
      props.runtimeDetail?.hostName ||
        props.host?.serverName ||
        props.host?.host ||
        "",
    ).trim() || "-",
);

const runtimeActualOsName = computed(
  () =>
    String(props.runtimeDetail?.actualOsName || "").trim() ||
    osLabel(props.host?.osType),
);

const runtimePublicIp = computed(
  () =>
    String(
      props.host?.publicIp || props.runtimeDetail?.publicIp || "",
    ).trim() || "-",
);

const runtimeKernelVersion = computed(
  () =>
    String(
      props.runtimeDetail?.actualKernel ||
        props.runtimeDetail?.actualOsName ||
        "",
    ).trim() ||
    `${osLabel(props.host?.osType)} / ${archLabel(props.host?.architecture)}`,
);

const runtimeGccVersion = computed(
  () => String(props.runtimeDetail?.gccVersion || "").trim() || "-",
);

const dockerCapability = computed(() => {
  try {
    const metadata = JSON.parse(
      String(props.host?.metadataJson || "{}"),
    ) as Record<string, any>;
    const docker = metadata?.docker || {};
    return {
      enabled: Boolean(docker.enabled),
      connectionType:
        String(docker.connectionType || "LOCAL").toUpperCase() === "LOCAL"
          ? "AUTO"
          : String(docker.connectionType || "LOCAL"),
      apiPort: String(docker.apiPort || ""),
      username: String(docker.apiUsername || docker.username || ""),
      latency: String(docker.latencyMs || docker.latency || ""),
    };
  } catch {
    return {
      enabled: false,
      connectionType: "LOCAL",
      apiPort: "",
      username: "",
      latency: "",
    };
  }
});

const loadLoginRecords = async (force = false) => {
  if (!force && loginRecordsUnavailable.value) {
    return;
  }
  try {
    const serverId = Number(props.host?.serverId || 0) || undefined;
    const result = await listServerLoginRecords({
      serverId,
      topN: 10,
    });
    loginRecords.value = result.data || [];
    loginRecordsUnavailable.value = false;
  } catch (e) {
    loginRecords.value = [];
    loginRecordsUnavailable.value = true;
    console.warn("[ServerHostBasicPanel] 登录记录接口不可用，已降级为空列表");
  }
};

const formatLoginTime = (time?: string) => {
  if (!time) return "-";
  const date = new Date(time);
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

watch(
  () => props.host?.serverId,
  () => {
    loginRecords.value = [];
    loginRecordsUnavailable.value = false;
  },
);

const openAiSettings = () => {
  emitter.emit("openPanel");
};

const alertScrollRef = ref<HTMLElement | null>(null);
const alertListRef = ref<HTMLElement | null>(null);

const severityLabel = (value?: string | null) =>
  value === "DANGER" ? "危险" : value === "WARNING" ? "预警" : value || "告警";

const severityClass = (value?: string | null) =>
  value === "DANGER"
    ? "is-danger"
    : value === "WARNING"
      ? "is-warning"
      : "is-muted";

const alertStatusText = computed(() => {
  if (props.alertSettingsEnabled === false) {
    return "预警已关闭";
  }
  if (props.latestAlerts.length) {
    return "预警触发中";
  }
  return props.snapshot?.online ? "实时监测中" : "等待心跳";
});

const alertStatusClass = computed(() => {
  if (props.alertSettingsEnabled === false) {
    return "is-muted";
  }
  if (props.latestAlerts.some((item) => item.severity === "DANGER")) {
    return "is-danger";
  }
  if (props.latestAlerts.some((item) => item.severity === "WARNING")) {
    return "is-warning";
  }
  return "is-primary";
});

const orderedAlerts = computed(() =>
  [...(props.latestAlerts || [])].sort((left, right) => {
    const timeLeft = new Date(left.createTime || 0).getTime() || 0;
    const timeRight = new Date(right.createTime || 0).getTime() || 0;
    if (timeLeft !== timeRight) {
      return timeRight - timeLeft;
    }
    return (
      Number(right.serverAlertEventId || 0) -
      Number(left.serverAlertEventId || 0)
    );
  }),
);

const latestAlert = computed(() => orderedAlerts.value[0] || null);
const latestAlertTime = computed(() => latestAlert.value?.createTime || "");
const latestDangerCount = computed(
  () => orderedAlerts.value.filter((item) => item.severity === "DANGER").length,
);
const latestWarningCount = computed(
  () =>
    orderedAlerts.value.filter((item) => item.severity === "WARNING").length,
);

const diskPartitions = computed<ServerDiskPartitionView[]>(() =>
  [...(props.runtimeDetail?.diskPartitions || [])]
    .filter((item) => item && (item.name || item.mountPoint || item.totalBytes))
    .sort(
      (left, right) =>
        Number(right.usagePercent || 0) - Number(left.usagePercent || 0),
    ),
);

const partitionUsageClass = (value?: number | null) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return "usage-normal";
  }
  if (numeric >= 90) {
    return "usage-critical";
  }
  if (numeric >= 75) {
    return "usage-warning";
  }
  return "usage-normal";
};

const partitionPercent = (partition?: ServerDiskPartitionView | null) => {
  const explicit = Number(partition?.usagePercent ?? 0);
  if (Number.isFinite(explicit) && explicit > 0) {
    return Math.max(0, Math.min(100, explicit));
  }
  const used = Number(partition?.usedBytes ?? 0);
  const total = Number(partition?.totalBytes ?? 0);
  if (!Number.isFinite(used) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (used / total) * 100));
};

const partitionProgressColor = (value?: number | null) => {
  const numeric = Number(value ?? 0);
  if (Number.isFinite(numeric) && numeric >= 90) {
    return "#ef4444";
  }
  if (Number.isFinite(numeric) && numeric >= 75) {
    return "#f59e0b";
  }
  return "#10b981";
};

const memoryTotalBytes = computed(() => Number(props.snapshot?.memoryTotalBytes || 0));
const memoryUsedBytes = computed(() => Number(props.snapshot?.memoryUsedBytes || 0));
const memoryCacheBytes = computed(() => {
  const detail = (props.runtimeDetail || {}) as Record<string, unknown>;
  const candidates = [
    detail.memoryCacheBytes,
    detail.memoryCachedBytes,
    detail.cacheBytes,
    detail.cachedBytes,
  ];
  for (const item of candidates) {
    const numeric = Number(item || 0);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric;
    }
  }
  return 0;
});
const memoryFreeBytes = computed(() =>
  Math.max(memoryTotalBytes.value - memoryUsedBytes.value, 0),
);
const memoryCacheText = computed(() =>
  memoryCacheBytes.value > 0 ? formatByteSize(memoryCacheBytes.value) : "--",
);

const memoryUsageOption = computed(() => {
  const total = memoryTotalBytes.value;
  const used = Math.max(memoryUsedBytes.value, 0);
  const cache = Math.max(Math.min(memoryCacheBytes.value, used), 0);
  const pureUsed = Math.max(used - cache, 0);
  const free = Math.max(total - used, 0);
  const usedPercent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  return {
    title: {
      text: formatMetricPercent(usedPercent),
      subtext: "内存总使用率",
      left: "center",
      top: "36%",
      textStyle: {
        fontSize: 26,
        fontWeight: 700,
        color: "#1e293b",
      },
      subtextStyle: {
        fontSize: 12,
        color: "#64748b",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: (params: { name?: string; value?: number }) =>
        `${params.name}: ${formatByteSize(params.value)}`,
    },
    legend: {
      bottom: 2,
      left: "center",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: "#64748b",
        fontSize: 11,
      },
    },
    series: [
      {
        type: "pie",
        radius: ["58%", "78%"],
        center: ["50%", "48%"],
        label: { show: false },
        data: [
          { name: "已用", value: pureUsed, itemStyle: { color: "#ef4444" } },
          { name: "Cache", value: cache, itemStyle: { color: "#f59e0b" } },
          { name: "剩余", value: free, itemStyle: { color: "#10b981" } },
        ],
      },
    ],
  };
});

const diskUsageTotalOption = computed(() => {
  const total = diskTotalBytes.value;
  const used = diskUsedBytes.value;
  const free = diskFreeBytes.value;
  return {
    title: {
      text: formatMetricPercent(diskUsagePercent.value),
      subtext: "磁盘总使用率",
      left: "center",
      top: "36%",
      textStyle: {
        fontSize: 28,
        fontWeight: 700,
        color: "#1e293b",
      },
      subtextStyle: {
        fontSize: 12,
        color: "#64748b",
      },
    },
    tooltip: {
      trigger: "item",
      formatter: (params: { name?: string; value?: number }) =>
        `${params.name}: ${formatByteSize(params.value)}`,
    },
    legend: {
      bottom: 4,
      left: "center",
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: "#64748b",
        fontSize: 11,
      },
    },
    series: [
      {
        type: "pie",
        radius: ["58%", "78%"],
        center: ["50%", "48%"],
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: (params: { name?: string; value?: number }) =>
            `${params.name}\n${formatByteSize(params.value)}`,
          color: "#475569",
          fontSize: 11,
        },
        labelLine: {
          length: 10,
          length2: 8,
        },
        data: [
          {
            name: "已用",
            value: used,
            itemStyle: { color: "#f59e0b" },
          },
          {
            name: "可用",
            value: free,
            itemStyle: { color: "#10b981" },
          },
        ],
      },
    ],
  };
});

const diskMiniOption = computed(() => {
  const used = diskUsedBytes.value;
  const free = diskFreeBytes.value;
  const total = diskTotalBytes.value;
  const usedPercent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  return {
    tooltip: {
      trigger: "item",
      confine: true,
      formatter: (params: { name?: string; value?: number }) =>
        `${params.name}: ${formatByteSize(params.value)}`,
    },
    series: [
      {
        type: "pie",
        radius: ["46%", "66%"],
        center: ["50%", "48%"],
        avoidLabelOverlap: true,
        label: {
          show: true,
          formatter: `${Math.round(usedPercent)}%`,
          color: "#475569",
          fontSize: 13,
          fontWeight: 700,
        },
        emphasis: { scale: false },
        data: [
          { name: "已用", value: used || 1, itemStyle: { color: "#f59e0b" } },
          { name: "可用", value: free || 1, itemStyle: { color: "#10b981" } },
        ],
      },
    ],
  };
});

const diskTotalBytes = computed(() => {
  const totalFromSnapshot = Number(props.snapshot?.diskTotalBytes || 0);
  const totalFromPartitions = diskPartitions.value.reduce(
    (sum, item) => sum + Number(item.totalBytes || 0),
    0,
  );
  return totalFromSnapshot > 0 ? totalFromSnapshot : totalFromPartitions;
});

const diskUsedBytes = computed(() => {
  const usedFromSnapshot = Number(props.snapshot?.diskUsedBytes || 0);
  const usedFromPartitions = diskPartitions.value.reduce(
    (sum, item) => sum + Number(item.usedBytes || 0),
    0,
  );
  return usedFromSnapshot > 0 ? usedFromSnapshot : usedFromPartitions;
});

const diskFreeBytes = computed(() =>
  Math.max(diskTotalBytes.value - diskUsedBytes.value, 0),
);

const diskUsagePercent = computed(() =>
  diskTotalBytes.value > 0
    ? Math.min((diskUsedBytes.value / diskTotalBytes.value) * 100, 100)
    : 0,
);

const visibleDiskPartitions = computed(() =>
  diskExpanded.value
    ? diskPartitions.value
    : diskPartitions.value.slice(0, diskCollapsedLimit),
);

const alertTrendAlerts = computed(() =>
  orderedAlerts.value
    .slice(0, 100)
    .reverse(),
);

const alertTrendOption = computed(() => {
  const rows = alertTrendAlerts.value;
  const metricSeriesConfig: Array<{
    key: string;
    label: string;
    color: string;
  }> = [
    { key: "CPU", label: "CPU", color: "#3b82f6" },
    { key: "MEMORY", label: "内存", color: "#14b8a6" },
    { key: "DISK", label: "磁盘", color: "#6366f1" },
    { key: "IO", label: "网络", color: "#f59e0b" },
    { key: "DISK_IO", label: "磁盘IO", color: "#a855f7" },
    { key: "LATENCY", label: "延迟", color: "#ef4444" },
  ];
  const xAxisData = rows.map(
    (item) =>
      item.createTime ||
      String(item.serverAlertEventId || rows.indexOf(item) + 1),
  );
  const buildContinuousSeriesData = (metricKey: string) => {
    const firstValue = rows.find(
      (item) => String(item.metricType || "").toUpperCase() === metricKey,
    )?.severity;
    let lastValue: number | null =
      firstValue === "DANGER" ? 2 : firstValue === "WARNING" ? 1 : null;
    return rows.map((item) => {
      if (String(item.metricType || "").toUpperCase() === metricKey) {
        lastValue = item.severity === "DANGER" ? 2 : 1;
        return lastValue;
      }
      return lastValue;
    });
  };
  const series = metricSeriesConfig.map((config) => ({
    name: config.label,
    type: "line",
    smooth: true,
    connectNulls: true,
    symbol: "circle",
    symbolSize: 6,
    lineStyle: { width: 2, color: config.color },
    itemStyle: { color: config.color },
    data: buildContinuousSeriesData(config.key),
  }));
  return {
    grid: {
      left: 16,
      right: 16,
      top: 34,
      bottom: 34,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      confine: true,
      formatter: (params: Array<{ dataIndex: number }>) => {
        const index = Number(params?.[0]?.dataIndex || 0);
        const item = rows[index];
        if (!item) {
          return "暂无数据";
        }
        return [
          `${item.createTime || "刚刚"}`,
          `${metricLabel(item.metricType)} · ${severityLabel(item.severity)}`,
          item.alertMessage || "已触发实时预警",
          `当前值: ${formatAlertMetricValue(item, item.metricValue)}`,
        ].join("<br/>");
      },
    },
    legend: {
      top: 2,
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        color: "#64748b",
        fontSize: 11,
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        color: "#64748b",
        fontSize: 11,
        formatter: (value: string) => String(value || "").slice(5, 16),
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 2.5,
      interval: 1,
      axisLabel: {
        color: "#64748b",
        formatter: (value: number) =>
          value >= 2 ? "危险" : value >= 1 ? "预警" : "正常",
      },
      splitLine: {
        lineStyle: { color: "rgba(148, 163, 184, 0.2)" },
      },
    },
    series,
  };
});

const aiDiagnosticItems = computed(() =>
  [
    aiDiagnosticItem(
      "默认 Provider",
      props.aiDefaultProvider || props.aiProvider || "",
      Boolean(props.aiDefaultProvider || props.aiProvider),
    ),
    aiDiagnosticItem(
      "当前 Provider",
      props.aiProvider || props.aiDefaultProvider || "",
      Boolean(props.aiProvider),
    ),
    aiDiagnosticItem(
      "已发现 Provider",
      props.aiProviderNames?.length ? props.aiProviderNames.join(", ") : "",
      Boolean(props.aiProviderNames?.length),
    ),
    aiDiagnosticItem(
      "Provider 数量",
      props.aiProviderCount ? `${props.aiProviderCount}` : "",
      Number(props.aiProviderCount || 0) > 0,
    ),
    aiDiagnosticItem(
      "配置状态",
      props.aiConfigReady ? "已就绪" : "未就绪",
      props.aiConfigReady,
    ),
    aiDiagnosticItem(
      "ChatClient",
      props.aiChatClientReady ? "已装配" : "未装配",
      props.aiChatClientReady,
    ),
    aiDiagnosticItem(
      "原因代码",
      props.aiUnavailableCode || "",
      Boolean(props.aiUnavailableCode),
    ),
    aiDiagnosticItem(
      "Provider 解析",
      props.aiProviderResolvedFrom || "",
      Boolean(props.aiProviderResolvedFrom),
    ),
  ].filter((item) => item.value),
);

const resetAlertScrollPosition = async (behavior: ScrollBehavior = "auto") => {
  await nextTick();
  alertScrollRef.value?.scrollTo({
    top: 0,
    behavior,
  });
  alertListRef.value?.scrollTo({
    top: 0,
    behavior,
  });
};

watch(
  () => latestAlert.value?.serverAlertEventId,
  async (value, previous) => {
    if (!value || value === previous) {
      return;
    }
    await resetAlertScrollPosition(previous ? "smooth" : "auto");
  },
);

watch(
  () => props.host?.serverId,
  async (value, previous) => {
    if (!value || value === previous) {
      return;
    }
    await resetAlertScrollPosition("auto");
  },
);

watch(
  () => orderedAlerts.value.length,
  async (value, previous) => {
    if (!value || value === previous) {
      return;
    }
    await resetAlertScrollPosition(previous ? "smooth" : "auto");
  },
);

const metricLabel = (value?: string | null) =>
  value === "CPU"
    ? "CPU"
    : value === "MEMORY"
      ? "内存"
      : value === "DISK"
        ? "磁盘"
        : value === "DISK_IO"
          ? "磁盘IO"
          : value === "IO"
            ? "网络"
            : value === "LATENCY"
              ? "延迟"
              : value || "指标";

const formatAlertMetricValue = (
  item?: ServerAlertEvent | null,
  value?: number | null,
) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "--";
  }
  if (item?.metricType === "IO") {
    return formatThroughput(numeric);
  }
  if (item?.metricType === "LATENCY") {
    return formatLatency(numeric);
  }
  return formatMetricPercent(numeric);
};

const usageToneClass = (value?: number | null, warning = 75, danger = 90) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "is-idle";
  }
  if (numeric >= danger) {
    return "is-danger";
  }
  if (numeric >= warning) {
    return "is-warning";
  }
  return "is-success";
};

const metricCards = computed(() => {
  const snapshot = props.snapshot;
  const settings = props.alertSettings || {};
  const cpuDanger = Number(settings.cpuDangerPercent || 90);
  const memoryDanger = Number(settings.memoryDangerPercent || 90);
  const diskDanger = Number(settings.diskDangerPercent || 92);
  const ioDanger = Number(settings.ioDangerBytesPerSecond || 120 * 1024 * 1024);
  const diskIoWarning = 80 * 1024 * 1024;
  const diskIoDanger = 160 * 1024 * 1024;
  const ioRead = Math.max(0, Number(snapshot?.ioReadBytesPerSecond || 0));
  const ioWrite = Math.max(0, Number(snapshot?.ioWriteBytesPerSecond || 0));
  const diskRead = Math.max(0, Number(snapshot?.diskReadBytesPerSecond || 0));
  const diskWrite = Math.max(0, Number(snapshot?.diskWriteBytesPerSecond || 0));
  const ioTotal = ioRead + ioWrite;
  const diskIoTotal = diskRead + diskWrite;
  const hasDiskIo =
    diskIoTotal > 0 ||
    (props.history || []).some((item) => resolveDiskIoTotal(item) > 0);
  return [
    {
      key: "cpu",
      label: "CPU",
      subLabel: `${snapshot?.cpuCores || "--"} 核`,
      value: formatMetricPercent(snapshot?.cpuUsage),
      total: snapshot?.cpuCores ? `逻辑核心 ${snapshot.cpuCores}` : "总量未知",
      progress: clampProgress(snapshot?.cpuUsage),
      toneClass: usageToneClass(
        snapshot?.cpuUsage,
        Number(settings.cpuWarningPercent || 75),
        cpuDanger,
      ),
    },
    {
      key: "memory",
      label: "内存",
      subLabel: formatByteSize(snapshot?.memoryUsedBytes),
      value: formatMetricPercent(snapshot?.memoryUsage),
      total: `总量 ${formatByteSize(snapshot?.memoryTotalBytes)}`,
      progress: clampProgress(snapshot?.memoryUsage),
      toneClass: usageToneClass(
        snapshot?.memoryUsage,
        Number(settings.memoryWarningPercent || 75),
        memoryDanger,
      ),
    },
    {
      key: "disk",
      label: "磁盘",
      subLabel: formatByteSize(snapshot?.diskUsedBytes),
      value: formatMetricPercent(snapshot?.diskUsage),
      total: `总量 ${formatByteSize(snapshot?.diskTotalBytes)}`,
      progress: clampProgress(snapshot?.diskUsage),
      toneClass: usageToneClass(
        snapshot?.diskUsage,
        Number(settings.diskWarningPercent || 80),
        diskDanger,
      ),
    },
    {
      key: "io",
      label: "网络 IO",
      subLabel: `入 ${formatThroughput(ioRead)}`,
      value: formatThroughput(ioTotal),
      total: `出 ${formatThroughput(ioWrite)}`,
      progress: clampProgress(resolveIoProgress(ioTotal, ioDanger)),
      toneClass: usageToneClass(
        ioTotal,
        Number(settings.ioWarningBytesPerSecond || 50 * 1024 * 1024),
        ioDanger,
      ),
    },
    {
      key: "diskIo",
      label: "磁盘 IO",
      subLabel: hasDiskIo
        ? `读 ${formatThroughput(diskRead)}`
        : "读 等待采集",
      value: hasDiskIo ? formatThroughput(diskIoTotal) : "未采集",
      total: hasDiskIo
        ? `写 ${formatThroughput(diskWrite)}`
        : "写 等待采集",
      progress: clampProgress(resolveIoProgress(diskIoTotal, diskIoDanger)),
      toneClass: usageToneClass(diskIoTotal, diskIoWarning, diskIoDanger),
    },
  ];
});

const resolveLiquidColor = (progress?: number | null) => {
  const value = Number(progress ?? 0);
  if (!Number.isFinite(value)) {
    return "#94a3b8";
  }
  if (value >= 90) {
    return "#ef4444";
  }
  if (value >= 75) {
    return "#f59e0b";
  }
  return "#22c55e";
};

const isSmoothPercentMetric = (key: string) => ["cpu", "memory", "disk"].includes(key);

const smoothPercentMap = reactive<Record<string, number>>({
  cpu: 0,
  memory: 0,
  disk: 0,
});

const animateSmoothNumber = (
  from: number,
  to: number,
  onUpdate: (value: number) => void,
  durationMs = 620,
) => {
  const start = performance.now();
  const delta = to - from;
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const frame = (now: number) => {
    const elapsed = Math.max(0, now - start);
    const t = Math.min(elapsed / Math.max(durationMs, 1), 1);
    onUpdate(from + delta * easeOutCubic(t));
    if (t < 1) {
      requestAnimationFrame(frame);
    }
  };
  requestAnimationFrame(frame);
};

watch(
  metricCards,
  (next) => {
    next.forEach((item) => {
      if (!isSmoothPercentMetric(item.key)) {
        return;
      }
      const target = Number(item.progress ?? 0);
      if (!Number.isFinite(target)) {
        return;
      }
      const previous = Number(smoothPercentMap[item.key] ?? 0);
      if (Math.abs(previous - target) < 0.1) {
        smoothPercentMap[item.key] = target;
        return;
      }
      animateSmoothNumber(previous, target, (value) => {
        smoothPercentMap[item.key] = value;
      });
    });
  },
  { immediate: true },
);

const smoothPercentText = (key: string) => {
  const value = Number(smoothPercentMap[key] ?? 0);
  if (!Number.isFinite(value)) {
    return "0%";
  }
  const clamped = Math.max(0, Math.min(100, value));
  return `${Math.round(clamped)}%`;
};

const compactIoText = (value?: string) =>
  String(value || "")
    .replace(/^读\s*/u, "")
    .replace(/^写\s*/u, "")
    .trim();

const combinedMiniValue = (item: {
  key: string;
  value: string;
}) => (isSmoothPercentMetric(item.key) ? smoothPercentText(item.key) : item.value);

const isCombinedIoMetric = (key: string) => key === "io" || key === "diskIo";

const combinedMiniSubLabel = (item: {
  key: string;
  subLabel: string;
}) =>
  isCombinedIoMetric(item.key)
    ? compactIoText(item.subLabel)
    : item.subLabel;

const combinedMiniTotal = (item: {
  key: string;
  total: string;
}) =>
  isCombinedIoMetric(item.key)
    ? compactIoText(item.total)
    : item.total;

const metricCombinedCards = computed(() =>
  metricCards.value
    .filter((item) => item.key !== "disk")
    .slice(0, 4),
);

const realtimeHistoryRows = computed(() =>
  [...(props.history || [])]
    .sort(
      (left, right) =>
        Number(left.collectTimestamp || 0) - Number(right.collectTimestamp || 0),
    )
    .slice(-500),
);

const realtimeCombinedOption = computed(() => {
  const rows = realtimeHistoryRows.value;
  const settings = props.alertSettings || {};
  const ioDanger = Number(settings.ioDangerBytesPerSecond || 120 * 1024 * 1024);
  const diskIoDanger = 160 * 1024 * 1024;
  const xAxisData = rows.map((item, index) => {
    const timestamp = Number(item.collectTimestamp || 0);
    if (timestamp > 0) {
      const date = new Date(timestamp);
      const hh = String(date.getHours()).padStart(2, "0");
      const mm = String(date.getMinutes()).padStart(2, "0");
      const ss = String(date.getSeconds()).padStart(2, "0");
      return `${hh}:${mm}:${ss}`;
    }
    return String(index + 1);
  });
  return {
    grid: {
      left: 16,
      right: 16,
      top: 28,
      bottom: 24,
      containLabel: true,
    },
    tooltip: {
      trigger: "axis",
      confine: true,
    },
    legend: {
      top: 2,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: {
        color: "#64748b",
        fontSize: 11,
      },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        color: "#64748b",
        fontSize: 11,
        interval: "auto",
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: {
        color: "#64748b",
        formatter: "{value}%",
      },
      splitLine: {
        lineStyle: {
          color: "rgba(148, 163, 184, 0.18)",
        },
      },
    },
    series: [
      {
        name: "CPU",
        type: "line",
        smooth: true,
        symbol: "none",
        data: rows.map((item) => clampProgress(item.cpuUsage)),
      },
      {
        name: "内存",
        type: "line",
        smooth: true,
        symbol: "none",
        data: rows.map((item) => clampProgress(item.memoryUsage)),
      },
      {
        name: "网络IO",
        type: "line",
        smooth: true,
        symbol: "none",
        data: rows.map((item) =>
          clampProgress(resolveIoProgress(resolveIoTotal(item), ioDanger)),
        ),
      },
      {
        name: "磁盘IO",
        type: "line",
        smooth: true,
        symbol: "none",
        data: rows.map((item) =>
          clampProgress(resolveIoProgress(resolveDiskIoTotal(item), diskIoDanger)),
        ),
      },
    ],
  };
});




function clampProgress(value?: number | null) {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, numeric));
}

function resolveIoProgress(
  value?: number | null,
  dangerThreshold?: number | null,
) {
  const numeric = Number(value ?? 0);
  const threshold = Number(dangerThreshold ?? 0);
  if (
    !Number.isFinite(numeric) ||
    numeric <= 0 ||
    !Number.isFinite(threshold) ||
    threshold <= 0
  ) {
    return 0;
  }
  return (numeric / threshold) * 100;
}

function aiDiagnosticItem(label: string, value: string, enabled: boolean) {
  return {
    label,
    value,
    toneClass: enabled ? "is-success" : "is-muted",
  };
}
</script>

<style scoped lang="scss">
.server-basic-panel {
  height: 100%;
  border-radius: 28px;
}

.server-basic-panel :deep(.el-card__body) {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  min-height: 0;
  overflow: auto;
  background:
    radial-gradient(
      circle at 0% 0%,
      rgba(14, 165, 233, 0.06),
      transparent 40%
    ),
    radial-gradient(
      circle at 100% 100%,
      rgba(245, 158, 11, 0.04),
      transparent 35%
    ),
    linear-gradient(
      180deg,
      rgba(248, 250, 252, 0.98),
      rgba(241, 245, 249, 0.96)
    );
}

.server-basic-panel__hero,
.server-basic-panel__identity,
.server-basic-panel__action-groups,
.server-basic-panel__action-row,
.server-basic-panel__actions,
.server-basic-panel__title-row,
.server-basic-panel__card-header,
.server-basic-panel__identity-meta,
.server-basic-panel__realtime-header {
  display: flex;
  align-items: center;
}

.server-basic-panel__hero,
.server-basic-panel__realtime-header,
.server-basic-panel__card-header {
  justify-content: space-between;
}

.server-basic-panel__hero {
  position: relative;
  gap: 18px;
  min-height: 200px;
  padding: 22px 24px;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  background:
    radial-gradient(
      ellipse 70% 50% at 90% 5%,
      rgba(14, 165, 233, 0.15),
      transparent 55%
    ),
    radial-gradient(
      ellipse 50% 60% at 10% 85%,
      rgba(245, 158, 11, 0.08),
      transparent 50%
    ),
    radial-gradient(
      circle at 80% 15%,
      rgba(255, 255, 255, 0.6),
      transparent 25%
    ),
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.7) 0%,
      rgba(248, 250, 252, 0.5) 45%,
      rgba(239, 246, 255, 0.4) 100%
    );
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.08),
    0 8px 20px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  overflow: hidden;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: box-shadow 0.3s ease;
}

.server-basic-panel__hero:hover {
  box-shadow:
    0 28px 72px rgba(15, 23, 42, 0.12),
    0 10px 24px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.server-basic-panel__hero::before {
  content: "";
  position: absolute;
  top: -60%;
  left: -60%;
  width: 220%;
  height: 220%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(14, 165, 233, 0.04) 90deg,
    transparent 180deg,
    rgba(245, 158, 11, 0.03) 270deg,
    transparent 360deg
  );
  animation: heroShine 25s linear infinite;
  pointer-events: none;
  z-index: 0;
}

@keyframes heroShine {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.server-basic-panel__hero::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0%, transparent 45%),
    linear-gradient(225deg, rgba(255, 255, 255, 0.15) 0%, transparent 35%),
    linear-gradient(0deg, rgba(255, 255, 255, 0.1) 0%, transparent 25%);
  border-radius: inherit;
}

.server-basic-panel__identity {
  gap: 14px;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.server-basic-panel__badge {
  width: 60px;
  height: 60px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: white;
  background: linear-gradient(145deg, #64748b, #1e293b);
  box-shadow:
    0 20px 44px rgba(15, 23, 42, 0.25),
    0 8px 16px rgba(15, 23, 42, 0.15);
  position: relative;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.server-basic-panel__badge:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow:
    0 24px 52px rgba(15, 23, 42, 0.3),
    0 10px 20px rgba(15, 23, 42, 0.18);
}

.server-basic-panel__badge::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 20px 20px 0 0;
}

.server-basic-panel__badge::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.server-basic-panel__badge.is-windows {
  background: linear-gradient(145deg, #60a5fa, #2563eb);
  box-shadow:
    0 20px 44px rgba(37, 99, 235, 0.3),
    0 8px 16px rgba(37, 99, 235, 0.2);
}

.server-basic-panel__badge.is-linux {
  background: linear-gradient(145deg, #fbbf24, #d97706);
  box-shadow:
    0 20px 44px rgba(217, 119, 6, 0.3),
    0 8px 16px rgba(217, 119, 6, 0.2);
}

.server-basic-panel__badge.is-macos {
  background: linear-gradient(145deg, #94a3b8, #334155);
  box-shadow:
    0 20px 44px rgba(51, 65, 85, 0.3),
    0 8px 16px rgba(51, 65, 85, 0.2);
}

.server-basic-panel__title-row {
  gap: 12px;
}

.server-basic-panel__title-row h2 {
  margin: 0;
  font-size: 26px;
  line-height: 1.05;
  letter-spacing: -0.025em;
  font-weight: 700;
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.server-basic-panel__latency {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
}

.server-basic-panel__latency.is-success {
  color: var(--el-color-success);
}

.server-basic-panel__latency.is-warning {
  color: var(--el-color-warning);
}

.server-basic-panel__latency.is-danger {
  color: var(--el-color-danger);
}

.server-basic-panel__identity-meta {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.server-basic-panel__action-groups {
  position: relative;
  z-index: 1;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

.server-basic-panel__action-row {
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
  padding: 12px 16px;
  border-radius: 22px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.55),
    rgba(248, 250, 252, 0.45)
  );
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 4px 16px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: box-shadow 0.25s ease, background 0.25s ease;
}

.server-basic-panel__action-row:hover {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.65),
    rgba(248, 250, 252, 0.55)
  );
  box-shadow:
    0 8px 28px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.server-basic-panel__action-row--software {
  padding-top: 10px;
}

.server-basic-panel__action-label {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.8),
    rgba(241, 245, 249, 0.55)
  );
  color: #1e293b;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.server-basic-panel__chip {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-fill-color-light) 90%, white);
  font-size: 12px;
}

.server-basic-panel__actions {
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-basic-panel__actions :deep(.el-dropdown) {
  display: inline-flex;
}

.server-basic-panel__actions :deep(.el-button) {
  width: 38px;
  height: 38px;
  border-color: rgba(255, 255, 255, 0.8);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85),
    rgba(248, 250, 252, 0.7)
  );
  box-shadow:
    0 8px 20px rgba(15, 23, 42, 0.05),
    0 2px 6px rgba(15, 23, 42, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  transition:
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background 0.25s ease;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.server-basic-panel__actions :deep(.el-button:hover) {
  transform: translateY(-3px) scale(1.1);
  border-color: color-mix(
    in srgb,
    var(--el-color-primary) 25%,
    rgba(255, 255, 255, 0.9)
  );
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95),
    rgba(239, 246, 255, 0.85)
  );
  box-shadow:
    0 20px 44px rgba(15, 23, 42, 0.1),
    0 8px 18px rgba(15, 23, 42, 0.06),
    0 0 0 1px color-mix(in srgb, var(--el-color-primary) 12%, transparent),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.server-basic-panel__action-row:hover .server-basic-panel__actions :deep(.el-button) {
  box-shadow:
    0 20px 44px rgba(15, 23, 42, 0.1),
    0 8px 18px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.server-basic-panel__realtime,
.server-basic-panel__card {
  border: 1px solid rgba(255, 255, 255, 0.65);
  background:
    radial-gradient(
      ellipse 70% 45% at 95% 3%,
      rgba(14, 165, 233, 0.07),
      transparent 50%
    ),
    radial-gradient(
      ellipse 50% 35% at 5% 95%,
      rgba(245, 158, 11, 0.05),
      transparent 45%
    ),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.65),
      rgba(248, 250, 252, 0.5)
    );
  box-shadow:
    0 20px 48px rgba(15, 23, 42, 0.05),
    0 6px 14px rgba(15, 23, 42, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transition: box-shadow 0.25s ease;
}

.server-basic-panel__realtime:hover,
.server-basic-panel__card:hover {
  box-shadow:
    0 24px 56px rgba(15, 23, 42, 0.08),
    0 8px 18px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.server-basic-panel__realtime {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 28px;
}

.server-basic-panel__realtime-header {
  gap: 12px;
}

.server-basic-panel__card-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.server-basic-panel__realtime-header h3,
.server-basic-panel__card-header h3 {
  margin: 0;
  font-size: 17px;
  letter-spacing: -0.01em;
}

.server-basic-panel__realtime-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.server-basic-panel :deep(.el-radio-group) {
  min-height: 38px;
}

.server-basic-panel :deep(.el-radio-button__inner) {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.server-basic-panel__metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.server-basic-panel__metric-card {
  position: relative;
  display: grid;
  gap: 8px;
  min-height: 92px;
  padding: 16px;
  border-radius: 24px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.75),
    rgba(248, 250, 252, 0.55)
  );
  border: 1px solid rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;
  isolation: isolate;
  overflow: hidden;
  box-shadow:
    0 4px 16px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.server-basic-panel__metric-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.25),
    transparent 50%
  );
  pointer-events: none;
}

.server-basic-panel__metric-card > *,
.server-basic-panel__realtime-mini > * {
  position: relative;
  z-index: 1;
}

.server-basic-panel__metric-click-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: pointer;
  border-radius: inherit;
}

.server-basic-panel__metric-card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85),
    rgba(248, 250, 252, 0.65)
  );
  box-shadow:
    0 24px 52px rgba(15, 23, 42, 0.1),
    0 12px 24px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
  animation: metric-card-pulse 2.5s ease-in-out infinite;
}

/* 卡片微光动画 */
@keyframes metric-card-pulse {
  0%,
  100% {
    box-shadow:
      0 24px 52px rgba(15, 23, 42, 0.1),
      0 12px 24px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.95);
  }
  50% {
    box-shadow:
      0 28px 60px rgba(15, 23, 42, 0.13),
      0 14px 28px rgba(15, 23, 42, 0.08),
      0 0 0 1px color-mix(in srgb, currentColor 8%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.95);
  }
}

.server-basic-panel__metric-card.is-success {
  color: #16a34a;
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.12);
}

.server-basic-panel__metric-card.is-warning {
  color: #d97706;
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
}

.server-basic-panel__metric-card.is-danger {
  color: #dc2626;
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.18);
}

.server-basic-panel__metric-card.is-idle {
  color: #64748b;
}

.server-basic-panel__metric-top,
.server-basic-panel__metric-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.server-basic-panel__metric-top small,
.server-basic-panel__info-grid dt {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__metric-top span,
.server-basic-panel__metric-main span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__metric-liquid-bg {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  opacity: 1;
  border-radius: 24px;
  background: rgba(148, 163, 184, 0.10);
  box-shadow:
    inset 0 0 0 1px rgba(148, 163, 184, 0.16),
    inset 0 18px 42px rgba(15, 23, 42, 0.04);
  z-index: 0;
}

.server-basic-panel__metric-liquid-bg--mini {
  border-radius: 22px;
  background: rgba(148, 163, 184, 0.08);
}

.server-basic-panel__metric-liquid-bg--mini .server-basic-panel__metric-liquid-bg__wave {
  top: -36px;
  height: 72px;
}

.server-basic-panel__metric-liquid-bg--mini
  .server-basic-panel__metric-liquid-bg__wave.is-back {
  top: -44px;
}

.server-basic-panel__metric-liquid-bg__water {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100%;
  transform: translateY(calc((100 - var(--metric-progress-visual, var(--metric-progress, 0))) * 1%));
  transition: transform 0.55s cubic-bezier(0.2, 1, 0.2, 1);
  will-change: transform;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.10)),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--metric-liquid-color, currentColor) 30%, rgba(255, 255, 255, 0.10)),
      color-mix(in srgb, var(--metric-liquid-color, currentColor) 88%, #0b1220)
    );
}

.server-basic-panel__metric-liquid-bg__wave {
  position: absolute;
  left: -30%;
  top: -42px;
  width: 170%;
  height: 86px;
  border-radius: 44%;
  background:
    radial-gradient(
      circle at 55% 70%,
      rgba(255, 255, 255, 0.72) 0%,
      rgba(255, 255, 255, 0.38) 42%,
      rgba(255, 255, 255, 0) 74%
    );
  opacity: 0.85;
  filter: blur(0.8px);
  animation: metric-liquid-wave-x 2.6s ease-in-out infinite;
}

.server-basic-panel__metric-liquid-bg__wave.is-back {
  top: -52px;
  opacity: 0.55;
  filter: blur(1.4px);
  animation-duration: 3.6s;
  animation-direction: reverse;
}

.server-basic-panel__metric-liquid-bg__gloss {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background:
    radial-gradient(circle at 30% 18%, rgba(255, 255, 255, 0.46), transparent 55%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.02));
  z-index: 1;
}

@keyframes metric-liquid-wave-x {
  0% {
    transform: translateX(-8%);
  }
  50% {
    transform: translateX(8%);
  }
  100% {
    transform: translateX(-8%);
  }
}

.server-basic-panel__metric-main strong {
  font-size: 22px;
  line-height: 1;
  letter-spacing: -0.03em;
  font-weight: 700;
  background: linear-gradient(135deg, #1e293b 0%, #334155 40%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.8));
}

/* 指标标签增强 */
.server-basic-panel__metric-top small {
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #64748b, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* 指标数值增强 */
.server-basic-panel__metric-main strong {
  font-size: 24px;
  line-height: 1;
  letter-spacing: -0.03em;
  font-weight: 700;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 1px 1px rgba(255, 255, 255, 0.5));
}

.server-basic-panel__metric-main strong.is-io-number {
  font-size: 18px;
  letter-spacing: -0.02em;
}


.server-basic-panel__realtime-chart {
  min-width: 0;
  display: grid;
  gap: 10px;
  padding: 16px 16px 12px;
  border-radius: 26px;
  background:
    radial-gradient(
      circle at 90% 10%,
      rgba(245, 158, 11, 0.1),
      transparent 30%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.95));
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow:
    0 12px 32px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.server-basic-panel__realtime-combined {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 14px;
  min-width: 0;
}

.server-basic-panel__realtime-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.server-basic-panel__realtime-mini {
  position: relative;
  width: 100%;
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  appearance: none;
  border-radius: 22px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.75),
    rgba(248, 250, 252, 0.5)
  );
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;
  isolation: isolate;
  overflow: hidden;
  box-shadow:
    0 4px 16px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.server-basic-panel__realtime-mini:hover {
  transform: translateY(-3px) scale(1.02);
  border-color: rgba(255, 255, 255, 0.9);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.85),
    rgba(248, 250, 252, 0.6)
  );
  box-shadow:
    0 20px 44px rgba(15, 23, 42, 0.08),
    0 8px 16px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.server-basic-panel__realtime-mini.is-success {
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.12);
}

.server-basic-panel__realtime-mini.is-warning {
  box-shadow: inset 0 0 0 1px rgba(245, 158, 11, 0.18);
}

.server-basic-panel__realtime-mini.is-danger {
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.18);
}

.server-basic-panel__realtime-mini-head,
.server-basic-panel__realtime-mini-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}

.server-basic-panel__realtime-mini-head small,
.server-basic-panel__realtime-mini-head span,
.server-basic-panel__realtime-mini-main span {
  color: var(--el-text-color-secondary);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-basic-panel__realtime-mini-main strong {
  font-size: 18px;
  line-height: 1;
  letter-spacing: -0.02em;
  font-weight: 700;
  background: linear-gradient(180deg, #1e293b, #334155);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.server-basic-panel__realtime-mini-main strong.is-io-number {
  font-size: 15px;
}

.server-basic-panel__realtime-mini.is-io-mini .server-basic-panel__realtime-mini-head {
  justify-content: flex-start;
}

.server-basic-panel__realtime-mini.is-io-mini .server-basic-panel__realtime-mini-main {
  justify-content: flex-start;
}

.server-basic-panel__login-dropdown--overlay {
  display: grid;
  gap: 12px;
  padding: 8px 0 120px;
}

.server-basic-panel__realtime-chart-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.server-basic-panel__realtime-chart-head strong {
  display: block;
  font-size: 14px;
  line-height: 1.2;
}

.server-basic-panel__realtime-chart-head span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  min-height: fit-content;
  flex: 1 1 auto;
}

.server-basic-panel__card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px;
  border-radius: 28px;
}

.server-basic-panel__card--basic {
  overflow: visible;
}

.server-basic-panel__card--basic .server-basic-panel__content-scroll {
  flex: 0 0 auto;
  overflow: visible;
  padding-right: 0;
}

.server-basic-panel__card--basic .server-basic-panel__content-scroll.is-collapsed {
  max-height: 420px;
  overflow: hidden;
  position: relative;
}

.server-basic-panel__card--basic .server-basic-panel__content-scroll.is-collapsed::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 56px;
  background: linear-gradient(to bottom, rgba(248, 250, 252, 0), rgba(248, 250, 252, 0.98));
  pointer-events: none;
}

.server-basic-panel__collapse-actions {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.server-basic-panel__card--service {
  min-width: 0;
  min-height: 474px;
}

.server-basic-panel__card--disk {
  min-width: 0;
  min-height: 760px;
}

.server-basic-panel__card--alert,
.server-basic-panel__card--alert-detail {
  min-width: 0;
  min-height: 474px;
}

.server-basic-panel__card--memory {
  min-width: 0;
}

// ── 硬件信息卡片通用样式 ──────────────────────────────
.server-basic-panel__hardware-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 10px;
  margin-top: 8px;
}

.server-basic-panel__hardware-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.6),
    rgba(248, 250, 252, 0.4)
  );
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow:
    0 2px 8px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.server-basic-panel__hardware-item small {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.server-basic-panel__hardware-item strong {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  word-break: break-all;
}

.server-basic-panel__card-chart {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}

.server-basic-panel__card-chart .server-basic-panel__card-chart {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.server-basic-panel__card--gpu,
.server-basic-panel__card--cpu,
.server-basic-panel__card--network {
  min-width: 0;
}

.server-basic-panel__card--cpu .server-basic-panel__card-header--stack .server-basic-panel__tag-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.server-basic-panel__disk-partitions {
  margin-top: 8px;
  display: grid;
  gap: 12px;
}

.server-basic-panel__disk-overview {
  padding: 8px 6px 0;
  border-radius: 14px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92),
    rgba(248, 250, 252, 0.86)
  );
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.server-basic-panel__disk-overview-text {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
  padding: 4px 10px 10px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__memory-overview {
  display: grid;
  gap: 12px;
}

.server-basic-panel__memory-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.server-basic-panel__memory-item {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.72);
  display: grid;
  gap: 4px;
}

.server-basic-panel__memory-item small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__memory-item strong {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.server-basic-panel__partitions-list-container {
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.server-basic-panel__partitions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.server-basic-panel__partition-item {
  padding: 12px;
  background-color: var(--el-fill-color-extra-light);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.3s ease;
}

.server-basic-panel__partition-item:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.server-basic-panel__partition-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  gap: 10px;
}

.server-basic-panel__partition-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.server-basic-panel__partition-icon {
  color: var(--el-color-primary);
  font-size: 14px;
}

.server-basic-panel__partition-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.server-basic-panel__partition-type {
  font-size: 11px;
  flex-shrink: 0;
}

.server-basic-panel__partition-usage {
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.server-basic-panel__partition-usage.usage-normal {
  color: var(--el-color-success);
  background-color: var(--el-color-success-light-9);
}

.server-basic-panel__partition-usage.usage-warning {
  color: var(--el-color-warning);
  background-color: var(--el-color-warning-light-9);
}

.server-basic-panel__partition-usage.usage-critical {
  color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
}

.server-basic-panel__partition-details {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--el-text-color-regular);
}

.server-basic-panel__partition-progress {
  display: grid;
  gap: 6px;
  margin-bottom: 8px;
}

.server-basic-panel__partition-progress :deep(.el-progress-bar__outer) {
  height: 12px !important;
}

.server-basic-panel__partition-progress-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.server-basic-panel__partition-details span {
  flex: 1;
  text-align: center;
}

.server-basic-panel__partition-details span:not(:last-child) {
  border-right: 1px solid var(--el-border-color-lighter);
}

.server-basic-panel__content-scroll {
  flex: 1;
  min-height: 0;
  overflow: visible;
  padding-right: 2px;
  display: grid;
  gap: 16px;
}

.server-basic-panel__alert-scroll {
  overscroll-behavior: contain;
}

.server-basic-panel__info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
  margin: 0;
}

.server-basic-panel__info-grid > div {
  padding: 14px 16px;
  border-radius: 20px;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.96),
    rgba(248, 250, 252, 0.88)
  );
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.76),
    0 10px 18px rgba(15, 23, 42, 0.03);
}

.server-basic-panel__info-grid dd {
  margin: 6px 0 0;
  word-break: break-word;
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 1.6;
}

.server-basic-panel__info-span-2 {
  grid-column: span 2;
}

.server-basic-panel__card-header--stack {
  align-items: flex-start;
  gap: 14px;
}

.server-basic-panel__card-desc {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}

.server-basic-panel__tag-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-basic-panel__lay-tag {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
}

.server-basic-panel__lay-tag.is-primary {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
  border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.server-basic-panel__lay-tag.is-warning {
  color: #b45309;
  background: rgba(251, 191, 36, 0.16);
  border-color: rgba(245, 158, 11, 0.26);
}

.server-basic-panel__lay-tag.is-danger {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.14);
  border-color: rgba(239, 68, 68, 0.24);
}

.server-basic-panel__lay-tag.is-muted {
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color-light) 92%, white);
}

.server-basic-panel__alert-summary {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
}

.server-basic-panel__ops-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-basic-panel__ops-card {
  appearance: none;
  width: 100%;
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 88%, white);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.server-basic-panel__ops-card:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.08);
}

.server-basic-panel__ops-card:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.server-basic-panel__ops-card small,
.server-basic-panel__ops-card span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__ops-card strong {
  font-size: 18px;
  line-height: 1.1;
  color: var(--el-text-color-primary);
}

.server-basic-panel__summary-card {
  appearance: none;
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-bg-color-page) 86%, white);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.18s ease;
}

.server-basic-panel__summary-card:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(15, 23, 42, 0.08);
}

.server-basic-panel__summary-card:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.server-basic-panel__summary-card small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__summary-card strong {
  font-size: 18px;
  line-height: 1.1;
}

.server-basic-panel__summary-card span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__alert-list {
  display: grid;
  gap: 12px;
  max-height: 340px;
  overflow: auto;
  padding-right: 4px;
  padding-top: 8px;
  align-content: start;
}

.server-basic-panel__alert-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent),
      transparent 58%
    ),
    color-mix(in srgb, var(--el-bg-color-page) 88%, white);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.server-basic-panel__alert-hero:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.06);
}

.server-basic-panel__alert-hero.is-warning {
  border-color: color-mix(in srgb, var(--el-color-warning) 32%, transparent);
}

.server-basic-panel__alert-hero.is-danger {
  border-color: color-mix(in srgb, var(--el-color-danger) 32%, transparent);
}

.server-basic-panel__alert-hero-main,
.server-basic-panel__alert-hero-side {
  display: grid;
  gap: 6px;
}

.server-basic-panel__alert-hero-main small,
.server-basic-panel__alert-hero-side small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__alert-hero-main strong {
  font-size: 16px;
  line-height: 1.25;
}

.server-basic-panel__alert-hero-main p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.server-basic-panel__alert-hero-side {
  justify-items: end;
  text-align: right;
}

.server-basic-panel__alert-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 4px;
  margin-bottom: 4px;
}

.server-basic-panel__alert-list-header strong {
  display: block;
  line-height: 1.1;
}

.server-basic-panel__alert-list-header span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__alert-header-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.server-basic-panel__alert-list header,
.server-basic-panel__alert-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.server-basic-panel__alert-list header {
  margin-top: 2px;
  padding-bottom: 2px;
}

.server-basic-panel__alert-list header span,
.server-basic-panel__alert-item small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-basic-panel__alert-item {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 84%, white);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.server-basic-panel__alert-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.06);
}

.server-basic-panel__alert-item.is-warning {
  border-color: color-mix(in srgb, var(--el-color-warning) 30%, transparent);
}

.server-basic-panel__alert-item.is-danger {
  border-color: color-mix(in srgb, var(--el-color-danger) 30%, transparent);
}

.server-basic-panel__alert-item p {
  margin: 0;
  color: var(--el-text-color-regular);
  line-height: 1.6;
}

.server-basic-panel__alert-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.server-basic-panel__alert-pill {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  color: var(--el-text-color-regular);
  background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  font-size: 12px;
  font-weight: 600;
}

.server-basic-panel__alert-pill.is-warning {
  color: #b45309;
  background: rgba(251, 191, 36, 0.16);
  border-color: rgba(245, 158, 11, 0.26);
}

.server-basic-panel__alert-pill.is-danger {
  color: #b91c1c;
  background: rgba(248, 113, 113, 0.14);
  border-color: rgba(239, 68, 68, 0.24);
}

.server-basic-panel__alert-empty {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;
  border: 1px dashed color-mix(in srgb, var(--el-border-color) 72%, transparent);
  background: color-mix(in srgb, var(--el-bg-color-page) 90%, white);
}

.server-basic-panel__alert-empty strong {
  color: var(--el-text-color-primary);
}

.server-basic-panel__inline-meta {
  display: block;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 6px;
}

.server-basic-panel__diagnostic-text {
  margin: 0 0 8px;
  line-height: 1.6;
}

.server-basic-panel__diagnostic-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.server-basic-panel__diagnostic-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.server-basic-panel__diagnostic-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color-light) 92%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
}

.server-basic-panel__diagnostic-chip.is-success {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 10%, white);
  border-color: color-mix(in srgb, var(--el-color-success) 22%, transparent);
}

.server-basic-panel__alert-empty span {
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

.server-basic-panel__ai-card {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 24%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 10%, white),
    color-mix(in srgb, var(--el-bg-color-page) 90%, white)
  );
}

.server-basic-panel__login-dropdown {
  min-width: 280px !important;
  max-width: 320px;
  padding: 0;
}

.server-basic-panel__login-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.server-basic-panel__login-empty {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
  padding: 12px 0;
}

.server-basic-panel__login-item {
  padding: 10px 14px !important;
  height: auto !important;
  line-height: 1.4 !important;
}

.server-basic-panel__login-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.server-basic-panel__login-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
}

.server-basic-panel__login-user {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.server-basic-panel__login-status {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
}

.server-basic-panel__login-status.is-success {
  color: var(--el-color-success);
  background: rgba(var(--el-color-success-rgb), 0.1);
}

.server-basic-panel__login-status.is-failed {
  color: var(--el-color-danger);
  background: rgba(var(--el-color-danger-rgb), 0.1);
}

.server-basic-panel__login-ip {
  color: var(--el-text-color-secondary);
  font-family: monospace;
}

.server-basic-panel__login-time {
  color: var(--el-text-color-secondary);
}

.server-basic-panel__login-server {
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.server-basic-panel__login-server span {
  margin-left: 4px;
}

.server-basic-panel__ai-card--inactive {
  border-color: color-mix(in srgb, var(--el-color-warning) 28%, transparent);
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-warning) 10%, white),
    color-mix(in srgb, var(--el-bg-color-page) 90%, white)
  );
}

.server-basic-panel__ai-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.server-basic-panel__ai-card p,
.server-basic-panel__ai-card small {
  margin: 0;
  line-height: 1.65;
}

.server-basic-panel__ai-card small {
  color: var(--el-text-color-secondary);
}

.server-basic-panel__realtime-summary--combined {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
}

.server-basic-panel__metric-card,
.server-basic-panel__realtime-mini {
  color: #64748b;
  border-color: rgba(148, 163, 184, 0.18);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.99),
    rgba(248, 250, 252, 0.95)
  );
}

.server-basic-panel__metric-card.is-success,
.server-basic-panel__realtime-mini.is-success {
  color: #16a34a;
  border-color: rgba(34, 197, 94, 0.2);
  background: linear-gradient(
    180deg,
    rgba(240, 253, 244, 0.65),
    rgba(236, 253, 245, 0.45)
  );
}

.server-basic-panel__metric-card.is-warning,
.server-basic-panel__realtime-mini.is-warning {
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.22);
  background: linear-gradient(
    180deg,
    rgba(255, 251, 235, 0.65),
    rgba(254, 243, 199, 0.45)
  );
}

.server-basic-panel__metric-card.is-danger,
.server-basic-panel__realtime-mini.is-danger {
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.22);
  background: linear-gradient(
    180deg,
    rgba(254, 242, 242, 0.65),
    rgba(254, 226, 226, 0.45)
  );
}

.server-basic-panel__metric-card.is-idle,
.server-basic-panel__realtime-mini.is-idle {
  color: #64748b;
  border-color: rgba(148, 163, 184, 0.18);
  background: linear-gradient(
    180deg,
    rgba(248, 250, 252, 0.65),
    rgba(241, 245, 249, 0.45)
  );
}

:global(.server-basic-panel__login-tooltip-popper) {
  padding: 0 !important;
  border-radius: 18px !important;
  border: 1px solid rgba(148, 163, 184, 0.18) !important;
  box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12) !important;
  min-width: 320px;
  max-width: 360px;
}

@media (max-width: 1240px) {
  .server-basic-panel__realtime-combined {
    grid-template-columns: 1fr;
  }

  .server-basic-panel__realtime-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .server-basic-panel__content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1220px) {
  .server-basic-panel__metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .server-basic-panel__alert-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 1100px) {
  .server-basic-panel__hero,
  .server-basic-panel__realtime-header,
  .server-basic-panel__metric-grid,
  .server-basic-panel__content {
    grid-template-columns: 1fr;
  }

  .server-basic-panel__hero,
  .server-basic-panel__realtime-header {
    display: grid;
  }

  .server-basic-panel__metric-grid,
  .server-basic-panel__content {
    display: grid;
  }

  // ── 卡片悬停增强 ─────────────────────────────────
  .server-basic-panel__card {
    transition: transform 0.2s ease, box-shadow 0.25s ease, border-color 0.2s ease;
  }

  .server-basic-panel__card:hover {
    transform: translateY(-2px);
    box-shadow:
      0 12px 32px rgba(15, 23, 42, 0.06),
      0 4px 12px rgba(15, 23, 42, 0.03);
    border-color: rgba(14, 165, 233, 0.15);
  }

  // ── 硬件项悬停增强 ─────────────────────────────────
  .server-basic-panel__hardware-item {
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }

  .server-basic-panel__hardware-item:hover {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.85),
      rgba(239, 246, 255, 0.6)
    );
    box-shadow:
      0 4px 12px rgba(15, 23, 42, 0.06),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
  }

  // ── 卡片图表区域 ─────────────────────────────────
  .server-basic-panel__card-chart {
    transition: opacity 0.2s ease;
  }

  .server-basic-panel__card:hover .server-basic-panel__card-chart {
    opacity: 1;
  }

  // ── 分区列表美化 ─────────────────────────────────
  .server-basic-panel__partition-item {
    transition: background 0.2s ease;
  }

  .server-basic-panel__partition-item:hover {
    background: rgba(248, 250, 252, 0.9);
  }

  // ── 响应式增强 ─────────────────────────────────
  @media (max-width: 600px) {
    .server-basic-panel__hero {
      flex-direction: column;
      align-items: stretch;
      gap: 14px;
      padding: 16px 18px;
    }

    .server-basic-panel__identity {
      flex-wrap: wrap;
    }

    .server-basic-panel__hardware-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .server-basic-panel__action-groups {
      flex-direction: column;
      gap: 8px;
    }

    .server-basic-panel__action-row {
      flex-wrap: wrap;
    }
  }
}
</style>
