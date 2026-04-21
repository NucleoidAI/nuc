import React from "react";

import {
  Box,
  Card,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

function TextSkeletonLines({ lines = 2 }: { lines?: number }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
      {[...Array(lines)].map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          sx={{ width: `${Math.max(30, 92 - i * 18)}%` }}
        />
      ))}
    </Box>
  );
}

function KnowledgeBaseSkeleton() {
  return (
    <Card>
      <TableContainer sx={{ position: "relative", overflow: "unset" }}>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Type</TableCell>
              <TableCell>Content</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Status</TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}>Date</TableCell>
              <TableCell sx={{ width: "5%" }} />
            </TableRow>
          </TableHead>

          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow hover key={index} tabIndex={-1}>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Skeleton variant="text" sx={{ width: "45%" }} />
                </TableCell>
                <TableCell>
                  <TextSkeletonLines lines={2} />
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Skeleton
                    variant="rounded"
                    sx={{ width: "55%", height: 24 }}
                  />
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <Skeleton variant="text" sx={{ width: "58%" }} />
                </TableCell>
                <TableCell align="right" sx={{ width: "5%" }}>
                  <Skeleton variant="circular" sx={{ width: 32, height: 32 }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

export default KnowledgeBaseSkeleton;
