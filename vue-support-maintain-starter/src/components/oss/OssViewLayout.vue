<template>
    <div>
        <div v-if="!item.file">
            <el-image @click="intoFolder(images.folder, item)" :style="moduleStyle" :src="getImg('folder')" fit="cover" />
        </div>
        <div v-else>
            <div v-if="item.type === 'image'">
                <el-image @click="showImagesInViewer(prefix + '/' + ossBucket + '/' + item.id, item)"
                    :style="moduleStyle" :src="prefix + '/' + ossBucket + '/' + item.id" fit="cover" />
            </div>

            <div v-else-if="item.type === 'video'">
                <video-player class="video-player vjs-custom-skin" ref="videoPlayer" :style="moduleStyle"
                    :src="prefix + '/' + ossBucket + '/' + item.id" controls :loop="true" :volume="0.6"
                    :playsinline="true">
                </video-player>
            </div>

            <div v-else>
                <el-image @click="showImagesInViewer(images[item.subtype], item)" :style="moduleStyle"
                    :src="getImg(item.subtype, item.name)" />
            </div>
        </div>
    </div>
</template>
<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import { openView } from '@/view/subview/view'
import { api as viewerApi } from "v-viewer"
import 'video.js/dist/video-js.css'
import URL from '@/config/oss-url'
import {_} from 'lodash'

export default {
    name: 'OssViewLayout',
    props: {
        moduleStyle: Object,
        item: Object,
        ossBucket: String,
        fromPath: String,
        ossId: String,
        path: String,
        breadcrumb: Array,
        doSearch: Function
    },
    data(){
        return {
            paths: [],
            base: {
                name: '',
                path: '',
                pageNum: 1,
                pageSize: 20
            },
            newBreadcrumb: [],
            ossData: [],
            prefix: URL.OSS_PREFIX,
            images: {
                folder: getAssetsImages('folder.png')
            },
        }
    },
    methods: {
        getImg: function (data, name) {
            if (!!name && name.lastIndexOf(".") > -1) {
                const suffix = name.substr(name.lastIndexOf(".") + 1);
                const fileIcon = getAssetsImages(data + "." + suffix);
                if (fileIcon && !fileIcon.endsWith('undefined')) {
                    return fileIcon;
                }
            }
            const fileIcon = getAssetsImages(data + ".png");
            return (fileIcon && !fileIcon.endsWith('undefined')) ? fileIcon : getAssetsImages("unknown.png");
        },
        showImagesInViewer: function (url, row) {
            if (row.type === 'image') {
                const imgs = [url];
                viewerApi({ images: imgs })
                return false;
            }
            openView(row, this)

        },
        intoFolder: function(data, row) {
            this.base.name = row.name;
            this.currentPath = row.name;
            this.base.pageNum = 1;
            this.paths.push(row.name);
            const param = { to: { path: window.location.pathname, query: { name: row.id, ossId: this.ossId, ossBucket: this.ossBucket, fromPath: this.fromPath, id: this.fromPath }}, name: row.name };
            this.onLinkClick(param)
        },
        onLinkClick: function(args) {
            this.base.name = args.to.query.name;
            let index1 = 0;
            const _this = this;
            const param1 = _.cloneDeep(this.base);
            param1.ossId = this.ossId;
            param1.ossBucket = this.ossBucket;
            param1.fromPath = this.fromPath;
            param1.path = this.path;
            this.doSearch(param1).finally(() => {
                _this.breadcrumb.push(args)
                _this.newBreadcrumb = [];
                _this.breadcrumb.forEach((it, i) => {
                    if(it.to.query.name === args.to.query.name) {
                        index1 = i;
                        return false;
                    }
                });
                _this.breadcrumb.forEach((it, i) => {
                    if(i <= index1) {
                        _this.newBreadcrumb.push(it);
                    }
                });
                _this.breadcrumb.length = 0;
                _this.newBreadcrumb.forEach(it => {
                    _this.breadcrumb.push(it);
                })
            })
           
        },
    },
    mounted() {
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