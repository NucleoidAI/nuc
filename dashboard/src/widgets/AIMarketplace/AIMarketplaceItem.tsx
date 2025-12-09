import { getBackgroundUrl } from "../../utils/background";

import { Avatar, Box, Card, Stack, Typography } from "@mui/material";
import { Iconify, Image } from "@canmingir/link/platform/components";
import { alpha, useTheme } from "@mui/material/styles";

function AIMarketplaceItem({ engine, isWizardEngine, handleEngineSelect }) {
  const theme = useTheme();

  const icons =
    engine?.vendor === "OpenAI"
      ? "mingcute:openai-fill"
      : engine?.vendor === "Microsoft"
      ? "mdi:microsoft"
      : engine?.vendor === "Claude"
      ? "lineicons:claude"
      : engine?.vendor === "Meta"
      ? "hugeicons:meta"
      : engine?.vendor === "DeepMind"
      ? "simple-icons:deepmind"
      : "tabler:ai";

  return (
    <>
      <Box
        onClick={() => isWizardEngine && handleEngineSelect(engine)}
        sx={{
          cursor: "pointer",
          "&:hover": {
            opacity: 0.7,
            transition: "opacity 0.3s ease-in-out",
          },
        }}
      >
        <Card
          data-cy="ai-marketplace-item"
          sx={{
            textAlign: "center",
            height: 220,
            minWidth: 150,
            display: "flex",
            flexDirection: "row",
            "&:hover": {
              boxShadow: isWizardEngine ? 6 : 1,
            },
          }}
        >
          {/* bg and avatar */}
          <Box sx={{ position: "relative" }}>
            <Image
              src={getBackgroundUrl(engine?.id)}
              alt={engine?.vendor}
              ratio="16/9"
              sx={{
                width: 100,
                height: "100%",
                display: "block",
                borderRadius: 2,
              }}
              overlay={alpha(theme.palette.grey[900], 0.48)}
            />

            {engine?.avatar ? (
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: "50%",
                  transform: "translate(-50%)",
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  border: `2px solid ${theme.palette.common.white}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  zIndex: 10,
                }}
              >
                <Iconify
                  icon={engine.avatar}
                  width="70%"
                  height="70%"
                  style={{ objectFit: "contain" }}
                />
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
          {/* // vendor and model */}
          <Stack
            direction={"column"}
            sx={{
              m: 1,
            }}
          >
            <Stack
              sx={{
                height: 60,
                marginBottom: 5,
              }}
            >
              {engine?.description}
            </Stack>

            <Stack
              direction={"row"}
              sx={{
                gap: 2,
                m: "auto",
                justifyContent: "center",
                height: 70,
                width: 280,
              }}
            >
              <Stack
                direction="column"
                sx={{
                  typography: "body2",
                  padding: 1,
                  borderRadius: 1,
                  border: "dotted 1px gray",
                  width: "100%",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    paddingY: "0.5rem",
                    m: "auto",
                    width: 20,
                    height: 30,
                  }}
                >
                  <Iconify icon={icons} width={20} />
                </Stack>
                <Stack
                  sx={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignContent: "center",
                    overflow: "hidden",
                    height: 20,
                  }}
                >
                  <Typography
                    color={"inherit"}
                    variant={"body2"}
                    textAlign={"start"}
                    data-cy="colleague-card-role-area"
                    sx={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      maxHeight: 45,
                    }}
                  >
                    {engine?.vendor}
                  </Typography>
                </Stack>
              </Stack>
              <Stack
                direction="column"
                sx={{
                  typography: "body2",
                  padding: 1,
                  borderRadius: 1,
                  border: "dotted 1px gray",
                  width: "100%",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    paddingY: "0.5rem",
                    justifyContent: "center",
                    m: "auto",
                    width: 20,
                    height: 30,
                  }}
                >
                  <Typography variant="subtitle1" fontSize={12}>
                    Model
                  </Typography>
                </Stack>
                <Stack
                  sx={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignContent: "center",
                    overflow: "hidden",
                    m: "auto",
                  }}
                >
                  <Typography
                    color={"inherit"}
                    variant={"body2"}
                    textAlign={"start"}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      maxHeight: 45,
                    }}
                  >
                    {engine?.model}
                  </Typography>
                </Stack>
              </Stack>
              <Stack
                direction="column"
                sx={{
                  typography: "body2",
                  padding: 1,
                  borderRadius: 1,
                  border: "dotted 1px gray",
                  width: "100%",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    paddingY: "0.5rem",
                    justifyContent: "center",
                    m: "auto",
                    width: 20,
                    height: 30,
                  }}
                >
                  <Typography variant="subtitle1" fontSize={12}>
                    Price
                  </Typography>
                </Stack>
                <Stack
                  sx={{
                    flexDirection: "row",
                    justifyContent: "center",
                    alignContent: "center",
                    overflow: "hidden",
                    height: 20,
                  }}
                >
                  <Typography
                    color={"inherit"}
                    variant={"body2"}
                    textAlign={"start"}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      maxHeight: 45,
                    }}
                  >
                    $ {engine?.price}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Stack>
        </Card>
      </Box>
    </>
  );
}

export default AIMarketplaceItem;
