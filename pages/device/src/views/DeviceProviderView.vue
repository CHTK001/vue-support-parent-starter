<template>
  <div class="dpv">
    <div class="dpv-body">
      <!-- ==================== 顶：厂商切换（置顶常驻，2026-11 改版） ==================== -->
      <header class="dpv-top">
        <div class="dpv-top__main">
          <span class="dpv-bar" />
          <span class="dpv-top__title">提供商</span>
          <span class="dpv-count">{{ vendors.length }}</span>
          <span class="dpv-top__desc">按厂商归档 AK/SK，同一厂商可按区域配多套账号</span>
          <span class="dpv-grow" />
          <span class="dpv-top__stats">
            <span class="dpv-live" />{{ enabledCount }} 启用
            <span class="dpv-sep" />
            {{ defaultCount }} 默认
            <span class="dpv-sep" />
            <span class="dpv-health" :title="healthSummaryTitle">
              <i class="dpv-health__dot is-ok" />{{ okCount }}
              <i class="dpv-health__dot is-fail" />{{ failCount }}
              <template v-if="untestedCount">
                <i class="dpv-health__dot is-idle" />{{ untestedCount }}
              </template>
            </span>
          </span>
          <ReButton
            icon="Plus"
            size="small"
            type="primary"
            :show-text="true"
            :disabled="!vendors.length"
            @click="openCreate()"
          >
            新增凭据
          </ReButton>
        </div>

        <!-- 厂商切换：横向胶囊条，置顶常驻，不随凭据表滚动 -->
        <div class="dpv-chips" role="tablist" aria-label="厂商切换">
          <button
            type="button"
            class="dpv-chip"
            :class="{ 'is-active': !credentialFilter }"
            role="tab"
            :aria-selected="!credentialFilter"
            @click="clearVendorFilter"
          >
            <span class="dpv-chip__tile is-all"><ReIcon name="Grid" :size="13" /></span>
            <span class="dpv-chip__name">全部厂商</span>
            <span class="dpv-chip__meta">{{ credentials.length }}</span>
          </button>

          <el-popover
            v-for="vendor in vendors"
            :key="vendor.vendor"
            placement="bottom-start"
            :width="384"
            trigger="hover"
            popper-class="dpv-pop"
          >
            <template #reference>
              <button
                type="button"
                class="dpv-chip"
                :class="{ 'is-active': credentialFilter === vendor.vendor }"
                role="tab"
                :aria-selected="credentialFilter === vendor.vendor"
                :data-vendor="vendor.vendor"
                @click="filterByVendor(vendor.vendor)"
              >
                <span class="dpv-chip__tile">{{ monogram(vendor.name) }}</span>
                <span class="dpv-chip__name">{{ vendor.name }}</span>
                <span class="dpv-chip__meta">{{ credentialsOf(vendor.vendor).length }}</span>
                <span class="dpv-chip__caps" :title="capabilityTitle(vendor)">
                  <i v-for="cap in CAP_ORDER" :key="cap" :class="{ 'is-on': vendor.capabilities.includes(cap) }" />
                </span>
              </button>
            </template>

            <!-- 悬停一个厂商 = 看这家厂商全部同步效果（按实例独立，未开启不出现） -->
            <div class="dpv-pop__body" :data-vendor-pop="vendor.vendor">
              <header class="dpv-pop__head">
                <span class="dpv-chip__tile">{{ monogram(vendor.name) }}</span>
                <b>{{ vendor.name }}</b>
                <span class="dpv-pop__count">{{ credentialsOf(vendor.vendor).length }} 套凭据</span>
              </header>

              <!-- 平台能力：厂商并集只能粗判，这里按平台摊开覆盖率与缺口 -->
              <div v-if="vendor.platforms.length" class="dpv-pop__plats">
                <div class="dpv-pop__plats-title">平台能力覆盖</div>
                <div v-for="platform in vendor.platforms" :key="platform.code" class="dpv-pop__plat">
                  <span class="dpv-pop__pname" :title="platform.name">{{ platform.name }}</span>
                  <span class="dpv-pop__pbar">
                    <i
                      :class="{ 'is-gap': briefOf(vendor.vendor, platform.code).todo > 0 }"
                      :style="{ width: `${briefOf(vendor.vendor, platform.code).coverage}%` }"
                    />
                  </span>
                  <span class="dpv-pop__ppct">{{ briefOf(vendor.vendor, platform.code).coverage }}%</span>
                  <span
                    class="dpv-pop__pgap"
                    :class="{ 'is-clear': !briefOf(vendor.vendor, platform.code).todo }"
                  >
                    {{
                      briefOf(vendor.vendor, platform.code).declared
                        ? briefOf(vendor.vendor, platform.code).todo
                          ? `${briefOf(vendor.vendor, platform.code).todo} 项待实现`
                          : '无缺口'
                        : '未登记'
                    }}
                  </span>
                </div>
                <button
                  type="button"
                  class="dpv-pop__more"
                  @click="openCapabilityMatrix(vendor.vendor)"
                >
                  查看完整能力矩阵 →
                </button>
              </div>

              <div class="dpv-pop__list">
                <div
                  v-for="item in vendorEffects(vendor.vendor)"
                  :key="item.key"
                  class="dpv-pop__row"
                >
                  <span class="dpv-pop__label">{{ item.label }}</span>
                  <span class="dpv-pop__value" :class="{ 'is-off': !item.on }">{{ item.value }}</span>
                </div>
              </div>
              <p class="dpv-pop__foot">每套凭据各跑各的，未开启的能力不产生任务也不产生记录。</p>
            </div>
          </el-popover>

          <p v-if="!vendors.length" class="dpv-vendors__empty">
            未发现已注册的设备厂商，请确认后端 device 模块已启用。
          </p>
        </div>
      </header>

      <!-- ==================== 右：凭据表 + 底部条 ==================== -->
      <section class="dpv-work">
        <header class="dpv-work__head">
          <span class="dpv-bar" />
          <span class="dpv-work__title">接入凭据</span>
          <span class="dpv-count">{{ filteredCredentials.length }}</span>
          <button v-if="credentialFilter" type="button" class="dpv-filter" @click="clearVendorFilter">
            {{ vendorLabel(credentialFilter) }}
            <span class="dpv-filter__x">×</span>
          </button>
          <span class="dpv-grow" />
          <ReButton
            icon="Grid"
            size="small"
            :show-text="true"
            tip="平台能力矩阵：按平台查看支持 / 待实现的能力位与缺口原因"
            @click="openCapabilityMatrix()"
          >
            平台能力
            <span v-if="gapPlatformCount" class="dpv-gapbadge" :title="`${gapPlatformCount} 个平台还有待实现能力`">
              {{ gapPlatformCount }}
            </span>
          </ReButton>
          <ReButton
            icon="Connection"
            size="small"
            :show-text="true"
            :disabled="!filteredCredentials.length"
            :loading="testingAll"
            tip="按当前厂商过滤逐条探测连通性（最多 50 条）"
            @click="testAllCredentials"
          >
            全部检测
          </ReButton>
          <ReButton icon="Refresh" layout="square" size="small" tip="刷新" :loading="loading" @click="refreshAll" />
          <ReButton icon="Monitor" layout="square" size="small" tip="设备台账" @click="goLedger" />
        </header>

        <div class="dpv-panes">
          <div class="dpv-table-wrap">
            <ReTable
            class="dpv-table"
            table-id="device-provider-credentials"
            :data="tableRows"
            :columns="columns"
            :loading="loading"
            :pagination="false"
            :toolbar="false"
            row-key="deviceCredentialId"
            :layout-table="{ fill: true }"
            :settings="{ border: false, highlightCurrentRow: true }"
            stripe
            @row-click="onRowClick"
          >
            <template #col-credential="{ row }">
              <div class="dpv-cred">
                <div class="dpv-cred__top">
                  <span class="dpv-cred__name" :title="String(row.deviceCredentialName || '')">
                    {{ row.deviceCredentialName }}
                  </span>
                  <ReTag v-if="row.deviceCredentialIsDefault" size="small" effect="plain" type="warning">默认</ReTag>
                </div>
                <div class="dpv-cred__remark">{{ row.deviceCredentialRemark || '未填写备注' }}</div>
              </div>
            </template>

            <template #col-vendor="{ row }">
              <div class="dpv-cell dpv-cell--vendor">
                <span class="dpv-chip__tile dpv-chip__tile--sm" :data-vendor="row.deviceCredentialVendor">
                  {{ monogram(vendorLabel(String(row.deviceCredentialVendor || ''))) }}
                </span>
                <span class="dpv-cell__body">
                  <span class="dpv-cell__main">{{ vendorLabel(String(row.deviceCredentialVendor || '')) }}</span>
                  <span class="dpv-cell__sub">
                    <span class="dpv-cell__plat">
                      {{
                        platformLabel(
                          String(row.deviceCredentialVendor || ''),
                          row.deviceCredentialPlatformType as string | undefined
                        )
                      }}
                    </span>
                    <span
                      v-if="briefOf(String(row.deviceCredentialVendor || ''), row.deviceCredentialPlatformType as string | undefined).declared"
                      class="dpv-cov"
                      :class="{ 'is-gap': briefOf(String(row.deviceCredentialVendor || ''), row.deviceCredentialPlatformType as string | undefined).todo > 0 }"
                      :title="coverageTitle(String(row.deviceCredentialVendor || ''), row.deviceCredentialPlatformType as string | undefined)"
                    >
                      覆盖 {{ briefOf(String(row.deviceCredentialVendor || ''), row.deviceCredentialPlatformType as string | undefined).coverage }}%
                    </span>
                  </span>
                </span>
              </div>
            </template>

            <template #col-ak="{ row }">
              <span class="dpv-mono" :title="String(row.deviceCredentialAppKey || '')">
                {{ row.deviceCredentialAppKey || '—' }}
              </span>
            </template>

            <template #col-status="{ row }">
              <ReTag :type="row.deviceCredentialEnabled ? 'success' : 'info'" size="small" effect="plain">
                {{ row.deviceCredentialEnabled ? '启用' : '停用' }}
              </ReTag>
            </template>

            <template #col-health="{ row }">
              <span class="dpv-health-cell">
                <ReTag
                  v-if="row.deviceCredentialLastTestOk == null"
                  type="info"
                  size="small"
                  effect="plain"
                >
                  未检测
                </ReTag>
                <ReTag
                  v-else
                  :type="row.deviceCredentialLastTestOk ? 'success' : 'danger'"
                  size="small"
                  effect="plain"
                >
                  {{ row.deviceCredentialLastTestOk ? '正常' : '失败' }}
                </ReTag>
                <span class="dpv-time dpv-health-cell__at">
                  {{ formatDateTime(row.deviceCredentialLastTestAt as string | undefined) }}
                </span>
              </span>
            </template>

            <template #col-updated="{ row }">
              <span class="dpv-time">
                {{ formatDateTime(row.deviceCredentialUpdatedAt as string | undefined) }}
              </span>
            </template>

            <template #col-actions="{ row }">
              <span class="dpv-ops" @click.stop>
                <ReButton
                  layout="square"
                  type="primary"
                  size="small"
                  icon="Tickets"
                  tip="任务列表"
                  @click="openTaskDrawer(asCredential(row))"
                />
                <ReButton
                  layout="square"
                  type="primary"
                  size="small"
                  icon="Connection"
                  :loading="testingId === row.deviceCredentialId"
                  tip="测试连接"
                  @click="testCredential(asCredential(row))"
                />
                <ReButton
                  layout="square"
                  type="primary"
                  size="small"
                  icon="EditPen"
                  tip="编辑"
                  @click="openEdit(asCredential(row))"
                />
                <ReButton
                  layout="square"
                  type="danger"
                  size="small"
                  icon="Delete"
                  tip="删除"
                  @click="removeCredential(asCredential(row))"
                />
              </span>
            </template>

            <template #empty>
              <div class="dpv-ghost">
                <span class="dpv-ghost__icon"><ReIcon name="Connection" :size="20" /></span>
                <span class="dpv-ghost__title">
                  {{ credentialFilter ? '该厂商还没有接入凭据' : '还没有接入凭据' }}
                </span>
                <span class="dpv-ghost__text">
                  {{
                    credentialFilter
                      ? '同一厂商可以配置多套账号，按区域分别同步设备与组织。'
                      : '登记厂商平台的 AK/SK 后，就能同步设备、组织与通道。'
                  }}
                </span>
                <ReButton
                  icon="Plus"
                  size="small"
                  type="primary"
                  :show-text="true"
                  :disabled="!vendors.length"
                  @click="openCreate(credentialFilter || undefined)"
                >
                  新增凭据
                </ReButton>
              </div>
            </template>
          </ReTable>
        </div>

        <footer class="dpv-foot">
          <template v-if="activeCredential">
            <span class="dpv-foot__name" :title="activeCredential.deviceCredentialName">
              {{ activeCredential.deviceCredentialName }}
            </span>
            <ReTag v-if="activeCredential.deviceCredentialIsDefault" size="small" effect="plain" type="warning">默认</ReTag>
            <ReTag :type="activeCredential.deviceCredentialEnabled ? 'success' : 'info'" size="small" effect="plain">
              {{ activeCredential.deviceCredentialEnabled ? '启用' : '停用' }}
            </ReTag>
            <span class="dpv-foot__sep" />
            <span class="dpv-foot__item">
              <span class="dpv-foot__k">AK</span>
              <span class="dpv-mono">{{ activeCredential.deviceCredentialAppKey || '—' }}</span>
            </span>
            <span class="dpv-foot__item">
              <span class="dpv-foot__k">SK</span>
              <span class="dpv-mono">{{ secretText(activeCredential) }}</span>
            </span>
            <span class="dpv-foot__item dpv-foot__item--url">
              <span class="dpv-foot__k">Base URL</span>
              <span class="dpv-mono">{{ activeCredential.deviceCredentialBaseUrl || '平台默认' }}</span>
            </span>
            <span class="dpv-foot__item">
              <span class="dpv-foot__k">阈值</span>
              <span>{{ activeCredential.deviceCredentialOfflineThreshold ?? '—' }} 秒</span>
            </span>
            <span class="dpv-grow" />
            <span class="dpv-foot__tools">
              <ReButton
                v-if="syncEntry.device"
                layout="square"
                size="small"
                type="primary"
                icon="Refresh"
                :loading="credSyncLoading('device')"
                tip="同步设备"
                @click="syncCredential('device')"
              />
              <ReButton
                v-if="syncEntry.org"
                layout="square"
                size="small"
                type="primary"
                icon="Grid"
                :loading="credSyncLoading('org')"
                tip="同步组织"
                @click="syncCredential('org')"
              />
              <ReButton
                v-if="syncEntry.person"
                layout="square"
                size="small"
                type="primary"
                icon="User"
                :loading="credSyncLoading('person')"
                tip="同步人员"
                @click="syncCredential('person')"
              />
            </span>
            <ReButton
              icon="Connection"
              size="small"
              :show-text="true"
              :loading="testingId === activeCredential.deviceCredentialId"
              @click="testCredential(activeCredential)"
            >
              测试连接
            </ReButton>
            <ReButton size="small" @click="openEdit(activeCredential)">编辑</ReButton>
            <ReButton
              v-if="activeCredential"
              icon="Setting"
              size="small"
              :show-text="true"
              @click="openCapability(activeCredential)"
            >
              编辑能力
            </ReButton>
          </template>

          <template v-else>
            <span class="dpv-foot__name">共 {{ credentials.length }} 套凭据</span>
            <span class="dpv-foot__sep" />
            <span class="dpv-foot__item">启用 {{ enabledCount }}</span>
            <span class="dpv-foot__item">默认 {{ defaultCount }}</span>
            <span class="dpv-foot__item">厂商 {{ vendors.length }}</span>
            <span class="dpv-grow" />
            <span class="dpv-foot__hint">点选一条凭据，在这里查看 AK / SK / Base URL 与阈值</span>
          </template>
        </footer>
        </div>
      </section>
    </div>

    <!-- ==================== 凭据表单 ==================== -->
    <ReDialog
      v-model="dialogVisible"
      :title="editingCredentialId ? '编辑凭据' : '新增凭据'"
      width="640px"
      destroy-on-close
    >
      <!-- 四段式：选厂商 → 账号凭据 → 能力 → 任务（2026-11 改版） -->
      <ol class="dpv-steps" aria-label="凭据步骤">
        <li
          v-for="(step, i) in STEPS"
          :key="step.key"
          class="dpv-step"
          :class="{ 'is-active': stepIndex === i, 'is-done': stepIndex > i }"
          :data-step="i + 1"
        >
          <span class="dpv-step__idx">{{ i + 1 }}</span>
          <span class="dpv-step__label">{{ step.label }}</span>
        </li>
      </ol>

      <el-form :model="form" label-position="top" class="dpv-form">
        <!-- 第 1 段：厂商 / 平台 / 名称 —— 先定"接的是谁"，后面字段才有意义 -->
        <div v-show="stepIndex === 0" class="dpv-step-pane" data-pane="vendor">
        <div class="dpv-form__grid">
          <el-form-item label="厂商" required>
            <el-select v-model="form.deviceCredentialVendor" class="dpv-w" placeholder="选择厂商" @change="onVendorChange">
              <el-option
                v-for="vendor in vendors"
                :key="vendor.vendor"
                :label="vendor.name"
                :value="vendor.vendor"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="平台">
            <el-select
              v-model="form.deviceCredentialPlatformType"
              class="dpv-w"
              placeholder="SDK 直连"
              @change="onPlatformChange"
            >
              <el-option
                v-for="platform in currentPlatforms"
                :key="platform.code"
                :label="platform.name"
                :value="platform.code"
              />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="凭据名称" required>
          <el-input v-model="form.deviceCredentialName" maxlength="64" placeholder="例如：华东区域主账号" @keyup.enter="submit" />
        </el-form-item>
        </div>

        <!-- 第 2 段：账号凭据（字段由厂商描述符驱动） -->
        <div v-show="stepIndex === 1" class="dpv-step-pane" data-pane="secret">
        <div class="dpv-form__grid">
          <el-form-item
            v-for="field in currentCredentialFields"
            :key="field.key"
            :label="field.label"
            :required="fieldFormRequired(field)"
          >
            <!-- 密钥字段：掩码与「修改 / 取消」都收在输入框内（2026-11-07 反馈：按钮不要挂在框外）。
                 编辑态直接显示后端回传的掩码，不留空：空框会被当成「值丢了」。要换值再点框内的「修改」。 -->
            <div v-if="secretReadonly(field)" class="dpv-secret">
              <el-input
                :model-value="secretMaskText(field)"
                readonly
                class="dpv-w dpv-secret__mask"
                title="出于安全只显示掩码，点框内「修改」可填写新值"
              >
                <template #suffix>
                  <span class="dpv-secret__tag">已配置</span>
                  <button type="button" class="dpv-secret__act" @mousedown.prevent @click="startSecretEdit(field)">
                    修改
                  </button>
                </template>
              </el-input>
            </div>
            <div v-else class="dpv-secret">
              <el-input
                :model-value="fieldFormValue(field)"
                @update:model-value="(v: string) => form[fieldFormKey(field)] = v"
                :type="field.secret ? 'password' : 'text'"
                :show-password="field.secret"
                :maxlength="256"
                :placeholder="fieldPlaceholder(field)"
                @keyup.enter="submit"
                :class="['dpv-w', { 'dpv-secret__edit': field.secret && editingCredentialId }]"
              >
                <template v-if="field.secret && editingCredentialId" #suffix>
                  <button type="button" class="dpv-secret__act is-cancel" @mousedown.prevent @click="cancelSecretEdit(field)">
                    取消
                  </button>
                </template>
              </el-input>
            </div>
          </el-form-item>
        </div>
        <p class="dpv-form__hint">凭证由后端加密存储，接口不回传明文，编辑时显示的是掩码；点「修改」填写新值才会覆盖。字段由厂商描述符（credentialFields）驱动，新增厂商无需改前端。</p>

        <el-form-item v-if="isBaseUrlEditable" label="Base URL">
          <el-input v-model="form.deviceCredentialBaseUrl" maxlength="255" placeholder="留空使用平台默认地址" />
        </el-form-item>
        <p v-else class="dpv-form__hint">平台地址固定（官方网关），无需填写；综合安防（私有部署）、ISUP、GB28181 可自定义网关地址。</p>
        </div>

        <!-- 第 3 段：能力（04 配方 · 先选配方，再逐项微调） -->
        <div v-show="stepIndex === 2" class="dpv-step-pane" data-pane="capability">
          <div class="cap-recipes">
            <button
              v-for="recipe in CAP_RECIPES"
              :key="recipe.key"
              type="button"
              class="cap-recipe"
              :class="{ 'is-on': activeRecipe === recipe.key }"
              :data-recipe="recipe.key"
              @click="applyRecipe(recipe.key)"
            >
              <span class="cap-recipe__name">{{ recipe.name }}</span>
              <span class="cap-recipe__desc">{{ recipe.desc }}</span>
              <span class="cap-recipe__chips">
                <span v-for="cap in recipe.caps" :key="cap" class="cap-chip">{{ recipeCapLabel(cap) }}</span>
              </span>
            </button>
          </div>

          <ul class="cap-list">
            <li
              v-for="cap in CAP_ROWS"
              :key="cap.key"
              class="cap-row"
              :class="{ 'is-off': !capSupported(cap.key) }"
              :data-cap="cap.key"
            >
              <el-switch
                v-if="cap.enabledKey"
                :model-value="capEnabled(cap.key)"
                size="small"
                :disabled="!capSupported(cap.key)"
                @update:model-value="(value: string | number | boolean) => setCapability(cap.key, Boolean(value))"
              />
              <!-- 门禁记录抽取是全局时间轮任务（按全部凭据扫最近 10 分钟），
                   不属于单套凭据，因此不给开关，避免出现「拨了也不生效」的假开关 -->
              <span
                v-else
                class="cap-row__global"
                title="全局任务：由全局时间轮按 10 分钟时间窗抽取，不挂在单套凭据上"
              >
                全局
              </span>
              <span class="cap-row__text">
                <span class="cap-row__name">{{ cap.name }}</span>
                <span class="cap-row__desc">{{ cap.desc }}</span>
              </span>
              <span
                v-if="!capSupported(cap.key)"
                class="cap-row__na"
                :title="capabilityGapNote(cap)"
              >
                {{ capabilityGapNote(cap) }}
              </span>
              <code v-else class="cap-row__code">{{ cap.code }}</code>
            </li>
          </ul>

          <p class="cap-count">{{ enabledCapCount }} / {{ supportedCapCount }} 项能力已开启</p>
        </div>

        <!-- 第 4 段：任务（只列已开启的能力；圆圈倒计时是这一版的身份） -->
        <div v-show="stepIndex === 3" class="dpv-step-pane" data-pane="tasks">
          <div class="task-policy">
            <span class="task-policy__label">离线阈值</span>
            <el-input-number
              v-model="form.deviceCredentialOfflineThreshold"
              :min="5"
              :max="86400"
              :step="5"
              size="small"
              controls-position="right"
              class="task-policy__num"
            />
            <span class="task-policy__unit">秒</span>
            <span class="task-policy__sep" />
            <el-checkbox v-model="form.deviceCredentialIsDefault">设为厂商默认</el-checkbox>
            <el-checkbox v-model="form.deviceCredentialEnabled">启用</el-checkbox>
          </div>

          <div v-if="taskCards.length" class="task-grid">
            <article
              v-for="task in taskCards"
              :key="task.key"
              class="task-card"
              :class="{ 'is-running': task.running }"
              :data-task="task.key"
            >
              <div
                class="task-card__dial"
                :class="{ 'is-due': task.progress >= 1, 'is-idle': !task.hasRun }"
                :data-progress="task.progress.toFixed(2)"
                role="img"
                :aria-label="`${task.name} 间隔 ${task.interval} 秒`"
              >
                <svg class="task-card__svg" viewBox="0 0 96 96" aria-hidden="true">
                  <circle class="task-card__track" cx="48" cy="48" r="40" />
                  <circle
                    class="task-card__bar"
                    cx="48"
                    cy="48"
                    r="40"
                    :stroke-dasharray="DIAL_CIRC"
                    :stroke-dashoffset="taskOffset(task)"
                  />
                </svg>
                <span class="task-card__center">
                  <b>{{ task.interval }}</b>
                  <span class="task-card__unit">秒</span>
                </span>
              </div>

              <h4 class="task-card__name">{{ task.name }}</h4>
              <code class="task-card__code" :title="task.code">{{ task.code }}</code>

              <div class="task-card__step">
                <button type="button" class="task-step__btn" aria-label="减少间隔" @click="bumpInterval(task.key, -10)">−</button>
                <input
                  class="task-step__input"
                  type="number"
                  min="1"
                  max="86400"
                  :value="task.interval"
                  @change="onIntervalInput(task.key, ($event.target as HTMLInputElement).value)"
                />
                <button type="button" class="task-step__btn" aria-label="增加间隔" @click="bumpInterval(task.key, 10)">+</button>
              </div>

              <button
                type="button"
                class="task-card__run"
                :disabled="!editingCredentialId || task.running"
                :title="editingCredentialId ? '立即执行一次' : '保存后即可立即执行'"
                @click="runTaskNow(task)"
              >
                {{ task.running ? '执行中…' : '立即执行' }}
              </button>
              <span class="task-card__hint">{{ task.lastText }}</span>
            </article>
          </div>

          <p v-if="offTaskNames.length" class="task-note">
            未开启或不支持：{{ offTaskNames.join('、') }}。这些能力没有任务配置，也不会产生同步记录。
            <button type="button" class="task-note__link" @click="stepIndex = 2">去第 3 步调整</button>
          </p>

          <el-form-item label="备注">
            <el-input
              v-model="form.deviceCredentialRemark"
              type="textarea"
              :rows="2"
              maxlength="255"
              show-word-limit
              placeholder="选填，例如使用范围"
            />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dpv-wiz-foot">
          <span class="dpv-wiz-foot__step">第 {{ stepIndex + 1 }} / {{ STEPS.length }} 段 · {{ STEPS[stepIndex].label }}</span>
          <span class="dpv-grow" />
          <ReButton @click="dialogVisible = false">取消</ReButton>
          <ReButton v-if="stepIndex > 0" @click="stepIndex -= 1">上一步</ReButton>
          <ReButton v-if="stepIndex < STEPS.length - 1" type="primary" @click="nextStep">下一步</ReButton>
          <ReButton v-else type="primary" :loading="submitting" @click="submit">
            {{ editingCredentialId ? '保存' : '创建' }}
          </ReButton>
        </div>
      </template>
    </ReDialog>

    <!-- ==================== 厂商任务抽屉（行操作「任务列表」） ==================== -->
    <ReDrawer v-model="taskDrawerVisible" :title="taskDrawerTitle" size="780px" footer-hidden>
      <ReVendorTaskPanel
        v-if="taskDrawerVendor"
        :vendors="vendors"
        :credentials="credentials"
        :vendor="taskDrawerVendor"
      />
    </ReDrawer>

    <!-- ==================== 平台能力矩阵抽屉 ==================== -->
    <ReDrawer v-model="capabilityVisible" title="平台能力矩阵" size="1040px" footer-hidden>
      <div v-if="capabilityLoading" class="dpv-cap-loading">
        <span class="dpv-cap-loading__bar" />
        正在读取平台能力矩阵…
      </div>
      <RePlatformCapabilityPanel
        v-else
        :vendors="vendors"
        :matrix="capabilityMatrix"
        :dictionary="capabilityDictionary"
        :focus-vendor="capabilityFocusVendor"
        @create="onCapabilityCreate"
      />
    </ReDrawer>
  </div>
