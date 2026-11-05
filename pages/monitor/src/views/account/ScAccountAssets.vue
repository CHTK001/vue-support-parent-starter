<template>
  <div class="account-assets fade-in">
    <ReSectionHead
      class="page-head"
      title="账号资产"
      description="设备密钥 · POP/SMTP 邮箱 · 短信。左栏按种类收窄，右栏是完整台账，行首一条凭据健康色条。"
    >
      <template #actions>
        <ReButton show-text icon="RefreshLeft" plain :loading="loading" @click="fetchList">刷新</ReButton>
        <ReButton show-text icon="Plus" type="primary" @click="openCreate">新增账号</ReButton>
      </template>
    </ReSectionHead>

    <div class="ledger-wrap">
      <!-- 种类导航：窄栏常驻，切换即时生效，不占表格的横向空间 -->
      <aside class="kind-rail">
        <div class="rail-label">按种类</div>
        <button
          v-for="item in kindNav"
          :key="item.value"
          class="rail-item"
          :class="{ 'is-on': filters.kind === item.value }"
          @click="filters.kind = item.value"
        >
          <span>{{ item.label }}</span>
          <b>{{ item.count }}</b>
        </button>

        <div class="rail-foot">
          <div>
            <b>{{ enabledCount }}</b>
            <span>启用</span>
          </div>
          <div>
            <b :class="{ 'is-warn': pendingCount > 0 }">{{ pendingCount }}</b>
            <span>待处理</span>
          </div>
        </div>
      </aside>

      <section class="ledger-main">
        <div class="ledger-bar">
          <label class="search-box">
            <ReIcon class="search-icon" name="Search" :size="13" />
            <input v-model="filters.keyword" placeholder="搜索名称 / 编码 / 登录名 / 地址" />
          </label>
          <div class="chip-group">
            <button
              v-for="chip in statusChips"
              :key="chip.value"
              class="chip"
              :class="{ 'is-on': filters.status === chip.value, 'is-warn': chip.tone === 'warn' }"
              @click="filters.status = chip.value"
            >
              {{ chip.label }}
            </button>
          </div>
          <span class="bar-count">{{ filtered.length }} 项</span>
        </div>

        <ReTable
          :data="filtered"
          :loading="loading"
          border
          stripe
          row-key="accountId"
          class="account-table"
          empty-text="暂无账号，点右上角「新增账号」创建"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
          :context-menu="tableMenu"
          @row-click="onRowClick"
          @cell-click="onCellClick"
          @context-menu-select="onMenuSelect"
        >
          <ReTableColumn label="账号" min-width="216">
            <template #default="{ row }">
              <div class="name-cell">
                <i class="cred-bar" :class="row.hasSecret ? 'is-ok' : 'is-warn'"></i>
                <div class="name-text">
                  <div class="name-line">
                    <span class="name" :title="row.name">{{ row.name || '未命名' }}</span>
                    <ReTag v-if="row.defaultAccount" type="warning" size="small" effect="plain">默认</ReTag>
                  </div>
                  <div class="code mono">{{ row.code || '—' }}</div>
                </div>
              </div>
            </template>
          </ReTableColumn>
          <ReTableColumn label="种类" width="108">
            <template #default="{ row }">
              <ReTag :type="kindTagType(row.kind)" effect="plain">{{ kindLabel(row.kind) }}</ReTag>
            </template>
          </ReTableColumn>
          <ReTableColumn label="登录名 / 地址" min-width="184">
            <template #default="{ row }">
              <div v-if="row.username" class="mono ellipsis" :title="row.username">{{ row.username }}</div>
              <div v-if="row.endpoint" class="mono dim ellipsis" :title="endpointText(row)">
                {{ endpointText(row) }}
              </div>
              <span v-if="!row.username && !row.endpoint" class="dim">—</span>
            </template>
          </ReTableColumn>
          <ReTableColumn label="凭据" width="92" align="center">
            <template #default="{ row }">
              <ReTag :type="row.hasSecret ? 'success' : 'warning'" effect="plain">
                {{ row.hasSecret ? '已配置' : '待配置' }}
              </ReTag>
            </template>
          </ReTableColumn>
          <ReTableColumn label="校验" width="108" align="center">
            <template #default="{ row }">
              <el-tooltip :content="row.verifyMessage || '尚未校验'" placement="top" :show-after="200">
                <ReTag :type="verifyTagType(row.verifyStatus)" effect="plain">
                  {{ verifyLabel(row.verifyStatus) }}
                </ReTag>
              </el-tooltip>
            </template>
          </ReTableColumn>
          <ReTableColumn label="更新时间" width="112">
            <template #default="{ row }">
              <span class="dim time-text">{{ formatShort(row.updatedAt || row.createdAt) }}</span>
            </template>
          </ReTableColumn>
          <ReTableColumn label="操作" width="152" fixed="right" align="right">
            <template #default="{ row }">
              <span class="ops" @click.stop>
                <ReButton v-if="row.kind === 'EMAIL' || row.kind === 'SMS'" link @click.stop="openConsole(row)">
                  {{ row.kind === 'EMAIL' ? '打开邮箱' : '打开短信' }}
                </ReButton>
                <ReButton v-else link @click.stop="openDetail(row)">详情</ReButton>
                <ReButton link type="primary" @click.stop="openEdit(row)">编辑</ReButton>
              </span>
            </template>
          </ReTableColumn>
        </ReTable>
      </section>
    </div>

    <!-- 账号详情 -->
    <ReDialog v-model="showDetail" :title="detailTitle" width="760" :height="620" destroy-on-close compact>
      <div v-if="active" class="detail-body">
        <section class="detail-section">
          <h4 class="section-title">基础信息</h4>
          <ReRow :gutter="16">
            <ReCol :span="8"><div class="kv"><span class="k">名称</span><span class="v">{{ active.name || '—' }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">编码</span><span class="v mono">{{ active.code || '—' }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">种类</span><span class="v">{{ kindLabel(active.kind) }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">厂商 / 服务商</span><span class="v">{{ active.vendor || '—' }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">登录名 / 地址</span><span class="v mono">{{ active.username || '—' }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">服务地址</span><span class="v mono">{{ active.endpoint || '—' }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">归属</span><span class="v">{{ active.owner ? `仅本人（${active.owner}）` : '部署级共享' }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">状态</span><span class="v">{{ active.status === 0 ? '停用' : '启用' }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">同种类默认</span><span class="v">{{ active.defaultAccount ? '是' : '否' }}</span></div></ReCol>
          </ReRow>
        </section>

        <section class="detail-section">
          <h4 class="section-title">
            凭据与校验
            <span class="section-extra">
              <ReTag :type="active.hasSecret ? 'success' : 'warning'" effect="plain" size="small">
                {{ active.hasSecret ? '凭据已配置' : '凭据待配置' }}
              </ReTag>
            </span>
          </h4>
          <ReRow :gutter="16">
            <ReCol :span="8"><div class="kv"><span class="k">校验状态</span><span class="v">{{ verifyLabel(active.verifyStatus) }}</span></div></ReCol>
            <ReCol :span="8"><div class="kv"><span class="k">最近校验</span><span class="v">{{ formatTime(active.verifyAt) }}</span></div></ReCol>
            <ReCol :span="24"><div class="kv wide"><span class="k">校验说明</span><span class="v">{{ active.verifyMessage || '—' }}</span></div></ReCol>
          </ReRow>
          <div class="detail-tip">凭据明文只进不出：读取接口只回传「是否已配置」，编辑时留空表示不修改。</div>
        </section>

        <section class="detail-section">
          <h4 class="section-title">类型专属配置</h4>
          <div v-if="configRows.length" class="config-grid">
            <div v-for="item in configRows" :key="item.key" class="kv wide">
              <span class="k">{{ item.label }}</span>
              <span class="v">{{ item.value }}</span>
            </div>
          </div>
          <ReEmpty v-else :image-size="56" description="暂无类型专属配置" />
        </section>

        <section class="detail-section">
          <h4 class="section-title">时间</h4>
          <ReRow :gutter="16">
            <ReCol :span="12"><div class="kv"><span class="k">创建时间</span><span class="v">{{ formatTime(active.createdAt) }}</span></div></ReCol>
            <ReCol :span="12"><div class="kv"><span class="k">更新时间</span><span class="v">{{ formatTime(active.updatedAt) }}</span></div></ReCol>
          </ReRow>
        </section>
      </div>

      <template #footer>
        <ReButton v-if="detailConsoleUrl" @click="openConsole(active)">
          {{ active?.kind === 'EMAIL' ? '打开邮箱' : '打开短信' }}
        </ReButton>
        <ReButton :loading="verifyingId === active?.accountId" @click="onVerify(active)">校验凭据</ReButton>
        <ReButton type="primary" @click="openEdit(active)">编辑</ReButton>
      </template>
    </ReDialog>

    <!-- 新增 / 编辑 -->
    <AccountFormDialog v-model="formVisible" :account="editing" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts" name="ScAccountAssets">
import { computed, onMounted, ref } from 'vue';
import {
  ChatDotRound,
  CircleCheck,
  CopyDocument,
  Delete,
  EditPen,
  Message,
  Star,
  SwitchButton,
  View,
} from '@element-plus/icons-vue';
import { message } from '@repo/core';
import ReButton from '@repo/ui/re-button';
import ReDialog from '@repo/ui/re-dialog';
import ReEmpty from '@repo/ui/re-empty';
import ReIcon from '@repo/ui/re-icon';
import ReSectionHead from '@repo/ui/re-section-head';
import ReTable from '@repo/ui/re-table';
import type {
  ReTableCellClickPayload,
  ReTableContextMenuContext,
  ReTableContextMenuItem,
} from '@repo/ui/re-table';
import ReTag from '@repo/ui/re-tag';

import AccountFormDialog from '../../components/AccountFormDialog.vue';
import {
  deleteAccount,
  listAccounts,
  updateAccount,
  verifyAccount,
  type AccountKind,
  type AccountVerifyStatus,
  type SysAccount,
} from '../../api/account';
import { accountConsoleUrl } from '../../utils/accountLinks';
import { confirmThen } from '../../utils/confirmThen';
import { copyText } from '../../utils/clipboard';

/**
 * 账号资产 —— monitor 的统一账号台账。
 *
 * <p>布局是「按种类收窄 + 完整台账」两栏：左栏只放种类与两个计数，右侧是
 * 搜索、状态胶囊与密集表格。账号总量小、种类只有三种，用一列导航比三个
 * 下拉筛选更快——切种类是一次点击，且种类数量始终可见。</p>
 *
 * <p>行首的 3px 色条是凭据健康指示：绿色表示已配置，琥珀色表示缺凭据。
 * 它把「哪个账号还欠凭据」变成扫视即可得到的信息，不必逐行读标签。</p>
 *
 * <p>账号有三种：设备 / 第三方 API 密钥、POP-SMTP 邮箱、短信服务商。
 * 邮箱与短信的右键菜单与操作列多出「打开邮箱 / 打开短信」，地址由
 * {@link accountConsoleUrl} 解析（优先 {@code config.webUrl}，否则按内置映射推导）。</p>
 */

/** 状态胶囊筛选项 */
type StatusFilter = 'all' | 'on' | 'off' | 'pending' | 'invalid';

/** 种类导航项 */
type KindFilter = 'ALL' | AccountKind;

/** 账号列表 */
const rows = ref<SysAccount[]>([]);
/** 加载态 */
const loading = ref(false);
/** 正在校验的账号 id */
const verifyingId = ref<string | null>(null);
/** 详情弹窗 */
const showDetail = ref(false);
/** 当前行（详情 / 底部信息共用） */
const active = ref<SysAccount | null>(null);
/** 新增 / 编辑弹窗 */
const formVisible = ref(false);
const editing = ref<SysAccount | null>(null);

/** 筛选条件 */
const filters = ref<{
  keyword: string;
  kind: KindFilter;
  status: StatusFilter;
}>({
  keyword: '',
  kind: 'ALL',
  status: 'all',
});

/** 启用数量 */
const enabledCount = computed(() => rows.value.filter(row => row.status !== 0).length);

/** 待处理数量：缺凭据或校验失败，都是「点一下能查/能补」的事 */
const pendingCount = computed(
  () => rows.value.filter(row => !row.hasSecret || row.verifyStatus === 'INVALID').length,
);

/** 缺凭据数量 */
const missingCount = computed(() => rows.value.filter(row => !row.hasSecret).length);

/** 校验失败数量 */
const invalidCount = computed(() => rows.value.filter(row => row.verifyStatus === 'INVALID').length);

/**
 * 种类导航。
 *
 * <p>四种（全部 + 三类）恒定显示：数量为 0 也保留，避免点选后导航项突然消失、
 * 让用户以为筛选失效。</p>
 */
const kindNav = computed<Array<{ value: KindFilter; label: string; count: number }>>(() => [
  { value: 'ALL', label: '全部账号', count: rows.value.length },
  { value: 'API_KEY', label: 'API 密钥', count: rows.value.filter(row => row.kind === 'API_KEY').length },
  { value: 'EMAIL', label: '邮箱账号', count: rows.value.filter(row => row.kind === 'EMAIL').length },
  { value: 'SMS', label: '短信账号', count: rows.value.filter(row => row.kind === 'SMS').length },
]);

/**
 * 状态胶囊。
 *
 * <p>把原来的三个下拉压成一行：账号的状态只有启用/停用，校验只有失败需要关注，
 * 「待配置」与「校验失败」直接带数字，需要处理的事一眼可见。</p>
 */
const statusChips = computed<Array<{ value: StatusFilter; label: string; tone?: 'warn' }>>(() => [
  { value: 'all', label: '全部' },
  { value: 'on', label: '启用' },
  { value: 'off', label: '停用' },
  { value: 'pending', label: `缺凭据 ${missingCount.value}`, tone: missingCount.value > 0 ? 'warn' : undefined },
  { value: 'invalid', label: `校验失败 ${invalidCount.value}`, tone: invalidCount.value > 0 ? 'warn' : undefined },
]);

/**
 * 客户端筛选：账号总量很小，服务端只按关键字取一次，
 * 其余条件在本地即时生效，避免每敲一个字符都打接口。
 */
const filtered = computed(() => {
  const keyword = filters.value.keyword.trim().toLowerCase();
  return rows.value.filter(row => {
    if (filters.value.kind !== 'ALL' && row.kind !== filters.value.kind) return false;
    if (filters.value.status === 'on' && row.status === 0) return false;
    if (filters.value.status === 'off' && row.status !== 0) return false;
    if (filters.value.status === 'pending' && row.hasSecret) return false;
    if (filters.value.status === 'invalid' && row.verifyStatus !== 'INVALID') return false;
    if (!keyword) return true;
    return `${row.name || ''} ${row.code || ''} ${row.username || ''} ${row.endpoint || ''}`
      .toLowerCase()
      .includes(keyword);
  });
});

/** 详情标题 */
const detailTitle = computed(() => {
  if (!active.value) return '账号详情';
  return `${kindLabel(active.value.kind)} · ${active.value.name || active.value.code || ''}`;
});

/** 详情的控制台地址（邮箱 / 短信） */
const detailConsoleUrl = computed(() => (active.value ? accountConsoleUrl(active.value) : ''));

/** 类型专属配置展示行 */
const configRows = computed(() => {
  const config = (active.value?.config || {}) as Record<string, unknown>;
  const labels: Record<string, string> = {
    port: '端口',
    ssl: 'SSL / TLS',
    from: '默认发件人',
    signName: '短信签名',
    templateCode: '模板编码',
    region: '区域',
    webUrl: '控制台地址',
  };
  return Object.entries(config)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({
      key,
      label: labels[key] || key,
      value: typeof value === 'boolean' ? (value ? '是' : '否') : String(value),
    }));
});

/** 加载账号列表 */
async function fetchList(): Promise<void> {
  loading.value = true;
  try {
    rows.value = (await listAccounts()) ?? [];
  } catch (e: any) {
    message.error(e?.message || '账号加载失败');
  } finally {
    loading.value = false;
  }
}

/** 打开新增 */
function openCreate(): void {
  editing.value = null;
  formVisible.value = true;
}

/** 打开编辑 */
function openEdit(row: SysAccount | null): void {
  if (!row) return;
  editing.value = row;
  formVisible.value = true;
}

/** 打开详情 */
function openDetail(row: SysAccount | null): void {
  if (!row) return;
  active.value = row;
  showDetail.value = true;
}

/** 保存成功后的刷新与回指 */
function onSaved(saved: SysAccount): void {
  void fetchList();
  if (saved?.accountId) {
    active.value = saved;
  }
}

/**
 * 行右键菜单。
 *
 * <p>邮箱 / 短信行额外给「打开邮箱 / 打开短信」；地址解析不出时置灰，
 * 而不是让用户点开一个空白页。</p>
 */
function tableMenu(ctx: ReTableContextMenuContext): ReTableContextMenuItem[] {
  const row = ctx.row as unknown as SysAccount;
  const consoleUrl = accountConsoleUrl(row);
  const items: ReTableContextMenuItem[] = [
    { key: 'detail', label: '账号详情', icon: View },
    { key: 'edit', label: '编辑账号', icon: EditPen },
    { key: 'verify', label: '校验凭据', icon: CircleCheck },
  ];
  if (row.kind === 'EMAIL' || row.kind === 'SMS') {
    items.push({
      key: row.kind === 'EMAIL' ? 'open-mail' : 'open-sms',
      label: row.kind === 'EMAIL' ? '打开邮箱' : '打开短信',
      icon: row.kind === 'EMAIL' ? Message : ChatDotRound,
      divided: true,
      disabled: !consoleUrl,
    });
  }
  items.push(
    { key: 'copy-code', label: '复制账号编码', icon: CopyDocument, divided: true },
    {
      key: 'default',
      label: row.defaultAccount ? '已是同种类默认' : '设为同种类默认',
      icon: Star,
      disabled: Boolean(row.defaultAccount),
    },
    { key: 'status', label: row.status === 0 ? '启用账号' : '停用账号', icon: SwitchButton },
    { key: 'delete', label: '删除账号', icon: Delete, divided: true },
  );
  return items;
}

/** 右键菜单选中 */
function onMenuSelect(item: ReTableContextMenuItem, ctx: ReTableContextMenuContext): void {
  const row = ctx.row as unknown as SysAccount;
  active.value = row;
  switch (item.key) {
    case 'detail':
      openDetail(row);
      break;
    case 'edit':
      openEdit(row);
      break;
    case 'verify':
      void onVerify(row);
      break;
    case 'open-mail':
    case 'open-sms':
      openConsole(row);
      break;
    case 'copy-code':
      void copyCode(row);
      break;
    case 'default':
      void setDefault(row);
      break;
    case 'status':
      void toggleStatus(row);
      break;
    case 'delete':
      void remove(row);
      break;
  }
}

/** 单行点选：详情 / 底部信息跟随 */
function onRowClick(row: Record<string, unknown>): void {
  active.value = row as unknown as SysAccount;
}

/** 双击（第二次 click 的 detail=2）打开详情 */
function onCellClick(payload: ReTableCellClickPayload): void {
  if (payload.event?.detail !== 2) return;
  openDetail(payload.row as unknown as SysAccount);
}

/**
 * 打开邮箱 / 短信控制台。
 *
 * @param row 账号
 */
function openConsole(row: SysAccount | null): void {
  if (!row) return;
  const url = accountConsoleUrl(row);
  if (!url) {
    message.warning('该账号没有可解析的控制台地址，可在编辑里填写「控制台地址」');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
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
    await fetchList();
    const latest = rows.value.find(item => item.accountId === row.accountId);
    if (latest) {
      active.value = latest;
    }
  } catch (e: any) {
    message.error(e?.message || '校验失败');
  } finally {
    verifyingId.value = null;
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
    await fetchList();
  } catch (e: any) {
    message.error(e?.message || '设置失败');
  }
}

/**
 * 启用 / 停用。
 *
 * @param row 账号
 */
async function toggleStatus(row: SysAccount): Promise<void> {
  const next = row.status === 0 ? 1 : 0;
  try {
    await updateAccount(row.accountId, { ...row, status: next });
    message.success(next === 1 ? '账号已启用' : '账号已停用');
    await fetchList();
  } catch (e: any) {
    message.error(e?.message || '状态更新失败');
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
    if (active.value?.accountId === row.accountId) {
      active.value = null;
    }
    await fetchList();
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
}

/**
 * 账号种类中文名。
 *
 * @param kind 种类
 * @returns 中文名
 */
function kindLabel(kind?: AccountKind): string {
  return ({ API_KEY: 'API 密钥', EMAIL: '邮箱账号', SMS: '短信账号' } as Record<string, string>)[kind || ''] || '未知';
}

/**
 * 账号种类标签色。
 *
 * @param kind 种类
 * @returns ReTag type
 */
function kindTagType(kind?: AccountKind): 'warning' | 'primary' | 'success' | 'info' {
  if (kind === 'API_KEY') return 'warning';
  if (kind === 'EMAIL') return 'primary';
  if (kind === 'SMS') return 'success';
  return 'info';
}

/**
 * 校验状态中文名。
 *
 * @param status 状态
 * @returns 中文名
 */
function verifyLabel(status?: AccountVerifyStatus): string {
  return ({ VALID: '有效', INVALID: '校验失败', UNKNOWN: '未校验' } as Record<string, string>)[status || ''] || '未校验';
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

onMounted(fetchList);
</script>

<style scoped>
/* 本页沿用 koi 令牌（--bg-container / --border-subtle / --text-* / --radius-*），
   与主机资产、设备资产保持同一套底色、圆角与状态色，不引入本页私有色板。 */
.fade-in {
  animation: fadeIn 0.35s var(--ease-out) both;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.page-head :deep(.re-section-head__title) {
  color: var(--text-primary);
}
.page-head :deep(.re-section-head__desc) {
  color: var(--text-secondary);
}

/* ---------- 两栏：种类导航 + 台账 ---------- */
.ledger-wrap {
  display: grid;
  grid-template-columns: 168px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.kind-rail {
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 10px 8px;
  box-shadow: var(--shadow-sm);
}
.rail-label {
  padding: 2px 8px 7px;
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}
.rail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: none;
  font: inherit;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: left;
  cursor: pointer;
  transition: background 0.16s var(--ease-out), color 0.16s var(--ease-out);
}
.rail-item b {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg-fill);
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-tertiary);
}
.rail-item:hover {
  background: var(--bg-fill);
}
.rail-item.is-on {
  background: var(--brand-50);
  color: var(--brand-600, #5a4bd9);
  font-weight: 600;
}
.rail-item.is-on b {
  background: var(--bg-container);
  color: var(--brand-500, #6d5dfc);
}

.rail-foot {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  padding: 9px 8px 2px;
  border-top: 1px solid var(--border-subtle);
}
.rail-foot div {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.rail-foot b {
  font-size: 16px;
  line-height: 1.1;
  color: var(--text-primary);
}
.rail-foot b.is-warn {
  color: var(--status-warning);
}
.rail-foot span {
  font-size: 10px;
  color: var(--text-tertiary);
}

.ledger-main {
  min-width: 0;
}

/* ---------- 工具行 ---------- */
.ledger-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.search-box {
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
.search-box:focus-within {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px var(--el-color-primary-light-9);
}
.search-box input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  font-size: 12px;
  color: var(--text-primary);
}
.search-box input::placeholder {
  color: var(--text-tertiary);
}
.search-icon {
  flex: none;
  color: var(--text-tertiary);
}
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.chip {
  padding: 4px 10px;
  border: 1px solid var(--border-default);
  border-radius: 999px;
  background: var(--bg-container);
  font: inherit;
  font-size: 11.5px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.16s var(--ease-out);
}
.chip:hover {
  border-color: var(--border-default);
  color: var(--text-primary);
}
/* 警示色写在选中态之前：既保留「有 N 项待处理」的提醒，
   又保证点下去之后仍是明确的选中样式。 */
.chip.is-warn {
  border-color: var(--sev-p2-border);
  background: var(--sev-p2-bg);
  color: var(--sev-p2-text);
}
.chip.is-on {
  border-color: var(--brand-100, #ece9ff);
  background: var(--brand-100, #ece9ff);
  color: var(--brand-600, #5a4bd9);
  font-weight: 600;
}
.bar-count {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* ---------- 台账表格 ---------- */
.account-table {
  --el-table-border-color: var(--border-subtle);
}
.account-table :deep(.el-table__header th) {
  background: var(--bg-elevated);
  color: var(--text-tertiary);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.03em;
}
.account-table :deep(.el-table__cell) {
  padding: 6px 0;
}

/* 行首凭据健康色条：绿=已配置，琥珀=缺凭据 */
.name-cell {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}
.cred-bar {
  flex: none;
  width: 3px;
  height: 24px;
  border-radius: 2px;
  background: var(--status-success);
}
.cred-bar.is-warn {
  background: var(--status-warning);
}
.name-text {
  min-width: 0;
}
.name-line {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.code {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mono {
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
  font-size: 11px;
}
.ellipsis {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dim {
  color: var(--text-tertiary);
}
.time-text {
  font-size: 11px;
  white-space: nowrap;
}
.ops {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* ---------- 详情 ---------- */
.detail-body {
  padding: 4px 4px 8px;
}
.detail-section {
  margin-bottom: 20px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
}
.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-subtle);
}
.section-extra {
  font-weight: 400;
  letter-spacing: 0;
}
.kv {
  display: flex;
  gap: 8px;
  padding: 6px 0;
  font-size: 13px;
  min-width: 0;
}
.kv .k {
  flex: 0 0 84px;
  color: var(--text-tertiary);
}
.kv .v {
  color: var(--text-primary);
  word-break: break-all;
}
.detail-tip {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 4px 16px;
}

/* ---------- 窄屏：导航转为一行，表格横向滚动 ---------- */
@media (max-width: 720px) {
  .ledger-wrap {
    grid-template-columns: minmax(0, 1fr);
  }
  .kind-rail {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    padding: 8px;
  }
  .rail-label,
  .rail-foot {
    display: none;
  }
  .rail-item {
    width: auto;
    background: var(--bg-fill);
  }
  .chip-group {
    order: 3;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-in {
    animation: none;
  }
}
</style>
