import { Box } from "@mui/material";
import React from "react";

type BulletDescriptionProps = {
  description?: string | null;
  renderItem?: (text: string) => React.ReactNode;
};

const parseBullets = (description: string) =>
  description
    .split("\n")
    .map((line) => line.replace(/^\s*•\s*/, "").trim())
    .filter((line) => line.length > 0);

const BulletDescription = ({
  description,
  renderItem,
}: BulletDescriptionProps) => {
  if (!description) return null;

  const isBulletList = description.includes("•");
  const render = renderItem ?? ((text: string) => text);

  if (!isBulletList) {
    return <>{render(description)}</>;
  }

  const items = parseBullets(description);

  return (
    <Box
      component="ul"
      sx={{
        listStyleType: "disc",
        pl: 1.5,
        m: 0,
        "& li": { mb: 0.5 },
      }}
    >
      {items.map((item, index) => (
        <li key={index}>{render(item)}</li>
      ))}
    </Box>
  );
};

export default BulletDescription;
