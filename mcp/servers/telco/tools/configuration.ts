import { ConfigurationInput, Tool } from "./types";

const ENDPOINT = "http://localhost:3001/api/soap/createOnt";

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
                    <id>25</id>
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
                                <id>25</id>
                            </ontType>
                        </gponOntBean>
                        <gponOntPortNo>1</gponOntPortNo>
                    </gponPortBean>
                </fttxPortBean>
                <hgwPotsPortNo>1</hgwPotsPortNo>
                <hgwSerialNo>${args.hgw_serial_no}</hgwSerialNo>
                <installationAddress>163316</installationAddress>
                <installationType>6</installationType>
                <packetId>109313</packetId>
                <password>*****</password>
                <popNo>6018000000000161</popNo>
                <retailPacketInfo>0</retailPacketInfo>
                <service>
                    <id>1</id>
                </service>
                <serviceStatus>
                    <id>1</id>
                </serviceStatus>
                <sipServerIp>aydinlikevl.ankara.ttimscore.com.tr</sipServerIp>
                <sipServerVendorName>ANKZIMS</sipServerVendorName>
                <speedProfile>${args.speed}</speedProfile>
                <staticIp>0.0.0.0</staticIp>
                <subscriptionNo>1799906793</subscriptionNo>
                <username>cayir144152608</username>
                <voiceServiceLevelBean>
                    <id>-1</id>
                </voiceServiceLevelBean>
            </customerServiceBean>
        </ns1:addCustomerService>
    </soapenv:Body>
</soapenv:Envelope>`;
}

async function sendSoapRequest(xmlBody: string): Promise<string> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "SOAPAction": "createOnt",
    },
    body: xmlBody,
  });

  if (!response.ok) {
    throw new Error(`SOAP request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export const configurationTool: Tool<ConfigurationInput> = {
  name: "TELCO:configuration",
  description:
    "Configure port settings using device serial number. Creates ONT configuration via SOAP request.",
  inputSchema: {
    type: "object",
    properties: {
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
    required: ["port_no", "device_serial_number", "hgw_serial_no", "device_tid", "device_card_no", "speed"],
  },
  handler: async (args: ConfigurationInput) => {
    try {
      const createOntXml = createOntXmlRequest(args);
      const addCustomerServiceXml = addCustomerServiceXmlRequest(args);

      //TODO: Uncomment these lines when the SOAP endpoint is ready
      /* 
      const createOntResponse = await sendSoapRequest(createOntXml);
      const addCustomerServiceResponse = await sendSoapRequest(addCustomerServiceXml);
      */

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: `Configuration successful for port number: ${args.port_no}`,
              //createOntRequest: createOntXml,
              // addCustomerServiceRequest: addCustomerServiceXml,
              //createOntResponse,
              //addCustomerServiceResponse,
            }),
          },
        ],
        isError: false,
      };
    } catch (error) {
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
