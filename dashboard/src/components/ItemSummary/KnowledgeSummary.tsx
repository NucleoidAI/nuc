import { Box } from "@mui/material";
import KnowledgeTable from "../KnowledgeTable/KnowledgeTable";
import React from "react";
import SummaryCard from "./SummaryCard";
import { useTable } from "@canmingir/link/platform/components";

const KnowledgeSummary = ({ newItem }) => {
  const table = useTable();

  return (
    <SummaryCard icon="mdi:book-open-outline" label="Knowledge" size={6}>
      <Box
        data-cy="item-summary-knowledge-area"
        sx={{ maxHeight: 300, overflowY: "auto" }}
      >
        <KnowledgeTable
          table={table}
          selectedType="ALL"
          knowledges={newItem.knowledges}
          readOnly
        />
      </Box>
    </SummaryCard>
  );
};

export default KnowledgeSummary;
