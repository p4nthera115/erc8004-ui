import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Schema validation for model creation
const createModelSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  modelUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  scale: z.number().min(0.01).max(100).default(1),
  environmentPreset: z.string().default("studio"),
  exposure: z.number().min(0).max(5).default(1),
})

// GET - List models for a store
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get("shop")

  if (!shop) {
    return NextResponse.json(
      { error: "Shop parameter required" },
      { status: 400 }
    )
  }

  try {
    const store = await prisma.store.findUnique({
      where: { shopDomain: shop },
      include: {
        models: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    return NextResponse.json({
      models: store.models,
      count: store.models.length,
    })
  } catch (error) {
    console.error("Error fetching models:", error)
    return NextResponse.json(
      { error: "Failed to fetch models" },
      { status: 500 }
    )
  }
}

// POST - Create a new model
export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get("shop")

  if (!shop) {
    return NextResponse.json(
      { error: "Shop parameter required" },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const validatedData = createModelSchema.parse(body)

    const store = await prisma.store.findUnique({
      where: { shopDomain: shop },
    })

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 })
    }

    const model = await prisma.model3D.create({
      data: {
        storeId: store.id,
        name: validatedData.name,
        description: validatedData.description,
        modelUrl: validatedData.modelUrl,
        thumbnailUrl: validatedData.thumbnailUrl,
        productId: validatedData.productId,
        variantId: validatedData.variantId,
        scale: validatedData.scale,
        environmentPreset: validatedData.environmentPreset,
        exposure: validatedData.exposure,
        status: "ACTIVE",
      },
    })

    // Update model count
    await prisma.store.update({
      where: { id: store.id },
      data: { modelCount: { increment: 1 } },
    })

    return NextResponse.json({ model }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating model:", error)
    return NextResponse.json(
      { error: "Failed to create model" },
      { status: 500 }
    )
  }
}
