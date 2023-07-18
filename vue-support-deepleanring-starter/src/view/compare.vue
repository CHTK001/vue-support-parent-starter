<template>
    <div class="model">
        <div class="model-image " style="min-width: 500px;">
            <div class="upload-image">
                <iframe v-if="modeMappingSelector != 'TEXT'" class="dropzone" frameborder="0" scrolling="no" no-border :src="url1"></iframe>
                <el-input class="upload-text" :rows="20" v-else v-model="text1" placeholder="" size="normal" clearable type="textarea"></el-input>
                
            </div>
        </div>
        <div style="width: 10%;float: left;height: 100vh; position: relative;">
            <div class="model-selector" style="position: absolute; left: 0%;top:0%">
                <el-select v-model="modeMappingSelector" clearable filterable @change="changeModel" style="z-index: 20230713;">
                    <el-option :value="item.value" :label="item.label" v-for="item in modeMapping">
                        <span style="float: left">{{ item.value }}</span>
                        <span style=" float: right; color: var(--el-text-color-secondary); font-size: 13px;">{{item.label}}</span>
                    </el-option>
                </el-select>
            </div>
            <el-progress  type="dashboard"  :percentage="(score).toFixed(2)"  style="position: absolute; left: 20%;top:40%"/>
            <!-- <ch-progress :value="(score).toFixed(2)"  style="position: absolute; left: 20%;top:40%"></ch-progress> -->
            <el-button type="primary"  style="position: absolute; width: 100%; left: 0%;top:calc(40% + 150px)" @click.stop="compare">提交</el-button>
        </div>
        <div class="model-image " style="min-width: 200px;;">
            <div class="result-image" ref="result-image">
                <iframe  v-if="modeMappingSelector != 'TEXT'" class="dropzone" frameborder="0" scrolling="no" no-border :src="url2"></iframe>
                <el-input class="upload-text"  :rows="20" v-else v-model="text2" placeholder="" size="normal" clearable type="textarea"></el-input>
            </div>
        </div>
    </div>
</template>
    
<script>
import Constant from "@/config/common"
import DragLayout from "@/components/drag/DragLayout.vue";
import $ from 'jquery'
import URL1 from '@/config/url';
import { ElNotification } from "element-plus";
import request from '@/utils/request'
import {getRandomColor} from '@/utils/Utils'
import ChProgress from '@/components/progress.vue'


export default {
    name: "Ocr",
    components: { DragLayout, ChProgress },
    data() {
        return {
            formData1: undefined,
            container: 'container-shadow',
            url1: 'src/html/compare.html?name=file1',
            url2: 'src/html/compare.html?name=file2',
            limit: 1,
            fileList: [],
            urlMapping: {},
            modeMapping: [],
            score: 0,
            modeMappingSelector: "TEXT",
            img: undefined,
            regResult: undefined,
            dropzone: undefined,
            dialogImageUrl: '',
            dialogVisible: !1,
            disabled: !1,
            viewUrl: undefined,
            canvasSelect: null,
            text1: undefined,
            text2: undefined

        }
    },
    watch: {
        modeMappingSelector: {
            handler(newValue, oldValue) {
                this.url =  Constant.PREFIX + this.urlMapping[this.modeMappingSelector]
            },
            immediate: true
        },
        urlMapping: {
            handler(newValue, oldValue) {
                this.url = Constant.PREFIX + this.urlMapping[this.modeMappingSelector]
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
            request.patch(URL1.COMPARE_CONFIG).then(({data}) => {
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
        compare: function () {
            if(this.modeMappingSelector !== 'TEXT' && (!this.formData1 || !this.formData1.get('file1')|| !this.formData1.get('file2'))) {
                ElNotification({
                    type: 'error',
                    message: '请上传图片',
                    title: '提示'
                })
                return !1;
            }
            if(this.modeMappingSelector === 'TEXT') {
                if(!this.text1 || !this.text2 ) {
                    ElNotification({
                    type: 'error',
                    message: '请输入文本',
                    title: '提示'
                })
                return !1;
                }
                if(!this.formData1) {
                    this.formData1 = new FormData();
                }
                this.formData1.set('text1', this.text1);
                this.formData1.set('text2', this.text2);
            }
            request.post(this.url, this.formData1, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                    },
            }).then(({data}) => {
                if(data.code === '00000') {
                    this.score = data.data[0].score * 100
                } else {
                    ElNotification({
                        type: 'error',
                        message: data.msg,
                        title: '提示'
                    })
                }
                // this.formData1 = null;
            }).catch(() => {
                ElNotification({
                    type: 'error',
                    message: '上传失败',
                    title: '提示'
                })
                return !1;
            })
            
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
            if (data.cmd === 'file1') {
                if(!this.formData1) {
                    this.formData1 = new FormData();
                }
                this.formData1.set("file1", data.source);
                return;
            }
            if (data.cmd === 'file2') {
                if(!this.formData1) {
                    this.formData1 = new FormData();
                }
                this.formData1.set("file2", data.source);
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
        width: 44%;
        overflow: hidden;
        float: left;
        padding-top: 34px;
    }
    .upload-image {
        //border-right: 1px solid #ccc;
    }
}
.result-image {
    position: relative;
    height: 100vh;
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
    height: 100%;
    width: 100%;
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
.upload-text,
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