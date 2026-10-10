<template>
  <div class="wg">
    <section class="wg-main">
      <!-- 顶部：标题行 + 筛选行（照 UI 图） -->
      <header class="wg-head">
        <div class="wg-head-top">
          <h1 class="wg-title">{{ mediaLabel }}生成</h1>
          <span class="wg-total">共 {{ tasks.length }} 个任务</span>

          <div class="wg-head-actions">
            <!--
              生成类型切换。
              原来是在筛选行里放「图像 / 视频」两个行内 tab，占掉一整行左侧，
              现在收到右上角做成一个按钮 + popover：既省位置，也和「网格/列表」
              这类视图操作归到同一组工具按钮里。

              视频入口仍受 videoAvailable 约束（后端 openai 协议没有 VideoClient），
              只有一种类型时不做无意义的切换。
            -->
            <el-popover
              v-if="videoAvailable"
              ref="mediaPopoverRef"
              placement="bottom-end"
              :width="200"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button type="button" class="wg-media-btn" title="生成类型">
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
            </el-popover>

            <div class="wg-views">
              <button
                type="button"
                class="wg-view"
                :aria-label="viewStyle === 'grid' ? '切换为列表视图' : '切换为网格视图'"
                :title="viewStyle === 'grid' ? '切换为列表视图' : '切换为网格视图'"
                @click="viewStyle = viewStyle === 'grid' ? 'list' : 'grid'"
              >
                <!-- 图标表示「点下去会切到的目标视图」：当前是网格就显示列表图标 -->
                <WgIcon :d="viewStyle === 'grid' ? ICONS.list : ICONS.grid" />
              </button>
            </div>
          </div>
        </div>

        <div class="wg-head-filters">
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
          <el-popover placement="bottom-start" :width="260" trigger="click" popper-class="wg-popper">
            <template #reference>
              <button type="button" class="wg-chip" title="筛选">
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
                @click="modelFilter = opt.key"
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
                @click="statusFilter = opt.key"
              >
                <span class="wg-menu-text"><span class="wg-menu-name">{{ opt.label }}</span></span>
                <WgIcon v-if="statusFilter === opt.key" :d="ICONS.check" class="wg-menu-check" />
              </button>

              <p class="wg-menu-title">偏好</p>
              <button
                type="button"
                class="wg-menu-item"
                :class="{ 'is-active': onlyFavorite }"
                @click="onlyFavorite = !onlyFavorite"
              >
                <span class="wg-menu-text"><span class="wg-menu-name">仅收藏</span></span>
                <WgIcon v-if="onlyFavorite" :d="ICONS.check" class="wg-menu-check" />
              </button>
            </div>
          </el-popover>

          <!--
            记录管理：清理失败 / 批量删除 / 清空全部。
            三个都是破坏性操作，收进一个 popover 而不是并排摆三个危险按钮 ——
            并排会让「清空全部」离「清理失败」只有几十像素，误触代价却是全部作品。
          -->
          <el-popover
            v-if="!selecting"
            placement="bottom-end"
            :width="280"
            trigger="click"
            popper-class="wg-popper"
          >
            <template #reference>
              <button
                type="button"
                class="wg-chip wg-chip-danger"
                :disabled="busyClearing"
                :title="busyClearing ? '正在处理…' : '记录管理'"
              >
                <WgIcon :d="ICONS.trash" />
                <span>清理{{ voidRecordCount ? ' ' + voidRecordCount : '' }}</span>
                <WgIcon :d="ICONS.chevron" />
              </button>
            </template>
            <div class="wg-menu">
              <p class="wg-menu-title">记录管理</p>
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
          </el-popover>

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
            <button type="button" class="wg-chip" @click="exitSelectMode()">退出</button>
          </template>

          <!-- 排序 -->
          <el-popover placement="bottom-end" :width="200" trigger="click" popper-class="wg-popper">
            <template #reference>
              <button type="button" class="wg-chip" title="排序">
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
                @click="sortOrder = opt.key"
              >
                <span class="wg-menu-text"><span class="wg-menu-name">{{ opt.label }}</span></span>
                <WgIcon v-if="sortOrder === opt.key" :d="ICONS.check" class="wg-menu-check" />
              </button>
            </div>
          </el-popover>
        </div>
      </header>

      <!-- 结果画布 -->
      <!-- tabindex="0"：内层滚动区默认不可聚焦，方向键 / PageDown / End 只作用于聚焦元素，
           鼠标能往下翻历史、键盘却完全不动。role="region" 让读屏能识别为可滚动区域。 -->
      <div
        ref="canvasRef"
        class="wg-canvas"
        tabindex="0"
        role="region"
        aria-label="生成历史"
        @scroll.passive="onCanvasScroll"
      >
        <!-- 骨架屏：首次加载历史期间，避免「一片空白」 -->
        <div v-if="loading && !rows.length" class="wg-list">
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
          v-else-if="rows.length"
          class="wg-list"
          :class="{ 'is-grid': viewStyle === 'grid' }"
        >
          <article
            v-for="row in rows"
            :key="row.id"
            class="wg-card"
            :class="[`is-${row.kind}`, { 'is-selecting': selecting, 'is-selected': selectedIds.has(row.id) }]"
            @click="onCardClick(row)"
          >
            <!-- 选择模式下每张卡左上角一个勾选框；其余操作整块屏蔽，避免误触删除/重试 -->
            <span v-if="selecting" class="wg-pick" :aria-checked="selectedIds.has(row.id)" role="checkbox">
              <WgIcon :d="selectedIds.has(row.id) ? ICONS.check : ICONS.circle" />
            </span>
            <!-- 第一行：状态 + 提示词 + 耗时/时间 -->
            <div class="wg-card-head">
              <span class="wg-badge" :class="badgeClass(row.task)">{{ badgeText(row.task) }}</span>
              <p class="wg-card-title" :title="row.task.prompt">{{ row.task.prompt || '（无提示词）' }}</p>

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

                <span v-if="row.kind === 'running'" class="wg-strong">{{ row.task.progress ?? 0 }}%</span>
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
              <div v-if="row.kind === 'result'" class="wg-card-media">
              <!-- 参考图 + 箭头：图生图 -->
              <template v-if="row.task.referenceImage">
                <figure class="wg-ref-box">
                  <img
                    :src="mediaSrc(row.task.referenceImage)"
                    alt="参考图"
                    loading="lazy"
                    :style="{ aspectRatio: refRatioOf(row.task) }"
                  />
                  <figcaption class="wg-ref-tag">参考图</figcaption>
                  <span class="wg-ref-kind">{{ row.task.type === 'video' ? '图生视频' : '图生图' }}</span>
                </figure>
                <span class="wg-arrow" aria-hidden="true">
                  <WgIcon :d="ICONS.arrowRight" />
                </span>
              </template>

              <!-- 结果网格：点击进 viewerjs 预览 -->
              <div class="wg-grid" :style="{ '--wg-cols': gridCols(row) }" v-viewer="viewerOptions">
                <figure
                  v-for="(entry, idx) in row.items"
                  :key="entry.key"
                  class="wg-thumb"
                  :class="{ 'is-lead': isLead(row, idx), 'is-loaded': loadedImages.has(entry.key) }"
                >
                  <video
                    v-if="row.task.type === 'video'"
                    :src="mediaVideoSrc(entry.url)"
                    class="wg-media"
                    controls
                    preload="metadata"
                    @loadeddata="markLoaded(entry.key)"
                  />
                  <!--
                    decoding="async" 让解码不占主线程，配合 loading="lazy" 只解可见区的那几张。
                    结果图现在走后端字节流地址（不再内联 base64），懒加载才真正起作用：
                    内联时 30 张图的 base64 已经全在内存里，lazy 只是空转。
                    is-loaded 只做透明度过渡，不加装饰投影（见 .wg-thumb）。
                  -->
                  <img
                    v-else
                    :src="mediaSrc(entry.url)"
                    class="wg-media"
                    :alt="row.task.prompt"
                    loading="lazy"
                    decoding="async"
                    @load="markLoaded(entry.key)"
                  />

                  <figcaption class="wg-thumb-actions">
                    <button
                      v-if="row.task.type === 'image'"
                      type="button"
                      class="wg-icon"
                      aria-label="查看大图"
                      title="查看大图"
                      @click.stop="zoom($event)"
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
              </div>
            </div>

            <!-- 进行中：占位块，按目标尺寸保持比例，并按结果网格同一套算法封顶宽度 -->
              <div v-else-if="row.kind === 'running'" class="wg-card-media">
                <div
                  class="wg-generating"
                  :style="{
                    aspectRatio: aspectOf(row.task.size),
                    maxWidth: generatingMaxWidth(row),
                  }"
                >
                  <span class="wg-spark"><WgIcon :d="ICONS.sparkle" /></span>
                  <span class="wg-stage">{{ stageText(row.task) }}</span>
                  <span class="wg-stage-num">{{ row.task.progress ?? 0 }}%</span>
                  <!--
                    已用时：生成中这一段进度会长时间停在同一个数（上游不返回中间进度），
                    光看一个不动的百分比像是卡死了。秒数按心跳同一事实推进——
                    后端在生成期间每秒刷 updatedAt 证明 worker 活着（实测心跳序列
                    0.1s/2.3s/4.4s/…/12.8s 连续推进），这里把它显示出来，
                    而不是编一个假的百分比（不做时间插值是既定口径）。
                  -->
                  <span class="wg-stage-elapsed">已用时 {{ elapsedSeconds(row.task) }}s</span>
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
                  :style="{ aspectRatio: aspectOf(row.task.size), maxWidth: generatingMaxWidth(row) }"
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
                三处去冗余：
                · 去掉「模型」标签字 —— 模型名自带 logo，说法自解释；
                · 去掉重复的时间 —— 第一行右侧已经有了，这里再显示一遍；
                · 风格为空、张数为 1 都不出胶囊 —— 「无风格」「1 张」是废话不是信息。
              -->
              <div class="wg-card-chips">
                <span class="wg-pill wg-pill-model">
                  <img v-if="modelLogo(row.task.model)" :src="modelLogo(row.task.model)!" alt="" class="wg-logo" />
                  <span>{{ modelLabel(row.task.model) }}</span>
                </span>
                <span v-if="row.task.size" class="wg-pill">
                  {{ row.task.size }}<template v-if="ratioOf(row.task.size)"> · {{ ratioOf(row.task.size) }}</template>
                </span>
                <span v-if="row.task.type === 'image' && (row.task.count ?? 1) > 1" class="wg-pill">
                  {{ row.task.count }} 张
                </span>
                <span v-if="row.task.type === 'video' && row.task.duration" class="wg-pill">{{ row.task.duration }}s</span>
                <span v-if="row.task.type === 'image' && row.task.style" class="wg-pill">
                  {{ styleName(row.task.style) }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <p v-if="!loading && !rows.length" class="wg-empty">
          还没有作品，描述你想象的场景，开始生成
        </p>

        <!-- 分页尾部：加载中 / 还有更多（可点）/ 到底了。
             「还有更多」必须给按钮而不是只靠滚动触发：内容不足一屏时容器不会产生滚动事件，
             第一页之外的历史将永远无法加载。 -->
        <div v-if="rows.length" class="wg-more">
          <span v-if="loadingMore">加载中…</span>
          <button v-else-if="hasMore" type="button" class="wg-more-btn" @click="loadMore()">
            加载更早的记录
          </button>
          <span v-else>没有更多了</span>
        </div>
      </div>

      <!-- 输入条：外观沿用会话输入库（GenerateComposer.vue） -->
      <footer ref="composerRef" class="wg-composer">
        <GenerateComposer
          v-model:value="prompt"
          v-model:style-panel-open="stylePanelOpen"
          :busy="submitting || hasRunningTask"
          :placeholder="placeholder"
          :allow-reference="!!currentConfig?.referenceImage"
          allow-optimize
          :optimizing="optimizing"
          :allow-style-panel="styleSupported"
          :style-items="stylePanelItems"
          :style-value="style"
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

          <!-- 参数芯片：模型 / 分辨率 / 比例 / 时长 / 张数 / 风格 -->
          <template #buttons>
            <el-popover placement="top-start" :width="300" trigger="click" popper-class="wg-popper">
              <template #reference>
                <button type="button" class="wg-chip is-strong" title="创作模型">
                  <img v-if="modelLogo(model)" :src="modelLogo(model)!" alt="" class="wg-logo" />
                  <span>{{ modelLabel(model) }}</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">创作模型</p>
                <button
                  v-for="opt in currentModels"
                  :key="opt.model"
                  type="button"
                  class="wg-menu-item"
                  :class="{ 'is-active': model === opt.model }"
                  @click="pickModel(opt.model)"
                >
                  <img v-if="modelLogo(opt.model, opt.providerName)" :src="modelLogo(opt.model, opt.providerName)!" alt="" class="wg-logo" />
                  <span class="wg-menu-text">
                    <span class="wg-menu-name">{{ modelLabel(opt.model) }}</span>
                    <span class="wg-menu-desc">{{ opt.providerName }}</span>
                  </span>
                  <WgIcon v-if="model === opt.model" :d="ICONS.check" class="wg-menu-check" />
                </button>
              </div>
            </el-popover>

            <!-- 分辨率 + 比例 -->
            <el-popover
              v-if="sizes.length"
              placement="top-start"
              :width="300"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button type="button" class="wg-chip" title="分辨率与比例">
                  <span>{{ size || sizes[0] }}<template v-if="activeRatio"> · {{ activeRatio }}</template></span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">设置</p>
                <div class="wg-seg">
                  <button
                    v-for="item in sizes"
                    :key="item"
                    type="button"
                    class="wg-seg-item"
                    :class="{ 'is-active': size === item }"
                    @click="size = item"
                  >
                    {{ resolutionLabel(item) }}
                  </button>
                </div>
                <div v-if="ratios.length" class="wg-ratio-grid">
                  <button
                    v-for="item in ratios"
                    :key="item"
                    type="button"
                    class="wg-ratio"
                    :class="{ 'is-active': activeRatio === item }"
                    :aria-pressed="activeRatio === item"
                    @click="pickRatio(item)"
                  >
                    <span class="wg-ratio-box" :style="ratioBoxStyle(item)"></span>
                    <span class="wg-ratio-label">{{ item }}</span>
                  </button>
                </div>
              </div>
            </el-popover>

            <!-- 时长（视频） -->
            <el-popover
              v-if="mediaType === 'video' && durations.length"
              placement="top-start"
              :width="300"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button type="button" class="wg-chip" title="时长">
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
                    @click="onDurationPick(item)"
                  >
                    {{ item }}s
                  </button>
                </div>
              </div>
            </el-popover>

            <!-- 张数 -->
            <el-popover
              v-if="mediaType === 'image'"
              placement="top-start"
              :width="180"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button type="button" class="wg-chip" title="张数">
                  <span>{{ count }} 张</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">张数</p>
                <button
                  v-for="n in countOptions"
                  :key="n"
                  type="button"
                  class="wg-menu-item"
                  :class="{ 'is-active': count === n }"
                  @click="count = n"
                >
                  <span class="wg-menu-text"><span class="wg-menu-name">{{ n }} 张</span></span>
                  <WgIcon v-if="count === n" :d="ICONS.check" class="wg-menu-check" />
                </button>
              </div>
            </el-popover>

            <!-- 风格：仅模型声明支持 style 时展示；缩略图只取真正用过该风格的图 -->
            <el-popover
              v-if="mediaType === 'image' && styleSupported"
              placement="top-start"
              :width="360"
              trigger="click"
              popper-class="wg-popper"
            >
              <template #reference>
                <button
                  type="button"
                  class="wg-chip"
                  :class="{ 'is-strong': !!style }"
                  title="风格模板"
                >
                  <span>{{ styleLabel }}</span>
                  <WgIcon :d="ICONS.chevron" />
                </button>
              </template>
              <div class="wg-menu">
                <p class="wg-menu-title">风格</p>
                <div class="wg-style-grid">
                  <button
                    v-for="item in styleOptions"
                    :key="item.key || 'none'"
                    type="button"
                    class="wg-style"
                    :class="{ 'is-active': style === item.key }"
                    :aria-pressed="style === item.key"
                    @click="pickStyle(item.key)"
                  >
                    <span class="wg-style-thumb">
                      <img
                        v-if="stylePreview(item.key)"
                        :src="mediaSrc(stylePreview(item.key))"
                        :alt="item.name"
                        loading="lazy"
                      />
                      <span v-else class="wg-style-fallback">{{ item.name }}</span>
                    </span>
                    <span class="wg-style-name">{{ item.name }}</span>
                  </button>
                </div>
              </div>
            </el-popover>
          </template>
        </GenerateComposer>

        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          class="wg-file"
          @change="onFilePicked"
        />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { computed, h, nextTick, onActivated, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { apiService } from '../../services/ApiService'
import type { GenerateModel, GenerateTask, GenerateTaskStatus } from '../../services/modules/generate.api'
import { isInlineMedia, resolveReferenceImage } from '../../services/modules/generate.api'
import { createAuthImageLoader, downloadAuthenticatedFile } from '../../utils/authImage'
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
 * <video> 专用版本。
 *
 * 加载器未就绪时返回的 1×1 GIF 对 <video> 是**非法媒体源**（会抛媒体错误、
 * 触发一次 error），所以这里给空串让 <video> 保持无源，等 blob 就绪后再挂上。
 */
const mediaVideoSrc = (url: string | null | undefined): string =>
  isInlineMedia(url) && !mediaImages.isReady(url) ? '' : mediaSrc(url)
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
import { getModelAvatarPath } from '../../utils/modelUtils'
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
  dots: 'M12 6h.01M12 12h.01M12 18h.01', // 「更多」菜单：三点竖排（round 线帽下 h.01 渲染成圆点）
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
   * 风格描述：提交时追加到用户提示词后面。
   *
   * 风格不是上游 API 参数（多数 OpenAI 兼容渠道会把 style 判为非法参数直接 400），
   * 而是「用户输入 + 风格描述」拼成的最终提示词。
   */
  prompt: string
}

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
]

