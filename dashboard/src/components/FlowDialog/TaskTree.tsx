import { Flow } from "@canmingir/link/platform/components";
import { buildTimelineGraph } from "./helper";
import { taskChartPlugin } from "./TaskChartPlugin";

import { Box, Dialog, DialogContent, DialogTitle, Grid } from "@mui/material";

const TaskTree = ({ open, setOpen, treeData }) => {
  const data = buildTimelineGraph(treeData);

  return (
    <Dialog
      open={open}
      onClose={() => {
        setOpen(false);
      }}
      fullWidth
      maxWidth="sm"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          textAlign: "center",
        }}
      >
        {`Task Flow`}
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          padding: "2rem",
          backgroundColor: (theme) => theme.palette.background.default,
        }}
      >
        <Grid item xs={12} md={5}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Flow
              data={data}
              style={{
                visible: true,
                delay: 0,
                isLoading: false,
                connectorType: "default",
              }}
              plugin={taskChartPlugin}
            />
          </Box>
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default TaskTree;
