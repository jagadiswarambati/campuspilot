import { TimetableClass } from "../../types";
import { timeStringToMinutes } from "../agents/student-day-agent";

export interface OverlapValidationResult {
  hasOverlap: boolean;
  conflictingClass?: TimetableClass;
  message?: string;
}

/**
 * Validates whether a new or updated class overlaps with existing classes on the same day.
 */
export function validateTimetableOverlap(
  existingClasses: TimetableClass[],
  candidateClass: {
    id?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }
): OverlapValidationResult {
  const candidateStart = timeStringToMinutes(candidateClass.startTime);
  const candidateEnd = timeStringToMinutes(candidateClass.endTime);

  if (candidateStart >= candidateEnd) {
    return {
      hasOverlap: true,
      message: `Invalid class time: Start time (${candidateClass.startTime}) must be strictly before end time (${candidateClass.endTime}).`,
    };
  }

  for (const existing of existingClasses) {
    // Ignore the class itself if updating an existing entry
    if (candidateClass.id && existing.id === candidateClass.id) {
      continue;
    }

    if (existing.dayOfWeek === candidateClass.dayOfWeek) {
      const existingStart = timeStringToMinutes(existing.startTime);
      const existingEnd = timeStringToMinutes(existing.endTime);

      // Check time overlap: (start1 < end2) && (end1 > start2)
      if (candidateStart < existingEnd && candidateEnd > existingStart) {
        return {
          hasOverlap: true,
          conflictingClass: existing,
          message: `Overlap detected: Class conflicts with ${existing.subjectCode} (${existing.subjectName}) scheduled from ${existing.startTime} to ${existing.endTime} on ${existing.dayOfWeek}.`,
        };
      }
    }
  }

  return {
    hasOverlap: false,
  };
}
