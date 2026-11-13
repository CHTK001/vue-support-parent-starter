<template>
  <!-- 主题配置 -->
  <ReDrawer
    ref="koiDrawerRef"
    :title="t('themeConfig.title')"
    size="390"
    :footerHidden="true"
    :closeConfirm="themeConfigCloseConfirm"
    :closeOnly="true"
    :lock-scroll="false"
    drawer-class="theme-config-drawer"
    modal-class="theme-config-overlay"
  >
    <template #content>
      <!--
        theme-config-panel：主题配置独立作用域
        - 预览块使用 koi-* 类名，不与 html.layout-horizontal / Layout 组件类名冲突
        - isolation 防止预览 mix-blend-mode 影响抽屉外的主布局
      -->
      <div class="theme-config-panel p-t-8px select-none">
        <ReTab
          :tabs="configTabs"
          v-model="activeTab"
          variant="capsule"
          class="theme-config-tabs"
        >
          <!-- ============ 高级：计时器配置（顶部 tab，@repo/work Worker 驱动） ============ -->
          <template #advanced>
            <!-- 计时器配置 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Clock /></el-icon>
                <span class="section-title">{{ t("header.timer.configTitle") }}</span>
              </div>

              <div class="section-card">
<ReSwitch layout="card"
                :title="t('header.timer.enableTitle')"
                :sub="t('header.timer.enableSub')"
                :tip="t('header.timer.enableTip')"
                :description="t('header.timer.enableDesc')"
                v-model="timerEnable"
              />

                <!-- 时区列表（最多 3 个，UTC 偏移 -12 ~ +12） -->
                <div v-if="timerEnable" class="timer-zones">
                  <div class="timer-zones__head">
                    <span class="timer-zones__title">{{ t("header.timer.zoneTitle") }}</span>
                    <span class="timer-zones__count">{{ timerZones.length }} / {{ MAX_TIMER_ZONES }}</span>
                  </div>

                  <div v-for="(zone, index) in timerZones" :key="index" class="timer-zone-row">
                    <span class="timer-zone-row__index">{{ index + 1 }}</span>
                    <el-select
                      v-model="timerZones[index]"
                      :placeholder="t('header.timer.zonePlaceholder')"
                      clearable
                      filterable
                      popper-class="timer-zone-popper"
                      class="timer-zone-row__select"
                      @clear="removeTimerZone(index)"
                    >
                      <el-option-group
                        v-for="group in timerZoneGroups"
                        :key="group.label"
                        :label="group.label"
                      >
                        <el-option
                          v-for="zone in group.zones"
                          :key="zone.offset"
                          :label="zone.label"
                          :value="zone.offset"
                        >
                          <div class="timer-zone-option">
                            <span class="timer-zone-option__left">
                              <el-icon class="timer-zone-option__icon"><Clock /></el-icon>
                              <span class="timer-zone-option__city">{{ zone.city }}</span>
                            </span>
                            <span class="timer-zone-option__tag">{{ zone.tag }}</span>
                          </div>
                        </el-option>
                      </el-option-group>
                    </el-select>
                    <el-button
                      class="timer-zone-row__remove"
                      :icon="Delete"
                      circle

                      @click="removeTimerZone(index)"
                    />
                  </div>

                  <el-button
                    v-if="timerZones.length < MAX_TIMER_ZONES"
                    class="timer-zone-add"
                    type="primary"
                    plain
                    :icon="Plus"
                    @click="addTimerZone"
                  >
                    {{ t("header.timer.zoneAdd") }}
                  </el-button>

                  <div class="timer-zones__tip">
                    <el-icon :size="13"><InfoFilled /></el-icon>
                    <span>{{ t("header.timer.zoneTip") }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- ============ AI 对话（集成 @repo/web-llm） ============ -->
            <ReSettingAiChat />

            <!-- ============ 无障碍设置 ============ -->
            <ReSettingAccessibility />

            <!-- ============ 性能监控 ============ -->
            <ReSettingPerformance />

            <!-- ============ 开发工具（仅 dev/test） ============ -->
            <ReSettingDevTools />

            <!-- ============ 系统调试 ============ -->
            <ReSettingSystemDebug />

            <!-- ============ 空状态样式（仅 admin） ============ -->
            <ReSettingEmptyState />

            <!-- ============ 热点工具（仅 dev/test） ============ -->
            <ReSettingHeatmap />

            <!-- 用户配置：导入 / 导出 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Files /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.userConfig") }}</span>
              </div>
              <div class="section-card">
                <div class="config-io">
                  <div class="config-io__row">
                    <div class="config-io__card" @click="exportUserConfig">
                      <span class="config-io__icon config-io__icon--export">
                        <el-icon :size="20"><Download /></el-icon>
                      </span>
                      <div class="config-io__info">
                        <span class="config-io__title">{{ t("themeConfig.io.export") }}</span>
                      </div>
                    </div>

                    <div class="config-io__card" @click="importUserConfig">
                      <span class="config-io__icon config-io__icon--import">
                        <el-icon :size="20"><Upload /></el-icon>
                      </span>
                      <div class="config-io__info">
                        <span class="config-io__title">{{ t("themeConfig.io.import") }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- ============ 外观：主题颜色 + 布局样式 + 登录页样式 ============ -->
          <template #appearance>
            <!-- 主题模式：明亮 / 黑暗 / 自动 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Moon /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.themeMode") }}</span>
              </div>

              <div class="section-card">
                <ReTab
                  :tabs="themeModeTabs"
                  :model-value="themeMode"
                  variant="capsule"
                  nav-only
                  class="theme-mode-tabs"
                  @update:model-value="(val: string) => changeThemeMode(val as 'light' | 'dark' | 'auto')"
                />
              </div>
            </div>

            <!-- 主题颜色选择器 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Connection /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.themeColor") }}</span>
              </div>

              <div class="section-card">
                <!-- 2 行 × 6 正圆形预设色板 -->
                <div class="theme-colors-grid">
                  <div
                    v-for="color in themeColors"
                    :key="color"
                    class="theme-color-item"
                    @click="changeThemeColor(color)"
                    :class="{ active: globalStore.themeColor === color }"
                  >
                    <div class="color-dot" :style="{ backgroundColor: color }">
                      <div class="color-check" v-if="globalStore.themeColor === color">
                        <el-icon><Check /></el-icon>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 自定义颜色区域：左预览方块 + 中文字 + 右亮度/深浅滑条 -->
                <div class="theme-color-custom-card">
                  <div class="custom-swatch" :style="{ backgroundColor: customColor }">
                    <el-icon v-if="isCustomActive" class="custom-swatch__check"><Check /></el-icon>
                    <!-- 透明取色器覆盖在色块上：点击色块即打开取色面板 -->
                    <el-color-picker
                      v-model="customBase"
                      class="theme-color-custom-card__hidden-picker"
                      :show-alpha="false"
                      @change="handleCustomColor"
                    />
                  </div>

                  <div class="custom-info">
                    <div class="custom-title">{{ t("themeConfig.customColor.title") }}</div>
                    <div class="custom-desc">{{ t("themeConfig.customColor.desc") }}</div>
                    <div class="custom-hex">{{ customColor }}</div>
                  </div>

                  <div class="custom-lightness">
                    <el-slider
                      v-model="customLightness"
                      :min="-100"
                      :max="100"
                      :step="1"
                      vertical
                      :height="'72px'"
                      @input="applyCustomColor"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 颜色状态：消息提示四种状态色（点击触发对应 el-message 演示） -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Bell /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.colorStatus") }}</span>
              </div>

              <div class="section-card">
                <div class="msg-status-list">
                <div
                  v-for="item in msgStatusItems"
                  :key="item.type"
                  class="msg-status-item"
                  :class="`msg-status-item--${item.type}`"
                >
                  <!-- 左侧色块：可点击取色，实时控制全局 message 颜色 -->
                  <div
                    class="msg-status-item__badge"
                    :style="{ backgroundColor: item.color }"
                  >
                    <el-icon :size="14"><component :is="item.badgeIcon" /></el-icon>
                    <!-- 透明取色器覆盖在色块上：点击色块即打开取色面板 -->
                    <el-color-picker
                      :model-value="item.color"
                      class="msg-status-item__hidden-picker"
                      :show-alpha="false"
                      @change="(val: string | null) => handleMsgColorChange(item, val)"
                    />
                  </div>

                  <!-- 中间文字：加粗标题 + 色值 -->
                  <div class="msg-status-item__text">
                    <span class="msg-status-item__label">{{ t(item.labelKey) }}</span>
                    <span class="msg-status-item__hex">{{ item.color }}</span>
                  </div>

                  <!-- 右侧环形刷新图标：浅色圆形底 -->
                  <div class="msg-status-item__refresh">
                    <el-icon :size="13"><RefreshRight /></el-icon>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <!-- 布局样式选择器 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Notification /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.layoutStyle") }}</span>
              </div>

              <div class="section-card">
                <div class="koi-layout-grid">
                <div
                  v-for="layoutOption in layoutOptions"
                  :key="layoutOption.value"
                  :class="['koi-layout-item', layoutOption.previewClass, { 'is-active': layout === layoutOption.value }]"
                  @click="setLayout(layoutOption.value)"
                >
                  <div class="koi-layout-preview">
                    <!-- 双栏专属预览：3 个实心蓝竖条 + 1 个虚线方框 -->
                    <template v-if="layoutOption.value === 'double'">
                      <div class="koi-double-bar"></div>
                      <div class="koi-double-bar"></div>
                      <div class="koi-double-bar"></div>
                      <div class="koi-double-dashed"></div>
                    </template>
                    <template v-else>
                      <div class="koi-block-aside"></div>
                      <div class="koi-layout-inner" v-if="layoutOption.hasContainer">
                        <div class="koi-block-header"></div>
                        <div class="koi-block-main"></div>
                      </div>
                      <div class="koi-block-header" v-if="!layoutOption.hasContainer && layoutOption.hasLight"></div>
                      <div
                        class="koi-block-main"
                        v-if="
                          !layoutOption.hasContainer &&
                          !layoutOption.hasLight &&
                          layoutOption.value !== 'columns' &&
                          layoutOption.value !== 'gradation-columns' &&
                          layoutOption.value !== 'frosted-columns'
                        "
                      ></div>
                      <template
                        v-if="
                          layoutOption.value === 'columns' ||
                          layoutOption.value === 'gradation-columns' ||
                          layoutOption.value === 'frosted-columns'
                        "
                      >
                        <div class="koi-block-header"></div>
                        <div class="koi-block-main"></div>
                      </template>
                    </template>
                  </div>
                  <div class="koi-layout-label">{{ layoutOption.label }}</div>
                  <div class="koi-layout-check" v-if="layout === layoutOption.value">
                    <el-icon><Check /></el-icon>
                  </div>
                </div>
                </div>
              </div>
            </div>

            <!-- 加载动画选择器：首屏 loader 与应用内 ReLoader 共用同一款动画 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Loading /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.loaderStyle") }}</span>
              </div>

              <div class="section-card">
                <ReLoaderStyleSelector />
              </div>
            </div>

            <!-- 登录页样式选择器（与登录页同一组件，数据/预览统一） -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Monitor /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.loginStyle") }}</span>
              </div>

              <div class="section-card">
                <ReLoginStyleSelector />
              </div>
            </div>

            <!-- 登录验证（图形验证码 / 滑块 / 动态口令）已移除：
                 这三项由后端 /v2/setting/default 经 core 的 SETTING_TO_LOGIN_MAP 下发
                 （CheckCodeOpen / SlidingBlockOpen / CheckTotpOpen），以及 app.yaml 的
                 loginConfig 段决定，属部署侧配置。放在用户主题配置里会让用户以为
                 自己能改，实际改不动也不该由前端决定，故不在此提供开关。 -->
          </template>

          <!-- ============ 界面：界面配置 ============ -->
          <template #interface>
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><ChatLineRound /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.interfaceConfig") }}</span>
              </div>

              <div class="section-card">
                <div class="interface-config">
                <div class="config-item">
                  <div class="config-label">
                    <span>{{ t("themeConfig.interface.routeAnimation.label") }}</span>
                  </div>
                  <el-select :placeholder="t('themeConfig.interface.routeAnimation.placeholder')" v-model="transition" clearable class="config-input">
                    <el-option :label="t('themeConfig.interface.routeAnimation.none')" value="none" />
                    <el-option :label="t('themeConfig.interface.routeAnimation.default')" value="fade-default" />
                    <el-option :label="t('themeConfig.interface.routeAnimation.fade')" value="fade" />
                    <el-option :label="t('themeConfig.interface.routeAnimation.slide')" value="fade-slide" />
                    <el-option :label="t('themeConfig.interface.routeAnimation.zoomFade')" value="zoom-fade" />
                    <el-option :label="t('themeConfig.interface.routeAnimation.fadeBottom')" value="fade-bottom" />
                    <el-option :label="t('themeConfig.interface.routeAnimation.fadeScale')" value="fade-scale" />
                  </el-select>
                </div>

                <div class="config-item">
                  <div class="config-label">{{ t("themeConfig.interface.menuWidth") }}</div>
                  <ReInputNumber layout="card" :min="200" :max="260" :step="2" suffix="px" v-model="menuWidth" class="config-input" />
                </div>

                <div class="config-item">
                  <div class="config-label">{{ t("themeConfig.interface.tabsStyle.label") }}</div>
                  <el-select :placeholder="t('themeConfig.interface.tabsStyle.placeholder')" v-model="tabsStyle" class="config-input">
                    <el-option :label="t('themeConfig.interface.tabsStyle.card')" value="card" />
                    <el-option :label="t('themeConfig.interface.tabsStyle.google')" value="google" />
                    <el-option :label="t('themeConfig.interface.tabsStyle.plain')" value="plain" />
                  </el-select>
                </div>

                <div class="config-item">
                  <div class="config-label">{{ t("themeConfig.interface.dimension.label") }}</div>
                  <el-select
                    :placeholder="t('themeConfig.interface.dimension.placeholder')"
                    v-model="dimension"
                    clearable
                    class="config-input"
                    @change="handleDimension"
                  >
                    <el-option v-for="item in dimensionList" :key="item.value" :label="item.label" :value="item.value" />
                  </el-select>
                </div>

                <ReSwitch layout="card"
                  :title="t('themeConfig.switchBlocks.accordion.title')"
                  :sub="t('themeConfig.switchBlocks.accordion.sub')"
                  :tip="t('themeConfig.switchBlocks.accordion.tip')"
                  :description="t('themeConfig.switchBlocks.accordion.description')"
                  v-model="uniqueOpened"
                />

                <ReSwitch layout="card"
                  :title="t('themeConfig.switchBlocks.asideInverted.title')"
                  :sub="t('themeConfig.switchBlocks.asideInverted.sub')"
                  :tip="t('themeConfig.switchBlocks.asideInverted.tip')"
                  :description="t('themeConfig.switchBlocks.asideInverted.description')"
                  v-model="asideInverted"
                />

                 <ReSwitch layout="card"
                   :title="t('themeConfig.switchBlocks.headerInverted.title')"
                   :sub="t('themeConfig.switchBlocks.headerInverted.sub')"
                   :tip="t('themeConfig.switchBlocks.headerInverted.tip')"
                   :description="t('themeConfig.switchBlocks.headerInverted.description')"
                   v-model="headerInverted"
                 />

                 <ReSwitch layout="card"
                   :title="t('themeConfig.switchBlocks.headerShown.title')"
                   :sub="t('themeConfig.switchBlocks.headerShown.sub')"
                   :tip="t('themeConfig.switchBlocks.headerShown.tip')"
                   :description="t('themeConfig.switchBlocks.headerShown.description')"
                   v-model="headerShown"
                 />

                 <ReSwitch layout="card"
                   :title="t('themeConfig.switchBlocks.tabsShown.title')"
                   :sub="t('themeConfig.switchBlocks.tabsShown.sub')"
                   :tip="t('themeConfig.switchBlocks.tabsShown.tip')"
                   :description="t('themeConfig.switchBlocks.tabsShown.description')"
                   v-model="tabsShown"
                 />

                 <ReSwitch layout="card" v-admin
                   :title="t('themeConfig.switchBlocks.skeletonCritter.title')"
                   :sub="t('themeConfig.switchBlocks.skeletonCritter.sub')"
                   :tip="t('themeConfig.switchBlocks.skeletonCritter.tip')"
                   :description="t('themeConfig.switchBlocks.skeletonCritter.description')"
                   v-model="skeletonCritterShown"
                 />

                 <div class="config-item" v-admin>
                   <div class="config-label">{{ t("themeConfig.interface.skeletonCritter.label") }}</div>
                   <el-select v-model="skeletonCritterAnimal" class="config-input">
                     <el-option :label="t('themeConfig.interface.skeletonCritter.bird')" value="bird" />
                     <el-option :label="t('themeConfig.interface.skeletonCritter.panda')" value="panda" />
                   </el-select>
                 </div>

                 <ReSwitch layout="card"
                  :title="t('themeConfig.switchBlocks.grey.title')"
                  :sub="t('themeConfig.switchBlocks.grey.sub')"
                  :tip="t('themeConfig.switchBlocks.grey.tip')"
                  :description="t('themeConfig.switchBlocks.grey.description')"
                  v-model="isGrey"
                  @change="changeGreyOrWeak('grey', !!$event)"
                />

                <ReSwitch layout="card"
                  :title="t('themeConfig.switchBlocks.weak.title')"
                  :sub="t('themeConfig.switchBlocks.weak.sub')"
                  :tip="t('themeConfig.switchBlocks.weak.tip')"
                  :description="t('themeConfig.switchBlocks.weak.description')"
                  v-model="isWeak"
                  @change="changeGreyOrWeak('weak', !!$event)"
                />

                <ReSwitch layout="card"
                  :title="t('themeConfig.switchBlocks.collapse.title')"
                  :sub="t('themeConfig.switchBlocks.collapse.sub')"
                  :tip="t('themeConfig.switchBlocks.collapse.tip')"
                  :description="t('themeConfig.switchBlocks.collapse.description')"
                  v-model="isCollapse"
                />

                <ReSwitch layout="card"
                  :title="t('themeConfig.switchBlocks.collapseButton.title')"
                  :sub="t('themeConfig.switchBlocks.collapseButton.sub')"
                  :tip="t('themeConfig.switchBlocks.collapseButton.tip')"
                  :description="t('themeConfig.switchBlocks.collapseButton.description')"
                  v-model="collapseButton"
                />

                <ReSwitch layout="card"
                  :title="t('themeConfig.switchBlocks.collapseBar.title')"
                  :sub="t('themeConfig.switchBlocks.collapseBar.sub')"
                  :tip="t('themeConfig.switchBlocks.collapseBar.tip')"
                  :description="t('themeConfig.switchBlocks.collapseBar.description')"
                  v-model="collapseBar"
                />
                </div>
              </div>
            </div>

          </template>

          <!-- ============ 扩展：工具栏开关 + 消息通知 ============ -->
          <template #extension>
            <!-- 工具栏开关 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Operation /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.toolbarSwitch") }}</span>
              </div>
              <div class="section-card">
                <div class="extension-switches">
                  <ReSwitch layout="card"
                    v-for="item in toolbarSwitchList"
                    :key="item.key"
                    :title="item.label"
                    :sub="item.sub"
                    :tip="item.tip"
                    :description="item.description"
                    :model-value="isToolbarUserEnabled(item.key)"
                    @update:model-value="setToolbarUserPref(item.key, $event)"
                  />
                </div>
              </div>
            </div>

            <!-- 消息通知 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Bell /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.messageNotify") }}</span>
              </div>
              <div class="section-card">
                <div class="config-item">
                  <div class="config-label">{{ t("themeConfig.message.position.label") }}</div>
                  <el-select v-model="messagePosition" class="config-input" @change="handleMessagePosition">
                    <el-option :label="t('themeConfig.message.position.toolbar')" value="toolbar" />
                    <el-option :label="t('themeConfig.message.position.rightBottom')" value="right-bottom" />
                    <el-option :label="t('themeConfig.message.position.hidden')" value="hidden" />
                  </el-select>
                </div>
                <ReSwitch layout="card"
                  :title="t('themeConfig.message.push.title')"
                  :sub="t('themeConfig.message.push.sub')"
                  :tip="t('themeConfig.message.push.tip')"
                  :description="t('themeConfig.message.push.description')"
                  v-model="messageSocket"
                />
              </div>
            </div>

            <!-- 首页配置 -->
            <div class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><HomeFilled /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.homeConfig") }}</span>
              </div>
              <div class="section-card">
                <ReSwitch layout="card"
                  :title="t('themeConfig.home.customLayout.title')"
                  :sub="t('themeConfig.home.customLayout.sub')"
                  :tip="t('themeConfig.home.customLayout.tip')"
                  :description="t('themeConfig.home.customLayout.description')"
                  v-model="homeConfig.customLayoutButton"
                />
              </div>
            </div>

            <!-- 天气配置（部署侧 weather.enable 未开时整段不出现） -->
            <div v-if="weatherDeployed" class="config-section">
              <div class="section-header">
                <el-icon :size="18" class="section-icon"><Sunny /></el-icon>
                <span class="section-title">{{ t("themeConfig.sections.weatherConfig") }}</span>
              </div>
              <div class="config-card">
                <ReSwitch layout="card"
                  :title="t('themeConfig.weather.enable.title')"
                  :sub="t('themeConfig.weather.enable.sub')"
                  :tip="t('themeConfig.weather.enable.tip')"
                  :description="t('themeConfig.weather.enable.description')"
                  v-model="weatherEnable"
                />
              </div>
            </div>

          </template>
        </ReTab>
      </div>
    </template>
  </ReDrawer>
</template>

<script setup lang="ts">
// @ts-nocheck

// @ts-nocheck
import { ref, reactive, onMounted, onUnmounted, watch, computed } from "vue";
import { DEFAULT_THEME } from "@repo/config";
import { useTheme } from "@repo/theme";
import { storeToRefs } from "pinia";
import { mittBus, applyMessageColorVars, mixColor, normalizeThemeColor } from "@repo/utils";
import useGlobalStore from "@repo/pinia/modules/global";
import {msgSuccess, message} from "@repo/core";
import { useI18n } from "vue-i18n";
import { getConfig, setConfig } from "@repo/config";
import { isToolbarDeployed, isToolbarUserEnabled, setToolbarUserPref } from "../Header/toolbarPrefs";
import type { OtherConfig, MessageConfig, TimerConfig, AppConfig, AccessibilityConfig, DevToolsConfig, HeatmapConfig, PerformanceConfig, AiChatConfig } from "@repo/config";

import ReTab, { type ReTabItem } from "@repo/ui/re-tab";
import ReSwitch from "@repo/ui/re-switch";
import ReInputNumber from "@repo/ui/re-input-number";

import ReLoginStyleSelector from "@repo/theme/koi/views/login/components/ReLoginStyleSelector.vue";
import ReLoaderStyleSelector from "./components/ReLoaderStyleSelector.vue";
import ReSettingAiChat from "./components/ReSettingAiChat.vue";
import ReSettingAccessibility from "./components/ReSettingAccessibility.vue";
import ReSettingDevTools from "./components/ReSettingDevTools.vue";
import ReSettingSystemDebug from "./components/ReSettingSystemDebug.vue";
import ReSettingEmptyState from "./components/ReSettingEmptyState.vue";
import ReSettingHeatmap from "./components/ReSettingHeatmap.vue";
import ReSettingPerformance from "./components/ReSettingPerformance.vue";
import { isHeaderFlagKey } from "@repo/theme/koi/layouts/components/Header/components/headerKeys";
import { ArrowDown, Delete, Plus, Clock, Files, Download, Upload, Sunny, Bell, Operation, HomeFilled, Connection, Loading } from "@element-plus/icons-vue";
const { t } = useI18n();
const globalStore = useGlobalStore();

// 主题配置抽屉关闭是否二次确认（app.yaml other.themeConfigCloseConfirm）
const themeConfigCloseConfirm = computed(() => getConfig().other.themeConfigCloseConfirm);

// 设置面板 tab 分栏（高级置于扩展右侧）
const activeTab = ref("appearance");
const configTabs: ReTabItem[] = [
  { name: "appearance", label: t("themeConfig.tabs.appearance"), icon: "Connection" },
  { name: "interface", label: t("themeConfig.tabs.interface"), icon: "Grid" },
  { name: "extension", label: t("themeConfig.tabs.extension"), icon: "Menu" },
  { name: "advanced", label: t("themeConfig.tabs.advanced"), icon: "Setting" },
];

const { changeThemeColor, changeGreyOrWeak, changeThemeMode } = useTheme();
const {
   layout,
   isCollapse,
   transition,
   tabsStyle,
   uniqueOpened,
   menuWidth,
   isGrey,
   isWeak,
   asideInverted,
   headerInverted,
   isHeaderShown,
   isTabsShown,
   themeMode,
   isDark
 } = storeToRefs(globalStore);

const headerShown = computed({
  get: () => isHeaderShown.value,
  set: (v: boolean) => globalStore.setGlobalState("isHeaderShown", v),
});
const tabsShown = computed({
  get: () => isTabsShown.value,
  set: (v: boolean) => globalStore.setGlobalState("isTabsShown", v),
});
const skeletonCritterShown = computed({
  get: () => globalStore.isSkeletonCritterShown,
  set: (v: boolean) => globalStore.setGlobalState("isSkeletonCritterShown", v),
});
const skeletonCritterAnimal = computed({
  get: () => globalStore.skeletonCritterAnimal,
  set: (v: "bird" | "panda") => globalStore.setGlobalState("skeletonCritterAnimal", v),
});

// 主题模式选项（明亮 / 黑暗 / 自动）→ 胶囊式分段控件
const themeModeTabs = computed<ReTabItem[]>(() => [
  { name: "light", label: t("themeConfig.themeModeTabs.light"), icon: "Sunny" },
  { name: "dark", label: t("themeConfig.themeModeTabs.dark"), icon: "Moon" },
  { name: "auto", label: t("themeConfig.themeModeTabs.auto"), icon: "Monitor" },
]);

// ==================== 自定义主题颜色：基色 + 亮度/深浅滑条 ====================
/** 自定义颜色基色（取色器选出的色相，不含明暗调整） */
const customBase = ref<string>(normalizeThemeColor(globalStore.themeColor || DEFAULT_THEME));
/** 亮度/深浅调整（-100 ~ +100，负=加深，正=提亮） */
const customLightness = ref(0);

/** 根据基色 + 亮度调整计算最终颜色 */
function adjustLightness(hex: string, value: number): string {
  const safe = normalizeThemeColor(hex);
  if (value > 0) return mixColor(safe, "#ffffff", value / 100);
  if (value < 0) return mixColor(safe, "#000000", -value / 100);
  return safe;
}

/** 自定义颜色（响应式：基色或滑条变化即重算） */
const customColor = computed(() => adjustLightness(customBase.value, customLightness.value));

/** 自定义色当前是否生效（当前主题色不在预设色板中即视为自定义色） */
const isCustomActive = computed(() => !themeColors.includes(globalStore.themeColor));

/** 取色器选中新基色：重置亮度并应用 */
const handleCustomColor = (val: string | null) => {
  if (!val) return;
  customBase.value = normalizeThemeColor(val);
  customLightness.value = 0;
  applyCustomColor();
};

/** 应用当前自定义颜色到主题 */
const applyCustomColor = () => {
  changeThemeColor(customColor.value);
};

// ==================== 颜色状态：消息提示四种状态色（实时控制全局 message 颜色） ====================
/** 消息状态默认色值 */
const MSG_STATUS_DEFAULTS: Record<string, string> = {
  success: "#16A34A",
  warning: "#F97316",
  danger: "#DC2626",
  info: "#5D5B6E",
};

/** 消息状态项：type（对应 el-message）/ 标题 / 色值（可被用户取色修改）/ 左侧图标 */
const msgStatusItems = reactive<Array<{ type: string; label: string; labelKey: string; color: string; badgeIcon: string }>>([
  { type: "success", label: "", labelKey: "themeConfig.msgStatus.success", color: MSG_STATUS_DEFAULTS.success, badgeIcon: "Check" },
  { type: "warning", label: "", labelKey: "themeConfig.msgStatus.warning", color: MSG_STATUS_DEFAULTS.warning, badgeIcon: "Check" },
  { type: "danger", label: "", labelKey: "themeConfig.msgStatus.danger", color: MSG_STATUS_DEFAULTS.danger, badgeIcon: "Check" },
  { type: "info", label: "", labelKey: "themeConfig.msgStatus.info", color: MSG_STATUS_DEFAULTS.info, badgeIcon: "ArrowDown" },
]);

/** 取色变化：实时写 CSS 变量控制全局 message 颜色，并触发演示 */
const handleMsgColorChange = (item: { type: string; color: string }, val: string | null) => {
  if (!val) {
    return;
  }
  item.color = val;
  applyMessageColorVars(document.documentElement, { [item.type]: val }, isDark.value);
  handleMsgStatusClick(item.type);
};

/** 点击状态卡片 → 触发对应类型的 el-message 演示 */
const handleMsgStatusClick = (type: string) => {
  const handlers: Record<string, () => void> = {
    success: () => message.success(t("themeConfig.msgStatus.successToast")),
    warning: () => message.warning(t("themeConfig.msgStatus.warningToast")),
    danger: () => message.error(t("themeConfig.msgStatus.dangerToast")),
    info: () => message.info(t("themeConfig.msgStatus.infoToast")),
  };
  handlers[type]?.();
};

/** 挂载时写入消息状态色 CSS 变量（保证全局 message 使用用户配置色） */
const applyAllMsgStatusColors = () => {
  const colors: Record<string, string> = {};
  msgStatusItems.forEach((item) => {
    colors[item.type] = item.color;
  });
  applyMessageColorVars(document.documentElement, colors, isDark.value);
};

// 组件尺寸相关
const dimension = computed(() => globalStore.dimension);
const dimensionList = ref<any>([]);

onMounted(() => {
  handleSwitchLanguage();
  mittBus.on(THEME_CONFIG_EVENT, handleThemeConfig);
  // 应用消息状态色 CSS 变量（实时控制全局 el-message 颜色）
  applyAllMsgStatusColors();
  // 暗色模式色阶不同，切换时重算
  watch(isDark, applyAllMsgStatusColors);
});

onUnmounted(() => {
  mittBus.off(THEME_CONFIG_EVENT, handleThemeConfig);
});

/** 切换语言 */
const handleSwitchLanguage = () => {
  dimensionList.value = [
    { label: t("header.dimensionList.default"), value: "default" },
    { label: t("header.dimensionList.large"), value: "large" },
    { label: t("header.dimensionList.small"), value: "small" }
  ];
};

/** 监听 globalStore.language 的变化 */
watch(
  () => globalStore.language,
  () => {
    handleSwitchLanguage();
  }
);

const handleDimension = (item: string) => {
  if (dimension.value === item) return;
  globalStore.setDimension(item);
  msgSuccess(t("msg.success"));
};

// 主题颜色配置
/** 预设主题色：2 行 × 6 正圆形色板 */
const themeColors = [
  // 第一行：选定蓝 / 深蓝 / 浅紫 / 灰紫 / 青绿色 / 深墨绿
  "#3986FF",
  "#1E56A0",
  "#A78BFA",
  "#8A7FA8",
  "#0FB5AE",
  "#0E7C66",
  // 第二行：橘橙 / 亮天蓝 / 正红 / 深紫 / 玫红 / 湖蓝
  "#FF7A2F",
  "#2EC9FF",
  "#F5222D",
  "#722ED1",
  "#EB2F96",
  "#13C2C2",
];

/** 布局预览类名 koi-* 前缀，避免与 html class / 真实 Layout 组件冲突 */
const layoutOptions = computed(() => [
  { value: "vertical", label: t("themeConfig.layout.vertical"), previewClass: "koi-layout-vertical", hasContainer: true, hasLight: false },
  { value: "columns", label: t("themeConfig.layout.columns"), previewClass: "koi-layout-columns", hasContainer: false, hasLight: false },
  { value: "double", label: t("themeConfig.layout.double"), previewClass: "koi-layout-double", hasContainer: false, hasLight: false },
  { value: "classic", label: t("themeConfig.layout.classic"), previewClass: "koi-layout-classic", hasContainer: true, hasLight: false },
  { value: "optimum", label: t("themeConfig.layout.optimum"), previewClass: "koi-layout-optimum", hasContainer: true, hasLight: false },
  { value: "horizontal", label: t("themeConfig.layout.horizontal"), previewClass: "koi-layout-horizontal", hasContainer: false, hasLight: false },
  { value: "group", label: t("themeConfig.layout.group"), previewClass: "koi-layout-group", hasContainer: true, hasLight: false }
]);

const koiDrawerRef = ref();
const THEME_CONFIG_EVENT = "handleThemeConfig";

/** 打开主题配置 */
const handleThemeConfig = () => {
  koiDrawerRef.value?.koiOpen();
};

/** 布局切换（class 同步由 useTheme watch 自动完成，此处只改 store） */
const setLayout = (value: string) => {
  globalStore.setGlobalState("layout", value);
};

// ==================== 扩展 tab ====================

/**
 * 工具栏开关列表（app.yaml other.toolbar）
 *
 * <p>配了 `other.toolbar.items` 时只保留 yaml 里列出的**顶栏**条目：未列入的条目
 * 在头部根本不渲染，再留一个开关只会让用户"拨了没反应"。`breadcrumb*` / `tabIcon` /
 * `logo` 属于布局元素、不受 items 管辖，始终保留。</p>
 *
 * <p>未配 items（空数组）时行为与改造前一致：全部列出。</p>
 */
const toolbarSwitchList = computed(() => {
  const all = [
  { key: "searchMenu", label: t("themeConfig.toolbar.searchMenu.label"), sub: t("themeConfig.toolbar.searchMenu.sub"), tip: t("themeConfig.toolbar.searchMenu.tip"), description: t("themeConfig.toolbar.searchMenu.description") },
  { key: "refresh", label: t("themeConfig.toolbar.refresh.label"), sub: t("themeConfig.toolbar.refresh.sub"), tip: t("themeConfig.toolbar.refresh.tip"), description: t("themeConfig.toolbar.refresh.description") },
  { key: "dark", label: t("themeConfig.toolbar.dark.label"), sub: t("themeConfig.toolbar.dark.sub"), tip: t("themeConfig.toolbar.dark.tip"), description: t("themeConfig.toolbar.dark.description") },
  { key: "language", label: t("themeConfig.toolbar.language.label"), sub: t("themeConfig.toolbar.language.sub"), tip: t("themeConfig.toolbar.language.tip"), description: t("themeConfig.toolbar.language.description") },
  { key: "fullScreen", label: t("themeConfig.toolbar.fullScreen.label"), sub: t("themeConfig.toolbar.fullScreen.sub"), tip: t("themeConfig.toolbar.fullScreen.tip"), description: t("themeConfig.toolbar.fullScreen.description") },
  { key: "themeSetting", label: t("themeConfig.toolbar.themeSetting.label"), sub: t("themeConfig.toolbar.themeSetting.sub"), tip: t("themeConfig.toolbar.themeSetting.tip"), description: t("themeConfig.toolbar.themeSetting.description") },
  { key: "user", label: t("themeConfig.toolbar.user.label"), sub: t("themeConfig.toolbar.user.sub"), tip: t("themeConfig.toolbar.user.tip"), description: t("themeConfig.toolbar.user.description") },
  { key: "breadcrumb", label: t("themeConfig.toolbar.breadcrumb.label"), sub: t("themeConfig.toolbar.breadcrumb.sub"), tip: t("themeConfig.toolbar.breadcrumb.tip"), description: t("themeConfig.toolbar.breadcrumb.description") },
  { key: "breadcrumbDropdown", label: t("themeConfig.toolbar.breadcrumbDropdown.label"), sub: t("themeConfig.toolbar.breadcrumbDropdown.sub"), tip: t("themeConfig.toolbar.breadcrumbDropdown.tip"), description: t("themeConfig.toolbar.breadcrumbDropdown.description") },
  { key: "breadcrumbIcon", label: t("themeConfig.toolbar.breadcrumbIcon.label"), sub: t("themeConfig.toolbar.breadcrumbIcon.sub"), tip: t("themeConfig.toolbar.breadcrumbIcon.tip"), description: t("themeConfig.toolbar.breadcrumbIcon.description") },
  { key: "tabIcon", label: t("themeConfig.toolbar.tabIcon.label"), sub: t("themeConfig.toolbar.tabIcon.sub"), tip: t("themeConfig.toolbar.tabIcon.tip"), description: t("themeConfig.toolbar.tabIcon.description") },
  { key: "logo", label: t("themeConfig.toolbar.logo.label"), sub: t("themeConfig.toolbar.logo.sub"), tip: t("themeConfig.toolbar.logo.tip"), description: t("themeConfig.toolbar.logo.description") },
  { key: "message", label: t("themeConfig.toolbar.message.label"), sub: t("themeConfig.toolbar.message.sub"), tip: t("themeConfig.toolbar.message.tip"), description: t("themeConfig.toolbar.message.description") },
  { key: "quickNote", label: t("themeConfig.toolbar.quickNote.label"), sub: t("themeConfig.toolbar.quickNote.sub"), tip: t("themeConfig.toolbar.quickNote.tip"), description: t("themeConfig.toolbar.quickNote.description") },
  { key: "quickNoteConfirm", label: t("themeConfig.toolbar.quickNoteConfirm.label"), sub: t("themeConfig.toolbar.quickNoteConfirm.sub"), tip: t("themeConfig.toolbar.quickNoteConfirm.tip"), description: t("themeConfig.toolbar.quickNoteConfirm.description") },
  // 天气不放在工具栏开关里：独立的「天气配置」分区已提供开关（避免出现两个"天气"）
  { key: "typhoon", label: t("themeConfig.toolbar.typhoon.label"), sub: t("themeConfig.toolbar.typhoon.sub"), tip: t("themeConfig.toolbar.typhoon.tip"), description: t("themeConfig.toolbar.typhoon.description") },
  { key: "exchangeRate", label: t("themeConfig.toolbar.exchangeRate.label"), sub: t("themeConfig.toolbar.exchangeRate.sub"), tip: t("themeConfig.toolbar.exchangeRate.tip"), description: t("themeConfig.toolbar.exchangeRate.description") },
  ];

  // 部署侧没开放的开关不列出来：yaml 写 false 等于这个功能没给用户
  const deployed = all.filter((row) => isToolbarDeployed(row.key));

  const declared = (getConfig().other?.toolbar?.items ?? [])
    .filter((item) => item && item.visible !== false)
    .map((item) => String(item.key ?? "").trim());
  // 未配置 / 空数组：沿用固有顺序，抽屉保持原样（向后兼容）
  if (!declared.length) {
    return deployed;
  }
  return deployed.filter((row) =>
    isHeaderFlagKey(row.key) ? declared.includes(row.key) : true,
  );
});

/** 响应式配置单例（直接修改即可实时联动组件开关） */
const appConfig = getConfig();

/**
 * 工具栏开关走「用户偏好」层：
 * yaml 的 toolbar.<key> 是 master（false 时该行不出现），开关本身只改本机偏好。
 */

/** 顶部计时器：启用开关 / 时区列表（最多 3 个，UTC ±12） */
const timerEnable = ref(appConfig.other.timer.enable);
const timerZones = ref<number[]>([...appConfig.other.timer.zones]);
/** 最多时区数量 */
const MAX_TIMER_ZONES = 3;

/** 时区候选数据：UTC 偏移 → 代表城市（-12 ~ +12，与 Worker 支持的整数偏移对齐） */
const timerZonesData: Array<{ offset: number; city: string }> = [
  { offset: -12, city: "埃尼威托克" },
  { offset: -11, city: "帕果帕果" },
  { offset: -10, city: "檀香山" },
  { offset: -9, city: "安克雷奇" },
  { offset: -8, city: "洛杉矶" },
  { offset: -7, city: "丹佛" },
  { offset: -6, city: "芝加哥" },
  { offset: -5, city: "纽约" },
  { offset: -4, city: "加拉加斯" },
  { offset: -3, city: "布宜诺斯艾利斯" },
  { offset: -2, city: "南乔治亚岛" },
  { offset: -1, city: "亚速尔群岛" },
  { offset: 0, city: "伦敦" },
  { offset: 1, city: "巴黎" },
  { offset: 2, city: "开罗" },
  { offset: 3, city: "莫斯科" },
  { offset: 4, city: "迪拜" },
  { offset: 5, city: "卡拉奇" },
  { offset: 6, city: "达卡" },
  { offset: 7, city: "曼谷" },
  { offset: 8, city: "北京" },
  { offset: 9, city: "东京" },
  { offset: 10, city: "悉尼" },
  { offset: 11, city: "努美阿" },
  { offset: 12, city: "奥克兰" },
];

/** UTC 偏移标签（UTC+8 / UTC-5 / UTC±0） */
const formatOffsetTag = (offset: number): string =>
  offset === 0 ? "UTC±0" : `UTC${offset > 0 ? "+" : ""}${offset}`;

/** 时区下拉选项：offset 作 value，label 用于筛选/选中展示 */
const timerZoneOptions = timerZonesData.map(({ offset, city }) => ({
  offset,
  city,
  tag: formatOffsetTag(offset),
  label: `${city}（${formatOffsetTag(offset)}）`,
}));

/** 按时区归类分组（美洲/太平洋 → 欧洲/非洲 → 亚洲/大洋洲） */
const timerZoneGroups = computed(() => [
  { label: t("header.timer.groupAmericas"), zones: timerZoneOptions.filter((z) => z.offset <= -4) },
  { label: t("header.timer.groupEurope"), zones: timerZoneOptions.filter((z) => z.offset >= -3 && z.offset <= 3) },
  { label: t("header.timer.groupAsia"), zones: timerZoneOptions.filter((z) => z.offset >= 4) },
]);

/** 添加时区（最多 3 个） */
const addTimerZone = () => {
  if (timerZones.value.length >= MAX_TIMER_ZONES) return;
  timerZones.value.push(0);
};

/** 移除时区 */
const removeTimerZone = (index: number) => {
  timerZones.value.splice(index, 1);
};

// 启用开关 / 时区列表变化 → 写回响应式配置（实时联动 Header 计时器）
watch(timerEnable, (val) => {
  appConfig.other.timer.enable = val;
});
watch(
  timerZones,
  (val) => {
    appConfig.other.timer.zones = val.slice(0, MAX_TIMER_ZONES);
  },
  { deep: true },
);

/** 消息通知：展示位置 / 实时推送 */
const messagePosition = ref(appConfig.message.position);
const messageSocket = ref(appConfig.message.socket);
const handleMessagePosition = (val: string) => {
  appConfig.message.position = val as "toolbar" | "right-bottom" | "hidden";
};
watch(messageSocket, (val) => {
  appConfig.message.socket = val;
});

/**
 * 天气配置（抽屉里唯一的天气开关）
 *
 * 双开关：部署侧 `weather.enable` 决定天气功能是否存在（未开时整段不出现），
 * 这里只写用户的显示偏好，不再改部署配置。
 */
const weatherDeployed = computed(() => appConfig.other.weather.enable);
const weatherEnable = ref(isToolbarUserEnabled("weather"));

/** 首页配置：通过 homeConfig.customLayoutButton 直接绑定到 appConfig.other.home，再由 watch 自动持久化 */
const homeConfig = computed(() => appConfig.other.home);
watch(weatherEnable, (val) => {
  setToolbarUserPref("weather", !!val);
});

/**
 * 折叠形态（menuConfig.collapse，迭代自 collapseToButton；向下兼容见 resolveMenuCollapse）：
 *   collapseButton — 折叠后是否显示「展开菜单」按钮（通常与 mini 菜单条并存）
 *   collapseBar    — 折叠后是否保留迷你图标菜单条（"yes"=保留，"no"=隐藏）
 */
const collapseConfig = computed(() => {
  appConfig.menu ??= {};
  appConfig.menu.collapse ??= { showButton: false, showBar: "yes" };
  return appConfig.menu.collapse;
});

/** 折叠后是否显示「展开菜单」按钮（v-model：true 开启显示） */
const collapseButton = computed({
  get: () => collapseConfig.value.showButton === true,
  set: (val: boolean) => {
    collapseConfig.value.showButton = val;
    // 已用新 key 驱动，清掉 legacy 标记避免旧映射干扰
    appConfig.menu.collapseToButton = false;
  },
});

/** 折叠后是否保留迷你侧边栏（v-model：true 保留；由 "yes"|"no" 落地） */
const collapseBar = computed({
  get: () => collapseConfig.value.showBar === "yes",
  set: (val: boolean) => {
    collapseConfig.value.showBar = val ? "yes" : "no";
    appConfig.menu.collapseToButton = false;
  },
});

// ==================== 用户配置导入 / 导出 ====================

/** 导出文件前缀 */
const USER_CONFIG_FILE_PREFIX = "user-config";

/** 导出用户配置：appConfig 用户可调部分 + globalStore 界面状态 → JSON 文件 */
const exportUserConfig = () => {
  const cfg = getConfig();
  const snapshot = {
    version: 1,
    exportedAt: new Date().toISOString(),
    config: {
      other: JSON.parse(JSON.stringify(cfg.other)),
      message: JSON.parse(JSON.stringify(cfg.message)),
      // 与 user-config.v2 持久化切片保持一致：菜单展示 / login 一起导出。
      // login 整片都是后端下发的（品牌文案 + 验证码/滑块/OTP，见 core/setting.ts
      // 的 SETTING_TO_LOGIN_MAP），抽屉里已不再提供任何开关，这里保留切片只为
      // 导入导出格式不变；它不该被当作「用户可调项」理解。
      menu: JSON.parse(JSON.stringify(cfg.menu)),
      login: JSON.parse(JSON.stringify(cfg.login)),
    },
    global: {
      themeColor: globalStore.themeColor,
      themeMode: globalStore.themeMode,
      layout: globalStore.layout,
      loginStyle: globalStore.loginStyle,
      transition: globalStore.transition,
      tabsStyle: globalStore.tabsStyle,
      dimension: globalStore.dimension,
      menuWidth: globalStore.menuWidth,
      uniqueOpened: globalStore.uniqueOpened,
      asideInverted: globalStore.asideInverted,
      headerInverted: globalStore.headerInverted,
      isGrey: globalStore.isGrey,
      isWeak: globalStore.isWeak,
      isSkeletonCritterShown: globalStore.isSkeletonCritterShown,
      skeletonCritterAnimal: globalStore.skeletonCritterAnimal,
    },
  };

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${USER_CONFIG_FILE_PREFIX}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  msgSuccess(t("themeConfig.io.exportSuccess"));
};

/** 导入用户配置：读取 JSON 文件并应用（主题/布局/计时器等实时生效） */
const importUserConfig = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = async () => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (
        !data ||
        typeof data !== "object" ||
        !data.config?.other ||
        typeof data.global !== "object"
      ) {
        throw new Error("invalid config file");
      }
      applyImportedConfig(data);
      msgSuccess(t("themeConfig.io.importSuccess"));
    } catch {
      message.error(t("themeConfig.io.importError"));
    }
  };
  input.click();
};