</template>

<script setup lang="ts">
/**
 * 提供商配置（Deck 布局，对齐设备资产页）
 *
 * 左侧厂商导轨按厂商归档凭据，右侧 ReTable 列出接入凭据；底部常驻条展示
 * 选中凭据的 AK / SK / Base URL / 阈值，并就近提供「测试连接 / 编辑」。
 *
 * 交互约定：
 *   - 点厂商只切换过滤（点「全部厂商」清空），不重新请求；
 *   - 点凭据行只选中，底部条跟随；每行仍有测试 / 编辑 / 删除；
 *   - 厂商能力用 12 点阵表示（设备 / 通道 / 视频 / 录像 / 云台 / 事件 / 门禁 / 组织 / 人员 / 抓图 / 指标 / 停车），
 *     悬停有完整清单与「按平台」的能力覆盖率（厂商并集只能粗判）；
 *
 * 数据仍是一次性全量拉取 + 前端过滤：厂商数、凭据数、启用 / 默认计数在过滤态下
 * 也必须稳定，交给后端过滤会让左栏统计随筛选跳变。
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { message } from '@repo/core'
import ReButton from '@repo/ui/re-button'
import ReDialog from '@repo/ui/re-dialog'
import ReDrawer from '@repo/ui/re-drawer'
import ReIcon from '@repo/ui/re-icon'
import ReTable from '@repo/ui/re-table'
import type { ReTableColumn } from '@repo/ui/re-table'
import ReTag from '@repo/ui/re-tag'
import RePlatformCapabilityPanel from '../components/RePlatformCapabilityPanel.vue'
import ReVendorTaskPanel from '../components/ReVendorTaskPanel.vue'

import { deviceApi } from '../api/deviceApi'
import { formatDateTime } from '../utils/deviceFormat'
import type {
  CapabilityCell,
  CredentialFieldDescriptor,
  DeviceCapability,
  DeviceVendorDescriptor,
  PlatformCapabilityMatrix,
  ProviderCredential,
  SyncResult
} from '../types/device'

const router = useRouter()

/** 能力固定顺序：厂商胶囊点阵的列位与 tooltip 文案都按它来；共 12 位（6×2 点阵） */
const CAP_ORDER: DeviceCapability[] = [
  'DEVICE',
  'CHANNEL',
  'MEDIA',
  'RECORD',
  'PTZ',
  'EVENT',
  'ACCESS',
  'ORG',
  'PERSON',
  'CAPTURE',
  'METRIC',
  'PARKING'
]

