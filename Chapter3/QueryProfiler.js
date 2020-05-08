var dbePr = {};

/**
 * Fetch simplified profiling info for a given database and namespace.
 *
 * @param {string} dbName - The name of the database to fetch profiling data for.
 * @param {string} collectionName - The name of the collection to fetch profiling data for.
 *
 * @returns {ProfilingData} Profiling data for the given namespace (queries only), grouped and simplified.
 */
dbePr.getProfileData = function (dbName, collectionName) {
  var mydb = db.getSiblingDB(dbName); // eslint-disable-line
  var ns = dbName + '.' + collectionName;
  var profileData = mydb
    .getSiblingDB(dbName)
    .getCollection('system.profile')
    .aggregate([
      {
        $match: {
          ns: ns,
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
