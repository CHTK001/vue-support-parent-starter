<template>
    <div>
        <el-skeleton :loading="loading" animated :count="6"></el-skeleton>
        <div v-if="!loading" style="height: 100%; width:100%;">
            <div v-if="!isBlob">
                <video-player :src="data" 
                    poster="/your-path/poster.jpg"
                    :controls="true"
                    :autoplay="true"
                    :loop="true"
                    :volume="0.6" />
            </div>
            <div v-else>
                <el-icon class="cursor-pointer" @click="download" style="font-size: 64px; position: relative; color: #ccc;    top: calc(50% - 64px);left: calc(50% - 64px)">
                    <component is="sc-icon-download"></component>
                </el-icon>
            </div>
        </div>
    </div>
</template>
<script>

import http from "@/utils/request"
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
export default {
    components: {
        VideoPlayer,
    },
    props: {
        url: {
            type: String,
            default: ''
        },
        ua: {
            type: String,
            default: ''
        },
        name: {
            type: String,
            default: ''
        },
    },
    data() {
        return {
            data: null,
            loading: true,
            isBlob: false,
            options: {
                width: "800px", //播放器宽度
                height: "450px", //播放器高度
                color: "#409eff", //主题色
                title: "", //视频名称
                src: "https://cdn.jsdelivr.net/gh/xdlumia/files/video-play/IronMan.mp4", //视频源
                muted: false, //静音
                webFullScreen: false,
                speedRate: ["0.75", "1.0", "1.25", "1.5", "2.0"], //播放倍速
                autoPlay: false, //自动播放
                loop: false, //循环播放
                mirror: false, //镜像画面
                ligthOff: false, //关灯模式
                volume: 0.3, //默认音量大小
                control: true, //是否显示控制
                controlBtns: [
                    "audioTrack",
                    "quality",
                    "speedRate",
                    "volume",
                    "setting",
                    "pip",
                    "pageFullScreen",
                    "fullScreen",
                ], //显示所有按钮,
            },
        }
    },
    unmounted(){
        try {
            URL.revokeObjectURL(this.data);
        } catch (error) {
            
        }
        try {
            URL.revokeObjectURL(this.url);
        } catch (error) {
            
        }
    },
    mounted() {
        this.loading = true;
        this.data = null;
        if (this.url.startsWith('blob')) {
            this.loading = false;
            this.isBlob = true;
            return false;
        }
        http.get(this.url, {}, {
            headers: {
                'X-User-Agent': this.ua
            },
                responseType: 'blob'
        }).then(res => {
            this.data = URL.createObjectURL(res);
        }).finally(() => {
            this.loading = false;
        });
    },
    methods: {
        download() {
            const box = document.createElement('a')
            box.download = this.name
            box.href = this.data
            box.click()
        },
    }
}

</script>
<style lang="scss" scoped>
:global(.viewer-close) {
    display: none;
}
</style>