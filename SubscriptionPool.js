import { calculateURL, addJsonField } from "./utils/other";
import injectHeaders from "./utils/headerInjector";
import byline from "byline";
import fetch from "node-fetch";

class Subscription {
  get hasNoSubscribers() {
    return !Object.keys(this._subscribers).length;
  }

  // https://github.com/kubernetes-client/javascript/issues/377 ?
  constructor() {
    this._subscribers = [];
  }

  notify(data) {
    for (const subscriber of Object.values(this._subscribers)) {
      subscriber.send(data);
    }
  }

  async addSubscriber(socket, path, serverUrl, injectHeadersFn) {
    const opts = await injectHeadersFn({});
    let errOut = null;
    const stream = byline.createStream();

    stream.on("data", (line) => {
      const data = JSON.parse(line);

      // const createdAt = data.object?.metadata?.creationTimestamp;
      // if (data.type === "ADDED" && createdAt && new Date(createdAt) < new Date()) return; // risky but I like to risk; skip ADDED type events bombing right after the subscription has been opened

      this.notify(data);
    });
    stream.on("error", (err) => {
      errOut = err;
    });
    stream.on("close", () => (errOut = new Error("Stream closed unexpectedly")));

    const url = serverUrl + path + "?watch=true";
    const resp = await fetch(url, { method: "GET", ...opts });
    // console.log(resp);

    new Promise((resolve, reject) => {
      resp.body.pipe(stream);
      this.controller = stream;
      stream.on("close", () => resolve());
      stream.on("error", reject);
    }).catch(console.error);

    if (errOut) throw errOut;

    this._subscribers[socket.id] = socket;
  }

  removeSubscriber(socket) {
    delete this._subscribers[socket.id];

    if (this.hasNoSubscribers && this.controller) {
      this.controller.destroy();
    }
  }
}

class SubscriptionPool {
  constructor(io, kc, app) {
    this.io = io;
    this.subscriptions = [];

    io.on("connection", (socket) => {
      console.log("got WS connection", socket.handshake.url.split("?")[0]);
      const path = socket.handshake.url.split("?")[0];
      const { authorization } = socket.handshake.query; //TODO avoid encoding other params in the URL (no idea how)

      if (!this.subscriptions[path]) {
        this.subscriptions[path] = new Subscription();
      }
      const target = kc.getCurrentCluster().server;
      const agent = app.get("https_agent");
      const injectHeadersFn = (baseOpts) => injectHeaders({ agent, ...baseOpts }, { authorization }, kc, app);

      this.subscriptions[path]
        .addSubscriber(socket, path, target, injectHeadersFn) // add subscriber asynchronously
        .catch((e) => {
          console.error("Failed to add subscriber for path", path, e);
        });

      socket.on("disconnect", () => {
        this.subscriptions[path].removeSubscriber(socket);
        if (this.subscriptions[path].hasNoSubscribers) {
          delete this.subscriptions[path];
        }
      });
    });
  }
}

module.exports = SubscriptionPool;
