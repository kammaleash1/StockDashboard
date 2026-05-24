pipeline {
    agent any

    environment {
        BACKEND_IMAGE = "kammaleash1/stocksense-backend"
        FRONTEND_IMAGE = "kammaleash1/stocksense-frontend"
    }

    stages {

        stage('Verify Docker Installation') {
            steps {
                sh 'docker --version'
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                sh 'docker build -t $BACKEND_IMAGE:latest ./backend'
            }
        }
        
        stage('Build Frontend Docker Image') {
            steps {
                sh 'docker build -t $FRONTEND_IMAGE:latest ./frontend'
            }
        }
        
        stage('Verify Docker Images') {
            steps {
                sh 'docker images'
            }
        }
    	
    	stage('Docker Hub Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-creds',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {

                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                }
            }
        }
    stage('Push Backend Image') {
            steps {
                sh 'docker push $BACKEND_IMAGE:latest'
            }
        }
    stage('Push Frontend Image') {
            steps {
                sh 'docker push $FRONTEND_IMAGE:latest'
            }
        }
	}


	post {

        success {
            echo 'Backend and Frontend images are built and pushed successfully!'
        }

        failure {
            echo 'Pipeline failed!'
        }

        always {
            sh 'docker logout'
        }
    }
}







