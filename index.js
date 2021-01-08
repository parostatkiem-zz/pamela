const express = require("express");
const socketIO = require("socket.io");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
const { createProxyMiddleware } = require("http-proxy-middleware");
const SubscriptionPool = require("./SubscriptionPool");
import injectHeaders from "./utils/headerInjector";

import compression from "compression";

import { initializeKubeconfig } from "./utils/kubeconfig";
import { initializeApp } from "./utils/initialization";
import { HttpError } from "./utils/other";
import { KubernetesObjectApi } from "@kubernetes/client-node";

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "*" })); //TODO
const kubeconfig = initializeKubeconfig();

app.set("subscriptionEndpoints", {});

function requestLogger(httpModule) {
  var original = httpModule.request;
  httpModule.request = function (options, callback) {
    console.log(options.headers);
    return original(options, callback);
  };
}

// requestLogger(require("http"));
// requestLogger(require("https"));

app.use(compression()); //Compress all routes

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
console.log(`Domain used: ${kubeconfig.getCurrentCluster().name}`);

initializeApp(app, kubeconfig)
  .then((_) => {
    const server = http.createServer(app);
    const target = kubeconfig.getCurrentCluster().server;
    const agent = app.get("https_agent");

    const entryMiddleware = async (req, res, next) => {
      if (req.headers?.authorization) {
        const opts = await injectHeaders({}, req.headers, kubeconfig, app);
        req.headers = opts.headers;
      }
      next();
    };

    const myProxy = createProxyMiddleware({
      target,
      agent,
      secure: true, //TODO make it dependent on the dev mode
      changeOrigin: true,
      selfHandleResponse: true,
      ws: true,
      onProxyReq: (proxyReq, req, res) => {},
      onProxyRes: async (proxyRes, req, res) => {
        proxyRes.statusCode = res.statusCode;
        proxyRes.pipe(res);
      },
    });

    app.use("*", entryMiddleware, myProxy);

    // keep the error handlers as the last routes added to the app
    app.use(function (req, res, next) {
      res.status(404).send("URL " + req.url + " not found");
    });
    app.use(function (err, req, res, next) {
      console.error(err);
      if (err instanceof HttpError) {
        e.send(res);
        return;
      }

      res.status(500).send("Internal server error");
    });

    server.listen(port, address, () => {
      console.log(`👙 PAMELA 👄  server started @ ${port}!`);
    });
  })
  .catch((err) => {
    console.error("PANIC!", err);
    process.exit(1);
  });
