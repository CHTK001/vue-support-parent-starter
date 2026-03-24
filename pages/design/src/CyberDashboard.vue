<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Icon } from '@iconify/vue';

const stats = [
  { label: 'TOTAL REVENUE', value: '$8,245,000', change: '+12.5%', trend: 'up' },
  { label: 'ACTIVE NODES', value: '1,420', change: '+3.2%', trend: 'up' },
  { label: 'SYSTEM LOAD', value: '45.2%', change: '-1.8%', trend: 'down' },
  { label: 'NETWORK LATENCY', value: '24ms', change: '-5ms', trend: 'down' },
];

const logs = ref([
  { time: '10:42:01', level: 'INFO', msg: 'System synchronization completed.' },
  { time: '10:42:05', level: 'WARN', msg: 'High latency detected in Node-7.' },
  { time: '10:42:12', level: 'INFO', msg: 'New transaction block received.' },
]);
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 overflow-hidden relative">
    <!-- Ambient Background -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      <div class="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-violet-900/10 rounded-full blur-[80px]"></div>
      <!-- Grid Overlay -->
      <div class="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.8)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]"></div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 p-6 md:p-10 max-w-[1600px] mx-auto grid grid-cols-12 gap-6">
      
      <!-- Header -->
      <header class="col-span-12 flex justify-between items-center mb-8 border-b border-white/10 pb-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.5)]">
            <Icon icon="ph:hexagon-fill" class="text-white text-2xl" />
          </div>
          <div>
            <h1 class="text-3xl font-bold tracking-tight text-white">NEXUS <span class="text-cyan-400 font-light">OS</span></h1>
            <p class="text-xs text-slate-400 tracking-widest uppercase">System v2.4.0 // Online</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <button class="px-4 py-2 rounded bg-slate-900/50 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-950/30 transition-all flex items-center gap-2 text-sm group">
            <Icon icon="ph:bell" class="group-hover:text-cyan-400" />
            <span>Notifications</span>
            <span class="w-2 h-2 rounded-full bg-cyan-500 animate-ping"></span>
          </button>
          <div class="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
            <Icon icon="ph:user" />
          </div>
        </div>
      </header>

      <!-- Stats Cards -->
      <div v-for="(stat, i) in stats" :key="i" class="col-span-12 md:col-span-6 lg:col-span-3">
        <div class="relative group">
          <!-- Hover Glow -->
          <div class="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-lg blur opacity-20 group-hover:opacity-60 transition duration-500"></div>
          
          <div class="relative p-6 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-lg h-full flex flex-col justify-between overflow-hidden">
            <!-- Decorative corner -->
            <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
               <Icon icon="ph:chart-line-up" class="text-6xl" />
            </div>

            <div>
              <p class="text-xs text-slate-400 font-mono tracking-wider mb-1">{{ stat.label }}</p>
              <h3 class="text-3xl font-bold text-white tracking-tight">{{ stat.value }}</h3>
            </div>
            <div class="flex items-center gap-2 mt-4 text-sm font-medium">
              <span :class="stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'" class="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                <Icon :icon="stat.trend === 'up' ? 'ph:trend-up' : 'ph:trend-down'" />
                {{ stat.change }}
              </span>
              <span class="text-slate-500 text-xs">vs last week</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Chart Area -->
      <div class="col-span-12 lg:col-span-8 mt-2">
        <div class="relative h-full min-h-[400px] p-6 bg-slate-900/80 backdrop-blur border border-white/10 rounded-lg shadow-2xl">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <Icon icon="ph:activity" class="text-cyan-400" />
              Real-time Analytics
            </h3>
            <div class="flex gap-2">
              <button class="px-3 py-1 text-xs rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">1H</button>
              <button class="px-3 py-1 text-xs rounded bg-white/5 text-slate-400 hover:bg-white/10">1D</button>
              <button class="px-3 py-1 text-xs rounded bg-white/5 text-slate-400 hover:bg-white/10">1W</button>
            </div>
          </div>
          
          <!-- Mock Chart Visualization -->
          <div class="w-full h-[300px] flex items-end gap-1 relative overflow-hidden">
            <div class="absolute inset-0 flex items-center justify-center text-slate-800 font-bold text-9xl select-none opacity-20 z-0">
              DATA
            </div>
            <!-- Bars -->
            <div v-for="n in 40" :key="n" 
                 class="flex-1 bg-gradient-to-t from-cyan-900/50 to-cyan-400/80 rounded-t-sm hover:to-cyan-200 transition-all duration-300"
                 :style="{ height: `${Math.random() * 80 + 20}%` }">
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side Panel -->
      <div class="col-span-12 lg:col-span-4 mt-2 flex flex-col gap-6">
        
        <!-- Server Status -->
        <div class="p-6 bg-slate-900/80 backdrop-blur border border-white/10 rounded-lg">
          <h3 class="text-lg font-semibold mb-4 text-white">System Health</h3>
          <div class="space-y-4">
            <div class="space-y-2">
              <div class="flex justify-between text-xs text-slate-400">
                <span>CPU Usage</span>
                <span class="text-cyan-400">78%</span>
              </div>
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500 w-[78%] relative overflow-hidden">
                  <div class="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-xs text-slate-400">
                <span>Memory Allocation</span>
                <span class="text-indigo-400">42%</span>
              </div>
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-indigo-500 w-[42%]"></div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-xs text-slate-400">
                <span>Storage I/O</span>
                <span class="text-emerald-400">91%</span>
              </div>
              <div class="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 w-[91%]"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Activity Log -->
        <div class="flex-1 p-6 bg-slate-900/80 backdrop-blur border border-white/10 rounded-lg overflow-hidden flex flex-col">
          <h3 class="text-lg font-semibold mb-4 text-white">Terminal Log</h3>
          <div class="font-mono text-xs space-y-3 overflow-y-auto custom-scrollbar flex-1">
            <div v-for="(log, i) in logs" :key="i" class="flex gap-3 border-b border-white/5 pb-2 last:border-0">
              <span class="text-slate-500">{{ log.time }}</span>
              <span :class="{
                'text-emerald-400': log.level === 'INFO',
                'text-amber-400': log.level === 'WARN',
                'text-rose-400': log.level === 'ERR'
              }">[{{ log.level }}]</span>
              <span class="text-slate-300">{{ log.msg }}</span>
            </div>
            <div class="animate-pulse text-cyan-500">_</div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>

