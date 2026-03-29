import type { RegistrationFile } from '../types';

export interface IdentityFetchParams {
  agentRegistry: string;
  agentId: number;
}

/**
 * Fetches on-chain identity data for an agent and resolves its registration file.
 */
export async function fetchIdentity(
  _params: IdentityFetchParams,
): Promise<RegistrationFile> {
  // TODO: call agentRegistry contract → registrationURI → parseRegistry
  throw new Error('fetchIdentity not yet implemented');
}
