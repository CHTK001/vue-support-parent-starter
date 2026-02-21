<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { ref, reactive } from "vue";

defineOptions({
  name: "GlassShowcase",
});

// Demo Data
const switchValue = ref(true);
const inputValue = ref("");
const selectValue = ref("");
const dateValue = ref("");
const sliderValue = ref(50);
const radioValue = ref("1");
const checkboxValue = ref(["1"]);

const tableData = [
  { date: "2024-02-01", name: "Glass Element", status: "Active", type: "Component" },
  { date: "2024-02-02", name: "Blur Effect", status: "Pending", type: "Effect" },
  { date: "2024-02-03", name: "Neon Glow", status: "Active", type: "Style" },
  { date: "2024-02-04", name: "Mesh Gradient", status: "Done", type: "Background" },
];

const loading = ref(false);
const startLoading = () => {
  loading.value = true;
  setTimeout(() => (loading.value = false), 2000);
};

const cards = [
  { title: "Revenue", value: "$42,500", icon: "ri:money-dollar-circle-line", trend: "+12%", color: "#10b981" },
  { title: "Users", value: "1,250", icon: "ri:user-3-line", trend: "+5%", color: "#3b82f6" },
  { title: "Bounce Rate", value: "45%", icon: "ri:pulse-line", trend: "-2%", color: "#f59e0b" },
];
</script>

<template>
  <div class="glass-showcase-page">
    <!-- Background Mesh (Consistent with Home) -->
    <div class="background-mesh">
      <div class="mesh-shape shape-1"></div>
      <div class="mesh-shape shape-2"></div>
      <div class="mesh-shape shape-3"></div>
    </div>
    <div class="background-overlay"></div>

    <div class="content-container custom-scrollbar">
      <!-- Header -->
      <div class="showcase-header glass-panel">
        <div class="header-content">
          <h1 class="page-title">Glass UI Design System</h1>
          <p class="page-subtitle">A modern, frosted glass interface design for next-gen applications.</p>
        </div>
        <div class="header-actions">
           <el-button type="primary" class="glass-btn-primary" round icon="Download">Download Kit</el-button>
        </div>
      </div>

      <!-- Grid Layout -->
      <div class="showcase-grid">
        
        <!-- 1. Stats Cards -->
        <div class="grid-section full-width">
          <h2 class="section-title">Dashboard Widgets</h2>
          <div class="cards-grid">
            <div v-for="(card, index) in cards" :key="index" class="stat-card glass-panel-hover">
              <div class="card-icon" :style="{ background: card.color + '20', color: card.color }">
                <el-icon :size="24"><component :is="useRenderIcon(card.icon)" /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-title">{{ card.title }}</div>
                <div class="card-value">{{ card.value }}</div>
              </div>
              <div class="card-trend" :class="{ 'trend-up': card.trend.startsWith('+'), 'trend-down': card.trend.startsWith('-') }">
                {{ card.trend }}
              </div>
            </div>
          </div>
        </div>

        <!-- 2. Form Elements -->
        <div class="grid-section">
          <h2 class="section-title">Form Components</h2>
          <div class="glass-panel content-padding form-demo">
            
            <div class="form-group">
              <label>Input Field</label>
              <el-input v-model="inputValue" placeholder="Type something..." class="glass-input" :prefix-icon="useRenderIcon('ep:edit')" />
            </div>

            <div class="form-group">
              <label>Select Option</label>
              <el-select v-model="selectValue" placeholder="Select Option" class="glass-select" popper-class="glass-popper">
                <el-option label="Glass Theme" value="glass" />
                <el-option label="Minimal" value="minimal" />
              </el-select>
            </div>

            <div class="form-row">
               <div class="form-group">
                  <label>Switch</label>
                  <el-switch v-model="switchValue" active-text="Active" />
               </div>
               <div class="form-group">
                  <label>Slider</label>
                  <el-slider v-model="sliderValue" class="glass-slider" />
               </div>
            </div>

            <div class="form-group">
               <label>Date Picker</label>
               <el-date-picker v-model="dateValue" type="date" placeholder="Pick a day" class="glass-date-picker" popper-class="glass-popper" />
            </div>
            
            <div class="form-actions">
              <el-button class="glass-btn">Cancel</el-button>
              <el-button type="primary" class="glass-btn-primary" :loading="loading" @click="startLoading">Submit</el-button>
            </div>
          </div>
        </div>

        <!-- 3. Typography & Buttons -->
        <div class="grid-section">
          <h2 class="section-title">Typography & Actions</h2>
          <div class="glass-panel content-padding">
            <h1 class="text-h1">Heading 1</h1>
            <h2 class="text-h2">Heading 2</h2>
            <h3 class="text-h3">Heading 3</h3>
            <p class="text-body">
              This is standard body text. Glassmorphism relies on background blur and semi-transparent layers to create depth.
            </p>
            
            <div class="divider"></div>
            
            <div class="button-group">
               <el-button class="glass-btn">Default</el-button>
               <el-button type="primary" class="glass-btn-primary">Primary</el-button>
               <el-button type="success" class="glass-btn-success" circle :icon="useRenderIcon('ep:check')" />
               <el-button type="danger" class="glass-btn-danger" circle :icon="useRenderIcon('ep:delete')" />
               <el-button type="warning" class="glass-btn-warning" round>Warning</el-button>
            </div>

             <div class="mt-4">
                 <el-tag class="glass-tag mr-2">Tag One</el-tag>
                 <el-tag type="success" class="glass-tag mr-2">Success</el-tag>
                 <el-tag type="warning" class="glass-tag">Warning</el-tag>
             </div>
          </div>
        </div>

        <!-- 4. Data Table -->
        <div class="grid-section full-width">
          <h2 class="section-title">Data Grid</h2>
          <div class="glass-panel no-padding overflow-hidden">
             <el-table :data="tableData" style="width: 100%" class="glass-table">
                <el-table-column prop="date" label="Date" width="180" />
                <el-table-column prop="name" label="Name" width="180" />
                <el-table-column prop="type" label="Type" />
                <el-table-column prop="status" label="Status">
                   <template #default="scope">
                      <el-tag :type="scope.row.status === 'Active' ? 'success' : scope.row.status === 'Done' ? 'info' : 'warning'" size="small" effect="dark" class="glass-tag-sm">
                         {{ scope.row.status }}
                      </el-tag>
                   </template>
                </el-table-column>
                <el-table-column label="Operations" width="120">
                   <template #default>
                      <el-button link type="primary" size="small">Edit</el-button>
                      <el-button link type="danger" size="small">Delete</el-button>
                   </template>
                </el-table-column>
             </el-table>
          </div>
        </div>

        <!-- 5. Dialog & Alerts -->
         <div class="grid-section full-width">
            <h2 class="section-title">Feedback</h2>
            <div class="glass-panel content-padding flex-row">
               <el-alert title="Success Tips" type="success" effect="dark" class="glass-alert" show-icon />
               <el-alert title="Warning Info" type="warning" effect="dark" class="glass-alert" show-icon />
               <el-alert title="Error Message" type="error" effect="dark" class="glass-alert" show-icon />
            </div>
         </div>

      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// Variables