/** 应用导入的用户配置（写回响应式配置 + 全局状态 + 本地 ref 联动） */
const applyImportedConfig = (data: {
  config?: {
    other?: OtherConfig;
    message?: MessageConfig;
    menu?: AppConfig["menu"];
    login?: AppConfig["login"];
  };
  global?: Record<string, unknown>;
}) => {
  const c = data.config ?? {};

  // 1. 响应式配置（setConfig 深合并）：工具栏/计时器/状态色/消息位置 + 菜单展示
  //    + login（后端下发、抽屉里已无开关，仅为导入导出格式兼容而透传）
  setConfig({
    other: c.other as AppConfig["other"],
    message: c.message as AppConfig["message"],
    menu: c.menu as AppConfig["menu"],
    login: c.login as AppConfig["login"],
  });

  // 1.1 顶栏开关现在是「用户偏好」层：导入文件里的 toolbar.<key> 布尔值同步过去，
  //     否则导入后顶栏不会跟着变化（yaml 值只作为 master）
  const importedToolbar = c.other?.toolbar as unknown as Record<string, unknown> | undefined;
  if (importedToolbar && typeof importedToolbar === "object") {
    for (const [key, value] of Object.entries(importedToolbar)) {
      if (typeof value === "boolean") {
        setToolbarUserPref(key, value);
      }
    }
  }

  // 2. 同步本组件本地 ref（其 watch 会继续写回响应式配置，保证抽屉 UI 一致）
  const timer = c.other?.timer as TimerConfig | undefined;
  if (timer) {
    timerEnable.value = !!timer.enable;
    timerZones.value = (timer.zones ?? []).slice(0, MAX_TIMER_ZONES);
  }
  const msg = c.message as MessageConfig | undefined;
  if (msg?.position) messagePosition.value = msg.position;
  if (typeof msg?.socket === "boolean") messageSocket.value = msg.socket;

  // 3. 全局界面状态（layout / themeColor / themeMode 等）
  const g = data.global ?? {};
  const setters: Array<[string, unknown]> = [
    ["themeColor", g.themeColor],
    ["themeMode", g.themeMode],
    ["layout", g.layout],
    ["loginStyle", g.loginStyle],
    ["transition", g.transition],
    ["tabsStyle", g.tabsStyle],
    ["dimension", g.dimension],
    ["menuWidth", g.menuWidth],
    ["uniqueOpened", g.uniqueOpened],
    ["asideInverted", g.asideInverted],
    ["headerInverted", g.headerInverted],
    ["isGrey", g.isGrey],
    ["isWeak", g.isWeak],
    ["isSkeletonCritterShown", g.isSkeletonCritterShown],
    ["skeletonCritterAnimal", g.skeletonCritterAnimal],
  ];
  setters.forEach(([key, value]) => {
    if (value !== undefined) globalStore.setGlobalState(key, value);
  });

  // 4. 主题实时重算（useTheme 全局 watch 已联动，此处兜底）
  useTheme().applyTheme();
};

