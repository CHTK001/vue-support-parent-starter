<template>
    <div :id="attribute.id" class="el-dialog is-draggable" tabindex="-1" style="transform: translate(-10px, -17px);">
        <header class="el-dialog__header">
            <span role="heading" aria-level="2" class="el-dialog__title">
                {{ attribute.title }}
            </span>
            <button aria-label="el.dialog.close" class="el-dialog__headerbtn" type="button">
                <i class="el-icon el-dialog__close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                        <path fill="currentColor"
                            d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z">
                        </path>
                    </svg>
                </i>
            </button>
        </header>
        <div id="el-id-7111-11" class="el-dialog__body"></div><!--v-if-->
    </div>
</template>

<script>
import { loadJS } from '@/utils/load';
import './draggabilly.pkgd.min.js'

export default {
    name: 'dialog',
    props: {
        viliable: {
            type: Boolean,
            default: false
        },
        id: {
            type: String,
            default: 'el-dialog'
        },
        title: {
            type: String,
            default: '标题'
        },
        width: {
            type: String,
            default: '50%'
        },
        height: {
            type: String,
            default: '50%'
        },
        top: {
            type: String,
            default: '10%'
        }
    },
    data() {
        return {
            name: 'dialog',
            viliable: true,
            draggie: null,
            attribute: {
                id: this.id,
                title: this.title,
                width: this.width,
                height: this.height,
                top: this.top
            }
        }
    },
    mounted() {
        var elem = document.getElementById(this.attribute.id);
        this.draggie = new Draggabilly( elem, {
        // options...
        });
        
    }
}
</script>