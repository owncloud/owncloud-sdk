#Current directory
DIR := ${CURDIR}

#Don't output anything else except the final documentation link
ifndef VERBOSE
.SILENT:
endif

.PHONY: all browser

all:
	sudo npm i
	sudo npm --prefix ./docs-swagger/ i ./docs-swagger/
	cp owncloud/test/config.sample.json owncloud/test/config.json

swagger:
	node docs-swagger/server.js

test:
	if [ owncloud/test/testDownloadDir ] ; then rm -rf owncloud/test/testDownloadDir ; fi;
	mkdir owncloud/test/testDownloadDir
	if [ ! -f owncloud/test/config.json ] ; then cp owncloud/test/config.sample.json owncloud/test/config.json ; fi;
	echo "CONFIGS : "
	cat owncloud/test/config.json
	echo ""
	npm test
	rm -rf owncloud/test/testDownloadDir

jsdocs:
	#Install jsdoc if it doesn't exist
	if [ ! -f node_modules/.bin/jsdoc ] ; then make ; fi;
	
	#Delete existing documentation (if any)
	rm -rf jsdoc/

	#Create documentation
	node_modules/.bin/jsdoc owncloud/*.js -d jsdoc/

	#Output the final documentation link
	echo "To read the documentation, click here : file://"${DIR}"/jsdoc/ownCloud.html"

browser:
	sed -i "s/require('fs/require('fs-web/g" owncloud/*.js
	sed -i "s/require('fs/require('fs-web/g" owncloud/test/*.js

	sed -i "s/require('request/require('browser-request/g" owncloud/*.js
	sed -i "s/require('request/require('browser-request/g" owncloud/test/*.js

	node_modules/.bin/webpack

	sed -i "s/require('fs-web/require('fs/g" owncloud/*.js
	sed -i "s/require('fs-web/require('fs/g" owncloud/test/*.js

	sed -i "s/require('browser-request/require('request/g" owncloud/*.js
	sed -i "s/require('browser-request/require('request/g" owncloud/test/*.js

clean:
	#Delete existing documentation
	rm -rf jsdoc/
	rm -rf node_modules/
	rm -rf docs-swagger/node_modules/
	rm owncloud/test/config.json

	#Output success message
	echo "Existing Documentation removed"
