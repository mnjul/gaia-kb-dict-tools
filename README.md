gaia-kb-dict-tools
==================

Some scripts related to Mozilla Boot-2-Gecko (Firefox OS) Gaia Keyboard dictionaries

# Todo
* Test list2dict.js
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
* For now, there is no automated "batch" testing. For each test case, you must manually:
 1. Switch to ./tests directory
 2. node --harmony js_wrapper.js [testcase]
     * Note the node version above for bleeding-edge ES6 support
 3. python ../modified_python/list2dict.py [testcase]
 4. diff outputs/[testcase].js.out outputs/[testcase].py.out
 5. Happy debugging!
 6. [testcase] is any filename in ./tests/cases