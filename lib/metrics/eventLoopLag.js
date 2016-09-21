'use strict';

var Gauge = require('../gauge');

function reportEventloopLag(start, gauge){
    var delta = process.hrtime(start);
    var nanosec = delta[0] * 1e9 + delta[1];
    var ss = nanosec / 1e9;

    gauge.set(ss);
}

module.exports = function() {
    var gauge = new Gauge('nodejs_eventloop_lag_seconds', 'Lag of event loop in seconds.');

    return function() {
        var start = process.hrtime();
        setImmediate(reportEventloopLag, start, gauge);
    };
};
