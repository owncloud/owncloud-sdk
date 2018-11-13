#!/bin/bash
OC_VERSION=$1

docker pull owncloud:$OC_VERSION
DOCKER_ID=$(docker run -d -p 8888:80 owncloud:$OC_VERSION)

# needed else occ isn't available directly...
sleep 5

docker exec -u www-data $DOCKER_ID ./occ maintenance:install --admin-user="admin" --admin-pass="admin" --database="sqlite"
docker exec -u www-data $DOCKER_ID ./occ config:system:set cors.allowed-domains 0 --value http://127.0.0.1:9876
docker exec -u www-data $DOCKER_ID ./occ config:system:set cors.allowed-domains 1 --value http://localhost:9876

export DOCKER_ID