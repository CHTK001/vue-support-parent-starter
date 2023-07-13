<template>
    <el-container class="model">
        <el-aside class="model-image " style="min-width: 500px;width: 600px;">
            <div class="upload-image">
                <iframe class="dropzone" frameborder="0" scrolling="no" no-border :src="url"></iframe>
            </div>
        </el-aside>
        <drag-layout id="vertical-drag-bar-model"></drag-layout>
        <el-main class="model-image " style="min-width: 200px;">
            <div class="model-selector">
                <el-select v-model="modeMappingSelector" clearable filterable @change="changeModel" style="z-index: 20230713;">
                    <el-option :value="item.value" :label="item.label" v-for="item in modeMapping">
                        <span style="float: left">{{ item.value }}</span>
                        <span style=" float: right; color: var(--el-text-color-secondary); font-size: 13px;">{{item.label}}</span>
                    </el-option>
                </el-select>
            </div>
            <div class="result-image" ref="result-image">
                <canvas class="container"></canvas>
                <div :class="container"></div>
            </div>
        </el-main>
    </el-container>
</template>
    
<script>
import Constant from "@/config/common"
import DragLayout from "@/components/drag/DragLayout.vue";
import $ from 'jquery'
import URL1 from '@/config/url';
import { ElNotification } from "element-plus";
import request from '@/utils/request'
import {getRandomColor} from '@/utils/Utils'


export default {
    name: "Ocr",
    components: { DragLayout },
    data() {
        return {
            container: 'container-shadow',
            url: undefined,
            limit: 1,
            fileList: [],
            urlMapping: {},
            modeMapping: [],
            modeMappingSelector: "OCR",
            img: undefined,
            regResult: undefined,
            dropzone: undefined,
            dialogImageUrl: '',
            dialogVisible: !1,
            disabled: !1,
            viewUrl: undefined,
            canvasSelect: null,

        }
    },
    watch: {
        modeMappingSelector: {
            handler(newValue, oldValue) {
                this.url = 'src/html/uploader.html?url=' + Constant.PREFIX + this.urlMapping[this.modeMappingSelector]
            },
            immediate: true
        },
        urlMapping: {
            handler(newValue, oldValue) {
                this.url = 'src/html/uploader.html?url=' + Constant.PREFIX + this.urlMapping[this.modeMappingSelector]
            },
            deep: true,
            immediate: true
        }
    },
    methods: {
        changeModel: function(){
            if (null != this.canvasSelect) {
                this.canvasSelect.destroy();
            }
            this.container = 'container-shadow';
        },
        initial: function(){
            request.patch(URL1.CONFIG).then(({data}) => {
                if(data.code !== '00000') {
                    ElNotification({
                        type: 'error',
                        title: '提示',
                        message: '系统初始化失败'
                    })
                    return false;
                }
                ElNotification({
                    type: 'success',
                    title: '提示',
                    message: '系统初始化成功'
                });
                const data1 = data.data.model;
                data1.forEach(item => {
                    this.urlMapping[item.value] = item.type;
                    this.modeMapping.push(item);
                })
                return false;
            })
        },
        load: function () {
            if (null != this.canvasSelect) {
                this.canvasSelect.destroy();
            }
            this.canvasSelect = new CanvasSelect('.container');
            this.canvasSelect.setImage(this.viewUrl);
            this.canvasSelect.labelMaxLen = 255;
            this.container = 'container-shadow container-animation'

        },
        marker: function () {
            const option = [];
            const img1 = this.img;
            const width = img1.width;
            const height = img1.height;

            for (const item of this.regResult) {
                const coor1 = [];
                const color = getRandomColor();
                const it = item.boundingBox.corners[0];
                coor1.push([it.x * width + item.boundingBox.width * width, it.y * height + item.boundingBox.height * height]);
                coor1.push([it.x * width, it.y * height]);
                option.push({
                    strokeStyle: color,
                    activeFillStyle: color,	
                    activeStrokeStyle: color,	
                    labelFillStyle: color,
                    textFillStyle: "#fff",
                    label: item.text,
                    coor: coor1, // required
                    type: 1 // required
                })
            }
            this.canvasSelect.setData(option);
        }
    },
    mounted() {
        this.initial();
        window.addEventListener('message', (eve) => {
            console.log(eve)
            const data = eve.data;
            if (data.cmd === 'error') {
                ElNotification({
                    type: 'error',
                    message: data.source.msg,
                    title: '提示'
                })
            }
            if (data.cmd === 'file') {
                for (const item of Object.keys(data.source)) {
                    this.fileList.length = 0;
                    this.fileList.push(data.source[item]);
                    this.img = new Image();
                    this.img.src = URL.createObjectURL(this.fileList[0].file);
                    this.viewUrl = this.img.src;
                    this.load();
                }
                return;
            }

            if (data.cmd === 'result') {
                this.regResult = data.source;
                const _this = this;
                setTimeout(() => {
                    _this.container = 'container-shadow'
                }, 1500);
                
                if(this.regResult.length) {
                    this.marker();
                } else {
                    ElNotification({
                        type: 'success',
                        title: '提示',
                        message: '未检测到模型数据'
                    })
                }
            }
        })
    }
}
</script>
    
<style scoped lang="less">
.dropzone {
    height: 90vh;
    width: 100%;
    border: 1px dashed #ccc;
}

.dz-image-preview {
    height: 90vh;
    width: 100%;
}

.model {
    height: 100vh;

    .model-image {
        height: 100vh;
        width: calc(50% - 5px);
        overflow: hidden;
    }
}
.model-selector {
    position: fixed;
    right: 0;
    top: 0;
}
.result-image {
    position: relative;
    height: 90vh;
}
.container-shadow {
    top:0;
    left: 0;
    position: absolute;
    z-index: -1;
    height: 100%;
    width: 100%;
}
.container-animation {
    background: 
	linear-gradient(#1a98ca, #1a98ca),
	linear-gradient(90deg, #ffffff33 1px,transparent 0,transparent 19px),
	linear-gradient( #ffffff33 1px,transparent 0,transparent 19px),
	linear-gradient(transparent, #1a98ca);
	background-size:100% 1.5%, 10% 100%,100% 8%, 100% 100%;
	background-repeat:no-repeat, repeat, repeat, no-repeat;
	background-position: 0% 0%, 0 0, 0 0, 0 0;
	/* 初始位置 */
	clip-path: polygon(0% 0%, 100% 0%, 100% 1.5%, 0% 1.5%);
	/* 添加动画效果 */
	animation: move 2s infinite linear;
    z-index: 999 !important;
}
.container {
    height: 90vh;
    width: 80%;
}
@keyframes move{
	to{
		background-position: 0 100%,0 0, 0 0, 0 0;
		/* 终止位置 */
		clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
	}
}

/deep/ .el-upload-list {
    width: 100%;
}

/deep/ .el-upload,
/deep/.el-upload-dragger {
    height: 90vh;
    width: 100%;
}

#upload {
    height: 90vh;
}

.el-icon--upload,
.upload__tip {
    font-size: 28px;
    color: #8c939d;
    text-align: center;
    height: 40px;
}
</style>