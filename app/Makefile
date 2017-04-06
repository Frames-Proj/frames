
build:
	npm run webpack

build_test:
	npm run test:build

setup:
	$(MAKE) -C ../db/low-level setup
	$(MAKE) -C ../db/low-level build
	npm install

run:
	npm start 2>/dev/null

test:
	npm run test:run

watch:
	npm run watch

watch_test:
	npm run test:watch

clean:
	rm -f app.js.map
	rm -f app.js
	rm -rf dist
