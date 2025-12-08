import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import EnginesChart from "../AIMarketplace/AIMarketplaceCard";
import { Iconify } from "@canmingir/link/platform/components";
import ItemSummary from "../../components/ItemSummary/ItemSummary";
import React from "react";
import SelectAvatar from "../../components/AvatarSelector/AvatarSelector";
import SparkleInput from "../../components/SparkleInput/SparkleInput";
import StepComponent from "../../components/StepComponent/StepComponent";

import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Divider,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

function ColleagueWizard({
  itemProperties,
  onSubmit,
  open,
  onClose,
  itemToEdit,
}) {
  const sampleColleagues = [
    {
      name: "system_agent",
      avatar: "mingcute:bank-card-line",
      src: `https://cdn.nucleoid.com/greycollar/avatars/2.jpg`,
      aiEngineId: "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
      engineName: "OpenAI",
      description:
        "A system-focused agent designed to support technical workflows, optimize architecture decisions, and improve reliability across operations.",
    },
    {
      name: "insight_agent",
      avatar: "ph:coffee-bean-duotone",
      src: `https://cdn.nucleoid.com/greycollar/avatars/5.jpg`,
      aiEngineId: "d9c93323-3baf-4623-a96c-b85db99b4441",
      engineName: "Claude",
      description:
        "An insight-driven agent that analyzes information, identifies patterns, and provides clear, data-backed guidance for decision-making.",
    },
    {
      name: "coordination_agent",
      avatar: "ph:fire-simple-duotone",
      src: `https://cdn.nucleoid.com/greycollar/avatars/8.jpg`,
      aiEngineId: "123a3c9a-b23b-421a-ac6e-f14052a2d57c",
      engineName: "DeepMind",
      description:
        "A coordination agent built to streamline communication, align processes, and manage multi-step workflows across teams and systems.",
    },
  ];

  const steps = ["Name", "Description", "Engine", "Summary"];

  const stepExp = [
    "Give colleague a name and select an avatar that reflects your colleague",
    "Define your colleague's description and responsibilities.",
    "Select your colleague's engine. this will determine your colleague's engine.",
    "Review and confirm the details of your new colleague.",
  ];

  const names = [
    "core_agent",
    "logic_agent",
    "ops_agent",
    "task_agent",
    "flow_agent",
    "insight_agent",
    "system_agent",
    "service_agent",
    "assist_agent",
    "analysis_agent",
  ];

  const descriptions = [
    "A core automation agent designed for general workflow execution.",
    "A logic-driven agent that assists with decision steps and rule-based operations.",
    "An operations-focused agent optimized for task handling and process stability.",
    "An analysis agent that interprets data, identifies patterns, and provides insights.",
    "A service-oriented agent built to support requests, coordination, and communication.",
  ];

  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const [newItem, setNewItem] = useState(
    itemProperties.reduce((obj, property) => ({ ...obj, [property]: "" }), {})
  );

  const handleTemplateSelect = (colleague) => {
    setNewItem(colleague);
    setActiveStep(3);
  };

  useEffect(() => {
    if (itemToEdit) {
      setNewItem(itemToEdit);
    } else if (!open) {
      setNewItem(
        itemProperties.reduce(
          (obj, property) => ({ ...obj, [property]: "" }),
          {}
        )
      );
    }
  }, [open, itemProperties, itemToEdit]);

  const handleSave = () => {
    if (newItem.id) {
      onSubmit(newItem);
    } else {
      onSubmit(newItem);
    }
    onClose();
    setActiveStep(0);
  };

  const handleEmojiSelect = (emoji) => {
    setNewItem((prevItem) => {
      return {
        ...prevItem,
        avatar: `:${emoji.id}:`,
        src: `${emoji.src}`,
      };
    });
  };

  const handleInputChange = (property) => (event) => {
    setNewItem({ ...newItem, [property]: event.target.value });
  };

  const handleRandomValue = (property) => {
    let randomValue;
    switch (property) {
      case "name":
        randomValue = names[Math.floor(Math.random() * names.length)];
        break;
      case "description":
        randomValue =
          descriptions[Math.floor(Math.random() * descriptions.length)];
        break;
      default:
        randomValue = "";
    }
    setNewItem((prev) => ({ ...prev, [property]: randomValue }));
  };

  const Name = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <SparkleInput
            data-cy="colleague-wizard-name-input"
            prop="name"
            value={newItem["name"]}
            onChange={handleInputChange("name")}
            onRandomValue={() => handleRandomValue("name")}
            multiline={""}
          />
          <SelectAvatar
            handleEmojiSelect={handleEmojiSelect}
            avatarSrc={newItem.src}
            avatar={newItem?.avatar?.replace(/:/g, "")}
          />
        </div>

        <Divider />
        <div>
          <Typography variant="body2" gutterBottom textAlign={"center"}>
            Or choose one of the samples
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {sampleColleagues.map((colleague, index) => (
              <Card
                data-cy="sample-colleague"
                key={index}
                onClick={() => handleTemplateSelect(colleague)}
                sx={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  },
                }}
              >
                <CardActionArea>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "8px",
                      }}
                    >
                      <Iconify
                        icon={colleague.avatar}
                        width="20%"
                        height="20%"
                        style={{ objectFit: "contain" }}
                      />
                      <Typography variant="h6" component="div">
                        {colleague.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {colleague.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </div>
      </div>
    );
  };

  const Personality = () => {
    return (
      <SparkleInput
        data-cy="colleague-wizard-description-input"
        prop="description"
        onChange={handleInputChange("description")}
        onRandomValue={() => handleRandomValue("description")}
        value={newItem["description"]}
        multiline
        rows={11}
      />
    );
  };

  const handleEngineSelect = (engine) => {
    setNewItem((prevItem) => ({
      ...prevItem,
      aiEngineId: engine.id,
      engineName: engine.vendor,
    }));
    handleNext();
  };

  const StepPages = () => {
    switch (activeStep) {
      case 0:
        return Name();
      case 1:
        return Personality();
      case 2:
        return (
          <EnginesChart
            handleEngineSelect={handleEngineSelect}
            isWizardEngine={true}
            open={""}
            setOpen={""}
          />
        );
      case 3:
        return <ItemSummary newItem={newItem} />;
    }
  };
  return (
    <Dialog
      data-cy="colleague-dialog"
      fullWidth
      maxWidth={activeStep === 2 ? "xl" : "sm"}
      open={open}
      onClose={() => {
        onClose();
        setActiveStep(0);
      }}
    >
      <>
        <DialogTitle
          sx={{
            backgroundColor: (theme) => theme.palette.background.default,
          }}
        ></DialogTitle>
        <StepComponent
          activeStep={activeStep}
          steps={steps}
          stepExp={stepExp}
          handleNext={handleNext}
          handleBack={handleBack}
          handleSave={handleSave}
        >
          <DialogContent
            sx={{
              height: "100%",
              alignContent: "center",
              justifyContent: "center",
              backgroundColor: (theme) => theme.palette.background.default,
            }}
          >
            {StepPages()}
          </DialogContent>
        </StepComponent>
      </>
    </Dialog>
  );
}

export default ColleagueWizard;
