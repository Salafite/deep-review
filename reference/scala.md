# Scala 3 & Scala 2.13 Code Audit Guide

Comprehensive guidelines for auditing Scala codebases. Covers functional programming patterns, concurrency hazards, type safety, performance, and Cats-Effect / ZIO ecosystems.

---

## 1. Concurrency & Asynchronous Safety

### Thread Starvation in ExecutionContext
- 🔴 `[blocking]` **Blocking on Global ExecutionContext**: Executing blocking I/O (JDBC calls, synchronous HTTP requests, `Thread.sleep`) inside `scala.concurrent.ExecutionContext.Implicits.global`. This starves the thread pool and deadlocks CPU-bound asynchronous tasks.
  - *Fix*: Wrap blocking calls in `blocking { ... }` or dispatch to a dedicated, bounded thread pool.
- 🔴 `[blocking]` **`Await.result` in Production Code**: Calling `Await.result(future, timeout)` blocks the calling thread and undermines asynchronous architecture. Always chain with `flatMap`, `map`, or use monadic effects (`for`-comprehensions).

### Functional Effects (Cats-Effect / ZIO)
- 🔴 `[blocking]` **Unsafe Execution**: Calling `unsafeRunSync` or `unsafeRunAndForget` inside business logic or request handlers instead of at the edge of the world (`IOApp` / `ZIOAppDefault`).
- 🟡 `[important]` **Uncancellable Leaks**: Creating long-running fibers/tasks without ensuring cancellation cleanup (e.g., resource release with `Resource.make` or `ZIO.acquireRelease`).

---

## 2. Type Safety & Pattern Matching

### Pattern Matching Exhaustiveness
- 🔴 `[blocking]` **Unchecked Non-Exhaustive Matches**: Omitting cases on `sealed trait` or `enum` pattern matches without compiler `@nowarn` justification. Always handle all cases or provide an explicit fail-safe fallback.
- 🔴 `[blocking]` **Unsafe Casting**: Using `.asInstanceOf[T]` instead of type patterns, pattern matching, or typeclass constraints.

### Option & Either Disciplines
- 🔴 `[blocking]` **Calling `.get` on Option/Either**: Calling `option.get` or `either.toOption.get`. This introduces `NoSuchElementException`. Always use `getOrElse`, `fold`, or `for`-comprehensions.
- 🟡 `[important]` **Swallowing Fatal Errors**: Catching `Throwable` indiscriminately with `try { ... } catch { case t: Throwable => ... }`. This intercepts fatal JVM errors (`OutOfMemoryError`, `VirtualMachineError`). Always catch `NonFatal(e)`.

---

## 3. Performance & Memory Management

### Collections & Lazy Evaluation
- 🟡 `[important]` **Intermediate Collection Allocations**: Chaining multiple `.map.filter.map` operations on large collections. Use `.view` or `.iterator` to evaluate elements lazily in a single pass.
- 🟡 `[important]` **Case Class Copy Overhead**: In performance-critical hot loops, repeatedly invoking `.copy(...)` on large nested case classes triggers heavy heap allocations.
- 🟢 `[nit]` **Tail Recursion**: Ensure recursive functions are annotated with `@tailrec` so the compiler enforces tail-call elimination.

---

## 4. Implicits & Given Instances (Scala 2/3)

- 🟡 `[important]` **Implicit Resolution Ambiguity**: Overusing general-purpose implicit conversions (`import scala.language.implicitConversions`). Prefer extension methods (`extension` in Scala 3) or explicit wrappers.
- 🟢 `[nit]` **Given Instance Placement**: Keep `given` instances scoped to companion objects to maintain deterministic compiler search order and avoid wildcard import clutter.
