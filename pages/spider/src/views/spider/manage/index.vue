<template>
  <section class="spider-manage">
    <header class="spider-manage__hero">
      <div>
        <small>Management</small>
        <h1>爬虫管理</h1>
        <p>卡片承载新增、编辑、启停和编排入口。鼠标经过显示工具栏，点击编排跳转到独立编排页。</p>
      </div>
      <button type="button">新增爬虫</button>
    </header>

    <div class="spider-manage__grid">
      <article class="spider-card spider-card--add">
        <span>+</span>
        <strong>新增爬虫</strong>
        <p>名称、主入口、执行器、深度采集、失败通知。</p>
      </article>

      <article v-for="item in spiders" :key="item.spiderCode" class="spider-card">
        <div class="spider-card__toolbar">
          <button type="button">编辑</button>
          <button type="button">{{ item.spiderStatus === 'ENABLED' ? '禁用' : '启用' }}</button>
          <button type="button" @click="router.push('/spider/orchestration')">编排</button>
        </div>

        <div class="spider-card__head">
          <small>{{ item.spiderCode }}</small>
          <strong>{{ item.spiderName }}</strong>
          <em>{{ item.spiderSiteHost }}</em>
        </div>

        <div class="spider-card__content">
          <div>
            <span>执行器</span>
            <strong>{{ item.spiderExecutorType }}</strong>
          </div>
          <div>
            <span>深度采集</span>
            <strong>{{ item.spiderCollectDeepUrl ? "开启" : "关闭" }}</strong>
          </div>
          <div>
            <span>失败通知</span>
            <strong>{{ item.spiderNotifyOnFailure ? "开启" : "关闭" }}</strong>
          </div>
          <div>
            <span>状态</span>
            <strong>{{ item.spiderStatus === "ENABLED" ? "启用" : "停用" }}</strong>
          </div>
        </div>

        <p class="spider-card__entry">{{ item.spiderEntryUrl }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { spiderDefinitionSamples as spiders } from "../../../api/spider";

const router = useRouter();
</script>

<style scoped lang="scss">
.spider-manage {
  min-height: 100%;
  padding: 24px 12px;
  display: grid;
  gap: 18px;
  background:
    radial-gradient(circle at left top, rgba(14, 165, 233, 0.12), transparent 24%),
    linear-gradient(180deg, #f8f6f1 0%, #efebe4 100%);
}

.spider-manage__hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 22px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);

  small {
    color: #0369a1;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 8px 0;
    font-size: 28px;
    color: #111827;
  }

  p {
    margin: 0;
    color: #475569;
    line-height: 1.8;
  }

  button {
    height: 42px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    background: #0f172a;
    color: #fff;
    cursor: pointer;
  }
}

.spider-manage__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.spider-card {
  position: relative;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(14, 165, 233, 0.3);
    box-shadow: 0 22px 42px rgba(14, 116, 144, 0.12);
  }
}

.spider-card--add {
  align-items: center;
  justify-content: center;
  border-style: dashed;
  text-align: center;

  span {
    display: inline-flex;
    width: 60px;
    height: 60px;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: rgba(15, 23, 42, 0.06);
    color: #111827;
    font-size: 34px;
  }

  strong {
    font-size: 24px;
    color: #111827;
  }

  p {
    margin: 0;
    color: #64748b;
    line-height: 1.8;
  }
}

.spider-card__toolbar {
  position: absolute;
  top: 14px;
  right: 14px;
  display: flex;
  gap: 6px;
  padding: 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.12);
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;

  button {
    height: 30px;
    padding: 0 10px;
    border: 0;
    border-radius: 10px;
    background: #f1f5f9;
    color: #0f172a;
    cursor: pointer;
  }
}

.spider-card:hover .spider-card__toolbar {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.spider-card__head {
  display: grid;
  gap: 6px;
  padding-right: 120px;

  small {
    color: #94a3b8;
  }

  strong {
    font-size: 24px;
    color: #111827;
  }

  em {
    color: #0f766e;
    font-style: normal;
  }
}

.spider-card__content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  div {
    display: grid;
    gap: 4px;
    padding: 12px;
    border-radius: 16px;
    background: #f8fafc;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }

  strong {
    color: #111827;
  }
}

.spider-card__entry {
  margin: auto 0 0;
  color: #475569;
  line-height: 1.7;
  word-break: break-all;
}

@media (max-width: 1100px) {
  .spider-manage__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .spider-manage__hero {
    flex-direction: column;
  }

  .spider-manage__grid {
    grid-template-columns: 1fr;
  }

  .spider-card__content {
    grid-template-columns: 1fr;
  }
}
</style>
