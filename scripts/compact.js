mongoTuning.reusablePct= function(collectionName) {
    let  collstats=db.getCollection(collectionName).stats();
    let reusable=collstats.wiredTiger["block-manager"]["file bytes available for reuse"];
    let size=collstats.wiredTiger["block-manager"]["file size in bytes"];
    let reusablePct=Math.round(reusable*100/size);
    print('Size:',size,' Reusable: ',reusable,' ',reusablePct,'%');
    return(Math.round(reusable*100/size));
  }