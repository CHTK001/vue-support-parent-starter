<template>
  <div class="wg" data-page="image-gen">
    <section class="wg-main">
      <!-- 顶部：标题行 + 筛选行（照 UI 图） -->
      <!-- 页面头：统一用 RePageHead（标题行 + 筛选行） -->
      <RePageHead :title="`${mediaLabel}生成`">
        <template #meta>
          <span class="wg-total">共 {{ tasks.length }} 个任务</span>
        </template>
        <template #actions>
            <!--
              进行中任务徽章：生成常要几分钟，切走再回来时这里给出全局感知；
              点击即切到「只看生成中」，不用自己去开筛选弹层。选择模式下让位给工具条。
            -->
            <button
              v-if="runningCount && !selecting"
              type="button"
              class="wg-chip wg-chip-running"
              title="查看生成中的任务"
              @click="focusRunning()"
            >
              <span class="wg-running-dot" aria-hidden="true"></span>
              <span>{{ runningCount }} 个生成中</span>
            </button>

            <!--
              完成提醒开关：长任务（视频 / 多图）在后台跑完时弹一条桌面通知。
              只在页面被切到后台时才弹，用户正盯着页面时不打扰；授权一次后记住，
              不再重复询问。没有进行中任务时不出现，避免常驻噪声。
            -->
            <button
              v-if="runningCount && !selecting"
              type="button"
              class="wg-chip"
              :title="notifyEnabled ? '关闭任务完成桌面提醒' : '任务完成时桌面提醒（仅页面在后台时弹出）'"
              @click="toggleNotify()"
            >
              <WgIcon :d="ICONS.bell" />
              <span>{{ notifyEnabled ? '提醒已开' : '完成提醒' }}</span>
            </button>

            <!--
              生成类型切换。
              原来是在筛选行里放「图像 / 视频」两个行内 tab，占掉一整行左侧，
              现在收到右上角做成一个按钮 + popover：既省位置，也和「网格/列表」
              这类视图操作归到同一组工具按钮里。

              视频入口仍受 videoAvailable 约束（后端 openai 协议没有 VideoClient），
              只有一种类型时不做无意义的切换。
            -->
            <PickerPopover
              v-if="videoAvailable"
              v-model:show="mediaOpen"
              :width="200"
              align="end"
            >
              <template #trigger="{ toggle }">
                <button type="button" class="wg-media-btn" title="生成类型" @click="toggle">
                  <WgIcon :d="mediaType === 'video' ? ICONS.video : ICONS.image" />
                  <span>{{ mediaType === 'video' ? '视频' : '图像' }}</span>
                  <WgIcon :d="ICONS.chevron" class="wg-media-caret" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">生成类型</p>
                <button
                  v-for="opt in MEDIA_OPTIONS"
                  :key="opt.value"
                  type="button"
                  class="wg-menu-item"
                  :class="{ 'is-active': mediaType === opt.value }"
                  @click="switchMedia(opt.value)"
                >
                  <WgIcon :d="ICONS[opt.icon]" class="wg-menu-icon" />
                  <span class="wg-menu-text">
                    <span class="wg-menu-name">{{ opt.label }}</span>
                    <span class="wg-menu-desc">{{ opt.desc }}</span>
                  </span>
                  <WgIcon v-if="mediaType === opt.value" :d="ICONS.check" class="wg-menu-check" />
                </button>
              </div>
            </PickerPopover>

            <!--
              作品区形态：画廊（01，多列作品墙）/ 舞台（05，暗色沉浸单张）。
              两个都要，切换入口在右上角 —— 与生成类型、搜索、筛选同属「对结果集做操作」的一组。

              用分段控件而不是单个反复切换的图标钮：两种形态是一对等价的看法，
              用户要能一眼看到「现在在哪一档、另一档是什么」，而不是靠图标猜下一次点会变成什么。
            -->
            <div class="wg-mode" role="group" aria-label="作品视图">
              <button
                type="button"
                class="wg-mode-btn"
                :class="{ 'is-active': viewMode === 'gallery' }"
                :aria-pressed="viewMode === 'gallery'"
                title="画廊：多列作品墙"
                @click="setViewMode('gallery')"
              >
                <WgIcon :d="ICONS.grid" />
                <span>画廊</span>
              </button>
              <button
                type="button"
                class="wg-mode-btn"
                :class="{ 'is-active': viewMode === 'stage' }"
                :aria-pressed="viewMode === 'stage'"
                title="舞台：单张沉浸查看"
                @click="setViewMode('stage')"
              >
                <WgIcon :d="ICONS.image" />
                <span>舞台</span>
              </button>
            </div>

          <!--
            搜索 / 筛选 / 记录管理 / 排序：原来单独占一行（#tools），
            用户要求合并到标题行 —— 少一条横条，把纵向空间还给结果区。
            与生成类型 / 视图切换同属「对结果集做操作」，放在标题右侧同一组里。
          -->
          <label class="wg-search">
            <WgIcon :d="ICONS.search" />
            <input
              v-model="keyword"
              class="wg-search-input"
              type="search"
              placeholder="搜索提示词、描述..."
              aria-label="搜索提示词、描述"
            />
          </label>

          <!-- 筛选：模型 / 状态 / 仅收藏 收进一个弹层，角标为生效中的条件数 -->
          <PickerPopover v-model:show="filterOpen" :width="260">
            <template #trigger="{ toggle }">
              <button type="button" class="wg-chip" title="筛选" @click="toggle">
                <WgIcon :d="ICONS.filter" />
                <span>筛选</span>
                <span v-if="activeFilterCount" class="wg-chip-badge">{{ activeFilterCount }}</span>
              </button>
            </template>

            <div class="wg-menu">
              <p class="wg-menu-title">创作模型</p>
              <button
                v-for="opt in modelFilterOptions"
                :key="opt.key || 'all'"
                type="button"
                class="wg-menu-item"
                :class="{ 'is-active': modelFilter === opt.key }"
                @click="modelFilter = opt.key; filterOpen = false"
              >
                <span class="wg-menu-text">
                  <span class="wg-menu-name">{{ opt.label }}</span>
                  <span v-if="opt.desc" class="wg-menu-desc">{{ opt.desc }}</span>
                </span>
                <WgIcon v-if="modelFilter === opt.key" :d="ICONS.check" class="wg-menu-check" />
              </button>

              <p class="wg-menu-title">状态</p>
              <button
                v-for="opt in STATUS_OPTIONS"
                :key="'st-' + (opt.key || 'all')"
                type="button"
                class="wg-menu-item"
                :class="{ 'is-active': statusFilter === opt.key }"
                @click="statusFilter = opt.key; filterOpen = false"
              >
                <span class="wg-menu-text"><span class="wg-menu-name">{{ opt.label }}</span></span>
                <WgIcon v-if="statusFilter === opt.key" :d="ICONS.check" class="wg-menu-check" />
              </button>

              <p class="wg-menu-title">偏好</p>
              <button
                type="button"
                class="wg-menu-item"
                :class="{ 'is-active': onlyFavorite }"
                @click="onlyFavorite = !onlyFavorite; filterOpen = false"
              >
                <span class="wg-menu-text"><span class="wg-menu-name">仅收藏</span></span>
                <WgIcon v-if="onlyFavorite" :d="ICONS.check" class="wg-menu-check" />
              </button>

              <p class="wg-menu-title">时间</p>
              <button
                v-for="opt in TIME_RANGE_OPTIONS"
                :key="'tr-' + (opt.key || 'all')"
                type="button"
                class="wg-menu-item"
                :class="{ 'is-active': timeRange === opt.key }"
                @click="timeRange = opt.key; filterOpen = false"
              >
                <span class="wg-menu-text"><span class="wg-menu-name">{{ opt.label }}</span></span>
                <WgIcon v-if="timeRange === opt.key" :d="ICONS.check" class="wg-menu-check" />
              </button>
            </div>
          </PickerPopover>

          <!--
            记录管理：清理失败 / 批量删除 / 清空全部。
            三个都是破坏性操作，收进一个 popover 而不是并排摆三个危险按钮 ——
            并排会让「清空全部」离「清理失败」只有几十像素，误触代价却是全部作品。
          -->
          <PickerPopover v-if="!selecting" v-model:show="recordsOpen" :width="280" align="end">
            <template #trigger="{ toggle }">
              <button
                type="button"
                class="wg-chip wg-chip-danger"
                :disabled="busyClearing"
                :title="busyClearing ? '正在处理…' : '记录管理'"
                @click="toggle"
              >
                <WgIcon :d="ICONS.trash" />
                <span>清理{{ voidRecordCount ? ' ' + voidRecordCount : '' }}</span>
                <WgIcon :d="ICONS.chevron" />
              </button>
            </template>
            <div class="wg-menu">
              <p class="wg-menu-title">记录管理</p>
              <!-- 导出当前筛选结果：只导元数据（提示词/模型/参数/状态/耗时），不带图片与参考图 -->
              <button type="button" class="wg-menu-item" :disabled="!rows.length" @click="exportHistory('csv')">
                <span class="wg-menu-text">
                  <span class="wg-menu-name">导出 CSV</span>
                  <span class="wg-menu-desc">当前筛选的 {{ rows.length }} 条记录，Excel 可直接打开</span>
                </span>
              </button>
              <button type="button" class="wg-menu-item" :disabled="!rows.length" @click="exportHistory('json')">
                <span class="wg-menu-text">
                  <span class="wg-menu-name">导出 JSON</span>
                  <span class="wg-menu-desc">同一份清单，供程序处理或备份</span>
                </span>
              </button>
              <button
                type="button"
                class="wg-menu-item"
                :disabled="!hasVoidRecords"
                @click="clearFailedTasks()"
              >
                <span class="wg-menu-text">
                  <span class="wg-menu-name">清理失败</span>
                  <span class="wg-menu-desc">
                    {{ hasVoidRecords ? `删除 ${voidRecordCount} 条失败与已取消的记录` : '没有失败或已取消的记录' }}
                  </span>
                </span>
              </button>
              <button
                type="button"
                class="wg-menu-item"
                :disabled="!rows.length"
                @click="enterSelectMode()"
              >
                <span class="wg-menu-text">
                  <span class="wg-menu-name">批量删除</span>
                  <span class="wg-menu-desc">勾选后删除指定记录</span>
                </span>
              </button>
              <!-- 清空当前画布草稿（提示词 + 参考图），不动历史记录（用户需求 1.1） -->
              <button type="button" class="wg-menu-item" @click="clearCanvasDraft()">
                <span class="wg-menu-text">
                  <span class="wg-menu-name">清空绘画</span>
                  <span class="wg-menu-desc">清空当前提示词与参考图，不影响历史记录</span>
                </span>
              </button>
              <button
                type="button"
                class="wg-menu-item is-danger"
                :disabled="!tasks.length"
                @click="confirmClearAll()"
              >
                <span class="wg-menu-text">
                  <span class="wg-menu-name">清空全部</span>
                  <span class="wg-menu-desc">删除全部 {{ tasks.length }} 条，含已生成的作品</span>
                </span>
              </button>
            </div>
          </PickerPopover>

          <!-- 选择模式工具条：替换掉上面的入口，不并存两套操作，免得点了哪个说不清 -->
          <template v-else>
            <span class="wg-chip is-strong">已选 {{ selectedIds.size }} / {{ rows.length }}</span>
            <button type="button" class="wg-chip" :disabled="!rows.length" @click="toggleSelectAll()">
              {{ selectedIds.size === rows.length && rows.length ? '取消全选' : '全选' }}
            </button>
            <button
              type="button"
              class="wg-chip wg-chip-danger"
              :disabled="!selectedIds.size || busyClearing"
              @click="deleteSelected()"
            >
              <WgIcon :d="ICONS.trash" />
              <span>删除选中{{ selectedIds.size ? ' ' + selectedIds.size : '' }}</span>
            </button>
            <!-- 批量下载：逐张走既有的鉴权下载通道，文件名带提示词与序号，落地即可辨认 -->
            <button
              type="button"
              class="wg-chip"
              :disabled="!selectedIds.size"
              @click="downloadSelected()"
            >
              <WgIcon :d="ICONS.download" />
              <span>下载选中{{ selectedIds.size ? ' ' + selectedIds.size : '' }}</span>
            </button>
            <!-- 批量收藏：与单张收藏共用同一本地集合，已收藏的自动跳过 -->
            <button
              type="button"
              class="wg-chip"
              :disabled="!selectedIds.size"
              @click="favoriteSelected()"
            >
              <WgIcon :d="ICONS.star" />
              <span>收藏选中{{ selectedIds.size ? ' ' + selectedIds.size : '' }}</span>
            </button>
            <button type="button" class="wg-chip" @click="exitSelectMode()">退出</button>
          </template>

          <!-- 排序 -->
          <PickerPopover v-model:show="sortOpen" :width="200" align="end">
            <template #trigger="{ toggle }">
              <button type="button" class="wg-chip" title="排序" @click="toggle">
                <span>{{ sortLabel }}</span>
                <WgIcon :d="ICONS.chevron" />
              </button>
            </template>
            <div class="wg-menu">
              <p class="wg-menu-title">排序</p>
              <button
                v-for="opt in SORT_OPTIONS"
                :key="opt.key"
                type="button"
                class="wg-menu-item"
                :class="{ 'is-active': sortOrder === opt.key }"
                @click="sortOrder = opt.key; sortOpen = false"
              >
                <span class="wg-menu-text"><span class="wg-menu-name">{{ opt.label }}</span></span>
                <WgIcon v-if="sortOrder === opt.key" :d="ICONS.check" class="wg-menu-check" />
              </button>
              <div class="wg-menu-foot">
                <span>↑↓ 导航</span>
                <span>Enter 选择</span>
                <span>Esc 关闭</span>
              </div>
            </div>
          </PickerPopover>
        </template>
      </RePageHead>

      <!-- 结果画布 -->
      <!-- tabindex="0"：内层滚动区默认不可聚焦，方向键 / PageDown / End 只作用于聚焦元素，
           鼠标能往下翻历史、键盘却完全不动。role="region" 让读屏能识别为可滚动区域。 -->
      <div
        ref="canvasRef"
        class="wg-canvas"
        :class="{ 'is-stage': viewMode === 'stage' }"
        tabindex="0"
        role="region"
        aria-label="生成历史"
        @scroll.passive="onCanvasScroll"
        @keydown="onCanvasKeydown"
      >
        <!--
          05 沉浸舞台：01 画廊里点开一张作品就落到这里。
          暗色底把画面推成唯一主体，右侧是同一批结果的竖排记录条，
          底部是本条任务的全部结果（胶片行）—— 一次生成 6–10 张时逐张看的就是这里。
          进入/退出都走右上角的分段开关，Esc 回画廊、←/→ 换张。
        -->
        <div v-if="viewMode === 'stage'" class="wg-stage">
          <header class="wg-stage-head">
            <button type="button" class="wg-stage-back" @click="setViewMode('gallery')">
              <WgIcon :d="ICONS.arrowRight" class="wg-stage-back-icon" />
              <span>返回画廊</span>
            </button>
            <span v-if="stageRow" class="wg-stage-pos">
              <template v-if="stageItems.length > 1">
                第 {{ stageSafeIndex + 1 }} / {{ stageItems.length }} 张
              </template>
              <template v-else>单张作品</template>
            </span>
            <div class="wg-stage-nav">
              <button
                type="button"
                class="wg-stage-navbtn"
                aria-label="上一张"
                title="上一张（←）"
                :disabled="!stageRow"
                @click="stageStep(-1)"
              >
                <WgIcon :d="ICONS.chevron" class="is-left" />
              </button>
              <button
                type="button"
                class="wg-stage-navbtn"
                aria-label="下一张"
                title="下一张（→）"
                :disabled="!stageRow"
                @click="stageStep(1)"
              >
                <WgIcon :d="ICONS.chevron" class="is-right" />
              </button>
            </div>
          </header>

          <div v-if="stageRow" class="wg-stage-body">
            <section class="wg-stage-main">
              <!-- 参考图随行：放大看结果时，来源构图仍在一旁，不用退回画廊对答案 -->
              <div
                v-if="stageRow.task.referenceImage"
                v-viewer="viewerOptions"
                class="wg-stage-ref"
                aria-label="本任务的参考图"
              >
                <span class="wg-stage-ref-label">参考图</span>
                <img
                  v-if="!mediaFailed(stageRow.task.referenceImage)"
                  :src="mediaSrc(stageRow.task.referenceImage)"
                  alt="参考图"
                  :style="{ aspectRatio: refRatioOf(stageRow.task) }"
                />
                <span v-else class="wg-stage-ref-lost">参考图已丢失</span>
                <!-- 对照开关：参考图与结果并排同屏，图生图「改了多少」一眼可读 -->
                <button
                  v-if="!mediaFailed(stageRow.task.referenceImage)"
                  type="button"
                  class="wg-stage-ref-toggle"
                  :class="{ 'is-on': refCompareOpen }"
                  :aria-pressed="refCompareOpen"
                  @click="refCompareOpen = !refCompareOpen"
                >
                  {{ refCompareOpen ? '退出对照' : '对照' }}
                </button>
              </div>
              <!-- 说明浮层压在画面上：题目 + 规格 + 操作，全部贴着这张图 -->
              <figure class="wg-stage-figure" :class="{ 'is-compare': refCompareActive }" v-viewer="viewerOptions">
                <!--
                  对照模式（图片任务）：参考图整幅叠在结果上，拖动分割线左右「擦除」对比。
                  同构图对比时视线不用在两半之间跳：分割线扫到哪里，哪里就是参考图。
                  题注浮层 DOM 靠后、同层级后画，点击题注不受拖动层影响。
                  视频任务保留并排双格：擦除层会盖住 video 控件，不能拖。
                -->
                <div
                  v-if="refCompareActive && stageRow.task.referenceImage && stageRow.task.type !== 'video'"
                  class="wg-stage-wipe"
                  @pointerdown="onWipeDown"
                  @pointermove="onWipeMove"
                  @pointerup="onWipeUp"
                  @pointercancel="onWipeUp"
                >
                  <img
                    class="wg-stage-wipe-ref"
                    :style="{ clipPath: `inset(0 ${100 - wipePos}% 0 0)` }"
                    :src="mediaSrc(stageRow.task.referenceImage)"
                    alt="参考图"
                    decoding="async"
                    draggable="false"
                  />
                  <span class="wg-stage-compare-tag">参考图</span>
                  <div class="wg-stage-wipe-bar" :style="{ left: wipePos + '%' }" aria-hidden="true">
                    <i class="wg-stage-wipe-grip">⇆</i>
                  </div>
                </div>
                <!-- 对照模式（视频任务）：参考图占左半屏，与右侧结果并排，保留视频控件 -->
                <div v-else-if="refCompareActive && stageRow.task.referenceImage" class="wg-stage-compare-cell">
                  <span class="wg-stage-compare-tag">参考图</span>
                  <img :src="mediaSrc(stageRow.task.referenceImage)" alt="参考图" decoding="async" />
                </div>
                <!--
                  画框比画面宽时，两侧会留出大片纯暗色，看起来像「图没铺满」。
                  用同一张图做一层放大虚化的底，把暗色填成画面自身的延伸；
                  只做背景层（div + background-image），不进 v-viewer 的图片列表，
                  否则「查看原图」会翻到两张一模一样的图。
                -->
                <div
                  v-if="stageRow.task.type === 'image' && stageItem && !mediaFailed(stageItem.url)"
                  class="wg-stage-bleed"
                  :style="{ backgroundImage: 'url(' + mediaSrc(stageItem.url) + ')' }"
                  aria-hidden="true"
                />
                <video
                  v-if="stageRow.task.type === 'video' && stageItem && !mediaFailed(stageItem.url)"
                  :src="mediaVideoSrc(stageItem.url)"
                  class="wg-stage-media"
                  :class="{ 'is-loaded': loadedImages.has(stageItem.key) }"
                  controls
                  preload="metadata"
                  @loadeddata="markLoaded(stageItem.key)"
                />
                <img
                  v-else-if="stageItem && !mediaFailed(stageItem.url)"
                  :src="mediaSrc(stageItem.url)"
                  class="wg-stage-media"
                  :class="{ 'is-loaded': loadedImages.has(stageItem.key) }"
                  :alt="stageRow.task.prompt"
                  decoding="async"
                  @load="markLoaded(stageItem.key)"
                />
                <div v-else class="wg-stage-lost" role="img" aria-label="原图已丢失">原图已丢失</div>
                <span v-if="refCompareActive" class="wg-stage-compare-tag is-result" aria-hidden="true">结果</span>

                <figcaption class="wg-stage-cap">
                  <!-- 长提示词默认两行截断：点击展开读全文，再点收起；换一条记录自动复位 -->
                  <p
                    class="wg-stage-prompt"
                    :class="{ 'is-open': stagePromptOpen }"
                    :title="stagePromptOpen ? '点击收起' : '点击展开全文'"
                    @click="stagePromptOpen = !stagePromptOpen"
                  >
                    <WgIcon :d="ICONS.chevron" class="wg-stage-prompt-caret" />
                    {{ stageRow.task.prompt || '（无提示词）' }}
                  </p>
                  <p v-if="finalPromptOf(stageRow.task)" class="wg-stage-final" :title="finalPromptOf(stageRow.task)">
                    <span class="wg-final-tag">完整</span>
                    <span class="wg-final-text">{{ finalPromptOf(stageRow.task) }}</span>
                    <button
                      type="button"
                      class="wg-final-copy"
                      aria-label="复制完整提示词"
                      title="复制完整提示词"
                      @click="copyPrompt(finalPromptOf(stageRow.task))"
                    >
                      <WgIcon :d="ICONS.copy" class="wg-final-copy-icon" />
                    </button>
                  </p>
                  <div class="wg-stage-meta">
                    <span class="wg-stage-badge" :class="badgeClass(stageRow.task)">{{ badgeText(stageRow.task) }}</span>
                    <span class="wg-stage-kv"><em>模型</em>{{ modelLabel(stageRow.task.model) }}</span>
                    <span v-if="stageRow.task.size" class="wg-stage-kv">
                      <em>尺寸</em>{{ stageRow.task.size }}<template v-if="ratioOf(stageRow.task.size)"> · {{ ratioOf(stageRow.task.size) }}</template>
                    </span>
                    <span v-if="stageRow.task.type === 'image' && (stageRow.task.count ?? 1) > 1" class="wg-stage-kv">
                      <em>张数</em>{{ stageRow.task.count }} 张
                    </span>
                    <span v-if="stageRow.task.type === 'image' && stageRow.task.style" class="wg-stage-kv">
                      <em>风格</em>{{ styleName(stageRow.task.style) }}
                    </span>
                    <!-- 复现参数：种子/负面提示词有值才显示；负面词全文放 title 悬停可读 -->
                    <span v-if="stageRow.task.seed !== null && stageRow.task.seed !== undefined" class="wg-stage-kv">
                      <em>种子</em>{{ stageRow.task.seed }}
                    </span>
                    <span
                      v-if="stageRow.task.negativePrompt"
                      class="wg-stage-kv"
                      :title="stageRow.task.negativePrompt"
                    >
                      <em>负面</em>已设置
                    </span>
                    <span class="wg-stage-kv"><em>耗时</em>{{ formatElapsed(stageRow.task.elapsedMillis) }}</span>
                    <span class="wg-stage-kv"><em>时间</em>{{ formatTime(stageRow.task.createdAt) }}</span>
                  </div>

                  <div class="wg-stage-acts">
                    <button
                      v-if="stageRow.task.prompt"
                      type="button"
                      class="wg-stage-act"
                      aria-label="复制提示词"
                      title="复制提示词"
                      @click="copyPrompt(stageRow.task.prompt)"
                    >
                      <WgIcon :d="ICONS.copy" />
                    </button>
                    <button
                      type="button"
                      class="wg-stage-act"
                      aria-label="查看原图"
                      title="查看原图"
                      @click="zoomStage($event)"
                    >
                      <WgIcon :d="ICONS.zoom" />
                    </button>
                    <button
                      type="button"
                      class="wg-stage-act"
                      aria-label="下载"
                      title="下载"
                      @click="stageItem && download(stageItem.url, stageRow!.task.type)"
                    >
                      <WgIcon :d="ICONS.download" />
                    </button>
                    <!-- 打包下载：多图任务一键取走全部，免逐张点 -->
                    <button
                      v-if="stageItems.length > 1"
                      type="button"
                      class="wg-stage-act"
                      aria-label="打包下载全部结果"
                      title="打包下载全部结果（ZIP）"
                      :disabled="zipBusyId === stageRow.task.taskId"
                      @click="downloadTaskZip(stageRow.task)"
                    >
                      <WgIcon :d="ICONS.zip" />
                    </button>
                    <!-- 复制图片：贴进聊天/文档；仅图片（视频帧复制无意义） -->
                    <button
                      v-if="stageRow.task.type === 'image'"
                      type="button"
                      class="wg-stage-act"
                      aria-label="复制图片"
                      title="复制图片到剪贴板"
                      :disabled="copyImageBusy"
                      @click="stageItem && copyImage(stageItem.url)"
                    >
                      <WgIcon :d="ICONS.copyImage" />
                    </button>
                    <button
                      type="button"
                      class="wg-stage-act"
                      :class="{ 'is-on': isFavorite(stageRow.task.taskId) }"
                      :aria-label="isFavorite(stageRow.task.taskId) ? '取消收藏' : '收藏'"
                      :title="isFavorite(stageRow.task.taskId) ? '取消收藏' : '收藏'"
                      @click="toggleFavorite(stageRow.task.taskId)"
                    >
                      <WgIcon :d="ICONS.star" />
                    </button>
                    <el-dropdown
                      v-if="stageRow.task.type === 'image'"
                      trigger="click"
                      @command="(cmd) => stageItem && onMoreCommand(cmd, stageItem, stageRow!)"
                    >
                      <button
                        type="button"
                        class="wg-stage-act"
                        aria-label="更多"
                        title="更多"
                        :disabled="moreBusy"
                      >
                        <WgIcon :d="ICONS.dots" />
                      </button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="face" :disabled="moreBusy">添加到人脸库</el-dropdown-item>
                          <el-dropdown-item command="image" :disabled="moreBusy">添加到图像库</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                    <button
                      type="button"
                      class="wg-stage-act"
                      aria-label="用同样的提示词与参数再生成一次"
                      title="再次生成"
                      @click="regenerate(stageRow.task)"
                    >
                      <WgIcon :d="ICONS.refresh" />
                    </button>
                  </div>
                </figcaption>
              </figure>

              <!-- 胶片行：本条任务的全部结果。张数为 1 时不出（一个格子的胶片没有意义） -->
              <div
                v-if="stageItems.length > 1"
                class="wg-stage-film"
                role="tablist"
                aria-label="本次生成的全部结果"
              >
                <button
                  v-for="(item, index) in stageItems"
                  :key="item.key"
                  type="button"
                  class="wg-stage-film-item"
                  :class="{ 'is-active': index === stageSafeIndex }"
                  role="tab"
                  :aria-selected="index === stageSafeIndex"
                  :aria-label="`第 ${index + 1} 张`"
                  @click="stageItemIndex = index"
                >
                  <img
                    v-if="!mediaFailed(item.url)"
                    :src="mediaSrc(item.url)"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span v-else class="wg-stage-film-lost">已丢失</span>
                </button>
              </div>
            </section>

            <!-- 右侧记录条：画廊里的顺序原样搬过来，点一条换主角 -->
            <aside class="wg-stage-rail" aria-label="生成记录">
              <p class="wg-stage-rail-title">
                <WgIcon :d="ICONS.stack" />
                <span>生成记录</span>
                <span class="wg-stage-rail-count">{{ stageTotal }}</span>
              </p>
              <div class="wg-stage-rail-list">
                <button
                  v-for="entry in resultRows"
                  :key="'sr-' + entry.id"
                  type="button"
                  class="wg-stage-rail-item"
                  :class="{ 'is-active': entry.id === stageRow.id }"
                  :aria-current="entry.id === stageRow.id ? 'true' : undefined"
                  @click="stagePickTask(entry)"
                >
                  <img
                    v-if="entry.items[0] && !mediaFailed(entry.items[0].url)"
                    :src="mediaSrc(entry.items[0].url)"
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                  <span class="wg-stage-rail-text">{{ entry.task.prompt || '（无提示词）' }}</span>
                  <span class="wg-stage-rail-time">{{ formatTime(entry.task.createdAt) }}</span>
                </button>
              </div>
            </aside>
          </div>

          <!-- 没有成功作品时：舞台不装作有东西可看，给出回画廊这一条出路 -->
          <div v-else class="wg-stage-empty">
            <p class="wg-stage-empty-title">还没有可展示的作品</p>
            <p class="wg-stage-empty-hint">生成完成后会自动出现在舞台上；也可以回画廊看看进行中的任务。</p>
            <button type="button" class="wg-more-btn" @click="setViewMode('gallery')">回到画廊</button>
          </div>
        </div>

        <!--
          多图对比：同一次生成的多张结果并排同屏（区别于舞台的「参考图 vs 结果」对照）。
          顶部勾选片控制亮哪几列，至少保留 2 张；Esc 或右上角关闭。
        -->
        <div
          v-if="compareTask"
          class="wg-compare"
          role="dialog"
          aria-label="多图对比"
          tabindex="-1"
          @keydown.esc="closeCompare()"
        >
          <header class="wg-compare-head">
            <p class="wg-compare-title">
              同一次生成的结果对比
              <span class="wg-compare-count">{{ compareOnIndexes.length }} / {{ compareTask.urls.length }} 张</span>
              <span v-if="compareTask.seed !== null && compareTask.seed !== undefined" class="wg-compare-count">
                种子 {{ compareTask.seed }}
              </span>
            </p>
            <div class="wg-compare-tools">
              <span class="wg-compare-modes" role="group" aria-label="对比方式">
                <button
                  type="button"
                  class="wg-compare-mode"
                  :class="{ 'is-on': compareMode === 'grid' }"
                  :aria-pressed="compareMode === 'grid'"
                  @click="setCompareMode('grid')"
                >
                  并排
                </button>
                <button
                  type="button"
                  class="wg-compare-mode"
                  :class="{ 'is-on': compareMode === 'slide' }"
                  :aria-pressed="compareMode === 'slide'"
                  title="把两张图叠放，拖动分割线对照"
                  @click="setCompareMode('slide')"
                >
                  滑动
                </button>
                <button
                  type="button"
                  class="wg-compare-mode"
                  :class="{ 'is-on': compareMode === 'fade' }"
                  :aria-pressed="compareMode === 'fade'"
                  title="把两张图叠放，调透明度交叉淡入对照"
                  @click="setCompareMode('fade')"
                >
                  叠加
                </button>
              </span>
              <button
                v-for="n in compareTask.urls.length"
                :key="'cmp-t-' + n"
                type="button"
                class="wg-compare-toggle"
                :class="{ 'is-on': !compareOff.has(n - 1) }"
                :aria-pressed="!compareOff.has(n - 1)"
                @click="toggleCompareColumn(n - 1)"
              >
                第 {{ n }} 张
              </button>
              <button
                type="button"
                class="wg-compare-close"
                aria-label="关闭对比"
                title="关闭（Esc）"
                @click="closeCompare()"
              >
                <WgIcon :d="ICONS.close" />
              </button>
            </div>
          </header>
          <div v-if="compareMode === 'grid'" class="wg-compare-row">
            <figure v-for="i in compareOnIndexes" :key="'cmp-' + i" class="wg-compare-col">
              <img
                v-if="!mediaFailed(compareTask.urls[i])"
                :src="mediaSrc(compareTask.urls[i])"
                :alt="'第 ' + (i + 1) + ' 张结果'"
                decoding="async"
              />
              <span v-else class="wg-compare-lost">已丢失</span>
              <figcaption class="wg-compare-cap">
                <span>第 {{ i + 1 }} 张</span>
                <span>{{ compareTask.urls.length }} 张同任务</span>
              </figcaption>
            </figure>
          </div>
          <div
            v-else-if="compareMode === 'slide'"
            ref="compareSlideEl"
            class="wg-compare-slide"
            tabindex="0"
            role="slider"
            aria-label="滑动对比：左右拖动或用方向键移动分割线"
            :aria-valuenow="Math.round(compareSplit)"
            aria-valuemin="0"
            aria-valuemax="100"
            @pointerdown="onCompareSlideDown"
            @pointermove="onCompareSlideMove"
            @pointerup="onCompareSlideUp"
            @pointercancel="onCompareSlideUp"
            @keydown.left.prevent="nudgeCompareSplit(-2)"
            @keydown.right.prevent="nudgeCompareSplit(2)"
          >
            <template v-if="compareSlideSides">
              <img
                v-if="!mediaFailed(compareSlideSides.left.url)"
                class="wg-compare-slide-img"
                :src="mediaSrc(compareSlideSides.left.url)"
                :alt="'第 ' + (compareSlideSides.left.index + 1) + ' 张结果'"
                decoding="async"
                draggable="false"
              />
              <span v-else class="wg-compare-lost">已丢失</span>
              <img
                v-if="!mediaFailed(compareSlideSides.right.url)"
                class="wg-compare-slide-img is-top"
                :src="mediaSrc(compareSlideSides.right.url)"
                :alt="'第 ' + (compareSlideSides.right.index + 1) + ' 张结果'"
                decoding="async"
                draggable="false"
                :style="{ clipPath: `inset(0 0 0 ${compareSplit}%)` }"
              />
              <span v-else class="wg-compare-lost">已丢失</span>
              <span class="wg-compare-divider" :style="{ left: compareSplit + '%' }" aria-hidden="true">
                <span class="wg-compare-grip">⇆</span>
              </span>
              <span class="wg-compare-slide-tag is-left">第 {{ compareSlideSides.left.index + 1 }} 张</span>
              <span class="wg-compare-slide-tag is-right">第 {{ compareSlideSides.right.index + 1 }} 张</span>
            </template>
            <span v-else class="wg-compare-lost">滑动对比至少需要 2 张结果</span>
          </div>
          <!--
            叠加淡入：两张图叠满同一容器，上层图整体调透明度，适合比构图和色调。
            透明度滑杆 0~100，方向键每次微调 5%；左右角标实时标出两张各占多少。
          -->
          <div
            v-else-if="compareMode === 'fade'"
            class="wg-compare-fade"
            tabindex="0"
            role="slider"
            aria-label="叠加对比：拖动滑杆调透明度，或用方向键微调"
            :aria-valuenow="Math.round(compareFade)"
            aria-valuemin="0"
            aria-valuemax="100"
            @keydown.left.prevent="nudgeCompareFade(-5)"
            @keydown.right.prevent="nudgeCompareFade(5)"
          >
            <template v-if="compareSlideSides">
              <img
                v-if="!mediaFailed(compareSlideSides.left.url)"
                class="wg-compare-fade-img"
                :src="mediaSrc(compareSlideSides.left.url)"
                :alt="'第 ' + (compareSlideSides.left.index + 1) + ' 张结果'"
                decoding="async"
                draggable="false"
              />
              <span v-else class="wg-compare-lost">已丢失</span>
              <img
                v-if="!mediaFailed(compareSlideSides.right.url)"
                class="wg-compare-fade-img is-top"
                :style="{ opacity: compareFade / 100 }"
                :src="mediaSrc(compareSlideSides.right.url)"
                :alt="'第 ' + (compareSlideSides.right.index + 1) + ' 张结果'"
                decoding="async"
                draggable="false"
              />
              <span v-else class="wg-compare-lost">已丢失</span>
              <div class="wg-compare-fade-ctl">
                <span class="wg-compare-fade-tag">
                  第 {{ compareSlideSides.left.index + 1 }} 张 {{ 100 - Math.round(compareFade) }}%
                </span>
                <input
                  v-model.number="compareFade"
                  class="wg-compare-fade-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  :aria-label="'第 ' + (compareSlideSides.right.index + 1) + ' 张的叠加透明度'"
                />
                <span class="wg-compare-fade-tag">
                  第 {{ compareSlideSides.right.index + 1 }} 张 {{ Math.round(compareFade) }}%
                </span>
              </div>
            </template>
            <span v-else class="wg-compare-lost">叠加对比至少需要 2 张结果</span>
          </div>
        </div>

        <!-- 骨架屏：首次加载历史期间，避免「一片空白」 -->
        <div v-if="viewMode === 'gallery' && loading && !rows.length" class="wg-list">
          <article v-for="n in 3" :key="'sk-' + n" class="wg-card is-skeleton" aria-hidden="true">
            <div class="wg-sk-row">
              <span class="wg-sk wg-sk-badge"></span>
              <span class="wg-sk wg-sk-title"></span>
              <span class="wg-sk wg-sk-time"></span>
            </div>
            <div class="wg-sk-row">
              <span class="wg-sk wg-sk-pill"></span>
              <span class="wg-sk wg-sk-pill"></span>
              <span class="wg-sk wg-sk-pill"></span>
            </div>
            <div class="wg-sk-media">
              <span v-for="m in 4" :key="'skm-' + m" class="wg-sk wg-sk-thumb"></span>
            </div>
          </article>
        </div>

        <!--
          一次请求一行，按时间顺序统一渲染。
          进行中、失败/取消、已完成都在同一个列表里按排序落位，
          不再把某类单独抽出来钉在顶部——那样会打乱时间顺序。
        -->
        <div
          v-else-if="viewMode === 'gallery' && rows.length"
          class="wg-list is-gallery"
        >
          <template v-for="entry in listEntries" :key="entry.key">
            <!-- 日期分隔：只在天变的时候出现一次，网格视图里横跨整行 -->
            <h2 v-if="entry.kind === 'day'" class="wg-day-label">
              <span>{{ entry.label }}</span>
              <span class="wg-day-count">{{ entry.count }}</span>
            </h2>
            <article
              v-else
              :key="entry.row.id"
              class="wg-card"
              :class="[`is-${entry.row.kind}`, { 'is-selecting': selecting, 'is-selected': selectedIds.has(entry.row.id) }]"
              @click="onCardClick(entry.row, $event)"
            >
              <!-- 卡片内部沿用原来的 row 变量：v-for 单元素包一层，避免把上百处 row.* 全改成 entry.row.* -->
              <template v-for="row in [entry.row]" :key="row.id">
            <!-- 选择模式下每张卡左上角一个勾选框；其余操作整块屏蔽，避免误触删除/重试 -->
            <span v-if="selecting" class="wg-pick" :aria-checked="selectedIds.has(row.id)" role="checkbox">
              <WgIcon :d="selectedIds.has(row.id) ? ICONS.check : ICONS.circle" />
            </span>
            <!-- 第一行：状态 …… 耗时/时间/操作。提示词移到右栏（图 + 说明），
                 卡片宽的时候不再是一行字挂在左上、右侧大片空白 -->
            <div class="wg-card-head">
              <span class="wg-badge" :class="badgeClass(row.task)">{{ badgeText(row.task) }}</span>

              <div class="wg-card-head-right">
                <!-- 提示词复制：凡有提示词的卡片都可一键复制 -->
                <button
                  v-if="row.task.prompt"
                  type="button"
                  class="wg-act is-ghost"
                  title="复制提示词"
                  aria-label="复制提示词"
                  @click="copyPrompt(row.task.prompt)"
                >
                  <WgIcon :d="ICONS.copy" />
                </button>

                <div v-if="row.kind === 'running'" class="wg-run">
                  <span class="wg-strong">{{ row.task.progress ?? 0 }}%</span>
                  <i class="wg-run-bar" aria-hidden="true"><b :style="{ width: runPct(row.task) + '%' }" /></i>
                </div>
                <template v-else-if="row.kind === 'result'">
                  <span class="wg-elapsed">{{ formatElapsed(row.task.elapsedMillis) }}</span>
                  <span class="wg-time">{{ formatTime(row.task.createdAt) }}</span>
                  <button
                    type="button"
                    class="wg-act is-primary"
                    title="用同样的提示词与参数再生成一次"
                    @click="regenerate(row.task)"
                  >
                    <WgIcon :d="ICONS.refresh" />
                    <span>再次生成</span>
                  </button>
                  <!-- 按这套参数再来一张：只回填模型/风格/尺寸/张数，提示词留给自己写 -->
                  <button
                    type="button"
                    class="wg-act is-ghost"
                    title="按这套参数再来一张：回填模型/风格/尺寸/张数，提示词重新写"
                    aria-label="按这套参数再来一张"
                    @click="reuseParams(row.task)"
                  >
                    <WgIcon :d="ICONS.tune" />
                  </button>
                  <!-- 复用种子：把这条记录的 seed 带进高级参数，换提示词保种子微调 -->
                  <button
                    v-if="row.task.seed !== null && row.task.seed !== undefined"
                    type="button"
                    class="wg-act is-ghost"
                    title="把这条的种子带入高级参数，换提示词保种子微调"
                    aria-label="复用这条任务的种子"
                    @click="reuseSeed(row.task)"
                  >
                    <WgIcon :d="ICONS.seed" />
                  </button>
                  <!-- 打包下载：多图任务一键取走全部结果，免逐张点下载 -->
                  <button
                    v-if="row.task.urls.length > 1"
                    type="button"
                    class="wg-act is-ghost"
                    title="打包下载全部结果（ZIP）"
                    aria-label="打包下载全部结果"
                    :disabled="zipBusyId === row.task.taskId"
                    @click="downloadTaskZip(row.task)"
                  >
                    <WgIcon :d="ICONS.zip" />
                  </button>
                  <!-- 多图对比：同一次生成的多张结果并排同屏，勾着看差异 -->
                  <button
                    v-if="row.task.urls.length > 1"
                    type="button"
                    class="wg-act is-ghost"
                    title="多图并排对比"
                    aria-label="多图并排对比"
                    @click="openCompare(row.task)"
                  >
                    <WgIcon :d="ICONS.compare" />
                  </button>
                </template>
                <button
                  v-if="row.kind === 'void'"
                  type="button"
                  class="wg-retry"
                  @click="remake(row.task)"
                >
                  <WgIcon :d="ICONS.refresh" />
                  <span>重试</span>
                </button>

                <!-- 删除：失败/空结果记录尤其需要，否则一直占着列表 -->
                <button
                  type="button"
                  class="wg-act is-ghost wg-del"
                  title="删除这条记录"
                  aria-label="删除这条记录"
                  @click="removeTask(row.task)"
                >
                  <WgIcon :d="ICONS.trash" />
                </button>
              </div>
            </div>

            <!--
              主体：媒体在左、参数在右。
              之前参数单独占一行且靠左，单图卡片右侧空出 700px+；
              改成左右分栏后参数正好填掉这块空白。
            -->
            <div class="wg-card-body">
              <!-- 媒体 -->
              <div
                v-if="row.kind === 'result'"
                class="wg-card-media"
                :class="{ 'is-ref-peer': isRefPeer(row) }"
              >
                <!--
                  参考图（源）→ 结果：图生图不是「两张同等的图」。
                  源图默认固定窄档、缩到结果的一半宽，并配一行说明文字；
                  结果图保持与其他记录同一尺寸，读者一眼先看到成片，再回看它改自哪张。
                  只有 1 张结果时例外：源图与结果同尺度并排（is-ref-peer），
                  因为这时「改自哪张」就是这张卡片唯一的读法，缩成窄条反而读不出对应关系。
                -->
                <template v-if="row.task.referenceImage">
                  <figure class="wg-ref-src">
                    <span class="wg-ref-frame">
                      <img
                        v-if="!mediaFailed(row.task.referenceImage)"
                        :src="mediaSrc(row.task.referenceImage)"
                        alt="参考图"
                        loading="lazy"
                        :style="{ aspectRatio: refRatioOf(row.task) }"
                      />
                      <!-- 参考图字节已不在磁盘上：给明确文案，别留一块看不懂的空白 -->
                      <div
                        v-else
                        class="wg-media-lost"
                        :style="{ aspectRatio: refRatioOf(row.task) }"
                        role="img"
                        aria-label="参考图已丢失"
                      >
                        参考图已丢失
                      </div>
                    </span>
                    <figcaption class="wg-ref-caption">参考图</figcaption>
                  </figure>
                  <span class="wg-flow" aria-hidden="true">
                    <WgIcon :d="ICONS.arrowRight" />
                    <span class="wg-flow-label">{{ row.task.type === 'video' ? '图生视频' : '图生图' }}</span>
                  </span>
                </template>

                <!--
                  结果网格：点击进 viewerjs 预览。
                  张数超过 4 时这一块同时是 hover 浮层的触发区，悬停展开全部结果；
                  其余张数下浮层直接禁用（disabled），不产生任何浮层与额外节点。
                -->
                <el-popover
                  :disabled="resultLayout(row) !== 'fan'"
                  trigger="hover"
                  placement="top-start"
                  :width="440"
                  :show-after="120"
                  :hide-after="220"
                  :persistent="false"
                  :popper-style="{ padding: '10px' }"
                >
                  <template #reference>
                    <div
                      class="wg-grid"
                      :class="`is-${resultLayout(row)}`"
                      :style="{ '--wg-cols': gridCols(row) }"
                      @click="onGridClick($event, row)"
                    >
                      <figure
                        v-for="(entry, idx) in row.items"
                        :key="entry.key"
                        class="wg-thumb"
                        :data-index="idx"
                        :class="{
                          'is-lead': isLead(row, idx),
                          'is-fan-card': isFanCard(row, idx),
                          'is-fan-hidden': isFanHidden(row, idx),
                          'is-loaded': loadedImages.has(entry.key),
                        }"
                        :style="thumbStyle(row, idx)"
                      >
                        <video
                          v-if="row.task.type === 'video' && !mediaFailed(entry.url)"
                          :src="mediaVideoSrc(entry.url)"
                          class="wg-media"
                          controls
                          preload="metadata"
                          @loadeddata="markLoaded(entry.key)"
                          @mouseenter="previewVideo($event)"
                          @mouseleave="pauseVideoPreview($event)"
                          @click="unmuteVideoOnInteract($event)"
                        />
                        <div
                          v-else-if="row.task.type === 'video'"
                          class="wg-media-lost is-video"
                          role="img"
                          aria-label="视频已丢失"
                        >
                          视频已丢失
                        </div>
                        <!--
                          decoding="async" 让解码不占主线程，配合 loading="lazy" 只解可见区的那几张。
                          结果图现在走后端字节流地址（不再内联 base64），懒加载才真正起作用：
                          内联时 30 张图的 base64 已经全在内存里，lazy 只是空转。
                          is-loaded 只做透明度过渡，不加装饰投影（见 .wg-thumb）。
                        -->
                        <img
                          v-else-if="!mediaFailed(entry.url)"
                          :src="mediaSrc(entry.url)"
                          class="wg-media"
                          :alt="row.task.prompt"
                          loading="lazy"
                          decoding="async"
                          @load="markLoaded(entry.key)"
                        />
                        <!-- 字节已丢失：这条记录仍然要留（可删除 / 可重试），但不能只给一张空白 -->
                        <div v-else class="wg-media-lost" role="img" aria-label="原图已丢失">原图已丢失</div>

                        <figcaption class="wg-thumb-actions">
                          <button
                            v-if="row.task.type === 'image'"
                            type="button"
                            class="wg-icon"
                            aria-label="在舞台查看大图"
                            title="在舞台查看大图"
                            @click.stop="openStage(row, idx)"
                          >
                            <WgIcon :d="ICONS.zoom" />
                          </button>
                          <button
                            type="button"
                            class="wg-icon"
                            aria-label="下载"
                            title="下载"
                            @click.stop="download(entry.url, row.task.type)"
                          >
                            <WgIcon :d="ICONS.download" />
                          </button>
                          <!-- 复制图片：与舞台同口径，仅图片任务展示 -->
                          <button
                            v-if="row.task.type === 'image'"
                            type="button"
                            class="wg-icon"
                            aria-label="复制图片"
                            title="复制图片到剪贴板"
                            :disabled="copyImageBusy"
                            @click.stop="copyImage(entry.url)"
                          >
                            <WgIcon :d="ICONS.copyImage" />
                          </button>
                          <button
                            type="button"
                            class="wg-icon"
                            :class="{ 'is-on': isFavorite(row.task.taskId) }"
                            :aria-label="isFavorite(row.task.taskId) ? '取消收藏' : '收藏'"
                            :title="isFavorite(row.task.taskId) ? '取消收藏' : '收藏'"
                            @click.stop="toggleFavorite(row.task.taskId)"
                          >
                            <WgIcon :d="ICONS.star" />
                          </button>
                          <!--
                            「更多」：把生成结果送去两个底库（需求：图像生成图片上加「更多」：
                            添加到人脸库、图像库）。只对图片开放——视频没有提特征的意义；
                            复用与 ImageSearchPage「加入图像底库」同一套 index 接口口径。
                          -->
                          <el-dropdown
                            v-if="row.task.type === 'image'"
                            trigger="click"
                            @command="(cmd) => onMoreCommand(cmd, entry, row)"
                          >
                            <button
                              type="button"
                              class="wg-icon"
                              aria-label="更多"
                              title="更多"
                              :disabled="moreBusy"
                              @click.stop
                            >
                              <WgIcon :d="ICONS.dots" />
                            </button>
                            <template #dropdown>
                              <el-dropdown-menu>
                                <el-dropdown-item command="face" :disabled="moreBusy"
                                  >添加到人脸库</el-dropdown-item
                                >
                                <el-dropdown-item command="image" :disabled="moreBusy"
                                  >添加到图像库</el-dropdown-item
                                >
                              </el-dropdown-menu>
                            </template>
                          </el-dropdown>
                        </figcaption>
                      </figure>

                      <!-- 扇开只露主图 + 三张，余下的张数收进角标；悬停看全部 -->
                      <span v-if="fanHiddenCount(row)" class="wg-fan-count"
                        >+{{ fanHiddenCount(row) }}</span
                      >
                    </div>
                  </template>

                  <!--
                    悬停浮层：全部结果按小格铺开（一次生成 6–10 张时，扇开只是示意，
                    真正要逐张看的是这里）。只放看图 / 下载 / 收藏，底库入库仍在主图的操作条上。
                  -->
                  <div class="wg-fan-all">
                    <figure v-for="item in row.items" :key="`fan-${item.key}`" class="wg-fan-cell">
                      <video
                        v-if="row.task.type === 'video' && !mediaFailed(item.url)"
                        :src="mediaVideoSrc(item.url)"
                        class="wg-fan-media"
                        controls
                        preload="metadata"
                        @mouseenter="previewVideo($event)"
                        @mouseleave="pauseVideoPreview($event)"
                        @click="unmuteVideoOnInteract($event)"
                      />
                      <img
                        v-else-if="!mediaFailed(item.url)"
                        :src="mediaSrc(item.url)"
                        class="wg-fan-media"
                        :alt="row.task.prompt"
                        loading="lazy"
                        decoding="async"
                      />
                      <div v-else class="wg-fan-lost">原图已丢失</div>
                      <figcaption class="wg-fan-cell-actions">
                        <button
                          type="button"
                          class="wg-icon"
                          aria-label="下载"
                          title="下载"
                          @click.stop="download(item.url, row.task.type)"
                        >
                          <WgIcon :d="ICONS.download" />
                        </button>
                        <button
                          type="button"
                          class="wg-icon"
                          :class="{ 'is-on': isFavorite(row.task.taskId) }"
                          :aria-label="isFavorite(row.task.taskId) ? '取消收藏' : '收藏'"
                          :title="isFavorite(row.task.taskId) ? '取消收藏' : '收藏'"
                          @click.stop="toggleFavorite(row.task.taskId)"
                        >
                          <WgIcon :d="ICONS.star" />
                        </button>
                      </figcaption>
                    </figure>
                  </div>
                </el-popover>
              </div>

              <!-- 进行中：占位块，按目标尺寸保持比例，宽度与出图后的结果块同一套算法 -->
              <div v-else-if="row.kind === 'running'" class="wg-card-media">
                <div
                  class="wg-generating"
                  :style="{
                    aspectRatio: aspectOf(row.task.size),
                    width: placeholderWidth(row),
                  }"
                >
                  <span class="wg-spark"><WgIcon :d="ICONS.sparkle" /></span>
                  <span class="wg-gen-stage">{{ stageText(row.task) }}</span>
                  <span class="wg-gen-stage-num">{{ row.task.progress ?? 0 }}%</span>
                  <i class="wg-gen-bar" aria-hidden="true"><b :style="{ width: runPct(row.task) + '%' }" /></i>
                  <!--
                    已用时：生成中这一段进度会长时间停在同一个数（上游不返回中间进度），
                    光看一个不动的百分比像是卡死了。秒数按心跳同一事实推进——
                    后端在生成期间每秒刷 updatedAt 证明 worker 活着（实测心跳序列
                    0.1s/2.3s/4.4s/…/12.8s 连续推进），这里把它显示出来，
                    而不是编一个假的百分比（不做时间插值是既定口径）。
                  -->
                  <span class="wg-gen-stage-elapsed">已用时 {{ elapsedSeconds(row.task) }}s</span>
                  <!-- 停止生成：视频任务动辄几分钟，等不了就主动停（后端收敛为 CANCELED） -->
                  <button
                    type="button"
                    class="wg-gen-stop"
                    :disabled="cancelingIds.has(row.task.taskId)"
                    @click="cancelTask(row.task)"
                  >
                    <WgIcon :d="ICONS.stop" />
                    <span>{{ cancelingIds.has(row.task.taskId) ? '停止中…' : '停止生成' }}</span>
                  </button>
                </div>
              </div>

              <!--
                失败 / 取消 / 无产物：占位块。
                原来是一条扁错误条，卡片高度比有结果的矮一大截，网格里就出现一个空洞。
                改成复用 .wg-generating 的几何（同一 aspect-ratio、同一 max-width 封顶），
                视觉上仍占着一张图该占的位置，只是这块位置里画的是占位。
                配色刻意不同于进行中块：进行中是主色流光，占位是中性面 + 边框，
                免得「已失败」和「还在跑」在缩略图尺度下看起来一样。
              -->
              <div v-else class="wg-card-media">
                <div
                  class="wg-void"
                  :class="row.task.status === 'CANCELED' ? 'is-canceled' : 'is-failed'"
                  :style="{ aspectRatio: aspectOf(row.task.size), width: placeholderWidth(row) }"
                >
                  <span class="wg-void-icon">
                    <WgIcon :d="row.task.type === 'video' ? ICONS.video : ICONS.image" />
                  </span>
                  <span class="wg-void-label">{{ voidLabel(row.task) }}</span>
                  <span class="wg-void-err">{{ voidReason(row.task) }}</span>
                </div>
              </div>

              <!--
                参数栏：模型 / 尺寸 / 张数 / 风格。
                放在媒体右侧、竖排成一张「参数表」：宽卡片右侧原本空着 600px+，
                横排一行胶囊贴顶后下面全是空白；竖排后每条一个标签，扫读对齐，
                卡片看起来是「图 + 规格」而不是「图 + 一条挤在角落的字」。
                仍去冗余：张数为 1、风格为空都不出条目（是噪音不是信息），
                用时留在标题行右侧，这里不重复。
              -->
              <div class="wg-card-detail">
                <p class="wg-card-title" :title="row.task.prompt">{{ row.task.prompt || '（无提示词）' }}</p>
                <!-- 完整提示词：后端拼接结果（风格描述 + 用户原文），与原文不同才展示 -->
                <p v-if="finalPromptOf(row.task)" class="wg-card-final" :title="finalPromptOf(row.task)">
                    <span class="wg-final-tag">完整</span>
                    <span class="wg-final-text">{{ finalPromptOf(row.task) }}</span>
                    <button
                      type="button"
                      class="wg-final-copy"
                      aria-label="复制完整提示词"
                      title="复制完整提示词"
                      @click="copyPrompt(finalPromptOf(row.task))"
                    >
                      <WgIcon :d="ICONS.copy" class="wg-final-copy-icon" />
                    </button>
                  </p>
                <div class="wg-card-chips">
                  <span class="wg-pill wg-pill-model">
                    <em class="wg-pill-label">模型</em>
                    <img v-if="modelLogo(row.task.model)" :src="modelLogo(row.task.model)!" alt="" class="wg-logo" />
                    <span v-else-if="row.task.model" class="wg-logo wg-logo-fallback">{{ modelLabel(row.task.model).slice(0, 1) }}</span>
                    <span>{{ modelLabel(row.task.model) }}</span>
                  </span>
                  <span v-if="row.task.size" class="wg-pill">
                    <em class="wg-pill-label">尺寸</em>
                    <span>{{ row.task.size }}<template v-if="ratioOf(row.task.size)"> · {{ ratioOf(row.task.size) }}</template></span>
                  </span>
                  <span v-if="row.task.type === 'image' && (row.task.count ?? 1) > 1" class="wg-pill">
                    <em class="wg-pill-label">张数</em>
                    <span>{{ row.task.count }} 张</span>
                  </span>
                  <span v-if="row.task.type === 'video' && row.task.duration" class="wg-pill">
                    <em class="wg-pill-label">时长</em>
                    <span>{{ row.task.duration }}s</span>
                  </span>
                  <span v-if="row.task.type === 'image' && row.task.style" class="wg-pill">
                    <em class="wg-pill-label">风格</em>
                    <span>{{ styleName(row.task.style) }}</span>
                  </span>
                  <!-- 复现参数：种子有值才显示；负面词只报「已设置」，全文放 title 悬停可读 -->
                  <span v-if="row.task.seed !== null && row.task.seed !== undefined" class="wg-pill">
                    <em class="wg-pill-label">种子</em>
                    <span>{{ row.task.seed }}</span>
                  </span>
                  <span v-if="row.task.negativePrompt" class="wg-pill" :title="row.task.negativePrompt">
                    <em class="wg-pill-label">负面</em>
                    <span>已设置</span>
                  </span>
                </div>
              </div>
            </div>
              </template>
            </article>
          </template>
        </div>

        <!-- 空态：给三条能直接用的提示词，点了就填进输入条；比一句「开始生成」更接近下一步。
             「库为空」与「检索/筛选没命中」是两回事：后者要给出清除条件的出路，
             否则用户只看到「还没有作品」，会以为自己把作品弄丢了。 -->
        <div v-if="viewMode === 'gallery' && !loading && !rows.length" class="wg-empty">
          <template v-if="hasActiveQuery">
            <p class="wg-empty-title">没有匹配的作品</p>
            <p class="wg-empty-hint">当前检索或筛选条件下没有记录。</p>
            <div class="wg-empty-samples">
              <button type="button" class="wg-empty-sample" @click="resetQuery">清除检索与筛选</button>
            </div>
          </template>
          <template v-else>
            <p class="wg-empty-title">还没有作品</p>
            <p class="wg-empty-hint">描述你想看到的画面，或者从这三条开始：</p>
            <div class="wg-empty-samples">
              <button
                v-for="sample in emptySamples"
                :key="sample"
                type="button"
                class="wg-empty-sample"
                @click="prompt = sample"
              >
                {{ sample }}
              </button>
              <!-- 换一批：从灵感池再洗出三条，避免每次都看到同样的开头 -->
              <button
                type="button"
                class="wg-empty-sample is-shuffle"
                title="换一批灵感提示词"
                @click="emptySampleSeed += 1"
              >
                <WgIcon :d="ICONS.refresh" class="wg-empty-sample-icon" />
                换一批
              </button>
            </div>
          </template>
        </div>

        <!-- 分页尾部：加载中 / 还有更多（可点）/ 到底了。
             「还有更多」必须给按钮而不是只靠滚动触发：内容不足一屏时容器不会产生滚动事件，
             第一页之外的历史将永远无法加载。 -->
        <div v-if="viewMode === 'gallery' && rows.length" class="wg-more">
          <span v-if="loadingMore">加载中…</span>
          <button v-else-if="hasMore" type="button" class="wg-more-btn" @click="loadMore()">
            加载更早的记录
          </button>
          <span v-else>没有更多了</span>
        </div>

        <!-- 回到顶部：画廊翻过约两屏后亮出，粘在滚动区右下角 -->
        <button
          v-if="viewMode === 'gallery' && showBackTop"
          type="button"
          class="wg-back-top"
          aria-label="回到顶部"
          title="回到顶部"
          @click="scrollToTop()"
        >
          <WgIcon :d="ICONS.chevron" />
        </button>
      </div>

      <!-- 输入条：外观沿用会话输入库（GenerateComposer.vue） -->
      <footer ref="composerRef" class="wg-composer">
        <GenerateComposer
          v-model:value="prompt"
          v-model:style-panel-open="stylePanelOpen"
          :busy="submitting || hasRunningTask"
          :placeholder="placeholder"
          :allow-reference="referenceSupported"
          allow-optimize
          :optimizing="optimizing"
          :allow-style-panel="styleSupported"
          :style-items="stylePanelItems"
          :style-value="style"
          :history="promptHistory"
          @submit="onComposerSubmit"
          @pick-reference="pickReference"
          @optimize="onOptimize"
          @pick-style="pickStyleFromPanel"
        >
          <!-- 参考图缩略图：挂输入框内顶部（GenerateComposer 的 reference 插槽）。
               按原始尺寸比例渲染，缩放只是传输优化，不该改变用户看到的构图。 -->
          <template #reference>
            <figure v-if="referenceImage" class="wg-ref-picked">
              <img :src="referenceImage" alt="参考图" :style="{ aspectRatio: referenceRatio }" />
              <button
                type="button"
                class="wg-ref-del"
                aria-label="移除参考图"
                title="移除"
                @click="clearReference()"
              >
                <WgIcon :d="ICONS.close" />
              </button>
            </figure>
            <!--
              「再次生成」正在把历史参考图取回成 base64 的那一下。
              留一个和参考图同尺寸的占位，否则参数栏会先塌一下再撑开，
              紧接着又弹「已删除参考图」——两次抖动比等待更让人以为出错了。
            -->
            <figure v-else-if="refilling" class="wg-ref-picked is-loading">
              <span class="wg-ref-spin" aria-live="polite">取回参考图…</span>
            </figure>
          </template>

          <!--
            风格不再常驻在输入框上方：模型支持的风格可能有十几个，42px 的方图
            既看不出风格、又占掉输入区一行。收进「风格」芯片的弹层（与模型同款：
            轨上一个芯片，点开才弹面板），面板里给 80px 预览图 + 风格名。
          -->

          <!--
            模型放参数轨最左（用户要求「底部模型选择放到第一个」）：
            先定「用什么模型」，再看张数 / 画幅 / 尺寸，顺序与出图工作流一致。
          -->
          <template #leading>
            <span class="wg-rail-group">
              <PickerPopover v-model:show="modelOpen" :width="340" @update:show="(v) => { modelOpen = v; if (!v) modelKeyword = '' }">
              <template #trigger="{ toggle }">
                <button type="button" class="wg-chip is-strong is-toolbar" title="创作模型" @click="toggle">
                  <img v-if="modelLogo(model)" :src="modelLogo(model)!" alt="" class="wg-logo" />
                  <span v-else-if="model" class="wg-logo wg-logo-fallback">{{ modelLabel(model).slice(0, 1) }}</span>
                  <span>{{ modelLabel(model) }}</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <label v-if="currentModels.length > 1" class="wg-menu-search">
                  <WgIcon :d="ICONS.search" class="wg-menu-search-icon" />
                  <input v-model="modelKeyword" type="search" placeholder="搜索模型" aria-label="搜索模型" />
                </label>
                <p class="wg-menu-title">创作模型<span class="wg-menu-count">{{ modelMenuOptions.length }}</span></p>
                <button
                  v-for="opt in modelMenuOptions"
                  :key="opt.model"
                  type="button"
                  class="wg-menu-item"
                  :class="{ 'is-active': model === opt.model }"
                  @click="pickModel(opt.model); modelOpen = false"
                >
                  <img v-if="modelLogo(opt.model, opt.providerName)" :src="modelLogo(opt.model, opt.providerName)!" alt="" class="wg-logo" />
                  <span v-else class="wg-logo wg-logo-fallback">{{ modelLabel(opt.model).slice(0, 1) }}</span>
                  <span class="wg-menu-text">
                    <span class="wg-menu-name">{{ modelLabel(opt.model) }}</span>
                    <span class="wg-menu-desc">{{ opt.providerName }}</span>
                  </span>
                  <WgIcon v-if="model === opt.model" :d="ICONS.check" class="wg-menu-check" />
                </button>
                <p v-if="!modelMenuOptions.length" class="wg-menu-empty">没有匹配的模型</p>
                <div class="wg-menu-foot">
                  <span>↑↓ 导航</span>
                  <span>Enter 选择</span>
                  <span>Esc 关闭</span>
                </div>
              </div>
              </PickerPopover>
            </span>
          </template>

          <!-- 风格：与模型同款 —— 轨上只放一个芯片，点开才弹宫格面板。
               十几张缩略图常驻在输入框上方会占掉一整行，42px 的方图也看不清风格；
               收进弹层后每格能放到 80px，且不影响输入区高度。 -->
          <template #buttons>
            <PickerPopover
              v-if="mediaType === 'image' && styleSupported"
              v-model:show="styleOpen"
              :width="440"
              :max-height="520"
            >
              <template #trigger="{ toggle }">
                <button
                  type="button"
                  class="wg-chip is-toolbar wg-style-chip"
                  :class="{ 'is-strong': !!style }"
                  :title="style ? `出图风格：${styleLabel}` : '出图风格：不加风格描述'"
                  @click="toggle"
                >
                  <WgIcon :d="ICONS.sparkle" />
                  <span>{{ style ? `风格 · ${styleLabel}` : '风格' }}</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">
                  出图风格<span class="wg-menu-count">{{ styleMenuItems.length }}</span>
                </p>
                <div class="wg-style-grid">
                  <button
                    v-for="item in styleMenuItems"
                    :key="item.key || 'none'"
                    type="button"
                    class="wg-menu-item wg-style-cell"
                    :class="{ 'is-active': style === item.key }"
                    :title="item.prompt || '不加风格描述，按提示词直接出图'"
                    @click="pickStyle(item.key); styleOpen = false"
                  >
                    <span class="wg-style-cell-thumb" :class="{ 'is-none': !item.key }">
                      <img
                        v-if="item.thumb"
                        :src="item.thumb"
                        alt=""
                        loading="lazy"
                        @error="markStyleThumbFailed(item.key)"
                      />
                      <span
                        v-else-if="item.key"
                        class="wg-style-fallback"
                        :style="{ '--wg-style-hue': item.hue }"
                        >{{ item.name }}</span
                      >
                      <WgIcon v-else :d="ICONS.close" />
                    </span>
                    <span class="wg-style-cell-name">{{ item.name }}</span>
                  </button>
                </div>
                <div class="wg-menu-foot">
                  <span>↑↓ 导航</span>
                  <span>Enter 选择</span>
                  <span>Esc 关闭</span>
                </div>
              </div>
            </PickerPopover>

            <!-- 高级参数：负面提示词 / 随机种子 / 推理步数。
                 与风格同一套「轨上一颗芯片 + 点开弹层」的语言；模型未声明的能力位
                 不渲染对应输入，全部留空时提交不带这些字段（按模型默认处理）。 -->
            <PickerPopover
              v-if="mediaType === 'image' && advAvailable"
              v-model:show="advOpen"
              :width="300"
              :max-height="420"
            >
              <template #trigger="{ toggle }">
                <button
                  type="button"
                  class="wg-chip is-toolbar wg-adv-chip"
                  :class="{ 'is-strong': advActive }"
                  :title="advActive ? '已设置高级参数，点击修改' : '高级参数：负面提示词 / 种子 / 步数'"
                  aria-label="高级参数"
                  @click="toggle"
                >
                  <WgIcon :d="ICONS.filter" />
                  <span>高级参数</span>
                  <!-- 已设参数个数角标：与筛选芯片同一套 badge 语言 -->
                  <span v-if="advActiveCount" class="wg-chip-badge">{{ advActiveCount }}</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu wg-adv-menu">
                <p class="wg-menu-title">高级参数</p>
                <label v-if="negativeSupported" class="wg-adv-field">
                  <span class="wg-adv-label">负面提示词</span>
                  <textarea
                    v-model="advNegative"
                    class="wg-adv-textarea"
                    rows="3"
                    maxlength="1000"
                    placeholder="不希望出现的元素，留空不启用"
                  />
                </label>
                <!-- 负面提示词预设：高频排除词一键追加，点过的词不会重复进串 -->
                <div v-if="negativeSupported" class="wg-adv-presets">
                  <button
                    v-for="preset in NEGATIVE_PRESETS"
                    :key="preset.label"
                    type="button"
                    class="wg-adv-preset"
                    :title="preset.text"
                    @click="applyNegativePreset(preset.text)"
                  >
                    {{ preset.label }}
                  </button>
                </div>
                <label v-if="seedSupported" class="wg-adv-field">
                  <span class="wg-adv-label">随机种子</span>
                  <input
                    v-model.number="advSeed"
                    class="wg-adv-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="≥ 0 的整数，留空随机"
                  />
                </label>
                <label v-if="stepsSupported" class="wg-adv-field">
                  <span class="wg-adv-label">推理步数</span>
                  <input
                    v-model.number="advSteps"
                    class="wg-adv-input"
                    type="number"
                    :min="stepsMin ?? undefined"
                    :max="stepsMax ?? undefined"
                    step="1"
                    :placeholder="stepsPlaceholder"
                  />
                </label>
                <div class="wg-adv-foot">
                  <p class="wg-adv-hint">留空的参数按模型默认处理</p>
                  <button
                    type="button"
                    class="wg-adv-clear"
                    :disabled="!advActive"
                    @click="resetAdvParams"
                  >
                    清空
                  </button>
                </div>
              </div>
            </PickerPopover>

            <!--
              常用提示词夹：把好用的提示词存进本地常用夹，点按直接回填输入区。
              与「作品收藏」（收藏生成的结果）和自动「历史」（最近发过的）都不同：
              这里存的是提示词文本本身，跨任务复用。
            -->
            <PickerPopover v-model:show="promptFavsOpen" :width="330" :max-height="400">
              <template #trigger="{ toggle }">
                <button
                  type="button"
                  class="wg-chip is-toolbar wg-favchip"
                  :title="promptFavs.length ? `常用提示词 ${promptFavs.length} 条` : '常用提示词'"
                  aria-label="常用提示词"
                  @click="toggle"
                >
                  <WgIcon :d="ICONS.star" />
                  <span>常用</span>
                  <span v-if="promptFavs.length" class="wg-chip-badge">{{ promptFavs.length }}</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu wg-fav-menu">
                <p class="wg-menu-title">常用提示词<span class="wg-menu-count">{{ promptFavs.length }}</span></p>
                <p v-if="!promptFavs.length" class="wg-menu-empty">
                  还没有常用提示词
                </p>
                <div v-else class="wg-fav-list">
                  <div v-for="(fp, fpi) in promptFavs" :key="'pf-' + fpi" class="wg-fav-item">
                    <button type="button" class="wg-fav-text" :title="fp" @click="applyPromptFav(fp)">
                      {{ fp }}
                    </button>
                    <button
                      type="button"
                      class="wg-fav-del"
                      :aria-label="`删除第 ${fpi + 1} 条常用提示词`"
                      title="删除"
                      @click="removePromptFav(fp)"
                    >
                      <WgIcon :d="ICONS.close" class="wg-fav-del-icon" />
                    </button>
                  </div>
                </div>
                <template v-if="recentPrompts.length">
                  <p class="wg-menu-title wg-recent-title">
                    最近使用
                    <span class="wg-menu-count">{{ recentPrompts.length }}</span>
                  </p>
                  <div class="wg-fav-list">
                    <div v-for="(rp, rpi) in recentPrompts" :key="'rp-' + rpi" class="wg-fav-item">
                      <button type="button" class="wg-fav-text" :title="rp" @click="applyPromptFav(rp)">
                        {{ rp }}
                      </button>
                    </div>
                  </div>
                </template>
                <div class="wg-fav-foot">
                  <button
                    type="button"
                    class="wg-fav-save"
                    :disabled="!prompt.trim() || isPromptFav"
                    @click="addPromptFav()"
                  >
                    {{ isPromptFav ? '已在常用里' : '存入当前提示词' }}
                  </button>
                </div>
              </div>
            </PickerPopover>

            <!-- 灵感：没思路时随机填一条示例提示词（只填入，不自动发送）。
                 2026-11-21 从页底绝对定位集成进输入框工具条，与「常用」同排。 -->
            <button
              type="button"
              class="wg-chip is-toolbar"
              title="随机换一条灵感提示词"
              aria-label="灵感提示词"
              @click="pickInspiration"
            >
              <WgIcon :d="ICONS.sparkle" />
              <span>灵感</span>
            </button>
          </template>

          <!--
            参数轨：张数 / 画幅 / 尺寸（视频为时长）。
            参数常驻、点一下就改，不必先开弹层再选；弹层只留给需要细选的部分
            （完整的分辨率与比例列表、跳着改张数）。
          -->
          <template #param-rail>
            <!-- 张数前置到分辨率 UI 之前：与「尺寸」同款的安静值按钮，
                 点开是模型支持的全部档位（不再用 − n + 连点）。
                 只有一档的模型不显示：弹层里仅一个「1 张」，没有选择意义。 -->
            <template v-if="countSelectable">
              <span class="wg-rail-group">
                <span class="wg-rail-label">
                  <WgIcon :d="ICONS.stack" class="wg-rail-label-icon" />
                  张数
                </span>
                <PickerPopover v-model:show="countOpen" :width="260">
                  <template #trigger="{ toggle }">
                    <button type="button" class="wg-rail-value" title="张数" @click="toggle">
                      <span>{{ count }} 张</span>
                      <WgIcon :d="ICONS.chevron" />
                    </button>
                  </template>
                  <div class="wg-menu">
                    <p class="wg-menu-title">张数</p>
                    <div class="wg-seg">
                      <button
                        v-for="n in countOptions"
                        :key="n"
                        type="button"
                        class="wg-seg-item"
                        :class="{ 'is-active': count === n }"
                        :aria-pressed="count === n"
                        @click="count = n; countOpen = false"
                      >
                        {{ n }} 张
                      </button>
                    </div>
                  </div>
                </PickerPopover>
              </span>
            </template>

            <template v-if="sizes.length">
              <!-- 张数与分辨率之间用竖线分段；视频态没有张数、单档模型也没有，就不留这条空线 -->
              <span v-if="countSelectable" class="wg-rail-sep" aria-hidden="true"></span>
              <!-- 画幅：把分辨率按方向归成 方 / 横 / 竖 三段，点一段就切到该方向的第一档。
                   只有一种方向时不显示（一个按钮的分段没有选择意义）。 -->
              <span v-if="aspectGroups.length > 1" class="wg-rail-group">
                <span class="wg-rail-label">画幅</span>
                <span class="wg-rail-seg" role="group" aria-label="画幅">
                  <button
                    v-for="g in aspectGroups"
                    :key="g.key"
                    type="button"
                    class="wg-rail-seg-item"
                    :class="{ 'is-active': activeAspect === g.key }"
                    :aria-pressed="activeAspect === g.key"
                    :title="`${g.label}图 ${g.ratio}`"
                    @click="pickAspect(g.key)"
                  >
                    <span class="wg-ratio-box" :style="ratioBoxStyle(g.ratio)" aria-hidden="true"></span>
                    <span>{{ g.label }}</span>
                  </button>
                </span>
              </span>

              <!-- 精确尺寸：点开是完整的分辨率 + 比例列表（同一方向常有 1K / 2K 多档） -->
              <PickerPopover v-model:show="sizeOpen" :width="300">
                <template #trigger="{ toggle }">
                  <button type="button" class="wg-rail-value" title="分辨率与比例" @click="toggle">
                    <span
                      v-if="activeRatio"
                      class="wg-ratio-box"
                      :style="ratioBoxStyle(activeRatio)"
                      aria-hidden="true"
                    ></span>
                    <span>{{ size || sizes[0] }}<template v-if="activeRatio"> · {{ activeRatio }}</template></span>
                    <WgIcon :d="ICONS.chevron" />
                  </button>
                </template>
              <div class="wg-menu">
                <p class="wg-menu-title">分辨率</p>
                <div class="wg-seg">
                  <button
                    v-for="item in sizes"
                    :key="item"
                    type="button"
                    class="wg-seg-item"
                    :class="{ 'is-active': size === item }"
                    @click="size = item"
                  >
                    <!-- 每个分辨率前面带它自身的比例框：同是 1K，方图/横图/竖图一眼分得开 -->
                    <span
                      v-if="ratioOf(item)"
                      class="wg-ratio-box"
                      :style="ratioBoxStyle(ratioOf(item))"
                      aria-hidden="true"
                    ></span>
                    <span>{{ resolutionLabel(item) }}</span>
                  </button>
                </div>
                <template v-if="ratios.length">
                  <p class="wg-menu-title">比例</p>
                  <div class="wg-ratio-grid">
                    <button
                      v-for="item in ratios"
                      :key="item"
                      type="button"
                      class="wg-ratio"
                      :class="{ 'is-active': activeRatio === item }"
                      :aria-pressed="activeRatio === item"
                      @click="pickRatio(item); sizeOpen = false"
                    >
                      <span class="wg-ratio-box" :style="ratioBoxStyle(item)"></span>
                      <span class="wg-ratio-label">{{ item }}</span>
                    </button>
                  </div>
                </template>
              </div>
            </PickerPopover>
            </template>

            <!-- 时长（视频）：与图像的分辨率同一条参数轨，点开是模型支持的离散档位 -->
            <template v-if="mediaType === 'video' && durations.length">
              <span class="wg-rail-sep" aria-hidden="true"></span>
              <span class="wg-rail-group">
                <span class="wg-rail-label">时长</span>
                <PickerPopover v-model:show="durationOpen" :width="300">
                  <template #trigger="{ toggle }">
                    <button type="button" class="wg-rail-value" title="时长" @click="toggle">
                      <span>{{ duration || durations[0] }}s</span>
                      <WgIcon :d="ICONS.chevron" />
                    </button>
                  </template>
              <div class="wg-menu">
                <p class="wg-menu-title">时长</p>
                <!--
                  用分段按钮而不是滑块。durations 是**非连续的离散集合**
                  （如 [4,5,8,10,12]），滑块以 min..max、step=1 铺开会多出
                  6/7/9/11 这些模型不支持的档位，用户拖到那里提交必然失败；
                  而且 Element Plus 的 marks 标签首尾各向外探出半个标签宽，
                  在 overflow:auto 的容器里会直接顶出横向滚动条。
                  分段按钮只暴露合法值，且自带 flex-wrap，两个问题一并消除。
                  与同页「分辨率」用同一套 .wg-seg 样式，保持一致。
                -->
                <div class="wg-seg">
                  <button
                    v-for="item in durations"
                    :key="item"
                    type="button"
                    class="wg-seg-item"
                    :class="{ 'is-active': (duration || durations[0]) === item }"
                    @click="onDurationPick(item); durationOpen = false"
                  >
                    {{ item }}s
                  </button>
                </div>
              </div>
                </PickerPopover>
              </span>
            </template>
          </template>
        </GenerateComposer>

        <!-- 快捷键提示：Enter 语义沿用会话输入库（Enter 发送 / Shift+Enter 换行），这里只把规则亮出来 -->
        <p class="wg-kbd-hint" aria-hidden="true">Ctrl + Enter 发送 · Shift + Enter 换行</p>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="wg-file"
          @change="onFilePicked"
        />

        <!-- 参考图上传后的裁剪弹层：按目标画幅定构图，取消则退回整图直用的原流程 -->
        <GenerateRefCropper
          :open="refCropOpen"
          :src="refCropSrc"
          :aspect-ratio="refCropRatio"
          @update:open="onRefCropOpenChange"
          @confirm="onRefCropConfirm"
        />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, h, nextTick, onActivated, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { apiService } from '../../services/ApiService'
