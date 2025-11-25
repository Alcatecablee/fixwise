export const formatText = (text: string) => {
  // [NeuroLint] Removed console.log: "Formatting text..."
  return text.replace(/&/g, "&");
};