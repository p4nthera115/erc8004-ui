import { NextRequest, NextResponse } from "next/server"
import shopify from "@/lib/shopify"
import { isValidShopDomain } from "@/lib/utils"

// Begin OAuth flow
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get("shop")

  if (!shop || !isValidShopDomain(shop)) {
    return NextResponse.json(
      { error: "Invalid shop parameter" },
      { status: 400 }
    )
  }

  try {
    // Generate auth URL for offline access
    const authUrl = await shopify.auth.begin({
      shop,
      callbackPath: "/api/auth/callback",
      isOnline: false, // Use offline tokens for background jobs
    })

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("Auth begin error:", error)
    return NextResponse.json(
      { error: "Failed to begin authentication" },
      { status: 500 }
    )
  }
}
