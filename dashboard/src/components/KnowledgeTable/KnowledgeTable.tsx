import { Label } from "@canmingir/link/platform/components";

import {
  Card,
  IconButton,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import {
  Iconify,
  Scrollbar,
  TableHeadCustom,
  TableSelectedAction,
} from "@canmingir/link/platform/components";
import React, { useState } from "react";

function KnowledgeTable({
  table,
  selectedType,
  knowledges,
  handleDeleteClick = undefined,
  readOnly = false,
}) {
  const getTableHead = (selectedType) => {
    switch (selectedType) {
      case "ALL":
        return [
          { id: "type", label: "Type" },
          { id: "content", label: "Content" },
          { id: "status", label: "Status" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "URL":
        return [
          { id: "url", label: "URL" },
          { id: "status", label: "Status" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "TEXT":
        return [
          { id: "text", label: "Text" },
          { id: "status", label: "Status" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "QA":
        return [
          { id: "question", label: "Question" },
          { id: "answer", label: "Answer" },
          { id: "status", label: "Status" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "DATA":
        return [
          { id: "text", label: "Data" },
          { id: "status", label: "Status" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      default:
        return [{ id: "status", label: "Status" }];
    }
  };
  const getScopeLabel = (row) => {
    if (row.label) {
      return row.label;
    }

    if (row.blueprintId) {
      return "Blueprint";
    }

    if (row.organizationId) {
      return "Organization";
    }

    return row.teamId !== null ? "Team" : "Agent";
  };

  const statusLabel = (row, status) => {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        <span>{status}</span>
        {getScopeLabel(row) && <Label>{getScopeLabel(row)}</Label>}
      </Stack>
    );
  };

  const getStatus = (row) => {
    switch (row.status) {
      case "IN_PROGRESS":
        return statusLabel(row, "In Progress");
      case "COMPLETED":
        return statusLabel(row, "Completed");
      default:
        return statusLabel(row, row.status);
    }
  };

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  return (
    <Card sx={{ borderRadius: 0.5 }}>
      <TableContainer sx={{ position: "relative", overflow: "unset" }}>
        <TableSelectedAction dense={table.dense} />
        <Scrollbar>
          <Table>
            <TableHeadCustom
              order={table.order}
              orderBy={table.orderBy}
              headLabel={getTableHead(selectedType).filter(
                (head) => !readOnly || head.id !== ""
              )}
            />
            <TableBody>
              {knowledges
                .slice((page - 1) * rowsPerPage, page * rowsPerPage)
                .map((row, index) => (
                  <TableRow hover key={index} tabIndex={-1}>
                    {selectedType === "ALL" && (
                      <>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {row.type}
                        </TableCell>
                        <TableCell>
                          <div style={{ wordBreak: "break-word" }}>
                            {row.type === "URL" && row.url}
                            {row.type === "TEXT" && row.text}
                            {row.type === "QA" &&
                              `Q: ${row.question} A: ${row.answer}`}
                            {row.type === "DATA" && row.text}
                          </div>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getStatus(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                    {selectedType === "URL" && (
                      <>
                        <TableCell>
                          <div style={{ wordBreak: "break-all" }}>
                            {row.url}
                          </div>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getStatus(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                    {selectedType === "TEXT" && (
                      <>
                        <TableCell>{row.text}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getStatus(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                    {selectedType === "QA" && (
                      <>
                        <TableCell>{row.question}</TableCell>
                        <TableCell>{row.answer}</TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getStatus(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                    {selectedType === "DATA" && (
                      <>
                        <TableCell>
                          <div
                            style={{
                              wordBreak: "break-all",
                              fontFamily: "monospace",
                              fontSize: "0.75rem",
                            }}
                          >
                            {row.text}
                          </div>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getStatus(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                    {!readOnly && (
                      <TableCell align="right" sx={{ width: "5%" }}>
                        <IconButton
                          data-cy="delete-knowledge-button"
                          onClick={() => handleDeleteClick(row)}
                          sx={{
                            "&:hover": {
                              "& svg": {
                                color: "error.main",
                              },
                            },
                          }}
                        >
                          <Iconify icon="mdi:trash" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      {knowledges.length > rowsPerPage && (
        <Pagination
          count={Math.ceil(knowledges.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          sx={{
            mt: 2,
            mb: 2,
            display: "flex",
            justifyContent: "center",
          }}
        />
      )}
    </Card>
  );
}

export default KnowledgeTable;
