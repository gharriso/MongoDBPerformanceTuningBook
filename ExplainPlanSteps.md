
**MongoDB Explain() plan steps**

Interpreting explain plans is a core competency for any MongoDB
performance practitioner, and we've seen many examples of explain plans
in the book. In this appendix, we list all of the individual step
definitions that we are aware of and give a brief explanation of each.

|Step|Description|
|--- | -------------------------------------------------- |
|**AND_HASH**                 | Merge two or more index outputs for an index intersection plan. 
|**AND_SORTED**                |Merge two or more index outputs for an index intersection plan.
|**CACHED_PLAN**|               Indicates that a plan was retrieved from the plan cache rather than from a real-time optimizer action.
|  **COLLSCAN**  |                Read every document in the collection.
|  **COUNT**      |               Count the documents supplied by the inut step.
|  **COUNT_SCAN**  |              A quick count of the documents returned by an index scan.
|  **DELETE**       |             Documents are being deleted
|  **DISTINCT_SCAN** |            An index scan that returns only unique values for a key
|  **ENSURE_SORTED**  |           Checks the output of the previous stage to ensure that it is in the expected sorted order
|  **EOF** |                      Usually means that the collection queried does not exist.
|  **FETCH**|                     Get documents from a collection. This usually occurs after in index scan when additional attributes are required for filtering or projecting.
|  **GEO_NEAR_2D**|               Get documents using a geospatial query against a 2d index to calculate geometries. Intended for legacy coordinate pairs in earlier versions of MongoDB.
|  **GEO_NEAR_2DSPHERE** |        Get documents using a geospatial query against a 2dsphere index to calculate geometries on a sphere. More commonly found in modern versions of MongoDB.
 | **IDHACK** |                   Get a document using the "\_id" attribute.
|  **IXSCAN**  |                  An index is scanned looking for matching documents or to return documents in sorted order.
 | **LIMIT**    |                 Restricts the number of documents returned in the subsequent stages.
 | **MOCK**      |                Used only in unit tests to mock results for testing.
 | **MULTI_ITERATOR** |           Iterates over a collection. This stage is commonly seen in \$sample stages of aggregations.
 | **MULTI_PLAN** |               Multiple query plans were evaluated during command execution
 | **OR**         |               Two results were merged for a \$or operations -- usually associated with an index merge.
 | **PROJECTION_COVERED** |        An explicit projection which is supported by an index scan (eg, for a "covered" index query).
 | **PROJECTION_DEFAULT**  |      A "default" projection, where no explicit projection is requested.
 | **PROJECTION_SIMPLE**   |      An explicit projection which is supported by a collection access -- usually preceded by a FETCH or COLLSCAN step.
|  **QUEUED_DATA**         |      Usually associated with a GetMore operation that retrieves data from an open cursor.
|  **RECORD_STORE_FAST_COUNT** |  Access the MongoDB "fast count" value for a collection -- to avoid having to scan the collection when a document count is requested.
 | **RETURN_KEY** |               Indicates that the returnkey() modifier was issued, to return index key values only.
  |**SHARD_MERGE** |              Data from multiple shards was merged.
 | **SHARDING_FILTER** |          Data is returned from an individual shard to the mongos process.
 | **SKIP**  |                    Documents were skipped.
 | **SORT**   |                   Documents from the previous step where sorted.
 | **SORT_KEY_GENERATOR** |       Keys from the previous step are extracted to be fed into a subsequent sort step.
 | **SORT_MERGE** |               An index merge in which the results from multiple index scans are sorted and merged
 | **SUBPLAN**    |               The outputs of multiple query plans (usually index scans) are combined to support an \$or operation.
 | **TEXT**        |              Returns documents that have resulted from a text search.
 | **TEXT_MATCH**   |             Returns any documents output from the previous stage matching a given text search query.
 | **TEXT_OR**       |            Returns documents containing positive terms in a text search query, along with their scores.
 | **TRIAL**          |           Stage for choosing between two alternate plans based on an initial trial period.
 | **UPDATE**          |          Documents are updated.
                                
