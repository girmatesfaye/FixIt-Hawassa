import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Modal from "../Modal";

describe("Modal", () => {
  it("does not render when closed", () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>,
    );

    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("renders title and content when open", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Test Modal">
        <p>Content</p>
      </Modal>,
    );

    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
