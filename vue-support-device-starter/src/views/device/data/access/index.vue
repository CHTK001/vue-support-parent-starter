<template>
    <el-container>
        <el-header style="height: auto;">
            <sc-select-filter :data="filterData" :label-width="80" @on-change="filterChange"></sc-select-filter>
        </el-header>
        <el-header >
            <div class="left-panel">
               
            </div>
            <div class="right-panel">
                <scFilterBar filterName="filterName" :options="options" @filterChange="change">
                    <template #default="{filterLength, openFilter}">
                        <el-badge :value="filterLength" type="danger" :hidden="filterLength<=0">
                            <el-button icon="el-icon-filter" @click="openFilter"></el-button>
                        </el-badge>
                    </template>
                </scFilterBar>
                <el-button type="primary" icon="el-icon-search" style="margin-left: 10px;" @click="doSearch"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="list.apiObj" :filter="filter" :params="params" row-key="id" stripe show-summary remoteSort remoteFilter remoteSummary>
                <el-table-column type="index" width="50"></el-table-column>
                <el-table-column label="数据ID" prop="deviceDataDataId" ></el-table-column>
                <el-table-column label="设备编号" prop="deviceIsmi">
                    <template #default="scope">
                        <p>{{ scope.row.deviceIsmi }}</p>
                        <p>{{ scope.row.deviceName }}</p>
                    </template>
                </el-table-column>
                <el-table-column label="姓名" prop="deviceDataPersionName" ></el-table-column>
                <el-table-column label="人脸" prop="deviceDataFaceUrl">
                    <template #default="scope">
                        <div class="cursor-pointer" @click="doView(scope.row.deviceDataFaceUrl)">
                            <el-image :src="scope.row.deviceDataFaceUrl" style="height: 50px; "></el-image>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column label="进出方向" prop="deviceDataEventInOrOut" >
                    <template #default="scope">
                        <span v-if="scope.row.deviceDataEventInOrOut == '0'">进</span>
                        <span v-else-if="scope.row.deviceDataEventInOrOut == '1'">出</span>
                        <span v-else>进</span>
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
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import scFilterBar from '@/components/scFilterBar/index.vue';

import { api as viewerApi } from "v-viewer"

export default {
    name: 'tableRemote',
    components: {
        scSelectFilter, scFilterBar
    },
    data() {
        return {
            options: [
                {
                    label: '设备',
                    value: 'deviceImsi',
                    type: 'select',
                    operator: 'eq',
                    placeholder: '请选择设备',
                    extend: {
                        data: this.deviceList
                    }
                },
                {
                    label: '时间',
                    value: 'deviceDataEventTime',
                    type: 'datetimerange',
                    operator: 'range',
                },
                {
                    label: '关键词',
                    value: 'deviceDataPersionName, deviceDataPersonNum',
                    type: 'text',
                    operator: 'eq',
                    placeholder: '请输入姓名,人员编号',
                },
                {
                    label: '时间排序',
                    value: '~deviceDataEventTime',
                    type: 'order',
                    operator: 'order',
                },
            ],
            filterData: [
                {
                    title: "进出方向",
                    key: "deviceDataEventInOrOut",
                    options: [
                        {
                            label: "全部",
                            value: ""
                        },
                        {
                            label: "进",
                            value: "0"
                        },
                        {
                            label: "出",
                            value: "1"
                        }
                    ]
                },
                
            ],
            params:{
                eventType: 'ACCESS'
            },
            deviceList: [],
            list: {
                apiObj: this.$API.device.device.data.page
            },
            filterData1: null,
            filter:[]
        }
    },
    created() {
        if (this.$route.params.deviceImsi && this.$route.params.deviceImsi != 'null') {
            this.options[0].selected = true;
            this.filter = [{
                field: {
                    key: 'deviceImsi',
                },
                operator: 'eq',
                value: this.$route.params.deviceImsi
            }]
		}
    },
    mounted(){
        this.registerDeviceInfo();
		
    },
    //  viewerApi({ images: imags })
    methods: {
        change(data){
            this.params.filter = JSON.stringify(data);
            this.doSearch();
        },
        async registerDeviceInfo(){
			const res = await this.$API.device.device.list.get({deviceTypeCode: 'ACCESS'});
			if (res.code == '00000') {
				this.deviceList = res.data;
                const options = [{
                    label: "全部",
                    value: ""
                }]
               this.deviceList.forEach(it => {
                options.push({
                        value: it.deviceImsi,
                        label: it.deviceName
                    })
                });
                this.options[0].extend.data = options;
			} else {
				this.$message.error(res.msg)
			}
		},
        doSearch() {
            if(this.params.date) {
                this.params.startTime = this.params.date[0];
                this.params.endTime = this.params.date[1];
            }
            this.$refs.table.reload(this.params);
        },
        filterChange(data){
            Object.assign(this.params, data);
            this.doSearch();
        },
        doView(url) {
            viewerApi({ images: [url] })
        }
    }
}
</script>

<style>
</style>
