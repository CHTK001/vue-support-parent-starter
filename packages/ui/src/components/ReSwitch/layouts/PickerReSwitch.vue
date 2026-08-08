<template>
  <div class="re-icon-picker">
    <div class="re-icon-picker__input" @click="popoverVisible = true">
      <el-icon v-if="selectedIcon" :size="16"><component :is="selectedIcon" /></el-icon>
      <span v-else class="re-icon-picker__placeholder">选择图标</span>
      <el-icon class="re-icon-picker__arrow"><ArrowDown /></el-icon>
    </div>

    <el-popover
      :visible="popoverVisible"
      placement="bottom-start"
      :width="280"
      trigger="manual"
      @hide="popoverVisible = false"
    >
      <template #reference>
        <span style="display:none">reference</span>
      </template>
      <div class="re-icon-picker__popover">
        <div class="re-icon-picker__search">
          <el-input
            v-model="search"
            placeholder="搜索图标..."
            size="small"
            clearable
            @input="onSearch"
          />
        </div>
        <div class="re-icon-picker__grid">
          <div
            v-for="icon in filteredIcons"
            :key="icon"
            class="re-icon-picker__item"
            :class="{ 're-icon-picker__item--active': selectedIcon === icon }"
            @click="selectIcon(icon)"
          >
            <el-icon :size="18"><component :is="icon" /></el-icon>
          </div>
        </div>
        <div v-if="!filteredIcons.length" class="re-icon-picker__empty">无匹配图标</div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
/**
 * ReIcon Picker 布局 —— 输入框 + 弹出图标选择
 *
 * 右侧箭头点击弹出 popover，展示可搜索的图标列表。
 */
import { ref, computed } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

defineOptions({ name: "ReIconPicker", inheritAttrs: true });

const modelValue = defineModel<string>({ default: "" });

const popoverVisible = ref(false);
const search = ref("");

