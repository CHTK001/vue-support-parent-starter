<template>
    <div ref="containerRef" style="height: 100%; overflow: auto;">
        <ul>
            <li v-for="item in data">
                <span v-html="item"></span>
            </li>
        </ul>
    </div>
</template>

<script>
import { ref, reactive, onMounted, onUpdated } from 'vue'
import { default as AnsiUp } from 'ansi_up';
export default {
    name: 'UniformLog',
    data() {
        return {
            data: []
        }
    },
    updated() {
        this.$refs.containerRef.scrollTop = this.$refs.containerRef.scrollHeight
    },
    mounted() {
        this.subscribe('log')
    },
    methods: {
        subscribe: function (mode) {
            const _this = this;
            var ansi_up = new AnsiUp();
            const eventSource = new EventSource(this.$API.config.uniform.url + mode);
            eventSource.addEventListener("log", (event) => {
                const data = JSON.parse(event.data);
                this.data.push(ansi_up.ansi_to_html(data.message));
            });
            eventSource.onerror = function (event) {
            };
            eventSource.onopen = function (event) {
                _this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: '订阅成功' })
            };
        },
    }
}
</script>