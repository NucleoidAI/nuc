import net from "node:net";

export type CapturedEmail = {
  from: string;
  to: string[];
  data: string;
};

/**
 * Dependency-free SMTP sink. `GREY:send_email` talks to it over plain SMTP so
 * the e2e suite can assert that an email was actually sent, and to whom,
 * without reaching a real mail provider.
 */
class SmtpSink {
  readonly emails: CapturedEmail[] = [];

  private server: net.Server | null = null;

  private port = 0;

  async listen(port = 0): Promise<number> {
    const server = net.createServer((socket) => this.handleConnection(socket));
    this.server = server;

    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, "127.0.0.1", () => {
        server.off("error", reject);
        resolve();
      });
    });

    this.port = (server.address() as net.AddressInfo).port;

    return this.port;
  }

  async close() {
    if (!this.server) return;
    const server = this.server;
    this.server = null;
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  reset() {
    this.emails.length = 0;
  }

  /** Emails whose envelope or body mentions `needle` (case-insensitive). */
  matching(needle: string) {
    const lowered = needle.toLowerCase();
    return this.emails.filter(
      (email) =>
        email.to.some((to) => to.toLowerCase().includes(lowered)) ||
        email.data.toLowerCase().includes(lowered)
    );
  }

  private handleConnection(socket: net.Socket) {
    let buffer = "";
    let inData = false;
    let envelope: CapturedEmail = { from: "", to: [], data: "" };

    const write = (line: string) => socket.write(`${line}\r\n`);

    write("220 greycollar-test ESMTP");

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf8");

      for (;;) {
        if (inData) {
          const terminator = buffer.indexOf("\r\n.\r\n");
          if (terminator === -1) return;

          envelope.data = buffer.slice(0, terminator);
          buffer = buffer.slice(terminator + 5);
          inData = false;

          this.emails.push(envelope);
          envelope = { from: "", to: [], data: "" };
          write("250 2.0.0 Ok: queued");
          continue;
        }

        const lineEnd = buffer.indexOf("\r\n");
        if (lineEnd === -1) return;

        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);

        const command = line.split(" ")[0].toUpperCase();

        if (command === "EHLO" || command === "HELO") {
          write("250-greycollar-test");
          write("250 8BITMIME");
        } else if (command === "MAIL") {
          envelope.from = extractAddress(line);
          write("250 2.1.0 Ok");
        } else if (command === "RCPT") {
          envelope.to.push(extractAddress(line));
          write("250 2.1.5 Ok");
        } else if (command === "DATA") {
          inData = true;
          write("354 End data with <CR><LF>.<CR><LF>");
        } else if (command === "RSET") {
          envelope = { from: "", to: [], data: "" };
          write("250 2.0.0 Ok");
        } else if (command === "NOOP") {
          write("250 2.0.0 Ok");
        } else if (command === "QUIT") {
          write("221 2.0.0 Bye");
          socket.end();
          return;
        } else {
          write("250 2.0.0 Ok");
        }
      }
    });

    socket.on("error", () => socket.destroy());
  }
}

function extractAddress(line: string) {
  const match = line.match(/<([^>]*)>/);
  return match ? match[1] : line.split(":").slice(1).join(":").trim();
}

export default SmtpSink;
