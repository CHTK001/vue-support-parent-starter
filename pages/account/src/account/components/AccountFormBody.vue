<template>
  <div class="form-shell">
    <nav class="form-nav" aria-label="表单分区导航">
      <button
        v-for="section in FORM_SECTIONS"
        :key="section.key"
        type="button"
        class="form-nav-item"
        :class="{ 'is-on': activeSection === section.key }"
        @click="scrollToSection(section.key)"
      >
        {{ section.label }}
      </button>
    </nav>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="104px"
      class="account-form"
    >
    <div class="form-section" data-section="basic">基础信息</div>
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item label="账号名称" prop="name">
          <el-input v-model="form.name" placeholder="如 海康开放平台 / 运维邮箱" maxlength="128" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="账号编码" prop="code">
          <el-input v-model="form.code" placeholder="业务唯一键，如 hikvision-api" maxlength="128" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="账号种类" prop="kind">
          <el-select v-model="form.kind" style="width: 100%" @change="onKindChange">
            <el-option
              v-for="option in KIND_OPTIONS"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="VENDOR_LABELS[form.kind]">
          <el-input v-model="form.vendor" :placeholder="VENDOR_PLACEHOLDERS[form.kind]" maxlength="64" />
        </el-form-item>
      </el-col>
      <el-col v-if="!useKeyRef && form.kind !== 'TEMP_PHONE'" :span="12">
        <el-form-item :label="USERNAME_LABELS[form.kind]" prop="username">
          <el-input v-model="form.username" :placeholder="USERNAME_PLACEHOLDERS[form.kind]" maxlength="255" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="ENDPOINT_LABELS[form.kind]" prop="endpoint">
          <el-input v-model="form.endpoint" :placeholder="ENDPOINT_PLACEHOLDERS[form.kind]" maxlength="512" />
        </el-form-item>
      </el-col>
      <el-col v-if="form.kind !== 'EMAIL' && form.kind !== 'TEMP_PHONE' && form.kind !== 'PHONE'" :span="24">
        <el-form-item label="密钥来源">
          <el-segmented v-model="form.keyMode" :options="KEY_SOURCE_OPTIONS" size="small" />
        </el-form-item>
      </el-col>
      <el-col v-if="useKeyRef" :span="24">
        <el-form-item label="选择密钥">
          <el-select v-model="form.secretId" filterable placeholder="从密钥管理里选择" class="w-full">
            <!-- 选中后输入框里也显示该密钥的厂商 logo -->
            <template #label="{ value }">
              <span class="opt opt--picked">
                <ProviderLogo :provider="pickedSecret(value)?.provider" :size="14" />
                <span class="opt__text">{{ pickedSecret(value)?.name || pickedSecret(value)?.accessKey || '' }}</span>
              </span>
            </template>
            <el-option
              v-for="item in secretOptions"
              :key="item.secretId"
              :label="`${item.name || item.accessKey}（${typeLabel(item.secretType)} · ${providerLabel(item.provider)}）`"
              :value="item.secretId"
            >
              <span class="opt">
                <ProviderLogo :provider="item.provider" :size="16" />
                <span>{{ item.name || item.accessKey }}</span>
                <span class="opt__meta">{{ typeLabel(item.secretType) }} · {{ providerLabel(item.provider) }}</span>
              </span>
            </el-option>
          </el-select>
          <div class="field-hint">
            列表已标注类型，同类型优先；没有同类型时可任选一条使用。调用时使用该密钥的
            AccessKeyId / Secret，换密钥不必改账号。可去「密钥管理」新建。
          </div>
        </el-form-item>
      </el-col>
      <el-col v-if="!useKeyRef && form.kind !== 'TEMP_PHONE' && form.kind !== 'PHONE'" :span="24">
        <el-form-item label="敏感凭据">
          <el-input
            v-model="form.secret"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="secretPlaceholder"
          />
          <div class="field-hint">{{ secretHint }}</div>
        </el-form-item>
      </el-col>
    </el-row>

    <div class="form-section" data-section="extra">类型专属配置</div>
    <el-row :gutter="16">
      <el-col v-if="form.kind === 'EMAIL' || form.kind === 'SMS'" :span="24">
        <el-form-item label="账号来源">
          <el-segmented v-model="form.sourceMode" :options="SOURCE_OPTIONS" size="small" />
          <div class="field-hint">
            {{
              form.sourceMode === 'temp'
                ? form.kind === 'EMAIL'
                  ? '领取一个临时邮箱（mail.tm）：地址、密码与租期由服务端生成，可随时销毁。'
                  : '临时短信接码服务尚未接入（后端无领取接口）；请先在「渠道管理」配置短信接码渠道，或选择「自定义」。'
                : '手动填写自己的邮箱 / 短信服务商账号。'
            }}
          </div>
        </el-form-item>
      </el-col>
      <template v-if="form.kind === 'EMAIL'">
        <template v-if="form.sourceMode === 'custom'">
          <el-col :span="24">
            <el-form-item label="常用预置">
              <div class="preset-chips">
                <button
                  v-for="preset in EMAIL_PRESETS"
                  :key="preset.key"
                  type="button"
                  class="preset-chip"
                  @click="applyEmailPreset(preset)"
                >
                  {{ preset.label }}
                </button>
              </div>
              <div class="field-hint">一键填入该服务商的发信地址端口与收信主机（SSL 口径），可再手动微调。</div>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="发信端口" prop="port">
              <el-input-number v-model="form.port" :min="1" :max="65535" controls-position="right" class="w-full" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="SSL / TLS">
              <el-switch v-model="form.ssl" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="默认发件人" prop="from">
              <el-input v-model="form.from" placeholder="noreply@example.com" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收信主机" prop="imapHost">
              <el-input v-model="form.imapHost" placeholder="如 imap.qq.com" maxlength="255" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="收信端口" prop="imapPort">
              <el-input-number
                v-model="form.imapPort"
                :min="1"
                :max="65535"
                controls-position="right"
                class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <div class="field-hint hint-block">
              收信（IMAP）与发信（SMTP）不同主机时才需填；留空按服务地址推导，端口留空按 SSL 开 993、关 143。
            </div>
          </el-col>

          <!-- 高级配置：接入方式 / 收取范围 / 新邮件通知 / POP3 主机端口 / 163 预置 -->
          <el-col :span="24">
            <div class="form-section" data-section="advanced">高级配置</div>
          </el-col>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="接入方式">
                <el-segmented v-model="form.inboxMode" :options="INBOX_MODE_OPTIONS" size="small" />
                <div class="field-hint">IMAP：可看文件夹、标已读、删除邮件；POP3：仅收取，不回写标记。</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="收取范围">
                <el-select v-model="form.receiveRange" style="width: 100%">
                  <el-option label="最近 30 天" value="30d" />
                  <el-option label="全部邮件" value="ALL" />
                </el-select>
                <div class="field-hint">POP3 不分页，全部收取可能较慢。</div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="新邮件通知">
                <el-switch v-model="form.notifyNew" active-text="开" inactive-text="关" />
                <div class="field-hint">轮询收信服务，有新邮件时弹出浏览器通知。</div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="form.inboxMode === 'pop3'" :gutter="16">
            <el-col :span="8">
              <el-form-item label="POP3 主机" prop="pop3Host">
                <el-input v-model="form.pop3Host" placeholder="如 pop.163.com" maxlength="255" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="POP3 端口" prop="pop3Port">
                <el-input-number v-model="form.pop3Port" :min="1" :max="65535" controls-position="right" class="w-full" />
              </el-form-item>
            </el-col>
          </el-row>
        </template>
        <el-col v-else :span="24">
          <el-form-item label="临时邮箱">
            <ReButton v-if="!isEdit" type="primary" :loading="tempBusy" @click="claimTemp">
              领取临时邮箱
            </ReButton>
            <span v-else class="field-hint">该账号是临时邮箱（mail.tm），地址不可修改；需要新地址请重新领取。</span>
            <div class="field-hint">地址、密码与租期由服务端生成；领取后自动创建账号并回到台账。</div>
          </el-form-item>
        </el-col>
      </template>
      <template v-else-if="form.kind === 'SMS'">
        <template v-if="form.sourceMode === 'custom'">
          <el-col :span="12">
            <el-form-item label="短信签名">
              <el-input v-model="form.signName" placeholder="如 某某科技" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="应用 ID">
              <el-input v-model="form.appId" placeholder="腾讯云 SmsSdkAppid（阿里/百度可留空）" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模板编码">
              <MessageTemplateSelect
                v-model="form.templateCode"
                kind="SMS"
                allow-create
                placeholder="选择模板，或直接输入运营商模板码"
              />
              <div class="field-hint">
                可从「模板管理 → 消息模板」选择；运营商下发的模板码（如 SMS_123456789）可直接输入。
              </div>
            </el-form-item>
          </el-col>
        </template>
        <el-col v-else :span="24">
          <el-form-item label="临时短信">
            <span class="field-hint">临时短信接码服务尚未接入：请在「渠道管理」配置短信接码渠道后领取号码。</span>
          </el-form-item>
        </el-col>
      </template>
      <template v-else-if="form.kind === 'TEMP_PHONE'">
        <el-col :span="24">
          <el-form-item label="临时手机号">
            <ReButton v-if="!isEdit" type="primary" :loading="tempBusy" @click="claimPhone">
              领取临时手机号
            </ReButton>
            <span v-else class="field-hint">该账号是临时手机号（本地目录轮询），号码不可修改；需要新号码请重新领取。</span>
            <div class="field-hint">号码与租期由服务端生成；只收短信、不能发送，新短信经 SSE 实时推送到收信箱。</div>
          </el-form-item>
        </el-col>
      </template>
      <template v-else-if="form.kind === 'PHONE'">
        <el-col :span="24">
          <div class="field-hint hint-block">
            手机号只收短信、不能发送：短信经本地目录轮询写入收信箱（与临时手机号同一条链路）；
            号码手工录入、长期有效、不过期，新短信经 SSE 实时推送到收信箱。
          </div>
        </el-col>
      </template>
      <template v-else-if="form.kind === 'CREDIT_CARD'">
        <el-col :span="24">
          <el-form-item label="随机生成">
            <ReButton type="primary" :loading="mockBusy" @click="generateMockDraft">
              随机生成测试数据
            </ReButton>
            <div class="field-hint">
              一次生成卡号（按卡组织前缀 + Luhn 校验位）、发卡组织、CVV、有效期与持卡人画像；仅测试用途，不代表真实卡片。
            </div>
          </el-form-item>
        </el-col>
        <template v-if="hasHolderProfile">
          <el-col :span="12">
            <el-form-item label="有效期">
              <el-input v-model="form.cardExpire" placeholder="如 09/29" maxlength="8" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="持卡人">
              <el-input v-model="form.holderName" maxlength="64" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别">
              <el-input v-model="form.holderGender" maxlength="8" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出生日期">
              <el-input v-model="form.holderBirthday" maxlength="16" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="证件号">
              <el-input v-model="form.holderIdNumber" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="form.holderPhone" maxlength="32" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱">
              <el-input v-model="form.holderEmail" maxlength="128" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="账单地址">
              <el-input v-model="form.holderAddress" maxlength="255" />
            </el-form-item>
          </el-col>
        </template>
      </template>
      <template v-else>
        <el-col :span="12">
          <el-form-item label="区域">
            <el-input v-model="form.region" placeholder="如 cn-shanghai（可留空）" maxlength="64" />
          </el-form-item>
        </el-col>
      </template>
      <el-col :span="24">
        <el-form-item label="控制台地址" prop="webUrl">
          <el-input v-model="form.webUrl" placeholder="可留空：邮箱 / 短信会自动按域名或服务商推导" maxlength="512" />
          <div class="field-hint">右键「打开邮箱 / 打开短信」时打开的网页地址；留空则按内置映射推导。</div>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 用途能力：一条账号可以同时是邮箱、大语言、存储……左栏图标条读的就是这里 -->
    <div class="form-section" data-section="capability">用途能力</div>
    <el-form-item label="能力标记">
      <el-checkbox-group v-model="form.capabilities" class="cap-group">
        <el-checkbox-button v-for="tag in ACCOUNT_CAPABILITY_TAGS" :key="tag.key" :value="tag.key">
          <ReIcon :name="tag.icon" :size="12" />
          <span>{{ tag.label }}</span>
        </el-checkbox-button>
      </el-checkbox-group>
      <div class="field-hint">
        可多选，左栏按标记显示能力图标。一条也不选时按账号种类显示默认能力（邮箱收/发信、短信、接口调用）。
      </div>
    </el-form-item>

    <div class="form-section" data-section="status">状态与归属</div>
    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="同种类默认">
          <el-switch v-model="form.defaultAccount" />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item label="归属">
          <span class="owner-hint">
            {{ isEdit ? (account?.owner ? `仅本人：${account.owner}` : '部署级共享') : '部署级共享（可留空）' }}
          </span>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 底部保存条：弹窗与常驻表单共用同一套动作，避免两处各写一份提交逻辑 -->
    <div class="form-actions">
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">
        {{ isEdit ? '保存' : '创建' }}
      </el-button>
    </div>
  </el-form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { message } from '@repo/core';
