<template>
  <div class="app">
    <!-- ===== 侧边导航（原稿原样；默认关闭，见 SHOW_HTML_SIDEBAR 说明） ===== -->
    <aside v-if="SHOW_HTML_SIDEBAR" class="sidebar">
      <div class="brand">
        <div class="brand-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" /></svg>
        </div>
        <div class="brand-name">管理平台</div>
      </div>
      <nav class="nav" id="nav">
        <button class="nav-item" data-name="工作台" @click="onNav('工作台')"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>工作台</button>
        <button class="nav-item active" data-name="知识库" @click="onNav('知识库')"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" /><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" /></svg>知识库</button>
        <button class="nav-item" data-name="文档中心" @click="onNav('文档中心')"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>文档中心</button>
        <button class="nav-item" data-name="采集管理" @click="onNav('采集管理')"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>采集管理</button>
        <button class="nav-item" data-name="问答记录" @click="onNav('问答记录')"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.8-5.5A8 8 0 1 1 21 12z" /></svg>问答记录</button>
        <button class="nav-item" data-name="系统设置" @click="onNav('系统设置')"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 14H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9.4 4H10a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.2 2.9 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V15a1.7 1.7 0 0 0 1.2 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5.9z" /></svg>系统设置</button>
      </nav>
      <div class="side-foot">
        <div class="avatar">王</div>
        <div class="meta"><b>王老师</b><span>三年级语文组</span></div>
      </div>
    </aside>

    <!-- ===== 主区域 ===== -->
    <main class="main">
      <header class="topbar">
        <div class="page-title"><h1>知识库</h1><p>共 {{ kbCount }} 个知识库 · {{ fileCount }} 篇文档</p></div>
        <div class="searchbox">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></svg>
          <input type="text" placeholder="搜索知识库、文档、实体" id="globalSearch" v-model="keyword" @keydown.enter="onSearchEnter" />
        </div>
        <button class="btn-new" id="btnNewTop" @click="openModal">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>新建知识库
        </button>
        <!-- 详情入口（A 方案下页面不显示列表，入口放在顶栏，点开选库进入） -->
        <el-popover v-if="bases.length > 0" placement="bottom-end" :width="300" trigger="click">
          <template #reference>
            <button class="btn-new" id="btnMyKb">
              <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>我的知识库 ({{ bases.length }})
            </button>
          </template>
          <div class="kb-pick">
            <div
              v-for="kb in bases"
              :key="kb.id"
              class="kb-pick__row"
              @click="emit('open', { id: kb.id })"
            >
              <b>{{ kb.name }}</b>
              <span>{{ kb.fileCount }} 篇文档 · {{ kb.fileCount > 0 ? '已就绪' : '待索引' }}</span>
            </div>
          </div>
        </el-popover>
      </header>
      <div class="content">
        <!-- 统计卡片 -->
        <section class="stats">
          <div class="stat-card">
            <div class="stat-ic"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg></div>
            <div class="stat-meta"><b>{{ kbCount }}</b><span>知识库</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg></div>
            <div class="stat-meta"><b>{{ fileCount }}</b><span>文档总量</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.2-7-11a7 7 0 0 1 14 0c0 5.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg></div>
            <div class="stat-meta"><b>{{ entityCount }}</b><span>实体节点</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-ic"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6" /></svg></div>
            <div class="stat-meta"><b>{{ relationCount }}</b><span>关系连线</span></div>
          </div>
        </section>
        <section class="lower">
          <!-- 创建面板 -->
          <div class="panel create-panel">
            <!-- 有库时：卡片网格（原稿只有空状态，这块是「进入详情」的必要入口） -->
            <!-- A 方案（已定）：主页面永远按原稿那一屏渲染 —— 插图 + 空白创建/从模板创建 +
                 底部教育场景模板，不显示知识库列表。
                 要把「我的知识库」列表恢复回来，把下面 v-if 改回 bases.length > 0 即可。 -->
            <template v-if="false">
              <div class="panel-head">
                <h2>我的知识库</h2>
                <span class="link-doc" @click="emit('help')">查看帮助文档</span>
              </div>
              <div class="kb-grid">
                <div
                  v-for="kb in bases"
                  :key="kb.id"
                  class="kb-card"
                  @click="emit('open', { id: kb.id })"
                >
                  <div class="kb-card__pic">
                    <img v-if="kb.cover" :src="kb.cover" :alt="kb.name" />
                    <div v-else class="kb-card__ph"><span>{{ initialsOf(kb.name) }}</span></div>
                  </div>
                  <div class="kb-card__body">
                    <b>{{ kb.name }}</b>
                    <p>{{ kb.description || '暂无描述' }}</p>
                    <div class="kb-card__foot">
                      <span>{{ kb.fileCount }} 篇文档</span>
                      <span>{{ kb.fileCount > 0 ? '已就绪' : '待索引' }}</span>
                      <button class="btn-use" @click.stop="emit('open', { id: kb.id })">进入</button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 无库时：原稿原样 -->
            <template v-else>
              <div class="panel-head">
                <h2>开始创建你的第一个知识库</h2>
                <span class="link-doc" id="linkDoc" @click="showToast('帮助文档：演示页面')">查看帮助文档</span>
              </div>
              <div class="empty-hero">
                <img :src="heroIllustration" alt="书本与知识节点">
                <h3>{{ bases.length > 0 ? '我的知识库' : '还没有知识库' }}</h3>
                <p>{{ bases.length > 0 ? '从「我的知识库」进入已有知识库，或继续新建' : '上传文档即可自动提取知识点，生成实体与关系网络' }}</p>
              </div>
              <div class="create-actions">
                <button class="ca ca-blank" id="btnBlank" @click="openModal">
                  <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 16a4 4 0 0 0 0-8 5.5 5.5 0 0 0-10.6 1.5A4 4 0 0 0 7 17h10" /><path d="M12 11v5m-2.5-2.5L12 16l2.5-2.5" /></svg>
                  <span><b>空白创建</b><span>从上传文档开始</span></span>
                </button>
                <button class="ca ca-tpl" id="btnTpl" @click="showToast('模板中心：演示页面')">
                  <svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></svg>
                  <span><b>从模板创建</b><span>套用预置结构</span></span>
                </button>
              </div>
              <div class="tpl-head">
                <b>教育场景模板</b>
                <span class="link-all" id="linkAll" @click="emit('all-templates')">全部模板</span>
              </div>
              <div class="tpl-grid">
                <div v-for="t in templates" :key="t.key" class="tpl-card">
                  <img class="pic" :src="t.cover" :alt="t.name" />
                  <div class="tpl-body">
                    <b>{{ t.name }}</b>
                    <div class="tpl-foot"><span>{{ t.entity }} 实体 · {{ t.relation }} 关系</span><button class="btn-use" @click="showToast('已选择「' + t.name + '」模板')">使用模板</button></div>
                  </div>
                </div>
              </div>
            </template>
          </div>
          <!-- 最近活动 -->
          <aside class="panel activity">
            <h2>最近活动</h2>
            <div class="act-empty">
              <svg viewBox="0 0 24 24" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 13h16M10 4v16" /></svg>
              <p>暂无活动，创建知识库、上传文档或生成图谱后会出现在这里</p>
            </div>
            <div class="act-demo">例如：知识库创建成功</div>
          </aside>
        </section>
      </div>
    </main>
  </div>

  <!-- 弹窗：外壳用仓库标准 ReDialog，内容为原稿原样（.modal-head + 关闭按钮也保留） -->
  <ReDialog v-model="overlayShown" :width="560" :close-on-click-modal="false" headless>
    <div class="modal-head">
      <b><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>新建知识库</b>
      <button class="modal-close" id="modalClose" @click="closeModal"><svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg></button>
    </div>
    <div class="seg">
      <button class="on" :class="{ on: seg === 'blank' }" id="segBlank" @click="seg = 'blank'">空白创建</button>
      <button :class="{ on: seg === 'tpl' }" id="segTpl" @click="goTpl">从模板创建</button>
    </div>
    <div class="form">
      <div class="fld">
        <label>知识库名称<i>*</i></label>
        <input type="text" id="kbName" v-model="form.name" placeholder="例如：三年级语文上册">
        <div class="hint">2-20 个字，创建后可在设置中修改</div>
      </div>
      <div class="fld">
        <label>描述</label>
        <textarea rows="2" v-model="form.description" placeholder="简单描述这个知识库的用途，例如收集课文、试卷与知识点"></textarea>
      </div>
      <div class="fld">
        <label>图标</label>
        <div class="icon-pick" id="iconPick">
          <button :class="{ on: form.icon === 0 }" @click="form.icon = 0"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z"/></svg></button>
          <button :class="{ on: form.icon === 1 }" @click="form.icon = 1"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 9 12 4 2 9l10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/><path d="M22 9v5"/></svg></button>
          <button :class="{ on: form.icon === 2 }" @click="form.icon = 2"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg></button>
          <button :class="{ on: form.icon === 3 }" @click="form.icon = 3"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></button>
          <button :class="{ on: form.icon === 4 }" @click="form.icon = 4"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 14.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13l3.5-2 3 2 3-2"/><path d="M9 8h5M9 11h3"/></svg></button>
          <button :class="{ on: form.icon === 5 }" @click="form.icon = 5"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg></button>
          <button :class="{ on: form.icon === 6 }" @click="form.icon = 6"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.6 5.6L20 9.4l-4 4 1 6-5-2.8L7 19.4l1-6-4-4 5.4-.8z"/></svg></button>
          <button :class="{ on: form.icon === 7 }" @click="form.icon = 7"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14c-3 0-6-2-6-5.5C6 5.5 8.5 3 12 3s6 2.5 6 5.5c0 3.5-3 5.5-6 5.5z"/><path d="M9 14c-1 3-1.5 6-3 7 3-.3 5-1.5 6-3 1 1.5 3 2.7 6 3-1.5-1-2-4-3-7"/></svg></button>
        </div>
      </div>
      <div class="fld">
        <label>主题色</label>
        <div class="color-pick" id="colorPick">
          <button
            v-for="c in colorChoices"
            :key="c"
            :class="{ on: form.color === c }"
            :style="{ background: c, color: c }"
            @click="form.color = c"
          ></button>
        </div>
      </div>
      <div class="fld">
        <label>可见范围</label>
        <div class="scope" id="scopePick">
          <button :class="{ on: form.scope === '私有' }" @click="form.scope = '私有'"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>私有<br>仅自己可见</button>
          <button :class="{ on: form.scope === '团队' }" @click="form.scope = '团队'"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 5.5a3 3 0 0 1 0 5.5M21 20a6 6 0 0 0-4-5.6"/></svg>团队<br>成员可见</button>
          <button :class="{ on: form.scope === '公开' }" @click="form.scope = '公开'"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18 14 14 0 0 0 0-18"/></svg>公开<br>所有人可见</button>
        </div>
      </div>
      <div class="fld">
        <label>高级配置（默认开启）</label>
        <div style="display:flex;flex-direction:column;gap:13px">
          <div class="switch-row"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/></svg><span>上传文档后自动提取知识点</span><div class="toggle" :class="{ off: !form.toggles.extract }" data-toggle @click="form.toggles.extract = !form.toggles.extract"></div></div>
          <div class="switch-row"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.3"/><circle cx="18" cy="6" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M8 10.8 16 7.2M8 13.2l8 3.8"/></svg><span>自动生成知识图谱</span><div class="toggle" :class="{ off: !form.toggles.graph }" data-toggle @click="form.toggles.graph = !form.toggles.graph"></div></div>
          <div class="switch-row"><svg viewBox="0 0 24 24" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l.8-5.5A8 8 0 1 1 21 12z"/><path d="M9.5 10.5h5M9.5 13.5h3"/></svg><span>接入 AI 问答</span><div class="toggle" :class="{ off: !form.toggles.qa }" data-toggle @click="form.toggles.qa = !form.toggles.qa"></div></div>
        </div>
      </div>
    </div>
    <div class="modal-foot">
      <span class="to-tpl" id="footTpl" @click="goTpl">需要预置结构？从模板创建</span>
      <div class="btns">
        <button class="btn-ghost" id="modalCancel" @click="closeModal">取消</button>
        <button class="btn-primary" id="modalCreate" @click="onCreate">创建知识库</button>
      </div>
    </div>
  </ReDialog>

  <div class="toast" id="toast" :class="{ show: toastShown }"><svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg><span>{{ toastMsg }}</span></div>
