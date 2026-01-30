import React from "react";
import styles from "./styles";

import { Container, Typography } from "@mui/material";

function InfoText({ agent }) {
  return (
    <Container sx={styles.container}>
      <Typography variant="h6" sx={styles.name}>
        {agent?.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={styles.mail}>
        {agent?.email}
      </Typography>
      <Typography variant="body2" color="secondary.main">
        {agent?.phone}
      </Typography>
    </Container>
  );
}

export default InfoText;
