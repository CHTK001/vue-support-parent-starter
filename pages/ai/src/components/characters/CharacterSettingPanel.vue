<template>
  <div class="cwb-scope" v-loading="pageLoading" :element-loading-text="t('characters.setting.loading')">
    <div class="cwb-panel">
      <!-- 中栏：编辑区 -->
      <div class="cwb-main">
        <!-- 头部 -->
        <div class="cwb-head">
          <AvatarPreview :src="characterForm.avatarUrl" type="assistant" class="cwb-head__av"
            :name="characterForm.title" :disabled="isGenericAssistant" />
          <div class="cwb-head__text">
            <div class="cwb-head__title">
              {{ characterForm.title || t('characters.wb.untitled') }}
              <span v-if="isGenericAssistant" class="ax-pill"
                :title="t('characters.list.genericProtectedHint')">{{ t('characters.wb.builtin') }}</span>
              <span v-if="data?.isPublic" class="ax-pill ax-pill--soft">
                {{ t('characters.list.sharedTemplate') }}
              </span>
            </div>
            <div class="cwb-head__desc">{{ characterForm.description || t('characters.list.noDescription') }}</div>
          </div>
          <div class="cwb-head__ops">
            <el-button v-if="!isGenericAssistant" type="primary" plain @click="emit('use')">
              {{ t('characters.setting.useThis') }}
            </el-button>
            <el-button v-if="!isGenericAssistant" type="danger" plain @click="emit('remove')">
              {{ t('characters.setting.delete') }}
            </el-button>
          </div>
        </div>
        <!-- 能力度量头（07 舱 · Console 融合）：四组能力启用率一目了然 -->
        <div class="cwb-console ax-console">
          <div class="ax-dial" :class="dialClass(enabledLocalToolsCount, localTools.length)"
            :style="dialStyle(enabledLocalToolsCount, localTools.length)">
            <div class="ax-dial__ring"><span class="ax-dial__num ax-mono">{{ pctText(enabledLocalToolsCount, localTools.length) }}</span></div>
            <div class="ax-dial__meta">
              <span class="ax-dial__label">{{ t('characters.wb.capsLocalTools') }}</span>
              <span class="ax-dial__value ax-mono">{{ enabledLocalToolsCount }}<small> / {{ localTools.length }}</small></span>
            </div>
          </div>
          <div class="ax-dial" :class="dialClass(enabledMcpCount, mcpServers.length)"
            :style="dialStyle(enabledMcpCount, mcpServers.length)">
            <div class="ax-dial__ring"><span class="ax-dial__num ax-mono">{{ pctText(enabledMcpCount, mcpServers.length) }}</span></div>
            <div class="ax-dial__meta">
              <span class="ax-dial__label">{{ t('characters.wb.capsMcp') }}</span>
              <span class="ax-dial__value ax-mono">{{ enabledMcpCount }}<small> / {{ mcpServers.length }}</small></span>
            </div>
          </div>
          <div class="ax-dial" :class="dialClass(enabledSkillsCount, visibleSkills.length)"
            :style="dialStyle(enabledSkillsCount, visibleSkills.length)">
            <div class="ax-dial__ring"><span class="ax-dial__num ax-mono">{{ pctText(enabledSkillsCount, visibleSkills.length) }}</span></div>
            <div class="ax-dial__meta">
              <span class="ax-dial__label">{{ t('characters.wb.capsSkills') }}</span>
              <span class="ax-dial__value ax-mono">{{ enabledSkillsCount }}<small> / {{ visibleSkills.length }}</small></span>
            </div>
          </div>
          <div class="ax-dial" :class="dialClass(enabledAgentsCount, presetCharacters.length)"
            :style="dialStyle(enabledAgentsCount, presetCharacters.length)">
            <div class="ax-dial__ring"><span class="ax-dial__num ax-mono">{{ pctText(enabledAgentsCount, presetCharacters.length) }}</span></div>
            <div class="ax-dial__meta">
              <span class="ax-dial__label">{{ t('characters.wb.capsAgents') }}</span>
              <span class="ax-dial__value ax-mono">{{ enabledAgentsCount }}<small> / {{ presetCharacters.length }}</small></span>
            </div>
          </div>
        </div>
        <!-- 滚动内容 -->
        <div class="cwb-scroll ax-scroll">
          <!-- 基础配置 -->
          <section class="cwb-sec" id="cwb-sec-basic">
            <div class="ax-sec">{{ t('characters.wb.secBasic') }}</div>
            <div class="cwb-sec__body">
            <el-form ref="basicFormRef" :model="characterForm" :rules="basicRules" label-position="top">
              <div class="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
                <!-- 头像设置 -->
                <el-form-item prop="avatarUrl" class="mb-0!">
                  <div class="px-4 py-3.5 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 w-full">
                    <div class="flex flex-col gap-1 w-1/2">
                      <span class="text-base text-gray-900 dark:text-gray-100">{{ t('characters.setting.avatarTitle') }} <span class="text-xs text-gray-400">{{ t('characters.setting.avatarOptional') }}</span></span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ isGenericAssistant ? t('characters.setting.avatarLockedHint') : t('characters.setting.avatarHint') }}</span>
                    </div>
                    <AvatarPreview :src="characterForm.avatarUrl" type="assistant" class="w-10"
                      :name="characterForm.title" :disabled="isGenericAssistant" @avatar-changed="handleAvatarChanged" />
                  </div>
                </el-form-item>
                <!-- 角色标题 -->
                <el-form-item prop="title" class="mb-0!">
                  <div class="px-4 py-3.5 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 w-full">
                    <div class="flex flex-col gap-1 w-1/2">
                      <span class="text-base text-gray-900 dark:text-gray-100">{{ t('characters.setting.titleLabel') }}</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('characters.setting.titleHint') }}</span>
                    </div>
                    <div class="w-1/2 flex justify-end">
                      <el-input v-model="characterForm.title" :placeholder="t('characters.setting.titlePlaceholder')" class="w-full" />
                    </div>
                  </div>
                </el-form-item>
                <!-- 角色描述 -->
                <el-form-item prop="description" class="mb-0!">
                  <div class="px-4 py-3.5 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 w-full">
                    <div class="flex flex-col gap-1 w-1/2">
                      <span class="text-base text-gray-900 dark:text-gray-100">{{ t('characters.setting.descLabel') }} <span class="text-xs text-gray-400">{{ t('characters.setting.descOptional') }}</span></span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('characters.setting.descHint') }}</span>
                    </div>
                    <div class="w-1/2">
                      <el-input v-model="characterForm.description" type="textarea" :placeholder="t('characters.setting.descPlaceholder')"
                        :autosize="{ minRows: 3, maxRows: 5 }" class="w-full" />
                    </div>
                  </div>
                </el-form-item>
                <!-- 分组设置 -->
                <el-form-item prop="groupId" class="mb-0!">
                  <div class="px-4 py-3.5 flex items-center justify-between gap-4 w-full">
                    <div class="flex flex-col gap-1 w-1/2">
                      <span class="text-base text-gray-900 dark:text-gray-100">{{ t('characters.setting.groupLabel') }} <span class="text-xs text-gray-400">{{ t('characters.setting.groupOptional') }}</span></span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('characters.setting.groupHint') }}</span>
                    </div>
                    <div class="w-1/2">
                      <el-select v-model="characterForm.groupId" :placeholder="t('characters.setting.groupPlaceholder')" clearable class="w-full">
                        <el-option :label="t('characters.setting.groupUngrouped')" value="" />
                        <el-option v-for="group in characterGroups" :key="group.id" :label="group.name"
                          :value="group.id ?? ''" />
                      </el-select>
                    </div>
                  </div>
                </el-form-item>
              </div>

              <!-- 模型选择 -->
              <div class="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
                <el-form-item prop="modelId" class="mb-0!">
                  <div class="px-4 py-3.5 flex items-center justify-between gap-4 w-full">
                    <div class="flex flex-col gap-1 w-1/2">
                      <span class="text-base text-gray-900 dark:text-gray-100">{{ t('characters.setting.modelLabel') }} <span class="text-xs text-gray-400">{{ t('characters.setting.modelOptional') }}</span></span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('characters.setting.modelHint') }}</span>
                    </div>
                    <div class="w-1/2">
                      <el-select v-model="characterForm.modelId" :options="modelOptions" :placeholder="t('characters.setting.modelPlaceholder')" clearable
                        class="w-full" />
                    </div>
                  </div>
                </el-form-item>
              </div>

              <!-- 默认能力（深度思考 / 在线检索） -->
              <div class="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
                <!-- 深度思考 -->
                <el-form-item class="mb-0!">
                  <div class="px-4 py-3 flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 w-full">
                    <div class="flex items-center gap-2.5">
                      <el-icon size="18" class="text-gray-500 dark:text-gray-400">
                        <BrainCircuit20Regular />
                      </el-icon>
                      <div class="flex flex-col">
                        <span class="text-sm text-gray-900 dark:text-gray-100">{{ t('characters.setting.capThink') }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('characters.setting.capThinkHint') }}</span>
                      </div>
                    </div>
                    <el-switch v-model="characterForm.defaultThink" />
                  </div>
                </el-form-item>
                <!-- 在线检索 -->
                <el-form-item class="mb-0!">
                  <div class="px-4 py-3 flex items-center justify-between gap-4 w-full">
                    <div class="flex items-center gap-2.5">
                      <el-icon size="18" class="text-gray-500 dark:text-gray-400">
                        <GlobeShield20Regular />
                      </el-icon>
                      <div class="flex flex-col">
                        <span class="text-sm text-gray-900 dark:text-gray-100">{{ t('characters.setting.capSearch') }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ t('characters.setting.capSearchHint') }}</span>
                      </div>
                    </div>
                    <el-switch v-model="characterForm.defaultSearch" />
                  </div>
                </el-form-item>
              </div>

      </el-form>
      </div>
    </section>

    <!-- 提示词 · 分形态 -->
    <section class="cwb-sec">
      <div class="ax-sec">{{ t('characters.wb.secPrompt') }}</div>
      <div class="cwb-sec__body">
              <el-form ref="promptFormRef" :model="characterForm" :rules="promptRules" label-position="top"
                label-width="80px" size="large" class="flex-1 flex flex-col min-h-0">
                <el-form-item :show-label="false" :show-feedback="false" style="flex-shrink: 0;" class="no-border-item">
                  <div class="flex items-center w-full justify-between gap-2">
                    <span>{{ t('characters.setting.systemPromptLabel') }}</span>
                    <div class="flex items-center gap-1.5">
                      <!-- 形态可自定义，数量不定：少用分段控件，多了下拉，避免一行挤爆 -->
                      <SegmentedToggle v-if="formOptions.length <= 3" :model-value="promptModeValue"
                        :options="formOptions" @update:model-value="handleFormChange" size="small" />
                      <el-select v-else :model-value="promptModeValue" size="small" class="form-select"
                        @update:model-value="handleFormChange">
                        <el-option v-for="o in formOptions" :key="o.value" :label="o.label" :value="o.value" />
                      </el-select>
                      <el-tooltip :content="t('characters.setting.formManageHint')" placement="top">
                        <el-button link size="small" aria-label="管理提示词形态" @click="formDialogVisible = true">
                          <el-icon><Settings20Regular /></el-icon>
                        </el-button>
                      </el-tooltip>
                    </div>
                  </div>
                </el-form-item>

                <!-- 形态说明：把「这次生效的是哪一套」讲清楚，避免配了 A 却跑 B -->
                <el-form-item :show-label="false" :show-feedback="false" style="flex-shrink: 0;" class="no-border-item">
                  <div class="prompt-mode-hint">
                    <el-icon size="13" class="prompt-mode-hint-icon shrink-0">
                      <component :is="activeFormIcon" />
                    </el-icon>
                    <el-tag size="small" :type="formPromptFromTable && !isBuildForm ? 'success' : 'info'" effect="plain">
                      {{ activePromptForm.formKey }}{{ formPromptFromTable && !isBuildForm ? '' : ' · 继承' }}
                    </el-tag>
                    <span>{{ activePromptForm.formDescription || t('characters.setting.formNoDesc') }}</span>
                  </div>
                </el-form-item>

                <!-- build：编辑角色主提示词（历史列，无需迁移） -->
                <el-form-item v-if="isBuildForm" prop="systemPrompt" :show-label="false"
                  class="flex-1 min-h-40 prompt-form-item no-border-item">
                  <el-input v-model="characterForm.systemPrompt" type="textarea" :placeholder="t('characters.setting.systemPromptPlaceholder')" resize="none" />
                </el-form-item>

                <!-- 其余形态：编辑分形态提示词表中该形态的行 -->
                <template v-else>
                  <!-- 接口不可用时不要给出可编辑输入框：否则用户填了内容却在保存时被
                       静默丢弃（后端未部署 / V1.3 未迁移），这是最难排查的一类假成功 -->
                  <el-alert v-if="!rolePromptsAvailable" type="warning" :closable="false" show-icon
                    :title="t('characters.setting.formUnavailableTitle')" class="form-prompt-unavailable mb-3">
                    {{ t('characters.setting.formUnavailableDesc') }}
                  </el-alert>
                  <template v-else>
                    <el-form-item :show-label="false" :show-feedback="false" style="flex-shrink: 0;" class="no-border-item">
                      <el-switch v-model="formPromptEnabled" active-text="启用" />
                    </el-form-item>
                    <el-form-item :show-label="false" :show-feedback="false"
                      class="flex-1 min-h-40 prompt-form-item no-border-item">
                      <el-input v-model="formPromptDraft" type="textarea"
                        :placeholder="t('characters.setting.formPromptPlaceholder')" resize="none" />
                    </el-form-item>
                    <el-form-item v-if="formPromptFromTable" :show-label="false" :show-feedback="false" style="flex-shrink: 0;" class="no-border-item">
                      <el-button link type="warning" :loading="formPromptSaving" @click="handleResetFormPrompt">
                        {{ t('characters.setting.formClear') }}
                      </el-button>
                    </el-form-item>
                  </template>
                </template>

      </el-form>
      </div>
    </section>

    <!-- 记忆与压缩 -->
    <section class="cwb-sec" id="cwb-sec-memory">
      <div class="ax-sec">{{ t('characters.wb.secMemory') }}</div>
      <div class="cwb-sec__body">
        <el-form label-position="top">
          <!-- 触发阈值 -->
          <el-form-item prop="compressionTriggerRatio" class="cwb-mem-item">
            <div class="cwb-mem-row">
              <div class="cwb-mem-label">
                <span>{{ t('characters.setting.triggerThreshold') }}</span>
                <span class="ax-muted">{{ t('characters.setting.triggerHint') }}</span>
              </div>
              <el-slider v-model="characterForm.compressionTriggerRatio" :min="0.5" :max="0.95" :step="0.05"
                show-input :format-tooltip="formatSliderTooltip" class="w-full" />
            </div>
          </el-form-item>
          <!-- 保留目标 -->
          <el-form-item prop="compressionTargetRatio" class="cwb-mem-item">
            <div class="cwb-mem-row">
              <div class="cwb-mem-label">
                <span>{{ t('characters.setting.targetRatio') }}</span>
                <span class="ax-muted">{{ t('characters.setting.targetHint') }}</span>
              </div>
              <el-slider v-model="characterForm.compressionTargetRatio" :min="0.2" :max="0.8" :step="0.05"
                show-input :format-tooltip="(val) => `${Math.round(val * 100)}%`" class="w-full" />
            </div>
          </el-form-item>
          <!-- 摘要模式 -->
          <el-form-item prop="summaryMode" class="cwb-mem-item">
            <div class="cwb-mem-row">
              <div class="cwb-mem-label">
                <span>{{ t('characters.setting.summaryMode') }}</span>
                <span class="ax-muted">{{ t('characters.setting.summaryHint') }}</span>
              </div>
              <el-select v-model="characterForm.summaryMode" :placeholder="t('characters.setting.summaryPlaceholder')" class="w-full">
                <el-option :label="t('characters.setting.summaryDisabled')" value="disabled">
                  <span class="flex items-center gap-2">
                    <el-icon><CloseOutlined /></el-icon>
                    <span>{{ t('characters.setting.summaryDisabledDesc') }}</span>
                  </span>
                </el-option>
                <el-option :label="t('characters.setting.summaryFast')" value="fast">
                  <span class="flex items-center gap-2">
                    <el-icon><ThunderboltOutlined /></el-icon>
                    <span>{{ t('characters.setting.summaryFastDesc') }}</span>
                  </span>
                </el-option>
                <el-option :label="t('characters.setting.summaryMemorySync')" value="memory_sync">
                  <span class="flex items-center gap-2">
                    <el-icon><FolderOutlined /></el-icon>
                    <span>{{ t('characters.setting.summaryMemorySyncDesc') }}</span>
                  </span>
                </el-option>
              </el-select>
            </div>
          </el-form-item>
        </el-form>
        <el-alert :title="t('characters.setting.tipTitle')" type="info" :closable="false" show-icon class="cwb-mem-tip">
          <p class="text-sm">{{ t('characters.setting.tip1') }}</p>
          <p class="text-sm">{{ t('characters.setting.tip2') }}</p>
          <p class="text-sm">{{ t('characters.setting.tip3') }}</p>
        </el-alert>
      </div>
    </section>
      </div>

    <!-- 保存栏（中栏底部，随编辑列固定） -->
    <div class="cwb-savebar ax-savebar">
      <span class="ax-savebar__dirty">
        <span class="ax-dot" :class="isDirty ? 'ax-dot--on' : 'ax-dot--off'"></span>
        {{ isDirty ? t('characters.wb.dirty') : t('characters.wb.clean') }}
      </span>
      <div class="ax-savebar__ops">
        <el-button :disabled="!isDirty" @click="resetChanges">{{ t('characters.wb.undo') }}</el-button>
        <el-button type="primary" :loading="saving" :disabled="!isDirty" @click="emit('save')">
          {{ t('characters.modal.applyAll') }}
        </el-button>
      </div>
    </div>
    </div>

    <!-- 右栏：能力清单 -->
    <aside class="cwb-rail">
      <div class="cwb-rail__inner ax-scroll">
        <!-- 本地工具 -->
        <section class="ax-panel">
          <header class="ax-panel__head">
            <span>{{ t('characters.wb.capsLocalTools') }}</span>
            <span class="ax-pill ax-pill--soft">{{ enabledLocalToolsCount }} / {{ localTools.length }}</span>
          </header>
          <div class="ax-meter">
            <div class="ax-meter__head">
              <span>{{ t('characters.wb.meterLabel') }}</span>
              <span class="ax-mono">{{ pctText(enabledLocalToolsCount, localTools.length) }}</span>
            </div>
            <div class="ax-meter__track">
              <div class="ax-meter__fill" :class="meterClass(enabledLocalToolsCount, localTools.length)"
                :style="{ width: pct(enabledLocalToolsCount, localTools.length) + '%' }"></div>
            </div>
          </div>
          <div class="ax-panel__body">
            <div class="cwb-swgrp">
              <div class="cwb-swgrp__row">
                <span class="cwb-swgrp__label">{{ t('characters.setting.toolToggle') }}</span>
                <el-switch :model-value="!allDisabled" @update:model-value="(v) => handleAllDisabledToggle(!v)" />
              </div>
              <div class="cwb-swgrp__row" :class="{ 'is-off': allDisabled }">
                <span class="cwb-swgrp__label">{{ t('characters.setting.newPluginLabel') }}</span>
                <SegmentedToggle v-model="allowlistMode" :options="autoEnableOptions" size="small" />
              </div>
            </div>
            <div v-if="localTools.length === 0" class="ax-empty">
              <el-icon size="32"><InfoCircleOutlined /></el-icon>
              <p>{{ t('characters.setting.noLocalTools') }}</p>
            </div>
            <div v-else class="cwb-rail-list">
              <div v-for="tool in localTools" :key="tool.pluginId" class="cwb-cap-item"
                :class="{ 'is-off': allDisabled }">
                <div class="cwb-cap-item__main">
                  <div class="cwb-cap-item__name">{{ tool.displayName }}</div>
                  <p class="cwb-cap-item__desc">{{ tool.description }}</p>
                </div>
                <el-switch :model-value="isToolProviderEnabled(tool.pluginId)"
                  @update:model-value="(val) => handleLocalToolToggle(tool.pluginId, val)"
                  :disabled="allDisabled" inline-prompt :active-text="t('common.enable')" :inactive-text="t('common.disable')" />
              </div>
            </div>
          </div>
        </section>

        <!-- MCP 工具 -->
        <section class="ax-panel">
          <header class="ax-panel__head">
            <span>{{ t('characters.wb.capsMcp') }}</span>
            <span class="ax-pill ax-pill--soft">{{ enabledMcpCount }} / {{ mcpServers.length }}</span>
          </header>
          <div class="ax-meter">
            <div class="ax-meter__head">
              <span>{{ t('characters.wb.meterLabel') }}</span>
              <span class="ax-mono">{{ pctText(enabledMcpCount, mcpServers.length) }}</span>
            </div>
            <div class="ax-meter__track">
              <div class="ax-meter__fill" :class="meterClass(enabledMcpCount, mcpServers.length)"
                :style="{ width: pct(enabledMcpCount, mcpServers.length) + '%' }"></div>
            </div>
          </div>
          <div class="ax-panel__body">
            <div class="cwb-swgrp">
              <div class="cwb-swgrp__row">
                <span class="cwb-swgrp__label">{{ t('characters.setting.toolToggle') }}</span>
                <el-switch :model-value="!allMcpDisabled" @update:model-value="(v) => handleAllMcpDisabledToggle(!v)" />
              </div>
              <div class="cwb-swgrp__row" :class="{ 'is-off': allMcpDisabled }">
                <span class="cwb-swgrp__label">{{ t('characters.setting.newMcpLabel') }}</span>
                <SegmentedToggle v-model="mcpAllowlistMode" :options="autoEnableOptions" size="small" />
              </div>
            </div>
            <div v-if="mcpServers.length === 0" class="ax-empty">
              <el-icon size="32"><InfoCircleOutlined /></el-icon>
              <p>{{ t('characters.setting.noMcpServers') }}</p>
            </div>
            <div v-else class="cwb-rail-list">
              <div v-for="server in mcpServers" :key="server.id" class="cwb-cap-item"
                :class="{ 'is-off': allMcpDisabled }">
                <div class="cwb-cap-item__main">
                  <div class="cwb-cap-item__name">
                    {{ server.name }}
                    <el-tag v-if="server.enabled" type="success" size="small" effect="plain">{{ t('characters.setting.mcpRunning') }}</el-tag>
                    <el-tag v-else type="info" size="small" effect="plain">{{ t('characters.setting.mcpNotRunning') }}</el-tag>
                  </div>
                  <p v-if="server.description" class="cwb-cap-item__desc">{{ server.description }}</p>
                  <p v-if="server.tools && Object.keys(server.tools).length > 0" class="ax-muted cwb-cap-item__tools">
                    {{ t('characters.setting.availableTools', { count: Object.keys(server.tools).length }) }}
                  </p>
                </div>
                <el-switch :model-value="isMcpServerEnabled(server.id)"
                  @update:model-value="(val) => handleMcpServerToggle(server.id, val)"
                  :disabled="allMcpDisabled" />
              </div>
            </div>
          </div>
        </section>

        <!-- Skills 技能 -->
        <section class="ax-panel">
          <header class="ax-panel__head">
            <span>{{ t('characters.wb.capsSkills') }}</span>
            <span class="ax-pill ax-pill--soft">{{ enabledSkillsCount }} / {{ visibleSkills.length }}</span>
          </header>
          <div class="ax-meter">
            <div class="ax-meter__head">
              <span>{{ t('characters.wb.meterLabel') }}</span>
              <span class="ax-mono">{{ pctText(enabledSkillsCount, visibleSkills.length) }}</span>
            </div>
            <div class="ax-meter__track">
              <div class="ax-meter__fill" :class="meterClass(enabledSkillsCount, visibleSkills.length)"
                :style="{ width: pct(enabledSkillsCount, visibleSkills.length) + '%' }"></div>
            </div>
          </div>
          <div class="ax-panel__body">
            <div class="cwb-swgrp">
              <div class="cwb-swgrp__row">
                <span class="cwb-swgrp__label">{{ t('characters.setting.toolToggle') }}</span>
                <el-switch :model-value="!allSkillsDisabled" @update:model-value="(v) => handleAllSkillsDisabledToggle(!v)" />
              </div>
              <div class="cwb-swgrp__row" :class="{ 'is-off': allSkillsDisabled }">
                <span class="cwb-swgrp__label">{{ t('characters.setting.newSkillLabel') }}</span>
                <SegmentedToggle v-model="skillsAllowlistMode" :options="autoEnableOptions" size="small" />
              </div>
            </div>
            <div v-if="loadingSkills" class="ax-empty">
              <el-icon class="is-loading" size="24"><LoadingOutlined /></el-icon>
              <p>{{ t('characters.setting.loadingSkills') }}</p>
            </div>
            <div v-else-if="visibleSkills.length === 0" class="ax-empty">
              <el-icon size="32"><InfoCircleOutlined /></el-icon>
              <p>{{ t('characters.setting.noSkills') }}</p>
            </div>
            <div v-else class="cwb-rail-list">
              <div v-for="skill in visibleSkills" :key="skill.id" class="cwb-cap-item"
                :class="{ 'is-off': allSkillsDisabled }">
                <div class="cwb-cap-item__main">
                  <div class="cwb-cap-item__name">
                    {{ skill.manifest?.name || skill.id }}
                    <el-tag v-if="skill.source === 'system'" type="success" size="small" effect="light">{{ t('characters.setting.sourceBuiltin') }}</el-tag>
                    <el-tag v-if="skill.manifest?.version" type="info" size="small" effect="plain">v{{ skill.manifest.version }}</el-tag>
                  </div>
                  <p class="cwb-cap-item__desc">{{ skill.manifest?.description || t('characters.setting.noDescription') }}</p>
                </div>
                <el-switch :model-value="getSkillEffectiveEnabled(skill)"
                  :loading="updatingSkills.has(skill.id)"
                  @update:model-value="(val) => handleSkillToggle(skill.id, val)" :disabled="allSkillsDisabled"
                  inline-prompt :active-text="t('common.enable')" :inactive-text="t('common.disable')" />
              </div>
            </div>
          </div>
        </section>

        <!-- 子代理 -->
        <section class="ax-panel">
          <header class="ax-panel__head">
            <span>{{ t('characters.wb.capsAgents') }}</span>
            <span class="ax-pill ax-pill--soft">{{ enabledAgentsCount }} / {{ presetCharacters.length }}</span>
          </header>
          <div class="ax-meter">
            <div class="ax-meter__head">
              <span>{{ t('characters.wb.meterLabel') }}</span>
              <span class="ax-mono">{{ pctText(enabledAgentsCount, presetCharacters.length) }}</span>
            </div>
            <div class="ax-meter__track">
              <div class="ax-meter__fill" :class="meterClass(enabledAgentsCount, presetCharacters.length)"
                :style="{ width: pct(enabledAgentsCount, presetCharacters.length) + '%' }"></div>
            </div>
          </div>
          <div class="ax-panel__body">
            <div class="cwb-swgrp">
              <div class="cwb-swgrp__row">
                <span class="cwb-swgrp__label">{{ t('characters.setting.toolToggle') }}</span>
                <el-switch :model-value="!allAgentsDisabled" @update:model-value="(v) => handleAllAgentsDisabledToggle(!v)" />
              </div>
            </div>
            <div v-if="loadingAgents" class="ax-empty">
              <el-icon class="is-loading" size="24"><LoadingOutlined /></el-icon>
              <p>{{ t('characters.setting.loadingAgents') }}</p>
            </div>
            <div v-else-if="presetCharacters.length === 0" class="ax-empty">
              <el-icon size="32"><InfoCircleOutlined /></el-icon>
              <p>{{ t('characters.setting.noAgents') }}</p>
            </div>
            <div v-else class="cwb-rail-list">
              <div v-for="char in presetCharacters" :key="char.id" class="cwb-cap-item"
                :class="{ 'is-off': allAgentsDisabled }">
                <div class="cwb-cap-item__main">
                  <div class="cwb-cap-item__name">{{ char.title }}</div>
                  <p class="cwb-cap-item__desc">{{ char.description || t('characters.setting.noDescription') }}</p>
                </div>
                <el-switch :model-value="getAgentEffectiveEnabled(char)"
                  @update:model-value="(val) => handleAgentToggle(char.id, val)" :disabled="allAgentsDisabled"
                  inline-prompt :active-text="t('common.enable')" :inactive-text="t('common.disable')" />
              </div>
            </div>
          </div>
        </section>

        <!-- 操作记录（07 舱 · Console 融合）：本会话能力开关 / 保存 / 撤销流水 -->
        <section class="ax-panel">
          <header class="ax-panel__head">
            <span>{{ t('characters.wb.logTitle') }}</span>
            <span class="ax-pill ax-pill--soft ax-mono">{{ capabilityLog.length }}</span>
          </header>
          <div class="ax-panel__body">
            <div v-if="capabilityLog.length === 0" class="ax-log__empty">{{ t('characters.wb.logEmpty') }}</div>
            <div v-else class="ax-log">
              <div v-for="(entry, idx) in capabilityLog" :key="idx" class="ax-log__item">
                <span class="ax-log__time ax-mono">{{ entry.time }}</span>
                <span class="ax-log__text">{{ entry.text }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </aside>
  </div>

    <!-- 形态管理：build 恒存不可删；key 建后不可改（历史会话与角色提示词引用着它） -->
    <ReDialog v-model="formDialogVisible" :title="t('characters.setting.formManageTitle')" width="560px"
      :close-on-click-modal="false" append-to-body>
      <ul class="form-manage-list">
        <li v-for="f in promptForms" :key="f.formKey" class="form-manage-item">
          <el-icon size="16" class="text-gray-500 dark:text-gray-400 shrink-0">
            <component :is="resolvePromptFormIcon(f.formIcon)" />
          </el-icon>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-medium truncate">{{ f.formName || f.formKey }}</span>
              <el-tag size="small" effect="plain" type="info">{{ f.formKey }}</el-tag>
              <el-tag v-if="f.builtin === 1" size="small" effect="plain" type="success">
                {{ t('characters.setting.formBuiltin') }}
              </el-tag>
            </div>
            <p class="text-xs text-gray-500 truncate">{{ f.formDescription || t('characters.setting.formNoDesc') }}</p>
          </div>
          <el-button link size="small" @click="startEditForm(f)">
            {{ t('common.edit') }}
          </el-button>
          <el-button v-if="f.builtin !== 1" link size="small" type="danger" @click="removePromptForm(f)">
            {{ t('common.delete') }}
          </el-button>
        </li>
      </ul>

      <el-divider />

      <div class="form-manage-editor">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm font-medium">{{ formDraft.editingKey ? t('characters.setting.formEditMode') : t('characters.setting.formAddMode') }}</span>
          <el-button v-if="formDraft.editingKey" link size="small" @click="resetFormDraft">
            {{ t('characters.setting.formAddMode') }}
          </el-button>
        </div>
        <el-form label-position="top" size="small">
          <div class="grid grid-cols-2 gap-x-3">
            <el-form-item :label="t('characters.setting.formKeyLabel')">
              <el-input v-model="formDraft.formKey" :disabled="!!formDraft.editingKey" placeholder="review" />
            </el-form-item>
            <el-form-item :label="t('characters.setting.formNameLabel')">
              <el-input v-model="formDraft.formName" :placeholder="t('characters.setting.formNamePlaceholder')" />
            </el-form-item>
          </div>
          <el-form-item :label="t('characters.setting.formIconLabel')">
            <el-select v-model="formDraft.formIcon" class="w-full">
              <el-option v-for="ic in PROMPT_FORM_ICON_CHOICES" :key="ic.key" :label="ic.label" :value="ic.key">
                <div class="flex items-center gap-2">
                  <el-icon size="15"><component :is="resolvePromptFormIcon(ic.key)" /></el-icon>
                  <span>{{ ic.label }}</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item :label="t('characters.setting.formDescLabel')">
            <el-input v-model="formDraft.formDescription" :placeholder="t('characters.setting.formDescPlaceholder')" />
          </el-form-item>
        </el-form>
      </div>

      <template #footer>
        <el-button type="primary" :loading="formSaving" :aria-label="formDraft.editingKey ? t('characters.setting.formSaveLabel') : t('characters.setting.formAddLabel')" @click="submitFormDraft">
          {{ formDraft.editingKey ? t('common.save') : t('common.add') }}
        </el-button>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - CharacterSettingPanel 组件复杂度高，临时使用@ts-nocheck
import { ref, reactive, watch, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox } from 'element-plus'
import ReDialog from '@repo/ui/re-dialog'
import { getLocale } from '@/locales'
import {
  ElForm,
  ElFormItem,
  ElInput,
  ElSelect,
  ElSlider,
  ElInputNumber,
  ElTooltip,
  ElCheckbox,
  ElIcon,
  ElButton,
  ElAlert,
  ElTag,
  ElCheckboxGroup,
  ElSwitch
} from 'element-plus'
import {
  InfoCircleOutlined,
  LoadingOutlined,
  UserOutlined,
  MessageOutlined,
  ToolOutlined,
  ApiOutlined,
  CloseOutlined,
  FolderOutlined,
  ThunderboltOutlined
} from '@vicons/antd'

import { Code24Regular, Bot24Regular, BrainCircuit20Regular, GlobeShield20Regular, Settings20Regular } from '@vicons/fluent'

import { apiService } from '../../services/ApiService'


import { usePopup } from '../../composables/usePopup'
import AvatarPreview from '../ui/AvatarPreview.vue'
import SegmentedToggle from '../ui/SegmentedToggle.vue'
// 工作台令牌桥 + 共享原子（--ax-* → koi 令牌，暗色由 html.dark 自动生效）
import './workbench.css'
import { DEFAULT_SUMMARY_MODE } from '@/constants'
import type { PromptForm } from '@/services/modules/character.api'
import { resolvePromptFormIcon, PROMPT_FORM_ICON_CHOICES } from '@/utils/promptFormIcons'

const { toast, notify } = usePopup()
const { t } = useI18n()

// 工具栏目"全部禁用/自定义"分段按钮选项
const autoEnableOptions = computed(() => [
  { label: t('characters.setting.autoEnable'), value: false },
  { label: t('characters.setting.keepDisabled'), value: true }
])

// Slider 百分比格式化函数
const formatSliderTooltip = (val: number): string => {
  return `${Math.round(val * 100)}%`;
};

// Props
const props = defineProps({
  data: {
    type: Object,
    default: () => ({
      id: '',
      title: '',
      description: '',
      avatarUrl: '',
      settings: {
        assistantName: '',
        assistantIdentity: '',
        systemPrompt: '',
        modelId: '',
        memoryType: null
      }
    })
  },
  isNew: {
    type: Boolean,
    default: false
  },
  saving: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:data', 'save', 'use', 'remove'])

// 响应式数据
// 只按 code 认内置通用助手：主键会被种子角色占用，按 id 判定会误伤（见 CharacterListTab 同口径）
const isGenericAssistant = computed(() =>
  props.data?.code === 'general-assistant' || props.data?.sysAiRoleCode === 'general-assistant'
)
const pageLoading = ref(false)

// 模型数据
const models = ref([]);
const providers = ref([]);

// 表单引用
const basicFormRef = ref(null)
const promptFormRef = ref(null)

// 初始表单数据对照（用于检测是否有未保存的变更）
// 在 loadAllData 全部就绪后记录
// 必须用 ref，否则 hasChanges computed 无法追踪变化
const _initialFormData = ref<any>(null)

// 深度比较两个值（忽略对象 key 顺序）
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((v, i) => deepEqual(v, b[i]))
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a), kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    return ka.every(k => k in b && deepEqual(a[k], b[k]))
  }
  return a === b
}