</template>

<script setup lang="ts">
/**
 * 知识库总览（原稿 `知识库总览.html` → Vue）。
 *
 * <p>转换口径：template 与样式表**逐条对照原稿**，只做两件事 ——
 * ① 把原稿底部那段原生 JS 改写成 Vue 的响应式与事件；
 * ② 把样式里的**颜色字面量换成系统变量**（规则、选择器、尺寸、圆角、投影一律不动）。
 *
 * <p>原稿里的侧边导航、弹窗外壳（`.overlay` / `.modal` / `.modal-head` / `.modal-close`）
 * 一律按原样保留，不再替换成 ReDialog —— 换成 ReDialog 后它自身的
 * `.dialog-content-wrapper > * { padding-right: 4px }` 与 `.el-dialog__body{padding:8px 20px}`
 * 会压掉原稿的内边距，CSS 就不能只做「字面量→变量」这一种改动了。</p>
 *
 * <p>数据：统计数字与列表来自父页面（`/api/knowledge/bases/overview` + 知识库列表），
 * 本组件不发请求、只上抛事件。</p>
 */
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import ReDialog from '@repo/ui/re-dialog'
import heroIllustration from '@/assets/kb/kb-empty-hero.png'

/** 最近活动条目 */
interface ActivityItem {
  /** 稳定 key */
  key: string
  /** 活动主体 */
  title: string
  /** 活动描述 */
  desc: string
  /** 相对时间文本 */
  time: string
  /** 事件时间戳 */
  ts: number
}