/**
 * 内置风格的缩略图（放在 public/gen-style 下，构建时原样拷贝）。
 *
 * 这些图是按「固定主体 + 该风格描述」在本系统里跑生图接口批量生成的：
 * 八张图共用同一个主体（少女 / 海边礁石），差异只来自风格本身，
 * 所以并排看就能直接对比风格差别，而不是各画各的内容。
 *
 * 生成方式：node .tmp/sg/gen-styles.mjs（风格表从本文件的 STYLE_TEMPLATES 正则提取，
 * 不会与页面漂移），再用 .tmp/sg/shrink-styles.ps1 压成 256px JPEG。
 *
 * 表里没有对应文件的 key（模型管理里自配的风格）会退到「真用过该风格」的生成结果，
 * 都没有时用风格名占位——配错图比没图更误导。
 */
const STYLE_THUMBS: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(
    ['photo', 'anime', 'ink', 'cyber', 'clay', 'product', 'sketch', 'pixel'].map((key) => [
      key,
      `${import.meta.env.BASE_URL}gen-style/${key}.jpg`,
    ]),
  ),
)

/** 收藏持久化键：生成接口暂无收藏字段，用本地集合让「仅收藏」真正生效 */
const FAVORITE_KEY = 'ai-guada:generate-favorites'

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

