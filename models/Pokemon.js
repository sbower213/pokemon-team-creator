var mongoose = require('mongoose');

var pokemonSchema = new mongoose.Schema({
    name: {
        type: String
    },
    item: {
        type: String
    },
	ability: {
        type: String
    },
	nature: {
        type: String
    },
	moves: {
        type: [String]
    },
	IVs: {
        type: [Number]
    },
	EVs: {
        type: [Number]
    }
});

var teamSchema = new mongoose.Schema({
	name: {
        type: String
    },
	upvotes: {
        type: Number
    },
	pokemon: {
        type: [pokemonSchema]
    },
});

var Pokemon = mongoose.model('Pokemon', pokemonSchema);
var Team = mongoose.model('Team', teamSchema);

module.exports = {
	Pokemon: Pokemon,
	Team: Team
};
