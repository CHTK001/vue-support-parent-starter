<template>
  <repository ref="repository" :workspace-id="getWorkspaceId()" :global="true" :choose="choose" :choose-val="chooseVal" @confirm="confirm" />
</template>
<script>
import { getWorkspaceId } from "@/api/workspace";
import repository from "./repository-list.vue";

export default {
  components: { repository },
  props: {
    choose: {
      type: Boolean,
      default: false
    },
    chooseVal: {
      type: String,
      default: ""
    }
  },
  emits: ["confirm"],
  methods: {
    getWorkspaceId,
    confirm(data) {
      this.$emit("confirm", data);
    },
    handerConfirm() {
      this.$refs.repository.handerConfirm();
    }
  }
};
</script>
