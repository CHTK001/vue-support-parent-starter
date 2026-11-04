<template>
  <InsectLearnCards :cards="cards" @close="close" />
</template>

<script setup lang="ts">
/**
 * InsectCardView —— 昆虫图鉴卡片（独立页面/弹窗页）
 *
 * 数据来源：游戏页把本次两块所属的物种写入 sessionStorage['eduai-insect-learn'] 后打开本页；
 * 也支持 ?names=帝王蝶,西方蜜蜂 直接访问（用 ?ids= 再补齐学名/简介/所属目）。
 *
 * 路由 meta.remind = true：由 registerRoutesUnderLayout 注册为顶层路由，
 * 根 router-view 直接渲染组件，不进菜单、不套布局壳。
 */
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { eduaiApi } from "../api/eduaiApi";
import { routeUrl } from "../utils/routeUrl";
import InsectLearnCards, { type LearnCard } from "../components/InsectLearnCards.vue";

const STORAGE_KEY = "eduai-insect-learn";

/** 14 个目的中文名（与 InsectView 保持一致） */
const ORDER_LABELS: Record<string, string> = {
  coleoptera: "鞘翅目",
  lepidoptera: "鳞翅目",
  hymenoptera: "膜翅目",
  diptera: "双翅目",
  hemiptera: "半翅目",
  orthoptera: "直翅目",
  odonata: "蜻蜓目",
  mantodea: "螳螂目",
  neuroptera: "脉翅目",
  blattodea: "蜚蠊目",
  phasmatodea: "竹节虫目",
  dermaptera: "革翅目",
  megaloptera: "广翅目",
  trichoptera: "毛翅目",
};

/** 变态类型 slug → 中文名 */
function metamorphosisLabel(value?: string): string {
  if (value === "complete") return "完全变态";
  if (value === "incomplete") return "不完全变态";
  return "";
}

const route = useRoute();
const router = useRouter();
const cards = ref<LearnCard[]>([]);

/** 先读 sessionStorage（游戏页写入的完整卡片），没有再用 query 兜底 */
function loadCards() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        cards.value = parsed;
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
  } catch {
    /* ignore */
  }
  if (!cards.value.length) {
    const names = String(route.query.names ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    cards.value = names.map((name) => ({
      name,
      latin: "",
      order: "",
      metamorphosis: "",
      summary: "",
      accent: "",
    }));
  }
  void enrichFromIds();
}

/** 真实物种（id > 0）补充学名/简介/所属目/变态类型等详情 */
async function enrichFromIds() {
  const ids = String(route.query.ids ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!ids.length) return;
  const details = await Promise.all(ids.map((id) => eduaiApi.getInsectDetail(id).catch(() => null)));
  details.forEach((detail, idx) => {
    if (!detail) return;
    const hit = cards.value.findIndex((c) => c.name === detail.insectName);
    const index = hit >= 0 ? hit : idx;
    if (!cards.value[index]) return;
    cards.value[index] = {
      ...cards.value[index],
      name: detail.insectName,
      latin: detail.insectLatin || cards.value[index].latin,
      order: ORDER_LABELS[detail.insectOrder] ?? detail.insectOrder ?? "",
      metamorphosis: metamorphosisLabel(detail.insectMetamorphosis),
      summary: detail.insectSummary || cards.value[index].summary,
      accent: detail.insectAccent || cards.value[index].accent,
    };
  });
}

function close() {
  // 弹窗页面优先自关；作为普通页面打开时返回趣味中心
  if (window.opener) {
    window.close();
    return;
  }
  // 直接写 pathname 在 hash 路由下会被启动归一化改写回首页，必须带 # 前缀
  window.location.href = routeUrl(router, "/edu/fun");
}

loadCards();
</script>
