import React from 'react';
import LoadError from './LoadError';

// If a screen throws while drawing, say so and offer a way out instead of leaving a blank page.
// Tabs stay usable because the boundary sits inside the shell, around the page only.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error('Screen failed to draw', error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="px-4 py-8" data-testid="screen-crashed">
        <LoadError what={this.props.what || 'this screen'} onRetry={() => window.location.reload()} />
      </div>
    );
  }
}
