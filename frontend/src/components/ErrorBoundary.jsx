import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Something went wrong" };
  }

  componentDidCatch(error, info) {
    console.error("Codoverse crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell flex flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-3xl">⚠️</p>
          <p className="font-semibold">Something went wrong on this page</p>
          <p className="text-xs text-gray-500">{this.state.message}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, message: "" });
              window.location.href = "/";
            }}
            className="btn-primary"
          >
            Go to Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
