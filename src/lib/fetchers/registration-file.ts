import type { RegistrationFile } from '../types';

/**
 * Resolves a tokenURI (IPFS, HTTPS, or base64 data URI) and returns the parsed registration file.
 */
export async function fetchRegistrationFile(_tokenURI: string): Promise<RegistrationFile> {
  // TODO: handle ipfs://, https://, and data: URIs
  throw new Error('fetchRegistrationFile not yet implemented');
}
