<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <sc-select-filter :data="data" :selected-values="selectedValues" :label-width="80"
                    @on-change="change"></sc-select-filter>
                <br />
            </div>
            <div class="right-panel">
                <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="table_edit({})"></el-button>
                <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length == 0"
                    @click="batch_del"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <el-alert title="需要注意的事项" :closable="false" type="warning " style="margin-bottom:20px;display: block;">
                <template #default='title'>
                    <div class="iconSize">1、需要代理支持</div>
                    <div class="iconSize">2、默认jdk只支持修改方法体, 不支持类的属性添加等修改</div>
                    <div class="iconSize">3、如需要支持类的属性添加等修改, 需要按钻过hotswap等jdk</div>
                </template>
            </el-alert>
            <scTable ref="table" :apiObj="list.apiObj" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="应用名称" prop="monitorPatchApp" ></el-table-column>
                <el-table-column label="环境" prop="monitorPatchProfile" >
                    <template #default="scope">
                        <el-tag>{{ scope.row.monitorPatchProfile }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="方法名称" prop="monitorPatchName">
                    <template #default="scope">
                        <span>
                            {{ scope.row.monitorPatchName }}
                            <span class="el-form-item-msg" style="margin-left: 2px;">{{ scope.row.monitorPatchChineseName }}</span>
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="补丁包" prop="monitorPatchPack" show-overflow-tooltip></el-table-column>
                <el-table-column label="描述" prop="monitorPatchDesc" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group >
                            <el-button v-if="scope.row.monitorPatchPack" v-auth="'sys:monitorPatch:patch_upload'" text type="primary" size="small" @click="table_patch_unload(scope.row, scope.$index)">卸载补丁包</el-button>
                            <el-button v-auth="'sys:monitorPatch:upload'" text type="primary" size="small" @click="table_upload(scope.row, scope.$index)">下发</el-button>
                            <el-button v-auth="'sys:monitorPatch:edit'" text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
                            <el-popconfirm v-auth="'sys:monitorPatch:del'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                                <template #reference>
                                    <el-button v-auth="'sys:monitorPatch:del'" text type="primary" size="small">删除</el-button>
                                </template>
                            </el-popconfirm>
                        </el-button-group>
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>

    <el-dialog title="补丁信息" draggable v-model="visible" :width="700" @closed="$emit('closed')" :destroy-on-close="true" :close-on-click-modal="false">
        <el-form :model="row" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">
            <el-form-item v-show="false" label="索引" prop="monitorPatchName">
                <el-input v-model="row.monitorPatchId" clearable></el-input>
            </el-form-item>
            <el-form-item label="环境" prop="monitorPatchProfile">
                <el-select allow-create filterable v-model="row.monitorPatchProfile">
                    <el-option v-for="it in profiles" :label="it.label" :value="it.value"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item  label="应用名称" prop="monitorPatchApp">
                <el-select allow-create filterable v-model="row.monitorPatchApp">
                    <el-option v-for="it in apps" :label="it.monitorName" :value="it.monitorAppname"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="补丁名称" prop="monitorPatchName">
                <el-input  v-model="row.monitorPatchName" clearable placeholder="请输入补丁名称"></el-input>
            </el-form-item>
            <el-form-item label="中文名称" prop="monitorPatchChineseName">
                <el-input  v-model="row.monitorPatchChineseName" clearable placeholder="请输入中文名称"></el-input>
            </el-form-item>

            <el-form-item prop="file">
                <sc-upload @handlerFile="handlerFile" :autoUpload="false" accept="application/x-zip-compressed,application/java-archive" :limit="1" v-model="row.file" title="补丁包"></sc-upload>
            </el-form-item>

            <el-form-item label="描述" prop="monitorPatchDesc">
                <el-input type="textarea" v-model="row.monitorPatchDesc" clearable placeholder="请输入描述"></el-input>
            </el-form-item>

            <el-form-item label="版本" prop="monitorPatchVersion">
                <el-input  v-model="row.monitorPatchVersion" clearable placeholder="请输入版本"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取 消</el-button>
            <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(row)">保 存</el-button>
        </template>
    </el-dialog>
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
export default {
    name: 'tableBase',
    components: {
        scSelectFilter
    },
    data() {
        return {
            statusFilters: [
                { text: '启用', value: 0 },
                { text: '禁用', value: 1 }
            ],
            form: {
                mapMethod: []
            },
            isSaveing: false,
            rules: {
                    monitorPatchProfile: [
                        { required: true, message: '请选择环境', trigger: 'change' }
                    ],
                    monitorPatchApp: [
                        { required: true, message: '请选择应用名称', trigger: 'change' }
                    ],
                    monitorPatchName: [
                        { required: true, message: '请输入方法名称', trigger: 'change' },
                        { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'change' }
                    ],

            },
            visible: 0,
            searchParams: {},
            data: [
                {
                    title: "环境",
                    key: "monitorPatchProfile",
                    multiple: !1,
                    options: [

                    ]
                },

            ],
            row: {},
            profiles: [{
                label: "全部",
                value: ""
            },
            {
                label: "生产",
                value: "prod"
            },
            {
                label: "开发",
                value: "dev"
            },
            {
                label: "测试",
                value: "test"
            },],
            applications: [],
            list: {
                apiObj: this.$API.monitor.patch.page,
                apiObjUpdate: this.$API.monitor.patch.update,
                apiObjSave: this.$API.monitor.patch.save,
                apiObjLoadPatch: this.$API.monitor.patch.loadPatch,
                apiObjUpload: this.$API.monitor.patch.upload,
                apiObjDelete: this.$API.monitor.patch.delete,
            },
            selection: [],
            apps: []
        }
    },
    mounted() {
        this.data[0].options = this.profiles;
        this.afterPrepertiesSet();
    },
    methods: {
        handlerFile(file){
        },
        handleEvent(data){
            this.row.monitorPatchSql = data;
        },
        async afterPrepertiesSet(){
            this.$API.monitor.app.list.get().then(res => {
                if(res.code === '00000') {
                    this.apps = res.data;
                }
            });
        },
        //表格选择后回调事件
        selectionChange(selection) {
            this.selection = selection;
        },
        search() {
            if(!this.searchParams.monitorPatchProfile) {
                delete this.searchParams.monitorPatchProfile;
            }
            this.$refs.table.reload(this.searchParams)
        },
        table_del(row) {
            this.list.apiObjDelete.delete({id: row.monitorPatchId}).then(res => {
                if (res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    return 0;
                }
                this.$message.error(res.msg);
            })
        },
        //批量删除
        async batch_del() {
            this.$confirm(`确定删除选中的 ${this.selection.length} 项吗？如果删除项中含有子集将会被一并删除`, '提示', {
                type: 'warning'
            }).then(() => {
                const loading = this.$loading();
                const ids = [];
                for (const item of this.selection) {
                    ids.push(item.monitorPatchId);
                }
                this.list.apiObjDelete.delete({ id: ids.join(",") })
                    .then(res => {
                        if (res.code === '00000') {
                            this.$message.success("操作成功");
                            this.search();
                            return 0;
                        }
                    }).finally(() => {
                        loading.close();
                    })
            }).catch(() => {

            })
        },
        table_upload(row) {
            delete row?.executorIds;
            this.list.apiObjUpload.post(row || this.row).then(res => {
                if (res.code === '00000') {
                    this.search();
                    this.$message.success("下发成功");
                    return 0;
                }
                this.$message.error(res.msg);
            })
        },
        table_edit(row) {
            this.visible = !0;
            this.row = row;
            delete this.row.disable;
        },
        table_patch_unload(row) {
            this.$API.monitor.patch.unloadPatch.post(row).then(res => {
                if (res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    return 0;
                }
                this.$message.error(res.msg);
            })
        },
        submitFormInfo(row){
            row.file = row?.file?.raw || row?.file;
            delete row.executorIds;
            this.isSaveing = true;
            this.list.apiObjLoadPatch.post(row || this.row).then(res => {
                if (res.code === '00000') {
                    this.search();
                    this.visible = !1;
                    return 0;
                }
                this.$message.error(res.msg);
            }).finally(() => {
                this.isSaveing = false;
            })
            return false;
        },
        submitFormUpdate(row) {
            if( !this.$refs.dialogForm) {
                return !1;
            }
            this.$refs.dialogForm.validate(valid => {
                if(valid) {
                    this.submitFormInfo(row);
                }
            })
        },
        filterHandler(value, row, column) {
            const property = column['property']
            return row[property] === value
        },
        change(selected) {
            this.searchParams = selected;
            if(!selected.monitorPatchProfile) {
                delete selected.monitorPatchProfile;
            }
            this.$refs.table.reload(selected)
        }
    }
}
</script>

<style></style>
