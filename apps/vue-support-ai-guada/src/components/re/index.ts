import type { App } from 'vue'
import ReButton from './ReButton.vue'
import ReInput from './ReInput.vue'
import ReSelect from './ReSelect.vue'
import ReModal from './ReModal.vue'
import ReTable from './ReTable.vue'
import ReCard from './ReCard.vue'
import ReSwitch from './ReSwitch.vue'
import ReTag from './ReTag.vue'
import ReEmpty from './ReEmpty.vue'

export {
  ReButton,
  ReInput,
  ReSelect,
  ReModal,
  ReTable,
  ReCard,
  ReSwitch,
  ReTag,
  ReEmpty,
}

export function installReComponents(app: App) {
  app.component('ReButton', ReButton)
  app.component('ReInput', ReInput)
  app.component('ReSelect', ReSelect)
  app.component('ReModal', ReModal)
  app.component('ReTable', ReTable)
  app.component('ReCard', ReCard)
  app.component('ReSwitch', ReSwitch)
  app.component('ReTag', ReTag)
  app.component('ReEmpty', ReEmpty)
}

export default {
  install: installReComponents,
}
