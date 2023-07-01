<template>
    <div class="page-tabs-index">
        <div class="panel layout-panel layout-panel-north layout-split-north">
            <div data-options="region: 'north',split: true, border: false"
                class="panel-body panel-body-noheader panel-body-noborder layout-body">
                <div id="operator2" class="panel-header panel-header-noborder"
                    style="height:auto; border-left: solid 1px #ddd; border-right: solid 1px #ddd">
                    <div>
                        <a href="javascript:void(0)" class="easyui-linkbutton l-btn l-btn-small l-btn-plain"
                            iconcls="icon-standard-arrow-refresh" id="refreshButton" @click="doSearch()"><span
                                class="l-btn-left l-btn-icon-left"><span class="l-btn-text">刷新</span><span
                                    class="l-btn-icon icon-standard-arrow-refresh">&nbsp;</span></span></a>
                        <span class="toolbar-item dialog-tool-separator"></span>

                        <a href="javascript:void(0)" id="newQueryButton"
                            class="easyui-linkbutton l-btn l-btn-small l-btn-plain" iconcls="icon-standard-add"
                            @click="addData();" title="添加数据"><span class="l-btn-left l-btn-icon-left"><span
                                    class="l-btn-text">添加数据</span><span
                                    class="l-btn-icon icon-standard-add">&nbsp;</span></span></a>
                        <span class="toolbar-item dialog-tool-separator"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="page-tabs-body">
        <el-skeleton :loading="load" :count="2" animated>
            <template #template>
                <div style="display: flex; ">
                    <div v-for="it in 4" style="flex: 1">
                        <el-skeleton-item variant="image" style="width: 80%; height: 240px" />
                        <div style="padding: 14px; width: 70%;">
                            <el-skeleton-item variant="p" style="width: 50%" />
                            <div style=" display: flex;  align-items: center; justify-items: space-between; ">
                                <el-skeleton-item variant="text" style="margin-right: 16px" />
                                <el-skeleton-item variant="text" style="width: 100%" />
                            </div>
                        </div>
                    </div>
                </div>
            </template>

            <div class="labroom-level-item labroom-level-poor">
                <div class="labroom-level-box">
                    <div class="labroom-level-box-course" v-for="(item,index) in ossData">
                        <div class="labroom-level-box-course2">
                            <div style="height: 200px">
                                <el-image v-if="item.type === 'image'"
                                style="width: 100%; height: 200px;  "
                                :src="prefix + '/' + base.ossBucket + '/' + item.name"
                                fit="cover"
                                />
                            </div>
                            <span class="course-name">{{item.lastModified ? item.lastModified.replaceAll('T', ' ') : item.lastModified}}</span>
                            <span class="course-completepr"></span>
                        </div>
                    </div>
                </div>
            </div>
            <!-- <div class="labroom-level-item labroom-level-poor">
                <div class="labroom-level-box">
                    <el-card class="labroom-level-box-course1" v-for="(item,index) in ossData">
                        <div class="labroom-level-box-course2">
                            <div style="height: 200px">
                                <el-image v-if="item.type === 'image'"
                                style="width: 100%; height: 200px;  "
                                :src="prefix + '/' + base.ossBucket + '/' + item.name"
                                :zoom-rate="1.2"
                                :initial-index="4"
                                fit="cover"
                                />
                            </div>
                            <span class="course-name">{{item.lastModified ? item.lastModified.replaceAll('T', ' ') : item.lastModified}}</span>
                            <span class="course-completepr"></span>
                        </div>
                    </el-card> 
                </div>
            </div> -->
            <el-pagination
                :small="small"
                v-model:current-page="base.pageNum"
                v-model:page-size="base.pageSize"
                layout="->, total, prev, pager, next"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
                :total="total"
                />
        </el-skeleton>
    </div>
</template>
<script>
import request from '@/utils/request'
import '@/style/easy.css';
import '@/plugins/layx/layx.min.css'
import '@/assets/icons/icon-berlin.css'
import '@/assets/icons/icon-hamburg.css'
import '@/assets/icons/icon-standard.css'
import { Delete, Edit, Upload, PictureFilled } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import config from "@/config/common"
import URL from '@/config/oss-url'
import { sformat, getQueryString } from '@/utils/Utils';