// 原始数据快照（撤销时按它还原表单）
const _initialRawData = ref<any>(null)

// ---------- 提示词形态 ----------
// 形态由角色配置维护（/v2/prompt-forms），可在 build / plan 之外自定义更多。
// build 恒存，继续编辑 characterForm.systemPrompt（sys_ai_role 历史列），
// 因此存量角色无需迁移即可工作；其余形态落在 sys_ai_role_prompt 表。
const FORM_KEY_BUILD = 'build'
const FORM_KEY_PLAN = 'plan'

/** 内置兜底形态：接口不可用时也要能编辑，别把用户挡在门外。
 *  通用助手（id=1）固定提供 build + plan（用户原话），与后端种子同口径：
 *  V4.0.0.49 build/构建/flash/直接执行 + plan/规划/clipboard/先出方案。 */
const FALLBACK_FORMS: PromptForm[] = [{
  formKey: FORM_KEY_BUILD,
  formName: t('characters.setting.formBuildName'),
  formIcon: 'flash',
  formDescription: t('characters.setting.formBuildDesc'),
  builtin: 1,
  formSort: 1,
}, {
  formKey: FORM_KEY_PLAN,
  formName: t('characters.setting.formPlanName'),
  formIcon: 'clipboard',
  formDescription: t('characters.setting.formPlanDesc'),
  builtin: 1,
  formSort: 2,
}]

