'use strict';

/* This script is just Python-to-JavaScript from xml2dict.py. */

var _NodeCounter = 0;
var _NodeRemoveCounter = 0;
var _NodeVisitCounter = 0;
var _EmitCounter = 0;
var _WordCounter = 0;

const _EndOfWord = String.fromCharCode(0);

// How many times do we use each character in this language
var characterFrequency = {};
var maxWordLength = 0
var highestFreq = 0;

const _DiacriticIndex = {
  'a': 'ÁáĂăǍǎÂâÄäȦȧẠạȀȁÀàẢảȂȃĀāĄąÅåḀḁȺⱥÃãǼǽǢǣÆæ',
  'b': 'ḂḃḄḅƁɓḆḇɃƀƂƃ',
  'c': 'ĆćČčÇçĈĉĊċƇƈȻȼ',
  'd': 'ĎďḐḑḒḓḊḋḌḍƊɗḎḏĐđƋƌð',
  'e': 'ÉéĔĕĚěȨȩÊêḘḙËëĖėẸẹȄȅÈèẺẻȆȇĒēĘę',
  'f': 'ḞḟƑƒ',
  'g': 'ǴǵĞğǦǧĢģĜĝĠġƓɠḠḡǤǥ',
  'h': 'ḪḫȞȟḨḩĤĥⱧⱨḦḧḢḣḤḥĦħ',
  'i': 'ÍíĬĭǏǐÎîÏïỊịȈȉÌìỈỉȊȋĪīĮįƗɨĨĩḬḭı',
  'j': 'ĴĵɈɉ',
  'k': 'ḰḱǨǩĶķⱩⱪꝂꝃḲḳƘƙḴḵꝀꝁ',
  'l': 'ĹĺȽƚĽľĻļḼḽḶḷⱠⱡꝈꝉḺḻĿŀⱢɫŁł',
  'm': 'ḾḿṀṁṂṃⱮɱ',
  'n': 'ŃńŇňŅņṊṋṄṅṆṇǸǹƝɲṈṉȠƞÑñ',
  'o': 'ÓóŎŏǑǒÔôÖöȮȯỌọŐőȌȍÒòỎỏƠơȎȏꝊꝋꝌꝍŌōǪǫØøÕõŒœ',
  'p': 'ṔṕṖṗꝒꝓƤƥⱣᵽꝐꝑ',
  'q': 'Ꝗꝗ',
  'r': 'ŔŕŘřŖŗṘṙṚṛȐȑȒȓṞṟɌɍⱤɽ',
  's': 'ŚśŠšŞşŜŝȘșṠṡṢṣß$',
  't': 'ŤťŢţṰṱȚțȾⱦṪṫṬṭƬƭṮṯƮʈŦŧ',
  'u': 'ÚúŬŭǓǔÛûṶṷÜüṲṳỤụŰűȔȕÙùỦủƯưȖȗŪūŲųŮůŨũṴṵ',
  'v': 'ṾṿƲʋṼṽ',
  'w': 'ẂẃŴŵẄẅẆẇẈẉẀẁⱲⱳ',
  'x': 'ẌẍẊẋ',
  'y': 'ÝýŶŷŸÿẎẏỴỵỲỳƳƴỶỷỾỿȲȳɎɏỸỹ',
  'z': 'ŹźŽžẐẑⱫⱬŻżẒẓȤȥẔẕƵƶ'
};

var _Diacritics = {} // the mapping from accented to non-accented letters

// Build the _Diacritics mapping
for (var letter in _DiacriticIndex) {
  for (var i = 0; i < _DiacriticIndex[letter].length; i++ )
  {
    var diacritic = _DiacriticIndex[letter][i];
    _Diacritics[diacritic] = letter;
  }
}

// Data Structure for TST Tree

// Constructor for creating a new TSTNode
var TSTNode = function(ch) {
  _NodeCounter++;

  this.ch = ch;
  this.left = this.center = this.right = null;
  this.frequency = 0; // maximum frequency
  // store the count for balancing the tst
  this.count = 0;
};

// Constructor for creating a TST Tree
var TSTTree = function(ch) {
  this.table = {};
};

// Insert a word into the TSTTree
TSTTree.prototype.insert = function(node, word, freq) {
  var ch = word[0];

  if (!node) {
    node = new TSTNode(ch);
  }

  if (ch < node.ch) {
    node.left = this.insert(node.left, word, freq);
  } else if(ch > node.ch) {
    node.right = this.insert(node.right, word, freq);
  } else {
    node.frequency = Math.max(node.frequency, freq)
    if (word.length > 1) }{
      node.center = this.insert(node.center, word.substring(1), freq);
    }
  }

  return node;
};

// Balance the TST
// set the number of children nodes
TSTTree.prototype.setCount = function(node) {
  if (!node) {
      return 0;
  }

  node.count = this.setCount(node.left) + this.setCount(node.right) + 1;

  this.setCount(node.center);

  return node.count;
};

