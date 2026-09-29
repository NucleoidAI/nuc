import Communication from "../models/Communication";
import { NotFoundError } from "@canmingir/link-express/error";

type ServerConfig = { pass?: string } & Record<string, unknown>;

type EmailConfig = {
  imap?: ServerConfig;
  smtp?: ServerConfig;
} & Record<string, unknown>;

function maskConfig(config: EmailConfig | null) {
  if (!config) {
    return config;
  }

  const mask = (server?: ServerConfig) => {
    if (!server) {
      return server;
    }

    const { pass, ...rest } = server;

    return { ...rest, hasPassword: Boolean(pass) };
  };

  return { ...config, imap: mask(config.imap), smtp: mask(config.smtp) };
}

function toResponse(communication: Communication) {
  const json = communication.toJSON();

  return { ...json, config: maskConfig(json.config) };
}

function mergeSecrets(
  next: EmailConfig,
  previous: EmailConfig | null
): EmailConfig {
  const keep = (key: "imap" | "smtp") => ({
    ...next[key],
    pass: next[key]?.pass || previous?.[key]?.pass || "",
  });

  return { ...next, imap: keep("imap"), smtp: keep("smtp") };
}

async function list() {
  const communications = await Communication.findAll();

  return communications.map(toResponse);
}

async function listMailboxes() {
  const communications = await Communication.findAll({
    where: { channelType: "EMAIL" },
  });

  return communications
    .map((communication) => communication.toJSON())
    .filter((communication) => communication.config);
}

async function create({
  channelType,
  channelCode,
  blueprintId,
  projectId,
  config,
}: {
  channelType: string;
  channelCode: string;
  blueprintId: string;
  projectId?: string;
  config?: EmailConfig;
}) {
  const communication = await Communication.create({
    channelType,
    channelCode: config?.address ? String(config.address) : channelCode,
    blueprintId,
    projectId: projectId ?? null,
    config: config ?? null,
  });

  return toResponse(communication);
}

async function get({ communicationId }: { communicationId: string }) {
  const communication = await Communication.findByPk(communicationId);

  if (!communication) {
    throw new NotFoundError();
  }

  return toResponse(communication);
}

async function update({
  communicationId,
  config,
}: {
  communicationId: string;
  config: EmailConfig;
}) {
  const communication = await Communication.findByPk(communicationId);

  if (!communication) {
    throw new NotFoundError();
  }

  const merged = mergeSecrets(config, communication.config as EmailConfig);

  await communication.update({
    config: merged,
    channelCode: String(merged.address),
  });

  return toResponse(communication);
}

async function remove({ communicationId }: { communicationId: string }) {
  const deleted = await Communication.destroy({
    where: { id: communicationId },
  });

  if (!deleted) {
    throw new NotFoundError();
  }

  return true;
}

export default { list, listMailboxes, create, get, update, remove };
