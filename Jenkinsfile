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
                             
        stage('Testing Stage: Unit, Smoke, Integration') {
            steps {
                dir('backend-api') {
                    sh '''
                        rm -rf .venv
                        python3 -m venv .venv
                        . .venv/bin/activate
                        pip install --upgrade pip
                        pip install -r requirements-test.txt

                        pytest tests/unit -v \
                          --junitxml=test-results-unit.xml \
                          --cov=app.services.scan_readiness \
                          --cov-report=xml:coverage-unit.xml
                    '''
                }
               
                sh 'BACKEND_IMAGE=${BACKEND_IMAGE} docker compose -f docker-compose.test.yml down -v || true'
                sh 'BACKEND_IMAGE=${BACKEND_IMAGE} docker compose -f docker-compose.test.yml up -d'                              

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
                    docker logs autoaudit-test-backend-api --tail=100 || true
                    exit 1
                '''

                dir('backend-api') {
                    sh '''
                        . .venv/bin/activate

                        API_BASE_URL=http://localhost:8000 \
                        pytest tests/smoke -v \
                          --junitxml=test-results-smoke.xml

                        API_BASE_URL=http://localhost:8000 \
                        pytest tests/integration -v \
                          --junitxml=test-results-integration.xml
                    '''
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend-api/test-results-unit.xml'
                    junit allowEmptyResults: true, testResults: 'backend-api/test-results-smoke.xml'
                    junit allowEmptyResults: true, testResults: 'backend-api/test-results-integration.xml'

		    archiveArtifacts artifacts: 'backend-api/coverage-unit.xml,backend-api/test-results-unit.xml,backend-api/test-results-smoke.xml,backend-api/test-results-integration.xml', allowEmptyArchive: true

                    sh 'BACKEND_IMAGE=${BACKEND_IMAGE} docker compose -f docker-compose.test.yml down -v || true'
                }
            }
        }

        stage('Code Quality Stage: SonarCloud Analysis') {
	    steps {
		withCredentials([string(credentialsId: 'SONAR_TOKEN', variable: 'SONAR_TOKEN')]) {
		    sh '''
		        if [ ! -d sonar-scanner-5.0.2.4997-linux ]; then
		            wget -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.2.4997-linux.zip
		            unzip -q -o sonar-scanner-cli-5.0.2.4997-linux.zip
		        fi

		        ./sonar-scanner-5.0.2.4997-linux/bin/sonar-scanner \
		          -Dsonar.token=$SONAR_TOKEN \
		          -Dsonar.qualitygate.wait=true
		    '''
		}
	    }
	}
   
       stage('Security Stage: bandit, pip-audit, Trivy') {
            steps {
                sh '''
                    rm -rf security-venv
                    python3 -m venv security-venv
                    . security-venv/bin/activate
                    pip install --upgrade pip
                    pip install bandit pip-audit

                    bandit -r backend-api/app \
                      -f json \
                      -o backend-api/bandit-report.json \
                      --severity-level medium

                    pip-audit -r backend-api/requirements-test.txt \
                      -f json \
                      -o backend-api/pip-audit-report.json
                '''

                sh '''
                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v "$PWD":/workspace \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --format json \
                      --output /workspace/trivy-image-report.json \
                      ${BACKEND_IMAGE}

                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      -v "$PWD":/workspace \
                      aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --format table \
                      --output /workspace/trivy-image-report.txt \
                      ${BACKEND_IMAGE}

                    docker run --rm \
                      -v /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:latest image \
                      --ignore-unfixed \
                      --severity CRITICAL \
                      --exit-code 1 \
                      ${BACKEND_IMAGE}
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'backend-api/bandit-report.json,backend-api/pip-audit-report.json,trivy-image-report.json,trivy-image-report.txt', allowEmptyArchive: true
                }
            }
        } 
                
        stage('Deploy Stage: Staging') {
            steps {
                sh '''
                    export BACKEND_IMAGE=${BACKEND_IMAGE}

                    docker compose -f docker-compose.staging.yml down || true
                    docker compose -f docker-compose.staging.yml up -d

                    echo "Waiting for staging API..."
                    for i in $(seq 1 30); do
                        if curl -fsS http://localhost:8001/ > /dev/null; then
                            echo "Staging API is ready"
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "Staging API did not become ready in time"
                    docker logs autoaudit-staging-backend-api --tail=100 || true
                    exit 1
                '''
                
                writeFile file: 'deploy-staging-metadata.txt', text: """
		ENVIRONMENT=staging
		IMAGE=${env.BACKEND_IMAGE}
		URL=http://localhost:8001/
		COMPOSE_FILE=docker-compose.staging.yml
		BUILD_NUMBER=${env.BUILD_NUMBER}
		GIT_COMMIT=${env.GIT_COMMIT}
		"""
		
		archiveArtifacts artifacts: 'deploy-staging-metadata.txt', fingerprint: true                                                            
            }
        }

        stage('Release Stage: Production') {
            steps {
                sh '''
                    export RELEASE_IMAGE=autoaudit-backend-api:release-${BUILD_NUMBER}

                    docker tag ${BACKEND_IMAGE} ${RELEASE_IMAGE}

                    docker compose -f docker-compose.prod.yml down || true
                    docker compose -f docker-compose.prod.yml up -d

                    echo "Waiting for production API..."
                    for i in $(seq 1 30); do
                        if curl -fsS http://localhost:8002/ > /dev/null; then
                            echo "Production API is ready"
                            exit 0
                        fi
                        sleep 2
                    done

                    echo "Production API did not become ready in time"
                    docker logs autoaudit-prod-backend-api --tail=100 || true
                    exit 1
                '''
                
                writeFile file: 'release-production-metadata.txt', text: """
		ENVIRONMENT=production
		SOURCE_IMAGE=${env.BACKEND_IMAGE}
		RELEASE_IMAGE=autoaudit-backend-api:release-${env.BUILD_NUMBER}
		URL=http://localhost:8002/
		COMPOSE_FILE=docker-compose.prod.yml
		BUILD_NUMBER=${env.BUILD_NUMBER}
		GIT_COMMIT=${env.GIT_COMMIT}
		"""
		
		archiveArtifacts artifacts: 'release-production-metadata.txt', fingerprint: true
            }
        }
    }
}

