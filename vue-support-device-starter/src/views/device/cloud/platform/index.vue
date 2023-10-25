<template>
    <el-container style="background-color: #ccc; position: relative;">
        <el-header>
            <div class="left-panel">
                <el-button type="primary" icon="el-icon-refresh" @click="afterPropertiesSet"></el-button>
            </div>
            <div class="right-panel">

            </div>
        </el-header>
        <el-main class="nopadding">
            <div ref="table" :style="{ 'height': _table_height, 'background': 'rgb(226 232 240 / 30%)' }">
                <el-row>
                    <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in returnData" :key="item.taskId" class="demo-progress">
                        <div style="margin: 10px" class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl task-item shadow-lg ">
                            <div class="md:flex">
                                <div class="md:flex-shrink-0">
                                    <img class="h-48 w-full object-cover md:h-full md:w-48" :src="getAssetsImage('product.66c3c4d5.png')" >
                                </div>
                                <div class="pr-8 pl-8 pt-8"  style="width: 100%;">
                                    <el-col :span="24">
                                    <ul>
                                        <li>
                                            <span>{{ item.devicePlatformName }}</span>
                                            <el-icon class="text-blue-500" style="margin-top:2px; margin-left:8px; " v-if="item.existImplInterface" :title="item.existImplInterface ? '支持云服务' : '暂不支持云服务'">
                                                <el-icon>
                                                    <component is="sc-icon-cloud-service" />
                                                </el-icon>
                                            </el-icon>
                                            <el-tag type="info" v-else>暂不支持云服务</el-tag>
                                        </li>
                                        <li>
                                            <h4>云平台编码</h4>
                                            <p>{{ item.devicePlatformCode }}</p>    
                                        </li>
                                        <li>
                                            <a class="text-sky-700" :href="item.devicePlatformAddress" target="_blank">官网 </a>
                                        </li>
                                        <li>
                                            <el-divider></el-divider>
                                            <el-button type="primary" size="small" icon="el-icon-edit" text plain @click="doEdit(item)" title="编辑"></el-button>
                                            <el-button type="primary" size="small" icon="sc-icon-cloud-service" text plain @click="doService(item)" titke="云服务"></el-button>
                                            <el-button type="primary" size="small" icon="el-icon-delete" text plain @click="doDelete(item)" title="删除"></el-button>
                                        </li>
                                    </ul>
                                </el-col>
                                </div>
                            </div>
                        </div>
                    </el-col>
                    <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                        <div style="margin: 10px; height: 205px" class="cursor-pointer relative max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl task-item shadow-lg " @click="doSave">
                            <div class="absolute" style="left: 45%; top: 40%; width: 80px; height: 80px; font-size: 30px;">
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
</template>
<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import SaveDialog from './save.vue'
export default {
    components: {
        SaveDialog
    },
    data() {
        return {
            saveDialogStatus: false,
            deleteStatus: false,
            form: {
                page: 1,
                pageSize: 10,
            },
            height: '100%',
            lineNum: 6,
            returnData: [],
            returnTotal: 0,
            apiObj: this.$API.device.cloud.platform.page
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
        this.afterPropertiesSet();
    },

    methods: {
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
        doSave() {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('add').setData({});
            });
        },
        doDelete(item) {
            this.$API.device.cloud.platform.delete.delete({ id: item.devicePlatformId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.returnData = this.returnData.filter(it => it.devicePlatformId != item.devicePlatformId);
                this.returnTotal = this.returnData.length;
            })
        },
        doService(item) {
            this.$router.push({ path: `/device/cloud/service/${item.devicePlatformId}` })
        },
        doEdit(item) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('edit').setData(item);
            });
        },
        doView(item) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('show').setData(item);
            });
        },
        afterPropertiesSet() {
            this.apiObj.get(this.form).then(res => {
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
    height: 210px;
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
    display: flex;
    justify-content: space-between;
    align-items: center;
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
