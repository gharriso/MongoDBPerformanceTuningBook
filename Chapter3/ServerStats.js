// Empty object to hold our Server Statistic functions.
var dbeSS = {};

/**
 * Base function that will collect and shape raw server statistics data.
 *
 * @returns {FlatServerStats} An object containing many different server statistics.
 */
dbeSS.serverStatistics = function () {
  var output = {};
  var value;
  var rate;
  output.statistics = [];
  var serverStats = dbeSS.flattenServerStatus(db.serverStatus()).stats; // eslint-disable-line
  var uptime = serverStats.uptime;
  Object.keys(serverStats).forEach(function (stat) {
    // print(stat);
    value = serverStats[stat];
    rate = null;
    if (typeof value === 'number') {
      rate = (value / uptime).toFixed(4);
    }
    if (!stat.match(/_mongo/)) {
      output.statistics.push({
        statistic: stat,
        value: value,
        ratePs: rate,
      });
    }
  });
  return output;
};

/**
 * Converts structured mongodb ServerStatus object into a flattened array of stats.
 *
 * @param {RawServerStatus} dbServerStatus - The raw result of the mongodb command.
 * @returns {FlatServerStatus} - Flattened array of server status metrics.
 */
dbeSS.flattenServerStatus = function (dbServerStatus) {
  var flattenedServerStatus = {};
  flattenedServerStatus.stats = {};

  function internalflattenServerStatus(serverStatus, rootTerm) {
    var prefix = '';
    if (arguments.length > 1) {
      prefix = rootTerm + '.';
    }
    Object.getOwnPropertyNames(serverStatus).forEach(function (key) {
      if (key !== '_mongo') {
        var value = serverStatus[key];
        // eslint-disable-next-line
        if (value.constructor === NumberLong) {
          value = value.toNumber();
        }
        var valtype = typeof value;
        var fullkey = prefix + key;
        // print(key, value, valtype, fullkey);
        if (valtype == 'object') {
          // recurse into nested objects
          internalflattenServerStatus(value, prefix + key);
        } else {
          /* No more nesting */
          flattenedServerStatus.stats[fullkey] = value;
        }
      }
    });
  }
  internalflattenServerStatus(dbServerStatus);
  return flattenedServerStatus;
};

/**
 * Returns a simplified list of stats with a key value pair for each stat.
 *
 * @returns {SimpleServerStatus} - A single object with key value pairs for each stat.
 */
dbeSS.simpleStats = function () {
  return dbeSS.convertStat(dbeSS.serverStatistics());
};

/**
 * Converts a stats object into a simplified stats object.
 *
 * @param {RawServerStatus} serverStat - The raw server statistics result from Mongo.
 * @returns {SimpleServerStatus} - A single object with key value pairs for each stat.
 */
dbeSS.convertStat = function (serverStat) {
  var returnStat = {};
  serverStat.statistics.forEach(function (stat) {
    returnStat[stat.statistic] = stat.value;
  });
  return returnStat;
};

/**
 * Finds the difference between two stats.
 *
 */
dbeSS.statDelta = function (instat1, instat2) {
  var stat1 = dbeSS.convertStat(instat1);
  var stat2 = dbeSS.convertStat(instat2);
  var delta;
  var rate;
  var statDelta = {};
  statDelta.timeDelta = stat2.uptime - stat1.uptime;
  // print("timedelta", statDelta.timeDelta);
  Object.keys(stat2).forEach(function (key) {
    // print(key,typeof stat2[key]);
    if (typeof stat2[key] === 'number') {
      delta = stat2[key] - stat1[key];
      rate = delta / statDelta.timeDelta;
    } else {
      delta = null;
      rate = null;
    }
    statDelta[key] = {
      lastValue: stat2[key],
      firstValue: stat1[key],
      delta: delta,
      rate: rate,
    };
  });
  return statDelta;
};

/**
 * Function for comparing two sets of ServerStats collected at different times.
 *
 * @param {FlatServerStats} sample1 - Pass in some stats (for example from dbeSS.serverStats()) to compare with sample2
 * @param {FlatServerStats} sample2 - Pass in some stats (for example from dbeSS.serverStats()) to compare with sample1
 * @returns {ServerStatsSummary}
 */
