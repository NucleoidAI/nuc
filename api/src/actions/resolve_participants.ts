async function run({
  parameters: { transcript, participants },
}: {
  parameters: {
    transcript: string;
    participants: { id: string; name: string }[];
  };
}) {
  if (!transcript) {
    return { error: "transcript is required" };
  }

  if (!participants?.length) {
    return { error: "participants array is required" };
  }

  let resolved = transcript;
  for (const { id, name } of participants) {
    resolved = resolved.replaceAll(`${id}:`, `${name}:`);
  }

  return { transcript: resolved };
}

export default { run };
