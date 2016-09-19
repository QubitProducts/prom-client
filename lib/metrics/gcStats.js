'use strict';

var optional = require('optional');
var Counter = require('../counter');

module.exports = function() {
  var gc = optional('gc-stats');

  if(typeof gc !== 'function') {
    return function () { };
  };

  var gcTypes = {
    0: 'unknown',
    1: 'minor',
    2: 'major',
    3: 'both'
  };

  var gcCount = new Counter('nodejs_gc_count', 'Count of total garbage collections',['gctype']);
  var gcTimeCount = new Counter('nodejs_gc_pause_nanoseconds_total', 'nanoseconds spent in gc pause',['gctype']);
  var gcReclaimedCount = new Counter('nodejs_gc_reclaimed_bytes_total', 'total number of bytes reclaimed by GC',['gctype']);

  return function() {
    gc().on('stats', function (stats) {
      gcCount.labels(gcTypes[stats.gctype]).inc();
      gcTimeCount.labels(gcTypes[stats.gctype]).inc(stats.pause);
      if(stats.diff.usedHeapSize < 0) {
        gcReclaimedCount.labels(gcTypes[stats.gctype]).inc(stats.diff.usedHeapSize * -1);
      };
    });
  };
};




