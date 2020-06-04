load('./scripts/ServerStats.js');
var sample1=mongoTuning.serverStatSample()
sleep(60000)
var sample2=mongoTuning.serverStatSample();
mongoTuning.serverStatSummary(sample1,sample2);
var deltas=mongoTuning.serverStatDeltas(sample1,sample2);
deltas["opcounters.query"];
mongoTuning.serverStatSearch(deltas,/opLatencies.writes/);