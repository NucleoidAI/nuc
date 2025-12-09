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
      name: "Alex Thompson",
      avatar: "mingcute:bank-card-line",
      src: `https://cdn.nucleoid.com/greycollar/avatars/2.jpg`,
      character: "Quick-Witted",
      title: "Engineer",
      role: "Software Engineer",
      aiEngineId: "289a3c9a-f23b-421a-ac6e-f14052a2d57c",
      engineName: "OpenAI",
      description:
        "Alex is a quick-witted software engineer who thrives on solving complex problems with innovative solutions.",
    },
    {
      name: "Sarah Chen",
      avatar: "ph:coffee-bean-duotone",
      src: `https://cdn.nucleoid.com/greycollar/avatars/5.jpg`,
      character: "Ambitious",
      title: "Scientist",
      role: "Data Scientist",
      aiEngineId: "d9c93323-3baf-4623-a96c-b85db99b4441",
      engineName: "Claude",
      description:
        "Sarah is an ambitious data scientist with a passion for uncovering insights from complex datasets to drive informed decision-making.",
    },
    {
      name: "Marcus Williams",
      avatar: "ph:fire-simple-duotone",
      src: `https://cdn.nucleoid.com/greycollar/avatars/8.jpg`,
      character: "Natural Leader",
      title: "Designer",
      role: "Product Manager",
      aiEngineId: "123a3c9a-b23b-421a-ac6e-f14052a2d57c",
      engineName: "DeepMind",
      description:
        "Marcus is a natural leader and product manager who excels at guiding cross-functional teams to deliver user-centric products that exceed expectations.",
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
    "Liam",
    "Olivia",
    "Noah",
    "Emma",
    "Ava",
    "Elijah",
    "Sophia",
    "James",
    "Isabella",
    "Mason",
  ];

  const descriptions = [
    "A dedicated professional with a passion for excellence.",
    "An innovative thinker who thrives on challenges.",
    "A team player committed to achieving collective goals.",
    "A creative individual with a knack for problem-solving.",
    "A detail-oriented expert focused on delivering quality results.",
  ];

  const characters = [
    "Brave",
    "Quick-Witted",
    "Mysterious",
    "Loyal Companion",
    "Charismatic",
    "Deep Thinker",
    "Strong-Willed",
    "Ambitious",
    "Free Spirit",
    "Natural Leader",
  ];
  const roles = [
    "Explores and discovers new scientific knowledge.",
    "Investigates and solves complex cases.",
    "Writes and reports news stories.",
    "Designs innovative and functional buildings.",
    "Creates delicious meals and culinary experiences.",
    "Educates and inspires students to achieve their potential.",
    "Develops solutions to technical challenges.",
    "Operates aircraft and ensures safe travel.",
    "Expresses creativity through visual or performing arts.",
    "Provides emergency medical care and assistance.",
  ];

  const titles = [
    "Scientist",
    "Detective",
    "Journalist",
    "Architect",
    "Chef",
    "Teacher",
    "Engineer",
    "Pilot",
    "Artist",
    "Paramedic",
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

  console.log("NewItem in ColleagueWizard:", newItem);

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
      case "character":
        randomValue = characters[Math.floor(Math.random() * characters.length)];
        break;
      case "role":
        randomValue = roles[Math.floor(Math.random() * roles.length)];
        break;
      case "description":
        randomValue =
          descriptions[Math.floor(Math.random() * descriptions.length)];
        break;
      case "title":
        randomValue = titles[Math.floor(Math.random() * titles.length)];
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
                      {colleague.role}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {colleague.character}
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
