'use strict';

/* global module */

/*
 * This script is largely Python-to-JavaScript conversion from xml2dict.py.
 * Old comments are copied here, except those beginning with "JSConv", which
 * are comments during the conversion.
 */

const _EndOfWord = String.fromCharCode(0);

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

// the mapping from accented to non-accented letters
// JSConv: We build the mapping when TSTConverter is instantiated
// for the first time
var _Diacritics;

// Data Structure for TST Tree

// Constructor for creating a new TSTNode
var TSTNode = function(ch) {
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
    node.frequency = Math.max(node.frequency, freq);
    if (word.length > 1) {
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
  node.count = (node.left ? node.left.count : 0) +
                 (node.right ? node.right.count : 0) + 1;
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
  node.count = (node.left ? node.left.count : 0) +
                 (node.right ? node.right.count : 0) + 1;
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

  // Sort by frequency joining nodes with lowercase/uppercase/accented
  // versions of the same character

  // JSConv: Make total ordering to ease consistency check
  // with original Python script
  nodes.sort(function(node1, node2){
    if (node1.ch != node2.ch){
      return node1.ch.charCodeAt(0) - node2.ch.charCodeAt(0);
    }else{
      return node2.frequency - node1.frequency;
    }
  });
  nodes.sort(function(node1, node2){
    if (node1.frequency != node2.frequency){
      return node2.frequency - node1.frequency;
    }else{
      return node1.ch.charCodeAt(0) - node2.ch.charCodeAt(0);
    }
  });

  // Add next/prev pointers to each node
  var prev = null;
  nodes.forEach(function (node, index) {
    node.next = (index < nodes.length - 1) ? nodes[index + 1] : null;
    node.prev = prev;
    prev = node;
  });

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
TSTTree.prototype.balanceTree = function(node) {
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
TSTTree.prototype.balance = function(root) {
  this.setCount(root);

  root = this.balanceTree(root);

  return root;
};

var TSTConverter = function(words) {
  if (undefined === _Diacritics) {
    _Diacritics = {};
    // Build the _Diacritics mapping
    Object.keys(_DiacriticIndex).forEach(function(letter) {
      _DiacriticIndex[letter].split('').forEach(function(diacritic){
        _Diacritics[diacritic] = letter;
      });
    });
  }

  this.blob = undefined;
  this.words = words;

  // How many times do we use each character in this language
  this.characterFrequency = {};
  this.maxWordLength = 0;
};

TSTConverter.prototype._DEBUG = false;

TSTConverter.prototype.debug = function(msg) {
  if (this._DEBUG) {
    console.log(msg);
  }
};

// Serialize the tree to an array. Do it depth first, folling the
// center pointer first because that might give us better locality
TSTConverter.prototype.serializeNode = function(node, output) {
  output.push(node);
  node.offset = output.length;

  if (node.ch == _EndOfWord && node.center) {
    console.log('nul node with a center!');
  }
  if (node.ch != _EndOfWord && !node.center) {
    console.log('char node with no center!');
  }

  // do the center node first so words are close together
  if (node.center) {
    this.serializeNode(node.center, output);
  }

  if (node.left) {
    this.serializeNode(node.left, output);
  }

  if (node.right) {
    this.serializeNode(node.right, output);
  }
};

TSTConverter.prototype.serializeTree = function(root) {
  var output = [];
  this.serializeNode(root, output);
  return output;
};

// Make a pass through the array of nodes and figure out the size and offset
// of each one.
TSTConverter.prototype.computeOffsets = function(nodes) {
  var offset = 0;

  nodes.forEach(function(node) {
    node.offset = offset;

    var charlen;
    if (node.ch == _EndOfWord) {
      charlen = 0;
    } else if (node.ch.charCodeAt(0) <= 255) {
      charlen = 1;
    } else {
      charlen = 2;
    }

    var nextlen = node.next ? 3 : 0;

    offset = offset + 1 + charlen + nextlen;
  });

  return offset;
};

// JSConv:
// In the JS version, since we're not directly writing to a file,
// 'output' is a JS array. We convert to UInt8Array when we
// finishes pushing to 'output'. This is because UInt8Array's length
// has to be decided at instantiation.
// XXX: See if we can pre-determine the length when instantiating
//      the buffer.

TSTConverter.prototype.writeUint24 = function(output, x) {
  output.push((x >> 16) & 0xFF);
  output.push((x >> 8) & 0xFF);
  output.push(x & 0xFF);
};

TSTConverter.prototype.emitNode = function(output, node) {
  var charcode = (node.ch == _EndOfWord) ? 0 : node.ch.charCodeAt(0);

  var cbit = (0 !== charcode) ? 0x80 : 0;
  var sbit = (charcode > 255) ? 0x40 : 0;
  var nbit = node.next ? 0x20 : 0;

  var freq;
  if (0 === node.frequency) {
    // zero means profanity
    freq = 0;
  } else {
    // values > 0 map the range 1 to 31
    freq = 1 + Math.floor(node.frequency * 31);
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
    this.writeUint24(output, node.next.offset);
  }
};

TSTConverter.prototype.emit = function(output, nodes) {
  // JSConv: `nodeslen` in original code isn't used
  this.computeOffsets(nodes);

  // 12-byte header with version number
  output.push('F'.charCodeAt(0));
  output.push('x'.charCodeAt(0));
  output.push('O'.charCodeAt(0));
  output.push('S'.charCodeAt(0));
  output.push('D'.charCodeAt(0));
  output.push('I'.charCodeAt(0));
  output.push('C'.charCodeAt(0));
  output.push('T'.charCodeAt(0));
  output.push(0);
  output.push(0);
  output.push(0);
  output.push(1);

  // Output the length of the longest word in the dictionary.
  // This allows to easily reject input that is longer
  output.push(Math.min(this.maxWordLength, 255));

  // Output a table of letter frequencies. The search algorithm may
  // want to use this to decide which diacritics to try, for example.
  var characters = Object.keys(this.characterFrequency).map(function(ch) {
    return {ch: ch, freq: this.characterFrequency[ch]};
  }, this);

  // JSConv: Python seems retain alphabetical other of "ch"
  // when freq is the same.
  characters.sort(function (chFreq1, chFreq2){
    if (chFreq2.freq == chFreq1.freq) {
      return chFreq1.ch.charCodeAt(0) - chFreq2.ch.charCodeAt(0);
    }else{
      return chFreq2.freq - chFreq1.freq;
    }
  });

  // JSConv: on 16-bit and 32-bit writing:
  // The original Python code used big-endian conversion, so we
  // push MSB first down to LSB.

  output.push((characters.length >> 8) & 0xFF);

  output.push(characters.length & 0xFF);

  characters.forEach(function(chFreq) {
    var charCode = chFreq.ch.charCodeAt(0);

    output.push((charCode >> 8) & 0xFF);
    output.push(charCode & 0xFF);

    var freq = chFreq.freq;
    output.push((freq >> 24) & 0xFF);
    output.push((freq >> 16) & 0xFF);
    output.push((freq >> 8) & 0xFF);
    output.push(freq & 0xFF);
  });

  // Write the nodes of the tree to the array.
  nodes.forEach(function(node) {
    this.emitNode(output, node);
  }, this);
};

TSTConverter.prototype.toBlob = function() {
  if (this.blob) {
    return this.blob;
  }

  var words = this.words;

  words = words.map(function(word) {
    // JSConv: uniform frequency. We can't use 0 (special meaning for prediction
    // engine) and we can't use 1 either (which overflows after normalization),
    // so just use a 0.9
    return {w: word, f: 0.9};
  });

  var tstRoot = null;
  var tree = new TSTTree();

  words.forEach(function(wordFreq) {
    var word = wordFreq.w;
    var freq = wordFreq.f;

    // Find the longest word in the dictionary
    this.maxWordLength = Math.max(this.maxWordLength, word.length);

    tstRoot = tree.insert(tstRoot, word + _EndOfWord, freq);

    // keep track of the letter frequencies
    word.split('').forEach(function(ch) {
      if (ch in this.characterFrequency) {
        this.characterFrequency[ch]++;
      } else {
        this.characterFrequency[ch] = 1;
      }
    }, this);
  }, this);

  tstRoot = tree.balance(tstRoot);

  var nodes = this.serializeTree(tstRoot);

  var outputArray = [];
  this.emit(outputArray, nodes);

  this.blob = new Uint8Array(outputArray);
  return this.blob;
};

if (module) {
  module.exports.TSTConverter = TSTConverter;
}
