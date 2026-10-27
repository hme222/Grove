// jsdom has no canvas. Components check for a drawing context and skip drawing without one.
HTMLCanvasElement.prototype.getContext = () => null;
