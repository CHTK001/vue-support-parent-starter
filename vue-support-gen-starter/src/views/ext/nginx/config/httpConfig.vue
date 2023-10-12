<template>
    <el-container style="overflow: hidden;">
        <el-main class="nopadding">
            <div class="code-toolbar">
                <el-button plain text :loading="isOpen" icon="el-icon-refresh" @click="afterPropertiesSet">刷新</el-button>
                <el-button plain text :loading="isSave" icon="el-icon-plus" @click="doSave()">添加http参数</el-button>
                <el-button plain text :loading="isOpen" icon="el-icon-plus" @click="addSimpleConfig">简易配置向导</el-button>
                <!-- <el-button plain text :loading="isSaveBtn" icon="sc-icon-save" @click="doSaveBtn">保存</el-button> -->
                <!-- <el-button plain text  icon="el-icon-warning" @click="doLog">日志</el-button> -->
            </div>
            <div>
                <scTable ref="table" :data="resultData" row-key="id" :params="form"  stripe>
                    <el-table-column type="index" label="序列"/>
                    <el-table-column prop="httpConfigName" label="配置名称"  />
                    <el-table-column prop="httpConfigValue" label="配置值" />
                    <el-table-column prop="httpConfigStatus" label="状态" >
                        <template #default="scope">
                            <el-switch v-model="scope.row.httpConfigStatus" @change="doChangeStatus(scope.row)" :inactive-value="0" :active-value="1"/>
                        </template>
                    </el-table-column>
                     <el-table-column label="操作" fixed="right" align="right" width="170">
					<template #default="scope">
						<el-button-group>
                            <el-button text type="primary" size="small" @click="doEdit(scope.row)">编辑</el-button>
                            <el-button text type="primary" size="small" @click="doDel(scope.row)">删除</el-button>
						</el-button-group>
					</template>
				</el-table-column>
                </scTable>
            </div>
        </el-main>

    </el-container>
    
    <save-dialog ref="saveDialogRef" v-if="saveDialogStatus"  @success="handleSaveSuccess"> </save-dialog>
</template>
<script>

import simpleConfig from './simpleConfig.vue';
import saveDialog from './save.vue';
export default {
    name: 'HttpConfig',
    components: {simpleConfig, saveDialog},
    data() {
        return {
            title: '',
            dialogStatus: false,
            saveDialogStatus: false,
            mode: 'add',
            form: {},
            resultData: {},
            resultTotal: 0
        }
    },
    mounted() {
        this.form.genId = this.$route.params.genId;
		if (!this.form.genId || this.form.genId === 'null') {
			delete this.form.genId;
		}
        this.afterPropertiesSet();
    },
    methods: {
        doChangeStatus(data) {
            const _this = this;
            _this.$API.gen.nginx.config.update.put(data).then(res => {
                if(res.code === '00000') {
                    return;
                }
            })
        },
        doDel(data) {
            const _this = this;
            _this.$API.gen.nginx.config.delete.delete({ids: data.httpConfigId}).then(res => {
                if(res.code === '00000') {
                    this.resultData = this.resultData.filter(it => it.httpConfigId !== data.httpConfigId)
                    return;
                }
            })
        },
        doEdit(row) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialogRef.open(row, 'edit');
            })
        },
        doSave(){
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialogRef.open(this.form, 'add');
            })
        },
        afterPropertiesSet() {
            this.$API.gen.nginx.config.page.get(this.form).then(res => {
                if(res.code === '00000') {
                    this.resultData = res.data?.data;
                    this.resultTotal = res.data?.total || 0;
                }
            })
        },
        handleSaveSuccess(data, mode) {
            // if(mode === 'add') {
            //     this.resultTotal = this.resultTotal + 1;
            //     this.resultData.push(data);
            //     return;
            // }

            // for(const item in this.resultData) {
            //     if(item.httpConfigId === data.httpConfigId) {
            //         Object.assign(this.resultData[item], data);
            //         break
            //     }
            // }
            this.afterPropertiesSet();
        },
    }

}
</script>
<style lang="less" scoped>
.code-toolbar {
    margin: 5px;
}
</style>