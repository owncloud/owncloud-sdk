config = {
    'app': 'owncloud-sdk',

    'branches': [
        'master'
    ],

    'yarnlint': True,

    'build': True
}

def main(ctx):
    pipelines = []
    for i in range(10):
        pipelines.append(fullBuild(i))
        pipelines.append(testWithinSubFolder(i))
    # return [ fullBuild(), testWithinSubFolder(), publish() ]
    return pipelines

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

def test():
    return [{
        'name': 'test',
        'image': 'owncloudci/chromium',
        'pull': 'always',
        'commands': [
            'yarn test-drone'
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

def fullBuild(part):
    return {
        'kind': 'pipeline',
        'name': 'Full build %s' % part,
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
            buildDocs() +
            buildSystem() +
            prepareTestConfig() +
            pactLog() +
            test()
    }

def testWithinSubFolder(part):
    return {
        'kind': 'pipeline',
        'name': 'Test within a subfolder %s' % part,
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
            buildDocs() +
            buildSystem() +
            prepareTestConfig('/sub/') +
            pactLog() +
            test()
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
        'depends_on': [ 'Full build', 'Test within a subfolder' ],
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
