"use server";

import { addMonths } from "@/lib/time";
import { schedule } from "@/config/site";
import { createBooking, getDayAvailability, getMonthAvailability } from "@/server/bookings";

const firstMonth = schedule.firstDay.slice(0, 7);
const lastMonth = addMonths(firstMonth, schedule.monthsAhead - 1);

export async function fetchMonth(monthKey: string) {
  if (!/^\d{4}-\d{2}$/.test(monthKey) || monthKey < firstMonth || monthKey > lastMonth) {
    return { days: {}, packRemaining: null };
  }
  return getMonthAvailability(monthKey);
}

export async function fetchDay(dateKey: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return { slots: {}, packRemaining: null };
  return getDayAvailability(dateKey);
}

export async function submitBooking(input: unknown) {
  return createBooking(input);
}
