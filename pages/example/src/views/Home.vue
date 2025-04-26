<template>
  <div class="home">
    <h1>ScMap 组件示例</h1>
    <div class="examples-list">
      <router-link to="/airline" class="example-card">
        <h2>航线示例</h2>
        <p>展示地图航线（Flight）功能</p>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 无需额外脚本代码
</script>

<style scoped>
.home {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.examples-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.example-card {
  display: block;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  text-decoration: none;
  color: inherit;
}

.example-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px 0 rgba(0, 0, 0, 0.15);
}

.example-card h2 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #1890ff;
}

.example-card p {
  margin: 0;
  color: #666;
}
</style> 