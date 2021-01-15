import { validateToken } from "./tokenValidation";

const injectAuthorization = async (requestHeaders, kubeconfig, app) => {
  const username = await validateToken(requestHeaders.authorization, app);

  //TODO: consider passing other request headers (doesn't work straightforward for some reason)
  const result = { ...requestHeaders, headers: { "Impersonate-User": username } };

  kubeconfig.applyAuthorizationHeader(result);

  return result.headers;
};

export default injectAuthorization;
