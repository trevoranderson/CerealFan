// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");
Reviews = new Meteor.Collection("reviews");

if (Meteor.isClient) {
  var formBuffer = [];
  function submitDone(input){
//		console.log(formBuffer);
	
		var obj = Reviews.findOne({_id:input._id});
//		console.log(obj);
		for(var i in formBuffer){
//			console.log(formBuffer[i].catname);
//			console.log(obj.cats);
			var ind = -1;
			for(var j in obj.cats){
				if(obj.cats[j].catname == formBuffer[i].catname){
					 ind = j; 
					 break;
				}
			}
			if(ind == -1){
				obj.cats.push(formBuffer[i]);
				Reviews.update({_id:input._id}, {$set:{"cats":obj.cats}});
			}else{
				console.log("HEY BUDDEY");
				var total = obj.cats[ind].numRatings +1;
//				console.log(obj.cats[ind].numRatings);
				obj.cats[ind].weight = (((total-1)/total) * obj.cats[ind].weight) + ((1/total) * formBuffer[i].weight);
//				console.log(obj.cats[ind].weight);
				obj.cats[ind].isPositive = (obj.cats[ind].numPos + formBuffer[i].isPositive) > 0 ? 1 : -1;
				obj.cats[ind].numPos = obj.cats[ind].numPos + formBuffer[i].isPositive;
				obj.cats[ind].numRating++; 
				obj.cats.sort(function(a,b){ return b.weight - a.weight}); 
				Reviews.update({_id:input._id}, {$set:{ "cats": obj.cats}});
		}
	  }
  }   



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

  Template.player.events({
    'click': function () {
      Session.set("selected_player", this._id);
    }
  });

 Template.reviews.events({
    'keydown': function (){
		// Code to do smart search goes HERE
		var txt = document.getElementsByName('catname')[0].value;
	//	console.log(txt);
		var obj = Reviews.findOne({_id: this._id});
//console.log(obj);
		var mycats = obj.cats;
//console.log(mycats);
		var outputs = substrings(txt, mycats);
//console.log(outputs);
		if(outputs.length === 0){
			document.getElementById("smartsearch").innerHTML = txt;
		}
		else{
			document.getElementById("smartsearch").innerHTML = outputs[0]; 
			//smartsearch.value = outputs[0];
		}
	}
  });

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


  Template.reviews.selected_reviews = function () {
    return Session.equals("selected_review", this._id);
	/*
    var review = Reviews.findOne(Session.get("selected_review"));
	console.log(review && review.name);
	return review && review.name;
	*/
  };

  Template.reviewformat.check_weight_plus = function(){
		return (this.weight > 3);
	}
  Template.reviewformat.check_good = function(){
		return (this.isPositive > 0);
  } 

  Template.reviews.events({
	'click': function() {
		Session.set("selected_review", this._id);
	},
	'click input.append' : function(event){
		var tempForm = submitAnother();
		formBuffer.push(tempForm);
		if(formBuffer.length === 4){
			submitDone(this);
			formBuffer.length = 0;
		}
		event.preventDefault();
    },
	'submit' : function(event){
		var tempForm = submitAnother();
		formBuffer.push(tempForm);
		var dude = this;
		submitDone(this);
		formBuffer.length = 0;
		event.preventDefault();
	}});

}
//return a list of strings from the haystack that have needle as a substring
function substrings(needle,haystack)
{
	var ret = [];
	for(var i in haystack){
		if(haystack[i].catname.toLowerCase().indexOf(needle.toLowerCase()) != -1){
			ret.push(haystack[i].catname);
		}
	}
	console.log(ret);
	return ret;
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
      var products = ["CaptainCrunch","YuppieCereal"];
	  var images = ["captaincrunch.gif","yuppiecereal.jpg"];
      for(var i =0; i < products.length; i+=1){
        Reviews.insert( {name: products[i], imgPath: images[i], cats: [{weight: 0, catname: "tastyness", isPositive: 1, numRatings : 1, numPos: 1}]} );
      } 
    }
  });
}
function submitAnother(){
	form = {};
	$.each($('#rateForm').serializeArray(), function(){
		form[this.name] = this.value;
	});
	form['numRatings'] = 1;
	form['isPositive'] = Number(form['isPositive']);
	form['weight'] = Number(form['weight']);
	form['numPos'] = form['isPositive']; 
//	console.log(form);
	return form;
}

