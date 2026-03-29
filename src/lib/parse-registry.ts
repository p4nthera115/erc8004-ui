import type { RegistrationFile } from './types';

/**
 * Parses raw on-chain registration data into a typed RegistrationFile.
 * The registration URI may point to IPFS, Arweave, or an HTTPS endpoint.
 */
export async function parseRegistry(
  registrationUri: string,
): Promise<RegistrationFile> {
  // TODO: resolve URI (ipfs://, ar://, https://) and parse JSON
  throw new Error(`parseRegistry not yet implemented for URI: ${registrationUri}`);
}
