# docker images
OC_CI_ALPINE = "owncloudci/alpine:latest"
OC_CI_GOLANG = "owncloudci/golang:1.18"
OC_CI_NODEJS = "owncloudci/nodejs:%s"
OC_CI_PHP = "owncloudci/php:7.3"
OC_UBUNTU = "owncloud/ubuntu:20.04"
OC_CI_DRONE_CANCEL_PREVIOUS_BUILDS = "owncloudci/drone-cancel-previous-builds"
OC_CI_WAIT_FOR = "owncloudci/wait-for:latest"
PLUGINS_SLACK = "plugins/slack:1"
MELTWATER_DRONE_CACHE = "meltwater/drone-cache:v1"
MINIO_MC = "minio/mc:RELEASE.2021-10-07T04-19-58Z"

# constants
ROCKETCHAT_CHANNEL = "builds"
OC10_VERSION = "latest"
DEFAULT_NODEJS_VERSION = "14"

# directory dictionary
dirs = {
    "base": "/var/www/owncloud",
    "ocis": "/var/www/owncloud/ocis-build",
}

# config dictionary
config = {
    "app": "owncloud-sdk",
}

sdk_workspace = {
    "base": dirs["base"],
    "path": config["app"],
}

# minio mc environment variables
minio_mc_environment = {
    "CACHE_BUCKET": {
        "from_secret": "cache_public_s3_bucket",
    },
    "MC_HOST": {
        "from_secret": "cache_s3_endpoint",
    },
    "AWS_ACCESS_KEY_ID": {
        "from_secret": "cache_s3_access_key",
    },
    "AWS_SECRET_ACCESS_KEY": {
        "from_secret": "cache_s3_secret_key",
    },
}

go_step_volumes = [{
    "name": "server",
    "path": "/srv/app",
}, {
    "name": "gopath",
    "path": "/go",
}, {
    "name": "configs",
    "path": "/srv/config",
}]

def main(ctx):
    before = beforePipelines(ctx)

    stages = consumerPipelines(ctx)
    stages += pipelinesDependsOn(providerPipelines(ctx), stages)

    after = pipelinesDependsOn(afterPipelines(ctx), stages)

    purge_caches = pipelinesDependsOn(purgeCachePipelines(ctx), after)

    return before + pipelinesDependsOn(stages, before) + after + purge_caches

def beforePipelines(ctx):
    return cancelPreviousBuilds() + \
           checkStarlark() + \
           changelog(ctx) + \
           sonarcloud(ctx) + \
           cacheOcisPipeline(ctx) + \
           yarnCache(ctx) + \
           pipelinesDependsOn(buildSystemCache(ctx), yarnCache(ctx)) + \
           pipelinesDependsOn(yarnlint(ctx), yarnCache(ctx))

def consumerPipelines(ctx):
    return []  # consumerTestPipeline(ctx) + consumerTestPipeline(ctx, "/sub/")

def providerPipelines(ctx):
    return []  #oc10ProviderTestPipeline(ctx) + ocisProviderTestPipeline(ctx)

def afterPipelines(ctx):
    return notify() + publish(ctx)

def purgeCachePipelines(ctx):
    return purgeBuildArtifactCache(ctx, "yarn") + purgeBuildArtifactCache(ctx, "dist")

def yarnCache(ctx):
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "cache-yarn",
        "steps": installYarn() +
                 rebuildBuildArtifactCache(ctx, "yarn", ".yarn"),
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
    }]

def installYarn():
    return [{
        "name": "yarn-install",
        "image": OC_CI_NODEJS % DEFAULT_NODEJS_VERSION,
        "commands": [
            "yarn install --immutable",
        ],
    }]

def lint():
    return [{
        "name": "lint",
        "image": OC_CI_NODEJS % DEFAULT_NODEJS_VERSION,
        "commands": [
            "yarn lint",
        ],
    }]

