const fs=require("fs"); 
let f="./feederBot.cjs"; 
let text=fs.readFileSync(f, "utf8"); 
let pIdx = text.indexOf('"name": "pendingOrders"'); 
if(pIdx === -1) { console.log("pendingOrders not found"); process.exit(); } 
let oIdx = text.indexOf('"name": "orderType"', pIdx); 
let insertStr = "      {\n        \"internalType\": \"uint256\",\n        \"name\": \"acceptablePrice\",\n        \"type\": \"uint256\"\n      },\n"; 
let checkBlock = text.substring(pIdx, oIdx); 
if(checkBlock.includes("acceptablePrice")){ 
  console.log("ABI sudah update!"); 
} else { 
  let injectionPoint = text.lastIndexOf("      {", oIdx); 
  text = text.substring(0, injectionPoint) + insertStr + text.substring(injectionPoint); 
  fs.writeFileSync(f, text); 
  console.log("? FEEDERBOT.CJS BERHASIL DIPATCH!"); 
}
