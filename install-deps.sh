#!/usr/bin/env bash

set -euo pipefail

echo "Installing WASI-SDK"
curl --fail --location --silent https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-20/wasi-sdk-20.0-linux.tar.gz --output wasi-sdk-20.0-linux.tar.gz
tar -xzf wasi-sdk-20.0-linux.tar.gz
export QUICKJS_WASM_SYS_WASI_SDK_PATH=$(pwd)/wasi-sdk-20.0

echo "Installing wizer"
curl --fail --location --silent https://github.com/bytecodealliance/wizer/releases/download/v3.0.1/wizer-v3.0.1-x86_64-linux.tar.xz --output wizer-v3.0.1-x86_64-linux.tar.xz
tar -xJf wizer-v3.0.1-x86_64-linux.tar.xz
export PATH=$(pwd)/wizer-v3.0.1-x86_64-linux:$PATH