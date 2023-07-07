export const config = {
    runtime: 'edge',
};

export default (request) => {
    console.log('Hello from QuickJS Function!')
    return (`Hello, from ${request} I'm now a QuickJS Function!`);
};