;
(function (Q) {
    var basicProjection = function (scale) {
        if (isNaN(scale)) {
            scale = 20;
        }
        var translator = function (x, y) {
            return {x: x * scale, y: -y * scale}
        }
        translator.invert = function (x, y) {
            return {x: x / scale, y: -y / scale}
        }
        return translator;
    }

    Q.basicProjection = basicProjection;

    var createPolygon = function (coordinates, projection, isMultiPolygon) {
        var path = new Q.Path();
        function updateShape(coordinates) {
            if (coordinates.length < 2) {
                throw new Error('coordinates length must be greater than or equal to 2');
                return;
            }
            var coordinate = coordinates[0];
            var p = projection(coordinate[0], coordinate[1]);
            path.moveTo(p.x, p.y);
            var i = 1;
            while (i < coordinates.length) {
                p = projection(coordinates[i][0], coordinates[i][1]);
                path.lineTo(p.x, p.y);
                i++;
            }
            return path;
        }
        if(isMultiPolygon){
            coordinates.forEach(function (cs) {
                cs.forEach(updateShape);
            });
            return path;
        }
        coordinates.forEach(updateShape);
        return path;
    }
    function updatePolygon(path, coordinates, projection, isMultiPolygon){
        path = path || new Q.Path();
        path.clear();
        function updateShape(coordinates) {
            if (coordinates.length < 2) {
                throw new Error('coordinates length must be greater than or equal to 2');
                return;
            }
            var coordinate = coordinates[0];
            var p = projection(coordinate[0], coordinate[1]);
            path.moveTo(p.x, p.y);
            var i = 1;
            while (i < coordinates.length) {
                p = projection(coordinates[i][0], coordinates[i][1]);
                path.lineTo(p.x, p.y);
                i++;
            }
            return path;
        }
        if(isMultiPolygon){
            coordinates.forEach(function (cs) {
                cs.forEach(updateShape);
            });
            return path;
        }
        coordinates.forEach(updateShape);
        return path;
    }

    function loadGeoJSON(json, projection, callback, onfinish, scope){
        if(Q.isString(json)){
            Q.loadJSON(json, function(json){
                loadGeoJSON(json, projection, callback, onfinish, scope);
            }, false);
            return;
        }
        var features = json.features;
        features.forEach(function(feature) {
            callback.call(scope, feature);
        });
        if(onfinish){
            onfinish.call(scope, scope);
        }
    }

    var MapChart = function (div) {
        Q.doSuperConstructor(this, MapChart, arguments);
        this.visibleFilter = function (d) {
            if (d.scale && this.getScale() < d.scale) {
                return false;
            }
            return true;
        }
    }

    MapChart.prototype = {
        _projection: basicProjection(),
        centerElement: function(element) {
            var bounds = this.getUIBounds(element);
            if (bounds) {
                var minScale = Math.min(2, 0.5 * Math.min(this.width / bounds.width, this.height / bounds.height));
                this.centerTo(bounds.cx, bounds.cy, minScale, true);
            }
        },
        getScale: function () {
            return this.scale;
        },
        stylingPolygon: function(polygon){
            polygon.setStyle(Q.Styles.LABEL_ON_TOP, true);
            polygon.setStyle(Q.Styles.LABEL_FONT_SIZE, 15);
            polygon.setStyle(Q.Styles.LABEL_POSITION, Q.Position.CENTER_MIDDLE);
            polygon.setStyle(Q.Styles.LAYOUT_BY_PATH, false);
            polygon.setStyle(Q.Styles.LABEL_BACKGROUND_COLOR, Q.toColor(0xAAFFFFFF));
            polygon.setStyle(Q.Styles.LABEL_PADDING, new Q.Insets(2, 5));
            polygon.setStyle(Q.Styles.LABEL_POINTER, false);
            polygon.setStyle(Q.Styles.SHAPE_FILL_COLOR, null);
            polygon.setStyle(Q.Styles.SHAPE_STROKE, 2);
        },
        loadGeoJSON: function(geoJSON, params){
            params = params || {};
            var zIndex = params.zIndex || -1;
            loadGeoJSON(geoJSON, this._projection, function(feature){
                var geometry = feature.geometry;
                if (!geometry || !geometry.coordinates) {
                    return;
                }
                var type = geometry.type;
                var properties = feature.properties;
                var name = properties.name || properties.NAME;
                var element;
                if(type == 'Polygon' || type == 'MultiPolygon'){
                    var path = createPolygon(geometry.coordinates, this._projection, type == 'MultiPolygon');
                    element = new Q.ShapeNode(path);
                    element.zIndex = zIndex;
                    element.resizable = false;
                    element.movable = false;
                    this.stylingPolygon(element, properties);
                    this.addElement(element);
                }else if(type == 'Point'){
                    element = this.createMapNode(name, geometry.coordinates[0], geometry.coordinates[1])
                    this.addElement(element);
                }
                if(element){
                    if(name){
                        element.name = name.trim();
                    }
                    element.set('properties', properties);
                }
                if(params.callback instanceof Function){
                    params.callback.call(this, element, feature);
                }
            }, params.onfinish, this);
        },
        createMapNode: function(name, geoX, geoY){
            var xy = this.geoToLogical(geoX, geoY);
            return this.createNode(name, xy.x, xy.y);
        },
        createLine: function (coordinates, name) {
            return this.createShape(coordinates, name, true);
        },
        createPolygon: function (coordinates, name) {
            return this.createShape(coordinates, name, false);
        },
        createShape: function (coordinates, name, isLine) {
            if (coordinates.length < 2) {
                throw new Error('coordinates length must be greater than or equal to 2');
                return;
            }
            var shape = new Q.ShapeNode(name);
            shape.isLine = isLine;
            shape.setStyle(Q.Styles.SHAPE_FILL_COLOR, isLine ? null : Q.toColor(0xDDFFFFDD));
            shape.setStyle(Q.Styles.SHAPE_STROKE, 3);
            shape.setStyle(Q.Styles.SHAPE_STROKE_STYLE, '#0033ff');

            var p = this.geoToLogical(coordinates[0]);
            shape.moveTo(p.x, p.y);
            var i = 1;
            while (i < coordinates.length) {
                p = this.toPixel(coordinates[i]);
                shape.lineTo(p.x, p.y);
                i++;
            }
            if (!isLine) {
                shape.closePath();
            }
            this.graphModel.add(shape);
            return shape;
        },
        defaultMatchType: MATCH_TYPE_FUZZY,
        getElementByName: function (name, matchType) {
            return this._findElementsBy(true, "name", name, matchType);
        },
        findElementsByName: function (name, matchType) {
            return this._findElementsBy(false, "name", name, matchType);
        },
        getElementBy: function (propertyName, propertyValue, matchType) {
            return this._findElementsBy(true, propertyName, propertyValue, matchType);
        },
        findElementsBy: function (propertyName, propertyValue, matchType) {
            return this._findElementsBy(false, propertyName, propertyValue, matchType);
        },
        _findElementsBy: function (getFirst, propertyName, propertyValue, matchType) {
            var matchFunction = getMatchFunction(matchType || this.defaultMatchType, propertyValue);
            if (!getFirst) {
                var result = [];
            }
            var datas = this.graphModel.datas;
            for (var i = 0, l = datas.length; i < l; i++) {
                var data = datas[i];
                if (matchFunction(data[propertyName])) {
                    if (getFirst) {
                        return data;
                    }
                    result.push(data);
                }
            }
            if (!getFirst) {
                return result;
            }
        },
        geoToLogical: function(x, y){
            if(Q.isArray(x)){
                y = x[1];
                x = x[0];
            }
            return this._projection(x, y);
        },
        logicalToGeo: function(x, y){
            if(Q.isArray(x)){
                y = x[1];
                x = x[0];
            }
            return this._projection.invert(x, y);
        },
        updateShape: function (shape) {
            var coordinates = shape.coordinates;
            var isLine = shape.isLine;
            if (coordinates.length < 2) {
                throw new Error('coordinates length must be greater than or equal to 2');
                return;
            }
            shape.setLocation(0, 0);
            shape.clear();
            var p = this.geoToLogical(coordinates[0]);
            shape.moveTo(p.x, p.y);
            var i = 1;
            while (i < coordinates.length) {
                p = this.geoToLogical(coordinates[i]);
                shape.lineTo(p.x, p.y);
                i++;
            }
            if (!isLine) {
                shape.closePath();
            }
            return shape;
        },
        updateProjection: function(){
            this.forEach(function (d) {
                if (d instanceof Q.ShapeNode) {
                    if (!d.coordinates) {
                        return;
                    }
                    this.updateShape(d);
                    return;
                }
                if (d instanceof Q.Node) {
                    var l = d.latLng;
                    if (l) {
                        d.location = this.geoToLogical(l.lng, l.lat);
                    }
                }
            }, this);
        }
    }

    Q.extend(MapChart, Q.Graph);

    Object.defineProperties(MapChart.prototype, {
        projection: {
            get: function(){
                return this._projection;
            },
            set: function(v){
                this._projection = v;
                this.updateProjection();
            }
        }
    })

    var MATCH_TYPE_FUZZY = "fuzzy";
    var MATCH_TYPE_EXACT = "exact";
    var MATCH_TYPE_START = "start";

    function getMatchFunction(matchType, v1) {
        if (!Q.isString(v1) || matchType == MATCH_TYPE_EXACT) {
            return function (v2) {
                return v1 == v2;
            }
        }
        var reg;
        if (matchType == MATCH_TYPE_START) {
            reg = new RegExp("\\b" + v1, "i");
        } else {
            reg = new RegExp(v1, "i");
        }
        return function (v2) {
            return reg.test(v2);
        }
    }
    Q.MapChart = MapChart;
})(Q);