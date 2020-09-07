db.customers.find({dob:{$type:6}}).forEach((cust)=>{
  var year=1000*3600*24*365;
  randDate=new Date(new Date()-(Math.random()*year*55)-10*year);
  let rc=db.customers.update({_id:cust['_id']},{$set:{dob:randDate}});
  printjson(rc);
});
