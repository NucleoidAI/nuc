import { Iconify } from "@canmingir/link/platform/components";

import {
  type ApiField,
  type ApiFieldType,
  type ApiType,
  defaultApiType,
} from "./apiNodes";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

const TYPES: ApiFieldType[] = [
  "string",
  "number",
  "boolean",
  "enum",
  "array",
  "object",
];

const FORMATS = ["email", "url", "uuid", "datetime"] as const;

const MENU_PROPS = {
  sx: { zIndex: (theme) => theme.zIndex.modal + 3 },
};

function parseNumber(value: string) {
  if (value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value?: number) => void;
}) {
  return (
    <TextField
      size="small"
      type="number"
      label={label}
      value={value ?? ""}
      onChange={(event) => onChange(parseNumber(event.target.value))}
      sx={{ flex: 1 }}
    />
  );
}

function EnumValuesInput({
  values,
  onChange,
}: {
  values: string[];
  onChange: (values: string[]) => void;
}) {
  const joined = values.join(", ");
  const [draft, setDraft] = useState(joined);

  useEffect(() => setDraft(joined), [joined]);

  return (
    <TextField
      size="small"
      label="Values (comma separated)"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() =>
        onChange(
          draft
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      }
      fullWidth
    />
  );
}

function TypeSelect({
  value,
  onChange,
}: {
  value: ApiFieldType;
  onChange: (type: ApiFieldType) => void;
}) {
  return (
    <TextField
      select
      size="small"
      label="Type"
      value={value}
      onChange={(event) => onChange(event.target.value as ApiFieldType)}
      SelectProps={{ MenuProps: MENU_PROPS }}
      sx={{ width: 130, flexShrink: 0 }}
    >
      {TYPES.map((type) => (
        <MenuItem key={type} value={type}>
          {type}
        </MenuItem>
      ))}
    </TextField>
  );
}

function ApiTypeConstraints({
  value,
  onChange,
  depth,
}: {
  value: ApiType;
  onChange: (value: ApiType) => void;
  depth: number;
}) {
  const set = (patch: Partial<ApiType>) => onChange({ ...value, ...patch });

  if (value.type === "string") {
    return (
      <Stack spacing={1}>
        <Stack direction="row" spacing={1}>
          <NumberInput
            label="Min length"
            value={value.minLength}
            onChange={(minLength) => set({ minLength })}
          />
          <NumberInput
            label="Max length"
            value={value.maxLength}
            onChange={(maxLength) => set({ maxLength })}
          />
        </Stack>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            label="Pattern (regex)"
            value={value.pattern ?? ""}
            onChange={(event) =>
              set({ pattern: event.target.value || undefined })
            }
            sx={{ flex: 1 }}
          />
          <TextField
            select
            size="small"
            label="Format"
            value={value.format ?? ""}
            onChange={(event) =>
              set({
                format: (event.target.value || undefined) as ApiType["format"],
              })
            }
            SelectProps={{ MenuProps: MENU_PROPS }}
            sx={{ width: 130 }}
          >
            <MenuItem value="">none</MenuItem>
            {FORMATS.map((format) => (
              <MenuItem key={format} value={format}>
                {format}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Stack>
    );
  }

  if (value.type === "number") {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <NumberInput
          label="Min"
          value={value.min}
          onChange={(min) => set({ min })}
        />
        <NumberInput
          label="Max"
          value={value.max}
          onChange={(max) => set({ max })}
        />
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={Boolean(value.integer)}
              onChange={(event) =>
                set({ integer: event.target.checked || undefined })
              }
            />
          }
          label="Integer"
        />
      </Stack>
    );
  }

  if (value.type === "enum") {
    return (
      <EnumValuesInput
        values={value.values ?? []}
        onChange={(values) => set({ values })}
      />
    );
  }

  if (value.type === "array") {
    const items = value.items ?? { type: "string" as const };

    return (
      <Stack spacing={1}>
        <Stack direction="row" spacing={1}>
          <NumberInput
            label="Min items"
            value={value.minItems}
            onChange={(minItems) => set({ minItems })}
          />
          <NumberInput
            label="Max items"
            value={value.maxItems}
            onChange={(maxItems) => set({ maxItems })}
          />
        </Stack>
        <Box sx={{ pl: 1.5, borderLeft: 2, borderColor: "divider" }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Items
              </Typography>
              <TypeSelect
                value={items.type}
                onChange={(type) => set({ items: defaultApiType(type) })}
              />
            </Stack>
            <ApiTypeConstraints
              value={items}
              onChange={(next) => set({ items: next })}
              depth={depth + 1}
            />
          </Stack>
        </Box>
      </Stack>
    );
  }

  if (value.type === "object") {
    return (
      <Box sx={{ pl: 1.5, borderLeft: 2, borderColor: "divider" }}>
        <ApiFieldList
          fields={value.fields ?? []}
          onChange={(fields) => set({ fields })}
          depth={depth + 1}
        />
      </Box>
    );
  }

  return null;
}

export default function ApiFieldList({
  fields,
  onChange,
  depth = 0,
}: {
  fields: ApiField[];
  onChange: (fields: ApiField[]) => void;
  depth?: number;
}) {
  const update = (index: number, field: ApiField) =>
    onChange(fields.map((item, i) => (i === index ? field : item)));

  return (
    <Stack spacing={1.5}>
      {fields.map((field, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                label="Name"
                value={field.name}
                onChange={(event) =>
                  update(index, { ...field, name: event.target.value })
                }
                sx={{ flex: 1 }}
              />
              <TypeSelect
                value={field.type}
                onChange={(type) =>
                  update(index, {
                    ...defaultApiType(type),
                    name: field.name,
                    description: field.description,
                    required: field.required,
                  })
                }
              />
              <IconButton
                size="small"
                aria-label={`Remove ${field.name || "field"}`}
                onClick={() => onChange(fields.filter((_, i) => i !== index))}
              >
                <Iconify icon="mdi:delete-outline" width={18} height={18} />
              </IconButton>
            </Stack>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={field.required !== false}
                  onChange={(event) =>
                    update(index, { ...field, required: event.target.checked })
                  }
                />
              }
              label="Required"
            />
            <ApiTypeConstraints
              value={field}
              onChange={(next) => update(index, { ...field, ...next })}
              depth={depth}
            />
            <TextField
              size="small"
              label="Description"
              value={field.description ?? ""}
              onChange={(event) =>
                update(index, {
                  ...field,
                  description: event.target.value || undefined,
                })
              }
              fullWidth
            />
          </Stack>
        </Paper>
      ))}
      <Button
        size="small"
        variant="outlined"
        startIcon={<Iconify icon="mdi:plus" width={16} height={16} />}
        onClick={() =>
          onChange([...fields, { name: "", type: "string", required: true }])
        }
        sx={{ alignSelf: "flex-start" }}
      >
        Add field
      </Button>
    </Stack>
  );
}