const vendors = ref<DeviceVendorDescriptor[]>([])
/** 全量凭据（不再带 vendor 查参，过滤在前端做，统计才稳定） */
const credentials = ref<ProviderCredential[]>([])
const credentialFilter = ref('')
const loading = ref(false)

/* ==================== 平台能力矩阵（平台 × 能力位，四态） ==================== */
/** 能力矩阵抽屉：从顶部工具条打开，或从某个厂商的胶囊进入时预选该厂商 */
const capabilityVisible = ref(false)
const capabilityFocusVendor = ref('')
const capabilityLoading = ref(false)
/** 平台标识（vendor.platform）→ 能力矩阵 */
const capabilityMatrix = ref<Record<string, PlatformCapabilityMatrix>>({})
/** 能力位字典（后端给编码 + 展示名） */
const capabilityDictionary = ref<Array<{ code: DeviceCapability; name: string }>>([])

const dialogVisible = ref(false)
const submitting = ref(false)
const testingId = ref('')
const editingCredentialId = ref('')

/** 任务抽屉：按行操作打开，只显示该厂商自己的任务 */
const taskDrawerVisible = ref(false)
const taskDrawerVendor = ref('')
const taskDrawerTitle = computed(() => {
  const name = vendors.value.find((item) => item.vendor === taskDrawerVendor.value)?.name
  return name ? `「${name}」任务列表` : '任务列表'
})

/**
 * 新增 / 编辑凭据的四段式步骤（2026-11 改版）。
 *
 * <p>第 3 段定「这台实例开哪些能力」，第 4 段只为已开启的能力配任务；
 * 没开启的能力不生成任务配置，也不产生同步记录。</p>
 */
const STEPS = [
  { key: 'vendor', label: '厂商与平台' },
  { key: 'secret', label: '账号凭据' },
  { key: 'capability', label: '能力' },
  { key: 'tasks', label: '任务' }
] as const

/** 当前段位（0 起），打开弹窗时回到第 1 段 */
const stepIndex = ref(0)

/** 底部条跟随的凭据 */
const activeCredentialId = ref('')

/** 凭据表单：描述符字段通过索引签名回填到同一 object 里 */
interface FormPayload extends ProviderCredential {
  [key: string]: unknown
}

const form = reactive<FormPayload>({
  deviceCredentialVendor: '',
  deviceCredentialPlatformType: '',
  deviceCredentialName: '',
  deviceCredentialAppKey: '',
  deviceCredentialAppSecret: '',
  deviceCredentialBaseUrl: '',
  deviceCredentialProductCode: '',
  deviceCredentialProjectId: '',
  deviceCredentialGroupNo: '',
  deviceCredentialOfflineThreshold: 60,
  deviceCredentialIsDefault: false,
  deviceCredentialEnabled: true,
  deviceCredentialOfflineDetectEnabled: false,
  deviceCredentialOfflineDetectInterval: 30,
  deviceCredentialEventPollEnabled: false,
  deviceCredentialEventPollInterval: 60,
  deviceCredentialDeviceSyncEnabled: false,
  deviceCredentialDeviceSyncInterval: 300,
  deviceCredentialOrgSyncEnabled: false,
  deviceCredentialOrgSyncInterval: 600,
  deviceCredentialMetricCollectEnabled: false,
  deviceCredentialMetricCollectInterval: 60,
  deviceCredentialRemark: ''
})

/* ==================== 能力（第 3 段） ==================== */
/** 能力行：开关绑定的表单字段 + 依托的厂商能力位 + 任务名前缀 */
type CapKey = 'offline' | 'event' | 'deviceSync' | 'orgSync' | 'metric' | 'access'

interface CapRow {
  key: CapKey
  name: string
  desc: string
  capability: DeviceCapability
  code: string
  enabledKey?: keyof FormPayload
  intervalKey?: keyof FormPayload
  taskPrefix?: string
  defaultInterval?: number
}

const CAP_ROWS: CapRow[] = [
  {
    key: 'offline',
    name: '在离线检测',
    desc: '按间隔探测设备连通性，掉线即标记离线并尝试重连。',
    capability: 'DEVICE',
    code: 'DEVICE',
    enabledKey: 'deviceCredentialOfflineDetectEnabled',
    intervalKey: 'deviceCredentialOfflineDetectInterval',
    taskPrefix: 'offlineDetect',
    defaultInterval: 30
  },
  {
    key: 'event',
    name: '事件轮询',
    desc: '从厂商会话拉取移动侦测、报警等事件并落库。',
    capability: 'EVENT',
    code: 'EVENT',
    enabledKey: 'deviceCredentialEventPollEnabled',
    intervalKey: 'deviceCredentialEventPollInterval',
    taskPrefix: 'eventPoll',
    defaultInterval: 60
  },
  {
    key: 'deviceSync',
    name: '设备同步',
    desc: '拉取厂商设备目录，按外部 ID 幂等写入设备台账。',
    capability: 'DEVICE',
    code: 'DEVICE',
    enabledKey: 'deviceCredentialDeviceSyncEnabled',
    intervalKey: 'deviceCredentialDeviceSyncInterval',
    taskPrefix: 'deviceSync',
    defaultInterval: 300
  },
  {
    key: 'orgSync',
    name: '组织同步',
    desc: '拉取厂商组织树与人员，落到组织与人员表。',
    capability: 'ORG',
    code: 'ORG',
    enabledKey: 'deviceCredentialOrgSyncEnabled',
    intervalKey: 'deviceCredentialOrgSyncInterval',
    taskPrefix: 'orgSync',
    defaultInterval: 600
  },
  {
    key: 'metric',
    name: '环境指标采集',
    desc: '按间隔读取气象站/传感器节点，更新最新指标快照。',
    capability: 'METRIC',
    code: 'METRIC',
    enabledKey: 'deviceCredentialMetricCollectEnabled',
    intervalKey: 'deviceCredentialMetricCollectInterval',
    taskPrefix: 'metricCollect',
    defaultInterval: 60
  },
  {
    key: 'access',
    name: '门禁记录抽取',
    desc: '按时间窗抽取门禁出入记录，补进门禁记录台账。',
    capability: 'ACCESS',
    code: 'ACCESS'
  }
]

