var List2Dict = require('../js/list2dict.js');
var fs = require('fs');

var caseName = process.argv[2];

fs.readFile('cases/' + caseName, 'utf8', function(err, data){
	if (err) throw err;

	var words = data.split('\n');
	words = words.filter(function(word){ return word.length > 0;});

	var uint8ArrayBlob = (new List2Dict.WordListConverter(words)).toBlob();

	fs.exists('outputs', function(exists){
		if(!exists){
			fs.mkdirSync('outputs');
		}
		fs.writeFile('outputs/' + caseName + '.js.out', new Buffer(uint8ArrayBlob), 'binary', function(err){
			if(err) throw err;
		});
	});
});



