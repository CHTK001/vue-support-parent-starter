<script setup lang="ts">
import BaseSetting from './BaseSetting.vue';
</script>

<template>
  <div class="halloween-setting-wrapper">
    <BaseSetting />
  </div>
</template>

<style lang="scss">
html[data-skin="halloween"] {
  .right-panel {
    background: linear-gradient(180deg, #2c003e 0%, #1a0026 100%) !important;
    border-left: 2px solid #ff7518 !important;
    
    .project-configuration {
      border-bottom: 1px solid rgba(255, 117, 24, 0.3) !important;
      
      h4 {
        color: #ff7518 !important;
        font-family: 'Creepster', 'cursive', sans-serif;
        text-shadow: 0 0 5px rgba(255, 117, 24, 0.5);
      }
      
      svg {
        color: #b39ddb !important;
        
        &:hover {
          color: #ff7518 !important;
          background: rgba(255, 117, 24, 0.1) !important;
        }
      }
    }
    
    .el-divider__text {
      background-color: transparent !important;
      color: #ff7518 !important;
    }
    
    .el-switch__label {
      color: #b39ddb !important;
      
      &.is-active {
        color: #76ff03 !important;
      }
    }
  }
}
</style>
