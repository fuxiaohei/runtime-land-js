export const config = {
    runtime: 'edge',
};

export default {
    async fetch(request) {
        console.log('Hello from QuickJS Function!')
        return new Response(`Hello, from ${request} I'm now a QuickJS Function!`);
    }
}