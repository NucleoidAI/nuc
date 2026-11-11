import vendorIcon from "@iconify/json/json/ri.json";
import vendorIcons from "@iconify/json/json/simple-icons.json";
const openaiIcon = (
  vendorIcons as {
    icons: { [key: string]: { body: string; viewBox?: string } };
  }
).icons["openai"];
const claudeIcon = (
  vendorIcons as {
    icons: { [key: string]: { body: string; viewBox?: string } };
  }
).icons["claude"];
const deepmindIcon = (
  vendorIcons as {
    icons: { [key: string]: { body: string; viewBox?: string } };
  }
).icons["deepmind"];
const ibmIcon = (
  vendorIcons as {
    icons: { [key: string]: { body: string; viewBox?: string } };
  }
).icons["ibm"];
const metaIcon = (
  vendorIcons as {
    icons: { [key: string]: { body: string; viewBox?: string } };
  }
).icons["meta"];
const bardIcon = vendorIcon.icons["bard-fill"];
const aiIcon = vendorIcon.icons["ai"];

export function OpenAIIcon({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={openaiIcon.viewBox || "0 0 24 24"}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: openaiIcon.body }}
    />
  );
}

export function ClaudeIcon({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={claudeIcon.viewBox || "0 0 24 24"}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: claudeIcon.body }}
    />
  );
}

export function DeepMindIcon({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={deepmindIcon.viewBox || "0 0 24 24"}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: deepmindIcon.body }}
    />
  );
}

export function IbmIcon({ width, height }: { width: number; height: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={ibmIcon.viewBox || "0 0 24 24"}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: ibmIcon.body }}
    />
  );
}

export function MetaIcon({ width, height }: { width: number; height: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={metaIcon.viewBox || "0 0 24 24"}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: metaIcon.body }}
    />
  );
}

export function BardIcon({ width, height }: { width: number; height: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={(bardIcon as { viewBox?: string }).viewBox || "0 0 24 24"}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: bardIcon.body }}
    />
  );
}

export function NucIcon({ width, height }: { width: number; height: number }) {
  return (
    <img
      src="https://cdn.nucleoid.com/greycollar/media/icon.png"
      alt="nuc"
      width={width}
      height={height}
      style={{ objectFit: "contain" }}
    />
  );
}

export function AiIcon({ width, height }: { width: number; height: number }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox={(aiIcon as { viewBox?: string }).viewBox || "0 0 24 24"}
      fill="currentColor"
      dangerouslySetInnerHTML={{ __html: aiIcon.body }}
    />
  );
}
