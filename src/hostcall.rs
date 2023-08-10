use anyhow::Result;
use land_sdk::http::Body;
use quickjs_wasm_rs::{from_qjs_value, JSContextRef, JSValue, JSValueRef};

pub fn read_body(
    context: &JSContextRef,
    _this: JSValueRef,
    args: &[JSValueRef],
) -> Result<JSValue> {
    if args.len() != 1 {
        return Err(anyhow::anyhow!("read_body requires 1 argument"));
    }
    let body_handle = args[0].as_u32_unchecked();
    if body_handle == 0 {
        return Err(anyhow::anyhow!("read_body requires a valid body handle"));
    }
    let body = Body::new(body_handle);
    let (value, ok) = body.read(0)?;
    let object = context.object_value()?;
    object.set_property("done", context.value_from_bool(ok)?)?;
    object.set_property("value", context.array_buffer_value(value.as_slice())?)?;
    from_qjs_value(object)
}
