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
    #_bodyHandle = null;
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
                let f = new FormData()
                for (let [k, v] of body.entries()) {
                    f.append(k, v)
                }
                this.#_bodyFormData = f;
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
            this.#_bodyHandle = body_handle;
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

    #body_to_arraybuffer() {
        if (this.#_bodyBuffer) {
            return this.#_bodyBuffer;
        }
        if (this.#_bodyFormData) {
            let params = new URLSearchParams(this.#_bodyFormData);
            return new TextEncoder().encode(params.toString());
        }
        return new TextEncoder().encode(this.#_bodyText);
    }

    get stream() {
        // if stream is not created when constructor, we need use raw body to create stream
        if (!this.#_stream) {
            let arraybuffer = this.#body_to_arraybuffer();
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

    get bodyUsed() {
        return this.#_bodyUsed;
    }

    get bodyHandle() {
        return this.#_bodyHandle;
    }

    async #read_stream_full() {
        const chunks = [];
        let reader = this.#_stream.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks.push(value);
        }
        // Calculate the total length of the data and create a Uint8Array
        const totalLength = chunks.reduce((total, chunk) => total + chunk.length, 0);
        const uint8Array = new Uint8Array(totalLength);
        // Copy the data from chunks to the Uint8Array
        let offset = 0;
        for (const chunk of chunks) {
            uint8Array.set(chunk, offset);
            offset += chunk.length;
        }
        return uint8Array;
    }

    async arrayBuffer() {
        this.#_bodyUsed = true;
        if (this.#_stream) {
            return await this.#read_stream_full();
        }
        return this.#body_to_arraybuffer().buffer;
    }

    async text() {
        let arraybuffer = await this.arrayBuffer();
        return new TextDecoder().decode(arraybuffer);
    }

    async json() {
        let text = await this.text();
        return JSON.parse(text);
    }
}

export default Body;