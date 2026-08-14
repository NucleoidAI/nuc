const styles = {
  largeButton: {
    height: "100%",
    width: "120%",
    minWidth: "15rem",
    minHeight: "17.7rem",
    borderRadius: "20px",
    marginLeft: "-10%",
    maxHeight: "",
  },
  wideButton: {
    height: "22rem",
    width: "255px",
    borderRadius: "",
    marginLeft: "",
  },
  default: {
    cursor: "pointer",
    boxShadow: 3,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    border: "1px solid",
    borderColor: "rgba(22, 28, 36, 0.5)",
    backgroundColor: "background.paper",
    transition: "none",
    color: "text.secondary",
    ":hover": {
      bgcolor: "text.disabled",
      color: "background.default",
    },
  },
};

export default styles;