import { useLibraryGroups } from '@/composables/useLibraryGroups'
import type { GenerateModel, GenerateTask, GenerateTaskStatus } from '../../services/modules/generate.api'
import { isInlineMedia, resolveReferenceImage } from '../../services/modules/generate.api'
import { createAuthImageLoader, downloadAuthenticatedFile } from '../../utils/authImage'
import { hydrateInputHistory, rememberInput } from '../../utils/inputHistory'
import { useAuthStore } from '../../stores/auth'
/*
 * 内联媒体（后端存下来的字节）没有请求头可带，只能 fetch + blob 加载。
 * withBaseUrl: false —— 出图媒体地址后端下发时就已含 /v2 前缀，再拼一次就是 /v2/v2/...。
 */
const mediaImages = createAuthImageLoader({ withBaseUrl: false })
/**
 * 媒体地址 → 可直接放进 img.src / video.src 的地址。
 *
 * 后端原样透传的供应商 http/https 地址不需要鉴权，直接给；
 * 内联地址（/v2/ai/generate/tasks/...）走 blob 加载器，令牌不进 URL。
 */
const mediaSrc = (url: string | null | undefined): string =>
  isInlineMedia(url) ? mediaImages.resolve(url) : (url ?? '')
/**
 * 内联媒体是否已确定取回失败（后端字节已丢失 / 接口报错）。
 *
 * <p>失败时加载器只能给 1×1 占位图，放进卡片就是一片空白 —— 用户看不出是「没生成出图」
 * 还是「图丢了」。模板据此换成明确的「原图已丢失」占位。</p>
 */
