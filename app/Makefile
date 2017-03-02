
build:
	npm run webpack
	./node_modules/.bin/tsc --project ./client/ts/tsconfig.json


setup:
	$(MAKE) -C ../db/low-level setup
	$(MAKE) -C ../db/low-level build
	npm install

run:
	npm start 2>/dev/null

test:
	./node_modules/.bin/jasmine JASMINE_CONFIG_PATH=./client/ts/spec/support/jasmine.json

watch_ts:
	./node_modules/.bin/tsc --project ./client/ts/tsconfig.json -w &

watch_react:
	npm run watch

clean:
	rm -f app.js.map
	rm -f app.js
