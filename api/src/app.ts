// Library imports
import http from 'http'
import express from 'express';
import { AddressInfo } from 'ws';

// Own Modules
import { Config } from './config';
import { RESTAPIHandler } from './APIHandlers/restAPIHandlers';
import { WSAPIHandler } from './APIHandlers/wsAPIHandler'
import { Databases } from './database/db';
import { PoIUpdater } from './poiUpdater';
import { HubConnector } from './hubConnector';
import { Logger } from './logger';
import { GraphHelper } from './routing/graphHelper';

// Read Configuration
Config.setFromFile("./config/configuration.yaml")

// Create Database Connection
Databases.init(Config.get["db"]["type"], Config.get["db"]["config"])

// Read Graph from file
if (Config.get["graph"] !== undefined)
{
  GraphHelper.read(Config.get["graph"]["path"])
}

// initialise Web Server
const app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const server = http.createServer(app);

app.use(express.json());

RESTAPIHandler.handle("/api/v1", app)
WSAPIHandler.handle("/api/v1", server)

app.get('/api/versions', (req, res) => {
  res.type("application/json")
  res.send('["v1"]');
});
server.listen(Config.get["api"]["port"], () => {
  Logger.log('WEB_SERVER', "Server running on port " + (server.address() as AddressInfo).port, Logger.LEVEL.INFO)
});

// start other Services
PoIUpdater.start()
HubConnector.wssubtolocs()
