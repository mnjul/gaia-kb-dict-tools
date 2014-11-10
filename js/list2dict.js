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
