<template>
    <div>
        <div v-if="!item.file">
            <el-image @click="intoFolder(images.folder, item)" :style="moduleStyle" :src="getImg('folder')" fit="cover" />
        </div>
        <div v-else>
            <div v-if="item.type === 'image'" v-contextmenu:contextmenu>
                <el-image @click="showImagesInViewer(prefix + ossBucket + item.id, item)" :style="moduleStyle"
                    :src="prefix + ossBucket + item.id" fit="cover" />
            </div>

            <div v-else-if="item.type === 'video'">
                <video class="video-player vjs-custom-skin" ref="videoPlayer" :style="moduleStyle"
                    :src="prefix +ossBucket + item.id" controls :loop="true" :volume="0.6" :playsinline="true">
                    <source src="movie.ogg" type="video/ogg">
                    <source src="movie.mp4" type="video/mp4">
                    您的浏览器不支持此种视频格式。
                </video>
            </div>

            <div v-else v-contextmenu:contextmenu>
                <el-image @click="showImagesInViewer(images[item.subtype], item)" :style="moduleStyle"
                    :src="getImg(item.subtype, item.name)" />
            </div>
        </div>
    </div>

    <!-- 右键菜单部分 -->
    <v-contextmenu ref="contextmenu">
        <v-contextmenu-item>
            <span @click="copyObject">
                <span class="l-btn-left l-btn-icon-left">
                    <span class="l-btn-text">复制</span>
                    <span class="l-btn-icon icon-standard-page-copy">&nbsp;</span>
                </span>
            </span>
        </v-contextmenu-item>
        <v-contextmenu-item>
            <span @click="copyObjectBase64">
                <span class="l-btn-left l-btn-icon-left">
                    <span class="l-btn-text">复制Base</span>
                    <span class="l-btn-icon icon-standard-page-copy">&nbsp;</span>
                </span>
            </span>
        </v-contextmenu-item>
        <v-contextmenu-item divider />
        <v-contextmenu-item>
            <span @click="deleleObjects">
                <span class="l-btn-left l-btn-icon-left">
                    <span class="l-btn-text">删除</span>
                    <span class="l-btn-icon icon-standard-bin-closed">&nbsp;</span>
                </span>
            </span>
        </v-contextmenu-item>
        <v-contextmenu-item divider />
        <v-contextmenu-item>
            <span @click="downloadObjects">
                <span class="l-btn-left l-btn-icon-left">
                    <span class="l-btn-text">下载</span>
                    <span class="l-btn-icon icon-standard-arrow-down">&nbsp;</span>
                </span>
            </span>
        </v-contextmenu-item>
    </v-contextmenu>
</template>
<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
import { openView } from '@/view/subview/view'
import { api as viewerApi } from "v-viewer"
import 'video.js/dist/video-js.css'
import URL from '@/config/oss-url'
import { _ } from 'lodash'
import { directive, Contextmenu, ContextmenuItem } from "v-contextmenu";
import { ElMessageBox, ElNotification } from "element-plus";

import "v-contextmenu/dist/themes/default.css";
import '@/assets/icons/icon-berlin.css'
import '@/assets/icons/icon-hamburg.css'
import '@/assets/icons/icon-standard.css'
import request from '@/utils/request'
import {Base64} from 'js-base64'

export default {
    name: 'OssViewLayout',
    directives: {
        contextmenu: directive,
    },

    components: {
        [Contextmenu.name]: Contextmenu,
        [ContextmenuItem.name]: ContextmenuItem,
    },
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
    data() {
        return {
            paths: [],
            rightClickItem: '',
            visible: false, // 是否展示右键菜单
            top: 0,
            left: 0,
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
    watch: {
        // 监听 visible，来触发关闭右键菜单，调用关闭菜单的方法
        visible(value) {
            if (value) {
                document.body.addEventListener('click', this.closeMenu)
            } else {
                document.body.removeEventListener('click', this.closeMenu)
            }
        }
    },
    methods: {
        downloadObjects: function () {
            window.open(this.prefix + this.ossBucket + this.item.id + '?mode=DOWNLOAD', '_blank');
        },
        copyObject: function () {
            this.$copyText(this.prefix + this.ossBucket + this.item.id + '?mode=DOWNLOAD').then(
                e => {
                    this.$notify.success({
                        title: '消息提示',
                        message: '复制成功'
                    });
                },
                e => {
                    this.$notify.error({
                        title: '消息提示',
                        message: '复制失败'
                    });
                }
            )
        },
        copyObjectBase64: function () {
            this.$copyText(Base64.encode(window.location.origin +  this.prefix + this.ossBucket + this.item.id)).then(
                e => {
                    this.$notify.success({
                        title: '消息提示',
                        message: '复制成功'
                    });
                },
                e => {
                    this.$notify.error({
                        title: '消息提示',
                        message: '复制失败'
                    });
                }
            )
        },
        deleleObjects: function () {
            ElMessageBox.confirm(
                '确定要删除 ' + this.item.name + ' ?',
                'Warning', {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning',
            }
            ).then(() => {
                request.get(URL.DELETE_OBJECT, {
                    params: {
                        ossId: this.ossId,
                        ossBucket: this.ossBucket,
                        id: this.item.id,
                        name: this.item.name
                    }
                }).then(({ data }) => {
                    if (data.code === '00000') {
                        this.doSearch();
                    }
                    ElNotification({
                        title: '消息提示',
                        type: data.code === '00000' ? 'success' : 'error',
                        message: data.msg,

                    });
                });
            }).catch((e) => {
                ElNotification({
                    title: '消息提示',
                    type: 'error',
                    message: "操作失败",

                });
            })
        },
        // 打开右键菜单
        openMenu(e, item) {
            this.visible = true;
            this.top = e.pageY;
            this.left = e.pageX;
            this.rightClickItem = item;
        },
        // 关闭右键菜单
        closeMenu() {
            this.visible = false;
        },
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
        intoFolder: function (data, row) {
            this.base.name = row.name;
            this.currentPath = row.name;
            this.base.pageNum = 1;
            this.paths.push(row.name);
            const param = { to: { path: window.location.pathname, query: { name: row.id, ossId: this.ossId, ossBucket: this.ossBucket, fromPath: this.fromPath, id: this.fromPath } }, name: row.name };
            this.onLinkClick(param)
        },
        onLinkClick: function (args) {
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
                    if (it.to.query.name === args.to.query.name) {
                        index1 = i;
                        return false;
                    }
                });
                _this.breadcrumb.forEach((it, i) => {
                    if (i <= index1) {
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

    .labroom-level-box>i {
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

.page-tabs-breadcrumb {
    margin-top: 10px;
    height: 20px;
    line-height: 20px;

    .span {
        font-size: 12px;
    }

}

.contextmenu {
    margin: 0;
    background: #fff;
    z-index: 3000;
    position: absolute;
    list-style-type: none;
    padding: 5px 0;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 400;
    color: #333;
    box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
}

.contextmenu li {
    margin: 0;
    padding: 7px 16px;
    cursor: pointer;
}

.contextmenu li:hover {
    background: #eee;
}
</style>