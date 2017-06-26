#!/bin/bash

echo ""

read -p "Enter owncloud instance URL for unit tests and swagger documentation: " instance;
sed -i "s|owncloudURL.*|owncloudURL: \"$instance\",|g" swagger.config.js;
sed -i "s|\"owncloudURL.*|\"owncloudURL\": \"$instance\",|g" owncloud/test/config.json;

read -p "Enter owncloud instance username for unit tests and swagger documentation: " username;
sed -i "s|username.*|username: \"$username\",|g" swagger.config.js;
sed -i "s|\"username.*|\"username\": \"$username\",|g" owncloud/test/config.json;

prompt="Enter owncloud instance username for unit tests and swagger documentation: ";
lenPassword=0;
echo -ne "$prompt\033[0K\r"

while IFS= read -r -s -n 1 char 
do
    if [[ $char == $'\0' ]];     then
        break
    fi
    if [[ $char == $'\177' ]];  then
    	if [ $lenPassword -gt 0 ]; then
	        password="${password%?}"
	        lenPassword=`expr $lenPassword - 1`
	        prompt=${prompt%?}
	    fi;
    else
        prompt+='*'
        password+="$char"
        lenPassword=`expr $lenPassword + 1`
    fi

    echo -ne "$prompt\033[0K\r"
done

echo
echo

sed -i "s|password.*|password: \"$password\"|g" swagger.config.js;
sed -i "s|\"password.*|\"password\": \"$password\"|g" owncloud/test/config.json;