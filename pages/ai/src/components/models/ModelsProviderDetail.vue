<template>
  <!--
    07 版式（左供应商列表 / 右模型区 / 余额吸底）：
    右栏自身是「头 + 滚动模型区 + 吸底余额条」三段式。
    余额条挂在滚动区**外面**，滚多少模型它都贴在底边；
    以前它挂在滚动内容末尾，模型一多就滚没了。
  -->
  <div class="detail-shell">
    <div class="flex-1 min-h-0 overflow-auto detail-scroll">
      <div class="px-5 py-4">
      <!-- 供应商头部 -->
      <section class="d-band">
        <div class="d-band-logo">
          <ProviderLogo :pid="getProviderIcon(provider)" :name="provider?.name" size="lg" />
        </div>
        <div class="d-band-info min-w-0">
          <div class="d-band-name-row">
            <h1 class="d-band-name truncate">{{ provider?.name }}</h1>
          </div>
          <!--
            ONNX 本地推理没有远端地址：后端写死的 ai.onnx.base-url（默认
            http://127.0.0.1:8080/v1）只是「与其它提供商同构」的占位值，对本地推理
            不起作用。把它显示成供应商地址，用户会以为模型是从这个 HTTP 地址来的 ——
            实际模型文件在本机磁盘上，地址与路径毫无关系。
            这里改用后端回传的 model_root（真实绝对路径）；只有管理员能看到
            （后端 listProviders 对非管理员整体不返回 ONNX 行）。
          -->
          <div v-if="isOnnx" class="d-band-url" :title="onnxModelRoot || '尚未选择模型目录'">
            <el-icon :size="13"><Folder24Regular /></el-icon>
            <span class="d-band-url-text">{{ onnxModelRoot || '尚未选择模型目录' }}</span>
          </div>
          <div v-else-if="provider?.apiUrl" class="d-band-url" :title="provider.apiUrl">
            <el-icon :size="13"><LinkOutlined /></el-icon>
            <span class="d-band-url-text">{{ provider.apiUrl }}</span>
          </div>
        </div>
        <div class="d-band-actions">
          <!--
            路由组：没有上游地址、没有自己的模型行，只做「成员来自模型库 + 组内策略」，
            因此隐藏「编辑供应商 / 添加模型 / 同步价格」，成员在下方配置面板里维护。
          -->
          <el-button v-if="canWrite && !isRouterGroup" @click="emit('edit-provider')" round>
            <template #icon><EditOutlined /></template>
            编辑供应商
          </el-button>
          <el-button v-if="canDelete" round class="d-del-btn" @click="emit('delete-provider')">
            <template #icon><DeleteOutlined /></template>
            删除
          </el-button>
          <el-button v-if="canWrite && !isRouterGroup" type="primary" round @click="handleAdd">
            <template #icon><PlusOutlined /></template>
            {{ t('settings.providerDetail.addModel') }}
          </el-button>
          <el-button v-if="!isOnnx && !isRouterGroup && canWrite" round :loading="syncPricingLoading" @click="handleSyncPricing">
            <template #icon><Timer /></template>
            同步价格
          </el-button>
        </div>
      </section>

      <!-- 路由组供应商：成员来自已添加的模型库，策略配置在组内部处理，
           不显示空的「还没有模型」空态（那个按钮对路由组不适用） -->
      <RouterGroupLiveView
        v-if="isRouterGroup && provider?.providerId"
        :provider-id="provider.providerId"
        :provider-name="provider.name"
      />

      <RouterGroupPanel
        v-if="isRouterGroup && provider?.providerId"
        :provider-id="provider.providerId"
        :can-write="canWrite"
      />

      <!-- 空状态 -->
      <div v-if="models.length === 0 && !isRouterGroup" class="d-empty">
        <el-icon size="42" class="d-empty-icon"><Box16Regular /></el-icon>
        <p class="d-empty-title">{{ t('settings.providerDetail.noModels') }}</p>
        <p class="d-empty-desc">{{ t('settings.providerDetail.noModelsDesc') }}</p>
        <!-- 非管理员没有新增模型的权限，空状态就不再挂一个点了必 403 的按钮 -->
        <el-button v-if="canWrite" type="primary" round class="mt-5" @click="handleAdd">
          <template #icon><PlusOutlined /></template>
          {{ t('settings.providerDetail.addModel') }}
        </el-button>
      </div>

      <!-- 模型区（路由组没有自己的模型行，整块不渲染） -->
      <template v-else-if="!isRouterGroup">
        <div class="d-section-head">
          <!-- 第一行：标题 + 计数 + 搜索 + 批量工具栏 -->
          <div class="d-head-row">
            <span class="d-section-title">模型</span>
            <span class="d-section-count">
              {{ filteredModels.length }}/{{ models.length }}
            </span>
            <!--
              视图切换：列表（密排，一屏看十几行）/ 卡片（指标 6 格，一眼比较参数）。
              同一份 filteredModels、同一套筛选与批量选择，只是排版不同。
            -->
            <div class="view-switch" role="group" aria-label="模型视图">
              <button
                type="button"
                class="view-btn"
                :class="{ 'is-on': viewMode === 'list' }"
                title="列表视图"
                aria-label="列表视图"
                :aria-pressed="viewMode === 'list'"
                @click="viewMode = 'list'"
              >
                <el-icon :size="15"><ViewListOutlined /></el-icon>
              </button>
              <button
                type="button"
                class="view-btn"
                :class="{ 'is-on': viewMode === 'card' }"
                title="卡片视图"
                aria-label="卡片视图"
                :aria-pressed="viewMode === 'card'"
                @click="viewMode = 'card'"
              >
                <el-icon :size="15"><GridViewOutlined /></el-icon>
              </button>
            </div>
            <!-- 搜索框：支持模型名 / 类型 / 子类型 / 能力关键词 -->
            <el-input
              v-model="modelSearch"
              size="small"
              placeholder="搜索名称 / 类型 / 能力…"
              clearable
              class="model-search-input"
            >
              <template #prefix>
                <el-icon :size="13"><SearchOutlined /></el-icon>
              </template>
            </el-input>

            <!-- 批量操作工具栏：**保持原逻辑——勾中卡片才出现**（空态/未选不渲染、不占位）。
                 全选 / 反选放在「批量删除」旁边，与其它批量动作同一条工具栏里。
                 整块只在可写时出现：勾选、启停、批量删除全是 admin-only 接口。 -->
            <div v-if="canWrite && selected.length > 0" class="batch-toolbar">
              <span class="batch-count">已选 {{ selected.length }} 个</span>
              <el-button size="small" type="success" @click="batchEnable">启用</el-button>
              <el-button size="small" type="warning" @click="batchDisable">停用</el-button>
              <el-button
                size="small"
                :type="allFilteredSelected ? 'primary' : 'default'"
                plain
                @click="toggleSelectAllFiltered"
              >{{ allFilteredSelected ? '取消全选' : '全选' }}</el-button>
              <el-button size="small" plain @click="invertSelection">反选</el-button>
              <el-button
                size="small"
                type="danger"
                plain
                :loading="batchDeleting"
                @click="batchDelete"
              >批量删除</el-button>
              <el-button size="small" @click="clearSelection">取消</el-button>
            </div>
          </div>

          <!-- 第二行：状态 / 类型 / 上下文大小筛选 -->
          <div class="d-head-filters">
            <div class="filter-group">
              <ReRadioGroup v-model="statusFilter" size="small">
                <ReRadioButton value="">全部</ReRadioButton>
                <ReRadioButton value="active">已启用</ReRadioButton>
                <ReRadioButton value="inactive">已停用</ReRadioButton>
              </ReRadioGroup>
            </div>
            <div class="filter-group">
              <!--
                类型下拉必须与 model.modelType 的取值同源：以前这里手写了
                chat / vision / stt / image 等「业务别名」，而数据里存的是
                text / image_cv / asr / image，结果选中任何类型都筛出 0 条
                （2026-11-09 浏览器验收实测）。直接用 MODEL_TYPE_OPTIONS，
                加类型时也只改 model.constants 一处。
              -->
              <el-select v-model="typeFilter" placeholder="按类型" clearable size="small" class="type-select">
                <el-option
                  v-for="opt in MODEL_TYPE_OPTIONS"
                  :key="opt.value"
                  :value="opt.value"
                  :label="opt.label"
                />
              </el-select>
            </div>
            <!-- 上下文大小过滤：常用档位标签，多选 = 并集；「未知」= 无上下文数据 -->
            <div class="ctx-filter">
              <span class="ctx-filter-title">{{ t('common.contextSize.title') }}</span>
              <span v-for="tag in CONTEXT_SIZE_TAGS" :key="tag.key" class="ctx-tag"
                :class="{ 'ctx-tag-active': ctxFilter.includes(tag.key) }"
                @click="toggleCtxTag(tag.key)">
                {{ t(`common.contextSize.${tag.key}`) }}
              </span>
            </div>
          </div>
        </div>
        <div v-if="filteredModels.length === 0" class="ctx-no-match">
          {{ t('common.contextSize.noMatch') }}
        </div>
        <!--
          列表视图：与卡片同一份 filteredModels / 筛选 / 批量选择，换成密排行。
          列宽用 grid + minmax 收放，右栏再窄就整块横向滚动 —— 不看窗口宽度
          （左栏占 264px，窗口 1024 时右栏只剩 700 可用）。
        -->
        <div v-else-if="viewMode === 'list'" class="model-list">
          <div class="ml-head">
            <span></span>
            <span>模型</span>
            <span>能力</span>
            <span>输入 / 输出</span>
            <span class="ml-c-price">价格</span>
            <span class="ml-c-speed">速度</span>
            <span class="ml-c-sw">启用</span>
            <span></span>
          </div>
          <div
            v-for="model in filteredModels"
            :key="getModelId(model)"
            class="ml-row"
            :class="{ 'is-selected': selected.includes(getModelId(model)), 'is-off': !model.isActive }"
          >
            <span class="ml-c-check">
              <el-checkbox
                v-if="canWrite"
                :model-value="selected.includes(getModelId(model))"
                title="选择该模型"
                @change="toggleSelect(model)"
              />
            </span>

            <span class="ml-name">
              <ProviderLogo
                v-if="!getModelAvatar(model) || avatarFailed.has(getModelId(model))"
                :pid="getModelChannelBrand(model) || getProviderIcon(provider)"
                :name="getModelChannelBrand(model) || provider?.name"
                :size="22"
                class="ml-logo"
              />
              <Avatar
                v-else
                class="ml-logo"
                :src="getModelAvatar(model)"
                :name="getModelDisplayName(model.modelName)"
                type="assistant"
                :round="false"
                fit="contain"
                @error="avatarFailed.add(getModelId(model))"
              />
              <span
                class="ml-name-text"
                :title="model.alias ? `${model.alias} · ${model.modelName}` : getModelDisplayName(model.modelName)"
              >{{ model.alias || getModelDisplayName(model.modelName) }}</span>
              <span v-if="model.external" class="ml-badge">外部目录</span>
            </span>

            <!-- 能力：与卡片同一组图标胶囊（图标 + 悬停 tip），列的宽度不够时折叠成 +N -->
            <span v-if="!capabilityItems(model).length" class="ml-cell ml-caps-empty" title="未配置输入/输出能力">—</span>
            <ModelTagStrip
              v-else
              :tags="capabilityItems(model)"
              :max="3"
              :icon-size="15"
              :popover-width="200"
            />

            <span class="ml-cell" :title="listMeta(model).ioTitle">{{ listMeta(model).io }}</span>
            <span class="ml-cell ml-c-price" :title="listMeta(model).priceTitle">{{ listMeta(model).price }}</span>
            <span class="ml-cell ml-c-speed" :title="listMeta(model).speedTitle">{{ listMeta(model).speed }}</span>

            <span class="ml-c-sw">
              <el-switch
                v-model="model.isActive"
                :disabled="!canWrite || model.hasNativeId === false"
                :title="!canWrite
                  ? '启用状态由管理员维护'
                  : (model.hasNativeId === false ? t('settings.providerDetail.modelToggleUnavailable') : '')"
                @change="handleToggle(model)"
              />
            </span>

            <span class="ml-actions">
              <button
                v-if="canWrite && !isLocalProvider"
                class="mc-btn"
                :title="model.hasNativeId === false ? '该模型无原生记录，暂无法测试' : '测试延迟'"
                :disabled="model.testing || model.hasNativeId === false"
                @click="testLatency(model)"
              >
                <el-icon :size="15"><Timer /></el-icon>
              </button>
              <button v-if="canWrite" class="mc-btn" :title="t('common.edit')" @click="handleEdit(model)">
                <el-icon :size="15"><SettingsOutlined /></el-icon>
              </button>
              <button v-if="canWrite" class="mc-btn danger" :title="t('common.delete')" @click="handleDelete(model)">
                <el-icon :size="15"><RemoveCircleOutlineRound /></el-icon>
              </button>
            </span>
          </div>
        </div>
        <div v-else class="model-grid">
          <article v-for="model in filteredModels" :key="model.id" class="mc"
            :class="{ 'is-selected': selected.includes(getModelId(model)), 'is-off': !model.isActive }">
            <div class="mc-head">
              <!-- 模型没有专属 logo、或那张图根本加载不出来时，先回退到**这一行真正接的上游通道**
                   （免费聚合渠道按路由拆到 opencode / kilo / xort），最后才回退**本供应商**的 logo。
                   只判「路径为空」不够：路径存在 ≠ 资源存在（旧图 404 会先破图再落回首字），
                   所以补一条 error 兜底，由 Avatar 的 error 事件登记。 -->
              <ProviderLogo
                v-if="!getModelAvatar(model) || avatarFailed.has(getModelId(model))"
                :pid="getModelChannelBrand(model) || getProviderIcon(provider)"
                :name="getModelChannelBrand(model) || provider?.name"
                size="md"
                class="w-10 h-10 shrink-0 mr-3"
              />
              <Avatar v-else class="w-10 h-10 shrink-0 mr-3" :src="getModelAvatar(model)"
                :name="getModelDisplayName(model.modelName)" type="assistant" :round="false" fit="contain"
                @error="avatarFailed.add(getModelId(model))" />
              <div class="mc-head-text min-w-0">
                <span class="mc-name" :title="model.alias ? `${model.alias} · ${model.modelName}` : getModelDisplayName(model.modelName)">
                  {{ model.alias || getModelDisplayName(model.modelName) }}
                </span>
                <!--
                  模型的全部标签统一走 ModelTagStrip（图标 + tooltip）：
                  类型（OCR 识别 / 人脸识别 / 图像识别 / 语音合成 …）、细分类型
                  （文字识别 / 人脸特征提取 …）、特性（工具调用 / 深度思考 / 在线检索）。

                  为什么连主类型也不再用文字：一张卡片同时有类型 + 细分类型 + 特性时，
                  纯文字徽标会占掉标题行大半宽度；长名称（「人脸特征提取」「文字超分修复」）
                  还会互相挤压、把行撑高。统一成图标后，占用只跟图标个数相关。

                  规则：最多显示 2 个，其余折叠为 +N；悬停图标看名称，
                  悬停 +N 弹 popover 列出全部（图标 + 中文名）。
                -->
                <ModelTagStrip
                  v-if="modelTags(model).length"
                  :tags="modelTags(model)"
                  :max="2"
                />
              </div>
              <!-- 批量选择 checkbox：固定在头部右侧，不单独占行（只读账号无批量动作，不显示） -->
              <span v-if="canWrite" class="mc-check" title="选择该模型">
                <el-checkbox
                  :model-value="selected.includes(getModelId(model))"
                  @change="toggleSelect(model)"
                />
              </span>
            </div>

            <!--
              能力：输入 / 输出能力合成一条图标带（图标 + 悬停 tip）。
              以前拆成「输入 → 输出」两组用箭头连起来，图标一多就换行、
              把卡片撑高；而且同一项能力在列表视图里也要能对齐，
              所以两种视图统一走 capabilityItems()。
            -->
            <div v-if="capabilityItems(model).length" class="mc-caps">
              <ModelTagStrip
                :tags="capabilityItems(model)"
                :max="8"
                :icon-size="15"
                :popover-width="200"
              />
            </div>

            <!-- 参数与官方指标：手填值优先，缺失回退指标表（sys_ai_model_metrics）。
                 恒定 4 格：输入 / 输出（文生图换成 张数 / 参考图）、价格、速度。
                 缺值一律显示 —；每格都带一条恒定占位的副行（首字 TTFT 放副行），
                 所以同一栏里每张卡的格数、格高完全相同 —— 这是卡片等高的前提。
                 曾经有智能 / 全知两格，多数模型缺采占「—」，噪音大于信息，已删除。 -->
            <div class="mc-meta">
              <span
                v-for="(item, mi) in cardMeta(model)"
                :key="item.label"
                class="mc-meta-item"
                :class="{ 'is-lead': mi === 0, 'is-empty': item.value === '—' }"
                :title="item.title"
              >
                <span class="mc-meta-label">{{ item.label }}</span>
                <span class="mc-meta-val">{{ item.value }}</span>
                <!-- 副行空着也占位：否则「有没有首字 / HLE」会把同排卡片撑出不同高度 -->
                <span class="mc-meta-sub">{{ item.sub }}</span>
              </span>
              <!-- 附加信息（最近使用 / 延迟）：不占 6 格，收进右上角 +N，悬停看明细 -->
              <span
                v-if="extraMeta(model).length"
                class="mc-extra"
                :title="extraMeta(model).map((e: any) => `${e.label}：${e.value}`).join('\n')"
              >+{{ extraMeta(model).length }}</span>
            </div>

            <!-- 底部：与其它供应商一致（启用开关 + 编辑 + 删除） -->
            <div class="mc-foot">
              <span v-if="model.external" class="mc-src is-ext">外部目录</span>
              <!--
                启用开关必须能真的生效，否则就是「可见可点、点了必失败」的假按钮。
                内置 Agent 供应商的模型行不带后端 id（不在 sys_ai_provider_model 里），
                PUT /v2/models/{providerId}:{model}/toggle-active 恒回 404
                「模型不存在」—— 实测（2026-10-07 逐按钮 sweep + 定点探针）：
                裸 id 回 400 格式非法，补全成 providerId:modelName 后回 404 查无此模型。
                所以没有原生 id 时直接禁用开关并给出原因，而不是让用户点了报错。
                判据用 `=== false`：只有 mapModel 明确判定「无原生 id」才禁用，
                外部来源的模型（无该字段）保持原行为不受影响。
              -->
              <el-switch
                v-model="model.isActive"
                :disabled="!canWrite || model.hasNativeId === false"
                :title="!canWrite
                  ? '启用状态由管理员维护'
                  : (model.hasNativeId === false ? t('settings.providerDetail.modelToggleUnavailable') : '')"
                @change="handleToggle(model)"
              />
              <div v-if="canWrite" class="mc-foot-btns">
                <button
                  v-if="!isLocalProvider"
                  class="mc-btn"
                  :title="model.hasNativeId === false ? '该模型无原生记录，暂无法测试' : '测试延迟'"
                  :disabled="model.testing || model.hasNativeId === false"
                  @click="testLatency(model)"
                >
                  <el-icon :size="16"><Timer /></el-icon>
                </button>
                <button class="mc-btn" :title="t('common.edit')" @click="handleEdit(model)">
                  <el-icon :size="16"><SettingsOutlined /></el-icon>
                </button>
                <button class="mc-btn danger" :title="t('common.delete')" @click="handleDelete(model)">
                  <el-icon :size="16"><RemoveCircleOutlineRound /></el-icon>
                </button>
              </div>
            </div>
          </article>
        </div>
      </template>

      <!--
        余额与用量：只有配了上游地址的远程供应商才有可查的余额（路由组没有上游、
        ONNX 是本地推理，两者都不查）。compact 形态由宿主贴在本栏底边，
        所以它不在滚动区里，而是下面那段独立节点。
      -->
    </div>
    </div>

    <ProviderCreditPanel
      v-if="showCreditPanel && provider?.providerId"
      compact
      :provider-id="provider.providerId"
    />

    <!-- 弹窗 -->
    <ModelFormDialog
      ref="formRef"
      :provider="provider"
      :model-presets="modelPresets"
      @saved="emit('changed')"
      @request-fetch="handleRequestFetch"
    />
    <!--
      「添加模型」默认直接打开手工表单；
      表单上的「获取」按钮再拉取该供应商的全部模型，
      想一次全要就点「全部录入」（后端批量落库），只想挑一个再点行内「选择」，
      供应商没配地址/Key 或想手工建则直接在表单里操作。
    -->
    <ModelFetchDialog
      ref="fetchRef"
      @select="handleFetchSelect"
      @imported="emit('changed')"
      @manual="handleManualAdd"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from '@repo/core'
