.PHONY: build
build: epkg.sqlite3
	node build-json.js
	node build-package-page.js
	node build-index.js
	cp -v *.css public
	test "$$USER" = "xcy" || rm public/*.json

epkg.sqlite3:
	curl https://raw.githubusercontent.com/emacsmirror/epkgs/master/epkg.sql | sqlite3 epkg.sqlite3

