<template>
    <el-container>
    <el-header>
        <div class="left-panel">
            <el-button type="primary" icon="el-icon-plus"></el-button>
            <el-button type="danger" plain icon="el-icon-delete"></el-button>
        </div>
        <div class="right-panel">
            <el-alert title="因演示使用mock数据,所以视图上看不出效果,可以查看控制台的网络请求" type="warning" :closable="false"/>
        </div>
    </el-header>
    <el-main class="nopadding">
        <scTable ref="table" :apiObj="list.apiObj" :params="params" row-key="id" stripe show-summary remoteSort remoteFilter remoteSummary>
            <el-table-column type="index" width="50"></el-table-column>
            <el-table-column label="数据ID" prop="deviceDataDataId" ></el-table-column>
            <el-table-column label="设备编号" prop="deviceIsmi"></el-table-column>
            <el-table-column label="姓名" prop="deviceDataPersionName" ></el-table-column>
            <el-table-column label="人脸" prop="deviceDataFaceUrl">
                <template #default="scope">
                    <div class="cursor-pointer" @click="doView(scope.row.deviceDataFaceUrl)">
                        <el-image :src="scope.row.deviceDataFaceUrl" style="height: 50px; "></el-image>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="所属组织" prop="deviceDataOrgPathName" ></el-table-column>
            <el-table-column label="门禁结果" prop="deviceDataEventCodeLabel"  sortable></el-table-column>
            <el-table-column label="时间事件" prop="deviceDataEventTime"  >
                <template #default="scope">
                    <el-tag v-time="scope.row.deviceDataEventTime" />
                </template>
            </el-table-column>
        </scTable>
    </el-main>
</el-container>
</template>

<script>
import { api as viewerApi } from "v-viewer"

	export default {
		name: 'tableRemote',
		data() {
			return {
				sexFilters: [
					{text: '男', value: '男'},
					{text: '女', value: '女'}
				],
                params:{
                    eventType: 'ACCESS'
                },
				list: {
					apiObj: this.$API.device.device.data.page
				}
			}
		},
        //  viewerApi({ images: imags })
		methods: {
            doView(url) {
                viewerApi({ images: [url] })
            }
		}
	}
</script>

<style>
</style>
