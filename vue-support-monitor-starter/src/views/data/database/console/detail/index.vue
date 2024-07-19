<template>
    <el-drawer v-model="visiable" @close="close" :title="title" :close-on-press-escape="false" :close-on-click-modal="false" size="100%" style="overflow: hidden;">
        <el-row :gutter="10" class="f-height">
            <el-col :span="16">
                <el-tabs tab-position="left" class="demo-tabs f-height" v-model="tabValue">
                    <el-tab-pane label="日志" name="log">
                        <log-dialog :data="form" width="100%"></log-dialog>
                    </el-tab-pane>
                    <el-tab-pane label="文档"  name="doc">
                        <doc-dialog ref="docDialog" style="height: 100%" :data="form" width="100%"/>
                    </el-tab-pane>
                    <el-tab-pane label="检索" name="search" v-if="form.supoortBackup === true">
                        <search-layout ref="searchDialog" style="height: 100%" :data="form" width="100%"></search-layout>
                    </el-tab-pane>
                </el-tabs>
            </el-col>
            <el-col :span="8" :pull="0" style="padding-right: 20px;padding-left: 20px">
                <el-row>
                    <save-layout :form="form" mode="edit"></save-layout>
                </el-row>
                <el-divider></el-divider>
                <el-row>
                    <el-button icon="el-icon-menu" class="cursor-pointer" title="控制台" style=" width: 9em;" @click="doConsole(form)">代码生成器</el-button>
                    <el-button v-if="form.supportDocument" icon="sc-icon-database-lock" class="cursor-pointer" title="文档" @click="doDoc(form)">文档</el-button>
                    <el-button v-if="form.supoortBackup === true" icon="sc-icon-database-lock" class="cursor-pointer" title="日志检索" @click="doSearch(form)" >日志检索</el-button>
                    <el-button  icon="sc-icon-database-search"   class="cursor-pointer" title="控制面板" @click="doBoard(form)">控制面板</el-button>
                </el-row>
                <el-row>
                    <span v-if="form.genJdbcCustomType == 'FILE'" style="margin-top: 20px">
                        <el-button  icon="sc-icon-upload"   class="cursor-pointer" title="数据文件" @click="doUpload(form, 'data')">数据文件</el-button>
                    </span>
                    <span v-if="form.supportDriver !== true" style="margin-top: 20px">
                        <el-button  icon="sc-icon-upload"   class="cursor-pointer" title="驱动文件" @click="doUpload(form, 'driver')">驱动文件</el-button>
                    </span>
                </el-row>
            </el-col>
        </el-row>
    </el-drawer>

    <el-drawer v-model="consoleDialogStatus" title="代码生成器" size="80%" :close-on-click-modal="false">
        <console-dialog ref="consoleDialog" width="80%"/>
    </el-drawer>
    <board-dialog ref="boardDialogRef" v-if="boardDialogStatus"></board-dialog>
    <doc-dialog v-if="docDialogStatus" ref="docDialog"/>
    <upload-dialog v-if="uploadDialogStatus" ref="uploadDialogRef"></upload-dialog>
</template>
<script>
import SaveLayout from './saveLayout.vue'
import SearchLayout from './searchLayout.vue'
import DocDialog from '../../console/doc/index.vue'
import ConsoleDialog from '../../console/console/index.vue'
import LogDialog from '../../console/log/index.vue'
import BoardDialog from '../../console/board/index.vue'
import UploadDialog from './upload.vue'

export default {
    components: { SaveLayout, ConsoleDialog, DocDialog, LogDialog, SearchLayout, BoardDialog, UploadDialog },
    data() {
        return {
            tabValue: 'log',
            visiable: false,
            form: {},
            title: "",
            consoleDialogStatus: false,
            uploadDialogStatus: false,
            docDialogStatus: false,
            boardDialogStatus: false,
        }
    },
    methods: {
        doUpload(data, type){
            this.uploadDialogStatus = true;
            this.$nextTick(() => {
                const form = {};
                Object.assign(form, data);
                form.type = type;
                this.$refs.uploadDialogRef.setData(form).open();
            });

        },
        doBoard(item){
            this.boardDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.boardDialogRef.open(item);
            });
        },
        doDoc(item){
            this.tabValue = 'doc';
        },
        doSearch(item){
            this.tabValue = 'search';
        },
        doConsole(item) {
            this.consoleDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.consoleDialog.open('view').setData(item);
            });
        },
        close() {
            this.visiable = !1;
            this.form = {};
        },
        setData(item) {
            Object.assign(this.form, item);
            this.form.genBackupEvent = !this.form.genBackupEvent ? null : this.form.genBackupEvent.split(',');
            this.title = this.form.genName + "详情页"
            return this;
        },
        open() {
            this.visiable = !0;
        },

    }

}
</script>
<style scoped lang="less">
.cursor-pointer {
    font-size: 16px;
    width: 7em;
    height: 3em;
    margin-left: 10px;
}
:deep(.el-tabs__content), 
:deep(.el-tabs__content > .el-tab-pane) {
    height: 100%
}
.f-height {
    height: 100%;
}
</style>