$glass-bg: rgba(255, 255, 255, 0.05);
$glass-border: rgba(255, 255, 255, 0.1);
$glass-blur: blur(16px);
$primary-color: #6366f1;
$text-primary: #ffffff;
$text-secondary: rgba(255, 255, 255, 0.7);

.glass-showcase-page {
  position: relative;
  height: 100%;
  width: 100%;
  background: #0f172a;
  color: $text-primary;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}

// Background Mesh
.background-mesh {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  filter: blur(80px);
  opacity: 0.5;
}
.mesh-shape {
  position: absolute;
  border-radius: 50%;
  animation: float 20s infinite ease-in-out alternate;
}
.shape-1 { width: 60vw; height: 60vw; background: radial-gradient(circle, #4f46e5 0%, transparent 70%); top: -20%; left: -10%; }
.shape-2 { width: 50vw; height: 50vw; background: radial-gradient(circle, #ec4899 0%, transparent 70%); bottom: -10%; right: -10%; animation-delay: -5s; }
.shape-3 { width: 30vw; height: 30vw; background: radial-gradient(circle, #06b6d4 0%, transparent 70%); top: 40%; left: 30%; opacity: 0.4; animation-delay: -2s; }
@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(20px, -20px); }
}

.background-overlay {
   position: absolute;
   top: 0; left: 0; width: 100%; height: 100%;
   background: rgba(15, 23, 42, 0.5);
   backdrop-filter: blur(10px);
   z-index: 1;
}

// Content Layout
.content-container {
  position: relative;
  z-index: 2;
  height: 100%;
  overflow-y: auto;
  padding: 24px;
}

.showcase-header {
   display: flex;
   justify-content: space-between;
   align-items: center;
   padding: 30px;
   margin-bottom: 30px;
   
   .page-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
      background: linear-gradient(to right, #fff, #a5b4fc);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
   }
   .page-subtitle {
      color: $text-secondary;
      font-size: 16px;
   }
}

// Grid
.showcase-grid {
   display: grid;
   grid-template-columns: repeat(2, 1fr);
   gap: 24px;
   padding-bottom: 40px;
}

.grid-section {
   &.full-width {
      grid-column: span 2;
   }
}

.section-title {
   font-size: 18px;
   font-weight: 600;
   margin-bottom: 16px;
   color: #e2e8f0;
   padding-left: 8px;
   border-left: 3px solid $primary-color;
}

// Glass Components
.glass-panel {
   background: $glass-bg;
   backdrop-filter: $glass-blur;
   border: 1px solid $glass-border;
   border-radius: 20px;
   box-shadow: 0 4px 20px rgba(0,0,0,0.1);
   
   &.content-padding {
      padding: 24px;
   }
   &.no-padding {
      padding: 0;
   }
   &.flex-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
   }
}

.glass-panel-hover {
   @extend .glass-panel;
   transition: transform 0.3s, box-shadow 0.3s;
   &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      background: rgba(255, 255, 255, 0.08);
   }
}

// Stats Cards
.cards-grid {
   display: grid;
   grid-template-columns: repeat(3, 1fr);
   gap: 20px;
}
.stat-card {
   padding: 20px;
   display: flex;
   align-items: center;
   gap: 16px;
}
.card-icon {
   width: 48px; height: 48px;
   border-radius: 12px;
   display: flex; align-items: center; justify-content: center;
}
.card-info {
   flex: 1;
   .card-title { font-size: 14px; color: $text-secondary; }
   .card-value { font-size: 24px; font-weight: 700; color: #fff; margin-top: 4px; }
}
.card-trend {
   font-size: 13px; font-weight: 500;
   &.trend-up { color: #10b981; }
   &.trend-down { color: #f59e0b; }
}

// Form Elements
.form-demo {
   display: flex; flex-direction: column; gap: 20px;
}
.form-group {
   margin-bottom: 4px;
   label { display: block; margin-bottom: 8px; color: $text-secondary; font-size: 13px; }
}
.form-row {
   display: flex; gap: 20px;
   > div { flex: 1; }
}
.form-actions {
   display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px;
}

// Custom Element Plus Overrides for Glass Effect
:deep(.el-input__wrapper), 
:deep(.el-textarea__inner),
:deep(.el-select__wrapper) {
   background-color: rgba(255, 255, 255, 0.05) !important;
   box-shadow: none !important;
   border: 1px solid rgba(255, 255, 255, 0.1);
   border-radius: 12px;
   color: white;
   transition: all 0.3s;
   
   &:hover, &.is-focus {
      background-color: rgba(255, 255, 255, 0.1) !important;
      border-color: $primary-color;
   }
   input { color: white; }
}

:deep(.el-switch__core) {
   background: rgba(255,255,255,0.1);
   border-color: rgba(255,255,255,0.2);
}
:deep(.el-switch.is-checked .el-switch__core) {
   background: $primary-color;
   border-color: $primary-color;
}

// Buttons
.glass-btn {
   background: rgba(255, 255, 255, 0.05);
   border: 1px solid rgba(255, 255, 255, 0.1);
   color: #fff;
   &:hover { background: rgba(255, 255, 255, 0.15); border-color: rgba(255, 255, 255, 0.3); }
}
.glass-btn-primary {
   background: linear-gradient(135deg, #6366f1, #8b5cf6);
   border: none;
   &:hover { box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); }
}
.glass-btn-success { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }
.glass-btn-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
.glass-btn-warning { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }

// Tags
.glass-tag {
   background: rgba(255, 255, 255, 0.1);
   border: 1px solid rgba(255, 255, 255, 0.1);
   color: #fff;
}

// Table
.glass-table {
   background: transparent !important;
   --el-table-bg-color: transparent;
   --el-table-tr-bg-color: transparent;
   --el-table-header-bg-color: rgba(255, 255, 255, 0.05);
   --el-table-border-color: rgba(255, 255, 255, 0.05);
   --el-table-text-color: #e2e8f0;
   --el-table-header-text-color: #94a3b8;
   --el-table-row-hover-bg-color: rgba(255, 255, 255, 0.08);
   
   :deep(th.el-table__cell) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
   }
   :deep(td.el-table__cell) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
   }
}

// Alerts
.glass-alert {
   background: rgba(255, 255, 255, 0.05);
   border: 1px solid rgba(255, 255, 255, 0.1);
   flex: 1;
}

// Typography
.text-h1 { font-size: 28px; font-weight: 700; margin-bottom: 10px; color: #fff; }
.text-h2 { font-size: 24px; font-weight: 600; margin-bottom: 10px; color: #fff; }
.text-h3 { font-size: 20px; font-weight: 600; margin-bottom: 10px; color: #fff; }
.text-body { font-size: 14px; line-height: 1.6; color: $text-secondary; margin-bottom: 20px; }

.divider {
   height: 1px;
   background: rgba(255, 255, 255, 0.1);
   margin: 20px 0;
}

// Scrollbar
.custom-scrollbar {
   &::-webkit-scrollbar { width: 6px; }
   &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
      &:hover { background: rgba(255, 255, 255, 0.2); }
   }
}
</style>
