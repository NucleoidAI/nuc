import { alpha } from "@mui/material/styles";

const agentGradients = [
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (theme) =>
    `linear-gradient(
      135deg,
      ${alpha("#ff6fb1", 0.85)},
      ${alpha("#ffb36b", 0.9)}
    )`,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (theme) =>
    `linear-gradient(
      135deg,
      ${alpha("#7b5cff", 0.85)},
      ${alpha("#3cefff", 0.9)}
    )`,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (theme) =>
    `linear-gradient(
      135deg,
      ${alpha("#a076f9", 0.85)},
      ${alpha("#f187ed", 0.9)}
    )`,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (theme) =>
    `linear-gradient(
      135deg,
      ${alpha("#3b82f6", 0.85)},
      ${alpha("#34f5c5", 0.9)}
    )`,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (theme) =>
    `linear-gradient(
      135deg,
      ${alpha("#facc15", 0.9)},
      ${alpha("#4ade80", 0.85)}
    )`,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (theme) =>
    `linear-gradient(
      135deg,
      ${alpha("#ff6f61", 0.9)},
      ${alpha("#845ef7", 0.85)}
    )`,
];

const hashString = (value?: string) => {
  let hash = 0;
  if (!value) return hash;

  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return hash;
};

export const getAgentGradients = (id: string, theme) => {
  const hash = Math.abs(hashString(id));
  const index = hash % agentGradients.length;
  return agentGradients[index](theme);
};
