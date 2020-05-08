// Master utility script for the Apress book "MongoDB Performance Tuning"

/* eslint no-var: 0 */
/* eslint no-prototype-builtins: 0 */
/* eslint camelcase: 0 */
/* eslint prefer-arrow-callback: 0 */
/* eslint object-shorthand: 0 */
/* eslint vars-on-top: 0 */
/* eslint no-unused-vars: 0 */
/* eslint no-plusplus: 0 */

var mongoTuning = {};

 mongoTuning.prepExplain = (explainInput) => {
  // Takes as input explain output in one of the follow formats:
  // A fully explain JSON document, in which case emits winningPlan
  // An explain() cursor in which case, extracts the winningPlan from the cursor
  // A specific plan step in which case just returns that
  let type;
  const keys = Object.keys(explainInput);
 // printjson(keys);
  if (keys.includes('queryPlanner')) {
    // This looks like a top level Explain
    return explainInput.queryPlanner.winningPlan;
  } else if (keys.includes('hasNext')) {
    // This looks like a cursor
    if (explainInput.hasNext()) {
      return (mongoTuning.prepExplain(explainInput.next()));
    }
      return ({ok:0, error:'No plan found'});
  } else if (keys.includes('stage')) {
    // This looks like an actual plan
    return (explainInput);
  }
    return ({ok:0, error:'No plan found'});
};

mongoTuning.quickExplain = (inputPlan) => {
  // Takes as input an explain Plan.  Emits a simplified
  // version of that plan
  const explainPlan = mongoTuning.prepExplain(inputPlan);
  var stepNo = 1;

  var printSpaces = function(n) {
    var s = '';
    for (var i = 1; i < n; i++) {
      s += ' ';
    }
    return s;
  };
  var printInputStage = function(step, depth) {
    if ('inputStage' in step) {
      printInputStage(step.inputStage, depth + 1);
    }
    if ('inputStages' in step) {
      step.inputStages.forEach(function(inputStage) {
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


