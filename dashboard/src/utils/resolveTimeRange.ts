import dayjs from "dayjs";

const RANGE_TO_DAYS: Record<string, number> = {
  "Last hour": 1 / 24,
  "Last 24 hours": 1,
  Today: 1,
  Yesterday: 2,
  "Last 7 days": 7,
  "Last 30 days": 30,
  "This month": 31,
  Custom: 30,
};

export function resolveTimeRange(
  rangeLabel: string,
  custom?: { from: string; to: string }
){
  if (rangeLabel === "Custom" && custom?.from && custom?.to) {
    return {
      from: dayjs(custom.from).startOf("day").toISOString(),
      to: dayjs(custom.to).endOf("day").toISOString(),
    };
  }

  const days = RANGE_TO_DAYS[rangeLabel] ?? 7;
  const to = dayjs();
  const from = to.subtract(days, "day");

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}
