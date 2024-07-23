<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <br />
            </div>
            <div class="right-panel">
                <el-button type="primary" icon="el-icon-search" @click="afterPrepertiesSet"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="save({}, 'add')"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="list.apiObj" :params="searchParams" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="应用名称" prop="fileStorageProtocolDesc">
                    <template #default="{ row }">
                        <span style="color: blue; cursor: pointer;" @click="doDetail(row)">{{ row.fileStorageProtocolDesc }}</span>
                    </template>
                </el-table-column>
                <el-table-column label="协议" prop="fileStorageProtocolName"></el-table-column>
                <el-table-column label="主机" prop="fileStorageProtocolHost"></el-table-column>
                <el-table-column label="端口" prop="fileStorageProtocolPort" show-overflow-tooltip></el-table-column>
                <el-table-column label="插件" prop="fileStorageProtocolPlugins" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div>{{ row.fileStorageProtocolPlugins }}</div>
                        <div>
                            <el-switch v-if="row.fileStorageProtocolStatus != 1" :active-value="1" v-model="settingValue" :inactive-value="0" type="primary" size="small" @click="doTriggerPlugin(row)">

                            </el-switch>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="配置" prop="fileStorageProtocolSetting" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div>{{ row.fileStorageProtocolSetting }}</div>
                        <div>
                            <el-switch v-if="row.fileStorageProtocolStatus != 1" :active-value="1" v-model="settingValue" :inactive-value="0" type="primary" size="small" @click="doTriggerSetting(row)">

                            </el-switch>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="代理UA" prop="fileStorageProtocolUa" show-overflow-tooltip>
                    <template #default="{ row }">
                        <div>{{ row.fileStorageProtocolUa }}</div>
                        <div>
                            <el-switch v-if="row.fileStorageProtocolStatus != 1" :active-value="1" v-model="uaValue" :inactive-value="0" type="primary" size="small" @click="doTriggerUa(row)">

                            </el-switch>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group>
                            <el-button v-if="scope.row.fileStorageProtocolStatus != 1" text type="primary" size="small" @click="start(scope.row)">启动</el-button>
                            <el-button v-else text type="primary" size="small" @click="stop(scope.row)">停止</el-button>
                            <el-button v-if="scope.row.fileStorageProtocolStatus != 1" text type="primary" size="small" @click="save(scope.row, 'edit')">编辑</el-button>
                            <el-popconfirm v-if="scope.row.fileStorageProtocolStatus != 1" title="确定删除吗？" @confirm="doDelete(scope.row, scope.$index)">
                                <template #reference>
                                    <el-button text type="primary" size="small">删除</el-button>
                                </template>
                            </el-popconfirm>
                        </el-button-group>
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>

    <save-dialog v-if="saveDialogStatus" ref="saveDialogRef" @success="afterPrepertiesSet"></save-dialog>
    <detail-dialog v-if="detailDialogStatus" ref="detailDialogRef" @success="afterPrepertiesSet"></detail-dialog>
</template>

<script>
import SaveDialog from './save.vue'
import DetailDialog from './detail.vue'
export default {
    components: {
        SaveDialog, DetailDialog
    },
    data() {
        return {
            saveDialogStatus: false,
            detailDialogStatus: false,
            uaValue: 0,
            settingValue: 0,
            pluginValue: 0,
            searchParams: {},
            list: {
                apiObj: this.$API.filestorage.protocol.page,
                apiObjUpdate: this.$API.filestorage.protocol.update,
                apiObjSave: this.$API.filestorage.protocol.save,
                apiObjUpload: this.$API.filestorage.protocol.upload,
                apiObjDelete: this.$API.filestorage.protocol.delete,
                apiObjStart: this.$API.filestorage.protocol.start,
                apiObjStop: this.$API.filestorage.protocol.stop,
            },
        }
    },
    mounted() {
    },
    methods: {
        doTriggerUa(row){
            row.fileStorageProtocolUaOpen = this.uaValue
            this.apiObjUpload.update.put(row).then(res => {
                if (res.code == '00000') {
                    this.$message.success('UA修改成功');
                    return;
                }
                this.$message.error(res.msg);
            })
        },
        doTriggerSetting(row){
            row.fileStorageProtocolSettingOpen = this.settingValue
            this.apiObjUpload.update.put(row).then(res => {
                if (res.code == '00000') {
                    this.$message.success('Setting 修改成功');
                    return;
                }
                this.$message.error(res.msg);
            })
        },
        doTriggerPlugin(row){
            row.fileStorageProtocolPluginOpen = this.pluginValue
            this.apiObjUpload.update.put(row).then(res => {
                if (res.code == '00000') {
                    this.$message.success('Plugin 修改成功');
                    return;
                }
                this.$message.error(res.msg);
            })
        },
        doDetail(row) {
            this.detailDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.detailDialogRef.setData(row).open('add');
            })
        },
        doDelete(row) {
            this.list.apiObjDelete.delete({ id: row.fileStorageProtocolId }).then(res => {
                if (res.code == '00000') {
                    this.$message.success('删除成功');
                    this.afterPrepertiesSet();
                    return;
                }
                this.$message.error(res.msg);
            })
        },
        start(row) {
            this.list.apiObjStart.put({ id: row.fileStorageProtocolId }).then(res => {
                if (res.code == '00000') {
                    row.fileStorageProtocolStatus = 1;
                    this.$message.success('启动成功');
                    return;
                }
                this.$message.error(res.msg);
            })
        },
        stop(row) {
            this.list.apiObjStop.put({ id: row.fileStorageProtocolId }).then(res => {
                if (res.code == '00000') {
                    row.fileStorageProtocolStatus = 0;
                    this.$message.success('停止成功');
                    return;
                }
                this.$message.error(res.msg);
            })
        },
        async save(row, mode) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialogRef.setData(row).open(mode);
            })
        },
        async afterPrepertiesSet() {
            this.$refs.table.reload(this.searchParams);
        }
    }
}
</script>