import Avatar from '../ui/Avatar.vue'
import CardAvatar from '../ui/CardAvatar.vue'
import {
  SettingsOutlined, RemoveCircleOutlineRound, ScienceOutlined,
  PlusOutlined, LinkOutlined, EditOutlined, DeleteOutlined,
  SearchOutlined, ViewListOutlined, GridViewOutlined,
} from '@vicons/material'
import {
  TextT24Regular, Image24Regular, DocumentText24Regular,
  WrenchScrewdriver24Regular, LightbulbFilament24Regular, Box16Regular,
  Speaker224Regular, Video24Regular, Group24Regular, Scan24Regular,
  Folder24Regular,
} from '@vicons/fluent'
import { Timer } from '@element-plus/icons-vue'
import { apiService } from '../../services/ApiService'
import { modelApi } from '@/services/javaApi'
import { usePopup } from '../../composables/usePopup'
import {
  getModelDisplayName, getModelAvatarPath,
  CONTEXT_SIZE_TAGS, matchesContextTags,
} from '@/utils/modelUtils'
import ProviderLogo from './ProviderLogo.vue'
import { resolveModelChannelBrand } from './providerIcons'
import ModelFormDialog from './ModelFormDialog.vue'
import ModelFetchDialog from './ModelFetchDialog.vue'
import ModelTagStrip from './ModelTagStrip.vue'
import RouterGroupPanel from './RouterGroupPanel.vue'
import RouterGroupLiveView from './RouterGroupLiveView.vue'
import ProviderCreditPanel from './ProviderCreditPanel.vue'
import {
  LOCAL_PROVIDER_IDS, MODEL_SUBTYPE_LABELS, MODEL_SUBTYPE_OPTIONS,
  MODEL_TYPE_ICON, MODEL_TYPE_KIND, MODEL_TYPE_OPTIONS,
} from './model.constants'
import { ReRadioGroup, ReRadioButton } from '@repo/ui/re-kit';

