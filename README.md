gaia-kb-dict-tools
==================

Some scripts related to Mozilla Boot-2-Gecko (Firefox OS) Gaia Keyboard dictionaries

# Todo
* Test list2dict.js integratedly against original Python script
 * Write more test cases
* Write removeNode for JS
* Adapt predictions.js for reading tree blobs for tree modifications

# Requirements
* The JavaScript is written with a lot ES6, and newer Node.js versions are required.
* My machine is:
 * Node v0.11.14
 * Python is 2.7.6
 * Ubuntu 14.04 x64

# Running tests
* Basically, tests are carried out by comparing the binary blob result of the JS codes and 
  the Python codes, both running against the same test case.
* Test cases reside in ./test/cases, which contain lists of words, one word a line.
* Semi-automated testing
 1. Switch to ./tests directory
 2. Run `python test.py`
     * All test cases in ./tests/cases will be run.
     * Failed test cases will be reported
 3. Test script compares blob results with only a "diff" call, which is pretty naïve.
     * What can we do to improve this?
 4. Alternatively, run `python test_single.py [testcase]` to test for only single test
     * `[testcase]` is any filename in ./tests/cases
* Again, the JS codes have quite some bleeding-edge ES6 features (as we'll finally migrate
  into Gecko), so please make sure of your Node version.

## Python code changes
The naïve byte-by-byte comparison of JS and Python code results is problematic when we
only sort data structures partially. For example, consider the following
character frequency list:
`[('a', 1), ('b', 1), ('c', 1), ('d', 1)]`
The ordering of the list is not critical for predictions.js to work correctly
since all orderings result in the same score for fuzzy prediction. That is to say, a blob
storing the list as `[('a', 1), ('b', 1), ('c', 1), ('d', 1)]` is functionally
identical, in terms of character frequency, to a blob storing it as
`[('a', 1), ('c', 1), ('d', 1), ('b', 1)]`. However, byte-by-byte diff would flag such
difference and produce false comparison error. To mitigate this, the Python code
(together with JS code), used for correctness testing, has been amended to produce
total orderings of character frequency list: it will always attempt to sort by
the secondary member of list items if it sees the same primary member of the two
list items to compare.

The issue arises mostly because we test the whole thing in Node: It appears that
V8 doesn't sort stably :(