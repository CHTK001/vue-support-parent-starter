<template>
  <div class="ws-root" :class="{ 'left-folded': leftCollapsed, 'right-folded': rightCollapsed }" data-page="world-sim">
    <!-- ============ 左侧：世界列表（可折叠） ============ -->
    <aside class="ws-list" :class="{ collapsed: leftCollapsed }">
      <div class="ws-list-head">
        <div class="ws-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="ws-search-ico">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
          </svg>
          <input v-model="worldKw" class="ws-search-input" type="text" placeholder="搜索世界" />
        </div>
        <button class="ws-add" type="button" title="创建一个新世界，其余交给 AI" @click="openCreateWorld">
          <el-icon><Plus /></el-icon>
        </button>
        <button class="ws-fold-btn" type="button" data-role="fold-left" title="收起世界列表" @click="leftCollapsed = true">
          <el-icon><Fold /></el-icon>
        </button>
      </div>

      <div class="ws-list-body">
        <div
          v-for="w in shownWorlds"
          :key="w.id"
          class="ws-conv"
          :class="{ active: w.id === currentWorldId }"
          @click="selectWorld(w)"
        >
          <CardAvatar :src="null" :name="w.name" size="lg" class="ws-conv-avatar" />
          <div class="ws-conv-main">
            <div class="ws-conv-row1">
              <span class="ws-conv-name">{{ w.name }}</span>
              <span v-if="w.weather" class="ws-conv-weather" :title="'天气：' + w.weather">{{ w.weather }}</span>
            </div>
            <div class="ws-conv-row2">
              <span class="ws-conv-preview">{{ w.era || '现代' }} · {{ w.sceneCount || 0 }} 场景 · {{ w.npcCount || 0 }} 角色</span>
              <span class="ws-conv-more" title="更多操作" @click.stop>
                <el-dropdown trigger="click" placement="bottom-end" @command="(c) => onWorldCmd(c, w)">
                  <el-icon><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="rename">编辑世界</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>删除世界</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </span>
            </div>
            <div class="ws-conv-row2">
              <span class="ws-conv-time">{{ w.timeLabel || '第 1 天' }}<template v-if="w.lastEventTitle"> · {{ w.lastEventTitle }}</template></span>
            </div>
          </div>
        </div>

        <div v-if="!shownWorlds.length" class="ws-list-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <p>{{ worlds.length ? '没有匹配的世界' : '还没有世界，点右上角 + 让 AI 造一个' }}</p>
        </div>
      </div>
    </aside>

    <!-- ============ 中间：台本 ============ -->
    <section class="ws-chat">
      <!-- 侧栏收起后留在舞台边缘的展开把手 -->
      <button v-show="leftCollapsed" class="ws-edge ws-edge-left" type="button" data-role="unfold-left"
        title="展开世界列表" @click="leftCollapsed = false">
        <el-icon><Expand /></el-icon>
      </button>
      <button v-show="rightCollapsed" class="ws-edge ws-edge-right" type="button" data-role="unfold-right"
        title="展开右侧栏" @click="rightCollapsed = false">
        <el-icon><Expand /></el-icon>
      </button>
      <template v-if="currentWorld">
        <!-- 台头：世界信息一层；幕次状态、进度、切场与幕次操作全收在第二层，
             舞台里不再重复「第 N 幕 / 共 M 幕 / AI 正在编写」，正文吃满高度 -->
        <header class="ws-chat-head">
          <div class="ws-head-top">
            <div class="ws-chat-title-wrap">
              <span class="ws-chat-name">{{ currentWorld.name }}</span>
              <el-tag size="small" effect="plain">{{ currentWorld.era || '现代' }}</el-tag>
              <span class="ws-chat-time">{{ currentWorld.timeLabel || '第 1 天 上午' }}</span>
              <span v-if="currentWorld.weather" class="ws-chat-weather">{{ currentWorld.weather }}</span>
            </div>
            <div class="ws-chat-head-actions">
              <button class="ws-auto" type="button" :class="{ on: autoWatch }" :title="autoWatch ? '停止自动观看' : '让世界自己演下去'"
                @click="toggleAutoWatch" data-role="auto-watch">
                <span class="ws-auto-dot"></span>
                {{ autoWatch ? '自动观看中' : '自动观看' }}
              </button>
              <button class="ws-auto" type="button" :class="{ on: autoEvolve }"
                :title="autoEvolve ? '停止自动演化' : '让 AI 自己往下演，你只管看'" @click="toggleAutoEvolve"
                data-role="auto-evolve">
                <span class="ws-auto-dot"></span>
                {{ autoEvolve ? '自演化中' : '自动演化' }}
              </button>
              <button class="ws-chat-adv" type="button" :disabled="advancing" title="推进时间，生成世界动态"
                @click="advance()">
                <el-icon v-if="!advancing"><VideoPlay /></el-icon>
                <span v-else class="ws-spin"><el-icon><Loading /></el-icon></span>
                <span class="ws-adv-text">推进时间</span>
              </button>
              <button class="ws-chat-set" type="button" title="世界设置" aria-label="世界设置" @click="openWorldEdit">
                <el-icon><MoreFilled /></el-icon>
              </button>
            </div>
          </div>

          <!-- 幕次状态条：只在幕次视图出现；对话视图保持原来的单行台头 -->
          <div v-if="currentAct" class="ws-head-status" data-role="act-status">
            <div class="ws-act-head-main">
              <span class="ws-act-head-no">第 {{ currentAct.actNo }} 幕</span>
              <h2 class="ws-act-head-title" :title="actTitleOf(currentAct)">{{ actTitleOf(currentAct) }}</h2>
              <span class="ws-tag" :class="actStageTone(actStage)">{{ actStageName(actStage) }}</span>
              <span class="ws-status-meter" :title="`进度 ${actProgress(currentAct)}%`">
                <i :style="{ width: actProgress(currentAct) + '%' }"></i>
              </span>
              <span class="ws-status-num">{{ actProgress(currentAct) }}%</span>
              <span class="ws-status-total">共 {{ acts.length }} 幕</span>
              <span v-if="actProcessing" class="ws-status-busy" data-role="act-busy" :title="actBusyText">
                <span class="ws-spin"><el-icon><Loading /></el-icon></span>{{ actBusyText }}
              </span>
            </div>

            <div class="ws-head-status-right">
              <!-- 切场：从舞台底部搬上来，一屏一场的导航不再占正文高度 -->
              <div v-if="storyScenes.length > 1" class="ws-status-pager" data-role="cue-nav">
                <button class="ws-cue-arrow" type="button" :disabled="cueIndex <= 0"
                  title="上一场（←）" @click="stepCue(-1)">‹</button>
                <span class="ws-pager-n">{{ cueIndex + 1 }} / {{ storyScenes.length }}</span>
                <button class="ws-cue-arrow" type="button" :disabled="cueIndex >= storyScenes.length - 1"
                  title="下一场（→）" @click="stepCue(1)">›</button>
              </div>
              <div class="ws-act-head-ops">
                <button class="btn ghost ws-act-back" type="button" data-role="back-to-conv"
                  title="退出幕次视图，回到可以观演、可以介入的对话视图"
                  @click="backToConversation">
                  回到对话
                </button>
                <button class="btn ghost" type="button" data-role="open-script" @click="openScript">
                  看剧本
                </button>
                <button v-for="btn in availablePipeline" :key="btn.label" class="btn ws-act-stage-btn"
                  :class="{ primary: btn.primary }"
                  type="button" :disabled="actProcessing" @click="actPipelineAction(btn)">
                  {{ btn.label }}
                </button>
              </div>
            </div>
          </div>
        </header>

        <!-- 幕次胶片条：横向，一眼看清演到第几幕 -->
        <div class="ws-reel">
          <div class="ws-reel-track">
            <button
              v-for="a in acts"
              :key="a.actNo"
              class="ws-frame"
              :class="{ active: currentAct?.actNo === a.actNo }"
              type="button"
              :data-actno="a.actNo"
              @click="selectAct(a)"
            >
              <span class="ws-frame-no">第 {{ a.actNo }} 幕</span>
              <span class="ws-frame-name" :title="actTitleOf(a)">{{ actTitleOf(a) }}</span>
              <span class="ws-frame-foot">
                <span class="ws-stage-dot" :class="actStageTone(a.stage)"></span>
                <span class="ws-frame-stage">{{ actStageName(a.stage) }}</span>
                <span class="ws-frame-progress">{{ actProgress(a) }}%</span>
              </span>
            </button>
            <button v-if="acts.length" class="ws-frame ws-frame-add" type="button" title="新建幕次" @click="openCreateAct">
              <el-icon><Plus /></el-icon>
            </button>
          </div>
          <div class="ws-reel-side">
            <span class="ws-reel-count">{{ acts.length ? `共 ${acts.length} 幕` : '还没有幕次' }}</span>
            <button v-if="acts.length" class="ws-act-create" type="button" @click="openCreateAct">
              <el-icon><Plus /></el-icon>
              <span>新建幕次</span>
            </button>
          </div>
        </div>

        <!-- 舞台：当前幕次的演出（正文只读）。幕次状态已上移到台头，这里只放画面 -->
        <div ref="msgBoxRef" class="ws-stage" :class="{ 'is-act': !!currentAct }">
          <template v-if="currentAct && actDetail">
            <!-- 演出正文（视频优先：分镜视频连播，没有视频才用文字演出） -->
            <div v-if="playVideos.length" class="ws-film" data-role="film">
              <div class="ws-film-stage">
                <video
                  :key="playVideos[filmIndex]?.src"
                  class="ws-film-video"
                  :src="videoSrc(playVideos[filmIndex]?.src)"
                  data-role="film-video"
                  :poster="imageSrc(playVideos[filmIndex]?.poster)"
                  autoplay
                  playsinline
                  controls
                  preload="metadata"
                  @ended="onFilmEnded"
                  @error="onFilmError"
                ></video>
                <div class="ws-film-badge">
                  {{ playVideos[filmIndex]?.stageName || '分镜' }} · 第 {{ filmIndex + 1 }} / {{ playVideos.length }} 段
                </div>
                <div v-if="currentShotBroken" class="ws-film-broken" data-role="film-broken">
                  这一段播不出来，已跳过
                </div>
              </div>
              <div class="ws-film-strip">
                <button
                  v-for="(v, i) in playVideos"
                  :key="v.src"
                  class="ws-film-thumb"
                  :class="{ active: i === filmIndex, broken: brokenShots.includes(i) }"
                  type="button"
                  :title="v.title"
                  :data-broken="brokenShots.includes(i) ? '1' : '0'"
                  @click="filmIndex = i"
                >
                  <span class="ws-film-thumb-no">{{ i + 1 }}</span>
                  <img v-if="v.poster" :src="imageSrc(v.poster)" :alt="v.title" />
                  <span v-else class="ws-film-thumb-name">{{ v.title }}</span>
                </button>
                <button class="ws-film-to-text" type="button" @click="showTextPlay = true">看文字演出</button>
              </div>
            </div>

            <!-- 演出正文：一屏一场，剧照铺满舞台，台词排成人物气泡 -->
            <article v-if="storyScenes.length && (!playVideos.length || showTextPlay)" class="ws-play" data-role="play">
              <section v-if="cueScene" :key="cueIndex" class="ws-cue" :data-cue="cueIndex">
                <img v-if="cueScene.image" class="ws-cue-img" :src="imageSrc(cueScene.image)" :alt="cueScene.title" draggable="false" />

                <header class="ws-cue-head">
                  <span class="ws-cue-no">{{ cueScene.no }}</span>
                  <span class="ws-cue-title">{{ cueScene.title }}</span>
                  <span v-if="cueScene.stageName && cueScene.stageName !== cueScene.title" class="ws-cue-where">{{ cueScene.stageName }}</span>
                  <span class="ws-cue-count">{{ cueIndex + 1 }} / {{ storyScenes.length }}</span>
                </header>

                <div class="ws-cue-cast" data-role="play-lines">
                  <div v-if="cueScene.cast && cueScene.cast !== '-'" class="ws-cue-in">在场：{{ cueScene.cast }}</div>
                  <div v-for="(l, li) in visibleLines(cueScene, cueIndex)" :key="li" class="ws-cue-line"
                    :class="li % 2 ? 'right' : 'left'">
                    <CardAvatar class="ws-cue-ava" :src="npcAvatar(cueSpeaker(l))" :name="cueSpeaker(l)" size="sm" />
                    <div class="ws-cue-bubble">
                      <span class="ws-cue-who">{{ cueSpeaker(l) }}</span>
                      <span class="ws-cue-say">{{ l.text }}</span>
                    </div>
                  </div>
                  <button v-if="cueScene.lines.length > CUE_LINE_LIMIT" class="ws-cue-more" type="button"
                    @click="toggleCue(cueIndex)">
                    {{ cueExpanded(cueIndex) ? '收起台词' : `还有 ${cueScene.lines.length - CUE_LINE_LIMIT} 句台词` }}
                  </button>
                </div>

                <footer v-if="cueScene.body" class="ws-cue-narr" :class="{ open: narrExpanded(cueIndex) }">
                  <span class="ws-cue-narr-k">旁白</span>
                  <span class="ws-cue-narr-t">{{ cueScene.body }}</span>
                  <button v-if="isLongNarr(cueScene.body)" class="ws-cue-narr-more" type="button"
                    @click="toggleNarr(cueIndex)">{{ narrExpanded(cueIndex) ? '收起' : '展开' }}</button>
                </footer>
              </section>
            </article>

            <!-- 还没演出：等 AI 写 -->
            <div v-if="!storyScenes.length" class="ws-stage-empty" data-role="stage-empty">
              <div class="ws-stage-empty-art">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16v12H4z" /><path d="M8 20h8M12 16v4" /><path d="m9 10 2 2 4-4" />
                </svg>
              </div>
              <p class="ws-stage-empty-title">{{ stageEmptyTitle }}</p>
              <p class="ws-stage-empty-sub">{{ stageEmptySub }}</p>
              <button v-if="stageEmptyAction" class="btn primary ws-act-stage-btn" type="button" :disabled="actProcessing"
                @click="actPipelineAction(stageEmptyAction)">{{ stageEmptyAction.label }}</button>
              <!-- 可直接跳去没演的那一幕：列表里堆着几幕空幕时，观众不该自己挨个点 -->
              <button v-if="unplayedAct" class="btn ghost ws-act-stage-btn" type="button"
                :data-role="'goto-' + unplayedAct.actNo" @click="selectAct(unplayedAct)">
                去看第 {{ unplayedAct.actNo }} 幕
              </button>
            </div>

            <!-- 剧本改为弹框查看：舞台不再内联展示接口原文 -->
          </template>

          <!-- 未选幕次：现场对话 -->
          <template v-else>
            <div class="ws-scene-bar">
              <div class="ws-scene-tabs">
                <button
                  v-for="s in scenes"
                  :key="s.id"
                  class="ws-scene-tab"
                  :class="{ active: currentSceneId === s.id }"
                  type="button"
                  :data-id="s.id"
                  @click="selectScene(s)"
                >{{ s.name }}</button>
                <button class="ws-scene-add" type="button" title="新建场景" @click="openCreateScene">
                  <el-icon><Plus /></el-icon>
                </button>
              </div>
              <div class="ws-scene-count">{{ sceneNpcs.length }} 位角色在场</div>
            </div>

            <div class="ws-msgs">
              <div
                v-for="m in messages"
                :key="m._key"
                class="ws-msg"
                :class="m.speakerType === 'system' ? 'is-narr' : (m.speakerType === 'user' ? 'is-self' : 'is-other')"
              >
                <template v-if="m.speakerType === 'system'">
                  <div class="ws-narr">{{ m.content }}</div>
                </template>
                <template v-else>
                  <CardAvatar
                    v-if="m.speakerType !== 'user'"
                    :src="avatarOf(m)"
                    :name="m.speakerName || 'AI'"
                    size="md"
                    class="ws-msg-avatar"
                  />
                  <div class="ws-msg-col">
                    <div v-if="m.speakerType !== 'user'" class="ws-msg-meta">
                      <span class="ws-msg-name">{{ m.speakerName }}</span>
                      <span v-if="m.streaming" class="ws-msg-typing">{{ m.speakerName || 'AI' }} 正在输入…</span>
                      <span v-if="m.modelName" class="ws-msg-model" :title="m.modelName">{{ displayModel(m.modelName) }}</span>
                    </div>
                    <div class="ws-bubble" :class="[m.speakerType === 'user' ? 'b-self' : 'b-other', { 'typing-bubble': m.streaming }]">
                      <MarkdownContent v-if="m.speakerType !== 'user'" class="markdown-text" :content="m.content" />
                      <span v-else class="ws-plain">{{ m.content }}</span>
                      <span v-if="m.streaming" class="typing-dots"><i></i><i></i><i></i></span>
                    </div>
                  </div>
                  <CardAvatar v-if="m.speakerType === 'user'" name="我" size="md" class="ws-msg-avatar" />
                </template>
              </div>

              <div v-if="!messages.length" class="ws-msgs-empty">
                <p>在【{{ currentScene?.name || '场景' }}】里还没开演</p>
                <p class="sub">点下方「观演一次」，让 AI 自己接下去；也可以先新建一幕，交给导演写整场戏</p>
                <button v-if="!acts.length" class="btn primary ws-empty-cta" type="button" @click="openCreateAct">
                  新建第一幕，让 AI 开演
                </button>
              </div>
            </div>
          </template>
        </div>

        <!-- 底部演员轨 + 脚灯条：幕次视图只读，对话视图只留「观演」，没有介入输入的输入框 -->
        <div class="ws-input" :class="{ 'is-act': !!currentAct }" data-role="cast-track">
          <div class="ws-track">
            <span class="ws-track-k">演员</span>
            <button v-for="n in trackNpcs" :key="'tk-' + n.id" class="ws-track-chip"
              :class="{ on: n.sceneId != null && n.sceneId === currentSceneId, off: n.isActive === false }"
              type="button" :data-track-npc="n.id"
              :title="(n.displayName || '角色') + ' · 微调人设与演员模型'"
              @click="openNpcEdit(n)">
              <CardAvatar :src="n.displayAvatar" :name="n.displayName || 'AI'" size="sm" />
              <span class="ws-track-name">{{ n.displayName }}</span>
              <span v-if="n.modelOverride" class="ws-track-model" :title="'演员模型：' + n.modelOverride">模型</span>
            </button>
            <span v-if="!trackNpcs.length" class="ws-track-empty">还没有角色。世界设置里可以让 AI 造几个。</span>
            <span class="ws-track-grow"></span>
          </div>
          <div class="ws-watch-bar">
            <span class="ws-watch-hint">{{ readingOnly ? '只读账号：' : '' }}你只能看。角色与关系可微调，剧情由 AI 推进。</span>
            <button v-if="!currentAct" class="btn primary" type="button" :disabled="spectating || !canSpectate"
              :title="canSpectate ? '让 AI 在这个场景继续演一段' : '先在场景页签里选一个场景'"
              @click="spectate">
              <el-icon v-if="!spectating"><VideoPlay /></el-icon>
              <span v-else class="ws-spin"><el-icon><Loading /></el-icon></span>
              观演一次
            </button>
          </div>
        </div>
      </template>

      <!-- 未选世界 -->
      <div v-else class="ws-chat-placeholder">
        <div class="ph-inner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
            stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <p>选择一个世界，或点左上角 + 让 AI 造一个</p>
        </div>
      </div>
    </section>

    <!-- ============ 右侧：人物 / 关系 / 编年 / 舞台（可折叠） ============ -->
    <aside class="ws-side" :class="{ collapsed: rightCollapsed }">
      <div class="ws-side-tabs">
        <button v-for="tab in sideTabs" :key="tab.key" type="button"
          :class="{ active: sideTab === tab.key }" @click="sideTab = tab.key">
          {{ tab.label }}
        </button>
        <button class="ws-side-fold" type="button" data-role="fold-right" title="收起右侧栏"
          @click="rightCollapsed = true">
          <el-icon><Fold /></el-icon>
        </button>
      </div>

      <!-- 人物：点开微调人设与关系 -->
      <div v-show="sideTab === 'cast'" class="ws-side-body">
        <div class="ws-side-hint">AI 造的角色。你可以调性格与关系，其余交给世界。</div>
        <div v-for="n in npcs" :key="n.id" class="cast-item" :data-npc="n.id" @click="openNpcEdit(n)">
          <CardAvatar :src="n.displayAvatar" :name="n.displayName || 'AI'" size="md" />
          <div class="cast-main">
            <div class="cast-name">
              {{ n.displayName }}
              <span v-if="n.isActive === false" class="ws-tag sm">挂起</span>
            </div>
            <div class="cast-sub">
              {{ sceneNameOf(n.sceneId) }}
              <span v-if="n.modelOverride" class="cast-model" :title="'演员模型：' + n.modelOverride">模型 {{ n.modelOverride }}</span>
            </div>
            <div class="cast-persona">{{ n.persona || n.sysPrompt || '（没有单独的性格设定）' }}</div>
          </div>
        </div>
        <div v-if="!npcs.length" class="ws-side-empty">还没有角色。AI 演出与「让 AI 造角色」会补上。</div>
      </div>

      <!-- 关系 -->
      <div v-show="sideTab === 'relations'" class="ws-side-body">
        <div class="ws-side-hint">关系程度（-100 ~ 100）。点一条可微调，世界会照着演。</div>
        <div v-if="!relationships.length" class="ws-side-empty">还没有关系。AI 互动或推进时间后自动生成。</div>
        <div v-for="r in relationships" :key="r.id" class="rel-item" @click="openRelEdit(r)">
          <CardAvatar :src="r.fromAvatar" :name="r.fromName || '?'" size="sm" class="rel-avatar" />
          <div class="rel-main">
            <div class="rel-names">
              <span class="rel-name">{{ r.fromName }}</span>
              <span class="rel-arrow">↔</span>
              <span class="rel-name">{{ r.toName }}</span>
              <span v-if="r.relationTag" class="ws-tag sm">{{ r.relationTag }}</span>
            </div>
            <div v-if="r.memo" class="rel-memo" :title="r.memo">{{ r.memo }}</div>
            <div class="rel-bar-wrap">
              <div class="rel-bar" :style="{ width: relPct(r.affinity) + '%' }" :class="relTone(r.affinity)"></div>
              <span class="rel-val">{{ r.affinity ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 编年（事件） -->
      <div v-show="sideTab === 'timeline'" class="ws-side-body">
        <div class="ws-side-hint">世界动态。推进时间与演出都会留下记录。</div>
        <div v-if="!events.length" class="ws-side-empty">还没有事件。点「推进时间」生成世界动态。</div>
        <div v-for="(ev, i) in events" :key="ev.id ?? i" class="tl-item">
          <div class="tl-head">
            <span class="tl-title">{{ ev.eventType === 'advance' ? '⏱' : '💬' }} {{ ev.title }}</span>
            <span class="tl-time">{{ fmtDay(ev.createTime) }}</span>
          </div>
          <div class="tl-content">{{ ev.content }}</div>
          <div v-if="eventNpcs(ev).length" class="tl-npcs">{{ eventNpcs(ev).join('、') }}</div>
        </div>
      </div>

      <!-- 舞台（场景布置） -->
      <div v-show="sideTab === 'stage'" class="ws-side-body">
        <div class="ws-mg-section" data-section="scene">
          <div class="ws-mg-head">
            <span class="ws-mg-title">场景（{{ scenes.length }}）</span>
            <button class="ws-mg-add" type="button" title="新建场景" @click="openCreateScene">+</button>
          </div>
          <div v-for="s in scenes" :key="s.id" class="ws-mg-scene">
            <span class="ws-mg-scene-name" @click="goScene(s)">{{ s.name }}</span>
            <span class="ws-mg-scene-count">{{ npcCountOf(s.id) }} 人</span>
            <button class="ws-mg-del" type="button" title="删除场景" @click="deleteScene(s)">✕</button>
          </div>
          <div v-if="!scenes.length" class="ws-side-empty">还没有场景</div>
        </div>

        <!-- 角色：AI 造的都在这里，可调参与/挂起，也能让 AI 再造几个 -->
        <div class="ws-mg-section" data-section="npc">
          <div class="ws-mg-head">
            <span class="ws-mg-title">角色（{{ npcs.length }}）</span>
            <button class="ws-mg-add" type="button" title="让 AI 造一个角色" data-action="ai-create-npc"
              @click="openCreateNpc">+</button>
          </div>
          <div v-for="n in npcs" :key="n.id" class="ws-mg-npc" @click="openNpcEdit(n)">
            <CardAvatar :src="n.displayAvatar" :name="n.displayName || 'AI'" size="sm" />
            <div class="ws-mg-npc-main">
              <div class="ws-mg-npc-name">{{ n.displayName }}</div>
              <div class="ws-mg-npc-sub">
                {{ sceneNameOf(n.sceneId) }}<template v-if="n.modelOverride"> · {{ n.modelOverride }}</template>
              </div>
            </div>
            <span class="el-switch ws-mg-npc-switch" @click.stop>
              <el-switch :model-value="n.isActive !== false" size="small"
                @update:model-value="(v: any) => toggleNpcActive(n, Boolean(v))" @click.stop />
            </span>
            <button class="ws-mg-del" type="button" title="移出世界" @click.stop="removeNpc(n)">✕</button>
          </div>
          <div v-if="!npcs.length" class="ws-side-empty">还没有角色。点 + 让 AI 造几个。</div>
        </div>
      </div>
    </aside>

    <!-- ============ 建世界对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="createVisible" width="460" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">让 AI 造一个世界</span></template>
      <div class="ws-form">
        <div class="ws-form-sec">世界观</div>
        <div class="ws-field">
          <label class="ws-label">世界名称</label>
          <el-input v-model="worldForm.name" placeholder="如：雾都侦探社（留空由 AI 取一个）" maxlength="30" />
          <span class="ws-hint">不填也可以，AI 会按种子起名</span>
        </div>
        <div class="ws-field">
          <label class="ws-label">时代背景</label>
          <div class="ws-eras">
            <div v-for="e in ERA_OPTIONS" :key="e" class="ws-era-tag"
              :class="{ active: worldForm.era === e }" @click="worldForm.era = e">{{ e }}</div>
          </div>
        </div>
        <div class="ws-field">
          <label class="ws-label">世界观种子</label>
          <div class="ws-seeds">
            <div v-for="s in WORLD_SEEDS" :key="s.label" class="ws-seed"
              :class="{ active: worldForm.description === s.desc }" @click="applySeed(s)">{{ s.label }}</div>
          </div>
          <el-input v-model="worldForm.description" type="textarea" :rows="2"
            placeholder="AI 会按这个描述生成世界，不写也不要紧" />
        </div>
        <div class="ws-form-sec">舞台出片</div>
        <div class="ws-field">
          <label class="ws-label">舞台出片</label>
           <ReRadioGroup v-model="mediaForm.mediaMode" data-role="media-mode-create">
            <ReRadioButton value="text">纯文字</ReRadioButton>
            <ReRadioButton value="image">场景图 + 文字</ReRadioButton>
            <ReRadioButton value="video">AI 生成视频</ReRadioButton>
          </ReRadioGroup>
          <span class="ws-hint">{{ MEDIA_MODE_HINT[mediaForm.mediaMode] }}</span>
        </div>
        <div class="ws-form-sec">导演与演员</div>
        <div class="ws-field">
          <label class="ws-label">导演模型</label>
          <el-select v-model="worldForm.directorModel" placeholder="留空使用全局默认模型" clearable filterable style="width: 100%">
            <el-option v-for="m in directorModels" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="ws-hint">世界的剧本导演用哪个模型写剧本；留空则沿用默认</span>
        </div>
        <div class="ws-field">
          <label class="ws-label">演员</label>
          <el-select v-model="actorRoleList" multiple filterable allow-create default-first-option
            placeholder="选择已有角色，或直接输入新名字；留空由 AI 安排" style="width: 100%">
            <el-option v-for="n in npcNameOptions" :key="n" :label="n" :value="n" />
          </el-select>
          <span class="ws-hint">编剧会优先在这些角色里排戏；留空则由 AI 按世界观安排</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="randomCreate">随机生成</el-button>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="confirmCreate">创建世界</el-button>
      </template>
    </ReDialog>

    <!-- ============ 编辑世界对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="editVisible" width="460" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">世界设置</span></template>
      <div class="ws-form">
        <div class="ws-form-sec">基础信息</div>
        <div class="ws-field">
          <label class="ws-label">世界名称</label>
          <el-input v-model="worldForm.name" maxlength="30" />
        </div>
        <div class="ws-field">
          <label class="ws-label">时代背景</label>
          <el-select v-model="worldForm.era" style="width: 100%">
            <el-option v-for="e in ERA_OPTIONS" :key="e" :label="e" :value="e" />
          </el-select>
        </div>
        <div class="ws-field">
          <label class="ws-label">当前天气</label>
          <el-select v-model="worldForm.weather" style="width: 100%">
            <el-option v-for="w in WEATHER_OPTIONS" :key="w" :label="w" :value="w" />
          </el-select>
        </div>
        <div class="ws-field">
          <label class="ws-label">世界观设定</label>
          <el-input v-model="worldForm.description" type="textarea" :rows="4" />
        </div>
        <div class="ws-form-sec">舞台出片</div>
        <div class="ws-field">
          <label class="ws-label">舞台出片（这个世界的每一幕）</label>
          <ReRadioGroup v-model="mediaForm.mediaMode" data-role="media-mode">
            <ReRadioButton value="text">纯文字演出</ReRadioButton>
            <ReRadioButton value="image">场景图 + 文字</ReRadioButton>
            <ReRadioButton value="video">AI 生成视频</ReRadioButton>
          </ReRadioGroup>
          <span class="ws-hint">{{ MEDIA_MODE_HINT[mediaForm.mediaMode] }}</span>
        </div>
        <div v-if="mediaForm.mediaMode === 'video'" class="ws-field">
          <label class="ws-label">视频模型</label>
          <el-select v-model="mediaForm.videoModel" clearable filterable allow-create
            style="width: 100%" placeholder="留空则由 AI 自动挑一个可用的视频模型">
            <el-option v-for="m in mediaForm.videoModels" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="ws-hint">选哪个模型，决定了是文生视频还是图生视频；未配置时按场景图自动走图生视频。</span>
        </div>
        <div v-if="mediaForm.mediaMode === 'image'" class="ws-field">
          <label class="ws-label">生图模型</label>
          <el-select v-model="mediaForm.imageModel" clearable filterable allow-create
            style="width: 100%" placeholder="留空则由 AI 自动挑一个可用的生图模型">
            <el-option v-for="m in mediaForm.imageModels" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="ws-hint">场景图由这个模型画；与导演模型的文本生成分开配置，留空自动挑一个可用的生图模型。</span>
        </div>
        <div class="ws-form-sec">导演与演员</div>
        <div class="ws-field">
          <label class="ws-label">导演模型</label>
          <el-select v-model="worldForm.directorModel" placeholder="留空使用全局默认模型" clearable filterable style="width: 100%">
            <el-option v-for="m in directorModels" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="ws-hint">世界的剧本导演用哪个模型写剧本；留空则沿用默认</span>
        </div>
        <div class="ws-field">
          <label class="ws-label">演员</label>
          <el-select v-model="actorRoleList" multiple filterable allow-create default-first-option
            placeholder="选择已有角色，或直接输入新名字；留空由 AI 安排" style="width: 100%">
            <el-option v-for="n in npcNameOptions" :key="n" :label="n" :value="n" />
          </el-select>
          <span class="ws-hint">编剧会优先在这些角色里排戏；留空则由 AI 按世界观安排</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingWorld" @click="confirmEdit">保存</el-button>
      </template>
    </ReDialog>

    <!-- ============ 新建场景对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="sceneCreateVisible" width="440" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">新建场景</span></template>
      <div class="ws-form">
        <div class="ws-field">
          <label class="ws-label">场景名称 *</label>
          <el-input v-model="sceneForm.name" placeholder="如：街角咖啡厅、码头仓库" maxlength="30" />
        </div>
        <div class="ws-field">
          <label class="ws-label">场景描述</label>
          <el-input v-model="sceneForm.description" type="textarea" :rows="3"
            placeholder="这里的环境、氛围、可能发生的事…" />
        </div>
      </div>
      <template #footer>
        <el-button @click="sceneCreateVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateScene">创建场景</el-button>
      </template>
    </ReDialog>

    <!-- ============ 让 AI 造角色 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="npcCreateVisible" width="460" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">让 AI 造几个角色</span></template>
      <div class="ws-form">
        <div class="ws-field">
          <label class="ws-label">数量</label>
          <ReRadioGroup v-model="npcCreateForm.count">
            <ReRadioButton :value="1">1 个</ReRadioButton>
            <ReRadioButton :value="2">2 个</ReRadioButton>
            <ReRadioButton :value="3">3 个</ReRadioButton>
          </ReRadioGroup>
        </div>
        <div class="ws-field">
          <label class="ws-label">倾向（可留空）</label>
          <el-input v-model="npcCreateForm.hint" type="textarea" :rows="3"
            placeholder="如：一个与主角有旧怨的商人；或「随便，符合这个时代」" />
          <span class="ws-hint">AI 会自动起名、写性格、布置到场景，并补上与现有角色的关系</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="npcCreateVisible = false">取消</el-button>
        <el-button type="primary" :loading="npcCreating" @click="confirmCreateNpc">让 AI 造</el-button>
      </template>
    </ReDialog>

    <!-- ============ 微调角色对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="npcEditVisible" width="720" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">微调「{{ npcEditTarget?.displayName }}」</span></template>
      <div v-if="npcEditTarget" class="ws-form ws-form-split">
        <!-- 左栏：基本信息 -->
        <div class="ws-col">
          <div class="ws-col-head">基本信息</div>
          <div class="ws-field">
            <label class="ws-label">世界内昵称</label>
            <el-input v-model="npcEditForm.nickname" placeholder="留空使用角色名" maxlength="20" />
          </div>
          <div class="ws-field">
            <label class="ws-label">所在场景</label>
            <el-select v-model="npcEditForm.sceneId" placeholder="未布置" clearable style="width: 100%">
              <el-option v-for="s in scenes" :key="s.id" :label="s.name" :value="s.id" />
            </el-select>
          </div>
          <div class="ws-field">
            <label class="ws-label">参与演出</label>
            <el-switch v-model="npcEditForm.isActive" active-text="参与" inactive-text="挂起" />
            <span class="ws-hint">挂起的角色不会自动开口</span>
          </div>
          <div class="ws-field">
            <label class="ws-label">演员模型</label>
            <el-select v-model="npcEditForm.modelOverride" placeholder="留空沿用世界默认模型" clearable filterable style="width: 100%">
              <el-option v-for="m in directorModels" :key="m" :label="m" :value="m" />
            </el-select>
            <span class="ws-hint">这个角色用什么模型开口；不选则沿用世界当前导演模型</span>
          </div>
        </div>
        <!-- 右栏：性格与关系 -->
        <div class="ws-col">
          <div class="ws-col-head">性格与关系</div>
          <div class="ws-field">
            <label class="ws-label">性格 / 人设（prompt）</label>
            <el-input v-model="npcEditForm.persona" type="textarea" :rows="7"
              placeholder="在这个世界里的背景与性格，会盖过角色的系统提示词" />
          </div>
          <div class="ws-field">
            <label class="ws-label">与 {{ npcEditTarget.displayName }} 的关系</label>
            <div v-if="!npcRelations.length" class="ws-hint">还没有录入关系，AI 演过几轮后会自动生成。</div>
            <div v-for="r in npcRelations" :key="r.id" class="npc-rel">
              <span class="npc-rel-name">{{ otherName(r) }}</span>
              <el-slider v-model="relDraft[r.id]" :min="-100" :max="100" :step="5" size="small" class="npc-rel-slider" />
              <span class="npc-rel-val">{{ relDraft[r.id] }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="npcEditVisible = false">关闭</el-button>
        <el-button type="primary" :loading="npcSaving" @click="confirmEditNpc">保存</el-button>
      </template>
    </ReDialog>

    <!-- ============ 编辑关系对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="relEditVisible" width="420" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">关系程度</span></template>
      <div v-if="relEditTarget" class="ws-form">
        <div class="ws-field">
          <label class="ws-label">{{ relEditTarget.fromName }} ↔ {{ relEditTarget.toName }}</label>
          <el-slider v-model="relEditForm.affinity" :min="-100" :max="100" :step="5" show-input />
        </div>
        <div class="ws-field">
          <label class="ws-label">关系标签</label>
          <el-select v-model="relEditForm.relationTag" placeholder="选择或输入" filterable allow-create clearable style="width: 100%">
            <el-option v-for="tag in REL_TAGS" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </div>
        <div class="ws-field">
          <label class="ws-label">备注</label>
          <el-input v-model="relEditForm.memo" type="textarea" :rows="2" placeholder="这段关系的故事…" />
        </div>
      </div>
      <template #footer>
        <el-button @click="relEditVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEditRel">保存</el-button>
      </template>
    </ReDialog>

    <!-- ============ 看剧本：结构化弹框，舞台和内联区都不再直接摊接口原文 ============ -->
    <ReDialog v-model="showScript" width="760" append-to-body class="ws-dialog ws-script-dialog">
      <template #header>
        <span class="ws-dlg-title">第 {{ currentAct?.actNo }} 幕剧本 · {{ actTitleOf(currentAct) }}</span>
      </template>

      <div v-if="scriptView" class="ws-script-view" data-role="script-view">
        <div class="ws-script-ov">
          <h3 class="ws-script-title">{{ scriptView.title }}</h3>
          <p v-if="scriptView.description" class="ws-script-desc">{{ scriptView.description }}</p>
          <div v-if="scriptView.meta" class="ws-script-meta">{{ scriptView.meta }}</div>
        </div>

        <section v-for="(s, i) in scriptView.scenes" :key="'sc-' + i" class="ws-script-scene">
          <header class="ws-script-scene-head">
            <span class="ws-script-scene-no">第 {{ i + 1 }} 场</span>
            <h4 class="ws-script-scene-name">{{ s.name }}</h4>
            <span v-if="s.where && s.where !== s.name" class="ws-script-where">{{ s.where }}</span>
          </header>
          <p v-if="s.desc" class="ws-script-scene-desc">{{ s.desc }}</p>
          <div v-if="s.cast" class="ws-script-cast">在场：{{ s.cast }}</div>
          <div v-for="(l, li) in s.lines" :key="'ln-' + li" class="ws-script-line">
            <span class="ws-script-who">{{ l.speaker }}</span>
            <span class="ws-script-say">{{ l.text }}</span>
          </div>
        </section>

        <section v-if="scriptView.transitions.length" class="ws-script-block">
          <h4 class="ws-script-block-title">过场</h4>
          <p v-for="(t, i) in scriptView.transitions" :key="'tr-' + i" class="ws-script-trans">{{ t }}</p>
        </section>

        <section v-if="scriptView.props.length" class="ws-script-block">
          <h4 class="ws-script-block-title">道具</h4>
          <div class="ws-script-props">
            <span v-for="(p, i) in scriptView.props" :key="'pp-' + i" class="ws-script-prop">{{ p }}</span>
          </div>
        </section>
      </div>

      <div v-else-if="scriptFallback" class="ws-script-view">
        <MarkdownContent :content="scriptFallback" />
      </div>

      <div v-else class="ws-script-empty" data-role="script-empty">
        <p>这一幕还没有剧本。</p>
        <p class="sub">让 AI 按当前世界写这一幕，写完会自动进素材与演出。</p>
        <el-button type="primary" :loading="actProcessing" @click="generateScript">让 AI 写这一幕</el-button>
      </div>

      <template #footer>
        <el-button @click="showScript = false">关闭</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { MoreFilled, Plus, VideoPlay, Loading, Fold, Expand } from '@element-plus/icons-vue'
import MarkdownContent from '@/components/ui/MarkdownContent.vue'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import ReDialog from '@repo/ui/re-dialog'
import { message } from '@repo/core'
import { apiService } from '@/services/ApiService'
import { useAuthStore } from '@/stores/auth'
import { createAuthImageLoader } from '@/utils/authImage'
import { isInlineMedia } from '@/services/modules/generate.api'
import type {
  WorldAct,
  WorldActDetail,
  WorldActListRow,
  WorldActAdvance,
  WorldItem,
  WorldScene,
  WorldNpc,
  WorldRelationship,
  WorldEvent,
  WorldMessage,
  WorldStory,
} from '@/services/modules/world-sim.api'
import { ReRadioGroup, ReRadioButton } from "@repo/ui/re-kit";

const ERA_OPTIONS = ['现代', '古代', '未来', '奇幻', '武侠', '赛博朋克', '末日', '蒸汽朋克']
/** 每个时代对应的前缀名，用户不留名时自动组成世界名称 */
//
// 标成 Record<string, string>：`era` 来自表单字符串，直接索引字面量对象会被
// TS 判「隐式 any 索引」。语义上这里就是一张「时代 → 前缀」的字典。
const ERA_PREFIX: Record<string, string> = {
  '现代': '都市',
  '古代': '王朝',
  '未来': '星际',
  '奇幻': '魔法',
  '武侠': '江湖',
  '赛博朋克': '夜城',
  '末日': '废土',
  '蒸汽朋克': '蒸汽',
}
/** 世界种子：以一个关键词 + 简短描述，帮不想写设定的用户一键生成初始状态 */
const WORLD_SEEDS = [
  { label: '都市日常', desc: '现代都市背景，朋友间的日常聚会，轻松的办公室生活' },
  { label: '修仙世界', desc: '玄幻修仙大陆，境界分明，主角需要修炼突破' },
  { label: '星际科幻', desc: '未来星际文明，飞船与 AI 共存，核心矛盾是资源争夺' },
  { label: '魔法学院', desc: '西幻魔法世界，年轻人在魔法学院中修炼与成长' },
  { label: '江湖侠客', desc: '武侠江湖世界，门派纷争，爱恨情仇' },
  { label: '废土求生', desc: '末日废土世界，幸存者在废墟中挣扎求存' },
]
const WEATHER_OPTIONS = ['晴', '多云', '阴', '雨', '雪', '风', '雷暴', '雾']
const REL_TAGS = ['好友', '挚友', '恋人', '家人', '同事', '宿敌', '敌人', '陌生人', '崇拜', '依赖']

/** 三种舞台形态互斥，选中哪个就只产出哪种；文案随选中项切换，避免用户误以为会同时出图 */
const MEDIA_MODE_HINT: Record<string, string> = {
  text: '只出文字演出：AI 写剧本直接上演，不生成图片和视频，出幕最快',
  image: '每个场景生成一张 AI 图，直接铺满舞台当背景，台词浮在画面上',
  video: '按分镜逐段生成后连播；图生视频指 AI 先画好场景图，再让图动起来',
}

/** 幕次阶段展示名（与后端 ACT_STATUS_ 常量对齐） */
const ACT_STAGE_NAME: Record<string, string> = {
  writing: '编剧中',
  props_ok: '素材就绪',
  playing: '出演中',
  replay: '可重播',
  finished: '已完结',
  aborted: '已废弃',
}

/** 幕次阶段标签色 */
const ACT_STAGE_TONE: Record<string, string> = {
  writing: 'info',
  props_ok: 'warning',
  playing: 'success',
  replay: 'primary',
  finished: 'success',
  aborted: 'danger',
}

/** 自动观看的间隔（毫秒）：一轮演出结束后停一会儿再演下一拍 */
const AUTO_WATCH_INTERVAL = 6000

interface UIMessage {
  _key: number
  speakerType: 'user' | 'ai' | 'system'
  speakerId?: string
  speakerName?: string
  content: string
  modelName?: string
  streaming?: boolean
}

/* ---------------- 状态 ---------------- */
const auth = useAuthStore()
const worlds = ref<WorldItem[]>([])
const currentWorldId = ref<number | null>(null)
const currentWorld = ref<WorldItem | null>(null)
const scenes = ref<WorldScene[]>([])
const npcs = ref<WorldNpc[]>([])
const relationships = ref<WorldRelationship[]>([])
const events = ref<WorldEvent[]>([])
const acts = ref<WorldActListRow[]>([])
const currentAct = ref<WorldActListRow | null>(null)
/** 自动接续出来的新幕编号：列表刷新后自动跳过去 */
const pendingActNo = ref<number | null>(null)
/** 正在重播：这段时间里舞台短暂没有正文，空态别报成「演出正文没读到」 */
const awaitingPlay = ref(false)
const actDetail = ref<WorldActDetail | null>(null)
const stories = ref<WorldStory[]>([])
const showScript = ref(false)
const actProcessing = ref(false)
const actBusyText = ref('AI 正在处理这一幕…')
const currentSceneId = ref<number | null>(null)
const messages = ref<UIMessage[]>([])
const advancing = ref(false)
const spectating = ref(false)
const autoWatch = ref(false)
const worldKw = ref('')
const sideTab = ref<'cast' | 'relations' | 'timeline' | 'stage'>('cast')
/** 左右两栏折叠：把整块宽度让给舞台；折叠后舞台边缘留一个展开把手 */
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)

const createVisible = ref(false)
const editVisible = ref(false)
const creating = ref(false)
const sceneCreateVisible = ref(false)
const npcCreateVisible = ref(false)
const npcCreating = ref(false)
const npcEditVisible = ref(false)
const npcSaving = ref(false)
const relEditVisible = ref(false)
const relDraft = reactive<Record<number, number>>({})

const worldForm = reactive({
  name: '',
  era: '现代',
  weather: '晴',
  description: '',
  directorModel: '',
  actorRoles: '',
})

/**
 * 演员多选的读写桥：表单里存「一行一个」的纯文本（与后端 actor_roles 一致），
 * 界面上是可选已有 NPC、也可手输新名字的多选框。
 */
const actorRoleList = computed<string[]>({
  get: () => worldForm.actorRoles
    .split(/[\n,，、]+/)
    .map((s) => s.trim())
    .filter(Boolean),
  set: (v: string[]) => {
    worldForm.actorRoles = (v || []).map((s) => String(s).trim()).filter(Boolean).join('\n')
  },
})

/** 演员下拉的候选：当前世界已登场的角色名 */
const npcNameOptions = computed<string[]>(() => {
  const names = npcs.value.map((n) => n.displayName).filter(Boolean) as string[]
  return [...new Set(names)]
})
const sceneForm = reactive({ name: '', description: '' })

/**
 * 舞台出片方式（sim 分组设置，全站共用），三种形态互斥：
 * - mediaMode = text：只出文字演出，整幕不建任何生成任务（最快，也不产生出图费用）；
 * - mediaMode = image：只出场景图，舞台用图文演出；
 * - mediaMode = video：素材阶段让 AI 出视频，舞台按分镜连播。
 * videoModel / imageModel 留空时由后端自动挑一个可用的对应类型模型；
 * 生图模型（imageModel）与文本侧模型分开配置，避免出图时借用导演/演员的对话模型。
 */
const mediaForm = reactive<{
  mediaMode: 'text' | 'video' | 'image'; videoModel: string; imageModel: string; videoModels: string[]; imageModels: string[]
}>({
  mediaMode: 'video',
  videoModel: '',
  imageModel: '',
  videoModels: [],
  imageModels: [],
})
/** 导演/演员模型候选项（来自文本模型列表，供世界设置与 NPC 微调的下拉用） */
const directorModels = ref<string[]>([])
const savingWorld = ref(false)
const npcCreateForm = reactive<{ count: number; hint: string }>({ count: 2, hint: '' })
const npcEditTarget = ref<WorldNpc | null>(null)
const npcEditForm = reactive<{
  nickname: string; persona: string; sceneId: number | null; isActive: boolean; modelOverride: string;
}>({ nickname: '', persona: '', sceneId: null, isActive: true, modelOverride: '' })
const relEditTarget = ref<WorldRelationship | null>(null)
const relEditForm = reactive<{ affinity: number; relationTag: string; memo: string }>({
  affinity: 0, relationTag: '', memo: '',
})

const msgBoxRef = ref<HTMLElement | null>(null)
let keySeq = 1
let streamHandle: { close: () => void } | null = null
let autoTimer: number | null = null

const sideTabs: { key: 'cast' | 'relations' | 'timeline' | 'stage'; label: string }[] = [
  { key: 'cast', label: '人物' },
  { key: 'relations', label: '关系' },
  { key: 'timeline', label: '编年' },
  { key: 'stage', label: '舞台' },
]

/** 只读账号：后端一律拒绝写操作，前端据此收起所有「造」的入口，只留观看与微调 */
const readingOnly = computed(() => Boolean((auth.user as any)?.readonly))

/* ---------------- 计算 ---------------- */
const shownWorlds = computed(() => {
  const kw = worldKw.value.trim()
  if (!kw) return worlds.value
  return worlds.value.filter((w) => (w.name || '').includes(kw))
})

const currentScene = computed(() => scenes.value.find((s) => s.id === currentSceneId.value) || null)

/*
 * 素材（场景图 / 分镜视频）取字节。
 *
 * 生成侧落盘的结果会换成 `/v2/ai/generate/tasks/{id}/media/0`，而这个接口要鉴权，
 * `<img>` / `<video>` 带不了请求头 —— 直接把地址挂上去就是 404（实测：页面里
 * src 有值、naturalWidth=0，后端直连却是 200 / 1.5MB）。
 * 所以内联地址一律走 blob 加载器，令牌不进 URL；供应商直链不需要鉴权，原样给。
 */
const mediaImages = createAuthImageLoader({ withBaseUrl: false })

/** 图片地址 → 可直接放 img.src 的地址 */
const imageSrc = (url: string | null | undefined): string =>
  isInlineMedia(url) ? mediaImages.resolve(url) : (url ?? '')

/**
 * 视频地址 → 可直接放 video.src 的地址。
 *
 * 加载器未就绪时返回的是 1×1 GIF，对 `<video>` 是非法媒体源（会误触一次 error、
 * 把好端端的分镜判成「播不出来」），因此未就绪时给空串，等 blob 就绪再挂。
 */
const videoSrc = (url: string | null | undefined): string =>
  isInlineMedia(url) && !mediaImages.isReady(url) ? '' : imageSrc(url)

const sceneNpcs = computed(() => {
  if (currentSceneId.value == null) return npcs.value.filter((n) => n.sceneId == null)
  return npcs.value.filter((n) => n.sceneId === currentSceneId.value)
})

/** 底部演员轨：在场角色排前面，其余按原顺序；点一下就进微调 */
const trackNpcs = computed(() => {
  const here = new Set(sceneNpcs.value.map((n) => n.id))
  return [...npcs.value].sort((a, b) => Number(here.has(b.id)) - Number(here.has(a.id)))
})

/** 对话视图（没在挑某一幕）才允许观演：幕次视图的正文是只读的演出稿 */
const canSpectate = computed(() => Boolean(currentWorldId.value) && !currentAct.value && currentSceneId.value != null)

/** 当前幕次的演出正文，按「首行标题 + 其余正文」拆好给模板用 */
const storyScenes = computed(() => {  const cur = stories.value.find((s) => s.actNo === currentAct.value?.actNo)
  if (!cur || !cur.played || !cur.scenes?.length) return []
  const cn = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
  return cur.scenes
    .filter((s) => (s.playText || '').trim())
    .map((s, i) => {
      const raw = (s.playText || '').trim()
      const nl = raw.indexOf('\n')
      const head = nl >= 0 ? raw.slice(0, nl).trim() : ''
      // 演出的正文首行是「序 · 场景名」，拆出来当小标题；没有首行就退回剧本里的场景名
      const title = head || s.name || `分场 ${i + 1}`
      const body = nl >= 0 ? raw.slice(nl + 1).trim() : raw
      return {
        no: cn[i] ?? String(i + 1),
        title,
        body,
        // 台词单独排版：旁白之后再逐句列出「说话人：内容」，这是演出正文里观众最看的部分
        lines: Array.isArray(s.lines) ? s.lines.filter((l) => (l.text || '').trim()) : [],
        cast: s.cast || '',
        stageName: s.stageName || '',
        image: s.mediaImage?.url || '',
      }
    })
})

/* ---- 舞台：一屏只放一场 ---- */

/** 当前摆在这一屏上的场次（0 基）；切幕 / 重播会归零，增量演出时跟着最新一场走 */
const cueIndex = ref(0)

/** 一屏最多先摆几句台词，多的收进「还有 N 句」 */
const CUE_LINE_LIMIT = 3

/** 已展开台词的场次下标 */
const cueOpen = ref<number[]>([])

/** 已展开旁白的场次下标（与台词分开，展开台词不该顺手把旁白也摊开） */
const narrOpen = ref<number[]>([])

/** 舞台上真正渲染的那一场 */
const cueScene = computed(() => storyScenes.value[cueIndex.value] || storyScenes.value[0] || null)

function cueExpanded(i: number) {
  return cueOpen.value.includes(i)
}

function narrExpanded(i: number) {
  return narrOpen.value.includes(i)
}

function toggleCue(i: number) {
  cueOpen.value = cueExpanded(i)
    ? cueOpen.value.filter((x) => x !== i)
    : [...cueOpen.value, i]
}

function toggleNarr(i: number) {
  narrOpen.value = narrExpanded(i)
    ? narrOpen.value.filter((x) => x !== i)
    : [...narrOpen.value, i]
}

function visibleLines(s: { lines?: Array<{ speaker?: string; text?: string }> }, i: number) {
  const lines = s.lines || []
  return cueExpanded(i) ? lines : lines.slice(0, CUE_LINE_LIMIT)
}

/** 旁白超过两行才给展开按钮，短旁白不占按钮（两行约 60 字，宁可早给也别把字藏掉） */
function isLongNarr(text: string) {
  return String(text || '').length > 60
}

/**
 * 台词的显示名：优先用剧本里的 speaker。
 *
 * <p>部分真实模型会把说话人塞进 text 开头写成「刘备：……」而把 speaker 留空，
 * 这时舞台上的姓名字牌会是空白（实测 Agnes）。从 text 前缀（中文/英文冒号，
 * 名字不超过 12 字）兜底取一次，取不到才显示「AI」。</p>
 */
function cueSpeaker(l: { speaker?: string; text?: string }) {
  const name = String(l?.speaker || '').trim()
  if (name) return name
  const m = String(l?.text || '').match(/^\s*([^：:]{1,12})[：:]/)
  return m ? m[1].trim() : 'AI'
}

/**
 * 台词说话人 → 角色头像。
 *
 * <p>台词里的 speaker 是 AI 写出来的名字，可能带称谓（如「沈砚」对「沈砚大人」），
 * 先精确匹配，再退化到包含匹配；都对不上就交给 CardAvatar 用姓氏字牌兜底。</p>
 */
function npcAvatar(speaker?: string) {
  const name = String(speaker || '').trim()
  if (!name) return null
  const exact = npcs.value.find((n) => String(n.displayName || '').trim() === name)
  if (exact) return exact.displayAvatar || null
  const loose = npcs.value.find((n) => {
    const dn = String(n.displayName || '').trim()
    return dn && (name.includes(dn) || dn.includes(name))
  })
  return loose?.displayAvatar || null
}

function gotoCue(i: number) {
  const n = storyScenes.value.length
  if (!n) return
  cueIndex.value = Math.min(Math.max(i, 0), n - 1)
}

function stepCue(delta: number) {
  gotoCue(cueIndex.value + delta)
}

// 切幕归零；演出进行中每多演一场就跟到最新一场，观众不用自己点
watch(
  () => currentAct.value?.actNo,
  () => {
    cueIndex.value = 0
    cueOpen.value = []
    narrOpen.value = []
  },
)

watch(
  () => storyScenes.value.length,
  (n, old) => {
    if (!n) { cueIndex.value = 0; return }
    if (n > (old || 0) && actProcessing.value) cueIndex.value = n - 1
    else if (cueIndex.value >= n) cueIndex.value = n - 1
  },
)

/** 舞台上的分镜视频：这一幕每个场景生成成功的视频按顺序连播 */
interface FilmShot {
  src: string
  poster: string
  title: string
  stageName: string
}

/** 当前播放第几段（一幕有多段视频时按序播，播完自动接下一段） */
const filmIndex = ref(0)

/** 有视频时是否同时展开文字演出（默认收起，视频就是主画面） */
const showTextPlay = ref(false)

const playVideos = computed<FilmShot[]>(() => {
  const cur = stories.value.find((s) => s.actNo === currentAct.value?.actNo)
  if (!cur || !cur.scenes?.length) return []
  const shots: FilmShot[] = []
  for (const s of cur.scenes as Array<Record<string, any>>) {
    let src = ''
    // 视频生成侧两种返回都可能：直接给地址，或给了任务句柄 media:xxx（由站点转成可播地址）
    const v = s.mediaVideo
    if (v && typeof v === 'object' && String(v.status) === 'OK' && v.url) {
      src = String(v.url)
    }
    if (!src) continue
    const cn = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']
    const idx = shots.length
    shots.push({
      src,
      // 首帧用同场景的图，缩略条没图时退化成场次名
      poster: String(s.mediaImage?.url || ''),
      title: String(s.name || `分镜 ${idx + 1}`),
      stageName: String(s.name || cn[idx] || `第 ${idx + 1} 场`),
    })
  }
  return shots
})

/** 一段播完自动接下一段，形成连续播放；播到末段停在末段（不循环，观众可拖回去看） */
function onFilmEnded() {
  if (filmIndex.value < playVideos.value.length - 1) {
    filmIndex.value += 1
  }
}

/** 哪些分镜播不出来（地址 404 / 编码不认识 / 浏览器不支持） */
const brokenShots = ref<number[]>([])

/**
 * 某一段播不出来：记下来并从连播里跳过。
 *
 * <p>视频地址是生成任务给的，随时可能过期或压根没落地；
 * 不处理的话舞台会一直停在一帧黑屏上，比退回文字演出更糟。</p>
 */
function onFilmError() {
  const idx = filmIndex.value
  if (!brokenShots.value.includes(idx)) {
    brokenShots.value = [...brokenShots.value, idx]
  }
  const next = playVideos.value.findIndex((_, i) => !brokenShots.value.includes(i))
  if (next >= 0 && next !== idx) {
    filmIndex.value = next
  } else if (playVideos.value.every((_, i) => brokenShots.value.includes(i))) {
    // 全段都坏：直接给出演正文，别让观众对着黑屏
    showTextPlay.value = true
  }
}

/** 当前这段是否已确认播不出来（用于在播放器上给出提示） */
const currentShotBroken = computed(() => brokenShots.value.includes(filmIndex.value))

// 切幕 / 视频集合变了都要从头播，否则会停在上一次的末段位置
watch(
  () => [currentAct.value?.actNo, playVideos.value.map((v) => v.src).join('|')],
  () => {
    filmIndex.value = 0
    brokenShots.value = []
    showTextPlay.value = false
  },
)

/** 舞台空态文案随阶段变化 */
const stageEmptyTitle = computed(() => {  const stage = actStage.value ?? ''
  if (awaitingPlay.value) return '正在重播'
  if (stage === 'writing') return '这一幕还没有剧本'
  if (stage === 'props_ok') return '剧本写好了，还没有演出'
  if (stage === 'playing') return 'AI 正在演这一幕'
  return '还没有演出记录'
})

const stageEmptySub = computed(() => {
  const stage = actStage.value ?? ''
  if (awaitingPlay.value) return 'AI 正在把这一幕从头演一遍…'
  if (stage === 'writing') return '点「生成剧本」，AI 会按世界现状写这一幕'
  if (stage === 'props_ok') return '点「演出」，AI 会把剧本演成正文'
  if (stage === 'playing') return '演出完成后会出现在这里'
  // 幕次行是 replay，但演出正文读不出来：要演的是这一幕，不是后面某幕
  if (actDetail.value?.act?.stage === 'replay') return '这一幕的演出正文没读到，点「演出」重新演一次'
  return '这一幕已经演过；要看接下来的戏，去后面那幕点「生成剧本」'
})

/** 空态里直接给可点的动作，避免用户找不到该按哪个 */
const stageEmptyAction = computed(() => availablePipeline.value.find((b) => b.action === 'advance') || null)

/**
 * 舞台形态是整幕的：这一幕没演出时，替观众找出「真正能继续演」的那一幕。
 *
 * <p>演完一幕会顺带开下一幕的空壳。如果观众停在刚演完的那幕上点「演出」，
 * 只会把已经演过的再演一遍——这正是「幕次怎么没生成」的来源。这里给一个直达按钮。</p>
 */
const unplayedAct = computed(() => {
  if (!currentAct.value || actStage.value === 'writing') return null
  const cur = currentAct.value.actNo ?? 0
  return acts.value.find((a) => (a.actNo ?? 0) > cur && ['writing', 'props_ok', 'playing'].includes(String(a.stage))) ?? null
})

/* ---------------- 生命周期 ---------------- */

/**
 * 舞台快捷键：←/→ 切场，Home/End 首末场。
 *
 * 只在「正在看某一幕的演出正文」时生效；输入框/下拉里打字不拦截，
 * 避免和世界搜索、演员多选等输入控件抢键。
 */
function onStageKeydown(e: KeyboardEvent) {
  const el = document.activeElement as HTMLElement | null
  if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return
  if (el && el.isContentEditable) return
  if (!currentAct.value || storyScenes.value.length <= 1) return
  if (e.altKey || e.ctrlKey || e.metaKey) return
  const last = storyScenes.value.length - 1
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    stepCue(-1)
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    stepCue(1)
  } else if (e.key === 'Home') {
    e.preventDefault()
    gotoCue(0)
  } else if (e.key === 'End') {
    e.preventDefault()
    gotoCue(last)
  }
}

onMounted(() => {
  void loadWorlds()
  window.addEventListener('keydown', onStageKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onStageKeydown)
  stopAutoWatch()
})

/* ---------------- 世界 ---------------- */
async function loadWorlds() {
  worlds.value = await apiService.fetchWorlds()
}

async function selectWorld(w: WorldItem) {
  stopAutoWatch()
  currentWorldId.value = w.id
  currentWorld.value = w
  currentAct.value = null
  actDetail.value = null
  stories.value = []
  showScript.value = false
  const view = await apiService.fetchWorldView(w.id)
  scenes.value = view.scenes || []
  npcs.value = view.npcs || []
  relationships.value = view.relationships || []
  events.value = view.events || []
  currentSceneId.value = scenes.value.length ? scenes.value[0].id : null
  await loadMessages()
  await loadActs()
  // 演出正文单独取：只有演过的幕次才有，取不到不影响页面
  await loadStories()
  // 有演出记录时直接进「看戏」：默认选中最新一幕，用户一进来就在剧场里
  if (acts.value.length) {
    const done = stories.value.find((s) => s.played)
    const target = done
      ? acts.value.find((a) => a.actNo === done.actNo)
      : acts.value[acts.value.length - 1]
    if (target) await selectAct(target)
  } else {
    sideTab.value = 'cast'
  }
  syncWorld(w, view.world)
}

function syncWorld(from: WorldItem, fresh: WorldItem) {
  Object.assign(from, fresh)
  currentWorld.value = fresh
}

function openCreateWorld() {
  worldForm.name = ''
  worldForm.era = '现代'
  worldForm.weather = '晴'
  worldForm.description = ''
  worldForm.directorModel = ''
  worldForm.actorRoles = ''
  void loadMediaSettings()
  void loadDirectorModels()
  createVisible.value = true
}

/** 点种子卡片：填充描述（时代由用户点上面那排标签决定） */
function applySeed(s: { label: string; desc: string }) {
  worldForm.description = s.desc
}

/** 随机生成：随机名称 + 抽签时代 + 选种子，点击即创建 */
async function randomCreate() {
  const r = (n: number) => Math.floor(Math.random() * n)
  const names: string[] = ['新冒险', '初探索', '新世界', '新纪元', '新大陆', '新旅程']
  worldForm.name = names[r(names.length)]
  worldForm.era = ERA_OPTIONS[r(ERA_OPTIONS.length)]
  applySeed(WORLD_SEEDS[r(WORLD_SEEDS.length)])
  await confirmCreate()
}

async function confirmCreate() {
  const name = worldForm.name.trim()
  const desc = worldForm.description.trim() || 'AI 自动生成'
  const era = worldForm.era || '现代'
  creating.value = true
  try {
    const w = await apiService.createWorld(
      name || `${ERA_PREFIX[era] ?? '世界'} ${Math.floor(Math.random() * 10000)}`,
      desc, era, worldForm.directorModel, worldForm.actorRoles)
    // 出片方式是全站设置：新建世界时按这里选的写一次，免得用户建完还得再进设置改
    await saveMediaSettings()
    await loadWorlds()
    await selectWorld(w)
    createVisible.value = false
    message.success('世界已创建，接下来交给 AI')
  } catch (e: any) {
    message.error(e?.message || '创建失败')
  } finally {
    creating.value = false
  }
}

function openWorldEdit() {
  if (!currentWorld.value) return
  worldForm.name = currentWorld.value.name || ''
  worldForm.era = currentWorld.value.era || '现代'
  worldForm.weather = currentWorld.value.weather || '晴'
  worldForm.description = currentWorld.value.description || ''
  worldForm.directorModel = currentWorld.value.directorModel || ''
  worldForm.actorRoles = currentWorld.value.actorRoles || ''
  void loadMediaSettings()
  void loadDirectorModels()
  editVisible.value = true
}

/** 读 sim 分组设置：出片方式与视频模型（读不到就用默认：出视频、自动挑模型） */
async function loadMediaSettings() {
  let flat: Record<string, any> = {}
  try {
    const s: any = await apiService.fetchGroupSettings('sim')
    // 该出口回的是双层信封 {success, data:{field->value}}（部分封装还会再包一层 {code,data}），
    // 直接在外层找 media_mode 永远找不到，界面就会一直停在默认的「生成视频」。
    flat = s?.data?.data ?? s?.data ?? s ?? {}
  } catch {
    // 设置读不到不该挡住世界设置面板：保持默认值
  }
  // 先拿到可用的视频 / 图片模型，再决定默认形态：
  // 有生图模型就别把世界停在没有视频模型的「生成视频」上，否则舞台永远出不来背景图。
  if (!mediaForm.videoModels.length || !mediaForm.imageModels.length) await loadMediaModels()
  const raw = String(flat.media_mode ?? flat.mediaMode ?? '').trim()
  const hasVideo = mediaForm.videoModels.length > 0
  const hasImage = mediaForm.imageModels.length > 0
  if (raw === 'text' || raw === 'image') {
    mediaForm.mediaMode = raw
  } else if (raw === 'video') {
    // 明确选了视频就尊重；只有确认「一个视频模型都没有、但能出图」时才退到场景图
    mediaForm.mediaMode = mediaModelsReady.value && !hasVideo && hasImage ? 'image' : 'video'
  } else {
    mediaForm.mediaMode = hasImage ? 'image' : hasVideo ? 'video' : 'text'
  }
  mediaForm.videoModel = String(flat.video_model ?? flat.videoModel ?? '').trim()
  mediaForm.imageModel = String(flat.image_model ?? flat.imageModel ?? '').trim()
}

/** 模型清单是否真的取到过：取不到时不能把「空列表」当成「没有该能力」 */
const mediaModelsReady = ref(false)

/** 可选生成模型：视频用于分镜连播，图片用于舞台背景；只列当前确实有实现的 */
async function loadMediaModels() {
  const namesOf = (res: any): string[] => {
    const rows = Array.isArray(res) ? res : (res?.data ?? res?.list ?? [])
    return (Array.isArray(rows) ? rows : [])
      .map((m: any) => (typeof m === 'string' ? m : (m?.model ?? m?.name ?? '')))
      .filter((x: string) => Boolean(x))
  }
  const [video, image] = await Promise.all([
    apiService.fetchGenerateModels('video').catch(() => null),
    apiService.fetchGenerateModels('image').catch(() => null),
  ])
  if (video) mediaForm.videoModels = namesOf(video)
  if (image) mediaForm.imageModels = namesOf(image)
  mediaModelsReady.value = Boolean(video || image)
}

/** 可选对话模型（导演/演员下拉）：从供应商模型里挑能 chat 的，只留名字去重 */
async function loadDirectorModels() {
  try {
    const list = await apiService.fetchModels() as any
    const providers = Array.isArray(list) ? list : (list?.items ?? list?.data ?? [])
    const names: string[] = []
    for (const p of providers) {
      for (const m of (p?.models ?? [])) {
        const caps = (m as any)?.capabilities ?? []
        const isChat = Array.isArray(caps) && caps.some((c: any) => String(c?.task) === 'chat')
        const name = typeof m === 'string' ? m : (m?.model ?? m?.name ?? '')
        if (name && (isChat || !Array.isArray(caps))) names.push(String(name))
      }
    }
    directorModels.value = [...new Set(names)]
  } catch {
    directorModels.value = []
  }
}

/** 把出片方式写回 sim 分组设置（只提交出片相关键，避免覆盖别人改的其他设置） */
async function saveMediaSettings() {
  const payload: Record<string, string> = { media_mode: mediaForm.mediaMode }
  // 纯文字形态不需要视频模型；提交空串会把别人配好的模型清掉，所以干脆不带这个键
  if (mediaForm.mediaMode === 'video') payload.video_model = mediaForm.videoModel || ''
  if (mediaForm.mediaMode === 'image') payload.image_model = mediaForm.imageModel || ''
  await apiService.updateGroupSettings('sim', payload)
}

async function confirmEdit() {
  if (!currentWorldId.value) return
  savingWorld.value = true
  try {
    await apiService.updateWorld(currentWorldId.value, {
      name: worldForm.name,
      era: worldForm.era,
      weather: worldForm.weather,
      description: worldForm.description,
      // 导演/演员配置：snake_case 与后端 updateWorld 读取一致
      director_model: worldForm.directorModel,
      actor_roles: worldForm.actorRoles,
    })
    await saveMediaSettings()
  } catch (e: any) {
    message.error(e?.message || '保存失败')
    return
  } finally {
    savingWorld.value = false
  }
  editVisible.value = false
  await loadWorlds()
  await selectWorld(currentWorld.value!)
  message.success('世界已保存')
}

async function onWorldCmd(cmd: string, w: WorldItem) {
  if (cmd === 'rename') {
    currentWorldId.value = w.id
    currentWorld.value = w
    openWorldEdit()
  } else if (cmd === 'delete') {
    try {
      await ElMessageBox.confirm(
        `删除世界「${w.name}」？场景、NPC、关系与全部事件都会一并删除。`,
        '删除世界', { type: 'warning' })
      await apiService.deleteWorld(w.id)
      if (currentWorldId.value === w.id) {
        stopAutoWatch()
        currentWorldId.value = null
        currentWorld.value = null
        currentSceneId.value = null
        currentAct.value = null
        actDetail.value = null
        stories.value = []
        acts.value = []
        messages.value = []
        scenes.value = []
        npcs.value = []
        relationships.value = []
        events.value = []
      }
      if (streamHandle) streamHandle.close()
      await loadWorlds()
    } catch { /* cancel */ }
  }
}

/* ---------------- 场景 ---------------- */
async function selectScene(s: WorldScene) {
  currentSceneId.value = s.id
  messages.value = []
  await loadMessages()
}

/**
 * 从幕次视图回到对话视图（场景不动，沿用当前已加载的消息）。
 *
 * 幕次视图只有只读演出稿，输入区与「观演」都不渲染，所以必须有看得见的退出口：
 * 在此之前只能绕到右侧「地图」点场景名，提示语里那句「点幕次卡以外的地方」并不存在。
 */
async function backToConversation() {
  if (!currentAct.value) return
  currentAct.value = null
  actDetail.value = null
  showScript.value = false
  showTextPlay.value = false
  filmIndex.value = 0
  // 没选过场景时补第一个：否则回到对话视图也点不了「观演」
  if (currentSceneId.value == null && scenes.value.length) {
    await selectScene(scenes.value[0])
    return
  }
  scrollBottom()
}

/** 从幕次视图回到对话视图，并定位到某个场景 */
async function goScene(s: WorldScene) {
  currentAct.value = null
  actDetail.value = null
  showScript.value = false
  await selectScene(s)
}

function npcCountOf(sceneId: number) {
  return npcs.value.filter((n) => n.sceneId === sceneId).length
}

function openCreateScene() {
  sceneForm.name = ''
  sceneForm.description = ''
  sceneCreateVisible.value = true
}

async function confirmCreateScene() {
  const name = sceneForm.name.trim()
  if (!name || !currentWorldId.value) return
  const s = await apiService.createWorldScene(currentWorldId.value, { name, description: sceneForm.description })
  sceneCreateVisible.value = false
  const view = await apiService.fetchWorldView(currentWorldId.value)
  scenes.value = view.scenes || []
  currentAct.value = null
  currentSceneId.value = s.id
  await loadMessages()
  message.success('场景已创建')
}

async function deleteScene(s: WorldScene) {
  try {
    await ElMessageBox.confirm(`删除场景「${s.name}」？其中的角色会回到"未布置"状态。`, '删除场景', { type: 'warning' })
    await apiService.deleteWorldScene(s.id)
    const view = await apiService.fetchWorldView(currentWorldId.value!)
    scenes.value = view.scenes || []
    if (currentSceneId.value === s.id) {
      currentSceneId.value = scenes.value.length ? scenes.value[0].id : null
      await loadMessages()
    }
    message.success('场景已删除')
  } catch { /* cancel */ }
}

/* ---------------- 角色 ---------------- */
function sceneNameOf(sceneId?: number | null) {
  if (sceneId == null) return '未布置'
  return scenes.value.find((s) => s.id === sceneId)?.name || ''
}

/** 选中角色时它与其他角色的全部关系（双向各一条） */
const npcRelations = computed(() => {
  const id = npcEditTarget.value?.id
  if (id == null) return []
  return relationships.value.filter((r) => r.fromNpcId === id || r.toNpcId === id)
})

function otherName(r: WorldRelationship) {
  return r.fromNpcId === npcEditTarget.value?.id ? r.toName : r.fromName
}

function openNpcEdit(n: WorldNpc) {
  npcEditTarget.value = n
  npcEditForm.nickname = n.nickname || ''
  npcEditForm.persona = n.persona || ''
  npcEditForm.sceneId = n.sceneId ?? null
  npcEditForm.isActive = n.isActive !== false
  npcEditForm.modelOverride = n.modelOverride || ''
  void loadDirectorModels()
  for (const r of relationships.value) {
    if (r.fromNpcId === n.id || r.toNpcId === n.id) relDraft[r.id] = r.affinity ?? 0
  }
  npcEditVisible.value = true
}

async function confirmEditNpc() {
  const target = npcEditTarget.value
  if (!target) return
  npcSaving.value = true
  try {
    await apiService.updateWorldNpc(target.id, {
      nickname: npcEditForm.nickname || null,
      persona: npcEditForm.persona || null,
      sceneId: npcEditForm.sceneId ?? null,
      isActive: npcEditForm.isActive,
      modelOverride: npcEditForm.modelOverride || null,
    })
    // 关系程度一并保存：观众能微调的就这两样（性格 + 关系）
    const changed = npcRelations.value.filter((r) => (r.affinity ?? 0) !== relDraft[r.id])
    for (const r of changed) {
      await apiService.updateWorldRelationship(r.id, { affinity: relDraft[r.id] })
    }
    npcEditVisible.value = false
    await refreshPeople()
    message.success('NPC 已更新')
  } catch (e: any) {
    message.error(e?.message || '保存失败')
  } finally {
    npcSaving.value = false
  }
}

/** 管理列表里的参与 / 挂起开关：就地切换，不打开弹窗 */
async function toggleNpcActive(n: WorldNpc, active: boolean) {
  const before = n.isActive !== false
  n.isActive = active
  try {
    await apiService.updateWorldNpc(n.id, { isActive: active })
    message.success(active ? '已恢复参与' : '已挂起')
  } catch (e: any) {
    n.isActive = before
    message.error(e?.message || '切换失败')
  }
}

/** 移出世界：连带清除它的关系 */
async function removeNpc(n: WorldNpc) {
  try {
    await ElMessageBox.confirm(`把「${n.displayName}」移出这个世界？它的关系也会清除。`, '移出角色', { type: 'warning' })
    await apiService.deleteWorldNpc(n.id)
    await refreshPeople()
    message.success('已移除')
  } catch { /* cancel */ }
}

function openCreateNpc() {
  npcCreateForm.count = 2
  npcCreateForm.hint = ''
  npcCreateVisible.value = true
}

async function confirmCreateNpc() {
  if (!currentWorldId.value) return
  npcCreating.value = true
  try {
    await apiService.createWorldNpcByAi(currentWorldId.value, {
      count: npcCreateForm.count,
      hint: npcCreateForm.hint.trim() || undefined,
    })
    npcCreateVisible.value = false
    await refreshPeople()
    await loadActs()
    message.success('AI 已造好角色并布好关系')
  } catch (e: any) {
    message.error(e?.message || 'AI 造角色失败')
  } finally {
    npcCreating.value = false
  }
}

async function refreshPeople() {
  if (!currentWorldId.value) return
  const view = await apiService.fetchWorldView(currentWorldId.value)
  npcs.value = view.npcs || []
  relationships.value = view.relationships || []
}

/* ---------------- 关系 ---------------- */
function relPct(v?: number) {
  return ((v ?? 0) + 100) / 2
}

function relTone(v?: number) {
  const a = v ?? 0
  if (a >= 50) return 'good'
  if (a <= -50) return 'bad'
  if (a <= -10) return 'cool'
  return 'mid'
}

function openRelEdit(r: WorldRelationship) {
  relEditTarget.value = r
  relEditForm.affinity = r.affinity ?? 0
  relEditForm.relationTag = r.relationTag || ''
  relEditForm.memo = r.memo || ''
  relEditVisible.value = true
}

async function confirmEditRel() {
  const target = relEditTarget.value
  if (!target) return
  await apiService.updateWorldRelationship(target.id, {
    affinity: relEditForm.affinity,
    relationTag: relEditForm.relationTag || null,
    memo: relEditForm.memo || null,
  })
  relEditVisible.value = false
  await refreshPeople()
  message.success('关系已保存')
}

/* ---------------- 推进时间 ---------------- */
/**
 * 推进世界时间。
 *
 * @param keepAct 保留当前幕次选中。自动演化每次推进后会立刻接下一拍，
 *                若像手动推进那样清掉幕次，观众会看到舞台反复黑屏、什么也留不住。
 */
async function advance(keepAct = false) {
  if (!currentWorldId.value || advancing.value) return
  advancing.value = true
  try {
    const res = await apiService.advanceWorld(currentWorldId.value)
    const view = await apiService.fetchWorldView(currentWorldId.value)
    scenes.value = view.scenes || []
    npcs.value = view.npcs || []
    relationships.value = view.relationships || []
    events.value = view.events || []
    syncWorld(currentWorld.value!, res.world)
    await loadWorlds()
    // 推进时会落一条旁白消息：回到对话视图才能看见，所以这里清掉幕次选中
    if (!keepAct && currentAct.value) {
      currentAct.value = null
      actDetail.value = null
    }
    await loadMessages()
    // 旁白落在某个场景里：若当前场景不是它，切过去，避免「推进了却看不到」
    const evSceneId = (res.event as any)?.sceneId
    if (evSceneId != null && evSceneId !== currentSceneId.value) {
      const s = scenes.value.find((x) => x.id === evSceneId)
      if (s) await selectScene(s)
    }
    message.success(`时间推进：${res.world.timeLabel || ''}`)
  } catch (e: any) {
    message.error(e?.message || '推进失败')
  } finally {
    advancing.value = false
  }
}

/* ---------------- 世界自演化（自动推进） ---------------- */
/** 自动推进间隔：一轮演出 + 一次时间推进，节奏由 AI 定，观众只负责看 */
const AUTO_EVOLVE_MS = 6000
let evolveTimer: ReturnType<typeof setTimeout> | null = null

/** 自动演化开关由用户控制，默认关闭，避免一进页面就消耗模型额度 */
const autoEvolve = ref(false)

function stopAutoEvolve() {
  if (evolveTimer) {
    clearTimeout(evolveTimer)
    evolveTimer = null
  }
}

/** 排下一轮：先把待演的幕演完，再推进世界时间 */
function scheduleEvolve() {
  stopAutoEvolve()
  if (!autoEvolve.value || !currentWorldId.value) return
  evolveTimer = setTimeout(async () => {
    evolveTimer = null
    if (!autoEvolve.value || !currentWorldId.value) return
    try {
      // 每拍先把幕次列表拉新：上一拍把幕推到 replay 后，本地 acts 还是旧阶段，
      // 用旧阶段判断会再发一次 advance，接口直接回 400「幕次阶段为 replay，无法推进」，
      // 浏览器控制台就留下一条假的网络错误。以服务端返回的列表为准。
      await loadActs()
      // 「待演」幕：上一幕演完时 AI 已把下一幕建出来停在 writing，
      // 此时焦点通常还在刚演完的 replay 幕上。若不主动把待演幕接上，
      // 自动演化就只会空推世界时间，剧本永远停在第一幕。
      // 取**最新**的待演幕：历史上积压的空幕（旧验收数据）不该被自动演化
      // 从最早一幕开始倒着重写，观众要看的是世界往后走。
      const waiting = [...acts.value].reverse()
        .find((a) => ['writing', 'props_ok', 'playing'].includes(String(a.stage)))
      if (waiting && waiting.actNo !== currentAct.value?.actNo) {
        await selectAct(waiting)
      }
      const fresh = acts.value.find((a) => a.actNo === currentAct.value?.actNo)
      const stage = String(fresh?.stage ?? actStage.value ?? '')
      if (currentAct.value && stage && stage !== 'replay' && stage !== 'finished') {
        // 形参是 { stage, label, action } 对象：传字符串会让 btn.action 恒为 undefined，
        // 函数里所有分支都不命中，等于空转（自动演化会一直停在写作阶段）。
        await actPipelineAction({ action: 'advance' })
      } else {
        // keepAct：自动演化是连续节奏，幕次不能被清掉，否则每一拍都黑屏
        await advance(true)
      }
    } catch (e: any) {
      // 单轮失败不打断演化：下一轮自然重试，观众看到的是一次停顿而不是整个页面报错
      // 只读账号推进世界会 403，那就停下等用户自己再点，不要每 6 秒弹一次错误
      console.warn('[world-sim] 自演化单轮失败', e)
      if (e?.statusCode === 403 || e?.status === 403) {
        autoEvolve.value = false
      }
    } finally {
      scheduleEvolve()
    }
  }, AUTO_EVOLVE_MS)
}

function toggleAutoEvolve() {
  if (autoEvolve.value) {
    autoEvolve.value = false
    stopAutoEvolve()
    return
  }
  if (!currentWorldId.value) {
    message.info('先选一个世界')
    return
  }
  // 与「自动观看」互斥：同一时刻只让一种节奏在跑
  if (autoWatch.value) {
    stopAutoWatch()
  }
  autoEvolve.value = true
  scheduleEvolve()
}

onUnmounted(stopAutoEvolve)

/* ---------------- 观演（让 AI 自己演） ---------------- */
async function spectate() {
  if (!canSpectate.value || spectating.value) return
  spectating.value = true
  try {
    await runSpectatorTurn('')
  } catch (e: any) {
    message.error(e?.message || '观演失败')
    spectating.value = false
  }
}

/** 跑一轮「没有用户发言」的 SSE，返回本轮是否拿到 AI 内容 */
function runSpectatorTurn(hint: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!currentWorldId.value) {
      resolve(false)
      return
    }
    const turnKey = keySeq++
    let got = false
    const aiBySpeaker = new Map<string, UIMessage>()
    try {
      streamHandle = apiService.worldChatStream(
        { worldId: currentWorldId.value, sceneId: currentSceneId.value, content: hint, atNpcId: null },
        {
          onEvent: (ev) => {
            if (ev.type === 'create') {
              got = true
              const created: UIMessage = {
                _key: keySeq++,
                speakerType: 'ai',
                speakerId: ev.speakerId,
                speakerName: ev.speakerName || 'AI',
                content: '',
                modelName: ev.modelName,
                streaming: true,
              }
              void turnKey
              messages.value.push(created)
              aiBySpeaker.set(created.speakerId || `ai-${created._key}`, created)
              scrollBottom()
            } else if (ev.type === 'text') {
              const target = aiBySpeaker.get(ev.speakerId || '') || evSpeakerFallback(aiBySpeaker)
              if (target) {
                target.content += ev.content || ''
                scrollBottom()
              }
            } else if (ev.type === 'finish') {
              const target = aiBySpeaker.get(ev.speakerId || '') || evSpeakerFallback(aiBySpeaker)
              if (target) {
                target.streaming = false
                if (ev.error) target.content += `\n[错误] ${ev.error}`
                else if (!target.content.trim()) target.content = '（模型未返回内容）'
              } else if (ev.error) {
                // 后端在 create 之前就失败（例如没有任何可用对话模型）时只会补一条带 error 的 finish，
                // 此时没有气泡可挂错误，直接落一条错误气泡，避免「有动作但毫无结果」。
                pushStreamError(ev)
              }
            } else if (ev.type === 'turn_end') {
              aiBySpeaker.forEach((m) => { m.streaming = false })
            }
          },
          onError: (err) => {
            console.error('world watch stream error', err)
            spectating.value = false
            // 一条气泡都没建起来就断了：给用户一个可见结果，别让「观演」点了像没点
            if (!got) pushStreamError({ error: '连接中断，本轮没有收到回复，请重试' })
            reject(err)
          },
          onClose: () => {
            aiBySpeaker.forEach((m) => { m.streaming = false })
            spectating.value = false
            if (currentWorldId.value) {
              apiService.fetchWorldRelationships(currentWorldId.value)
                .then((rows) => { relationships.value = rows })
                .catch(() => {})
            }
            resolve(got)
          },
        },
      )
    } catch (e) {
      reject(e)
    }
  })
}

