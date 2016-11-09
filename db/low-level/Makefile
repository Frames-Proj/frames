
build:
	node_modules/grunt/bin/grunt ts

test:
	# JASMINE_CONFIG_PATH=$(pwd)/spec/support/jasmine.json
	node node_modules/jasmine/bin/jasmine.js

setup:
	npm install
	node node_modules/typings/dist/bin.js install

run:
	npm start 2>/dev/null

watch:
	node_modules/grunt/bin/grunt watch

clean:
	rm -f index.js.map
	rm -f index.js
