
build:
	npm run webpack


setup:
	$(MAKE) -C ../db/low-level setup
	$(MAKE) -C ../db/low-level build
	npm install

run:
	npm start 2>/dev/null

test:
	./node_modules/.bin/jasmine JASMINE_CONFIG_PATH=./client/ts/spec/support/jasmine.json

watch:
	# When the next command receives the SIGINT signal, execute the kill command.
	# This means that a single ^C will kill both watch processes
	trap "kill %1" SIGINT
	$(MAKE) watch_ts & $(MAKE) watch_react

watch_ts:
	./node_modules/.bin/tsc --project ./client/ts/tsconfig.json -w

watch_react:
	npm run watch

clean:
	rm -f app.js.map
	rm -f app.js
