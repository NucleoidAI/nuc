export const treeToLinked = (tree) => {
  if (!tree) return { nodes: {}, roots: [] };

  const nodes = {};
  const roots = [];

  const walk = (node, parentId = null) => {
    if (!node || !node.id) return;

    const { children, ...rest } = node;
    if (!nodes[node.id]) {
      nodes[node.id] = { ...rest, id: node.id };
    }

    const kids = Array.isArray(children) ? children : [];
    const nextIds = kids.map((c) => c.id).filter(Boolean);

    if (nextIds.length === 1) {
      nodes[node.id].next = nextIds[0];
    } else if (nextIds.length > 1) {
      nodes[node.id].next = nextIds;
    }

    if (parentId) {
      nodes[node.id].previous = parentId;
    } else if (!roots.includes(node.id)) {
      roots.push(node.id);
    }

    kids.forEach((child) => walk(child, node.id));
  };

  walk(tree);
  return { nodes, roots };
};

export const toTeamTree = (teams, Blueprints) => {
  if (!teams || teams.length === 0) return null;

  const team = teams[0];

  return {
    id: team.id,
    nodeKind: "team",
    name: team.name,
    icon: team.icon,
    description: team.description,
    type: team.type,
    organizationId: team.organizationId,
    coach: team.coach,
    children: (team.colleagues || []).map((c) => {
      const colleagueBlueprints = (Blueprints || []).filter(
        (r) => r.agentId === c.id
      );

      return {
        id: c.id,
        nodeKind: "colleague",
        name: c.name,
        icon: c.icon,
        teamId: c.teamId,
        description: c.description,
        aiEngineId: c.aiEngineId,
        children: colleagueBlueprints.map((r) => ({
          id: r.id,
          nodeKind: "Blueprint",
          title: r.title,
          description: r.description,
          nodes: r.nodes,
          agentId: r.agentId,
        })),
      };
    }),
  };
};
