<template>
  <div class="w-full min-h-screen bg-slate-950 text-cyan-400 font-thin overflow-hidden relative selection:bg-cyan-500 selection:text-white">
    <!-- Ambient Background -->
    <div class="absolute inset-0 z-0 pointer-events-none">
       <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-80"></div>
       <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px] animate-pulse"></div>
       <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px] animate-pulse delay-1000"></div>
    </div>

    <!-- Tech Deco Background Elements -->
    <TechDeco class="absolute top-20 left-10 z-0 opacity-30 scale-150" />
    <TechDeco class="absolute bottom-20 right-10 z-0 opacity-30 rotate-180 scale-125" />

    <div class="relative z-10 flex flex-col h-full p-4 gap-4">
      <!-- Header -->
      <TechHeader title="NEXUS // CRYPTO TERMINAL" class="mb-4">
        <template #right>
           <div class="flex items-center gap-4 text-xs font-mono tracking-wider">
              <span class="text-cyan-600">SYS.STATUS: <span class="text-cyan-400 animate-pulse">ONLINE</span></span>
              <span class="text-cyan-600">NET: <span class="text-emerald-400">MAINNET</span></span>
              <TechButton size="small" type="primary">CONNECT WALLET</TechButton>
           </div>
        </template>
      </TechHeader>

      <!-- Stats Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
        <TechPanel v-for="(stat, index) in stats" :key="index" class="h-32 group hover:bg-cyan-900/5 transition-all duration-500">
          <div class="flex flex-col justify-between h-full p-4">
            <div class="flex justify-between items-start">
               <span class="text-xs tracking-[0.2em] text-cyan-600 uppercase">{{ stat.label }}</span>
               <TechDeco :small="true" class="opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            <div class="flex items-end gap-2">
               <span class="text-3xl font-light text-white font-mono tracking-tighter">{{ stat.value }}</span>
               <span :class="stat.trend > 0 ? 'text-emerald-400' : 'text-rose-400'" class="text-xs mb-1 font-mono">
                 {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
               </span>
            </div>
            <div class="w-full h-1 bg-slate-800 mt-2 relative overflow-hidden rounded-full">
               <div class="absolute top-0 left-0 h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" :style="{ width: Math.abs(stat.trend) * 10 + '%' }"></div>
            </div>
          </div>
        </TechPanel>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[500px]">
        <!-- Chart Section -->
        <div class="lg:col-span-8 flex flex-col gap-4">
           <TechPanel class="flex-1 relative overflow-hidden min-h-[400px]">
              <TechPanelTitle title="MARKET OVERVIEW // BTC-USD" />
              <div class="absolute top-4 right-4 z-20 flex gap-2">
                 <TechButton v-for="tf in timeframes" :key="tf" size="small" :active="activeTimeframe === tf" @click="activeTimeframe = tf">{{ tf }}</TechButton>
              </div>
              <div class="w-full h-full p-4 pt-12">
                 <ScEcharts :option="chartOption" class="w-full h-full" />
              </div>
           </TechPanel>
        </div>

        <!-- Sidebar Section -->
        <div class="lg:col-span-4 flex flex-col gap-4">
           <!-- Order Book -->
           <TechPanel class="flex-1 min-h-[250px]">
              <TechPanelTitle title="ORDER BOOK" />
              <div class="p-4 h-full overflow-auto text-xs font-mono">
                 <div class="grid grid-cols-3 text-slate-500 mb-2 border-b border-slate-800 pb-1">
                    <span>PRICE</span>
                    <span class="text-right">AMOUNT</span>
                    <span class="text-right">TOTAL</span>
                 </div>
                 <div class="flex flex-col gap-1">
                    <div v-for="(ask, i) in asks" :key="'ask-'+i" class="grid grid-cols-3 relative group hover:bg-slate-800/50 cursor-pointer">
                       <span class="text-rose-400">{{ ask.price }}</span>
                       <span class="text-right text-slate-300">{{ ask.amount }}</span>
                       <span class="text-right text-slate-400">{{ ask.total }}</span>
                       <div class="absolute right-0 top-0 h-full bg-rose-500/10" :style="{ width: (ask.amount * 10) + '%' }"></div>
                    </div>
                    <div class="py-2 text-center text-lg text-white font-bold border-y border-slate-800 my-1">
                       48,294.50 <span class="text-emerald-500 text-xs">↑</span>
                    </div>
                     <div v-for="(bid, i) in bids" :key="'bid-'+i" class="grid grid-cols-3 relative group hover:bg-slate-800/50 cursor-pointer">
                       <span class="text-emerald-400">{{ bid.price }}</span>
                       <span class="text-right text-slate-300">{{ bid.amount }}</span>
                       <span class="text-right text-slate-400">{{ bid.total }}</span>
                       <div class="absolute right-0 top-0 h-full bg-emerald-500/10" :style="{ width: (bid.amount * 10) + '%' }"></div>
                    </div>
                 </div>
              </div>
           </TechPanel>

           <!-- Recent Activity -->
           <TechPanel class="h-1/3 min-h-[200px]">
              <TechPanelTitle title="SYSTEM LOGS" />
              <div class="p-4 font-mono text-xs flex flex-col gap-2 text-slate-400 h-full overflow-hidden">
                 <div v-for="(log, i) in logs" :key="i" class="flex gap-2">
                    <span class="text-slate-600">[{{ log.time }}]</span>
                    <span :class="log.type === 'WARN' ? 'text-amber-400' : 'text-cyan-400'">{{ log.type }}</span>
                    <span>{{ log.message }}</span>
                 </div>
              </div>
           </TechPanel>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { TechHeader, TechPanel, TechPanelTitle, TechButton, TechDeco } from "@repo/components/TechUI";
import ScEcharts from "@repo/components/ScEcharts/index.vue";
import * as echarts from "echarts";

// --- State ---
const activeTimeframe = ref('1H');
const timeframes = ['15M', '1H', '4H', '1D', '1W'];

const stats = ref([
  { label: 'Total Portfolio', value: '$124,592.40', trend: 2.4 },
  { label: '24h Volume', value: '$4.2B', trend: -0.8 },
  { label: 'Network Hashrate', value: '482 EH/s', trend: 5.1 },
  { label: 'Active Nodes', value: '15,402', trend: 0.5 },
]);

const asks = ref(Array.from({ length: 8 }, (_, i) => ({
   price: (48300 + i * 5).toFixed(2),
   amount: (Math.random() * 2).toFixed(4),
   total: (Math.random() * 10).toFixed(4)
})).reverse());

const bids = ref(Array.from({ length: 8 }, (_, i) => ({
   price: (48290 - i * 5).toFixed(2),
   amount: (Math.random() * 2).toFixed(4),
   total: (Math.random() * 10).toFixed(4)
})));

const logs = ref([
   { time: '10:42:01', type: 'INFO', message: 'WebSocket connection established' },
   { time: '10:42:05', type: 'INFO', message: 'Syncing blockchain data...' },
   { time: '10:42:12', type: 'WARN', message: 'High latency detected on node US-EAST-4' },
   { time: '10:42:15', type: 'INFO', message: 'New block mined: #839201' },
]);

// --- Chart ---
// Generate dummy data
const dataCount = 50;
const xData = Array.from({ length: dataCount }, (_, i) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - (dataCount - i));
    return d.toLocaleTimeString();
});
const yData = Array.from({ length: dataCount }, () => 48000 + Math.random() * 500);

