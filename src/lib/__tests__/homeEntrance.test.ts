import {
    markHomeEntrancePresent,
    shouldPresentHomeEntrance,
} from "@/lib/homeEntrance";
import { describe, expect, it } from "@jest/globals";

describe("Home entrance state", () => {
  it("presents only on the first mount in the app session", () => {
    expect(shouldPresentHomeEntrance()).toBe(true);

    markHomeEntrancePresent();

    expect(shouldPresentHomeEntrance()).toBe(false);
    markHomeEntrancePresent();
    expect(shouldPresentHomeEntrance()).toBe(false);
  });
});
