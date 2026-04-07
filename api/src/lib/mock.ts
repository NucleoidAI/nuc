type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

function tryParseString(value: string): string {
  let parsed: unknown = value;

  for (let i = 0; i < 3; i++) {
    if (typeof parsed !== "string") {
      break;
    }

    try {
      parsed = JSON.parse(parsed);
    } catch {
      break;
    }
  }

  if (typeof parsed === "string") {
    return parsed;
  }

  return JSON.stringify(parsed);
}

function extractJsonFormat(messages: Message[]): string {
  const formatMessage = messages
    .map((message) => tryParseString(message.content))
    .find((content) => content.includes("json_format:"));

  if (!formatMessage) {
    return "";
  }

  return formatMessage.toLowerCase();
}

function extractLastUserContent(messages: Message[]): string {
  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  if (!lastUserMessage) {
    return "";
  }

  return tryParseString(lastUserMessage.content).toLowerCase();
}

async function generate({
  messages = [],
}: {
  model?: string;
  messages?: Message[];
  temperature?: number;
  max_tokens?: number;
}) {
  const jsonFormat = extractJsonFormat(messages);
  const userContent = extractLastUserContent(messages);
  const isHelloMessage = userContent.includes("hello");

  if (isHelloMessage) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (jsonFormat.includes("decision")) {
      return {
        decision: "UNREVELANT",
      };
    }

    if (jsonFormat.includes("evaluation")) {
      return {
        evaluation: {
          is_answer_known: true,
        },
      };
    }

    if (jsonFormat.includes("answer")) {
      await new Promise((resolve) => setTimeout(resolve, 3000));

      return {
        answer: "Hello",
        confidence: 1,
      };
    }

    return {
      message: "Hello",
      result: "Hello",
    };
  }

  if (jsonFormat.includes("evaluation")) {
    return {
      evaluation: {
        is_answer_known: false,
      },
    };
  }

  if (jsonFormat.includes("answer")) {
    return {
      answer: "mock-llm: say 'hello'",
      confidence: 1,
    };
  }

  if (jsonFormat.includes("decision")) {
    return {
      decision: "UNREVELANT",
    };
  }

  return {
    message: "mock-llm: say 'hello'",
    result: "mock-llm: say 'hello'",
  };
}

export default { generate };