</script>

<style lang="scss">
/** 主题抽屉：遮罩与面板同速过渡，避免先亮遮罩后出面板造成的闪一下 */
.el-overlay.theme-config-overlay {
  transition: opacity 0.2s ease !important;
}

.el-drawer.theme-config-drawer {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* 内嵌透明取色器（el-color-picker 根节点不继承父 scoped id，须放在非 scoped 块） */
.msg-status-item__hidden-picker,
.theme-color-custom-card__hidden-picker {
  position: absolute !important;
  inset: 0;
  opacity: 0;

  .el-color-picker__trigger,
  .el-color-picker__color {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: none;
    background: transparent;
  }

  .el-color-picker__icon {
    display: none;
  }
}

/* 时区下拉浮层（popper 挂载到 body，须全局样式）：分组标题 + 城市/UTC 徽标选项 */
.timer-zone-popper {
  .el-select-group__title {
    padding-left: 12px;
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.5px;
  }

  .timer-zone-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;

    &__left {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    &__icon {
      font-size: 14px;
      color: var(--el-text-color-secondary);
    }

    &__city {
      font-size: 13px;
      color: var(--el-text-color-primary);
      white-space: nowrap;
    }

    &__tag {
      flex-shrink: 0;
      padding: 1px 8px;
      font-size: 11px;
      font-weight: 600;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-7);
      border-radius: 999px;
    }
  }
}
</style>

