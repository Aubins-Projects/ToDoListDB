var express = require('express');
var router = express.Router();
var mongodb =require('mongodb');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/thelist', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/tracker';

  MongoClient.connect(url, function(err, db){
    if (err){
      console.log("unable to connect to the server",err);
    }
    else {
      console.log("Connection Established!");

      var collection = db.collection('tasks');
      collection.find({}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {
          //res.send(result);
          res.render('trackerlist',{
            "trackerlist":result
          });
        } else {
          res.send('No Documents found');
        }
        db.close();
      })
    }

  })

});

router.get('/addtask', function(req, res){
  res.render('addtask', {title: 'Add New Task'});
});

module.exports = router;