/** 预设配方：先选一个常见组合，再逐项微调 */
const CAP_RECIPES: Array<{ key: string; name: string; desc: string; caps: CapKey[] }> = [
  { key: 'basic', name: '基础台账', desc: '只把设备接进来，并保持在线状态。', caps: ['offline', 'deviceSync'] },
  { key: 'org', name: '台账 + 组织', desc: '设备与组织一起同步，人员挂到组织下。', caps: ['offline', 'deviceSync', 'orgSync'] },
  { key: 'full', name: '全量巡检', desc: '设备、组织、事件一起跑，适合值守场景。', caps: ['offline', 'event', 'deviceSync', 'orgSync'] },
  { key: 'climate', name: '气象采集', desc: '气象/传感器设备按间隔采集环境指标。', caps: ['offline', 'deviceSync', 'metric'] }
]

const DIAL_CIRC = 2 * Math.PI * 40

/** 当前平台是否具备某能力位（不具备的开关置灰，且不生成任务） */
function capSupported(key: CapKey): boolean {
  const row = CAP_ROWS.find((item) => item.key === key)
  if (!row) return false
  return platformCapabilities.value.includes(row.capability)
}

/**
 * 能力不可用的原因，直接取能力矩阵的 note。
 *
 * <p>比「当前平台未开通X接口」有用：能说清是官方没有（云睿无视频套件）、
 * 还是接口存在但字段未取证。矩阵还没加载时退回通用文案。</p>
 *
 * @param row 能力行
 * @returns 展示文案
 */
function capabilityGapNote(row: CapRow): string {
  const vendor = form.deviceCredentialVendor
  const platform = form.deviceCredentialPlatformType
  const cell: CapabilityCell | undefined =
    vendor && platform ? capabilityMatrix.value[`${vendor}.${platform}`]?.cells?.[row.capability] : undefined
  if (cell && (cell.support === 'TODO' || cell.support === 'NO') && cell.note) return cell.note
  return `当前平台未开放${row.name}接口`
}

/** 能力开关的当前值 */
function capEnabled(key: CapKey): boolean {
  const row = CAP_ROWS.find((item) => item.key === key)
  if (!row?.enabledKey) return false
  return Boolean(form[row.enabledKey])
}

/** 点开关：不支持的能力不允许开；开启时把间隔补成该能力的默认值 */
function setCapability(key: CapKey, value: boolean): void {
  const row = CAP_ROWS.find((item) => item.key === key)
  if (!row?.enabledKey || !capSupported(key)) return
  form[row.enabledKey] = value
  if (value && row.intervalKey && row.defaultInterval) {
    const current = Number(form[row.intervalKey] || 0)
    if (!Number.isFinite(current) || current <= 0) form[row.intervalKey] = row.defaultInterval
  }
}

/** 当前配方（开关集合与某个预设完全一致时高亮） */
const activeRecipe = computed<string>(() => {
  const enabled = new Set(CAP_ROWS.filter((row) => capEnabled(row.key)).map((row) => row.key))
  const hit = CAP_RECIPES.find(
    (recipe) => recipe.caps.length === enabled.size && recipe.caps.every((key) => enabled.has(key))
  )
  return hit?.key || ''
})

/** 套用配方：只动当前厂商支持的能力，避免把不支持的能力打开 */
function applyRecipe(key: string): void {
  const recipe = CAP_RECIPES.find((item) => item.key === key)
  if (!recipe) return
  for (const row of CAP_ROWS) {
    if (!row.enabledKey) continue
    const shouldOn = recipe.caps.includes(row.key) && capSupported(row.key)
    form[row.enabledKey] = shouldOn
    if (shouldOn && row.intervalKey && row.defaultInterval) {
      const current = Number(form[row.intervalKey] || 0)
      if (!Number.isFinite(current) || current <= 0) form[row.intervalKey] = row.defaultInterval
    }
  }
}

function recipeCapLabel(key: CapKey): string {
  return CAP_ROWS.find((item) => item.key === key)?.name || key
}

/** 按凭据开启的能力行（门禁记录抽取是全局任务，不参与分母） */
const credentialCapRows = computed(() => CAP_ROWS.filter((row) => row.enabledKey))

const enabledCapCount = computed(() =>
  credentialCapRows.value.filter((row) => capSupported(row.key) && capEnabled(row.key)).length
)
const supportedCapCount = computed(() => credentialCapRows.value.filter((row) => capSupported(row.key)).length)

/** 第 4 段的「未开启或不支持」清单（只列按凭据配的能力） */
const offTaskNames = computed<string[]>(() =>
  credentialCapRows.value
    .filter((row) => !capSupported(row.key) || !capEnabled(row.key))
    .map((row) => (capSupported(row.key) ? row.name : `${row.name}（平台未开放）`))
)

/* ==================== 任务（第 4 段） ==================== */
interface TaskStateRow {
  deviceTaskStateName: string
  deviceTaskStateRunning: boolean
  deviceTaskStateLastRunAt?: string
  deviceTaskStateInterval?: number
}

const taskStates = ref<TaskStateRow[]>([])
const now = ref(Date.now())
const runningTask = ref('')
let ticker: ReturnType<typeof setInterval> | undefined

interface TaskCard {
  key: CapKey
  name: string
  code: string
  taskName: string
  interval: number
  running: boolean
  hasRun: boolean
  progress: number
  lastText: string
}

/** 任务卡：只出现已开启且厂商支持的能力；未保存的凭据没有真实任务名 */
const taskCards = computed<TaskCard[]>(() => {
  const credId = editingCredentialId.value
  return CAP_ROWS.filter((row) => row.taskPrefix && row.intervalKey && capSupported(row.key) && capEnabled(row.key)).map(
    (row) => {
      const taskName = credId ? `${row.taskPrefix}_${credId}` : ''
      const state = taskName ? taskStates.value.find((item) => item.deviceTaskStateName === taskName) : undefined
      const interval = Number(form[row.intervalKey as keyof FormPayload] || row.defaultInterval || 30)
      const last = state?.deviceTaskStateLastRunAt
      let progress = 0
      if (state?.deviceTaskStateRunning) progress = 1
      else if (last) {
        const lastMs = new Date(last).getTime()
        if (Number.isFinite(lastMs)) progress = Math.min(1, Math.max(0, (now.value - lastMs) / (interval * 1000)))
      }
      return {
        key: row.key,
        name: row.name,
        code: taskName || `${row.taskPrefix}_（保存后生成）`,
        taskName,
        interval,
        running: Boolean(state?.deviceTaskStateRunning) || runningTask.value === row.key,
        hasRun: Boolean(last),
        progress,
        lastText: last ? `上次 ${formatDateTime(last)}` : '尚未执行'
      }
    }
  )
})

function taskOffset(card: TaskCard): number {
  return DIAL_CIRC * (1 - card.progress)
}

/** 间隔步进：夹在 1 ~ 86400 秒 */
function setIntervalByKey(key: CapKey, value: number): void {
  const row = CAP_ROWS.find((item) => item.key === key)
  if (!row?.intervalKey) return
  const next = Math.min(86400, Math.max(1, Math.round(Number(value) || 0)))
  form[row.intervalKey] = next
}

function bumpInterval(key: CapKey, delta: number): void {
  const card = taskCards.value.find((item) => item.key === key)
  if (!card) return
  setIntervalByKey(key, card.interval + delta)
}

function onIntervalInput(key: CapKey, raw: string): void {
  setIntervalByKey(key, Number(raw))
}

async function runTaskNow(card: TaskCard): Promise<void> {
  if (!card.taskName) return
  runningTask.value = card.key
  try {
    const ok = await deviceApi.runTask(card.taskName)
    if (ok) message.success(`已触发「${card.name}」`)
    else message.warning(`「${card.name}」没有对应的执行入口或执行失败`)
    await fetchTaskStates()
  } catch (err) {
    message.error('立即执行失败：' + errorText(err))
  } finally {
    runningTask.value = ''
  }
}

/* ==================== 厂商同步效果（悬停 popover） ==================== */
const vendorStats = reactive<Record<string, { total: number; online: number }>>({})

function vendorLastRun(vendor: string, prefix: string): string | undefined {
  const credIds = new Set(credentialsOf(vendor).map((item) => item.deviceCredentialId || ''))
  let latest = 0
  for (const state of taskStates.value) {
    if (!state.deviceTaskStateName.startsWith(`${prefix}_`)) continue
    const credId = state.deviceTaskStateName.slice(prefix.length + 1)
    if (!credIds.has(credId) || !state.deviceTaskStateLastRunAt) continue
    const ms = new Date(state.deviceTaskStateLastRunAt).getTime()
    if (Number.isFinite(ms) && ms > latest) latest = ms
  }
  return latest ? new Date(latest).toISOString() : undefined
}

function vendorEffects(vendor: string): Array<{ key: string; label: string; on: boolean; value: string }> {
  const descriptor = vendors.value.find((item) => item.vendor === vendor)
  const caps = descriptor?.capabilities || []
  const stats = vendorStats[vendor]
  const out: Array<{ key: string; label: string; on: boolean; value: string }> = []
  const push = (key: string, label: string, prefix: string) => {
    const last = vendorLastRun(vendor, prefix)
    out.push({
      key,
      label,
      on: Boolean(last),
      value: last ? `上次 ${formatDateTime(last)}` : '未开启'
    })
  }
  if (caps.includes('DEVICE')) {
    push('offline', '在离线检测', 'offlineDetect')
    out.push({
      key: 'devices',
      label: '设备同步',
      on: Boolean(stats),
      value: stats ? `${stats.total} 台 · 在线 ${stats.online}` : '未同步'
    })
  }
  if (caps.includes('EVENT')) push('event', '事件轮询', 'eventPoll')
  if (caps.includes('ORG')) push('org', '组织同步', 'orgSync')
  if (caps.includes('METRIC')) push('metric', '环境指标', 'metricCollect')
  return out
}

async function fetchTaskStates(): Promise<void> {
  try {
    taskStates.value = (await deviceApi.listTaskStates()) as unknown as TaskStateRow[]
  } catch {
    taskStates.value = []
  }
}

async function fetchVendorStats(): Promise<void> {
  for (const vendor of vendors.value) {
    try {
      const stats = await deviceApi.stats({ vendor: vendor.vendor })
      vendorStats[vendor.vendor] = { total: stats.total, online: stats.online }
    } catch {
      // 统计失败不影响主流程，popover 里显示「未同步」
    }
  }
}

/** 行内「任务列表」→ 只显示该厂商的任务 */
function openTaskDrawer(row: ProviderCredential): void {
  taskDrawerVendor.value = row.deviceCredentialVendor
  taskDrawerVisible.value = true
}

const currentVendor = computed(() =>
  vendors.value.find((item) => item.vendor === form.deviceCredentialVendor)
)
const currentPlatforms = computed(() => currentVendor.value?.platforms || [])
/** 当前选中的平台描述符：能力开关必须按平台判断，不能按厂商并集判断 */
const currentPlatform = computed(() =>
  currentPlatforms.value.find((item) => item.code === form.deviceCredentialPlatformType)
)
/**
 * 当前平台支持的能力位。
 *
 * <p>优先取平台级 capabilities（后端由能力矩阵派生）；旧数据没有该字段时才回退到
 * 厂商级并集。平台级是空数组也是有效值 —— 那表示该平台一项都还没实现，
 * 不能因为「空」就退回厂商并集，否则会把别的平台的能力借过来。</p>
 */
const platformCapabilities = computed<DeviceCapability[]>(() => {
  const platform = currentPlatform.value
  if (platform && Array.isArray(platform.capabilities)) return platform.capabilities
  return currentVendor.value?.capabilities || []
})

