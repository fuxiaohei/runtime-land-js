import Body from "./body";

class Response {
    #_headers;
    #_status;
    #_statusText;
    #_ok;
    #_body;

    constructor(body, options) {
        console.log("---Response.constructor", body, JSON.stringify(options))
        this.#_headers = new Headers(options.headers || {});

        this.#_status = options.status === undefined ? 200 : options.status
        if (this.#_status < 200 || this.#_status > 599) {
            throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].")
        }
        this.#_ok = this.#_status >= 200 && this.#_status < 300
        this.#_statusText = options.statusText === undefined ? '' : '' + options.statusText
        this.#_body = body ? new Body(body) : null
    }

    get [Symbol.toStringTag]() {
        return 'Response';
    }

    get headers() {
        return this.#_headers;
    }

    get status() {
        console.log("---Response.status", this.#_status)
        return this.#_status;
    }

    get statusText() {
        return this.#_statusText;
    }

}

export default Response;