export default function createDeploymentEndpoints(kubeconfig, client, app) {
  app.post("/deployments/create", async (req, res) => {
    const deployment = req.body;

    if (!deployment.labels.app) {
        deployment.labels.app = deployment.name;
    }

    const runtimeDeployment = {
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
                resources: {
                    requests: deployment.requests,
                    limits: deployment.limits,
                }
              },
            ],
          },
        },
      },
    };

    try {
      const response = await client.create(runtimeDeployment);
      res.send(response.body);
    } catch (e) {
      console.warn(e);
      res.status(500).send('');
    }
  });
}