/** 描述符字段 key → form 属性名（字段名以 deviceCredential 为前缀） */
const CREDENTIAL_FIELD_BIND: Record<string, string> = {
  appKey: 'deviceCredentialAppKey',
  appSecret: 'deviceCredentialAppSecret',
  productCode: 'deviceCredentialProductCode',
  projectId: 'deviceCredentialProjectId',
  groupNo: 'deviceCredentialGroupNo',
  baseUrl: 'deviceCredentialBaseUrl'
}

/** 描述符字段 → form 中绑定的属性名 */
function fieldFormKey(field: CredentialFieldDescriptor): string {
  return CREDENTIAL_FIELD_BIND[field.key]
    ?? `deviceCredential${field.key.charAt(0).toUpperCase() + field.key.slice(1)}`
}

/** 字段的只读值 */
function fieldFormValue(field: CredentialFieldDescriptor): string {
  return String(form[fieldFormKey(field)] ?? '')
}

/** 字段占位文案：编辑态点开「修改」后提示填新值，新建时用描述符自带的提示 */
function fieldPlaceholder(field: CredentialFieldDescriptor): string {
  if (field.secret && editingCredentialId.value) return `输入新的${field.label}`
  return field.placeholder || ''
}

/** 正在改写的密钥字段（key → true）；未点「修改」时显示掩码 */
const secretEditing = reactive<Record<string, boolean>>({})

/**
 * 密钥字段是否处于「显示掩码」的只读态。
 *
 * <p>编辑已有凭据时，密钥框直接显示 {@code sn****nkfV} 这样的掩码，而不是空框——
 * 空框会被当成「值丢了」（2026-11-07 反馈）。点「修改」才切成可输入。</p>
 *
 * @param field 描述符字段
 * @returns true 表示只读展示掩码
 */
function secretReadonly(field: CredentialFieldDescriptor): boolean {
  if (!field.secret || !editingCredentialId.value) return false
  if (secretEditing[field.key]) return false
  return !!secretMaskText(field)
}

/**
 * 只读态展示的掩码文本。
 *
 * @param field 描述符字段
 * @returns 掩码；后端只给了「已配置」标记时退化为该标记
 */
function secretMaskText(field: CredentialFieldDescriptor): string {
  const masked = String((form as Record<string, unknown>).deviceCredentialAppSecretMasked ?? '')
  if (masked) return masked
  return form.deviceCredentialAppSecretConfigured ? '已配置（不显示明文）' : ''
}

/** 点「修改」：清空输入框，切成可编辑 */
function startSecretEdit(field: CredentialFieldDescriptor): void {
  form[fieldFormKey(field)] = ''
  secretEditing[field.key] = true
}

/** 点「取消」：丢掉输入，回到掩码展示（不提交即保持原值） */
function cancelSecretEdit(field: CredentialFieldDescriptor): void {
  form[fieldFormKey(field)] = ''
  secretEditing[field.key] = false
}

/** 重置所有密钥字段的「修改中」标记（打开弹窗时调用，避免上一次的编辑态残留） */
function resetSecretEditing(): void {
  for (const key of Object.keys(secretEditing)) delete secretEditing[key]
}

/** 字段是否必填（编辑时密钥留空即不修改） */
function fieldFormRequired(field: CredentialFieldDescriptor): boolean {
  if (!field.required) return false
  if (editingCredentialId.value && field.secret) return false
  return true
}

/** 当前平台描述符驱动的字段（不再写死 AK / SK） */
const currentCredentialFields = computed<CredentialFieldDescriptor[]>(
  () =>
    currentVendor.value?.platforms.find((item) => item.code === form.deviceCredentialPlatformType)
      ?.credentialFields || []
)

/**
 * 是否允许自定义网关地址。
 *
 * 平台的官方网关是固定地址，放开改写会直接打断调用，所以只对「综合安防」
 * （私有部署，需要填自己的 artemis 网关 IP/域名）展示 Base URL 输入框，
 * 其余平台一律锁定为官方地址。
 */
const isBaseUrlEditable = computed(() => {
  const platform = form.deviceCredentialPlatformType
  return (
    platform === 'secure-platform' ||
    platform === 'isup' ||
    platform === 'gb28181' ||
    platform === 'sennor-cloud'
  )
})

/** 凭据维度同步的加载态（device / org / person） */
const syncLoading = reactive({ device: false, org: false, person: false })

/** 当前过滤的厂商（「全部」时为 null） */
const activeVendor = computed(() =>
  vendors.value.find((item) => item.vendor === credentialFilter.value) || null
)

/** 过滤后的凭据（列表与底部条取值的唯一来源） */
const filteredCredentials = computed<ProviderCredential[]>(() => {
  if (!credentialFilter.value) return credentials.value
  return credentials.value.filter((item) => item.deviceCredentialVendor === credentialFilter.value)
})

const activeCredential = computed<ProviderCredential | null>(
  () => credentials.value.find((item) => item.deviceCredentialId === activeCredentialId.value) || null
)

const enabledCount = computed(() => credentials.value.filter((item) => item.deviceCredentialEnabled !== false).length)
const defaultCount = computed(() => credentials.value.filter((item) => item.deviceCredentialIsDefault).length)

/* ==================== 连通性健康（单条测试 / 全部检测共用留痕） ==================== */
const testingAll = ref(false)

/** 当前过滤范围内的健康分布：正常 / 失败 / 未检测 */
const okCount = computed(
  () => filteredCredentials.value.filter((item) => item.deviceCredentialLastTestOk === true).length
)
const failCount = computed(
  () => filteredCredentials.value.filter((item) => item.deviceCredentialLastTestOk === false).length
)
const untestedCount = computed(
  () => filteredCredentials.value.filter((item) => item.deviceCredentialLastTestOk == null).length
)
const healthSummaryTitle = computed(
  () => `连通性：正常 ${okCount.value} · 失败 ${failCount.value} · 未检测 ${untestedCount.value}`
)

/* ==================== 凭据表（ReTable） ==================== */
/** ReTable 只收 Record 数组，真实结构是 ProviderCredential */
const tableRows = computed<Array<Record<string, unknown>>>(
  () => filteredCredentials.value as unknown as Array<Record<string, unknown>>
)

const columns: ReTableColumn[] = [
  { prop: 'deviceCredentialName', label: '凭据名称', slot: 'credential', minWidth: 230 },
  { prop: 'deviceCredentialVendor', label: '厂商 / 平台', slot: 'vendor', minWidth: 190 },
  { prop: 'deviceCredentialAppKey', label: 'AK', slot: 'ak', minWidth: 160 },
  {
    prop: 'deviceCredentialOfflineThreshold',
    label: '阈值',
    width: 84,
    align: 'center',
    formatter: (row) =>
      row.deviceCredentialOfflineThreshold == null ? '—' : `${row.deviceCredentialOfflineThreshold} 秒`
  },
  { prop: 'deviceCredentialEnabled', label: '状态', slot: 'status', width: 84 },
  { prop: 'deviceCredentialHealth', label: '健康', slot: 'health', minWidth: 132 },
  { prop: 'deviceCredentialUpdatedAt', label: '更新时间', slot: 'updated', minWidth: 140 },
  { prop: 'deviceCredentialActions', label: '操作', slot: 'actions', width: 158, fixed: 'right' }
]

function asCredential(row: Record<string, unknown>): ProviderCredential {
  return row as unknown as ProviderCredential
}

function onRowClick(row: Record<string, unknown>): void {
  activeCredentialId.value = String(row.deviceCredentialId || '')
}

/** 过滤变化 / 刷新后把选中态落回列表里的第一条，避免底部条指向不存在的行 */
function syncActiveCredential(): void {
  const list = filteredCredentials.value
  if (list.some((item) => item.deviceCredentialId === activeCredentialId.value)) return
  activeCredentialId.value = list[0]?.deviceCredentialId || ''
}

watch(credentialFilter, syncActiveCredential)

/* ==================== 展示辅助 ==================== */
function capabilityLabel(cap: DeviceCapability): string {
  const labels: Record<DeviceCapability, string> = {
    DEVICE: '设备',
    DEVICE_WRITE: '设备写',
    CHANNEL: '通道',
    MEDIA: '视频',
    RECORD: '录像',
    PTZ: '云台',
    EVENT: '事件',
    ACCESS: '门禁',
    ACCESS_WRITE: '门禁写',
    ORG: '组织',
    ORG_WRITE: '组织写',
    PERSON: '人员',
    PERSON_WRITE: '人员写',
    CAPTURE: '抓图',
    METRIC: '指标',
    PARKING: '停车'
  }
  return labels[cap] || cap
}

/** 厂商首字（中文取首字，英文取首字母） */
function monogram(name?: string): string {
  const text = (name || '').trim()
  return text ? text.slice(0, 1) : '?'
}

/** 12 点阵的悬浮清单：支持 / 不支持都写清楚，避免只靠颜色猜 */
function capabilityTitle(vendor: DeviceVendorDescriptor): string {
  return CAP_ORDER.map((cap) => `${capabilityLabel(cap)}${vendor.capabilities.includes(cap) ? ' ✓' : ' ✗'}`).join(
    ' · '
  )
}

function vendorLabel(vendor?: string): string {
  if (!vendor) return '—'
  return vendors.value.find((item) => item.vendor === vendor)?.name || vendor
}

function platformLabel(vendor: string, platform?: string): string {
  if (!platform) return 'SDK 直连'
  const descriptor = vendors.value.find((item) => item.vendor === vendor)
  return descriptor?.platforms.find((item) => item.code === platform)?.name || platform
}

function credentialsOf(vendor: string): ProviderCredential[] {
  return credentials.value.filter((item) => item.deviceCredentialVendor === vendor)
}

function secretText(row: ProviderCredential): string {
  if (row.deviceCredentialAppSecretMasked) return row.deviceCredentialAppSecretMasked
  return row.deviceCredentialAppSecretConfigured ? '已配置' : '未配置'
}

/* ==================== 过滤 ==================== */
function filterByVendor(vendor: string): void {
  credentialFilter.value = credentialFilter.value === vendor ? '' : vendor
}

function clearVendorFilter(): void {
  credentialFilter.value = ''
}

/* ==================== 数据 ==================== */
/** 平台能力摘要：覆盖率与缺口数，供厂商 popover 与凭据表复用 */
interface PlatformBrief {
  /** 是否在能力矩阵里登记过 */
  declared: boolean
  /** 已实现（支持 + 未验证）占「官方支持能力」的百分比 */
  coverage: number
  /** 已验证支持格数 */
  yes: number
  /** 已实现未验证格数 */
  unverified: number
  /** 待实现格数 */
  todo: number
}

const EMPTY_BRIEF: PlatformBrief = { declared: false, coverage: 0, yes: 0, unverified: 0, todo: 0 }

/** 平台标识 → 摘要（矩阵不变就不重算） */
const platformBriefs = computed<Map<string, PlatformBrief>>(() => {
  const map = new Map<string, PlatformBrief>()
  for (const [key, entry] of Object.entries(capabilityMatrix.value)) {
    let yes = 0
    let unverified = 0
    let todo = 0
    for (const cell of Object.values(entry.cells || {})) {
      if (!cell) continue
      if (cell.support === 'YES') yes += 1
      else if (cell.support === 'IMPLEMENTED_UNVERIFIED') unverified += 1
      else if (cell.support === 'TODO') todo += 1
    }
    const supported = yes + unverified + todo
    map.set(key, {
      declared: true,
      coverage: supported ? Math.round(((yes + unverified) / supported) * 100) : 0,
      yes,
      unverified,
      todo
    })
  }
  return map
})

/** 取某条凭据所属平台的摘要（SDK 直连没有平台矩阵，返回未登记） */
function briefOf(vendor: string, platform?: string | null): PlatformBrief {
  if (!vendor || !platform) return EMPTY_BRIEF
  return platformBriefs.value.get(`${vendor}.${platform}`) || EMPTY_BRIEF
}

