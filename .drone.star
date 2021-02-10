config = {
    'app': 'owncloud-sdk',

    'branches': [
        'master'
    ],

    'yarnlint': True,

    'build': True
}

def main(ctx):
    return [ consumerTestPipeline(), consumerTestPipeline('/sub/'), providerTestPipeline(), publish() ]

def incrementVersion():
    return [{
            'name': 'increment-version',
            'image': 'owncloudci/nodejs:12',
            'pull': 'always',
            'commands': [
                'yarn version --no-git-tag-version --new-version 1.0.0-${DRONE_BUILD_NUMBER}'
            ],
            'when': {
                'event': [
                    'push'
                ]
            }
    }]

def buildDocs():
    return [{
            'name': 'build-docs',
            'image': 'owncloudci/nodejs:12',
            'pull': 'always',
            'commands': [
                'yarn install',
                'yarn build:docs'
            ],
    }]

def buildSystem():
    return [{
            'name': 'build-system',
            'image': 'owncloudci/nodejs:12',
            'pull': 'always',
            'commands': [
                'yarn install',
                'yarn lint',
                'yarn build:system'
            ],
    }]

def pactLog():
    return [{
            'name': 'pact logs',
            'image': 'owncloudci/nodejs:12',
            'pull': 'always',
            'detach': True,
            'commands': [
                'mkdir -p /var/www/owncloud/owncloud-sdk/tests/log',
                'touch /var/www/owncloud/owncloud-sdk/tests/log/pact.log',
                'tail -f /var/www/owncloud/owncloud-sdk/tests/log/pact.log'
            ],
    }]

def prepareTestConfig(subFolderPath = '/'):
    return [{
        'name': 'prepare-test-config',
        'image': 'owncloud/ubuntu:16.04',
        'commands': [
            'apt update',
            'apt install gettext -y',
            'envsubst < tests/config/config.drone.json > tests/config/config.json',
            'cat tests/config/config.json'
        ],
        'environment' : {
            'SUBFOLDER': subFolderPath
        }
    }]

def installCore(version):
    stepDefinition = {
        'name': 'install-core',
        'image': 'owncloudci/core',
        'pull': 'always',
        'settings': {
            'version': version,
            'core_path': '/var/www/owncloud/server',
            'db_type': 'mysql',
            'db_name': 'owncloud',
            'db_host': 'mysql',
            'db_username': 'owncloud',
            'db_password': 'owncloud'
        }
    }

    return [stepDefinition]

def setupServerAndApp(logLevel):
    return [{
        'name': 'setup-server-%s' % config['app'],
        'image': 'owncloudci/php:7.3',
        'pull': 'always',
        'commands': [
            'cd /var/www/owncloud/server/',
            'php occ a:e testing',
            'php occ config:system:set trusted_domains 1 --value=owncloud',
            'php occ config:system:set cors.allowed-domains 0 --value=http://web',
            'php occ log:manage --level %s' % logLevel,
            'php occ config:list',
            'php occ config:system:set skeletondirectory --value=/var/www/owncloud/server/apps/testing/data/webUISkeleton',
            'php occ config:system:set dav.enable.tech_preview  --type=boolean --value=true',
            'php occ config:system:set web.baseUrl --value="http://web"',
            'php occ config:system:set sharing.federation.allowHttpFallback --value=true --type=bool'
        ]
    }]

def fixPermissions():
    return [{
        'name': 'fix-permissions',
        'image': 'owncloudci/php:7.3',
        'pull': 'always',
        'commands': [
            'cd /var/www/owncloud/server',
            'chown www-data * -R'
        ]
    }]

def owncloudLog():
    return [{
        'name': 'owncloud-log',
        'image': 'owncloud/ubuntu:16.04',
        'pull': 'always',
        'detach': True,
        'commands': [
            'tail -f /var/www/owncloud/server/data/owncloud.log'
        ]
    }]

def owncloudService():
    return [{
        'name': 'owncloud',
        'image': 'owncloudci/php:7.3',
        'pull': 'always',
        'environment': {
            'APACHE_WEBROOT': '/var/www/owncloud/server/',
        },
        'command': [
            '/usr/local/bin/apachectl',
            '-e',
            'debug',
            '-D',
            'FOREGROUND'
        ]
    }]

