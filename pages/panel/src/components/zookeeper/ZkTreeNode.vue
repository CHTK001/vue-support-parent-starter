<script lang="ts">
import { defineComponent, h, computed } from "vue";
import { ArrowRight, FolderOpened, Folder, Plus, Delete } from "@element-plus/icons-vue";
import { ElIcon, ElButton, ElTooltip } from "element-plus";

const ZkTreeNode = defineComponent({
  name: "ZkTreeNode",
  props: {
    node: { type: Object as () => any, required: true },
    activePath: { type: String, default: "" },
    search: { type: String, default: "" },
    depth: { type: Number, default: 0 },
  },
  emits: ["select", "expand", "create", "delete"],
  setup(props, { emit }) {
    const isActive = computed(() => props.activePath === props.node.path);
    const matchSearch = computed(() => {
      if (!props.search) return true;
      return props.node.path.toLowerCase().includes(props.search.toLowerCase());
    });
    return () => {
      if (!matchSearch.value && !props.node.children?.some((c: any) => c.path.includes(props.search))) {
        return null;
      }
      return h("div", { class: "zk-node" }, [
        h("div", {
          class: ["zk-node__row", isActive.value && "is-active"],
          style: { paddingLeft: `${props.depth * 16 + 8}px` },
          onClick: () => emit("select", props.node),
        }, [
          h("span", {
            class: ["zk-node__arrow", props.node.expanded && "is-expanded"],
            onClick: (e: Event) => { e.stopPropagation(); emit("expand", props.node); },
          }, [
            props.node.loading
              ? h(ElIcon, { class: "is-loading" }, () => h(ArrowRight))
              : h(ElIcon, {}, () => h(props.node.hasChildren !== false ? ArrowRight : ArrowRight)),
          ]),
          h(ElIcon, { class: "zk-node__icon" }, () => h(props.node.expanded ? FolderOpened : Folder)),
          h("span", { class: "zk-node__name" }, props.node.name || "/"),
          h("div", { class: "zk-node__actions", onClick: (e: Event) => e.stopPropagation() }, [
            h(ElTooltip, { content: "创建子节点" }, {
              default: () => h(ElButton, {
                icon: Plus, circle: true, plain: true, size: "small",
                onClick: () => emit("create", props.node.path),
              }),
            }),
            h(ElTooltip, { content: "删除" }, {
              default: () => h(ElButton, {
                icon: Delete, circle: true, plain: true, size: "small", type: "danger",
                onClick: () => emit("delete", props.node.path),
              }),
            }),
          ]),
        ]),
        props.node.expanded && props.node.children?.length
          ? h("div", { class: "zk-node__children" },
              props.node.children.map((child: any) =>
                h(ZkTreeNode, {
                  key: child.path,
                  node: child,
                  activePath: props.activePath,
                  search: props.search,
                  depth: props.depth + 1,
                  onSelect: (n: any) => emit("select", n),
                  onExpand: (n: any) => emit("expand", n),
                  onCreate: (p: string) => emit("create", p),
                  onDelete: (p: string) => emit("delete", p),
                })
              )
            )
          : null,
      ]);
    };
  },
});

export default ZkTreeNode;
export { ZkTreeNode };
</script>
