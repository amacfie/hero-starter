/* eslint no-unused-vars: 0 */
/*

Strategies for the hero are contained within the "moves" object as
name-value pairs, like so:

    //...
    ambusher : function(gamedData, helpers){
      // implementation of strategy.
    },
    heWhoLivesToFightAnotherDay: function(gamedData, helpers){
      // implementation of strategy.
    },
    //...other strategy definitions.

The "moves" object only contains the data, but in order for a specific
strategy to be implemented we MUST set the "move" variable to a
definite property.  This is done like so:

move = moves.heWhoLivesToFightAnotherDay;

You MUST also export the move function, in order for your code to run
So, at the bottom of this code, keep the line that says:

module.exports = move;

The "move" function must return "North", "South", "East", "West", or "Stay"
(Anything else will be interpreted by the game as "Stay")

The "move" function should accept two arguments that the website will be passing in:
- a "gameData" object which holds all information about the current state
  of the battle
- a "helpers" object, which contains useful helper functions
- check out the helpers.js file to see what is available to you

*/

// Some utility functions

var util = {};

// Simplified version of http://underscorejs.org/#min
util.min = function (list, iteratee) {
  var minEl = null,
    minVal = Number.POSITIVE_INFINITY;
  for (var i=0; i < list.length; ++i) {
    var el = list[i],
      val = iteratee(el);
    if (val < minVal) {
      minVal = val;
      minEl = el;
    }
  }
  return minEl;
};

// Built-in strategy definitions
var moves = {
  // Aggressor
  aggressor: function (gameData, helpers) {
    // Here, we ask if your hero's health is below 30
    if (gameData.activeHero.health <= 30){
      // If it is, head towards the nearest health well
      return helpers.findNearestHealthWell(gameData);
    } else {
      // Otherwise, go attack someone...anyone.
      return helpers.findNearestEnemy(gameData);
    }
  },

  // Health Nut
  healthNut: function (gameData, helpers) {
    // Here, we ask if your hero's health is below 75
    if (gameData.activeHero.health <= 75){
      // If it is, head towards the nearest health well
      return helpers.findNearestHealthWell(gameData);
    } else {
      // Otherwise, go mine some diamonds!!!
      return helpers.findNearestNonTeamDiamondMine(gameData);
    }
  },

  // Balanced
  balanced: function (gameData, helpers){
    // Here we determine if it's an even or odd turn for your hero;
    if ((gameData.turn / 2) % 2) {
      // If it is even, act like an an Aggressor
      return moves.aggressor(gameData, helpers);
    } else {
      // If it is odd, act like a Priest
      return moves.priest(gameData, helpers);
    }
  },

  // The "Northerner"
  // This hero will walk North.  Always.
  northener: function (gameData, helpers) {
    return 'North';
  },

  // The "Blind Man"
  // This hero will walk in a random direction each turn.
  blindMan: function (gameData, helpers) {
    var choices = ['North', 'South', 'East', 'West'];
    return choices[Math.floor(Math.random()*4)];
  },

  // The "Priest"
  // This hero will heal nearby friendly champions.
  priest: function (gameData, helpers) {
    var myHero = gameData.activeHero;
    if (myHero.health < 60) {
      return helpers.findNearestHealthWell(gameData);
    } else {
      return helpers.findNearestTeamMember(gameData);
    }
  },

  // The "Unwise Assassin"
  // This hero will attempt to kill the closest enemy hero. No matter what.
  unwiseAssassin: function (gameData, helpers) {
    var myHero = gameData.activeHero;
    if (myHero.health < 30) {
      return helpers.findNearestHealthWell(gameData);
    } else {
      return helpers.findNearestEnemy(gameData);
    }
  },

  // The "Careful Assassin"
  // This hero will attempt to kill the closest weaker enemy hero.
  carefulAssassin: function (gameData, helpers) {
    var myHero = gameData.activeHero;
    if (myHero.health < 50) {
      return helpers.findNearestHealthWell(gameData);
    } else {
      return helpers.findNearestWeakerEnemy(gameData);
    }
  },

  // The "Safe Diamond Miner"
  // This hero will attempt to capture enemy diamond mines.
  safeDiamondMiner: function (gameData, helpers) {
    var myHero = gameData.activeHero;

    // Get stats on the nearest health well
    var healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, myHero, function (boardTile) {
      if (boardTile.type === 'HealthWell') {
        return true;
      }
    });
    var distanceToHealthWell = healthWellStats.distance;
    var directionToHealthWell = healthWellStats.direction;

    if (myHero.health < 40) {
      // Heal no matter what if low health
      return directionToHealthWell;
    } else if (myHero.health < 100 && distanceToHealthWell === 1) {
      // Heal if you aren't full health and are close to a health well already
      return directionToHealthWell;
    } else {
      // If healthy, go capture a diamond mine!
      return helpers.findNearestNonTeamDiamondMine(gameData);
    }
  },

  // The "Selfish Diamond Miner"
  // This hero will attempt to capture diamond mines (even those owned by teammates).
  selfishDiamondMiner: function (gameData, helpers) {
    var myHero = gameData.activeHero;

    // Get stats on the nearest health well
    var healthWellStats = helpers.findNearestObjectDirectionAndDistance(gameData.board, myHero, function (boardTile) {
      if (boardTile.type === 'HealthWell') {
        return true;
      }
    });

    var distanceToHealthWell = healthWellStats.distance;
    var directionToHealthWell = healthWellStats.direction;

    if (myHero.health < 40) {
      // Heal no matter what if low health
      return directionToHealthWell;
    } else if (myHero.health < 100 && distanceToHealthWell === 1) {
      // Heal if you aren't full health and are close to a health well already
      return directionToHealthWell;
    } else {
      // If healthy, go capture a diamond mine!
      return helpers.findNearestUnownedDiamondMine(gameData);
    }
  },

  // The "Coward"
  // This hero will try really hard not to die.
  coward: function (gameData, helpers) {
    return helpers.findNearestHealthWell(gameData);
  },

  custom: {}
};

