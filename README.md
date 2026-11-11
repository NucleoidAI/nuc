<h1 align="center">nuc</h1>
<p align="center">
  <b>Supervised AI Agent</b>
</p>

<p align="center">
  <a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/Apache-2.0-yellow?style=for-the-badge&logo=apache" alt="License" /></a>
  <a href="https://www.npmjs.com/package/nuc"><img src="https://img.shields.io/badge/NPM-red?style=for-the-badge&logo=npm" alt="NPM" /></a>
  <a href="https://discord.gg/wNmcnkDnkM"><img src="https://img.shields.io/badge/Discord-lightgrey?style=for-the-badge&logo=discord" alt="Discord" /></a>
</p>

nuc AI is a supervised AI agent platform for human–AI collaboration. The platform provides an environment to continuously learn from human supervisors, so they can adapt to real-world workloads.

Each AI agent works within defined blueprints and uses a knowledge base to complete tasks. When uncertain, they escalate to human supervisors—enabling **"Hallucination Control"** to prevent mistakes.

## Human-AI Collabs (Human-in-the-Loop)

Human-in-the-Loop (HITL) is a collaborative approach where AI agents work alongside human experts to enhance decision-making, automate processes, and refine task execution. In this model, human supervision plays a key role in guiding, correcting, and improving AI-driven workflows.

- **Improved Accuracy** – Human feedback enables AI agents to refine responses in real time, reducing errors and increasing reliability.
- **Continuous Learning** – AI adapts to new tasks and domains by integrating ongoing human input, improving with every interaction.
- **Safe & Responsible AI** – Human oversight ensures ethical alignment, reduces bias, and mitigates unintended or harmful outputs.
- **Operational Efficiency** – AI handles routine, repetitive work at scale, freeing human supervisors to focus on higher-value, strategic decisions.

## Get Started

```
git clone https://github.com/nuc/nuc.git
npm install

// Add env variables
JWT_SECRET=<JWT_SECRET>
PLATFORM_LLM=OPENAI
OAUTH_CLIENT_SECRET=<OAUTH_CLIENT_SECRET>
OPENAI_API_KEY=<OPENAI_API_KEY>
```

```
npm start
```

This will start three applications simultaneously: Dashboard, API Server and Proxy Server. Once started, the dashboard should be accessible in your browser at http://localhost:3000

