
Object.defineProperties(Q.Node.prototype, {
    time: {
        get: function () {
            return this._time;
        },
        set: function (v) {
            this._time = v;
            if (v) {
                var timeLabel = this._timeLabel;
                if (!timeLabel) {
                    timeLabel = this._timeLabel = new Q.LabelUI();
                    timeLabel.fontFamily = 'digitalFont';
                    timeLabel.fontSize = 16 * 1.3 / map.scale;
                    timeLabel.backgroundColor = Q.toColor(0xBB1D4876);
                    timeLabel.color = '#FFF';
                    timeLabel.padding = 3;
                    timeLabel.anchorPosition = Q.Position.CENTER_MIDDLE;
                    timeLabel.position = Q.Position.CENTER_MIDDLE;
                  // this.addUI(timeLabel);
                }
                timeLabel.data = v;
            } else if (this._timeLabel) {
                this.removeUI(this._timeLabel);
                delete this._timeLabel;
            }
        }
    },
    timeError: {
        get: function () {
            return this._timeError;
        },
        set: function (v) {
            this._timeError = v;
            if (v) {
               // this.setStyle(Q.Styles.BORDER, 1.5 / map.scale);
                //this.setStyle(Q.Styles.BORDER_COLOR, '#F00');
            } else {
                this.setStyle(Q.Styles.BORDER, 0);
                this.setStyle(Q.Styles.BORDER_COLOR, null);
            }
        }
    },
    alarm: {
        get: function () {
            return this._alarm;
        },
        set: function (v) {
            this._alarm = v;
            if (v) {
                var alarmIcon = this._alarmIcon;
                if (!alarmIcon) {
                    alarmIcon = this._alarmIcon = new Q.ImageUI('./images/error.png');
//                        alarmIcon.size = {width: 30};
                    alarmIcon.size = {width: Math.max(6, Math.min(60, 25 / map.scale))};
                    alarmIcon.anchorPosition = Q.Position.LEFT_BOTTOM;
                    alarmIcon.position = Q.Position.RIGHT_BOTTOM;
                    //this.addUI(alarmIcon);
                }
            } else if (this._alarmIcon) {
                this.removeUI(this._alarmIcon);
                delete this._alarmIcon;
            }
        }
    },
    online: {
        get: function () {
            return this._online;
        },
        set: function (v) {
            this._online = v;
            if(this.name=="河西机房"){
                this.image = v ? './images/dingwei_error.png' : './images/dingwei_error2.png';
            }else{
                this.image ='./images/dingwei_ok.png';
            }


        }
    }
})

var map;
$(function(){
    map = createMap('canvas');
    var styles = {};
    styles[Q.Styles.SELECTION_COLOR] = "#0F0";
    styles[Q.Styles.LABEL_FONT_SIZE] = 16;
    map.styles = styles;
    //map.popupmenu = new Q.PopupMenu();
   // Q.createToolbar(map, document.getElementById("toolbar"));
    initDatas();

    setInterval(function () {
        towers.forEach(function (node) {
            var timeError = Q.randomInt(5) > 3;
            node.timeError = timeError;
            var date = new Date();
            node.time = date.getHours() + ':' + date.getMinutes() + ':' + (timeError ? date.getSeconds() + 2 : date.getSeconds());
            node.alarm = Q.randomBool();
            node.online = Q.randomInt(5) > 2;
        })
    }, 1000);
})

var currentMapName;
var towers = [];
function initDatas() {
    function loadMap(item) {
        if (!item.children || !item.children.length) {
            item = $('#tree').tree('getParent', item.target);
        }
        var mapName;
        if (item.text == '广电总局') {
            mapName = 'china';
        } else if (item.text == '四川省' || item.parentId == 5) {
            mapName = 'sichuan';
        } else if (item.text == '北京市') {
            mapName = 'beijing';
        } else if (item.text == '长沙市') {
            mapName = 'changsha';
        }else {
            return;
        }
        if (currentMapName == mapName) {
            return;
        }
        currentMapName = mapName;
        map.clear();
        loadMapData(map, currentMapName, item.children);
    }

    var dataMap;
    $('#tree').tree({
        url: 'res/data.json',
        onSelect: loadMap,
        animate: true,
        onLoadSuccess: function (node, data) {
            var root = data[0];
            var changsha = root.children[1];
            //直接定位到长沙
            loadMap(changsha);

        }
    });
}

function loadTowers(children, map) {
    towers.length = 0;
    children.forEach(function (item) {
        var lon = item.lon, lat = item.lat;//经纬度坐标
        if (!lon) {
            lon = 116 + Math.random();
        }
        if (!lat) {
            lat = 40 + Math.random();
        }
        var p = map.geoToLogical(lon, lat);
        var node = map.createNode(item.text, p.x, p.y);
        towers.push(node);

        node.movable = false;
        node.setStyle(Q.Styles.LABEL_OFFSET_Y, -10);
        node.setStyle(Q.Styles.LABEL_POSITION, Q.Position.CENTER_TOP);
        node.setStyle(Q.Styles.LABEL_ANCHOR_POSITION, Q.Position.CENTER_BOTTOM);
        node.setStyle(Q.Styles.LABEL_COLOR, "#FFF");
        node.setStyle(Q.Styles.LABEL_BORDER, 1);
        node.setStyle(Q.Styles.LABEL_POINTER, true);
        node.setStyle(Q.Styles.LABEL_PADDING,5);
        node.setStyle(Q.Styles.LABEL_BACKGROUND_GRADIENT, Q.Gradient.LINEAR_GRADIENT_VERTICAL);
        node.setStyle(Q.Styles.LABEL_BORDER_STYLE, "#ffffff");
        node.setStyle(Q.Styles.LABEL_RADIUS, 5);

        node.setStyle(Q.Styles.SELECTION_COLOR, "#0F0");
        node.setStyle(Q.Styles.SHADOW_COLOR, Q.toColor(0x88000000));
        node.setStyle(Q.Styles.SHADOW_BLUR, 5);
        node.setStyle(Q.Styles.SHADOW_OFFSET_Y, 5);
        node.anchorPosition = Q.Position.CENTER_BOTTOM;
        node.image = './images/dingwei_ok.png';
        node.online = Q.randomBool;
    })
}

