<template>
  <section class="manufacturer-page">
    <div class="manufacturer-page__intro">
      <div class="manufacturer-page__header">
        <el-button
          class="manufacturer-page__icon-btn"
          text
          circle
          title="返回首页"
          @click="router.push('/ai/home')"
        >
          <IconifyIconOnline icon="ri:arrow-left-line" />
        </el-button>
        <el-button
          class="manufacturer-page__icon-btn"
          type="primary"
          plain
          circle
          title="全局配置"
          @click="openGlobalConfig"
        >
          <IconifyIconOnline icon="ri:settings-3-line" />
        </el-button>
      </div>
      <div class="manufacturer-page__intro-content">
        <div class="manufacturer-page__intro-main">
          <h1>厂家与模型中心</h1>
          <p>集中管理厂家连接信息、模型配置与运行时参数，推荐先创建厂家再维护模型。</p>
        </div>
        <div class="manufacturer-page__intro-meta">
          <div class="manufacturer-page__meta-item">
            <span>厂家数</span>
            <strong>{{ manufacturers.length }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="manufacturer-page__body">
      <div v-if="loading" class="manufacturer-page__state">
        <el-skeleton :rows="6" animated />
      </div>

      <div
        v-else-if="pagedManufacturers.length || manufacturers.length === 0"
        class="manufacturer-page__grid"
      >
        <button
          class="manufacturer-card manufacturer-card--add"
          type="button"
          @click="openCreateDialog"
        >
          <IconifyIconOnline class="manufacturer-card__add-icon" icon="ri:add-line" />
          <strong>添加厂家</strong>
          <p>新建一个厂家卡片并填写连接信息</p>
        </button>

        <article
          v-for="item in pagedManufacturers"
          :key="item.sysAiManufacturerId || item.sysAiManufacturerCode"
          class="manufacturer-card"
          @click="openManufacturerPanel(item)"
        >
          <el-badge
            class="manufacturer-card__count-badge"
            :value="item.moduleCount || 0"
            type="primary"
          />
          <div class="manufacturer-card__toolbar">
            <el-tooltip content="编辑厂商" placement="top">
              <el-button text class="toolbar-icon-btn" @click.stop="openEditDialog(item)">
                <IconifyIconOnline class="toolbar-icon-btn__icon" icon="ri:edit-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip :content="item.sysAiManufacturerStatus === 1 ? '停用厂商' : '启用厂商'" placement="top">
              <el-button
                text
                class="toolbar-icon-btn toolbar-icon-btn--status"
                :class="item.sysAiManufacturerStatus === 1 ? 'status-enabled' : 'status-disabled'"
                @click.stop="toggleManufacturerStatus(item)"
              >
                <IconifyIconOnline
                  class="toolbar-icon-btn__icon"
                  :icon="item.sysAiManufacturerStatus === 1 ? 'ri:toggle-fill' : 'ri:toggle-line'"
                />
              </el-button>
            </el-tooltip>
            <el-tooltip content="删除厂商" placement="top">
              <el-button text type="danger" class="toolbar-icon-btn" @click.stop="removeManufacturer(item)">
                  <IconifyIconOnline class="toolbar-icon-btn__icon" icon="ri:delete-bin-line" />
              </el-button>
            </el-tooltip>
          </div>

          <div class="manufacturer-card__header">
            <div class="manufacturer-card__identity">
              <div class="manufacturer-card__media-stack">
                <div class="manufacturer-card__media">
                  <template v-if="item.sysAiManufacturerLogo">
                    <img
                      :src="item.sysAiManufacturerLogo"
                      :alt="item.sysAiManufacturerName"
                      class="manufacturer-card__logo"
                    />
                  </template>
                  <template v-else-if="item.sysAiManufacturerIcon">
                    <div class="manufacturer-card__icon-wrap">
                      <img
                        :src="item.sysAiManufacturerIcon"
                        :alt="item.sysAiManufacturerName"
                        class="manufacturer-card__icon"
                      />
                    </div>
                  </template>
                  <template v-else>
                    <div
                      class="manufacturer-card__placeholder"
                      :style="{
                        backgroundColor: getManufacturerColor(
                          item.sysAiManufacturerCode || item.sysAiManufacturerName
                        ),
                      }"
                    >
                      <span>{{ getManufacturerInitial(item.sysAiManufacturerName) }}</span>
                    </div>
                  </template>
                </div>
                <small class="manufacturer-card__code manufacturer-card__code--below">
                  {{ item.sysAiManufacturerCode }}
                </small>
              </div>

              <div class="manufacturer-card__name-block">
                <div class="manufacturer-card__meta-row">
                  <el-tag
                    size="small"
                    round
                    :type="item.sysAiManufacturerStatus === 1 ? 'success' : 'info'"
                    class="manufacturer-card__status-tag"
                  >
                    {{ item.sysAiManufacturerStatus === 1 ? "启用" : "停用" }}
                  </el-tag>
                </div>
                <h3>{{ item.sysAiManufacturerName }}</h3>
              </div>
            </div>

            <div
              v-if="item.sysAiManufacturerOpenaiCompatible === 1 || item.sysAiManufacturerMemoryEnabled === 1 || item.sysAiManufacturerClaudeCompatible === 1"
              class="manufacturer-card__corner-icons"
            >
              <el-tooltip v-if="item.sysAiManufacturerOpenaiCompatible === 1" content="OpenAI 兼容" placement="top">
                <span class="manufacturer-card__corner-icon manufacturer-card__corner-icon--success">
                  <IconifyIconOnline class="manufacturer-card__corner-icon-svg" icon="ri:robot-2-line" />
                </span>
              </el-tooltip>
              <el-tooltip v-if="item.sysAiManufacturerMemoryEnabled === 1" content="记忆开启" placement="top">
                <span class="manufacturer-card__corner-icon manufacturer-card__corner-icon--warning">
                  <IconifyIconOnline class="manufacturer-card__corner-icon-svg" icon="ri:brain-line" />
                </span>
              </el-tooltip>
              <el-tooltip v-if="item.sysAiManufacturerClaudeCompatible === 1" content="Claude 兼容" placement="top">
                <span class="manufacturer-card__corner-icon manufacturer-card__corner-icon--success">
                  <IconifyIconOnline class="manufacturer-card__corner-icon-svg" icon="ri:anthropic-line" />
                </span>
              </el-tooltip>
            </div>
          </div>

          <span class="manufacturer-card__remark">
            {{ item.sysAiManufacturerRemark || "当前厂家暂无额外说明" }}
          </span>
        </article>
      </div>

      <el-empty v-else description="暂无厂家数据" />
    </div>

    <div class="manufacturer-page__footer">
      <el-pagination
        v-if="manufacturers.length > pageSize"
        v-model:current-page="currentPage"
        :page-size="pageSize"
        layout="prev, pager, next"
        :total="manufacturers.length"
        background
      />
    </div>

    <el-drawer
      v-model="panelVisible"
      :with-header="false"
      size="1280px"
      destroy-on-close
    >
      <div v-if="selectedManufacturer" class="manufacturer-panel">
        <div class="manufacturer-panel__hero">
          <div class="manufacturer-panel__identity">
            <div class="manufacturer-panel__logo">
              <img
                v-if="selectedManufacturer.sysAiManufacturerLogo"
                :src="selectedManufacturer.sysAiManufacturerLogo"
                :alt="selectedManufacturer.sysAiManufacturerName"
              />
              <div v-else class="manufacturer-panel__logo-fallback">
                {{ getManufacturerInitial(selectedManufacturer.sysAiManufacturerName) }}
              </div>
            </div>

            <div>
              <small>{{ selectedManufacturer.sysAiManufacturerCode }}</small>
              <h2>{{ selectedManufacturer.sysAiManufacturerName }}</h2>
              <p>{{ selectedManufacturer.sysAiManufacturerBaseUrl || "未设置 Base URL" }}</p>
            </div>
          </div>

          <div class="manufacturer-panel__hero-actions">
            <el-tooltip content="从 API 同步模型价格" placement="top">
              <el-button class="manufacturer-panel__refresh-btn" plain circle @click="syncModelPrices">
                <IconifyIconOnline icon="ri:price-tag-3-line" />
              </el-button>
            </el-tooltip>
            <el-tooltip content="从 API 同步全部模型（先删后插）" placement="top">
              <el-button class="manufacturer-panel__refresh-btn" plain circle @click="handleReplaceModels">
                <IconifyIconOnline icon="ri:database-2-line" />
              </el-button>
            </el-tooltip>
            <el-button class="manufacturer-panel__refresh-btn" plain circle @click="reloadManufacturerModules">
              <IconifyIconOnline icon="ri:refresh-line" />
            </el-button>
          </div>
        </div>

        <div class="manufacturer-panel__grid">
          <button class="module-card module-card--add" type="button" @click="openModuleDialog()">
            <IconifyIconOnline class="module-card__add-icon" icon="ri:add-line" />
            <strong>添加模型</strong>
            <p>为当前厂商新建一个模型卡片</p>
          </button>

          <article
            v-for="item in manufacturerModules"
            :key="item.sysAiModuleId || item.sysAiModuleCode"
            class="module-card"
            :class="{
              'is-llm': item.sysAiModuleType === 'LLM',
              'is-image': item.sysAiModuleType === 'IMAGE',
              'is-video': item.sysAiModuleType === 'VIDEO',
              'is-face': item.sysAiModuleType === 'FACE',
              'is-colorization': item.sysAiModuleType === 'COLORIZATION',
              'is-resolution': item.sysAiModuleType === 'RESOLUTION',
              'is-ocr': item.sysAiModuleType === 'OCR',
              'is-reid': item.sysAiModuleType === 'REID',
              'is-classification': item.sysAiModuleType === 'CLASSIFICATION',
              'is-audio': item.sysAiModuleType === 'AUDIO',
              'is-global-model': isGlobalModule(item),
            }"
          >
            <div class="module-card__toolbar">
              <el-tooltip content="编辑模型" placement="top">
                <el-button text class="toolbar-icon-btn" @click="openModuleDialog(item)">
                  <IconifyIconOnline class="toolbar-icon-btn__icon" icon="ri:edit-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="费用配置" placement="top">
                <el-button text class="toolbar-icon-btn" @click="openModulePriceDialog(item)">
                  <IconifyIconOnline class="toolbar-icon-btn__icon" icon="ri:money-cny-circle-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="isVisualModule(item) && item.sysAiModuleSupportTemplate === 1"
                content="模板配置"
                placement="top"
              >
                <el-button
                  text
                  class="toolbar-icon-btn"
                  @click="openModuleFeatureDialog(item, 'template')"
                >
                  <IconifyIconOnline class="toolbar-icon-btn__icon" icon="ri:puzzle-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip
                v-if="isVisualModule(item) && item.sysAiModuleSupportStyle === 1"
                content="样式配置"
                placement="top"
              >
                <el-button
                  text
                  class="toolbar-icon-btn"
                  @click="openModuleFeatureDialog(item, 'style')"
                >
                  <IconifyIconOnline class="toolbar-icon-btn__icon" icon="ri:palette-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip v-if="item.sysAiModuleType === 'LLM'" content="设为全局默认模型" placement="top">
                <el-button text class="toolbar-icon-btn" @click="setModuleAsGlobal(item)">
                  <IconifyIconOnline class="toolbar-icon-btn__icon" icon="ri:global-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除模型" placement="top">
                <el-button text type="danger" class="toolbar-icon-btn" @click="removeModule(item)">
                    <IconifyIconOnline class="toolbar-icon-btn__icon" icon="ri:delete-bin-line" />
                </el-button>
              </el-tooltip>
            </div>

            <div class="module-card__header">
              <div class="module-card__visual">
                <div class="module-card__cover">
                  <img
                    v-if="resolveModuleImage(item)"
                    :src="resolveModuleImage(item)"
                    :alt="item.sysAiModuleName"
                  />
                  <span v-else>{{ getModuleImageFallback(item) }}</span>
                </div>
                <div class="module-card__title-block">
                  <small>{{ item.sysAiModuleCode }}</small>
                  <h3>{{ item.sysAiModuleName }}</h3>
                </div>
              </div>
              <el-tag class="module-card__type-tag" size="small" round>
                {{ getModuleTypeLabel(item.sysAiModuleType) }}
              </el-tag>
            </div>

            <div class="module-card__identity-tags">
              <el-tooltip
                :content="`模型ID ${item.sysAiModuleModelId || '-'}`"
                placement="top"
                :disabled="!(item.sysAiModuleModelId && String(item.sysAiModuleModelId).length > 18)"
              >
                <el-tag
                  size="small"
                  effect="plain"
                  round
                  class="module-card__identity-tag module-card__identity-tag--model-id"
                >
                  模型ID {{ item.sysAiModuleModelId || "-" }}
                </el-tag>
              </el-tooltip>
            </div>
            <span v-if="item.sysAiModuleVersion" class="module-card__version-badge">
              版本 {{ item.sysAiModuleVersion }}
            </span>
            <div class="module-card__footer">
              <div class="module-card__meta-tags">
                <el-tag v-if="item.sysAiModuleType === 'LLM' && isGlobalModule(item)" round type="danger">
                  全局
                </el-tag>
                <el-tooltip v-if="item.sysAiModuleType === 'LLM' && item.sysAiModuleVlm === 1" content="图片理解" placement="top">
                  <span class="module-card__icon-only-tag module-card__icon-only-tag--warning">
                    <IconifyIconOnline class="module-card__tag-icon" icon="ri:image-line" />
                  </span>
                </el-tooltip>
                <el-tooltip
                  v-if="item.sysAiModuleType === 'LLM' && item.sysAiModuleSupportThink === 1"
                  content="深度思考"
                  placement="top"
                >
                  <span class="module-card__icon-only-tag module-card__icon-only-tag--danger">
                    <IconifyIconOnline class="module-card__tag-icon" icon="ri:brain-line" />
                  </span>
                </el-tooltip>
                <el-tooltip
                  v-if="item.sysAiModuleType === 'LLM' && item.sysAiModuleSupportOptimize === 1"
                  content="支持输入优化"
                  placement="top"
                >
                  <span class="module-card__icon-only-tag module-card__icon-only-tag--success">
                    <IconifyIconOnline class="module-card__tag-icon" icon="ri:magic-line" />
                  </span>
                </el-tooltip>
                <el-tooltip
                  v-if="isVisualModule(item) && item.sysAiModuleSupportTemplate === 1"
                  content="支持模板"
                  placement="top"
                >
                  <span class="module-card__icon-only-tag module-card__icon-only-tag--success">
                    <IconifyIconOnline class="module-card__tag-icon" icon="ri:apps-2-line" />
                  </span>
                </el-tooltip>
                <el-tooltip
                  v-if="isVisualModule(item) && item.sysAiModuleSupportStyle === 1"
                  content="支持样式"
                  placement="top"
                >
                  <span class="module-card__icon-only-tag">
                    <IconifyIconOnline class="module-card__tag-icon" icon="ri:palette-line" />
                  </span>
                </el-tooltip>
                <el-tag v-if="isVisualModule(item) && item.sysAiModuleGenerateLimit" round>
                  上限 {{ item.sysAiModuleGenerateLimit }}
                </el-tag>
              </div>
            </div>
            <el-tag
              class="module-card__status-badge"
              :type="item.sysAiModuleStatus === 1 ? 'success' : 'info'"
              round
              size="small"
            >
              {{ item.sysAiModuleStatus === 1 ? "启用" : "停用" }}
            </el-tag>
          </article>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="760px"
      class="manufacturer-dialog"
      destroy-on-close
    >
      <el-form
        ref="manufacturerFormRef"
        :model="manufacturerForm"
        :rules="manufacturerRules"
        label-position="top"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="厂家名称" prop="sysAiManufacturerName">
              <el-input
                v-model="manufacturerForm.sysAiManufacturerName"
                placeholder="例如 OpenAI / 讯飞星火"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="提供商" prop="sysAiManufacturerFactory">
              <el-select
                v-model="manufacturerForm.sysAiManufacturerFactory"
                class="full-width"
                placeholder="选择提供商"
              >
                <el-option
                  v-for="item in factoryOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="图标">
              <el-input
                v-model="manufacturerForm.sysAiManufacturerIcon"
                placeholder="图标 URL 或本地资源地址"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Logo">
              <div class="manufacturer-form__upload">
                <el-input
                  v-model="manufacturerForm.sysAiManufacturerLogo"
                  placeholder="上传后自动写入服务器本地地址"
                  readonly
                />
                <el-upload
                  :show-file-list="false"
                  :http-request="handleLogoUpload"
                  accept="image/*"
                >
                  <el-button :loading="logoUploading" type="primary" plain>
                    上传 Logo
                  </el-button>
                </el-upload>
              </div>
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="官网">
              <el-input
                v-model="manufacturerForm.sysAiManufacturerWebsite"
                placeholder="https://..."
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Base URL" prop="sysAiManufacturerBaseUrl">
              <el-input
                v-model="manufacturerForm.sysAiManufacturerBaseUrl"
                placeholder="https://api.example.com/v1"
              />
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="AppKey" prop="sysAiManufacturerAppKey">
              <el-input
                v-model="manufacturerForm.sysAiManufacturerAppKey"
                type="password"
                show-password
                placeholder="厂商 AppKey / API Key"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="兼容 OpenAI">
              <ScSwitch
                v-model="openaiCompatibleSwitch"
                layout="icon"
                size="small"
                active-icon="ri:robot-2-line"
                inactive-icon="ri:prohibited-2-line"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="兼容 Claude">
              <ScSwitch
                v-model="claudeCompatibleSwitch"
                layout="icon"
                size="small"
                active-icon="ri:anthropic-line"
                inactive-icon="ri:prohibited-2-line"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="开启记忆">
              <ScSwitch
                v-model="memoryEnabledSwitch"
                layout="icon"
                size="small"
                active-icon="ri:brain-line"
                inactive-icon="ri:prohibited-2-line"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="manufacturerForm.sysAiManufacturerRemark"
                type="textarea"
                :rows="3"
                placeholder="厂家说明"
              />
            </el-form-item>
          </el-col>

          <template v-if="showXunfeiFields">
            <el-col :span="24">
              <el-form-item label="讯飞 ApiSecret">
                <el-input
                  v-model="manufacturerForm.sysAiManufacturerApiSecret"
                  type="password"
                  show-password
                  placeholder="讯飞 ApiSecret"
                />
              </el-form-item>
            </el-col>
          </template>

          <el-col :span="24">
            <el-collapse v-model="manufacturerAdvancedActive">
              <el-collapse-item title="高级选项" name="advanced">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-form-item label="AppId">
                      <el-input
                        v-model="manufacturerForm.sysAiManufacturerAppId"
                        placeholder="通用 AppId / ClientId / SecretId"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="AppSecret">
                      <el-input
                        v-model="manufacturerForm.sysAiManufacturerAppSecret"
                        type="password"
                        show-password
                        placeholder="通用 AppSecret / SecretKey"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-collapse-item>
            </el-collapse>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitManufacturer">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="moduleDialogVisible"
      :title="moduleEditingId ? '编辑模型' : '添加模型'"
      width="720px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="模型名称">
              <el-input v-model="moduleForm.sysAiModuleName" placeholder="例如 Spark Max / GPT-4o" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型图片">
              <el-input v-model="moduleForm.sysAiModuleImage" placeholder="模型图片 URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型编码">
              <el-input v-model="moduleForm.sysAiModuleCode" placeholder="唯一编码，不填则自动生成" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型ID">
              <el-input v-model="moduleForm.sysAiModuleModelId" placeholder="厂商实际模型ID" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="moduleForm.sysAiModuleType === 'FACE'">
            <el-form-item label="ONNX 本地模型">
              <el-select
                class="full-width"
                placeholder="选择后自动填充模型名称/编码/模型ID"
                @change="applyFaceOnnxPreset"
              >
                <el-option
                  v-for="item in faceOnnxPresetOptions"
                  :key="item.sysAiModuleCode"
                  :label="item.sysAiModuleName"
                  :value="item.sysAiModuleCode"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="模型类型">
              <el-select v-model="moduleForm.sysAiModuleType" class="full-width">
                <el-option
                  v-for="item in moduleTypeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="版本">
              <el-input v-model="moduleForm.sysAiModuleVersion" placeholder="例如 v1 / 2024-10" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="模型地址">
              <el-input v-model="moduleForm.sysAiModuleUrl" placeholder="模型访问地址" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <ScSwitch
                v-model="moduleStatusSwitch"
                layout="icon"
                active-icon="ep:check"
                inactive-icon="ep:close"
                active-text="启用"
                inactive-text="停用"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="moduleForm.sysAiModuleType === 'LLM'">
            <el-form-item label="图片理解">
              <ScSwitch
                v-model="moduleVlmSwitch"
                layout="icon"
                active-icon="ep:check"
                inactive-icon="ep:close"
                active-text="支持"
                inactive-text="关闭"
                :disabled="moduleForm.sysAiModuleType !== 'LLM'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="moduleForm.sysAiModuleType === 'LLM'">
            <el-form-item label="深度思考">
              <ScSwitch
                v-model="moduleThinkSwitch"
                layout="icon"
                active-icon="ri:brain-line"
                inactive-icon="ri:prohibited-2-line"
                :disabled="moduleForm.sysAiModuleType !== 'LLM'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="moduleForm.sysAiModuleType === 'LLM'">
            <el-form-item label="支持优化">
              <ScSwitch
                v-model="moduleOptimizeSwitch"
                layout="icon"
                active-icon="ri:magic-line"
                inactive-icon="ri:prohibited-2-line"
                :disabled="moduleForm.sysAiModuleType !== 'LLM'"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isVisualModule(moduleForm)">
            <el-form-item label="生成上限">
              <el-input v-model.number="moduleForm.sysAiModuleGenerateLimit" type="number" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isVisualModule(moduleForm)">
            <el-form-item label="支持模板">
              <ScSwitch
                v-model="moduleSupportTemplateSwitch"
                layout="icon"
                active-icon="ep:check"
                inactive-icon="ep:close"
                active-text="支持"
                inactive-text="关闭"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="isVisualModule(moduleForm)">
            <el-form-item label="支持样式">
              <ScSwitch
                v-model="moduleSupportStyleSwitch"
                layout="icon"
                active-icon="ep:check"
                inactive-icon="ep:close"
                active-text="支持"
                inactive-text="关闭"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <el-input
                v-model="moduleForm.sysAiModuleRemark"
                type="textarea"
                :rows="3"
                placeholder="模型说明"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序">
              <ScInput v-model="moduleForm.sysAiModuleSort" type="number" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <template #footer>
        <el-button @click="moduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitModule">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="modulePriceDialogVisible"
      :title="modulePriceTarget ? `${modulePriceTarget.sysAiModuleName} 费用配置` : '费用配置'"
      width="560px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="输入费用">
          <ScInput v-model.number="modulePriceForm.sysAiModuleInputPrice" type="number" />
        </el-form-item>
        <el-form-item label="输出费用">
          <ScInput v-model.number="modulePriceForm.sysAiModuleOutputPrice" type="number" />
        </el-form-item>
        <el-form-item label="缓存费用">
          <ScInput v-model.number="modulePriceForm.sysAiModuleCachePrice" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modulePriceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitModulePrice">保存费用</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="moduleConfigDialogVisible"
      :title="moduleConfigTarget ? `${moduleConfigTarget.sysAiModuleName} 配置` : '模型配置'"
      width="720px"
      destroy-on-close
    >
      <div v-if="moduleConfigTarget" class="module-config">
        <div class="module-config__row">
          <span>模型类型</span>
          <strong>{{ getModuleTypeLabel(moduleConfigTarget.sysAiModuleType) }}</strong>
        </div>
        <div class="module-config__row">
          <span>模型ID</span>
          <strong>{{ moduleConfigTarget.sysAiModuleModelId || "-" }}</strong>
        </div>
        <div class="module-config__row">
          <span>深度思考</span>
          <strong>{{ moduleConfigTarget.sysAiModuleSupportThink === 1 ? "已开启" : "未开启" }}</strong>
        </div>
        <div class="module-config__row">
          <span>输入优化</span>
          <strong>{{ moduleConfigTarget.sysAiModuleSupportOptimize === 1 ? "已开启" : "未开启" }}</strong>
        </div>
        <div class="module-config__row">
          <span>输入 / 输出 / 缓存费用</span>
          <strong>
            {{ formatPrice(moduleConfigTarget.sysAiModuleInputPrice) }} /
            {{ formatPrice(moduleConfigTarget.sysAiModuleOutputPrice) }} /
            {{ formatPrice(moduleConfigTarget.sysAiModuleCachePrice) }}
          </strong>
        </div>
        <div class="module-config__row">
          <span>生成上限</span>
          <strong>{{ moduleConfigTarget.sysAiModuleGenerateLimit || 0 }}</strong>
        </div>
        <div class="module-config__row">
          <span>模板 / 样式</span>
          <strong>
            {{ moduleConfigTarget.sysAiModuleSupportTemplate === 1 ? "模板开" : "模板关" }}
            /
            {{ moduleConfigTarget.sysAiModuleSupportStyle === 1 ? "样式开" : "样式关" }}
          </strong>
        </div>
      </div>

      <template #footer>
        <el-button @click="moduleConfigDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <VincentTemplateDialog ref="moduleTemplateDialogRef" />
    <VincentStyleDialog ref="moduleStyleDialogRef" />

    <el-dialog
      v-model="globalDialogVisible"
      title="全局配置"
      width="1440px"
      class="global-config-dialog"
      destroy-on-close
    >
      <div class="global-config-layout">
        <aside class="global-config-layout__summary">
          <div class="global-config-layout__summary-head">
            <strong>当前激活参数</strong>
            <p>左侧实时显示将被保存的关键运行时参数。</p>
          </div>
          <div class="global-config-layout__summary-list">
            <div
              v-for="item in runtimeActiveParams"
              :key="item.label"
              class="global-config-layout__summary-item"
            >
              <span>{{ item.label }}</span>
              <el-tag size="small" effect="plain" round>{{ item.value }}</el-tag>
            </div>
          </div>
        </aside>

        <div class="global-config">
          <div class="global-config__toolbar">
            <div>
              <strong>聊天运行时配置</strong>
              <p>这里只配置后端 `ChatClientSettingsResolver` 实际会读取的 runtime 字段。</p>
            </div>
          </div>

          <div class="global-config__section">
            <div class="global-config__section-head">
              <strong>运行开关</strong>
              <small>决定聊天主链路是否启用以及是否开启输入优化、上下文压缩。</small>
            </div>
            <div class="global-config__form-grid">
              <div class="global-config__field global-config__field--switch">
                <label>启用聊天能力</label>
                <ScSwitch
                  v-model="runtimeForm.enabled"
                  layout="icon"
                  active-icon="ep:check"
                  inactive-icon="ep:close"
                  active-text="开"
                  inactive-text="关"
                />
              </div>
              <div class="global-config__field global-config__field--switch">
                <label>AppKey 校验</label>
                <ScSwitch
                  v-model="runtimeForm.appKeyEnabled"
                  layout="icon"
                  active-icon="ep:check"
                  inactive-icon="ep:close"
                  active-text="开"
                  inactive-text="关"
                />
              </div>
              <div class="global-config__field global-config__field--switch">
                <label>输入优化</label>
                <ScSwitch
                  v-model="runtimeForm.inputOptimizationEnabled"
                  layout="icon"
                  active-icon="ep:check"
                  inactive-icon="ep:close"
                  active-text="开"
                  inactive-text="关"
                />
              </div>
              <div class="global-config__field global-config__field--switch">
                <label>上下文压缩</label>
                <ScSwitch
                  v-model="runtimeForm.contextCompressionEnabled"
                  layout="icon"
                  active-icon="ep:check"
                  inactive-icon="ep:close"
                  active-text="开"
                  inactive-text="关"
                />
              </div>
            </div>
          </div>

          <div class="global-config__section">
            <div class="global-config__section-head">
              <strong>运行时模型</strong>
              <small>选择一个已配置模型作为当前运行时默认模型。</small>
            </div>
            <div class="global-config__form-grid">
              <div class="global-config__field global-config__field--full">
                <label>默认模型</label>
                <el-select
                  v-model="runtimeForm.defaultModel"
                  class="full-width"
                  filterable
                  placeholder="选择已配置模型"
                >
                  <el-option
                    v-for="item in runtimeModelOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>
            </div>
          </div>

          <div class="global-config__section">
            <div class="global-config__section-head">
              <strong>推理参数</strong>
              <small>控制默认温度、最大输出长度和超时时间。</small>
            </div>
            <div class="global-config__form-grid">
              <div class="global-config__field">
                <label>Temperature</label>
                <el-input v-model="runtimeForm.temperature" placeholder="例如 0.7" />
              </div>
              <div class="global-config__field">
                <label>Max Tokens</label>
                <el-input v-model="runtimeForm.maxTokens" placeholder="例如 4096" />
              </div>
              <div class="global-config__field">
                <label>Timeout (ms)</label>
                <el-input v-model="runtimeForm.timeoutMillis" placeholder="例如 30000" />
              </div>
              <div class="global-config__field global-config__field--full">
                <label>System Prompt</label>
                <el-input v-model="runtimeForm.systemPrompt" type="textarea" :rows="3" placeholder="默认系统提示词" />
              </div>
            </div>
          </div>

          <div class="global-config__section">
            <div class="global-config__section-head">
              <strong>上下文压缩参数</strong>
              <small>只有开启上下文压缩后，这两个值才会生效。</small>
            </div>
            <div class="global-config__form-grid">
              <div class="global-config__field">
                <label>压缩阈值</label>
                <el-input v-model="runtimeForm.contextCompressionThreshold" placeholder="例如 12" />
              </div>
              <div class="global-config__field">
                <label>保留消息数</label>
                <el-input v-model="runtimeForm.contextCompressionRetainMessages" placeholder="例如 6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="globalDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveGlobalConfig">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