<style lang="scss" scoped>
/** 主题配置面板：独立作用域，预览类名 koi-* 与真实 Layout 隔离 */
.theme-config-panel {
  isolation: isolate;
  contain: layout style;
}

.config-section {
  margin-bottom: 20px;
}

/* 配置项卡片：浅灰底 + 圆角，与抽屉背景区分 */
.section-card {
  padding: 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;

  :deep(.re-switch-card) {
    margin-top: 10px;
  }
}

html.dark .section-card {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 区块标题：浅蓝圆角方块图标（右上蓝点）+ 黑色加粗标题 + 标题下方渐变蓝短横条 */
.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 20px;

  .section-icon {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    margin-right: 10px;
    font-size: 17px;
    color: #2f8bf0;
    background: linear-gradient(135deg, #e8f2ff 0%, #d6e9ff 100%);
    border-radius: 10px;
    transition: all 0.3s ease;

    /* 图标右上角蓝色小圆点（新功能 / 未查看提醒标记） */
    &::after {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      content: "";
      background: #2f8bf0;
      border: 2px solid var(--el-bg-color);
      border-radius: 50%;
      box-shadow: 0 0 6px rgba(47, 139, 240, 0.6);
    }
  }

  .section-title {
    position: relative;
    padding-bottom: 9px;
    font-size: 15px;
    font-weight: 700;
    color: #1f2329;
    line-height: 1.2;
    letter-spacing: 0.3px;

    /* 文字下方渐变蓝色短横条装饰 */
    &::after {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 34px;
      height: 3px;
      content: "";
      background: linear-gradient(90deg, #2f8bf0 0%, #7ab6ff 100%);
      border-radius: 3px;
    }
  }

  &:hover {
    .section-icon {
      transform: scale(1.05);
    }
  }
}

html.dark .section-header {
  .section-title {
    color: #e5eaf3;
  }

  .section-icon {
    background: linear-gradient(135deg, #1b2a3d 0%, #16232f 100%);
  }
}

/**
 * 主题模式切换：外层浅灰大圆角边框包裹三个选项，
 * 选中项叠加一层亮蓝圆角边框标记当前状态（明亮/黑暗无独立边框）。
 */
.theme-mode-tabs {
  width: 100%;

  /* 外层底盘：一整圈浅灰色大圆角边框，包裹全部选项 */
  :deep(.re-tab-capsule__nav) {
    padding: 3px;
    background: #f4f5f7;
    border: 1px solid #e4e6e8;
    border-radius: 12px;
  }

  /* 单个选项：选中时叠加亮蓝圆角边框；未选中无独立边框 */
  :deep(.re-tab-capsule__item) {
    padding: 6px 0;
    border: 1px solid transparent;
    border-radius: 9px;

    &.is-active {
      background: #fff;
      border-color: #2f8bf0;
      color: #2f8bf0;
      box-shadow: 0 1px 4px rgba(47, 139, 240, 0.18);
    }
  }

  :deep(.re-tab-capsule__item.is-active .re-tab-capsule__icon) {
    color: #2f8bf0;
  }
}

html.dark .theme-mode-tabs {
  :deep(.re-tab-capsule__nav) {
    background: #16181c;
    border-color: #2a2d33;
  }

  :deep(.re-tab-capsule__item) {
    &.is-active {
      background: #1e2430;
      border-color: #3d9bff;
      color: #6db4ff;
    }
  }

  :deep(.re-tab-capsule__item.is-active .re-tab-capsule__icon) {
    color: #6db4ff;
  }
}

/** 自定义颜色区域：左预览方块 + 中文字 + 右亮度/深浅滑条 */
.theme-color-custom-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 14px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }

  .custom-swatch {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    cursor: pointer;
    border: 2px solid #fff;
    border-radius: 10px;
    outline: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;

    &:hover {
      transform: scale(1.05);
    }

    .custom-swatch__check {
      font-size: 16px;
      color: #fff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));
      pointer-events: none;
    }
  }

  .custom-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
    min-width: 0;

    .custom-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--el-text-color-primary);
    }

    .custom-desc {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .custom-hex {
      font-size: 13px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      color: var(--el-text-color-primary);
    }
  }

  /* 右侧竖向亮度/深浅滑条 */
  .custom-lightness {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 78px;
    padding: 6px 0;
    background: var(--el-fill-color-lighter);
    border-radius: 20px;

    :deep(.el-slider) {
      height: 100%;
    }
  }
}

