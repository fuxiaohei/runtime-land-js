import { ReadableStream } from "web-streams-polyfill/ponyfill";

function isDataView(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj)
}

var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Uint8ClampedArray]',
    '[object Int16Array]',
    '[object Uint16Array]',
    '[object Int32Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]'
]

var isArrayBufferView =
    ArrayBuffer.isView ||
    function (obj) {
        return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1
    }

class Body {
    #_nobody = false;
    #_bodyUsed = false;

    #_bodyText = "";
    #_bodyFormData = "";
    #_bodyBuffer = null;

    #_stream = null;

    constructor(body, body_handle) {
        if (body) {
            if (typeof body === "string") {
                this.#_bodyText = body;
            } else if (body instanceof FormData) {
                // copy body to new FormData
                /*let f = new FormData()
                for (let [k, v] of body.entries()) {
                    f.append(k, v)
                }*/
                this.#_bodyFormData = body;
            } else if (body instanceof URLSearchParams) {
                this.#_bodyText = body.toString();
            } else if (body instanceof ArrayBuffer || isArrayBufferView(body)) {
                this.#_bodyBuffer = body;
            } else {
                this.#_bodyText = String(body);
            }
            return;
        }

        if (body_handle) {
            // if body_handle, need create ReadableStream to read body by host calls
            let that = this;
            this.#_stream = new ReadableStream({
                async pull(controller) {
                    that.#_bodyUsed = true;
                    let { value, done } = hostcall.read_body(body_handle);
                    if (done) {
                        controller.close();
                        return;
                    }
                    value = new Uint8Array(value);
                    controller.enqueue(value);
                }
            })
            return;
        }

        this.#_nobody = true;
        this.#_bodyText = "";
    }

    #_body_to_arraybuffer() {
        if (this.#_bodyBuffer) {
            return this.#_bodyBuffer;
        }
        if (this.#_bodyFormData) {
            let params = new URLSearchParams(this.#_bodyFormData);
            return new TextEncoder().encode(params.toString());
        }
        return new TextEncoder().encode(this.#_bodyText);
    }

    get readable_stream() {
        // if stream is not created when constructor, we need use raw body to create stream
        if (!this.#_stream) {
            let arraybuffer = this.#_body_to_arraybuffer();
            this.#_stream = new ReadableStream({
                async pull(controller) {
                    let value = new Uint8Array(arraybuffer);
                    controller.enqueue(value);
                    controller.close();
                }
            })
        }
        return this.#_stream;
    }

    async text() {
        this.#_bodyUsed = true;
        let promise = new Promise((resolve, reject) => {
            resolve("Hello, from Request.text()!");
        });
        return promise;
    }

    async arrayBuffer() {
        this.#_bodyUsed = true;
        let promise = new Promise((resolve, reject) => {
            let value = new TextEncoder().encode("Hello, from Request.arrayBuffer()!");
            resolve(value);
        });
        return promise;
    }
}

export default Body;