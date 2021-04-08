/*
 * Utility script used for comparing view versus aggregation performance.
 *
 * @Authors: Michael Harrison (Michael.J.Harrison@outlook.com) and Guy Harrison (Guy.A.Harrison@gmail.com).
 * @Date:   2020-09-03T17:54:50+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2021-04-08T10:46:25+10:00
 *
 */
let viewTests = {};
viewTests.runAggregates = function (runs) {
  let results = [];
  let runningAverage = 0;
  for (let i = 0; i < runs; i++) {
    print('Run #' + i);
    let ep = db.movies.explain('executionStats').aggregate([
      {
        $project: {
          genres: 1,
          plot: 1,
          title: 1,
          countries: 1,
          type: 1,
          released: 1,
        },
      },
      { $unwind: '$genres' },
      { $unwind: '$countries' },
      { $match: { countries: 'USA', genres: 'Short' } },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'movie_id',
          as: 'comments',
        },
      },
      { $match: { comments: { $size: 1 } } },
      { $limit: 10 },
    ]);
    results.push(ep.stages[0]['$cursor'].executionStats.executionTimeMillis);
    runningAverage +=
      ep.stages[0]['$cursor'].executionStats.executionTimeMillis;
  }
  printjson(results);
  print(runningAverage / runs);
};

viewTests.runViewQueries = function (runs) {
  let results = [];
  let runningAverage = 0;
  for (let i = 0; i < runs; i++) {
    print('Run #' + i);
    let ep = db.usa_short_films
      .find({ comments: { $size: 1 } })
      .limit(10)
      .explain('executionStats');
    // printjson(ep);
    results.push(ep.stages[0]['$cursor'].executionStats.executionTimeMillis);
    runningAverage +=
      ep.stages[0]['$cursor'].executionStats.executionTimeMillis;
  }
  printjson(results);
  print(runningAverage / runs);
};

viewTests.createMaterialisedView = function () {
  db.movies.aggregate([
    {
      $project: {
        genres: 1,
        plot: 1,
        title: 1,
        countries: 1,
        type: 1,
        released: 1,
      },
    },
    { $unwind: '$genres' },
    { $unwind: '$countries' },
    { $match: { countries: 'USA', genres: 'Short' } },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'movie_id',
        as: 'comments',
      },
    },
    {
      $merge: {
        into: 'usa_short_films_merged',
        whenMatched: 'replace',
      },
    },
  ]);
};

viewTests.runMaterialisedViewQueries = function (runs) {
  let results = [];
  let runningAverage = 0;
  for (let i = 0; i < runs; i++) {
    print('Run #' + i);
    let ep = db.usa_short_films_merged
      .find({ comments: { $size: 1 } })
      .limit(10)
      .explain('executionStats');
    // printjson(ep);
    results.push(ep.executionStats.executionTimeMillis);
    runningAverage += ep.executionStats.executionTimeMillis;
  }
  printjson(results);
  print(runningAverage / runs);
};
