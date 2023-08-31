const NAME = "myExampleWorkersABTest";

export default {
    async fetch(req) {
        console.log("---url:",req.url);
        console.log("--xxx");
        const url = new URL(req.url);

        // Enable Passthrough to allow direct access to control and test routes.
        if (url.pathname.startsWith("/control") || url.pathname.startsWith("/test"))
            return new Response(url.pathname, { status: 200 })

        // Determine which group this requester is in.
        const cookie = req.headers.get("cookie");

        if (cookie && cookie.includes(`${NAME}=control`)) {
            url.pathname = "/control" + url.pathname;
        } else if (cookie && cookie.includes(`${NAME}=test`)) {
            url.pathname = "/test" + url.pathname;
        } else {
            // If there is no cookie, this is a new client. Choose a group and set the cookie.
            const group = Math.random() < 0.5 ? "test" : "control"; // 50/50 split
            if (group === "control") {
                url.pathname = "/control" + url.pathname;
            } else {
                url.pathname = "/test" + url.pathname;
            }
            // Reconstruct response to avoid immutability
            let res = await fetch(url);
            res = new Response(res.body, res);
            // Set cookie to enable persistent A/B sessions.
            res.headers.append("Set-Cookie", `${NAME}=${group}; path=/`);
            return res;
        }
        return fetch(url);
    },
};