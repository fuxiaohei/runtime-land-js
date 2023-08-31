use anyhow::Result;
use land_sdk::http::{fetch, Body, RequestOptions};
use quickjs_wasm_rs::{from_qjs_value, Deserializer, JSContextRef, JSValue, JSValueRef};
use serde::Deserialize;
use std::str::FromStr;

use crate::JsRequest;

fn read_body(context: &JSContextRef, _this: JSValueRef, args: &[JSValueRef]) -> Result<JSValue> {
    if args.len() != 1 {
        return Err(anyhow::anyhow!("read_body requires 1 argument"));
    }
    let body_handle = args[0].as_u32_unchecked();
    if body_handle == 0 {
        return Err(anyhow::anyhow!("read_body requires a valid body handle"));
    }
    let body = Body::from_handle(body_handle);
    let (value, ok) = body.read(0)?;
    let object = context.object_value()?;
    object.set_property("done", context.value_from_bool(ok)?)?;
    object.set_property("value", context.array_buffer_value(value.as_slice())?)?;
    from_qjs_value(object)
}

fn fetch_request(
    context: &JSContextRef,
    _this: JSValueRef,
    args: &[JSValueRef],
) -> Result<JSValue> {
    if args.len() != 1 {
        return Err(anyhow::anyhow!("fetch_request requires 1 argument"));
    }
    let deserializer = &mut Deserializer::from(args[0]);
    let js_request =
        JsRequest::deserialize(deserializer).expect("fetch_request deserialize failed");

    // convert js_request to sdk request
    let builder = http::Request::builder()
        .method(http::Method::from_str(&js_request.method.as_str())?)
        .uri(js_request.uri.clone());
    let request = if js_request.body_handle > 0 {
        builder.body(Body::from_handle(js_request.body_handle))?
    } else {
        builder.body(Body::from(js_request.body.unwrap().as_slice()))?
    };
    let response = fetch(request, RequestOptions::default())?;

    println!("fetch_request: {:?}", response);
    from_qjs_value(context.null_value()?)
}

pub fn register(context: &JSContextRef) -> Result<()> {
    let hostcall = context.object_value()?;
    hostcall.set_property("read_body", context.wrap_callback(read_body)?)?;
    hostcall.set_property("fetch_request", context.wrap_callback(fetch_request)?)?;
    context
        .global_object()?
        .set_property("hostcall", hostcall)?;
    Ok(())
}
