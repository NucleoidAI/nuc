import Channel from "../models/Channel";
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

function toResponse(channel: Channel) {
  const json = channel.toJSON();

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

// TODO: Scope by projectId; secrets=true returns every project's mailbox credentials to any authenticated caller. Move secret retrieval to a service-only route for the communication service.
async function list({
  type,
  secrets = false,
}: {
  type?: string;
  secrets?: boolean;
} = {}) {
  const channels = await Channel.findAll({
    where: type ? { channelType: type } : {},
  });

  return channels.map((channel) =>
    secrets ? channel.toJSON() : toResponse(channel)
  );
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
  const channel = await Channel.create({
    channelType,
    channelCode: config?.address ? String(config.address) : channelCode,
    blueprintId,
    projectId: projectId ?? null,
    config: config ?? null,
  });

  return toResponse(channel);
}

// TODO: Enforce project ownership; lookup is by channel id only.
async function get({ channelId }: { channelId: string }) {
  const channel = await Channel.findByPk(channelId);

  if (!channel) {
    throw new NotFoundError();
  }

  return toResponse(channel);
}

// TODO: Enforce project ownership; lookup is by channel id only.
async function update({
  channelId,
  config,
}: {
  channelId: string;
  config: EmailConfig;
}) {
  const channel = await Channel.findByPk(channelId);

  if (!channel || channel.channelType !== "EMAIL") {
    throw new NotFoundError();
  }

  const merged = mergeSecrets(config, channel.config as EmailConfig);

  await channel.update({
    config: merged,
    channelCode: String(merged.address),
  });

  return toResponse(channel);
}

// TODO: Enforce project ownership; delete is by channel id only.
async function remove({ channelId }: { channelId: string }) {
  const deleted = await Channel.destroy({
    where: { id: channelId },
  });

  if (!deleted) {
    throw new NotFoundError();
  }

  return true;
}

export default { list, create, get, update, remove };
