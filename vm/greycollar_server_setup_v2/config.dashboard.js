const config = {
  appId: "10b7bc8c-a49c-4002-b0ec-63599e4b5210",
  name: "DOCKER",
  base: "/dashboard",
  beta: true,
  api: "http://greycollar:3000/api",
  socket: {
    host: "http://communication:3003",
    path: "/socket.io",
  },
  project: {},
};

export default config;
