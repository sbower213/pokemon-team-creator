var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var exphbs = require('express-handlebars');
var fs = require('fs');
var _ = require("underscore");
var mongoose = require('mongoose');
var app = express();
var request = require('request');
var oakdexPokedex = require('oakdex-pokedex');

var dotenv = require('dotenv');
dotenv.load();

var PORT = 3000;

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');
app.use('/public', express.static('public'));
app.use('/sprites', express.static('sprites'));
app.use('/data', express.static('data'));

var http = require('http').Server(app);
var io = require('socket.io')(http);

var models = require('./models/Pokemon');

var items = require('./data/item.json');
var natures = require('./data/natures.json');
var pokemonList = require('./data/pokemonList.json');

mongoose.connect(process.env.MONGODB);
mongoose.connection.on('error', function() {
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);
});

//future work: get from pokemon json instead of oakdex
//use _.keys() and _.values() as fit

io.on('connection', function(socket) {
	
	//socket has an id in it, you can map id's to names
	
	console.log('new connection');
	socket.on('disconnect', function() {
		console.log('someone left');
	});
	
	socket.on('save', function(pokemon){
		
		io.emit('save', pokemon);
	});
});

//trying to do this iteratively was a nightmare
var getPokemonIDs = function(res, teams, teamIndex, pokemonIndex){
	if(teamIndex < teams.length){
		if(pokemonIndex < 6){
			//if name is null, set id to 0 and move on
			if(teams[teamIndex]['pokemon'][pokemonIndex].name == null){
				teams[teamIndex]['pokemon'][pokemonIndex].national_id = 0;
				getPokemonIDs(res, teams, teamIndex, pokemonIndex+1);
			} else {
				oakdexPokedex.findPokemon(teams[teamIndex]['pokemon'][pokemonIndex].name, function(p){
					if(p != null){
						teams[teamIndex]['pokemon'][pokemonIndex].national_id = p.national_id;
						teams[teamIndex]['pokemon'][pokemonIndex].base_stats = p.base_stats;
						getPokemonIDs(res, teams, teamIndex, pokemonIndex+1);
					} else {
						teams[teamIndex]['pokemon'][pokemonIndex].national_id = 0;
						teams[teamIndex]['pokemon'][pokemonIndex].base_stats = {'hp':0,'atk':0,'def':0,'sp_atk':0,'sp_def':0,'speed':0};
						getPokemonIDs(res, teams, teamIndex, pokemonIndex+1);
					}
				});
			}
		} else {
			getPokemonIDs(res, teams, teamIndex+1, 0);
		}			
	} else {
		//reversing gives us newest teams first
		res.render('teams', {
			teams:teams.reverse()
		});
	}				
};

app.get('/', function(req, res){
	
	models.Team.find({}, function(err, teams){
		if(err) throw err;
		
		getPokemonIDs(res, teams, 0,0);
		
	});
});

app.get('/getTeams', function(req, res){
	
	models.Team.find({}, function(err, teams){
		if(err) throw err;
		
		res.json(teams);
		
	});
});

app.post('/vote', function(req,res){
	var id = req.body.id;
	var change = req.body.change;
	
	models.Team.findByIdAndUpdate({_id:id}, {$inc:{upvotes: change}}, {new:true}, function(err, team){
		if(err) throw err;
		res.send({
			'upvotes':team.upvotes
		});
	});
});

app.get('/create', function(req, res){
	var numbers = [1,2,3,4,5,6];
	
	//future work: can parse itemsObject and get rid of isNonstandard items
	
	res.render('create', {
		numbers:numbers,
		items:items,
		natures:natures,
		pokemonList:pokemonList
	});
	
});

app.post('/create', function(req, res){
	
	var teamData = req.body.team;
	
	var pokemonArr = [];
	var keys = ['pokemon1','pokemon2','pokemon3','pokemon4','pokemon5','pokemon6'];
	for(var p in keys){
		var currPokemon = teamData[keys[p]];
		if(currPokemon.name != null){
			pokemonArr.push(new models.Pokemon({
				name:currPokemon.name,
				item:currPokemon.item,
				ability:currPokemon.ability,
				nature:currPokemon.nature,
				moves:currPokemon.moves,
				IVs:currPokemon.IVs,
				EVs:currPokemon.EVs
			}));
		}
	}
	
	var team = new models.Team({
		name: teamData.teamName,
		pokemon: pokemonArr,
		upvotes: 0
	});
	
	console.log(team);
	
	team.save(function(err) {
		if(err) throw err;
		io.emit('new team created', team);
		
		return res.send('/success');
	});
	
	
});

app.get('/success', function(req,res){
	res.render('success');
});

//for intermittent saving, whenever 1 pokemon is updated
app.post('/save', function(req,res){
	
	var team = req.body.team;
	
	console.log(team);
	
	return res.send('done!');
	
});

app.get('/pokemonByName/:name', function(req,res){
	
	var name = req.params.name;
	
	name = name.toLowerCase().replace (/\b./g, function (s) {return s.toUpperCase()})
	
	oakdexPokedex.findPokemon(name, function(pokedata){
		
		if(pokedata == null){
			pokedata = {};
		}
		res.send(pokedata);
		
	});
	
});