/** 形态定义列表 */
const promptForms = ref<PromptForm[]>([...FALLBACK_FORMS])
/** 当前选中的形态 key */
const promptModeValue = ref<string>(FORM_KEY_BUILD)

/** 当前选中的形态对象；被删掉的形态回落到 build，避免指向虚空 */
const activePromptForm = computed<PromptForm>(
  () => promptForms.value.find(f => f.formKey === promptModeValue.value) || promptForms.value[0] || FALLBACK_FORMS[0]
)

/** 当前形态是否为 build（决定编辑历史列还是分形态表） */
const isBuildForm = computed(() => activePromptForm.value.formKey === FORM_KEY_BUILD)

/** 形态切换器选项。形态多了用下拉而不是分段控件，否则一行挤不下 */
const formOptions = computed(() => promptForms.value.map(f => ({ label: f.formName || f.formKey, value: f.formKey })))

/** 当前形态的正文草稿（仅非 build 形态使用） */
const formPromptDraft = ref('')

/** 当前形态的图标组件（与会话切换器复用同一份注册表，保证两处观感一致） */
const activeFormIcon = computed(() => resolvePromptFormIcon(activePromptForm.value.formIcon))
/** 该角色在当前形态下是否已配置独立行（false = 继承） */
const formPromptFromTable = ref(false)
/** 当前形态的行是否启用 */
const formPromptEnabled = ref(true)
/** 分形态接口是否可用（后端未部署 / 未迁移时不打扰用户） */
const rolePromptsAvailable = ref(true)
const formPromptSaving = ref(false)
/** 原始正文，用于判断是否变脏 */
const formPromptOriginal = ref('')

