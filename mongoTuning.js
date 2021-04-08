/*
 * Master utility script for the Apress book "MongoDB Performance Tuning" containing all functions from the "scripts" directory.
 *
 * @Authors: Michael Harrison (Michael.J.Harrison@outlook.com) and Guy Harrison (Guy.A.Harrison@gmail.com).
 * @Date:   2020-09-03T17:54:50+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2021-04-08T10:53:12+10:00
 *
 */

var mongoTuning = {};

// SERVER STATS
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
mongoTuning.keyServerStats = function (duration, regex) {
  const monitoringData = mongoTuning.monitorServer(duration);
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
  return derivedStats;
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
  return monitoringData;
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
  data.globalLockQueue = {
    readActive: data.activeReaders,
    readQueued: data.queuedReaders,
    writeActive: data.activeWriters,
    writeQueued: data.queuedWriters,
  };

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

  data.cacheReadInsPS = deltas['wiredTiger.cache.pages read into cache'].rate;

  descriptions.cacheHitRate = 'Hit Rate in the wiredTigerCache ';
  if (data.cacheGetsPS > 0) {
    data.cacheHitRate =
      ((data.cacheGetsPS - data.cacheReadInsPS) * 100) / data.cacheGetsPS;
  } else {
    data.cacheHitRate = 0;
  }

  data.evictionsPs = deltas['wiredTiger.cache.internal pages evicted'].rate;
  data.evictionBlockedPs =
    deltas['wiredTiger.thread-yield.page acquire eviction blocked'].rate;
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

  data.logSyncOpsPS = deltas['wiredTiger.log.log sync operations'].rate;

  if (data.logSyncOpsPS > 0) {
    data.logAvgSyncTime = data.logSyncTimeRateMsPS / data.logSyncOpsPS;
  } else data.logAvgSyncTime = 0;

  // *********************************************************
  // Disk IO
  // *********************************************************

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

// QUERY PROFILER
mongoTuning.profileQuery = () => {
  const profileQuery = db.system.profile.aggregate([
    {
      $group: {
        _id: { cursorid: '$cursorid' },
        count: { $sum: 1 },
        'queryHash-max': { $max: '$queryHash' },
        'millis-sum': { $sum: '$millis' },
        'ns-max': { $max: '$ns' },
      },
    },
    {
      $group: {
        _id: {
          queryHash: '$queryHash-max',
          collection: '$ns-max',
        },
        count: { $sum: 1 },
        millis: { $sum: '$millis-sum' },
      },
    },
    { $sort: { millis: -1 } },
    { $limit: 10 },
  ]);
  return profileQuery;
};
/**
 * Get details of a query from system.profile using the queryhash
 *
 * @param {string} queryHash - The queryHash of the query of interest.
 *
 * @returns {queryDetails} query ns, command and basic statistics
 */
mongoTuning.getQueryByHash = function (queryHash) {
  return db.system.profile.findOne(
    { queryHash },
    { ns: 1, command: 1, docsExamined: 1, millis: 1, planSummary: 1 }
  );
};
/**
 * Fetch simplified profiling info for a given database and namespace.
 *
 * @param {string} dbName - The name of the database to fetch profiling data for.
 * @param {string} collectionName - The name of the collection to fetch profiling data for.
 *
 * @returns {ProfilingData} Profiling data for the given namespace (queries only), grouped and simplified.
 */
mongoTuning.getProfileData = function (dbName, collectionName) {
  var mydb = db.getSiblingDB(dbName); // eslint-disable-line
  const ns = dbName + '.' + collectionName;
  const profileData = mydb
    .getSiblingDB(dbName)
    .getCollection('system.profile')
    .aggregate([
      {
        $match: {
          ns,
          op: 'query',
        },
      },
      {
        $group: {
          _id: {
            filter: '$query.filter',
          },
          count: {
            $sum: 1,
          },
          'millis-sum': {
            $sum: '$millis',
          },
          'nreturned-sum': {
            $sum: '$nreturned',
          },
          'planSummary-first': {
            $first: '$planSummary',
          },
          'docsExamined-sum': {
            $sum: '$docsExamined',
          },
        },
      },
      {
        $sort: {
          'millis-sum': -1,
        },
      },
    ]);
  return profileData;
};

// CURENT OP
mongoTuning.printCurrentOps = function (printZeroSecs, printInternalProcess) {
  // console.log(COps);
  var mydb = db.getSiblingDB('admin'); // eslint-disable-line
  var output = [];
  var result = {};
  var currentOps = mydb.currentOp();
  if (currentOps.hasOwnProperty('errmsg')) {
    output.push({
      error: currentOps.errmsg,
    });
  } else {
    var opArray = [];
    // print(clusterOps); print("+++++++++++++++"); print(JSON.stringify(currentOps));
    var inprog = currentOps.inprog;
    var server = currentOps.server;
    inprog.forEach(function (currentOp) {
      // printjson(currentOp);
      var secs = 0;

      if (currentOp.hasOwnProperty('secs_running')) {
        secs = currentOp.secs_running;
      }
      var myop = currentOp.op;
      var query = {};
      if ('query' in currentOp) {
        query = JSON.stringify(currentOp.query);
      } else if ('command' in currentOp) {
        query = JSON.stringify(currentOp.command);
      }
      if (query.length > 2) {
        myop = query;
      }
      opArray.push({
        server: server,
        desc: currentOp.desc,
        secs: secs,
        ns: currentOp.ns,
        op: myop,
        opid: currentOp.opid,
      });
      //
    });

    opArray.sort(function (a, b) {
      // Sort in desc order of seconds active
      return b.secs - a.secs;
    });
    // printjson(opArray); // eslint-disable-line
    opArray.forEach(function (op) {
      if (
        (printZeroSecs === true || op.secs > 0) &&
        (printInternalProcess === true ||
          (op.desc !== 'rsBackgroundSync' &&
            op.desc !== 'ReplBatcher' &&
            op.desc !== 'rsSync' &&
            op.desc !== 'WT RecordStoreThread: local.oplog.rs' &&
            op.desc !== 'SyncSourceFeedback' &&
            op.desc !== 'NoopWriter' &&
            op.ns != 'local.oplog.rs'))
      ) {
        output.push({
          desc: op.desc,
          secs: op.secs,
          ns: op.ns,
          op: op.op,
          opid: op.opid,
        });
      }
    });
  }
  result.ops = output;
  return result;
};

mongoTuning.opForKillList = function () {
  var output = [];
  mongoTuning.printCurrentOps(true, false).ops.forEach(function (op) {
    var outStr =
      op.opid + ' ' + op.secs + ' seconds running. ' + op.desc + ' ' + op.ns;
    output.push(outStr);
  });
  return output;
};

mongoTuning.killOp = function (opIdString) {
  var opid = opIdString.split(' ')[0];
  if (opid.indexOf(':') == -1) {
    opid = parseInt(opid); // eslint-disable-line
  }
  print('Issuing kill on ' + opid);
  var ret = db.killOp(opid); //eslint-disable-line
  printjson(ret); // eslint-disable-line
};

// EXPLAIN
mongoTuning.prepExplain = (explainInput) => {
  // Takes as input explain output in one of the follow formats:
  // A fully explain JSON document, in which case emits winningPlan
  // An explain() cursor in which case, extracts the winningPlan from the cursor
  // A specific plan step in which case just returns that

  const keys = Object.keys(explainInput);
  // printjson(keys);
  if (keys.includes('queryPlanner')) {
    // This looks like a top level Explain
    return explainInput.queryPlanner.winningPlan;
  } else if (keys.includes('hasNext')) {
    // This looks like a cursor
    if (explainInput.hasNext()) {
      return mongoTuning.prepExplain(explainInput.next());
    }
    return { ok: 0, error: 'No plan found' };
  } else if (keys.includes('stage')) {
    // This looks like an actual plan
    return explainInput;
  }
  return { ok: 0, error: 'No plan found' };
};
mongoTuning.quickExplain = (inputPlan) => {
  // Takes as input an explain Plan.  Emits a simplified
  // version of that plan
  const explainPlan = mongoTuning.prepExplain(inputPlan);
  let stepNo = 1;

  const printSpaces = function (n) {
    let s = '';
    for (let i = 1; i < n; i++) {
      s += ' ';
    }
    return s;
  };
  const printInputStage = function (step, depth) {
    if ('inputStage' in step) {
      printInputStage(step.inputStage, depth + 1);
    }
    if ('inputStages' in step) {
      step.inputStages.forEach((inputStage) => {
        printInputStage(inputStage, depth + 1);
      });
    }
    if ('indexName' in step) {
      print(stepNo++, printSpaces(depth), step.stage, step.indexName);
    } else {
      print(stepNo++, printSpaces(depth), step.stage);
    }
  };
  printInputStage(explainPlan, 1);
};
mongoTuning.prepExecutionStats = (explainInput) => {
  // Takes as input explain output in one of the follow formats:
  // A fully explain JSON document, in which case emits executionStats
  // An explain() cursor in which case, extracts the exectionStats from the cursor

  const keys = Object.keys(explainInput);

  if (keys.includes('executionStats')) {
    // This looks like a top level Explain
    return explainInput.executionStats;
  } else if (keys.includes('hasNext')) {
    // This looks like a cursor

    if (explainInput.hasNext()) {
      return mongoTuning.prepExecutionStats(explainInput.next());
    }
  } else if (explainInput.stages) {
  } else return { ok: 0, error: 'No executionStats found' };
};
mongoTuning.executionStats = (execStatsIn) => {
  if (execStatsIn.stages) {
    return aggregationExecutionStats(execStatsIn);
  }
  const execStats = mongoTuning.prepExecutionStats(execStatsIn);
  // printjson(execStats);
  let stepNo = 1;
  print('\n');
  const printSpaces = function (n) {
    let s = '';
    for (let i = 1; i < n; i++) {
      s += ' ';
    }
    return s;
  };
  var printInputStage = function (step, depth) {
    if ('inputStage' in step) {
      printInputStage(step.inputStage, depth + 1);
    }
    if ('inputStages' in step) {
      step.inputStages.forEach((inputStage) => {
        printInputStage(inputStage, depth + 1);
      });
    }
    if ('shards' in step) {
      step.shards.forEach((inputShard) => {
        printInputStage(inputShard, depth + 1);
      });
    }
    if ('shardName' in step) {
      printInputStage(step.executionStages, depth + 1);
    }
    let extraData = '(';
    let printStage = 'unknown';
    if ('stage' in step) {
      printStage = step.stage;
    }
    if ('shardName' in step) {
      printStage = 'Shard ==> ' + step.shardName;
    }
    if ('indexName' in step) extraData += ' ' + step.indexName;
    if ('executionTimeMillisEstimate' in step) {
      extraData += ' ms:' + step.executionTimeMillisEstimate;
    }
    if ('executionTimeMillis' in step) {
      extraData += ' ms:' + step.executionTimeMillis;
    }
    if ('nReturned' in step) {
      extraData += ' returned:' + step.nReturned;
    }
    if ('keysExamined' in step) extraData += ' keys:' + step.keysExamined;
    if ('docsExamined' in step) extraData += ' docs:' + step.docsExamined;
    if ('nWouldModify' in step && step.nWouldModify !== false)
      extraData += ' upd:' + step.nWouldModify;
    if ('wouldInsert' in step && step.wouldInsert !== false)
      extraData += ' ins:' + step.wouldInsert;
    extraData += ')';
    print(stepNo++, printSpaces(depth), printStage, extraData);
  };
  printInputStage(execStats.executionStages, 1);
  print(
    '\nTotals:  ms:',
    execStats.executionTimeMillis,
    ' keys:',
    execStats.totalKeysExamined,
    ' Docs:',
    execStats.totalDocsExamined
  );
};
mongoTuning.aggregationExecutionStats = (execStatsIn) => {
  // printjson(execStatsIn);
  let execStats = {};
  let stepNo = 1;
  if (
    execStatsIn.stages &&
    execStatsIn.stages[0].$cursor &&
    execStatsIn.stages[0].$cursor.executionStats
  ) {
    execStats = execStatsIn.stages[0].$cursor.executionStats;
  } else if (execStatsIn.executionStats) {
    execStats = execStatsIn.executionStats;
  }
  print('\n');
  const printSpaces = function (n) {
    let s = '';
    for (let i = 1; i < n; i++) {
      s += ' ';
    }
    return s;
  };
  var printInputStage = function (step, depth) {
    if ('inputStage' in step) {
      printInputStage(step.inputStage, depth + 1);
    }
    if ('inputStages' in step) {
      step.inputStages.forEach((inputStage) => {
        printInputStage(inputStage, depth + 1);
      });
    }
    let extraData = '(';
    if ('indexName' in step) extraData += ' ' + step.indexName;
    if ('executionTimeMillisEstimate' in step) {
      extraData += ' ms:' + step.executionTimeMillisEstimate;
    }
    if ('keysExamined' in step) extraData += ' keys:' + step.keysExamined;
    if ('docsExamined' in step) {
      extraData += ' docsExamined:' + step.docsExamined;
    }
    if ('nReturned' in step) extraData += ' nReturned:' + step.nReturned;
    extraData += ')';
    print(stepNo++, printSpaces(1), step.stage, extraData);
  };

  const printAggStage = function (stage, depth) {
    let extraData = '(';
    if ('executionTimeMillisEstimate' in stage) {
      extraData += ' ms:' + stage.executionTimeMillisEstimate;
    }
    if ('docsExamined' in stage) extraData += ' examined:' + stage.docsExamined;
    if ('nReturned' in stage) extraData += ' returned:' + stage.nReturned;
    extraData += ')';
    print(
      stepNo++,
      printSpaces(depth),
      Object.keys(stage)
        .find((key) => key.match(/$/))
        .toUpperCase(),
      extraData
    );
  };
  if (execStats.executionStages) {
    printInputStage(execStats.executionStages, 1);
  }

  if (execStatsIn && execStatsIn.stages) {
    for (let stageNum = 1; stageNum < execStatsIn.stages.length; stageNum++) {
      if (execStatsIn.stages[stageNum]) {
        printAggStage(execStatsIn.stages[stageNum], 1);
      }
    }
  }

  print(
    '\nTotals:  ms:',
    execStats.executionTimeMillis,
    ' keys:',
    execStats.totalKeysExamined,
    ' Docs:',
    execStats.totalDocsExamined
  );
};

// COMPACT
mongoTuning.reusablePct = function (collectionName) {
  let collstats = db.getCollection(collectionName).stats();
  let reusable =
    collstats.wiredTiger['block-manager']['file bytes available for reuse'];
  let size = collstats.wiredTiger['block-manager']['file size in bytes'];
  let reusablePct = Math.round((reusable * 100) / size);
  print('Size:', size, ' Reusable: ', reusable, ' ', reusablePct, '%');
  return Math.round((reusable * 100) / size);
};
