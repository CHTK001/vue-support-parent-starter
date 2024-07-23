<template>
    <el-drawer size="100%" :title="title" v-model="visible" @close="close" :close-on-press-escape="false" :destroy-on-close="true">
        <template #header="{ close, titleId, titleClass }">
            <h4 :id="titleId" :class="titleClass">{{ title }}</h4>
            <el-icon style="font-size: 18px; cursor: pointer;" @click="afterPropertiesSet" >
                <component is="el-icon-refresh" />
            </el-icon>
        </template>
        <el-container>
            <el-aside width="300px" >
                <el-skeleton :loading="menuloading" animated></el-skeleton>
                <el-container v-if="!menuloading">
                    <el-header>
                        <el-input placeholder="输入关键字进行过滤" v-model="menuFilterText" clearable></el-input>
                    </el-header>
                    <el-main class="nopadding">
                        <el-tree ref="menu" class="menu" node-key="id" :data="menuList" :props="menuProps" draggable highlight-current :expand-on-click-node="false" check-strictly  @node-click="menuClick">
                            <template #default="{ node, data }">
                                <span class="custom-tree-node">
                                    <span class="label">
                                        <el-icon v-if="data.fileStorageIcon" style="font-size: 16px; margin-left: 4px; margin-right: 4px">
                                            <component :is="data.fileStorageIcon" />
                                        </el-icon>
                                        <span>{{ data.fileStorageName }}</span>
                                    </span>
                                    <span class="do-operator">
                                        <el-button icon="sc-icon-eye" v-if="data.fileStorageStatus == 1" size="small" @click.stop="doView(data)"></el-button>
                                        <el-button icon="el-icon-Minus"  size="small" @click.stop="doDelete(data)"></el-button>
                                    </span>
                                </span>
                            </template>

                        </el-tree>
                    </el-main>
                    <el-footer style="height:51px;">
                        <el-button type="primary" size="small" icon="el-icon-plus" @click="doAdd()"></el-button>
                    </el-footer>
                </el-container>
            </el-aside>
            <el-container>
                <el-main class="nopadding" style="padding:20px; padding-top: 0" ref="main">
                    <save-dialog ref="save" v-if="saveDialogVisible" :form="form" :menu="clickNode" @success="afterPropertiesSet"></save-dialog>
                    <oss-dialog ref="save" v-else :form="form" :menu="clickNode"></oss-dialog>
                </el-main>
            </el-container>
        </el-container>
    </el-drawer>
</template>
<script>
import SaveDialog from './detail/save.vue'
import OssDialog from './detail/oss.vue'

export default {
    components: {
        SaveDialog,OssDialog
    },

    data() {
        return {
            menuList: [],
            clickNode: {},
            saveDialogVisible: true,
            menuFilterText: null,
            menuProps: (data) => {
                return data.meta.fileStorageName
            },
            menuloading: false,
            form: {},
            visible: false,
            mode: 'add',
            title: '',
        }
    },
    methods: {
        menuClick(item){
            this.saveDialogVisible = true;
            this.clickNode = item;
        },
        doDelete(row){
            this.menuloading = false,
            this.$API.filestorage.delete.delete({ 
                id: row.fileStorageId, 
            }).then(res => {
                if (res.code === '00000') {
                    this.menuList.forEach(item => {
                        if (item.id == row.id) {
                            this.menuList.splice(this.menuList.indexOf(item), 1);
                        }
                    });
                }
            }).finally(() => {
                this.menuloading = false
            })
        },
        doView(row){
            this.saveDialogVisible = false;
            this.clickNode = row;
        },
        doAdd() {
            this.saveDialogVisible = true;
            this.clickNode = {};
         },
        close() {
            this.form = {};
            this.visible = false;
        },
        setData(row) {
            Object.assign(this.form, row);
            return this;
        },
        afterPropertiesSet() {
            this.menuloading = false,
            this.$API.filestorage.page.get({ 
                pageNo: 1, 
                pageSize: 1000, 
                fileStorageProtocolId: this.form.fileStorageProtocolId, 
                fileStorageName: this.menuFilterText 
            }).then(res => {
                if (res.code === '00000') {
                    this.menuList = res.data.data;
                }
            }).finally(() => {
                this.menuloading = false
            })
        },
        open(mode = 'add') {
            this.visible = true;
            this.mode = mode;
            this.afterPropertiesSet();
            if (mode == 'add') {
                this.title = '详情';
            }
        }
    }
}
</script>
<style scoped lang="less">
.do-operator{
    position: absolute;
    right: 0;
}
.custom-tree-node {
    position: relative;
    width: 100%;
}
:global(.el-drawer__body) {
    border-top: 1px solid var(--el-border-color-light);
}
</style>