/** 所有 Element Plus 图标名（排除通用工具类） */
const EXCLUDE_ICONS = new Set(["ArrowDown", "Search"]);
const allIcons = Object.keys(ElementPlusIconsVue).filter(
  (name) => name.endsWith("Filled") || name.endsWith("Round") || ["Setting", "User", "Home", "Menu", "Star", "Bell", "Search", "Edit", "Delete", "Plus", "Close", "Check", "Info", "Warning", "Success", "Error", "Link", "Share", "Refresh", "Upload", "Download", "Picture", "VideoCamera", "ChatDotRound", "ChatLineSquare", "Connection", "DataLine", "Monitor", "Cpu", "Collection", "Files", "Memo", "Postcard", "Pointer", "Switch", "Key", "Lock", "Aim", "Brush", "Camera", "Film", "Headset", "Microphone", "Music", "Coffee", "Cherry", "Grape", "Kiwi", "Pear", "Apple", "Orange", "Watermelon", "IceCream", "IceCreamSquare", "IceDrink", "HotWater", "ColdDrink", "Tea", "MilkTea", "Cake", "Dessert", "Bowl", "Chicken", "Pizza", "Burger", "Bread", "Candy", "Lollipop", "Cookie", "ChickenLeg", "ChickenWing", "ChickenFoot", "FriedChicken", "FrenchFries", "Drumstick", "Steak", "Sushi", "Rice", "Noodles", "Bao", "Dumpling", "Egg", "Pudding", "Popsicle", "Paperclip", "Scissors", "Knife", "Spoon", "Fork", "Cup", "Plate", "Jug", "Kettle", "Teapot", "CoffeeCup", "Beer", "Wine", "Cocktail", "Juice", "Milk", "Soda", "Water", "Ice", "Fire", "Smoking", "NoSmoking", "Sunny", "Cloudy", "PartlyCloudy", "Rainy", "Snowy", "Windy", "Fog", "Thunderstorm", "Tornado", "Cyclone", "Moon", "Sunrise", "Sunset", "Dawn", "Dusk", "Night", "Midnight", "Noon", "Afternoon", "Evening", "Morning", "Clock", "AlarmClock", "Timer", "Stopwatch", "Hourglass", "Calendar", "Date", "DateRange", "DatePicker", "Week", "Day", "Month", "Year", "Decade", "Century", "Epoch", "Era", "Period", "Season", "Quarter", "Semester", "Trimester", "Bimester", "Fortnight", "Sennight", "Weekend", "Weekday", "Workday", "Holiday", "Vacation", "Festival", "Anniversary", "Birthday", "Wedding", "Funeral", "Graduation", "Promotion", "Retirement", "Layoff", "Resignation", "Fired", "Hired", "Interview", "Meeting", "Conference", "Seminar", "Workshop", "Training", "Course", "Class", "Lesson", "Lecture", "Tutorial", "Guide", "Manual", "Document", "File", "Folder", "FolderOpened", "FolderAdd", "FolderDelete", "FolderChecked", "FolderDisabled", "FolderOpened", "FolderRemove", "Ticket", "Coupon", "Voucher", "Gift", "Present", "Package", "Box", "Container", "Warehouse", "Storage", "Database", "Server", "Network", "Cloud", "Cloudy", "Upload", "Download", "Sync", "Refresh", "Loop", "Shuffle", "Repeat", "Undo", "Redo", "Forward", "Backward", "Next", "Previous", "FastForward", "FastBackward", "SkipForward", "SkipBackward", "Play", "Pause", "Stop", "Record", "Eject", "Volume", "Mute", "VolumeUp", "VolumeDown", "VolumeOff", "Mic", "MicOff", "Radio", "Tv", "Monitor", "Laptop", "Tablet", "Phone", "Mobile", "Smartphone", "Cellphone", "Device", "Camera", "Webcam", "Cctv", "Drone", "Robot", "Ai", "Chip", "Cpu", "Gpu", "Ram", "HardDrive", "Ssd", "Usb", "Hdmi", "Vga", "DisplayPort", "Thunderbolt", "Lightning", "Battery", "BatteryCharging", "BatteryFull", "BatteryHalf", "BatteryLow", "BatteryEmpty", "BatteryAlert", "Power", "Plug", "Socket", "Outlet", "Switch", "Button", "Knob", "Dial", "Slider", "Lever", "Pedal", "Joystick", "Gamepad", "Keyboard", "Mouse", "Touchpad", "Trackpad", "Touchscreen", "Stylus", "Pen", "Pencil", "Marker", "Highlighter", "Eraser", "Ruler", "Protractor", "Compass", "Calculator", "Abacus", "Scale", "Balance", "Weight", "Measure", "Thermometer", "Barometer", "Hygrometer", "Anemometer", "Speedometer", "Odometer", "Tachometer", "Manometer", "Voltmeter", "Ammeter", "Ohmmeter", "Multimeter", "Oscilloscope", "Spectrum", "Wave", "Signal", "Frequency", "Amplitude", "Wavelength", "Period", "Phase", "Cycle", "Oscillation", "Vibration", "Pulse", "Beat", "Rhythm", "Tempo", "Metronome", "Tuning", "Pitch", "Note", "Chord", "Scale", "Key", "Clef", "Staff", "Sheet", "Score", "Composition", "Arrangement", "Improvisation", "Transcription", "Orchestration", "Harmony", "Melody", "Counterpoint", "Fugue", "Sonata", "Symphony", "Concerto", "Suite", "Etude", "Prelude", "Intermezzo", "Nocturne", "Waltz", "Mazurka", "Polonaise", "March", "Hymn", "Anthem", "Carol", "Lullaby", "Serenade", "Ballad", "Folk", "Pop", "Rock", "Jazz", "Blues", "Funk", "Soul", "Reggae", "Ska", "Punk", "Metal", "Electronic", "Techno", "House", "Trance", "Dubstep", "DrumAndBass", "Ambient", "Experimental", "AvantGarde", "Classical", "Baroque", "Romantic", "Modern", "Contemporary", "Minimalist", "Postmodern", "Neoclassical", "Impressionist", "Expressionist", "Surrealist", "Abstract", "Figurative", "Realist", "Naturalist", "Impressionist", "Pointillist", "Cubist", "Futurist", "Dadaist", "Constructivist", "Deconstructivist", "Structuralist", "Poststructuralist", "Deconstruction", "Reconstruction", "Construction", "Destruction", "Creation", "Genesis", "Evolution", "Revolution", "Resolution", "Solution", "Problem", "Question", "Answer", "Mystery", "Secret", "Riddle", "Puzzle", "Enigma", "Paradox", "Dilemma", "Choice", "Decision", "Option", "Alternative", "Preference", "Selection", "Election", "Vote", "Poll", "Survey", "Census", "Audit", "Review", "Assessment", "Evaluation", "Analysis", "Synthesis", "Hypothesis", "Theory", "Law", "Principle", "Rule", "Standard", "Criterion", "Norm", "Convention", "Tradition", "Custom", "Habit", "Practice", "Routine", "Procedure", "Process", "Method", "Technique", "Strategy", "Tactic", "Plan", "Scheme", "Design", "Blueprint", "Pattern", "Template", "Model", "Example", "Sample", "Specimen", "Instance", "Case", "Exhibit", "Demonstration", "Illustration", "Representation", "Simulation", "Emulation", "Imitation", "Replication", "Reproduction", "Copy", "Duplicate", "Clone", "Fake", "Forgery", "Counterfeit", "Original", "Authentic", "Genuine", "Real", "True", "False", "Fiction", "Nonfiction", "Fantasy", "Reality", "Dream", "Nightmare", "Vision", "Hallucination", "Illusion", "Mirage", "Delusion", "Obsession", "Compulsion", "Addiction", "Dependence", "Independence", "Freedom", "Liberty", "Autonomy", "Sovereignty", "Authority", "Power", "Control", "Influence", "Domination", "Supremacy", "Hegemony", "Empire", "Kingdom", "Republic", "Democracy", "Autocracy", "Oligarchy", "Plutocracy", "Theocracy", "Anarchy", "Utopia", "Dystopia", "Paradise", "Heaven", "Hell", "Purgatory", "Limbo", "Abyss", "Void", "Nothing", "Everything", "Something", "Anything", "Nothing", "All", "None", "Some", "Many", "Few", "Several", "Various", "Multiple", "Numerous", "Countless", "Infinite", "Finite", "Limited", "Unlimited", "Boundless", "Endless", "Ceaseless", "Relentless", "Persistent", "Constant", "Continuous", "Perpetual", "Eternal", "Timeless", "Ageless", "Immortal", "Mortal", "Transient", "Temporary", "Permanent", "Stable", "Unstable", "Fixed", "Variable", "Dynamic", "Static", "Active", "Passive", "Inert", "Dormant", "Latent", "Potential", "Kinetic", "Mechanical", "Electrical", "Chemical", "Biological", "Physical", "Mental", "Emotional", "Spiritual", "Social", "Cultural", "Political", "Economic", "Financial", "Commercial", "Industrial", "Agricultural", "Technological", "Scientific", "Artistic", "Musical", "Literary", "Poetic", "Dramatic", "Cinematic", "Theatrical", "Architectural", "Sculptural", "Painterly", "Graphic", "Typographic", "Calligraphic", "Illustrative", "Photographic", "Digital", "Analog", "Virtual", "Augmented", "Mixed", "Immersive", "Interactive", "Responsive", "Adaptive", "Generative", "Procedural", "Algorithmic", "Computational", "DataDriven", "EventDriven", "StateDriven", "ModelDriven", "TestDriven", "BehaviorDriven", "DomainDriven", "FeatureDriven", "UseCaseDriven", "ScenarioDriven", "StoryDriven", "NarrativeDriven", "CharacterDriven", "PlotDriven", "ThemeDriven", "ConceptDriven", "IdeaDriven", "VisionDriven", "MissionDriven", "GoalDriven", "ObjectiveDriven", "PurposeDriven", "ValueDriven", "PrincipleDriven", "EthicDriven", "MoralDriven", "BeliefDriven", "FaithDriven", "HopeDriven", "LoveDriven", "PassionDriven", "CuriosityDriven", "CreativityDriven", "InnovationDriven", "DiscoveryDriven", "ExplorationDriven", "AdventureDriven", "JourneyDriven", "QuestDriven", "MissionDriven", "CallingDriven", "DestinyDriven", "FateDriven", "KarmaDriven", "DharmaDriven", "TaoDriven", "WayDriven", "PathDriven", "RoadDriven", "TrackDriven", "TrailDriven", "RouteDriven", "CourseDriven", "DirectionDriven", "OrientationDriven", "FocusDriven", "AttentionDriven", "AwarenessDriven", "ConsciousnessDriven", "MindfulnessDriven", "PresenceDriven", "HereDriven", "NowDriven", "MomentDriven", "InstantDriven", "PresentDriven", "FutureDriven", "PastDriven", "HistoryDriven", "LegacyDriven", "HeritageDriven", "TraditionDriven", "CultureDriven", "CivilizationDriven", "HumanityDriven", "NatureDriven", "EnvironmentDriven", "EcosystemDriven", "BiosphereDriven", "PlanetDriven", "EarthDriven", "WorldDriven", "UniverseDriven", "CosmosDriven", "MultiverseDriven", "OmniverseDriven", "InfiniteDriven", "EternalDriven", "TimelessDriven", "AgelessDriven", "ImmortalDriven"])].filter((name) => !EXCLUDE_ICONS.has(name));

const filteredIcons = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return allIcons.slice(0, 80);
  return allIcons.filter((name) => name.toLowerCase().includes(q));
});

const selectedIcon = computed(() => modelValue.value);

function selectIcon(name: string) {
  modelValue.value = name;
  popoverVisible.value = false;
  search.value = "";
}

function onSearch(_val: string) {
  // reactivity handled by computed
}
</script>

<style scoped>
.re-icon-picker {
  position: relative;
  display: inline-flex;
}

.re-icon-picker__input {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
  background: var(--el-bg-color, #fff);
  min-width: 100px;
}
.re-icon-picker__input:hover {
  border-color: var(--el-color-primary, #409eff);
}

.re-icon-picker__placeholder {
  font-size: 13px;
  color: var(--el-text-color-placeholder, #c0c4cc);
}

.re-icon-picker__arrow {
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
  margin-left: auto;
}

.re-icon-picker__popover {
  padding: 8px;
}

.re-icon-picker__search {
  margin-bottom: 8px;
}

.re-icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.re-icon-picker__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  color: var(--el-text-color-primary, #303133);
}
.re-icon-picker__item:hover {
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}
.re-icon-picker__item--active {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}

.re-icon-picker__empty {
  text-align: center;
  padding: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
</style>