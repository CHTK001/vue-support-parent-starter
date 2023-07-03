<template>
    <div v-show="showJson">
        <vue-json-viewer :value="jsonData" :expand-depth="expand"></vue-json-viewer>
    </div>
    <div v-show="!showJson">
        {{ jsonData }}
    </div>
</template>
<script>
import request from '@/utils/request'
import { getQueryString } from '@/utils/Utils';
import '@/style/easy.css'
import VueJsonViewer from 'vue-json-viewer'


export default {
    name: 'json',
    components: {
        VueJsonViewer
    },
    data() {
        return {
            showJson: true,
            expand: false,
            jsonData: {}
        }
    },
    mounted() {
        request.post(getQueryString('url'), {
            bucket: getQueryString('bucket'),
            path: getQueryString('id')
        }).then(({ data }) => {
                this.jsonData = Array.isArray(data) ? data : JSON.parse(data);
            })

    }
}
</script>
<style scoped>
#content {
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>
