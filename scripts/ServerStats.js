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
 * Returns a simplified list of stats with a key value pair for each stat.
 *
 * @returns {SimpleServerStatus} - A single object with key value pairs for each stat.
 */
mongoTuning.simpleStats = function () {
  return mongoTuning.convertStat(mongoTuning.serverStatistics());
};

/**
 * Converts a stats object into a simplified stats object.
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
 * Finds the difference between two stats.
 *
 */
mongoTuning.serverStatDeltas = function (instat1, instat2) {
  const stat1 = mongoTuning.convertStat(instat1);
  const stat2 = mongoTuning.convertStat(instat2);
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
 * Function for comparing two sets of ServerStats collected at different times.
 *
 * @param {FlatServerStats} sample1 - Pass in some stats (for example from mongoTuning.serverStats()) to compare with sample2
 * @param {FlatServerStats} sample2 - Pass in some stats (for example from mongoTuning.serverStats()) to compare with sample1
 * @returns {ServerStatsSummary}
 */
mongoTuning.serverStatSummary = function (sample1, sample2) {
  // TODO: Statistic names change over versions
  const data = {};
  const deltas = mongoTuning.serverStatDeltas(sample1, sample2);

  const finals = mongoTuning.convertStat(sample2);

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

  data.activeReaders = finals['globalLock.activeClients.readers'];
  data.activeWriters = finals['globalLock.activeClients.writers'];
  data.queuedReaders = finals['globalLock.currentQueue.readers'];
  data.queuedWriters = finals['globalLock.currentQueue.writers'];
  // var lockRe = /locks.*acquireCount.*floatApprox
  //
  // The "time acquiring" counts for locks seem to appoear only after some significant
  // waits have occured.  Sometimes it's timeAcquiringMicros, and
  // sometimes it's timeAcquireingMicros.*k.floatApprox
  //
  // print(deltas['opLatencies.reads.ops']);
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

  // *********************************************************
  // Memory counters
  // *********************************************************

  data.cacheGetsPS =
    deltas['wiredTiger.cache.pages requested from the cache'].rate;

  data.cacheHighWaterMB =
    deltas['wiredTiger.cache.maximum bytes configured'].lastValue / 1048576;

  data.cacheSizeMB =
    deltas['wiredTiger.cache.bytes currently in the cache'].lastValue / 1048576;

  /* data.cacheReadQAvailable =
    deltas['wiredTiger.concurrentTransactions.read.available'].lastValue;
  data.cacheReadQUsed =
    deltas['wiredTiger.concurrentTransactions.read.out'].lastValue;

  data.cacheWriteQAvailable =
    deltas['wiredTiger.concurrentTransactions.write.available'].lastValue;
  data.cacheWriteQUsed =
    deltas['wiredTiger.concurrentTransactions.write.out'].lastValue;*/

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

/**
 * Takes two server stat samples between the interval and them summarizes them.
 *
 * @param {int} interval - The wait in between server stats samples.
 * @returns {ServerStatsSummary}
 */
mongoTuning.startSampling = function () {
  return mongoTuning.serverStatistics();
};

/**
 * Takes two server stat samples between the interval and them summarizes them.
 *
 * @param {Object} sampleStart - The original sample that was taken.
 * @param {boolean} fullStats - Return the full stats or not.
 * @returns {ServerStatsSummary}
 */
mongoTuning.stopSampling = function (sampleStart, fullStats) {
  if (!sampleStart) {
    print(
      'stopSample requires a sample object, created using mongoTuning.startSampling'
    );
  }
  return mongoTuning.serverStatSummary(
    sampleStart,
    mongoTuning.serverStatistics(),
    fullStats
  );
};

mongoTuning.searchStats = function (serverStats, regex) {
  const returnArray = [];
  if (serverStats.statistics) {
    serverStats.statistics.forEach((stat) => {
      if (stat.statistic.match(regex)) {
        returnArray.push(stat);
      }
    });
  } else {
    return mongoTuning.searchSample(serverStats, regex);
  }

  return returnArray;
};

mongoTuning.serverStatSearch = function (sample, regex) {
  const returnArray = {};
  Object.keys(sample).forEach((key) => {
    if (key.match(regex)) {
      returnArray[key] = sample[key];
    }
  });
  return returnArray;
};

mongoTuning.monitorServer = function (duration) {
  let runningStats;
  let initialStats;
  const runTime = 0;
  initialStats = mongoTuning.serverStatistics();
  sleep(duration);
  finalStats = mongoTuning.serverStatistics();
  const deltas = mongoTuning.serverStatDeltas(initialStats, finalStats);
  const finals = mongoTuning.convertStat(finalStats);
  return {
    deltas,
    finals
  };
};

mongoTuning.keyServerStats = function (durationSeconds, regex) {
  const monitoringData = mongoTuning.monitorServer(durationSeconds*1000);
  return(mongoTuning.keyServerStatsFromSample(monitoringData,regex));
};

mongoTuning.keyServerStatsFromSample = function (monitoringData,regex) {
 
  const data = mongoTuning.derivedStatistics(monitoringData);
  if (regex) {
    return mongoTuning.serverStatSearch(data, regex);
  }
  return data;
};

mongoTuning.monitorServerRaw = function (duration, regex) {
  const data = mongoTuning.monitorServer(duration);
  if (regex) {
    return mongoTuning.serverStatSearch(data, regex);
  }
  return data;
};
mongoTuning.derivedStatistics = function (monitoringData) {
  const {
    deltas,
    finals
  } = monitoringData;
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

  
  descriptions.scansToDocumentRatio = 'Ratio of documents scanned to documents returned';
  if (data.docsReturnedPS > 0) {
    data.scansToDocumentRatio =
      (data.ixscanDocsPS +
        data.collscanDocsPS) /
        data.docsReturnedPS;
  } else {
    data.scansToDocumentRatio = 0;
  }
  
  // ********************************************
  // Transaction statistics 
  // ********************************************
  data.transactionsStartedPS=deltas['transactions.totalStarted'].rate;
  data.transactionsAbortedPS=deltas['transactions.totalAborted'].rate;
  data.transactionsCommittedPS=deltas['transactions.totalCommitted'].rate;
  if (data.transactionsStartedPS>0) {
    data.transactionAbortPct=data.transactionsAbortedPS*100/
      data.transactionsStartedPS;
  } else {
    data.transactionAbortPct=0;
  }
 

  if (deltas['opLatencies.reads.ops'].delta > 0) {
    data.readLatencyMs =
      deltas['opLatencies.reads.latency'].delta /
      deltas['opLatencies.reads.ops'].delta /
      1000;
  } else { data.readLatency = 0; }

  if (deltas['opLatencies.writes.ops'].delta > 0) {
    data.writeLatencyMs =
      deltas['opLatencies.writes.latency'].delta /
      deltas['opLatencies.writes.ops'].delta /
      1000;
  } else { data.writeLatency = 0; }

  if (deltas['opLatencies.commands.ops'].delta > 0) {
    data.cmdLatencyMs =
      deltas['opLatencies.commands.latency'].delta /
      deltas['opLatencies.commands.ops'].delta /
      1000;
  } else { data.cmdLatency = 0; }

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
