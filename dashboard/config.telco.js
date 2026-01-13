const config = {
    appId: "10b7bc8c-a49c-4002-b0ec-63599e4b5210",
    name: "GreyCollar",
    base: "/dashboard",
    beta: true,
    api: "http://localhost:3000/api",
    socket: {
      host: "http://localhost:3003",
      path: "/socket.io",
    },
    project: {
      github: {
        authUrl: "https://github.com/login/oauth/authorize",
        redirectUri: "http://localhost:3000/dashboard/callback",
        userUrl: `http://localhost:3000/api/oauth/mock/github/user`,
        clientId: "demo-client-id",
        scope: "user",
        response_type: "code",
      },
    },
  };
  
  export default config;