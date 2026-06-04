<template>
  <section class="spider-manage">
    <div class="spider-manage__content">
      <!-- Header -->
      <header class="spider-manage__header">
        <div class="spider-manage__header-left">
          <button type="button" class="spider-manage__back-btn" title="返回总览" @click="toggleManage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div>
            <h1 class="spider-manage__title">爬虫管理</h1>
            <p class="spider-manage__subtitle">
              共 <strong class="spider-manage__count">{{ spiders.length }}</strong> 个爬虫定义
            </p>
          </div>
        </div>
        <div class="spider-manage__actions">
          <div class="spider-manage__search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model="searchQuery" type="text" placeholder="搜索名称、编码、站点..." />
          </div>
          <button type="button" class="spider-manage__icon-btn" :class="{ 'is-spinning': loading }" @click="loadDefinitions" title="刷新">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button type="button" class="spider-manage__icon-btn" @click="openPoolDialog" title="池管理">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
          </button>
          <button type="button" class="spider-manage__create-btn" @click="openCreateDialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>新建爬虫</span>
          </button>
        </div>
      </header>

      <!-- Error -->
      <div v-if="errorMessage" class="spider-manage__error">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ errorMessage }}
      </div>

      <!-- Skeleton Loading -->
      <div v-if="loading && !spiders.length" class="spider-manage__grid">
        <div v-for="n in 6" :key="n" class="skeleton-card">
          <div class="skeleton-card__shimmer" />
          <div class="skeleton-card__top"><div class="skeleton-box" style="width:40px;height:40px;border-radius:10px" /><div style="flex:1;display:grid;gap:6px"><div class="skeleton-box" style="width:60%;height:14px" /><div class="skeleton-box" style="width:40%;height:10px" /></div></div>
          <div style="display:grid;gap:10px;margin-top:14px"><div class="skeleton-box" style="width:100%;height:10px" /><div class="skeleton-box" style="width:80%;height:10px" /></div>
          <div style="display:flex;gap:6px;margin-top:12px"><div v-for="k in 4" :key="k" class="skeleton-box" style="width:48px;height:20px;border-radius:6px" /></div>
        </div>
      </div>

      <!-- Cards Grid -->
      <div v-else-if="filteredSpiders.length" class="spider-manage__grid">
        <article v-for="(item, idx) in filteredSpiders" :key="item.spiderCode" class="spider-card" :style="{ '--i': idx }" @click="navigateToOrchestration(item)">
          <div class="spider-card__top">
            <div class="spider-card__identity">
              <span class="spider-card__avatar" :style="{ background: avatarColor(item.spiderCode) }">{{ item.spiderName.charAt(0) }}</span>
              <div class="spider-card__info">
                <strong class="spider-card__name">{{ item.spiderName }}</strong>
                <span class="spider-card__code">{{ item.spiderCode }}</span>
              </div>
            </div>
            <div class="spider-card__status">
              <span class="spider-card__pill" :class="isEnabled(item.spiderStatus) ? 'pill--on' : 'pill--off'">
                <span class="spider-card__pill-dot" />
                {{ isEnabled(item.spiderStatus) ? '启用' : '停用' }}
              </span>
              <span v-if="item.spiderLatestExecutionStatus" class="spider-card__pill" :class="'pill--exec-' + item.spiderLatestExecutionStatus.toLowerCase()">
                <span class="spider-card__pill-dot" />
                {{ execStatusLabel(item.spiderLatestExecutionStatus) }}
              </span>
            </div>
          </div>
          <div class="spider-card__body">
            <div class="spider-card__fields">
              <div class="spider-card__field">
                <span class="spider-card__field-header">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  主体网站
                </span>
                <span class="spider-card__field-value">{{ item.spiderSiteHost || '-' }}</span>
              </div>
              <div class="spider-card__field">
                <span class="spider-card__field-header">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
                  主入口
                </span>
                <span class="spider-card__field-value spider-card__field-value--url" :title="item.spiderEntryUrl">{{ item.spiderEntryUrl }}</span>
              </div>
            </div>
            <div class="spider-card__tags">
              <span class="spider-card__tag" :class="'tag--' + executorType(item)">{{ item.spiderExecutorType }}</span>
              <span class="spider-card__tag tag--neutral">AI {{ item.spiderAiEnabled ? '开' : '关' }}</span>
              <span class="spider-card__tag tag--neutral">深度 {{ item.spiderCollectDeepUrl ? '开' : '关' }}</span>
            </div>
          </div>
          <div class="spider-card__footer">
            <div class="spider-card__meta">
              <span class="spider-card__meta-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                {{ storageLabel(item.spiderUrlStorageType) }}
              </span>
              <span class="spider-card__meta-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16h16"/><polyline points="4 20 10 14 14 18 20 8"/></svg>
                {{ item.spiderExecutorRounds || 1 }} 轮
              </span>
            </div>
            <div class="spider-card__actions" @click.stop>
              <button type="button" class="spider-card__action-btn" title="编辑" @click="openEditDialog(item)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="spider-card__action-btn" :title="isEnabled(item.spiderStatus) ? '禁用' : '启用'" @click="toggleStatus(item)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle :cx="isEnabled(item.spiderStatus) ? '17' : '7'" cy="12" r="3"/></svg>
              </button>
              <button type="button" class="spider-card__action-btn" :class="item.spiderLatestExecutionStatus === 'RUNNING' ? 'action-btn--warn' : 'action-btn--prime'" :title="item.spiderLatestExecutionStatus === 'RUNNING' ? '已有运行中的实例' : '运行'" @click.stop="runSpider(item)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
              <button type="button" class="spider-card__action-btn" title="监控" @click.stop="openMonitor(item)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16h16"/><polyline points="4 20 10 14 14 18 20 8"/></svg>
              </button>
              <button type="button" class="spider-card__action-btn" title="采集数据" @click.stop="openParseResultDialog(item)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              </button>
              <button type="button" class="spider-card__action-btn action-btn--danger" title="删除" @click="removeDefinition(item.spiderCode)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </article>
      </div>

      <!-- Empty -->
      <div v-else class="spider-manage__empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>{{ searchQuery ? '没有匹配的爬虫定义' : '暂无爬虫定义' }}</span>
      </div>

      <!-- ── 创建/编辑 Dialog ── -->
      <Teleport to="body">
        <div v-if="dialogVisible" class="dialog-mask" @click.self="closeDialog">
          <section class="dialog">
            <div class="dialog__header">
              <div class="dialog__title-group">
                <strong class="dialog__title">{{ dialogMode === 'create' ? '新建爬虫' : '编辑爬虫' }}</strong>
                <span class="dialog__desc">配置爬虫定义的基本参数</span>
              </div>
              <button type="button" class="dialog__close" @click="closeDialog">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="dialog__body">
              <div class="dialog__grid">
                <label class="fld">
                  <span class="fld__label">编码</span>
                  <input v-model="form.spiderCode" type="text" placeholder="唯一编码" :disabled="dialogMode === 'edit'" />
                </label>
                <label class="fld">
                  <span class="fld__label">名称</span>
                  <input v-model="form.spiderName" type="text" placeholder="爬虫名称" />
                </label>
                <label class="fld" style="grid-column:1/-1">
                  <span class="fld__label">主入口</span>
                  <input v-model="form.spiderEntryUrl" type="text" placeholder="https://example.com" />
                </label>
                <label class="fld">
                  <span class="fld__label">主体网站</span>
                  <input v-model="form.spiderSiteHost" type="text" placeholder="example.com" />
                </label>
                <label class="fld">
                  <span class="fld__label">执行类型</span>
                  <select v-model="form.spiderExecutorType">
                    <option value="ONCE">ONCE</option>
                    <option value="N_TIMES">N_TIMES</option>
                    <option value="CRON">CRON</option>
                    <option value="SPI">SPI</option>
                    <option value="CODE">CODE</option>
                  </select>
                </label>
                <label class="fld">
                  <span class="fld__label">执行轮次</span>
                  <input v-model.number="form.spiderExecutorRounds" type="number" min="1" />
                </label>
                <label class="fld">
                  <span class="fld__label">去重策略</span>
                  <select v-model="form.spiderDedupStrategy">
                    <option value="URL_FINGERPRINT">URL_FINGERPRINT</option>
                    <option value="CONTENT_FINGERPRINT">CONTENT_FINGERPRINT</option>
                  </select>
                </label>
                <label class="fld">
                  <span class="fld__label">存储方式</span>
                  <select v-model="form.spiderUrlStorageType">
                    <option value="DATABASE">DATABASE</option>
                    <option value="REDIS">REDIS</option>
                    <option value="SPI">SPI</option>
                  </select>
                </label>
                <label v-if="form.spiderUrlStorageType === 'SPI'" class="fld" style="grid-column:1/-1">
                  <span class="fld__label">存储 SPI</span>
                  <input v-model="form.spiderUrlStorageSpi" type="text" placeholder="SPI 实现类" />
                </label>
              </div>
              <div class="dialog__switches">
                <label class="sw"><div class="sw__info"><strong>AI 接入</strong><small>默认让编排节点启用 AI 介入</small></div><span class="sw__toggle" :class="{ on: form.spiderAiEnabled }" @click="form.spiderAiEnabled = !form.spiderAiEnabled"><span class="sw__knob" /></span></label>
                <label class="sw"><div class="sw__info"><strong>深度采集</strong><small>递归提取页内链接</small></div><span class="sw__toggle" :class="{ on: form.spiderCollectDeepUrl }" @click="form.spiderCollectDeepUrl = !form.spiderCollectDeepUrl"><span class="sw__knob" /></span></label>
                <label class="sw"><div class="sw__info"><strong>失败通知</strong><small>执行异常时告警</small></div><span class="sw__toggle" :class="{ on: form.spiderNotifyOnFailure }" @click="form.spiderNotifyOnFailure = !form.spiderNotifyOnFailure"><span class="sw__knob" /></span></label>
                <label class="sw"><div class="sw__info"><strong>启用状态</strong><small>是否激活该爬虫</small></div><span class="sw__toggle" :class="{ on: form.spiderStatus }" @click="form.spiderStatus = !form.spiderStatus"><span class="sw__knob" /></span></label>
              </div>
            </div>
            <footer class="dialog__actions">
              <button type="button" class="dbtn dbtn--ghost" @click="closeDialog">取消</button>
              <button type="button" class="dbtn dbtn--prime" :disabled="submitting" @click="submitForm">
                <span v-if="submitting" class="dbtn__spinner" />
                {{ submitting ? '提交中...' : '保存配置' }}
              </button>
            </footer>
          </section>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="executionDialogVisible" class="record-mask" @click.self="closeExecutionDialog">
          <section class="record-modal">
            <div class="record-modal__surface">
              <header class="record-modal__head">
                <div class="record-modal__title-group">
                  <strong>{{ executionDialogTitle || '运行记录' }}</strong>
                  <span>{{ executionDialogCode || '-' }}</span>
                </div>
                <div class="record-modal__actions">
                  <button
                    type="button"
                    class="record-play-btn"
                    :disabled="!executionEvents.length"
                    @click="toggleExecutionPlayback"
                  >
                    {{ executionPlaybackTimer ? '暂停' : '播放' }}
                  </button>
                  <button type="button" class="record-close-btn" @click="closeExecutionDialog">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </header>

              <div class="record-modal__body">
                <aside class="record-list thin-scroller">
                  <button
                    v-for="item in executionRecords"
                    :key="item.spiderExecutionNo"
                    type="button"
                    class="record-list__item"
                    :class="{ 'is-active': item.spiderExecutionNo === activeExecutionNo }"
                    @click="selectExecutionRecord(item.spiderExecutionNo)"
                  >
                    <span class="record-list__status" :class="'exec-status--' + (item.spiderExecutionStatus || '').toLowerCase()">
                      <span class="record-list__dot" />
                      {{ item.spiderExecutionStatus || 'UNKNOWN' }}
                    </span>
                    <span class="record-list__id">{{ item.spiderExecutionNo.slice(-12) }}</span>
                    <small class="record-list__time">{{ formatShortTime(item.spiderFinishedAt || item.spiderStartedAt || item.createTime) }}</small>
                  </button>
                  <el-empty v-if="!executionRecords.length && !executionLoading" :image-size="80" description="暂无运行记录" />
                </aside>

                <section class="record-player">
                  <div class="record-player__summary">
                    <div>
                      <span>当前执行</span>
                      <strong>{{ activeExecutionDetail?.spiderExecutionNo || '-' }}</strong>
                    </div>
                    <div>
                      <span>状态</span>
                      <strong>{{ activeExecutionDetail?.spiderExecutionStatus || '-' }}</strong>
                    </div>
                    <div>
                      <span>当前节点</span>
                      <strong>{{ activeExecutionDetail?.spiderCurrentNodeCode || '-' }}</strong>
                    </div>
                    <button
                      v-if="activeExecutionDetail?.spiderExecutionStatus === 'SUCCESS'"
                      type="button"
                      class="record-play-btn"
                      @click="navigateToReplay"
                    >
                      回放
                    </button>
                  </div>

                  <div v-if="currentPlaybackEvent" class="record-player__spotlight">
                    <span class="spotlight-type">{{ currentPlaybackEvent.spiderEventType }}</span>
                    <strong>{{ currentPlaybackEvent.spiderNodeName || currentPlaybackEvent.spiderNodeCode || '-' }}</strong>
                    <p>{{ currentPlaybackEvent.spiderMessage || '-' }}</p>
                    <small>{{ currentPlaybackEvent.spiderEventTime || '-' }}</small>
                  </div>

                  <div class="record-player__timeline-header" v-if="executionEvents.length">
                    <span>事件轨迹</span>
                    <span class="tl-count">{{ executionEvents.length }} 个事件</span>
                  </div>
                  <div class="record-player__timeline thin-scroller">
                    <article
                      v-for="(item, index) in executionEvents"
                      :key="`${item.spiderExecutionNo}-${item.spiderEventType}-${index}`"
                      class="record-player__event"
                      :class="{ 'is-active': index === playbackIndex, 'is-played': index <= playbackIndex }"
                    >
                      <div class="record-player__event-dot" />
                      <div class="record-player__event-content">
                        <strong>{{ item.spiderNodeName || item.spiderNodeCode || item.spiderEventType }}</strong>
                        <span class="evt-type">{{ item.spiderEventType }}</span>
                        <p>{{ item.spiderMessage || '-' }}</p>
                        <small>{{ item.spiderEventTime || '-' }}</small>
                      </div>
                    </article>
                    <el-empty v-if="!executionEvents.length && !executionLoading" :image-size="80" description="暂无事件轨迹" />
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="parseResultDialogVisible" class="record-mask" @click.self="closeParseResultDialog">
          <section class="record-modal parse-result-modal">
            <div class="record-modal__surface">
              <header class="record-modal__head">
                <div class="record-modal__title-group">
                  <strong>{{ parseResultDialogTitle || '采集数据' }}</strong>
                  <span>{{ parseResultDialogCode || '-' }}</span>
                </div>
                <div class="record-modal__actions">
                  <div class="pr-search">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input v-model="prSearchQuery" type="text" placeholder="搜索 URL 或数据内容..." />
                  </div>
                  <span class="pr-count">{{ filteredParseResults.length }} 条</span>
                  <button type="button" class="record-close-btn" @click="closeParseResultDialog">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </header>
              <div class="pr-body">
                <div class="pr-list thin-scroller">
                  <div v-if="parseResultLoading" class="pr-empty">加载中...</div>
                  <template v-else-if="filteredParseResults.length">
                    <article
                      v-for="(item, index) in paginatedResults"
                      :key="item.spiderId"
                      class="pr-card"
                      :class="{ 'is-selected': selectedParseResult?.spiderId === item.spiderId }"
                      @click="selectedParseResult = item"
                    >
                      <div class="pr-card__head">
                        <span class="pr-card__idx">#{{ (parseResultPage - 1) * parseResultPageSize + index + 1 }}</span>
                        <span class="pr-card__time">{{ formatShortTime(item.createTime) }}</span>
                      </div>
                      <div class="pr-card__url" :title="item.spiderTargetUrl">{{ item.spiderTargetUrl }}</div>
                      <div class="pr-card__tags">
                        <span v-for="(v, k) in payloadPreview(item)" :key="k" class="pr-tag" :title="`${k}: ${v}`">
                          <span class="pr-tag__key">{{ k }}</span>
                          <span class="pr-tag__val">{{ v }}</span>
                        </span>
                      </div>
                    </article>
                    <div v-if="parseResultPageTotal > 1" class="pr-pagination">
                      <button :disabled="parseResultPage <= 1" @click="parseResultPage--">&lt;</button>
                      <span>{{ parseResultPage }} / {{ parseResultPageTotal }}</span>
                      <button :disabled="parseResultPage >= parseResultPageTotal" @click="parseResultPage++">&gt;</button>
                    </div>
                  </template>
                  <el-empty v-else-if="!parseResultLoading" :image-size="80" description="暂无采集数据" />
                </div>
                <div v-if="selectedParseResult" class="pr-detail thin-scroller">
                  <div class="pr-detail__section">
                    <label>目标 URL</label>
                    <div class="pr-detail__url">{{ selectedParseResult.spiderTargetUrl }}</div>
                  </div>
                  <div class="pr-detail__section">
                    <label>采集时间</label>
                    <div class="pr-detail__time">{{ selectedParseResult.createTime }}</div>
                  </div>
                  <div class="pr-detail__section pr-detail__section--grow">
                    <label>JSON 数据</label>
                    <pre class="pr-detail__json thin-scroller"><code>{{ formatJson(selectedParseResult) }}</code></pre>
                  </div>
                </div>
                <div v-else class="pr-detail pr-detail--empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p>点击左侧数据卡片查看详情</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </Teleport>

      <Teleport to="body">
        <div v-if="poolDialogVisible" class="record-mask" @click.self="closePoolDialog">
          <section class="record-modal">
            <div class="record-modal__surface pool-surface">
              <header class="record-modal__head">
                <div class="record-modal__title-group">
                  <strong>池管理</strong>
                  <span>{{ activePoolType }}</span>
                </div>
                <div class="record-modal__actions">
                  <button type="button" class="record-play-btn" @click="createPool">新增池</button>
                  <button type="button" class="record-close-btn" @click="closePoolDialog">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </header>

              <div class="pool-type-switch">
                <button v-for="type in poolTypes" :key="type" type="button" class="record-play-btn" :class="{ 'is-active': type === activePoolType }" @click="switchPoolType(type)">{{ type }}</button>
              </div>

              <div class="record-modal__body">
                <aside class="record-list thin-scroller">
                  <button
                    v-for="pool in spiderPools"
                    :key="pool.spiderPoolCode"
                    type="button"
                    class="record-list__item"
                    :class="{ 'is-active': pool.spiderPoolCode === activePoolCode }"
                    @click="selectPool(pool.spiderPoolCode)"
                  >
                    <strong>{{ pool.spiderPoolName }}</strong>
                    <span>{{ pool.spiderPoolCode }}</span>
                  </button>
                </aside>

                <section class="record-player">
                  <div class="record-player__summary">
                    <div>
                      <span>当前池</span>
                      <strong>{{ activePoolCode || '-' }}</strong>
                    </div>
                    <div class="record-player__summary-actions">
                      <button type="button" class="record-play-btn" :disabled="!activePoolCode" @click="createPoolItem">新增数据项</button>
                      <button type="button" class="record-play-btn" :disabled="!activePoolCode" @click="removePool">删除池</button>
                    </div>
                  </div>

                  <div class="pool-form-grid">
                    <label class="spider-node-panel__item">
                      <span>池编码</span>
                      <input v-model="poolForm.spiderPoolCode" type="text" />
                    </label>
                    <label class="spider-node-panel__item">
                      <span>池名称</span>
                      <input v-model="poolForm.spiderPoolName" type="text" />
                    </label>
                    <label class="spider-node-panel__item pool-form-grid__full">
                      <span>备注</span>
                      <input v-model="poolForm.spiderPoolRemark" type="text" />
                    </label>
                  </div>

                  <div class="spider-manual-task-card__actions">
                    <button type="button" class="spider-toolbar-btn spider-toolbar-btn--primary" @click="savePoolForm">保存池</button>
                  </div>

                  <div class="record-player__timeline thin-scroller">
                    <article
                      v-for="item in spiderPoolItems"
                      :key="`${item.spiderPoolCode}-${item.spiderItemCode}`"
                      class="record-player__event is-played"
                    >
                      <div class="record-player__event-content">
                        <strong>{{ item.spiderItemName }}</strong>
                        <span>{{ item.spiderItemCode }}</span>
                        <textarea v-model="item.spiderItemPayload" rows="6" class="pool-payload-textarea" />
                        <div class="spider-manual-task-card__actions">
                          <button type="button" class="record-play-btn" @click="savePoolItemForm(item)">保存</button>
                          <button type="button" class="record-play-btn" @click="removePoolItem(item)">删除</button>
                        </div>
                      </div>
                    </article>
                  </div>
                </section>
              </div>
            </div>
          </section>
        </div>
      </Teleport>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from "vue";
