declare module "sortablejs" {
  interface SortableEvent {
    to: HTMLElement;
    from: HTMLElement;
    item: HTMLElement;
    clone: HTMLElement;
    oldIndex: number;
    newIndex: number;
    oldDraggableIndex: number;
    newDraggableIndex: number;
    originalEvent: Event;
    pullMode: string | boolean | undefined;
    isTrusted: boolean;
  }

  interface SortableOptions {
    group?: any;
    sort?: boolean;
    delay?: number;
    disabled?: boolean;
    animation?: number;
    handle?: string;
    filter?: string;
    draggable?: string;
    ghostClass?: string;
    chosenClass?: string;
    dragClass?: string;
    direction?: string;
    scroll?: boolean;
    onStart?: (event: SortableEvent) => void;
    onEnd?: (event: SortableEvent) => void;
    onAdd?: (event: SortableEvent) => void;
    onUpdate?: (event: SortableEvent) => void;
    onSort?: (event: SortableEvent) => void;
    onRemove?: (event: SortableEvent) => void;
    onFilter?: (event: SortableEvent) => void;
    onMove?: (evt: SortableEvent, originalEvent: Event) => boolean | -1 | 1;
    [key: string]: any;
  }

  interface SortableInstance {
    destroy(): void;
    option(name: string, value?: any): any;
    toArray(): string[];
    sort(order: string[]): void;
  }

  interface SortableConstructor {
    new(element: HTMLElement | string, options: SortableOptions): SortableInstance;
    create(element: HTMLElement | string, options: SortableOptions): SortableInstance;
  }

  const Sortable: SortableConstructor;
  export default Sortable;
}