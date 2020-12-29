export function createGenericCreateEndpoint(client, app) {
  app.post("/resource", async (req, res) => {
    try {
      const result = await client.create(req.body);
      res.status(result.response.statusCode).send(result.body);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.body);
    }
  });
}
