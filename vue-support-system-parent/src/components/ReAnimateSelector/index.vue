<script lang="ts">
import { defineComponent } from "vue";
import { cloneDeep } from "@pureadmin/utils";

export default defineComponent({
  name: "ReAnimateSelector",
  props: {
    placeholder: {
      type: String,
      default: "请选择动画"
    }
  },
  data() {
    return {
      inputValue: null,
      searchVal: null,
      animatesList: [
        /* Attention seekers  */
        "bounce",
        "flash",
        "pulse",
        "rubberBand",
        "shakeX",
        "headShake",
        "swing",
        "tada",
        "wobble",
        "jello",
        "heartBeat",
        /* Back entrances */
        "backInDown",
        "backInLeft",
        "backInRight",
        "backInUp",
        /* Back exits */
        "backOutDown",
        "backOutLeft",
        "backOutRight",
        "backOutUp",
        /* Bouncing entrances  */
        "bounceIn",
        "bounceInDown",
        "bounceInLeft",
        "bounceInRight",
        "bounceInUp",
        /* Bouncing exits  */
        "bounceOut",
        "bounceOutDown",
        "bounceOutLeft",
        "bounceOutRight",
        "bounceOutUp",
        /* Fading entrances  */
        "fadeIn",
        "fadeInDown",
        "fadeInDownBig",
        "fadeInLeft",
        "fadeInLeftBig",
        "fadeInRight",
        "fadeInRightBig",
        "fadeInUp",
        "fadeInUpBig",
        "fadeInTopLeft",
        "fadeInTopRight",
        "fadeInBottomLeft",
        "fadeInBottomRight",
        /* Fading exits */
        "fadeOut",
        "fadeOutDown",
        "fadeOutDownBig",
        "fadeOutLeft",
        "fadeOutLeftBig",
        "fadeOutRight",
        "fadeOutRightBig",
        "fadeOutUp",
        "fadeOutUpBig",
        "fadeOutTopLeft",
        "fadeOutTopRight",
        "fadeOutBottomRight",
        "fadeOutBottomLeft",
        /* Flippers */
        "flip",
        "flipInX",
        "flipInY",
        "flipOutX",
        "flipOutY",
        /* Lightspeed */
        "lightSpeedInRight",
        "lightSpeedInLeft",
        "lightSpeedOutRight",
        "lightSpeedOutLeft",
        /* Rotating entrances */
        "rotateIn",
        "rotateInDownLeft",
        "rotateInDownRight",
        "rotateInUpLeft",
        "rotateInUpRight",
        /* Rotating exits */
        "rotateOut",
        "rotateOutDownLeft",
        "rotateOutDownRight",
        "rotateOutUpLeft",
        "rotateOutUpRight",
        /* Specials */
        "hinge",
        "jackInTheBox",
        "rollIn",
        "rollOut",
        /* Zooming entrances */
        "zoomIn",
        "zoomInDown",
        "zoomInLeft",
        "zoomInRight",
        "zoomInUp",
        /* Zooming exits */
        "zoomOut",
        "zoomOutDown",
        "zoomOutLeft",
        "zoomOutRight",
        "zoomOutUp",
        /* Sliding entrances */
        "slideInDown",
        "slideInLeft",
        "slideInRight",
        "slideInUp",
        /* Sliding exits */
        "slideOutDown",
        "slideOutLeft",
        "slideOutRight",
        "slideOutUp"
      ],
      copyAnimatesList: [],
      animateMap: {}
    };
  },
  computed: {
    animateClass: () => {
      return [
        "mt-1",
        "flex",
        "border",
        "w-[130px]",
        "h-[100px]",
        "items-center",
        "cursor-pointer",
        "transition-all",
        "justify-center",
        "border-[#e5e7eb]",
        "hover:text-primary",
        "hover:duration-[700ms]"
      ];
    }
  },
  mounted() {
    this.copyAnimatesList = cloneDeep(this.animatesList);
  },
  methods: {
    animateStyle(i) {
      const v = this.inputValue;
      return v === i
        ? {
            borderColor: "var(--el-color-primary)",
            color: "var(--el-color-primary)"
          }
        : "";
    },
    onChangeIcon(animate) {
      this.inputValue = animate;
    },
    onClear() {
      this.inputValue = "";
    },
    filterMethod(value) {
      this.searchVal = value;
      this.animatesList = this.copyAnimatesList.filter((i: string | any[]) =>
        i.includes(value)
      );
    },
    onMouseEnter(index: string | number) {
      this.animateMap[index] = this.animateMap[index]?.loading
        ? Object.assign({}, this.animateMap[index], {
            loading: false
          })
        : Object.assign({}, this.animateMap[index], {
            loading: true
          });
    },
    onMouseleave() {
      this.animateMap = {};
    }
  }
});
</script>

<template>
  <el-select
    clearable
    filterable
    :placeholder="placeholder"
    popper-class="pure-animate-popper"
    :model-value="inputValue"
    :filter-method="filterMethod"
    @clear="onClear"
  >
    <template #empty>
      <div class="w-[280px]">
        <el-scrollbar
          noresize
          height="212px"
          :view-style="{ overflow: 'hidden' }"
          class="border-t border-[#e5e7eb]"
        >
          <ul class="flex flex-wrap justify-around mb-1">
            <li
              v-for="(animate, index) in animatesList"
              :key="index"
              :class="animateClass"
              :style="animateStyle(animate)"
              @mouseenter.prevent="onMouseEnter(index)"
              @mouseleave.prevent="onMouseleave"
              @click="onChangeIcon(animate)"
            >
              <h4
                :class="[
                  `animate__animated animate__${
                    animateMap[index]?.loading
                      ? animate + ' animate__infinite'
                      : ''
                  } `
                ]"
              >
                {{ animate }}
              </h4>
            </li>
          </ul>
          <el-empty
            v-show="animatesList.length === 0"
            :description="`${searchVal} 动画不存在`"
            :image-size="60"
          />
        </el-scrollbar>
      </div>
    </template>
  </el-select>
</template>

<style>
.pure-animate-popper {
  min-width: 0 !important;
}
</style>
