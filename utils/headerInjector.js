import { validateToken } from "./tokenValidation";

const injectAuthorization = async (requestHeaders, kubeconfig, app) => {
  const result = { headers: {} };
  const { groups, email } = await validateToken(requestHeaders.authorization, app);

  if (groups) result.headers["Impersonate-Group"] = groups; // TODO: verify if that works (for a github login). If not, we need a proper Headers class from 'node-fetch'
  if (email) result.headers["Impersonate-User"] = email;

  kubeconfig.applyAuthorizationHeader(result);
  return result.headers;
};

export default injectAuthorization;