import type { FormInstance, FormItemRule, FormRules } from 'element-plus';
import ReButton from '@repo/ui/re-button';
import ReIcon from '@repo/ui/re-icon';
import MessageTemplateSelect from '../../template/components/MessageTemplateSelect.vue';
import { confirmThen } from '../../shared/confirmThen';
import { providerLabel } from '../secretProviders';
import { ACCOUNT_CAPABILITY_TAGS, readCapabilityKeys } from '../capabilities';
import ProviderLogo from '../views/components/ProviderLogo.vue';
import {
  claimTempMailbox,
  claimTempPhone,
  createAccount,
  getAccountMockDraft,
  isTempMail,
  listAccountSecrets,
  updateAccount,
  type AccountKind,
  type SysAccount,
  type SysAccountSecret,
} from '../api/account';

/**
 * 账号表单体（无外壳）。
 *
 * <p>字段按账号种类收敛：密钥只关心服务地址与区域，邮箱多出端口 / SSL / 发件人，
 * 短信多出签名 / 模板编码。所有类型专属字段都落到 {@code config} JSON，
 * 后端的 {@code SysAccount#config} 原样保存，不做列扩张。</p>
 *
 * <p><b>为什么拆出表单体</b>：账号资产页的「新增 / 编辑」是常驻分屏表单，
 * 而 {@code AccountFormDialog} 是弹窗；两处要的是同一份字段与提交逻辑。
 * 这里只负责表单本体与提交，显隐、标题、关闭由宿主决定，
 * 避免复制两份 {@code buildPayload} / {@code fillForm} 之后各自漂移。</p>
 *
 * <p>编辑时敏感值不回显：留空或含 {@code ****} 表示不修改（后端按掩码判定）。</p>
 */
