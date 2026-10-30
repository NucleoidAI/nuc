import { Label } from "@canmingir/link/platform/components";
import CloseIcon from "@mui/icons-material/Close";
import CodeBlock from "../CodeBlock/CodeBlock";

import {
  Iconify,
  LowCodeEditor,
  Scrollbar,
  TableHeadCustom,
  TableSelectedAction,
} from "@canmingir/link/platform/components";
import {
  Box,
  Card,
  Dialog,
  DialogContent,
  IconButton,
  List,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";

function KnowledgeTable({
  table,
  selectedType,
  knowledges,
  handleDeleteClick = undefined,
  readOnly = false,
  blueprintsById = {},
  onBlueprintClick = undefined,
}) {
  const handleBlueprintChipClick = (blueprintId) => {
    onBlueprintClick?.(blueprintId);
  };
  const getTableHead = (selectedType) => {
    switch (selectedType) {
      case "ALL":
        return [
          { id: "type", label: "Type" },
          { id: "content", label: "Content" },
          { id: "level", label: "Level" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "BLUEPRINT":
        return [
          { id: "text", label: "Blueprint" },
          { id: "level", label: "Level" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "URL":
        return [
          { id: "url", label: "URL" },
          { id: "level", label: "Level" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "TEXT":
        return [
          { id: "text", label: "Text" },
          { id: "level", label: "Level" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "QA":
        return [
          { id: "question", label: "Question" },
          { id: "answer", label: "Answer" },
          { id: "level", label: "Level" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "DATA":
        return [
          { id: "text", label: "Data" },
          { id: "level", label: "Level" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      case "LOGIC":
        return [
          { id: "text", label: "Logic" },
          { id: "level", label: "Level" },
          { id: "date", label: "Date" },
          { id: "", label: "" },
        ];
      default:
        return [{ id: "level", label: "Level" }];
    }
  };
  const getLevelLabel = (row) => {
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

  const getLevel = (row) => {
    return getLevelLabel(row) ? <Label>{getLevelLabel(row)}</Label> : null;
  };

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const formatDataText = (text) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  const splitLogicText = (text) => {
    const index = (text || "").indexOf("\n");
    if (index === -1) {
      return { description: text || "", code: "" };
    }
    return {
      description: text.slice(0, index),
      code: text.slice(index + 1),
    };
  };

  const renderLogicContent = (row) => {
    const { description } = splitLogicText(row.text);

    return (
      <div style={{ wordBreak: "break-word", flex: 1, minWidth: 0 }}>
        {description}
      </div>
    );
  };

  const renderContentCell = (row) => {
    if (row.type === "LOGIC") {
      return renderLogicContent(row);
    }

    if (row.type === "DATA") {
      return (
        <CodeBlock style={{ margin: "0px" }}>
          {formatDataText(row.text)}
        </CodeBlock>
      );
    }

    return (
      <div style={{ wordBreak: "break-word", flex: 1, minWidth: 0 }}>
        {row.type === "URL" && row.url}
        {row.type === "TEXT" && row.text}
        {row.type === "QA" && `Q: ${row.question} A: ${row.answer}`}
        {row.type === "BLUEPRINT" &&
          (blueprintsById[row.blueprintId] || row.text)}
      </div>
    );
  };

  const renderBlueprintContent = (row) => {
    return (
      <Stack direction="row" alignItems="center" spacing={1}>
        {renderContentCell(row)}
        {row.type !== "BLUEPRINT" && row.blueprintId && (
          <Label
            onClick={() => handleBlueprintChipClick(row.blueprintId)}
            sx={{ flexShrink: 0, cursor: "pointer" }}
          >
            {blueprintsById[row.blueprintId] || "Blueprint"}
          </Label>
        )}
      </Stack>
    );
  };

  const logicKnowledges = knowledges.filter((k) => k.type === "LOGIC");

  const [logicEditorOpen, setLogicEditorOpen] = useState(false);
  const [selectedLogicId, setSelectedLogicId] = useState(null);
  const selectedLogic =
    logicKnowledges.find((k) => k.id === selectedLogicId) ??
    logicKnowledges[0] ??
    null;

  const handleOpenLogicEditor = (row) => {
    setSelectedLogicId(row.id);
    setLogicEditorOpen(true);
  };

  return (
    <Card sx={{ borderRadius: 0.5 }}>
      <TableContainer sx={{ position: "relative", overflow: "unset" }}>
        <TableSelectedAction
          dense={table.dense}
          rowCount={knowledges.length}
          numSelected={table.selected.length}
          onSelectAllRows={(checked) =>
            table.onSelectAllRows(
              checked,
              knowledges.map((k) => k.id)
            )
          }
        />
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
                        <TableCell
                          onClick={
                            row.type === "LOGIC"
                              ? () => handleOpenLogicEditor(row)
                              : row.type === "BLUEPRINT"
                              ? () => handleBlueprintChipClick(row.blueprintId)
                              : undefined
                          }
                          sx={
                            row.type === "LOGIC" || row.type === "BLUEPRINT"
                              ? { cursor: "pointer" }
                              : undefined
                          }
                        >
                          {renderBlueprintContent(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getLevel(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                    {selectedType === "BLUEPRINT" && (
                      <>
                        <TableCell
                          onClick={() =>
                            handleBlueprintChipClick(row.blueprintId)
                          }
                          sx={{ cursor: "pointer" }}
                        >
                          {renderBlueprintContent(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getLevel(row)}
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
                          {getLevel(row)}
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
                          {getLevel(row)}
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
                          {getLevel(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                    {selectedType === "DATA" && (
                      <>
                        <TableCell>
                          <CodeBlock>{formatDataText(row.text)}</CodeBlock>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getLevel(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                    {selectedType === "LOGIC" && (
                      <>
                        <TableCell
                          onClick={() => handleOpenLogicEditor(row)}
                          sx={{ cursor: "pointer" }}
                        >
                          {renderBlueprintContent(row)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {getLevel(row)}
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

      {logicEditorOpen && (
        <Dialog
          type="medium"
          sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
          open={logicEditorOpen}
          onClose={() => setLogicEditorOpen(false)}
        >
          <DialogContent sx={{ p: 0, display: "flex", flex: 1, minHeight: 0 }}>
            <Box
              sx={{
                width: 350,
                display: "flex",
                flexDirection: "column",
                borderRight: 1,
                borderColor: "divider",
                borderRadius: "4px 0 0 4px",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark" ? "grey.900" : "grey.50",
                minHeight: 0,
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Box sx={{ width: 28 }} />
                <Typography
                  variant="subtitle2"
                  fontWeight={600}
                  sx={{ textAlign: "center", flex: 1 }}
                >
                  Logics
                </Typography>
                <Tooltip title="Close">
                  <IconButton
                    size="small"
                    onClick={() => setLogicEditorOpen(false)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <List sx={{ flex: 1, minHeight: 0, overflowY: "auto" }} dense>
                {logicKnowledges.map((rule) => {
                  const { description } = splitLogicText(rule.text);
                  return (
                    <Box
                      onClick={() => setSelectedLogicId(rule.id)}
                      key={rule.id}
                      sx={{
                        minHeight: 56,
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        m: 0.5,
                        p: 1,
                        background: (theme) =>
                          rule.id === selectedLogic?.id
                            ? theme.palette.action.selected
                            : theme.palette.action.hover,
                      }}
                    >
                      <Typography
                        sx={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                        }}
                        variant="body2"
                      >
                        {description}
                      </Typography>
                    </Box>
                  );
                })}
              </List>
            </Box>

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minWidth: 0,
                minHeight: 0,
                bgcolor: "#000000",
              }}
            >
              {selectedLogic &&
                (() => {
                  const { description, code } = splitLogicText(
                    selectedLogic.text
                  );
                  return (
                    <LowCodeEditor
                      value={code}
                      onChange={() => {}}
                      readOnly
                      language="python"
                      editorHeight="100%"
                      showRunButton={false}
                      panelTitle="LOGIC.md"
                      panelContent={description}
                      showPanel
                    />
                  );
                })()}
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}

export default KnowledgeTable;