html.dark .theme-color-custom-card {
  background: #1d1d1d;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);

  .custom-title,
  .custom-hex {
    color: #e5e6eb;
  }

  .custom-desc {
    color: #6a6f78;
  }
}

/** 颜色状态：消息提示四种状态色卡片列表 */
.msg-status-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.msg-status-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--el-bg-color);
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    transform: translateX(2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  /* 左侧色块：深色底 + 白色图标（可点击取色） */
  &__badge {
    position: relative;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    color: #fff;
    border-radius: 7px;
    cursor: pointer;
    transition: transform 0.15s ease;

    &:hover {
      transform: scale(1.08);
    }
  }

  /* 中间文字 */
  &__text {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }

  &__label {
    font-size: 13px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    line-height: 1.3;
  }

  &__hex {
    font-size: 11px;
    font-weight: 400;
    color: var(--el-text-color-secondary);
    line-height: 1.3;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  }

  /* 右侧环形刷新：浅色圆形底 */
  &__refresh {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
  }

  /* ===== 成功：浅绿边框 / 深绿块 + 白对勾 / 浅淡绿圆形刷新 ===== */
  &--success {
    border-color: #bbe7c8;

    .msg-status-item__refresh {
      background: #e6f6ec;
      color: #16a34a;
    }
  }

  /* ===== 警告：浅橙边框 / 橙块 + 白对勾 / 浅米色圆形刷新 ===== */
  &--warning {
    border-color: #fed7aa;

    .msg-status-item__refresh {
      background: #fdf0e2;
      color: #f97316;
    }
  }

  /* ===== 危险：浅红边框 / 正红块 + 白对勾 / 浅粉色圆形刷新 ===== */
  &--danger {
    border-color: #fecaca;

    .msg-status-item__refresh {
      background: #fde8e8;
      color: #dc2626;
    }
  }

  /* ===== 信息：浅灰边框 / 深灰紫块 + 白下拉箭头 / 浅灰色圆形刷新 ===== */
  &--info {
    border-color: #e4e4ec;

    .msg-status-item__refresh {
      background: #f0f0f4;
      color: #5d5b6e;
    }
  }
}

