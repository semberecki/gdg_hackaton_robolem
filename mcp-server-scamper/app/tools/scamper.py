import json
from typing import Any


def _response(
    *,
    letter: str,
    name: str,
    problem: str,
    solution: str,
    directive: str,
    focus_questions: list[str],
    modified_solution: str,
) -> str:
    payload: dict[str, Any] = {
        "ok": True,
        "type": "scamper_transformation",
        "letter": letter,
        "name": name,
        "input": {
            "problem": problem,
            "solution": solution,
        },
        "modified_solution": modified_solution,
        "directive": directive,
        "focus_questions": focus_questions,
    }
    return json.dumps(payload, ensure_ascii=False)


def scamper_substitute(problem: str, solution: str) -> str:
    """Apply SCAMPER Substitute to a concrete solution for a problem."""
    return _response(
        letter="S",
        name="Substitute",
        problem=problem,
        solution=solution,
        directive="Replace one critical component, dependency, actor, interface, or resource with a simpler or more robust alternative.",
        focus_questions=[
            "What expensive, slow, fragile, or overloaded element can be replaced?",
            "Can a synchronous dependency be substituted with an asynchronous one?",
            "Can a manual or model-driven step be replaced with a deterministic rule?",
        ],
        modified_solution=(
            "Substitute the weakest or most costly part of the proposed solution with an alternative "
            "that preserves the intent while reducing the pressure on the current design: "
            f"{solution}"
        ),
    )


def scamper_combine(problem: str, solution: str) -> str:
    """Apply SCAMPER Combine to a concrete solution for a problem."""
    return _response(
        letter="C",
        name="Combine",
        problem=problem,
        solution=solution,
        directive="Merge compatible steps, services, data flows, or decisions so one mechanism solves multiple concerns.",
        focus_questions=[
            "Which two steps always happen together and can be merged?",
            "Can validation, enrichment, and routing share the same pass over the data?",
            "Can two services expose one contract while keeping internals separate?",
        ],
        modified_solution=(
            "Combine adjacent or duplicated mechanisms in the proposed solution so the same structure "
            "handles multiple responsibilities without adding another independent moving part: "
            f"{solution}"
        ),
    )


def scamper_adapt(problem: str, solution: str) -> str:
    """Apply SCAMPER Adapt to a concrete solution for a problem."""
    return _response(
        letter="A",
        name="Adapt",
        problem=problem,
        solution=solution,
        directive="Borrow a pattern from another context and adapt it to the current problem.",
        focus_questions=[
            "Where has this tradeoff already been solved in another system?",
            "Can a queue, cache, circuit breaker, saga, or staged rollout pattern fit here?",
            "Can the input be mapped to an existing architecture pattern?",
        ],
        modified_solution=(
            "Adapt a proven pattern from a neighboring domain and apply it to the input solution "
            "instead of inventing a custom mechanism from scratch: "
            f"{solution}"
        ),
    )


def scamper_modify(problem: str, solution: str) -> str:
    """Apply SCAMPER Modify to a concrete solution for a problem."""
    return _response(
        letter="M",
        name="Modify",
        problem=problem,
        solution=solution,
        directive="Change scale, timing, granularity, batching, thresholds, or representation to improve the solution.",
        focus_questions=[
            "Can the operation be made smaller, larger, earlier, later, batched, or streamed?",
            "Can data granularity or precision be changed without losing useful information?",
            "Can thresholds or resource limits be made adaptive?",
        ],
        modified_solution=(
            "Modify the scale, timing, or representation of the solution so the same idea creates less "
            "load, latency, coupling, or information loss: "
            f"{solution}"
        ),
    )


def scamper_put_to_another_use(problem: str, solution: str) -> str:
    """Apply SCAMPER Put to another use to a concrete solution for a problem."""
    return _response(
        letter="P",
        name="Put to another use",
        problem=problem,
        solution=solution,
        directive="Reuse an existing artifact, signal, cache, event stream, index, or intermediate result for a second purpose.",
        focus_questions=[
            "What data or computation is already produced and can be reused?",
            "Can logs, traces, embeddings, events, or cached responses serve another step?",
            "Can the input become direct input to another method or UI explanation?",
        ],
        modified_solution=(
            "Reuse an existing byproduct of the solution as an input or control signal for another part "
            "of the system, reducing duplicate work: "
            f"{solution}"
        ),
    )


def scamper_eliminate(problem: str, solution: str) -> str:
    """Apply SCAMPER Eliminate to a concrete solution for a problem."""
    return _response(
        letter="E",
        name="Eliminate",
        problem=problem,
        solution=solution,
        directive="Remove unnecessary steps, state, dependencies, data fields, model calls, or coordination points.",
        focus_questions=[
            "Which step exists only because of an earlier design assumption?",
            "Can the solution avoid storing, moving, or transforming some data?",
            "Can a service boundary, model call, or approval step be removed?",
        ],
        modified_solution=(
            "Eliminate nonessential work or state from the proposed solution so the problem is "
            "reduced by having fewer things to coordinate, store, or protect: "
            f"{solution}"
        ),
    )


def scamper_reverse(problem: str, solution: str) -> str:
    """Apply SCAMPER Reverse/Rearrange to a concrete solution for a problem."""
    return _response(
        letter="R",
        name="Reverse/Rearrange",
        problem=problem,
        solution=solution,
        directive="Invert order, ownership, control flow, data flow, or responsibility placement.",
        focus_questions=[
            "Can the producer do work that the consumer currently performs?",
            "Can validation happen before generation instead of after?",
            "Can pull become push, sync become async, or central orchestration become local policy?",
        ],
        modified_solution=(
            "Reverse or rearrange the flow of the proposed solution so the hard part happens at a more "
            "natural point in the system: "
            f"{solution}"
        ),
    )
