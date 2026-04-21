import { Endpoint } from "../types";
import React from "react";
import { publish } from "@nucleoidai/react-event";

import {
  APIBody,
  APIDialogAction,
  APIParams,
  APIPath,
  APITypes,
  NucDialog,
} from "@canmingir/link/platform/components";
import { Box, Divider } from "@mui/material";

type DialogState = {
  type: "method" | "resource" | null;
  action: "add" | "edit" | null;
  open: boolean;
};
type DialogView = string;
type DialogProps = {
  dialog: DialogState;
  dialogTitle: string;
  dialogView: DialogView;
  setDialogView: React.Dispatch<React.SetStateAction<DialogView>>;
  handleSave: () => void;
  selected: { path: string; method: string | null } | null;
  isEdit: boolean;
  isAddMethod: boolean;
  basePath: string;
  methodRef: React.MutableRefObject<string>;
  pathRef: React.MutableRefObject<string>;
  paramsRef: React.MutableRefObject<unknown>;
  requestSchemaRef: React.MutableRefObject<
    { schemaOutput?: () => unknown } | undefined
  >;
  responseSchemaRef: React.MutableRefObject<
    { schemaOutput?: () => unknown } | undefined
  >;
  typesRef: React.MutableRefObject<Record<string, unknown>>;
  types: Array<{ name: string; schema: unknown; isTypeScript?: boolean }>;
  selectedEndpoint: Endpoint | undefined;
  dialogKey: number;
  allowedMethods: string[];
  addParams: React.MutableRefObject<unknown>;
};

const Dialog = ({
  dialog,
  dialogTitle,
  dialogView,
  setDialogView,
  handleSave,
  selected,
  isEdit,
  isAddMethod,
  basePath,
  methodRef,
  pathRef,
  paramsRef,
  requestSchemaRef,
  responseSchemaRef,
  typesRef,
  types,
  selectedEndpoint,
  dialogKey,
  allowedMethods,
  addParams,
}: DialogProps) => {
  return (
    <NucDialog
      title={dialogTitle}
      open={dialog.open}
      handleClose={() => publish("API_DIALOG_OPEN", { open: false })}
      maximizedDimensions={{ width: "75rem", height: "60rem" }}
      minimizedDimensions={{ width: "65rem", height: "50rem" }}
      action={
        <APIDialogAction
          view={dialogView}
          setApiDialogView={setDialogView}
          saveApiDialog={handleSave}
          saveDisable={false}
          deleteDisable={!isEdit}
          deleteMethod={() => {
            if (!selected) return;
            publish("API_METHOD_DELETE", {
              path: selected.path,
              method: selected.method,
            });
            publish("API_DIALOG_OPEN", { open: false });
          }}
        />
      }
    >
      <Box
        key={dialogKey}
        sx={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <APIPath
          method={allowedMethods[0] || "GET"}
          path={basePath}
          methodRef={methodRef}
          pathRef={pathRef}
          onTypesButtonClick={() => setDialogView("TYPES")}
          allowedMethods={allowedMethods.length ? allowedMethods : ["GET"]}
          isMethodDisabled={isEdit}
          isPathDisabled={isAddMethod || isEdit}
          validatePath={() => {}}
        />
        <Divider sx={{ my: 2 }} />
        {dialogView === "PARAMS" && (
          <APIParams
            types={types}
            paramsRef={paramsRef}
            addParams={addParams}
          />
        )}
        {dialogView === "BODY" && (
          <APIBody
            types={types}
            api={{
              path: basePath,
              method: methodRef.current,
              params: paramsRef.current,
              request: selectedEndpoint?.request || { schema: [] },
              response: selectedEndpoint?.response || { schema: [] },
            }}
            requestSchemaRef={requestSchemaRef}
            responseSchemaRef={responseSchemaRef}
          />
        )}
        {dialogView === "TYPES" && (
          <APITypes tstypes={[]} nuctypes={types} typesRef={typesRef} />
        )}
      </Box>
    </NucDialog>
  );
};

export default Dialog;
