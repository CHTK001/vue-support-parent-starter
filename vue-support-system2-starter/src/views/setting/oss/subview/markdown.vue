<template>
  <div id="content" class="markdown-body"></div>
</template>
<script>
import request from '@/utils/request'
import {marked}  from 'marked' 
import "github-markdown-css"
import { getQueryString } from '@/utils/Utils';

export default {
    name : 'markdown',
    mounted() {
        request.post(getQueryString('url'), {
            bucket: getQueryString('bucket'),
            path: getQueryString('id'),
            fromPath: getQueryString('fromPath')
        })
        .then(({data}) => {
            document.getElementById('content').innerHTML = marked(data);
        })
        
    }
}
</script>
<style scoped>
#content {
    height: 100vh;
    overflow: auto;
}
</style>