const mediaFailed = (url: string | null | undefined): boolean =>
  isInlineMedia(url) && mediaImages.failed(url)
/**
 * <video> 专用版本。
 *
 * 加载器未就绪时返回的 1×1 GIF 对 <video> 是**非法媒体源**（会抛媒体错误、
 * 触发一次 error），所以这里给空串让 <video> 保持无源，等 blob 就绪后再挂上。
 */
const mediaVideoSrc = (url: string | null | undefined): string =>
  isInlineMedia(url) && (!mediaImages.isReady(url) || mediaImages.failed(url)) ? '' : mediaSrc(url)
/*
 * 注意：v-viewer 的 default 导出是「插件对象」（只有 install），
 * 真正可用作指令的是具名导出 directive，而它是个工厂函数，
 * 必须调用后才返回带 mounted 钩子的指令。
 * 之前 `import vViewer from 'v-viewer'` 拿的是 default，指令没有 mounted，
 * 所以图片点击预览从未生效。
 */
import { directive as viewerDirective } from 'v-viewer'
import 'viewerjs/dist/viewer.css'

/** 图片预览指令：在 .wg-grid 上使用，v-viewer="viewerOptions" 传 viewerjs 配置 */
const vViewer = viewerDirective({ name: 'viewer' })
import GenerateComposer from './GenerateComposer.vue'
import GenerateRefCropper from './GenerateRefCropper.vue'
import RePageHead from '@/components/ui/RePageHead.vue'
import PickerPopover from '@/components/ui/PickerPopover.vue'
import { getModelAvatarPath } from '../../utils/modelUtils'
import { getProviderLogoPath } from '../models/providerIcons'
import { ElMessageBox } from 'element-plus';

/**
 * 内联 SVG 图标（Heroicons 24 outline 风格）。
 *
 * 统一走 currentColor，颜色由外层 CSS 变量决定，图标本身不带颜色。
 */
const ICONS: Record<string, string> = {
  check: 'm4.5 12.75 6 6 9-13.5',
  circle:
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  chevron: 'm19.5 8.25-7.5 7.5-7.5-7.5',
  download: 'M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3',
  refresh:
    'M16.023 9.348h4.992M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99',
  sparkle:
    'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z',
  close: 'M6 18 18 6M6 6l12 12',
  error:
    'M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z',
  search: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z',
  zoom: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6',
  star: 'M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z',
  grid: 'M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z',
  list: 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5',
  // 张数：叠起来的画框（Heroicons rectangle-stack），表达「这一组有几张」
  stack:
    'M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3',
  dots: 'M12 6h.01M12 12h.01M12 18h.01', // 「更多」菜单：三点竖排（round 线帽下 h.01 渲染成圆点）
  // 按这套参数再来一张：调节滑杆（heroicons adjustments-horizontal）
  tune: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75',
  // 多图对比：并排的两块画框
  compare: 'M4.5 5.25h5.25v13.5H4.5zM14.25 5.25h5.25v13.5h-5.25z',
  // 种子复用：同心圆点，表达「记录里的那个种子值」
  seed: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-6.5 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  // 复制图片：前后叠放的两张「纸」，与复制文本的 copy 区分
  copyImage: 'M8.5 8.5h11v11h-11zM15.5 5.5h-10v10',
  // 停止生成：圆圈里的方块
  stop: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75h4.5v4.5h-4.5Z',
  // 打包下载：带横梁的档案箱（heroicons archive-box）
  zip: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
  // 完成提醒：铃铛（heroicons bell）
  bell: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0',
  image:
    'm2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Z',
  video:
    'm15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z',
  plus: 'M12 4.5v15m7.5-7.5h-15', // 目前仅作图标库保留：新建创作按钮已按需求移除
  filter: 'M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z',
  arrowRight: 'M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3',
  copy: 'M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 9.75 12.375v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.25 2.25 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z',
  trash:
    'm14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0',
}

/** 线性图标组件：统一尺寸与描边，颜色继承 currentColor */
const WgIcon = (props: { d: string }) =>
  h(
    'svg',
    {
      class: 'wg-svg',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.6',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
      focusable: 'false',
    },
    [h('path', { d: props.d })],
  )

/** 状态筛选项 */
const STATUS_OPTIONS: ReadonlyArray<{ key: GenerateTaskStatus | ''; label: string }> = [
  { key: '', label: '全部状态' },
  { key: 'RUNNING', label: '生成中' },
  { key: 'SUCCESS', label: '已完成' },
  { key: 'FAILED', label: '失败' },
  { key: 'CANCELED', label: '已取消' },
]

/** 排序项 */
const SORT_OPTIONS = [
  { key: 'newest' as const, label: '最新优先' },
  { key: 'oldest' as const, label: '最早优先' },
]

/**
 * 生成类型选项。
 *
 * 图像与视频**走同一套后端接口**（`/v2/ai/generate/**`，type 走参数），
 * 由 `GenerateService` 按 type 分派到 `resolveImage()` / `resolveVideo()` 的
 * 不同 SPI。差异只在模型级参数上，已经由 `config` 建模：
 * 图像是 `maxCount`（张数），视频是 `durations`（时长）。
 */
const MEDIA_OPTIONS: ReadonlyArray<{
  value: 'image' | 'video'
  label: string
  desc: string
  icon: 'image' | 'video'
}> = [
  { value: 'image', label: '图像', desc: '文生图', icon: 'image' },
  { value: 'video', label: '视频', desc: '文生视频', icon: 'video' },
]

/** 状态徽标文案 */
const STATUS_TEXT: Record<GenerateTaskStatus, string> = {
  PENDING: '排队中',
  RUNNING: '生成中',
  SUCCESS: '已完成',
  FAILED: '失败',
  CANCELED: '已取消',
}

/** 风格模板：prompt 是拼进提示词的风格描述；缩略图见 {@link STYLE_THUMBS} */
interface StyleTemplate {
  key: string
  name: string
  /**
   * 风格描述：提交时作为 stylePrompt 单独发送，由后端拼接成完整提示词
   * （finalPrompt = 风格描述 + 用户原文）落库并送模型生成，prompt 列仍存用户原文。
   *
   * 风格不是上游 API 参数（多数 OpenAI 兼容渠道会把 style 判为非法参数直接 400）。
   */
  prompt: string
}

/**
 * 东方神话人物志海报模板（2026-11-21 新增风格 mythposter）。
 *
 * 用户提供的完整版式文案按原样入库；按要求「不能写死、需要通用化」——
 * 首句的示例人物【孙悟空】改为占位符【人物名称】，其余本就是占位写法，保持原文。
 * 选中该风格后由后端拼接：本模板 + 用户输入（人物名等）；用户文本已包含整段
 * 模板时后端会去重，不会重复拼接。未配缩略图，走「色块 + 风格名」占位兜底。
 */
const MYTH_POSTER_PROMPT = `请基于【人物名称】生成一张竖版 A4「东方神话人物志」百科海报。

你是一名东方神话视觉设定师、古籍图谱设计师和中文信息图设计师。请根据【人物名称】在东方神话、民间传说、古籍、戏曲、文学或传统文化中的已知形象，生成一张内容完整、视觉统一、具有东方神话气质的人物档案海报。

最重要原则：
全部内容必须围绕【人物名称】展开，不要套用通用神仙模板。
人物形象、法器、坐骑、神通、典故、象征物、背景场景都必须符合【人物名称】的神话设定。
如果该人物存在多个传说版本，请采用最广为人知的版本；存在异文时，可以在相关板块简短标注“传说版本不一”。
不确定的信息不要强行编造，可写“民间传说中多有异文”或“相关记载较少”。
不要使用北欧符文、维京图腾、哥特边框、西方盔甲、欧式城堡、西幻恶魔角、赛博朋克元素。
整体必须是东方神话审美，而不是“西幻人物换中式衣服”。
整体视觉风格：
东方神话史诗感，融合《山海经》异兽图谱、敦煌壁画、青绿山水、唐代人物画、宋元古画、青铜器纹样、古籍注疏和符箓篆刻风格。画面庄重、神秘、古雅、华丽但克制。
画面构图：

竖版 A4 海报，中轴对称布局。中央为【人物名称】的全身或半身主视觉，姿态庄严，有神性和叙事感。人物服饰、发冠、法器、神态、灵兽、背景都要符合该人物传说。左右两侧为信息卡片，底部为核心总结。四周使用云雷纹、回纹、青铜纹、祥云纹、卷草纹、山海纹、篆刻印章式边框。
主标题：“【人物名称】”
副标题：“东方神话人物志｜根据该人物神话传说生成”
顶部精神题记：请根据【人物名称】的核心精神，自动生成一句古雅、凝练、有哲学意味的题记。题记要体现该人物背后的价值观、生命姿态或精神内核，而不是说明性文字。不要写“非史实考证”“仅供参考”“传说版本”等免责声明。字数控制在 12-28 字，适合放在标题下方。题记应与人物高度绑定，不要套用“守护苍生”“大道无边”等空泛句式。

请生成以下内容板块：
【1. 神格身份】说明【人物名称】在东方神话体系中的身份定位。
【2. 神话源流】说明该人物主要出自哪些神话、古籍、民间传说、小说、戏曲或宗教信仰。
【3. 司职权柄】总结该人物掌管或象征的领域。
【4. 形象特征】描述该人物的典型外貌、服饰、神态、姿态和视觉气质。
【5. 法器神通】展示该人物最具代表性的法器、兵器、符咒、神通或能力。
【6. 灵兽坐骑 / 随身象征】如果【人物名称】有坐骑、灵兽、伴生生灵，请展示其名称、形态和寓意。如果没有明确坐骑，请改为“随身象征物”或“相关意象”。不要强行给每个人物安排龙、凤、仙鹤或麒麟。
【7. 典故出处】列出 2-4 个与【人物名称】相关的经典故事、传说片段或文化典故。不要虚构不存在的典故。若版本不一，请标注“异文较多”。
【8. 象征意象】提炼该人物最核心的视觉符号。符号必须与【人物名称】相关。
【9. 神话谱系】说明该人物与其他神话人物、阵营、族属或体系的关系。如果谱系不明确，请写“谱系传说不一”。
【10. 文化影响】说明该人物在民俗、节日、祭祀、文学、戏曲、绘画、庙宇、影视或现代文化中的影响。
【11. 精神内核】从神话叙事角度总结该人物象征的精神。这里只分析神话形象，不推断真实人物性格。
【12. 核心总结】用一段古雅但易懂的中文总结【人物名称】：“【人物名称】在东方神话中象征……，其形象融合了……，代表着……。”

视觉版式要求：
顶部：大标题 + 副标题 + 精神题记。
中央：人物主视觉，气势庄重，细节丰富。
左侧栏目：神格身份、神话源流、司职权柄、形象特征、法器神通。
右侧栏目：灵兽坐骑/随身象征、典故出处、象征意象、神话谱系、文化影响。
底部：精神内核 + 核心总结。
可加入小型图标、注释线、古籍标签、卷轴卡片、青铜铭牌、朱砂印章、符箓纹样。
信息卡片像古书页、玉简、青铜牌、卷轴或碑铭，不要像现代科技 UI。

材质与纹样：
宣纸肌理、矿物颜料、鎏金线条、朱砂印章、墨色晕染、青铜器铭文、云雷纹、回纹、祥云纹、山水纹、敦煌藻井纹样。

配色规则：
根据【人物名称】的属性自动选择东方配色。火焰 / 战斗 / 护法：朱砂、玄黑、鎏金、赤红。月亮 / 水系 / 清冷神祇：黛青、银白、月白、石蓝。山川 / 木系 / 自然神灵：石绿、青黛、玉白、赭石。帝王 / 天庭 / 尊神：鎏金、玄黑、朱砂、玉白。妖灵 / 山海异兽：墨黑、铜绿、暗金、赭红。不要所有人物都使用同一套配色。

文字要求：
中文必须清晰可读，标题大气，正文简短准确。不要乱码、伪文字、错别字、文字重叠或裁切。如果空间不足，优先压缩正文，但保留所有板块标题。

避免：
北欧符文、维京风、哥特边框、西方盔甲、欧式城堡、魔幻游戏 UI、赛博朋克、现代科技感、过度暗黑、随机龙凤、无关法器、模板化神仙形象、与【人物名称】无关的典故、空泛精神题记。`

const STYLE_TEMPLATES: ReadonlyArray<StyleTemplate> = [
  { key: '', name: '无风格', prompt: '' },
  { key: 'photo', name: '胶片写实', prompt: '35mm 胶片摄影，写实光影，细腻颗粒，浅景深' },
  { key: 'anime', name: '动漫二次元', prompt: '日系动漫风格，赛璐璐上色，清晰线稿，鲜明配色' },
  { key: 'ink', name: '国风水墨', prompt: '中国水墨画，墨色晕染，大量留白，写意笔触' },
  { key: 'cyber', name: '赛博霓虹', prompt: '赛博朋克风，霓虹光效，高对比冷暖撞色，未来都市' },
  { key: 'clay', name: '黏土立体', prompt: '黏土材质，圆润立体，柔和棚拍布光，手办质感' },
  { key: 'product', name: '商业产品', prompt: '商业产品摄影，干净背景，专业棚拍布光，高细节' },
  { key: 'sketch', name: '铅笔线稿', prompt: '铅笔素描线稿，单色，明暗排线，纸张质感' },
  { key: 'pixel', name: '像素怀旧', prompt: '像素艺术，8-bit 复古游戏风，有限色板' },
  // 2026-11-14 扩充：原有 8 种集中在「写实 / 动漫 / 平面插画」，缺油画、水彩这类
  // 传统画种，也缺 3D、微缩这类近两年常见的出图方向，用户可选项偏窄。
  // 缩略图同批补齐（同一主体 + 该风格描述生成，见 STYLE_THUMBS）。
  { key: 'oil', name: '油画厚涂', prompt: '古典油画，厚涂笔触，画布肌理，暖调侧光，油料光泽' },
  { key: 'watercolor', name: '水彩晕染', prompt: '水彩画，湿画法晕染，颜色自然扩散，留白与纸纹' },
  { key: 'cinematic', name: '电影剧照', prompt: '电影剧照，宽银幕构图，戏剧性布光，胶片颗粒与冷调色' },
  { key: 'render3d', name: '3D 渲染', prompt: '三维渲染，PBR 材质，柔和全局光照，干净背景，高精度细节' },
  { key: 'guofeng', name: '国潮工笔', prompt: '中国工笔画，细线勾勒，矿物颜料上色，云纹与金线装饰' },
  { key: 'lowpoly', name: '低多边形', prompt: '低多边形三维艺术，几何切面，简洁配色，等距视角' },
  { key: 'vaporwave', name: '蒸汽波', prompt: '蒸汽波美学，粉紫渐变，网格地平线，复古故障与光泽质感' },
  { key: 'isometric', name: '等距微缩', prompt: '等距微缩场景，玩具模型质感，移轴效果，精致小世界' },
  // 2026-11-21 新增：3/4 格漫画。英文描述由前端代拟（用户委托生成），四格分镜 +
  // 描边 + 网点 + 对话气泡的漫画要素；未配缩略图，走「色块 + 风格名」占位兜底。
  {
    key: 'comic34',
    name: '3/4格漫画',
    prompt:
      '3/4-panel comic strip, four sequential panels with clean white gutters, bold black ink outlines, halftone dot shading, vivid flat colors, dynamic poses and expressive faces, speech balloons, classic comic book art',
  },
  // 2026-11-21 新增：东方神话人物志海报（用户提供的完整版式模板，见 MYTH_POSTER_PROMPT）。
  // 模板已按要求通用化（人物名称占位，不写死具体人物）；未配缩略图，走「色块 + 风格名」占位兜底。
  {
    key: 'mythposter',
    name: '神话人物志海报',
    prompt: MYTH_POSTER_PROMPT,
  },
]

/**
 * 内置风格的缩略图（放在 public/gen-style 下，构建时原样拷贝）。
 *
 * 这些图是按「同一主体（雨后黄昏的日式小镇街道）+ 该风格描述」在本系统里跑
 * 生图接口批量生成的（脚本：test/vue/ai-sweep/gen-style-thumbs.cjs +
 * shrink-style-thumbs.cjs），主体一致，差异只来自风格本身。
 *
 * 必须是 **.webp**：仓库根 .gitignore 有一行全局 `*.jpg`（本意是挡调试截图），
 * 早先这套缩略图用 .jpg，结果只进了工作区没进版本库，换台机器/清理一次就全没了，
 * 页面里 8 格有 7 格是破图。webp 不在忽略名单里，能跟着提交走。
 *
 * 表里没有对应文件的 key（模型管理里自配的风格）会退到「真用过该风格」的生成结果，
 * 都没有时用按 key 固定的色块 + 风格名占位 —— 配错图比没图更误导。
 */
/**
 * 缩略图地址的版本串。
 *
 * <p>静态目录没接上时，dev server / 反向代理会把 `/gen-style/xx.webp` 回成
 * `200 + text/html`（也就是 index.html），浏览器照样缓存这个坏响应 ——
 * 补上文件后用户刷新仍是破图。地址带上版本串，换一版就绕开旧缓存；
 * 换图或有新环境部署时把这个数字 +1。</p>
 *
 * <p>2026-11-16：补齐后 8 种风格缩略图时 +1 —— 文件缺失期间被缓存的坏响应
 * 按原地址仍会命中，只有换地址才能让老浏览器重新取图。</p>
 */
const STYLE_THUMB_VERSION = '3'

const STYLE_THUMBS: Readonly<Record<string, string>> = Object.freeze({
  ...Object.fromEntries(
    [
      'photo',
      'anime',
      'ink',
      'cyber',
      'clay',
      'product',
      'sketch',
      'pixel',
      // 2026-11-14 新增的 8 种：同一主体、同一套出图口径补的缩略图
      'oil',
      'watercolor',
      'cinematic',
      'render3d',
      'guofeng',
      'lowpoly',
      'vaporwave',
      'isometric',
    ].map((key) => [key, `${import.meta.env.BASE_URL}gen-style/${key}.webp?v=${STYLE_THUMB_VERSION}`]),
  ),
  // 2026-11-21 新增两风格的缩略图：出图上游（Pollinations）只回 jpeg，而仓库 .gitignore
  // 全局忽略 *.jpg，故落成 .png（PNG 不在忽略名单，能跟仓库走）。
  comic34: `${import.meta.env.BASE_URL}gen-style/comic34.png?v=${STYLE_THUMB_VERSION}`,
  mythposter: `${import.meta.env.BASE_URL}gen-style/mythposter.png?v=${STYLE_THUMB_VERSION}`,
})

/** 收藏持久化键：生成接口暂无收藏字段，用本地集合让「仅收藏」真正生效 */
const FAVORITE_KEY = 'ai-guada:generate-favorites'

/**
 * 灵感提示词池：空态示例与输入条旁的「灵感」按钮共用。
 *
 * <p>空态只写「开始生成」等于把「写什么」这件难事丢回给用户；给一批可点的短句，
 * 点一下即填进输入条（不自动提交，仍由用户按生成）。选的都是生图常见的题材，
 * 不绑定具体模型能力（不含参考图、不含视频参数）。</p>
 */
const INSPIRATION_POOL = [
  '雨夜的旧街，霓虹灯映在积水里',
  '清晨的窗台，一杯咖啡和一本书',
  '海边的灯塔，黄昏，长焦压缩感',
  '雪后初晴的山谷，一条蜿蜒的小路',
  '深秋的银杏道，落叶铺满地面',
  '老城区的巷口，修鞋匠的摊位',
  '沙漠中的孤树，正午烈日，广角',
  '地铁车厢里打盹的上班族，纪实风',
  '山顶观测站，星空银河，超广角',
  '江南水乡的清晨，石桥与乌篷船',
  '废弃工厂里的光斑，丁达尔效应',
  '春日茶园，采茶人背对镜头',
  '城市天台夜景，远处霓虹模糊成光斑',
  '冬日湖面，一只孤独的水鸟',
  '热带雨林的苔藓与菌类，微距',
  '黄昏的机场舷窗，机翼与云海',
  '老式咖啡馆吧台，暖光与蒸汽',
  '暴雨将至的麦田，乌云压境',
] as const

/** 空态洗牌种子：点「换一批」+1；同一种子结果稳定 */
const emptySampleSeed = ref(1)

/**
 * 空态展示的 3 条：按种子洗牌后取前 3。
 *
 * <p>用种子线性同余洗牌而不是 Math.random：computed 在渲染期求值，
 * 随机会让每次重渲染都换一批，「换一批」按钮就失去含义了。</p>
 */
const emptySamples = computed(() => {
  const arr = [...INSPIRATION_POOL]
  let s = (emptySampleSeed.value * 2654435761) % 2147483647 || 1
  const rand = () => {
    s = (s * 16807) % 2147483647
    return s / 2147483647
  }
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
  return arr.slice(0, 3)
})

/**
 * 「灵感」按钮：随机填一条与当前输入不同的提示词（只填入，不自动发送）。
 * prompt 在下方才声明，这里只在其函数体内引用，调用发生在 setup 完成后。
 */
const pickInspiration = () => {
  const current = prompt.value.trim()
  const pool = INSPIRATION_POOL.filter((p) => p !== current)
  prompt.value = pool[Math.floor(Math.random() * pool.length)]
}

const readFavorites = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

/** v-viewer 配置：缩放 / 旋转 / 上下翻页 */
const viewerOptions = {
  toolbar: {
    zoomIn: 1,
    zoomOut: 1,
    oneToOne: 1,
    reset: 1,
    prev: 1,
    next: 1,
    rotateLeft: 1,
    rotateRight: 1,
    flipHorizontal: 1,
    flipVertical: 1,
  },
  movable: true,
  zoomable: true,
  scalable: false,
  transition: true,
  keyboard: true,
  tooltip: 1,
  zIndex: 4000,
} as const

const mediaType = ref<'image' | 'video'>('image')
const models = ref<GenerateModel[]>([])
const model = ref('')
const prompt = ref('')
const size = ref('')
const count = ref(1)
const duration = ref<number | undefined>(undefined)
const style = ref('')
const referenceImage = ref('')
const submitting = ref(false)

const tasks = ref<GenerateTask[]>([])

/**
 * 是否已有未完成的任务。
 *
 * <p>一次只允许一个任务在跑：既避免同一供应商额度被并发打爆、也避免结果互相穿插
 * 难以辨认。前端据此禁用发送，后端 {@code GenerateService#create} 也会再拦一道
 * ——前端限制只是体验，后端限制才是约束。</p>
 */
const hasRunningTask = computed(() => {
  const active = tasks.value.some((t) => t.status === 'PENDING' || t.status === 'RUNNING')
  // 「已用时」的时钟跟着它启停：没有运行中的任务时它没有消费者，开着只是白每秒重渲染。
  // 放在这里而不是散在七八个分支里，省得某个分支忘了关。
  syncTick(active)
  return active
})

/** 进行中（含排队）任务数：标题栏「N 个生成中」徽章用 */
const runningCount = computed(
  () => tasks.value.filter((t) => t.status === 'PENDING' || t.status === 'RUNNING').length,
)

/**
 * 生成中把数量带进浏览器标签页标题：切去别的标签页也能瞄一眼还剩几个在跑。
 * 只给自己的标题加/摘固定前缀，不保存整条原标题——路由中途改标题也不会还原错。
 */
const DOC_TITLE_RUNNING = /（\d+ 个生成中）/

watch(runningCount, (n) => {
  if (n > 0) {
    const base = DOC_TITLE_RUNNING.test(document.title)
      ? document.title.replace(DOC_TITLE_RUNNING, '')
      : document.title
    document.title = `（${n} 个生成中）${base}`
  } else if (DOC_TITLE_RUNNING.test(document.title)) {
    document.title = document.title.replace(DOC_TITLE_RUNNING, '')
  }
})

onUnmounted(() => {
  if (DOC_TITLE_RUNNING.test(document.title)) {
    document.title = document.title.replace(DOC_TITLE_RUNNING, '')
  }
})

/** 点「N 个生成中」徽章：回到画廊并只看进行中的任务，不必自己开筛选弹层 */
const focusRunning = () => {
  statusFilter.value = 'RUNNING'
  if (viewMode.value !== 'gallery') {
    setViewMode('gallery')
  }
}

/** 首次加载历史期间为 true，用于骨架屏 */
const loading = ref(false)/**
 * 是否存在可用的视频模型。
 *
 * 后端 `GenerateSpiRouter.KNOWN_VIDEO_SPI` 目前只有 zhipu 实现了 VideoClient，
 * openai 等协议 `resolveVideo()` 直接返回 null 客户端。没有视频模型时
 * 保留「视频」入口会让用户切过去只看到空列表，所以直接不显示该 tab。
 */
const videoAvailable = ref(false)

/**
 * 生成类型切换属于「跳转」语义（下方模型列表与历史都会重载），
 * 选完必须关掉弹层，否则它挡住刷新后的页面。开合状态见 mediaOpen。
 */

/** 当前生成类型的中文名（标题与切换按钮共用） */
const mediaLabel = computed(() => (mediaType.value === 'video' ? '视频' : '图像'))

const keyword = ref('')
const modelFilter = ref('')
const statusFilter = ref<GenerateTaskStatus | ''>('')
const onlyFavorite = ref(false)
const sortOrder = ref<'newest' | 'oldest'>('newest')

/** 时间范围：以当前时刻回看的滑动窗口（近 24 小时 / 7 天 / 30 天），空串=不过滤 */
type TimeRangeKey = '' | 'day' | 'week' | 'month'
const TIME_RANGE_OPTIONS: ReadonlyArray<{
  key: TimeRangeKey
  label: string
  spanMillis: number
}> = [
  { key: '', label: '全部时间', spanMillis: 0 },
  { key: 'day', label: '近 24 小时', spanMillis: 24 * 3600_000 },
  { key: 'week', label: '近 7 天', spanMillis: 7 * 24 * 3600_000 },
  { key: 'month', label: '近 30 天', spanMillis: 30 * 24 * 3600_000 },
]
const timeRange = ref<TimeRangeKey>('')
/**
 * 作品区形态。01 画廊（多列作品墙）与 05 舞台（暗色沉浸单张）两个都要，
 * 切换入口在页面头右上角；记住上一种形态，刷新后不跳回默认。
 */
type ViewMode = 'gallery' | 'stage'
const VIEW_MODE_KEY = 'wg:view-mode'

const readViewMode = (): ViewMode => {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'stage' ? 'stage' : 'gallery'
  } catch {
    return 'gallery'
  }
}

const viewMode = ref<ViewMode>(readViewMode())
/** 舞台里当前看的是哪条记录、第几张（从画廊点进来时写入） */
const stageTaskId = ref('')
const stageItemIndex = ref(0)

watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    // 隐私模式 / 配额满：形态不记忆，本次会话内照常切换
  }
})
const favorites = ref<string[]>(readFavorites())

const authStore = useAuthStore()

/**
 * 生图提示词历史（输入框 ↑↓ 切换）。
 *
 * <p>与会话页共用 utils/inputHistory 的存储实现，但用 `generate` 分组：
 * 会话里是追问，生图这边是画面描述，混在一个列表里翻起来很乱。
 * 按用户分键，同一浏览器多账号不串内容；清空历史记录不影响这里。</p>
 */
const promptHistory = ref<string[]>([])

watch(
  () => authStore.user?.username,
  (name) => {
    // 历史存在 IndexedDB 里（加密），读取是异步的：watch 立即触发一次，用户名变化时重读
    void hydrateInputHistory(name, 'generate').then((list) => {
      if (String(name ?? '') === String(authStore.user?.username ?? '')) promptHistory.value = list
    })
  },
  { immediate: true },
)

const canvasRef = ref<HTMLElement | null>(null)
const composerRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

/** 距顶超过该值（约两屏）显示「回到顶部」 */
const BACK_TOP_THRESHOLD = 1200
const showBackTop = ref(false)

const scrollToTop = () => {
  canvasRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
}

/**
 * 每个任务一个轮询定时器。
 *
 * 之前所有任务共用一个 pollTimer 变量，后提交的任务会覆盖前一个，
 * 于是先提交的任务永远等不到终态、进度条卡在中间；
 * 删除记录时也停不掉对应的轮询。现在按 taskId 分别登记，删除/卸载时逐个清。
 */
const pollTimers = new Map<string, ReturnType<typeof setTimeout>>()

const currentModels = computed(() => models.value.filter((item) => item.type === mediaType.value))

/* ---------- 下拉选择的开合状态 ----------
 * 会话页的每个下拉都是「点触发器开、选中或点外部关」，这里保持一致。
 * 每个弹层各一个 ref：点另一个芯片时，前一个由 CustomPopover 的「点外部关闭」收起。 */
const mediaOpen = ref(false)
const filterOpen = ref(false)
const recordsOpen = ref(false)
const sortOpen = ref(false)
const modelOpen = ref(false)
const sizeOpen = ref(false)
const durationOpen = ref(false)
const countOpen = ref(false)

/** 模型弹层里的检索词：模型多了以后，会话侧同样是先给检索框再列模型 */
const modelKeyword = ref('')

/** 检索后的模型列表：名称 / 模型编码 / 供应商名三处都能命中 */
const modelMenuOptions = computed(() => {
  const kw = modelKeyword.value.trim().toLowerCase()
  if (!kw) {
    return currentModels.value
  }
  return currentModels.value.filter((opt) =>
    `${modelLabel(opt.model)} ${opt.model} ${opt.providerName}`.toLowerCase().includes(kw),
  )
})

const currentConfig = computed(() => currentModels.value.find((item) => item.model === model.value)?.config)
const sizes = computed(() => currentConfig.value?.sizes ?? [])
const maxCount = computed(() => Math.max(1, currentConfig.value?.maxCount ?? 1))
const durations = computed(() => currentConfig.value?.durations ?? [])
const countOptions = computed(() => Array.from({ length: maxCount.value }, (_, i) => i + 1))

/**
 * 张数是否值得给一档选择。
 *
 * <p>只有 1 个档位时，弹层里就一个「1 张」按钮：点开没有可选项、关掉也没变化，
 * 是纯噪声。这种模型（如 maxCount=1 的 agnes-image-2.5-flash）直接不显示张数轨，
 * 与卡片详情里「张数为 1 不出条目」同一口径。</p>
 */
const countSelectable = computed(() => mediaType.value === 'image' && countOptions.value.length > 1)

/** 切模型后档位可能变少（4 张的模型 → 只支持 1 张的）：夹回上限，
 *  否则提交的 count 会超出模型能力，而张数轨在单档时是隐藏的，用户改不回来。 */
watch([maxCount, mediaType], () => {
  if (count.value > maxCount.value) {
    count.value = maxCount.value
  }
})

/**
 * 风格可选项。
 *
 * 模型可在模型管理里通过生成参数的 {@code styles} 指定支持的风格 key 列表；
 * 未指定时沿用内置默认表。key 与内置表同名时复用其中文名，否则直接显示 key。
 */
const styleOptions = computed<ReadonlyArray<StyleTemplate>>(() => {
  const configured = currentConfig.value?.styles
  if (!configured?.length) {
    return STYLE_TEMPLATES
  }
  return configured.map((key) => {
    const builtin = STYLE_TEMPLATES.find((item) => item.key === key)
    return {
      key,
      name: builtin?.name ?? key,
      // 只配了 key、内置表里没有的：以 key 本身作为风格描述兜底
      prompt: builtin?.prompt || key,
    }
  })
})

