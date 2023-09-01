export default {
    async fetch(req) {

        async function get_ip_geo(ip) {
            const url = "http://ip-api.com/json/" + ip;
            let response = await fetch(url);
            return await response.json();
        }

        const values = await Promise.all([get_ip_geo("1.1.1.1"), get_ip_geo("8.8.8.8")]);

        const init = {
            headers: {
                "content-type": "application/json;charset=UTF-8",
            },
        };
        return new Response(JSON.stringify(values), init)
    },
};