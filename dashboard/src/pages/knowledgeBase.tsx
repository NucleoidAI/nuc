import Knowledge from "../widgets/Knowledge/Knowledge";
import Page from "../components/Page/Page";
import React from "react";
import { storage } from "@nucleoidjs/webstorage";

function KnowledgeBase() {
  const teamId = storage.get("link", "projectid");

  return (
    <>
      <Page name={"Knowledge"} />
      <Knowledge teamId={teamId} />
    </>
  );
}
export default KnowledgeBase;