/** 当前模型是否支持风格：风格是拼进提示词的描述，默认支持，仅模型显式声明 false 时才关闭 */
const styleSupported = computed(() => currentConfig.value?.style !== false)

/**
 * 当前模型是否支持参考图（图生图）。
 *
 * <p>输入条工具按钮与「再次生成」的参考图回填共用这一个判断：模型不支持时
 * 入口一起消失，免得点开发现选不了。</p>
 */
const referenceSupported = computed(() => !!currentConfig.value?.referenceImage)

/* ---------- 高级参数（负面提示词 / 随机种子 / 推理步数） ----------
 * 能力位来自模型配置（capabilities[].generate），与风格 / 参考图同一口径：
 * 模型声明了才在「高级参数」面板里给输入位，没声明的不露出，提交也不带。
 * 值是会话内的一次性输入：切模型 / 切媒体类型后清空，避免把 A 模型的种子带给 B 模型。 */
const negativeSupported = computed(() => !!currentConfig.value?.negativePrompt)
const seedSupported = computed(() => !!currentConfig.value?.seed)
const stepsMin = computed(() => currentConfig.value?.stepsMin ?? null)
const stepsMax = computed(() => currentConfig.value?.stepsMax ?? null)
const stepsDefault = computed(() => currentConfig.value?.stepsDefault ?? null)
/** 步数只要给了任一边界/默认值就算支持，前端按 min/max 夹紧后再提交 */
const stepsSupported = computed(
  () => stepsMin.value !== null || stepsMax.value !== null || stepsDefault.value !== null,
)
/** 任一高级参数可用才渲染「高级参数」芯片 */
const advAvailable = computed(
  () => negativeSupported.value || seedSupported.value || stepsSupported.value,
)

const advOpen = ref(false)
const advNegative = ref('')
// v-model.number 在输入框清空时回填的是空串，所以留出 string 形态；提交前统一用 Number() 归一
const advSeed = ref<number | string>('')
const advSteps = ref<number | string>('')

/** 芯片高亮与角标：已设置的参数个数（负面提示词 / 种子 / 步数各计 1） */
const advActiveCount = computed(
  () =>
    (advNegative.value.trim() ? 1 : 0)
    + (advSeed.value !== '' ? 1 : 0)
    + (advSteps.value !== '' ? 1 : 0),
)
const advActive = computed(() => advActiveCount.value > 0)

/* ---------- 草稿持久化：提示词与参数刷新 / 切页不丢 ----------
 * 输入历史（rememberInput）只存「提交过」的句子；这里存「正在打、还没提交」的现场。
 * 长提示词写到一半刷新是最痛的丢失场景，高级参数（负面词 / 种子 / 步数）同样值得保。
 * 参考图不入草稿：base64 体积轻松撑爆 localStorage 配额，且提示词在、图重传即可。
 *
 * 恢复必须在 setup 期内、「切模型清空高级参数」的 watch（下方 watch([model, mediaType])）
 * 注册之前完成：watch 只对注册之后的变更生效，先恢复后注册才不会被自己的恢复动作清掉。
 * 唯一的交点是 2099 行的 count 钳制 watch——它只在 mediaType 变化时触发，而视频不用 count，
 * 图像恢复时 mediaType 不变，count 不会被钳掉；模型加载后再按真实上限钳一次，正是想要的。 */
const DRAFT_KEY = 'ai-guada:generate-draft'

interface GenerateDraft {
  prompt?: string
  mediaType?: 'image' | 'video'
  model?: string
  size?: string
  count?: number
  duration?: number | null
  style?: string
  negative?: string
  seed?: number | string
  steps?: number | string
}

const saveDraft = () => {
  try {
    // 空提示词不存（并清掉旧草稿）：提交成功后 prompt 被清空，草稿随之自然失效
    if (!prompt.value.trim()) {
      localStorage.removeItem(DRAFT_KEY)
      return
    }
    const draft: GenerateDraft = {
      prompt: prompt.value,
      mediaType: mediaType.value,
      model: model.value,
      size: size.value,
      count: count.value,
      duration: duration.value ?? null,
      style: style.value,
      negative: advNegative.value,
      seed: advSeed.value,
      steps: advSteps.value,
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // 隐私模式 / 配额满：草稿不可用不影响生成主流程
  }
}

/** @return 是否真的恢复出一份草稿（有非空提示词才算），供调用方决定要不要提示 */
const restoreDraft = (): boolean => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) {
      return false
    }
    const draft = JSON.parse(raw) as GenerateDraft
    if (!draft.prompt?.trim()) {
      return false
    }
    if (draft.mediaType === 'image' || draft.mediaType === 'video') {
      mediaType.value = draft.mediaType
    }
    // 模型名可能已下架：先原样恢复，提交时的 loadModels + 后端校验会给出明确报错
    if (draft.model) {
      model.value = draft.model
    }
    if (draft.size) {
      size.value = draft.size
    }
    if (typeof draft.count === 'number' && draft.count >= 1) {
      count.value = draft.count
    }
    if (typeof draft.duration === 'number' && draft.duration > 0) {
      duration.value = draft.duration
    }
    if (draft.style) {
      style.value = draft.style
    }
    if (draft.negative) {
      advNegative.value = draft.negative
    }
    if (draft.seed !== undefined && draft.seed !== null && draft.seed !== '') {
      advSeed.value = draft.seed
    }
    if (draft.steps !== undefined && draft.steps !== null && draft.steps !== '') {
      advSteps.value = draft.steps
    }
    prompt.value = draft.prompt
    return true
  } catch {
    // 脏数据（版本变更 / 手改）：直接丢弃，不给页面留半套状态
    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      /* 忽略 */
    }
  }
  return false
}

// 草稿回填是静默改状态：不提示，用户会奇怪输入框里怎么已经有词了
if (restoreDraft()) {
  message.info('已恢复上次未提交的草稿')
}

watch(
  [prompt, mediaType, model, size, count, duration, style, advNegative, advSeed, advSteps],
  () => saveDraft(),
)

/** 一键清空高级参数（切模型 / 切媒体类型的 watch 也走这里） */
const resetAdvParams = () => {
  advNegative.value = ''
  advSeed.value = ''
  advSteps.value = ''
}

/** 负面提示词预设：出图场景最高频的几组排除词，点击追加（已存在的不重复加） */
const NEGATIVE_PRESETS: Array<{ label: string; text: string }> = [
  { label: '低质量', text: 'low quality, worst quality, jpeg artifacts' },
  { label: '水印文字', text: 'watermark, text, logo, signature' },
  { label: '多余肢体', text: 'extra limbs, extra fingers, deformed hands' },
  { label: '模糊', text: 'blurry, out of focus, lowres' },
]
const applyNegativePreset = (text: string) => {
  const parts = advNegative.value
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.some((p) => p.toLowerCase() === text.toLowerCase())) {
    return
  }
  parts.push(text)
  advNegative.value = parts.join(', ')
}

const stepsPlaceholder = computed(() => {
  if (stepsDefault.value !== null) return `默认 ${stepsDefault.value}`
  if (stepsMin.value !== null && stepsMax.value !== null) {
    return `${stepsMin.value} ~ ${stepsMax.value}`
  }
  return '留空按模型默认'
})

// 切模型 / 切媒体类型：高级参数是针对具体模型填的，一并清空并收起面板
watch([model, mediaType], () => {
  advOpen.value = false
  resetAdvParams()
})

/** @ 风格面板是否打开 */
const stylePanelOpen = ref(false)

/**
 * 风格面板（芯片点开的弹层）是否打开。
 *
 * <p>与 `@` 风格面板（stylePanelOpen）互不影响：一个是轨上芯片的下拉，
 * 一个是输入框里打 `@` 唤起的模态，各自记住自己的开关状态。</p>
 */
const styleOpen = ref(false)

/**
 * 真实风格项（key 非空）。
 *
 * 「无风格」不是一项风格，而是「不加风格」，在芯片弹层里单独占一格，
 * 故不进这份列表：`@` 面板只列真实风格。
 * 之前直接遍历 styleOptions，把内置表里的空 key 项也渲染了一遍，
 * 结果最左侧并排出现两个「无风格」，还同时是选中态。
 */
const realStyles = computed(() => styleOptions.value.filter((item) => !!item.key))

/**
 * @ 风格面板的风格项。
 *
 * 缩略图与描述都从 realStyles 取，与风格芯片面板共用同一份数据 ——
 * 两处各维护一份必然漂移（之前「风格缩略图和文字对不上」就是这么来的）。
 */
const stylePanelItems = computed(() =>
  realStyles.value.map((item) => ({
    key: item.key,
    name: item.name,
    prompt: item.prompt,
    thumb: styleThumb(item.key),
  })),
)

/**
 * 风格芯片弹层里的格子：「无风格」+ 全部真实风格。
 *
 * <p>与 {@link stylePanelItems} 同源，只是多一格「无风格」—— 弹层里必须能退回
 * 「不加风格」，而 `@` 面板的「无风格」是输入框里删掉标记，不需要这一格。</p>
 *
 * <p>`thumb` 为空表示没有可用预览图：模板退到按 key 固定色相的色块 + 风格名，
 * 不拿别的风格的成图冒充。</p>
 */
const styleMenuItems = computed(() =>
  styleOptions.value.map((item) => ({
    key: item.key,
    name: item.name,
    prompt: item.prompt,
    thumb: item.key ? styleThumb(item.key) : '',
    hue: styleHue(item.key || 'none'),
  })),
)

/** 当前风格的描述文本：提交时作为 stylePrompt 单独发送，由后端拼接成完整提示词 */
const stylePrompt = computed(
  () => styleOptions.value.find((item) => item.key === style.value)?.prompt ?? '',
)

/** 把 "1792x1024" 约分成比例 "16:9" */
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

const ratioOf = (value: string | null) => {
  const matched = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec((value ?? '').trim())
  if (!matched) {
    return ''
  }
  const w = Number(matched[1])
  const h = Number(matched[2])
  if (!w || !h) {
    return ''
  }
  const g = gcd(w, h)
  return `${w / g}:${h / g}`
}

/** 生成中占位卡按目标尺寸保持同比例，不写死方图 */
const aspectOf = (value: string | null) => {
  const matched = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec((value ?? '').trim())
  return matched ? `${matched[1]} / ${matched[2]}` : '1 / 1'
}

const ratios = computed(() => {
  const set = new Set<string>()
  for (const item of sizes.value) {
    const r = ratioOf(item)
    if (r) {
      set.add(r)
    }
  }
  return [...set]
})

const activeRatio = computed(() => ratioOf(size.value))

/**
 * 画幅分组：把该模型支持的分辨率按宽高关系归成 方 / 横 / 竖 三段。
 *
 * <p>模型的分辨率列表常同时混着 "1024x1024"、"1280x720"、"768x1280" 这类
 * 不同方向的档位，逐条列出来要点好几次才知道哪个是竖图。按方向归组后
 * 轨道上只留三段，点「竖」就直接切到该方向的第一档；组内还有 1K / 2K
 * 多档时由精确尺寸入口继续选。</p>
 *
 * <p>只有一种方向时不返回分组（一个按钮的分段没有选择意义，模板里也就不渲染）。</p>
 */
interface AspectGroup {
  key: 'square' | 'landscape' | 'portrait'
  label: string
  ratio: string
  size: string
}

const aspectGroups = computed<AspectGroup[]>(() => {
  const groups: AspectGroup[] = []
  const push = (key: AspectGroup['key'], label: string, size: string) => {
    const ratio = ratioOf(size)
    if (!ratio) {
      return
    }
    // 同一方向的多个档位只留第一个：分段按钮表达「我要这个方向」，档位交给精确尺寸
    if (groups.some((item) => item.key === key)) {
      return
    }
    groups.push({ key, label, ratio, size })
  }
  for (const item of sizes.value) {
    const matched = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec(item.trim())
    if (!matched) {
      continue
    }
    const w = Number(matched[1])
    const h = Number(matched[2])
    if (w === h) {
      push('square', '方', item)
    } else if (w > h) {
      push('landscape', '横', item)
    } else {
      push('portrait', '竖', item)
    }
  }
  // 固定 方 / 横 / 竖 的顺序，避免跟着模型配置的排列来回跳
  const order: AspectGroup['key'][] = ['square', 'landscape', 'portrait']
  return order.map((key) => groups.find((item) => item.key === key)!).filter(Boolean)
})

/** 当前分辨率所属的画幅分组：不在任何组（如模型只给了一种方向之外的尺寸）时返回空串 */
const activeAspect = computed(() => {
  const current = sizes.value.find((item) => item === size.value)
  if (!current) {
    return ''
  }
  return (
    aspectGroups.value.find((item) => item.size === current)?.key
      ?? aspectGroups.value.find((item) => ratioOf(current) === item.ratio)?.key
      ?? ''
  )
})

/**
 * 点画幅分段：切到该方向的第一档。
 *
 * <p>如果当前尺寸已经是这个方向（只是档位不同，例如 1K 横图 → 2K 横图），
 * 也仍切到该方向的第一档 —— 分段按钮的语义是「选这个方向」，不是「在档位间循环」。</p>
 *
 * @param key 方向分组 key
 */
const pickAspect = (key: AspectGroup['key']) => {
  const hit = aspectGroups.value.find((item) => item.key === key)
  if (hit) {
    size.value = hit.size
  }
}

const modelLabel = (value: string) => {
  if (!value) {
    return '选择模型'
  }
  const hit = models.value.find((item) => item.model === value)
  return hit?.alias || hit?.model || value
}

/**
 * 模型 logo。
 *
 * 生成接口的模型对象没有 logo 字段，这里复用会话侧同一套
 * 「模型名 → 提供商 → /images/models/<Provider>.svg」映射，
 * 保证两处展示的 logo 一致。
 *
 * <p>生图 / 生视频的模型族比对话模型杂得多：{@code flux-*}、{@code kling-*}、
 * {@code vidu-*}、{@code kolors-*} 这些既没有本地品牌图、也常被聚合渠道转发，
 * 只按模型名前缀查必然查空（表现为芯片与菜单里空白一块）。模型自身查不到时
 * 回退到**渠道**的品牌图（{@code 硅基流动 → siliconflow.svg}、
 * {@code 302.AI → 302ai.svg}），两处都查不到才返回 null 留白。</p>
 *
 * @param modelName 模型名
 * @param providerName 渠道显示名（历史行拿不到时会按模型列表反查）
 * @return 可直接放进 img.src 的地址；都查不到返回 null
 */
const modelLogo = (modelName: string, providerName?: string) => {
  if (!modelName) {
    return null
  }
  const provider =
    providerName || models.value.find((item) => item.model === modelName)?.providerName
  return getModelAvatarPath(modelName, provider) ?? getProviderLogoPath(provider)
}

const styleLabel = computed(() => {
  const hit = styleOptions.value.find((item) => item.key === style.value)
  return hit?.name ?? '无风格'
})

/**
 * 风格显示名。
 *
 * 库里存的是机器用的 key（如 anime），直接输出会把枚举值暴露给用户；
 * 这里映射成展示名，映射不到时退回原值，空值统一显示「无风格」。
 */
const styleName = (key: string | null) => {
  const hit = STYLE_TEMPLATES.find((item) => item.key === (key ?? ''))
  return hit?.name ?? (key || '无风格')
}

const placeholder = computed(() =>
  mediaType.value === 'image' ? '描述你所想象的场景...' : '描述你想要的视频内容...',
)

/** 分辨率文案："1024x1024" → "1K 方图" */
const resolutionLabel = (value: string) => {
  const matched = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec((value ?? '').trim())
  if (!matched) {
    return value
  }
  const w = Number(matched[1])
  const h = Number(matched[2])
  const shortSide = Math.min(w, h)
  const level =
    shortSide >= 1440
      ? '2K'
      : shortSide >= 1024
        ? '1K'
        : shortSide >= 720
          ? '720P'
          : shortSide >= 480
            ? '480P'
            : `${shortSide}P`
  if (w === h) {
    return `${level} 方图`
  }
  return `${level} ${w > h ? '横' : '竖'}图`
}

/** 比例图标外框：按 W:H 撑开小矩形，最大边 18px */
const ratioBoxStyle = (value: string) => {
  const matched = /^(\d+)\s*:\s*(\d+)$/.exec((value ?? '').trim())
  if (!matched) {
    return { width: '18px', height: '18px' }
  }
  const w = Number(matched[1])
  const h = Number(matched[2])
  const scale = 18 / Math.max(w, h)
  return {
    width: `${Math.max(6, Math.round(w * scale))}px`,
    height: `${Math.max(6, Math.round(h * scale))}px`,
  }
}

/** 过滤 + 排序后的任务 */
const visibleTasks = computed(() => {
  let list = [...tasks.value]
  if (modelFilter.value) {
    list = list.filter((task) => task.model === modelFilter.value)
  }
  if (statusFilter.value) {
    list = list.filter((task) => task.status === statusFilter.value)
  }
  if (onlyFavorite.value) {
    list = list.filter((task) => favorites.value.includes(task.taskId))
  }
  const range = TIME_RANGE_OPTIONS.find((item) => item.key === timeRange.value)
  if (range && range.spanMillis > 0) {
    const earliest = Date.now() - range.spanMillis
    list = list.filter((task) => (task.createdAt ?? 0) >= earliest)
  }
  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(
      (task) =>
        (task.prompt ?? '').toLowerCase().includes(kw) || (task.model ?? '').toLowerCase().includes(kw),
    )
  }
  if (sortOrder.value === 'oldest') {
    list.reverse()
  }
  return list
})

/** 一行的呈现类别 */
type RowKind = 'running' | 'result' | 'void'

interface Row {
  id: string
  kind: RowKind
  task: GenerateTask
  items: Array<{ key: string; url: string }>
}

/**
 * 已经显示出来的图片（键为「任务号-下标」）。
 *
 * <p>用 Set 而不是把 loaded 挂在 item 上：item 来自 computed，每次轮询都会整批重建，
 * 挂在 item 上的字段当场丢失，淡入会反复重放。Set 按 key 记账则与重建无关。</p>
 *
 * <p>用 reactive 而非 ref(new Set())：往里 add 就能触发重渲染，不必每次复制一份新 Set。</p>
 */
const loadedImages = reactive(new Set<string>())

/**
 * 记一张图已加载完成。
 *
 * @param key 图片键（任务号-下标）
 */
const markLoaded = (key: string) => {
  loadedImages.add(key)
}

/**
 * 统一的渲染列表：进行中 / 已完成 / 失败 按排序混在一个数组里。
 *
 * 之前把三类拆成三个列表分别渲染，导致失败行永远被钉在顶部、破坏时间顺序。
 * 现在只按 visibleTasks 的顺序映射一次，顺序即时间顺序。
 */
const rows = computed<Row[]>(() =>
  visibleTasks.value.map((task) => {
    const urls = task.urls ?? []
    const kind: RowKind =
      task.status === 'RUNNING' || task.status === 'PENDING'
        ? 'running'
        : task.status === 'SUCCESS' && urls.length > 0
          ? 'result'
          : 'void'
    return {
      id: task.taskId,
      kind,
      task,
      items: urls.map((url, index) => ({ key: `${task.taskId}-${index}`, url })),
    }
  }),
)

const badgeText = (task: GenerateTask) => STATUS_TEXT[task.status] ?? task.status

/**
 * 日期分组的分隔标签。
 *
 * <p>历史列表是纯时间流，翻到中间时读者不知道「这屏是哪天的」。按天插一条窄标签，
 * 只编码真实信息（哪天、几条），不做装饰。今天/昨天用相对说法，更早给月日。</p>
 *
 * @param ts 任务创建时间（毫秒）
 * @returns 标签文字
 */
const dayLabelOf = (ts: number): string => {
  const d = new Date(ts)
  const now = new Date()
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** 列表渲染项：日期分隔 + 记录，保证小组标题与卡片同属一个 v-for */
type ListEntry =
  | { kind: 'day'; key: string; label: string; count: number }
  | { kind: 'row'; key: string; row: Row }

const listEntries = computed<ListEntry[]>(() => {
  const entries: ListEntry[] = []
  let currentKey = ''
  for (const row of rows.value) {
    const d = new Date(row.task.createdAt ?? 0)
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    if (key !== currentKey) {
      currentKey = key
      const count = rows.value.filter((r) => {
        const rd = new Date(r.task.createdAt ?? 0)
        return `${rd.getFullYear()}-${rd.getMonth() + 1}-${rd.getDate()}` === key
      }).length
      entries.push({ kind: 'day', key: `day-${key}`, label: dayLabelOf(row.task.createdAt ?? 0), count })
    }
    entries.push({ kind: 'row', key: row.id || `row-${row.task.taskId}`, row })
  }
  return entries
})

/** 失败 / 已取消的记录数：清理按钮的角标与是否显示都看它 */
const voidRecordCount = computed(
  () => tasks.value.filter((t) => t.status === 'FAILED' || t.status === 'CANCELED').length,
)


/** 有失败记录才显示清理入口，避免常驻一个点不动的按钮 */
const hasVoidRecords = computed(() => voidRecordCount.value > 0)

/**
 * 结果的排法（按张数分四档，不看有没有参考图）。
 *
 *   1 张      single  按真实比例单张展示，不套方框
 *   2 张      pair    一行两列
 *   3–4 张    quad    2×2
 *   5 张起    fan     主图 + 扇开，悬停弹出全部
 *
 * 参考图只改「源图怎么摆」，不改结果本身的排法：
 * 只有 1 张结果时源图与结果同尺度并排（is-ref-peer），多张时源图退到左侧窄轨。
 */
type ResultLayout = 'single' | 'pair' | 'quad' | 'fan'

const resultLayout = (row: Row): ResultLayout => {
  const n = row.items.length || row.task.count || 1
  if (n <= 1) {
    return 'single'
  }
  if (n === 2) {
    return 'pair'
  }
  if (n <= 4) {
    return 'quad'
  }
  return 'fan'
}

/**
 * 结果网格列数（写进 --wg-cols）。
 * 单张 1 列、其余一律 2 列：2 张即一行，3–4 张即 2×2。
 */
const gridCols = (row: Row) => (resultLayout(row) === 'single' ? 1 : 2)

/** 有参考图且结果只有 1 张：源图不再缩成窄轨，与结果同尺度并排 */
const isRefPeer = (row: Row) =>
  Boolean(row.task.referenceImage) && resultLayout(row) === 'single'

/** 扇开主图：张数超过 4 时的第一张，完整展示 */
const isLead = (row: Row, index: number) => resultLayout(row) === 'fan' && index === 0

/**
 * 画廊一列只有 300px 左右：主图 + 三张露头会挤到卡片外，
 * 所以这里一张都不露（=0），只留主图 + 「+N」角标；
 * 全部结果走悬停浮层，逐张看进舞台（底部胶片行）。
 */
const fanPeek = () => 0

const isFanCard = (row: Row, index: number) =>
  resultLayout(row) === 'fan' && index > 0 && index <= fanPeek()

/**
 * 扇开里被收起来的张数（模板里用它的真假决定是否出 +N）。
 * 与 isFanCard / isFanHidden 共用 fanPeek，角标数字和实际露出的张数才对得上。
 */
const fanHiddenCount = (row: Row) =>
  resultLayout(row) === 'fan' ? Math.max(0, row.items.length - 1 - fanPeek()) : 0

const isFanHidden = (row: Row, index: number) =>
  resultLayout(row) === 'fan' && index > fanPeek()

/* ---------- 05 沉浸舞台 ---------- */

/** 有产物的记录：舞台只在成功作品之间移动，进行中 / 失败的记录留在画廊里看进度 */
const resultRows = computed(() => rows.value.filter((row) => row.kind === 'result'))

/** 舞台主角：没有显式选中时取最新一条 */
const stageRow = computed<Row | null>(() => {
  const list = resultRows.value
  if (!list.length) {
    return null
  }
  return list.find((row) => row.id === stageTaskId.value) ?? list[0]
})

const stageItems = computed(() => stageRow.value?.items ?? [])

/** 下标会因删除 / 换记录而越界，读之前先夹一下，避免取到 undefined */
const stageSafeIndex = computed(() =>
  Math.min(Math.max(stageItemIndex.value, 0), Math.max(0, stageItems.value.length - 1)),
)

const stageItem = computed(() => stageItems.value[stageSafeIndex.value] ?? null)

const stageTotal = computed(() => resultRows.value.length)

/** 切换形态。切到舞台时若还没选过作品，落到最新一条，避免「切了却还是空的」 */
/** 进舞台前的画廊滚动位置：回到画廊时恢复，翻到第 N 屏点开大图再回来不必重头翻 */
const galleryScrollTop = ref(0)

const setViewMode = (mode: ViewMode) => {
  if (mode === 'stage') {
    if (!stageRow.value) {
      stageTaskId.value = resultRows.value[0]?.id ?? ''
      stageItemIndex.value = 0
    }
    galleryScrollTop.value = canvasRef.value?.scrollTop ?? 0
  }
  viewMode.value = mode
  // 舞台不滚动，「回到顶部」的显示状态不跨形态保留
  showBackTop.value = false
  if (mode === 'gallery') {
    // 等画廊重新挂载完再恢复；scrollTo 会触发 onCanvasScroll，showBackTop 一并归位
    nextTick(() => {
      canvasRef.value?.scrollTo({ top: galleryScrollTop.value })
    })
  }
}

/** 从画廊点开一张：定位到那条记录的第 index 张 */
const openStage = (row: Row, index = 0) => {
  stageTaskId.value = row.id
  stageItemIndex.value = index
  galleryScrollTop.value = canvasRef.value?.scrollTop ?? 0
  viewMode.value = 'stage'
  nextTick(() => canvasRef.value?.scrollTo({ top: 0 }))
}

/** 右侧记录条：换一条记录，张数下标归零 */
const stagePickTask = (row: Row) => {
  stageTaskId.value = row.id
  stageItemIndex.value = 0
}

const stageMoveTask = (delta: number) => {
  const list = resultRows.value
  if (list.length < 2) {
    return
  }
  const current = Math.max(0, list.findIndex((row) => row.id === stageRow.value?.id))
  stagePickTask(list[(current + delta + list.length) % list.length])
}

/** ←/→ 与切换按钮：单张任务换记录，多张任务换张（到头循环） */
const stageStep = (delta: number) => {
  const items = stageItems.value
  if (!items.length) {
    return
  }
  if (items.length === 1) {
    stageMoveTask(delta)
    return
  }
  stageItemIndex.value = (stageSafeIndex.value + delta + items.length) % items.length
}

/** Home/End：跳到当前任务的首张 / 末张；单张任务则跳到最早 / 最新一条记录 */
const stageJumpEdge = (edge: 'start' | 'end') => {
  const items = stageItems.value
  if (!items.length) {
    return
  }
  if (items.length === 1) {
    const list = resultRows.value
    if (list.length < 2) {
      return
    }
    const current = Math.max(0, list.findIndex((row) => row.id === stageRow.value?.id))
    const next = edge === 'start' ? 0 : list.length - 1
    if (next !== current) {
      stagePickTask(list[next])
    }
    return
  }
  stageItemIndex.value = edge === 'start' ? 0 : items.length - 1
}

/** 舞台长提示词展开状态：换一条记录自动收起，避免上一条的展开状态串台 */
const stagePromptOpen = ref(false)

/** 图生图对照：参考图叠在结果上拖动对比（参考图字节还在才可开） */
const refCompareOpen = ref(false)
const refCompareActive = computed(
  () =>
    refCompareOpen.value
    && !!stageRow.value?.task.referenceImage
    && !mediaFailed(stageRow.value.task.referenceImage),
)

/** 对照滑块位置（%）：分割线左侧显示参考图，右侧露出生成结果 */
const wipePos = ref(50)
const wipeDragging = ref(false)
const updateWipe = (ev: PointerEvent, el: HTMLElement) => {
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0) return
  const pct = ((ev.clientX - rect.left) / rect.width) * 100
  // 留 4% 边距：拖到头也别完全遮死一边，两侧标签始终有落点
  wipePos.value = Math.min(96, Math.max(4, Math.round(pct * 10) / 10))
}
const onWipeDown = (ev: PointerEvent) => {
  const el = ev.currentTarget as HTMLElement
  // 捕获指针：拖出画框也持续跟手，松手即停
  el.setPointerCapture(ev.pointerId)
  wipeDragging.value = true
  updateWipe(ev, el)
}
const onWipeMove = (ev: PointerEvent) => {
  if (wipeDragging.value) updateWipe(ev, ev.currentTarget as HTMLElement)
}
const onWipeUp = (ev: PointerEvent) => {
  wipeDragging.value = false
  try {
    ;(ev.currentTarget as HTMLElement).releasePointerCapture(ev.pointerId)
  } catch {
    /* 指针可能已释放 */
  }
}
// 换一条记录 / 重开对照：分割线回到中位，不带上一次的位置
watch(refCompareActive, (on) => {
  if (on) wipePos.value = 50
})

watch(
  () => stageRow.value?.id,
  () => {
    stagePromptOpen.value = false
    refCompareOpen.value = false
  },
)

/** 舞台键盘：Esc 回画廊、←/→ 换张、Home/End 跳首末。只在舞台生效，不抢画廊里方向键的滚动 */
const onCanvasKeydown = (ev: KeyboardEvent) => {
  if (viewMode.value !== 'stage') {
    return
  }
  if (ev.key === 'Escape') {
    ev.preventDefault()
    setViewMode('gallery')
  } else if (ev.key === 'ArrowLeft') {
    ev.preventDefault()
    stageStep(-1)
  } else if (ev.key === 'ArrowRight') {
    ev.preventDefault()
    stageStep(1)
  } else if (ev.key === 'Home') {
    ev.preventDefault()
    stageJumpEdge('start')
  } else if (ev.key === 'End') {
    ev.preventDefault()
    stageJumpEdge('end')
  }
}


/** 扇开的错位：越靠右转得越多、落得越低，形成一叠照片的手感 */
const fanCardStyle = (index: number) => ({
  zIndex: 20 - index,
  transform: `translateY(${(index - 1) * 14}px) rotate(${3 + (index - 1) * 4}deg)`,
})

/**
 * 缩略图的附加样式：单张按真实比例给高度，扇开给错位；
 * 其余情况返回空值，不使用内联样式。
 */
const thumbStyle = (row: Row, index: number) => {
  const layout = resultLayout(row)
  if (layout === 'single') {
    return { aspectRatio: aspectOf(row.task.size) }
  }
  // 画廊里 2–4 张任务的内图也按任务画幅出比例：与单张瀑布流保持同一节奏，
  // 方图与横竖图混排时不再「单张有高差、多张全是方块」。
  if (viewMode.value === 'gallery' && (layout === 'pair' || layout === 'quad')) {
    return { aspectRatio: aspectOf(row.task.size) }
  }
  return isFanCard(row, index) ? fanCardStyle(index) : undefined
}

/**
 * 进行中 / 失败占位块的宽度。
 *
 * 占位块的宽度必须和「出图后那一块」一致，否则同一张卡片在等待 → 出图时宽度会跳：
 * 单张 = 一列，2–4 张 = 两列，5 张起 = 主图 + 三张露头（与 .wg-grid 的 max-width 同一个公式）。
 * 所以这里给的是**宽度**而不是宽度上限：占位块没有图片内容，不写死宽度就会被内容
 * （一行「生成中…」文字）撑成一个窄块，等图出来了再变成两列宽。
 *
 * 不能直接调 gridCols —— 它读的是已到结果数，等待时恒为 0 而返回 1 列，
 * 但多张任务出图后是两列，等待时先按两列的宽度才不跳。
 *
 * @param row 当前卡片行
 * @return 可直接写进 style.width 的值
 */
const placeholderWidth = (row: Row) => {
  // 画廊一列就是整宽：占位块直接吃满栏宽。
  // 不能再算「主图 + 露头」——画廊里 --wg-thumb 就是 100%，calc 会把栏宽翻倍撑破列。
  if (viewMode.value === 'gallery') {
    return '100%'
  }
  const n = Math.max(1, row.task.count ?? 1)
  if (n > 4) {
    // 主图 + 三张露头：每张 110px 宽、压掉 46px，合计 192px 露在右侧
    return 'calc(var(--wg-thumb) + var(--wg-fan-peek))'
  }
  const cols = n <= 1 ? 1 : 2
  return `calc(${cols} * var(--wg-thumb) + ${cols - 1} * 10px)`
}

const badgeClass = (task: GenerateTask) => {
  if (task.status === 'SUCCESS') {
    return 'is-success'
  }
  if (task.status === 'FAILED') {
    return 'is-danger'
  }
  if (task.status === 'CANCELED') {
    return 'is-info'
  }
  return 'is-primary'
}

const modelFilterOptions = computed(() => {
  const seen = new Map<string, string>()
  for (const task of tasks.value) {
    if (task.model) {
      seen.set(task.model, modelLabel(task.model))
    }
  }
  return [{ key: '', label: '全部模型', desc: '不过滤' }].concat(
    Array.from(seen.entries()).map(([key, label]) => ({ key, label, desc: '' })),
  )
})

const sortLabel = computed(() => SORT_OPTIONS.find((item) => item.key === sortOrder.value)?.label ?? '最新优先')

/** 生效中的筛选条件数，用于「筛选」角标 */
const activeFilterCount = computed(
  () =>
    (modelFilter.value ? 1 : 0)
    + (statusFilter.value ? 1 : 0)
    + (onlyFavorite.value ? 1 : 0)
    + (timeRange.value ? 1 : 0),
)

/**
 * 是否有生效中的检索 / 筛选条件。
 *
 * <p>决定空态说「还没有作品」还是「没有匹配的作品」：库里有记录但条件把所有行都过滤掉时，
 * 说「还没有作品」是错的，用户会以为数据丢了。检索词也算条件，否则搜一个不存在的词
 * 也会落到「还没有作品」。</p>
 */
const hasActiveQuery = computed(
  () => !!keyword.value.trim() || activeFilterCount.value > 0,
)