const props = defineProps<{
  /** 是否处于激活状态（激活时回填表单并加载密钥选项） */
  active?: boolean;
  /** 正在编辑的账号；null 表示新增 */
  account?: SysAccount | null;
  /**
   * 复制来源：新增时用它预填表单。
   *
   * <p>与 {@code account} 的区别是「不进入编辑态」——保存走新增，
   * 因此凭据不会被带过去（读接口本来也拿不到明文），编码自动加后缀避免撞唯一键。</p>
   */
  draft?: SysAccount | null;
}>();

const emit = defineEmits<{
  /** 保存成功 */
  (e: 'saved', account: SysAccount): void;
  /** 取消 / 关闭 */
  (e: 'cancel'): void;
}>();

/** 账号种类选项（与后端 /api/accounts/kinds 保持一致） */
const KIND_OPTIONS: Array<{ value: AccountKind; label: string }> = [
  { value: 'API_KEY', label: 'API 密钥' },
  { value: 'EMAIL', label: '邮箱账号' },
  { value: 'SMS', label: '短信账号' },
  { value: 'TEMP_PHONE', label: '临时手机号' },
  { value: 'PHONE', label: '手机号' },
  { value: 'CREDIT_CARD', label: '信用卡' },
];

/** 密钥来源分段：直接填写 / 引用密钥管理 */
const KEY_SOURCE_OPTIONS = [
  { label: '直接填写', value: 'inline' },
  { label: '引用密钥管理', value: 'ref' },
];

/** 账号来源分段：临时（系统领取）/ 自定义（手动填写） */
const SOURCE_OPTIONS = [
  { label: '自定义', value: 'custom' },
  { label: '临时', value: 'temp' },
];

/** 收信接入方式：IMAP / POP3，二者互斥，由 config.inboxMode 决策 */
const INBOX_MODE_OPTIONS = [
  { label: 'IMAP/SMTP 服务', value: 'imap' },
  { label: 'POP3/SMTP 服务', value: 'pop3' },
];

/** 厂商字段标签 */
const VENDOR_LABELS: Record<AccountKind, string> = {
  API_KEY: '厂商 / 平台',
  EMAIL: '邮件服务商',
  SMS: '短信服务商',
  TEMP_PHONE: '号码来源',
  PHONE: '运营商',
  CREDIT_CARD: '发卡组织',
};

/** 厂商占位提示 */
const VENDOR_PLACEHOLDERS: Record<AccountKind, string> = {
  API_KEY: '如 hikvision / aliyun / openai',
  EMAIL: '如 qq / 163 / smtp',
  SMS: '如 aliyun / tencent / baidu（或中文厂商名）',
  TEMP_PHONE: '本地目录轮询（可留空）',
  PHONE: '如 移动 / 联通 / 电信（可留空）',
  CREDIT_CARD: '如 Visa / Mastercard / 银联',
};

/** 登录名字段标签 */
const USERNAME_LABELS: Record<AccountKind, string> = {
  API_KEY: 'AccessKey / 账号',
  EMAIL: '邮箱地址',
  SMS: '手机号 / 账号',
  TEMP_PHONE: '手机号',
  PHONE: '手机号',
  CREDIT_CARD: '卡号',
};

/** 登录名占位提示 */
const USERNAME_PLACEHOLDERS: Record<AccountKind, string> = {
  API_KEY: '如 AccessKeyId',
  EMAIL: '如 ops@example.com',
  SMS: '如 13800000000',
  TEMP_PHONE: '领取后由服务端生成',
  PHONE: '如 13800000000',
  CREDIT_CARD: '虚拟卡号，仅测试用途',
};

/** 服务地址字段标签 */
const ENDPOINT_LABELS: Record<AccountKind, string> = {
  API_KEY: 'API 地址',
  EMAIL: 'SMTP / POP 主机',
  SMS: '服务地址',
  TEMP_PHONE: '服务地址',
  PHONE: '服务地址',
  CREDIT_CARD: '对账地址',
};

/** 服务地址占位提示 */
const ENDPOINT_PLACEHOLDERS: Record<AccountKind, string> = {
  API_KEY: '如 https://api.example.com',
  EMAIL: '如 smtp.qq.com',
  SMS: '如 dysms.aliyun.com',
  TEMP_PHONE: '无需填写（本地目录轮询）',
  PHONE: '可留空（本地目录轮询）',
  CREDIT_CARD: '可选，如 https://gateway.example.com',
};

/** 表单模型 */
interface AccountForm {
  name: string;
  code: string;
  kind: AccountKind;
  vendor: string;
  username: string;
  secret: string;
  endpoint: string;
  enabled: boolean;
  defaultAccount: boolean;
  from: string;
  port: number | undefined;
  ssl: boolean;
  imapHost: string;
  imapPort: number | undefined;
  region: string;
  signName: string;
  templateCode: string;
  appId: string;
  webUrl: string;
  /** 密钥来源：inline 直接填写 / ref 引用密钥库（仅短信） */
  keyMode: 'inline' | 'ref';
  /** 引用的密钥标识 */
  secretId: string;
  /** 账号来源：custom 自定义（手动填写）/ temp 临时（系统领取） */
  sourceMode: 'custom' | 'temp';
  /** 用途能力标记（{@code config.capabilities}，空数组表示按种类兜底） */
  capabilities: string[];
  /** 收信接入方式：imap / pop3，二者互斥，对应 config.inboxMode */
  inboxMode: 'imap' | 'pop3';
  /** 收取范围：30d 最近 30 天 / ALL 全部邮件，对应 config.receiveRange */
  receiveRange: '30d' | 'ALL';
  /** 新邮件实时通知，对应 config.notifyNew */
  notifyNew: boolean;
  /** POP3 主机（仅 inboxMode=pop3 时使用），对应 config.pop3Host */
  pop3Host: string;
  /** POP3 端口（仅 inboxMode=pop3 时使用），对应 config.pop3Port */
  pop3Port: number | undefined;
  /** 有效期 MM/yy（仅信用卡，对应 config.cardExpire） */
  cardExpire: string;
  /** 持卡人姓名（仅信用卡，对应 config.holderName） */
  holderName: string;
  /** 持卡人性别（仅信用卡，对应 config.holderGender） */
  holderGender: string;
  /** 持卡人出生日期（仅信用卡，对应 config.holderBirthday） */
  holderBirthday: string;
  /** 持卡人证件号（仅信用卡，对应 config.holderIdNumber） */
  holderIdNumber: string;
  /** 持卡人手机号（仅信用卡，对应 config.holderPhone） */
  holderPhone: string;
  /** 持卡人邮箱（仅信用卡，对应 config.holderEmail） */
  holderEmail: string;
  /** 账单地址（仅信用卡，对应 config.holderAddress） */
  holderAddress: string;
}

