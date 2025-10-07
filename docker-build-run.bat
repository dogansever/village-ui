rem mvn clean install

docker build -t dogansever/village-ui:latest .

docker push dogansever/village-ui:latest

docker run -p 80:80 dogansever/village-ui:latest
