import { NextRequest, NextResponse } from "next/server"
import shopify, { sessionStorage } from "@/lib/shopify"
import prisma from "@/lib/prisma"

// OAuth callback handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  try {
    // Complete OAuth and get session
    const callback = await shopify.auth.callback({
      rawRequest: request,
    })

    const session = callback.session

    // Store session in database
    await sessionStorage.storeSession(session)

    // Create or update store record
    await prisma.store.upsert({
      where: { shopDomain: session.shop },
      update: {
        accessToken: session.accessToken || "",
        updatedAt: new Date(),
      },
      create: {
        shopDomain: session.shop,
        accessToken: session.accessToken || "",
      },
    })

    // Redirect to app
    const host = searchParams.get("host") || ""
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""

    // For embedded apps, redirect to the embedded URL
    const redirectUrl = `${appUrl}/app?shop=${session.shop}&host=${host}`

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("Auth callback error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
