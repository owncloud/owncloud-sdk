#Current directory
DIR := ${CURDIR}

#Don't output anything else except the final documentation link
ifndef VERBOSE
.SILENT:
endif

.PHONY: all

all: deps
	if [ ! -f tests/config/config.json ] ; then cp tests/config/config.sample.json tests/config/config.json ; fi;

deps:
	npm i

test: deps
	if [ ! -f tests/config/config.json ] ; then \
		cp tests/config/config.sample.json tests/config/config.json ; \
	fi;
	echo "CONFIGS : "
	cat tests/config/config.json
	echo ""
	npm test

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
	rm -rf tests/config/config.json

	#Output success message
	echo "Repo cleaned, run \"make\" to setup again."
