const express = require("express");
const cors = require("cors");
const http = require("http");
const https = require("https");
import compression from "compression";
import { initializeKubeconfig } from "./utils/kubeconfig";
import { initializeApp } from "./utils/initialization";
import { requestLogger } from "./utils/other";

const app = express();
app.use(express.raw({ type: "*/*" }));
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

const handleRequest = (httpsAgent) => async (req, res) => {
  delete req.headers.host; // remove host in order not to confuse APIServer
  const options = {
    hostname: k8sUrl.hostname,
    path: req.originalUrl,
    headers: { ...req.headers, "Accept-Encoding": "" }, // a bit of explaination: k8s API handles accepting gzip but randomly decides to actually use it or not.
    body: req.body,
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
      res.end(Buffer.from(JSON.stringify({message: err})));
    });

  k8sRequest.end(Buffer.isBuffer(req.body) ? req.body : undefined);
  req.pipe(k8sRequest);
};
