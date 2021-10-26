config = {
    "app": "owncloud-sdk",
    "branches": [
        "master",
    ],
    "yarnlint": True,
    "build": True,
}

OC_CI_GOLANG = "owncloudci/golang:1.16"
OC_CI_NODEJS = "owncloudci/nodejs:14"
OC_CI_PHP = "owncloudci/php:7.3"
OC_UBUNTU = "owncloud/ubuntu:20.04"

def main(ctx):
    return [consumerTestPipeline(), consumerTestPipeline("/sub/"), oc10ProviderTestPipeline(), ocisProviderTestPipeline(), publish()] + checkStarlark()

def incrementVersion():
    return [{
        "name": "increment-version",
        "image": OC_CI_NODEJS,
        "commands": [
            "yarn version --no-git-tag-version --new-version 1.0.0-${DRONE_BUILD_NUMBER}",
        ],
        "when": {
            "event": [
                "push",
            ],
        },
    }]

def buildDocs():
    return [{
        "name": "build-docs",
        "image": OC_CI_NODEJS,
        "commands": [
            "yarn install",
            "yarn build:docs",
        ],
    }]

def buildSystem():
    return [{
        "name": "build-system",
        "image": OC_CI_NODEJS,
        "commands": [
            "yarn install",
            "yarn lint",
            "yarn build:system",
        ],
    }]

def prepareTestConfig(subFolderPath = "/"):
    return [{
        "name": "prepare-test-config",
        "image": OC_UBUNTU,
        "commands": [
            "apt update",
            "apt install gettext -y",
            "envsubst < tests/config/config.drone.json > tests/config/config.json",
            "cat tests/config/config.json",
        ],
        "environment": {
            "SUBFOLDER": subFolderPath,
        },
    }]

def installCore(version):
    stepDefinition = {
        "name": "install-core",
        "image": "owncloudci/core",
        "settings": {
            "version": version,
            "core_path": "/var/www/owncloud/server",
            "db_type": "mysql",
            "db_name": "owncloud",
            "db_host": "mysql",
            "db_username": "owncloud",
            "db_password": "owncloud",
        },
    }

    return [stepDefinition]

def setupServerAndApp():
    return [{
        "name": "setup-server-%s" % config["app"],
        "image": OC_CI_PHP,
        "commands": [
            "cd /var/www/owncloud/server/",
            "php occ config:system:set trusted_domains 1 --value=owncloud",
        ],
    }]

def cloneOCIS():
    return [{
        "name": "clone-ocis",
        "image": OC_CI_GOLANG,
        "commands": [
            "source .drone.env",
            "cd $GOPATH/src",
            "mkdir -p github.com/owncloud/",
            "cd github.com/owncloud/",
            "git clone -b $OCIS_BRANCH --single-branch --no-tags https://github.com/owncloud/ocis",
        ],
        "volumes": [{
            "name": "server",
            "path": "/srv/app",
        }, {
            "name": "gopath",
            "path": "/go",
        }, {
            "name": "configs",
            "path": "/srv/config",
        }],
    }]

def buildOCIS():
    return [{
        "name": "build-ocis",
        "image": OC_CI_GOLANG,
        "commands": [
            "source .drone.env",
            "cd $GOPATH/src/github.com/owncloud/ocis",
            "git checkout $OCIS_COMMITID",
            "cd ocis",
            "make build",
            "cp bin/ocis /var/www/owncloud",
        ],
        "volumes": [{
            "name": "server",
            "path": "/srv/app",
        }, {
            "name": "gopath",
            "path": "/go",
        }, {
            "name": "configs",
            "path": "/srv/config",
        }],
    }]

