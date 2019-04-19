var express = require('express');
var router = express.Router();
var mongodb =require('mongodb');

if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

localStorage.username = "testman";
localStorage.workhours = 480;
localStorage.buffertime = 0;
localStorage.endtimelist=[16,1];
localStorage.miscKill=0;

function updateDate(list){
  var today= new Date();
  var currentDay=today.getDate();
  var currentYear=today.getYear()+1900;
  var currentMonth=today.getMonth()+1;
  if(currentMonth<10){
    currentMonth="0"+currentMonth;
  }
  if(currentDay<10){
    currentDay="0"+currentDay;
  }
  var current_string=currentYear+"-"+currentMonth+"-"+currentDay;
  for(var i=0;i<list.length;i++){
  if (list[i].subtask=="on"){
    list[i].duedate=current_string;
  }
}
  return list;
}

function Comparator(a, b) {
    if (parseInt(a.priority) < parseInt(b.priority)) return -1;
    else if (parseInt(a.priority) > parseInt(b.priority)) return 1;
    else return 0;
}
function ComparatorD(a, b) {
    console.log(a.duedate);
    console.log(b.duedate);
    if (a.duedate < b.duedate) return -1;


    else if (a.duedate > b.duedate) return 1;
    else return 0;
}

function timeCheck(){
  var today = new Date();
  //today.setTime(today.getTime()-today.getTimezoneOffset()*60*1000);
  return today;
}

function timeCompare(end,begintime){
  var current=timeCheck();
  var current_hours=current.getHours();
  var current_minutes=current.getMinutes();
  //console.log(current_hours+" hours currently");
  var current_string='01/01/2011 '+current_hours+':'+current_minutes+':00';
  console.log(current_string);
  var end_string='01/01/2011 '+end[0]+':'+end[1]+':00';
  console.log(end_string);
  var current_Fixed= Date.parse(current_string);
  var end_fixed=Date.parse(end_string);
  var diffMs= end_fixed-current_Fixed;
  var diffDays = Math.floor(diffMs / 86400000); // days
  var diffHrs = Math.floor((diffMs % 86400000) / 3600000); // hours
  var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
  console.log(diffDays + " days, " + diffHrs + " hours, " + diffMins + " minutes");
  var timeRemaining=parseInt(diffHrs)*60+parseInt(diffMins);
  console.log("Total Minutes left minus the Misc: " + timeRemaining);
  if (timeRemaining<begintime){
  return timeRemaining;
}
  else {
    return begintime;
  }
}


/* GET home page.*/
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Task Manager',
    user:localStorage.username,
    time:localStorage.workhours
   });
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

      localStorage.username = req.body.user;
      var endstr= req.body.endtime;
      var startstr=req.body.starttime;
      var miscmins=req.body.misctime;
      localStorage.miscKill=miscmins;
      var start=startstr.split(':');
      var end=endstr.split(':');
      localStorage.endtimelist=end;
      var tmins=(parseInt(end[0])-parseInt(start[0]))*60+(parseInt(end[1])-parseInt(start[1]))-miscmins;
      localStorage.workhours=tmins;
      console.log("Brand new work mins: "+localStorage.workhours);

      res.redirect("thelist");

    }

  })

});

router.post('/edittask', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/tracker';
  var item = mongodb.ObjectId(req.body.user);
  ///console.log(item);

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
  localStorage.workhours=timeCompare(localStorage.endtimelist, localStorage.workhours);
  MongoClient.connect(url, function(err, db){
    if (err){
      console.log("unable to connect to the server",err);
    }
    else {
      console.log("Connection Established!");

      var collection = db.collection('tasks');
      collection.find({"user": localStorage.username, "complete":false}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {
          //res.send(result);
          result=updateDate(result);
          res.render('trackerlist',{
            "trackerlist":result,
            "title": "Tasks"
          });
        } else {
          res.render('addtask', {title: 'Add New Task'});
        }
        db.close();
      })
    }

  })

});

