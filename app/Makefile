
build:
	./node_modules/typescript/bin/tsc --project ./client/ts/tsconfig.json

setup:
	$(MAKE) -C ../db/low-level setup
	$(MAKE) -C ../db/low-level build
	npm install

run:
	npm start 2>/dev/null

test:
	node node_modules/ts-node/dist/bin.js node_modules/jasmine/bin/jasmine.js

watch:
	./node_modules/typescript/bin/tsc -w

clean:
	rm -f app.js.map
	rm -f app.js
