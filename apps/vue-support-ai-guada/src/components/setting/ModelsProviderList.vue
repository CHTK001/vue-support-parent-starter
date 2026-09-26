<template>
  <div class="providers-panel">
    <!-- 已添加的供应商 -->
    <div class="panel-label">
      <span class="panel-label-bar"></span>
      已添加的供应商
      <span class="panel-count">{{ items.length }}</span>
    </div>
    <div class="provider-grid">
      <article
        v-for="provider in items"
        :key="provider.id"
        class="provider-card"
        @click="$emit('item-click', provider)"
      >
        <div class="pc-head">
          <div class="pc-logo">
            <ProviderLogo :pid="getProviderIcon(provider)" :name="provider.name" size="lg" />
          </div>
            <div class="pc-id">
              <h3 class="pc-name" :title="provider.name">{{ provider.name }}</h3>
              <span class="pc-proto">
                <ProviderLogo :pid="getProviderIcon(provider)" :name="provider.name" size="sm" />
                {{ getProtocolLabel(provider.protocol) }}
              </span>
            </div>
          <div class="pc-tools" @click.stop>
            <button class="pc-icon" :title="'配置'" @click="$emit('item-edit', provider)">
              <el-icon :size="17"><EditOutlined /></el-icon>
            </button>
            <button class="pc-icon danger" :title="'删除'" @click="$emit('item-delete', provider)">
              <el-icon :size="17"><DeleteOutlineOutlined /></el-icon>
            </button>
          </div>
        </div>

        <p class="pc-desc">{{ provider.description || '暂无简介' }}</p>

        <div class="pc-foot">
          <div class="pc-mini">
            <span class="pc-mini-num">{{ provider.models && provider.models.length || 0 }}</span>
            <span class="pc-mini-label">模型</span>
          </div>
          <span class="pc-mini-sep"></span>
          <div class="pc-mini">
            <span class="pc-mini-num">{{ enabledCount(provider) }}</span>
            <span class="pc-mini-label">已启用</span>
          </div>
          <span class="pc-enter">进入配置<el-icon :size="14"><ArrowForwardIosFilled /></el-icon></span>
        </div>
      </article>
      <div v-if="items.length === 0" class="grid-empty">暂无已添加的供应商</div>
    </div>

    <!-- 可添加的供应商 -->
    <div class="panel-label mt">
      <span class="panel-label-bar"></span>
      可添加的供应商
      <span class="panel-count">{{ templates.length }}</span>
    </div>
    <div class="provider-grid">
      <article
        v-for="template in templates"
        :key="template.id"
        class="provider-card template"
        @click="$emit('template-click', template)"
      >
        <div class="pc-head">
          <div class="pc-logo muted">
            <CardAvatar :src="getProviderIcon(template)" :name="template.name" size="lg" />
          </div>
          <div class="pc-id">
            <h3 class="pc-name" :title="template.name">{{ template.name }}</h3>
            <span class="pc-tag">可一键添加</span>
          </div>
        </div>

        <p class="pc-desc">{{ template.description || '点击添加到您的供应商列表' }}</p>

        <div class="pc-foot">
          <span class="pc-proto plain">{{ getProtocolLabel(template.protocol) }}</span>
          <span class="pc-add">
            <el-icon :size="14"><AddOutlined /></el-icon>添加
          </span>
        </div>
      </article>
      <div v-if="templates.length === 0" class="grid-empty">暂无可添加的供应商</div>
    </div>
  </div>
</template>

<script>
import CardAvatar from '@/components/ui/CardAvatar.vue'
import ProviderLogo from '@/components/models/ProviderLogo.vue'
import { EditOutlined, DeleteOutlineOutlined, AddOutlined, ArrowForwardIosFilled } from '@vicons/material'

export default {
  components: { CardAvatar, ProviderLogo, EditOutlined, DeleteOutlineOutlined, AddOutlined, ArrowForwardIosFilled },
  props: {
    items: {
      type: Array,
      default: () => []
    },
    templates: {
      type: Array,
      default: () => []
    }
  },
  emits: ['item-click', 'item-edit', 'item-delete', 'template-click'],
  methods: {
    getProviderIcon(item) {
      const providerId = (item.provider || item.id || '').toLowerCase();
      if (providerId && providerId !== 'custom') {
        return providerId;
      }
      return null;
    },
    getProtocolLabel(protocol) {
      const protocolMap = {
        'openai': 'OpenAI',
        'openai-response': 'OpenAI-Response',
        'gemini': 'Gemini',
        'anthropic': 'Anthropic'
      }
      return protocolMap[protocol] || protocol || '未知协议'
    },
    enabledCount(provider) {
      const arr = Array.isArray(provider.models) ? provider.models : []
      return arr.filter((m) => m.enabled !== false).length
    }
  }
}
</script>

<style scoped>
.providers-panel {
  display: flex;
  flex-direction: column;
}

.panel-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 14px;
}
.panel-label.mt { margin-top: 32px; }
.panel-label-bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--color-primary);
}
.panel-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-gray);
  background: var(--color-surface-border);
}

.provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 14px;
}

.provider-card {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 18px;
  border-radius: var(--size-surface-radius);
  background: var(--color-surface);
  border: 1px solid var(--color-surface-border);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.provider-card:hover {
  border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-surface-border));
  box-shadow: 0 14px 30px -16px color-mix(in srgb, var(--color-text) 35%, transparent);
}

.pc-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.pc-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: 14px;
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
}
.pc-logo.muted {
  background: var(--color-surface-border);
}
.pc-id { min-width: 0; flex: 1; }
.pc-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-proto {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  font-size: 11px;
  color: var(--color-text-gray);
}
.pc-proto-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
}
.pc-proto.plain { display: inline-flex; align-items: center; }
.pc-tag {
  display: inline-block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--color-text-gray);
}

.pc-tools { display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.18s ease;
}
.provider-card:hover .pc-tools { opacity: 1; }
.pc-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  color: var(--color-text-gray);
  background: transparent;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.pc-icon:hover { color: var(--color-primary); background: var(--color-surface-border); }
.pc-icon.danger:hover { color: var(--el-color-danger); background: color-mix(in srgb, var(--el-color-danger) 12%, transparent); }

.pc-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--color-text-gray);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 42px;
}

.pc-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--color-surface-border);
}
.pc-mini { display: flex; align-items: baseline; gap: 4px; }
.pc-mini-num { font-size: 16px; font-weight: 700; color: var(--color-text); }
.pc-mini-label { font-size: 11px; color: var(--color-text-gray); }
.pc-mini-sep { width: 1px; height: 16px; background: var(--color-surface-border); }
.pc-enter {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-gray);
  transition: color 0.15s ease;
}
.provider-card:hover .pc-enter { color: var(--color-primary); }

.pc-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-primary);
}
.template:hover { border-color: color-mix(in srgb, var(--color-primary) 55%, var(--color-surface-border)); }

.grid-empty {
  grid-column: 1 / -1;
  padding: 36px 0;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-disabled);
}
</style>
