'use strict';

var Counter = require('../counter');

module.exports = function () {
    // Don't do anything if the function doesn't exist (introduced in node@6.1.0)
    if(typeof process.cpuUsage !== 'function') {
        return function () {
        };
    }

    var cpuUseCounter = new Counter('process_cpu_seconds_total', 'Total user and system CPU time spent in seconds.');
    var lastUsage = null;

    return function () {
        var cpuUsage = process.cpuUsage(lastUsage);
        lastUsage = cpuUsage;

        var totalUsageMicros = cpuUsage.user + cpuUsage.system;

        cpuUseCounter.inc(totalUsageMicros / 1e6);
    };
};
