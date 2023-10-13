<template>
    <div class="content">
        <sc-code-editor v-if="subtype === 'json'" ref="editor" :height="height" :readOnly="true" v-model="data" mode="json"></sc-code-editor>
        <sc-code-editor v-else-if="subtype === 'x-sql'" ref="editor" :height="height" :readOnly="true" v-model="data" mode="sql"></sc-code-editor>
        <sc-code-editor v-else-if="subtype === 'xml'" ref="editor" :height="height" :readOnly="true" v-model="data" mode="xml"></sc-code-editor>
        <sc-code-editor v-else-if="subtype === 'java'" ref="editor" :height="height" :readOnly="true" v-model="data" mode="text/x-java"></sc-code-editor>
        <sc-code-editor v-else-if="subtype === 'vnd.yaml'" ref="editor" :height="height" :readOnly="true" v-model="data" mode="yaml"></sc-code-editor>
        <pre v-else ref="code" type="area" style="height: 100%; width: 100%;"  placeholder="" size="normal" readOnly disabled ><code>{{ data }}</code></pre>
    </div>
</template>

<script>
import { getQueryString } from '@/utils/Utils';
import request from '@/utils/request'
import { defineAsyncComponent } from 'vue';
const scCodeEditor = defineAsyncComponent(() => import('@/components/scCodeEditor/index.vue'));

export default {
    name: 'txt',
    components: {
        scCodeEditor
    },
    data() {
        return {
            data: undefined,
            type: undefined,
            subtype: undefined,
            url: undefined,
            height: 400
        }
    },
    mounted() {
        this.url = getQueryString('url') + (!!getQueryString('bucket') ? (getQueryString('bucket') + '/' + getQueryString('id') + '?fromPath=' + getQueryString('fromPath')) : '')
        this.type = getQueryString('type');
        this.fromPath = getQueryString('path');
        this.subtype = getQueryString('subtype');
        this.height = this.$refs.code.clientHeight;
        this.initial();
    },
    methods: {
        initial: function() {
            request.get(this.url, {
                responseType: 'text'
            }).then(data => {
                if(this.subtype === 'x-sql') {
                    this.data = format(data);
                    return !1;
                }

                if(this.subtype === 'xml') {
                    this.data = data;
                    return !1;
                }

                if(this.subtype === 'json') {
                    this.data = data;
                    return !1;
                }

                if(this.subtype === 'vnd.yaml') {
                    this.data = data;
                    return !1;
                }

                if(this.subtype === 'java') {
                    this.data = data;
                    return !1;
                }

                if(this.type === 'text') {
                    this.data = data.trim().replace(/\\r\\n/g, '<br/>');
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