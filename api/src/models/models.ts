import platform from "@canmingir/link-express";

async function init() {
  /*
  const {
    Postgres: { sequelize },
  } = platform.getModules();

  const models = sequelize.models;
 
  // Use models directly from the object instead of destructuring
  // This ensures we're using the exact references Sequelize has

  // AIEngine <-> Colleague
  models.AIEngine.hasMany(models.Colleague, {
    foreignKey: "aiEngineId",
    as: "colleagues",
  });
  models.Colleague.belongsTo(models.AIEngine, {
    foreignKey: "aiEngineId",
    as: "AIEngine",
  });

  // Project <-> Colleague
  models.Project.hasMany(models.Colleague, {
    foreignKey: "teamId",
    as: "colleagues",
  });
  models.Colleague.belongsTo(models.Project, {
    foreignKey: "teamId",
    as: "project",
  });

  // Command -> Project
  models.Command.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  // Message -> Colleague
  models.Message.belongsTo(models.Colleague, {
    foreignKey: "colleagueId",
  });

  // Integration -> Project
  models.Integration.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  // ColleagueKnowledge -> Project & Colleague
  models.ColleagueKnowledge.belongsTo(models.Project, {
    foreignKey: "teamId",
  });
  models.ColleagueKnowledge.belongsTo(models.Colleague, {
    foreignKey: "colleagueId",
  });

  // Statistics -> Project
  models.Statistics.belongsTo(models.Project, {
    foreignKey: "teamId",
  });

  // TeamDetails -> Project
  models.TeamDetails.belongsTo(models.Project, {
    foreignKey: "id",
  });

  // Session associations
  models.Session.belongsTo(models.Project, {
    foreignKey: "teamId",
  });
  models.Session.hasMany(models.Supervising, {
    foreignKey: "sessionId",
    as: "supervisings",
  });
  models.Session.hasMany(models.Conversation, {
    foreignKey: "sessionId",
    as: "conversations",
  });

  // Supervising -> Session
  models.Supervising.belongsTo(models.Session, {
    foreignKey: "sessionId",
  });

  // Conversation -> Session
  models.Conversation.belongsTo(models.Session, {
    foreignKey: "sessionId",
    as: "session",
  });
  */

  // Hooks
  models.Project.addHook("beforeDestroy", async (project: any) => {
    await models.Colleague.destroy({ where: { teamId: project.id } });
    await models.ColleagueKnowledge.destroy({ where: { teamId: project.id } });
    await models.TeamDetails.destroy({ where: { id: project.id } });
  });

  models.Colleague.addHook("beforeDestroy", async (colleague: any) => {
    await models.Supervising.destroy({ where: { colleagueId: colleague.id } });
    await models.ColleagueKnowledge.destroy({
      where: { colleagueId: colleague.id },
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
