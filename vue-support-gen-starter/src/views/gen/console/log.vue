<template>
    
</template>
<script>
import {EventSourcePolyfill } from "event-source-polyfill"
import { default as AnsiUp } from 'ansi_up';
const ansi_up = new AnsiUp();
export default {
    name: 'consoleLog',
    data() {
        return {
            form: {},
            eventSource: null
        }
    },
    beforeUnmount() {
        if (!!this.eventSource) {
            try {
                this.eventSource.close();
            } catch (e) { }
        }
    },
    mounted(){
        this.form.tabId = this.$route.params.tabId;
        this.addTemplate.tabId =  this.form.tabId;
        this.form.genId = this.$route.params.genId;
        if(!this.form.tabId || this.form.tabId === 'null') {
            delete  this.form.tabId;
        }
        if(!this.form.genId || this.form.genId === 'null') {
            delete  this.form.genId;
        }
        this.initial();
    },
    methods: {
        subscribe: function (mode) {
            const _this = this;
            var ansi_up = new AnsiUp();
            if (!!this.eventSource) {
                try {
                    this.eventSource.close();
                } catch (e) { }
            }
            this.eventSource = new EventSourcePolyfill(this.$API.table.subscribe.url + mode);
            this.eventSource.addEventListener(mode, (event) => {
                const data = JSON.parse(event.data);
                this.data.push(ansi_up.ansi_to_html(data.message).replaceAll('\n', '<br/>'));
                if (this.data.length > 10000) {
                    this.data.shift();
                }

                this.$nextTick(() => {
                    let scrollEl = this.$refs.containerRef;
                    scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
                });
            });
            this.eventSource.onerror = function (event) {
            };
            this.eventSource.onopen = function (event) {
                _this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: '订阅成功' })
            };
        },
    }

}
</script>