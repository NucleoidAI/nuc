import KnowledgeTable from "../KnowledgeTable/KnowledgeTable";
import React from "react";
import { Stack } from "@mui/material";
import SummaryCard from "./SummaryCard";
import { useTable } from "@canmingir/link/platform/components";

const KnowledgeSummary = ({ newItem }) => {
  const table = useTable();

  return (
    <SummaryCard
      icon="mdi:book-open-outline"
      label="Knowledge"
      size={{ xs: 12, md: 6 }}
    >
      <Stack
        data-cy="item-summary-knowledge-area"
        sx={{ height: 300, overflowY: "auto" }}
      >
        <KnowledgeTable
          table={table}
          selectedType="ALL"
          knowledges={newItem.knowledges}
          readOnly
        />
      </Stack>
    </SummaryCard>
  );
};

export default KnowledgeSummary;