function toggleAutoWatch() {
  if (autoWatch.value) {
    stopAutoWatch()
    return
  }
  if (!currentWorldId.value) {
    message.info('先选一个世界')
    return
  }
  // 幕次视图不渲染输入区，也开不了观演：这里必须指回真正存在的退出口
  if (currentAct.value) {
    message.info('现在停留在幕次视图：点幕次头部的「回到对话」退出后再开自动观看')
    return
  }
  if (currentSceneId.value == null) {
    message.info('先在场景页签里选一个场景，再开自动观看')
    return
  }
  // 两个自动开关同开会让同一轮里既推幕次又推对话，节奏互相打架
  if (autoEvolve.value) {
    autoEvolve.value = false
    stopAutoEvolve()
  }
  autoWatch.value = true
  message.success('自动观看已开启，世界会自己演下去')
  scheduleAutoWatch(300)
}

function scheduleAutoWatch(delay: number) {
  stopAutoWatchTimerOnly()
  autoTimer = window.setTimeout(() => { void autoWatchStep() }, delay)
}

async function autoWatchStep() {
  if (!autoWatch.value) return
  if (!canSpectate.value) {
    stopAutoWatch()
    return
  }
  try {
    await spectate()
  } catch {
    stopAutoWatch()
    return
  }
  if (autoWatch.value) scheduleAutoWatch(AUTO_WATCH_INTERVAL)
}

