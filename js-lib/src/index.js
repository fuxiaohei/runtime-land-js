require("fast-text-encoding");
require("url-polyfill");

import { Headers } from "headers-polyfill";
globalThis.Headers = Headers;

import Request from "./request";
globalThis.Request = Request;

import Response from "./response";
globalThis.Response = Response;

import fetch from "./fetch";
globalThis.fetch = fetch;

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
    } else {
        throw new Error("Handler function must return a promise");
    }
}

globalThis.callHandler = callHandler;
globalThis.globalResponse = null;