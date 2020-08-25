export default {
  statisticDefinitions: [
    {
      name: 'activeReadSample',
      type: 'final',
      defaultSource: 'globalLock.activeClients.readers',
      versions: [
        {
          versionMask: '3.2.*',
          source: 'globalLock.active.readers'
        }
      ]
    },
    //
    // Network in-out
    //
    {
      name: 'network_bytesInPs',
      type: 'rate',
      description: 'data read into mongo server from network',
      unit: 'bytes',
      defaultSource: 'network.bytesIn'
    },
    {
      name: 'network_bytesOutPs',
      type: 'rate',
      description: 'data written to network from mongo server',
      unit: 'bytes',
      defaultSource: 'network.bytesOut'
    },
    //
    // mongoDB panel statistics
    //
    // operations per second
    {
      name: 'operations_QueryPs',
      type: 'rate',
      description: 'Querys executed per second',
      unit: 'OpPerSecond',
      defaultSource: 'opcounters.query'
    },
    {
      name: 'operations_CommandPs',
      type: 'rate',
      description: 'Commands executed per second',
      unit: 'OpPerSecond',
      defaultSource: 'opcounters.command'
    },
    {
      name: 'operations_InsertPs',
      type: 'rate',
      description: 'Inserts executed per second',
      unit: 'OpPerSecond',
      defaultSource: 'opcounters.insert'
    },
    {
      name: 'operations_UpdatePs',
      type: 'rate',
      description: 'Updates executed per second',
      unit: 'OpPerSecond',
      defaultSource: 'opcounters.update'
    },
    {
      name: 'operations_DeletePs',
      type: 'rate',
      description: 'Deletes executed per second',
      unit: 'OpPerSecond',
      defaultSource: 'opcounters.delete'
    },
    //
    // Document counters
    //
    {
      name: 'document_returned',
      type: 'rate',
      description: 'Documents returned per second',
      unit: 'OpPerSecond',
      defaultSource: 'metrics.document.returned'
    },
    {
      name: 'document_updated',
      type: 'rate',
      description: 'Documents updated per second',
      unit: 'OpPerSecond',
      defaultSource: 'metrics.document.updated'
    },
    {
      name: 'document_deleted',
      type: 'rate',
      description: 'Documents deleted per second',
      unit: 'OpPerSecond',
      defaultSource: 'metrics.document.deleted'
    },
    {
      name: 'document_inserted',
      type: 'rate',
      description: 'Documents inserted per second',
      unit: 'OpPerSecond',
      defaultSource: 'metrics.document.inserted'
    },
    //
    // Scans, scans and sorts
    //
    {
      name: 'query_ixscanDocs',
      type: 'rate',
      description: 'Number of scan operations per seecond',
      unit: 'OpPerSecond',
      defaultSource: 'metrics.queryExecutor.scanned'
    },
    {
      name: 'query_collscanDocs',
      type: 'rate',
      description: 'Number of objects scanned per seecond',
      unit: 'OpPerSecond',
      defaultSource: 'metrics.queryExecutor.scannedObjects'
    },
    {
      name: 'query_scanAndOrder',
      type: 'rate',
      description: 'Number of collscans including a sort per second',
      unit: 'OpPerSecond',
      defaultSource: 'metrics.operation.scanAndOrder'
    },
    //
    // Connections
    //
    {
      name: 'connections_current',
      type: 'final',
      description: 'Number of connections currently open',
      unit: 'integerValue',
      defaultSource: 'connections.current'
    },
    {
      name: 'connections_available',
      type: 'final',
      description: 'Number of connections available',
      unit: 'integerValue',
      defaultSource: 'connections.available'
    },
    //
    // Read/Write queues
    //
    {
      name: 'queue_readersActive',
      type: 'final',
      description: 'Current number of read operations',
      unit: 'integerValue',
      defaultSource: 'globalLock.activeClients.readers'
    },
    {
      name: 'queue_readersQueued',
      type: 'final',
      description: 'Current number of queued read operations',
      unit: 'integerValue',
      defaultSource: 'globalLock.currentQueue.readers'
    },
    {
      name: 'queue_writersActive',
      type: 'final',
      description: 'Current number of write operations',
      unit: 'integerValue',
      defaultSource: 'globalLock.activeClients.writers'
    },
    {
      name: 'queue_writersQueued',
      type: 'final',
      description: 'Current number of queued write operations',
      unit: 'integerValue',
      defaultSource: 'globalLock.currentQueue.writers'
    },
    {
      name: 'queue_totalActive',
      type: 'final',
      description: 'Current number of all operations',
      unit: 'integerValue',
      defaultSource: 'globalLock.activeClients.total'
    },
    {
      name: 'queue_totalQueued',
      type: 'final',
      description: 'Current number of queued operations',
      unit: 'integerValue',
      defaultSource: 'globalLock.currentQueue.total'
    },
    {
      name: 'latency_writeOpsPs',
      type: 'rate',
      description: 'Number of write operations per second',
      unit: 'OpPerSecond',
      defaultSource: 'opLatencies.writes.ops'
    },
    {
      name: 'latency_writeWaitUsPs',
      type: 'rate',
      description: 'Time spent per second for write operations',
      unit: 'microseconds',
      defaultSource: 'opLatencies.writes.latency'
    },
    {
      name: 'latency_readOpsPs',
      type: 'rate',
      description: 'Number of read operations per second',
      unit: 'OpPerSecond',
      defaultSource: 'opLatencies.reads.ops'
    },
    {
      name: 'latency_readWaitUsPs',
      type: 'rate',
      description: 'Time spent per second for read operations',
      unit: 'microseconds',
      defaultSource: 'opLatencies.reads.latency'
    },
    {
      name: 'latency_commandOpsPs',
      type: 'rate',
      description: 'Number of command operations per second',
      unit: 'OpPerSecond',
      defaultSource: 'opLatencies.commands.ops'
    },
    {
      name: 'latency_commandWaitUsPs',
      type: 'rate',
      description: 'Time spent per second for command operations',
      unit: 'microseconds',
      defaultSource: 'opLatencies.commands.latency'
    },
    //
    // MOngoDB memory utilization
    //
    {
      name: 'mem_resident',
      type: 'final',
      description: 'Resident memory size',
      unit: 'MB',
      defaultSource: 'mem.resident'
    },
    {
      name: 'mem_virtual',
      type: 'final',
      description: 'Virtual memory size',
      unit: 'MB',
      defaultSource: 'mem.virtual'
    },
    //
    // Blocks in/out wiredTiger cache
    //
    {
      name: 'wtCache_readRequestsPs',
      type: 'rate',
      description: 'number of pages requested from the wiredTiger cache per second',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.cache.pages requested from the cache'
    },
    {
      name: 'wtCache_readIntoCachePs',
      type: 'rate',
      description: 'number of pages read into the wiredTiger cache per second',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.cache.pages read into cache'
    },
    {
      name: 'wtCache_maxBytes',
      type: 'final',
      description: 'Maximum size of the wiredTiger cache',
      unit: 'bytes',
      defaultSource: 'wiredTiger.cache.maximum bytes configured'
    },
    {
      name: 'wtCache_currentBytes',
      type: 'final',
      description: 'Current size of the wiredTiger cache',
      unit: 'bytes',
      defaultSource: 'wiredTiger.cache.bytes currently in the cache'
    },
    {
      name: 'wtCache_dirtyBytes',
      type: 'final',
      description: 'Modified bytes in the wiredTiger cache',
      unit: 'bytes',
      defaultSource: 'wiredTiger.cache.tracked dirty bytes in the cache'
    },
    {
      name: 'wtCache_evictionsPs',
      type: 'rate',
      description: 'Pages evicted from the wiredTiger cache per second',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.cache.eviction worker thread evicting pages'
    },
    //
    // Wired Tiger transaction tickets
    //
    {
      name: 'wtTransactions_readAvailable',
      type: 'final',
      description: 'Number of read tickets available in wiredTiger',
      unit: 'integerValue',
      defaultSource: 'wiredTiger.concurrentTransactions.read.available'
    },
    {
      name: 'wtTransactions_readOut',
      type: 'final',
      description: 'Number of read tickets in use in wiredTiger',
      unit: 'integerValue',
      defaultSource: 'wiredTiger.concurrentTransactions.read.out'
    },
    {
      name: 'wtTransactions_writeAvailable',
      type: 'final',
      description: 'Number of write tickets available in wiredTiger',
      unit: 'integerValue',
      defaultSource: 'wiredTiger.concurrentTransactions.write.available'
    },
    {
      name: 'wtTransactions_writeOut',
      type: 'final',
      description: 'Number of write tickets in use in wiredTiger',
      unit: 'integerValue',
      defaultSource: 'wiredTiger.concurrentTransactions.write.out'
    },
    //
    // WiredTiger IOs
    //
    {
      name: 'wtIO_writeIOps',
      type: 'rate',
      description: 'wiredTiger write IO rate',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.connection.total write I/Os'
    },
    {
      name: 'wtIO_readIOps',
      type: 'rate',
      description: 'wiredTiger read IO rate',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.connection.total read I/Os'
    },
    {
      name: 'wtIO_fsyncIOps',
      type: 'rate',
      description: 'wiredTiger fsync IO rate',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.connection.total fsync I/Os'
    },
    //
    // WiredTiger readLatencyRate
    //
    {
      name: 'wtIO_diskToCachePs',
      type: 'rate',
      description: 'wiredTiger disk to cache IO rate',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.cache.application threads page read from disk to cache count'
    },
    {
      name: 'wtIO_diskToCacheUsPs',
      type: 'rate',
      description: 'wiredTiger disk to cache time per second',
      unit: 'microseconds',
      defaultSource:
        'wiredTiger.cache.application threads page read from disk to cache time (usecs)'
    },
    {
      name: 'wtIO_cacheToDiskPs',
      type: 'rate',
      description: 'wiredTiger cache to disk IO rate',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.cache.application threads page write from cache to disk count'
    },
    {
      name: 'wtIO_cacheToDiskUsPs',
      type: 'rate',
      description: 'wiredTiger cache to disk time per second',
      unit: 'microseconds',
      defaultSource:
        'wiredTiger.cache.application threads page write from cache to disk time (usecs)'
    },
    {
      name: 'wtIO_logSyncTimeUsPs',
      type: 'rate',
      description: 'wiredTiger log sync time per second',
      unit: 'microseconds',
      defaultSource: 'wiredTiger.log.log sync time duration (usecs)'
    },
    {
      name: 'wtIO_logSyncPs',
      type: 'rate',
      description: 'wiredTiger log sync operations per second',
      unit: 'OpPerSecond',
      defaultSource: 'wiredTiger.log.log sync operations'
    },
    //
    // wiredTiger log
    //
    {
      name: 'wtLog_maxLogSize',
      type: 'final',
      description: 'wiredTiger maximum log file size',
      unit: 'bytes',
      defaultSource: 'wiredTiger.log.maximum log file size'
    },
    {
      name: 'wtLog_currentLogSize',
      type: 'final',
      description: 'wiredTiger current log file size',
      unit: 'bytes',
      defaultSource: 'wiredTiger.log.total log buffer size'
    }
  ],
  calculations: [
    {
      name: 'wtCache_cleanBytes',
      expression: 'wtCache_currentBytes-wtCache_dirtyBytes',
      description: 'Unmodified bytes in the wiredTiger cache',
      unit: 'milliseconds',
      ifZeroDivide: 0
    },
    {
      name: 'latency_writeAvgLatencyMs',
      expression: '(latency_writeWaitUsPs/1000)/latency_writeOpsPs',
      description: 'average time for a mongoDB write request',
      unit: 'milliseconds',
      ifZeroDivide: 0
    },
    {
      name: 'latency_readAvgLatencyMs',
      expression: '(latency_readWaitUsPs/1000)/latency_readOpsPs',
      description: 'average time for a mongoDB read request',
      unit: 'milliseconds',
      ifZeroDivide: 0
    },

    {
      name: 'wtCache_MissPct',
      expression: 'wtCache_readIntoCachePs*100/wtCache_readRequestsPs',
      description: 'Percentage of time a needed page is not found in wiredTiger cache',
      unit: 'Percentage',
      ifZeroDivide: 0
    },
    {
      name: 'wtIO_readLatencyUs',
      expression: '(wtIO_diskToCacheUsPs)/wtIO_diskToCachePs',
      description: 'Average time for a wiredTiger disk read',
      unit: 'microseconds',
      ifZeroDivide: 0
    },
    {
      name: 'wtIO_logSyncLatencyUs',
      expression: '(wtIO_logSyncTimeUsPs)/wtIO_logSyncPs',
      description: 'Average time for a wiredTiger log Sync',
      unit: 'microseconds',
      ifZeroDivide: 0
    },
    {
      name: 'wtIO_writeLatencyUs',
      expression: '(wtIO_cacheToDiskUsPs)/wtIO_cacheToDiskPs',
      description: 'Average time for a wiredTiger disk write',
      unit: 'microseconds',
      ifZeroDivide: 0
    },
    {
      name: 'wtTransactions_readPct',
      expression:
        'wtTransactions_readOut*100/(wtTransactions_readOut+wtTransactions_readAvailable)',
      description: 'Percentage of wiredTiger read transactions in use',
      unit: 'Percentage',
      ifZeroDivide: 0
    },
    {
      name: 'wtTransactions_writePct',
      expression:
        'wtTransactions_writeOut*100/(wtTransactions_writeOut+wtTransactions_writeAvailable)',
      description: 'Percentage of wiredTiger write transactions in use',
      unit: 'Percentage',
      ifZeroDivide: 0
    },
    {
      name: 'query_scanToDocRatio',
      expression: '(query_collscanDocs+query_ixscanDocs)/document_returned',
      description: 'Ratio of documents examined to documents returned',
      unit: 'Float',
      ifZeroDivide: 0
    },
    {
      name: 'query_pctIxDocs',
      expression: 'query_ixscanDocs*100/(query_collscanDocs+query_ixscanDocs)',
      description: 'Percentage of documents examined by index',
      unit: 'Percentage',
      ifZeroDivide: 0
    },
    {
      name: 'connections_inusePct',
      expression: 'connections_current*100/(connections_current+connections_available)',
      description: 'Percentage connections in use',
      unit: 'Percentage',
      ifZeroDivide: 0
    },
    {
      name: 'queue_queuedPct',
      expression:
        '(queue_readersQueued+queue_writersQueued)*100/(queue_readersActive+queue_readersQueued+queue_writersActive+ queue_writersQueued)',
      description: 'Percentage of read/writes which are queued',
      unit: 'Percentage',
      ifZeroDivide: 0
    }
  ]
};
