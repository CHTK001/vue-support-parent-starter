<template>
    <el-container>
        <!-- <el-aside width="220px">
			<el-tree ref="category" class="menu" node-key="label" :data="category" :default-expanded-keys="['系统日志']"
				current-node-key="系统日志" :highlight-current="true" :expand-on-click-node="false">
			</el-tree>
		</el-aside> -->
        <el-container>
            <el-main class="nopadding">
                <el-container>
                    <el-header>
                        <div class="left-panel">
                        </div>
                        <div class="right-panel">
                            <el-form :model="form" label-width="50px" style="height: 32px; display: inline-flex ">
                                <el-form-item label="名称:" >
                                    <el-input v-model="form.appname" placeholder="名称" clearable />
                                </el-form-item>
                                <el-form-item label="描述:" >
                                    <el-input v-model="form.title" placeholder="应用描述"  clearable/>
                                </el-form-item>
                            </el-form>
                            <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                            <el-button type="primary" icon="el-icon-plus" @click="add"></el-button>
                        </div>
                    </el-header>
                    <el-main class="nopadding">
                        <scTable ref="table" :loading="loading" :params="form" :apiObj="apiObj" stripe highlightCurrentRow>
                            <el-table-column label="应用名称" prop="appname" width="250"></el-table-column>
                            <el-table-column label="应用描述" prop="title" width="150"></el-table-column>
                            <el-table-column label="注册方式" prop="addressType" show-overflow-tooltip>
                                <template #default="scope">
                                    <el-tag v-if="scope.row.addressType == 0">自动注册</el-tag>
                                    <el-tag v-else>手动注册</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="OnLine 机器地址" prop="registryList" width="150">
                                <template #default="scope">
                                    <el-button @click="showRegistryList(scope.row.registryList)" text type="primary"
                                        size="small">查看({{ scope.row.registryList ? scope.row.registryList.length : 0
                                        }})</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column label="更新时间" prop="updateTime">
                                <template #default="scope">
                                    <el-tag v-time="scope.row.updateTime"></el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column label="操作" fixed="right" align="right" width="170">
                                <template #default="scope">
                                    <el-button-group>
                                        <el-button text type="primary" size="small" @click="add(scope.row)">编辑</el-button>
                                        <el-button text type="primary" size="small" @click="del(scope.row, scope.$index)">删除</el-button>
                                    </el-button-group>
                                </template>
                            </el-table-column>
                        </scTable>
                    </el-main>
                </el-container>
            </el-main>
        </el-container>
    </el-container>

    <el-dialog title="添加执行器" v-model="addShow" @close="clearShow = !1">
        <el-form  ref="addRef" :rules="rules" :model="forms" label-width="120px">
            <el-form-item label="执行器名称" prop="appname">
                <el-input v-model="forms.appname" max="64" min="4"/>
            </el-form-item>
            <el-form-item label="描述" prop="title">
                <el-input  v-model="forms.title" />
            </el-form-item>
            <el-form-item label="注册方式" prop="addressType" >
                <el-radio-group v-model="forms.addressType">
                    <el-radio-button :label="0" >自动注册</el-radio-button>
                    <el-radio-button :label="1" >手动注册</el-radio-button>
                </el-radio-group>
            </el-form-item>
            <el-form-item label="机器地址" v-if="forms.addressType === 1" prop="addressList">
                <el-input type="textarea" v-model="forms.addressList" />
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button :loading="loading" @click="addShow = false">取消</el-button>
                <el-button  :loading="loading"  type="primary" @click="addSubmit">确定</el-button>
            </span>
        </template>
    </el-dialog>

    <el-dialog draggable width="15%" title="在线列表" v-model="showOnlineAddress" @close="showOnlineAddress = !1">
        <el-row v-for="item in onlineAddress">
            <el-tag>{{ item }}</el-tag>
        </el-row>
    </el-dialog>
</template>

<script>
export default {
    name: 'JobGroup',
    data() {
        return {
            loading: !1,
            showOnlineAddress: !1,
            form: {
                appname: '',
            },
            rules: {
                appname: [
                        {trigger: 'blur', required: !0, message: '名称不能为空'},
                        { min: 4, max: 64, message: "名称长度在3到10个字符", trigger: "change" }
                    ],
                title: [{trigger: 'blur', required: !0, message: '描述不能为空'}],
                addressList: [{trigger: 'blur', required: !0, message: '注册地址不能为空'}],
            },
            forms:{
                addressType: 0
            },
            jobName: '全部',
            jobGroupName: '全部',
            data: [],
            onlineAddress: [],
            apiObj: this.$API.scheduler.jobgroupPageList,
            addShow: !1,
        }
    },
    mounted: function () {
        this.initial();
    },
    methods: {
        /**显示在线列表 */
        showRegistryList(address) {
            this.onlineAddress = address || [];
            this.showOnlineAddress = !0;
        },
        del(row) {
            this.$API.scheduler.jobgroupDel.get({id: row.id}).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    this.data = this.data.filter(it => it.id != row.id)
                    return !1;
                }
                this.$message.error(res.msg);
            })
        },
        addSubmit(){
            this.$refs.addRef.validate(it => {
                if(it) {
                    var api = undefined;
                    if(this.forms.id) {
                        api = this.$API.scheduler.jobgroupUpdate;
                    } else {
                        api = this.$API.scheduler.jobgroupAdd;
                    }

                    this.loading = !0;
                    api.get(this.forms).then(res => {
                        if(res.code === '00000') {
                            this.$message.success("操作成功");
                            this.search();
                            this.addShow = !1;
                            return !1;
                        }
                        this.$message.error(res.msg);
                    }).finally(() => this.loading = !1)
                }
            })
        },
        add(row = {}) {
            this.addShow = !0;
            this.loading = !1
            if(row) {
                Object.assign(this.forms, row);
            } else {
                this.forms = {};
            }
        },
        async initial() {
            this.search();
        },
        search() {
            // this.loading = !0;
            // this.apiObj.get(this.form).then(res => {
            //     if (res.code === '00000') {
            //         this.data = res.data.data;
            //     }
            // }).finally(() => this.loading = !1)
            this.$refs.table.reload(this.form)
        },

    }
}
</script>

<style scope lang="less">
:deep(.el-input.el-input--default.el-input--suffix) {
    width: 200px !important;
  }
</style>