/** 清掉检索词与全部筛选条件（空态里的「清除检索与筛选」用） */
const resetQuery = () => {
  keyword.value = ''
  modelFilter.value = ''
  statusFilter.value = ''
  onlyFavorite.value = false
  timeRange.value = ''
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

const formatTime = (value: number | null) => {
  if (!value) {
    return '—'
  }
  const d = new Date(value)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const formatElapsed = (value: number | null) => {
  if (value === null || value === undefined) {
    return '—'
  }
  return `${(value / 1000).toFixed(1)}s`
}

/**
 * 进行中任务的阶段文案。
 *
 * 进度由后端按真实可观测阶段写入（排队 / provider 计算 / base64 编码），
 * 这里只做展示翻译，不在前端凭空插值——那样出来的是假进度。
 */
const stageText = (task: GenerateTask) => {
  const value = task.progress ?? 0
  if (value <= 5) {
    return '排队中...'
  }
  if (value < 85) {
    return '模型生成中...'
  }
  if (value < 100) {
    return '结果编码中...'
  }
  return '即将完成...'
}

/** 进度条宽度（%）：钳到 0-100，直接用后端 progress，不做前端插值 */
const runPct = (task: GenerateTask) => Math.min(100, Math.max(0, task.progress ?? 0))

/**
 * 无产物行占位块的标题。
 *
 * <p>只说「这条没拿到产物」以及是哪种产物，原因是下一行的事。
 * 「已取消」和「失败」分开表述：前者是用户自己停的，重试无意义；
 * 后者才是需要重试的。</p>
 *
 * @param task 任务行
 * @return 占位块主文案
 */
const voidLabel = (task: GenerateTask) => {
  const what = task.type === 'video' ? '视频' : '图片'
  if (task.status === 'CANCELED') {
    return `${what}已取消`
  }
  return task.status === 'SUCCESS' ? `未返回${what}` : `${what}未生成`
}

/**
 * 无产物行占位块的原因行。
 *
 * <p>优先取服务端写入的中文原因——它已把上游英文（429 / video_queue_full 等）
 * 归类翻译过，比这里再猜一层更准。服务端没给原因时才回落到通用兜底文案，
 * 不留空白：空着会让这块看起来像加载失败而不是生成失败。</p>
 *
 * @param task 任务行
 * @return 原因文案
 */
const voidReason = (task: GenerateTask) => {
  if (task.errorMessage) {
    return task.errorMessage
  }
  return task.status === 'CANCELED' ? '已手动停止' : '本次没有产出任何内容'
}

const isFavorite = (taskId: string) => favorites.value.includes(taskId)

/** 舞台「查看原图」：按钮自身不驱动 viewer，直接触发图内 img 的点击交给 v-viewer */
const zoomStage = (ev: MouseEvent) => {
  const holder = (ev.currentTarget as HTMLElement | null)?.closest('.wg-stage-figure')
  holder?.querySelector('img')?.click()
}

const toggleFavorite = (taskId: string) => {
  const next = favorites.value.includes(taskId)
    ? favorites.value.filter((id) => id !== taskId)
    : [...favorites.value, taskId]
  favorites.value = next
  try {
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(next))
  } catch {
    // 本地存储不可用（隐私模式/配额满）时不影响本次会话内的收藏状态
  }
}

/* ---------- 参数按模型记忆：按「媒体类型|模型」存取现场 ----------
 * 口径：记住 尺寸 / 张数 / 时长 / 风格 / 提示词，切走存档、切回恢复；
 * 高级参数（负面词 / 种子 / 步数）仍维持「切模型即清空」——那是针对具体模型填的。
 * 参考图不入记忆：base64 体积原因，与草稿同一口径。
 * 只挂在用户主动的切换入口（pickModel / switchMedia）；regenerate / reuseSeed
 * 是任务回填、直填状态，不走记忆，否则恢复值会覆盖任务原值。 */
const PARAM_MEM_KEY = 'ai-guada:generate-param-memory'

interface ParamSnapshot {
  prompt?: string
  size?: string
  count?: number
  duration?: number | null
  style?: string
}

type ParamMemory = Record<string, ParamSnapshot>

const readParamMemory = (): ParamMemory => {
  try {
    return JSON.parse(localStorage.getItem(PARAM_MEM_KEY) || '{}') as ParamMemory
  } catch {
    // 脏数据按无记忆处理，不影响切换主流程
    return {}
  }
}

/** 切走前存当前现场；模型未选（空名）不存 */
const saveParamSnapshot = (media: 'image' | 'video', modelName: string) => {
  if (!modelName) {
    return
  }
  const mem = readParamMemory()
  mem[`${media}|${modelName}`] = {
    prompt: prompt.value,
    size: size.value,
    count: count.value,
    duration: duration.value ?? null,
    style: style.value,
  }
  try {
    localStorage.setItem(PARAM_MEM_KEY, JSON.stringify(mem))
  } catch {
    // 存不下（隐私模式 / 配额满）就退化为仅本次会话可恢复
  }
}

/**
 * 切到新组合后恢复它的记忆。
 *
 * <p>恢复值必须过新模型的能力校验：尺寸要在新模型的 sizes 里、张数按 maxCount 夹紧、
 * 时长要在档位表里、风格按 pickModel 同一口径（style === true 且在清单内）才回填——
 * 记忆不能把上一个模型的能力带到新模型上。</p>
 */
const restoreParamSnapshot = (media: 'image' | 'video', modelName: string): string[] => {
  const snap = readParamMemory()[`${media}|${modelName}`]
  if (!snap) {
    return []
  }
  /** 记录真正回填了的字段：一条都没恢复时调用方不必打扰用户 */
  const restored: string[] = []
  if (snap.prompt?.trim()) {
    prompt.value = snap.prompt
    restored.push('提示词')
  }
  const cfg = currentConfig.value
  if (snap.size && (!cfg?.sizes?.length || cfg.sizes.includes(snap.size))) {
    size.value = snap.size
    restored.push('尺寸')
  }
  if (typeof snap.count === 'number' && snap.count >= 1) {
    count.value = Math.min(snap.count, maxCount.value)
    restored.push('张数')
  }
  if (
    media === 'video'
    && typeof snap.duration === 'number'
    && snap.duration > 0
    && (!cfg?.durations?.length || cfg.durations.includes(snap.duration))
  ) {
    duration.value = snap.duration
    restored.push('时长')
  }
  if (snap.style && cfg?.style === true && (!cfg?.styles?.length || cfg.styles.includes(snap.style))) {
    style.value = snap.style
    restored.push('风格')
  }
  return restored
}

const pickModel = (value: string) => {
  // 切走前把当前模型的现场存档，选完恢复新模型的记忆
  saveParamSnapshot(mediaType.value, model.value)
  model.value = value
  const cfg = models.value.find((item) => item.model === value)?.config
  const list = cfg?.sizes
  if (list?.length && !list.includes(size.value)) {
    size.value = list[0]
  }
  // 新模型不支持图生图时清掉已选参考图，否则会带着无效参考图提交
  if (!cfg?.referenceImage) {
    referenceImage.value = ''
  }
  // 新模型不支持风格、或当前风格不在其可选范围内时清掉，避免提交被上游拒绝
  if (cfg?.style !== true) {
    style.value = ''
  } else if (cfg.styles?.length && !cfg.styles.includes(style.value)) {
    style.value = ''
  }
  const restored = restoreParamSnapshot(mediaType.value, value)
  // 恢复是「静默改状态」：不提示，用户会以为参数自己变了
  if (restored.length) {
    message.info(`已恢复该模型的上次参数：${restored.join('、')}`)
  }
}

/** 选比例：切到该比例下的第一个可用分辨率 */
const pickRatio = (value: string) => {
  const hit = sizes.value.find((item) => ratioOf(item) === value)
  if (hit) {
    size.value = hit
  }
}

/**
 * 选时长。
 *
 * <p>入参只可能是 durations 里的合法值（分段按钮逐个渲染），
 * 不需要再做「取数组第一个」那种滑块兼容处理。</p>
 *
 * @param value 选中的时长（秒）
 */
const onDurationPick = (value: number) => {
  duration.value = value
}

/**
 * 风格芯片弹层里选中：只记下选中的风格 key（模板里顺手把弹层收起）。
 *
 * 不再把风格描述写进输入框 —— 输入条本身已有风格选择器（芯片弹层 + @ 面板），
 * 用户能看到的「选中了哪个风格」就是芯片上的「风格 · <名字>」；
 * 描述文本在提交时由 onComposerSubmit 统一拼到提示词最前面，避免输入区
 * 出现一段风格文案、还容易与用户手打的文字重复或冲突。
 *
 * @param key 风格 key，空串表示「无风格」
 */
const pickStyle = (key: string) => {
  style.value = key
}

/**
 * @ 面板里选中：只记下风格 key（用于芯片高亮与提交时拼接），
 * 不再往输入框写任何文字 —— 风格描述由提交端统一拼到提示词最前面。
 *
 * @param key 风格 key
 */
const pickStyleFromPanel = (key: string) => {
  style.value = key
}

/**
 * 风格缩略图。
 *
 * 优先用内置缩略图（{@link STYLE_THUMBS}）：它按风格描述生成，常在，
 * 且保证「图」和「拼进提示词的描述」说的是同一件事。
 * 内置表里没有的 key（模型管理自配风格）才退到**真正用过该风格**的生成结果；
 * 都没有就返回空，由占位文案显示风格名。
 * 之前找不到就用「任意一张图」顶替，导致「动漫二次元」配着一张写实白猫的照片 ——
 * 图文不符比没有图更容易误导。
 */
const stylePreview = (key: string) => {
  if (!key) {
    return ''
  }
  const builtin = STYLE_THUMBS[key]
  if (builtin) {
    return builtin
  }
  const hit = tasks.value.find((task) => task.style === key && (task.urls?.length ?? 0) > 0)
  return hit?.urls?.[0] ?? ''
}

/**
 * 缩略图取回失败过的 key。
 *
 * <p>地址存在不等于文件存在：dev 下没接上的静态目录会把请求回成千篇一律的 index.html
 * （HTTP 200 + text/html），`<img>` 于是 complete=true、naturalWidth=0 —— 面板里就是
 * 一排破图。加载失败后记下来，渲染退回「风格名占位」，和「没有缩略图」表现一致。</p>
 */
const failedStyleThumbs = reactive(new Set<string>())

/** 记录缩略图加载失败，避免下一次重渲染又去要同一张破图 */
const markStyleThumbFailed = (key: string | undefined) => {
  if (key) {
    failedStyleThumbs.add(key)
  }
}

/** 渲染用缩略图：失败过的 key 一律返回空串，让模板走占位分支 */
const styleThumb = (key: string) => (failedStyleThumbs.has(key) ? '' : stylePreview(key))

/**
 * 无缩略图风格的占位色相。
 *
 * <p>按 key 做一次简单散列落到 0~359：同一个风格每次打开都是同一块颜色，
 * 不会忽蓝忽绿。它只是占位底色，不宣称「这就是该风格的样子」——
 * 拿别的风格的成图冒充，比一块中性的色块更误导。</p>
 *
 * @param key 风格 key
 * @return 色相角
 */
const styleHue = (key: string) => {
  let hash = 0
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 360
  }
  return hash
}

/** 占位块的内联样式：只暴露色相变量，具体渐变与文字样式在 .wg-style-fallback 里 */
const styleFallbackStyle = (key: string) => ({
  '--wg-style-hue': String(styleHue(key || 'none')),
})

const switchMedia = (value: 'image' | 'video') => {
  // 切换类型是「跳转」而非「调节某个开关」，选完应当收起弹层
  mediaOpen.value = false
  if (mediaType.value === value) {
    return
  }
  // 切类型前把当前「类型|模型」的现场存档；新类型的默认模型定下来后再恢复它的记忆
  saveParamSnapshot(mediaType.value, model.value)
  mediaType.value = value
  model.value = ''
  size.value = ''
  duration.value = undefined
  // 模型与历史都要按新媒体类型重载：只重载模型会让列表仍显示上一种类型的任务
  void loadModels().then(() => {
    const restored = restoreParamSnapshot(value, model.value)
    if (restored.length) {
      message.info(`已恢复该模型的上次参数：${restored.join('、')}`)
    }
  })
  void loadHistory()
}

const pickReference = () => {
  // 上一张还在缩放：再开选择框会让两次结果互相覆盖
  if (shrinkingRef.value) {
    message.info('上一张图还在处理中')
    return
  }
  fileInput.value?.click()
}

/**
 * 参考图上传后落库前的等比缩放。
 *
 * 之前直接把原图 readAsDataURL 整张发上来：一张 1024×1024 的 PNG 就有约 1.7MB，
 * base64 再涨 1/3，参考图列一条 2.38MB —— 表很快撑到几百 MB，而图生图实际只需要
 * 看清构图与主体。因此在浏览器里先按长边缩到 {@link REF_MAX_EDGE}，
 * 原始像素尺寸单独记下来，卡片渲染时按原比例还原，观感不变、存量降一个量级。
 *
 * 缩放失败（浏览器不支持 createObjectURL / canvas 被污染）时返回原图，
 * 不能因为优化失败就让用户传不了图。
 *
 * @param file 用户选择的原图
 * @return data URL、原始尺寸与缩放后尺寸
 */
const shrinkReference = (file: File): Promise<ShrinkResult> =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const originalWidth = img.naturalWidth || REF_MAX_EDGE
      const originalHeight = img.naturalHeight || REF_MAX_EDGE
      const longest = Math.max(originalWidth, originalHeight)
      try {
        if (longest <= REF_MAX_EDGE) {
          // 本来就不大，原样发送，不必为了「走过一遍 canvas」损失画质
          URL.revokeObjectURL(url)
          readAsDataUrl(file).then((dataUrl) =>
            resolve({ dataUrl, originalWidth, originalHeight, width: originalWidth, height: originalHeight, shrunk: false }),
          )
          return
        }
        const scale = REF_MAX_EDGE / longest
        const width = Math.max(1, Math.round(originalWidth * scale))
        const height = Math.max(1, Math.round(originalHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          throw new Error('无法取得 2d 上下文')
        }
        // 图生图只需要看清构图，铺白底避免透明 PNG 转 JPEG 后出现黑块
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', REF_JPEG_QUALITY),
          originalWidth,
          originalHeight,
          width,
          height,
          shrunk: true,
        })
      } catch {
        URL.revokeObjectURL(url)
        readAsDataUrl(file).then((dataUrl) =>
          resolve({ dataUrl, originalWidth, originalHeight, width: originalWidth, height: originalHeight, shrunk: false }),
        )
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      // 连解码都不行（损坏文件），退回原始 baseURL，至少还能提交
      readAsDataUrl(file).then((dataUrl) =>
        resolve({ dataUrl, originalWidth: 0, originalHeight: 0, width: 0, height: 0, shrunk: false }),
      )
    }
    img.src = url
  })

/** File → data URL */
const readAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })

/** 清空参考图及其尺寸信息 */
/**
 * 清空当前画布草稿：**提示词 + 参考图**（参数保持默认不动，避免误改用户偏好）。
 *
 * <p>用户需求 1.1：左侧下拉里加「清空绘画」，清的是当前草稿，不是历史记录。</p>
 */
function clearCanvasDraft() {
  prompt.value = ''
  clearReference()
  // 参数一并恢复默认（用户要求）：尺寸/时长取该模型配置的首项、张数 1、风格清空
  size.value = sizes.value[0] ?? ''
  count.value = 1
  duration.value = durations.value[0] ?? undefined
  style.value = ''
  message.success('已清空画布草稿，并把参数恢复默认')
}

const clearReference = () => {
  referenceImage.value = ''
  referenceMeta.value = null
}

/**
 * 参考图裁剪流程状态。
 * 上传后先弹裁剪层（按当前画幅比例定构图）；确认 → 裁剪产物走 shrink 落库；
 * 取消 → 退回「整图直接用」的原流程，不强迫用户裁剪。
 */
const refCropOpen = ref(false)
const refCropSrc = ref('')
let pendingRefFile: File | null = null
let refCropApplied = false

/** 裁剪目标比例取当前选中画幅；没有画幅信息时给 undefined（自由裁剪） */
const refCropRatio = computed<number | undefined>(() => {
  const matched = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec((size.value || '').trim())
  return matched ? Number(matched[1]) / Number(matched[2]) : undefined
})

const onFilePicked = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  input.value = ''
  // 上一张还在缩放：再开选择框会让两次结果互相覆盖
  if (shrinkingRef.value) {
    message.info('上一张图还在处理中')
    return
  }
  pendingRefFile = file
  refCropApplied = false
  refCropSrc.value = await readAsDataUrl(file)
  refCropOpen.value = true
}

const onRefCropOpenChange = (open: boolean) => {
  refCropOpen.value = open
  // 关闭且不是确认后自动关（confirm 里已置位）→ 视为取消，用原图直接走老流程
  if (!open && !refCropApplied && pendingRefFile) {
    const file = pendingRefFile
    pendingRefFile = null
    void applyReferenceFile(file)
  }
}

const onRefCropConfirm = (payload: { dataUrl: string; width: number; height: number }) => {
  refCropApplied = true
  pendingRefFile = null
  const blob = dataUrlToBlob(payload.dataUrl)
  void applyReferenceFile(new File([blob], 'reference.jpg', { type: 'image/jpeg' }))
}

/** 把选中的图缩放后写入参考图位（裁剪确认与取消直用两条路共用） */
const applyReferenceFile = async (file: File) => {
  if (shrinkingRef.value) {
    return
  }
  shrinkingRef.value = true
  try {
    const result = await shrinkReference(file)
    referenceImage.value = result.dataUrl
    // 记录原始尺寸：卡片按它还原比例，避免缩放后被压成方块
    referenceMeta.value = {
      originalWidth: result.originalWidth,
      originalHeight: result.originalHeight,
      width: result.width,
      height: result.height,
    }
    // 缩放信息只记在 referenceMeta 里供渲染与提交使用，不在界面上显示文案
  } catch {
    message.error('读取图片失败，请换一张试试')
  } finally {
    shrinkingRef.value = false
  }
}

/** data URL → Blob：裁剪产物要转回 File 才能复用 shrinkReference 管线 */
const dataUrlToBlob = (dataUrl: string): Blob => {
  const [head, body] = dataUrl.split(',')
  const mime = /:(.*?);/.exec(head)?.[1] ?? 'image/jpeg'
  const binary = atob(body)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

/**
 * 下载出图结果。
 *
 * `<a href download>` 带不了请求头，内联媒体只能走 fetch + blob
 * （令牌不进 URL，浏览器下载历史里不会留下一条带 accessToken 的地址）。
 * 供应商直链不需要鉴权，走原生下载即可。
 */
/**
 * 下载文件名：提示词前缀 + 时间戳 + 序号。
 *
 * 固定叫 generate.png 时，一次下载多张会被浏览器改名成 (1)(2)…，落地对不上哪张是哪张；
 * 用「提示词前 16 字 - 年月日-时分秒 - 第 n 张」让文件名本身可辨认。
 * 提示词里的空白与文件系统非法字符一并去掉；空提示词回落 generate。
 */
const downloadName = (task: GenerateTask | undefined, type: 'image' | 'video', index?: number): string => {
  const ext = type === 'video' ? 'mp4' : 'png'
  const base =
    (task?.prompt ?? '')
      .trim()
      .replace(/[\\/:*?"<>|\s]+/g, '')
      .slice(0, 16) || 'generate'
  const d = task?.createdAt ? new Date(task.createdAt) : new Date()
  const stamp = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`
  const seq = index !== undefined ? `-${index + 1}` : ''
  return `${base}-${stamp}${seq}.${ext}`
}

const download = (url: string, type: 'image' | 'video', task?: GenerateTask, index?: number) => {
  void downloadAuthenticatedFile(url, downloadName(task, type, index))
}

/**
 * 视频缩略图悬停静音预览：不点开也能看到画面在动。
 * hover 播放一律静音（声音突袭比无声更糟）；用户点击画面/控件时恢复声音——
 * 「点」这个动作本身就代表要正式看/听了。
 */
const previewVideo = (ev: MouseEvent) => {
  const video = ev.currentTarget as HTMLVideoElement | null
  if (!video || !video.paused) {
    return
  }
  video.muted = true
  video.dataset.wgHoverPreview = '1'
  void video.play().catch(() => {
    // 自动播放被浏览器策略拦截时保持静默：缩略图仍有首帧，不影响点击播放
  })
}

/** 悬停结束：只停「因悬停而播」的视频，不干扰用户手动点播的进度 */
const pauseVideoPreview = (ev: MouseEvent) => {
  const video = ev.currentTarget as HTMLVideoElement | null
  if (!video || video.dataset.wgHoverPreview !== '1') {
    return
  }
  delete video.dataset.wgHoverPreview
  video.pause()
}

/** 用户点击视频（播放/进度/音量等控件）：解除悬停预览的静音 */
const unmuteVideoOnInteract = (ev: MouseEvent) => {
  const video = ev.currentTarget as HTMLVideoElement | null
  if (video && video.muted) {
    video.muted = false
  }
}

/* ---------- 批量下载：把一条任务的全部结果打包成 ZIP ---------- */

/** CRC32 查表（ZIP 标准多项式 0xEDB88320），模块级建一次，避免每次打包重算 */
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

const crc32Of = (bytes: Uint8Array): number => {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC32_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

/**
 * 极简 ZIP 打包（STORED 不压缩）。
 *
 * <p>图片 / 视频本身已是压缩格式，再压一遍没有收益，归档用 STORED 即可，
 * 免去引入 jszip 这类依赖。条目数 = 单次任务的张数（≤10），远在 ZIP 能力之内。</p>
 */
function buildZipBlob(entries: Array<{ name: string; data: Uint8Array<ArrayBuffer> }>): Blob {
  const encoder = new TextEncoder()
  const u16 = (v: number) => new Uint8Array([v & 0xff, (v >>> 8) & 0xff])
  const u32 = (v: number) =>
    new Uint8Array([v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff])
  const cat = (parts: Uint8Array[]) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
    let pos = 0
    for (const p of parts) {
      out.set(p, pos)
      pos += p.length
    }
    return out
  }

  const body: Uint8Array<ArrayBuffer>[] = []
  const central: Uint8Array<ArrayBuffer>[] = []
  let offset = 0
  for (const entry of entries) {
    const name = encoder.encode(entry.name)
    const crc = crc32Of(entry.data)
    const size = entry.data.length
    // 本地文件头 + 文件字节（STORED：crc 与两个 size 相同）
    const local = cat([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(size), u32(size), u16(name.length), u16(0), name,
    ])
    body.push(local, entry.data)
    // 中央目录项：记录本条在包内的偏移
    central.push(
      cat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0), u16(0),
        u32(0), u32(offset), name,
      ]),
    )
    offset += local.length + size
  }
  const centralBytes = cat(central)
  const eocd = cat([
    u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
    u32(centralBytes.length), u32(offset), u16(0),
  ])
  return new Blob([...body, centralBytes, eocd], { type: 'application/zip' })
}

/** 按字节类型定扩展名（内联图可能是 webp/jpeg），认不出再按任务类型兜底 */
const extOfBlob = (blob: Blob, type: 'image' | 'video'): string => {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'video/mp4': '.mp4',
    'video/webm': '.webm',
  }
  return map[blob.type] || (type === 'video' ? '.mp4' : '.png')
}

/** 打包下载进行中的任务（防重复点击） */
const zipBusyId = ref('')

/**
 * 把一条任务的全部结果打包成 ZIP 下载。
 *
 * <p>多图任务逐张点下载太繁，一键打包取走。字节复用 {@link fetchMediaBlob}
 * 的鉴权口径（令牌不进 URL），打包在浏览器本地完成，不经过后端中转。</p>
 */
const downloadTaskZip = async (task: GenerateTask) => {
  const urls = (task.urls ?? []).filter(Boolean)
  if (!urls.length) {
    message.warning('这条记录没有可下载的文件')
    return
  }
  if (zipBusyId.value) {
    return
  }
  zipBusyId.value = task.taskId
  try {
    const blobs = await Promise.all(urls.map((url) => fetchMediaBlob(url)))
    // 文件名用提示词前缀（洗掉路径非法字符），同前缀按序号区分
    const base = promptName(task.prompt, 40, `generate-${task.taskId}`).replace(
      /[\\/:*?"<>|\s]+/g,
      '_',
    )
    const entries = await Promise.all(
      blobs.map(async (blob, i) => ({
        name: `${base}-${String(i + 1).padStart(2, '0')}${extOfBlob(blob, task.type)}`,
        data: new Uint8Array(await blob.arrayBuffer()),
      })),
    )
    const zip = buildZipBlob(entries)
    const objectUrl = URL.createObjectURL(zip)
    try {
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `${base}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
    message.success(`已打包 ${urls.length} 个文件`)
  } catch (error) {
    message.error(`打包下载失败：${(error as Error)?.message || '未知错误'}`)
  } finally {
    zipBusyId.value = ''
  }
}

/** 导出列：与卡片/列表展示同一套字段口径，全部取自后端任务数据，无前端推断 */
const EXPORT_COLUMNS: Array<{ label: string; get: (t: GenerateTask) => string | number | null }> = [
  { label: '时间', get: (t) => (t.createdAt ? formatTime(t.createdAt) : null) },
  { label: '类型', get: (t) => t.type },
  { label: '状态', get: (t) => t.status },
  { label: '模型', get: (t) => t.model },
  { label: '尺寸', get: (t) => t.size },
  { label: '张数', get: (t) => t.count },
  { label: '时长(秒)', get: (t) => t.duration },
  { label: '种子', get: (t) => t.seed },
  { label: '耗时(秒)', get: (t) => (t.elapsedMillis == null ? null : Number((t.elapsedMillis / 1000).toFixed(1))) },
  { label: '提示词', get: (t) => t.prompt },
  { label: '负向提示词', get: (t) => t.negativePrompt },
  { label: '风格', get: (t) => t.style },
  { label: '任务ID', get: (t) => t.taskId },
]

/** CSV 单元格转义：含逗号 / 引号 / 换行时整体加引号，内部引号翻倍 */
const csvCell = (v: string | number | null): string => {
  const s = v == null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * 导出当前筛选结果（rows，即历史区正在显示的清单）为 CSV / JSON。
 *
 * <p>只导元数据：提示词、模型、尺寸、种子、状态、耗时等；不带图片 URL 与
 * 参考图 base64 —— 前者离开当前登录态不可用，后者体积大且不属于「清单」。
 * CSV 带 BOM，Excel 直接打开中文不乱码。</p>
 */
const exportHistory = (fmt: 'csv' | 'json') => {
  const list = rows.value.map((r) => r.task)
  if (!list.length) {
    message.info('当前筛选结果为空，没有可导出的记录')
    return
  }
  let text: string
  if (fmt === 'csv') {
    const head = EXPORT_COLUMNS.map((c) => csvCell(c.label)).join(',')
    const body = list.map((t) => EXPORT_COLUMNS.map((c) => csvCell(c.get(t))).join(',')).join('\n')
    text = `\uFEFF${head}\n${body}`
  } else {
    text = JSON.stringify(
      list.map((t) => {
        const o: Record<string, unknown> = { taskId: t.taskId }
        for (const c of EXPORT_COLUMNS) o[c.label] = c.get(t)
        return o
      }),
      null,
      2,
    )
  }
  const stamp = new Date()
  const suffix = `${stamp.getFullYear()}${pad2(stamp.getMonth() + 1)}${pad2(stamp.getDate())}-${pad2(stamp.getHours())}${pad2(stamp.getMinutes())}${pad2(stamp.getSeconds())}`
  const blob = new Blob([text], {
    type: fmt === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8',
  })
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = `generate-history-${suffix}.${fmt}`
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
  message.success(`已导出 ${list.length} 条记录（${fmt.toUpperCase()}）`)
}

/** JPEG/WebP → PNG（剪贴板写入只保证 image/png 可用），已是 PNG 原样返回 */
async function toPngBlob(blob: Blob): Promise<Blob> {
  if (blob.type === 'image/png') {
    return blob
  }
  const bitmap = await createImageBitmap(blob)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error('画布不可用')
  }
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('图片转码失败'))), 'image/png')
  })
}

/** 复制图片进行中（防重复点击） */
const copyImageBusy = ref(false)

/**
 * 复制出图结果到系统剪贴板（贴进聊天 / 文档 / PPT）。
 *
 * 取字节复用 {@link fetchMediaBlob} 的鉴权口径（令牌不进 URL）；
 * ClipboardItem 各家只稳定支持 image/png，其他格式先转码再写入。
 * 不支持剪贴板 API 的环境（旧 Firefox / 非安全上下文）明确提示，不静默失败。
 */
const copyImage = async (url: string) => {
  if (copyImageBusy.value) {
    return
  }
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    message.warning('当前浏览器不支持复制图片到剪贴板，请改用下载')
    return
  }
  copyImageBusy.value = true
  try {
    const blob = await fetchMediaBlob(url)
    const png = await toPngBlob(blob)
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })])
    message.success('已复制到剪贴板')
  } catch (e: any) {
    message.error(`复制失败：${e?.message || '未知错误'}`)
  } finally {
    copyImageBusy.value = false
  }
}

/* ============================================================================
   「更多」菜单：添加到人脸库 / 添加到图像库
   ============================================================================= */

/** 「更多」菜单进行中（防重复提交；两个动作共用一个忙标） */
const moreBusy = ref(false)

/** 落库分组：与设置中心的「用户级」运行口径一致，单组定位 */
const { group } = useLibraryGroups('image')

/**
 * 取生成结果的图片字节。
 *
 * <p>「更多」两个动作都要以 multipart 上传，而内联地址带鉴权、令牌又不进 URL
 * （与 {@link download} 同一条口径）。缩略图正常情况下已经由 mediaImages
 * 加载过 → isReady 直接复用其 blob URL；未就绪就等它加载完（最长约 6s），
 * 等不到就明确报错，绝不把 1×1 占位 GIF 传给后端。</p>
 *
 * @param url 结果图地址（内联 /v2/... 或供应商直链）
 * @return 图片字节
 */
async function fetchMediaBlob(url: string): Promise<Blob> {
  if (!url) {
    throw new Error('图片地址为空')
  }
  if (!isInlineMedia(url)) {
    // 供应商直链不带鉴权，普通 fetch 即可（与下载同口径：不附令牌）
    const res = await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' })
    if (!res.ok) throw new Error(`获取图片失败（HTTP ${res.status}）`)
    return res.blob()
  }
  for (let i = 0; i < 30 && !mediaImages.isReady(url); i += 1) {
    await new Promise((r) => setTimeout(r, 200))
  }
  if (!mediaImages.isReady(url)) {
    throw new Error('图片尚未加载完成，请稍后再试')
  }
  const res = await fetch(mediaImages.resolve(url))
  if (!res.ok) throw new Error(`读取图片失败（HTTP ${res.status}）`)
  return res.blob()
}

/** 提示词 → 底库名（截断防超长；空提示词兜底） */
function promptName(prompt: string, max: number, fallback: string): string {
  const s = (prompt ?? '').trim()
  return s ? s.slice(0, max) : fallback
}

