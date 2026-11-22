# Haskell Code Audit Guide

Comprehensive guidelines for reviewing Haskell codebases. Focuses on laziness, memory space leaks, total function guarantees, type-driven correctness, and concurrency safety.

---

## 1. Laziness & Space Leaks

### Accumulator Strictness
- 🔴 `[blocking]` **Lazy `foldl`**: Using `foldl` or lazy accumulator functions on lists or large streams builds an unbounded chain of unevaluated thunks, leading to stack overflow or memory exhaustion. Always use strict `foldl'` from `Data.List`.
- 🔴 `[blocking]` **Unforced State in State Monad**: Using the lazy `Control.Monad.Trans.State` instead of the strict variant `Control.Monad.Trans.State.Strict`. Ensure state record updates evaluate to WHNF with `modify'`.

### Record Fields & Bang Patterns
- 🟡 `[important]` **Lazy Data Fields**: Defining data types without strictness annotations on primitive/small fields (e.g., `data Counter = Counter Int` instead of `data Counter = Counter !Int`). Use `{-# LANGUAGE BangPatterns #-}` or `StrictData` where appropriate to prevent retaining unneeded thunks.

---

## 2. Totality & Partial Functions

### Banned Partial Functions
- 🔴 `[blocking]` **Runtime Exception Functions**: Calling partial functions from `Prelude` that throw runtime errors on empty or invalid inputs:
  - ❌ `head`, `tail`, `init`, `last` $\rightarrow$ Use pattern matching, `Data.List.NonEmpty`, or `uncons`.
  - ❌ `read` $\rightarrow$ Use `readMaybe` from `Text.Read`.
  - ❌ `fromJust` $\rightarrow$ Use `fromMaybe`, `maybe`, or monadic binding.
  - ❌ `(!!)` list indexing $\rightarrow$ Use safe lookup functions (`!?` or arrays/vectors).

---

## 3. Resource Management & IO Safety

### Unsafe Operations
- 🔴 `[blocking]` **`unsafePerformIO` / `unsafeCoerce`**: Using `unsafePerformIO` in library or business logic breaks compiler referential transparency and ordering guarantees. Any usage requires an explicit, audited mathematical proof and safety justification.
- 🔴 `[blocking]` **Resource Bracket Safety**: Allocating file descriptors, network connections, or database handles with manual open/close instead of `bracket` or `ResourceT`. Unhandled exceptions leak descriptors.

---

## 4. Concurrency & Monadic Architecture

### STM (Software Transactional Memory)
- 🟡 `[important]` **Indefinite Retry Loops**: In `atomically`, ensuring `retry` has reachable state changes from concurrent threads to avoid permanent worker lockups.
- 🔴 `[blocking]` **Mixing IO in STM**: Never bypass STM boundaries to execute side-effects inside transactions.

### Async Architecture
- 🟡 `[important]` **Supervised Async**: Using `async` threads without `wait`, `link`, or structured concurrency (`withAsync`). An unlinked async thread can silently fail without bubbling exceptions up to the supervisor.