/**
 * 拉取形态定义。
 *
 * <p>失败时保留内置 build 单项：build 恒存，接口挂了也不该让角色提示词整块不可编辑。</p>
 */
const loadPromptForms = async () => {
  try {
    const list = await apiService.fetchPromptForms()
    const forms = Array.isArray(list) ? list : []
    if (forms.length || isGenericAssistant.value) {
      // 通用助手固定提供 build/plan：后端形态表只回 build 时也不能丢掉 plan。
      const ensured = isGenericAssistant.value
        ? [...forms, ...FALLBACK_FORMS.filter(f => !forms.some(x => x.formKey === f.formKey))]
        : forms
      promptForms.value = ensured
      if (!ensured.some(f => f.formKey === promptModeValue.value)) {
        promptModeValue.value = FORM_KEY_BUILD
      }
      // 形态列表可能晚于角色数据到达（onMounted 与 props.data watch 是两条异步链），
      // 此时 loadRolePrompts 看到的只有兜底的 build，需要按完整列表重跑一次回填。
      if (characterForm.id) {
        await loadRolePrompts(String(characterForm.id))
      }
    }
  } catch (e: any) {
    // 形态列表拉不到时保留内置 build：build 恒存，接口异常也不该让整块提示词不可编辑
    promptForms.value = [...FALLBACK_FORMS]
  }
}

/** 切换形态：把上一形态的草稿留档，切回来时不丢 */
const formDrafts = ref<Record<string, { draft: string; fromTable: boolean; enabled: boolean }>>({})

/**
 * 各形态「落库时的正文」，用于判断某个形态是否被改脏。
 *
 * <p>不能只看当前形态：用户可以在多个形态间来回编辑，保存时必须逐个形态比对，
 * 否则只有最后停留的那个会被写入，其余形态的改动会静默丢失。</p>
 */
const formOriginals = ref<Record<string, string>>({})

/** 把当前形态的编辑态存进草稿表（切换形态、关闭面板、提交前都要做） */
const stashActiveFormDraft = () => {
  if (isBuildForm.value) return
  formDrafts.value[promptModeValue.value] = {
    draft: formPromptDraft.value,
    fromTable: formPromptFromTable.value,
    enabled: formPromptEnabled.value,
  }
}

const handleFormChange = (formKey: string) => {
  stashActiveFormDraft()
  promptModeValue.value = formKey
  const cached = formDrafts.value[formKey]
  formPromptDraft.value = cached?.draft ?? ''
  formPromptFromTable.value = cached?.fromTable ?? false
  formPromptEnabled.value = cached?.enabled ?? true
  formPromptOriginal.value = formOriginals.value[formKey] ?? ''
}

/** 加载角色的分形态提示词配置（一次取全部形态） */
const loadRolePrompts = async (roleId: string) => {
  formDrafts.value = {}
  formOriginals.value = {}
  formPromptDraft.value = ''
  formPromptOriginal.value = ''
  formPromptFromTable.value = false
  if (!roleId) return
  try {
    const res = await apiService.fetchRolePrompts(String(roleId))
    if (res?.error) {
      rolePromptsAvailable.value = false
      return
    }
    const modes = res?.modes || {}
    rolePromptsAvailable.value = true
    // 只有 build 走历史列，其余形态落到分形态表——这里统一按形态回填草稿
    for (const f of promptForms.value) {
      if (f.formKey === FORM_KEY_BUILD) continue
      const entry = modes[f.formKey]
      formDrafts.value[f.formKey] = {
        draft: entry?.content || '',
        fromTable: entry?.fromTable === true,
        enabled: entry?.enabled !== false,
      }
      // 记下服务端返回的正文，作为该形态「未改动」的基准
      formOriginals.value[f.formKey] = entry?.content || ''
    }
    // 当前选中形态的草稿立即生效，否则切到该形态时看到的是空
    const cur = formDrafts.value[promptModeValue.value]
    if (cur) {
      formPromptDraft.value = cur.draft
      formPromptOriginal.value = formOriginals.value[promptModeValue.value] ?? cur.draft
      formPromptFromTable.value = cur.fromTable
      formPromptEnabled.value = cur.enabled
    }
  } catch (e: any) {
    // 后端未部署该接口时静默降级：build 形态不受影响，其余形态退回继承。
    rolePromptsAvailable.value = false
    formPromptFromTable.value = false
  }
}

/**
 * 某个形态的提示词已落库：更新它的基准正文与草稿。
 *
 * @param formKey 形态标识
 * @param draft   已保存的正文
 * @param enabled 是否启用
 */
const commitFormDraft = (formKey: string, draft: string, enabled: boolean) => {
  formOriginals.value[formKey] = draft
  formDrafts.value[formKey] = { draft, fromTable: true, enabled }
  // 只有当前形态的编辑态需要跟着改，否则会把别的形态的输入框内容顶掉
  if (formKey === promptModeValue.value) {
    formPromptOriginal.value = draft
    formPromptFromTable.value = true
    formPromptEnabled.value = enabled
  }
}

/** 清除当前形态的提示词，回退到继承 */
const handleResetFormPrompt = async () => {
  if (!characterForm.id) return
  formPromptSaving.value = true
  try {
    const key = promptModeValue.value;
    const ok = await apiService.deleteRolePrompt(String(characterForm.id), key)
    if (ok) {
      formPromptDraft.value = ''
      formPromptOriginal.value = ''
      formPromptFromTable.value = false
      formPromptEnabled.value = true
      formOriginals.value[key] = ''
      formDrafts.value[key] = { draft: '', fromTable: false, enabled: true }
      toast.success(`已清除「${activePromptForm.value.formName}」提示词，将回退到继承`)
    } else {
      toast.error('清除失败')
    }
  } catch (e: any) {
    toast.error('清除失败')
  } finally {
    formPromptSaving.value = false
  }
}

/** 脏检查：当前形态正文是否被改过且尚未落库 */
const formPromptDirty = computed(
  () => !isBuildForm.value && formPromptDraft.value !== formPromptOriginal.value
)

/**
 * 是否存在「改过但还没落库」的分形态提示词。
 *
 * <p>分形态提示词走独立接口、不在 {@code getFormData} 里，所以只看角色主体数据的话，
 * 用户在这个输入框里打完字，父组件的「应用全部设置」仍然是禁用的——内容根本存不进去。
 * 这里把每个形态都跟它自己的基准正文比一遍。</p>
 */
