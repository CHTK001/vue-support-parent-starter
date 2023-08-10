<template>
    <el-container style="height: 35%;">
        <el-aside style="width: 15%; " class="upload-bottom">
            <el-container>
                <el-main>
                    <sc-upload v-model="source" :cropperAutoUpload="false" :auto-upload="false" class="upload"
                        :cropper="false" :compress="1" :aspectRatio="1 / 1"></sc-upload>
                </el-main>
            </el-container>
        </el-aside>
        <el-container style="width: 10%;" class="upload-bottom">
            <el-main class="nopadding" style="position: relative;">
                <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                    <el-button type="primary" style="width: 100%; position: absolute; top: 50%" @click="compare">比对</el-button>
                </el-col>
            </el-main>
        </el-container>
        <el-aside style="width: 75%;" class="upload-bottom">
            <el-container>
                <el-main>
                    <el-card shadow="never" header="目标图片">
                        <sc-upload-multiple v-model="target" :autoUpload="false"  :limit="limit" ref="targetRef" :tip="tip"></sc-upload-multiple>
                    </el-card>
                </el-main>
            </el-container>
        </el-aside>
    </el-container>
    <el-container style="height: 75%;">
        <el-main>
            <el-empty v-if="!returnData || returnData.length === 0" />
            <div v-else>
                <el-row :gutter="15" style="height: 210px">
                    <el-col class="row-bg value-result" :xl="12" v-for="(item, index) in returnData">
                        <el-row>
                        <el-col :span="10">
                            <div>
                                <div style="position: relative;">
                                    <canvas style="width: 100%; height:100%" :class="'containerSource' + index"></canvas> 
                                </div>
                            </div>
                        </el-col>
                        <el-col :span="4">
                            <div class="nopadding" style="position: relative; top: calc(50% - 41px);">
                                <div v-if="score[index].score == -1" style="color: red; font-weight: 1000">
                                    未检测到人脸
                                </div>
                                <el-progress v-else type="circle" style="font-size:20px" :percentage="(score[index].score * 100).toFixed(2)" :stroke-width="9" :width="80" :height="80" >
                                    <template #default="{ percentage }">
                                        <span class="percentage-value">{{ percentage }}%</span>
                                        <span class="percentage-label">相似度</span>
                                    </template>
                                </el-progress>
                                {{ score[index].clsScore }}
                            </div>
                        </el-col>
                        <el-col :span="10">
                            <canvas style="width: 100%; height:100%"  :class="container + index"
                                :src="target[index]?.url"></canvas>
                        </el-col>
                    </el-row>
                    </el-col>
                </el-row>
            </div>
        </el-main>
    </el-container>
</template>

<script>
import { defineAsyncComponent } from 'vue';

import { ElLoading } from 'element-plus'
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));
import CanvasSelect from 'canvas-select'

export default {
    name: 'FaceCompare',
    components: {
        scCodeEditor
    },
    data() {
        return {
            limit: 10,
            tip: '',
            container: 'container',
            width: '100%',
            height: '100%',
            data: '{}',
            returnData: [],
            source: undefined,
            target: [],
            size: [],
            score: [],
            percentage: 0,
        }
    },
    mounted() {
        this.tip = '最多上传' + this.limit + '个文件,单个文件不要超过10M,请上传图像格式文件';
    },
    methods: {
        load: function () {
            for (let i = 0; i < this.returnData.length; i++) {
                const value = this.returnData[i];
                this.score.push(value)
                this.$nextTick(() => {
                    this.register(i, '.container' + i, this.target[value.index]?.url, value, 1);
                    this.register(i, '.containerSource' + i, this.source?.tempFile, value, 0);
                })
            }
        },
        register(index, selector, url, data, i) {
            var canvasSelect = new CanvasSelect(selector);
            canvasSelect.setImage(url);
            canvasSelect.labelMaxLen = 255;
            var container = 'container-shadow container-animation';
            var image = new Image();
            const _this = this;
            image.onload = function () {
                _this.size.push({
                    width: image.width,
                    height: image.height
                })
                _this.marker(canvasSelect, data, i, image.width, image.height);
            }
            image.src = url;

        },

        marker: function (canvasSelect, item, i, width, height) {
            const option = [];

            if (item.score < 0) {
                return;
            }
            const coor1 = [];
            const color = this.getRandomColor();
            const box = (i == 1 ? item.sign2 : item.sign1);
            const it = box?.corners[0];
            if (this.width === '100%' || it.x * width > this.width || it.y * height > this.height) {
                for (const it of box.corners) {
                    coor1.push([it.x, it.y]);
                }
                option.push({
                    strokeStyle: color,
                    activeFillStyle: color,
                    activeStrokeStyle: color,
                    labelFillStyle: color,
                    textFillStyle: "#fff",
                    label: i == 0 ? '原图' : '比对图',
                    coor: coor1, // required
                    type: 2 // required
                })
            } else {
                coor1.push([it.x * width + box.width * width, it.y * height + box.height * height]);
                coor1.push([it.x * width, it.y * height]);
                option.push({
                    strokeStyle: color,
                    activeFillStyle: color,
                    activeStrokeStyle: color,
                    labelFillStyle: color,
                    textFillStyle: "#fff",
                    label: i == 0 ? '原图' : '比对图',
                    coor: coor1, // required
                    type: 1 // required
                })
            }

            option.lock = !0;
            option.scrollZoom = 0;
            canvasSelect.setData(option);
        },
        getRandomColor() {
            const rgb = []
            for (let i = 0; i < 3; ++i) {
                let color = Math.floor(Math.random() * 256).toString(16)
                color = color.length == 1 ? '0' + color : color
                rgb.push(color)
            }
            return '#' + rgb.join('')
        },
        compare() {
            if (!this.source || !this.target || this.target.length === 0) {
                this.$message.error("必须上传两张图片");
                return !1;
            }

            const formData = new FormData();
            formData.set('file1', this.source?.raw);
            this.target.map(it => it?.raw).forEach(it => {
                formData.append('file2', it);
            })
            const loading = ElLoading.service({
                lock: true,
                text: 'Loading',
                background: 'rgba(0, 0, 0, 0.7)',
            })
            this.returnData.length = 0;
            this.$API.learning.compare.faceN.post(formData).then(res => {
                if (res.code === '00000') {
                    if (!res.data.length) {
                        this.$message.error('无比对结果');
                        return !1;
                    }
                    this.size.length = 0;
                    this.score.length = 0;
                    this.returnData = res.data;
                    this.load();
                    return !1;
                }

                this.$message.error(res.msg);
            }).finally(() => loading.close());
        },
    }
}
</script>

<style scoped lang="less">
.value-result {
    background: white;
    box-shadow: 3px 4px 8px 2px #ccc;
}
:deep(.percentage-value) {
    font-size: 12px !important
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
    height: 100% !important;
}

.upload-bottom {
    border-bottom: 1px solid var(--el-border-color);
}
</style>