export default {
    name: "oss-view",
    data() {
        return {
            base: {
                ossId: undefined,
                ossBucket: undefined,
                name: '',
                pageNum: 1,
                pageSize: 20
            },
            total:0,
            prefix: URL.OSS_PREFIX,
            ossData: [],
            load: true
        }
    },
    methods: {
        doSearch: function () {
            this.load = true;
            request.get(URL.LIST_OBJECT, {
                params: this.base
            }).then(({data}) => {
                if(data.code !== '00000') {
                    layx.notice({
                        title: '提示',
                        type: 'error',
                        message: data.msg
                    });
                    return !0;
                }
                this.total = data.data.total;
                this.ossData.length = 0;
                this.ossData = data.data.data;
            }).catch(data => {
                layx.notice({
                    title: '提示',
                    type: 'error',
                    message: '加载失败, 请联系管理员'
                });
            }).finally(() =>this.load = false);
        },
        handleSizeChange: function (e) {
            this.base.pageSize = e;
            this.doSearch();
            return !1;
        },
        handleCurrentChange: function (e) {
            this.base.pageNum = e;
            this.doSearch();
            return !1;
        }
    },
    mounted() {
        this.base.ossId = getQueryString('ossId');
        this.base.ossBucket = getQueryString('ossBucket');
        document.title = '文件预览(' + this.base.ossBucket + ")";
        setTimeout(() => {
            this.doSearch();
        }, 500);
    }
}
</script>
<style scoped lang="less">
@media screen and (min-width:100px) {
    .menuItem {
        width: 25%;
        margin-bottom: 20px;
    }
}
@media screen and (min-width:1366px) {
    .menuItem {
        width: 20%;
        margin-bottom: 20px;
    }
}
@media screen and (min-width:1799px) {
    .menuItem {
        width: 16.66%;
        margin-bottom: 20px;
    }
}
el-card {
    padding: 0 !important;
}
.labroom-level-item {
    
    margin-top: 20px;
    .labroom-level-title {
        background: #F5F9FF;
        height: 45px;
        line-height: 45px;
        padding: 0 20px;
        font-size: 16px;
        font-family: MicrosoftYaHei-, MicrosoftYaHei;
        font-weight: normal;
    }
    .labroom-level-box {
        border: 1px solid #EAEEF0;
        border-top: none;
        padding-top: 10px;
        padding-bottom: 20px;
        min-height: 20px;
        display: flex;
        flex-wrap: wrap;
        padding-left: 13px;
        padding-right: 13px;
    }
    .labroom-level-box-course1 {
        width: 10%;
    }
    .labroom-level-box-course {
        width: 10%;
        margin-top: 10px;
        .labroom-level-box-course2 {
            margin: 10px;
            border-radius: 10px;
            box-shadow: 5px 6px 9px 1px #ccc;
        }
        .course-name {
            color: #333339;
            font-size: 14px;
            text-align: center;
            padding-top: 10px;
            padding-bottom: 10px;
            width: 100%;
            display: inline-block;
            font-family: MicrosoftYaHei-, MicrosoftYaHei;
        }
    }
}
.labroom-level-excellent {
    color: #3E91F7;
    .labroom-level-title {
        background: #F5F9FF;
    }
}
.course-name {
    color: #333339;
    font-size: 14px;
    text-align: center;
    width: 100%;
    display: inline-block;
    font-family: MicrosoftYaHei-, MicrosoftYaHei;
}
.labroom-level-middle {
    color: #F19537;
    .labroom-level-title {
        background: #FFF9F0;
    }
}
.labroom-level-poor {
    color: #E57470;
    .labroom-level-title {
        background: #FFF4F4;
    }
}
.page-tabs-index {
    height: 40px;
}

.page-tabs-body {
    height: calc(100vh - 40px);
}
</style>