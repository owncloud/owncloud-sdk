#Current directory
DIR := ${CURDIR}

#Don't output anything else except the final documentation link
ifndef VERBOSE
.SILENT:
endif

.PHONY: all

all: deps
	if [ ! -f owncloud/test/config.json ] ; then cp owncloud/test/config.sample.json owncloud/test/config.json ; fi;
	bash readOCInfo.sh

deps:
	npm i

test: deps
	if [ owncloud/test/testDownloadDir ] ; then rm -rf owncloud/test/testDownloadDir ; fi;
	mkdir owncloud/test/testDownloadDir
	if [ ! -f owncloud/test/config.json ] ; then \
		cp owncloud/test/config.sample.json owncloud/test/config.json ; \
	fi;
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

clean:
	#Delete existing documentation
	rm -rf jsdoc/
	rm -rf node_modules/
	rm -rf owncloud/test/config.json

	#Output success message
	echo "Repo cleaned, run \"make\" to setup again."
