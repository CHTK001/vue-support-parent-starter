<script setup>
/**
 * 每日名言部件
 * @author CH
 * @date 2024-12-10
 * @version 1.0.1
 */
import { reactive, onMounted } from "vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { message } from "@repo/utils";

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

const env = reactive({
  currentQuote: null,
  quoteIndex: 0,
});

const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  env.quoteIndex = randomIndex;
  env.currentQuote = quotes[randomIndex];
};

const copyQuote = () => {
  if (!env.currentQuote) return;
  const text = `"${env.currentQuote.text}" —— ${env.currentQuote.author}`;
  navigator.clipboard.writeText(text).then(() => {
    message("复制成功", { type: "success" });
  });
};

const nextQuote = () => {
  env.quoteIndex = (env.quoteIndex + 1) % quotes.length;
  env.currentQuote = quotes[env.quoteIndex];
};

onMounted(() => {
  getRandomQuote();
});
</script>

<template>
  <div class="quote-card">
    <div class="quote-background">
      <IconifyIconOnline icon="ri:double-quotes-r" class="bg-icon" />
    </div>
    
    <div class="quote-content" v-if="env.currentQuote">
      <div class="quote-icon">
        <IconifyIconOnline icon="ri:double-quotes-l" />
      </div>
      <div class="quote-text">{{ env.currentQuote.text }}</div>
      <div class="quote-author">—— {{ env.currentQuote.author }}</div>
    </div>
    
    <div class="quote-actions">
      <el-tooltip content="复制" placement="top">
        <div class="action-btn" @click="copyQuote">
          <IconifyIconOnline icon="ri:file-copy-line" />
        </div>
      </el-tooltip>
      <el-tooltip content="下一条" placement="top">
        <div class="action-btn" @click="nextQuote">
          <IconifyIconOnline icon="ri:refresh-line" />
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quote-card {
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: 12px;
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    
    .quote-actions {
      opacity: 1;
    }
  }
}

.quote-background {
  position: absolute;
  bottom: -20px;
  right: 10px;
  opacity: 0.05;
  pointer-events: none;
  
  .bg-icon {
    font-size: 120px;
    color: var(--el-text-color-primary);
  }
}

.quote-content {
  position: relative;
  z-index: 1;
  
  .quote-icon {
    font-size: 24px;
    color: var(--el-color-primary);
    margin-bottom: 8px;
    opacity: 0.6;
  }
  
  .quote-text {
    font-size: 16px;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    font-style: italic;
    font-family: "Georgia", serif;
    margin-bottom: 12px;
  }
  
  .quote-author {
    text-align: right;
    font-size: 13px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
}

.quote-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s;
  
  .action-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    transition: all 0.2s;
    
    &:hover {
      background: var(--el-color-primary-light-9);
      color: var(--el-color-primary);
    }
  }
}
</style>
