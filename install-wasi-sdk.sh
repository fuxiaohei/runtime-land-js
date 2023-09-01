#!/usr/bin/env bash

set -euo pipefail

curl --fail --location --silent https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/wasi-sdk-20.0-linux.tar.gz
tar -xzf wasi-sdk-20.0-linux.tar.gz
export QUICKJS_WASM_SYS_WASI_SDK_PATH=$(pwd)/wasi-sdk-20.0