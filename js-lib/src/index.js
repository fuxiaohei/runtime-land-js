require("fast-text-encoding");
require("url-polyfill");

import { Headers } from "headers-polyfill";
globalThis.Headers = Headers;

import Request from "./request";
globalThis.Request = Request;

import Response from "./response";
globalThis.Response = Response;

import {
    ReadableStream, ReadableStreamDefaultController, ReadableStreamDefaultReader, ReadableStreamBYOBReader, ReadableStreamBYOBRequest, ReadableByteStreamController,
    ByteLengthQueuingStrategy, CountQueuingStrategy,
    TransformStream, TransformStreamDefaultController,
    WritableStream, WritableStreamDefaultController, WritableStreamDefaultWriter
} from "web-streams-polyfill/ponyfill";
globalThis.ReadableStream = ReadableStream;
globalThis.ReadableStreamDefaultController = ReadableStreamDefaultController;
globalThis.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
globalThis.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
globalThis.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
globalThis.ReadableByteStreamController = ReadableByteStreamController;
globalThis.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
globalThis.CountQueuingStrategy = CountQueuingStrategy;
globalThis.TransformStream = TransformStream;
globalThis.TransformStreamDefaultController = TransformStreamDefaultController;
globalThis.WritableStream = WritableStream;
globalThis.WritableStreamDefaultController = WritableStreamDefaultController;
globalThis.WritableStreamDefaultWriter = WritableStreamDefaultWriter;

function isPromise(p) {
    return p && Object.prototype.toString.call(p) === "[object Promise]"
}

function responseWithPromise(promise) {
    promise.then(async response => {
        const headers = {};
        for (const entry of response.headers.entries()) {
            headers[entry[0]] = entry[1];
        }
        let output = {
            status: response.status,
            headers,
        }
        // if response has bodyHandle, pass it to output
        // else, read arrayBuffer and pass it to output
        if (response.bodyHandle) {
            output.body_handle = response.bodyHandle;
        } else {
            output.body = await response.arrayBuffer();
        }
        globalThis.globalResponse = output;
    }).catch(error => {
        let errorBytes = new TextEncoder().encode(error.toString() + "\n" + error.stack);
        globalThis.globalResponse = {
            status: 500,
            headers: {},
            body: errorBytes.buffer,
        };
    })
}

class FetchEvent {
    constructor(input) {
        this.name = "fetch";
        this.request = input;
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

function callHandler(input) {
    if (!globalThis.handler || typeof globalThis.handler.fetch !== "function") {
        throw new Error("No handler function defined");
    }
    const request = new Request(input.uri, {
        method: input.method,
        headers: input.headers || {},
        body_handle: input.body_handle,
    })
    let result = globalThis.handler.fetch(request);

    // if result is promise, set then and reject
    if (isPromise(result)) {
        responseWithPromise(result);
        return;
    }

    // if result is response, set response
    const response = result;
    const headers = {};
    for (const entry of response.headers.entries()) {
        headers[entry[0]] = entry[1];
    }
    globalThis.globalResponse = {
        status: response.status,
        statusText: response.statusText,
        headers,
        // body: await response.arrayBuffer(),
    };
}

globalThis.callHandler = callHandler;
globalThis.globalResponse = null;