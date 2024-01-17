<template>
    <el-dialog v-model="visible" :width="200" :height="600" draggable>
        <sc-upload v-model="file" :data="form" title="上传文件" :apiObj="apiObj" @handlerSuccess="onSuccess"></sc-upload>
    </el-dialog>
</template>

<script>
import scCropper from '@/components/scCropper/index.vue'
import config from "@/config"
import http from "@/utils/request"

export default {
    name: 'cropper',
    components: {
        scCropper
    },
    data() {
        return {
            visible: false,
            compress: 0.5,
            aspectRatio: 0,
            uploadImg: '',
            imgData: '',
            file:null,
            form: {},
            apiObj: {
                url: `${config.API_URL}/v1/file/upload`,
                name: "新增文件",
                post: async function(p){
                    return await http.post(this.url, p);
                }
		    },
        }
    },
    methods: {
        onSuccess(res) {
            if(res?.code === '00000') {
                this.$message.success('上传成功');
                this.visible = !1;
                return !1;
            }
            this.$message.error(res?.data?.msg || res?.msg || '上传失败');
            return !1;
        },
        setData(data) {
            this.visible = true;
            this.form = data;
            this.apiObj.url =  `${config.API_URL}/v1/file/${data.fsBucket}/upload`
        },
    }
}
</script>

<style></style>
