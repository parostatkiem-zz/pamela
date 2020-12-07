import injectHeaders from "./headerInjector";
import fetch from "node-fetch";
import { addJsonFieldToItems, calculateURL, HttpError } from "./other";

export const createGenericGetEndpoint = (kubeconfig, app) => (
  path,
  urlTemplate,
  isNamespaced = true,
  extraItemHeader
) => {
  app.get(path, async (req, res) => {
    try {
      const agent = app.get("https_agent");
      const opts = await injectHeaders({ agent }, req.headers, kubeconfig, app);
      const url = calculateURL(urlTemplate, {
        namespace: isNamespaced ? req.params.namespace : undefined,
      });

      const response = await fetch(url, opts);
      if (!response.ok)
        throw new HttpError("Failed to get resource " + name, response.statusText, response.status);
      const responseJSON = await response.json();
      addJsonFieldToItems(responseJSON, extraItemHeader);
      res.send(responseJSON);
    } catch (e) {
      console.error(e);
      if (e instanceof HttpError) e.send(res);
      else res.status(500).send("Internal server error occured while updating resource " + name);
    }
  });
};

export const createGenericJsonUpdateEndpoint = (kubeconfig, app) => (
  path,
  urlTemplate,
  isNamespaced = true
) => {
  app.put(path, async (req, res) => {
    const { mergeJson } = req.body;
    const { name, namespace } = req.params;

    try {
      const agent = app.get("https_agent");
      const opts = await injectHeaders(
        {
          agent,
          body: JSON.stringify(mergeJson),
          headers: {
            "content-type": "application/json-patch+json",
          },
        },
        req.headers,
        kubeconfig,
        app
      );

      const url = calculateURL(urlTemplate, { namespace: isNamespaced ? namespace : undefined, name });

      const response = await fetch(url, { method: "PATCH", ...opts });
      if (!response.ok)
        throw new HttpError("Failed to update resource " + name, response.statusText, response.status);
      res.send(response);
    } catch (e) {
      console.error(e);
      if (e instanceof HttpError) e.send(res);
      else res.status(500).send("Internal server error occured while resource " + name);
    }
  });
};

export const createGenericDeleteEndpoint = (kubeconfig, app) => (path, urlTemplate, isNamespaced = true) => {
  app.delete(path, async (req, res) => {
    const { name, namespace } = req.params;

    try {
      const agent = app.get("https_agent");
      const opts = await injectHeaders({ agent }, req.headers, kubeconfig, app);
      const url = calculateURL(urlTemplate, { namespace: isNamespaced ? namespace : undefined, name });

      const response = await fetch(url, { method: "DELETE", ...opts });
      if (!response.ok)
        throw new HttpError("Failed to delete resource " + name, response.statusText, response.status);
      res.send(response);
    } catch (e) {
      console.error(e);
      if (e instanceof HttpError) e.send(res);
      else res.status(500).send("Internal server error occured while deleting resource " + name);
    }
  });
};

export const createGenericSubscriptionEndpoint = (app) => (
  resourceType,
  urlTemplate,
  addJSONfield,
  JSONfieldExtraHeader
) => {
  const currentEndpoints = app.get("subscriptionEndpoints");
  app.set("subscriptionEndpoints", {
    ...currentEndpoints,
    [resourceType]: { urlTemplate, addJSONfield, JSONfieldExtraHeader },
  });
};
