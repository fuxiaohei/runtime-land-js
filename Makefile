.PHONY: release, build, js, js-prod, test

js:
	cd js-lib && npx rspack build --mode=development
	ls -l js-lib/dist/lib.js

js-prod:
	cd js-lib && npx rspack build --mode=production
	ls -l js-lib/dist/lib.js

build: js
	cargo build --target wasm32-wasi
	cp ./target/wasm32-wasi/debug/land_js.wasm ./land_js_sdk.wasm

release: js-prod
	cargo build --target wasm32-wasi --release
	cp ./target/wasm32-wasi/release/land_js.wasm ./land_js_sdk.wasm
	wasm-opt --strip-debug -o land_js_sdk.wasm land_js_sdk.wasm