TSTTree.prototype.rotateRight = function(node) {
  var tmp = node.left;

  // move the subtree between tmp and node
  node.left = tmp.right;

  // swap tmp and node
  tmp.right = node;

  // restore count field
  node.count = (node.left ? node.left.count : 0) + (node.right ? node.right.count : 0) + 1;
  tmp.count = (tmp.left ? tmp.left.count : 0) + tmp.right.count + 1;

  return tmp;
};

TSTTree.prototype.rotateLeft = function(node) {
  var tmp = node.right;

  // move the subtree between tmp and node
  node.right = tmp.left;

  // swap tmp and node
  tmp.left = node;

  // restore count field
  node.count = (node.left ? node.left.count : 0) + (node.right ? node.right.count : 0) + 1;
  tmp.count = tmp.left.count + (tmp.right ? tmp.right.count : 0) + 1;

  return tmp;
};

TSTTree.prototype.divide = function(node, divCount) {
  var leftCount = node.left ? node.left.count : 0;

  // if the dividing node is in the left subtree, go down to it
  if (divCount < leftCount) {
    node.left = this.divide(node.left, divCount);
    // on the way back from the dividing node to the root, do right rotations
    node = this.rotateRight(node);
  } else if (divCount > leftCount) {
    node.right = this.divide(node.right, divCount - leftCount - 1);
    node = this.rotateLeft(node);
  }

  return node;
};

// balance level of TST
TSTTree.prototype.balanceLevel = function(node) {
  if (!node) {
    return node;
  }

  // make center node the root
  node = this.divide(node, Math.floor(node.count / 2));
  // balance subtrees recursively
  node.left = this.balanceLevel(node.left);
  node.right = this.balanceLevel(node.right);

  node.center = this.balanceTree(node.center);

  return node;
};

// balance level of TST
TSTTree.prototype.normalizeChar = function(ch) {
  ch = ch.toLowerCase();

  if (ch in _Diacritics) {
    ch = _Diacritics[ch];
  }

  return ch;
};

TSTTree.prototype.collectLevel = function(level, node) {
  if (!node) {
    return;
  }

  level.push(node);
  this.collectLevel(level, node.left);
  this.collectLevel(level, node.right);
};

TSTTree.prototype.sortLevelByFreq = function(node) {
  // Collect nodes on the same level
  var nodes = [];
  this.collectLevel(nodes, node);

  // Sort by frequency joining nodes with lowercase/uppercase/accented versions of the same character

  nodes.sort((node1, node2) => node1.ch - node2.ch);
  nodes.sort((node1, node2) => node2.frequency - node1.frequency);

  // Add next/prev pointers to each node
  var prev = null;
  for (var i = 0; i < nodes.length; i++) {
    nodes[i].next = (i < nodes.length - 1) ? nodes[i + 1] : null;
    nodes[i].prev = prev;
    prev = nodes[i]
  }

  return nodes[0];
};

// find node in the subtree of root and promote it to root
TSTTree.prototype.promoteNodeToRoot = function(root, node) {
  if (node.ch < root.ch) {
    root.left = this.promoteNodeToRoot(root.left, node);
    return this.rotateRight(root);
  } else if (node.ch > root.ch) {
    root.right = this.promoteNodeToRoot(root.right, node);
    return this.rotateLeft(root);
  } else {
    return root;
  }
};


// balance the whole TST
TSTTree.prototype.balanceTree = function(this, node) {
  if (!node) {
    return;
  }

  // promote to root the letter with the highest maximum frequency
  // of a suffix starting with this letter
  node = this.promoteNodeToRoot(node, this.sortLevelByFreq(node));

  // balance other letters on this level of the tree
  node.left = this.balanceLevel(node.left);
  node.right = this.balanceLevel(node.right);
  node.center = this.balanceTree(node.center);

  return node;
};

// balance the whole TST
TSTTree.prototype.balance = function(this, root) {
  this.setCount(root);

  root = this.balanceTree(root);

  return root;
};

// Serialize the tree to an array. Do it depth first, folling the
// center pointer first because that might give us better locality
function serializeNode(node, output){
  output.push(node);
  node.offset = output.length;

  _EmitCounter += 1;
  if (_EmitCounter % 100000 === 0) {
    console.log(" >>> (serializing " + _EmitCounter + "/" +
          _NodeCounter + ")");
  }

  if (node.ch == _EndOfWord and node.center) {
    console.log("nul node with a center!");
  }
  if (node.ch != _EndOfWord and not node.center) {
    console.log("char node with no center!");
  }

  // do the center node first so words are close together
  if (node.center) {
    serializeNode(node.center, output);
  }

  if (node.left) {
    serializeNode(node.left, output);
  }

  if (node.right) {
    serializeNode(node.right, output);
  }
}

function serializeTree(root) {
  var output = [];
  serializeNode(root, output);
  return output;
}

