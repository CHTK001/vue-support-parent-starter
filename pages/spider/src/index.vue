<template>
  <section class="spider-home">
    <div class="spider-home__shell">
      <div class="spider-home__glow spider-home__glow--amber" />
      <div class="spider-home__glow spider-home__glow--cyan" />

      <div class="spider-home__panel">
        <div class="spider-home__toolbar">
          <button class="spider-home__settings" type="button" @click="router.push('/spider/manage')">
            进入爬虫管理
          </button>
        </div>

        <div class="spider-home__title">
          <small>Spider Center</small>
          <h1>AI 可视化编排爬虫</h1>
          <p>主页面只保留两个入口：总览和爬虫管理。编排、预览、人工介入全部从管理页进入。</p>
        </div>

        <div class="spider-home__grid">
          <button
            v-for="item in cards"
            :key="item.path"
            class="spider-home__card"
            type="button"
            @click="router.push(item.path)"
          >
            <span class="spider-home__badge">{{ item.badge }}</span>
            <strong>{{ item.title }}</strong>
            <p>{{ item.desc }}</p>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const cards = [
  {
    title: "总览",
    badge: "01",
    path: "/spider/overview",
    desc: "统计爬虫数量、地址队列、解析结果、趋势图与实时运行日志。",
  },
  {
    title: "爬虫管理",
    badge: "02",
    path: "/spider/manage",
    desc: "维护爬虫卡片、执行器、深度采集、通知开关，并进入编排器。",
  },
];
</script>

<style scoped lang="scss">
.spider-home {
  min-height: 100%;
  padding: 16px;
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.18), transparent 28%),
    radial-gradient(circle at right bottom, rgba(34, 211, 238, 0.18), transparent 30%),
    linear-gradient(180deg, #f7f4ec 0%, #ede8dd 100%);
}

.spider-home__shell {
  position: relative;
  min-height: 100%;
}

.spider-home__glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(30px);
  pointer-events: none;
}

.spider-home__glow--amber {
  top: 24px;
  left: 10px;
  width: 180px;
  height: 180px;
  background: rgba(245, 158, 11, 0.22);
}

.spider-home__glow--cyan {
  right: 10px;
  bottom: 20px;
  width: 220px;
  height: 220px;
  background: rgba(8, 145, 178, 0.2);
}

.spider-home__panel {
  position: relative;
  z-index: 1;
  min-height: 100%;
  padding: 28px;
  border: 1px solid rgba(32, 27, 20, 0.08);
  border-radius: 32px;
  background: rgba(255, 251, 245, 0.72);
  backdrop-filter: blur(12px);
  box-shadow: 0 24px 60px rgba(68, 54, 35, 0.08);
}

.spider-home__toolbar {
  display: flex;
  justify-content: flex-end;
}

.spider-home__settings {
  height: 42px;
  padding: 0 18px;
  border: 1px solid rgba(32, 27, 20, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  color: #201b14;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.spider-home__title {
  margin: 48px 0 28px;
  display: grid;
  gap: 10px;

  small {
    color: #8a6a28;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: #201b14;
    font-size: 38px;
    line-height: 1.08;
  }

  p {
    max-width: 720px;
    margin: 0;
    color: #5f564a;
    font-size: 15px;
    line-height: 1.8;
  }
}

.spider-home__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.spider-home__card {
  position: relative;
  min-height: 260px;
  display: grid;
  align-content: end;
  gap: 12px;
  padding: 22px;
  border: 1px solid rgba(32, 27, 20, 0.08);
  border-radius: 28px;
  background:
    linear-gradient(160deg, rgba(255, 251, 245, 0.96), rgba(242, 235, 220, 0.9));
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(146, 116, 45, 0.28);
    box-shadow: 0 24px 44px rgba(84, 64, 34, 0.12);
  }

  strong {
    color: #201b14;
    font-size: 28px;
  }

  p {
    margin: 0;
    color: #5f564a;
    line-height: 1.8;
  }
}

.spider-home__badge {
  position: absolute;
  top: 18px;
  right: 18px;
  display: inline-flex;
  width: 54px;
  height: 54px;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(32, 27, 20, 0.08);
  color: #201b14;
  font-size: 18px;
  font-weight: 700;
}

@media (max-width: 720px) {
  .spider-home__panel {
    padding: 18px;
    border-radius: 24px;
  }

  .spider-home__title {
    margin-top: 28px;

    h1 {
      font-size: 28px;
    }
  }

  .spider-home__grid {
    grid-template-columns: 1fr;
  }
}
</style>
