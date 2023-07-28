<template>
    <div :class="minCustom" v-if="!show"  :style="minStyle" id="vueDragMini"
        ref="vueDragMini" @mouseover.self="minMouseover" @mouseout.self="minMouseout" @click.stop="minClick">
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="icon popup-icon"
            viewBox="0 0 1024 1024" id="icon">
            <path
                d="M853.333333 1024L170.666667 1024c-93.866667 0-170.666667-76.8-170.666667-170.666667L0 170.666667c0-93.866667 76.8-170.666667 170.666667-170.666667l682.66666699 0c93.866667 0 170.666667 76.8 170.66666701 170.666667l0 682.66666699C1024 947.2 947.2 1024 853.333333 1024zM170.666667 85.333333C123.733333 85.333333 85.333333 123.733333 85.333333 170.666667l0 682.66666699c0 46.933333 38.4 85.333333 85.33333301 85.33333301l682.66666699 0c46.933333 0 85.333333-38.4 85.33333301-85.33333301L938.666667 170.666667c0-46.933333-38.4-85.333333-85.33333301-85.33333301L170.666667 85.333333z"
                p-id="1156"></path>
            <path
                d="M981.333333 341.333333L42.666667 341.333333C17.066667 341.333333 0 324.266667 0 298.666667s17.066667-42.666667 42.666667-42.666667l938.66666699 0c25.6 0 42.666667 17.066667 42.66666701 42.666667S1006.933333 341.333333 981.333333 341.333333z"
                p-id="1157"></path>
            <path d="M170.666667 170.666667m-42.666667 0a1 1 0 1 0 85.333333 0 1 1 0 1 0-85.333333 0Z" p-id="1158"></path>
            <path
                d="M170.666667 234.666667C136.533333 234.666667 106.666667 204.8 106.666667 170.666667S136.533333 106.666667 170.666667 106.666667 234.666667 136.533333 234.666667 170.666667 204.8 234.666667 170.666667 234.666667zM170.666667 149.333333C157.866667 149.333333 149.333333 157.866667 149.333333 170.666667S157.866667 192 170.666667 192 192 183.466667 192 170.666667 183.466667 149.333333 170.666667 149.333333z"
                p-id="1159"></path>
            <path d="M298.666667 170.666667m-42.666667 0a1 1 0 1 0 85.333333 0 1 1 0 1 0-85.333333 0Z" p-id="1160"></path>
            <path
                d="M298.666667 234.666667C264.533333 234.666667 234.666667 204.8 234.666667 170.666667S264.533333 106.666667 298.666667 106.666667 362.666667 136.533333 362.666667 170.666667 332.8 234.666667 298.666667 234.666667zM298.666667 149.333333C285.866667 149.333333 277.333333 157.866667 277.333333 170.666667S285.866667 192 298.666667 192 320 183.466667 320 170.666667 311.466667 149.333333 298.666667 149.333333z"
                p-id="1161"></path>
            <path d="M426.666667 170.666667m-42.666667 0a1 1 0 1 0 85.333333 0 1 1 0 1 0-85.333333 0Z" p-id="1162"></path>
            <path
                d="M426.666667 234.666667C392.533333 234.666667 362.666667 204.8 362.666667 170.666667S392.533333 106.666667 426.666667 106.666667s64 29.866667 64 64S460.8 234.666667 426.666667 234.666667zM426.666667 149.333333C413.866667 149.333333 405.333333 157.866667 405.333333 170.666667S413.866667 192 426.666667 192s21.333333-8.533333 21.333333-21.333333S439.466667 149.333333 426.666667 149.333333z"
                p-id="1163"></path>
        </svg>
    </div>

    <VueDragResize v-show="show" :parentW="parentW" :parentH="parentH" ref="vueDrag" id="vueDrag" :parentLimitation="true"
        class="drag-dialog " :isActive="active" :style="style" :isResizable="resizable" :minw="250" :minh="410" :w="width"
        :h="height" @dragging="resize" @dragstop="dragstop" v-on:resizing="resize">
        <div class="popup-window popup-window-fixed popup-fiex popup-fiex-column">
            <div class="popup-window-bar popup-fiex popup-fiex-row">
                <div class="popup-window-bar-title popup-flex-center popup-fiex popup-fiex-row">
                    <div class="title-icon popup-flex-center popup-fiex ">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                            class="icon popup-icon" viewBox="0 0 1024 1024" id="icon">
                            <path
                                d="M853.333333 1024L170.666667 1024c-93.866667 0-170.666667-76.8-170.666667-170.666667L0 170.666667c0-93.866667 76.8-170.666667 170.666667-170.666667l682.66666699 0c93.866667 0 170.666667 76.8 170.66666701 170.666667l0 682.66666699C1024 947.2 947.2 1024 853.333333 1024zM170.666667 85.333333C123.733333 85.333333 85.333333 123.733333 85.333333 170.666667l0 682.66666699c0 46.933333 38.4 85.333333 85.33333301 85.33333301l682.66666699 0c46.933333 0 85.333333-38.4 85.33333301-85.33333301L938.666667 170.666667c0-46.933333-38.4-85.333333-85.33333301-85.33333301L170.666667 85.333333z"
                                p-id="1156"></path>
                            <path
                                d="M981.333333 341.333333L42.666667 341.333333C17.066667 341.333333 0 324.266667 0 298.666667s17.066667-42.666667 42.666667-42.666667l938.66666699 0c25.6 0 42.666667 17.066667 42.66666701 42.666667S1006.933333 341.333333 981.333333 341.333333z"
                                p-id="1157"></path>
                            <path d="M170.666667 170.666667m-42.666667 0a1 1 0 1 0 85.333333 0 1 1 0 1 0-85.333333 0Z"
                                p-id="1158"></path>
                            <path
                                d="M170.666667 234.666667C136.533333 234.666667 106.666667 204.8 106.666667 170.666667S136.533333 106.666667 170.666667 106.666667 234.666667 136.533333 234.666667 170.666667 204.8 234.666667 170.666667 234.666667zM170.666667 149.333333C157.866667 149.333333 149.333333 157.866667 149.333333 170.666667S157.866667 192 170.666667 192 192 183.466667 192 170.666667 183.466667 149.333333 170.666667 149.333333z"
                                p-id="1159"></path>
                            <path d="M298.666667 170.666667m-42.666667 0a1 1 0 1 0 85.333333 0 1 1 0 1 0-85.333333 0Z"
                                p-id="1160"></path>
                            <path
                                d="M298.666667 234.666667C264.533333 234.666667 234.666667 204.8 234.666667 170.666667S264.533333 106.666667 298.666667 106.666667 362.666667 136.533333 362.666667 170.666667 332.8 234.666667 298.666667 234.666667zM298.666667 149.333333C285.866667 149.333333 277.333333 157.866667 277.333333 170.666667S285.866667 192 298.666667 192 320 183.466667 320 170.666667 311.466667 149.333333 298.666667 149.333333z"
                                p-id="1161"></path>
                            <path d="M426.666667 170.666667m-42.666667 0a1 1 0 1 0 85.333333 0 1 1 0 1 0-85.333333 0Z"
                                p-id="1162"></path>
                            <path
                                d="M426.666667 234.666667C392.533333 234.666667 362.666667 204.8 362.666667 170.666667S392.533333 106.666667 426.666667 106.666667s64 29.866667 64 64S460.8 234.666667 426.666667 234.666667zM426.666667 149.333333C413.866667 149.333333 405.333333 157.866667 405.333333 170.666667S413.866667 192 426.666667 192s21.333333-8.533333 21.333333-21.333333S439.466667 149.333333 426.666667 149.333333z"
                                p-id="1163"></path>
                        </svg>
                    </div>
                    <div class="title-message popup-flex-center popup-fiex-column popup-fiex">
                        <label class="title-message-label">sdsadsdsd</label>
                    </div>
                </div>
                <div class="popup-window-bar-handler popup-flex"></div>
                <div class="popup-window-bar-tools popup-fiex popup-flex-center popup-fiex-row">
                    <el-button icon="el-icon-minus"
                        class="popup-icon tools-min popup-tools  popup-fiex popup-fiex-column popup-flex-center"></el-button>
                    <el-button icon="el-icon-close"
                        class="popup-icon tools-close popup-tools popup-fiex popup-fiex-column popup-flex-center"></el-button>
                </div>
            </div>
            <div class="popup-window-content popup-flex">
                {{ left }} x {{ top }}
                <br />
                {{ width }} x {{ height }}
                <br />
                {{ parentW }} x {{ parentH }}
            </div>
        </div>
    </VueDragResize>