const anyFormPromptDirty = computed(() => {
  // 当前形态以输入框里的实时内容为准——草稿表要等切换形态时才同步，
  // 只看草稿表会漏掉「正在编辑、还没切走」的那一个
  if (formPromptDirty.value) return true
  return Object.keys(formDrafts.value).some(
    key => key !== FORM_KEY_BUILD && formDrafts.value[key].draft !== (formOriginals.value[key] ?? '')
  )
})

/**
 * 保存指定（非 build）形态的提示词。
 *
 * @param roleId  角色主键
 * @param formKey 形态标识
 * @param draft   正文
 * @param enabled 是否启用
 * @returns 是否保存成功
 */
const saveFormPrompt = async (roleId: string, formKey: string, draft: string, enabled: boolean): Promise<boolean> => {
  if (!rolePromptsAvailable.value) return true
  if (formKey === FORM_KEY_BUILD) return true
  try {
    const ok = await apiService.saveRolePrompt(roleId, formKey, {
      content: draft,
      enabled,
    })
    if (ok) {
      commitFormDraft(formKey, draft, enabled)
    }
    return ok === true
  } catch (e: any) {
    return false
  }
}

// 表单数据
const characterForm = reactive({
  id: '',
  title: '',
  description: '',
  avatarUrl: '',
  avatarFile: null,
  groupId: null,  // 新增：分组 ID
  assistantName: '',
  assistantIdentity: '',
  systemPrompt: '',
  modelId: null,
  memoryType: '',
  enabledTools: [],  // 启用的本地工具
  toolsMode: 'inherit',
  enabledSkills: {},       // 按角色启用的技能 { skillId: true/false }
  skillsMode: 'inherit',  // Skills 模式: 'inherit' | 'custom' | 'disabled'
  compressionTriggerRatio: 0.8, // 触发阈值
  compressionTargetRatio: 0.5, // 保留目标
  summaryMode: DEFAULT_SUMMARY_MODE, // 摘要模式：'disabled' | 'fast' | 'memory_sync'
  defaultThink: false, // 默认开启深度思考
  defaultSearch: false, // 默认开启在线检索
})

// 验证规则
const basicRules = computed(() => ({
  title: [
    { required: true, message: t('characters.setting.titleRequired'), trigger: ['input', 'blur'] },
    { min: 2, max: 20, message: t('characters.setting.titleLength'), trigger: ['input', 'blur'] }
  ]
}))

const promptRules = {}

// 选项数据
// const modelOptions = [
//     { label: '默认/不设置', value: '' },
//     { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
//     { label: 'GPT-4', value: 'gpt-4' },
//     { label: 'Claude 2', value: 'claude-2' },
//     { label: 'Llama 2', value: 'llama-2' }
// ]

const memoryOptions = computed(() => [
  { label: t('characters.setting.memorySlidingWindow'), value: 'sliding_window' },
  { label: t('characters.setting.memorySummaryAugmented'), value: 'summary_augmented_sliding_window' },
  { label: t('characters.setting.memorySlidingWindowWithRag'), value: 'sliding_window_with_rag' },
  { label: t('characters.setting.memoryless'), value: 'memoryless' }
]);

// 模型选择选项（按供应商分组）
const modelOptions = computed(() => {
  if (!models.value.length || !providers.value.length) return []

  const options = []

  // 添加"使用默认模型"选项
  options.push({
    label: t('characters.setting.modelUseDefault'),
    value: '',
    key: 'default'
  })

  providers.value?.forEach(provider => {
    // 获取该供应商下的text类型模型
    const providerModels = models.value.filter(model =>
      model.providerId === provider.id && model.modelType === 'text'
    )

    if (providerModels.length > 0) {
      // 添加分组标签
      options.push({
        label: provider.name,
        value: provider.id,
        key: provider.id,
        disabled: true,
      })

      // 添加该分组下的模型选项
      providerModels.forEach(model => {
        options.push({
          label: model.modelName,
          value: model.id,
          key: model.id
        })
      })
    }
  })
  return options
})

// MCP 禁用列表（不在列表中的 MCP 服务器默认启用）
const mcpDeniedServers = ref<string[]>([]);

// MCP 服务器数据
const mcpServers = ref([]);

// Skills 数据
const skillsList = ref([]);
const loadingSkills = ref(false);
const updatingSkills = ref(new Set());

// 角色分组数据
const characterGroups = ref([]);

// 本地工具数据
const localTools = ref([]);

// 角色工具设置（pluginId -> boolean | 'all'）
const characterToolSettings = ref({});

// 是否全部禁用本地工具
const allDisabled = ref(false);
// 是否白名单模式（新插件默认不启用）
const allowlistMode = ref(false);
// 是否全部禁用 MCP
const allMcpDisabled = ref(false);
// MCP 白名单模式（新服务器默认不开启）
const mcpAllowlistMode = ref(false);
// MCP 白名单列表（允许的服务器 ID）
const mcpAllowlistServers = ref<string[]>([]);
// 是否全部禁用 Skills
const allSkillsDisabled = ref(false);
// Skills 白名单模式（新技能默认不开启）
const skillsAllowlistMode = ref(false);
// 通用子代理（虚拟角色，不出现在角色列表中）
const GENERIC_AGENT = computed(() => ({
  id: 'generic',
  title: t('characters.setting.genericAgentTitle'),
  description: t('characters.setting.genericAgentDesc'),
}));
// 是否全部禁用子代理
const allAgentsDisabled = ref(false);
// 助手偏好 { characterId: true/false }
const enabledAgents = reactive<Record<string, boolean>>({});
// 子代理列表（排除当前角色，含虚拟通用子代理）
const presetCharacters = ref<any[]>([]);
const loadingAgents = ref(false);




// 是否自动启用全部工具
const allToolsEnabled = computed(() => {
  // 如果角色工具配置为 true，则认为启用了全部工具
  return characterToolSettings.value === true;
});

// 计算技能的最终显示状态（不受模式影响，始终 = 用户显式值 → 全局继承）
const getSkillEffectiveEnabled = (skill) => {
  if (skill.id in characterForm.enabledSkills) {
    return characterForm.enabledSkills[skill.id];
  }
  // 白名单模式：未显式启用的技能（含面板打开后新出现的技能）一律视为关闭，
  // 与 loadAllData 的初始化口径一致，避免新技能绕过白名单默认点亮
  if (skillsAllowlistMode.value) {
    return false;
  }
  return skill.enabled !== false;
};

// 角色面板可见的技能
const visibleSkills = computed(() => {
  // 强制追踪模式切换依赖，确保技能列表随白名单/黑名单切换重渲染
  void skillsAllowlistMode.value;
  // 全部禁用模式下仍然展示所有技能（灰色不可操作状态）
  return skillsList.value.filter(skill => {
    // 全局禁用的技能，但角色级覆盖启用了 → 显示
    if (skill.enabled === false) {
      if (characterForm.skillsMode === 'custom' && characterForm.enabledSkills[skill.id] === true) {
        return true;
      }
      return false;
    }
    return true;
  });
});

// 判断某个工具提供者是否启用（用于 Switch 显示）
const isToolProviderEnabled = (pluginId) => {
  // 优先读取角色稳定的工具偏好，避免主开关切换时后端重查导致开关跟随变化；
  // 主开关只负责灰显，不改变单个工具开关的原有状态。
  if (pluginId in characterToolSettings.value) {
    return characterToolSettings.value[pluginId];
  }
  const tool = localTools.value.find(t => t.pluginId === pluginId);
  return tool ? tool.enabled : false;
};

// 判断 MCP 服务器是否启用（根据当前模式）
const isMcpServerEnabled = (serverId) => {
  if (mcpAllowlistMode.value) {
    // 白名单：在白名单列表中才显示启用
    return mcpAllowlistServers.value.includes(serverId);
  }
  // 黑名单：不在拒绝列表中才显示启用
  return !mcpDeniedServers.value.includes(serverId);
};

// 右栏能力清单的「已启用 / 总数」计数（总开关关闭时恒为 0，与面板体灰显状态一致）
const enabledLocalToolsCount = computed(() =>
  allDisabled.value ? 0 : localTools.value.filter(t => isToolProviderEnabled(t.pluginId)).length
)
const enabledMcpCount = computed(() =>
  allMcpDisabled.value ? 0 : mcpServers.value.filter(s => isMcpServerEnabled(s.id)).length
)
const enabledSkillsCount = computed(() =>
  allSkillsDisabled.value ? 0 : visibleSkills.value.filter(s => getSkillEffectiveEnabled(s)).length
)
const enabledAgentsCount = computed(() =>
  allAgentsDisabled.value ? 0 : presetCharacters.value.filter(c => getAgentEffectiveEnabled(c)).length
)

// ── 07 舱 · Console 融合：能力度量与操作记录 ──
const pct = (on: number, total: number): number =>
  total > 0 ? Math.round((on / total) * 100) : 0;
const pctText = (on: number, total: number): string =>
  total > 0 ? `${pct(on, total)}%` : '—';
const dialStyle = (on: number, total: number) => ({ '--dial-pct': pct(on, total) });
const dialClass = (on: number, total: number) =>
  total <= 0 || on <= 0 ? ['ax-dial--zero'] : on >= total ? ['ax-dial--full'] : [];
const meterClass = (on: number, total: number) =>
  total <= 0 || on <= 0 ? 'ax-meter__fill--zero' : on >= total ? 'ax-meter__fill--full' : '';

// 操作记录：只记录本会话内的真实动作（能力开关 / 保存提交 / 撤销），不造历史数据
const capabilityLog = ref<Array<{ time: string; text: string }>>([]);
const logCapability = (text: string) => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  capabilityLog.value.unshift({ time, text });
  if (capabilityLog.value.length > 8) capabilityLog.value.length = 8;
};

