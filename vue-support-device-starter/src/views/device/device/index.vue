<template>
    <el-container style="background-color: #ccc; position: relative;">
        <el-header>
            <div class="left-panel">
            </div>
            <div class="right-panel">
                <el-input v-model="form.keyword" placeholder="请输入设备名称, 设备类型" clearable></el-input>
                <el-button type="primary" icon="el-icon-search" @click="afterPropertiesSet"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <div ref="table" :style="{ 'overflow': 'auto', 'height': _table_height, 'background': 'rgb(226 232 240 / 30%)' }">
                <el-row>
                    <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in returnData" :key="item.taskId" class="demo-progress">
                        <div style="margin: 10px" class="relative max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl task-item shadow-lg ">
                            <div class="md:flex relative">
                                <div class="md:flex-shrink-0 relative">
                                    <logo :type="item.deviceTypeCode"></logo>
                                    <div style="padding: 4px;  border-bottom-right-radius:9px; background-color: rgb(81, 81, 204); color: white" class="absolute left-0 top-0 bg-blue-0 text-color-white" ><span>{{ item.deviceTypeName }}</span></div>
                                    <div class="absolute bottom-0 left-0 bg-white" style="border-top-right-radius: 5px; font-weight: 800;">
                                        <device-menu  :item="item"></device-menu>
                                    </div>
                                </div>
                                <div class="absolute top-0 cursor-pointer" style="font-size: 13px; right: 10px; top: 3px">
                                    
                                    <el-icon style="margin-right: 4px" v-if="item.deviceInCloud == 'cloud'" title="已同步到云平台">
                                        <component is="sc-icon-cloud" circle />
                                    </el-icon>

                                    <el-icon  v-if="item.deviceStatus == 'online'" title="在线">
                                        <component is="sc-icon-online" circle />
                                    </el-icon>
                                    <el-icon class="animation" v-else-if="item.deviceStatus == 'loading'" title="加载中">
                                        <component is="sc-icon-loading-v2" circle />
                                    </el-icon>
                                    <el-icon v-else-if="item.deviceStatus == 'offline'" title="离线">
                                        <component is="sc-icon-lan-disconnection" circle />
                                    </el-icon>
                                    <el-icon v-else-if="item.deviceStatus == 'disable'" title="故障">
                                        <component is="sc-icon-disable" circle />
                                    </el-icon>
                                </div>
                                <div class="pr-8 pl-8 pt-8" style="width: 100%;">
                                    <el-col :span="24">
                                    <ul>
                                        <li>
                                            <h4><span>设备名称:  </span><span>{{ item.deviceName }}</span></h4>
                                        </li>
                                        <li>
                                            <h4><span>设备序列: </span><span>{{ item.deviceImsi }}<el-icon class="text-blue-500 cursor-pointer copy"  @click="seccendCopy(item.deviceImsi)"><component is="sc-icon-copy" /></el-icon></span></h4>
                                        </li>
                                        <li v-if="item.deviceServiceName">
                                            <h4><span>所属服务: </span>{{ item.deviceServiceName }}</h4>
                                        </li>
                                        <li v-else>
                                            <h4>无服务</h4>
                                        </li>

                                        <li >
                                            <h4>所属组织: <span>{{ item.deviceOrgName ?? '-' }}</span></h4>
                                        </li>
                                        <li v-if="item.deviceTag">
                                            <el-tag class="mx-1" size="small" v-for="(it, index) in item.deviceTag.split(',')">
                                                <span v-if="index < 3">{{ it }}</span>
                                            </el-tag>
                                        </li>
                                        <li v-else>
                                            <el-tag size="small" type="info">无标签</el-tag>
                                        </li>
                                        <li>
                                            <el-divider style="margin-top: 10px !important; margin-bottom: 10px !important"></el-divider>
                                            <el-button style="margin-left: 0px;" type="primary" size="small" icon="el-icon-edit" text plain @click="doEdit(item)" title="编辑"></el-button>
                                            <el-button style="margin-left: 0px;" type="primary" size="small" icon="el-icon-delete" text plain @click="doDelete(item)" title="删除"></el-button>
                                            <el-button style="margin-left: 0px;" type="primary" size="small" icon="sc-icon-channel" text plain @click="doChannel(item)" title="管道">
                                            <span >{{ item.deviceChannelCount || 0 }}</span>
                                            </el-button>
                                        </li>
                                    </ul>
                                </el-col>
                                </div>
                            </div>
                        </div>
                    </el-col>
                    <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                        <div style="margin: 10px; height: 207px" class="cursor-pointer relative max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl task-item shadow-lg " @click="doSave">
                            <div class="absolute" style="left: 45%; top: 40%;  font-size: 30px;">
                                <el-icon><el-icon-plus /></el-icon>
                            </div>
                        </div>
                    </el-col>
                </el-row>
            </div>
            <el-pagination style="bottom: 10px; left: 4px" class="absolute" :page-size="form.pageSize" background layout="total, sizes, prev, pager, next" :small="true" @current-change="paginationChange" @update:page-size="pageSizeChange" :total="returnTotal"></el-pagination>
        </el-main>
    </el-container>

    <save-dialog ref="saveDialog" v-if="saveDialogStatus" @success="handlerSuccess" />
    <channel-dialog ref="channelDialog" v-if="channelDialogStatus" @success="handlerChannelSuccess" />
