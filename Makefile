docs:
	sudo npm i
	make clean
	mkdir jsdoc
	node_modules/.bin/jsdoc owncloud/owncloud.js -d jsdoc/

clean:
	rm -rf jsdoc/