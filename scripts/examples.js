load('./scripts/ServerStats.js');
var sample1=mongoTuning.takeSample();
sleep(2000);
var sample2=mongoTuning.takeSample();
mongoTuning.summary(sample1,sample2);