function loadMapData(map, mapName, children, callback) {
    var lon, lat, scale;//经度，纬度，缩放比
    if (mapName == 'china') {
        scale = 30;
        lon = 105;
        lat = 35;
    } else if (mapName == 'beijing') {
        scale = 600;
        lon = 116.385;
        lat = 40.2;
    } else if (mapName == 'sichuan') {
        scale = 100;
        lon = 104.06;
        lat = 30.67;
    } else if (mapName == 'changsha') {
        scale = 500;
        lon = 104.06;
        lat = 30.67;
    }
    else {
        throw new Error('地图数据不存在');
    }
    map.projection = Q.winkel3(scale, lon, lat);

//        var stateColors = ['#2EADFF', '#4BB9FF', '#2898E0'];
    var stateColors = ['#2EADFF', '#4BB9FF', '#b0daf6'];
//        var stateColors = ['#2898E0', '#2EADFF', '#156da6'];
//        var stateColors = ['#ff8400', '#b56e23', '#f2ae66'];
//        var stateColors = ['#00e110', '#70e878', '#3dc147'];
//        var stateColors = ['#ffde00', '#c7af0e', '#edd84e'];
    var index = 0;
   // map.loadTopoJSON(MapDatas[mapName], {
    var jsonurl="res/changsha.json";
    map.loadTopoJSON(jsonurl, {
        zIndex: -9,
        callback: function (element) {
            element.setStyle(Q.Styles.LABEL_COLOR, '#2780ba');
            element.setStyle(Q.Styles.LABEL_BACKGROUND_COLOR, Q.toColor(0xAAFFFFFF));
            element.setStyle(Q.Styles.LABEL_ON_TOP, false);
            element.setStyle(Q.Styles.SHAPE_FILL_COLOR, stateColors[index++ % stateColors.length]);
            element.setStyle(Q.Styles.SHAPE_STROKE_STYLE, '#EEE');
            if (mapName == 'china') {
                if (element.name == '甘肃') {
                    element.setStyle(Q.Styles.LABEL_OFFSET_X, 50);
                } else if (element.name == '河北') {
                    element.setStyle(Q.Styles.LABEL_OFFSET_X, -30);
                } else if (element.name == '内蒙古') {
                    element.setStyle(Q.Styles.LABEL_OFFSET_Y, 50);
                } else if (element.name == '广东') {
                    element.setStyle(Q.Styles.LABEL_OFFSET_Y, -30);
                } else if (element.name == '香港') {
                    element.setStyle(Q.Styles.LABEL_OFFSET_X, 15);
                } else if (element.name == '澳门') {
                    element.setStyle(Q.Styles.LABEL_OFFSET_X, -15);
                }
            }
        },
        onfinish: function () {
            if (children) {
                loadTowers(children, map);
            }
            map.onclick = function(evt){
                var p = map.globalToLocal(evt);
                var l = map.toLogical(p.x, p.y);
                Q.log('canvas location: ' + p.x + ', ' + p.y);
                Q.log('logical location: ' + l.x + ', ' + l.y);
            }
            map.zoomToOverview();
            if (callback) {
                callback();
            }
        }
    })
}

function createMap(canvas) {
    var map = new Q.MapChart('canvas');
    // map.delayedRendering = false;
    map.onPropertyChange('scale', function (evt) {
        var scale = evt.value;//.scale;
        var stroke = Math.min(5, 1 / scale);

        map.callLater(function () {
            map.forEach(function (element) {
                var fontSize;
                if (element instanceof Q.ShapeNode) {
                    fontSize = 11 / scale;
                    element.setStyle(Q.Styles.SHAPE_STROKE, stroke);
                } else if(element instanceof Q.Node){
                    element.size = {height: Math.max(50, Math.min(200, 80 / scale))};
                    element.setStyle(Q.Styles.PADDING, 5 / scale);
                    if (element.timeError) {
                        element.setStyle(Q.Styles.BORDER, 1.5 / scale);
                    }
                    fontSize = 16 / scale;
                }
                var labelRadius = 0.2 * fontSize;
                var labelPadding = 0.1 * fontSize;
                element.setStyle(Q.Styles.LABEL_FONT_SIZE, fontSize);
                element.setStyle(Q.Styles.LABEL_RADIUS, labelRadius);
                element.setStyle(Q.Styles.LABEL_PADDING, labelPadding);
                if(element._timeLabel){
                    element._timeLabel.fontSize = fontSize * 1.3;
                    element._timeLabel.borderRadius = labelRadius;
                    element._timeLabel.padding = labelPadding;
                }
                if(element._alarmIcon){
                    element._alarmIcon.size = {width: Math.max(6, Math.min(60, 25 / scale))};
                }
            });
        })
    })
    window.addEventListener('resize', function () {
        setTimeout(function () {
            map.updateViewport()
        }, 500)
    }, false);
    return map;
}