<template>
    <el-container>
		<el-header>
			<div class="left-panel">
				<el-button type="primary" icon="el-icon-plus" @click="addIndices"></el-button>
				<!-- <el-button type="danger" plain icon="el-icon-delete"  @click="batch_del"></el-button> -->
				<!-- <el-button type="primary" plain :disabled="selection.length!=1" @click="permission">权限设置</el-button> -->
			</div>
			<div class="right-panel">
				<div class="right-panel-search">
					<el-input v-model="form.keyword" placeholder="角色名称" clearable></el-input>
					<el-button type="primary" icon="el-icon-search" @click="initialTables"></el-button>
				</div>
			</div>
		</el-header>
		<el-main class="nopadding">
            <scTable ref="table" :data="resultData" row-key="id" :params="form"  stripe>
                <el-table-column prop="name" label="索引" width="180" show-overflow-tooltip />
                <el-table-column prop="uuid" label="uuid" width="280">
                    <template #default="scope">
                        {{ scope.row?.attrs?.uuid}}
                    </template>
                </el-table-column>
                <el-table-column prop="size" label="大小">
                    <template #default="scope">
                        {{ priSize(scope.row?.attrs, 'StoreSize')}}
                    </template>
                </el-table-column>
                <el-table-column prop="priSize" label="主文档大小" >
                    <template #default="scope">
                        {{ priSize(scope.row?.attrs, 'PriStoreSize')}}
                    </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" >
                    <template #default="scope">
                        {{ scope.row?.attrs?.status}}
                    </template>
                </el-table-column>
                <el-table-column prop="health" label="健康状态" >
                    <template #default="scope">
                        <sc-status-indicator pulse type="success" v-if="scope.row?.attrs?.health == 'green'"></sc-status-indicator>
                        <sc-status-indicator pulse type="warning" v-else-if="scope.row?.attrs?.health == 'yellow'"></sc-status-indicator>
                        <sc-status-indicator pulse type="info" v-else></sc-status-indicator>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="170">
					<template #default="scope">
						<el-button-group>
							<el-popconfirm  title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
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

    <save-dialog v-if="saveDialogStatus"  ref="saveDialog"></save-dialog>
</template>

<script>
import scEcharts from '@/components/scEcharts/index.vue';
import { defineAsyncComponent } from 'vue';
import saveDialog from './save.vue'
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
export default {
	name: 'ES',
	components: {
		scCodeEditor, scEcharts, saveDialog
	},
    data(){
        return {
            form: {
                keyword: '',
				pageSize: 2000
			},
            resultTotal: 0,
            resultData: [],
            saveDialogStatus: false,
            isLoadDatabase: false,
            apiObj: this.$API.gen.session.keyword,
        }
    },
    created() {
        this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
        this.initialTables();
    },
    methods: {
        table_del(row) {
            Object.assign(row, this.form);
            row.type = 'DELETE_INDEX';
            this.$API.gen.session.delete.post(row).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    return 0;
                } 
                this.$message.error(res.msg);
            })
        },
        priSize(attrs, name) {
            if(!attrs) {
                return '';
            }
            for(const item in attrs) {
                if(item?.indexOf(name) > -1) {
                    return attrs[item]
                }

            }
            return '';
        },
        addIndices() {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open(this.form);
            })
        },
        doRefreshDatabase() {
			this.isLoadDatabase = true;
			this.initialTables();
			this.isLoadDatabase = false;
		},
        async initialTables() {
            this.$API.gen.session.keyword.get(this.form).then(res => {
                if (res.code === '00000') {
                    if (res.data && res.data.length > 0) {
                        this.resultData = res.data[0].children;
                    }
                }
            })
		},
        //本地更新数据
		handleSaveSuccess(data, mode) {
			this.initialTables();
		}
    }
}
</script>