/** 主题颜色选择器：2 行 × 6 正圆形预设色板 */
.theme-colors-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px 8px;

  .theme-color-item {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      .color-dot {
        transform: scale(1.12);
      }
    }

    &:active {
      transform: scale(0.92);
    }

    /* 选中态：双层白蓝圆环 + 对勾 */
    &.active {
      .color-dot {
        box-shadow:
          0 0 0 2px #fff,
          0 0 0 4px #3986ff;
      }

      .color-check {
        opacity: 1;
        transform: scale(1);
      }
    }

    .color-dot {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.14);
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    }

    .color-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      opacity: 0;
      transform: scale(0.6);
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;
    }
  }
}

/** 毛玻璃布局背景缩略图：3 列 × 2 行 */
.frost-wallpaper-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.frost-wallpaper-item {
  position: relative;
  aspect-ratio: 16 / 10;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  /** 兜底色在行内 frostWallpaperThumbStyle 中与主题联动；此处仅作 CSS 降级 */
  background-color: color-mix(in srgb, var(--el-color-primary) 14%, var(--el-fill-color-light));
  background-size: cover;
  background-position: center;
  border: 2px solid transparent;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 6%);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 14px rgb(0 0 0 / 10%);
  }

  &.is-active {
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 12px rgba(var(--el-color-primary-rgb), 0.35);
  }
}

