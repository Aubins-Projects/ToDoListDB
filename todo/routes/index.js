var express = require('express');
var router = express.Router();
var mongodb =require('mongodb');
var username = "testman";


function Comparator(a, b) {
    if (parseInt(a.priority) < parseInt(b.priority)) return -1;
    else if (parseInt(a.priority) > parseInt(b.priority)) return 1;
    else return 0;
}
function ComparatorD(a, b) {
    if (a.duedate < b.duedate) return -1;
    else if (a.duedate > b.duedate) return 1;
    else return 0;
}


/* GET home page.*/
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Task Manager' });
});


router.post('/verifyuser', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/tracker';

  MongoClient.connect(url, function(err, db){
    if (err){
      console.log("unable to connect to the server",err);
    }
    else {
      console.log("Connection Established!");

      username = req.body.user;
      res.redirect("thelist");

    }

  })

});

router.post('/edittask', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/tracker';
  var item = mongodb.ObjectId(req.body.user);
  console.log(item);

  MongoClient.connect(url, function(err, db){
    if (err){
      console.log("unable to connect to the server",err);
    }
    else {
      console.log("Connection Established!");

      var collection = db.collection('tasks');
      collection.find({"_id": item}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {
          //res.send(result);
          res.render('edittask',{
            "edittask":result
          });
        } else {
          res.send('No Documents found');
        }
        db.close();
      })
    }

  })

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
      collection.find({"user": username}).toArray(function(err, result){
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

router.get('/sortP', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/tracker';

  MongoClient.connect(url, function(err, db){
    if (err){
      console.log("unable to connect to the server",err);
    }
    else {
      console.log("Connection Established!");

      var collection = db.collection('tasks');
      collection.find({"user": username}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {

          const newlist = result.splice(0);
          newlist.sort(Comparator);
          //res.send(result);
          res.render('trackerlist',{
            "trackerlist":newlist
          });
        } else {
          res.send('No Documents found');
        }
        db.close();
      })
    }

  })

});


router.get('/sortD', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/tracker';

  MongoClient.connect(url, function(err, db){
    if (err){
      console.log("unable to connect to the server",err);
    }
    else {
      console.log("Connection Established!");

      var collection = db.collection('tasks');
      collection.find({"user": username}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {

          const newlist = result.splice(0);
          newlist.sort(ComparatorD);
          //res.send(result);
          res.render('trackerlist',{
            "trackerlist":newlist
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




router.post('/changetask', function(req, res){

    // Get a Mongo client to work with the Mongo server
    var MongoClient = mongodb.MongoClient;

    // Define where the MongoDB server is
  var url = 'mongodb://localhost:27017/tracker';

    // Connect to the server
    MongoClient.connect(url, function(err, db){
      if (err) {
        console.log('Unable to connect to the Server:', err);
      } else {
        console.log('Connected to Server');

        // Get the documents collection
        var collection = db.collection('tasks');


        var task1 = {name: req.body.task, time: [parseInt(req.body.hours),parseInt(req.body.minutes)],
          duedate: req.body.duedate, complete: false, priority: req.body.priority, subtask: req.body.subtask,
          user: req.body.user};
        var myQuery = {_id:mongodb.ObjectId(req.body._id)};



        collection.updateOne(myQuery,task1, function (err, result){
          if (err) {
            console.log(err);
          } else {

            // Redirect to the updated student list
            res.redirect("thelist");
          }

          // Close the database
          db.close();
        });

      }
    });

  });

  router.post('/deletetask', function(req, res) {
    var MongoClient = mongodb.MongoClient;
    var url = 'mongodb://localhost:27017/tracker';
    var item = mongodb.ObjectId(req.body.user);
    console.log(item);

    MongoClient.connect(url, function(err, db){
      if (err){
        console.log("unable to connect to the server",err);
      }
      else {
        console.log("Connection Established!");

        var collection = db.collection('tasks');
        collection.deleteOne(({"_id": item}), function(err, result){
          if (err){
            res.send(err);
          }
          else {
            res.redirect("thelist");
          }
          db.close();
        })
      }

    })

  });




  router.post('/addtask', function(req, res){

      // Get a Mongo client to work with the Mongo server
      var MongoClient = mongodb.MongoClient;

      // Define where the MongoDB server is
    var url = 'mongodb://localhost:27017/tracker';

      // Connect to the server
      MongoClient.connect(url, function(err, db){
        if (err) {
          console.log('Unable to connect to the Server:', err);
        } else {
          console.log('Connected to Server');
          console.log("The username is below");
          console.log(username);
          // Get the documents collection
          var collection = db.collection('tasks');

          // Get the student data passed from the form
          var task1 = {name: req.body.task, time: [parseInt(req.body.hours),parseInt(req.body.minutes)],
            duedate: req.body.duedate, complete: false, priority: req.body.priority, subtask: req.body.subtask,
            user: username};

          // Insert the student data into the database
          collection.insert([task1], function (err, result){
            if (err) {
              console.log(err);
            } else {

              // Redirect to the updated student list
              res.redirect("thelist");
            }

            // Close the database
            db.close();
          });

        }
      });

    });

module.exports = router;
