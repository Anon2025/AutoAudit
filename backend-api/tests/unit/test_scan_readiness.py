import httpx

from app.services.scan_readiness import extract_graph_error_detail


def test_extract_graph_error_detail_reads_graph_error_message():
    response = httpx.Response(
        403,
        json={"error": {"message": "Insufficient privileges."}},
    )

    assert extract_graph_error_detail(response) == "Insufficient privileges."


def test_extract_graph_error_detail_strips_graph_error_message():
    response = httpx.Response(
        403,
        json={"error": {"message": "  Missing permission.  "}},
    )

    assert extract_graph_error_detail(response) == "Missing permission."


def test_extract_graph_error_detail_reads_detail_message():
    response = httpx.Response(
        400,
        json={"detail": "Invalid tenant ID."},
    )

    assert extract_graph_error_detail(response) == "Invalid tenant ID."


def test_extract_graph_error_detail_ignores_non_dict_error_and_uses_detail():
    response = httpx.Response(
        400,
        json={"error": "bad request", "detail": "Request payload is invalid."},
    )

    assert extract_graph_error_detail(response) == "Request payload is invalid."


def test_extract_graph_error_detail_falls_back_to_text_for_non_json_response():
    response = httpx.Response(
        500,
        text="Internal server error",
    )

    assert extract_graph_error_detail(response) == "Internal server error"


def test_extract_graph_error_detail_returns_first_line_of_text_response():
    response = httpx.Response(
        500,
        text="Internal server error\nstack trace line",
    )

    assert extract_graph_error_detail(response) == "Internal server error"


def test_extract_graph_error_detail_falls_back_to_json_text_when_json_has_no_message():
    response = httpx.Response(
        500,
        json={},
    )

    assert extract_graph_error_detail(response) == "{}"

def test_extract_graph_error_detail_returns_none_for_blank_text_response():
    response = httpx.Response(
        500,
        text="   ",
    )

    assert extract_graph_error_detail(response) is None

