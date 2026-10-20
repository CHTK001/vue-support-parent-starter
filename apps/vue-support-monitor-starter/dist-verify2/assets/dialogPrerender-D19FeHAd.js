//#region src/utils/dialogPrerender.ts
/**
* 弹窗预渲染 —— 已禁用
*
* 之前实现在页面空闲时自动打开弹窗预渲染，导致每次进页面都能看到
* 弹窗闪烁一下。改为空操作，不再预渲染。
*/
function useDialogPrerender(_visible, _delay = 2500) {}
//#endregion
export { useDialogPrerender as t };
