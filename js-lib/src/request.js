
class Request {
    #_bodyUsed = false;

    get bodyUsed() {
        return this.#_bodyUsed;
    }

    async text() {
        this.#_bodyUsed = true;
        let promise = new Promise((resolve, reject) => {
            resolve("Hello, from Request.text()!");
        });
        return promise;
    }
}

export default Request;