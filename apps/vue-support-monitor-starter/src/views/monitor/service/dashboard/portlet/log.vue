<template>
  <div class="datav">
    <scDrag ref="dragRef" v-model="visible" :overlay="overlay" title="实时日志" :mini="true" height="80vh" width="80vw" :tech="datav" :zIndex="zIndex" @close="onClose">
      <div class="absolute" style="bottom: 40px; right: 16px; z-index: 1">
        <el-row class="relative mt-1">
          <el-button class="absolute right-0" circle type="danger" :icon="useRenderIcon('ep:delete-filled')" @click="filterData.length = 0" />
        </el-row>
      </div>
      <div ref="logRef" class="!h-[650px] overflow-hidden">
        <ul class="overflow-auto h-full">
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
                <b>
                  -
                  <span v-html="item?.message" />
                </b>
              </span>
            </span>
            <span v-else>
              <div v-html="item?.message" />
            </span>
          </li>
        </ul>
      </div>
    </scDrag>
  </div>
</template>
<script setup>
import { computed, getCurrentInstance, reactive, ref, nextTick, defineProps, onMounted, onUnmounted } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { dateFormat } from "@/utils/date";
import { AnsiUp } from "ansi_up";
import { Md5 } from "ts-md5";
import scDrag from "@repo/components/ScDrag/index.vue";

import { useConfigStore } from "@/store/modules/config";
const socket = useConfigStore().socket;
const props = defineProps({
  form: Object,
  datav: {
    type: Boolean,
    default: true
  },
  overlay: {
    type: Boolean,
    default: false
  },
  zIndex: {
    type: Number,
    default: 9
  }
});

const suffix = props.form.host + props.form.port;
const eventName = Md5.hashStr("LOG:" + suffix);
const visible = ref(false);
const onClose = () => {
  socket?.off(eventName);
  visible.value = false;
};

const open = async () => {
  onClose();
  visible.value = true;
  socket.on(eventName, update);
};

onUnmounted(async () => {
  onClose();
});
const ansi_up = new AnsiUp();
const filterData = computed(() => {
  return filter.traceId
    ? data.filter(it => {
        return it.traceId == filter.traceId;
      })
    : data;
});
const filter = reactive({
  traceId: "",
  level: ""
});
const logRef = ref(null);

const traceIds = reactive([]);
const data = reactive([]);
const lock = ref(false);
const update = async logEvent => {
  if (data.length > 10000) {
    data.slice(0, 1);
  }
  try {
    logEvent = JSON.parse(logEvent?.data);
  } catch (error) {}

  try {
    logEvent.message = ansi_up.ansi_to_html(logEvent.message);
  } catch (error) {}
  data.push(logEvent);
  if (traceIds.indexOf(logEvent.traceId) == -1) {
    traceIds.push(logEvent.traceId);
  }

  // if (!lock.value) {
  // logRef.value?.scrollTop = logRef.value?.scrollHeight;
  // }
};

defineExpose({
  update,
  open
});
</script>
