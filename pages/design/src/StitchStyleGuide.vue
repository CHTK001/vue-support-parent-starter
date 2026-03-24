<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

// Color Palette Definition
const colors = [
  { name: 'Cyan (Primary)', class: 'bg-cyan-500' },
  { name: 'Indigo (Secondary)', class: 'bg-indigo-500' },
  { name: 'Violet (Accent)', class: 'bg-violet-500' },
  { name: 'Emerald (Success)', class: 'bg-emerald-500' },
  { name: 'Rose (Danger)', class: 'bg-rose-500' },
  { name: 'Amber (Warning)', class: 'bg-amber-500' },
];

const activeTab = ref('components');

const buttons = [
  { label: 'Primary Action', class: 'bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]' },
  { label: 'Secondary', class: 'bg-slate-800 border border-white/10 hover:border-cyan-500/50 hover:bg-slate-700 text-white' },
  { label: 'Ghost', class: 'bg-transparent hover:bg-white/5 text-cyan-400 border border-transparent hover:border-cyan-500/20' },
  { label: 'Danger', class: 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20' },
];
</script>

<template>
  <div class="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 p-10 relative overflow-hidden">
    
    <!-- Background FX -->
    <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-[#020617] opacity-80"></div>
        <div class="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px]"></div>
        <!-- Cyber Grid -->
        <div class="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto">
      
      <!-- Header -->
      <header class="mb-12 border-b border-white/10 pb-6 flex justify-between items-end">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded flex items-center justify-center">
              <Icon icon="ph:ruler-fill" class="text-black text-xl" />
            </div>
            <h1 class="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              STITCH <span class="text-cyan-500">UI</span> STANDARD
            </h1>
          </div>
          <p class="text-slate-500 font-mono text-sm tracking-widest uppercase pl-1">Design System & Component Library v2.0</p>
        </div>
        <div class="flex gap-4">
            <button 
                v-for="tab in ['components', 'typography', 'colors']" 
                :key="tab"
                @click="activeTab = tab"
                :class="[
                    'px-4 py-2 text-sm uppercase tracking-wider transition-all duration-300 border-b-2',
                    activeTab === tab ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
                ]"
            >
                {{ tab }}
            </button>
        </div>
      </header>

      <!-- Main Content -->
      <div class="grid grid-cols-12 gap-8">
        
        <!-- Left Column -->
        <div class="col-span-12 lg:col-span-8 space-y-8">
            
            <!-- Section: Cards & Containers -->
            <section class="space-y-4">
                <h2 class="text-xl font-bold flex items-center gap-2 text-white">
                    <Icon icon="ph:cards" class="text-cyan-400" /> Containers (Glassmorphism)
                </h2>
                <div class="grid grid-cols-2 gap-6">
                    <!-- Standard Card -->
                    <div class="p-6 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-2xl relative group overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div class="relative">
                            <h3 class="text-lg font-semibold text-white mb-2">Standard Glass</h3>
                            <p class="text-slate-400 text-sm leading-relaxed">
                                Base container for most UI elements. Uses <code class="text-cyan-300 bg-cyan-900/30 px-1 rounded">bg-slate-900/60</code> and <code class="text-cyan-300 bg-cyan-900/30 px-1 rounded">backdrop-blur-md</code>.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Active/Glow Card -->
                    <div class="p-6 rounded-xl border border-cyan-500/30 bg-slate-900/80 backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.15)] relative">
                        <div class="absolute top-0 right-0 w-20 h-20 bg-cyan-500/20 blur-2xl rounded-full -mr-10 -mt-10"></div>
                        <h3 class="text-lg font-semibold text-cyan-50 mb-2 flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            Active State
                        </h3>
                        <p class="text-slate-400 text-sm">
                            Used for highlighted items or active states. Adds a border glow and stronger shadow.
                        </p>
                    </div>
                </div>
            </section>

            <!-- Section: Inputs & Controls -->
            <section class="space-y-4">
                <h2 class="text-xl font-bold flex items-center gap-2 text-white">
                    <Icon icon="ph:sliders" class="text-indigo-400" /> Inputs & Controls
                </h2>
                <div class="p-8 rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur grid grid-cols-2 gap-8">
                    <div class="space-y-4">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Text Input</label>
                        <div class="relative">
                            <input type="text" value="Stitch Design" class="w-full bg-slate-950/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all duration-300 placeholder:text-slate-600" />
                            <Icon icon="ph:pencil" class="absolute right-4 top-3.5 text-slate-500" />
                        </div>
                    </div>
                    <div class="space-y-4">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Select Menu</label>
                        <div class="relative group">
                            <select class="w-full appearance-none bg-slate-950/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500 transition-all cursor-pointer">
                                <option>System Default</option>
                                <option>Cyber Dark</option>
                            </select>
                            <Icon icon="ph:caret-down" class="absolute right-4 top-3.5 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                    
                    <div class="col-span-2 space-y-4">
                         <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Buttons</label>
                         <div class="flex flex-wrap gap-4">
                            <button v-for="btn in buttons" :key="btn.label" :class="[btn.class, 'px-6 py-2.5 rounded-lg transition-all duration-300 flex items-center gap-2 active:scale-95']">
                                {{ btn.label }}
                                <Icon icon="ph:arrow-right" v-if="btn.label === 'Primary Action'" />
                            </button>
                         </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Right Column (Details) -->
        <div class="col-span-12 lg:col-span-4 space-y-8">
            
            <!-- Colors -->
            <div class="p-6 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur">
                <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">System Palette</h3>
                <div class="space-y-3">
                    <div v-for="color in colors" :key="color.name" class="flex items-center gap-4 group cursor-pointer">
                        <div :class="[color.class, 'w-12 h-12 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300 ring-2 ring-white/5']"></div>
                        <div>
                            <p class="text-white font-medium text-sm">{{ color.name }}</p>
                            <p class="text-slate-500 text-xs font-mono opacity-50 group-hover:opacity-100 transition-opacity">#HexCode</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Typography -->
            <div class="p-6 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur">
                 <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Typography</h3>
                 <div class="space-y-6">
                    <div>
                        <h1 class="text-4xl font-black text-white tracking-tighter">Display H1</h1>
                        <p class="text-xs text-slate-500 mt-1 font-mono">Font-Black / Tracking-Tighter</p>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-white tracking-tight">Heading H2</h2>
                        <p class="text-xs text-slate-500 mt-1 font-mono">Font-Bold / Tracking-Tight</p>
                    </div>
                    <div>
                        <p class="text-base text-slate-300 leading-relaxed">
                            Body text should be legible, with good contrast (Slate-300) and relaxed line height.
                        </p>
                    </div>
                    <div class="pt-4 border-t border-white/5">
                        <span class="text-xs font-mono text-cyan-400 bg-cyan-950/30 px-2 py-1 rounded">Mono Text</span>
                        <p class="text-xs text-slate-500 mt-2">Used for code, data, and technical specs.</p>
                    </div>
                 </div>
            </div>

        </div>
      </div>

    </div>
  </div>
</template>

