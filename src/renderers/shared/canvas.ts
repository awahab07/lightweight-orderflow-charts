export function strokeHorizontalLine(
  context: CanvasRenderingContext2D,
  y: number,
  fromX: number,
  toX: number,
  color: string,
  lineWidth = 1,
): void {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(fromX, y);
  context.lineTo(toX, y);
  context.stroke();
  context.restore();
}

export function fillCenteredText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
): void {
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(text, x, y);
  context.restore();
}
