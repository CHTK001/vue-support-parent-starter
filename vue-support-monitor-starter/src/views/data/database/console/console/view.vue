<template>
    <el-dialog title="预览" v-model="dialogStatus" :close-on-click-modal="false" width="70%" top="20px" destroy-on-close
        @closed="$emit('closed')" draggable>
        <el-skeleton :rows="5" :animated="true" :loading="codeLoading">
            <el-tabs v-if="viewData.length > 0" v-model="activeName" class="demo-tabs" @tab-click="handleClick">
                <el-tab-pane :label="item.name" :name="item.name" v-for="item in viewData">
                    <el-button style="position: absolute ;right: 10px;" text plain icon="el-icon-document-copy" @click="seccendCopy(item.content)">复制</el-button>
                    <el-tag v-if="item.path">{{ item.path }}</el-tag>
                    <highlightjs :language="item.type" :autodetect="false" :code="item.content" style="
                                overflow-y: auto;
                                height: 600px;
                                font-size: 14px;
                                font-family: Microsoft YaHei, Consolas, Monaco, Menlo, Consolas, 'Courier New', monospace;
                                "></highlightjs>
                </el-tab-pane>
            </el-tabs>
            <el-empty v-else />
        </el-skeleton>
    </el-dialog>
</template>

<script>
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-light.css';
import { defineAsyncComponent } from 'vue';
export default {
    name: 'importCodeVue',
    data() {
        return {
            codeLoading: !0,
            activeName: 'second',
            dialogStatus: 0,
            downloadForm: {},
            viewData: []
        }
    },
    methods: {
        seccendCopy(value) {
            const _this = this
            this.$copyText(value).then(
                function (e) {
                    _this.$message.success("复制成功!");
                },
                function (e) {
                    console.log("copy arguments e:", e);
                }
            );
        },
        open(data) {
            this.dialogStatus = !0;
            Object.assign(this.downloadForm, data);
            this.$API.gen.table.template.get(data).then(res => {
                if (res.code === '00000') {
                    this.viewData = res.data;
                    if (this.viewData.length > 0) {
                        this.activeName = this.viewData[0]['name']
                    }
                    return;
                }

                this.$message.error(res.msg);
            }).finally(() => this.codeLoading = false)
        },
    }
}
</script>