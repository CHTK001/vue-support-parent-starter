<template>
  <section class="payment-page merchant-page">
    <header class="payment-surface">
      <div>
        <h1 class="payment-surface__title">商户管理</h1>
        <p class="payment-surface__desc">维护商户主体、统一回调、支付方式与订单规则。</p>
      </div>
      <div class="payment-surface__actions">
        <el-tooltip content="刷新">
          <el-button circle :icon="RefreshRight" @click="refreshAll" />
        </el-tooltip>
        <el-tooltip content="新增商户">
          <el-button circle type="primary" :icon="Plus" @click="openMerchantDialog()" />
        </el-tooltip>
      </div>
    </header>

    <section class="payment-stat-grid">
      <article class="payment-stat">
        <span class="payment-stat__label">商户总数</span>
        <strong class="payment-stat__value">{{ stats.total }}</strong>
        <span class="payment-stat__hint">支付台内已录入的商户主体总量。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">激活商户</span>
        <strong class="payment-stat__value">{{ stats.active }}</strong>
        <span class="payment-stat__hint">当前可继续配置支付渠道和订单规则的商户。</span>
      </article>
      <article class="payment-stat">
        <span class="payment-stat__label">已配支付方式</span>
        <strong class="payment-stat__value">{{ stats.configured }}</strong>
        <span class="payment-stat__hint">至少存在一个支付方式的商户数量。</span>
      </article>
    </section>

    <section class="payment-toolbar">
      <div class="payment-toolbar__row">
        <div class="payment-toolbar__form">
          <el-input v-model="queryForm.merchantName" clearable placeholder="商户名称" style="width: 220px" @keyup.enter="handleSearch" />
          <el-select v-model="queryForm.status" clearable placeholder="状态" style="width: 180px">
            <el-option label="待审核" :value="0" />
            <el-option label="已激活" :value="1" />
            <el-option label="已停用" :value="2" />
            <el-option label="已注销" :value="3" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </section>

    <section class="payment-panel">
      <div class="payment-panel__head">
        <div>
          <h2 class="payment-panel__title">商户主表</h2>
          <p class="payment-panel__desc">统一查看商户主体、回调地址、支付方式数量与启停状态。</p>
        </div>
      </div>

      <ScTable
        ref="tableRef"
        table-name="payment-merchant-table"
        row-key="id"
        border
        stripe
        :search="false"
        :hide-refresh="true"
        :hide-do="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchMerchantTable"
      >
        <el-table-column label="商户" min-width="220">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.merchantName }}</strong>
              <span>{{ row.merchantNo || `M-${row.id}` }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="联系人" min-width="200">
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.contactName || "-" }}</strong>
              <span>{{ row.contactPhone || row.contactEmail || "未填写联系方式" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="默认回调" min-width="260" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="cell-main">
              <strong>{{ row.defaultNotifyUrl || "未配置统一结果回调" }}</strong>
              <span>{{ row.defaultReturnUrl || "未配置浏览器回跳地址" }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="业务能力" min-width="220">
          <template #default="{ row }">
            <div class="capability-list">
              <el-tag :type="row.paymentWalletEnabled ? 'success' : 'info'" effect="plain">钱包 {{ row.paymentWalletEnabled ? "开启" : "关闭" }}</el-tag>
              <el-tag :type="row.paymentAutoCloseEnabled ? 'warning' : 'info'" effect="plain">自动关单 {{ row.paymentAutoCloseEnabled ? `${row.paymentAutoCloseMinutes || 30} 分钟` : "关闭" }}</el-tag>
              <el-tag :type="row.paymentSplitTableEnabled ? 'primary' : 'info'" effect="plain">自动分表 {{ row.paymentSplitTableEnabled ? "开启" : "关闭" }}</el-tag>
              <el-tag :type="row.paymentProfitSharingEnabled ? 'success' : 'info'" effect="plain">自动分账 {{ row.paymentProfitSharingEnabled ? "开启" : "关闭" }}</el-tag>
              <el-tag :type="row.paymentCouponEnabled ? 'warning' : 'info'" effect="plain">优惠功能 {{ row.paymentCouponEnabled ? "开启" : "关闭" }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="120" align="center">
          <template #default="{ row }">
            <strong>{{ row.channelCount || 0 }}</strong>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="merchantStatusTag(row.status)" effect="plain">
              {{ row.statusDesc || MerchantStatusMap[row.status] || "-" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <div class="payment-icon-actions">
              <el-tooltip content="编辑商户">
                <el-button circle :icon="Edit" @click="openMerchantDialog(row)" />
              </el-tooltip>
              <el-tooltip content="支付方式">
                <el-button circle :icon="CreditCard" @click="openChannelDrawer(row)" />
              </el-tooltip>
              <el-tooltip content="商户设置">
                <el-button circle :icon="Setting" @click="openSettingDrawer(row)" />
              </el-tooltip>
              <el-tooltip :content="row.status === 1 ? '停用商户' : '激活商户'">
                <el-button circle :type="row.status === 1 ? 'warning' : 'success'" :icon="row.status === 1 ? SwitchButton : CircleCheck" @click="toggleMerchantStatus(row)" />
              </el-tooltip>
              <el-tooltip content="删除商户">
                <el-button circle type="danger" :icon="Delete" @click="removeMerchant(row)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
      </ScTable>
    </section>

    <el-dialog v-model="merchantDialogVisible" :title="merchantForm.id ? '编辑商户' : '新增商户'" width="900px" destroy-on-close>
      <div class="payment-dialog-shell">
        <div class="payment-status-strip">
          <div class="payment-status-card">
            <span class="payment-status-card__label">商户主体</span>
            <strong class="payment-status-card__value">{{ merchantForm.merchantName || "待填写" }}</strong>
            <span class="payment-status-card__hint">建议使用业务侧可识别的主体名称。</span>
          </div>
          <div class="payment-status-card">
            <span class="payment-status-card__label">统一结果回调</span>
            <strong class="payment-status-card__value">{{ merchantForm.defaultNotifyUrl || "未配置" }}</strong>
            <span class="payment-status-card__hint">支付、转账、退款默认共用。</span>
          </div>
          <div class="payment-status-card">
            <span class="payment-status-card__label">浏览器回跳</span>
            <strong class="payment-status-card__value">{{ merchantForm.defaultReturnUrl || "未配置" }}</strong>
            <span class="payment-status-card__hint">H5 / 收银台支付成功后的前端回跳地址。</span>
          </div>
        </div>

        <section class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>基础信息</h3>
              <p>先完成主体信息和商户级默认回调，再根据渠道逐项覆盖。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item label="商户名称" required>
                <el-input v-model="merchantForm.merchantName" placeholder="例如：演示商城" />
              </el-form-item>
              <el-form-item label="联系人">
                <el-input v-model="merchantForm.contactName" placeholder="例如：张三" />
              </el-form-item>
              <el-form-item label="联系电话">
                <el-input v-model="merchantForm.contactPhone" placeholder="例如：13800000000" />
              </el-form-item>
              <el-form-item label="联系邮箱">
                <el-input v-model="merchantForm.contactEmail" placeholder="例如：merchant@example.com" />
              </el-form-item>
              <el-form-item label="营业执照">
                <el-input v-model="merchantForm.businessLicense" placeholder="可选" />
              </el-form-item>
              <el-form-item label="法人">
                <el-input v-model="merchantForm.legalPerson" placeholder="可选" />
              </el-form-item>
              <el-form-item label="统一结果回调" class="payment-form-span-2">
                <el-input v-model="merchantForm.defaultNotifyUrl" placeholder="支付、转账、退款默认共用；渠道级 notifyUrl 可覆盖" />
                <div class="payment-helper">支付、转账、退款默认共用；若某个支付方式单独配置了结果回调，则以支付方式自身配置为准。</div>
              </el-form-item>
              <el-form-item label="支付完成回跳" class="payment-form-span-2">
                <el-input v-model="merchantForm.defaultReturnUrl" placeholder="浏览器/H5/收银台支付完成后前端回跳地址" />
                <div class="payment-helper">仅用于浏览器可见的支付场景，接口调用类支付一般不需要填写。</div>
              </el-form-item>
              <el-form-item label="备注" class="payment-form-span-2">
                <el-input v-model="merchantForm.remark" type="textarea" :rows="3" placeholder="记录商户接入说明、负责人和运维备注" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>商户能力</h3>
              <p>采用卡片模式直接切换，避免在长表单里来回找开关。</p>
            </div>
          </div>
          <div class="capability-card-grid">
            <button v-for="item in buildMerchantCapabilityCards(merchantForm)" :key="item.key" type="button" class="capability-card-hit" @click="toggleMerchantCapability(merchantForm, item.key)">
              <ScCard layout="compact" hoverable :active="item.active" :title="item.title" :subtitle="item.subtitle" :icon="item.icon" :theme="item.theme" class="capability-card">
                <div class="capability-card__meta">
                  <span>{{ item.description }}</span>
                  <el-tag :type="item.tagType" effect="plain">{{ item.active ? "已开启" : "已关闭" }}</el-tag>
                </div>
              </ScCard>
            </button>
          </div>
          <el-form label-width="112px">
            <el-form-item label="自动关单分钟">
              <el-input-number v-model="merchantForm.paymentAutoCloseMinutes" :min="1" :max="1440" :disabled="!merchantForm.paymentAutoCloseEnabled" />
            </el-form-item>
          </el-form>
        </section>
      </div>

      <template #footer>
        <div class="payment-dialog-footer">
          <el-button @click="merchantDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="merchantSaving" @click="submitMerchant">保存</el-button>
        </div>
      </template>
    </el-dialog>

    <el-drawer v-model="settingDrawerVisible" size="720px" :title="activeMerchant ? `${activeMerchant.merchantName} · 商户设置` : '商户设置'">
      <template v-if="activeMerchant">
        <div class="payment-dialog-shell">
          <div class="payment-status-strip">
            <div class="payment-status-card">
              <span class="payment-status-card__label">当前商户</span>
              <strong class="payment-status-card__value">{{ activeMerchant.merchantName }}</strong>
              <span class="payment-status-card__hint">{{ activeMerchant.defaultNotifyUrl || "未配置统一结果回调" }}</span>
            </div>
            <div class="payment-status-card">
              <span class="payment-status-card__label">已配支付方式</span>
              <strong class="payment-status-card__value">{{ activeMerchant.channelCount || 0 }}</strong>
              <span class="payment-status-card__hint">建议至少保留一个可执行支付方式。</span>
            </div>
            <div class="payment-status-card">
              <span class="payment-status-card__label">状态</span>
              <strong class="payment-status-card__value">{{ activeMerchant.statusDesc || MerchantStatusMap[activeMerchant.status] }}</strong>
              <span class="payment-status-card__hint">订单策略和钱包限额都按当前商户维度生效。</span>
            </div>
          </div>

          <el-tabs v-model="settingTab">
            <el-tab-pane label="商户能力" name="base">
              <div class="payment-dialog-shell">
                <section class="payment-section-card">
                  <div class="payment-section-card__title">
                    <div>
                      <h3>能力开关</h3>
                      <p>统一处理钱包、自动关单、自动分表、自动分账和优惠能力。</p>
                    </div>
                  </div>
                  <div class="capability-card-grid">
                    <button v-for="item in buildMerchantCapabilityCards(settingState)" :key="item.key" type="button" class="capability-card-hit" @click="toggleMerchantCapability(settingState, item.key)">
                      <ScCard layout="compact" hoverable :active="item.active" :title="item.title" :subtitle="item.subtitle" :icon="item.icon" :theme="item.theme" class="capability-card">
                        <div class="capability-card__meta">
                          <span>{{ item.description }}</span>
                          <el-tag :type="item.tagType" effect="plain">{{ item.active ? "已开启" : "已关闭" }}</el-tag>
                        </div>
                      </ScCard>
                    </button>
                  </div>
                </section>

                <section class="payment-section-card">
                  <div class="payment-section-card__title">
                    <div>
                      <h3>统一地址</h3>
                      <p>商户级默认配置，渠道未单独覆盖时会使用这里的地址。</p>
                    </div>
                  </div>
                  <el-form label-width="112px">
                    <div class="payment-form-grid">
                      <el-form-item label="自动关单分钟">
                        <el-input-number v-model="settingState.paymentAutoCloseMinutes" :min="1" :max="1440" :disabled="!settingState.paymentAutoCloseEnabled" />
                      </el-form-item>
                      <el-form-item label="状态说明">
                        <div class="payment-soft-panel payment-subtle">自动关单更多依赖任务调度能力，与订单超时策略共同生效。</div>
                      </el-form-item>
                      <el-form-item label="统一结果回调" class="payment-form-span-2">
                        <el-input v-model="settingState.defaultNotifyUrl" />
                      </el-form-item>
                      <el-form-item label="支付完成回跳" class="payment-form-span-2">
                        <el-input v-model="settingState.defaultReturnUrl" />
                      </el-form-item>
                    </div>
                  </el-form>
                </section>
              </div>
            </el-tab-pane>

            <el-tab-pane label="订单规则" name="payment">
              <div class="payment-dialog-shell">
                <section class="payment-section-card">
                  <div class="payment-section-card__title">
                    <div>
                      <h3>订单行为</h3>
                      <p>幂等、超时和待支付上限都在这里统一配置。</p>
                    </div>
                  </div>
                  <div class="setting-switch-grid">
                    <ScSwitch v-model="paymentConfigState.orderReusable" layout="card" active-text="订单幂等复用开启" inactive-text="订单幂等复用关闭" />
                    <ScSwitch v-model="paymentConfigState.autoCancelTimeoutOrder" layout="card" active-text="超时单自动取消" inactive-text="超时单不自动取消" />
                  </div>
                  <el-form label-width="112px">
                    <div class="payment-form-grid">
                      <el-form-item label="订单超时分钟">
                        <el-input-number v-model="paymentConfigState.orderTimeoutMinutes" :min="1" :max="1440" />
                      </el-form-item>
                      <el-form-item label="待支付上限">
                        <el-input-number v-model="paymentConfigState.pendingOrderLimit" :min="0" :max="99999" />
                      </el-form-item>
                    </div>
                  </el-form>
                </section>
              </div>
            </el-tab-pane>

            <el-tab-pane label="钱包限额" name="wallet">
              <div class="payment-dialog-shell">
                <section class="payment-section-card">
                  <div class="payment-section-card__title">
                    <div>
                      <h3>钱包出入金限额</h3>
                      <p>适用于余额钱包的充值、提现和转账上限。</p>
                    </div>
                  </div>
                  <el-form label-width="112px">
                    <div class="payment-form-grid">
                      <el-form-item label="单笔充值"><el-input-number v-model="walletLimitState.singleRechargeLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                      <el-form-item label="单日充值"><el-input-number v-model="walletLimitState.dailyRechargeLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                      <el-form-item label="单笔提现"><el-input-number v-model="walletLimitState.singleWithdrawLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                      <el-form-item label="单日提现"><el-input-number v-model="walletLimitState.dailyWithdrawLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                      <el-form-item label="单笔转账"><el-input-number v-model="walletLimitState.singleTransferLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                      <el-form-item label="单日转账"><el-input-number v-model="walletLimitState.dailyTransferLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                      <el-form-item label="余额上限"><el-input-number v-model="walletLimitState.balanceLimit" :min="0" :precision="2" :step="10" /></el-form-item>
                    </div>
                  </el-form>
                </section>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="drawer-footer">
          <el-button @click="settingDrawerVisible = false">取消</el-button>
          <el-button type="primary" :loading="settingSaving" @click="saveMerchantSettings">保存设置</el-button>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="channelDrawerVisible" size="920px" :title="activeMerchant ? `${activeMerchant.merchantName} · 支付方式` : '支付方式'">
      <template v-if="activeMerchant">
        <div class="payment-dialog-shell">
          <div class="payment-status-strip">
            <div class="payment-status-card">
              <span class="payment-status-card__label">统一结果回调</span>
              <strong class="payment-status-card__value">{{ activeMerchant.defaultNotifyUrl || "未配置" }}</strong>
              <span class="payment-status-card__hint">支付、转账、退款默认共用。</span>
            </div>
            <div class="payment-status-card">
              <span class="payment-status-card__label">浏览器回跳</span>
              <strong class="payment-status-card__value">{{ activeMerchant.defaultReturnUrl || "未配置" }}</strong>
              <span class="payment-status-card__hint">浏览器支付成功后前端跳转使用。</span>
            </div>
            <div class="payment-status-card">
              <span class="payment-status-card__label">支付方式数量</span>
              <strong class="payment-status-card__value">{{ channelList.length }}</strong>
              <span class="payment-status-card__hint">支持按支付方式单独覆盖结果回调与浏览器回跳。</span>
            </div>
          </div>

          <section class="payment-section-card">
            <div class="payment-section-card__title">
              <div>
                <h3>支付方式列表</h3>
                <p>按业务支付方式展示启停状态、回调覆盖、凭证完成度和适用场景。</p>
              </div>
              <div class="payment-card-actions">
                <el-input v-model="channelKeyword" clearable placeholder="搜索支付方式名称 / 渠道类型" style="width: 220px" />
                <el-tooltip content="新增支付方式">
                  <el-button circle type="primary" :icon="Plus" @click="openChannelDialog()" />
                </el-tooltip>
              </div>
            </div>

            <ScTable table-name="payment-merchant-channel-card" layout="card" card-layout="default" :search="false" :hide-do="true" :hide-refresh="true" :hide-setting="true" :hide-pagination="true" :data="channelCardData">
              <template #default="{ row }">
                <article
                  class="channel-card"
                  :class="[
                    `channel-card--${resolveChannelTone(row.channelType)}`,
                    { 'channel-card--inactive': !isChannelEnabled(row), 'channel-card--deleted': isChannelDeleted(row) },
                  ]"
                >
                  <header class="channel-card__top">
                    <div class="channel-card__identity">
                      <div class="channel-card__type-chip">
                        {{ formatChannelType(row.channelType) }}
                      </div>
                      <div class="channel-card__title-block">
                        <strong>{{ resolveChannelDisplayName(row) }}</strong>
                        <p>
                          {{ formatChannelSubType(row.channelType, row.channelSubType) }}
                          <template v-if="showChannelAlias(row)"> · 别名 {{ row.channelName }}</template>
                        </p>
                      </div>
                    </div>
                    <div class="channel-card__status">
                      <el-tag :type="channelStatusTag(row)" effect="dark">{{ formatChannelStatus(row) }}</el-tag>
                      <span>{{ row.channelTypeDesc || formatChannelType(row.channelType) }}</span>
                    </div>
                  </header>

                  <section class="channel-card__metrics">
                    <div class="channel-card__metric">
                      <span>运行模式</span>
                      <strong>{{ resolveChannelMode(row) }}</strong>
                    </div>
                    <div class="channel-card__metric">
                      <span>回调策略</span>
                      <strong>{{ resolveCallbackMode(row) }}</strong>
                    </div>
                    <div class="channel-card__metric">
                      <span>凭证完整度</span>
                      <strong>{{ resolveCredentialSummary(row) }}</strong>
                    </div>
                    <div class="channel-card__metric">
                      <span>支付场景</span>
                      <strong>{{ formatChannelSubType(row.channelType, row.channelSubType) }}</strong>
                    </div>
                  </section>

                  <section class="channel-card__details">
                    <div class="channel-card__detail">
                      <span>商户号</span>
                      <strong>{{ row.merchantNo || "未录入" }}</strong>
                    </div>
                    <div class="channel-card__detail">
                      <span>支付结果回调</span>
                      <strong>{{ row.effectiveNotifyUrl || row.notifyUrl || "沿用商户默认结果回调" }}</strong>
                    </div>
                    <div class="channel-card__detail">
                      <span>浏览器回跳</span>
                      <strong>{{ row.effectiveReturnUrl || row.returnUrl || "沿用商户默认回跳" }}</strong>
                    </div>
                    <div class="channel-card__detail">
                      <span>更新时间</span>
                      <strong>{{ row.updatedAt || row.createdAt || "-" }}</strong>
                    </div>
                  </section>

                  <div class="channel-card__credential-row">
                    <span class="channel-card__credential-label">凭证状态</span>
                    <div class="channel-card__credential-tags">
                      <span class="channel-credential" :class="{ 'is-ready': row.apiKeyConfigured }">API Key</span>
                      <span class="channel-credential" :class="{ 'is-ready': row.privateKeyConfigured }">私钥</span>
                      <span class="channel-credential" :class="{ 'is-ready': row.publicKeyConfigured }">公钥</span>
                      <span class="channel-credential" :class="{ 'is-ready': row.certConfigured }">证书</span>
                    </div>
                  </div>

                  <section v-if="buildChannelSummary(row).length" class="channel-card__summary">
                    <div v-for="item in buildChannelSummary(row)" :key="`${row.id}-${item.label}`" class="channel-card__summary-item">
                      <span>{{ item.label }}</span>
                      <strong>{{ item.value }}</strong>
                    </div>
                  </section>

                  <footer class="channel-card__footer">
                    <div class="channel-card__caption">
                      {{ describeChannelPurpose(row) }}
                    </div>
                    <div class="payment-icon-actions">
                      <el-tooltip content="编辑支付方式">
                        <el-button circle :icon="Edit" @click="openChannelDialog(row)" />
                      </el-tooltip>
                      <el-tooltip :content="isChannelEnabled(row) ? '禁用支付方式' : '启用支付方式'">
                        <el-button
                          circle
                          :type="isChannelEnabled(row) ? 'warning' : 'success'"
                          :icon="isChannelEnabled(row) ? SwitchButton : CircleCheck"
                          :disabled="isChannelDeleted(row)"
                          @click="toggleChannelStatus(row)"
                        />
                      </el-tooltip>
                      <el-tooltip content="删除支付方式">
                        <el-button circle type="danger" :icon="Delete" :disabled="isChannelDeleted(row)" @click="removeChannel(row)" />
                      </el-tooltip>
                    </div>
                  </footer>
                </article>
              </template>
            </ScTable>
          </section>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="channelDialogVisible" :title="channelForm.id ? '编辑支付方式' : '新增支付方式'" width="940px" destroy-on-close>
      <div class="payment-dialog-shell">
        <div class="payment-status-strip">
          <div class="payment-status-card">
            <span class="payment-status-card__label">支付方式</span>
            <strong class="payment-status-card__value">{{ resolveChannelDisplayName(channelForm) }}</strong>
            <span class="payment-status-card__hint">{{ channelForm.channelName ? `别名：${channelForm.channelName}` : `${formatChannelType(channelForm.channelType)} / ${formatChannelSubType(channelForm.channelType, channelForm.channelSubType)}` }}</span>
          </div>
          <div class="payment-status-card">
            <span class="payment-status-card__label">支付方式类型</span>
            <strong class="payment-status-card__value">{{ formatChannelSubType(channelForm.channelType, channelForm.channelSubType) }}</strong>
            <span class="payment-status-card__hint">后端会根据渠道类型和子类型自动选择实际实现。</span>
          </div>
          <div class="payment-status-card">
            <span class="payment-status-card__label">当前商户</span>
            <strong class="payment-status-card__value">{{ activeMerchant?.merchantName || "-" }}</strong>
            <span class="payment-status-card__hint">{{ activeMerchant?.defaultNotifyUrl || "当前商户未配置统一结果回调" }}</span>
          </div>
        </div>

        <section class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>基础信息</h3>
              <p>先确定支付方式与业务场景，再录入凭证、回调和专属配置。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item label="渠道类型" required>
                <el-select v-model="channelForm.channelType" placeholder="请选择" @change="handleChannelTypeChange">
                  <el-option v-for="item in catalogTypes" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="子类型" required>
                <el-select v-model="channelForm.channelSubType" placeholder="请选择">
                  <el-option v-for="item in channelSubTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
              </el-form-item>
              <el-form-item label="显示名称" required>
                <el-input v-model="channelForm.channelName" placeholder="例如：微信 JSAPI 正式" />
              </el-form-item>
              <el-form-item label="启用状态">
                <el-select v-model="channelForm.status">
                  <el-option label="禁用" :value="0" />
                  <el-option label="启用" :value="1" />
                </el-select>
              </el-form-item>
              <el-form-item label="沙箱模式">
                <el-select v-model="channelForm.sandboxMode">
                  <el-option label="关闭" :value="0" />
                  <el-option label="开启" :value="1" />
                </el-select>
              </el-form-item>
              <el-form-item label="业务说明">
                <div class="payment-soft-panel payment-subtle">前端只选择支付方式和业务场景；具体 SPI 由后端根据渠道类型和子类型自动匹配。</div>
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>支付凭证</h3>
              <p>不同支付方式展示不同录入项，不再要求手写 JSON。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item v-if="showAppIdField" :label="channelForm.channelType === 'WECHAT' || channelForm.channelType === 'EPAY' ? '应用 AppId' : '支付宝应用ID'">
                <el-input v-model="channelForm.appId" placeholder="按渠道平台分配值填写" />
              </el-form-item>
              <el-form-item v-if="showMerchantNoField" :label="channelForm.channelType === 'EPAY' ? '易支付商户号' : '商户号'">
                <el-input v-model="channelForm.merchantNo" placeholder="例如：1725633524" />
              </el-form-item>
              <el-form-item v-if="showApiKeyField" :label="channelForm.channelType === 'EPAY' ? 'API Key' : 'APIv3 Key'">
                <el-input v-model="channelForm.apiKey" :placeholder="channelForm.channelType === 'EPAY' ? '易支付 API Key' : '微信 APIv3 Key'" />
              </el-form-item>
              <el-form-item v-if="showCertPathField" :label="channelForm.channelType === 'WECHAT' ? '证书路径 / 标识' : '证书路径'">
                <el-input v-model="channelForm.certPath" placeholder="可填证书文件路径或平台标识" />
              </el-form-item>
              <el-form-item v-if="showPrivateKeyField" :label="channelForm.channelType === 'WECHAT' ? '商户私钥' : '应用私钥'" class="payment-form-span-2">
                <el-input v-model="channelForm.privateKey" type="textarea" :rows="4" :placeholder="channelForm.channelType === 'WECHAT' ? '微信商户私钥内容' : '支付宝应用私钥内容'" />
              </el-form-item>
              <el-form-item v-if="showPublicKeyField" label="支付宝公钥" class="payment-form-span-2">
                <el-input v-model="channelForm.publicKey" type="textarea" :rows="4" placeholder="支付宝平台公钥内容" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>回调与跳转</h3>
              <p>这里配置支付方式级覆盖地址；未填时走商户级默认地址。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item label="结果回调" class="payment-form-span-2">
                <el-input v-model="channelForm.notifyUrl" placeholder="当前支付方式单独覆盖支付、转账、退款结果回调" />
                <div class="payment-helper">不填则走商户统一结果回调；微信退款还可以额外配置退款回调地址。</div>
              </el-form-item>
              <el-form-item label="浏览器回跳" class="payment-form-span-2">
                <el-input v-model="channelForm.returnUrl" placeholder="当前支付方式单独覆盖浏览器支付完成后的回跳地址" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section v-if="showWechatConfig" class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>微信支付专属配置</h3>
              <p>按字段逐项录入微信商户证书、退款回调和小程序扩展信息。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item label="商户证书序列号">
                <el-input v-model="channelWechatConfig.merchantSerialNumber" placeholder="merchantSerialNumber" />
              </el-form-item>
              <el-form-item label="退款回调地址">
                <el-input v-model="channelWechatConfig.refundNotifyUrl" placeholder="refundNotifyUrl，可覆盖退款通知地址" />
              </el-form-item>
              <el-form-item v-if="isMiniProgramType" label="小程序 Secret">
                <el-input v-model="channelWechatConfig.miniProgramSecret" placeholder="小程序 secret，可选扩展存档" />
              </el-form-item>
              <el-form-item v-if="isMiniProgramType" label="应用 Secret">
                <el-input v-model="channelWechatConfig.appSecret" placeholder="appSecret，可选扩展存档" />
              </el-form-item>
              <el-form-item label="支付分回调" class="payment-form-span-2">
                <el-input v-model="channelWechatConfig.payScoreNotifyUrl" placeholder="payScoreNotifyUrl，可选" />
              </el-form-item>
              <el-form-item label="支付分到点回调" class="payment-form-span-2">
                <el-input v-model="channelWechatConfig.paymentPointNotifyUrl" placeholder="paymentPointNotifyUrl，可选" />
              </el-form-item>
              <el-form-item label="密钥文件路径" class="payment-form-span-2">
                <el-input v-model="channelWechatConfig.keyPath" placeholder="例如：C:\\cert\\apiclient_key.pem，仅用于业务侧留档" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section v-if="showAlipayConfig" class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>支付宝专属配置</h3>
              <p>服务网关、字符集和签名算法拆成独立字段，不再手填 JSON。</p>
            </div>
          </div>
          <el-form label-width="112px">
            <div class="payment-form-grid">
              <el-form-item label="网关地址">
                <el-input v-model="channelAlipayConfig.serverUrl" placeholder="serverUrl，留空使用默认网关" />
              </el-form-item>
              <el-form-item label="字符集">
                <el-input v-model="channelAlipayConfig.charset" placeholder="默认 UTF-8" />
              </el-form-item>
              <el-form-item label="返回格式">
                <el-input v-model="channelAlipayConfig.format" placeholder="默认 json" />
              </el-form-item>
              <el-form-item label="签名算法">
                <el-input v-model="channelAlipayConfig.signType" placeholder="默认 RSA2" />
              </el-form-item>
            </div>
          </el-form>
        </section>

        <section v-if="showWalletConfig" class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>钱包通道说明</h3>
              <p>钱包渠道本身没有额外网关参数，主要跟随商户钱包限额和订单规则。</p>
            </div>
          </div>
          <div class="payment-soft-panel payment-subtle">钱包通道通常不需要录入第三方密钥。保留支付方式是为了让订单台、钱包台和业务侧共用统一的渠道视图。</div>
        </section>

        <section v-if="selectedGuide" class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>{{ selectedGuide.title }}</h3>
              <p>{{ selectedGuide.summary || "按渠道官方要求补齐应用、商户号、密钥与证书。" }}</p>
            </div>
          </div>
          <div class="payment-dialog-shell">
            <div class="payment-readonly-grid">
              <div class="payment-readonly-item">
                <span>官方名称</span>
                <strong>{{ selectedGuide.officialName || "-" }}</strong>
              </div>
              <div class="payment-readonly-item">
                <span>默认回调</span>
                <strong>{{ activeMerchant?.defaultNotifyUrl || "沿用全局支付配置" }}</strong>
              </div>
            </div>
            <div v-if="selectedGuide.requiredMaterials?.length" class="payment-soft-panel">
              <strong>开户材料</strong>
              <ul class="payment-list-plain">
                <li v-for="item in selectedGuide.requiredMaterials" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div v-if="selectedGuide.tips?.length" class="payment-soft-panel">
              <strong>接入提示</strong>
              <ul class="payment-list-plain">
                <li v-for="item in selectedGuide.tips" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="payment-section-card">
          <div class="payment-section-card__title">
            <div>
              <h3>高级配置预览</h3>
              <p>保留未知 extConfig 字段，结构化字段会自动回写为最终 JSON。</p>
            </div>
          </div>
          <el-collapse v-model="channelAdvancedPanels">
            <el-collapse-item title="查看即将提交的 extConfig" name="preview">
              <pre class="payment-code-preview">{{ channelExtConfigPreview }}</pre>
            </el-collapse-item>
          </el-collapse>
        </section>
      </div>

      <template #footer>
        <div class="payment-dialog-footer">
          <el-button @click="channelDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="channelSaving" @click="submitChannel">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { CircleCheck, CreditCard, Delete, Edit, Plus, RefreshRight, Search, Setting, SwitchButton } from "@element-plus/icons-vue";
import {
  activateMerchant,
  createChannel,
  createMerchant,
  deactivateMerchant,
  deleteChannel,
  deleteMerchant,
  disableChannel,
  enableChannel,
  getChannelCatalog,
  getMerchantChannels,
  getMerchantDetail,
  getMerchantList,
  getMerchantPaymentConfig,
  getMerchantWalletLimit,
  updateChannel,
  updateMerchant,
  updateMerchantPaymentConfig,
  updateMerchantWalletLimit,
} from "../api/payment";
import type {
  ChannelForm,
  Merchant,
  MerchantChannel,
  MerchantPaymentConfig,
  MerchantWalletLimit,
  PaymentMethodGuide,
} from "../types/payment";
import { ChannelStatusMap, ChannelSubTypeOptions, ChannelTypeMap, MerchantStatusMap } from "../types/payment";
import { normalizeTableResult } from "./support/paymentView";

type MerchantCapabilityKey =
  | "paymentWalletEnabled"
  | "paymentAutoCloseEnabled"
  | "paymentSplitTableEnabled"
  | "paymentProfitSharingEnabled"
  | "paymentCouponEnabled";

type MerchantCapabilityState = {
  paymentWalletEnabled: boolean;
  paymentAutoCloseEnabled: boolean;
  paymentAutoCloseMinutes?: number;
  paymentSplitTableEnabled: boolean;
  paymentProfitSharingEnabled: boolean;
  paymentCouponEnabled: boolean;
};

type ChannelExtConfigMap = Record<string, unknown>;

const KNOWN_CHANNEL_EXT_KEYS = new Set([
  "merchantSerialNumber",
  "refundNotifyUrl",
  "payScoreNotifyUrl",
  "paymentPointNotifyUrl",
  "miniProgramSecret",
  "appSecret",
  "keyPath",
  "serverUrl",
  "charset",
  "format",
  "signType",
]);

const tableRef = ref();

const queryForm = reactive({
  merchantName: "",
  status: undefined as number | undefined,
});

const stats = reactive({
  total: 0,
  active: 0,
  configured: 0,
});

const merchantDialogVisible = ref(false);
const merchantSaving = ref(false);
const merchantForm = reactive(createMerchantForm());

const activeMerchant = ref<Merchant | null>(null);
const settingDrawerVisible = ref(false);
const settingSaving = ref(false);
const settingTab = ref("base");
const settingState = reactive(createMerchantForm());
const paymentConfigState = reactive<MerchantPaymentConfig>({
  merchantId: 0,
  orderReusable: false,
  orderTimeoutMinutes: 30,
  pendingOrderLimit: 0,
  autoCancelTimeoutOrder: false,
});
const walletLimitState = reactive<MerchantWalletLimit>({
  merchantId: 0,
});

const channelDrawerVisible = ref(false);
const channelDialogVisible = ref(false);
const channelSaving = ref(false);
const channelKeyword = ref("");
const channelList = ref<MerchantChannel[]>([]);
const channelCatalog = ref<PaymentMethodGuide[]>([]);
const channelForm = reactive(createChannelForm());
const channelAdvancedPanels = ref<string[]>([]);
const unknownChannelExtConfig = ref<ChannelExtConfigMap>({});

const channelWechatConfig = reactive(createWechatChannelConfig());
const channelAlipayConfig = reactive(createAlipayChannelConfig());

const filteredChannels = computed(() =>
  channelList.value.filter((item) => {
    const keyword = channelKeyword.value.trim().toLowerCase();
    if (!keyword) {
      return true;
    }
    return [item.channelName, item.channelType, item.channelSubType].some((value) => String(value ?? "").toLowerCase().includes(keyword));
  }),
);

const channelCardData = computed(() => normalizeTableResult(filteredChannels.value, filteredChannels.value.length));
const channelSubTypeOptions = computed(() => ChannelSubTypeOptions[channelForm.channelType] || []);
const catalogTypes = computed(() => {
  const seen = new Set<string>();
  return channelCatalog.value
    .filter((item) => {
      if (seen.has(item.channelType)) {
        return false;
      }
      seen.add(item.channelType);
      return true;
    })
    .map((item) => ({ label: ChannelTypeMap[item.channelType] || item.channelType, value: item.channelType }));
});
const selectedGuide = computed(() =>
  channelCatalog.value.find((item) => item.channelType === channelForm.channelType && item.channelSubType === channelForm.channelSubType),
);

const showWechatConfig = computed(() => ["WECHAT", "EPAY"].includes(channelForm.channelType));
const showAlipayConfig = computed(() => channelForm.channelType === "ALIPAY");
const showWalletConfig = computed(() => channelForm.channelType === "WALLET");
const showAppIdField = computed(() => ["WECHAT", "ALIPAY", "EPAY"].includes(channelForm.channelType));
const showMerchantNoField = computed(() => ["WECHAT", "EPAY"].includes(channelForm.channelType));
const showApiKeyField = computed(() => ["WECHAT", "EPAY"].includes(channelForm.channelType));
const showPublicKeyField = computed(() => channelForm.channelType === "ALIPAY");
const showPrivateKeyField = computed(() => ["WECHAT", "ALIPAY"].includes(channelForm.channelType));
const showCertPathField = computed(() => ["WECHAT", "ALIPAY"].includes(channelForm.channelType));
const isMiniProgramType = computed(() => ["MINI_PROGRAM", "MINIPROGRAM"].includes(channelForm.channelSubType));
const channelExtConfigPreview = computed(() => JSON.stringify(buildChannelExtConfigObject(), null, 2));

function createMerchantForm() {
  return {
    id: undefined as number | undefined,
    merchantName: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    businessLicense: "",
    legalPerson: "",
    defaultNotifyUrl: "",
    defaultReturnUrl: "",
    paymentWalletEnabled: false,
    paymentAutoCloseEnabled: false,
    paymentAutoCloseMinutes: 30,
    paymentSplitTableEnabled: false,
    paymentProfitSharingEnabled: false,
    paymentCouponEnabled: false,
    remark: "",
  };
}

function createChannelForm() {
  return {
    id: undefined as number | undefined,
    merchantId: 0,
    channelType: "",
    channelSubType: "",
    channelName: "",
    appId: "",
    merchantNo: "",
    apiKey: "",
    privateKey: "",
    publicKey: "",
    certPath: "",
    sandboxMode: 0,
    notifyUrl: "",
    returnUrl: "",
    status: 0,
    extConfig: "",
  };
}

function createWechatChannelConfig() {
  return {
    merchantSerialNumber: "",
    refundNotifyUrl: "",
    payScoreNotifyUrl: "",
    paymentPointNotifyUrl: "",
    miniProgramSecret: "",
    appSecret: "",
    keyPath: "",
  };
}

function createAlipayChannelConfig() {
  return {
    serverUrl: "",
    charset: "UTF-8",
    format: "json",
    signType: "RSA2",
  };
}

function equalsIgnoreCase(source?: string, target?: string) {
  return String(source || "").toLowerCase() === String(target || "").toLowerCase();
}

function parseChannelExtConfig(extConfig?: string) {
  if (!String(extConfig || "").trim()) {
    return {} as ChannelExtConfigMap;
  }
  try {
    const parsed = JSON.parse(extConfig || "{}");
    return parsed && typeof parsed === "object" ? (parsed as ChannelExtConfigMap) : {};
  } catch (error) {
    console.error(error);
    ElMessage.warning("检测到历史 extConfig 不是标准 JSON，已忽略无法识别的字段");
    return {};
  }
}

function textOf(value: unknown) {
  return value == null ? "" : String(value);
}

function numberOf(value: unknown) {
  if (value == null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function loadStructuredChannelConfig(extConfigText?: string) {
  const parsed = parseChannelExtConfig(extConfigText);
  const nextUnknown: ChannelExtConfigMap = { ...parsed };
  for (const key of KNOWN_CHANNEL_EXT_KEYS) {
    delete nextUnknown[key];
  }
  unknownChannelExtConfig.value = nextUnknown;

  Object.assign(channelWechatConfig, createWechatChannelConfig(), {
    merchantSerialNumber: textOf(parsed.merchantSerialNumber),
    refundNotifyUrl: textOf(parsed.refundNotifyUrl),
    payScoreNotifyUrl: textOf(parsed.payScoreNotifyUrl),
    paymentPointNotifyUrl: textOf(parsed.paymentPointNotifyUrl),
    miniProgramSecret: textOf(parsed.miniProgramSecret),
    appSecret: textOf(parsed.appSecret),
    keyPath: textOf(parsed.keyPath),
  });
  Object.assign(channelAlipayConfig, createAlipayChannelConfig(), {
    serverUrl: textOf(parsed.serverUrl),
    charset: textOf(parsed.charset) || "UTF-8",
    format: textOf(parsed.format) || "json",
    signType: textOf(parsed.signType) || "RSA2",
  });
}

function appendText(target: ChannelExtConfigMap, key: string, value?: string) {
  const text = String(value || "").trim();
  if (text) {
    target[key] = text;
  }
}

function appendNumber(target: ChannelExtConfigMap, key: string, value?: number) {
  if (value != null && Number.isFinite(value)) {
    target[key] = value;
  }
}

function buildChannelExtConfigObject() {
  const next: ChannelExtConfigMap = { ...unknownChannelExtConfig.value };

  if (showWechatConfig.value) {
    appendText(next, "merchantSerialNumber", channelWechatConfig.merchantSerialNumber);
    appendText(next, "refundNotifyUrl", channelWechatConfig.refundNotifyUrl);
    appendText(next, "payScoreNotifyUrl", channelWechatConfig.payScoreNotifyUrl);
    appendText(next, "paymentPointNotifyUrl", channelWechatConfig.paymentPointNotifyUrl);
    appendText(next, "miniProgramSecret", channelWechatConfig.miniProgramSecret);
    appendText(next, "appSecret", channelWechatConfig.appSecret);
    appendText(next, "keyPath", channelWechatConfig.keyPath);
  }

  if (showAlipayConfig.value) {
    appendText(next, "serverUrl", channelAlipayConfig.serverUrl);
    appendText(next, "charset", channelAlipayConfig.charset);
    appendText(next, "format", channelAlipayConfig.format);
    appendText(next, "signType", channelAlipayConfig.signType);
  }

  return next;
}

function buildMerchantCapabilityCards(state: MerchantCapabilityState) {
  return [
    {
      key: "paymentWalletEnabled" as MerchantCapabilityKey,
      title: "钱包能力",
      subtitle: "站内余额支付与转账",
      description: "开启后支持余额钱包相关业务。",
      icon: "ri:wallet-3-line",
      theme: "success" as const,
      active: state.paymentWalletEnabled,
      tagType: state.paymentWalletEnabled ? "success" : "info",
    },
    {
      key: "paymentSplitTableEnabled" as MerchantCapabilityKey,
      title: "自动分表",
      subtitle: "订单与流水定时建表",
      description: "为订单与流水分区、迁移能力预留开关。",
      icon: "ri:table-2",
      theme: "primary" as const,
      active: state.paymentSplitTableEnabled,
      tagType: state.paymentSplitTableEnabled ? "primary" : "info",
    },
    {
      key: "paymentProfitSharingEnabled" as MerchantCapabilityKey,
      title: "自动分账",
      subtitle: "后续收益分账能力",
      description: "为收益表和自动分账能力预留开关。",
      icon: "ri:exchange-funds-line",
      theme: "success" as const,
      active: state.paymentProfitSharingEnabled,
      tagType: state.paymentProfitSharingEnabled ? "success" : "info",
    },
    {
      key: "paymentCouponEnabled" as MerchantCapabilityKey,
      title: "优惠功能",
      subtitle: "后续优惠券与营销",
      description: "为优惠券和支付营销能力预留开关。",
      icon: "ri:coupon-2-line",
      theme: "warning" as const,
      active: state.paymentCouponEnabled,
      tagType: state.paymentCouponEnabled ? "warning" : "info",
    },
    {
      key: "paymentAutoCloseEnabled" as MerchantCapabilityKey,
      title: "自动关单",
      subtitle: state.paymentAutoCloseEnabled ? `${state.paymentAutoCloseMinutes || 30} 分钟后关闭` : "关闭后由人工或任务处理",
      description: "建议和订单超时策略一起使用。",
      icon: "ri:timer-flash-line",
      theme: "warning" as const,
      active: state.paymentAutoCloseEnabled,
      tagType: state.paymentAutoCloseEnabled ? "warning" : "info",
    },
  ];
}

function toggleMerchantCapability(state: MerchantCapabilityState, key: MerchantCapabilityKey) {
  state[key] = !state[key];
}

function formatChannelType(channelType?: string) {
  if (!channelType) {
    return "-";
  }
  return ChannelTypeMap[channelType] || channelType;
}

function formatChannelSubType(channelType?: string, channelSubType?: string) {
  if (!channelSubType) {
    return "-";
  }
  const option = (ChannelSubTypeOptions[channelType || ""] || []).find((item) => item.value === channelSubType);
  return option?.label || channelSubType;
}

function merchantStatusTag(status?: number) {
  if (status === 1) return "success";
  if (status === 2) return "warning";
  if (status === 3) return "info";
  return "";
}

function resolveChannelDisplayName(
  source:
    | MerchantChannel
    | {
        channelType?: string;
        channelSubType?: string;
      },
) {
  const channelType = String(source.channelType || "").toUpperCase();
  const channelSubType = String(source.channelSubType || "").toUpperCase();

  if (channelType === "WECHAT") {
    if (channelSubType === "JSAPI") return "微信 JSAPI";
    if (channelSubType === "MINI_PROGRAM" || channelSubType === "MINIPROGRAM") return "微信小程序";
    if (channelSubType === "H5") return "微信 H5";
    if (channelSubType === "APP") return "微信 APP";
    if (channelSubType === "NATIVE") return "微信 Native";
    return "微信支付";
  }

  if (channelType === "ALIPAY") {
    if (channelSubType === "WEB") return "支付宝网页支付";
    if (channelSubType === "WAP") return "支付宝手机网站";
    if (channelSubType === "APP") return "支付宝 APP";
    return "支付宝";
  }

  if (channelType === "EPAY") {
    if (channelSubType === "JSAPI") return "易支付 JSAPI";
    if (channelSubType === "MINI_PROGRAM" || channelSubType === "MINIPROGRAM") return "易支付小程序";
    if (channelSubType === "H5") return "易支付 H5";
    return "易支付";
  }

  if (channelType === "WALLET") {
    return "钱包";
  }

  return formatChannelType(channelType);
}

function showChannelAlias(row: MerchantChannel) {
  const alias = String(row.channelName || "").trim();
  if (!alias) {
    return false;
  }
  return alias !== resolveChannelDisplayName(row);
}

function normalizeStatusToken(value?: string) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

function isChannelDeleted(row: MerchantChannel) {
  return ["DELETED", "DELETE", "REMOVED"].includes(normalizeStatusToken(row.statusDesc));
}

function isChannelEnabled(row: MerchantChannel) {
  return !isChannelDeleted(row) && Number(row.status) === 1;
}

function channelStatusTag(row: MerchantChannel) {
  if (isChannelDeleted(row)) {
    return "danger";
  }
  return isChannelEnabled(row) ? "success" : "info";
}

function formatChannelStatus(row: MerchantChannel) {
  const normalized = normalizeStatusToken(row.statusDesc);
  if (["DELETED", "DELETE", "REMOVED"].includes(normalized)) return "已删除";
  if (["ENABLE", "ENABLED"].includes(normalized)) return "已启用";
  if (["DISABLE", "DISABLED"].includes(normalized)) return "已禁用";
  return row.statusDesc || ChannelStatusMap[row.status] || "-";
}

function resolveChannelTone(channelType?: string) {
  const type = String(channelType || "").toUpperCase();
  if (type === "WECHAT") return "wechat";
  if (type === "ALIPAY") return "alipay";
  if (type === "EPAY") return "epay";
  if (type === "WALLET") return "wallet";
  return "default";
}

function resolveCredentialSummary(row: MerchantChannel) {
  if (String(row.channelType || "").toUpperCase() === "WALLET") {
    return "内建钱包能力";
  }
  if (String(row.channelType || "").toUpperCase() === "EPAY") {
    return "易支付渠道凭证";
  }
  const count = [row.apiKeyConfigured, row.privateKeyConfigured, row.publicKeyConfigured, row.certConfigured].filter(Boolean).length;
  return `${count}/4 已配置`;
}

function resolveCallbackMode(row: MerchantChannel) {
  if (row.notifyUrl && row.returnUrl) return "结果回调 + 回跳已覆盖";
  if (row.notifyUrl) return "结果回调已覆盖";
  if (row.returnUrl) return "浏览器回跳已覆盖";
  return "沿用商户默认";
}

function resolveChannelMode(row: MerchantChannel) {
  const type = String(row.channelType || "").toUpperCase();
  if (type === "EPAY") return "易支付通道";
  if (type === "WALLET") return "站内钱包直扣";
  return row.sandboxMode === 1 ? "沙箱联调" : "正式执行";
}

function buildChannelSummary(row: MerchantChannel) {
  const extConfig = parseChannelExtConfig(row.extConfig);
  const summary: Array<{ label: string; value: string }> = [];

  if (String(row.channelType).toUpperCase() === "WECHAT") {
    if (extConfig.merchantSerialNumber) {
      summary.push({ label: "商户证书序列号", value: textOf(extConfig.merchantSerialNumber) });
    }
    if (extConfig.refundNotifyUrl) {
      summary.push({ label: "退款回调地址", value: textOf(extConfig.refundNotifyUrl) });
    }
  }

  if (String(row.channelType).toUpperCase() === "ALIPAY") {
    if (extConfig.serverUrl) {
      summary.push({ label: "网关地址", value: textOf(extConfig.serverUrl) });
    }
    summary.push({ label: "签名算法", value: textOf(extConfig.signType) || "RSA2" });
  }

  if (String(row.channelType).toUpperCase() === "EPAY") {
    if (extConfig.keyPath) {
      summary.push({ label: "证书/密钥文件", value: textOf(extConfig.keyPath) });
    }
    if (extConfig.refundNotifyUrl) {
      summary.push({ label: "退款回调地址", value: textOf(extConfig.refundNotifyUrl) });
    }
  }

  return summary;
}

function describeChannelPurpose(row: MerchantChannel) {
  const type = String(row.channelType || "").toUpperCase();
  if (type === "WECHAT") {
    return "适合公众号、小程序、H5 和 Native 收银场景。";
  }
  if (type === "ALIPAY") {
    return "适合网站、WAP 和 APP 支付发起。";
  }
  if (type === "EPAY") {
    return "通过易支付平台承接收款场景，适合需要统一网关接入的业务。";
  }
  if (type === "WALLET") {
    return "直接走站内余额账户，不依赖外部支付平台。";
  }
  return "当前支付方式用于承接业务订单支付。";
}

async function fetchMerchantTable(params: Record<string, unknown>) {
  return getMerchantList({
    page: params.page,
    size: params.pageSize,
    merchantName: params.merchantName,
    status: params.status,
  });
}

async function loadStats() {
  const res = await getMerchantList({ page: 1, size: 200 });
  const records = res.data.records || [];
  stats.total = res.data.total || 0;
  stats.active = records.filter((item) => item.status === 1).length;
  stats.configured = records.filter((item) => Number(item.channelCount || 0) > 0).length;
}

async function refreshAll(showError = true) {
  try {
    await Promise.all([loadStats(), tableRef.value?.reload({ ...queryForm }, 1)]);
  } catch (error) {
    console.error(error);
    if (showError) {
      ElMessage.error("商户数据加载失败");
    }
  }
}

function handleSearch() {
  tableRef.value?.reload({ ...queryForm }, 1);
}

function handleReset() {
  queryForm.merchantName = "";
  queryForm.status = undefined;
  handleSearch();
}

function openMerchantDialog(row?: Merchant) {
  Object.assign(merchantForm, createMerchantForm(), row ? { ...row } : {});
  merchantDialogVisible.value = true;
}

async function submitMerchant() {
  if (!merchantForm.merchantName.trim()) {
    ElMessage.error("商户名称不能为空");
    return;
  }
  merchantSaving.value = true;
  try {
    if (merchantForm.id) {
      await updateMerchant(merchantForm.id, merchantForm);
    } else {
      await createMerchant(merchantForm);
    }
    ElMessage.success("商户保存成功");
    merchantDialogVisible.value = false;
    await refreshAll();
  } finally {
    merchantSaving.value = false;
  }
}

async function toggleMerchantStatus(row: Merchant) {
  if (row.status === 1) {
    await deactivateMerchant(row.id);
    ElMessage.success("商户已停用");
  } else {
    await activateMerchant(row.id);
    ElMessage.success("商户已激活");
  }
  await refreshAll();
}

async function removeMerchant(row: Merchant) {
  await ElMessageBox.confirm(`确认删除商户 ${row.merchantName} 吗？`, "删除确认", { type: "warning" });
  await deleteMerchant(row.id);
  ElMessage.success("商户已删除");
  await refreshAll();
}

async function openSettingDrawer(row: Merchant) {
  const [detailRes, paymentConfigRes, walletLimitRes] = await Promise.all([
    getMerchantDetail(row.id),
    getMerchantPaymentConfig(row.id),
    getMerchantWalletLimit(row.id),
  ]);
  activeMerchant.value = detailRes.data;
  Object.assign(settingState, createMerchantForm(), detailRes.data);
  Object.assign(paymentConfigState, { merchantId: row.id, orderReusable: false, orderTimeoutMinutes: 30, pendingOrderLimit: 0, autoCancelTimeoutOrder: false }, paymentConfigRes.data);
  Object.assign(walletLimitState, { merchantId: row.id }, walletLimitRes.data);
  settingTab.value = "base";
  settingDrawerVisible.value = true;
}

async function saveMerchantSettings() {
  if (!activeMerchant.value) {
    return;
  }
  settingSaving.value = true;
  try {
    await Promise.all([
      updateMerchant(activeMerchant.value.id, settingState),
      updateMerchantPaymentConfig(activeMerchant.value.id, paymentConfigState),
      updateMerchantWalletLimit(activeMerchant.value.id, walletLimitState),
    ]);
    ElMessage.success("商户设置已保存");
    settingDrawerVisible.value = false;
    await refreshAll();
  } finally {
    settingSaving.value = false;
  }
}

async function ensureChannelCatalog() {
  if (channelCatalog.value.length === 0) {
    const catalogRes = await getChannelCatalog();
    channelCatalog.value = catalogRes.data || [];
  }
}

async function openChannelDrawer(row: Merchant) {
  activeMerchant.value = row;
  channelKeyword.value = "";
  await ensureChannelCatalog();
  const res = await getMerchantChannels(row.id);
  channelList.value = res.data || [];
  channelDrawerVisible.value = true;
}

async function openChannelDialog(row?: MerchantChannel) {
  if (!activeMerchant.value) {
    return;
  }
  channelAdvancedPanels.value = [];
  const source = row ? { ...row } : { merchantId: activeMerchant.value.id, status: 0, sandboxMode: 0 };
  Object.assign(channelForm, createChannelForm(), source);
  loadStructuredChannelConfig(source.extConfig);
  await handleChannelTypeChange(channelForm.channelType);
  channelDialogVisible.value = true;
}

async function handleChannelTypeChange(value?: string) {
  if (!value) {
    channelForm.channelSubType = "";
    return;
  }

  if (!channelSubTypeOptions.value.find((item) => item.value === channelForm.channelSubType)) {
    channelForm.channelSubType = channelSubTypeOptions.value[0]?.value || "";
  }
}

async function submitChannel() {
  if (!activeMerchant.value || !channelForm.channelType || !channelForm.channelSubType || !channelForm.channelName.trim()) {
    ElMessage.error("渠道类型、子类型和显示名称不能为空");
    return;
  }

  channelSaving.value = true;
  try {
    const payload: ChannelForm = {
      ...channelForm,
      merchantId: activeMerchant.value.id,
      extConfig: JSON.stringify(buildChannelExtConfigObject()),
    };
    if (payload.extConfig === "{}") {
      payload.extConfig = "";
    }

    if (channelForm.id) {
      await updateChannel(channelForm.id, payload);
    } else {
      await createChannel(payload);
    }

    ElMessage.success("支付方式已保存");
    channelDialogVisible.value = false;
    await openChannelDrawer(activeMerchant.value);
    await refreshAll();
  } finally {
    channelSaving.value = false;
  }
}

async function toggleChannelStatus(row: MerchantChannel) {
  if (row.status === 1) {
    await disableChannel(row.id);
    ElMessage.success("支付方式已禁用");
  } else {
    await enableChannel(row.id);
    ElMessage.success("支付方式已启用");
  }
  if (activeMerchant.value) {
    await openChannelDrawer(activeMerchant.value);
  }
  await refreshAll();
}

async function removeChannel(row: MerchantChannel) {
  await ElMessageBox.confirm(`确认删除支付方式 ${row.channelName} 吗？`, "删除确认", { type: "warning" });
  await deleteChannel(row.id);
  ElMessage.success("支付方式已删除");
  if (activeMerchant.value) {
    await openChannelDrawer(activeMerchant.value);
  }
  await refreshAll();
}

onMounted(async () => {
  await refreshAll(false);
});
</script>

<style scoped>
@import "./support/payment-page.css";

.merchant-page {
  background: linear-gradient(180deg, #eef7f6 0%, #f7f8fa 220px, #f7f8fa 100%);
}

.cell-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cell-main strong {
  color: #101828;
}

.cell-main span {
  color: #667085;
  line-height: 1.6;
}

.capability-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.setting-switch-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.capability-card-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.capability-card-hit {
  position: relative;
  cursor: pointer;
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
}

.capability-card {
  min-height: 148px;
}

.capability-card :deep(.sc-card-compact__body) {
  padding-top: 0;
}

.capability-card__meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #667085;
  line-height: 1.7;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.channel-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
  padding: 22px;
  border-radius: 24px;
  border: 1px solid rgba(205, 216, 222, 0.96);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.86) 0%, rgba(255, 255, 255, 0) 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 249, 251, 0.98) 100%);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.channel-card::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 5px;
  background: var(--channel-tone, #7c8b9d);
}

.channel-card--wechat {
  --channel-tone: #07c160;
}

.channel-card--alipay {
  --channel-tone: #1677ff;
}

.channel-card--epay {
  --channel-tone: #7c3aed;
}

.channel-card--wallet {
  --channel-tone: #c2410c;
}

.channel-card--default {
  --channel-tone: #64748b;
}

.channel-card--inactive {
  background:
    radial-gradient(circle at top right, rgba(245, 247, 250, 0.86) 0%, rgba(255, 255, 255, 0) 30%),
    linear-gradient(180deg, rgba(250, 251, 252, 0.98) 0%, rgba(245, 247, 249, 0.98) 100%);
}

.channel-card--deleted {
  border-color: rgba(248, 113, 113, 0.24);
  background:
    radial-gradient(circle at top right, rgba(254, 226, 226, 0.8) 0%, rgba(255, 255, 255, 0) 26%),
    linear-gradient(180deg, rgba(255, 250, 250, 0.98) 0%, rgba(254, 242, 242, 0.98) 100%);
}

.channel-card--deleted::before {
  background: #ef4444;
}

.channel-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.channel-card__identity {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.channel-card__type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 78px;
  padding: 8px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--channel-tone), white 86%);
  color: color-mix(in srgb, var(--channel-tone), black 18%);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.channel-card__title-block {
  min-width: 0;
}

.channel-card__title-block strong {
  display: block;
  font-size: 18px;
  color: #0f172a;
}

.channel-card__title-block p {
  margin: 8px 0 0;
  color: #667085;
  line-height: 1.7;
}

.channel-card__status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  color: #667085;
  font-size: 12px;
  text-align: right;
}

.channel-card__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.channel-card__metric {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(245, 247, 250, 0.96);
  border: 1px solid rgba(226, 232, 240, 0.96);
}

.channel-card__metric span,
.channel-card__detail span,
.channel-card__summary-item span {
  display: block;
  margin-bottom: 8px;
  color: #667085;
  font-size: 12px;
}

.channel-card__metric strong,
.channel-card__detail strong,
.channel-card__summary-item strong {
  display: block;
  color: #101828;
  line-height: 1.7;
  word-break: break-word;
}

.channel-card__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.channel-card__detail,
.channel-card__summary-item {
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.96);
}

.channel-card__credential-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.95);
  border: 1px dashed rgba(203, 213, 225, 0.96);
}

.channel-card__credential-label {
  color: #344054;
  font-size: 13px;
  font-weight: 600;
}

.channel-card__credential-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.channel-credential {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 68px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f2f4f7;
  color: #667085;
  font-size: 12px;
  font-weight: 600;
}

.channel-credential.is-ready {
  background: rgba(220, 252, 231, 0.9);
  color: #067647;
}

.channel-card__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.channel-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  padding-top: 4px;
}

.channel-card__caption {
  color: #667085;
  line-height: 1.7;
}

@media (max-width: 980px) {
  .setting-switch-grid,
  .capability-card-grid {
    grid-template-columns: 1fr;
  }

  .channel-card__top,
  .channel-card__footer,
  .channel-card__credential-row {
    flex-direction: column;
    align-items: stretch;
  }

  .channel-card__status {
    align-items: flex-start;
    text-align: left;
  }

  .channel-card__metrics,
  .channel-card__details,
  .channel-card__summary {
    grid-template-columns: 1fr;
  }

  .channel-card__credential-tags {
    justify-content: flex-start;
  }
}
</style>