function stopAutoWatchTimerOnly() {
  if (autoTimer !== null) {
    window.clearTimeout(autoTimer)
    autoTimer = null
  }
}

function stopAutoWatch(reason?: string) {
  stopAutoWatchTimerOnly()
  if (autoWatch.value) {
    autoWatch.value = false
    message.info(reason || '自动观看已停止')
  }
}

/* ---------------- 幕次 ---------------- */
/** 幕次阶段 → 展示名 */
function actStageName(s?: string | null): string {
  return ACT_STAGE_NAME[s ?? ''] ?? '未知'
}

/** 幕次阶段 → 标签色 */
function actStageTone(s?: string | null): string {
  return ACT_STAGE_TONE[s ?? ''] ?? ''
}

/** 幕次行或详情行的显示进度（素材阶段的完成度 / 表演阶段的场景数） */
function actProgress(v?: Record<string, any>) {
  // 声明成可空：`assets.total` 取不到时是 undefined，直接参与 `total > 0` 比较会报
  // 「可能为 undefined」——语义上「总量未知」本就等于「不算素材进度」。
  const total = v?.assets?.total as number | undefined
  const done = v?.assets?.done as number | undefined
  if (total != null && total > 0) return Math.min(100, Math.round((done ?? 0) / total * 100))
  return Math.min(100, Number(v?.progress ?? 0))
}

