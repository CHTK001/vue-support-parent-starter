<template>
<el-container>
		<el-container>
			<el-main class="nopadding">
				<el-container>
					<el-header>
						<div class="left-panel">
							<el-date-picker v-model="date" type="datetimerange" range-separator="至" start-placeholder="开始日期"
								end-placeholder="结束日期"></el-date-picker>
						</div>
						<div class="right-panel">
							<div class="right-panel-search">
								<el-input v-model="search.keyword" placeholder="关键词" clearable></el-input>
								<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
								<el-button type="primary" icon="el-icon-plus" @click="addLibrary"></el-button>
							</div>
						</div>
					</el-header>
					<el-main class="nopadding">
						<scTable ref="table" :apiObj="apiObj" stripe highlightCurrentRow @row-click="rowClick">
							 <el-table-column label="级别" prop="level" width="60">
								<template #default="scope">
									<sc-status-indicator pulse type="warning" v-if="scope.row.logCost > 1000" title="耗时超过1s"></sc-status-indicator>
									<el-icon v-else
										style="color: #409EFF;"><el-icon-info-filled /></el-icon>
								</template>
							</el-table-column> 
							<el-table-column label="ID" prop="logCode" width="180" show-overflow-tooltip></el-table-column>
							<el-table-column label="日志名" prop="logName" width="150"></el-table-column>
							<el-table-column label="动作" prop="logAction" width="150">	</el-table-column>
							<el-table-column label="请求接口" prop="logMapping"  show-overflow-tooltip></el-table-column>
							<el-table-column label="客户端IP" prop="logAddress" width="150"></el-table-column>
							<el-table-column label="访问位置" prop="logAddressPosition">
								<template #default="scope">
									<el-tag>{{ scope.row.logAddressPosition}}</el-tag>
								</template>
							</el-table-column>
							<el-table-column label="访问人" prop="createName" width="150"></el-table-column>
							<el-table-column label="日志时间" prop="createTime" width="170"></el-table-column>
							<el-table-column label="耗时" prop="logCost">
								<template #default="scope">
									<el-badge v-if="scope.row.logCost > 1000">{{ scope.row.logCost}} ms</el-badge>
									<span v-else>{{ scope.row.logCost}} ms</span>
								</template>
							</el-table-column>
						</scTable>
					</el-main>
				</el-container>
			</el-main>
		</el-container>
	</el-container>
    <upload v-if="dialog.save" ref="saveDialog" :close-on-click-modal="false" @closed="dialog.save=false"></upload>
</template>
<script>
import upload from './upload.vue'
export default {
    name: 'FaceReLibrary',
    components:{
        upload
    },
    data(){
        return {
            search: {},
            dialog: {
                save: false
            }
        }
    },
    methods:{
        /**查询人脸库信息 */
        upsearch(){

        },
        /**添加人脸库 */
        addLibrary() {
            this.dialog.save = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open()
            })
        }
    }
}
</script>

<style scoped lang="less">
</style>