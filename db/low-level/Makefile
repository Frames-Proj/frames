
build:
	./node_modules/typescript/bin/tsc

test:
	# run through ts-node to get stack traces that point to *.ts files
	node node_modules/ts-node/dist/bin.js node_modules/jasmine/bin/jasmine.js

setup:
	npm install

run:
	npm start 2>/dev/null

watch:
	# prefer tsc -w to take advantage of tsc's iterative compilation
	./node_modules/typescript/bin/tsc -w

clean:
	rm -f index.js.map
	rm -f index.js
