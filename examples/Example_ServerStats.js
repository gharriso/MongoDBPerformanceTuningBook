/*
 * Example script which uses the Server Statistics sub-script to gather some performance data.
 *
 * @Authors: Michael Harrison (Michael.J.Harrison@outlook.com) and Guy Harrison (Guy.A.Harrison@gmail.com).
 * @Date:   2020-09-03T17:54:50+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2021-04-08T10:49:07+10:00
 *
 */
load('../scripts/ServerStats.js');
var sample1 = mongoTuning.serverStatSample();
sleep(60000);
var sample2 = mongoTuning.serverStatSample();
mongoTuning.serverStatSummary(sample1, sample2);
var deltas = mongoTuning.serverStatDeltas(sample1, sample2);
deltas['opcounters.query'];
mongoTuning.serverStatSearch(deltas, /opLatencies.writes/);
