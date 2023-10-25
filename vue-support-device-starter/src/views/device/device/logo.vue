<template>
   <img class="h-48 w-full object-cover md:h-full md:w-48" v-if="!href" :src="getAssetsImage('cloud-service.jpg')" alt="Man looking at item at a store">
   <img class="h-48 w-full object-cover md:h-full md:w-48" v-else :src="href" alt="Man looking at item at a store">

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
    },

    mounted() {
    },
    methods: {
        getAssetsImage(name) {
            if(this.type == 'VIDEO' || this.type == 'SHE_XIANG_TOU') {
                return getAssetsImages('shexiangtou.jpg');
            }
            return getAssetsImages(this.type.replace("_", "").toLowerCase() + '.jpg');
        },
    }

}
</script>