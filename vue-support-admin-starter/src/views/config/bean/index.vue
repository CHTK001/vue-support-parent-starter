<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <sc-select-filter :data="data" :selected-values="selectedValues" :label-width="80" @on-change="change"></sc-select-filter>
                <br />
            </div>
            <div class="right-panel">
                <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="table_edit({})"></el-button>
                <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length==0" @click="batch_del"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="list.apiObj" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="应用名称" prop="beanApplicationName" width="150"></el-table-column>
                <el-table-column label="环境" prop="beanProfile" width="150">
                    <template #default="scope">
                        <el-tag >{{ scope.row. beanProfile}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="Bean名称" prop="beanName" ></el-table-column>
                <el-table-column label="脚本"   show-overflow-tooltip>
                    <template #default="scope">
                        <el-button text type="primary" @click="look(scope.row)">查看</el-button>
                    </template>
                </el-table-column>
                <el-table-column label="描述" prop="beanMarker"  show-overflow-tooltip></el-table-column>
                <el-table-column  label="是否禁用" prop="disable" width="150" :filters="statusFilters" :filter-method="filterHandler">
                    <template #default="scope">
                        <el-switch  v-if="!scope.row.beanName?.startsWith('bean-')" @change="submitFormUpdate(scope.row)" v-model="scope.row.disable" class="ml-2"
                            :active-value="0" :inactive-value="1"
                            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" />
                            <el-tag v-else>{{ scope.row.disable == 1 ? '是' : '否' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group v-if="!scope.row.beanName?.startsWith('bean-')">
                            <el-button v-auth="'sys:bean:edit'" text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
                            <el-popconfirm   v-auth="'sys:bean:del'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                                <template #reference>
                                    <el-button  v-auth="'sys:bean:del'" text type="primary" size="small">删除</el-button>
                                </template>
                            </el-popconfirm>
                        </el-button-group>
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>

    <el-dialog draggable v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :disabled="mode=='show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item v-show="false" label="索引" prop="beanName">
				<el-input v-model="row.beanId" clearable></el-input>
			</el-form-item>
			<el-form-item label="环境" prop="beanProfile">
                <el-select v-model="row.beanProfile">
                    <el-option v-for="it in profiles" :label="it" :value="it"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item v-if="!row.beanId" label="应用名称" prop="beanApplicationName">
                <el-select v-model="row.beanApplicationName">
                    <el-option v-for="it in applications" :label="it" :value="it"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item  label="Bean名称" prop="beanName">
				<el-input :readonly="row.beanId" :disabled="row.beanId" v-model="row.beanName" clearable></el-input>
			</el-form-item>
            <el-form-item label="配置值" prop="beanValue">
				<el-input v-model="row.beanValue" clearable></el-input>
			</el-form-item>
            <el-form-item label="描述" prop="beanMarker">
				<el-input type="textarea" v-model="row.beanMarker" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submitFormUpdate()">保 存</el-button>
		</template>
	</el-dialog>

    <el-dialog draggable v-model="showFile" >
        <sc-code-editor ref="coder" v-model="code" :height="700" mode="groovy"></sc-code-editor>
        <template #footer>
			<el-button @click="showFile=false" >取 消</el-button>
			<el-button type="primary" :loading="isSaveFileing" @click="submitFormUpdateFile()">保 存</el-button>
		</template>
    </el-dialog>
</template>

<script>
import { defineAsyncComponent } from 'vue';
import scSelectFilter from '@/components/scSelectFilter/index.vue'
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
export default {
    name: 'ConfigBean',
    components: {
        scSelectFilter,  
        scCodeEditor
    },
    data() {
        return {
            statusFilters: [
					{text: '启用', value: 0},
					{text: '禁用', value: 1}
				],
            form: {
                mapMethod: []
            },
            code: '',
            beanId: undefined,
            visible: 0,
            isSaveFileing: 0,
            showFile: 0,
            searchParams: {},
            data: [
                {
                    title: "环境",
                    key: "beanProfile",
                    multiple: !1,
                    options: [
                        {
                            label: "全部",
                            value: ""
                        },
                    ]
                }
            ],
            row: {},
            profiles: [],
            applications: [],
            list: {
                apiObj: this.$API.config.bean.page,
                apiObjUpdate: this.$API.config.bean.update,
                apiObjSave: this.$API.config.bean.save,
                apiObjDelete: this.$API.config.bean.delete,
                apiObjDetail: this.$API.config.bean.detail,
                apiObjUpdateDetail: this.$API.config.bean.detailUpdate,
            },
            selection: [],
        }
    },
    mounted(){
        this.initial();
    },
    methods: {
        look(row) {
            this.list.apiObjDetail.get({
                configId: row.beanId
            }).then(res => {
                if(res.code === '00000') {
                    this.showFile = !0;
                    this.code = res.data;
                    this.beanId = row.beanId;
                    return 0;
                } 
                this.$message.error(res.msg);
            })
        },
        submitFormUpdateFile(){
            this.list.apiObjUpdateDetail.post({
                configId: this.beanId,
                content: this.$refs.coder.coder.getValue(),
            }).then(res => {
                if(res.code === '00000') {
                    this.showFile = 0;
                    this.$message.success('更新成功');
                    return 0;
                } 
                this.$message.error(res.msg);
            })
        },
        //表格选择后回调事件
        selectionChange(selection){
            this.selection = selection;
        },
        search() {
            this.$refs.table.reload(this.searchParams)
        },
        table_del(row) {
            this.list.apiObjDelete.delete(row).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    return 0;
                } 
                this.$message.error(res.msg);
            })
        },
        //批量删除
			async batch_del(){
				this.$confirm(`确定删除选中的 ${this.selection.length} 项吗？如果删除项中含有子集将会被一并删除`, '提示', {
					type: 'warning'
				}).then(() => {
					const loading = this.$loading();
					const ids = [];
					for(const item of this.selection) {
						ids.push(item.beanId);
					}
                    this.list.apiObjDelete.delete({beanId: ids.join(",")})
					.then(res => {
						if(res.code === '00000') {
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
        table_edit(row) {
            this.visible = !0;
            Object.assign(this.row, row);
            delete this.row.disable;
        },
        async initial(){
            const res = await this.$API.config.bean.profile.get();
            if(res.code === '00000') {
                this.profiles = res.data;
                res.data.forEach(item => {
                    this.data[0].options.push({
                        label: item,
                        value: item
                    })
                })
            }
            const res1 = await this.$API.config.bean.applications.get();
            if(res1.code === '00000') {
                this.applications = res1.data;
            }
        },
        submitFormUpdate(row) {
            this.list.apiObjSave.post(row || this.row ).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    this.visible = !1;
                    return 0;
                } 
                this.$message.error(res.msg);
            })
        },
        filterHandler(value, row, column) {
            const property = column['property']
            return row[property] === value
        },
        change(selected) {
            this.searchParams = selected;
            this.$refs.table.reload(selected)
        }
    }
}
</script>

<style></style>
