'use strict';

var List2Dict = require('../js/list2dict.js');
var Utils = require('./utils.js').Utils;
var fs = require('fs');

var en_words;
var de_words;
var chinese_words;

var doneCount = 0;

var done = function(){
  doneCount++;

  if (3 === doneCount) {
    test();
  };
};

var read = function(test, callback){
  fs.readFile('cases/' + test, 'utf8', function(err, data){
    if (err) throw err;

    var words = data.split('\n');
    words = words.filter(function(word){ return word.length > 0;});

    callback(words);
    done();
  });
};

function log(msg) {
  console.log(msg);
}

log('Reading source word lists...');

read('en_all', function(words){ en_words = words; });
read('de_all', function(words){ de_words = words; });
read('chinese', function(words){ chinese_words = words; });

var test = function() {
  log('Testing...')

  var en_converter = new List2Dict.WordListConverter(en_words);
  var de_converter = new List2Dict.WordListConverter(de_words);
  var chinese_converter = new List2Dict.WordListConverter(chinese_words);

  var singleTest = function(blob, first, done) {
    var success = function(words) {
      if (words[0][0] === first) {
        log('Passed');
      }else{
        log('Falled. Expected: ' + first + '; got: ' + words[0][0]);
      }
      done();
    };

    var error = function(msg) {
      throw msg;
    };

    delete require.cache[require.resolve('../js/predictions.js')];

    var Predictions = require('../js/predictions.js').Predictions;

    Predictions.setDictionary(blob);
    Predictions.setNearbyKeys(Utils.enNearByKeys);

    Predictions.predict('appl', 4, 24, 1, success, error);
  };

  // alright, this is ugly, but let's keep it as is for now

  log('English...');
  singleTest(en_converter.toBlob(), 'apple', function() {
    log('German...');
    singleTest(de_converter.toBlob(), 'Apple', function() {
      log('Chinese...');
      singleTest(chinese_converter.toBlob(), 'apple一二三', function() {
        log('English again...(should be fast on this)');
        singleTest(en_converter.toBlob(), 'apple', function() {
          process.exit();
        });
      });
    });
  });
};
