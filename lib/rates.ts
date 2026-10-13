import { z } from "zod";

// A provider quote must also have a finite reciprocal before conversion to KRW.
const providerQuote = z.number().positive().refine((value) => Number.isFinite(1 / value));

export const erRatesSchema = z.object({
  rates: z.record(z.string(), providerQuote.optional().catch(undefined)),
});

export const frankfurterRatesSchema = erRatesSchema.extend({ date: z.iso.date() });

const koreaEximQuote = z.object({
  cur_unit: z.string().min(1),
  deal_bas_r: z.string()
    .regex(/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/)
    .transform((value) => Number(value.replaceAll(",", "")))
    .pipe(z.number().positive()),
  result: z.literal(1),
});

export const koreaEximRatesSchema = z.array(koreaEximQuote.optional().catch(undefined))
  .refine((items) => items.length === 0 || items.some((item) => item !== undefined), "No valid Korea Exim quotes")
  .transform((items) => items.filter((item) => item !== undefined));

const referenceQuote = z.object({ mid: z.number().positive(), source: z.string() });

export const ratesResponseSchema = z.object({
  date: z.iso.date().catch(""),
  rates: z.record(z.string(), referenceQuote.optional().catch(undefined)),
});

export type ExchangeRates = z.infer<typeof ratesResponseSchema>["rates"];
