# Fowler Code Smell Baseline Reference

This reference documents the 12 Fowler code smells (_Refactoring_, Chapter 3) used as the baseline for the Standards axis during code reviews.

## Core Rules

1. **Repository Standards Override**: Documented repository rules (`CODING_STANDARDS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, `AGENTS.md`) always take precedence. If a repository explicitly endorses a pattern, suppress the smell.
2. **Always a Judgement Call**: Each smell is an actionable heuristic, not a rigid violation. Skip issues handled by automated linters, compilers, or formatters.
3. **Contextual Evaluation**: Focus on the diff and changed functions. Name the smell, explain why it degrades maintainability, and provide a concrete refactoring recommendation.

---

## The 12 Fowler Code Smells

### 1. Mysterious Name
- **What it is**: A function, variable, parameter, or type whose name fails to communicate its purpose, intent, or contents.
- **How to fix**: Rename it to reflect its role. If no clear, honest name emerges, the underlying design or responsibility is likely unfocused.

### 2. Duplicated Code
- **What it is**: The same or nearly identical logic structure appears in multiple locations within the change or between the change and existing code.
- **How to fix**: Extract the shared logic into a reusable helper, method, or utility function, and call it from all sites.

### 3. Feature Envy
- **What it is**: A method or function that accesses data or methods of another object/module more than its own.
- **How to fix**: Move the function or method closer to the data it operates on, or pass the necessary behavior into the target module.

### 4. Data Clumps
- **What it is**: The same group of 3 or more fields, variables, or parameters frequently travel together across function signatures.
- **How to fix**: Introduce a dedicated class, interface, or struct to encapsulate the grouped data into a cohesive domain concept.

### 5. Primitive Obsession
- **What it is**: Relying on basic primitives (`string`, `number`, `dict`, `int`) to represent rich domain concepts (e.g., currency, email, coordinates, phone numbers, state machines).
- **How to fix**: Introduce small value objects, branded types, or custom types with built-in validation and behavior.

### 6. Repeated Switches
- **What it is**: The same `switch` or `if/else` cascade checking the same type tag or enum repeats across multiple functions.
- **How to fix**: Replace with polymorphism, strategy pattern, or a lookup dictionary/map shared across the call sites.

### 7. Shotgun Surgery
- **What it is**: A single conceptual change requires making numerous small, scattered modifications across many different files and classes.
- **How to fix**: Consolidate the related responsibilities into a single cohesive module or class so future changes happen in one place.

### 8. Divergent Change
- **What it is**: A single class or module is repeatedly modified for multiple unrelated reasons (violating the Single Responsibility Principle).
- **How to fix**: Split the module into distinct classes or components, each responsible for only one aspect of the system.

### 9. Speculative Generality
- **What it is**: Unused abstractions, excessive hooks, generic parameters, or fallback mechanisms created for speculative future requirements.
- **How to fix**: Apply YAGNI (You Aren't Gonna Need It). Remove the speculative abstractions and inline the code to what the current spec requires.

### 10. Message Chains
- **What it is**: Long chains of object navigation (`a.getB().getC().getD().doSomething()`), exposing the internal structure of dependencies.
- **How to fix**: Apply the Law of Demeter. Hide the navigation behind a delegate method on the immediate object (`a.doSomething()`).

### 11. Middle Man
- **What it is**: A class or function that does little other than delegate calls to another class without adding meaningful logic.
- **How to fix**: Remove the middle man and allow the caller to communicate directly with the target service or object.

### 12. Refused Bequest
- **What it is**: A subclass or implementation that ignores, overrides with empty stubs, or throws exceptions for most methods inherited from its parent.
- **How to fix**: Replace inheritance with composition. Extract the shared behavior into a separate component and inject it.