const tasks = ref<GenerateTask[]>([])
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
 * 生成类型切换弹层的实例。
 *
 * `trigger="click"` 的 el-popover 点内容不会自动收起，而切换类型属于「跳转」
 * 语义（下方模型列表与历史都会重载），选完必须关掉，否则弹层挡住刷新后的页面。
 */
const mediaPopoverRef = ref<{ hide: () => void } | null>(null)

/** 当前生成类型的中文名（标题与切换按钮共用） */
const mediaLabel = computed(() => (mediaType.value === 'video' ? '视频' : '图像'))

const keyword = ref('')
const modelFilter = ref('')
const statusFilter = ref<GenerateTaskStatus | ''>('')
const onlyFavorite = ref(false)
const sortOrder = ref<'newest' | 'oldest'>('newest')
const viewStyle = ref<'list' | 'grid'>('list')
const favorites = ref<string[]>(readFavorites())

const canvasRef = ref<HTMLElement | null>(null)
const composerRef = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

/**
 * 每个任务一个轮询定时器。
 *
 * 之前所有任务共用一个 pollTimer 变量，后提交的任务会覆盖前一个，
 * 于是先提交的任务永远等不到终态、进度条卡在中间；
 * 删除记录时也停不掉对应的轮询。现在按 taskId 分别登记，删除/卸载时逐个清。
 */
