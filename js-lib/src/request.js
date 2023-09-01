import Body from "./body";
import { normalizeMethod } from "./method";

class Request {
    #_bodyUsed = false;
    #_url;
    #_headers;
    #_method;
    #_body;

    constructor(input, options) {
        options = options || {}

        if (input instanceof Request) {
            if (input.bodyUsed) {
                throw new TypeError('Body already read')
            }
            this.#_url = input.url
            this.#_method = input.method
            this.#_headers = new Headers(input.headers)
        } else {
            this.#_url = String(input)
        }

        var body = options.body
        if (options.headers || !this.#_headers) {
            this.#_headers = new Headers(options.headers)
        }
        this.#_method = normalizeMethod(options.method || this.#_method || 'GET')

        if ((this.#_method === 'GET' || this.#_method === 'HEAD') && body) {
            throw new TypeError('Body not allowed for GET or HEAD requests')
        }

        this.#_body = new Body(body, options.body_handle);
    }

    get [Symbol.toStringTag]() {
        return 'Request';
    }

    get bodyUsed() {
        return this.#_body.bodyUsed;
    }

    get body() {
        return this.#_body.stream;
    }

    get url() {
        return this.#_url;
    }

    get method() {
        return this.#_method;
    }

    get headers() {
        return this.#_headers;
    }

    async arrayBuffer() {
        return await this.#_body.arrayBuffer();
    }

    async text() {
        return await this.#_body.text();
    }

    async json() {
        return await this.#_body.json();
    }

}

export default Request;