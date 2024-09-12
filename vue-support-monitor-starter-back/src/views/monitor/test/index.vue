<template>
    <div id="container">
        <DraggableContainer >
            <drag :value="viliable" id="1"></drag>
            <drag :value="viliable" id="2"></drag>
        </DraggableContainer>
    </div>
</template>
<script>
import { DraggableContainer } from 'vue3-draggable-resizable'

export default {
    components:{DraggableContainer},
    data(){
        return {
            viliable: false
        }
    },
    created() {
        this.$nextTick(() => {
            const doc = document.getElementById('container');
            if (doc?.parentElement) {
                this.parentWidth = doc.parentElement.offsetWidth;
                this.parentHeight = doc.parentElement.offsetHeight;
                doc.style.width = this.parentWidth - 8 - + 'px';
                doc.style.height = this.parentHeight - 8+ 'px';
                this.viliable = true;
            } else {
                console.error("无法获取父元素大小");
            }
        })
    }
}</script>

