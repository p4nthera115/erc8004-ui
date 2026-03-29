import "@shopify/shopify-api/adapters/node"
import { shopifyApi, LATEST_API_VERSION, Session } from "@shopify/shopify-api"
import prisma from "./prisma"

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY!,
  apiSecretKey: process.env.SHOPIFY_API_SECRET!,
  scopes: (process.env.SHOPIFY_SCOPES || "").split(","),
  hostName: (process.env.NEXT_PUBLIC_APP_URL || "").replace(/^https?:\/\//, ""),
  apiVersion: LATEST_API_VERSION,
  isEmbeddedApp: true,
  // Use offline access tokens for background jobs
  isCustomStoreApp: false,
})

export default shopify

// Session storage using Prisma
export const sessionStorage = {
  async storeSession(session: Session): Promise<boolean> {
    try {
      await prisma.session.upsert({
        where: { id: session.id },
        update: {
          shop: session.shop,
          state: session.state || "",
          isOnline: session.isOnline,
          scope: session.scope,
          expires: session.expires,
          accessToken: session.accessToken || "",
          userId: session.onlineAccessInfo?.associated_user?.id
            ? BigInt(session.onlineAccessInfo.associated_user.id)
            : null,
          firstName: session.onlineAccessInfo?.associated_user?.first_name,
          lastName: session.onlineAccessInfo?.associated_user?.last_name,
          email: session.onlineAccessInfo?.associated_user?.email,
          accountOwner:
            session.onlineAccessInfo?.associated_user?.account_owner,
          locale: session.onlineAccessInfo?.associated_user?.locale,
          collaborator: session.onlineAccessInfo?.associated_user?.collaborator,
          emailVerified:
            session.onlineAccessInfo?.associated_user?.email_verified,
        },
        create: {
          id: session.id,
          shop: session.shop,
          state: session.state || "",
          isOnline: session.isOnline,
          scope: session.scope,
          expires: session.expires,
          accessToken: session.accessToken || "",
          userId: session.onlineAccessInfo?.associated_user?.id
            ? BigInt(session.onlineAccessInfo.associated_user.id)
            : null,
          firstName: session.onlineAccessInfo?.associated_user?.first_name,
          lastName: session.onlineAccessInfo?.associated_user?.last_name,
          email: session.onlineAccessInfo?.associated_user?.email,
          accountOwner:
            session.onlineAccessInfo?.associated_user?.account_owner,
          locale: session.onlineAccessInfo?.associated_user?.locale,
          collaborator: session.onlineAccessInfo?.associated_user?.collaborator,
          emailVerified:
            session.onlineAccessInfo?.associated_user?.email_verified,
        },
      })
      return true
    } catch (error) {
      console.error("Error storing session:", error)
      return false
    }
  },

  async loadSession(id: string): Promise<Session | undefined> {
    try {
      const sessionData = await prisma.session.findUnique({
        where: { id },
      })

      if (!sessionData) return undefined

      const session = new Session({
        id: sessionData.id,
        shop: sessionData.shop,
        state: sessionData.state,
        isOnline: sessionData.isOnline,
        scope: sessionData.scope || undefined,
        expires: sessionData.expires || undefined,
        accessToken: sessionData.accessToken,
      })

      return session
    } catch (error) {
      console.error("Error loading session:", error)
      return undefined
    }
  },

  async deleteSession(id: string): Promise<boolean> {
    try {
      await prisma.session.delete({
        where: { id },
      })
      return true
    } catch (error) {
      console.error("Error deleting session:", error)
      return false
    }
  },

  async deleteSessions(ids: string[]): Promise<boolean> {
    try {
      await prisma.session.deleteMany({
        where: { id: { in: ids } },
      })
      return true
    } catch (error) {
      console.error("Error deleting sessions:", error)
      return false
    }
  },

  async findSessionsByShop(shop: string): Promise<Session[]> {
    try {
      const sessions = await prisma.session.findMany({
        where: { shop },
      })

      return sessions.map(
        (sessionData) =>
          new Session({
            id: sessionData.id,
            shop: sessionData.shop,
            state: sessionData.state,
            isOnline: sessionData.isOnline,
            scope: sessionData.scope || undefined,
            expires: sessionData.expires || undefined,
            accessToken: sessionData.accessToken,
          })
      )
    } catch (error) {
      console.error("Error finding sessions:", error)
      return []
    }
  },
}

// Get offline session for a shop (for background API calls)
export async function getOfflineSession(shop: string): Promise<Session | null> {
  const offlineSessionId = shopify.session.getOfflineId(shop)
  const session = await sessionStorage.loadSession(offlineSessionId)
  return session || null
}

// Create Admin API client for a shop
export async function getShopifyAdminClient(shop: string) {
  const session = await getOfflineSession(shop)
  if (!session) {
    throw new Error(`No session found for shop: ${shop}`)
  }

  return new shopify.clients.Rest({
    session,
  })
}

// Create GraphQL Admin API client
export async function getShopifyGraphQLClient(shop: string) {
  const session = await getOfflineSession(shop)
  if (!session) {
    throw new Error(`No session found for shop: ${shop}`)
  }

  return new shopify.clients.Graphql({
    session,
  })
}
