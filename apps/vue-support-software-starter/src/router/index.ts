import { createRouter, createWebHashHistory } from 'vue-router'
import SoftwareHome from '@/views/SoftwareHome.vue'
import SoftwareList from '@/views/SoftwareList.vue'
import Settings from '@/views/Settings.vue'
import SystemEnvironment from '@/views/SystemEnvironment.vue'
import PhotoAlbum from '@/views/PhotoAlbum.vue'
import SystemInfo from '@/views/SystemInfo.vue'
import AiChat from '@/views/AiChat.vue'
import AiProviders from '@/views/AiProviders.vue'
import AiMcp from '@/views/AiMcp.vue'
import AiAgents from '@/views/AiAgents.vue'
import SystemTools from '@/views/SystemTools.vue'
import SoftwareStats from '@/views/SoftwareStats.vue'
import SystemMonitor from '@/views/SystemMonitor.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: SoftwareHome },
    { path: '/software-list', name: 'software-list', component: SoftwareList },
    { path: '/settings', name: 'settings', component: Settings },
    { path: '/environment', name: 'environment', component: SystemEnvironment },
    { path: '/album', name: 'album', component: PhotoAlbum },
    { path: '/system', name: 'system', component: SystemInfo },
    { path: '/ai', name: 'ai', component: AiChat },
    { path: '/ai/mcp', name: 'ai-mcp', component: AiMcp },
    { path: '/ai/providers', name: 'ai-providers', component: AiProviders },
    { path: '/ai/agents', name: 'ai-agents', component: AiAgents },
    { path: '/tools', name: 'tools', component: SystemTools },
    { path: '/stats', name: 'stats', component: SoftwareStats },
    { path: '/monitor', name: 'monitor', component: SystemMonitor },
  ],
})

export default router