const VincentTemplateDialog = defineAsyncComponent(() => import("../vincent-template.vue"));
const VincentStyleDialog = defineAsyncComponent(() => import("../vincent-style.vue"));
import { computed, defineAsyncComponent, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  ElBadge,
  ElButton,
  ElCol,
  ElCollapse,
  ElCollapseItem,
  ElDialog,
  ElDrawer,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessageBox,
  ElPagination,
  ElRow,
  ElSelect,
  ElSkeleton,
  ElTag,
  ElTooltip,
  ElUpload,
} from "element-plus";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@repo/utils";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import ScInput from "@repo/components/ScInput/index.vue";
import {
  listAiManufacturers,
  saveAiManufacturer,
  type AiManufacturer,
  updateAiManufacturer,
  updateAiManufacturerModelPrices,
  replaceAiManufacturerModels,
  uploadAiManufacturerLogo,
  listAiManufacturerFactories,
  deleteAiManufacturer,
} from "../../../api/ai/manufacturer";
import {
  deleteAiModule,
  listAiModules,
  saveAiModule,
  type AiModule,
  updateAiModule,
} from "../../../api/ai/module";
import {
  listAiGlobalSettings,
  replaceAiGlobalSettings,
  type SysAiGlobalSetting,
} from "../../../api/ai/global-setting";