import {
  createSpiderDefinition, deleteSpiderDefinition, listSpiderDefinitions,
  getSpiderExecutionDetail,
  getSpiderExecutionEvents,
  deleteSpiderPool,
  deleteSpiderPoolItem,
  listSpiderParseResults,
  listSpiderPoolItems,
  listSpiderPools,
  listSpiderExecutionRecords,
  runSpiderExecution,
  runSpiderExample,
  saveSpiderPool,
  saveSpiderPoolItem,
  updateSpiderDefinition, updateSpiderDefinitionStatus,
} from "../../../api/spider";
import type {
  SpiderDefinition,
  SpiderExecutionDetailView,
  SpiderExecutionEventView,
  SpiderExecutionRecordView,
  SpiderPool,
  SpiderPoolItem,
  SpiderPoolType,
} from "../../../types/orchestration";

type DialogMode = "create" | "edit";

const loading = ref(false);
const submitting = ref(false);
const errorMessage = ref("");
const searchQuery = ref("");
const spiders = ref<SpiderDefinition[]>([]);
const dialogVisible = ref(false);
const dialogMode = ref<DialogMode>("create");
const editingCode = ref("");
const executionDialogVisible = ref(false);
const executionDialogTitle = ref("");
const executionDialogCode = ref("");
const executionLoading = ref(false);
const executionRecords = ref<SpiderExecutionRecordView[]>([]);
const activeExecutionNo = ref("");
const activeExecutionDetail = ref<SpiderExecutionDetailView | null>(null);
const executionEvents = ref<SpiderExecutionEventView[]>([]);
const playbackIndex = ref(-1);
const executionPlaybackTimer = ref<ReturnType<typeof setInterval> | null>(null);
const execRefreshTimer = ref<ReturnType<typeof setInterval> | null>(null);
const poolDialogVisible = ref(false);
const poolTypes: SpiderPoolType[] = ["ACCOUNT", "DATA", "DICTIONARY"];
const activePoolType = ref<SpiderPoolType>("ACCOUNT");
const spiderPools = ref<SpiderPool[]>([]);
const spiderPoolItems = ref<SpiderPoolItem[]>([]);
const activePoolCode = ref("");
const poolForm = ref<SpiderPool>({
  spiderPoolCode: "",
  spiderPoolName: "",
  spiderPoolType: "ACCOUNT",
  spiderPoolStatus: 1,
  spiderPoolRemark: "",
});