/** 覆盖率悬浮说明：把三档拆开，避免只看一个百分比 */
function coverageTitle(vendor: string, platform?: string | null): string {
  const brief = briefOf(vendor, platform)
  if (!brief.declared) return ''
  return `能力覆盖 ${brief.coverage}%：已验证支持 ${brief.yes} · 已实现未验证 ${brief.unverified} · 待实现 ${brief.todo}`
}

/** 顶部工具条的缺口角标：还有待实现能力的平台数 */
const gapPlatformCount = computed(() => {
  let count = 0
  for (const entry of Object.values(capabilityMatrix.value)) {
    if (Object.values(entry.cells || {}).some((cell) => cell?.support === 'TODO')) count += 1
  }
  return count
})

/** 拉取平台能力矩阵与能力位字典 */
async function fetchCapabilityMatrix(): Promise<void> {
  capabilityLoading.value = true
  try {
    const [matrix, dictionary] = await Promise.all([
      deviceApi.listCapabilityMatrix(),
      deviceApi.listCapabilityDictionary()
    ])
    capabilityMatrix.value = matrix || {}
    capabilityDictionary.value = dictionary || []
  } catch (err) {
    capabilityMatrix.value = {}
    capabilityDictionary.value = []
    message.warning('平台能力矩阵加载失败：' + errorText(err))
  } finally {
    capabilityLoading.value = false
  }
}

/**
 * 打开能力矩阵抽屉。
 *
 * @param vendor 预选厂商（从厂商胶囊进入时传入；缺省沿用当前过滤）
 */
function openCapabilityMatrix(vendor?: string): void {
  capabilityFocusVendor.value = vendor || credentialFilter.value || ''
  capabilityVisible.value = true
  if (!Object.keys(capabilityMatrix.value).length) void fetchCapabilityMatrix()
}

async function fetchVendors() {
  try {
    vendors.value = (await deviceApi.listVendors()) || []
  } catch (err) {
    vendors.value = []
    message.error('加载厂商列表失败：' + errorText(err))
  }
}

async function fetchCredentials() {
  loading.value = true
  try {
    credentials.value = (await deviceApi.listCredentials()) || []
    syncActiveCredential()
  } catch (err) {
    credentials.value = []
    activeCredentialId.value = ''
    message.error('加载接入凭据失败：' + errorText(err))
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.deviceCredentialVendor = vendors.value[0]?.vendor || ''
  form.deviceCredentialPlatformType = vendors.value[0]?.platforms[0]?.code || ''
  form.deviceCredentialName = ''
  form.deviceCredentialAppKey = ''
  form.deviceCredentialAppSecret = ''
  form.deviceCredentialAppSecretMasked = ''
  form.deviceCredentialAppSecretConfigured = false
  resetSecretEditing()
  form.deviceCredentialBaseUrl = vendors.value[0]?.platforms[0]?.defaultBaseUrl || ''
  form.deviceCredentialProductCode = ''
  form.deviceCredentialProjectId = ''
  form.deviceCredentialGroupNo = ''
  form.deviceCredentialOfflineThreshold = vendors.value[0]?.defaultOfflineThreshold ?? 60
  form.deviceCredentialIsDefault = false
  form.deviceCredentialEnabled = true
  form.deviceCredentialOfflineDetectEnabled = false
  form.deviceCredentialOfflineDetectInterval = 30
  form.deviceCredentialEventPollEnabled = false
  form.deviceCredentialEventPollInterval = 60
  form.deviceCredentialDeviceSyncEnabled = false
  form.deviceCredentialDeviceSyncInterval = 300
  form.deviceCredentialOrgSyncEnabled = false
  form.deviceCredentialOrgSyncInterval = 600
  form.deviceCredentialMetricCollectEnabled = false
  form.deviceCredentialMetricCollectInterval = 60
  form.deviceCredentialRemark = ''
}

/**
 * 校验某一段的必填项。
 *
 * @param index 段位下标
 * @returns 错误文案；空串表示该段可放行
 */
function stepError(index: number): string {
  if (index === 0) {
    if (!form.deviceCredentialVendor) return '请选择厂商'
    if (!String(form.deviceCredentialName || '').trim()) return '请填写凭据名称'
    return ''
  }
  if (index === 1) {
    for (const field of currentCredentialFields.value) {
      if (fieldFormRequired(field) && !fieldFormValue(field)) return `请填写 ${field.label}`
    }
  }
  return ''
}

/** 下一步：本段没填完就停在原地，并提示缺什么 */
function nextStep(): void {
  const error = stepError(stepIndex.value)
  if (error) {
    message.warning(error)
    return
  }
  stepIndex.value = Math.min(STEPS.length - 1, stepIndex.value + 1)
}

function openCreate(vendor?: string) {
  editingCredentialId.value = ''
  stepIndex.value = 0
  resetForm()
  if (vendor) {
    form.deviceCredentialVendor = vendor
    const descriptor = vendors.value.find((item) => item.vendor === vendor)
    form.deviceCredentialPlatformType = descriptor?.platforms[0]?.code || ''
    form.deviceCredentialBaseUrl = descriptor?.platforms[0]?.defaultBaseUrl || ''
    form.deviceCredentialOfflineThreshold = descriptor?.defaultOfflineThreshold ?? 60
  }
  dialogVisible.value = true
}

/**
 * 从能力矩阵卡片直接新增凭据。
 *
 * <p>厂商、平台、默认网关与离线阈值一次带过去，用户只需要填 AK/SK。</p>
 *
 * @param payload 厂商 + 平台编码
 */
function onCapabilityCreate(payload: { vendor: string; platform: string }): void {
  capabilityVisible.value = false
  openCreate(payload.vendor)
  form.deviceCredentialPlatformType = payload.platform
  form.deviceCredentialBaseUrl =
    currentPlatforms.value.find((item) => item.code === payload.platform)?.defaultBaseUrl || ''
  form.deviceCredentialOfflineThreshold = currentVendor.value?.defaultOfflineThreshold ?? 60
}

function openEdit(row: ProviderCredential) {
  editingCredentialId.value = row.deviceCredentialId || ''
  stepIndex.value = 0
  form.deviceCredentialVendor = row.deviceCredentialVendor
  form.deviceCredentialPlatformType = row.deviceCredentialPlatformType || ''
  form.deviceCredentialName = row.deviceCredentialName
  form.deviceCredentialAppKey = row.deviceCredentialAppKey || ''
  form.deviceCredentialAppSecret = ''
  // 只把掩码带进表单用于展示，真实密钥永远不落到前端
  form.deviceCredentialAppSecretMasked = row.deviceCredentialAppSecretMasked || ''
  form.deviceCredentialAppSecretConfigured = !!row.deviceCredentialAppSecretConfigured
  resetSecretEditing()
  form.deviceCredentialBaseUrl = row.deviceCredentialBaseUrl || ''
  form.deviceCredentialProductCode = row.deviceCredentialProductCode || ''
  form.deviceCredentialProjectId = row.deviceCredentialProjectId || ''
  form.deviceCredentialGroupNo = row.deviceCredentialGroupNo || ''
  form.deviceCredentialOfflineThreshold = row.deviceCredentialOfflineThreshold ?? 60
  form.deviceCredentialIsDefault = !!row.deviceCredentialIsDefault
  form.deviceCredentialEnabled = row.deviceCredentialEnabled !== false
  form.deviceCredentialOfflineDetectEnabled = !!row.deviceCredentialOfflineDetectEnabled
  form.deviceCredentialOfflineDetectInterval = row.deviceCredentialOfflineDetectInterval ?? 30
  form.deviceCredentialEventPollEnabled = !!row.deviceCredentialEventPollEnabled
  form.deviceCredentialEventPollInterval = row.deviceCredentialEventPollInterval ?? 60
  form.deviceCredentialDeviceSyncEnabled = !!row.deviceCredentialDeviceSyncEnabled
  form.deviceCredentialDeviceSyncInterval = row.deviceCredentialDeviceSyncInterval ?? 300
  form.deviceCredentialOrgSyncEnabled = !!row.deviceCredentialOrgSyncEnabled
  form.deviceCredentialOrgSyncInterval = row.deviceCredentialOrgSyncInterval ?? 600
  form.deviceCredentialMetricCollectEnabled = !!row.deviceCredentialMetricCollectEnabled
  form.deviceCredentialMetricCollectInterval = row.deviceCredentialMetricCollectInterval ?? 60
  form.deviceCredentialRemark = row.deviceCredentialRemark || ''
  dialogVisible.value = true
}

/**
 * 直接打开「能力」这一步。
 *
 * <p>从底部条进来时，用户明确是要改能力开关，不应该再点两次「下一步」；
 * 其余字段仍按原值回填，保存时四段一起校验。</p>
 *
 * @param row 当前凭据
 */
function openCapability(row: ProviderCredential) {
  openEdit(row)
  stepIndex.value = 2
}

function onVendorChange() {
  const descriptor = currentVendor.value
  form.deviceCredentialPlatformType = descriptor?.platforms[0]?.code || ''
  form.deviceCredentialBaseUrl = descriptor?.platforms[0]?.defaultBaseUrl || ''
  form.deviceCredentialOfflineThreshold = descriptor?.defaultOfflineThreshold ?? 60
}

function onPlatformChange() {
  const platform = currentPlatforms.value.find((item) => item.code === form.deviceCredentialPlatformType)
  form.deviceCredentialBaseUrl = platform?.defaultBaseUrl || ''
}

async function submit() {
  // 四段式：不论停在哪一段，提交时都要把各段必填过一遍，缺哪段就跳回哪段
  for (let index = 0; index < STEPS.length; index += 1) {
    const error = stepError(index)
    if (error) {
      stepIndex.value = index
      message.warning(error)
      return
    }
  }

  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      deviceCredentialVendor: form.deviceCredentialVendor,
      deviceCredentialPlatformType: form.deviceCredentialPlatformType || null,
      deviceCredentialName: form.deviceCredentialName.trim(),
      deviceCredentialBaseUrl: String(form.deviceCredentialBaseUrl || '').trim() || null,
      deviceCredentialOfflineThreshold: form.deviceCredentialOfflineThreshold,
      deviceCredentialIsDefault: form.deviceCredentialIsDefault,
      deviceCredentialEnabled: form.deviceCredentialEnabled,
      deviceCredentialOfflineDetectEnabled: !!form.deviceCredentialOfflineDetectEnabled,
      deviceCredentialOfflineDetectInterval: form.deviceCredentialOfflineDetectInterval,
      deviceCredentialEventPollEnabled: !!form.deviceCredentialEventPollEnabled,
      deviceCredentialEventPollInterval: form.deviceCredentialEventPollInterval,
      deviceCredentialDeviceSyncEnabled: !!form.deviceCredentialDeviceSyncEnabled,
      deviceCredentialDeviceSyncInterval: form.deviceCredentialDeviceSyncInterval,
      deviceCredentialOrgSyncEnabled: !!form.deviceCredentialOrgSyncEnabled,
      deviceCredentialOrgSyncInterval: form.deviceCredentialOrgSyncInterval,
      deviceCredentialMetricCollectEnabled: !!form.deviceCredentialMetricCollectEnabled,
      deviceCredentialMetricCollectInterval: form.deviceCredentialMetricCollectInterval,
      deviceCredentialRemark: String(form.deviceCredentialRemark || '').trim() || null
    }
    /** 描述符驱动的字段：非空即回填，未提交的字段不加 key（不传 null） */
    for (const field of currentCredentialFields.value) {
      const value = fieldFormValue(field)
      if (!value) continue
      payload[fieldFormKey(field)] = value
    }

    if (editingCredentialId.value) {
      await deviceApi.updateCredential(editingCredentialId.value, payload)
      message.success('凭据已更新')
    } else {
      await deviceApi.createCredential(payload)
      message.success('凭据已创建')
    }
    dialogVisible.value = false
    await fetchCredentials()
  } catch (err) {
    message.error('保存凭据失败：' + errorText(err))
  } finally {
    submitting.value = false
  }
}

