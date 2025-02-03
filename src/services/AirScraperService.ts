import axios from "axios";
import { z } from "zod";
import type {
  AirportResponse,
  FlightResponse,
  NearbyAirportsResponse,
  NearbyAirportsResult,
  SearchFlightOptions,
} from "../types";
import type { APIResponse } from "../types/APIResponseType";
import { CabinClass } from "../types/CabinClassType";

const clientV1 = axios.create({
  baseURL: process.env.NEXT_PUBLIC_RapidAPI_BaseURL,
  headers: {
    "x-rapidapi-host": process.env.NEXT_PUBLIC_RapidAPI_HOST,
    "x-rapidapi-key": process.env.NEXT_PUBLIC_RapidAPI_KEY,
  },
});

const formatDate = (date?: Date) => date?.toISOString().slice(0, 10);

const searchFlightsParamsSchema = z.object({
  originSkyId: z.string(),
  destinationSkyId: z.string(),
  originEntityId: z.preprocess(Number, z.number().int()),
  destinationEntityId: z.preprocess(Number, z.number().int()),
  date: z.coerce.date().transform(formatDate),
  returnDate: z.coerce.date().optional().transform(formatDate),
  cabinClass: z.nativeEnum(CabinClass).default(CabinClass.Economy),
  adults: z.number().int().min(1).default(1),
  children: z.number().int().optional(),
  infants: z.number().int().optional(),
});

export async function searchFlights({ origin, destination, ...options }: SearchFlightOptions) {
  const params = searchFlightsParamsSchema.parse({
    ...options,
    originSkyId: origin?.skyId,
    originEntityId: origin?.entityId,
    destinationSkyId: destination?.skyId,
    destinationEntityId: destination?.entityId,
  });

  const { data } = await clientV1.get<FlightResponse>("/searchFlights", { params });

  return data.data;
}

export async function searchAirport(query: string) {
  if (!query.trim()) return [];
  const params = { query };
  const cache = new APIResponseCache<AirportResponse>(query);
  const getter = () => clientV1.get<AirportResponse>("/searchAirport", { params });

  const { data } = cache.response || (await getter());
  cache.store(data);
  return data.data;
}

export async function getNearbyAirports({
  latitude,
  longitude,
}: GeolocationCoordinates): Promise<NearbyAirportsResult> {
  const params = { lng: longitude, lat: latitude };
  const cacheKey = [longitude.toFixed(2), latitude.toFixed(2)].join(","); // ~1km proximity
  const cache = new APIResponseCache<NearbyAirportsResponse>(cacheKey);

  const getter = () => clientV1.get<NearbyAirportsResponse>("/getNearByAirports", { params });
  const { data } = cache.response || (await getter());
  cache.store(data);
  return data.data;
}

class APIResponseCache<T extends APIResponse<unknown>> {
  protected prefix = "sky-scrapper:";

  constructor(private readonly cacheKey: string) {
    this.cacheKey = `${this.prefix}${cacheKey}`;
  }

  get response() {
    const cachedData = window.localStorage.getItem(this.cacheKey);

    if (!cachedData) return null;

    return { data: JSON.parse(cachedData) as T };
  }

  store(data: T) {
    if (data.status) {
      window.localStorage.setItem(this.cacheKey, JSON.stringify(data));
    }
  }

  clear() {
    for (const key of Object.keys({ ...window.localStorage })) {
      if (key.startsWith(this.prefix)) {
        window.localStorage.removeItem(key);
      }
    }
  }
}