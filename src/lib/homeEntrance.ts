let hasPresented = false;

export function shouldPresentHomeEntrance(): boolean {
  return !hasPresented;
}

export function markHomeEntrancePresent(): void {
  hasPresented = true;
}
