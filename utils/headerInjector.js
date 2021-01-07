import { validateToken } from "./tokenValidation";
import { Headers } from "node-fetch";

const injectHeaders = async (baseOptions = {}, requestHeaders, kubeconfig, app) => {
  if (!baseOptions.headers) baseOptions.headers = {};

  const injectedHeaders = new Headers();
  const { groups, email } = await validateToken(requestHeaders.authorization, app);

  if (groups && groups.length) {
    injectedHeaders.set("Impersonate-Group", groups[0]); // add groups impersonate (first one must be done via "set")
    if (groups.length > 1)
      groups.slice(1, groups.length).forEach((g) => injectedHeaders.append("Impersonate-Group", g)); // add groups impersonate (others must be done via "append")
  }

  injectedHeaders.set("Impersonate-User", email); // add email impersonate

  kubeconfig.applyAuthorizationHeader(baseOptions); // add token (to baseOptions.headers because it has to be a pure object)
  Object.entries(baseOptions.headers).forEach(([key, value]) => injectedHeaders.set(key, value)); // add whatever is in the baseOptions.headers

  return { ...baseOptions, headers: injectedHeaders }; // swap baseOptions.headers with the new headers
};

export default injectHeaders;
