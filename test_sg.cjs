const fetch = require('node-fetch') || globalThis.fetch;

async function test() {
    const query = `
      {
        orders(where: { isActive: true }, first: 1000) {
          orderId
          orderType
          triggerPrice
          isLong
          twapSlices
          twapInterval
          twapExecuted
          twapLastExec
          pairId
        }
        positions(where: { isOpen: true }, first: 1000) {
          positionId
          pairId
          isLong
          liquidationPrice
          tpPrice
          slPrice
        }
      }
    `;

    const sgResponse = await fetch('https://api.goldsky.com/api/public/project_cmq6wbchslca901xaekhtfer7/subgraphs/confidentialdex/108/gn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    
    console.log(await sgResponse.text());
}
test();
