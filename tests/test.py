import os
from test_single import test_single

failed = []
for root, dirs, files in os.walk('cases'):
	for file in files:
		ret = test_single(file)
		if ret != 0:
			failed.append(file)

if failed:
	print "Failed test cases: ", failed