</template>
<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import SaveDialog from './save.vue'
import ChannelDialog from './channel.vue'
import logo from './logo.vue'
import DeviceMenu from './menu.vue'
export default {
    components: {
        SaveDialog, logo, DeviceMenu, ChannelDialog
    },
    data() {
        return {
            saveDialogStatus: false,
            channelDialogStatus: false,
            deleteStatus: false,
            form: {
                page: 1,
                pageSize: 10,
            },
            height: '100%',
            lineNum: 6,
            returnData: [],
            returnTotal: 0,
            platform: [],
        }
    },
    computed: {
        _height() {
            return Number(this.height) ? Number(this.height) + 'px' : this.height
        },
        _table_height() {
            return "calc(100% - 50px)"
        }
    },
    mounted() {
        this.registerManufacturer();
        this.form.devicePlatformId = ~~this.$route.params.devicePlatformId;
		if (!this.form.devicePlatformId || this.form.devicePlatformId === 'null') {
			delete this.form.devicePlatformId;
		}
        this.afterPropertiesSet();
    },

    methods: {
        seccendCopy(value) {
            const _this = this
            this.$copyText(value).then(
                function (e) {
                    _this.$message.success("复制成功!");
                },
                function (e) {
                    console.log("copy arguments e:", e);
                }
            );
        },
        async registerManufacturer(){
			const res = await this.$API.device.cloud.platform.list.get();
			if (res.code == '00000') {
				this.platform = res.data;
			} else {
				this.$message.error(res.msg)
			}
		},
        handlerSuccess() {
            this.afterPropertiesSet();
        },
        getAssetsImage(name) {
            return getAssetsImages(name);
        },
        //分页点击
        paginationChange(page) {
            this.form.page = page;
            this.afterPropertiesSet();
        },
        //条数变化
        pageSizeChange(size) {
            this.form.pageSize = size;
            this.afterPropertiesSet();
        },
        doChannel(item) {
            this.channelDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.channelDialog.open('add').setData(item, this.platform);
            });
        },
        doSave() {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('add').setData({}, this.platform);
            });
        },
        doDelete(item) {
            this.$API.device.device.delete.delete({ id: item.deviceId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.returnData = this.returnData.filter(it => it.deviceId != item.deviceId);
                this.returnTotal = this.returnData.length;
            })
        },
        doEdit(item) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('edit').setData(item, this.platform);
            });
        },
        doView(item) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('show').setData(item, this.platform);
            });
        },
        afterPropertiesSet() {
            this.$API.device.device.page.get(this.form).then(res => {
                if (res.code == '00000') {
                    this.returnData = res.data.data;
                    this.returnTotal = res.data.total;
                }
            })
        },
    }
}
</script>

<style scoped>
.task {
    /* height: 210px; */
    margin-left: 10px;
    margin-right: 10px;
    margin-top: 5px
}

.task-item h2 {
    font-size: 15px;
    color: #3c4a54;
    padding-bottom: 15px;
}

.task-item li {
    list-style-type: none;
    margin-bottom: 10px;
}

.task-item li h4 {
    font-size: 12px;
    font-weight: normal;
    color: #999;
}

.task-item li p {
    margin-top: 5px;
}

.task-item .bottom {
    border-top: 1px solid #EBEEF5;
    text-align: right;
    z-index: 9999;
    padding-top: 10px;
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.copy {
    margin-left:6px;
}
.task-add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    cursor: pointer;
    color: #999;
}

.task-add:hover {
    color: #409EFF;
}

.task-add i {
    font-size: 30px;
}

.task-add p {
    font-size: 12px;
    margin-top: 20px;
}

.dark .task-item .bottom {
    border-color: var(--el-border-color-light);
}

.progress {
    margin-top: -25px
}

.percentage-value {
    display: block;
    margin-top: 10px;
    font-size: 18px;
}

.percentage-label {
    display: block;
    margin-top: 10px;
    font-size: 12px;
}

.demo-progress .el-progress--line {
    margin-bottom: 15px;
    width: 350px;
}

.demo-progress .el-progress--circle {
    margin-right: 15px;
}</style>