// 应用角色数据到表单（props.data watch 与「撤销」resetChanges 复用同一份归一化逻辑）
const applyCharacterData = (newVal: any, oldVal?: any) => {
  // 检测是否是角色切换（id 变化）、初始化，或从已有角色进入「新建」空白态。
  // newVal 无 id 而表单还留着上个角色的 id 时也按切换处理，
  // 否则头像文件、分形态草稿等残留会串到新建的角色上。
  const isCharacterSwitch = String(newVal?.id ?? '') !== String(characterForm.id ?? '');

  if (isCharacterSwitch) {
    characterForm.avatarFile = null;
  }

  characterForm.id = newVal.id || '';
  characterForm.title = newVal.title || '';
  characterForm.description = newVal.description || '';
  characterForm.avatarUrl = newVal.avatarUrl || '';
  // groupId: null 或 undefined 转换为空字符串，以便 el-select 正确显示
  characterForm.groupId = newVal.groupId || '';  // 加载分组 ID
  characterForm.modelId = newVal.modelId || '';

  characterForm.assistantName = newVal.settings?.assistantName || '';
  characterForm.assistantIdentity = newVal.settings?.assistantIdentity || '';
  characterForm.systemPrompt = newVal.settings?.systemPrompt || newVal.systemPrompt || '';
  if (isCharacterSwitch) {
    loadRolePrompts(characterForm.id);
  }
  characterForm.memoryType = newVal.settings?.memoryType || 'sliding_window';

  // 从 memory 分组加载记忆与压缩配置
  const memoryConfig = newVal.settings?.memory || {};
  characterForm.compressionTriggerRatio = memoryConfig.compressionTriggerRatio ?? newVal.settings?.compressionTriggerRatio ?? 0.8;
  characterForm.compressionTargetRatio = memoryConfig.compressionTargetRatio ?? newVal.settings?.compressionTargetRatio ?? 0.5;
  characterForm.summaryMode = memoryConfig.summaryMode ?? DEFAULT_SUMMARY_MODE;
  // 默认能力（深度思考 / 在线检索），缺省关闭
  const capabilities = newVal.settings?.capabilities || {};
  characterForm.defaultThink = capabilities.defaultThink === true;
  characterForm.defaultSearch = capabilities.defaultSearch === true;
  // 加载已启用的插件
  characterForm.enabledTools = newVal.settings?.plugins || [];
  // 加载角色插件设置（新格式：{ pluginId: { enabled: true/false } }）
  let pluginsConfig = newVal.settings?.plugins;
  // 向后兼容：旧数据使用 tools 字段
  if (pluginsConfig === undefined) {
    pluginsConfig = newVal.settings?.tools;
  }
  if (typeof pluginsConfig === 'object' && pluginsConfig !== null && !Array.isArray(pluginsConfig)) {
    // 读取策略 → 全部禁用开关
    const strategy = pluginsConfig?.__strategy;
    allDisabled.value = strategy === 'deny_nonsystem';
    // 读取白名单模式：__default === false 表示白名单
    allowlistMode.value = pluginsConfig?.__default === false;
    characterToolSettings.value = {};
    for (const [pluginId, cfg] of Object.entries(pluginsConfig)) {
      if (pluginId === '__strategy' || pluginId === '__default') continue;
      if (typeof cfg === 'object' && cfg !== null) {
        characterToolSettings.value[pluginId] = (cfg as Record<string, unknown>).enabled !== false;
      } else {
        characterToolSettings.value[pluginId] = cfg === true;
      }
    }
  } else {
    // undefined / null / true → 继承全局
    // 继承全局
    characterToolSettings.value = {};
  }
  // 加载 MCP 配置（黑白名单兼容）
  const mcpPluginsCfg = newVal.settings?.plugins?.mcp;
  const mcpDeny = mcpPluginsCfg?.toolkits_deny;
  mcpDeniedServers.value = mcpDeny
    ? mcpDeny.map((id: string) => id.replace(/^mcp_/, ''))
    : [];
  const mcpAllow = mcpPluginsCfg?.toolkits_allow;
  mcpAllowlistServers.value = mcpAllow
    ? mcpAllow.map((id: string) => id.replace(/^mcp_/, ''))
    : [];
  mcpAllowlistMode.value = mcpPluginsCfg?.toolkits_filter === 'allow';
  allMcpDisabled.value = mcpPluginsCfg?.enabled === false;

  // 加载角色技能偏好
  // 全部禁用：从 plugins.skill.enabled 读取
  allSkillsDisabled.value = newVal.settings?.plugins?.skill?.enabled === false;
  // 白名单模式：从 skills.__default 读取
  const skillsConfig = newVal.settings?.skills;
  skillsAllowlistMode.value = skillsConfig?.__default === false;
  // 单项偏好：从 skills 读取（过滤 __default 系统字段）
  if (typeof skillsConfig === 'object' && !Array.isArray(skillsConfig)) {
    characterForm.enabledSkills = {};
    for (const [skillId, val] of Object.entries(skillsConfig)) {
      if (skillId === '__default') continue;
      characterForm.enabledSkills[skillId] = val;
    }
  } else {
    characterForm.enabledSkills = {};
  }

  // 加载子代理偏好（固定白名单：仅显式 true 的角色被启用）
  // 默认禁用：无配置时 allAgentsDisabled = true
  allAgentsDisabled.value = newVal.settings?.plugins?.sub_agent?.enabled !== true;
  const agentsConfig = newVal.settings?.agents;
  // 重建 enabledAgents
  for (const key of Object.keys(enabledAgents)) delete enabledAgents[key];
  if (typeof agentsConfig === 'object' && !Array.isArray(agentsConfig)) {
    for (const [key, val] of Object.entries(agentsConfig)) {
      if (key === '__default' || key.startsWith('__')) continue;
      enabledAgents[key] = val as boolean;
    }
  }

  // 首次加载（新建或真实数据到达）→ 触发统一数据加载
  if (props.isNew || (newVal?.id && !oldVal?.id)) {
    loadAllData();
  }
}

const handleAvatarChanged = (file) => {
  characterForm.avatarFile = file
}

// MCP 服务器开关切换处理（根据当前模式决定存到拒绝列表或允许列表）
const handleMcpServerToggle = (serverId, enabled) => {
  if (mcpAllowlistMode.value) {
    // 白名单：启用时加入允许列表，禁用时移出
    const index = mcpAllowlistServers.value.indexOf(serverId);
    if (enabled && index === -1) {
      mcpAllowlistServers.value.push(serverId);
    } else if (!enabled && index !== -1) {
      mcpAllowlistServers.value.splice(index, 1);
    }
  } else {
    // 黑名单：禁用时加入拒绝列表，启用时移出
    const index = mcpDeniedServers.value.indexOf(serverId);
    if (!enabled && index === -1) {
      mcpDeniedServers.value.push(serverId);
    } else if (enabled && index !== -1) {
      mcpDeniedServers.value.splice(index, 1);
    }
  }
  const serverName = mcpServers.value.find(s => s.id === serverId)?.name || serverId;
  logCapability(`${enabled ? t('characters.wb.logEnable') : t('characters.wb.logDisable')} · ${t('characters.wb.capsMcp')} / ${serverName}`);
}

// ── Skills 切换 ──
const handleSkillToggle = (skillId, enabled) => {
  characterForm.enabledSkills[skillId] = enabled;
  characterForm.enabledSkills = { ...characterForm.enabledSkills };
  const skill = skillsList.value.find(s => s.id === skillId);
  const skillName = skill?.manifest?.name || skillId;
  logCapability(`${enabled ? t('characters.wb.logEnable') : t('characters.wb.logDisable')} · ${t('characters.wb.capsSkills')} / ${skillName}`);
};

// ── 子代理 ──
const getAgentEffectiveEnabled = (char) => {
  return enabledAgents[char.id] ?? false;
};
const handleAgentToggle = (charId, enabled) => {
  enabledAgents[charId] = enabled;
  const agentName = presetCharacters.value.find(c => c.id === charId)?.title || charId;
  logCapability(`${enabled ? t('characters.wb.logEnable') : t('characters.wb.logDisable')} · ${t('characters.wb.capsAgents')} / ${agentName}`);
};
const handleAllAgentsDisabledToggle = async (val) => {
  allAgentsDisabled.value = val;
  logCapability(`${val ? t('characters.wb.logAllOff') : t('characters.wb.logAllOn')} · ${t('characters.wb.capsAgents')}`);
};
const loadPresetCharacters = async () => {
  loadingAgents.value = true;
  try {
    const response = await apiService.fetchCharacters();
    const allChars = response.items || [];
    // 排除当前正在编辑的角色，并在列表开头插入虚拟通用子代理
    presetCharacters.value = [
      GENERIC_AGENT.value,
      ...allChars.filter(c => c.id !== characterForm.id),
    ];
  } catch (err) {
    console.error('加载子代理失败:', err);
  } finally {
    loadingAgents.value = false;
  }
};

// 统一加载所有异步数据（并行请求，全部就绪后记录初始快照）
async function loadAllData() {
  pageLoading.value = true
  try {
    const [modelsResp, mcpsResp, skillsResp, groupsResp, charsResp] = await Promise.all([
      apiService.fetchModels(),
      apiService.getMcpServers(),
      apiService.fetchSkills(),
      apiService.fetchCharacterGroups(),
      apiService.fetchCharacters(),
      loadLocalTools(),
    ])

    // 模型
    models.value = []
    providers.value = []
    modelsResp.items.forEach((provider: any) => {
      models.value.push(...provider.models)
      delete provider.models
      providers.value.push(provider)
    })

    // MCP 服务器
    mcpServers.value = mcpsResp.items.filter((s: any) => s.enabled)

    // Skills
    skillsList.value = Array.isArray(skillsResp?.items)
      ? skillsResp.items.filter((s: any) => s.enabled !== false)
      : []
    if (skillsAllowlistMode.value) {
      for (const skill of skillsList.value) {
        if (!(skill.id in characterForm.enabledSkills)) {
          characterForm.enabledSkills[skill.id] = false
        }
      }
    }

    // 角色分组
    characterGroups.value = groupsResp

    // 子代理列表（排除当前角色 + 通用虚拟子代理）
    const allChars = charsResp.items || []
    presetCharacters.value = [
      GENERIC_AGENT.value,
      ...allChars.filter((c: any) => c.id !== characterForm.id),
    ]

    // 所有数据就绪后记录初始快照
    _initialFormData.value = getFormData()
  } catch (err) {
    console.error('加载角色设置数据失败', err)
  } finally {
    pageLoading.value = false
  }
}

// 角色切换时刷新子代理列表（操作记录跟随当前助手，切换即清空）
watch(() => characterForm.id, () => {
  capabilityLog.value = [];
  if (characterForm.id) {
    loadPresetCharacters();
  }
})

// 全部禁用开关切换处理
const handleAllDisabledToggle = async (val) => {
  allDisabled.value = val;
  logCapability(`${val ? t('characters.wb.logAllOff') : t('characters.wb.logAllOn')} · ${t('characters.wb.capsLocalTools')}`);
  await loadLocalTools();
};

const handleAllMcpDisabledToggle = async (val) => {
  allMcpDisabled.value = val;
  logCapability(`${val ? t('characters.wb.logAllOff') : t('characters.wb.logAllOn')} · ${t('characters.wb.capsMcp')}`);
  await loadMCPServers();
};

const handleAllSkillsDisabledToggle = async (val) => {
  allSkillsDisabled.value = val;
  logCapability(`${val ? t('characters.wb.logAllOff') : t('characters.wb.logAllOn')} · ${t('characters.wb.capsSkills')}`);
};

// 加载本地工具列表
async function loadLocalTools() {
  try {
    // 根据当前 UI 状态动态构建查询配置
    // 不等于全部禁用时，按当前模式从内存状态构建查询
    if (!allDisabled.value) {
      const queryConfig: any = {};
      queryConfig.__strategy = 'custom';
      queryConfig.__default = allowlistMode.value ? false : true;

      // 从当前内存状态（characterToolSettings）构建，按模式过滤
      for (const [pluginId, enabled] of Object.entries(characterToolSettings.value)) {
        if (allowlistMode.value) {
          // 白名单：只传 enabled: true
          if (enabled) queryConfig[pluginId] = { enabled: true };
        } else {
          // 黑名单：只传 enabled: false
          if (!enabled) queryConfig[pluginId] = { enabled: false };
        }
      }

      const response = await apiService.queryPlugins(queryConfig, getLocale());

      // API 返回 plugins[]，每个元素含 enabled 有效状态
      const plugins = response.plugins || [];

      // 本地工具列表：后端已过滤 system 插件，此处只排除全局关闭的
      localTools.value = plugins.filter(p => !(p.effective === 'global' && !p.enabled));

      // 正常模式：初始化 characterToolSettings
      const stored = { ...characterToolSettings.value };
      characterToolSettings.value = {};
      for (const tool of localTools.value) {
        characterToolSettings.value[tool.pluginId] = stored[tool.pluginId] ?? tool.enabled;
      }
    } else {
      // 全部禁用时，不传 __default 和具体条目，只传 strategy
      const response = await apiService.queryPlugins({
        __strategy: 'deny_nonsystem',
      }, getLocale());

      const plugins = response.plugins || [];
      localTools.value = plugins.filter(p => !(p.effective === 'global' && !p.enabled));
    }
  } catch (error) {
    console.error('加载本地工具失败:', error);
    toast.error(t('characters.setting.loadLocalToolsFailed'));
  }
}