</template>
<script>
import sysConfig from "@/config"
import VueDragResize from 'vue-drag-resize/src'

export default {
    name: "Drag",
    components: {
        VueDragResize
    },
    props: {
        w: { type: Number, default: 250 },
        h: { type: Number, default: 410 },
        resizable: { type: Boolean, default: true },
        active: { type: Boolean, default: true },
    },
    data() {
        return {
            postion: '',
            width: this.w,
            height: this.h,
            show: true,
            top: 0,
            parentW: 0,
            parentH: 0,
            changeW: 0,
            changeH: 0,
            left: 0,
            changeRect: {},
            node: undefined,
            nodeMini: undefined,
            style: {},
            minStyle: {},
            minCustom: '',
            minLeft: ' popup-salver-button-left-1 popup-salver-right salver-right-active',
            minRight: ' popup-salver-button-right-1 popup-salver-left salver-left-active',
            minTop: ' popup-salver-button-top-1 popup-salver-bottom salver-bottom-active',
            minBottom: ' popup-salver-button-bottom-1 popup-salver-top salver-top-active',
            minClass: 'popup-fiex popup-fiex-column popup-fiex-mini popup-flex-center '
        }
    },
    mounted() {
        this.minCustom = this.minClass;
        const _this = this;
        _this.resizeLimit();
        this.$nextTick(() => {
            document.body.appendChild((this.node = this.$refs.vueDrag.$el));
            document.body.appendChild((this.nodeMini = this.$refs.vueDragMini));
            this.changeRect = this.node.getBoundingClientRect()
        });
        window.addEventListener('resize', (e) => {
            _this.resizeLimit();
            //  _this.resetOffset();
        })
    },
    methods: {
        minClick(e) {
            this.show = !this.show
        },
        minMouseover(e){
            if( this.postion == 'left') {
                this.minCustom = this.minClass + ' popup-salver-button-left';
            }
            if( this.postion == 'right') {
                this.minCustom = this.minClass + ' popup-salver-button-right';
            }
            if( this.postion == 'top') {
                this.minCustom = this.minClass + ' popup-salver-button-top';
            }
            if( this.postion == 'bottom') {
                this.minCustom = this.minClass + ' popup-salver-button-bottom';
            }
        },
        minMouseout(e){
            if( this.postion == 'left') {
                this.minCustom = this.minClass + this.minLeft;
            }
            if( this.postion == 'right') {
                this.minCustom = this.minClass + this.minRight;
            }
            if( this.postion == 'top') {
                this.minCustom = this.minClass + this.minTop;
            }
            if( this.postion == 'bottom') {
                this.minCustom = this.minClass + this.minBottom;
            }
        },
        resetOffset() {
            const rect = this.node.getBoundingClientRect();
            this.resetX(rect.x);
        },
        resetY(y) {
            if (y > this.parentH / 2) {
                this.$refs.vueDrag.$el.style.bottom = y + this.changeH;
                return;
            }
        },
        resetX(x) {
            if (x > this.parentW / 2) {
                this.style.left = x + this.changeW - this.width + 'px';
                return;
            }
        },
        resizeLimit() {
            this.parentW = (document.documentElement.clientWidth || document.body.clientWidth);
            this.parentH = (document.documentElement.clientHeight || document.body.clientHeight);
        },
        resize(newRect) {
            this.width = newRect.width;
            this.height = newRect.height;
            this.top = newRect.top;
            this.left = newRect.left;
        },
        dragstop(rect) {
            this.postion = '';
            if (this.left === 0) {
                this.postion = 'left';
                this.show = false;
                this.minStyle = { left: 0, top: rect.top + 'px' }
                this.minCustom = this.minClass + '' + this.minLeft;
                return !1;
            }
            if (this.top === 0) {
                this.postion = 'top';
                this.show = false;
                this.minStyle = { left: rect.left + 'px', top: 0 }
                this.minCustom = this.minClass + '' + this.minTop;
                return !1;
            }

            if (this.left + this.width === this.parentW) {
                this.postion = 'right';
                this.show = false;
                this.minStyle = { left: this.parentW + 'px', top: rect.top + 'px' }
                this.minCustom = this.minClass + '' + this.minLRight;
                return !1;
            }

            if (this.top + this.height === this.parentH) {
                this.postion = 'bottom';
                this.show = false;
                this.minStyle = { left: rect.left + 'px', top: this.parentH - 5+ 'px' }
                this.minCustom = this.minClass + '' + this.minBottom;
                return !1;
            }
            this.show = true;
        }
    }
}
</script>
<style  lang="scss" scope>
.popup-salver-bar {
    position: fixed;
    bottom: 0;
    height: 50px;
    width: 100%;
}