def databaseService():
    return [{
        'name': 'mysql',
        'image': 'mysql:5.5',
        'pull': 'always',
        'environment': {
            'MYSQL_USER': 'owncloud',
            'MYSQL_PASSWORD': 'owncloud',
            'MYSQL_DATABASE': 'owncloud',
            'MYSQL_ROOT_PASSWORD': 'owncloud'
        }
    }]

def pactConsumerTests(uploadPact):
    return [{
        'name': 'test',
        'image': 'owncloudci/nodejs:12',
        'pull': 'always',
        'environment': {
            'PACTFLOW_TOKEN': {
                'from_secret': 'pactflow_token'
            }
        },
        'commands': [
            'yarn test-consumer'
         ] + ([
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacts/provider/oc-server/consumer/owncloud-sdk/version/$${DRONE_COMMIT_SHA} -d @tests/pacts/owncloud-sdk-oc-server.json',
            'curl -XPUT -H"Content-Type: application/json" -H"Authorization: Bearer $${PACTFLOW_TOKEN}" https://jankaritech.pactflow.io/pacticipants/owncloud-sdk/versions/$${DRONE_COMMIT_SHA}/tags/$${DRONE_SOURCE_BRANCH}'
        ] if uploadPact else [])
    }]

def pactProviderTests(version):
    return [{
        'name': 'test',
        'image': 'owncloudci/nodejs:12',
        'pull': 'always',
        'environment': {
            'PROVIDER_BASE_URL': 'http://owncloud/',
            'PACTFLOW_TOKEN': {
                'from_secret': 'pactflow_token'
            },
            'PROVIDER_VERSION': version
        },
        'commands': [
            'yarn test-provider'
        ]
    }]

def publishDocs():
    return [{
        'name': 'publish-docs',
        'image': 'plugins/gh-pages:1',
        'pull': 'always',
        'settings': {
            'pages_directory': 'docs'
        },
        'environment' : {
            'GITHUB_PASSWORD': {
                'from_secret': 'github_password'
            },
            'GITHUB_USERNAME': {
                'from_secret': 'github_username'
            }
        },
        'when': {
            'event': [
                'push'
            ]
        }
    }]

def publishSystem():
    return [{
        'name': 'publish-system',
        'image': 'plugins/npm:1',
        'pull': 'always',
        'environment' : {
            'NPM_EMAIL': {
                'from_secret': 'npm_email'
            },
            'NPM_TOKEN': {
                'from_secret': 'npm_token'
            },
            'NPM_USERNAME': {
                'from_secret': 'npm_username'
            },
        },
        'when': {
            'event': [
                'push'
            ]
        }
    }]

def consumerTestPipeline(subFolderPath = '/'):
    return {
        'kind': 'pipeline',
        'name': 'testConsumer-' + ('root' if subFolderPath == '/' else 'subfolder'),
        'platform': {
            'os': 'linux',
            'arch': 'amd64'
        },
        'workspace': {
            'base': '/var/www/owncloud',
            'path': 'owncloud-sdk'
        },
        'trigger': {
            'branch': 'master'
        },
        'steps':
            buildSystem() +
            pactLog() +
            prepareTestConfig(subFolderPath) +
            pactConsumerTests(True if subFolderPath == '/' else False),
    }

def providerTestPipeline():
    return {
        'kind': 'pipeline',
        'name': 'testProvider',
        'platform': {
            'os': 'linux',
            'arch': 'amd64'
        },
        'workspace': {
            'base': '/var/www/owncloud',
            'path': 'owncloud-sdk'
        },
        'trigger': {
            'branch': 'master'
        },
        'depends_on': [ 'testConsumer-root', 'testConsumer-subfolder' ],
        'steps':
            buildSystem() +
            pactLog() +
            prepareTestConfig() +
            installCore('daily-master-qa') +
            owncloudLog() +
            setupServerAndApp('2') +
            fixPermissions()+
            pactProviderTests('daily-master-qa'),
         'services':
            owncloudService() +
            databaseService()
    }


def publish():
    return {
        'kind': 'pipeline',
        'name': 'Publish',
        'platform': {
            'os': 'linux',
            'arch': 'amd64'
        },
        'workspace': {
            'base': '/var/www/owncloud',
            'path': 'owncloud-sdk'
        },
        'depends_on': [ 'testConsumer-root', 'testConsumer-subfolder', 'testProvider' ],
        'trigger': {
            'branch': 'master'
        },
        'steps':
            incrementVersion() +
            buildDocs() +
            buildSystem() +
            publishDocs() +
            publishSystem(),
        'when': {
            'event': [
                'push'
            ]
        }
    }