/**
 * 幕次标题：act 行在「AI 编剧前」只有占位名，真正由 AI 起的标题写在演出稿里。
 * 胶片条与台头都以 AI 标题为准，观众才看得见这一幕叫什么，而不是一排「未命名幕次」。
 */
function actTitleOf(a?: { actNo?: number; title?: string } | null) {
  const own = String(a?.title || '').trim()
  if (own && own !== '未命名幕次') return own
  const story = stories.value.find((s) => s.actNo === a?.actNo)
  return String(story?.title || '').trim() || own || '待 AI 编剧'
}

/** 幕次所在阶段（来自当前选中的幕次行） */
const actStage = computed(() => actDetail.value?.act?.stage ?? currentAct.value?.stage)

/** 幕次操作序列：每阶段可选的操作（非当前阶段不展示，避免一排灰按钮） */
const actPipeline = [
  { stage: 'writing', label: '生成剧本', action: 'advance', primary: true },
  { stage: 'props_ok', label: '推进素材', action: 'advance', primary: false },
  { stage: 'props_ok', label: '演出', action: 'advance', primary: true },
  { stage: 'playing', label: '演出', action: 'advance', primary: true },
  { stage: 'replay', label: '重播', action: 'replay', primary: false },
  // 后端 finishAct 只接受 replay/finished 阶段；stage 用 finished 会导致按钮永远置灰
  { stage: 'replay', label: '结文', action: 'finish', primary: true },
]