.frost-wallpaper-check {
  position: absolute;
  right: 4px;
  bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 12px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 50%;
}

/** 布局配置预览（koi-* 与真实 Layout / html class 隔离）
 *  双栏布局：
 *  - 未激活：浅蓝灰底色 + 浅边框（与 section-card 区分）
 *  - 激活：主色高亮 + 粗边框 + 主色阴影
 */
.koi-layout-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 间距收紧：原来 12px 显得稀疏，一屏放不下几行 */
  gap: 8px;

  .koi-layout-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    /* 内边距收紧：预览块自身已带 6px 内边距，外层再 12px 就多出一圈空白 */
    padding: 8px 6px;
    cursor: pointer;
    /* 未激活：浅蓝灰底色，与 section-card 浅灰底区分 */
    background: linear-gradient(135deg, #f5f8fc 0%, #eaf1f9 100%);
    border: 1px solid #d8e3f0;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: linear-gradient(135deg, #eaf3ff 0%, #d9eaff 100%);
      border-color: #93b9e8;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.18);
    }

    &.is-active {
      /* 激活：主色高亮 + 粗边框 + 主色阴影 */
      background: linear-gradient(135deg, #dceeff 0%, #c5dfff 100%);
      border: 2px solid var(--el-color-primary);
      padding: 7px 5px; /* 抵消 +1px 边框避免内容位移 */
      box-shadow:
        0 0 0 3px rgba(var(--el-color-primary-rgb), 0.12),
        0 6px 20px rgba(var(--el-color-primary-rgb), 0.3);
      transform: translateY(-2px);
    }

    .koi-layout-preview {
      isolation: isolate;
      width: 80px;
      height: 52px;
      margin-bottom: 6px;
      padding: 5px;
      border-radius: 8px;
      background: var(--el-fill-color-lighter);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);

      .koi-block-aside {
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .koi-block-header {
        background: linear-gradient(135deg, var(--el-color-primary-light-5), var(--el-color-primary-light-7));
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .koi-block-main {
        background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
        border: 1px dashed var(--el-color-primary-light-5);
        border-radius: 4px;
      }
    }

    .koi-layout-label {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.3;
      color: var(--el-text-color-primary);
      text-align: center;
    }

    /* 选中打勾：走主题变量（--el-color-primary / --el-color-white），
       跟随主题色切换，不写死颜色 */
    .koi-layout-check {
      position: absolute;
      top: 4px;
      right: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      color: var(--el-color-white);
      background: var(--el-color-primary);
      border-radius: 50%;
      font-size: 10px;
      animation: fadeInScale 0.3s ease;
    }
  }

  .koi-layout-vertical .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;

      .koi-block-header {
        height: 20%;
      }

      .koi-block-main {
        height: 69%;
      }
    }
  }

  /* Group 布局预览：窄分组轨（3 条组线）+ 顶栏 + 内容区 */
  .koi-layout-group .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      position: relative;
      width: 14%;
      background: linear-gradient(
        180deg,
        var(--el-color-primary-light-7) 0%,
        var(--el-color-primary-light-9) 100%
      );

      &::before,
      &::after {
        content: "";
        position: absolute;
        left: 22%;
        right: 22%;
        height: 3px;
        border-radius: 2px;
        background: var(--el-color-primary-light-5);
      }

      &::before {
        top: 16%;
      }

      &::after {
        top: 48%;
        opacity: 0.6;
      }
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 82%;

      .koi-block-header {
        height: 18%;
      }

      .koi-block-main {
        height: 72%;
      }
    }
  }

  .koi-layout-gradation .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
      border-radius: 3px;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;
      padding: 2px;
      border-radius: 6px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-color-primary) 22%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 88%, transparent)
      );

      .koi-block-header {
        height: 17%;
      }

      .koi-block-main {
        height: 70%;
        border-radius: 5px;
      }
    }
  }

  .koi-layout-frosted .koi-layout-preview {
    display: flex;
    justify-content: space-between;
    position: relative;
    overflow: hidden;

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: "";
      background: linear-gradient(
        125deg,
        transparent 30%,
        color-mix(in srgb, var(--el-color-primary-light-7) 55%, transparent) 48%,
        transparent 62%
      );
      opacity: 0.45;
      mix-blend-mode: soft-light;
    }

    .koi-block-aside {
      width: 20%;
      border-radius: 3px;
      filter: blur(0.3px);
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;
      padding: 2px;
      border-radius: 6px;
      background: linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-color-primary) 18%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 82%, transparent)
      );
      backdrop-filter: blur(1px);

      .koi-block-header {
        height: 17%;
        opacity: 0.85;
      }

      .koi-block-main {
        height: 70%;
        border-radius: 5px;
        border: 1px dashed color-mix(in srgb, var(--el-color-primary) 35%, transparent);
      }
    }
  }

  .koi-layout-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 14%;
    }

    .koi-block-header {
      width: 17%;
    }

    .koi-block-main {
      width: 55%;
    }
  }

  .koi-layout-gradation-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 14%;
      border-radius: 3px;
    }

    .koi-block-header {
      width: 17%;
      border-radius: 3px;
      opacity: 0.95;
    }

    .koi-block-main {
      width: 53%;
      padding: 2px;
      border-radius: 6px;
      box-sizing: border-box;
      background: linear-gradient(
        125deg,
        color-mix(in srgb, var(--el-color-primary) 14%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 90%, #fafbfc)
      );
    }
  }

  .koi-layout-frosted-columns .koi-layout-preview {
    display: flex;
    justify-content: space-between;
    position: relative;
    overflow: hidden;

    &::after {
      position: absolute;
      inset: 0;
      pointer-events: none;
      content: "";
      background: linear-gradient(
        125deg,
        transparent 30%,
        color-mix(in srgb, var(--el-color-primary-light-7) 48%, transparent) 50%,
        transparent 64%
      );
      opacity: 0.42;
      mix-blend-mode: soft-light;
    }

    .koi-block-aside {
      width: 14%;
      border-radius: 3px;
      filter: blur(0.2px);
    }

    .koi-block-header {
      width: 17%;
      border-radius: 3px;
      opacity: 0.93;
    }

    .koi-block-main {
      width: 53%;
      padding: 2px;
      border-radius: 6px;
      box-sizing: border-box;
      background: linear-gradient(
        125deg,
        color-mix(in srgb, var(--el-color-primary) 17%, var(--el-bg-color-page)),
        color-mix(in srgb, var(--el-bg-color-page) 86%, transparent)
      );
      border: 1px dashed color-mix(in srgb, var(--el-color-primary) 30%, transparent);
    }
  }

  .koi-layout-classic .koi-layout-preview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .koi-block-aside {
      height: 22%;
    }

    .koi-layout-inner {
      display: flex;
      justify-content: space-between;
      height: 70%;

      .koi-block-header {
        width: 20%;
      }

      .koi-block-main {
        width: 70%;
      }
    }
  }

  .koi-layout-optimum .koi-layout-preview {
    display: flex;
    justify-content: space-between;

    .koi-block-aside {
      width: 20%;
    }

    .koi-layout-inner {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      width: 73%;

      .koi-block-header {
        height: 16%;
      }

      .koi-block-main {
        height: 72%;
      }
    }
  }

  .koi-layout-horizontal .koi-layout-preview {
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .koi-block-aside {
      height: 20%;
    }

    .koi-block-main {
      height: 67%;
    }
  }

  /** 双栏：浅蓝圆角实线外框 + 3 实心蓝竖条 + 1 虚线方框 + 右上角蓝色圆勾 + 底部居中蓝色文字 */
  .koi-layout-double.koi-layout-item {
    background: #f0f7ff;
    border-color: #bfdbfe;

    &:hover {
      background-color: #e8f1ff;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(47, 139, 240, 0.12);
    }

    &.is-active {
      background-color: #e6f1ff;
      border-color: #2f8bf0;
      box-shadow: 0 4px 20px rgba(47, 139, 240, 0.3);
    }

    .koi-layout-preview {
      display: flex;
      gap: 3px;
      align-items: stretch;
      padding: 8px;
      background: #fff;
      border: 1px solid #dbeafe;
      border-radius: 8px;
      box-sizing: border-box;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
    }

    .koi-double-bar {
      flex-shrink: 0;
      width: 14%;
      height: auto;
      border-radius: 3px;
      background: linear-gradient(180deg, #2f8bf0 0%, #7ab6ff 100%);
    }

    .koi-double-dashed {
      flex: 1;
      height: auto;
      border: 1.5px dashed #7ab6ff;
      border-radius: 4px;
    }

    .koi-layout-label {
      font-weight: 600;
      color: #2f8bf0;
    }

    .koi-layout-check {
      background: #2f8bf0;
      box-shadow: 0 2px 8px rgba(47, 139, 240, 0.4);
    }
  }
}