const loading = ref(false);
const router = useRouter();
const manufacturers = ref<AiManufacturer[]>([]);
const currentPage = ref(1);
const pageSize = 12;
const dialogVisible = ref(false);
const editingId = ref<number | null>(null);
const panelVisible = ref(false);
const selectedManufacturer = ref<AiManufacturer | null>(null);
const allModules = ref<AiModule[]>([]);
const manufacturerModules = ref<AiModule[]>([]);
const moduleDialogVisible = ref(false);
const moduleEditingId = ref<number | null>(null);
const modulePriceDialogVisible = ref(false);
const modulePriceTarget = ref<AiModule | null>(null);
const moduleConfigDialogVisible = ref(false);
const moduleConfigTarget = ref<AiModule | null>(null);
const moduleTemplateDialogRef = ref<any>(null);
const moduleStyleDialogRef = ref<any>(null);
const globalDialogVisible = ref(false);
const globalDefaultModelCode = ref("");
const logoUploading = ref(false);
const factoryOptions = ref<Array<{ label: string; value: string }>>([]);
const moduleStatusSwitch = ref(true);
const moduleVlmSwitch = ref(false);
const moduleThinkSwitch = ref(false);
const moduleOptimizeSwitch = ref(false);
const moduleSupportTemplateSwitch = ref(false);
const moduleSupportStyleSwitch = ref(false);
const moduleTypeOptions = [
  { label: "大语言模型", value: "LLM" },
  { label: "文生图", value: "IMAGE" },
  { label: "文生视频", value: "VIDEO" },
  { label: "文生音频", value: "AUDIO" },
  { label: "人脸检测", value: "FACE_DETECT" },
  { label: "人脸增强", value: "FACE" },
  { label: "人脸比对", value: "FACE_COMPARE" },
  { label: "特征提取", value: "FACE_FEATURE" },
  { label: "图像特征", value: "IMAGE_FEATURE" },
  { label: "文本特征", value: "TEXT_FEATURE" },
  { label: "图像上色", value: "COLORIZATION" },
  { label: "分辨率增强", value: "RESOLUTION" },
  { label: "抠图", value: "MATTING" },
  { label: "OCR识别", value: "OCR" },
  { label: "图像分类", value: "CLASSIFICATION" },
  { label: "行人重识别", value: "REID" },
];
const defaultFactoryOptions = [
  { value: "local", label: "本地" },
  { value: "ollma", label: "Ollma" },
];
const faceOnnxPresetOptions: Pick<
  AiModule,
  "sysAiModuleName" | "sysAiModuleCode" | "sysAiModuleModelId" | "sysAiModuleType"
