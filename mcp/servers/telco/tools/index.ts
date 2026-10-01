import { addressToBBKTool } from "./address_to_bbk";
import { addressTool } from "./address_tool";
import { configurationTool } from "./configuration";
import { inventoryTool } from "./inventory_tool";
import { judgeSummaryTool } from "./judge_summary";
import { pcmToWavTool } from "./pcm_to_wav";
import { portAllocationTool } from "./port_allocation";
import { portConnectionTool } from "./port_connection";
import { prepareMeetingAttachmentsTool } from "./prepare_meeting_attachments";
import { productManagementSystemTool } from "./product_management_system";
import { resolveParticipantsTool } from "./resolve_participants";
import { sendEmailEwsTool } from "./send_email_ews";
import { summarizeMeetingBySpeakerTool } from "./summarize_meeting_by_speaker";
import { summarizeMeetingTool } from "./summarize_meeting";
import { transcribeMeetingTool } from "./transcribe_meeting";
import { translateTool } from "./translate";

export const tools = [
  addressTool,
  addressToBBKTool,
  inventoryTool,
  productManagementSystemTool,
  portAllocationTool,
  portConnectionTool,
  configurationTool,
  pcmToWavTool,
  transcribeMeetingTool,
  summarizeMeetingTool,
  summarizeMeetingBySpeakerTool,
  judgeSummaryTool,
  prepareMeetingAttachmentsTool,
  resolveParticipantsTool,
  sendEmailEwsTool,
  translateTool,
];
