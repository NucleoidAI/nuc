import platform from "@canmingir/link-express";

async function init() {
  const {
    Postgres: { sequelize },
  } = await platform.getModules();
  const models = sequelize.models;

  // Blueprint <-> Channel
  models.Blueprint.hasMany(models.Channel, {
    foreignKey: "blueprintId",
  });
  models.Channel.belongsTo(models.Blueprint, {
    foreignKey: "blueprintId",
  });

  // Blueprint <-> BlueprintMessage
  models.Blueprint.hasMany(models.BlueprintMessage, {
    foreignKey: "blueprintId",
    as: "messages",
  });
  models.BlueprintMessage.belongsTo(models.Blueprint, {
    foreignKey: "blueprintId",
  });

  // Project <-> Agent
  models.Project.hasMany(models.Agent, {
    foreignKey: "teamId",
    as: "agents",
  });
  models.Agent.belongsTo(models.Project, {
    foreignKey: "teamId",
    as: "agents",
  });

  // Agent <-> Blueprint
  models.Agent.hasMany(models.Blueprint, {
    foreignKey: "agentId",
  });
  models.Blueprint.belongsTo(models.Agent, {
    foreignKey: "agentId",
  });

  // AIEngine <-> Agent
  models.AIEngine.hasMany(models.Agent, {
    foreignKey: "aiEngineId",
  });
  models.Agent.belongsTo(models.AIEngine, {
    foreignKey: "aiEngineId",
  });

  // Project <-> Command
  models.Project.hasMany(models.Command, {
    foreignKey: "teamId",
  });
  models.Command.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  // TeamMessage <-> Agent
  models.TeamMessage.belongsTo(models.Agent, {
    foreignKey: "agentId",
  });

  // MCPProvider <-> MCPServer
  models.MCPProvider.hasMany(models.MCPServer, {
    foreignKey: "mcpProviderId",
    as: "servers",
  });
  models.MCPServer.belongsTo(models.MCPProvider, {
    foreignKey: "mcpProviderId",
    as: "provider",
  });

  // MCPServer <-> MCPServerAssignment
  models.MCPServer.hasMany(models.MCPServerAssignment, {
    foreignKey: "serverId",
    as: "assignments",
    onDelete: "CASCADE",
  });
  models.MCPServerAssignment.belongsTo(models.MCPServer, {
    foreignKey: "serverId",
    as: "server",
  });

  // MCPServerAssignment <-> Project / Agent
  models.MCPServerAssignment.belongsTo(models.Project, {
    foreignKey: "teamId",
  });
  models.MCPServerAssignment.belongsTo(models.Agent, {
    foreignKey: "agentId",
  });

  // MCPServer <-> MCPServerEnv
  models.MCPServer.hasMany(models.MCPServerEnv, {
    foreignKey: "serverId",
    as: "envs",
    onDelete: "CASCADE",
  });
  models.MCPServerEnv.belongsTo(models.MCPServer, {
    foreignKey: "serverId",
    as: "server",
  });

  // AgentKnowledge associations
  models.AgentKnowledge.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  models.AgentKnowledge.belongsTo(models.Agent, {
    foreignKey: "agentId",
  });

  models.Project.belongsToMany(models.Agent, {
    through: models.AgentKnowledge,
    foreignKey: "teamId",
    otherKey: "agentId",
  });

  models.Agent.belongsToMany(models.Project, {
    through: models.AgentKnowledge,
    foreignKey: "agentId",
    otherKey: "teamId",
  });

  models.Agent.hasMany(models.AgentKnowledge, {
    foreignKey: "agentId",
  });

  // Knowledge <-> AgentKnowledge
  models.Knowledge.hasOne(models.AgentKnowledge, {
    foreignKey: "knowledgeId",
  });
  models.AgentKnowledge.belongsTo(models.Knowledge, {
    foreignKey: "knowledgeId",
  });

  // Knowledge <-> Task
  models.Knowledge.belongsTo(models.Task, {
    foreignKey: "taskId",
  });
  models.Task.hasOne(models.Knowledge, {
    foreignKey: "taskId",
  });

  // Statistics <-> Project
  models.Statistics.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  // TeamDetails <-> Project
  models.Project.hasOne(models.TeamDetails, {
    foreignKey: "id",
  });
  models.TeamDetails.belongsTo(models.Project, {
    foreignKey: "id",
  });

  models.Session.hasMany(models.Supervising, {
    foreignKey: "sessionId",
    as: "supervisings",
  });
  models.Session.hasMany(models.Conversation, {
    foreignKey: "sessionId",
    as: "conversations",
  });
  models.Session.belongsToMany(models.Supervising, {
    through: "SessionSupervising",
    foreignKey: "sessionId",
  });

  // Supervising associations
  models.Supervising.belongsTo(models.Session, {
    foreignKey: "sessionId",
  });
  models.Supervising.belongsTo(models.Conversation, {
    foreignKey: "conversationId",
  });
  models.Supervising.belongsTo(models.Agent, {
    foreignKey: "agentId",
  });
  models.Agent.hasMany(models.Supervising, {
    foreignKey: "agentId",
  });

  // Supervising <-> Blueprint
  models.Supervising.belongsTo(models.Blueprint, {
    foreignKey: "blueprintId",
  });
  models.Blueprint.hasMany(models.Supervising, {
    foreignKey: "blueprintId",
  });

  // Conversation <-> Session
  models.Conversation.belongsTo(models.Session, {
    foreignKey: "sessionId",
    as: "session",
  });

  // Task <-> Agent
  models.Task.belongsTo(models.Agent, {
    foreignKey: "agentId",
    onDelete: "CASCADE",
  });
  models.Agent.hasMany(models.Task, {
    foreignKey: "agentId",
    onDelete: "CASCADE",
  });

  // Task <-> Step
  models.Task.hasMany(models.Step, {
    foreignKey: "taskId",
    as: "steps",
  });
  models.Step.belongsTo(models.Task, {
    foreignKey: "taskId",
    as: "task",
  });

  // Task <-> StepScore
  models.Task.hasMany(models.StepScore, {
    foreignKey: "taskId",
    as: "scores",
  });
  models.StepScore.belongsTo(models.Task, {
    foreignKey: "taskId",
    as: "task",
  });

  // Step <-> StepScore
  models.Step.hasMany(models.StepScore, {
    foreignKey: "stepId",
    as: "scores",
  });
  models.StepScore.belongsTo(models.Step, {
    foreignKey: "stepId",
    as: "step",
  });

  // Task <-> Blueprint
  models.Blueprint.hasMany(models.Task, {
    foreignKey: "blueprintId",
  });
  models.Task.belongsTo(models.Blueprint, {
    foreignKey: "blueprintId",
  });

  // Hooks
  models.Project.addHook("beforeDestroy", async (project: any) => {
    await models.Agent.destroy({ where: { teamId: project.id } });
    await models.AgentKnowledge.destroy({ where: { teamId: project.id } });
    await models.TeamDetails.destroy({ where: { id: project.id } });
  });

  models.Agent.addHook("beforeDestroy", async (agent: any) => {
    await models.Supervising.destroy({ where: { agentId: agent.id } });
    await models.AgentKnowledge.destroy({
      where: { agentId: agent.id },
    });
    await models.MCPServerAssignment.destroy({ where: { agentId: agent.id } });
    await models.MCPServerEnv.destroy({ where: { agentId: agent.id } });
  });

  models.MCPServer.addHook("beforeDestroy", async (server) => {
    const serverId = server.getDataValue("id");

    await models.MCPServerEnv.destroy({ where: { serverId } });
    await models.MCPServerAssignment.destroy({ where: { serverId } });
  });

  models.TeamMessage.addHook("beforeCreate", async (message: any) => {
    if (message.role === "USER") {
      message.status = "READ";
    } else if (message.role === "ASSISTANT") {
      message.status = null;
    }
  });
}

export default { init };
