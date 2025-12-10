<script setup>
/**
 * 每日名言部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.0
 */
import { reactive, onMounted, computed } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";

// 名言数据
const quotes = [
  { text: "生活不是等待风暴过去，而是学会在风雨中起舞。", author: "佚名" },
  { text: "成功不是终点，失败也不是终结，唯有勇气才是永恒的。", author: "丘吉尔" },
  { text: "今天的努力是为了明天的惊艳。", author: "佚名" },
  { text: "不积跬步，无以至千里；不积小流，无以成江海。", author: "荀子" },
  { text: "千里之行，始于足下。", author: "老子" },
  { text: "学而不思则罔，思而不学则殆。", author: "孔子" },
  { text: "天行健，君子以自强不息。", author: "周易" },
  { text: "宝剑锋从磨砺出，梅花香自苦寒来。", author: "佚名" },
  { text: "路漫漫其修远兮，吾将上下而求索。", author: "屈原" },
  { text: "业精于勤，荒于嬉；行成于思，毁于随。", author: "韩愈" },
  { text: "世上无难事，只怕有心人。", author: "佚名" },
  { text: "志不立，天下无可成之事。", author: "王阳明" },
  { text: "人生自古谁无死，留取丹心照汗青。", author: "文天祥" },
  { text: "先天下之忧而忧，后天下之乐而乐。", author: "范仲淹" },
  { text: "不畏浮云遮望眼，自缘身在最高层。", author: "王安石" },
  { text: "海纳百川，有容乃大；壁立千仞，无欲则刚。", author: "林则徐" },
  { text: "少年易老学难成，一寸光阴不可轻。", author: "朱熹" },
  { text: "读书破万卷，下笔如有神。", author: "杜甫" },
  { text: "书山有路勤为径，学海无涯苦作舟。", author: "韩愈" },
  { text: "纸上得来终觉浅，绝知此事要躬行。", author: "陆游" },
];

// 环境变量
const env = reactive({
  loading: false,
  currentQuote: null,
  quoteIndex: 0,
});

/**
 * 获取随机名言
 */
const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  env.quoteIndex = randomIndex;
  env.currentQuote = quotes[randomIndex];
};

/**
 * 复制名言到剪贴板
 */
const copyQuote = () => {
  if (!env.currentQuote) return;
  const text = `"${env.currentQuote.text}" —— ${env.currentQuote.author}`;
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message("复制成功", { type: "success" });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      message("复制失败", { type: "error" });
    });
};

/**
 * 切换到下一条名言
 */
const nextQuote = () => {
  env.quoteIndex = (env.quoteIndex + 1) % quotes.length;
  env.currentQuote = quotes[env.quoteIndex];
};

/**
 * 切换到上一条名言
 */
const prevQuote = () => {
  env.quoteIndex = (env.quoteIndex - 1 + quotes.length) % quotes.length;
  env.currentQuote = quotes[env.quoteIndex];
};

// 组件挂载时获取随机名言
onMounted(() => {
  getRandomQuote();
});
</script>

<template>
  <div class="quote-module">
    <div class="quote-module__content">
      <div class="quote-module__card">
        <div class="quote-module__icon">
          <IconifyIconOnline icon="ri:double-quotes-l" />
        </div>
        <div class="quote-module__text" v-if="env.currentQuote">
          {{ env.currentQuote.text }}
        </div>
        <div class="quote-module__author" v-if="env.currentQuote">
          —— {{ env.currentQuote.author }}
        </div>
        <div class="quote-module__actions">
          <el-button type="primary" link size="small" @click="prevQuote">
            <IconifyIconOnline icon="ri:arrow-left-s-line" />
          </el-button>
          <el-button type="primary" link size="small" @click="copyQuote">
            <IconifyIconOnline icon="ri:file-copy-line" />
          </el-button>
          <el-button type="primary" link size="small" @click="getRandomQuote">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
          <el-button type="primary" link size="small" @click="nextQuote">
            <IconifyIconOnline icon="ri:arrow-right-s-line" />
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.quote-module {
  &__content {
    border-radius: 12px;
  }

  &__card {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    position: relative;
    overflow: hidden;
    color: #fff;
  }

  &__icon {
    font-size: 32px;
    opacity: 0.8;
    margin-bottom: 12px;
  }

  &__text {
    font-size: 16px;
    line-height: 1.8;
    margin-bottom: 16px;
    font-weight: 500;
    min-height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__author {
    font-size: 14px;
    opacity: 0.8;
    margin-bottom: 16px;
  }

  &__actions {
    display: flex;
    justify-content: center;
    gap: 12px;

    .el-button {
      color: rgba(255, 255, 255, 0.9);
      font-size: 18px;
      padding: 8px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(5px);
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }
    }
  }
}
</style>
