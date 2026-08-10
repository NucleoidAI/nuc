import { Grid } from "@mui/material";
import React from "react";
import Skills from "../Skills/Skills";

const MCPs = ({
  key,
  title,
  description,
  icon,
  onSkillClick,
  id,
  oauth,
  action,
  size = { xs: 12, sm: 6, md: 4, lg: 3 },
}) => {
  return (
    <Grid key={key} size={size}>
      <Skills
        title={title}
        description={description}
        icon={icon}
        onSkillClick={onSkillClick}
        id={id}
        oauth={oauth}
        action={action}
      />
    </Grid>
  );
};

export default MCPs;
