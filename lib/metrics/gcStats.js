'use strict';

var optional = require('optional');
var Counter = require('../counter');
var Histogram = require('../histogram');

var NODEJS_GC_PAUSE_SECONDS = 'nodejs_gc_pause_seconds';
var NODEJS_GC_RECLAIM_BYTES = 'nodejs_gc_reclaim_bytes';

module.exports = function() {
	var gc = optional('gc-stats');

	if(typeof gc !== 'function') {
		return function() { };
	};

	var gcTypes = {
		1: 'minor',
		2: 'major',
		4: 'incrementalmark',
		8: 'weak',
		15: 'all' // should never get this
	};

	var gcTimeHistogram = new Histogram(NODEJS_GC_PAUSE_SECONDS, 'seconds spent in gc pause',['gctype'],{buckets: [1e-4, 1e-3, 1e-2, 1e-1, 1]});
	var gcReclaimHistogram = new Histogram(NODEJS_GC_RECLAIM_BYTES, 'total number of bytes reclaimed by GC',['gctype'],{buckets: [4096000,16384000,32768000,65546000]});

	var started = false;
	return function() {
		if(started !== true) {
			gc().on('stats', function(stats) {
				if(stats.gctype === 15) {
					// If we do get here, we don't want to add the stats
					return;
				};
				var type = (stats.gctype in gcTypes) ? gcTypes[stats.gctype] : 'unknown';

				gcTimeHistogram.labels(type).observe(stats.pause / 1e9);
				if(stats.diff.usedHeapSize < 0) {
					gcReclaimHistogram.labels(type).observe(stats.diff.usedHeapSize * -1);
				};
			});
			started = true;
		};
	};
};

module.exports.metricNames = [NODEJS_GC_PAUSE_SECONDS,NODEJS_GC_RECLAIM_BYTES];

