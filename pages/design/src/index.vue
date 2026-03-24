<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import CyberDashboard from './CyberDashboard.vue';
import ModernSaaS from './ModernSaaS.vue';
import GlassLogin from './GlassLogin.vue';

const components = {
  'Cyber Dashboard': CyberDashboard,
  'Modern SaaS': ModernSaaS,
  'Glass Login': GlassLogin
};

const currentView = shallowRef(CyberDashboard);
const currentName = ref('Cyber Dashboard');

const switchView = (name: string) => {
  currentName.value = name;
  // @ts-ignore
  currentView.value = components[name];
};
</script>

<template>
  <div class="relative w-full h-full">
    <!-- View Switcher -->
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex gap-2 bg-black/80 backdrop-blur-md p-2 rounded-full border border-white/20 shadow-2xl">
      <button 
        v-for="(comp, name) in components" 
        :key="name"
        @click="switchView(name)"
        :class="currentName === name ? 'bg-white text-black' : 'text-gray-400 hover:text-white'"
        class="px-4 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider"
      >
        {{ name }}
      </button>
    </div>

    <!-- Dynamic Component -->
    <component :is="currentView" />
  </div>
</template>

