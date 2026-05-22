<template>
  <section class="spider-manage">
    <!-- Background -->
    <div class="spider-manage__bg">
      <div class="spider-manage__grid" />
      <div class="spider-manage__scanline" />
      <div class="spider-manage__particles" />
      <div class="spider-manage__glow spider-manage__glow--cyan" />
      <div class="spider-manage__glow spider-manage__glow--blue" />
    </div>

    <div class="spider-manage__content">
      <!-- Header -->
      <header class="spider-manage__header">
        <div class="spider-manage__header-left">
          <button type="button" class="spider-manage__back-btn" title="返回总览" @click="toggleManage">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          <div class="spider-manage__title-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            SPIDER ENGINE
          </div>
          <h1 class="spider-manage__title">爬虫管理</h1>
          <p class="spider-manage__subtitle">
            共 <strong class="spider-manage__count">{{ spiders.length }}</strong> 个爬虫定义
          </p>
        </div>
        <div class="spider-manage__actions">
          <div class="spider-manage__search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model="searchQuery" type="text" placeholder="搜索名称、编码、站点..." />
          </div>
          <button type="button" class="spider-manage__refresh-btn" :class="{ 'is-spinning': loading }" @click="loadDefinitions">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </button>
          <button type="button" class="spider-manage__refresh-btn" @click="openPoolDialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
          </button>
          <button type="button" class="spider-manage__create-btn" title="新增爬虫" @click="openCreateDialog">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
          <div class="skeleton-card__top"><div class="skeleton-box" style="width:40px;height:40px;border-radius:12px" /><div style="flex:1;display:grid;gap:6px"><div class="skeleton-box" style="width:60%;height:14px" /><div class="skeleton-box" style="width:40%;height:10px" /></div></div>
          <div style="display:grid;gap:10px;margin-top:14px"><div class="skeleton-box" style="width:100%;height:10px" /><div class="skeleton-box" style="width:80%;height:10px" /></div>
          <div style="display:flex;gap:6px;margin-top:12px"><div v-for="k in 4" :key="k" class="skeleton-box" style="width:48px;height:20px;border-radius:6px" /></div>
        </div>
      </div>

      <!-- Cards Grid -->
      <div v-else-if="filteredSpiders.length" class="spider-manage__grid">
        <article v-for="(item, idx) in filteredSpiders" :key="item.spiderCode" class="spider-card" :style="{ '--i': idx }" @click="navigateToOrchestration(item)">
          <div class="spider-card__glow" />
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
          <div class="spider-card__actions" @click.stop>
            <button type="button" class="card-act" title="编辑" @click="openEditDialog(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              <span class="card-act__text">编辑</span>
            </button>
            <button type="button" class="card-act" :title="isEnabled(item.spiderStatus) ? '禁用' : '启用'" @click="toggleStatus(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle :cx="isEnabled(item.spiderStatus) ? '17' : '7'" cy="12" r="3"/></svg>
              <span class="card-act__text">{{ isEnabled(item.spiderStatus) ? '禁用' : '启用' }}</span>
            </button>
            <button type="button" class="card-act" :class="item.spiderLatestExecutionStatus === 'RUNNING' ? 'card-act--warn' : 'card-act--prime'" :title="item.spiderLatestExecutionStatus === 'RUNNING' ? '已有运行中的实例，点击查看' : '运行'" @click.stop="runSpider(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span class="card-act__text">{{ item.spiderLatestExecutionStatus === 'RUNNING' ? '查看运行' : item.spiderLatestExecutionStatus === 'FAILED' || item.spiderLatestExecutionStatus === 'STOPPED' ? '重新运行' : '运行' }}</span>
            </button>
            <button type="button" class="card-act" title="监控" @click.stop="openMonitor(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16h16"/><polyline points="4 20 10 14 14 18 20 8"/></svg>
              <span class="card-act__text">监控</span>
            </button>
            <button type="button" class="card-act" title="采集数据" @click.stop="openParseResultDialog(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span class="card-act__text">采集数据</span>
            </button>
            <button type="button" class="card-act card-act--prime" title="编排" @click.stop="navigateToOrchestration(item)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              <span class="card-act__text">编排</span>
            </button>
            <button type="button" class="card-act card-act--danger" title="删除" @click="removeDefinition(item.spiderCode)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              <span class="card-act__text">删除</span>
            </button>
          </div>
          <div class="spider-card__fields">
            <div class="spider-card__field">
              <div class="spider-card__field-header">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                主体网站
              </div>
              <span class="spider-card__field-value">{{ item.spiderSiteHost || '-' }}</span>
            </div>
            <div class="spider-card__field">
              <div class="spider-card__field-header">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
                主入口
              </div>
              <span class="spider-card__field-value spider-card__field-value--url" :title="item.spiderEntryUrl">{{ item.spiderEntryUrl }}</span>
            </div>
          </div>
          <div class="spider-card__extra">
            <div class="spider-card__extra-item">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
              <span>{{ dedupLabel(item.spiderDedupStrategy) }}</span>
            </div>
            <div class="spider-card__extra-item">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              <span>{{ storageLabel(item.spiderUrlStorageType) }}</span>
            </div>
            <div class="spider-card__extra-item">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v16h16"/><polyline points="4 20 10 14 14 18 20 8"/></svg>
              {{ item.spiderExecutorRounds || 1 }} 轮次
            </div>
          </div>
          <div class="spider-card__tags">
            <span class="spider-card__tag" :class="'tag--' + executorType(item)">{{ item.spiderExecutorType }}</span>
            <span class="spider-card__tag" :class="item.spiderAiEnabled ? 'tag--yes' : 'tag--no'">AI 接入 {{ item.spiderAiEnabled ? '开' : '关' }}</span>
            <span class="spider-card__tag" :class="item.spiderCollectDeepUrl ? 'tag--yes' : 'tag--no'">深度采集 {{ item.spiderCollectDeepUrl ? '开' : '关' }}</span>
            <span class="spider-card__tag" :class="item.spiderNotifyOnFailure ? 'tag--yes' : 'tag--no'">失败通知 {{ item.spiderNotifyOnFailure ? '开' : '关' }}</span>
          </div>
        </article>
      </div>

      <!-- Empty -->
      <div v-else class="spider-manage__empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <span>{{ searchQuery ? '没有匹配的爬虫定义' : '暂无爬虫定义' }}</span>
      </div>

      <!-- Dialog -->
      <Teleport to="body">
        <div v-if="dialogVisible" class="dialog-mask" @click.self="closeDialog">
          <section class="dialog">
            <div class="dialog__border" />
            <div class="dialog__inner">
              <header class="dialog__head">
                <div class="dialog__title-group">
                  <div class="dialog__badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    {{ dialogMode === 'create' ? 'CREATE' : 'EDIT' }}
                  </div>
                  <strong class="dialog__title">{{ dialogMode === 'create' ? '新增爬虫定义' : '编辑爬虫定义' }}</strong>
                  <span class="dialog__desc">{{ dialogMode === 'create' ? '配置基础参数和采集策略' : '修改 ' + editingCode }}</span>
                </div>
                <button type="button" class="dialog__close" @click="closeDialog">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </header>
              <div class="dialog__body">
                <div class="dialog__grid">
                  <label class="fld"><span class="fld__label">编码</span><input v-model.trim="form.spiderCode" :disabled="dialogMode === 'edit'" type="text" placeholder="如 my-spider" /></label>
                  <label class="fld"><span class="fld__label">名称</span><input v-model.trim="form.spiderName" type="text" placeholder="爬虫名称" /></label>
                  <label class="fld"><span class="fld__label">主体网站</span><input v-model.trim="form.spiderSiteHost" type="text" placeholder="example.com" /></label>
                  <label class="fld"><span class="fld__label">主入口 URL</span><input v-model.trim="form.spiderEntryUrl" type="text" placeholder="https://..." /></label>
                  <label class="fld"><span class="fld__label">执行器</span>
                    <select v-model="form.spiderExecutorType">
                      <option value="ONCE">ONCE · 执行一次</option>
                      <option value="N_TIMES">N_TIMES · 指定轮数</option>
                      <option value="CRON">CRON · 定时任务</option>
                    </select>
                  </label>
                  <label class="fld"><span class="fld__label">采集轮次</span><input v-model.number="form.spiderExecutorRounds" type="number" min="1" /></label>
                  <label class="fld"><span class="fld__label">去重策略</span>
                    <select v-model="form.spiderDedupStrategy">
                      <option value="URL_FINGERPRINT">URL 指纹</option>
                      <option value="NORMALIZED_URL">规范化 URL</option>
                      <option value="CONTENT_FINGERPRINT">内容指纹</option>
                      <option value="CUSTOM">自定义</option>
                    </select>
                  </label>
                  <label class="fld"><span class="fld__label">URL 存储</span>
                    <select v-model="form.spiderUrlStorageType">
                      <option value="DATABASE">DATABASE</option>
                      <option value="REDIS">REDIS</option>
                      <option value="SPI">SPI</option>
                    </select>
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
            </div>
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
  const records = await listSpiderExecutionRecords(spiderCode, 12);
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
// ── Background ──────────────────────────────
.spider-manage__bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.spider-manage__grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
  background-size: 44px 44px;
}
.spider-manage__scanline {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59,130,246,0.006) 2px, rgba(59,130,246,0.006) 4px);
}
.spider-manage__particles {
  position: absolute; inset: 0;
  background-image:
    radial-gradient(1px 1px at 15% 25%, rgba(6,182,212,0.35), transparent),
    radial-gradient(1px 1px at 40% 55%, rgba(59,130,246,0.3), transparent),
    radial-gradient(1.5px 1.5px at 60% 15%, rgba(20,184,166,0.35), transparent),
    radial-gradient(1px 1px at 80% 45%, rgba(139,92,246,0.25), transparent),
    radial-gradient(1.5px 1.5px at 25% 80%, rgba(6,182,212,0.3), transparent),
    radial-gradient(1px 1px at 70% 85%, rgba(59,130,246,0.25), transparent);
  background-size: 100% 100%;
}
.spider-manage__glow {
  position: absolute; border-radius: 50%; filter: blur(120px); opacity: 0.4;
  &--cyan { top: -15%; right: -8%; width: 550px; height: 550px; background: radial-gradient(circle, rgba(6,182,212,0.2), transparent 70%); }
  &--blue { bottom: -12%; left: -5%; width: 500px; height: 500px; background: radial-gradient(circle, rgba(59,130,246,0.18), transparent 70%); }
}
// ── Content ─────────────────────────────────
.spider-manage__content { position: relative; z-index: 1; padding: 20px 24px 32px; display: flex; flex-direction: column; gap: 16px; }
// ── Header ──────────────────────────────────
.spider-manage__header { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
.spider-manage__header-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.spider-manage__back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--lay-border-light);
  border-radius: 8px;
  background: transparent;
  color: var(--lay-text-secondary);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;

  &:hover {
    border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
    color: var(--lay-accent);
    background: color-mix(in srgb, var(--lay-accent) 8%, transparent);
  }
}
.spider-manage__title-badge {
  display: inline-flex; align-items: center; gap: 5px; height: 22px; padding: 0 10px;
  border-radius: 999px; background: color-mix(in srgb, var(--lay-accent) 10%, transparent); border: 1px solid color-mix(in srgb, var(--lay-accent) 15%, transparent);
  color: color-mix(in srgb, var(--lay-accent) 80%, white); font-size: 9px; font-weight: 700; letter-spacing: 0.12em;
  svg { width: 11px; height: 11px; }
}
.spider-manage__title { margin: 0; font-size: 26px; font-weight: 800; color: var(--lay-text-primary); letter-spacing: -0.03em; }
.spider-manage__subtitle { margin: 0; font-size: 13px; color: var(--lay-text-placeholder); display: flex; align-items: center; gap: 4px; }
.spider-manage__count { color: var(--lay-accent); font-weight: 700; }
// Actions
.spider-manage__actions { display: flex; align-items: center; gap: 10px; }
.spider-manage__search {
  display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 12px;
  border-radius: 10px; border: 1px solid var(--lay-border-light);
  background: var(--lay-surface-bg); color: var(--lay-text-placeholder);
  transition: all 0.25s;
  &:focus-within { border-color: color-mix(in srgb, var(--lay-accent) 30%, transparent); box-shadow: 0 0 20px color-mix(in srgb, var(--lay-accent) 6%, transparent); }
  input { width: 170px; border: none; background: transparent; color: var(--lay-text-regular); font-size: 13px; outline: none; &::placeholder { color: var(--lay-text-placeholder); } }
}
.spider-manage__refresh-btn {
  display: grid; place-items: center; width: 36px; height: 36px;
  border: 1px solid var(--lay-border-light); border-radius: 10px;
  background: var(--lay-surface-bg); color: var(--lay-text-secondary); cursor: pointer; transition: all 0.2s;
  &:hover { border-color: color-mix(in srgb, var(--lay-accent) 30%, transparent); color: var(--lay-text-regular); }
  &.is-spinning svg { animation: spin 1s linear infinite; }
}
.spider-manage__create-btn {
  display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 16px;
  border: none; border-radius: 10px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.25s;
  &:hover { box-shadow: 0 4px 24px rgba(6,182,212,0.3); transform: translateY(-1px); }
  &:active { transform: translateY(0); }
}
// Error
.spider-manage__error {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  border-radius: 10px; background: var(--lay-error-bg); border: 1px solid var(--lay-error-border); color: var(--lay-error); font-size: 12px;
}
// ── Skeleton ────────────────────────────────
.skeleton-card {
  position: relative; overflow: hidden; padding: 20px; border-radius: 16px;
  border: 1px solid var(--lay-border); background: var(--lay-surface-alt);
}
.skeleton-card__shimmer {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, var(--lay-shimmer), transparent);
  background-size: 200% 100%;
  animation: shimmer 2s infinite;
}
.skeleton-box { background: var(--lay-skeleton-bg); border-radius: 6px; }
// ── Cards Grid ──────────────────────────────
.spider-manage__grid {
  display: flex;
  flex-flow: row wrap;
  gap: 14px;
  position: static !important;
  align-content: flex-start;
  > * {
    flex: 1 1 180px;
    min-width: 180px;
    max-width: 240px;
  }
}
// ── Single Card ─────────────────────────────
.spider-card {
  position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 14px;
  padding: 20px; border-radius: 18px;
  border: 1px solid rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  box-shadow:
    0 4px 16px rgba(0,0,0,0.04),
    0 1px 4px rgba(0,0,0,0.03),
    inset 0 1px 0 rgba(255,255,255,0.7);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  animation: spider-card-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i) * 0.06s);

  &:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
    box-shadow:
      0 20px 48px rgba(0,0,0,0.08),
      0 6px 16px rgba(0,0,0,0.04),
      0 0 60px color-mix(in srgb, var(--lay-accent) 6%, transparent),
      inset 0 1px 0 rgba(255,255,255,0.7);
  }
}

