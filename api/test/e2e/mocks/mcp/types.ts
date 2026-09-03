type ToolArgs = Record<string, unknown>;

type Reply = (args: ToolArgs) => unknown;

type Expectation = {
  args?: ToolArgs;
  reply?: Reply;
  error: boolean;
};

type ToolStub = {
  script: Expectation[];
  reply?: Reply;
  error: boolean;
  forbidden: boolean;
  calls: ToolArgs[];
};

export type { Expectation, Reply, ToolArgs, ToolStub };
