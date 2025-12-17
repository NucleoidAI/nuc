import { Iconify } from "@canmingir/link/platform/components";
import { useNavigate } from "react-router-dom";

import { IconButton, Tooltip } from "@mui/material";
import React, { useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";

const TalkToCAIO = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    setOpen(!open);
    navigate("/chat");
  };

  const theme = useTheme();

  return (
    <Tooltip title={"Talk To CAIO"}>
      <IconButton
        data-cy="talk-button"
        sx={{
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.secondary.light,
            0.2
          )}, ${alpha(theme.palette.primary.main, 0.5)})`,
          color: (theme) => theme.palette.text.primary,
        }}
        onClick={handleClick}
      >
        <Iconify icon={"mdi:talk"} width={28} />
      </IconButton>
    </Tooltip>
  );
};

export default TalkToCAIO;