def ocisService():
    return [{
        "name": "ocis",
        "image": OC_CI_GOLANG,
        "detach": True,
        "environment": {
            "OCIS_URL": "https://ocis:9200",
            "STORAGE_HOME_DRIVER": "ocis",
            "STORAGE_USERS_DRIVER": "ocis",
            "STORAGE_DRIVER_OCIS_ROOT": "/srv/app/tmp/ocis/storage/users",
            "STORAGE_DRIVER_LOCAL_ROOT": "/srv/app/tmp/ocis/local/root",
            "STORAGE_DRIVER_OWNCLOUD_DATADIR": "/srv/app/tmp/ocis/owncloud/data",
            "STORAGE_METADATA_ROOT": "/srv/app/tmp/ocis/metadata",
            "PROXY_OIDC_INSECURE": "true",
            "STORAGE_HOME_DATA_SERVER_URL": "http://ocis:9155/data",
            "STORAGE_USERS_DATA_SERVER_URL": "http://ocis:9158/data",
            "ACCOUNTS_DATA_PATH": "/srv/app/tmp/ocis-accounts/",
            "PROXY_ENABLE_BASIC_AUTH": True,
            "OCIS_LOG_LEVEL": "debug",
        },
        "commands": [
            "cd /var/www/owncloud",
            "mkdir -p /srv/app/tmp/ocis/owncloud/data/",
            "mkdir -p /srv/app/tmp/ocis/storage/users/",
            "./ocis server",
        ],
        "volumes": [{
            "name": "server",
            "path": "/srv/app",
        }, {
            "name": "gopath",
            "path": "/go",
        }, {
            "name": "configs",
            "path": "/srv/config",
        }],
    }]

def fixPermissions():
    return [{
        "name": "fix-permissions",
        "image": OC_CI_PHP,
        "commands": [
            "cd /var/www/owncloud/server",
            "chown www-data * -R",
        ],
    }]

def owncloudLog():
    return [{
        "name": "owncloud-log",
        "image": OC_UBUNTU,
        "detach": True,
        "commands": [
            "tail -f /var/www/owncloud/server/data/owncloud.log",
        ],
    }]

def owncloudService():
    return [{
        "name": "owncloud",
        "image": OC_CI_PHP,
        "environment": {
            "APACHE_WEBROOT": "/var/www/owncloud/server/",
        },
        "command": [
            "/usr/local/bin/apachectl",
            "-e",
            "debug",
            "-D",
            "FOREGROUND",
        ],
    }]

def databaseService():
    return [{
        "name": "mysql",
        "image": "mysql:5.5",
        "environment": {
            "MYSQL_USER": "owncloud",
            "MYSQL_PASSWORD": "owncloud",
            "MYSQL_DATABASE": "owncloud",
            "MYSQL_ROOT_PASSWORD": "owncloud",
        },
    }]

def pactConsumerTests(uploadPact):
    return [{
        "name": "test",
        "image": OC_CI_NODEJS,
        "environment": {
            "PACTFLOW_TOKEN": {
                "from_secret": "pactflow_token",
            },
        },
        "commands": [
            sanitizeBranchName("DRONE_SOURCE_BRANCH"),
            "yarn test-consumer",
        ] + ([
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server-pendingOn-oc10/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server-pendingOn-oc10.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server-pendingOn-ocis/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server-pendingOn-ocis.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server-pendingOn-oc10-ocis/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server-pendingOn-oc10-ocis.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacticipants/owncloud-sdk/versions/$${DRONE_COMMIT_SHA}/tags/$${DRONE_SOURCE_BRANCH}',
        ] if uploadPact else []),
    }]

def pactProviderTests(version, baseUrl, extraEnvironment = {}):
    environment = {}
    environment["PACTFLOW_TOKEN"] = {
        "from_secret": "pactflow_token",
    }
    environment["PROVIDER_VERSION"] = version
    environment["PROVIDER_BASE_URL"] = baseUrl

    for env in extraEnvironment:
        environment[env] = extraEnvironment[env]

    return [{
        "name": "test",
        "image": OC_CI_NODEJS,
        "environment": environment,
        "commands": [
            sanitizeBranchName("DRONE_SOURCE_BRANCH"),
            "yarn test-provider:ocis" if extraEnvironment.get("RUN_ON_OCIS") == "true" else "yarn test-provider:oc10",
        ],
    }]

def publishDocs():
    return [{
        "name": "publish-docs",
        "image": "plugins/gh-pages:1",
        "settings": {
            "pages_directory": "docs",
            "username": {
                "from_secret": "github_username",
            },
            "password": {
                "from_secret": "github_token",
            },
        },
        "when": {
            "event": [
                "push",
            ],
        },
    }]

