import sys

def test_single(test_name):
	import subprocess

	print "Test: " + test_name

	print "Python..."
	subprocess.call(["python", "../modified_python/list2dict.py", test_name])

	print "JavaSCript..."
	subprocess.call(["node", "--harmony", "js_wrapper.js", test_name])

	print "diff..."
	ret = subprocess.call(["diff", "outputs/" + test_name + ".py.out", "outputs/" + test_name + ".js.out"])
	return ret

if __name__ == "__main__":
	test_single(sys.argv[1])