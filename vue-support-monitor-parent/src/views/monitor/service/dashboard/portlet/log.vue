<template>
  <div ref="logRef" class="h-full overflow-auto">
    <ul class="overflow-hidden h-full">
      <li v-for="(item, i) in filterData" :key="i" class="infinite-list-item">
        <span v-if="item.className">
          <span style="color: rgb(22 165 67)">
            <b>[{{ dateFormat(item?.timestamp) }}]</b>
          </span>
          <span v-if="item?.level == 'INFO'" class="ml-1" style="color: rgb(93 137 239)">
            <b>[ {{ item?.level }}]</b>
          </span>
          <span v-else-if="item?.level == 'ERROR'" class="ml-1" style="color: rgb(255 0 0)">
            <b>[ {{ item?.level }}]</b>
          </span>

          <span class="ml-1">
            <b>[{{ item?.traceId }}]</b>
          </span>

          <span class="ml-1" style="color: rgb(207 55 55)">
            <b>[{{ item?.thread }}]</b>
          </span>

          <span class="ml-1">
            <b>[{{ item?.className }}]</b>
          </span>

          <span class="ml-1">
            <b>- {{ item?.message }}</b>
          </span>
        </span>
        <span v-else>
          {{ item?.message }}
        </span>
      </li>
    </ul>
  </div>
</template>
<script setup>
import { computed, getCurrentInstance, reactive, ref, nextTick, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { dateFormat } from "@/utils/date";
import { AnsiUp } from "ansi_up";
const ansi_up = new AnsiUp();
const filterData = computed(() => {
  return filter.traceId
    ? data.filter(it => {
        return it.traceId == filter.traceId;
      })
    : data;
});
const filter = reactive({
  traceId: ""
});
const logRef = ref(null);

const traceIds = reactive([]);
const data = reactive([]);
const lock = ref(false);
const update = async logEvent => {
  if (data.length > 10000) {
    data.slice(0, 1);
  }
  data.push(logEvent);
  if (traceIds.indexOf(logEvent.traceId) == -1) {
    traceIds.push(logEvent.traceId);
  }

  if (!lock.value) {
    debugger;
    logRef.value?.scrollTop = logRef.value?.scrollHeight;
  }
};

defineExpose({
  update
});
</script>
