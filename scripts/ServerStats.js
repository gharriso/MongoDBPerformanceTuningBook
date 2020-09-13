/*
 * Server Statistic helper functions for the Apress book "MongoDB Performance Tuning"
 *
 * @Authors: Michael Harrison (Michael.J.Harrison@outlook.com) and Guy Harrison (Guy.A.Harrison@gmail.com).
 * @Date:   2020-09-03T17:54:50+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2020-09-07T20:05:03+10:00
 *
 */



//
// ─── DATA GATHERING ─────────────────────────────────────────────────────────────
//
/**
 * Base function that will collect and shape raw server statistics data.
 *
 * @returns {FlatServerStats} An object containing many different server statistics.
 */
mongoTuning.serverStatistics = function () {
  const output = {};
  let value;
  let rate;
  output.statistics = [];
  var serverStats = mongoTuning.flattenServerStatus(db.serverStatus()).stats; // eslint-disable-line
  const uptime = serverStats.uptimeMillis / 1000; // seconds with precision
  Object.keys(serverStats).forEach((stat) => {
    // print(stat);
    value = serverStats[stat];
    rate = null;
    if (typeof value === 'number') {
      rate = (value / uptime).toFixed(4);
    }
    if (!stat.match(/_mongo/)) {
      output.statistics.push({
        statistic: stat,
        value,
        ratePs: rate,
      });
    }
  });
  return output;
};

//
// ─── MONITORING ─────────────────────────────────────────────────────────────────
//
/**
 * Helper function for monitoring the MongoDB server over the duration and then
 * calculating delta and final values across the duration for key statistics.
 *
 * @param {int} duration - How long to monitor the server for.
 * @returns {Object} - Data object containing Deltas and final values.
 */
mongoTuning.monitorServer = function (duration) {
  let runningStats;
  let initialStats;
  const runTime = 0;
  initialStats = mongoTuning.serverStatistics();
  sleep(duration);
  finalStats = mongoTuning.serverStatistics();
  const deltas = mongoTuning.serverStatDeltas(initialStats, finalStats);
  const finals = mongoTuning.convertStat(finalStats);
  return { deltas, finals };
};

mongoTuning.keyServerStats = function (durationSeconds, regex) {
  const monitoringData = mongoTuning.monitorServer(durationSeconds * 1000);
  return mongoTuning.keyServerStatsFromSample(monitoringData, regex);
};

mongoTuning.keyServerStatsFromSample = function (monitoringData, regex) {
  const data = mongoTuning.derivedStatistics(monitoringData);
  if (regex) {
    return mongoTuning.serverStatSearch(data, regex);
  }
  return data;
};

/**
 * Monitor the MongoDB server for a given duration and return some derived statistics.
 *
 * @param {int} duration - How many milliseconds to monitor the server for.
 * @param {string} regex - OPTIONAL - A string to perform a match against returned statistic keys.
 * @returns {Object} - An object containing the derived statistics matching the regex if given.
 */
mongoTuning.monitorServerDerived = function (duration, regex) {
  if (!duration) {
    duration = 5000;
  }
  const monitoringData = mongoTuning.monitorServer(duration);
  const derivedStats = mongoTuning.derivedStatistics(monitoringData);

  if (regex) {
    return mongoTuning.serverStatSearch(derivedStats, regex);
  }
  return data;
};

/**
 * Monitor the MongoDB server for a given duration and return the raw statistics.
 *
 * @param {int} duration - How many milliseconds to monitor the server for.
 * @param {string} regex - OPTIONAL - A string to perform a match against returned statistic keys.
 * @returns {Object} - An object containing the derived statistics matching the regex if given.
 */
mongoTuning.monitorServerRaw = function (duration, regex) {
  if (!duration) {
    duration = 5000;
  }
  const monitoringData = mongoTuning.monitorServer(duration);
  if (regex) {
    return mongoTuning.serverStatSearchRaw(monitoringData, regex);
  }
  return data;
};

//
// ─── HELPERS ────────────────────────────────────────────────────────────────────
//

/**
 * Converts structured mongodb ServerStatus object into a flattened array of stats.
 *
 * @param {RawServerStatus} dbServerStatus - The raw result of the mongodb command.
 * @returns {FlatServerStatus} - Flattened array of server status metrics.
 */
