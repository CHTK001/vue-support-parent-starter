<template>
  <img v-if="!icon || !icon.type" class="right_item_icon right_item_icon_blank" />
  <img v-else-if="icon.type === 'url'" class="right_item_icon" :src="icon.value" />
  <b-icon v-else-if="theme === 'light' && icon.type === 'name'" class="right_item_icon" :local="icon.value" style="color: black" />
  <b-icon v-else-if="theme === 'dark' && icon.type === 'name'" class="right_item_icon" :local="icon.value" style="color: white" />
  <b-icon v-else-if="theme === 'light' && icon.type === 'type'" class="right_item_icon" :type="icon.value" style="color: black" />
  <b-icon v-else-if="theme === 'dark' && icon.type === 'type'" class="right_item_icon" :type="icon.value" style="color: white" />
  <img v-else class="right_item_icon right_item_icon_blank" />
</template>

<script>
export default {
  name: "RightMenuItemIcon",
  props: {
    icon: Object,
    theme: String
  }
};
</script>

<style scoped>
.right_item_icon {
  width: 18px;
  height: 18px;
  margin-top: -3px;
}
.right_item_icon_blank {
  opacity: 0;
}
</style>
