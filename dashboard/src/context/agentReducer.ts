export const actionTypes = {
  SET_AGENT_TO_EDIT: "SET_AGENT_TO_EDIT",
  FETCH_AGENTS_DATA: "FETCH_AGENTS_DATA",
};

const initialState = {
  agentsData: [],
  agentToEdit: null,
};

const agentReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_AGENT_TO_EDIT:
      return { ...state, agentToEdit: action.payload };
    case actionTypes.FETCH_AGENTS_DATA:
      return { ...state, agentsData: action.payload };
    default:
      return state;
  }
};

export { initialState, agentReducer };
