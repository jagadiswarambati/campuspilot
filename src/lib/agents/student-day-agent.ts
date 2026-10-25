import { TimetableClass, DayOfWeek } from "../../types";

export interface NextClassResult {
  nextClass: TimetableClass;
  minutesUntilStart: number;
  currentDay: DayOfWeek;
  currentTimeStr: string;
}

/**
 * Convert "HH:mm" 24h string to total minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to "HH:mm".
 */
export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.max(0, totalMinutes % 1440);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Determine the day of the week from Date object.
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const days: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[date.getDay()];
}

/**
 * Calculate available break duration in minutes between two "HH:mm" time strings.
 */
export function calculateBreakDuration(
  startTimeStr: string,
  endTimeStr: string
): number {
  const startMin = timeStringToMinutes(startTimeStr);
  const endMin = timeStringToMinutes(endTimeStr);
  return Math.max(0, endMin - startMin);
}

/**
 * Find the upcoming class and calculate break time.
 * If referenceTime is provided (e.g. "12:00" on "Monday" for the 35 min break demo),
 * it uses that exact anchor. Otherwise, uses system clock.
 */
export function findNextClass(
  timetable: TimetableClass[],
  referenceTime?: string,
  referenceDay?: DayOfWeek
): NextClassResult | null {
  const now = new Date();
  const currentDay = referenceDay || getDayOfWeek(now);
  const currentTimeStr =
    referenceTime ||
    `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

  const currentMinutes = timeStringToMinutes(currentTimeStr);

  // Filter classes on the same day
  const todayClasses = timetable
    .filter((c) => c.dayOfWeek === currentDay)
    .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  // Find the earliest class whose startTime > currentTime
  const upcomingToday = todayClasses.find(
    (c) => timeStringToMinutes(c.startTime) > currentMinutes
  );

  if (upcomingToday) {
    const minutesUntilStart =
      timeStringToMinutes(upcomingToday.startTime) - currentMinutes;
    return {
      nextClass: upcomingToday,
      minutesUntilStart,
      currentDay,
      currentTimeStr,
    };
  }

  // If no more classes today, look for the next day's first class or return null
  return null;
}