const props = defineProps<{
  provider: any
  models: any[]
  modelPresets: any[]
  /**
   * 写操作是否可用（默认 true，保持原有调用方行为不变）。
   *
   * <p>模型管理对所有登录用户开放，但新增/编辑/删除供应商与模型、拉模型、
   * 同步价格、启停模型在服务端都是 {@code @Permission("admin")}。非管理员
   * 进入时传 false，整块写入口不渲染 —— 否则用户看到按钮、点了必然 403。</p>
   */
  canWrite?: boolean
}>()

const canWrite = computed(() => props.canWrite !== false)

const emit = defineEmits<{
  back: []
  changed: []
  'edit-provider': []
  'delete-provider': []
}>()

const { t } = useI18n()
const { confirm } = usePopup()

const formRef = ref<any>(null)
const fetchRef = ref<any>(null)

/* ==================== 上下文大小过滤（与模型选择卡片共用同一套标签） ==================== */

/** 选中的档位 key 集合（多选 = 并集；空 = 不过滤） */
const ctxFilter = ref<string[]>([])

/** 关键字搜索 */
const modelSearch = ref('')

/** 状态筛选：active / inactive / '' */
const statusFilter = ref('')

/** 类型筛选：modelType 值 */
const typeFilter = ref('')

/**
 * 模型区视图：列表 / 卡片。
 *
 * <p>两种视图吃同一份 {@link filteredModels} 与同一套筛选、批量选择，
 * 只是排版不同：列表一屏看十几行、便于逐行比较参数；卡片把输入/输出/价格/速度
 * 摊成指标格，一眼比较。选择写进 localStorage —— 这是一条长期偏好，
 * 不该每次切供应商都回到默认。默认列表（07 版式本身是表格版）。</p>
 */
type ModelViewMode = 'list' | 'card'
const VIEW_MODE_KEY = 'ai.modelManage.viewMode'
const readViewMode = (): ModelViewMode => {
  try {
    return localStorage.getItem(VIEW_MODE_KEY) === 'card' ? 'card' : 'list'
  } catch {
    // 隐私模式 / 存储被禁用时退回默认值，不让读存储影响首屏
    return 'list'
  }
}
const viewMode = ref<ModelViewMode>(readViewMode())
watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  } catch {
    // 写失败只是记不住偏好，无需提示
  }
})

/** 批量选中的模型 id */
const selected = ref<string[]>([])

/** 清空已选模型（批量操作栏的「取消」） */
const clearSelection = () => {
  selected.value = []
}

/**
 * 当前筛选结果是否已全选。
 *
 * <p>供批量工具栏的「全选」按钮切文案与样式；空列表返回 false，
 * 避免出现「已全选 0 个」的怪状态。</p>
 */
const allFilteredSelected = computed(() => {
  const list = filteredModels.value
  return list.length > 0 && list.every((m) => selected.value.includes(getModelId(m)))
})

/**
 * 反选当前筛选结果。
 *
 * <p>只作用于**当前筛选出的行**：逐行翻转是否选中，
 * 其它筛选条件下已勾选的模型不受影响（与「全选」的语义一致）。</p>
 */
const invertSelection = () => {
  const ids = filteredModels.value.map(getModelId)
  if (!ids.length) return
  const next = new Set(selected.value)
  for (const id of ids) {
    if (next.has(id)) next.delete(id)
    else next.add(id)
  }
  selected.value = Array.from(next)
}

/**
 * 切换上下文档位标签：已选中则取消，否则加入。
 *
 * @param key CONTEXT_SIZE_TAGS 的 key
 */
const toggleCtxTag = (key: string) => {
  const idx = ctxFilter.value.indexOf(key)
  if (idx >= 0) ctxFilter.value.splice(idx, 1)
  else ctxFilter.value.push(key)
}

/** 搜索能力别名：让「嵌入」「人脸」「视觉」等中文也能命中 */
const SEARCH_ALIASES: Record<string, string[]> = {
  嵌入: ['embedding', 'embed'],
  人脸: ['face', 'face_recognition'],
  视觉: ['vision', 'image'],
  ocr: ['ocr'],
  重排: ['rerank'],
  语音: ['tts', 'stt', 'speech'],
  工具: ['tools'],
  思考: ['thinking'],
}

const matchesSearch = (m: any, kw: string) => {
  const displayName = getModelDisplayName(m.modelName).toLowerCase()
  // 别名是用户在卡片上看到的展示名，搜索必须能命中它，否则「看得见却搜不到」
  const alias = String(m.alias || '').toLowerCase()
  const typeLabel = typeMeta(m.modelType).label.toLowerCase()
  const subLabel = (subTypeLabel(m.subType) || '').toLowerCase()
  const features = (m.config?.features || []).join(' ').toLowerCase()
  const tasks = (m.config?.inputCapabilities || [])
    .concat(m.config?.outputCapabilities || [])
    .join(' ')
    .toLowerCase()
  return (
    displayName.includes(kw) ||
    alias.includes(kw) ||
    typeLabel.includes(kw) ||
    subLabel.includes(kw) ||
    features.includes(kw) ||
    tasks.includes(kw) ||
    SEARCH_ALIASES[kw]?.some((a) => features.includes(a) || tasks.includes(a) || displayName.includes(a))
  )
}

/** 命中档位标签的模型（过滤只影响展示；增删改仍走全量 props.models） */
const filteredModels = computed(() => {
  const kw = modelSearch.value.trim().toLowerCase()
  const matched = props.models.filter((m: any) => {
    if (!matchesContextTags(m, ctxFilter.value)) return false
    if (statusFilter.value === 'active' && !m.isActive) return false
    if (statusFilter.value === 'inactive' && m.isActive) return false
    if (typeFilter.value && m.modelType !== typeFilter.value) return false
    if (kw && !matchesSearch(m, kw)) return false
    return true
  })
  // 已启用优先，同状态按后台 sort_order 升序，避免把排序规则丢掉
  return [...matched].sort((a: any, b: any) => {
    if (!!a.isActive !== !!b.isActive) return a.isActive ? -1 : 1
    const ao = Number(a.sort_order ?? a.sortOrder ?? 0)
    const bo = Number(b.sort_order ?? b.sortOrder ?? 0)
    return ao - bo || String(a.modelName || '').localeCompare(String(b.modelName || ''))
  })
})

