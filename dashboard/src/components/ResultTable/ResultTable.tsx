import React from "react";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { formatKey, getAllKeys } from "../../utils/formatters";

const renderValue = (value) => {
  if (value === null || value === undefined) {
    return "-";
  }
  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

export const ResultTable = ({ data }) => {
  let content;
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    !data.content
  ) {
    content = data;
  } else {
    content = data?.content || data[0];
  }
  const keys = getAllKeys(content);

  return (
    <TableContainer component={Paper}>
      <Table size="small" sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ lineHeight: ".8rem" }}>Key</TableCell>
            <TableCell sx={{ lineHeight: ".8rem" }}>Value</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {keys.map((item, index) =>
            item.keys.length > 0
              ? item.keys.map((key, keyIndex) => (
                  <TableRow key={`${index}-${keyIndex}`}>
                    <TableCell sx={{ lineHeight: ".8rem" }}>
                      {formatKey(key)}
                    </TableCell>
                    <TableCell
                      sx={{ lineHeight: ".8rem", whiteSpace: "pre-wrap" }}
                    >
                      {renderValue(item.values[keyIndex])}
                    </TableCell>
                  </TableRow>
                ))
              : item.values.map((value, valueIndex) => (
                  <TableRow key={`${index}-${valueIndex}`}>
                    <TableCell sx={{ lineHeight: ".8rem" }}>
                      Value {item.index}
                    </TableCell>
                    <TableCell
                      sx={{ lineHeight: ".8rem", whiteSpace: "pre-wrap" }}
                    >
                      {renderValue(value)}
                    </TableCell>
                  </TableRow>
                ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