html.dark .spider-card {
  background: rgba(18, 24, 40, 0.82);
  backdrop-filter: blur(24px);
  border-color: rgba(148, 163, 184, 0.1);
  box-shadow:
    0 4px 16px rgba(0,0,0,0.2),
    inset 0 1px 0 rgba(255,255,255,0.04);

  &:hover {
    box-shadow:
      0 20px 48px rgba(0,0,0,0.3),
      0 0 60px color-mix(in srgb, var(--lay-accent) 6%, transparent),
      inset 0 1px 0 rgba(255,255,255,0.04);
  }
}

@keyframes spider-card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.spider-card__glow {
  position: absolute; top: -30%; right: -15%; width: 140px; height: 140px;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--lay-accent) 12%, transparent), transparent 70%);
  pointer-events: none; transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1); opacity: 0.6;
  .spider-card:hover & { opacity: 1; width: 200px; height: 200px; transform: translate(-10px, -10px); }
}
// Card top
.spider-card__top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.spider-card__identity { display: flex; align-items: center; gap: 12px; min-width: 0; flex: 1; }
.spider-card__avatar {
  flex-shrink: 0; width: 40px; height: 40px;
  display: grid; place-items: center; border-radius: 14px;
  font-size: 16px; font-weight: 800; color: #fff;
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transition: transform 0.3s ease;
  .spider-card:hover & { transform: scale(1.08); }
}
.spider-card__avatar::after {
  content: '';
  position: absolute; inset: -4px; border-radius: 18px;
  border: 1.5px solid color-mix(in srgb, var(--lay-accent) 15%, transparent);
  opacity: 0; transition: opacity 0.3s;
  .spider-card:hover & { opacity: 1; }
}
.spider-card__info { display: grid; gap: 3px; min-width: 0; }
.spider-card__name { font-size: 15px; font-weight: 700; color: var(--lay-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.01em; }
.spider-card__code { font-size: 11px; color: var(--lay-text-placeholder); font-family: 'SF Mono', 'Fira Code', monospace; }
// Status pill
.spider-card__status { flex-shrink: 0; }
.spider-card__pill {
  display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 10px;
  border-radius: 999px; font-size: 11px; font-weight: 600;
  backdrop-filter: blur(8px);
  &.pill--on { background: color-mix(in srgb, var(--lay-success) 12%, transparent); color: var(--lay-success); .spider-card__pill-dot { background: var(--lay-success); box-shadow: 0 0 8px color-mix(in srgb, var(--lay-success) 50%, transparent); } }
  &.pill--off { background: rgba(71,85,105,0.1); color: #64748b; .spider-card__pill-dot { background: #64748b; } }
  &.pill--exec-running { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #d97706; .spider-card__pill-dot { background: #f59e0b; box-shadow: 0 0 8px color-mix(in srgb, #f59e0b 50%, transparent); animation: spider-pulse-dot 1.5s ease-in-out infinite; } }
  &.pill--exec-wait_manual { background: color-mix(in srgb, #f59e0b 12%, transparent); color: #d97706; .spider-card__pill-dot { background: #f59e0b; } }
  &.pill--exec-success { background: color-mix(in srgb, #22c55e 12%, transparent); color: #16a34a; .spider-card__pill-dot { background: #22c55e; } }
  &.pill--exec-failed { background: color-mix(in srgb, #ef4444 12%, transparent); color: #dc2626; .spider-card__pill-dot { background: #ef4444; } }
  &.pill--exec-waiting { background: rgba(71,85,105,0.1); color: #64748b; .spider-card__pill-dot { background: #64748b; } }
  &.pill--exec-stopped { background: rgba(71,85,105,0.1); color: #64748b; .spider-card__pill-dot { background: #64748b; } }
}
.spider-card__pill-dot { width: 6px; height: 6px; border-radius: 50%; }
// Fields
.spider-card__fields { display: grid; gap: 8px; }
.spider-card__field { display: grid; gap: 3px; }
.spider-card__field-header {
  display: flex; align-items: center; gap: 4px; font-size: 9px; color: var(--lay-text-placeholder);
  text-transform: uppercase; letter-spacing: 0.06em; svg { opacity: 0.4; }
}
.spider-card__field-value { font-size: 13px; color: var(--lay-text-muted); &--url { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; font-family: monospace; color: var(--lay-text-secondary); } }
// Extra info row
.spider-card__extra {
  display: flex; flex-wrap: wrap; gap: 12px; padding: 10px 0 6px;
  border-top: 1px solid color-mix(in srgb, var(--lay-border) 60%, transparent);
}
.spider-card__extra-item {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; color: var(--lay-text-secondary); font-weight: 500;
  svg { opacity: 0.45; flex-shrink: 0; stroke-width: 2; }
}
// Tags
.spider-card__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.spider-card__tag {
  display: inline-flex; height: 22px; align-items: center; padding: 0 8px;
  border-radius: 6px; font-size: 10px; font-weight: 600; letter-spacing: 0.01em;
  backdrop-filter: blur(4px);
  &.tag--once { background: color-mix(in srgb, var(--lay-tag-once) 10%, transparent); color: var(--lay-tag-once); }
  &.tag--n_times { background: color-mix(in srgb, var(--lay-tag-ntimes) 10%, transparent); color: var(--lay-tag-ntimes); }
  &.tag--cron { background: color-mix(in srgb, var(--lay-tag-cron) 10%, transparent); color: var(--lay-tag-cron); }
  &.tag--neutral { background: rgba(148,163,184,0.08); color: var(--lay-text-secondary); }
  &.tag--yes { background: color-mix(in srgb, var(--lay-tag-enabled) 10%, transparent); color: var(--lay-tag-enabled); }
  &.tag--no { background: rgba(148,163,184,0.06); color: var(--lay-text-placeholder); }
}
// Hover actions (floating overlay)
.spider-card__actions {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  padding: 12px 20px 14px;
  border-radius: 0 0 18px 18px;
  background: linear-gradient(to top, rgba(255,255,255,0.92) 40%, rgba(255,255,255,0.6) 75%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  opacity: 0;
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  .spider-card:hover & { opacity: 1; pointer-events: auto; }
}

html.dark .spider-card__actions {
  background: linear-gradient(to top, rgba(18, 24, 40, 0.92) 40%, rgba(18, 24, 40, 0.6) 75%, transparent);
}
.card-act {
  display: inline-flex; align-items: center; gap: 4px; height: 28px; padding: 0 10px;
  border: 1px solid color-mix(in srgb, var(--lay-border) 80%, transparent); border-radius: 8px;
  background: rgba(255,255,255,0.5); color: var(--lay-text-secondary); font-size: 11px;
  cursor: pointer; text-decoration: none; transition: all 0.2s;
  backdrop-filter: blur(4px);
  &:hover { border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent); color: var(--lay-text-regular); background: rgba(255,255,255,0.7); }
  &--prime { background: color-mix(in srgb, var(--lay-accent) 10%, rgba(255,255,255,0.5)); color: var(--lay-accent); border-color: color-mix(in srgb, var(--lay-accent) 15%, transparent); &:hover { background: color-mix(in srgb, var(--lay-accent) 18%, rgba(255,255,255,0.6)); box-shadow: 0 0 20px color-mix(in srgb, var(--lay-accent) 10%, transparent); } }
  &--warn { background: color-mix(in srgb, #f59e0b 10%, rgba(255,255,255,0.5)); color: #d97706; border-color: color-mix(in srgb, #f59e0b 15%, transparent); &:hover { background: color-mix(in srgb, #f59e0b 18%, rgba(255,255,255,0.6)); } }
  &--danger:hover { border-color: color-mix(in srgb, var(--lay-error) 30%, transparent); color: var(--lay-error); background: color-mix(in srgb, var(--lay-error) 8%, transparent); }
}

html.dark .card-act {
  background: rgba(20, 25, 45, 0.5);
  &:hover { background: rgba(30, 36, 60, 0.7); }
  &--prime { background: color-mix(in srgb, var(--lay-accent) 10%, rgba(20, 25, 45, 0.5)); &:hover { background: color-mix(in srgb, var(--lay-accent) 18%, rgba(30, 36, 60, 0.6)); } }
}
.card-act__text { display: none; }
// Empty
.spider-manage__empty { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 60px; color: var(--lay-text-placeholder); font-size: 13px; }

// ════════════════════════════════════════════
// Dialog
// ════════════════════════════════════════════
.dialog-mask {
  position: fixed; inset: 0; display: grid; place-items: center; padding: 20px;
  background: var(--lay-mask-bg); backdrop-filter: blur(6px); z-index: 1000;
  animation: mask-in 0.2s ease;
}
.dialog {
  position: relative; width: min(960px, 100%); max-height: 90vh; overflow-y: auto;
  border-radius: 20px; overflow: hidden;
}
.dialog__border {
  position: absolute; inset: 0; border-radius: 20px;
  border: 1px solid var(--lay-border-light); pointer-events: none;
}
.dialog__inner {
  padding: 24px;
  background: var(--lay-overlay-bg);
  backdrop-filter: blur(24px);
  animation: dialog-in 0.3s ease;
}

.dialog__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.dialog__title-group { display: grid; gap: 4px; }
.dialog__badge {
  display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 8px;
  border-radius: 4px; background: color-mix(in srgb, var(--lay-accent) 12%, transparent); color: var(--lay-accent);
  font-size: 9px; font-weight: 700; letter-spacing: 0.08em; width: fit-content;
  svg { width: 10px; height: 10px; }
}
.dialog__title { font-size: 17px; font-weight: 700; color: var(--lay-text-primary); }
.dialog__desc { font-size: 12px; color: var(--lay-text-placeholder); }
.dialog__close {
  display: grid; place-items: center; width: 32px; height: 32px;
  border: 1px solid var(--lay-border); border-radius: 8px;
  background: transparent; color: var(--lay-text-placeholder); cursor: pointer; transition: all 0.2s;
  &:hover { color: var(--lay-text-regular); border-color: var(--lay-border-light); }
}
.dialog__body { padding: 20px 0; }
.dialog__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.fld { display: grid; gap: 5px; }
.fld__label { font-size: 10px; font-weight: 600; color: var(--lay-text-placeholder); text-transform: uppercase; letter-spacing: 0.05em; }
.fld input, .fld select {
  width: 100%; height: 38px; padding: 0 12px;
  border: 1px solid var(--lay-border); border-radius: 10px;
  background: var(--lay-surface-bg); color: var(--lay-text-regular); font-size: 13px; outline: none; transition: all 0.2s;
  &:focus { border-color: var(--lay-accent); box-shadow: 0 0 16px color-mix(in srgb, var(--lay-accent) 8%, transparent); }
  &:disabled { opacity: 0.35; cursor: not-allowed; }
  &::placeholder { color: var(--lay-text-placeholder); }
}
.fld select { cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
// Switches
.dialog__switches { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 18px; }
.sw {
  display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 12px 14px;
  border-radius: 12px; border: 1px solid var(--lay-border); background: var(--lay-surface-alt);
  cursor: pointer; transition: border-color 0.2s;
  &:hover { border-color: var(--lay-border-light); }
  .sw__info { display: grid; gap: 2px; strong { font-size: 12px; color: var(--lay-text-primary); } small { font-size: 10px; color: var(--lay-text-placeholder); } }
}
.sw__toggle {
  position: relative; flex-shrink: 0; width: 34px; height: 20px;
  border-radius: 999px; background: rgba(71,85,105,0.3); transition: background 0.25s;
  &.on { background: rgba(6,182,212,0.25); .sw__knob { transform: translateX(14px); background: #06b6d4; box-shadow: 0 0 8px rgba(6,182,212,0.25); } }
}
.sw__knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--lay-text-placeholder); transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
// Actions
.dialog__actions { display: flex; justify-content: flex-end; gap: 10px; }
.record-mask {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(2, 6, 23, 0.52);
  backdrop-filter: blur(18px);
}

.record-modal {
  width: min(1180px, 100%);
  max-height: min(88vh, 960px);
}

.record-modal__surface {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 560px;
  border: 1px solid color-mix(in srgb, var(--lay-accent) 12%, var(--lay-border));
  border-radius: 24px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 28%),
    color-mix(in srgb, var(--lay-surface-bg) 95%, transparent);
  box-shadow: 0 30px 80px rgba(15, 23, 42, 0.34);
  overflow: hidden;
}

.record-modal__head,
.record-player__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.record-modal__head {
  padding: 18px 22px;
  border-bottom: 1px solid var(--lay-border-light);
}

.record-modal__title-group {
  display: grid;
  gap: 4px;
}

.record-modal__title-group strong {
  font-size: 18px;
  color: var(--lay-text-primary);
}

.record-modal__title-group span,
.record-player__summary span,
.record-player__event-content span,
.record-player__event-content small,
.record-player__spotlight small {
  font-size: 12px;
  color: var(--lay-text-placeholder);
}

.record-modal__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.record-play-btn,
.record-close-btn,
.record-list__item {
  border: 1px solid var(--lay-border);
  background: color-mix(in srgb, var(--lay-bg) 90%, transparent);
}

.record-play-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 10px;
  color: var(--lay-text-primary);
  cursor: pointer;
}

.record-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--lay-text-secondary);
  cursor: pointer;
}

.record-modal__body {
  min-height: 0;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
}

.record-list {
  min-height: 0;
  padding: 18px;
  display: grid;
  align-content: start;
  gap: 10px;
  border-right: 1px solid var(--lay-border-light);
  overflow: auto;
}

.record-list__item {
  display: grid;
  gap: 3px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  text-align: left;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
}
.record-list__item:hover {
  border-color: color-mix(in srgb, var(--lay-border-light) 60%, transparent);
  background: color-mix(in srgb, var(--lay-surface-bg) 50%, transparent);
}

.record-list__item.is-active {
  border-color: color-mix(in srgb, var(--lay-accent) 32%, transparent);
  background: color-mix(in srgb, var(--lay-accent) 10%, transparent);
}

.record-list__status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
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

.record-player__summary strong,
.record-player__event-content strong,
.record-player__spotlight strong {
  color: var(--lay-text-primary);
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes spider-pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.3); }
}

.record-player {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 16px;
  padding: 18px 20px 20px;
}

.record-player__summary {
  padding: 14px 16px;
  border: 1px solid var(--lay-border-light);
  border-radius: 16px;
  background: color-mix(in srgb, var(--lay-bg) 92%, transparent);
}

.record-player__summary > div {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.record-player__spotlight {
  display: grid;
  gap: 6px;
  padding: 16px 18px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--lay-accent) 18%, var(--lay-border));
  background: color-mix(in srgb, var(--lay-accent) 8%, transparent);
}

.record-player__spotlight > span {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--lay-accent);
}

.record-player__spotlight p,
.record-player__event-content p {
  margin: 0;
  color: var(--lay-text-secondary);
  line-height: 1.5;
}

.record-player__timeline {
  min-height: 0;
  overflow: auto;
  display: grid;
  align-content: start;
  gap: 10px;
}

.record-player__event {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--lay-border-light);
  background: color-mix(in srgb, var(--lay-bg) 94%, transparent);
  transition: border-color .16s ease, background .16s ease, transform .16s ease;
}

.record-player__event.is-played {
  border-color: color-mix(in srgb, var(--lay-accent) 18%, transparent);
}

.record-player__event.is-active {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--lay-accent) 30%, transparent);
  background: color-mix(in srgb, var(--lay-accent) 10%, transparent);
}

.record-player__event-dot {
  width: 11px;
  height: 11px;
  border-radius: 999px;
  margin-top: 5px;
  background: color-mix(in srgb, var(--lay-accent) 58%, white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--lay-accent) 12%, transparent);
}

.record-player__event-content {
  display: grid;
  gap: 4px;
}

.pool-surface {
  grid-template-rows: auto auto minmax(0, 1fr);
}

.pool-type-switch {
  display: flex;
  gap: 10px;
  padding: 0 22px 16px;
}

.pool-type-switch .record-play-btn.is-active {
  border-color: color-mix(in srgb, var(--lay-accent) 32%, transparent);
  background: color-mix(in srgb, var(--lay-accent) 10%, transparent);
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
  gap: 10px;
}

.pool-payload-textarea {
  width: 100%;
  min-height: 150px;
  padding: 11px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--lay-border) 86%, transparent);
  background: color-mix(in srgb, var(--lay-bg) 94%, transparent);
  color: var(--lay-text-primary);
  outline: none;
  resize: vertical;
}

.parse-result-modal .record-modal__surface {
  width: min(1200px, 92vw);
  height: 80vh;
  max-height: 80vh;
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
  gap: 6px;
  border-right: 1px solid var(--lay-border-light);
}
.pr-detail {
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pr-detail--empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--lay-text-placeholder);
  font-size: 13px;
  gap: 8px;
}
.pr-card {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid transparent;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: var(--lay-surface-bg);
}
.pr-card:hover {
  border-color: color-mix(in srgb, var(--lay-accent) 20%, transparent);
  background: color-mix(in srgb, var(--lay-accent) 3%, transparent);
}
.pr-card.is-selected {
  border-color: var(--lay-accent);
  background: color-mix(in srgb, var(--lay-accent) 6%, transparent);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--lay-accent) 20%, transparent);
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
  letter-spacing: 0.02em;
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
  border: 1px solid var(--lay-border-light);
  background: var(--lay-surface-bg);
  color: var(--lay-text-placeholder);
  input {
    width: 160px;
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
    border: 1px solid var(--lay-border-light);
    border-radius: 5px;
    background: transparent;
    color: var(--lay-text-primary);
    cursor: pointer;
    font-size: 12px;
    transition: all 0.15s;
    &:hover:not(:disabled) {
      border-color: var(--lay-accent);
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
    letter-spacing: 0.05em;
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
  background: var(--lay-bg);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--lay-text-primary);
  overflow: auto;
  max-height: 100%;
  white-space: pre;
  code { font-family: inherit; }
}

@media (max-width: 980px) {
  .record-modal__body {
    grid-template-columns: 1fr;
  }

  .record-list {
    border-right: none;
    border-bottom: 1px solid var(--lay-border-light);
  }

  .pool-form-grid {
    grid-template-columns: 1fr;
  }
}
.dbtn {
  display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 18px;
  border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; border: none;
  &--ghost { background: var(--lay-surface-bg); color: var(--lay-text-secondary); border: 1px solid var(--lay-border); &:hover { border-color: var(--lay-border-light); color: var(--lay-text-regular); } }
  &--prime { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #fff; &:hover { box-shadow: 0 4px 20px rgba(6,182,212,0.2); } &:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; } }
}
.dbtn__spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
// Responsive
@media (max-width: 720px) {
  .spider-manage__content { padding: 12px; }
  .spider-manage__header { flex-direction: column; align-items: flex-start; }
  .spider-manage__actions { width: 100%; flex-wrap: wrap; }
  .spider-manage__search input { width: 100px; }
  .dialog__grid, .dialog__switches { grid-template-columns: 1fr; }
}
</style>