>[] = [
  {
    sysAiModuleName: "ONNX 本地人脸增强（GFPGAN）",
    sysAiModuleCode: "local-onnx-face-enhance",
    sysAiModuleModelId: "gfpgan",
    sysAiModuleType: "FACE",
  },
  {
    sysAiModuleName: "ONNX 人脸检测（RETINA_FACE_640_ONNX）",
    sysAiModuleCode: "local-onnx-face-retina-640",
    sysAiModuleModelId: "RETINA_FACE_640_ONNX",
    sysAiModuleType: "FACE_DETECT",
  },
  {
    sysAiModuleName: "ONNX 人脸检测（RETINA_FACE_1080_720_ONNX）",
    sysAiModuleCode: "local-onnx-face-retina-1080x720",
    sysAiModuleModelId: "RETINA_FACE_1080_720_ONNX",
    sysAiModuleType: "FACE_DETECT",
  },
  {
    sysAiModuleName: "ONNX 人脸检测（ULTRA_LIGHT_FAST_GENERIC_FACE）",
    sysAiModuleCode: "local-onnx-face-ultralight",
    sysAiModuleModelId: "ULTRA_LIGHT_FAST_GENERIC_FACE",
    sysAiModuleType: "FACE_DETECT",
  },
  {
    sysAiModuleName: "ONNX 人脸检测（YOLOV5_FACE_320）",
    sysAiModuleCode: "local-onnx-face-yolov5-320",
    sysAiModuleModelId: "YOLOV5_FACE_320",
    sysAiModuleType: "FACE_DETECT",
  },
  {
    sysAiModuleName: "ONNX 人脸检测（YOLOV5_FACE_640）",
    sysAiModuleCode: "local-onnx-face-yolov5-640",
    sysAiModuleModelId: "YOLOV5_FACE_640",
    sysAiModuleType: "FACE_DETECT",
  },
];
const runtimeForm = reactive({
  enabled: true,
  appKeyEnabled: false,
  factory: "default",
  provider: "openai",
  defaultModel: "",
  systemPrompt: "",
  temperature: "0.7",
  maxTokens: "4096",
  timeoutMillis: "30000",
  providerBaseUrl: "",
  providerAppId: "",
  providerApiKey: "",
  providerAppSecret: "",
  inputOptimizationEnabled: false,
  contextCompressionEnabled: false,
  contextCompressionThreshold: "12",
  contextCompressionRetainMessages: "6",
});

const manufacturerForm = reactive<AiManufacturer>({
  sysAiManufacturerCode: "",
  sysAiManufacturerName: "",
  sysAiManufacturerFactory: "",
  sysAiManufacturerIcon: "",
  sysAiManufacturerLogo: "",
  sysAiManufacturerWebsite: "",
  sysAiManufacturerAppKey: "",
  sysAiManufacturerAppSecret: "",
  sysAiManufacturerBaseUrl: "",
  sysAiManufacturerOpenaiCompatible: 0,
  sysAiManufacturerAppId: "",
  sysAiManufacturerApiSecret: "",
  sysAiManufacturerApiVersion: "",
  sysAiManufacturerApiDomain: "",
  sysAiManufacturerMemoryEnabled: 0,
  sysAiManufacturerRemark: "",
  sysAiManufacturerStatus: 1,
  sysAiManufacturerSort: 0,
});

const moduleForm = reactive<AiModule>({
  sysAiModuleName: "",
  sysAiModuleCode: "",
  sysAiModuleModelId: "",
  sysAiModuleImage: "",
  sysAiModuleType: "LLM",
  sysAiModuleVendor: "",
  sysAiModuleManufacturers: "",
  sysAiModuleUrl: "",
  sysAiModuleVersion: "v1",
  sysAiModuleStatus: 1,
  sysAiModuleSort: 0,
  sysAiModuleVlm: 0,
  sysAiModuleSupportThink: 0,
  sysAiModuleSupportOptimize: 0,
  sysAiModuleLocal: 0,
  sysAiModuleInputPrice: 0,
  sysAiModuleOutputPrice: 0,
  sysAiModuleCachePrice: 0,
  sysAiModuleGenerateLimit: 0,
  sysAiModuleSupportTemplate: 0,
  sysAiModuleSupportStyle: 0,
  sysAiModuleRemark: "",
});

const modulePriceForm = reactive({
  sysAiModuleInputPrice: 0,
  sysAiModuleOutputPrice: 0,
  sysAiModuleCachePrice: 0,
});

const openaiCompatibleSwitch = ref(false);
const claudeCompatibleSwitch = ref(false);
const memoryEnabledSwitch = ref(false);
const manufacturerAdvancedActive = ref<string[]>([]);
const manufacturerFormRef = ref<FormInstance>();
const manufacturerRules = reactive<FormRules>({
  sysAiManufacturerName: [{ required: true, message: "请填写厂家名称", trigger: "blur" }],
  sysAiManufacturerFactory: [{ required: true, message: "请选择提供商", trigger: "change" }],
  sysAiManufacturerBaseUrl: [{ required: true, message: "请填写 Base URL", trigger: "blur" }],
  sysAiManufacturerAppKey: [{ required: true, message: "请填写 AppKey", trigger: "blur" }],
});

const pagedManufacturers = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return manufacturers.value.slice(start, start + pageSize);
});

const runtimeModelOptions = computed(() =>
  allModules.value
    .filter((item) => item.sysAiModuleType === "LLM")
    .map((item) => ({
    value: item.sysAiModuleCode,
    label: `${item.sysAiModuleName} (${item.sysAiModuleCode})`,
  })),
);

const runtimeSelectedModule = computed(() =>
  allModules.value.find((item) => item.sysAiModuleCode === runtimeForm.defaultModel),
);

const runtimeSelectedManufacturer = computed(() => {
  const vendor = runtimeSelectedModule.value?.sysAiModuleVendor || runtimeSelectedModule.value?.sysAiModuleManufacturers;
  if (!vendor) {
    return null;
  }
  return manufacturers.value.find((item) => item.sysAiManufacturerCode === vendor) || null;
});

const runtimeActiveParams = computed(() => {
  const module = runtimeSelectedModule.value;
  const manufacturer = runtimeSelectedManufacturer.value;
  const moduleVendorCode = module?.sysAiModuleVendor || module?.sysAiModuleManufacturers || "";

  return [
    { label: "默认模型", value: module?.sysAiModuleName || runtimeForm.defaultModel || "-" },
    {
      label: "提供商",
      value: manufacturer?.sysAiManufacturerFactory || moduleVendorCode || runtimeForm.provider || "-",
    },
    {
      label: "所属厂家",
      value: manufacturer?.sysAiManufacturerName || moduleVendorCode || "-",
    },
    {
      label: "模型地址",
      value: module?.sysAiModuleUrl || manufacturer?.sysAiManufacturerBaseUrl || runtimeForm.providerBaseUrl || "-",
    },
    { label: "运行状态", value: runtimeForm.enabled ? "启用" : "停用" },
    { label: "AppKey 校验", value: runtimeForm.appKeyEnabled ? "开启" : "关闭" },
    { label: "输入优化", value: runtimeForm.inputOptimizationEnabled ? "开启" : "关闭" },
    { label: "上下文压缩", value: runtimeForm.contextCompressionEnabled ? "开启" : "关闭" },
    { label: "Temperature", value: runtimeForm.temperature || "-" },
    { label: "Max Tokens", value: runtimeForm.maxTokens || "-" },
    { label: "Timeout(ms)", value: runtimeForm.timeoutMillis || "-" },
  ];
});

const dialogTitle = computed(() =>
  editingId.value ? "编辑厂家" : "添加厂家",
);

const showXunfeiFields = computed(
  () => (manufacturerForm.sysAiManufacturerFactory || "").toLowerCase() === "xunfei",
);

watch(openaiCompatibleSwitch, (value) => {
  manufacturerForm.sysAiManufacturerOpenaiCompatible = value ? 1 : 0;
});

watch(claudeCompatibleSwitch, (value) => {
  manufacturerForm.sysAiManufacturerClaudeCompatible = value ? 1 : 0;
});

watch(memoryEnabledSwitch, (value) => {
  manufacturerForm.sysAiManufacturerMemoryEnabled = value ? 1 : 0;
});

const toCode = (value: string) =>
  value
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildManufacturerCode = () => {
  const fromFactory = toCode(manufacturerForm.sysAiManufacturerFactory || "");
  const fromWebsite = toCode(manufacturerForm.sysAiManufacturerWebsite || "");
  const fromName = toCode(manufacturerForm.sysAiManufacturerName || "");
  return fromFactory || fromWebsite || fromName || `manufacturer-${Date.now()}`;
};

const resetForm = () => {
  editingId.value = null;
  Object.assign(manufacturerForm, {
    sysAiManufacturerId: undefined,
    sysAiManufacturerCode: "",
    sysAiManufacturerName: "",
    sysAiManufacturerFactory: "",
    sysAiManufacturerIcon: "",
    sysAiManufacturerLogo: "",
    sysAiManufacturerWebsite: "",
    sysAiManufacturerAppKey: "",
    sysAiManufacturerAppSecret: "",
    sysAiManufacturerBaseUrl: "",
    sysAiManufacturerOpenaiCompatible: 1,
    sysAiManufacturerAppId: "",
    sysAiManufacturerApiSecret: "",
    sysAiManufacturerApiVersion: "",
    sysAiManufacturerApiDomain: "",
    sysAiManufacturerMemoryEnabled: 0,
    sysAiManufacturerRemark: "",
    sysAiManufacturerStatus: 1,
    sysAiManufacturerSort: 0,
  });
  manufacturerAdvancedActive.value = [];
  openaiCompatibleSwitch.value = true;
  claudeCompatibleSwitch.value = false;
  memoryEnabledSwitch.value = false;
};

const openCreateDialog = () => {
  resetForm();
  dialogVisible.value = true;
  manufacturerFormRef.value?.clearValidate();
};

const resetModuleForm = () => {
  moduleEditingId.value = null;
  Object.assign(moduleForm, {
    sysAiModuleId: undefined,
    sysAiModuleName: "",
    sysAiModuleCode: "",
    sysAiModuleModelId: "",
    sysAiModuleImage: "",
    sysAiModuleType: "LLM",
    sysAiModuleVendor: selectedManufacturer.value?.sysAiManufacturerCode || "",
    sysAiModuleManufacturers: selectedManufacturer.value?.sysAiManufacturerCode || "",
    sysAiModuleUrl: selectedManufacturer.value?.sysAiManufacturerBaseUrl || "",
    sysAiModuleVersion: "v1",
    sysAiModuleStatus: 1,
    sysAiModuleSort: 0,
    sysAiModuleVlm: 0,
    sysAiModuleSupportThink: 0,
    sysAiModuleSupportOptimize: 0,
    sysAiModuleLocal: 0,
    sysAiModuleInputPrice: 0,
    sysAiModuleOutputPrice: 0,
    sysAiModuleCachePrice: 0,
    sysAiModuleGenerateLimit: 0,
    sysAiModuleSupportTemplate: 0,
    sysAiModuleSupportStyle: 0,
    sysAiModuleRemark: "",
  });
  moduleStatusSwitch.value = true;
  moduleVlmSwitch.value = false;
  moduleThinkSwitch.value = false;
  moduleOptimizeSwitch.value = false;
  moduleSupportTemplateSwitch.value = false;
  moduleSupportStyleSwitch.value = false;
};

const openEditDialog = (item: AiManufacturer) => {
  editingId.value = item.sysAiManufacturerId || null;
  Object.assign(manufacturerForm, {
    ...item,
    sysAiManufacturerFactory: item.sysAiManufacturerFactory || "",
    sysAiManufacturerMemoryEnabled: item.sysAiManufacturerMemoryEnabled ?? 0,
    sysAiManufacturerRemark: item.sysAiManufacturerRemark ?? "",
    sysAiManufacturerAppId: item.sysAiManufacturerAppId ?? "",
    sysAiManufacturerAppSecret: item.sysAiManufacturerAppSecret ?? "",
  });
  openaiCompatibleSwitch.value = item.sysAiManufacturerOpenaiCompatible === 1;
  claudeCompatibleSwitch.value = item.sysAiManufacturerClaudeCompatible === 1;
  memoryEnabledSwitch.value = item.sysAiManufacturerMemoryEnabled === 1;
  manufacturerAdvancedActive.value = [];
  dialogVisible.value = true;
  manufacturerFormRef.value?.clearValidate();
};

