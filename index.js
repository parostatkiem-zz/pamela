const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require("http");
const https = require("https");
import compression from "compression";
import injectAuthorization from "./utils/headerInjector";
import { initializeKubeconfig } from "./utils/kubeconfig";
import { initializeApp } from "./utils/initialization";
import { requestLogger } from "./utils/other";

const app = express();

app.use(bodyParser.json());
app.use(cors({ origin: "*" })); //TODO
app.use(compression()); //Compress all routes

const server = http.createServer(app);

const kubeconfig = initializeKubeconfig();
const k8sUrl = new URL(kubeconfig.getCurrentCluster().server);

// requestLogger(require("http")); //uncomment this to log the outgoing traffic
// requestLogger(require("https")); //uncomment this to log the outgoing traffic

const port = process.env.PORT || 3001;
const address = process.env.ADDRESS || "localhost";
console.log(`K8s server used: ${k8sUrl}`);

initializeApp(app, kubeconfig)
  .then((_) => {
    const httpsAgent = app.get("https_agent");
    app.use(handleRequest(httpsAgent));
    server.listen(port, address, () => {
      console.log(`👙 PAMELA 👄 server started @ ${port}!`);
    });
  })
  .catch((err) => {
    console.error("PANIC!", err);
    process.exit(1);
  });

const handleRequest = (httpsAgent) => async (req, res, next) => {
  const headers = await injectAuthorization(req.headers, kubeconfig, app);
  const options = {
    hostname: k8sUrl.hostname,
    path: req.originalUrl,
    headers,
    agent: httpsAgent,
    method: req.method,
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
  // k8sRequest.end();

  req.pipe(k8sRequest);
};
