gaia-kb-dict-tools
==================

Some scripts related to Mozilla Boot-2-Gecko (Firefox OS) Gaia Keyboard user dictionaries.

__Note: All words in user dictionary have the same frequency!__

# Todo
* (currently none)

# Requirements
* The JavaScript is written with a lot ES6, and newer Node.js versions are required.
* My machine is:
  * Node v0.11.14
  * Python is 2.7.6
  * Ubuntu 14.04 x64

# The File
The file is ./js/list2dict.js. It exports a `WordListConverter` class, whose constructor takes an Array of
user dictionary words. Call the insatntiated object's `toBlob` function to retrieve the Uint8Array
of the generated dictionary blob. You're not supposed to directly use helper classes related to
TST tree construction/seralization inside the file.

# Tests

## Blob-Comparison Tests
* Basically, tests of "total" correctness are carried out by comparing the binary blob results,
  byte-by-byte, of the JS codes and the Python codes, both running against the same test case.
* Test cases reside in ./test/cases, which contain lists of words, one word a line.
* Semi-automated testing
  1. Switch to ./tests directory
  2. Run `python test.py`
    * All test cases in ./tests/cases will be run.
    * Failed test cases will be reported
  3. Test script compares blob results with only a "diff" call, which is pretty naïve.
    * What can we do to improve this?
  4. Alternatively, run `python test_single.py [testcase]` to test for only single test.
    * `[testcase]` is any filename in ./tests/cases

### Python code changes
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

## Prediction Tests
* A modified predictions.js (from Gaia) is provided to test the generated blob for predictions:
  1. Switch to ./tests dictionary
  2. Run `node --harmony prediction_wrapper.js en_all`
    * Alternatively use `de_all` to test against German dictionary.

## Tests of Re-instantiability and Re-usability of WordListConverter
* WordListConverter is desigend to be import-once, instantite-multiple-times. A simple modified prediction
  test is provided to make sure that works.
  1. Switch to ./tests dictionary
  2. Run `node --harmony instantiability_test.js`

# Failure-Safe -- Beyond Latin Characters
* A small amount of test cases include non-latin characters:
  * `chinese`, `arabic`, `hindi`, and `thai` for characters from those languages.
  * `complex` mixes English, Arabic and Chinese.
  * `mixed` mixes English (and some diacritics) and Chinese, and the latin characters are from bytes of part of the Chinese characters.
  * `emoji` contains Emoji characters that are out of unicode BMP plane.
  They're currently used to make sure the the blob converter and latin IME prediction engine
  won't crash on blobs that encode such characters.
* We currently do not have plans to support predictions beyond latin IME, so the top priority might be
  making sure words containing such characters won't interfere with "normal" words that don't contain
  such characters.
  * The `chinese` test case
    1. Switch to ./tests dictionary
    2. Run `node --harmony prediction_wrapper.js chinese`
    3. Enter `apple`
    4. Observe that `apple一二三` is correctly retrieved.
  * The `mixed` test case
    1. Switch to ./tests dictionary
    2. Run `node --harmony prediction_wrapper.js mixed`
    3. Enter `ru`
    4. Observe that `run` and `RUN` is correctly retrieved.
    5. Same may be observed with `LA` input for `LATIN` and `LATÎN` results.
* `arabic`, `complex`, and `emoji` are known to fail the comparison test in the above section.

# Footnotes
* Again, the JS codes have quite some bleeding-edge ES6 features (as we'll finally migrate
  into Gecko), so please make sure of your Node version.