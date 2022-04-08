OC_CI_ALPINE = "owncloudci/alpine:latest"
OC_CI_GOLANG = "owncloudci/golang:1.17"
OC_CI_NODEJS = "owncloudci/nodejs:14"
OC_CI_PHP = "owncloudci/php:7.3"
OC_UBUNTU = "owncloud/ubuntu:20.04"

def main(ctx):
    basepipelines = checkStarlark() + changelog(ctx) + sonarcloud(ctx)
    testpipelines = [consumerTestPipeline(), consumerTestPipeline("/sub/"), oc10ProviderTestPipeline(), ocisProviderTestPipeline()]
    pipelines = basepipelines + testpipelines + publish(ctx)
    return pipelines

def buildDocs():
    return [{
        "name": "build-docs",
        "image": OC_CI_NODEJS,
        "commands": [
            "yarn install --immutable",
            "yarn build:docs",
        ],
    }]

def buildSystem():
    return [{
        "name": "build-system",
        "image": OC_CI_NODEJS,
        "commands": [
            "yarn install --immutable",
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
        "name": "setup-server-owncloud-sdk",
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
    return [
        {
            "name": "generate-ocis",
            "image": OC_CI_NODEJS,
            "commands": [
                "cd /go/src/github.com/owncloud/ocis",
                "make ci-node-generate",
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
        },
        {
            "name": "build-ocis",
            "image": OC_CI_GOLANG,
            "commands": [
                "cd $GOPATH/src/github.com/owncloud/ocis/ocis",
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
        },
    ]

def ocisService():
    return [{
        "name": "ocis",
        "image": OC_CI_GOLANG,
        "detach": True,
        "environment": {
            "OCIS_URL": "https://ocis:9200",
            "STORAGE_HOME_DRIVER": "ocis",
            "STORAGE_USERS_DRIVER": "ocis",
            "STORAGE_USERS_DRIVER_LOCAL_ROOT": "/srv/app/tmp/ocis/local/root",
            "STORAGE_USERS_DRIVER_OWNCLOUD_DATADIR": "/srv/app/tmp/ocis/owncloud/data",
            "STORAGE_USERS_DRIVER_OCIS_ROOT": "/srv/app/tmp/ocis/storage/users",
            "STORAGE_METADATA_DRIVER_OCIS_ROOT": "/srv/app/tmp/ocis/storage/metadata",
            "STORAGE_SHARING_USER_JSON_FILE": "/srv/app/tmp/ocis/shares.json",
            "OCIS_INSECURE": "true",
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
        "steps": buildSystem() +
                 prepareTestConfig(subFolderPath) +
                 pactConsumerTests(True if subFolderPath == "/" else False),
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
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
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
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
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
    }

def publish(ctx):
    return [{
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
        "steps": buildDocs() +
                 buildSystem() +
                 publishDocs() +
                 publishSystem(),
        "trigger": {
            "ref": [
                "refs/tags/**",
            ],
        },
    }]

def changelog(ctx):
    repo_slug = ctx.build.source_repo if ctx.build.source_repo else ctx.repo.slug
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "changelog",
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "clone": {
            "disable": True,
        },
        "steps": [
            {
                "name": "clone",
                "image": "plugins/git-action:1",
                "settings": {
                    "actions": [
                        "clone",
                    ],
                    "remote": "https://github.com/%s" % (repo_slug),
                    "branch": ctx.build.source if ctx.build.event == "pull_request" else "master",
                    "path": "/drone/src",
                    "netrc_machine": "github.com",
                    "netrc_username": {
                        "from_secret": "github_username",
                    },
                    "netrc_password": {
                        "from_secret": "github_token",
                    },
                },
            },
            {
                "name": "generate",
                "image": "toolhippie/calens:latest",
                "commands": [
                    "calens >| CHANGELOG.md",
                ],
            },
            {
                "name": "diff",
                "image": OC_CI_ALPINE,
                "commands": [
                    "git diff",
                ],
            },
            {
                "name": "output",
                "image": OC_CI_ALPINE,
                "commands": [
                    "cat CHANGELOG.md",
                ],
            },
            {
                "name": "publish",
                "image": "plugins/git-action:1",
                "settings": {
                    "actions": [
                        "commit",
                        "push",
                    ],
                    "message": "Automated changelog update [skip ci]",
                    "branch": "master",
                    "author_email": "devops@owncloud.com",
                    "author_name": "ownClouders",
                    "netrc_machine": "github.com",
                    "netrc_username": {
                        "from_secret": "github_username",
                    },
                    "netrc_password": {
                        "from_secret": "github_token",
                    },
                },
                "when": {
                    "ref": {
                        "exclude": [
                            "refs/pull/**",
                        ],
                    },
                },
            },
        ],
        "depends_on": [],
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/pull/**",
            ],
        },
    }]

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

def sonarcloud(ctx):
    sonar_env = {
        "SONAR_TOKEN": {
            "from_secret": "sonar_token",
        },
    }
    if ctx.build.event == "pull_request":
        sonar_env.update({
            "SONAR_PULL_REQUEST_BASE": "%s" % (ctx.build.target),
            "SONAR_PULL_REQUEST_BRANCH": "%s" % (ctx.build.source),
            "SONAR_PULL_REQUEST_KEY": "%s" % (ctx.build.ref.replace("refs/pull/", "").split("/")[0]),
        })

    fork_handling = []
    if ctx.build.source_repo != "" and ctx.build.source_repo != ctx.repo.slug:
        fork_handling = [
            "git remote add fork https://github.com/%s.git" % (ctx.build.source_repo),
            "git fetch fork",
        ]

    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "sonarcloud",
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "clone": {
            "disable": True,  # Sonarcloud does not apply issues on already merged branch
        },
        "steps": [
            {
                "name": "clone",
                "image": "alpine/git:latest",
                "commands": [
                                # Always use the owncloud/ocis repository as base to have an up to date default branch.
                                # This is needed for the skipIfUnchanged step, since it references a commit on master (which could be absent on a fork)
                                "git clone https://github.com/%s.git ." % (ctx.repo.slug),
                            ] + fork_handling +
                            [
                                "git checkout $DRONE_COMMIT",
                            ],
            },
            {
                "name": "sonarcloud",
                "image": "sonarsource/sonar-scanner-cli:latest",
                "environment": sonar_env,
            },
        ],
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
    }]
