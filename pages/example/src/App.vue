<template>
  <div class="app">
    <header class="header">
      <h1>ScMap 组件示例</h1>
      <nav>
        <router-link to="/">首页</router-link>
        <router-link to="/airline">航线示例</router-link>
      </nav>
    </header>
    <main class="content">
      <router-view :key="$route.fullPath" />
    </main>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  color: var(--el-text-color-primary);
  background-color: #f5f7fa;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 20px;
  color: #1890ff;
}

nav {
  display: flex;
  gap: 20px;
}

nav a {
  text-decoration: none;
  color: var(--el-text-color-primary);
  font-weight: 500;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover {
  background-color: #f0f0f0;
}

nav a.router-link-active {
  color: #1890ff;
  font-weight: bold;
}

.content {
  flex: 1;
  padding: 20px;
}
</style>
