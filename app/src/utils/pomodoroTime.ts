export const sanitizePausedSeconds = (value: unknown): number => {
  if (typeof value === 'number' && isFinite(value) && !isNaN(value)) {
    return value;
  }
  return 0;
};

interface ComputeTimeLeftParams {
  startedAt: Date | number;
  durationMinutes: number;
  totalPausedSeconds?: number;
  now?: number;
  isRunning?: boolean;
  pausedAt?: Date | number | null;
}

export const computeTimeLeftSeconds = ({
  startedAt,
  durationMinutes,
  totalPausedSeconds = 0,
  now = Date.now(),
  isRunning = true,
  pausedAt,
}: ComputeTimeLeftParams): number => {
  const startedMs = startedAt instanceof Date ? startedAt.getTime() : startedAt;
  const pausedMs = pausedAt instanceof Date ? pausedAt.getTime() : pausedAt ?? null;
  const effectiveNow = !isRunning && pausedMs ? pausedMs : now;
  const elapsedSeconds = (effectiveNow - startedMs) / 1000;
  const safePausedSeconds = sanitizePausedSeconds(totalPausedSeconds);
  const adjustedElapsedSeconds = elapsedSeconds - safePausedSeconds;
  const rawTimeLeft = durationMinutes * 60 - adjustedElapsedSeconds;

  if (rawTimeLeft > 0) {
    return isRunning ? Math.ceil(rawTimeLeft) : Math.round(rawTimeLeft);
  }

  if (rawTimeLeft < 0) {
    return Math.floor(rawTimeLeft);
  }

  return 0;
};