/**
 * 是否为 ONNX 本地推理供应商。
 *
 * <p>ONNX 供应商由用户自己在「添加供应商」里添加（platform=onnx），可编辑、
 * 可删除；它的模型来自模型注册表（用户绑定的本地目录 + 内置本地模型），
 * 不走上游 HTTP 请求。</p>
 *
 * <p>判定与后端 {@code ApiProviderController#isOnnxRow} 同口径：标识是 onnx，
 * <strong>或</strong> platform 含 onnx。<b>不能只认写死的 id</b>——标识被改过的
 * 行平台仍是 onnx，只按 id 判会让它显示吸底余额条（拿去查一个本地推理地址，
 * 必然没数），同时丢掉模型目录那一栏。{@code mapProvider} 会把 platform
 * 覆盖成品牌，所以 rawPlatform 优先。</p>
 */
const isOnnx = computed(() => {
  const p: any = props.provider
  if (!p) return false
  if (p.id === 'onnx' || p.provider_id === 'onnx') return true
  return /onnx/i.test(String(p.rawPlatform || p.platform || ''))
})

/**
 * 是否为路由组供应商。
 *
 * <p>路由组的「模型」来自已添加的模型库，选谁由组内策略决定；页面改用
 * 路由组配置面板展示，不再走「手动添加模型 / 拉模型 / 同步价格」这套流程
 * （它没有上游地址，那些动作必然失败）。</p>
 */
const isRouterGroup = computed(
  () => props.provider?.rawPlatform === ROUTER_GROUP_PLATFORM
    || props.provider?.platform === ROUTER_GROUP_PLATFORM,
)

/**
 * 是否显示「余额与用量」面板。
 *
 * <p>只有配了上游地址的远程供应商才有可查的余额：路由组没有自己的上游，
 * ONNX 是本地推理，地址为空时后端也会直接回「未配置上游地址」，所以整块不渲染，
 * 不留一个点了必然没数的区块。余额接口回传脱敏后的 Key 列表，按 admin 权限保护，
 * 非管理员整块不出现（否则请求必然 403）。</p>
 */
const showCreditPanel = computed(
  () => canWrite.value && !isOnnx.value && !isRouterGroup.value
    && (!!String(props.provider?.apiUrl || '').trim()
      || !!String(props.provider?.extra?.credit_url || '').trim()),
)

/** 路由组供应商的平台标识（与后端 ProviderRouteTargets.ROUTER_GROUP_PLATFORM 一致） */
const ROUTER_GROUP_PLATFORM = 'router-group'

/**
 * 是否为本地推理供应商。
 *
 * <p>本地模型不走远端 HTTP 延迟测试，行内不展示「测试延迟」按钮，
 * 避免点击后由不存在的远端服务报错。</p>
 */
const isLocalProvider = computed(() => {
  const id = String(props.provider?.id ?? props.provider?.provider_id ?? '').toLowerCase()
  return LOCAL_PROVIDER_IDS.has(id)
})

/**
 * ONNX 的真实模型根目录（绝对路径）。
 *
 * <p>取自后端 /providers 回传的 {@code model_root}（见 ApiProviderController.toProviderResponse），
 * 不是供应商行的 base_url —— 后者对 ONNX 是写死的 http 占位值，与模型实际位置无关。</p>
 */
const onnxModelRoot = computed(() => String(props.provider?.model_root || '').trim())

/**
 * 「删除供应商」按钮是否可删。
 *
 * 必须与 ModelsPage.handleDeleteProvider 的早退守卫
 * `if (!p || p.id === 'agent') return` **完全一致**，
 * 否则按钮可见可点、点了却静默什么都不做（真死按钮）。
 *
 * ONNX 供应商由用户自己添加（platform=onnx），因此可删；删除后后端级联清掉
 * 其模型镜像与运行时推理设备覆盖。只有内置的 Agent 供应商不可删。
 */
const canDelete = computed(() => {
  const id = props.provider?.id ?? props.provider?.provider_id
  return canWrite.value && id !== 'agent'
})

const getLableName = (type: string) => {
  switch (type) {
    case 'visual': return t('settings.providerDetail.visual')
    case 'tools': return t('settings.providerDetail.toolCalling')
    case 'thinking': return t('settings.providerDetail.mixedThinking')
    case 'web-search': {
      const v = t('settings.providerDetail.webSearch')
      return v === 'settings.providerDetail.webSearch' ? '在线检索' : v
    }
    default: return type
  }
}

const getProviderIcon = (item: any) => item?.provider || item?.platform || item?.id

const getModelAvatar = (model: any) => {
  if (!model || !model.modelName) return undefined
  const path = getModelAvatarPath(model.modelName, props.provider?.name || undefined)
  return path || undefined
}

/**
 * 模型行「真正接的上游通道」品牌 id（opencode / kilo / xort …）。
 *
 * <p>免费聚合渠道下每个模型其实走不同上游，所以卡片图标不能一律用聚合供应商的 logo；
 * 与「从供应商获取模型」弹窗行首的通道图标同一套解析。
 * 解析不出时返回空串，模板回退到供应商 logo。</p>
 *
 * @param model 模型行
 * @returns 品牌 id 或空串
 */
const getModelChannelBrand = (model: any) => resolveModelChannelBrand(model)

/**
 * 模型 logo 加载失败的模型 id 集合。
 *
 * <p>模型 logo 的路径是「按模型名猜品牌」得到的，猜中了也不代表那张图真的存在。
 * 路径非空 → Avatar 显示；资源 404 → 这里登记，模板改渲染供应商 logo 兜底。</p>
 */
const avatarFailed = reactive(new Set<string>())

const fmtNum = (v: number) =>
  v >= 1000 ? (v >= 1000000 ? (v / 1000000).toFixed(1).replace(/\.0$/, '') + 'M' : Math.round(v / 1000) + 'K') : String(v)

