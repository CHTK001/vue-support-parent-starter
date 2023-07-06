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

                        <el-select v-model="module" value-key="" placeholder="" clearable @change="moduleChange">
                            <el-option value="large" label="缩略模式" />
                            <el-option value="small" label="小图模式" />
                        </el-select>
                        
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="page-tabs-breadcrumb">
        <div class="span" aria-label="A complete example of page header">
            <el-breadcrumb separator="/">
                <el-breadcrumb-item :to="item.to" v-for="item in breadcrumb">
                    <a @click.prevent="onLinkClick(item)">{{ item.name }}</a>
                </el-breadcrumb-item>
            </el-breadcrumb>
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
                    <div class="labroom-level-box-course silk-ribbon" :style="moduleParent2Style" v-for="(item,index) in ossData">
                        <div class="labroom-level-box-course2">
                            <div :style="moduleParentStyle" :title="item.name">
                                <oss-view-layout 
                                    :item="item" 
                                    :ossBucket="base.ossBucket"  
                                    :ossId="base.ossId" 
                                    :moduleStyle="moduleStyle"
                                    :fromPath="base.fromPath"
                                    :breadcrumb="breadcrumb"
                                    :doSearch="doSearch"
                                >

                                </oss-view-layout>
                            </div>
                            <!-- <el-tag effect="light" class="course-name1 top-20" type="success">{{ item.type  }}/{{ item.subtype }}</el-tag> -->
                            <el-tag effect="light" type="info" class="course-name">{{item.lastModified ? item.lastModified.replaceAll('T', ' ') : item.lastModified}}</el-tag>
                            <el-tag effect="light" type="info" class="course-name top-right" :title="item.name"  v-if="module === 'large'">{{item.name}}</el-tag>
                            <span class="course-completepr"></span>
                        </div>
                    </div>
                    <i :style="moduleParent2Style" v-for="item in signNum" />

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
import { defineComponent } from 'vue'
import request from '@/utils/request'
import '@/style/easy.css';
import '@/style/silk.css';
import '@/plugins/layx/layx.min.css'
import '@/assets/icons/icon-berlin.css'
import '@/assets/icons/icon-hamburg.css'
import '@/assets/icons/icon-standard.css'
import URL from '@/config/oss-url'

import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import OssViewLayout from '@/components/oss/OssViewLayout.vue'
import {_} from 'lodash'

export default defineComponent({
    name: "OssView",
    components: {
        OssViewLayout
    },
    data() {
        return {
            breadcrumb: [],
            module: 'small',
            signNum: 12,
            moduleStyle: {},
            moduleParentStyle: {},
            moduleParent2Style: {},
            videoOptions: {},
            paths: [],
            currentPath: '',
            parentCurrentPath: "",
           
            base: {
                fromPath: undefined,
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
        onLinkClick: function(args) {
            this.base.name = args.to.query.name;
            let index1 = 0;
            this.newBreadcrumb = [];
            this.breadcrumb.forEach((it, i) => {
                if(it.to.query.name === args.to.query.name) {
                    index1 = i;
                    return false;
                }
            });
            this.breadcrumb.forEach((it, i) => {
                if(i <= index1) {
                    this.newBreadcrumb.push(it);
                }
            });
            this.breadcrumb.length;
            this.breadcrumb = this.newBreadcrumb;
            this.doSearch();
        },
        onBack : function(args) {
            this.breadcrumb = this.breadcrumb.filter((it, i) => i < this.breadcrumb.length - 1);
            this.base.name = this.breadcrumb[this.breadcrumb.length - 1].to.query.name;
            this.doSearch();
        },
        moduleChange: function(v) {
            localStorage.setItem("layout", v);
            if('large' === v) {
                this.moduleStyle = {width: '100%', position: 'absolute', left: '0%', top: '20px', 'max-height': '150px'};
                this.moduleParentStyle = {height: '200px', position: 'relative'};
                this.moduleParent2Style = {width: '10% !important', 'min-width': '150px'}
                this.ssignNum = 10;
            } else {
                this.moduleStyle = {width: '80%', position: 'absolute', left: '10%', top: '10px', 'max-height': '100px'};
                this.moduleParentStyle = {height: '150px', position: 'relative'};
                this.moduleParent2Style = {width: '8% !important', 'min-width': '100px'}
                this.ssignNum = 12;
            }
        },
        getVideoOptions: function(row) {
            const t = _.cloneDeep(this.playerOptions);
            t.sources = [{
                type: row.type + "/" + row.subtype,
                src: this.prefix + '/' + this.base.ossBucket + '/' + row.name
            }];
            return t;
        },
     
        intoFolder: function(data, row) {
            this.base.name = row.name;
            this.currentPath = row.name;
            this.base.fromPath = this.currentPath;
            this.base.pageNum = 1;
            this.paths.push(row.name);
            const param = { to: { path: 'oss-view', query: { name: row.id, ossId: this.base.ossId, ossBucket: this.base.ossBucket }}, name: row.name };
            this.breadcrumb.push(param)
            this.onLinkClick(param)
        },
       
        doSearch: function (param) {
            this.load = true;
            return request.get(URL.LIST_OBJECT, {
                params: param|| this.base
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
                (this.ossData === undefined || this.ossData === null) ? this.ossData = [] : this.ossData.length = 0;
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
        this.moduleChange(localStorage.getItem("layout") || this.module);
        this.base.ossId = getQueryString('ossId');
        this.base.ossBucket = getQueryString('ossBucket');
        this.base.name = getQueryString("name");
        this.breadcrumb.push({
            to: {path: 'oss-view', query: { name: '', ossId: this.base.ossId, ossBucket: this.base.ossBucket }},
            name: '首页'
        })
        if(this.base.name) {
            const arr = this.base.name.split('/');
            for(const index in arr) {
                if(~~index <= 0) {
                    continue
                }
                const sublist = arr.slice(0, ~~index + 1);
                this.breadcrumb.push({
                    to: {path: 'oss-view', query: { name: sublist.join('/'), ossId: this.base.ossId, ossBucket: this.base.ossBucket }},
                    name: sublist[sublist.length - 1]
                })
            }
        }
        document.title = '文件预览(' + this.base.ossBucket + ")";
        setTimeout(() => {
            this.doSearch();
        }, 500);
    }
})
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
   
    .labroom-level-box > i {
        width: 10%;
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
        align-items: center;
        justify-content: center;
        gap: 0;
    }
    .labroom-level-box-course1 {
        width: 10%;
    }
    .labroom-level-box-course {
        width: 10%;
        margin-top: 10px;
        cursor: pointer;
        .labroom-level-box-course2 {
            position: relative;
            margin: 10px;
            border-radius: 10px;
            box-shadow: 5px 6px 9px 1px #ccc;
            .el-image__inner {
                position: absolute;
                left: 50%;
                top: 50%;
            }
        }
        .top-right {
            position: absolute;
            top: 0;
            right: 0;
            max-width: 160px !important;
        }
        .course-name1 {
            max-width: 200px;
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            position: absolute;
            right: 0;
            bottom: 20px !important;
        }
        .course-name {
            max-width: 200px;
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            position: absolute;
            bottom: 0;
            right: 0;
            color: #333339;
            font-size: 8px;
            text-align: center;
            padding-top: 5px;
            padding-bottom: 5px;
            padding-right: 4px;
            padding-left: 4px;
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
    height: calc(100vh - 90px);
}
.page-tabs-breadcrumb{
    margin-top: 10px;
    height: 20px;
    line-height: 20px;
    .span {
        font-size: 12px;
    }

}
</style>