/** 「更多 → 添加到人脸库」：以生成图直接登记（图里没人脸/多脸时前端先预检，给出明确原因） */
async function enrollGeneratedFace(url: string, prompt: string) {
  if (moreBusy.value) return
  moreBusy.value = true
  try {
    const blob = await fetchMediaBlob(url)
    // 先预检人脸数：后端登记失败只回笼统「登记失败」（S0503C0000，不带原因），
    // 这里提前用 detect 说清「没检出 / 多张」，否则用户永远不知道生成图为什么加不进去。
    const det = await apiService.detectFace(blob, 'generated.png')
    const faceCount = Number(det?.count ?? 0)
    if (faceCount === 0) {
      message.warning('添加到人脸库失败：生成图中未检测到人脸，请生成含人脸的图片后重试')
      return
    }
    if (faceCount > 1) {
      message.warning(`添加到人脸库失败：检测到 ${faceCount} 张人脸，人脸底库只支持单脸登记，请裁剪到只含目标人脸`)
      return
    }
    const id = `face-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const name = promptName(prompt, 20, '生成人脸')
    await apiService.enrollFace(id, blob, { label: name, name, note: '来自图像生成' }, 'generated.png')
    message.success(`已添加到人脸库：${name}`)
  } catch (e: any) {
    // 透出后端真实 msg（含「未检测到人脸」等业务提示）；极端情况下才是未知错误
    const reason = (e as Error)?.message || '未知错误'
    message.error(`添加到人脸库失败：${reason}`)
  } finally {
    moreBusy.value = false
  }
}

/** 「更多 → 添加到图像库」：建图像检索索引（接口与 ImageSearchPage「加入图像底库」一致） */
async function indexGeneratedImage(url: string, prompt: string) {
  if (moreBusy.value) return
  moreBusy.value = true
  try {
    const blob = await fetchMediaBlob(url)
    const name = promptName(prompt, 60, '生成图')
    // multipart 走 client（boundary 由底层生成）；落库是单组定位口径，同设置中心
    await apiService.indexImage(blob, name, group.value)
    message.success('已加入图像底库')
  } catch (e: any) {
    message.error(`加入图像底库失败：${(e as Error)?.message || '未知错误'}`)
  } finally {
    moreBusy.value = false
  }
}

/** 「更多」菜单分发 */
function onMoreCommand(
  cmd: string | number | object,
  entry: { key: string; url: string },
  row: Row,
) {
  if (cmd === 'face') {
    void enrollGeneratedFace(entry.url, row.task.prompt)
  } else if (cmd === 'image') {
    void indexGeneratedImage(entry.url, row.task.prompt)
  }
}

const remake = (task: GenerateTask) => {
  // 任务的 prompt 里已经含风格描述（风格是拼进去的，不是独立参数），
  // 直接整句回填即可；style 只用于芯片高亮。
  prompt.value = task.prompt
  model.value = task.model
  size.value = task.size ?? ''
  style.value = task.style ?? ''
  count.value = task.count ?? 1
  void nextTick(() => {
    // 切模型的清空 watch 已在 nextTick 前跑完，这里回填高级参数不会被冲掉
    // （steps 任务记录未回传，保持为空按模型默认处理）
    advNegative.value = task.negativePrompt || ''
    if (task.seed !== null && task.seed !== undefined) {
      advSeed.value = task.seed
    }
    composerRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    const editor = composerRef.value?.querySelector<HTMLElement>('.ProseMirror')
    editor?.focus()
  })
}

/**
 * 参考图长边上限（像素）。
 *
 * 图生图只需要看清主体与构图，1024 足够；原图常见 3000~4000px，
 * 整张 base64 会有 2~6MB，落库后一条记录就顶几十条纯文本任务。
 * 定这个值时对照过实际出图质量：1024 缩略图对构图判断没有可见影响。
 */
const REF_MAX_EDGE = 1024

/** 缩放后转 JPEG 的质量：0.85 在「看不出压缩痕」与体积之间取平衡 */
const REF_JPEG_QUALITY = 0.85

/** 参考图的尺寸信息：缩放后的图用于提交，原始尺寸用于渲染还原 */
interface ReferenceMeta {
  /** 用户选择的原图宽高 */
  originalWidth: number
  originalHeight: number
  /** 实际发往后端的宽高 */
  width: number
  height: number
}

/** 参考图缩放结果 */
interface ShrinkResult extends ReferenceMeta {
  dataUrl: string
  /** 是否真的缩放过（false = 原样发送） */
  shrunk: boolean
}

/** 当前参考图的尺寸信息 */
const referenceMeta = ref<ReferenceMeta | null>(null)

/** 正在缩放：期间禁用再次上传与提交，避免拿到半张图 */
const shrinkingRef = ref(false)

/**
 * 参考图的显示宽高比。
 *
 * 用**原始尺寸**而不是缩放后的尺寸：缩放是等比的，两者比例一致，
 * 但原图尺寸才是用户心里「这张图长什么样」的基准，历史卡片回放时也按它算。
 */
const referenceRatio = computed(() => {
  const meta = referenceMeta.value
  if (!meta || !meta.originalWidth || !meta.originalHeight) {
    return '1 / 1'
  }
  return `${meta.originalWidth} / ${meta.originalHeight}`
})

/**
 * 历史任务里参考图的显示比例。
 *
 * 创建响应带回了原始尺寸就用它；刷新页面重新拉列表时那两个数字不在库里
 * （后端刻意不存，只在响应里回带），此时退回 1:1 —— 缩放是等比的，
 * 比例本身没丢，只是不再精确到原始像素，视觉上无差别。
 *
 * @param task 任务行
 * @return CSS aspect-ratio 值
 */
const refRatioOf = (task: GenerateTask): string => {
  const w = task.referenceWidth
  const h = task.referenceHeight
  if (w && h) {
    return `${w} / ${h}`
  }
  return '1 / 1'
}

/** 正在删除的任务号：用于禁用该卡的删除按钮，防重复点击 */
const deletingId = ref('')

/**
 * 选择模式：进入后每张卡出现勾选框，顶部换成「已选 / 全选 / 删除选中 / 退出」。
 *
 * <p>与「清理失败」「清空全部」互斥显示：三套删除入口并存会让人说不清点的是哪个，
 * 而这三者后果差别很大（部分记录 / 勾选记录 / 全部记录含作品）。</p>
 */
const selecting = ref(false)

/** 选择模式下已勾选的任务号 */
const selectedIds = ref(new Set<string>())

/** 批量下载选中记录的全部结果：逐张走既有鉴权下载通道，序号连续编排 */
const downloadSelected = () => {
  const picked = rows.value.filter((row) => selectedIds.value.has(row.id))
  let seq = 0
  for (const row of picked) {
    for (const item of row.items) {
      if (mediaFailed(item.url)) {
        continue
      }
      download(item.url, row.task.type, row.task, seq)
      seq += 1
    }
  }
  if (seq > 0) {
    message.success(`已开始下载 ${seq} 个文件`)
  }
}

/**
 * 批量收藏勾选中的记录。
 *
 * <p>与单张收藏共用同一本地集合（favorites / FAVORITE_KEY）；已收藏的自动跳过，
 * 全部已收藏时明确说明，不静默装作成功。仅操作当前筛选视图里勾中的行，
 * 与删除 / 下载选中同一口径。</p>
 */
const favoriteSelected = () => {
  const ids = rows.value.filter((row) => selectedIds.value.has(row.id)).map((row) => row.id)
  if (!ids.length) {
    message.info('请先勾选要收藏的记录')
    return
  }
  const added = ids.filter((id) => !favorites.value.includes(id))
  if (!added.length) {
    message.info('勾选的记录都已在收藏中')
    return
  }
  favorites.value = [...favorites.value, ...added]
  try {
    localStorage.setItem(FAVORITE_KEY, JSON.stringify(favorites.value))
  } catch {
    // 本地存储不可用（隐私模式/配额满）时不影响本次会话内的收藏状态
  }
  message.success(`已收藏 ${added.length} 条`)
}

/** 清理/批量删除/清空共用同一个进行中标记，避免并发破坏性操作互相穿插 */
const busyClearing = ref(false)

/**
 * 每秒推进一次的时钟，只为「已用时」这类相对时间用。
 *
 * <p>只在有任务在跑时开定时器：没有运行中的任务时它没有任何消费者，
 * 开着就是白白每秒唤醒一次 vue 做无意义的重渲染。</p>
 */
const nowTick = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | null = null

/**
 * 按需启停时钟。
 *
 * @param active 是否还有进行中的任务
 */
const syncTick = (active: boolean) => {
  if (active && tickTimer === null) {
    tickTimer = setInterval(() => {
      nowTick.value = Date.now()
    }, 1000)
  } else if (!active && tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
}

/**
 * 服务器时钟与浏览器时钟的偏移（毫秒，server - client）。
 *
 * <p>「已用时」要拿服务端写的 createdAt 减当前时间。若直接用浏览器时钟去减，
 * 两台机器时钟不一致时结果就错了：实测服务端比浏览器快约 7 秒，
 * 于是前 7 秒算出来是负数、被压成 0，计数器要等 7 秒才起步（并且中间还会跳秒）。</p>
 *
 * <p>偏移用「运行中任务的 updatedAt」估：后端在生成期间每秒刷新它（心跳），
 * 所以它近似等于服务端的当前时间，误差约 1 秒。只取运行中的任务——
 * 已结束任务的 updatedAt 停在完成那一刻，拿它估会把偏移算成偏负值。</p>
 */
const clockSkew = ref(0)

/**
 * 任务已用时（秒）。
 *
 * <p>把浏览器时钟换算到服务端时钟再与 createdAt 相减，避免时钟偏差吃掉开头几秒。
 * 用 createdAt 而不是 updatedAt：后者被心跳每秒刷新，拿它算永远是 0 秒。</p>
 *
 * @param task 任务行
 * @return 已用秒数
 */
const elapsedSeconds = (task: GenerateTask) => {
  if (!task.createdAt) {
    return 0
  }
  // 时钟偏移必须按「这条任务自己」的 updatedAt 算，不能跨任务取最大值。
  // 原因：运行中任务的 updatedAt 由服务端心跳每 2 秒刷新，等于「服务端此刻」；
  // 而列表里只要有一条陈旧的进行中记录（心跳早停了、updatedAt 停在过去），
  // 取最大值会把偏移拖成一个很大的负数，于是新任务的
  // nowTick + skew - createdAt 恒为负，被 Math.max(0,…) 压成 0 —— 表现为
  // 「已用时一直 0s」。这正是 records-accept 能复现、而单独提交不复现的原因。
  const updatedAt = task.updatedAt
  const live = updatedAt != null && (task.status === 'PENDING' || task.status === 'RUNNING')
  const skew = live ? updatedAt - nowTick.value : clockSkew.value
  return Math.max(0, Math.floor((nowTick.value + skew - task.createdAt) / 1000))
}

/**
 * 正在把历史参考图取回成 base64（「再次生成」回填阶段）。
 *
 * <p>历史里的参考图是地址，取字节要一次网络往返；这段时间里参数栏不能看着像
 * 「已回填好参考图」——否则用户会以为可以提交了，实际提交出去的是文生图。</p>
 */
const refilling = ref(false)

/**
 * 用运行中任务的心跳时间持续校正时钟偏移。
 *
 * <p>放在 watch 里而不是 computed 里：computed 只该用来求值，
 * 在里面顺手改另一个响应式状态会让「谁改了它」变得难以追踪。</p>
 */
watch(
  tasks,
  (list) => {
    const runningStamps = list
      .filter((t) => t.status === 'PENDING' || t.status === 'RUNNING')
      .map((t) => t.updatedAt ?? 0)
    const newest = runningStamps.length ? Math.max(...runningStamps) : 0
    if (newest > 0) {
      clockSkew.value = newest - Date.now()
    }
  },
  { deep: true },
)

/**
 * 进入选择模式并清空上一轮的选择。
 */
const enterSelectMode = () => {
  selectedIds.value = new Set()
  selecting.value = true
  // 收起来源弹层：批量删除是从「记录管理」弹层里点的，弹层 v-if="!selecting" 会被销毁；
  // 不复位的话退出选择模式后它会带着 show=true 重新挂载 —— 自动弹出、且因为 CustomPopover
  // 的 watch 非 immediate 而收不到 Esc/点外部，成了关不掉的死弹层。
  recordsOpen.value = false
}

/** 退出选择模式并清空选择 */
const exitSelectMode = () => {
  selecting.value = false
  selectedIds.value = new Set()
}

/**
 * 切换一条记录的选择状态。
 *
 * @param taskId 任务号
 */
const toggleSelect = (taskId: string) => {
  const next = new Set(selectedIds.value)
  if (next.has(taskId)) {
    next.delete(taskId)
  } else {
    next.add(taskId)
  }
  // 换一个新 Set 而不是原地增删：原地改不会触发依赖 .size 的模板更新
  selectedIds.value = next
}

/** 全选 / 取消全选（作用于当前可见的 rows，与筛选结果一致） */
const toggleSelectAll = () => {
  selectedIds.value =
    selectedIds.value.size === rows.value.length && rows.value.length
      ? new Set()
      : new Set(rows.value.map((row) => row.id))
}

/**
 * 卡片本体点击：
 * - 选择模式下 = 勾选；
 * - 画廊里点空白处 = 进舞台看这一张（图上各处操作按钮都带 .stop，不会误触）。
 *
 * @param row 卡片行
 * @param ev  点击事件
 */
const onCardClick = (row: Row, ev: MouseEvent) => {
  if (selecting.value) {
    toggleSelect(row.id)
    return
  }
  const target = ev.target as HTMLElement | null
  // 按钮 / 链接 / 输入框有自己的语义；结果图那一块由 onGridClick 负责定位到具体第几张
  if (target?.closest('button, a, input, label, video, .wg-grid, .el-dropdown, .el-popover')) {
    return
  }
  if (row.kind === 'result') {
    openStage(row)
  }
}

/**
 * 结果图点击：画廊里点任意一张 → 进舞台并定位到那一张。
 *
 * <p>之前这里是 v-viewer 直接弹 viewerjs。现在「点开大图」的落点是 05 舞台，
 * 一个页面里只留一个沉浸入口；viewerjs 退到舞台的「查看原图」里，
 * 需要 1:1 看像素时再进去。图上的操作按钮（下载 / 收藏 / 更多）各自 .stop，不受影响。</p>
 *
 * @param ev  点击事件
 * @param row 卡片行
 */
const onGridClick = (ev: MouseEvent, row: Row) => {
  if (selecting.value || row.kind !== 'result') {
    return
  }
  const target = ev.target as HTMLElement | null
  if (target?.closest('button, video')) {
    return
  }
  const thumb = target?.closest<HTMLElement>('.wg-thumb')
  openStage(row, Number(thumb?.dataset.index ?? 0) || 0)
}

/** 删除勾选的记录 */
const deleteSelected = async () => {
  if (busyClearing.value) {
    return
  }
  const ids = [...selectedIds.value]
  if (!ids.length) {
    message.info('请先勾选要删除的记录')
    return
  }
  try {
    await message.confirm(`将删除勾选的 ${ids.length} 条记录，此操作不可恢复。`, '批量删除', '删除', '取消', 'warning')
  } catch {
    return
  }
  busyClearing.value = true
  try {
    const removed = await apiService.batchDeleteTasks(ids)
    await loadHistory()
    exitSelectMode()
    message.success(removed > 0 ? `已删除 ${removed} 条` : '没有可删除的记录')
  } catch (error) {
    message.error(`删除失败：${(error as Error)?.message || '未知错误'}`)
  } finally {
    busyClearing.value = false
  }
}

/**
 * 清空全部记录（含已生成的作品）。
 *
 * <p>要求手动输入确认词：这是唯一会删掉成功作品的入口，而两个按钮点一下的确认
 * 对它的后果（全部作品不可恢复地消失）不成比例。确认词用「清空」——
 * 与按钮同名，用户不需要猜该输什么。</p>
 */
const confirmClearAll = async () => {
  if (busyClearing.value) {
    return
  }
  const total = tasks.value.length
  if (!total) {
    message.info('当前没有记录')
    return
  }
  try {
    await ElMessageBox.prompt(
      `将删除全部 ${total} 条记录，包括已生成的作品，且不可恢复。请输入「清空」以确认。`,
      '清空全部记录',
      {
        type: 'warning',
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        inputPlaceholder: '清空',
        inputValidator: (value: string) => (value || '').trim() === '清空' || '请输入「清空」两个字',
      },
    )
  } catch {
    return
  }
  busyClearing.value = true
  try {
    const removed = await apiService.deleteAllTasks()
    await loadHistory()
    message.success(removed > 0 ? `已清空 ${removed} 条` : '没有可清空的记录')
  } catch (error) {
    message.error(`清空失败：${(error as Error)?.message || '未知错误'}`)
  } finally {
    busyClearing.value = false
  }
}

/** 停止请求进行中的任务（防重复点击） */
const cancelingIds = reactive(new Set<string>())

/**
 * 停止进行中的生成任务。
 *
 * <p>视频生成动辄几分钟，必须能主动停。调后端取消接口收敛为 CANCELED，
 * 成功后立刻回源一次拿权威状态；若后端还在收敛，{@link pollTask} 会按原节奏
 * 追到终态。不在前端把状态硬写成 CANCELED——万一任务其实已经出图，硬写会掩盖真相。</p>
 */
const cancelTask = async (task: GenerateTask) => {
  if (cancelingIds.has(task.taskId)) {
    return
  }
  cancelingIds.add(task.taskId)
  try {
    const ok = await apiService.cancelGenerateTask(task.taskId)
    if (!ok) {
      message.warning('停止失败：任务可能已经结束')
    } else {
      message.success('已发送停止请求')
    }
    // attempt 传 90：只回源一次不再续期（pollTask 里 attempt>=90 即停）
    void pollTask(task.taskId, 90)
  } catch (error) {
    message.error(`停止失败：${(error as Error)?.message || '未知错误'}`)
  } finally {
    cancelingIds.delete(task.taskId)
  }
}

/**
 * 删除单条生成记录。
 *
 * 成功后要把行从 tasks 里摘掉，并同步修正 loadedCount —— 它是滚动分页的游标，
 * 不减的话下一页会跳过一条，用户会看到「有记录没加载出来」。
 *
 * @param task 目标任务
 */
const removeTask = async (task: GenerateTask) => {
  if (deletingId.value) {
    return
  }
  try {
    await message.confirm(
      task.status === 'FAILED' || task.status === 'CANCELED'
        ? '确定删除这条失败记录？'
        : '确定删除这条记录？删除后无法恢复。',
      '删除确认',
      '删除',
      '取消',
      'warning',
    )
  } catch {
    // 用户点了取消
    return
  }
  deletingId.value = task.taskId
  try {
    const ok = await apiService.deleteGenerateTask(task.taskId)
    if (!ok) {
      message.error('删除失败：记录不存在或不属于当前用户')
      return
    }
    const index = tasks.value.findIndex((item) => item.taskId === task.taskId)
    if (index >= 0) {
      tasks.value.splice(index, 1)
      loadedCount.value = Math.max(0, loadedCount.value - 1)
    }
    // 正在轮询的任务要停掉，否则终态回写会把已删除的行重新塞回列表
    const timer = pollTimers.get(task.taskId)
    if (timer !== undefined) {
      clearTimeout(timer)
      pollTimers.delete(task.taskId)
    }
    message.success('已删除')
  } catch (error) {
    message.error(`删除失败：${(error as Error)?.message || '未知错误'}`)
  } finally {
    deletingId.value = ''
  }
}

/** 清理当前用户的全部失败与已取消记录 */
const clearFailedTasks = async () => {
  if (busyClearing.value) {
    return
  }
  const count = tasks.value.filter(
    (item) => item.status === 'FAILED' || item.status === 'CANCELED',
  ).length
  if (!count) {
    message.info('当前没有失败记录')
    return
  }
  try {
    await message.confirm(
      `将删除当前已加载的 ${count} 条失败/取消记录，此操作不可恢复。`,
      '清理失败记录',
      '清理',
      '取消',
      'warning',
    )
  } catch {
    return
  }
  busyClearing.value = true
  try {
    const removed = await apiService.deleteFailedTasks()
    if (removed > 0) {
      await loadHistory()
    }
    message.success(removed > 0 ? `已清理 ${removed} 条` : '没有可清理的记录')
  } catch (error) {
    message.error(`清理失败：${(error as Error)?.message || '未知错误'}`)
  } finally {
    busyClearing.value = false
  }
}

/**
 * 展示用的「完整提示词」：后端拼接结果（风格描述 + 用户原文）。
 *
 * 与用户原文相同（未选风格 / 描述本就在原文里）或存量数据为空时不展示，
 * 避免同一句话在卡片上出现两遍。
 */
const finalPromptOf = (
  task: { prompt?: string | null; finalPrompt?: string | null } | null | undefined,
): string => {
  const full = (task?.finalPrompt || '').trim()
  const raw = (task?.prompt || '').trim()
  return full && full !== raw ? full : ''
}

/**
 * 复制提示词到剪贴板。
 *
 * 部署常见于 http（非安全上下文），此时 navigator.clipboard 不可用，
 * 降级为临时 textarea + execCommand，保证内网环境也能复制。
 */
const copyPrompt = async (text: string) => {
  const value = (text || '').trim()
  if (!value) {
    message.warning('该任务没有提示词')
    return
  }
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value)
    } else {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.setAttribute('readonly', 'readonly')
      ta.style.position = 'fixed'
      ta.style.top = '-1000px'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      ta.setSelectionRange(0, value.length)
      document.execCommand('copy')
      ta.remove()
    }
    message.success('提示词已复制')
  } catch {
    message.error('复制失败，请手动选择文本复制')
  }
}

/** 按历史任务的原提示词与参数再生成一次（含参考图） */
const regenerate = async (task: GenerateTask) => {
  if (submitting.value) {
    return
  }
  prompt.value = task.prompt
  model.value = task.model
  size.value = task.size ?? ''
  style.value = task.style ?? ''
  count.value = task.count ?? 1
  // 历史里的参考图是「地址」不是 base64（列表不再吐 base64，见 generate.api.ts），
  // 而创建接口要的是 data URI，所以这一步按需把字节取回来再拼成 data URI。
  // 取不回来就按「没有参考图」处理：宁可退化成文生图，也不要拿一个 URL 当参考图发出去。
  refilling.value = true
  try {
    referenceImage.value = await resolveReferenceImage(task.referenceImage)
  } catch {
    referenceImage.value = ''
  } finally {
    refilling.value = false
  }
  // 原始尺寸只在创建响应里带过，刷新后不在库里；回填时能拿到就用，
  // 拿不到就退回按图自身比例渲染（referenceRatio 会兜底成 1:1）
  referenceMeta.value = task.referenceWidth && task.referenceHeight
    ? {
        originalWidth: task.referenceWidth,
        originalHeight: task.referenceHeight,
        width: task.referenceWidth,
        height: task.referenceHeight,
      }
    : null
  await nextTick()
  // 「再次生成」按原任务回填高级参数：carry 直发、不写面板状态（上面改了
  // model.value，切模型清空的 watch 会把状态冲掉）。steps 后端任务记录未回传，
  // 按模型默认处理；要完整复现需后端在任务记录里补 steps 字段。
  await onComposerSubmit(task.prompt, {
    negativePrompt: task.negativePrompt,
    seed: task.seed,
  })
}

/**
 * 把任务记录里的种子带入输入条的高级参数：「这张满意，换提示词保种子微调」。
 * 种子写在面板状态里随下次提交下发；若任务用的不是当前模型，先切过去——
 * 必须等切模型的清空 watch 跑完（nextTick）再写种子，否则刚写的值会被冲掉。
 */
const reuseSeed = async (task: GenerateTask) => {
  if (task.seed === null || task.seed === undefined) {
    message.warning('这条任务没有记录种子')
    return
  }
  if (model.value !== task.model) {
    model.value = task.model
    await nextTick()
  }
  if (!seedSupported.value) {
    message.warning('当前模型不支持随机种子参数')
    return
  }
  advSeed.value = task.seed
  canvasRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
  message.success(`已带入种子 ${task.seed}，改好提示词后发送`, { duration: 2500 })
}

/* ---------- 第三轮：整套参数复用 / 常用提示词夹 / 多图对比 ---------- */

/** 把提示词输入区拉回视野并聚焦（Tiptap 的 ProseMirror 挂在输入条里） */
const focusComposerInput = () => {
  composerRef.value?.querySelector<HTMLElement>('.ProseMirror')?.focus()
}

/**
 * 按这套参数再来一张：只回填 模型/风格/尺寸/张数，不动当前提示词、不自动提交。
 * 与「再次生成」的差别：不重放旧提示词——参数定好后聚焦输入区，
 * 用户写完自己的提示词再发。切模型会触发清空联动，先等一拍再聚焦。
 */
const reuseParams = async (task: GenerateTask) => {
  if (submitting.value) {
    return
  }
  model.value = task.model
  size.value = task.size ?? ''
  style.value = task.style ?? ''
  count.value = task.count ?? 1
  await nextTick()
  focusComposerInput()
  message.success('已按这条的参数回填，写好提示词后发送', { duration: 2200 })
}

/* ---------- 常用提示词夹：本地保存好用的提示词，点按回填 ---------- */

const PROMPT_FAV_KEY = 'ai-guada:generate-prompt-favs'
const PROMPT_FAV_MAX = 50

const loadPromptFavs = (): string[] => {
  try {
    const raw = localStorage.getItem(PROMPT_FAV_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(list)) {
      return []
    }
    return list.filter((s): s is string => typeof s === 'string' && s.trim() !== '').slice(0, PROMPT_FAV_MAX)
  } catch {
    return []
  }
}

const promptFavs = ref<string[]>(loadPromptFavs())
const promptFavsOpen = ref(false)

const persistPromptFavs = () => {
  try {
    localStorage.setItem(PROMPT_FAV_KEY, JSON.stringify(promptFavs.value))
  } catch {
    /* 存储满/被禁用时静默降级：本次会话内仍可用 */
  }
}

const isPromptFav = computed(() => {
  const p = prompt.value.trim()
  return p !== '' && promptFavs.value.includes(p)
})

const addPromptFav = () => {
  const p = prompt.value.trim()
  if (!p) {
    return
  }
  if (promptFavs.value.includes(p)) {
    message.info('这条提示词已在常用里')
    return
  }
  promptFavs.value = [p, ...promptFavs.value].slice(0, PROMPT_FAV_MAX)
  persistPromptFavs()
  message.success('已存入常用提示词')
}

const removePromptFav = (p: string) => {
  promptFavs.value = promptFavs.value.filter((s) => s !== p)
  persistPromptFavs()
}

const applyPromptFav = (p: string) => {
  prompt.value = p
  promptFavsOpen.value = false
  focusComposerInput()
}

/** 最近使用：输入历史（IndexedDB）里最近发过的提示词，弹层里只露 8 条 */
const recentPrompts = computed(() => promptHistory.value.slice(0, 8))

/* ---------- 多图对比：同一次生成的多张结果并排同屏 ---------- */

const compareTask = ref<GenerateTask | null>(null)
/** 被点灭的列（结果下标）；对比至少保留 2 张才有意义 */
const compareOff = ref<Set<number>>(new Set())

const compareOnIndexes = computed(() => {
  const t = compareTask.value
  if (!t) {
    return [] as number[]
  }
  return t.urls.map((_, i) => i).filter((i) => !compareOff.value.has(i))
})

/** 上次选的对比方式记到本地，下次打开沿用 */
const COMPARE_MODE_KEY = 'ai-guada:generate-compare-mode'

const loadCompareMode = (): 'grid' | 'slide' | 'fade' => {
  try {
    const raw = localStorage.getItem(COMPARE_MODE_KEY)
    return raw === 'slide' || raw === 'fade' ? raw : 'grid'
  } catch {
    return 'grid'
  }
}

/** 对比方式：grid=并排铺开，slide=两张叠放拖分割线，fade=两张叠放调透明度淡入 */
const compareMode = ref<'grid' | 'slide' | 'fade'>(loadCompareMode())
/** 叠加模式里上层图的透明度（0-100）：100=上层完全不透明，0=完全露出下层 */
const compareFade = ref(60)
/** 滑动模式里分割线位置（0-100，左图占前 compareSplit%） */
const compareSplit = ref(50)
const compareSlideEl = ref<HTMLElement | null>(null)
let compareDragging = false

/** 滑动对照的两张：取当前点亮的前两张（默认第 1、2 张） */
const compareSlideSides = computed<{ left: { index: number; url: string }; right: { index: number; url: string } } | null>(() => {
  const t = compareTask.value
  const a = compareOnIndexes.value[0]
  const b = compareOnIndexes.value[1]
  if (!t || a === undefined || b === undefined) {
    return null
  }
  const ua = t.urls[a]
  const ub = t.urls[b]
  if (ua === undefined || ub === undefined) {
    return null
  }
  return { left: { index: a, url: ua }, right: { index: b, url: ub } }
})

const setCompareMode = (mode: 'grid' | 'slide' | 'fade') => {
  compareMode.value = mode
  if (mode === 'slide') {
    compareSplit.value = 50
  }
  if (mode === 'fade') {
    compareFade.value = 60
  }
  try {
    localStorage.setItem(COMPARE_MODE_KEY, mode)
  } catch {
    /* 隐私模式等场景 localStorage 不可写：只是不记忆偏好，功能不受影响 */
  }
}

/** 叠加模式的方向键微调：每次 5%，不便拖滑杆的用户也能调 */
const nudgeCompareFade = (delta: number) => {
  compareFade.value = Math.min(100, Math.max(0, compareFade.value + delta))
}

const updateCompareSplit = (event: PointerEvent) => {
  const el = compareSlideEl.value
  if (!el) {
    return
  }
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0) {
    return
  }
  const pct = ((event.clientX - rect.left) / rect.width) * 100
  compareSplit.value = Math.min(100, Math.max(0, pct))
}

const onCompareSlideDown = (event: PointerEvent) => {
  if (compareMode.value !== 'slide') {
    return
  }
  compareDragging = true
  compareSlideEl.value?.setPointerCapture(event.pointerId)
  updateCompareSplit(event)
}

const onCompareSlideMove = (event: PointerEvent) => {
  if (compareDragging) {
    updateCompareSplit(event)
  }
}

const onCompareSlideUp = () => {
  compareDragging = false
}

/** 键盘微调：方向键每次移动 2%，不便拖动的用户也能对照 */
const nudgeCompareSplit = (delta: number) => {
  compareSplit.value = Math.min(100, Math.max(0, compareSplit.value + delta))
}

const openCompare = (task: GenerateTask) => {
  if (!task.urls || task.urls.length < 2) {
    return
  }
  compareTask.value = task
  compareOff.value = new Set()
  compareMode.value = loadCompareMode()
  compareSplit.value = 50
  compareFade.value = 60
  nextTick(() => {
    document.querySelector<HTMLElement>('.wg-compare')?.focus()
  })
}

const toggleCompareColumn = (i: number) => {
  if (!compareTask.value) {
    return
  }
  const next = new Set(compareOff.value)
  if (next.has(i)) {
    next.delete(i)
  } else {
    if (compareOnIndexes.value.length <= 2) {
      message.warning('对比至少保留 2 张')
      return
    }
    next.add(i)
  }
  compareOff.value = next
}

const closeCompare = () => {
  compareTask.value = null
  compareOff.value = new Set()
  compareMode.value = 'grid'
  compareSplit.value = 50
}

const loadModels = async () => {
  try {
    const list = await apiService.fetchGenerateModels(mediaType.value)
    models.value = list
    const keep = list.find((item) => item.model === model.value)
    const next = keep ?? list[0]
    if (next) {
      model.value = next.model
      const configSizes = next.config?.sizes ?? []
      if (!configSizes.includes(size.value)) {
        size.value = configSizes[0] ?? ''
      }
      if (!next.config?.durations?.length) {
        duration.value = undefined
      }
    }
  } catch {
    models.value = []
    model.value = ''
  }
}

/** 每页条数 */
const PAGE_SIZE = 30
/** 已加载条数，作为滚动分页游标 */
const loadedCount = ref(0)
/** 是否还有更多历史 */
const hasMore = ref(false)
const loadingMore = ref(false)

const loadHistory = async () => {
  loading.value = true
  try {
    const list = await apiService.fetchGenerateHistory(mediaType.value, PAGE_SIZE, 0)
    tasks.value = list
    loadedCount.value = list.length
    hasMore.value = list.length === PAGE_SIZE
    resumePolling(list)
  } catch {
    tasks.value = []
    loadedCount.value = 0
    hasMore.value = false
  } finally {
    loading.value = false
  }
}

/**
 * 对历史里未完成的任务重新发起轮询。
 *
 * <p>刷新页面 / 切换媒体类型后，{@link loadHistory} 只是把列表拉下来，
 * 并不会重建轮询定时器。后果是：一个正在生成的任务在刷新后就永远停在
 * 「生成中」，直到用户再次操作页面才可能更新——看起来就是卡死。
 * 这里把 PENDING / RUNNING 的行重新拉回轮询。</p>
 *
 * @param list 刚拉到的任务列表
 */
const resumePolling = (list: GenerateTask[]) => {
  for (const task of list) {
    if (task.status !== 'PENDING' && task.status !== 'RUNNING') {
      continue
    }
    if (pollTimers.has(task.taskId)) {
      continue
    }
    void pollTask(task.taskId, 0)
  }
}

/**
 * 追加下一页历史（滚动分页）。
 *
 * 失败时不改 hasMore，用户继续滚动会自然重试；
 * 结果按 taskId 去重，避免与轮询中已插入的行重复。
 */
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) {
    return
  }
  loadingMore.value = true
  try {
    const list = await apiService.fetchGenerateHistory(mediaType.value, PAGE_SIZE, loadedCount.value)
    if (list.length) {
      const seen = new Set(tasks.value.map((task) => task.taskId))
      tasks.value.push(...list.filter((task) => !seen.has(task.taskId)))
      loadedCount.value += list.length
    }
    hasMore.value = list.length === PAGE_SIZE
  } catch {
    // 保留 hasMore，滚动时会再试
  } finally {
    loadingMore.value = false
  }
}

/** 画布滚动：距底部 200px 内触发补页；翻过约两屏后亮出「回到顶部」 */
const onCanvasScroll = () => {
  const el = canvasRef.value
  if (!el) {
    return
  }
  showBackTop.value = el.scrollTop > BACK_TOP_THRESHOLD
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    void loadMore()
  }
}

/** 单任务轮询：终态后落回列表 */
/* ---------- 任务完成桌面通知（可选，仅长任务、仅页面在后台时） ---------- */

/** 通知开关持久化键：授权一次以后不再问 */
const NOTIFY_KEY = 'ai-guada:generate-notify'

/** 桌面通知是否已开启（用户点过开关且浏览器已授权） */
const notifyEnabled = ref(false)

/**
 * 这个任务值不值得弹通知。
 *
 * <p>只提醒长任务：视频必提醒；图片只有多图才值得提醒——
 * 单图几十秒就出结果，用户大概率还盯着页面，弹了反而是打扰。</p>
 */
const notifyWorthy = (task: GenerateTask) => task.type === 'video' || (task.urls?.length ?? 0) > 1

/**
 * 打开桌面通知：先请求授权再记忆开关。
 *
 * <p>Notification API 在不支持 / 被拒时明确告知但不打断——桌面通知是锦上添花，
 * 不值得为它阻塞主流程。</p>
 */
const enableNotify = async () => {
  if (typeof Notification === 'undefined') {
    message.warning('当前浏览器不支持桌面通知')
    return
  }
  let permission = Notification.permission
  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission()
    } catch {
      permission = 'denied'
    }
  }
  if (permission !== 'granted') {
    message.info('浏览器未授予通知权限，可在地址栏锁形图标处手动允许')
    return
  }
  notifyEnabled.value = true
  try {
    localStorage.setItem(NOTIFY_KEY, '1')
  } catch {
    // 存不下就只记本次会话
  }
  message.success('任务完成时会桌面提醒你（仅页面在后台时）')
}

/** 关闭桌面通知：只关本页开关，不撤销浏览器授权 */
const disableNotify = () => {
  notifyEnabled.value = false
  try {
    localStorage.removeItem(NOTIFY_KEY)
  } catch {
    /* 忽略 */
  }
}

const toggleNotify = () => {
  if (notifyEnabled.value) {
    disableNotify()
    message.info('已关闭完成提醒')
  } else {
    void enableNotify()
  }
}

/**
 * 任务到终态时弹一条桌面通知。
 *
 * <p>三重克制：只提醒长任务、只在页面被切到后台时（前台有列表状态与 toast，
 * 再弹是打扰）、同一任务用 tag 去重。点击通知聚焦回页面。</p>
 */
const notifyTaskDone = (task: GenerateTask) => {
  if (!notifyEnabled.value || !notifyWorthy(task) || !document.hidden) {
    return
  }
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
    return
  }
  const what = task.type === 'video' ? '视频' : '图片'
  const title =
    task.status === 'SUCCESS'
      ? `${what}生成完成`
      : task.status === 'FAILED'
        ? `${what}生成失败`
        : `${what}已取消`
  try {
    const notification = new Notification(title, {
      body: (task.prompt || '').slice(0, 80),
      tag: task.taskId,
    })
    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch {
    // 部分环境（非安全上下文 / 扩展拦截）构造会抛；通知失败不影响轮询主流程
  }
}

const pollTask = async (taskId: string, attempt: number) => {
  // 已被删除：停止轮询，否则终态回写会把删掉的行重新塞回列表
  if (!tasks.value.some((item) => item.taskId === taskId)) {
    pollTimers.delete(taskId)
    return
  }
  try {
    const task = await apiService.fetchGenerateTask(taskId)
    if (task) {
      const index = tasks.value.findIndex((item) => item.taskId === taskId)
      if (index >= 0) {
        tasks.value.splice(index, 1, task)
      } else {
        tasks.value.unshift(task)
      }
      if (task.status === 'SUCCESS' || task.status === 'FAILED' || task.status === 'CANCELED') {
        pollTimers.delete(taskId)
        // 页面在后台时补一条桌面通知；前台有列表状态与 toast，不重复打扰
        notifyTaskDone(task)
        return
      }
    }
  } catch (error) {
    // 404 = 服务端已无此任务（被删除，或被「清理失败」批量清掉）。
    // 这是终态而非瞬时故障，继续重试只会白打 3 分钟的 404（90 次 × 2s），
    // 既刷爆控制台又毫无意义，故立刻停止并移除本地行，避免列表里留一条查不到的死记录。
    const err = error as { status?: number; code?: string | number; response?: { status?: number } }
    const status = err?.status ?? err?.response?.status
    if (status === 404 || err?.code === 'NOT_FOUND') {
      pollTimers.delete(taskId)
      const index = tasks.value.findIndex((item) => item.taskId === taskId)
      if (index >= 0) {
        tasks.value.splice(index, 1)
      }
      return
    }
    // 其它单次查询失败（网络抖动、5xx）不终止轮询，达到上限后自然结束
  }
  if (attempt >= 90) {
    pollTimers.delete(taskId)
    return
  }
  pollTimers.set(
    taskId,
    setTimeout(() => void pollTask(taskId, attempt + 1), 2000),
  )
}

/** 提示词优化中：按钮转圈并禁用，防重复点击 */
const optimizing = ref(false)

/**
 * 模型输出的清洗。
 *
 * 就算系统提示词里明令「不要前缀、不要引号、不要代码块」，模型仍会时不时加上
 * 「优化后的文本：」「优化后：」这类标签，或用 ``` 包裹、整体加引号。
 * 这些字符会被原样拼进最终提示词发给生图模型（噪声），也会显示在输入框里（脏）。
 * 这里按「先剥壳、再剥标签、最后剥引号」的顺序清，剥不动就原样返回，绝不吞内容。
 *
 * @param raw 模型返回的原始文本
 * @return 可直接放进输入框的提示词
 */
const cleanOptimized = (raw: string) => {
  let text = (raw ?? '').trim()
  // 1. 代码块包裹
  const fence = /^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/.exec(text)
  if (fence) {
    text = fence[1].trim()
  }
  // 2. 「优化后的文本：」这类标签行（可能带换行）
  text = text.replace(/^优化(?:后|后的)?(?:的)?(?:文本|提示词|结果|内容)?\s*[:：]\s*/i, '')
  // 3. 整体包裹的引号（中文 / 英文，成对且不在首尾之外再出现）
  const quoted = /^(["'“”‘’])([\s\S]+)\1$/.exec(text)
  if (quoted) {
    text = quoted[2].trim()
  }
  return text
}

/**
 * 优化提示词：把输入框内容交给大模型扩写，再回填输入框。
 *
 * 场景传 image / video：后端据此选用对应的内置默认提示词（要素清单不同），
 * 管理员在「输入优化」全局设置里自定义了提示词时，仍以全局配置为准。
 * 失败或返回空内容时保留用户原文，不拿半截结果覆盖已有输入。
 */
const onOptimize = async () => {
  const source = prompt.value.trim()
  if (!source || optimizing.value) {
    return
  }
  optimizing.value = true
  try {
    const result = await apiService.optimizeInput(source, mediaType.value)
    const cleaned = cleanOptimized(result?.optimized ?? '')
    // 后端 status 是权威口径：没真正调模型（未配置客户端 / 已关闭 / 调用失败）
    // 与「模型认为够了」在文本上完全一样，只看文本会把前者说成后者。
    const status = result?.status ?? ''
    if (!cleaned) {
      message.warning('优化结果为空，已保留原文')
      return
    }
    if (status === 'UNAVAILABLE') {
      message.warning('输入优化暂不可用：未配置可用的优化模型，已保留原文')
      return
    }
    if (status === 'FAILED') {
      message.warning('优化调用失败，已保留原文')
      return
    }
    if (status === 'DISABLED') {
      message.info('输入优化已在管理端关闭，已保留原文')
      return
    }
    if (status === 'EMPTY') {
      message.warning('模型返回空内容，已保留原文')
      return
    }
    if (status === 'UNCHANGED' || cleaned === source) {
      message.info('未产生新的描述，已保留原文')
      return
    }
    prompt.value = cleaned
    message.success(`已优化（${result?.model || '默认模型'}，${result?.elapsedMillis ?? 0}ms）`)
  } catch (error) {
    message.error(`优化失败：${(error as Error)?.message || '未知错误'}`)
  } finally {
    optimizing.value = false
  }
}

/** GenerateComposer 提交：提示词由编辑器传入 */
/** 「再次生成」按原任务直传的高级参数：走旁路、不经过面板状态，
 * 因为 regenerate 改 model.value 会触发「切模型清空」的 watch，写状态必被冲掉 */
interface GenerateCarryParams {
  negativePrompt?: string | null
  seed?: number | null
  steps?: number | null
}

const onComposerSubmit = async (text: string, carry?: GenerateCarryParams) => {
  // 缩放未完成就提交：会把 undefined 当参考图发出去，或发出半张图
  if (submitting.value || shrinkingRef.value) {
    return
  }
  if (!text.trim()) {
    message.warning('请先描述你想生成的画面')
    return
  }
  if (!model.value) {
    // 模型列表可能因「页面加载时接口抖动」而为空，且 loadModels 只在挂载/切媒体时跑，
    // 不补这一次就会永久发不出去、只能刷新页面。
    await loadModels()
  }
  if (!model.value) {
    message.warning('请先选择生成模型')
    return
  }
  submitting.value = true
  try {
    // 风格不是上游参数，而是拼进提示词的描述。
    // 之前把 style 当独立参数下发，被 Agnes 判 400「style is not supported」。
    //
    // 拼接职责已移到后端：这里只分开发送「用户原文 prompt」与「所选风格描述
    // stylePrompt」，后端拼成完整提示词落 finalPrompt 列并送模型生成，prompt 列
    // 保持用户原文。正常路径下风格描述已经在输入框里了（芯片点击插到最前、
    // @ 插到原位），后端按「用户文本是否已包含描述」判重，不会重复拼接。
    const userText = text.trim()
    const desc = styleSupported.value ? stylePrompt.value.trim() : ''
    // 高级参数：「再次生成」用原任务回传的 carry 直发；正常提交按面板值，
    // 只在模型声明了能力位且用户填了值时下发，空值交给上游按默认处理。
    // 种子取整并夹到 ≥0；步数按模型声明的 min/max 夹紧，防止越界被上游 400。
    const negText = carry
      ? String(carry.negativePrompt ?? '').trim()
      : negativeSupported.value
        ? advNegative.value.trim()
        : ''
    const rawSeed = carry
      ? carry.seed
      : seedSupported.value && advSeed.value !== ''
        ? Number(advSeed.value)
        : null
    const seedNum =
      rawSeed !== null && rawSeed !== undefined && Number.isFinite(rawSeed)
        ? Math.max(0, Math.trunc(rawSeed))
        : null
    const rawSteps = carry
      ? carry.steps
      : stepsSupported.value && advSteps.value !== ''
        ? Number(advSteps.value)
        : null
    let stepsNum: number | null = null
    if (rawSteps !== null && rawSteps !== undefined && Number.isFinite(rawSteps)) {
      stepsNum = Math.trunc(rawSteps)
      if (stepsMin.value !== null) stepsNum = Math.max(stepsMin.value, stepsNum)
      if (stepsMax.value !== null) stepsNum = Math.min(stepsMax.value, stepsNum)
    }
    const task = await apiService.createGenerateTask({
      type: mediaType.value,
      model: model.value,
      prompt: userText,
      stylePrompt: desc || undefined,
      negativePrompt: negText || undefined,
      seed: seedNum ?? undefined,
      steps: stepsNum ?? undefined,
      size: size.value || undefined,
      count: mediaType.value === 'image' ? count.value : undefined,
      duration: mediaType.value === 'video' ? (duration.value ?? durations.value[0]) : undefined,
      referenceImage: referenceImage.value || undefined,
      // 原始尺寸单独带上：提交的图已缩放，卡片要按原比例渲染
      referenceWidth: referenceMeta.value?.originalWidth || undefined,
      referenceHeight: referenceMeta.value?.originalHeight || undefined,
    })
    tasks.value.unshift(task)
    // 记进本机输入历史（↑↓ 可翻回）：只存用户手打的那段，不存拼接后的风格描述，
    // 回填时风格仍由风格选择器负责，避免描述在提示词里出现两遍。
    // 写 IndexedDB 是异步的，不阻塞提交；完成后刷新列表。
    void rememberInput(userText, authStore.user?.username, 'generate').then((list) => {
      promptHistory.value = list
    })
    // 记住本次提交：创建接口只保证「记录已入库」便返回 200，上游是否受理要到轮询才知道
    // （限流、队列满、Key 失效都发生在入库之后的异步提交里）。没有这层监听的话，
    // 失败只会表现为卡片静默翻成「失败」——用户若提交后切走或看别的标签就完全察觉不到。
    watchingFailureFor = task.taskId
    prompt.value = ''
    // 参考图是「本次生成」的一次性输入：不清掉的话下一条会继续带着上一张参考图，
    // 用户看到的是「我明明删了/换了啊怎么还是那张图」。尺寸信息与提示一并清，
    // 否则换图后仍显示上一张的「已缩放 3024×4032」。
    clearReference()
    await nextTick()
    // 滚到顶部，让「进行中」行第一时间可见
    canvasRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
    void pollTask(task.taskId, 0)
  } catch (error) {
    // 之前这里只有 finally，异常被静默吞掉，表现为「点了发送没反应」
    // 变量名不能叫 message：本文件 816 行 import { message } from '@repo/core'，
    // 在 catch 里同名 const message 会把它遮蔽掉，于是下一行 message.error(...) 实际
    // 是作用在字符串上 → TypeError: message.error is not a function，
    // 结果失败时既没弹提示、又多抛一个异常，与这段注释想修的问题一模一样。
    // 同文件 1869 / 1891 行的 catch 都是直接用 e.message，也是这个道理。
    const errText = error instanceof Error ? error.message : String(error)
    message.error(`生成请求失败：${errText}`)
  } finally {
    submitting.value = false
  }
}

/**
 * 正在等待失败通知的本地任务号。
 *
 * <p>创建接口返回 200 只代表记录已入库，上游是否受理要到轮询才知道。持有一份
 * 「本次提交的 taskId」，在它翻成 FAILED/CANCELED 时弹一次提示。</p>
 */
let watchingFailureFor = ''

/** 已经弹过失败提示的任务号，避免同一条记录在多次轮询里反复弹 */
const notifiedFailure = new Set<string>()

watch(
  tasks,
  (list) => {
    if (!watchingFailureFor) {
      return
    }
    const task = list.find((item) => item.taskId === watchingFailureFor)
    if (!task) {
      return
    }
    if (task.status !== 'FAILED' && task.status !== 'CANCELED') {
      return
    }
    watchingFailureFor = ''
    if (notifiedFailure.has(task.taskId)) {
      return
    }
    notifiedFailure.add(task.taskId)
    message.error(task.errorMessage || '生成失败，请查看任务记录了解详情')
  },
  { deep: true }
)

// 切换图像/视频时收藏集合是全局的，不需要随媒体类型清理；
// 但筛选条件在切换后可能一个都匹配不到，这里保留条件让用户自己清。

watch(mediaType, () => {
  keyword.value = ''
})

/** 探测是否存在视频模型，决定是否显示「视频」tab */
const loadVideoAvailability = async () => {
  try {
    const list = await apiService.fetchGenerateModels('video')
    videoAvailable.value = list.length > 0
  } catch {
    videoAvailable.value = false
  }
}

onMounted(async () => {
  // 恢复桌面通知开关：必须「用户开过 && 浏览器仍授权」才亮，缺一即视为关闭
  try {
    notifyEnabled.value =
      localStorage.getItem(NOTIFY_KEY) === '1' &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
  } catch {
    notifyEnabled.value = false
  }
  await loadModels()
  await loadHistory()
  await loadVideoAvailability()
})

/**
 * keep-alive 缓存下重新进入页面时 onMounted 不会再次执行，
 * 这里补一次刷新，保证历史与模型是最新的。
 */
onActivated(async () => {
  if (!tasks.value.length) {
    await loadModels()
    await loadHistory()
  }
})

onUnmounted(() => {
  pollTimers.forEach((timer) => clearTimeout(timer))
  pollTimers.clear()
  // 停止「已用时」时钟：组件卸载后它没有消费者，留着就是每秒空转
  if (tickTimer !== null) {
    clearInterval(tickTimer)
    tickTimer = null
  }
})
</script>

<style scoped>
/*
 * 生图页样式。
 * 颜色/圆角/阴影一律取 koi 主题令牌（见 styles/refactor.css），
 * 不写死色值与自造圆角；浅色与暗色由令牌自动切换。
 */
.wg {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--color-bg);
  color: var(--color-text);
  /* 结果缩略图边长：改这里整页结果图等比变化。
     列表视图下卡片是「左图 / 右参数」两栏；190px 太瘦、240px 仍会在
     宽卡片里留出一大片空白（实测 1200px 卡里右侧空 500px+），
     拉到 300px 让图占住左栏，卡片不再看着「内容挤在左边」。 */
  --wg-thumb: 300px;
  /* 扇开时三张露头卡片占的横向宽度：110 − 46（压边）= 64 × 3。
     进行中 / 失败占位块的宽度上限也用这个值，保证等待态与出图后一样宽。 */
  --wg-fan-peek: 192px;
}

.wg-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* ---------- 顶部 ---------- */

/* 页面头本体（标题行 + 筛选行）已统一到 RePageHead。
   这里只保留头部内部的子元素样式（任务计数、工具按钮、搜索框、筛选胶囊）。 */
.wg-total {
  color: var(--color-text-gray);
  font-size: 14px;
}

/*
 * 生成类型切换按钮。
 * 与 .wg-mode 同一行高（38px）的工具按钮，但带文字（用户要一眼看出当前是图像还是视频），
 * 尺寸随内容走。颜色继承 --color-* 令牌，暗色模式自动跟随。
 */
.wg-media-btn {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 10px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--r);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.18s, border-color 0.18s;
}

.wg-media-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.wg-media-btn .wg-svg {
  width: 18px;
  height: 18px;
}

/* 右侧下拉箭头比左侧类型图标小一号，避免和主图标抢视觉重量 */
.wg-media-caret {
  width: 14px !important;
  height: 14px !important;
  color: var(--color-text-gray);
}

.wg-search {
  display: flex;
  flex: 1 1 320px;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--r-pill);
  background: var(--color-input-bg);
  color: var(--color-text-gray);
  transition: border-color 0.2s;
}

/* 操作区强行保持一行：RePageHead 默认允许换行，本页操作项偏多
   （视图 / 搜索 / 筛选 / 清理 / 排序），换行会让「排序」掉到第二行、
   头部整体变成两行高，标题与搜索框的垂直中心也错开。
   空间不够时不再换行，改为压缩搜索框（min-width 兜底）。 */
:deep(.re-page__actions) {
  flex-wrap: nowrap;
  min-width: 0;
  flex-shrink: 1;
}

/* 搜索框并入标题行后固定宽度：它原来是筛选行的主内容，可以撑满；
   现在同一行还有生成类型 / 视图 / 筛选 / 记录管理 / 排序，让它继续 flex-grow
   会把标题挤到换行，故收成定宽。 */
.re-page__actions .wg-search {
  flex: 0 1 240px;
  min-width: 120px;
}

.wg-search .wg-svg {
  width: 17px;
  height: 17px;
}

.wg-search-input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 14px;
  outline: none;
}

