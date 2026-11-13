<template>
  <div class="mp">
    <!-- 学生端 / 通用：放大版卡片网格 -->
    <template v-if="mode !== 'teacher'">
      <div class="mp-head" :class="{ 'mp-head--plain': mode === 'generic' }">
        <b>{{ mode === 'generic' ? "通用模块" : "趣味学习" }}</b>
        <i>
          {{
            mode === "generic"
              ? "仅管理端读取，不出现在学生端 / 教师端"
              : `${stage} · 你好，同学`
          }}
        </i>
      </div>
      <div class="mp-grid">
        <div v-for="item in items" :key="item.code" class="mp-card">
          <span class="mp-card__ic" :style="iconStyle(item)">{{ item.icon || "✨" }}</span>
          <span class="mp-card__tx">
            <b>{{ item.title }}</b>
            <i>{{ item.subtitle || "—" }}</i>
          </span>
        </div>
        <div v-if="!items.length" class="mp-empty">当前没有启用的入口</div>
      </div>
      <p class="mp-tip">这里只预览入口；卡片上的学习统计取学生实时数据。</p>
    </template>

    <!-- 教师端：页签条 -->
    <template v-else>
      <div class="mp-head">
        <b>教师工作台</b>
        <i>老师端顶部页签</i>
      </div>
      <div class="mp-tabs">
        <span v-for="(item, index) in items" :key="item.code" class="mp-tab" :class="{ 'is-on': index === 0 }">
          {{ item.title }}
        </span>
        <span v-if="!items.length" class="mp-tab is-on">当前没有启用的页签</span>
      </div>
      <div class="mp-tpbody">
        <b>{{ items[0]?.title || "—" }}</b>
        <p>{{ items[0]?.subtitle || "选中一个页签查看说明" }}</p>
      </div>
      <p class="mp-tip">教师端页签按此顺序显示；停用的页签不会出现。</p>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * 门户菜单只读预览（配置页「预览」弹层用）。
 *
 * <p>只负责渲染草稿态的卡片/页签，不接拖拽、选中与编辑事件；
 * 样式保持与真实门户同一套 Element 令牌与蓝渐变，避免预览和实际不一致。</p>
 */

/** 一个预览入口 */
interface PreviewItem {
  /** 模块编码（仅作 key） */
  code: string;
  /** 标题 */
  title: string;
  /** 副标题 / 说明 */
  subtitle: string;
  /** emoji 图标 */
  icon: string;
  /** 图标渐变起始色 */
  color: string;
  /** 图标渐变结束色 */
  colorTo: string;
}

defineProps<{
  /** 预览形态：学生端 / 教师端 / 通用 */
  mode: "student" | "teacher" | "generic";
  /** 学段中文名（学生端用） */
  stage: string;
  /** 入口列表（按显示顺序） */
  items: PreviewItem[];
}>();

/**
 * 卡片图标底色。
 *
 * @param item 预览入口
 * @returns 内联样式
 */
function iconStyle(item: PreviewItem): Record<string, string> {
  const from = item.color || "#409eff";
  const to = item.colorTo || from;
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}
</script>

<style scoped>
.mp {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-fill-color-lighter);
}
.mp-head {
  padding: 16px 18px;
  background: linear-gradient(135deg, #43b9f7, #1b8ce2);
  color: #fff;
}
.mp-head b {
  display: block;
  font-size: 18px;
  letter-spacing: 1px;
}
.mp-head i {
  display: block;
  margin-top: 3px;
  font-size: 12px;
  font-style: normal;
  opacity: 0.85;
}
.mp-head--plain {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.mp-head--plain i {
  color: var(--el-text-color-secondary);
  opacity: 1;
}
.mp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 10px;
  padding: 14px;
  background: var(--el-bg-color);
  min-height: 120px;
}
.mp-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
}
.mp-card__ic {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  flex: 0 0 auto;
}
.mp-card__tx {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.35;
}
.mp-card__tx b {
  font-size: 14px;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mp-card__tx i {
  font-style: normal;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mp-empty {
  grid-column: 1 / -1;
  padding: 40px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
.mp-tabs {
  display: flex;
  gap: 2px;
  padding: 10px 14px 0;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-wrap: wrap;
}
.mp-tab {
  padding: 9px 16px;
  border-radius: 9px 9px 0 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.mp-tab.is-on {
  color: var(--el-color-primary);
  font-weight: 700;
  background: var(--el-color-primary-light-9);
}
.mp-tpbody {
  padding: 18px;
  background: var(--el-bg-color);
  min-height: 90px;
}
.mp-tpbody b {
  font-size: 14px;
  color: var(--el-text-color-primary);
}
.mp-tpbody p {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}
.mp-tip {
  margin: 0;
  padding: 0 16px 14px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
