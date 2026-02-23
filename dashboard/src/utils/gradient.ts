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
    ${alpha("#ff6f61", 0.85)},
    ${alpha("#845ef7", 0.9)}
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
      ${alpha("#f472b6", 0.85)} 0%,
      ${alpha("#a78bfa", 0.85)} 50%,
      ${alpha("#38bdf8", 0.9)} 100%
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

export const getAgentGradients = (id: string, theme, allIds?: string[]) => {
  const len = agentGradients.length;

  if (allIds && allIds.length > 0) {
    const index = allIds.indexOf(id);
    if (index >= 0) {
      return agentGradients[index % len](theme);
    }
    const hash = Math.abs(hashString(id));
    return agentGradients[hash % len](theme);
  }

  const hash = Math.abs(hashString(id));
  const index = hash % len;
  return agentGradients[index](theme);
};