// 全部工具开关切换处理
const handleAllToolsToggle = (enabled) => {
  // 直接设置为布尔值，保存到数据库时也是布尔值
  characterToolSettings.value = enabled;
  console.log(`角色工具整体${enabled ? '启用' : '禁用'}`);
}

// 本地工具开关切换处理
const handleLocalToolToggle = (pluginId, enabled) => {
  // 从全部禁用模式切换到正常模式
  if (allDisabled.value) {
    allDisabled.value = false;
    characterToolSettings.value = {};
  }
  characterToolSettings.value[pluginId] = enabled;
  const toolName = localTools.value.find(tl => tl.pluginId === pluginId)?.displayName || pluginId;
  logCapability(`${enabled ? t('characters.wb.logEnable') : t('characters.wb.logDisable')} · ${t('characters.wb.capsLocalTools')} / ${toolName}`);
}

const loadModels = async () => {
  try {
    const response = await apiService.fetchModels()

    response.items.forEach(provider => {
      models.value.push(...provider.models)
      delete provider.models
      providers.value.push(provider)
    })

  } catch (error) {
    console.error('获取模型列表失败:', error)
    notify.error(t('characters.setting.loadModelsFailed'), error)
  }
}

const loadMCPServers = async () => {
  try {
    const response = await apiService.getMcpServers()
    // 只显示已启动的服务器
    mcpServers.value = response.items.filter(server => server.enabled)
  } catch (error) {
    console.error('获取 MCP 服务器列表失败:', error)
  }
}

// 监听 MCP 白名单模式切换 → 迁移当前状态，保持 UI 不变
watch(mcpAllowlistMode, (newMode) => {
  if (mcpServers.value.length === 0) return;
  if (newMode) {
    // 切换为白名单：当前启用中的服务器变为允许列表
    const enabledServers = mcpServers.value
      .filter(s => !mcpDeniedServers.value.includes(s.id))
      .map(s => s.id);
    mcpAllowlistServers.value = enabledServers;
    mcpDeniedServers.value = [];
  } else {
    // 切换为黑名单：当前禁用中的服务器变为拒绝列表
    const disabledServers = mcpServers.value
      .filter(s => !mcpAllowlistServers.value.includes(s.id))
      .map(s => s.id);
    mcpDeniedServers.value = disabledServers;
    mcpAllowlistServers.value = [];
  }
});

const findModelById = (modelId) => {
  return models.value.find(model => model.id === modelId)
}

// localTools 加载完成后，自定义模式下初始化 characterToolSettings
watch(localTools, (tools) => {
  if (!allDisabled.value && tools.length > 0) {
    const stored = { ...characterToolSettings.value };
    characterToolSettings.value = {};
    for (const tool of tools) {
      const defaultEnabled = allowlistMode.value ? false : tool.enabled;
      characterToolSettings.value[tool.pluginId] = stored[tool.pluginId] ?? defaultEnabled;
    }
  }
});

// 监听白名单模式切换 → 本地翻转，不查询后端
watch(allowlistMode, () => {
  if (allDisabled.value || localTools.value.length === 0) return;
  const stored = { ...characterToolSettings.value };
  characterToolSettings.value = {};
  for (const tool of localTools.value) {
    const defaultEnabled = allowlistMode.value ? false : tool.enabled;
    characterToolSettings.value[tool.pluginId] = stored[tool.pluginId] ?? defaultEnabled;
  }
});

// 生命周期
onMounted(async () => {
  // 形态定义独立于角色，需自行拉取；其余异步数据由 props.data watch 统一触发 loadAllData
  await loadPromptForms()
})

onUnmounted(() => {
  // window.removeEventListener('resize', updateDrawerWidth)
  if (characterForm.avatarUrl && characterForm.avatarUrl.startsWith('blob:')) {
    URL.revokeObjectURL(characterForm.avatarUrl);
  }
})



const handleSave = async () => {
  // 验证逻辑已移至父组件调用 validate() 时执行
  // 此方法现在仅用于返回最终数据
  return getFormData();
}

// 获取表单数据
const getFormData = () => {
  let finalData = {
    'title': characterForm.title,
    'description': characterForm.description,
    'name': characterForm.name,
    'avatarUrl': characterForm.avatarUrl,
    'avatarFile': characterForm.avatarFile,
    'groupId': characterForm.groupId === '' ? null : characterForm.groupId,
    'identity': characterForm.identity,
    'modelId': characterForm.modelId === '' ? null : characterForm.modelId,
    'settings': {
      'assistantName': characterForm.assistantName,
      'assistantIdentity': characterForm.assistantIdentity,
      'systemPrompt': characterForm.systemPrompt,
      'memoryType': characterForm.memoryType,
      // 记忆与压缩配置分组
      'memory': {
        'compressionTriggerRatio': characterForm.compressionTriggerRatio,
        'compressionTargetRatio': characterForm.compressionTargetRatio,
        'summaryMode': characterForm.summaryMode,
      },
      // 默认能力（进入会话时预置深度思考 / 在线检索开关）
      'capabilities': {
        'defaultThink': characterForm.defaultThink,
        'defaultSearch': characterForm.defaultSearch,
      },
      // 角色默认启用的技能名（已按黑白名单计算最终生效结果，供后端直接注入）
      'defaultSkillNames': skillsList.value
        .filter(s => getSkillEffectiveEnabled(s) === true && s.enabled !== false)
        .map(s => s.name || s.id),
      // 插件配置
      'plugins': (() => {
        const buildCustom = () => {
          const result: Record<string, any> = {};
          for (const [pluginId, enabled] of Object.entries(characterToolSettings.value)) {
            if (allowlistMode.value) {
              // 白名单：只存 enabled: true（未显式开启的默认禁用）
              if (enabled) result[pluginId] = { enabled: true };
            } else {
              // 黑名单：只存 enabled: false（未显式关闭的默认启用）
              if (!enabled) result[pluginId] = { enabled: false };
            }
          }
          // MCP 配置（黑白名单兼容）
          const mcpConfig: Record<string, any> = {};
          mcpConfig.enabled = !allMcpDisabled.value;
          if (mcpAllowlistMode.value) {
            // 白名单模式
            mcpConfig.toolkits_filter = 'allow';
            if (mcpAllowlistServers.value.length > 0) {
              mcpConfig.toolkits_allow = mcpAllowlistServers.value.map((id: string) => `mcp_${id}`);
            }
          } else if (mcpDeniedServers.value.length > 0) {
            // 黑名单模式（有拒绝列表时才写入）
            mcpConfig.toolkits_filter = 'deny';
            mcpConfig.toolkits_deny = mcpDeniedServers.value.map((id: string) => `mcp_${id}`);
          }

          if (Object.keys(mcpConfig).length > 0) {
            result.mcp = mcpConfig;
          }
          // Skills：始终显式写入 enabled 状态，true=启用 false=全部禁用
          result.skill = { enabled: !allSkillsDisabled.value };
          // 预设 Agent
          result.sub_agent = { enabled: !allAgentsDisabled.value };
          return result;
        };
        // 全部禁用：保留原有配置值，追加 __default 以便切回时恢复白名单模式
        if (allDisabled.value) {
          const denyOutput: any = { __strategy: 'deny_nonsystem', ...buildCustom() };
          if (allowlistMode.value) {
            denyOutput.__default = false;
          }
          return denyOutput;
        }
        // 正常（自定义）
        const output: any = { __strategy: 'custom' };
        if (allowlistMode.value) {
          output.__default = false;
        }
        return { ...output, ...buildCustom() };
      })(),
      // Skills 单项偏好（按模式保存）
      'skills': (() => {
        // 遍历所有技能，按当前显示状态保存
        const skillsOut: Record<string, any> = {};
        for (const skill of skillsList.value) {
          const effectiveEnabled = getSkillEffectiveEnabled(skill);
          if (skillsAllowlistMode.value) {
            // 白名单：当前显示为 ON 的全部存 true
            if (effectiveEnabled) skillsOut[skill.id] = true;
          } else {
            // 黑名单：当前显示为 OFF 的全部存 false
            if (!effectiveEnabled) skillsOut[skill.id] = false;
          }
        }
        if (skillsAllowlistMode.value) {
          skillsOut.__default = false;
        }
        return Object.keys(skillsOut).length > 0 ? skillsOut : undefined;
      })(),
      // 子代理配置（固定白名单：仅存显式 true）
      'agents': (() => {
        // 总开关关闭：不写入任何子代理偏好，避免开关切回后残留旧选择被误生效
        if (allAgentsDisabled.value) {
          return undefined;
        }
        const agentsOut: Record<string, any> = {};
        for (const char of presetCharacters.value) {
          if (getAgentEffectiveEnabled(char)) {
            agentsOut[char.id] = true;
          }
        }
        agentsOut.__default = false;
        return Object.keys(agentsOut).length > 1 ? agentsOut : undefined;
      })(),
    }
  }
  return finalData;
}

// 监听 props.data 变化（注册在 getFormData 之后，避免 immediate 首跑触发 TDZ）
watch(() => props.data, (newVal, oldVal) => {
  applyCharacterData(newVal, oldVal)
  // 非首次加载（同一角色数据刷新，如保存后回读）：按当前表单重算基线，避免脏状态误报
  if (!(props.isNew || (newVal?.id && !oldVal?.id))) {
    _initialFormData.value = getFormData()
  }
  // 留存原始数据，供「撤销」还原
  _initialRawData.value = JSON.parse(JSON.stringify(newVal || {}))
}, { immediate: true })

// 保存提交时写入操作记录（07 舱 · Console 融合）
watch(() => props.saving, (val) => {
  if (val) logCapability(t('characters.wb.logSave'))
})

// 验证所有表单
const validate = async () => {
  try {
    var formValidates = [
      basicFormRef.value?.validate(),
      promptFormRef.value?.validate(),
    ]
    const validationResults = await Promise.allSettled(formValidates)
    const hasError = validationResults.some(result => result.status === 'rejected')

    if (hasError) {
      // 工作台无 tab 可切：把基础配置节滚入视野，让用户看到校验错误
      document.getElementById('cwb-sec-basic')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return false;
    }
    return true;
  } catch (errors) {
    console.warn('Validation incomplete:', errors);
    return false;
  }
}

// 清除头像文件（上传成功后由父组件调用）
const clearAvatarFile = () => {
  characterForm.avatarFile = null;
}

// 检测表单是否有未保存的变更
const hasChanges = computed(() => {
  // 分形态提示词不在角色主体数据里，但改过就必须算作「有变更」，
  // 否则保存按钮一直禁用，用户填的提示词会被静默丢弃
  if (anyFormPromptDirty.value) return true
  if (!_initialFormData.value) return true
  const current = getFormData()
  return !deepEqual(current, _initialFormData.value)
})
const isDirty = hasChanges