/** 教育场景模板条目 */
interface TemplateItem {
  /** 模板标识 */
  key: string
  /** 模板名称 */
  name: string
  /** 封面图地址 */
  cover: string
  /** 预置实体数 */
  entity: number
  /** 预置关系数 */
  relation: number
}

/** 列表条目 */
interface BaseItem {
  /** 知识库 ID */
  id: string
  /** 名称 */
  name: string
  /** 描述 */
  description: string | null
  /** 封面图地址 */
  cover?: string
  /** 文档数 */
  fileCount: number
  /** 实体数 */
  entityCount: number
  /** 关系数 */
  relationCount: number
  /** 是否已索引 */
  ready: boolean
}

defineProps<{
  /** 知识库总数 */
  kbCount: number
  /** 文档总数 */
  fileCount: number
  /** 实体总数 */
  entityCount: number
  /** 关系总数 */
  relationCount: number
  /** 最近活动 */
  activities: ActivityItem[]
  /** 教育场景模板 */
  templates: TemplateItem[]
  /** 知识库列表 */
  bases: BaseItem[]
}>()

const emit = defineEmits<{
  /** 创建提交 */
  (e: 'create', p: { name: string; description: string; isPublic: boolean }): void
  /** 帮助文档 */
  (e: 'help'): void
  /** 模板相关入口 */
  (e: 'all-templates'): void
  /** 搜索 */
  (e: 'search', kw: string): void
  /** 进入详情 */
  (e: 'open', kb: { id: string }): void
  /** 编辑 */
  (e: 'update', p: { id: string; name: string; description: string; isPublic: boolean }): void
  /** 删除 */
  (e: 'remove', kb: { id: string }): void
}>()

