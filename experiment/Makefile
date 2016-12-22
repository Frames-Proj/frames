
build:
	# node_modules/grunt/bin/grunt ts
	./node_modules/typescript/bin/tsc

test:
	# JASMINE_CONFIG_PATH=$(pwd)/spec/support/jasmine.json
	# node node_modules/jasmine/bin/jasmine.js
	# run through ts-node to get stack traces that point to *.ts files
	node node_modules/ts-node/dist/bin.js node_modules/jasmine/bin/jasmine.js

setup:
	npm install
	node node_modules/typings/dist/bin.js install

run:
	npm start 2>/dev/null

watch:
	# node_modules/grunt/bin/grunt watch
	# prefer tsc -w to take advantage of tsc's iterative compilation
	./node_modules/typescript/bin/tsc -w

clean:
	rm -f app.js.map
	rm -f app.js
	rm -f src/ts/*.js
	rm -f src/ts/*.js.map
