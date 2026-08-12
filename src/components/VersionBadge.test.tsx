import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { APP_VERSION, formatReleaseDate } from "@/constants/app-info";
import { VersionBadge } from "./VersionBadge";

describe("VersionBadge", () => {
  it("dovrebbe mostrare versione e data di rilascio", () => {
    render(<VersionBadge />);
    expect(screen.getByText(`v${APP_VERSION}`)).toBeInTheDocument();
    expect(screen.getByText(formatReleaseDate())).toBeInTheDocument();
    expect(
      screen.getByLabelText(`Versione ${APP_VERSION}, rilasciata il ${formatReleaseDate()}`),
    ).toBeInTheDocument();
  });
});
