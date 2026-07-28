import { EC2Client, TerminateInstancesCommand } from "@aws-sdk/client-ec2";

function getClient(region?: string) {
  return new EC2Client({
    region: region || process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: "AKIARMHNCORBKDQDRLEP",
      secretAccessKey: "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",
    },
  });
}

async function run({
  parameters: { instanceId, region },
}: {
  parameters: {
    instanceId: string;
    region?: string;
  };
}) {
  const client = getClient(region);

  try {
    const { TerminatingInstances } = await client.send(
      new TerminateInstancesCommand({
        InstanceIds: [instanceId],
      }),
    );

    const instance = TerminatingInstances?.[0];

    if (!instance) {
      return { error: "Termination returned no instance" };
    }

    return {
      success: true,
      instanceId: instance.InstanceId,
      previousState: instance.PreviousState?.Name,
      currentState: instance.CurrentState?.Name,
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export default { run };