/** 最近使用时间展示：支持秒/毫秒时间戳和 ISO 字符串；解析失败返回空 */
const formatRecentUse = (v: any): string => {
  let d: Date | null = null
  if (typeof v === 'number') {
    const ms = v > 1e12 ? v : v * 1000
    d = new Date(ms)
  } else if (typeof v === 'string' && v.trim()) {
    const parsed = Date.parse(v.trim())
    if (!Number.isNaN(parsed)) d = new Date(parsed)
  }
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 宽松数值解析：空值 / 非数字一律返回 null（区分「未填」与 0） */
const numOrNull = (v: any): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** 人类可读的小数值：42.30 → 42.3 */
const humanDecimal = (v: number, digits = 1) => String(Number(v.toFixed(digits)))

/** 人类可读的价格（指标表为 USD / 百万 token）：0.15 → $0.15，15 → $15 */
const humanPrice = (v: number) => {
  const s = v < 1 ? v.toFixed(3) : v.toFixed(2)
  return '$' + s.replace(/0+$/, '').replace(/\.$/, '')
}

/**
 * 模型卡片上的参数 / 官方指标条目。
 *
 * <p>「输入最大 token」手填优先（sys_ai_provider_model.context_window），
 * 未填则回退指标表的上下文窗口；「输出最大 token」指标表没有对应字段，只认手填。
 * 官方估价与速度 / 智能指数来自指标表（sys_ai_model_metrics），
 * 由后端 toProviderModelResponse 合并进 model.metrics。</p>
 *
 * <p><b>恒定 6 格</b>：输入 / 输出 / 价格 / 速度 / 智能 / 全知（文生图前两格换成
 * 「张数 / 参考图」）。缺数据显示 —；首字延迟（TTFT）与 HLE 折进对应格的副行；
 * 最近使用与延迟不进格子，走 {@link extraMeta} 的「+N」角标。</p>
 *
 * <p>为什么格数必须固定：此前只有前四项恒定，智能 / 全知 / 首字 / HLE 是
 * 「有数据才渲染」，实际格数在 4～10 之间浮动。格子是 flex 换行铺满的，
 * 格数一变换行行数就变，同一屏卡片高低不齐（实测 claude-fable-5 比邻卡多一格
 * 「全知」就撑高一行）。固定成 6 格后，同一栏里每张卡宽度相同、换行结果也完全
 * 相同，卡片自然等高，也能横向逐格比较。</p>
 */
const cardMeta = (model: any) => {
  const cfg = model?.config || {}
  const mt = model?.metrics || {}
  /** 固定 6 格；sub 是副行，空串也照样渲染占位，避免「有没有副行」撑出高度差 */
  const items: Array<{ label: string; value: string; title: string; sub?: string }> = []
  /** 无数据占位：缺值就显示它 */
  const EMPTY = '—'

  const manualCtx = numOrNull(cfg.contextWindow)
  const ctx = manualCtx ?? numOrNull(mt.context_window_tokens)
  const out = numOrNull(cfg.maxOutputTokens)
  const pIn = numOrNull(mt.price_input_per_musd)
  const pOut = numOrNull(mt.price_output_per_musd)
  // 速度优先本机实测平均（avg_output_speed_tps，每轮对话后回写），
  // 其次官方指标源（output_speed_tps）。官方只收录部分模型，自建通道往往只有实测值。
  const observedSpeed = numOrNull(mt.avg_output_speed_tps)
  const officialSpeed = numOrNull(mt.output_speed_tps)
  const speed = observedSpeed ?? officialSpeed

  // ① 输入 / ② 输出 / ③ 价格 / ④ 速度：**四项恒定渲染**，没有数据就显示 —。
  //
  // 为什么改成恒定：此前每一项都是「有数据才 push」，条目数在 0～4 之间随机，
  // 色块是 flex 换行铺满的，行数跟着变 —— 同一屏卡片高低不齐（用户实测反馈）。
  // 固定这四项后每张卡都是同样的 2×2，横向也能直接对齐比较。
  //
  // 例外：文生图（image）没有 token 输入/输出的概念，前两项换成生成维度的
  // 「张数」与「参考图」：张数 = 单次生成最多几张（generate.maxCount），
  // 参考图 = 是否能拿参考图做图生图（generate.referenceImage）。
  // 生成参数在后端行里是顶层 generate，也可能只挂在 capabilities[].generate，
  // 两处都读，避免老数据缺顶层字段时全部落回「—」。
  if (model?.modelType === 'image') {
    const gen = model?.generate
      || (Array.isArray(model?.capabilities) ? model.capabilities.find((c: any) => c?.generate)?.generate : null)
      || {}
    const maxCount = numOrNull(gen.maxCount)
    const refOn = gen.referenceImage === true
    const refCount = numOrNull(gen.referenceImageCount)
    items.push({
      label: '张数',
      value: maxCount != null ? `${maxCount} 张` : EMPTY,
      title: maxCount != null
        ? `单次生成最多 ${maxCount} 张（模型管理的「输出张数」）`
        : '单次生成张数：未配置（模型管理的「文生图配置 · 输出张数」）',
    })
    items.push({
      label: '参考图',
      value: gen.referenceImage === undefined ? EMPTY : (refOn ? '支持' : '不支持'),
      title: gen.referenceImage === undefined
        ? '参考图能力：未配置（模型管理的「文生图配置 · 支持参考图」）'
        : (refOn
          ? (refCount != null ? `支持参考图做图生图（最多 ${refCount} 张）` : '支持参考图做图生图（张数未限制）')
          : '不支持参考图，只能纯文生图'),
    })
  } else {
    items.push({
      label: '输入',
      value: ctx != null ? fmtNum(ctx) : EMPTY,
      title: ctx == null
        ? '输入最大 token：未配置（可在模型管理手填，或用「同步价格」回填）'
        : `输入最大 token：${ctx.toLocaleString()}${manualCtx != null ? '（手动填写）' : '（指标表上下文窗口）'}`,
    })
    items.push({
      label: '输出',
      value: out != null ? fmtNum(out) : EMPTY,
      title: out == null
        ? '输出最大 token：未配置（可在模型管理手填）'
        : `输出最大 token：${out.toLocaleString()}（手动填写）`,
    })
  }
  {
    const f = (v: number | null) => (v == null ? EMPTY : humanPrice(v))
    // 输入输出都为 0 即免费：显式标注，别让用户对着「$0/$0」自己判断；
    // 只有两边都采到才判免费，缺一边不算。
    const free = pIn != null && pOut != null && pIn === 0 && pOut === 0
    const known = pIn != null || pOut != null
    items.push({
      label: '价格',
      value: !known ? EMPTY : free ? '免费' : `${f(pIn)}/${f(pOut)}`,
      title: !known
        ? '官方估价：指标源未采集（用「同步价格」回填）'
        : free
          ? '上游标注免费（输入输出价格均为 0）'
          : `官方估价（USD / 百万 token）：输入 ${f(pIn)}，输出 ${f(pOut)}`,
    })
  }
  // ④ 速度：首字延迟（TTFT）不单独占格，而是这一格的副行 —— 两者都是「快不快」，
  //    并列成两格会把真正要横向比较的 6 格挤掉。
  //    注意「首字」（官方评测的中位首 Token）与「延迟」（本机探活实测）不是一回事，
  //    延迟走 extraMeta，tooltip 里各自说明。
  const ttftRaw = numOrNull(mt.latency_first_token_seconds)
  const ttftSec = ttftRaw != null && ttftRaw > 0 ? ttftRaw : null
  items.push({
    label: '速度',
    value: speed != null ? `${humanDecimal(speed)} t/s` : EMPTY,
    title: [
      speed != null
        ? `${observedSpeed != null ? '本机实测平均输出速度' : '官方输出速度'}（token/秒）：${humanDecimal(speed)}`
        : '输出速度：暂无数据（该模型对话一轮后会自动回填实测速度）',
      ttftSec != null ? `首字延迟（TTFT，官方中位）：${ttftSec.toFixed(2)}s` : '首字延迟：指标源未采集',
    ].join('；'),
    sub: ttftSec != null ? `首字 ${Math.round(ttftSec * 1000)}ms` : '',
  })

  // ⑤⑥ 智能 / 全知：Artificial Analysis 跑分与知识准确-幻觉指数。用户反馈这类
  //    指标噪音大于信息（多数模型缺采，显示「—」占格），已删除，卡片恒定 4 格。
  //    如需看智能维度，去「模型指标」页的智能指数排行与性价比象限。

  return items
}

/**
 * 不进 6 格的附加信息：最近使用时间 / 本机探活延迟。
 *
 * <p>它们不是「模型能力」，放进指标区会让格数随数据浮动（这正是卡片高低不齐的
 * 来源）。改成卡片指标区右上角的「+N」角标：绝对定位、不占布局高度，悬停看明细。</p>
 */
const extraMeta = (model: any) => {
  const mt = model?.metrics || {}
  const extras: Array<{ label: string; value: string }> = []

  const recentUse = model?.last_used_at ?? model?.lastUsedAt ?? model?.recent_use_at ?? model?.used_at
  if (recentUse) {
    const t = formatRecentUse(recentUse)
    if (t) extras.push({ label: '最近使用', value: t })
  }

  const latency = numOrNull(model.modelLastLatency ?? mt.probe_latency_ms ?? mt.latency_ms)
  if (latency != null) {
    extras.push({
      label: '延迟',
      value: `${Math.round(latency)}ms`,
    })
  }

  return extras
}

// 模型类型 → 卡片标签（文字 + 配色），与系统配置「默认模型」类型体系一致
const TYPE_META: Record<string, { label: string; cls: string }> = {
  text: { label: '对话', cls: 'chat' },
  embedding: { label: '嵌入', cls: 'emb' },
  rerank: { label: '重排序', cls: 'info' },
  image: { label: '文生图', cls: 'img' },
  video: { label: '文生视频', cls: 'vid' },
  image_cv: { label: '图片识别', cls: 'info' },
  ocr: { label: 'OCR识别', cls: 'info' },
  face: { label: '人脸识别', cls: 'info' },
  layout: { label: '布局识别', cls: 'info' },
  detection: { label: '检测', cls: 'info' },
  asr: { label: '语音识别', cls: 'info' },
  tts: { label: '语音合成', cls: 'info' },
}
const typeMeta = (type: string) => TYPE_META[type] || TYPE_META.text
const subTypeLabel = (subType: any) => MODEL_SUBTYPE_LABELS[String(subType || '')] || String(subType || '')

/**
 * 规范类型 → 图标 / 配色：直接用 model.constants 里的共享映射。
 *
 * <p>不在本文件再派生一份：类型下拉（MODEL_TYPE_OPTIONS）、本卡片的标签、
 * 以及「拉取模型」弹框的标签都用同一份图标表，加类型时不会三处走散。</p>
 */
const TYPE_ICONS = MODEL_TYPE_ICON
const TYPE_KIND = MODEL_TYPE_KIND

/** 特性 key → 图标（未登记的回退到通用科学图标） */
const FEATURE_ICONS: Record<string, any> = {
  tools: WrenchScrewdriver24Regular,
  thinking: LightbulbFilament24Regular,
  visual: ScienceOutlined,
  'web-search': ScienceOutlined,
}

/**
 * 模型卡片的全部标签：**类型 + 细分类型 + 特性**。
 *
 * <p>三者统一交给 {@link ModelTagStrip} 渲染为「图标 + tooltip、最多 2 个、
 * 超出 +N、悬停 popover 看全」。</p>
 *
 * <p><b>为什么主类型也用图标而不是文字</b>：卡片标题行同时承载模型名与这些标签，
 * 纯文字下一个「人脸特征提取」就能吃掉半行；类型 + 细分类型 + 特性三项并列时
 * （实测 `agnes-2.0-flash` 就有 3 项）还会换行撑高卡片。改成图标后，占用只与
 * 图标个数相关，具体名称在悬停时给出。</p>
 *
 * <p>细分类型继承其父类型的图标与配色：`ocr_recognition` 属于 `ocr`，
 * 因此与类型同色同图标，用户一眼能看出「这是 OCR 这条线下的角色」。
 * 归属关系从 {@link MODEL_SUBTYPE_OPTIONS} 反查，不硬编码。</p>
 *
 * @param model 已由 mapModel 加工过的模型行
 * @returns 标签项列表（可能为空）
 */
const modelTags = (model: any) => {
  const tags: Array<{ key: string; label: string; icon: any; kind: string }> = []
  const parentType = String(model?.modelType || '')

  // ① 类型（OCR 识别 / 人脸识别 / 图像识别 / 语音合成 …）——放第一位，它是模型身份
  const typeLabel = typeMeta(parentType).label
  if (typeLabel) {
    tags.push({
      key: `type:${parentType || 'text'}`,
      label: typeLabel,
      icon: TYPE_ICONS[parentType] || TextT24Regular,
      kind: TYPE_KIND[parentType] || 'chat',
    })
  }

  // ② 细分类型：从 MODEL_SUBTYPE_OPTIONS 反查它属于哪个父类型，以继承图标/配色
  const sub = model?.subType
  if (sub) {
    const parent = Object.entries(MODEL_SUBTYPE_OPTIONS)
      .find(([, opts]) => opts.some((o) => o.value === String(sub)))?.[0] || parentType
    tags.push({
      key: `sub:${sub}`,
      label: subTypeLabel(sub),
      icon: TYPE_ICONS[parent] || Scan24Regular,
      kind: TYPE_KIND[parent] || 'info',
    })
  }

  // ③ 特性：tools / thinking / visual / web-search
  for (const f of model?.config?.features || []) {
    tags.push({
      key: `feat:${f}`,
      label: getLableName(f),
      icon: FEATURE_ICONS[f] || ScienceOutlined,
      kind: 'tool',
    })
  }

  return tags
}

/**
 * 能力种类的图标 / 中文名 / 配色。
 *
 * <p>key 与模型表单里「输入能力 / 输出能力」的勾选项一一对应
 * （text / image / audio / video / pdf），vector 留给向量化模型。
 * 图标与表单勾选项同源，避免「表单里是文档图标、卡片里换成别的」。</p>
 */
const CAP_ICONS: Record<string, any> = {
  text: TextT24Regular,
  image: Image24Regular,
  audio: Speaker224Regular,
  video: Video24Regular,
  pdf: DocumentText24Regular,
  vector: Group24Regular,
}
const CAP_LABELS: Record<string, string> = {
  text: '文本',
  image: '图片',
  audio: '音频',
  video: '视频',
  pdf: 'PDF',
  vector: '向量',
}
/** ModelTagStrip 的 kind-* 配色语义：对话 / 视觉 / 音频 / 视频 / 文档 / 向量 */
const CAP_KINDS: Record<string, string> = {
  text: 'chat',
  image: 'vision',
  audio: 'audio',
  video: 'video',
  pdf: 'doc',
  vector: 'vector',
}

/**
 * 能力图标条的数据：输入能力在前、输出能力在后，排成一行。
 *
 * <p>tooltip 里带方向（「输入 · 图片」/「输出 · 文本」）—— 同一个「图片」
 * 既可能是能读图、也可能是能生图，只写种类会分不清。图标本身按种类配色，
 * 方向靠顺序与 tip 表达，不额外加箭头（箭头在多图标换行时会把行撑高）。</p>
 *
 * @param model 模型行
 * @returns 图标条标签列表；无能力时为空数组（调用方据此不渲染）
 */
const capabilityItems = (model: any) => {
  const cfg = model?.config || {}
  const items: Array<{ key: string; label: string; icon: any; kind: string }> = []
  const push = (dir: '输入' | '输出', prefix: string, keys: any) => {
    for (const raw of Array.isArray(keys) ? keys : []) {
      const key = String(raw || '').trim()
      if (!key) continue
      items.push({
        key: `${prefix}:${key}`,
        label: `${dir} · ${CAP_LABELS[key] || key}`,
        icon: CAP_ICONS[key] || TextT24Regular,
        kind: CAP_KINDS[key] || 'info',
      })
    }
  }
  push('输入', 'in', cfg.inputCapabilities)
  push('输出', 'out', cfg.outputCapabilities)
  return items
}

/**
 * 列表视图的三列短值：输入/输出、价格、速度。
 *
 * <p>与卡片指标区同一套取数口径（{@link cardMeta}），只是把四格压成三个单元格：
 * 文生图没有 token 概念，前两格本来就不是「输入/输出」，所以合并成一格
 * 「张数 · 参考图」。标题（title）沿用 cardMeta 的完整说明，悬停可看单位与来源。</p>
 *
 * @param model 模型行
 * @returns 三个单元格的文本与悬停说明
 */
const listMeta = (model: any) => {
  const meta = cardMeta(model)
  const [first, second, price, speed] = meta
  const isImage = model?.modelType === 'image'
  return {
    io: isImage
      ? `${first?.value || '—'} · ${second?.value || '—'}`
      : `${first?.value || '—'} / ${second?.value || '—'}`,
    ioTitle: [first?.title, second?.title].filter(Boolean).join('；'),
    price: price?.value || '—',
    priceTitle: price?.title || '',
    speed: speed?.value || '—',
    speedTitle: speed?.title || '',
  }
}

const handleAdd = () => {
  // 默认直接打开手工表单；表单里的「获取」按钮再拉取上游模型列表
  formRef.value.openAdd()
}
const handleManualAdd = () => {
  // 来自 fetchDialog 的「手动添加」：fetchDialog 已自行关闭，
  // 表单-dialog 此时已打开（从 handleAdd / handleRequestFetch 而来），
  // 用 show() 而不是 openAdd()，避免重置用户已填的内容
  formRef.value?.show?.()
}
const handleEdit = (model: any) => formRef.value.openEdit(model)

const testLatency = async (model: any) => {
  const providerId = model?.providerId ?? props.provider?.id ?? props.provider?.provider_id
  const modelName = model?.model ?? model?.modelName ?? model?.name
  if (!providerId || !modelName || model.testing || model.hasNativeId === false) return
  model.testing = true
  try {
    const res: any = await modelApi.testProviderModelLatency(providerId, modelName)
    const body = res?.data ?? res
    if (body?.success === false) throw new Error(body?.message || '延迟测试失败')
    const raw = body?.latency ?? res?.latency ?? res?.data?.latency
    const latency = raw != null && Number.isFinite(Number(raw)) ? Number(raw) : null
    if (latency != null) {
      model.modelLastLatency = latency
      model.metrics = {
        ...(model.metrics || {}),
        probe_latency_ms: latency,
        latency_ms: latency,
      }
    }
    message.success(latency != null ? `测试延迟：${latency}ms` : '延迟测试完成', { duration: 2500 })
  } catch (error: any) {
    const detail = error?.response?.data?.message
      || error?.response?.data?.msg
      || error?.message
      || '延迟测试失败'
    message.error(String(detail), { duration: 2500 })
  } finally {
    model.testing = false
  }
}

const handleDelete = async (model: any) => {
  const ok = await confirm(
    t('settings.providerDetail.deleteModel'),
    t('settings.providerDetail.deleteModelConfirm'),
  )
  if (!ok) return
  await apiService.deleteModel(model.id)
  message.success(t('settings.providerDetail.modelDeleted'))
  emit('changed')
}

/** 同步价格：从服务商指标端点拉取价格/能力数据写入指标库 */
const syncPricingLoading = ref(false)
const handleSyncPricing = async () => {
  const providerId = props.provider?.id ?? props.provider?.provider_id
  if (!providerId) return
  syncPricingLoading.value = true
  try {
    const res: any = await modelApi.syncPricing(providerId)
    const body = res?.data ?? res
    if (body?.success === false) throw new Error(body?.message || '同步失败')
    const updated: number = body?.updated ?? 0
    const inserted: number = body?.inserted ?? 0
    const providerModels: number = body?.provider_models ?? 0
    const source: string = body?.source ?? ''
    if (body?.supported === false) {
      const pricingUrl: string = body?.pricing_url ?? ''
      message.warning(
        `该服务商暂未接入自动同步指标${pricingUrl ? `（官方价格页：${pricingUrl}）` : ''}`,
        { duration: 4000 },
      )
    } else {
      const parts: string[] = []
      if (updated > 0) parts.push(`更新 ${updated} 条`)
      if (inserted > 0) parts.push(`新增 ${inserted} 条`)
      if (providerModels > 0) parts.push(`回写模型 ${providerModels} 行`)
      if (parts.length === 0) {
        message.success(`指标已是最新${source ? `（来源：${source}）` : ''}`, { duration: 3000 })
      } else {
        message.success(`价格同步完成：${parts.join('，')}${source ? `（来源：${source}）` : ''}`, { duration: 4000 })
      }
    }
    emit('changed')
  } catch (error: any) {
    const detail = error?.response?.data?.message
      || error?.response?.data?.msg
      || error?.message
      || '同步价格失败'
    message.error(String(detail), { duration: 3000 })
  } finally {
    syncPricingLoading.value = false
  }
}

const handleToggle = async (model: any) => {
  try {
    const result = await apiService.toggleModelActive(model.id)
    model.isActive = result.isActive
    message.success(
      result.isActive ? t('settings.providerDetail.modelEnabled') : t('settings.providerDetail.modelDisabled'),
      { duration: 2000 },
    )
    emit('changed')
  } catch (error) {
    const apiError = error as { response?: { data?: { message?: string; msg?: string } }; message?: string };
    const detail = apiError?.response?.data?.message
      || apiError?.response?.data?.msg
      || apiError?.message
      || t('settings.providerDetail.toggleModelError')
    message.error(String(detail), { duration: 2000 })
    model.isActive = !model.isActive
  }
}

// ==================== 批量操作 ====================

/** 模型唯一标识：优先后端 id，回退模型名 */
const getModelId = (m: any) => m.id || m.modelName

const toggleSelect = (m: any) => {
  const id = getModelId(m)
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

/** 全选 / 取消全选当前筛选结果（保留其它筛选下已选中的模型） */
const toggleSelectAllFiltered = () => {
  const ids = filteredModels.value.map(getModelId)
  const allSelected = ids.length > 0 && ids.every((id) => selected.value.includes(id))
  if (allSelected) {
    selected.value = selected.value.filter((id) => !ids.includes(id))
  } else {
    selected.value = Array.from(new Set([...selected.value, ...ids]))
  }
}

const findModel = (id: string) => props.models.find((m: any) => getModelId(m) === id)

/** 批量启用：只处理当前停用的模型，避免把已启用模型也切一遍 */
const batchEnable = async () => {
  const targets = selected.value.map(findModel).filter((m: any) => m && m.isActive === false)
  selected.value = []
  if (!targets.length) {
    message.info('所选模型均已启用')
    return
  }
  await Promise.allSettled(
    targets.map((m: any) => {
      m.isActive = true
      return handleToggle(m)
    }),
  )
}

/** 批量停用：只处理当前启用的模型，避免把已停用模型也切一遍 */
const batchDisable = async () => {
  const targets = selected.value.map(findModel).filter((m: any) => m && m.isActive === true)
  selected.value = []
  if (!targets.length) {
    message.info('所选模型均已停用')
    return
  }
  await Promise.allSettled(
    targets.map((m: any) => {
      m.isActive = false
      return handleToggle(m)
    }),
  )
}

/** 批量删除进行中（防止连点重复提交） */
const batchDeleting = ref(false)

/**
 * 批量删除所选模型。
 *
 * <p>只处理带原生 id 的行：{@code batchDeleteProviderModels} 依赖
 * {@code providerId:modelName} 复合 id 定位复合主键，内置 Agent 之类没有原生记录的行
 * 删不掉（hasNativeId === false），直接在确认框里说明并跳过，而不是逐条报错。</p>
 */
const batchDelete = async () => {
  const targets = selected.value.map(findModel).filter((m: any) => !!m)
  const deletable = targets.filter((m: any) => m.hasNativeId !== false && !!m.id)
  const skipped = targets.length - deletable.length
  if (!deletable.length) {
    message.warning('所选模型无原生记录，暂无法删除')
    return
  }
  const ok = await confirm(
    '批量删除模型',
    `确定删除所选 ${deletable.length} 个模型吗？删除后将无法恢复。`
      + (skipped > 0 ? `（另有 ${skipped} 个无原生记录的行会被跳过）` : ''),
  )
  if (!ok) return
  batchDeleting.value = true
  try {
    const res: any = await apiService.batchDeleteProviderModels(deletable.map((m: any) => m.id))
    const deleted = res?.deletedCount ?? res?.data?.deletedCount ?? deletable.length
    if (deleted > 0) {
      message.success(`已删除 ${deleted} 个模型` + (deletable.length > deleted ? `（${deletable.length - deleted} 未删除）` : ''))
    } else {
      const detail = res?.data?.msg || res?.msg || res?.message || '请稍后重试'
      message.error(`删除失败：${detail}`)
    }
    selected.value = []
    emit('changed')
  } catch (error: any) {
    const detail = error?.response?.data?.msg
      || error?.response?.data?.message
      || error?.message
      || '删除失败'
    message.error(`删除失败：${detail}`)
  } finally {
    batchDeleting.value = false
  }
}

const handleRequestFetch = () =>
  // false：这条是从模型表单里点「获取」来的，失败时不要回退 openAdd()，
  // 否则会把表单里已经填好的模型名/参数清空
  fetchRef.value.open(props.provider, props.models, false)
const handleFetchSelect = (model: any) => formRef.value.prefillFromFetch(model)
</script>

<style scoped>
/* 详情壳：头（在外层）之外，右栏正好是「滚动模型区 + 吸底余额条」两段。
   height:100% + min-height:0 是让滚动区真的能滚（flex 子项默认 min-height:auto，
   不加这条，模型一多会把整页顶出去而不是在框内滚动）。 */
.detail-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

/* 详情滚动区：垂直滚动即可；内容（超长模型名 / 极窄窗口下的卡片网格）一律不产生横向滚动条。
   背景：模型管理里超长文字（如 NewAPI 模板描述）曾把整页顶出水平滚动条（用户需求 1）。 */
.detail-scroll { flex: 1; min-height: 0; scrollbar-gutter: stable both-edges; overflow-x: hidden; }

/* 供应商头部：实色表面 + 发丝描边 + 极淡投影。
   不用渐变：这一版把「彩色」全部留给模型卡片的顶部色带与指标块，
   头部再上渐变会和卡片抢视觉焦点。 */
.d-band {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 15px 17px;
  border-radius: var(--radius-lg, 12px);
  background: var(--color-surface);
  border: 1px solid var(--border-subtle, var(--color-surface-border));
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.04));
}
.d-band-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: var(--radius-lg, 12px);
  /* 主色淡染 + 内描边：色块有体积感，但不至于变成实心按钮 */
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary) 15%, transparent),
    color-mix(in srgb, var(--color-primary) 5%, transparent)
  );
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 12%, transparent);
}
.d-band-info { flex: 1; min-width: 0; }
.d-band-name-row { display: flex; align-items: center; gap: 10px; min-width: 0; }
.d-band-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--color-text);
}
.d-band-url { display: flex; align-items: center; gap: 5px; margin-top: 4px; color: var(--color-text-disabled); }
.d-band-url-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.d-band-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.d-del-btn {
  --el-button-text-color: var(--el-color-danger);
  --el-button-border-color: color-mix(in srgb, var(--el-color-danger) 35%, var(--color-surface-border));
  --el-button-hover-text-color: var(--el-color-danger);
  --el-button-hover-bg-color: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
  --el-button-hover-border-color: var(--el-color-danger);
  --el-button-active-bg-color: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
}

