# ADR-002: Reject malformed Box SVG structure

- Status: Accepted
- Context: A Box is a semantic composite represented in SVG by a g[data-kind="box"] with two required children. Treating a malformed Box as a regular group can silently lose label/fill behavior.
- Decision: When the Box provider is loaded, import requires exactly two direct element children in order: rect#<id>-rect, then text#<id>-label. Missing, extra, wrong-type, or wrong-id children reject the read. When the Box provider is not loaded, the same markup is imported as an ordinary g.
- Consequences: The reader preserves the concrete Rect/TextShape instances, including text content and presentation attributes. This deliberately favors a clear read failure over a lossy downgrade when the Box plugin is active.
