import assert from "node:assert/strict";
import test from "node:test";
import { getPixelBlockCoordinates, paintPixelBlock, type PixelGrid } from "./pixel-editor-store.ts";

const SIZES = [1, 2, 4, 8, 16];

test("paintPixelBlock changes exactly the addressed editing block for every supported size", () => {
  for (const pixelSize of SIZES) {
    const grid: PixelGrid = [["#111111", "#222222"], ["#333333", "#444444"]];
    const next = paintPixelBlock(grid, 1, 0, "#F0F0F0");

    assert.equal(next[1][0], "#F0F0F0", `${pixelSize}px block should be painted`);
    assert.deepEqual(next[0], grid[0]);
    assert.equal(next[1][1], grid[1][1]);
  }
});

test("painting with the existing background colour still creates an explicit block update", () => {
  const grid: PixelGrid = [["#F0F0F0"]];
  const next = paintPixelBlock(grid, 0, 0, "#F0F0F0");

  assert.notStrictEqual(next, grid);
  assert.equal(next[0][0], "#F0F0F0");
});

test("logical coordinates address the correct block at edges and after display scaling", () => {
  for (const pixelSize of SIZES) {
    const gridWidth = 3;
    const gridHeight = 2;
    assert.deepEqual(getPixelBlockCoordinates(0, 0, pixelSize, gridWidth, gridHeight), { row: 0, col: 0 });
    assert.deepEqual(getPixelBlockCoordinates(pixelSize * 3 - 0.01, pixelSize * 2 - 0.01, pixelSize, gridWidth, gridHeight), { row: 1, col: 2 });

    const zoom = 2.5;
    const displayX = (pixelSize + pixelSize / 2) * zoom;
    const displayY = (pixelSize / 2) * zoom;
    assert.deepEqual(getPixelBlockCoordinates(displayX / zoom, displayY / zoom, pixelSize, gridWidth, gridHeight), { row: 0, col: 1 });
  }
});
