<template>
    <el-container style="background-color: #ccc; position: relative;">
        <el-header>
            <div class="left-panel">
            </div>
            <div class="right-panel">
                <el-select v-model="form.devicePlatformId" >
                  <el-option key="" label="全部" ></el-option>
                  <el-option v-for="item in platform" :key="item.devicePlatformId" :label="item.devicePlatformName" :value="item.devicePlatformId" ></el-option>
                </el-select>
                <el-button type="primary" icon="el-icon-search" @click="afterPropertiesSet"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <div ref="table" :style="{ 'height': _table_height, 'background': 'rgb(226 232 240 / 30%)' }">
                <el-row>
                    <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in returnData" :key="item.taskId"
                        class="demo-progress">
                        <el-card class="task task-item shadow-lg" shadow="hover">
                            <h2 >
                                <span>{{ item.devicePlatformName }}</span>
                                <el-icon class="text-blue-500" style="margin-top:2px; margin-left:8px; " v-if="item.existImplInterface" :title="item.existImplInterface ? '支持云服务' : '暂不支持云服务'">
                                    <el-icon>
                                        <component is="sc-icon-cloud-service" />
                                    </el-icon>
                                </el-icon>
                                <el-tag type="info" v-else>暂不支持云服务</el-tag>
                            </h2>
                            <el-row  @click.prevent="doView(item)">
                                <el-col :span="16">
                                    <ul>
                                        <li>
                                            <h4>云平台编码</h4>
                                            <p>{{ item.devicePlatformCode }}</p>
                                        </li>
                                        <li>
                                            <h4>官网</h4>
                                            <a class="text-sky-700" :href="item.devicePlatformApiAddress" target="_blank">{{
                                                item.devicePlatformApiAddress }} </a>
                                        </li>
                                    </ul>
                                </el-col>
                                <el-col :span="8" class="progress">
                                    <el-image class="object-none md:object-center bg-yellow-300"
                                        :src="getAssetsImage('product.66c3c4d5.png')" fit="fill" :lazy="true"></el-image>
                                </el-col>
                            </el-row>
                            <div class="bottom">
                                <div class="state">
                                </div>
                                <div class="handler">
                                    <el-dropdown trigger="click">
                                        <el-button type="primary" icon="el-icon-more" circle plain></el-button>
                                        <template #dropdown>
                                            <el-dropdown-menu>
                                                <el-dropdown-item @click="doEdit(item)">编辑</el-dropdown-item>
                                                <el-dropdown-item @click="doService(item)">服务</el-dropdown-item>
                                                <el-dropdown-item @click="doDelete(item)" divided>删除</el-dropdown-item>
                                            </el-dropdown-menu>
                                        </template>
                                    </el-dropdown>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                        <el-card class="task task-add" shadow="never" @click="doSave">
                            <el-icon><el-icon-plus /></el-icon>
                            <p>添加计划任务</p>
                        </el-card>
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
            this.$API.device.cloud.connector.page.get(this.form).then(res => {
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
