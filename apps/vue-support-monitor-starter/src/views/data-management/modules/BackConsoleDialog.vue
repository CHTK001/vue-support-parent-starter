<template>
    <div>
        <el-dialog v-model="showBackupDialog" draggable title="备份数据" width="60%" @close="handleClose" class="!max-h-[80vh] overflow-auto">
            <ul v-if="data.length">
                <li v-for="item in data">
<!-- 高亮结果 -->
<pre v-if="item" style="background:#f6f8fa;padding:12px;border-radius:4px;overflow:auto;">
<code ref="codeEl" class="line-numbers language-sql" v-html="item"></code>
</pre>                       
                </li>
            </ul>
            <el-empty v-else/>
        </el-dialog>
    </div>
</template>
<script lang="ts" setup>
import { ref, watch, defineEmits, defineProps } from 'vue';
import Prism from 'prismjs'                    // ② 高亮核心
import 'prismjs/components/prism-sql'          // ③ SQL 语法文件
import 'prismjs/themes/prism-tomorrow.css'     // ④ 主题（任选）
import 'prismjs/plugins/toolbar/prism-toolbar.css'
import 'prismjs/plugins/toolbar/prism-toolbar'
import 'prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard'

const emit = defineEmits(['update:visibe', 'close']);
const showBackupDialog = ref(false);
const data = ref([]);
const props = defineProps<{
    visibe:  boolean;
    data: any;
}>();
function copy(formatted) {
  navigator.clipboard.writeText(formatted.value.replace(/&lt;/g, '<').replace(/&gt;/g, '>'))
}
const handleClose = () => {
    showBackupDialog.value = false;
    emit("close");
};

watch(() => props.visibe, (val) => {
    showBackupDialog.value = val;
});
watch(() => props.data, (val) => {
    data.value = val;
}, { deep: true ,  immediate: true });
</script>