/* 空 */
.d-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 14px;
  padding: 52px 20px;
  border-radius: var(--radius-lg, 12px);
  background: var(--bg-elevated, var(--color-surface));
  border: 1px solid var(--border-subtle, var(--color-surface-border));
}
.d-empty-icon { color: var(--color-text-disabled); }
.d-empty-title { margin: 16px 0 0; font-size: 15px; font-weight: 600; color: var(--color-text-gray); }
.d-empty-desc { margin: 6px 0 0; font-size: 13px; color: var(--color-text-disabled); }

/* 区块标题 */
.d-section-head { display: flex; flex-direction: column; gap: 8px; margin: 20px 2px 12px; }
.d-head-row {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.d-head-filters {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.d-section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.005em;
  color: var(--color-text);
}
.d-section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 19px; height: 18px; padding: 0 6px;
  /* 原值 9px，18px 高的计数胶囊；用 full 令牌表达同一种形状 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px; font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-border-color-lighter);
}

/* 视图切换：两个方形图标按钮，选中的那个浮一层白底（与页签同语义）。
   放在标题/计数右边，不抢搜索框与批量工具栏的位置。 */
.view-switch {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--radius-md, 8px);
  background: var(--el-fill-color-light);
  border: 1px solid var(--border-subtle, var(--color-surface-border));
}
.view-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  color: var(--color-text-gray);
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.view-btn:hover { color: var(--color-primary); }
.view-btn.is-on {
  color: var(--color-primary);
  background: var(--color-surface, #fff);
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(15, 23, 42, 0.08));
}

