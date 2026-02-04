<script setup lang="ts">
import { ref } from 'vue';
import { Icon } from '@iconify/vue';

const email = ref('');
const password = ref('');
const remember = ref(false);
</script>

<template>
  <div class="min-h-screen w-full relative overflow-hidden flex items-center justify-center font-sans">
    
    <!-- Vivid Background -->
    <div class="absolute inset-0 bg-gray-900 z-0">
      <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" class="w-full h-full object-cover opacity-80" />
      <div class="absolute inset-0 bg-black/20"></div>
    </div>

    <!-- Floating Orbs -->
    <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
    <div class="absolute top-1/3 right-1/4 w-64 h-64 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
    <div class="absolute -bottom-8 left-1/3 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

    <!-- Glass Card -->
    <div class="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
      
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/30">
          <Icon icon="ph:cube-transparent-fill" class="text-3xl text-white" />
        </div>
        <h2 class="text-3xl font-bold text-white mb-2">Welcome Back</h2>
        <p class="text-purple-100/70 text-sm">Enter your credentials to access the workspace.</p>
      </div>

      <form class="space-y-6" @submit.prevent>
        <div class="space-y-2">
          <label class="text-xs font-semibold text-purple-100 uppercase tracking-wider ml-1">Email Address</label>
          <div class="relative group">
            <Icon icon="ph:envelope-simple" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" />
            <input 
              v-model="email"
              type="email" 
              placeholder="name@example.com"
              class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent focus:bg-black/30 transition-all duration-300 backdrop-blur-sm"
            />
          </div>
        </div>

        <div class="space-y-2">
           <div class="flex justify-between items-center ml-1">
             <label class="text-xs font-semibold text-purple-100 uppercase tracking-wider">Password</label>
             <a href="#" class="text-xs text-pink-300 hover:text-pink-200 hover:underline">Forgot?</a>
           </div>
          <div class="relative group">
            <Icon icon="ph:lock-key" class="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors" />
            <input 
              v-model="password"
              type="password" 
              placeholder="••••••••"
              class="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent focus:bg-black/30 transition-all duration-300 backdrop-blur-sm"
            />
          </div>
        </div>

        <div class="flex items-center ml-1">
          <input 
            type="checkbox" 
            id="remember" 
            v-model="remember"
            class="w-4 h-4 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-offset-0 focus:ring-purple-500/50"
          />
          <label for="remember" class="ml-2 text-sm text-purple-100 cursor-pointer select-none">Remember for 30 days</label>
        </div>

        <button class="w-full py-3.5 px-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/30 transform transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 active:translate-y-0 active:scale-95">
          Sign In
        </button>

      </form>

      <div class="mt-8 text-center">
        <p class="text-sm text-purple-100/60">
          Don't have an account? 
          <a href="#" class="text-white font-semibold hover:underline">Create one</a>
        </p>
      </div>

      <!-- Social Login -->
      <div class="mt-8 flex justify-center gap-4 border-t border-white/10 pt-6">
         <button class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/5">
           <Icon icon="ph:google-logo-bold" />
         </button>
         <button class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/5">
           <Icon icon="ph:github-logo-bold" />
         </button>
         <button class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all border border-white/5">
           <Icon icon="ph:twitter-logo-bold" />
         </button>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
.animate-blob {
  animation: blob 7s infinite;
}
.animation-delay-2000 {
  animation-delay: 2s;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
</style>