def yarnlint(ctx):
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "lint",
        "steps": restoreBuildArtifactCache(ctx, "yarn", ".yarn") +
                 installYarn() +
                 lint(),
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
    }]

def buildSystemCache(ctx):
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "cache-build-system",
        "steps": restoreBuildArtifactCache(ctx, "yarn", ".yarn") +
                 installYarn() +
                 buildSystem() +
                 debugPwd() +
                 rebuildBuildArtifactCache(ctx, "dist", "dist"),
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
    }]

def cacheOcisPipeline(ctx):
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "cache-ocis",
        "workspace": sdk_workspace,
        "clone": {
            "disable": True,
        },
        "steps": checkForExistingOcisCache(ctx) +
                 buildOcis() +
                 cacheOcis(),
        "volumes": [{
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
    }]

def genericCache(name, action, mounts, cache_key):
    rebuild = "false"
    restore = "false"
    if action == "rebuild":
        rebuild = "true"
        action = "rebuild"
    else:
        restore = "true"
        action = "restore"

    return [{
        "name": "%s_%s" % (action, name),
        "image": MELTWATER_DRONE_CACHE,
        "environment": {
            "AWS_ACCESS_KEY_ID": {
                "from_secret": "cache_s3_access_key",
            },
            "AWS_SECRET_ACCESS_KEY": {
                "from_secret": "cache_s3_secret_key",
            },
        },
        "settings": {
            "endpoint": {
                "from_secret": "cache_s3_endpoint",
            },
            "bucket": "cache",
            "region": "us-east-1",  # not used at all, but fails if not given!
            "path_style": "true",
            "cache_key": cache_key,
            "rebuild": rebuild,
            "restore": restore,
            "mount": mounts,
            "debug": "true",
        },
    }]

def genericCachePurge(ctx, name, cache_key):
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "purge_%s" % (name),
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "steps": [
            {
                "name": "purge-cache",
                "image": MINIO_MC,
                "failure": "ignore",
                "environment": {
                    "MC_HOST_cache": {
                        "from_secret": "cache_s3_connection_url",
                    },
                },
                "commands": [
                    "mc rm --recursive --force cache/cache/%s/%s" % (ctx.repo.name, cache_key),
                ],
            },
        ],
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/v*",
                "refs/pull/**",
            ],
            "status": [
                "success",
                "failure",
            ],
        },
    }]

def genericBuildArtifactCache(ctx, name, action, path):
    name = "%s_build_artifact_cache" % (name)
    cache_key = "%s/%s/%s" % (ctx.repo.slug, ctx.build.commit + "-${DRONE_BUILD_NUMBER}", name)
    if action == "rebuild" or action == "restore":
        return genericCache(name, action, [path], cache_key)
    if action == "purge":
        return genericCachePurge(ctx, name, cache_key)
    return []

def rebuildBuildArtifactCache(ctx, name, path):
    return genericBuildArtifactCache(ctx, name, "rebuild", path)

def restoreBuildArtifactCache(ctx, name, path):
    return genericBuildArtifactCache(ctx, name, "restore", path)

def purgeBuildArtifactCache(ctx, name):
    return genericBuildArtifactCache(ctx, name, "purge", [])

def buildDocs():
    return [{
        "name": "build-docs",
        "image": OC_CI_NODEJS % DEFAULT_NODEJS_VERSION,
        "commands": [
            "yarn install --immutable",
            "yarn build:docs",
        ],
    }]

def buildSystem():
    return [{
        "name": "build-system",
        "image": OC_CI_NODEJS % DEFAULT_NODEJS_VERSION,
        "commands": [
            "yarn build:system",
            "touch dist/foobar",
        ],
    }]

def debugPwd():
    return [{
        "name": "debug-pwd",
        "image": OC_CI_NODEJS % DEFAULT_NODEJS_VERSION,
        "commands": [
            "find $$(pwd) | grep -v node_modules",
            "find / | grep dist | grep -v node_modules",
        ],
    }]