const handleLogoUpload = async (options: { file: File }) => {
  logoUploading.value = true;
  try {
    const res = await uploadAiManufacturerLogo(options.file);
    if (res.data) {
      manufacturerForm.sysAiManufacturerLogo = res.data;
      message("Logo 已上传", { type: "success" });
    }
  } finally {
    logoUploading.value = false;
  }
};

const reloadPage = async () => {
  loading.value = true;
  try {
    const res = await listAiManufacturers();
    manufacturers.value = res.data || [];
    const maxPage = Math.max(
      1,
      Math.ceil(manufacturers.value.length / pageSize),
    );
    if (currentPage.value > maxPage) {
      currentPage.value = maxPage;
    }
  } finally {
    loading.value = false;
  }
};

const reloadManufacturerModules = async () => {
  if (!selectedManufacturer.value?.sysAiManufacturerCode) {
    manufacturerModules.value = [];
    return;
  }
  const res = await listAiModules(undefined, selectedManufacturer.value.sysAiManufacturerCode);
  manufacturerModules.value = res.data || [];
};

const syncModelPrices = async () => {
  if (!selectedManufacturer.value?.sysAiManufacturerCode) {
    return;
  }
  const code = selectedManufacturer.value.sysAiManufacturerCode;
  try {
    const res = await updateAiManufacturerModelPrices(code);
    const count = res.data || 0;
    message(`价格同步完成，已更新 ${count} 个模型`, { type: "success" });
    await reloadManufacturerModules();
  } catch (e) {
    message("价格同步失败: " + (e.message || e), { type: "error" });
  }
};

const handleReplaceModels = async () => {
  if (!selectedManufacturer.value?.sysAiManufacturerCode) {
    return;
  }
  const code = selectedManufacturer.value.sysAiManufacturerCode;
  try {
    const res = await replaceAiManufacturerModels(code);
    const count = res.data || 0;
    message(`模型同步完成，已新增 ${count} 个模型`, { type: "success" });
    await reloadManufacturerModules();
  } catch (e) {
    message("模型同步失败: " + (e.message || e), { type: "error" });
  }
};

const loadFactories = async () => {
  const res = await listAiManufacturerFactories();
  const backendOptions = (res.data || []).map((item) => ({
    value: item,
    label: getFactoryLabel(item),
  }));
  const mergedOptions = [...defaultFactoryOptions, ...backendOptions];
  const optionMap = new Map<string, { value: string; label: string }>();
  for (const item of mergedOptions) {
    if (!optionMap.has(item.value)) {
      optionMap.set(item.value, item);
    }
  }
  factoryOptions.value = Array.from(optionMap.values());
};

const getFactoryLabel = (value: string) => {
  const key = (value || "").trim().toLowerCase();
  const labels: Record<string, string> = {
    openai: "OpenAI",
    siliconflow: "硅基流动",
    zhipu: "智谱 AI",
    xunfei: "讯飞星火",
    qwen: "通义千问",
    moonshot: "月之暗面",
    deepseek: "DeepSeek",
    baidu: "百度文心",
    kimi: "Kimi",
    anthropic: "Anthropic",
    gemini: "Google Gemini",
    local: "本地",
    ollma: "Ollma",
  };
  return labels[key] || value;
};

const applyFaceOnnxPreset = (moduleCode: string) => {
  const preset = faceOnnxPresetOptions.find((item) => item.sysAiModuleCode === moduleCode);
  if (!preset) {
    return;
  }
  moduleForm.sysAiModuleType = preset.sysAiModuleType || "FACE";
  moduleForm.sysAiModuleName = preset.sysAiModuleName || moduleForm.sysAiModuleName;
  moduleForm.sysAiModuleCode = preset.sysAiModuleCode || moduleForm.sysAiModuleCode;
  moduleForm.sysAiModuleModelId = preset.sysAiModuleModelId || moduleForm.sysAiModuleModelId;
};

const resolveModuleImage = (item?: AiModule) => {
  if (!item) {
    return "";
  }
  const moduleManufacturer =
    manufacturers.value.find(
      (manufacturer) =>
        manufacturer.sysAiManufacturerCode ===
        (item.sysAiModuleVendor || item.sysAiModuleManufacturers),
    ) || selectedManufacturer.value;

  return (
    item.sysAiModuleImage ||
    moduleManufacturer?.sysAiManufacturerLogo ||
    moduleManufacturer?.sysAiManufacturerIcon ||
    ""
  );
};

const getModuleImageFallback = (item?: AiModule) =>
  (item?.sysAiModuleName || item?.sysAiModuleCode || "AI").trim().charAt(0).toUpperCase();

const loadAllModules = async () => {
  const res = await listAiModules();
  allModules.value = res.data || [];
};

const loadRuntimeDefaultModel = async () => {
  const res = await listAiGlobalSettings("runtime");
  const match = (res.data || []).find((item) => item.sysAiGlobalSettingField === "default_model");
  globalDefaultModelCode.value = (match?.sysAiGlobalSettingValue || "").trim();
};

const submitManufacturer = async () => {
  const valid = await manufacturerFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  if (!manufacturerForm.sysAiManufacturerName?.trim()) {
    message("请先填写厂家名称", { type: "warning" });
    return;
  }

  if (!manufacturerForm.sysAiManufacturerFactory?.trim()) {
    message("请先选择提供商", { type: "warning" });
    return;
  }

  if (!manufacturerForm.sysAiManufacturerCode) {
    manufacturerForm.sysAiManufacturerCode = buildManufacturerCode();
  }

  manufacturerForm.sysAiManufacturerOpenaiCompatible =
    openaiCompatibleSwitch.value ? 1 : 0;
  manufacturerForm.sysAiManufacturerClaudeCompatible =
    claudeCompatibleSwitch.value ? 1 : 0;
  manufacturerForm.sysAiManufacturerMemoryEnabled =
    memoryEnabledSwitch.value ? 1 : 0;
  // 允许清空备注/高级字段：将 null/undefined 显式归一为 ""
  manufacturerForm.sysAiManufacturerRemark = manufacturerForm.sysAiManufacturerRemark ?? "";
  manufacturerForm.sysAiManufacturerAppId = manufacturerForm.sysAiManufacturerAppId ?? "";
  manufacturerForm.sysAiManufacturerAppSecret =
    manufacturerForm.sysAiManufacturerAppSecret ?? "";

  if (editingId.value) {
    await updateAiManufacturer(manufacturerForm);
    message("厂家已更新", { type: "success" });
  } else {
    await saveAiManufacturer(manufacturerForm);
    message("厂家已创建", { type: "success" });
  }

  dialogVisible.value = false;
  await reloadPage();
};

const openManufacturerPanel = async (item: AiManufacturer) => {
  selectedManufacturer.value = item;
  panelVisible.value = true;
  await Promise.all([reloadManufacturerModules(), loadRuntimeDefaultModel()]);
};

const openModuleDialog = (item?: AiModule) => {
  if (!selectedManufacturer.value) {
    return;
  }
  if (!item) {
    resetModuleForm();
    moduleDialogVisible.value = true;
    return;
  }
  moduleEditingId.value = item.sysAiModuleId || null;
  Object.assign(moduleForm, { ...item });
  moduleStatusSwitch.value = item.sysAiModuleStatus === 1;
  moduleVlmSwitch.value = item.sysAiModuleVlm === 1;
  moduleThinkSwitch.value = item.sysAiModuleSupportThink === 1;
  moduleOptimizeSwitch.value = item.sysAiModuleSupportOptimize === 1;
  moduleSupportTemplateSwitch.value = item.sysAiModuleSupportTemplate === 1;
  moduleSupportStyleSwitch.value = item.sysAiModuleSupportStyle === 1;
  moduleDialogVisible.value = true;
};

const openModulePriceDialog = (item: AiModule) => {
  modulePriceTarget.value = item;
  modulePriceForm.sysAiModuleInputPrice = Number(item.sysAiModuleInputPrice || 0);
  modulePriceForm.sysAiModuleOutputPrice = Number(item.sysAiModuleOutputPrice || 0);
  modulePriceForm.sysAiModuleCachePrice = Number(item.sysAiModuleCachePrice || 0);
  modulePriceDialogVisible.value = true;
};

const openModuleConfigDialog = (item: AiModule) => {
  moduleConfigTarget.value = item;
  moduleConfigDialogVisible.value = true;
};

const openModuleFeatureDialog = (item: AiModule, kind: "template" | "style") => {
  const supportField =
    kind === "template" ? item.sysAiModuleSupportTemplate : item.sysAiModuleSupportStyle;
  if (supportField !== 1) {
    message(`请先在模型里开启${kind === "template" ? "模板" : "样式"}支持`, {
      type: "warning",
    });
    return;
  }
  if (kind === "template") {
    moduleTemplateDialogRef.value?.handleOpen?.(item, "edit");
    return;
  }
  if (kind === "style") {
    moduleStyleDialogRef.value?.handleOpen?.(item, "edit");
    return;
  }
  openModuleConfigDialog(item);
};

const submitModule = async () => {
  if (!selectedManufacturer.value?.sysAiManufacturerCode) {
    message("请先选择厂家", { type: "warning" });
    return;
  }
  if (!moduleForm.sysAiModuleName?.trim()) {
    message("请先填写模型名称", { type: "warning" });
    return;
  }
  if (!moduleForm.sysAiModuleModelId?.trim()) {
    message("请先填写模型ID", { type: "warning" });
    return;
  }
  if (!moduleForm.sysAiModuleCode?.trim()) {
    moduleForm.sysAiModuleCode = `${selectedManufacturer.value.sysAiManufacturerCode}-${Date.now()}`;
  }
  if (!moduleForm.sysAiModuleType?.trim()) {
    message("请先选择模型类型", { type: "warning" });
    return;
  }
  moduleForm.sysAiModuleVendor = selectedManufacturer.value.sysAiManufacturerCode;
  moduleForm.sysAiModuleManufacturers = selectedManufacturer.value.sysAiManufacturerCode;
  moduleForm.sysAiModuleStatus = moduleStatusSwitch.value ? 1 : 0;
  moduleForm.sysAiModuleVlm =
    moduleForm.sysAiModuleType === "LLM" && moduleVlmSwitch.value ? 1 : 0;
  moduleForm.sysAiModuleSupportThink =
    moduleForm.sysAiModuleType === "LLM" && moduleThinkSwitch.value ? 1 : 0;
  moduleForm.sysAiModuleSupportOptimize =
    moduleForm.sysAiModuleType === "LLM" && moduleOptimizeSwitch.value ? 1 : 0;
  moduleForm.sysAiModuleSupportTemplate = moduleSupportTemplateSwitch.value ? 1 : 0;
  moduleForm.sysAiModuleSupportStyle = moduleSupportStyleSwitch.value ? 1 : 0;

  if (moduleEditingId.value) {
    await updateAiModule(moduleForm);
    message("模型已更新", { type: "success" });
  } else {
    await saveAiModule(moduleForm);
    message("模型已创建", { type: "success" });
  }

  moduleDialogVisible.value = false;
  await Promise.all([reloadManufacturerModules(), reloadPage()]);
};

