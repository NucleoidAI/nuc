import { ConfigurationInput, Tool } from "./types";

import logger from "../../../logger/logger.js";

function createOntXmlRequest(args: ConfigurationInput): string {
  return `<?xml version='1.0' encoding='UTF-8'?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Body>
        <ns1:createOnt
            xmlns:ns1="http://webservice.middleware.fttx.keys.kron.com.tr/">
            <gponOntBean>
                <channelNo>0</channelNo>
                <oltPortNo>${args.port_no}</oltPortNo>
                <oltSlotNo>${args.device_card_no}</oltSlotNo>
                <oltTid>${args.device_tid}</oltTid>
                <ontSerialNo>${args.device_serial_number}</ontSerialNo>
                <ontType>
                    <id>28</id>
                </ontType>
            </gponOntBean>
        </ns1:createOnt>
    </soapenv:Body>
</soapenv:Envelope>`;
}

function addCustomerServiceXmlRequest(args: ConfigurationInput): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope
    xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
    <soapenv:Body>
        <ns1:addCustomerService
            xmlns:ns1="http://webservice.middleware.fttx.keys.kron.com.tr/">
            <customerServiceBean>
                <customerBean>
                    <customerNo>1131657581</customerNo>
                    <requireAlertInform>0</requireAlertInform>
                </customerBean>
                <domain>ttnet</domain>
                <fttxPortBean>
                    <aePortBean>
                        <kaesPortNo>0</kaesPortNo>
                        <taesPortNo>0</taesPortNo>
                    </aePortBean>
                    <fttxType>
                        <id>1</id>
                    </fttxType>
                    <gponPortBean>
                        <gponOntBean>
                            <channelNo>0</channelNo>
                            <oltPortNo>${args.port_no}</oltPortNo>
                            <oltSlotNo>${args.device_card_no}</oltSlotNo>
                            <oltTid>${args.device_tid}</oltTid>
                            <ontSerialNo>${args.device_serial_number}</ontSerialNo>
                            <ontType>
                                <id>28</id>
                            </ontType>
                        </gponOntBean>
                        <gponOntPortNo>1</gponOntPortNo>
                    </gponPortBean>
                </fttxPortBean>
                <hgwPotsPortNo>1</hgwPotsPortNo>
                <hgwSerialNo>ZT30CC213FF851</hgwSerialNo>
                <installationAddress>163316</installationAddress>
                <installationType>6</installationType>
                <packetId>109313</packetId>
                <password>1234</password>
                <popNo>6018000000000161</popNo>
                <retailPacketInfo>0</retailPacketInfo>
                <service>
                    <id>1</id>
                </service>
                <serviceStatus>
                    <id>1</id>
                </serviceStatus>
                <speedProfile>${args.speed_profile}</speedProfile>
                <staticIp>0.0.0.0</staticIp>
                <subscriptionNo>1234999999</subscriptionNo>
                <username>hasancontuk</username>
                <voiceServiceLevelBean>
                    <id>-1</id>
                </voiceServiceLevelBean>
            </customerServiceBean>
        </ns1:addCustomerService>
    </soapenv:Body>
</soapenv:Envelope>`;
}

async function sendSoapRequest(endpoint: string, xmlBody: string, action: string): Promise<string> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": action,
    },
    body: xmlBody,
  });

  return response.text();
}

export const configurationTool: Tool<ConfigurationInput> = {
  name: "TELCO:configuration",
  description:
    "Configure port settings using device serial number. Creates ONT configuration via SOAP request.",
  inputSchema: {
    type: "object",
    properties: {
      speed_profile: {
        type: "string",
        description: "The speed profile to configure.",
      },
      port_no: {
        type: "string",
        description: "The port number to configure.",
      },
      device_serial_number: {
        type: "string",
        description: "The device serial number to configure.",
      },
      device_tid: {
        type: "string",
        description: "The device TID to configure.",
      },
      hgw_serial_no: {
        type: "string",
        description: "The HGW serial number to configure.",
      },
      device_card_no: {
        type: "string",
        description: "The device card number to configure.",
      },
      speed: {
        type: "string",
        description: "The speed to configure.",
      },
    },
    required: ["speed_profile", "port_no", "device_serial_number", "hgw_serial_no", "device_tid", "device_card_no", "speed"],
  },
  handler: async (args: ConfigurationInput) => {
    try {

      const endpoint = process.env.MCP_TELCO_URL;

      logger.info({ tool: "TELCO:configuration", endpoint }, "Sending SOAP request to endpoint");

      let ontResponse: string | null = null;
      let addCustomerServiceResponse: string | null = null;

      const createOntXml = createOntXmlRequest(args);
      const addCustomerServiceXml = addCustomerServiceXmlRequest(args);

      if (endpoint) {
        ontResponse = await sendSoapRequest(endpoint, createOntXml, "createOnt");
        addCustomerServiceResponse = await sendSoapRequest(endpoint, addCustomerServiceXml, "addCustomerService");
      } 

      logger.info({ tool: "TELCO:configuration", args }, "Configuration completed successfully");

      const payload = endpoint ? {
        ontResponse: ontResponse,
        addCustomerServiceResponse: addCustomerServiceResponse,
     
      } : {
        createOntXml: createOntXml,
        addCustomerServiceXml: addCustomerServiceXml,
      };
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              message: `CONFIGURATION_COMPLETED`,
              ...payload,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
      logger.error(
        { tool: "TELCO:configuration", err: error instanceof Error ? error : new Error(String(error)), args },
        "Configuration failed"
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: error instanceof Error ? error.message : "Unknown error",
            }),
          },
        ],
        isError: true,
      };
    }
  },
};
