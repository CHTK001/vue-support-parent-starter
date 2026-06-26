<template>
  <div class="email-root">
    <section class="hero">
      <div>
        <p class="eyebrow">Mailbox workbench</p>
        <h1>邮箱管理</h1>
        <p class="lead">临时邮箱收件 + 开源邮箱客户端，管理所有邮箱账号。</p>
      </div>
      <div class="hero-actions">
        <el-button-group>
          <el-button :type="activeTab === 'temp' ? 'primary' : undefined" @click="activeTab = 'temp'">
            临时邮箱
          </el-button>
          <el-button :type="activeTab === 'client' ? 'primary' : undefined" @click="activeTab = 'client'">
            邮箱客户端
          </el-button>
        </el-button-group>
      </div>
    </section>

    <TempEmailPage v-if="activeTab === 'temp'" />
    <EmailClientPage v-if="activeTab === 'client'" />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TempEmailPage from "./TempEmailPage.vue";
import EmailClientPage from "./EmailClientPage.vue";

const activeTab = ref<"temp" | "client">("temp");
</script>

<style scoped>
.email-root {
  display: grid;
  gap: 16px;
}
.hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: end;
  padding: 20px 22px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, .22);
  background: rgba(255, 255, 255, .88);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 2px rgba(15, 23, 42, .04);
}
.eyebrow {
  margin: 0 0 8px;
  color: #64748b;
  font-size: 12px;
  text-transform: uppercase;
}
.hero h1 {
  margin: 0;
  font-size: 24px;
  color: #0f172a;
}
.lead {
  margin: 8px 0 0;
  color: #64748b;
  line-height: 1.7;
}
.hero-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
@media (max-width: 900px) {
  .hero {
    flex-direction: column;
    align-items: start;
  }
}
</style>