const colors = ['#06b6d4','#8b5cf6','#14b8a6','#f59e0b','#3b82f6','#22c55e','#ec4899','#f97316'];
const avatarColor = (code: string) => {
  let h = 0; for (let i = 0; i < code.length; i++) h = ((h << 5) - h) + code.charCodeAt(i);
  return colors[Math.abs(h) % colors.length];
};

const executorType = (item: SpiderDefinition) => (item.spiderExecutorType || 'ONCE').toLowerCase();
const dedupLabel = (s: SpiderDefinition['spiderDedupStrategy']) =>
  ({ URL_FINGERPRINT: 'URL 指纹', NORMALIZED_URL: '规范化 URL', CONTENT_FINGERPRINT: '内容指纹', CUSTOM: '自定义' })[s] || s;
const storageLabel = (s: SpiderDefinition['spiderUrlStorageType']) =>
  ({ DATABASE: '数据库', REDIS: 'Redis', SPI: 'SPI 扩展' })[s] || s;

const execStatusLabel = (s: string) =>
  ({ RUNNING: '运行中', WAIT_MANUAL: '等待人工', SUCCESS: '已完成', FAILED: '失败', WAITING: '等待中', STOPPED: '已停止' })[s] || s;

const parseExecutorConfig = (value?: string) => {
  if (!value) return {} as Record<string, any>;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const isAiEnabled = (item: Pick<SpiderDefinition, "spiderAiEnabled" | "spiderExecutorConfig">) => {
  if (typeof item.spiderAiEnabled === "boolean") return item.spiderAiEnabled;
  if (typeof item.spiderAiEnabled === "number") return item.spiderAiEnabled !== 0;
  const config = parseExecutorConfig(item.spiderExecutorConfig);
  if (typeof config.aiEnabled === "boolean") return config.aiEnabled;
  if (typeof config.aiEnabled === "number") return config.aiEnabled !== 0;
  return true;
};

const filteredSpiders = computed(() => {
  if (!searchQuery.value) return spiders.value;
  const q = searchQuery.value.toLowerCase();
  return spiders.value.filter(s =>
    s.spiderName.toLowerCase().includes(q) ||
    s.spiderCode.toLowerCase().includes(q) ||
    (s.spiderSiteHost || '').toLowerCase().includes(q)
  );
});

const createEmptyForm = () => ({
  spiderCode: "", spiderName: "", spiderEntryUrl: "", spiderSiteHost: "",
  spiderExecutorType: "ONCE" as SpiderDefinition["spiderExecutorType"],
  spiderExecutorRounds: 1, spiderCollectDeepUrl: true, spiderNotifyOnFailure: true,
  spiderDedupStrategy: "URL_FINGERPRINT" as SpiderDefinition["spiderDedupStrategy"],
  spiderUrlStorageType: "DATABASE" as SpiderDefinition["spiderUrlStorageType"],
  spiderUrlStorageSpi: "", spiderStatus: true, spiderAiEnabled: true, spiderExecutorConfig: {} as Record<string, any>,
});

const form = ref(createEmptyForm());

const isEnabled = (status: SpiderDefinition["spiderStatus"]) => status === "ENABLED" || status === 1;

const toPayload = (): SpiderDefinition => ({
  spiderCode: form.value.spiderCode, spiderName: form.value.spiderName,
  spiderEntryUrl: form.value.spiderEntryUrl, spiderSiteHost: form.value.spiderSiteHost,
  spiderExecutorType: form.value.spiderExecutorType,
  spiderExecutorRounds: Number(form.value.spiderExecutorRounds || 1),
  spiderExecutorConfig: JSON.stringify({
    ...(form.value.spiderExecutorConfig || {}),
    aiEnabled: Boolean(form.value.spiderAiEnabled),
  }),
  spiderAiEnabled: form.value.spiderAiEnabled ? 1 : 0,
  spiderCollectDeepUrl: form.value.spiderCollectDeepUrl ? 1 : 0,
  spiderNotifyOnFailure: form.value.spiderNotifyOnFailure ? 1 : 0,
  spiderDedupStrategy: form.value.spiderDedupStrategy,
  spiderUrlStorageType: form.value.spiderUrlStorageType,
  spiderUrlStorageSpi: form.value.spiderUrlStorageSpi || undefined,
  spiderStatus: form.value.spiderStatus ? 1 : 0,
});

const normalizeDefinitions = (items: SpiderDefinition[]) =>
  items.map((item, index) => ({
    ...item,
    spiderId: item.spiderId ?? index + 1,
    spiderAiEnabled: isAiEnabled(item),
  }));

const loadDefinitions = async () => {
  loading.value = true; errorMessage.value = "";
  try { spiders.value = normalizeDefinitions(await listSpiderDefinitions()); }
  catch (e) { errorMessage.value = `接口失败：${String(e)}`; }
  finally { loading.value = false; }
};

const openCreateDialog = () => { dialogMode.value = "create"; editingCode.value = ""; form.value = createEmptyForm(); dialogVisible.value = true; };
const openEditDialog = (item: SpiderDefinition) => {
  dialogMode.value = "edit"; editingCode.value = item.spiderCode;
  form.value = {
    spiderCode: item.spiderCode,
    spiderName: item.spiderName,
    spiderEntryUrl: item.spiderEntryUrl,
    spiderSiteHost: item.spiderSiteHost,
    spiderExecutorType: item.spiderExecutorType,
    spiderExecutorRounds: item.spiderExecutorRounds || 1,
    spiderCollectDeepUrl: item.spiderCollectDeepUrl === true || item.spiderCollectDeepUrl === 1,
    spiderNotifyOnFailure: item.spiderNotifyOnFailure === true || item.spiderNotifyOnFailure === 1,
    spiderDedupStrategy: item.spiderDedupStrategy,
    spiderUrlStorageType: item.spiderUrlStorageType,
    spiderUrlStorageSpi: item.spiderUrlStorageSpi || "",
    spiderStatus: isEnabled(item.spiderStatus),
    spiderAiEnabled: isAiEnabled(item),
    spiderExecutorConfig: parseExecutorConfig(item.spiderExecutorConfig),
  };
  dialogVisible.value = true;
};
const closeDialog = () => { dialogVisible.value = false; submitting.value = false; };
const stopExecutionPlayback = () => {
  if (!executionPlaybackTimer.value) return;
  clearInterval(executionPlaybackTimer.value);
  executionPlaybackTimer.value = null;
};
const closeExecutionDialog = () => {
  stopExecutionPlayback();
  if (execRefreshTimer.value) {
    clearInterval(execRefreshTimer.value);
    execRefreshTimer.value = null;
  }
  executionDialogVisible.value = false;
  executionDialogTitle.value = "";
  executionDialogCode.value = "";
  executionLoading.value = false;
  executionRecords.value = [];
  activeExecutionNo.value = "";
  activeExecutionDetail.value = null;
  executionEvents.value = [];
  playbackIndex.value = -1;
};
const closePoolDialog = () => {
  poolDialogVisible.value = false;
  spiderPools.value = [];
  spiderPoolItems.value = [];
  activePoolCode.value = "";
};
function formatShortTime(t?: string): string {
  if (!t) return "-";
  try {
    const d = new Date(t);
    if (isNaN(d.getTime())) return t.slice(0, 16);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return t.slice(0, 16); }
}
const currentPlaybackEvent = computed(() =>
  playbackIndex.value >= 0 ? executionEvents.value[playbackIndex.value] || null : null
);
const selectExecutionRecord = async (spiderExecutionNo: string) => {
  if (!spiderExecutionNo) return;
  stopExecutionPlayback();
  executionLoading.value = true;
  activeExecutionNo.value = spiderExecutionNo;
  playbackIndex.value = -1;
  try {
    const [detail, events] = await Promise.all([
      getSpiderExecutionDetail(spiderExecutionNo),
      getSpiderExecutionEvents(spiderExecutionNo),
    ]);
    activeExecutionDetail.value = detail;
    executionEvents.value = events;
  } finally {
    executionLoading.value = false;
  }
};
const toggleExecutionPlayback = () => {
  if (!executionEvents.value.length) return;
  if (executionPlaybackTimer.value) {
    stopExecutionPlayback();
    return;
  }
  if (playbackIndex.value >= executionEvents.value.length - 1) {
    playbackIndex.value = -1;
  }
  executionPlaybackTimer.value = setInterval(() => {
    if (playbackIndex.value >= executionEvents.value.length - 1) {
      stopExecutionPlayback();
      return;
    }
    playbackIndex.value += 1;
  }, 900);
};
const openExecutionDialog = async (item: SpiderDefinition) => {
  executionDialogVisible.value = true;
  executionDialogTitle.value = item.spiderName;
  executionDialogCode.value = item.spiderCode;
  executionLoading.value = true;
  executionRecords.value = [];
  activeExecutionNo.value = "";
  activeExecutionDetail.value = null;
  executionEvents.value = [];
  playbackIndex.value = -1;
  stopExecutionPlayback();
  try {
    await refreshExecutionRecords(item.spiderCode);
  } catch (e) {
    errorMessage.value = `加载运行记录失败：${String(e)}`;
  } finally {
    executionLoading.value = false;
  }
  // 自动刷新运行记录列表
  if (execRefreshTimer.value) clearInterval(execRefreshTimer.value);
  execRefreshTimer.value = setInterval(() => {
    refreshExecutionRecords(item.spiderCode).catch(() => undefined);
  }, 10000);
};

const refreshExecutionRecords = async (spiderCode: string) => {
  if (!spiderCode) return;
  const records = await listSpiderExecutionRecords(spiderCode, undefined, 12);
  // 保持当前选中的记录不变
  const previousActiveNo = activeExecutionNo.value;
  executionRecords.value = records;
  if (records.length && !previousActiveNo) {
    await selectExecutionRecord(records[0].spiderExecutionNo);
  } else if (records.length && previousActiveNo) {
    // 如果当前选中的记录还在列表中，保持选中
    const stillExists = records.some(r => r.spiderExecutionNo === previousActiveNo);
    if (!stillExists) {
      await selectExecutionRecord(records[0].spiderExecutionNo);
    }
  }
};
const parseResultDialogVisible = ref(false);
const parseResultDialogTitle = ref("");
const parseResultDialogCode = ref("");
const parseResults = ref<import("../../../api/spider").SpiderParseResultView[]>([]);
const parseResultLoading = ref(false);
const parseResultPage = ref(1);
const parseResultPageSize = 15;
const prSearchQuery = ref("");
const selectedParseResult = ref<import("../../../api/spider").SpiderParseResultView | null>(null);

const filteredParseResults = computed(() => {
  const q = prSearchQuery.value.toLowerCase().trim();
  if (!q) return parseResults.value;
  return parseResults.value.filter(item => {
    if (item.spiderTargetUrl?.toLowerCase().includes(q)) return true;
    try {
      const payload = JSON.parse(item.spiderResultPayload || "{}");
      return JSON.stringify(payload).toLowerCase().includes(q);
    } catch {
      return false;
    }
  });
});

const parseResultPageTotal = computed(() =>
  Math.max(1, Math.ceil(filteredParseResults.value.length / parseResultPageSize))
);

const paginatedResults = computed(() => {
  const start = (parseResultPage.value - 1) * parseResultPageSize;
  return filteredParseResults.value.slice(start, start + parseResultPageSize);
});

function parsedPayload(item: import("../../../api/spider").SpiderParseResultView): Record<string, any> {
  try { return JSON.parse(item.spiderResultPayload || "{}"); }
  catch { return {}; }
}

function payloadPreview(item: import("../../../api/spider").SpiderParseResultView): Record<string, string> {
  const p = parsedPayload(item);
  const keys = Object.keys(p);
  const preview: Record<string, string> = {};
  let count = 0;
  for (const k of keys) {
    if (count >= 3) break;
    const v = p[k];
    preview[k] = v === null || v === undefined ? '-' : String(v).slice(0, 40);
    count++;
  }
  return preview;
}

function formatJson(item: import("../../../api/spider").SpiderParseResultView): string {
  try {
    return JSON.stringify(JSON.parse(item.spiderResultPayload || "{}"), null, 2);
  } catch {
    return item.spiderResultPayload || '{}';
  }
}

const openParseResultDialog = async (item: SpiderDefinition) => {
  parseResultDialogVisible.value = true;
  parseResultDialogTitle.value = item.spiderName;
  parseResultDialogCode.value = item.spiderCode;
  parseResultLoading.value = true;
  parseResults.value = [];
  parseResultPage.value = 1;
  try {
    parseResults.value = await listSpiderParseResults(item.spiderCode, undefined, 100);
  } catch (e) {
    errorMessage.value = `加载采集数据失败：${String(e)}`;
  } finally {
    parseResultLoading.value = false;
  }
};
const closeParseResultDialog = () => {
  parseResultDialogVisible.value = false;
  parseResultDialogTitle.value = "";
  parseResultDialogCode.value = "";
  parseResults.value = [];
  prSearchQuery.value = "";
  selectedParseResult.value = null;
};

const navigateToReplay = () => {
  if (!activeExecutionDetail.value) return;
  const code = activeExecutionDetail.value.spiderDefinitionCode;
  const no = activeExecutionDetail.value.spiderExecutionNo;
  if (!code || !no) return;
  // 导航到编排页，附带 replayExecutionNo 参数
  navigateToOrchestration({ spiderCode: code }, { replayExecutionNo: no });
};

const loadPools = async () => {
  spiderPools.value = await listSpiderPools(activePoolType.value);
  const nextCode = spiderPools.value.some(item => item.spiderPoolCode === activePoolCode.value)
    ? activePoolCode.value
    : spiderPools.value[0]?.spiderPoolCode || "";
  activePoolCode.value = nextCode;
  if (nextCode) {
    spiderPoolItems.value = await listSpiderPoolItems(nextCode);
    const pool = spiderPools.value.find(item => item.spiderPoolCode === nextCode);
    if (pool) poolForm.value = { ...pool };
  } else {
    spiderPoolItems.value = [];
    poolForm.value = {
      spiderPoolCode: "",
      spiderPoolName: "",
      spiderPoolType: activePoolType.value,
      spiderPoolStatus: 1,
      spiderPoolRemark: "",
    };
  }
};
const openPoolDialog = async () => {
  poolDialogVisible.value = true;
  await loadPools();
};
const switchPoolType = async (type: SpiderPoolType) => {
  activePoolType.value = type;
  await loadPools();
};
const selectPool = async (spiderPoolCode: string) => {
  activePoolCode.value = spiderPoolCode;
  const pool = spiderPools.value.find(item => item.spiderPoolCode === spiderPoolCode);
  if (pool) {
    poolForm.value = { ...pool };
  }
  spiderPoolItems.value = await listSpiderPoolItems(spiderPoolCode);
};
const createPool = () => {
  activePoolCode.value = "";
  spiderPoolItems.value = [];
  poolForm.value = {
    spiderPoolCode: "",
    spiderPoolName: "",
    spiderPoolType: activePoolType.value,
    spiderPoolStatus: 1,
    spiderPoolRemark: "",
  };
};
const savePoolForm = async () => {
  poolForm.value.spiderPoolType = activePoolType.value;
  const saved = await saveSpiderPool(poolForm.value);
  activePoolCode.value = saved.spiderPoolCode;
  await loadPools();
};
const removePool = async () => {
  if (!activePoolCode.value) return;
  await deleteSpiderPool(activePoolCode.value);
  await loadPools();
};
const createPoolItem = () => {
  if (!activePoolCode.value) return;
  spiderPoolItems.value = [
    ...spiderPoolItems.value,
    {
      spiderPoolCode: activePoolCode.value,
      spiderItemCode: `item-${Date.now()}`,
      spiderItemName: "新数据项",
      spiderItemType: activePoolType.value,
      spiderItemPayload: activePoolType.value === "ACCOUNT"
        ? JSON.stringify({ username: "", password: "", cookieJson: "" }, null, 2)
        : JSON.stringify({}, null, 2),
      spiderSortNum: spiderPoolItems.value.length * 10,
      spiderItemStatus: 1,
    },
  ];
};
const savePoolItemForm = async (item: SpiderPoolItem) => {
  await saveSpiderPoolItem(item);
  spiderPoolItems.value = await listSpiderPoolItems(activePoolCode.value);
};
const removePoolItem = async (item: SpiderPoolItem) => {
  await deleteSpiderPoolItem(item.spiderPoolCode, item.spiderItemCode);
  spiderPoolItems.value = await listSpiderPoolItems(activePoolCode.value);
};

const submitForm = async () => {
  if (!form.value.spiderCode || !form.value.spiderName || !form.value.spiderEntryUrl) { errorMessage.value = "编码、名称、主入口不能为空"; return; }
  submitting.value = true; errorMessage.value = "";
  try {
    const p = toPayload();
    dialogMode.value === "create" ? await createSpiderDefinition(p) : await updateSpiderDefinition(editingCode.value, p);
    closeDialog(); await loadDefinitions();
  } catch (e) { errorMessage.value = `保存失败：${String(e)}`; }
  finally { submitting.value = false; }
};

const removeDefinition = async (spiderCode: string) => {
  if (!window.confirm(`确认删除 ${spiderCode} 吗？`)) return;
  try { await deleteSpiderDefinition(spiderCode); await loadDefinitions(); }
  catch (e) { errorMessage.value = `删除失败：${String(e)}`; }
};

const toggleStatus = async (item: SpiderDefinition) => {
  try { await updateSpiderDefinitionStatus(item.spiderCode, isEnabled(item.spiderStatus) ? 0 : 1); await loadDefinitions(); }
  catch (e) { errorMessage.value = `状态更新失败：${String(e)}`; }
};

const navigateToOrchestration = inject<(item: { spiderId?: number | null; spiderCode: string }, extraParams?: Record<string, string>) => void>('navigateToOrchestration')
  || ((item, extraParams) => {
    const qs = new URLSearchParams({ spiderCode: item.spiderCode, ...extraParams }).toString();
    window.location.hash = `/spider/orchestration?${qs}`;
  });
const toggleManage = inject<() => void>('toggleManage')
  || (() => { window.location.hash = '/spider/home'; });

const runningCode = ref("");

const runSpider = async (item: SpiderDefinition) => {
  // 已运行中：跳转到编排页查看
  if (item.spiderLatestExecutionStatus === 'RUNNING') {
    navigateToOrchestration(item);
    return;
  }
  if (runningCode.value) return;
  runningCode.value = item.spiderCode;
  try {
    const result = await runSpiderExample(item.spiderCode);
    const executionNo = result?.spiderExecutionNo;
    errorMessage.value = `✅ 已启动 ${item.spiderName}`;
    // 自动跳转到监控页面，只显示本次运行
    openMonitor(item, executionNo);
  } catch (e) {
    errorMessage.value = `运行失败：${String(e)}`;
  } finally {
    runningCode.value = "";
  }
};

const openMonitor = (item: SpiderDefinition, executionNo?: string) => {
  const qs = new URLSearchParams({ code: item.spiderCode });
  if (executionNo) qs.set("executionNo", executionNo);
  window.open(`/?spiderTab=monitor&${qs.toString()}`, '_blank');
};

onMounted(() => { loadDefinitions(); });
onBeforeUnmount(() => {
  stopExecutionPlayback();
  if (execRefreshTimer.value) clearInterval(execRefreshTimer.value);
});
</script>

<style scoped lang="scss">
.spider-manage {
  background: var(--lay-bg);
  font-family: 'Inter', -apple-system, system-ui, sans-serif;
}

.spider-manage__content {
  padding: 24px 28px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ── Header ──────────────────────────────────
.spider-manage__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.spider-manage__header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spider-manage__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--lay-border);
  border-radius: 8px;
  background: var(--lay-surface-bg);
  color: var(--lay-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
    color: var(--lay-accent);
  }
}

