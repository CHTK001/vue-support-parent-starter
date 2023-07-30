<template>
</template>

<script>
	import { loadJS } from '@/utils/load'

export default {
    name: 'gitee',
    props: {
        src: { type: String, default: '' }
    },
    mounted(){
        this.init();
    },
    methods:{
        async init() {
            window.location.href = this.src;
        }

    }
}
</script>