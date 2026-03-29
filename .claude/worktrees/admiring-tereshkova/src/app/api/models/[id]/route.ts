import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { z } from "zod"

// Schema validation for model updates
const updateModelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  modelUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  productId: z.string().optional(),
  variantId: z.string().optional(),
  scale: z.number().min(0.01).max(100).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  positionZ: z.number().optional(),
  rotationX: z.number().optional(),
  rotationY: z.number().optional(),
  rotationZ: z.number().optional(),
  environmentPreset: z.string().optional(),
  exposure: z.number().min(0).max(5).optional(),
  hotspots: z.array(z.any()).optional(),
  status: z.enum(["DRAFT", "PROCESSING", "ACTIVE", "ARCHIVED"]).optional(),
})

// GET - Get a specific model
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params

  try {
    const model = await prisma.model3D.findUnique({
      where: { id },
      include: {
        store: {
          select: {
            shopDomain: true,
            viewerTheme: true,
          },
        },
      },
    })

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    // Increment view count
    await prisma.model3D.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
        lastViewed: new Date(),
      },
    })

    return NextResponse.json({ model })
  } catch (error) {
    console.error("Error fetching model:", error)
    return NextResponse.json(
      { error: "Failed to fetch model" },
      { status: 500 }
    )
  }
}

// PATCH - Update a model
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
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
    const validatedData = updateModelSchema.parse(body)

    // Verify ownership
    const existingModel = await prisma.model3D.findUnique({
      where: { id },
      include: { store: true },
    })

    if (!existingModel) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    if (existingModel.store.shopDomain !== shop) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const model = await prisma.model3D.update({
      where: { id },
      data: validatedData,
    })

    return NextResponse.json({ model })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating model:", error)
    return NextResponse.json(
      { error: "Failed to update model" },
      { status: 500 }
    )
  }
}

// DELETE - Delete a model
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const searchParams = request.nextUrl.searchParams
  const shop = searchParams.get("shop")

  if (!shop) {
    return NextResponse.json(
      { error: "Shop parameter required" },
      { status: 400 }
    )
  }

  try {
    // Verify ownership
    const existingModel = await prisma.model3D.findUnique({
      where: { id },
      include: { store: true },
    })

    if (!existingModel) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    if (existingModel.store.shopDomain !== shop) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.model3D.delete({
      where: { id },
    })

    // Decrement model count
    await prisma.store.update({
      where: { id: existingModel.storeId },
      data: { modelCount: { decrement: 1 } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting model:", error)
    return NextResponse.json(
      { error: "Failed to delete model" },
      { status: 500 }
    )
  }
}