/** 空表单 */
function emptyForm(): AccountForm {
  return {
    name: '',
    code: '',
    kind: 'API_KEY',
    vendor: '',
    username: '',
    secret: '',
    endpoint: '',
    enabled: true,
    defaultAccount: false,
    from: '',
    port: 465,
    ssl: true,
    imapHost: '',
    imapPort: undefined,
    region: '',
    signName: '',
    templateCode: '',
    appId: '',
    webUrl: '',
    keyMode: 'inline',
    secretId: '',
    sourceMode: 'custom',
    capabilities: [],
    inboxMode: 'imap',
    receiveRange: '30d',
    notifyNew: false,
    pop3Host: '',
    pop3Port: undefined,
    cardExpire: '',
    holderName: '',
    holderGender: '',
    holderBirthday: '',
    holderIdNumber: '',
    holderPhone: '',
    holderEmail: '',
    holderAddress: '',
  };
}

const formRef = ref<FormInstance>();
const form = reactive<AccountForm>(emptyForm());
const submitting = ref(false);

/** 是否编辑 */
const isEdit = computed(() => Boolean(props.account?.accountId));

/* ---------- 草稿自动保存：未保存内容落 localStorage，刷新 / 误关可恢复 ---------- */

/** 草稿存储键前缀；编辑按账号 id 分键，新增 / 复制共用 new 键 */
const DRAFT_KEY_PREFIX = 'account.form.draft:';

/** 草稿恢复中标记：恢复回填引起的变更不写回草稿 */
let restoringDraft = false;

/** 草稿写入防抖定时器 */
let draftSaveTimer: ReturnType<typeof setTimeout> | null = null;

/** 当前草稿存储键 */
const draftStorageKey = computed(() => `${DRAFT_KEY_PREFIX}${props.account?.accountId || 'new'}`);

// 表单任何变更都防抖落盘；恢复回填与表单关闭期间不写
watch(
  form,
  () => {
    if (restoringDraft || !props.active) return;
    if (draftSaveTimer) clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(() => {
      try {
        localStorage.setItem(draftStorageKey.value, JSON.stringify({ at: Date.now(), values: { ...form } }));
      } catch {
        /* 存储不可用（隐私模式 / 容量满）时静默放弃，不影响表单 */
      }
    }, 600);
  },
  { deep: true },
);

/**
 * 清除当前表单的草稿。
 *
 * <p>保存成功或用户放弃恢复时调用；存储异常不影响主流程。</p>
 */
function clearDraft(): void {
  try {
    localStorage.removeItem(draftStorageKey.value);
  } catch {
    /* 存储不可用时静默 */
  }
}

/**
 * 检测并询问恢复上次未保存的草稿。
 *
 * <p>只在打开表单时执行一次；拒绝恢复则立即清掉草稿，避免「每次打开都问」。
 * 确认恢复后继续自动保存，直到下次保存成功才清除。</p>
 */
async function tryRestoreDraft(): Promise<void> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(draftStorageKey.value);
  } catch {
    return;
  }
  if (!raw) return;
  let values: Record<string, unknown> | null = null;
  let savedAt = '';
  try {
    const parsed = JSON.parse(raw) as { at?: number; values?: Record<string, unknown> };
    values = parsed?.values ?? null;
    savedAt = parsed?.at ? new Date(parsed.at).toLocaleString() : '';
  } catch {
    clearDraft();
    return;
  }
  if (!values) return;
  const confirmed = await confirmThen(
    message.confirm,
    `检测到${savedAt ? ` ${savedAt}` : '上次'}未保存的草稿，是否恢复？不恢复将丢弃该草稿。`,
    '恢复表单草稿',
  );
  if (!confirmed) {
    clearDraft();
    return;
  }
  restoringDraft = true;
  try {
    Object.assign(form, values);
    formRef.value?.clearValidate();
    message.success('已恢复上次未保存的草稿，保存成功后自动清除');
  } finally {
    restoringDraft = false;
  }
}

/** 敏感值占位提示 */
const secretPlaceholder = computed(() =>
  isEdit.value
    ? props.account?.hasSecret
      ? '已配置，留空表示不修改'
      : '尚未配置，可在此补充'
    : 'AccessKey Secret / 邮箱密码 / 短信密钥',
);

/** 敏感值说明 */
const secretHint = computed(() =>
  isEdit.value
    ? '留空或含 **** 表示不修改；填写明文则覆盖原值。'
    : '明文只在保存时提交，读取接口永不回显。',
);

/** 是否引用密钥管理（短信 / API 密钥两类账号可引用） */
const useKeyRef = computed(
  () => (form.kind === 'SMS' || form.kind === 'API_KEY') && form.keyMode === 'ref',
);

/** 密钥类型中文名（多值取第一个，保持下拉行紧凑；与密钥管理页同一套词表） */
function typeLabel(secretType?: string | null): string {
  const map: Record<string, string> = {
    sms: '短信',
    mail: '邮件',
    storage: '对象存储',
    payment: '支付',
    api: '通用 API',
    other: '其他',
  };
  const first = String(secretType || '').split(',')[0].trim().toLowerCase();
  return map[first] ?? '未分类';
}

/** 账号种类 → 可选的密钥类型 */
const SECRET_TYPE_BY_KIND: Record<AccountKind, string> = {
  SMS: 'sms',
  EMAIL: 'mail',
  API_KEY: 'api',
  TEMP_PHONE: 'sms',
  PHONE: 'sms',
  CREDIT_CARD: 'payment',
};

/** 密钥库全量（供 secretOptions 过滤） */
const secretList = ref<SysAccountSecret[]>([]);

/**
 * 密钥库选项：全部可选，同类型排前面。
 *
 * <p>一条密钥可能有多个类型（{@code sms,storage}），命中任一类型即视为同类型；
 * 仍在全量里排序而不是过滤，避免账号种类与密钥类型不匹配时下拉为空。</p>
 */
const secretOptions = computed(() => {
  const expected = SECRET_TYPE_BY_KIND[form.kind];
  const tokensOf = (item: SysAccountSecret) =>
    String(item.secretType || '')
      .split(',')
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean);
  const score = (item: SysAccountSecret) => {
    const tokens = tokensOf(item);
    if (!tokens.length) return 1;
    return tokens.includes(expected) ? 0 : 2;
  };
  return [...secretList.value].sort((a, b) => score(a) - score(b));
});

/** 按 secretId 取密钥库里的那一条（输入框里显示 logo 与名称用） */
function pickedSecret(secretId?: string | null): SysAccountSecret | undefined {
  if (!secretId) return undefined;
  return secretList.value.find((item) => item.secretId === secretId);
}

/**
 * 加载密钥库选项。
 *
 * <p>失败时留空即可，不阻塞账号表单：没有密钥库的部署仍可手工填密钥。</p>
 */
