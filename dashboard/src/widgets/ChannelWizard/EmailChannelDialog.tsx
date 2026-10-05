import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";

type ServerForm = {
  host: string;
  port: string;
  secure: boolean;
  user: string;
  pass: string;
  hasPassword?: boolean;
};

export type EmailChannelConfig = {
  address: string;
  allowedSenders: string[];
  imap: Omit<ServerForm, "port"> & { port: number; folder: string };
  smtp: Omit<ServerForm, "port"> & { port: number; from: string };
};

type FormState = {
  address: string;
  allowedSenders: string;
  imap: ServerForm & { folder: string };
  smtp: ServerForm & { from: string };
};

const EMPTY_FORM: FormState = {
  address: "",
  allowedSenders: "",
  imap: {
    host: "",
    port: "993",
    secure: true,
    user: "",
    pass: "",
    folder: "INBOX",
  },
  smtp: {
    host: "",
    port: "587",
    secure: false,
    user: "",
    pass: "",
    from: "",
  },
};

function toForm(config?: Partial<EmailChannelConfig> | null): FormState {
  if (!config) {
    return EMPTY_FORM;
  }

  return {
    address: config.address ?? "",
    allowedSenders: (config.allowedSenders ?? []).join(", "),
    imap: {
      ...EMPTY_FORM.imap,
      ...config.imap,
      port: String(config.imap?.port ?? EMPTY_FORM.imap.port),
      pass: "",
    },
    smtp: {
      ...EMPTY_FORM.smtp,
      ...config.smtp,
      port: String(config.smtp?.port ?? EMPTY_FORM.smtp.port),
      pass: "",
    },
  };
}

function toConfig(form: FormState): EmailChannelConfig {
  const server = ({ host, port, secure, user, pass }: ServerForm) => ({
    host: host.trim(),
    port: Number(port),
    secure,
    user: user.trim(),
    pass,
  });

  return {
    address: form.address.trim().toLowerCase(),
    allowedSenders: form.allowedSenders
      .split(/[,\s]+/)
      .map((sender) => sender.trim().toLowerCase())
      .filter(Boolean),
    imap: { ...server(form.imap), folder: form.imap.folder.trim() || "INBOX" },
    smtp: { ...server(form.smtp), from: form.smtp.from.trim() },
  };
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidPort(value: string) {
  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

const ServerFields = ({
  title,
  value,
  onChange,
  isEdit,
  children,
}: {
  title: string;
  value: ServerForm;
  onChange: (next: Partial<ServerForm>) => void;
  isEdit: boolean;
  children?: React.ReactNode;
}) => (
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1.5}>
        <TextField
          label="Host"
          size="small"
          fullWidth
          required
          value={value.host}
          onChange={(e) => onChange({ host: e.target.value })}
        />
        <TextField
          label="Port"
          size="small"
          required
          sx={{ width: 120 }}
          value={value.port}
          error={!!value.port && !isValidPort(value.port)}
          onChange={(e) => onChange({ port: e.target.value })}
        />
      </Stack>
      <Stack direction="row" spacing={1.5}>
        <TextField
          label="Username"
          size="small"
          fullWidth
          required
          value={value.user}
          onChange={(e) => onChange({ user: e.target.value })}
        />
        <TextField
          label="Password"
          size="small"
          type="password"
          fullWidth
          autoComplete="new-password"
          value={value.pass}
          placeholder={isEdit && value.hasPassword ? "Unchanged" : ""}
          helperText={
            isEdit && value.hasPassword ? "Leave empty to keep current" : ""
          }
          onChange={(e) => onChange({ pass: e.target.value })}
        />
      </Stack>
      {children}
      <FormControlLabel
        control={
          <Switch
            checked={value.secure}
            onChange={(e) => onChange({ secure: e.target.checked })}
          />
        }
        label="Use TLS/SSL"
      />
    </Stack>
  </Box>
);

const EmailChannelDialog = ({
  open,
  onClose,
  onSubmit,
  initialConfig,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (config: EmailChannelConfig) => void | Promise<void>;
  initialConfig?: Partial<EmailChannelConfig> | null;
}) => {
  const isEdit = !!initialConfig;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(toForm(initialConfig));
      setSubmitting(false);
    }
  }, [open, initialConfig]);

  const updateImap = (next: Partial<FormState["imap"]>) =>
    setForm((prev) => ({ ...prev, imap: { ...prev.imap, ...next } }));

  const updateSmtp = (next: Partial<FormState["smtp"]>) =>
    setForm((prev) => ({ ...prev, smtp: { ...prev.smtp, ...next } }));

  const handleAddressChange = (address: string) =>
    setForm((prev) => ({
      ...prev,
      address,
      imap: {
        ...prev.imap,
        user: prev.imap.user === prev.address ? address : prev.imap.user,
      },
      smtp: {
        ...prev.smtp,
        user: prev.smtp.user === prev.address ? address : prev.smtp.user,
      },
    }));

  const passwordsProvided =
    isEdit ||
    (form.imap.pass.trim().length > 0 && form.smtp.pass.trim().length > 0);

  const isValid =
    EMAIL_PATTERN.test(form.address.trim()) &&
    form.imap.host.trim() &&
    form.smtp.host.trim() &&
    form.imap.user.trim() &&
    form.smtp.user.trim() &&
    isValidPort(form.imap.port) &&
    isValidPort(form.smtp.port) &&
    passwordsProvided;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onSubmit(toConfig(form));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEdit ? "Email Channel Settings" : "Add Email Channel"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Stack spacing={1.5}>
            <TextField
              autoFocus
              label="Email Address"
              size="small"
              required
              fullWidth
              value={form.address}
              onChange={(e) => handleAddressChange(e.target.value)}
            />
            <TextField
              label="Allowed Senders"
              size="small"
              fullWidth
              value={form.allowedSenders}
              helperText="Comma separated. Leave empty to accept mail from anyone."
              onChange={(e) =>
                setForm((prev) => ({ ...prev, allowedSenders: e.target.value }))
              }
            />
          </Stack>

          <ServerFields
            title="Incoming (IMAP)"
            value={form.imap}
            onChange={updateImap}
            isEdit={isEdit}
          >
            <TextField
              label="Folder"
              size="small"
              fullWidth
              value={form.imap.folder}
              onChange={(e) => updateImap({ folder: e.target.value })}
            />
          </ServerFields>

          <ServerFields
            title="Outgoing (SMTP)"
            value={form.smtp}
            onChange={updateSmtp}
            isEdit={isEdit}
          >
            <TextField
              label="From"
              size="small"
              fullWidth
              value={form.smtp.from}
              placeholder={form.address}
              onChange={(e) => updateSmtp({ from: e.target.value })}
            />
          </ServerFields>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          variant="contained"
        >
          {isEdit ? "Save" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailChannelDialog;
