import { Instance } from '../instance'
import { getPathnameWithoutTrailingSlash, getSubdomain } from '../url-utils'

export function authFrontendSectorIdentifierUriValidation(
  request: Request
): Response | null {
  const { url } = request
  if (
    getSubdomain(url) !== null ||
    getPathnameWithoutTrailingSlash(url) !== '/auth/frontend-redirect-uris.json'
  ) {
    return null
  }
  const redirectUris = Object.values(Instance).map((instance) => {
    return `https://${instance}.${global.DOMAIN}/api/auth/callback`
  })
  return new Response(JSON.stringify(redirectUris), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}