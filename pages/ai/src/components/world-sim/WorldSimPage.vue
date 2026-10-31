<template>
  <div class="ws-root" data-page="world-sim">
    <!-- ============ 左侧：世界列表 ============ -->
    <aside class="ws-list">
      <div class="ws-list-head">
        <div class="ws-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" class="ws-search-ico">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" />
          </svg>
          <input v-model="worldKw" class="ws-search-input" type="text" placeholder="搜索世界" />
        </div>
        <button class="ws-add" type="button" title="创建世界" @click="openCreateWorld">
          <el-icon><Plus /></el-icon>
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
              <span class="ws-conv-preview">{{ w.era || '现代' }} · {{ w.sceneCount || 0 }} 场景 · {{ w.npcCount || 0 }} NPC</span>
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
          <p>{{ worlds.length ? '没有匹配的世界' : '还没有世界，点右上角 + 创建' }}</p>
        </div>
      </div>
    </aside>

    <!-- ============ 中间：场景对话 ============ -->
    <section class="ws-chat">
      <template v-if="currentWorld">
        <!-- 世界头部：名称 / 时代 / 时间 / 天气 / 推进 / 设置 -->
        <header class="ws-chat-head">
          <div class="ws-chat-title-wrap">
            <span class="ws-chat-name">{{ currentWorld.name }}</span>
            <span class="ws-chat-eras"><el-tag size="small" effect="plain">{{ currentWorld.era || '现代' }}</el-tag></span>
            <span class="ws-chat-time">{{ currentWorld.timeLabel || '第 1 天 上午' }}</span>
          </div>
          <div class="ws-chat-head-actions">
            <button class="ws-chat-adv" type="button" :disabled="advancing" title="推进时间，生成世界动态"
              @click="advance">
              <el-icon v-if="!advancing"><VideoPlay /></el-icon>
              <span v-else class="ws-spin"><el-icon><Loading /></el-icon></span>
              <span class="ws-adv-text">推进时间</span>
            </button>
            <button class="ws-chat-set" type="button" title="世界设置" aria-label="世界设置" @click="openWorldEdit">
              <el-icon><MoreFilled /></el-icon>
            </button>
          </div>
        </header>

        <!-- 场景切换条 -->
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

        <!-- 消息区 -->
        <div ref="msgBoxRef" class="ws-msgs">
          <div
            v-for="m in messages"
            :key="m._key"
            class="ws-msg"
            :class="m.speakerType === 'user' ? 'is-self' : 'is-other'"
          >
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
          </div>

          <div v-if="!messages.length" class="ws-msgs-empty">
            <p>在【{{ currentScene?.name || '场景' }}】里说点什么吧</p>
            <p class="sub">@ 指定 NPC，或直接说话让场景里最合适的角色回应</p>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="ws-input">
          <div v-if="pendingAt" class="ws-at-chip">
            <el-tag closable type="primary" @close="pendingAt = null">@{{ pendingAt.displayName }}</el-tag>
          </div>

          <div class="ws-input-tools">
            <div class="ws-at-wrap">
              <button class="ws-tool" type="button" title="@ NPC" @click="atMenuVisible = !atMenuVisible">
                <span class="ws-tool-at">@</span>
              </button>
              <div v-if="atMenuVisible" class="ws-at-menu">
                <div v-if="!npcs.length" class="ws-at-empty">世界里还没有 NPC，去侧栏「管理」添加</div>
                <div v-for="n in npcs" :key="n.id" class="ws-at-item" @click="onPickAt(n)">
                  <CardAvatar :src="n.displayAvatar" :name="n.displayName || 'AI'" size="sm" />
                  <span class="ws-at-name">{{ n.displayName }}</span>
                  <span class="ws-at-scene">{{ sceneNameOf(n.sceneId) }}</span>
                </div>
              </div>
            </div>
          </div>

          <textarea
            ref="taInputRef"
            v-model="draft"
            class="ws-textarea"
            rows="4"
            placeholder="说出你的行动或台词…"
            @keydown.enter.exact.prevent="send"
            @keydown.enter.shift.exact="onShiftEnter"
          ></textarea>

          <div class="ws-input-foot">
            <span class="ws-foot-hint">回车发送 · Shift + 回车换行</span>
            <button
              class="ws-send"
              type="button"
              :class="{ ready: draft.trim() }"
              @click="send"
            >行动(S)</button>
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
          <p>选择一个世界，或点左上角 + 创建世界沙盒</p>
        </div>
      </div>
    </section>

    <!-- ============ 右侧：时间线 / 关系 / 管理 ============ -->
    <aside class="ws-side">
      <div class="ws-side-tabs">
        <button v-for="tab in sideTabs" :key="tab.key" type="button"
          :class="{ active: sideTab === tab.key }" @click="sideTab = tab.key">
          {{ tab.label }}
        </button>
      </div>

      <!-- 事件时间线 -->
      <div v-show="sideTab === 'timeline'" class="ws-side-body">
        <div class="ws-side-hint">世界动态 · 推进时间后生成</div>
        <div v-if="!events.length" class="ws-side-empty">还没有事件。点右上角「推进时间」生成世界动态。</div>
        <div v-for="(ev, i) in events" :key="ev.id ?? i" class="tl-item">
          <div class="tl-head">
            <span class="tl-title">{{ ev.eventType === 'advance' ? '⏱' : '💬' }} {{ ev.title }}</span>
            <span class="tl-time">{{ fmtDay(ev.createTime) }}</span>
          </div>
          <div class="tl-content">{{ ev.content }}</div>
          <div v-if="eventNpcs(ev).length" class="tl-npcs">{{ eventNpcs(ev).join('、') }}</div>
        </div>
      </div>

      <!-- 关系网 -->
      <div v-show="sideTab === 'relations'" class="ws-side-body">
        <div class="ws-side-hint">NPC 间好感度（-100 ~ 100），互动后自动演化</div>
        <div v-if="!relationships.length" class="ws-side-empty">还没有关系。NPC 之间互动或推进时间后自动生成。</div>
        <div v-for="r in relationships" :key="r.id" class="rel-item" @click="openRelEdit(r)">
          <CardAvatar :src="r.fromAvatar" :name="r.fromName || '?'" size="sm" class="rel-avatar" />
          <div class="rel-main">
            <div class="rel-names">
              <span class="rel-name">{{ r.fromName }}</span>
              <span class="rel-arrow">↔</span>
              <span class="rel-name">{{ r.toName }}</span>
              <el-tag v-if="r.relationTag" size="small" effect="plain" class="rel-tag">{{ r.relationTag }}</el-tag>
            </div>
            <div class="rel-bar-wrap">
              <div class="rel-bar" :style="{ width: relPct(r.affinity) + '%' }" :class="relTone(r.affinity)"></div>
              <span class="rel-val">{{ r.affinity ?? 0 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 管理：场景 + NPC -->
      <div v-show="sideTab === 'manage'" class="ws-side-body">
        <div class="ws-mg-section">
          <div class="ws-mg-head">
            <span class="ws-mg-title">场景（{{ scenes.length }}）</span>
            <button class="ws-mg-add" type="button" title="新建场景" @click="openCreateScene">+</button>
          </div>
          <div v-for="s in scenes" :key="s.id" class="ws-mg-scene">
            <span class="ws-mg-scene-name">{{ s.name }}</span>
            <span class="ws-mg-scene-count">{{ npcs.filter(n => n.sceneId === s.id).length }} 人</span>
            <button class="ws-mg-del" type="button" title="删除场景" @click="deleteScene(s)">✕</button>
          </div>
          <div v-if="!scenes.length" class="ws-side-empty">还没有场景</div>
        </div>

        <div class="ws-mg-section">
          <div class="ws-mg-head">
            <span class="ws-mg-title">世界 NPC（{{ npcs.length }}）</span>
            <button class="ws-mg-add" type="button" title="添加角色为世界 NPC" @click="addNpcVisible = true">+</button>
          </div>
          <div v-for="n in npcs" :key="n.id" class="ws-mg-npc">
            <CardAvatar :src="n.displayAvatar" :name="n.displayName || 'AI'" size="sm" class="ws-mg-npc-avatar" />
            <div class="ws-mg-npc-main">
              <div class="ws-mg-npc-name">
                {{ n.displayName }}
                <el-switch
                  v-model="n.isActive"
                  size="small"
                  class="ws-mg-active"
                  inline-prompt
                  active-text="参与"
                  inactive-text="挂起"
                  @change="saveNpcActive(n)"
                />
              </div>
              <div class="ws-mg-npc-sub">{{ npcSub(n) }}</div>
            </div>
            <button class="ws-mg-del" type="button" title="移除 NPC" @click="removeNpc(n)">✕</button>
          </div>
          <div v-if="!npcs.length" class="ws-side-empty">还没有 NPC。「+」从角色库添加</div>
        </div>
      </div>

      <!-- 剧本幕次 -->
      <div v-show="sideTab === 'acts'" class="ws-side-body ws-acts-body">
        <!-- 幕次列表 -->
        <div class="ws-acts-list">
          <div class="ws-acts-head">
            <span class="ws-acts-label">幕次列表</span>
            <button class="ws-act-create" type="button" title="新建幕次" @click="openCreateAct">
              <el-icon><Plus /></el-icon>
            </button>
          </div>
          <div v-if="acts.length" class="ws-act-lst">
            <div v-for="a in acts" :key="a.actNo" class="ws-act-row" :class="{ active: currentAct?.actNo === a.actNo }" @click="selectAct(a)">
              <div class="ws-act-row-head">
                <span class="ws-act-row-name">{{ a.title || '未命名幕次' }}</span>
                <span class="ws-act-stage" :class="actStageTone(a.stage)">{{ actStageName(a.stage) }}</span>
              </div>
              <div class="ws-act-row-foot">
                <span class="ws-act-row-no">第 {{ a.actNo }} 幕</span>
                <el-progress :percentage="actProgress(a)" :stroke-width="3" :show-text="false" class="ws-act-row-progress" />
              </div>
            </div>
          </div>
          <div v-else class="ws-side-empty">{{ currentWorldId ? '还没有幕次，点击 + 创建第一幕' : '先选择一个世界' }}</div>
        </div>

        <!-- 幕次详情 -->
        <div v-if="currentAct && actDetail" class="ws-act-detail">
          <div class="ws-act-detail-hd">
            <h3 class="ws-act-detail-title">第 {{ currentAct.actNo }} 幕：{{ actDetail.act?.title }}</h3>
            <span class="ws-act-stage" :class="actStageTone(actDetail.act?.stage)">{{ actStageName(actDetail.act?.stage) }}</span>
            <div class="ws-act-progress">
              <span class="ws-act-progress-text">{{ assetDone(actDetail) }} / {{ assetTotal(actDetail) }}</span>
              <el-progress :percentage="actProgress(actDetail)" :stroke-width="4" :show-text="false" />
            </div>
          </div>

          <div class="ws-act-detail-body">
            <!-- 剧本显示 -->
            <div v-if="showScript && actDetail.script" class="ws-act-script">
              <div class="ws-act-script-head">
                <span class="ws-act-script-title">剧本（act{{ currentAct.actNo }}.json）</span>
                <button class="ws-act-script-close" type="button" @click="showScript = false">✕</button>
              </div>
              <pre class="ws-script-item">{{ actDetail.script }}</pre>
            </div>

            <!-- 场景 / 过场 / 道具 素材 -->
            <div class="ws-act-assets">
              <div class="ws-act-asset-section" v-for="sec in actAssetSections" :key="sec.key">
                <div class="ws-act-asset-head">{{ sec.label }}（{{ sec.items?.length }}）</div>
                <div class="ws-act-asset-grid">
                  <div v-for="it in sec.items" :key="it.name" class="ws-act-asset-card">
                    <div class="ws-act-asset-info">
                      <div class="ws-act-asset-name">{{ it.name }}</div>
                      <div class="ws-act-asset-desc">{{ it.desc || it.text || '暂无描述' }}</div>
                    </div>
                    <div class="ws-act-asset-media">
                      <div class="ws-act-media-band" v-if="it.mediaImage">
                        <img v-if="it.mediaImage.url" class="ws-act-media-img" :src="it.mediaImage.url" />
                        <span class="ws-act-media-status" :class="mediaStatusClass(it.mediaImage)">{{ mediaStatusName(it.mediaImage) }}</span>
                        <a v-if="it.mediaImage.url" class="ws-act-media-url" target="_blank" :href="it.mediaImage.url">原图</a>
                      </div>
                      <div class="ws-act-media-band" v-if="it.mediaVideo">
                        <img v-if="it.mediaVideo.url" class="ws-act-media-img" :src="it.mediaVideo.url" />
                        <span class="ws-act-media-status" :class="mediaStatusClass(it.mediaVideo)">{{ mediaStatusName(it.mediaVideo) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 阶段操作 -->
            <div class="ws-act-stages">
              <button v-for="btn in actPipeline" :key="btn.label" class="ws-act-stage-btn" :class="{ active: btn.stage === actStage, disabled: btn.stage !== actStage }" :disabled="btn.stage !== actStage || actProcessing" @click="actPipelineAction(btn)">
                {{ btn.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- ============ 建世界对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="createVisible" width="460" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">创建世界</span></template>
      <div class="ws-form">
        <div class="ws-field">
          <label class="ws-label">世界名称 *</label>
          <el-input v-model="worldForm.name" placeholder="如：雾都侦探社（留空由 AI 取一个）" maxlength="30" />
          <span class="ws-hint">不填则由 AI 自动生成一个</span>
        </div>
        <div class="ws-field">
          <label class="ws-label">时代背景</label>
          <div class="ws-eras">
            <div v-for="e in ERA_OPTIONS" :key="e" class="ws-era-tag"
              :class="{ active: worldForm.era === e }" @click="worldForm.era = e">{{ e }}</div>
          </div>
          <span class="ws-hint">点选时代，或点"随机生成"自动抽签</span>
        </div>
        <div class="ws-field">
          <label class="ws-label">世界观设定（种子）</label>
          <div class="ws-seeds">
            <div v-for="s in WORLD_SEEDS" :key="s.label" class="ws-seed"
              :class="{ active: worldForm.description === s.desc }" @click="applySeed(s)">{{ s.label }}</div>
          </div>
          <el-input v-model="worldForm.description" type="textarea" :rows="2"
            placeholder="AI 会按这个描述生成世界，不写也不要紧" />
        </div>
      </div>
      <template #footer>
        <el-button @click="randomCreate">随机生成</el-button>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreate">创建世界</el-button>
      </template>
    </ReDialog>

    <!-- ============ 编辑世界对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="editVisible" width="460" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">编辑世界</span></template>
      <div class="ws-form">
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
      </div>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEdit">保存</el-button>
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

    <!-- ============ 添加 NPC 对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="addNpcVisible" width="520" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">添加角色为世界 NPC</span></template>
      <el-input v-model="charFilter" placeholder="搜索角色" class="ws-char-filter" />
      <div class="ws-char-list">
        <div v-for="c in filteredCharacters" :key="c.id" class="ws-char-item">
          <CardAvatar :src="c.avatarUrl" :name="c.name" size="md" />
          <div class="ws-char-info">
            <div class="ws-char-name">{{ c.name }}</div>
            <div class="ws-char-desc">{{ c.description }}</div>
          </div>
          <el-select v-model="npcSceneDraft[c.id]" size="small" placeholder="布置到场景" clearable style="width: 130px">
            <el-option v-for="s in scenes" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-button type="primary" plain @click="confirmAddNpc(c)">加入</el-button>
        </div>
        <div v-if="!filteredCharacters.length" class="ws-char-empty">没有可选角色</div>
      </div>
    </ReDialog>

    <!-- ============ 编辑 NPC 对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="npcEditVisible" width="480" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">编辑「{{ npcEditTarget?.displayName }}」</span></template>
      <div v-if="npcEditTarget" class="ws-form">
        <div class="ws-field">
          <label class="ws-label">世界内昵称</label>
          <el-input v-model="npcEditForm.nickname" placeholder="留空使用角色名" maxlength="30" />
        </div>
        <div class="ws-field">
          <label class="ws-label">所在场景</label>
          <el-select v-model="npcEditForm.sceneId" placeholder="暂不在任何场景" clearable style="width: 100%">
            <el-option v-for="s in scenes" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </div>
        <div class="ws-field">
          <label class="ws-label">人设补充</label>
          <el-input v-model="npcEditForm.persona" type="textarea" :rows="3"
            placeholder="在这个世界里的背景/性格补充，优先于角色原系统提示词" />
        </div>
        <div class="ws-field">
          <label class="ws-label">参与世界推进</label>
          <el-switch v-model="npcEditForm.isActive" active-text="参与" inactive-text="挂起" />
        </div>
      </div>
      <template #footer>
        <el-button @click="npcEditVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEditNpc">保存</el-button>
      </template>
    </ReDialog>

    <!-- ============ 编辑关系对话框 ============ -->
    <ReDialog :close-on-click-modal="true" v-model="relEditVisible" width="420" append-to-body class="ws-dialog">
      <template #header><span class="ws-dlg-title">编辑关系</span></template>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, watch, onMounted } from 'vue'
import { ElMessageBox } from 'element-plus'
import { MoreFilled, Plus, VideoPlay, Loading } from '@element-plus/icons-vue'
import MarkdownContent from '@/components/ui/MarkdownContent.vue'
import CardAvatar from '@/components/ui/CardAvatar.vue'
import ReDialog from '@repo/ui/re-dialog'
import { message } from '@repo/core'
import { apiService } from '@/services/ApiService'
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
} from '@/services/modules/world-sim.api'

const ERA_OPTIONS = ['现代', '古代', '未来', '奇幻', '武侠', '赛博朋克', '末日', '蒸汽朋克']
/** 每个时代对应的前缀名，用户不留名时自动组成世界名称 */
const ERA_PREFIX = {
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

interface UIMessage {
  _key: number
  speakerType: 'user' | 'ai'
  speakerId?: string
  speakerName?: string
  content: string
  modelName?: string
  streaming?: boolean
}

/* ---------------- 状态 ---------------- */
const worlds = ref<WorldItem[]>([])
const currentWorldId = ref<number | null>(null)
const currentWorld = ref<WorldItem | null>(null)
const scenes = ref<WorldScene[]>([])
const npcs = ref<WorldNpc[]>([])
const relationships = ref<WorldRelationship[]>([])
const events = ref<WorldEvent[]>([])
const acts = ref<WorldActListRow[]>([])
const currentAct = ref<WorldActListRow | null>(null)
const actDetail = ref<WorldActDetail | null>(null)
const showScript = ref(false)
const actProcessing = ref(false)
const currentSceneId = ref<number | null>(null)
const messages = ref<UIMessage[]>([])
const draft = ref('')
const advancing = ref(false)
const pendingAt = ref<WorldNpc | null>(null)
const atMenuVisible = ref(false)
const worldKw = ref('')
const sending = ref(false)
const sideTab = ref<'timeline' | 'relations' | 'manage'>('timeline')

const createVisible = ref(false)
const editVisible = ref(false)
const sceneCreateVisible = ref(false)
const addNpcVisible = ref(false)
const npcEditVisible = ref(false)
const relEditVisible = ref(false)
const charFilter = ref('')
const characters = ref<any[]>([])
const npcSceneDraft = reactive<Record<string, number | undefined>>({})

const worldForm = reactive({
  name: '',
  era: '现代',
  weather: '晴',
  description: '',
})
const sceneForm = reactive({ name: '', description: '' })
const npcEditTarget = ref<WorldNpc | null>(null)
const npcEditForm = reactive<{
  nickname: string; sceneId: number | null; persona: string; isActive: boolean;
}>({ nickname: '', sceneId: null, persona: '', isActive: true })
const relEditTarget = ref<WorldRelationship | null>(null)
const relEditForm = reactive<{ affinity: number; relationTag: string; memo: string }>({
  affinity: 0, relationTag: '', memo: '',
})

const msgBoxRef = ref<HTMLElement | null>(null)
const taInputRef = ref<HTMLTextAreaElement | null>(null)
let keySeq = 1
let streamHandle: { close: () => void } | null = null

const sideTabs: { key: 'timeline' | 'relations' | 'manage' | 'acts'; label: string }[] = [
  { key: 'timeline', label: '时间线' },
  { key: 'relations', label: '关系网' },
  { key: 'manage', label: '管理' },
  { key: 'acts', label: '幕次' },
]

/* ---------------- 计算 ---------------- */
const shownWorlds = computed(() => {
  const kw = worldKw.value.trim()
  if (!kw) return worlds.value
  return worlds.value.filter((w) => (w.name || '').includes(kw))
})

const currentScene = computed(() => scenes.value.find((s) => s.id === currentSceneId.value) || null)

const sceneNpcs = computed(() => {
  if (currentSceneId.value == null) return npcs.value.filter((n) => n.sceneId == null)
  return npcs.value.filter((n) => n.sceneId === currentSceneId.value)
})

const filteredCharacters = computed(() => {
  const kw = charFilter.value.trim()
  const inWorld = new Set(npcs.value.map((n) => Number(n.roleId)))
  return characters.value
    .filter((c) => !inWorld.has(Number(c.id)))
    .filter((c) => !kw || (c.name || '').includes(kw))
})

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  void loadWorlds()
})

watch(addNpcVisible, (v) => { if (v) openCharacters() })

/* ---------------- 世界 ---------------- */
async function loadWorlds() {
  worlds.value = await apiService.fetchWorlds()
}

async function selectWorld(w: WorldItem) {
  currentWorldId.value = w.id
  currentWorld.value = w
  pendingAt.value = null
  atMenuVisible.value = false
  sideTab.value = 'timeline'
  // 换世界先清幕次
  currentAct.value = null
  actDetail.value = null
  showScript.value = false
  const view = await apiService.fetchWorldView(w.id)
  scenes.value = view.scenes || []
  npcs.value = view.npcs || []
  relationships.value = view.relationships || []
  events.value = view.events || []
  // 默认选中第一个场景
  currentSceneId.value = scenes.value.length ? scenes.value[0].id : null
  await loadMessages()
  await loadActs()
  // 更新左侧列表上的最新状态
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
  createVisible.value = true
}

/** 点种子卡片：选定时代 + 填充描述 */
function applySeed(s: { label: string; desc: string }) {
  worldForm.description = s.desc
  if (!worldForm.era || worldForm.era === '') worldForm.era = '现代'
}

/** 随机生成：随机名称 + 抽签时代 + 选种子，点击即创建，纯观影用户一步到位 */
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
  const w = await apiService.createWorld(name || `${ERA_PREFIX[era]} ${Math.floor(Math.random() * 10000)}`, desc, era)
  await loadWorlds()
  await selectWorld(w)
  createVisible.value = false
  message.success('世界已创建')
}

function openWorldEdit() {
  if (!currentWorld.value) return
  worldForm.name = currentWorld.value.name || ''
  worldForm.era = currentWorld.value.era || '现代'
  worldForm.weather = currentWorld.value.weather || '晴'
  worldForm.description = currentWorld.value.description || ''
  editVisible.value = true
}

async function confirmEdit() {
  if (!currentWorldId.value) return
  await apiService.updateWorld(currentWorldId.value, {
    name: worldForm.name,
    era: worldForm.era,
    weather: worldForm.weather,
    description: worldForm.description,
  })
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
        currentWorldId.value = null
        currentWorld.value = null
        currentSceneId.value = null
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
  pendingAt.value = null
  await loadMessages()
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
  currentSceneId.value = s.id
  message.success('场景已创建')
}

async function deleteScene(s: WorldScene) {
  try {
    await ElMessageBox.confirm(`删除场景「${s.name}」？其中的 NPC 会回到"未布置"状态。`, '删除场景', { type: 'warning' })
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

/* ---------------- NPC ---------------- */
function npcSub(n: WorldNpc) {
  const scene = n.sceneId == null ? null : scenes.value.find((s) => s.id === n.sceneId)
  const parts: string[] = []
  parts.push(scene ? scene.name : '未布置')
  if (n.modelOverride) parts.push(displayModel(n.modelOverride))
  return parts.join(' · ')
}

function sceneNameOf(sceneId?: number | null) {
  if (sceneId == null) return '未布置'
  return scenes.value.find((s) => s.id === sceneId)?.name || ''
}

async function openCharacters() {
  if (!characters.value.length) {
    const res = await apiService.fetchCharacters()
    characters.value = res.items || []
  }
}

async function confirmAddNpc(c: any) {
  if (!currentWorldId.value) return
  await apiService.addWorldNpc(currentWorldId.value, {
    roleId: Number(c.id),
    sceneId: npcSceneDraft[c.id] ?? null,
  })
  npcSceneDraft[c.id] = undefined
  addNpcVisible.value = false
  const view = await apiService.fetchWorldView(currentWorldId.value)
  npcs.value = view.npcs || []
  relationships.value = view.relationships || []
  message.success(`已加入 ${c.name}`)
}

function saveNpcActive(n: WorldNpc) {
  void apiService.updateWorldNpc(n.id, { isActive: !!n.isActive }).catch(() => message.error('保存失败'))
}

function openNpcEdit(n: WorldNpc) {
  npcEditTarget.value = n
  npcEditForm.nickname = n.nickname || ''
  npcEditForm.sceneId = n.sceneId ?? null
  npcEditForm.persona = n.persona || ''
  npcEditForm.isActive = n.isActive !== false
  npcEditVisible.value = true
}

async function confirmEditNpc() {
  const target = npcEditTarget.value
  if (!target) return
  await apiService.updateWorldNpc(target.id, {
    nickname: npcEditForm.nickname || null,
    sceneId: npcEditForm.sceneId,
    persona: npcEditForm.persona || null,
    isActive: npcEditForm.isActive,
  })
  npcEditVisible.value = false
  const view = await apiService.fetchWorldView(currentWorldId.value!)
  npcs.value = view.npcs || []
  message.success('NPC 已更新')
}

async function removeNpc(n: WorldNpc) {
  try {
    await ElMessageBox.confirm(`将「${n.displayName}」移出这个世界？相关关系也会清除。`, '移除 NPC', { type: 'warning' })
    await apiService.removeWorldNpc(n.id)
    const view = await apiService.fetchWorldView(currentWorldId.value!)
    npcs.value = view.npcs || []
    relationships.value = view.relationships || []
    message.success('已移除')
  } catch { /* cancel */ }
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
  const view = await apiService.fetchWorldView(currentWorldId.value!)
  relationships.value = view.relationships || []
  message.success('关系已保存')
}

/* ---------------- 时间推进 ---------------- */
async function advance() {
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
    await loadMessages()
    message.success(`时间推进：${res.world.timeLabel || ''}`)
  } catch (e: any) {
    message.error(e?.message || '推进失败')
  } finally {
    advancing.value = false
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
  const total = v?.assets?.total as number | undefined
  const done = v?.assets?.done as number | undefined
  if (total > 0) return Math.min(100, Math.round((done ?? 0) / total * 100))
  return Math.min(100, Number(v?.progress ?? 0))
}

/** 详情资产的完成数 */
function assetDone(d: Record<string, any>) { return d?.assets?.done ?? 0 }

/** 详情资产的总需求数 */
function assetTotal(d: Record<string, any>) { return d?.assets?.total ?? 0 }

/** 解析剧本，按场景/过场/道具拆出素材区划 */
function actAssetSections() {
  const script = actDetail.value?.script
  if (!script) return []
  let json: Record<string, any>
  try {
    json = JSON.parse(script)
  } catch {
    return []
  }
  return [
    { key: 'scenes', label: '场景', items: (json.scenes ?? []) as Record<string, any>[] },
    { key: 'transitions', label: '过场', items: (json.transitions ?? []) as Record<string, any>[] },
    { key: 'props', label: '道具', items: (json.props ?? []) as Record<string, any>[] },
  ]
}

/** 素材媒体的状态显示名 */
function mediaStatusName(head?: Record<string, any>) {
  if (!head) return '无'
  if (head.status === 'NO_PROMPT') return '无需求'
  if (head.status === 'OK') return '已完成'
  if (head.status === 'NOT_STARTED') return '未开始'
  if (head.status === 'FAILED' || head.status === 'CANCELED') return '已取消'
  return '生成中'
}

/** 素材媒体的状态展示样式 */
function mediaStatusClass(head?: Record<string, any>) {
  switch (head?.status) {
    case 'NO_PROMPT':
      return 'ws-act-media--none'
    case 'OK':
      return 'ws-act-media--done'
    case 'NOT_STARTED':
      return 'ws-act-media--waiting'
    default:
      return 'ws-act-media--running'
  }
}

/** 幕次所在阶段（来自当前选中的幕次行） */
const actStage = computed(() => actDetail.value?.act?.stage ?? currentAct.value?.stage)

/** 幕次操作序列：每阶段可选的操作（非当前阶段置灰不可点） */
const actPipeline = [
  { stage: 'writing', label: '生成剧本', action: 'advance' },
  { stage: 'props_ok', label: '推进素材', action: 'advance' },
  { stage: 'props_ok', label: '回放', action: 'script' },
  { stage: 'playing', label: '演出', action: 'advance' },
  { stage: 'replay', label: '重播', action: 'replay' },
  { stage: 'finished', label: '结文', action: 'finish' },
]

async function loadActs() {
  if (!currentWorldId.value) { acts.value = []; return }
  acts.value = await apiService.fetchWorldActs(currentWorldId.value)
}

async function openCreateAct() {
  if (!currentWorldId.value) return
  try {
    const a = await apiService.createWorldAct(currentWorldId.value) as WorldAct
    await loadActs()
    await selectAct(a)
    message.success(`已创建第 ${a.actNo} 幕`)
  } catch (e: any) {
    message.error(e?.message || '创建幕次失败')
  }
}

async function selectAct(a: WorldActListRow) {
  currentAct.value = a
  actDetail.value = null
  showScript.value = false
  await fetchActDetail(a.actNo as number)
}

async function fetchActDetail(actNo: number) {
  if (!currentWorldId.value || actNo == null) return
  actProcessing.value = true
  try {
    const d = await apiService.fetchWorldActDetail(currentWorldId.value, actNo) as WorldActDetail
    actDetail.value = d
    showScript.value = false
  } catch (e: any) {
    message.error(e?.message || '获取幕次详情失败')
  } finally {
    actProcessing.value = false
  }
}

/** 幕次阶段操作 */
async function actPipelineAction(btn: { stage?: string; label?: string; action?: string }) {
  if (!currentWorldId.value || currentAct.value?.actNo == null) return
  const stage = actStage.value ?? ''
  if (btn.action === 'script') {
    showScript.value = !showScript.value
    return
  }
  // 非当前阶段可允许的操作：写/素材/出演 → 推进，回看/演完 → 重播或结文
  if (btn.action === 'advance' && !['writing', 'props_ok', 'playing'].includes(stage)) return
  if (btn.action === 'replay' && !['replay', 'finished'].includes(stage)) return
  if (btn.action === 'finish' && !['replay', 'finished'].includes(stage)) return
  actProcessing.value = true
  try {
    const no = currentAct.value!.actNo as number
    if (btn.action === 'advance') {
      const r = await apiService.advanceWorldAct(currentWorldId.value, no) as WorldActAdvance
      message.success(`推进完成：${actStageName(r?.act?.stage)}`)
    } else if (btn.action === 'replay') {
      await apiService.replayWorldAct(currentWorldId.value, no)
      message.success('已切换到重播')
    } else if (btn.action === 'finish') {
      await apiService.finishWorldAct(currentWorldId.value, no)
      message.success('幕次已完结')
    }
    await loadActs()
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
    .filter((m) => m.speakerType !== 'ai' || (m.content || '').trim().length > 0)
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

function onPickAt(n: WorldNpc) {
  pendingAt.value = n
  atMenuVisible.value = false
  nextTick(() => taInputRef.value?.focus())
}

function onShiftEnter() {
  // 允许默认换行
}

function evSpeakerFallback(map: Map<string, UIMessage>): UIMessage | null {
  const streamings = [...map.values()].filter((m) => m.streaming)
  return streamings.length === 1 ? streamings[0] : null
}

async function send() {
  const content = draft.value.trim()
  if (!content || !currentWorldId.value || sending.value) return
  sending.value = true
  messages.value.push({ _key: keySeq++, speakerType: 'user', speakerName: '我', content })
  draft.value = ''
  const atNpcId = pendingAt.value ? Number(pendingAt.value.id) : null
  const atName = pendingAt.value?.displayName
  pendingAt.value = null
  scrollBottom()

  const aiBySpeaker = new Map<string, UIMessage>()
  try {
    streamHandle = apiService.worldChatStream(
      { worldId: currentWorldId.value, sceneId: currentSceneId.value, content, atNpcId },
      {
        onEvent: (ev) => {
          const type = ev.type
          if (type === 'create') {
            const created: UIMessage = {
              _key: keySeq++,
              speakerType: 'ai',
              speakerId: ev.speakerId,
              speakerName: ev.speakerName || atName || 'AI',
              content: '',
              modelName: ev.modelName,
              streaming: true,
            }
            messages.value.push(created)
            const key = created.speakerId || `ai-${created._key}`
            aiBySpeaker.set(key, created)
            scrollBottom()
          } else if (type === 'text') {
            const target = aiBySpeaker.get(ev.speakerId || '') || evSpeakerFallback(aiBySpeaker)
            if (target) {
              target.content += ev.content || ''
              scrollBottom()
            }
          } else if (type === 'finish') {
            const target = aiBySpeaker.get(ev.speakerId || '') || evSpeakerFallback(aiBySpeaker)
            if (target) {
              target.streaming = false
              if (ev.error) {
                target.content += `\n[错误] ${ev.error}`
              } else if (!target.content.trim()) {
                target.content = '（模型未返回内容）'
              }
            }
          } else if (type === 'user_message') {
            // 后端回显用户消息，忽略（本地已 push）
          } else if (type === 'turn_end') {
            aiBySpeaker.forEach((msg) => { msg.streaming = false })
          }
        },
        onError: (err) => {
          console.error('world stream error', err)
          sending.value = false
        },
        onClose: () => {
          sending.value = false
          aiBySpeaker.forEach((msg) => { msg.streaming = false })
          // 一轮结束后刷新关系网（后端已按互动调整好感度）
          if (currentWorldId.value) {
            apiService.fetchWorldRelationships(currentWorldId.value)
              .then((rows) => { relationships.value = rows })
              .catch(() => {})
          }
        },
      },
    )
  } catch (e) {
    console.error(e)
    sending.value = false
    message.error('发送失败')
  }
}
</script>

<style scoped>
/* ============================================================================
   令牌口径与全应用统一：颜色走 --el-*，圆角走 --el-radius-*，过渡走
   var(--el-transition-duration-fast, 0.2s)。本页为三栏世界沙盒布局。
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
  flex: 1;
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
.ws-add:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
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
.ws-conv:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
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
.ws-conv-more:focus-visible {
  opacity: 1;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
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

/* ================= 中间对话区 ================= */
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
  padding: 0 16px;
  height: 54px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ws-chat-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.ws-chat-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-chat-time { font-size: 12px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.ws-chat-head-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
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
.ws-chat-adv .el-icon { font-size: 15px; }
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
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-chat-set:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.ws-chat-set:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.ws-chat-set :deep(.el-icon) { font-size: 19px; }

/* 场景切换条 */
.ws-scene-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter, #fafafa);
  flex-shrink: 0;
}
.ws-scene-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  max-width: calc(100% - 110px);
}
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
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-scene-tab:hover { color: var(--el-text-color-primary); }
.ws-scene-tab.active {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.ws-scene-add {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
}
.ws-scene-add:hover { color: var(--el-color-primary); border-color: var(--el-color-primary); }
.ws-scene-count { font-size: 12px; color: var(--el-text-color-secondary); flex-shrink: 0; }

/* 消息区 */
.ws-msgs {
  flex: 1;
  overflow-y: auto;
  padding: 20px 22px 16px;
  background: var(--el-fill-color);
}
.ws-msg { display: flex; align-items: flex-start; margin-bottom: 18px; }
.ws-msg.is-other { justify-content: flex-start; }
.ws-msg.is-self { justify-content: flex-end; }
.ws-msg-avatar { flex-shrink: 0; }
.ws-msg-col { max-width: 66%; min-width: 0; margin: 0 10px; }
.is-self .ws-msg-col { display: flex; flex-direction: column; align-items: flex-end; }

.ws-msg-meta {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 0 0 5px 2px;
  flex-wrap: wrap;
}
.ws-msg-name { font-size: 12px; color: var(--el-text-color-secondary); }
.ws-msg-typing {
  font-size: 11.5px;
  color: var(--el-color-primary);
  display: inline-flex;
  align-items: center;
}
.ws-msg-typing::after {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-left: 5px;
  border-radius: var(--el-radius-full, 9999px);
  background: currentColor;
  animation: ws-typing-bounce 1.4s infinite ease-in-out both;
}
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
.ws-msg.is-other .ws-bubble.typing-bubble {
  min-height: 44px;
  display: flex;
  align-items: center;
}
.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 6px;
  vertical-align: bottom;
}
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
.b-other {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
}
.b-self {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.ws-plain { white-space: pre-wrap; }
.b-other::before {
  content: '';
  position: absolute;
  left: -4px;
  top: 13px;
  width: 8px;
  height: 8px;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  transform: rotate(45deg);
}
.b-self::before {
  content: '';
  position: absolute;
  right: -4px;
  top: 13px;
  width: 8px;
  height: 8px;
  background: var(--el-color-primary);
  transform: rotate(45deg);
}
.b-other :deep(.markdown-text) { margin: 0; }
.b-other :deep(.markdown-text p) { margin: 0 0 6px; }
.b-other :deep(.markdown-text p:last-child) { margin-bottom: 0; }
.b-self :deep(.markdown-text p) { margin: 0 0 6px; }
.b-self :deep(.markdown-text p:last-child) { margin-bottom: 0; }

.ws-msgs-empty { text-align: center; padding: 60px 20px; color: var(--el-text-color-placeholder); }
.ws-msgs-empty p { font-size: 13.5px; margin: 0 0 6px; }
.ws-msgs-empty .sub { font-size: 12px; }

/* 输入区 */
.ws-input {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 16px 12px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}
.ws-at-chip { margin-bottom: 6px; }
.ws-input-tools { display: flex; align-items: center; gap: 4px; }
.ws-at-wrap { position: relative; }
.ws-tool {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
}
.ws-tool:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.ws-tool:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.ws-tool-at { font-size: 15px; font-weight: 600; }
.ws-at-menu {
  position: absolute;
  bottom: 34px;
  left: 0;
  width: 240px;
  max-height: 300px;
  overflow-y: auto;
  padding: 6px;
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  box-shadow: var(--el-box-shadow-light);
  z-index: 20;
}
.ws-at-empty { padding: 16px; text-align: center; font-size: 12.5px; color: var(--el-text-color-secondary); }
.ws-at-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--el-radius-md, 8px);
  cursor: pointer;
  outline: none;
}
.ws-at-item:hover { background: var(--el-fill-color-light); }
.ws-at-name { flex: 1; font-size: 13px; color: var(--el-text-color-primary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws-at-scene { font-size: 11px; color: var(--el-text-color-placeholder); }
.ws-textarea {
  width: 100%;
  border: 0;
  outline: 0;
  resize: none;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  padding: 6px 2px;
}
.ws-textarea::placeholder { color: var(--el-text-color-placeholder); }
.ws-input-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ws-foot-hint { font-size: 11.5px; color: var(--el-text-color-placeholder); }
.ws-send {
  height: 32px;
  padding: 0 20px;
  border: 0;
  border-radius: var(--el-radius-md, 8px);
  cursor: not-allowed;
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-send.ready {
  cursor: pointer;
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.ws-chat-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color);
}
.ph-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--el-text-color-placeholder);
}
.ph-inner svg { width: 48px; height: 48px; }
.ph-inner p { font-size: 13.5px; margin: 0; }

/* ================= 右侧侧栏 ================= */
.ws-side {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-left: 1px solid var(--el-border-color-lighter);
}
.ws-side-tabs {
  display: flex;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.ws-side-tabs button {
  flex: 1;
  height: 40px;
  border: 0;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-side-tabs button:hover { color: var(--el-text-color-primary); }
.ws-side-tabs button.active {
  color: var(--el-color-primary);
  border-bottom-color: var(--el-color-primary);
}
.ws-side-body { flex: 1; overflow-y: auto; padding: 12px; }
.ws-side-hint { font-size: 11.5px; color: var(--el-text-color-placeholder); margin-bottom: 10px; }
.ws-side-empty {
  padding: 32px 12px;
  text-align: center;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

/* 时间线 */
.tl-item {
  padding: 10px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.tl-item:last-child { border-bottom: 0; }
.tl-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
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

/* 关系网 */
.rel-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 6px;
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.rel-item:hover { background: var(--el-fill-color-light); }
.rel-avatar { flex-shrink: 0; }
.rel-main { flex: 1; min-width: 0; }
.rel-names {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--el-text-color-primary);
}
.rel-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rel-arrow { color: var(--el-text-color-placeholder); }
.rel-tag { flex-shrink: 0; }
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

/* 管理 */
.ws-mg-section { margin-bottom: 18px; }
.ws-mg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
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
.ws-mg-scene {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--el-radius-md, 8px);
}
.ws-mg-scene:hover { background: var(--el-fill-color-light); }
.ws-mg-scene-name { flex: 1; font-size: 12.5px; color: var(--el-text-color-primary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws-mg-scene-count { font-size: 11px; color: var(--el-text-color-placeholder); }
.ws-mg-npc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--el-radius-md, 8px);
}
.ws-mg-npc:hover { background: var(--el-fill-color-light); }
.ws-mg-npc-avatar { flex-shrink: 0; }
.ws-mg-npc-main { flex: 1; min-width: 0; }
.ws-mg-npc-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: var(--el-text-color-primary);
}
.ws-mg-active { flex-shrink: 0; }
.ws-mg-npc-sub {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  transition: opacity var(--el-transition-duration-fast, 0.2s) ease,
    color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-mg-scene:hover .ws-mg-del,
.ws-mg-npc:hover .ws-mg-del { opacity: 1; }
.ws-mg-del:hover { color: var(--el-color-danger); background: var(--el-color-danger-light-9); }

/* ================= 对话框 ================= */
.ws-dialog :deep(.el-dialog__header) { padding-bottom: 8px; }
.ws-dlg-title { font-size: 15px; font-weight: 600; }
.ws-form { display: flex; flex-direction: column; gap: 14px; }
.ws-field { display: flex; flex-direction: column; gap: 6px; }
.ws-label { font-size: 12.5px; color: var(--el-text-color-secondary); }
.ws-char-filter { margin-bottom: 10px; }
.ws-char-list { max-height: 46vh; overflow-y: auto; }
.ws-char-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ws-char-item:last-child { border-bottom: 0; }
.ws-char-info { flex: 1; min-width: 0; }
.ws-char-name { font-size: 13px; color: var(--el-text-color-primary); }
.ws-char-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ws-char-empty { padding: 24px 0; text-align: center; font-size: 13px; color: var(--el-text-color-secondary); }

/* ================= 剧本幕次 ================= */
.ws-acts-body { flex: 1; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
.ws-acts-list { flex-shrink: 0; }
.ws-acts-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.ws-acts-label { font-size: 12.5px; font-weight: 600; color: var(--el-text-color-primary); }
.ws-act-create {
  width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center;
  border: 0; border-radius: var(--el-radius-sm, 6px); cursor: pointer;
  background: var(--el-color-primary-light-9); color: var(--el-color-primary);
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-act-create:hover { background: var(--el-color-primary-light-8); }
.ws-act-create :deep(.el-icon) { font-size: 15px; }
.ws-act-lst { max-height: 220px; overflow-y: auto; }
.ws-act-row {
  padding: 9px 10px; border-radius: var(--el-radius-lg, 12px); cursor: pointer; outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-act-row:hover { background: var(--el-fill-color-light); }
.ws-act-row.active { background: var(--el-color-primary-light-9); }
.ws-act-row-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
.ws-act-row-name {
  font-size: 13.5px; font-weight: 600; color: var(--el-text-color-primary); flex: 1; min-width: 0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ws-act-stage {
  font-size: 11px; padding: 1px 8px; border-radius: var(--el-radius-full, 9999px);
  color: var(--el-color-white); background: var(--el-text-color-placeholder);
}
.ws-act-stage.primary { background: var(--el-color-primary); }
.ws-act-stage.info { background: var(--el-color-info); }
.ws-act-stage.warning { background: var(--el-color-warning); }
.ws-act-stage.success { background: var(--el-color-success); }
.ws-act-stage.danger { background: var(--el-color-danger); }
.ws-act-row-foot { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.ws-act-row-no { font-size: 11.5px; color: var(--el-text-color-placeholder); white-space: nowrap; }
.ws-act-row-progress { flex: 1; min-width: 0; }

.ws-act-detail {
  background: var(--el-fill-color-lighter); border-radius: var(--el-radius-lg, 12px);
  padding: 12px; border: 1px solid var(--el-border-color-lighter);
}
.ws-act-detail-hd { margin-bottom: 12px; }
.ws-act-detail-title {
  font-size: 14px; font-weight: 600; color: var(--el-text-color-primary); margin: 0 0 4px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ws-act-detail-prog { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.ws-act-progress-text { font-size: 11px; color: var(--el-text-color-placeholder); flex: 1; text-align: right; }
.ws-act-detail-body { display: flex; flex-direction: column; gap: 14px; }

.ws-act-script { border-radius: var(--el-radius-md, 8px); border: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color); overflow: hidden; }
.ws-act-script-head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 10px;
  background: var(--el-fill-color); border-bottom: 1px solid var(--el-border-color-lighter);
}
.ws-act-script-title { font-size: 12px; color: var(--el-text-color-secondary); }
.ws-act-script-close {
  width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center;
  border: 0; background: transparent; color: var(--el-text-color-placeholder); cursor: pointer;
  border-radius: var(--el-radius-sm, 6px); font-size: 13px;
}
.ws-act-script-close:hover { background: var(--el-fill-color-light); color: var(--el-text-color-primary); }
.ws-script-item {
  margin: 0; padding: 10px; font-size: 12px; line-height: 1.8; color: var(--el-text-color-regular);
  background: var(--el-bg-color); white-space: pre-wrap; word-break: break-all;
  max-height: 200px; overflow-y: auto;
}

.ws-act-assets { display: flex; flex-direction: column; gap: 10px; }
.ws-act-asset-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 8px; }
.ws-act-asset-section {}
.ws-act-asset-head { font-size: 12.5px; font-weight: 600; color: var(--el-text-color-primary); margin-bottom: 6px; }
.ws-act-asset-card {
  padding: 10px; border-radius: var(--el-radius-md, 8px); border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color); transition: border-color var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-act-asset-card:hover { border-color: var(--el-color-primary-light-5); }
.ws-act-asset-info { min-width: 0; margin-bottom: 6px; }
.ws-act-asset-name {
  font-size: 13px; font-weight: 600; color: var(--el-text-color-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ws-act-asset-desc {
  font-size: 11.5px; color: var(--el-text-color-secondary); display: -webkit-box;
  -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;
}
.ws-act-asset-media { display: flex; flex-direction: column; gap: 4px; }
.ws-act-media-band { display: flex; align-items: center; gap: 6px; }
.ws-act-media-img { width: 36px; height: 36px; object-fit: cover; border-radius: var(--el-radius-sm, 6px); background: var(--el-fill-color); border: 1px solid var(--el-border-color-lighter); }
.ws-act-media-status { font-size: 10.5px; padding: 1px 5px; border-radius: var(--el-radius-full, 9999px); color: var(--el-color-white); background: var(--el-text-color-placeholder); }
.ws-act-media--none { background: var(--el-color-info); }
.ws-act-media--waiting { background: var(--el-color-info); }
.ws-act-media--running { background: var(--el-color-warning); }
.ws-act-media--done { background: var(--el-color-success); }
.ws-act-media-url { font-size: 10.5px; color: var(--el-color-primary); text-decoration: none; }
.ws-act-media-url:hover { text-decoration: underline; }

.ws-act-stages {
  display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--el-border-color-lighter);
}
.ws-act-stage-btn {
  flex: 1; min-width: 0; height: 28px; padding: 0 8px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid var(--el-border-color-lighter); border-radius: var(--el-radius-sm, 6px); background: var(--el-bg-color);
  color: var(--el-text-color-placeholder); font-size: 11.5px; cursor: not-allowed;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.ws-act-stage-btn.active {
  border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); color: var(--el-color-primary); cursor: pointer;
}
.ws-act-stage-btn.active:hover { background: var(--el-color-primary-light-8); }
.ws-act-stage-btn.disabled { opacity: 0.5; cursor: not-allowed; }

/* ---- 创建/编辑世界表单 ---- */
.ws-hint {
  display: block; font-size: 11.5px; color: var(--el-text-color-placeholder); margin-top: 4px; line-height: 1.5;
}
.ws-eras, .ws-seeds { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
.ws-era-tag, .ws-seed {
  display: inline-flex; align-items: center; justify-content: center;
  max-width: 128px; padding: 6px 12px; border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-border-color-lighter); background: var(--el-bg-color);
  color: var(--el-text-color-regular); font-size: 12.5px; cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
  user-select: none;
}
.ws-era-tag:hover, .ws-seed:hover { border-color: var(--el-color-primary-light-5); color: var(--el-color-primary); }
.ws-era-tag.active, .ws-seed.active {
  border-color: var(--el-color-primary); background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>