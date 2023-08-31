import Request from "./request";
import Response from "./response";

async function fetch(input, init) {
    let request = new Request(input, init)
    let headers = {}
    request.headers.forEach((value, key) => {
        headers[key] = String(value)
    })
    let body = await request.arrayBuffer()
    console.log("------body:", body);
    let request_input = {
        method: String(request.method),
        uri: request.url,
        headers: headers,
        body_handle: 0,
        body: body,
        id: 0,
    }
    console.log("----", input)
    let response = hostcall.fetch_request(request_input);
    console.log("---", response);
    return new Response("fetch-polyfill");
}

export default fetch;