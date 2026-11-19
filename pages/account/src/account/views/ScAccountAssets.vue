<template>
  <div class="account-assets">
    <!-- 顶部卡片：标题 / 搜索 / 过滤 / 动作（版式对齐密钥管理，过滤不再压在左栏） -->
    <header class="bar">
      <div class="bar-title">
        <h1>账号资产</h1>
        <span class="bar-count">{{ tableCount }}</span>
      </div>

      <label class="search bar-search">
        <ReIcon class="search-icon" name="Search" :size="13" />
        <input ref="searchInputRef" v-model="keyword" :placeholder="searchPlaceholder" />
      </label>

      <!-- 索引筛选：种类 / 用途 / 归属 + 排序，只影响左侧索引与可选行，不改变顶部分段 -->
      <div class="bar-selects" role="group" aria-label="按种类、用途、归属筛选并排序">
        <select v-model="kindFilter" class="bar-select" :class="{ 'is-on': kindFilter !== 'all' }" title="按种类筛选" aria-label="按种类筛选">
          <option value="all">全部种类</option>
          <option value="API_KEY">API 密钥</option>
          <option value="EMAIL">邮箱账号</option>
          <option value="SMS">短信账号</option>
          <option value="PHONE">手机号</option>
          <option value="TEMP_MAIL">临时邮箱</option>
          <option value="TEMP_PHONE">临时手机号</option>
        </select>
        <select v-model="usageFilter" class="bar-select" :class="{ 'is-on': usageFilter !== 'all' }" title="按用途筛选" aria-label="按用途筛选">
          <option value="all">全部用途</option>
          <option v-for="tag in ACCOUNT_CAPABILITY_TAGS" :key="tag.key" :value="tag.key">{{ tag.label }}</option>
        </select>
        <el-select
          v-model="ownerFilter"
          filterable
          size="small"
          class="bar-select-el"
          :class="{ 'is-on': ownerFilter !== 'all' }"
          title="按归属筛选"
          aria-label="按归属筛选"
          placeholder="全部归属"
        >
          <el-option label="全部归属" value="all" />
          <el-option label="部署级共享" value="shared" />
          <el-option v-for="owner in ownerOptions" :key="owner" :label="owner" :value="owner" />
        </el-select>
        <select v-model="sortKey" class="bar-select" title="排序方式" aria-label="排序方式">
          <option value="updated">按更新时间</option>
          <option value="name">按名称</option>
          <option value="status">启用优先</option>
        </select>
        <!-- 筛选生效时给出命中计数，并提供一键还原，避免逐个拨回「全部」 -->
        <span v-if="hasIndexFilter" class="bar-hit">
          命中 <b>{{ sortedIndexAccounts.length }}</b>&nbsp;/&nbsp;{{ accountList.length }}
          <button type="button" class="bar-hit-clear" title="清空种类 / 用途 / 归属筛选" @click="clearIndexFilters">清空</button>
        </span>
      </div>

      <div class="bar-filters" role="group" aria-label="按状态过滤">
        <button
          v-for="cell in kpiCells"
          :key="cell.key"
          type="button"
          class="filter"
          :class="{ 'is-on': cell.on }"
          :title="cell.hint"
          @click="cell.run()"
        >
          <span class="filter-label">{{ cell.label }}</span>
          <b class="filter-n" :class="cell.tone">{{ cell.value }}</b>
        </button>
      </div>

      <div class="bar-acts">
        <!-- 页面级推送状态灯：全页实时提醒共用一条 SSE，灯色一眼看出通没通；断开时点击可手动重连 -->
        <button type="button" class="sse-led" :class="'is-' + sseState" :title="sseHint" :aria-label="sseHint" @click="reconnectSse">
          <span class="sse-led__dot" aria-hidden="true"></span>
        </button>
        <button type="button" class="icon-btn" title="刷新" aria-label="刷新" @click="loadAll">
          <ReIcon name="RefreshLeft" :size="14" />
        </button>
        <!-- 批量选择模式开关：进模式后单击索引行即勾选，不必每行右键 / 按 Ctrl -->
        <button
          v-if="isAccountSegment"
          type="button"
          class="icon-btn"
          :class="{ 'is-on': batchMode }"
          :title="batchMode ? '退出批量选择（Esc）' : '批量选择'"
          :aria-label="batchMode ? '退出批量选择' : '批量选择'"
          :aria-pressed="batchMode"
          @click="toggleBatchMode"
        >
          <ReIcon name="Select" :size="14" />
        </button>
        <ReButton show-text size="small" icon="Plus" type="primary" @click="openCreate">{{ createLabel }}</ReButton>
      </div>
    </header>

    <div class="stage">
    <div v-if="loadError" class="alert">
      <span>账号列表加载失败：{{ loadError }}</span>
      <button type="button" @click="loadAll">重试</button>
    </div>

    <div class="ws" :style="{ '--idx-width': railWidth + 'px' }">
      <!-- ==================== 左侧：分组索引 ==================== -->
      <aside class="idx" aria-label="资产索引">
        <!-- 栏头：主色圆点 + 栏名 + 数量，填补列表上方空白（与侧栏分组标题同一套装饰语言） -->
        <div class="rail-head">
          <span class="rail-head__dot" aria-hidden="true"></span>
          <span class="rail-head__title">资产索引</span>
          <span class="rail-head__count">{{ tableCount }}</span>
        </div>

        <!-- 批量操作条：进入批量选择后出现，贴在索引顶部，图标按钮 + 提示压成一行 -->
        <div v-if="isAccountSegment && batchMode" class="batch-bar">
          <span class="batch-count" :class="{ 'is-empty': !selectedAccountIds.length }">
            <template v-if="selectedAccountIds.length">已选 <b>{{ selectedAccountIds.length }}</b> 项</template>
            <template v-else>单击左侧账号勾选</template>
          </span>
          <span class="batch-tools">
            <ReButton
              layout="square"
              size="small"
              icon="CircleCheck"
              tip="批量校验"
              :loading="batchBusy"
              :disabled="!selectedAccountIds.length"
              @click="batchVerify"
            />
            <ReButton
              layout="square"
              size="small"
              icon="SwitchButton"
              tip="批量启用"
              :loading="batchBusy"
              :disabled="!selectedAccountIds.length"
              @click="batchSetStatus(1)"
            />
            <ReButton
              layout="square"
              size="small"
              icon="TurnOff"
              tip="批量停用"
              :loading="batchBusy"
              :disabled="!selectedAccountIds.length"
              @click="batchSetStatus(0)"
            />
            <ReButton
              layout="square"
              size="small"
              icon="Delete"
              type="danger"
              tip="批量删除"
              :loading="batchBusy"
              :disabled="!selectedAccountIds.length"
              @click="batchRemove"
            />
          </span>
          <button type="button" class="batch-clear" @click="toggleBatchMode">取消</button>
        </div>

        <div v-if="segmentError" class="idx-error">{{ segmentError }}</div>

        <RailScrollList
          ref="railRef"
          :has-more="hasMoreRows"
          :item-count="visibleRows.length"
          :total="flatRows.length"
          finished-text="已到底"
          @load-more="loadMoreRows"
        >
          <div class="idx-scroll">
          <template v-if="visibleRows.length">
            <button
              v-for="item in visibleRows"
              :key="item.row.id"
              type="button"
              class="idx-row"
              :data-row-id="item.row.id"
              :class="{ 'is-on': item.row.selected, 'is-off': item.row.status === 0, 'is-checked': item.row.checked }"
              :title="item.row.name"
              @click="selectIndexRow(item.group, item.row, $event)"
              @dblclick="openIndexRow(item.group, item.row)"
              @contextmenu.prevent="openIndexMenu($event, item.group, item.row)"
            >
              <span v-if="batchMode && item.row.checkable" class="idx-box" :class="{ 'is-on': item.row.checked }" aria-hidden="true">
                <ReIcon v-if="item.row.checked" name="Select" :size="10" />
              </span>
              <span class="idx-main">
                <span class="idx-name" v-html="highlightName(item.row.name)"></span>
                <!-- 能力条：一条账号可标多个用途，逐个悬停出名字；没打标记时按种类兜底 -->
                <span v-if="item.row.caps?.length" class="idx-caps">
                  <span
                    v-for="cap in item.row.caps || []"
                    :key="cap.key"
                    class="idx-cap"
                    :title="cap.label"
                    :aria-label="cap.label"
                  >
                    <ReIcon :name="cap.icon" :size="11" />
                  </span>
                </span>
                <span v-else class="idx-sub">{{ item.row.sub }}</span>
              </span>
              <span v-if="item.row.tag && !item.row.caps?.length" class="idx-meta">
                <span
                  v-if="item.row.tag"
                  class="idx-tag"
                  :class="'is-' + item.row.tagTone"
                  :title="item.row.tagHint"
                >{{ item.row.tag }}</span>
                <span class="idx-time">{{ item.row.meta }}</span>
              </span>
            </button>
          </template>
          <div v-else-if="loading" class="idx-skeleton" aria-hidden="true">
            <div v-for="i in 8" :key="i" class="idx-skel-row">
              <span class="idx-skel-line is-name"></span>
              <span class="idx-skel-line is-sub"></span>
            </div>
          </div>
          <p v-else class="idx-empty">暂无资产，点下方新建</p>
          </div>
        </RailScrollList>
      </aside>

      <!-- 分栏手柄：拖拽改索引宽度，双击复位，偏好存本地 -->
      <ReRailSplit
        v-model:width="railWidth"
        class="ws-split"
        storage-key="account.rail.width.v1"
        :default-width="280"
        label="拖拽调整资产索引宽度"
      />

      <!-- ==================== 右侧：详情工作区 ==================== -->
      <section class="main" aria-label="资产详情">
        <!-- 右栏加载骨架：整页刷新时详情区给占位，不残留上一轮数据也不空白 -->
        <div v-if="loading" class="main-skel" aria-hidden="true">
          <span class="main-skel-line is-head"></span>
          <span class="main-skel-line is-line"></span>
          <span class="main-skel-line is-line is-short"></span>
          <span class="main-skel-line is-line"></span>
          <span class="main-skel-line is-line is-short"></span>
        </div>
        <!-- 分段接口失败且没有可看的详情：右栏给出重试入口，不只靠左栏一行小字 -->
        <div v-else-if="segmentError && !activeAppKey && !activeCookie" class="main-error">
          <span>{{ segmentError }}</span>
          <button type="button" @click="loadAll">重试</button>
        </div>
        <!-- ---------- 账号 ---------- -->
        <template v-else-if="isAccountSegment && activeAccount">
          <header class="main-head">
            <span class="main-mark" :class="'is-' + kindClass(activeAccount.kind)">
              <ReIcon :name="kindIcon(activeAccount.kind)" :size="16" />
            </span>
            <div class="main-title">
              <b :title="activeAccount.name">{{ activeAccount.name || '未命名账号' }}</b>
              <span>
                {{ kindLabel(activeAccount.kind) }} · {{ activeAccount.code || '—' }} ·
                {{ activeAccount.owner ? `仅本人（${activeAccount.owner}）` : '部署级共享' }}
              </span>
            </div>
            <ReTag v-if="activeAccount.defaultAccount" type="warning" effect="plain" size="small">默认</ReTag>
            <ReTag v-if="isTempMail(activeAccount)" type="warning" effect="plain" size="small">临时邮箱</ReTag>
            <ReTag :type="activeAccount.status === 0 ? 'info' : 'success'" effect="plain" size="small">
              {{ activeAccount.status === 0 ? '停用' : '启用' }}
            </ReTag>
          </header>

          <!-- 用途能力条：全部用途一排铺开（图标+文字标签），当前账号已标记的高亮；点击即切换并保存 -->
          <AccountCapBar :active-keys="activeCaps" @toggle="toggleCapability" />

          <nav class="main-tabs" role="tablist" aria-label="账号信息">
            <button
              v-for="tab in accountTabs"
              :key="tab.value"
              type="button"
              role="tab"
              class="main-tab"
              :class="{ 'is-on': mainTab === tab.value }"
              :aria-selected="mainTab === tab.value"
              @click="mainTab = tab.value"
            >
              {{ tab.label }}
              <b v-if="tab.value === 'mailbox' && unreadOf(activeAccount.accountId)" class="main-tab-badge">
                {{ unreadOf(activeAccount.accountId) }}
              </b>
            </button>
          </nav>

          <div class="main-body">
            <!-- 概览 -->
            <div v-if="mainTab === 'overview'" class="pane">
              <div class="facts">
                <div class="fact">
                  <span class="k">登录名 / 地址</span>
                  <span class="v mono">{{ activeAccount.username || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">服务地址</span>
                  <span class="v mono">{{ endpointText(activeAccount) || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">厂商</span>
                  <span class="v">{{ activeAccount.vendor || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">关联渠道</span>
                  <span class="v">{{ activeAccount.channelKey || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">归属</span>
                  <span class="v">{{ activeAccount.owner ? `仅本人（${activeAccount.owner}）` : '部署级共享' }}</span>
                </div>
                <div class="fact">
                  <span class="k">同种类默认</span>
                  <span class="v">{{ activeAccount.defaultAccount ? '是' : '否' }}</span>
                </div>
                <div class="fact">
                  <span class="k">创建时间</span>
                  <span class="v">{{ formatTime(activeAccount.createdAt) }}</span>
                </div>
                <div class="fact">
                  <span class="k">更新时间</span>
                  <span class="v">{{ formatTime(activeAccount.updatedAt) }}</span>
                </div>
                <div v-if="isTempMail(activeAccount)" class="fact">
                  <span class="k">临时邮箱租期</span>
                  <span class="v" :class="{ 'is-warn': activeTempMailTone === 'warn', 'is-bad': activeTempMailTone === 'bad' }">
                    {{ tempRemainText(activeAccount) }}
                  </span>
                </div>
              </div>
              <div v-if="activeAccount.verifyMessage" class="note" :class="'is-' + verifyTone(activeAccount.verifyStatus)">
                <ReIcon name="InfoFilled" :size="13" />
                <span>{{ activeAccount.verifyMessage }}</span>
              </div>
            </div>

            <!-- 凭据 -->
            <div v-else-if="mainTab === 'credential'" class="pane">
              <div class="cred-card" :class="hasCredential ? 'is-ok' : 'is-warn'">
                <ReIcon :name="hasCredential ? 'CircleCheckFilled' : 'WarningFilled'" :size="16" />
                <div>
                  <b>{{ hasCredential ? '凭据已配置' : '凭据尚未配置' }}</b>
                  <span>
                    {{
                      referencedSecretId
                        ? '校验时使用引用的密钥；账号自身凭据可留空。敏感值只进不出，编辑时留空表示不修改。'
                        : '敏感值只进不出：读取接口只返回「是否已配置」，编辑时留空表示不修改。'
                    }}
                  </span>
                </div>
              </div>

              <!-- 引用的密钥：回填「密钥管理」里那一条的真实数据，不重复展示裸 UUID -->
              <div class="secret-ref">
                <header class="secret-ref-head">
                  <ProviderLogo v-if="referencedSecret" :provider="referencedSecret.provider" :size="18" />
                  <b>{{ referencedSecret ? referencedSecret.name || '未命名密钥' : '未引用密钥管理里的密钥' }}</b>
                  <ReTag
                    v-if="referencedSecret"
                    :type="referencedSecret.status === 0 ? 'info' : 'success'"
                    effect="plain"
                    size="small"
                  >
                    {{ referencedSecret.status === 0 ? '停用' : '启用' }}
                  </ReTag>
                  <button type="button" class="secret-ref-link" @click="openSecretAssets">去密钥管理</button>
                </header>
                <div v-if="referencedSecret" class="facts">
                  <div class="fact is-wide">
                    <span class="k">AccessKeyId</span>
                    <span class="v mono">{{ referencedSecret.accessKey || '—' }}</span>
                  </div>
                  <div class="fact">
                    <span class="k">用途 / 厂商</span>
                    <span class="v">{{ providerLabel(referencedSecret.provider) }}</span>
                  </div>
                  <div class="fact">
                    <span class="k">AccessKeySecret</span>
                    <span class="v">{{ referencedSecret.hasSecret ? '已配置' : '待补' }}</span>
                  </div>
                  <div class="fact">
                    <span class="k">Region</span>
                    <span class="v">{{ referencedSecret.region || '—' }}</span>
                  </div>
                  <div class="fact">
                    <span class="k">服务地址</span>
                    <span class="v mono">{{ referencedSecret.endpoint || '厂商默认' }}</span>
                  </div>
                  <div class="fact is-wide">
                    <span class="k">最近更新</span>
                    <span class="v">{{ formatTime(referencedSecret.updatedAt) }}</span>
                  </div>
                </div>
                <p v-else class="pane-tip">
                  {{
                    referencedSecretId
                      ? `引用的密钥不在可见列表里（${referencedSecretId}），可能已被删除或不属于当前账号。`
                      : '凭据直接填在本账号里；要在多处复用同一把钥匙，去「密钥管理」新建后在编辑弹窗里选择。'
                  }}
                </p>
              </div>

              <h4 class="pane-title">类型专属配置</h4>
              <div v-if="configRows.length" class="facts">
                <div v-for="item in configRows" :key="item.key" class="fact">
                  <span class="k">{{ item.label }}</span>
                  <span class="v">{{ item.value }}</span>
                </div>
              </div>
              <ReEmpty v-else :image-size="48" description="暂无类型专属配置" />

              <!-- 邮件高级配置：详情页就地编辑，不必再开编辑弹窗 -->
              <section v-if="activeAccount.kind === 'EMAIL'" class="adv-card">
                <header class="adv-head">
                  <h4 class="pane-title">邮件高级配置</h4>
                  <button type="button" class="adv-preset" @click="applyAdv163Preset">163 一键预置</button>
                </header>
                <div class="adv-grid">
                  <div class="adv-field is-wide">
                    <span class="adv-label">接入方式</span>
                    <div class="adv-seg" role="group" aria-label="邮件接入方式">
                      <button
                        type="button"
                        :class="{ 'is-on': advForm.inboxMode === 'imap' }"
                        :aria-pressed="advForm.inboxMode === 'imap'"
                        @click="advForm.inboxMode = 'imap'"
                      >
                        IMAP/SMTP 服务
                      </button>
                      <button
                        type="button"
                        :class="{ 'is-on': advForm.inboxMode === 'pop3' }"
                        :aria-pressed="advForm.inboxMode === 'pop3'"
                        @click="advForm.inboxMode = 'pop3'"
                      >
                        POP3/SMTP 服务
                      </button>
                    </div>
                  </div>
                  <label class="adv-field">
                    <span class="adv-label">收取范围</span>
                    <select v-model="advForm.receiveRange" class="adv-input">
                      <option value="30d">收取最近 30 天邮件</option>
                      <option value="ALL">收取全部邮件</option>
                    </select>
                  </label>
                  <label class="adv-field">
                    <span class="adv-label">新邮件实时通知</span>
                    <span class="adv-switch">
                      <input v-model="advForm.notifyNew" type="checkbox" />
                      <span>{{ advForm.notifyNew ? '开启' : '关闭' }}</span>
                    </span>
                  </label>
                  <label v-if="advForm.inboxMode === 'pop3'" class="adv-field">
                    <span class="adv-label">POP3 主机</span>
                    <input v-model.trim="advForm.pop3Host" class="adv-input" placeholder="pop.163.com" maxlength="255" />
                  </label>
                  <label v-if="advForm.inboxMode === 'pop3'" class="adv-field">
                    <span class="adv-label">POP3 端口</span>
                    <input
                      v-model.number="advForm.pop3Port"
                      class="adv-input"
                      type="number"
                      min="1"
                      max="65535"
                      placeholder="995"
                    />
                  </label>
                </div>
                <footer class="adv-actions">
                  <span class="adv-hint">保存后立即生效：影响下一次收信与实时通知。</span>
                  <button type="button" class="adv-save" :disabled="advSaving" @click="saveAdvanced">
                    {{ advSaving ? '保存中…' : '保存高级配置' }}
                  </button>
                </footer>
              </section>
            </div>

            <!-- 校验记录 -->
            <div v-else-if="mainTab === 'verify'" class="pane">
              <div class="verify-hero" :class="'is-' + verifyTone(activeAccount.verifyStatus)">
                <ReIcon :name="activeAccount.verifyStatus === 'VALID' ? 'CircleCheckFilled' : 'WarningFilled'" :size="18" />
                <div>
                  <b>校验{{ verifyLabel(activeAccount.verifyStatus) }}</b>
                  <span>{{ activeAccount.verifyAt ? `最近一次：${formatTime(activeAccount.verifyAt)}` : '尚未执行过校验' }}</span>
                </div>
              </div>
              <div class="facts">
                <div class="fact">
                  <span class="k">校验状态</span>
                  <span class="v">
                    <ReTag :type="verifyTagType(activeAccount.verifyStatus)" effect="plain">
                      {{ verifyLabel(activeAccount.verifyStatus) }}
                    </ReTag>
                  </span>
                </div>
                <div class="fact">
                  <span class="k">最近校验</span>
                  <span class="v">{{ formatTime(activeAccount.verifyAt) }}</span>
                </div>
                <div class="fact">
                  <span class="k">校验说明</span>
                  <span class="v">{{ activeAccount.verifyMessage || '—' }}</span>
                </div>
              </div>
              <p class="pane-tip">校验会真实发起一次握手：API 密钥校验凭据是否存在，邮箱走 IMAP 登录，短信走模板可用性检查。</p>
            </div>

            <!-- 邮箱收发 / 短信发信 -->
            <div v-else class="pane">
              <div class="mail-hero">
                <span class="main-mark" :class="'is-' + kindClass(activeAccount.kind)">
                  <ReIcon :name="kindIcon(activeAccount.kind)" :size="16" />
                </span>
                <div class="mail-copy">
                  <b>{{ activeAccount.kind === 'EMAIL' ? '收 / 发信箱' : '短信发信' }}</b>
                  <span>
                    {{ activeAccount.kind === 'EMAIL'
                      ? `收信走 ${(activeAccount.config as Record<string, unknown> | undefined)?.inboxMode === 'pop3' ? 'POP3' : 'IMAP'}，发信走 SMTP，全部在应用内抽屉完成，不跳外部门户；打开即拉最新邮件，未读排在前面。`
                      : '发送走 MessagePush；短信没有收件箱，打开后直接写短信。' }}
                  </span>
                </div>
                <ReButton type="primary" icon="Message" show-text @click="openConsole(activeAccount)">
                  {{ activeAccount.kind === 'EMAIL' ? '打开邮箱' : '写短信' }}
                </ReButton>
              </div>
              <div class="facts">
                <div class="fact">
                  <span class="k">登录名</span>
                  <span class="v mono">{{ activeAccount.username || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">服务地址</span>
                  <span class="v mono">{{ endpointText(activeAccount) || '—' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作：纯图标 + 悬浮提示，不占横向版面（文字只在 tooltip 里出现） -->
          <footer class="main-foot">
            <ReButton
              text
              :show-text="false"
              icon="CircleCheck"
              :icon-size="28"
              tip="校验凭据"
              :loading="verifyingId === activeAccount.accountId"
              @click="onVerify(activeAccount)"
            />
            <ReButton
              text
              :show-text="false"
              icon="EditPen"
              :icon-size="28"
              tip="编辑"
              @click="openEdit(activeAccount)"
            />
            <ReButton
              v-if="!referencedSecretId"
              text
              :show-text="false"
              icon="Key"
              :icon-size="28"
              tip="收录到密钥管理"
              @click="collectSecretOf(activeAccount)"
            />
            <ReButton
              text
              :show-text="false"
              icon="CopyDocument"
              :icon-size="28"
              tip="复制为新账号"
              @click="duplicateAccount(activeAccount)"
            />
            <ReButton
              v-if="hasMailbox(activeAccount)"
              text
              :show-text="false"
              :icon="activeAccount.kind === 'EMAIL' ? 'Message' : 'ChatDotRound'"
              :icon-size="28"
              :tip="activeAccount.kind === 'EMAIL' ? '打开邮箱' : '写短信'"
              @click="openConsole(activeAccount)"
            />
            <span class="foot-gap"></span>
            <ReButton
              text
              :show-text="false"
              icon="Star"
              :icon-size="28"
              tip="设为默认"
              :disabled="Boolean(activeAccount.defaultAccount)"
              @click="setDefault(activeAccount)"
            />
            <ReButton
              text
              :show-text="false"
              :icon="activeAccount.status === 0 ? 'SwitchButton' : 'TurnOff'"
              :icon-size="28"
              :tip="activeAccount.status === 0 ? '启用' : '停用'"
              @click="toggleStatus(activeAccount)"
            />
            <ReButton
              text
              :show-text="false"
              icon="Delete"
              :icon-size="28"
              type="danger"
              tip="删除"
              @click="remove(activeAccount)"
            />
          </footer>
        </template>

        <!-- ---------- AppKey ---------- -->
        <template v-else-if="segment === 'APPKEY' && activeAppKey">
          <header class="main-head">
            <span class="main-mark is-key"><ReIcon name="Key" :size="16" /></span>
            <div class="main-title">
              <b :title="activeAppKey.name">{{ activeAppKey.name || '未命名密钥' }}</b>
              <span>访问密钥 · {{ activeAppKey.owner ? '仅本人' : '部署级共享' }}</span>
            </div>
            <ReTag v-if="keyLife" :type="keyLifeTagType" effect="plain" size="small">{{ keyLife.tag }}</ReTag>
          </header>

          <nav class="main-tabs" role="tablist" aria-label="访问密钥信息">
            <button
              v-for="tab in keyTabs"
              :key="tab.value"
              type="button"
              role="tab"
              class="main-tab"
              :class="{ 'is-on': mainTab === tab.value }"
              :aria-selected="mainTab === tab.value"
              @click="mainTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </nav>

          <div class="main-body">
            <div v-if="mainTab === 'overview'" class="pane">
              <div class="facts">
                <div class="fact">
                  <span class="k">AppKey</span>
                  <span class="v mono">{{ activeAppKey.appKey || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">状态</span>
                  <span class="v">{{ activeAppKey.status === 0 ? '停用' : '启用' }}</span>
                </div>
                <div class="fact">
                  <span class="k">归属</span>
                  <span class="v">{{ activeAppKey.owner ? `仅本人（${activeAppKey.owner}）` : '部署级共享' }}</span>
                </div>
                <div class="fact">
                  <span class="k">创建时间</span>
                  <span class="v">{{ formatTime(activeAppKey.createdAt) }}</span>
                </div>
                <div class="fact">
                  <span class="k">更新时间</span>
                  <span class="v">{{ formatTime(activeAppKey.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <div v-else-if="mainTab === 'secret'" class="pane">
              <div class="cred-card is-ok">
                <ReIcon name="Lock" :size="16" />
                <div>
                  <b>Secret 只进不出</b>
                  <span>Secret 明文只在创建或轮换后弹一次，之后任何读取接口都不会再返回。</span>
                </div>
              </div>
              <div class="facts">
                <div class="fact">
                  <span class="k">AppKey</span>
                  <span class="v mono">{{ activeAppKey.appKey || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">IP 白名单</span>
                  <span class="v mono">{{ activeAppKey.ipWhitelist || '不限制' }}</span>
                </div>
                <div class="fact">
                  <span class="k">备注</span>
                  <span class="v">{{ activeAppKey.remark || '—' }}</span>
                </div>
              </div>
            </div>

            <div v-else class="pane">
              <div class="facts">
                <div class="fact">
                  <span class="k">最近使用</span>
                  <span class="v">{{ formatTime(activeAppKey.lastUsedAt) }}</span>
                </div>
                <div class="fact">
                  <span class="k">过期</span>
                  <span class="v" :class="{ 'is-bad': expired(activeAppKey.expireAt) }">
                    {{ expireText(activeAppKey.expireAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 与账号 / Cookie 一致：底部只留图标 + 悬浮提示，文字只在 tooltip 里出现 -->
          <footer class="main-foot">
            <ReButton
              text
              :show-text="false"
              icon="CopyDocument"
              :icon-size="28"
              tip="复制 AppKey"
              @click="copyKey(activeAppKey)"
            />
            <ReButton
              text
              :show-text="false"
              icon="Refresh"
              :icon-size="28"
              tip="轮换 Secret（旧 Secret 立即失效）"
              @click="rotateKey(activeAppKey)"
            />
            <ReButton
              text
              :show-text="false"
              icon="EditPen"
              :icon-size="28"
              tip="编辑"
              @click="openEditKey(activeAppKey)"
            />
            <span class="foot-gap"></span>
            <ReButton
              text
              :show-text="false"
              :icon="activeAppKey.status === 0 ? 'SwitchButton' : 'TurnOff'"
              :icon-size="28"
              :tip="activeAppKey.status === 0 ? '启用' : '停用'"
              @click="toggleKeyStatus(activeAppKey)"
            />
            <ReButton
              text
              :show-text="false"
              icon="Delete"
              :icon-size="28"
              type="danger"
              tip="删除"
              @click="removeKey(activeAppKey)"
            />
          </footer>
        </template>

        <!-- ---------- Cookie ---------- -->
        <template v-else-if="segment === 'COOKIE' && activeCookie">
          <header class="main-head">
            <span class="main-mark is-cookie"><ReIcon name="Postcard" :size="16" /></span>
            <div class="main-title">
              <b :title="activeCookie.name">{{ activeCookie.name || '未命名 Cookie' }}</b>
              <span>Cookie · {{ activeCookie.domain || '—' }}{{ activeCookie.path || '/' }}</span>
            </div>
            <ReTag :type="activeCookie.status === 0 ? 'info' : 'success'" effect="plain" size="small">
              {{ activeCookie.status === 0 ? '停用' : '启用' }}
            </ReTag>
          </header>

          <nav class="main-tabs" role="tablist" aria-label="Cookie 信息">
            <button
              v-for="tab in cookieTabs"
              :key="tab.value"
              type="button"
              role="tab"
              class="main-tab"
              :class="{ 'is-on': mainTab === tab.value }"
              :aria-selected="mainTab === tab.value"
              @click="mainTab = tab.value"
            >
              {{ tab.label }}
            </button>
          </nav>

          <div class="main-body">
            <div v-if="mainTab === 'overview'" class="pane">
              <div class="facts">
                <div class="fact">
                  <span class="k">域名</span>
                  <span class="v mono">{{ activeCookie.domain || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">路径</span>
                  <span class="v mono">{{ activeCookie.path || '/' }}</span>
                </div>
                <div class="fact">
                  <span class="k">来源</span>
                  <span class="v">{{ activeCookie.source || '—' }}</span>
                </div>
                <div class="fact">
                  <span class="k">归属</span>
                  <span class="v">{{ activeCookie.owner ? `仅本人（${activeCookie.owner}）` : '部署级共享' }}</span>
                </div>
                <div class="fact">
                  <span class="k">创建时间</span>
                  <span class="v">{{ formatTime(activeCookie.createdAt) }}</span>
                </div>
                <div class="fact">
                  <span class="k">更新时间</span>
                  <span class="v">{{ formatTime(activeCookie.updatedAt) }}</span>
                </div>
              </div>
            </div>

            <div v-else-if="mainTab === 'content'" class="pane">
              <div class="cred-card" :class="activeCookie.hasValue ? 'is-ok' : 'is-warn'">
                <ReIcon :name="activeCookie.hasValue ? 'CircleCheckFilled' : 'WarningFilled'" :size="16" />
                <div>
                  <b>{{ activeCookie.hasValue ? 'Cookie 内容已配置' : 'Cookie 内容尚未配置' }}</b>
                  <span>内容只进不出：读取接口只返回「是否已配置」，编辑时留空表示不修改。</span>
                </div>
              </div>
              <div class="facts">
                <div class="fact">
                  <span class="k">备注</span>
                  <span class="v">{{ activeCookie.remark || '—' }}</span>
                </div>
              </div>
            </div>

            <div v-else class="pane">
              <div class="facts">
                <div class="fact">
                  <span class="k">过期</span>
                  <span class="v" :class="{ 'is-bad': expired(activeCookie.expireAt) }">
                    {{ expireText(activeCookie.expireAt) }}
                  </span>
                </div>
                <div class="fact">
                  <span class="k">状态</span>
                  <span class="v">{{ activeCookie.status === 0 ? '停用' : '启用' }}</span>
                </div>
              </div>
            </div>
          </div>

          <footer class="main-foot">
            <ReButton
              text
              :show-text="false"
              icon="EditPen"
              :icon-size="28"
              tip="编辑 Cookie"
              @click="openEditCookie(activeCookie)"
            />
            <span class="foot-gap"></span>
            <ReButton
              text
              :show-text="false"
              :icon="activeCookie.status === 0 ? 'SwitchButton' : 'TurnOff'"
              :icon-size="28"
              :tip="activeCookie.status === 0 ? '启用' : '停用'"
              @click="toggleCookieStatus(activeCookie)"
            />
            <ReButton
              text
              :show-text="false"
              icon="Delete"
              :icon-size="28"
              type="danger"
              tip="删除"
              @click="removeCookie(activeCookie)"
            />
          </footer>
        </template>

        <div v-else class="main-blank">
          <ReEmpty :image-size="64" :description="blankHint" />
          <p>单击左侧一条资产查看详情，双击打开完整编辑，右键有完整操作。</p>
        </div>
      </section>

      <!-- 右键菜单（索引行与表格共用一套动作） -->
      <div v-if="ctxMenu" class="ctx-layer" @click="ctxMenu = null" @contextmenu.prevent="ctxMenu = null">
        <ul class="ctx-menu" :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }" @click.stop>
          <li
            v-for="item in ctxMenu.items"
            :key="item.key"
            class="ctx-item"
            :class="{ 'is-divided': item.divided, 'is-disabled': item.disabled }"
            @click="runCtx(item)"
          >
            <ReIcon v-if="item.icon" :name="ctxIcon(item.icon)" :size="13" />
            <span>{{ item.label }}</span>
          </li>
        </ul>
      </div>

    </div>
    </div>

    <!-- 新增 / 编辑账号 -->
    <AccountFormDialog v-model="formVisible" :account="editing" :draft="draft" @saved="onSaved" />

    <!-- 新增 / 编辑 AppKey -->
    <AppKeyDialog v-model="keyFormVisible" :app-key="editingKey" @saved="onKeySaved" />

    <!-- 新增 / 编辑 Cookie -->
    <CookieDialog v-model="cookieFormVisible" :cookie="editingCookie" @saved="onCookieSaved" />

    <!-- 邮箱收发 / 短信发信：邮箱走 IMAP / SMTP，短信走 MessagePush -->
    <MailboxDrawer
      v-model="mailboxVisible"
      :account="mailboxAccount"
      :console-url="mailboxAccount ? accountConsoleUrl(mailboxAccount) : ''"
      @unread="onMailboxUnread"
    />

    <!-- 轮换后的一次性明文 -->
    <ReDialog v-model="secretVisible" title="新的 Secret" width="520px" append-to-body destroy-on-close>
      <div class="secret-box">
        <p class="secret-tip">「{{ secretName }}」的 Secret 已轮换，<b>关闭后无法再次查看</b>。</p>
        <div class="secret-value">{{ secretValue }}</div>
      </div>
      <template #footer>
        <ReButton @click="secretVisible = false">关闭</ReButton>
        <ReButton type="primary" @click="copySecret">复制 Secret</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="ScAccountAssets">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ChatDotRound,
  CircleCheck,
  CopyDocument,
  Delete,
  EditPen,
  Message,
  Refresh,
  Star,
  SwitchButton,
} from '@element-plus/icons-vue';
import { message } from '@repo/core';
import ReButton from '@repo/ui/re-button';
import ReDialog from '@repo/ui/re-dialog';
import ReEmpty from '@repo/ui/re-empty';
import ReIcon from '@repo/ui/re-icon';
import ReTag from '@repo/ui/re-tag';
import ReRailSplit, { readRailWidth } from '@repo/ui/re-rail-split';

import AccountFormDialog from '../components/AccountFormDialog.vue';
import MailboxDrawer from '../components/MailboxDrawer.vue';
import RailScrollList from '../components/RailScrollList.vue';
import AppKeyDialog from './components/AppKeyDialog.vue';
import CookieDialog from './components/CookieDialog.vue';
import ProviderLogo from './components/ProviderLogo.vue';
import AccountCapBar from './components/AccountCapBar.vue';
import {
  batchDeleteAccounts,
  batchUpdateAccountStatus,
  batchVerifyAccounts,
  claimTempMailbox,
  claimTempPhone,
  collectAccountSecret,
  deleteAccount,
  deleteAccountAppKey,
  deleteAccountCookie,
  destroyTempMailbox,
  destroyTempPhone,
  isTempMail,
  isTempPhone,
  listAccountAppKeys,
  listAccountCookies,
  listAccounts,
  listAccountSecrets,
  rotateAccountAppKey,
  syncAccountSmsTemplates,
  tempMailExpireAt,
  tempPhoneExpireAt,
  updateAccount,
  updateAccountAppKey,
  updateAccountCookie,
  verifyAccount,
  type AccountBatchResult,
  type AccountKind,
  type AccountVerifyStatus,
  type SysAccount,
  type SysAccountAppKey,
  type SysAccountCookie,
  type SysAccountSecret,
} from '../api/account';
import { providerLabel } from '../secretProviders';
import {
  ACCOUNT_CAPABILITY_TAGS,
  capabilityTagsOf,
  readCapabilityKeys,
  type AccountCapabilityTag,
} from '../capabilities';
import { accountConsoleUrl } from '../utils/accountLinks';
import { confirmThen } from '../../shared/confirmThen';
import { copyText } from '../../shared/clipboard';
import { errorText } from '../../shared/errorText';
import { useAccountEvents } from '../composables/useAccountEvents';

/**
 * 账号资产 —— monitor 的统一账号工作台（设计方向 B）。
 *
 * <p><b>为什么是工作台而不是纯台账</b>：账号总量小，但「凭据有没有配、校验过没有、
 * 归谁所有、能不能直接打开控制台」这些问题每次都要看。纯台账逼用户点开弹窗逐条确认；
 * 工作台把选中行的关键状态常驻在右侧检查器里，单击即看，双击才进完整详情。</p>
 *
 * <p><b>三类资产</b>：统一账号（设备密钥 / 邮箱 / 短信）、AppKey、Cookie 共用一套
 * KPI 带 + 分段页签 + 检查器，因为它们回答的是同一类问题——「这个凭据还能不能用」。
 * 三张表各自保留自己的列，不做字段对齐，避免把不同语义的字段硬塞进同一列。
 * 厂商密钥（AccessKey / AccessKeySecret）不进本页，由独立的「密钥管理」页按类型维护，
 * 账号表单引用时按类型选择。</p>
 *
 * <p><b>敏感值</b>：账号 secret / AppKey secret / Cookie 值都只进不出。列表与检查器
 * 只显示「是否已配置」，AppKey 的明文只在创建或轮换后弹一次。</p>
 */

/** 当前分段：账号三种 + AppKey + Cookie（密钥由「密钥管理」独立页维护） */
type Segment = 'ALL' | AccountKind | 'APPKEY' | 'COOKIE' | 'TEMP_MAIL';

/** 账号状态筛选 */
type StatusFilter = 'all' | 'on' | 'pending' | 'invalid';

/** 路由：凭据页签里跳到「密钥管理」看被引用的那条密钥；筛选状态也同步进 URL query */
const router = useRouter();
const route = useRoute();

/** 页面视图：账号资产是本页主体，模板管理与消息模板是账号管理下的子功能 */
/** 统一账号 */
const accountList = ref<SysAccount[]>([]);
/** 访问密钥 */
const appKeyList = ref<SysAccountAppKey[]>([]);
/** Cookie */
const cookieList = ref<SysAccountCookie[]>([]);
/** 密钥管理里的厂商密钥（账号 config.secretId 引用其中的一条） */
const secretList = ref<SysAccountSecret[]>([]);

/** 加载中 */
const loading = ref(false);
/** 账号接口错误 */
const loadError = ref('');
/** AppKey / Cookie 接口错误（分段内联提示） */
const appKeyError = ref('');
const cookieError = ref('');

/** 当前分段 */
const segment = ref<Segment>('ALL');
/** 搜索词 */
const keyword = ref('');

/** 顶部搜索框元素：快捷键「/」聚焦用 */
const searchInputRef = ref<HTMLInputElement | null>(null);

/* ---------- 左侧索引宽度（可拖拽，偏好存本地） ---------- */
const RAIL_WIDTH_KEY = 'account.rail.width.v1';
const railWidth = ref(readRailWidth(RAIL_WIDTH_KEY, 280));
/** 账号状态筛选 */
const statusFilter = ref<StatusFilter>('all');

/* ---------- 索引筛选与排序（只影响左侧索引与可选行，不改变顶部分段） ---------- */

/** 种类筛选：all 不限；临时邮箱按 isTempMail 判定，不落回邮箱组 */
const kindFilter = ref<'all' | AccountKind | 'TEMP_MAIL'>('all');
/** 用途筛选：capabilities 目录里的 key，未标记的账号按种类默认能力兜底 */
const usageFilter = ref<string>('all');
/** 归属筛选：shared = 部署级共享（owner 为空），其余为具体归属人 */
const ownerFilter = ref<string>('all');
/** 排序：最近更新（默认）/ 名称 / 启用优先 */
const sortKey = ref<'updated' | 'name' | 'status'>('updated');

/* ---------- 筛选状态同步 URL query：刷新 / 分享链接后分段与筛选不丢 ---------- */

/** query 里允许出现的分段值（与 Segment 类型一致的白名单） */
const SEGMENT_QUERY_VALUES: Segment[] = [
  'ALL',
  'APPKEY',
  'COOKIE',
  'TEMP_MAIL',
  'API_KEY',
  'EMAIL',
  'SMS',
  'PHONE',
  'TEMP_PHONE',
];

/**
 * 从 URL query 恢复分段与筛选。
 *
 * <p>只在进入页面时执行一次；之后状态变化单向写回 URL，不再监听 route，
 * 避免写回触发恢复形成循环。值都做白名单校验，query 被手改成非法值时静默忽略。</p>
 */
function restoreFiltersFromQuery(): void {
  const q = route.query;
  const segmentQuery = typeof q.segment === 'string' ? q.segment : '';
  if (SEGMENT_QUERY_VALUES.includes(segmentQuery as Segment)) segment.value = segmentQuery as Segment;
  const kindQuery = typeof q.kind === 'string' ? q.kind : '';
  if (['all', 'API_KEY', 'EMAIL', 'SMS', 'PHONE', 'TEMP_MAIL', 'TEMP_PHONE'].includes(kindQuery)) {
    kindFilter.value = kindQuery as typeof kindFilter.value;
  }
  const usageQuery = typeof q.usage === 'string' ? q.usage : '';
  if (usageQuery === 'all' || ACCOUNT_CAPABILITY_TAGS.some(tag => tag.key === usageQuery)) {
    usageFilter.value = usageQuery;
  }
  const ownerQuery = typeof q.owner === 'string' ? q.owner : '';
  if (ownerQuery) ownerFilter.value = ownerQuery;
  const sortQuery = typeof q.sort === 'string' ? q.sort : '';
  if (['updated', 'name', 'status'].includes(sortQuery)) sortKey.value = sortQuery as typeof sortKey.value;
  const statusQuery = typeof q.status === 'string' ? q.status : '';
  if (['all', 'on', 'pending', 'invalid'].includes(statusQuery)) statusFilter.value = statusQuery as StatusFilter;
  const keywordQuery = typeof q.kw === 'string' ? q.kw : '';
  if (keywordQuery) keyword.value = keywordQuery;
}

/** 把当前分段与筛选写回 URL（replace 不留历史；默认值从 query 里省略） */
function syncFiltersToQuery(): void {
  const query: Record<string, string | undefined> = {
    ...route.query,
    segment: segment.value === 'ALL' ? undefined : segment.value,
    kind: kindFilter.value === 'all' ? undefined : kindFilter.value,
    usage: usageFilter.value === 'all' ? undefined : usageFilter.value,
    owner: ownerFilter.value === 'all' ? undefined : ownerFilter.value,
    sort: sortKey.value === 'updated' ? undefined : sortKey.value,
    status: statusFilter.value === 'all' ? undefined : statusFilter.value,
  };
  void router.replace({ query }).catch(() => {});
}

restoreFiltersFromQuery();

// 分段 / 筛选 / 排序 / 状态变化即写回 URL；关键词输入频繁，防抖后再写
watch([segment, kindFilter, usageFilter, ownerFilter, sortKey, statusFilter], syncFiltersToQuery);
let keywordSyncTimer: ReturnType<typeof setTimeout> | null = null;
watch(keyword, () => {
  if (keywordSyncTimer) clearTimeout(keywordSyncTimer);
  keywordSyncTimer = setTimeout(() => {
    const kw = keyword.value.trim();
    void router.replace({ query: { ...route.query, kw: kw || undefined } }).catch(() => {});
  }, 400);
});
onBeforeUnmount(() => {
  if (keywordSyncTimer) clearTimeout(keywordSyncTimer);
});

/** 列表里出现过的归属人（去重排序，供归属筛选下拉用） */
const ownerOptions = computed(() =>
  [...new Set(accountList.value.map(row => row.owner).filter((owner): owner is string => Boolean(owner)))].sort((a, b) =>
    a.localeCompare(b, 'zh-Hans-CN'),
  ),
);

/** 种类筛选命中 */
function matchKind(row: SysAccount): boolean {
  if (kindFilter.value === 'all') return true;
  if (kindFilter.value === 'TEMP_MAIL') return isTempMail(row);
  if (kindFilter.value === 'TEMP_PHONE') return isTempPhone(row);
  return row.kind === kindFilter.value;
}

/** 用途筛选命中 */
function matchUsage(row: SysAccount): boolean {
  return usageFilter.value === 'all' || readCapabilityKeys(row.config, row.kind).includes(usageFilter.value);
}

/** 归属筛选命中 */
function matchOwner(row: SysAccount): boolean {
  if (ownerFilter.value === 'all') return true;
  if (ownerFilter.value === 'shared') return !row.owner;
  return row.owner === ownerFilter.value;
}

/** 是否有任一索引筛选生效（驱动命中计数与清空按钮的显隐） */
const hasIndexFilter = computed(
  () => kindFilter.value !== 'all' || usageFilter.value !== 'all' || ownerFilter.value !== 'all',
);

/** 一键清空种类 / 用途 / 归属筛选（排序保持不动） */
function clearIndexFilters(): void {
  kindFilter.value = 'all';
  usageFilter.value = 'all';
  ownerFilter.value = 'all';
}

/* ---------- 关键词命中高亮：索引行内把命中词标出来 ---------- */

/** HTML 转义：v-html 前先转义名称与关键词，防止注入 */
function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] || ch);
}

/** 正则元字符转义：关键词里的 . * 等按字面匹配 */
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 把索引行名称里的关键词命中部分包上 mark 高亮。
 *
 * <p>先转义再匹配：名称与关键词都按 HTML 实体对齐后替换，注入的只有
 * mark 标签本身，名称内容不会引入未转义的 HTML。</p>
 *
 * @param name 行名称
 * @returns 高亮后的 HTML
 */
function highlightName(name: string): string {
  const escaped = escapeHtml(name || '');
  const kw = keyword.value.trim();
  if (!kw) return escaped;
  const pattern = escapeRegExp(escapeHtml(kw));
  return escaped.replace(new RegExp(pattern, 'gi'), hit => `<mark class="idx-hit">${hit}</mark>`);
}

/** 选中的账号 / AppKey / Cookie */
const selectedAccountId = ref('');
const selectedAppKeyId = ref('');
const selectedCookieId = ref('');

/** 正在校验的账号 */
const verifyingId = ref<string | null>(null);

/** 账号表格勾选的账号标识 */
const selectedAccountIds = ref<string[]>([]);
/** 批量选择模式：进模式后单击索引行即勾选，不必再按 Ctrl / 右键 */
const batchMode = ref(false);
/** 批量操作进行中 */
const batchBusy = ref(false);
/** 临时邮箱领取中 */
const tempBusy = ref(false);

/** 账号新增 / 编辑 */
const formVisible = ref(false);
const editing = ref<SysAccount | null>(null);
/** 复制来源（新增时预填，不进入编辑态） */
const draft = ref<SysAccount | null>(null);
/** AppKey 新增 / 编辑 */
const keyFormVisible = ref(false);
const editingKey = ref<SysAccountAppKey | null>(null);
/** Cookie 新增 / 编辑 */
const cookieFormVisible = ref(false);
const editingCookie = ref<SysAccountCookie | null>(null);
/** 一次性明文 */
const secretVisible = ref(false);
const secretValue = ref('');
const secretName = ref('');

/** 邮箱收发 / 短信发信抽屉（邮箱 IMAP、短信 MessagePush） */
const mailboxVisible = ref(false);
const mailboxAccount = ref<SysAccount | null>(null);
/** 账号 → 收件箱未读数（抽屉打开后回填，用于页签角标；不预拉免得多开 IMAP 会话） */
const unreadByAccount = reactive<Record<string, number>>({});

/** 取某账号的未读数 */
function unreadOf(accountId?: string): number {
  return accountId ? unreadByAccount[accountId] || 0 : 0;
}

/** 抽屉回报的未读数 */
function onMailboxUnread(value: number): void {
  const id = mailboxAccount.value?.accountId;
  if (!id) return;
  unreadByAccount[id] = value || 0;
}

/** 新邮件推送（服务端轮询发现新邮件后经账号 SSE 广播） */
interface NewMailPush {
  accountId?: string;
  accountName?: string;
  count?: number;
  latest?: { subject?: string; from?: string; sentAt?: number | null };
}

/** 账号页统一 SSE 退订函数（组件卸载时统一释放，避免重复订阅） */
const eventUnsubs: Array<() => void> = [];

/* ---------- 页面级推送状态灯：全页实时提醒共用一条 SSE，通没通一眼可见 ---------- */

/** SSE 连接状态（模块级单例共享的响应式 ref，账号页所有组件看到同一个值） */
const sseConnected = useAccountEvents().connected;

/** 是否曾经连上过：区分「还没连上」与「连上后掉线」，避免首屏连接间隙误报 */
const sseEverConnected = ref(sseConnected.value);
watch(sseConnected, value => {
  if (value) sseEverConnected.value = true;
});

/** 状态灯三态：off 未连接（懒连接，灰）/ on 已连接（绿）/ lost 曾连上后断开（黄） */
const sseState = computed<'off' | 'on' | 'lost'>(() => {
  if (sseConnected.value) return 'on';
  return sseEverConnected.value ? 'lost' : 'off';
});

/** 状态灯悬停说明 */
const sseHint = computed(() => {
  if (sseState.value === 'on') return '实时推送已连接';
  if (sseState.value === 'lost') return '实时推送已断开，点击重连';
  return '实时推送未连接，点击连接';
});

/** 手动重连推送：自动重连放弃后给用户一个手动口子 */
function reconnectSse(): void {
  if (!sseConnected.value) {
    try {
      useAccountEvents().connect();
    } catch {
      /* 连接失败由 SSE 层自行记录，不打断页面 */
    }
  }
}

/** 新短信推送载荷（与 NewMailPush 同构：后端目录轮询发现新短信后广播） */
interface NewSmsPush {
  accountId?: string;
  accountName?: string;
  count?: number;
  latest?: { subject?: string; from?: string; sentAt?: number | null };
}

/**
 * 收到新短信推送：累加未读徽标 + 页内提示 + 浏览器通知。
 *
 * <p>推送是广播，所有在线客户端都会收到；按 payload.accountId 记账，
 * 抽屉若开着同号收信箱会由抽屉自己的订阅静默补拉最新列表。</p>
 *
 * @param msg SSE 消息（{@code data} 为推送载荷）
 */
function onNewSmsPush(msg: { data?: unknown }): void {
  const payload = (msg?.data || {}) as NewSmsPush;
  const accountId = payload.accountId;
  const count = Number(payload.count) || 0;
  if (!accountId || count <= 0) return;
  unreadByAccount[accountId] = (unreadByAccount[accountId] || 0) + count;
  const name = payload.accountName || '临时手机号';
  message.info(`${name} 收到 ${count} 条新短信`);
  notifyNewSms(name, count, payload.latest?.from || '');
}

/**
 * 浏览器通知：页面在后台时也能看到新短信。
 *
 * <p>权限未申请时先申请；不支持或被拒绝就只保留页内提示，不报错。</p>
 *
 * @param name  账号名
 * @param count 条数
 * @param from  发送号码
 */
function notifyNewSms(name: string, count: number, from: string): void {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  const title = `${name} 收到新短信`;
  const body = from ? `来自 ${from}，共 ${count} 条` : `共 ${count} 条`;
  const show = () => new Notification(title, { body, tag: `account-new-sms:${name}` });
  if (Notification.permission === 'granted') {
    show();
    return;
  }
  if (Notification.permission === 'default') {
    void Notification.requestPermission().then(permission => {
      if (permission === 'granted') show();
    });
  }
}

/**
 * 账号变更推送：任何客户端增删改账号后全量刷新一次。
 *
 * <p>列表数据量小，全量拉取最稳；自己的操作保存后本来就会刷新，
 * 随后再收到自己触发的广播只是多一次幂等刷新（loadAll 会保留选中项）。</p>
 */
function onAccountChanged(): void {
  void loadAll();
}

/**
 * 收到新邮件推送：累加未读徽标 + 页内提示 + 浏览器通知。
 *
 * <p>推送是广播，所有在线客户端都会收到；这里按 payload.accountId 记账，
 * 账号不在当前列表里也照样累加，用户切回来能看到角标。</p>
 *
 * @param msg Socket 消息（{@code data} 为推送载荷）
 */
function onNewMailPush(msg: { data?: unknown }): void {
  const payload = (msg?.data || {}) as NewMailPush;
  const accountId = payload.accountId;
  const count = Number(payload.count) || 0;
  if (!accountId || count <= 0) return;
  unreadByAccount[accountId] = (unreadByAccount[accountId] || 0) + count;
  const name = payload.accountName || '邮箱';
  const subject = payload.latest?.subject || '（无主题）';
  const from = payload.latest?.from || '';
  message.info(`${name} 收到 ${count} 封新邮件`);
  notifyNewMail(name, subject, from);
}

/**
 * 浏览器通知：页面在后台时也能看到新邮件。
 *
 * <p>权限未申请时先申请；不支持或被拒绝就只保留页内提示，不报错。</p>
 *
 * @param name    账号名
 * @param subject 邮件主题
 * @param from    发件人
 */
function notifyNewMail(name: string, subject: string, from: string): void {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
  const title = `${name} 收到新邮件`;
  const body = from ? `${from}：${subject}` : subject;
  const show = () => new Notification(title, { body, tag: `account-new-mail:${name}` });
  if (Notification.permission === 'granted') {
    show();
    return;
  }
  if (Notification.permission === 'default') {
    void Notification.requestPermission().then(permission => {
      if (permission === 'granted') show();
    });
  }
}

/** 是否为账号类分段 */
const isAccountSegment = computed(
  () =>
    segment.value === 'ALL' ||
    segment.value === 'API_KEY' ||
    segment.value === 'EMAIL' ||
    segment.value === 'SMS' ||
    segment.value === 'TEMP_MAIL' ||
    segment.value === 'TEMP_PHONE' ||
    segment.value === 'PHONE',
);

/** 新建按钮文案 */
const createLabel = computed(() => {
  if (segment.value === 'APPKEY') return '新增 AppKey';
  if (segment.value === 'COOKIE') return '新增 Cookie';
  if (segment.value === 'TEMP_MAIL') return '领取临时邮箱';
  if (segment.value === 'TEMP_PHONE') return '领取临时手机号';
  return '新增账号';
});

/** 搜索占位 */
const searchPlaceholder = computed(() => {
  if (segment.value === 'APPKEY') return '搜索名称 / AppKey / 备注';
  if (segment.value === 'COOKIE') return '搜索名称 / 域名 / 来源';
  if (segment.value === 'TEMP_MAIL') return '搜索地址 / 名称';
  if (segment.value === 'TEMP_PHONE') return '搜索号码 / 名称';
  if (segment.value === 'PHONE') return '搜索号码 / 名称';
  return '搜索名称 / 编码 / 登录名 / 地址';
});

/** 详情区空态提示 */
const blankHint = computed(() => {
  if (segment.value === 'APPKEY') return '选择一条访问密钥查看详情';
  if (segment.value === 'COOKIE') return '选择一条 Cookie 查看详情';
  if (segment.value === 'TEMP_MAIL') return '选择一条临时邮箱查看详情';
  if (segment.value === 'TEMP_PHONE') return '选择一条临时手机号查看详情';
  if (segment.value === 'PHONE') return '选择一条手机号查看详情';
  return '选择一条账号查看详情';
});

/** 分段内联错误 */
const segmentError = computed(() => {
  if (segment.value === 'APPKEY') return appKeyError.value;
  if (segment.value === 'COOKIE') return cookieError.value;
  return '';
});

// ==================== 概览计数 ====================

/** 启用账号数 */
const enabledCount = computed(() => accountList.value.filter(row => row.status !== 0).length);
/** 缺凭据账号数 */
const missingCount = computed(() => accountList.value.filter(row => !row.hasSecret).length);
/** 校验失败账号数 */
const invalidCount = computed(() => accountList.value.filter(row => row.verifyStatus === 'INVALID').length);
/** 临时邮箱数 */
const tempMailCount = computed(() => accountList.value.filter(row => isTempMail(row)).length);
/** 临时手机号数 */
const tempPhoneCount = computed(() => accountList.value.filter(row => isTempPhone(row)).length);
/** 关联渠道数（有 channelKey 的账号覆盖的渠道去重） */
const channelCount = computed(
  () => new Set(accountList.value.map(row => row.channelKey).filter(Boolean)).size,
);

/** KPI 单元格 */
const kpiCells = computed<
  Array<{ key: string; value: number; label: string; tone?: string; on: boolean; hint: string; run: () => void }>
>(() => [
  {
    key: 'accounts',
    value: accountList.value.length,
    label: '统一账号',
    on: isAccountSegment.value && segment.value === 'ALL' && statusFilter.value === 'all',
    hint: '查看全部账号',
    run: () => {
      setSegment('ALL');
      statusFilter.value = 'all';
    },
  },
  {
    key: 'tempmail',
    value: tempMailCount.value,
    label: '临时邮箱',
    tone: tempMailCount.value > 0 ? 'is-ok' : '',
    on: segment.value === 'TEMP_MAIL',
    hint: 'mail.tm 临时收信地址，到期自动清理',
    run: () => setSegment('TEMP_MAIL'),
  },
  {
    key: 'tempphone',
    value: tempPhoneCount.value,
    label: '临时手机号',
    tone: tempPhoneCount.value > 0 ? 'is-ok' : '',
    on: segment.value === 'TEMP_PHONE',
    hint: '本地目录轮询收码，只收不发，到期自动清理',
    run: () => setSegment('TEMP_PHONE'),
  },
  {
    key: 'enabled',
    value: enabledCount.value,
    label: '启用',
    tone: enabledCount.value > 0 ? 'is-ok' : '',
    on: isAccountSegment.value && statusFilter.value === 'on',
    hint: '只看启用中的账号',
    run: () => toggleStatusFilter('on'),
  },
  {
    key: 'missing',
    value: missingCount.value,
    label: '凭据待补',
    tone: missingCount.value > 0 ? 'is-warn' : '',
    on: isAccountSegment.value && statusFilter.value === 'pending',
    hint: '只看缺凭据的账号',
    run: () => toggleStatusFilter('pending'),
  },
  {
    key: 'invalid',
    value: invalidCount.value,
    label: '校验失败',
    tone: invalidCount.value > 0 ? 'is-bad' : '',
    on: isAccountSegment.value && statusFilter.value === 'invalid',
    hint: '只看校验失败的账号',
    run: () => toggleStatusFilter('invalid'),
  },
  {
    key: 'channels',
    value: channelCount.value,
    label: '关联渠道',
    on: false,
    hint: '账号覆盖的渠道数',
    run: () => {
      setSegment('ALL');
      statusFilter.value = 'all';
      keyword.value = '';
    },
  },
  {
    key: 'appkeys',
    value: appKeyList.value.length,
    label: 'AppKey',
    on: segment.value === 'APPKEY',
    hint: '外部访问密钥',
    run: () => setSegment('APPKEY'),
  },
  {
    key: 'cookies',
    value: cookieList.value.length,
    label: 'Cookie',
    on: segment.value === 'COOKIE',
    hint: '免登录会话 Cookie',
    run: () => setSegment('COOKIE'),
  },
]);

// ==================== 列表数据 ====================

/** 账号筛选结果 */
const filteredAccounts = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  return accountList.value.filter(row => {
    if (isAccountSegment.value && segment.value !== 'ALL') {
      if (segment.value === 'TEMP_MAIL') {
        if (!isTempMail(row)) return false;
      } else if (row.kind !== segment.value) {
        return false;
      }
    }
    if (statusFilter.value === 'on' && row.status === 0) return false;
    if (statusFilter.value === 'pending' && row.hasSecret) return false;
    if (statusFilter.value === 'invalid' && row.verifyStatus !== 'INVALID') return false;
    if (!text) return true;
    return `${row.name || ''} ${row.code || ''} ${row.username || ''} ${row.endpoint || ''}`
      .toLowerCase()
      .includes(text);
  });
});

/** AppKey 筛选结果 */
const filteredAppKeys = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return appKeyList.value;
  return appKeyList.value.filter(row =>
    `${row.name || ''} ${row.appKey || ''} ${row.remark || ''}`.toLowerCase().includes(text),
  );
});

/** Cookie 筛选结果 */
const filteredCookies = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  if (!text) return cookieList.value;
  return cookieList.value.filter(row =>
    `${row.name || ''} ${row.domain || ''} ${row.source || ''} ${row.remark || ''}`.toLowerCase().includes(text),
  );
});

/**
 * 索引里的账号结果。
 *
 * <p>和右侧详情不同：索引永远列全部分组，不受当前 {@code segment} 影响，
 * 否则点中一条后左侧就只剩该组，切换别的分组还得回顶栏。</p>
 */
const indexAccounts = computed(() => {
  const text = keyword.value.trim().toLowerCase();
  return accountList.value.filter(row => {
    if (statusFilter.value === 'on' && row.status === 0) return false;
    if (statusFilter.value === 'pending' && row.hasSecret) return false;
    if (statusFilter.value === 'invalid' && row.verifyStatus !== 'INVALID') return false;
    if (!matchKind(row) || !matchUsage(row) || !matchOwner(row)) return false;
    if (!text) return true;
    return `${row.name || ''} ${row.code || ''} ${row.username || ''} ${row.endpoint || ''}`
      .toLowerCase()
      .includes(text);
  });
});

/**
 * 排序后的索引账号。
 *
 * <p>默认最近更新在前；按名称时用中文 locale 比较；按状态时启用的排前面、
 * 组内仍保持更新时间倒序（sort 不稳定，先比状态再比时间）。</p>
 */
const sortedIndexAccounts = computed(() => {
  const list = [...indexAccounts.value];
  if (sortKey.value === 'name') {
    return list.sort(
      (a, b) => (a.name || a.code || '').localeCompare(b.name || b.code || '', 'zh-Hans-CN'),
    );
  }
  if (sortKey.value === 'status') {
    return list.sort(
      (a, b) => (a.status === 0 ? 1 : 0) - (b.status === 0 ? 1 : 0) || (b.updatedAt || 0) - (a.updatedAt || 0),
    );
  }
  return list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
});

/** 索引分组行 */
interface IndexRow {
  /** 行标识 */
  id: string;
  /** 主标题 */
  name: string;
  /** 副标题 */
  sub: string;
  /** 右侧时间 */
  meta: string;
  /** 右侧状态标签 */
  tag: string;
  /** 标签语义 */
  tagTone: 'ok' | 'warn' | 'bad' | 'idle';
  /** 标签悬停说明（生命周期 / 租期等合成状态的判定依据） */
  tagHint?: string;
  /** 启停状态（0 停用；无启停概念时为 undefined） */
  status?: number;
  /** 是否选中 */
  selected: boolean;
  /** 是否加入批量选择 */
  checked: boolean;
  /** 是否参与批量选择（账号行才可勾选，AppKey / Cookie 不进批量接口） */
  checkable: boolean;
  /** 用途能力（账号行才有：标记 + 种类兜底） */
  caps?: AccountCapabilityTag[];
}

/** 索引分组 */
interface IndexGroup {
  /** 分组标识，同时是分段值 */
  key: Segment;
  /** 分组标题 */
  label: string;
  /** 分组图标 */
  icon: string;
  /** 分组行（当页切片；分组自身总行数见 {@link total}） */
  rows: IndexRow[];
  /** 分组总行数（分页后仍显示完整条数，不跟着当页条数变） */
  total?: number;
}

/**
 * 临时资源租期预警档位：已过期 → bad；不足 24 小时 → warn；其余 ok。
 *
 * <p>临时邮箱 / 手机号都是短租期资源，只有「过期」一个红色态时，
 * 「还剩 3 小时」和「还剩 5 天」看起来一样安全；24 小时内升级为警告色。</p>
 *
 * @param expireAt 租期到期毫秒时间戳（0 表示未知）
 * @returns 预警档位
 */
function tempLeaseTone(expireAt: number): 'ok' | 'warn' | 'bad' {
  if (!expireAt) return 'ok';
  const left = expireAt - Date.now();
  if (left <= 0) return 'bad';
  return left < 86_400_000 ? 'warn' : 'ok';
}

/** 不足 1 小时的剩余文案（分钟向上保底 1，避免显示「剩 0m」） */
function remainMinutesText(left: number): string {
  return `剩 ${Math.max(1, Math.floor(left / 60000))}m`;
}

/**
 * 临时邮箱剩余时间文案。
 *
 * @param account 账号
 * @returns 如「剩 23h」「剩 5h32m」「已过期」
 */
function tempRemainText(account: SysAccount): string {
  const expireAt = tempMailExpireAt(account);
  if (!expireAt) return '—';
  const left = expireAt - Date.now();
  if (left <= 0) return '已过期';
  const hours = Math.floor(left / 3600000);
  if (hours >= 1) {
    const minutes = Math.floor((left % 3600000) / 60000);
    return minutes > 0 ? `剩 ${hours}h${minutes}m` : `剩 ${hours}h`;
  }
  return remainMinutesText(left);
}

/** 临时手机号剩余时间文案（同临时邮箱：到期前显示剩余时分） */
function tempPhoneRemainText(account: SysAccount): string {
  const expireAt = tempPhoneExpireAt(account);
  if (!expireAt) return '—';
  const left = expireAt - Date.now();
  if (left <= 0) return '已过期';
  const hours = Math.floor(left / 3600000);
  if (hours >= 1) {
    const minutes = Math.floor((left % 3600000) / 60000);
    return minutes > 0 ? `剩 ${hours}h${minutes}m` : `剩 ${hours}h`;
  }
  return remainMinutesText(left);
}

/**
 * AppKey 生命周期徽标：启停 + 有效期 + 使用痕迹合成一个标签。
 *
 * <p>只看「启用 / 停用」会漏掉三类隐患：快过期的钥匙、从没用过的钥匙、
 * 长期闲置的钥匙。按 停用 → 已过期 → 即将到期 → 未使用 → 久未使用 → 启用
 * 的优先级给出行内徽标与悬停说明，索引行与详情页头共用同一套判定。</p>
 *
 * @param row AppKey
 * @returns 徽标文案、语义色与悬停说明
 */
function appKeyLifecycle(row: SysAccountAppKey): { tag: string; tone: IndexRow['tagTone']; hint: string } {
  if (row.status === 0) return { tag: '停用', tone: 'idle', hint: '密钥已停用，调用会被拒绝' };
  const now = Date.now();
  if (row.expireAt && row.expireAt <= now) {
    return { tag: '已过期', tone: 'bad', hint: `已于 ${formatShort(row.expireAt)} 过期` };
  }
  if (row.expireAt) {
    const days = Math.ceil((row.expireAt - now) / 86_400_000);
    if (days <= 7) {
      return { tag: days <= 1 ? '即将过期' : `${days}天后到期`, tone: 'warn', hint: `${formatShort(row.expireAt)} 过期，记得轮换` };
    }
  }
  if (!row.lastUsedAt) return { tag: '未使用', tone: 'warn', hint: '创建后从未被调用过' };
  const idleDays = Math.floor((now - row.lastUsedAt) / 86_400_000);
  if (idleDays >= 90) {
    return { tag: '久未使用', tone: 'warn', hint: `最近使用在 ${formatShort(row.lastUsedAt)}，确认是否还需保留` };
  }
  return { tag: '启用', tone: 'ok', hint: '使用中' };
}

/** 左侧分组索引 */
const indexGroups = computed<IndexGroup[]>(() => {
  const groups: IndexGroup[] = [];
  const kinds: Array<{ kind: AccountKind; label: string; icon: string }> = [
    { kind: 'API_KEY', label: 'API 密钥', icon: 'Key' },
    { kind: 'EMAIL', label: '邮箱账号', icon: 'Message' },
    { kind: 'SMS', label: '短信账号', icon: 'ChatDotRound' },
    { kind: 'PHONE', label: '手机号', icon: 'Iphone' },
  ];

  for (const def of kinds) {
    const rows = sortedIndexAccounts.value
      .filter(row => row.kind === def.kind && !isTempMail(row))
      .map<IndexRow>(row => ({
        id: row.accountId,
        name: row.name || row.code || '未命名账号',
        sub: `${row.vendor || kindLabel(row.kind)}${row.username ? ` · ${row.username}` : ''}`,
        meta: formatShort(row.updatedAt),
        tag: row.status === 0 ? '停用' : verifyLabel(row.verifyStatus),
        tagTone: row.status === 0 ? 'idle' : row.hasSecret ? verifyTone(row.verifyStatus) : 'warn',
        caps: capabilityTagsOf(row.config, row.kind),
        status: row.status,
        selected: selectedAccountId.value === row.accountId,
        checked: selectedAccountIds.value.includes(row.accountId),
        checkable: true,
      }));
    groups.push({ key: def.kind, label: def.label, icon: def.icon, rows });
  }

  groups.push({
    key: 'TEMP_MAIL',
    label: '临时邮箱',
    icon: 'Promotion',
    rows: sortedIndexAccounts.value
      .filter(row => isTempMail(row))
      .map<IndexRow>(row => {
        const tone = tempLeaseTone(tempMailExpireAt(row));
        return {
          id: row.accountId,
          name: row.username || row.name || '临时邮箱',
          sub: `${row.vendor || 'mail.tm'} · 临时收信`,
          meta: tempRemainText(row),
          tag: tone === 'bad' ? '已过期' : tone === 'warn' ? '即将到期' : '临时',
          tagTone: tone,
          tagHint: tone === 'bad' ? '租期已到，随时可能被清理' : tone === 'warn' ? '租期不足 24 小时，需要就尽快使用' : '租期内正常使用',
          caps: capabilityTagsOf(row.config, row.kind),
          status: row.status,
          selected: selectedAccountId.value === row.accountId,
          checked: selectedAccountIds.value.includes(row.accountId),
          checkable: true,
        };
      }),
  });

  groups.push({
    key: 'TEMP_PHONE',
    label: '临时手机号',
    icon: 'Iphone',
    rows: sortedIndexAccounts.value
      .filter(row => isTempPhone(row))
      .map<IndexRow>(row => {
        const tone = tempLeaseTone(tempPhoneExpireAt(row));
        return {
          id: row.accountId,
          name: row.username || row.name || '临时手机号',
          sub: `${row.vendor || '本地目录'} · 只收短信`,
          meta: tempPhoneRemainText(row),
          tag: tone === 'bad' ? '已过期' : tone === 'warn' ? '即将到期' : '临时',
          tagTone: tone,
          tagHint: tone === 'bad' ? '租期已到，随时可能被清理' : tone === 'warn' ? '租期不足 24 小时，需要就尽快使用' : '租期内正常使用',
          caps: capabilityTagsOf(row.config, row.kind),
          status: row.status,
          selected: selectedAccountId.value === row.accountId,
          checked: selectedAccountIds.value.includes(row.accountId),
          checkable: true,
        };
      }),
  });

  if (statusFilter.value === 'all') {
    groups.push({
      key: 'APPKEY',
      label: 'AppKey',
      icon: 'Key',
      rows: filteredAppKeys.value.map<IndexRow>(row => {
        const life = appKeyLifecycle(row);
        return {
          id: row.appKeyId,
          name: row.name || row.appKey || '未命名密钥',
          sub: row.appKey || '—',
          meta: formatShort(row.lastUsedAt),
          tag: life.tag,
          tagTone: life.tone,
          tagHint: life.hint,
          status: row.status,
          selected: selectedAppKeyId.value === row.appKeyId,
          checked: false,
          checkable: false,
        };
      }),
    });
    groups.push({
      key: 'COOKIE',
      label: 'Cookie',
      icon: 'Postcard',
      rows: filteredCookies.value.map<IndexRow>(row => ({
        id: row.cookieId,
        name: row.name || row.domain || '未命名 Cookie',
        sub: `${row.domain || '—'}${row.path || '/'}`,
        meta: formatShort(row.updatedAt),
        tag: row.status === 0 ? '停用' : expired(row.expireAt) ? '过期' : '启用',
        tagTone: row.status === 0 ? 'idle' : expired(row.expireAt) ? 'bad' : 'ok',
        status: row.status,
        selected: selectedCookieId.value === row.cookieId,
        checked: false,
        checkable: false,
      })),
    });
  }
  return groups;
});

/** 索引里的总行数 */
const tableCount = computed(() => indexGroups.value.reduce((sum, group) => sum + group.rows.length, 0));

/** 索引每批行数：滚动到底再追加一批，不做页码翻页 */
const RAIL_BATCH_SIZE = 30;

/** 索引滚动列表组件（暴露视口元素供行定位 / 回顶） */
const railRef = ref<InstanceType<typeof RailScrollList> | null>(null);

/** 索引已挂载的行数（滚动追加的游标） */
const railLimit = ref(RAIL_BATCH_SIZE);

/** 摊平后的索引行（分组 → 行，保留所属分组供点击 / 右键回写分段） */
interface IndexEntry {
  /** 所属分组 */
  group: IndexGroup;
  /** 行 */
  row: IndexRow;
}

/**
 * 摊平索引：左栏不再按「分组 → 缩进」两级展示，分组只作为行上的元信息。
 *
 * <p>列表按账号类型顺序平铺，滚动追加，一眼能看到全部资产，不用先展开分组。</p>
 */
const flatRows = computed<IndexEntry[]>(() =>
  indexGroups.value.flatMap(group => group.rows.map(row => ({ group, row }))),
);

/** 当前挂载的行（只挂前 railLimit 条，避免一次渲染上千行） */
const visibleRows = computed<IndexEntry[]>(() => flatRows.value.slice(0, railLimit.value));

/** 是否还有未挂载的行（触底追加） */
const hasMoreRows = computed(() => flatRows.value.length > visibleRows.value.length);

/** 索引触底：追加下一批（由 RailScrollList 统一监听触底） */
function loadMoreRows(): void {
  if (hasMoreRows.value) railLimit.value += RAIL_BATCH_SIZE;
}

/**
 * 把某一行滚进可视区。
 *
 * <p>选中项可能是被程序切过去的（右键菜单 / 新建后回填），这时它可能还没挂载，
 * 先把它所在批放出来再滚过去，否则详情换了一条、索引里却看不见它。</p>
 *
 * @param id 行的资产标识（账号 / AppKey / Cookie 共用一套索引）
 */
function scrollRowIntoView(id: string): void {
  const at = flatRows.value.findIndex(item => item.row.id === id);
  if (at < 0) return;
  if (at >= railLimit.value) railLimit.value = at + RAIL_BATCH_SIZE;
  void nextTick(() => {
    const el = railRef.value?.viewport?.querySelector<HTMLElement>(`[data-row-id="${id}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  });
}

// 搜索 / 状态筛选 / 切分段 / 索引筛选与排序变化时回到第一批
watch([keyword, statusFilter, segment, kindFilter, usageFilter, ownerFilter, sortKey], () => {
  railLimit.value = RAIL_BATCH_SIZE;
  railRef.value?.viewport?.scrollTo({ top: 0 });
});

// 行变少（删除 / 过滤 / 换分段）时把游标收回，别让底部一直显示「已到底」之外的空白
watch(tableCount, (count) => {
  if (railLimit.value > count) railLimit.value = Math.max(RAIL_BATCH_SIZE, count);
});

// 选中项不在可视区：索引跟着滚过去
watch([selectedAccountId, selectedAppKeyId, selectedCookieId], () => {
  const id = selectedAccountId.value || selectedAppKeyId.value || selectedCookieId.value;
  if (id) scrollRowIntoView(id);
});

/** 选中账号 */
const activeAccount = computed(
  () => accountList.value.find(row => row.accountId === selectedAccountId.value) ?? null,
);
/** 选中 AppKey */
const activeAppKey = computed(
  () => appKeyList.value.find(row => row.appKeyId === selectedAppKeyId.value) ?? null,
);
/** 选中 Cookie */
const activeCookie = computed(
  () => cookieList.value.find(row => row.cookieId === selectedCookieId.value) ?? null,
);

/** 选中 AppKey 的生命周期徽标（索引行与详情页头共用同一套判定） */
const keyLife = computed(() => (activeAppKey.value ? appKeyLifecycle(activeAppKey.value) : null));

/** 生命周期徽标的 ReTag 类型（语义色 → 组件类型） */
const keyLifeTagType = computed(() => {
  switch (keyLife.value?.tone) {
    case 'warn':
      return 'warning';
    case 'bad':
      return 'danger';
    case 'idle':
      return 'info';
    default:
      return 'success';
  }
});

/** 选中账号的临时邮箱租期档位（详情页租期字段按档位着色） */
const activeTempMailTone = computed<'ok' | 'warn' | 'bad'>(() => {
  const account = activeAccount.value;
  if (!account || !isTempMail(account)) return 'ok';
  return tempLeaseTone(tempMailExpireAt(account));
});

/**
 * 是否具备收发信箱（仅邮箱 / 短信账号）。
 *
 * <p>这里不再依赖「控制台地址能否解析」：邮箱与短信都能在应用内打开真实信箱，
 * 所以只要种类对就允许进入；控制台地址只作为抽屉里的兜底提示。</p>
 *
 * @param row 账号
 * @returns 是否可以打开信箱
 */
function hasMailbox(row: SysAccount | null | undefined): boolean {
  return row?.kind === 'EMAIL' || row?.kind === 'SMS' || row?.kind === 'TEMP_PHONE' || row?.kind === 'PHONE';
}

/**
 * 账号引用的密钥（{@code config.secretId} 指向「密钥管理」里的那一条）。
 *
 * <p>凭据页签要回答的是「这条账号到底在用哪把钥匙」，所以这里回填密钥本体的
 * 名称 / 厂商 / AccessKeyId / 状态；密钥被删或没权限看时退回 null，页面仍显示 secretId。</p>
 */
const referencedSecret = computed(() => {
  const secretId = secretRefIdOf(activeAccount.value);
  if (!secretId) return null;
  return secretList.value.find(item => item.secretId === secretId) ?? null;
});

/** 引用密钥的原始 id（密钥不在可见列表里时的兜底展示） */
const referencedSecretId = computed(() => secretRefIdOf(activeAccount.value));

/**
 * 账号引用的密钥标识（{@code config.secretId}）。
 *
 * @param account 账号
 * @returns 密钥标识；未引用时为空串
 */
function secretRefIdOf(account: SysAccount | null | undefined): string {
  const config = (account?.config || {}) as Record<string, unknown>;
  return String(config.secretId ?? '').trim();
}

/**
 * 账号是否已把凭据托管在「密钥管理」里。
 *
 * <p>已引用密钥的账号不再提供「收录到密钥管理」：它的凭据本来就来自密钥库，
 * 再收录一次只会生成重复条目（2026-11-15 实测：从密钥管理选择的账号右键里
 * 仍出现「收录到密钥管理」，语义重复）。</p>
 *
 * @param accountId 账号标识
 * @returns 已引用时返回 true
 */
function hasSecretRef(accountId: string): boolean {
  return secretRefIdOf(accountList.value.find(item => item.accountId === accountId)) !== '';
}

/**
 * 凭据是否「可用」。
 *
 * <p>两种来源都算配置过：账号自身填的明文凭据（{@code hasSecret}），
 * 或 {@code config.secretId} 引用的密钥库条目。只看 {@code hasSecret} 会让
 * 纯引用型账号被误判成「凭据尚未配置」。</p>
 */
const hasCredential = computed(() => Boolean(activeAccount.value?.hasSecret || referencedSecretId.value));

/** 跳到密钥管理查看被引用的那条密钥 */
function openSecretAssets(): void {
  void router.push({ name: 'SecretAssets' });
}

/** 类型专属配置展示行（{@code secretId} 已由「引用的密钥」单独展示，不重复列 UUID） */
const configRows = computed(() => {
  const config = (activeAccount.value?.config || {}) as Record<string, unknown>;
  const labels: Record<string, string> = {
    port: '端口',
    ssl: 'SSL / TLS',
    from: '默认发件人',
    signName: '短信签名',
    templateCode: '模板编码',
    region: '区域',
    webUrl: '控制台地址',
    inboxMode: '接入方式',
    pop3Host: 'POP3 主机',
    pop3Port: 'POP3 端口',
    receiveRange: '收取范围',
    notifyNew: '新邮件通知',
  };
  return Object.entries(config)
    .filter(([key, value]) => key !== 'secretId' && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      let text: string;
      if (typeof value === 'boolean') {
        text = value ? '是' : '否';
      } else if (key === 'inboxMode') {
        text = value === 'pop3' ? 'POP3/SMTP 服务' : 'IMAP/SMTP 服务';
      } else if (key === 'receiveRange') {
        text = value === 'ALL' ? '全部邮件' : '最近 30 天';
      } else if (key === 'notifyNew') {
        text = value === true || value === 'true' ? '开启' : '关闭';
      } else {
        text = String(value);
      }
      return {
        key,
        label: labels[key] || key,
        value: text,
      };
    });
});

/* ---------- 详情页「邮件高级配置」就地编辑 ---------- */

/** 详情页高级配置表单（与编辑弹窗同一组 config 键，保存时合并回原 config） */
const advForm = reactive({
  inboxMode: 'imap' as 'imap' | 'pop3',
  receiveRange: '30d' as '30d' | 'ALL',
  notifyNew: false,
  pop3Host: '',
  pop3Port: null as number | null,
});

/** 高级配置保存中 */
const advSaving = ref(false);

/**
 * 用账号当前配置回填高级表单。
 *
 * @param account 账号（可为空）
 */
function fillAdvForm(account?: SysAccount | null): void {
  const config = (account?.config || {}) as Record<string, unknown>;
  advForm.inboxMode = config.inboxMode === 'pop3' ? 'pop3' : 'imap';
  advForm.receiveRange = config.receiveRange === 'ALL' ? 'ALL' : '30d';
  advForm.notifyNew = config.notifyNew === true || config.notifyNew === 'true';
  advForm.pop3Host = typeof config.pop3Host === 'string' ? config.pop3Host : '';
  const port = Number(config.pop3Port);
  advForm.pop3Port = Number.isFinite(port) && port > 0 ? port : null;
}

// 切换账号时同步回填，避免把上一个账号的高级配置带过来
watch(activeAccount, account => fillAdvForm(account), { immediate: true });

/**
 * 应用 163 预置：按当前接入方式写收信主机端口。
 *
 * <p>与编辑弹窗的预置口径一致：POP3 用 pop.163.com:995，IMAP 用 imap.163.com:993；
 * 发信 SMTP（smtp.163.com:465）由账号的 endpoint / port 承担，这里不改动。</p>
 */
function applyAdv163Preset(): void {
  if (advForm.inboxMode === 'pop3') {
    advForm.pop3Host = 'pop.163.com';
    advForm.pop3Port = 995;
  }
  message.success('已应用 163 预置：POP3 pop.163.com:995 / IMAP imap.163.com:993 / SMTP smtp.163.com:465');
}

/**
 * 保存高级配置：合并原 config 后更新账号，避免覆盖 secretId / capabilities 等键。
 *
 * <p>保存成功后只就地替换列表里的这一行，不整页重拉，保持当前选中与页签。</p>
 */
async function saveAdvanced(): Promise<void> {
  const account = activeAccount.value;
  if (!account || advSaving.value) return;
  const pop3Host = advForm.pop3Host.trim();
  if (advForm.inboxMode === 'pop3' && !pop3Host) {
    message.warning('POP3 接入需要填写收信主机');
    return;
  }
  advSaving.value = true;
  try {
    const config: Record<string, unknown> = { ...(account.config || {}) };
    config.inboxMode = advForm.inboxMode;
    config.receiveRange = advForm.receiveRange;
    config.notifyNew = advForm.notifyNew;
    if (advForm.inboxMode === 'pop3') {
      config.pop3Host = pop3Host;
      if (advForm.pop3Port) {
        config.pop3Port = advForm.pop3Port;
      } else {
        delete config.pop3Port;
      }
    } else {
      delete config.pop3Host;
      delete config.pop3Port;
    }
    const saved = await updateAccount(account.accountId, { ...account, config });
    const index = accountList.value.findIndex(row => row.accountId === account.accountId);
    if (index >= 0) {
      accountList.value[index] = { ...accountList.value[index], ...saved, config };
    }
    fillAdvForm(accountList.value[index] ?? { ...account, config });
    message.success('高级配置已保存');
  } catch (error) {
    message.error(`保存失败：${errText(error)}`);
  } finally {
    advSaving.value = false;
  }
}

// ==================== 加载 ====================

/**
 * 加载四份数据。
 *
 * <p>用 {@code allSettled}：AppKey / Cookie / 密钥接口在未登录时可能 403，
 * 不该因此把账号列表一起打成空白页。密钥只用来回填「凭据」页签里被引用的那一条，
 * 取不到就退化成只显示 {@code secretId}，不影响账号本体。</p>
 */
async function loadAll(): Promise<void> {
  loading.value = true;
  loadError.value = '';
  const [accounts, keys, cookies, secrets] = await Promise.allSettled([
    listAccounts(),
    listAccountAppKeys(),
    listAccountCookies(),
    listAccountSecrets(),
  ]);
  if (accounts.status === 'fulfilled') {
    accountList.value = accounts.value ?? [];
  } else {
    loadError.value = errText(accounts.reason);
    message.error('账号加载失败：' + loadError.value);
  }
  if (keys.status === 'fulfilled') {
    appKeyList.value = keys.value ?? [];
    appKeyError.value = '';
  } else {
    appKeyError.value = '访问密钥加载失败：' + errText(keys.reason);
  }
  if (cookies.status === 'fulfilled') {
    cookieList.value = cookies.value ?? [];
    cookieError.value = '';
  } else {
    cookieError.value = 'Cookie 加载失败：' + errText(cookies.reason);
  }
  secretList.value = secrets.status === 'fulfilled' ? (secrets.value ?? []) : [];
  loading.value = false;
  // 数据整体替换后旧勾选已经没有对应行，继续保留只会让「已选 N 项」与实际不符
  clearAccountSelection();
  syncSelection();
}

/**
 * 把选中项对齐到当前分段的第一行。
 *
 * <p>刷新后保留原选中项；它被删掉或换了分段时才重新挑一条，
 * 避免每次刷新都把检查器弹回第一条。</p>
 */
function syncSelection(): void {
  if (isAccountSegment.value) {
    const rows = filteredAccounts.value;
    if (!rows.some(row => row.accountId === selectedAccountId.value)) {
      selectedAccountId.value = rows[0]?.accountId ?? '';
    }
    return;
  }
  if (segment.value === 'APPKEY') {
    const rows = filteredAppKeys.value;
    if (!rows.some(row => row.appKeyId === selectedAppKeyId.value)) {
      selectedAppKeyId.value = rows[0]?.appKeyId ?? '';
    }
    return;
  }
  const rows = filteredCookies.value;
  if (!rows.some(row => row.cookieId === selectedCookieId.value)) {
    selectedCookieId.value = rows[0]?.cookieId ?? '';
  }
}

// ==================== 分段与筛选 ====================

/**
 * 切换分段。
 *
 * @param value 目标分段
 */
function setSegment(value: Segment): void {
  segment.value = value;
  statusFilter.value = 'all';
  clearAccountSelection();
  syncSelection();
}

/**
 * 切换账号状态筛选（再点一次回到全部）。
 *
 * @param value 目标状态
 */
function toggleStatusFilter(value: StatusFilter): void {
  if (!isAccountSegment.value) segment.value = 'ALL';
  statusFilter.value = statusFilter.value === value ? 'all' : value;
  syncSelection();
}

watch([segment, keyword, statusFilter], syncSelection);

// 换了资产就回到概览：留在「收信箱」去看一条密钥会得到奇怪的空面板
watch([selectedAccountId, selectedAppKeyId, selectedCookieId], () => {
  mainTab.value = 'overview';
});

// ==================== 行选中 ====================

/** 详情页签取值：账号 / AppKey / Cookie 三套页签共用一个游标 */
type TabValue =
  | 'overview'
  | 'credential'
  | 'verify'
  | 'mailbox'
  | 'secret'
  | 'usage'
  | 'content'
  | 'expire';

/** 当前账号页签 */
const mainTab = ref<TabValue>('overview');

/** 账号页签项 */
const accountTabs: Array<{ value: TabValue; label: string }> = [
  { value: 'overview', label: '概览' },
  { value: 'credential', label: '凭据' },
  { value: 'verify', label: '校验记录' },
  { value: 'mailbox', label: '收信箱' },
];

/** AppKey 页签项 */
const keyTabs: Array<{ value: TabValue; label: string }> = [
  { value: 'overview', label: '概览' },
  { value: 'secret', label: 'Secret' },
  { value: 'usage', label: '使用与期限' },
];

/** Cookie 页签项 */
const cookieTabs: Array<{ value: TabValue; label: string }> = [
  { value: 'overview', label: '概览' },
  { value: 'content', label: '内容' },
  { value: 'expire', label: '期限' },
];

/** 右键菜单状态 */
const ctxMenu = ref<{
  /** 横坐标 */
  x: number;
  /** 纵坐标 */
  y: number;
  /** 分组 */
  group: IndexGroup;
  /** 行 */
  row: IndexRow;
  /** 菜单项 */
  items: Array<{ key: string; label: string; icon?: string; divided?: boolean; disabled?: boolean }>;
} | null>(null);

/**
 * 定位到某一行：只切右侧详情，不动批量勾选。
 *
 * <p>右键菜单与单击共用这段：右键只负责弹出菜单，勾选交给菜单项，
 * 否则在批量模式里右键一行会先被勾上，菜单首项跟着变成「取消批量选择」。</p>
 *
 * @param group 分组
 * @param row 行
 */
function focusIndexRow(group: IndexGroup, row: IndexRow): void {
  segment.value = group.key;
  if (group.key === 'APPKEY') {
    selectedAppKeyId.value = row.id;
  } else if (group.key === 'COOKIE') {
    selectedCookieId.value = row.id;
  } else {
    selectedAccountId.value = row.id;
  }
  mainTab.value = 'overview';
}

/**
 * 选中索引行。
 *
 * <p>单击只切换右侧详情，不改左侧分组结构：点一条 AppKey 不会让账号分组消失。
 * 批量选择模式下（点工具栏「批量选择」进入）单击账号行即勾选 / 取消勾选；
 * 未进模式时按住 Ctrl / ⌘ 单击也能直接进模式并勾上当前行。</p>
 *
 * @param group 分组
 * @param row 行
 * @param event 鼠标事件
 */
function selectIndexRow(group: IndexGroup, row: IndexRow, event?: MouseEvent): void {
  focusIndexRow(group, row);
  if (group.key === 'APPKEY' || group.key === 'COOKIE') return;
  if (batchMode.value || event?.ctrlKey || event?.metaKey || event?.shiftKey) {
    batchMode.value = true;
    toggleBatchSelect(row.id);
  }
}

/**
 * 双击索引行：直接进完整编辑。
 *
 * @param group 分组
 * @param row 行
 */
function openIndexRow(group: IndexGroup, row: IndexRow): void {
  if (group.key === 'APPKEY') {
    openEditKey(appKeyList.value.find(item => item.appKeyId === row.id) ?? null);
    return;
  }
  if (group.key === 'COOKIE') {
    openEditCookie(cookieList.value.find(item => item.cookieId === row.id) ?? null);
    return;
  }
  if (group.key === 'TEMP_MAIL' || group.key === 'TEMP_PHONE') {
    openConsole(accountList.value.find(item => item.accountId === row.id) ?? null);
    return;
  }
  openEdit(accountList.value.find(item => item.accountId === row.id) ?? null);
}

/**
 * 打开索引行右键菜单。
 *
 * @param event 鼠标事件
 * @param group 分组
 * @param row 行
 */
function openIndexMenu(event: MouseEvent, group: IndexGroup, row: IndexRow): void {
  focusIndexRow(group, row);
  const items = group.key === 'APPKEY'
    ? [
        { key: 'copy-key', label: '复制 AppKey', icon: 'CopyDocument' },
        { key: 'rotate-key', label: '轮换 Secret', icon: 'Refresh', divided: true },
        { key: 'edit', label: '编辑密钥', icon: 'EditPen' },
        { key: 'status', label: row.status === 0 ? '启用密钥' : '停用密钥', icon: 'SwitchButton' },
        { key: 'delete', label: '删除密钥', icon: 'Delete', divided: true },
      ]
    : group.key === 'COOKIE'
      ? [
          { key: 'edit', label: '编辑 Cookie', icon: 'EditPen' },
          { key: 'status', label: row.status === 0 ? '启用 Cookie' : '停用 Cookie', icon: 'SwitchButton', divided: true },
          { key: 'delete', label: '删除 Cookie', icon: 'Delete' },
        ]
      : group.key === 'TEMP_MAIL'
        ? [
            { key: 'open-console', label: '打开邮箱', icon: 'Message' },
            { key: 'copy-address', label: '复制邮箱地址', icon: 'CopyDocument' },
            { key: 'destroy-temp', label: '销毁临时邮箱', icon: 'Delete', divided: true },
          ]
        : group.key === 'TEMP_PHONE'
          ? [
              { key: 'open-console', label: '打开收信箱', icon: 'Message' },
              { key: 'copy-address', label: '复制手机号', icon: 'CopyDocument' },
              { key: 'destroy-temp', label: '销毁临时手机号', icon: 'Delete', divided: true },
            ]
          : group.key === 'PHONE'
            ? [
                { key: 'batch-select', label: selectedAccountIds.value.includes(row.id) ? '取消批量选择' : '批量选择', icon: 'Select' },
                { key: 'edit', label: '编辑账号', icon: 'EditPen' },
                { key: 'open-console', label: '打开收信箱', icon: 'Message', divided: true },
                { key: 'copy-address', label: '复制手机号', icon: 'CopyDocument' },
                { key: 'duplicate', label: '复制为新账号', icon: 'CopyDocument', divided: true },
                { key: 'copy-code', label: '复制账号编码', icon: 'CopyDocument' },
                { key: 'status', label: row.status === 0 ? '启用账号' : '停用账号', icon: 'SwitchButton' },
                { key: 'delete', label: '删除账号', icon: 'Delete', divided: true },
              ]
            : [
          { key: 'batch-select', label: selectedAccountIds.value.includes(row.id) ? '取消批量选择' : '批量选择', icon: 'Select' },
          { key: 'edit', label: '编辑账号', icon: 'EditPen' },
          { key: 'verify', label: '校验凭据', icon: 'CircleCheck' },
          ...(hasSecretRef(row.id)
            ? []
            : [{ key: 'collect-secret', label: '收录到密钥管理', icon: 'Key' }]),
          ...(group.key === 'EMAIL' || group.key === 'SMS'
            ? [{ key: 'open-console', label: group.key === 'EMAIL' ? '打开邮箱' : '写短信', icon: 'Message', divided: true }]
            : []),
          ...(group.key === 'SMS'
            ? [{ key: 'sync-sms-templates', label: '同步短信模板', icon: 'Refresh' }]
            : []),
          { key: 'duplicate', label: '复制为新账号', icon: 'CopyDocument', divided: true },
          { key: 'copy-code', label: '复制账号编码', icon: 'CopyDocument' },
          {
            key: 'default',
            label: '设为同种类默认',
            icon: 'Star',
          },
          { key: 'status', label: row.status === 0 ? '启用账号' : '停用账号', icon: 'SwitchButton' },
          { key: 'delete', label: '删除账号', icon: 'Delete', divided: true },
        ];
  ctxMenu.value = { x: event.clientX, y: event.clientY, group, row, items };
}

/**
 * 右键菜单图标名。
 *
 * @param name 图标名
 * @returns 同名图标
 */
function ctxIcon(name: string): string {
  return name;
}

/**
 * 执行右键菜单项。
 *
 * @param item 菜单项
 */
function runCtx(item: { key: string; disabled?: boolean }): void {
  const menu = ctxMenu.value;
  ctxMenu.value = null;
  if (!menu || item.disabled) return;
  const { group, row } = menu;
  if (group.key === 'APPKEY') {
    const target = appKeyList.value.find(entry => entry.appKeyId === row.id);
    if (!target) return;
    if (item.key === 'copy-key') void copyKey(target);
    else if (item.key === 'rotate-key') void rotateKey(target);
    else if (item.key === 'edit') openEditKey(target);
    else if (item.key === 'status') void toggleKeyStatus(target);
    else if (item.key === 'delete') void removeKey(target);
    return;
  }
  if (group.key === 'COOKIE') {
    const target = cookieList.value.find(entry => entry.cookieId === row.id);
    if (!target) return;
    if (item.key === 'edit') openEditCookie(target);
    else if (item.key === 'status') void toggleCookieStatus(target);
    else if (item.key === 'delete') void removeCookie(target);
    return;
  }
  const target = accountList.value.find(entry => entry.accountId === row.id);
  if (!target) return;
  if (item.key === 'batch-select') toggleBatchSelect(target.accountId);
  else if (item.key === 'edit') openEdit(target);
  else if (item.key === 'verify') void onVerify(target);
  else if (item.key === 'collect-secret') void collectSecretOf(target);
  else if (item.key === 'open-console') openConsole(target);
  else if (item.key === 'sync-sms-templates') void syncSmsTemplatesOf(target);
  else if (item.key === 'copy-address') void copyAddress(target);
  else if (item.key === 'destroy-temp') void (isTempPhone(target) ? destroyPhone(target) : destroyTemp(target));
  else if (item.key === 'copy-code') void copyCode(target);
  else if (item.key === 'duplicate') duplicateAccount(target);
  else if (item.key === 'default') void setDefault(target);
  else if (item.key === 'status') void toggleStatus(target);
  else if (item.key === 'delete') void remove(target);
}

// ==================== 批量操作 ====================

/** 清空勾选并退出批量模式（数据刷新 / 切分段 / 批量执行后必须清，避免把已消失的 id 提交上去） */
function clearAccountSelection(): void {
  selectedAccountIds.value = [];
  batchMode.value = false;
}

/** 切换批量选择模式：进模式后单击索引行即勾选，取消则连同勾选一起清掉 */
function toggleBatchMode(): void {
  if (batchMode.value) clearAccountSelection();
  else batchMode.value = true;
}

/**
 * 切换一行账号的批量勾选状态。
 *
 * <p>工具栏「批量选择」、右键菜单项与 Ctrl / ⌘ 单击走同一条路径：只改勾选集，不动右侧详情。
 * 勾选不该顺带把详情滚回顶部，否则连着勾十条要点十次回来。</p>
 *
 * @param accountId 账号标识
 */
function toggleBatchSelect(accountId: string): void {
  const ids = selectedAccountIds.value;
  if (ids.includes(accountId)) {
    selectedAccountIds.value = ids.filter(id => id !== accountId);
    return;
  }
  selectedAccountIds.value = [...ids, accountId];
  // 勾上任何一条就进模式：右键菜单 / Ctrl 单击进入后，后续单击行可以直接继续勾
  batchMode.value = true;
}

/**
 * 批量结果提示。
 *
 * <p>部分成功必须如实说明：后端逐条执行、失败不回滚，只报「成功」会让用户
 * 以为全部生效。失败明细只在确有失败时展开，避免正常路径刷屏。</p>
 *
 * @param action 动作名（如「批量校验」）
 * @param result 批量结果
 * @returns 是否全部成功
 */
function reportBatch(action: string, result: AccountBatchResult): boolean {
  const succeeded = result?.succeeded ?? 0;
  const failed = result?.failed ?? 0;
  if (failed === 0) {
    message.success(`${action}完成：${succeeded} 项`);
    return true;
  }
  const detail = (result?.failures || [])
    .slice(0, 3)
    .map(item => `${shortId(item.accountId)}：${item.message}`)
    .join('；');
  const more = (result?.failures?.length || 0) > 3 ? ` 等 ${result.failures.length} 项` : '';
  if (succeeded === 0) {
    message.error(`${action}全部失败：${detail}${more}`);
  } else {
    message.warning(`${action}部分成功：成功 ${succeeded} 项，失败 ${failed} 项（${detail}${more}）`);
  }
  return false;
}

/**
 * 账号短标识（失败明细里用，避免一屏全是 UUID）。
 *
 * @param accountId 账号标识
 * @returns 前 8 位
 */
function shortId(accountId: string): string {
  return accountId ? accountId.slice(0, 8) : '未知账号';
}

/**
 * 批量校验勾选账号。
 */
async function batchVerify(): Promise<void> {
  const ids = selectedAccountIds.value;
  if (!ids.length || batchBusy.value) return;
  batchBusy.value = true;
  try {
    const result = await batchVerifyAccounts(ids);
    reportBatch('批量校验', result);
    clearAccountSelection();
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '批量校验失败');
  } finally {
    batchBusy.value = false;
  }
}

/**
 * 批量启用 / 停用勾选账号。
 *
 * @param status 目标状态（1 启用 / 0 停用）
 */
async function batchSetStatus(status: number): Promise<void> {
  const ids = selectedAccountIds.value;
  if (!ids.length || batchBusy.value) return;
  batchBusy.value = true;
  try {
    const result = await batchUpdateAccountStatus(ids, status);
    reportBatch(status === 1 ? '批量启用' : '批量停用', result);
    clearAccountSelection();
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '批量更新状态失败');
  } finally {
    batchBusy.value = false;
  }
}

/**
 * 批量删除勾选账号（逻辑删除）。
 */
async function batchRemove(): Promise<void> {
  const ids = selectedAccountIds.value;
  if (!ids.length || batchBusy.value) return;
  const confirmed = await confirmThen(
    message.confirm,
    `确认删除勾选的 ${ids.length} 个账号？引用它们的设备 / 模板会失去凭据来源。`,
    '批量删除账号',
  );
  if (!confirmed) return;
  batchBusy.value = true;
  try {
    const result = await batchDeleteAccounts(ids);
    reportBatch('批量删除', result);
    clearAccountSelection();
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '批量删除失败');
  } finally {
    batchBusy.value = false;
  }
}

// ==================== 账号操作 ====================

/** 打开新增账号 */
function openCreate(): void {
  if (segment.value === 'APPKEY') {
    editingKey.value = null;
    keyFormVisible.value = true;
    return;
  }
  if (segment.value === 'COOKIE') {
    editingCookie.value = null;
    cookieFormVisible.value = true;
    return;
  }
  if (segment.value === 'TEMP_MAIL') {
    void claimTemp();
    return;
  }
  if (segment.value === 'TEMP_PHONE') {
    void claimPhone();
    return;
  }
  editing.value = null;
  draft.value = null;
  formVisible.value = true;
}

/**
 * 领取一个临时邮箱。
 *
 * <p>没有表单：地址、密码、租期都由服务端生成，用户只需要「拿到一个能用一次
 * 的收信地址」。领取后自动选中新行并打开地址复制提示。</p>
 */
async function claimTemp(): Promise<void> {
  if (tempBusy.value) return;
  tempBusy.value = true;
  try {
    const saved = await claimTempMailbox();
    await loadAll();
    selectedAccountId.value = saved.accountId;
    segment.value = 'TEMP_MAIL';
    message.success(`已领取临时邮箱：${saved.username || ''}`);
  } catch (e: any) {
    message.error(e?.message || '领取临时邮箱失败');
  } finally {
    tempBusy.value = false;
  }
}

/**
 * 领取一个临时手机号。
 *
 * <p>与临时邮箱一致：号码、租期由服务端生成，领取即入库，不走表单提交。
 * 号码只收短信（后端目录轮询 → SSE 推送），不能发送。领取后自动选中新行。</p>
 */
async function claimPhone(): Promise<void> {
  if (tempBusy.value) return;
  tempBusy.value = true;
  try {
    const saved = await claimTempPhone();
    await loadAll();
    selectedAccountId.value = saved.accountId;
    segment.value = 'TEMP_PHONE';
    message.success(`已领取临时手机号：${saved.username || ''}`);
  } catch (e: any) {
    message.error(e?.message || '领取临时手机号失败');
  } finally {
    tempBusy.value = false;
  }
}

/**
 * 销毁临时邮箱（远端 + 本地）。
 *
 * @param row 临时邮箱账号
 */
async function destroyTemp(row: SysAccount): Promise<void> {
  const confirmed = await confirmThen(
    message.confirm,
    `确认销毁临时邮箱「${row.username || row.name}」？该地址会立即失效，已收邮件一并丢弃。`,
    '销毁临时邮箱',
  );
  if (!confirmed) return;
  try {
    await destroyTempMailbox(row.accountId);
    message.success('临时邮箱已销毁');
    if (selectedAccountId.value === row.accountId) selectedAccountId.value = '';
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '销毁临时邮箱失败');
  }
}

/**
 * 销毁临时手机号（本地逻辑删除，目录里的残留文件由轮询线程按 TTL 清理）。
 *
 * @param row 临时手机号账号
 */
async function destroyPhone(row: SysAccount): Promise<void> {
  const confirmed = await confirmThen(
    message.confirm,
    `确认销毁临时手机号「${row.username || row.name}」？该号码会立即失效，已收短信一并丢弃。`,
    '销毁临时手机号',
  );
  if (!confirmed) return;
  try {
    await destroyTempPhone(row.accountId);
    message.success('临时手机号已销毁');
    if (selectedAccountId.value === row.accountId) selectedAccountId.value = '';
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '销毁临时手机号失败');
  }
}

/** 复制收信地址（临时邮箱地址 / 临时或常规手机号） */
async function copyAddress(row: SysAccount): Promise<void> {
  const ok = await copyText(row.username || '');
  if (ok) message.success(isTempPhone(row) || row.kind === 'PHONE' ? '手机号已复制' : '邮箱地址已复制');
  else message.error('复制失败');
}

/** 打开账号编辑 */
function openEdit(row: SysAccount | null): void {
  if (!row) return;
  editing.value = row;
  draft.value = null;
  formVisible.value = true;
}

/**
 * 复制为新账号。
 *
 * <p>把原账号作为预填草稿交给新增弹窗：不进入编辑态、不带凭据、不继承默认标记。
 * 「照着同一个服务商再建一个邮箱」是高频操作，逐字段重填成本高且容易填错。</p>
 *
 * @param row 源账号
 */
function duplicateAccount(row: SysAccount | null): void {
  if (!row) return;
  editing.value = null;
  draft.value = row;
  formVisible.value = true;
}

/** 账号保存后刷新并回指 */
function onSaved(saved: SysAccount): void {
  if (saved?.accountId) selectedAccountId.value = saved.accountId;
  void loadAll();
}

/**
 * 打开邮箱或写短信。
 *
 * <p>不再跳向外部门户：邮箱走 IMAP 收信 + SMTP 发信，短信走 MessagePush
 * 且没有收件箱，全部在应用内抽屉里完成，因此这里只负责把账号交给抽屉。</p>
 *
 * @param row 账号
 */
function openConsole(row: SysAccount | null): void {
  if (!row) return;
  if (!hasMailbox(row)) {
    message.warning('该账号种类没有邮箱或短信发信能力');
    return;
  }
  mailboxAccount.value = row;
  mailboxVisible.value = true;
}

/**
 * 校验凭据。
 *
 * @param row 账号
 */
async function onVerify(row: SysAccount | null): Promise<void> {
  if (!row || verifyingId.value) return;
  verifyingId.value = row.accountId;
  try {
    const result = await verifyAccount(row.accountId);
    if (result.status === 'VALID') {
      message.success(result.message || '校验通过');
    } else if (result.status === 'INVALID') {
      message.error(result.message || '校验失败');
    } else {
      message.info(result.message || '该账号种类暂未安装校验能力');
    }
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '校验失败');
  } finally {
    verifyingId.value = null;
  }
}

/**
 * 把账号内联凭据收录到密钥管理（反哺）。
 *
 * <p>账号里直接填写的 AccessKey / Secret 常常散落多份，收录后统一存进
 * {@code sys_account_secret} 并按账号种类标注类型（API_KEY→通用 API /
 * EMAIL→邮件 / SMS→短信），账号改为引用这条密钥；之后再改密钥只需改一处。</p>
 *
 * @param row 账号
 */
async function collectSecretOf(row: SysAccount | null): Promise<void> {
  if (!row) return;
  try {
    const saved = await collectAccountSecret(row.accountId);
    message.success(`已收录到密钥管理：${saved.name || ''}`);
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '收录到密钥管理失败');
  }
}

/**
 * 同步短信账号对应厂商的短信模板。
 *
 * <p>厂商由账号 vendor 决定，后端走 MessagePush SPI 的 listTemplates()，
 * 前端不区分阿里 / 腾讯 / 百度。</p>
 *
 * @param row 短信账号
 */
async function syncSmsTemplatesOf(row: SysAccount | null): Promise<void> {
  if (!row) return;
  try {
    const result = await syncAccountSmsTemplates(row.accountId);
    if (result.fetched === 0) {
      message.warning(
        `未拉取到短信模板（${result.provider}）：阿里云只同步审核通过的模板，腾讯 / 百度当前只返回已登记模板`,
      );
      return;
    }
    message.success(
      `模板同步完成：拉取 ${result.fetched}，新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}（${result.provider}）`,
    );
  } catch (e: any) {
    message.error(errorText(e, '同步短信模板失败'));
  }
}

/**
 * 复制账号编码。
 *
 * @param row 账号
 */
async function copyCode(row: SysAccount): Promise<void> {
  const ok = await copyText(row.code);
  if (ok) message.success('账号编码已复制');
  else message.error('复制失败');
}

/**
 * 设为同种类默认账号（后端会清掉同种类的其它默认）。
 *
 * @param row 账号
 */
async function setDefault(row: SysAccount): Promise<void> {
  try {
    await updateAccount(row.accountId, { ...row, defaultAccount: true });
    message.success('已设为同种类默认账号');
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '设置失败');
  }
}

/**
 * 启用 / 停用账号。
 *
 * @param row 账号
 */
async function toggleStatus(row: SysAccount): Promise<void> {
  const next = row.status === 0 ? 1 : 0;
  try {
    await updateAccount(row.accountId, { ...row, status: next });
    message.success(next === 1 ? '账号已启用' : '账号已停用');
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '状态更新失败');
  }
}

/** 右侧用途条的高亮集合：与左栏能力条同一口径（未手填标记时按种类兜底显示） */
const activeCaps = computed(() => {
  const account = activeAccount.value;
  return new Set(capabilityTagsOf(account?.config, account?.kind).map(tag => tag.key));
});

/**
 * 切换当前账号的一个用途标记并立即保存。
 *
 * <p>编辑基准是「手填标记」（readCapabilityKeys 不带种类兜底），与「编辑账号」表单
 * 的保存语义一致：把兜底能力显式移除后 config 不再带该键，展示随之变灰；
 * 标记清空时删除键，交回种类默认兜底。</p>
 *
 * @param tag 用途能力
 */
async function toggleCapability(tag: AccountCapabilityTag): Promise<void> {
  const account = activeAccount.value;
  if (!account) return;
  const next = new Set(readCapabilityKeys(account.config));
  const adding = !next.has(tag.key);
  if (adding) next.add(tag.key);
  else next.delete(tag.key);
  const config: Record<string, unknown> = { ...(account.config || {}) };
  if (next.size) config.capabilities = [...next];
  else delete config.capabilities;
  try {
    await updateAccount(account.accountId, { ...account, config });
    message.success(adding ? `已标记用途：${tag.label}` : `已移除用途：${tag.label}`);
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '用途更新失败');
  }
}

/**
 * 删除账号（逻辑删除）。
 *
 * @param row 账号
 */
async function remove(row: SysAccount): Promise<void> {
  const confirmed = await confirmThen(
    message.confirm,
    `确认删除账号「${row.name || row.code || row.accountId}」？引用它的设备 / 模板会失去凭据来源。`,
    '删除账号',
  );
  if (!confirmed) return;
  try {
    await deleteAccount(row.accountId);
    message.success('账号已删除');
    if (selectedAccountId.value === row.accountId) selectedAccountId.value = '';
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

// ==================== AppKey 操作 ====================

/** 打开 AppKey 编辑 */
function openEditKey(row: SysAccountAppKey | null): void {
  editingKey.value = row;
  keyFormVisible.value = true;
}

/** AppKey 保存后刷新并回指 */
function onKeySaved(): void {
  void loadAll();
}

/**
 * 复制 AppKey。
 *
 * @param row 访问密钥
 */
async function copyKey(row: SysAccountAppKey): Promise<void> {
  const ok = await copyText(row.appKey);
  if (ok) message.success('AppKey 已复制');
  else message.error('复制失败');
}

/**
 * 轮换 Secret（明文只在响应里出现一次）。
 *
 * @param row 访问密钥
 */
async function rotateKey(row: SysAccountAppKey): Promise<void> {
  const confirmed = await confirmThen(
    message.confirm,
    `确认轮换「${row.name || row.appKey}」的 Secret？旧 Secret 立即失效，调用方需要同步更新。`,
    '轮换 Secret',
  );
  if (!confirmed) return;
  try {
    const saved = await rotateAccountAppKey(row.appKeyId);
    if (saved?.plainSecret) {
      secretName.value = saved.name || row.name || row.appKey || '';
      secretValue.value = saved.plainSecret;
      secretVisible.value = true;
    } else {
      message.success('Secret 已轮换');
    }
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '轮换失败');
  }
}

/**
 * 启用 / 停用 AppKey。
 *
 * @param row 访问密钥
 */
async function toggleKeyStatus(row: SysAccountAppKey): Promise<void> {
  const next = row.status === 0 ? 1 : 0;
  try {
    await updateAccountAppKey(row.appKeyId, {
      appKeyId: row.appKeyId,
      name: row.name,
      status: next,
      expireAt: row.expireAt ?? null,
      ipWhitelist: row.ipWhitelist ?? null,
      remark: row.remark ?? null,
    });
    message.success(next === 1 ? '访问密钥已启用' : '访问密钥已停用');
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '状态更新失败');
  }
}

/**
 * 删除 AppKey。
 *
 * @param row 访问密钥
 */
async function removeKey(row: SysAccountAppKey): Promise<void> {
  const confirmed = await confirmThen(
    message.confirm,
    `确认删除访问密钥「${row.name || row.appKey}」？调用方会立即失去访问权限。`,
    '删除访问密钥',
  );
  if (!confirmed) return;
  try {
    await deleteAccountAppKey(row.appKeyId);
    message.success('访问密钥已删除');
    if (selectedAppKeyId.value === row.appKeyId) selectedAppKeyId.value = '';
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

// ==================== Cookie 操作 ====================

/** 打开 Cookie 编辑 */
function openEditCookie(row: SysAccountCookie | null): void {
  editingCookie.value = row;
  cookieFormVisible.value = true;
}

/** Cookie 保存后刷新 */
function onCookieSaved(): void {
  void loadAll();
}

/**
 * 启用 / 停用 Cookie。
 *
 * @param row Cookie
 */
async function toggleCookieStatus(row: SysAccountCookie): Promise<void> {
  const next = row.status === 0 ? 1 : 0;
  try {
    await updateAccountCookie(row.cookieId, {
      cookieId: row.cookieId,
      name: row.name,
      domain: row.domain,
      path: row.path,
      source: row.source ?? null,
      status: next,
      expireAt: row.expireAt ?? null,
      remark: row.remark ?? null,
      cookieValue: null,
    });
    message.success(next === 1 ? 'Cookie 已启用' : 'Cookie 已停用');
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '状态更新失败');
  }
}

/**
 * 删除 Cookie。
 *
 * @param row Cookie
 */
async function removeCookie(row: SysAccountCookie): Promise<void> {
  const confirmed = await confirmThen(
    message.confirm,
    `确认删除 Cookie「${row.name || row.domain}」？引用它的免登录渠道会失去会话。`,
    '删除 Cookie',
  );
  if (!confirmed) return;
  try {
    await deleteAccountCookie(row.cookieId);
    message.success('Cookie 已删除');
    if (selectedCookieId.value === row.cookieId) selectedCookieId.value = '';
    await loadAll();
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

// ==================== 一次性明文 ====================

/** 复制轮换后的 Secret */
async function copySecret(): Promise<void> {
  const ok = await copyText(secretValue.value);
  if (ok) message.success('Secret 已复制');
  else message.error('复制失败，请手动选中文本');
}

// ==================== 展示工具 ====================

/**
 * 账号种类中文名。
 *
 * @param kind 种类
 * @returns 中文名
 */
function kindLabel(kind?: AccountKind): string {
  return ({ API_KEY: 'API 密钥', EMAIL: '邮箱账号', SMS: '短信账号', TEMP_PHONE: '临时手机号', PHONE: '手机号' } as Record<string, string>)[kind || ''] || '未知';
}

/**
 * 种类图标。
 *
 * @param kind 种类
 * @returns ReIcon 名称
 */
function kindIcon(kind?: AccountKind): string {
  if (kind === 'EMAIL') return 'Message';
  if (kind === 'SMS') return 'ChatDotRound';
  if (kind === 'TEMP_PHONE') return 'Iphone';
  if (kind === 'PHONE') return 'Iphone';
  return 'Key';
}

/**
 * 种类色块。
 *
 * @param kind 种类
 * @returns CSS 修饰名
 */
function kindClass(kind?: AccountKind): string {
  if (kind === 'EMAIL') return 'mail';
  if (kind === 'SMS') return 'sms';
  if (kind === 'TEMP_PHONE') return 'phone';
  if (kind === 'PHONE') return 'phone';
  return 'key';
}

/**
 * 校验状态中文名。
 *
 * @param status 状态
 * @returns 中文名
 */
function verifyLabel(status?: AccountVerifyStatus): string {
  return ({ VALID: '有效', INVALID: '失败', UNKNOWN: '未校验' } as Record<string, string>)[status || ''] || '未校验';
}

/**
 * 校验状态标签色。
 *
 * @param status 状态
 * @returns ReTag type
 */
function verifyTagType(status?: AccountVerifyStatus): 'success' | 'danger' | 'info' {
  if (status === 'VALID') return 'success';
  if (status === 'INVALID') return 'danger';
  return 'info';
}

/**
 * 校验状态语义色（检查器用）。
 *
 * @param status 状态
 * @returns CSS 修饰名
 */
function verifyTone(status?: AccountVerifyStatus): 'ok' | 'bad' | 'idle' {
  if (status === 'VALID') return 'ok';
  if (status === 'INVALID') return 'bad';
  return 'idle';
}

/**
 * 服务地址展示：有端口时拼在地址后面。
 *
 * @param row 账号
 * @returns 展示文本
 */
function endpointText(row: SysAccount): string {
  const port = (row.config as Record<string, unknown> | undefined)?.port;
  return port ? `${row.endpoint}:${port}` : row.endpoint || '';
}

/**
 * 是否已过期。
 *
 * @param at 毫秒时间戳
 * @returns 有值且早于现在为 true
 */
function expired(at?: number | null): boolean {
  return Boolean(at) && Number(at) <= Date.now();
}

/**
 * 到期文案。
 *
 * @param at 毫秒时间戳
 * @returns 长期 / 已过期 / N 天后到期
 */
function expireText(at?: number | null): string {
  if (!at) return '长期';
  const diff = Number(at) - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return '已过期';
  const hours = Math.ceil(diff / 3_600_000);
  return hours < 48 ? `${hours} 小时后过期` : `${Math.ceil(diff / 86_400_000)} 天后过期`;
}

/**
 * 毫秒时间格式化为「MM-DD HH:mm」。
 *
 * @param value 毫秒时间戳
 * @returns 短时间；空值返回 —
 */
function formatShort(value?: number | null): string {
  if (!value) return '—';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * 毫秒时间格式化。
 *
 * @param value 毫秒时间戳
 * @returns yyyy-MM-dd HH:mm:ss；空值返回 —
 */
function formatTime(value?: number | null): string {
  if (!value) return '—';
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * 异常文案。
 *
 * @param error 异常
 * @returns 可读文本
 */
function errText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? '未知错误');
}

/**
 * Esc 退出批量选择。
 *
 * <p>批量模式开着但一条没勾时，用户的第一反应是按 Esc 而不是回来点「取消」；
 * 这里只在模式确实开着时处理，不拦截弹窗自己的 Esc。</p>
 *
 * @param event 键盘事件
 */
function onWindowKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && batchMode.value) clearAccountSelection();
  // 「/」聚焦搜索：光标不在任何输入控件里时才接管，避免打断正在输入的用户
  if (event.key === '/' && !isTypingTarget(event.target)) {
    event.preventDefault();
    searchInputRef.value?.focus();
    return;
  }
  // ↑/↓/Home/End 索引导航：输入中 / 批量模式 / 焦点不在索引区时一律让路
  if (!isTypingTarget(event.target) && !batchMode.value && keydownInNavigationScope(event.target)) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveIndexSelection(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveIndexSelection(-1);
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      jumpIndexRow(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      jumpIndexRow(flatRows.value.length - 1);
      return;
    }
  }
}

/**
 * 方向键是否允许接管：焦点在索引行上，或没有特定焦点（body）时接管。
 *
 * <p>弹窗 / 抽屉打开时焦点自然落在里面，不满足条件即让路，
 * 不需要逐个弹层排查。</p>
 *
 * @param target 事件目标
 * @returns 是否处于可导航范围
 */
function keydownInNavigationScope(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || el === document.body) return true;
  return Boolean(railRef.value?.viewport?.contains(el));
}

/**
 * 方向键移动索引选中行（到顶 / 到底自动停住）。
 *
 * @param delta 前进 / 后退行数
 */
function moveIndexSelection(delta: number): void {
  const rows = flatRows.value;
  if (!rows.length) return;
  const currentId = selectedAccountId.value || selectedAppKeyId.value || selectedCookieId.value;
  const at = rows.findIndex(item => item.row.id === currentId);
  // 没有选中行时：向下从第一行开始，向上从最后一行开始
  jumpIndexRow(at < 0 ? (delta > 0 ? 0 : rows.length - 1) : at + delta);
}

/**
 * 跳到索引第 N 行（越界收敛到首尾），滚动进可视区并把焦点落到行按钮上。
 *
 * @param index 目标行号
 */
function jumpIndexRow(index: number): void {
  const rows = flatRows.value;
  if (!rows.length) return;
  const entry = rows[Math.min(rows.length - 1, Math.max(0, index))];
  focusIndexRow(entry.group, entry.row);
  scrollRowIntoView(entry.row.id);
  // 目标行可能还没挂载（滚动追加），挂载后把焦点落到行按钮，Tab 顺序跟着走
  void nextTick(() => {
    railRef.value?.viewport?.querySelector<HTMLElement>(`[data-row-id="${entry.row.id}"]`)?.focus();
  });
}

/** 光标是否已在输入控件里（输入框 / 文本域 / 可编辑元素） */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable;
}

onMounted(() => {
  void loadAll();
  window.addEventListener('keydown', onWindowKeydown);
  // 账号页统一 SSE：新邮件 / 新短信 / 账号变更共用同一条 /api/accounts/events 连接
  const events = useAccountEvents();
  eventUnsubs.push(events.subscribe('account', 'new-mail', onNewMailPush) ?? (() => {}));
  eventUnsubs.push(events.subscribe('account', 'new-sms', onNewSmsPush) ?? (() => {}));
  eventUnsubs.push(events.subscribe('account', 'account-changed', onAccountChanged) ?? (() => {}));
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown);
  while (eventUnsubs.length) eventUnsubs.pop()?.();
});
</script>

<style scoped>
/* 沿用 koi 令牌（--bg-container / --border-subtle / --text-* / --radius-*），
   与主机资产、设备资产、渠道管理同一套底色、圆角与状态色。 */
.account-assets {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 10px;
}

/* ---------- 顶部卡片：标题 / 搜索 / 过滤 / 动作（对齐密钥管理） ---------- */
.bar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.bar-title {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.bar-title h1 {
  margin: 0;
  font-size: 14px;
  font-weight: 650;
  line-height: 26px;
  letter-spacing: 0.01em;
  color: var(--text-primary);
}
.bar-count {
  padding: 0 7px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}
/* 搜索框复用左栏那套 .search：高度与过滤胶囊对齐成同一条横线。
   .search 在本文件靠后、同权重会覆盖，这里用双类名压过去。 */
.search.bar-search {
  flex: none;
  width: 220px;
  min-width: 180px;
  height: 26px;
  padding: 0 9px;
}
/* 顶栏放不下时允许换行，禁止横向截断 */
.bar {
  flex-wrap: wrap;
}
/* ---------- 索引筛选下拉：与搜索框同一套高度与边框语言 ---------- */
.bar-selects {
  flex: none;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}
.bar-select {
  height: 26px;
  padding: 0 6px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s var(--ease-out, ease), border-color 0.15s var(--ease-out, ease);
}
.bar-select:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.bar-select:focus {
  outline: none;
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
/* 筛选生效中的下拉：主色描边提示「当前不是全部」 */
.bar-select.is-on {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
/* 归属筛选用 el-select（归属人可搜索）：对齐原生下拉的 26px 高度与配色语言 */
.bar-select-el {
  width: 112px;
  font-size: 12px;
}
.bar-select-el :deep(.el-select__wrapper) {
  min-height: 26px;
  padding: 0 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  font-size: 12px;
  line-height: 1;
}
.bar-select-el :deep(.el-select__placeholder),
.bar-select-el :deep(.el-select__selected-item) {
  font-size: 12px;
}
.bar-select-el.is-on :deep(.el-select__wrapper) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
  box-shadow: none;
}
/* 命中计数胶囊：跟在下拉后面，一眼看到筛掉了多少 */
.bar-hit {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 12px;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.bar-hit b {
  font-weight: 700;
}
.bar-hit-clear {
  border: 0;
  background: none;
  padding: 0 0 0 4px;
  color: inherit;
  font: inherit;
  font-size: 12px;
  line-height: 1;
  text-decoration: underline;
  opacity: 0.75;
  cursor: pointer;
  transition: opacity 0.15s var(--ease-out, ease);
}
.bar-hit-clear:hover {
  opacity: 1;
}
.bar-filters {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  /* 胶囊多（账号类型/状态/厂商…）时窄视口放不下一行：允许换行对齐，禁止横向截断 */
  flex-wrap: wrap;
  gap: 4px;
  min-height: 26px;
}
.filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 26px;
  padding: 0 10px;
  border: 1px solid var(--border-default);
  border-radius: 999px;
  background: none;
  font: inherit;
  font-size: 12px;
  line-height: 1;
  color: var(--text-secondary);
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s var(--ease-out, ease), border-color 0.15s var(--ease-out, ease), background 0.15s var(--ease-out, ease);
}
.filter:hover {
  color: var(--el-color-primary);
}
.filter.is-on {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}
.filter-n {
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}
.filter-label {
  line-height: 1;
}
.filter-n.is-ok {
  color: var(--status-success);
  opacity: 1;
}
.filter-n.is-warn {
  color: var(--status-warning);
  opacity: 1;
}
.filter-n.is-bad {
  color: var(--status-error);
  opacity: 1;
}
.bar-acts {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
}
/* 行内所有控件统一 26px：搜索框 / 过滤胶囊 / 图标按钮 / 新建按钮落在同一条水平线上 */
.bar-acts :deep(.el-button) {
  height: 26px;
}
/* ---------- 页面级推送状态灯 ---------- */
.sse-led {
  flex: none;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  padding: 0;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: none;
  cursor: pointer;
}
.sse-led:hover {
  border-color: var(--el-color-primary-light-5);
}
.sse-led__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
}
.sse-led.is-on .sse-led__dot {
  background: var(--status-success, var(--el-color-success, #2fbf71));
}
/* 断线：黄色 + 呼吸闪烁，和「从未连上」的灰点区分开 */
.sse-led.is-lost .sse-led__dot {
  background: var(--status-warning, var(--el-color-warning, #f0a020));
  animation: sse-led-blink 1.6s ease-in-out infinite;
}
@keyframes sse-led-blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

/* ---------- 内容舞台 ---------- */
.stage {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ---------- 工作台：左索引 + 右详情 ---------- */
.ws {
  flex: 1;
  min-height: 0;
  display: flex;
  /* 间距交给分栏手柄本身，避免 gap + 手柄叠出一段空档 */
  gap: 0;
  align-items: stretch;
}

/* ---------- 左侧分组索引 ---------- */
.idx {
  /* 宽度由分栏手柄写入 --idx-width（可拖拽，存本地偏好） */
  width: var(--idx-width, 280px);
  /* 批量条按索引栏自身宽度换行，而不是按视口宽度 */
  container-type: inline-size;
  container-name: rail;
  flex: none;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
/* 左栏栏头：主色圆点 + 栏名 + 数量，填补列表上方空白（与侧栏分组标题同一套装饰语言） */
.rail-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px 8px;
  border-bottom: 1px solid var(--border-subtle, var(--border-default));
}
.rail-head__dot {
  flex: none;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}
.rail-head__title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--text-secondary, var(--el-text-color-secondary));
}
.rail-head__count {
  margin-left: auto;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--text-tertiary);
}

.icon-btn {
  flex: none;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.15s var(--ease-out), border-color 0.15s var(--ease-out);
}
.icon-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
/* 批量选择开关打开时的按下态：和图标的灰底区分开，一眼能看出现在点行是「勾选」不是「查看」 */
.icon-btn.is-on {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.idx-error {
  margin: 8px 10px 8px;
  padding: 6px 9px;
  border: 1px dashed var(--sev-p0-border);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--sev-p0-text);
  flex: none;
}

.idx-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 6px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.idx-row {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s var(--ease-out), border-color 0.15s var(--ease-out);
}
.idx-row:hover {
  background: var(--bg-fill);
}
.idx-row.is-on {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}
/* 已勾选：底色 + 名称变主色，扫一眼就能数清勾了哪几条（不只靠左侧 14px 方块） */
.idx-row.is-checked {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}
.idx-row.is-checked .idx-name {
  color: var(--el-color-primary-dark-2);
}
.idx-row.is-off .idx-name {
  color: var(--text-tertiary);
}
/* 能力条：一条账号可标多个用途；浅灰小方块，悬停加深并出名字 */
.idx-caps {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}
.idx-cap {
  flex: none;
  width: 16px;
  height: 16px;
  display: grid;
  place-items: center;
  border-radius: 4px;
  background: var(--bg-fill);
  color: var(--text-tertiary);
  transition: background 0.12s var(--ease-out, ease), color 0.12s var(--ease-out, ease);
}
.idx-cap:hover {
  background: var(--border-default);
  color: var(--text-primary);
}
.idx-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.idx-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 搜索命中高亮：v-html 注入的 mark 没有 scoped 属性，用 :deep 穿透 */
.idx-name :deep(mark.idx-hit) {
  padding: 0 1px;
  border-radius: 2px;
  background: var(--el-color-warning-light-7, #faecd8);
  color: inherit;
  font-weight: 700;
}
/* 首载骨架：左栏取数时的占位行，避免空白或转圈的突兀感 */
.idx-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 2px;
}
.idx-skel-row {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
}
.idx-skel-line {
  display: block;
  height: 10px;
  border-radius: 4px;
  background: var(--bg-fill);
  animation: idx-skel-pulse 1.4s ease-in-out infinite;
}
.idx-skel-line.is-name {
  width: 62%;
}
.idx-skel-line.is-sub {
  width: 40%;
  height: 8px;
}
@keyframes idx-skel-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
.idx-sub {
  font-size: 10.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.idx-meta {
  flex: none;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.idx-tag {
  padding: 0 5px;
  border-radius: 999px;
  font-size: 10px;
  line-height: 16px;
  background: var(--bg-fill);
  color: var(--text-tertiary);
  white-space: nowrap;
}
.idx-tag.is-ok {
  background: var(--sev-p3-bg);
  color: var(--sev-p3-text);
}
.idx-tag.is-warn {
  background: var(--sev-p2-bg);
  color: var(--sev-p2-text);
}
.idx-tag.is-bad {
  background: var(--sev-p0-bg);
  color: var(--sev-p0-text);
}
.idx-time {
  font-size: 10px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* 批量模式下的勾选框：替掉左侧状态圆点，点整行即切换 */
.idx-box {
  flex: none;
  width: 14px;
  height: 14px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border-default);
  border-radius: 3px;
  background: var(--bg-container);
  color: #fff;
}
.idx-box.is-on {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary);
}
.idx-empty {
  margin: 0;
  padding: 4px 8px 8px;
  font-size: 11px;
  color: var(--text-tertiary);
}
/* 行到引导线的那一小段横线，读起来是「挂在分组下面」而不是另起一块 */
/* ---------- 右侧详情工作区 ---------- */
.main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.main-head {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px 10px;
  min-width: 0;
}
.main-mark {
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  color: #fff;
}
.main-mark.is-key {
  background: #f0a020;
}
.main-mark.is-mail {
  background: #5b8def;
}
.main-mark.is-sms {
  background: #2fbf71;
}
.main-mark.is-cookie {
  background: #8b5cf6;
}
.main-mark.is-phone {
  background: #14b8a6;
}
.main-title {
  flex: 1;
  min-width: 0;
}
.main-title b {
  display: block;
  font-size: 14px;
  font-weight: 650;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.main-title span {
  display: block;
  font-size: 11.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-tabs {
  flex: none;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-subtle);
}
.main-tab {
  position: relative;
  padding: 7px 10px 8px;
  border: 0;
  background: none;
  font: inherit;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s var(--ease-out);
}
.main-tab:hover {
  color: var(--text-primary);
}
.main-tab.is-on {
  color: var(--el-color-primary);
  font-weight: 600;
}
.main-tab-badge {
  display: inline-block;
  min-width: 15px;
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 8px;
  background: var(--status-error, #f56c6c);
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  text-align: center;
  vertical-align: 1px;
}
.main-tab.is-on::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: var(--el-color-primary);
}

.main-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 16px;
}
.pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pane-title {
  margin: 2px 0 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--text-tertiary);
}
.pane-tip {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--text-tertiary);
}

/* ---------- 邮件高级配置（详情页就地编辑） ---------- */
.adv-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
}
.adv-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.adv-head .pane-title {
  margin: 0;
}
.adv-preset {
  padding: 3px 10px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--radius-sm);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: background 0.15s var(--ease-out), border-color 0.15s var(--ease-out);
}
.adv-preset:hover {
  background: var(--el-color-primary-light-8);
}
.adv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px 14px;
}
.adv-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
/* 接入方式分段跨满整行，避免和右侧字段挤在一起 */
.adv-field.is-wide {
  grid-column: 1 / -1;
}
.adv-label {
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.adv-input {
  width: 100%;
  min-width: 0;
  padding: 5px 8px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
  color: var(--text-primary);
  font: inherit;
  font-size: 12px;
  outline: 0;
  transition: border-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
}
.adv-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
.adv-seg {
  display: flex;
  padding: 2px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
  gap: 2px;
}
.adv-seg button {
  flex: 1;
  padding: 4px 12px;
  border: 0;
  border-radius: calc(var(--radius-sm) - 2px);
  background: none;
  color: var(--text-secondary);
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
  transition: background 0.15s var(--ease-out), color 0.15s var(--ease-out);
}
.adv-seg button.is-on {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  font-weight: 600;
}
.adv-switch {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--text-primary);
}
.adv-switch input {
  width: 14px;
  height: 14px;
  accent-color: var(--el-color-primary);
  cursor: pointer;
}
.adv-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 2px;
}
.adv-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}
.adv-save {
  padding: 5px 14px;
  border: 1px solid var(--el-color-primary);
  border-radius: var(--radius-sm);
  background: var(--el-color-primary);
  color: #fff;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: opacity 0.15s var(--ease-out);
}
.adv-save:disabled {
  opacity: 0.6;
  cursor: default;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 2px 18px;
}
.fact {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  padding: 5px 0;
  border-bottom: 1px dashed var(--border-subtle);
}
/* 长值（如 AccessKeyId）跨两列，避免被挤成两三行 */
.fact.is-wide {
  grid-column: span 2;
}
.fact .k {
  flex: 0 0 84px;
  font-size: 11.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
}
/* 密钥的键名比中文标签宽，单独给固定列宽，标签不折断 */
.secret-ref .fact .k {
  flex: 0 0 104px;
}
.fact .v {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  color: var(--text-primary);
  word-break: break-all;
}
.fact .v.is-bad {
  color: var(--status-error);
}
.fact .v.is-warn {
  color: var(--status-warning, var(--el-color-warning, #f0a020));
}

.cred-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-fill);
  color: var(--text-secondary);
}
.cred-card div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cred-card b {
  font-size: 12.5px;
  color: var(--text-primary);
}
.cred-card span {
  font-size: 11.5px;
  line-height: 1.5;
}
.cred-card.is-ok {
  border-color: var(--sev-p3-border);
  background: var(--sev-p3-bg);
  color: var(--sev-p3-text);
}
.cred-card.is-ok b {
  color: var(--sev-p3-text);
}
.cred-card.is-warn {
  border-color: var(--sev-p2-border);
  background: var(--sev-p2-bg);
  color: var(--sev-p2-text);
}
.cred-card.is-warn b {
  color: var(--sev-p2-text);
}

/* 凭据页签：账号引用的那条密钥（只读回填，与「密钥管理」同源） */
.secret-ref {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
}
.secret-ref-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.secret-ref-head b {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.secret-ref-link {
  flex: none;
  padding: 0;
  font-size: 11.5px;
  color: var(--el-color-primary);
  background: none;
  border: 0;
  cursor: pointer;
}
.secret-ref-link:hover {
  text-decoration: underline;
}

.verify-hero {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-fill);
}
.verify-hero div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.verify-hero b {
  font-size: 13px;
  color: var(--text-primary);
}
.verify-hero span {
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.verify-hero.is-ok {
  border-color: var(--sev-p3-border);
  background: var(--sev-p3-bg);
}
.verify-hero.is-bad {
  border-color: var(--sev-p0-border);
  background: var(--sev-p0-bg);
}

.note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  padding: 8px 10px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-fill);
  font-size: 11.5px;
  line-height: 1.55;
  color: var(--text-secondary);
}
.note.is-bad {
  border-color: var(--sev-p0-border);
  background: var(--sev-p0-bg);
  color: var(--sev-p0-text);
}
.note.is-ok {
  border-color: var(--sev-p3-border);
  background: var(--sev-p3-bg);
  color: var(--sev-p3-text);
}

.mail-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  background: var(--bg-fill);
}
.mail-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mail-copy b {
  font-size: 13px;
  color: var(--text-primary);
}
.mail-copy span {
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text-tertiary);
}

.main-foot {
  flex: none;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 16px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-container);
}
.foot-gap {
  flex: 1;
}
.main-blank {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 24px;
  text-align: center;
}
.main-blank p {
  margin: 0;
  max-width: 280px;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--text-tertiary);
}

/* ---------- 右栏加载骨架 / 分段错误重试 ---------- */
.main-skel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px 16px;
}
.main-skel-line {
  display: block;
  height: 14px;
  border-radius: var(--radius-sm);
  background: var(--bg-fill, var(--el-fill-color-light, #f2f3f5));
  animation: idx-skel-pulse 1.6s ease-in-out infinite;
}
.main-skel-line.is-head {
  width: 38%;
  height: 20px;
}
.main-skel-line.is-line {
  width: 88%;
}
.main-skel-line.is-short {
  width: 62%;
}
.main-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  font-size: 12px;
  color: var(--sev-p0-text);
}
.main-error button {
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  padding: 3px 14px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

/* ---------- 右键菜单 ---------- */
.ctx-layer {
  position: fixed;
  inset: 0;
  z-index: 3000;
}
.ctx-menu {
  position: fixed;
  min-width: 172px;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: var(--bg-elevated, var(--bg-container));
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md, 0 8px 24px rgb(0 0 0 / 12%));
}
.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
}
.ctx-item:hover {
  background: var(--bg-fill);
}
.ctx-item.is-divided {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
}
.ctx-item.is-disabled {
  color: var(--text-tertiary);
  cursor: not-allowed;
}

.search {
  flex: 1;
  min-width: 170px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-container);
  transition: border-color 0.2s var(--ease-out), box-shadow 0.2s var(--ease-out);
}
.search:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
.search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 12px;
  color: var(--text-primary);
}
.search input::placeholder {
  color: var(--text-tertiary);
}
.search-icon {
  flex: none;
  color: var(--text-tertiary);
}
/* ---------- 加载失败提示 ---------- */
.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 12px;
  border: 1px solid var(--sev-p0-border);
  border-radius: var(--radius-md);
  background: var(--sev-p0-bg);
  color: var(--sev-p0-text);
  font-size: 12px;
  flex: none;
}
.alert button {
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
  background: transparent;
  color: inherit;
  padding: 2px 10px;
  font: inherit;
  font-size: 11.5px;
  cursor: pointer;
}

/* ---------- 批量操作条（Ctrl/⌘ 单击索引行进入多选，贴在搜索框下方） ---------- */
.batch-bar {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
  flex: none;
  margin: 8px 10px 8px;
  padding: 4px 8px;
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: var(--radius-md);
  background: var(--el-color-primary-light-9);
  font-size: 12px;
  line-height: 18px;
  color: var(--text-secondary);
}
.batch-count {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.batch-count b {
  color: var(--el-color-primary-dark-2);
  font-variant-numeric: tabular-nums;
}
/* 还没勾选时给一句操作提示，别只留一个「已选 0 项」 */
.batch-count.is-empty {
  color: var(--text-tertiary);
}
/* 类名避开 koi 全局 .batch-actions（那是通栏样式，带 8/12 内边距与边框，会把这行撑成两行） */
.batch-tools {
  display: inline-flex;
  align-items: center;
  flex: none;
}
.batch-clear {
  flex: none;
  border: 0;
  background: none;
  font: inherit;
  font-size: 11.5px;
  line-height: 18px;
  padding: 0;
  color: var(--text-tertiary);
  cursor: pointer;
  text-decoration: underline;
}
.batch-clear:hover {
  color: var(--text-primary);
}

/* 索引栏被拖窄（默认 280px，最小 200px）时一行放不下 4 个图标按钮 + 取消：
   折成「计数 + 取消」/「图标按钮」两行，避免按钮被裁掉或横向溢出 */
@container rail (max-width: 262px) {
  .batch-bar {
    flex-wrap: wrap;
  }
  .batch-count {
    flex: 1 1 auto;
  }
  .batch-clear {
    order: 1;
    margin-left: auto;
  }
  .batch-tools {
    order: 2;
    flex: 1 0 100%;
  }
}

/* ---------- 等宽文本（地址、编码、AppKey） ---------- */
.mono {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 11.5px;
}

/* ---------- 一次性明文 ---------- */
.secret-box {
  padding: 2px 2px 4px;
}
.secret-tip {
  margin: 0 0 10px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--text-secondary);
}
.secret-tip b {
  color: var(--status-warning);
}
.secret-value {
  padding: 10px 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-fill);
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-primary);
  word-break: break-all;
  user-select: all;
}

/* ---------- 索引行高度吃满、窄屏降为上下结构 ---------- */
@media (max-width: 940px) {
  .ws {
    flex-direction: column;
  }
  .idx {
    width: auto;
    max-height: 340px;
  }
  /* 上下堆叠时没有左右分栏，手柄一并收起 */
  .ws-split {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .idx-row,
  .main-tab,
  .icon-btn,
  .ctx-item {
    transition: none;
  }
}
</style>
