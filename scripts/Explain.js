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
      step.inputStages.forEach(function (inputStage) {
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
  } else return { ok: 0, error: 'No executionStats found' };
};

mongoTuning.executionStats = (execStatsIn) => {
  const execStats = mongoTuning.prepExecutionStats(execStatsIn);
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
      step.inputStages.forEach(function (inputStage) {
        printInputStage(inputStage, depth + 1);
      });
    }
    let extraData = '(';
    if ('indexName' in step) extraData += ' ' + step.indexName;
    if ('executionTimeMillisEstimate' in step) {
      extraData += ' ms:' + step.executionTimeMillisEstimate;
    }
    if ('keysExamined' in step) extraData += ' keys:' + step.keysExamined;
    if ('docsExamined' in step) extraData += ' docs:' + step.docsExamined;
    extraData += ')';
    print(stepNo++, printSpaces(depth), step.stage, extraData);
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