async function testCredential(row: ProviderCredential) {
  if (!row.deviceCredentialId) return
  testingId.value = row.deviceCredentialId
  try {
    const ok = await deviceApi.testCredential(row.deviceCredentialId)
    // 后端会写留痕，这里同步本地行，健康列立刻变（省一次整表刷新）
    row.deviceCredentialLastTestOk = ok
    row.deviceCredentialLastTestAt = new Date().toISOString()
    if (ok) {
      message.success(`「${row.deviceCredentialName}」连接成功`)
    } else {
      message.warning(`「${row.deviceCredentialName}」连接失败，请检查 AK/SK 与平台地址`)
    }
  } catch (err) {
    message.error('连接测试失败：' + errorText(err))
  } finally {
    testingId.value = ''
  }
}

/**
 * 全部检测：按当前厂商过滤逐条探测连通性。
 *
 * <p>后端限并发 4、单条超时 20 秒、单次最多 50 条；超量时提示先按厂商收敛，
 * 避免一次把整个池子打满。结果写回每行健康留痕，并汇总成功 / 失败条数。</p>
 */
async function testAllCredentials() {
  const targets = filteredCredentials.value.filter((item) => item.deviceCredentialId)
  if (!targets.length) {
    message.warning('当前没有可检测的凭据')
    return
  }
  if (targets.length > 50) {
    message.warning(`一次最多检测 50 条，当前 ${targets.length} 条，请先按厂商过滤`)
    return
  }
  testingAll.value = true
  try {
    const results = await deviceApi.testAllCredentials(targets.map((item) => item.deviceCredentialId as string))
    const ok = results.filter((item) => item.ok).length
    const fail = results.length - ok
    const at = new Date().toISOString()
    const byId = new Map(results.map((item) => [item.credentialId, item]))
    for (const item of credentials.value) {
      if (!item.deviceCredentialId) continue
      const hit = byId.get(item.deviceCredentialId)
      if (!hit) continue
      item.deviceCredentialLastTestOk = hit.ok
      item.deviceCredentialLastTestAt = at
    }
    if (fail) {
      message.warning(`检测完成：成功 ${ok} · 失败 ${fail}`)
    } else {
      message.success(`检测完成：${ok} 条全部正常`)
    }
  } catch (err) {
    message.error('全部检测失败：' + errorText(err))
  } finally {
    testingAll.value = false
  }
}

async function removeCredential(row: ProviderCredential) {
  if (!row.deviceCredentialId) return
  try {
    await ElMessageBox.confirm(
      `确认删除凭据「${row.deviceCredentialName}」？已绑定该凭据的设备需要重新选择。`,
      '删除凭据',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    await deviceApi.deleteCredential(row.deviceCredentialId)
    message.success('凭据已删除')
    await fetchCredentials()
  } catch (err) {
    message.error('删除凭据失败：' + errorText(err))
  }
}

/**
 * 某条凭据所属平台是否支持某个同步方向。
 *
 * <p>必须按平台判断：海康同时有云曜与萤石，云曜有组织、萤石没有；
 * 用厂商并集会让萤石凭据也显示「同步组织」，点了才报错。
 * 旧描述符缺平台级能力位时回退厂商级，保证兼容。</p>
 *
 * @param credential 凭据
 * @param kind 同步方向
 * @returns 是否显示该入口
 */
function canSync(credential: ProviderCredential, kind: 'device' | 'org' | 'person'): boolean {
  const descriptor = vendors.value.find((item) => item.vendor === credential.deviceCredentialVendor)
  if (!descriptor) return false
  const platform = descriptor.platforms.find((item) => item.code === credential.deviceCredentialPlatformType)
  const caps: DeviceCapability[] =
    platform && Array.isArray(platform.capabilities) ? platform.capabilities : descriptor.capabilities
  switch (kind) {
    case 'device':
      return caps.includes('DEVICE')
    case 'org':
      return caps.includes('ORG')
    case 'person':
      return caps.includes('PERSON')
    default:
      return false
  }
}

/** 当前凭据可用的同步入口（设备 / 组织 / 人员） */
const syncEntry = computed<{ device: boolean; org: boolean; person: boolean }>(() => {
  const credential = activeCredential.value
  if (!credential || !credential.deviceCredentialVendor) {
    return { device: false, org: false, person: false }
  }
  return {
    device: canSync(credential, 'device'),
    org: canSync(credential, 'org'),
    person: canSync(credential, 'person')
  }
})

/** 凭据维度同步（按该套凭据建连，拉取设备的目录/组织/人员，不触其他厂商） */
async function syncCredential(kind: 'device' | 'org' | 'person') {
  const credential = activeCredential.value
  if (!credential || !credential.deviceCredentialId) {
    message.warning('请先选择一条凭据')
    return
  }
  syncLoading[kind] = true
  try {
    let result: SyncResult
    switch (kind) {
      case 'device':
        result = await deviceApi.syncDevicesByCredential(credential.deviceCredentialId)
        break
      case 'org':
        result = await deviceApi.syncOrgByCredential(credential.deviceCredentialId)
        break
      case 'person':
        result = await deviceApi.syncPersonsByCredential(credential.deviceCredentialId)
        break
      default:
        throw new Error('未知的同步方向')
    }
    message.success(
      `「${credential.deviceCredentialName}」同步完成：新增 ${result.created}，更新 ${result.updated}，跳过 ${result.skipped}`
    )
    await fetchCredentials()
  } catch (err) {
    message.error(`凭据维度同步失败：${errorText(err)}`)
  } finally {
    syncLoading[kind] = false
  }
}

/** 底部条 / 导轨的加载态 */
function credSyncLoading(kind: 'device' | 'org' | 'person'): boolean {
  return syncLoading[kind]
}

function refreshAll() {
  fetchVendors()
  fetchCredentials()
  fetchTaskStates()
  fetchVendorStats()
  fetchCapabilityMatrix()
}

function goLedger() {
  router.push('/device')
}

function errorText(err: unknown): string {
  const e = err as {
    message?: string
    msg?: string
    code?: string | number
    response?: { status?: number; data?: { message?: string; msg?: string } }
  }
  const fromBody = e?.response?.data?.message || e?.response?.data?.msg || e?.msg
  if (fromBody) return fromBody
  // 框架对 5xx/网络错误弹出通用提示后会清空 message，这里补回可读原因，避免只剩「未知错误」
  if (e?.message) return e.message
  if (e?.code === 'ERR_NETWORK' || e?.code === 'ERR_CANCELED') {
    return e.code === 'ERR_CANCELED' ? '请求已取消' : '网络异常，请确认后端已启动'
  }
  if (e?.response?.status) return `服务端错误（HTTP ${e.response.status}）`
  return '未知错误'
}

onMounted(() => {
  refreshAll()
  ticker = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (ticker) {
    clearInterval(ticker)
    ticker = undefined
  }
})
</script>

<style scoped>
/* ============================================================
   提供商配置（Deck 布局）
   左：厂商导轨（含「全部厂商」）；右：凭据表 + 底部常驻条。
   吃满父容器高度，只有导轨与表格各自滚动；外层不再叠卡片/内边距，
   间距由宿主 .main 与本页 gap 提供。
   ============================================================ */
.dpv {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 10px 0 12px;
  box-sizing: border-box;
  color: var(--el-text-color-primary);
}

.dpv-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  gap: 10px;
  min-height: 0;
}

/* ============================================================
   顶部：厂商切换（置顶常驻）
   ============================================================ */
.dpv-top {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px 8px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
  /* 表格内部滚动时厂商切换条始终留在视口顶部 */
  position: sticky;
  top: 0;
  z-index: 6;
}

.dpv-top__main {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.dpv-top__title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.dpv-bar {
  width: 4px;
  height: 14px;
  border-radius: 999px;
  background: var(--el-color-primary);
  flex: none;
}

.dpv-count {
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
}

/* 「平台能力」按钮上的缺口角标：数字 = 还有待实现能力的平台数 */
.dpv-gapbadge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 15px;
  height: 15px;
  margin-left: 4px;
  padding: 0 4px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-warning) 18%, transparent);
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.dpv-grow {
  flex: 1;
  min-width: 0;
}

.dpv-top__desc {
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 厂商切换：横向胶囊条（不换行、可横滚） */
.dpv-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow-x: auto;
  padding-bottom: 2px;
}

.dpv-chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: var(--el-bg-color);
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.dpv-chip:hover {
  border-color: var(--el-color-primary-light-7);
  background: var(--el-fill-color-light);
}

.dpv-chip.is-active {
  border-color: var(--el-color-primary-light-5);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
}

