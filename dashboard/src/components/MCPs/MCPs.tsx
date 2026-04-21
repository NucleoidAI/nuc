import { Grid } from "@mui/material";
import React from "react";
import Skills from "../Skills/Skills";

const MCPs = ({ key, title, description, icon, onSkillClick, id, oauth }) => {
  return (
    <Grid
      key={key}
      size={{
        xs: 12,
        sm: 6,
        md: 3,
      }}
    >
      <Skills
        title={title}
        description={description}
        icon={icon}
        onSkillClick={onSkillClick}
        id={id}
        oauth={oauth}
      />
    </Grid>
  );
};

export default MCPs;
