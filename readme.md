# Pokemon Teambuilder

Available online: https://pokemon-team-creator-hymmxkuqlg.now.sh/

To make this work locally, add a MongoDB url to a `.env` file in the form: MONGODB="`your url here`"
Then, run `npm install` in the root directory.

### 1. Data Format and Storage

#### Pokemon

Fields:

- `Field 1`: name		`Type: String`
- `Field 2`: item		`Type: String`
- `Field 3`: ability	`Type: String`
- `Field 4`: nature		`Type: String`
- `Field 5`: moves		`Type: [String]`
- `Field 6`: IVs		`Type: [Number]`
- `Field 7`: EVs		`Type: [Number]`

Schema:

```
{	
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
}
```

#### Team

Fields:

- `Field 1`: name		`Type: String`
- `Field 2`: upvotes	`Type: Number`
- `Field 3`: pokemon	`Type: [Pokemon]`

Schema:

```
{
	name: {
        type: String
    },
	upvotes: {
        type: Number
    },
	pokemon: {
        type: [pokemonSchema]
    }
}
```

### 2. Add New Data

Pokemon can be created via either the HTML form at `/create` or by making a POST request to `/create`.

Example Node.js POST request to endpoint:

```
var options = { 
	method: 'POST',
	url: 'http://localhost:3000/create',
	headers: { 
		'content-type': 'application/x-www-form-urlencoded' 
	},
	form: { 
		team:{ 
		    teamName: 'AIPOM',
			pokemon1:{ 
				name: 'Aipom',
				item: 'Eviolite',
				ability: 'Skill Link',
				nature: 'Adamant',
				moves: [ 'Double Slap', 'Power-Up Punch', 'Baton Pass', 'Aerial Ace' ],
				IVs: [ '31', '31', '31', '31', '31', '31' ],
				EVs: [ '0', '252', '4', '0', '0', '252' ]
			},
			pokemon2:{ 
				name: 'Aipom',
				item: 'Eviolite',
				ability: 'Skill Link',
				nature: 'Adamant',
				moves: [ 'Double Slap', 'Power-Up Punch', 'Baton Pass', 'Aerial Ace' ],
				IVs: [ '31', '31', '31', '31', '31', '31' ],
				EVs: [ '0', '252', '4', '0', '0', '252' ]
			},
			pokemon3:{ 
				name: 'Aipom',
				item: 'Eviolite',
				ability: 'Skill Link',
				nature: 'Adamant',
				moves: [ 'Double Slap', 'Power-Up Punch', 'Baton Pass', 'Aerial Ace' ],
				IVs: [ '31', '31', '31', '31', '31', '31' ],
				EVs: [ '0', '252', '4', '0', '0', '252' ]
			},
			pokemon4:{ 
				name: 'Aipom',
				item: 'Eviolite',
				ability: 'Skill Link',
				nature: 'Adamant',
				moves: [ 'Double Slap', 'Power-Up Punch', 'Baton Pass', 'Aerial Ace' ],
				IVs: [ '31', '31', '31', '31', '31', '31' ],
				EVs: [ '0', '252', '4', '0', '0', '252' ]
			},
			pokemon5:{ 
				name: 'Aipom',
				item: 'Eviolite',
				ability: 'Skill Link',
				nature: 'Adamant',
				moves: [ 'Double Slap', 'Power-Up Punch', 'Baton Pass', 'Aerial Ace' ],
				IVs: [ '31', '31', '31', '31', '31', '31' ],
				EVs: [ '0', '252', '4', '0', '0', '252' ]
			},
			pokemon6:{ 
				name: 'Aipom',
				item: 'Eviolite',
				ability: 'Skill Link',
				nature: 'Adamant',
				moves: [ 'Double Slap', 'Power-Up Punch', 'Baton Pass', 'Aerial Ace' ],
				IVs: [ '31', '31', '31', '31', '31', '31' ],
				EVs: [ '0', '252', '4', '0', '0', '252' ]
			}
		}
	} 
};

request(options, function (error, response, body) {
  if (error) throw new Error(error);

  console.log(body);
});
```

Note that making requests via a POST request does not perform the same level of validation as submitting through the HTML form.
Take care to ensure all Pokemon are valid before submitting via POST!
Additionally, while the fields 'pokemon1' through 'pokemon6' are required, if you wish to have fewer than 6 Pokemon on a team, simply leave the name field blank in the leftover positions.

### 3. View Data

GET endpoint route: `/getTeams`

### 4. Search Data

Search Field: (Team) name

### 5. Navigation Pages

Navigation Filters:
1. Most Popular (sort by upvotes) -> `/popular`
2. Monotype Teams (teams where all pokemon have a type in common) -> `/monotype`
3. Fast Teams (teams with average base speed of 100 or higher) -> `/speedy`
4. Teams Without Evolutions (teams where no pokemon have evolved) -> `/noevos`
5. Random Team -> `/random`

### 6. To Do...

- Fix issue where not all moves are available to Pokemon that can learn them (e.g. Salamence cannot currently learn Outrage)
- Fix issue where looking up certain Pokemon fails (Farfetch'd and Kommo-o, among others)
- Look up type coverage of teams and list potential counters
- Allow multiple forms of Pokemon (e.g. Deoxys, Wormadam, Oricorio, etc.)
- Display base stats for each Pokemon and calculate stats from base stats, EVs, and IVs
- Fix issue where multiples of the same move can be selected for one Pokemon
- Have more robust validation for teams submitted via POST request