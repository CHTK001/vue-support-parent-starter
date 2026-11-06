<template>
  <ReDialog
    v-model="visible"
    title="Φ«╛σñçσñºσ▒Å"
    width="92vw"
    top="5vh"
    :draggable="false"
    :fullscreenable="true"
    :close-on-click-modal="false"
    :show-footer="false"
    destroy-on-close
  >
    <div class="dwall__body">
      <ReDevicePlayPanel
        v-if="visible"
        mode="wall"
        :device="null"
        :devices="devices"
        :vendors="vendors"
      />
    </div>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * Φ«╛σñçσñºσ▒ÅµÆ¡µö╛σÅ░
 *
 * <p>Θí╢Θâ¿πÇîΦ«╛σñçσñºσ▒ÅπÇìµîëΘÆ«µëôσ╝Ç∩╝Üσ╖ªΣ╛ºµÿ»µëÇµ£ëσÅ»µÆ¡µö╛Φ«╛σñçτÜäΘÇÜΘüô∩╝îσÅ│Σ╛ºµÿ»τö╗Θ¥óσóÖ∩╝î
 * τ¢┤µÄÑσñìτö¿µÆ¡µö╛Θí╡τ¡╛τÜäσÅûµ╡üΣ╕Äµïûµï╜ΘÇ╗Φ╛æ∩╝ê{@link ReDevicePlayPanel} τÜä wall σ╜óµÇü∩╝ë∩╝î
 * Σ╕ìσåìΦ╖│σê░τï¼τ½ïτÜä DeviceScreen Φ╖»τö▒πÇé</p>
 *
 * <p>σ╝╣τ¬ùσåàΣ╕ìµÉ║σ╕ªΣ╗╗Σ╜òσÅ░Φ┤ªΣ┐íµü»∩╝îσÅ¬Φºúσå│πÇîτÄ░σ£¿µèèσô¬σçáΦ╖»τö╗Θ¥óµæåσê░Σ╕ÇΦ╡╖τ£ïπÇìπÇé</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import ReDialog from '@repo/ui/re-dialog'
import ReDevicePlayPanel from '@pages/device/src/components/ReDevicePlayPanel.vue'
import type { DeviceInfo, DeviceVendorDescriptor } from '@pages/device/src/types/device'

defineProps<{
  /** σÅ░Φ┤ªΘçîτÜäσà¿Θâ¿Φ«╛σñç∩╝êσÅ»µÆ¡µö╛τÜäµëìΣ╝ÜΦ┐¢σàÑτö╗Θ¥óµ║É∩╝ë */
  devices: DeviceInfo[]
  /** σÄéσòåµÅÅΦ┐░τ¼ª∩╝ÜµÅÉΣ╛¢Φâ╜σè¢Σ╜ì∩╝îσêñµû¡σô¬Σ║¢Φ«╛σñçΦâ╜σç║τö╗Θ¥ó */
  vendors: DeviceVendorDescriptor[]
}>()

const visible = defineModel<boolean>({ default: false })
</script>

<style scoped>
/* σ╝╣τ¬ù body σ╖▓µ£ëσåàΦ╛╣Φ╖¥∩╝îΦ┐ÖΘçîσÅ¬µèèµÆ¡µö╛σÅ░µÆæσê░µÄÑΦ┐æµò┤σ▒Å */
.dwall__body {
  height: calc(84vh - 110px);
  min-height: 420px;
}
</style>
