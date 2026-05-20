pipeline {
    agent any

    tools {
        nodejs 'node20'
    }

    environment {
        SONAR_HOME = tool 'sonar-scanner'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install --legacy-peer-deps'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('MySonarQube') {
                    sh '''
                    ${SONAR_HOME}/bin/sonar-scanner \
                    -Dsonar.projectKey=codemeet \
                    -Dsonar.projectName=codemeet \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=http://localhost:9000
                    '''
                }
            }
        }

        stage('Dependency Check') {
            steps {
                dependencyCheck(
                    odcInstallation: 'dependency-check',
                    additionalArguments: '--scan .'
                )

                dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                docker compose build

                docker tag codemeet-backend subodh12/codemeet-backend:latest
                docker tag codemeet-frontend subodh12/codemeet-frontend:latest
                '''
            }
        }

        stage('Docker Push') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        docker.image('subodh12/codemeet-backend').push('latest')
                        docker.image('subodh12/codemeet-frontend').push('latest')
                    }
                }
            }
        }

        stage('Docker Deploy') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully'
        }

        failure {
            echo 'Pipeline failed'
        }
    }
}