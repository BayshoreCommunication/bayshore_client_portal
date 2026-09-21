// Own cookie name so this app's session never collides with the company
// portal's (both run on localhost and cookies aren't port-scoped).
const BASE_NAME = "bayshore-client.session-token";

export const sessionCookieName = (secure: boolean) => (secure ? `__Secure-${BASE_NAME}` : BASE_NAME);
