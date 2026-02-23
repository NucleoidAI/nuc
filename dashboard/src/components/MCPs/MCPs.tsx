import { Grid } from "@mui/material";
import React from "react";
import Skills from "../Skills/Skills";

const MCPs = ({ key, title, description, icon, onSkillClick, id, oauth }) => {
  return (
    <Grid item xs={12} sm={6} md={3} key={key}>
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
