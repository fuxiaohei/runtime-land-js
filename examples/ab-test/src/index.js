export default {
    async fetch(req) {
        const url = new URL(req.url);
        const params = url.searchParams;

        if (params.get("test") == "v1") {
            return new Response("test v1", { status: 200 })
        }

        if (params.get("test") == "v2") {
            return new Response("test v2", { status: 200 })
        }

        return new Response("test v0", { status: 200 })
    },
};