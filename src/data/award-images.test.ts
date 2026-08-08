import { describe, expect, it } from "vitest";
import { AWARD_IMAGES } from "./award-images";

describe("AWARD_IMAGES", () => {
  it("copre tutti e 3 gli AwardType", () => {
    expect(Object.keys(AWARD_IMAGES).sort()).toEqual(
      ["ballon-dor", "player-of-the-season", "top-scorer"].sort()
    );
  });

  it("ogni URL è un hotlink https a Wikimedia Commons o Twemoji", () => {
    for (const url of Object.values(AWARD_IMAGES)) {
      expect(url).toMatch(/^https:\/\/(upload\.wikimedia\.org|cdn\.jsdelivr\.net)\//);
    }
  });
});
