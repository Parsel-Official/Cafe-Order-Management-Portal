export function formatToman(value: number) {
  return `${Math.round(value).toLocaleString("fa-IR")} تومان`;
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}
