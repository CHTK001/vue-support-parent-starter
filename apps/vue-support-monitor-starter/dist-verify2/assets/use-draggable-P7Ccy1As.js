import { Ut as watchEffect, ct as onMounted, it as onBeforeUnmount, vn as ref } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { t as clamp } from "./clamp--xaQdoQg.js";
import { n as addUnit } from "./style-D30oR_2q.js";
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/hooks/use-draggable/index.mjs
var useDraggable = (targetRef, dragRef, draggable, overflow) => {
	const transform = {
		offsetX: 0,
		offsetY: 0
	};
	const isDragging = ref(false);
	const adjustPosition = (moveX, moveY) => {
		if (targetRef.value) {
			const { offsetX, offsetY } = transform;
			const targetRect = targetRef.value.getBoundingClientRect();
			const targetLeft = Math.max(targetRect.left, 0);
			const targetTop = Math.max(targetRect.top, 0);
			const targetWidth = targetRect.width;
			const targetHeight = targetRect.height;
			const clientWidth = document.documentElement.clientWidth;
			const clientHeight = document.documentElement.clientHeight;
			const minLeft = -targetLeft + offsetX;
			const minTop = -targetTop + offsetY;
			const maxLeft = clientWidth - targetLeft - targetWidth + offsetX;
			const maxTop = clientHeight - targetTop - (targetHeight < clientHeight ? targetHeight : 0) + offsetY;
			if (!overflow?.value) {
				moveX = clamp(moveX, minLeft, maxLeft);
				moveY = clamp(moveY, minTop, maxTop);
			}
			transform.offsetX = moveX;
			transform.offsetY = moveY;
			targetRef.value.style.transform = `translate(${addUnit(moveX)}, ${addUnit(moveY)})`;
		}
	};
	const onMousedown = (e) => {
		const downX = e.clientX;
		const downY = e.clientY;
		const { offsetX, offsetY } = transform;
		const onMousemove = (e) => {
			if (!isDragging.value) isDragging.value = true;
			adjustPosition(offsetX + e.clientX - downX, offsetY + e.clientY - downY);
		};
		const onMouseup = () => {
			isDragging.value = false;
			document.removeEventListener("mousemove", onMousemove);
			document.removeEventListener("mouseup", onMouseup);
		};
		document.addEventListener("mousemove", onMousemove);
		document.addEventListener("mouseup", onMouseup);
	};
	const onDraggable = () => {
		if (dragRef.value && targetRef.value) {
			dragRef.value.addEventListener("mousedown", onMousedown);
			window.addEventListener("resize", updatePosition);
		}
	};
	const offDraggable = () => {
		if (dragRef.value && targetRef.value) {
			dragRef.value.removeEventListener("mousedown", onMousedown);
			window.removeEventListener("resize", updatePosition);
		}
	};
	const resetPosition = () => {
		transform.offsetX = 0;
		transform.offsetY = 0;
		if (targetRef.value) targetRef.value.style.transform = "";
	};
	const updatePosition = () => {
		const { offsetX, offsetY } = transform;
		adjustPosition(offsetX, offsetY);
	};
	onMounted(() => {
		watchEffect(() => {
			if (draggable.value) onDraggable();
			else offDraggable();
		});
	});
	onBeforeUnmount(() => {
		offDraggable();
	});
	return {
		isDragging,
		resetPosition,
		updatePosition
	};
};
//#endregion
export { useDraggable as t };
