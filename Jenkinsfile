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
    }

    post {
        success {
            echo 'StockSense pipeline executed successfully!'
        }

        failure {
            echo 'Pipeline failed!'
        }
    }
}
