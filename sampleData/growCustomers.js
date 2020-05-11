
use MongoDBTuningBook;
var firstnames=db.customers.distinct("FirstName");
var lastnames=db.customers.distinct('LastName');
var phones=db.customers.distinct("Phone");
var dobs=db.customers.distinct("dob");

function getRandom(arrayIn) {
  let elem=Math.round((Math.random()*arrayIn.length+1));
  return(arrayIn[elem]);
}
db.customers.count();
var baseCustomers=db.customers.find({},{'_id':0}).toArray();
baseCustomers.forEach((cust)=>{

   cust.FirstName=getRandom(firstnames);
   cust.LastName=getRandom(lastnames);
   cust.Phone=getRandom(phones);
   cust.dob=getRandom(dobs);
   var rc=db.customers.insert(cust);
})
db.customers.count();