/* 模型搜索框 */
.model-search-input { width: 210px; }

/* 状态/类型筛选 */
.filter-group { display: flex; align-items: center; }
.type-select { width: 110px; }

/* 批量操作工具栏：只在已选模型时渲染（空态不占位、不带底色）。
   勾中卡片后出现在标题行右侧，撑开的是同一行，不会把卡片网格往下顶。 */
.batch-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  min-height: 34px;
  padding: 4px 10px;
  border-radius: var(--el-radius-base);
  background: var(--bg-elevated, var(--el-fill-color-light));
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter));
  transition: background 0.18s ease, border-color 0.18s ease;
}
.batch-toolbar:hover {
  background: var(--el-fill-color-light);
  border-color: var(--border-default, var(--el-border-color-lighter));
}
.batch-count { 
  font-size: 12px; color: var(--el-text-color-secondary); 
  border-radius: 4px;
}
/* 「全选 / 反选」已改为 el-button，旧的文字链样式不再需要 */

/* 上下文大小过滤（与模型选择卡片共用同一套标签） */
.ctx-filter {
  margin-left: auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.ctx-filter-title { font-size: 12px; color: var(--color-text-gray); }
.ctx-tag {
  padding: 3px 9px;
  /* 原值 99px → 胶囊最小档 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px;
  line-height: 16px;
  color: var(--el-text-color-secondary);
  background: var(--bg-fill, var(--el-fill-color));
  border: 1px solid transparent;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.ctx-tag:hover {
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border-color: var(--border-default, var(--el-border-color-lighter));
}
.ctx-tag-active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 1px 4px color-mix(in srgb, var(--color-primary) 32%, transparent);
}
.ctx-no-match {
  padding: 34px 0 20px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-disabled);
}

/* ===== 列表视图 =====
   与卡片视图吃同一份 filteredModels / 筛选 / 批量选择，换成一行一个模型：
   勾选 · 名称与 logo · 能力图标条 · 输入输出 · 价格 · 速度 · 启用开关 · 操作。

   列宽用 minmax 让中间两列吃掉多余宽度，其余给固定值（数字列要能上下对齐）；
   右栏再窄就整块横向滚动，而不是把名称压成「…」（模型名是识别主键，
   压完就分不清同前缀的几行）。 */
.model-list {
  border: 1px solid var(--border-subtle, var(--color-surface-border));
  border-radius: var(--radius-lg, 12px);
  background: var(--color-surface);
  overflow-x: auto;
}
.ml-head,
.ml-row {
  display: grid;
  grid-template-columns: 26px minmax(150px, 2fr) minmax(112px, 1.2fr) 88px 78px 68px 48px 92px;
  align-items: center;
  gap: 8px;
  min-width: 700px;
  padding: 0 12px;
}
.ml-head {
  height: 34px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-gray);
  background: var(--bg-elevated, #f8fafc);
  border-bottom: 1px solid var(--border-subtle, var(--color-surface-border));
  border-radius: var(--radius-lg, 12px) var(--radius-lg, 12px) 0 0;
}
.ml-row {
  min-height: 46px;
  border-bottom: 1px solid var(--border-subtle, var(--color-surface-border));
  transition: background 0.15s ease;
}
.ml-row:last-child { border-bottom: none; }
.ml-row:hover { background: var(--el-fill-color-lighter); }
.ml-row.is-selected { background: color-mix(in srgb, var(--color-primary) 4%, transparent); }
.ml-row.is-off .ml-name-text { color: var(--color-text-gray); }

.ml-c-check { display: inline-flex; align-items: center; justify-content: center; }
.ml-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.ml-logo {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: var(--radius-sm, 6px);
  overflow: hidden;
}
.ml-name-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}
.ml-badge {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 9%, transparent);
}
.ml-cell {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--color-text-gray);
  font-variant-numeric: tabular-nums;
  cursor: help;
}
.ml-c-price { text-align: right; }
.ml-c-speed { text-align: right; }
.ml-c-sw { display: inline-flex; justify-content: center; }
.ml-actions { display: inline-flex; align-items: center; justify-content: flex-end; gap: 1px; }