.wg-search-input::placeholder {
  color: var(--color-text-disabled);
}

/* 通用胶囊按钮：筛选 / 排序 / 输入条参数 */
.wg-chip {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  background: var(--color-secondary-surface);
  color: var(--color-text-gray);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, border-color 0.18s;
}

.wg-chip:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.wg-chip.is-strong {
  background: var(--color-primary-50);
  color: var(--color-primary);
  font-weight: 500;
}

.wg-chip .wg-svg {
  width: 15px;
  height: 15px;
}

/* 清理失败记录：破坏性操作，用危险色但不加实心底，避免在工具条里过度抢眼 */
.wg-chip-danger {
  color: var(--el-color-danger);
}

.wg-chip-danger:hover {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

/* 「N 个生成中」徽章：全局感知进行中任务，点击直达「只看生成中」筛选 */
.wg-chip-running {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 500;
}

.wg-chip-running:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.wg-running-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  animation: wg-running-pulse 1.4s ease-in-out infinite;
}

@keyframes wg-running-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.35;
    transform: scale(0.72);
  }
}

@media (prefers-reduced-motion: reduce) {
  .wg-running-dot {
    animation: none;
  }
}

.wg-chip:disabled {
  cursor: default;
  opacity: 0.6;
}

.wg-chip-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--r-pill);
  background: var(--color-primary);
  color: var(--color-primary-text);
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
}

/*
 * 作品形态切换（右上角）：画廊 / 舞台。
 * 一条轨道 + 两枚按钮，当前档用主色淡底，和输入条的 .wg-rail-seg 同一套读法。
 * 不用单个反复切换的图标钮：两种形态是一对等价的看法，
 * 用户要能一眼看到「现在在哪一档、另一档是什么」。
 */
.wg-mode {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 2px;
  height: 38px;
  padding: 3px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--r-pill);
  background: var(--color-surface);
}

.wg-mode-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 10px;
  border: 0;
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.wg-mode-btn:hover {
  color: var(--color-text);
  background: var(--color-surface-hover);
}

.wg-mode-btn.is-active {
  background: var(--color-primary-50);
  color: var(--color-primary);
  font-weight: 600;
}

.wg-mode-btn .wg-svg {
  width: 15px;
  height: 15px;
}

/* ---------- 下拉菜单（会话同款） ----------

   面板外壳交给 PickerPopover（CustomPopover）：圆角、毛玻璃、进出场与
   会话页的模型 / 思考 / 形态弹层是同一份实现。这里只管面板内部：
   分区小标题、30px 行、选中勾、页脚按键提示。

   滚动只留一层：外层 .popover-shell 已经按 max-height 裁切并滚动，
   菜单再套一层会出现双滚动条（内层滚到一半、外层才开始动）。*/

.wg-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: visible;
}

.wg-menu-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 6px 0 2px;
  padding: 4px 8px 6px;
  color: var(--color-text-gray);
  font-size: 11px;
  line-height: 16px;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: none;
}

.wg-menu-title:first-child {
  margin-top: 0;
}

/* 标题右侧的条数：会话的模型面板在同一位置给计数 */
.wg-menu-count {
  color: var(--color-text-gray);
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}

/* 常用夹里的「最近使用」段：与常用列表之间一条分隔线 */
.wg-recent-title {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--color-surface-border);
}

.wg-menu-empty {
  margin: 0;
  padding: 6px 8px 10px;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 18px;
}

/* 检索行：与会话模型面板同高（28px），图标 + 输入框 */
.wg-menu-search {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin: 0 0 4px;
  padding: 0 8px;
  border: 1px solid var(--color-surface-border);
  border-radius: 6px;
  background: var(--color-surface);
}

.wg-menu-search-icon {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
  color: var(--color-text-gray);
}

.wg-menu-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  outline: none;
}

.wg-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 30px;
  padding: 4px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  line-height: 18px;
  text-align: left;
  cursor: pointer;
  transition: background 0.12s ease;
}

/* hover 与键盘落点共用同一底色，避免「鼠标在 A、键盘在 B」两种高亮同时出现 */
.wg-menu-item:hover,
.wg-menu-item.is-nav {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
}

.wg-menu-item.is-active {
  background: var(--color-sidebar-bg-active);
  color: var(--color-primary);
}

.wg-menu-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.wg-menu-name {
  overflow: hidden;
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wg-menu-desc {
  color: var(--color-text-gray);
  font-size: 11px;
  line-height: 16px;
}

.wg-menu-check {
  flex: 0 0 auto;
  width: 14px;
  height: 14px;
}

/* 页脚按键提示：与会话面板的 hintNavigate / hintSelect / hintClose 同一行文 */
.wg-menu-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  padding: 6px 8px 2px;
  border-top: 1px solid var(--color-surface-border);
  color: var(--color-text-gray);
  font-size: 11px;
  line-height: 16px;
  user-select: none;
}

/* 菜单项左侧的类型图标（图像/视频），选中时跟随主色 */
.wg-menu-icon {
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
  color: var(--color-text-gray);
  transition: color 0.18s;
}

.wg-menu-item.is-active .wg-menu-icon {
  color: var(--color-primary);
}

/* ---------- 常用提示词夹的列表与页脚（外壳复用 .wg-menu 骨架） ----------
   这组类此前只有模板引用、没有样式定义，弹层里的条目一直是浏览器裸默认样式。 */

/* 条目行：与 .wg-menu-item 同一 30px 基线，hover 同底色 */
.wg-fav-item {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 30px;
  padding: 2px 4px 2px 8px;
  border-radius: 6px;
  transition: background 0.12s ease;
}

.wg-fav-item:hover {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
}

/* 正文按钮：占满一行，长提示词省略号，点按回填输入区 */
.wg-fav-text {
  flex: 1 1 auto;
  min-width: 0;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 13px;
  line-height: 18px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 行尾删除：安静的小图标钮，hover 才亮危险色 */
.wg-fav-del {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-gray);
  cursor: pointer;
  transition:
    color 0.12s ease,
    background 0.12s ease;
}

.wg-fav-del:hover {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
}

.wg-fav-del-icon {
  width: 14px;
  height: 14px;
}

/* 页脚：与列表之间分隔线，「存入当前提示词」用安静的描边小按钮 */
.wg-fav-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
  padding: 8px 8px 2px;
  border-top: 1px solid var(--color-surface-border);
}

.wg-fav-save {
  padding: 5px 12px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--color-text);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.wg-fav-save:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-50);
}

.wg-fav-save:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.wg-seg {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
}

.wg-seg-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--r-sm);
  background: var(--color-surface);
  color: var(--color-text-gray);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.wg-seg-item:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.wg-seg-item.is-active {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
  color: var(--color-primary);
}

.wg-ratio-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
}

.wg-ratio {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--r-sm);
  background: var(--color-surface);
  color: var(--color-text-gray);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.wg-ratio:hover,
.wg-ratio.is-active {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.wg-ratio.is-active {
  background: var(--color-primary-50);
}

.wg-ratio-box {
  display: block;
  border: 1.5px solid currentColor;
  /* 令牌里最小圆角是 8px，比例框只有 18px，这里从缩放令牌派生 */
  border-radius: calc(var(--r-sm) / 4);
}

/* ---------- 参数轨（模型 / 画幅 / 尺寸 / 张数） ---------- */

/* 轨上的一组：小标签 + 控件。标签 12px 灰字，控件 26px 高，比工具条的 34px 芯片轻一档，
   因为参数轨是常驻的，太重会盖过提示词本身。 */
.wg-rail-group {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.wg-rail-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 1;
}

.wg-rail-label-icon {
  width: 14px;
  height: 14px;
}

/* 组与组之间的细竖线：参数多时靠它分段，比每组都加边框安静 */
.wg-rail-sep {
  flex: 0 0 auto;
  width: 1px;
  height: 16px;
  background: var(--color-surface-border);
}

/* 画幅分段：方 / 横 / 竖 三段连成一体，选中段用主色底 */
.wg-rail-seg {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--r-pill);
  background: var(--color-secondary-surface);
}

.wg-rail-seg-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 9px;
  border: 0;
  background: transparent;
  color: var(--color-text-gray);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.wg-rail-seg-item:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.wg-rail-seg-item.is-active {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

/* 精确尺寸 / 时长：一个安静的值按钮，点开才见完整档位 */
.wg-rail-value {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  background: var(--color-secondary-surface);
  color: var(--color-text-gray);
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.wg-rail-value:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}

.wg-rail-value .wg-svg {
  width: 13px;
  height: 13px;
}

/* 张数：与「尺寸」同款的安静值按钮，点开是模型支持的全部档位（.wg-rail-value 已有样式） */

/* 工具条里的模型芯片：与相邻的 28px 图标按钮同高，一行才不参差 */
.wg-chip.is-toolbar {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
}

.wg-chip.is-toolbar .wg-svg {
  width: 13px;
  height: 13px;
}

/* 风格芯片：未选风格时是安静的值按钮；选了风格才用浅主色底 + 主色字。
   与模型芯片（常驻实心）不同，这里表达的是「已选风格」，不是「当前模型」。 */
.wg-style-chip.is-strong {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
  color: var(--color-primary);
  font-weight: 500;
}

/* ---------- 高级参数弹层（负面提示词 / 种子 / 步数） ---------- */
/* 面板：竖排字段，标签在上、控件在下，留空的参数提交时不带（按模型默认处理） */
.wg-adv-menu {
  padding: 4px 8px 8px;
}
.wg-adv-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}
.wg-adv-field:first-of-type {
  margin-top: 2px;
}
.wg-adv-label {
  font-size: 11px;
  line-height: 16px;
  color: var(--color-text-gray);
  user-select: none;
}
.wg-adv-input,
.wg-adv-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 5px 8px;
  border: 1px solid var(--color-border, var(--el-border-color-lighter));
  border-radius: 6px;
  background: var(--color-surface, var(--el-bg-color));
  color: var(--color-text);
  font-size: 12px;
  line-height: 18px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease;
}
.wg-adv-input:focus,
.wg-adv-textarea:focus {
  border-color: var(--color-primary);
}
.wg-adv-textarea {
  resize: vertical;
  min-height: 54px;
}
.wg-adv-hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 16px;
  color: var(--color-text-disabled, var(--color-text-gray));
  opacity: 0.8;
}
/* 负面提示词预设 chips：紧贴 textarea 下方，一键追加高频排除词 */
.wg-adv-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.wg-adv-preset {
  padding: 3px 9px;
  border: 1px solid var(--color-border, var(--el-border-color-lighter));
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--color-text-gray);
  font-size: 11px;
  line-height: 16px;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.wg-adv-preset:hover {
  color: var(--color-primary);
  border-color: var(--color-primary);
  background: var(--color-primary-50, transparent);
}
/* 面板底部：提示语与「清空」同一行，两端对齐 */
.wg-adv-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}
.wg-adv-foot .wg-adv-hint {
  margin: 0;
}
.wg-adv-clear {
  flex: 0 0 auto;
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.wg-adv-clear:hover:not(:disabled) {
  color: var(--color-text);
  background: var(--color-surface-hover);
}
.wg-adv-clear:disabled {
  opacity: 0.5;
  cursor: default;
}

/* ---------- 风格弹层（芯片点开的宫格） ---------- */

/* 440px 宽的面板排 5 列：每格约 80px，17 种风格 4 行放得下，
   不用滚动就能一眼扫完；风格更多时由外层 popover-shell 负责滚动。 */
.wg-style-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 6px;
  padding: 2px 0 4px;
}

/* 复用 .wg-menu-item 才能被 PickerPopover 的 ↑↓ 当作可选项，
   但排布要竖过来：图在上、名在下（.wg-menu-item 本身是横排的 30px 行）。 */
.wg-menu-item.wg-style-cell {
  flex-direction: column;
  align-items: stretch;
  gap: 5px;
  width: auto;
  min-height: 0;
  padding: 5px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  transition: border-color 0.15s, background 0.15s;
}

.wg-menu-item.wg-style-cell.is-active {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
}

.wg-style-cell-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  /* 2026-11-21：圆角放大（原 calc(--r-sm/1.5) 太锐，用户反馈「参考图圆角大一点」） */
  border-radius: var(--r);
  background: var(--color-secondary-surface);
}

.wg-style-cell-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 「无风格」：虚线空框 + 叉，一眼是「不加风格」而不是某张图 */
.wg-style-cell-thumb.is-none {
  border: 1px dashed var(--color-surface-border);
  color: var(--color-text-gray);
}

.wg-style-cell-thumb.is-none .wg-svg {
  width: 18px;
  height: 18px;
}

.wg-style-cell-name {
  overflow: hidden;
  color: var(--color-text-gray);
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wg-style-cell.is-active .wg-style-cell-name {
  color: var(--color-primary);
  font-weight: 500;
}

.wg-style-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 0 6px;
  /* 色相来自 key：同一风格稳定同色；两条叠色只是让色块有层次，不指向任何具体画面 */
  background:
    radial-gradient(circle at 28% 18%, hsl(var(--wg-style-hue, 220) 62% 68% / 0.55), transparent 62%),
    linear-gradient(140deg, hsl(var(--wg-style-hue, 220) 52% 52% / 0.22), hsl(var(--wg-style-hue, 220) 46% 38% / 0.12));
  color: var(--color-text);
  font-size: 12px;
  line-height: 1.35;
  text-align: center;
}

/* ---------- 画布与卡片 ---------- */

.wg-canvas {
  flex: 1;
  min-height: 0;
  padding: 4px 24px 20px;
  overflow-y: auto;
}

/* 键盘焦点环：画布加了 tabindex 后必须给可见反馈 */
.wg-canvas:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

/*
  键盘焦点环：所有交互控件统一给可见反馈。

  此前只有画布和「加载更多」两处有 :focus-visible，其余控件（类型切换、芯片、
  卡片动作、图标按钮、菜单项、视图/分段/比例/风格选择）在 Tab 导航下完全没有焦点指示 ——
  键盘用户看不到自己在哪。这是a11y 里最基础的一条（WCAG 2.4.7 可见焦点）。

  用 outline 而不是 box-shadow：outline 不参与布局，不会因为出现/消失把相邻元素挤动；
  outline-offset 取 2px 让环与圆角控件之间有缝，不会糊在边框上。
  这里只列显式控件，不写通配 —— Element Plus 浮层与 viewerjs 的焦点样式不能被覆盖。
*/
.wg-media-btn:focus-visible,
.wg-chip:focus-visible,
.wg-rail-value:focus-visible,
.wg-mode-btn:focus-visible,
.wg-menu-item:focus-visible,
.wg-seg-item:focus-visible,
.wg-ratio:focus-visible,
.wg-style:focus-visible,
.wg-act:focus-visible,
.wg-retry:focus-visible,
.wg-icon:focus-visible,
.wg-pick:focus-visible,
.wg-search-input:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* 图标按钮在卡片上叠着图，浅色焦点环可能被背景吃掉：再加一层深色外环保证任何底色上都可见。
   两层都是 outline，不占布局。 */
.wg-icon:focus-visible,
.wg-pick:focus-visible {
  outline: 2px solid var(--el-color-primary);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-black) 24%, transparent);
}

/* 触屏命中区的规则已移到主样式表最末（同权重下靠后生效），
   放这里会被后面 .wg-card-head-right 的基样式覆盖，实测间距退回过 12px。 */

.wg-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wg-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 var(--r-card)（=20px）→ xl 档 */
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  /* 卡片本体不加投影，去掉原 var(--shadow-xs) 常驻投影 */
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

/* 悬停轻微抬升 + 主色描边，让列表更有层次，不改变布局尺寸 */
.wg-card:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 38%, var(--el-border-color-lighter));
  /* 悬浮浮起反馈，是本段唯一保留的投影 */
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-1px);
}

/* 卡片操作按钮：默认低调，悬停卡片时提亮，避免抢视觉焦点 */
.wg-act {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 10px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--r-pill);
  background: var(--color-surface);
  color: var(--color-text-gray);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.72;
  transition: all 0.18s ease;
}

.wg-card:hover .wg-act {
  opacity: 1;
}

.wg-act:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, transparent);
}

.wg-act.is-ghost {
  padding: 0 8px;
}

.wg-act.is-primary {
  color: var(--color-text);
}

.wg-act.is-primary:hover {
  color: var(--color-primary);
}

.wg-act .wg-svg {
  width: 14px;
  height: 14px;
}

/* 触屏设备没有 hover，操作按钮需常显 */
@media (hover: none) {
  .wg-act {
    opacity: 1;
  }
}

.wg-card-head {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.wg-card-title {
  margin: 0;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
  line-height: 1.6;
  /* 右栏有宽度了，提示词给到 3 行；超出再截断，完整文本在 title 与卡片详情里 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

/* 完整提示词行：后端拼接结果（风格描述 + 用户原文），附一键复制；正文两行截断 */
.wg-card-final {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 2px 0 0;
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 1.5;
}

.wg-final-tag {
  flex: 0 0 auto;
  padding: 0 6px;
  border: 1px solid currentColor;
  border-radius: var(--r-pill, 999px);
  font-size: 10px;
  line-height: 16px;
  opacity: 0.72;
}

.wg-final-text {
  flex: 1 1 auto;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.wg-final-copy {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.18s, background 0.18s;
}

.wg-final-copy:hover {
  opacity: 1;
  background: rgba(127, 127, 127, 0.16);
}

.wg-final-copy-icon {
  width: 13px;
  height: 13px;
}

/* 右栏：提示词 + 规格，与左侧媒体同一行，填掉宽卡片原本的空白 */
.wg-card-detail {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding-top: 2px;
}

.wg-card-head-right {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  color: var(--color-text-gray);
  font-size: 13px;
}

.wg-elapsed,
.wg-strong {
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.wg-strong {
  font-weight: 600;
}

.wg-time {
  color: var(--color-text-gray);
  font-variant-numeric: tabular-nums;
}

.wg-retry {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 12px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--r-pill);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.18s;
}

.wg-retry:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.wg-retry .wg-svg {
  width: 14px;
  height: 14px;
}

/* 状态徽标 */
.wg-badge {
  flex: 0 0 auto;
  padding: 3px 10px;
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
}

.wg-badge.is-success {
  background: color-mix(in srgb, var(--el-color-success) 14%, transparent);
  color: var(--el-color-success);
}

.wg-badge.is-danger {
  background: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
  color: var(--el-color-danger);
}

.wg-badge.is-info {
  background: var(--color-secondary-surface);
  color: var(--color-text-gray);
}

.wg-badge.is-primary {
  background: var(--color-primary-50);
  color: var(--color-primary);
}

/* 参数 chips 行 */
.wg-card-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
}

/*
 * 日期分隔：历史是时间流，翻到中间读不出「这屏是哪天」。
 * 只在换天时出现一次；网格视图里横跨整行，不当成一张卡。
 */
.wg-day-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 0 0;
  padding: 0 2px;
  color: var(--color-text-gray);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  user-select: none;
}

.wg-day-label:first-child {
  margin-top: 0;
}

.wg-day-count {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  opacity: 0.8;
}

.wg-list.is-gallery .wg-day-label {
  column-span: all;
  margin: 2px 0 10px;
}

/*
 * 主体左右分栏：媒体在左、参数在右。
 * 单图卡片（1 张 190px）在 1200px 宽的卡片里右侧会空出 700px+，
 * 参数挪到右栏后正好填掉这块空白，卡片不再「内容挤在左上角」。
 * 窄屏（网格视图每列只有 320px 左右）放不下右栏，改回上下堆叠。
 */
.wg-card-body {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.wg-card-detail > .wg-card-chips {
  /* 竖排成参数表：右栏是「提示词 + 规格表」一块文字，不再是一行胶囊 + 大片空白 */
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  max-width: 340px;
  /* 与媒体顶对齐；媒体比参数高时参数不居中，避免和图片抢视觉 */
  align-content: flex-start;
}

/* 参数名：小号灰字，统一宽度让右侧值左缘对齐 */
.wg-pill-label {
  flex: 0 0 auto;
  min-width: 2.4em;
  color: var(--color-text-gray);
  font-size: 11px;
  font-style: normal;
  line-height: 1;
  letter-spacing: 0.02em;
}

/*
 * 列表视图里参数是「规格表」不是胶囊：去掉实底与大圆角，
 * 行间用发丝线分隔，读起来是「模型 / 尺寸 / …」一列标签值，
 * 而不是几颗像按钮一样散在角落的灰底块。网格视图仍保持胶囊（下方一行）。
 */
.wg-list:not(.is-gallery) .wg-card-detail > .wg-card-chips .wg-pill {
  gap: 4px;
  height: 20px;
  padding: 0;
  border-radius: 0;
  background: transparent;
}

.wg-list:not(.is-gallery) .wg-card-detail > .wg-card-chips .wg-pill + .wg-pill {
  padding-top: 6px;
  border-top: 1px solid var(--color-surface-border);
}

.wg-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: var(--r-pill);
  background: var(--color-secondary-surface);
  color: var(--color-text);
  font-size: 13px;
  white-space: nowrap;
}

.wg-pill-model {
  font-weight: 500;
}

.wg-logo {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  /* 从缩放令牌派生（令牌最小值 8px，对 16px logo 偏圆） */
  border-radius: calc(var(--r-sm) / 2);
  object-fit: contain;
}

/* 模型无品牌图可用时（免登录渠道的 flux / turbo 等不映射供应商图标）：首字母占位，左侧不空一块 */
.wg-logo-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-secondary-surface);
  color: var(--color-text);
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  text-transform: uppercase;
  user-select: none;
}

/* 媒体区 */
.wg-card-media {
  display: flex;
  align-items: center;
  gap: 16px;
  /* 与右栏参数竞争宽度时优先保住图片 */
  flex: 0 1 auto;
  min-width: 0;
}

/*
 * 参考图（源）：固定窄档，只有结果图的一半宽。
 *
 * 图生图的记录读法是「这张成片改自哪张图」，源图是上下文不是作品：
 * 与结果等大时两张图互相抢视觉，卡片看起来像一次生成了两张。
 * 缩到 120px 并把说明文字放到图外，图片本身不再压标签。
 */
.wg-ref-src {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 6px;
  width: 120px;
  margin: 0;
}

.wg-ref-frame {
  display: block;
  overflow: hidden;
  border: 1px solid var(--color-surface-border);
  border-radius: calc(var(--size-dialog-rounded-radius) - 4px);
  background: var(--color-secondary-surface);
}

/* 高度由内联 aspect-ratio（refRatioOf）决定，竖构图不会被压成方块 */
.wg-ref-frame img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.wg-ref-caption {
  color: var(--color-text-gray);
  font-size: 11px;
  line-height: 16px;
  text-align: center;
  letter-spacing: 0.02em;
}

/*
 * 02 First Cell：结果只有 1 张时源图不缩成窄轨，
 * 与结果同尺度并排 —— 只有一张成片时，「改自哪张」值得和成品一样大。
 *
 * 两侧都按 1:1:0 参与伸缩、共享同一个 max-width：
 * 卡片够宽时各占 --wg-thumb（源图 = 成片），窄档（网格视图）里等比一起缩，
 * 不会出现「源图被 flex 撑住、成片被压小」导致一对比就不成对的情况。
 */
.wg-card-media.is-ref-peer .wg-ref-src {
  flex: 1 1 0;
  width: auto;
  min-width: 0;
  max-width: var(--wg-thumb);
}

/* 「源 → 成片」的连接：图标与模式名上下排，说明这一对是生成关系而不是并列的图 */
.wg-flow {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-primary);
}

.wg-flow .wg-svg {
  width: 18px;
  height: 18px;
}

.wg-flow-label {
  color: var(--color-text-gray);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
}

/*
 * 结果网格：按张数自适应拼图（列数由 JS 写进 --wg-cols）。
 * 列数写死会让缩略图随宽度忽大忽小，所以同时用 max-width 把轨道钉在 --wg-thumb。
 */
.wg-grid {
  display: grid;
  flex: 1;
  gap: 10px;
  min-width: 0;
  grid-template-columns: repeat(var(--wg-cols, 4), minmax(0, 1fr));
  max-width: calc(var(--wg-cols, 4) * var(--wg-thumb) + (var(--wg-cols, 4) - 1) * 10px);
}

/*
 * 单张：按真实比例展示（比例由 thumbStyle 写进 .wg-thumb 的内联 aspect-ratio），
 * 不套方框 —— 16:9 的成片裁成正方形等于丢掉画面两端。
 */
/*
 * 单张要给一个确定的宽度基准。
 * 这一档的 <img> 是绝对定位（见下方 is-single .wg-media），网格里没有任何内容撑宽，
 * 只写 max-width 时实测宽度塌成 0（图片整块不显示）；带参考图时也只分到一半（150px）。
 * 定宽后列表 300px、网格视图 150px；列窄时仍由 .wg-grid 的 flex-shrink 等比缩。
 */
.wg-grid.is-single {
  grid-template-columns: minmax(0, 1fr);
  width: var(--wg-thumb);
  max-width: var(--wg-thumb);
}

/*
 * 单张不裁剪：.wg-thumb 用内联 aspect-ratio 定高，媒体绝对铺满这一块。
 * 不给媒体设 aspect-ratio/height，是为了不让图片的固有尺寸反过来撑高卡片（真实比例由 .wg-thumb 说了算）。
 */
.wg-grid.is-single .wg-media,
.wg-grid.is-single .wg-media-lost {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
}

.wg-grid.is-single .wg-media {
  object-fit: contain;
}

/*
 * 主图 + 扇开（张数 > 4）。
 * 第一张按标准尺寸完整展示，后面三张错位叠在右侧，露出窄边示意「还有更多」；
 * 悬停整块由 el-popover 展开全部结果（.wg-fan-all）。
 */
.wg-grid.is-fan {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0;
  /* 与进行中 / 失败占位块同一宽度：主图 + 三张露头 */
  max-width: calc(var(--wg-thumb) + var(--wg-fan-peek));
}

.wg-grid.is-fan .wg-thumb.is-lead {
  flex: 0 0 var(--wg-thumb);
  /* 主图在最前：后面三张压边 46px 藏在它下面，只露出各自右侧的一窄条，
     主图本身不被遮住（漏出的部分比主图更「薄」，读法仍是「一张成片 + 还有几张」）。 */
  z-index: 30;
}

.wg-grid.is-fan .wg-thumb.is-fan-card {
  flex: 0 0 110px;
  margin-left: -46px;
  border: 2px solid var(--el-bg-color);
  background: var(--el-bg-color);
  /* 阴影落在右侧以外，避免在主图下面糊出一圈黑边 */
  box-shadow: 4px 3px 14px color-mix(in srgb, var(--el-color-black) 14%, transparent);
}

/* 露头的那几张只负责示意：窄条里点不准，操作收进浮层 */
.wg-grid.is-fan .wg-thumb.is-fan-card .wg-thumb-actions {
  display: none;
}

.wg-grid.is-fan .wg-thumb.is-fan-hidden {
  display: none;
}

/* 收起来的张数：压在最后一张露头卡片上，纯展示不参与点击 */
.wg-fan-count {
  position: absolute;
  right: 8px;
  bottom: 10px;
  z-index: 40;
  padding: 2px 8px;
  border-radius: var(--el-border-radius-round, 999px);
  background: color-mix(in srgb, var(--el-color-black) 62%, transparent);
  color: var(--el-color-white);
  font-size: 12px;
  line-height: 18px;
  font-variant-numeric: tabular-nums;
  pointer-events: none;
}

