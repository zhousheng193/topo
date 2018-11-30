;
(function (Q) {
    var PER_RADIAN = Math.PI / 180;

    function degreeToRadian(d) {
        return PER_RADIAN * d;
    }

    function radianTodegree(r) {
        return r / PER_RADIAN;
    }

    var ε = 1e-6, ε2 = ε * ε, π = Math.PI, τ = 2 * π, τε = τ - ε, halfπ = π / 2, d3_radians = π / 180, d3_degrees = 180 / π;

    function sinci(x) {
        return x ? x / Math.sin(x) : 1;
    }

    function sgn(x) {
        return x > 0 ? 1 : x < 0 ? -1 : 0;
    }

    function asin(x) {
        return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
    }

    function acos(x) {
        return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
    }

    function asqrt(x) {
        return x > 0 ? Math.sqrt(x) : 0;
    }

    function aitoff(λ, φ) {
        var cosφ = Math.cos(φ), sinciα = sinci(acos(cosφ * Math.cos(λ /= 2)));
        return [2 * cosφ * Math.sin(λ) * sinciα, Math.sin(φ) * sinciα];
    }

    aitoff.invert = function (x, y) {
        if (x * x + 4 * y * y > π * π + ε) return;
        var λ = x, φ = y, i = 25;
        do {
            var sinλ = Math.sin(λ), sinλ_2 = Math.sin(λ / 2), cosλ_2 = Math.cos(λ / 2), sinφ = Math.sin(φ), cosφ = Math.cos(φ), sin_2φ = Math.sin(2 * φ), sin2φ = sinφ * sinφ, cos2φ = cosφ * cosφ, sin2λ_2 = sinλ_2 * sinλ_2, C = 1 - cos2φ * cosλ_2 * cosλ_2, E = C ? acos(cosφ * cosλ_2) * Math.sqrt(F = 1 / C) : F = 0, F, fx = 2 * E * cosφ * sinλ_2 - x, fy = E * sinφ - y, δxδλ = F * (cos2φ * sin2λ_2 + E * cosφ * cosλ_2 * sin2φ), δxδφ = F * (.5 * sinλ * sin_2φ - E * 2 * sinφ * sinλ_2), δyδλ = F * .25 * (sin_2φ * sinλ_2 - E * sinφ * cos2φ * sinλ), δyδφ = F * (sin2φ * cosλ_2 + E * sin2λ_2 * cosφ), denominator = δxδφ * δyδλ - δyδφ * δxδλ;
            if (!denominator) break;
            var δλ = (fy * δxδφ - fx * δyδφ) / denominator, δφ = (fx * δyδλ - fy * δxδλ) / denominator;
            λ -= δλ, φ -= δφ;
        } while ((Math.abs(δλ) > ε || Math.abs(δφ) > ε) && --i > 0);
        return [λ, φ];
    };

    function winkel3(λ, φ) {
        var coordinates = aitoff(λ, φ);
        return [(coordinates[0] + λ / halfπ) / 2, (coordinates[1] + φ) / 2];
    }

    winkel3.invert = function (x, y) {
        var λ = x, φ = y, i = 25;
        do {
            var cosφ = Math.cos(φ), sinφ = Math.sin(φ), sin_2φ = Math.sin(2 * φ), sin2φ = sinφ * sinφ, cos2φ = cosφ * cosφ, sinλ = Math.sin(λ), cosλ_2 = Math.cos(λ / 2), sinλ_2 = Math.sin(λ / 2), sin2λ_2 = sinλ_2 * sinλ_2, C = 1 - cos2φ * cosλ_2 * cosλ_2, E = C ? acos(cosφ * cosλ_2) * Math.sqrt(F = 1 / C) : F = 0, F, fx = .5 * (2 * E * cosφ * sinλ_2 + λ / halfπ) - x, fy = .5 * (E * sinφ + φ) - y, δxδλ = .5 * F * (cos2φ * sin2λ_2 + E * cosφ * cosλ_2 * sin2φ) + .5 / halfπ, δxδφ = F * (sinλ * sin_2φ / 4 - E * sinφ * sinλ_2), δyδλ = .125 * F * (sin_2φ * sinλ_2 - E * sinφ * cos2φ * sinλ), δyδφ = .5 * F * (sin2φ * cosλ_2 + E * sin2λ_2 * cosφ) + .5, denominator = δxδφ * δyδλ - δyδφ * δxδλ, δλ = (fy * δxδφ - fx * δyδφ) / denominator, δφ = (fx * δyδλ - fy * δxδλ) / denominator;
            λ -= δλ, φ -= δφ;
        } while ((Math.abs(δλ) > ε || Math.abs(δφ) > ε) && --i > 0);
        return [λ, φ];
    };
    Q.mercator = function(scale, centerLongitude, centerLat){
        if (isNaN(centerLongitude)) {
            centerLongitude = 105;
        }
        if (isNaN(centerLat)) {
            centerLat = 35;
        }
        if (isNaN(scale)) {
            scale = 20;
        }
        var translator = function (x, y) {
            x -= centerLongitude;
            y -= centerLat;
            if (x > 180) {
                x -= 360;
            } else if (x < -180) {
                x += 360;
            }
            y = degreeToRadian(y);
            y = -radianTodegree(Math.log(Math.tan(π / 4 + y / 2))) * scale;
            return {x: x * scale, y: y};
        }
        return translator;
    }
    Q.winkel3 = function (scale, centerLongitude, centerLat) {
        if (isNaN(centerLongitude)) {
            centerLongitude = 105;
        }
        if (isNaN(centerLat)) {
            centerLat = 35;
        }
        if (isNaN(scale)) {
            scale = 20;
        }
        var translator = function (x, y) {
            x -= centerLongitude;
            y -= centerLat;
            if (x > 180) {
                x -= 360;
            } else if (x < -180) {
                x += 360;
            }
            x = degreeToRadian(x);
            y = degreeToRadian(y);
            var xy = winkel3(x, y);
            x = radianTodegree(xy[0]) * scale;
            y = -radianTodegree(xy[1]) * scale;
            return {x: x, y: y};
        }
        translator.invert = function (x, y) {
            x = degreeToRadian(x / scale);
            y = -degreeToRadian(y / scale);
            var xy = winkel3.invert(x, y);
            x = radianTodegree(xy[0]);
            y = radianTodegree(xy[1]);
            x += centerLongitude;
            y += centerLat;
            return {x: x, y: y};
        }
        return translator;
    }
}(Q))