const pollTimers = new Map<string, ReturnType<typeof setTimeout>>()

const currentModels = computed(() => models.value.filter((item) => item.type === mediaType.value))
const currentConfig = computed(() => currentModels.value.find((item) => item.model === model.value)?.config)
const sizes = computed(() => currentConfig.value?.sizes ?? [])
const maxCount = computed(() => Math.max(1, currentConfig.value?.maxCount ?? 1))
const durations = computed(() => currentConfig.value?.durations ?? [])
const countOptions = computed(() => Array.from({ length: maxCount.value }, (_, i) => i + 1))

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

/** @ 风格面板是否打开 */
const stylePanelOpen = ref(false)

/**
 * @ 风格面板的风格项。
 *
 * 缩略图与描述都从 styleOptions 取，与芯片弹层共用同一份数据 ——
 * 两处各维护一份必然漂移（之前「风格缩略图和文字对不上」就是这么来的）。
 * 无风格项（key 为空）不进面板：面板是「加一个风格」，去掉风格用芯片上的无风格。
 */
const stylePanelItems = computed(() =>
  styleOptions.value
    .filter((item) => !!item.key)
    .map((item) => ({
      key: item.key,
      name: item.name,
      prompt: item.prompt,
      thumb: stylePreview(item.key),
    })),
)

