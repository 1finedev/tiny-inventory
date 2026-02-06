import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ background: "var(--noir-void)" }}
        >
          <div
            className="p-8 rounded-xl max-w-lg border shadow-lg"
            style={{
              background: "var(--noir-surface)",
              borderColor: "var(--noir-border)",
              boxShadow: "var(--shadow-elevated)",
            }}
          >
            <h1
              className="text-xl font-bold mb-2 font-display"
              style={{ color: "var(--noir-bright)" }}
            >
              Something went wrong
            </h1>
            <p
              className="text-sm mb-6 font-mono break-words"
              style={{ color: "var(--status-danger)" }}
            >
              {this.state.error.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="btn btn-primary"
              >
                Try again
              </button>
              <Link to="/dashboard" className="btn btn-ghost">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
