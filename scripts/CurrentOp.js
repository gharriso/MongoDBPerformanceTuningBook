/*
 * Current Op helper functions for the Apress book "MongoDB Performance Tuning"
 *
 * @Authors: Michael Harrison (Michael.J.Harrison@outlook.com) and Guy Harrison (Guy.A.Harrison@gmail.com).
 * @Date:   2020-09-03T17:54:50+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2021-04-08T10:50:37+10:00
 *
 */
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