/**
 * 是否渲染原稿自带的侧边导航。
 *
 * <p>原稿里有这一列（工作台 / 知识库 / 文档中心 / 采集管理 / 问答记录 / 系统设置），
 * 样式表里的 `.sidebar`、`.brand`、`.nav-item` 等规则也一条没删、原样保留。
 * 但本页是嵌在系统 layout 内渲染的，系统自己已有一列导航，原稿这列打开后页面上会
 * 出现两列菜单。前面明确要求过「左侧的菜单删除只保留右侧」，因此默认关闭；
 * 想单独看原稿整页效果时置为 true 即可。</p>
 */
const SHOW_HTML_SIDEBAR = false

/** 原稿：overlay 显隐 */
const overlayShown = ref(false)
const toastShown = ref(false)
const toastMsg = ref('')
let toastTimer: number | undefined

/** 原稿：分段（默认「空白创建」高亮） */
const seg = ref<'blank' | 'tpl'>('blank')
const keyword = ref('')

/** 原稿的 6 个主题色（是「可选颜色」数据，不是样式值） */
const colorChoices = ['#12b8c8', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#64748b']

/** 弹框表单（图标 / 主题色 / 范围 / 开关，默认值同原稿） */
const form = reactive({
  name: '',
  description: '',
  icon: 0,
  color: colorChoices[0],
  scope: '团队',
  toggles: { extract: true, graph: true, qa: true } as Record<string, boolean>,
})

/**
 * 原稿 showToast。
 * @param msg 提示文本
 */
function showToast(msg: string) {
  toastMsg.value = msg
  toastShown.value = true
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toastShown.value = false
  }, 2200)
}

/** 原稿 openModal */
function openModal() {
  form.name = ''
  form.description = ''
  form.icon = 0
  form.color = colorChoices[0]
  form.scope = '团队'
  form.toggles.extract = true
  form.toggles.graph = true
  form.toggles.qa = true
  seg.value = 'blank'
  overlayShown.value = true
}

/** 原稿 closeModal */
function closeModal() {
  overlayShown.value = false
}

/**
 * 原稿的 Esc 关闭（`document.addEventListener`）。
 * @param e 键盘事件
 */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    closeModal()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})

/**
 * 原稿 goTpl：切到模板分段并关框，同时通知父页面开模板页。
 */
function goTpl() {
  seg.value = 'tpl'
  closeModal()
  emit('all-templates')
}

/**
 * 原稿导航点击：只处理高亮与演示提示。
 * @param name 导航项名称
 */
function onNav(name: string) {
  if (name !== '知识库') {
    showToast('「' + name + '」模块演示中')
  }
}

/**
 * 原稿搜索：回车提示，并把关键词交给父页面过滤。
 */
