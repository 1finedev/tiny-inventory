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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-md border border-red-200 max-w-lg">
            <h1 className="text-xl font-bold text-red-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-red-700 text-sm mb-4 font-mono break-words">
              {this.state.error.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try again
              </button>
              <Link
                to="/stores"
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Stores
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