async function loadSecretOptions(): Promise<void> {
  try {
    secretList.value = await listAccountSecrets();
  } catch {
    secretList.value = [];
  }
}

/** 手机号格式：11 位、1 开头、第二位 3-9 */
const PHONE_FORMAT_RE = /^1[3-9]\d{9}$/;

/** 邮箱格式：常规 user@domain.tld */
const EMAIL_FORMAT_RE = /^[\w.+-]+@[\w-]+(\.[\w-]+)+$/;

/**
 * 服务地址格式：http(s) URL、纯主机名或 IPv4 地址。
 *
 * <p>邮箱的 SMTP/POP 主机（smtp.qq.com）与短信服务地址（dysms.aliyun.com）
 * 通常不带协议，API 地址通常带 http(s)；内网部署填 IP（192.168.1.10）也很常见，
 * 三者都放行。只拦空格、缺域名/主机这类明显错误。</p>
 */
const ENDPOINT_FORMAT_RE =
  /^(https?:\/\/)?(([\w-]+\.)+[A-Za-z]{2,}|localhost|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?(\/\S*)?$/i;

/** 主机名格式：收发信主机不允许带路径，域名 / localhost / IPv4 均可 */
const HOST_FORMAT_RE = /^(([\w-]+\.)+[A-Za-z]{2,}|localhost|(\d{1,3}\.){3}\d{1,3})(:\d{1,5})?$/i;

/** 端口校验规则：1-65535 的整数（留空放行，是否必填由后端判） */
function portFormatRule(): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      if (value == null || value === '') return callback();
      const port = Number(value);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        return callback(new Error('端口需为 1-65535 之间的整数'));
      }
      callback();
    },
    trigger: 'blur',
  };
}