function onSearchEnter() {
  const v = keyword.value.trim()
  if (!v) {
    return
  }
  showToast('搜索：' + v)
  emit('search', v)
}

/**
 * 取名称首字做占位封面。
 * @param name 知识库名称
 * @returns 首字（最多两个字符）
 */
function initialsOf(name: string): string {
  const s = String(name || '').trim()
  return s ? s.slice(0, 2) : '知'
}

/**
 * 原稿创建：校验后关闭并提示，同时把字段交给父页面落库。
 */
function onCreate() {
  const name = form.name.trim()
  if (name.length < 2 || name.length > 20) {
    showToast('请先填写知识库名称')
    return
  }
  closeModal()
  showToast('知识库「' + name + '」创建成功')
  emit('create', {
    name,
    description: form.description.trim(),
    isPublic: form.scope === '公开',
  })
}
</script>

<style scoped>
/* 原稿 :root —— 只把颜色字面量换成系统变量，其余不动。
   注意：弹框 .overlay 与 .toast 是与 .app 平级的兄弟节点（原稿即 body 下三个兄弟），
   所以变量必须同时声明在这三个根上，否则弹框内的 var() 全部取不到值。 */
.app,.overlay,.toast{
  --sidebar-1: var(--el-menu-bg-color); --sidebar-2: var(--el-menu-bg-color);
  --primary: var(--el-color-primary); --primary-d: var(--el-color-primary-dark-2);
  --primary-grad: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary-dark-2));
  --bg: var(--el-bg-color-page); --card: var(--el-bg-color-overlay); --line: var(--color-surface-border, var(--el-border-color-lighter));
  --t1: var(--el-text-color-primary); --t2: var(--el-text-color-secondary); --t3: var(--el-text-color-placeholder);
  --shadow: 0 6px 22px color-mix(in srgb, var(--el-text-color-primary) 7%, transparent);
  --shadow-lg: 0 18px 50px color-mix(in srgb, var(--el-text-color-primary) 18%, transparent);
  --radius: 16px;
  font-family:"Noto Sans SC","PingFang SC","Microsoft YaHei",system-ui,sans-serif;
  color:var(--t1);
}
*{margin:0;padding:0;box-sizing:border-box}
/* 原稿的 html,body 规则落到组件根（scoped 下 body 匹配不到），其余不动 */
.app{background:var(--bg);font-size:14px;-webkit-font-smoothing:antialiased}
button{font-family:inherit;cursor:pointer;border:none;background:none}
input{font-family:inherit;outline:none}
.app{display:flex;min-height:100vh}

/* ===== 侧边导航 ===== */
.sidebar{width:232px;flex-shrink:0;background:linear-gradient(180deg,var(--sidebar-1),var(--sidebar-2));display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh}
.brand{display:flex;align-items:center;gap:11px;padding:4px 8px 24px}
.brand-logo{width:38px;height:38px;border-radius:11px;background:var(--primary-grad);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px color-mix(in srgb, var(--el-color-primary) 35%, transparent)}
.brand-name{color:var(--el-color-white);font-weight:700;font-size:18px;letter-spacing:.5px}
.nav{display:flex;flex-direction:column;gap:5px;flex:1}
.nav-item{display:flex;align-items:center;gap:12px;padding:11px 13px;border-radius:11px;color:var(--el-menu-text-color);font-size:14.5px;font-weight:400;transition:.18s;text-align:left;width:100%}
.nav-item svg{width:20px;height:20px;flex-shrink:0;stroke:currentColor}
.nav-item:hover{color:var(--el-color-white);background:var(--el-menu-hover-bg-color)}
.nav-item.active{color:var(--el-color-white);background:var(--primary-grad);box-shadow:0 6px 15px color-mix(in srgb, var(--el-color-primary) 40%, transparent);font-weight:500}
.side-foot{display:flex;align-items:center;gap:10px;padding:12px 10px 2px;border-top:1px solid color-mix(in srgb, var(--el-color-white) 8%, transparent)}
.avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--el-color-primary-light-5),var(--el-color-primary-dark-2));display:flex;align-items:center;justify-content:center;color:var(--el-color-white);font-weight:600;font-size:15px;overflow:hidden}
.avatar img{width:100%;height:100%;object-fit:cover}
.side-foot .meta{line-height:1.3}
.side-foot .meta b{color:var(--el-menu-text-color);font-size:13.5px;font-weight:500;display:block}
.side-foot .meta span{color:var(--el-text-color-placeholder);font-size:11.5px}

