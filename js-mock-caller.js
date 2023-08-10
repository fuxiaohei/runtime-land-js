
let data = 1;

let stream = new ReadableStream({
    async pull(controller) {
        console.log("---Body.pull", data)
        if (data > 5) {
            controller.close();
            return;
        }
        let value = new TextEncoder().encode("Hello, from Request.arrayBuffer()!" + data++);
        controller.enqueue(value);
    }
});

let reader = stream.getReader();

console.log("---stream", stream)