const submitModulePrice = async () => {
  if (!modulePriceTarget.value) {
    return;
  }
  const payload: AiModule = {
    ...modulePriceTarget.value,
    sysAiModuleInputPrice: Number(modulePriceForm.sysAiModuleInputPrice || 0),
    sysAiModuleOutputPrice: Number(modulePriceForm.sysAiModuleOutputPrice || 0),
    sysAiModuleCachePrice: Number(modulePriceForm.sysAiModuleCachePrice || 0),
  };
  await updateAiModule(payload);

  // 就地更新当前列表数据，避免整页重查
  modulePriceTarget.value.sysAiModuleInputPrice = payload.sysAiModuleInputPrice;
  modulePriceTarget.value.sysAiModuleOutputPrice = payload.sysAiModuleOutputPrice;
  modulePriceTarget.value.sysAiModuleCachePrice = payload.sysAiModuleCachePrice;

  const allModule = allModules.value.find(
    (it) => it.sysAiModuleId === modulePriceTarget.value?.sysAiModuleId,
  );
  if (allModule) {
    allModule.sysAiModuleInputPrice = payload.sysAiModuleInputPrice;
    allModule.sysAiModuleOutputPrice = payload.sysAiModuleOutputPrice;
    allModule.sysAiModuleCachePrice = payload.sysAiModuleCachePrice;
  }

  message("模型费用已更新", { type: "success" });
  modulePriceDialogVisible.value = false;
};

const toggleManufacturerStatus = async (item: AiManufacturer) => {
  const nextStatus = item.sysAiManufacturerStatus === 1 ? 0 : 1;
  await updateAiManufacturer({
    ...item,
    sysAiManufacturerStatus: nextStatus,
  });

  // 就地更新，避免整页重载导致卡片闪烁
  item.sysAiManufacturerStatus = nextStatus;
  if (
    selectedManufacturer.value &&
    selectedManufacturer.value.sysAiManufacturerCode === item.sysAiManufacturerCode
  ) {
    selectedManufacturer.value.sysAiManufacturerStatus = nextStatus;
  }

  message(nextStatus === 1 ? "厂家已启用" : "厂家已停用", {
    type: "success",
  });
};

const removeManufacturer = async (item: AiManufacturer) => {
  if (!item.sysAiManufacturerId) {
    return;
  }
  await ElMessageBox.confirm(
    `确认删除厂家「${item.sysAiManufacturerName}」吗？`,
    "删除确认",
    {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    },
  );
  await deleteAiManufacturer(item.sysAiManufacturerId);
  message("厂家已删除", { type: "success" });
  await reloadPage();
};

const removeModule = async (item: AiModule) => {
  if (!item.sysAiModuleId) {
    return;
  }
  await ElMessageBox.confirm(
    `确认删除模型「${item.sysAiModuleName}」吗？`,
    "删除确认",
    {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    },
  );
  await deleteAiModule(item.sysAiModuleId);
  message("模型已删除", { type: "success" });
  await reloadManufacturerModules();
};

const setModuleAsGlobal = async (item: AiModule) => {
  if (item.sysAiModuleType !== "LLM") {
    message("仅大语言模型支持设为全局默认模型", { type: "warning" });
    return;
  }
  if (!item.sysAiModuleCode) {
    message("当前模型缺少模型编码，无法设为全局", { type: "warning" });
    return;
  }
  const manufacturerCode = item.sysAiModuleVendor || item.sysAiModuleManufacturers;
  const targetManufacturer =
    manufacturers.value.find((entry) => entry.sysAiManufacturerCode === manufacturerCode) ||
    selectedManufacturer.value;

  const res = await listAiGlobalSettings("runtime");
  const rows = [...(res.data || [])];
  const fieldMap = new Map(rows.map((entry) => [entry.sysAiGlobalSettingField, entry]));

  const upsert = (
    field: string,
    value: string,
    valueType: SysAiGlobalSetting["sysAiGlobalSettingValueType"],
    description: string,
    sort: number,
  ) => {
    if (!value) {
      return;
    }
    const existing = fieldMap.get(field);
    if (existing) {
      existing.sysAiGlobalSettingValue = value;
      existing.sysAiGlobalSettingValueType = valueType;
      existing.sysAiGlobalSettingDescription = description;
      existing.sysAiGlobalSettingSort = existing.sysAiGlobalSettingSort ?? sort;
      return;
    }
    const created: SysAiGlobalSetting = {
      sysAiGlobalSettingField: field,
      sysAiGlobalSettingValue: value,
      sysAiGlobalSettingValueType: valueType,
      sysAiGlobalSettingDescription: description,
      sysAiGlobalSettingSort: sort,
    };
    rows.push(created);
    fieldMap.set(field, created);
  };

  upsert("default_model", item.sysAiModuleCode.trim(), "STRING", "默认聊天模型编码", 10);
  upsert("provider_base_url", (item.sysAiModuleUrl || targetManufacturer?.sysAiManufacturerBaseUrl || "").trim(), "STRING", "LLM 提供商基础地址", 70);
  upsert("factory", (targetManufacturer?.sysAiManufacturerFactory || "").trim(), "STRING", "ChatClient SPI 工厂名称", 8);
  upsert("provider", (targetManufacturer?.sysAiManufacturerFactory || "").trim(), "STRING", "默认 LLM 提供商", 9);
  upsert("provider_app_id", (targetManufacturer?.sysAiManufacturerAppId || "").trim(), "STRING", "厂商 AppId", 75);
  upsert("provider_api_key", (targetManufacturer?.sysAiManufacturerAppKey || "").trim(), "SECRET", "厂商 API Key / AppKey", 80);
  upsert("provider_app_secret", (targetManufacturer?.sysAiManufacturerAppSecret || "").trim(), "SECRET", "厂商 AppSecret / SecretKey", 85);

  await replaceAiGlobalSettings(rows, "runtime");
  runtimeForm.defaultModel = item.sysAiModuleCode;
  globalDefaultModelCode.value = item.sysAiModuleCode;
  message(`已将「${item.sysAiModuleName || item.sysAiModuleCode}」设为全局默认模型`, { type: "success" });
};

const isGlobalModule = (item: AiModule) =>
  !!item.sysAiModuleCode && item.sysAiModuleCode === globalDefaultModelCode.value;

const getManufacturerInitial = (name?: string) => {
  const value = (name || "").trim();
  if (!value) {
    return "AI";
  }
  return value.slice(0, 1).toUpperCase();
};

const getManufacturerColor = (key?: string) => {
  const value = String(key || "").trim() || "manufacturer";
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  const hue = hash % 360;
  return `hsl(${hue} 72% 86%)`;
};

const openGlobalConfig = () => {
  globalDialogVisible.value = true;
  loadGlobalConfig();
};

const loadGlobalConfig = async () => {
  await Promise.all([loadAllModules(), manufacturers.value.length ? Promise.resolve() : reloadPage()]);
  const res = await listAiGlobalSettings("runtime");
  const map = new Map((res.data || []).map((item) => [item.sysAiGlobalSettingField, item.sysAiGlobalSettingValue || ""]));
  runtimeForm.enabled = map.get("enabled") !== "false";
  runtimeForm.appKeyEnabled = map.get("app_key_enabled") === "true";
  runtimeForm.factory = map.get("factory") || "default";
  runtimeForm.provider = map.get("provider") || "openai";
  runtimeForm.defaultModel = map.get("default_model") || "";
  runtimeForm.systemPrompt = map.get("system_prompt") || "";
  runtimeForm.temperature = map.get("temperature") || "0.7";
  runtimeForm.maxTokens = map.get("max_tokens") || "4096";
  runtimeForm.timeoutMillis = map.get("timeout_millis") || "30000";
  runtimeForm.providerBaseUrl = map.get("provider_base_url") || "";
  runtimeForm.providerAppId = map.get("provider_app_id") || "";
  runtimeForm.providerApiKey = map.get("provider_api_key") || map.get("provider_app_key") || "";
  runtimeForm.providerAppSecret = map.get("provider_app_secret") || map.get("provider_secret_key") || "";
  runtimeForm.inputOptimizationEnabled = map.get("input_optimization_enabled") === "true";
  runtimeForm.contextCompressionEnabled = map.get("context_compression_enabled") === "true";
  runtimeForm.contextCompressionThreshold = map.get("context_compression_threshold") || "12";
  runtimeForm.contextCompressionRetainMessages = map.get("context_compression_retain_messages") || "6";
};

