<template>
    <d2-container>
      <div class="video-container">
        <videoPlayer class="vjs-custom-skin videoPlayer" :options="playerOptions" width="70%"></videoPlayer>
      </div>
      <div class="video-detail">
        <el-card>
          <div class="title">xx大厦后侧消防通道</div>
          <div class="title">设备型号：某康SXC-3</div>
          <div class="title">人群密度：低</div>
          <div class="title">清晰度：高</div>
          <div class="title">设备状态：开启</div>
          <el-switch
            class="title"
            style="display: block"
            v-model="value2"
            active-color="#13ce66"
            inactive-color="#00adb5"
            active-text="信号源2"
            inactive-text="信号源1"
          ></el-switch>
        </el-card>
      </div>
    </d2-container>
  </template>
  
<script>
import "video.js/dist/video-js.css";
import { videoPlayer } from "vue-video-player";
import "videojs-flash";

export default {
    components: {
        videoPlayer
    },
    data() {
        return {
            playerOptions: {
                height: "600",//播放器高度
                sources: [
                {
                    type: "rtmp/mp4",//视频流协议，如果是hls，需要后端开启跨域
                    // 内测地址
                    src: "rtmp://mobliestream.c3tv.com:554/live/goodtv.sdp"
                }
                ],
                techOrder: ["flash"],
                autoplay: true,//自动播放
                controls: true//编辑器控件
                //更多参数建议查看vue-video-player官网，这里只提供参考
            }

        }
    }
}

</script>