import { validateToken } from "./tokenValidation";

const injectHeaders = async (baseOptions, requestHeaders, kubeconfig, app) => {
  const tokenDecoded = await validateToken(requestHeaders.authorization, app);
  const groupImpersonateHeaders = (tokenDecoded.groups || []).map((g) => ({ "Impersonate-Group": g }));
  const emailImpersonateHeaders = { "Impersonate-User": tokenDecoded.email };

  baseOptions.headers = { ...baseOptions.headers, ...groupImpersonateHeaders, ...emailImpersonateHeaders };

  kubeconfig.applyAuthorizationHeader(baseOptions);

  return baseOptions;
};

export default injectHeaders;
