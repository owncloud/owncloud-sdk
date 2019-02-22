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
	yarn install

test: deps
	if [ ! -f tests/config/config.json ] ; then \
		cp tests/config/config.sample.json tests/config/config.json ; \
	fi;
	echo "CONFIGS : "
	cat tests/config/config.json
	echo ""
	yarn test

clean:
	#Delete existing documentation
	rm -rf node_modules/
	rm -rf tests/config/config.json

	#Output success message
	echo "Repo cleaned, run \"make\" to setup again."