/* ===== 主区域 ===== */
.main{flex:1;min-width:0;display:flex;flex-direction:column}
.topbar{background:var(--card);padding:20px 32px;display:flex;align-items:center;gap:26px;border-bottom:1px solid var(--line)}
.page-title{display:flex;align-items:baseline;gap:13px;flex-shrink:0}
.page-title h1{font-size:24px;font-weight:900;letter-spacing:.5px}
.page-title p{color:var(--t2);font-size:13.5px;white-space:nowrap}
.searchbox{flex:1;max-width:760px;display:flex;align-items:center;gap:9px;background:var(--el-fill-color-light);border:1px solid var(--line);border-radius:24px;padding:10px 18px;transition:.2s}
.searchbox:focus-within{border-color:var(--primary);background:var(--card);box-shadow:0 0 0 3px var(--el-color-primary-light-9)}
.searchbox svg{width:18px;height:18px;stroke:var(--t3);flex-shrink:0}
.searchbox input{border:none;background:none;flex:1;font-size:14px;color:var(--t1)}
.searchbox input::placeholder{color:var(--t3)}
.btn-new{flex-shrink:0;background:var(--primary-grad);color:var(--el-color-white);font-weight:600;font-size:14.5px;padding:11px 22px;border-radius:24px;display:flex;align-items:center;gap:7px;box-shadow:0 8px 18px color-mix(in srgb, var(--el-color-primary) 35%, transparent);transition:.2s}
.btn-new:hover{transform:translateY(-1px);box-shadow:0 11px 22px color-mix(in srgb, var(--el-color-primary) 45%, transparent)}
.btn-new svg{width:17px;height:17px;stroke:var(--el-color-white)}

.content{padding:26px 32px 40px;flex:1}
/* 统计卡片 */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-bottom:22px}
.stat-card{background:var(--card);border-radius:var(--radius);padding:20px 22px;display:flex;align-items:center;gap:15px;box-shadow:var(--shadow);position:relative;overflow:hidden;min-height:96px}
.stat-card::after{content:"";position:absolute;right:-10px;bottom:-14px;width:120px;height:70px;opacity:.5;background-repeat:no-repeat;background-size:contain;background-position:right bottom}
.stat-ic{width:46px;height:46px;border-radius:12px;background:var(--el-color-primary-light-9);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.stat-ic svg{width:24px;height:24px;stroke:var(--primary-d);fill:none}
.stat-meta b{font-size:26px;font-weight:800;line-height:1.1;display:block}
.stat-meta span{color:var(--t2);font-size:13.5px}

/* 下部布局 */
.lower{display:grid;grid-template-columns:1fr 330px;gap:20px;align-items:start}
.panel{background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow)}
.create-panel{padding:26px 28px 28px}
.panel-head{display:flex;align-items:baseline;gap:14px;margin-bottom:6px}
.panel-head h2{font-size:20px;font-weight:800}
.link-doc{color:var(--primary-d);font-size:13.5px;font-weight:500;cursor:pointer}
.link-doc:hover{text-decoration:underline}
.empty-hero{display:flex;flex-direction:column;align-items:center;text-align:center;padding:18px 0 8px}
.empty-hero img{width:300px;max-width:70%}
.empty-hero h3{font-size:20px;font-weight:800;margin:8px 0 9px}
.empty-hero p{color:var(--t2);font-size:14px}
.create-actions{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:24px 0 28px}
.ca{border-radius:14px;padding:20px 24px;display:flex;align-items:center;gap:16px;text-align:left;transition:.2s}
.ca:hover{transform:translateY(-2px)}
.ca svg{width:40px;height:40px;flex-shrink:0}
.ca b{font-size:18px;font-weight:800;display:block;margin-bottom:3px}
.ca span{font-size:13px;opacity:.85}
.ca-blank{background:var(--primary-grad);color:var(--el-color-white);box-shadow:0 12px 26px color-mix(in srgb, var(--el-color-primary) 35%, transparent)}
.ca-blank svg{stroke:var(--el-color-white);fill:none}
.ca-tpl{background:var(--card);border:1.6px solid var(--el-color-primary-light-5);color:var(--t1)}
.ca-tpl svg{stroke:var(--primary-d);fill:none}
.ca-tpl span{color:var(--t2)}