// 撤销未保存的修改：表单回到最近一次基线（含分形态提示词草稿）
const resetChanges = () => {
  logCapability(t('characters.wb.logUndo'));
  if (_initialRawData.value) {
    applyCharacterData(JSON.parse(JSON.stringify(_initialRawData.value)), _initialRawData.value)
  }
  // 白名单模式下补齐缺失技能项，与 loadAllData 的归一化口径一致
  if (skillsAllowlistMode.value) {
    for (const skill of skillsList.value) {
      if (!(skill.id in characterForm.enabledSkills)) {
        characterForm.enabledSkills[skill.id] = false
      }
    }
  }
  // 分形态提示词：各形态草稿回到落库基准
  for (const key of Object.keys(formDrafts.value)) {
    formDrafts.value[key] = { ...formDrafts.value[key], draft: formOriginals.value[key] ?? '' }
  }
  if (!isBuildForm.value) {
    const cur = formDrafts.value[promptModeValue.value]
    formPromptDraft.value = cur?.draft ?? ''
    formPromptOriginal.value = formOriginals.value[promptModeValue.value] ?? ''
    formPromptFromTable.value = cur?.fromTable ?? false
  }
  _initialFormData.value = getFormData()
}

// 暴露方法给父组件
/**
 * 落库本次会话里改脏过的**所有**非 build 形态提示词。
 *
 * <p>由 CharacterModal 在角色主体保存成功后调用——分形态提示词走独立接口，
 * 且新建角色时必须等后端返回 id 才知道往哪张表写，所以不能塞进 getFormData。</p>
 *
 * <p>build 形态不在此列：它的正文就是 {@code characterForm.systemPrompt}，
 * 随角色主体一起保存，无需二次落库。</p>
 *
 * @param roleId 角色主键（新建时为刚返回的 id）
 * @returns 是否需要提示用户失败（无变更或接口不可用时返回 false）
 */
const flushFormPrompt = async (roleId?: string | number): Promise<boolean> => {
  const id = roleId ?? characterForm.id;
  if (!id || !rolePromptsAvailable.value) return false;
  // 当前形态的输入先收进草稿表，下面遍历才看得到它
  stashActiveFormDraft();
  let failed = false;
  // 逐形态落库：只存当前选中形态的话，用户在多个形态间来回编辑时，
  // 其余形态的改动会被静默丢掉（草稿在内存里看着还在，下次打开就没了）。
  for (const form of promptForms.value) {
    const key = form.formKey;
    if (key === FORM_KEY_BUILD) continue;
    const entry = formDrafts.value[key];
    if (!entry) continue;
    if (entry.draft === (formOriginals.value[key] ?? '')) continue;
    const ok = await saveFormPrompt(String(id), key, entry.draft, entry.enabled);
    if (!ok) failed = true;
  }
  return failed;
}

// ---------- 形态管理（自定义形态的增删改）----------
// build 恒存、不可删改 key；plan 及其它内置形态同样锁定 key（历史会话引用着它）。
const formDialogVisible = ref(false)
const formSaving = ref(false)

/** 新建/编辑表单；formKey 仅新建时可填 */
const formDraft = reactive({
  formKey: '',
  formName: '',
  formIcon: 'flash',
  formDescription: '',
  editingKey: '' as string,
})

const resetFormDraft = () => {
  formDraft.formKey = ''
  formDraft.formName = ''
  formDraft.formIcon = 'flash'
  formDraft.formDescription = ''
  formDraft.editingKey = ''
}

/** 进入编辑态并填充已有形态（编辑时 key 只读） */
const startEditForm = (f: PromptForm) => {
  formDraft.formKey = f.formKey
  formDraft.formName = f.formName || ''
  formDraft.formIcon = f.formIcon || 'flash'
  formDraft.formDescription = f.formDescription || ''
  formDraft.editingKey = f.formKey
}

/**
 * 提交形态表单。
 *
 * <p>key 的合法性在前端先挡一道：key 会进接口路径与会话 runMode，让后端返回
 * 「创建失败」而不告诉用户哪里写错了是最差的体验。</p>
 */
const submitFormDraft = async () => {
  const isEdit = !!formDraft.editingKey
  if (!formDraft.formName.trim()) {
    toast.error('请填写形态名称')
    return
  }
  if (!isEdit && !/^[a-z0-9][a-z0-9-]{0,31}$/.test(formDraft.formKey.trim())) {
    toast.error('形态标识只能是小写字母、数字或连字符，且以字母数字开头')
    return
  }
  formSaving.value = true
  try {
    if (isEdit) {
      const ok = await apiService.updatePromptForm(formDraft.editingKey, {
        formName: formDraft.formName.trim(),
        formIcon: formDraft.formIcon,
        formDescription: formDraft.formDescription.trim() || undefined,
      })
      if (!ok) {
        toast.error('保存形态失败')
        return
      }
      toast.success('形态已更新')
    } else {
      const created = await apiService.createPromptForm({
        formKey: formDraft.formKey.trim(),
        formName: formDraft.formName.trim(),
        formIcon: formDraft.formIcon,
        formDescription: formDraft.formDescription.trim() || undefined,
      })
      if (!created) {
        toast.error('创建形态失败：标识已存在或不可用')
        return
      }
      toast.success('形态已创建')
    }
    resetFormDraft()
    await loadPromptForms()
  } catch (e: any) {
    toast.error(isEdit ? '保存形态失败' : '创建形态失败')
  } finally {
    formSaving.value = false
  }
}

/** 删除自定义形态；build 与其它内置形态由后端拒绝，这里同步禁用按钮 */
const removePromptForm = async (f: PromptForm) => {
  if (f.builtin === 1) return
  try {
    await ElMessageBox.confirm(
      `删除形态「${f.formName || f.formKey}」后，各角色在该形态下已配置的提示词将不再生效。`,
      '删除形态',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }
    )
  } catch {
    return
  }
  try {
    const ok = await apiService.deletePromptForm(f.formKey)
    if (!ok) {
      toast.error('删除形态失败')
      return
    }
    if (promptModeValue.value === f.formKey) {
      promptModeValue.value = FORM_KEY_BUILD
    }
    toast.success('形态已删除')
    await loadPromptForms()
    if (characterForm.id) {
      await loadRolePrompts(String(characterForm.id))
    }
  } catch (e: any) {
    toast.error('删除形态失败')
  }
}

defineExpose({
  clearAvatarFile,
  validate,
  getFormData,
  flushFormPrompt,
  hasChanges,
  resetChanges
})

// 移除不再需要的 parse 和 format 方法（已删除 max_memory_tokens 和 short_term_memory_tokens）
</script>

<style scoped>
.prompt-mode-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.prompt-mode-hint :deep(.el-tag) {
  flex-shrink: 0;
  margin-top: 2px;
}
.prompt-mode-hint-icon {
  margin-top: 3px;
}

/* 形态过多时切换器降级为下拉，宽度收窄以免挤掉标题 */
.form-select {
  width: 130px;
}

/* 形态管理列表 */
.form-manage-list {
  max-height: 240px;
  overflow-y: auto;
}
.form-manage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.form-manage-item:last-child {
  border-bottom: none;
}
.form-manage-editor {
  padding-top: 4px;
}
.form-prompt-unavailable {
  flex-shrink: 0;
}

/* ============================================================================
   工作台布局（A · 三栏：中栏编辑 + 右栏能力清单）
   令牌全部来自 workbench.css 的 --ax-* 桥（koi 令牌），此处不写死调色板。
   ============================================================================ */
.cwb-scope {
  height: 100%;
  min-height: 0;
}

.cwb-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 14px;
  height: 100%;
  min-height: 0;
  padding: 14px;
}

/* 中栏：编辑区 */
.cwb-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border: 1px solid var(--ax-line);
  border-radius: var(--ax-r-lg);
  background: var(--ax-surface);
  box-shadow: var(--ax-sh-sm);
  overflow: hidden;
}

.cwb-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border-bottom: 1px solid var(--ax-line-soft);
  flex: none;
}

.cwb-head__av {
  width: 44px;
  height: 44px;
  flex: none;
}

.cwb-head__text {
  flex: 1;
  min-width: 0;
}

.cwb-head__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--ax-text);
  min-width: 0;
}

.cwb-head__desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--ax-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cwb-head__ops {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: none;
}

/* 滚动内容 */
.cwb-scroll {
  flex: 1;
  min-height: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cwb-sec {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cwb-sec__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 记忆与压缩 */
.cwb-mem-item {
  margin-bottom: 0 !important;
}

.cwb-mem-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.cwb-mem-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ax-text);
}

.cwb-mem-label .ax-muted {
  font-size: 11.5px;
  font-weight: 400;
}

.cwb-mem-tip {
  margin-top: 4px;
  flex: none;
}

.ax-muted {
  color: var(--ax-text-3);
}

/* 能力度量头（07 舱 · Console 融合）：贴住头部下方，与滚动区左右对齐 */
.cwb-console {
  flex: none;
  margin: 10px 16px 0;
}

/* 保存栏 */
.cwb-savebar {
  flex: none;
  border: 1px solid var(--ax-line);
  border-radius: var(--ax-r-lg);
  box-shadow: var(--ax-sh-sm);
}

.cwb-savebar.ax-savebar {
  border-top: 1px solid var(--ax-line);
}

.ax-savebar__dirty {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ax-text-3);
}

.ax-savebar__ops {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 右栏：能力清单 */
.cwb-rail {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cwb-rail__inner {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 2px;
}

.ax-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--ax-line-soft);
  font-size: 12px;
  font-weight: 700;
  color: var(--ax-text-2);
}

.ax-panel__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px;
}

/* 能力面板里的总开关 + 模式切换组 */
.cwb-swgrp {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--ax-line-soft);
  border-radius: var(--ax-r-md);
  background: var(--ax-fill);
}

.cwb-swgrp__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cwb-swgrp__row.is-off {
  opacity: 0.5;
  pointer-events: none;
}

.cwb-swgrp__label {
  font-size: 12px;
  color: var(--ax-text-2);
}

.cwb-rail-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cwb-cap-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--ax-line-soft);
  border-radius: var(--ax-r-md);
  transition: background 0.18s var(--ax-ease), border-color 0.18s var(--ax-ease);
}

.cwb-cap-item:hover {
  background: var(--ax-hover);
  border-color: var(--ax-line);
}

.cwb-cap-item.is-off {
  opacity: 0.5;
}

.cwb-cap-item__main {
  flex: 1;
  min-width: 0;
}

.cwb-cap-item__name {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ax-text);
}

.cwb-cap-item__desc {
  margin-top: 2px;
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--ax-text-3);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cwb-cap-item__tools {
  margin-top: 2px;
  font-size: 11px;
}

/* 窄屏：能力清单退到下方单列 */
@media (max-width: 1100px) {
  .cwb-panel {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .cwb-rail {
    max-height: 42vh;
  }
}

/* 提示词输入框样式 - 禁止resize并占满flex空间 */
.prompt-form-item {
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.prompt-form-item :deep(.el-form-item__content) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.prompt-form-item :deep(.el-textarea) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.prompt-form-item :deep(textarea) {
  resize: none !important;
  flex: 1;
  min-height: 0;
}

.prompt-form-item :deep(.el-textarea__inner) {
  resize: none !important;
  height: 100% !important;
  min-height: unset !important;
}

/* 无横线表单项 */
.no-border-item {
  border-bottom: none !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}

/* 卡片内的表单项去除默认边距和边框 */
.el-form-item {
  margin-bottom: 0 !important;
}

/* 动效降级：系统开启「减少动态效果」时，能力项 / 按钮的悬停过渡直接到位。
   不写 `*` 通配，避免掐掉 el-switch / el-slider 内部组件的合法过渡。 */
@media (prefers-reduced-motion: reduce) {
  .cwb-cap-item,
  .ax-btn {
    transition: none;
  }
}
</style>