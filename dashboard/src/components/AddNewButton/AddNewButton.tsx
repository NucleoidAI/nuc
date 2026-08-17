import AddCircleIcon from "@mui/icons-material/AddCircle";
import Stack from "@mui/material/Stack";
import styles from "./styles";

import { Card, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";

function AddNewButton({ type, addNew, onClickFunction }) {
  const [size, setSize] = useState({
    width: "",
    height: "",
    borderRadius: "",
  });

  useEffect(() => {
    switch (type) {
      case "largeButton":
        setSize({ ...styles.largeButton });

        break;
      case "wideButton":
        setSize({ ...styles.wideButton });
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Card
        data-cy="add-new-button"
        onClick={onClickFunction}
        sx={{
          ...styles.default,
          width: size.width,
          height: size.height,
          borderRadius: size.borderRadius,
          transformStyle: "preserve-3d",
          transform:
            "perspective(1500px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
          boxShadow: `
            1px 1px 0 #161c24,
            2px 2px 0 #161c24,
            3px 3px 0 #161c24,
            4px 4px 0 #161c24,
            5px 5px 0 #161c24,
            6px 6px 0 #161c24,
            7px 7px 0 #161c24,
            10px 10px 20px rgba(0, 0, 0, 0.4),
            20px 20px 40px rgba(0, 0, 0, 0.5)
          `,
          transition:
            "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.4s ease, filter 0.25s ease",
          "&:hover": {
            transform:
              "perspective(1500px) rotateX(0deg) rotateY(-10deg) rotateZ(0deg)",
            filter: "brightness(1.070)",
            boxShadow: `
            1px 1px 0 #161c24,
            2px 2px 0 #161c24,
            3px 3px 0 #161c24,
            4px 4px 0 #161c24,
            5px 5px 0 #161c24,
            6px 6px 0 #161c24,
            7px 7px 0 #161c24,
            10px 10px 20px rgba(0, 0, 0, 0.4),
            20px 20px 40px rgba(0, 0, 0, 0.5)
          `,
          },
        }}
      >
        <Stack direction="column" alignItems="center">
          <AddCircleIcon fontSize="large" />
          <Typography color={"inherit"} variant="subtitle1" margin={0.5}>
            Add New {addNew}
          </Typography>
        </Stack>
      </Card>
    </>
  );
}

export default AddNewButton;
