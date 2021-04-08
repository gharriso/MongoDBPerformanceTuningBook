# MongoDB Performance Tuning Book

## Usage

This repository contains helper scripts and examples for the Apress book "MongoDB Performance Tuning". - https://www.apress.com/us/book/9781484268780

The master script [mongoTuning.js](mongoTuning.js) provides access to all these scripts from within a MongoDB shell session. To use these scripts from within a MongoDB shell, simply issue the mongo command with the script name as an argument and add the '--shell' option, for example:

```
$ mongo --shell mongoTuning.js
MongoDB shell version v4.2.0
connecting to: mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb

MongoDB server version: 4.2.0

rs0:PRIMARY>
```

## Contents

- [mongoTuning.js](mongoTuning.js) is a master script, compiling a number of helper functions into a single object that is used throughout the book.
- The [examples](examples) folder contains some example scripts for using some of our helper functions along with output..
- The [sampleData](sampleData) directory contains all the data used in our examples as a compressed dump file. Instructions on how to load the data can be found in the same folder.
- The scripts directory contains all the individual scripts which together create the master script(_mongoTuning.js_) along with some additional scripts that may not be used.
- The [misc](misc) directory contains some files or data that is referenced in the book but not directly by the scripts, for example some sample alarms and metric calculations that readers may find userful.
- [ExplainPlanSteps.md](ExplainPlanSteps.md) contains a breakdown of the various different stages you may encounter in an explain plan, along with a simple explanation of that stage.

## Contact Us

If you have any queries about this repository, please contact Guy at <guy.a.harrison@gmail.com> or Mike at <michael.j.harrison@outlook.com>.
