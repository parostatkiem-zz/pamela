const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const SubscriptionPool = require("./SubscriptionPool");

import compression from "compression";

import { initializeKubeconfig } from "./utils/kubeconfig";
import createPodEndpoints from "./endpoints/pods";
import { initializeApp } from "./utils/initialization";
import { HttpError } from "./utils/other";

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "*" })); //TODO
const kubeconfig = initializeKubeconfig();
const server = http.createServer(app);
const io = socketIO(server, { transports: ["websocket", "polling"] });
app.set("subscriptionEndpoints", {});
createPodEndpoints(kubeconfig, app);

new SubscriptionPool(io, kubeconfig, app);

app.use(compression()); //Compress all routes

// keep the error handlers as the last routes added to the app
app.use(function (req, res, next) {
  res.status(404).send("URL " + req.url + " not found");
});
app.use(function (err, req, res, next) {
  if (err instanceof HttpError) {
    e.send(res);
    return;
  }

  res.status(500).send("Internal server error");
});

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
console.log(`Domain used: ${kubeconfig.getCurrentCluster().name}`);

initializeApp(app, kubeconfig)
  .then((_) => {
    server.listen(port, address, () => {
      console.log(`👙 PAMELA 👄  server started @ ${port}!`);
    });
  })
  .catch((err) => {
    console.error("PANIC!", err);
    process.exit(1);
  });
