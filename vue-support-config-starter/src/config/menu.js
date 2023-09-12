const me = {
    "content": [
   
        {
            "path": "/config",
            "component": "config/index",
            "name": "配置中心",
            "hidden": false,
            "meta": {
                "title": "配置中心",
                "icon": "sc-icon-mapping-v2",
                "hidden": null,
                "tag": null,
                "affix": false,
                "type": "menu",
                "color": null,
                "roles": [],
                "keepAlive": null,
                "params": null
            },
            "children": [
                {
                    "path": "/config/bean",
                    "component": "config/bean/index",
                    "name": "统一脚本",
                    "hidden": false,
                    "meta": {
                        "title": "统一脚本",
                        "icon": "sc-icon-script",
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
                    "path": "/config/log",
                    "component": "config/log/index",
                    "name": "统一日志",
                    "hidden": false,
                    "meta": {
                        "title": "统一日志",
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
                    "path": "/config/trace",
                    "component": "config/trace/index",
                    "name": "统一链路",
                    "hidden": false,
                    "meta": {
                        "title": "统一链路",
                        "icon": "sc-icon-trace",
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
                    "path": "/config/actuator",
                    "component": "config/actuator/index",
                    "name": "监控管理",
                    "hidden": false,
                    "meta": {
                        "title": "监控管理",
                        "icon": "sc-icon-sc",
                        "hidden": null,
                        "tag": "NEW",
                        "affix": false,
                        "type": "menu",
                        "color": null,
                        "roles": [],
                        "keepAlive": null,
                        "params": null
                    }
                },
                {
                    "path": "/config/actuator/oshi/:id",
                    "component": "config/actuator/oshi.vue",
                    "name": "OSHI",
                    "hidden": true,
                    "meta": {
                        "title": "OSHI",
                        "icon": "",
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
                    "path": "/config/config",
                    "component": "config/config/index",
                    "name": "统一配置",
                    "hidden": false,
                    "meta": {
                        "title": "统一配置",
                        "icon": "el-icon-grid",
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
        },
    
    ],
    "datetime": 0
}

  export default me;