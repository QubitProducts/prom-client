'use strict';

var Gauge = require('../gauge');

module.exports = function () {
    // Don't do anything if the function doesn't exist (introduced in node@6.1.0)
    if(typeof process.cpuUsage !== 'function') {
        return function () {
        };
    }

    var cpuUseCounter = new Gauge('process_cpu_seconds_total', 'Total user and system CPU time spent in seconds.');
    var lastUsage = {};
    var isSet = false;

    return function () {
        var cpuUsage = {};
        if(isSet) {
          cpuUsage = process.cpuUsage(lasteUsage);
        } else {
          cpuUsage = process.cpuUsage();
          isSet = true;
        }

        var totalUsageMicros = cpuUsage.user + cpuUsage.system;
        lastUsage = cpuUsage;

        cpuUseCounter.inc(totalUsageMicros / 1e6);
    };
};