/** 当前阶段真正可点的按钮：只列现在能做的，观众不会被一排灰按钮吓到 */
const availablePipeline = computed(() => {
  const stage = actStage.value ?? ''
  if (!stage || stage === 'finished' || stage === 'aborted') return []
  return actPipeline.filter((b) => b.stage === stage)
})

async function loadActs() {
  if (!currentWorldId.value) { acts.value = []; return }
  acts.value = await apiService.fetchWorldActs(currentWorldId.value)
}

async function loadStories() {
  if (!currentWorldId.value) { stories.value = []; return }
  try {
    stories.value = await apiService.fetchWorldStory(currentWorldId.value)
  } catch {
    // 演出正文只是锦上添花：接口异常时不挡页面
    stories.value = []
  }
}

async function openCreateAct() {
  if (!currentWorldId.value) return
  if (actProcessing.value) return
  try {
    const a = await apiService.createWorldAct(currentWorldId.value) as WorldAct
    await loadActs()
    await selectAct(a)
    if (readingOnly.value) {
      message.success(`已创建第 ${a.actNo} 幕`)
      return
    }
    // 新建即交给 AI：不再留一幕「未命名幕次」空壳，编剧写完标题、素材与演出会一路跟上
    message.success(`已新建第 ${a.actNo} 幕，AI 正在写`)
    await actPipelineAction({ action: 'advance', label: '生成剧本' })
  } catch (e: any) {
    message.error(e?.message || '创建幕次失败')
  }
}

async function selectAct(a: WorldActListRow) {
  // 幕次视图不能观演：自动观看继续跑只会在下一拍静默停掉，这里先把原因说清楚
  if (autoWatch.value) stopAutoWatch('已进入幕次视图，自动观看停止')
  currentAct.value = a
  actDetail.value = null
  showScript.value = false
  // 从聊天记录切进来时舞台可能停在半截，新幕要从头看
  msgBoxRef.value?.scrollTo?.({ top: 0 })
  await fetchActDetail(a.actNo as number)
}

async function fetchActDetail(actNo: number) {
  if (!currentWorldId.value || actNo == null) return
  // 只读取详情：不占用 actProcessing，否则会和 actPipelineAction 的处理中状态互相踩，
  // 自动演化时观众会看到进度提示突然消失。
  try {
    const d = await apiService.fetchWorldActDetail(currentWorldId.value, actNo) as WorldActDetail
    actDetail.value = d
  } catch (e: any) {
    message.error(e?.message || '获取幕次详情失败')
  }
}

/* ---------------- 剧本（弹框） ---------------- */

/** 剧本原文 → 结构化视图用的 JSON（解析失败返回 null，交给 Markdown 兜底） */
const scriptParsed = computed<Record<string, any> | null>(() => {
  const raw = String(actDetail.value?.script ?? '').trim()
  if (!raw) return null
  try {
    const json = JSON.parse(raw)
    return json && typeof json === 'object' ? json as Record<string, any> : null
  } catch {
    return null
  }
})

/** 解析失败时的兜底：去掉代码围栏后按 Markdown 看，不直接摊 JSON 接口原文 */
const scriptFallback = computed(() => {
  const raw = String(actDetail.value?.script ?? '').trim()
  if (!raw) return ''
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
})

function npcNameOf(id: any) {
  return npcs.value.find((n) => String(n.id) === String(id))?.displayName || ''
}

/**
 * 剧本弹框的结构化内容：概述 + 分场（画面描述、在场、台词）+ 过场 + 道具。
 * 台词说话人可能只在 text 前缀里，能拆就拆，不把「曹操：……」整句塞进姓名字段。
 */