mongoTuning.flattenServerStatus = function (dbServerStatus) {
  const flattenedServerStatus = {};
  flattenedServerStatus.stats = {};

  function internalflattenServerStatus(serverStatus, rootTerm) {
    let prefix = '';
    if (arguments.length > 1) {
      prefix = rootTerm + '.';
    }
    Object.getOwnPropertyNames(serverStatus).forEach((key) => {
      if (key !== '_mongo') {
        let value = serverStatus[key];
        // eslint-disable-next-line
        if (value.constructor === NumberLong) {
          value = value.toNumber();
        }
        const valtype = typeof value;
        const fullkey = prefix + key;
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
 * Flattens complex server statistics into a simpler form.
 *
 * @param {RawServerStatus} serverStat - The raw server statistics result from Mongo.
 * @returns {SimpleServerStatus} - A single object with key value pairs for each stat.
 */
mongoTuning.convertStat = function (serverStat) {
  const returnStat = {};
  serverStat.statistics.forEach((stat) => {
    returnStat[stat.statistic] = stat.value;
  });
  return returnStat;
};

/**
 * Takes two sets of server statistics and calculates the difference and rate of change.
 * @param {Object} initialStats - First set of statistics.
 * @param {Object} finalStats - Second set of statistics.
 * @returns {Array<Object>} - Array of delta information.
 */
mongoTuning.serverStatDeltas = function (initialStats, finalStats) {
  const stat1 = mongoTuning.convertStat(initialStats);
  const stat2 = mongoTuning.convertStat(finalStats);
  let delta;
  let rate;
  const statDelta = {};
  statDelta.timeDelta = stat2.uptime - stat1.uptime;

  Object.keys(stat2).forEach((key) => {
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
      delta,
      rate,
    };
  });
  return statDelta;
};

/**
 * Simple helper function for searching derived server stats for matching keys.
 *
 * @param {Object} stats - The server statistics to search.
 * @param {String} regex - Regex to search for statistic keys.
 * @returns {Array<Object>} - An array of matching key value pairs.
 */
mongoTuning.serverStatSearch = function (stats, regex) {
  const returnArray = {};
  Object.keys(stats).forEach((key) => {
    if (key.match(regex)) {
      returnArray[key] = stats[key];
    }
  });
  return returnArray;
};

/**
 * Simple helper function for searching raw server stats for matching keys.
 *
 * @param {Object} stats - The server statistics to search.
 * @param {String} regex - Regex to search for statistic keys.
 * @returns {Array<Object>} - An array of matching key value pairs.
 */
mongoTuning.serverStatSearchRaw = function (stats, regex) {
  const returnArray = { deltas: {}, finals: {} };
  // First filter deltas.
  Object.keys(stats.deltas).forEach((key) => {
    if (key.match(regex)) {
      returnArray.deltas[key] = stats.deltas[key];
    }
  });
  // Then filter finals
  Object.keys(stats.finals).forEach((key) => {
    if (key.match(regex)) {
      returnArray.finals[key] = stats.finals[key];
    }
  });
  return returnArray;
};

/**
 * Derive some summary statistics from observed values.
 * @param {Object} serverData - Server data gathered from mongoTuning.monitorServer, should contain deltas and final values.
 * @returns {Object} - Data object containing the derived statistics.
 */
mongoTuning.derivedStatistics = function (serverData) {
  const { deltas, finals } = serverData;
  const data = {};
  const descriptions = {};
  // *********************************************
  //  Network counters
  // *********************************************

  data.netKBInPS = deltas['network.bytesIn'].rate / 1024;
  data.netKBOutPS = deltas['network.bytesOut'].rate / 1024;

  // ********************************************
  // Activity counters
  // ********************************************
  data.intervalSeconds = deltas.timeDelta;
  data.queryPS = deltas['opcounters.query'].rate;
  data.getmorePS = deltas['opcounters.getmore'].rate;
  data.commandPS = deltas['opcounters.command'].rate;
  data.insertPS = deltas['opcounters.insert'].rate;
  data.updatePS = deltas['opcounters.update'].rate;
  data.deletePS = deltas['opcounters.delete'].rate;

  // ********************************************
  // Document counters
  // ********************************************
  data.docsReturnedPS = deltas['metrics.document.returned'].rate;
  data.docsUpdatedPS = deltas['metrics.document.updated'].rate;
  data.docsInsertedPS = deltas['metrics.document.inserted'].rate;
  data.ixscanDocsPS = deltas['metrics.queryExecutor.scanned'].rate;
  data.collscanDocsPS = deltas['metrics.queryExecutor.scannedObjects'].rate;

  descriptions.scansToDocumentRatio =
    'Ratio of documents scanned to documents returned';
  if (data.docsReturnedPS > 0) {
    data.scansToDocumentRatio =
      (data.ixscanDocsPS + data.collscanDocsPS) / data.docsReturnedPS;
  } else {
    data.scansToDocumentRatio = 0;
  }

  // ********************************************
  // Transaction statistics
  // ********************************************
  data.transactionsStartedPS = deltas['transactions.totalStarted'].rate;
  data.transactionsAbortedPS = deltas['transactions.totalAborted'].rate;
  data.transactionsCommittedPS = deltas['transactions.totalCommitted'].rate;
  if (data.transactionsStartedPS > 0) {
    data.transactionAbortPct =
      (data.transactionsAbortedPS * 100) / data.transactionsStartedPS;
  } else {
    data.transactionAbortPct = 0;
  }

  if (deltas['opLatencies.reads.ops'].delta > 0) {
    data.readLatencyMs =
      deltas['opLatencies.reads.latency'].delta /
      deltas['opLatencies.reads.ops'].delta /
      1000;
  } else data.readLatency = 0;

  if (deltas['opLatencies.writes.ops'].delta > 0) {
    data.writeLatencyMs =
      deltas['opLatencies.writes.latency'].delta /
      deltas['opLatencies.writes.ops'].delta /
      1000;
  } else data.writeLatency = 0;

  if (deltas['opLatencies.commands.ops'].delta > 0) {
    data.cmdLatencyMs =
      deltas['opLatencies.commands.latency'].delta /
      deltas['opLatencies.commands.ops'].delta /
      1000;
  } else data.cmdLatency = 0;

  data.connections = deltas['connections.current'].lastValue;
  data.availableConnections = deltas['connections.available'].firstValue;
  data.assertsPS =
    deltas['asserts.regular'].rate +
    deltas['asserts.warning'].rate +
    deltas['asserts.msg'].rate +
    deltas['asserts.user'].rate +
    deltas['asserts.rollovers'].rate;

  data.activeReaders = finals['globalLock.activeClients.readers'];
  data.activeWriters = finals['globalLock.activeClients.writers'];
  data.queuedReaders = finals['globalLock.currentQueue.readers'];
  data.queuedWriters = finals['globalLock.currentQueue.writers'];

  // *********************************************************
  // Memory counters
  // *********************************************************


  data.cacheReadQAvailable =
    deltas['wiredTiger.concurrentTransactions.read.available'].lastValue;
  data.cacheReadQUsed =
    deltas['wiredTiger.concurrentTransactions.read.out'].lastValue;

  data.cacheWriteQAvailable =
    deltas['wiredTiger.concurrentTransactions.write.available'].lastValue;
  data.cacheWriteQUsed =
    deltas['wiredTiger.concurrentTransactions.write.out'].lastValue;

  data.cacheGetsPS =
    deltas['wiredTiger.cache.pages requested from the cache'].rate;

  data.cacheReadInsPS =
    deltas['wiredTiger.cache.pages read into cache'].rate;

  descriptions.wtHitRate =
    'Hit Rate in the wiredTigerCache ';
  if (data.cacheGetsPS > 0) {
    data.wtHitRate =
      ((data.cacheGetsPS - data.cacheReadInsPS) * 100) / data.cacheGetsPS;
  } else {
    data.wtHitRate = 0;
  }

  data.evictionsPs = deltas['wiredTiger.cache.eviction server evicting pages'].rate;
  data.evictionBlockedPs = deltas['wiredTiger.thread-yield.page acquire eviction blocked'].rate;
  if (data.evictionsPs > 0) {
    data.evictionBlockRate = (data.evictionBlockedPs * 100) / data.evictionsPs;
  } else data.evictionBlockRate = 0;

  if (data.cacheReadInsPS > 0) {
    data.evictionRate = (data.evictionsPs * 100) / data.cacheReadInsPS;
  } else data.evictionRate = 0;

  data.cacheHighWaterMB =
    deltas['wiredTiger.cache.maximum bytes configured'].lastValue / 1048576;

  data.cacheSizeMB =
    deltas['wiredTiger.cache.bytes currently in the cache'].lastValue / 1048576;

  data.diskBlockReadsPS = deltas['wiredTiger.block-manager.blocks read'].rate;
  data.diskBlockWritesPS =
    deltas['wiredTiger.block-manager.blocks written'].rate;

  data.logKBRatePS = deltas['wiredTiger.log.log bytes written'].rate / 1024;

  data.logSyncTimeRateMsPS =
    deltas['wiredTiger.log.log sync time duration (usecs)'].rate / 1000;

  Object.keys(data).forEach((key) => {
    if (data[key] % 1 > 0.01) {
      data[key] = data[key].toFixed(4);
    }
  });
  return data;
};


mongoTuning.memoryReport = () => {
  const serverStats = db.serverStatus();
  print('Mongod virtual memory ', serverStats.mem.virtual);
  print('Mongod resident memory', serverStats.mem.resident);
  print(
    'Wired Tiger cache size',
    Math.round(
      serverStats.wiredTiger.cache['bytes currently in the cache'] / 1048576
    )
  );
};
