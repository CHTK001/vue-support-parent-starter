<template>
  <div class="device-home system-container">
    <div class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Device Center</p>
        <h1>设备商户与设备资产一体管理</h1>
        <p class="summary">
          独立部署时管理商户、厂商接入和设备预览，集成到项目中心时复用同一套设备页面。
        </p>
      </div>
      <div class="hero-actions">
        <router-link class="hero-card" to="/device/merchant">
          <IconifyIconOnline icon="ri:store-2-line" />
          <span>商户管理</span>
        </router-link>
        <router-link class="hero-card" to="/device/manage">
          <IconifyIconOnline icon="mingcute:computer-camera-fill" />
          <span>设备管理</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.device-home {
  min-height: 100%;
  padding: 32px;
}

.hero {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 24px;
  padding: 32px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(28, 126, 214, 0.18), transparent 40%),
    linear-gradient(135deg, #f6fbff 0%, #eef5ff 45%, #f8fafc 100%);
  border: 1px solid rgba(59, 130, 246, 0.12);
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: #1d4ed8;
}

h1 {
  margin: 0;
  font-size: 36px;
  line-height: 1.15;
  color: #0f172a;
}

.summary {
  max-width: 680px;
  margin: 16px 0 0;
  font-size: 15px;
  line-height: 1.8;
  color: #475569;
}

.hero-actions {
  display: grid;
  gap: 16px;
  align-content: center;
}

.hero-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 18px;
  text-decoration: none;
  color: #0f172a;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 52px rgba(15, 23, 42, 0.1);
  }

  svg {
    font-size: 24px;
    color: #2563eb;
  }

  span {
    font-size: 16px;
    font-weight: 600;
  }
}

@media (width <= 960px) {
  .hero {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 28px;
  }
}
</style>
