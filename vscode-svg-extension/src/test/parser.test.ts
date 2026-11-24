import test from "node:test";
import assert from "node:assert/strict";
import { parseSvgOutline } from "../svgParser";

test("parses nested svg outline with ids and line numbers", () => {
  const svg = `<svg width="800" height="600">
  <g id="flowchart">
    <rect id="start" x="20" y="20" width="120" height="60" />
    <g id="nested">
      <text x="30" y="50">Hello</text>
    </g>
  </g>
</svg>`;
  const tree = parseSvgOutline(svg);
  assert.equal(tree.length, 1);
  assert.equal(tree[0].label, "svg");
  assert.equal(tree[0].children[0].label, "g#flowchart");
  assert.equal(tree[0].children[0].children[0].label, "rect#start");
  assert.equal(tree[0].children[0].children[0].startLine, 2);
});

test("returns empty array on incomplete xml without throwing", () => {
  assert.deepEqual(parseSvgOutline("<svg><g id='a'><rect"), []);
  assert.deepEqual(parseSvgOutline(""), []);
});