# Indoor Navigation

## Prerequisites
- omlox Hub installation
- docker and docker-compose

## Configuration
Use docker-compose.yaml, ui/src/config.ts and api/config/configuration.yaml.
If there is no internet connection it is possible to use a local openstreetmap tileserver.
See https://github.com/Overv/openstreetmap-tile-server for example.

### ui/public/config/config.yaml
Use this for configuration of the UI. Choose if you want to use a local tileserver or a remote one.
You can also specify the color of the markers, the graph and where the map should be initialised.

### docker-compose.yaml
Global configuration for ports and docker containers. The most relevant option are the ports of the Reverse Proxy. As the application needs to be accessed via HTTPS it is recommended to use either 443:443 or 8443:443. 
Be sure to also set the port in ui/public/config/config.yaml, otherwise the WebSocket connection will not work.

### api/config/configuration.yaml
The most important option here is the connection to the omlox Hub. Possible options are 'path', 'port' and 'hostname'.

## Installation
After editing the configuration files as described above, start the project using:
```
sudo docker compose up -d
```

Then access it through your web browser. Make sure to use HTTPS, otherwise not all features will be available.
There might be a warning because the certificate is self-signed. This is fine for testing purposes.

## Usage

### Points-of-Interest
Points-of-Interest are the destinations you want to be navigated to. You can either add them manually in the settings, or you can define trackables in the omlox hub. Trackables from the omlox hub will automatically be syncronised, when their location is updated. This way, you can be navigated to a moving object.

### Own Location Provider
You have to specify the location provider you are using to track your own location. You can either do this by scanning a QR-Code (in a secure context) or entering it manually in the settings page.

### Orientation Sensor
The app uses the Orientation Sensor API to make a better guess about the direction the user is looking. This requires a secure context and does not work if the app is accessed using HTTP.

## API Specification

### REST API
List of REST API endpoints:

#### GET /api/v1/pois/
#### POST /api/v1/pois
#### DELETE /api/v1/pois/:poi
#### GET /api/v1/pois/:poi
#### PUT /api/v1/pois/:poi