/** 主机名校验规则：收发信主机不带路径（留空放行） */
function hostFormatRule(): FormItemRule {
  return {
    validator: (_rule, value, callback) => {
      const text = String(value ?? '').trim();
      if (!text) return callback();
      const host = text.replace(/^https?:\/\//i, '');
      if (HOST_FORMAT_RE.test(host)) return callback();
      callback(new Error('主机名格式不正确，如 imap.qq.com（不带路径）'));
    },
    trigger: 'blur',
  };
}

/**
 * 表单校验规则。
 *
 * <p>必填项与后端契约一致（名称 / 编码 / 种类）；格式规则只拦「填了但填错」的字段，
 * 空值一律放行——是否必填、是否判重由后端最终裁决，前端只做即时反馈。</p>
 */
const rules: FormRules = {
  name: [{ required: true, message: '请输入账号名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入账号编码', trigger: 'blur' }],
  kind: [{ required: true, message: '请选择账号种类', trigger: 'change' }],
  username: [
    {
      validator: (_rule, value, callback) => {
        const text = String(value ?? '').trim();
        if (!text) return callback();
        if (form.kind === 'EMAIL' && !EMAIL_FORMAT_RE.test(text)) {
          return callback(new Error('邮箱地址格式不正确，如 ops@example.com'));
        }
        if ((form.kind === 'PHONE' || form.kind === 'TEMP_PHONE') && !PHONE_FORMAT_RE.test(text)) {
          return callback(new Error('手机号需为 11 位、1 开头的有效号码'));
        }
        callback();
      },
      trigger: 'blur',
    },
  ],
  endpoint: [
    {
      validator: (_rule, value, callback) => {
        const text = String(value ?? '').trim();
        if (!text || ENDPOINT_FORMAT_RE.test(text)) return callback();
        callback(new Error('请填写合法的服务地址（如 https://api.example.com 或 smtp.qq.com）'));
      },
      trigger: 'blur',
    },
  ],
  port: [portFormatRule()],
  imapPort: [portFormatRule()],
  pop3Port: [portFormatRule()],
  from: [
    {
      validator: (_rule, value, callback) => {
        const text = String(value ?? '').trim();
        if (!text || form.kind !== 'EMAIL' || EMAIL_FORMAT_RE.test(text)) return callback();
        callback(new Error('发件人邮箱格式不正确，如 noreply@example.com'));
      },
      trigger: 'blur',
    },
  ],
  imapHost: [hostFormatRule()],
  pop3Host: [hostFormatRule()],
  webUrl: [
    {
      validator: (_rule, value, callback) => {
        const text = String(value ?? '').trim();
        if (!text || ENDPOINT_FORMAT_RE.test(text)) return callback();
        callback(new Error('控制台地址需为合法链接（如 https://mail.example.com）'));
      },
      trigger: 'blur',
    },
  ],
};

/**
 * 从配置 JSON 读字符串。
 *
 * @param config 配置
 * @param key    键
 * @returns 字符串值；不存在返回空串
 */
function readString(config: Record<string, unknown> | null | undefined, key: string): string {
  const value = config?.[key];
  return value == null ? '' : String(value);
}

/** 读取接入方式：缺失或非 pop3 时统一视为 imap */
function readInboxMode(config: Record<string, unknown> | null | undefined): 'imap' | 'pop3' {
  const value = config?.inboxMode;
  return value == null || String(value) !== 'pop3' ? 'imap' : 'pop3';
}

/** 读取收取范围：缺失或非 ALL 时统一视为 30d */
function readReceiveRange(config: Record<string, unknown> | null | undefined): '30d' | 'ALL' {
  const value = config?.receiveRange;
  return value != null && String(value) === 'ALL' ? 'ALL' : '30d';
}

/** 用账号数据回填表单（新增时重置为空表单；有复制来源时按来源预填） */
function fillForm(): void {
  const source = props.account ?? props.draft ?? null;
  Object.assign(form, emptyForm());
  if (!source) {
    return;
  }
  const config = source.config || {};
  form.name = props.account ? source.name || '' : copyName(source.name || source.code || '');
  form.code = props.account ? source.code || '' : copyCode(source.code || '');
  form.kind = source.kind || 'API_KEY';
  form.vendor = source.vendor || '';
  form.username = source.username || '';
  form.endpoint = source.endpoint || '';
  form.enabled = source.status !== 0;
  // 复制出来的是新账号，默认标记必须显式再设，否则会顶掉原账号的默认位
  form.defaultAccount = props.account ? Boolean(source.defaultAccount) : false;
  form.secret = '';
  form.from = readString(config, 'from');
  form.region = readString(config, 'region');
  form.signName = readString(config, 'signName');
  form.templateCode = readString(config, 'templateCode');
  form.appId = readString(config, 'appId');
  form.webUrl = readString(config, 'webUrl');
  form.secretId = readString(config, 'secretId');
  form.keyMode = form.secretId ? 'ref' : 'inline';
  form.sourceMode = isTempMail(source) ? 'temp' : 'custom';
  // 只读显式标记：空数组交给左栏按种类兜底，不把默认值写进账号
  form.capabilities = readCapabilityKeys(config);
  const port = Number(config.port);
  form.port = Number.isFinite(port) && port > 0 ? port : 465;
  form.ssl = config.ssl == null ? true : Boolean(config.ssl);
  form.imapHost = readString(config, 'imapHost');
  const imapPort = Number(config.imapPort);
  form.imapPort = Number.isFinite(imapPort) && imapPort > 0 ? imapPort : undefined;
  form.inboxMode = readInboxMode(config);
  form.receiveRange = readReceiveRange(config);
  form.notifyNew = config.notifyNew == null ? false : Boolean(config.notifyNew);
  form.pop3Host = readString(config, 'pop3Host');
  const pop3Port = Number(config.pop3Port);
  form.pop3Port = Number.isFinite(pop3Port) && pop3Port > 0 ? pop3Port : undefined;
  form.cardExpire = readString(config, 'cardExpire');
  form.holderName = readString(config, 'holderName');
  form.holderGender = readString(config, 'holderGender');
  form.holderBirthday = readString(config, 'holderBirthday');
  form.holderIdNumber = readString(config, 'holderIdNumber');
  form.holderPhone = readString(config, 'holderPhone');
  form.holderEmail = readString(config, 'holderEmail');
  form.holderAddress = readString(config, 'holderAddress');
}

/**
 * 复制来源的账号编码加后缀，避免撞唯一键。
 *
 * @param code 原编码
 * @returns 新编码（原编码为空时留空让用户填）
 */
function copyCode(code: string): string {
  return code ? `${code}-copy` : '';
}

/**
 * 复制来源的账号名称加后缀。
 *
 * @param name 原名称
 * @returns 新名称
 */
function copyName(name: string): string {
  return name ? `${name}（副本）` : '';
}

/** 切换种类：把不适用的专属字段清掉，避免串到另一种账号上 */
function onKindChange(): void {
  form.sourceMode = 'custom';
  if (form.kind !== 'EMAIL') {
    form.from = '';
  }
  // 手机号两类没有凭据入口：切过来时清掉残留，避免把上一类的密钥带进提交体
  if (form.kind === 'TEMP_PHONE' || form.kind === 'PHONE') {
    form.secret = '';
    form.keyMode = 'inline';
    form.secretId = '';
  }
  if (form.kind === 'EMAIL') {
    form.signName = '';
    form.templateCode = '';
    form.appId = '';
    form.keyMode = 'inline';
    form.secretId = '';
  }
  if (form.kind !== 'API_KEY') {
    form.region = '';
  }
  if (form.kind !== 'EMAIL') {
    form.inboxMode = 'imap';
    form.receiveRange = '30d';
    form.notifyNew = false;
    form.pop3Host = '';
    form.pop3Port = undefined;
  }
  if (form.kind !== 'CREDIT_CARD') {
    form.cardExpire = '';
    form.holderName = '';
    form.holderGender = '';
    form.holderBirthday = '';
    form.holderIdNumber = '';
    form.holderPhone = '';
    form.holderEmail = '';
    form.holderAddress = '';
  }
}

/** 常用邮箱服务商预置：发信 SMTP + 收信 IMAP / POP3 主机端口（均按 SSL 口径） */
interface EmailPreset {
  key: string;
  label: string;
  smtp: string;
  smtpPort: number;
  imap: string;
  imapPort: number;
  pop3: string;
  pop3Port: number;
}

const EMAIL_PRESETS: EmailPreset[] = [
  {
    key: '163',
    label: '163 邮箱',
    smtp: 'smtp.163.com',
    smtpPort: 465,
    imap: 'imap.163.com',
    imapPort: 993,
    pop3: 'pop.163.com',
    pop3Port: 995,
  },
  {
    key: 'qq',
    label: 'QQ 邮箱',
    smtp: 'smtp.qq.com',
    smtpPort: 465,
    imap: 'imap.qq.com',
    imapPort: 993,
    pop3: 'pop.qq.com',
    pop3Port: 995,
  },
  {
    key: 'gmail',
    label: 'Gmail',
    smtp: 'smtp.gmail.com',
    smtpPort: 465,
    imap: 'imap.gmail.com',
    imapPort: 993,
    pop3: 'pop.gmail.com',
    pop3Port: 995,
  },
  {
    key: 'outlook',
    label: 'Outlook',
    smtp: 'smtp.office365.com',
    smtpPort: 587,
    imap: 'outlook.office365.com',
    imapPort: 993,
    pop3: 'pop-mail.outlook.com',
    pop3Port: 995,
  },
];

/**
 * 应用常用邮箱服务商预置。
 *
 * <p>按当前接入方式只写对应的收信主机端口；发信主机/端口/SSL 始终统一写入，
 * 避免用户还要再手填一次 SMTP。</p>
 *
 * @param preset 服务商预置
 */
function applyEmailPreset(preset: EmailPreset): void {
  if (form.inboxMode === 'pop3') {
    form.pop3Host = preset.pop3;
    form.pop3Port = preset.pop3Port;
  } else {
    form.imapHost = preset.imap;
    form.imapPort = preset.imapPort;
  }
  form.endpoint = preset.smtp;
  form.port = preset.smtpPort;
  form.ssl = true;
  const inbox =
    form.inboxMode === 'pop3' ? `${preset.pop3}:${preset.pop3Port}` : `${preset.imap}:${preset.imapPort}`;
  message.success(`已应用 ${preset.label} 预置：SMTP ${preset.smtp}:${preset.smtpPort}，收信 ${inbox}`);
}

/**
 * 组装提交体：保留后端已有但本表单未展示的扩展配置。
 *
 * @returns 提交体
 */
function buildPayload(): SysAccount {
  const account = props.account;
  const source = account ?? props.draft ?? null;
  const config: Record<string, unknown> = { ...(source?.config || {}) };
  const setOrDelete = (key: string, value: unknown) => {
    if (value === '' || value === undefined || value === null) {
      delete config[key];
    } else {
      config[key] = value;
    }
  };
  setOrDelete('from', form.kind === 'EMAIL' ? form.from.trim() : '');
  setOrDelete('port', form.kind === 'EMAIL' ? form.port : undefined);
  if (form.kind === 'EMAIL') {
    config.ssl = form.ssl;
    const imapHost = form.imapHost.trim();
    if (imapHost) {
      config.imapHost = imapHost;
    } else {
      delete config.imapHost;
    }
    if (form.imapPort) {
      config.imapPort = form.imapPort;
    } else {
      delete config.imapPort;
    }
    // 接入方式 / 收取范围 / 通知：对全部 EMAIL 账号写入 config
    config.inboxMode = form.inboxMode;
    config.receiveRange = form.receiveRange;
    config.notifyNew = form.notifyNew;
    // POP3 主机端口：仅 POP3 模式下保留，IMAP 模式下清理
    if (form.inboxMode === 'pop3') {
      const pop3Host = form.pop3Host.trim();
      if (pop3Host) {
        config.pop3Host = pop3Host;
      } else {
        delete config.pop3Host;
      }
      if (form.pop3Port) {
        config.pop3Port = form.pop3Port;
      } else {
        delete config.pop3Port;
      }
    } else {
      delete config.pop3Host;
      delete config.pop3Port;
    }
  } else {
    delete config.ssl;
    delete config.imapHost;
    delete config.imapPort;
    delete config.inboxMode;
    delete config.receiveRange;
    delete config.notifyNew;
    delete config.pop3Host;
    delete config.pop3Port;
  }
  setOrDelete('region', form.kind === 'API_KEY' ? form.region.trim() : '');
  setOrDelete('signName', form.kind === 'SMS' ? form.signName.trim() : '');
  setOrDelete('templateCode', form.kind === 'SMS' ? form.templateCode.trim() : '');
  setOrDelete('appId', form.kind === 'SMS' ? form.appId.trim() : '');
  setOrDelete('secretId', useKeyRef.value ? form.secretId : '');
  setOrDelete('webUrl', form.webUrl.trim());
  setOrDelete('capabilities', form.capabilities.length ? [...form.capabilities] : '');
  // 信用卡持卡人画像：随表单写入 config；其它种类清理残留，避免串类型
  if (form.kind === 'CREDIT_CARD') {
    setOrDelete('cardExpire', form.cardExpire.trim());
    setOrDelete('holderName', form.holderName.trim());
    setOrDelete('holderGender', form.holderGender.trim());
    setOrDelete('holderBirthday', form.holderBirthday.trim());
    setOrDelete('holderIdNumber', form.holderIdNumber.trim());
    setOrDelete('holderPhone', form.holderPhone.trim());
    setOrDelete('holderEmail', form.holderEmail.trim());
    setOrDelete('holderAddress', form.holderAddress.trim());
  } else {
    delete config.cardExpire;
    delete config.holderName;
    delete config.holderGender;
    delete config.holderBirthday;
    delete config.holderIdNumber;
    delete config.holderPhone;
    delete config.holderEmail;
    delete config.holderAddress;
  }

  const payload: SysAccount = {
    accountId: account?.accountId || '',
    name: form.name.trim(),
    code: form.code.trim(),
    kind: form.kind,
    // 厂商允许清空：传空串（而不是 undefined）让后端能区分「没改」与「清空」
    vendor: form.vendor.trim(),
    username: form.username.trim() || undefined,
    endpoint: form.endpoint.trim() || undefined,
    config,
    status: form.enabled ? 1 : 0,
    defaultAccount: form.defaultAccount,
  };
  const secret = form.secret.trim();
  if (secret && !useKeyRef.value) {
    payload.secret = secret;
  }
  return payload;
}

/** 临时邮箱领取中 */
const tempBusy = ref(false);

/**
 * 领取临时邮箱（真实接口）。
 *
 * <p>临时邮箱由服务端在 mail.tm 上创建（地址 / 密码 / 租期都由服务端生成），
 * 领取即完成入库，因此不再走表单提交：拿到账号后直接通知宿主刷新并收起表单。</p>
 */
async function claimTemp(): Promise<void> {
  if (tempBusy.value) return;
  tempBusy.value = true;
  try {
    const saved = await claimTempMailbox();
    message.success(`已领取临时邮箱：${saved.username || ''}`);
    emit('saved', saved);
  } catch (e: any) {
    message.error(e?.message || '领取临时邮箱失败');
  } finally {
    tempBusy.value = false;
  }
}

/**
 * 领取临时手机号（真实接口）。
 *
 * <p>号码与租期由服务端生成，领取即完成入库，不走表单提交；
 * 号码只收短信（后端目录轮询 → SSE 推送到收信箱），不能发送。</p>
 */
async function claimPhone(): Promise<void> {
  if (tempBusy.value) return;
  tempBusy.value = true;
  try {
    const saved = await claimTempPhone();
    message.success(`已领取临时手机号：${saved.username || ''}`);
    emit('saved', saved);
  } catch (e: any) {
    message.error(e?.message || '领取临时手机号失败');
  } finally {
    tempBusy.value = false;
  }
}

/** 测试数据生成中标记 */
const mockBusy = ref(false);

/** 是否已持有卡人画像（生成后或编辑回填时展示画像字段） */
const hasHolderProfile = computed(() =>
  Boolean(
    form.holderName || form.holderIdNumber || form.holderPhone || form.holderEmail || form.cardExpire
  )
);

/**
 * 随机生成信用卡测试数据。
 *
 * <p>调用后端 mock 草稿接口，一次生成卡号、发卡组织、CVV、有效期与
 * 持卡人画像并回填表单；数据仅测试用途，不代表真实卡片。</p>
 */
async function generateMockDraft(): Promise<void> {
  if (mockBusy.value) return;
  mockBusy.value = true;
  try {
    const draft = await getAccountMockDraft('CREDIT_CARD');
    if (draft.username) {
      form.username = draft.username;
    }
    if (draft.vendor) {
      form.vendor = draft.vendor;
    }
    if (draft.secret) {
      form.secret = draft.secret;
    }
    const cfg = draft.config || {};
    form.cardExpire = readString(cfg, 'cardExpire');
    form.holderName = readString(cfg, 'holderName');
    form.holderGender = readString(cfg, 'holderGender');
    form.holderBirthday = readString(cfg, 'holderBirthday');
    form.holderIdNumber = readString(cfg, 'holderIdNumber');
    form.holderPhone = readString(cfg, 'holderPhone');
    form.holderEmail = readString(cfg, 'holderEmail');
    form.holderAddress = readString(cfg, 'holderAddress');
    message.success('已生成随机测试数据（仅测试用途，不代表真实卡片）');
  } catch (e: any) {
    message.error(e?.message || '生成测试数据失败');
  } finally {
    mockBusy.value = false;
  }
}

/** 提交保存 */
async function submit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    // 校验失败：定位到第一个错误项所在的分区并高亮，长表单不必手动翻找错在哪
    await nextTick();
    const host = formRef.value?.$el as HTMLElement | undefined;
    const firstError = host?.querySelector<HTMLElement>('.el-form-item.is-error');
    if (firstError && host) {
      locateErrorSection(host, firstError);
      firstError
        .querySelector<HTMLElement>('input, textarea, .el-select__wrapper, .el-input-number, .el-segmented')
        ?.focus({ preventScroll: true });
    }
    return;
  }
  submitting.value = true;
  try {
    const payload = buildPayload();
    const saved = isEdit.value
      ? await updateAccount(props.account!.accountId, payload)
      : await createAccount(payload);
    message.success(isEdit.value ? '账号已更新' : '账号已创建');
    clearDraft();
    emit('saved', saved);
  } catch (e: any) {
    message.error(e?.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

/**
 * 把第一个校验错误定位到它所在的分区：左侧导航立即高亮该分区，
 * 分区标题滚进可视区并闪烁一次，视线直接落到出错分区。
 *
 * <p>分区标题与字段是兄弟节点（标题不是字段的祖先，{@code closest} 找不到），
 * 所以按文档顺序取「最后一个在错误项之前的 data-section」；找不到时退回
 * 按错误项本身滚动。</p>
 *
 * @param host 表单根元素
 * @param firstError 第一个含错的表单项
 */
function locateErrorSection(host: HTMLElement, firstError: HTMLElement): void {
  const sections = Array.from(host.querySelectorAll<HTMLElement>('[data-section]'));
  let target: HTMLElement | null = null;
  for (const node of sections) {
    if (node.compareDocumentPosition(firstError) & Node.DOCUMENT_POSITION_FOLLOWING) {
      target = node;
    } else {
      break;
    }
  }
  if (!target) {
    firstError.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return;
  }
  const key = target.dataset.section;
  if (key) activeSection.value = key;
  target.scrollIntoView({ block: 'start', behavior: 'smooth' });
  // 闪烁一次：remove + reflow + add，连续提交失败也能重新触发动画
  target.classList.remove('is-flash');
  void target.offsetWidth;
  target.classList.add('is-flash');
}

/**
 * 滚动到某个分区（常驻表单左侧分区导航用）。
 *
 * @param section 分区标识
 */
function scrollToSection(section: string): void {
  const host = formRef.value?.$el as HTMLElement | undefined;
  host?.querySelector(`[data-section="${section}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
}

defineExpose({ submit, scrollToSection });

/* ---------- 分区导航滚动联动：滚动到哪个分区，左侧导航就高亮哪个 ---------- */

/** 表单分区（与模板 data-section 一一对应） */
const FORM_SECTIONS = [
  { key: 'basic', label: '基础信息' },
  { key: 'extra', label: '专属配置' },
  { key: 'advanced', label: '高级配置' },
  { key: 'capability', label: '用途能力' },
  { key: 'status', label: '状态归属' },
];

/** 当前滚动到的分区 */
const activeSection = ref<string>('basic');

/** 表单滚动容器（弹窗 body / 分屏宿主中最近的纵向可滚祖先） */
let scrollHost: HTMLElement | null = null;

/** scroll-spy 帧句柄：滚动高频触发，用 rAF 合并计算 */
let spyRafId = 0;

/** 向上找最近的纵向可滚祖先；找不到返回 null（不启用联动，导航仍可点击） */
function resolveScrollHost(): HTMLElement | null {
  let el = (formRef.value?.$el as HTMLElement | undefined)?.parentElement ?? null;
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 4) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

/** 按当前滚动位置更新激活分区：取视口顶部已越过的最后一个分区标题 */
function updateActiveSection(): void {
  const host = formRef.value?.$el as HTMLElement | undefined;
  if (!host || !scrollHost) return;
  const hostTop = scrollHost.getBoundingClientRect().top;
  let current: string = FORM_SECTIONS[0].key;
  for (const section of FORM_SECTIONS) {
    const node = host.querySelector(`[data-section="${section.key}"]`);
    if (node && node.getBoundingClientRect().top - hostTop <= 88) current = section.key;
  }
  activeSection.value = current;
}

/** 滚动节流：一帧最多算一次 */
function onHostScroll(): void {
  if (spyRafId) return;
  spyRafId = requestAnimationFrame(() => {
    spyRafId = 0;
    updateActiveSection();
  });
}

/**
 * Ctrl / ⌘ + S 保存：表单打开时拦截浏览器「保存网页」，转交表单提交。
 *
 * @param event 键盘事件
 */
function onFormKeydown(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;
  if (!props.active || submitting.value) return;
  event.preventDefault();
  void submit();
}

onMounted(() => {
  scrollHost = resolveScrollHost();
  scrollHost?.addEventListener('scroll', onHostScroll, { passive: true });
  updateActiveSection();
  window.addEventListener('keydown', onFormKeydown);
});

onBeforeUnmount(() => {
  scrollHost?.removeEventListener('scroll', onHostScroll);
  scrollHost = null;
  if (spyRafId) cancelAnimationFrame(spyRafId);
  spyRafId = 0;
  window.removeEventListener('keydown', onFormKeydown);
  if (draftSaveTimer) {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = null;
  }
});

watch(
  () => [props.active, props.account, props.draft] as const,
  ([active]) => {
    if (active === false) return;
    fillForm();
    void tryRestoreDraft();
    void loadSecretOptions();
    formRef.value?.clearValidate();
  },
  { immediate: true },
);
</script>

<style scoped>
/* 分屏壳：左侧分区导航 + 右侧表单体 */
.form-shell {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.form-shell > .account-form {
  flex: 1;
  min-width: 0;
}
/* 左侧分区导航：sticky 常驻，滚动到哪高亮哪（scroll-spy） */
.form-nav {
  flex: none;
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 86px;
  padding: 4px 0;
}
.form-nav-item {
  padding: 4px 8px;
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  font: inherit;
  font-size: 12px;
  line-height: 1.5;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s var(--ease-out, ease), color 0.15s var(--ease-out, ease);
}
.form-nav-item:hover {
  background: var(--bg-fill);
  color: var(--text-primary);
}
.form-nav-item.is-on {
  background: var(--el-color-primary-light-9, #eef5ff);
  color: var(--el-color-primary, #1877ff);
  font-weight: 600;
}
/* 校验失败定位：出错分区标题闪烁一次，把视线引过去（动画结束自动回落本色） */
.form-section.is-flash {
  animation: form-section-flash 1.4s var(--ease-out, ease);
}
@keyframes form-section-flash {
  0%,
  55% {
    color: var(--el-color-danger, #f56c6c);
    border-left-color: var(--el-color-danger, #f56c6c);
  }
}
.account-form {
  padding: 4px 8px 0;
}
.form-section {
  margin: 6px 0 14px;
  padding-left: 10px;
  border-left: 3px solid var(--el-color-primary);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  scroll-margin-top: 8px;
}
.field-hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-tertiary);
}
/* 常用邮箱预置 chips：点一下填入该服务商的发信地址与收发端口 */
.preset-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.preset-chip {
  padding: 2px 12px;
  border: 1px solid var(--el-color-primary-light-5, #94c4ff);
  border-radius: 999px;
  background: var(--el-color-primary-light-9, #eef5ff);
  color: var(--el-color-primary, #1877ff);
  font: inherit;
  font-size: 12px;
  line-height: 1.6;
  cursor: pointer;
  transition: border-color 0.15s var(--ease-out, ease), background 0.15s var(--ease-out, ease);
}
.preset-chip:hover {
  border-color: var(--el-color-primary, #1877ff);
  background: var(--el-color-primary-light-8, #dbe9ff);
}
.hint-block {
  margin: -4px 0 10px 8px;
}
.owner-hint {
  font-size: 12px;
  color: var(--text-secondary);
}
.w-full {
  width: 100%;
}

/* 能力标记：一排水滴形胶囊，靠间距而不是连体边框区分（koi 里没有连体按钮组） */
.cap-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.cap-group :deep(.el-checkbox-button__inner) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  color: var(--text-secondary);
  font-size: 12px;
  box-shadow: none;
  transition: background 0.15s var(--ease-out, ease), border-color 0.15s var(--ease-out, ease), color 0.15s var(--ease-out, ease);
}
.cap-group :deep(.el-checkbox-button__inner:hover) {
  border-color: var(--el-color-primary-light-5);
  color: var(--text-primary);
}
.cap-group :deep(.el-checkbox-button.is-checked .el-checkbox-button__inner) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 底部保存条：常驻表单与弹窗共用 */
.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 6px;
  padding: 12px 0 4px;
  border-top: 1px solid var(--border-subtle);
}

/* 密钥下拉：厂商 logo + 名称 + 类型/厂商说明 */
.opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 输入框里已选中的一项：logo + 名称，超长省略 */
.opt--picked {
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.opt__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.opt__meta {
  margin-left: auto;
  padding-left: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
