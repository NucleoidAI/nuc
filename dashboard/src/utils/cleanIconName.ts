export const cleanIconName = (icon?: string) => {
  if (!icon) return "";
  return icon.replace(/^:+|:+$/g, "");
};
