<template>
    <el-container class="ocr">
        <el-aside class="ocr-image " style="min-width: 500px;width: 600px;">
            <div class="upload-image">
                <iframe class="dropzone" frameborder="0" scrolling="no" no-border :src="url"></iframe>
            </div>
        </el-aside>
        <drag-layout id="vertical-drag-bar-ocr"></drag-layout>
        <el-main class="ocr-image " style="min-width: 200px;">
            <div class="result-image" ref="result-image">
                <canvas class="container"></canvas>
            </div>
        </el-main>
    </el-container>
</template>
    
<script>
import DragLayout from "@/components/drag/DragLayout.vue";
import $ from 'jquery'
import URL from '@/config/url';
import CanvasSelect from 'canvas-select'


export default {
    name: "Ocr",
    components: { DragLayout },
    data() {
        return {
            url: 'src/html/ocr-uploader.html?url=' + URL.OCR,
            limit: 1,
            fileList: [],
            regResult: undefined,
            dropzone: undefined,
            dialogImageUrl: '',
            dialogVisible: !1,
            disabled: !1,
            viewUrl: undefined,
            canvasSelect: undefined,
        }
    },
    methods: {
        load: function() {
            this.canvasSelect = new CanvasSelect('.container');
        }
    },
    mounted() {
        window.addEventListener('message', (eve) => {
            console.log(eve)
            const data = eve.data;
            if(data.cmd === 'file') {
                for(const item of Object.keys(data.source)) {
                    this.fileList.length = 0;
                    this.fileList.push(data.source[item]);
                    this.viewUrl = URL.createObjectURL(this.fileList[0]);
                    this.load();
                }
                return ;
            }

            if(data.cmd === 'result') {
                this.regResult = data.source;
                
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

.ocr {
    height: 100vh;

    .ocr-image {
        height: 100vh;
        width: calc(50% - 5px);
        overflow: hidden;
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