const scriptView = computed(() => {
  const j = scriptParsed.value
  if (!j) return null
  const scenes = Array.isArray(j.scenes) ? j.scenes : []
  const sceneNameById = (id: any) =>
    scenes.find((s: any) => String(s?.sceneId) === String(id))?.name || ''
  const meta: string[] = []
  if (j.worldTime) meta.push(`时间：${j.worldTime}`)
  if (j.weather) meta.push(`天气：${j.weather}`)
  return {
    title: String(j.title || '未命名剧本'),
    description: String(j.description || ''),
    meta: meta.join(' · '),
    scenes: scenes.map((s: any) => {
      const castIds = Array.isArray(s?.npcs) ? s.npcs.map(npcNameOf).filter(Boolean) : []
      const cast = String(s?.cast || '').trim() || castIds.join('、')
      const lines = (Array.isArray(s?.lines) ? s.lines : [])
        .map((l: any) => {
          const say = String(l?.text || '').trim()
          let who = String(l?.speaker || '').trim()
          if (!who) {
            const m = say.match(/^\s*([^：:]{1,12})[：:]\s*(.+)$/)
            if (m) return { speaker: m[1].trim(), text: m[2].trim() }
          }
          return { speaker: who || '旁白', text: say }
        })
        .filter((l: any) => l.text)
      return {
        name: String(s?.name || '场景'),
        where: String(s?.stageName || '') || (s?.sceneId != null ? sceneNameById(s.sceneId) : ''),
        desc: String(s?.desc || ''),
        cast,
        lines,
      }
    }),
    transitions: (Array.isArray(j.transitions) ? j.transitions : [])
      .map((t: any) => String(t?.text || '').trim())
      .filter(Boolean),
    props: (Array.isArray(j.props) ? j.props : [])
      .map((p: any) => String(p?.name || '').trim())
      .filter(Boolean),
  }
})

/** 看剧本：详情里还没有剧本时先补拉一次，再开弹框（空剧本弹框里给「让 AI 写」） */
async function openScript() {
  if (!currentAct.value) return
  if (!actDetail.value?.script) {
    await fetchActDetail(currentAct.value.actNo as number)
  }
  showScript.value = true
}

/** 弹框里直接让 AI 写这一幕：走同一条幕次管线，写完弹框里的结构化剧本自动刷新 */
async function generateScript() {
  if (!currentAct.value) return
  // 管线只在编剧/布景/出演阶段可推进；已可重播的幕次直接告诉观众去看，不发无效请求
  if (!['writing', 'props_ok', 'playing'].includes(String(actStage.value ?? ''))) {
    message.info('这一幕已经演完了，关掉弹框点「重播」或直接新建下一幕')
    return
  }
  await actPipelineAction({ action: 'advance', label: '生成剧本' })
  await fetchActDetail(currentAct.value.actNo as number)
  showScript.value = true
}

/** 幕次阶段操作 */
async function actPipelineAction(btn: { stage?: string; label?: string; action?: string }) {
  if (!currentWorldId.value || currentAct.value?.actNo == null) return
  const stage = actStage.value ?? ''
  if (btn.action === 'advance' && !['writing', 'props_ok', 'playing'].includes(stage)) return
  if (btn.action === 'replay' && !['replay', 'finished'].includes(stage)) return
  if (btn.action === 'finish' && !['replay', 'finished'].includes(stage)) return
  actProcessing.value = true
  actBusyText.value = btn.action === 'advance' && stage === 'writing' ? 'AI 正在写这一幕的剧本…'
    : btn.action === 'advance' && stage === 'playing' ? 'AI 正在演这一幕，可能要几十秒…'
      : '处理中…'
  try {
    const no = currentAct.value!.actNo as number
    if (btn.action === 'advance') {
      // 发请求前用服务端的详情复核一次阶段：列表/详情可能比库里旧
      // （上一拍刚把这一幕推到 replay），直接发 advance 会拿到 400
      // 「幕次阶段为 replay，无法推进」，浏览器控制台就多一条假网络错误。
      try {
        const fresh = await apiService.fetchWorldActDetail(currentWorldId.value, no) as WorldActDetail
        const freshStage = String(fresh?.act?.stage ?? '')
        if (freshStage && !['writing', 'props_ok', 'playing'].includes(freshStage)) {
          actDetail.value = fresh
          return
        }
      } catch {
        /* 复核失败就按原流程走，由 advance 自己兜底 */
      }
      // 幕次自动接续：从当前阶段一路推到「可重播」，中途不停下来等观众点。
      // 演出已改成分场增量：一次 advance 只演一场，演完就把稿子落盘。
      // 所以每一轮结束都要刷新「演出稿 + 幕次详情」，已演的场次立刻上舞台，
      // 观众能一边看一边等下一场，而不是对着空舞台干等整幕跑完。
      let next: WorldActAdvance | null = null
      let lastDone = -1
      let total = 0
      // 上限按场次数放：writing/props_ok 各占 1 轮，演出每场 1 轮，再多留几轮余量
      for (let i = 0; i < 32; i += 1) {
        try {
          next = await apiService.advanceWorldAct(currentWorldId.value, no) as WorldActAdvance
        } catch {
          // 上一拍刚把这一幕推到 replay：直接放弃本轮，观众看到的是现有结果
          break
        }
        const st = String(next?.act?.stage ?? '')
        const done = Number(next?.playedScenes ?? 0)
        const all = Number(next?.totalScenes ?? 0)
        if (all > 0) total = all
        if (st === 'playing' || done > 0) {
          // 每演完一场就把稿子取回来铺到舞台上（先取稿再提示，避免进度与正文错位）
          await loadStories()
          await fetchActDetail(no)
        }
        if (!['writing', 'props_ok', 'playing'].includes(st)) break
        actBusyText.value = st === 'writing' ? 'AI 正在写这一幕的剧本…'
          : st === 'playing' ? (total > 0
            ? `AI 正在演这一幕：已演 ${done}/${total} 场…`
            : 'AI 正在演这一幕…')
            : 'AI 正在布景与生成素材…'
        // 后端整幕演完会把 nextAct 一起带回来；还在演就继续推
        if (next?.nextAct?.actNo) break
        // 没有任何进展就别空转，直接交给用户看现有结果
        if (st === 'playing' && done > 0 && done === lastDone) break
        lastDone = done
      }
      const ended = next?.nextAct?.actNo
      message.success(ended
        ? `第 ${no} 幕已演完，AI 自行接上第 ${ended} 幕`
        : `推进完成：${actStageName(next?.act?.stage)}`)
      // 有新幕时把焦点交给新幕，观众看到的就是后面继续发生的事
      pendingActNo.value = ended ?? null
    } else if (btn.action === 'replay') {
      // 重播必须看得见：把舞台拉回顶部、重置分镜指针，否则正文不动、观众以为没反应。
      // 演出稿不做任何改动，重播就是「从头再放一遍」。
      filmIndex.value = 0
      brokenShots.value = []
      showTextPlay.value = false
      cueIndex.value = 0
      cueOpen.value = []
      narrOpen.value = []
      // 重播完 AI 自己接下一幕：接口会把新开的空幕带回来，列表刷新后直接跳过去。
      awaitingPlay.value = true
      let started: WorldActAdvance | null = null
      try {
        started = await apiService.replayWorldAct(currentWorldId.value, no) as WorldActAdvance
      } finally {
        awaitingPlay.value = false
      }
      const nextNo = started?.nextAct?.actNo
      if (nextNo) pendingActNo.value = nextNo
      message.success(nextNo ? `已从头重播，AI 接上了第 ${nextNo} 幕` : '已从头重播')
      await nextTick()
      msgBoxRef.value?.scrollTo?.({ top: 0, behavior: 'smooth' })
    } else if (btn.action === 'finish') {
      await apiService.finishWorldAct(currentWorldId.value, no)
      message.success('幕次已完结')
      const view = await apiService.fetchWorldView(currentWorldId.value)
      events.value = view.events || []
      syncWorld(currentWorld.value!, view.world)
    }
    await loadActs()
    await loadStories()
    // 自动接续出来的新幕：列表刷新后直接跳到它
    if (pendingActNo.value != null) {
      const target = acts.value.find((a) => a.actNo === pendingActNo.value)
      pendingActNo.value = null
      if (target) {
        await selectAct(target)
        return
      }
    }
    if (currentAct.value) await fetchActDetail(currentAct.value.actNo as number)
  } catch (e: any) {
    message.error(e?.message || '操作失败')
  } finally {
    actProcessing.value = false
  }
}

function avatarOf(m: UIMessage) {
  const f = npcs.value.find((n) => String(n.id) === String(m.speakerId))
  return f?.displayAvatar || null
}

function eventNpcs(ev: WorldEvent) {
  if (!ev.roleIds) return []
  return ev.roleIds.split(',').map((id) => {
    const n = npcs.value.find((x) => String(x.id) === String(id.trim()))
    return n?.displayName || ''
  }).filter(Boolean)
}

/** 展示用的模型名：限定写法剥前缀 */
function displayModel(v?: string | null): string {
  const s = String(v ?? '').trim()
  if (!s) return ''
  const i = s.indexOf(':')
  return i >= 0 ? s.slice(i + 1) : s
}

