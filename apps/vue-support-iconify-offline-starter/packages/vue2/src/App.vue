<template>
  <div class="content">
    <p>Vue2 Version</p>
    <IconifyIcon icon="openmoji:1st-place-medal" />
    <IconifyIcon icon="vscode-icons:file-type-access2" />
    <IconifyIcon icon="logos:bigpanda" />
    <IconifyIcon icon="fxemoji:2hearts" />
    <IconifyIcon icon="flat-color-icons:businessman" />
    <IconifyIcon icon="cif:cn" />
  </div>
</template>

<script>
import { Icon as IconifyIcon } from "@iconify/vue2";

export default {
  components: {
    IconifyIcon,
  },
};
</script>

<style scoped>
.content {
  min-width: 400px;
  min-height: 500px;
  margin: 40px auto;
  padding: 48px;
  text-align: center;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(240, 147, 251, 0.3);
  position: relative;
  overflow: hidden;
}

.content::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 70%
  );
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.content p {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 32px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

svg {
  margin: 16px;
  width: 64px;
  height: 64px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

svg:hover {
  transform: translateY(-8px) scale(1.1);
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.25));
}
</style>
