docker rm --force privatebot
docker rmi privatebot
docker build -t privatebot .
docker run --name=privatebot -d privatebot