const chartOption = computed(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderColor: '#06b6d4',
    textStyle: { color: '#fff' },
    axisPointer: { type: 'cross', label: { backgroundColor: '#06b6d4' } }
  },
  grid: {
    left: '3%', right: '4%', bottom: '3%', containLabel: true,
    borderColor: '#1e293b'
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: xData,
    axisLine: { lineStyle: { color: '#334155' } },
    axisLabel: { color: '#94a3b8' }
  },
  yAxis: {
    type: 'value',
    scale: true,
    splitLine: { lineStyle: { color: '#1e293b' } },
    axisLabel: { color: '#94a3b8' }
  },
  series: [
    {
      name: 'Price',
      type: 'line',
      smooth: true,
      symbol: 'none',
      sampling: 'average',
      itemStyle: { color: '#06b6d4' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(6, 182, 212, 0.5)' },
          { offset: 1, color: 'rgba(6, 182, 212, 0)' }
        ])
      },
      data: yData,
      lineStyle: {
         width: 2,
         shadowColor: 'rgba(6, 182, 212, 0.5)',
         shadowBlur: 10
      }
    }
  ]
}));

onMounted(() => {
   // Simulate live data updates
   setInterval(() => {
      const lastPrice = yData[yData.length - 1];
      const newPrice = lastPrice + (Math.random() - 0.5) * 50;
      yData.shift();
      yData.push(newPrice);
      
      const d = new Date();
      xData.shift();
      xData.push(d.toLocaleTimeString());
      
      // Update asks/bids slightly
      asks.value.forEach(a => a.amount = (Math.random() * 2).toFixed(4));
      bids.value.forEach(b => b.amount = (Math.random() * 2).toFixed(4));
   }, 2000);
});

</script>

<style scoped>
/* Custom font integration if needed, assuming Inter is globally available or similar sans-serif */
:global(body) {
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
}
</style>