.popup-fiex {
    display: flex;
    display: -webkit-flex;
    display: -ms-flexbox;
}

.popup-fiex-mini {
    position: absolute;
}

.title-message>.title-message-label {
    display: inline-block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    word-wrap: break-word;
    line-height: normal;
}

.title-message {
    min-width: 0;
    line-height: 0;
}

.popup-fiex-column {
    flex-flow: column;
    -ms-flex-flow: column;
    -webkit-flex-flow: column;
}

.popup-fiex-row {
    flex-flow: row;
    -ms-flex-flow: row;
    -webkit-flex-flow: row;
}

.popup-window {
    z-index: 20200420;
    min-width: 250px;
    min-height: 410px;
}

body {
    z-index: 0
}

.popup-window>.popup-window-bar {
    height: 30px;
    background: rgb(255, 255, 255);
    border-radius: 10px;
}

.popup-flex {
    flex: 1;
    -ms-flex: 1;
    -webkit-flex: 1;
}

.popup-flex-center {
    text-align: center;
    justify-content: center;
    -webkit-justify-content: center;
    -ms-justify-content: center;
    align-content: center;
    -ms-align-content: center;
    -webkit-align-content: center;
}

.popup-window-bar-handler {
    cursor: move;
}

.popup-salver-bar .popup-icon,
.popup-window-bar-tools .popup-icon,
.popup-window-bar-title .popup-icon {
    height: inherit !important;
    border: inherit !important;
}

