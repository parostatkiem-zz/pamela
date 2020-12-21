import * as k8s from "@kubernetes/client-node";

export default function createDeploymentEndpoints(kubeconfig, app) {
  app.post("/deployments/create", async (req, res) => {
    const deployment = req.body;

    if (!deployment.labels.app) {
        deployment.labels.app = deployment.name;
    }

    const yamlDeployment = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: {
        name: deployment.name,
        namespace: deployment.namespace,
        labels: deployment.labels,
      },
      spec: {
        replicas: deployment.replicasMin,
        selector: { matchLabels: deployment.labels },
        template: {
          metadata: { labels: deployment.labels },
          spec: {
            containers: [
              {
                name: deployment.name,
                image: deployment.dockerImage,
              },
            ],
          },
        },
        resources: {
            requests: deployment.requests,
            limits: deployment.limits,
        }
      },
    };

    const client = k8s.KubernetesObjectApi.makeApiClient(kubeconfig); // todo pull up

    try {
      const response = await client.create(yamlDeployment);

      res.send(response.body);
    } catch (e) {
      console.warn(e);
      res.status(500).send('');
    }
  });
}
