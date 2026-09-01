import AIEngineIcon from "./AIEngineIcon";
import { Image } from "@canmingir/link/platform/components";
import { ReactNode } from "react";
import { getBackgroundUrl } from "../../utils/background";

import { Avatar, Box, Card, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

function AIMarketplaceItem({
  engine,
  isWizardEngine,
  handleEngineSelect,
  isSelected,
}: {
  engine: {
    id: string;
    vendor: string;
    model: string;
    price: number;
    type: string;
    avatar?: string;
  };
  isWizardEngine?: boolean;
  handleEngineSelect?: (engine) => void;
  isSelected?: boolean;
}) {
  const theme = useTheme();

  const icon = <AIEngineIcon vendor={engine?.vendor} />;

  return (
    <Box
      onClick={() =>
        isWizardEngine && handleEngineSelect && handleEngineSelect(engine)
      }
      sx={{
        cursor: "pointer",
        width: "100%",
        height: "100%",
        "&:hover": {
          opacity: 0.9,
          transition: "opacity 0.3s ease-in-out",
        },
      }}
    >
      <Card
        data-cy="ai-marketplace-item"
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: isWizardEngine ? "row" : { xs: "column", sm: "row" },
          width: "100%",
          overflow: "hidden",
          ...(isWizardEngine
            ? { height: 120 }
            : { height: "100%", minHeight: { sm: 180 } }),
          ...(isWizardEngine && {
            border: "solid",
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected ? "primary.main" : "divider",
          }),
          "&:hover": {
            boxShadow: isWizardEngine ? 6 : 4,
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            flexShrink: 0,
            display: "flex",
            ...(isWizardEngine
              ? { width: 68, height: "100%" }
              : {
                  width: { xs: "100%", sm: 120 },
                  height: "auto",
                  minHeight: { xs: 140, sm: "100%" },
                }),
          }}
        >
          <Image
            src={getBackgroundUrl(engine?.id)}
            alt={engine?.vendor}
            ratio={theme.breakpoints.up("sm") ? "1/1" : "16/9"}
            sx={{
              width: "100%",
              height: "100%",
              display: "block",
              objectFit: "cover",
              minHeight: "100%",
            }}
            overlay={alpha(theme.palette.grey[900], 0.48)}
          />

          {engine?.avatar ? (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: isWizardEngine ? 36 : 48,
                height: isWizardEngine ? 36 : 48,
                borderRadius: "50%",
                border: `2px solid ${theme.palette.common.white}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              {icon}
            </Box>
          ) : (
            <Avatar
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                width: 32,
                height: 32,
                zIndex: 10,
              }}
            />
          )}
        </Box>

        <Stack
          direction={"column"}
          sx={{
            p: isWizardEngine ? 1.25 : 2,
            width: "100%",
            textAlign: "left",
            justifyContent: "center",
            ...(isWizardEngine && {
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              overflow: "hidden",
            }),
          }}
          spacing={isWizardEngine ? 1 : 2}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 1,
              width: "100%",
              alignItems: "stretch",
            }}
          >
            <InfoBox
              label="Vendor"
              icon={icon}
              value={engine?.vendor}
              dense={isWizardEngine}
            />
            <InfoBox
              label="Model"
              value={engine?.model}
              dense={isWizardEngine}
            />
            <InfoBox label="Type" value={engine?.type} dense={isWizardEngine} />
            <InfoBox
              label="Price"
              value={engine?.price}
              dense={isWizardEngine}
            />
          </Box>
        </Stack>
      </Card>
    </Box>
  );
}

function InfoBox({
  label,
  icon,
  value,
  dense = false,
}: {
  label: string;
  icon?: ReactNode;
  value: string | number;
  dense?: boolean;
}) {
  return (
    <Stack
      direction="column"
      justifyContent="center"
      alignItems="center"
      sx={{
        py: 0.5,
        px: 0.5,
        borderRadius: 1,
        border: "1px dashed",
        borderColor: "text.disabled",
        width: "100%",
        minWidth: 0,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="center"
        spacing={0.5}
        sx={{ mb: dense ? 0.25 : 0.5, height: dense ? 16 : 20 }}
      >
        {icon ? (
          icon
        ) : (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: "bold", fontSize: dense ? "0.6rem" : "0.7rem" }}
          >
            {label.toUpperCase()}
          </Typography>
        )}
      </Stack>

      <Typography
        variant="caption"
        sx={{
          fontWeight: "bold",
          ...(dense && { fontSize: "0.65rem" }),
          width: "100%",
          textAlign: "center",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

export default AIMarketplaceItem;
