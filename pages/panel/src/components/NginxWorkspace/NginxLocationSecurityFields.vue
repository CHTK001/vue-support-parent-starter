<template>
  <section class="nginx-location-security">
    <div class="nginx-location-security__head">
      <strong>流量治理</strong>
      <span>限流只写 location 级指令；rate 仍需在 http 级别预先定义 limit_req_zone。</span>
    </div>

    <div class="nginx-location-security__grid">
      <div class="nginx-location-security__card">
        <div class="nginx-location-security__card-head">
          <strong>限流</strong>
          <span>按 location 控制突发与拒绝策略</span>
        </div>
        <div class="nginx-location-security__row">
          <label>限流区</label>
          <input v-model="location.limitReqZone" class="nginx-location-security__input" placeholder="zone=api_zone" />
        </div>
        <div class="nginx-location-security__row">
          <label>突发队列</label>
          <input v-model="location.limitReqBurst" class="nginx-location-security__input" type="number" placeholder="20" />
        </div>
        <div class="nginx-location-security__row">
          <label>nodelay</label>
          <ElSwitch v-model="location.limitReqNoDelay" active-text="on" inactive-text="off" />
        </div>
      </div>

      <div class="nginx-location-security__card">
        <div class="nginx-location-security__card-head">
          <strong>访问控制</strong>
          <span>白名单在前，黑名单在后</span>
        </div>
        <div class="nginx-location-security__row nginx-location-security__row--stack">
          <label>allow</label>
          <ScSelect
            v-model="allowList"
            multiple
            filterable
            allow-create
            collapse-tags
            collapse-tags-tooltip
            placeholder="允许的 IP / 网段"
          >
            <ElOption v-for="item in allowPresets" :key="item" :label="item" :value="item" />
          </ScSelect>
        </div>
        <div class="nginx-location-security__row nginx-location-security__row--stack">
          <label>deny</label>
          <ScSelect
            v-model="denyList"
            multiple
            filterable
            allow-create
            collapse-tags
            collapse-tags-tooltip
            placeholder="拒绝的 IP / 网段"
          >
            <ElOption v-for="item in denyPresets" :key="item" :label="item" :value="item" />
          </ScSelect>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElOption, ElSwitch } from "element-plus";
import ScSelect from "@repo/components/ScSelect/src/index.vue";
import type { NginxLocationBlock } from "../../api/nginx";

const props = defineProps<{
  location: NginxLocationBlock;
}>();

const allowPresets = ["all", "127.0.0.1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"];
const denyPresets = ["all", "127.0.0.1", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"];

const allowList = computed<string[]>({
  get: () => props.location.allowList || [],
  set: value => {
    props.location.allowList = value.filter(Boolean);
  },
});

const denyList = computed<string[]>({
  get: () => props.location.denyList || [],
  set: value => {
    props.location.denyList = value.filter(Boolean);
  },
});
</script>

<style scoped lang="scss">
.nginx-location-security {
  display: grid;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.nginx-location-security__head {
  display: grid;
  gap: 4px;

  strong {
    color: #0f172a;
    font-size: 13px;
  }

  span {
    color: #64748b;
    font-size: 12px;
    line-height: 1.6;
  }
}

.nginx-location-security__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.nginx-location-security__card {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.nginx-location-security__card-head {
  display: grid;
  gap: 2px;

  strong {
    color: #0f172a;
    font-size: 13px;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.nginx-location-security__row {
  display: grid;
  grid-template-columns: 74px minmax(0, 1fr);
  align-items: center;
  gap: 10px;

  label {
    color: #475569;
    font-size: 12px;
    font-weight: 600;
  }
}

.nginx-location-security__row--stack {
  align-items: start;
}

.nginx-location-security__input {
  width: 100%;
  height: 34px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 10px;
  background: #fff;
  color: #0f172a;
  outline: none;
}

@media (max-width: 980px) {
  .nginx-location-security__grid {
    grid-template-columns: 1fr;
  }
}
</style>
