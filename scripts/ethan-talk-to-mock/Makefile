
#
# Not really required, just runable notes on how to use the
# project.
#

build:
	node_modules/grunt/bin/grunt ts

run:
	node js/HelloTypescript.js

clean:
	rm -f tscommand-*
    $(shell find lib -type f | grep -E ".*(\.js|\.js\.map)" | xargs rm -f)

setup:
	npm install

watch:
	node_modules/grunt/bin/grunt watch


