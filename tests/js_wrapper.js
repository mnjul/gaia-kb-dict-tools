var List2Dict = require('../js/list2dict.js');
var fs = require('fs');

var caseName = process.argv[2];

fs.readFile('cases/' + caseName, 'utf8', function(err, data){
	if (err) throw err;

	var words = data.split('\n');

	var uint8ArrayBlob = List2Dict.wordsToUint8ArrayBlob(words);

	fs.exists('outputs', function(exists){
		if(!exists){
			fs.mkdirSync('outputs');
		}
		fs.writeFile('outputs/' + caseName + '.js.out', uint8ArrayBlob, function(err){
			if(err) throw err;
		});
	});
});



