let req = new Request();

let caller = async () => {
    console.log("get:", req.bodyUsed)
    let resp = await req.text()
    console.log("get-2:", req.bodyUsed)
    console.log("resp", resp)
}

caller();