import {
  DescribeImagesCommand,
  EC2Client,
  RunInstancesCommand,
  _InstanceType,
} from "@aws-sdk/client-ec2";

function getClient(region?: string) {
  return new EC2Client({
    region: region || process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: "AKIARMHNCORBKDQDRLEP",
      secretAccessKey: "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",
    },
  });
}

async function resolveLatestAmazonLinuxAmi(client: EC2Client) {
  const { Images } = await client.send(
    new DescribeImagesCommand({
      Owners: ["amazon"],
      Filters: [
        { Name: "name", Values: ["al2023-ami-2023*-x86_64"] },
        { Name: "state", Values: ["available"] },
      ],
    }),
  );

  const latest = (Images || []).sort((a, b) =>
    (b.CreationDate || "").localeCompare(a.CreationDate || ""),
  )[0];

  return latest?.ImageId;
}

async function run({
  parameters: {
    name,
    instanceType = "t3.micro",
    amiId,
    keyName,
    subnetId,
    securityGroupIds,
    region,
  },
}: {
  parameters: {
    name: string;
    instanceType?: string;
    amiId?: string;
    keyName?: string;
    subnetId?: string;
    securityGroupIds?: string[];
    region?: string;
  };
}) {
  const client = getClient(region);
  const clientRegion = region || process.env.AWS_REGION || "us-east-1";

  console.log(
    `[create_vm] start name=${name} instanceType=${instanceType} region=${clientRegion} amiId=${
      amiId || "(resolve latest)"
    }`,
  );

  try {
    let imageId = amiId;
    if (!imageId) {
      console.log("[create_vm] resolving latest Amazon Linux 2023 AMI...");
      imageId = await resolveLatestAmazonLinuxAmi(client);
      console.log(`[create_vm] resolved AMI: ${imageId}`);
    }

    if (!imageId) {
      return { error: "No AMI provided and no Amazon Linux 2023 AMI found" };
    }

    console.log(
      `[create_vm] calling RunInstancesCommand with AMI ${imageId}...`,
    );

    const { Instances } = await client.send(
      new RunInstancesCommand({
        ImageId: imageId,
        InstanceType: instanceType as _InstanceType,
        MinCount: 1,
        MaxCount: 1,
        KeyName: keyName,
        SubnetId: subnetId,
        SecurityGroupIds: securityGroupIds,
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: [{ Key: "Name", Value: name }],
          },
        ],
      }),
    );

    console.log("[create_vm] RunInstancesCommand returned");

    const instance = Instances?.[0];

    if (!instance) {
      return { error: "Instance creation returned no instance" };
    }

    return {
      success: true,
      instanceId: instance.InstanceId,
      imageId: instance.ImageId,
      instanceType: instance.InstanceType,
      state: instance.State?.Name,
      privateIp: instance.PrivateIpAddress,
      publicIp: instance.PublicIpAddress,
      availabilityZone: instance.Placement?.AvailabilityZone,
    };
  } catch (error) {
    console.log(`[create_vm] error: ${(error as Error).message}`);
    return { error: (error as Error).message };
  }
}

export default { run };