// Custom strategy definitions

// "Balanced" strategy:
// Follow a set of somewhat reasonable rules:

// if there are adjacent enemies
//   if there's an adjacent well, I can't kill an adjacent enemy this turn, and
//   health <= minHealth
//     go to the well
//   else
//     attack the weakest adjacent enemy
// if health <= minHealth
//   go to closest well with minimal nearby enemies
// if there's an adjacent ally with health <= minHealth
//   heal the weakest such ally
// if there's a vulnerable enemy 2 steps away
//   go to the weakest such enemy
// if there's a non-team mine to go to
//   go to the closest non-team mine with minimal nearby enemies
// else
//   go to the closest well with minimal nearby enemies

moves.custom.balanced = function (gameData, helpers) {
  // "m-distance" is Manhattan distance
  // "p-distance" is shortest path distance

  // health threshold for running to a well or an adjacent ally to be healed
  const minHealth = 70,
  // m-distance for counting "nearby" enemies
    maxNearbyDist = 2;

  var hero = gameData.activeHero,
      board = gameData.board;
  var dft = hero.distanceFromTop;
  var dfl = hero.distanceFromLeft;

  var adjEnemiesA = helpers.tilesOnManhattanCircle(board, hero, 1).filter(
    function (t) {
      return helpers.enemyB(gameData, t);
    }
  );
  var adjWellsA = helpers.tilesOnManhattanCircle(board, hero, 1).filter(
    function (t) {
      return helpers.wellB(gameData, t);
    }
  );
  var adjAlliesA = helpers.tilesOnManhattanCircle(board, hero, 1).filter(
    function (t) {
      return helpers.allyB(gameData, t);
    }
  );

  if (adjEnemiesA.length > 0) {
    var weakestAdjEnemy = util.min(adjEnemiesA, function (t) {
      return t.health;
    });
    if (adjWellsA.length > 0 && weakestAdjEnemy.health > 30 &&
        hero.health <= minHealth) {
      console.log('Going to an adjacent well.');
      return helpers.findNearestHealthWell(gameData);
    } else {
      console.log('Attack!');
      return helpers.findTile(gameData, weakestAdjEnemy);
    }
  }

  var minEnemiesWellDir = helpers.findNearestTileWithMinEnemies(
    gameData,
    maxNearbyDist,
    function (t) {
      return helpers.wellB(gameData, t);
    }
  );

  if (hero.health <= minHealth) {
    console.log('I need health! Finding a well...');
    return minEnemiesWellDir;
  }

  if (adjAlliesA.length > 0) {
    var weakestAdjAlly = util.min(adjAlliesA, function (t) {
      return t.health;
    });
    if (weakestAdjAlly.health <= minHealth) {
      console.log('Be healed!');
      return helpers.findTile(gameData, weakestAdjAlly);
    }
  }

  var pDist2Enemies = helpers.tilesOnPathCircle(board, hero, 2).filter(
    function (t) {
      return helpers.vulnerableEnemyB(gameData, t);
    }
  );
  if (pDist2Enemies.length > 0) {
    var weakestpDist2Enemy = util.min(pDist2Enemies, function (t) {
      return t.health;
    });
    console.log('I\'m coming for you!');
    return helpers.findTile(gameData, weakestpDist2Enemy);
  }

  var minEnemiesNonTeamMineDir = helpers.findNearestTileWithMinEnemies(
    gameData,
    maxNearbyDist,
    function (t) {
      return helpers.nonTeamMineB(gameData, t);
    }
  );

  if (minEnemiesNonTeamMineDir ) {
    console.log('Going mining.');
    return minEnemiesNonTeamMineDir;
  } else {
    console.log('Yawn. I\'ll head to a well.');
    return minEnemiesWellDir;
  }

};

// "Extravert" strategy:
// * move to closest ally; if already close, attack any close enemies or heal
// * move randomly sometimes to avoid getting stuck
// TODO
moves.custom.extravert = null;

// "Optimal" strategy:
// formally classify this game and implement best known strategy, e.g. minimax
// TODO
moves.custom.optimal = null;


// Set our hero's strategy
var move =  moves.custom.balanced;

// Export the move function here
module.exports = move;

