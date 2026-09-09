import { headers } from "next/headers";
import { originFromHeaders } from "./origin-core";

export {
  googleCallbackUrl,
  oauthRedirectWarning,
  originFromHeaders,
} from "./origin-core";

export async function publicOrigin(): Promise<string> {
  return originFromHeaders(await headers());
}
