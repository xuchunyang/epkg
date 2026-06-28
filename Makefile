.PHONY: build
build: epkg.sqlite3
	python3 build-json.py
	node build-package-page.js
	node build-index.js
	cp -v *.css public
	cp -v *.html public
	test "$$USER" = "xcy" || rm public/*.json

epkg.sqlite3:
	python3 build-db.py