const saveGlobalConfig = async () => {
  const selectedModel = runtimeSelectedModule.value;
  const selectedManufacturer = runtimeSelectedManufacturer.value;
  if (!selectedModel) {
    message("请先选择默认模型", { type: "warning" });
    return;
  }
  const payload: SysAiGlobalSetting[] = [
    {
      sysAiGlobalSettingField: "enabled",
      sysAiGlobalSettingValue: String(runtimeForm.enabled),
      sysAiGlobalSettingValueType: "BOOLEAN",
      sysAiGlobalSettingDescription: "是否启用 AI ChatClient",
      sysAiGlobalSettingSort: 5,
    },
    {
      sysAiGlobalSettingField: "factory",
      sysAiGlobalSettingValue: (selectedManufacturer?.sysAiManufacturerFactory || runtimeForm.factory || "default").trim(),
      sysAiGlobalSettingValueType: "STRING",
      sysAiGlobalSettingDescription: "ChatClient SPI 工厂名称",
      sysAiGlobalSettingSort: 8,
    },
    {
      sysAiGlobalSettingField: "provider",
      sysAiGlobalSettingValue: (selectedManufacturer?.sysAiManufacturerFactory || runtimeForm.provider || "openai").trim(),
      sysAiGlobalSettingValueType: "STRING",
      sysAiGlobalSettingDescription: "默认 LLM 提供商",
      sysAiGlobalSettingSort: 9,
    },
    {
      sysAiGlobalSettingField: "default_model",
      sysAiGlobalSettingValue: runtimeForm.defaultModel.trim(),
      sysAiGlobalSettingValueType: "STRING",
      sysAiGlobalSettingDescription: "默认聊天模型编码",
      sysAiGlobalSettingSort: 10,
    },
    {
      sysAiGlobalSettingField: "system_prompt",
      sysAiGlobalSettingValue: runtimeForm.systemPrompt,
      sysAiGlobalSettingValueType: "STRING",
      sysAiGlobalSettingDescription: "默认系统提示词",
      sysAiGlobalSettingSort: 15,
    },
    {
      sysAiGlobalSettingField: "temperature",
      sysAiGlobalSettingValue: runtimeForm.temperature.trim(),
      sysAiGlobalSettingValueType: "NUMBER",
      sysAiGlobalSettingDescription: "默认采样温度",
      sysAiGlobalSettingSort: 20,
    },
    {
      sysAiGlobalSettingField: "max_tokens",
      sysAiGlobalSettingValue: runtimeForm.maxTokens.trim(),
      sysAiGlobalSettingValueType: "NUMBER",
      sysAiGlobalSettingDescription: "默认最大输出 token",
      sysAiGlobalSettingSort: 30,
    },
    {
      sysAiGlobalSettingField: "timeout_millis",
      sysAiGlobalSettingValue: runtimeForm.timeoutMillis.trim(),
      sysAiGlobalSettingValueType: "NUMBER",
      sysAiGlobalSettingDescription: "默认超时时间(毫秒)",
      sysAiGlobalSettingSort: 35,
    },
    {
      sysAiGlobalSettingField: "app_key_enabled",
      sysAiGlobalSettingValue: String(runtimeForm.appKeyEnabled),
      sysAiGlobalSettingValueType: "BOOLEAN",
      sysAiGlobalSettingDescription: "是否启用 AI AppKey 校验",
      sysAiGlobalSettingSort: 40,
    },
    {
      sysAiGlobalSettingField: "input_optimization_enabled",
      sysAiGlobalSettingValue: String(runtimeForm.inputOptimizationEnabled),
      sysAiGlobalSettingValueType: "BOOLEAN",
      sysAiGlobalSettingDescription: "是否启用输入优化",
      sysAiGlobalSettingSort: 45,
    },
    {
      sysAiGlobalSettingField: "context_compression_enabled",
      sysAiGlobalSettingValue: String(runtimeForm.contextCompressionEnabled),
      sysAiGlobalSettingValueType: "BOOLEAN",
      sysAiGlobalSettingDescription: "是否启用上下文压缩",
      sysAiGlobalSettingSort: 50,
    },
    {
      sysAiGlobalSettingField: "context_compression_threshold",
      sysAiGlobalSettingValue: runtimeForm.contextCompressionThreshold.trim(),
      sysAiGlobalSettingValueType: "NUMBER",
      sysAiGlobalSettingDescription: "触发上下文压缩的历史阈值",
      sysAiGlobalSettingSort: 55,
    },
    {
      sysAiGlobalSettingField: "context_compression_retain_messages",
      sysAiGlobalSettingValue: runtimeForm.contextCompressionRetainMessages.trim(),
      sysAiGlobalSettingValueType: "NUMBER",
      sysAiGlobalSettingDescription: "压缩后保留的消息数量",
      sysAiGlobalSettingSort: 60,
    },
    {
      sysAiGlobalSettingField: "provider_base_url",
      sysAiGlobalSettingValue: (selectedModel.sysAiModuleUrl || selectedManufacturer?.sysAiManufacturerBaseUrl || runtimeForm.providerBaseUrl || "").trim(),
      sysAiGlobalSettingValueType: "STRING",
      sysAiGlobalSettingDescription: "LLM 提供商基础地址",
      sysAiGlobalSettingSort: 70,
    },
    {
      sysAiGlobalSettingField: "provider_app_id",
      sysAiGlobalSettingValue: (selectedManufacturer?.sysAiManufacturerAppId || runtimeForm.providerAppId || "").trim(),
      sysAiGlobalSettingValueType: "STRING",
      sysAiGlobalSettingDescription: "厂商 AppId",
      sysAiGlobalSettingSort: 75,
    },
    {
      sysAiGlobalSettingField: "provider_api_key",
      sysAiGlobalSettingValue: (selectedManufacturer?.sysAiManufacturerAppKey || runtimeForm.providerApiKey || "").trim(),
      sysAiGlobalSettingValueType: "SECRET",
      sysAiGlobalSettingDescription: "厂商 API Key / AppKey",
      sysAiGlobalSettingSort: 80,
    },
    {
      sysAiGlobalSettingField: "provider_app_secret",
      sysAiGlobalSettingValue: (selectedManufacturer?.sysAiManufacturerAppSecret || runtimeForm.providerAppSecret || "").trim(),
      sysAiGlobalSettingValueType: "SECRET",
      sysAiGlobalSettingDescription: "厂商 AppSecret / SecretKey",
      sysAiGlobalSettingSort: 85,
    },
  ].filter((item) => item.sysAiGlobalSettingValue !== "");

  await replaceAiGlobalSettings(payload, "runtime");
  message("全局配置已保存", { type: "success" });
  globalDialogVisible.value = false;
};

const getModuleTypeLabel = (value?: string) => {
  const item = moduleTypeOptions.find((it) => it.value === value);
  return item?.label || value || "-";
};

const isVisualModule = (item: Pick<AiModule, "sysAiModuleType">) =>
  item.sysAiModuleType === "IMAGE" || item.sysAiModuleType === "VIDEO";

const formatPrice = (value?: number) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toFixed(4) : "0.0000";
};

onMounted(async () => {
  await Promise.all([reloadPage(), loadFactories(), loadRuntimeDefaultModel()]);
});
</script>

<style scoped lang="scss">
.manufacturer-page {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px 12px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--el-color-primary) 8%, transparent) 0%, transparent 35%),
    radial-gradient(circle at 20% 80%, color-mix(in srgb, var(--el-color-primary) 5%, transparent) 0%, transparent 30%),
    var(--el-bg-color-page);
}

.manufacturer-page__header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
}

.manufacturer-page__intro {
  width: 100%;
  margin: 0 auto 18px;
  padding: 18px 20px;
  border-radius: 22px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 85%, transparent);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: stretch;
}

.manufacturer-page__intro-content {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.manufacturer-page__intro-main {
  h1 {
    margin: 0;
    font-size: 24px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 8px 0 0;
    color: var(--el-text-color-secondary);
    line-height: 1.7;
  }
}

.manufacturer-page__intro-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.manufacturer-page__meta-item {
  min-width: 108px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--el-border-color-light);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 88%, transparent);
  display: grid;
  gap: 4px;

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  strong {
    color: var(--el-text-color-primary);
    font-size: 22px;
    line-height: 1;
  }
}

.manufacturer-page__header :deep(.el-button) {
  border-radius: 999px;
}

.manufacturer-page__icon-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 88%, transparent);
}

.manufacturer-page__icon-btn :deep(.iconify) {
  font-size: 16px;
}

.manufacturer-page__body {
  flex: 1;
}

.manufacturer-page__state,
.manufacturer-page__grid,
.manufacturer-page__footer {
  width: 100%;
  margin: 0 auto;
}

.manufacturer-page__state {
  border-radius: 28px;
  padding: 20px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 85%, transparent);
  box-shadow: 0 18px 36px color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  backdrop-filter: blur(12px);
}

.manufacturer-page__grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

@media (min-width: 1800px) {
  .manufacturer-page__grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

.manufacturer-page__footer {
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: center;
  padding-top: 18px;
  padding-bottom: 4px;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--el-bg-color-page) 0%, transparent) 0%,
    color-mix(in srgb, var(--el-bg-color-page) 96%, transparent) 38%
  );
}

.manufacturer-card {
  position: relative;
  display: flex;
  min-height: 180px;
  flex-direction: column;
  gap: 6px;
  padding: 12px 12px 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 30px;
  background: color-mix(in srgb, var(--el-fill-color-lighter) 85%, transparent);
  box-shadow: 0 16px 34px color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    border-color 0.22s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), transparent 48%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, var(--el-border-color));
    box-shadow: 0 24px 48px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }

  &.is-active {
    border-color: color-mix(in srgb, var(--el-color-primary) 35%, var(--el-border-color));
    box-shadow:
      0 24px 48px color-mix(in srgb, var(--el-color-primary) 10%, transparent),
      0 0 0 4px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }

  &--add {
    align-items: center;
    justify-content: center;
    border-style: dashed;
    text-align: center;
    cursor: pointer;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      border-color: var(--el-border-color-light);
      box-shadow: 0 24px 48px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    }

    strong {
      margin-top: 10px;
      color: var(--el-text-color-primary);
      font-size: 18px;
      font-weight: 700;
    }

    p {
      margin: 8px 0 0;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 1.5;
    }
  }

  small {
    color: var(--el-text-color-placeholder);
    font-size: 11px;
    display: inline-block;
    transform: translateY(-3px);
  }

  h3 {
    margin: 6px 0 0;
    color: var(--el-text-color-primary);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.1;
    min-width: 3em;
  }
}

.manufacturer-card__header {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;
  align-items: stretch;
  padding-top: 26px;
  position: relative;
}

.manufacturer-card__corner-icons {
  position: absolute;
  top: 8px;
  left: 8px;
  display: inline-flex;
  gap: 6px;
  z-index: 4;
}

.manufacturer-card__corner-icon {
  width: 26px;
  height: 26px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 85%, transparent);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}

.manufacturer-card__corner-icon--success {
  color: var(--el-color-success);
}

.manufacturer-card__corner-icon--warning {
  color: var(--el-color-warning);
}

.manufacturer-card__corner-icon-svg {
  font-size: 16px;
  line-height: 1;
}

.manufacturer-card__identity {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  transform: translateY(-4px);
}

.manufacturer-card__media-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  width: 90px;
}

.manufacturer-card__media-stack .manufacturer-card__media {
  width: 100%;
  aspect-ratio: 1 / 1;
  height: auto;
}

.manufacturer-card__media-stack .manufacturer-card__icon-wrap,
.manufacturer-card__media-stack .manufacturer-card__placeholder {
  width: 100%;
  height: 100%;
}

.manufacturer-card__code {
  font-size: 11px;
  line-height: 1;
  color: var(--el-text-color-placeholder);
  max-width: 90px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manufacturer-card__code--below {
  max-width: 100%;
  width: 100%;
  text-align: center;
  opacity: 0.9;
  transform: none;
}

.manufacturer-card__meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  min-width: 0;
}

.manufacturer-card__status-tag {
  flex-shrink: 0;
}

.manufacturer-card__name-block {
  min-width: 0;
  flex: 1;
  padding-right: 0;
}

.manufacturer-card__media,
.manufacturer-card__icon-wrap {
  display: inline-flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-fill-color) 88%, transparent);
  overflow: hidden;
}

.manufacturer-card__logo,
.manufacturer-card__icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.manufacturer-card__placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
  font-size: 18px;
  font-weight: 700;
}

.manufacturer-card__tags {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.manufacturer-card__add-icon {
  display: inline-flex;
  width: 46px;
  height: 46px;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  color: var(--el-text-color-secondary);
  font-size: 28px;
  line-height: 1;
}

.manufacturer-card__url,
.manufacturer-card__remark {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
  word-break: break-all;
}

.manufacturer-card__content {
  display: grid;
  gap: 8px;
  margin-top: 2px;
}

.manufacturer-card__line {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 6px;
  align-items: start;
}

.manufacturer-card__label {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  line-height: 1.5;
}

.manufacturer-card__value {
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}

.manufacturer-card__tag-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.manufacturer-card__value--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.manufacturer-card__remark {
  margin-top: 10px;
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  padding-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
  color: var(--el-text-color-secondary);
}

.manufacturer-card__toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  z-index: 5;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 92%, transparent);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.manufacturer-card__count-badge {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 3;
}

.manufacturer-card__count-badge :deep(.el-badge__content) {
  min-width: 20px;
  height: 20px;
  line-height: 18px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  box-shadow: 0 6px 14px color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  font-weight: 700;
}

.manufacturer-card:hover .manufacturer-card__toolbar {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  box-shadow: 0 10px 24px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.toolbar-icon-btn {
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: 8px;
}

.toolbar-icon-btn--status.status-enabled {
  background: color-mix(in srgb, var(--el-color-success) 16%, transparent);
  color: var(--el-color-success);
}

.toolbar-icon-btn--status.status-enabled:hover {
  background: color-mix(in srgb, var(--el-color-success) 24%, transparent);
}

.toolbar-icon-btn--status.status-disabled {
  background: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
  color: var(--el-color-danger);
}

.toolbar-icon-btn--status.status-disabled:hover {
  background: color-mix(in srgb, var(--el-color-danger) 22%, transparent);
}

.manufacturer-card__icon-only-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
  line-height: 1;
}

.manufacturer-card__icon-only-tag--success {
  color: var(--el-color-success);
}

.manufacturer-card__icon-only-tag--primary {
  color: var(--el-color-primary);
}

.manufacturer-card__tag-icon {
  font-size: 14px;
  line-height: 1;
}

