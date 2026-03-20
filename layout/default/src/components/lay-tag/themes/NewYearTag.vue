<script setup lang="ts">
</template>

<style lang="scss">
@use "./default.scss";

html[data-skin="spring-festival"],
html.theme-spring-festival {
  .tags-view.new-year-tag {
    background: rgba(107, 0, 0, 0.88) !important;
    border-bottom: 1px solid rgba(255, 215, 0, 0.4) !important;
    box-shadow: 0 6px 18px rgba(76, 0, 0, 0.24) !important;
  }

  .new-year-tag .scroll-item {
    background: rgba(139, 0, 0, 0.58) !important;
    border: 1px solid rgba(255, 215, 0, 0.28) !important;
    color: rgba(255, 215, 0, 0.92) !important;

    &:hover {
      background: rgba(255, 215, 0, 0.14) !important;
      color: #fff7d1 !important;
    }

    &.active,
    &.is-active {
      background: linear-gradient(
        135deg,
        rgba(255, 215, 0, 0.92),
        rgba(255, 165, 0, 0.82)
      ) !important;
      border-color: #ffd700 !important;
      color: #8b0000 !important;
      box-shadow: 0 0 15px rgba(255, 215, 0, 0.35) !important;
    }

    .tag-title {
      color: inherit !important;
    }
  }
}
</style>
