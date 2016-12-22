
build:
	./node_modules/typescript/bin/tsc

setup:
	$(MAKE) -C ../db/low-level
	npm install

run:
	npm start 2>/dev/null

watch:
	./node_modules/typescript/bin/tsc -w

clean:
	rm -f app.js.map
	rm -f app.js
