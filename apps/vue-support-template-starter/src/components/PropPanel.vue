<template>
  <div class="prop-panel">
    <div class="prop-panel__header">
      <span class="prop-panel__title">参数面板</span>
      <el-tag size="small" type="info" effect="plain">{{ meta.props.length }} 个参数</el-tag>
    </div>

    <div class="prop-panel__body">
      <el-form label-position="top" size="default">
        <el-form-item
          v-for="field in meta.props"
          :key="field.key"
        >
          <template #label>
            <div class="prop-field-label">
              <span class="prop-field-name">{{ field.label }}</span>
              <code class="prop-field-key">{{ field.key }}</code>
              <el-tag size="small" effect="plain" round>{{ field.type }}</el-tag>
            </div>
          </template>

          <el-input
            v-if="field.type === 'string'"
            :model-value="stringValue(state.values[field.key])"
            :placeholder="field.description ?? '请输入'"
            clearable
            @update:model-value="(val: string | number) => updateField(field.key, val)"
          />

          <el-input-number
            v-else-if="field.type === 'number'"
            :model-value="numberValue(state.values[field.key])"
            :min="field.min"
            :max="field.max"
            :step="field.step ?? 1"
            :placeholder="field.description"
            controls-position="right"
            class="prop-number"
            @update:model-value="(val: number | undefined) => updateField(field.key, val ?? 0)"
          />

          <ReSwitch
            v-else-if="field.type === 'boolean'"
            layout="square"
            :title="field.label"
            :model-value="Boolean(state.values[field.key])"
            @update:model-value="(val: boolean | string | number) => updateField(field.key, Boolean(val))"
          />

          <!-- 少量选项（2-3 个）使用 ReSwitch 正方形，仅首字/图标，popover 显示描述 -->
          <div
            v-else-if="field.type === 'select' && field.options && field.options.length <= 3"
            class="prop-pill-group"
          >
            <ReSwitch
              v-for="opt in field.options"
              :key="String(opt.value)"
              layout="square"
              :model-value="String(state.values[field.key]) === String(opt.value)"
              @update:model-value="(val: boolean | string | number) => val === true && updateField(field.key, opt.value)"
            >
              <el-tooltip :content="opt.label" placement="top">
                <span class="prop-pill__icon">
                  <el-icon v-if="opt.icon" :size="18"><component :is="opt.icon" /></el-icon>
                  <span v-else>{{ opt.label.charAt(0) }}</span>
                </span>
              </el-tooltip>
            </ReSwitch>
          </div>

          <el-select
            v-else-if="field.type === 'select'"
            :model-value="state.values[field.key] as string | number | undefined"
            :placeholder="field.description ?? '请选择'"
            class="prop-select"
            @update:model-value="(val: string | number | boolean) => updateField(field.key, val)"
          >
            <el-option
              v-for="opt in field.options"
              :key="String(opt.value)"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

<el-input
              v-else-if="field.type === 'json'"
              :model-value="jsonValue(state.values[field.key])"
              type="textarea"
              :rows="3"
              placeholder="合法 JSON"
              @update:model-value="(val: string | number) => updateJson(field.key, val)"
            />

          <div v-if="field.description && field.type !== 'json'" class="prop-field-tip">
            {{ field.description }}
          </div>
        </el-form-item>

        <!-- v-model 控件（仅当组件支持） -->
        <el-form-item v-if="meta.modelable">
          <template #label>
            <div class="prop-field-label">
              <span class="prop-field-name">v-model 绑定值</span>
              <code class="prop-field-key">v-model</code>
              <el-tag size="small" type="warning" effect="plain" round>model</el-tag>
            </div>
          </template>
          <div class="prop-model">
            <el-input
              :model-value="String(state.model)"
              placeholder="v-model 当前值"
              @update:model-value="(val: string | number) => updateModel(val)"
            />
            <el-button-group>
              <el-button :type="typeof state.model === 'boolean' ? 'primary' : 'default'" @click="setModelType('boolean')">布尔</el-button>
              <el-button :type="typeof state.model === 'string' ? 'primary' : 'default'" @click="setModelType('string')">字符串</el-button>
              <el-button :type="typeof state.model === 'number' ? 'primary' : 'default'" @click="setModelType('number')">数字</el-button>
            </el-button-group>
          </div>
        </el-form-item>

        <!-- v-model 控件（仅当组件支持） -->

<style lang="scss" scoped>
.prop-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  overflow: hidden;
}

.prop-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #eaf3ff 0%, #d9eaff 100%);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.prop-panel__title {
  color: #1f2329;
}

.prop-panel__body {
  flex: 1;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
}

.prop-field-label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  margin-bottom: 6px;
}

.prop-field-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.prop-field-key {
  font-size: 11px;
  padding: 1px 5px;
  color: #5b8fd9;
  background: rgba(64, 158, 255, 0.08);
  border-radius: 4px;
}

.prop-field-tip {
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

.prop-number,
.prop-select {
  width: 100%;
}

.prop-model {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;

  :deep(.el-input) {
    flex: 1;
    min-width: 120px;
  }
}

/* 正方形选项组：间距 + 首字图标 */
.prop-pill-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.prop-pill__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-radius: 8px;
  text-transform: uppercase;
}
</style>