.toolbar-icon-btn__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 14px;
  line-height: 1;
}

.manufacturer-form__upload {
  display: flex;
  gap: 12px;
}

.global-config {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.manufacturer-page :deep(.global-config-dialog .el-dialog__body) {
  padding-top: 14px;
}

.manufacturer-page :deep(.global-config-dialog .el-dialog__header) {
  background: transparent;
}

.global-config-layout {
  display: grid;
  grid-template-columns: 340px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.global-config-layout__summary {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  background: color-mix(in srgb, var(--el-fill-color-light) 90%, transparent);
}

.global-config-layout__summary-head {
  strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 15px;
  }

  p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.5;
  }
}

.global-config-layout__summary-list {
  display: grid;
  gap: 8px;
  overflow: visible;
  padding-right: 0;
}

.global-config-layout__summary-item {
  display: grid;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color-overlay);

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  :deep(.el-tag) {
    justify-self: start;
    max-width: 100%;
  }
}

.global-config__toolbar {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;

  strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 18px;
  }

  p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }
}

.global-config__section {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 22px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 86%, transparent);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--el-color-primary) 4%, transparent);
}

.global-config {
  max-height: 70vh;
  overflow: auto;
  padding-right: 4px;
}

.global-config__section-head {
  strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 15px;
  }

  small {
    display: block;
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
  }
}

.global-config__form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.global-config__field {
  display: grid;
  gap: 8px;
}

.global-config__field label {
  color: var(--el-text-color-regular);
  font-size: 13px;
  font-weight: 600;
}

.global-config__field :deep(.el-input.is-disabled .el-input__wrapper),
.global-config__field :deep(.el-textarea.is-disabled .el-textarea__inner) {
  background: var(--el-fill-color-light);
}

.global-config__field--full {
  grid-column: 1 / -1;
}

.global-config__field--switch {
  align-content: start;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--el-fill-color-light);
}

.manufacturer-panel {
  display: grid;
  gap: 22px;
}

.manufacturer-page :deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 14px 16px 8px;
}

.manufacturer-page :deep(.el-drawer__body) {
  padding: 12px 16px 16px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--el-color-primary) 6%, transparent) 0%, transparent 28%),
    var(--el-bg-color-page);
}

.manufacturer-panel__hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: flex-start;
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 22px;
  background: linear-gradient(145deg, color-mix(in srgb, var(--el-bg-color-overlay) 85%, transparent), color-mix(in srgb, var(--el-bg-color-overlay) 92%, transparent));
  box-shadow: 0 14px 30px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
}

.manufacturer-panel__identity {
  display: flex;
  gap: 16px;
  align-items: center;

  small {
    color: var(--el-text-color-placeholder);
  }

  h2 {
    margin: 6px 0;
    color: var(--el-text-color-primary);
    font-size: 28px;
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
  }
}

.manufacturer-panel__logo {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--el-color-primary) 6%, transparent);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.manufacturer-panel__logo-fallback {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 20%, transparent), color-mix(in srgb, var(--el-color-primary) 15%, transparent));
  color: var(--el-text-color-regular);
  font-size: 20px;
  font-weight: 700;
}

.manufacturer-panel__hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.manufacturer-panel__hero-actions :deep(.el-button) {
  border-radius: 999px;
}

.manufacturer-panel__refresh-btn :deep(.iconify) {
  font-size: 16px;
}

.manufacturer-panel__grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  align-items: stretch;
}

.module-card {
  position: relative;
  display: flex;
  min-height: 140px;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  background: color-mix(in srgb, var(--el-fill-color-lighter) 85%, transparent);
  box-shadow: 0 14px 28px color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  padding-top: 36px;
  padding-bottom: 36px;

  &:hover {
    transform: translateY(-3px);
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, var(--el-border-color));
    box-shadow: 0 22px 40px color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  }

  &.is-llm {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-primary) 12%, transparent) 0%, color-mix(in srgb, var(--el-color-primary) 6%, transparent) 100%);
  }

  &.is-image {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-warning) 12%, transparent) 0%, color-mix(in srgb, var(--el-color-warning) 6%, transparent) 100%);
  }

  &.is-video {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-primary) 10%, transparent) 0%, color-mix(in srgb, var(--el-color-primary) 5%, transparent) 100%);
  }

  &.is-face {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-danger) 10%, transparent) 0%, color-mix(in srgb, var(--el-color-danger) 5%, transparent) 100%);
  }

  &.is-colorization {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-success) 12%, transparent) 0%, color-mix(in srgb, var(--el-color-success) 6%, transparent) 100%);
  }

  &.is-resolution {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-info) 10%, transparent) 0%, color-mix(in srgb, var(--el-color-info) 5%, transparent) 100%);
  }

  &.is-ocr {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-cyan) 10%, transparent) 0%, color-mix(in srgb, var(--el-color-cyan) 5%, transparent) 100%);
  }

  &.is-reid {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-purple) 10%, transparent) 0%, color-mix(in srgb, var(--el-color-purple) 5%, transparent) 100%);
  }

  &.is-classification {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-warning) 8%, transparent) 0%, color-mix(in srgb, var(--el-color-warning) 4%, transparent) 100%);
  }

  &.is-audio {
    background: linear-gradient(180deg, color-mix(in srgb, var(--el-color-success) 8%, transparent) 0%, color-mix(in srgb, var(--el-color-success) 4%, transparent) 100%);
  }

  &.is-global-model {
    border-color: color-mix(in srgb, var(--el-color-danger) 40%, transparent);
    box-shadow:
      0 18px 34px color-mix(in srgb, var(--el-color-primary) 8%, transparent),
      0 0 0 2px color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  }

  &--add {
    align-items: center;
    justify-content: center;
    border-style: dashed;
    text-align: center;
    cursor: pointer;
  }

  strong {
    margin-top: 10px;
    font-size: 18px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
    word-break: break-all;
    font-size: 12px;
  }
}

.module-card__toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  padding: 6px;
  z-index: 6;
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color-overlay) 92%, transparent);
  box-shadow: 0 10px 24px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  opacity: 0;
  transform: translateY(-6px);
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.module-card:hover .module-card__toolbar {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.module-card__header {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  align-items: start;
  padding-right: 56px;

  > div:first-child {
    min-width: 0;
    flex: 1;
  }

  > :deep(.el-tag) {
    justify-self: start;
  }

  small {
    color: var(--el-text-color-placeholder);
  }

  h3 {
    margin: 4px 0 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.35;
  }
}

.module-card__visual {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.module-card__cover {
  width: 40px;
  height: 40px;
  border-radius: 16px;
  flex-shrink: 0;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--el-color-primary) 20%, transparent), color-mix(in srgb, var(--el-color-primary) 15%, transparent));
  border: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 700;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.module-card__title-block {
  min-width: 128px;
  flex: 1;
  width: 100%;
}

.module-card__type-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  right: auto;
  z-index: 2;
}

.module-card__identity-tag--model-id {
  max-width: 240px;
  width: 100%;
}

.module-card__identity-tag--model-id :deep(.el-tag__content) {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-card__version-badge {
  position: absolute;
  left: 10px;
  bottom: 10px;
  z-index: 2;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-bg-color-overlay) 88%, transparent);
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  line-height: 1.6;
}

.module-card__status-badge {
  position: absolute;
  right: 10px;
  bottom: 10px;
  z-index: 2;
}

.module-card__footer {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  margin-top: auto;
}

.module-card__identity-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.module-card__meta-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.module-card__tag-icon {
  font-size: 14px;
  line-height: 1;
}

.module-card__icon-only-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-success);
  line-height: 1;
}

.module-card__icon-only-tag--warning {
  color: var(--el-color-warning);
}

.module-card__icon-only-tag--danger {
  color: var(--el-color-danger);
}

.module-card__add-icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  color: var(--el-text-color-secondary);
  font-size: 26px;
}

.module-config {
  display: grid;
  gap: 12px;
}

.module-config__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--el-fill-color-light);

  span {
    color: var(--el-text-color-secondary);
  }

  strong {
    color: var(--el-text-color-primary);
    text-align: right;
  }
}

.full-width {
  width: 100%;
}

.manufacturer-page :deep(.el-input__wrapper),
.manufacturer-page :deep(.el-textarea__inner),
.manufacturer-page :deep(.el-select__wrapper) {
  border-radius: 16px;
}

.manufacturer-page :deep(.manufacturer-dialog) {
  border-radius: 22px;
  overflow: hidden;
  background: var(--el-bg-color-overlay);
  box-shadow: 0 28px 64px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.manufacturer-page :deep(.manufacturer-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 18px 22px 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  background: transparent;
}

.manufacturer-page :deep(.manufacturer-dialog .el-dialog__title) {
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 700;
}

.manufacturer-page :deep(.manufacturer-dialog .el-dialog__body) {
  padding: 18px 22px 8px;
}

.manufacturer-page :deep(.manufacturer-dialog .el-form-item) {
  margin-bottom: 14px;
}

.manufacturer-page :deep(.manufacturer-dialog .el-form-item__label) {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.manufacturer-page :deep(.manufacturer-dialog .el-input__wrapper),
.manufacturer-page :deep(.manufacturer-dialog .el-select__wrapper) {
  min-height: 38px;
  border-radius: 12px;
  background: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px var(--el-border-color-light) inset;
}

.manufacturer-page :deep(.manufacturer-dialog .el-textarea__inner) {
  border-radius: 12px;
  background: var(--el-fill-color-blank);
}

.manufacturer-page :deep(.manufacturer-dialog .el-dialog__footer) {
  padding: 14px 22px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-fill-color) 75%, transparent);
}

.manufacturer-page :deep(.manufacturer-dialog .el-dialog__footer .el-button) {
  min-width: 88px;
  border-radius: 10px;
}

@media (max-width: 960px) {
  .manufacturer-page__intro {
    flex-direction: column;
    padding: 16px;
    border-radius: 18px;
  }

  .manufacturer-page__intro-meta {
    width: 100%;
    justify-content: flex-start;
  }

  .manufacturer-page__meta-item {
    flex: 1;
    min-width: 120px;
  }

  .manufacturer-page__grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .manufacturer-form__upload {
    flex-direction: column;
  }

  .manufacturer-panel__grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  .global-config-layout {
    grid-template-columns: 1fr;
    max-height: none;
  }

  .global-config-layout__summary {
    grid-template-rows: auto;
  }

  .global-config-layout__summary-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
  }

  .global-config__form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .manufacturer-page {
    padding: 20px 14px;
  }

  .manufacturer-page__intro {
    padding: 14px;
    gap: 12px;
    margin-bottom: 14px;
  }

  .manufacturer-page__intro-main h1 {
    font-size: 20px;
    line-height: 1.2;
  }

  .manufacturer-page__intro-main p {
    font-size: 13px;
    line-height: 1.6;
  }

  .manufacturer-page__intro-meta {
    gap: 8px;
  }

  .manufacturer-page__meta-item {
    min-width: 92px;
    padding: 8px 10px;
    border-radius: 12px;
  }

  .manufacturer-page__meta-item strong {
    font-size: 18px;
  }

  .global-config-layout__summary-list {
    grid-template-columns: 1fr;
  }

  .manufacturer-page__grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .manufacturer-card {
    min-height: 180px;
    padding: 18px;
    border-radius: 22px;
  }

  .manufacturer-panel__hero {
    flex-direction: column;
  }

  .manufacturer-panel__grid {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}

@media (max-width: 480px) {
  .manufacturer-page__grid,
  .manufacturer-panel__grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
</style>