.popup-icon {
    width: 50px;
    height: 50px;
    padding: 12px 0 !important;
    vertical-align: -.15em;
    fill: currentColor;
    border: 1px solid #cccccc;
    overflow: hidden;
    font-size: 14px;
    display: inline-block;
    line-height: normal;
}

.title-message-label {
    display: inline-block;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
    word-wrap: break-word;
    line-height: normal;
}

label {
    margin-bottom: 0 !important;
}

.popup-tools:hover {
    cursor: pointer;
    background-color: #e5e5e5;
    z-index: 2000;
}

.popup-salver-button {
    width: 50px;
    height: 50px;
    background-color: #f5f5f5;
    position: relative;
    overflow: hidden;
}

.popup-salver-button-down {
    -webkit-animation-name: popup-salver-button-down;
    animation-name: popup-salver-button-down;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-up {
    -webkit-animation-name: popup-salver-button-up;
    animation-name: popup-salver-button-up;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-left {
    -webkit-animation-name: popup-salver-button-left;
    animation-name: popup-salver-button-left;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-left-1 {
    -webkit-animation-name: popup-salver-button-left-1;
    animation-name: popup-salver-button-left-1;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-right {
    -webkit-animation-name: popup-salver-button-right;
    animation-name: popup-salver-button-right;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-right-1 {
    -webkit-animation-name: popup-salver-button-right-1;
    animation-name: popup-salver-button-right-1;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-bottom {
    -webkit-animation-name: popup-salver-button-bottom;
    animation-name: popup-salver-button-bottom;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-bottom-1 {
    -webkit-animation-name: popup-salver-button-bottom-1;
    animation-name: popup-salver-button-bottom-1;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-top {
    -webkit-animation-name: popup-salver-button-top;
    animation-name: popup-salver-button-top;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button-top-1 {
    -webkit-animation-name: popup-salver-button-top-1;
    animation-name: popup-salver-button-top-1;
    -webkit-animation-duration: .3s;
    animation-duration: .3s;
    -webkit-animation-fill-mode: both;
    animation-fill-mode: both;
}

.popup-salver-button::after {
    position: absolute;
    content: "";
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
}

.popup-window-action {
    z-index: 20200421;
}

.popup-salver-button {
    border-top: 3px solid #d6e4ec;
}

.popup-salver-right,
.popup-salver-top,
.popup-salver-bottom,
.popup-salver-left {
    width: 50px;
    height: 50px;
    box-shadow: 1px 1px 3px 1px #CCC;
    border-radius: 5px;
    position: absolute;
}

.popup-salver-top {
    border-top: 5px solid #d6e4ec;
}

.popup-salver-bottom {
    border-bottom: 5px solid #d6e4ec;
}

.popup-salver-left {
    border-left: 5px solid #d6e4ec;
}

.popup-salver-right {
    border-right: 5px solid #d6e4ec;
}

.salver-button-active {
    border-top: 5px solid #3baced;
}

.salver-top-active {
    border-top: 5px solid #3baced;
}

.salver-bottom-active {
    border-bottom: 5px solid #3baced;
}

.salver-left-active {
    border-left: 5px solid #3baced;
}

.salver-right-active {
    border-right: 5px solid #3baced;
}

.salver-button-active>svg {
    color: #3baced;
    border-radius: 5px;
}

.popup-window-shadow {
    position: absolute;
    left: 0;
    top: 0;
}

@-webkit-keyframes popup-salver-button-up {
    0% {
        bottom: -45px;
    }

    to {
        bottom: 0;
    }
}

@keyframes popup-salver-button-up {
    0% {
        bottom: -45px;
    }

    to {
        bottom: 0;
    }
}

@-webkit-keyframes popup-salver-button-left {
    0% {
        left: -45px;
    }

    to {
        left: 0;
    }
}

@keyframes popup-salver-button-left {
    0% {
        left: -45px;
    }

    to {
        left: 0;
    }
}

@-webkit-keyframes popup-salver-button-left-1 {
    0% {
        left: 0;
    }

    to {
        left: -45px;
    }
}

@keyframes popup-salver-button-left-1 {
    0% {
        left: 0;
    }

    to {
        left: -45px;
    }
}



@-webkit-keyframes popup-salver-button-right {
    0% {
        right: -45px;
    }

    to {
        right: 0;
    }
}

@keyframes popup-salver-button-right {
    0% {
        right: -45px;
    }

    to {
        right: 0;
    }
}

@-webkit-keyframes popup-salver-button-right-1 {
    0% {
        right: 0;
    }

    to {
        right: -45px;
    }
}

@keyframes popup-salver-button-right-1 {
    0% {
        right: 0;
    }

    to {
        right: -45px;
    }
}

@-webkit-keyframes popup-salver-button-down {
    0% {
        bottom: 0
    }

    to {
        bottom: -45px
    }
}

@keyframes popup-salver-button-down {
    0% {
        bottom: 0
    }

    to {
        bottom: -45px
    }
}


@-webkit-keyframes popup-salver-button-right {
    0% {
        bottom: 0
    }

    to {
        right: -45px
    }
}

@keyframes popup-salver-button-right {
    0% {
        bottom: 0
    }

    to {
        bottom: -45px
    }
}



@-webkit-keyframes popup-salver-button-top {
    0% {
        top: -45px;
    }

    to {
        top: 0;
    }
}

@keyframes popup-salver-button-top {
    0% {
        top: -45px;
    }

    to {
        top: 0;
    }
}

@-webkit-keyframes popup-salver-button-top-1 {
    0% {
        top: 0;
    }

    to {
        top: -45px;
    }
}

@keyframes popup-salver-button-top-1 {
    0% {
        top: 0;
    }

    to {
        top: -45px;
    }
}



@-webkit-keyframes popup-salver-button-bottom {
    0% {
        bottom: -45px;
    }

    to {
        bottom: 0;
    }
}

@keyframes popup-salver-button-bottom {
    0% {
        bottom: -45px;
    }

    to {
        bottom: 0;
    }
}

@-webkit-keyframes popup-salver-button-bottom-1 {
    0% {
        bottom: 0;
    }

    to {
        bottom: -45px;
    }
}

@keyframes popup-salver-button-bottom-1 {
    0% {
        bottom: 0;
    }

    to {
        bottom: -45px;
    }
}

.popup-window-content {
    background: white;
}</style>