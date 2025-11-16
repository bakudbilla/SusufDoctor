import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Signup from "../src/components/Signup";
import { MemoryRouter } from "react-router-dom";

vi.mock("../src/assets/whatspecial.png", () => ({ default: "whatspecial.png" }));
vi.mock("../src/assets/radio.png", () => ({ default: "radio.png" }));
vi.mock("../src/assets/logo2.png", () => ({ default: "logo2.png" }));

vi.mock("../src/utils/Loader", () => ({
  __esModule: true,
  default: ({ text }) => <div data-testid="loader">{text}</div>,
}));

// Mock window.location
delete window.location;
window.location = { href: "" };

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

const renderWithRouter = (component) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Signup Component", () => {
  it("renders signup form fields", () => {
    renderWithRouter(<Signup />);
    expect(screen.getByPlaceholderText("First Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Last Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email Address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Medical License Number")).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    renderWithRouter(<Signup />);
    fireEvent.click(screen.getByText("Create Account"));
    
    expect(await screen.findByText("First name is required")).toBeInTheDocument();
    expect(screen.getByText("Last name is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.getByText("License number is required")).toBeInTheDocument();
  });

  it("toggles password visibility", () => {
    renderWithRouter(<Signup />);
    const passwordInput = screen.getByPlaceholderText("Password");
    
    const toggleBtn = passwordInput.parentElement.querySelector("button");
    
    expect(passwordInput).toHaveAttribute("type", "password");
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "text");
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  it("switches from signup to login mode", async () => {
    renderWithRouter(<Signup />);
    
    const toggleButtons = screen.getAllByRole("button");
    const modeToggle = toggleButtons.find(btn => {
      return btn.className.includes("rounded-full") && btn.className.includes("w-14");
    });
    
    fireEvent.click(modeToggle);
    
    await waitFor(() => {
      expect(screen.getByText("Welcome back, Radiologist")).toBeInTheDocument();
    });
    expect(screen.queryByPlaceholderText("First Name")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Medical License Number")).not.toBeInTheDocument();
  });

  it("submits signup data successfully", async () => {
    vi.spyOn(window, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Registered" }),
    });
    
    renderWithRouter(<Signup />);
    
    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Test1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("Medical License Number"), {
      target: { value: "12345" },
    });
    
    fireEvent.click(screen.getByText("Create Account"));
    
    await waitFor(() => {
      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });
  });

  it("shows API error message on failed signup", async () => {
    vi.spyOn(window, "fetch").mockResolvedValueOnce({
      ok: false,
      json: async () => ({ detail: "Email already registered" }),
    });
    
    renderWithRouter(<Signup />);
    
    fireEvent.change(screen.getByPlaceholderText("First Name"), {
      target: { value: "Awinpang" },
    });
    fireEvent.change(screen.getByPlaceholderText("Last Name"), {
      target: { value: "Bernice" },
    });
    fireEvent.change(screen.getByPlaceholderText("Email Address"), {
      target: { value: "awinpang@gmail.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Password"), {
      target: { value: "Test1234" },
    });
    fireEvent.change(screen.getByPlaceholderText("Medical License Number"), {
      target: { value: "56789" },
    });
    
    fireEvent.click(screen.getByText("Create Account"));
    
    await waitFor(() => {
      expect(screen.getByText("Email already registered")).toBeInTheDocument();
    });
  });
});