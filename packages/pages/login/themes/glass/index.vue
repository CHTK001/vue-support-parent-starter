<template>
  <div class="glass-login-page">
    <!-- 动态背景 -->
    <div class="background-mesh">
      <div class="mesh-shape shape-1"></div>
      <div class="mesh-shape shape-2"></div>
      <div class="mesh-shape shape-3"></div>
      <div class="mesh-shape shape-4"></div>
    </div>
    
    <div class="background-overlay"></div>

    <!-- 顶部工具栏 -->
    <div class="toolbar-container">
        <slot name="toolbar"></slot>
    </div>

    <!-- 主要内容区 -->
    <div class="login-main-container">
      <div class="glass-card">
        <!-- 左侧品牌区域 -->
        <div class="brand-section">
          <div class="brand-content">
            <h1 class="brand-title">FUTURE<br>VISION</h1>
            <p class="brand-slogan">Experience the next generation of management.</p>
            <div class="glass-decoration"></div>
          </div>
        </div>

        <!-- 右侧表单区域 -->
        <div class="form-section">
          <div class="form-wrapper">
             <div class="form-header">
                <h2>Welcome Back</h2>
                <p>Please enter your details to sign in.</p>
             </div>
            <slot name="form"></slot>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: "GlassLoginTheme",
});
</script>

<style lang="scss" scoped>
.glass-login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: #0f172a; // Dark base
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  color: #ffffff;
}

.background-mesh {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  filter: blur(80px);
  opacity: 0.8;
}

.mesh-shape {
  position: absolute;
  border-radius: 50%;
  animation: float-mesh 20s infinite ease-in-out alternate;
}

.shape-1 {
  width: 60vw;
  height: 60vw;
  background: radial-gradient(circle, #4f46e5 0%, rgba(79, 70, 229, 0) 70%);
  top: -20%;
  left: -10%;
  animation-delay: -5s;
}

.shape-2 {
  width: 50vw;
  height: 50vw;
  background: radial-gradient(circle, #ec4899 0%, rgba(236, 72, 153, 0) 70%);
  bottom: -10%;
  right: -10%;
  animation-delay: -2s;
}

.shape-3 {
  width: 40vw;
  height: 40vw;
  background: radial-gradient(circle, #06b6d4 0%, rgba(6, 182, 212, 0) 70%);
  top: 40%;
  left: 30%;
  opacity: 0.6;
}

.shape-4 {
    width: 30vw;
    height: 30vw;
    background: radial-gradient(circle, #8b5cf6 0%, rgba(139, 92, 246, 0) 70%);
    top: 10%;
    right: 20%;
    animation-delay: -8s;
}

.background-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    background: rgba(15, 23, 42, 0.3); // Overlay to ensure text readability
    backdrop-filter: blur(10px); // Slight overall blur
}

.toolbar-container {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    padding: 20px;
}

.login-main-container {
  position: relative;
  z-index: 2;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.glass-card {
  width: 100%;
  max-width: 1000px;
  min-height: 600px;
  display: flex;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.brand-section {
  flex: 1;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 100%);
}

.brand-title {
  font-size: 4rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 20px;
  background: linear-gradient(to right, #fff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -2px;
}

.brand-slogan {
  font-size: 1.25rem;
  color: #94a3b8;
  font-weight: 300;
}

.glass-decoration {
    position: absolute;
    bottom: -50px;
    left: -50px;
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
    border-radius: 50%;
}

.form-section {
  flex: 1;
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-header {
    margin-bottom: 40px;
    h2 {
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 10px;
        color: white;
    }
    p {
        color: #94a3b8;
    }
}

@keyframes float-mesh {
  0% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -30px) scale(1.1); }
  100% { transform: translate(-20px, 20px) scale(0.95); }
}

@media (max-width: 768px) {
  .glass-card {
    flex-direction: column;
    min-height: auto;
  }

  .brand-section {
    padding: 40px;
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .brand-title {
      font-size: 2.5rem;
  }

  .form-section {
    padding: 40px 20px;
  }
}
</style>

