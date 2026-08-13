import { ReactNode } from "react";

import {
  AiIcon,
  BardIcon,
  ClaudeIcon,
  DeepMindIcon,
  GreyCollarIcon,
  IbmIcon,
  MetaIcon,
  OpenAIIcon,
} from "./AIEngineIcons";

const vendorIcons: Record<
  string,
  (props: { width: number; height: number }) => ReactNode
> = {
  OpenAI: OpenAIIcon,
  "Google Bard": BardIcon,
  Claude: ClaudeIcon,
  Meta: MetaIcon,
  DeepMind: DeepMindIcon,
  "IBM Watson": IbmIcon,
  GreyCollar: GreyCollarIcon,
};

function AIEngineIcon({
  vendor,
  width = 20,
  height = 20,
}: {
  vendor?: string;
  width?: number;
  height?: number;
}) {
  const Icon = (vendor && vendorIcons[vendor]) || AiIcon;

  return <Icon width={width} height={height} />;
}

export default AIEngineIcon;
