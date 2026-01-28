<template>
  <div class="system-container modern-bg">
    <sc-dialog v-model="showBackupDialog" draggable title="备份数据" width="60%" @close="handleClose" class="!max-h-[80vh] overflow-auto">
      <ul v-if="data.length">
        <li v-for="item in data">
          <!-- 高亮结果 -->
          <pre v-if="item" style="background: #f6f8fa; padding: 12px; border-radius: 4px; overflow: auto">
<code ref="codeEl" class="line-numbers language-sql" v-html="item"></code>
</pre>
        </li>
      </ul>
      <el-empty v-else />
    </sc-dialog>
  </div>
</template>
<script lang="ts" setup>
import "prismjs/components/prism-sql"; // ③ SQL 语法文件
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard";
import "prismjs/plugins/toolbar/prism-toolbar";
import "prismjs/plugins/toolbar/prism-toolbar.css";
import "prismjs/themes/prism-tomorrow.css"; // ④ 主题（任选）
import { ref, watch } from "vue";

const emit = defineEmits(["update:visibe", "close"]);
const showBackupDialog = ref(false);
const data = ref([]);
const props = defineProps<{
  visibe: boolean;
  data: any;
}>();
function copy(formatted) {
  navigator.clipboard.writeText(formatted.value.replace(/&lt;/g, "<").replace(/&gt;/g, ">"));
}
const handleClose = () => {
  showBackupDialog.value = false;
  emit("close");
};

watch(
  () => props.visibe,
  (val) => {
    showBackupDialog.value = val;
  }
);
watch(
  () => props.data,
  (val) => {
    data.value = val;
  },
  { deep: true, immediate: true }
);
</script>
<style lang="scss" scoped>

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}



// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>

