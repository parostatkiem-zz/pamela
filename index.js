const express = require("express");
// const URL = require("url");
// const socketIO = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
// const { createProxyMiddleware } = require("http-proxy-middleware");
// const SubscriptionPool = require("./SubscriptionPool");
import injectHeaders from "./utils/headerInjector";

import compression from "compression";

import { initializeKubeconfig } from "./utils/kubeconfig";
import { initializeApp } from "./utils/initialization";
import { HttpError } from "./utils/other";
import { KubernetesObjectApi } from "@kubernetes/client-node";

const app = express();

app.use(bodyParser.json());
app.use(cors({ origin: "*" })); //TODO
const server = http.createServer(app);
// const io = socketIO(server, { transports: ["websocket", "polling"] });
// app.options("*", cors({ origin: "*" }));
const kubeconfig = initializeKubeconfig();
// new SubscriptionPool(io, kubeconfig, app);
// app.set("subscriptionEndpoints", {});

function requestLogger(httpModule) {
  var original = httpModule.request;
  httpModule.request = function (options, callback) {
    console.log("HTTPS request:", options.headers);
    return original(options, callback);
  };
}

// requestLogger(require("http"));
requestLogger(require("https"));

app.use(compression()); //Compress all routes

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
console.log(`Domain used: ${kubeconfig.getCurrentCluster().name}`);

initializeApp(app, kubeconfig)
  .then((_) => {
    const target = kubeconfig.getCurrentCluster().server;

    app.use(async (req, res, next) => {
      const url = new URL(target);
      const opts = await injectHeaders({}, req.headers, kubeconfig, app);
      const options = {
        hostname: url.hostname,
        path: req.path,
        headers: opts.headers,
        agent: app.get("http_agent"),
      };

      const k8sRequest = https
        .request(options, function (k8sResponse) {
          res.writeHead(k8sResponse.statusCode, {
            "Content-Type": k8sResponse.headers["Content-Type"] || "text/json",
          });
          k8sResponse.pipe(res);
        })
        .on("error", function (err) {
          console.error("Internal server error thrown", err);
          res.statusMessage = "Internal server error";
          res.statusCode = 500;
          res.end();
        });
      k8sRequest.end();

      req.pipe(k8sRequest, { end: true });
    });

    server.listen(port, address, () => {
      console.log(`👙 PAMELA 👄 server started @ ${port}!`);
    });
  })
  .catch((err) => {
    console.error("PANIC!", err);
    process.exit(1);
  });
