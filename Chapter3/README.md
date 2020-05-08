# CHAPTER 3 SCRIPTS: TOOLS OF THE TRADE

## ServerStats.js

This script contains helper functions for transforming and simplifying the results of the MongoDB command **db.serverStatus()**. There are three main functions you may want to use, these are contained within the **dbeSS** object:

- **dbeSS.serverStatistics()**: Will gather the results of a MongoDB **db.serverStatus()** and return them in a flattened object that is easier to interpret.
- **dbeSS.summary(statsA, statsB)**: Will compare two stat objects returned from **dbeSS.serverStatistics()** and summarize the delta between each stat.
- **dbeSS.takeSample(interval)**: Will run a **dbeSS.summary(statsA, statsB)** with statsA and statsB being collection **interval** milliseconds apart.

## QueryProfiler.js

This script contains helper functions for more easily interpreting information from the Query Profiler. You will first need to enable profiling `db.setProfilingLevel(2)`. You can set all profiling data in the **system.profile** collection for a given database, or for more simplified results of a single namespace:

- **dbePr.getProfileData(db, collection)**: Will search the **system.profile** collection and return aggregated results, grouping queries with information such as number of queries, planSummary and number of documents examined versus returned.
