import { PrintShop, PrintEstimateResult } from "../../types";

export interface CalculatePrintOptions {
  shop: PrintShop;
  pageCount: number;
  copies?: number;
  isColor?: boolean;
  isDoubleSided?: boolean;
  paperSize?: "A4" | "A3";
}

/**
 * Deterministic pricing and duration calculation for printing.
 * AI models are strictly prohibited from inventing prices, queue times, or printing speeds.
 */
export function calculatePrintEstimate(
  options: CalculatePrintOptions
): PrintEstimateResult {
  const {
    shop,
    pageCount,
    copies = 1,
    isColor = false,
    isDoubleSided = true,
  } = options;

  if (pageCount <= 0 || copies <= 0) {
    throw new Error("Page count and copies must be positive numbers");
  }

  const totalPages = pageCount * copies;

  // Determine unit price per page based on color and duplex settings
  let unitPricePerPage: number;
  if (isColor) {
    unitPricePerPage = isDoubleSided
      ? shop.colorDoublePrice
      : shop.colorSinglePrice;
  } else {
    unitPricePerPage = isDoubleSided
      ? shop.bwDoublePrice
      : shop.bwSinglePrice;
  }

  // Cost calculation: rounded to 2 decimal places
  const totalCost = Math.round(totalPages * unitPricePerPage * 100) / 100;

  // Duration calculation:
  // 1. Queue wait duration based on existing queue in shop:
  // queueWaitMinutes = Math.ceil((currentQueuePages / 100) * queueWaitMinutesPer100Pages)
  const queueMinutes = Math.max(
    1,
    Math.ceil(
      (shop.currentQueuePages / 100) * shop.queueWaitMinutesPer100Pages
    )
  );

  // 2. Active print duration based on shop pages-per-minute speed
  const printSpeed = shop.pagesPerMinute > 0 ? shop.pagesPerMinute : 20;
  const printMinutes = Math.max(1, Math.ceil(totalPages / printSpeed));

  // Total duration to complete print job at the shop
  const totalDurationMinutes = queueMinutes + printMinutes;

  return {
    shopId: shop.id,
    shopName: shop.name,
    pageCount,
    copies,
    totalPages,
    isColor,
    isDoubleSided,
    unitPricePerPage,
    totalCost,
    queueMinutes,
    printMinutes,
    totalDurationMinutes,
  };
}
