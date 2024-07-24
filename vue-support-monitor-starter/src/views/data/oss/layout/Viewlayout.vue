<template>
    <el-dialog top="2%" v-model="visible" :title="title" :close-on-click-modal="false" :close-on-press-escape="false" draggable  width="80%" style="height: 80%; border-radius: 10px; overflow: hidden;" @close="close">
        <iframe id="bdIframe" :src="'/preview.html?data=' + path + '&mediaType='+mediaType +'&ua=' + fileStorageProtocolUa" frameborder="0" width="100%" height="100%" style="overflow: auto;"></iframe>
    </el-dialog>
</template>

<script>
import Base64 from "@/utils/base64";
export default {
    data() {
        return {
            path: null,
            row: null,
            mediaType: null,
            visible: false,
            title: '预览',
        }
    },
    mounted() {
    },
    methods: {
        setData(path, row, menu, form) {
            this.form = form;
            //fileStorageBucket
            this.title = row.filename;
            const type = Object.keys(row.mediaType).filter((i) => row.mediaType[i]);
            if(type.length == 1) {
                this.mediaType = type[0];
            } else {
                this.mediaType = row.suffix;
            }
            this.fileStorageProtocolUa = Base64.encode(form.fileStorageProtocolUa);
            this.path = Base64.encode(
                (form.fileStorageProtocolName).toLowerCase() + "://" + 
                this.getHost(form) + ":" + form.fileStorageProtocolPort + 
                (menu.fileStorageBucket.startsWith('/') ? menu.fileStorageBucket : '/' + menu.fileStorageBucket) +
                (path.startsWith('/') ? path : '/' + path));
            this.row = row;
            return this;
        },
        getHost(form){
            const fileStorageProtocolHost = form.fileStorageProtocolHost;
            return "0.0.0.0" == fileStorageProtocolHost ? '127.0.0.1' : fileStorageProtocolHost;
        },
        open(mode = 'preview') {
            this.visible = !0;
        },
        close(){
            this.visible = false;
            this.$emit('close');
            this.path = null;
            this.row = null;
        },
    }
}
</script>
<style lang="less" scoped>
::v-deep  .el-dialog__body {
    height: 100%;
}
:global(.el-dialog__body) {
    height: 100%;
    padding: 0
}
.el-dialog__body {
    height: 100%;
}
</style>