dbeSS.summary = function (sample1, sample2) {
  // TODO: Statistic names change over versions
  var data = {};
  var deltas = dbeSS.statDelta(sample1, sample2);
  var finals = dbeSS.convertStat(sample2);

  // *********************************************
  //  Network counters
  // *********************************************
  data.netIn = deltas['network.bytesIn'].rate;
  data.netOut = deltas['network.bytesOut'].rate;

  // ********************************************
  // Activity counters
  // ********************************************
  data.qry = deltas['opcounters.query'].rate;
  data.getmore = deltas['opcounters.getmore'].rate;
  data.command = deltas['opcounters.command'].rate;
  data.ins = deltas['opcounters.insert'].rate;
  data.upd = deltas['opcounters.update'].rate;
  data.del = deltas['opcounters.delete'].rate;

  data.activeRead = finals['globalLock.activeClients.readers'];
  data.activeWrite = finals['globalLock.activeClients.writers'];
  data.queuedRead = finals['globalLock.currentQueue.readers'];
  data.queuedWrite = finals['globalLock.currentQueue.writers'];
  // var lockRe = /locks.*acquireCount.*floatApprox
  //
  // The "time acquiring" counts for locks seem to appoear only after some significant
  // waits have occured.  Sometimes it's timeAcquiringMicros, and
  // sometimes it's timeAcquireingMicros.*k.floatApprox
  //
  // print(deltas['opLatencies.reads.ops']);
  if (deltas['opLatencies.reads.ops'].delta > 0) {
    data.readLatency =
      deltas['opLatencies.reads.latency'].delta /
      deltas['opLatencies.reads.ops'].delta;
  } else data.readLatency = 0;

  if (deltas['opLatencies.writes.ops'].delta > 0) {
    data.writeLatency =
      deltas['opLatencies.writes.latency'].delta /
      deltas['opLatencies.writes.ops'].delta;
  } else data.writeLatency = 0;

  if (deltas['opLatencies.commands.ops'].delta > 0) {
    data.cmdLatency =
      deltas['opLatencies.commands.latency'].delta /
      deltas['opLatencies.commands.ops'].delta;
  } else data.cmdLatency = 0;

  data.connections = deltas['connections.current'].lastValue;
  data.availableConnections = deltas['connections.available'].firstValue;
  data.asserts =
    deltas['asserts.regular'].rate +
    deltas['asserts.warning'].rate +
    deltas['asserts.msg'].rate +
    deltas['asserts.user'].rate +
    deltas['asserts.rollovers'].rate;

  // *********************************************************
  // Memory counters
  // *********************************************************

  data.cacheGets =
    deltas['wiredTiger.cache.pages requested from the cache'].rate;

  data.cacheHighWater =
    deltas['wiredTiger.cache.maximum bytes configured'].lastValue;

  data.cacheSize =
    deltas['wiredTiger.cache.bytes currently in the cache'].lastValue;

  data.cacheReadQAvailable =
    deltas['wiredTiger.concurrentTransactions.read.available'].lastValue;
  data.cacheReadQUssed =
    deltas['wiredTiger.concurrentTransactions.read.out'].lastValue;

  data.cacheWriteQAvailable =
    deltas['wiredTiger.concurrentTransactions.write.available'].lastValue;
  data.cacheWriteQUsed =
    deltas['wiredTiger.concurrentTransactions.write.out'].lastValue;

  data.diskBlockReads = deltas['wiredTiger.block-manager.blocks read'].rate;
  data.diskBlockWrites = deltas['wiredTiger.block-manager.blocks written'].rate;

  data.logByteRate = deltas['wiredTiger.log.log bytes written'].rate;

  data.logSyncTimeRate =
    deltas['wiredTiger.log.log sync time duration (usecs)'].rate;

  return data;
};

/**
 * Takes two server stat samples between the interval and them summarizes them.
 *
 * @param {int} interval - The wait in between server stats samples.
 * @returns {ServerStatsSummary}
 */
dbeSS.takeSample = function (interval) {
  const sample1 = dbeSS.serverStatistics();
  sleep(interval);
  return dbeSS.summary(sample1, dbeSS.serverStatistics());
};
