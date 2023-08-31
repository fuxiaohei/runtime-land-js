import Request from "./request";
import Response from "./response";

async function fetch(input, init) {
    init = init || {}
    let request = new Request(input, init)
    let headers = {}
    request.headers.forEach((value, key) => {
        headers[key] = String(value)
    })
    let body = await request.arrayBuffer()
    let request_input = {
        method: String(request.method),
        uri: request.url,
        headers: headers,
        body_handle: 0,
        body: body,
        id: 0,
    }
    let options = {
        timeout: init.timeout || 30,
        redirect: init.redirect || "follow",
    }
    let host_response = hostcall.fetch_request(request_input, options);
    if (host_response.body_handle) {
        return new Response(null, {
            status: host_response.status,
            headers: new Headers(host_response.headers),
            body_handle: host_response.body_handle,
        })
    }
    let response = new Response(host_response.body, {
        status: host_response.status,
        headers: new Headers(host_response.headers),
    })
    return response;
}

export default fetch;