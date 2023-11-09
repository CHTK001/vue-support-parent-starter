const me =
    [{
        "path": "/home",
        "component": "home/index",
        "name": "首页",
        "hidden": false,
        "meta": {
            "title": "首页",
            "icon": "el-icon-eleme-filled",
            "hidden": null,
            "tag": null,
            "affix": false,
            "type": "menu",
            "color": null,
            "roles": [],
            "keepAlive": null,
            "params": null
        }, "children": [{
                "path": "/dashboard",
                "component": "home",
                "name": "控制台",
                "hidden": false,
                "meta": {
                    "title": "控制台",
                    "icon": "el-icon-menu",
                    "hidden": null,
                    "tag": null,
                    "affix": false,
                    "type": "menu",
                    "color": null,
                    "roles": [],
                    "keepAlive": null,
                    "params": null
                }
            },
        ]
    }, {
        "path": "/scheduler",
        "component": "scheduler/index",
        "name": "调度管理",
        "hidden": false,
        "meta": {
            "title": "调度管理",
            "icon": "sc-icon-scheduler",
            "hidden": null,
            "affix": false,
            "type": "menu",
            "color": null,
            "roles": [],
            "keepAlive": null,
            "params": null
        },
        "children": [
            {
                "path": "/scheduler/jobgroup",
                "component": "scheduler/jobgroup/index",
                "name": "执行器管理",
                "hidden": false,
                "meta": {
                    "title": "执行器管理",
                    "icon": "el-icon-takeaway-box",
                    "affix": false,
                    "type": "menu",
                }
            },
            {
                "path": "/scheduler/jobinfo",
                "component": "scheduler/jobinfo/index",
                "name": "调度任务管理",
                "hidden": false,
                "meta": {
                    "title": "调度任务管理",
                    "icon": "el-icon-alarm-clock",
                    "affix": false,
                    "type": "menu",
                }
            },
            {
                "path": "/scheduler/joblog/cat/:logId",
                "component": "scheduler/joblog/cat",
                "name": "日志详情",
                "hidden": true,
                "meta": {
                    "title": "日志详情",
                    "icon": "el-icon-alarm-clock",
                    "affix": false,
                    "type": "menu",
                }
            },
            {
                "path": "/scheduler/joblog/:jobGroup/:jobId",
                "component": "scheduler/joblog/index",
                "name": "调度日志",
                "hidden": false,
                "meta": {
                    "title": "调度日志",
                    "icon": "el-icon-warning",
                    "affix": false,
                    "type": "menu",
                }
            },
           
        ]
    }
]

export default me;