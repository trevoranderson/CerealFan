// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");
Reviews = new Meteor.Collection("reviews");

if (Meteor.isClient) {
  
  Template.leaderboard.players = function () {
    var togg = Session.get("sort_by");
    if (togg === "score"){
       return Players.find({}, {sort: {score: -1}});
    } else {
        return Players.find({}, {sort: {name: 1}});
    }
  };

  Template.reviews.dbreviews = function () {
    return Reviews.find({}, {sort: {name: 1}});
  };

  Template.leaderboard.selected_name = function () {
    var player = Players.findOne(Session.get("selected_player"));
    return player && player.name;
  };

  Template.player.selected = function () {
    return Session.equals("selected_player", this._id) ? "selected" : '';
  };

  Template.leaderboard.events({
    'click input.inc': function () {
      Players.update(Session.get("selected_player"), {$inc: {score: 5}});
    },

    'click input.dec': function() {
	Players.update(Session.get("selected_player"), {$inc: {score: -5}});
    },

    'click input.changesort': function(){
     var switch_sort = Session.equals("sort_by", "name")?"score":"name";
     Session.set("sort_by", switch_sort);
     var togg = Session.get("sort_by");
     if (togg === "score"){
           Players.find({}, {sort: {score: -1}});

     } else {

                 Players.find({}, {sort: {name: 1}});
     }
    },
    
    'click input.resetVals': function() {
       Players.find({}).forEach(function(player) {
         Players.update(player._id, {$set: {score: randomScore()}});
       });
    },

    'click input.del' : function() {
       Players.remove(Session.get("selected_player"));
    },
  });

 Template.addPlayer.events = {
    'click input.add': function () {
      // todo - add validation
      Players.insert({name: playerName.value, score: 0 });
    }
  };


  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });
}
var randomScore = function()
{
  return Math.floor(Random.fraction()*10)*5;
}
// On server startup, create some players if the database is empty.
if (Meteor.isServer) {
  Meteor.startup(function () {
    if (Players.find().count() === 0) {
      var names = ["Ada Lovelace",
                   "Grace Hopper",
                   "Marie Curie",
                   "Carl Friedrich Gauss",
                   "Nikola Tesla",
                   "Claude Shannon"];
      for (var i = 0; i < names.length; i++)
        Players.insert({name: names[i], score: randomScore() });
    }
    if (Reviews.find().count() === 0) {
      var products = ["CaptainCrunch","YuppyCereal"];
      for(var i =0; i < products.length; i+=1){
        Reviews.insert( {name: products[i], cats: [{weight: 0, catname: "tastyness", isPositive: 1, numRatings : 1}]} );
      }
    }
  });
}
