<template>
  <div class="_base-count-down">
    <slot :row="countDown" name="default" />
  </div>
</template>
<script>
export default {
  props: {
    modelValue: {
      type: Number,
      default: 0
    },
    loop: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      timer: null,
      countDownTime: 10
    };
  },
  computed: {
    countDown() {
      const minutes = Math.floor(this.countDownTime / 60);
      const seconds = this.countDownTime % 60;
      return {
        minutes: minutes,
        seconds: seconds
      };
    }
  },

  created() {
    this.countDownTime = this.modelValue;
    this.timer = setInterval(() => {
      this.countDownTime--;
      if (this.countDownTime <= 0) {
        this.$emit("finish");
        if (this.loop) {
          this.countDownTime = this.modelValue;
        } else {
          clearInterval(this.timer);
        }
      }
    }, 1000);
  },
  beforeUnmount() {
    clearInterval(this.timer);
  }
};
</script>
<style lang="scss" scoped></style>
