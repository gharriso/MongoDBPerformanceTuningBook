# MongoDB Performance Tuning Book

This repository contains helper scripts and examples for the Apress book "MongoDB Performance Tuning". - https://www.apress.com/us/book/9781484268780 


The master script [mongoTuning.js](mongoTuning.js) provides access to all these scripts from within a MongoDB shell session.  To use these scripts from within a MongoDB shell, simply issue the mongo command with the script name as an argument and add the '--shell' option, for example:
```
$ mongo --shell mongoTuning.js
MongoDB shell version v4.2.0
connecting to: mongodb://127.0.0.1:27017/?compressors=disabled&gssapiServiceName=mongodb
 
MongoDB server version: 4.2.0

rs0:PRIMARY>
```

The examples can also be found in our GitHub repository under the [Examples](Examples) folder.  The data that these examples use can be found in the [sampleData](sampleData) folder as a compressed dump file.  Instructions on how to load the data can be found in the same folder. 

If you have any queries about this repository, please contact Guy at <guy.a.harrison@gmail.com> or Mike at <michael.j.harrison@outlook.com>.

