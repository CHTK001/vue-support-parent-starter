<template>
    <div>
        <component :is="gisType[currentGisType]"></component>
    </div>
</template>
<script>

import { defineAsyncComponent } from 'vue'
const gaode = defineAsyncComponent(() => import('@/views/gis/gaode/index.vue'))

export default {

    data() {
        return {
            currentGisType: 'gaode',
            gisType: {
                "gaode": gaode
            }
        }
    }
}
</script>