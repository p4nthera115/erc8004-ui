import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// Public API for storefront viewer (accessed via App Proxy)
// This endpoint is called from the Theme App Extension
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const modelId = searchParams.get("modelId")
  const productId = searchParams.get("productId")
  const shop = searchParams.get("shop")

  if (!shop) {
    return NextResponse.json(
      { error: "Shop parameter required" },
      { status: 400 }
    )
  }

  try {
    let model

    if (modelId) {
      // Fetch specific model by ID
      model = await prisma.model3D.findUnique({
        where: { id: modelId },
        include: {
          store: {
            select: {
              shopDomain: true,
              viewerTheme: true,
              autoRotate: true,
              showControls: true,
              hdriPreset: true,
            },
          },
        },
      })
    } else if (productId) {
      // Fetch model by product ID
      const store = await prisma.store.findUnique({
        where: { shopDomain: shop },
      })

      if (store) {
        model = await prisma.model3D.findFirst({
          where: {
            storeId: store.id,
            productId: productId,
            status: "ACTIVE",
          },
          include: {
            store: {
              select: {
                shopDomain: true,
                viewerTheme: true,
                autoRotate: true,
                showControls: true,
                hdriPreset: true,
              },
            },
          },
        })
      }
    }

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    // Verify the model belongs to the requesting shop
    if (model.store.shopDomain !== shop) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Track view analytics
    await prisma.model3D.update({
      where: { id: model.id },
      data: {
        viewCount: { increment: 1 },
        lastViewed: new Date(),
      },
    })

    await prisma.store.update({
      where: { shopDomain: shop },
      data: {
        viewCount: { increment: 1 },
      },
    })

    // Record analytics event
    await prisma.analyticsEvent.create({
      data: {
        shopDomain: shop,
        modelId: model.id,
        productId: model.productId,
        eventType: "MODEL_VIEW",
      },
    })

    // Return model data for viewer
    return NextResponse.json({
      id: model.id,
      name: model.name,
      modelUrl: model.modelUrl,
      scale: model.scale,
      position: {
        x: model.positionX,
        y: model.positionY,
        z: model.positionZ,
      },
      rotation: {
        x: model.rotationX,
        y: model.rotationY,
        z: model.rotationZ,
      },
      environment: model.environmentPreset,
      exposure: model.exposure,
      hotspots: model.hotspots,
      settings: {
        theme: model.store.viewerTheme,
        autoRotate: model.store.autoRotate,
        showControls: model.store.showControls,
      },
    })
  } catch (error) {
    console.error("Error fetching viewer data:", error)
    return NextResponse.json(
      { error: "Failed to fetch viewer data" },
      { status: 500 }
    )
  }
}
