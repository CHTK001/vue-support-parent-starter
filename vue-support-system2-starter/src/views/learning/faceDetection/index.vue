<template>
    <el-container>
        <el-aside style="width: 30%">
            <el-container>
                <el-main class="container-parent">
                    <sc-upload :apiObj="apiObj" @handleRemove="handleRemove" @handleSuccess="handleSuccess" @handleFile="handleFile" class="upload" :compress="1"
                        :aspectRatio="1 / 1">
                    </sc-upload>
                </el-main>
            </el-container>
        </el-aside>
        <el-container style="width: 70%">
            <el-main class="nopadding container-parent">
                <el-empty v-if="show" style="height: 100%;" :description="this.$t('data.nodata')" />
                <canvas v-if="!show" :width="width" :height="height" class="container"></canvas>
            </el-main>
        </el-container>
    </el-container>
</template>

<script>
import CanvasSelect from 'canvas-select'
export default {
    name: 'layoutLCR',
    data() {
        return {
            apiObj: this.$API.learning.detection.face,
            canvasSelect: null,
            regResult: [],
            viewUrl: '',
            show: true,
            width:  300,
            height:  300,
            img: undefined,
            style: {}
        }
    },
    methods: {
        handleRemove() {
            this.show = false;
            if (null != this.canvasSelect) {
                this.canvasSelect.destroy();
            }
        },
        handleSuccess(d) {
            this.regResult = d.data;
            this.load();
            this.marker();
        },
        handleFile(file) {
            if(!file) {
                this.viewUrl = '';
                return !1;
            }
            const _this = this;
            this.show = false;
            this.viewUrl = file.tempFile;
            var img = new Image();
            img.onload = function(){    
                _this.width = img.naturalWidth;
                _this.height = img.naturalHeight;
                _this.style.width = _this.width;
                _this.style.height = _this.height;
            }   
            img.src= this.viewUrl;    
        },
        load: function () {
            this.canvasSelect = new CanvasSelect('.container');
            this.canvasSelect.setImage(this.viewUrl);
            this.canvasSelect.labelMaxLen = 255;
            this.container = 'container-shadow container-animation'

        },
        marker: function () {
            const option = [];
            const width = this.width;
            const height = this.height;

            if (!this.regResult.length) {
                this.$notify.success({
                    title: '提示',
                    message: '未检测到人脸'
                })
                return;
            }

            if (this.regResult[0]['ndArray']) {
                function getX(box, x) {
                    // 左上角坐标
                    const x1 = (box.corners[0].x * width);
                    // 宽度
                    const w = (box.width * width);

                    return (x * w + x1);
                }
                function getY(box, y) {
                    // 左上角坐标
                    const y1 = (box.corners[0].y * height);
                    // 宽度
                    const h = (box.height * height);

                    return (y * h + y1);
                }
                for (let index = 0; index < this.regResult.length; index++) {

                    const item = this.regResult[index];
                    const nd = JSON.parse(item.ndArray)[0];
                    const coor1 = [];
                    for (let j = 0; j < nd.length / 2; j++) {
                        const x = getX(item.boundingBox, nd[2 * j]);
                        const y = getY(item.boundingBox, nd[2 * j + 1]);
                        option.push({
                            textFillStyle: "#fff",
                            ctrlRadius: 1,
                            alpha: false,
                            label: '',
                            coor: [x, y], // required
                            type: 3 // required
                        })
                    }
                }

            } else {
                for (const item of this.regResult) {
                    const coor1 = [];
                    const color = this.getRandomColor();
                    const it = item.boundingBox.corners[0];
                    if(it.x * width > this.width || it.y * height > this.height) {
                        for(const it of item.boundingBox.corners) {
                            coor1.push([it.x, it.y]);
                        }
                        option.push({
                            strokeStyle: color,
                            activeFillStyle: color,
                            activeStrokeStyle: color,
                            labelFillStyle: color,
                            textFillStyle: "#fff",
                            label: item.text,
                            coor: coor1, // required
                            type: 2 // required
                        })
                    } else {
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
                  
                }
            }


            this.canvasSelect.setData(option);
        },
        getRandomColor() {
            const rgb = []
            for (let i = 0 ; i < 3; ++i){
                let color = Math.floor(Math.random() * 256).toString(16)
                color = color.length == 1 ? '0' + color : color
                rgb.push(color)
            }
            return '#' + rgb.join('')
        }

    }
}
</script>

<style scoped lang="less">
.container-parent {
    display: flex;
    justify-content: center;
    align-items: center;
}
:deep(.el-upload--picture-card) {
    width: 100% !important;
    height: 100% !important;
}
:deep(.sc-upload__img .image) {
    width: inherit !important;
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
    height: 60% !important;
}

.upload-bottom {
    border-bottom: 1px solid var(--el-border-color);
}</style>