.spider-manage__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: var(--lay-text-primary);
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.spider-manage__subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--lay-text-placeholder);
  display: flex;
  align-items: center;
  gap: 4px;
}

.spider-manage__count {
  color: var(--lay-accent);
  font-weight: 600;
}

// ── Actions ─────────────────────────────────
.spider-manage__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.spider-manage__search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 10px;
  border-radius: 8px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-bg);
  color: var(--lay-text-placeholder);
  transition: border-color 0.2s;

  &:focus-within {
    border-color: color-mix(in srgb, var(--lay-accent) 30%, transparent);
  }

  input {
    width: 160px;
    border: none;
    background: transparent;
    color: var(--lay-text-regular);
    font-size: 13px;
    outline: none;
    &::placeholder { color: var(--lay-text-placeholder); }
  }
}

.spider-manage__icon-btn {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--lay-border);
  border-radius: 8px;
  background: var(--lay-surface-bg);
  color: var(--lay-text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
    color: var(--lay-accent);
  }

  &.is-spinning svg { animation: spin 1s linear infinite; }
}

.spider-manage__create-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: none;
  border-radius: 8px;
  background: var(--lay-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    box-shadow: 0 2px 12px color-mix(in srgb, var(--lay-accent) 20%, transparent);
  }
}

// ── Error ───────────────────────────────────
.spider-manage__error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  background: color-mix(in srgb, #ef4444 8%, transparent);
  border: 1px solid color-mix(in srgb, #ef4444 15%, transparent);
  color: #dc2626;
  font-size: 13px;
}

// ── Skeleton ────────────────────────────────
.skeleton-card {
  position: relative;
  overflow: hidden;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-alt);
}

