/**
 * Helper to compute attendance statistics and required classes to reach target.
 */
export function calculateAttendanceMetrics(
  attended: number,
  total: number,
  targetPercentage: number
) {
  if (total <= 0) {
    return {
      currentPercentage: 100,
      isTargetMet: true,
      classesNeeded: 0,
      classesCanMiss: 0,
    };
  }

  const currentPercentage = Math.round((attended / total) * 1000) / 10;
  const targetFraction = targetPercentage / 100;
  const isTargetMet = currentPercentage >= targetPercentage;

  if (isTargetMet) {
    // How many classes can the student miss while maintaining >= target:
    const maxTotal = Math.floor(attended / targetFraction);
    const classesCanMiss = Math.max(0, maxTotal - total);
    return {
      currentPercentage,
      isTargetMet: true,
      classesNeeded: 0,
      classesCanMiss,
    };
  } else {
    // How many consecutive classes needed:
    const needed = Math.ceil(
      (targetFraction * total - attended) / (1 - targetFraction)
    );
    return {
      currentPercentage,
      isTargetMet: false,
      classesNeeded: Math.max(1, needed),
      classesCanMiss: 0,
    };
  }
}
