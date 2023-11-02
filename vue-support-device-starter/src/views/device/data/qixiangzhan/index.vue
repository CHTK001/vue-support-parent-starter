<template>
    <el-container>
        <el-header style="height: auto;">
            <sc-select-filter v-if="deviceList.length < 10"  :selected-values="selectedValues" :data="filterData" :label-width="80" @on-change="filterChange"></sc-select-filter>
        </el-header>
        <!-- <el-header >
            <div class="left-panel">
                <el-select @change="change"  v-if="deviceList.length >=10">
                    <el-option  v-for="item in deviceList" :label="item.deviceName" :value="item.deviceImsi"></el-option>
                </el-select>
                <el-button  type="primary" icon="el-icon-search" style="margin-left: 10px;" @click="doSearch"></el-button>
            </div>
        </el-header> -->
        <el-main class="nopadding">
            <scTable ref="table" :hidePagination="true" :hideDo="true" :apiObj="list.apiObj" :filter="filter" :params="params" row-key="id" stripe >
                <el-table-column type="index" width="50" fixed></el-table-column>
                <el-table-column label="时间事件" prop="time" fixed width="180">
                    <template #default="scope">
                        <el-tag v-time="scope.row.time * 1000" />
                    </template>
                </el-table-column>
                <el-table-column label="设备编码" prop="deviceImsi" width="130"  fixed ></el-table-column>
                <el-table-column label="水质ph值" prop="phForWaterQuality"  ></el-table-column>
                <el-table-column label="水质ec" prop="ecForWaterQuality"  ></el-table-column>
                <el-table-column label="液位计" prop="levelInstrumentationNozzle"  ></el-table-column>
                <el-table-column label="浊度" prop="turbidity"  ></el-table-column>
                <el-table-column label="降雨量" prop="rainfall"  ></el-table-column>
                <el-table-column label="水温" prop="temperatureForWater"  ></el-table-column>
                <el-table-column label="水传感器" prop="waterSensor"  ></el-table-column>

                <el-table-column label="空气湿度" prop="humidityForAir"  ></el-table-column>
                <el-table-column label="空气温度" prop="temperatureForAir"  ></el-table-column>
                <el-table-column label="二氧化碳" prop="carbonDioxide"  ></el-table-column>
                <el-table-column label="溶解氧" prop="dissolvedOxygen"  ></el-table-column>
                <el-table-column label="电导率" prop="specificConductance"  ></el-table-column>
               
                
                <el-table-column label="土壤温度" prop="temperatureForSoil"  ></el-table-column>
                <el-table-column label="土壤湿度" prop="humidityForSoil"  ></el-table-column>
                <el-table-column label="土壤氮" prop="nitrogenForSoil"  ></el-table-column>
                <el-table-column label="土壤磷" prop="phosphorusForSoil"  ></el-table-column>
                <el-table-column label="土壤钾" prop="potassiumForSoil"  ></el-table-column>

                <el-table-column label="照明强度" prop="illuminationIntensity"  ></el-table-column>
                <el-table-column label="太阳辐射" prop="solarRadiation"  ></el-table-column>

                <el-table-column label="风速" prop="windSpeed"  ></el-table-column>
                <el-table-column label="风向" prop="windDirection"  ></el-table-column>

                <el-table-column label="gps" prop="gps"  ></el-table-column>

           
            </scTable>
        </el-main>
        <el-footer>
            <el-button-group>
                <el-button >当前：{{page}} 页</el-button>
                <el-button icon="el-icon-arrow-left" @click="doPage(page  = (page - 1) < 0 ? 1 : (page - 1))"></el-button>
                <el-button icon="el-icon-arrow-right" @click="doPage(page = page + 1)"></el-button>
                <el-button>
                    <el-select v-model="pageSize" @change="doPage(page)">
                        <el-option label="每页显示10条" :value="10"></el-option>
                        <el-option label="每页显示20条" :value="20"></el-option>
                        <el-option label="每页显示30条" :value="30"></el-option>
                        <el-option label="每页显示50条" :value="50"></el-option>
                    </el-select>
                </el-button>
            </el-button-group>
        </el-footer>
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
            page: 1,
            pageSize: 20,
            paginationLayout: "sizes, prev, next",
            filterData: [
                {
                    title: "设备",
                    key: "deviceImsi",
                    options: []
                },
                {
                    title: "时间",
                    key: "time",
                    options: [
                        {
                            label: "3分钟",
                            value: "now() - 3m",
                            icon: "el-icon-clock"
                        },   
                        {
                            label: "10分钟",
                            value: "now() - 10m",
                            icon: "el-icon-clock"
                        },   
                        {
                            label: "20分钟",
                            value: "now() - 20m",
                            icon: "el-icon-clock"
                        }, 
                        {
                            label: "30分钟",
                            value: "now() - 30m",
                            icon: "el-icon-clock"
                        },   
                        {
                            label: "1小时",
                            value: "now() - 1h",
                            icon: "el-icon-clock"
                        },  
                        {
                            label: "2小时",
                            value: "now() - 2h",
                            icon: "el-icon-clock"
                        }, 
                        {
                            label: "5小时",
                            value: "now() - 5h",
                            icon: "el-icon-clock"
                        }, 
                    ]
                },
            ],
            filterParams: {
                deviceTypeCode: 'QI_XIANG_ZHAN',
            },
            props: {
                label: 'deviceName',
                value: 'deviceIsmi',
                keyword: "keyword"
            },
            params:{
                eventType: 'QI_XIANG_ZHAN',
                filter: ''
            },
            
            deviceList: [],
            list: {
                apiObj: this.$API.device.device.data.page
            },
            filterData1: null,
            filter:[],
            selectedValues: {
            },
            channel: null
        }
    },
    created() {
        this.registerDeviceInfo();
        if (this.$route.params.deviceImsi && this.$route.params.deviceImsi != 'null') {
		}
    },
    mounted(){
    },
    //  viewerApi({ images: imags })
    methods: {
        change(data){
            this.params.filter = JSON.stringify([{key: 'deviceImsi', operator: 'eq', value: data.deviceImsi}]);
            this.doSearch();
        },
        async registerDeviceInfo(){
			const res = await this.$API.device.device.list.get({deviceTypeCode: 'QI_XIANG_ZHAN'});
			if (res.code == '00000') {
				this.deviceList = res.data;
                const options = [];
                this.deviceList.forEach(it => {
                    options.push({
                        value: it.deviceImsi,
                        label: it.deviceName,
                        icon: "sc-icon-device"
                    })
                });
                this.filterData[0].options = options;
                this.selectedValues['deviceImsi'] = options[0].value;
			} else {
				this.$message.error(res.msg)
			}
		},
        doSearch() {
            if(this.params.date) {
                this.params.startTime = this.params.date[0];
                this.params.endTime = this.params.date[1];
            }
            this.params.page = this.page;
            this.params.pageSize = this.pageSize;
            this.$refs.table.reload(this.params);
        },
        doPage(page) {
            this.doSearch();
        },
        filterChange(data){
            const arr = [];
            for(const item of Object.keys(data)) {
                arr.push({key: item, operator: item == 'time' ? 'ge' : 'eq', value: data[item]})
            }
            this.params.filter = JSON.stringify(arr);
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
