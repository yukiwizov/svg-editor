"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = __importDefault(require("node:test"));
const strict_1 = __importDefault(require("node:assert/strict"));
const svgParser_1 = require("../svgParser");
(0, node_test_1.default)("parses nested svg outline with ids and line numbers", () => {
    const svg = `<svg width="800" height="600">
  <g id="flowchart">
    <rect id="start" x="20" y="20" width="120" height="60" />
    <g id="nested">
      <text x="30" y="50">Hello</text>
    </g>
  </g>
</svg>`;
    const tree = (0, svgParser_1.parseSvgOutline)(svg);
    strict_1.default.equal(tree.length, 1);
    strict_1.default.equal(tree[0].label, "svg");
    strict_1.default.equal(tree[0].children[0].label, "g#flowchart");
    strict_1.default.equal(tree[0].children[0].children[0].label, "rect#start");
    strict_1.default.equal(tree[0].children[0].children[0].startLine, 2);
});
(0, node_test_1.default)("returns empty array on incomplete xml without throwing", () => {
    strict_1.default.deepEqual((0, svgParser_1.parseSvgOutline)("<svg><g id='a'><rect"), []);
    strict_1.default.deepEqual((0, svgParser_1.parseSvgOutline)(""), []);
});
//# sourceMappingURL=parser.test.js.map