function fmtDay(t?: string | null) {
  if (!t) return ''
  const d = new Date(t.replace(/-/g, '/'))
  if (Number.isNaN(d.getTime())) return ''
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

async function loadMessages() {
  if (!currentWorldId.value || currentSceneId.value == null) {
    messages.value = []
    return
  }
  const list = await apiService.fetchWorldMessages(currentWorldId.value, currentSceneId.value)
  messages.value = (list as WorldMessage[])
    .filter((m) => m.speakerType === 'system' || m.speakerType !== 'ai' || (m.content || '').trim().length > 0)
    // 后端 speakerType 三态：user / ai / system（旁白）
    .map((m) => ({
      _key: keySeq++,
      speakerType: m.speakerType,
      speakerId: m.speakerId,
      speakerName: m.speakerName,
      content: m.content || '',
      modelName: m.modelName,
      streaming: false,
    }))
  scrollBottom()
}

function scrollBottom() {
  nextTick(() => {
    if (msgBoxRef.value) msgBoxRef.value.scrollTop = msgBoxRef.value.scrollHeight
  })
}

function evSpeakerFallback(map: Map<string, UIMessage>): UIMessage | null {
  const streamings = [...map.values()].filter((m) => m.streaming)
  return streamings.length === 1 ? streamings[0] : null
}

/**
 * 后端在 create 之前就失败时（例如一个可用对话模型都没有），SSE 只会补一条带 error 的
 * finish 帧，没有任何气泡可以挂错误。这里补一个错误气泡，保证「点了发送一定看得见结果」。
 */
function pushStreamError(ev: { error?: string; speakerName?: string }) {
  messages.value.push({
    _key: keySeq++,
    speakerType: 'ai',
    speakerId: '',
    speakerName: ev.speakerName || '系统',
    content: `[错误] ${ev.error || '生成失败'}`,
    streaming: false,
  })
  scrollBottom()
}

</script>

<style scoped>
/* ============================================================================
   令牌口径与全应用统一：颜色走 --el-*，圆角走 --el-radius-*，过渡走
   var(--el-transition-duration-fast, 0.2s)。本页为「台本」三栏布局：
   左=世界，中=幕次胶片条 + 舞台，右=人物/关系/编年/舞台。
   舞台的「剧场暗黑」定版覆盖见文件末尾（必须置于末尾才能覆盖早期同选择器规则）。
   ============================================================================ */
.ws-root {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: var(--el-bg-color);
}

/* ================= 左侧世界列表 ================= */
.ws-list {
  width: 262px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}
.ws-list-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px 10px;
}
.ws-search {
  /* flex:1 的默认 min-width 是 auto，输入框的固有宽度会把这一行撑出左栏，
     折叠把手被顶到 .ws-chat 底下变成点不到（z 序被聊天面板盖住）。必须显式 0。 */
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
}
.ws-search-ico { width: 15px; height: 15px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.ws-search-input {
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-primary);
  min-width: 0;
}
.ws-search-input::placeholder { color: var(--el-text-color-placeholder); }
.ws-add {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
    transform var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-add:hover { background: var(--el-color-primary-light-8); }
.ws-add:active { transform: scale(0.94); }
.ws-list-body { flex: 1; overflow-y: auto; padding: 2px 6px 8px; }

.ws-conv {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 9px 10px;
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-conv:hover { background: var(--el-fill-color-light); }
.ws-conv.active { background: var(--el-color-primary-light-9); }
.ws-conv-avatar { flex-shrink: 0; }
.ws-conv-main { flex: 1; min-width: 0; }
.ws-conv-row1 { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ws-conv-row2 { display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 3px; }
.ws-conv-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-conv-weather {
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 1px 6px;
  border-radius: var(--el-radius-sm, 6px);
  flex-shrink: 0;
}
.ws-conv-preview {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.ws-conv-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.ws-conv-more {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-placeholder);
  border-radius: var(--el-radius-sm, 6px);
  opacity: 0;
  outline: none;
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-conv:hover .ws-conv-more { opacity: 1; }
.ws-conv-more:hover { color: var(--el-text-color-primary); background: var(--el-fill-color); }
.ws-conv-more :deep(.el-icon) { font-size: 16px; }

.ws-list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 20px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}
.ws-list-empty svg { width: 40px; height: 40px; }
.ws-list-empty p { font-size: 12.5px; margin: 0; }

/* ================= 中间：台本 ================= */
.ws-chat {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}
.ws-chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 16px;
  height: 54px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ws-chat-title-wrap { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ws-chat-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-chat-time { font-size: 12px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.ws-chat-weather {
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 1px 7px;
  border-radius: var(--el-radius-sm, 6px);
  flex-shrink: 0;
}
.ws-chat-head-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.ws-auto {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-auto-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-text-color-placeholder);
}
.ws-auto.on {
  border-color: var(--el-color-success);
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.ws-auto.on .ws-auto-dot {
  background: var(--el-color-success);
  animation: ws-pulse 1.4s ease-in-out infinite;
}
@keyframes ws-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
.ws-chat-adv {
  height: 30px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  border: 1px solid var(--el-color-primary);
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 12.5px;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-chat-adv:hover:not(:disabled) { background: var(--el-color-primary-light-3); border-color: var(--el-color-primary-light-3); }
.ws-chat-adv:disabled { opacity: 0.7; cursor: not-allowed; }
.ws-spin { display: inline-flex; }
.ws-spin .el-icon { animation: ws-rotate 1s linear infinite; }
@keyframes ws-rotate { to { transform: rotate(360deg); } }
.ws-chat-set {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  color: var(--el-text-color-secondary);
  background: transparent;
}
.ws-chat-set:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.ws-chat-set :deep(.el-icon) { font-size: 19px; }

/* ---- 幕次胶片条 ---- */
.ws-reel {
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 10px 16px 8px;
  flex-shrink: 0;
  background: var(--el-fill-color-lighter, #fafafa);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ws-reel-track {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: thin;
}
.ws-frame {
  position: relative;
  flex: 0 0 auto;
  width: 150px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  text-align: left;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-frame:hover { border-color: var(--el-color-primary-light-5); transform: translateY(-1px); }
.ws-frame.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
.ws-frame-no { font-size: 11px; color: var(--el-text-color-placeholder); }
.ws-frame.active .ws-frame-no { color: var(--el-color-primary); }
.ws-frame-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-frame-foot { display: flex; align-items: center; gap: 5px; margin-top: 2px; }
.ws-stage-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-text-color-placeholder);
  flex-shrink: 0;
}
.ws-stage-dot.primary { background: var(--el-color-primary); }
.ws-stage-dot.info { background: var(--el-color-info); }
.ws-stage-dot.warning { background: var(--el-color-warning); }
.ws-stage-dot.success { background: var(--el-color-success); }
.ws-stage-dot.danger { background: var(--el-color-danger); }
.ws-frame-stage { font-size: 11px; color: var(--el-text-color-secondary); }
.ws-frame-progress { margin-left: auto; font-size: 10.5px; color: var(--el-text-color-placeholder); }
.ws-frame-add {
  width: 40px;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: var(--el-text-color-secondary);
}
.ws-frame-add:hover { color: var(--el-color-primary); border-color: var(--el-color-primary); }
.ws-reel-side { display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 4px; flex-shrink: 0; }
.ws-reel-count { font-size: 11.5px; color: var(--el-text-color-placeholder); white-space: nowrap; }
.ws-act-create {
  height: 24px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 9px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 11.5px;
  cursor: pointer;
  white-space: nowrap;
}
.ws-act-create:hover { color: var(--el-color-primary); border-color: var(--el-color-primary); }

/* ---- 舞台 ---- */
.ws-stage {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 22px 20px;
  background: var(--el-fill-color);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ws-act-back { color: var(--el-color-primary); }
.ws-act-head-main { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
.ws-act-head-no { font-size: 11.5px; color: var(--el-color-primary); }
.ws-act-head-title {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ws-act-head-ops { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.btn {
  font: inherit;
  height: 28px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.btn:hover:not(:disabled) { border-color: var(--el-color-primary-light-5); color: var(--el-color-primary); }
.btn.primary {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.btn.primary:hover:not(:disabled) { background: var(--el-color-primary-light-3); color: var(--el-color-white); }
.btn.ghost { border-color: transparent; background: transparent; color: var(--el-text-color-secondary); }
.btn:disabled { opacity: 0.55; cursor: not-allowed; }

/* ---- 舞台放映：分镜视频连播 ---- */
/* 尺寸都收在舞台这一栏里：竖屏按高度约束，横屏按宽度约束，不撑破台本三栏 */
.ws-film {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 760px;
}
.ws-film-stage {
  position: relative;
  background: #0d0f12;
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
  display: flex;
  justify-content: center;
}
.ws-film-video {
  display: block;
  width: 100%;
  max-height: 420px;
  object-fit: contain;
  background: #000;
}
.ws-film-badge {
  position: absolute;
  left: 10px;
  top: 10px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11.5px;
  color: #fff;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: none;
}
/* 缩略条：每一段分镜一格，点哪格播哪段；播完自动接下一格 */
.ws-film-strip {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ws-film-thumb {
  position: relative;
  width: 92px;
  height: 56px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 6px;
  overflow: hidden;
  background: var(--el-fill-color-light);
  cursor: pointer;
}
.ws-film-thumb.active { border-color: var(--el-color-primary); }
.ws-film-thumb.broken { opacity: 0.45; }
.ws-film-thumb.broken::after {
  content: '!';
  position: absolute;
  right: 3px;
  bottom: 2px;
  font-size: 11px;
  font-weight: 700;
  color: var(--el-color-danger);
  background: rgba(255, 255, 255, 0.8);
  border-radius: 3px;
  padding: 0 3px;
}
.ws-film-broken {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  color: #fff;
  background: rgba(0, 0, 0, 0.62);
  pointer-events: none;
}
.ws-film-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ws-film-thumb-no {
  position: absolute;
  left: 4px;
  top: 2px;
  font-size: 11px;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
}
.ws-film-thumb-name {
  display: block;
  padding: 6px 6px 0;
  font-size: 11px;
  line-height: 1.3;
  color: var(--el-text-color-regular);
  text-align: left;
}
.ws-film-to-text {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: transparent;
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
}
.ws-film-to-text:hover { color: var(--el-color-primary); border-color: var(--el-color-primary); }

/* ---- 演出正文：一屏一场的舞台 ---- */
.ws-play {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ws-cue {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
  min-height: 400px;
  max-height: 620px;
  /* 台头在幕次视图里是流内元素（见文件末尾 .ws-stage.is-act 覆盖），
     58px 的上内边距只会在台头上方留一条空白带，收到 6px */
  padding: 6px 22px 18px;
  border-radius: 14px;
  overflow: hidden;
  background: #12161f;
  color: #fff;
  isolation: isolate;
  animation: ws-cue-in 0.32s ease;
}
.ws-cue-img {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
}
/* 剧照上不放遮幕：台词气泡与旁白各自带底色，再叠一层只会把整块画面压成黑 */
.ws-cue > *:not(.ws-cue-img) { position: relative; z-index: 2; }

.ws-cue-head {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 14px 18px;
  background: linear-gradient(180deg, rgba(6, 8, 12, 0.72), transparent);
  z-index: 3;
}
.ws-cue-no {
  flex: none;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  color: #ffd88a;
  font-family: var(--el-font-family, inherit);
}
.ws-cue-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-cue-where {
  flex: none;
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.62);
}
.ws-cue-count {
  margin-left: auto;
  flex: none;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.68);
  font-variant-numeric: tabular-nums;
}

.ws-cue-cast {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 0 1 auto;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.28) transparent;
}
.ws-cue-cast::-webkit-scrollbar { width: 4px; }
.ws-cue-cast::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.28); border-radius: 4px; }
.ws-cue-in {
  align-self: flex-start;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(10, 14, 22, 0.42);
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.66);
}
.ws-cue-line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 84%;
  font-size: 13.5px;
  line-height: 1.7;
}
.ws-cue-line.left { align-self: flex-start; }
.ws-cue-line.right { align-self: flex-end; flex-direction: row-reverse; }
.ws-cue-ava {
  flex: none;
  margin-top: 2px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.18);
}
.ws-cue-bubble {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 100%;
  padding: 7px 12px 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(14, 18, 28, 0.72);
  backdrop-filter: blur(6px);
}
.ws-cue-line.left .ws-cue-bubble { border-top-left-radius: 4px; }
.ws-cue-line.right .ws-cue-bubble { border-top-right-radius: 4px; }
.ws-cue-who {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  color: #9fc4ff;
}
.ws-cue-say {
  color: #fff;
  word-break: break-word;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}
.ws-cue-more {
  align-self: center;
  padding: 2px 10px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  background: rgba(10, 14, 22, 0.42);
  font-size: 11.5px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
}
.ws-cue-more:hover { border-color: rgba(255, 255, 255, 0.5); color: #fff; }

.ws-cue-narr {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(8, 11, 18, 0.6);
  backdrop-filter: blur(6px);
  font-size: 12.5px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.86);
}
.ws-cue-narr-k {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.9;
  color: #ffd88a;
}
.ws-cue-narr-t {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}
.ws-cue-narr.open .ws-cue-narr-t {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}
.ws-cue-narr-more {
  flex: none;
  margin-left: auto;
  padding: 0 2px;
  border: 0;
  background: transparent;
  font-size: 11.5px;
  color: #9fc4ff;
  cursor: pointer;
}
.ws-cue-narr-more:hover { color: #fff; }

/* 一屏一场的翻页：翻页已上移到台头，舞台里只保留箭头样式给台头复用 */
.ws-cue-arrow {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
}
.ws-cue-arrow:hover:not(:disabled) { color: var(--el-color-primary); border-color: var(--el-color-primary); }
.ws-cue-arrow:disabled { opacity: 0.35; cursor: default; }

@keyframes ws-cue-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: none; }
}
@media (max-width: 720px) {
  .ws-cue { min-height: 440px; padding: 6px 14px 14px; }
}
@media (prefers-reduced-motion: reduce) {
  .ws-cue { animation: none; }
}

/* ---- 舞台空态 ---- */
.ws-stage-empty {
  margin: 24px auto 0;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.ws-stage-empty-art {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  margin-bottom: 4px;
}
.ws-stage-empty-art svg { width: 28px; height: 28px; }
.ws-stage-empty-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); }
.ws-stage-empty-sub { margin: 0 0 6px; font-size: 12.5px; }

/* ---- 剧本 / 素材 ---- */
/* ---- 剧本：已改为弹框查看（见文件末尾 .ws-script-* 覆盖），舞台不再内联接口原文 ---- */
.ws-mini {
  width: 20px;
  height: 20px;
  border: 0;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
}
.ws-mini:hover { background: var(--el-fill-color-light); }

/* ---- 标签 ---- */
.ws-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}
.ws-tag.sm { font-size: 10.5px; padding: 0 6px; }
.ws-tag.primary { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.ws-tag.info { background: var(--el-color-info-light-9); color: var(--el-color-info); }
.ws-tag.warning { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.ws-tag.success { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.ws-tag.danger { background: var(--el-color-danger-light-9); color: var(--el-color-danger); }

/* ---- 对话视图 ---- */
.ws-scene-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 0 2px;
  flex-shrink: 0;
}
.ws-scene-tabs { display: flex; align-items: center; gap: 6px; overflow-x: auto; }
.ws-scene-tab {
  flex-shrink: 0;
  height: 26px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 12.5px;
}
.ws-scene-tab:hover { color: var(--el-text-color-primary); }
.ws-scene-tab.active { background: var(--el-color-primary); color: var(--el-color-white); }
.ws-scene-add {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
}
.ws-scene-add:hover { color: var(--el-color-primary); border-color: var(--el-color-primary); }
.ws-scene-count { font-size: 12px; color: var(--el-text-color-secondary); flex-shrink: 0; }

.ws-msgs { display: flex; flex-direction: column; }
.ws-msg { display: flex; align-items: flex-start; margin-bottom: 18px; }
.ws-msg.is-other { justify-content: flex-start; }
.ws-msg.is-self { justify-content: flex-end; }
.ws-msg.is-narr { justify-content: center; }
.ws-msg-avatar { flex-shrink: 0; }
.ws-msg-col { max-width: 66%; min-width: 0; margin: 0 10px; }
.is-self .ws-msg-col { display: flex; flex-direction: column; align-items: flex-end; }

/* 旁白：居中、无气泡，像小说里的叙述段 */
.ws-narr {
  max-width: 78%;
  padding: 10px 16px;
  border-left: 3px solid var(--el-color-primary-light-5);
  border-radius: 0 var(--el-radius-md, 8px) var(--el-radius-md, 8px) 0;
  background: var(--el-color-primary-light-9);
  color: var(--el-text-color-regular);
  font-size: 13px;
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
}

.ws-msg-meta { display: flex; align-items: center; gap: 7px; margin: 0 0 5px 2px; flex-wrap: wrap; }
.ws-msg-name { font-size: 12px; color: var(--el-text-color-secondary); }
.ws-msg-typing { font-size: 11.5px; color: var(--el-color-primary); }
.ws-msg-model {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  padding: 1px 7px;
  border-radius: var(--el-radius-sm, 6px);
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-bubble {
  position: relative;
  padding: 9px 13px;
  border-radius: var(--el-radius-lg, 12px);
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
  overflow-wrap: anywhere;
}
.ws-msg.is-other .ws-bubble.typing-bubble { min-height: 44px; display: flex; align-items: center; }
.typing-dots { display: inline-flex; align-items: center; gap: 4px; margin-left: 6px; vertical-align: bottom; }
.typing-dots i {
  width: 6px;
  height: 6px;
  border-radius: var(--el-radius-full, 9999px);
  background-color: currentColor;
  opacity: 0.75;
  animation: ws-typing-bounce 1.4s infinite ease-in-out both;
}
.typing-dots i:nth-child(1) { animation-delay: -0.32s; }
.typing-dots i:nth-child(2) { animation-delay: -0.16s; }
@keyframes ws-typing-bounce {
  0%, 80%, 100% { transform: scale(0.35); opacity: 0.4; }
  40% { transform: scale(1); opacity: 0.9; }
}
.b-other { background: var(--el-bg-color); color: var(--el-text-color-primary); border: 1px solid var(--el-border-color-lighter); }
.b-self { background: var(--el-color-primary); color: var(--el-color-white); }
.ws-plain { white-space: pre-wrap; }
.b-other :deep(.markdown-text) { margin: 0; }
.b-other :deep(.markdown-text p) { margin: 0 0 6px; }
.b-other :deep(.markdown-text p:last-child) { margin-bottom: 0; }
.b-self :deep(.markdown-text p) { margin: 0 0 6px; }

.ws-msgs-empty { text-align: center; padding: 48px 20px; color: var(--el-text-color-placeholder); }
.ws-msgs-empty p { font-size: 13.5px; margin: 0 0 6px; }
.ws-msgs-empty .sub { font-size: 12px; }
/* 空态里给一个真正能点的起点：新世界没有幕次时，用户不该自己去找「+」 */
.ws-empty-cta { margin-top: 14px; }

/* ---- 底部输入 ---- */
.ws-input {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 16px 12px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}
.ws-watch-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.ws-watch-hint { font-size: 12px; color: var(--el-text-color-placeholder); line-height: 1.6; }

.ws-chat-placeholder { flex: 1; display: flex; align-items: center; justify-content: center; }
.ph-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--el-text-color-placeholder); }
.ph-inner svg { width: 48px; height: 48px; }
.ph-inner p { font-size: 13.5px; margin: 0; }

/* ================= 右侧 ================= */
.ws-side {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
}
.ws-side-tabs { display: flex; border-bottom: 1px solid var(--el-border-color-lighter); flex-shrink: 0; }
.ws-side-tabs button {
  flex: 1;
  height: 40px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}
.ws-side-tabs button:hover { color: var(--el-text-color-primary); }
.ws-side-tabs button.active { color: var(--el-color-primary); border-bottom-color: var(--el-color-primary); }
.ws-side-body { flex: 1; overflow-y: auto; padding: 12px; }
.ws-side-hint { font-size: 11.5px; color: var(--el-text-color-placeholder); margin-bottom: 10px; line-height: 1.6; }
.ws-side-empty { padding: 32px 12px; text-align: center; font-size: 12.5px; color: var(--el-text-color-secondary); }

/* 人物 */
.cast-item {
  display: flex;
  gap: 10px;
  padding: 9px 8px;
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.cast-item:hover { background: var(--el-fill-color-light); }
.cast-main { flex: 1; min-width: 0; }
.cast-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.cast-sub { font-size: 11px; color: var(--el-text-color-placeholder); margin-top: 1px; }
.cast-model {
  margin-left: 6px;
  padding: 0 5px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 10.5px;
  white-space: nowrap;
}
.cast-persona {
  margin-top: 3px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 关系 */
.rel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 6px;
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
}
.rel-item:hover { background: var(--el-fill-color-light); }
.rel-avatar { flex-shrink: 0; }
.rel-main { flex: 1; min-width: 0; }
.rel-names { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--el-text-color-primary); }
.rel-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rel-arrow { color: var(--el-text-color-placeholder); }
.rel-memo {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rel-bar-wrap {
  position: relative;
  height: 6px;
  margin-top: 6px;
  background: var(--el-fill-color);
  border-radius: var(--el-radius-full, 9999px);
}
.rel-bar {
  height: 100%;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-text-color-placeholder);
  transition: width var(--el-transition-duration-fast, 0.2s) ease;
}
.rel-bar.good { background: var(--el-color-success); }
.rel-bar.mid { background: var(--el-color-primary); }
.rel-bar.cool { background: var(--el-color-warning); }
.rel-bar.bad { background: var(--el-color-danger); }
.rel-val {
  position: absolute;
  right: 0;
  top: -3px;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder);
}

/* 编年 */
.tl-item { padding: 10px 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.tl-item:last-child { border-bottom: 0; }
.tl-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.tl-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.tl-time { font-size: 11px; color: var(--el-text-color-placeholder); flex-shrink: 0; }
.tl-content {
  margin-top: 5px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-word;
}
.tl-npcs { margin-top: 6px; font-size: 11px; color: var(--el-color-primary); }

/* 舞台 / 场景与角色管理 */
.ws-mg-section { margin-bottom: 18px; }
.ws-mg-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.ws-mg-title { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
.ws-mg-add {
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}
.ws-mg-add:hover { border-color: var(--el-color-primary); }
.ws-mg-scene { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: var(--el-radius-md, 8px); }
.ws-mg-scene:hover { background: var(--el-fill-color-light); }
.ws-mg-scene-name {
  flex: 1;
  font-size: 12.5px;
  color: var(--el-text-color-primary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
.ws-mg-scene-count { font-size: 11px; color: var(--el-text-color-placeholder); }
.ws-mg-npc { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--el-radius-md, 8px); cursor: pointer; }
.ws-mg-npc:hover { background: var(--el-fill-color-light); }
.ws-mg-npc-main { flex: 1; min-width: 0; }
.ws-mg-npc-name {
  font-size: 12.5px;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-mg-npc-sub { font-size: 11px; color: var(--el-text-color-placeholder); }
.ws-mg-npc-switch {
  flex-shrink: 0;
  display: inline-flex;
  width: auto;
  height: auto;
  background: transparent;
  padding: 0;
}
.ws-mg-del {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  font-size: 11px;
  opacity: 0;
}
.ws-mg-scene:hover .ws-mg-del, .ws-mg-npc:hover .ws-mg-del { opacity: 1; }
.ws-mg-del:hover { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }

/* ================= 对话框 ================= */
.ws-dialog :deep(.el-dialog__header) { padding-bottom: 8px; }
.ws-dlg-title { font-size: 15px; font-weight: 600; }
.ws-form { display: flex; flex-direction: column; gap: 14px; }
/* 设置弹框分组标题：把「世界观 / 出片 / 导演与演员」分开，字段多时不至于糊成一列 */
.ws-form-sec {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 2px 0 -4px;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--el-color-primary);
}
.ws-form-sec::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}
/* 左右两栏：左侧窄（身份/场景/开关），右侧宽（人设/关系） */
.ws-form-split {
  flex-direction: row;
  align-items: stretch;
  gap: 20px;
}
.ws-form-split .ws-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.ws-form-split .ws-col:first-child {
  flex: 0 0 210px;
  padding-right: 18px;
  border-right: 1px solid var(--el-border-color-lighter);
}
.ws-form-split .ws-col:last-child { flex: 1 1 auto; }
.ws-form-split .ws-col-head {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--el-text-color-placeholder);
  padding-bottom: 2px;
}
.ws-field { display: flex; flex-direction: column; gap: 6px; }
.ws-label { font-size: 12.5px; color: var(--el-text-color-secondary); }
.ws-hint { display: block; font-size: 11.5px; color: var(--el-text-color-placeholder); line-height: 1.5; }
.ws-eras, .ws-seeds { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
.ws-era-tag, .ws-seed {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  max-width: 128px;
  padding: 6px 12px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12.5px;
  cursor: pointer;
  user-select: none;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-era-tag:hover, .ws-seed:hover { border-color: var(--el-color-primary-light-5); color: var(--el-color-primary); }
.ws-era-tag.active, .ws-seed.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 角色微调里的关系滑杆 */
.npc-rel { display: flex; align-items: center; gap: 8px; padding: 2px 0; }
.npc-rel-name { font-size: 12px; color: var(--el-text-color-regular); flex: 0 0 64px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.npc-rel-slider { flex: 1; }
.npc-rel-val { font-size: 11.5px; color: var(--el-text-color-placeholder); flex: 0 0 34px; text-align: right; }

@media (max-width: 1280px) {
  .ws-side { width: 264px; }
  .ws-list { width: 232px; }
}
@media (max-width: 820px) {
  .ws-form-split { flex-direction: column; gap: 14px; }
  .ws-form-split .ws-col:first-child {
    flex: none;
    padding-right: 0;
    padding-bottom: 14px;
    border-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
}

/* ============================================================================
   剧场暗黑 · 沉浸舞台（第一套定版）
   —— 覆盖块必须位于 <style> 末尾，才能压过前面同选择器规则。
   DOM 与选择器不变（验收脚本依赖）；只重写舞台的视觉，全部走 koi 变量
   （--el-* 与 color-mix），浅色主题=暖幕剧场，深色主题=聚光黑场。
   ============================================================================ */
.ws-stage {
  background:
    radial-gradient(120% 90% at 50% -10%, color-mix(in srgb, var(--el-color-warning) 9%, transparent) 0%, transparent 55%),
    linear-gradient(180deg, var(--el-fill-color-dark) 0%, var(--el-fill-color) 55%, var(--el-bg-color) 100%);
}
.ws-chat-head {
  background: linear-gradient(180deg, var(--el-bg-color) 0%, var(--el-fill-color-light) 100%);
  position: relative;
}
.ws-chat-head::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--el-color-primary-light-5), transparent);
  opacity: 0.5;
}
.ws-reel {
  background: linear-gradient(180deg, var(--el-fill-color-light), var(--el-bg-color));
  border-bottom: 1px solid var(--el-border-color-lighter);
}
/* 场次翻页箭头：台头深底上的样式见文件末尾 */
.ws-cue-arrow:hover:not(:disabled) { color: var(--el-color-primary); border-color: var(--el-color-primary-light-5); }
/* 台词作者：主色提词器 */
.ws-cue-who { color: var(--el-color-primary-light-3); }
/* 旁白前缀：暖金提灯色 */
.ws-cue-narr-k { color: var(--el-color-warning); }
/* 台词与旁白容器：玻璃暗幕 */
.ws-cue-bubble {
  background: color-mix(in srgb, var(--el-bg-color) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 55%, transparent);
  box-shadow: 0 6px 18px color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.ws-cue-narr {
  background: color-mix(in srgb, var(--el-bg-color) 76%, transparent);
  border-color: color-mix(in srgb, var(--el-border-color) 50%, transparent);
}
.ws-cue-in {
  border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 9%, transparent);
  color: var(--el-text-color-regular);
}
.ws-cue-ava { box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 22%, transparent); }
.ws-stage-empty-art {
  background: color-mix(in srgb, var(--el-color-warning) 8%, var(--el-fill-color-light));
  border-radius: 50%;
}
/* 底部观演控制轨：像舞台脚灯 */
.ws-watch-bar {
  border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 22%, transparent);
  padding-top: 8px;
}
/* 演出正文文字：跟随主题，不留硬编码白 */
.ws-cue-say { color: var(--el-text-color-primary); text-shadow: none; }
.ws-cue-no, .ws-cue-title { color: var(--el-text-color-primary); }
.ws-cue-count { color: var(--el-text-color-secondary); }
.ws-cue-where { color: var(--el-text-color-secondary); }

/* ============================================================================
   剧场暗黑 v2 —— 与 UI 图对齐：整个舞台区都是深色沉浸（不只是正文块）。
   左右栏保持 koi 浅色；舞台容器用 koi 变量混合出深色，浅色/深色主题都能看。
   ============================================================================ */
.ws-stage {
  background:
    radial-gradient(120% 90% at 50% -10%, color-mix(in srgb, var(--el-color-warning) 12%, transparent) 0%, transparent 55%),
    linear-gradient(180deg,
      color-mix(in srgb, var(--el-color-black) 78%, var(--el-bg-color)) 0%,
      color-mix(in srgb, var(--el-color-black) 88%, var(--el-bg-color)) 60%,
      color-mix(in srgb, var(--el-color-black) 94%, var(--el-bg-color)) 100%);
}
/* 幕次标题在台头状态条上：深底白字 */
.ws-act-head-title { color: var(--el-color-white); }
.ws-act-head-no { color: var(--el-color-primary-light-5); }
/* 空态：深底白字 */
.ws-stage-empty-title { color: var(--el-color-white); }
.ws-stage-empty-sub { color: color-mix(in srgb, var(--el-color-white) 68%, transparent); }
.ws-stage-empty-art {
  background: color-mix(in srgb, var(--el-color-warning) 16%, transparent);
  border-radius: 50%;
  color: var(--el-color-warning);
}
/* 场次键盘提示、观演提示在深底上的颜色 */
/* 底部观演轨：深色上的脚灯 */
.ws-watch-bar {
  border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 38%, transparent);
  background: color-mix(in srgb, var(--el-color-black) 80%, transparent);
  padding-top: 8px;
}
.ws-watch-hint { color: color-mix(in srgb, var(--el-color-white) 64%, transparent); }
.ws-watch-bar .btn.primary {
  border-color: var(--el-color-warning);
  background: var(--el-color-warning);
  color: var(--el-color-white);
}
.ws-watch-bar .btn.primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--el-color-warning) 84%, var(--el-color-white));
  color: var(--el-color-white);
}