app.get('/popular', function(req,res){
	models.Team.find({}, function(err, teams){
		var sorted = _.sortBy(teams, function(t){
			return t.upvotes;
		});
		
		getPokemonIDs(res, sorted, 0,0);
	});
});

app.get('/monotype', function(req,res){
	models.Team.find({}, function(err, teams){
		
		var getMonotypeTeams = function(teamIndex, pokemonIndex, numPokemon, teamTypes, monotypes){
			if(teamIndex < teams.length){
				if(pokemonIndex < 6){
					//if name is null, set id to 0 and move on
					if(teams[teamIndex]['pokemon'][pokemonIndex].name == null){
						getMonotypeTeams(teamIndex, pokemonIndex+1, numPokemon, teamTypes, monotypes);
					} else {
						oakdexPokedex.findPokemon(teams[teamIndex]['pokemon'][pokemonIndex].name, function(p){
							if(p != null){
								for(var i=0; i<p.types.length; i++){
									teamTypes.push(p.types[i]);
								}
								getMonotypeTeams(teamIndex, pokemonIndex+1, numPokemon+1, teamTypes, monotypes);
							} else {
								getMonotypeTeams(teamIndex, pokemonIndex+1, numPokemon, teamTypes, monotypes);
							}
						});
					}
				} else {
					
					var occurrences = _.countBy(teamTypes);
					
					occurrences = _.sortBy(occurrences, function(obj){
						return -obj;
					});
					
					console.log(occurrences);
					
					if(occurrences[0] == numPokemon)
						monotypes.push(teams[teamIndex]);
					
					getMonotypeTeams(teamIndex+1, 0, 0, [],monotypes);
				}			
			} else {
				console.log(monotypes);
				getPokemonIDs(res, monotypes, 0, 0);
			}				
		};
		
		getMonotypeTeams(0,0,0,[],[]);
	});
});

app.get('/speedy', function(req,res){
	models.Team.find({}, function(err, teams){
		
		var getSpeedyTeams = function(teamIndex, pokemonIndex, numPokemon, speedStats, speedyTeams){
			if(teamIndex < teams.length){
				if(pokemonIndex < 6){
					//if name is null, set id to 0 and move on
					if(teams[teamIndex]['pokemon'][pokemonIndex].name == null){
						getSpeedyTeams(teamIndex, pokemonIndex+1, numPokemon, speedStats, speedyTeams);
					} else {
						oakdexPokedex.findPokemon(teams[teamIndex]['pokemon'][pokemonIndex].name, function(p){
							if(p != null){
								speedStats.push(p.base_stats['speed']);
								getSpeedyTeams(teamIndex, pokemonIndex+1, numPokemon+1, speedStats, speedyTeams);
							} else {
								getSpeedyTeams(teamIndex, pokemonIndex+1, numPokemon, speedStats, speedyTeams);
							}
						});
					}
				} else {
					
					function add(a,b){
						return a+b;
					}
					
					var avgSpeed = speedStats.reduce(add, 0) / numPokemon;
					
					
					if(avgSpeed >= 100)
						speedyTeams.push(teams[teamIndex]);
					
					getSpeedyTeams(teamIndex+1, 0, 0, [],speedyTeams);
				}			
			} else {
				console.log(speedyTeams);
				getPokemonIDs(res, speedyTeams, 0, 0);
			}				
		};
		
		getSpeedyTeams(0,0,0,[],[]);
	});
		
});

app.get('/random', function(req,res){
	models.Team.aggregate({$sample: {size:1}}, function(err,team){
		getPokemonIDs(res, team, 0, 0);
	});
});

app.get('/noevos', function(req,res){
	models.Team.find({}, function(err, teams){
		
		var getNoEvoTeams = function(teamIndex, pokemonIndex, numPokemon, numBasic, noEvoTeams){
			if(teamIndex < teams.length){
				if(pokemonIndex < 6){
					//if name is null, set id to 0 and move on
					if(teams[teamIndex]['pokemon'][pokemonIndex].name == null){
						getNoEvoTeams(teamIndex, pokemonIndex+1, numPokemon, numBasic, noEvoTeams);
					} else {
						oakdexPokedex.findPokemon(teams[teamIndex]['pokemon'][pokemonIndex].name, function(p){
							if(p != null){
								//if there is an evolved pokemon, skip the rest of the team
								if(p.evolution_from != null)
									getNoEvoTeams(teamIndex+1, 0, 0, 0, noEvoTeams);
								else
									getNoEvoTeams(teamIndex, pokemonIndex+1, numPokemon+1, numBasic+1, noEvoTeams);

							} else {
								getNoEvoTeams(teamIndex, pokemonIndex+1, numPokemon, numBasic, noEvoTeams);
							}
						});
					}
				} else {
					
					//this is superficial, i'm pretty sure if it hits here
					//then the condition is always true
					if(numBasic == numPokemon)
						noEvoTeams.push(teams[teamIndex]);
					
					getNoEvoTeams(teamIndex+1, 0, 0, 0,noEvoTeams);
				}			
			} else {
				console.log(noEvoTeams);
				getPokemonIDs(res, noEvoTeams, 0, 0);
			}				
		};
		
		getNoEvoTeams(0,0,0,[],[]);
	});
});

http.listen(PORT, function() {
    console.log("Pokemon team creator running on port " + PORT);
});

