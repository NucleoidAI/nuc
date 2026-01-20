import platform from "@canmingir/link-express";

async function init() {
  const {
    Postgres: { sequelize },
  } = await platform.getModules();
  const models = sequelize.models;

  // Blueprint <-> Communication
  models.Blueprint.hasMany(models.Communication, {
    foreignKey: "blueprintId",
  });
  models.Communication.belongsTo(models.Blueprint, {
    foreignKey: "blueprintId",
  });

  // Project <-> Colleague
  models.Project.hasMany(models.Colleague, {
    foreignKey: "teamId",
    as: "colleagues",
  });
  models.Colleague.belongsTo(models.Project, {
    foreignKey: "teamId",
    as: "colleagues",
  });

  // Colleague <-> Blueprint
  models.Colleague.hasMany(models.Blueprint, {
    foreignKey: "agentId",
  });
  models.Blueprint.belongsTo(models.Colleague, {
    foreignKey: "agentId",
  });

  // AIEngine <-> Colleague
  models.AIEngine.hasMany(models.Colleague, {
    foreignKey: "aiEngineId",
  });
  models.Colleague.belongsTo(models.AIEngine, {
    foreignKey: "aiEngineId",
  });

  // Project <-> Command
  models.Project.hasMany(models.Command, {
    foreignKey: "teamId",
  });
  models.Command.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  // Message <-> Colleague
  models.Message.belongsTo(models.Colleague, {
    foreignKey: "agentId",
  });

  // MCP <-> Project (many-to-many)
  models.MCP.belongsToMany(models.Project, {
    through: "MCP",
    foreignKey: "id",
  });
  models.Project.belongsToMany(models.MCP, {
    through: "MCP",
    foreignKey: "teamId",
  });

  // MCP <-> Colleague
  models.MCP.belongsTo(models.Colleague, {
    foreignKey: "agentId",
  });

  // MCP <-> Project (belongsTo)
  models.MCP.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  // ColleagueKnowledge associations
  models.ColleagueKnowledge.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  models.ColleagueKnowledge.belongsTo(models.Colleague, {
    foreignKey: "agentId",
  });

  models.Project.belongsToMany(models.Colleague, {
    through: models.ColleagueKnowledge,
    foreignKey: "projectId",
  });

  models.Colleague.belongsToMany(models.Project, {
    through: models.ColleagueKnowledge,
    foreignKey: "agentId",
  });

  models.Colleague.hasMany(models.ColleagueKnowledge, {
    foreignKey: "agentId",
  });

  // Knowledge <-> ColleagueKnowledge
  models.Knowledge.hasOne(models.ColleagueKnowledge, {
    foreignKey: "knowledgeId",
  });
  models.ColleagueKnowledge.belongsTo(models.Knowledge, {
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
  models.Supervising.belongsTo(models.Colleague, {
    foreignKey: "agentId",
  });
  models.Colleague.hasMany(models.Supervising, {
    foreignKey: "agentId",
  });

  // Conversation <-> Session
  models.Conversation.belongsTo(models.Session, {
    foreignKey: "sessionId",
    as: "session",
  });

  // Task <-> Colleague
  models.Task.belongsTo(models.Colleague, {
    foreignKey: "agentId",
    onDelete: "CASCADE",
  });
  models.Colleague.hasMany(models.Task, {
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

  // Task <-> Blueprint
  models.Task.hasOne(models.Blueprint, {
    foreignKey: "blueprintId",
  });
  models.Blueprint.belongsTo(models.Task, {
    foreignKey: "blueprintId",
  });

  // Hooks
  models.Project.addHook("beforeDestroy", async (project: any) => {
    await models.Colleague.destroy({ where: { teamId: project.id } });
    await models.ColleagueKnowledge.destroy({ where: { teamId: project.id } });
    await models.TeamDetails.destroy({ where: { id: project.id } });
  });

  models.Colleague.addHook("beforeDestroy", async (colleague: any) => {
    await models.Supervising.destroy({ where: { agentId: colleague.id } });
    await models.ColleagueKnowledge.destroy({
      where: { agentId: colleague.id },
    });
  });

  models.Message.addHook("beforeCreate", async (message: any) => {
    if (message.role === "USER") {
      message.status = "READ";
    } else if (message.role === "ASSISTANT") {
      message.status = null;
    }
  });
}

export default { init };