def prepareTestConfig(subFolderPath = "/"):
    return [{
        "name": "prepare-test-config",
        "image": OC_UBUNTU,
        "commands": [
            "apt update",
            "apt install gettext -y",
            "envsubst < tests/config/config.sample.json > tests/config/config.json",
            "cat tests/config/config.json",
        ],
        "environment": {
            "SUBFOLDER": subFolderPath,
        },
    }]

def installCore(version):
    return [{
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
    }]

def setupServerAndApp():
    return [{
        "name": "setup-server-owncloud-sdk",
        "image": OC_CI_PHP,
        "commands": [
            "cd /var/www/owncloud/server/",
            "php occ config:system:set trusted_domains 1 --value=owncloud",
            "php occ config:system:set skeletondirectory --value=''",
        ],
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

def pactConsumerTests(ctx, uploadPact):
    return [{
        "name": "test",
        "image": OC_CI_NODEJS % DEFAULT_NODEJS_VERSION,
        "environment": {
            "PACTFLOW_TOKEN": {
                "from_secret": "pactflow_token",
            },
        },
        "commands": [
            setPactConsumerTagEnv(ctx),
            "yarn test-consumer",
        ] + ([
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server-pendingOn-oc10/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server-pendingOn-oc10.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server-pendingOn-ocis/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server-pendingOn-ocis.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server-pendingOn-oc10-ocis/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server-pendingOn-oc10-ocis.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacticipants/owncloud-sdk/versions/$${DRONE_COMMIT_SHA}/tags/$${PACT_CONSUMER_VERSION_TAG}',
        ] if uploadPact else []),
    }]

def pactProviderTests(ctx, version, baseUrl, extraEnvironment = {}):
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
        "image": OC_CI_NODEJS % DEFAULT_NODEJS_VERSION,
        "environment": environment,
        "commands": [
            setPactConsumerTagEnv(ctx),
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

def consumerTestPipeline(ctx, subFolderPath = "/"):
    return [{
        "kind": "pipeline",
        "name": "testConsumer-" + ("root" if subFolderPath == "/" else "subfolder"),
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "workspace": sdk_workspace,
        "steps": restoreBuildArtifactCache(ctx, "yarn", ".yarn") +
                 installYarn() +
                 prepareTestConfig(subFolderPath) +
                 pactConsumerTests(ctx, True if subFolderPath == "/" else False),
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
    }]

def ocisProviderTestPipeline(ctx):
    extraEnvironment = {
        "NODE_TLS_REJECT_UNAUTHORIZED": 0,
        "NODE_NO_WARNINGS": "1",
        "RUN_ON_OCIS": "true",
    }

    return [{
        "kind": "pipeline",
        "name": "testOCISProvider",
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "workspace": sdk_workspace,
        "steps": restoreBuildArtifactCache(ctx, "yarn", ".yarn") +
                 installYarn() +
                 prepareTestConfig() +
                 restoreOcisCache() +
                 ocisService() +
                 waitForOcisService() +
                 pactProviderTests(ctx, "ocis-master", "https://ocis:9200", extraEnvironment),
        "volumes": [{
            "name": "configs",
            "temp": {},
        }, {
            "name": "gopath",
            "temp": {},
        }],
        "depends_on": getPipelineNames(cacheOcisPipeline(ctx)),
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
    }]

def oc10ProviderTestPipeline(ctx):
    return [{
        "kind": "pipeline",
        "name": "testOc10Provider",
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "workspace": sdk_workspace,
        "steps": restoreBuildArtifactCache(ctx, "yarn", ".yarn") +
                 installYarn() +
                 prepareTestConfig() +
                 installCore(OC10_VERSION) +
                 owncloudLog() +
                 setupServerAndApp() +
                 fixPermissions() +
                 pactProviderTests(ctx, OC10_VERSION, "http://owncloud"),
        "services": owncloudService() +
                    databaseService(),
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
    }]

def publish(ctx):
    return [{
        "kind": "pipeline",
        "name": "Publish",
        "platform": {
            "os": "linux",
            "arch": "amd64",
        },
        "workspace": sdk_workspace,
        "steps":
        #  buildDocs() +
        restoreBuildArtifactCache(ctx, "dist", "dist") +
        debugPwd(),
        # publishDocs() +
        # publishSystem(),
        "trigger": {
            "ref": [
                "refs/tags/**",
                "refs/pull/**",
            ],
        },
        "depends_on": [
            "cache-build-system",
        ],
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
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/pull/**",
            ],
        },
    }]

def setPactConsumerTagEnv(ctx):
    consumer_tag = ctx.build.source if ctx.build.event == "pull_request" else ctx.repo.branch

    # replaces reserved and unsafe url characters with '-'
    # reserved: & $ + , / : ; = ? @ #
    # unsafe: <space> < > [ ] { } | \ ^ %
    REGEX = "[][&$+,/:;=?@#[:space:]<>{}|^%\\\\]"
    return 'export PACT_CONSUMER_VERSION_TAG=$(echo "%s" | sed -e "s/%s/-/g")' % (consumer_tag, REGEX)

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

def notify():
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "chat-notifications",
        "clone": {
            "disable": True,
        },
        "steps": [
            {
                "name": "notify-rocketchat",
                "image": PLUGINS_SLACK,
                "settings": {
                    "webhook": {
                        "from_secret": "private_rocketchat",
                    },
                    "channel": ROCKETCHAT_CHANNEL,
                },
            },
        ],
        "trigger": {
            "ref": [
                "refs/heads/master",
                "refs/tags/**",
            ],
            "status": [
                "success",
                "failure",
            ],
        },
    }]

def cancelPreviousBuilds():
    return [{
        "kind": "pipeline",
        "type": "docker",
        "name": "cancel-previous-builds",
        "clone": {
            "disable": True,
        },
        "steps": [{
            "name": "cancel-previous-builds",
            "image": OC_CI_DRONE_CANCEL_PREVIOUS_BUILDS,
            "settings": {
                "DRONE_TOKEN": {
                    "from_secret": "drone_token",
                },
            },
        }],
        "trigger": {
            "ref": [
                "refs/pull/**",
            ],
        },
    }]

def pipelineDependsOn(pipeline, dependant_pipelines):
    if "depends_on" in pipeline.keys():
        pipeline["depends_on"] = pipeline["depends_on"] + getPipelineNames(dependant_pipelines)
    else:
        pipeline["depends_on"] = getPipelineNames(dependant_pipelines)
    return pipeline

def pipelinesDependsOn(pipelines, dependant_pipelines):
    pipes = []
    for pipeline in pipelines:
        pipes.append(pipelineDependsOn(pipeline, dependant_pipelines))

    return pipes

def getPipelineNames(pipelines = []):
    """getPipelineNames returns names of pipelines as a string array

    Args:
      pipelines: array of drone pipelines

    Returns:
      names of the given pipelines as string array
    """
    names = []
    for pipeline in pipelines:
        names.append(pipeline["name"])
    return names

def checkForExistingOcisCache(ctx):
    sdk_repo_path = "https://raw.githubusercontent.com/owncloud/owncloud-sdk/%s" % ctx.build.commit
    return [
        {
            "name": "check-for-exisiting-cache",
            "image": OC_UBUNTU,
            "environment": minio_mc_environment,
            "commands": [
                "curl -o .drone.env %s/.drone.env" % sdk_repo_path,
                "curl -o check-oCIS-cache.sh %s/tests/drone/check-oCIS-cache.sh" % sdk_repo_path,
                ". ./.drone.env",
                "bash check-oCIS-cache.sh",
            ],
        },
    ]

def buildOcis():
    ocis_repo_url = "https://github.com/owncloud/ocis.git"
    return [
        {
            "name": "clone-ocis",
            "image": OC_CI_GOLANG,
            "commands": [
                "source .drone.env",
                "cd $GOPATH/src",
                "mkdir -p github.com/owncloud",
                "cd github.com/owncloud",
                "git clone -b $OCIS_BRANCH --single-branch %s" % ocis_repo_url,
                "cd ocis",
                "git checkout $OCIS_COMMITID",
            ],
            "volumes": go_step_volumes,
        },
        {
            "name": "generate-ocis",
            "image": OC_CI_NODEJS % "16",
            "commands": [
                # we cannot use the $GOPATH here because of different base image
                "cd /go/src/github.com/owncloud/ocis/",
                "retry -t 3 'make ci-node-generate'",
            ],
            "volumes": go_step_volumes,
        },
        {
            "name": "build-ocis",
            "image": OC_CI_GOLANG,
            "commands": [
                "source .drone.env",
                "cd $GOPATH/src/github.com/owncloud/ocis/ocis",
                "retry -t 3 'make build'",
                "mkdir -p %s/$OCIS_COMMITID" % dirs["base"],
                "cp bin/ocis %s/$OCIS_COMMITID" % dirs["base"],
                "ls -la %s/$OCIS_COMMITID" % dirs["base"],
            ],
            "volumes": go_step_volumes,
        },
    ]

def cacheOcis():
    return [{
        "name": "upload-ocis-cache",
        "image": MINIO_MC,
        "environment": minio_mc_environment,
        "commands": [
            ". ./.drone.env",
            "mc alias set s3 $MC_HOST $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY",
            "mc cp -r -a %s/$OCIS_COMMITID/ocis s3/$CACHE_BUCKET/ocis-build/$OCIS_COMMITID" % dirs["base"],
            "mc ls --recursive s3/$CACHE_BUCKET/ocis-build",
        ],
    }]

def restoreOcisCache():
    return [{
        "name": "restore-ocis-cache",
        "image": MINIO_MC,
        "environment": minio_mc_environment,
        "commands": [
            ". ./.drone.env",
            "rm -rf %s" % dirs["ocis"],
            "mkdir -p %s" % dirs["ocis"],
            "mc alias set s3 $MC_HOST $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY",
            "mc cp -r -a s3/$CACHE_BUCKET/ocis-build/$OCIS_COMMITID/ocis %s" % dirs["ocis"],
        ],
    }]

def ocisService():
    return [{
        "name": "ocis",
        "image": OC_CI_GOLANG,
        "detach": True,
        "environment": {
            "OCIS_URL": "https://ocis:9200",
            "IDM_ADMIN_PASSWORD": "admin",
            "STORAGE_HOME_DRIVER": "ocis",
            "STORAGE_USERS_DRIVER": "ocis",
            "STORAGE_USERS_DRIVER_LOCAL_ROOT": "/srv/app/tmp/ocis/local/root",
            "STORAGE_USERS_DRIVER_OWNCLOUD_DATADIR": "/srv/app/tmp/ocis/owncloud/data",
            "STORAGE_USERS_DRIVER_OCIS_ROOT": "/srv/app/tmp/ocis/storage/users",
            "STORAGE_METADATA_DRIVER_OCIS_ROOT": "/srv/app/tmp/ocis/storage/metadata",
            "STORAGE_SHARING_USER_JSON_FILE": "/srv/app/tmp/ocis/shares.json",
            "OCIS_INSECURE": "true",
            "PROXY_ENABLE_BASIC_AUTH": True,
            "OCIS_LOG_LEVEL": "error",
        },
        "commands": [
            "cd %s" % dirs["ocis"],
            "./ocis init",
            "./ocis server",
        ],
        "volumes": go_step_volumes,
    }]

def waitForOcisService():
    return [{
        "name": "wait-for-ocis",
        "image": OC_CI_WAIT_FOR,
        "commands": [
            "wait-for -it ocis:9200 -t 300",
        ],
    }]
