import { EC2Client, TerminateInstancesCommand } from "@aws-sdk/client-ec2";

function getClient(region?: string) {
  return new EC2Client({
    region: region || process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
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
