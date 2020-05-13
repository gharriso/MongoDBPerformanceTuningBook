use MongoDBTuningBook
db.customers.findOne();
db.customers.find().forEach(cust => {
  if ('Rentals' in cust) {
    let rentals = cust.Rentals;
    let id = cust['_id'];
    delete cust['Rentals'];
    delete cust['_id'];

    let views = [];
    rentals.forEach(rental => {
      let randomDate = new Date(
        new Date() - Math.random() * 1000 * 3600 * 24 * 365 * 10
      );
      views.push({
        viewDate: randomDate,
        filmId: rental.filmId,
        title: rental['Film Title']
      });
    });
    cust.views = views;
    //printjson(cust);
    let rc = db.customers.update({ _id: id }, cust);
    printjson(rc);
  }
});