Learn more at [https://nuc.ai/docs](https://nuc.ai/docs)

## ⚡n8n Integration

nuc can be part of your favorite flow tools like n8n, enabling you to embed supervised AI directly into automated workflows.

<br/>
<table>
  <tr>
    <td>
      Welcome! I’ve been expecting you—"Skynet was gone. And now one road has become many." 🌐
      <br/>
      <br/>
      The future is building up! AI Agents are now an emerging field within AI communities and marks a crucial milestone on the journey to AGI. Just like any other tooling in computer science, we must be mindful of when and where to use them.
      LangChain, or LlamaIndex might be a better fit if your application has a static flow—where AI doesn't need to make dynamic decisions—like in ChatBots, RAG etc. That said, if your business rules are well-defined and deterministic, there’s no shame in coding them directly!
      <br/>
      <br/>
      However, if you need continuous learning combined with autonomous decision-making—in other words, true AI Agent—nuc may suit you well. Choosing the right tool for the job is key.
      <br/>
      <br/>
      <p align="right">
        Can Mingir&nbsp;
        <br/>
        <a href="https://github.com/canmingir">@canmingir</a>
      </p>
    </td>
  </tr>
</table>
<br/>

## Features

![nuc](https://github.com/user-attachments/assets/cedf7872-e4b8-46fe-a2b5-306fb7cb12b5)

- [Agent (AI)](#agent-ai): AI assistants that handle tasks based on assigned blueprints and knowledge.
- [Supervising (Human)](#supervising-human): Humans who guide AI with feedback, questions, or extra info.
- [Knowledge](#knowledge): The info AI uses—documents, FAQs, or other sources.
- [Blueprint and Task](#blueprint-and-task): Defines what tasks the AI performs and how.
- [Team](#team): A group of AI agents for managing knowledge and leadership.
- [Communication](#communication): How you interact with AI—via chat, email, Slack, WhatsApp, etc.
- [Integration](#integration): Connects to third-party tools via Model Context Protocol (MCP).

## Agent (AI)

![Agent Page](https://cdn.nucleoid.com/nuc/media/5afbf454-97dc-45a9-bc4d-14fb69d6b1f9.png)

Agents are AI assistants that help you with your tasks based on blueprints and knowledge. They are designed to:

- Complete tasks standalone for given blueprints
- Continuously learn and persist to knowledge base
- Collaborate with other human supervisors or human agents

## Supervising (Human)

![Supervising](https://cdn.nucleoid.com/nuc/media/c09ef87d-7453-4a49-9b31-c56a0aaaa03f.png)

Supervising by human is raised when the AI is not able to complete the task or needs human input. The supervisor can provide feedback, ask questions, or give additional information to help the AI complete the task.

> :warning: This is the core concept to eliminate hallucination that the AI evaluates knowledge existed before the execution of the task.

## Knowledge

![Knowledge Base](https://cdn.nucleoid.com/nuc/media/e10ddf80-499f-45da-9182-7284fcc21bf0.png)

Knowledge is the information that the AI uses when working on blueprints. It can be in the form of documents, FAQs, or any other.

> Knowledge can be added manually or part of the supervising process during task execution.

## Blueprint and Task

![Blueprint](https://cdn.nucleoid.com/nuc/media/d12714f4-e584-4020-92cb-62a25664e14d.png)

Blueprint is a blueprint of the tasks that the AI will perform based on knowledge. It defines what the AI can do and how it can help you.

> Tasks are the actions that the AI performs for a given blueprint with knowledge. Once the task is initiated through communication, the AI will execute the task and provide feedback to the supervisor.

## Team

![Team](https://cdn.nucleoid.com/nuc/media/8046f722-d9c0-487f-89b2-a4e3aafc1874.png)

Team is a logical grouping of AI agents. Mainly this grouping provides 2 major benefits:

- **Knowledge Management**: Knowledge can be shared between AI agents within the team, while each agent can also maintain their own individual knowledge. In agentic AI, effective knowledge management is crucial to eliminate hallucinations, ensuring that each AI agent has sufficient knowledge to complete tasks without being misled by irrelevant or unnecessary information. a
- **Team Lead**: The team lead is the person responsible for handing off the task to the AI agents.

## Communication

![Communication](https://cdn.nucleoid.com/nuc/media/1f23108d-5f9d-4b20-8064-3679ee43289b.png)

Communication is the primary way to interact with AI agents. It can occur through various channels, such as chat, email, or voice, depending on the context and user preferences. These communication channels are linked to specific blueprints that AI agents are capable of handling, ensuring interactions are efficient and task-relevant. Multiple channels can be used simultaneously, allowing for flexibility in how users engage with AI agents.

> In short, communication opens up AI agents to the outside world, enabling them to perform tasks.

## Integration

![Integration](https://cdn.nucleoid.com/nuc/media/4a1ef3f7-172a-49ea-a782-ac170d335640.png)

All integrations are based on MCP that allows you to connect to any third-party service. The integration can be used for bidirectional communication:

- Incoming: Pulling data such as reading from Google Drive or checking Google Calendar 
- Outgoing: Sending data such as writing to Google Drive or posting to a Slack channel

## Event-Driven Agentic AI Platform

nuc is an **Event-Driven AI Agent Platform** designed for dynamic and adaptive AI workflows and autonomous decision-making. While frameworks like LangChain and LlamaIndex are specialized in creating static flows, but it is significantly more challenging to have flexible AI agent compared to event-drive architecture.

Key Advantages:

**⚡ Dynamic Workflows:**

- Instead of a rigid sequence of actions, nuc agents react to events in real-time. These events could be anything: a new email, a sensor reading, a user interaction, or even the output of another AI agent.
- This allows for highly adaptable and context-aware behavior. The agent's next action is determined by the current situation, not a pre-programmed path.

**🧠 Autonomous Decision-Making:**

- Agents can make decisions without constant human intervention. They can monitor their environment, identify relevant events, and take appropriate actions based on predefined rules or learned behaviors.
- This is crucial for applications that require rapid response times or operate in dynamic environments.

**🔄 Modularity and Scalability:**

- Event-driven systems are naturally modular. Agents can be designed as independent components that communicate with each other through events.
- This makes it easier to build complex systems by combining smaller, specialized agents. It also allows for easier scaling, as new agents can be added without disrupting the existing system.

**🔍 Real-time responsiveness:**

- Because the system is based on events, it can react very quickly to changes in the enviroment. This is very important for applications that need to be up to date.

### Hello World

```
Customer: "Do you have a parking spot at your store?"
> SESSION.USER_MESSAGED
{
  sessionId: "2116847c",
  content: "Do you ... at your store?"
}

AI: "Please wait a moment while working on the answer."
> SUPERVISING.RAISED
{
  sessionId: "2116847c",
  question: "Do you ... at your store?"
}

Supervisor: "Yes, we have a parking spot in the back of the store."
> SUPERVISING.ANSWERED
{
  sessionId: "2116847c",
  question: "Yes, we have ... of the store."
}

# Knowledge is stored for future reference. 🧠

AI: "Yes, we have a parking spot in the back of the store."

> SESSION.USER_MESSAGED
{
  sessionId: "2116847c",
  question: "Yes, we have ... of the store."
}

# A Few Moments Later... 🍍

Customer #2: "Planning to come down there, how is parking situation?"

> SESSION.USER_MESSAGED
{
  sessionId: "3746a52b",
  content: "Planning ... situation?"
}

AI: "Yes, most certainly, we have a parking spot in the back. 😎"
> SESSION.USER_MESSAGED
{
  sessionId: "3746a52b",
  question: "Yes, most ... in the back."
}
```

---

<p align="center">
  <b>🚀 Join us on GitHub</b>
  <br/>
Thanks to supervised learning, we’re taking a fresh approach to AI agents. Join us in shaping the future of human–AI collabs — we welcome all kinds of contributions!
</p>

<p align="center">
  <img src="https://cdn.nucleoid.com/media/nobel.png" alt="Nobel" />
</p>

---