.skeleton-card__shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, var(--lay-shimmer, rgba(255,255,255,0.06)), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}

.skeleton-box {
  background: var(--lay-skeleton-bg, color-mix(in srgb, var(--lay-border) 60%, transparent));
  border-radius: 6px;
}

// ── Cards Grid ──────────────────────────────
.spider-manage__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
}

// ── Card ────────────────────────────────────
.spider-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: 12px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  animation: spider-card-in 0.4s ease both;
  animation-delay: calc(var(--i) * 0.05s);

  &:hover {
    border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
    box-shadow: 0 4px 20px color-mix(in srgb, #000 6%, transparent);
  }

  &:hover .spider-card__actions {
    opacity: 1;
  }
}

@keyframes spider-card-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

// ── Card Top ────────────────────────────────
.spider-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.spider-card__identity {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.spider-card__avatar {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}

.spider-card__info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.spider-card__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--lay-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.spider-card__code {
  font-size: 12px;
  color: var(--lay-text-placeholder);
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
}

// ── Status Pills ────────────────────────────
.spider-card__status {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.spider-card__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  background: var(--lay-surface-alt);
  color: var(--lay-text-secondary);
  border: 1px solid var(--lay-border);
}

.spider-card__pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}

.pill--on {
  background: color-mix(in srgb, #22c55e 10%, transparent);
  border-color: color-mix(in srgb, #22c55e 20%, transparent);
  color: #16a34a;
  .spider-card__pill-dot { background: #22c55e; }
}

.pill--off {
  background: color-mix(in srgb, #94a3b8 10%, transparent);
  border-color: color-mix(in srgb, #94a3b8 20%, transparent);
  color: #64748b;
  .spider-card__pill-dot { background: #94a3b8; }
}

.pill--exec-running {
  background: color-mix(in srgb, #f59e0b 10%, transparent);
  border-color: color-mix(in srgb, #f59e0b 20%, transparent);
  color: #d97706;
  .spider-card__pill-dot { background: #f59e0b; }
}

.pill--exec-success {
  background: color-mix(in srgb, #22c55e 10%, transparent);
  border-color: color-mix(in srgb, #22c55e 20%, transparent);
  color: #16a34a;
  .spider-card__pill-dot { background: #22c55e; }
}

.pill--exec-failed {
  background: color-mix(in srgb, #ef4444 10%, transparent);
  border-color: color-mix(in srgb, #ef4444 20%, transparent);
  color: #dc2626;
  .spider-card__pill-dot { background: #ef4444; }
}

.pill--exec-waiting {
  background: color-mix(in srgb, #94a3b8 10%, transparent);
  border-color: color-mix(in srgb, #94a3b8 20%, transparent);
  color: #64748b;
  .spider-card__pill-dot { background: #94a3b8; }
}

.pill--exec-unknown {
  display: none;
}

// ── Card Body ───────────────────────────────
.spider-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spider-card__fields {
  display: grid;
  gap: 6px;
}

.spider-card__field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  min-width: 0;
}

.spider-card__field-header {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--lay-text-placeholder);
  flex-shrink: 0;
  font-size: 12px;
}

.spider-card__field-value {
  color: var(--lay-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--url {
    color: var(--lay-accent);
    font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
    font-size: 11px;
  }
}

// ── Tags ────────────────────────────────────
.spider-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.spider-card__tag {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: var(--lay-surface-alt);
  color: var(--lay-text-secondary);
  border: 1px solid var(--lay-border);
}

.tag--ai {
  background: color-mix(in srgb, #8b5cf6 8%, transparent);
  border-color: color-mix(in srgb, #8b5cf6 15%, transparent);
  color: #7c3aed;
}

.tag--spi {
  background: color-mix(in srgb, #06b6d4 8%, transparent);
  border-color: color-mix(in srgb, #06b6d4 15%, transparent);
  color: #0891b2;
}

.tag--code {
  background: color-mix(in srgb, #f59e0b 8%, transparent);
  border-color: color-mix(in srgb, #f59e0b 15%, transparent);
  color: #d97706;
}

.tag--neutral {
  // default style
}

// ── Card Footer ─────────────────────────────
.spider-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--lay-border);
}

.spider-card__meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.spider-card__meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--lay-text-placeholder);
}

// ── Action Buttons ──────────────────────────
.spider-card__actions {
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.spider-card__action-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--lay-text-placeholder);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--lay-surface-alt);
    color: var(--lay-text-secondary);
  }
}

.action-btn--danger:hover {
  background: color-mix(in srgb, #ef4444 10%, transparent);
  color: #dc2626;
}

.action-btn--prime:hover {
  background: color-mix(in srgb, #22c55e 10%, transparent);
  color: #16a34a;
}

.action-btn--warn:hover {
  background: color-mix(in srgb, #f59e0b 10%, transparent);
  color: #d97706;
}

// ── Empty ───────────────────────────────────
.spider-manage__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: var(--lay-text-placeholder);
  font-size: 14px;
}

// ── Dialog ──────────────────────────────────
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, #000 40%, transparent);
}

.dialog {
  width: min(520px, 100%);
  padding: 24px;
  border-radius: 14px;
  border: 1px solid var(--lay-border);
  background: var(--lay-bg);
  box-shadow: 0 20px 60px color-mix(in srgb, #000 20%, transparent);
}

.dialog__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.dialog__title-group {
  display: grid;
  gap: 4px;
}

.dialog__title {
  font-size: 16px;
  font-weight: 700;
  color: var(--lay-text-primary);
}

.dialog__desc {
  font-size: 12px;
  color: var(--lay-text-placeholder);
}

.dialog__close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--lay-border);
  border-radius: 8px;
  background: transparent;
  color: var(--lay-text-placeholder);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: var(--lay-text-regular);
    border-color: var(--lay-border-light);
  }
}

.dialog__body {
  padding: 20px 0;
}

.dialog__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.fld {
  display: grid;
  gap: 5px;
}

.fld__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--lay-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.fld input, .fld select {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--lay-border);
  border-radius: 8px;
  background: var(--lay-surface-bg);
  color: var(--lay-text-regular);
  font-size: 13px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: color-mix(in srgb, var(--lay-accent) 30%, transparent);
  }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &::placeholder { color: var(--lay-text-placeholder); }
}

.fld select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.dialog__switches {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 18px;
}

.sw {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-alt);
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover { border-color: var(--lay-border-light); }

  .sw__info {
    display: grid;
    gap: 2px;
    strong { font-size: 12px; color: var(--lay-text-primary); }
    small { font-size: 10px; color: var(--lay-text-placeholder); }
  }
}

.sw__toggle {
  position: relative;
  flex-shrink: 0;
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--lay-border) 80%, transparent);
  transition: background 0.25s;

  &.on {
    background: color-mix(in srgb, var(--lay-accent) 30%, transparent);
    .sw__knob {
      transform: translateX(14px);
      background: var(--lay-accent);
    }
  }
}

.sw__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--lay-text-placeholder);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

// ── General Buttons ────────────────────────
.dbtn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;

  &--ghost {
    background: var(--lay-surface-bg);
    color: var(--lay-text-secondary);
    border-color: var(--lay-border);
    &:hover {
      border-color: var(--lay-border-light);
      color: var(--lay-text-regular);
    }
  }

  &--prime {
    background: var(--lay-accent);
    color: #fff;
    border: none;
    &:hover {
      opacity: 0.9;
      box-shadow: 0 2px 12px color-mix(in srgb, var(--lay-accent) 20%, transparent);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
  }
}

.dbtn__spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

// ── Execution Record Dialog ─────────────────
.record-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: color-mix(in srgb, #000 40%, transparent);
}

.record-modal {
  width: min(1100px, 100%);
  max-height: min(85vh, 900px);
}

.record-modal__surface {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  border: 1px solid var(--lay-border);
  border-radius: 14px;
  background: var(--lay-bg);
  box-shadow: 0 20px 60px color-mix(in srgb, #000 20%, transparent);
  overflow: hidden;
}

.record-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--lay-border);
}

.record-modal__title-group {
  display: grid;
  gap: 3px;

  strong {
    font-size: 16px;
    color: var(--lay-text-primary);
  }

  span {
    font-size: 12px;
    color: var(--lay-text-placeholder);
  }
}

.record-modal__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.record-play-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-bg);
  color: var(--lay-text-primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
    color: var(--lay-accent);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.record-close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--lay-text-secondary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--lay-border-light);
    color: var(--lay-text-regular);
  }
}

.record-modal__body {
  min-height: 0;
  flex: 1;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
}

.record-list {
  min-height: 0;
  padding: 12px;
  display: grid;
  align-content: start;
  gap: 6px;
  border-right: 1px solid var(--lay-border);
  overflow: auto;
}

.record-list__item {
  display: grid;
  gap: 3px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  transition: all 0.15s;

  &:hover {
    border-color: var(--lay-border);
    background: var(--lay-surface-alt);
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--lay-accent) 25%, transparent);
    background: color-mix(in srgb, var(--lay-accent) 8%, transparent);
  }
}

.record-list__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
}

.record-list__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.exec-status--running .record-list__dot { background: #f59e0b; animation: pulse-dot 1.5s ease-in-out infinite; }
.exec-status--running { color: #f59e0b; }
.exec-status--success .record-list__dot { background: #22c55e; }
.exec-status--success { color: #22c55e; }
.exec-status--failed .record-list__dot { background: #ef4444; }
.exec-status--failed { color: #ef4444; }
.exec-status--waiting .record-list__dot { background: #94a3b8; }
.exec-status--waiting { color: #94a3b8; }
.exec-status--unknown .record-list__dot { background: #64748b; }
.exec-status--unknown { color: #64748b; }

.record-list__id {
  font-size: 11px;
  color: var(--lay-text-secondary);
  font-family: "SF Mono", "Cascadia Code", Consolas, monospace;
}

.record-list__time {
  font-size: 10px;
  color: var(--lay-text-placeholder);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes spider-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// ── Record Player ───────────────────────────
.record-player {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
}

.record-player__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--lay-border);
  border-radius: 10px;
  background: var(--lay-surface-alt);

  > div {
    min-width: 0;
    display: grid;
    gap: 3px;
  }

  strong, span {
    font-size: 12px;
    color: var(--lay-text-primary);
  }

  span {
    color: var(--lay-text-placeholder);
  }
}

.record-player__spotlight {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--lay-accent) 15%, var(--lay-border));
  background: color-mix(in srgb, var(--lay-accent) 5%, transparent);

  > span {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--lay-accent);
  }

  p {
    margin: 0;
    color: var(--lay-text-secondary);
    line-height: 1.5;
  }

  small {
    font-size: 11px;
    color: var(--lay-text-placeholder);
  }
}

.record-player__timeline {
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 8px;
}

.record-player__event {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-alt);
  transition: all 0.15s;

  &.is-played {
    border-color: color-mix(in srgb, var(--lay-accent) 12%, transparent);
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--lay-accent) 25%, transparent);
    background: color-mix(in srgb, var(--lay-accent) 6%, transparent);
  }
}

.record-player__event-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 5px;
  background: color-mix(in srgb, var(--lay-accent) 60%, white);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--lay-accent) 10%, transparent);
}

.record-player__event-content {
  display: grid;
  gap: 3px;

  strong {
    font-size: 12px;
    color: var(--lay-text-primary);
  }

  span {
    font-size: 12px;
    color: var(--lay-text-placeholder);
  }

  small {
    font-size: 11px;
    color: var(--lay-text-placeholder);
  }

  p {
    margin: 0;
    color: var(--lay-text-secondary);
    line-height: 1.5;
  }
}

// ── Pool ────────────────────────────────────
.pool-surface {
  display: flex;
  flex-direction: column;
}

.pool-type-switch {
  display: flex;
  gap: 8px;
  padding: 0 20px 14px;

  .record-play-btn.is-active {
    border-color: color-mix(in srgb, var(--lay-accent) 25%, transparent);
    background: color-mix(in srgb, var(--lay-accent) 8%, transparent);
  }
}

.pool-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pool-form-grid__full {
  grid-column: 1 / -1;
}

.record-player__summary-actions {
  display: flex;
  gap: 8px;
}

.pool-payload-textarea {
  width: 100%;
  min-height: 140px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-bg);
  color: var(--lay-text-primary);
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
  font-size: 12px;
  outline: none;
  resize: vertical;

  &:focus {
    border-color: color-mix(in srgb, var(--lay-accent) 25%, transparent);
  }
}

// ── Parse Result ────────────────────────────
.parse-result-modal .record-modal__surface {
  width: min(1150px, 92vw);
  height: 78vh;
  max-height: 78vh;
  display: flex;
  flex-direction: column;
}

.pr-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.pr-list {
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid var(--lay-border);
}

.pr-detail {
  overflow-y: auto;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &--empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--lay-text-placeholder);
    font-size: 13px;
    gap: 8px;
  }
}

