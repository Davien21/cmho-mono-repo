import { Request, Response } from "express";
import inventoryBalancesService from "./inventory-balances.service";
import { geminiService } from "../../services/gemini.service";
import { successResponse } from "../../utils/response";
import { BadRequestError } from "../../config/errors";

export async function processInventoryBalance(req: Request, res: Response) {
  const { imageUrl, media_id } = req.body;

  if (!imageUrl) {
    throw new BadRequestError("imageUrl is required");
  }

  if (!media_id) {
    throw new BadRequestError("media_id is required");
  }

  // AI Transcription using the existing Cloudinary URL (no DB call needed)
  try {
    const aiResult = await geminiService.transcribeImage(imageUrl);

    // Save individual items
    const savedItems = await inventoryBalancesService.createMany({
      media_id,
      imageUrl,
      items: aiResult.inventory,
    });

    // Return the data in the expected format for the frontend
    const responseData = {
      media: {
        id: media_id,
        url: imageUrl,
      },
      items: savedItems,
    };

    res.send(successResponse("Inventory balance processed successfully", responseData));
  } catch (error: any) {
    // If AI fails, we still have the media. We could return the media info so user can retry or manually enter
    console.error("[ProcessInventoryBalance] AI Error:", error);
    res.status(500).send({
      success: false,
      message: "AI transcription failed. Please try again or enter manually.",
    });
  }
}

export async function getStagedItems(_req: Request, res: Response) {
  const result = await inventoryBalancesService.list();
  res.send(successResponse("Staged items fetched successfully", result));
}

export async function deleteStagedItem(req: Request, res: Response) {
  const { id } = req.params;
  await inventoryBalancesService.delete(id);
  res.send(successResponse("Staged item deleted successfully"));
}
