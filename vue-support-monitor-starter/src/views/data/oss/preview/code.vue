<template>
    <div>
        <el-skeleton :loading="loading" animated :count="6"></el-skeleton>
        <div v-if="!loading" style="height: 100%; width:100%;">
            <pre style="height: 100%; width:100%;" ref="code" :class="'language-'+suffix + ' line-numbers inline-color highlight-keywords show-language'"> 
                <code :class="'language-'+suffix + ' line-numbers inline-color highlight-keywords show-language download-button data-uri-highlight'"> {{ data }} </code> 
            </pre>

        </div>
    </div>
</template>
<script>
import http from "@/utils/request"
// 引入Prism.js
import Prism from 'prismjs';
// 引入SQL语言插件
import 'prismjs/components/prism-sql.min.js';
import 'prismjs/components/prism-css.min.js';
import 'prismjs/components/prism-javascript.min.js';
import 'prismjs/components/prism-java.min.js';
import 'prismjs/components/prism-ini.min.js';
import 'prismjs/components/prism-json5.min.js';
import 'prismjs/components/prism-less.min.js';
import 'prismjs/components/prism-php.min.js';
import 'prismjs/components/prism-scss.min.js';
import 'prismjs/components/prism-toml.min.js';
import "prismjs/themes/prism-tomorrow.min.css"
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css"
import "prismjs/plugins/line-highlight/prism-line-highlight.min.css"
import "prismjs/plugins/inline-color/prism-inline-color.min.css"
export default {
    props: {
        url: {
            type: String,
            default: ''
        },
        suffix: {
            type: String,
            default: ''
        },
        ua: {
            type: String,
            default: ''
        },
    },
    data() {
        return {
            data: null,
            loading: true
        }
    },
    mounted() {
        this.loading = true;
        this.data = null;
        window.onload = () => {
            http.get(this.url, {}, {
                headers: {
                    'X-User-Agent': this.ua
                }
            }).then(res => {
                this.data = res;
                 // 假设你的SQL代码在模板的pre标签中
                 const pre = _this.$refs.code;
                // 使用Prism.highlightElement来高亮代码
                try {
                    Prism.highlightElement(pre);
                } catch (error) {
                }
                Prism.highlightAll();
            }).finally(() => {
                this.loading = false;
            });
        }
    },
}

</script>
<style lang="scss" scoped>
:global(.viewer-close) {
    display: none;
}
</style>