router.get('/prioritize', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/tracker';

  MongoClient.connect(url, function(err, db){
    if (err){
      console.log("unable to connect to the server",err);
    }
    else {
      console.log("Connection Established!");

      var collection = db.collection('tasks');
      collection.find({"user": localStorage.username, "complete":false}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {
          result=updateDate(result);
          const newlist = result.splice(0);
          newlist.sort(Comparator);
          var bonus_list=[];
          var denied_list=[];
          var allowed_list=[];
          var totaltime=0;
          var totalh=0;
          var totalm=0;
          var usabletime=localStorage.workhours;
          console.log("should be using this for priority: "+usabletime);
          for (var i = 0; i < newlist.length; i++){
            //console.log("This is the item im looking at: "+newlist[i]);
            //console.log("This is the time im looking at: "+newlist[i].time[0]+"hours "+newlist[i].time[1]+"minutes");
            totaltime+=(parseInt(newlist[i].time[0])*60 + parseInt(newlist[i].time[1]))
            if (totaltime<=localStorage.workhours){
              allowed_list.push(newlist[i]);
              usabletime-=(parseInt(newlist[i].time[0])*60 + parseInt(newlist[i].time[1]));
            }
            else{
              denied_list.push(newlist[i]);
            }
            totalm+=(parseInt(newlist[i].time[1]))
            if (totalm>59){
              totalm-=60
              totalh+=1
            }
            totalh+=(parseInt(newlist[i].time[0]))

          }
          denied_list.sort(ComparatorD);
          for (var i = 0; i < denied_list.length; i++){
            var totalt=(parseInt(denied_list[i].time[0])*60 + parseInt(denied_list[i].time[1]))
            if (totalt<(localStorage.buffertime+usabletime)){
              bonus_list.push(denied_list[i])
            }

          }
          console.log(usabletime);
          //res.send(result);
          res.render('sortP',{
            "trackerlist": allowed_list,
            "bonuslist": bonus_list,
            "deniedlist":denied_list,
            "freeTime": usabletime
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
      collection.find({"user": localStorage.username, "complete": false}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {
          result=updateDate(result);
          const newlist = result.splice(0);
          newlist.sort(Comparator);
          var bonus_list=[];
          var denied_list=[];
          var allowed_list=[];
          var totaltime=0;
          var totalh=0;
          var totalm=0;
          var usabletime=localStorage.workhours;
          for (var i = 0; i < newlist.length; i++){
            //console.log("This is the item im looking at: "+newlist[i]);
            console.log("This is the time im looking at: "+newlist[i].time[0]+"hours "+newlist[i].time[1]+"minutes");
            totaltime+=(parseInt(newlist[i].time[0])*60 + parseInt(newlist[i].time[1]))
            if (totaltime<=localStorage.workhours){
              allowed_list.push(newlist[i]);
              usabletime-=(parseInt(newlist[i].time[0])*60 + parseInt(newlist[i].time[1]));
            }
            else{
              denied_list.push(newlist[i]);
            }
            totalm+=(parseInt(newlist[i].time[1]))
            if (totalm>59){
              totalm-=60
              totalh+=1
            }
            totalh+=(parseInt(newlist[i].time[0]))

          }

          for (var i = 0; i < denied_list.length; i++){
            var totalt=(parseInt(denied_list[i].time[0])*60 + parseInt(denied_list[i].time[1]))
            if (totalt<(2*usabletime)){
              bonus_list.push(denied_list[i])
            }

          }
          console.log(usabletime);
          //res.send(result);
          res.render('trackerlist',{
            "trackerlist": newlist,
            "bonuslist": bonus_list,
            "freeTime": usabletime,
            "title":"Tasks"
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
      collection.find({"user": localStorage.username, "complete": false}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {
          result=updateDate(result);
          const newlist = result.splice(0);
          newlist.sort(ComparatorD);
          //res.send(result);
          res.render('trackerlist',{
            "trackerlist":newlist,
            "title":"Tasks"
          });
        } else {
          res.send('No Documents found');
        }
        db.close();
      })
    }

  })

});

router.get('/showcomplete', function(req, res) {
  var MongoClient = mongodb.MongoClient;
  var url = 'mongodb://localhost:27017/tracker';

  MongoClient.connect(url, function(err, db){
    if (err){
      console.log("unable to connect to the server",err);
    }
    else {
      console.log("Connection Established!");

      var collection = db.collection('tasks');
      collection.find({"user": localStorage.username, "complete": true}).toArray(function(err, result){
        if (err){
          res.send(err);
        } else if (result.length) {
          result=updateDate(result);
          const newlist = result.splice(0);
          newlist.sort(ComparatorD);
          //res.send(result);
          res.render('trackerlist',{
            "trackerlist":newlist,
            "title":"Completed Tasks"
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
        var tempbool=false;
        // Get the documents collection
        var collection = db.collection('tasks');
        if (req.body.complete == "on"){
        console.log("found it to be true");
        var tempbool=true;
      }
      var today =new Date();

        var task1 = {name: req.body.task, time: [parseInt(req.body.hours),parseInt(req.body.minutes)],
          duedate: req.body.duedate, complete: tempbool, priority: req.body.priority, subtask: req.body.subtask,
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
          console.log(localStorage.username);
          // Get the documents collection
          var collection = db.collection('tasks');

          // Get the student data passed from the form
          var task1 = {name: req.body.task, time: [parseInt(req.body.hours),parseInt(req.body.minutes)],
            duedate: req.body.duedate, complete: false, priority: req.body.priority, subtask: req.body.subtask,
            user: localStorage.username};

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
