import "server-only";
import { isDemo } from "@/server/env";
import { memoryRepository } from "./memory";
import type { BookingRepository } from "./repository";
import { supabaseRepository } from "./supabase";

/** Choix automatique : Supabase si configuré, sinon MODE DÉMO. */
export const db: BookingRepository = isDemo ? memoryRepository : supabaseRepository;
