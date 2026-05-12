pipeline {
    agent any

    environment {
        IMAGE_NAME = 'autoaudit-backend-api'
        API_BASE_URL = 'http://localhost:8000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Stage: Docker Image') {
            steps {
                script {
                    def commitShort = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${commitShort}"
                    env.BACKEND_IMAGE = "${env.IMAGE_NAME}:${env.IMAGE_TAG}"

                    sh """
                        docker build \
                          -f backend-api/Dockerfile \
                          -t ${env.BACKEND_IMAGE} \
                          -t ${env.IMAGE_NAME}:latest \
                          .
                    """

                    sh "docker image inspect ${env.BACKEND_IMAGE}"

                    writeFile file: 'build-metadata.txt', text: """
IMAGE=${env.BACKEND_IMAGE}
IMAGE_TAG=${env.IMAGE_TAG}
BUILD_NUMBER=${env.BUILD_NUMBER}
GIT_COMMIT=${env.GIT_COMMIT}
"""

                    archiveArtifacts artifacts: 'build-metadata.txt', fingerprint: true
                }
            }
        }

        stage('Test Stage') {
            stages {
                stage('Unit Tests') {
                    steps {
                        dir('backend-api') {
                            sh '''
                                rm -rf .venv
                                python3 -m venv .venv
                                . .venv/bin/activate
                                pip install --upgrade pip
                                pip install -e ".[dev]"
                                pytest tests/unit -v \
                                  --junitxml=test-results-unit.xml \
                                  --cov=app.services.scan_readiness \
                                  --cov-report=xml:coverage-unit.xml
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend-api/test-results-unit.xml'
                            archiveArtifacts artifacts: 'backend-api/coverage-unit.xml', allowEmptyArchive: true
                        }
                    }
                }

                stage('Start Test Environment') {
                    steps {
                        sh 'docker-compose --profile frontend-dev down -v || true'
                        sh 'docker-compose --profile frontend-dev up -d db redis opa backend-api'

                        sh '''
                            echo "Waiting for backend API..."
                            for i in $(seq 1 30); do
                                if curl -fsS http://localhost:8000/ > /dev/null; then
                                    echo "Backend API is ready"
                                    exit 0
                                fi
                                sleep 2
                            done

                            echo "Backend API did not become ready in time"
                            docker logs autoaudit-backend-api --tail=100 || true
                            exit 1
                        '''
                    }
                }

                stage('Smoke Tests') {
                    steps {
                        dir('backend-api') {
                            sh '''
                                . .venv/bin/activate
                                API_BASE_URL=http://localhost:8000 \
                                pytest tests/smoke -v \
                                  --junitxml=test-results-smoke.xml
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend-api/test-results-smoke.xml'
                            archiveArtifacts artifacts: 'backend-api/test-results-smoke.xml', allowEmptyArchive: true
                        }
                    }
                }

                stage('Integration Tests') {
                    steps {
                        dir('backend-api') {
                            sh '''
                                . .venv/bin/activate
                                API_BASE_URL=http://localhost:8000 \
                                pytest tests/integration -v \
                                  --junitxml=test-results-integration.xml
                            '''
                        }
                    }
                    post {
                        always {
                            junit 'backend-api/test-results-integration.xml'
                            archiveArtifacts artifacts: 'backend-api/test-results-integration.xml', allowEmptyArchive: true
                        }
                    }
                }
            }
            post {
                always {
                    sh 'docker-compose --profile frontend-dev down -v || true'
                }
            }
        }
    }
}

