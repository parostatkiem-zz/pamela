import {
  createGenericListEndpoint,
  createGenericDeleteEndpoint,
  createGenericJsonUpdateEndpoint,
  createGenericSubscriptionEndpoint,
} from "../utils/genericEndpoints";

export default function createDeploymentEndpoints(kubeconfig, app) {
  createGenericListEndpoint(kubeconfig, app)(
    "/namespaces/:namespace/deployments",
    `${kubeconfig.getCurrentCluster().server}/apis/apps/v1/namespaces/{namespace}/deployments`,
    true,
    { kind: "Deployment", apiVersion: "apps/v1" }
  );

  createGenericJsonUpdateEndpoint(kubeconfig, app)(
    "/namespaces/:namespace/deployments/:name",
    `${kubeconfig.getCurrentCluster().server}/apis/apps/v1/namespaces/{namespace}/deployments/{name}`
  );

  createGenericDeleteEndpoint(kubeconfig, app)(
    "/namespaces/:namespace/deployments/:name",
    `${kubeconfig.getCurrentCluster().server}/apis/apps/v1/namespaces/{namespace}/deployments/{name}`
  );

  createGenericSubscriptionEndpoint(app)(
    "deployments",
    `${kubeconfig.getCurrentCluster().server}/apis/apps/v1/namespaces/{namespace}/deployments?watch=true`,
    true,
    {
      kind: "Deployment",
      apiVersion: "apps/v1",
    }
  );
}
