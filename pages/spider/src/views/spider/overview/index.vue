<template>
  <section class="spider-overview">
    <header class="spider-overview__hero">
      <div>
        <small>Overview</small>
        <h1>爬虫总览</h1>
        <p>这里承接首页总览入口，展示统计卡、趋势区、站点分布和实时日志。</p>
      </div>
      <button type="button" @click="router.push('/spider/manage')">进入爬虫管理</button>
    </header>

    <div class="spider-overview__stats">
      <article v-for="item in stats" :key="item.label" class="stat-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.tip }}</small>
      </article>
    </div>

    <div class="spider-overview__grid">
      <article class="panel-card">
        <div class="panel-card__head">
          <strong>时间趋势区</strong>
          <span>解析量 / 总览图标</span>
        </div>
        <ul>
          <li v-for="item in timeBreakdown" :key="item.time">
            <span>{{ item.time }}</span>
            <strong>解析 {{ item.parseCount }}</strong>
            <em>结果 {{ item.resultCount }}</em>
          </li>
        </ul>
      </article>

      <article class="panel-card">
        <div class="panel-card__head">
          <strong>站点分布</strong>
          <span>地址数量 / 结果数量</span>
        </div>
        <ul>
          <li v-for="item in siteBreakdown" :key="item.site">
            <span>{{ item.site }}</span>
            <strong>{{ item.urlCount }} 地址</strong>
            <em>{{ item.resultCount }} 结果</em>
          </li>
        </ul>
      </article>
    </div>

    <article class="panel-card panel-card--logs">
      <div class="panel-card__head">
        <strong>实时运行日志 TopN</strong>
        <span>后续接 socket / 任务总线</span>
      </div>
      <ul class="log-list">
        <li v-for="item in logs" :key="item.time + item.message">
          <span>{{ item.time }}</span>
          <strong>{{ item.level }}</strong>
          <p>{{ item.message }}</p>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const stats = [
  { label: "爬虫数量", value: "18 / 6", tip: "总数 / 运行中" },
  { label: "地址数量", value: "26,480", tip: "待解析与已解析总量" },
  { label: "地址解析数量", value: "10,292", tip: "已完成 URL 解析" },
  { label: "解析结果数量", value: "8,641", tip: "结构化结果落库量" },
  { label: "剩余地址数量", value: "16,188", tip: "队列剩余待处理" },
];

const timeBreakdown = [
  { time: "09:00", parseCount: 320, resultCount: 286 },
  { time: "10:00", parseCount: 518, resultCount: 472 },
  { time: "11:00", parseCount: 476, resultCount: 449 },
  { time: "12:00", parseCount: 268, resultCount: 232 },
];

const siteBreakdown = [
  { site: "example.com", urlCount: 1120, resultCount: 884 },
  { site: "example.gov.cn", urlCount: 684, resultCount: 521 },
  { site: "detail.portal.net", urlCount: 940, resultCount: 806 },
];

const logs = [
  { time: "12:01:08", level: "INFO", message: "policy-bulletin 进入 URL 解析节点，抽取到 42 个候选地址。" },
  { time: "12:01:26", level: "WARN", message: "news-portal 命中登录页，切换到子流程并等待账号池凭据。" },
  { time: "12:01:49", level: "INFO", message: "detail.portal.net 详情页解析完成，已映射 12 个字段。" },
  { time: "12:02:03", level: "ERROR", message: "sms-login-flow 需要人工处理验证码，已推送通知。" },
];
</script>

<style scoped lang="scss">
.spider-overview {
  min-height: 100%;
  padding: 24px 12px;
  display: grid;
  gap: 18px;
  background:
    radial-gradient(circle at top right, rgba(251, 191, 36, 0.14), transparent 24%),
    linear-gradient(180deg, #f6f7f2 0%, #ecf0e7 100%);
}

.spider-overview__hero,
.panel-card,
.stat-card {
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
}

.spider-overview__hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-start;
  padding: 22px;
  border-radius: 24px;

  small {
    color: #8a6a28;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h1 {
    margin: 8px 0;
    color: #17202a;
    font-size: 28px;
  }

  p {
    margin: 0;
    max-width: 680px;
    color: #51606f;
    line-height: 1.8;
  }

  button {
    height: 42px;
    padding: 0 16px;
    border: 0;
    border-radius: 999px;
    background: #17202a;
    color: #fff;
    cursor: pointer;
  }
}

.spider-overview__stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.stat-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-radius: 20px;

  span {
    color: #6b7280;
    font-size: 13px;
  }

  strong {
    color: #111827;
    font-size: 28px;
    line-height: 1.1;
  }

  small {
    color: #94a3b8;
  }
}

.spider-overview__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.panel-card {
  padding: 20px;
  border-radius: 24px;
}

.panel-card__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;

  strong {
    color: #111827;
    font-size: 16px;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.panel-card ul {
  display: grid;
  gap: 10px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.panel-card li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 16px;
  background: #f8fafc;

  span {
    color: #334155;
  }

  strong {
    color: #0f766e;
  }

  em {
    font-style: normal;
    color: #7c3aed;
  }
}

.panel-card--logs .log-list li {
  grid-template-columns: 84px 60px minmax(0, 1fr);
}

.log-list strong {
  color: #8a6a28;
}

.log-list p {
  margin: 0;
  color: #334155;
  line-height: 1.7;
}

@media (max-width: 1100px) {
  .spider-overview__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .spider-overview__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .spider-overview__hero {
    flex-direction: column;
  }

  .spider-overview__stats {
    grid-template-columns: 1fr;
  }

  .panel-card li,
  .panel-card--logs .log-list li {
    grid-template-columns: 1fr;
  }
}
</style>
