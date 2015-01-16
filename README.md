gaia-kb-dict-tools (Gaia release branch)
==================

Some scripts related to Mozilla Boot-2-Gecko (Firefox OS) Gaia Keyboard user dictionaries.

__Note: All words in user dictionary have the same frequency!__

# Gaia Release Branch

You're on the Gaia release branch of this repo. In this repo:
* We don't care about the binary byte-to-byte identicalness of JavaScript and Python results - as long 
  as the prediction results are good.
* We only assign the fixed frequency value when we generate the blob, not when we grow the TST tree.
* The above two points mean that we can eliminate some frequency/sorting-related codes that originally
  arose due to V8's instable sorting algorithm. (And again this repo is meant to be drop into Gecko)
* We only provide necessary files; only prediction tests are available.
* Everything should always rebase upon master.

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