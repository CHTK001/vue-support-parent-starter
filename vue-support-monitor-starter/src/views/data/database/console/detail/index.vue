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
                    <el-tab-pane label="检索" name="search">
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
                    <el-button icon="el-icon-menu" class="cursor-pointer" title="控制台" @click="doConsole(form)">控制台</el-button>
                    <el-button v-if="form.supportDocument" icon="sc-icon-database-lock" class="cursor-pointer" title="文档" @click="doDoc(form)">文档</el-button>
                    <el-button  icon="sc-icon-database-lock" class="cursor-pointer" style=" width: 7em;" title="日志检索" @click="doSearch(form)">日志检索</el-button>
                </el-row>
            </el-col>
        </el-row>
    </el-drawer>

    <el-drawer v-model="consoleDialogStatus" title="控制台" size="80%" :close-on-click-modal="false">
        <console-dialog ref="consoleDialog" width="80%"/>
    </el-drawer>

    <doc-dialog v-if="docDialogStatus" ref="docDialog"/>
</template>
<script>
import SaveLayout from './saveLayout.vue'
import SearchLayout from './searchLayout.vue'
import DocDialog from '../../console/doc/index.vue'
import ConsoleDialog from '../../console/console/index.vue'
import LogDialog from '../../console/log/index.vue'

export default {
    components: { SaveLayout, ConsoleDialog, DocDialog, LogDialog, SearchLayout },
    data() {
        return {
            tabValue: 'log',
            visiable: false,
            form: {},
            title: "",
            consoleDialogStatus: false,
            docDialogStatus: false,
        }
    },
    methods: {
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
    width: 6em;
    height: 3em
}
:deep(.el-tabs__content), 
:deep(.el-tabs__content > .el-tab-pane) {
    height: 100%
}
.f-height {
    height: 100%;
}
</style>