use MongoDBTuningBook

db.customers.find().forEach((c)=>{
  db.customers.update({'_id':c['_id']},{$set:{dateOfBirth:c['dob']}});
});

var c=db.customers.findOne();
delete c.dob;
Object.keys(c);

