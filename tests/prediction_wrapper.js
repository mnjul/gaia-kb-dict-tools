/*
 * This file is copied from latin ime worker to test how predictions.js works
 * if we have uniformly-0 frequency.
 * Script is modified to work with Node.js, for sure.
 */

'use strict';

var Predictions = require('../js/predictions.js').Predictions;
var List2Dict = require('../js/list2dict.js');
var Utils = require('./utils.js').Utils;
var fs = require('fs');
var repl = require('repl');

fs.readFile('cases/' + process.argv[2], 'utf8', function(err, data){
  if (err) throw err;

  var words = data.split('\n');
  words = words.filter(function(word){ return word.length > 0;});

  startRepl(Utils.toArrayBuffer((new List2Dict.TSTConverter(words)).toBlob()));
});

function log(msg) {
  console.log(msg);
}

function startRepl(uint8ArrayBlob){
  console.log("Setting dictionary...");
  Predictions.setDictionary(uint8ArrayBlob);

  console.log("Setting nearbyKeys...");
  Predictions.setNearbyKeys(Utils.enNearByKeys);

  console.log("Done. Starting REPL");

  repl.start({
    prompt: "prefix> ",
    eval: function(cmd, context, filename, callback) {
      cmd = cmd.trim();
      cmd = cmd.replace('(', '');
      cmd = cmd.replace(')', '');
      cmd = cmd.trim();

      var success = function(words) {
        callback(undefined, words);
      };

      var error = function(msg) {
        throw msg;
      };

      Predictions.predict(cmd, 4, 24, 1, success, error);
    }
  }).on('exit', function(){
    process.exit();
  });
};
