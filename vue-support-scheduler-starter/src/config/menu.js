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
            "tag": "NEW",
            "affix": false,
            "type": "menu",
            "color": null,
            "roles": [],
            "keepAlive": null,
            "params": null
        },
        "children": [
            {
                "path": "/scheduler/jobinfo",
                "component": "scheduler/jobinfo/index",
                "name": "调度任务管理",
                "hidden": false,
                "meta": {
                    "title": "调度任务管理",
                    "icon": "el-icon-alarm-clock",
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
            {
                "path": "/scheduler/joblog/:jobGroup/:jobId",
                "component": "scheduler/joblog/index",
                "name": "调度日志",
                "hidden": false,
                "meta": {
                    "title": "调度日志",
                    "icon": "el-icon-warning",
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
            {
                "path": "/scheduler/jobgroup",
                "component": "scheduler/jobgroup/index",
                "name": "执行器管理",
                "hidden": false,
                "meta": {
                    "title": "执行器管理",
                    "icon": "el-icon-takeaway-box",
                    "hidden": null,
                    "tag": null,
                    "affix": false,
                    "type": "menu",
                    "color": null,
                    "roles": [],
                    "keepAlive": null,
                    "params": null
                }
            }
        ]
    }
]

export default me;