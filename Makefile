.PHONY: release, build, js, js-prod, test

js:
	cd js-lib && npx rspack build --mode=development

js-prod:
	cd js-lib && npx rspack build --mode=production

build: js
	cargo build --target wasm32-wasi
	cp ./target/wasm32-wasi/debug/runtime_land_js.wasm ./runtime_land_js.wasm

release: js-prod
	cargo build --target wasm32-wasi --release
	cp ./target/wasm32-wasi/release/runtime_land_js.wasm ./runtime_land_js.wasm
	wasm-opt --strip-debug -o runtime_land_js.wasm runtime_land_js.wasm

test: release
	cat js-mock.js | MOCK=true wizer runtime_land_js.wasm -o runtime_land_js.wizer.wasm --allow-wasi --inherit-stdio=true --inherit-env=true --wasm-bulk-memory=true