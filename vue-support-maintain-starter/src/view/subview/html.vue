<template>
    <div id="content">
        <iframe :src="url" width="100%" height="100%" no-border no-scoll/>
    </div>
</template>
<script>
import { getQueryString } from '@/utils/Utils';
import '@/style/easy.css'


export default {
    name: 'html',
    data() {
        return {
            url: undefined,
        }
    },
    mounted() {
        this.url = getQueryString('url') + getQueryString('bucket') + getQueryString('id') + '?fromPath=' + getQueryString('fromPath');
    }
}
</script>
<style scoped>
#content {
    height: 100vh;
    overflow: auto;
}
</style>
