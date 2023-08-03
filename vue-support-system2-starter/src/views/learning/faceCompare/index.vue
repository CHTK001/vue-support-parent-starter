<template>
    <el-container>
		<el-header>人脸1:1</el-header>
		<el-main class="nopadding" style="position: relative;">
            <el-container style="width: 65%; height: 50%; position: absolute; left: 10%;">
                <el-aside style="width: 30%; " class="upload-bottom" >
                    <el-container>
                        <el-main style="position: relative;">
                            <el-switch v-model="sourceCopper" style="position: absolute;"
                                inline-prompt
                                active-text="裁剪"
                                inactive-text="默认"
                            ></el-switch>
                            <sc-upload  @handleFile="handleSourceFile" :cropperAutoUpload="false" :auto-upload="false" class="upload"  :cropper="sourceCopper" :compress="1" :aspectRatio="1/1">
                            </sc-upload>
                        </el-main>
                    </el-container>
                </el-aside>
                <el-container style="width: 5%;" class="upload-bottom">
                    <el-main class="nopadding" style="position: relative;">
                        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24" >
                            <el-progress type="circle" :percentage="percentage" :stroke-width="9" style="width: 126px; position: absolute; top: calc(50% - 146px); left: calc(50% - 63px)">
                                <template #default="{ percentage }">
                                    <span class="percentage-value">{{ percentage }}%</span>
                                    <span class="percentage-label">相似度</span>
                                </template>
                            </el-progress>
                        </el-col>
                        <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                            <el-button type="primary" style="width: 100%; position: absolute; top: 50%" @click="compare">比对</el-button>
                        </el-col>
                    </el-main>
                </el-container>
                <el-aside style="width: 30%;" class="upload-bottom">
                    <el-container>
                        <el-main  style="position: relative;">
                            <el-switch v-model="targetCopper" style="position: absolute;"
                                inline-prompt
                                active-text="裁剪"
                                inactive-text="默认"
                            ></el-switch>
                            <sc-upload  @handleFile="handleTargetFile"  :cropperAutoUpload="false" :autoUpload="false" class="upload" :cropper="targetCopper" :compress="1" :aspectRatio="1/1" ></sc-upload>
                        </el-main>
                    </el-container>
                </el-aside>
                <!-- <el-aside style="width: 50%; border-left: 1px solid var(--el-border-color);" class="upload-bottom">
                    <el-container>
                        <el-container>
                        <el-header>结果</el-header>
                        <el-main>
                            <sc-code-editor  v-model="data" mode="application/json"></sc-code-editor>
                        </el-main>
                    </el-container>
                    </el-container>
                </el-aside> -->
            </el-container>
		</el-main>
		<el-footer></el-footer>
	</el-container>
        
</template>

<script>
import { defineAsyncComponent } from 'vue';

import { ElLoading } from 'element-plus'
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

	export default {
		name: 'FaceCompare',
        components: {
            scCodeEditor
        },
		data() {
			return {
                sourceCopper: false,
                targetCopper: false,
                data: '{}',
                source: undefined,
                target: undefined,
                percentage:0,
			}
		},
        methods:{
            handleSourceFile(val) {
                if(!val) {
                    this.source = undefined;
                    return;
                }
                this.source = val.raw || val.url;
            },
            handleTargetFile(val) {
                if(!val) {
                    this.target = undefined;
                    return;
                }
                this.target = val.raw || val.url;
            },
            compare(){
                if(!this.source || !this.target) {
                    this.$message.error("必须上传两张人脸图片");
                    return !1;
                }

                const formData = new FormData();
                formData.set('file1', this.source);
                formData.set('file2', this.target);
                const loading = ElLoading.service({
                    lock: true,
                    text: 'Loading',
                    background: 'rgba(0, 0, 0, 0.7)',
                })
                this.$API.learning.compare.face.post(formData).then(res => {
                    if(res.code === '00000') {
                        if(!res.data.length) {
                            this.$message.error('无比对结果');
                            return !1;
                        }
                        const item = res.data[0];
                        this.percentage = (parseFloat(item.score) * 100).toFixed(2);
                        this.data = JSON.stringify(item,null,4);
                        return !1;
                    } 

                    this.$message.error(res.msg);
                }).finally(() => loading.close());
            },
        }
	}
</script>

<style scoped lang="less">
:deep(.el-upload--picture-card) {
    width: 100% !important;
    height: 100%  !important;
}
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}
.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}
.upload {
    width: 100% !important;
    height: 100%  !important;
}
.upload-bottom {
    border-bottom: 1px solid var(--el-border-color);
}
</style>
