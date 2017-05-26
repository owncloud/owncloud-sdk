#Current directory
DIR := ${CURDIR}

#Don't output anything else except the final documentation link
ifndef VERBOSE
.SILENT:
endif

.PHONY: all

all:
	sudo npm i
	sudo npm --prefix ./docs-swagger/ i ./docs-swagger/

swagger:
	node docs-swagger/server.js

test:
	if [ ! -f owncloud/test/config.js ] ; then cp owncloud/test/config.sample.js owncloud/test/config.js ; fi;
	npm test

jsdocs:
	#Install jsdoc if it doesn't exist
	if [ ! -f node_modules/.bin/jsdoc ] ; then sudo npm i ; fi;
	
	#Delete existing documentation (if any)
	rm -rf jsdoc/

	#Create documentation
	node_modules/.bin/jsdoc owncloud/owncloud.js -d jsdoc/

	#Output the final documentation link
	echo "To read the documentation, click here : file://"${DIR}"/jsdoc/ownCloud.html"

clean:
	#Delete existing documentation
	rm -rf jsdoc/

	#Output success message
	echo "Existing Documentation removed"