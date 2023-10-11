<template>
    <el-container>
		<el-header>
			<div class="left-panel">
				<el-button type="primary" icon="el-icon-plus" @click="addIndices"></el-button>
				<el-button type="danger" plain icon="el-icon-delete"  @click="batch_del"></el-button>
				<!-- <el-button type="primary" plain :disabled="selection.length!=1" @click="permission">权限设置</el-button> -->
			</div>
			<div class="right-panel">
				<div class="right-panel-search">
					<el-input v-model="form.keyword" placeholder="角色名称" clearable></el-input>
					<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
				</div>
			</div>
		</el-header>
		<el-main class="nopadding">
            <scTable ref="table" :data="resultData" row-key="id" :params="form"  @selection-change="selectionChange" stripe>
                <el-table-column prop="name" label="索引" width="180" show-overflow-tooltip />
                <el-table-column prop="name" label="大小" width="180">
                    <template #default="scope">
                        {{ priSize(scope.row?.attrs, 'StoreSize')}}
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="主文档大小" width="180">
                    <template #default="scope">
                        {{ priSize(scope.row?.attrs, 'PriStoreSize')}}
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