.tpl-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:15px}
.tpl-head b{font-size:15.5px;font-weight:700}
.tpl-head .link-all{color:var(--primary-d);font-size:13.5px;cursor:pointer;font-weight:500}
.tpl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.tpl-card{border:1px solid var(--line);border-radius:13px;overflow:hidden;transition:.2s;background:var(--card);display:flex;flex-direction:column}
.tpl-card:hover{box-shadow:var(--shadow);transform:translateY(-3px);border-color:var(--el-color-primary-light-5)}
.tpl-card .pic{width:100%;aspect-ratio:400/225;object-fit:cover;display:block}
.tpl-body{padding:12px 13px 14px;display:flex;flex-direction:column;gap:9px;flex:1}
.tpl-body b{font-size:14px;font-weight:700}
.tpl-foot{display:flex;align-items:center;justify-content:space-between;margin-top:auto}
.tpl-foot span{color:var(--t3);font-size:12px}
.btn-use{border:1.3px solid var(--el-color-primary-light-5);color:var(--primary-d);font-size:12.5px;padding:5px 12px;border-radius:15px;transition:.15s;font-weight:500}
.btn-use:hover{background:var(--primary);color:var(--el-color-white);border-color:var(--primary)}

/* 有库时的卡片网格（原稿无此块，为「进入详情」入口新增） */
/* 顶栏「我的知识库」下拉里的条目（A 方案下的详情入口） */
.kb-pick{display:flex;flex-direction:column;gap:2px;max-height:320px;overflow-y:auto}
.kb-pick__row{display:flex;flex-direction:column;gap:2px;padding:9px 10px;border-radius:8px;cursor:pointer;transition:.15s}
.kb-pick__row:hover{background:var(--el-fill-color-light)}
.kb-pick__row b{font-size:13.5px;font-weight:600;color:var(--t1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.kb-pick__row span{font-size:12px;color:var(--t3)}

.kb-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.kb-card{border:1px solid var(--line);border-radius:var(--radius);overflow:hidden;background:var(--card);display:flex;flex-direction:column;cursor:pointer;transition:.2s}
.kb-card:hover{box-shadow:var(--shadow);border-color:var(--el-color-primary-light-5)}
.kb-card__pic{width:100%;aspect-ratio:400/150;background:var(--el-fill-color-light);overflow:hidden}
.kb-card__pic img{width:100%;height:100%;object-fit:cover;display:block}
.kb-card__ph{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--el-color-primary-light-9),var(--el-color-primary-light-7))}
.kb-card__ph span{font-size:30px;font-weight:800;color:var(--primary-d);letter-spacing:2px}
.kb-card__body{padding:14px 16px 16px;display:flex;flex-direction:column;gap:9px;flex:1}
.kb-card__body b{font-size:15px;font-weight:700}
.kb-card__body p{color:var(--t2);font-size:13px;line-height:1.6}
.kb-card__foot{display:flex;align-items:center;gap:8px;margin-top:auto}
.kb-card__foot span{color:var(--t3);font-size:12px}

/* 最近活动 */
.activity{padding:22px 24px 26px}
.activity h2{font-size:17px;font-weight:800;margin-bottom:18px}
.act-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:14px 0}
.act-empty svg{width:88px;height:88px;stroke:var(--el-border-color);fill:none;margin-bottom:16px}
.act-empty p{color:var(--t2);font-size:13.5px;line-height:1.7}
.act-demo{border-top:1.5px dashed var(--line);margin-top:20px;padding-top:16px;text-align:center;color:var(--t3);font-size:13px}

/* ===== 弹窗（外壳由 ReDialog 提供；以下规则与原稿逐条对应） =====
   代价说明：ReDialog 自身的 .dialog-content-wrapper > * { padding-right:4px } 与
   .el-dialog__body{padding:8px 20px} 会压掉原稿的内边距，故用 :deep() 归零，
   让 .seg 的 26px 与 .form 的 26px 与原稿一致。 */
:deep(.el-dialog__body){padding:0}
:deep(.dialog-content-wrapper){padding:0}
/* ReDialog 的 .dialog-content-wrapper > * 无条件把直接子元素 padding-right 压成 4px（滚动条位），
   特异性同源、顺序在后，压不过；直接还原原稿的 26px 右内边距。 */
