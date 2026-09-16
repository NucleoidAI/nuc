import { defineTool, string } from "../../../lib/mock-api-tool";

export const getRateQuoteTool = defineTool({
  name: "FEDEX:get_rate_quote",
  description:
    "Get a simulated USD rate for one package. Uses the local enterprise mock API; no real shipping.",
  env: "FEDEX_API_URL",
  properties: {
    sender_postal_code: string("Origin postal code"),
    sender_country_code: string("Origin two-letter country code"),
    recipient_postal_code: string("Destination postal code"),
    recipient_country_code: string("Destination two-letter country code"),
    recipient_name: string("Recipient name"),
    weight: { type: "number", minimum: 0.001, description: "Package weight" },
    weight_units: { type: "string", enum: ["KG", "LB"] },
    service_type: {
      type: "string",
      enum: ["FEDEX_GROUND", "FEDEX_2_DAY", "PRIORITY_OVERNIGHT"],
    },
  },
  required: [
    "sender_postal_code",
    "sender_country_code",
    "recipient_postal_code",
    "recipient_country_code",
    "weight",
  ],
  request: (args) => ({
    path: "/rate/v1/rates/quotes",
    method: "POST",
    body: {
      requestedShipment: {
        shipper: {
          address: {
            postalCode: args.sender_postal_code,
            countryCode: args.sender_country_code,
          },
        },
        recipients: [
          {
            contact: { personName: args.recipient_name },
            address: {
              postalCode: args.recipient_postal_code,
              countryCode: args.recipient_country_code,
            },
          },
        ],
        serviceType: args.service_type ?? "FEDEX_GROUND",
        requestedPackageLineItems: [
          { weight: { value: args.weight, units: args.weight_units ?? "KG" } },
        ],
      },
    },
  }),
});