/** 暗色模式：所有布局卡片 */
html.dark .koi-layout-item {
  background: #1a1d23;
  border-color: #3d3d3f;

  &:hover {
    background: #22252d;
    border-color: var(--el-color-primary);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.12);
  }

  &.is-active {
    background: linear-gradient(135deg, #1f3a5f 0%, #1a2f4f 100%);
    border-color: var(--el-color-primary);
    box-shadow:
      0 0 0 3px rgba(64, 158, 255, 0.18),
      0 6px 20px rgba(64, 158, 255, 0.3);
  }

  .koi-layout-preview {
    background: #0f1117;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  }
}

/** 双栏卡片：暗色模式深蓝底 */
html.dark .koi-layout-double.koi-layout-item {
  background: #17212b;
  border-color: #2a4a6b;

  &:hover {
    background-color: #1a2632;
    box-shadow: 0 6px 20px rgba(61, 155, 255, 0.12);
  }

  &.is-active {
    background: linear-gradient(135deg, #1f3a5f 0%, #1a2f4f 100%);
    border-color: #3d9bff;
    box-shadow:
      0 0 0 3px rgba(61, 155, 255, 0.18),
      0 6px 20px rgba(61, 155, 255, 0.3);
  }

  .koi-layout-preview {
    background: #0f1419;
    border-color: #29415a;
  }

  .koi-double-bar {
    background: linear-gradient(180deg, #3d9bff 0%, #6db4ff 100%);
  }

  .koi-double-dashed {
    border-color: #6db4ff;
  }

  .koi-layout-label {
    color: #6db4ff;
  }

  .koi-layout-check {
    /* 走主题变量，跟随用户选择的主题色 */
    background: var(--el-color-primary);
    color: var(--el-color-white);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.4);
  }
}

/** 登录页样式选择器（与布局选择器同风格）
 *  双栏布局：
 *  - 未激活：浅蓝灰底色 + 浅边框
 *  - 激活：主色高亮 + 粗边框 + 主色阴影
 */
.koi-login-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  /* 与布局选择器同口径：间距收紧，避免大片空白 */
  gap: 8px;

  .koi-login-item {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 6px;
    cursor: pointer;
    background: linear-gradient(135deg, #f5f8fc 0%, #eaf1f9 100%);
    border: 1px solid #d8e3f0;
    border-radius: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: linear-gradient(135deg, #eaf3ff 0%, #d9eaff 100%);
      border-color: #93b9e8;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.18);
    }

    &.is-active {
      background: linear-gradient(135deg, #dceeff 0%, #c5dfff 100%);
      border: 2px solid var(--el-color-primary);
      padding: 7px 5px;
      box-shadow:
        0 0 0 3px rgba(var(--el-color-primary-rgb), 0.12),
        0 6px 20px rgba(var(--el-color-primary-rgb), 0.3);
      transform: translateY(-2px);
    }

    .koi-login-preview {
      isolation: isolate;
      width: 80px;
      height: 52px;
      margin-bottom: 6px;
      padding: 6px;
      border-radius: 8px;
      background: var(--el-fill-color-lighter);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      position: relative;

      /* 表单骨架 */
      .koi-login-preview-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
        width: 42%;
        padding: 5px 6px;
        border-radius: 4px;
        background: var(--el-bg-color);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      }

      .koi-login-preview-line {
        display: block;
        width: 100%;
        height: 3px;
        border-radius: 2px;
        background: var(--el-border-color);

        &--title {
          width: 70%;
          height: 5px;
          background: var(--el-color-primary);
          margin-bottom: 2px;
        }
      }

      .koi-login-preview-btn {
        display: block;
        width: 100%;
        height: 6px;
        border-radius: 3px;
        margin-top: 2px;
        background: var(--el-color-primary);
        opacity: 0.85;
      }
    }

    /* 各样式缩略图差异 */
    .koi-login-glass .koi-login-preview {
      background: var(--el-color-primary-light-8);
    }

    .koi-login-slide .koi-login-preview {
      .koi-login-preview-form {
        margin-left: auto;
      }
    }

    .koi-login-split .koi-login-preview {
      background: linear-gradient(135deg, var(--el-color-primary-light-5) 55%, var(--el-fill-color-lighter) 55%);
    }

    .koi-login-simple .koi-login-preview {
      background-image: radial-gradient(var(--el-color-primary-light-5) 1px, transparent 1px);
      background-size: 10px 10px;
    }

    .koi-layout-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      text-align: center;
    }

    .koi-layout-check {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 18px;
      height: 18px;
      background: var(--el-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      animation: fadeInScale 0.3s ease;
    }
  }
}

/** 界面配置 */
.interface-config {
  display: flex;
  flex-direction: column;

  .config-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:last-child {
      border-bottom: none;
    }

    .config-label {
      display: flex;
      align-items: center;
      flex: 1;
      min-width: 0;
      margin-right: 16px;
      font-size: 14px;
      color: var(--el-text-color-primary);
      font-weight: 500;
      line-height: 1.4;
    }

    .config-input {
      width: 180px;
      flex-shrink: 1;
    }
  }

  :deep(.re-switch--card) {
    margin-top: 10px;
  }
}

/** 扩展：工具栏开关 / 消息通知 / 首页 / 天气（ReSwitch 卡片式） */
.extension-switches {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;

  .config-label {
    flex: 1;
    margin-right: 16px;
    font-size: 14px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .config-input {
    width: 180px;
  }
}

.extension-switches {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/** 高级：计时器时区列表 */
.timer-zones {
  margin-top: 14px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .timer-zones__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--el-text-color-regular);
    }

    .timer-zones__count {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  .timer-zone-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding: 6px 8px 6px 6px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary-light-5);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    &__index {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border: 1px solid var(--el-color-primary-light-7);
      border-radius: 7px;
    }

    &__select {
      flex: 1;

      /* 圆角 + 聚焦时主题色描边（element-plus 2.14 的 el-select 边框为 box-shadow 实现） */
      :deep(.el-select__wrapper) {
        border-radius: 8px;
        box-shadow: 0 0 0 1px var(--el-border-color) inset;
        transition: box-shadow 0.2s ease;

        &:hover {
          box-shadow: 0 0 0 1px var(--el-select-border-color-hover) inset;
        }

        &.is-focused {
          box-shadow: 0 0 0 1px var(--el-color-primary) inset;
        }
      }
    }

    &__remove {
      flex-shrink: 0;
    }
  }

  .timer-zone-add {
    width: 100%;
    margin-top: 2px;
    border-style: dashed;
  }

  &__tip {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 8px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

/** 高级：用户配置导入 / 导出（一行展示：左右两个卡片 + 下方提示） */
.config-io {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      transform 0.2s ease;

    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 4px 14px rgba(var(--el-color-primary-rgb), 0.15);
      transform: translateY(-1px);
    }
  }

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;

    &--export {
      color: #2f8bf0;
      background: var(--el-color-primary-light-9);
    }

    &--import {
      color: #0fb5ae;
      background: #e4f7f4;
    }
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  &__tip {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
}

html.dark .config-io__card {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

/** 动画 */
@keyframes fade-in-scale {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes color-pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}

@keyframes color-preview-hover {
  0%,
  100% {
    transform: scale(1.05);
  }
  50% {
    transform: scale(1.08);
  }
}

@keyframes shimmer-sweep {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(100%);
  }
}

/** 响应式设计 */
// @media (max-width: 768px) {
//   .theme-colors-grid {
//     grid-template-columns: repeat(3, 1fr);
//     gap: 12px;
//   }

//   .layout-grid {
//     grid-template-columns: 1fr;
//     gap: 16px;
//   }

//   .interface-utils .utils-item {
//     flex-direction: column;
//     align-items: flex-start;
//     gap: 12px;

//     .utils-input {
//       width: 100%;
//     }
//   }
// }
</style>

<style lang="scss">
/* 全局 section-header 样式（穿透子组件） */
.section-header {
  display: flex;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 20px;
}

.section-header .section-icon {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  margin-right: 10px;
  font-size: 17px;
  color: #2f8bf0;
  background: linear-gradient(135deg, #e8f2ff 0%, #d6e9ff 100%);
  border-radius: 10px;
  transition: all 0.3s ease;
}

.section-header .section-icon::after {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  content: "";
  background: #2f8bf0;
  border: 2px solid var(--el-bg-color);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(47, 139, 240, 0.6);
}

.section-header:hover .section-icon {
  transform: scale(1.05);
}

.section-header .section-title {
  position: relative;
  padding-bottom: 9px;
  font-size: 15px;
  font-weight: 700;
  color: #1f2329;
  line-height: 1.2;
  letter-spacing: 0.3px;
}

.section-header .section-title::after {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 34px;
  height: 3px;
  content: "";
  background: linear-gradient(90deg, #2f8bf0 0%, #7ab6ff 100%);
  border-radius: 3px;
}

html.dark .section-header .section-title {
  color: #e5eaf3;
}

html.dark .section-header .section-icon {
  background: linear-gradient(135deg, #1b2a3d 0%, #16232f 100%);
}
</style>
