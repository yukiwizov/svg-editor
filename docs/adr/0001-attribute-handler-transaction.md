# ADR-001: AttributeHandler transaction and collision policy

- Status: Accepted
- Context: A plugin handler may partially mutate a shape and then throw. A single set must remain one undo unit and failed operations must not enter history.
- Decision: The first registered handler whose handles(shape, attribute) returns true wins. handles is a pure predicate. The handler supplies a memento through capture, performs the write through apply, and restores through restore. SetCommand restores the memento on thrown errors and non-success results; successful execution stores the same memento for undo.
- Consequences: Plugin registration order is significant and is preserved by both assembly modes. Handler implementations must make restore reliable and must not mutate during capture. A handler exception is an error; it never falls back to the Phase 1 whitelist.