/** 当前风格的描述文本，提交时追加到提示词 */
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
 * 保证两处展示的 logo 一致；映射不到时返回 null，由调用方决定是否留白。
 */
const modelLogo = (modelName: string, providerName?: string) => {
  if (!modelName) {
    return null
  }
  const provider =
    providerName || models.value.find((item) => item.model === modelName)?.providerName
  return getModelAvatarPath(modelName, provider)
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

/** 失败 / 已取消的记录数：清理按钮的角标与是否显示都看它 */
const voidRecordCount = computed(
  () => tasks.value.filter((t) => t.status === 'FAILED' || t.status === 'CANCELED').length,
)


/** 有失败记录才显示清理入口，避免常驻一个点不动的按钮 */
const hasVoidRecords = computed(() => voidRecordCount.value > 0)

/**
 * 结果网格列数（写进 --wg-cols）。
 *
 * 按张数换排法，而不是一路平铺：
 *   1 张  1 列       2 张  2 列       3 张  3 列       4 张  4 列
 *   5 张  4 列 + 首张占 2×2（左侧一张大图，右侧 2×2）
 *   6 张  3 列 ×2    7 张起 3 列
 * 有参考图时结果区被压缩，固定 2 列（4 张即 2×2），与 UI 图卡片 1 一致。
 */
const gridCols = (row: Row) => {
  const n = row.items.length
  if (n === 0) {
    return 4
  }
  if (row.task.referenceImage) {
    return 2
  }
  if (n <= 4) {
    return n
  }
  if (n === 5) {
    return 4
  }
  return 3
}

/** 拼图主角：仅 5 张时的第一张，占 2×2 格 */
const isLead = (row: Row, index: number) =>
  !row.task.referenceImage && row.items.length === 5 && index === 0

/**
 * 进行中占位块的宽度上限。
 *
 * 占位块是 .wg-card-media 的 flex:1 子项，本身不限宽：不限就会被拉到整行宽度，
 * 再叠加 aspect-ratio（如 1024x1024 → 1/1）就成了一整屏高的渐变色块。
 * 这里用与 .wg-grid 相同的封顶公式，宽度按**即将到达的张数**算：
 * 等待态占多宽，出图后就占多宽，不会出现「等待时铺满屏幕、出图后缩成一小块」的反差。
 *
 * 不能直接调 gridCols —— 它读的是已到结果数，等待时恒为 0 而返回 4 列，
 * 会让单张任务凭空占 4 格宽。
 *
 * @param row 当前卡片行
 * @return 可直接写进 style 的 max-width 值
 */
const generatingMaxWidth = (row: Row) => {
  const n = Math.max(1, row.task.count ?? 1)
  const cols = row.task.referenceImage
    ? Math.min(n, 2)
    : n <= 4
      ? n
      : n === 5
        ? 4
        : 3
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
  () => (modelFilter.value ? 1 : 0) + (statusFilter.value ? 1 : 0) + (onlyFavorite.value ? 1 : 0),
)

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

/** 查看大图：按钮自身不驱动 viewer，直接触发同图内 img 的点击交给 v-viewer */
const zoom = (ev: MouseEvent) => {
  const figure = (ev.currentTarget as HTMLElement | null)?.closest('.wg-thumb')
  figure?.querySelector('img')?.click()
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

const pickModel = (value: string) => {
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
 * 点风格芯片：插到提示词**最前面**。
 *
 * 风格是对整张图的整体修饰（"XX 风格的一只猫"），放首行才不会把用户
 * 后半句的构图描述压到风格后面。而 @ 面板里选中是插到 @ 所在位置，
 * 两条路径位置不同是有意的：芯片 = 我要改整张图的调性，@ = 我要改这一段。
 *
 * @param key 风格 key，空串表示「无风格」
 */
const pickStyle = (key: string) => {
  style.value = key
  if (!key) {
    return
  }
  const desc = stylePrompt.value
  const current = prompt.value.trim()
  if (!desc || current.startsWith(desc)) {
    return
  }
  prompt.value = current ? `${desc}，${current}` : desc
}

/**
 * @ 面板里选中：文字已由 composer 写进 @ 所在位置，这里只记下风格 key
 * （用于芯片高亮与提交时判断），不再二次改写提示词。
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

const switchMedia = (value: 'image' | 'video') => {
  // 切换类型是「跳转」而非「调节某个开关」，选完应当收起弹层
  mediaPopoverRef.value?.hide()
  if (mediaType.value === value) {
    return
  }
  mediaType.value = value
  model.value = ''
  size.value = ''
  duration.value = undefined
  // 模型与历史都要按新媒体类型重载：只重载模型会让列表仍显示上一种类型的任务
  void loadModels()
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

const onFilePicked = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }
  input.value = ''
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

/**
 * 下载出图结果。
 *
 * `<a href download>` 带不了请求头，内联媒体只能走 fetch + blob
 * （令牌不进 URL，浏览器下载历史里不会留下一条带 accessToken 的地址）。
 * 供应商直链不需要鉴权，走原生下载即可。
 */
const download = (url: string, type: 'image' | 'video') => {
  void downloadAuthenticatedFile(
    url,
    type === 'video' ? 'generate.mp4' : 'generate.png',
  )
}

/* ============================================================================
   「更多」菜单：添加到人脸库 / 添加到图像库
   ============================================================================= */

/** 「更多」菜单进行中（防重复提交；两个动作共用一个忙标） */
const moreBusy = ref(false)

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

/** 「更多 → 添加到人脸库」：以生成图直接登记（图里没人脸/多脸时后端会明确报错） */
async function enrollGeneratedFace(url: string, prompt: string) {
  if (moreBusy.value) return
  moreBusy.value = true
  try {
    const blob = await fetchMediaBlob(url)
    const id = `face-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const name = promptName(prompt, 20, '生成人脸')
    await apiService.enrollFace(id, blob, { label: name, name, note: '来自图像生成' }, 'generated.png')
    message.success(`已添加到人脸库：${name}`)
  } catch (e: any) {
    message.error(`添加到人脸库失败：${(e as Error)?.message || '未知错误'}`)
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
    const form = new FormData()
    form.append('file', blob, 'generated.png')
    form.append('name', promptName(prompt, 60, '生成图'))
    await apiService._request('/image-search/index', {
      method: 'POST',
      data: form,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
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
 * 选择模式下点击卡片本体即切换勾选，不需要精准点到那个小方框。
 *
 * @param row 卡片行
 */
const onCardClick = (row: { id: string }) => {
  if (selecting.value) {
    toggleSelect(row.id)
  }
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
    await ElMessageBox.confirm(`将删除勾选的 ${ids.length} 条记录，此操作不可恢复。`, '批量删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
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
    await ElMessageBox.confirm(
      task.status === 'FAILED' || task.status === 'CANCELED'
        ? '确定删除这条失败记录？'
        : '确定删除这条记录？删除后无法恢复。',
      '删除确认',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
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
    await ElMessageBox.confirm(
      `将删除当前已加载的 ${count} 条失败/取消记录，此操作不可恢复。`,
      '清理失败记录',
      { type: 'warning', confirmButtonText: '清理', cancelButtonText: '取消' },
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
  await onComposerSubmit(task.prompt)
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

/** 画布滚动：距底部 200px 内触发补页 */
const onCanvasScroll = () => {
  const el = canvasRef.value
  if (!el) {
    return
  }
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
    void loadMore()
  }
}

/** 单任务轮询：终态后落回列表 */
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
    if (!cleaned) {
      message.warning('优化结果为空，已保留原文')
      return
    }
    if (cleaned === source) {
      message.info('模型认为当前描述已经够具体了')
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
const onComposerSubmit = async (text: string) => {
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
    // 正常路径下风格描述已经在输入框里了（芯片点击插到最前、@ 插到原位），
    // 所以这里只在「描述不在文本里」时兜底补一次 —— 典型来源是「重试 / 再次生成」
    // 回填了 style 字段但没带描述。用 includes 而不是 startsWith：
    // @ 插入的风格在句子中间，startsWith 判不出来，会导致重复拼接。
    const withStyle = text.trim()
    const desc = stylePrompt.value
    const hasStyleDesc = !desc || withStyle.includes(desc)
    const finalPrompt =
      styleSupported.value && !hasStyleDesc ? [desc, withStyle].filter(Boolean).join('，') : withStyle
    const task = await apiService.createGenerateTask({
      type: mediaType.value,
      model: model.value,
      prompt: finalPrompt,
      size: size.value || undefined,
      count: mediaType.value === 'image' ? count.value : undefined,
      duration: mediaType.value === 'video' ? (duration.value ?? durations.value[0]) : undefined,
      referenceImage: referenceImage.value || undefined,
      // 原始尺寸单独带上：提交的图已缩放，卡片要按原比例渲染
      referenceWidth: referenceMeta.value?.originalWidth || undefined,
      referenceHeight: referenceMeta.value?.originalHeight || undefined,
    })
    tasks.value.unshift(task)
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
    const message = error instanceof Error ? error.message : String(error)
    message.error(`生成请求失败：${message}`)
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
     列表视图下卡片是「左图 / 右参数」两栏，190px 的图在 1200px 宽的卡里太瘦，
     拉到 240px 才撑得起左栏（参考图与结果图共用同一令牌，会同步放大）。 */
  --wg-thumb: 240px;
}

.wg-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* ---------- 顶部 ---------- */

.wg-head {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 14px;
  padding: 20px 24px 12px;
}

.wg-head-top {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wg-title {
  margin: 0;
  color: var(--color-text);
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}

.wg-total {
  color: var(--color-text-gray);
  font-size: 14px;
}

.wg-head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.wg-head-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

/*
 * 生成类型切换按钮。
 * 与 .wg-view 一样是 38px 高的方形工具按钮，但带文字（用户要一眼看出当前是图像还是视频），
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

.wg-search:focus-within {
  border-color: var(--color-primary);
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

.wg-views {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--color-input-border);
  border-radius: var(--r);
  background: var(--color-surface);
}

.wg-view {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--color-text-gray);
  cursor: pointer;
  transition: color 0.18s;
}

.wg-view.is-active,
.wg-view:hover {
  color: var(--color-primary);
}

.wg-view .wg-svg {
  width: 18px;
  height: 18px;
}

/* ---------- 下拉菜单 ---------- */

.wg-menu {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 420px;
  /*
    纵向才滚动，横向必须 hidden。
    用 overflow: auto 会变成**双向**：菜单里只要有比容器宽一点点的内容
    （典型是 el-slider 的 marks 标签——首尾标签各 translateX(-50%) 外探半个宽度），
    就会同时冒出横向与纵向两条滚动条，看起来像布局坏了。
    菜单项本来就应该在宽度内换行，横向滚动没有任何意义。
  */
  overflow-y: auto;
  overflow-x: hidden;
}

.wg-menu-title {
  margin: 6px 0 2px;
  padding: 0 8px;
  color: var(--color-text-gray);
  font-size: 12px;
}

.wg-menu-title:first-child {
  margin-top: 0;
}

.wg-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px;
  border: 0;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition: background 0.15s;
}

.wg-menu-item:hover {
  background: var(--color-surface-hover);
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
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wg-menu-desc {
  color: var(--color-text-gray);
  font-size: 12px;
}

.wg-menu-check {
  flex: 0 0 auto;
  width: 16px;
  height: 16px;
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

.wg-seg {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 4px 0;
}

.wg-seg-item {
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

.wg-style-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 4px 0;
}

.wg-style {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--color-surface-border);
  border-radius: var(--r-sm);
  background: var(--color-surface);
  cursor: pointer;
  transition: all 0.15s;
}

.wg-style:hover,
.wg-style.is-active {
  border-color: var(--color-primary);
}

.wg-style.is-active {
  background: var(--color-primary-50);
}

.wg-style-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  border-radius: var(--r-sm);
  background: var(--color-secondary-surface);
}

.wg-style-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wg-style-fallback {
  padding: 0 4px;
  color: var(--color-text-gray);
  font-size: 12px;
  text-align: center;
}

.wg-style-name {
  color: var(--color-text);
  font-size: 12px;
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
.wg-view:focus-visible,
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
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wg-card-head-right {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
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

.wg-card-body > .wg-card-chips {
  flex: 0 1 auto;
  max-width: 340px;
  margin-left: auto;
  /* 与媒体顶对齐；媒体比参数高时参数不居中，避免和图片抢视觉 */
  align-content: flex-start;
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

/* 媒体区 */
.wg-card-media {
  display: flex;
  align-items: center;
  gap: 16px;
  /* 与右栏参数竞争宽度时优先保住图片 */
  flex: 0 1 auto;
  min-width: 0;
}

.wg-ref-box {
  position: relative;
  flex: 0 0 auto;
  /* 与结果缩略图共用尺寸令牌，避免参考图比结果明显小一截 */
  width: var(--wg-thumb);
  margin: 0;
  overflow: hidden;
  border-radius: var(--size-dialog-rounded-radius);
  background: var(--color-secondary-surface);
}

/* 高度由内联 aspect-ratio（refRatioOf）决定，竖构图不会被压成方块 */
.wg-ref-box img {
  display: block;
  width: 100%;
  height: auto;
  object-fit: cover;
}

.wg-ref-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--el-color-black) 45%, transparent);
  color: var(--color-primary-text);
  font-size: 11px;
}

.wg-ref-kind {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: var(--r-pill);
  background: color-mix(in srgb, var(--el-color-white) 82%, transparent);
  color: var(--color-text);
  font-size: 11px;
}

.wg-arrow {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  color: var(--color-primary);
}

.wg-arrow .wg-svg {
  width: 26px;
  height: 26px;
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
 * 拼图主角：张数为 5 时第一张占 2×2 格，
 * 形成「左边一张大图 + 右侧 2×2」的排法。
 */
.wg-thumb.is-lead {
  grid-column: span 2;
  grid-row: span 2;
}

/*
 * 网格视图：一屏多图。
 * 之前 is-grid 只把缩略图改小、.wg-list 仍是单列 flex，
 * 于是「网格」模式渲染出来的还是一行一个全宽卡片，右侧照样空一大片 ——
 * 切换器名不副实。这里真正分列，列宽 360px 起。
 */
.wg-list.is-grid {
  --wg-thumb: 150px;
  display: grid;
  align-items: start;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
}

/* 每列只有 360px 左右，左右分栏放不下，参数回到媒体下方 */
.wg-list.is-grid .wg-card-body {
  flex-direction: column;
  gap: 12px;
}

.wg-list.is-grid .wg-card-body > .wg-card-chips {
  max-width: none;
  margin-left: 0;
}

/* 窄卡片里提示词会挤成两三行，钳到 2 行 */
.wg-list.is-grid .wg-card-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/*
 * 网格视图每列只有 411px，一行塞不下
 * 「状态 + 提示词 + 耗时 + 时间 + 再次生成 + 删除」——
 * 之前 flex 不换行，提示词被压成 0 宽（整条提示词消失），
 * 删除按钮还被挤出卡片右边界。改成两行：
 *   第一行：状态 …… 耗时 / 时间 / 再次生成 / 删除
 *   第二行：提示词（钳 2 行）
 */
.wg-list.is-grid .wg-card-head {
  flex-wrap: wrap;
  row-gap: 6px;
}

.wg-list.is-grid .wg-card-title {
  order: 3;
  flex: 1 0 100%;
  min-width: 0;
}

/* 窄卡片里「再次生成」只留图标，四个字要 90px */
.wg-list.is-grid .wg-act.is-primary {
  padding: 0 8px;
}

.wg-list.is-grid .wg-act.is-primary span {
  display: none;
}

/* 紧凑视图下参考图变小，两个标签会重叠，只保留「参考图」 */
.wg-list.is-grid .wg-ref-kind {
  display: none;
}

.wg-list.is-grid .wg-ref-tag {
  top: 4px;
  left: 4px;
  padding: 1px 6px;
  font-size: 10px;
}

.wg-list.is-grid .wg-arrow .wg-svg {
  width: 18px;
  height: 18px;
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
   宽度上限由模板内联 max-width 给（generatingMaxWidth，与 .wg-grid 同一套封顶公式），
   这里只管形状与配色；不限宽的话 flex:1 会把它拉满整行，叠加 aspect-ratio 就是整屏色块。 */
.wg-generating {
  display: flex;
  flex: 1;
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

.wg-stage {
  font-size: 12px;
}

.wg-stage-num {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

/* 已用时：进度长时间停在同一档时，这个每秒递增的秒数是「还活着」的唯一信号 */
.wg-stage-elapsed {
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  opacity: 0.85;
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
   几何（宽度上限）由模板内联 max-width 给，与 .wg-grid / .wg-generating 同一套封顶公式；
   这里只管形状与配色。用边框而不是投影承载边界，卡片基线不加装饰投影。
   底纹是极淡的斜向条纹，与参考图区的斜线朝向一致，视觉上属于同一族。 */
.wg-void {
  display: flex;
  /* 与 .wg-thumb 同宽，占位块才和真结果在同一列里视觉对齐；
     宽度上限仍由模板内联 max-width 给（多图 / 带参考图时封顶）。 */
  flex: 0 0 auto;
  width: var(--wg-thumb);
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
  margin: 80px 0 0;
  color: var(--color-text-gray);
  font-size: 14px;
  text-align: center;
}

/* 滚动分页尾部提示 */
.wg-more {
  margin: 16px 0 4px;
  color: var(--color-text-gray);
  font-size: 13px;
  text-align: center;
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
  padding: 12px 24px 20px;
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
  .wg-head {
    padding: 14px 14px 8px;
  }

  .wg-canvas {
    padding: 4px 14px 16px;
  }

  .wg-composer {
    padding: 10px 14px 16px;
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

  .wg-card-body > .wg-card-chips {
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
  .wg-view,
  .wg-menu-item,
  .wg-seg-item,
  .wg-ratio,
  .wg-style,
  .wg-card,
  .wg-act,
  .wg-retry,
  .wg-thumb-actions,
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
  .wg-head-actions,
  .wg-card-head,
  .wg-head-top {
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

<!--
  非 scoped：el-popover 的弹层被 teleport 到 body，scoped 选择器命中不到。
  统一 8px 圆角（同时覆盖 Element Plus 自己的圆角变量，避免两处不一致）。
-->
<style>
.wg-popper.el-popover.el-popper {
  /* 原值 8px → md 档 */
  --el-popover-border-radius: var(--el-radius-md, 8px);
  border-radius: var(--el-radius-md, 8px);
}
</style>
