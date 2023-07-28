<template>
    <div>
        <sc-video :src="liveUrl_2" isLive :options="{ volume: 0 }"></sc-video>
    </div>
</template>
<script>
import scVideo from '@/components/scVideo'

export default {
    name: 'scvideo',
    components: {
        scVideo
    },
    data() {
        return {
            liveUrl_2: ''
        }
    },
    mounted() {
        this.liveUrl_2 = getQueryString('url') +  (getQueryString('bucket') || '')+  (getQueryString('id')|| '') + '?fromPath=' + (getQueryString('fromPath')|| '');
    },
}
</script>