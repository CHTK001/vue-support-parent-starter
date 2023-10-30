<template>
   <img class="h-48 w-full object-cover md:h-full md:w-48" v-if="!href" :src="getAssetsImage('cloud-service.jpg')" >
   <img  class="h-48 w-full object-cover md:h-full md:w-48" v-else :src="href">

</template>

<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
export default {
    props: {
        type: {
            type: String,
            default: ''
        },
        href: {
            type: String,
            default: ''
        },
        name: {
            type: String,
            default: ''
        },
    },

    mounted() {
    },
    methods: {
        getAssetsImage(name) {
            if(this.type == 'VIDEO' || this.type == 'SHE_XIANG_TOU' || this.type == 'CAMERA') {
                return getAssetsImages('shexiangtou.jpg');
            }
            
            if(!this.type) {
                return getAssetsImages(name);
            }
            return getAssetsImages(this.type.replaceAll("_", "").toLowerCase() + '.jpg');
        },
    }

}
</script>