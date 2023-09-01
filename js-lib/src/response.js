import Body from "./body";

class Response {
    #_headers;
    #_status;
    #_statusText;
    #_ok;
    #_body;

    constructor(body, options) {
        options = options || {}
        this.#_headers = new Headers(options.headers || {});
        this.#_status = options.status === undefined ? 200 : options.status
        if (this.#_status < 200 || this.#_status > 599) {
            throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].")
        }
        this.#_ok = this.#_status >= 200 && this.#_status < 300
        this.#_statusText = options.statusText === undefined ? '' : '' + options.statusText
        if (options.body_handle) {
            this.#_body = new Body(null, options.body_handle);
            return;
        }
        this.#_body = new Body(body);
    }

    get [Symbol.toStringTag]() {
        return 'Response';
    }

    get headers() {
        return this.#_headers;
    }

    get status() {
        return this.#_status;
    }

    get statusText() {
        return this.#_statusText;
    }

    get bodyHandle() {
        return this.#_body.bodyHandle;
    }

    get body() {
        return this.#_body.stream;
    }

    get bodyUsed() {
        return this.#_body.bodyUsed;
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

    static redirect(url, status) {
        status = status || 302
        if (status < 300 || status > 399) {
            throw new RangeError("Failed to execute 'redirect' on 'Response': Invalid status code")
        }
        return new Response(null, {
            status: status,
            headers: {
                "Location": url,
            },
        })
    }

}

export default Response;