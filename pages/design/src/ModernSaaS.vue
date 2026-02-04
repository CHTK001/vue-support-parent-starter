<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { ref } from 'vue';

const activeTab = ref('Overview');
const tabs = ['Overview', 'Analytics', 'Reports', 'Settings'];

const cards = [
  { title: 'Total Revenue', value: '$45,231.89', change: '+20.1% from last month', icon: 'ph:currency-dollar-simple-bold', color: 'bg-blue-600' },
  { title: 'Subscriptions', value: '+2350', change: '+180.1% from last month', icon: 'ph:users-bold', color: 'bg-indigo-600' },
  { title: 'Sales', value: '+12,234', change: '+19% from last month', icon: 'ph:credit-card-bold', color: 'bg-emerald-600' },
  { title: 'Active Now', value: '+573', change: '+201 since last hour', icon: 'ph:activity-bold', color: 'bg-rose-600' },
];

const transactions = [
  { user: 'Liam Johnson', email: 'liam@example.com', amount: '$450.00', status: 'Success', date: '2023-06-23' },
  { user: 'Olivia Smith', email: 'olivia@example.com', amount: '$55.00', status: 'Pending', date: '2023-06-24' },
  { user: 'Noah Williams', email: 'noah@example.com', amount: '$210.00', status: 'Success', date: '2023-06-25' },
  { user: 'Emma Brown', email: 'emma@example.com', amount: '$150.00', status: 'Failed', date: '2023-06-26' },
  { user: 'Ava Jones', email: 'ava@example.com', amount: '$350.00', status: 'Success', date: '2023-06-27' },
];
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 font-sans p-8">
    
    <!-- Top Bar -->
    <div class="max-w-7xl mx-auto mb-10 flex justify-between items-center">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl">
          S.
        </div>
        <nav class="hidden md:flex bg-white px-2 py-1 rounded-full border shadow-sm">
          <button v-for="tab in tabs" :key="tab" 
            @click="activeTab = tab"
            :class="activeTab === tab ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:text-black'"
            class="px-5 py-2 rounded-full text-sm font-medium transition-all duration-200">
            {{ tab }}
          </button>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <div class="relative">
          <Icon icon="ph:magnifying-glass" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search..." class="pl-10 pr-4 py-2 rounded-full border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-black/5 text-sm w-64 shadow-sm" />
        </div>
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" class="w-10 h-10 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-105 transition" />
      </div>
    </div>

    <!-- Dashboard Content -->
    <main class="max-w-7xl mx-auto space-y-8">
      
      <div class="flex justify-between items-end">
        <div>
          <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p class="text-gray-500 mt-1">Overview of your store's performance.</p>
        </div>
        <button class="bg-black text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2 shadow-lg shadow-black/20">
          <Icon icon="ph:download-simple-bold" />
          Download Report
        </button>
      </div>

      <!-- KPI Cards -->
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div v-for="(card, i) in cards" :key="i" class="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow duration-300">
          <div class="flex items-center justify-between mb-4">
            <span class="text-sm font-medium text-gray-500">{{ card.title }}</span>
            <div :class="card.color" class="p-2 rounded-lg text-white shadow-md">
              <Icon :icon="card.icon" class="text-lg" />
            </div>
          </div>
          <div class="text-3xl font-bold text-gray-900 mb-1">{{ card.value }}</div>
          <p class="text-xs text-gray-500 font-medium">{{ card.change }}</p>
        </div>
      </div>

      <div class="grid gap-6 md:grid-cols-7">
        
        <!-- Main Chart Card -->
        <div class="md:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-6">
          <div class="mb-6">
            <h3 class="text-lg font-bold">Overview</h3>
            <p class="text-sm text-gray-500">Revenue trend over the last 30 days.</p>
          </div>
          <div class="h-[300px] w-full bg-gray-50 rounded-xl flex items-end justify-between p-4 px-8 overflow-hidden relative group">
             <!-- Mock Bars -->
             <div v-for="n in 12" :key="n" 
                  class="w-[6%] bg-black rounded-t-md hover:bg-indigo-600 transition-colors cursor-pointer relative group/bar"
                  :style="{ height: `${Math.random() * 60 + 20}%` }">
                  <div class="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition">
                    $12k
                  </div>
             </div>
          </div>
        </div>

        <!-- Recent Sales -->
        <div class="md:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] p-0 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-gray-100">
             <h3 class="text-lg font-bold">Recent Sales</h3>
             <p class="text-sm text-gray-500">You made 265 sales this month.</p>
          </div>
          <div class="flex-1 overflow-auto p-2">
            <div v-for="(tx, i) in transactions" :key="i" class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition cursor-pointer group">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 group-hover:bg-white group-hover:shadow-sm transition">
                  {{ tx.user.charAt(0) }}
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-900">{{ tx.user }}</p>
                  <p class="text-xs text-gray-500">{{ tx.email }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-gray-900">{{ tx.amount }}</p>
                <span class="text-[10px] px-2 py-0.5 rounded-full font-medium" 
                  :class="tx.status === 'Success' ? 'bg-green-100 text-green-700' : tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'">
                  {{ tx.status }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </main>
  </div>
</template>

