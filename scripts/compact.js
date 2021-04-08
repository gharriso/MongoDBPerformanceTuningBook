/*
 * Compact helper functions for the Apress book "MongoDB Performance Tuning"
 *
 * @Authors: Michael Harrison (Michael.J.Harrison@outlook.com) and Guy Harrison (Guy.A.Harrison@gmail.com).
 * @Date:   2020-09-03T17:54:50+10:00
 * @Last modified by:   Michael Harrison
 * @Last modified time: 2021-04-08T10:52:59+10:00
 *
 */
mongoTuning.reusablePct = function (collectionName) {
  let collstats = db.getCollection(collectionName).stats();
  let reusable =
    collstats.wiredTiger['block-manager']['file bytes available for reuse'];
  let size = collstats.wiredTiger['block-manager']['file size in bytes'];
  let reusablePct = Math.round((reusable * 100) / size);
  print('Size:', size, ' Reusable: ', reusable, ' ', reusablePct, '%');
  return Math.round((reusable * 100) / size);
};