/* 浮层里的全部结果：等格小图铺开，一次生成 6–10 张时逐张看这里 */
.wg-fan-all {
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.wg-fan-cell {
  position: relative;
  margin: 0;
  overflow: hidden;
  border-radius: calc(var(--size-dialog-rounded-radius) - 6px);
  background: var(--color-secondary-surface);
}

.wg-fan-media {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.wg-fan-lost {
  display: flex;
  width: 100%;
  aspect-ratio: 1 / 1;
  align-items: center;
  justify-content: center;
  color: var(--color-text-gray);
  font-size: 11px;
}

.wg-fan-cell-actions {
  position: absolute;
  right: 4px;
  bottom: 4px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.18s;
}

.wg-fan-cell:hover .wg-fan-cell-actions {
  opacity: 1;
}

.wg-fan-cell-actions .wg-icon {
  width: 24px;
  height: 24px;
}

.wg-fan-cell-actions .wg-icon .wg-svg {
  width: 13px;
  height: 13px;
}

/*
 * 01 画廊：多列作品墙。
 *
 * 用 CSS 多栏（column-width 300px）而不是等宽 grid —— 作品高度随画幅变化，
 * 等宽 grid 会把同一行拉平、行尾留下空洞；瀑布流是「每一列各自往下长」，
 * 竖图、横图、方图混在一起也不浪费空间。日期分隔横跨所有栏（column-span: all），
 * 分组标题仍落在时间流上。
 */
.wg-list.is-gallery {
  --wg-thumb: 100%;
  /* 紧凑档不扇开：一列只有 300px，主图 + 三张露头放不下，
     露头会挤出卡片右边界，所以这里只留主图 + 「+N」角标（见 fanPeek）。 */
  --wg-fan-peek: 0px;
  display: block;
  columns: 300px;
  column-gap: 16px;
}

/*
 * 一张卡不被拆到两栏里。
 *
 * 画廊里的读法是「先看画、再看说明、最后一行状态与操作」：
 * 卡片整体 column-reverse，把 .wg-card-head（状态 / 操作）挪到最下方，
 * 图片顶到卡面最上沿 —— 01 的信息架构就是作品墙，不是一条条记录。
 */
.wg-list.is-gallery .wg-card {
  break-inside: avoid;
  flex-direction: column-reverse;
  margin: 0 0 16px;
  padding: 10px 10px 12px;
  gap: 10px;
  border-radius: var(--el-radius-lg, 12px);
}

/*
 * 长列表渲染减压：视口外的卡片跳过渲染与布局，滚近了再按估算高度展开。
 * 历史多了以后（几百条）首屏渲染与滚动都明显变重；contain-intrinsic-size
 * 给一个接近真实卡高的占位值，滚动条不至于大幅跳动。
 */
.wg-list.is-gallery .wg-card {
  content-visibility: auto;
  contain-intrinsic-size: auto 340px;
}

.wg-list.is-gallery .wg-card-head-right {
  gap: 6px;
  font-size: 12px;
}

/* 一列 300px 里媒体占满整宽 */
.wg-list.is-gallery .wg-card-media {
  width: 100%;
}

.wg-list.is-gallery .wg-grid.is-single,
.wg-list.is-gallery .wg-grid.is-pair,
.wg-list.is-gallery .wg-grid.is-quad,
.wg-list.is-gallery .wg-grid.is-fan {
  width: 100%;
  max-width: 100%;
}

/* 扇开在窄栏里不叠：主图吃掉整宽，其余张数收进 +N 角标 */
.wg-list.is-gallery .wg-grid.is-fan .wg-thumb.is-lead {
  flex: 1 1 auto;
  min-width: 0;
}

/* 一栏只有 300px 左右，左右分栏放不下，参数回到媒体下方 */
.wg-list.is-gallery .wg-card-body {
  flex-direction: column;
  gap: 12px;
}

.wg-list.is-gallery .wg-card-detail > .wg-card-chips {
  flex-direction: row;
  flex-wrap: wrap;
  max-width: none;
  margin-left: 0;
}

/* 画廊一栏 300px，提示词会挤成好几行，钳到 2 行；完整文本在 title 属性里 */
.wg-list.is-gallery .wg-card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/*
 * 画廊一栏约 300px，一行塞不下
 * 「状态 + 耗时 + 时间 + 再次生成 + 删除」：
 * 让操作行允许换行，窄栏里也不会把删除按钮挤出卡片右边界。
 */
.wg-list.is-gallery .wg-card-head {
  flex-wrap: wrap;
  row-gap: 6px;
}

/* 窄卡片里「再次生成」只留图标，四个字要 90px */
.wg-list.is-gallery .wg-act.is-primary {
  padding: 0 8px;
}

/* 画廊瀑布流：单张结果用任务尺寸比例（已知），不再强制 1:1 方图。
   不同画幅的卡片（横图 4:3 / 方图 1:1 / 竖图 3:4）自然产生不同高度，
   在 CSS 多列布局里形成瀑布错落。加载前比例已知 → 无布局抖动。 */
.wg-list.is-gallery .wg-grid.is-single .wg-media {
  aspect-ratio: unset;
  height: 100%;
  object-fit: contain;
  background: var(--color-secondary-surface);
}

/* 画廊 2–4 张任务：内图与单张同口径，按任务画幅出比例（比例由 thumbStyle
   写进 .wg-thumb 的内联 aspect-ratio），媒体绝对铺满，不再一律裁成方图。
   尺寸未知时 aspectOf 回落 1:1，与旧行为一致。 */
.wg-list.is-gallery .wg-grid.is-pair .wg-media,
.wg-list.is-gallery .wg-grid.is-quad .wg-media,
.wg-list.is-gallery .wg-grid.is-pair .wg-media-lost,
.wg-list.is-gallery .wg-grid.is-quad .wg-media-lost {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  aspect-ratio: auto;
}

.wg-list.is-gallery .wg-grid.is-pair .wg-media,
.wg-list.is-gallery .wg-grid.is-quad .wg-media {
  object-fit: contain;
  background: var(--color-secondary-surface);
}

/* 有参考图且只有 1 张结果时，参考图不再与结果同尺度并排，
   缩回窄档（120px），让成片视觉上占主导。 */
.wg-list.is-gallery .wg-card-media.is-ref-peer .wg-ref-src {
  flex: 0 0 auto;
  width: 120px;
}

.wg-list.is-gallery .wg-act.is-primary span {
  display: none;
}

/* 画廊里源图进一步收窄：一栏只有 300px 左右，120px 会挤到结果 */
.wg-list.is-gallery .wg-ref-src {
  width: 84px;
}

/* 只有一张结果时源图与结果同尺度（02 First Cell），不跟着收窄。
   这里不再单独指定宽度：上面 is-ref-peer 用 1:1:0 共享伸缩，
   窄栏里两张图一起等比缩小，硬写 --wg-thumb 反而会撑破 300px 的栏。 */

/* 画廊里扇开整组收起（fanPeek() = 0）：主图 + 角标，全部结果走悬停浮层。
   宽度不用另写规则：--wg-fan-peek 归零后 .wg-grid.is-fan 的 max-width 就是主图宽。 */

.wg-list.is-gallery .wg-ref-caption,
.wg-list.is-gallery .wg-flow-label {
  display: none;
}

.wg-thumb {
  position: relative;
  margin: 0;
  overflow: hidden;
  border-radius: var(--size-dialog-rounded-radius);
  background: var(--color-secondary-surface);
}

.wg-media {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
  cursor: zoom-in;
  /* 结果图改走字节流地址后才有意义：<img> 自身带占位（.wg-thumb 底色），
     解码完成前保持半透明，避免先弹一张灰块再被图盖住的二次闪烁。 */
  opacity: 0;
  transition: opacity 0.22s ease-out;
}

.wg-thumb.is-loaded .wg-media {
  opacity: 1;
}

/* 视频按 16:9 展示，压成方框会留大片黑边 */
.wg-thumb video.wg-media {
  aspect-ratio: 16 / 9;
  background: var(--color-secondary-surface);
  object-fit: contain;
  cursor: default;
}

/*
 * 媒体字节已丢失时的占位。
 *
 * 之前这种情况只剩加载器的 1×1 透明占位图，卡片是一片空白 ——
 * 用户分不清「还没出图」和「图没了」。这里给同尺寸的浅底 + 一行说明，
 * 保证网格不塌、记录仍可点删除或重新生成。
 */
.wg-media-lost {
  display: flex;
  width: 100%;
  aspect-ratio: 1 / 1;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  box-sizing: border-box;
  background: var(--color-secondary-surface);
  color: var(--color-text-gray);
  font-size: 12px;
  line-height: 1.4;
  text-align: center;
}

.wg-media-lost.is-video {
  aspect-ratio: 16 / 9;
}

.wg-thumb-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.18s;
}

.wg-thumb:hover .wg-thumb-actions,
.wg-thumb:focus-within .wg-thumb-actions {
  opacity: 1;
}

.wg-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: var(--el-border-radius-circle);
  background: color-mix(in srgb, var(--el-color-white) 88%, transparent);
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.18s;
}

.wg-icon:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.wg-icon.is-on {
  background: var(--el-color-danger);
  color: var(--color-primary-text);
}

.wg-icon.is-on .wg-svg {
  fill: currentColor;
}

.wg-icon .wg-svg {
  width: 16px;
  height: 16px;
}

/* 进行中占位块。
   宽度由模板内联 width 给（placeholderWidth，与 .wg-grid 同一套公式），
   这里只管形状与配色。max-width:100% 是窄卡片里的兜底：
   两列宽度（610px）在网格视图的 320px 列里放不下，夹到卡片宽为止。 */
.wg-generating {
  display: flex;
  flex: 0 0 auto;
  max-width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 150px;
  overflow: hidden;
  border-radius: var(--size-dialog-rounded-radius);
  color: var(--color-primary-text);
  background:
    linear-gradient(
      115deg,
      color-mix(in srgb, var(--el-color-white) 16%, transparent) 0%,
      transparent 40%
    ),
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--color-primary) 88%, var(--el-color-white) 12%) 0%,
      color-mix(in srgb, var(--color-primary) 42%, var(--el-color-black) 58%) 45%,
      color-mix(in srgb, var(--color-primary) 10%, var(--el-color-black) 90%) 100%
    );
  background-size: 220% 100%, 100% 100%;
  animation: wg-shimmer 3.2s linear infinite;
}

.wg-spark {
  display: flex;
  animation: wg-breathe 2.4s ease-in-out infinite;
}

.wg-spark .wg-svg {
  width: 26px;
  height: 26px;
}

.wg-gen-stage {
  font-size: 12px;
}

.wg-gen-stage-num {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

/* 已用时：进度长时间停在同一档时，这个每秒递增的秒数是「还活着」的唯一信号 */
.wg-gen-stage-elapsed {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
}

/* 停止生成：占位块是主色渐变底，按钮用白色幽灵样式，别抢进度数字的视觉焦点 */
.wg-gen-stop {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 8px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid rgb(255 255 255 / 45%);
  background: rgb(255 255 255 / 12%);
  color: rgb(255 255 255 / 92%);
  font-size: 12px;
  line-height: 1.2;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.wg-gen-stop:hover:not(:disabled) {
  border-color: rgb(255 255 255 / 85%);
  background: rgb(255 255 255 / 22%);
}
.wg-gen-stop:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.wg-gen-stop .wg-svg {
  width: 13px;
  height: 13px;
}

/* 选择模式：勾选框 + 选中的卡面反馈。
   整块可点（不是只有那个小方框），选择模式下面片不再触发删除/重试等操作。 */
.wg-card.is-selecting {
  cursor: pointer;
}

.wg-pick {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-circle);
  background: var(--color-surface);
  color: var(--color-text-gray);
}

.wg-pick .wg-svg {
  width: 12px;
  height: 12px;
}

.wg-card.is-selected .wg-pick {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.wg-card.is-selected {
  border-color: var(--color-primary);
}

/* 选择模式下屏蔽卡片内的交互操作，避免点选时误触删除/重试/下载 */
.wg-card.is-selecting .wg-card-head-right,
.wg-card.is-selecting .wg-thumb-actions {
  pointer-events: none;
  opacity: 0.45;
}

/* 破坏性菜单项：只在文案上标危险色，不加实心底，避免整块弹层过度抢眼 */
.wg-menu-item.is-danger .wg-menu-name {
  color: var(--el-color-danger);
}

.wg-menu-item:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.wg-menu-item:disabled:hover {
  background: transparent;
}

@keyframes wg-shimmer {
  from {
    background-position: 220% 0, 0 0;
  }
  to {
    background-position: -120% 0, 0 0;
  }
}

@keyframes wg-breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.12);
    opacity: 1;
  }
}

/* 无产物占位块。
   几何（宽度）由模板内联 width 给，与 .wg-grid / .wg-generating 同一套公式——
   2 张失败就是两列宽、5 张起就是主图 + 露头宽，和出图后的那一块同尺寸；
   这里只管形状与配色。用边框而不是投影承载边界，卡片基线不加装饰投影。
   底纹是极淡的斜向条纹，与参考图区的斜线朝向一致，视觉上属于同一族。 */
.wg-void {
  display: flex;
  flex: 0 0 auto;
  max-width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 150px;
  padding: 12px 16px;
  overflow: hidden;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--size-dialog-rounded-radius);
  text-align: center;
  background:
    repeating-linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-text-color-primary) 5%, transparent) 0 1px,
      transparent 1px 9px
    ),
    var(--color-secondary-surface);
  color: var(--color-text-gray);
}

.wg-void.is-failed {
  border-color: color-mix(in srgb, var(--el-color-danger) 34%, var(--el-border-color));
}

.wg-void.is-canceled {
  opacity: 0.72;
}

.wg-void-icon .wg-svg {
  width: 30px;
  height: 30px;
  stroke-width: 1.1;
}

.wg-void.is-failed .wg-void-icon {
  color: color-mix(in srgb, var(--el-color-danger) 76%, var(--el-text-color-secondary));
}

.wg-void-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.wg-void-err {
  max-width: 100%;
  font-size: 12px;
  line-height: 1.45;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.wg-void.is-failed .wg-void-err {
  color: color-mix(in srgb, var(--el-color-danger) 88%, var(--el-text-color-regular));
}

/* 骨架屏 */
.wg-sk {
  display: block;
  border-radius: var(--r-sm);
  background: linear-gradient(
    90deg,
    var(--shimmer-base) 25%,
    var(--shimmer-highlight) 37%,
    var(--shimmer-base) 63%
  );
  background-size: 400% 100%;
  opacity: 0.35;
  animation: wg-sk 1.4s ease infinite;
}

.wg-sk-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wg-sk-badge {
  width: 64px;
  height: 22px;
  border-radius: var(--r-pill);
}

.wg-sk-title {
  flex: 1;
  height: 18px;
}

.wg-sk-time {
  width: 120px;
  height: 14px;
}

.wg-sk-pill {
  width: 110px;
  height: 28px;
  border-radius: var(--r-pill);
}

.wg-sk-media {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.wg-sk-thumb {
  aspect-ratio: 1 / 1;
  border-radius: var(--size-dialog-rounded-radius);
}

@keyframes wg-sk {
  from {
    background-position: 100% 50%;
  }
  to {
    background-position: 0 50%;
  }
}

.wg-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 72px 0 0;
  color: var(--color-text-gray);
  font-size: 14px;
  text-align: center;
}

.wg-empty-title {
  margin: 0;
  color: var(--color-text);
  font-size: 15px;
  font-weight: 600;
}

.wg-empty-hint {
  margin: 0;
  font-size: 13px;
}

/* 示例提示词：点了只填进输入条，不自动提交 */
.wg-empty-samples {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  max-width: 560px;
  margin-top: 8px;
}

.wg-empty-sample {
  max-width: 100%;
  padding: 8px 14px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--r-pill);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  line-height: 20px;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
}

.wg-empty-sample:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-50);
  color: var(--color-primary);
}

/* 「换一批」：与示例同款外观，内联一个刷新图标 */
.wg-empty-sample.is-shuffle {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.wg-empty-sample.is-shuffle .wg-svg {
  width: 12px;
  height: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .wg-empty-sample {
    transition: none;
  }
}

/* 滚动分页尾部提示 */
.wg-more {
  margin: 16px 0 4px;
  color: var(--color-text-gray);
  font-size: 13px;
  text-align: center;
}

/* 回到顶部：粘在画布滚动区右下角；负下边距抵消自身占位，不额外增加可滚动高度 */
.wg-back-top {
  position: sticky;
  bottom: 20px;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin: 12px 24px -52px auto;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
  cursor: pointer;
  animation: wg-back-top-in 0.22s ease-out;
}

.wg-back-top:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.wg-back-top:focus-visible {
  outline: 2px solid var(--el-color-primary);
}

.wg-back-top .wg-svg {
  width: 18px;
  height: 18px;
  transform: rotate(180deg);
}

@keyframes wg-back-top-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

/* 「加载更早的记录」：键盘/内容不足一屏时的兜底入口，样式贴近系统次级按钮 */
.wg-more-btn {
  padding: 6px 16px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-base, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 13px;
  cursor: pointer;
  transition:
    border-color var(--el-transition-duration, 0.2s) ease,
    color var(--el-transition-duration, 0.2s) ease,
    background-color var(--el-transition-duration, 0.2s) ease;
}

.wg-more-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.wg-more-btn:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

/* ---------- 输入区 ---------- */

.wg-composer {
  position: relative;
  flex: 0 0 auto;
  /* 右侧避让站内消息浮球（fixed right:24px + 36px 球体）。否则发送按钮正好落在浮球
     正下方，真实点击被浮球图标 SVG 拦截（验收实测：send-btn 点击超时，
     elementFromPoint 命中 re-station-message-trigger 的铃铛 SVG）。 */
  padding: 12px 76px 20px 24px;
}

/* 快捷键提示：贴在输入条右下（落在底部 padding 区），安静但找得到；不参与交互 */
.wg-kbd-hint {
  position: absolute;
  right: 28px;
  bottom: 5px;
  margin: 0;
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-secondary, #909399);
  opacity: 0.72;
  pointer-events: none;
  user-select: none;
}

/* 参考图缩略图：挂在输入框内顶部（GenerateComposer 的 reference 插槽）。
   宽度固定 64px，高度由内联的 aspect-ratio（原始尺寸比例）决定，
   所以竖构图会显示成窄高条、横构图是宽扁条 —— 与用户原图一致，不会被压成方块。 */
.wg-ref-picked {
  position: relative;
  width: 64px;
  margin: 0 0 12px;
}

.wg-ref-picked img {
  display: block;
  width: 64px;
  height: auto;
  max-height: 96px;
  border-radius: var(--el-border-radius-base);
  object-fit: cover;
}

/* 「再次生成」取回参考图期间的占位：与参考图同宽同高，
   否则参数栏会先塌一下再撑开，比直接等更让人以为出错了。 */
.wg-ref-picked.is-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background: var(--color-secondary-surface);
}

.wg-ref-spin {
  font-size: 11px;
  line-height: 1.2;
  text-align: center;
  color: var(--color-text-gray);
}

/* 删除按钮压在图上：深色实心圆在深色照片上看不清，改成表面色 + 细边 + 轻投影 */
.wg-ref-del {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--el-border-radius-circle);
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--el-box-shadow-light);
  cursor: pointer;
}

.wg-ref-del .wg-svg {
  width: 12px;
  height: 12px;
}

.wg-file {
  display: none;
}

/* ---------- 自适应 ---------- */

@media (max-width: 900px) {
  .wg-canvas {
    padding: 4px 14px 16px;
  }

  .wg-composer {
    padding: 10px 76px 16px 14px;
  }

  .wg-grid,
  .wg-sk-media {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wg-card-media {
    flex-wrap: wrap;
  }

  /* 窄屏放不下左右分栏，参数回落到媒体下方 */
  .wg-card-body {
    flex-direction: column;
    gap: 12px;
  }

  .wg-card-detail > .wg-card-chips {
    max-width: none;
    margin-left: 0;
  }
}

/* viewerjs 皮肤跟随 koi 变量 */
:deep(.viewer-container) {
  background: color-mix(in srgb, var(--el-color-black) 88%, transparent) !important;
}

:deep(.viewer-toolbar > ul > li) {
  background-color: color-mix(in srgb, var(--color-surface) 82%, transparent);
}

:deep(.viewer-toolbar > ul > li:hover) {
  background-color: var(--color-primary);
}

/* 动效降级：系统开启「减少动态效果」时，类型切换/搜索框/筛选芯片/视图切换/菜单项/
   分段项/比例/风格/卡片/操作层/重试/缩略图操作条 的悬停与选中反馈全部改为瞬间切换。
   逐个列出，不写 `*` / .wg-main * 通配 —— viewerjs 的图片查看器与内部
   Element Plus 浮层的合法过渡不能被一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .wg-media-btn,
  .wg-menu-icon,
  .wg-search,
  .wg-chip,
  .wg-mode-btn,
  .wg-menu-item,
  .wg-seg-item,
  .wg-ratio,
  .wg-style,
  .wg-card,
  .wg-act,
  .wg-retry,
  .wg-thumb-actions,
  .wg-stage-back,
  .wg-stage-navbtn,
  .wg-stage-act,
  .wg-stage-media,
  .wg-stage-film-item,
  .wg-stage-rail-item,
  .wg-icon {
    transition: none;
  }

  /* 「正在生成」占位块：微光扫过是它唯一的动态线索，但它的底色本身就是一块
     静态主色渐变 + 火花图标 + 阶段文案，所以停掉动画不会让用户失去信息。
     这里把 background-position 显式复位到 0（微光完全退出可视区），
     而不是留着 220% 那条声明 —— 后者依赖 background-size 的换算结果，
     属于隐式行为，写死更稳。 */
  .wg-generating {
    background-position: 0% 0, 0 0;
    animation: none;
  }

  /* 火花图标的呼吸缩放挂在 .wg-generating 内部的 .wg-spark 上，
     只关父级关不到它，所以按同一个视觉单元一起降级；
     终态 scale(1) / opacity 0.9 是静态样式，图标仍然清晰可见。 */
  .wg-generating .wg-spark {
    transform: scale(1);
    opacity: 0.9;
    animation: none;
  }

  /* 列表骨架屏微光：同样把 background-position 复位到中间偏右，
     让 400% 宽的渐变里那段高光正好落在可视区中央 ——
     停掉动画后仍是一根有明暗层次的占位条，而不是一片纯色。 */
  .wg-sk {
    background-position: 50% 50%;
    animation: none;
  }
}

/* ---------- 多图对比：同任务多张结果并排同屏 ---------- */

.wg-compare {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  background: rgba(10, 12, 18, 0.92);
  color: #eef1f8;
  outline: none;
}

.wg-compare-head {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wg-compare-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.wg-compare-count {
  margin-left: 10px;
  font-size: 12px;
  font-weight: 400;
  color: rgba(238, 241, 248, 0.62);
}

.wg-compare-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}

.wg-compare-toggle {
  height: 26px;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(238, 241, 248, 0.62);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s, border-color 0.18s;
}

.wg-compare-toggle.is-on {
  border-color: rgba(255, 255, 255, 0.32);
  background: rgba(255, 255, 255, 0.12);
  color: #eef1f8;
}

.wg-compare-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-left: 6px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(238, 241, 248, 0.72);
  cursor: pointer;
}

.wg-compare-close:hover {
  color: #eef1f8;
  border-color: rgba(255, 255, 255, 0.32);
}

.wg-compare-row {
  display: flex;
  flex: 1;
  align-items: stretch;
  gap: 14px;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
}

.wg-compare-col {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  min-width: 200px;
  max-width: 46vw;
}

.wg-compare-col img {
  display: block;
  flex: 1;
  width: auto;
  max-width: 100%;
  min-height: 0;
  object-fit: contain;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #171b26;
}

.wg-compare-lost {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  color: rgba(238, 241, 248, 0.5);
  font-size: 12px;
}

.wg-compare-cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: rgba(238, 241, 248, 0.62);
  font-size: 12px;
}

/* ---------- 对比方式切换：并排 / 滑动 ---------- */

.wg-compare-modes {
  display: inline-flex;
  margin-right: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
}

.wg-compare-mode {
  height: 26px;
  padding: 0 12px;
  border: 0;
  background: transparent;
  color: rgba(238, 241, 248, 0.62);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s;
}

.wg-compare-mode.is-on {
  background: rgba(255, 255, 255, 0.14);
  color: #eef1f8;
}

/* 滑动对照：两张图叠满同一容器，上层用 clip-path 露出右侧部分 */
.wg-compare-slide {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: #171b26;
  touch-action: none;
  cursor: ew-resize;
  user-select: none;
}

.wg-compare-slide-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.wg-compare-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(255, 255, 255, 0.9);
  transform: translateX(-1px);
  pointer-events: none;
}

.wg-compare-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #171b26;
  font-size: 14px;
  line-height: 1;
  transform: translate(-50%, -50%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}

.wg-compare-slide-tag {
  position: absolute;
  bottom: 10px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(10, 12, 18, 0.72);
  color: rgba(238, 241, 248, 0.85);
  font-size: 12px;
  pointer-events: none;
}

.wg-compare-slide-tag.is-left {
  left: 10px;
}

.wg-compare-slide-tag.is-right {
  right: 10px;
}

/* 叠加淡入：两张图叠满同一容器，上层图整体调透明度，比构图/色调用 */
.wg-compare-fade {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  background: #171b26;
  user-select: none;
}

.wg-compare-fade-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}

.wg-compare-fade-ctl {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 12px 10px;
  background: linear-gradient(rgba(10, 12, 18, 0), rgba(10, 12, 18, 0.72));
}

.wg-compare-fade-tag {
  flex: none;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(10, 12, 18, 0.72);
  color: rgba(238, 241, 248, 0.85);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  pointer-events: none;
}

.wg-compare-fade-range {
  flex: 1;
  height: 4px;
  margin: 0;
  cursor: pointer;
  accent-color: #eef1f8;
}

/* ---------- 05 沉浸舞台 ---------- */

/*
 * 舞台与画廊是同一页的两种形态：
 * 画廊是亮色作品墙（看一批），舞台是暗色场馆（看一张）。
 * 只把舞台这一块压暗，页面头与输入条保持 koi 亮色 ——
 * 整页换肤会让「切形态」变成「换网站」，反而认不出是同一个页面。
 */
.wg-stage {
  --stg-bg: #0e1017;
  --stg-panel: #171b26;
  --stg-line: rgba(255, 255, 255, 0.08);
  --stg-text: #eef1f8;
  --stg-dim: rgba(238, 241, 248, 0.62);
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 12px 16px 16px;
  border-radius: var(--el-radius-lg, 12px);
  background: radial-gradient(120% 96% at 50% 0%, #1c2233 0%, var(--stg-bg) 64%);
  color: var(--stg-text);
}

/* 舞台占满画布高度：大图在其中按可用高度缩放，不把页面撑出滚动条 */
.wg-canvas.is-stage {
  display: flex;
  flex-direction: column;
  padding: 4px 16px 16px;
  overflow: hidden;
}

.wg-stage-head {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 14px;
  padding-bottom: 10px;
}

.wg-stage-back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px 0 8px;
  border: 1px solid var(--stg-line);
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.04);
  color: var(--stg-dim);
  font-size: 12px;
  cursor: pointer;
  transition: color 0.18s, background 0.18s, border-color 0.18s;
}

.wg-stage-back:hover {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: var(--stg-text);
}

.wg-stage-back .wg-svg {
  width: 15px;
  height: 15px;
  transform: rotate(180deg);
}

.wg-stage-pos {
  color: var(--stg-dim);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

/* 上一张 / 下一张推到右侧，与右上角形态开关同一侧，视线不用来回找 */
.wg-stage-nav {
  display: flex;
  gap: 6px;
  margin-left: auto;
}

.wg-stage-navbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--stg-line);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  color: var(--stg-text);
  cursor: pointer;
  transition: background 0.18s, border-color 0.18s, opacity 0.18s;
}

.wg-stage-navbtn:hover:not(:disabled) {
  border-color: rgba(255, 255, 255, 0.24);
  background: rgba(255, 255, 255, 0.1);
}

.wg-stage-navbtn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.wg-stage-navbtn .wg-svg {
  width: 16px;
  height: 16px;
}

.wg-stage-navbtn .wg-svg.is-left {
  transform: rotate(90deg);
}

.wg-stage-navbtn .wg-svg.is-right {
  transform: rotate(-90deg);
}

/*
 * 主体：左边是画，右边是同一批作品的竖排记录条。
 * 用 1fr + 280px 而不是均分 —— 记录条只需要能认出「哪一条」，
 * 多出来的宽度全部给画面。
 */
.wg-stage-body {
  display: grid;
  flex: 1;
  gap: 14px;
  min-height: 0;
  grid-template-columns: minmax(0, 1fr) 280px;
}

.wg-stage-main {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

.wg-stage-figure {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--stg-line);
  border-radius: var(--el-radius-lg, 12px);
  background: #0a0c12;
}

.wg-stage-media {
  position: relative;
  z-index: 1;
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: zoom-in;
  /* 大图解码完成前保持透明，避免先弹灰块再被图盖住的二次闪烁（与画廊 wg-media 同口径） */
  opacity: 0;
  transition: opacity 0.22s ease-out;
}

.wg-stage-media.is-loaded {
  opacity: 1;
}

/* 参考图随行条：贴在画框上方，小尺寸还原构图，点击进 viewer 看原图 */
.wg-stage-ref {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 10px;
}

.wg-stage-ref-label {
  flex: 0 0 auto;
  color: var(--stg-dim);
  font-size: 12px;
  letter-spacing: 1px;
}

.wg-stage-ref img {
  display: block;
  height: 84px;
  max-width: 180px;
  object-fit: cover;
  border: 1px solid var(--stg-line);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  cursor: zoom-in;
}

.wg-stage-ref-lost {
  padding: 6px 10px;
  border: 1px dashed var(--stg-line);
  border-radius: 8px;
  color: var(--stg-dim);
  font-size: 12px;
}

/* 对照开关：参考图条右侧；开启后舞台切成「参考图 | 结果」并排 */
.wg-stage-ref-toggle {
  flex: 0 0 auto;
  margin-left: auto;
  padding: 4px 12px;
  border: 1px solid var(--stg-line);
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--stg-dim);
  font-size: 12px;
  cursor: pointer;
  transition:
    background 0.18s,
    color 0.18s,
    border-color 0.18s;
}

.wg-stage-ref-toggle:hover {
  border-color: rgba(255, 255, 255, 0.24);
  color: var(--stg-text);
}

.wg-stage-ref-toggle.is-on {
  border-color: transparent;
  background: var(--el-color-primary);
  color: #fff;
}

/* 对照模式：图片任务走擦除滑块（参考图叠在结果上），视频任务保留并排双格（控件不能被盖） */
.wg-stage-figure.is-compare {
  gap: 12px;
  padding: 12px;
  align-items: stretch;
}

.wg-stage-compare-cell {
  position: relative;
  z-index: 1;
  display: flex;
  flex: 1 1 0;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.wg-stage-compare-cell img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.wg-stage-figure.is-compare .wg-stage-media {
  flex: 1 1 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

/* 擦除滑块：参考图按 clip-path 只露出分割线左侧，其余透出下层结果。
   inset 12px 对齐 is-compare 的内边距，让参考图与结果渲染在同一内容框里 */
.wg-stage-wipe {
  position: absolute;
  inset: 12px;
  z-index: 2;
  cursor: ew-resize;
  user-select: none;
  /* 拖动时别触发触屏滚动/手势 */
  touch-action: none;
}

.wg-stage-wipe-ref {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  -webkit-user-drag: none;
}

.wg-stage-wipe-bar {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.55);
  pointer-events: none;
}

.wg-stage-wipe-grip {
  position: absolute;
  top: 50%;
  left: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: rgba(6, 8, 13, 0.72);
  color: #e8ecf3;
  font-size: 13px;
  font-style: normal;
  backdrop-filter: blur(4px);
}

.wg-stage-compare-tag {
  position: absolute;
  top: 10px;
  z-index: 3;
  padding: 2px 9px;
  border-radius: var(--r-pill);
  background: rgba(6, 8, 13, 0.66);
  color: #d6dbe4;
  font-size: 11px;
  pointer-events: none;
}

.wg-stage-compare-cell .wg-stage-compare-tag,
.wg-stage-wipe .wg-stage-compare-tag:not(.is-result) {
  left: 10px;
}

.wg-stage-compare-tag.is-result {
  left: auto;
  right: 10px;
}

/* 进行中卡片的两条真实进度细条（画廊行内 wg-run / 生成占位块内 wg-gen）：
   宽度 = 后端 progress 原值，不插值——上游不回报中间进度时它停住，是诚实表现 */
.wg-run {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.wg-run-bar,
.wg-gen-bar {
  position: relative;
  display: block;
  overflow: hidden;
  border-radius: var(--r-pill);
}

.wg-run-bar {
  flex: 0 0 auto;
  width: 64px;
  height: 3px;
  background: var(--el-border-color);
}

.wg-gen-bar {
  width: 76px;
  height: 3px;
  background: rgba(255, 255, 255, 0.24);
}

.wg-run-bar b,
.wg-gen-bar b {
  position: absolute;
  inset: 0;
  display: block;
  border-radius: inherit;
  background: var(--color-primary);
  transition: width 0.4s ease-out;
}

.wg-gen-bar b {
  background: #fff;
}

.wg-stage-compare-tag.is-result {
  right: 10px;
}

/* 虚化底：比画框大一圈，边缘被 overflow 裁掉，避免模糊后露出硬边 */
.wg-stage-bleed {
  position: absolute;
  inset: -8%;
  background-position: center;
  background-size: cover;
  filter: blur(44px) saturate(0.92);
  opacity: 0.42;
  pointer-events: none;
}

/* 说明浮层压在画面下沿：题目、规格、操作都贴着这张图，不再另起一块面板。
   两行文字 + 右侧操作列：prompt 独占第一行，规格在第二行，
   操作竖排在右边 —— 之前三块挤成一条 flex，prompt 被规格挤成两个字的竖排。 */
.wg-stage-cap {
  position: absolute;
  z-index: 2;
  right: 0;
  bottom: 0;
  left: 0;
  display: grid;
  align-items: end;
  gap: 4px 16px;
  padding: 44px 16px 14px;
  background: linear-gradient(to top, rgba(6, 8, 13, 0.94) 0%, rgba(6, 8, 13, 0.72) 52%, transparent 100%);
  grid-template-columns: minmax(0, 1fr) auto;
}

.wg-stage-prompt {
  display: -webkit-box;
  grid-column: 1;
  grid-row: 1;
  margin: 0;
  overflow: hidden;
  color: var(--stg-text);
  font-size: 13px;
  line-height: 1.5;
  cursor: pointer;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.wg-stage-prompt-caret {
  width: 12px;
  height: 12px;
  margin-right: 5px;
  vertical-align: -2px;
  opacity: 0.62;
  transition: transform 0.18s ease;
}

/* 展开：取消两行截断，读全文；箭头翻转向表示「可收起」 */
.wg-stage-prompt.is-open {
  display: block;
  -webkit-line-clamp: unset;
}

.wg-stage-prompt.is-open .wg-stage-prompt-caret {
  transform: rotate(180deg);
}

/* 完整提示词（后端拼接结果）：跟在用户原文下面，独占左列一行 */
.wg-stage-final {
  display: flex;
  grid-column: 1;
  align-items: flex-start;
  gap: 6px;
  margin: 2px 0 0;
  color: var(--stg-dim);
  font-size: 12px;
  line-height: 1.5;
}

.wg-stage-meta {
  display: flex;
  flex-wrap: wrap;
  grid-column: 1;
  gap: 4px 14px;
  color: var(--stg-dim);
  font-size: 11px;
  line-height: 1.5;
}

.wg-stage-meta em {
  margin-right: 4px;
  font-style: normal;
  opacity: 0.6;
}

.wg-stage-badge {
  padding: 1px 8px;
  border-radius: var(--r-pill);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
}

/*
 * 舞台徽标复用卡片的状态色，但底衬换成半透明白：
 * 卡片上那几档是「浅底深字」，压在暗色画面上会变成两块亮斑。
 */
.wg-stage-badge.is-success {
  background: rgba(74, 222, 128, 0.16);
  color: #6ee7a0;
}

.wg-stage-badge.is-danger {
  background: rgba(248, 113, 113, 0.16);
  color: #fca5a5;
}

.wg-stage-badge.is-info {
  background: rgba(255, 255, 255, 0.1);
  color: var(--stg-dim);
}

.wg-stage-badge.is-primary {
  background: rgba(109, 93, 252, 0.22);
  color: #b9b0ff;
}

.wg-stage-acts {
  display: flex;
  grid-column: 2;
  grid-row: 1 / span 2;
  align-self: end;
  gap: 4px;
}

.wg-stage-act {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid transparent;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: var(--stg-text);
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}

.wg-stage-act:hover {
  background: rgba(255, 255, 255, 0.18);
}

.wg-stage-act.is-on {
  color: #ffd166;
}

.wg-stage-act:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.wg-stage-act .wg-svg {
  width: 15px;
  height: 15px;
}

/* 胶片行：一次生成 8–10 张时逐张挑，横向滚动不换行 */
.wg-stage-film {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
  padding-bottom: 2px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.wg-stage-film-item {
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  padding: 0;
  overflow: hidden;
  border: 2px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  background: #14181f;
  cursor: pointer;
  opacity: 0.62;
  transition: opacity 0.18s, border-color 0.18s;
}

.wg-stage-film-item:hover {
  opacity: 0.9;
}

.wg-stage-film-item.is-active {
  border-color: var(--el-color-primary);
  opacity: 1;
}

.wg-stage-film-item img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wg-stage-film-lost {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--stg-dim);
  font-size: 10px;
}

.wg-stage-lost {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--stg-dim);
  font-size: 12px;
}

/* 右侧记录条：与画廊同一个顺序，点一条换主角 */
.wg-stage-rail {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px;
  border: 1px solid var(--stg-line);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--stg-panel);
}

.wg-stage-rail-title {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  color: var(--stg-dim);
  font-size: 11px;
  letter-spacing: 0.06em;
}

.wg-stage-rail-title .wg-svg {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

.wg-stage-rail-count {
  margin-left: auto;
  padding: 0 6px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.08);
  color: var(--stg-text);
  font-variant-numeric: tabular-nums;
}

.wg-stage-rail-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.wg-stage-rail-item {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--stg-text);
  text-align: left;
  cursor: pointer;
  transition: background 0.16s, border-color 0.16s;
}

.wg-stage-rail-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.wg-stage-rail-item.is-active {
  border-color: rgba(109, 93, 252, 0.55);
  background: rgba(109, 93, 252, 0.16);
}

.wg-stage-rail-item img {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  background: #0a0c12;
}

.wg-stage-rail-text {
  display: -webkit-box;
  flex: 1;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.4;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.wg-stage-rail-time {
  flex: 0 0 auto;
  color: var(--stg-dim);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

/* 没有成功作品：舞台不装作有东西可看，只留回画廊一条出路 */
.wg-stage-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--stg-dim);
  text-align: center;
}

.wg-stage-empty-title {
  margin: 0;
  color: var(--stg-text);
  font-size: 14px;
  font-weight: 600;
}

.wg-stage-empty-hint {
  margin: 0 0 10px;
  font-size: 12px;
}

.wg-stage-empty .wg-more-btn {
  border-color: var(--stg-line);
  background: rgba(255, 255, 255, 0.06);
  color: var(--stg-text);
}

.wg-stage-empty .wg-more-btn:hover {
  background: rgba(255, 255, 255, 0.12);
}

/* 舞台内控件也走键盘：暗底上焦点环换成白色，主色环在 #0e1017 上偏暗 */
.wg-stage button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.75);
  outline-offset: 2px;
}

/* 窄屏：记录条落到画面下方，横排滚动 */
@media (max-width: 1080px) {
  .wg-stage-body {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) 148px;
  }

  .wg-stage-rail-list {
    flex-direction: row;
  }

  .wg-stage-rail-item {
    width: 168px;
  }
}

/*
  触屏（粗指针）下的命中区下限：44×44。

  两条硬约束，都必须满足：

  ① **顺序**：必须先拉开行间距，再撑热区。只撑热区时实测出问题 ——
    `.wg-thumb-actions` 的 gap 只有 6px，而 30px 按钮撑到 44px 会每侧溢出 7px，
    相邻两个热区互相重叠 8px，后画的伪元素截胡点击，变成「点 A 命中 B」。
    故间距提到 16px（> 2×7px，留 2px 余量而不只是刚好不碰）。

  ② **位置**：这一块必须放在主样式表**最末**。此前放在中段（.wg-canvas 焦点环之后），
    结果被源序更靠后的 `.wg-card-head-right { gap: 12px }` 覆盖，实测该行仍是 12px、
    热区重叠 2px —— CSS 同权重下后者胜，与选择器精确度无关。

  用伪元素撑热区而不是改控件尺寸：视觉密度与布局都不动，只是可点范围变大。
*/
@media (pointer: coarse) {
  .wg-thumb-actions,
  .wg-card-head-right,
  .wg-card-head {
    gap: 16px;
  }

  .wg-icon,
  .wg-act,
  .wg-chip,
  .wg-retry,
  .wg-pick,
  .wg-media-btn {
    position: relative;
  }

  .wg-icon::after,
  .wg-act::after,
  .wg-chip::after,
  .wg-retry::after,
  .wg-pick::after,
  .wg-media-btn::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: max(100%, 44px);
    height: max(100%, 44px);
    transform: translate(-50%, -50%);
  }
}
</style>