/* ============================================================================
   时间轴胶片台（第 1 套）
   —— 结构：场记板式台头 + 贯穿的胶片带（带齿孔） + 深色舞台 + 底部演员轨。
   与「剧场暗黑」定版是同一套主题变量口径，只换骨架：胶片带成为页面的第一视觉，
   舞台吃满剩余高度，角色不再只藏在右栏，而是常驻舞台脚下的演员轨。
   ============================================================================ */
/* ---- 1. 台头：一块深色场记板，与胶片带连成一条 ---- */
.ws-chat-head {
  height: 50px;
  background: color-mix(in srgb, var(--el-color-black) 90%, var(--el-bg-color));
  border-bottom: 0;
}
.ws-chat-head::after { display: none; }
.ws-chat-name { color: var(--el-color-white); }
.ws-chat-time { color: color-mix(in srgb, var(--el-color-white) 62%, transparent); }
.ws-chat-head :deep(.el-tag) {
  background: color-mix(in srgb, var(--el-color-white) 10%, transparent);
  border-color: color-mix(in srgb, var(--el-color-white) 22%, transparent);
  color: color-mix(in srgb, var(--el-color-white) 88%, transparent);
}
.ws-chat-weather {
  color: var(--el-color-warning);
  background: color-mix(in srgb, var(--el-color-warning) 16%, transparent);
}
.ws-auto {
  background: transparent;
  border-color: color-mix(in srgb, var(--el-color-white) 22%, transparent);
  color: color-mix(in srgb, var(--el-color-white) 78%, transparent);
}
.ws-auto:hover {
  border-color: color-mix(in srgb, var(--el-color-warning) 60%, transparent);
  color: var(--el-color-white);
}
.ws-auto.on {
  background: color-mix(in srgb, var(--el-color-success) 20%, transparent);
  border-color: var(--el-color-success);
  color: color-mix(in srgb, var(--el-color-success) 42%, var(--el-color-white));
}
.ws-chat-set { color: color-mix(in srgb, var(--el-color-white) 70%, transparent); }
.ws-chat-set:hover {
  background: color-mix(in srgb, var(--el-color-white) 12%, transparent);
  color: var(--el-color-white);
}

/* ---- 2. 胶片带：上下齿孔 + 一格一幕，当前幕是暖色放映头 ---- */
.ws-reel {
  position: relative;
  gap: 12px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--el-color-black) 86%, var(--el-bg-color));
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 26%, transparent);
}
.ws-reel::before,
.ws-reel::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  height: 5px;
  border-radius: 2px;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    90deg,
    color-mix(in srgb, var(--el-color-white) 16%, transparent) 0 9px,
    transparent 9px 19px
  );
}
.ws-reel::before { top: 4px; }
.ws-reel::after { bottom: 4px; }
.ws-reel-track { gap: 7px; padding-bottom: 0; }
.ws-frame {
  width: 132px;
  padding: 7px 9px;
  border-radius: var(--el-radius-md, 8px);
  background: color-mix(in srgb, var(--el-color-white) 6%, transparent);
  border-color: color-mix(in srgb, var(--el-color-white) 14%, transparent);
}
.ws-frame:hover {
  border-color: color-mix(in srgb, var(--el-color-warning) 60%, transparent);
  transform: translateY(-1px);
}
.ws-frame.active {
  background: color-mix(in srgb, var(--el-color-warning) 20%, transparent);
  border-color: var(--el-color-warning);
  box-shadow:
    0 0 0 1px var(--el-color-warning) inset,
    0 4px 16px color-mix(in srgb, var(--el-color-warning) 22%, transparent);
}
.ws-frame-no { color: color-mix(in srgb, var(--el-color-white) 52%, transparent); }
.ws-frame.active .ws-frame-no { color: var(--el-color-warning); }
.ws-frame-name { color: var(--el-color-white); }
.ws-frame-stage { color: color-mix(in srgb, var(--el-color-white) 62%, transparent); }
.ws-frame-progress { color: color-mix(in srgb, var(--el-color-white) 46%, transparent); }
.ws-frame-add {
  color: color-mix(in srgb, var(--el-color-white) 60%, transparent);
  border-color: color-mix(in srgb, var(--el-color-white) 20%, transparent);
}
.ws-frame-add:hover { color: var(--el-color-warning); border-color: var(--el-color-warning); }
.ws-reel-count { color: color-mix(in srgb, var(--el-color-white) 50%, transparent); }
.ws-act-create {
  color: color-mix(in srgb, var(--el-color-white) 66%, transparent);
  border-color: color-mix(in srgb, var(--el-color-white) 24%, transparent);
}
.ws-act-create:hover { color: var(--el-color-warning); border-color: var(--el-color-warning); }

/* ---- 3. 底部演员轨：常驻，角色就在舞台脚下 ---- */
.ws-input {
  gap: 6px;
  padding: 8px 16px 10px;
  background: color-mix(in srgb, var(--el-color-black) 92%, var(--el-bg-color));
  border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 24%, transparent);
}
.ws-track {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.ws-track::-webkit-scrollbar { height: 0; }
.ws-track-k {
  flex-shrink: 0;
  margin-right: 2px;
  font-size: 10.5px;
  letter-spacing: 0.14em;
  color: color-mix(in srgb, var(--el-color-white) 40%, transparent);
}
.ws-track-chip {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px 2px 2px;
  border: 1px solid color-mix(in srgb, var(--el-color-white) 14%, transparent);
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--el-color-white) 5%, transparent);
  color: color-mix(in srgb, var(--el-color-white) 74%, transparent);
  font-size: 11.5px;
  cursor: pointer;
  transition: border-color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-track-chip:hover {
  border-color: var(--el-color-warning);
  color: var(--el-color-white);
}
.ws-track-chip.on {
  border-color: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  color: var(--el-color-white);
}
.ws-track-chip.off { opacity: 0.45; }
.ws-track-name {
  max-width: 82px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-track-model {
  padding: 0 4px;
  border-radius: 3px;
  font-size: 9.5px;
  line-height: 1.6;
  background: color-mix(in srgb, var(--el-color-warning) 24%, transparent);
  color: var(--el-color-warning);
}
.ws-track-empty { font-size: 11.5px; color: color-mix(in srgb, var(--el-color-white) 40%, transparent); }
.ws-track-grow { flex: 1; min-width: 8px; }
.ws-watch-bar { padding-top: 2px; border-top: 0; background: transparent; }
/* 幕次视图不再需要这行说明：状态与操作都在台头，底部只留演员轨 */
.ws-input.is-act .ws-watch-bar { display: none; }

/* ============================================================================
   布局腾挪（第 1 套续改）
   1) 左右两栏可折叠，舞台边缘留展开把手；
   2) 台头拆两层：世界信息在上，幕次状态/进度/切场/幕次操作在下，正文吃满高度；
   3) 幕次视图舞台全出血，生图直接当背景；看剧本改为结构化弹框。
   ============================================================================ */

/* ---- 1. 左右折叠 ---- */
.ws-list,
.ws-side {
  transition: width var(--el-transition-duration, 0.3s) ease;
}
.ws-list.collapsed,
.ws-side.collapsed {
  width: 0;
  overflow: hidden;
}
.ws-list.collapsed { border-right-color: transparent; }
.ws-side.collapsed { border-left-color: transparent; }
/* 宽度收拢后内容立即隐藏，避免 0 宽度时文字挤出边框 */
.ws-list.collapsed > *,
.ws-side.collapsed > * {
  opacity: 0;
  pointer-events: none;
}
.ws-fold-btn {
  width: 26px;
  height: 26px;
  flex: none;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  transition: color var(--el-transition-duration-fast, 0.2s) ease,
    background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-fold-btn:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
.ws-fold-btn :deep(.el-icon) { font-size: 15px; }
/* 右栏折叠按钮：四个页签等分后单独占一格，不与页签抢宽度 */
.ws-side-tabs .ws-side-fold {
  flex: 0 0 34px;
  border-bottom: 0;
  border-left: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-placeholder);
}
.ws-side-tabs .ws-side-fold:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
/* 舞台两侧的展开把手：竖条贴在边缘，不参与布局 */
.ws-chat { position: relative; }
.ws-edge {
  position: absolute;
  top: 50%;
  z-index: 7;
  width: 16px;
  height: 62px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  border: 1px solid color-mix(in srgb, var(--el-color-white) 16%, transparent);
  background: color-mix(in srgb, var(--el-color-black) 72%, transparent);
  color: color-mix(in srgb, var(--el-color-white) 78%, transparent);
  cursor: pointer;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-edge-left { left: 0; border-left: 0; border-radius: 0 8px 8px 0; }
.ws-edge-right { right: 0; border-right: 0; border-radius: 8px 0 0 8px; }
.ws-edge:hover { background: var(--el-color-warning); color: var(--el-bg-color); }
.ws-edge :deep(.el-icon) { font-size: 13px; }

/* ---- 2. 台头两层：世界信息 + 幕次状态条 ---- */
.ws-chat-head {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: 0;
  height: auto;
  padding: 0;
}
.ws-head-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  height: 50px;
  padding: 0 12px 0 16px;
}
.ws-head-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  padding: 6px 12px 7px 16px;
  border-top: 1px solid color-mix(in srgb, var(--el-color-white) 9%, transparent);
  background: color-mix(in srgb, var(--el-color-black) 84%, var(--el-bg-color));
}
.ws-head-status .ws-act-head-main {
  flex: 1;
  min-width: 0;
  flex-wrap: nowrap;
  overflow: hidden;
  gap: 8px;
}
.ws-head-status .ws-act-head-title {
  min-width: 0;
  max-width: 34%;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-head-status .ws-tag {
  flex: none;
  background: color-mix(in srgb, var(--el-color-white) 12%, transparent);
  color: color-mix(in srgb, var(--el-color-white) 88%, transparent);
}
.ws-status-meter {
  flex: none;
  width: 76px;
  height: 4px;
  border-radius: var(--el-radius-full, 9999px);
  background: color-mix(in srgb, var(--el-color-white) 14%, transparent);
  overflow: hidden;
}
.ws-status-meter i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--el-color-warning);
  transition: width var(--el-transition-duration, 0.3s) ease;
}
.ws-status-num {
  flex: none;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--el-color-white) 62%, transparent);
}
.ws-status-total {
  flex: none;
  font-size: 11px;
  color: color-mix(in srgb, var(--el-color-white) 42%, transparent);
}
.ws-status-busy {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  max-width: 220px;
  font-size: 11.5px;
  color: var(--el-color-warning);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-head-status-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}
.ws-status-pager {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: none;
}
.ws-status-pager .ws-cue-arrow {
  width: 22px;
  height: 22px;
  border-radius: var(--el-radius-sm, 6px);
  border-color: color-mix(in srgb, var(--el-color-white) 18%, transparent);
  color: color-mix(in srgb, var(--el-color-white) 72%, transparent);
  font-size: 13px;
}
.ws-status-pager .ws-cue-arrow:hover:not(:disabled) {
  color: var(--el-color-warning);
  border-color: var(--el-color-warning);
}
.ws-status-pager .ws-cue-arrow:disabled { opacity: 0.3; }
.ws-pager-n {
  min-width: 34px;
  text-align: center;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: color-mix(in srgb, var(--el-color-white) 64%, transparent);
}
.ws-head-status .ws-act-head-ops { gap: 6px; flex-wrap: nowrap; }
.ws-head-status .btn {
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
}
.ws-head-status .btn.ghost {
  color: color-mix(in srgb, var(--el-color-white) 74%, transparent);
  border-color: transparent;
}
.ws-head-status .btn.ghost:hover:not(:disabled) {
  color: var(--el-color-white);
  background: color-mix(in srgb, var(--el-color-white) 10%, transparent);
}
.ws-head-status .ws-act-stage-btn:not(.primary) {
  background: transparent;
  border-color: color-mix(in srgb, var(--el-color-white) 20%, transparent);
  color: color-mix(in srgb, var(--el-color-white) 84%, transparent);
}
.ws-head-status .ws-act-stage-btn:not(.primary):hover:not(:disabled) {
  border-color: var(--el-color-warning);
  color: var(--el-color-warning);
}
.ws-head-status .btn.primary {
  background: var(--el-color-warning);
  border-color: var(--el-color-warning);
  color: var(--el-color-white);
}
.ws-head-status .btn.primary:hover:not(:disabled) {
  background: color-mix(in srgb, var(--el-color-warning) 84%, var(--el-color-white));
  color: var(--el-color-white);
}
/* 三栏都在时台头第二行很挤：先让次要数字退场，标题和操作始终看得见 */
@media (max-width: 1400px) {
  .ws-status-total { display: none; }
}
@media (max-width: 1280px) {
  .ws-status-num { display: none; }
  .ws-head-status .ws-act-head-title { max-width: 26%; }
}

/* ---- 3. 幕次舞台全出血：生图铺满整个内容区当背景 ---- */
.ws-stage.is-act {
  padding: 0;
  gap: 0;
  overflow-y: auto;
  background: color-mix(in srgb, var(--el-color-black) 90%, var(--el-bg-color));
}
.ws-stage.is-act .ws-play { flex: 1; min-height: 0; gap: 0; }
.ws-stage.is-act .ws-cue {
  flex: 1;
  min-height: 0;
  max-height: none;
  /* 内容超出时从头顺排并滚动：配合上面 justify-content: flex-end 会把首行甩到卡片外，
     末行（旁白）也会被压成半行 */
  justify-content: flex-start;
  overflow-y: auto;
  border-radius: 0;
  padding-bottom: 22px;
  animation: none;
}
/* 台词与旁白按自然高度排版：宁可滚动，也不能让 flex 把旁白压扁截断 */
.ws-stage.is-act .ws-cue-head,
.ws-stage.is-act .ws-cue-cast,
.ws-stage.is-act .ws-cue-narr {
  flex-shrink: 0;
}
/* 大屏上台词不横跨整块屏：居中一栏，两侧留给画面 */
.ws-stage.is-act .ws-cue-cast,
.ws-stage.is-act .ws-cue-narr {
  width: 100%;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}
/* 不满一屏时仍贴底，保留原来的舞台字幕感 */
.ws-stage.is-act .ws-cue-cast { margin-top: auto; }
.ws-stage.is-act .ws-cue-head { padding: 14px 24px; }
/* 视频与空态仍留边距：它们不是背景，贴边会顶到台头 */
.ws-stage.is-act .ws-film {
  width: 100%;
  margin: 0 auto;
  padding: 16px 20px;
}
.ws-stage.is-act .ws-stage-empty { margin: auto; padding: 20px; }
/* 有分镜视频时舞台恢复滚动：视频不是背景，别把正文挤成一条 */
.ws-stage.is-act:has(.ws-film) {
  padding: 16px 20px;
}
.ws-stage.is-act:has(.ws-film) .ws-play { flex: none; }
.ws-stage.is-act:has(.ws-film) .ws-cue {
  flex: none;
  min-height: 400px;
  border-radius: 14px;
}

/* ---- 4. 看剧本：结构化弹框 ---- */
.ws-script-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 62vh;
  overflow-y: auto;
  padding-right: 6px;
}
.ws-script-ov {
  border-left: 3px solid var(--el-color-warning);
  padding-left: 10px;
}
.ws-script-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ws-script-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--el-text-color-regular);
}
.ws-script-meta { margin-top: 6px; font-size: 11.5px; color: var(--el-text-color-placeholder); }
.ws-script-scene {
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-lighter, var(--el-fill-color-light));
}
.ws-script-scene-head { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
.ws-script-scene-no { flex: none; font-size: 11.5px; color: var(--el-color-primary); }
.ws-script-scene-name {
  margin: 0;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.ws-script-where { font-size: 11.5px; color: var(--el-text-color-placeholder); }
.ws-script-scene-desc {
  margin: 6px 0 0;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--el-text-color-regular);
}
.ws-script-cast { margin-top: 6px; font-size: 11.5px; color: var(--el-text-color-secondary); }
.ws-script-line {
  display: flex;
  gap: 8px;
  margin-top: 7px;
  font-size: 12.5px;
  line-height: 1.7;
}
.ws-script-who { flex: none; min-width: 54px; font-weight: 600; color: var(--el-color-primary); }
.ws-script-say { color: var(--el-text-color-primary); white-space: pre-wrap; }
.ws-script-block { border-top: 1px dashed var(--el-border-color-lighter); padding-top: 10px; }
.ws-script-block-title { margin: 0 0 6px; font-size: 12px; color: var(--el-text-color-secondary); }
.ws-script-trans {
  margin: 0 0 4px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}
.ws-script-props { display: flex; flex-wrap: wrap; gap: 6px; }
.ws-script-prop {
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.ws-script-empty { padding: 24px 8px; text-align: center; color: var(--el-text-color-secondary); }
.ws-script-empty p { margin: 0 0 6px; font-size: 13px; }
.ws-script-empty .sub { margin-bottom: 12px; font-size: 12px; color: var(--el-text-color-placeholder); }
</style>
