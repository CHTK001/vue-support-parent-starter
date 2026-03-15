# 编码问题文件列表

以下 68 个文件存在 UTF-8 编码问题（乱码），需要从 git 恢复后重新编辑：

## packages/components
1. packages/components/AliyunBenefitLayout/index.vue
2. packages/components/ReDialog/index.vue
3. packages/components/ReIcon/src/Select.vue
4. packages/components/ScContextMenu/ScContextMenuExample.vue
5. packages/components/ScCron/index.vue
6. packages/components/ScDebugConsole/index.vue
7. packages/components/ScDictSelect/index.vue
8. packages/components/ScDrag/ScDragExample.vue
9. packages/components/ScDymaicTable/columnSetting.vue
10. packages/components/ScEcharts/ScEchartsExample.vue
11. packages/components/ScEditor/ScEditorExample.vue
12. packages/components/ScFilterBar/index.vue
13. packages/components/ScFilterBar/src/index.vue
14. packages/components/ScImage/components/ImageEditor.vue
15. packages/components/ScInput/components/ListInput.vue
16. packages/components/ScInput/components/SelectInput.vue
17. packages/components/ScIp/index.vue
18. packages/components/ScMessageDialog/index.vue
19. packages/components/ScPromQL/demo.vue
20. packages/components/ScPromQL/index.vue
21. packages/components/ScSelect/components/DropdownLayout.vue
22. packages/components/ScSelect/components/FilterLayout.vue
23. packages/components/ScSelect/components/ScSelectTreeLayout.vue
24. packages/components/ScSocketMessageDialog/index-refactored.vue
25. packages/components/ScSwitch/components/ButtonLayout.vue
26. packages/components/ScTable/components/GalleryView.vue
27. packages/components/ScTable/components/TimelineView.vue
28. packages/components/ScTable/index.vue
29. packages/components/ScTable/plugins/columnSetting.vue
30. packages/components/ScTable/plugins/Pagination.vue
31. packages/components/ScUpload/file.vue
32. packages/components/ScWorkflow/nodes/approver.vue
33. packages/components/ScWorkflow/nodes/branch.vue
34. packages/components/ScWorkflow/nodes/promoter.vue
35. packages/components/ScWorkflow/nodes/send.vue
36. packages/components/ScWorkflow/select.vue

## packages/module
37. packages/module/memory/index.vue
38. packages/module/time/index.vue

## packages/pages
39. packages/pages/home/default/index.vue
40. packages/pages/home/default/layout/CustomLayout.vue
41. packages/pages/home/default/layout/DraggableLayout.vue
42. packages/pages/login/components/ThemeSwitcher.vue
43. packages/pages/page/message/MessageCenter.vue
44. packages/pages/sync-data/components/SyncTaskDesigner.vue
45. packages/pages/template/index.vue
46. packages/pages/template/save.vue

## packages/standalone
47. packages/standalone/ScLayer/components/BoundaryBreadcrumb.vue
48. packages/standalone/ScLayer/components/BoundaryPanel.vue
49. packages/standalone/ScLayer/components/MarkerDetail.vue

## layout
50. layout/default/src/components/lay-message/index.vue

## pages
51. pages/dict/src/components/layout.vue
52. pages/doc/src/components/ApiParamsEditor.vue
53. pages/doc/src/components/NodeSelector.vue
54. pages/example/src/components/ScCodeExample.vue
55. pages/example/src/components/ScLoadExample.vue
56. pages/example/src/components/ScSocketEventProcessExample.vue
57. pages/example/src/components/ScTreeExample.vue
58. pages/project/src/views/project/index.vue
59. pages/project/src/views/project/index20250903.vue
60. pages/strategy/src/views/limit/LimitConfigurationIndex.vue
61. pages/strategy/src/views/limit/LimitRecordIndex.vue
62. pages/system/src/holiday/HolidayIndex.vue
63. pages/system/src/job/JobIndex.vue
64. pages/tools/src/plugins/calculator.vue
65. pages/tools/src/plugins/css-beautify.vue
66. pages/tools/src/plugins/keycode.vue
67. pages/tools/src/plugins/meme.vue
68. pages/tools/src/plugins/pomodoro.vue

## 修复建议

使用 git 恢复这些文件：
```bash
# 恢复单个文件
git checkout -- <文件路径>

# 或批量恢复所有文件
git checkout -- packages/components/AliyunBenefitLayout/index.vue
# ... 其他文件
```

恢复后，使用支持 UTF-8 的编辑器重新编辑这些文件。
