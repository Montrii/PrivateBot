@echo off

echo "Clearing up previous PrivateBot Docker.."
docker rm --force privatebot

echo "Removing image.."
docker rmi privatebot


echo "Building new image.."
docker build -t privatebot .

echo "Running new container.."
docker run --name=privatebot -d privatebot

