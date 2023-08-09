require("fast-text-encoding");
require("url-polyfill");

import { Headers } from "headers-polyfill";
globalThis.Headers = Headers;

import Request from "./request";
globalThis.Request = Request;

function isPromise(p) {
    return p && Object.prototype.toString.call(p) === "[object Promise]"
}

function responseWithPromise(promise) {
    promise.then(async response => {
        const headers = {};
        for (const entry of response.headers.entries()) {
            headers[entry[0]] = entry[1];
        }
        globalThis.globalResponse = {
            status: response.status,
            headers,
            // body: await response.arrayBuffer(),
        };
    }).catch(error => {
        globalThis.globalResponse = {
            status: 500,
            headers: {},
            // body: error.toString(),
        };
    })
}

class FetchEvent {
    constructor(request) {
        this.name = "fetch";
        this.request = request;
    }
    async respondWith(result) {
        // if result is promise, set then and reject
        if (isPromise(result)) {
            responseWithPromise(result);
            return;
        }

        const response = result;
        const headers = {};
        for (const entry of response.headers.entries()) {
            headers[entry[0]] = entry[1];
        }
        globalThis.globalResponse = {
            status: response.status,
            headers,
            // body: await response.arrayBuffer(),
        };
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