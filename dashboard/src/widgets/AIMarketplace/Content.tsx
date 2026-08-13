import AIMarketplaceItem from "./AIMarketplaceItem";
import { Box } from "@mui/material";

export default function AIEngineChart({
  sx,
  data,
  isWizardEngine,
  handleEngineSelect,
  selectedEngineId,
}: {
  sx?: object;
  data: {
    id: string;
    vendor: string;
    model: string;
    price: number;
    type: string;
    avatar?: string;
  }[];
  isWizardEngine: boolean;
  handleEngineSelect: (engine: { id: string }) => void;
  selectedEngineId?: string;
}) {
  return (
    <>
      <Box
        sx={sx}
        gap={1}
        display="grid"
        alignItems="stretch"
        gridTemplateColumns={
          isWizardEngine
            ? "repeat(auto-fill, minmax(200px, 1fr))"
            : {
                xs: "repeat(1, 1fr)",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              }
        }
      >
        {data?.map((engine) => (
          <AIMarketplaceItem
            handleEngineSelect={handleEngineSelect}
            isWizardEngine={isWizardEngine}
            isSelected={engine?.id === selectedEngineId}
            key={engine?.id}
            engine={engine}
          />
        ))}
      </Box>
    </>
  );
}
