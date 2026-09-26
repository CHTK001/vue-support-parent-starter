<template>
  <IdiomLearnCards :cards="cards" @close="close" />
</template>

<script setup lang="ts">
/**
 * IdiomCardView —— 成语学习卡片（独立页面/弹窗页）
 *
 * 数据来源：游戏页把本次两块所属的成语写入 sessionStorage['eduai-idiom-learn'] 后打开本页；
 * 也支持 ?names=守株待兔,亡羊补牢 直接访问（用 ?ids= 再补齐出处/例句）。
 *
 * 路由 meta.remind = true：只注册路由、不进菜单，也不受菜单导航控制，作为独立弹窗页使用。
 */
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { eduaiApi } from "../api/eduaiApi";
import IdiomLearnCards, { type LearnCard } from "../components/IdiomLearnCards.vue";

const STORAGE_KEY = "eduai-idiom-learn";
const route = useRoute();
const cards = ref<LearnCard[]>([]);

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
    cards.value = names.map((name) => ({ content: name }));
  }
  void enrichFromIds();
}

/** 真实成语（id > 0）补充出处/例句等详情 */
async function enrichFromIds() {
  const ids = String(route.query.ids ?? "")
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!ids.length) return;
  const details = await Promise.all(ids.map((id) => eduaiApi.getIdiomDetail(id).catch(() => null)));
  details.forEach((detail, idx) => {
    if (!detail) return;
    const hit = cards.value.findIndex((c) => c.content === detail.idiomContent);
    const index = hit >= 0 ? hit : idx;
    if (!cards.value[index]) return;
    cards.value[index] = {
      ...cards.value[index],
      content: detail.idiomContent,
      pinyin: detail.idiomPinyin || cards.value[index].pinyin,
      meaning: detail.idiomMeaning || cards.value[index].meaning,
      source: detail.idiomSource || cards.value[index].source,
      example: detail.idiomExample || cards.value[index].example,
    };
  });
}

function close() {
  // 弹窗页面优先自关；作为普通页面打开时返回趣味中心
  if (window.opener) {
    window.close();
    return;
  }
  window.location.href = "/edu/fun";
}

onMounted(() => {
  // 作为弹窗打开时隐藏框架外壳（复用 koi 的 main-maximize 约定），只留卡片内容
  if (window.opener) {
    document.documentElement.classList.add("main-maximize");
  }
  loadCards();
});

onBeforeUnmount(() => {
  document.documentElement.classList.remove("main-maximize");
});
</script>
