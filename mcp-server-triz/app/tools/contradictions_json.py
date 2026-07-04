import json
from typing import Any

from app.services.triz import get_store


def _serialize_principle(principle: Any) -> dict[str, Any]:
    return {
        "id": getattr(principle, "id", None),
        "name": getattr(principle, "name", None),
        "description": getattr(principle, "description", None),
        "rules": list(getattr(principle, "rules", None) or []),
        "hints": list(getattr(principle, "hints", None) or []),
        "examples": list(getattr(principle, "examples", None) or []),
    }


def _serialize_parameter(parameter: Any) -> dict[str, Any]:
    return {
        "id": getattr(parameter, "id", None),
        "name": getattr(parameter, "name", None),
        "description": getattr(parameter, "description", None),
        "examples": list(getattr(parameter, "examples", None) or []),
    }


def _json_response(payload: dict[str, Any]) -> str:
    return json.dumps(payload, ensure_ascii=False)


def browse_contradiction_matrix(
    improving_params: list[int], preserving_params: list[int]
) -> str:
    """Look up Inventive Principles from the TRIZ contradiction matrix for given parameter IDs."""
    try:
        store = get_store()
        principles = store.get_principles_from_matrix(
            improving_parameters=improving_params,
            preserving_parameters=preserving_params,
        )
        return _json_response({
            "ok": True,
            "type": "triz_contradiction_matrix_lookup",
            "input": {
                "improving_params": improving_params,
                "preserving_params": preserving_params,
            },
            "principles": [_serialize_principle(principle) for principle in principles],
            "count": len(principles),
        })
    except Exception as error:
        return _json_response({
            "ok": False,
            "type": "triz_contradiction_matrix_lookup",
            "input": {
                "improving_params": improving_params,
                "preserving_params": preserving_params,
            },
            "error": str(error),
        })


def search_parameter(query: str, limit: int = 5) -> str:
    """Search TRIZ engineering parameters by semantic similarity to a query string."""
    try:
        store = get_store()
        parameters = store.search_parameters(query, top_k=limit)
        return _json_response({
            "ok": True,
            "type": "triz_parameter_search",
            "query": query,
            "limit": limit,
            "parameters": [_serialize_parameter(parameter) for parameter in parameters],
            "count": len(parameters),
        })
    except Exception as error:
        return _json_response({
            "ok": False,
            "type": "triz_parameter_search",
            "query": query,
            "limit": limit,
            "error": str(error),
        })


def search_principle(query: str, limit: int = 5) -> str:
    """Search TRIZ Inventive Principles by semantic similarity to a query string."""
    try:
        store = get_store()
        principles = store.search_principles(query, top_k=limit)
        return _json_response({
            "ok": True,
            "type": "triz_principle_search",
            "query": query,
            "limit": limit,
            "principles": [_serialize_principle(principle) for principle in principles],
            "count": len(principles),
        })
    except Exception as error:
        return _json_response({
            "ok": False,
            "type": "triz_principle_search",
            "query": query,
            "limit": limit,
            "error": str(error),
        })


def get_random_principles(limit: int = 5) -> str:
    """Return a random selection of TRIZ Inventive Principles."""
    try:
        store = get_store()
        principles = store.get_random_principles(count=limit)
        return _json_response({
            "ok": True,
            "type": "triz_random_principles",
            "limit": limit,
            "principles": [_serialize_principle(principle) for principle in principles],
            "count": len(principles),
        })
    except Exception as error:
        return _json_response({
            "ok": False,
            "type": "triz_random_principles",
            "limit": limit,
            "error": str(error),
        })


def get_principle_by_id(principle_id: int) -> str:
    """Retrieve a TRIZ Inventive Principle by its numeric ID."""
    try:
        store = get_store()
        principle = store.get_principle_by_id(principle_id)
        return _json_response({
            "ok": True,
            "type": "triz_principle",
            "principle": _serialize_principle(principle),
        })
    except Exception as error:
        return _json_response({
            "ok": False,
            "type": "triz_principle",
            "principle_id": principle_id,
            "error": str(error),
        })


def get_parameter_by_id(parameter_id: int) -> str:
    """Retrieve a TRIZ engineering parameter by its numeric ID."""
    try:
        store = get_store()
        parameter = store.get_parameter_by_id(parameter_id)
        return _json_response({
            "ok": True,
            "type": "triz_parameter",
            "parameter": _serialize_parameter(parameter),
        })
    except Exception as error:
        return _json_response({
            "ok": False,
            "type": "triz_parameter",
            "parameter_id": parameter_id,
            "error": str(error),
        })
