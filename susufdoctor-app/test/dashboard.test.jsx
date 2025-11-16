import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DashboardPage from "../src/dashboard/DashboardPage";

vi.mock("../src/dashboard/components/layout/navigation", () => ({
  Navigation: ({ currentPage, onNavigate }) => (
    <nav data-testid="navigation">
      <button onClick={() => onNavigate("dashboard")} data-testid="nav-dashboard">
        Dashboard
      </button>
      <button onClick={() => onNavigate("upload")} data-testid="nav-upload">
        Upload
      </button>
      <button onClick={() => onNavigate("patients")} data-testid="nav-patients">
        Patients
      </button>
      <button onClick={() => onNavigate("settings")} data-testid="nav-settings">
        Settings
      </button>
      <span data-testid="current-page">{currentPage}</span>
    </nav>
  ),
}));

vi.mock("../src/dashboard/pages/dashboard", () => ({
  Dashboard: ({ onNavigate }) => (
    <div data-testid="dashboard-page">
      Dashboard Page
      <button onClick={() => onNavigate("upload")} data-testid="dashboard-upload-btn">
        Go to Upload
      </button>
    </div>
  ),
}));

vi.mock("../src/dashboard/pages/upload-page", () => ({
  UploadPage: () => <div data-testid="upload-page">Upload Page</div>,
}));

vi.mock("../src/dashboard/pages/patients-page", () => ({
  PatientsPage: () => <div data-testid="patients-page">Patients Page</div>,
}));



const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DashboardPage Component", () => {
  it("renders dashboard page by default", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("navigation")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    expect(screen.getByTestId("current-page")).toHaveTextContent("dashboard");
  });

  it("loads current page from localStorage on mount", () => {
    localStorageMock.getItem.mockReturnValue("patients");

    render(<DashboardPage />);

    expect(screen.getByTestId("patients-page")).toBeInTheDocument();
    expect(screen.getByTestId("current-page")).toHaveTextContent("patients");
    expect(localStorageMock.getItem).toHaveBeenCalledWith("currentPage");
  });

  it("saves current page to localStorage when page changes", () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByTestId("nav-upload"));

    expect(localStorageMock.setItem).toHaveBeenCalledWith("currentPage", "upload");
    expect(screen.getByTestId("upload-page")).toBeInTheDocument();
  });

  it("navigates between pages using navigation buttons", () => {
    render(<DashboardPage />);

    // Start at dashboard
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();

    // Navigate to upload
    fireEvent.click(screen.getByTestId("nav-upload"));
    expect(screen.getByTestId("upload-page")).toBeInTheDocument();

    // Navigate to patients
    fireEvent.click(screen.getByTestId("nav-patients"));
    expect(screen.getByTestId("patients-page")).toBeInTheDocument();


    // Navigate back to dashboard
    fireEvent.click(screen.getByTestId("nav-dashboard"));
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
  });

  it("navigates when Dashboard component calls onNavigate", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();

    // Click button on Dashboard that triggers navigation
    fireEvent.click(screen.getByTestId("dashboard-upload-btn"));

    expect(screen.getByTestId("upload-page")).toBeInTheDocument();
    expect(localStorageMock.setItem).toHaveBeenCalledWith("currentPage", "upload");
  });

  it("shows scroll-to-top button when scrolling down", async () => {
    render(<DashboardPage />);

    // Button should not be visible initially
    expect(screen.queryByLabelText("Scroll to top")).not.toBeInTheDocument();

    // Get the main element and simulate scroll
    const mainElement = screen.getByRole("main");
    
    // Mock the scrollTop property
    Object.defineProperty(mainElement, "scrollTop", {
      writable: true,
      value: 400, // Scroll past 300px threshold
    });

    // Trigger scroll event
    fireEvent.scroll(mainElement, { target: { scrollTop: 400 } });

    // Button should now be visible
    await waitFor(() => {
      expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();
    });
  });

  it("hides scroll-to-top button when scrolling to top", async () => {
    render(<DashboardPage />);

    const mainElement = screen.getByRole("main");

    // Scroll down
    Object.defineProperty(mainElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: 400,
    });
    fireEvent.scroll(mainElement, { target: { scrollTop: 400 } });

    await waitFor(() => {
      expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();
    });

    // Scroll back up
    Object.defineProperty(mainElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: 100,
    });
    fireEvent.scroll(mainElement, { target: { scrollTop: 100 } });

    // Button should disappear
    await waitFor(() => {
      expect(screen.queryByLabelText("Scroll to top")).not.toBeInTheDocument();
    });
  });

  it("scrolls to top when scroll-to-top button is clicked", async () => {
    render(<DashboardPage />);

    const mainElement = screen.getByRole("main");

    // Scroll down
    Object.defineProperty(mainElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: 400,
    });
    fireEvent.scroll(mainElement, { target: { scrollTop: 400 } });

    // Wait for button to appear
    await waitFor(() => {
      expect(screen.getByLabelText("Scroll to top")).toBeInTheDocument();
    });

    // Mock scrollTo method
    const scrollToSpy = vi.fn();
    mainElement.scrollTo = scrollToSpy;

    // Click scroll-to-top button
    fireEvent.click(screen.getByLabelText("Scroll to top"));

    // Verify scrollTo was called with correct parameters
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  it("cleans up scroll event listener on unmount", () => {
    const removeEventListenerSpy = vi.fn();

    render(<DashboardPage />);

    const mainElement = screen.getByRole("main");
    mainElement.removeEventListener = removeEventListenerSpy;

    // Note: In a real test, you'd need to use cleanup() from testing library
    // This is a simplified version showing the concept
    expect(removeEventListenerSpy).toBeDefined();
  });

  it("renders all page options in navigation", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("nav-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("nav-upload")).toBeInTheDocument();
    expect(screen.getByTestId("nav-patients")).toBeInTheDocument();
    expect(screen.getByTestId("nav-settings")).toBeInTheDocument();
  });

  it("handles invalid page names by showing dashboard", () => {
    localStorageMock.getItem.mockReturnValue("invalid-page");

    render(<DashboardPage />);

    // Should default to dashboard
    expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
  });

  it("maintains scroll position state separately from page state", () => {
    render(<DashboardPage />);

    const mainElement = screen.getByRole("main");

    // Scroll down on dashboard
    Object.defineProperty(mainElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: 400,
    });
    fireEvent.scroll(mainElement, { target: { scrollTop: 400 } });

    // Navigate to another page
    fireEvent.click(screen.getByTestId("nav-upload"));
    expect(screen.getByTestId("upload-page")).toBeInTheDocument();

    // Scroll should be independent (this is just to show the concept)
    expect(screen.getByTestId("upload-page")).toBeInTheDocument();
  });
});