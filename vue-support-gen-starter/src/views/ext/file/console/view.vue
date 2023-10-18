<template>
     <el-dialog  v-model="previewStatus" title="预览" draggable :close-on-click-modal="false" width="70%" style="height: 600px;" :destroy-on-close="true">
        <div style="height: 500px;overflow: auto;">
            <highlightjs :code="code" v-if="isText" :language="language" :autodetect="false"  style="height: 500px; overflow: auto;font-size: 14px; font-weight: 800; font-family: ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;" />
            <iframe :src="code" frameborder='0' v-else-if="isFrame" width="100%" height="100%"></iframe>
            <div v-else-if="isMd" id="content" class="markdown-body">{{ code }}</div>
        </div>
    </el-dialog>
</template>
<script>
import 'highlight.js/styles/github.css';
import {marked}  from 'marked' 
import "github-markdown-css"
import { api as viewerApi } from "v-viewer"
export default {
    data() {
        return {
            language: 'yml',
            isText: false,
            isFrame: false,
            isMd: false,
            code: '',
            previewStatus: false,
            form: {
                genId: null
            },
            returnResult: []
        }
    },
    methods: {
        open(item, genId, returnResult) {
            this.code = '';
            this.previewStatus = true;
            this.returnResult = returnResult;
            this.form.genId = genId;
            if(item.subType === 'image') {
                const imags = [];
                for(const item1 of this.returnResult) {
                    if(item1.subType === 'image') {
                        imags.push(this.$API.gen.session.previewDoc.url + `?genId=${this.form.genId}&dataId=${item1.tableName}`)
                    }
                }
                viewerApi({ images: imags })
                return;
            }

            if(item.type === 'sql' ||item.type === 'txt' || item.type === 'json' || item.type === 'yml' || item.type === 'yaml' ) {
                this.language = item.type;
                this.isText = true;
                this.$API.gen.session.previewDoc.get({genId: this.form.genId, dataId: item.tableName}).then(res => {
                    this.code = res;
                })
                return;
            }

            if(item.type === 'html') {
                this.isFrame = true;
                this.code = this.$API.gen.session.previewDoc.url + `?genId=${this.form.genId}&dataId=${item.tableName}`;
                return;
            }

            if(item.type === 'md') {
                this.isMd = true;
                this.$API.gen.session.previewDoc.get({genId: this.form.genId, dataId: item.tableName}).then(res => {
                    this.code = marked(res);
                })
            }
        }
    }
}
</script>