.dpv-chip__tile {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.dpv-chip__tile.is-all {
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

/* 表格里的厂商图标：与顶部胶囊同款，只是小一号 */
.dpv-chip__tile--sm {
  width: 20px;
  height: 20px;
  font-size: 10px;
}

.dpv-chip.is-active .dpv-chip__tile {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.dpv-chip__name {
  max-width: 132px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12.5px;
  font-weight: 500;
}

.dpv-chip.is-active .dpv-chip__name {
  color: var(--el-color-primary);
  font-weight: 600;
}

.dpv-chip__meta {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

/* 能力点阵：12 格（6×2），亮 = 支持；hover 有完整清单 */
.dpv-chip__caps {
  display: grid;
  flex: none;
  grid-template-columns: repeat(6, 4px);
  gap: 2px;
  margin-left: 2px;
}

.dpv-chip__caps i {
  width: 4px;
  height: 4px;
  border-radius: 1px;
  background: var(--el-border-color);
}

.dpv-chip__caps i.is-on {
  background: var(--el-color-primary);
}

.dpv-chip.is-active .dpv-chip__caps i {
  background: color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}

.dpv-chip.is-active .dpv-chip__caps i.is-on {
  background: var(--el-color-primary);
}

.dpv-vendors__empty {
  margin: 0;
  padding: 22px 12px;
  font-size: 12px;
  line-height: 1.7;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.dpv-top__stats {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 7px;
  padding: 2px 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 999px;
}

.dpv-live {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-success);
}

.dpv-sep {
  width: 1px;
  height: 10px;
  background: var(--el-border-color);
}

/* 健康分布：正常 / 失败 / 未检测，颜色点 + 数字，悬停出完整说明 */
.dpv-health {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.dpv-health__dot {
  width: 5px;
  height: 5px;
  margin-left: 3px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}

.dpv-health__dot.is-ok { background: var(--el-color-success); }
.dpv-health__dot.is-fail { background: var(--el-color-danger); }
.dpv-health__dot.is-idle { background: var(--el-color-info); }

.dpv-health-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dpv-health-cell__at {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============================================================
   右侧：凭据表 + 底部常驻条
   ============================================================ */
.dpv-work {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-light, var(--shadow-1));
}

.dpv-work__head {
  display: flex;
  flex: none;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.dpv-work__title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

/* 货架页签：凭据表 / 厂商任务 内嵌页签体 */
.dpv-panes {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.dpv-filter {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 21px;
  padding: 0 7px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  color: var(--el-color-primary);
  font-size: 11px;
  cursor: pointer;
}

.dpv-filter__x {
  font-size: 12px;
  line-height: 1;
  opacity: 0.7;
}

.dpv-table-wrap {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-height: 0;
}

/* ReTable 自带卡片外壳与内边距，这里由外层卡片提供壳，故把它的壳抹平，
   避免「卡片套卡片 / 双层 16px 内距」 */
.dpv-table {
  flex: 1 1 0;
  min-height: 0;
  --rt-padding: 0;
  --rt-bg: transparent;
  border: none;
  border-radius: 0;
}

.dpv-table :deep(.re-table__main) {
  padding: 0;
}

.dpv-cred__top {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.dpv-cred__name {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-cred__remark {
  margin-top: 1px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dpv-cell__main {
  font-size: 12.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-cell__sub {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* 平台名可截断，覆盖率徽标不参与截断 */
.dpv-cell__plat {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 平台能力覆盖率：主色实心 = 无缺口，警告色描边 = 还有待实现能力 */
.dpv-cov {
  flex: none;
  padding: 0 5px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 26%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-primary) 7%, transparent);
  color: var(--el-color-primary);
  font-size: 9.5px;
  line-height: 15px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dpv-cov.is-gap {
  border-color: color-mix(in srgb, var(--el-color-warning) 38%, transparent);
  background: color-mix(in srgb, var(--el-color-warning) 9%, transparent);
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
}

.dpv-mono {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 11.5px;
  color: var(--el-text-color-regular);
}

.dpv-time {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
}

.dpv-ops {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

/* 空态：与门禁记录的 ghost 卡同一套（虚线 + 浅底 + 图标块） */
.dpv-ghost {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  margin: 14px;
  padding: 26px 16px;
  border: 1px dashed var(--el-border-color);
  border-radius: var(--el-radius-xl, 16px);
  background: color-mix(in srgb, var(--el-text-color-primary) 2%, transparent);
  text-align: center;
}

.dpv-ghost__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: var(--el-text-color-placeholder);
  background: color-mix(in srgb, var(--el-text-color-primary) 6%, transparent);
}

.dpv-ghost__title {
  font-size: 13.5px;
  font-weight: 600;
}

.dpv-ghost__text {
  max-width: 420px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

/* ============================================================
   底部常驻条
   ============================================================ */
.dpv-foot {
  display: flex;
  flex: none;
  align-items: center;
  gap: 9px;
  min-height: 42px;
  padding: 6px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter, #fafafa);
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow: hidden;
}

.dpv-foot__name {
  font-weight: 600;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-foot__sep {
  flex: none;
  width: 1px;
  height: 12px;
  background: var(--el-border-color);
}

.dpv-foot__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  white-space: nowrap;
}

.dpv-foot__item--url {
  max-width: 260px;
  overflow: hidden;
}

/** 凭据维度的同步入口：与 AK / SK 行分组的内联按钮组 */
.dpv-foot__tools {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 6px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.dpv-foot__item--url .dpv-mono {
  overflow: hidden;
  text-overflow: ellipsis;
}

.dpv-foot__k {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.dpv-foot__hint {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

/* ============================================================
   表单
   ============================================================ */
/* 四段式步骤条：候选顺序 = 用户填表的真实顺序 */
.dpv-steps {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 14px;
  padding: 0;
  list-style: none;
  flex-wrap: wrap;
}

.dpv-step {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 4px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
}

.dpv-step__idx {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--el-fill-color);
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  font-size: 10.5px;
  font-weight: 700;
  line-height: 1;
}

.dpv-step.is-done {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
}

.dpv-step.is-done .dpv-step__idx {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

.dpv-step.is-active {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  font-weight: 600;
}

.dpv-step.is-active .dpv-step__idx {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}

/* 一段一屏：非当前段 v-show 隐藏，DOM 仍在，切换不丢输入 */
.dpv-step-pane {
  min-height: 240px;
}

.dpv-wiz-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.dpv-wiz-foot__step {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

.dpv-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 14px;
}

.dpv-w {
  width: 100%;
}

.dpv-form__hint {
  margin: -6px 0 10px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* 密钥字段：掩码与「修改 / 取消」都收在输入框内（2026-11-07 反馈：按钮不要挂在框外） */
.dpv-secret {
  width: 100%;
}

.dpv-secret__mask :deep(.el-input__wrapper) {
  background: var(--el-fill-color-light);
}

.dpv-secret__mask :deep(.el-input__inner) {
  color: var(--el-text-color-regular);
  font-family: var(--el-font-family-mono, monospace);
  letter-spacing: 0.4px;
  cursor: default;
}

.dpv-secret__mask :deep(.el-input__suffix-inner) {
  gap: 6px;
}

.dpv-secret__tag {
  padding: 0 6px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 18px;
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 12%, transparent);
}

/* 框内动作：链接式小按钮，点击不抢输入框焦点。
   .el-input__suffix 是 pointer-events:none，只有 .el-input__suffix-inner 恢复接收事件；
   这里给按钮再加一道 pointer-events:auto + padding，确保可点且不压住掩码文字。 */
.dpv-secret__act {
  flex: none;
  margin-left: 6px;
  padding: 0 2px;
  border: 0;
  border-radius: 4px;
  background: none;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-color-primary);
  white-space: nowrap;
  cursor: pointer;
  pointer-events: auto;
}

.dpv-secret__act:focus-visible {
  outline: 1px solid var(--el-color-primary);
  outline-offset: 1px;
}

.dpv-secret__act:hover {
  text-decoration: underline;
}

.dpv-secret__act.is-cancel {
  color: var(--el-text-color-secondary);
}

.dpv-secret__act.is-cancel:hover {
  color: var(--el-text-color-primary);
}

.dpv-checks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 16px;
  min-height: 32px;
}

/* 高级配置：该凭据维度的定时任务开关 + 间隔（默认全部关闭） */
.dpv-adv {
  padding: 14px 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}

.dpv-adv__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dpv-adv__icon {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  color: var(--el-color-primary);
}

.dpv-adv__title {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.dpv-adv__desc {
  margin: 0 0 10px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.dpv-adv__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 16px;
}

.dpv-adv__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dpv-adv__row__label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.dpv-adv__row__input {
  flex: 1;
  width: 0;
}

.dpv-adv__row__unit {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

@media (max-width: 1100px) {
  .dpv-foot__item--url {
    max-width: 160px;
  }
}

/* ============================================================
   第 3 段：能力（配方卡 + 开关行）
   ============================================================ */
.cap-recipes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}
.cap-recipe {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  text-align: left;
  font: inherit;
  color: inherit;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}
.cap-recipe:hover {
  border-color: var(--el-color-primary-light-5);
}
.cap-recipe.is-on {
  border-color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}
.cap-recipe__name {
  font-size: 13px;
  font-weight: 600;
}
.cap-recipe__desc {
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.cap-recipe__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
.cap-chip {
  padding: 1px 7px;
  font-size: 10.5px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 9%, transparent);
  border-radius: 999px;
}

.cap-list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
}
.cap-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.cap-row:last-child {
  border-bottom: 0;
}
.cap-row.is-off {
  background: var(--el-fill-color-lighter);
}
.cap-row__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.cap-row__name {
  font-size: 12.5px;
  font-weight: 600;
}
.cap-row.is-off .cap-row__name {
  color: var(--el-text-color-regular);
}
.cap-row__desc {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.cap-row__code {
  margin-left: auto;
  padding: 1px 6px;
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: 5px;
}
.cap-row__global {
  flex: none;
  padding: 0 7px;
  border: 1px solid var(--el-border-color);
  border-radius: 999px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 10.5px;
  line-height: 17px;
}

.cap-row__na {
  margin-left: auto;
  max-width: 52%;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cap-count {
  margin: 10px 0 0;
  text-align: right;
  font-size: 11.5px;
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  color: var(--el-color-primary);
}

/* 第 4 段顶部的策略条：离线阈值与启停放在任务旁边，第 3 段不再重复 */
.task-policy {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
}
.task-policy__label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.task-policy__num {
  width: 110px;
}
.task-policy__unit {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.task-policy__sep {
  width: 1px;
  height: 16px;
  margin: 0 4px;
  background: var(--el-border-color);
}

/* ============================================================
   第 4 段：任务圆盘（圆圈倒计时是这一版的身份）
   ============================================================ */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
.task-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 12px 12px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.task-card:hover {
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow-light);
}
.task-card.is-running {
  border-color: var(--el-color-primary);
}

.task-card__dial {
  position: relative;
  width: 96px;
  height: 96px;
  flex: none;
}
.task-card__svg {
  width: 96px;
  height: 96px;
  transform: rotate(-90deg);
}
.task-card__track {
  fill: none;
  stroke: var(--el-border-color-lighter);
  stroke-width: 6;
}
.task-card__bar {
  fill: none;
  stroke: var(--el-color-primary);
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s linear;
}
.task-card__dial.is-due .task-card__bar {
  stroke: var(--el-color-success);
}
.task-card__dial.is-idle .task-card__bar {
  stroke: var(--el-border-color);
}
.task-card__center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 1px;
  padding-top: 36px;
  box-sizing: border-box;
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
}
.task-card__center b {
  font-size: 20px;
  line-height: 1;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.task-card__unit {
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.task-card__name {
  margin: 2px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.task-card__code {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 10px;
  color: var(--el-text-color-secondary);
}

.task-card__step {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 4px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
}
.task-step__btn {
  width: 26px;
  height: 26px;
  font: inherit;
  font-size: 14px;
  line-height: 1;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-lighter);
  border: 0;
  cursor: pointer;
}
.task-step__btn:hover {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}
.task-step__input {
  width: 54px;
  height: 26px;
  padding: 0 4px;
  text-align: center;
  font: inherit;
  font-size: 12px;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 0;
  outline: none;
  -moz-appearance: textfield;
}
.task-step__input::-webkit-outer-spin-button,
.task-step__input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.task-card__run {
  width: 100%;
  height: 26px;
  margin-top: 2px;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  border: 1px solid var(--el-color-primary-light-7);
  border-radius: 7px;
  cursor: pointer;
}
.task-card__run:hover:not(:disabled) {
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.task-card__run:disabled {
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-lighter);
  border-color: var(--el-border-color-lighter);
  cursor: not-allowed;
}
.task-card__hint {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.task-note {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin: 0 0 12px;
  padding: 9px 12px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-lighter);
  border-radius: 9px;
}
.task-note__link {
  padding: 0;
  font: inherit;
  font-size: 11.5px;
  color: var(--el-color-primary);
  background: none;
  border: 0;
  cursor: pointer;
  text-decoration: underline;
}

/* ============================================================
   厂商悬停：同步效果 popover
   ============================================================ */
.dpv-pop__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.dpv-pop__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dpv-pop__head b {
  font-size: 13px;
}
.dpv-pop__count {
  margin-left: auto;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* 平台能力覆盖：一行一个平台，右侧直接写「N 项待实现」 */
.dpv-pop__plats {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.dpv-pop__plats-title {
  font-size: 10.5px;
  color: var(--el-text-color-secondary);
}

.dpv-pop__plat {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px 32px auto;
  align-items: center;
  gap: 6px;
}

.dpv-pop__pname {
  overflow: hidden;
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dpv-pop__pbar {
  height: 4px;
  border-radius: 999px;
  background: var(--el-fill-color-dark);
  overflow: hidden;
}

.dpv-pop__pbar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--el-color-primary);
}

.dpv-pop__pbar i.is-gap {
  background: linear-gradient(90deg, var(--el-color-primary-light-5), var(--el-color-warning));
}

.dpv-pop__ppct {
  font-size: 10.5px;
  text-align: right;
  color: var(--el-text-color-regular);
  font-variant-numeric: tabular-nums;
}

.dpv-pop__pgap {
  font-size: 10px;
  white-space: nowrap;
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
}

.dpv-pop__pgap.is-clear {
  color: var(--el-text-color-placeholder);
}

.dpv-pop__more {
  align-self: flex-end;
  margin-top: 2px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--el-color-primary);
  font: inherit;
  font-size: 10.5px;
  cursor: pointer;
}

.dpv-pop__more:hover {
  text-decoration: underline;
}

/* 能力矩阵抽屉的加载态：抽屉本身已占位，这里只放一条轻量进度条 */
.dpv-cap-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.dpv-cap-loading__bar {
  width: 22px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--el-color-primary), transparent);
  background-size: 200% 100%;
  animation: dpv-cap-loading 1.1s linear infinite;
}

@keyframes dpv-cap-loading {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .dpv-cap-loading__bar {
    animation: none;
    background: var(--el-color-primary);
  }
}
.dpv-pop__list {
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--el-border-color-lighter);
}
.dpv-pop__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.dpv-pop__label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}
.dpv-pop__value {
  font-size: 11px;
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  color: var(--el-color-primary);
}
.dpv-pop__value.is-off {
  color: var(--el-text-color-placeholder);
}
.dpv-pop__foot {
  margin: 0;
  font-size: 10.5px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

/* 表格里的厂商图标 + 名称 */
.dpv-cell--vendor {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.dpv-cell__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
</style>
