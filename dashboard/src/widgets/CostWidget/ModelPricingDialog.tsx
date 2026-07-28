import { Iconify } from "@canmingir/link/platform/components";
import useLoading from "../../hooks/useLoading";
import { useState } from "react";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import useModelPricings, { ModelPricing } from "../../hooks/useModelPricings";

const PROVIDERS = [
  "openai",
  "openrouter",
  "bedrock",
  "anthropic",
  "azure",
  "llama",
];

const EMPTY_FORM = {
  provider: "openai",
  model: "",
  inputPricePerMillion: "",
  outputPricePerMillion: "",
};

function ModelPricingDialog({
  open,
  onClose,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { getPricings, upsertPricing, deletePricing } = useModelPricings();
  const { pricings, loading, fetch } = getPricings();
  const isLoading = useLoading(loading);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isFormValid =
    form.provider &&
    form.model.trim() &&
    form.inputPricePerMillion !== "" &&
    form.outputPricePerMillion !== "" &&
    !isNaN(Number(form.inputPricePerMillion)) &&
    !isNaN(Number(form.outputPricePerMillion));

  const handleSave = async () => {
    if (!isFormValid) return;

    setSaving(true);
    try {
      await upsertPricing({
        provider: form.provider,
        model: form.model.trim(),
        inputPricePerMillion: Number(form.inputPricePerMillion),
        outputPricePerMillion: Number(form.outputPricePerMillion),
      });
      setForm(EMPTY_FORM);
      await fetch();
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (pricing: ModelPricing) => {
    setForm({
      provider: pricing.provider,
      model: pricing.model,
      inputPricePerMillion: String(pricing.inputPricePerMillion),
      outputPricePerMillion: String(pricing.outputPricePerMillion),
    });
  };

  const handleDelete = async (pricingId: string) => {
    await deletePricing(pricingId);
    await fetch();
    onChanged();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Model Pricing</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Prices are in USD per 1M tokens. Provider-reported costs (e.g.
          OpenRouter) always take precedence over these prices.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mb: 2 }}
          alignItems="center"
        >
          <TextField
            select
            size="small"
            label="Provider"
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            sx={{ minWidth: 140 }}
          >
            {PROVIDERS.map((provider) => (
              <MenuItem key={provider} value={provider}>
                {provider}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            size="small"
            label="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <TextField
            size="small"
            label="Input $/1M"
            value={form.inputPricePerMillion}
            onChange={(e) =>
              setForm({ ...form, inputPricePerMillion: e.target.value })
            }
            sx={{ width: 110 }}
          />
          <TextField
            size="small"
            label="Output $/1M"
            value={form.outputPricePerMillion}
            onChange={(e) =>
              setForm({ ...form, outputPricePerMillion: e.target.value })
            }
            sx={{ width: 110 }}
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!isFormValid || saving}
          >
            Save
          </Button>
        </Stack>

        {isLoading ? (
          <Stack sx={{ gap: 1 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={36}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Stack>
        ) : pricings.length === 0 ? (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ p: 2, textAlign: "center" }}
          >
            No pricing entries yet
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Provider</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell align="right">Input $/1M</TableCell>
                  <TableCell align="right">Output $/1M</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {pricings.map((pricing) => (
                  <TableRow key={pricing.id} hover>
                    <TableCell>{pricing.provider}</TableCell>
                    <TableCell>{pricing.model}</TableCell>
                    <TableCell align="right">
                      ${pricing.inputPricePerMillion}
                    </TableCell>
                    <TableCell align="right">
                      ${pricing.outputPricePerMillion}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(pricing)}
                      >
                        <Iconify icon="solar:pen-line-duotone" width={16} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(pricing.id)}
                      >
                        <Iconify
                          icon="solar:trash-bin-trash-line-duotone"
                          width={16}
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ModelPricingDialog;
