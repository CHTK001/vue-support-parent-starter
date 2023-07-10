<template>
    <div class="content">
        <pre  type="area" style="height: 100%; width: 100%;"  placeholder="" size="normal" readOnly disabled ><code>{{ data }}</code></pre>
    </div>
</template>

<script>
import { getQueryString } from '@/utils/Utils';
import request from '@/utils/request'
import '@/style/easy.css'
import {format} from "sql-formatter";

export default {
    name: 'txt',
    data() {
        return {
            data: undefined,
            type: undefined,
            subtype: undefined,
            url: undefined,
        }
    },
    mounted() {
        this.url = getQueryString('url') + (!!getQueryString('bucket') ? (getQueryString('bucket') + '/' + getQueryString('id') + '?fromPath=' + getQueryString('fromPath')) : '')
        this.type = getQueryString('type');
        this.fromPath = getQueryString('path');
        this.subtype = getQueryString('subtype');
        this.initial();
    },
    methods: {
        initial: function() {
            request.get(this.url, {
                responseType: 'text'
            }).then(data => {
                if(this.subtype === 'x-sql') {
                    this.data = format(data.data);
                    return !1;
                }

                if(this.subtype === 'xml') {
                    this.data = vkbeautify.xml(data.data.trim()).replace(/\\r\\n/g, '<br/>');
                    return !1;
                }

                if(this.subtype === 'json') {
                    this.data = vkbeautify.json(data.data.trim()).replace(/\\r\\n/g, '<br/>');
                    return !1;
                }

                if(this.type === 'text') {
                    this.data = data.data.trim().replace(/\\r\\n/g, '<br/>');
                    return !1;
                }
            })
        }
    },
}
</script>
<style scoped>
.content {
  height: 100vh;
  overflow: auto;
}
</style>