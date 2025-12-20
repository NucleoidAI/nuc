import { sendEmailTool } from "./servers/grey/tools/send_email";

async function testEmail() {
  console.log("Testing email sending...\n");

  const result = await sendEmailTool.handler({
    to: "halilibrahimcengel7@gmail.com",
    subject: "Test Email from MCP Server",
    text: "Hello! This is a test email sent from the MCP server.",
    html: "<h1>Hello!</h1><p>This is a <strong>test email</strong> sent from the MCP server.</p>",
  });

  if (result.isError) {
    console.error("❌ Email sending failed:");
    console.error(result.content[0].text);
  } else {
    console.log("✅ Email sent successfully!");
    console.log(result.content[0].text);
  }
}

testEmail().catch(console.error);
