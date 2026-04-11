<template>
  <div class="chrome-shape" />
</template>

<style lang="scss" scoped>
.chrome-shape {
  position: relative;
  width: 100%;
  height: 100%;
  color: inherit;
  background: currentColor;
  border-radius: 14px 14px 0 0;

  &::before,
  &::after {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 22px;
    content: "";
    background: currentColor;
  }

  &::before {
    left: 0;
    border-top-left-radius: 14px;
    transform: skewX(-24deg);
    transform-origin: left bottom;
  }

  &::after {
    right: 0;
    border-top-right-radius: 14px;
    transform: skewX(24deg);
    transform-origin: right bottom;
  }
}
</style>
