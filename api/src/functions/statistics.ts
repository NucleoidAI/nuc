import Agent from "../models/Agent";
import Supervising from "../models/Supervising";
import Task from "../models/Task";
import { Op, col, fn } from "sequelize";

async function taskDailyTrend({
  teamId,
  agentId,
  from,
  to,
}: {
  teamId: string;
  agentId?: string;
  from: string;
  to: string;
}) {
  const rows = await Task.findAll({
    attributes: [
      [fn("strftime", "%Y-%m-%d", col("Task.created_at")), "day"],
      "status",
      [fn("COUNT", col("Task.id")), "count"],
    ],
    include: [
      {
        model: Agent,
        attributes: [],
        where: agentId ? { id: agentId, teamId } : { teamId },
        required: true,
      },
    ],
    where: { createdAt: { [Op.between]: [from, to] } },
    group: ["day", "status"],
    raw: true,
  });

  return rows as unknown as Array<{
    day: string;
    status: "IN_PROGRESS" | "COMPLETED" | "FAILED";
    count: number;
  }>;
}

async function supervisingDailyCounts({
  teamId,
  agentId,
  from,
  to,
}: {
  teamId: string;
  agentId?: string;
  from: string;
  to: string;
}) {
  const rows = await Supervising.findAll({
    attributes: [
      [fn("strftime", "%Y-%m-%d", col("Supervising.created_at")), "day"],
      [fn("COUNT", col("Supervising.id")), "count"],
    ],
    include: [
      {
        model: Agent,
        attributes: [],
        where: agentId ? { id: agentId, teamId } : { teamId },
        required: true,
      },
    ],
    where: { createdAt: { [Op.between]: [from, to] } },
    group: ["day"],
    raw: true,
  });

  return rows as unknown as Array<{ day: string; count: number }>;
}

async function supervisingDailyRate({
  teamId,
  agentId,
  from,
  to,
}: {
  teamId: string;
  agentId?: string;
  from: string;
  to: string;
}) {
  const [supervisingCounts, taskCounts] = await Promise.all([
    supervisingDailyCounts({ teamId, agentId, from, to }),
    taskDailyTrend({ teamId, agentId, from, to }),
  ]);

  const tasksByDay = new Map<string, number>();
  for (const row of taskCounts) {
    tasksByDay.set(row.day, (tasksByDay.get(row.day) ?? 0) + row.count);
  }

  const supervisingsByDay = new Map(
    supervisingCounts.map((row) => [row.day, row.count])
  );

  const days = new Set([...tasksByDay.keys(), ...supervisingsByDay.keys()]);

  return Array.from(days)
    .sort()
    .map((day) => {
      const taskCount = tasksByDay.get(day) ?? 0;
      const supervisingCount = supervisingsByDay.get(day) ?? 0;
      return {
        day,
        rate: taskCount ? (supervisingCount / taskCount) * 100 : 0,
      };
    });
}

export default { taskDailyTrend, supervisingDailyCounts, supervisingDailyRate };