/* 模型卡片 */
.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(258px, 1fr));
  /* 卡片按内容高度自适应，不再拉伸成整行等高。
     过去用 grid-auto-rows: 1fr + margin-top:auto 让底栏贴底，
     代价是没有指标、也没有能力图标的卡片被拉到与同排最高卡同高，
     正文与底栏之间会留出一大块空洞（实测 ONNX 列表最明显）。
     改为 align-items: start 后卡片各自贴住内容，行内顶边仍然对齐。 */
  align-items: start;
  gap: 12px;
}
/* 卡片：顶部一条主色→紫的柔和色带作为「身份标记」，其余部分保持素净。
   色带用伪元素而不是 border-top —— border 会跟着圆角走形，伪元素可以
   单独控制顶部两个圆角，且不参与盒模型、不影响内容对齐。 */
.mc {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: var(--radius-lg, 12px);
  background: var(--color-surface);
  border: 1px solid var(--border-subtle, var(--color-surface-border));
  overflow: hidden;
  transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}
.mc::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: linear-gradient(90deg, var(--color-primary), #6d28d9);
  transition: opacity 0.18s ease;
}
/* 未启用：色带降为灰阶，一眼区分「停用」，不必再去找开关 */
.mc.is-off::before {
  background: linear-gradient(90deg, var(--border-strong, #d3dceb), var(--border-subtle, #eef2f8));
}
.mc:hover {
  border-color: color-mix(in srgb, var(--color-primary) 32%, var(--color-surface-border));
  box-shadow: var(--shadow-md, 0 4px 12px rgba(15, 23, 42, 0.06));
}
/* 批量选中态 */
.mc.is-selected {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 3%, var(--color-surface));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 10%, transparent);
}
/* 批量选择 checkbox：放在头部右侧，小圆底背景让元素看起来像可控件而非占位 */
.mc-check {
  margin-left: auto;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-top: -2px;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
  cursor: pointer;
  /* 只用内阴影表达选中，不用外扩散阴影，避免点击时卡片视觉位置跳动 */
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}
.mc:hover .mc-check { background: var(--el-fill-color-dark); }
.mc.is-selected .mc-check {
  color: #fff;
  background: var(--color-primary);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 55%, #fff);
}
.mc.is-selected .mc-check:hover {
  background: color-mix(in srgb, var(--color-primary) 88%, var(--color-surface));
}
.mc-check :deep(.el-checkbox) {
  height: auto;
  margin-right: 0;
  line-height: 0;
}
.mc-check :deep(.el-checkbox__inner) {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  /* 去掉 Element Plus 自带动画：选中/取消时不缩放、不旋转、不移动 */
  transition: none;
  animation: none;
}
.mc-check :deep(.el-checkbox__inner::after) { transition: none; }
.mc-check :deep(.el-checkbox.is-checked .el-checkbox__inner) {
  background-color: transparent;
  border-color: #fff;
}
.mc-check :deep(.el-checkbox.is-checked .el-checkbox__inner::after) {
  border-color: #fff;
  transform: rotate(45deg) scale(1);
}
.mc-head { display: flex; align-items: flex-start; margin-bottom: 12px; }
.mc-head-text { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; flex: 1; }
.mc-name {
  font-size: 14px; font-weight: 700; color: var(--color-text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
/* .mc-type / .mc-type.sub 已随标签改造移除：类型、细分类型、特性
   统一由 ModelTagStrip 以「图标 + tooltip」渲染，不再占用文字宽度。 */

/* 能力行不再预留固定高度：无输入/输出能力的模型（如部分 ONNX 卡片）
   过去会空出一条 24px 的占位带，是「空白很大」的一部分来源。
   现在整条能力带由 ModelTagStrip 渲染（图标 + 悬停 tip）。 */
.mc-caps { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding: 6px; }
/* 旧的「输入 → 输出」双组与箭头样式已随能力带改造移除 */
/* .mc-feature 已随「其它标签」改造移除：特性改由 ModelTagStrip 以图标 + tooltip 渲染 */

/* 指标区：等宽色块，恒定 6 格。
   原来是一行「标签 + 值」的小字（gap 14px、无背景），多个指标挤在一起时
   需要逐个读；改成色块后，同一个位置上的数字可以直接上下比较，
   并且首个指标（通常是「输入」或「张数」）用主色淡底强调。

   为什么用 flex 换行而不是 grid auto-fit：grid 下不整除的行会只剩一个色块、
   旁边的半格空着（实测 5 项时末行 126px 半格空洞）；容器变窄时列数又会在 2/3
   之间跳。flex + flex:1 1 92px 让每行剩下的项自动 stretch 占满整行，永不留空洞。

   等高从哪来：格数恒定（6），同一栏里每张卡宽度相同 → 换行结果完全相同；
   每格再用一条恒定占位的副行（.mc-meta-sub）锁住格高。两者缺一，卡片就会
   高低不齐（格数会变、或有的格有副行有的没有）。 */
.mc-meta {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 11px;
  padding-top: 11px;
  border-top: 1px solid var(--border-subtle, var(--color-surface-border));
}
.mc-meta-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  /* 84px 基准而不是 92px：6 格要能排成 3+3 两行（92px 时常见卡片宽度只能放 2 个，
     变成 3 行、卡片白白高出一截）；84-16(padding)=68px 仍放得下
     "1,000,000"、"$8/$40"、"首字 850ms" 这类最长值。 */
  flex: 1 1 84px;
  min-width: 84px;
  padding: 6px 8px;
  border-radius: var(--radius-md, 8px);
  background: var(--bg-elevated, #f8fafc);
}
/* 首个指标：主色淡底 + 主色数值，作为这张卡的「主指标」 */
.mc-meta-item.is-lead {
  background: color-mix(in srgb, var(--color-primary) 7%, transparent);
}
.mc-meta-label {
  font-size: 10px;
  line-height: 1.35;
  color: var(--color-text-gray);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mc-meta-val {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 副行（首字 TTFT / HLE）：min-height 让空副行也占位。
   没有它，有首字的卡比没有的高 13px，一屏卡片立刻高低不齐。 */
.mc-meta-sub {
  min-height: 14px;
  font-size: 10px;
  line-height: 1.35;
  color: var(--color-text-gray);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* 附加信息角标（最近使用 / 延迟）：骑在指标区分隔线上，绝对定位不参与布局，
   所以「有附加信息」不会把卡片撑高。悬停看明细。 */
.mc-extra {
  position: absolute;
  top: -8px;
  right: 0;
  z-index: 1;
  height: 16px;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid var(--border-subtle, var(--color-surface-border));
  background: var(--bg-elevated, #f8fafc);
  color: var(--color-text-gray);
  font-size: 10px;
  line-height: 14px;
  font-variant-numeric: tabular-nums;
  cursor: help;
}
.mc-meta-item.is-lead .mc-meta-val { color: var(--color-primary); }
/* 无数据占位（—）：压成弱化色，别让「没数据」看起来像一个真数值 */
.mc-meta-item.is-empty .mc-meta-val { color: var(--color-text-gray); font-weight: 600; }
/* 主指标同时也是空值时，弱化色要盖过主色（同特异度下靠后声明取胜） */
.mc-meta-item.is-lead.is-empty .mc-meta-val { color: var(--color-text-gray); }

.mc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 卡片已按内容高度自适应，auto 只在极端布局（外部把卡片拉高）时兜底贴底 */
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle, var(--color-surface-border));
}
.mc-src {
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
}
.mc-src.is-in { color: var(--el-text-color-secondary); background: var(--el-fill-color); }
.mc-src.is-ext {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 9%, transparent);
}
.mc-foot-btns { display: flex; gap: 1px; }
.mc-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 29px; height: 29px;
  border: none;
  border-radius: var(--radius-md, 8px);
  color: var(--color-text-gray);
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.mc-btn:hover {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 9%, transparent);
}
.mc-btn:disabled { cursor: not-allowed; opacity: .45; }
.mc-btn:disabled:hover { color: var(--color-text-gray); background: transparent; }
.mc-btn.danger:hover { color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); }

/* 动效降级：系统开启「减少动态效果」时，模型卡的描边/底色/阴影与卡片按钮的颜色直接到位。
   逐个列出，不写 `*` / .mc * 通配，
   避免把卡内 el-tag / el-switch / el-dialog 内部 Element Plus 组件的合法过渡一起掐掉。
   这些都只带 transition（无 animation），hover 态本身是静态样式，照常成立。 */
@media (prefers-reduced-motion: reduce) {
  .mc,
  .mc::before,
  .mc-btn,
  .ml-row,
  .view-btn,
  .batch-toolbar,
  .ctx-tag {
    transition: none;
  }
  /* 悬停不再位移/投影，避免「减少动效」下仍出现位移观感 */
  .mc:hover { box-shadow: none; }
}
</style>