.pr-card {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 5px;
  background: var(--lay-surface-alt);

  &:hover {
    border-color: color-mix(in srgb, var(--lay-accent) 15%, transparent);
  }

  &.is-selected {
    border-color: color-mix(in srgb, var(--lay-accent) 30%, transparent);
    background: color-mix(in srgb, var(--lay-accent) 6%, transparent);
  }
}

.pr-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pr-card__idx {
  font-size: 11px;
  font-weight: 700;
  color: var(--lay-text-placeholder);
}

.pr-card__time {
  font-size: 11px;
  color: var(--lay-text-placeholder);
}

.pr-card__url {
  font-size: 12px;
  color: var(--lay-accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.pr-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pr-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  background: color-mix(in srgb, var(--lay-accent) 8%, transparent);
  color: var(--lay-text-secondary);
  max-width: 100%;
  overflow: hidden;
}

.pr-tag__key {
  font-weight: 600;
  color: var(--lay-text-regular);
  flex-shrink: 0;
}

.pr-tag__val {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pr-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--lay-border);
  background: var(--lay-surface-bg);
  color: var(--lay-text-placeholder);

  input {
    width: 150px;
    border: none;
    background: transparent;
    color: var(--lay-text-regular);
    font-size: 12px;
    outline: none;
    &::placeholder { color: var(--lay-text-placeholder); }
  }
}