.modal-head,.form,.modal-foot{padding-right:26px!important}
.overlay{position:fixed;inset:0;background:color-mix(in srgb, var(--el-text-color-primary) 42%, transparent);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;z-index:50;padding:24px}
.overlay.show{display:flex}
.modal{background:var(--card);border-radius:18px;width:560px;max-width:100%;max-height:92vh;overflow-y:auto;box-shadow:var(--shadow-lg);animation:pop .22s ease}
@keyframes pop{from{transform:scale(.95);opacity:0}to{transform:scale(1);opacity:1}}
.modal-head{display:flex;align-items:center;justify-content:space-between;padding:22px 26px 16px}
.modal-head b{font-size:19px;font-weight:800;display:flex;align-items:center;gap:10px}
.modal-head b svg{width:21px;height:21px;stroke:var(--primary-d);fill:none}
.modal-close{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--t3)}
.modal-close:hover{background:var(--el-fill-color-light);color:var(--t1)}
.modal-close svg{width:18px;height:18px;stroke:currentColor}
.seg{margin:0 26px 18px;background:var(--el-fill-color-light);border-radius:11px;padding:4px;display:flex}
.seg button{flex:1;padding:9px;border-radius:8px;font-size:14px;color:var(--t2);font-weight:500}
.seg button.on{background:var(--card);color:var(--primary-d);box-shadow:var(--el-box-shadow-lighter)}
.form{padding:0 26px 24px;display:flex;flex-direction:column;gap:17px}
.fld label{display:block;font-size:13px;color:var(--t2);margin-bottom:7px;font-weight:500}
.fld label i{color:var(--el-color-danger);font-style:normal;margin-left:3px}
.fld input[type=text],.fld textarea{width:100%;border:1.4px solid var(--el-border-color);border-radius:10px;padding:11px 14px;font-size:14px;color:var(--t1);resize:none;transition:.15s}
.fld input:focus,.fld textarea:focus{border-color:var(--primary);box-shadow:0 0 0 3px var(--el-color-primary-light-9)}
.hint{color:var(--t3);font-size:12px;margin-top:6px}
.icon-pick{display:flex;gap:9px;flex-wrap:wrap}
.icon-pick button{width:38px;height:38px;border-radius:10px;background:var(--el-fill-color-light);display:flex;align-items:center;justify-content:center;color:var(--t2)}
.icon-pick button svg{width:19px;height:19px;stroke:currentColor;fill:none}
.icon-pick button.on{background:var(--primary-grad);color:var(--el-color-white)}
.color-pick{display:flex;gap:11px}
.color-pick button{width:26px;height:26px;border-radius:50%;position:relative}
.color-pick button.on::after{content:"";position:absolute;inset:-4px;border:2px solid currentColor;border-radius:50%}
.scope{display:grid;grid-template-columns:repeat(3,1fr);gap:11px}
.scope button{border:1.4px solid var(--el-border-color);border-radius:11px;padding:13px 8px;display:flex;flex-direction:column;align-items:center;gap:7px;color:var(--t2);font-size:12.5px}
.scope button svg{width:21px;height:21px;stroke:currentColor;fill:none}
.scope button.on{border-color:var(--primary);color:var(--primary-d);background:var(--el-color-primary-light-9)}
.switch-row{display:flex;align-items:center;gap:12px}
.switch-row svg{width:19px;height:19px;stroke:var(--t2);fill:none}
.switch-row span{flex:1;font-size:13.5px;color:var(--t1)}
.toggle{width:42px;height:24px;border-radius:12px;background:var(--primary);position:relative;flex-shrink:0;transition:.2s}
.toggle::after{content:"";position:absolute;width:18px;height:18px;border-radius:50%;background:var(--el-color-white);top:3px;right:3px;transition:.2s}
.toggle.off{background:var(--el-border-color)}
.toggle.off::after{right:21px}
.modal-foot{display:flex;align-items:center;justify-content:space-between;padding:18px 26px;border-top:1px solid var(--line)}
.modal-foot .to-tpl{color:var(--primary-d);font-size:13px;cursor:pointer}
.modal-foot .btns{display:flex;gap:11px}
.btn-ghost{border:1.4px solid var(--el-border-color-lighter);color:var(--t2);padding:10px 22px;border-radius:22px;font-size:14px}
.btn-primary{background:var(--primary-grad);color:var(--el-color-white);padding:10px 24px;border-radius:22px;font-size:14px;font-weight:600;box-shadow:0 6px 15px color-mix(in srgb, var(--el-color-primary) 35%, transparent)}

/* toast */
.toast{position:fixed;top:26px;left:50%;transform:translateX(-50%) translateY(-80px);background:var(--t1);color:var(--card);padding:12px 22px;border-radius:24px;font-size:13.5px;box-shadow:var(--shadow-lg);z-index:80;transition:.3s;display:flex;align-items:center;gap:9px;max-width:90vw}
.toast.show{transform:translateX(-50%) translateY(0)}
.toast svg{width:17px;height:17px;stroke:var(--primary);fill:none;flex-shrink:0}

/* 响应式 */
@media (max-width:1100px){
  .stats{grid-template-columns:repeat(2,1fr)}
  .lower{grid-template-columns:1fr}
  .tpl-grid{grid-template-columns:repeat(2,1fr)}
}
@media (max-width:760px){
  .sidebar{display:none}
  .topbar{flex-wrap:wrap;padding:16px 18px;gap:14px}
  .content{padding:18px}
  .create-actions{grid-template-columns:1fr}
  .tpl-grid{grid-template-columns:1fr}
  .scope{grid-template-columns:1fr}
}
</style>
