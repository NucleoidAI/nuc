import config from "../../config";
import { storage } from "@nucleoidjs/webstorage";

import { Socket, io } from "socket.io-client";
import { useEffect, useRef } from "react";

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = storage.get("link", "accesstoken");

    socketRef.current = io(config.api, {
      auth: {
        token: token,
      },
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return socketRef.current;
};