def publishSystem():
    return [{
        "name": "publish-system",
        "image": "plugins/npm:1",
        "settings": {
            "email": {
                "from_secret": "npm_email",
            },
            "token": {
                "from_secret": "npm_token",
            },
            "username": {
                "from_secret": "npm_email",
            },
        },
        "when": {
            "event": [
                "push",
            ],
        },
    }]

def consumerTestPipeline(subFolderPath = "/"):
    return {
        "kind": "pipeline",
        "name": "testConsumer-" + ("root" if subFolderPath == "/" else "subfolder"),
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "workspace": {
            "base": "/var/www/owncloud",
            "path": "owncloud-sdk",
        },
        "trigger": {
            "branch": "master",
        },
        "steps": buildSystem() +
                 prepareTestConfig(subFolderPath) +
                 pactConsumerTests(True if subFolderPath == "/" else False),
    }

def ocisProviderTestPipeline():
    extraEnvironment = {
        "NODE_TLS_REJECT_UNAUTHORIZED": 0,
        "NODE_NO_WARNINGS": "1",
        "RUN_ON_OCIS": "true",
    }
    return {
        "kind": "pipeline",
        "name": "testOCISProvider",
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "workspace": {
            "base": "/var/www/owncloud",
            "path": "owncloud-sdk",
        },
        "trigger": {
            "branch": "master",
        },
        "depends_on": ["testConsumer-root", "testConsumer-subfolder"],
        "steps": buildSystem() +
                 prepareTestConfig() +
                 cloneOCIS() +
                 buildOCIS() +
                 ocisService() +
                 pactProviderTests("ocis-master", "https://ocis:9200", extraEnvironment),
        "volumes": [{
            "name": "configs",
            "temp": {},
        }, {
            "name": "gopath",
            "temp": {},
        }],
    }

def oc10ProviderTestPipeline():
    return {
        "kind": "pipeline",
        "name": "testOc10Provider",
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "workspace": {
            "base": "/var/www/owncloud",
            "path": "owncloud-sdk",
        },
        "trigger": {
            "branch": "master",
        },
        "depends_on": ["testConsumer-root", "testConsumer-subfolder"],
        "steps": buildSystem() +
                 prepareTestConfig() +
                 installCore("daily-master-qa") +
                 owncloudLog() +
                 setupServerAndApp() +
                 fixPermissions() +
                 pactProviderTests("daily-master-qa", "http://owncloud"),
        "services": owncloudService() +
                    databaseService(),
    }

def publish():
    return {
        "kind": "pipeline",
        "name": "Publish",
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "workspace": {
            "base": "/var/www/owncloud",
            "path": "owncloud-sdk",
        },
        "depends_on": ["testConsumer-root", "testConsumer-subfolder", "testOc10Provider", "testOCISProvider"],
        "trigger": {
            "branch": "master",
        },
        "steps": incrementVersion() +
                 buildDocs() +
                 buildSystem() +
                 publishDocs() +
                 publishSystem(),
        "when": {
            "event": [
                "push",
            ],
        },
    }

# replaces reserved and unsafe url characters with '-'
# reserved: & $ + , / : ; = ? @ #
# unsafe: <space> < > [ ] { } | \ ^ %
def sanitizeBranchName(BRANCH_NAME = ""):
    REGEX = "[][&$+,/:;=?@#[:space:]<>{}|^%\\\\]"
    return '%s=`echo $%s | sed -e "s/%s/-/g"`' % (BRANCH_NAME, BRANCH_NAME, REGEX)

def checkStarlark():
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "check-starlark",
        "steps": [
            {
                "name": "format-check-starlark",
                "image": "owncloudci/bazel-buildifier",
                "pull": "always",
                "commands": [
                    "buildifier --mode=check .drone.star",
                ],
            },
            {
                "name": "show-diff",
                "image": "owncloudci/bazel-buildifier",
                "pull": "always",
                "commands": [
                    "buildifier --mode=fix .drone.star",
                    "git diff",
                ],
                "when": {
                    "status": [
                        "failure",
                    ],
                },
            },
        ],
        "depends_on": [],
        "trigger": {
            "ref": [
                "refs/pull/**",
            ],
        },
    }]
