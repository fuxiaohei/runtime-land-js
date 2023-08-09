require("fast-text-encoding");
require("url-polyfill");

import { Headers } from "headers-polyfill";
globalThis.Headers = Headers;

import Request from "./request";
globalThis.Request = Request;

class FetchEvent {
    constructor(request) {
        this.name = "fetch";
        this.request = request;
    }
    async respondWith(result) {
        console.log("FetchEvent:respondWith", result)
    }
}

function callHandler(hostInput) {
    if (!globalThis.handler || typeof globalThis.handler.fetch !== "function") {
        throw new Error("No handler function defined");
    }
    const event = new FetchEvent(hostInput);
    return globalThis.handler.fetch(event);
}

globalThis.callHandler = callHandler;