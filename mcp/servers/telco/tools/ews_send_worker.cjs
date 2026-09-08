const {
  BodyType,
  ConfigurationApi,
  EmailAddress,
  EmailMessage,
  ExchangeService,
  ExchangeVersion,
  MessageBody,
  Uri,
  WebCredentials,
} = require("ews-javascript-api");
const { XhrApi } = require("@ewsjs/xhr");

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function describe(error) {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  const parts = [];
  if (error.message) parts.push(error.message);
  if (error.faultString && error.faultString !== error.message)
    parts.push(error.faultString);
  const details = error.errorDetails?.keysToObjs ?? error.errorDetails;
  if (details && Object.keys(details).length) parts.push(JSON.stringify(details));
  if (error.HttpStatusCode) parts.push(`HTTP ${error.HttpStatusCode}`);
  if (error.InnerException && error.InnerException.message)
    parts.push(`inner: ${error.InnerException.message}`);
  return parts.length ? parts.join(" | ") : JSON.stringify(error);
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));

  const xhr = new XhrApi({
    rejectUnauthorized: payload.rejectUnauthorized,
  }).useNtlmAuthentication(payload.user, payload.pass);
  ConfigurationApi.ConfigureXHR(xhr);

  const service = new ExchangeService(
    ExchangeVersion[payload.version] || ExchangeVersion.Exchange2013
  );
  service.Credentials = new WebCredentials(payload.user, payload.pass);
  service.Url = new Uri(payload.serviceUrl);

  const message = new EmailMessage(service);
  if (payload.from) message.From = new EmailAddress(xmlEscape(payload.from));
  message.ToRecipients.AddRange(payload.recipients.map(xmlEscape));
  message.Subject = xmlEscape(payload.subject);
  message.Body = payload.html
    ? new MessageBody(BodyType.HTML, xmlEscape(payload.html))
    : new MessageBody(BodyType.Text, xmlEscape(payload.text));

  for (const attachment of payload.attachments || []) {
    const added = message.Attachments.AddFileAttachment(
      xmlEscape(attachment.filename),
      attachment.base64
    );
    if (attachment.contentType) added.ContentType = attachment.contentType;
  }

  await message.SendAndSaveCopy();
}

main()
  .then(() => process.stdout.write(JSON.stringify({ ok: true })))
  .catch((error) =>
    process.stdout.write(
      JSON.stringify({ ok: false, error: describe(error) })
    )
  );