// Make a pass through the array of nodes and figure out the size and offset
// of each one.
function computeOffsets(nodes) {
  var offset = 0;

  for (var i = 0; i < nodex.length; i++) {
    var node = nodes[i];

    node.offset = offset;

    var charlen;
    if (node.ch == _EndOfWord) {
      charlen = 0;
    } else if (String.toCharCode(node.ch) <= 255) {
      charlen = 1;
    } else {
      charlen = 2;
    }

    var nextlen = node.next ? 3 : 0;

    offset = offset + 1 + charlen + nextlen;
  }

  return offset;
}

// In the JS version, since we're not directly writing to a file,
// "output" is a JS array. We convert to UInt8Array when we
// finishes pushing to "output". This is because UInt8Array's length
// has to be decided at instantiation.

function writeUint24(output, x) {
  output.push((x >> 16) & 0xFF);
  output.push((x >> 8) & 0xFF);
  output.push(x & 0xFF);
}

function emitNode(output, node) {
  var charcode = (node.ch == _EndOfWord) ? 0 : String.toCharCode(node.ch);

  var cbit = (0 !== charcode) ? 0x80 : 0;
  var sbit = (charcode > 255) ? 0x40 : 0;
  var nbit = node.next ? 0x20 : 0;

  if (0 === node.frequency) {
    freq = 0; // zero means profanity
  } else {
    freq = 1 + Math.floor(node.frequency * 31); // values > 0 map the range 1 to 31
  }

  var firstbyte = cbit | sbit | nbit | (freq & 0x1F);
  output.push(firstbyte);

  if (cbit) { // If there is a character for this node
    if (sbit) { // if it is two bytes long
      output.push(charcode >> 8);
    }
    output.push(charcode & 0xFF);
  }

  // Write the next node if we have one
  if (nbit) {
    writeUint24(output, node.next.offset);
  }
}

function emit(output, nodes) {
  var nodeslen = computeOffsets(nodes);

  // 12-byte header with version number
  output.push("F".toCharCode());
  output.push("x".toCharCode());
  output.push("O".toCharCode());
  output.push("S".toCharCode());
  output.push("D".toCharCode());
  output.push("I".toCharCode());
  output.push("C".toCharCode());
  output.push("T".toCharCode());
  output.push(0);
  output.push(0);
  output.push(0);
  output.push(1);

  // Output the length of the longest word in the dictionary.
  // This allows to easily reject input that is longer
  output.push(Math.min(maxWordLength, 255));

  // Output a table of letter frequencies. The search algorithm may
  // want to use this to decide which diacritics to try, for example.
  var characters = [for (ch of characterFrequency) {ch: ch, freq: characterFrequency[ch]}];
  characters.sort((chFreq1, chFreq2) => chFreq2.freq - chFreq1.freq);

  // JS conversion note on 16-bit and 32-bit writing:
  // The original Python code used big-endian conversion, so we
  // push MSB first down to LSB.

  output.push((characters.length >> 8) & 0xFF);
  output.push(characters.length & 0xFF);

  characters.forEach(chFreq => {
    var charCode = String.toCharCode(chFreq.ch);

    output.push((charCode >> 8) & 0xFF);
    output.push(charCode & 0xFF);

    var freq = chFreq.freq;
    output.push((freq >> 24) & 0xFF);
    output.push((freq >> 16) & 0xFF);
    output.push((freq >> 8) & 0xFF);
    output.push(freq & 0xFF);
  });

  // Write the nodes of the tree to the array.
  for (var i = 0; i < nodes.length; i++){
    var node = nodes[i];
    emitNode(output, node);
  }
}

// We'll eventually remove freq?
const WORD_LIST = [
  {
    w: 'hello',
    f: 0.3
  },
  {
    w: 'world',
    f: 0.3
  },
  {
    w: 'from',
    f: 0.3
  },
  {
    w: 'godzilla',
    f: 0.3
  }
];

console.log("[1/4] Reading list and creating TST ...");

var tstRoot = null;
var tree = new TSTTree();

WORD_LIST.forEach(wordFreq => {
  var word = wordFreq.w;
  var freq = wordFreq.f;

  maxWordLength = Math.max(maxWordLength, word.length);

  tree.insert(tstRoot, word + _EndOfWord, freq);

  for (var i = 0; i < word.length; i++) {
    var ch = word[i];
    if (ch in characterFrequency) {
      characterFrequency[ch]++;
    } else {
      characterFrequency[ch] = 1;
    }
  }

  _WordCounter++;
  if (0 === _WordCounter % 10000){
    console.log("          >>> (" + _WordCounter + " words read)");
  }
});

console.log("[2/4] Balancing Ternary Search Tree ...");
tstRoot = tree.balance(tstRoot);

console.log("[3/4] Serializing TST ...");
var nodes = serializeTree(tstRoot);

console.log("[4/4] Emitting TST ...");
var outputArray = [];
emit(outputArray, nodes);

outputUint8Array = new UInt8Array(outputArray);

// remember to keep outputUint8Array for future usage :)

for (var i = 0; i < outputUint8Array.length; i++) {
  console.log(outputUint8Array[i]);
}
