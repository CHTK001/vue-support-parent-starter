<template>
    <div id="map" style="width: 100%; height: 100%;"></div>
</template>

<script>
import AMapLoader from '@amap/amap-jsapi-loader';
export default {
    name: 'Gis',
    props: {
        plugin: {
            type: Array,
            default: () => ['AMap.ToolBar', 'AMap.Scale', 'AMap.Geolocation', 'AMap.HawkEye', 'AMap.PlaceSearch', 'AMap.Driving']
        },
        center: {
            type: Array,
            default: () => [104.065735, 30.659462]
        },
        zoom: {
            type: Number,
            default: 15
        },
        mapStyle: {
            type: String,
            default: 'normal' //normal、grey、whitesmoke、dark、light、graffiti
        },
        debug: {
            type: Boolean,
            default: true
        }
    },
    data() {
        return {
            map: null,
            AMap: null,
            traffic: null,
            toolbar: null,
            placeSearch: null,
            driving: null,
            clickEvent: null,
        }
    },
    created() {
        this.initMap();
        this.initPlugin();
        this.initTraffic();
    },
    unmounted() {
        this.map?.destroy();
        this.map?.off("click", this.clickEvent);
        this.map = null;
    },
    methods: {
        /**
         * 创建点
         * @param {*} pos 
         * @param {*} content 
         * @param {*} callback 
         */
        createMarker(pos, content, options = {}) {
            const marker = new this.AMap.Marker({
                position: pos,
                content: content,
                ...options
            });
            return marker;
        },

        /**
         * 创建多边形
         * @param {*} pathArr 
         * @param {*} options 
         * @returns 
         */
        createPolygon(pathArr, options = {
            fillColor: "#ccebc5", //多边形填充颜色
            strokeOpacity: 1, //线条透明度
            fillOpacity: 0.5, //填充透明度
            strokeColor: "#2b8cbe", //线条颜色
            strokeWeight: 1, //线条宽度
            strokeStyle: "dashed", //线样式
            strokeDasharray: [5, 5], //轮廓的虚线和间隙的样式
        }) {
            return new this.AMap.Polygon({
                path: pathArr, //多边形路径
                ...options
            });
        },
        addCircle(options = {

        }) {

        },
        /**
         * 添加线
         * @param {*} options 
         */
        createLine(options = {
            strokeColor: '#80d8ff', //描边的颜色
            isOutline: true, //包含轮廓
            lineJoin: 'bevel', //折线拐点连接处样式
            outerlineColor: 'white',
            strokeStyle: 'solid', //线样式
            lineCap: 'round', //线端点样式
            showDir: true, //是否显示方向箭头
            strokeWeight: 6, //线的宽度
        }) {
            return new this.AMap.Polyline(options);
        },
        /**
         * 创建经纬度
         * @param {*} lng 
         * @param {*} lat 
         * @returns 
         */
        createLngLat(lng, lat) {
            return new this.AMap.LngLat(lng, lat);
        },
        /**
         * 显示/隐藏交通
         * @param {*} show 
         */
        traffic(show = true) {
            if (show) {
                this.traffic?.show();
                return;
            }
            this.traffic?.hide();
        },
        /**
         * 显示/隐藏工具条
         * @param {*} show 
         */
        toolbar(show = true) {
            if (show) {
                this.toolbar?.show();
                return;
            }
            this.toolbar?.hide();
        },
        /**
         * 地图搜索
         * @param {*} query 
         */
        placeSearch(query, callback = () => { }) {
            this.placeSearch?.search(query, callback)
        },
        /**
         * 驾车搜索
         * @param {*} startLngLat 
         * @param {*} endLngLat 
         * @param {*} callback 
         */
        drivingSearch(startLngLat, endLngLat, callback = () => { }) {
            this.driving.search(startLngLat, endLngLat);
        },
        /**
         * 初始化地图
         */
        initPlugin() {
            //异步加载工具条插件
            this.AMap.plugin(this.plugin, function () {
                //在回调函数中实例化插件
                if (this.plugin.indexOf('AMap.Scale') > -1) {
                    this.map.addControl(new AMap.Scale()); //异步同时加载多个插件
                }

                if (this.plugin.indexOf('AMap.PlaceSearch') > -1) {
                    this.map.addControl(new AMap.PlaceSearch(), function () {
                        this.placeSearch = new AMap.PlaceSearch({
                            pageSize: 5, //单页显示结果条数
                            pageIndex: 1, //页码
                            city: "010", //兴趣点城市
                            citylimit: true, //是否强制限制在设置的城市内搜索
                            map: map, //展现结果的地图实例
                            panel: "my-panel", //结果列表将在此容器中进行展示。
                            autoFitView: true, //是否自动调整地图视野使绘制的 Marker 点都处于视口的可见范围
                        });
                    })
                }

                if (this.plugin.indexOf('AMap.ToolBar') > -1) {
                    this.map.addControl(this.toolbar = new AMap.ToolBar()); //添加工具条插件到页面
                }

                if (this.plugin.indexOf('AMap.Driving') > -1) {
                    this.map.addControl(this.driving = new AMap.Driving({
                        map: this.map,
                        panel: "my-panel",
                    })); //添加工具条插件到页面
                }

                if (this.plugin.indexOf('AMap.Geolocation') > -1) {
                    map.addControl(new AMap.Geolocation());
                }

                if (this.plugin.indexOf('AMap.HawkEye') > -1) {
                    map.addControl(
                        new AMap.HawkEye({
                            position: 'LT', //控件停靠位置（LT/RT/LB/RB）
                        }),
                    );
                }

                map.setDefaultCursor('pointer'); //使用CSS默认样式定义地图上的鼠标样式（default/pointer/move/crosshair）
            });
        },
        /**
         * 初始化交通
         */
        initTraffic() {
            const traffic = new this.AMap.TileLayer.Traffic({
                autoRefresh: true, //是否自动刷新，默认为false
                interval: 180, //刷新间隔，默认180s
            });
            this.map.add(traffic); //通过add方法添加图层
        },
        /**
         * 初始化地图
         */
        initMap() {
            AMapLoader.load({
                key: this.$CONFIG.gis.gaode.appKey, // 申请好的Web端开发者Key，首次调用 load 时必填
                version: '2.0', // 指定要加载的 JSAPI 的版本，缺省时默认为 1.4.15
                plugins: [], // 需要使用的的插件列表，如比例尺'AMap.Scale'等
            })
                .then(AMap => {
                    this.AMap = AMap;
                    //JS API 加载完成后获取的AMAP对象
                    this.map = new AMap.Map('map', {
                        mapStyle: 'amap://styles/' + this.mapStyle,
                        //设置地图容器id
                        zoom: this.zoom, //初始化地图层级
                        viewMode: '3D', //是否为3D地图模式
                        center: this.center, //初始化地图中心点位置
                        dragEnable: true, //鼠标拖拽
                        scrollWheel: true, //鼠标滚轮放大缩小
                        doubleClickZoom: true, //双击放大缩小
                        keyboardEnable: true, //键盘控制放大缩小移动旋转
                    });

                    this.map.on("complete", function () {
                        this.$emit('complete')
                    });

                    this.map.on("click", this.clickEvent = e => {
                        if (this.debug) {
                            console.log(
                                "您在[ " +
                                e.lnglat.getLng() +
                                "," +
                                e.lnglat.getLat() +
                                " ]的位置点击了地图！"
                            );
                        }
                        this.$emit('click', e)
                    });

                })
                .catch((e) => {
                    console.log(e) //加载错误提示
                });
        },
    }

}

</script>