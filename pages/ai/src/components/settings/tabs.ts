import type { Component } from 'vue';
import ProvidersPanel from './ProvidersPanel.vue';
import GlobalPanel from './GlobalPanel.vue';
import ServicesPanel from './ServicesPanel.vue';
import UsagePanel from './UsagePanel.vue';
import AppKeysPanel from './AppKeysPanel.vue';
import GroupsPanel from './GroupsPanel.vue';
import AlertsPanel from './AlertsPanel.vue';
import RagPanel from './RagPanel.vue';
import VisionPanel from './VisionPanel.vue';
import ImageSearchPanel from './ImageSearchPanel.vue';

export interface SettingsTabItem {
  name: string;
  label: string;
  component: Component;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
  { name: 'providers', label: '提供商', component: ProvidersPanel },
  { name: 'global', label: '全局', component: GlobalPanel },
  { name: 'services', label: '聚合服务', component: ServicesPanel },
  { name: 'appkeys', label: 'AppKey', component: AppKeysPanel },
  { name: 'groups', label: '分组', component: GroupsPanel },
  { name: 'rag', label: 'RAG', component: RagPanel },
  { name: 'vision', label: '视觉/OCR', component: VisionPanel },
  { name: 'image-search', label: '以图搜图', component: ImageSearchPanel },
  { name: 'alerts', label: '告警', component: AlertsPanel },
  { name: 'usage', label: '用量', component: UsagePanel },
];