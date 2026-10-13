import { z } from "zod";
import { cityById } from "../data/cities.ts";

const recentCitiesSchema = z.array(z.string().catch(""));

export function readRecentCities(serialized: string): string[] {
  try {
    const cities = recentCitiesSchema.parse(JSON.parse(serialized));

    return [...new Set(cities.filter((id) => Boolean(cityById(id))))].slice(0, 5);
  } catch {
    return [];
  }
}
