# Runtime-land-js

JavaScript SDK for runtime.land webassemly runtime. It's based on [quickjs-wasm-rs](https://github.com/bytecodealliance/javy/tree/main/crates/quickjs-wasm-rs) on [Javy](https://github.com/bytecodealliance/javy) project.

This project provides a JavaScript runtime webassembly that embeds in runtime.land runtime. `land-cli` will use this runtime to run JavaScript code.

## Usage

Create a JavaScript project for runtime.land:

1. Create a `land.toml` file:

```toml
manifest = "v1"
name = "js-hello-world"
description = "example js project with hello world"
authors = []
language = "javascript"
```

2. Create entry file `src/index.js`:

```javascript
export default {
    async fetch(request) {
        return new Response(`Hello, Runtime.land JS SDK`);
    }
}
```

3. Use `land-cli` to build and deploy (run at `land.toml` directory):

```bash
# build js to wasm
land-cli build
# run this wasm locally
land-cli serve
# test this wasm
curl http://localhost:8080
```

## APIs

| API | Description | Details |
| --- | --- | --- |
| `fetch(request)` | Fetch a request and return a response. | --- |
| `Request` | Request object. | --- |
| `Response` | Response object. | --- |
| `Headers` | Headers object. | --- |
| `URL`, `URLSearchParams` | URL object. | --- |
| `atob`, `btoa` | Base64 encode/decode. | --- |
| `TextEncoder`, `TextDecoder` | Text encode/decode. | Only support utf-8 |
| `WebStreams` | WebStream object. | Experimental |

## Build

```bash
export QUICKJS_WASM_SYS_WASI_SDK_PATH=path/to/wasi-sdk
make release
```

[wasi-sdk-20.0](https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-20) is tested.

It outputs `land_js_sdk.wasm` in top directory. You can copy it to [land-worker](https://github.com/fuxiaohei/runtime-land/tree/main/crates/worker/engine). `land-cli` will embed it in binary when building.
