/**
 * Minimal error boundary. Renders `fallback` if its subtree throws (e.g. a
 * device/runtime without a usable GL context for the 3D muscle model).
 */
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch() {
    // Swallow — the fallback UI is the recovery path.
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
