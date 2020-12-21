export function createGenericCreateEndpoint(client, app) {
  app.post("/resource", async (req, res) => {
    try {
      const response = await client.create(req.body);
      res.send(response.body);
    } catch (e) {
      console.warn(e);
      res.status(500).send('');
    }
  });
}
