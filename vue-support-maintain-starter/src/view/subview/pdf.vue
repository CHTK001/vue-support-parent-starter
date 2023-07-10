<template>
    <div id="content">
        <div class="div">
            <el-button @click="prev"><el-icon><ArrowLeftBold /></el-icon></el-button>
            <el-button @click="next"><el-icon><ArrowRightBold /></el-icon></el-button>
            <el-button @click="zoomA"><el-icon><ZoomIn /></el-icon></el-button>
            <el-button @click="zoomB"><el-icon><ZoomOut /></el-icon></el-button>
        </div>
        <vue-pdf-embed :source="source" class="vue-pdf-embed" :style="scaleFun" :page="pageNum" />
    </div>
</template>
<script>
import request from '@/utils/request'
import { getQueryString } from '@/utils/Utils';
import '@/style/easy.css'

import VuePdfEmbed from "vue-pdf-embed";
import { createLoadingTask } from "vue3-pdfjs/esm"; // 获得总页数


export default {
    name: 'pdf',
    components: {
        VuePdfEmbed
    },
    data() {
        return {
            source:'',
            pageNum: 1,
            scale: 1,  // 缩放比例
            numPages: 0, // 总页数
        };
    },
    mounted() {
        this.source = getQueryString('url') +  (getQueryString('bucket') || '')+  (getQueryString('id')|| '') + '?fromPath=' + (getQueryString('fromPath')|| '');
        const loadingTask = createLoadingTask(this.source);
        loadingTask.promise.then((pdf) => {
            this.numPages = pdf.numPages;
        });
    },
    methods: {
        prev() {
            if (this.pageNum > 1) {
                this.pageNum -= 1;
            }
        },
        next() {
            if (this.pageNum < this.numPages) {
                this.pageNum += 1;
            }
        },
        zoomA() {
            this.scale += 0.1;
        },
        zoomB() {
            this.scale -= 0.1;
        },
    }
}
</script>
<style scoped>
.div {
    top: 0;
    position: fixed;
    z-index: 999;
}

.vue-pdf-embed {
    text-align: center;
}
#content {
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>