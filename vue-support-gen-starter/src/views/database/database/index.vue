<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <el-button type="primary" icon="el-icon-plus" @click="add"></el-button>
                <el-button type="primary" icon="el-icon-refresh" @click="refresh"></el-button>
            </div>
            <div class="right-panel">

            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="apiObj" row-key="id" stripe>
                <el-table-column label="#" type="index" width="50"></el-table-column>
                <el-table-column label="类型" prop="genType">
                    <template #default="scope">
                        <el-icon style="font-size: 20px; position: relative; top: 5px" :title="scope.row.dbcName">
                            <component :is="'sc-icon-' + scope.row.dbcName?.toLowerCase()" circle />
                        </el-icon>
                        <span>
                            {{ scope.row.genType }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="配置名称" prop="genName" show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag v-if="scope.row.genDatabaseFile" :title="scope.row.genDatabaseFile">
                            {{ scope.row.genName }}
                        </el-tag>
                        <span v-else>{{ scope.row.genName }}</span>
                    </template>
                </el-table-column>
                <!-- <el-table-column label="数据库" prop="genDatabase" >
                    <template #default="scope">
                        <el-tag v-if="scope.row.genDatabase">{{ scope.row.genDatabase }}</el-tag>
                        <span v-else>无</span>
                    </template>
                </el-table-column> -->
                <el-table-column label="备份服务" prop="backup" width="80">
                    <template #default="scope">
                        <span v-if="scope.row.backup" style="cursor: pointer; font-size: 20px;">
                            <span v-if="!starting" >
                                <span v-if="scope.row.genBackupStatus == '1'" >
                                    <el-icon  title="服务已启动" @click="doStartOrStop(scope.row, 'stop')">
                                        <component is="sc-icon-end" circle />
                                    </el-icon>
                                </span>
                               <span v-else>
                                    <el-icon  title="服务未启动" @click="doStartOrStop(scope.row, 'start')">
                                        <component is="sc-icon-start" circle />
                                    </el-icon>
                                    <el-icon  title="服务配置" @click="doSetting(scope.row)">
                                        <component is="el-icon-setting" circle />
                                    </el-icon>
                                </span>
                            </span>
                            <span v-else>
                                <el-icon class="animation">
                                    <component is="sc-icon-loading-v2" circle />
                                </el-icon>
                            </span>
                        </span>
                        <span type="info" v-else title="不支持该功能">
                            <el-icon>
                                <component is="sc-icon-no" circle />
                            </el-icon>
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="账号" prop="genUser" width="60">
                    <template #default="scope">
                        <span v-if="scope.row.genUser">
                            <el-icon style="font-size: 16px; position: relative; top: 5px" :title="scope.row.genUser">
                                <component is="el-icon-user" circle />
                            </el-icon>

                        </span>
                        <span v-else>无</span>
                    </template>
                </el-table-column>
                <el-table-column label="访问地址" prop="genUrl" show-overflow-tooltip>
                    <template #default="scope">
                        <span v-if="scope.row.genUrl">{{ scope.row.genUrl }}</span>
                        <span v-else>无</span>
                    </template>
                </el-table-column>
                <!-- <el-table-column label="数据文件" prop="genDatabaseFile" show-overflow-tooltip>
                    <template #default="scope">
                        <span v-if="scope.row.genDatabaseFile">{{ scope.row.genDatabaseFile }}</span>
                        <span v-else>无</span>
                    </template>
                </el-table-column> -->
                <el-table-column label="创建时间" prop="createTime" width="180">
                    <template #default="scope">
                        <el-tag v-time="scope.row.createTime"></el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="更新时间" prop="updateTime" width="180">
                    <template #default="scope">
                        <el-tag v-time="scope.row.updateTime"></el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="270">
                    <template #default="scope">
                        <el-button-group>
                            <el-button text icon="el-icon-view" type="primary" size="small"
                                @click="table_show(scope.row, scope.$index)">查看</el-button>
                            <el-button icon="el-icon-edit" v-if="scope.row.genType !== 'SYSTEM'" text type="primary"
                                size="small" @click="table_edit(scope.row)">编辑</el-button>
                            <el-popconfirm v-if="scope.row.genType !== 'SYSTEM'" title="确定删除吗？"
                                @confirm="table_del(scope.row, scope.$index)">
                                <template #reference>
                                    <el-button icon="el-icon-delete" text type="primary" size="small">删除</el-button>
                                </template>
                            </el-popconfirm>
                            <el-button text type="primary" icon="sc-icon-web" size="small" @click="console(scope.row, item)"
                                v-for="item in JSON.parse(scope.row.dbcConsoleUrl || '[]')">{{ item.name }}</el-button>
                            <el-button :loading="isUploading" icon="el-icon-upload"
                                v-if="!scope.row.genDatabaseFile && scope.row.genDatabase != 'REMOTE'" text type="primary"
                                size="small" @click="uploadDatabaseFile(scope.row)">上传数据文件</el-button>
                            <el-button icon="el-icon-smoking"
                                v-if="scope.row.genDatabaseFile && scope.row.genDatabase != 'REMOTE'" text type="primary"
                                size="small" @click="clearDatabaseFile(scope.row)">清除数据文件</el-button>
                        </el-button-group>
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>
    <save-dialog v-if="dialog.save" ref="saveDialog" @success="handleSaveSuccess" @closed="dialog.save = false"></save-dialog>
    <upload-dialog v-if="dialog.upload" ref="uploadDialog" @success="handleSaveSuccess" @closed="dialog.upload = false"></upload-dialog>
    <backup-dialog v-if="dialog.backup" ref="backupDialog" @success="handleSaveSuccess" @closed="dialog.backup = false"></backup-dialog>
</template>
<script>

import { rowContextKey } from 'element-plus';
import saveDialog from './save.vue'
import uploadDialog from './upload.vue'
import backupDialog from './backup.vue'
export default {
    name: 'db',
    components: {
        saveDialog, uploadDialog, backupDialog
    },
    data() {
        return {
            isUploading: false,
            starting: false,
            isDownloading: false,
            dialog: {
                save: false,
                upload: false,
                permission: false,
                backup: false,
            },
            apiObj: this.$API.gen.database.list,
            selection: [],
            search: {
                keyword: null
            }
        }
    },
    methods: {
        doSetting(row) {
            this.dialog.backup = true
            this.$nextTick(() => {
                this.$refs.backupDialog.open('show').setData(row)
            })
        },
        doStartOrStop(row, mode) {
            this.starting = true;
            if(mode == 'start') {
                this.$API.gen.backup.start.get({genId: row.genId}).then(res => {
                    if (res.code != '00000') {
                        this.$message.error(res.msg);
                    } else {
                        row.genBackupStatus = 1;
                    }
                }).finally(() => {
                    this.starting = false;
                });
                return;
            }
           
            this.$API.gen.backup.stop.get({genId: row.genId}).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                } else {
                    row.genBackupStatus = 0;
                }
            }).finally(() => {
                this.starting = false;
            });
            return;
        },
        async clearDatabaseFile(row) {
            var res = await this.$API.gen.database.deleteFile.delete(row);
            if (res.code != '00000') {
                this.$message.error(res.msg);
            } else {
                this.$message.success('清除成功');
                row.genDatabaseFile = null;
            }
        },

        async uploadDatabaseFile(row) {
            this.dialog.upload = true
            this.$nextTick(() => {
                this.$refs.uploadDialog.open('show').setData(row)
            })
        },
        console(row, item) {
            this.$router.push({ path: `${item.url}/` + row.genId });
        },
        //添加
        add() {
            this.dialog.save = true
            this.$nextTick(() => {
                this.$refs.saveDialog.open()
            })
        },
        refresh() {
            this.$refs.table.refresh()
        },
        table_show(row) {
            this.dialog.save = true
            this.$nextTick(() => {
                this.$refs.saveDialog.open('show').setData(row)
            })
        },
        //编辑
        table_edit(row) {
            this.dialog.save = true
            this.$nextTick(() => {
                this.$refs.saveDialog.open('edit').setData(row)
            })
        },
        //删除
        async table_del(row) {
            var reqData = { id: row.genId }
            var res = await this.$API.gen.database.delete.delete(reqData);
            if (res.code == '00000') {
                this.$refs.table.refresh()
            } else {
                this.$notify.error({ title: '提示', message: res.msg })
            }
        },
        //本地更新数据
        handleSaveSuccess(data, mode) {
            this.$refs.table.refresh()
        }
    }
}
</script>
<style>
path {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: dash 5s linear infinite;
}

@keyframes dash {
    to {
        stroke-dashoffset: 0;
    }
}</style>