.pr-count {
  font-size: 12px;
  color: var(--lay-text-placeholder);
  white-space: nowrap;
}

.pr-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: var(--lay-text-placeholder);
  font-size: 13px;
}

.pr-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  font-size: 12px;
  color: var(--lay-text-secondary);

  button {
    width: 26px;
    height: 26px;
    border: 1px solid var(--lay-border);
    border-radius: 5px;
    background: transparent;
    color: var(--lay-text-primary);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s;

    &:hover:not(:disabled) {
      border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
      color: var(--lay-accent);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }
}

.pr-detail__section {
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 11px;
    font-weight: 600;
    color: var(--lay-text-placeholder);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &--grow {
    flex: 1;
    min-height: 0;
  }
}

.pr-detail__url {
  font-size: 12px;
  color: var(--lay-accent);
  word-break: break-all;
  line-height: 1.5;
}

.pr-detail__time {
  font-size: 13px;
  color: var(--lay-text-regular);
}

.pr-detail__json {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, #000 4%, var(--lay-bg));
  border: 1px solid var(--lay-border);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lay-text-primary);
  overflow: auto;
  max-height: 100%;
  white-space: pre;

  code { font-family: inherit; }
}

// ── Responsive ──────────────────────────────
@media (max-width: 980px) {
  .record-modal__body {
    grid-template-columns: 1fr;
  }

  .record-list {
    border-right: none;
    border-bottom: 1px solid var(--lay-border);
  }

  .pool-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .spider-manage__content { padding: 16px; }
  .spider-manage__header { flex-direction: column; align-items: flex-start; }
  .spider-manage__actions { width: 100%; flex-wrap: wrap; }
  .spider-manage__search input { width: 100px; }
  .spider-manage__grid { grid-template-columns: 1fr; }
  .dialog__grid, .dialog__switches { grid-template-columns: 1fr; }
}
</style>
