// date => HH:mm
export const getTimeString = (now: Date) => {
  const nowHours = now.getHours().toString().padStart(2, "0");
  const nowMinutes = now.getMinutes().toString().padStart(2, "0");
  return `${nowHours}:${nowMinutes}`;
}