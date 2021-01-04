import {
  createGenericListEndpoint,
  createGenericDeleteEndpoint,
  createGenericJsonUpdateEndpoint,
  createGenericSubscriptionEndpoint,
} from "../utils/genericEndpoints";

const resourceType = { kind: "Pod", apiVersion: "v1" };

export default function createPodEndpoints(kubeconfig, app) {
  const serverAddress = kubeconfig.getCurrentCluster().server;

  createGenericListEndpoint(kubeconfig, app)(
    "/api/v1/namespaces/:namespace/pods",
    `${serverAddress}/api/v1/namespaces/{namespace}/pods`,
    true,
    resourceType
  );

  createGenericJsonUpdateEndpoint(kubeconfig, app)(
    "/api/v1/namespaces/:namespace/pods/:name",
    `${serverAddress}/api/v1/namespaces/{namespace}/pods/{name}`
  );

  createGenericDeleteEndpoint(kubeconfig, app)(
    "/api/v1/namespaces/:namespace/pods/:name",
    `${serverAddress}/api/v1/namespaces/{namespace}/pods/{name}`
  );

  createGenericSubscriptionEndpoint(app)(
    "pods",
    `${serverAddress}/api/v1/namespaces/{namespace}/pods?watch=true`,
    true,
    resourceType
  );
}
