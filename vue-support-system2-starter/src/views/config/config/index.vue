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
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="list.apiObj" row-key="id" stripe>
                <el-table-column label="应用名称" prop="configItem" width="150"></el-table-column>
                <el-table-column label="环境" prop="configProfile" width="150">
                    <template #default="scope">
                        <el-tag >{{ scope.row. configProfile}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="配置名称" prop="configName" ></el-table-column>
                <el-table-column label="配置值" prop="configValue"  show-overflow-tooltip></el-table-column>
                <el-table-column label="描述" prop="configDesc"  show-overflow-tooltip></el-table-column>
                <el-table-column label="是否禁用" prop="disable" width="150" :filters="statusFilters" :filter-method="filterHandler">
                    <template #default="scope">
                        <el-switch @change="submitFormUpdate(scope.row)" v-model="scope.row.disable" class="ml-2"
                            :active-value="0" :inactive-value="1"
                            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group v-if="!scope.row.configName.startsWith('binder-')">
                            <el-button v-auth="'sys:config:edit'" text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
                            <el-popconfirm   v-auth="'sys:config:del'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                                <template #reference>
                                    <el-button  v-auth="'sys:config:del'" text type="primary" size="small">删除</el-button>
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
			<el-form-item v-show="false" label="索引" prop="configName">
				<el-input v-model="row.configId" clearable></el-input>
			</el-form-item>
			<el-form-item label="环境" prop="configProfile">
                <el-select v-model="row.configProfile">
                    <el-option v-for="it in profiles" :label="it"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item v-if="!row.configId" label="应用名称" prop="configItem">
                <el-select v-model="row.configItem">
                    <el-option v-for="it in applications" :label="it"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item  label="配置名称" prop="configName">
				<el-input :readonly="row.configId" :disabled="row.configId" v-model="row.configName" clearable></el-input>
			</el-form-item>
            <el-form-item label="配置值" prop="configValue">
				<el-input v-model="row.configValue" clearable></el-input>
			</el-form-item>
            <el-form-item label="描述" prop="configDesc">
				<el-input v-model="row.configDesc" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submitFormUpdate()">保 存</el-button>
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
					{text: '启用', value: 0},
					{text: '禁用', value: 1}
				],
            form: {
                mapMethod: []
            },
            visible: 0,
            searchParams: {},
            data: [
                {
                    title: "环境",
                    key: "configProfile",
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
                apiObj: this.$API.config.config.page,
                apiObjUpdate: this.$API.config.config.update,
                apiObjSave: this.$API.config.config.save,
                apiObjDelete: this.$API.config.config.delete,
            }
        }
    },
    mounted(){
        this.initial();
    },
    methods: {
        search() {
            this.$refs.table.reload(this.searchParams)
        },
        table_del(row) {
            this.list.apiObjDelete.delete(row).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    this.visible = !1;
                    return 0;
                } 
                this.$message.error(res.msg);
            })
        },
        table_edit(row) {
            this.visible = !0;
            Object.assign(this.row, row);
        },
        async initial(){
            const res = await this.$API.config.config.profile.get();
            if(res.code === '00000') {
                this.profiles = res.data;
                res.data.forEach(item => {
                    this.data[0].options.push({
                        label: item,
                        value: item
                    })
                })
            }

        },
        submitFormUpdate() {
            this.list.apiObjSave.post(this.row ).then(res => {
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
